const path = require('path');

function getFabricConfig() {
  const mode = (process.env.FABRIC_MODE || 'local-cli').toLowerCase();
  return {
    mode,
    connectionProfilePath: process.env.FABRIC_CONNECTION_PROFILE_PATH || '',
    walletPath: process.env.FABRIC_WALLET_PATH || '',
    walletUser: process.env.FABRIC_WALLET_USER || 'appUser',
    channel: process.env.FABRIC_CHANNEL || 'mychannel',
    chaincode: process.env.FABRIC_CHAINCODE || 'nivix-kyc',
    invokeScript: process.env.FABRIC_INVOKE_SCRIPT || '/tmp/fabric-invoke.sh',
    discoveryAsLocalhost: process.env.FABRIC_DISCOVERY_AS_LOCALHOST === 'true',
    projectRoot:
      process.env.NIVIX_PROJECT_ROOT ||
      process.env.FABRIC_PROJECT_ROOT ||
      path.resolve(__dirname, '..', '..', '..')
  };
}

function useFabricGateway() {
  const c = getFabricConfig();
  if (c.mode !== 'gateway') return false;
  return !!(c.connectionProfilePath && c.walletPath);
}

module.exports = {
  getFabricConfig,
  useFabricGateway
};
