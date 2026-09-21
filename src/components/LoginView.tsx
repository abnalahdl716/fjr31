import React, { useState } from 'react';
import { LogIn, KeyRound, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserSession, SystemSettings, Employee } from '../types';
import { DigitalClock } from './DigitalClock';

interface LoginViewProps {
  settings: SystemSettings;
  employees: Employee[];
  onLogin: (session: UserSession, rememberMe: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  settings,
  employees,
  onLogin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    setTimeout(() => {
      const cleanUsername = username.trim();
      const cleanPassword = password.trim();

      // Check Admin
      if (
        cleanUsername.toLowerCase() === settings.adminUsername.toLowerCase() &&
        cleanPassword === settings.adminPassword
      ) {
        onLogin(
          {
            id: 'admin',
            username: settings.adminUsername,
            role: 'admin',
            name: 'مدير النظام',
          },
          rememberMe
        );
        setLoading(false);
        return;
      }

      // Check Employee
      const emp = employees.find(
        (e) =>
          e.username.toLowerCase() === cleanUsername.toLowerCase() &&
          e.password === cleanPassword
      );

      if (emp) {
        if (emp.status === 'inactive') {
          setErrorMsg('هذا الحساب معطّل حالياً. يرجى مراجعة إدارة المؤسسة لتفعيله.');
          setLoading(false);
          return;
        }

        onLogin(
          {
            id: emp.id,
            username: emp.username,
            role: 'employee',
            employeeId: emp.id,
            name: emp.name,
          },
          rememberMe
        );
        setLoading(false);
        return;
      }

      setErrorMsg('اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.');
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-emerald-50/40 via-white to-amber-50/30">
      <div className="w-full max-w-md space-y-6">
        {/* Top Header: Logo + Foundation Name */}
        <div className="text-center space-y-3">
          <div className="inline-block p-2 bg-white rounded-3xl shadow-md border-2 border-emerald-500/30 transition-transform hover:scale-105 duration-300">
            <img
              src={settings.logoUrl}
              alt={settings.orgName}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
              {settings.orgName}
            </h2>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              نظام إدارة حضور الموظفين وإجازاتهم الذكي
            </p>
          </div>
        </div>

        {/* Digital Clock Box as specified */}
        <DigitalClock variant="card" />

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg mb-6 border-b border-slate-100 pb-3">
            <LogIn className="w-5 h-5 text-emerald-600" />
            <span>تسجيل الدخول للنظام</span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-800 text-xs sm:text-sm animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5"
              >
                اسم المستخدم
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم (مثال: fjr)"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <span>تذكرني على هذا الجهاز</span>
              </label>
              <span className="text-xs text-amber-600 font-semibold">حساب محمي</span>
            </div>

            {/* Submit Button */}
            <button
              id="submit-login-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-100" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
