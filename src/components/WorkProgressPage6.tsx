import React, { useState, useMemo } from 'react';
import {
  UserAccount,
  AssignedTask,
  WorkProgressEvaluation,
  StaffTierCategory,
} from '../types/school';
import { BRANCHES_DATA } from '../data/initialData';
import { storageService } from '../services/storageService';
import { getPhtAssignedBranch } from '../utils/permissionUtils';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  BellRing,
  Filter,
  Search,
  PlusCircle,
  FileCheck2,
  Calendar,
  Building,
  GraduationCap,
  Users,
  Send,
  ExternalLink,
  ThumbsUp,
  AlertCircle,
  TrendingUp,
  Eye,
  FileText,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface WorkProgressPage6Props {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  allStaff: { account: UserAccount }[];
  onRefreshData?: () => void;
}

export const WorkProgressPage6: React.FC<WorkProgressPage6Props> = ({
  currentUser,
  activeSchoolYear,
  allStaff,
  onRefreshData,
}) => {
  // Navigation tabs in Page 6
  type Page6Tab = 'public_board' | 'individual_tasks' | 'period_progress' | 'assign_and_evaluate';
  const [activeTab, setActiveTab] = useState<Page6Tab>('public_board');

  // Datasets from storageService
  const [tasks, setTasks] = useState<AssignedTask[]>(() =>
    storageService.getAssignedTasks(activeSchoolYear)
  );
  const [evaluations, setEvaluations] = useState<WorkProgressEvaluation[]>(() =>
    storageService.getWorkProgressEvaluations(activeSchoolYear)
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | StaffTierCategory>('ALL');
  const [periodTypeFilter, setPeriodTypeFilter] = useState<'ALL' | 'TUAN' | 'THANG'>('ALL');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<'ALL' | 'KHEN' | 'NHAC_NHO'>('ALL');
  const [selectedPeriodValue, setSelectedPeriodValue] = useState<number>(4);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [showTaskActionModal, setShowTaskActionModal] = useState(false);
  const [selectedTaskForAction, setSelectedTaskForAction] = useState<AssignedTask | null>(null);
  const [actionType, setActionType] = useState<'KHEN' | 'NHAC_NHO'>('KHEN');
  const [actionFeedback, setActionFeedback] = useState('');
  const [actionIsPublic, setActionIsPublic] = useState(true);

  // Modal: Tạo khen/nhắc nhở định kỳ theo tuần/tháng
  const [showPeriodicModal, setShowPeriodicModal] = useState(false);
  const [periodicTargetStaffId, setPeriodicTargetStaffId] = useState(allStaff[0]?.account.id || '');
  const [periodicType, setPeriodicType] = useState<'TUAN' | 'THANG'>('TUAN');
  const [periodicValue, setPeriodicValue] = useState(4);
  const [periodicFeedbackType, setPeriodicFeedbackType] = useState<'KHEN' | 'NHAC_NHO'>('KHEN');
  const [periodicFeedbackText, setPeriodicFeedbackText] = useState('');

  // Modal: Giao việc mới (HT / PHT)
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [assignTargetStaffId, setAssignTargetStaffId] = useState(allStaff[0]?.account.id || '');
  const [assignCriteria, setAssignCriteria] = useState('Chuyên đề chuyên môn & Hội giảng');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDescription, setAssignDescription] = useState('');
  const [assignDeadline, setAssignDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [assignPriority, setAssignPriority] = useState<'KHAN_CAP' | 'CAO' | 'BINH_THUONG'>('CAO');

  // Modal: Nghiệm thu & Chấm điểm nhiệm vụ
  const [showEvaluateTaskModal, setShowEvaluateTaskModal] = useState(false);
  const [taskToEvaluate, setTaskToEvaluate] = useState<AssignedTask | null>(null);
  const [evalScore, setEvalScore] = useState<number>(9);
  const [evalFeedbackText, setEvalFeedbackText] = useState('');
  const [evalIsConfirmed, setEvalIsConfirmed] = useState(true);

  // Modal: GV/NV nộp kết quả & upload minh chứng
  const [showSubmitResultModal, setShowSubmitResultModal] = useState(false);
  const [taskToSubmit, setTaskToSubmit] = useState<AssignedTask | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionDriveUrl, setSubmissionDriveUrl] = useState('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('');

  // Permission checks
  const isHT = currentUser?.role === 'HT' || currentUser?.role === 'GV_TIN_HOC';
  const isPHT = currentUser?.role === 'PHT';
  const canManage = isHT || isPHT;
  const phtBranch = getPhtAssignedBranch(currentUser);

  // Refresh helper
  const reloadData = () => {
    setTasks(storageService.getAssignedTasks(activeSchoolYear));
    setEvaluations(storageService.getWorkProgressEvaluations(activeSchoolYear));
    onRefreshData?.();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Staff available for PHT (restricted to their branch) vs HT (all)
  const assignableStaff = useMemo(() => {
    if (isHT) return allStaff;
    if (isPHT && phtBranch) {
      return allStaff.filter((s) =>
        s.account.branchName?.toLowerCase().includes(phtBranch.toLowerCase())
      );
    }
    return allStaff;
  }, [allStaff, isHT, isPHT, phtBranch]);

  // Overall Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.executionStatus === 'HOAN_THANH').length;
  const overdueTasks = tasks.filter((t) => {
    const today = new Date().toISOString().split('T')[0];
    return (
      t.executionStatus === 'QUA_HAN' ||
      (t.executionStatus !== 'HOAN_THANH' && t.deadline < today)
    );
  }).length;
  const inProgressTasks = tasks.filter(
    (t) => t.executionStatus === 'DANG_THUC_HIEN' || t.executionStatus === 'CHO_XAC_NHAN'
  ).length;

  const totalPraises = evaluations.filter((e) => e.feedbackType === 'KHEN').length;
  const totalReminders = evaluations.filter((e) => e.feedbackType === 'NHAC_NHO').length;
  const onTimeRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Filtered Public Board Evaluations
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((ev) => {
      if (branchFilter !== 'ALL' && !ev.branchName.toLowerCase().includes(branchFilter.toLowerCase())) {
        return false;
      }
      if (tierFilter !== 'ALL' && ev.staffCategory !== tierFilter) {
        return false;
      }
      if (periodTypeFilter !== 'ALL' && ev.periodType !== periodTypeFilter) {
        return false;
      }
      if (feedbackTypeFilter !== 'ALL' && ev.feedbackType !== feedbackTypeFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        return (
          ev.staffName.toLowerCase().includes(s) ||
          ev.feedbackContent.toLowerCase().includes(s) ||
          ev.evaluatedBy.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [evaluations, branchFilter, tierFilter, periodTypeFilter, feedbackTypeFilter, searchTerm]);

  // Filtered Assigned Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (branchFilter !== 'ALL' && !t.targetBranchName.toLowerCase().includes(branchFilter.toLowerCase())) {
        return false;
      }
      if (tierFilter !== 'ALL' && t.targetStaffCategory !== tierFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        return (
          t.targetStaffName.toLowerCase().includes(s) ||
          t.taskTitle.toLowerCase().includes(s) ||
          t.competitionCriteria.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [tasks, branchFilter, tierFilter, searchTerm]);

  // Praise / Remind for specific task
  const handleOpenTaskAction = (task: AssignedTask, type: 'KHEN' | 'NHAC_NHO') => {
    setSelectedTaskForAction(task);
    setActionType(type);
    if (type === 'KHEN') {
      setActionFeedback(
        `Khen ngợi đồng chí ${task.targetStaffName} đã giải quyết xuất sắc nhiệm vụ "${task.taskTitle}" đúng tiến độ, chất lượng đạt yêu cầu cao.`
      );
    } else {
      setActionFeedback(
        `Nhắc nhở đồng chí ${task.targetStaffName} về tiến độ nhiệm vụ "${task.taskTitle}". Đề nghị khẩn trương đẩy nhanh tiến độ và nộp minh chứng nghiệm thu.`
      );
    }
    setActionIsPublic(true);
    setShowTaskActionModal(true);
  };

  const handleSubmitTaskAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForAction || !actionFeedback.trim()) return;

    try {
      storageService.evaluateStaffForSpecificTask(
        selectedTaskForAction.id,
        actionType,
        actionFeedback,
        {
          name: currentUser?.name || 'Hiệu trưởng Nguyễn Quốc Bảo',
          role: currentUser?.role === 'PHT' ? 'Phó Hiệu trưởng' : 'Hiệu trưởng',
        },
        actionIsPublic,
        activeSchoolYear
      );

      reloadData();
      setShowTaskActionModal(false);
      showToast(
        actionType === 'KHEN'
          ? `✓ Đã gửi khen thưởng đồng chí ${selectedTaskForAction.targetStaffName} và công khai trên Trang 6!`
          : `⚠️ Đã gửi nhắc nhở đồng chí ${selectedTaskForAction.targetStaffName} và ghi nhận tiến độ!`
      );
    } catch (err: any) {
      alert(err.message || 'Lỗi xử lý đánh giá');
    }
  };

  // Submit Periodic Praise/Reminder
  const handleSubmitPeriodicEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodicFeedbackText.trim()) return;

    const staff = allStaff.find((s) => s.account.id === periodicTargetStaffId)?.account;
    if (!staff) return;

    const isTH = staff.campusName.includes('TH ') || staff.position.includes('Tiểu học');
    const isNV = staff.role === 'NV' || staff.role === 'NV_HD_BV' || staff.position.includes('Nhân viên');
    const staffCat: StaffTierCategory = isNV ? 'NHAN_VIEN' : isTH ? 'GV_TH' : 'GV_THCS';

    storageService.addWorkProgressEvaluation(
      {
        schoolYear: activeSchoolYear,
        periodType: periodicType,
        periodValue: periodicValue,
        staffId: staff.id,
        staffName: staff.name,
        staffCategory: staffCat,
        branchName: staff.branchName,
        totalTasksInPeriod: 3,
        completedOnTimeTasks: periodicFeedbackType === 'KHEN' ? 3 : 1,
        overdueTasks: periodicFeedbackType === 'NHAC_NHO' ? 2 : 0,
        progressStatus: periodicFeedbackType === 'KHEN' ? 'XUAT_SAC' : 'CHAM_TIEN_DO',
        feedbackType: periodicFeedbackType,
        feedbackContent: periodicFeedbackText,
        isPublicOnPage6: true,
        evaluatedBy: currentUser?.name
          ? `${currentUser.name} (${currentUser.position})`
          : 'Thầy Nguyễn Quốc Bảo (Hiệu trưởng)',
      },
      activeSchoolYear
    );

    reloadData();
    setShowPeriodicModal(false);
    setPeriodicFeedbackText('');
    showToast(`✓ Đã đăng công khai đánh giá tiến độ ${periodicType === 'TUAN' ? `Tuần ${periodicValue}` : `Tháng ${periodicValue}`} trên Trang 6!`);
  };

  // Auto scan and evaluate all staff for current period
  const handleAutoScanPeriod = () => {
    const newItems = storageService.autoEvaluatePeriodProgress(
      'TUAN',
      selectedPeriodValue,
      {
        name: currentUser?.name || 'Hiệu trưởng Nguyễn Quốc Bảo',
        role: currentUser?.position || 'Ban Giám hiệu',
      },
      activeSchoolYear
    );

    reloadData();
    showToast(`✓ Đã quét tiến độ Tuần ${selectedPeriodValue}: Tự động khen ngợi ${newItems.filter((i) => i.feedbackType === 'KHEN').length} đ/c và nhắc nhở ${newItems.filter((i) => i.feedbackType === 'NHAC_NHO').length} đ/c!`);
  };

  // Assign New Task (HT / PHT)
  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim() || !assignDescription.trim()) return;

    const targetStaff = allStaff.find((s) => s.account.id === assignTargetStaffId)?.account;
    if (!targetStaff) return;

    const isTH = targetStaff.campusName.includes('TH ') || targetStaff.position.includes('Tiểu học');
    const isNV = targetStaff.role === 'NV' || targetStaff.role === 'NV_HD_BV' || targetStaff.position.includes('Nhân viên');
    const staffCat: StaffTierCategory = isNV ? 'NHAN_VIEN' : isTH ? 'GV_TH' : 'GV_THCS';

    storageService.addAssignedTask(
      {
        schoolYear: activeSchoolYear,
        assignerId: currentUser?.id || 'HT_01',
        assignerName: currentUser?.name || 'Thầy Nguyễn Quốc Bảo',
        assignerRole: (currentUser?.role as any) || 'HT',
        targetStaffId: targetStaff.id,
        targetStaffName: targetStaff.name,
        targetStaffRole: (targetStaff.role as any) || 'GV',
        targetStaffCategory: staffCat,
        targetBranchName: targetStaff.branchName,
        targetCampusName: targetStaff.campusName,
        competitionCriteria: assignCriteria,
        taskTitle: assignTitle,
        taskDescription: assignDescription,
        deadline: assignDeadline,
        priority: assignPriority,
        executionStatus: 'CHUA_THUC_HIEN',
      },
      activeSchoolYear
    );

    reloadData();
    setShowAssignTaskModal(false);
    setAssignTitle('');
    setAssignDescription('');
    showToast(`✓ Đã giao việc thành công cho ${targetStaff.name}. Hạn chót: ${assignDeadline}`);
  };

  // Submit Result & Evidence (GV / NV)
  const handleSubmitResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToSubmit) return;

    const evidenceFiles = submissionFileUrl
      ? [{ name: submissionFileName || 'Minh_chung_nhiem_vu.pdf', url: submissionFileUrl, type: 'application/pdf' }]
      : [];

    storageService.submitTaskResult(
      taskToSubmit.id,
      {
        submissionNotes,
        driveUrl: submissionDriveUrl || undefined,
        evidenceFiles,
      },
      activeSchoolYear
    );

    reloadData();
    setShowSubmitResultModal(false);
    setSubmissionNotes('');
    setSubmissionDriveUrl('');
    setSubmissionFileUrl('');
    showToast(`✓ Đã nộp kết quả và minh chứng nhiệm vụ. Chờ BGH nghiệm thu chấm điểm.`);
  };

  // Evaluate & Score Task (HT / PHT)
  const handleEvaluateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToEvaluate) return;

    storageService.evaluateAssignedTask(
      taskToEvaluate.id,
      {
        score: evalScore,
        evaluationFeedback: evalFeedbackText || (evalIsConfirmed ? 'Nghiệm thu đạt yêu cầu, hoàn thành tốt.' : 'Yêu cầu làm lại.'),
        isConfirmed: evalIsConfirmed,
        evaluatorName: currentUser?.name || 'Thầy Nguyễn Quốc Bảo (HT)',
      },
      activeSchoolYear
    );

    reloadData();
    setShowEvaluateTaskModal(false);
    setEvalFeedbackText('');
    showToast(
      evalIsConfirmed
        ? `✓ Đã nghiệm thu & chấm ${evalScore}/10 điểm. Hệ thống đã tự động chuyển điểm sang Sổ Thi Đua!`
        : `⚠️ Đã trả lại nhiệm vụ yêu cầu bổ sung minh chứng.`
    );
  };

  // Recharts Chart Data (Tiến độ hoàn thành theo 4 Phân hiệu)
  const branchProgressData = useMemo(() => {
    return BRANCHES_DATA.map((b) => {
      const bTasks = tasks.filter((t) => t.targetBranchName.toLowerCase().includes(b.name.toLowerCase()));
      const completed = bTasks.filter((t) => t.executionStatus === 'HOAN_THANH').length;
      const overdue = bTasks.filter((t) => {
        const today = new Date().toISOString().split('T')[0];
        return t.executionStatus === 'QUA_HAN' || (t.executionStatus !== 'HOAN_THANH' && t.deadline < today);
      }).length;
      const inProgress = bTasks.length - completed - overdue;

      const shortName = b.name
        .replace('Phân hiệu TH và THCS ', '')
        .replace('Phân hiệu TH ', '')
        .replace('Trụ sở chính ', '');

      return {
        name: shortName,
        fullName: b.name,
        'Đúng Hạn (Khen)': completed,
        'Chậm Tiến Độ': overdue,
        'Đang Thực Hiện': inProgress > 0 ? inProgress : 0,
        total: bTasks.length,
      };
    });
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white hover:text-emerald-200 text-base"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-red-800 via-rose-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-red-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                TRANG THỨ 6: ĐÁNH GIÁ TIẾN ĐỘ CÔNG VIỆC & KHEN THƯỞNG / NHẮC NHỞ CÔNG KHAI
              </span>
              <span className="text-xs text-rose-200 font-semibold">Năm học {activeSchoolYear}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Sổ Theo Dõi Đánh Giá Tiến Độ & Vinh Danh / Nhắc Nhở Công Khai
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Khen từng người theo kết quả từng việc được giao • Khen người làm đúng tiến độ theo tuần, tháng •
              Nhắc nhở người chậm hay bị chậm • Nhắc nhở từng việc và theo tuần/tháng • Tự động liên kết Sổ Thi Đua Điện Tử 4 Tầng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAssignTaskModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Giao Việc Mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPeriodicModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>+ Khen / Nhắc Tuần & Tháng</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoScanPeriod}
                  className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                  title="Tự động quét tiến độ của tất cả nhân sự trong tuần và công khai đánh giá"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Quét Tiến Độ Tự Động</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs border border-white/20 transition"
              title="In báo cáo tiến độ công việc Trang 6"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng Việc Được Giao</div>
          <div className="text-2xl font-black text-slate-900">{totalTasks}</div>
          <div className="text-[10px] text-slate-500">Toàn trường & 4 phân hiệu</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đúng Hạn (Khen)</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">{completedTasks}</div>
          <div className="text-[10px] text-emerald-600 font-semibold">{onTimeRate}% hoàn thành tốt</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Chậm / Quá Hạn</span>
          </div>
          <div className="text-2xl font-black text-rose-700">{overdueTasks}</div>
          <div className="text-[10px] text-rose-600 font-semibold">Cần đôn đốc nhắc nhở</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Đang Thực Hiện</span>
          </div>
          <div className="text-2xl font-black text-blue-700">{inProgressTasks}</div>
          <div className="text-[10px] text-blue-600">Trong thời hạn cho phép</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-purple-600 uppercase flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Lượt Khen Thưởng</span>
          </div>
          <div className="text-2xl font-black text-purple-700">+{totalPraises}</div>
          <div className="text-[10px] text-purple-600">Đã công khai Trang 6</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1">
            <BellRing className="w-3.5 h-3.5" />
            <span>Lượt Nhắc Nhở</span>
          </div>
          <div className="text-2xl font-black text-amber-700">{totalReminders}</div>
          <div className="text-[10px] text-amber-600">Đã đôn đốc khắc phục</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-2xl shadow-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('public_board')}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'public_board'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BellRing className="w-4 h-4 text-red-600" />
          <span>BẢNG TIN CÔNG KHAI KẾT QUẢ TIẾN ĐỘ TRANG 6 ({evaluations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('individual_tasks')}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'individual_tasks'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-blue-600" />
          <span>Khen / Nhắc Nhở Theo Từng Việc Được Giao ({tasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('period_progress')}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'period_progress'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>Khen & Nhắc Nhở Tiến Độ Theo Tuần, Tháng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assign_and_evaluate')}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'assign_and_evaluate'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4 text-emerald-600" />
          <span>Sổ Giao Việc & Nghiệm Thu 4 Tầng Thi Đua</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên GV, nhân viên, tên công việc..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Phân hiệu */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700"
          >
            <option value="ALL">Tất cả Phân hiệu (4 đơn vị)</option>
            <option value="Trụ sở chính">Trụ sở chính</option>
            <option value="La Hai">Phân hiệu TH La Hai</option>
            <option value="Xuân Long">Phân hiệu Xuân Long</option>
            <option value="Xuân Quang 2">Phân hiệu Xuân Quang 2</option>
          </select>

          {/* Filter Tầng nhân sự (4 Tầng) */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700"
          >
            <option value="ALL">Tất cả Nhân sự (4 Tầng)</option>
            <option value="GV_TH">Giáo viên Tiểu học (GV TH)</option>
            <option value="GV_THCS">Giáo viên THCS (GV THCS)</option>
            <option value="NHAN_VIEN">Nhân viên (Văn phòng/Kế toán/Y tế/BV)</option>
          </select>

          {/* Filter Chu kỳ Tuần / Tháng */}
          <select
            value={periodTypeFilter}
            onChange={(e) => setPeriodTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700"
          >
            <option value="ALL">Tất cả Chu kỳ</option>
            <option value="TUAN">Đánh giá theo Tuần</option>
            <option value="THANG">Đánh giá theo Tháng</option>
          </select>

          {/* Filter Loại khen thưởng / Nhắc nhở */}
          <select
            value={feedbackTypeFilter}
            onChange={(e) => setFeedbackTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700"
          >
            <option value="ALL">Tất cả Khen & Nhắc</option>
            <option value="KHEN">🟢 Khen ngợi đúng hạn (+)</option>
            <option value="NHAC_NHO">🔴 Nhắc nhở chậm trễ (-)</option>
          </select>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 1: BẢNG TIN CÔNG KHAI KẾT QUẢ TIẾN ĐỘ TRANG 6 */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'public_board' && (
        <div className="space-y-6">
          {/* Progress Chart Visualization */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                  Biểu Đồ Phân Tích Tiến Độ Giải Quyết Công Việc Theo 4 Phân Hiệu (Recharts)
                </h3>
                <p className="text-xs text-slate-500">
                  Tỷ lệ đúng hạn, chậm tiến độ và đang thực hiện giữa các đơn vị
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Đúng Hạn (Khen)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span>Chậm Tiến Độ (Nhắc)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                  <span>Đang Thực Hiện</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchProgressData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(val: any, name: any) => [`${val} công việc`, name]}
                  />
                  <Legend />
                  <Bar dataKey="Đúng Hạn (Khen)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chậm Tiến Độ" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Đang Thực Hiện" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Public Evaluations Feed */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm text-slate-900 uppercase flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-red-600" />
                  Bảng Tin Khen Thưởng & Nhắc Nhở Công Khai Toàn Trường (Trang Thứ 6)
                </h3>
                <p className="text-xs text-slate-500">
                  Mọi cán bộ, giáo viên, nhân viên đều có thể theo dõi tiến độ thi đua chung
                </p>
              </div>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200">
                {filteredEvaluations.length} thông báo công khai
              </span>
            </div>

            {filteredEvaluations.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <BellRing className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-sm">Chưa có đánh giá công khai nào phù hợp bộ lọc</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvaluations.map((item) => {
                  const isPraise = item.feedbackType === 'KHEN';
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition hover:shadow-md flex flex-col justify-between ${
                        isPraise
                          ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                          : 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                                isPraise
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-rose-600 text-white shadow-xs'
                              }`}
                            >
                              {isPraise ? (
                                <>
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>Tuyên Dương / Khen Thưởng</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Nhắc Nhở Tiến Độ</span>
                                </>
                              )}
                            </span>

                            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {item.periodType === 'TUAN' ? `Tuần ${item.periodValue}` : `Tháng ${item.periodValue}`}
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono">{item.evaluatedAt}</span>
                        </div>

                        {/* Person Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">{item.staffName}</h4>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                              {item.staffCategory === 'GV_TH'
                                ? 'GV Tiểu học'
                                : item.staffCategory === 'GV_THCS'
                                ? 'GV THCS'
                                : 'Nhân viên'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {item.branchName}
                          </div>
                        </div>

                        {/* Feedback Content */}
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed font-medium ${
                            isPraise
                              ? 'bg-white text-emerald-950 border border-emerald-100'
                              : 'bg-white text-rose-950 border border-rose-100'
                          }`}
                        >
                          {item.feedbackContent}
                        </div>

                        {/* Task metrics in period */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-600 font-semibold pt-1">
                          <span>
                            Số việc chu kỳ: <strong>{item.totalTasksInPeriod}</strong>
                          </span>
                          <span className="text-emerald-700">
                            Đúng hạn: <strong>{item.completedOnTimeTasks}</strong>
                          </span>
                          {item.overdueTasks > 0 && (
                            <span className="text-rose-700">
                              Quá hạn: <strong>{item.overdueTasks}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer: Evaluated by */}
                      <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-slate-600">
                          <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                          <span>{item.evaluatedBy}</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          ✓ Công khai Trang 6
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 2: KHEN / NHẮC NHỞ THEO TỪNG VIỆC ĐƯỢC GIAO */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'individual_tasks' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase">
                Danh Sách Nhiệm Vụ Được Giao & Thao Tác Khen / Nhắc Nhở Từng Người
              </h3>
              <p className="text-xs text-slate-500">
                Hiệu trưởng & Phó Hiệu trưởng bấm nút khen hoặc nhắc nhở trực tiếp theo kết quả từng công việc
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
              {filteredTasks.length} nhiệm vụ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">STT</th>
                  <th className="py-3 px-3">Người Nhận Việc</th>
                  <th className="py-3 px-3">Nhiệm Vụ & Tiêu Chí</th>
                  <th className="py-3 px-3">Phân Hiệu</th>
                  <th className="py-3 px-3 text-center">Hạn Chót</th>
                  <th className="py-3 px-3 text-center">Trạng Thái</th>
                  <th className="py-3 px-3 text-center">Điểm / Kết Quả</th>
                  <th className="py-3 px-3 text-center">Minh Chứng</th>
                  <th className="py-3 px-3 text-center">Thao Tác Khen / Nhắc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task, idx) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isOverdue = task.deadline < today && task.executionStatus !== 'HOAN_THANH';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900">{task.targetStaffName}</div>
                        <div className="text-[10px] text-slate-500">
                          {task.targetStaffCategory === 'GV_TH'
                            ? 'GV Tiểu học'
                            : task.targetStaffCategory === 'GV_THCS'
                            ? 'GV THCS'
                            : 'Nhân viên'}
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-bold text-slate-800 line-clamp-1">{task.taskTitle}</div>
                        <div className="text-[10px] text-amber-700 font-medium">{task.competitionCriteria}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 italic">{task.taskDescription}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-medium text-slate-700">{task.targetBranchName}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className={isOverdue ? 'text-rose-700 font-black' : 'text-slate-700'}>
                          {task.deadline}
                        </span>
                        {isOverdue && (
                          <span className="block text-[9px] text-rose-600 font-bold">Quá hạn!</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {task.executionStatus === 'HOAN_THANH' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Hoàn thành
                          </span>
                        )}
                        {task.executionStatus === 'CHO_XAC_NHAN' && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            ⏳ Chờ nghiệm thu
                          </span>
                        )}
                        {task.executionStatus === 'DANG_THUC_HIEN' && (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                            Đang làm
                          </span>
                        )}
                        {task.executionStatus === 'CHUA_THUC_HIEN' && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                            Chưa thực hiện
                          </span>
                        )}
                        {task.executionStatus === 'BI_TRA_LAI' && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                            Bị trả lại
                          </span>
                        )}
                        {task.executionStatus === 'QUA_HAN' && (
                          <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 text-[10px] font-black">
                            Quá hạn
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {task.score !== undefined ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-black">
                            {task.score}/10 đ
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {task.driveUrl ? (
                          <a
                            href={task.driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-bold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Drive</span>
                          </a>
                        ) : task.evidenceFiles && task.evidenceFiles.length > 0 ? (
                          <span className="text-[10px] text-slate-700 font-semibold">
                            {task.evidenceFiles.length} tệp
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chưa có</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canManage ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenTaskAction(task, 'KHEN')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-[10px] transition flex items-center gap-1"
                                title="Khen thưởng người này theo kết quả công việc"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>Khen</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenTaskAction(task, 'NHAC_NHO')}
                                className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-[10px] transition flex items-center gap-1"
                                title="Nhắc nhở người này vì chậm hoặc chưa đạt"
                              >
                                <AlertCircle className="w-3 h-3" />
                                <span>Nhắc nhở</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Chỉ xem</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 3: KHEN & NHẮC NHỞ TIẾN ĐỘ THEO TUẦN, THÁNG */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'period_progress' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CỘT TRÁI: DANH SÁCH VINH DANH LÀM ĐÚNG TIẾN ĐỘ THEO TUẦN / THÁNG */}
            <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-emerald-950 uppercase">
                      Vinh Danh Người Làm Đúng Tiến Độ Theo Tuần, Tháng
                    </h3>
                    <p className="text-[11px] text-emerald-700">
                      Tuyên dương các cá nhân giải quyết công việc đúng hạn 100%
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  +{evaluations.filter((e) => e.feedbackType === 'KHEN').length} lượt
                </span>
              </div>

              <div className="space-y-3">
                {evaluations
                  .filter((e) => e.feedbackType === 'KHEN')
                  .map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2 hover:bg-emerald-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-black text-sm text-slate-900">{ev.staffName}</div>
                          <div className="text-[10px] text-emerald-800 font-semibold">
                            {ev.branchName} • {ev.staffCategory === 'GV_TH' ? 'GV Tiểu học' : ev.staffCategory === 'GV_THCS' ? 'GV THCS' : 'Nhân viên'}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                          {ev.periodType === 'TUAN' ? `Tuần ${ev.periodValue}` : `Tháng ${ev.periodValue}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 italic">"{ev.feedbackContent}"</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-emerald-100/60">
                        <span>Đánh giá bởi: <strong>{ev.evaluatedBy}</strong></span>
                        <span>{ev.evaluatedAt}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* CỘT PHẢI: DANH SÁCH NHẮC NHỞ NGƯỜI CHẬM HAY BỊ CHẬM THEO TUẦN / THÁNG */}
            <div className="bg-white rounded-3xl border border-rose-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-rose-950 uppercase">
                      Nhắc Nhở Người Chậm Hay Bị Chậm Tiến Độ Theo Tuần, Tháng
                    </h3>
                    <p className="text-[11px] text-rose-700">
                      Đôn đốc các trường hợp giải quyết công việc trễ hạn quy định
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                  {evaluations.filter((e) => e.feedbackType === 'NHAC_NHO').length} lượt
                </span>
              </div>

              <div className="space-y-3">
                {evaluations
                  .filter((e) => e.feedbackType === 'NHAC_NHO')
                  .map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2 hover:bg-rose-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-black text-sm text-slate-900">{ev.staffName}</div>
                          <div className="text-[10px] text-rose-800 font-semibold">
                            {ev.branchName} • {ev.staffCategory === 'GV_TH' ? 'GV Tiểu học' : ev.staffCategory === 'GV_THCS' ? 'GV THCS' : 'Nhân viên'}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                          {ev.periodType === 'TUAN' ? `Tuần ${ev.periodValue}` : `Tháng ${ev.periodValue}`}
                        </span>
                      </div>
                      <p className="text-xs text-rose-900 font-medium">"{ev.feedbackContent}"</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-rose-100/60">
                        <span>Đánh giá bởi: <strong>{ev.evaluatedBy}</strong></span>
                        <span>{ev.evaluatedAt}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 4: SỔ GIAO VIỆC & NGHIỆM THU 4 TẦNG THI ĐUA */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'assign_and_evaluate' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase">
                Quy Trình 4 Tầng Sổ Theo Dõi Thi Đua Điện Tử & Giao Việc Tự Động
              </h3>
              <p className="text-xs text-slate-500">
                HT/PHT giao việc ➔ GV/NV nhận nhiệm vụ & nộp minh chứng ➔ Quản lý nghiệm thu chấm điểm ➔ Hệ thống tự động ghi sang Thi đua.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowAssignTaskModal(true)}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow transition"
              >
                + Giao Thêm Việc Mới
              </button>
            )}
          </div>

          {/* 4 Tầng Workflow Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tầng 1</div>
              <div className="font-extrabold text-xs text-red-700">1. HT / PHT Giao Việc</div>
              <p className="text-[10px] text-slate-500">Chọn GV/NV, hạn hoàn thành, tiêu chí thi đua, mức ưu tiên</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tầng 2</div>
              <div className="font-extrabold text-xs text-blue-700">2. GV / NV Nhận Nhiệm Vụ</div>
              <p className="text-[10px] text-slate-500">Xem yêu cầu, thực hiện, tải minh chứng ảnh/PDF lên Drive</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tầng 3</div>
              <div className="font-extrabold text-xs text-amber-700">3. BGH Nghiệm Thu Chấm Điểm</div>
              <p className="text-[10px] text-slate-500">Mở minh chứng, xác nhận hoặc trả lại, chấm điểm 0-10</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tầng 4</div>
              <div className="font-extrabold text-xs text-emerald-700">4. Tự Động Sang Sổ Thi Đua</div>
              <p className="text-[10px] text-slate-500">Tổng hợp điểm cuối năm, không cần nhớ lại cả năm</p>
            </div>
          </div>

          {/* Tasks Detailed List */}
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800">
                      {task.priority === 'KHAN_CAP' ? '🔴 Khẩn cấp' : task.priority === 'CAO' ? '🟠 Ưu tiên cao' : 'Bình thường'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Người giao: {task.assignerName} ({task.assignerRole})
                    </span>
                    <span className="text-xs text-slate-400">• Hạn chót: <strong>{task.deadline}</strong></span>
                  </div>

                  <h4 className="text-base font-black text-slate-900">{task.taskTitle}</h4>
                  <p className="text-xs text-slate-600">{task.taskDescription}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    <span className="text-slate-500">
                      Người thực hiện: <strong className="text-slate-900">{task.targetStaffName}</strong> ({task.targetBranchName})
                    </span>
                    <span className="text-amber-700 font-semibold">
                      Tiêu chí: {task.competitionCriteria}
                    </span>
                  </div>

                  {/* Submission note if any */}
                  {task.submissionNotes && (
                    <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 text-xs text-blue-900">
                      <strong>Báo cáo kết quả:</strong> {task.submissionNotes} (Nộp ngày {task.submissionDate})
                    </div>
                  )}

                  {/* Evaluation feedback if any */}
                  {task.evaluationFeedback && (
                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-xs text-emerald-950 flex items-center justify-between">
                      <div>
                        <strong>Đánh giá của {task.evaluatedBy}:</strong> {task.evaluationFeedback}
                      </div>
                      {task.score !== undefined && (
                        <span className="font-black text-sm text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          {task.score}/10 điểm
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions per role */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {/* Button for Assignee to Submit Result */}
                  {currentUser?.id === task.targetStaffId && task.executionStatus !== 'HOAN_THANH' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTaskToSubmit(task);
                        setShowSubmitResultModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition"
                    >
                      📤 Nộp Kết Quả & Minh Chứng
                    </button>
                  )}

                  {/* Button for Manager to Evaluate */}
                  {canManage && task.executionStatus === 'CHO_XAC_NHAN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTaskToEvaluate(task);
                        setShowEvaluateTaskModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow transition animate-pulse"
                    >
                      ⭐ Nghiệm Thu & Chấm Điểm
                    </button>
                  )}

                  {/* Quick Praise / Warn buttons */}
                  {canManage && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenTaskAction(task, 'KHEN')}
                        className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition"
                      >
                        👍 Khen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenTaskAction(task, 'NHAC_NHO')}
                        className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200 transition"
                      >
                        ⚠️ Nhắc
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: KHEN HOẶC NHẮC NHỞ THEO TỪNG VIỆC ĐƯỢC GIAO */}
      {/* ---------------------------------------------------- */}
      {showTaskActionModal && selectedTaskForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                {actionType === 'KHEN' ? (
                  <>
                    <ThumbsUp className="w-5 h-5 text-emerald-600" />
                    <span>Khen Thưởng Theo Kết Quả Nhiệm Vụ</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Nhắc Nhở Tiến Độ Nhiệm Vụ Được Giao</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setShowTaskActionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTaskAction} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div>
                  Người được đánh giá: <strong>{selectedTaskForAction.targetStaffName}</strong> ({selectedTaskForAction.targetBranchName})
                </div>
                <div>
                  Nhiệm vụ: <strong>{selectedTaskForAction.taskTitle}</strong>
                </div>
                <div>
                  Hạn chót: <strong>{selectedTaskForAction.deadline}</strong> • Tiêu chí: {selectedTaskForAction.competitionCriteria}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nội dung nhận xét / đánh giá ({actionType === 'KHEN' ? 'Khen ngợi' : 'Nhắc nhở'}):
                </label>
                <textarea
                  rows={3}
                  value={actionFeedback}
                  onChange={(e) => setActionFeedback(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 font-medium"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="taskActionPublic"
                  checked={actionIsPublic}
                  onChange={(e) => setActionIsPublic(e.target.checked)}
                  className="rounded text-red-600"
                />
                <label htmlFor="taskActionPublic" className="font-semibold text-slate-700">
                  Công khai kết quả đánh giá trên Bảng Tin Trang Thứ 6 (Toàn trường)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTaskActionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-black shadow transition ${
                    actionType === 'KHEN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionType === 'KHEN' ? '✓ Xác Nhận Khen Thưởng' : '⚠️ Gửi Nhắc Nhở Công Khai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: KHEN & NHẮC NHỞ THEO TUẦN / THÁNG */}
      {/* ---------------------------------------------------- */}
      {showPeriodicModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Đánh Giá Tiến Độ Theo Tuần / Tháng & Công Khai Trang 6</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPeriodicModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPeriodicEvaluation} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Giáo viên / Nhân viên:</label>
                <select
                  value={periodicTargetStaffId}
                  onChange={(e) => setPeriodicTargetStaffId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                >
                  {assignableStaff.map((s) => (
                    <option key={s.account.id} value={s.account.id}>
                      {s.account.name} ({s.account.position} - {s.account.branchName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chu kỳ đánh giá:</label>
                  <select
                    value={periodicType}
                    onChange={(e) => setPeriodicType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="TUAN">Theo Tuần</option>
                    <option value="THANG">Theo Tháng</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {periodicType === 'TUAN' ? 'Tuần số:' : 'Tháng:'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={periodicType === 'TUAN' ? 35 : 12}
                    value={periodicValue}
                    onChange={(e) => setPeriodicValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hình thức đánh giá:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPeriodicFeedbackType('KHEN')}
                    className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      periodicFeedbackType === 'KHEN'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Khen Người Đúng Hạn (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPeriodicFeedbackType('NHAC_NHO')}
                    className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      periodicFeedbackType === 'NHAC_NHO'
                        ? 'bg-rose-600 text-white border-rose-600 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Nhắc Người Bị Chậm (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung tuyên dương / nhắc nhở:</label>
                <textarea
                  rows={3}
                  value={periodicFeedbackText}
                  onChange={(e) => setPeriodicFeedbackText(e.target.value)}
                  placeholder="Nhập nhận xét cụ thể để công khai trên Trang thứ 6..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPeriodicModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black shadow transition"
                >
                  ✓ Đăng Công Khai Lên Trang 6
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: GIAO VIỆC MỚI (HT / PHT) */}
      {/* ---------------------------------------------------- */}
      {showAssignTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-red-600" />
                <span>Giao Nhiệm Vụ Mới Cho Giáo Viên / Nhân Viên</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignTask} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Chọn người nhận việc ({isPHT ? `Thuộc phân hiệu ${phtBranch}` : 'Toàn trường'}):
                </label>
                <select
                  value={assignTargetStaffId}
                  onChange={(e) => setAssignTargetStaffId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                >
                  {assignableStaff.map((s) => (
                    <option key={s.account.id} value={s.account.id}>
                      {s.account.name} ({s.account.position} - {s.account.branchName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu chí thi đua liên kết:</label>
                <select
                  value={assignCriteria}
                  onChange={(e) => setAssignCriteria(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Chuyên môn & Giảng dạy">Chuyên môn & Giảng dạy</option>
                  <option value="Chuyên đề chuyên môn & Hội giảng">Chuyên đề chuyên môn & Hội giảng</option>
                  <option value="Bồi dưỡng Học sinh giỏi">Bồi dưỡng Học sinh giỏi</option>
                  <option value="Công tác Chủ nhiệm & Nề nếp">Công tác Chủ nhiệm & Nề nếp</option>
                  <option value="Chuyển đổi số & Hồ sơ sổ sách">Chuyển đổi số & Hồ sơ sổ sách</option>
                  <option value="Cơ sở vật chất & Lao động">Cơ sở vật chất & Lao động</option>
                  <option value="Nhiệm vụ đột xuất khác">Nhiệm vụ đột xuất khác</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề nhiệm vụ:</label>
                <input
                  type="text"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="Ví dụ: Chuẩn bị chuyên đề Toán khối 5 toàn trường..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô tả yêu cầu chi tiết:</label>
                <textarea
                  rows={3}
                  value={assignDescription}
                  onChange={(e) => setAssignDescription(e.target.value)}
                  placeholder="Nhập yêu cầu sản phẩm đầu ra, tài liệu hoặc hình ảnh minh chứng cần nộp..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hạn hoàn thành:</label>
                  <input
                    type="date"
                    value={assignDeadline}
                    onChange={(e) => setAssignDeadline(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mức ưu tiên:</label>
                  <select
                    value={assignPriority}
                    onChange={(e) => setAssignPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="BINH_THUONG">Bình thường</option>
                    <option value="CAO">Ưu tiên cao</option>
                    <option value="KHAN_CAP">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black shadow transition"
                >
                  ✓ Phê Duyệt & Giao Việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: NỘP KẾT QUẢ & MINH CHỨNG (GV / NV) */}
      {/* ---------------------------------------------------- */}
      {showSubmitResultModal && taskToSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <span>Nộp Kết Quả & Upload Minh Chứng Nhiệm Vụ</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSubmitResultModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitResult} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <div className="font-black text-slate-900">{taskToSubmit.taskTitle}</div>
                <div className="text-slate-600 text-[11px] mt-0.5">{taskToSubmit.taskDescription}</div>
                <div className="text-slate-400 text-[10px] mt-1">Hạn nộp: {taskToSubmit.deadline}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Báo cáo kết quả thực hiện:</label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Nhập tóm tắt kết quả đã thực hiện..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Link Google Drive lưu trữ minh chứng (Ảnh/PDF/Word/Excel):
                </label>
                <input
                  type="url"
                  value={submissionDriveUrl}
                  onChange={(e) => setSubmissionDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hoặc đính kèm file trực tiếp (URL/Ảnh):</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={submissionFileName}
                    onChange={(e) => setSubmissionFileName(e.target.value)}
                    placeholder="Tên file (vd: chuyen_de_toan.pdf)"
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                  <input
                    type="url"
                    value={submissionFileUrl}
                    onChange={(e) => setSubmissionFileUrl(e.target.value)}
                    placeholder="URL file / ảnh minh chứng"
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowSubmitResultModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow transition"
                >
                  ✓ Gửi Báo Cáo Nghiệm Thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: NGHIỆM THU & CHẤM ĐIỂM (HT / PHT) */}
      {/* ---------------------------------------------------- */}
      {showEvaluateTaskModal && taskToEvaluate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Nghiệm Thu & Chấm Điểm (Tự Động Chuyển Thi Đua)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEvaluateTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEvaluateTask} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div>
                  Người thực hiện: <strong>{taskToEvaluate.targetStaffName}</strong> ({taskToEvaluate.targetBranchName})
                </div>
                <div>
                  Nhiệm vụ: <strong>{taskToEvaluate.taskTitle}</strong>
                </div>
                <div>
                  Báo cáo của GV: <em>"{taskToEvaluate.submissionNotes || 'Đã nộp minh chứng'}"</em>
                </div>
                {taskToEvaluate.driveUrl && (
                  <div className="pt-1">
                    <a
                      href={taskToEvaluate.driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Mở Thư Mục Minh Chứng Trên Google Drive
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kết quả nghiệm thu:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEvalIsConfirmed(true)}
                    className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      evalIsConfirmed
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Xác Nhận Đạt Yêu Cầu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEvalIsConfirmed(false)}
                    className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5 transition ${
                      !evalIsConfirmed
                        ? 'bg-rose-600 text-white border-rose-600 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Trả Lại Làm Lại</span>
                  </button>
                </div>
              </div>

              {evalIsConfirmed && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Điểm số thi đua (Thang điểm 10): <strong className="text-emerald-700 text-sm font-black">{evalScore} đ</strong>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={evalScore}
                    onChange={(e) => setEvalScore(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>1 (Kém)</span>
                    <span>5 (Đạt)</span>
                    <span>8 (Tốt)</span>
                    <span>10 (Xuất sắc)</span>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nhận xét của người quản lý:</label>
                <textarea
                  rows={2}
                  value={evalFeedbackText}
                  onChange={(e) => setEvalFeedbackText(e.target.value)}
                  placeholder="Nhập nhận xét để lưu vào hồ sơ thi đua..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEvaluateTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow transition"
                >
                  ✓ Lưu Đánh Giá & Ghi Sang Sổ Thi Đua
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
