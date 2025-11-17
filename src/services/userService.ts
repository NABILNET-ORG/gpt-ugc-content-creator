import { findOrCreateUser, getUserCredits } from '../db/queries';
import { User } from '../types';

export async function getOrCreateUser(externalId: string): Promise<User> {
  return await findOrCreateUser(externalId);
}

export async function getUserCreditBalance(userId: string): Promise<number> {
  return await getUserCredits(userId);
}
