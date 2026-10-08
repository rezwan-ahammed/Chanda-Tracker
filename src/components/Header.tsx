import React from 'react';
import {
  ShieldCheck,
  BellRing,
  Phone,
  Plus,
  LogIn,
  UserCheck,
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
  onOpenFlashAlert,
  onOpenDistrictAlert,
  onOpenSos,
  onOpenAuth,
  currentUser,
  civicKarma,
  selectedDistrict,
}) => {
  const roleNameMap: Record<string, string> = {
    CITIZEN: 'নাগরিক',
    JUROR: 'জুরি সদস্য',
    INVESTIGATOR: 'অনুসন্ধানী প্রতিনিধি',
    MERCHANT: 'ব্যবসায়ী',
  };

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'explore', label: 'মানচিত্র ও হটস্পট', icon: MapPin },
    { id: 'analytics', label: 'পরিসংখ্যান ও ট্রেন্ড', icon: TrendingUp },
    { id: 'threat', label: 'AI থ্রেট পূর্বাভাস', icon: Brain },
    { id: 'radar', label: 'প্রক্সিমিটি রাডার', icon: Radar },
    { id: 'jury', label: 'নাগরিক জুরি', icon: Users },
    { id: 'database', label: 'সিন্ডিকেট রেজিস্ট্রি', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Identity / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('explore')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900 tracking-tight font-bengali">
                  নাগরিক প্রতিরক্ষা সেল
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  জাতীয় প্ল্যাটফর্ম
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium font-bengali">
                চাঁদাবাজি ও দুর্নীতি প্রতিরোধ রেজিস্ট্রি
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Navigation Tabs (Google / Linear standard) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions Cluster */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* District FCM Push Alert Selector */}
          <button
            onClick={onOpenDistrictAlert}
            title={`জেলা পুশ অ্যালার্ট সেটিংস — ${selectedDistrict}`}
            className="h-9 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs"
          >
            <BellRing className="w-3.5 h-3.5 text-rose-600" />
            <span className="font-bengali">{selectedDistrict}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="রিয়েল-টাইম পুশ সক্রিয়" />
          </button>

          {/* Emergency SOS Hotline */}
          <button
            onClick={onOpenSos}
            title="জরুরি সরকারি হটলাইন (৯৯৯ / ৩৩৩ / দুদক ১০৬)"
            className="hidden sm:flex h-9 px-2.5 bg-pink-50 hover:bg-pink-100 text-rose-700 border border-rose-200 rounded-xl items-center gap-1 text-xs font-bold transition-all shadow-xs"
          >
            <Phone className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden md:inline font-bengali">জরুরি সহায়তা</span>
          </button>

          {/* Primary Action Button: Submit Report */}
          <button
            onClick={onOpenReportModal}
            className="h-9 px-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-sm shadow-rose-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span className="hidden sm:inline font-bengali">অভিযোগ দাখিল</span>
            <span className="sm:hidden font-bengali">রিপোর্ট</span>
          </button>

          {/* Citizen Account / Profile */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="h-9 pl-1.5 pr-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-left transition-all shadow-xs"
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
                <span className="text-[11px] font-bold text-slate-800 truncate max-w-[90px]">
                  {currentUser.name}
                </span>
                <span className="text-[9.5px] text-slate-500 font-num">
                  কার্মা: {currentUser.karma}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="font-bengali">প্রবেশ করুন</span>
            </button>
          )}

        </div>

      </div>

      {/* Mobile Sub-Header Segmented Navigation */}
      <div className="lg:hidden border-t border-slate-100 bg-white px-2 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-rose-50 text-rose-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
