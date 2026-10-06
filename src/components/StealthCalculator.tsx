import React, { useState } from 'react';
import { EyeOff, ArrowLeft } from 'lucide-react';

interface StealthCalculatorProps {
  onExit: () => void;
}

export const StealthCalculator: React.FC<StealthCalculatorProps> = ({ onExit }) => {
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [clearOnNext, setClearOnNext] = useState(false);

  const handleDigit = (digit: string) => {
    if (display === '0' || clearOnNext) {
      setDisplay(digit);
      setClearOnNext(false);
    } else {
      if (display.length < 10) {
        setDisplay(display + digit);
      }
    }
  };

  const handleDecimal = () => {
    if (clearOnNext) {
      setDisplay('0.');
      setClearOnNext(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOp = (op: string) => {
    setPrevVal(display);
    setOperation(op);
    setClearOnNext(true);
  };

  const handleEquals = () => {
    if (!operation || prevVal === null) return;
    const a = parseFloat(prevVal);
    const b = parseFloat(display);
    let res = 0;
    switch (operation) {
      case '+': res = a + b; break;
      case '-': res = a - b; break;
      case '×': res = a * b; break;
      case '÷': res = b !== 0 ? a / b : 0; break;
      default: return;
    }
    const resStr = Number.isInteger(res) ? res.toString() : res.toFixed(4).replace(/\.?0+$/, '');
    setDisplay(resStr);
    setPrevVal(null);
    setOperation(null);
    setClearOnNext(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevVal(null);
    setOperation(null);
    setClearOnNext(false);
  };

  const handleSign = () => {
    if (display === '0') return;
    if (display.startsWith('-')) {
      setDisplay(display.substring(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    setDisplay((val / 100).toString());
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-950 p-6 flex flex-col justify-between text-white select-none h-full">
      {/* Top camouflage bar */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono tracking-wider">
          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
          <span>STEALTH ACTIVE</span>
        </div>
        <button
          onClick={onExit}
          type="button"
          className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-rose-300 px-3 py-1.5 rounded-xl font-bold border border-slate-700 active:scale-95 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Stealth</span>
        </button>
      </div>

      {/* Screen display */}
      <div className="my-auto py-8">
        <div className="text-right text-xs text-slate-400 font-mono min-h-[16px] mb-1">
          {prevVal} {operation}
        </div>
        <div className="text-right text-5xl font-mono text-white tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none font-light">
          {display}
        </div>
      </div>

      {/* Calculator Keypad */}
      <div className="grid grid-cols-4 gap-2.5 pb-4">
        <button
          onClick={handleClear}
          className="h-14 rounded-2xl bg-slate-700/80 hover:bg-slate-700 text-rose-300 font-semibold text-lg active:scale-95 transition"
        >
          AC
        </button>
        <button
          onClick={handleSign}
          className="h-14 rounded-2xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-semibold text-lg active:scale-95 transition"
        >
          ±
        </button>
        <button
          onClick={handlePercent}
          className="h-14 rounded-2xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-semibold text-lg active:scale-95 transition"
        >
          %
        </button>
        <button
          onClick={() => handleOp('÷')}
          className="h-14 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xl active:scale-95 transition"
        >
          ÷
        </button>

        <button
          onClick={() => handleDigit('7')}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          7
        </button>
        <button
          onClick={() => handleDigit('8')}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          8
        </button>
        <button
          onClick={() => handleDigit('9')}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          9
        </button>
        <button
          onClick={() => handleOp('×')}
          className="h-14 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xl active:scale-95 transition"
        >
          ×
        </button>

        <button
          onClick={() => handleDigit('4')}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          4
        </button>
        <button
          onClick={() => handleDigit('5')}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          5
        </button>
        <button
          onClick={() => handleDigit('6')}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          6
        </button>
        <button
          onClick={() => handleOp('-')}
          className="h-14 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xl active:scale-95 transition"
        >
          -
        </button>

        <button
          onClick={() => handleDigit('1')}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          1
        </button>
        <button
          onClick={() => handleDigit('2')}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          2
        </button>
        <button
          onClick={() => handleDigit('3')}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          3
        </button>
        <button
          onClick={() => handleOp('+')}
          className="h-14 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xl active:scale-95 transition"
        >
          +
        </button>

        <button
          onClick={() => handleDigit('0')}
          className="h-14 col-span-2 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          0
        </button>
        <button
          onClick={handleDecimal}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-medium text-xl active:scale-95 transition"
        >
          .
        </button>
        <button
          onClick={handleEquals}
          className="h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-bold text-xl pink-glow active:scale-95 transition"
        >
          =
        </button>
      </div>
    </div>
  );
};
