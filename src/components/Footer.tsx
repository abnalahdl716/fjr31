import React from 'react';
import { Sparkles, Shield, Wifi, Smartphone, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right text-xs text-slate-500">
        <div>
          <p className="font-bold text-slate-700">
            مؤسسة الفجر الخيرية الاجتماعية © {new Date().getFullYear()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            نظام الموارد البشرية والدوام الذكي بنظام 12 ساعة مع التحقق الجغرافي
          </p>
        </div>

        {/* Connectivity summary badge */}
        <div className="flex items-center gap-2 text-[11px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-slate-600">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>بيانات الهاتف</span>
          <span className="text-slate-300">•</span>
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>واي فاي / ADSL</span>
          <span className="text-slate-300">•</span>
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>ستارلنك</span>
        </div>
      </div>
    </footer>
  );
};
