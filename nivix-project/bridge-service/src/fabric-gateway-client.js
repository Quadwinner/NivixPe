const fs = require('fs');
const { Gateway, Wallets } = require('fabric-network');
const fabricConfig = require('./config/fabric-config');

let gateway;

async function ensureGateway() {
  if (!fabricConfig.useFabricGateway()) {
    throw new Error('Fabric gateway mode is not enabled (set FABRIC_MODE=gateway and profile/wallet paths)');
  }
  const cfg = fabricConfig.getFabricConfig();
  if (gateway) {
    return gateway;
  }
  if (!fs.existsSync(cfg.connectionProfilePath)) {
    throw new Error(`FABRIC_CONNECTION_PROFILE_PATH not found: ${cfg.connectionProfilePath}`);
  }
  if (!fs.existsSync(cfg.walletPath)) {
    throw new Error(`FABRIC_WALLET_PATH not found: ${cfg.walletPath}`);
  }
  const ccp = JSON.parse(fs.readFileSync(cfg.connectionProfilePath, 'utf8'));
  const wallet = await Wallets.newFileSystemWallet(cfg.walletPath);
  const gw = new Gateway();
  await gw.connect(ccp, {
    wallet,
    identity: cfg.walletUser,
    discovery: { enabled: true, asLocalhost: cfg.discoveryAsLocalhost }
  });
  gateway = gw;
  return gateway;
}

async function getContract() {
  const cfg = fabricConfig.getFabricConfig();
  const gw = await ensureGateway();
  const network = await gw.getNetwork(cfg.channel);
  return network.getContract(cfg.chaincode);
}

async function evaluateViaGateway(fcn, args) {
  const contract = await getContract();
  const strArgs = (args || []).map((a) => (a == null ? '' : String(a)));
  const result = await contract.evaluateTransaction(fcn, ...strArgs);
  return result ? result.toString('utf8') : '';
}

async function submitViaGateway(fcn, args) {
  const contract = await getContract();
  const strArgs = (args || []).map((a) => (a == null ? '' : String(a)));
  const result = await contract.submitTransaction(fcn, ...strArgs);
  return result ? result.toString('utf8') : '';
}

function disconnectFabricGateway() {
  if (gateway) {
    try {
      gateway.disconnect();
    } catch (e) {
      console.warn('Fabric gateway disconnect:', e.message);
    }
    gateway = null;
  }
}

module.exports = {
  evaluateViaGateway,
  submitViaGateway,
  disconnectFabricGateway,
  ensureGateway
};
