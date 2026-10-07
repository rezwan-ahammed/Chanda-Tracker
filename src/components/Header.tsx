import React from 'react';
import { Bell, BellRing, Phone, Calculator, ShieldCheck, UserCheck, LogIn, Radio } from 'lucide-react';
import { User, DivisionName } from '../types';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenFlashAlert: () => void;
  onOpenDistrictAlert: () => void;
  onOpenSos: () => void;
  onTogglePanicMode: () => void;
  onOpenNid: () => void;
  onOpenAuth: () => void;
  currentUser: User | null;
  userNidHashed: string;
  civicKarma: number;
  selectedDistrict: DivisionName;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenFlashAlert,
  onOpenDistrictAlert,
  onOpenSos,
  onTogglePanicMode,
  onOpenNid,
  onOpenAuth,
  currentUser,
  userNidHashed,
  civicKarma,
  selectedDistrict,
}) => {
  const roleNameMap: Record<string, string> = {
    CITIZEN: 'নাগরিক',
    JUROR: 'জুরি',
    INVESTIGATOR: 'তদন্তকারী',
    MERCHANT: 'ব্যবসায়ী',
  };

  return (
    <header className="px-3.5 pt-3 pb-2 flex justify-between items-center z-30 bg-white/75 backdrop-blur-md border-b border-white/80 shrink-0">
      {/* Left: Citizen Profile Avatar & Brand Identity */}
      <div className="flex items-center gap-2">
        <button
          onClick={currentUser ? onOpenProfile : onOpenAuth}
          type="button"
          aria-label="নাগরিক প্রোফাইল দেখুন"
          className="relative w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 pink-glow cursor-pointer active:scale-95 transition-transform shrink-0"
        >
          <img
            src="https://i.ibb.co.com/vCMSKN3d/user-icon-simple-design-free-vector.jpg"
            className="w-full h-full rounded-full object-cover border-2 border-white bg-white"
            alt="নাগরিক প্রোফাইল"
            referrerPolicy="no-referrer"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[85px]">
              {currentUser ? currentUser.name : 'নাগরিক হাব'}
            </span>
            {currentUser ? (
              <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-full border border-rose-100">
                <UserCheck className="w-2.5 h-2.5 text-rose-500" />
                <span>{roleNameMap[currentUser.role] || 'নাগরিক'}</span>
              </span>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-0.5 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-colors"
              >
                <LogIn className="w-2.5 h-2.5" />
                <span>লগইন</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs font-black text-slate-900 tracking-tight">চাঁদাবাজি ট্র্যাকার</h1>
            <span className="text-[9.5px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-100 font-num">
              কার্মা: {currentUser ? currentUser.karma : civicKarma}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Triggers */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenDistrictAlert}
          title={`জেলা ভিত্তিক রিয়েল-টাইম পুশ অ্যালার্ট (FCM) — ${selectedDistrict}`}
          className="h-8 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all relative"
        >
          <BellRing className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[10.5px] font-extrabold">{selectedDistrict}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </button>

        <button
          onClick={onOpenFlashAlert}
          title="কমিউনিটি ফ্ল্যাশ অ্যালার্ট (২০০ মিটার নীরব সংকেত)"
          className="w-8 h-8 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenSos}
          title="জরুরি হটলাইন (৯৯৯ / ৩৩৩)"
          className="w-8 h-8 bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200/80 rounded-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onTogglePanicMode}
          title="ক্যালকুলেটর ক্যামোফ্লেজ (স্টিলথ মোড)"
          className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 rounded-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
        >
          <Calculator className="w-3.5 h-3.5 text-slate-600" />
        </button>
      </div>
    </header>
  );
};

