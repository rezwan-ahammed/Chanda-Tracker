import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { ExtortionSpot, Syndicate, ShadowWallet, User, ActivityItem, DivisionName, UserRole } from '../types.js';
import { INITIAL_SPOTS, SYNDICATES, BLACKLISTED_WALLETS } from '../data/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'data_store.json');

interface DatabaseSchema {
  users: User[];
  userPasswords: Record<string, string>; // userId -> sha256 password hash
  spots: ExtortionSpot[];
  syndicates: Syndicate[];
  wallets: ShadowWallet[];
  activities: ActivityItem[];
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'CIVIC_DEFENSE_SALT').digest('hex');
}

function initDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_PATH)) {
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.users && parsed.spots) {
        return parsed;
      }
    } catch (e) {
      console.warn('Re-initializing database store with clean data');
    }
  }

  // Pre-seeded authentic users for live login
  const defaultUsers: User[] = [
    {
      id: 'usr_citizen_1',
      name: 'তানভীর আহমেদ',
      phoneOrEmail: '01711000001',
      division: 'ঢাকা',
      role: 'CITIZEN',
      zkpHash: 'sha256_9c41f7e340a8',
      karma: 185,
      createdAt: '২০২৬-০১-১৫',
      votedSpotIds: {},
      reportedSpotIds: [],
      isVerified: true
    },
    {
      id: 'usr_juror_1',
      name: 'ফারহানা ইয়াসমিন',
      phoneOrEmail: '01811000002',
      division: 'ঢাকা',
      role: 'JUROR',
      zkpHash: 'sha256_b219e04a77c0',
      karma: 340,
      createdAt: '২০২৬-০২-১০',
      votedSpotIds: {},
      reportedSpotIds: [],
      isVerified: true
    },
    {
      id: 'usr_investigator_1',
      name: 'মাহবুবুর রহমান',
      phoneOrEmail: '01911000003',
      division: 'ঢাকা',
      role: 'INVESTIGATOR',
      zkpHash: 'sha256_aa45129dee56',
      karma: 520,
      createdAt: '২০২৫-১১-২০',
      votedSpotIds: {},
      reportedSpotIds: [],
      isVerified: true
    }
  ];

  const defaultPasswords: Record<string, string> = {
    'usr_citizen_1': hashPassword('password123'),
    'usr_juror_1': hashPassword('password123'),
    'usr_investigator_1': hashPassword('password123')
  };

  const initialData: DatabaseSchema = {
    users: defaultUsers,
    userPasswords: defaultPasswords,
    spots: [],
    syndicates: [],
    wallets: [],
    activities: []
  };

  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write initial data_store.json', e);
  }

  return initialData;
}

let db: DatabaseSchema = initDatabase();

export function saveDatabase(): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save data_store.json', e);
  }
}

// ==========================================
// User Authentication & Management
// ==========================================

