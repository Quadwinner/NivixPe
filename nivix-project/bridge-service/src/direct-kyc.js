/**
 * KYC chaincode operations via directInvokeChaincode (local CLI or Fabric gateway / AMB).
 */

const { directInvokeChaincode } = require('./direct-invoke');

async function storeKYCDirectly(kycData) {
  console.log('Storing KYC data on Hyperledger Fabric (gateway or local CLI)');

  const args = [
    kycData.userId,
    kycData.solanaAddress,
    kycData.fullName,
    'false',
    kycData.verificationDate,
    kycData.riskScore.toString(),
    kycData.countryCode
  ];

  await directInvokeChaincode('StoreKYC', args, false);

  console.log('KYC data successfully stored in Hyperledger Fabric');

  await recordComplianceEvent(
    kycData.userId,
    'KYC Document Submission',
    `User submitted ${kycData.idDocuments ? kycData.idDocuments.length : 0} identification documents`
  );

  return {
    success: true,
    verification_id: `kyc_${kycData.userId}`,
    status: 'pending',
    message: 'KYC data successfully submitted to Hyperledger Fabric'
  };
}

async function recordComplianceEvent(userId, eventType, description) {
  try {
    const args = [userId, eventType, description];
    await directInvokeChaincode('RecordComplianceEvent', args, false);
    console.log('Compliance event successfully recorded in Hyperledger Fabric');
  } catch (error) {
    console.error('Error recording compliance event:', error.message);
  }
}

function parseKycQueryPayload(stdout) {
  const out = (stdout || '').trim();
  const msg = out.toLowerCase();
  if (msg.includes('no kyc record found')) {
    return null;
  }
  const lastBrace = out.lastIndexOf('{');
  if (lastBrace === -1) {
    throw new Error('Failed to parse KYC status result: no JSON found');
  }
  return JSON.parse(out.slice(lastBrace));
}

async function getKYCStatusDirectly(solanaAddress) {
  console.log(`Getting KYC status for ${solanaAddress}`);

  let raw;
  try {
    raw = await directInvokeChaincode('GetKYCStatus', [solanaAddress], true);
  } catch (error) {
    const combined = `${error.message || ''}\n${error.stderr || ''}`.toLowerCase();
    if (combined.includes('no kyc record found')) {
      return null;
    }
    throw error;
  }

  if (!raw || raw.toLowerCase().includes('no kyc record found')) {
    return null;
  }

  const kycStatus = parseKycQueryPayload(raw);
  return {
    verified: kycStatus.kycVerified === true || kycStatus.kycVerified === 'true',
    userId: kycStatus.userId,
    status:
      kycStatus.kycVerified === true || kycStatus.kycVerified === 'true'
        ? 'verified'
        : 'pending',
    countryCode: kycStatus.countryCode
  };
}

module.exports = {
  storeKYCDirectly,
  getKYCStatusDirectly,
  recordComplianceEvent
};
