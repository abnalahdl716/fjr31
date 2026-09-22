import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sparkles } from 'lucide-react';
import { formatTime12Hour, formatDateArabic } from '../utils/time';

interface DigitalClockProps {
  className?: string;
  showDate?: boolean;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({ className = '', showDate = true }) => {
  const [timeStr, setTimeStr] = useState<string>(() => formatTime12Hour(new Date(), true));
  const [dateStr, setDateStr] = useState<string>(() => formatDateArabic(new Date()));

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(formatTime12Hour(now, true));
      setDateStr(formatDateArabic(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Split time string into digits and period (ص / م)
  const parts = timeStr.split(' ');
  const digits = parts[0] || '';
  const period = parts[1] || '';

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* 12-Hour Digital Display */}
      <div className="flex items-center gap-2 bg-slate-900/90 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl shadow-inner border border-emerald-500/30">
        <Clock className="w-5 h-5 text-emerald-400 animate-pulse" />
        <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-emerald-300">
          {digits}
        </span>
        <span className="text-xs sm:text-sm font-bold bg-emerald-600/80 text-emerald-50 px-2 py-0.5 rounded-md">
          {period === 'ص' ? 'صباحاً (ص)' : 'مساءً (م)'}
        </span>
      </div>

      {showDate && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{dateStr}</span>
        </div>
      )}
    </div>
  );
};
