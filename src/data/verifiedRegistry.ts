import { ExtortionSpot, Syndicate, ShadowWallet, MonthlyTrend } from '../types';

/**
 * Clean Registry Store - 100% Firestore Database authorative
 * No unusual or pre-made dummy data
 */
export const OFFICIAL_VERIFIED_SPOTS: ExtortionSpot[] = [];
export const OFFICIAL_SYNDICATES: Syndicate[] = [];
export const OFFICIAL_WALLETS: ShadowWallet[] = [];
export const OFFICIAL_MONTHLY_TRENDS: MonthlyTrend[] = [];

// Backwards compatibility alias exports
export const INITIAL_SPOTS = OFFICIAL_VERIFIED_SPOTS;
export const SYNDICATES = OFFICIAL_SYNDICATES;
export const BLACKLISTED_WALLETS = OFFICIAL_WALLETS;
export const MONTHLY_TRENDS = OFFICIAL_MONTHLY_TRENDS;
