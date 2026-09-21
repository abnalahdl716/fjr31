import React from 'react';
import { Printer, Download, X, FileText, Phone, Code2 } from 'lucide-react';
import { SystemSettings, AttendanceRecord, LeaveRequest } from '../types';
import { formatSecondsToArabic, formatSecondsDigital } from '../utils/time';

interface PrintReportModalProps {
  type: 'attendance' | 'leaves';
  settings: SystemSettings;
  records: AttendanceRecord[];
  leaves: LeaveRequest[];
  employeeName?: string;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  type,
  settings,
  records,
  leaves,
  employeeName = 'جميع الموظفين',
  startDate,
  endDate,
  onClose,
}) => {
  // Totals calculation for attendance
  const totalLateSeconds = records.reduce((acc, curr) => {
    // If excused, does not count towards late total!
    return acc + (curr.lateExcused ? 0 : curr.lateSeconds || 0);
  }, 0);

  const totalEarlyDepartureSeconds = records.reduce((acc, curr) => {
    return acc + (curr.earlyExcused ? 0 : curr.earlyDepartureSeconds || 0);
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';

    if (type === 'attendance') {
      csvContent += 'التاريخ,الموظف,تسجيل الحضور,تسجيل الانصراف,التأخير,الانصراف المبكر,الحالة\n';
      records.forEach((r) => {
        const row = [
          r.date,
          r.employeeName,
          r.checkInTime || '—',
          r.checkOutTime || '—',
          formatSecondsDigital(r.lateExcused ? 0 : r.lateSeconds),
          formatSecondsDigital(r.earlyExcused ? 0 : r.earlyDepartureSeconds),
          r.status === 'present' ? 'حاضر' : r.status === 'late' ? 'متأخر' : r.status === 'on_leave' ? 'إجازة' : 'غائب',
        ].join(',');
        csvContent += row + '\n';
      });
    } else {
      csvContent += 'الموظف,نوع الإجازة,تاريخ البدء,تاريخ الانتهاء,عدد الأيام,السبب,الحالة,الرصيد قبل,الرصيد بعد\n';
      leaves.forEach((l) => {
        const row = [
          l.employeeName,
          l.leaveType,
          l.startDate,
          l.endDate,
          l.daysCount,
          `"${l.reason.replace(/"/g, '""')}"`,
          l.status === 'approved' ? 'موافقة' : l.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة',
          l.balanceBefore ?? '—',
          l.balanceAfter ?? '—',
        ].join(',');
        csvContent += row + '\n';
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${type === 'attendance' ? 'تقرير_حضور_وانصراف' : 'تقرير_إجازات'}_${startDate}_${endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print p-4 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm sm:text-base">
              معاينة وطباعة التقرير الرسمي
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>تصدير CSV / Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900" id="official-printable-area">
          {/* Official Report Header */}
          <div className="border-b-2 border-emerald-600 pb-5 mb-6">
            <div className="flex items-center justify-between">
              {/* Foundation Info */}
              <div className="text-right">
                <h2 className="text-xl sm:text-2xl font-black text-emerald-900">
                  {settings.orgName}
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-md">
                  {settings.orgInfo}
                </p>
                <p className="text-xs font-semibold text-amber-700 mt-0.5">
                  إدارة الموارد البشرية وشؤون الموظفين
                </p>
              </div>

              {/* Organization Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 p-1.5 border-2 border-emerald-500 rounded-2xl bg-white shadow-xs shrink-0">
                <img
                  src={settings.logoUrl}
                  alt={settings.orgName}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="mt-4 pt-3 border-t border-dashed border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-2 bg-emerald-50/60 p-3 rounded-xl">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-emerald-950">
                  {type === 'attendance'
                    ? 'تقرير حضور وانصراف الموظفين'
                    : 'تقرير إجازات الموظفين الرسمية'}
                </h3>
                <span className="text-xs text-slate-600">
                  الموظف المستهدف: <strong className="text-emerald-900">{employeeName}</strong>
                </span>
              </div>
              <div className="text-xs bg-white px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold text-emerald-800">
                <span>الفترة: </span>
                <span className="font-mono-num">{startDate}</span>
                <span> إلى </span>
                <span className="font-mono-num">{endDate}</span>
              </div>
            </div>
          </div>

          {/* Report Body Table */}
          {type === 'attendance' ? (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-right text-xs sm:text-sm border-collapse">
                  <thead className="bg-emerald-700 text-white font-bold">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">اسم الموظف</th>
                      <th className="p-3">تحقق في (حضور)</th>
                      <th className="p-3">الدفع (انصراف)</th>
                      <th className="p-3">متأخر (بالثواني)</th>
                      <th className="p-3">المغادرة المبكرة</th>
                      <th className="p-3 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          لا توجد سجلات حضور خلال الفترة المحددة
                        </td>
                      </tr>
                    ) : (
                      records.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono-num font-semibold text-slate-700">
                            {rec.date}
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {rec.employeeName}
                          </td>
                          <td className="p-3 font-mono-num text-emerald-800 font-medium">
                            {rec.checkInTime || '—'}
                          </td>
                          <td className="p-3 font-mono-num text-amber-800 font-medium">
                            {rec.checkOutTime || '—'}
                          </td>
                          <td className="p-3 font-mono-num">
                            {rec.lateExcused ? (
                              <span className="text-emerald-600 text-xs font-bold">
                                معفى (عذر معتمد)
                              </span>
                            ) : rec.lateSeconds > 0 ? (
                              <span className="text-red-600 font-bold">
                                {formatSecondsDigital(rec.lateSeconds)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 font-mono-num">
                            {rec.earlyDepartureSeconds > 0 ? (
                              <span className="text-amber-600 font-bold">
                                {formatSecondsDigital(rec.earlyDepartureSeconds)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
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

              {/* Totals Box at End of Attendance Report as specified */}
              <div className="bg-gradient-to-r from-emerald-50 to-amber-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-200">
                  <span className="block text-xs font-bold text-slate-500 mb-1">
                    إجمالي وقت التأخير المحسوب:
                  </span>
                  <span className="block text-base sm:text-lg font-black font-mono-num text-red-700">
                    {formatSecondsToArabic(totalLateSeconds)}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    (لا تشمل فترات التأخير المعفية بأعذار رسمية مقبولة)
                  </span>
                </div>

                <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200">
                  <span className="block text-xs font-bold text-slate-500 mb-1">
                    إجمالي المغادرة المبكرة:
                  </span>
                  <span className="block text-base sm:text-lg font-black font-mono-num text-amber-700">
                    {formatSecondsToArabic(totalEarlyDepartureSeconds)}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    (انصراف الموظف قبل وقت انتهاء الدوام الرسمي)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Leaves Report Body */
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-right text-xs sm:text-sm border-collapse">
                  <thead className="bg-emerald-700 text-white font-bold">
                    <tr>
                      <th className="p-3">اسم الموظف</th>
                      <th className="p-3">نوع الإجازة</th>
                      <th className="p-3">تاريخ البدء</th>
                      <th className="p-3">تاريخ الانتهاء</th>
                      <th className="p-3 text-center">عدد الأيام</th>
                      <th className="p-3">سبب الإجازة</th>
                      <th className="p-3 text-center">حالة الطلب</th>
                      <th className="p-3 text-center">الموازنة قبل</th>
                      <th className="p-3 text-center">الرصيد بعد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400">
                          لا توجد سجلات إجازات مسجلة
                        </td>
                      </tr>
                    ) : (
                      leaves.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-800">{l.employeeName}</td>
                          <td className="p-3 font-medium text-emerald-800">{l.leaveType}</td>
                          <td className="p-3 font-mono-num">{l.startDate}</td>
                          <td className="p-3 font-mono-num">{l.endDate}</td>
                          <td className="p-3 text-center font-bold text-slate-900">{l.daysCount} يوم</td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{l.reason}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
                          <td className="p-3 text-center font-mono-num">{l.balanceBefore ?? '—'}</td>
                          <td className="p-3 text-center font-mono-num font-bold text-emerald-700">
                            {l.balanceAfter ?? '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Official Signatures Section for Print */}
          <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs text-slate-600">
            <div>
              <span className="font-bold block text-slate-800 mb-8">إعداد مسؤول الحضور:</span>
              <span className="border-b border-dotted border-slate-400 w-32 inline-block"></span>
            </div>
            <div>
              <span className="font-bold block text-slate-800 mb-8">مراجعة الموارد البشرية:</span>
              <span className="border-b border-dotted border-slate-400 w-32 inline-block"></span>
            </div>
            <div>
              <span className="font-bold block text-slate-800 mb-8">اعتماد المدير العام:</span>
              <span className="border-b border-dotted border-slate-400 w-32 inline-block"></span>
            </div>
          </div>

          {/* Official Print Footer as specified */}
          <div className="mt-10 pt-4 border-t-2 border-emerald-600 text-center text-xs text-slate-600 space-y-1">
            <div className="flex items-center justify-center gap-3">
              <span className="font-bold text-emerald-900">{settings.orgName}</span>
              <span>•</span>
              <div className="flex items-center gap-1 font-semibold">
                <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{settings.developerName}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1 font-mono-num font-bold text-amber-700" dir="ltr">
                <Phone className="w-3 h-3 text-amber-600" />
                <span>{settings.developerPhone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
