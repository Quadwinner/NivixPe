/**
 * Direct KYC operations using the fabric-invoke.sh script
 * This module provides functions to directly work with KYC data in Hyperledger Fabric
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Use a path without spaces to avoid issues with shell execution
const FABRIC_INVOKE_SCRIPT = '/tmp/fabric-invoke.sh';

/**
 * Store KYC data directly in Hyperledger Fabric using fabric-invoke.sh
 * @param {Object} kycData - KYC data to store
 * @returns {Promise<Object>} - Result of the operation
 */
async function storeKYCDirectly(kycData) {
  try {
    console.log('Storing KYC data directly using fabric-invoke.sh script');
    
    // Check if the script exists at the no-spaces path
    if (!fs.existsSync(FABRIC_INVOKE_SCRIPT)) {
      throw new Error(`fabric-invoke.sh script not found at ${FABRIC_INVOKE_SCRIPT}`);
    }
    
    // Prepare the arguments
    const args = [
      kycData.userId,
      kycData.solanaAddress,
      kycData.fullName,
      'false', // Initially not verified
      kycData.verificationDate,
      kycData.riskScore.toString(),
      kycData.countryCode
    ];
    
    const argsJson = JSON.stringify(args);
    
    // Execute the script
    const command = `${FABRIC_INVOKE_SCRIPT} "StoreKYC" '${argsJson}' "invoke"`;
    console.log('Executing command:', command);
    
    const { stdout, stderr } = await execPromise(command);
    
    // Check for errors, but handle the special case where Chaincode invoke successful is in stderr
    if (stderr && stderr.includes('Error') && !stderr.includes('Chaincode invoke successful')) {
      console.error('Error storing KYC data:', stderr);
      throw new Error(stderr);
    }
    
    // Success - Either stderr contains "Chaincode invoke successful" or stdout contains success indicator
    console.log('KYC data successfully stored in Hyperledger Fabric');
    
    // Also record a compliance event
    await recordComplianceEvent(kycData.userId, 'KYC Document Submission', 
      `User submitted ${kycData.idDocuments ? kycData.idDocuments.length : 0} identification documents`);
    
    return {
      success: true,
      verification_id: `kyc_${kycData.userId}`,
      status: 'pending',
      message: 'KYC data successfully submitted to Hyperledger Fabric'
    };
  } catch (error) {
    console.error('Error storing KYC data directly:', error);
    throw error;
  }
}

/**
 * Record a compliance event in Hyperledger Fabric
 * @param {string} userId - User ID
 * @param {string} eventType - Type of compliance event
 * @param {string} description - Description of the event
 * @returns {Promise<void>}
 */
async function recordComplianceEvent(userId, eventType, description) {
  try {
    console.log('Recording compliance event directly using fabric-invoke.sh script');
    
    // Prepare the arguments
    const args = [userId, eventType, description];
    const argsJson = JSON.stringify(args);
    
    // Execute the script
    const command = `${FABRIC_INVOKE_SCRIPT} "RecordComplianceEvent" '${argsJson}' "invoke"`;
    console.log('Executing command:', command);
    
    const { stdout, stderr } = await execPromise(command);
    
    // Check for errors, but handle the special case where Chaincode invoke successful is in stderr
    if (stderr && stderr.includes('Error') && !stderr.includes('Chaincode invoke successful')) {
      console.error('Error recording compliance event:', stderr);
      throw new Error(stderr);
    }
    
    console.log('Compliance event successfully recorded in Hyperledger Fabric');
    return;
  } catch (error) {
    console.error('Error recording compliance event directly:', error);
    // Don't throw, just log the error since this is secondary
  }
}

/**
 * Get KYC status directly from Hyperledger Fabric
 * @param {string} solanaAddress - Solana wallet address to query
 * @returns {Promise<Object|null>} - KYC status or null if not found
 */
async function getKYCStatusDirectly(solanaAddress) {
  try {
    console.log(`Getting KYC status for ${solanaAddress} directly using fabric-invoke.sh script`);
    
    // Prepare the arguments
    const args = [solanaAddress];
    const argsJson = JSON.stringify(args);
    
    // Execute the script
    const command = `${FABRIC_INVOKE_SCRIPT} "GetKYCStatus" '${argsJson}' "query"`;
    console.log('Executing command:', command);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr && stderr.includes('no KYC record found')) {
      console.log(`No KYC record found for address ${solanaAddress}`);
      return null;
    }
    
    if (stderr && stderr.includes('Error') && !stderr.includes('no KYC record found')) {
      console.error('Error getting KYC status:', stderr);
      throw new Error(stderr);
    }
    
    // Extract the last JSON object from stdout (helper prints extra lines)
    const out = stdout.trim();
    const lastBrace = out.lastIndexOf('{');
    if (lastBrace === -1) {
      console.error('Raw output was:', stdout);
      throw new Error('Failed to parse KYC status result: no JSON found');
    }
    const jsonSlice = out.slice(lastBrace);
    let kycStatus;
    try {
      kycStatus = JSON.parse(jsonSlice);
    } catch (e) {
      console.error('Raw output was:', stdout);
      throw new Error(`Failed to parse KYC status result: ${e.message}`);
    }
    return {
      verified: kycStatus.kycVerified === true || kycStatus.kycVerified === 'true',
      userId: kycStatus.userId,
      status: kycStatus.kycVerified === true || kycStatus.kycVerified === 'true' ? 'verified' : 'pending',
      countryCode: kycStatus.countryCode
    };
  } catch (error) {
    console.error('Error getting KYC status directly:', error);
    throw error;
  }
}

module.exports = {
  storeKYCDirectly,
  getKYCStatusDirectly,
  recordComplianceEvent
};
