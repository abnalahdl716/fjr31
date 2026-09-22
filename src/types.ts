export interface Employee {
  id: string;
  name: string;
  code: string; // PIN or code
  phone: string;
  department: string;
  role: 'employee' | 'admin';
  avatar?: string;
  joinDate?: string;
  annualLeaveBalance: number; // e.g. 30 days
  usedLeaveBalance: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // 12-hour or 24-hour string
  checkInTimestamp?: number;
  checkOutTime?: string;
  checkOutTimestamp?: number;
  checkInLocation?: {
    lat: number;
    lng: number;
    accuracy?: number;
    distanceMeters?: number;
    withinGeofence: boolean;
    networkType?: string;
  };
  checkOutLocation?: {
    lat: number;
    lng: number;
    accuracy?: number;
    distanceMeters?: number;
    withinGeofence: boolean;
  };
  status: 'present' | 'late' | 'absent' | 'leave';
  lateMinutes?: number;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: 'سنوية' | 'مرضية' | 'طارئة' | 'ميدانية' | 'إذن ساعي';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  attachmentName?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  adminResponseNote?: string;
}

export interface DocumentItem {
  id: string;
  employeeId: string;
  title: string;
  category: 'عقد عمل' | 'هوية شخصية' | 'مؤهل علمي' | 'شهادة خبرة' | 'طلب رسمي' | 'أخرى';
  issueDate: string;
  expiryDate?: string;
  notes?: string;
  fileUrl?: string;
  fileName?: string;
  status: 'valid' | 'expiring_soon' | 'expired';
}

export interface InstitutionSettings {
  name: string;
  tagline: string;
  workStartTime: string; // "08:00"
  workEndTime: string; // "16:00"
  lateGraceMinutes: number; // e.g. 15 mins
  officeLocation: {
    lat: number;
    lng: number;
    address: string;
    radiusMeters: number; // e.g. 150m
  };
  allowRemoteAnyNetwork: boolean; // true = allows cellular/ADSL/Starlink anywhere with verification
}
