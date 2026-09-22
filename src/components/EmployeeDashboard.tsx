import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  Send,
  Download,
  Upload,
  User,
  Shield,
  Wifi,
  Smartphone,
  Globe,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight,
  PlusCircle,
  XCircle,
  HelpCircle,
  Printer
} from 'lucide-react';
import { Employee, AttendanceRecord, LeaveRequest, DocumentItem, InstitutionSettings } from '../types';
import { DigitalClock } from './DigitalClock';
import { formatTime12Hour, formatDateArabic, getTodayDateString, calculateLateMinutes } from '../utils/time';
import { calculateDistanceMeters, getDeviceLocation, detectNetworkInfo } from '../utils/geo';

interface EmployeeDashboardProps {
  employee: Employee;
  settings: InstitutionSettings;
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  documents: DocumentItem[];
  activeTab: 'attendance' | 'leaves' | 'documents' | 'profile';
  onTabChange: (tab: 'attendance' | 'leaves' | 'documents' | 'profile') => void;
  onCheckIn: (record: AttendanceRecord) => void;
  onCheckOut: (record: AttendanceRecord) => void;
  onRequestLeave: (request: Omit<LeaveRequest, 'id' | 'status' | 'requestDate'>) => void;
  onAddDocument: (doc: Omit<DocumentItem, 'id'>) => void;
  onOpenLocationPicker?: () => void;
  onOpenPrintReport?: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  employee,
  settings,
  attendanceRecords,
  leaveRequests,
  documents,
  activeTab,
  onTabChange,
  onCheckIn,
  onCheckOut,
  onRequestLeave,
  onAddDocument,
  onOpenLocationPicker,
  onOpenPrintReport,
}) => {
  const today = getTodayDateString();

  // Find today's record for this employee
  const todayRecord = attendanceRecords.find(
    (r) => r.employeeId === employee.id && r.date === today
  );

  // Network info
  const [networkInfo, setNetworkInfo] = useState(detectNetworkInfo());

  // Location / Geofence state
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>('');
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Leave Form State
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('سنوية');
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [daysCount, setDaysCount] = useState<number>(1);
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState<string>('');

  // Document Upload State
  const [docTitle, setDocTitle] = useState<string>('');
  const [docCategory, setDocCategory] = useState<DocumentItem['category']>('عقد عمل');
  const [docIssueDate, setDocIssueDate] = useState<string>(today);
  const [docNotes, setDocNotes] = useState<string>('');
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [docSuccessMsg, setDocSuccessMsg] = useState<string>('');

  // Auto calculate leave days
  useEffect(() => {
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      const diffTime = e - s;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDaysCount(diffDays > 0 ? diffDays : 1);
    }
  }, [startDate, endDate]);

  // Check network changes
  useEffect(() => {
    const handleOnline = () => setNetworkInfo(detectNetworkInfo());
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOnline);
    };
  }, []);

  // Handle Attendance Action (Check-in or Check-out)
  const handleAttendanceAction = async (actionType: 'check-in' | 'check-out') => {
    setGpsLoading(true);
    setGpsError('');

    try {
      // 1. Get GPS coordinates
      const loc = await getDeviceLocation();
      const distance = calculateDistanceMeters(
        { lat: loc.lat, lng: loc.lng },
        settings.officeLocation
      );

      setCurrentDistance(distance);
      setLastCoords({ lat: loc.lat, lng: loc.lng });

      const isWithinGeofence = distance <= settings.officeLocation.radiusMeters;

      // Note: allowRemoteAnyNetwork enables punch with verification notes if office allows
      const currentTime12 = formatTime12Hour(new Date(), true);
      const net = detectNetworkInfo();

      if (actionType === 'check-in') {
        const lateMinutes = calculateLateMinutes(
          currentTime12,
          settings.workStartTime,
          settings.lateGraceMinutes
        );

        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}`,
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          date: today,
          checkInTime: currentTime12,
          checkInTimestamp: Date.now(),
          checkInLocation: {
            lat: loc.lat,
            lng: loc.lng,
            accuracy: loc.accuracy,
            distanceMeters: distance,
            withinGeofence: isWithinGeofence,
            networkType: net.type,
          },
          status: lateMinutes > 0 ? 'late' : 'present',
          lateMinutes: lateMinutes > 0 ? lateMinutes : 0,
        };

        onCheckIn(newRecord);
      } else {
        if (!todayRecord) {
          throw new Error('لم يتم تسجيل بصمة الدخول اليوم بعد');
        }

        const updatedRecord: AttendanceRecord = {
          ...todayRecord,
          checkOutTime: currentTime12,
          checkOutTimestamp: Date.now(),
          checkOutLocation: {
            lat: loc.lat,
            lng: loc.lng,
            accuracy: loc.accuracy,
            distanceMeters: distance,
            withinGeofence: isWithinGeofence,
          },
        };

        onCheckOut(updatedRecord);
      }
    } catch (err: any) {
      setGpsError(err?.message || 'تعذر التحقق من بصمة الموقع الجغرافي');
    } finally {
      setGpsLoading(false);
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      alert('يرجى كتابة سبب طلب الإجازة');
      return;
    }

    onRequestLeave({
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      type: leaveType,
      startDate,
      endDate,
      daysCount,
      reason: leaveReason.trim(),
    });

    setLeaveSuccessMsg('تم إرسال طلب الإجازة بنجاح إلى الإدارة للمراجعة والاعتماد');
    setLeaveReason('');
    setTimeout(() => setLeaveSuccessMsg(''), 4000);
  };

  // Submit Document
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      alert('يرجى إدخال عنوان الوثيقة');
      return;
    }

    onAddDocument({
      employeeId: employee.id,
      title: docTitle.trim(),
      category: docCategory,
      issueDate: docIssueDate,
      notes: docNotes.trim(),
      status: 'valid',
      fileName: `${docTitle.trim()}.pdf`,
    });

    setDocSuccessMsg('تمت إضافة وحفظ المستند في ملف أوراقك بنجاح');
    setShowDocModal(false);
    setDocTitle('');
    setDocNotes('');
    setTimeout(() => setDocSuccessMsg(''), 4000);
  };

  // Filter records and docs for this employee
  const myLeaves = leaveRequests.filter((l) => l.employeeId === employee.id);
  const myDocuments = documents.filter((d) => d.employeeId === employee.id);
  const myAttendance = attendanceRecords.filter((a) => a.employeeId === employee.id);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Employee Greeting & Live Time Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            {employee.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                مرحباً بك، {employee.name}
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                كود {employee.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {employee.department} • مؤسسة الفجر الخيرية
            </p>
          </div>
        </div>

        {/* 12-Hour Live Clock Component */}
        <div className="w-full sm:w-auto flex justify-center sm:justify-end">
          <DigitalClock />
        </div>
      </div>

      {/* Connectivity & Office Proximity Badge */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <Wifi className="w-4 h-4" />
            <span>الشبكة الحالية:</span>
          </span>
          <span className="bg-white/10 px-2.5 py-1 rounded-lg font-medium">
            {networkInfo.type}
          </span>
          <span className="text-slate-400 text-[11px]">
            (يعمل الدوام على أي شبكة شريحة أو واي فاي أو ADSL أو ستارلنك)
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>مقر الدوام: {settings.officeLocation.address}</span>
        </div>
      </div>

      {/* MAIN TAB CONTENT */}
      {/* 1. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Punch Box */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-1">
                تسجيل بصمة الدوام اليومي
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                ساعات العمل الرسمية: من {settings.workStartTime} إلى {settings.workEndTime} (نظام 12 ساعة)
              </p>

              {/* Status Display */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-right">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    بصمة الحضور اليوم:
                  </span>
                  <div className="text-sm sm:text-base font-black text-emerald-700 flex items-center gap-1.5 font-mono">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{todayRecord?.checkInTime || 'لم تسجل بعد'}</span>
                  </div>
                  {todayRecord?.lateMinutes ? (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold block mt-1">
                      تأخير: {todayRecord.lateMinutes} دقيقة
                    </span>
                  ) : null}
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-right">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    بصمة الانصراف اليوم:
                  </span>
                  <div className="text-sm sm:text-base font-black text-slate-700 flex items-center gap-1.5 font-mono">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{todayRecord?.checkOutTime || 'لم تسجل بعد'}</span>
                  </div>
                  {todayRecord?.checkOutTime && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold block mt-1">
                      تم اعتماد الخروج
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={Boolean(todayRecord?.checkInTime) || gpsLoading}
                  onClick={() => handleAttendanceAction('check-in')}
                  className={`flex-1 py-4 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    todayRecord?.checkInTime
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-700/20 active:scale-[0.98]'
                  }`}
                >
                  {gpsLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  )}
                  <span>
                    {todayRecord?.checkInTime ? 'تم تسجيل الحضور اليوم' : 'بصمة تسجيل الحضور'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={!todayRecord?.checkInTime || Boolean(todayRecord?.checkOutTime) || gpsLoading}
                  onClick={() => handleAttendanceAction('check-out')}
                  className={`flex-1 py-4 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    !todayRecord?.checkInTime || todayRecord?.checkOutTime
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white shadow-slate-900/20 active:scale-[0.98]'
                  }`}
                >
                  <LogOut className="w-5 h-5 text-amber-300" />
                  <span>
                    {todayRecord?.checkOutTime ? 'تم تسجيل الانصراف' : 'بصمة تسجيل الانصراف'}
                  </span>
                </button>
              </div>

              {/* Error or Notice Box */}
              {gpsError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-right flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">تنبيه في الموقع:</span>
                    <span>{gpsError}</span>
                  </div>
                </div>
              )}

              {currentDistance !== null && (
                <div className="mt-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
                  <span className="font-medium">المسافة المقاسة عن المقر:</span>
                  <span className="font-bold font-mono text-sm">
                    {currentDistance} متر (النطاق المسموح: {settings.officeLocation.radiusMeters}م)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Attendance History Table */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>سجل دوامي الأخير</span>
              </h4>
              {onOpenPrintReport && (
                <button
                  type="button"
                  onClick={onOpenPrintReport}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة تقريري</span>
                </button>
              )}
            </div>

            {myAttendance.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">
                لا توجد سجلات دوام سابقة مسجلة لك حتى الآن
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="pb-2.5">التاريخ</th>
                      <th className="pb-2.5">وقت الحضور (12 ساعة)</th>
                      <th className="pb-2.5">وقت الانصراف (12 ساعة)</th>
                      <th className="pb-2.5">الحالة</th>
                      <th className="pb-2.5">الموقع / الشبكة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myAttendance.slice(0, 7).map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="py-3 font-semibold text-slate-700">{rec.date}</td>
                        <td className="py-3 font-mono font-bold text-emerald-700">
                          {rec.checkInTime || '-'}
                        </td>
                        <td className="py-3 font-mono font-medium text-slate-600">
                          {rec.checkOutTime || '-'}
                        </td>
                        <td className="py-3">
                          {rec.status === 'late' ? (
                            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                              متأخر ({rec.lateMinutes} د)
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                              حاضر بالموعد
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-500 text-[11px]">
                          {rec.checkInLocation?.withinGeofence ? 'داخل المقر' : 'خارج المقر'} • {rec.checkInLocation?.networkType || 'شامل'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. LEAVES TAB (طلب إجازة) */}
      {activeTab === 'leaves' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Leave Balances Header Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-right">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                الرصيد السنوي المستحق
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                {employee.annualLeaveBalance}
              </span>
              <span className="text-xs text-slate-500 mr-1">يوم</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-right">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                الإجازات المستهلكة
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
                {employee.usedLeaveBalance}
              </span>
              <span className="text-xs text-slate-500 mr-1">يوم</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-right col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                الرصيد المتبقي المتاح
              </span>
              <span className="text-xl sm:text-2xl font-black text-teal-600 font-mono">
                {Math.max(0, employee.annualLeaveBalance - employee.usedLeaveBalance)}
              </span>
              <span className="text-xs text-slate-500 mr-1">يوم</span>
            </div>
          </div>

          {/* New Leave Request Form */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 text-base sm:text-lg mb-1 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              <span>تقديم طلب إجازة جديد</span>
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              سيتم إشعار إدارة مؤسسة الفجر فور تقديم الطلب للبت فيه واعتماده
            </p>

            {leaveSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{leaveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    نوع الإجازة المطلوبة
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="سنوية">إجازة اعتيادية سنوية</option>
                    <option value="مرضية">إجازة مرضية أو عيادة</option>
                    <option value="طارئة">إجازة اضطرارية طارئة</option>
                    <option value="ميدانية">مهمة عمل ميدانية خارجية</option>
                    <option value="إذن ساعي">إذن خروج ساعي (ساعات محددة)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    عدد الأيام المحسوبة
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={daysCount}
                    onChange={(e) => setDaysCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تاريخ العودة والانتهاء
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  سبب أو تفاصيل الإجازة
                </label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="اكتب أسباب طلب الإجازة بالتفصيل..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال طلب الإجازة للمدير</span>
              </button>
            </form>
          </div>

          {/* My Leaves History */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <h4 className="font-black text-slate-800 text-sm sm:text-base mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>طلبات الإجازة السابقة وحالتها</span>
            </h4>

            {myLeaves.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">
                لم تقدم أي طلب إجازة حتى الآن
              </p>
            ) : (
              <div className="space-y-2.5">
                {myLeaves.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-800">
                          إجازة {req.type} ({req.daysCount} أيام)
                        </span>
                        {req.status === 'approved' && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            معتمدة ومقبولة ✓
                          </span>
                        )}
                        {req.status === 'pending' && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                            قيد المراجعة ⏳
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                            مرفوضة ✕
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        من {req.startDate} إلى {req.endDate} • السبب: {req.reason}
                      </p>
                      {req.adminResponseNote && (
                        <p className="text-xs text-emerald-800 font-semibold mt-1 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-100">
                          ملاحظة الإدارة: {req.adminResponseNote}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {req.requestDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. DOCUMENTS TAB (أوراقي ومستنداتي) */}
      {activeTab === 'documents' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-black text-slate-800 text-base sm:text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>قسم أوراقي وملفاتي الوظيفية</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  أرشيف العقود والهوية الوطنية والمؤهلات والشهادات الخاصة بك لدى مؤسسة الفجر
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDocModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة وثيقة أو عقد</span>
              </button>
            </div>

            {docSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{docSuccessMsg}</span>
              </div>
            )}

            {/* Document list */}
            {myDocuments.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-bold text-xs sm:text-sm">
                  لا توجد وثائق محفوظة في ملفك حتى الآن
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  يمكنك إضافة صورة الهوية، عقد العمل، أو شهادة المؤهل بالضغط على الزر أعلاه
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {myDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/50 bg-white shadow-2xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          صادر: {doc.issueDate}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-800 text-sm mb-1">{doc.title}</h5>
                      {doc.notes && (
                        <p className="text-xs text-slate-500 line-clamp-2">{doc.notes}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ساري ومعتمد
                      </span>
                      <button
                        type="button"
                        onClick={() => alert(`تم تحميل واستعراض وثيقة: ${doc.title}`)}
                        className="text-slate-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل / عرض</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PROFILE TAB (الملف الشخصي والبيانات) */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100 space-y-5">
          <div>
            <h3 className="font-black text-slate-800 text-base sm:text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              <span>الملف التعريفي والبيانات الوظيفية</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              بيانات الموظف الرسمية المسجلة لدى شؤون الموظفين في مؤسسة الفجر الخيرية الاجتماعية
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-bold">الاسم الكامل</span>
              <span className="text-sm font-black text-slate-800">{employee.name}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-bold">الرقم الوظيفي / الكود</span>
              <span className="text-sm font-black text-emerald-700 font-mono">{employee.code}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-bold">القسم / الإدارة</span>
              <span className="text-sm font-bold text-slate-800">{employee.department}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-bold">رقم الهاتف للتواصل</span>
              <span className="text-sm font-bold text-slate-800 font-mono">{employee.phone}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-bold">رصيد الإجازات السنوي</span>
              <span className="text-sm font-bold text-emerald-800 font-mono">
                {employee.annualLeaveBalance} يوماً
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-bold">تاريخ الانضمام</span>
              <span className="text-sm font-bold text-slate-700 font-mono">
                {employee.joinDate || '2024-01-01'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Document */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-emerald-600 text-white flex items-center justify-between">
              <h4 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-300" />
                <span>إضافة وثيقة أو عقد لملف أوراقي</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان الوثيقة أو المستند
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عقد العمل الجديد 2026 أو بطاقة الهوية"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تصنيف الوثيقة
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="عقد عمل">عقد عمل</option>
                    <option value="هوية شخصية">هوية شخصية</option>
                    <option value="مؤهل علمي">مؤهل علمي</option>
                    <option value="شهادة خبرة">شهادة خبرة</option>
                    <option value="طلب رسمي">طلب رسمي</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ الإصدار
                  </label>
                  <input
                    type="date"
                    value={docIssueDate}
                    onChange={(e) => setDocIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات أو رقم الوثيقة
                </label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="أي تفاصيل إضافية عن الوثيقة..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ في أوراقي</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
