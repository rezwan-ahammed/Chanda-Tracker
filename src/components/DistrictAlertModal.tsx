import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  BellRing,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sparkles,
  Volume2,
  VolumeX,
  Send,
  Info
} from 'lucide-react';
import { DivisionName } from '../types';
import { requestFCMPermission, triggerDistrictPushAlert, subscribeToFirestoreAlerts } from '../firebase';

interface DistrictAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDistrict: DivisionName;
  onSelectDistrict: (district: DivisionName) => void;
  onSpotSelect?: (spotId: number) => void;
}

export const DistrictAlertModal: React.FC<DistrictAlertModalProps> = ({
  isOpen,
  onClose,
  selectedDistrict,
  onSelectDistrict,
  onSpotSelect,
}) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('civic_push_sound') !== 'false';
  });
  const [districtAlerts, setDistrictAlerts] = useState<any[]>([]);
  const [testSent, setTestSent] = useState<boolean>(false);

  const districts: DivisionName[] = [
    'ঢাকা',
    'চট্টগ্রাম',
    'রাজশাহী',
    'খুলনা',
    'সিলেট',
    'রংপুর',
    'বরিশাল',
    'ময়মনসিংহ',
  ];

  // Subscribe to real-time Firestore alerts for this district
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToFirestoreAlerts((alerts) => {
      const filtered = alerts.filter(
        (a) => a.district === selectedDistrict || a.severity === 'CRITICAL'
      );
      setDistrictAlerts(filtered);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [isOpen, selectedDistrict]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const token = await requestFCMPermission();
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
      if (token) {
        setFcmToken(token);
      }
    } catch (err) {
      console.warn('FCM Permission request error:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('civic_push_sound', String(next));
  };

  const handleTestPushAlert = async () => {
    setTestSent(true);
    // Send test high-threat extortion spot alert for selected district
    await triggerDistrictPushAlert({
      name: `${selectedDistrict} সেন্ট্রাল টার্মিনাল পয়েন্ট`,
      division: selectedDistrict,
      area: `${selectedDistrict} সদর`,
      rate: '২০০',
      unit: 'প্রতি পিকআপ',
      coords: [23.75, 90.39],
      id: Date.now(),
      status: 'RED',
    });

    setTimeout(() => {
      setTestSent(false);
    }, 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl p-5 max-h-[90dvh] overflow-y-auto shadow-2xl border border-white/95 space-y-4 animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-rose-100">
                  Firebase Cloud Messaging (FCM)
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                জেলা ভিত্তিক রিয়েল-টাইম পুশ অ্যালার্ট
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* District Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>আপনার জেলা / বিভাগ নির্ধারণ করুন:</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {districts.map((dist) => (
              <button
                key={dist}
                onClick={() => {
                  onSelectDistrict(dist);
                  localStorage.setItem('user_alert_district', dist);
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center ${
                  selectedDistrict === dist
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm ring-2 ring-rose-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {dist}
              </button>
            ))}
          </div>
          <p className="text-[10.5px] text-slate-500">
            নির্বাচিত <strong className="text-rose-600">{selectedDistrict}</strong> জেলায় কোনো নতুন উচ্চ-ঝুঁকিপূর্ণ (রেড জোন) চাঁদাবাজি স্পট রিপোর্ট হলে সাথে সাথে আপনার ডিভাইসে পুশ নোটিফিকেশন পৌঁছাবে।
          </p>
        </div>

        {/* Push Notification Permission Box */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">ব্রাউজার পুশ স্ট্যাটাস:</span>
            </div>
            <div>
              {notificationPermission === 'granted' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>সক্রিয় (Granted)</span>
                </span>
              ) : notificationPermission === 'denied' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>ব্লক করা (Denied)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <Info className="w-3 h-3 text-amber-600" />
                  <span>অনুমতি প্রয়োজন</span>
                </span>
              )}
            </div>
          </div>

          {notificationPermission !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isRequesting ? 'অনুমতি চাওয়া হচ্ছে...' : 'নোটিফিকেশন সক্রিয় করুন'}</span>
            </button>
          ) : (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
              <span className="text-[11px] text-slate-600 font-medium">অ্যালার্ট সাউন্ড ও ভাইব্রেশন:</span>
              <button
                onClick={handleToggleSound}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>শব্দ চালু</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>শব্দ বন্ধ</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Live Test Alert Trigger */}
        <div className="space-y-1.5">
          <button
            onClick={handleTestPushAlert}
            disabled={testSent}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              testSent
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-300'
            }`}
          >
            {testSent ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>টেস্ট অ্যালার্ট প্রেরিত হয়েছে! নোটিফিকেশন চেক করুন</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{selectedDistrict} জেলার টেস্ট পুশ অ্যালার্ট পাঠান (FCM Test)</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            এই বাটনে চাপ দিলে আপনার ডিভাইসে সরাসরি টেস্ট পুশ অ্যালার্ট আসবে ও ফায়ারবেস ক্লাউডে সংরক্ষিত হবে।
          </p>
        </div>

        {/* Live Alert Feed for Selected District */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>{selectedDistrict} জেলার সাম্প্রতিক জরুরি সতর্কতা</span>
            </span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              {districtAlerts.length} টি সক্রিয়
            </span>
          </div>

          {districtAlerts.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-4 text-center space-y-1 border border-slate-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700">বর্তমানে কোনো রেড জোন অ্যালার্ট নেই</p>
              <p className="text-[10.5px] text-slate-500">
                {selectedDistrict} জেলায় কোনো নতুন উচ্চ-ঝুঁকিপূর্ণ চাঁদাবাজি স্পট রিপোর্ট হলে এখানে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {districtAlerts.map((alt, idx) => (
                <div
                  key={alt.id || idx}
                  className="bg-rose-50/70 border border-rose-200 rounded-xl p-2.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700">{alt.title}</span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {alt.createdAt ? new Date(alt.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : 'এইমাত্র'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{alt.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            সম্পন্ন করুন
          </button>
        </div>
      </div>
    </div>
  );
};
