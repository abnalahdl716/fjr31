import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Upload,
  Send,
  Navigation,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Palmtree,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  ExcuseRequest,
  SystemSettings,
  LeaveRuleConfig,
} from '../types';
import {
  getCurrentTime12h,
  getCurrentTime24h,
  formatDateArabicLong,
  formatDateIso,
  formatDateNumeric,
  calculateLateSeconds,
  calculateEarlyDepartureSeconds,
  formatSecondsToArabic,
  formatSecondsDigital,
} from '../utils/time';
import { calculateDistanceMeters, getDeviceLocation } from '../utils/geo';
import { DigitalClock } from './DigitalClock';

interface EmployeeDashboardProps {
  employee: Employee;
  settings: SystemSettings;
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  excuseRequests: ExcuseRequest[];
  leaveRules: LeaveRuleConfig[];
  onCheckIn: (record: AttendanceRecord) => void;
  onCheckOut: (record: AttendanceRecord) => void;
  onSubmitLeave: (leave: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>) => void;
  onSubmitExcuse: (excuse: Omit<ExcuseRequest, 'id' | 'submittedAt' | 'status'>) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  employee,
  settings,
  attendanceRecords,
  leaveRequests,
  excuseRequests,
  leaveRules,
  onCheckIn,
  onCheckOut,
  onSubmitLeave,
  onSubmitExcuse,
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'new_leave' | 'new_excuse'>('attendance');
  const [simulatedAtHq, setSimulatedAtHq] = useState<boolean>(true); // Convenient for browser testing
  const [checkingGps, setCheckingGps] = useState<boolean>(false);
  const [gpsModal, setGpsModal] = useState<{
    isOpen: boolean;
    type: 'check_in' | 'check_out';
    status: 'success' | 'failed' | 'checking';
    time?: string;
    distance?: number;
    message?: string;
  }>({
    isOpen: false,
    type: 'check_in',
    status: 'checking',
  });

