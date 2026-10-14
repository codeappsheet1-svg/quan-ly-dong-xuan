import React, { useState, useMemo } from 'react';
import {
  UserAccount,
  WorkWorkflowItem,
  AssignedTask,
  TimetableSlot,
  PublicReminder,
  PublicCommendation,
  SchoolClass,
  LeaveRequest,
} from '../types/school';
import { storageService } from '../services/storageService';
import {
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowRight,
  Send,
  Building,
  BellRing,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Flame,
  ShieldCheck,
  FileText,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  Eye,
  CheckCheck,
} from 'lucide-react';

interface PersonalDashboardProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  classes: SchoolClass[];
  allStaff: { account: UserAccount }[];
  onSelectTab: (tab: string) => void;
  onRefreshData?: () => void;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  currentUser,
  activeSchoolYear,
  classes,
  allStaff,
  onSelectTab,
  onRefreshData,
}) => {
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>(() => {
    const dayIndex = new Date().getDay(); // 0: CN, 1: T2, ..., 6: T7
    switch (dayIndex) {
      case 1:
        return 'Thứ 2';
      case 2:
        return 'Thứ 3';
      case 3:
        return 'Thứ 4';
      case 4:
        return 'Thứ 5';
      case 5:
        return 'Thứ 6';
      case 6:
        return 'Thứ 7';
      default:
        return 'Thứ 2';
    }
  });

  const [activeTaskFilter, setActiveTaskFilter] = useState<'ALL' | 'PENDING' | 'EXECUTING' | 'DONE'>('PENDING');

  // Load datasets
  const workflows = useMemo(() => storageService.getWorkflows(activeSchoolYear), [activeSchoolYear]);
  const assignedTasks = useMemo(() => storageService.getAssignedTasks(activeSchoolYear), [activeSchoolYear]);
  const timetableSlots = useMemo(() => storageService.getTimetable(), []);
  const reminders = useMemo(() => storageService.getPublicReminders(activeSchoolYear), [activeSchoolYear]);
  const commendations = useMemo(() => storageService.getPublicCommendations(activeSchoolYear), [activeSchoolYear]);
  const leaves = useMemo(() => storageService.getLeaves(activeSchoolYear), [activeSchoolYear]);

  const isHT = currentUser?.role === 'HT';
  const isPHT = currentUser?.role === 'PHT';
  const canApprove = isHT || isPHT || currentUser?.role === 'GV_TIN_HOC';

  // 1. TÍNH TOÁN CÔNG VIỆC CẦN XỬ LÝ CỦA NGƯỜI DÙNG
  // - Nếu là HT/PHT: Có các công việc cấp dưới gửi lên chờ duyệt (B1_CHO_HT_DUYET, B4_CHO_HT_DANH_GIA, đơn nghỉ phép, sửa chữa)
  // - Đối với GV/NV thông thường: Các công việc mình đang thực hiện (B3_DANG_THUC_HIEN), cần nộp báo cáo (B4), hoặc bị yêu cầu sửa (B2_YEU_CAU_CHINH_SUA), hoặc nhiệm vụ được BGH giao
  const myWorkflows = useMemo(() => {
    if (!currentUser) return [];
    return workflows.filter((w) => w.creatorId === currentUser.id);
  }, [workflows, currentUser]);

  const pendingApprovalsForManagement = useMemo(() => {
    if (!canApprove) return [];
    return workflows.filter((w) => w.status === 'B1_CHO_HT_DUYET' || w.status === 'B4_CHO_HT_DANH_GIA');
  }, [workflows, canApprove]);

  const myAssignedTasks = useMemo(() => {
    if (!currentUser) return [];
    return assignedTasks.filter((t) => t.targetStaffId === currentUser.id);
  }, [assignedTasks, currentUser]);

  const myPendingTasksCount = useMemo(() => {
    let count = 0;
    if (canApprove) {
      count += pendingApprovalsForManagement.length;
    }
    // Công việc của cá nhân đang thực hiện hoặc cần sửa
    count += myWorkflows.filter(
      (w) => w.status === 'B3_DANG_THUC_HIEN' || w.status === 'B2_YEU_CAU_CHINH_SUA' || w.status === 'B2_HT_DA_DUYET'
    ).length;
    // Nhiệm vụ giao việc chưa hoàn thành
    count += myAssignedTasks.filter((t) => t.executionStatus !== 'HOAN_THANH').length;
    return count;
  }, [canApprove, pendingApprovalsForManagement, myWorkflows, myAssignedTasks]);

  // 2. LỊCH DẠY / THỜI KHÓA BIỂU CỦA NGƯỜI DÙNG HIỆN TẠI
  // Tìm các tiết mà giáo viên dạy trong TKB
  const myTeachingSlots = useMemo(() => {
    if (!currentUser) return [];
    return timetableSlots.filter((slot) => {
      // Khớp theo teacherId hoặc theo tên
      const matchId = slot.teacherId === currentUser.id;
      const matchName =
        slot.teacherName &&
        currentUser.name &&
        slot.teacherName.toLowerCase().trim() === currentUser.name.toLowerCase().trim();
      const matchSub =
        slot.substituteTeacherName &&
        currentUser.name &&
        slot.substituteTeacherName.toLowerCase().trim() === currentUser.name.toLowerCase().trim();
      return matchId || matchName || matchSub;
    });
  }, [timetableSlots, currentUser]);

  // Lọc lịch dạy theo ngày trong tuần đã chọn
  const todayScheduleSlots = useMemo(() => {
    return myTeachingSlots
      .filter((s) => s.dayOfWeek === selectedDayOfWeek)
      .sort((a, b) => a.period - b.period);
  }, [myTeachingSlots, selectedDayOfWeek]);

  // 3. THÔNG BÁO CÁ NHÂN MỚI NHẤT
  // Gồm:
  // - Thông báo nhắc nhở gửi riêng hoặc toàn trường
  // - Tuyên dương khen thưởng liên quan đến cá nhân
  // - Phê duyệt / Nhận xét của Hiệu trưởng đối với hồ sơ báo cáo của cá nhân
  const personalNotifications = useMemo(() => {
    if (!currentUser) return [];
    const notifs: Array<{
      id: string;
      type: 'REMINDER' | 'COMMENDATION' | 'WORKFLOW_APPROVED' | 'WORKFLOW_FEEDBACK' | 'LEAVE_STATUS';
      title: string;
      content: string;
      date: string;
      timeAgo?: string;
      sender: string;
      severity?: 'INFO' | 'WARNING' | 'SUCCESS';
      badge: string;
      actionLinkTab?: string;
      targetId?: string;
    }> = [];

    // Nhắc nhở
    reminders.forEach((r) => {
      const isForMe =
        r.targetId === currentUser.id ||
        r.targetUserId === currentUser.id ||
        (r.targetName && r.targetName.toLowerCase() === currentUser.name.toLowerCase()) ||
        r.scope === 'SCHOOL';
      if (isForMe) {
        notifs.push({
          id: 'rem_' + r.id,
          type: 'REMINDER',
          title: r.title,
          content: r.content,
          date: r.date,
          sender: r.remindedBy || 'Ban Giám Hiệu',
          severity: 'WARNING',
          badge: r.reason || 'Nhắc nhở nề nếp',
          actionLinkTab: 'notices_honors',
        });
      }
    });

    // Khen thưởng
    commendations.forEach((c) => {
      const isForMe =
        c.targetId === currentUser.id ||
        (c.targetName && c.targetName.toLowerCase() === currentUser.name.toLowerCase());
      if (isForMe) {
        notifs.push({
          id: 'com_' + c.id,
          type: 'COMMENDATION',
          title: c.title,
          content: c.description,
          date: c.date,
          sender: 'Hiệu trưởng Nguyễn Quốc Bảo',
          severity: 'SUCCESS',
          badge: c.rewardType || 'Khen thưởng',
          actionLinkTab: 'notices_honors',
        });
      }
    });

    // Phản hồi quy trình từ HT
    myWorkflows.forEach((w) => {
      if (w.status === 'B2_HT_DA_DUYET' && w.approvedAt) {
        notifs.push({
          id: 'wf_app_' + w.id,
          type: 'WORKFLOW_APPROVED',
          title: `Hiệu trưởng đã phê duyệt: "${w.title}"`,
          content: w.approvalDirectives || 'Kế hoạch đã được Hiệu trưởng phê duyệt. Bạn có thể tiến hành thực hiện ngay.',
          date: w.approvedAt.slice(0, 10),
          sender: w.approvedByName || 'Hiệu trưởng',
          severity: 'INFO',
          badge: 'Đã duyệt kế hoạch (Bước 2)',
          actionLinkTab: 'work_workflow',
        });
      } else if (w.status === 'B2_YEU_CAU_CHINH_SUA') {
        notifs.push({
          id: 'wf_req_' + w.id,
          type: 'WORKFLOW_APPROVED',
          title: `Yêu cầu chỉnh sửa đề xuất: "${w.title}"`,
          content: w.approvalDirectives || 'Vui lòng bổ sung thêm thông tin theo yêu cầu của Hiệu trưởng.',
          date: w.updatedAt.slice(0, 10),
          sender: w.approvedByName || 'Hiệu trưởng',
          severity: 'WARNING',
          badge: 'Cần sửa đổi (Bước 2)',
          actionLinkTab: 'work_workflow',
        });
      } else if (w.status === 'B5_HT_DA_DANH_GIA' && w.evaluatedAt) {
        notifs.push({
          id: 'wf_eval_' + w.id,
          type: 'WORKFLOW_FEEDBACK',
          title: `Hiệu trưởng đã nhận xét & chấm điểm: "${w.title}"`,
          content: `Điểm: ${w.principalScore}/10 (${w.principalRating}) - Nhận xét: "${w.principalFeedback}"`,
          date: w.evaluatedAt.slice(0, 10),
          sender: w.evaluatedByName || 'Hiệu trưởng',
          severity: 'SUCCESS',
          badge: w.isPublicAnnounced ? 'Đã công khai toàn trường' : 'Lưu nội bộ cá nhân',
          actionLinkTab: 'work_workflow',
        });
      }
    });

    // Đơn nghỉ phép của cá nhân
    leaves
      .filter((l) => l.userId === currentUser.id)
      .slice(0, 3)
      .forEach((l) => {
        notifs.push({
          id: 'leave_' + l.id,
          type: 'LEAVE_STATUS',
          title: `Đơn xin nghỉ phép (${l.leaveType}) từ ngày ${l.startDate} đến ${l.endDate}`,
          content: `Trạng thái: ${l.status}. ${l.approvalComment ? `Nhận xét BGH: ${l.approvalComment}` : ''}`,
          date: l.createdAt.slice(0, 10),
          sender: l.approvedBy || 'PHT phụ trách',
          severity: l.status === 'Đã phê duyệt' ? 'SUCCESS' : l.status === 'Từ chối' ? 'WARNING' : 'INFO',
          badge: l.status,
          actionLinkTab: 'leaves',
        });
      });

    // Sắp xếp ngày mới nhất lên đầu
    return notifs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  }, [currentUser, reminders, commendations, myWorkflows, leaves]);

  // Thông tin lớp chủ nhiệm nếu có (Chỉ tính lớp ĐANG chủ nhiệm, loại bỏ hoàn toàn lớp cũ)
  const homeroomClass = useMemo(() => {
    if (!currentUser) return null;
    return classes.find(
      (c) =>
        c.status !== 'INACTIVE' &&
        c.homeroomTeacherId === currentUser.id &&
        !(c.previousHomeroomTeacherIds && c.previousHomeroomTeacherIds.includes(currentUser.id) && c.homeroomTeacherId !== currentUser.id)
    );
  }, [classes, currentUser]);

  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div className="space-y-6">
      {/* Top Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-lg border-2 border-white/20">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser?.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  currentUser?.name.slice(0, 2).toUpperCase() || 'CB'
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px]">
                ✓
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {currentUser?.position || 'Cán bộ'} ({currentUser?.role})
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Năm học {activeSchoolYear}
                </span>
                {homeroomClass && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    GVCN Lớp {homeroomClass.name} ({homeroomClass.totalStudents} HS)
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Xin chào, {currentUser?.name || 'Đồng chí'}!
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>📍 {currentUser?.branchName || 'Trường TH & THCS Đồng Xuân'}</span>
                <span>•</span>
                <span>Điểm trường: {currentUser?.campusName || 'Trụ sở chính'}</span>
                <span>•</span>
                <span className="font-mono text-indigo-300">Mã CB: {currentUser?.id}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 lg:self-center">
            <button
              onClick={() => onSelectTab('work_workflow')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Báo cáo công việc (B1)
            </button>
            <button
              onClick={() => onSelectTab('profile_az')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-emerald-400" /> Hồ sơ 52 Cột (A-AZ)
            </button>
            <button
              onClick={() => onSelectTab('leaves')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-amber-400" /> Xin nghỉ phép
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-indigo-900/50">
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-3.5 border border-slate-700/60">
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> Công việc cần xử lý
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {myPendingTasksCount}
              <span className="text-xs font-normal text-slate-400 ml-1.5">hồ sơ</span>
            </div>
            <div className="text-[11px] text-amber-300/90 mt-0.5 truncate">
              {canApprove ? `${pendingApprovalsForManagement.length} việc cấp dưới chờ duyệt` : 'Đang thực hiện / chờ nộp'}
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-3.5 border border-slate-700/60">
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-400" /> Lịch giảng dạy
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {todayScheduleSlots.length}
              <span className="text-xs font-normal text-slate-400 ml-1.5">tiết ({selectedDayOfWeek})</span>
            </div>
            <div className="text-[11px] text-blue-300/90 mt-0.5 truncate">
              Tổng {myTeachingSlots.length} tiết / tuần học
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-3.5 border border-slate-700/60">
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-emerald-400" /> Thông báo cá nhân
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {personalNotifications.length}
              <span className="text-xs font-normal text-slate-400 ml-1.5">tin mới</span>
            </div>
            <div className="text-[11px] text-emerald-300/90 mt-0.5 truncate">
              Ý kiến BGH, khen thưởng & nề nếp
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-3.5 border border-slate-700/60">
            <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400" /> Hồ sơ hoàn thành
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {myWorkflows.filter((w) => w.status === 'B5_HT_DA_DANH_GIA').length}
              <span className="text-xs font-normal text-slate-400 ml-1.5">nhiệm vụ</span>
            </div>
            <div className="text-[11px] text-purple-300/90 mt-0.5 truncate">
              Đã được HT nhận xét & nghiệm thu
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* CỘT TRÁI (7 cols): CÔNG VIỆC CẦN XỬ LÝ & TIẾN ĐỘ THỰC HIỆN */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Công việc đang chờ xử lý */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Danh Sách Công Việc Đang Chờ Xử Lý
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Các nhiệm vụ thuộc quy trình 6 bước cần thực hiện, nộp báo cáo kết quả hoặc chờ duyệt
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setActiveTaskFilter('PENDING')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    activeTaskFilter === 'PENDING'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cần làm ({myPendingTasksCount})
                </button>
                <button
                  onClick={() => setActiveTaskFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    activeTaskFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({myWorkflows.length + (canApprove ? pendingApprovalsForManagement.length : 0)})
                </button>
              </div>
            </div>

            {/* List of Tasks */}
            <div className="mt-4 space-y-3">
              {/* Management pending approvals if HT/PHT */}
              {canApprove && pendingApprovalsForManagement.length > 0 && (
                <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      Hồ sơ cấp dưới nộp đang chờ Ban Giám Hiệu phê duyệt & nhận xét:
                    </span>
                    <button
                      onClick={() => onSelectTab('work_workflow')}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                    >
                      Xử lý ngay ({pendingApprovalsForManagement.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-amber-200/60">
                    {pendingApprovalsForManagement.slice(0, 3).map((w) => (
                      <div key={w.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span className="font-mono text-[11px] text-amber-800">{w.code}</span>
                            <span>{w.title}</span>
                          </div>
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            Người nộp: <strong>{w.creatorName}</strong> ({w.creatorPosition}) • {w.campusName}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded font-bold text-[10px] shrink-0 ml-2">
                          {w.status === 'B1_CHO_HT_DUYET' ? 'Chờ HT duyệt đề xuất' : 'Chờ HT thẩm định KQ'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal work workflows */}
              {myWorkflows.length === 0 && myAssignedTasks.length === 0 && (!canApprove || pendingApprovalsForManagement.length === 0) ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-slate-700 font-bold text-sm">Hiện tại bạn không có công việc nào bị tồn đọng!</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Bạn có thể nộp đề xuất kế hoạch mới cho tuần hoặc tháng tới.
                  </p>
                  <button
                    onClick={() => onSelectTab('work_workflow')}
                    className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" /> Nộp Báo Cáo Đề Xuất (Bước 1)
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myWorkflows
                    .filter((w) => {
                      if (activeTaskFilter === 'PENDING') {
                        return (
                          w.status === 'B3_DANG_THUC_HIEN' ||
                          w.status === 'B2_YEU_CAU_CHINH_SUA' ||
                          w.status === 'B2_HT_DA_DUYET' ||
                          w.status === 'B1_CHO_HT_DUYET'
                        );
                      }
                      return true;
                    })
                    .slice(0, 5)
                    .map((w) => {
                      const isExecuting = w.status === 'B3_DANG_THUC_HIEN';
                      const isNeedsFix = w.status === 'B2_YEU_CAU_CHINH_SUA';
                      const isApproved = w.status === 'B2_HT_DA_DUYET';
                      const isEvaluating = w.status === 'B4_CHO_HT_DANH_GIA';
                      const isDone = w.status === 'B5_HT_DA_DANH_GIA';

                      return (
                        <div
                          key={w.id}
                          className="p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 transition space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                  {w.code}
                                </span>
                                <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                                  {w.title}
                                </h3>
                              </div>
                              <p className="text-slate-500 text-xs mt-1 line-clamp-1">{w.proposalContent}</p>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 border ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : isExecuting
                                  ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                  : isNeedsFix
                                  ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                                  : isApproved
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                            >
                              {isDone
                                ? `Đã xong (${w.principalScore}đ)`
                                : isExecuting
                                ? `Đang làm (${w.executionProgress}%)`
                                : isNeedsFix
                                ? 'Cần sửa lại'
                                : isApproved
                                ? 'Đã duyệt • Bắt đầu'
                                : isEvaluating
                                ? 'Chờ HT chấm'
                                : 'Chờ HT duyệt'}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>Hạn chót: <strong className="text-slate-700">{w.deadline}</strong></span>
                              <span>Tiến độ: <strong className="text-indigo-600">{w.executionProgress}%</strong></span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  w.executionProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${w.executionProgress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Action direct buttons */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                            <span className="text-[11px] text-slate-500">
                              Tuần {w.cycleWeek} • Tháng {w.cycleMonth}
                            </span>
                            <button
                              onClick={() => onSelectTab('work_workflow')}
                              className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              Chi tiết quy trình <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Lịch Giảng Dạy & Thời Khóa Biểu Cá Nhân */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Lịch Giảng Dạy & Thời Khóa Biểu Cá Nhân
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Thời khóa biểu chính khóa và các tiết dạy thay được phân công
                </p>
              </div>

              <button
                onClick={() => onSelectTab('schedule')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Xem toàn trường <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Day Selector Pill Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 my-4">
              {daysOfWeek.map((day) => {
                const count = myTeachingSlots.filter((s) => s.dayOfWeek === day).length;
                const isSelected = selectedDayOfWeek === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDayOfWeek(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{day}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Slots Timeline for selected day */}
            {todayScheduleSlots.length === 0 ? (
              <div className="text-center py-8 bg-blue-50/50 rounded-2xl border border-blue-100">
                <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-slate-700 font-bold text-xs sm:text-sm">
                  {selectedDayOfWeek} bạn không có tiết dạy trên thời khóa biểu!
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Bạn có thể dành thời gian này để chấm bài, soạn giáo án hoặc tham gia họp tổ chuyên môn.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todayScheduleSlots.map((slot) => {
                  const isMorning = slot.session === 'Sáng' || slot.period <= 5;
                  return (
                    <div
                      key={slot.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 transition relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">
                          Tiết {slot.period} ({slot.session || (slot.period <= 5 ? 'Sáng' : 'Chiều')})
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          Phòng: <strong>{slot.room || 'Phòng học chính'}</strong>
                        </span>
                      </div>

                      <div className="font-black text-sm text-slate-900 mt-1">{slot.subject}</div>

                      <div className="flex items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
                        <span className="font-bold text-slate-800">Lớp: {slot.className}</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                          📍 {slot.campusName}
                        </span>
                      </div>

                      {slot.isModified && (
                        <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 p-1 rounded font-semibold border border-amber-200">
                          ⚠️ Đổi tiết / Dạy thay: {slot.modificationType}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI (5 cols): THÔNG BÁO CÁ NHÂN & TIN MỚI TỪ BGH */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Thông báo cá nhân mới nhất */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-indigo-600" />
                  Thông Báo Cá Nhân Mới Nhất
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Phản hồi từ Hiệu trưởng, khen thưởng, nhắc nhở & chế độ chính sách
                </p>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                {personalNotifications.length} tin
              </span>
            </div>

            {/* Notification items */}
            {personalNotifications.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 my-4">
                <BellRing className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-bold text-xs">Chưa có thông báo cá nhân mới nào!</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Mọi thông báo chỉ đạo của BGH sẽ được chuyển đến bạn tại đây.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {personalNotifications.map((notif) => {
                  const isWarning = notif.severity === 'WARNING';
                  const isSuccess = notif.severity === 'SUCCESS';

                  return (
                    <div
                      key={notif.id}
                      className={`p-3.5 rounded-2xl border transition space-y-2 ${
                        isWarning
                          ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-50'
                          : isSuccess
                          ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50'
                          : 'bg-slate-50 border-slate-200 hover:bg-indigo-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isSuccess ? (
                            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-200/70 text-emerald-900'
                                : isWarning
                                ? 'bg-rose-200/70 text-rose-900'
                                : 'bg-indigo-100 text-indigo-900'
                            }`}
                          >
                            {notif.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{notif.date}</span>
                      </div>

                      <div className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {notif.title}
                      </div>

                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                        {notif.content}
                      </p>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50 text-[11px]">
                        <span className="text-slate-500">
                          Người gửi: <strong className="text-slate-700">{notif.sender}</strong>
                        </span>
                        {notif.actionLinkTab && (
                          <button
                            onClick={() => onSelectTab(notif.actionLinkTab!)}
                            className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                          >
                            Xem chi tiết <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card: Lớp chủ nhiệm & Sĩ số nếu là GVCN */}
          {homeroomClass && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  Công tác chủ nhiệm Lớp {homeroomClass.name}
                </span>
                <span className="bg-blue-200/80 text-blue-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {homeroomClass.totalStudents} Học sinh
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white/80 rounded-xl border border-blue-100">
                  <div className="text-slate-500 text-[11px]">Học sinh Nữ</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {homeroomClass.femaleStudents} em
                  </div>
                </div>
                <div className="p-2.5 bg-white/80 rounded-xl border border-blue-100">
                  <div className="text-slate-500 text-[11px]">HS Dân tộc thiểu số</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {homeroomClass.ethnicStudents || 0} em
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onSelectTab('classes')}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-sm"
                >
                  <User className="w-3.5 h-3.5" /> Danh sách học sinh
                </button>
                <button
                  onClick={() => onSelectTab('student_leaves')}
                  className="flex-1 py-2 bg-white hover:bg-slate-50 text-blue-900 font-bold rounded-xl text-xs transition border border-blue-200 flex items-center justify-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Điểm danh & Nghỉ
                </button>
              </div>
            </div>
          )}

          {/* Lời nhắc bản quyền Hiệu trưởng */}
          <div className="p-4 bg-slate-900 text-slate-300 rounded-2xl text-[11px] leading-relaxed border border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Hệ thống Quản lý nội bộ trường học</span>, do Hiệu trưởng{' '}
              <strong className="text-white">Nguyễn Quốc Bảo</strong> tự xây dựng. Mọi số liệu công việc và lịch dạy
              được bảo mật và phục vụ công tác điều hành nội bộ nhà trường.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
