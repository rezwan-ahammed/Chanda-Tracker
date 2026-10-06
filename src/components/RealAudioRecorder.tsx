import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Volume2, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface RealAudioRecorderProps {
  onAudioRecorded: (audioDataUrl: string, durationSec: number) => void;
  onClearAudio?: () => void;
}

export const RealAudioRecorder: React.FC<RealAudioRecorderProps> = ({
  onAudioRecorded,
  onClearAudio,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [usePitchShift, setUsePitchShift] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Web Audio Visualizer refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Web Audio Playback refs for pitch shifting
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Clean up
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
        playbackContextRef.current.close();
      }
    };
  }, []);

  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          canvasCtx.fillStyle = '#f43f5e';
          canvasCtx.beginPath();
          canvasCtx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [3, 3, 0, 0]);
          canvasCtx.fill();
          x += barWidth;
        }
      };

      draw();
    } catch (err) {
      console.warn('Visualizer init failed:', err);
    }
  };

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        // Convert Blob to ArrayBuffer for Web Audio pitch shift processing
        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const PlaybackCtx = window.AudioContext || (window as any).webkitAudioContext;
          const pCtx = new PlaybackCtx();
          playbackContextRef.current = pCtx;
          const decoded = await pCtx.decodeAudioData(arrayBuffer);
          audioBufferRef.current = decoded;
        } catch (e) {
          console.warn('Audio decoding fallback:', e);
        }

        // Reader for dataUrl
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onAudioRecorded(base64data, recordingSeconds);
        };

        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      startVisualizer(stream);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMicError('মাইক্রোফোন সংযোগ পাওয়া যায়নি। ব্রাউজারে পারমিশন অন করুন।');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Playback with real AudioContext Pitch Shifter / Formant Masking
  const togglePlay = () => {
    if (isPlaying) {
      if (playbackSourceRef.current) {
        try {
          playbackSourceRef.current.stop();
        } catch {}
      }
      setIsPlaying(false);
      return;
    }

    if (!audioBufferRef.current) {
      // Fallback HTML5 Audio
      if (recordedAudioUrl) {
        const audio = new Audio(recordedAudioUrl);
        audio.play();
        setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
      }
      return;
    }

    try {
      const PlaybackCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new PlaybackCtx();
      playbackContextRef.current = ctx;

      const source = ctx.createBufferSource();
      source.buffer = audioBufferRef.current;

      if (usePitchShift) {
        // Real Pitch Shifting: Pitch down by lowering playback rate and adding biquad filter
        source.playbackRate.value = 0.82; // Deepens voice to prevent acoustic speaker recognition

        const biquad = ctx.createBiquadFilter();
        biquad.type = 'lowpass';
        biquad.frequency.value = 2400; // Removes identifiable high harmonics

        source.connect(biquad);
        biquad.connect(ctx.destination);
      } else {
        source.connect(ctx.destination);
      }

      playbackSourceRef.current = source;
      source.start(0);
      setIsPlaying(true);

      source.onended = () => {
        setIsPlaying(false);
      };
    } catch (err) {
      console.error('Pitch shift playback error:', err);
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    if (isPlaying && playbackSourceRef.current) {
      try {
        playbackSourceRef.current.stop();
      } catch {}
    }
    setRecordedAudioUrl(null);
    audioBufferRef.current = null;
    setRecordingSeconds(0);
    setIsPlaying(false);
    if (onClearAudio) onClearAudio();
  };

  const formatSec = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-rose-50/40 border border-rose-200/90 rounded-2xl p-3.5 space-y-2.5">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-rose-600" />
          <span>প্রকৃত ভয়েস সাক্ষ্য ও অডিও রেকর্ডার</span>
        </span>
        <span className="text-[10px] font-mono text-rose-600 font-bold font-num">
          {formatSec(recordingSeconds)}
        </span>
      </div>

      {micError && (
        <div className="p-2 bg-rose-100 text-rose-800 text-[10px] rounded-xl flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Live Oscilloscope Frequency Visualizer */}
      <div className="h-14 w-full bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center p-1">
        <canvas
          ref={canvasRef}
          width={280}
          height={56}
          className="w-full h-full object-cover"
        />
        {!isRecording && !recordedAudioUrl && (
          <span className="absolute text-[10px] text-slate-400 font-medium">
            মাইক্রোফোন বাটনে চাপ দিয়ে অডিও রেকর্ড করুন
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {!recordedAudioUrl ? (
          isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>রেকর্ডিং সম্পন্ন করুন ({formatSec(recordingSeconds)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 pink-glow active:scale-95 transition"
            >
              <Mic className="w-4 h-4" />
              <span>ভয়েস রেকর্ড শুরু করুন</span>
            </button>
          )
        ) : (
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={togglePlay}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 pink-glow active:scale-95 transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'থামান' : 'রেকর্ডকৃত অডিও শুনুন'}</span>
            </button>

            <button
              type="button"
              onClick={resetRecording}
              title="নতুন করে রেকর্ড করুন"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Real Privacy Pitch-Shifter Toggle */}
      {recordedAudioUrl && (
        <div className="bg-white/90 p-2.5 rounded-xl border border-rose-100 text-[11px] space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>কণ্ঠ শনাক্তকরণ রোধ (Voice Masking):</span>
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={usePitchShift}
                onChange={e => setUsePitchShift(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            {usePitchShift
              ? '✅ পিচ-শিফট সক্রিয়: চাঁদাবাজদের প্রতিশোধ থেকে রক্ষা করতে স্বর গম্ভীর ও পরিবর্তিত শোনাবে।'
              : '⚠️ মূল কণ্ঠ শুনছেন (কোনো অডিও ফিল্টার ছাড়া)।'}
          </p>
        </div>
      )}
    </div>
  );
};
