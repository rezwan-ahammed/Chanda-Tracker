import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  AlertOctagon,
  Sparkles,
  TrendingUp,
  Clock,
  Shield,
  Route,
  Users,
  ChevronRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  Info,
  MapPin
} from 'lucide-react';
import { ExtortionSpot, Syndicate } from '../types';
import { computeThreatAnalysis, ThreatAnalysisReport, EscalationForecast } from '../utils/threatEngine';
import { safeFetchJson } from '../utils/safeApi';

interface ThreatAnalysisViewProps {
  spots: ExtortionSpot[];
  onNavigateToMapSpot?: (spot: ExtortionSpot) => void;
  onOpenSafeRoute?: () => void;
  onOpenSos?: () => void;
}

export const ThreatAnalysisView: React.FC<ThreatAnalysisViewProps> = ({
  spots,
  onNavigateToMapSpot,
  onOpenSafeRoute,
  onOpenSos,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'FORECAST' | 'CORRIDORS' | 'ADVISORY'>('FORECAST');
  const [selectedDivision, setSelectedDivision] = useState<string>('সকল');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'IMMINENT' | 'HIGH_RISK'>('ALL');
  const [syndicates, setSyndicates] = useState<Syndicate[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiReportSource, setAiReportSource] = useState<'LOCAL_HEURISTIC' | 'GEMINI_NEURAL'>('LOCAL_HEURISTIC');
  const [customAiSummary, setCustomAiSummary] = useState<string | null>(null);

  useEffect(() => {
    safeFetchJson<{ syndicates: Syndicate[] }>('/api/syndicates')
      .then(res => {
        if (res.ok && res.data?.syndicates && Array.isArray(res.data.syndicates)) {
          setSyndicates(res.data.syndicates);
        }
      })
      .catch(() => {});
  }, []);

  // Compute live analysis based on real spots
  const baseAnalysis = useMemo(() => {
    return computeThreatAnalysis(spots, syndicates, selectedDivision);
  }, [spots, syndicates, selectedDivision]);

  // Filter forecasts by live urgency
  const analysis: ThreatAnalysisReport = useMemo(() => {
    if (urgencyFilter === 'ALL') return baseAnalysis;
    const filteredForecasts = baseAnalysis.forecasts.filter(f => f.urgencyLevel === urgencyFilter);
    return {
      ...baseAnalysis,
      forecasts: filteredForecasts,
    };
  }, [baseAnalysis, urgencyFilter]);

  const handleRunNeuralAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const res = await safeFetchJson<{ source: string; data?: any }>('/api/ai-threat-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spots,
          syndicates,
          division: selectedDivision,
        }),
      });

      if (res.ok && res.data) {
        if (res.data.source === 'GEMINI_AI_NEURAL' && res.data.data) {
          setAiReportSource('GEMINI_NEURAL');
          if (res.data.data.executiveSummary) {
            setCustomAiSummary(res.data.data.executiveSummary);
          }
        } else {
          setAiReportSource('LOCAL_HEURISTIC');
        }
      }
    } catch (e) {
      console.warn('Backend threat call fallback:', e);
      setAiReportSource('LOCAL_HEURISTIC');
    } finally {
      setTimeout(() => {
        setIsAiLoading(false);
      }, 800);
    }
  };

  const divisions = ['সকল', 'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা'];

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4 max-w-2xl mx-auto w-full">
      {/* Top Banner / AI Threat Intelligence Center */}
      <div className="glass-card p-4 rounded-3xl border border-rose-200/90 space-y-3 relative overflow-hidden bg-gradient-to-br from-white via-rose-50/40 to-pink-50/50 shadow-sm">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1">
                <Brain className="w-3 h-3 text-rose-600" />
                <span>AI থ্রেট ইন্টেলিজেন্স ইঞ্জিন</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {aiReportSource === 'GEMINI_NEURAL' ? '⚡ Gemini 3.8 Flash Neural' : '🛡️ Heuristic Cluster Engine'}
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 mt-1">
              চাঁদাবাজি হুমকি বিশ্লেষণ ও রেড জোন পূর্বাভাস
            </h2>
          </div>

          <button
            onClick={handleRunNeuralAnalysis}
            disabled={isAiLoading}
            title="লাইভ এআই নিউরাল রি-অ্যানালাইসিস"
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1 pink-glow active:scale-95 transition disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>{isAiLoading ? 'বিশ্লেষণ চলছে...' : 'লাইভ বিশ্লেষণ'}</span>
          </button>
        </div>

        {/* Threat Gauge & Key Metric Cards */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {/* Gauge 1: Threat Score */}
          <div className="bg-white/90 p-2.5 rounded-2xl border border-rose-100/90 text-center">
            <span className="text-[10px] text-slate-500 font-bold block">জাতীয় হুমকি স্তর</span>
            <div className="text-xl font-extrabold text-rose-600 font-num mt-0.5">
              {analysis.overallThreatScore}<span className="text-xs text-slate-400 font-normal">/১০০</span>
            </div>
            <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-md inline-block">
              {analysis.overallThreatLevel === 'CRITICAL' ? 'সংকটজনক' : 'উচ্চ ঝুঁকি'}
            </span>
          </div>

          {/* Gauge 2: Imminent Red Zones */}
          <div className="bg-white/90 p-2.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] text-slate-500 font-bold block">আসন্ন রেড জোন</span>
            <div className="text-xl font-extrabold text-amber-600 font-num mt-0.5">
              {analysis.forecasts.filter(f => f.escalationProbability >= 70 && f.currentStatus === 'YELLOW').length} টি
            </div>
            <span className="text-[9px] text-slate-400">২৪–৪৮ ঘণ্টার মধ্যে</span>
          </div>

          {/* Gauge 3: Monitored Corridors */}
          <div className="bg-white/90 p-2.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] text-slate-500 font-bold block">ঝুঁকিপূর্ণ করিডোর</span>
            <div className="text-xl font-extrabold text-slate-800 font-num mt-0.5">
              {analysis.corridors.length} টি
            </div>
            <span className="text-[9px] text-slate-400">সাপ্লাই রুট ট্রেসড</span>
          </div>
        </div>

        {/* Executive AI Summary Box */}
        <div className="bg-white/95 rounded-2xl p-3 border border-rose-100/80 text-xs text-slate-700 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>গোয়েন্দা সারাংশ (ইন্টেলিজেন্স ব্রিফিং):</span>
          </div>
          <p className="text-[11px] text-slate-600">
            {customAiSummary || analysis.summary}
          </p>
        </div>
      </div>

      {/* Division Selector & Live Urgency Filter */}
      <div className="glass-card p-3 rounded-2xl border border-white/95 space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700">ভৌগোলিক পরিধি:</span>
          {/* Live Urgency Filter */}
          <div className="flex items-center gap-1.5 bg-rose-50/70 px-2 py-1 rounded-xl border border-rose-100 text-[10px]">
            <span className="font-bold text-slate-700">ফিল্টার:</span>
            <button
              onClick={() => setUrgencyFilter('ALL')}
              className={`px-1.5 py-0.5 rounded font-bold transition ${urgencyFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
            >
              সকল
            </button>
            <button
              onClick={() => setUrgencyFilter('IMMINENT')}
              className={`px-1.5 py-0.5 rounded font-bold transition ${urgencyFilter === 'IMMINENT' ? 'bg-rose-600 text-white' : 'text-slate-600'}`}
            >
              🚨 আসন্ন ঝুঁকি
            </button>
            <button
              onClick={() => setUrgencyFilter('HIGH_RISK')}
              className={`px-1.5 py-0.5 rounded font-bold transition ${urgencyFilter === 'HIGH_RISK' ? 'bg-amber-600 text-white' : 'text-slate-600'}`}
            >
              ⚠️ নজরদারি
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {divisions.map(div => (
            <button
              key={div}
              onClick={() => setSelectedDivision(div)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                selectedDivision === div
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {div === 'সকল' ? 'সমগ্র বাংলাদেশ' : div}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Main Sub-Navigation Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('FORECAST')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'FORECAST'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
          <span>রেড জোন পূর্বাভাস</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CORRIDORS')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'CORRIDORS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Route className="w-3.5 h-3.5 text-pink-500" />
          <span>সিন্ডিকেট করিডোর</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ADVISORY')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'ADVISORY'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>সুরক্ষা গাইডলাইন</span>
        </button>
      </div>

      {/* TAB 1: RED ZONE ESCALATION FORECAST */}
      {activeSubTab === 'FORECAST' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">আসন্ন রেড জোন রূপান্তর সম্ভাব্যতা (Escalation Index)</span>
            <span className="text-[10px] text-slate-400">এআই প্রবাবিলিটি মডেল</span>
          </div>

          {analysis.forecasts.length === 0 ? (
            <div className="glass-card p-6 rounded-2xl text-center space-y-1.5 border border-slate-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="text-xs font-bold text-slate-800">কোনো ঝুঁকিপূর্ণ স্পটের পূর্বাভাস নেই</h3>
              <p className="text-[11px] text-slate-400">
                ফায়ারবেস ডাটাবেসে বর্তমানে এই বিভাগের জন্য কোনো সক্রিয় চাঁদাবাজি স্পট রিপোর্ট নেই। এলাকা নিরাপদ।
              </p>
            </div>
          ) : (
            analysis.forecasts.map(forecast => {
            const isImminent = forecast.urgencyLevel === 'IMMINENT';
            const isHigh = forecast.urgencyLevel === 'HIGH_RISK';

            return (
              <div
                key={forecast.spotId}
                className={`glass-card p-4 rounded-2xl border transition-all space-y-3 ${
                  isImminent
                    ? 'border-rose-300 bg-rose-50/20 shadow-xs ring-1 ring-rose-200/60'
                    : isHigh
                    ? 'border-amber-200 bg-amber-50/15'
                    : 'border-slate-100 bg-white'
                }`}
              >
                {/* Top status & urgency */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          forecast.currentStatus === 'RED'
                            ? 'bg-rose-100 text-rose-700'
                            : forecast.currentStatus === 'YELLOW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {forecast.currentStatus === 'RED' ? 'বর্তমান: রেড জোন' : forecast.currentStatus === 'YELLOW' ? 'তদন্তাধীন হলুদ জোন' : 'মুক্ত স্পট'}
                      </span>
                      <span className="text-[10px] text-slate-400">{forecast.division} • {forecast.area}</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1">{forecast.spotName}</h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">রূপান্তর ঝুঁকি:</span>
                    <span
                      className={`text-base font-extrabold font-num ${
                        forecast.escalationProbability >= 75
                          ? 'text-rose-600'
                          : forecast.escalationProbability >= 50
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {forecast.escalationProbability}%
                    </span>
                  </div>
                </div>

                {/* Probability Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      অনুমান: <b>{forecast.timeframeHours} ঘণ্টার মধ্যে রেড জোনে রূপান্তর</b>
                    </span>
                    <span className="font-bold">
                      {isImminent ? '🚨 আসন্ন ঝুঁকি (Imminent)' : isHigh ? '⚠️ সতর্কতামূলক নজরদারি' : 'নিয়ন্ত্রিত'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${forecast.escalationProbability}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isImminent
                          ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                          : isHigh
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Key Drivers */}
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    চিহ্নিত ঝুঁকির প্রভাবকসমূহ (Risk Drivers):
                  </span>
                  <ul className="space-y-0.5 text-[11px] text-slate-600">
                    {forecast.drivers.map((drv, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                        <span>{drv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Proactive Recommendation Action */}
                <div className="flex items-center justify-between text-xs pt-0.5 bg-rose-50/60 p-2 rounded-xl border border-rose-100 text-rose-900">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <Shield className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="text-[11px] font-semibold truncate">{forecast.recommendedAction}</span>
                  </div>
                  <button
                    onClick={() => {
                      const sp = spots.find(s => s.id === forecast.spotId);
                      if (sp && onNavigateToMapSpot) onNavigateToMapSpot(sp);
                    }}
                    className="text-[10px] font-bold text-rose-700 bg-white px-2 py-1 rounded-lg border border-rose-200 shrink-0 hover:bg-rose-50 transition ml-2"
                  >
                    ম্যাপে দেখুন
                  </button>
                </div>
              </div>
            );
          }))}
        </div>
      )}

      {/* TAB 2: SPATIAL CORRIDOR PATTERNS */}
      {activeSubTab === 'CORRIDORS' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">জিও-স্পেশিয়াল সিন্ডিকেট প্যাটার্ন ও করিডোর ট্র্যাকিং</span>
            <span className="text-[10px] text-slate-400">সাপ্লাই-চেইন ম্যাপিং</span>
          </div>

          {analysis.corridors.length === 0 ? (
            <div className="glass-card p-6 rounded-2xl text-center space-y-1.5 border border-slate-100">
              <Route className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-xs font-bold text-slate-800">বর্তমানে কোনো সক্রিয় সিন্ডিকেট করিডোর নেই</h3>
              <p className="text-[11px] text-slate-400">
                একাধিক সংযুক্ত রেড জোন স্পট শনাক্ত হলে স্বয়ংক্রিয়ভাবে ঝুঁকিপূর্ণ করিডোর ম্যাপিং প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            analysis.corridors.map(corr => (
            <div key={corr.id} className="glass-card p-4 rounded-2xl border border-white/95 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    {corr.riskLevel === 'CRITICAL' ? 'সংকটজনক করিডোর' : 'উচ্চ ঝুঁকি'}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">{corr.name}</h3>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                  {corr.dailyExtortionVolume}
                </span>
              </div>

              {/* Connecting Nodes */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">সংযুক্ত হটস্পট নোডসমূহ:</span>
                <div className="flex flex-wrap gap-1.5">
                  {corr.affectedNodes.map((node, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-pink-500" />
                      <span>{node}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Peak Hours & Threat Description */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">সময়ভিত্তিক বিপদসীমা:</span>
                  <span className="font-bold text-rose-600 text-[11px]">{corr.peakHours}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">নিয়ন্ত্রণকারী চক্র:</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block">{corr.connectingSyndicate}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 border border-slate-100">
                <span className="font-bold text-slate-700 block mb-0.5">কাজের ধরন:</span>
                <p className="text-[11px] leading-relaxed">{corr.threatDescription}</p>
              </div>

              {/* Safe Alternative Route Recommendation */}
              <div className="bg-emerald-50/80 p-2.5 rounded-xl text-xs border border-emerald-200/80 text-emerald-900 flex justify-between items-center gap-2">
                <div>
                  <span className="font-bold text-[10px] uppercase text-emerald-700 block">প্রস্তাবিত বিকল্প নিরাপদ রুট:</span>
                  <p className="text-[11px] text-emerald-800 font-medium">{corr.safeAlternative}</p>
                </div>
                <button
                  onClick={onOpenSafeRoute}
                  className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl shrink-0 hover:bg-emerald-700 transition"
                >
                  বাইপাস সক্রিয় করুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    )}

      {/* TAB 3: PROACTIVE SAFETY ADVISORIES */}
      {activeSubTab === 'ADVISORY' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">নাগরিক ও পরিবহনকারীদের জন্য প্রোঅ্যাকটিভ সুরক্ষা নির্দেশিকা</span>
            <span className="text-[10px] text-slate-400">সিভিক ডিফেন্স প্রটোকল</span>
          </div>

          {analysis.advisories.map(adv => (
            <div key={adv.id} className="glass-card p-4 rounded-2xl border border-white/95 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-rose-600 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">{adv.targetGroup}</h3>
                    <span className="text-[10px] text-slate-400 block">{adv.riskScenario}</span>
                  </div>
                </div>
              </div>

              {/* Protocols */}
              <div className="space-y-1.5 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  প্রতিরোধমূলক সতর্কতামূলক পদক্ষেপ:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-600">
                  {adv.preventiveProtocols.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bypass & Emergency Steps */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 text-emerald-900">
                  <span className="text-[10px] font-bold text-emerald-700 block">নিরাপদ করিডোর:</span>
                  <span className="text-[11px] font-medium leading-tight block mt-0.5">{adv.safeBypassRoute}</span>
                </div>
                <div className="bg-rose-50/70 p-2 rounded-xl border border-rose-100 text-rose-900">
                  <span className="text-[10px] font-bold text-rose-700 block">আইনি সহায়তা:</span>
                  <span className="text-[11px] font-medium leading-tight block mt-0.5">{adv.emergencyStep}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  onClick={onOpenSos}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-rose-600" />
                  <span>জরুরি হটলাইন ও প্রশাসন সহায়তা নিন</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
