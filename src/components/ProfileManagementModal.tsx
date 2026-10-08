import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  User as UserIcon,
  Phone,
  MapPin,
  Briefcase,
  Lock,
  Sparkles,
  Award,
  FileText,
  ThumbsUp,
  Key,
  Copy,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  LogOut,
  Save,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { User, DivisionName, ExtortionSpot } from '../types';
import {
  clientUpdateUser,
  clientChangePassword,
  getCitizenTier,
  getTierBadgeInfo,
} from '../utils/safeApi';
import { syncUserProfileToFirestore } from '../firebase';

interface ProfileManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  userNidHashed: string;
  civicKarma: number;
  spots?: ExtortionSpot[];
  onUpdateUser: (updatedUser: User) => void;
  onOpenZkp: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigateToSpot?: (spot: ExtortionSpot) => void;
}

const CIVIC_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
  'https://i.ibb.co.com/vCMSKN3d/user-icon-simple-design-free-vector.jpg',
];

const DIVISIONS: DivisionName[] = [
  'ঢাকা',
  'চট্টগ্রাম',
  'রাজশাহী',
  'খুলনা',
  'সিলেট',
  'রংপুর',
  'বরিশাল',
  'ময়মনসিংহ',
];

type ProfileTab = 'EDIT_PROFILE' | 'KARMA_RANKS' | 'MY_ACTIVITY' | 'SECURITY';

