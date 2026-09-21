import React from 'react';
import { Phone, Code2 } from 'lucide-react';
import { SystemSettings } from '../types';

interface FooterProps {
  settings: SystemSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="mt-auto bg-white border-t border-slate-200/80 py-4 px-4 text-center no-print">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-800">{settings.orgName}</span>
          <span className="text-slate-300">•</span>
          <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
        </div>

        {/* Developer attribution as specified */}
        <div className="flex items-center gap-3 bg-emerald-50/60 border border-emerald-200/70 px-3.5 py-1.5 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{settings.developerName}</span>
          </div>
          <span className="text-emerald-300">|</span>
          <a
            href={`tel:${settings.developerPhone}`}
            dir="ltr"
            className="flex items-center gap-1 font-mono-num font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            <Phone className="w-3 h-3 text-emerald-600" />
            <span>{settings.developerPhone}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
