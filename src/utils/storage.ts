import { Employee, AttendanceRecord, LeaveRequest, DocumentItem, InstitutionSettings } from '../types';
import { getTodayDateString } from './time';

const STORAGE_KEYS = {
  EMPLOYEES: 'alfajr_employees_v1',
  ATTENDANCE: 'alfajr_attendance_v1',
  LEAVES: 'alfajr_leaves_v1',
  DOCUMENTS: 'alfajr_documents_v1',
  SETTINGS: 'alfajr_settings_v1',
  CURRENT_USER: 'alfajr_current_user_v1',
};

export const DEFAULT_SETTINGS: InstitutionSettings = {
  name: 'مؤسسة الفجر الخيرية الاجتماعية',
  tagline: 'نظام إدارة شؤون الموظفين والدوام والإجازات الذكي',
  workStartTime: '08:00',
  workEndTime: '16:00',
  lateGraceMinutes: 15,
  officeLocation: {
    lat: 15.3694,
    lng: 44.1910,
    address: 'المقر الرئيسي لمؤسسة الفجر الخيرية',
    radiusMeters: 150,
  },
  allowRemoteAnyNetwork: true,
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-admin',
    name: 'المدير العام (إدارة النظام)',
    code: '1000',
    phone: '777000000',
    department: 'الإدارة العامة والتطوير',
    role: 'admin',
    annualLeaveBalance: 30,
    usedLeaveBalance: 2,
    joinDate: '2023-01-01',
  },
  {
    id: 'emp-101',
    name: 'عبدالمجيد محمد',
    code: '1001',
    phone: '736550000',
    department: 'المشاريع والمساعدات الخيرية',
    role: 'employee',
    annualLeaveBalance: 30,
    usedLeaveBalance: 3,
    joinDate: '2024-03-15',
  },
  {
    id: 'emp-102',
    name: 'سالم عبدالله أحمد',
    code: '1002',
    phone: '771234567',
    department: 'الشؤون المالية والمحاسبة',
    role: 'employee',
    annualLeaveBalance: 30,
    usedLeaveBalance: 5,
    joinDate: '2023-08-10',
  },
  {
    id: 'emp-103',
    name: 'فاطمة عمر العمودي',
    code: '1003',
    phone: '772345678',
    department: 'كفالة الأيتام والرعاية الاجتماعية',
    role: 'employee',
    annualLeaveBalance: 30,
    usedLeaveBalance: 1,
    joinDate: '2024-01-20',
  },
  {
    id: 'emp-104',
    name: 'عمر ياسين باحارثة',
    code: '1004',
    phone: '773456789',
    department: 'العلاقات العامة والإعلام',
    role: 'employee',
    annualLeaveBalance: 30,
    usedLeaveBalance: 4,
    joinDate: '2023-11-05',
  },
];

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'leave-1',
    employeeId: 'emp-101',
    employeeName: 'عبدالمجيد محمد',
    department: 'المشاريع والمساعدات الخيرية',
    type: 'سنوية',
    startDate: '2026-09-25',
    endDate: '2026-09-28',
    daysCount: 3,
    reason: 'ظروف عائلية خاصة بالسفر',
    status: 'pending',
    requestDate: '2026-09-21',
  },
  {
    id: 'leave-2',
    employeeId: 'emp-103',
    employeeName: 'فاطمة عمر العمودي',
    department: 'كفالة الأيتام والرعاية الاجتماعية',
    type: 'مرضية',
    startDate: '2026-09-10',
    endDate: '2026-09-11',
    daysCount: 1,
    reason: 'وعكة صحية طارئة ومراجعة العيادة',
    status: 'approved',
    requestDate: '2026-09-09',
    adminResponseNote: 'تمت الموافقة بالشفاء العاجل',
  },
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    employeeId: 'emp-101',
    title: 'عقد العمل الموحد لعام 2026',
    category: 'عقد عمل',
    issueDate: '2026-01-01',
    expiryDate: '2026-12-31',
    notes: 'عقد سنوي متجدد بمسمى منسق مشاريع',
    status: 'valid',
  },
  {
    id: 'doc-2',
    employeeId: 'emp-101',
    title: 'بطاقة الهوية الوطنية الشخصية',
    category: 'هوية شخصية',
    issueDate: '2022-05-14',
    expiryDate: '2030-05-14',
    notes: 'نسخة سارية المفعول مسجلة لدى الموارد البشرية',
    status: 'valid',
  },
  {
    id: 'doc-3',
    employeeId: 'emp-101',
    title: 'وثيقة التخرج والمؤهل الجامعي',
    category: 'مؤهل علمي',
    issueDate: '2021-07-20',
    notes: 'بكالوريوس إدارة أعمال معتمد ومصدق',
    status: 'valid',
  },
  {
    id: 'doc-4',
    employeeId: 'emp-102',
    title: 'عقد العمل المالي والمحاسبي',
    category: 'عقد عمل',
    issueDate: '2025-08-01',
    expiryDate: '2026-08-01',
    status: 'valid',
  },
];

// LocalStorage Helpers with error safety
export function getStoredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EMPLOYEES;
  }
}

export function saveEmployees(employees: Employee[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  } catch (e) {
    console.error('Failed to save employees', e);
  }
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAttendance(records: AttendanceRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save attendance', e);
  }
}

export function getStoredLeaves(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAVES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(INITIAL_LEAVES));
      return INITIAL_LEAVES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LEAVES;
  }
}

export function saveLeaves(leaves: LeaveRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  } catch (e) {
    console.error('Failed to save leaves', e);
  }
}

export function getStoredDocuments(): DocumentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
      return INITIAL_DOCUMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DOCUMENTS;
  }
}

export function saveDocuments(docs: DocumentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save documents', e);
  }
}

export function getStoredSettings(): InstitutionSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: InstitutionSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function getCurrentUser(): Employee | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: Employee | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (e) {
    console.error('Failed to set current user', e);
  }
}