export function registerUser(
  name: string,
  phoneOrEmail: string,
  passwordPlain: string,
  division: DivisionName = 'ঢাকা',
  role: UserRole = 'CITIZEN'
): { user: User; token: string } {
  const cleanIdentifier = phoneOrEmail.trim().toLowerCase();
  
  const existing = db.users.find(u => u.phoneOrEmail.toLowerCase() === cleanIdentifier);
  if (existing) {
    throw new Error('এই ফোন নম্বর বা ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত রয়েছে।');
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const zkpHash = `sha256_${crypto.createHash('sha256').update(cleanIdentifier + Date.now()).digest('hex').substring(0, 16)}`;

  const newUser: User = {
    id: userId,
    name: name.trim(),
    phoneOrEmail: cleanIdentifier,
    division,
    role,
    zkpHash,
    karma: role === 'JUROR' ? 100 : 50,
    createdAt: new Date().toLocaleDateString('bn-BD'),
    votedSpotIds: {},
    reportedSpotIds: [],
    isVerified: role === 'CITIZEN' ? false : true
  };

  db.users.push(newUser);
  db.userPasswords[userId] = hashPassword(passwordPlain);
  saveDatabase();

  const token = `tok_${userId}_${Date.now()}`;
  return { user: newUser, token };
}

export function loginUser(
  phoneOrEmail: string,
  passwordPlain: string
): { user: User; token: string } {
  const cleanIdentifier = phoneOrEmail.trim().toLowerCase();
  const user = db.users.find(u => u.phoneOrEmail.toLowerCase() === cleanIdentifier);

  if (!user) {
    throw new Error('কোনো নিবন্ধিত অ্যাকাউন্ট পাওয়া যায়নি। দয়া করে সঠিক তথ্য দিন বা নতুন অ্যাকাউন্ট খুলুন।');
  }

  const expectedHash = db.userPasswords[user.id];
  const givenHash = hashPassword(passwordPlain);

  if (expectedHash !== givenHash) {
    throw new Error('ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।');
  }

  const token = `tok_${user.id}_${Date.now()}`;
  return { user, token };
}

export function getUserById(userId: string): User | undefined {
  return db.users.find(u => u.id === userId);
}

export function getUserByToken(token: string): User | undefined {
  if (!token || !token.startsWith('tok_')) return undefined;
  const parts = token.split('_');
  if (parts.length < 3) return undefined;
  const userId = `usr_${parts[1]}`;
  // Or check full match
  return db.users.find(u => token.includes(u.id));
}

// ==========================================
// Spots & Community Actions
// ==========================================

export function getSpots(): ExtortionSpot[] {
  return db.spots;
}

export function getSpotById(id: number): ExtortionSpot | undefined {
  return db.spots.find(s => s.id === id);
}

export function addSpot(spot: ExtortionSpot, submitterId?: string): ExtortionSpot {
  db.spots.unshift(spot);

  if (submitterId) {
    const user = db.users.find(u => u.id === submitterId);
    if (user) {
      user.reportedSpotIds.push(spot.id);
      user.karma += 25;
    }
  }

  // Record Activity
  db.activities.unshift({
    id: `act_${Date.now()}`,
    type: 'REPORT_SUBMITTED',
    title: `${spot.name} স্পটে নতুন অভিযোগ দাখিল হয়েছে`,
    subtitle: `দাবিকৃত হার: ৳ ${spot.rate} (${spot.unit}) • সিন্ডিকেট: ${spot.syndicateName}`,
    timestamp: 'এইমাত্র',
    spotId: spot.id,
    division: spot.division
  });

  saveDatabase();
  return spot;
}

export function voteSpot(id: number, isUp: boolean, userId?: string): { spot: ExtortionSpot; alreadyVoted?: boolean } | null {
  const spot = db.spots.find(s => s.id === id);
  if (!spot) return null;

  let user: User | undefined;
  if (userId) {
    user = db.users.find(u => u.id === userId);
    if (user) {
      if (user.votedSpotIds[id] === (isUp ? 'UP' : 'DOWN')) {
        return { spot, alreadyVoted: true };
      }
      user.votedSpotIds[id] = isUp ? 'UP' : 'DOWN';
      user.karma += isUp ? 5 : 2;
    }
  }

  const delta = isUp ? 2 : -3;
  spot.score = Math.min(99, Math.max(15, spot.score + delta));
  if (isUp) {
    spot.upvotes += 1;
  } else {
    spot.downvotes += 1;
  }

  if (spot.score >= 75 && spot.status === 'YELLOW') {
    spot.status = 'RED';
    spot.updates.unshift(`[স্বয়ংক্রিয় এআই অনুমোদন] নাগরিক কনসেনসাস স্কোর ৭৫% ছাড়িয়ে যাওয়ায় রেড জোনে উন্নীত করা হয়েছে।`);

    db.activities.unshift({
      id: `act_${Date.now()}`,
      type: 'ZONE_LIBERATED',
      title: `${spot.name} স্পটটি ভেরিফায়েড রেড জোন হিসেবে নথিভুক্ত`,
      subtitle: `কনসেনসাস স্কোর ৭৫% অতিক্রম করায় জনস্বার্থে সতর্কতা জারি করা হয়েছে`,
      timestamp: 'এইমাত্র',
      spotId: spot.id,
      division: spot.division
    });
  }

  // Record Vote Activity
  db.activities.unshift({
    id: `act_${Date.now()}`,
    type: 'VOTE_CAST',
    title: `${spot.name} স্পটে নতুন সত্যতা সাক্ষ্য প্রদান`,
    subtitle: isUp ? 'অভিযোগের সত্যতা সমর্থন করা হয়েছে (+১)' : 'তথ্যটি অসম্পূর্ণ বা অসংলগ্ন হিসেবে ভোট দেওয়া হয়েছে',
    timestamp: 'এইমাত্র',
    spotId: spot.id,
    division: spot.division
  });

  saveDatabase();
  return { spot };
}

export function juryVerdictSpot(id: number, isTrue: boolean, jurorId?: string): { spot: ExtortionSpot; karmaAdded?: number } | null {
  const spot = db.spots.find(s => s.id === id);
  if (!spot) return null;

  if (jurorId) {
    const juror = db.users.find(u => u.id === jurorId);
    if (juror) {
      juror.votedSpotIds[id] = isTrue ? 'UP' : 'DOWN';
      juror.karma += 15;
    }
  }

  if (isTrue) {
    spot.score = Math.min(99, spot.score + 6);
    spot.upvotes += 3;
  } else {
    spot.score = Math.max(10, spot.score - 7);
    spot.downvotes += 3;
  }

  if (spot.score >= 75 && spot.status === 'YELLOW') {
    spot.status = 'RED';
    spot.updates.unshift(`[জুরি কনসেনসাস সম্পন্ন] জুরি পুলের নিরপেক্ষ পর্যালোচনায় অভিযোগ সত্য প্রমাণিত। এলাকাটি এখন রেড জোন।`);
  }

  db.activities.unshift({
    id: `act_${Date.now()}`,
    type: 'JURY_VERDICT',
    title: `${spot.name} স্পটে জুরি রায় কার্যকর`,
    subtitle: isTrue ? 'জুরি পুল অভিযোগটি সত্য হিসেবে অনুমোদন দিয়েছে' : 'জুরি পুল অভিযোগটি ভিত্তিহীন হিসেবে রায় দিয়েছে',
    timestamp: 'এইমাত্র',
    spotId: spot.id,
    division: spot.division
  });

  saveDatabase();
  return { spot, karmaAdded: 15 };
}

export function getSyndicates(): Syndicate[] {
  return db.syndicates;
}

export function getWallets(): ShadowWallet[] {
  return db.wallets;
}

export function getActivities(): ActivityItem[] {
  return db.activities.slice(0, 15);
}
