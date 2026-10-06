import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  UserPlus,
  AlertCircle,
  Sparkles,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { DivisionName, UserRole, User } from '../types';
import { signInWithGoogle } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form fields
  const [name, setName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [division, setDivision] = useState<DivisionName>('ঢাকা');
  const [role, setRole] = useState<UserRole>('CITIZEN');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!phoneOrEmail || !password) {
      setErrorMessage('মোবাইল নম্বর/ইমেইল এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'লগইন ব্যর্থ হয়েছে।');
      }

      setSuccessMessage('সফলভাবে লগইন হয়েছে!');
      if (data.token) {
        localStorage.setItem('civic_auth_token', data.token);
      }
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'লগইন করতে সমস্যা হচ্ছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim() || !phoneOrEmail.trim() || !password) {
      setErrorMessage('সকল প্রয়োজনীয় ঘর পূরণ করুন।');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phoneOrEmail: phoneOrEmail.trim(),
          password,
          division,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'নিবন্ধন সম্পন্ন করা যায়নি।');
      }

      setSuccessMessage('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!');
      if (data.token) {
        localStorage.setItem('civic_auth_token', data.token);
      }
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'রেজিস্ট্রেশনে ত্রুটি ঘটেছে।');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login integration
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        // Register or login on backend
        const email = fbUser.email || `user_${fbUser.uid.substring(0, 8)}@google.auth`;
        const displayName = fbUser.displayName || 'গুগল নাগরিক';

        // Check login or create
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneOrEmail: email, password: fbUser.uid.substring(0, 10) }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.token) localStorage.setItem('civic_auth_token', data.token);
            onAuthSuccess(data.user, data.token);
            onClose();
            return;
          }
        } catch {
          // not found, register
        }

        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: displayName,
            phoneOrEmail: email,
            password: fbUser.uid.substring(0, 10),
            division: 'ঢাকা',
            role: 'CITIZEN',
          }),
        });

        if (regRes.ok) {
          const data = await regRes.json();
          if (data.token) localStorage.setItem('civic_auth_token', data.token);
          onAuthSuccess(data.user, data.token);
          onClose();
        } else {
          // Fallback user object
          const localUser: User = {
            id: `usr_${fbUser.uid.substring(0, 10)}`,
            name: displayName,
            phoneOrEmail: email,
            division: 'ঢাকা',
            role: 'CITIZEN',
            zkpHash: `sha256_${fbUser.uid.substring(0, 12)}`,
            karma: 150,
            createdAt: '২০২৬-১০-০৬',
            votedSpotIds: {},
            reportedSpotIds: [],
            isVerified: true,
          };
          onAuthSuccess(localUser);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'গুগল সাইন-ইন সম্পন্ন হয়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick account switch helper
  const handleQuickLogin = (email: string, pass: string) => {
    setPhoneOrEmail(email);
    setPassword(pass);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-[36px] sm:rounded-3xl p-6 shadow-2xl border border-white/90 max-h-[92dvh] overflow-y-auto animate-slideUp">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">
                {mode === 'LOGIN' ? 'নাগরিক লগইন' : 'নাগরিক নিবন্ধন'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                জাতীয় চাঁদাবাজি প্রতিরোধে সুরক্ষিত একাউন্ট
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

        {/* Mode Selector Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mt-4">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'LOGIN'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            লগইন
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'REGISTER'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            নতুন নিবন্ধন
          </button>
        </div>

        {/* Error or Success notification */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Forms */}
        {mode === 'LOGIN' ? (
          <form onSubmit={handleLogin} className="space-y-3.5 mt-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                মোবাইল নম্বর অথবা ইমেইল
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  placeholder="যেমন: 01711000001 বা email@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>যাচাই হচ্ছে...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>লগইন করুন</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 mt-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                পূর্ণ নাম
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: সাকিব হাসান"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:bg-white"
                  required
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                মোবাইল নম্বর অথবা ইমেইল
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  placeholder="01XXXXXXXXX বা ইমেইল"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:bg-white"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  বিভাগ
                </label>
                <div className="relative">
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value as DivisionName)}
                    className="w-full pl-7 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:bg-white"
                  >
                    <option value="ঢাকা">ঢাকা</option>
                    <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                    <option value="রাজশাহী">রাজশাহী</option>
                    <option value="সিলেট">সিলেট</option>
                    <option value="খুলনা">খুলনা</option>
                    <option value="রংপুর">রংপুর</option>
                    <option value="বরিশাল">বরিশাল</option>
                    <option value="ময়মনসিংহ">ময়মনসিংহ</option>
                  </select>
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  নাগরিক দায়িত্ব
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full pl-7 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:bg-white"
                  >
                    <option value="CITIZEN">সাধারণ নাগরিক</option>
                    <option value="JUROR">জুরি সদস্য</option>
                    <option value="INVESTIGATOR">অনুসন্ধানী প্রতিনিধি</option>
                  </select>
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="গোপন পাসওয়ার্ড দিন"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-400 focus:bg-white"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>তৈরি হচ্ছে...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
            <span className="bg-white px-2">অথবা তাৎক্ষণিক লগইন</span>
          </div>
        </div>

        {/* Google Authentication */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google অ্যাকাউন্ট দিয়ে প্রবেশ করুন
        </button>

        {/* Quick Test Profiles for User Convenience */}
        <div className="mt-4 p-3 bg-gradient-to-br from-rose-50/60 to-pink-50/40 rounded-xl border border-rose-100/70">
          <p className="text-[10px] font-bold text-slate-600 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-rose-500" />
            দ্রুত এক ক্লিকে পরীক্ষামূলক প্রোফাইল নির্বাচন:
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => handleQuickLogin('01711000001', 'password123')}
              className="p-1.5 bg-white rounded-lg border border-rose-200 text-slate-700 font-semibold hover:border-rose-400 hover:text-rose-600 transition-colors text-center"
            >
              তানভীর (নাগরিক)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('01811000002', 'password123')}
              className="p-1.5 bg-white rounded-lg border border-amber-200 text-slate-700 font-semibold hover:border-amber-400 hover:text-amber-600 transition-colors text-center"
            >
              ফারহানা (জুরি)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('01911000003', 'password123')}
              className="p-1.5 bg-white rounded-lg border border-blue-200 text-slate-700 font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors text-center"
            >
              মাহবুব (তদন্তকারী)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
