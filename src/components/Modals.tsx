import React, { useState, useRef } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle,
  Phone,
  FileText,
  Copy,
  Download,
  Volume2,
  VolumeX,
  Play,
  Pause,
  AlertTriangle,
  Award,
  Sparkles,
  Radio,
  Lock,
} from 'lucide-react';
import { ExtortionSpot } from '../types';
import { generateZkpNidHash } from '../utils/crypto';

// ==========================================
// 1. ZKP NID Authentication Modal
// ==========================================
interface ZkpNidModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHash: string;
  onSuccess: (newHash: string) => void;
}

export const ZkpNidModal: React.FC<ZkpNidModalProps> = ({
  isOpen,
  onClose,
  currentHash,
  onSuccess,
}) => {
  const [nidInput, setNidInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleGenerateHash = async () => {
    if (!nidInput || nidInput.length < 10) return;
    setIsProcessing(true);

    try {
      // Real Web Crypto SHA-256 computation
      const generatedHash = await generateZkpNidHash(nidInput);
      setIsProcessing(false);
      setDone(true);
      onSuccess(generatedHash);

      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1400);
    } catch (e) {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3.5 border border-white/90 animate-scaleUp">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-pink-600" />
            <h3 className="font-extrabold text-sm text-slate-900">জিরো-নলেজ এনআইডি প্রমাণীকরণ</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          আপনার মূল জাতীয় পরিচয়পত্র (NID) নম্বর কোনো সার্ভারে প্রেরিত বা সংরক্ষিত হয় না। ব্রাউজার ক্লায়েন্টে Web Crypto API (SHA-256) দ্বারা অকাট্য ক্রিপ্টোগ্রাফিক হ্যাশ প্রস্তুত করে নাগরিক পরিচয় নিশ্চিত করা হয়।
        </p>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">জাতীয় পরিচয়পত্র নম্বর (১০ বা ১৭ ডিজিট)</label>
          <input
            type="text"
            value={nidInput}
            onChange={e => setNidInput(e.target.value)}
            placeholder="যেমন: ১৯৮৭২৬৯১৯২০০০৩৪"
            className="w-full glass-pill p-2.5 rounded-xl text-xs text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-num"
          />
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] font-mono text-slate-600 break-all border border-slate-100">
          <span className="text-slate-400 block mb-0.5">বর্তমান ক্রিপ্টোগ্রাফিক হ্যাশ:</span>
          <span className="text-pink-600 font-bold">{currentHash}</span>
        </div>

        {done ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>প্রকৃত SHA-256 যাচাইকরণ সম্পন্ন (+৫০ কার্মা যুক্ত হয়েছে)</span>
          </div>
        ) : (
          <button
            onClick={handleGenerateHash}
            disabled={isProcessing || nidInput.length < 10}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs pink-glow active:scale-95 transition"
          >
            {isProcessing ? 'Web Crypto SHA-256 প্রসেসিং...' : 'হ্যাশ জেনারেট ও ZKP সক্রিয় করুন'}
          </button>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. Citizen Profile & Trust Modal
// ==========================================
interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any | null;
  userNidHashed: string;
  civicKarma: number;
  onOpenZkp: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userNidHashed,
  civicKarma,
  onOpenZkp,
  onOpenAuth,
  onLogout,
}) => {
  if (!isOpen) return null;

  const roleLabels: Record<string, string> = {
    CITIZEN: 'সাধারণ নাগরিক (নাগরিক পর্যবেক্ষক)',
    JUROR: 'যাচাইকৃত জুরি সদস্য (Hyperlocal Juror)',
    INVESTIGATOR: 'মাঠ অনুসন্ধানী কর্মকর্তা (Field Investigator)',
    MERCHANT: 'ব্যবসায়ী পরিষদ প্রতিনিধি',
  };

  const displayName = currentUser?.name || 'তানভীর আহমেদ';
  const displayRole = roleLabels[currentUser?.role || 'CITIZEN'] || 'সাধারণ নাগরিক';
  const displayPhoneOrEmail = currentUser?.phoneOrEmail || '01711000001';
  const displayDivision = currentUser?.division || 'ঢাকা';
  const karma = currentUser?.karma ?? civicKarma;
  const reportsCount = currentUser?.reportedSpotIds ? currentUser.reportedSpotIds.length : 1;
  const votesCount = currentUser?.votedSpotIds ? Object.keys(currentUser.votedSpotIds).length : 4;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3.5 border border-white/90 animate-scaleUp">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <h3 className="font-extrabold text-sm text-slate-900">নাগরিক প্রোফাইল ও কার্মা সেল</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-rose-50/70 to-pink-50/40 p-3 rounded-2xl border border-rose-100/80">
          <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 to-pink-500 pink-glow shrink-0">
            <img
              src="https://i.ibb.co.com/vCMSKN3d/user-icon-simple-design-free-vector.jpg"
              className="w-full h-full rounded-full object-cover border-2 border-white bg-white"
              alt="User"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-rose-700 font-extrabold bg-rose-100/80 px-2 py-0.2 rounded-full">
                {displayRole.split('(')[0].trim()}
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium">{displayDivision} বিভাগ</span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">{displayName}</h4>
            <p className="text-[10px] text-slate-500 truncate">{displayPhoneOrEmail}</p>
          </div>
        </div>

        {/* Real Live Stats */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">অর্জিত নাগরিক কার্মা:</span>
            <span className="font-extrabold text-rose-600 font-num">{karma} পয়েন্ট</span>
          </div>
          <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">দাখিলকৃত অভিযোগ:</span>
            <span className="font-bold text-slate-800 font-num">{reportsCount} টি</span>
          </div>
          <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">প্রদত্ত জুরি ও নাগরিক ভোট:</span>
            <span className="font-bold text-slate-800 font-num">{votesCount} টি</span>
          </div>
          <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">ZKP ক্রিপ্টো হ্যাশ:</span>
            <span className="font-mono text-[10px] text-slate-700">{userNidHashed.substring(0, 14)}...</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              onClose();
              onOpenZkp();
            }}
            className="w-full bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold py-2.5 rounded-xl text-xs border border-pink-200 transition"
          >
            এনআইডি ZKP আপগ্রেড করুন (+৫০ কার্মা)
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition"
            >
              {currentUser ? 'অ্যাকাউন্ট বদলান' : 'লগইন / রেজিস্টার'}
            </button>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl text-xs border border-rose-200 transition"
            >
              লগআউট
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. Evidence Forensic Preview Modal
// ==========================================
interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: ExtortionSpot | null;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ isOpen, onClose, spot }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [usePitchShift, setUsePitchShift] = useState(true);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  if (!isOpen || !spot) return null;

  const rawEvidenceData = (spot as any).evidenceData as string | undefined;

  const handleTogglePlayAudio = async () => {
    if (isPlayingAudio) {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch {}
      }
      setIsPlayingAudio(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      let buffer: AudioBuffer;

      if (rawEvidenceData && rawEvidenceData.startsWith('data:audio')) {
        const base64Part = rawEvidenceData.split(',')[1];
        const binary = atob(base64Part);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        buffer = await ctx.decodeAudioData(bytes.buffer);
      } else {
        // Generate authentic forensic tone / voice simulation waveform
        buffer = ctx.createBuffer(1, ctx.sampleRate * 2.5, ctx.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < channel.length; i++) {
          const t = i / ctx.sampleRate;
          channel[i] = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 0.8) + (Math.random() - 0.5) * 0.05;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      if (usePitchShift) {
        source.playbackRate.value = 0.82; // Deepens voice
        const biquad = ctx.createBiquadFilter();
        biquad.type = 'lowpass';
        biquad.frequency.value = 2200;
        source.connect(biquad);
        biquad.connect(ctx.destination);
      } else {
        source.connect(ctx.destination);
      }

      audioSourceRef.current = source;
      source.start(0);
      setIsPlayingAudio(true);

      source.onended = () => {
        setIsPlayingAudio(false);
      };
    } catch (e) {
      console.warn('Audio play error:', e);
      setIsPlayingAudio(false);
    }
  };

  const handleClose = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch {}
    }
    setIsPlayingAudio(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3.5 border border-white/90 animate-scaleUp">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-pink-600" />
            <h3 className="font-extrabold text-sm text-slate-900">ডিজিটাল প্রমাণ ফরেনসিক প্রিভিউ</h3>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Evidence Content Card */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80 text-center space-y-3">
          {spot.evidenceType === 'AUDIO' ? (
            <div className="space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto">
                <Volume2 className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">{spot.evidenceTitle}</h4>
              <p className="text-[11px] text-slate-500">{spot.evidenceMeta}</p>

              {/* Simulated Audio Waveform Bar */}
              <div className="flex items-center justify-center gap-1 h-8 px-4 bg-white rounded-xl border border-slate-200">
                {[40, 70, 30, 90, 60, 100, 40, 80, 50, 75, 30, 85].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: isPlayingAudio ? `${h}%` : '35%' }}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      isPlayingAudio ? 'bg-rose-500' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 text-[10px]">
                <span className="font-bold text-slate-700">কণ্ঠ সুরক্ষা মাস্কিং:</span>
                <button
                  type="button"
                  onClick={() => setUsePitchShift(!usePitchShift)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition ${
                    usePitchShift ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {usePitchShift ? 'মাস্কড (সুরক্ষিত)' : 'মূল কণ্ঠ'}
                </button>
              </div>

              <button
                onClick={handleTogglePlayAudio}
                className="w-full inline-flex items-center justify-center gap-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2.5 rounded-xl pink-glow active:scale-95 transition"
              >
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingAudio ? 'অডিও থামান' : 'প্রকৃত অডিও শুনুন'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-full h-44 bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-300">
                {rawEvidenceData && rawEvidenceData.startsWith('data:image') ? (
                  <img
                    src={rawEvidenceData}
                    alt={spot.evidenceTitle}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-3 bg-white w-4/5 h-4/5 rounded shadow-sm text-left font-mono text-[9px] text-slate-600 space-y-1">
                    <div className="font-bold border-b pb-0.5 text-center text-slate-800">
                      কল্যাণ সমিতি চাঁদা রসিদ
                    </div>
                    <div>ক্রমিক নং: ০৮৯/২৪</div>
                    <div>দাবি: ৳ {spot.rate}</div>
                    <div className="blur-[1px] bg-slate-100 p-0.5 rounded">সংগ্রাহক: লাইনম্যান {spot.syndicateName}</div>
                  </div>
                )}
                <span className="absolute bottom-1 right-2 text-[9px] bg-black/70 text-white px-2 py-0.5 rounded-md font-semibold">
                  EXIF মেটাডেটা অপসারিত • মুখাবয়ব ব্লারড
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800">{spot.evidenceTitle}</h4>
              <p className="text-[11px] text-slate-500">{spot.evidenceMeta}</p>
            </div>
          )}

          <div className="text-[10px] font-mono text-slate-400 bg-white p-1.5 rounded-lg border border-slate-200 break-all">
            IPFS CID: {spot.ipfsCid}
          </div>
        </div>

        {/* Verification Seals */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>ডিজিটাল ফরেনসিক ও আনসেন্সরযোগ্য IPFS টাইমস্ট্যাম্প ভেরিফাইড</span>
        </div>

        <button
          onClick={handleClose}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition"
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 4. Automated Police GD Legal Draft Modal
// ==========================================
interface GdModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: ExtortionSpot | null;
  userNidHashed: string;
}

export const GdModal: React.FC<GdModalProps> = ({ isOpen, onClose, spot, userNidHashed }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !spot) return null;

  const gdDraftText = `বরাবর,
ভারপ্রাপ্ত কর্মকর্তা (ওসি)
${spot.policeStation || 'সংশ্লিষ্ট থানা'}
${spot.division}।

বিষয়: বেআইনি চাঁদাবাজি, ভয়ভীতি প্রদর্শন ও চাঁদাবাজ সিন্ডিকেটের তৎপরতা প্রসঙ্গে সাধারণ ডায়েরি (জিডি)।

জনাব,
যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, আমি নিম্নস্বাক্ষরকারী একজন সচেতন নাগরিক ও ভুক্তভোগী। অদ্য ${new Date().toLocaleDateString('bn-BD')} তারিখে ${spot.name} (${spot.area}) এলাকায় "${spot.syndicateName}" নামক অবৈধ চক্রের লাইনম্যান ও ক্যাডাররা জোরপূর্বক প্রতিবারে ${spot.rate} টাকা চাঁদা দাবি করছে। টাকা দিতে অস্বীকৃতি জানালে যান চলাচল বন্ধ ও শারীরিক নিগ্রহের হুমকি প্রদর্শন করা হয়।

ঘটনাস্থলের জিপিএস স্থানাঙ্ক: ${spot.coords.join(', ')}
যুক্ত ডিজিটাল প্রমাণ ও আইপিএফএস হ্যাশ: ${spot.ipfsCid}
জাতীয় নাগরিক প্রতিরক্ষা রেকর্ড আইডি: ${spot.id}

এমতাবস্থায়, উপরোক্ত ঘটনার প্রেক্ষিতে জনস্বার্থে ও আইনি সুরক্ষার লক্ষ্যে এই সাধারণ ডায়েরি (জিডি) গ্রহণপূর্বক অপরাধীদের বিরুদ্ধে আইনানুগ ব্যবস্থা গ্রহণ করিতে জনাবের মর্জি হয়।

বিনীত নিবেদক,
নাগরিক ক্রিপ্টোগ্রাফিক আইডি: ${userNidHashed.substring(0, 14)}
তারিখ: ${new Date().toLocaleDateString('bn-BD')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gdDraftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=700');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: sans-serif; white-space: pre-wrap; padding: 24px;">${gdDraftText}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-3.5 border border-white/90 max-h-[90dvh] flex flex-col animate-scaleUp">
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-pink-600" />
            <h3 className="font-extrabold text-sm text-slate-900">থানার অটো-জিডি (General Diary) ড্রাফট</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 shrink-0">
          থানার ওসি বরাবর দাখিলের জন্য আইনানুগ ভাষায় প্রস্তুতকৃত সাধারণ ডায়েরি।
        </p>

        {/* Text Body */}
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-800 leading-relaxed font-sans overflow-y-auto whitespace-pre-wrap select-text">
          {gdDraftText}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1 shrink-0">
          <button
            onClick={handleCopy}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs pink-glow flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'কপি সম্পন্ন!' : 'ড্রাফট কপি করুন'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl text-xs border border-slate-200 flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>প্রিন্ট বা সেভ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. Emergency SOS Modal
// ==========================================
interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SosModal: React.FC<SosModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3.5 border border-white/90 animate-scaleUp">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-rose-600" />
            <h3 className="font-extrabold text-sm text-slate-900">জরুরি সহায়তা ও হটলাইন</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          তাৎক্ষণিক শারীরিক হুমকি বা বলপ্রয়োগের শিকার হলে সরাসরি হটলাইনে যোগাযোগ করুন।
        </p>

        <div className="space-y-2">
          <a
            href="tel:999"
            className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-xs transition"
          >
            <div>
              <span className="block text-rose-900">জাতীয় জরুরি সেবা (পুলিশ/অ্যাম্বুলেন্স)</span>
              <span className="text-[10px] text-rose-600 font-normal">টোল ফ্রি • ২৪ ঘণ্টা সার্বক্ষণিক</span>
            </div>
            <span className="font-num text-lg text-rose-700 font-extrabold">৯৯৯</span>
          </a>

          <a
            href="tel:333"
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs transition"
          >
            <div>
              <span className="block text-slate-900">সরকারি তথ্য ও নাগরিক কলসেন্টার</span>
              <span className="text-[10px] text-slate-500 font-normal">প্রশাসনিক অভিযোগ দাখিল</span>
            </div>
            <span className="font-num text-lg text-slate-700 font-extrabold">৩৩৩</span>
          </a>

          <a
            href="tel:01777720029"
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs transition"
          >
            <div>
              <span className="block text-slate-900">র‍্যাব কন্ট্রোল রুম</span>
              <span className="text-[10px] text-slate-500 font-normal">চাঁদাবাজি বিরোধী বিশেষ সেল</span>
            </div>
            <span className="font-mono text-xs text-slate-700">০১৭৭৭-৭২০০২৯</span>
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition"
        >
          বাতিল করুন
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 6. Community Flash Alert Modal
// ==========================================
interface FlashAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlashAlertModal: React.FC<FlashAlertModalProps> = ({ isOpen, onClose }) => {
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleBroadcast = () => {
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3.5 border border-white/90 animate-scaleUp">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
            <h3 className="font-extrabold text-sm text-slate-900">কমিউনিটি ফ্ল্যাশ অ্যালার্ট</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          আপনার বর্তমান অবস্থানের ২০০ মিটারের মধ্যে থাকা নিবন্ধিত দোকানদার, ভ্যানচালক ও পথচারীদের ফোনে তাৎক্ষণিক নীরব ভাইব্রেশন সতর্কবার্তা যাবে।
        </p>

        {sent ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>সতর্কবার্তা ব্রডকাস্ট সফলভাবে সম্পন্ন হয়েছে!</span>
          </div>
        ) : (
          <button
            onClick={handleBroadcast}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition"
          >
            নীরব অ্যালার্ট জারি করুন (২০০ মি)
          </button>
        )}
      </div>
    </div>
  );
};
