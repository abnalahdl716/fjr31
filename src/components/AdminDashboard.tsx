import React, { useState } from 'react';
import {
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Settings as SettingsIcon,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Eye,
  KeyRound,
  UserX,
  UserCheck,
  Printer,
  Download,
  Upload,
  MapPin,
  Palmtree,
  History,
  Search,
  Filter,
  Sliders,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  ExcuseRequest,
  LeaveRuleConfig,
  SystemSettings,
  ActivityLogEntry,
} from '../types';
import {
  getCurrentTime12h,
  getCurrentTime24h,
  formatDateIso,
  formatDateNumeric,
  formatSecondsToArabic,
  formatSecondsDigital,
  calculateLateSeconds,
} from '../utils/time';
import { MapLocationPicker } from './MapLocationPicker';
import { PrintReportModal } from './PrintReportModal';
import { Storage } from '../utils/storage';

interface AdminDashboardProps {
  settings: SystemSettings;
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  excuseRequests: ExcuseRequest[];
  leaveRules: LeaveRuleConfig[];
  activityLogs: ActivityLogEntry[];
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  onUpdateLeaves: (leaves: LeaveRequest[]) => void;
  onUpdateExcuses: (excuses: ExcuseRequest[]) => void;
  onUpdateRules: (rules: LeaveRuleConfig[]) => void;
  onLogActivity: (action: string, details: string) => void;
  onResetAllData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  employees,
  attendanceRecords,
  leaveRequests,
  excuseRequests,
  leaveRules,
  activityLogs,
  onUpdateSettings,
  onUpdateEmployees,
  onUpdateAttendance,
  onUpdateLeaves,
  onUpdateExcuses,
  onUpdateRules,
  onLogActivity,
  onResetAllData,
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'overview' | 'employees' | 'attendance' | 'leaves' | 'excuses' | 'reports' | 'leave_report' | 'settings' | 'audit_logs'
  >('overview');

  // Modals
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [printModal, setPrintModal] = useState<{
    isOpen: boolean;
    type: 'attendance' | 'leaves';
  }>({ isOpen: false, type: 'attendance' });

  // Employee Edit / Add Modal
  const [employeeModal, setEmployeeModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    data: Partial<Employee>;
  }>({
    isOpen: false,
    mode: 'add',
    data: {},
  });

  // Employee Profile / History View Modal
  const [viewEmployeeModal, setViewEmployeeModal] = useState<{
    isOpen: boolean;
    employee: Employee | null;
    tab: 'profile' | 'attendance' | 'leaves' | 'excuses';
  }>({
    isOpen: false,
    employee: null,
    tab: 'profile',
  });

  // Attendance Record Edit Modal
  const [attendanceEditModal, setAttendanceEditModal] = useState<{
    isOpen: boolean;
    record: Partial<AttendanceRecord> | null;
  }>({
    isOpen: false,
    record: null,
  });

  // Reports Filter state
  const [reportFilter, setReportFilter] = useState({
    employeeId: 'all',
    startDate: '2026-09-01',
    endDate: formatDateIso(new Date()),
  });

