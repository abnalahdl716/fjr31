import React from 'react';
import { X, Printer, Download, Sparkles, Building, Calendar, Check } from 'lucide-react';
import { AttendanceRecord, Employee, InstitutionSettings } from '../types';
import { formatDateArabic } from '../utils/time';

interface PrintReportModalProps {
  settings: InstitutionSettings;
  records: AttendanceRecord[];
  employees: Employee[];
  currentEmployee?: Employee | null;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  settings,
  records,
  employees,
  currentEmployee,
  onClose,
}) => {
  const filteredRecords = currentEmployee
    ? records.filter((r) => r.employeeId === currentEmployee.id)
    : records;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 print:shadow-none print:border-none print:max-w-full">
        {/* Modal Toolbar - Hidden during print */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">
              معاينة وطباعة تقرير الحضور والدوام
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة فورية / تصدير PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Content */}
        <div className="p-6 sm:p-10 space-y-6 text-slate-800 font-sans print:p-6" dir="rtl">
          {/* Official Letterhead */}
          <div className="border-b-2 border-emerald-800 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950">
                {settings.name}
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                {settings.tagline}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                تقرير بيان دوام وبصمات الحضور والانصراف (نظام 12 ساعة)
              </p>
            </div>

            <div className="text-left text-xs text-slate-500 font-mono">
              <div>تاريخ التقرير: {formatDateArabic(new Date())}</div>
              {currentEmployee && (
                <div className="font-bold text-emerald-800 mt-1">
                  الموظف: {currentEmployee.name} ({currentEmployee.department})
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border border-slate-200">
              <thead>
                <tr className="bg-emerald-800 text-white">
                  <th className="p-2.5 border-b border-slate-300">م</th>
                  <th className="p-2.5 border-b border-slate-300">الموظف</th>
                  <th className="p-2.5 border-b border-slate-300">القسم</th>
                  <th className="p-2.5 border-b border-slate-300">التاريخ</th>
                  <th className="p-2.5 border-b border-slate-300">وقت الحضور (12 ساعة)</th>
                  <th className="p-2.5 border-b border-slate-300">وقت الانصراف (12 ساعة)</th>
                  <th className="p-2.5 border-b border-slate-300">حالة الدوام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      لا توجد بصمات مسجلة في هذا النطاق
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => (
                    <tr key={rec.id} className="even:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{rec.employeeName}</td>
                      <td className="p-2.5 text-slate-600">{rec.department}</td>
                      <td className="p-2.5 text-slate-700 font-mono">{rec.date}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-700">
                        {rec.checkInTime || '-'}
                      </td>
                      <td className="p-2.5 font-mono font-medium text-slate-700">
                        {rec.checkOutTime || '-'}
                      </td>
                      <td className="p-2.5">
                        {rec.status === 'late' ? `تأخير ${rec.lateMinutes} دقيقة` : 'حاضر'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Signatures footer */}
          <div className="pt-8 grid grid-cols-2 text-center text-xs font-bold text-slate-700 border-t border-slate-200">
            <div>
              <p className="mb-8">مسؤول شؤون الموظفين</p>
              <p>.......................................</p>
            </div>
            <div>
              <p className="mb-8">اعتماد المدير العام</p>
              <p>.......................................</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
