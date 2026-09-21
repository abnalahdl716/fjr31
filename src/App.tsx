import React, { useState, useEffect, useRef } from 'react';
import {
  UserSession,
  SystemSettings,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  ExcuseRequest,
  LeaveRuleConfig,
  ActivityLogEntry,
} from './types';
import { Storage } from './utils/storage';
import { CloudStorage } from './services/cloudStorage';
import { getCurrentTime12h, formatDateNumeric } from './utils/time';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginView } from './components/LoginView';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  // Global Application State (defaults from local/cache for instantaneous render)
  const [settings, setSettings] = useState<SystemSettings>(() => Storage.getSettings());
  const [employees, setEmployees] = useState<Employee[]>(() => Storage.getEmployees());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    Storage.getAttendance()
  );
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() =>
    Storage.getLeaveRequests()
  );
  const [excuseRequests, setExcuseRequests] = useState<ExcuseRequest[]>(() =>
    Storage.getExcuseRequests()
  );
  const [leaveRules, setLeaveRules] = useState<LeaveRuleConfig[]>(() =>
    Storage.getLeaveRules()
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() =>
    Storage.getActivityLogs()
  );
  const [session, setSession] = useState<UserSession | null>(() => Storage.getSession());
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Flags to prevent echo loops when remote updates arrive
  const isRemoteUpdate = useRef<{ [key: string]: boolean }>({});

  // ----------------------------------------------------
  // 1. Subscribe to Cloud Firestore Realtime Updates
  // ----------------------------------------------------
  useEffect(() => {
    // Settings subscription
    const unsubSettings = CloudStorage.subscribeSettings((remoteSettings) => {
      if (remoteSettings && remoteSettings.orgName) {
        isRemoteUpdate.current['settings'] = true;
        setSettings(remoteSettings);
        Storage.saveSettings(remoteSettings);
      }
    });

    // Employees subscription
    const unsubEmployees = CloudStorage.subscribeEmployees((remoteEmployees) => {
      isRemoteUpdate.current['employees'] = true;
      setEmployees(remoteEmployees);
      Storage.saveEmployees(remoteEmployees);
    });

    // Attendance subscription
    const unsubAttendance = CloudStorage.subscribeAttendance((remoteAttendance) => {
      isRemoteUpdate.current['attendance'] = true;
      setAttendanceRecords(remoteAttendance);
      Storage.saveAttendance(remoteAttendance);
    });

    // Leaves subscription
    const unsubLeaves = CloudStorage.subscribeLeaves((remoteLeaves) => {
      isRemoteUpdate.current['leaves'] = true;
      setLeaveRequests(remoteLeaves);
      Storage.saveLeaveRequests(remoteLeaves);
    });

    // Excuses subscription
    const unsubExcuses = CloudStorage.subscribeExcuses((remoteExcuses) => {
      isRemoteUpdate.current['excuses'] = true;
      setExcuseRequests(remoteExcuses);
      Storage.saveExcuseRequests(remoteExcuses);
    });

    // Rules subscription
    const unsubRules = CloudStorage.subscribeRules((remoteRules) => {
      if (remoteRules && remoteRules.length > 0) {
        isRemoteUpdate.current['rules'] = true;
        setLeaveRules(remoteRules);
        Storage.saveLeaveRules(remoteRules);
      }
    });

    // Logs subscription
    const unsubLogs = CloudStorage.subscribeLogs((remoteLogs) => {
      isRemoteUpdate.current['logs'] = true;
      setActivityLogs(remoteLogs);
      Storage.saveActivityLogs(remoteLogs);
    });

    return () => {
      unsubSettings();
      unsubEmployees();
      unsubAttendance();
      unsubLeaves();
      unsubExcuses();
      unsubRules();
      unsubLogs();
    };
  }, []);

  // ----------------------------------------------------
  // 2. Sync Local Modifications to Cloud Firestore & LocalStorage
  // ----------------------------------------------------
  useEffect(() => {
    Storage.saveSettings(settings);
    if (!isRemoteUpdate.current['settings']) {
      CloudStorage.saveSettings(settings);
    }
    isRemoteUpdate.current['settings'] = false;
  }, [settings]);

  useEffect(() => {
    Storage.saveEmployees(employees);
    if (!isRemoteUpdate.current['employees']) {
      CloudStorage.saveEmployeesBulk(employees);
    }
    isRemoteUpdate.current['employees'] = false;
  }, [employees]);

  useEffect(() => {
    Storage.saveAttendance(attendanceRecords);
    if (!isRemoteUpdate.current['attendance']) {
      CloudStorage.saveAttendanceBulk(attendanceRecords);
    }
    isRemoteUpdate.current['attendance'] = false;
  }, [attendanceRecords]);

  useEffect(() => {
    Storage.saveLeaveRequests(leaveRequests);
    if (!isRemoteUpdate.current['leaves']) {
      CloudStorage.saveLeavesBulk(leaveRequests);
    }
    isRemoteUpdate.current['leaves'] = false;
  }, [leaveRequests]);

  useEffect(() => {
    Storage.saveExcuseRequests(excuseRequests);
    if (!isRemoteUpdate.current['excuses']) {
      CloudStorage.saveExcusesBulk(excuseRequests);
    }
    isRemoteUpdate.current['excuses'] = false;
  }, [excuseRequests]);

  useEffect(() => {
    Storage.saveLeaveRules(leaveRules);
    if (!isRemoteUpdate.current['rules']) {
      CloudStorage.saveLeaveRulesBulk(leaveRules);
    }
    isRemoteUpdate.current['rules'] = false;
  }, [leaveRules]);

  useEffect(() => {
    Storage.saveActivityLogs(activityLogs);
    isRemoteUpdate.current['logs'] = false;
  }, [activityLogs]);

  useEffect(() => {
    Storage.saveSession(session);
  }, [session]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsCloudConnected(true);
    const handleOffline = () => setIsCloudConnected(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Activity logger helper
  const handleLogActivity = (action: string, details: string) => {
    const newLog: ActivityLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: formatDateNumeric(new Date()),
      time: getCurrentTime12h(new Date()),
      timestamp: Date.now(),
      adminUsername: session?.username || 'fjr',
      action,
      details,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    CloudStorage.saveLog(newLog).catch(console.error);
  };

  // Auth Handlers
  const handleLogin = (userSession: UserSession, rememberMe: boolean) => {
    setSession(userSession);
    handleLogActivity(
      'تسجيل الدخول للنظام',
      `قام ${userSession.role === 'admin' ? 'المسؤول' : 'الموظف'} (${userSession.name}) بتسجيل الدخول`
    );
  };

  const handleLogout = () => {
    if (session) {
      handleLogActivity(
        'تسجيل الخروج',
        `قام (${session.name}) بتسجيل الخروج من النظام`
      );
    }
    setSession(null);
  };

  // Switch account easily
  const handleSwitchAccount = () => {
    handleLogout();
  };

  // Check-In / Check-Out from Employee
  const handleRecordAttendance = (newRecord: AttendanceRecord) => {
    setAttendanceRecords((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.employeeId === newRecord.employeeId && r.date === newRecord.date
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newRecord;
        return copy;
      }
      return [newRecord, ...prev];
    });

    // Save record to cloud directly
    CloudStorage.saveAttendanceRecord(newRecord);

    handleLogActivity(
      newRecord.checkOutTime ? 'تسجيل انصراف موظف' : 'تسجيل حضور موظف',
      `قام الموظف ${newRecord.employeeName} بتسجيل ${newRecord.checkOutTime ? 'الانصراف' : 'الحضور'}`
    );
  };

  // Submit Leave from Employee
  const handleSubmitLeave = (leaveData: Omit<LeaveRequest, 'id' | 'submittedAt' | 'status'>) => {
    const newLeave: LeaveRequest = {
      ...leaveData,
      id: `leave-${Date.now()}`,
      submittedAt: `${formatDateNumeric(new Date())} ${getCurrentTime12h(new Date())}`,
      status: 'pending',
    };
    setLeaveRequests((prev) => [newLeave, ...prev]);
    CloudStorage.saveLeaveRequest(newLeave);

    handleLogActivity(
      'تقديم طلب إجازة',
      `قدم الموظف ${newLeave.employeeName} طلب إجازة (${newLeave.leaveType}) لعدد ${newLeave.daysCount} أيام`
    );
  };

  // Submit Excuse from Employee
  const handleSubmitExcuse = (excuseData: Omit<ExcuseRequest, 'id' | 'submittedAt' | 'status'>) => {
    const newExcuse: ExcuseRequest = {
      ...excuseData,
      id: `excuse-${Date.now()}`,
      submittedAt: `${formatDateNumeric(new Date())} ${getCurrentTime12h(new Date())}`,
      status: 'pending',
    };
    setExcuseRequests((prev) => [newExcuse, ...prev]);
    CloudStorage.saveExcuseRequest(newExcuse);

    handleLogActivity(
      'تقديم طلب عذر',
      `قدم الموظف ${newExcuse.employeeName} عذر (${newExcuse.type === 'late' ? 'تأخر في الحضور' : 'انصراف مبكر'})`
    );
  };

  // Reset all transactional data
  const handleResetAllData = () => {
    Storage.zeroOutAllData();
    setEmployees([]);
    setAttendanceRecords([]);
    setLeaveRequests([]);
    setExcuseRequests([]);
    setActivityLogs([]);
  };

  // Current logged in employee object
  const currentEmployee =
    session?.role === 'employee'
      ? employees.find((e) => e.id === session.employeeId) || null
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 font-cairo text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        settings={settings}
        session={session}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {!session ? (
          <LoginView
            settings={settings}
            employees={employees}
            onLogin={handleLogin}
          />
        ) : session.role === 'admin' ? (
          <AdminDashboard
            settings={settings}
            employees={employees}
            attendanceRecords={attendanceRecords}
            leaveRequests={leaveRequests}
            excuseRequests={excuseRequests}
            leaveRules={leaveRules}
            activityLogs={activityLogs}
            onUpdateSettings={setSettings}
            onUpdateEmployees={setEmployees}
            onUpdateAttendance={setAttendanceRecords}
            onUpdateLeaves={setLeaveRequests}
            onUpdateExcuses={setExcuseRequests}
            onUpdateRules={setLeaveRules}
            onLogActivity={handleLogActivity}
            onResetAllData={handleResetAllData}
          />
        ) : currentEmployee ? (
          <EmployeeDashboard
            employee={currentEmployee}
            settings={settings}
            attendanceRecords={attendanceRecords}
            leaveRequests={leaveRequests}
            excuseRequests={excuseRequests}
            leaveRules={leaveRules}
            onCheckIn={handleRecordAttendance}
            onCheckOut={handleRecordAttendance}
            onSubmitLeave={handleSubmitLeave}
            onSubmitExcuse={handleSubmitExcuse}
          />
        ) : (
          <div className="p-8 text-center text-red-600">
            خطأ في تحميل بيانات الموظف. يرجى إعادة تسجيل الدخول.
          </div>
        )}
      </main>

      {/* Footer with Attribution to Abd Al-Majeed Ayyash Bardini */}
      <Footer settings={settings} />
    </div>
  );
}
