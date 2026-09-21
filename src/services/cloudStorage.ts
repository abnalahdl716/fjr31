import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, ensureAuth } from './firebase';
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
  INITIAL_SETTINGS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_EXCUSE_REQUESTS,
  INITIAL_LEAVE_RULES,
  INITIAL_ACTIVITY_LOGS,
} from '../mockData';

// Firestore collection names
const COLLECTIONS = {
  SETTINGS: 'system_settings',
  EMPLOYEES: 'employees',
  ATTENDANCE: 'attendance_records',
  LEAVES: 'leave_requests',
  EXCUSES: 'excuse_requests',
  RULES: 'leave_rules',
  LOGS: 'activity_logs',
};

// Document ID for single settings
const SETTINGS_DOC_ID = 'main_config';

export const CloudStorage = {
  // 1. System Settings
  subscribeSettings: (callback: (settings: SystemSettings) => void): Unsubscribe => {
    const docRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as SystemSettings);
        } else {
          // Initialize if document does not exist yet in cloud
          ensureAuth().then(() => {
            setDoc(docRef, INITIAL_SETTINGS).catch(console.error);
          });
          callback(INITIAL_SETTINGS);
        }
      },
      (error) => {
        console.warn('Firestore subscribeSettings error:', error);
      }
    );
  },

  saveSettings: async (settings: SystemSettings): Promise<void> => {
    try {
      await ensureAuth();
      const docRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOC_ID);
      await setDoc(docRef, settings, { merge: true });
    } catch (error) {
      console.error('Error saving settings to cloud:', error);
    }
  },

  // 2. Employees
  subscribeEmployees: (callback: (employees: Employee[]) => void): Unsubscribe => {
    const colRef = collection(db, COLLECTIONS.EMPLOYEES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: Employee[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Employee);
        });
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeEmployees error:', error);
      }
    );
  },

  saveEmployee: async (employee: Employee): Promise<void> => {
    try {
      await ensureAuth();
      const docRef = doc(db, COLLECTIONS.EMPLOYEES, employee.id);
      await setDoc(docRef, employee, { merge: true });
    } catch (error) {
      console.error('Error saving employee to cloud:', error);
    }
  },

  saveEmployeesBulk: async (employees: Employee[]): Promise<void> => {
    try {
      await ensureAuth();
      await Promise.all(
        employees.map((emp) =>
          setDoc(doc(db, COLLECTIONS.EMPLOYEES, emp.id), emp, { merge: true })
        )
      );
    } catch (error) {
      console.error('Error saving employees bulk to cloud:', error);
    }
  },

  // 3. Attendance Records
  subscribeAttendance: (callback: (records: AttendanceRecord[]) => void): Unsubscribe => {
    const colRef = collection(db, COLLECTIONS.ATTENDANCE);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as AttendanceRecord);
        });
        // Sort by date/checkInTime descending
        items.sort((a, b) => b.date.localeCompare(a.date));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeAttendance error:', error);
      }
    );
  },

  saveAttendanceRecord: async (record: AttendanceRecord): Promise<void> => {
    try {
      await ensureAuth();
      const docRef = doc(db, COLLECTIONS.ATTENDANCE, record.id);
      await setDoc(docRef, record, { merge: true });
    } catch (error) {
      console.error('Error saving attendance record to cloud:', error);
    }
  },

  saveAttendanceBulk: async (records: AttendanceRecord[]): Promise<void> => {
    try {
      await ensureAuth();
      await Promise.all(
        records.map((rec) =>
          setDoc(doc(db, COLLECTIONS.ATTENDANCE, rec.id), rec, { merge: true })
        )
      );
    } catch (error) {
      console.error('Error saving attendance bulk to cloud:', error);
    }
  },

  // 4. Leave Requests
  subscribeLeaves: (callback: (leaves: LeaveRequest[]) => void): Unsubscribe => {
    const colRef = collection(db, COLLECTIONS.LEAVES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: LeaveRequest[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as LeaveRequest);
        });
        items.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeLeaves error:', error);
      }
    );
  },

  saveLeaveRequest: async (leave: LeaveRequest): Promise<void> => {
    try {
      await ensureAuth();
      const docRef = doc(db, COLLECTIONS.LEAVES, leave.id);
      await setDoc(docRef, leave, { merge: true });
    } catch (error) {
      console.error('Error saving leave request to cloud:', error);
    }
  },

  saveLeavesBulk: async (leaves: LeaveRequest[]): Promise<void> => {
    try {
      await ensureAuth();
      await Promise.all(
        leaves.map((l) => setDoc(doc(db, COLLECTIONS.LEAVES, l.id), l, { merge: true }))
      );
    } catch (error) {
      console.error('Error saving leaves bulk to cloud:', error);
    }
  },

  // 5. Excuse Requests
  subscribeExcuses: (callback: (excuses: ExcuseRequest[]) => void): Unsubscribe => {
    const colRef = collection(db, COLLECTIONS.EXCUSES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: ExcuseRequest[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ExcuseRequest);
        });
        items.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeExcuses error:', error);
      }
    );
  },

  saveExcuseRequest: async (excuse: ExcuseRequest): Promise<void> => {
    try {
      await ensureAuth();
      const docRef = doc(db, COLLECTIONS.EXCUSES, excuse.id);
      await setDoc(docRef, excuse, { merge: true });
    } catch (error) {
      console.error('Error saving excuse request to cloud:', error);
    }
  },

  saveExcusesBulk: async (excuses: ExcuseRequest[]): Promise<void> => {
    try {
      await ensureAuth();
      await Promise.all(
        excuses.map((e) => setDoc(doc(db, COLLECTIONS.EXCUSES, e.id), e, { merge: true }))
      );
    } catch (error) {
      console.error('Error saving excuses bulk to cloud:', error);
    }
  },

  // 6. Leave Rules
  subscribeRules: (callback: (rules: LeaveRuleConfig[]) => void): Unsubscribe => {
    const colRef = collection(db, COLLECTIONS.RULES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: LeaveRuleConfig[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as LeaveRuleConfig);
          });
          callback(items);
        } else {
          // Initialize defaults if empty
          ensureAuth().then(() => {
            INITIAL_LEAVE_RULES.forEach((rule) => {
              setDoc(doc(db, COLLECTIONS.RULES, rule.id), rule).catch(console.error);
            });
          });
          callback(INITIAL_LEAVE_RULES);
        }
      },
      (error) => {
        console.warn('Firestore subscribeRules error:', error);
      }
    );
  },

  saveLeaveRulesBulk: async (rules: LeaveRuleConfig[]): Promise<void> => {
    try {
      await ensureAuth();
      await Promise.all(
        rules.map((r) => setDoc(doc(db, COLLECTIONS.RULES, r.id), r, { merge: true }))
      );
    } catch (error) {
      console.error('Error saving leave rules to cloud:', error);
    }
  },

  // 7. Activity Logs
  subscribeLogs: (callback: (logs: ActivityLogEntry[]) => void): Unsubscribe => {
    const colRef = collection(db, COLLECTIONS.LOGS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: ActivityLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as ActivityLogEntry);
        });
        items.sort((a, b) => b.timestamp - a.timestamp);
        callback(items);
      },
      (error) => {
        console.warn('Firestore subscribeLogs error:', error);
      }
    );
  },

  saveLog: async (log: ActivityLogEntry): Promise<void> => {
    try {
      await ensureAuth();
      const docRef = doc(db, COLLECTIONS.LOGS, log.id);
      await setDoc(docRef, log, { merge: true });
    } catch (error) {
      console.error('Error saving log to cloud:', error);
    }
  },
};