  // New Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'إجازة سنوية',
    startDate: formatDateIso(new Date()),
    endDate: formatDateIso(new Date()),
    daysCount: 1,
    reason: '',
    attachmentName: '',
  });

  // New Excuse Form State
  const [excuseForm, setExcuseForm] = useState({
    type: 'late' as 'late' | 'early_departure',
    date: formatDateIso(new Date()),
    targetTime: '08:17:35',
    reason: '',
    explanation: '',
    attachmentName: '',
  });

  // Find today's record for this employee
  const todayIso = formatDateIso(new Date());
  const todayRecord = attendanceRecords.find(
    (r) => r.employeeId === employee.id && r.date === todayIso
  );

  // Filter records for this employee
  const myRecords = attendanceRecords.filter((r) => r.employeeId === employee.id);
  const myLeaves = leaveRequests.filter((l) => l.employeeId === employee.id);
  const myExcuses = excuseRequests.filter((e) => e.employeeId === employee.id);

  // Calculate my weekly & monthly late totals
  const totalLateSeconds = myRecords.reduce((acc, curr) => {
    return acc + (curr.lateExcused ? 0 : curr.lateSeconds || 0);
  }, 0);

  // Trigger GPS Check for Check-in / Check-out
  const handleAttendanceAction = async (actionType: 'check_in' | 'check_out') => {
    setCheckingGps(true);
    setGpsModal({
      isOpen: true,
      type: actionType,
      status: 'checking',
      message: 'جاري الاتصال بالأقمار الصناعية والتحقق من الموقع الجغرافي...',
    });

    try {
      let userLat = settings.orgLocation.lat;
      let userLng = settings.orgLocation.lng;

      if (!simulatedAtHq) {
        try {
          const loc = await getDeviceLocation();
          userLat = loc.lat;
          userLng = loc.lng;
        } catch (err: any) {
          // If browser GPS fails and simulation is off, report error
          setGpsModal({
            isOpen: true,
            type: actionType,
            status: 'failed',
            message: `تعذر الوصول إلى نظام تحديد المواقع (GPS): ${err.message}. يمكنك تفعيل خيار "محاكاة التواجد في المقر" للاختبار السلس.`,
          });
          setCheckingGps(false);
          return;
        }
      } else {
        // Slight random offset within ~15-25m to show real meters calculation
        userLat += (Math.random() - 0.5) * 0.00015;
        userLng += (Math.random() - 0.5) * 0.00015;
      }

      const distance = calculateDistanceMeters(
        { lat: userLat, lng: userLng },
        { lat: settings.orgLocation.lat, lng: settings.orgLocation.lng }
      );

      const isInside = distance <= settings.gpsRadiusMeters;
      const nowTime12 = getCurrentTime12h();
      const nowTime24 = getCurrentTime24h();

      if (isInside) {
        // Success inside radius
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });

        if (actionType === 'check_in') {
          const lateSec = calculateLateSeconds(
            nowTime24,
            settings.workStartTime,
            settings.lateGracePeriodMinutes
          );

          const newRecord: AttendanceRecord = {
            id: todayRecord?.id || `att-${Date.now()}`,
            employeeId: employee.id,
            employeeName: employee.name,
            date: todayIso,
            checkInTime: nowTime24,
            checkInLocation: {
              lat: userLat,
              lng: userLng,
              distanceMeters: distance,
              insideRadius: true,
            },
            checkOutTime: todayRecord?.checkOutTime,
            checkOutLocation: todayRecord?.checkOutLocation,
            lateSeconds: lateSec,
            earlyDepartureSeconds: todayRecord?.earlyDepartureSeconds || 0,
            lateExcused: false,
            earlyExcused: false,
            status: lateSec > 0 ? 'late' : 'present',
          };
          onCheckIn(newRecord);
        } else {
          // Check-out
          const earlySec = calculateEarlyDepartureSeconds(nowTime24, settings.workEndTime);

          const updatedRecord: AttendanceRecord = {
            id: todayRecord?.id || `att-${Date.now()}`,
            employeeId: employee.id,
            employeeName: employee.name,
            date: todayIso,
            checkInTime: todayRecord?.checkInTime || nowTime24,
            checkInLocation: todayRecord?.checkInLocation,
            checkOutTime: nowTime24,
            checkOutLocation: {
              lat: userLat,
              lng: userLng,
              distanceMeters: distance,
              insideRadius: true,
            },
            lateSeconds: todayRecord?.lateSeconds || 0,
            earlyDepartureSeconds: earlySec,
            lateExcused: todayRecord?.lateExcused || false,
            earlyExcused: false,
            status: todayRecord?.status || 'present',
          };
          onCheckOut(updatedRecord);
        }

        setGpsModal({
          isOpen: true,
          type: actionType,
          status: 'success',
          time: nowTime12,
          distance: distance,
          message:
            actionType === 'check_in'
              ? 'تم تسجيل الحضور بنجاح'
              : 'تم تسجيل الانصراف بنجاح',
        });
      } else {
        // Outside allowed radius
        setGpsModal({
          isOpen: true,
          type: actionType,
          status: 'failed',
          distance: distance,
          message: 'لا يمكن تسجيل الحضور. يجب أن تكون داخل النطاق الجغرافي للمنظمة.',
        });
      }
    } catch (error: any) {
      setGpsModal({
        isOpen: true,
        type: actionType,
        status: 'failed',
        message: 'حدث خطأ غير متوقع أثناء معالجة إحداثيات الموقع',
      });
    } finally {
      setCheckingGps(false);
    }
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      alert('يرجى كتابة سبب طلب الإجازة');
      return;
    }

    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    onSubmitLeave({
      employeeId: employee.id,
      employeeName: employee.name,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      daysCount: days,
      reason: leaveForm.reason,
      attachmentName: leaveForm.attachmentName || undefined,
      balanceBefore: employee.remainingLeaveBalance,
      balanceAfter: employee.remainingLeaveBalance - days,
    });

    setLeaveForm({
      leaveType: 'إجازة سنوية',
      startDate: formatDateIso(new Date()),
      endDate: formatDateIso(new Date()),
      daysCount: 1,
      reason: '',
      attachmentName: '',
    });
    setActiveTab('leaves');
    alert('تم إرسال طلب الإجازة بنجاح، وهو قيد مراجعة الإدارة');
  };

  const handleExcuseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excuseForm.reason.trim() || !excuseForm.explanation.trim()) {
      alert('يرجى ملء كافة حقول سبب العذر والتوضيح');
      return;
    }

    const lateSec = calculateLateSeconds(
      excuseForm.targetTime,
      settings.workStartTime,
      settings.lateGracePeriodMinutes
    );

    onSubmitExcuse({
      employeeId: employee.id,
      employeeName: employee.name,
      type: excuseForm.type,
      date: excuseForm.date,
      targetTime: excuseForm.targetTime,
      durationSeconds: lateSec > 0 ? lateSec : 1055,
      reason: excuseForm.reason,
      explanation: excuseForm.explanation,
      attachmentName: excuseForm.attachmentName || undefined,
    });

    setExcuseForm({
      type: 'late',
      date: formatDateIso(new Date()),
      targetTime: '08:17:35',
      reason: '',
      explanation: '',
      attachmentName: '',
    });
    setActiveTab('attendance');
    alert('تم إرسال طلب العذر بنجاح، وستتم مراجعته من قبل المسؤول');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 11. لوحة معلومات الموظفين - Header Greeting & Live Clock */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm relative overflow-hidden">
        {/* Background Accent glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Organization & Greeting */}
          <div className="flex items-center gap-4 text-center md:text-right">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-sm border border-emerald-200 shrink-0">
              <img
                src={settings.logoUrl}
                alt={settings.orgName}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-amber-600 block">
                {settings.orgName}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                أهلاً وسهلاً / {employee.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {employee.jobTitle} • هاتف: {employee.phone}
              </p>
            </div>
          </div>

          {/* Live Clock Display as specified: 08:15:32 صباحاً | الأحد، 20 سبتمبر 2026 */}
          <div className="w-full md:w-auto">
            <DigitalClock variant="hero" />
          </div>
        </div>

        {/* GPS Testing Toggle Banner (Ensures 100% testability in sandbox iframe) */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/80 p-3 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              نطاق تسجيل الحضور: <strong>{settings.gpsRadiusMeters} متر</strong> من {settings.orgLocation.address}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">وضع تحديد الموقع:</span>
            <button
              type="button"
              onClick={() => setSimulatedAtHq(!simulatedAtHq)}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                simulatedAtHq
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-amber-600 text-white shadow-xs'
              }`}
            >
              {simulatedAtHq ? '🟢 محاكاة التواجد في المقر (داخل النطاق)' : '📍 استخدام GPS الجهاز الفعلي'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Action Buttons: 🟢 تحقق في (Check In) & 🟠 الدفع (Check Out) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Check In Button */}
        <button
          id="employee-checkin-btn"
          disabled={checkingGps || !!todayRecord?.checkInTime}
          onClick={() => handleAttendanceAction('check_in')}
          className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between text-right shadow-sm cursor-pointer ${
            todayRecord?.checkInTime
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 opacity-90'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 border-emerald-500 text-white hover:shadow-md hover:scale-[1.01]'
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold opacity-90 block">
              تسجيل الحضور اليومي عبر GPS
            </span>
            <span className="text-2xl font-black block">🟢 تحقق في</span>
            {todayRecord?.checkInTime ? (
              <span className="text-xs font-bold font-mono-num text-emerald-800 bg-white/80 px-2 py-0.5 rounded-lg inline-block">
                تم التسجيل: {todayRecord.checkInTime}
              </span>
            ) : (
              <span className="text-xs opacity-80 block">
                الدوام يبدأ في {settings.workStartTime}
              </span>
            )}
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Navigation className="w-7 h-7" />
          </div>
        </button>

        {/* Check Out Button */}
        <button
          id="employee-checkout-btn"
          disabled={checkingGps || !todayRecord?.checkInTime || !!todayRecord?.checkOutTime}
          onClick={() => handleAttendanceAction('check_out')}
          className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between text-right shadow-sm cursor-pointer ${
            todayRecord?.checkOutTime
              ? 'bg-amber-50/70 border-amber-300 text-amber-950 opacity-90'
              : !todayRecord?.checkInTime
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-amber-400 text-white hover:shadow-md hover:scale-[1.01]'
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold opacity-90 block">
              تسجيل الانصراف الرسمي عبر GPS
            </span>
            <span className="text-2xl font-black block">🟠 الدفع</span>
            {todayRecord?.checkOutTime ? (
              <span className="text-xs font-bold font-mono-num text-amber-800 bg-white/80 px-2 py-0.5 rounded-lg inline-block">
                تم الانصراف: {todayRecord.checkOutTime}
              </span>
            ) : (
              <span className="text-xs opacity-80 block">
                نهاية الدوام في {settings.workEndTime}
              </span>
            )}
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7" />
          </div>
        </button>
      </div>

      {/* Leave Balance Overview Cards as specified:
          رصيد الإجازة السنوية: 30 يوماً | مستخدم: 8 أيام | متبقي: 22 يوماً */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Palmtree className="w-4 h-4 text-emerald-600" />
            <span>رصيد الإجازات السنوية الحالي للموظف</span>
          </div>
          <span className="text-xs text-slate-400">سنة {new Date().getFullYear()}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
            <span className="text-xs text-slate-500 block mb-1">الرصيد الإجمالي</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono-num">
              {employee.annualLeaveBalance}
            </span>
            <span className="text-[10px] text-slate-400 block">يوماً</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3">
            <span className="text-xs text-amber-800 block mb-1">المستخدم</span>
            <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono-num">
              {employee.usedLeaveBalance}
            </span>
            <span className="text-[10px] text-amber-600 block">أيام مستهلكة</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3">
            <span className="text-xs text-emerald-800 block mb-1">المتبقي</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono-num">
              {employee.remainingLeaveBalance}
            </span>
            <span className="text-[10px] text-emerald-600 block">يوماً متاحاً</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Employee:
          📋 حضوري | 🏖️ أوراقي | 📝 طلب إجازة | ⚠️ طلب عذر */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>📋 حضوري</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {myRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'leaves'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>🏖️ أوراقي</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {myLeaves.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('new_leave')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'new_leave'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>📝 طلب إجازة</span>
        </button>

        <button
          onClick={() => setActiveTab('new_excuse')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'new_excuse'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>⚠️ طلب عذر</span>
        </button>
      </div>

      {/* Tab 1: 📋 حضوري (My Attendance) */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Late Time Accumulator Banner as specified in Section 6 */}
          <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <span className="text-xs font-bold text-amber-900 block">
                حساب الوقت المتأخر تلقائياً (بالساعات + الدقائق + الثواني):
              </span>
              <p className="text-xs text-slate-600">
                يقوم النظام باحتساب التأخير بدقة، ويستثني الفترات التي تمت الموافقة على أعذارها.
              </p>
            </div>
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-amber-300 shadow-2xs text-center shrink-0">
              <span className="text-[11px] text-slate-400 block">إجمالي التأخير المحسوب</span>
              <span className="text-base sm:text-lg font-black font-mono-num text-red-700">
                {formatSecondsToArabic(totalLateSeconds)}
              </span>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span>سجل حضوري وانصرافي</span>
              </h3>
              <span className="text-xs text-slate-500">
                إجمالي السجلات: {myRecords.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">تحقق في (حضور)</th>
                    <th className="p-3.5">الدفع (انصراف)</th>
                    <th className="p-3.5">وقت التأخير</th>
                    <th className="p-3.5">المغادرة المبكرة</th>
                    <th className="p-3.5">حالة السجل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {myRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        لا توجد سجلات حضور مسجلة حتى الآن
                      </td>
                    </tr>
                  ) : (
                    myRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 font-mono-num font-semibold text-slate-800">
                          {r.date}
                        </td>
                        <td className="p-3.5 font-mono-num text-emerald-800 font-medium">
                          {r.checkInTime || '—'}
                        </td>
                        <td className="p-3.5 font-mono-num text-amber-800 font-medium">
                          {r.checkOutTime || '—'}
                        </td>
                        <td className="p-3.5 font-mono-num">
                          {r.lateExcused ? (
                            <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              معفى بعذر معتمد
                            </span>
                          ) : r.lateSeconds > 0 ? (
                            <span className="text-red-600 font-bold">
                              {formatSecondsDigital(r.lateSeconds)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono-num">
                          {r.earlyDepartureSeconds > 0 ? (
                            <span className="text-amber-600 font-bold">
                              {formatSecondsDigital(r.earlyDepartureSeconds)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${
                              r.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'late'
                                ? 'bg-amber-100 text-amber-800'
                                : r.status === 'on_leave'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.status === 'present'
                              ? '🟢 حاضر'
                              : r.status === 'late'
                              ? '🟠 متأخر'
                              : r.status === 'on_leave'
                              ? '🏖️ إجازة'
                              : '🔴 غائب'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 🏖️ أوراقي (My Leaves) */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              سجل طلبات الإجازات المقدمة
            </h3>
            <button
              onClick={() => setActiveTab('new_leave')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>تقديم طلب جديد</span>
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">نوع الإجازة</th>
                  <th className="p-3.5">من تاريخ</th>
                  <th className="p-3.5">إلى تاريخ</th>
                  <th className="p-3.5">عدد الأيام</th>
                  <th className="p-3.5">السبب</th>
                  <th className="p-3.5">حالة الطلب</th>
                  <th className="p-3.5">ملاحظات الإدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {myLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      لم تقم بتقديم أي طلبات إجازة حتى الآن
                    </td>
                  </tr>
                ) : (
                  myLeaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-bold text-emerald-900">{l.leaveType}</td>
                      <td className="p-3.5 font-mono-num">{l.startDate}</td>
                      <td className="p-3.5 font-mono-num">{l.endDate}</td>
                      <td className="p-3.5 font-bold">{l.daysCount} يوم</td>
                      <td className="p-3.5 text-slate-600 max-w-xs">{l.reason}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${
                            l.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.status === 'approved'
                            ? '🟢 موافقة'
                            : l.status === 'rejected'
                            ? '🔴 مرفوض'
                            : '🟠 قيد المراجعة'}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs text-slate-500">
                        {l.adminNotes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: 📝 طلب إجازة (New Leave Request) */}
      {activeTab === 'new_leave' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base mb-5 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>نموذج تقديم طلب إجازة رسمي</span>
          </div>

          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نوع الإجازة المطلوبة
              </label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {leaveRules.map((rule) => (
                  <option key={rule.id} value={rule.leaveType}>
                    {rule.leaveType} {rule.deductFromBalanceOnApprove ? '(تُخصم من الرصيد)' : '(لا تُخصم)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ بدء الإجازة
                </label>
                <input
                  type="date"
                  required
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ انتهاء الإجازة
                </label>
                <input
                  type="date"
                  required
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سبب الإجازة والتفاصيل
              </label>
              <textarea
                required
                rows={3}
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="أدخل سبب طلب الإجازة بوضوح..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                إرفاق مستند أو تقرير طبي (اختياري)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="leave-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLeaveForm({ ...leaveForm, attachmentName: file.name });
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="leave-file-input"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>اختيار ملف من الجهاز</span>
                </label>
                <span className="text-xs text-slate-500 font-mono-num truncate">
                  {leaveForm.attachmentName || 'لم يتم اختيار ملف بعد'}
                </span>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال طلب الإجازة للمراجعة</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: ⚠️ طلب عذر (New Excuse Request) */}
      {activeTab === 'new_excuse' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-base mb-5 border-b border-slate-100 pb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>تقديم طلب اعتذار (عذر تأخر أو انصراف مبكر)</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl mb-4 text-xs text-amber-900 leading-relaxed">
            <strong>ملاحظة نظام الأعذار:</strong> في حالة الموافقة على عذر التأخر، لن يتم احتساب مدة التأخير المقابلة في إجمالي ساعات التأخير الشهرية للموظف. وفي حالة الرفض، يُحسب التأخير بالكامل.
          </div>

          <form onSubmit={handleExcuseSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نوع الاعتذار
                </label>
                <select
                  value={excuseForm.type}
                  onChange={(e) =>
                    setExcuseForm({
                      ...excuseForm,
                      type: e.target.value as 'late' | 'early_departure',
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="late">عذر التأخر في الوصول</option>
                  <option value="early_departure">عذر المغادرة المبكرة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ اليوم المعني
                </label>
                <input
                  type="date"
                  required
                  value={excuseForm.date}
                  onChange={(e) => setExcuseForm({ ...excuseForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                وقت الوصول المتأخر / وقت الانصراف
              </label>
              <input
                type="time"
                step="1"
                required
                value={excuseForm.targetTime}
                onChange={(e) => setExcuseForm({ ...excuseForm, targetTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سبب التأخر أو الانصراف
              </label>
              <input
                type="text"
                required
                placeholder="مثال: ازدحام مروري خانق، ظرف صحي طارئ، مراجعة دائرة حكومية..."
                value={excuseForm.reason}
                onChange={(e) => setExcuseForm({ ...excuseForm, reason: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                توضيح مفصل
              </label>
              <textarea
                required
                rows={3}
                placeholder="اشرح ملابسات الموقف للإدارة بدقة..."
                value={excuseForm.explanation}
                onChange={(e) => setExcuseForm({ ...excuseForm, explanation: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المستند أو الصورة المرفقة (اختياري)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="excuse-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setExcuseForm({ ...excuseForm, attachmentName: file.name });
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="excuse-file-input"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-amber-600" />
                  <span>إرفاق صورة أو وثيقة إثبات</span>
                </label>
                <span className="text-xs text-slate-500 font-mono-num truncate">
                  {excuseForm.attachmentName || 'لم يتم اختيار مرفق'}
                </span>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال طلب العذر للمسؤول</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GPS Feedback Modal as specified in Section 5:
          داخل نصف القطر:
          🟢 تم تسجيل الحضور بنجاح
          وقت: 07:58:24 صباحاً
          موقع: نطاق المنظمة الداخلي
          خارج نصف القطر:
          🔴 لا يمكن تسجيل الحضور
          يجب أن تكون داخل النطاق الجغرافي للمنظمة. */}
      {gpsModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in duration-200">
            {gpsModal.status === 'checking' && (
              <div className="space-y-4 py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
                <h3 className="font-bold text-slate-800 text-lg">جاري فحص الموقع الجغرافي (GPS)</h3>
                <p className="text-xs text-slate-500">{gpsModal.message}</p>
              </div>
            )}

            {gpsModal.status === 'success' && (
              <div className="space-y-5">
                <div className="w-18 h-18 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-emerald-800">
                    🟢 {gpsModal.message}
                  </h3>
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-right text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الوقت المسجل:</span>
                      <span className="font-bold font-mono-num text-emerald-900 text-sm">
                        {gpsModal.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الموقع الميداني:</span>
                      <span className="font-bold text-emerald-800">
                        نطاق المنظمة الداخلي (على بعد {gpsModal.distance} متر)
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setGpsModal({ ...gpsModal, isOpen: false })}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  إغلاق وتأكيد
                </button>
              </div>
            )}

            {gpsModal.status === 'failed' && (
              <div className="space-y-5">
                <div className="w-18 h-18 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                  <XCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-700">
                    🔴 {gpsModal.message}
                  </h3>
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-right text-xs text-red-900 space-y-2">
                    <p>
                      أنت حالياً خارج النطاق الجغرافي المحدد لمقر المؤسسة.
                    </p>
                    {gpsModal.distance !== undefined && (
                      <div className="flex items-center justify-between font-bold">
                        <span>المسافة المحسوبة:</span>
                        <span className="font-mono-num text-red-700 text-sm">
                          {gpsModal.distance} متر (الحد المسموح {settings.gpsRadiusMeters} متر)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSimulatedAtHq(true);
                      setGpsModal({ ...gpsModal, isOpen: false });
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    تفعيل محاكاة التواجد في المقر وإعادة المحاولة
                  </button>
                  <button
                    onClick={() => setGpsModal({ ...gpsModal, isOpen: false })}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
