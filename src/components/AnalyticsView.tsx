import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Wallet, DollarSign, BarChart2, Filter } from 'lucide-react';
import { ExtortionSpot, DivisionName, SpotStatus, ShadowWallet } from '../types';
import { MONTHLY_TRENDS } from '../data/mockData';
import { safeFetchJson } from '../utils/safeApi';

interface AnalyticsViewProps {
  spots: ExtortionSpot[];
  onNavigateToThreat?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ spots, onNavigateToThreat }) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionName>('সকল');
  const [selectedRisk, setSelectedRisk] = useState<'ALL' | SpotStatus>('ALL');
  const [activeMonthIdx, setActiveMonthIdx] = useState<number>(5); // default to latest month (October)
  const [wallets, setWallets] = useState<ShadowWallet[]>([]);

  // Economic Inflation Calculator State
  const [econCommodity, setEconCommodity] = useState<'potato' | 'onion' | 'rice' | 'oil'>('potato');
  const [econVolume, setEconVolume] = useState<string>('5000'); // kg
  const [econTruckSurcharge, setEconTruckSurcharge] = useState<string>('2500'); // BDT per truck

  const divisions: DivisionName[] = ['সকল', 'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'সিলেট', 'রংপুর', 'বরিশাল'];

  // Fetch live shadow wallets from API
  useEffect(() => {
    safeFetchJson<{ wallets: ShadowWallet[] }>('/api/wallets')
      .then(res => {
        if (res.ok && res.data?.wallets && Array.isArray(res.data.wallets)) {
          setWallets(res.data.wallets);
        }
      })
      .catch(() => {});
  }, []);

  // Filtered spots calculation
  const filteredSpots = useMemo(() => {
    return spots.filter(spot => {
      const matchDiv = selectedDivision === 'সকল' || spot.division === selectedDivision;
      const matchRisk = selectedRisk === 'ALL' || spot.status === selectedRisk;
      return matchDiv && matchRisk;
    });
  }, [spots, selectedDivision, selectedRisk]);

  const nationalTotal = spots.length;
  const nationalCleared = spots.filter(s => s.status === 'GREEN').length;

  // Dynamic Sector / Category Distribution from live database
  const categoryPercentages = useMemo(() => {
    if (spots.length === 0) return [];
    const counts: Record<string, number> = {};
    spots.forEach(s => {
      const cat = s.category || 'অন্যান্য';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      'পরিবহন': '#F43F5E',
      'কাঁচাবাজার': '#FB7185',
      'ফুটপাত': '#FBBF24',
      'নদীঘাট': '#38BDF8',
      'নির্মাণাধীন': '#A855F7',
      'অন্যান্য': '#94A3B8',
    };
    return Object.entries(counts).map(([cat, cnt]) => ({
      category: cat,
      count: cnt,
      percent: Math.max(1, Math.round((cnt / spots.length) * 100)),
      color: colorMap[cat] || '#FB7185',
    })).sort((a, b) => b.count - a.count);
  }, [spots]);

  // Inflation Impact calculation
  const inflationImpact = useMemo(() => {
    const vol = parseFloat(econVolume) || 1000;
    const surcharge = parseFloat(econTruckSurcharge) || 2000;
    const addedPerKg = (surcharge / vol).toFixed(2);
    const monthlyTotal = (surcharge * 50).toLocaleString('bn-BD');
    return { addedPerKg, monthlyTotal };
  }, [econVolume, econTruckSurcharge]);

  const maxMonthValue = MONTHLY_TRENDS.length > 0
    ? Math.max(...MONTHLY_TRENDS.map(m => m.reportsCount))
    : 100;

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 max-w-6xl mx-auto w-full">
      {/* Top Title & Mission */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider border border-rose-200">
            জাতীয় ক্রাইম অ্যানালিটিক্স
          </span>
          <span className="text-[11px] text-slate-400">· লাইভ সিন্ডিকেট অডিট ও ফাইন্যান্সিয়াল ট্রেস</span>
        </div>
        <h2 className="text-lg font-black text-slate-900 mt-1">
          চাঁদাবাজির ট্রেন্ড ও অর্থনৈতিক প্রভাব বিশ্লেষণ
        </h2>
      </div>

      {/* AI Threat Analysis Feature Card */}
      {onNavigateToThreat && (
        <div
          onClick={onNavigateToThreat}
          className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs hover:border-rose-300 hover:shadow-sm cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9.5px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded">লাইভ ইন্টেলিজেন্স</span>
                <span className="text-[11px] font-semibold text-rose-600">রেড জোন রূপান্তর পূর্বাভাস</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 mt-0.5">
                AI থ্রেট অ্যানালাইসিস ও প্রোঅ্যাকটিভ নাগরিক সুরক্ষা গাইড
              </h3>
            </div>
          </div>
          <span className="text-xs text-rose-600 font-bold shrink-0 hidden sm:inline">বিশ্লেষণ দেখুন →</span>
        </div>
      )}

      {/* Control Bar: Division & Risk Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-pink-500" />
            ফিল্টারিং কন্ট্রোল
          </span>
          <span className="text-[11px] text-slate-400">
            প্রদর্শিত স্পট: <b className="text-slate-800 font-num">{filteredSpots.length}</b> টি
          </span>
        </div>

        {/* Division selector pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {divisions.map(div => (
            <button
              key={div}
              onClick={() => setSelectedDivision(div)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                selectedDivision === div
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {div === 'সকল' ? 'সকল বিভাগ' : div}
            </button>
          ))}
        </div>

        {/* Risk Level Pills */}
        <div className="flex gap-1.5 pt-1 border-t border-slate-100">
          <button
            onClick={() => setSelectedRisk('ALL')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              selectedRisk === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            সকল ঝুঁকি
          </button>
          <button
            onClick={() => setSelectedRisk('RED')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              selectedRisk === 'RED'
                ? 'bg-rose-500 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            রেড জোন
          </button>
          <button
            onClick={() => setSelectedRisk('YELLOW')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              selectedRisk === 'YELLOW'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            হলুদ জোন
          </button>
          <button
            onClick={() => setSelectedRisk('GREEN')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              selectedRisk === 'GREEN'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            গ্রিন জোন
          </button>
        </div>
      </div>

      {/* 3 Live Metric Counter Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 rounded-2xl border-l-4 border-l-rose-500">
          <span className="text-[10px] text-slate-500 font-bold block truncate">ফিল্টার্ড স্পট</span>
          <span className="text-lg font-extrabold text-slate-900 font-num">{filteredSpots.length}</span>
          <span className="text-[9px] text-rose-600 block mt-0.5">সক্রিয় নজরদারি</span>
        </div>

        <div className="glass-card p-3 rounded-2xl border-l-4 border-l-slate-700">
          <span className="text-[10px] text-slate-500 font-bold block truncate">জাতীয় চিহ্নিত স্পট</span>
          <span className="text-lg font-extrabold text-slate-900 font-num">{nationalTotal}</span>
          <span className="text-[9px] text-slate-500 block mt-0.5">৮টি বিভাগ মিলিয়ে</span>
        </div>

        <div className="glass-card p-3 rounded-2xl border-l-4 border-l-emerald-500">
          <span className="text-[10px] text-slate-500 font-bold block truncate">প্রশাসন মুক্ত স্পট</span>
          <span className="text-lg font-extrabold text-emerald-600 font-num">{nationalCleared}</span>
          <span className="text-[9px] text-emerald-600 block mt-0.5">যৌথ হস্তক্ষেপে</span>
        </div>
      </div>

      {/* Monthly Trend Bar Chart (Vertical Bars with hover/tap) */}
      <div className="glass-card p-4 rounded-2xl border border-white/90 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-slate-800">গত ৬ মাসের অভিযোগের ধারা</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">প্রতি মাসে অভিযোগ সংখ্যা</span>
        </div>

        {/* Vertical Bar Graph */}
        {MONTHLY_TRENDS.length === 0 ? (
          <div className="py-8 text-center space-y-1.5 border-b border-slate-100">
            <BarChart2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">ফায়ারবেস ডাটাবেসে মাসিক কোনো ট্রেন্ড রেকর্ড নেই</p>
            <p className="text-[11px] text-slate-400">
              নাগরিকরা অভিযোগ দাখিল করলে স্বয়ংক্রিয়ভাবে মাসিক ট্রেন্ড চার্ট জেনারেট হবে।
            </p>
          </div>
        ) : (
          <>
            <div className="h-40 flex items-end justify-between gap-2 pt-6 pb-2 px-1 border-b border-slate-100">
              {MONTHLY_TRENDS.map((item, idx) => {
                const heightPercent = Math.round((item.reportsCount / maxMonthValue) * 100);
                const isSelected = activeMonthIdx === idx;

                return (
                  <div
                    key={item.month}
                    onClick={() => setActiveMonthIdx(idx)}
                    className="flex-1 flex flex-col items-center cursor-pointer group h-full justify-end"
                  >
                    {/* Tooltip on active */}
                    <div
                      className={`text-[9px] font-bold mb-1 transition-opacity ${
                        isSelected ? 'opacity-100 text-rose-600 font-num' : 'opacity-0 group-hover:opacity-100 text-slate-400'
                      }`}
                    >
                      {item.reportsCount}
                    </div>

                    {/* The Bar */}
                    <div className="w-full max-w-[32px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-t from-rose-500 to-pink-400 pink-glow-subtle'
                            : 'bg-rose-200 group-hover:bg-rose-300'
                        }`}
                      />
                    </div>

                    <span
                      className={`text-[10px] mt-2 tracking-tight ${
                        isSelected ? 'font-bold text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {item.monthEn}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Month Summary */}
            {MONTHLY_TRENDS[activeMonthIdx] && (
              <div className="bg-pink-50/60 rounded-xl p-2.5 flex justify-between items-center text-xs border border-pink-100/70">
                <div>
                  <span className="text-slate-600 text-[11px] block">নির্বাচিত মাস:</span>
                  <span className="font-extrabold text-slate-900">{MONTHLY_TRENDS[activeMonthIdx].month}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-600 block">
                    দাখিলকৃত অভিযোগ: <b className="text-rose-600 font-num">{MONTHLY_TRENDS[activeMonthIdx].reportsCount}</b> টি
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    মুক্ত ঘোষিত: <b className="font-num">{MONTHLY_TRENDS[activeMonthIdx].clearedCount}</b> টি স্পট
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Extortion by Sector / Category Distribution */}
      <div className="glass-card p-4 rounded-2xl border border-white/90 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between">
          <span>খাতভিত্তিক চাঁদাবাজির অনুপাত</span>
          <span className="text-[10px] text-slate-400 font-normal">সর্বমোট চিহ্নিত ক্ষেত্র</span>
        </h3>

        {categoryPercentages.length === 0 ? (
          <div className="py-6 text-center space-y-1">
            <p className="text-xs font-bold text-slate-600">বর্তমানে কোনো খাতভিত্তিক অভিযোগ নেই</p>
            <p className="text-[10.5px] text-slate-400">নতুন স্পট রিপোর্ট করা হলে এখানে খাত অনুযায়ী শতাংশ বিভাজন দেখা যাবে।</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {categoryPercentages.map(cat => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-medium">{cat.category}</span>
                  <span className="font-bold text-slate-900 font-num">{cat.percent}% ({cat.count}টি)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commodity Extortion Inflation Calculator */}
      <div className="glass-card p-4 rounded-2xl border border-pink-100 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
              অর্থনৈতিক প্রভাব সিমুলেটর
            </span>
            <h3 className="text-xs font-extrabold text-slate-800 mt-0.5">
              দ্রব্যমূল্যে চাঁদাবাজির প্রভাব ক্যালকুলেটর
            </h3>
          </div>
          <DollarSign className="w-4 h-4 text-rose-500" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">পণ্য নির্বাচন</label>
            <select
              value={econCommodity}
              onChange={e => {
                const val = e.target.value as any;
                setEconCommodity(val);
                if (val === 'potato') {
                  setEconVolume('5000');
                  setEconTruckSurcharge('2500');
                } else if (val === 'onion') {
                  setEconVolume('4000');
                  setEconTruckSurcharge('3200');
                } else if (val === 'rice') {
                  setEconVolume('10000');
                  setEconTruckSurcharge('4000');
                } else {
                  setEconVolume('3000');
                  setEconTruckSurcharge('3000');
                }
              }}
              className="w-full glass-pill p-2 text-xs rounded-xl text-slate-800 focus:outline-none"
            >
              <option value="potato">আলু (পিকআপ/ট্রাক)</option>
              <option value="onion">পেঁয়াজ (কাভার্ড ভ্যান)</option>
              <option value="rice">চাল (১০ টন ট্রাক)</option>
              <option value="oil">ভোজ্যতেল (ড্রাম ভ্যান)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">ট্রাকে মোট মালামাল (কেজি)</label>
            <input
              type="number"
              value={econVolume}
              onChange={e => setEconVolume(e.target.value)}
              className="w-full glass-pill p-2 text-xs rounded-xl text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Calculated Result Display */}
        <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-100 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">ভোক্তা পর্যায়ে প্রতি কেজিতে কৃত্রিম বৃদ্ধি:</span>
            <span className="font-extrabold text-rose-600 text-sm font-num">
              ৳ {inflationImpact.addedPerKg} / কেজি
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">সংশ্লিষ্ট সরবরাহ রুটে মাসিক অবৈধ চাঁদা:</span>
            <span className="font-extrabold text-slate-900 font-num">
              ৳ {inflationImpact.monthlyTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Blacklisted Shadow MFS Wallets List */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-pink-600" />
            <h3 className="text-xs font-bold text-slate-800">এমএফএস শ্যাডো ওয়ালেট ব্ল্যাকলিস্ট</h3>
          </div>
          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
            {wallets.length} টি ওয়ালেট ফ্ল্যাগড
          </span>
        </div>

        {wallets.map(w => (
          <div
            key={w.id}
            className="glass-card p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-num font-bold text-slate-900">{w.number}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    w.status === 'ACTIVE_FLAG'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {w.status === 'ACTIVE_FLAG' ? 'সক্রিয় নজরদারি' : 'ফ্রিজকৃত'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {w.provider} • সক্রিয় জোন: {w.zone}
              </span>
            </div>

            <div className="text-right">
              <span className="font-bold text-rose-600 block font-num">{w.totalExtorted}</span>
              <span className="text-[10px] text-slate-500 font-num">{w.reports} টি সুনির্দিষ্ট অভিযোগ</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
