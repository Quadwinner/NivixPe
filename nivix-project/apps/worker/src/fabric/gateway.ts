import { connect, hash, type Gateway, type Identity, type Signer, signers } from '@hyperledger/fabric-gateway';
import * as grpc from '@grpc/grpc-js';
import { promises as fs } from 'node:fs';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import { config } from '../config';

async function firstFileInDir(dir: string): Promise<string> {
  const files = await fs.readdir(dir);
  const file = files.find((f) => !f.startsWith('.'));
  if (!file) throw new Error(`No files found in ${dir}`);
  return path.join(dir, file);
}

async function newGrpcConnection(): Promise<grpc.Client> {
  const tlsRootCert = await fs.readFile(config.fabric.tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(config.fabric.peerEndpoint, tlsCredentials, {
    'grpc.ssl_target_name_override': config.fabric.peerHostAlias,
  });
}

async function newIdentity(): Promise<Identity> {
  const certPath = await firstFileInDir(config.fabric.certDir);
  const credentials = await fs.readFile(certPath);
  return { mspId: config.fabric.mspId, credentials };
}

async function newSigner(): Promise<Signer> {
  const keyPath = await firstFileInDir(config.fabric.keyDir);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

let client: grpc.Client | null = null;
let gateway: Gateway | null = null;

// Lazy, reused gateway connection to the local Fabric network (AMB later — config-only swap).
export async function getContract() {
  if (!gateway) {
    client = await newGrpcConnection();
    gateway = connect({
      client,
      identity: await newIdentity(),
      signer: await newSigner(),
      hash: hash.sha256,
      evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
      endorseOptions: () => ({ deadline: Date.now() + 15000 }),
      submitOptions: () => ({ deadline: Date.now() + 5000 }),
      commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
    });
  }
  const network = gateway.getNetwork(config.fabric.channel);
  return network.getContract(config.fabric.chaincode);
}

export function closeGateway(): void {
  gateway?.close();
  client?.close();
  gateway = null;
  client = null;
}