export const ProfileManagementModal: React.FC<ProfileManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userNidHashed,
  civicKarma,
  spots = [],
  onUpdateUser,
  onOpenZkp,
  onOpenAuth,
  onLogout,
  onNavigateToSpot,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<ProfileTab>('EDIT_PROFILE');

  // Edit fields
  const [name, setName] = useState(currentUser?.name || 'নাগরিক');
  const [division, setDivision] = useState<DivisionName>(currentUser?.division || 'ঢাকা');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser?.avatarUrl || 'https://i.ibb.co.com/vCMSKN3d/user-icon-simple-design-free-vector.jpg'
  );
  const [anonymousMode, setAnonymousMode] = useState<boolean>(currentUser?.anonymousMode || false);

  // Password change fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const karma = currentUser?.karma ?? civicKarma;
  const currentTier = getCitizenTier(karma);
  const tierInfo = getTierBadgeInfo(currentTier);

  // User's spots
  const mySpots = spots.filter(
    s => s.reportedByHash === userNidHashed || (currentUser && currentUser.reportedSpotIds.includes(s.id))
  );

  const handleCopyZkp = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(userNidHashed);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('নামের ঘরটি পূরণ করুন।');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const updated: User = {
        ...(currentUser || {
          id: `usr_${Date.now()}`,
          phoneOrEmail: 'citizen@nagorik-hub.vercel.app',
          role: 'CITIZEN',
          zkpHash: userNidHashed,
          karma: civicKarma,
          createdAt: '২০২৬-১০-০৮',
          votedSpotIds: {},
          reportedSpotIds: [],
          isVerified: true,
        }),
        name: name.trim(),
        division,
        bio: bio.trim(),
        avatarUrl,
        anonymousMode,
        tier: currentTier,
      };

      // 1. Client & LocalStorage sync
      clientUpdateUser(updated);

      // 2. React state update
      onUpdateUser(updated);

      // 3. Firestore Cloud database sync
      await syncUserProfileToFirestore(updated);

      setSuccessMessage('প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'প্রোফাইল সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!oldPassword || !newPassword) {
      setErrorMessage('বর্তমান ও নতুন পাসওয়ার্ড লিখুন।');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('নতুন পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('নতুন পাসওয়ার্ড দুটি মিলছে না।');
      return;
    }

    const targetPhoneOrEmail = currentUser?.phoneOrEmail;
    if (!targetPhoneOrEmail) {
      setErrorMessage('ব্যবহারকারীর ফোন নম্বর বা ইমেইল পাওয়া যায়নি।');
      return;
    }

    const res = clientChangePassword(targetPhoneOrEmail, oldPassword, newPassword);
    if (!res.ok) {
      setErrorMessage(res.error || 'পাসওয়ার্ড পরিবর্তনে ব্যর্থতা।');
    } else {
      setSuccessMessage('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-xl rounded-t-[36px] sm:rounded-3xl p-6 shadow-2xl border border-white/90 max-h-[92dvh] overflow-y-auto animate-slideUp space-y-4">
        
        {/* Top Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                নাগরিক প্রোফাইল ও অ্যাকাউন্ট ব্যবস্থাপনা
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                জাতীয় নাগরিক সুরক্ষা সেল • ক্রিপ্টোগ্রাফিক ডেটা হাব
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Hero Badge Banner */}
        <div className="bg-gradient-to-r from-rose-50 via-pink-50/60 to-purple-50/40 p-4 rounded-2xl border border-rose-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full p-0.5 shadow-xs border border-slate-100">
                {tierInfo.icon}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierInfo.bgColor} ${tierInfo.textColor}`}>
                  {tierInfo.label}
                </span>
                <span className="text-[10px] bg-slate-200/80 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                  {division} বিভাগ
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-1 truncate">
                {currentUser?.name || name}
              </h3>
              <p className="text-[10.5px] text-slate-500 truncate">
                {currentUser?.phoneOrEmail || '01711000001'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-500 block font-bold uppercase">নাগরিক কার্মা</span>
            <span className="text-xl font-black text-rose-600 font-num">
              {karma}
            </span>
            <span className="text-[9px] text-slate-400 block">পয়েন্ট</span>
          </div>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('EDIT_PROFILE')}
            className={`flex-1 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'EDIT_PROFILE'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>প্রোফাইল সম্পাদন</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('KARMA_RANKS')}
            className={`flex-1 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'KARMA_RANKS'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>কার্মা ও সম্মাননা</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MY_ACTIVITY')}
            className={`flex-1 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'MY_ACTIVITY'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>আমার রিপোর্ট ({mySpots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            className={`flex-1 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'SECURITY'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>নিরাপত্তা ও ZKP</span>
          </button>
        </div>

        {/* Toast Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: EDIT PROFILE */}
        {activeTab === 'EDIT_PROFILE' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
            {/* Avatar Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-2">
                নাগরিক অবতার নির্বাচন করুন
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CIVIC_AVATARS.map((url, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAvatarUrl(url)}
                    className={`relative rounded-full p-0.5 shrink-0 transition-transform ${
                      avatarUrl === url
                        ? 'ring-2 ring-rose-500 scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Avatar ${idx}`}
                      className="w-10 h-10 rounded-full object-cover bg-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    {avatarUrl === url && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                পূর্ণ নাম *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার নাম লিখুন"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
                  required
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Division & Bio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  বিভাগ / কর্মাঞ্চল
                </label>
                <div className="relative">
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value as DivisionName)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:bg-white transition-all appearance-none"
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} বিভাগ
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  পেশা / পরিচয় (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="যেমন: ব্যবসায়ী, শিক্ষক, শিক্ষার্থী"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
                  />
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            {/* Anonymous Reporting Preference */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    ডিফল্ট বেনামী রিপোর্টিং মোড
                  </span>
                  <span className="text-[10px] text-slate-500">
                    অভিযোগ দাখিলের সময় স্বয়ংক্রিয়ভাবে পরিচয় ক্রিপ্টোগ্রাফিক হ্যাশে গোপন থাকবে
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={anonymousMode}
                  onChange={(e) => setAnonymousMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষিত হচ্ছে...' : 'প্রোফাইল পরিবর্তন সংরক্ষণ করুন'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: KARMA & RANKS */}
        {activeTab === 'KARMA_RANKS' && (
          <div className="space-y-4 pt-1">
            {/* Rank Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    বর্তমান অবস্থান
                  </span>
                  <h3 className="text-base font-black flex items-center gap-1.5 mt-0.5">
                    <span>{tierInfo.icon}</span>
                    <span>{tierInfo.label}</span>
                  </h3>
                </div>
                <span className="text-xs font-black text-rose-400 font-num bg-white/10 px-2.5 py-1 rounded-xl">
                  {karma} কার্মা
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                  <span>পরবর্তী স্তর: {tierInfo.nextPoints > 0 ? `${tierInfo.nextPoints} পয়েন্ট` : 'সর্বোচ্চ স্তর অর্জিত'}</span>
                  <span>{Math.min(100, Math.round((karma / (tierInfo.nextPoints || 500)) * 100))}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((karma / (tierInfo.nextPoints || 500)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Karma Rules Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">কার্মা অর্জনের নিয়মাবলি:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-emerald-600 block">+২৫ কার্মা</span>
                  <span className="text-[11px] text-slate-600">নতুন অভিযোগ দাখিল</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-600 block">+৫০ কার্মা</span>
                  <span className="text-[11px] text-slate-600">এনআইডি ZKP ভেরিফিকেশন</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-amber-600 block">+১০ কার্মা</span>
                  <span className="text-[11px] text-slate-600">প্রত্যক্ষদর্শী হিসেবে সাক্ষ্যদান</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-rose-600 block">+৫ কার্মা</span>
                  <span className="text-[11px] text-slate-600">জুরি কনসেনসাস ভোট</span>
                </div>
              </div>
            </div>

            {/* Badges Earned */}
            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                অর্জিত নাগরিক সম্মাননা ব্যাজ:
              </span>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2.5 py-1 bg-white rounded-lg border border-amber-200 text-amber-900 font-bold shadow-xs">
                  🛡️ ভেরিফাইড নাগরিক
                </span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-amber-200 text-amber-900 font-bold shadow-xs">
                  🔒 ZKP সুরক্ষিত একাউন্ট
                </span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-amber-200 text-amber-900 font-bold shadow-xs">
                  ⚖️ নির্ভরযোগ্য জুরি সদস্য
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MY ACTIVITY */}
        {activeTab === 'MY_ACTIVITY' && (
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">আমার দাখিলকৃত চাঁদাবাজি অভিযোগ:</span>
              <span className="text-slate-500 font-mono text-[11px]">{mySpots.length} টি</span>
            </div>

            {mySpots.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">এখনও কোনো অভিযোগ জমা পড়েনি</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  আপনার এলাকার চাঁদাবাজি স্পটের বিরুদ্ধে অভিযোগ দাখিল করুন এবং নাগরিক কার্মা অর্জন করুন।
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                {mySpots.map((spot) => (
                  <div
                    key={spot.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 hover:border-rose-300 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            spot.status === 'RED'
                              ? 'bg-rose-500'
                              : spot.status === 'YELLOW'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <h4 className="text-xs font-bold text-slate-900">{spot.name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {spot.division} বিভাগ • ৳ {spot.rate} ({spot.unit}) • {spot.category}
                      </p>
                    </div>

                    {onNavigateToSpot && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToSpot(spot);
                          onClose();
                        }}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 flex items-center gap-1 transition-colors shrink-0"
                      >
                        <span>ম্যাপে</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SECURITY & ZKP */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-4 pt-1">
            {/* ZKP Cryptographic Status Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-rose-500" />
                  জিরো-নলেজ প্রুফ (ZKP) হ্যাশ
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  এনক্রিপ্টেড
                </span>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 font-mono text-[11px]">
                <span className="truncate max-w-[280px]">{userNidHashed}</span>
                <button
                  type="button"
                  onClick={handleCopyZkp}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-sans flex items-center gap-1 transition-colors shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  {copiedHash ? 'কপি হয়েছে' : 'কপি'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenZkp();
                }}
                className="w-full py-2 bg-pink-50 hover:bg-pink-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
              >
                নতুন জাতীয় পরিচয়পত্র দিয়ে ZKP আপগ্রেড করুন (+৫০ কার্মা)
              </button>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-3 p-3.5 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800 block">
                পাসওয়ার্ড পরিবর্তন করুন
              </span>

              <div>
                <label className="block text-[10.5px] font-medium text-slate-600 mb-1">
                  বর্তমান পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-medium text-slate-600 mb-1">
                    নতুন পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="নতুন পাসওয়ার্ড"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-medium text-slate-600 mb-1">
                    নতুন পাসওয়ার্ড নিশ্চিত করুন
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="পুনরায় লিখুন"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
              >
                পাসওয়ার্ড আপডেট করুন
              </button>
            </form>

            {/* Account Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                অন্য একাউন্টে সুইচ করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
