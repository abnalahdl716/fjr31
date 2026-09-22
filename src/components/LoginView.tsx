import React, { useState } from 'react';
import { LogIn, UserCheck, ShieldCheck, KeyRound, Sparkles, Wifi, Smartphone, Globe, Info, Clock, Calendar, FileText, User } from 'lucide-react';
import { Employee } from '../types';
import { DigitalClock } from './DigitalClock';

interface LoginViewProps {
  employees: Employee[];
  onLogin: (employee: Employee) => void;
  activePreviewTab?: 'attendance' | 'leaves' | 'documents' | 'profile';
  onSelectPreviewTab?: (tab: 'attendance' | 'leaves' | 'documents' | 'profile') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  employees,
  onLogin,
  activePreviewTab = 'attendance',
  onSelectPreviewTab,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[1]?.id || employees[0]?.id || '');
  const [pinCode, setPinCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<'quick' | 'pin'>('quick');

  const handleQuickLogin = (emp: Employee) => {
    onLogin(emp);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetEmp = employees.find((e) => e.id === selectedEmpId);
    if (!targetEmp) {
      setError('يرجى اختيار الموظف أولاً');
      return;
    }

    if (targetEmp.code === pinCode.trim()) {
      onLogin(targetEmp);
    } else {
      setError('رمز الدخول غير صحيح، يرجى المحاولة مرة أخرى');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
      {/* Top Sections Ribbon on Login Screen (شريط الأقسام في أعلى قسم تسجيل الدخول) */}
      <div className="mb-4 sm:mb-6 bg-white rounded-2xl p-2 shadow-sm border border-slate-200/80 overflow-x-auto no-scrollbar">
        <div className="text-[11px] font-bold text-slate-400 px-2 pb-1.5 border-b border-slate-100 flex items-center justify-between">
          <span>أقسام النظام المتاحة للموظفين:</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
            سجل الدخول للوصول
          </span>
        </div>
        <div className="flex items-center gap-1.5 pt-1.5 min-w-max">
          <button
            type="button"
            onClick={() => onSelectPreviewTab && onSelectPreviewTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreviewTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>تسجيل الحضور</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPreviewTab && onSelectPreviewTab('leaves')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreviewTab === 'leaves'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>طلب إجازة</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPreviewTab && onSelectPreviewTab('documents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreviewTab === 'documents'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>أوراقي</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectPreviewTab && onSelectPreviewTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreviewTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>الملف التعريفي</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="text-center mb-5 sm:mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white shadow-lg shadow-emerald-700/20 mb-3">
          <Sparkles className="w-8 h-8 text-amber-300" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          مؤسسة الفجر الخيرية الاجتماعية
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          بوابة تسجيل الحضور والانصراف وإدارة الإجازات والأوراق الرسمية
        </p>

        {/* 12-Hour Live Clock Header */}
        <div className="mt-4">
          <DigitalClock />
        </div>

        {/* Universal Connectivity Badge */}
        <div className="mt-3.5 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs px-3 py-1.5 rounded-full shadow-2xs">
          <div className="flex items-center gap-1 font-semibold">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>بيانات الجوال</span>
          </div>
          <span className="text-emerald-300">•</span>
          <div className="flex items-center gap-1 font-semibold">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span>واي فاي / ADSL</span>
          </div>
          <span className="text-emerald-300">•</span>
          <div className="flex items-center gap-1 font-semibold">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>ستارلنك</span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Toggle Mode Tabs */}
        <div className="flex border-b border-slate-100 p-1.5 bg-slate-50/70">
          <button
            type="button"
            onClick={() => { setMode('quick'); setError(''); }}
            className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'quick'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-100'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>دخول سريع للموظفين</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('pin'); setError(''); }}
            className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'pin'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-100'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>دخول بالرمز السري (PIN)</span>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'quick' ? (
            <div>
              <p className="text-xs text-slate-500 mb-3 text-center">
                اختر اسمك من القائمة للدخول المباشر إلى لوحة التحكم وحساب دوامك
              </p>
              <div className="space-y-2">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleQuickLogin(emp)}
                    className="w-full text-right p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shadow-2xs group-hover:scale-105 transition-transform">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                          <span>{emp.name}</span>
                          {emp.role === 'admin' && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                              إدارة
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {emp.department} • كود: {emp.code}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-emerald-700 group-hover:translate-x-[-4px] transition-transform">
                      دخول ←
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اختر حساب الموظف
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الرمز السري الخاص بك (PIN Code)
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="أدخل الرمز السري (مثال: 1001)"
                    className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  * للأعضاء التجريبيين: الرمز يطابق رقم الكود (1000 للإدارة، 1001 لعبدالمجيد، إلخ)
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول للنظام</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info inside card */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>متوافق كلياً مع الهواتف الذكية والأجهزة اللوحية</span>
          <span className="font-semibold text-emerald-700">مؤسسة الفجر الخيرية</span>
        </div>
      </div>
    </div>
  );
};