  // System Settings state
  const [tempSettings, setTempSettings] = useState<SystemSettings>(settings);
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoUrl);

  // Today stats calculation
  const todayIso = formatDateIso(new Date());
  const todayAttendance = attendanceRecords.filter((r) => r.date === todayIso);
  const activeEmployees = employees.filter((e) => e.status === 'active');

  const presentTodayCount = todayAttendance.filter((r) => r.status === 'present' || r.status === 'late').length;
  const lateTodayCount = todayAttendance.filter((r) => r.status === 'late').length;
  const onLeaveTodayCount = todayAttendance.filter((r) => r.status === 'on_leave').length;
  const absentTodayCount = Math.max(0, activeEmployees.length - presentTodayCount - onLeaveTodayCount);

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'pending').length;
  const pendingExcusesCount = excuseRequests.filter((e) => e.status === 'pending').length;

  // Search in employees
  const [employeeSearch, setEmployeeSearch] = useState('');
  const filteredEmployees = employees.filter(
    (e) =>
      e.name.includes(employeeSearch) ||
      e.username.includes(employeeSearch) ||
      e.phone.includes(employeeSearch) ||
      e.jobTitle.includes(employeeSearch)
  );

  // Handle Logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const resultStr = reader.result as string;
          setLogoPreview(resultStr);
          setTempSettings({ ...tempSettings, logoUrl: resultStr });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(tempSettings);
    onLogActivity(
      'تحديث إعدادات النظام',
      `قام مسؤول النظام بتحديث إعدادات المؤسسة وساعات العمل والموقع الجغرافي`
    );
    alert('تم حفظ إعدادات النظام وتحديث الشعار بنجاح');
  };

  // Employee CRUD
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const data = employeeModal.data;
    if (!data.name || !data.username || !data.password) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (employeeModal.mode === 'add') {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: data.name,
        jobTitle: data.jobTitle || 'موظف',
        phone: data.phone || '',
        username: data.username,
        password: data.password,
        startDate: data.startDate || formatDateIso(new Date()),
        annualLeaveBalance: data.annualLeaveBalance ?? 30,
        usedLeaveBalance: data.usedLeaveBalance ?? 0,
        remainingLeaveBalance: (data.annualLeaveBalance ?? 30) - (data.usedLeaveBalance ?? 0),
        status: data.status || 'active',
        email: data.email,
        notes: data.notes,
      };

      onUpdateEmployees([...employees, newEmp]);
      onLogActivity('إضافة موظف جديد', `تمت إضافة الموظف ${newEmp.name} برقم وظيفي جديد`);
    } else {
      const updated = employees.map((emp) => {
        if (emp.id === data.id) {
          const rem = (data.annualLeaveBalance ?? emp.annualLeaveBalance) - (data.usedLeaveBalance ?? emp.usedLeaveBalance);
          return {
            ...emp,
            ...data,
            remainingLeaveBalance: rem,
          } as Employee;
        }
        return emp;
      });
      onUpdateEmployees(updated);
      onLogActivity('تعديل بيانات موظف', `تم تعديل بيانات الموظف ${data.name}`);
    }

    setEmployeeModal({ isOpen: false, mode: 'add', data: {} });
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (confirm(`هل أنت متأكد من حذف الموظف ${emp.name} نهائياً؟`)) {
      const updated = employees.filter((e) => e.id !== emp.id);
      onUpdateEmployees(updated);
      onLogActivity('حذف موظف', `قام المسؤول بحذف الموظف ${emp.name}`);
    }
  };

  const handleToggleEmployeeStatus = (emp: Employee) => {
    const newStatus: 'active' | 'inactive' = emp.status === 'active' ? 'inactive' : 'active';
    const updated: Employee[] = employees.map((e) =>
      e.id === emp.id ? { ...e, status: newStatus } : e
    );
    onUpdateEmployees(updated);
    onLogActivity(
      newStatus === 'active' ? 'إعادة تنشيط حساب موظف' : 'تعطيل حساب موظف',
      `تم تغيير حالة حساب الموظف ${emp.name} إلى ${newStatus === 'active' ? 'نشط' : 'معطّل'}`
    );
  };

  // Leave Approval / Rejection with configurable rule deduction (Section 9)
  const handleLeaveReview = (leave: LeaveRequest, newStatus: 'approved' | 'rejected') => {
    const rule = leaveRules.find((r) => r.leaveType === leave.leaveType);
    let shouldDeduct = false;

    if (newStatus === 'approved') {
      shouldDeduct = rule ? rule.deductFromBalanceOnApprove : true;
    } else {
      shouldDeduct = rule ? rule.deductFromBalanceOnReject : false;
    }

    // Update Employee balance if needed
    if (shouldDeduct) {
      const updatedEmps = employees.map((emp) => {
        if (emp.id === leave.employeeId) {
          const newUsed = emp.usedLeaveBalance + leave.daysCount;
          const newRem = Math.max(0, emp.annualLeaveBalance - newUsed);
          return {
            ...emp,
            usedLeaveBalance: newUsed,
            remainingLeaveBalance: newRem,
          };
        }
        return emp;
      });
      onUpdateEmployees(updatedEmps);
    }

    // Update Leave request status
    const updatedLeaves = leaveRequests.map((l) =>
      l.id === leave.id
        ? {
            ...l,
            status: newStatus,
            reviewedAt: `${formatDateNumeric()} ${getCurrentTime12h()}`,
          }
        : l
    );
    onUpdateLeaves(updatedLeaves);

    onLogActivity(
      newStatus === 'approved' ? 'الموافقة على طلب إجازة' : 'رفض طلب إجازة',
      `تم ${newStatus === 'approved' ? 'قبول' : 'رفض'} إجازة الموظف ${leave.employeeName} (${leave.leaveType} - ${leave.daysCount} أيام)`
    );
  };

  // Excuse Approval / Rejection (Section 7)
  const handleExcuseReview = (excuse: ExcuseRequest, newStatus: 'approved' | 'rejected') => {
    const updatedExcuses = excuseRequests.map((e) =>
      e.id === excuse.id
        ? {
            ...e,
            status: newStatus,
            reviewedAt: `${formatDateNumeric()} ${getCurrentTime12h()}`,
          }
        : e
    );
    onUpdateExcuses(updatedExcuses);

    // If approved, mark the matching attendance record as lateExcused / earlyExcused so duration is NOT counted!
    if (newStatus === 'approved') {
      const updatedAttendance = attendanceRecords.map((att) => {
        if (att.employeeId === excuse.employeeId && att.date === excuse.date) {
          return {
            ...att,
            lateExcused: excuse.type === 'late' ? true : att.lateExcused,
            earlyExcused: excuse.type === 'early_departure' ? true : att.earlyExcused,
          };
        }
        return att;
      });
      onUpdateAttendance(updatedAttendance);
    }

    onLogActivity(
      newStatus === 'approved' ? 'الموافقة على طلب عذر' : 'رفض طلب عذر',
      `تمت مراجعة عذر الموظف ${excuse.employeeName} بتاريخ ${excuse.date}: الحالة (${newStatus === 'approved' ? 'موافقة - إعفاء من احتساب التأخير' : 'مرفوض - يُحسب التأخير'})`
    );
  };

  // Attendance Record Edit / Delete (Section 17)
  const handleSaveAttendanceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceEditModal.record) return;

    const rec = attendanceEditModal.record;
    const updated = attendanceRecords.map((r) => (r.id === rec.id ? (rec as AttendanceRecord) : r));
    onUpdateAttendance(updated);

    onLogActivity(
      `تعديل سجل حضور الموظف ${rec.employeeName}`,
      `قام المسؤول fjr بتعديل وقت الحضور إلى (${rec.checkInTime || '—'}) والانصراف إلى (${rec.checkOutTime || '—'})`
    );

    setAttendanceEditModal({ isOpen: false, record: null });
  };

  const handleDeleteAttendanceRecord = (rec: AttendanceRecord) => {
    if (confirm(`هل أنت متأكد من حذف سجل حضور الموظف ${rec.employeeName} بتاريخ ${rec.date}؟`)) {
      const updated = attendanceRecords.filter((r) => r.id !== rec.id);
      onUpdateAttendance(updated);
      onLogActivity(
        `حذف سجل حضور`,
        `قام المسؤول بحذف سجل حضور الموظف ${rec.employeeName} ليوم ${rec.date}`
      );
    }
  };

  // Filtered reports records
  const filteredReportRecords = attendanceRecords.filter((r) => {
    const matchesEmp = reportFilter.employeeId === 'all' || r.employeeId === reportFilter.employeeId;
    const matchesDate = r.date >= reportFilter.startDate && r.date <= reportFilter.endDate;
    return matchesEmp && matchesDate;
  });

  const filteredLeaveReport = leaveRequests.filter((l) => {
    const matchesEmp = reportFilter.employeeId === 'all' || l.employeeId === reportFilter.employeeId;
    return matchesEmp;
  });

  // Calculate totals for report
  const reportTotalLateSeconds = filteredReportRecords.reduce(
    (acc, curr) => acc + (curr.lateExcused ? 0 : curr.lateSeconds || 0),
    0
  );
  const reportTotalEarlySeconds = filteredReportRecords.reduce(
    (acc, curr) => acc + (curr.earlyExcused ? 0 : curr.earlyDepartureSeconds || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 10. لوحة تحكم المسؤول الرئيسية - 7 Stat Cards as specified in Section 10 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. إجمالي الموظفين */}
        <button
          onClick={() => setActiveTab('employees')}
          className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-right shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">👥 إجمالي الموظفين</span>
          </div>
          <span className="text-xl font-black font-mono-num text-slate-900 block">
            {employees.length}
          </span>
          <span className="text-[10px] text-slate-400">النشط: {activeEmployees.length}</span>
        </button>

        {/* 2. الحاضر اليوم */}
        <button
          onClick={() => setActiveTab('attendance')}
          className="bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-2xl p-3.5 text-right shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold">🟢 الحاضر اليوم</span>
          </div>
          <span className="text-xl font-black font-mono-num text-emerald-700 block">
            {presentTodayCount}
          </span>
          <span className="text-[10px] text-emerald-600">سجلوا حضورهم</span>
        </button>

        {/* 3. الموظفون المتأخرون */}
        <button
          onClick={() => setActiveTab('attendance')}
          className="bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 rounded-2xl p-3.5 text-right shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-bold">🟠 المتأخرون اليوم</span>
          </div>
          <span className="text-xl font-black font-mono-num text-amber-700 block">
            {lateTodayCount}
          </span>
          <span className="text-[10px] text-amber-600">تجاوزوا {settings.workStartTime}</span>
        </button>

        {/* 4. الموظفون الغائبون */}
        <button
          onClick={() => setActiveTab('attendance')}
          className="bg-red-50/70 hover:bg-red-100/70 border border-red-200 rounded-2xl p-3.5 text-right shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between text-red-800 mb-1">
            <span className="text-xs font-bold">🔴 الغائبون اليوم</span>
          </div>
          <span className="text-xl font-black font-mono-num text-red-700 block">
            {absentTodayCount}
          </span>
          <span className="text-[10px] text-red-600">بدون تسجيل حضور</span>
        </button>

        {/* 5. الموظفون في إجازة */}
        <button
          onClick={() => setActiveTab('leaves')}
          className="bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-2xl p-3.5 text-right shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between text-blue-800 mb-1">
            <span className="text-xs font-bold">🏖️ في إجازة</span>
          </div>
          <span className="text-xl font-black font-mono-num text-blue-700 block">
            {onLeaveTodayCount}
          </span>
          <span className="text-[10px] text-blue-600">إجازات رسمية</span>
        </button>

        {/* 6. طلبات الإجازة الجديدة */}
        <button
          onClick={() => setActiveTab('leaves')}
          className="bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-300 rounded-2xl p-3.5 text-right shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold">📝 إجازات جديدة</span>
          </div>
          <span className="text-xl font-black font-mono-num text-emerald-800 block">
            {pendingLeavesCount}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">قيد المراجعة</span>
        </button>

        {/* 7. طلبات أعذار جديدة */}
        <button
          onClick={() => setActiveTab('excuses')}
          className="bg-amber-50/70 hover:bg-amber-100/70 border border-amber-300 rounded-2xl p-3.5 text-right shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-bold">⚠️ أعذار جديدة</span>
          </div>
          <span className="text-xl font-black font-mono-num text-amber-800 block">
            {pendingExcusesCount}
          </span>
          <span className="text-[10px] text-amber-700 font-bold">قيد المراجعة</span>
        </button>
      </div>

      {/* Main Admin Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-thin">
        {[
          { id: 'overview', label: '📊 نظرة عامة', count: null },
          { id: 'employees', label: '👥 إدارة الموظفين', count: employees.length },
          { id: 'attendance', label: '📋 الحضور والانصراف', count: todayAttendance.length },
          { id: 'leaves', label: '🏖️ طلبات الإجازات', count: pendingLeavesCount },
          { id: 'excuses', label: '⚠️ مراجعة الأعذار', count: pendingExcusesCount },
          { id: 'reports', label: '📑 تقرير الحضور والطباعة', count: null },
          { id: 'leave_report', label: '🏖️ تقرير الإجازات', count: null },
          { id: 'settings', label: '⚙️ إعدادات النظام', count: null },
          { id: 'audit_logs', label: '📜 سجل النشاط والتدقيق', count: activityLogs.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: 📊 Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Working hours & GPS live banner */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-right">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                مقر المنظمة النشط
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {settings.orgName}
              </h3>
              <p className="text-xs text-slate-600 flex items-center gap-1 justify-center md:justify-start">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{settings.orgLocation.address}</span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-emerald-700">نصف قطر الـ GPS: {settings.gpsRadiusMeters} متر</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowMapPicker(true)}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>تعديل موقع المنظمة على الخريطة</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>إنشاء وطباعة التقارير</span>
              </button>
            </div>
          </div>

          {/* Today's live attendance snapshot table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-800">
                  كشف الحضور والانصراف الميداني لليوم
                </h4>
              </div>
              <span className="text-xs font-mono-num text-slate-500">
                {formatDateNumeric(new Date())}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">الموظف</th>
                    <th className="p-3.5">الوظيفة</th>
                    <th className="p-3.5">وقت الحضور</th>
                    <th className="p-3.5">الموقع الجغرافي</th>
                    <th className="p-3.5">وقت الانصراف</th>
                    <th className="p-3.5">التأخير المسجل</th>
                    <th className="p-3.5">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {todayAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        لم يقم أي موظف بتسجيل الحضور حتى الآن اليوم
                      </td>
                    </tr>
                  ) : (
                    todayAttendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{rec.employeeName}</td>
                        <td className="p-3.5 text-xs text-slate-500">
                          {employees.find((e) => e.id === rec.employeeId)?.jobTitle || 'موظف'}
                        </td>
                        <td className="p-3.5 font-mono-num font-semibold text-emerald-800">
                          {rec.checkInTime || '—'}
                        </td>
                        <td className="p-3.5 text-xs">
                          {rec.checkInLocation?.insideRadius ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>نطاق المنظمة ({rec.checkInLocation.distanceMeters}م)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono-num font-semibold text-amber-800">
                          {rec.checkOutTime || '—'}
                        </td>
                        <td className="p-3.5 font-mono-num">
                          {rec.lateExcused ? (
                            <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                              معفى بعذر
                            </span>
                          ) : rec.lateSeconds > 0 ? (
                            <span className="text-red-600 font-bold">
                              {formatSecondsDigital(rec.lateSeconds)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${
                              rec.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'late'
                                ? 'bg-amber-100 text-amber-800'
                                : rec.status === 'on_leave'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {rec.status === 'present'
                              ? 'حاضر'
                              : rec.status === 'late'
                              ? 'متأخر'
                              : rec.status === 'on_leave'
                              ? 'إجازة'
                              : 'غائب'}
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

      {/* Tab: 👥 إدارة الموظفين (Employee Management - Section 4) */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم، الوظيفة، الهاتف..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => {
                setEmployeeModal({
                  isOpen: true,
                  mode: 'add',
                  data: {
                    annualLeaveBalance: 30,
                    usedLeaveBalance: 0,
                    status: 'active',
                    startDate: formatDateIso(new Date()),
                  },
                });
              }}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">اسم الموظف</th>
                    <th className="p-3.5">نوع الوظيفة</th>
                    <th className="p-3.5">رقم التليفون</th>
                    <th className="p-3.5">اسم المستخدم</th>
                    <th className="p-3.5">تاريخ البدء</th>
                    <th className="p-3.5 text-center">الرصيد السنوي</th>
                    <th className="p-3.5 text-center">المستخدم</th>
                    <th className="p-3.5 text-center">المتبقي</th>
                    <th className="p-3.5 text-center">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-700">لا يوجد موظفون مسجلون حالياً</p>
                          <p className="text-xs text-slate-400">
                            انقر على زر "إضافة موظف جديد" للبدء بإضافة الموظفين وتعيين بياناتهم
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{emp.name}</td>
                        <td className="p-3.5 text-slate-600">{emp.jobTitle}</td>
                        <td className="p-3.5 font-mono-num" dir="ltr">{emp.phone}</td>
                        <td className="p-3.5 font-mono-num font-semibold text-emerald-800">{emp.username}</td>
                        <td className="p-3.5 font-mono-num text-slate-500">{emp.startDate}</td>
                        <td className="p-3.5 text-center font-mono-num font-bold">{emp.annualLeaveBalance}</td>
                        <td className="p-3.5 text-center font-mono-num text-amber-700 font-bold">{emp.usedLeaveBalance}</td>
                        <td className="p-3.5 text-center font-mono-num text-emerald-700 font-bold">{emp.remainingLeaveBalance}</td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${
                              emp.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {emp.status === 'active' ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* View Profile & History */}
                            <button
                              title="عرض الملف وسجل الحضور والإجازات"
                              onClick={() =>
                                setViewEmployeeModal({
                                  isOpen: true,
                                  employee: emp,
                                  tab: 'profile',
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-emerald-600" />
                            </button>

                            {/* Edit Employee */}
                            <button
                              title="تعديل الموظف"
                              onClick={() =>
                                setEmployeeModal({
                                  isOpen: true,
                                  mode: 'edit',
                                  data: emp,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4 text-amber-600" />
                            </button>

                            {/* Toggle Active / Inactive */}
                            <button
                              title={emp.status === 'active' ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                              onClick={() => handleToggleEmployeeStatus(emp)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              {emp.status === 'active' ? (
                                <UserX className="w-4 h-4 text-orange-600" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-emerald-600" />
                              )}
                            </button>

                            {/* Delete Employee */}
                            <button
                              title="حذف الموظف"
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
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

      {/* Tab: 📋 الحضور والانصراف الكامل وتعديل السجلات (Section 5, 6, 17) */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                سجل الحضور والانصراف الميداني (قابلة للتحرير والحذف مع قيد النشاط)
              </h3>
              <p className="text-xs text-slate-500">
                تسجيل الوقت بالثواني، وحساب التأخير والانصراف المبكر تلقائياً
              </p>
            </div>
            <button
              onClick={() => {
                if (employees.length === 0) {
                  alert('يرجى إضافة موظف أولاً من تبويب (إدارة الموظفين) قبل تسجيل قيد حضور يدوي.');
                  return;
                }
                const newRec: AttendanceRecord = {
                  id: `att-${Date.now()}`,
                  employeeId: employees[0].id,
                  employeeName: employees[0].name,
                  date: formatDateIso(new Date()),
                  checkInTime: '08:00:00',
                  checkOutTime: '14:00:00',
                  lateSeconds: 0,
                  earlyDepartureSeconds: 0,
                  lateExcused: false,
                  earlyExcused: false,
                  status: 'present',
                };
                setAttendanceEditModal({ isOpen: true, record: newRec });
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قيد حضور يدوي</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">اسم الموظف</th>
                    <th className="p-3.5">تحقق في (حضور)</th>
                    <th className="p-3.5">الدفع (انصراف)</th>
                    <th className="p-3.5">التأخير (بالثواني)</th>
                    <th className="p-3.5">الانصراف المبكر</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Clock className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-700">لا توجد سجلات حضور وانصراف حالياً</p>
                          <p className="text-xs text-slate-400">
                            ستظهر السجلات هنا تلقائياً عند تسجيل الموظفين لحركات الحضور أو عند الإضافة اليدوية
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono-num font-semibold text-slate-700">{rec.date}</td>
                        <td className="p-3.5 font-bold text-slate-900">{rec.employeeName}</td>
                        <td className="p-3.5 font-mono-num text-emerald-800 font-medium">{rec.checkInTime || '—'}</td>
                        <td className="p-3.5 font-mono-num text-amber-800 font-medium">{rec.checkOutTime || '—'}</td>
                        <td className="p-3.5 font-mono-num">
                          {rec.lateExcused ? (
                            <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                              معفى بعذر
                            </span>
                          ) : rec.lateSeconds > 0 ? (
                            <span className="text-red-600 font-bold">
                              {formatSecondsDigital(rec.lateSeconds)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono-num">
                          {rec.earlyDepartureSeconds > 0 ? (
                            <span className="text-amber-600 font-bold">
                              {formatSecondsDigital(rec.earlyDepartureSeconds)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${
                              rec.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'late'
                                ? 'bg-amber-100 text-amber-800'
                                : rec.status === 'on_leave'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {rec.status === 'present'
                              ? 'حاضر'
                              : rec.status === 'late'
                              ? 'متأخر'
                              : rec.status === 'on_leave'
                              ? 'إجازة'
                              : 'غائب'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              title="تعديل السجل"
                              onClick={() => setAttendanceEditModal({ isOpen: true, record: rec })}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              title="حذف السجل"
                              onClick={() => handleDeleteAttendanceRecord(rec)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Tab: 🏖️ طلبات الإجازات وقواعد الإجازة (Sections 8, 9) */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          {/* Leave Requests Review Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Palmtree className="w-4 h-4 text-emerald-600" />
                <span>مراجعة واعتماد طلبات الإجازات</span>
              </h3>
              <span className="text-xs text-slate-500">
                الطلبات المعلقة: {pendingLeavesCount}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">الموظف</th>
                    <th className="p-3.5">نوع الإجازة</th>
                    <th className="p-3.5">الفترة</th>
                    <th className="p-3.5 text-center">الأيام</th>
                    <th className="p-3.5">السبب والمرفقات</th>
                    <th className="p-3.5 text-center">الحالة</th>
                    <th className="p-3.5 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Palmtree className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-700">لا توجد طلبات إجازة مسجلة</p>
                          <p className="text-xs text-slate-400">
                            ستظهر طلبات الإجازات المقدمة من الموظفين هنا لمراجعتها واعتمادها
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{leave.employeeName}</td>
                        <td className="p-3.5 font-semibold text-emerald-900">{leave.leaveType}</td>
                        <td className="p-3.5 font-mono-num text-xs text-slate-600">
                          {leave.startDate} ⬅️ {leave.endDate}
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-900">{leave.daysCount} يوم</td>
                        <td className="p-3.5 text-slate-600 max-w-xs">
                          <div>{leave.reason}</div>
                          {leave.attachmentName && (
                            <span className="inline-block mt-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                              📎 {leave.attachmentName}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${
                              leave.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : leave.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {leave.status === 'approved'
                              ? '🟢 موافقة'
                              : leave.status === 'rejected'
                              ? '🔴 مرفوض'
                              : '🟠 قيد المراجعة'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {leave.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleLeaveReview(leave, 'approved')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                              >
                                موافقة
                              </button>
                              <button
                                onClick={() => handleLeaveReview(leave, 'rejected')}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                              >
                                رفض
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">تم البت بالطلب</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 9. اترك الإعدادات (Leave Rules Settings as specified in Section 9) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>إعدادات وقواعد الإجازات (قابلة للتعديل وغير مضمنة بشكل ثابت)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  التحكم في قواعد الخصم من الرصيد السنوي عند الموافقة أو الرفض واشتراط الاعتماد
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leaveRules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-950">{rule.leaveType}</span>
                    <span className="text-xs font-mono-num bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      الرصيد الافتراضي: {rule.defaultAnnualBalance} يوم
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.deductFromBalanceOnApprove}
                        onChange={(e) => {
                          const updated = [...leaveRules];
                          updated[idx].deductFromBalanceOnApprove = e.target.checked;
                          onUpdateRules(updated);
                        }}
                        className="rounded-md text-emerald-600 accent-emerald-600"
                      />
                      <span>تُخصم من رصيد الإجازات السنوية عند <strong>الموافقة</strong></span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.deductFromBalanceOnReject}
                        onChange={(e) => {
                          const updated = [...leaveRules];
                          updated[idx].deductFromBalanceOnReject = e.target.checked;
                          onUpdateRules(updated);
                        }}
                        className="rounded-md text-amber-600 accent-amber-600"
                      />
                      <span>تُخصم من الرصيد حتى عند <strong>الرفض</strong> (قاعدة خاصة مطلوبة)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.requireAttachment}
                        onChange={(e) => {
                          const updated = [...leaveRules];
                          updated[idx].requireAttachment = e.target.checked;
                          onUpdateRules(updated);
                        }}
                        className="rounded-md text-emerald-600 accent-emerald-600"
                      />
                      <span>إلزامية إرفاق وثيقة أو تقرير طبي</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: ⚠️ مراجعة الأعذار (Section 7) */}
      {activeTab === 'excuses' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>مراجعة طلبات الاعتذار (تأخر في الوصول أو انصراف مبكر)</span>
              </h3>
              <p className="text-xs text-slate-500">
                في حال الموافقة: لا يتم احتساب مدة التأخير. في حال الرفض: يتم احتساب مدة التأخير الفعلية.
              </p>
            </div>
            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
              {pendingExcusesCount} طلبات جديدة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">الموظف</th>
                  <th className="p-3.5">نوع العذر</th>
                  <th className="p-3.5">التاريخ والوقت</th>
                  <th className="p-3.5">مدة التأخير المقابلة</th>
                  <th className="p-3.5">السبب والتوضيح</th>
                  <th className="p-3.5">المرفقات</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {excuseRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertTriangle className="w-8 h-8 text-slate-300" />
                        <p className="font-bold text-slate-700">لا توجد طلبات أعذار مسجلة</p>
                        <p className="text-xs text-slate-400">
                          ستظهر طلبات الأعذار المقدمة من الموظفين هنا للبت فيها وإعفاء التأخير أو احتسابه
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  excuseRequests.map((excuse) => (
                    <tr key={excuse.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{excuse.employeeName}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {excuse.type === 'late' ? 'عذر تأخر في الوصول' : 'عذر مغادرة مبكرة'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono-num text-xs">
                        <div>{excuse.date}</div>
                        <div className="text-slate-500">{excuse.targetTime}</div>
                      </td>
                      <td className="p-3.5 font-mono-num font-bold text-red-700">
                        {formatSecondsDigital(excuse.durationSeconds)}
                      </td>
                      <td className="p-3.5 max-w-xs text-xs">
                        <strong className="block text-slate-800">{excuse.reason}</strong>
                        <p className="text-slate-500 truncate">{excuse.explanation}</p>
                      </td>
                      <td className="p-3.5 text-xs">
                        {excuse.attachmentName ? (
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            📎 {excuse.attachmentName}
                          </span>
                        ) : (
                          <span className="text-slate-400">لا يوجد مرفق</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${
                            excuse.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : excuse.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {excuse.status === 'approved'
                            ? '🟢 موافقة (معفى)'
                            : excuse.status === 'rejected'
                            ? '🔴 مرفوض (محسوب)'
                            : '🟠 قيد المراجعة'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {excuse.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleExcuseReview(excuse, 'approved')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              موافقة
                            </button>
                            <button
                              onClick={() => handleExcuseReview(excuse, 'rejected')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              رفض
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">تم البت</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: 📑 تقرير الحضور والمغادرة والطباعة (Section 12, 14) */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Report Filter Controls */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تحديد الموظف
              </label>
              <select
                value={reportFilter.employeeId}
                onChange={(e) => setReportFilter({ ...reportFilter, employeeId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">جميع الموظفين</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.jobTitle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                من تاريخ
              </label>
              <input
                type="date"
                value={reportFilter.startDate}
                onChange={(e) => setReportFilter({ ...reportFilter, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                حتى تاريخ
              </label>
              <input
                type="date"
                value={reportFilter.endDate}
                onChange={(e) => setReportFilter({ ...reportFilter, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrintModal({ isOpen: true, type: 'attendance' })}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة ومعاينة التقرير الرسمي</span>
              </button>
            </div>
          </div>

          {/* Generated Report Table Display */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">
                نتائج التقرير للفترة: {reportFilter.startDate} إلى {reportFilter.endDate}
              </h4>
              <span className="text-xs text-slate-500 font-mono-num">
                {filteredReportRecords.length} سجلات
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">تاريخ</th>
                    <th className="p-3">الموظف</th>
                    <th className="p-3">تحقق في (حضور)</th>
                    <th className="p-3">الدفع (انصراف)</th>
                    <th className="p-3">متأخر (بالثواني)</th>
                    <th className="p-3">المغادرة المبكرة</th>
                    <th className="p-3 text-center">حالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredReportRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-700">لا توجد بيانات مطابقة للتقرير في الفترة المحددة</p>
                          <p className="text-xs text-slate-400">
                            يرجى تغيير معايير البحث أو تسجيل حركات حضور جديدة
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReportRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono-num">{r.date}</td>
                        <td className="p-3 font-bold">{r.employeeName}</td>
                        <td className="p-3 font-mono-num text-emerald-800">{r.checkInTime || '—'}</td>
                        <td className="p-3 font-mono-num text-amber-800">{r.checkOutTime || '—'}</td>
                        <td className="p-3 font-mono-num">
                          {r.lateExcused ? (
                            <span className="text-emerald-600 text-xs font-bold">معفى</span>
                          ) : r.lateSeconds > 0 ? (
                            <span className="text-red-600 font-bold">
                              {formatSecondsDigital(r.lateSeconds)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3 font-mono-num">
                          {r.earlyDepartureSeconds > 0 ? (
                            <span className="text-amber-600 font-bold">
                              {formatSecondsDigital(r.earlyDepartureSeconds)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              r.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'late'
                                ? 'bg-amber-100 text-amber-800'
                                : r.status === 'on_leave'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.status === 'present' ? 'حاضر' : r.status === 'late' ? 'متأخر' : r.status === 'on_leave' ? 'إجازة' : 'غائب'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals at End of Report as requested in Section 12 */}
            <div className="bg-gradient-to-r from-emerald-50 to-amber-50 p-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
                <span className="text-xs text-slate-500 font-bold block mb-1">
                  إجمالي وقت التأخير المحسوب:
                </span>
                <span className="text-base sm:text-lg font-black font-mono-num text-red-700">
                  {formatSecondsToArabic(reportTotalLateSeconds)}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-amber-200">
                <span className="text-xs text-slate-500 font-bold block mb-1">
                  إجمالي المغادرة المبكرة:
                </span>
                <span className="text-base sm:text-lg font-black font-mono-num text-amber-700">
                  {formatSecondsToArabic(reportTotalEarlySeconds)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: 🏖️ تقرير الإجازات (Section 13) */}
      {activeTab === 'leave_report' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                تقرير إجازات الموظفين المنفصل
              </h3>
              <p className="text-xs text-slate-500">
                يشمل نوع الإجازة، والتواريخ، والسبب، والموازنة قبل وبعد الإجازة
              </p>
            </div>
            <button
              onClick={() => setPrintModal({ isOpen: true, type: 'leaves' })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير تقرير الإجازات</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">اسم الموظف</th>
                    <th className="p-3.5">نوع الإجازة</th>
                    <th className="p-3.5">تاريخ البدء</th>
                    <th className="p-3.5">تاريخ الانتهاء</th>
                    <th className="p-3.5 text-center">الأيام</th>
                    <th className="p-3.5">سبب الإجازة</th>
                    <th className="p-3.5 text-center">حالة الطلب</th>
                    <th className="p-3.5 text-center">الموازنة قبل</th>
                    <th className="p-3.5 text-center">الرصيد بعد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredLeaveReport.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Palmtree className="w-8 h-8 text-slate-300" />
                          <p className="font-bold text-slate-700">لا توجد طلبات إجازة مطابقة للتقرير</p>
                          <p className="text-xs text-slate-400">
                            ستظهر تفاصيل الإجازات وموازنات الرصيد هنا عند تقديم طلبات إجازة
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLeaveReport.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5 font-bold text-slate-900">{l.employeeName}</td>
                        <td className="p-3.5 font-semibold text-emerald-800">{l.leaveType}</td>
                        <td className="p-3.5 font-mono-num">{l.startDate}</td>
                        <td className="p-3.5 font-mono-num">{l.endDate}</td>
                        <td className="p-3.5 text-center font-bold">{l.daysCount} يوم</td>
                        <td className="p-3.5 text-slate-600 max-w-xs">{l.reason}</td>
                        <td className="p-3.5 text-center">
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
                              ? 'موافقة'
                              : l.status === 'rejected'
                              ? 'مرفوض'
                              : 'قيد المراجعة'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono-num">{l.balanceBefore ?? '—'}</td>
                        <td className="p-3.5 text-center font-mono-num font-bold text-emerald-700">
                          {l.balanceAfter ?? '—'}
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

      {/* Tab: ⚙️ إعدادات النظام (System Settings - Section 15) */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* 🏢 إعدادات المؤسسة */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="text-emerald-600 font-bold">🏢</span>
              <span>إعدادات المؤسسة والهوية البصرية</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المنظمة / المؤسسة
                </label>
                <input
                  type="text"
                  required
                  value={tempSettings.orgName}
                  onChange={(e) => setTempSettings({ ...tempSettings, orgName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Logo Upload as specified in Section 15 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تحميل شعار المنظمة (يُستخدم تلقائياً في التقارير واللوحات والطباعة)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl border border-emerald-300 bg-white p-1 shadow-2xs shrink-0 flex items-center justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <input
                    type="file"
                    id="admin-logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="admin-logo-upload"
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>رفع شعار جديد</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                معلومات ورسالة المنظمة
              </label>
              <textarea
                rows={2}
                value={tempSettings.orgInfo}
                onChange={(e) => setTempSettings({ ...tempSettings, orgInfo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ⏰ إعدادات ساعات العمل */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="text-amber-600 font-bold">⏰</span>
              <span>إعدادات ساعات الدوام الرسمي وفترة السماح</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وقت بدء العمل الرسمي
                </label>
                <input
                  type="time"
                  step="1"
                  required
                  value={tempSettings.workStartTime}
                  onChange={(e) => setTempSettings({ ...tempSettings, workStartTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وقت انتهاء العمل الرسمي
                </label>
                <input
                  type="time"
                  step="1"
                  required
                  value={tempSettings.workEndTime}
                  onChange={(e) => setTempSettings({ ...tempSettings, workEndTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  فترة سماح للوصول المتأخر (بالدقائق)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={tempSettings.lateGracePeriodMinutes}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      lateGracePeriodMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={tempSettings.allowEarlyCheckIn}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, allowEarlyCheckIn: e.target.checked })
                  }
                  className="rounded-md text-emerald-600 accent-emerald-600"
                />
                <span>السماح بتسجيل الوصول المبكر قبل موعد الدوام الرسمي</span>
              </label>
            </div>
          </div>

          {/* 📍 إعدادات الموقع ونصف قطر الـ GPS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <span className="text-emerald-600 font-bold">📍</span>
                <span>إعدادات موقع المؤسسة ونظام تحديد المواقع (GPS)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>فتح الخريطة التفاعلية لتحديد الموقع</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  خط العرض (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={tempSettings.orgLocation.lat}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      orgLocation: {
                        ...tempSettings.orgLocation,
                        lat: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  خط الطول (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={tempSettings.orgLocation.lng}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      orgLocation: {
                        ...tempSettings.orgLocation,
                        lng: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نصف القطر المسموح للتسجيل (بالأمتار)
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={tempSettings.gpsRadiusMeters}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      gpsRadiusMeters: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                العنوان الميداني للمقر
              </label>
              <input
                type="text"
                value={tempSettings.orgLocation.address}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    orgLocation: {
                      ...tempSettings.orgLocation,
                      address: e.target.value,
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 👨💼 إعدادات المسؤول */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="text-amber-600 font-bold">👨💼</span>
              <span>إعدادات حساب المسؤول (الأولي: fjr / 316501)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تغيير اسم مستخدم المسؤول
                </label>
                <input
                  type="text"
                  required
                  value={tempSettings.adminUsername}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, adminUsername: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تغيير كلمة مرور المسؤول
                </label>
                <input
                  type="text"
                  required
                  value={tempSettings.adminPassword}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, adminPassword: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 🧹 منطقة تصفير وتفريغ البيانات المخزنة */}
          <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-xs space-y-4">
            <h4 className="font-bold text-base text-red-700 border-b border-red-100 pb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>إدارة وتصفير بيانات النظام</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              يمكنك في أي وقت تصفير كافة بيانات الموظفين المسجلين، وسجلات الحضور والانصراف، وطلبات الإجازات، وطلبات الأعذار، وسجل التدقيق، لتبدأ قاعدة البيانات نظيفة ومصَفّرة تماماً لتسجيل موظفي المنظمة الفعليين.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'تأكيد تصفير البيانات: هل أنت متأكد من رغبتك في حذف جميع سجلات الموظفين والحركات وتصفير النظام بالكامل؟ لا يمكن التراجع عن هذا الإجراء.'
                    )
                  ) {
                    if (onResetAllData) {
                      onResetAllData();
                    } else {
                      Storage.zeroOutAllData();
                      window.location.reload();
                    }
                    alert('تم تصفير كافة البيانات المخزنة بنجاح.');
                  }
                }}
                className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>تصفير وتفريغ كافة البيانات المخزنة الآن</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>حفظ جميع إعدادات النظام وتطبيقها فوراً</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: 📜 سجل النشاط والتدقيق (Activity Log - Section 17) */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <span>سجل النشاط وتدقيق العمليات (Audit Trail)</span>
              </h3>
              <p className="text-xs text-slate-500">
                يتم تسجيل كل تعديل أو حذف في النظام آلياً لضمان النزاهة والشفافية
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono-num">
              إجمالي السجلات: {activityLogs.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <History className="w-8 h-8 text-slate-300" />
                  <p className="font-bold text-slate-700">سجل التدقيق فارغ حالياً</p>
                  <p className="text-xs text-slate-400">
                    يتم تسجيل كل إجراء إداري وحركة تعديل تلقائياً في هذا السجل فور حدوثها
                  </p>
                </div>
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4">
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                        المسؤول: {log.adminUsername}
                      </span>
                      <strong className="text-sm font-bold text-emerald-950">{log.action}</strong>
                    </div>
                    <p className="text-xs text-slate-600">{log.details}</p>
                  </div>
                  <div className="text-left shrink-0 font-mono-num text-[11px] text-slate-400">
                    <div className="font-semibold text-slate-600">{log.date}</div>
                    <div>{log.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <MapLocationPicker
          initialLat={tempSettings.orgLocation.lat}
          initialLng={tempSettings.orgLocation.lng}
          initialRadius={tempSettings.gpsRadiusMeters}
          initialAddress={tempSettings.orgLocation.address}
          onSave={(loc) => {
            const updated = {
              ...tempSettings,
              orgLocation: {
                lat: loc.lat,
                lng: loc.lng,
                address: loc.address,
              },
              gpsRadiusMeters: loc.radius,
            };
            setTempSettings(updated);
            onUpdateSettings(updated);
            onLogActivity(
              'تحديث موقع المؤسسة الجغرافي',
              `تم تعيين إحداثيات المقر الجديد ونصف القطر إلى ${loc.radius} متر`
            );
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* Print Report Modal */}
      {printModal.isOpen && (
        <PrintReportModal
          type={printModal.type}
          settings={settings}
          records={filteredReportRecords}
          leaves={filteredLeaveReport}
          employeeName={
            reportFilter.employeeId === 'all'
              ? 'جميع الموظفين'
              : employees.find((e) => e.id === reportFilter.employeeId)?.name
          }
          startDate={reportFilter.startDate}
          endDate={reportFilter.endDate}
          onClose={() => setPrintModal({ ...printModal, isOpen: false })}
        />
      )}

      {/* Employee Add / Edit Modal */}
      {employeeModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg">
                {employeeModal.mode === 'add' ? 'إضافة موظف جديد للمؤسسة' : 'تعديل بيانات الموظف'}
              </h3>
              <button
                onClick={() => setEmployeeModal({ isOpen: false, mode: 'add', data: {} })}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف</label>
                  <input
                    type="text"
                    required
                    value={employeeModal.data.name || ''}
                    onChange={(e) =>
                      setEmployeeModal({
                        ...employeeModal,
                        data: { ...employeeModal.data, name: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الوظيفة</label>
                  <input
                    type="text"
                    required
                    value={employeeModal.data.jobTitle || ''}
                    onChange={(e) =>
                      setEmployeeModal({
                        ...employeeModal,
                        data: { ...employeeModal.data, jobTitle: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم التليفون</label>
                  <input
                    type="tel"
                    required
                    value={employeeModal.data.phone || ''}
                    onChange={(e) =>
                      setEmployeeModal({
                        ...employeeModal,
                        data: { ...employeeModal.data, phone: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ بدء العمل</label>
                  <input
                    type="date"
                    required
                    value={employeeModal.data.startDate || formatDateIso(new Date())}
                    onChange={(e) =>
                      setEmployeeModal({
                        ...employeeModal,
                        data: { ...employeeModal.data, startDate: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم للدخول</label>
                  <input
                    type="text"
                    required
                    value={employeeModal.data.username || ''}
                    onChange={(e) =>
                      setEmployeeModal({
                        ...employeeModal,
                        data: { ...employeeModal.data, username: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
                  <input
                    type="text"
                    required
                    value={employeeModal.data.password || ''}
                    onChange={(e) =>
                      setEmployeeModal({
                        ...employeeModal,
                        data: { ...employeeModal.data, password: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رصيد الإجازة السنوية</label>
                  <input
                    type="number"
                    min="0"
                    value={employeeModal.data.annualLeaveBalance ?? 30}
                    onChange={(e) =>
                      setEmployeeModal({
                        ...employeeModal,
                        data: {
                          ...employeeModal.data,
                          annualLeaveBalance: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الإجازات المستخدمة</label>
                  <input
                    type="number"
                    min="0"
                    value={employeeModal.data.usedLeaveBalance ?? 0}
                    onChange={(e) =>
                      setEmployeeModal({
                        ...employeeModal,
                        data: {
                          ...employeeModal.data,
                          usedLeaveBalance: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة الحساب</label>
                  <select
                    value={employeeModal.data.status || 'active'}
                    onChange={(e) =>
                      setEmployeeModal({
                        ...employeeModal,
                        data: {
                          ...employeeModal.data,
                          status: e.target.value as 'active' | 'inactive',
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط (معطل)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEmployeeModal({ isOpen: false, mode: 'add', data: {} })}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Record Edit Modal */}
      {attendanceEditModal.isOpen && attendanceEditModal.record && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">
                تعديل سجل الحضور والانصراف
              </h3>
              <button
                onClick={() => setAttendanceEditModal({ isOpen: false, record: null })}
                className="p-1 text-white hover:bg-white/20 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendanceEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف</label>
                <input
                  type="text"
                  disabled
                  value={attendanceEditModal.record.employeeName || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ</label>
                <input
                  type="date"
                  required
                  value={attendanceEditModal.record.date || ''}
                  onChange={(e) =>
                    setAttendanceEditModal({
                      ...attendanceEditModal,
                      record: { ...attendanceEditModal.record, date: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الحضور</label>
                  <input
                    type="time"
                    step="1"
                    value={attendanceEditModal.record.checkInTime || ''}
                    onChange={(e) => {
                      const newTime = e.target.value;
                      const late = calculateLateSeconds(newTime, settings.workStartTime, settings.lateGracePeriodMinutes);
                      setAttendanceEditModal({
                        ...attendanceEditModal,
                        record: {
                          ...attendanceEditModal.record,
                          checkInTime: newTime,
                          lateSeconds: late,
                          status: late > 0 ? 'late' : 'present',
                        },
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الانصراف</label>
                  <input
                    type="time"
                    step="1"
                    value={attendanceEditModal.record.checkOutTime || ''}
                    onChange={(e) =>
                      setAttendanceEditModal({
                        ...attendanceEditModal,
                        record: {
                          ...attendanceEditModal.record,
                          checkOutTime: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحالة</label>
                <select
                  value={attendanceEditModal.record.status || 'present'}
                  onChange={(e) =>
                    setAttendanceEditModal({
                      ...attendanceEditModal,
                      record: {
                        ...attendanceEditModal.record,
                        status: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                >
                  <option value="present">حاضر</option>
                  <option value="late">متأخر</option>
                  <option value="absent">غائب</option>
                  <option value="on_leave">في إجازة</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAttendanceEditModal({ isOpen: false, record: null })}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  تأكيد التعديل وتدوين السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Profile & History Modal */}
      {viewEmployeeModal.isOpen && viewEmployeeModal.employee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base sm:text-lg">
                  ملف الموظف: {viewEmployeeModal.employee.name}
                </h3>
                <span className="text-xs text-emerald-100">
                  {viewEmployeeModal.employee.jobTitle} • {viewEmployeeModal.employee.phone}
                </span>
              </div>
              <button
                onClick={() => setViewEmployeeModal({ isOpen: false, employee: null, tab: 'profile' })}
                className="p-1 text-white hover:bg-white/20 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2">
              {[
                { id: 'profile', label: 'المعلومات الشخصية' },
                { id: 'attendance', label: 'سجل الحضور' },
                { id: 'leaves', label: 'سجل الإجازات' },
                { id: 'excuses', label: 'طلبات الأعذار' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() =>
                    setViewEmployeeModal({
                      ...viewEmployeeModal,
                      tab: t.id as any,
                    })
                  }
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    viewEmployeeModal.tab === t.id
                      ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {viewEmployeeModal.tab === 'profile' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block mb-1">اسم الموظف</span>
                      <strong className="text-slate-800">{viewEmployeeModal.employee.name}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block mb-1">نوع الوظيفة</span>
                      <strong className="text-slate-800">{viewEmployeeModal.employee.jobTitle}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block mb-1">رقم الهاتف</span>
                      <strong className="text-slate-800 font-mono-num">{viewEmployeeModal.employee.phone}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block mb-1">تاريخ البدء</span>
                      <strong className="text-slate-800 font-mono-num">{viewEmployeeModal.employee.startDate}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block mb-1">اسم المستخدم</span>
                      <strong className="text-emerald-800 font-mono-num">{viewEmployeeModal.employee.username}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block mb-1">حالة الحساب</span>
                      <strong className={viewEmployeeModal.employee.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}>
                        {viewEmployeeModal.employee.status === 'active' ? 'نشط' : 'معطل'}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="text-xs text-slate-500 block">الرصيد السنوي</span>
                      <span className="text-xl font-bold font-mono-num text-slate-800">
                        {viewEmployeeModal.employee.annualLeaveBalance}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-amber-700 block">المستخدم</span>
                      <span className="text-xl font-bold font-mono-num text-amber-700">
                        {viewEmployeeModal.employee.usedLeaveBalance}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-emerald-700 block">المتبقي</span>
                      <span className="text-xl font-bold font-mono-num text-emerald-700">
                        {viewEmployeeModal.employee.remainingLeaveBalance}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {viewEmployeeModal.tab === 'attendance' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2.5">التاريخ</th>
                        <th className="p-2.5">حضور</th>
                        <th className="p-2.5">انصراف</th>
                        <th className="p-2.5">تأخير</th>
                        <th className="p-2.5">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceRecords
                        .filter((r) => r.employeeId === viewEmployeeModal.employee?.id)
                        .map((r) => (
                          <tr key={r.id}>
                            <td className="p-2.5 font-mono-num">{r.date}</td>
                            <td className="p-2.5 font-mono-num text-emerald-700">{r.checkInTime || '—'}</td>
                            <td className="p-2.5 font-mono-num text-amber-700">{r.checkOutTime || '—'}</td>
                            <td className="p-2.5 font-mono-num">{formatSecondsDigital(r.lateSeconds)}</td>
                            <td className="p-2.5">{r.status}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewEmployeeModal.tab === 'leaves' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2.5">نوع الإجازة</th>
                        <th className="p-2.5">الفترة</th>
                        <th className="p-2.5">الأيام</th>
                        <th className="p-2.5">السبب</th>
                        <th className="p-2.5">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaveRequests
                        .filter((l) => l.employeeId === viewEmployeeModal.employee?.id)
                        .map((l) => (
                          <tr key={l.id}>
                            <td className="p-2.5 font-bold">{l.leaveType}</td>
                            <td className="p-2.5 font-mono-num">{l.startDate} إلى {l.endDate}</td>
                            <td className="p-2.5 font-bold">{l.daysCount}</td>
                            <td className="p-2.5">{l.reason}</td>
                            <td className="p-2.5">{l.status}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewEmployeeModal.tab === 'excuses' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2.5">النوع</th>
                        <th className="p-2.5">التاريخ</th>
                        <th className="p-2.5">الوقت</th>
                        <th className="p-2.5">السبب</th>
                        <th className="p-2.5">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excuseRequests
                        .filter((e) => e.employeeId === viewEmployeeModal.employee?.id)
                        .map((e) => (
                          <tr key={e.id}>
                            <td className="p-2.5 font-bold">{e.type === 'late' ? 'تأخر' : 'انصراف مبكر'}</td>
                            <td className="p-2.5 font-mono-num">{e.date}</td>
                            <td className="p-2.5 font-mono-num">{e.targetTime}</td>
                            <td className="p-2.5">{e.reason}</td>
                            <td className="p-2.5">{e.status}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
