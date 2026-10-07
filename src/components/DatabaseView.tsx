import React, { useState, useEffect } from 'react';
import { Database, Search, ChevronUp, ChevronDown, ShieldAlert, Users, Layers, ExternalLink } from 'lucide-react';
import { Syndicate } from '../types';

interface DatabaseViewProps {
  onNavigateToMapWithSpot?: (spotName: string) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = () => {
  const [syndicates, setSyndicates] = useState<Syndicate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSyndicate, setExpandedSyndicate] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/syndicates')
      .then(r => r.json())
      .then(data => {
        if (data.syndicates && Array.isArray(data.syndicates)) {
          setSyndicates(data.syndicates);
          if (data.syndicates.length > 0) {
            setExpandedSyndicate(data.syndicates[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const filteredSyndicates = syndicates.filter(syn => {
    const q = searchQuery.toLowerCase();
    return (
      syn.name.toLowerCase().includes(q) ||
      syn.leader.toLowerCase().includes(q) ||
      syn.primaryZone.toLowerCase().includes(q) ||
      syn.division.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4 max-w-2xl mx-auto w-full">
      {/* Title */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider border border-rose-100">
            অনুসন্ধানী ডেটাবেস
          </span>
          <span className="text-[10px] text-slate-400">· জাতীয় গোয়েন্দা নথি ভিউ</span>
        </div>
        <h2 className="text-base font-extrabold text-slate-900 mt-1">জাতীয় সিন্ডিকেট রেজিস্ট্রি</h2>
        <p className="text-[11px] text-slate-500">
          চিহ্নিত চাঁদাবাজ সিন্ডিকেট, গডফাদার ও তৃণমূল ক্যাডারদের পূর্ণাঙ্গ হায়ারার্কি
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass-card p-3 rounded-2xl border-l-4 border-l-rose-500">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">নথিভুক্ত সিন্ডিকেট</span>
          <span className="text-lg font-extrabold text-slate-900 font-num">{syndicates.length} টি চক্র</span>
          <span className="text-[9px] text-rose-600 block mt-0.5">গোয়েন্দা নজরে</span>
        </div>
        <div className="glass-card p-3 rounded-2xl border-l-4 border-l-emerald-500">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">মুক্ত এলাকা</span>
          <span className="text-lg font-extrabold text-emerald-600 font-num">৮৭ টি স্পট</span>
          <span className="text-[9px] text-emerald-600 block mt-0.5">যৌথ টহল চলমান</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-card rounded-2xl p-2 flex items-center gap-2 border border-white/90">
        <Search className="w-4 h-4 text-pink-500 ml-1.5 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="সিন্ডিকেটের নাম, পরিচালক বা অঞ্চল অনুসন্ধান করুন..."
          className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-1"
          >
            ×
          </button>
        )}
      </div>

      {/* Syndicate List Cards */}
      <div className="space-y-3">
        {filteredSyndicates.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl text-center space-y-2 border border-slate-100">
            <Database className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">কোনো সিন্ডিকেট নথিভুক্ত নেই</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ফায়ারবেস ডাটাবেসে বর্তমানে কোনো অপরাধ চক্র তালিকাভুক্ত নেই। নাগরিক অভিযোগ ও অনুসন্ধানী অডিটের পর স্বয়ংক্রিয়ভাবে সিন্ডিকেটের হায়ারার্কি তৈরি হবে।
            </p>
          </div>
        ) : (
          filteredSyndicates.map(syn => {
          const isExpanded = expandedSyndicate === syn.id;

          return (
            <div
              key={syn.id}
              className="glass-card p-4 rounded-2xl border border-white/95 transition-all shadow-xs"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">{syn.division} বিভাগ</span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{syn.name}</h3>
                </div>
                <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-xl border border-rose-100 shrink-0">
                  {syn.extortionEstimate}
                </span>
              </div>

              {/* Meta details */}
              <div className="mt-2 space-y-1 text-xs">
                <p className="text-slate-600">
                  মাঠ পরিচালক / কমান্ডার: <b className="text-slate-900">{syn.leader}</b>
                </p>
                <p className="text-slate-500 text-[11px]">
                  অধিক্ষেত্র / হটস্পট: <span className="text-slate-700 font-medium">{syn.primaryZone}</span>
                </p>
                <p className="text-slate-500 text-[11px] leading-relaxed pt-1 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">কাজের ধরন: </span>
                  {syn.modusOperandi}
                </p>
              </div>

              {/* Hierarchy Tree Accordion Trigger */}
              <button
                onClick={() => setExpandedSyndicate(isExpanded ? null : syn.id)}
                className="mt-3 w-full text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center justify-between py-1.5 px-2.5 bg-rose-50/60 rounded-xl transition-colors border border-rose-100/60"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isExpanded ? 'হায়ারার্কি ট্রি সংক্ষেপ করুন' : 'সম্পূর্ণ হায়ারার্কি ট্রি দেখুন'}</span>
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Hierarchy Tree Accordion Content */}
              {isExpanded && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    কমান্ড চেইনের অভ্যন্তরীণ কাঠামো:
                  </span>

                  <div className="space-y-1.5">
                    {syn.hierarchy.map((tier, idx) => (
                      <div
                        key={idx}
                        className="bg-white/80 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-pink-100 text-rose-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{tier.role}</span>
                            <span className="font-bold text-slate-900">{tier.name}</span>
                          </div>
                        </div>

                        {tier.designation && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            {tier.designation}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
};
