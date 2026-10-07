import { ExtortionSpot, Syndicate } from '../types';

export interface EscalationForecast {
  spotId: number;
  spotName: string;
  division: string;
  area: string;
  currentStatus: 'YELLOW' | 'RED' | 'GREEN';
  currentScore: number;
  escalationProbability: number; // 0 - 100
  timeframeHours: number; // estimated hours until Red Zone
  urgencyLevel: 'IMMINENT' | 'HIGH_RISK' | 'MODERATE' | 'STABLE';
  drivers: string[];
  syndicateName: string;
  recommendedAction: string;
}

export interface CorridorPattern {
  id: string;
  name: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  affectedNodes: string[];
  connectingSyndicate: string;
  peakHours: string;
  threatDescription: string;
  safeAlternative: string;
  dailyExtortionVolume: string;
}

export interface SafetyAdvisory {
  id: string;
  targetGroup: string;
  riskScenario: string;
  preventiveProtocols: string[];
  safeBypassRoute: string;
  emergencyStep: string;
}

export interface ThreatAnalysisReport {
  overallThreatScore: number; // 0-100
  overallThreatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE';
  forecasts: EscalationForecast[];
  corridors: CorridorPattern[];
  advisories: SafetyAdvisory[];
  summary: string;
  analysisTimestamp: string;
}

export const STANDARD_SAFETY_ADVISORIES: SafetyAdvisory[] = [
  {
    id: 'adv_pedestrians',
    targetGroup: 'সাধারণ পথচারী ও যাত্রী',
    riskScenario: 'ফুটপাত দখল ও মোড়ে মোড়ে টোকেন চাঁদাবাজির মুখে সাধারণ চলাচলে হুমকি',
    preventiveProtocols: [
      'হটস্পট চিহ্নিত জোনসমূহে নগদ টাকার প্রকাশ্য লেনদেন পরিহার করুন।',
      'সন্দেহভাজনদের মুখোমুখি হলে তর্কাতর্কি না করে অ্যাপের "ক্যালকুলেটর স্টিলথ মোড" চালু করুন।',
      'জরুরি প্রয়োজনে "কমিউনিটি ফ্ল্যাশ অ্যালার্ট" বাটন চেপে আশপাশের ২০০ মিটারের লোকজনকে নীরব সংকেত দিন।',
    ],
    safeBypassRoute: 'প্রধান সড়কের মূল ফুটপাত দিয়ে দলবদ্ধভাবে চলুন; নির্জন গলি বা সংযোগ লেন পরিহার করুন।',
    emergencyStep: 'সরাসরি ৯৯৯ ডায়াল করুন অথবা দ্রুত নিকটবর্তী পুলিশ বক্সে আশ্রয় নিন।',
  },
  {
    id: 'adv_transporters',
    targetGroup: 'পিকআপ, ট্রাক ও ভ্যান চালক',
    riskScenario: 'মালামাল লোড-আনলোডের সময় জোরপূর্বক রশিদ ও ভুয়া টোকেন চাপিয়ে অর্থ দাবি',
    preventiveProtocols: [
      'রাত ৩:০০ থেকে সকাল ৬:০০টার মধ্যে ট্রিপ নেওয়ার সময় সর্বদা ২ জন স্টাফ একত্রে থাকুন।',
      'ড্যাশক্যাম বা মোবাইল ক্যামেরা স্ট্যান্ড সক্রিয় রাখুন যাতে হুমকিদাতাদের মুখচ্ছবি ধারণ করা যায়।',
      'চাঁদা দাবিকারীদের নামের রসিদ বা স্লিপের ছবি তুলে সঙ্গে সঙ্গে অ্যাপের "অভিযোগ দাখিল" পাইপলাইনে জমা দিন।',
    ],
    safeBypassRoute: 'ম্যাপের "সেফ রুট" টগল সক্রিয় করে প্রস্তাবিত সবুজ ড্যাশড বাইপাস হাইওয়ে ব্যবহার করুন।',
    emergencyStep: 'অ্যাপ থেকে ১-ক্লিকে "অটো-জিডি ড্রাফট" কপি করে সংশ্লিষ্ট থানার ওসির নিকট দাখিল করুন।',
  },
  {
    id: 'adv_hawkers',
    targetGroup: 'কাঁচাবাজারের আড়তদার ও ক্ষুদ্র হকার',
    riskScenario: 'দৈনিক বসার চাঁদা না দিলে দোকান ভাঙচুর ও মালামাল ছিনতাইয়ের হুমকি',
    preventiveProtocols: [
      'একা একা চাঁদা না দিয়ে বাজার ব্যবসায়ী ঐক্য পরিষদ গঠন করে সম্মিলিত প্রতিরোধ গড়ে তুলুন।',
      'লাইনম্যানদের ব্যবহৃত এমএফএস (বিকাশ/নগদ) নম্বর চিহ্নিত করে অ্যাপের "শ্যাডো ওয়ালেট" ব্ল্যাকলিস্টে যুক্ত করুন।',
      'জুরি রিভিউতে সত্যতার পক্ষে ভোট প্রদান করে এলাকাকে দ্রুত রেড জোন হিসেবে তালিকাভুক্ত করান।',
    ],
    safeBypassRoute: 'সিটি কর্পোরেশনের নির্ধারিত মুক্ত পাইকারি শেডে স্থানান্তর প্রক্রিয়া ত্বরান্বিত করুন।',
    emergencyStep: 'র‍্যাব হটলাইনে (০১৭৭৭-৭২০০২৯) কল দিয়ে চাঁদাবাজদের বর্তমান অবস্থান জানিয়ে যৌথ অভিযানের অনুরোধ জানান।',
  },
];

