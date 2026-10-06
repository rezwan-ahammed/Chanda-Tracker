import React, { useState } from 'react';
import { Users, CheckCircle, XCircle, AlertCircle, ShieldCheck, EyeOff, Award } from 'lucide-react';
import { ExtortionSpot } from '../types';

interface JuryViewProps {
  spots: ExtortionSpot[];
  onVote: (spotId: number, isUp: boolean) => void;
  onOpenEvidence: (spot: ExtortionSpot) => void;
  onKarmaReward: (points: number) => void;
}

export const JuryView: React.FC<JuryViewProps> = ({
  spots,
  onVote,
  onOpenEvidence,
  onKarmaReward,
}) => {
  const [votedSpots, setVotedSpots] = useState<Record<number, 'UP' | 'DOWN'>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter only YELLOW spots (under investigation)
  const yellowSpots = spots.filter(s => s.status === 'YELLOW');

  const handleJuryVote = (spotId: number, isUp: boolean) => {
    onVote(spotId, isUp);
    setVotedSpots(prev => ({ ...prev, [spotId]: isUp ? 'UP' : 'DOWN' }));
    onKarmaReward(10);

    setToastMessage(
      isUp
        ? 'আপনার ভোট গৃহীত হয়েছে! কনসেনসাস স্কোর বৃদ্ধি পেয়েছে (+১০ কার্মা)'
        : 'আপনার প্রতিক্রিয়া নথিভুক্ত হয়েছে! কনসেনসাস সমন্বয় করা হয়েছে (+১০ কার্মা)'
    );

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4 max-w-xl mx-auto w-full">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-slate-900/95 text-white text-xs font-bold p-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800 animate-slideDown">
          <Award className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-100">
            কনসেনসাস ভেরিফিকেশন
          </span>
          <h2 className="text-base font-extrabold text-slate-900 mt-1">হাইপারলোকাল জুরি পুল</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ব্যক্তিগত আক্রোশ বা ভুয়া অভিযোগ প্রতিহত করতে স্থানীয় জুরি পর্যালোচনা
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <Users className="w-3 h-3 text-pink-500" />
            <span>১০ জন জুরি সক্রিয়</span>
          </span>
        </div>
      </div>

      {/* Information Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <EyeOff className="w-4 h-4 text-amber-700" />
          <span>অন্ধ পর্যালোচনা নীতি (Blind Review)</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          প্রতিশোধমূলক হামলা প্রতিরোধে অভিযোগকারীর ব্যক্তিগত পরিচয় ক্রিপ্টোগ্রাফিক হ্যাশে ঢাকা রয়েছে।
          স্কোর ৭৫% অতিক্রম করলে স্পটটি স্বয়ংক্রিয়ভাবে পাবলিক রেড জোনে উত্তীর্ণ হবে।
        </p>
      </div>

      {/* Yellow Spot Review Cards */}
      <div className="space-y-3">
        {yellowSpots.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl text-center space-y-2 border border-slate-100">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">কোনো তদন্তাধীন অভিযোগ অমীমাংসিত নেই</h3>
            <p className="text-xs text-slate-500">
              সকল রিপোর্ট যাচাই বাছাই সম্পন্ন হয়েছে অথবা রেড জোনে উন্নীত হয়েছে।
            </p>
          </div>
        ) : (
          yellowSpots.map(spot => {
            const userVote = votedSpots[spot.id];
            const isNearRed = spot.score >= 70;

            return (
              <div
                key={spot.id}
                className="glass-card rounded-2xl p-4 border border-amber-200/90 shadow-xs space-y-3"
              >
                {/* Status & distance */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="font-bold text-amber-900 text-[11px]">তদন্তাধীন অভিযোগ</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">দূরত্ব: {spot.distance}</span>
                </div>

                {/* Spot detail */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{spot.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {spot.division} বিভাগ • {spot.area} ({spot.category})
                  </p>
                </div>

                {/* Demand & Syndicate claim */}
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">দাবিকৃত অর্থ:</span>
                    <span className="font-bold text-rose-600">
                      ৳ {spot.rate} ({spot.unit})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">অভিযুক্ত সিন্ডিকেট:</span>
                    <span className="font-bold text-slate-800">{spot.syndicateName}</span>
                  </div>
                </div>

                {/* Evidence preview trigger */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    প্রমাণ: {spot.evidenceTitle}
                  </span>
                  <button
                    onClick={() => onOpenEvidence(spot)}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline"
                  >
                    প্রমাণপত্র শুনুন / দেখুন
                  </button>
                </div>

                {/* Consensus Score Progress to Red Zone */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">কনফিডেন্স স্কোর:</span>
                    <span className="font-extrabold text-slate-900 font-num">{spot.score}% / ৭৫% লক্ষ্য</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, spot.score)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isNearRed ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Big Jury Action Buttons */}
                {userVote ? (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 ${
                      userVote === 'UP'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>আপনার জুরি মতামত নথিভুক্ত রয়েছে ({userVote === 'UP' ? 'সত্য' : 'ভিত্তিহীন'})</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleJuryVote(spot.id, true)}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs pink-glow active:scale-95 transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>তথ্যটি সত্য</span>
                    </button>

                    <button
                      onClick={() => handleJuryVote(spot.id, false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs border border-slate-200 active:scale-95 transition flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4 text-slate-500" />
                      <span>ভিত্তিহীন অভিযোগ</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
