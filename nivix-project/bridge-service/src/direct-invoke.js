/**
 * Chaincode invoke/query: Amazon Managed Blockchain / remote Fabric (gateway) or local peer CLI.
 */

const fs = require('fs');
const util = require('util');
const { exec } = require('child_process');
const execPromise = util.promisify(exec);

const fabricConfig = require('./config/fabric-config');
const { evaluateViaGateway, submitViaGateway } = require('./fabric-gateway-client');

async function directInvokeChaincode(functionName, args, isQuery = false) {
  console.log(`\n======= CHAINCODE ${isQuery ? 'QUERY' : 'INVOKE'} =======`);
  console.log(`Function: ${functionName}`);
  console.log(`Arguments: ${JSON.stringify(args)}`);
  console.log(`Operation type: ${isQuery ? 'Query (Read)' : 'Invoke (Write)'}`);
  console.log('======================================\n');

  if (fabricConfig.useFabricGateway()) {
    try {
      if (isQuery) {
        return await evaluateViaGateway(functionName, args);
      }
      return await submitViaGateway(functionName, args);
    } catch (error) {
      console.error('Fabric gateway transaction failed:', error.message);
      throw error;
    }
  }

  const cfg = fabricConfig.getFabricConfig();
  const scriptPath = cfg.invokeScript;

  if (!fs.existsSync(scriptPath)) {
    console.error(`Fabric invoke script not found at: ${scriptPath}`);
    throw new Error(`Fabric invoke script not found at: ${scriptPath}`);
  }

  const type = isQuery ? 'query' : 'invoke';
  const argsJson = JSON.stringify(args);
  const command = `NIVIX_PROJECT_ROOT="${cfg.projectRoot}" FABRIC_PROJECT_ROOT="${cfg.projectRoot}" ${scriptPath} "${functionName}" '${argsJson}' "${type}"`;

  console.log(`=== Executing fabric helper script (${type}) ===`);
  console.log(`Command: ${command}`);

  try {
    const { stdout, stderr } = await execPromise(command);

    console.log('=== COMMAND EXECUTION COMPLETED ===');
    if (stdout) console.log('STDOUT:\n', stdout);
    if (stderr) {
      console.log('STDERR:\n', stderr);
      if (stderr.includes('Chaincode invoke successful')) {
        console.log('Found success message in stderr - operation was successful');
      }
    }

    const result = (stdout || '').trim();
    if (type === 'query' && result) {
      try {
        JSON.parse(result);
      } catch {
        console.warn('Query result is not strict JSON; returning raw stdout');
      }
    }

    return result;
  } catch (execError) {
    console.error('=== COMMAND EXECUTION FAILED ===', execError.message);
    if (execError.stdout) console.log('STDOUT:', execError.stdout);
    if (execError.stderr) console.log('STDERR:', execError.stderr);
    throw execError;
  }
}

module.exports = {
  directInvokeChaincode
};
