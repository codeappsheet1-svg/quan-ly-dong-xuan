import React, { useState } from 'react';
import {
  StudentAbsenceRequest,
  StudentTransferReport,
  SchoolClass,
  UserAccount,
} from '../types/school';
import { storageService } from '../services/storageService';
import { ALL_CAMPUSES, BRANCHES_DATA } from '../data/initialData';
import {
  canApproveStudentAbsence,
  getPhtAssignedBranch,
  getResponsibleApproverLabel,
} from '../utils/permissionUtils';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  PlusCircle,
  FileText,
  UserCheck,
  Building,
  GraduationCap,
  Send,
  ArrowRightLeft,
  FileCheck2,
} from 'lucide-react';

interface StudentAbsenceAndTransferProps {
  currentUser: UserAccount | null;
  classes: SchoolClass[];
  absences: StudentAbsenceRequest[];
  transfers: StudentTransferReport[];
  onRefreshData: () => void;
}

export const StudentAbsenceAndTransfer: React.FC<StudentAbsenceAndTransferProps> = ({
  currentUser,
  classes,
  absences,
  transfers,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'absences' | 'transfers'>('absences');
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // New Absence Form State (Requirement 6: Họ tên HS, Phân hiệu, điểm trường, lớp, ngày tháng năm, thứ, buổi, tiết, lý do nghỉ)
  const [selectedBranchName, setSelectedBranchName] = useState(BRANCHES_DATA[0].name);
  const [selectedCampusName, setSelectedCampusName] = useState(ALL_CAMPUSES[0].name);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [studentName, setStudentName] = useState('');
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<'Sáng' | 'Chiều' | 'Cả ngày'>('Sáng');
  const [periods, setPeriods] = useState('Cả buổi');
  const [requestedBy, setRequestedBy] = useState<'GVCN' | 'Phụ huynh' | 'Học sinh'>('GVCN');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [absenceReason, setAbsenceReason] = useState('');

  // Helper to compute Day of Week
  const getDayOfWeekFromDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const map = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return map[d.getDay()] || 'Thứ 2';
  };

  // New Transfer Report Form State
  const [transferType, setTransferType] = useState<'CHUYEN_DEN' | 'CHUYEN_DI'>('CHUYEN_DI');
  const [transferStudentName, setTransferStudentName] = useState('');
  const [transferClassId, setTransferClassId] = useState(classes[0]?.id || '');
  const [transferSchool, setTransferSchool] = useState('');
  const [transferProvince, setTransferProvince] = useState('Phú Yên');
  const [transferReason, setTransferReason] = useState('');
  const [transferDecisionNo, setTransferDecisionNo] = useState('');

  // PHT Approval modal
  const [selectedAbsenceForApproval, setSelectedAbsenceForApproval] = useState<StudentAbsenceRequest | null>(null);
  const [phtComment, setPhtComment] = useState('');
  const [absenceBranchFilter, setAbsenceBranchFilter] = useState('ALL');

  const isPhtOrHt = currentUser?.role === 'PHT' || currentUser?.role === 'HT' || currentUser?.role === 'GV_TIN_HOC';

  const handleCreateAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    const cls = classes.find((c) => c.id === selectedClassId) || classes[0];

    const newReq: StudentAbsenceRequest = {
      id: 'HS_NP_' + Date.now().toString().slice(-4),
      studentId: `${cls.id}_HS_${Date.now().toString().slice(-3)}`,
      studentName,
      branchName: selectedBranchName,
      campusName: selectedCampusName,
      classId: cls.id,
      className: cls.name,
      absenceDate,
      dayOfWeek: getDayOfWeekFromDate(absenceDate),
      session,
      periods,
      reason: absenceReason,
      requestedBy,
      contactPhone: contactPhone || '0984567890',
      status: 'Chờ PHT duyệt',
      createdAt: new Date().toISOString().split('T')[0],
      isPublic: true,
    };

    const currentList = storageService.getStudentAbsences();
    currentList.unshift(newReq);
    storageService.saveStudentAbsences(currentList);
    storageService.addSyncLog(
      'GVCN xin phép cho HS nghỉ học',
      `${requestedBy} xin phép cho em ${studentName} (Lớp ${cls.name}, ${selectedCampusName}) nghỉ ngày ${absenceDate} (${getDayOfWeekFromDate(absenceDate)}, buổi ${session}, ${periods}). Lý do: ${absenceReason}`
    );

    setShowAbsenceModal(false);
    setStudentName('');
    setAbsenceReason('');
    onRefreshData();
  };

  const handleCreateTransferReport = (e: React.FormEvent) => {
    e.preventDefault();
    const cls = classes.find((c) => c.id === transferClassId) || classes[0];

    const newReport: StudentTransferReport = {
      id: 'BC_' + Date.now().toString().slice(-4),
      type: transferType,
      studentName: transferStudentName,
      classId: cls.id,
      className: cls.name,
      campusName: cls.campusName,
      effectiveDate: new Date().toISOString().split('T')[0],
      transferSchool,
      provinceCity: transferProvince,
      reason: transferReason,
      decisionNumber: transferDecisionNo || `GGT-${Math.floor(100 + Math.random() * 900)}/THCSDX`,
      gvcnId: currentUser?.id || 'GVCN',
      gvcnName: currentUser?.name || cls.homeroomTeacherName,
      status: 'Đã hoàn tất hồ sơ',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const currentTransfers = storageService.getStudentTransfers();
    currentTransfers.unshift(newReport);
    storageService.saveStudentTransfers(currentTransfers);

    storageService.addSyncLog(
      'Báo cáo HS biến động',
      `GVCN ${newReport.gvcnName} đã lập hồ sơ ${
        transferType === 'CHUYEN_DEN' ? 'tiếp nhận HS chuyển đến' : 'chuyển trường đi'
      } cho em ${transferStudentName} (Lớp ${cls.name})`
    );

    setShowTransferModal(false);
    setTransferStudentName('');
    setTransferSchool('');
    setTransferReason('');
    onRefreshData();
  };

  const handlePhtDecision = (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedAbsenceForApproval) return;

    const assignedPhtBranch = getPhtAssignedBranch(currentUser);
    const approverName =
      currentUser?.role === 'HT'
        ? 'Hiệu trưởng Nguyễn Quốc Bảo (Toàn trường)'
        : currentUser?.role === 'PHT'
        ? `Phó Hiệu trưởng ${currentUser.name} (Phụ trách ${assignedPhtBranch || selectedAbsenceForApproval.branchName})`
        : currentUser?.role === 'GV_TIN_HOC'
        ? 'Quản trị Hệ thống - Võ Thị Ngọc Hảo'
        : currentUser?.name || 'Ban Giám hiệu';

    const currentList = storageService.getStudentAbsences();
    const idx = currentList.findIndex((a) => a.id === selectedAbsenceForApproval.id);
    if (idx !== -1) {
      currentList[idx].status = decision === 'APPROVED' ? 'Đã phê duyệt' : 'Từ chối';
      currentList[idx].approvedBy = approverName;
      currentList[idx].approvalDate = new Date().toISOString().split('T')[0];
      currentList[idx].approvalComment = phtComment || `${approverName} đã xác nhận và phê duyệt.`;
      storageService.saveStudentAbsences(currentList);
    }

    storageService.addSyncLog(
      'BGH duyệt HS nghỉ',
      `${approverName} đã duyệt đơn xin nghỉ học của em ${selectedAbsenceForApproval.studentName}`
    );

    setSelectedAbsenceForApproval(null);
    setPhtComment('');
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Chuyên Cần & Biến Động Học Sinh Toàn Trường
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              PHT duyệt công khai
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">Học Sinh Xin Nghỉ & Báo Cáo Chuyển Đến / Đi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Duyệt trực tuyến bởi Phó Hiệu trưởng (PHT) • GVCN quản lý sĩ số tự động.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('absences')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                activeSubTab === 'absences' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              HS Xin Nghỉ Học ({absences.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('transfers')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                activeSubTab === 'transfers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Chuyển Đến / Chuyển Đi ({transfers.length})
            </button>
          </div>

          {activeSubTab === 'absences' ? (
            <button
              type="button"
              onClick={() => setShowAbsenceModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Gửi Đơn Xin Nghỉ Cho HS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow transition active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>GVCN Báo Cáo Chuyển Trường</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: STUDENT ABSENCES (PHT APPROVAL) */}
      {activeSubTab === 'absences' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Bảng Công Khai Học Sinh Xin Nghỉ Học (PHT & HT Duyệt)
              </h3>
            </div>

            {/* Filter by Branch */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Phân hiệu:</span>
              <select
                value={absenceBranchFilter}
                onChange={(e) => setAbsenceBranchFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none text-slate-700"
              >
                <option value="ALL">Tất cả phân hiệu (4 Phân hiệu)</option>
                <option value="Trụ sở chính Đồng Xuân">Trụ sở chính Đồng Xuân</option>
                <option value="Xuân Long">Phân hiệu Xuân Long (PHT Tuyên)</option>
                <option value="La Hai">Phân hiệu TH La Hai (PHT Long)</option>
                <option value="Xuân Quang 2">Phân hiệu Xuân Quang 2 (PHT Hiếu)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4">Mã Đơn</th>
                  <th className="py-3 px-4">Họ và Tên Học Sinh</th>
                  <th className="py-3 px-4">Phân Hiệu & Điểm Trường & Lớp</th>
                  <th className="py-3 px-4">Thời Gian Xin Nghỉ</th>
                  <th className="py-3 px-4">Lý Do Xin Nghỉ</th>
                  <th className="py-3 px-4">Người Xin & SĐT</th>
                  <th className="py-3 px-4 text-center">Trạng Thái (BGH Duyệt)</th>
                  {isPhtOrHt && <th className="py-3 px-4 text-center">Thao Tác Duyệt BGH</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {absences
                  .filter((req) => {
                    if (absenceBranchFilter !== 'ALL' && !req.branchName.toLowerCase().includes(absenceBranchFilter.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{req.id}</td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{req.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{req.studentId}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-red-700">Lớp {req.className}</div>
                      <div className="text-[11px] text-slate-700 font-medium">{req.campusName}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{req.branchName}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {req.absenceDate || (req as any).fromDate}
                      </div>
                      <div className="text-[11px] text-blue-700 font-semibold">
                        {req.dayOfWeek || getDayOfWeekFromDate(req.absenceDate || (req as any).fromDate)} • Buổi: {req.session || 'Sáng'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Tiết: <span className="font-semibold text-slate-700">{req.periods || 'Cả buổi'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-800 font-medium">{req.reason}</div>
                      {req.approvalComment && (
                        <div className="mt-1 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                          <strong>{req.approvedBy}:</strong> {req.approvalComment}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.requestedBy === 'GVCN' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {req.requestedBy === 'GVCN' ? 'GVCN xin phép' : req.requestedBy}
                      </span>
                      <div className="text-[11px] text-slate-600 font-mono mt-0.5">{req.contactPhone}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          req.status === 'Đã phê duyệt'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : req.status === 'Từ chối'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {req.status === 'Đã phê duyệt' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        {req.status === 'Từ chối' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {req.status === 'Chờ PHT duyệt' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{req.status}</span>
                      </span>
                    </td>

                    {isPhtOrHt && (() => {
                      const perm = canApproveStudentAbsence(currentUser, req);
                      return (
                        <td className="py-3 px-4 text-center">
                          {req.status === 'Chờ PHT duyệt' ? (
                            perm.canApprove ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAbsenceForApproval(req);
                                  setPhtComment('Đồng ý cho học sinh nghỉ. GVCN hướng dẫn bài tập bù.');
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
                              >
                                {currentUser?.role === 'HT' ? 'HT Duyệt' : 'PHT Duyệt'}
                              </button>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200"
                                title={perm.reason}
                              >
                                <span>{getResponsibleApproverLabel(req.branchName)}</span>
                              </span>
                            )
                          ) : (
                            <div className="text-[11px] text-slate-400">
                              <div>Đã duyệt</div>
                              {req.approvedBy && <div className="text-[9px] text-slate-500 truncate max-w-[120px]">{req.approvedBy}</div>}
                            </div>
                          )}
                        </td>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT TRANSFER REPORTS */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-600 text-white font-bold">🏛️</span>
              <div>
                <h4 className="font-extrabold text-blue-950 uppercase tracking-wide">
                  Đã Đồng Bộ Lên Trang Thứ 5 (Chuyên Trang Biến Động Học Sinh)
                </h4>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Toàn bộ danh sách chuyển đi, chuyển đến được công khai trên Trang 5 kèm theo thống kê, báo cáo theo dõi ở từng phân hiệu, từng điểm trường và toàn trường theo từng thời điểm.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Sổ Theo Dõi Học Sinh Chuyển Đến & Chuyển Đi (GVCN & BGH)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Lưu trữ hồ sơ học bạ điện tử</span>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4">Số Giấy Giới Thiệu / QĐ</th>
                  <th className="py-3 px-4">Họ và Tên Học Sinh</th>
                  <th className="py-3 px-4">Phân Loại</th>
                  <th className="py-3 px-4">Lớp Học</th>
                  <th className="py-3 px-4">Trường Chuyển Đến / Đi</th>
                  <th className="py-3 px-4">Ngày Hiệu Lực</th>
                  <th className="py-3 px-4">GVCN Báo Cáo</th>
                  <th className="py-3 px-4">Lý Do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{tr.decisionNumber}</td>

                    <td className="py-3 px-4 font-bold text-slate-900">{tr.studentName}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          tr.type === 'CHUYEN_DEN'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {tr.type === 'CHUYEN_DEN' ? 'Chuyển đến trường' : 'Chuyển đi nơi khác'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">Lớp {tr.className}</div>
                      <div className="text-[10px] text-slate-400">{tr.campusName}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{tr.transferSchool}</div>
                      <div className="text-[10px] text-slate-400">{tr.provinceCity}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono">{tr.effectiveDate}</td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{tr.gvcnName}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs">{tr.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* CREATE STUDENT ABSENCE MODAL */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Đơn Xin Nghỉ Học Cho Học Sinh (Trình PHT Duyệt)
              </h3>
              <button
                type="button"
                onClick={() => setShowAbsenceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAbsence} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phân hiệu:</label>
                  <select
                    value={selectedBranchName}
                    onChange={(e) => {
                      setSelectedBranchName(e.target.value);
                      const branch = BRANCHES_DATA.find((b) => b.name === e.target.value);
                      if (branch && branch.campuses[0]) {
                        setSelectedCampusName(branch.campuses[0].name);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    {BRANCHES_DATA.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Điểm trường:</label>
                  <select
                    value={selectedCampusName}
                    onChange={(e) => setSelectedCampusName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    {ALL_CAMPUSES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lớp học:</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      const cls = classes.find((c) => c.id === e.target.value);
                      if (cls) {
                        setSelectedCampusName(cls.campusName);
                        setSelectedBranchName(cls.branchName);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name} - {c.campusName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên học sinh:</label>
                {(() => {
                  const currentSelectedCls = classes.find((c) => c.id === selectedClassId);
                  const classStudents = currentSelectedCls ? currentSelectedCls.students : [];
                  return (
                    <div className="space-y-1.5">
                      {classStudents.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) setStudentName(e.target.value);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs mb-1"
                        >
                          <option value="">-- Hoặc chọn nhanh từ danh sách lớp {currentSelectedCls?.name} --</option>
                          {classStudents.map((s) => (
                            <option key={s.id} value={s.fullName}>
                              {s.fullName} ({s.gender} - {s.dob})
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        required
                        placeholder="Nhập họ và tên học sinh..."
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                      />
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày xin nghỉ:</label>
                  <input
                    type="date"
                    required
                    value={absenceDate}
                    onChange={(e) => setAbsenceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thứ:</label>
                  <input
                    type="text"
                    disabled
                    value={getDayOfWeekFromDate(absenceDate)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Buổi:</label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="Sáng">Sáng</option>
                    <option value="Chiều">Chiều</option>
                    <option value="Cả ngày">Cả ngày</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tiết xin nghỉ:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cả buổi, Tiết 1, 2..."
                    value={periods}
                    onChange={(e) => setPeriods(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Người làm đơn:</label>
                  <select
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="GVCN">Giáo viên chủ nhiệm (GVCN) xin phép</option>
                    <option value="Phụ huynh">Phụ huynh học sinh</option>
                    <option value="Học sinh">Học sinh tự xin</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại liên lạc:</label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0983112233"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do xin nghỉ học:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi rõ lý do: ốm sốt, khám chữa bệnh, việc gia đình, đường ngập suối..."
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAbsenceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Lên Phó Hiệu Trưởng Duyệt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TRANSFER REPORT MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                GVCN Báo Cáo Biến Động Học Sinh Chuyển Đến / Đi
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransferReport} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Loại biến động:</label>
                <select
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="CHUYEN_DI">Học sinh xin chuyển trường đi nơi khác</option>
                  <option value="CHUYEN_DEN">Tiếp nhận học sinh mới chuyển đến trường</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên học sinh:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trần Thị Cẩm Ly"
                  value={transferStudentName}
                  onChange={(e) => setTransferStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lớp tiếp nhận hoặc chuyển đi:</label>
                <select
                  value={transferClassId}
                  onChange={(e) => setTransferClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Lớp {c.name} - {c.campusName} (GVCN: {c.homeroomTeacherName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Trường chuyển đến hoặc chuyển từ:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trường TH&THCS Lê Quý Đôn, TP. Tuy Hòa"
                  value={transferSchool}
                  onChange={(e) => setTransferSchool(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số Giấy giới thiệu / Quyết định chuyển:</label>
                <input
                  type="text"
                  placeholder="VD: GGT-102/THCSDX hoặc QĐ của Phòng GD&ĐT"
                  value={transferDecisionNo}
                  onChange={(e) => setTransferDecisionNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do chuyển trường:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Chuyển hộ khẩu, chuyển nơi ở theo ba mẹ..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow transition"
                >
                  Lưu Báo Cáo & Cập Nhật Sĩ Số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHT APPROVAL DIALOG */}
      {selectedAbsenceForApproval && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {currentUser?.role === 'HT'
                  ? 'Phê Duyệt Đơn Nghỉ Học Của Hiệu Trưởng (Toàn trường)'
                  : `Phê Duyệt Đơn Nghỉ Học Của Phó Hiệu Trưởng (${getPhtAssignedBranch(currentUser) || ''})`}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAbsenceForApproval(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>Học sinh: <strong className="text-slate-900">{selectedAbsenceForApproval.studentName}</strong> (Lớp {selectedAbsenceForApproval.className})</div>
                <div>Điểm trường: <strong>{selectedAbsenceForApproval.campusName}</strong></div>
                <div>Lý do: <em>{selectedAbsenceForApproval.reason}</em></div>
                <div>Thời gian: <strong>{selectedAbsenceForApproval.absenceDate} ({selectedAbsenceForApproval.dayOfWeek}, buổi {selectedAbsenceForApproval.session}, tiết: {selectedAbsenceForApproval.periods})</strong></div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ý kiến phê duyệt của PHT:</label>
                <textarea
                  rows={2}
                  value={phtComment}
                  onChange={(e) => setPhtComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePhtDecision('REJECTED')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Từ Chối
                </button>
                <button
                  type="button"
                  onClick={() => handlePhtDecision('APPROVED')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow"
                >
                  Chấp Thuận & Công Khai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
