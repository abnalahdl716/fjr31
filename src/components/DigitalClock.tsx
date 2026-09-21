import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { getCurrentTime12h, formatDateArabicLong, formatDateNumeric } from '../utils/time';

interface DigitalClockProps {
  showDate?: boolean;
  variant?: 'card' | 'compact' | 'hero';
  className?: string;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  showDate = true,
  variant = 'card',
  className = '',
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const time12h = getCurrentTime12h(now);
  const dateArabic = formatDateArabicLong(now);
  const dateNumeric = formatDateNumeric(now);

  if (variant === 'compact') {
    return (
      <div
        id="digital-clock-compact"
        className={`flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-xs ${className}`}
      >
        <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
        <span className="font-mono-num tracking-wide">{time12h}</span>
        {showDate && (
          <>
            <span className="text-emerald-300">|</span>
            <span className="text-xs text-emerald-700">{dateNumeric}</span>
          </>
        )}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        id="digital-clock-hero"
        className={`bg-white/90 backdrop-blur-xs border border-emerald-200/80 rounded-2xl p-4 shadow-sm text-center ${className}`}
      >
        <div className="flex items-center justify-center gap-2 text-emerald-800 mb-1">
          <Clock className="w-5 h-5 text-emerald-600 animate-pulse" />
          <span className="text-2xl md:text-3xl font-bold font-mono-num text-emerald-900 tracking-wider">
            {time12h}
          </span>
        </div>
        {showDate && (
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-slate-600 mt-1">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>{dateArabic}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono-num font-semibold text-emerald-700">{dateNumeric}</span>
          </div>
        )}
      </div>
    );
  }

  // Default 'card' style matching Section 2 specification:
  // صندوق ساعة أنيق يحتوي على: تاريخ: 20/09/2026 | وقت: 08:07:35 صباحاً
  return (
    <div
      id="digital-clock-card"
      className={`bg-white border-2 border-emerald-500/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>الساعة الرقمية المباشرة</span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          توقيت محلي فوري
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5">
          <span className="text-xs text-slate-500 block mb-1 font-medium">الوقت الحالي</span>
          <span className="text-lg md:text-xl font-bold font-mono-num text-emerald-900 block">
            {time12h}
          </span>
        </div>
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5">
          <span className="text-xs text-slate-500 block mb-1 font-medium">تاريخ اليوم</span>
          <span className="text-lg md:text-xl font-bold font-mono-num text-amber-900 block">
            {dateNumeric}
          </span>
        </div>
      </div>
      <div className="text-center mt-2 text-xs text-slate-500">
        {dateArabic}
      </div>
    </div>
  );
};
