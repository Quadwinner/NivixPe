import { z } from 'zod';

// Shared domain types + validation schemas used by api and worker.

export const UserType = z.enum(['individual', 'business']);
export type UserType = z.infer<typeof UserType>;

export const KycStatus = z.enum([
  'not_started',
  'pending',
  'approved',
  'rejected',
  'review',
]);
export type KycStatus = z.infer<typeof KycStatus>;

export const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  type: UserType,
  country: z.string().length(2),
  phone: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;

// The compliance record. Hyperledger Fabric is the source of truth;
// Postgres holds a mirror of this shape for fast reads.
export interface ComplianceRecord {
  userId: string;
  status: KycStatus;
  riskScore: number | null;
  verifiedAt: string | null;
  fabricTxRef: string | null;
}

// Queue job payloads (worker)
export interface FabricKycWriteJob {
  userId: string;
  status: KycStatus;
  riskScore: number | null;
  vendorRef: string;
}
