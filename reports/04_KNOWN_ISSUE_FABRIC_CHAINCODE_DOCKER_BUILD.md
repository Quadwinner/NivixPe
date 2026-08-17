# Known Issue: Fabric chaincode install fails on Docker Engine 29

**Status:** Resolved via Chaincode-as-a-Service (see [Resolution](#resolution))
**Date investigated / fixed:** 2026-08-18
**Affected component:** Hyperledger Fabric chaincode deployment (`nivix-kyc`, Go chaincode) on `fabric-samples/test-network`

## Symptom

`./network.sh deployCC -ccn nivix-kyc -ccp ./chaincode-nivix-kyc -ccl go` fails at the install step on every retry:

```
+ peer lifecycle chaincode install nivix-kyc.tar.gz
+ res=1
Error: chaincode install failed with status: 500 - failed to invoke backing implementation of
'InstallChaincode': could not build chaincode: docker build failed: docker image build failed:
write unix @->/run/docker.sock: write: broken pipe
Chaincode installation on peer0.org1 has failed
```

Packaging and Go vendoring succeed. Only the peer-side image build fails.

Downstream effect: the chaincode is never committed to the channel, so invokes fail with

```
Error: endorsement failure during invoke. response: status:500
message:"make sure the chaincode nivix-kyc has been successfully defined on channel mychannel
and try again: chaincode nivix-kyc not found"
```

Note that the startup script's own health check still prints `Chaincode: DEPLOYED`. That check is
wrong here and should not be trusted for this failure mode.

## Root cause

Docker Engine 29 raised the minimum supported Docker API version to **1.44**. The Fabric peer's
`dockercontroller` talks to the Docker socket with an older API version (1.24), so the daemon
rejects the request outright.

Confirmed directly against the socket:

```
$ curl --unix-socket /var/run/docker.sock http://localhost/v1.24/version
http=400
{"message":"client version 1.24 is too old. Minimum supported API version is 1.44,
please upgrade your client to a newer version"}

$ curl --unix-socket /var/run/docker.sock http://localhost/v1.44/version
http=200
```

The `broken pipe` wording is a side effect, not the cause: the daemon returns HTTP 400 and closes
the connection immediately, while the peer is still streaming the build-context tar. The peer's
write then fails, and `Build Output` is empty because the build never started.

Corroborating peer log (`docker logs peer0.org1.example.com`):

```
INFO [chaincode.externalbuilder.ccaas_builder] waitForExit -> ::Error: chaincode type not
     supported: golang command=detect
ERRO [dockercontroller] buildImage -> Error building image: write unix @->/run/docker.sock:
     write: broken pipe
ERRO [dockercontroller] buildImage -> Build Output:
```

The first line is expected: the `ccaas` external builder declines Go chaincode, so the peer falls
back to the Docker builder, which is the path that is broken.

## Environment

| Item | Value |
| --- | --- |
| Docker Engine | 29.1.3 |
| Docker API | 1.52 (minimum supported: **1.44**) |
| Storage driver | overlay2 |
| Fabric peer | v3.1.3 (`hyperledger/fabric-peer:latest`) |
| Host | Linux, cgroup v2, 14.88 GiB RAM |

## Ruled out

- **Missing `fabric-baseos` image.** The image was genuinely absent and was pulled during
  investigation (`hyperledger/fabric-baseos:3.1`, alongside the existing
  `hyperledger/fabric-ccenv:3.1`). Deployment still failed with the identical error, so this was
  not the cause. Both images are now present and will be needed once the build path works.
- **Fabric network health.** All peers, orderer, and CAs were up throughout.
- **Chaincode source or packaging.** Vendoring and `peer lifecycle chaincode package` both
  succeed; the package ID is computed normally.

## Open risk, separate from this issue

Root filesystem is at **97% (6.1 GB free of 191 GB)**. Not the cause of this failure, but chaincode
image builds and ledger growth need headroom. Worth clearing space before retrying.

## Resolution

`nivix-kyc` was converted to **Chaincode-as-a-Service (`ccaas`)**, the supported path on Fabric
v3.x. The chaincode image is now built by the **host** Docker CLI and the chaincode runs as its own
long-lived gRPC server that the peer dials. The peer never builds an image, so the rejected API
call no longer happens.

### Change made

`chaincode-nivix-kyc/nivix-kyc.go` — `main()` is now dual-mode. When `CHAINCODE_SERVER_ADDRESS` is
set it starts a `shim.ChaincodeServer` using `CHAINCODE_ID` (falling back to
`CORE_CHAINCODE_ID_NAME`) as the CCID, with TLS disabled to match what `deployCCAAS.sh` provides.
When the variable is absent it falls back to the original peer-managed `chaincode.Start()`, so the
legacy path still works on older Docker hosts.

This required importing `github.com/hyperledger/fabric-chaincode-go/shim`. That module was already
vendored and already marked `## explicit` in `vendor/modules.txt`, so no `go mod` changes or network
fetches were needed. The `Dockerfile` in the chaincode directory was already CCaaS-shaped and was
used as-is.

### Deploy command

Note that `-ccl go` is not used; the language flag is irrelevant because Docker performs the build.

```bash
cd nivix-project/fabric-samples/test-network
./network.sh deployCCAAS \
  -ccn nivix-kyc \
  -ccp ./chaincode-nivix-kyc \
  -ccv 1.0 \
  -cccg ./chaincode-nivix-kyc/collections_config.json
```

### Verified result

Committed on `mychannel` at version 1.0, sequence 1, approved by both orgs. Two chaincode server
containers run on the `fabric_test` network: `peer0org1_nivix-kyc_ccaas` and
`peer0org2_nivix-kyc_ccaas`, each listening on `0.0.0.0:9999`.

End-to-end `StoreKYC` invoke and `GetKYCStatus` query both succeed:

```
INVOKE  StoreKYC  -> committed with status (VALID) at localhost:7051 and localhost:9051
                     Chaincode invoke successful. result: status:200
QUERY   GetKYCStatus -> {"userId":"kiro-verify-user","kycVerified":true,"riskScore":3,
                         "countryCode":"IND", ...}
```

### Operational notes

The CCaaS containers are started with `docker run --rm`, so they do **not** survive a reboot or a
Docker restart, and they are not managed by the test-network compose files. `start-nivix.sh` now
recreates them on every run via `ensure_ccaas_containers`, reusing the installed package id, so a
plain `./start-nivix.sh` is enough after a power cycle.

If the chaincode source changes, rebuild the image and restart both containers. A new chaincode
version or sequence is only needed when the contract's external behaviour changes.

## Related fixes applied at the same time

Three further defects were found while verifying the KYC path end to end. All are fixed.

**1. `start-nivix.sh` wiped the ledger on every startup.** It ran `./network.sh down` unconditionally
before bringing the network up, which deletes the ledger and therefore every committed KYC record. It
also still used `deployCC` (the broken Docker-builder path) and never started the CCaaS containers.
The script now reuses a healthy network, skips the deploy when the definition is already committed,
and only tears down when explicitly asked:

```bash
FORCE_RESET=true ./start-nivix.sh   # deliberate wipe, deletes the ledger
./start-nivix.sh                    # default: non-destructive, ledger preserved
```

**2. The startup summary lied about chaincode state.** It printed `✅ Chaincode: DEPLOYED`
unconditionally whenever the bridge health check passed, which is how the original build failure went
unnoticed. It now checks `peer lifecycle chaincode querycommitted`, counts the running chaincode
server containers, performs a real query, and exits non-zero if anything fails.

**3. `POST /api/kyc/submit` reported ledger success when the write only reached local storage.**
On the fallback path `storeKYCData` returned `success: true` with the message "KYC data stored
persistently due to Hyperledger error", which callers read as success. Records in this state are
invisible to the KYC admin screen, because `KYCAdmin.tsx` queries the ledger through
`POST /api/fabric/query` with no fallback. This is why a submitted KYC showed
"No KYC record found for this address". The response now distinguishes the two cases:

```json
{ "onChain": true,  "storage": "hyperledger" }
{ "onChain": false, "storage": "local-fallback", "warning": "NOT_ON_CHAIN" }
```

**4. Reads immediately after a write returned "not found".** `fabric-invoke.sh` invoked without
`--waitForEvent`, so the CLI returned on endorsement in roughly 90 ms, before the block committed.
A submit followed by a status check raced the commit. Verified live: submit succeeded, the status
call 9 ms later found nothing, and the record was present when queried afterwards. The invoke now
waits for the commit event.

One record for `CauHK3m4DRTe6yPrBTDYQrzSvjsi8xN6BhppkZLCuZv9` was replayed from
`bridge-service/kyc-data-store.json` onto the ledger, having been submitted during the outage window.
About 22 other addresses remain local-only in that file, but they are test artefacts
(`test123`, `undefined`, `BRIDGE_TEST_123`) and were deliberately not backfilled.

## Alternatives considered and rejected

- **Downgrade Docker Engine below 29.** Smallest Fabric-side change, but a host-wide change
  affecting the other running containers (`nivix-postgres`, `nivix-redis`, `omniroute`) and it
  reverses a security-relevant upgrade.
- **Run the peers against a Docker-in-Docker daemon at a compatible version.** Keeps the host
  untouched but adds a moving part to local development.

Both were rejected because Fabric v3.x treats the Docker chaincode builder as legacy, so either
workaround would only defer the same breakage.

## References

- [Docker Engine v29 release announcement](https://www.docker.com/blog/docker-engine-version-29/)
  notes the minimum API version update as one of the release's under-the-hood changes.
- [Docker Engine 29 release notes](https://docs.docker.com/engine/release-notes/29/)

Content from the referenced Docker sources was rephrased for compliance with licensing restrictions.