export function computeThreatAnalysis(
  spots: ExtortionSpot[],
  syndicates: Syndicate[],
  selectedDivision: string = 'সকল'
): ThreatAnalysisReport {
  const relevantSpots = selectedDivision === 'সকল'
    ? spots
    : spots.filter(s => s.division === selectedDivision);

  const advisories = STANDARD_SAFETY_ADVISORIES;

  // 1. Calculate Escalation Forecasts
  const forecasts: EscalationForecast[] = relevantSpots.map(spot => {
    let probability = 0;
    const drivers: string[] = [];

    if (spot.status === 'RED') {
      probability = Math.min(98, 85 + Math.floor(spot.score * 0.1));
      drivers.push('সক্রিয় রেড জোন: একাধিক ভেরিফায়েড অভিযোগ ও অকাট্য ডিজিটাল প্রমাণ বিদ্যমান');
      drivers.push('স্থানীয় সিন্ডিকেটের নিয়মিত উপস্থিতি নিশ্চিত');
    } else if (spot.status === 'YELLOW') {
      // Calculate probability based on score, upvotes, syndicate linkage
      const baseProb = Math.min(85, Math.round(spot.score * 0.95));
      probability = baseProb;

      if (spot.upvotes > 20) {
        probability += 8;
        drivers.push(`নাগরিক সাক্ষ্য গতিবেগ বৃদ্ধি: ${spot.upvotes} জন প্রত্যক্ষদর্শী সমর্থন`);
      }

      if (spot.syndicateName && spot.syndicateName !== 'শনাক্তকরণাধীন চক্র') {
        probability += 6;
        drivers.push(`চিহ্নিত অপরাধ চক্রের সংশ্লিষ্টতা: ${spot.syndicateName}`);
      } else {
        drivers.push('অজ্ঞাত অপরাধ চক্রের বিস্তার ও প্রাথমিক গোয়েন্দা নজরদারি');
      }

      const rateNum = parseInt(spot.rate || '0', 10);
      if (rateNum >= 50) {
        probability += 5;
        drivers.push(`অতিরিক্ত চাঁদার দাবি (৳ ${spot.rate} ${spot.unit})`);
      }

      probability = Math.min(94, Math.max(30, probability));
    } else {
      // GREEN
      probability = 15;
      drivers.push('যৌথবাহিনীর টহলে বর্তমানে পরিস্থিতি নিয়ন্ত্রণে রয়েছে');
    }

    let urgencyLevel: EscalationForecast['urgencyLevel'] = 'MODERATE';
    let timeframeHours = 72;

    if (probability >= 80) {
      urgencyLevel = 'IMMINENT';
      timeframeHours = 24;
    } else if (probability >= 60) {
      urgencyLevel = 'HIGH_RISK';
      timeframeHours = 48;
    } else if (probability < 30) {
      urgencyLevel = 'STABLE';
      timeframeHours = 120;
    }

    let recommendedAction = 'এলাকা দিয়ে চলাচলের সময় বিকল্প রুট ব্যবহার করুন এবং গ্রুপে চলাচল করুন।';
    if (urgencyLevel === 'IMMINENT') {
      recommendedAction = 'অবিলম্বে সংশ্লিষ্ট থানার ওসি ও হটলাইনে (৯৯৯) অবহিত করুন। একক অর্থ লেনদেন পরিহার করুন।';
    } else if (urgencyLevel === 'HIGH_RISK') {
      recommendedAction = 'ডিজিটাল রশিদ বা ভয়েস প্রমাণ গোপনে সংগ্রহপূর্বক জুরি ভোটে সমর্থন দিন।';
    }

    return {
      spotId: spot.id,
      spotName: spot.name,
      division: spot.division,
      area: spot.area,
      currentStatus: spot.status,
      currentScore: spot.score,
      escalationProbability: probability,
      timeframeHours,
      urgencyLevel,
      drivers,
      syndicateName: spot.syndicateName,
      recommendedAction,
    };
  });

  // Sort by escalation probability descending
  forecasts.sort((a, b) => b.escalationProbability - a.escalationProbability);

  // If no relevant spots exist in database
  if (relevantSpots.length === 0) {
    return {
      overallThreatScore: 0,
      overallThreatLevel: 'MODERATE',
      forecasts: [],
      corridors: [],
      advisories,
      summary: 'ফায়ারবেস ডাটাবেসে বর্তমানে কোনো সক্রিয় চাঁদাবাজি স্পট নথিভুক্ত নেই। কোনো অপরাধ স্পট রিপোর্ট বা অভিযোগ দাখিল করা হলে স্বয়ংক্রিয়ভাবে থ্রেট ইঞ্জিন বিশ্লেষণ হিসাব করবে। এলাকা নিরাপদ।',
      analysisTimestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // 2. Dynamic Corridors formed from actual spots in the database
  const corridors: CorridorPattern[] = [];
  const redSpots = relevantSpots.filter(s => s.status === 'RED');
  if (redSpots.length >= 2) {
    corridors.push({
      id: `corridor_${Date.now()}`,
      name: `${selectedDivision === 'সকল' ? 'আন্তঃবিভাগীয়' : selectedDivision} সক্রিয় অপরাধ করিডোর`,
      riskLevel: 'CRITICAL',
      affectedNodes: redSpots.slice(0, 3).map(s => s.name),
      connectingSyndicate: redSpots[0].syndicateName || 'শনাক্তকরণাধীন চক্র',
      peakHours: 'সন্ধ্যা ৬:০০ – রাত ১১:০০',
      threatDescription: `চিহ্নিত রেড জোন স্পটসমূহে জোরপূর্বক চাঁদা আদায়ের নিয়মিত তৎপরতা নথিভুক্ত।`,
      safeAlternative: 'বিকল্প সংযোগ সড়ক ব্যবহার ও স্থানীয় যৌথবাহিনীকে অবহিত করা।',
      dailyExtortionVolume: `৳ ${(redSpots.length * 15000).toLocaleString('bn-BD')}+ দৈনিক`,
    });
  }

  // Overall Threat Score Calculation
  const highRiskCount = forecasts.filter(f => f.escalationProbability >= 70).length;
  const overallThreatScore = Math.min(95, Math.round(55 + (highRiskCount * 8)));

  let overallThreatLevel: ThreatAnalysisReport['overallThreatLevel'] = 'MODERATE';
  if (overallThreatScore >= 80) overallThreatLevel = 'CRITICAL';
  else if (overallThreatScore >= 65) overallThreatLevel = 'HIGH';
  else if (overallThreatScore >= 50) overallThreatLevel = 'ELEVATED';

  const summary = `বিভাগীয় ক্রাইম ম্যাট্রিক্স বিশ্লেষণে দেখা গেছে, বর্তমানে ${highRiskCount}টি স্পটে তীব্র চাঁদাবাজির ঘটনা ঘটছে। বিশেষত খাদ্য পরিবহন ও ইন্টার-সিটি বাস করিডোরে লাইনম্যানদের নতুন সমন্বিত সিন্ডিকেট সক্রিয় হওয়ার জোরালো আলামত পাওয়া গেছে। আগামী ২৪ থেকে ৪৮ ঘণ্টার মধ্যে 'তদন্তাধীন' হলুদ স্পটসমূহের মধ্যে অন্তত ২টি স্পট পূর্ণাঙ্গ রেড জোনে রূপান্তরের দ্বারপ্রান্তে রয়েছে।`;

  return {
    overallThreatScore,
    overallThreatLevel,
    forecasts,
    corridors,
    advisories,
    summary,
    analysisTimestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
  };
}
