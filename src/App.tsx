import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginView } from './components/LoginView';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { MapLocationPicker } from './components/MapLocationPicker';
import { PrintReportModal } from './components/PrintReportModal';
import { Employee, AttendanceRecord, LeaveRequest, DocumentItem, InstitutionSettings } from './types';
import {
  getStoredEmployees,
  saveEmployees,
  getStoredAttendance,
  saveAttendance,
  getStoredLeaves,
  saveLeaves,
  getStoredDocuments,
  saveDocuments,
  getStoredSettings,
  saveSettings,
  getCurrentUser,
  setCurrentUser
} from './utils/storage';

export function App() {
  const [settings, setSettingsState] = useState<InstitutionSettings>(getStoredSettings);
  const [employees, setEmployeesState] = useState<Employee[]>(getStoredEmployees);
  const [attendance, setAttendanceState] = useState<AttendanceRecord[]>(getStoredAttendance);
  const [leaves, setLeavesState] = useState<LeaveRequest[]>(getStoredLeaves);
  const [documents, setDocumentsState] = useState<DocumentItem[]>(getStoredDocuments);
  const [currentUser, setCurrentUserState] = useState<Employee | null>(getCurrentUser);

  // Active Tab for employee navigation: 'attendance' | 'leaves' | 'documents' | 'profile'
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'documents' | 'profile'>('attendance');

  // Modals
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Persistence triggers
  const handleUpdateSettings = (newSettings: InstitutionSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  const handleLogin = (user: Employee) => {
    setCurrentUserState(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUserState(null);
    setCurrentUser(null);
  };

  const handleCheckIn = (record: AttendanceRecord) => {
    const updated = [record, ...attendance];
    setAttendanceState(updated);
    saveAttendance(updated);
  };

  const handleCheckOut = (record: AttendanceRecord) => {
    const updated = attendance.map((r) => (r.id === record.id ? record : r));
    setAttendanceState(updated);
    saveAttendance(updated);
  };

  const handleRequestLeave = (requestData: Omit<LeaveRequest, 'id' | 'status' | 'requestDate'>) => {
    const newLeave: LeaveRequest = {
      ...requestData,
      id: `leave-${Date.now()}`,
      status: 'pending',
      requestDate: new Date().toISOString().split('T')[0],
    };
    const updated = [newLeave, ...leaves];
    setLeavesState(updated);
    saveLeaves(updated);
  };

  const handleUpdateLeaveStatus = (leaveId: string, status: 'approved' | 'rejected', note?: string) => {
    const updated = leaves.map((l) => {
      if (l.id === leaveId) {
        return {
          ...l,
          status,
          adminResponseNote: note || (status === 'approved' ? 'تمت الموافقة' : 'تم الرفض'),
        };
      }
      return l;
    });
    setLeavesState(updated);
    saveLeaves(updated);

    // If approved, update employee's used leave balance
    if (status === 'approved') {
      const targetLeave = leaves.find((l) => l.id === leaveId);
      if (targetLeave) {
        const updatedEmployees = employees.map((emp) => {
          if (emp.id === targetLeave.employeeId) {
            return {
              ...emp,
              usedLeaveBalance: emp.usedLeaveBalance + targetLeave.daysCount,
            };
          }
          return emp;
        });
        setEmployeesState(updatedEmployees);
        saveEmployees(updatedEmployees);
      }
    }
  };

  const handleAddDocument = (docData: Omit<DocumentItem, 'id'>) => {
    const newDoc: DocumentItem = {
      ...docData,
      id: `doc-${Date.now()}`,
    };
    const updated = [newDoc, ...documents];
    setDocumentsState(updated);
    saveDocuments(updated);
  };

  const handleAddEmployee = (newEmp: Employee) => {
    const updated = [...employees, newEmp];
    setEmployeesState(updated);
    saveEmployees(updated);
  };

  const handleSaveLocation = (loc: { lat: number; lng: number; address: string; radius: number }) => {
    const newSettings: InstitutionSettings = {
      ...settings,
      officeLocation: {
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address,
        radiusMeters: loc.radius,
      },
    };
    handleUpdateSettings(newSettings);
    setShowMapPicker(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col selection:bg-emerald-600 selection:text-white antialiased">
      {/* Top Header with Section Navigation Bar */}
      <Header
        currentUser={currentUser}
        settings={settings}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        onOpenMap={() => setShowMapPicker(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6">
        {!currentUser ? (
          <LoginView
            employees={employees}
            onLogin={handleLogin}
            activePreviewTab={activeTab}
            onSelectPreviewTab={setActiveTab}
          />
        ) : currentUser.role === 'admin' ? (
          <div className="space-y-6">
            <AdminDashboard
              settings={settings}
              employees={employees}
              attendanceRecords={attendance}
              leaveRequests={leaves}
              documents={documents}
              onUpdateSettings={handleUpdateSettings}
              onAddEmployee={handleAddEmployee}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
              onOpenLocationPicker={() => setShowMapPicker(true)}
              onOpenPrintReport={() => setShowPrintModal(true)}
            />

            {/* Also allow admin to view their personal portal if they wish */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-500 mb-3 text-right">
                بصمة وتفاصيل حساب المدير الشخصي:
              </h3>
              <EmployeeDashboard
                employee={currentUser}
                settings={settings}
                attendanceRecords={attendance}
                leaveRequests={leaves}
                documents={documents}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                onRequestLeave={handleRequestLeave}
                onAddDocument={handleAddDocument}
                onOpenLocationPicker={() => setShowMapPicker(true)}
                onOpenPrintReport={() => setShowPrintModal(true)}
              />
            </div>
          </div>
        ) : (
          <EmployeeDashboard
            employee={currentUser}
            settings={settings}
            attendanceRecords={attendance}
            leaveRequests={leaves}
            documents={documents}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onRequestLeave={handleRequestLeave}
            onAddDocument={handleAddDocument}
            onOpenLocationPicker={() => setShowMapPicker(true)}
            onOpenPrintReport={() => setShowPrintModal(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {showMapPicker && (
        <MapLocationPicker
          initialLat={settings.officeLocation.lat}
          initialLng={settings.officeLocation.lng}
          initialRadius={settings.officeLocation.radiusMeters}
          initialAddress={settings.officeLocation.address}
          onSave={handleSaveLocation}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {showPrintModal && (
        <PrintReportModal
          settings={settings}
          records={attendance}
          employees={employees}
          currentEmployee={currentUser?.role === 'employee' ? currentUser : null}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}

export default App;
