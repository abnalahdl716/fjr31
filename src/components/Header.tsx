import React from 'react';
import { LogOut, User, ShieldCheck, Clock as ClockIcon } from 'lucide-react';
import { UserSession, SystemSettings } from '../types';
import { DigitalClock } from './DigitalClock';

interface HeaderProps {
  session: UserSession | null;
  settings: SystemSettings;
  onLogout: () => void;
  onSwitchAccount?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  settings,
  onLogout,
  onSwitchAccount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xs border border-emerald-200 bg-white flex items-center justify-center p-1">
              <img
                src={settings.logoUrl}
                alt={settings.orgName}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-emerald-950 tracking-tight flex items-center gap-1.5">
                <span>{settings.orgName}</span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  نظام الحضور والإجازات
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden md:block">
                تتبع الحضور بنظام GPS • إدارة الإجازات • حساب التأخير بالثواني
              </p>
            </div>
          </div>

          {/* Center Digital Clock (visible on tablet/desktop) */}
          <div className="hidden lg:block">
            <DigitalClock variant="compact" />
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-right">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                    session.role === 'admin' ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}>
                    {session.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="leading-tight">
                    <span className="block text-xs font-bold text-slate-800">
                      {session.name}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {session.role === 'admin' ? 'مسؤول النظام (fjr)' : 'موظف في المؤسسة'}
                    </span>
                  </div>
                </div>

                {onSwitchAccount && (
                  <button
                    id="switch-account-btn"
                    onClick={onSwitchAccount}
                    title="تبديل الحساب للتجربة"
                    className="hidden sm:flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors text-xs font-medium"
                  >
                    تبديل
                  </button>
                )}

                <button
                  id="logout-btn"
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">تسجيل الخروج</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                يرجى تسجيل الدخول للمتابعة
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
