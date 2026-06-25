import { prisma } from '../db';
import { createEncryptor } from '../providers/encryptor';
import { fabricQueue } from '../queue';
import type { KycVendorResult } from './provider';

const encryptor = createEncryptor();

// Called on /kyc/initiate — create or reset the pending KYC record.
export async function upsertKycSession(userId: string, vendor: string, vendorRef: string) {
  return prisma.kycRecord.upsert({
    where: { userId },
    create: { userId, vendor, vendorRef, status: 'pending' },
    update: { vendor, vendorRef, status: 'pending' },
  });
}

// Real vendors send a vendorRef/applicantId in the webhook; map it back to our user.
export async function findUserIdByVendorRef(vendorRef: string): Promise<string | null> {
  const rec = await prisma.kycRecord.findFirst({ where: { vendorRef } });
  return rec?.userId ?? null;
}

// Apply a vendor verification result: update the Postgres mirror + write an audit row.
// PII (if provided) is encrypted at rest via the Encryptor (KMS later).
export async function applyVendorResult(
  userId: string,
  result: KycVendorResult,
  pii?: Record<string, unknown>,
) {
  const rec = await prisma.kycRecord.update({
    where: { userId },
    data: {
      status: result.status,
      riskScore: result.riskScore,
      verifiedAt: result.status === 'approved' ? new Date() : null,
      ...(pii ? { piiEncrypted: encryptor.encrypt(JSON.stringify(pii)) } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      actor: userId,
      action: `kyc.${result.status}`,
      entity: 'KycRecord',
      entityId: rec.id,
      dataJson: { riskScore: result.riskScore },
    },
  });

  // WS-C: on approval, enqueue a write of this compliance record to the multi-org
  // Hyperledger Fabric ledger. The worker writes it and sets rec.fabricTxRef.
  if (result.status === 'approved') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await fabricQueue.add(
      'store-kyc',
      {
        userId,
        fullName: user?.email ?? userId,
        kycVerified: true,
        riskScore: result.riskScore,
        countryCode: user?.country ?? 'XX',
      },
      { attempts: 5, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true },
    );
  }
  return rec;
}

export async function getKycStatus(userId: string) {
  const rec = await prisma.kycRecord.findUnique({ where: { userId } });
  return {
    status: rec?.status ?? 'not_started',
    riskScore: rec?.riskScore ?? null,
    verifiedAt: rec?.verifiedAt ?? null,
  };
}
