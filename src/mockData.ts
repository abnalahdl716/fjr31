import {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  ExcuseRequest,
  LeaveRuleConfig,
  SystemSettings,
  ActivityLogEntry,
} from './types';

// Official Foundation Logo (SVG as data URI)
export const DEFAULT_FOUNDATION_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
  <defs>
    <linearGradient id="primaryGrad" x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
    <linearGradient id="sunGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="48" fill="white" />
  <rect x="6" y="6" width="228" height="228" rx="42" fill="#f8fafc" stroke="#16a34a" stroke-width="4" stroke-dasharray="8 6"/>
  <!-- Sun/Dawn Rising (Fajr) -->
  <circle cx="120" cy="110" r="38" fill="url(#sunGrad)" />
  <path d="M120 54V66M70 75L78 83M170 75L162 83M50 110H62M178 110H190" stroke="#ea580c" stroke-width="4" stroke-linecap="round"/>
  <!-- Caring Hands & Green Crescent Branch -->
  <path d="M54 156C68 134 100 130 120 148C140 130 172 134 186 156C194 168 184 182 170 182H70C56 182 46 168 54 156Z" fill="url(#primaryGrad)"/>
  <!-- Olive Branch / Charity Emblem -->
  <path d="M120 130V176" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M120 142C128 138 138 140 140 146C134 148 124 146 120 142Z" fill="#bbf7d0"/>
  <path d="M120 154C112 150 102 152 100 158C106 160 116 158 120 154Z" fill="#bbf7d0"/>
  <!-- Base Foundation text emblem -->
  <text x="120" y="212" text-anchor="middle" font-family="'Cairo', sans-serif" font-weight="800" font-size="16" fill="#15803d">مؤسسة الفجر الخيرية</text>
</svg>
`)}`;

export const INITIAL_SETTINGS: SystemSettings = {
  orgName: 'مؤسسة الفجر الخيرية الاجتماعية',
  orgInfo: 'مؤسسة تنموية خيرية اجتماعية رائدة تُعنى بالتكافل والتنمية المجتمعية ورعاية المشاريع الإنسانية المستدامة.',
  logoUrl: DEFAULT_FOUNDATION_LOGO,
  workStartTime: '08:00:00',
  workEndTime: '14:00:00',
  allowEarlyCheckIn: true,
  earlyCheckInMinutes: 30,
  lateGracePeriodMinutes: 10,
  orgLocation: {
    lat: 15.369445,
    lng: 44.191006,
    address: 'المقر الرئيسي - شارع الزبيري، بجوار تقاطع حدة، صنعاء',
  },
  gpsRadiusMeters: 100, // 100 meters
  autoFollowAdminLocation: true, // تفعيل التحديد التلقائي حسب تواجد مدير النظام
  lastLocationSync: '',
  adminUsername: 'fjr',
  adminPassword: '316501',
  developerName: 'مطور الموقع / عبد المجيد عياش بارديني',
  developerPhone: '770905092',
};

// System initialized clean with 0 employees, 0 records, zeroed out for real entry
export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];

export const INITIAL_EXCUSE_REQUESTS: ExcuseRequest[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLogEntry[] = [];

export const INITIAL_LEAVE_RULES: LeaveRuleConfig[] = [
  {
    id: 'rule-1',
    leaveType: 'إجازة سنوية',
    defaultAnnualBalance: 30,
    deductFromBalanceOnApprove: true,
    deductFromBalanceOnReject: false,
    requireApproval: true,
    requireAttachment: false,
    calculationMethod: 'calendar_days',
  },
  {
    id: 'rule-2',
    leaveType: 'إجازة مرضية',
    defaultAnnualBalance: 15,
    deductFromBalanceOnApprove: false, // لا تخصم من الرصيد السنوي
    deductFromBalanceOnReject: false,
    requireApproval: true,
    requireAttachment: true,
    calculationMethod: 'calendar_days',
  },
  {
    id: 'rule-3',
    leaveType: 'إجازة اضطرارية / عارضة',
    defaultAnnualBalance: 7,
    deductFromBalanceOnApprove: true,
    deductFromBalanceOnReject: false,
    requireApproval: true,
    requireAttachment: false,
    calculationMethod: 'work_days',
  },
  {
    id: 'rule-4',
    leaveType: 'إجازة بدون مرتب',
    defaultAnnualBalance: 0,
    deductFromBalanceOnApprove: false,
    deductFromBalanceOnReject: false,
    requireApproval: true,
    requireAttachment: false,
    calculationMethod: 'calendar_days',
  },
];
