import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getSpots,
  getSpotById,
  addSpot,
  voteSpot,
  juryVerdictSpot,
  getSyndicates,
  getWallets,
  registerUser,
  loginUser,
  getUserByToken,
  getUserById,
  getActivities,
} from './src/server/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI client on the server
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to extract user from Authorization header
function getAuthUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return getUserByToken(token);
}

// Auth: Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, phoneOrEmail, password, division, role } = req.body;
    if (!name || !phoneOrEmail || !password) {
      return res.status(400).json({ error: 'নাম, মোবাইল/ইমেইল এবং পাসওয়ার্ড আবশ্যক।' });
    }
    const result = registerUser(name, phoneOrEmail, password, division, role);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'নিবন্ধন ব্যর্থ হয়েছে।' });
  }
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { phoneOrEmail, password } = req.body;
    if (!phoneOrEmail || !password) {
      return res.status(400).json({ error: 'মোবাইল/ইমেইল এবং পাসওয়ার্ড আবশ্যক।' });
    }
    const result = loginUser(phoneOrEmail, password);
    return res.json(result);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'লগইন ব্যর্থ হয়েছে।' });
  }
});

// Auth: Current User Profile
app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'লগইন সেশন পাওয়া যায়নি।' });
  }
  return res.json({ user });
});

// Real-time Community Activities Feed
app.get('/api/activities', (_req, res) => {
  res.json({ activities: getActivities() });
});

// 1. Get all spots
app.get('/api/spots', (_req, res) => {
  res.json({ spots: getSpots() });
});

// 2. Submit new spot
app.post('/api/spots', (req, res) => {
  try {
    const raw = req.body;
    if (!raw.name || !raw.rate) {
      return res.status(400).json({ error: 'Name and rate are required' });
    }

    const authUser = getAuthUser(req);

    const newSpot = {
      id: Date.now(),
      name: String(raw.name),
      division: raw.division || 'ঢাকা',
      area: raw.area || `${raw.name}, ${raw.division || 'ঢাকা'}`,
      category: raw.category || 'পরিবহন',
      syndicateId: raw.syndicateId || 'syn_new',
      syndicateName: raw.syndicateName || 'শনাক্তকরণাধীন চক্র',
      rate: String(raw.rate),
      unit: raw.unit || 'প্রতিবার',
      status: raw.status || 'YELLOW',
      score: typeof raw.score === 'number' ? raw.score : 65,
      distance: raw.distance || '৩৫০ মিটার',
      coords: Array.isArray(raw.coords) ? raw.coords : [23.7516, 90.3944],
      upvotes: 1,
      downvotes: 0,
      evidenceType: raw.evidenceType || 'RECEIPT',
      evidenceTitle: raw.evidenceTitle || 'নাগরিক প্রমাণপত্র ও রশিদ',
      evidenceMeta: raw.evidenceMeta || 'ডিজিটাল ফরেনসিক মেটাডেটা প্রসেসড',
      ipfsCid: raw.ipfsCid || `bafybei${Math.random().toString(36).substring(2, 12)}k9m4`,
      updates: ['নাগরিক অভিযোগ প্রাপ্ত হয়েছে ও জুরি পর্যালোচনায় অন্তর্ভুক্ত'],
      policeStation: raw.policeStation || 'সংশ্লিষ্ট থানা',
      reportedAt: 'এইমাত্র প্রাপ্ত',
      reportedByHash: authUser ? authUser.zkpHash : (raw.reportedByHash || 'sha256_anonymous'),
      estimatedDailyCollection: raw.estimatedDailyCollection || `৳ ${parseInt(raw.rate || '100') * 80}`,
      evidenceData: raw.evidenceData || null, // Real base64 audio/image data
      submitterId: authUser ? authUser.id : undefined,
    };

    const saved = addSpot(newSpot as any, authUser?.id);
    return res.status(201).json({ spot: saved });
  } catch (err: any) {
    console.error('Error in POST /api/spots:', err);
    return res.status(500).json({ error: 'Failed to create spot' });
  }
});

