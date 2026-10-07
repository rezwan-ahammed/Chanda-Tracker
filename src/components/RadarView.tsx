import React, { useState, useMemo } from 'react';
import { Radar, AlertTriangle, Shield, MapPin, Radio, Users, ChevronRight } from 'lucide-react';
import { ExtortionSpot } from '../types';
import { calculateHaversineDistance, formatDistanceBengali } from '../utils/geo';

interface RadarNode {
  id: string;
  name: string;
  distance: string;
  distanceMeters: number;
  threat: 'HIGH' | 'MEDIUM';
  syndicate: string;
  role: string;
  top: string;
  left: string;
  spot?: ExtortionSpot;
}

interface RadarViewProps {
  spots: ExtortionSpot[];
  userLocation?: [number, number];
  onTriggerSilentAlert: () => void;
  onSelectSpot?: (spot: ExtortionSpot) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  spots,
  userLocation = [23.7516, 90.3944],
  onTriggerSilentAlert,
  onSelectSpot,
}) => {
  const [alertSent, setAlertSent] = useState(false);

  // Compute real dynamic radar nodes from actual spots
  const dynamicRadarNodes: RadarNode[] = useMemo(() => {
    // Sort spots by real distance from user
    const withDistance = spots.map(s => {
      const dist = calculateHaversineDistance(userLocation, s.coords);
      return { spot: s, dist };
    });

    withDistance.sort((a, b) => a.dist - b.dist);

    // Take top 3 closest spots
    const positions = [
      { top: '22%', left: '70%' },
      { top: '74%', left: '26%' },
      { top: '35%', left: '18%' },
    ];

    return withDistance.slice(0, 3).map((item, idx) => {
      const pos = positions[idx] || { top: '50%', left: '50%' };
      return {
        id: `node_${item.spot.id}`,
        name: item.spot.name,
        distance: formatDistanceBengali(item.dist),
        distanceMeters: item.dist,
        threat: item.spot.status === 'RED' ? ('HIGH' as const) : ('MEDIUM' as const),
        syndicate: item.spot.syndicateName,
        role: `চাঁদা আদায় পয়েন্ট (${item.spot.rate} ৳ / ${item.spot.unit})`,
        top: pos.top,
        left: pos.left,
        spot: item.spot,
      };
    });
  }, [spots, userLocation]);

  const [selectedNode, setSelectedNode] = useState<RadarNode | null>(dynamicRadarNodes[0] || null);

  React.useEffect(() => {
    setSelectedNode(dynamicRadarNodes[0] || null);
  }, [dynamicRadarNodes]);

  const handleSendAlert = () => {
    onTriggerSilentAlert();
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 3000);
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4 max-w-xl mx-auto w-full flex flex-col justify-between">
      {/* Top Title */}
      <div className="text-center">
        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-100 inline-flex items-center gap-1">
          <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
          <span>রিয়েল-টাইম প্রক্সিমিটি স্ক্যানার</span>
        </span>
        <h2 className="text-base font-extrabold text-slate-900 mt-1">
          লাইভ রাডার ও নিকটবর্তী সিন্ডিকেট ডিটেকশন
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          আপনার বর্তমান জিপিএস অবস্থান থেকে নিকটতম হটস্পটের দূরত্ব বিশ্লেষণ
        </p>
      </div>

      {/* Radar Concentric Rings & Light Cone */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto my-2 flex items-center justify-center select-none">
        {/* Ring 3 (Outer) */}
        <div className="absolute inset-0 rounded-full border border-pink-200/80 bg-pink-50/15" />
        <span className="absolute top-1 text-[9px] font-mono text-pink-400">দূরবর্তী অঞ্চল</span>

        {/* Ring 2 (Middle) */}
        <div className="absolute inset-8 rounded-full border border-pink-300/60" />
        <span className="absolute top-9 text-[9px] font-mono text-pink-400">১ কিমি পরিধি</span>

        {/* Ring 1 (Inner) */}
        <div className="absolute inset-16 rounded-full border border-pink-400/50" />
        <span className="absolute top-17 text-[9px] font-mono text-pink-400">৩৫০ মিটার</span>

        {/* Radar Crosshairs */}
        <div className="absolute w-full h-[1px] bg-pink-200/50" />
        <div className="absolute h-full w-[1px] bg-pink-200/50" />

        {/* Radar Sweeping Light Cone */}
        <div className="absolute inset-0 rounded-full radar-sweep-light pointer-events-none" />

        {/* Center Node (You) */}
        <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 border-2 border-white flex flex-col items-center justify-center text-white text-[10px] font-extrabold pink-glow shadow-md">
          <span>You</span>
        </div>

        {/* Dynamic Threat Nodes on Radar */}
        {dynamicRadarNodes.map(node => (
          <button
            key={node.id}
            onClick={() => setSelectedNode(node)}
            style={{ top: node.top, left: node.left }}
            className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shadow-md border transition-transform active:scale-90 ${
              selectedNode?.id === node.id
                ? 'bg-rose-600 text-white border-white ring-2 ring-rose-400 scale-105'
                : node.threat === 'HIGH'
                ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                node.threat === 'HIGH' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
              }`}
            />
            <span className="whitespace-nowrap truncate max-w-[110px]">{node.name}</span>
          </button>
        ))}
      </div>

      {/* Selected Node Details Box */}
      {selectedNode ? (
        <>
          <div className="glass-card p-3.5 rounded-2xl border border-pink-100/80 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-extrabold text-slate-900">{selectedNode.name}</h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedNode.threat === 'HIGH'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                প্রকৃত দূরত্ব: {selectedNode.distance}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">সিন্ডিকেট চক্র:</span>
                <span className="font-bold text-slate-800 truncate block">{selectedNode.syndicate}</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">মাঠ তৎপরতা:</span>
                <span className="font-bold text-slate-800 truncate block">{selectedNode.role}</span>
              </div>
            </div>
          </div>

          {/* Syndicate Hierarchy Box */}
          <div className="glass-card rounded-2xl p-3.5 border border-white/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-pink-500" />
                নিকটবর্তী সক্রিয় সিন্ডিকেট কাঠামো ({selectedNode.syndicate})
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">শীর্ষ পৃষ্ঠপোষক (গডফাদার):</span>
                <span className="text-slate-900 font-bold">রাজনৈতিক সেল (শনাক্তকরণাধীন)</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">ফিল্ড কমান্ডার / লাইনম্যান:</span>
                <span className="text-rose-600 font-bold">লাইন কমান্ডার ও সহযোগী সেল</span>
              </div>
              <div className="flex justify-between items-center bg-rose-50/70 p-2 rounded-xl text-rose-700 font-bold border border-rose-100">
                <span>সক্রিয় অঞ্চল ও চাঁদার ধরন:</span>
                <span>নিয়মিত চাঁদা আদায় ও রুট নিয়ন্ত্রণ</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-4 rounded-2xl border border-emerald-100 text-center space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">
            নিকটবর্তী পরিধিতে কোনো সক্রিয় চাঁদাবাজি স্পট নেই
          </h3>
          <p className="text-[11px] text-slate-500">
            আপনার জিপিএস অবস্থানের নিকটবর্তী ১ কিমির মধ্যে কোনো হটস্পট রিপোর্ট করা হয়নি। এলাকা সুরক্ষিত।
          </p>
        </div>
      )}

      {/* Bottom Emergency Alert Button */}
      <button
        onClick={handleSendAlert}
        className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
          alertSent
            ? 'bg-emerald-600 text-white'
            : 'bg-rose-500 hover:bg-rose-600 text-white pink-glow active:scale-98'
        }`}
      >
        <Radio className="w-4 h-4" />
        <span>
          {alertSent
            ? 'নিকটবর্তী সকল নাগরিককে নীরব সংকেত প্রেরণ সম্পন্ন!'
            : 'নিকটবর্তী ২০০ মিটার পরিধিতে নীরব ঝুঁকি সংকেত পাঠান'}
        </span>
      </button>
    </div>
  );
};
