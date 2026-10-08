export type SpotStatus = 'RED' | 'YELLOW' | 'GREEN';

export type SpotCategory = 'পরিবহন' | 'কাঁচাবাজার' | 'ফুটপাত' | 'নদীঘাট' | 'নির্মাণাধীন' | 'অন্যান্য';

export type DivisionName = 'সকল' | 'ঢাকা' | 'চট্টগ্রাম' | 'রাজশাহী' | 'খুলনা' | 'সিলেট' | 'রংপুর' | 'বরিশাল' | 'ময়মনসিংহ';

export type UserRole = 'CITIZEN' | 'JUROR' | 'INVESTIGATOR' | 'MERCHANT';

export interface User {
  id: string;
  name: string;
  phoneOrEmail: string;
  division: DivisionName;
  role: UserRole;
  zkpHash: string;
  karma: number;
  createdAt: string;
  votedSpotIds: Record<number, 'UP' | 'DOWN'>;
  reportedSpotIds: number[];
  isVerified: boolean;
  avatarUrl?: string;
  bio?: string;
  anonymousMode?: boolean;
  tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export interface ExtortionSpot {
  id: number;
  name: string;
  division: DivisionName;
  area: string;
  category: SpotCategory;
  syndicateId: string;
  syndicateName: string;
  rate: string;
  unit: string;
  status: SpotStatus;
  score: number;
  distance: string;
  coords: [number, number];
  upvotes: number;
  downvotes: number;
  evidenceType: 'AUDIO' | 'PHOTO' | 'RECEIPT';
  evidenceTitle: string;
  evidenceMeta: string;
  ipfsCid: string;
  updates: string[];
  policeStation: string;
  reportedAt: string;
  reportedByHash: string;
  estimatedDailyCollection?: string;
  evidenceData?: string;
  submitterId?: string;
}

export interface SyndicateTier {
  role: string;
  name: string;
  designation?: string;
  status?: string;
}

export interface Syndicate {
  id: string;
  name: string;
  leader: string;
  division: DivisionName;
  primaryZone: string;
  extortionEstimate: string;
  hierarchy: SyndicateTier[];
  activeCadres: number;
  modusOperandi: string;
}

export interface ShadowWallet {
  id: number;
  number: string;
  provider: 'bKash Agent' | 'Nagad Personal' | 'Rocket Agent' | 'Upay Merchant';
  reports: number;
  totalExtorted: string;
  zone: string;
  status: 'ACTIVE_FLAG' | 'FROZEN';
}

export interface MonthlyTrend {
  month: string;
  monthEn: string;
  reportsCount: number;
  clearedCount: number;
}

export interface ActivityItem {
  id: string;
  type: 'REPORT_SUBMITTED' | 'VOTE_CAST' | 'JURY_VERDICT' | 'ZONE_LIBERATED' | 'FLASH_ALERT';
  title: string;
  subtitle: string;
  timestamp: string;
  spotId?: number;
  division?: string;
}
