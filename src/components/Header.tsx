import React from 'react';
import {
  ShieldCheck,
  BellRing,
  Phone,
  Plus,
  LogIn,
  MapPin,
  TrendingUp,
  Brain,
  Radar,
  Users,
  Database,
  ChevronDown,
} from 'lucide-react';
import { User, DivisionName } from '../types';

export type ActiveTab = 'explore' | 'analytics' | 'threat' | 'radar' | 'database' | 'jury';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenReportModal: () => void;
  onOpenProfile: () => void;
  onOpenFlashAlert: () => void;
  onOpenDistrictAlert: () => void;
  onOpenSos: () => void;
  onTogglePanicMode?: () => void;
  onOpenNid: () => void;
  onOpenAuth: () => void;
  currentUser: User | null;
  userNidHashed: string;
  civicKarma: number;
  selectedDistrict: DivisionName;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenReportModal,
  onOpenProfile,
  onOpenDistrictAlert,
  onOpenSos,
  onOpenAuth,
  currentUser,
  selectedDistrict,
}) => {
  const navItems: {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'explore', label: 'মানচিত্র ও হটস্পট', shortLabel: 'মানচিত্র', icon: MapPin },
    { id: 'analytics', label: 'পরিসংখ্যান ও ট্রেন্ড', shortLabel: 'ট্রেন্ড', icon: TrendingUp },
    { id: 'threat', label: 'AI থ্রেট পূর্বাভাস', shortLabel: 'AI থ্রেট', icon: Brain },
    { id: 'radar', label: 'প্রক্সিমিটি রাডার', shortLabel: 'রাডার', icon: Radar },
    { id: 'jury', label: 'নাগরিক জুরি', shortLabel: 'জুরি', icon: Users },
    { id: 'database', label: 'সিন্ডিকেট রেজিস্ট্রি', shortLabel: 'রেজিস্ট্রি', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        
        {/* Zone 1: Brand Identity / Wordmark */}
        <div className="flex items-center min-w-0 shrink">
          <button
            onClick={() => onSelectTab('explore')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none min-w-0"
            title="হোম - নাগরিক প্রতিরক্ষা সেল"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform shrink-0">
              <ShieldCheck className="w-4.5 h-4.5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight font-bengali truncate whitespace-nowrap">
                  নাগরিক প্রতিরক্ষা সেল
                </span>
                <span className="hidden md:inline-block text-[9.5px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 shrink-0">
                  জাতীয় প্ল্যাটফর্ম
                </span>
              </div>
              <span className="hidden xl:block text-[10.5px] text-slate-500 font-medium font-bengali truncate">
                চাঁদাবাজি ও দুর্নীতি প্রতিরোধ রেজিস্ট্রি
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Compact & Adaptive for Desktop/Laptops) */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shrink-0">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2 py-1 xl:px-2.5 xl:py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-rose-600' : 'text-slate-500'}`} />
                <span className="hidden 2xl:inline">{item.label}</span>
                <span className="2xl:hidden">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Right Actions Cluster (Fully Responsive, Zero Overflow) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* District FCM Push Alert Selector */}
          <button
            onClick={onOpenDistrictAlert}
            title={`জেলা পুশ অ্যালার্ট সেটিংস — ${selectedDistrict}`}
            className="h-8.5 sm:h-9 px-2 sm:px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl flex items-center gap-1 sm:gap-1.5 text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <BellRing className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="font-bengali truncate max-w-[42px] sm:max-w-none">{selectedDistrict}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="লাইভ নোটিফিকেশন সক্রিয়" />
          </button>

          {/* Emergency SOS Hotline (hidden on small viewports to preserve space) */}
          <button
            onClick={onOpenSos}
            title="জরুরি সরকারি হটলাইন (৯৯৯ / ৩৩৩ / দুদক ১০৬)"
            className="hidden md:flex h-8.5 sm:h-9 px-2 sm:px-2.5 bg-pink-50 hover:bg-pink-100 text-rose-700 border border-rose-200 rounded-xl items-center gap-1 text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Phone className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="hidden lg:inline font-bengali">জরুরি সহায়তা</span>
          </button>

          {/* Primary Action Button: Submit Report */}
          <button
            onClick={onOpenReportModal}
            title="নতুন অভিযোগ দাখিল করুন"
            className="h-8.5 sm:h-9 px-2 sm:px-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white rounded-xl flex items-center gap-1 sm:gap-1.5 text-xs font-bold shadow-sm shadow-rose-600/25 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.8] shrink-0" />
            <span className="hidden sm:inline font-bengali">অভিযোগ দাখিল</span>
            <span className="sm:hidden font-bengali text-[11px]">রিপোর্ট</span>
          </button>

          {/* Citizen Account / Profile */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              title="নাগরিক প্রোফাইল ও সেটিংস"
              className="h-8.5 sm:h-9 pl-1 sm:pl-1.5 pr-1.5 sm:pr-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 sm:gap-2 text-left transition-all shadow-xs shrink-0"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-rose-100 shrink-0">
                <img
                  src={currentUser.avatarUrl || "https://i.ibb.co.com/vCMSKN3d/user-icon-simple-design-free-vector.jpg"}
                  className="w-full h-full object-cover"
                  alt="প্রোফাইল"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="hidden xl:flex flex-col text-left leading-tight">
                <span className="text-[11px] font-bold text-slate-800 truncate max-w-[80px]">
                  {currentUser.name}
                </span>
                <span className="text-[9.5px] text-slate-500 font-num">
                  কার্মা: {currentUser.karma}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 hidden sm:block" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              title="নাগরিক অ্যাকাউন্টে প্রবেশ"
              className="h-8.5 sm:h-9 px-2 sm:px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1 sm:gap-1.5 text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline font-bengali">প্রবেশ করুন</span>
              <span className="sm:hidden font-bengali text-[11px]">প্রবেশ</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
