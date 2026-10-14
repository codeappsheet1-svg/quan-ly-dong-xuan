import React, { useState, useMemo } from 'react';
import {
  LeaveRequest,
  SubstituteTeachingRequest,
  UserAccount,
  EmergencySubstituteSuggestion,
} from '../types/school';
import { ALL_CAMPUSES, BRANCHES_DATA } from '../data/initialData';
import { storageService } from '../services/storageService';
import {
  canApproveLeaveRequest,
  canApproveSubstituteRequest,
  getPhtAssignedBranch,
  getResponsibleApproverLabel,
} from '../utils/permissionUtils';
import {
  Calendar,
  FileCheck2,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  AlertCircle,
  Users,
  Building,
  User,
  MessageSquare,
  ShieldCheck,
  Send,
  Eye,
  ArrowRightLeft,
  RotateCcw,
  UserCheck,
  Sparkles,
  Zap,
  Filter,
  Search,
  Check,
  Award,
} from 'lucide-react';

interface LeaveAndSubstituteProps {
  currentUser: UserAccount | null;
  leaves: LeaveRequest[];
  substitutes: SubstituteTeachingRequest[];
  allStaff: { account: UserAccount }[];
  onRefreshData: () => void;
}

export const LeaveAndSubstitute: React.FC<LeaveAndSubstituteProps> = ({
  currentUser,
  leaves,
  substitutes,
  allStaff,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'emergency' | 'substitutes' | 'leaves'>('emergency');
  const [showCreateLeaveModal, setShowCreateLeaveModal] = useState(false);
  const [showCreateSubModal, setShowCreateSubModal] = useState(false);

  // Approval comments state
  const [approvalComment, setApprovalComment] = useState('');
  const [selectedRequestForAction, setSelectedRequestForAction] = useState<{
    type: 'leave' | 'sub';
    item: any;
    decision: 'APPROVED' | 'REJECTED';
  } | null>(null);

  // For BGH assigning teacher in mode NHO_BGH_PHAN_CONG
  const [bghAssignTeacherId, setBghAssignTeacherId] = useState('');

  // Emergency Replacement & Auto-Suggestion engine states (Requirement 1)
  const [suggestDate, setSuggestDate] = useState(new Date().toISOString().split('T')[0]);
  const [suggestSession, setSuggestSession] = useState<'Sáng' | 'Chiều'>('Sáng');
  const [suggestPeriod, setSuggestPeriod] = useState('Tiết 1, 2');
  const [suggestSubject, setSuggestSubject] = useState('Toán học');
  const [suggestBranch, setSuggestBranch] = useState('ALL');
  const [suggestCampus, setSuggestCampus] = useState('ALL');
  const [selectedLeaveIdForSub, setSelectedLeaveIdForSub] = useState<string>('');
  const [autoSuggestions, setAutoSuggestions] = useState<EmergencySubstituteSuggestion[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [leaveFilterType, setLeaveFilterType] = useState<string>('ALL');

  // Trigger auto search of free teachers based on timetable
  const handleScanFreeTeachers = (
    overrideDate = suggestDate,
    overrideSession = suggestSession,
    overridePeriod = suggestPeriod,
    overrideSub = suggestSubject,
    overrideBranch = suggestBranch,
    overrideCampus = suggestCampus
  ) => {
    const dayOfWeek = getDayOfWeekFromDate(overrideDate);
    const branch = overrideBranch === 'ALL' ? undefined : overrideBranch;
    const campus = overrideCampus === 'ALL' ? undefined : overrideCampus;
    const results = storageService.findSubstituteTeacherSuggestions(
      overrideDate,
      dayOfWeek,
      overrideSession,
      overridePeriod,
      overrideSub,
      branch,
      campus,
      currentUser?.id
    );
    setAutoSuggestions(results);
    setHasScanned(true);
  };

  // New Leave Form State
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Nghỉ việc riêng có lương');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [leavePlan, setLeavePlan] = useState('');

  // 3 Modes for Substitute / Teaching Adjustment (Requirement 5)
  const [subMode, setSubMode] = useState<'DOI_TIET_VOI_GV' | 'TU_DAY_BU' | 'NHO_BGH_PHAN_CONG'>('DOI_TIET_VOI_GV');

  // GV A (Requester) fields
  const [branchNameA, setBranchNameA] = useState(currentUser?.branchName || BRANCHES_DATA[0].name);
  const [campusNameA, setCampusNameA] = useState(currentUser?.campusName || ALL_CAMPUSES[0].name);
  const [classNameA, setClassNameA] = useState('9A');
  const [dateA, setDateA] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeekA, setDayOfWeekA] = useState('Thứ 2');
  const [sessionA, setSessionA] = useState<'Sáng' | 'Chiều'>('Sáng');
  const [periodA, setPeriodA] = useState('Tiết 1, 2');
  const [subjectA, setSubjectA] = useState('Toán học');
  const [reasonA, setReasonA] = useState('');

  // GV B fields (for DOI_TIET_VOI_GV)
  const [substituteTeacherId, setSubstituteTeacherId] = useState('');
  const [branchNameB, setBranchNameB] = useState(BRANCHES_DATA[0].name);
  const [campusNameB, setCampusNameB] = useState(ALL_CAMPUSES[0].name);
  const [classNameB, setClassNameB] = useState('7A');
  const [dateB, setDateB] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeekB, setDayOfWeekB] = useState('Thứ 3');
  const [sessionB, setSessionB] = useState<'Sáng' | 'Chiều'>('Chiều');
  const [periodB, setPeriodB] = useState('Tiết 3, 4');
  const [subjectB, setSubjectB] = useState('KHTN');
  const [reasonB, setReasonB] = useState('');

  // Self Makeup fields (for TU_DAY_BU)
  const [makeupDate, setMakeupDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [makeupDayOfWeek, setMakeupDayOfWeek] = useState('Thứ 4');
  const [makeupSession, setMakeupSession] = useState<'Sáng' | 'Chiều'>('Chiều');
  const [makeupPeriod, setMakeupPeriod] = useState('Tiết 1, 2');
  const [makeupRoom, setMakeupRoom] = useState('Phòng 9A');

  // Filter for substitute list
  const [modeFilter, setModeFilter] = useState<string>('ALL');

  const isPrincipal = currentUser?.role === 'HT' || currentUser?.role === 'GV_TIN_HOC';
  const isBgh = currentUser?.role === 'HT' || currentUser?.role === 'PHT' || currentUser?.role === 'GV_TIN_HOC';

  // Helper to auto compute day of week from date string
  const getDayOfWeekFromDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const map = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return map[day] || 'Thứ 2';
  };

  // Handle create leave
  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newLeave: LeaveRequest = {
      id: 'NP_' + Date.now().toString().slice(-4),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.position,
      campusName: currentUser.campusName,
      branchName: currentUser.branchName || 'Trụ sở chính Đồng Xuân',
      leaveType,
      startDate,
      endDate,
      totalDays: Math.max(
        1,
        Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) + 1
      ),
      reason: leaveReason,
      attachedPlan: leavePlan || 'Đã bàn giao công việc và giáo án chu đáo.',
      status: 'Chờ duyệt',
      createdAt: new Date().toISOString().split('T')[0],
      isPublic: true,
    };

    const currentLeaves = storageService.getLeaves();
    currentLeaves.unshift(newLeave);
    storageService.saveLeaves(currentLeaves);
    storageService.addSyncLog(
      'Nộp đơn xin nghỉ',
      `Đồng chí ${currentUser.name} đã gửi đơn xin ${leaveType} từ ${startDate} đến ${endDate}`
    );

    setShowCreateLeaveModal(false);
    setLeaveReason('');
    setLeavePlan('');
    onRefreshData();
  };

  // Handle create substitute / schedule adjustment
  const handleCreateSubstitute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let subTeacherName = '';
    if (subMode === 'DOI_TIET_VOI_GV') {
      const targetTeacher = allStaff.find((s) => s.account.id === substituteTeacherId);
      subTeacherName = targetTeacher?.account.name || 'Giáo viên bộ môn';
    }

    const newSub: SubstituteTeachingRequest = {
      id: 'DT_' + Date.now().toString().slice(-4),
      mode: subMode,

      requesterId: currentUser.id,
      requesterName: currentUser.name,
      branchNameA,
      campusNameA,
      classNameA,
      dateA,
      dayOfWeekA: getDayOfWeekFromDate(dateA),
      sessionA,
      periodA,
      subjectA,
      reasonA,

      substituteTeacherId: subMode === 'DOI_TIET_VOI_GV' ? substituteTeacherId : undefined,
      substituteTeacherName: subMode === 'DOI_TIET_VOI_GV' ? subTeacherName : undefined,
      branchNameB: subMode === 'DOI_TIET_VOI_GV' ? branchNameB : undefined,
      campusNameB: subMode === 'DOI_TIET_VOI_GV' ? campusNameB : undefined,
      classNameB: subMode === 'DOI_TIET_VOI_GV' ? classNameB : undefined,
      dateB: subMode === 'DOI_TIET_VOI_GV' ? dateB : undefined,
      dayOfWeekB: subMode === 'DOI_TIET_VOI_GV' ? getDayOfWeekFromDate(dateB) : undefined,
      sessionB: subMode === 'DOI_TIET_VOI_GV' ? sessionB : undefined,
      periodB: subMode === 'DOI_TIET_VOI_GV' ? periodB : undefined,
      subjectB: subMode === 'DOI_TIET_VOI_GV' ? subjectB : undefined,
      reasonB: subMode === 'DOI_TIET_VOI_GV' ? reasonB : undefined,

      makeupDate: subMode === 'TU_DAY_BU' ? makeupDate : undefined,
      makeupDayOfWeek: subMode === 'TU_DAY_BU' ? getDayOfWeekFromDate(makeupDate) : undefined,
      makeupSession: subMode === 'TU_DAY_BU' ? makeupSession : undefined,
      makeupPeriod: subMode === 'TU_DAY_BU' ? makeupPeriod : undefined,
      makeupRoom: subMode === 'TU_DAY_BU' ? makeupRoom : undefined,

      status: 'Chờ duyệt',
      createdAt: new Date().toISOString().split('T')[0],
      isPublic: true,
    };

    const currentSubs = storageService.getSubstitutes();
    currentSubs.unshift(newSub);
    storageService.saveSubstitutes(currentSubs);

    const desc =
      subMode === 'DOI_TIET_VOI_GV'
        ? `${currentUser.name} xin đổi tiết với ${subTeacherName}`
        : subMode === 'TU_DAY_BU'
        ? `${currentUser.name} xin nghỉ tự dạy bù môn ${subjectA}`
        : `${currentUser.name} xin nghỉ nhờ BGH phân công dạy thay`;

    storageService.addSyncLog('Đề xuất dạy thay/đổi tiết', desc);

    setShowCreateSubModal(false);
    setReasonA('');
    onRefreshData();
  };

  // BGH approval action (HT & PHT theo phân hiệu)
  const handleConfirmApproval = () => {
    if (!selectedRequestForAction) return;

    const assignedPhtBranch = getPhtAssignedBranch(currentUser);
    const approverName =
      currentUser?.role === 'HT'
        ? 'Hiệu trưởng Nguyễn Quốc Bảo'
        : currentUser?.role === 'PHT'
        ? `Phó Hiệu trưởng ${currentUser.name} (Phụ trách ${assignedPhtBranch || currentUser.branchName})`
        : currentUser?.role === 'GV_TIN_HOC'
        ? 'Quản trị Hệ thống - Võ Thị Ngọc Hảo'
        : currentUser?.name || 'Ban Giám hiệu';

    if (selectedRequestForAction.type === 'leave') {
      const currentLeaves = storageService.getLeaves();
      const idx = currentLeaves.findIndex((l) => l.id === selectedRequestForAction.item.id);
      if (idx !== -1) {
        currentLeaves[idx].status = selectedRequestForAction.decision === 'APPROVED' ? 'Đã phê duyệt' : 'Từ chối';
        currentLeaves[idx].approvedBy = approverName;
        currentLeaves[idx].approvalDate = new Date().toISOString().split('T')[0];
        currentLeaves[idx].approvalComment = approvalComment || `${approverName} đã phê duyệt.`;
        storageService.saveLeaves(currentLeaves);
      }
    } else {
      const currentSubs = storageService.getSubstitutes();
      const idx = currentSubs.findIndex((s) => s.id === selectedRequestForAction.item.id);
      if (idx !== -1) {
        currentSubs[idx].status = selectedRequestForAction.decision === 'APPROVED' ? 'Đã phê duyệt' : 'Từ chối';
        currentSubs[idx].approvedBy = approverName;
        currentSubs[idx].approvalDate = new Date().toISOString().split('T')[0];
        currentSubs[idx].approvalComment = approvalComment || `${approverName} đã phê duyệt kế hoạch đổi tiết/dạy thay.`;

        // If BGH assignment
        if (bghAssignTeacherId) {
          const teacher = allStaff.find((s) => s.account.id === bghAssignTeacherId);
          if (teacher) {
            currentSubs[idx].bghAssignedTeacherId = teacher.account.id;
            currentSubs[idx].bghAssignedTeacherName = teacher.account.name;
          }
        }

        storageService.saveSubstitutes(currentSubs);
      }
    }

    storageService.addSyncLog(
      'BGH phê duyệt',
      `${approverName} đã ${
        selectedRequestForAction.decision === 'APPROVED' ? 'phê duyệt' : 'từ chối'
      } đơn ${selectedRequestForAction.item.id}`
    );

    setSelectedRequestForAction(null);
    setApprovalComment('');
    setBghAssignTeacherId('');
    onRefreshData();
  };

  const filteredSubs = substitutes.filter((s) => {
    if (modeFilter !== 'ALL' && s.mode !== modeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Công Khai Minh Bạch • 3 Chế Độ Đổi Tiết & Dạy Thay
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Hiệu trưởng phê duyệt
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">Quản Lý Nghỉ Phép & Đổi Tiết - Dạy Thay</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ đầy đủ: 1) GV A đổi tiết với GV B • 2) GV A xin nghỉ tự dạy bù • 3) GV A xin nghỉ nhờ BGH phân công.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('emergency')}
              className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'emergency' ? 'bg-red-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Thay Thế Khẩn Cấp & Gợi Ý Lịch Trống</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('substitutes')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                activeTab === 'substitutes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Đổi Tiết & Dạy Thay ({substitutes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                activeTab === 'leaves' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Đơn Nghỉ Phép Chung ({leaves.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateSubModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng Ký Đổi Tiết / Dạy Thay Mới</span>
          </button>
        </div>
      </div>

      {/* TAB: THAY THẾ KHẨN CẤP & GỢI Ý TỰ ĐỘNG THEO LỊCH TRỐNG (YÊU CẦU 1) */}
      {activeTab === 'emergency' && (
        <div className="space-y-6">
          {/* Stat Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">Nghỉ Ốm Đau</div>
                <div className="text-lg font-black text-slate-900">
                  {leaves.filter((l) => l.leaveType === 'Nghỉ ốm' || l.leaveType === 'Nghỉ đột xuất').length} ca
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">Nghỉ Thai Sản</div>
                <div className="text-lg font-black text-slate-900">
                  {leaves.filter((l) => l.leaveType === 'Nghỉ thai sản').length} ca
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">Việc Riêng & Khác</div>
                <div className="text-lg font-black text-slate-900">
                  {leaves.filter((l) => l.leaveType.includes('việc riêng') || l.leaveType.includes('công tác')).length} ca
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">Tỷ Lệ Bố Trí Dạy Thay</div>
                <div className="text-lg font-black text-emerald-700">100% Đảm Bảo</div>
              </div>
            </div>
          </div>

          {/* Smart Auto-Suggestion & Emergency Assignment Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    Cơ Chế Gợi Ý & Phân Công Giáo Viên Dạy Thay Tự Động (AI/Timetable Engine)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hệ thống tự động quét thời khóa biểu gốc của 137 CBGV-NV, phát hiện các đồng chí đang trống tiết, cùng chuyên môn và định mức tuần nhẹ nhất để gợi ý tức thì.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleScanFreeTeachers()}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Quét Tìm Giáo Viên Trống Tiết</span>
              </button>
            </div>

            {/* Filter Inputs for Scan */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày dạy thay:</label>
                <input
                  type="date"
                  value={suggestDate}
                  onChange={(e) => setSuggestDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Thứ:</label>
                <input
                  type="text"
                  disabled
                  value={getDayOfWeekFromDate(suggestDate)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100 font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Buổi học:</label>
                <select
                  value={suggestSession}
                  onChange={(e) => setSuggestSession(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Sáng">Sáng</option>
                  <option value="Chiều">Chiều</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiết dạy:</label>
                <input
                  type="text"
                  value={suggestPeriod}
                  onChange={(e) => setSuggestPeriod(e.target.value)}
                  placeholder="Tiết 1, 2"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bộ môn cần thay:</label>
                <input
                  type="text"
                  value={suggestSubject}
                  onChange={(e) => setSuggestSubject(e.target.value)}
                  placeholder="Toán, Văn, KHTN..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phân hiệu:</label>
                <select
                  value={suggestBranch}
                  onChange={(e) => setSuggestBranch(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="ALL">Toàn trường</option>
                  {BRANCHES_DATA.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.code} - {b.name.replace('Phân hiệu ', '')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Suggestions List */}
            {hasScanned && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Tìm thấy {autoSuggestions.filter((s) => s.isFreeInPeriod).length} giáo viên trống tiết phù hợp:</span>
                  </span>
                  <span className="text-slate-500">Đã tự động tính toán khối lượng giờ dạy tuần</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {autoSuggestions.slice(0, 6).map((sug) => (
                    <div
                      key={sug.teacherId}
                      className={`p-4 rounded-xl border transition space-y-2.5 ${
                        sug.isFreeInPeriod
                          ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300 hover:shadow-sm'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-black text-sm text-slate-900">{sug.teacherName}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {sug.subject} • {sug.campusName}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            sug.matchScore >= 80
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : sug.matchScore >= 60
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sug.matchScore}% Phù hợp
                        </span>
                      </div>

                      {/* Reasons badges */}
                      <div className="flex flex-wrap gap-1">
                        {sug.matchReasons.map((r, i) => (
                          <span
                            key={i}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              r.includes('Trống tiết')
                                ? 'bg-emerald-200 text-emerald-900'
                                : r.includes('Cùng chuyên môn')
                                ? 'bg-blue-100 text-blue-800'
                                : r.includes('Cùng phân hiệu') || r.includes('Cùng điểm trường')
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                        <span className="text-[9px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                          Đã dạy: {sug.currentWeeklyPeriods} tiết/tuần
                        </span>
                      </div>

                      {/* One click assign button */}
                      {sug.isFreeInPeriod && isBgh && (
                        <button
                          type="button"
                          onClick={() => {
                            const newSub: SubstituteTeachingRequest = {
                              id: 'KC_' + Date.now().toString().slice(-4),
                              mode: 'NHO_BGH_PHAN_CONG',
                              requesterId: currentUser?.id || 'BGH_AUTO',
                              requesterName: currentUser?.name || 'Ban Giám Hiệu',
                              branchNameA: sug.branchName,
                              campusNameA: sug.campusName,
                              classNameA: 'Theo phân công',
                              dateA: suggestDate,
                              dayOfWeekA: getDayOfWeekFromDate(suggestDate),
                              sessionA: suggestSession,
                              periodA: suggestPeriod,
                              subjectA: suggestSubject,
                              reasonA: `Lệnh điều động thay thế khẩn cấp do BGH phân công đồng chí ${sug.teacherName}`,
                              bghAssignedTeacherId: sug.teacherId,
                              bghAssignedTeacherName: sug.teacherName,
                              status: 'Đã phê duyệt',
                              approvedBy: currentUser?.name || 'Hiệu trưởng Nguyễn Quốc Bảo',
                              approvalDate: new Date().toISOString().split('T')[0],
                              approvalComment: `Lệnh phân công thay thế khẩn cấp có hiệu lực tức thì. Đ/c ${sug.teacherName} nhận tiết dạy thay.`,
                              createdAt: new Date().toISOString().split('T')[0],
                              isPublic: true,
                            };
                            const currentSubs = storageService.getSubstitutes();
                            currentSubs.unshift(newSub);
                            storageService.saveSubstitutes(currentSubs);
                            storageService.addSyncLog(
                              'Điều động dạy thay khẩn cấp',
                              `Đã chỉ định đồng chí ${sug.teacherName} dạy thay ${suggestSubject} (${suggestPeriod} ${suggestSession} ngày ${suggestDate})`
                            );
                            alert(`Đã ban hành Lệnh phân công dạy thay khẩn cấp cho Thầy/Cô ${sug.teacherName}!`);
                            onRefreshData();
                          }}
                          className="w-full mt-2 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Điều Động Dạy Thay Ngay</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Emergency & Active Leaves Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Danh Sách Đơn Xin Nghỉ (Ốm, Thai Sản, Việc Riêng) Cần Theo Dõi
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={leaveFilterType}
                  onChange={(e) => setLeaveFilterType(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="ALL">Tất cả loại nghỉ</option>
                  <option value="Nghỉ ốm">Nghỉ ốm</option>
                  <option value="Nghỉ thai sản">Nghỉ thai sản</option>
                  <option value="Nghỉ việc riêng có lương">Nghỉ việc riêng có lương</option>
                  <option value="Nghỉ việc riêng không lương">Nghỉ việc riêng không lương</option>
                  <option value="Nghỉ đột xuất">Nghỉ đột xuất</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateLeaveModal(true)}
                  className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg text-xs"
                >
                  + Tạo Đơn Nghỉ Mới
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Mã đơn</th>
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3">Loại nghỉ</th>
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3">Số ngày</th>
                    <th className="py-2.5 px-3">Lý do</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                    <th className="py-2.5 px-3 text-center">Gợi ý dạy thay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves
                    .filter((l) => leaveFilterType === 'ALL' || l.leaveType === leaveFilterType)
                    .map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{l.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {l.userName}
                          <div className="text-[10px] text-slate-400 font-normal">{l.userRole}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              l.leaveType === 'Nghỉ ốm' || l.leaveType === 'Nghỉ đột xuất'
                                ? 'bg-rose-100 text-rose-800'
                                : l.leaveType === 'Nghỉ thai sản'
                                ? 'bg-pink-100 text-pink-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {l.leaveType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {l.startDate} ➔ {l.endDate}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{l.totalDays} ngày</td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={l.reason}>
                          {l.reason}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              l.status === 'Đã phê duyệt'
                                ? 'bg-emerald-100 text-emerald-800'
                                : l.status === 'Từ chối'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSuggestDate(l.startDate);
                              handleScanFreeTeachers(l.startDate, 'Sáng', 'Tiết 1, 2', 'Toán học', l.branchName);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg text-[10px] flex items-center gap-1 mx-auto"
                          >
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>Gợi ý GV</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SUBSTITUTE TEACHING & ADJUSTMENT (3 MODES) */}
      {activeTab === 'substitutes' && (
        <div className="space-y-4">
          {/* Mode Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Lọc theo hình thức:</span>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium outline-none"
              >
                <option value="ALL">-- Tất cả 3 hình thức --</option>
                <option value="DOI_TIET_VOI_GV">1. GV A đổi tiết với GV B</option>
                <option value="TU_DAY_BU">2. GV A xin nghỉ tự dạy bù</option>
                <option value="NHO_BGH_PHAN_CONG">3. GV A xin nghỉ nhờ BGH phân công</option>
              </select>
            </div>
            <div className="text-slate-500 font-medium">
              Đang hiển thị <strong>{filteredSubs.length}</strong> đề xuất đổi tiết / dạy thay công khai.
            </div>
          </div>

          {/* List of Substitute Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredSubs.map((s) => {
                return (
                  <div key={s.id} className="p-5 hover:bg-slate-50/70 transition space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border">
                          {s.id}
                        </span>

                        {s.mode === 'DOI_TIET_VOI_GV' && (
                          <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>GV A đổi tiết với GV B</span>
                          </span>
                        )}

                        {s.mode === 'TU_DAY_BU' && (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                            <RotateCcw className="w-3 h-3" />
                            <span>GV A xin nghỉ tự dạy bù</span>
                          </span>
                        )}

                        {s.mode === 'NHO_BGH_PHAN_CONG' && (
                          <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                            <UserCheck className="w-3 h-3" />
                            <span>GV A xin nghỉ nhờ BGH phân công</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            s.status === 'Đã phê duyệt'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : s.status === 'Từ chối'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {s.status === 'Đã phê duyệt' && <CheckCircle className="w-3 h-3" />}
                          {s.status === 'Từ chối' && <XCircle className="w-3 h-3" />}
                          {s.status === 'Chờ duyệt' && <Clock className="w-3 h-3" />}
                          <span>{s.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Detailed Layout comparing Teacher A and Action */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                      {/* Left: GV A info */}
                      <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
                          <span>Giáo viên A (Người xin nghỉ / đổi):</span>
                        </div>
                        <div className="text-sm font-black text-slate-900">{s.requesterName}</div>
                        <div className="text-slate-600">
                          <strong>Môn dạy:</strong> {s.subjectA} • <strong>Lớp:</strong> {s.classNameA}
                        </div>
                        <div className="text-slate-600">
                          <strong>Điểm trường:</strong> {s.campusNameA} ({s.branchNameA})
                        </div>
                        <div className="text-slate-700 font-semibold bg-white p-2 rounded-lg border border-slate-200">
                          📅 Tiết xin nghỉ/đổi: <strong>{s.periodA}</strong> ({s.sessionA}) • {s.dayOfWeekA}, ngày {s.dateA}
                        </div>
                        <div className="text-slate-600 italic">
                          <strong>Lý do nghỉ:</strong> {s.reasonA}
                        </div>
                      </div>

                      {/* Right: Counterpart (GV B or Makeup plan or BGH assignment) */}
                      <div className="space-y-1.5">
                        {s.mode === 'DOI_TIET_VOI_GV' && (
                          <>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                              <span>Giáo viên B (Đổi tiết đối ứng):</span>
                            </div>
                            <div className="text-sm font-black text-blue-900">{s.substituteTeacherName}</div>
                            <div className="text-slate-600">
                              <strong>Môn dạy:</strong> {s.subjectB || 'Bộ môn'} • <strong>Lớp:</strong> {s.classNameB}
                            </div>
                            <div className="text-slate-600">
                              <strong>Điểm trường:</strong> {s.campusNameB} ({s.branchNameB})
                            </div>
                            <div className="text-blue-900 font-semibold bg-blue-50/70 p-2 rounded-lg border border-blue-200">
                              📅 Tiết đổi đối ứng: <strong>{s.periodB}</strong> ({s.sessionB}) • {s.dayOfWeekB}, ngày {s.dateB}
                            </div>
                          </>
                        )}

                        {s.mode === 'TU_DAY_BU' && (
                          <>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                              <span>Kế hoạch tự dạy bù:</span>
                            </div>
                            <div className="text-slate-700 font-semibold bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 space-y-1">
                              <div>
                                📅 Thời gian dạy bù: <strong>{s.makeupPeriod}</strong> ({s.makeupSession}) • {s.makeupDayOfWeek}, ngày {s.makeupDate}
                              </div>
                              <div>
                                📍 Phòng học: <strong>{s.makeupRoom || 'Phòng học lớp'}</strong>
                              </div>
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              Giáo viên cam kết hoàn thành đầy đủ chương trình đúng quy định chuyên môn.
                            </div>
                          </>
                        )}

                        {s.mode === 'NHO_BGH_PHAN_CONG' && (
                          <>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                              <span>Phân công của Ban Giám hiệu:</span>
                            </div>
                            {s.bghAssignedTeacherName ? (
                              <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200 text-purple-900 space-y-1">
                                <div>
                                  GV được BGH phân công dạy thay: <strong className="text-sm font-black text-purple-950">{s.bghAssignedTeacherName}</strong>
                                </div>
                                <div className="text-[11px] text-purple-700">
                                  Đã ghi nhận tiết dạy thay vào hồ sơ chuyên môn của giáo viên được phân công.
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 italic bg-white p-2 rounded border">
                                Đang chờ Hiệu trưởng phân công giáo viên phụ trách dạy thay.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* HT comment if present */}
                    {s.approvalComment && (
                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-xs">
                        <strong>Ý kiến phê duyệt của Hiệu trưởng Nguyễn Quốc Bảo:</strong> {s.approvalComment}
                      </div>
                    )}

                    {/* BGH Action Buttons */}
                    {isBgh && s.status === 'Chờ duyệt' && (() => {
                      const permSub = canApproveSubstituteRequest(currentUser, s);
                      return (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          {permSub.canApprove ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRequestForAction({
                                    type: 'sub',
                                    item: s,
                                    decision: 'APPROVED',
                                  });
                                  setApprovalComment('BGH đồng ý phê duyệt kế hoạch.');
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                              >
                                {currentUser?.role === 'HT' ? 'Hiệu Trưởng Phê Duyệt' : `PHT Duyệt (${permSub.assignedBranch || ''})`}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRequestForAction({
                                    type: 'sub',
                                    item: s,
                                    decision: 'REJECTED',
                                  });
                                  setApprovalComment('Không thể bố trí thời gian hoặc giáo viên dạy thay.');
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                              >
                                Từ Chối
                              </button>
                            </>
                          ) : (
                            <div className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5" title={permSub.reason}>
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                              <span>Thẩm quyền duyệt: <strong>{getResponsibleApproverLabel(s.branchNameA)}</strong></span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE REQUESTS */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Bảng Công Khai Đơn Xin Nghỉ Phép Cán Bộ, Giáo Viên, Nhân Viên
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateLeaveModal(true)}
                className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-bold text-xs shadow"
              >
                + Nộp Đơn Xin Nghỉ Phép
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn</th>
                    <th className="py-3 px-4">Họ và Tên Nhân Sự</th>
                    <th className="py-3 px-4">Loại Nghỉ Phép</th>
                    <th className="py-3 px-4">Thời Gian Nghỉ</th>
                    <th className="py-3 px-4">Lý Do & Kế Hoạch Bàn Giao</th>
                    <th className="py-3 px-4 text-center">Trạng Thái (BGH Duyệt)</th>
                    {isBgh && <th className="py-3 px-4 text-center">Thao Tác Duyệt BGH</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{l.id}</td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{l.userName}</div>
                        <div className="text-[11px] text-slate-500">
                          {l.userRole} • {l.campusName}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                          {l.leaveType}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {l.startDate} → {l.endDate}
                        </div>
                        <div className="text-[10px] text-slate-500">Tổng cộng: {l.totalDays} ngày</div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 font-medium">{l.reason}</div>
                        <div className="text-[10px] text-slate-500 italic mt-0.5">
                          Kế hoạch: {l.attachedPlan}
                        </div>
                        {l.approvalComment && (
                          <div className="mt-1 text-[11px] text-red-700 bg-red-50 p-1.5 rounded border border-red-100 font-medium">
                            Ý kiến HT: {l.approvalComment}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            l.status === 'Đã phê duyệt'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : l.status === 'Từ chối'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {l.status === 'Đã phê duyệt' && <CheckCircle className="w-3.5 h-3.5" />}
                          {l.status === 'Từ chối' && <XCircle className="w-3.5 h-3.5" />}
                          {l.status === 'Chờ duyệt' && <Clock className="w-3.5 h-3.5" />}
                          <span>{l.status}</span>
                        </span>
                      </td>

                      {isBgh && (() => {
                        const permLeave = canApproveLeaveRequest(currentUser, l, allStaff);
                        return (
                          <td className="py-3 px-4 text-center">
                            {l.status === 'Chờ duyệt' ? (
                              permLeave.canApprove ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRequestForAction({
                                        type: 'leave',
                                        item: l,
                                        decision: 'APPROVED',
                                      });
                                      setApprovalComment('Đồng ý cho đồng chí nghỉ phép. Yêu cầu bàn giao tiết dạy chu đáo.');
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-sm transition"
                                  >
                                    {currentUser?.role === 'HT' ? 'Duyệt' : 'PHT Duyệt'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRequestForAction({
                                        type: 'leave',
                                        item: l,
                                        decision: 'REJECTED',
                                      });
                                      setApprovalComment('Không thể bố trí người dạy thay đợt này.');
                                    }}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] shadow-sm transition"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block font-medium"
                                  title={permLeave.reason}
                                >
                                  {getResponsibleApproverLabel(l.branchName || l.campusName)}
                                </span>
                              )
                            ) : (
                              <div className="text-[11px] text-slate-400">
                                <div>Đã xử lý</div>
                                {l.approvedBy && <div className="text-[9px] text-slate-500 truncate max-w-[120px]">{l.approvedBy}</div>}
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
        </div>
      )}

      {/* MODAL: CREATE SUBSTITUTE / ADJUSTMENT (3 MODES - REQUIREMENT 5) */}
      {showCreateSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Đăng Ký Đổi Tiết / Dạy Thay / Tự Dạy Bù
                </h3>
                <p className="text-xs text-slate-500">Trình Hiệu trưởng phê duyệt và công khai toàn trường</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateSubModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubstitute} className="mt-4 space-y-4 text-xs">
              {/* Select Mode */}
              <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setSubMode('DOI_TIET_VOI_GV')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs transition text-center ${
                    subMode === 'DOI_TIET_VOI_GV' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  1. GV A đổi tiết với GV B
                </button>
                <button
                  type="button"
                  onClick={() => setSubMode('TU_DAY_BU')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs transition text-center ${
                    subMode === 'TU_DAY_BU' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  2. GV A xin nghỉ tự dạy bù
                </button>
                <button
                  type="button"
                  onClick={() => setSubMode('NHO_BGH_PHAN_CONG')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs transition text-center ${
                    subMode === 'NHO_BGH_PHAN_CONG' ? 'bg-white text-purple-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  3. GV A nhờ BGH phân công
                </button>
              </div>

              {/* SECTION: THÔNG TIN GIÁO VIÊN A */}
              <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-3">
                <div className="font-bold text-red-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Thông tin Giáo viên A (Người xin nghỉ / đổi):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Họ tên GV A:</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser?.name || 'Giáo viên'}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Môn dạy:</label>
                    <input
                      type="text"
                      required
                      value={subjectA}
                      onChange={(e) => setSubjectA(e.target.value)}
                      placeholder="VD: Toán học, Ngữ văn..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phân hiệu:</label>
                    <select
                      value={branchNameA}
                      onChange={(e) => {
                        setBranchNameA(e.target.value);
                        const b = BRANCHES_DATA.find((x) => x.name === e.target.value);
                        if (b && b.campuses[0]) setCampusNameA(b.campuses[0].name);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
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
                      value={campusNameA}
                      onChange={(e) => setCampusNameA(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                    >
                      {ALL_CAMPUSES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Lớp giảng dạy:</label>
                    <input
                      type="text"
                      required
                      value={classNameA}
                      onChange={(e) => setClassNameA(e.target.value)}
                      placeholder="VD: 9A, 1A..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ngày xin nghỉ/đổi:</label>
                    <input
                      type="date"
                      required
                      value={dateA}
                      onChange={(e) => setDateA(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Thứ:</label>
                    <input
                      type="text"
                      disabled
                      value={getDayOfWeekFromDate(dateA)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Buổi:</label>
                    <select
                      value={sessionA}
                      onChange={(e) => setSessionA(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Sáng">Sáng</option>
                      <option value="Chiều">Chiều</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tiết dạy:</label>
                    <input
                      type="text"
                      required
                      value={periodA}
                      onChange={(e) => setPeriodA(e.target.value)}
                      placeholder="Tiết 1, 2"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lý do nghỉ / đổi tiết:</label>
                  <textarea
                    rows={2}
                    required
                    value={reasonA}
                    onChange={(e) => setReasonA(e.target.value)}
                    placeholder="Ghi rõ lý do xin nghỉ hoặc đổi tiết..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* CONDITIONAL SECTION: GV B (FOR MODE DOI_TIET_VOI_GV) */}
              {subMode === 'DOI_TIET_VOI_GV' && (
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-blue-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Thông tin Giáo viên B (Đổi tiết đối ứng):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const suggestions = storageService.findSubstituteTeacherSuggestions(
                          dateA,
                          getDayOfWeekFromDate(dateA),
                          sessionA,
                          periodA,
                          subjectA,
                          branchNameA,
                          campusNameA,
                          currentUser?.id
                        );
                        if (suggestions.length > 0 && suggestions[0].isFreeInPeriod) {
                          setSubstituteTeacherId(suggestions[0].teacherId);
                          setSubjectB(suggestions[0].subject || subjectA);
                          setBranchNameB(suggestions[0].branchName);
                          setCampusNameB(suggestions[0].campusName);
                          alert(`Đã tự động chọn Thầy/Cô ${suggestions[0].teacherName} (Trống tiết, ${suggestions[0].matchScore}% phù hợp)!`);
                        } else {
                          alert('Đang quét thời khóa biểu, vui lòng chọn từ danh sách.');
                        }
                      }}
                      className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold rounded-lg text-[10px] flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>⚡ Gợi ý GV Trống Tiết Tự Động</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Chọn Giáo viên B:</label>
                      <select
                        value={substituteTeacherId}
                        onChange={(e) => setSubstituteTeacherId(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
                      >
                        <option value="">-- Chọn một đồng nghiệp đổi tiết --</option>
                        {allStaff
                          .filter((s) => s.account.role === 'GV' && s.account.id !== currentUser?.id)
                          .map((t) => (
                            <option key={t.account.id} value={t.account.id}>
                              {t.account.name} ({t.account.position})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Môn dạy của GV B:</label>
                      <input
                        type="text"
                        required
                        value={subjectB}
                        onChange={(e) => setSubjectB(e.target.value)}
                        placeholder="VD: KHTN, Tiếng Anh..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phân hiệu:</label>
                      <select
                        value={branchNameB}
                        onChange={(e) => setBranchNameB(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
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
                        value={campusNameB}
                        onChange={(e) => setCampusNameB(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                      >
                        {ALL_CAMPUSES.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Lớp của GV B:</label>
                      <input
                        type="text"
                        required
                        value={classNameB}
                        onChange={(e) => setClassNameB(e.target.value)}
                        placeholder="VD: 7A, 8A..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Ngày đổi đối ứng:</label>
                      <input
                        type="date"
                        required
                        value={dateB}
                        onChange={(e) => setDateB(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Thứ:</label>
                      <input
                        type="text"
                        disabled
                        value={getDayOfWeekFromDate(dateB)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Buổi:</label>
                      <select
                        value={sessionB}
                        onChange={(e) => setSessionB(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="Sáng">Sáng</option>
                        <option value="Chiều">Chiều</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tiết dạy đối ứng:</label>
                      <input
                        type="text"
                        required
                        value={periodB}
                        onChange={(e) => setPeriodB(e.target.value)}
                        placeholder="Tiết 3, 4"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Lý do nghỉ / Thỏa thuận đổi tiết của GV B:</label>
                    <input
                      type="text"
                      value={reasonB}
                      onChange={(e) => setReasonB(e.target.value)}
                      placeholder="Ghi rõ thỏa thuận đổi tiết đối ứng hoặc lý do..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* CONDITIONAL SECTION: MAKEUP PLAN (FOR MODE TU_DAY_BU) */}
              {subMode === 'TU_DAY_BU' && (
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3 animate-fadeIn">
                  <div className="font-bold text-emerald-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kế hoạch Giáo viên A tự dạy bù:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Ngày dạy bù:</label>
                      <input
                        type="date"
                        required
                        value={makeupDate}
                        onChange={(e) => setMakeupDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Thứ:</label>
                      <input
                        type="text"
                        disabled
                        value={getDayOfWeekFromDate(makeupDate)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Buổi dạy bù:</label>
                      <select
                        value={makeupSession}
                        onChange={(e) => setMakeupSession(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="Chiều">Chiều</option>
                        <option value="Sáng">Sáng</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tiết dạy bù:</label>
                      <input
                        type="text"
                        required
                        value={makeupPeriod}
                        onChange={(e) => setMakeupPeriod(e.target.value)}
                        placeholder="Tiết 1, 2"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Vị trí phòng học dạy bù:</label>
                    <input
                      type="text"
                      value={makeupRoom}
                      onChange={(e) => setMakeupRoom(e.target.value)}
                      placeholder="VD: Phòng 9A, Phòng thực hành..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* CONDITIONAL SECTION: BGH ASSIGNMENT NOTICE (FOR MODE NHO_BGH_PHAN_CONG) */}
              {subMode === 'NHO_BGH_PHAN_CONG' && (
                <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 text-purple-900 space-y-2 animate-fadeIn">
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-700" />
                    <span>Hình thức: Nhờ Ban Giám Hiệu phân công giáo viên dạy thay</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Sau khi giáo viên nộp đơn, Hiệu trưởng Nguyễn Quốc Bảo sẽ trực tiếp xem xét lịch giảng dạy toàn trường và phân công giáo viên bộ môn tương ứng dạy thay, đồng thời hệ thống niêm yết công khai tên người dạy thay.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateSubModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Lên Hiệu Trưởng Phê Duyệt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BGH APPROVAL DIALOG (WITH OPTIONAL TEACHER ASSIGNMENT) */}
      {selectedRequestForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                <span>
                  {currentUser?.role === 'HT'
                    ? 'Ý Kiến Phê Duyệt Của Hiệu Trưởng'
                    : `Ý Kiến Phê Duyệt Của PHT (${getPhtAssignedBranch(currentUser) || ''})`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRequestForAction(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>Mã hồ sơ: <strong className="font-mono">{selectedRequestForAction.item.id}</strong></div>
                <div>
                  Người nộp: <strong>{selectedRequestForAction.item.userName || selectedRequestForAction.item.requesterName}</strong>
                </div>
                <div>
                  Phân hiệu: <strong>{selectedRequestForAction.item.branchName || selectedRequestForAction.item.branchNameA || 'Trụ sở chính Đồng Xuân'}</strong>
                </div>
                <div>
                  Quyết định:{' '}
                  <span
                    className={`font-bold ${
                      selectedRequestForAction.decision === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {selectedRequestForAction.decision === 'APPROVED' ? 'ĐỒNG Ý PHÊ DUYỆT' : 'TỪ CHỐI'}
                  </span>
                </div>
              </div>

              {/* If mode is NHO_BGH_PHAN_CONG, BGH assigns teacher */}
              {selectedRequestForAction.item.mode === 'NHO_BGH_PHAN_CONG' && selectedRequestForAction.decision === 'APPROVED' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Ban Giám hiệu chỉ định Giáo viên dạy thay:
                  </label>
                  <select
                    value={bghAssignTeacherId}
                    onChange={(e) => setBghAssignTeacherId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">-- Chọn giáo viên dạy thay --</option>
                    {allStaff
                      .filter((s) => s.account.role === 'GV' && s.account.id !== selectedRequestForAction.item.requesterId)
                      .map((t) => (
                        <option key={t.account.id} value={t.account.id}>
                          {t.account.name} ({t.account.position} - {t.account.campusName})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ý kiến chỉ đạo / phê duyệt:</label>
                <textarea
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForAction(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className={`px-5 py-2 rounded-xl text-white font-bold shadow transition ${
                    selectedRequestForAction.decision === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Ký Duyệt & Công Khai Toàn Trường
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
