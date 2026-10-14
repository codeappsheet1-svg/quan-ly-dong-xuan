import React, { useState, useMemo } from 'react';
import { TimetableSlot, SchoolClass, UserAccount, PublicReminder } from '../types/school';
import { BELL_SCHEDULES, BRANCHES_DATA, ALL_CAMPUSES } from '../data/initialData';
import { storageService } from '../services/storageService';
import {
  Calendar,
  Clock,
  Printer,
  Search,
  School,
  Building,
  User,
  BookOpen,
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Upload,
  FileText,
  Image as ImageIcon,
  ShieldAlert,
  Edit3,
  RefreshCw,
  Filter,
} from 'lucide-react';

interface TimetableScheduleProps {
  currentUser: UserAccount | null;
  classes: SchoolClass[];
  allStaff: { account: UserAccount }[];
}

export const TimetableSchedule: React.FC<TimetableScheduleProps> = ({
  currentUser,
  classes,
  allStaff,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bell' | 'timetable' | 'teacher_schedule'>('timetable');
  const [scheduleMode, setScheduleMode] = useState<'realtime' | 'original'>('realtime'); // TKB thực tế vs TKB gốc

  // Filters for timetable
  const [filterBranch, setFilterBranch] = useState<string>('ALL');
  const [filterCampus, setFilterCampus] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>(() => classes[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => allStaff[4]?.account.id || '');
  const [filterShift, setFilterShift] = useState<'ALL' | 'Sáng' | 'Chiều'>('ALL');

  // Timetable dataset in state
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() => {
    const existing = storageService.getTimetable();
    if (existing && existing.length > 5) return existing;
    return existing || [];
  });

  const isPrincipalOrVice = currentUser?.role === 'HT' || currentUser?.role === 'PHT';

  // Modal: Đổi tiết / Điều chỉnh tiết
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState<TimetableSlot | null>(null);
  const [swapTeacherId, setSwapTeacherId] = useState('');
  const [swapReason, setSwapReason] = useState('Đổi tiết chuyên môn theo kế hoạch');
  const [swapType, setSwapType] = useState<'Đổi tiết' | 'Dạy thay' | 'Nghỉ tiết' | 'Dạy bù'>('Đổi tiết');

  // Modal: HT / PHT Nhắc nhở công khai nếu tự ý đổi/bỏ tiết
  const [showRemindModal, setShowRemindModal] = useState(false);
  const [remindSlot, setRemindSlot] = useState<TimetableSlot | null>(null);
  const [remindReason, setRemindReason] = useState<PublicReminder['reason']>('Tự ý đổi tiết');
  const [remindDetails, setRemindDetails] = useState('');
  const [remindProofFile, setRemindProofFile] = useState<string | null>(null);
  const [remindProofFileName, setRemindProofFileName] = useState('');
  const [remindSuccess, setRemindSuccess] = useState<string | null>(null);

  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'] as const;
  const morningPeriods = [1, 2, 3, 4, 5];
  const afternoonPeriods = [1, 2, 3, 4];

  // Campuses matching branch filter
  const filteredCampuses = useMemo(() => {
    if (filterBranch === 'ALL') return ALL_CAMPUSES.filter((c) => c.classCount > 0);
    const branch = BRANCHES_DATA.find((b) => b.name === filterBranch);
    return branch ? branch.campuses : [];
  }, [filterBranch]);

  // Classes matching campus filter
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (filterBranch !== 'ALL' && c.branchName !== filterBranch) return false;
      if (filterCampus !== 'ALL' && c.campusName !== filterCampus) return false;
      return true;
    });
  }, [classes, filterBranch, filterCampus]);

  // Currently selected class
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || filteredClasses[0] || classes[0];
  }, [classes, selectedClassId, filteredClasses]);

  // Teacher slots for Teacher Schedule view
  const teacherSlots = useMemo(() => {
    if (!selectedTeacherId) return [];
    return timetableSlots.filter((s) => s.teacherId === selectedTeacherId || s.substituteTeacherName?.includes(selectedTeacherId));
  }, [timetableSlots, selectedTeacherId]);

  // Filter slots for class view
  const classTimetable = useMemo(() => {
    if (!currentClass) return [];
    return timetableSlots.filter((t) => t.classId === currentClass.id || t.className === currentClass.name);
  }, [timetableSlots, currentClass]);

  // Handle Proof file upload for Reminder
  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRemindProofFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRemindProofFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save swap / adjustment
  const handleSaveSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForSwap) return;

    const substituteTeacher = allStaff.find((s) => s.account.id === swapTeacherId)?.account.name || 'Giáo viên bộ môn';

    const updatedSlots = timetableSlots.map((s) => {
      if (s.id === selectedSlotForSwap.id) {
        return {
          ...s,
          isModified: true,
          originalTeacherName: s.originalTeacherName || s.teacherName,
          substituteTeacherName: swapType === 'Nghỉ tiết' ? 'Nghỉ tiết (chưa bù)' : substituteTeacher,
          modificationType: swapType,
          modificationReason: swapReason,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    setTimetableSlots(updatedSlots);
    storageService.saveTimetable(updatedSlots);
    storageService.addSyncLog(
      'Điều chỉnh thời khóa biểu',
      `Đã cập nhật ${swapType} cho tiết ${selectedSlotForSwap.period} lớp ${selectedSlotForSwap.className}: ${selectedSlotForSwap.teacherName} -> ${substituteTeacher}`
    );

    setShowSwapModal(false);
    setSelectedSlotForSwap(null);
  };

  // Issue public reminder for arbitrary swap / skipping
  const handleIssuePublicReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remindSlot) return;

    const targetStaff = allStaff.find((s) => s.account.id === remindSlot.teacherId)?.account;
    const targetName = remindSlot.originalTeacherName || remindSlot.teacherName;

    const newReminder: PublicReminder = {
      id: `REM_TKB_${Date.now()}`,
      targetType: 'GV',
      targetId: remindSlot.teacherId,
      targetName: targetName,
      className: remindSlot.className,
      branchName: remindSlot.branchName || currentClass?.branchName || 'Phân hiệu TH La Hai',
      campusName: remindSlot.campusName || currentClass?.campusName || 'Điểm trường TH La Hai',
      reason: remindReason,
      title: `Nhắc nhở giáo viên ${targetName} ${remindReason.toLowerCase()} tại lớp ${remindSlot.className}`,
      content: remindDetails || `Giáo viên ${targetName} tự ý đổi tiết / bỏ tiết tại lớp ${remindSlot.className}, tiết ${remindSlot.period} (${remindSlot.dayOfWeek}) mà không báo cáo Ban Giám hiệu.`,
      week: Math.min(35, Math.max(1, Math.ceil(new Date().getDate() / 7) + 1)),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      date: new Date().toISOString().split('T')[0],
      evidenceFiles: remindProofFile
        ? [{ name: remindProofFileName || 'Minh_chung_vi_pham.jpg', url: remindProofFile, type: 'image/jpeg' }]
        : [],
      remindedBy: currentUser?.name || 'Hiệu trưởng Nguyễn Quốc Bảo',
      status: 'Công khai',
    };

    storageService.addPublicReminder(newReminder);
    storageService.addSyncLog(
      'Nhắc nhở công khai TKB',
      `Ban Giám hiệu đã ban hành nhắc nhở công khai đồng chí ${targetName} do ${remindReason} tiết ${remindSlot.period} lớp ${remindSlot.className}`
    );

    setRemindSuccess(`Đã ban hành nhắc nhở công khai thành công đối với GV ${targetName}!`);
    setTimeout(() => {
      setRemindSuccess(null);
      setShowRemindModal(false);
      setRemindSlot(null);
      setRemindProofFile(null);
      setRemindProofFileName('');
      setRemindDetails('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Phân Hệ Thời Khóa Biểu & Quản Lý Giảng Dạy
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              57 Lớp • 11 Điểm Trường Học
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">Thời Khóa Biểu Nhà Trường & Lịch Đổi Tiết</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi thời khóa biểu gốc của trường và cập nhật các trường hợp đổi tiết, dạy thay, tự dạy bù, nhắc nhở công khai.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('timetable')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                activeSubTab === 'timetable' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              TKB Từng Lớp Học
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('teacher_schedule')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                activeSubTab === 'teacher_schedule' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              TKB Theo Giáo Viên
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('bell')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                activeSubTab === 'bell' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Thời Gian Biểu (Tiết học)
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In TKB</span>
          </button>
        </div>
      </div>

      {/* Mode Toggle: TKB GỐC vs TKB THỰC TẾ CẬP NHẬT */}
      {activeSubTab !== 'bell' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Chế độ hiển thị:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setScheduleMode('realtime')}
                className={`px-3 py-1 rounded-lg transition ${
                  scheduleMode === 'realtime'
                    ? 'bg-amber-500 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ TKB Thực tế (Cập nhật đổi/nghỉ tiết)
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode('original')}
                className={`px-3 py-1 rounded-lg transition ${
                  scheduleMode === 'original'
                    ? 'bg-red-700 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📜 TKB Gốc (Nhà trường ban hành)
              </button>
            </div>
          </div>

          {/* Quick Notice if user is HT/PHT */}
          {isPrincipalOrVice && (
            <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>
                Quyền BGH: Thầy có thể bấm vào bất kỳ tiết học nào để <strong>Nhắc nhở công khai nếu GV tự ý đổi tiết, bỏ tiết</strong> kèm tải minh chứng từ máy tính.
              </span>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 1: CLASS TIMETABLE */}
      {activeSubTab === 'timetable' && (
        <div className="space-y-4">
          {/* Multi-Criteria Search Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* 1. Branch Filter */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">1. Phân hiệu:</label>
              <select
                value={filterBranch}
                onChange={(e) => {
                  setFilterBranch(e.target.value);
                  setFilterCampus('ALL');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-red-600 outline-none"
              >
                <option value="ALL">-- Tất cả 3 Phân hiệu --</option>
                {BRANCHES_DATA.filter((b) => b.id !== 'PH_TRU_SO').map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Campus Filter */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">2. Điểm trường:</label>
              <select
                value={filterCampus}
                onChange={(e) => setFilterCampus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-red-600 outline-none"
              >
                <option value="ALL">-- Tất cả điểm trường --</option>
                {filteredCampuses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Class Picker */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">3. Chọn Lớp học (57 lớp):</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-red-700 focus:ring-2 focus:ring-red-600 outline-none"
              >
                {filteredClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} ({c.campusName} - GVCN: {c.homeroomTeacherName})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Shift Filter */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">4. Buổi học:</label>
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-red-600 outline-none"
              >
                <option value="ALL">Cả ngày (Sáng & Chiều)</option>
                <option value="Sáng">Buổi Sáng (Tiết 1 - 5)</option>
                <option value="Chiều">Buổi Chiều (Tiết 1 - 4)</option>
              </select>
            </div>
          </div>

          {/* Current Class Overview Header */}
          {currentClass && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-black text-lg text-white">
                  {currentClass.name.replace(/[^0-9]/g, '') || 'L'}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-300">
                    Thời Khóa Biểu Lớp {currentClass.name}
                  </h3>
                  <p className="text-slate-300 text-[11px]">
                    Điểm trường: <strong>{currentClass.campusName}</strong> • {currentClass.branchName} • GVCN: <strong>{currentClass.homeroomTeacherName}</strong> • Sĩ số: {currentClass.totalStudents} HS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 font-semibold text-[11px]">
                  {scheduleMode === 'realtime' ? 'Đang xem: TKB Thực Tế' : 'Đang xem: TKB Gốc'}
                </span>
              </div>
            </div>
          )}

          {/* Weekly Timetable Grid: Morning (Sáng) */}
          {(filterShift === 'ALL' || filterShift === 'Sáng') && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-red-800 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>BUỔI SÁNG (Tiết 1 đến Tiết 5 • 07:15 - 11:15)</span>
                </div>
                <span className="text-[10px] bg-red-900 px-2 py-0.5 rounded text-rose-200">Áp dụng GDPT 2018</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                      <th className="py-2.5 px-3 w-20 border-r border-slate-200">Tiết</th>
                      {daysOfWeek.map((day) => (
                        <th key={day} className="py-2.5 px-3 border-r border-slate-200 min-w-36">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {morningPeriods.map((period) => (
                      <tr key={period} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-2 font-bold font-mono bg-slate-50 text-slate-700 border-r border-slate-200 align-middle">
                          <span className="block text-red-700 font-black">Tiết {period}</span>
                        </td>

                        {daysOfWeek.map((day) => {
                          const slot = classTimetable.find(
                            (t) => t.dayOfWeek === day && t.period === period && (t.session === 'Sáng' || !t.session)
                          );

                          // In original mode, show original teacher
                          const displayTeacher =
                            scheduleMode === 'original'
                              ? slot?.originalTeacherName || slot?.teacherName || 'GV Bộ Môn'
                              : slot?.substituteTeacherName || slot?.teacherName || 'GV Bộ Môn';

                          const isChanged = slot?.isModified && scheduleMode === 'realtime';

                          return (
                            <td key={day} className="p-2 border-r border-slate-200 align-top">
                              {slot ? (
                                <div
                                  className={`p-2.5 rounded-xl border text-left space-y-1.5 transition relative group ${
                                    isChanged
                                      ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-200'
                                      : 'bg-slate-50 border-slate-200 hover:border-red-300'
                                  }`}
                                >
                                  {/* Subject & Status */}
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="font-black text-slate-900 leading-tight">
                                      {slot.subject}
                                    </span>
                                    {isChanged && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white flex-shrink-0">
                                        {slot.modificationType}
                                      </span>
                                    )}
                                  </div>

                                  {/* Teacher */}
                                  <div className="text-[11px] text-slate-700 flex items-center gap-1 font-semibold">
                                    <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{displayTeacher}</span>
                                  </div>

                                  {/* Changed detail notice */}
                                  {isChanged && slot.originalTeacherName && (
                                    <div className="text-[10px] text-amber-800 bg-amber-100/70 p-1 rounded font-medium leading-tight">
                                      Gốc: {slot.originalTeacherName} {slot.modificationReason && `(${slot.modificationReason})`}
                                    </div>
                                  )}

                                  {/* Room */}
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {slot.room || `P.${currentClass.name}`}
                                  </div>

                                  {/* Action Buttons: Swap or Remind */}
                                  <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1 text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedSlotForSwap(slot);
                                        setSwapTeacherId(allStaff[0]?.account.id || '');
                                        setShowSwapModal(true);
                                      }}
                                      className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-0.5"
                                      title="Đổi tiết / Gán GV dạy thay"
                                    >
                                      <ArrowLeftRight className="w-2.5 h-2.5" />
                                      <span>Đổi tiết</span>
                                    </button>

                                    {/* HT/PHT Public Remind Button */}
                                    {isPrincipalOrVice && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRemindSlot(slot);
                                          setShowRemindModal(true);
                                        }}
                                        className="text-red-700 hover:text-red-900 font-bold flex items-center gap-0.5"
                                        title="Nhắc nhở công khai nếu tự ý đổi/bỏ tiết"
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                        <span>Nhắc nhở</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-20 flex flex-col items-center justify-center text-slate-300 font-mono text-[11px] hover:bg-slate-100/60 rounded-xl transition cursor-pointer">
                                  <span>—</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weekly Timetable Grid: Afternoon (Chiều) */}
          {(filterShift === 'ALL' || filterShift === 'Chiều') && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-blue-800 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>BUỔI CHIỀU (Tiết 1 đến Tiết 4 • 13:30 - 16:45)</span>
                </div>
                <span className="text-[10px] bg-blue-900 px-2 py-0.5 rounded text-blue-200">Tăng cường & Hoạt động trải nghiệm</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                      <th className="py-2.5 px-3 w-20 border-r border-slate-200">Tiết</th>
                      {daysOfWeek.map((day) => (
                        <th key={day} className="py-2.5 px-3 border-r border-slate-200 min-w-36">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {afternoonPeriods.map((period) => (
                      <tr key={period} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-2 font-bold font-mono bg-slate-50 text-slate-700 border-r border-slate-200 align-middle">
                          <span className="block text-blue-700 font-black">Tiết {period}</span>
                        </td>

                        {daysOfWeek.map((day) => {
                          const slot = classTimetable.find(
                            (t) => t.dayOfWeek === day && t.period === period && t.session === 'Chiều'
                          );

                          const displayTeacher =
                            scheduleMode === 'original'
                              ? slot?.originalTeacherName || slot?.teacherName || 'GV Bộ Môn'
                              : slot?.substituteTeacherName || slot?.teacherName || 'GV Bộ Môn';

                          const isChanged = slot?.isModified && scheduleMode === 'realtime';

                          return (
                            <td key={day} className="p-2 border-r border-slate-200 align-top">
                              {slot ? (
                                <div
                                  className={`p-2.5 rounded-xl border text-left space-y-1.5 transition ${
                                    isChanged
                                      ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-200'
                                      : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="font-black text-slate-900 leading-tight">
                                      {slot.subject}
                                    </span>
                                    {isChanged && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white flex-shrink-0">
                                        {slot.modificationType}
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-slate-700 flex items-center gap-1 font-semibold">
                                    <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{displayTeacher}</span>
                                  </div>

                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {slot.room || `P.${currentClass.name}`}
                                  </div>

                                  <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1 text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedSlotForSwap(slot);
                                        setSwapTeacherId(allStaff[0]?.account.id || '');
                                        setShowSwapModal(true);
                                      }}
                                      className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-0.5"
                                    >
                                      <ArrowLeftRight className="w-2.5 h-2.5" />
                                      <span>Đổi tiết</span>
                                    </button>

                                    {isPrincipalOrVice && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRemindSlot(slot);
                                          setShowRemindModal(true);
                                        }}
                                        className="text-red-700 hover:text-red-900 font-bold flex items-center gap-0.5"
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                        <span>Nhắc nhở</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-16 flex items-center justify-center text-slate-300 font-mono text-[11px]">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: TEACHER SCHEDULE SEARCH */}
      {activeSubTab === 'teacher_schedule' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="font-bold text-xs text-slate-700 whitespace-nowrap">Chọn Giáo viên tra cứu TKB:</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 outline-none min-w-64"
              >
                {allStaff
                  .filter((s) => s.account.role === 'GV' || s.account.role === 'HT' || s.account.role === 'PHT' || s.account.role === 'GV_TIN_HOC')
                  .map((s) => (
                    <option key={s.account.id} value={s.account.id}>
                      {s.account.name} ({s.account.position} - {s.account.branchName})
                    </option>
                  ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Tìm thấy <strong className="text-purple-700">{teacherSlots.length}</strong> tiết dạy trong tuần.
            </div>
          </div>

          {/* Teacher Slots Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">
                  Lịch Giảng Dạy Tuần: {allStaff.find((s) => s.account.id === selectedTeacherId)?.account.name}
                </h3>
              </div>
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg text-slate-300">
                {allStaff.find((s) => s.account.id === selectedTeacherId)?.account.branchName}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Thứ</th>
                    <th className="py-3 px-4">Buổi & Tiết</th>
                    <th className="py-3 px-4">Lớp Học</th>
                    <th className="py-3 px-4">Điểm Trường</th>
                    <th className="py-3 px-4">Môn Học</th>
                    <th className="py-3 px-4">Phòng Học</th>
                    <th className="py-3 px-4">Trạng Thái / Thay Đổi</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacherSlots.length > 0 ? (
                    teacherSlots.map((slot) => (
                      <tr key={slot.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{slot.dayOfWeek}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {slot.session || 'Sáng'} - Tiết {slot.period}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">Lớp {slot.className}</td>
                        <td className="py-3 px-4 text-slate-600">{slot.campusName}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{slot.subject}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{slot.room}</td>
                        <td className="py-3 px-4">
                          {slot.isModified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <span>{slot.modificationType}</span>: {slot.substituteTeacherName}
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đúng lịch gốc
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isPrincipalOrVice && (
                            <button
                              type="button"
                              onClick={() => {
                                setRemindSlot(slot);
                                setShowRemindModal(true);
                              }}
                              className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] border border-red-200 transition"
                            >
                              Nhắc nhở vi phạm
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Chưa có dữ liệu tiết dạy được phân công trong tuần cho giáo viên này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: BELL SCHEDULES */}
      {activeSubTab === 'bell' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BELL_SCHEDULES.map((sched, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-xs uppercase tracking-wider">{sched.branchName}</h3>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                    Buổi {sched.shift}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {sched.periods.map((p) => (
                    <div key={p.period} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs">
                          T{p.period}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">Tiết {p.period}</div>
                          <div className="text-[11px] text-slate-500">{p.description}</div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                        {p.timeRange}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ĐỔI TIẾT / ĐIỀU CHỈNH TIẾT HỌC */}
      {showSwapModal && selectedSlotForSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Đổi Tiết / Phân Công Dạy Thay</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSwapModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSwap} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  Lớp {selectedSlotForSwap.className} • Tiết {selectedSlotForSwap.period} ({selectedSlotForSwap.dayOfWeek})
                </div>
                <div className="text-slate-600">
                  Môn học: <strong>{selectedSlotForSwap.subject}</strong> • GV hiện tại: <strong>{selectedSlotForSwap.teacherName}</strong>
                </div>
                <div className="text-slate-500">Điểm trường: {selectedSlotForSwap.campusName}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phương thức điều chỉnh:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Đổi tiết', 'Dạy thay', 'Nghỉ tiết', 'Dạy bù'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSwapType(type)}
                      className={`p-2 rounded-xl border text-xs font-bold transition text-left ${
                        swapType === type
                          ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-100'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {swapType !== 'Nghỉ tiết' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giáo viên nhận dạy thay / đổi tiết:</label>
                  <select
                    value={swapTeacherId}
                    onChange={(e) => setSwapTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  >
                    {allStaff
                      .filter((s) => s.account.role === 'GV' || s.account.role === 'GV_TIN_HOC')
                      .map((s) => (
                        <option key={s.account.id} value={s.account.id}>
                          {s.account.name} ({s.account.position} - {s.account.branchName})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do điều chỉnh:</label>
                <input
                  type="text"
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Ví dụ: Đi công tác bồi dưỡng chuyên môn, có lịch họp chi bộ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 font-bold text-white shadow-md transition"
                >
                  Lưu Điều Chỉnh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HT / PHT NHẮC NHỞ CÔNG KHAI NẾU GV TỰ Ý ĐỔI TIẾT / BỎ TIẾT */}
      {showRemindModal && remindSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Nhắc Nhở Công Khai Giáo Viên Vi Phạm</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRemindModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {remindSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="font-black text-slate-900 text-base">{remindSuccess}</h4>
                <p className="text-xs text-slate-500">Thông báo đã được công khai trên toàn trường & Cổng phân hiệu.</p>
              </div>
            ) : (
              <form onSubmit={handleIssuePublicReminder} className="p-6 space-y-4 text-xs">
                <div className="bg-red-50 p-3.5 rounded-2xl border border-red-200 space-y-1 text-red-950">
                  <div className="font-bold text-sm">
                    Giáo viên bị nhắc nhở: <span className="text-red-700 font-black">{remindSlot.originalTeacherName || remindSlot.teacherName}</span>
                  </div>
                  <div className="text-[11px] text-red-800">
                    Lớp: <strong>{remindSlot.className}</strong> • Tiết {remindSlot.period} ({remindSlot.dayOfWeek}) • Điểm trường: {remindSlot.campusName}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hành vi / Lý do nhắc nhở:</label>
                  <select
                    value={remindReason}
                    onChange={(e) => setRemindReason(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-red-700 bg-white focus:ring-2 focus:ring-red-600 outline-none"
                    required
                  >
                    <option value="Tự ý đổi tiết">⚠️ Tự ý đổi tiết (Không xin phép BGH)</option>
                    <option value="Bỏ tiết không phép">🚫 Bỏ tiết không phép (Bỏ lớp không lý do)</option>
                    <option value="Đi muộn / vi phạm giờ giấc">⏱️ Đi muộn / vi phạm giờ giấc</option>
                    <option value="Vi phạm nề nếp">📋 Vi phạm nề nếp chuyên môn</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nội dung chi tiết nhắc nhở / Phê bình:</label>
                  <textarea
                    rows={3}
                    value={remindDetails}
                    onChange={(e) => setRemindDetails(e.target.value)}
                    placeholder="Mô tả cụ thể thời gian, diễn biến vụ việc và yêu cầu giáo viên thực hiện nghiêm túc quy chế..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-red-600"
                    required
                  />
                </div>

                {/* Upload Minh Chứng Từ Máy Tính (Hình ảnh / File) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tải lên minh chứng (Hình ảnh sổ đầu bài / Biên bản / File từ máy tính):
                  </label>
                  <div className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-4 text-center cursor-pointer relative bg-slate-50 transition">
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleProofFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {remindProofFileName ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã chọn file: {remindProofFileName}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="font-semibold text-slate-600">Nhấn vào đây để tải file / ảnh chụp từ máy tính</div>
                        <div className="text-[10px] text-slate-400">Hỗ trợ JPG, PNG, PDF hoặc tài liệu minh chứng</div>
                      </div>
                    )}
                  </div>
                  {remindProofFile && (
                    <div className="mt-2 p-2 bg-slate-100 rounded-xl flex items-center justify-between text-[11px]">
                      <span className="truncate max-w-xs text-slate-600">Minh chứng đã sẵn sàng tải lên Drive</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRemindProofFile(null);
                          setRemindProofFileName('');
                        }}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Xóa file
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRemindModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 font-bold text-white shadow-md transition"
                  >
                    Ban Hành Nhắc Nhở Công Khai
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