// 3. Upvote / Downvote spot
app.post('/api/spots/:id/vote', (req, res) => {
  const spotId = parseInt(req.params.id, 10);
  const isUp = Boolean(req.body.isUp);
  const authUser = getAuthUser(req);
  const result = voteSpot(spotId, isUp, authUser?.id);
  if (!result) {
    return res.status(404).json({ error: 'Spot not found' });
  }
  return res.json(result);
});

// 4. Jury peer review verdict
app.post('/api/spots/:id/jury', (req, res) => {
  const spotId = parseInt(req.params.id, 10);
  const isTrue = Boolean(req.body.isTrue);
  const authUser = getAuthUser(req);
  const result = juryVerdictSpot(spotId, isTrue, authUser?.id);
  if (!result) {
    return res.status(404).json({ error: 'Spot not found' });
  }
  return res.json(result);
});

// 5. Syndicates list
app.get('/api/syndicates', (_req, res) => {
  res.json({ syndicates: getSyndicates() });
});

// 6. Wallets list
app.get('/api/wallets', (_req, res) => {
  res.json({ wallets: getWallets() });
});

// 7. AI Threat Analysis Endpoint
app.post('/api/ai-threat-analysis', async (req, res) => {
  try {
    const { spots, syndicates, division } = req.body;

    if (!process.env.GEMINI_API_KEY || !aiClient) {
      return res.status(200).json({
        source: 'HEURISTIC_ENGINE',
        message: 'Local heuristic engine active.',
      });
    }

    const promptText = `
You are the Chief Intelligence Analyst for the Bangladesh Civic Defense & Anti-Extortion Hub (জাতীয় চাঁদাবাজি ট্র্যাকার ও নাগরিক প্রতিরক্ষা সেল).
Analyze the current extortion incidents, syndicate network data, and geographic information to identify criminal patterns, predict potential 'Red Zone' escalations, and provide proactive citizen safety measures.

Current Incidents Data:
${JSON.stringify((spots || []).slice(0, 10), null, 2)}

Syndicate Intelligence:
${JSON.stringify(syndicates || [], null, 2)}

Target Scope Division: ${division || 'National (All Divisions)'}

Return your analysis in valid JSON adhering strictly to this schema:
{
  "threatLevel": "CRITICAL" | "HIGH" | "ELEVATED" | "MODERATE",
  "threatScore": number (0-100),
  "escalationForecasts": [
    {
      "spotId": number,
      "spotName": string,
      "currentStatus": "YELLOW" | "RED" | "GREEN",
      "escalationProbability": number (0-100 percentage),
      "timeframe": string,
      "keyDrivers": string[],
      "syndicateInvolved": string,
      "urgencyLevel": "IMMINENT" | "HIGH_RISK" | "MONITORING"
    }
  ],
  "spatialCorridorPatterns": [
    {
      "corridorName": string,
      "affectedNodes": string[],
      "peakExtortionHours": string,
      "modusOperandi": string,
      "economicImpact": string
    }
  ],
  "proactiveSafetyAdvisories": [
    {
      "targetAudience": string,
      "recommendedActions": string[],
      "safeBypassNotes": string,
      "legalRecourse": string
    }
  ],
  "executiveSummary": string
}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'You are an expert civic intelligence and anti-extortion analyst in Bangladesh. Always provide insightful, actionable, and culturally accurate Bengali analysis with tabular metrics.',
      },
    });

    const rawText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = { rawText };
    }

    return res.status(200).json({
      source: 'GEMINI_AI_NEURAL',
      data: parsedData,
    });
  } catch (error: any) {
    console.error('AI Threat Analysis error:', error);
    return res.status(200).json({
      source: 'HEURISTIC_FALLBACK',
      error: error?.message || 'Server error',
    });
  }
});

// Setup Vite middleware for development
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
