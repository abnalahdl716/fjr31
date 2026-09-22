import React, { useState } from 'react';
import {
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Sparkles,
  Search,
  Filter,
  Trash2,
  PlusCircle,
  Settings,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Employee, AttendanceRecord, LeaveRequest, DocumentItem, InstitutionSettings } from '../types';
import { DigitalClock } from './DigitalClock';
import { getTodayDateString } from '../utils/time';

interface AdminDashboardProps {
  settings: InstitutionSettings;
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  documents: DocumentItem[];
  onUpdateSettings: (settings: InstitutionSettings) => void;
  onAddEmployee: (emp: Employee) => void;
  onUpdateLeaveStatus: (leaveId: string, status: 'approved' | 'rejected', note?: string) => void;
  onOpenLocationPicker: () => void;
  onOpenPrintReport: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  employees,
  attendanceRecords,
  leaveRequests,
  documents,
  onUpdateSettings,
  onAddEmployee,
  onUpdateLeaveStatus,
  onOpenLocationPicker,
  onOpenPrintReport,
}) => {
  const today = getTodayDateString();
  const [adminTab, setAdminTab] = useState<'attendance' | 'leaves' | 'employees' | 'settings'>('attendance');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add Employee Form
  const [showAddEmpModal, setShowAddEmpModal] = useState<boolean>(false);
  const [newEmpName, setNewEmpName] = useState<string>('');
  const [newEmpCode, setNewEmpCode] = useState<string>('');
  const [newEmpPhone, setNewEmpPhone] = useState<string>('');
  const [newEmpDept, setNewEmpDept] = useState<string>('المشاريع الخيرية');
  const [newEmpLeaves, setNewEmpLeaves] = useState<number>(30);

  // Settings State
  const [startTime, setStartTime] = useState<string>(settings.workStartTime);
  const [endTime, setEndTime] = useState<string>(settings.workEndTime);
  const [graceMinutes, setGraceMinutes] = useState<number>(settings.lateGraceMinutes);
  const [officeAddress, setOfficeAddress] = useState<string>(settings.officeLocation.address);
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Today's stats
  const todayRecords = attendanceRecords.filter((r) => r.date === today);
  const presentCount = todayRecords.filter((r) => r.checkInTime).length;
  const lateCount = todayRecords.filter((r) => r.status === 'late').length;
  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'pending').length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      workStartTime: startTime,
      workEndTime: endTime,
      lateGraceMinutes: graceMinutes,
      officeLocation: {
        ...settings.officeLocation,
        address: officeAddress,
      },
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpCode.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmpName.trim(),
      code: newEmpCode.trim(),
      phone: newEmpPhone.trim() || '770000000',
      department: newEmpDept,
      role: 'employee',
      annualLeaveBalance: newEmpLeaves,
      usedLeaveBalance: 0,
      joinDate: today,
    };

    onAddEmployee(newEmp);
    setShowAddEmpModal(false);
    setNewEmpName('');
    setNewEmpCode('');
    setNewEmpPhone('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Admin Header with Clock and Stats */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              لوحة تحكم إدارة مؤسسة الفجر الخيرية
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة أوقات الدوام، طلبات الإجازات، الموظفين، وتقارير الحضور
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <DigitalClock />
          <button
            type="button"
            onClick={onOpenPrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقارير</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-right">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">
            إجمالي الموظفين
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono">
            {employees.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-right">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">
            حضور اليوم
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
            {presentCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-right">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">
            المتأخرين اليوم
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
            {lateCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-right">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">
            إجازات قيد الانتظار
          </span>
          <span className="text-xl sm:text-2xl font-black text-teal-600 font-mono">
            {pendingLeavesCount}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Admin */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1">
        <button
          type="button"
          onClick={() => setAdminTab('attendance')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            adminTab === 'attendance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          سجل الحضور اليومي
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('leaves')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer relative ${
            adminTab === 'leaves'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>طلبات الإجازات</span>
          {pendingLeavesCount > 0 && (
            <span className="mr-1.5 px-1.5 py-0.2 bg-amber-400 text-emerald-950 font-black text-[10px] rounded-full">
              {pendingLeavesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('employees')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            adminTab === 'employees'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          دليل الموظفين
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('settings')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            adminTab === 'settings'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          إعدادات المقر والدوام
        </button>
      </div>

      {/* 1. Admin Attendance */}
      {adminTab === 'attendance' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>سجل حضور وانصراف الموظفين</span>
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="pb-2.5">الموظف</th>
                  <th className="pb-2.5">التاريخ</th>
                  <th className="pb-2.5">الحضور (12 ساعة)</th>
                  <th className="pb-2.5">الانصراف (12 ساعة)</th>
                  <th className="pb-2.5">الحالة</th>
                  <th className="pb-2.5">الموقع والشبكة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRecords
                  .filter((r) =>
                    searchTerm ? r.employeeName.includes(searchTerm) : true
                  )
                  .map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-800">
                        {rec.employeeName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {rec.department}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{rec.date}</td>
                      <td className="py-3 font-mono font-bold text-emerald-700">
                        {rec.checkInTime || '-'}
                      </td>
                      <td className="py-3 font-mono font-medium text-slate-600">
                        {rec.checkOutTime || '-'}
                      </td>
                      <td className="py-3">
                        {rec.status === 'late' ? (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            تأخير {rec.lateMinutes} د
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            حضور بالموعد
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-[11px] text-slate-500">
                        {rec.checkInLocation?.withinGeofence ? '✓ داخل المقر' : 'خارج المقر'} • {rec.checkInLocation?.networkType || 'شامل'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Admin Leaves */}
      {adminTab === 'leaves' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 space-y-3">
          <h3 className="font-black text-slate-800 text-sm sm:text-base mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>طلبات الإجازات للموظفين والاعتماد</span>
          </h3>

          {leaveRequests.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-xs">
              لا توجد طلبات إجازة حالية
            </p>
          ) : (
            leaveRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">
                      {req.employeeName}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      إجازة {req.type} ({req.daysCount} أيام)
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {req.startDate} إلى {req.endDate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    السبب: {req.reason}
                  </p>
                  {req.adminResponseNote && (
                    <p className="text-xs text-emerald-700 mt-1 font-semibold">
                      رد الإدارة: {req.adminResponseNote}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateLeaveStatus(req.id, 'approved', 'تمت الموافقة من المدير')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>موافقة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateLeaveStatus(req.id, 'rejected', 'نعتذر لحاجة العمل الماسة')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status === 'approved' ? 'معتمدة ومقبولة' : 'مرفوضة'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. Admin Employees */}
      {adminTab === 'employees' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>قائمة الموظفين المسجلين</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddEmpModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-800">
                      {emp.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {emp.department} • كود: {emp.code}
                    </div>
                  </div>
                </div>
                <div className="text-left text-xs font-mono font-bold text-emerald-700">
                  {emp.annualLeaveBalance - emp.usedLeaveBalance} يوم إجازة
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Admin Settings */}
      {adminTab === 'settings' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 text-base mb-1 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>إعدادات الدوام والموقع الجغرافي</span>
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            ضبط ساعات العمل الرسمية بنظام 12 ساعة، ونطاق المقر الرئيسي لمؤسسة الفجر
          </p>

          {settingsSaved && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم حفظ الإعدادات وتطبيقها بنجاح</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  بداية الدوام الرسمي
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نهاية الدوام الرسمي
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  فترة السماح بالتأخير (دقائق)
                </label>
                <input
                  type="number"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Location configuration */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs sm:text-sm text-emerald-950 block">
                  موقع المقر ونطاق البصمة (GPS)
                </span>
                <span className="text-xs text-emerald-800">
                  {settings.officeLocation.address} (نطاق {settings.officeLocation.radiusMeters} متر)
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenLocationPicker}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-amber-300" />
                <span>تعديل موقع المقر على الخريطة</span>
              </button>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                حفظ التعديلات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>إضافة موظف جديد لمؤسسة الفجر</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddEmpModal(false)}
                className="text-white hover:bg-white/20 p-1 rounded-full cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف</label>
                <input
                  type="text"
                  required
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                  placeholder="مثال: أحمد خالد البار"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكود / الرمز</label>
                  <input
                    type="text"
                    required
                    value={newEmpCode}
                    onChange={(e) => setNewEmpCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono"
                    placeholder="مثال: 1005"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الهاتف</label>
                  <input
                    type="text"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono"
                    placeholder="770000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">القسم</label>
                <input
                  type="text"
                  value={newEmpDept}
                  onChange={(e) => setNewEmpDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                  placeholder="مثال: الشؤون المالية"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رصيد الإجازات السنوية</label>
                <input
                  type="number"
                  value={newEmpLeaves}
                  onChange={(e) => setNewEmpLeaves(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
                >
                  إضافة وحفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
