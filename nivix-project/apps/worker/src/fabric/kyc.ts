import { getContract } from './gateway';

export interface StoreKycInput {
  userId: string;
  fullName: string;
  kycVerified: boolean;
  riskScore: number;
  countryCode: string;
}

// Write the KYC record to the multi-org Hyperledger ledger.
// Keyed by userId for BOTH the public key and the userId arg (consistent write/read).
// Returns the committed transaction id.
export async function storeKycOnFabric(input: StoreKycInput): Promise<string> {
  const contract = await getContract();
  const args = [
    input.userId, // userId (private-data key)
    input.userId, // public state key (use userId as our stable identifier)
    input.fullName,
    String(input.kycVerified),
    new Date().toISOString(),
    String(input.riskScore),
    input.countryCode,
  ];

  const proposal = contract.newProposal('StoreKYC', { arguments: args });
  const txn = await proposal.endorse();
  const commit = await txn.submit();
  const status = await commit.getStatus();
  if (!status.successful) {
    throw new Error(`Fabric commit failed (code ${status.code}) for KYC ${input.userId}`);
  }
  return txn.getTransactionId();
}

export async function getKycFromFabric(userId: string): Promise<string> {
  const contract = await getContract();
  const result = await contract.evaluateTransaction('GetKYCStatus', userId);
  return new TextDecoder().decode(result);
}
