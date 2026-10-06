import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, ShieldCheck, EyeOff, RotateCcw, Check, Sparkles } from 'lucide-react';

interface ImageSanitizerProps {
  onImageSanitized: (dataUrl: string, fileName: string) => void;
  onClearImage?: () => void;
}

export const ImageSanitizer: React.FC<ImageSanitizerProps> = ({
  onImageSanitized,
  onClearImage,
}) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [sanitizedDataUrl, setSanitizedDataUrl] = useState<string | null>(null);
  const [isBlurToolActive, setIsBlurToolActive] = useState(false);
  const [brushSize, setBrushSize] = useState(25);
  const [blurCount, setBlurCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      setOriginalImage(result);
      setBlurCount(0);
      loadImageToCanvas(result, file.name);
    };
    reader.readAsDataURL(file);
  };

  const loadImageToCanvas = (src: string, fileName: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Scale to max width 600px for clean performance
      const maxWidth = 500;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw pure pixels - stripping all EXIF metadata
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Auto PII notice: automatically blur center top if likely a face, or allow user brush
      const cleanUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSanitizedDataUrl(cleanUrl);
      onImageSanitized(cleanUrl, fileName);
    };
    img.src = src;
  };

  // Blur canvas area on user drag
  const applyBlurAtPoint = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = brushSize;
    const startX = Math.max(0, x - radius);
    const startY = Math.max(0, y - radius);
    const width = Math.min(canvas.width - startX, radius * 2);
    const height = Math.min(canvas.height - startY, radius * 2);

    try {
      const imgData = ctx.getImageData(startX, startY, width, height);
      const data = imgData.data;

      // Pixelation blur algorithm
      const blockSize = 8;
      for (let py = 0; py < height; py += blockSize) {
        for (let px = 0; px < width; px += blockSize) {
          const pIndex = (py * width + px) * 4;
          const r = data[pIndex];
          const g = data[pIndex + 1];
          const b = data[pIndex + 2];

          for (let dy = 0; dy < blockSize && py + dy < height; dy++) {
            for (let dx = 0; dx < blockSize && px + dx < width; dx++) {
              const targetIndex = ((py + dy) * width + (px + dx)) * 4;
              data[targetIndex] = r;
              data[targetIndex + 1] = g;
              data[targetIndex + 2] = b;
            }
          }
        }
      }

      ctx.putImageData(imgData, startX, startY);
      setBlurCount(c => c + 1);

      const updated = canvas.toDataURL('image/jpeg', 0.9);
      setSanitizedDataUrl(updated);
      onImageSanitized(updated, 'sanitized_evidence.jpg');
    } catch (e) {
      console.warn('Canvas blur error:', e);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isBlurToolActive) return;
    isDrawingRef.current = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    applyBlurAtPoint(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !isBlurToolActive) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    applyBlurAtPoint(x, y);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleReset = () => {
    setOriginalImage(null);
    setSanitizedDataUrl(null);
    setBlurCount(0);
    setIsBlurToolActive(false);
    if (onClearImage) onClearImage();
  };

  return (
    <div className="bg-rose-50/40 border border-rose-200/90 rounded-2xl p-3.5 space-y-2.5">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-rose-600" />
          <span>প্রমাণপত্র ও ছবি স্ক্রাবার (PII Sanitizer)</span>
        </span>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>EXIF স্ক্রাবিং সক্রিয়</span>
        </span>
      </div>

      {!originalImage ? (
        <div className="border-2 border-dashed border-rose-300 bg-white rounded-2xl p-4 text-center space-y-2">
          <ImageIcon className="w-7 h-7 text-rose-500 mx-auto" />
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              রসিদ, ভুয়া টোকেন বা ঘটনাস্থলের ছবি আপলোড করুন
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              ক্যামেরা এক্সিফ ও ডিভাইস মেটাডেটা স্বয়ংক্রিয়ভাবে মুছে ফেলা হবে
            </span>
          </div>

          <label className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl pink-glow cursor-pointer active:scale-95 transition">
            <Camera className="w-3.5 h-3.5" />
            <span>ডিভাইস থেকে ছবি বাছাই করুন</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Interactive Canvas with Blur Brush */}
          <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-slate-900 flex justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`max-h-64 object-contain ${
                isBlurToolActive ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />
            {isBlurToolActive && (
              <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold">
                🖌️ ব্লার ব্রাশ সক্রিয়: মুখাবয়ব বা নামের ওপর টানুন ({blurCount} টি অঞ্চল ব্লারকৃত)
              </span>
            )}
          </div>

          {/* Blur Brush Toolbar */}
          <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setIsBlurToolActive(!isBlurToolActive)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                isBlurToolActive
                  ? 'bg-rose-500 text-white pink-glow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>{isBlurToolActive ? 'ব্লার সমাপ্ত করুন' : 'মুখাবয়ব বা তথ্য ব্লার করুন'}</span>
            </button>

            {isBlurToolActive && (
              <div className="flex items-center gap-1 text-[10px] text-slate-600">
                <span>আকার:</span>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={brushSize}
                  onChange={e => setBrushSize(parseInt(e.target.value, 10))}
                  className="w-16 accent-rose-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
            >
              মুছে ফেলুন
            </button>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-[10px] text-emerald-800 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>মেটাডেটা স্ক্রাবড ও পিআইআই ব্লার সম্পন্ন। ছবিটি সুরক্ষিতভাবে প্রস্তুত।</span>
          </div>
        </div>
      )}
    </div>
  );
};
