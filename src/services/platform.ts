import type { Tx } from "@/db/with-tenant";
import { hashPassword } from "@/lib/password";

export type PlatformDealer = {
  id: string;
  name: string;
  plan_key: string;
  status: string;
  created_at: Date;
  branch_count: string;
  seat_count: string;
};

export async function listPlatformDealers(tx: Tx) {
  return tx<PlatformDealer[]>`SELECT * FROM arth_platform_dealers()`;
}

export async function getPlatformDealer(tx: Tx, tenantId: string) {
  const [row] = await tx<{
    id: string;
    name: string;
    plan_key: string;
    status: string;
    created_at: Date;
  }[]>`SELECT * FROM arth_platform_dealer(${tenantId}::uuid)`;
  return row ?? null;
}

export async function onboardDealer(
  tx: Tx,
  input: {
    dealerName: string;
    branchName: string;
    principalName: string;
    principalPhone: string;
    principalUsername: string;
    deskName: string;
    deskPhone: string;
    deskUsername: string;
    teleName: string;
    telePhone: string;
    teleUsername: string;
    password: string;
  },
) {
  if (input.password.length < 8) {
    throw new Error("The first password must be at least eight characters.");
  }
  const hash = hashPassword(input.password);
  const [row] = await tx<{ id: string }[]>`
    SELECT arth_onboard_dealer(
      ${input.dealerName},
      ${input.branchName},
      ${input.principalName},
      ${input.principalPhone},
      ${input.principalUsername},
      ${input.deskName},
      ${input.deskPhone},
      ${input.deskUsername},
      ${input.teleName},
      ${input.telePhone},
      ${input.teleUsername},
      ${hash}
    )::text AS id
  `;
  if (!row?.id) throw new Error("Onboarding did not create a dealer.");
  return row.id;
}

export async function logPlatformAction(
  tx: Tx,
  action: string,
  tenantId: string,
  note: string,
) {
  await tx`SELECT arth_platform_log(${action}, ${tenantId}::uuid, ${note})`;
}
