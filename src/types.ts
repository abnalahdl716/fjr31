export type UserRole = 'admin' | 'employee';

export interface UserSession {
  id: string;
  username: string;
  role: UserRole;
  employeeId?: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string; // اسم الموظف
  jobTitle: string; // نوع الوظيفة
  phone: string; // رقم التليفون
  username: string; // اسم المستخدم
  password: string; // كلمة المرور
  startDate: string; // تاريخ بدء العمل YYYY-MM-DD
  annualLeaveBalance: number; // رصيد الإجازة السنوية
  usedLeaveBalance: number; // رصيد الإجازات المستخدمة
  remainingLeaveBalance: number; // رصيد الإجازة المتبقي
  status: 'active' | 'inactive'; // حالة الموظف: نشط / غير نشط
  email?: string;
  notes?: string;
}

export interface GeoCoordinate {
  lat: number;
  lng: number;
  accuracyMeters?: number;
  distanceMeters?: number;
  insideRadius?: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:mm:ss (e.g. 08:17:35)
  checkInLocation?: GeoCoordinate;
  checkOutTime?: string; // HH:mm:ss (e.g. 14:05:31)
  checkOutLocation?: GeoCoordinate;
  lateSeconds: number; // calculated late duration in seconds
  earlyDepartureSeconds: number; // calculated early departure in seconds
  lateExcused: boolean; // if late excuse is approved
  earlyExcused: boolean; // if early departure excuse is approved
  status: 'present' | 'late' | 'absent' | 'on_leave';
  notes?: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string; // إجازة سنوية، إجازة مرضية، إجازة طارئة
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  attachmentName?: string;
  attachmentUrl?: string;
  status: RequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  adminNotes?: string;
}

export interface ExcuseRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'late' | 'early_departure'; // عذر تأخر أو عذر انصراف مبكر
  date: string;
  targetTime: string; // وقت التأخر أو وقت الانصراف
  durationSeconds: number;
  reason: string;
  explanation: string;
  attachmentName?: string;
  attachmentUrl?: string;
  status: RequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  adminNotes?: string;
}

export interface LeaveRuleConfig {
  id: string;
  leaveType: string;
  defaultAnnualBalance: number;
  deductFromBalanceOnApprove: boolean; // هل تخصم عند الموافقة
  deductFromBalanceOnReject: boolean; // هل تخصم عند الرفض (كما في متطلبات النظام)
  requireApproval: boolean;
  requireAttachment: boolean;
  calculationMethod: 'calendar_days' | 'work_days';
}

export interface SystemSettings {
  orgName: string;
  orgInfo: string;
  logoUrl: string;
  workStartTime: string; // "08:00:00"
  workEndTime: string; // "14:00:00"
  allowEarlyCheckIn: boolean;
  earlyCheckInMinutes: number;
  lateGracePeriodMinutes: number; // e.g. 10 minutes
  orgLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  gpsRadiusMeters: number; // e.g. 100 meters
  adminUsername: string;
  adminPassword: string;
  developerName: string;
  developerPhone: string;
}

export interface ActivityLogEntry {
  id: string;
  adminUsername: string;
  action: string;
  details: string;
  date: string; // 20/09/2026
  time: string; // 09:15:32 صباحاً
  timestamp: number;
}
