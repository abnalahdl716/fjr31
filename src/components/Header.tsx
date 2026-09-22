import React from 'react';
import {
  Sparkles,
  LogOut,
  Clock,
  Calendar,
  FileText,
  User,
  Shield,
  Smartphone,
  Wifi,
  Globe
} from 'lucide-react';
import { Employee, InstitutionSettings } from '../types';

interface HeaderProps {
  currentUser: Employee | null;
  settings: InstitutionSettings;
  activeTab: 'attendance' | 'leaves' | 'documents' | 'profile';
  onTabChange: (tab: 'attendance' | 'leaves' | 'documents' | 'profile') => void;
  onLogout: () => void;
  onOpenMap?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  settings,
  activeTab,
  onTabChange,
  onLogout,
  onOpenMap,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        {/* Top Branding & Status Row */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Org Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-900 truncate">
                {settings.name}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden xs:block">
                نظام الحضور والإجازات الذكي
              </p>
            </div>
          </div>

          {/* User Status & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl px-2.5 py-1 sm:px-3 sm:py-1.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentUser.role === 'admin' ? 'مدير النظام' : currentUser.department}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer mr-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>مؤسسة الفجر الخيرية</span>
              </div>
            )}
          </div>
        </div>

        {/* TOP NAVIGATION BAR FOR USER SECTIONS (شريط الأقسام في أعلى الشاشة) */}
        {currentUser && (
          <div className="border-t border-slate-100 py-1.5 overflow-x-auto no-scrollbar">
            <nav className="flex items-center gap-1.5 min-w-max">
              <button
                type="button"
                onClick={() => onTabChange('attendance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>تسجيل الحضور</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('leaves')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'leaves'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>طلب إجازة</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('documents')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'documents'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>أوراقي</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('profile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>الملف التعريفي</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
