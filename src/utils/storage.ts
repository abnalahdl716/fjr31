import {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  ExcuseRequest,
  LeaveRuleConfig,
  SystemSettings,
  ActivityLogEntry,
  UserSession,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_EXCUSE_REQUESTS,
  INITIAL_LEAVE_RULES,
  INITIAL_ACTIVITY_LOGS,
} from '../mockData';
import { formatDateNumeric, getCurrentTime12h } from './time';

const KEYS = {
  SETTINGS: 'alfajr_settings_v2',
  EMPLOYEES: 'alfajr_employees_v2',
  ATTENDANCE: 'alfajr_attendance_v2',
  LEAVES: 'alfajr_leaves_v2',
  EXCUSES: 'alfajr_excuses_v2',
  RULES: 'alfajr_leave_rules_v2',
  LOGS: 'alfajr_activity_logs_v2',
  SESSION: 'alfajr_user_session_v2',
};

// Automatic cleanup of legacy demo test data
try {
  const legacyKeys = [
    'alfajr_settings_v1',
    'alfajr_employees_v1',
    'alfajr_attendance_v1',
    'alfajr_leaves_v1',
    'alfajr_excuses_v1',
    'alfajr_leave_rules_v1',
    'alfajr_activity_logs_v1',
    'alfajr_user_session_v1',
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));
} catch (e) {
  // ignore in non-browser environments
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const Storage = {
  getSettings: (): SystemSettings => safeGet(KEYS.SETTINGS, INITIAL_SETTINGS),
  saveSettings: (settings: SystemSettings) => safeSet(KEYS.SETTINGS, settings),

  getEmployees: (): Employee[] => safeGet(KEYS.EMPLOYEES, INITIAL_EMPLOYEES),
  saveEmployees: (employees: Employee[]) => safeSet(KEYS.EMPLOYEES, employees),

  getAttendance: (): AttendanceRecord[] => safeGet(KEYS.ATTENDANCE, INITIAL_ATTENDANCE_RECORDS),
  saveAttendance: (attendance: AttendanceRecord[]) => safeSet(KEYS.ATTENDANCE, attendance),

  getLeaves: (): LeaveRequest[] => safeGet(KEYS.LEAVES, INITIAL_LEAVE_REQUESTS),
  saveLeaves: (leaves: LeaveRequest[]) => safeSet(KEYS.LEAVES, leaves),
  getLeaveRequests: (): LeaveRequest[] => safeGet(KEYS.LEAVES, INITIAL_LEAVE_REQUESTS),
  saveLeaveRequests: (leaves: LeaveRequest[]) => safeSet(KEYS.LEAVES, leaves),

  getExcuses: (): ExcuseRequest[] => safeGet(KEYS.EXCUSES, INITIAL_EXCUSE_REQUESTS),
  saveExcuses: (excuses: ExcuseRequest[]) => safeSet(KEYS.EXCUSES, excuses),
  getExcuseRequests: (): ExcuseRequest[] => safeGet(KEYS.EXCUSES, INITIAL_EXCUSE_REQUESTS),
  saveExcuseRequests: (excuses: ExcuseRequest[]) => safeSet(KEYS.EXCUSES, excuses),

  getLeaveRules: (): LeaveRuleConfig[] => safeGet(KEYS.RULES, INITIAL_LEAVE_RULES),
  saveLeaveRules: (rules: LeaveRuleConfig[]) => safeSet(KEYS.RULES, rules),

  getActivityLogs: (): ActivityLogEntry[] => safeGet(KEYS.LOGS, INITIAL_ACTIVITY_LOGS),
  saveActivityLogs: (logs: ActivityLogEntry[]) => safeSet(KEYS.LOGS, logs),

  getSession: (): UserSession | null => safeGet(KEYS.SESSION, null),
  getCurrentSession: (): UserSession | null => safeGet(KEYS.SESSION, null),
  saveSession: (session: UserSession | null) => {
    if (session) {
      safeSet(KEYS.SESSION, session);
    } else {
      localStorage.removeItem(KEYS.SESSION);
    }
  },
  saveCurrentSession: (session: UserSession | null) => {
    if (session) {
      safeSet(KEYS.SESSION, session);
    } else {
      localStorage.removeItem(KEYS.SESSION);
    }
  },

  logActivity: (adminUsername: string, action: string, details: string) => {
    const currentLogs = Storage.getActivityLogs();
    const newEntry: ActivityLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      adminUsername,
      action,
      details,
      date: formatDateNumeric(new Date()),
      time: getCurrentTime12h(new Date()),
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...currentLogs];
    Storage.saveActivityLogs(updated);
    return updated;
  },

  // Reset/zero out all transactional data (employees, attendance, leaves, excuses, logs)
  zeroOutAllData: () => {
    safeSet(KEYS.EMPLOYEES, []);
    safeSet(KEYS.ATTENDANCE, []);
    safeSet(KEYS.LEAVES, []);
    safeSet(KEYS.EXCUSES, []);
    safeSet(KEYS.LOGS, []);
  },

  resetToDefaults: () => {
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.EMPLOYEES);
    localStorage.removeItem(KEYS.ATTENDANCE);
    localStorage.removeItem(KEYS.LEAVES);
    localStorage.removeItem(KEYS.EXCUSES);
    localStorage.removeItem(KEYS.RULES);
    localStorage.removeItem(KEYS.LOGS);
    localStorage.removeItem(KEYS.SESSION);
  },
};
