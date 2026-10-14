import React, { useState, useMemo } from 'react';
import {
  UserAccount,
  WorkWorkflowItem,
  WorkflowStepStatus,
  WorkflowRating,
  WorkflowCategory,
  PeriodicEvaluationSummary,
  SecurityConfig,
  SecurityAuditRecord,
} from '../types/school';
import { storageService } from '../services/storageService';
import { getPhtAssignedBranch } from '../utils/permissionUtils';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Database,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  PlusCircle,
  FileText,
  Send,
  Eye,
  EyeOff,
  Award,
  AlertCircle,
  Printer,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Layers,
  Calendar,
  Building,
  UserCheck,
  CheckSquare,
  Sparkles,
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

interface WorkWorkflowManagerProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  allStaff: { account: UserAccount }[];
  onRefreshData?: () => void;
}

export const WorkWorkflowManager: React.FC<WorkWorkflowManagerProps> = ({
  currentUser,
  activeSchoolYear,
  allStaff,
  onRefreshData,
}) => {
  // Navigation tabs
  type TabType = 'workflow_process' | 'periodic_statistics' | 'public_board' | 'security_database';
  const [activeTab, setActiveTab] = useState<TabType>('workflow_process');

  // Datasets from storageService
  const [workflows, setWorkflows] = useState<WorkWorkflowItem[]>(() =>
    storageService.getWorkflows(activeSchoolYear)
  );
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() =>
    storageService.getSecurityConfig()
  );
  const [auditLogs, setAuditLogs] = useState<SecurityAuditRecord[]>(() =>
    storageService.getSecurityAuditLogs()
  );

  // Filters for Tab 1 (Workflows)
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkflowStepStatus>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filters for Tab 2 (Periodic Statistics)
  const [periodType, setPeriodType] = useState<'WEEK' | 'MONTH' | 'YEAR'>('WEEK');
  const [selectedWeek, setSelectedWeek] = useState<number>(4);
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [statsSearchTerm, setStatsSearchTerm] = useState<string>('');
  const [statsRankFilter, setStatsRankFilter] = useState<'ALL' | 'A' | 'B' | 'C' | 'D'>('ALL');

  // Security & HT PIN modal
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinAction, setPinAction] = useState<(() => void) | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // Workflow Action Modals
  // 1. Tạo Báo cáo Kế hoạch mới (Bước 1)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<WorkflowCategory>('CHUYEN_MON_DAY_HOC');
  const [newProposalContent, setNewProposalContent] = useState<string>('');
  const [newExpectedGoal, setNewExpectedGoal] = useState<string>('');
  const [newDeadline, setNewDeadline] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [newCycleWeek, setNewCycleWeek] = useState<number>(5);
  const [newCycleMonth, setNewCycleMonth] = useState<number>(10);

  // 2. Phê duyệt của HT (Bước 2)
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [selectedWorkflowForApproval, setSelectedWorkflowForApproval] = useState<WorkWorkflowItem | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'APPROVE' | 'REQUEST_CHANGE' | 'REJECT'>('APPROVE');
  const [approvalDirectives, setApprovalDirectives] = useState<string>('');
  const [approvalAdjustedDeadline, setApprovalAdjustedDeadline] = useState<string>('');

  // 3. Cập nhật tiến độ thực hiện (Bước 3)
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [selectedWorkflowForProgress, setSelectedWorkflowForProgress] = useState<WorkWorkflowItem | null>(null);
  const [progressPercentInput, setProgressPercentInput] = useState<number>(50);
  const [progressNotesInput, setProgressNotesInput] = useState<string>('');

  // 4. Nộp Báo cáo kết quả (Bước 4)
  const [showSubmitResultModal, setShowSubmitResultModal] = useState<boolean>(false);
  const [selectedWorkflowForSubmit, setSelectedWorkflowForSubmit] = useState<WorkWorkflowItem | null>(null);
  const [resultSummaryInput, setResultSummaryInput] = useState<string>('');
  const [resultDriveUrlInput, setResultDriveUrlInput] = useState<string>('');

  // 5. HT Nhận xét, chấm điểm & Quyết định công khai (Bước 5 & 6)
  const [showEvaluateModal, setShowEvaluateModal] = useState<boolean>(false);
  const [selectedWorkflowForEvaluation, setSelectedWorkflowForEvaluation] = useState<WorkWorkflowItem | null>(null);
  const [evalScoreInput, setEvalScoreInput] = useState<number>(9.0);
  const [evalRatingInput, setEvalRatingInput] = useState<WorkflowRating>('XUAT_SAC');
  const [evalFeedbackInput, setEvalFeedbackInput] = useState<string>('');
  const [evalFeedbackType, setEvalFeedbackType] = useState<'KHEN_THUONG' | 'NHAC_NHO' | 'DONG_VIEN' | 'GOP_Y'>('KHEN_THUONG');
  const [evalAwardTitle, setEvalAwardTitle] = useState<string>('');
  const [evalIsPublic, setEvalIsPublic] = useState<boolean>(true);

  // Toast message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Roles & Permissions check
  const isHT = currentUser?.role === 'HT';
  const isPHT = currentUser?.role === 'PHT';
  const isIT = currentUser?.role === 'GV_TIN_HOC';
  const canApprove = isHT || isPHT || isIT;
  const phtAssignedBranch = getPhtAssignedBranch(currentUser);

  // Refresh all state helper
  const reloadData = () => {
    setWorkflows(storageService.getWorkflows(activeSchoolYear));
    setSecurityConfig(storageService.getSecurityConfig());
    setAuditLogs(storageService.getSecurityAuditLogs());
    onRefreshData?.();
  };

  // Filtered workflows for Tab 1
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      // Role-based visibility:
      // If regular GV/NV: can see their own reports OR reports that are public
      if (!canApprove && w.creatorId !== currentUser?.id && !w.isPublicAnnounced) {
        return false;
      }
      // PHT restriction by branch if not their own report
      if (isPHT && phtAssignedBranch && w.creatorId !== currentUser?.id) {
        if (!w.branchName.toLowerCase().includes(phtAssignedBranch.toLowerCase()) && !w.isPublicAnnounced) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
      // Branch filter
      if (branchFilter !== 'ALL' && !w.branchName.toLowerCase().includes(branchFilter.toLowerCase())) return false;
      // Search term
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        return (
          w.title.toLowerCase().includes(s) ||
          w.creatorName.toLowerCase().includes(s) ||
          w.code.toLowerCase().includes(s) ||
          w.proposalContent.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [workflows, statusFilter, branchFilter, searchTerm, currentUser, canApprove, isPHT, phtAssignedBranch]);

  // Periodic Evaluation Summaries for Tab 2
  const evaluationSummaries = useMemo(() => {
    const periodVal = periodType === 'WEEK' ? selectedWeek : periodType === 'MONTH' ? selectedMonth : undefined;
    const summaries = storageService.getPeriodicEvaluationSummaries(activeSchoolYear, periodType, periodVal);

    return summaries.filter((s) => {
      if (statsRankFilter !== 'ALL' && s.tierRank !== statsRankFilter) return false;
      if (statsSearchTerm.trim()) {
        const term = statsSearchTerm.toLowerCase();
        return (
          s.staffName.toLowerCase().includes(term) ||
          s.position.toLowerCase().includes(term) ||
          s.branchName.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [activeSchoolYear, periodType, selectedWeek, selectedMonth, statsRankFilter, statsSearchTerm, workflows]);

  // Public items for Tab 3
  const publicWorkflows = useMemo(() => {
    return workflows.filter((w) => w.isPublicAnnounced);
  }, [workflows]);

  // Private items for current user (Tab 3)
  const myPrivateWorkflows = useMemo(() => {
    if (!currentUser) return [];
    return workflows.filter((w) => w.creatorId === currentUser.id && !w.isPublicAnnounced && w.status === 'B5_HT_DA_DANH_GIA');
  }, [workflows, currentUser]);

  // Helper for Stepper label and colors
  const getStepBadge = (status: WorkflowStepStatus) => {
    switch (status) {
      case 'B1_CHO_HT_DUYET':
        return { label: 'Bước 1: Chờ HT phê duyệt', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: '⏳' };
      case 'B2_YEU_CAU_CHINH_SUA':
        return { label: 'Bước 2: Yêu cầu sửa đổi', bg: 'bg-orange-100 text-orange-800 border-orange-300', icon: '✏️' };
      case 'B2_TU_CHOI':
        return { label: 'Bước 2: HT không phê duyệt', bg: 'bg-rose-100 text-rose-800 border-rose-300', icon: '❌' };
      case 'B2_HT_DA_DUYET':
        return { label: 'Bước 2: HT đã phê duyệt', bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: '📋' };
      case 'B3_DANG_THUC_HIEN':
        return { label: 'Bước 3: Đang thực hiện', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: '⚙️' };
      case 'B4_CHO_HT_DANH_GIA':
        return { label: 'Bước 4: Chờ HT thẩm định', bg: 'bg-purple-100 text-purple-800 border-purple-300', icon: '🔍' };
      case 'B5_HT_DA_DANH_GIA':
        return { label: 'Bước 5 & 6: Đã thẩm định & kết luận', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '✅' };
      default:
        return { label: 'Đang xử lý', bg: 'bg-slate-100 text-slate-800 border-slate-300', icon: '📄' };
    }
  };

  // Require HT PIN check before sensitive action
  const executeWithPinCheck = (action: () => void) => {
    if (!isHT) {
      action();
      return;
    }
    setPinAction(() => action);
    setPinInput('');
    setPinError(null);
    setShowPinModal(true);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (storageService.verifyHtSecurityPin(pinInput)) {
      setShowPinModal(false);
      if (pinAction) pinAction();
      setPinAction(null);
      showToast('Xác thực mã PIN Hiệu trưởng thành công!', 'success');
    } else {
      setPinError('Mã PIN không đúng! Vui lòng nhập lại (Mặc định: 2026).');
    }
  };

  // Step 1: Submit new workflow proposal
  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProposalContent.trim() || !currentUser) {
      showToast('Vui lòng điền đầy đủ tiêu đề và nội dung công việc.', 'error');
      return;
    }

    const categoryLabels: Record<WorkflowCategory, string> = {
      CHUYEN_MON_DAY_HOC: 'Chuyên môn & Giảng dạy',
      HOI_GIANG_THI_DUA: 'Hội giảng & Thi đua',
      CONG_TAC_CHU_NHIEM: 'Công tác Chủ nhiệm',
      HO_SO_SO_SACH: 'Hồ sơ sổ sách',
      CO_SO_VAT_CHAT: 'Cơ sở vật chất',
      TAI_CHINH_KE_TOAN: 'Tài chính & Kế toán',
      VAN_THU_CONG_VAN: 'Văn thư & Công văn',
      Y_TE_HOC_DUONG: 'Y tế học đường',
      AN_NINH_BAO_VE: 'An ninh & Bảo vệ',
      PHONG_TRAO_DOAN_DOI: 'Phong trào Đoàn Đội',
      NHIEM_VU_DOT_XUAT: 'Nhiệm vụ đột xuất',
    };

    storageService.createWorkflowProposal(
      {
        schoolYear: activeSchoolYear,
        title: newTitle.trim(),
        category: newCategory,
        categoryLabel: categoryLabels[newCategory] || 'Nhiệm vụ',
        branchName: currentUser.branchName || 'Trụ sở chính Đồng Xuân',
        campusName: currentUser.campusName || 'Điểm Trụ sở chính',
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorRole: currentUser.role,
        creatorPosition: currentUser.position || 'Cán bộ',
        submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        proposalContent: newProposalContent.trim(),
        expectedGoal: newExpectedGoal.trim(),
        deadline: newDeadline,
        cycleWeek: newCycleWeek,
        cycleMonth: newCycleMonth,
        cycleSemester: 1,
      },
      activeSchoolYear
    );

    setShowCreateModal(false);
    setNewTitle('');
    setNewProposalContent('');
    setNewExpectedGoal('');
    reloadData();
    showToast('Đã gửi báo cáo kế hoạch thành công! Đang chờ Hiệu trưởng phê duyệt.', 'success');
  };

  // Step 2: HT approve
  const handleApproveWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowForApproval || !currentUser) return;

    storageService.approveWorkflow(
      selectedWorkflowForApproval.id,
      approvalDecision,
      approvalDirectives.trim() || (approvalDecision === 'APPROVE' ? 'Đồng ý phê duyệt kế hoạch.' : 'Cần bổ sung chi tiết.'),
      currentUser,
      approvalAdjustedDeadline || undefined,
      activeSchoolYear
    );

    setShowApproveModal(false);
    setSelectedWorkflowForApproval(null);
    setApprovalDirectives('');
    reloadData();
    showToast('Đã lưu kết quả phê duyệt của Ban Giám hiệu!', 'success');
  };

  // Step 3: Update Progress
  const handleUpdateProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowForProgress || !currentUser) return;

    storageService.updateWorkflowProgress(
      selectedWorkflowForProgress.id,
      progressPercentInput,
      progressNotesInput.trim() || 'Cập nhật tiến độ theo lịch trình.',
      currentUser,
      activeSchoolYear
    );

    setShowProgressModal(false);
    setSelectedWorkflowForProgress(null);
    setProgressNotesInput('');
    reloadData();
    showToast('Đã cập nhật tiến độ thực hiện công việc!', 'success');
  };

  // Step 4: Submit Result
  const handleSubmitResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowForSubmit || !currentUser || !resultSummaryInput.trim()) {
      showToast('Vui lòng nhập tóm tắt kết quả đạt được.', 'error');
      return;
    }

    storageService.submitWorkflowResultReport(
      selectedWorkflowForSubmit.id,
      resultSummaryInput.trim(),
      [
        { name: 'bien_ban_nghiem_thu.pdf', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop', size: '1.2 MB', type: 'doc' },
      ],
      resultDriveUrlInput.trim() || `https://drive.google.com/drive/folders/1DRIVE_DX_${selectedWorkflowForSubmit.creatorId}`,
      currentUser,
      activeSchoolYear
    );

    setShowSubmitResultModal(false);
    setSelectedWorkflowForSubmit(null);
    setResultSummaryInput('');
    setResultDriveUrlInput('');
    reloadData();
    showToast('Đã nộp báo cáo kết quả! Hồ sơ đã chuyển đến Hiệu trưởng để thẩm định & nhận xét.', 'success');
  };

  // Step 5 & 6: HT Evaluate and Decide Public/Private
  const handleEvaluateAndDecide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowForEvaluation || !currentUser) return;

    executeWithPinCheck(() => {
      storageService.evaluateAndDecideWorkflow(
        selectedWorkflowForEvaluation.id,
        {
          score: evalScoreInput,
          rating: evalRatingInput,
          feedback: evalFeedbackInput.trim() || 'Hiệu trưởng đánh giá tốt tinh thần trách nhiệm.',
          feedbackType: evalFeedbackType,
          awardTitle: evalAwardTitle.trim() || undefined,
          isPublic: evalIsPublic,
        },
        currentUser,
        activeSchoolYear
      );

      setShowEvaluateModal(false);
      setSelectedWorkflowForEvaluation(null);
      setEvalFeedbackInput('');
      setEvalAwardTitle('');
      reloadData();
      showToast(
        evalIsPublic
          ? 'Đã hoàn tất nhận xét & CÔNG KHAI TOÀN TRƯỜNG lên Bảng tin!'
          : 'Đã hoàn tất nhận xét & LƯU NỘI BỘ (Chỉ cá nhân người thực hiện xem được).',
        'success'
      );
    });
  };

  // Export Excel / CSV
  const handleExportEvaluationCsv = () => {
    const headers = [
      'STT',
      'Mã cán bộ',
      'Họ và tên',
      'Chức vụ',
      'Phân hiệu',
      'Tổng số việc',
      'Đã duyệt',
      'Hoàn thành',
      'Đúng hạn',
      'Chậm hạn',
      'Khen thưởng',
      'Nhắc nhở',
      'Điểm KPI',
      'Tỷ lệ hoàn thành (%)',
      'Xếp loại',
    ];

    const rows = evaluationSummaries.map((s, idx) => [
      idx + 1,
      s.staffId,
      s.staffName,
      s.position,
      s.branchName,
      s.totalAssignedOrReported,
      s.approvedCount,
      s.completedCount,
      s.onTimeCount,
      s.overdueCount,
      s.praisedCount,
      s.remindedCount,
      s.averageScore,
      `${s.completionRate}%`,
      s.tierRankLabel,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Danh_Gia_Nhan_Su_${periodType}_${periodType === 'WEEK' ? `Tuan_${selectedWeek}` : periodType === 'MONTH' ? `Thang_${selectedMonth}` : 'Ca_Nam'}_Dong_Xuan.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file bảng thống kê thành công!', 'success');
  };

  // Database Backup
  const handleExportFullBackup = () => {
    executeWithPinCheck(() => {
      const backup = storageService.exportFullDatabaseBackup();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `CSDL_DongXuan_Backup_${new Date().toISOString().split('T')[0]}_Checksum_${backup.checksum.slice(-6)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      reloadData();
      showToast(`Đã xuất bản sao lưu CSDL an toàn kèm mã chữ ký ${backup.checksum}`, 'success');
    });
  };

  // Database Restore
  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    executeWithPinCheck(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const res = storageService.restoreFullDatabaseBackup(content);
        if (res.success) {
          reloadData();
          showToast(res.message, 'success');
        } else {
          showToast(res.message, 'error');
        }
      };
      reader.readAsText(file);
    });
  };

  // Factory reset
  const handleFactoryReset = () => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn khôi phục CSDL về trạng thái chuẩn ban đầu của Trường Đồng Xuân (137 CB-GV-NV và 57 Lớp học)?')) {
      return;
    }
    executeWithPinCheck(() => {
      storageService.factoryResetOfficialDatabase();
      reloadData();
      showToast('Đã khôi phục CSDL chuẩn gốc thành công!', 'success');
    });
  };

  // Chart data for statistics
  const rankDistributionData = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    evaluationSummaries.forEach((s) => {
      counts[s.tierRank]++;
    });
    return [
      { name: 'Loại A (Xuất sắc)', value: counts.A, color: '#10b981' },
      { name: 'Loại B (Tốt)', value: counts.B, color: '#3b82f6' },
      { name: 'Loại C (Đạt)', value: counts.C, color: '#f59e0b' },
      { name: 'Loại D (Chưa đạt)', value: counts.D, color: '#ef4444' },
    ];
  }, [evaluationSummaries]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-3 transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900/95 text-white border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-900/95 text-white border-rose-700'
              : 'bg-slate-900/95 text-white border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Quy Trình & Bảo Mật Chuẩn BGH
              </span>
              <span className="bg-emerald-400/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Năm học: {activeSchoolYear}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Quy Trình Công Việc, Đánh Giá Nhân Viên & Bảo Mật Cơ Sở Dữ Liệu
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Hệ thống vận hành khép kín theo quy trình: <strong>GV/NV báo cáo ➔ HT phê duyệt ➔ Thực hiện ➔ Báo cáo kết quả ➔ HT nhận xét ➔ Quyết định Công khai/Nội bộ</strong>. Đánh giá thống kê hiệu suất theo tuần, tháng, năm kèm cơ chế phân quyền bảo mật cấp cao.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Tạo Báo Cáo Kế Hoạch (B1)
            </button>
            {isHT && (
              <button
                onClick={() => setActiveTab('security_database')}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              >
                <Key className="w-4 h-4" /> Quản Trị Bảo Mật & CSDL
              </button>
            )}
          </div>
        </div>

        {/* 4 Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('workflow_process')}
            className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
              activeTab === 'workflow_process'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            1. Quy Trình 6 Bước ({workflows.length})
          </button>
          <button
            onClick={() => setActiveTab('periodic_statistics')}
            className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
              activeTab === 'periodic_statistics'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            2. Thống Kê & Đánh Giá NV (Tuần/Tháng/Năm)
          </button>
          <button
            onClick={() => setActiveTab('public_board')}
            className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
              activeTab === 'public_board'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            3. Bảng Tin Công Khai & Phản Hồi ({publicWorkflows.length})
          </button>
          <button
            onClick={() => setActiveTab('security_database')}
            className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
              activeTab === 'security_database'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-500" />
            4. Bảo Mật, Phân Quyền & CSDL
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: QUY TRÌNH 6 BƯỚC: BÁO CÁO => DUYỆT => THỰC HIỆN...  */}
      {/* ========================================================= */}
      {activeTab === 'workflow_process' && (
        <div className="space-y-6">
          {/* Step visual overview ribbon */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Quy Trình 6 Bước Điều Hành & Giám Sát Công Việc Của Nhà Trường:
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/60">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px]">1</span>
                  GV/NV Báo Cáo
                </div>
                <div className="text-[11px] text-amber-700 mt-1">Lập kế hoạch & đề xuất công việc</div>
              </div>
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/60">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[10px]">2</span>
                  HT Phê Duyệt
                </div>
                <div className="text-[11px] text-blue-700 mt-1">Bút phê & giao hạn chót hoàn thành</div>
              </div>
              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/60">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-[10px]">3</span>
                  Triển Khai Làm
                </div>
                <div className="text-[11px] text-indigo-700 mt-1">Cập nhật tiến độ 0% ➔ 100%</div>
              </div>
              <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200/60">
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-[10px]">4</span>
                  Báo Cáo Kết Quả
                </div>
                <div className="text-[11px] text-purple-700 mt-1">Nộp minh chứng & số liệu nghiệm thu</div>
              </div>
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/60">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px]">5</span>
                  HT Nhận Xét
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">Chấm điểm & xếp loại công việc</div>
              </div>
              <div className="p-3 bg-cyan-50/80 rounded-xl border border-cyan-200/60">
                <div className="font-bold text-cyan-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-200 text-cyan-800 flex items-center justify-center text-[10px]">6</span>
                  Công Khai / Nội Bộ
                </div>
                <div className="text-[11px] text-cyan-700 mt-1">Do Hiệu trưởng toàn quyền quyết định</div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề, người nộp, mã số..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả trạng thái bước ({workflows.length})</option>
                <option value="B1_CHO_HT_DUYET">Bước 1: Chờ HT duyệt</option>
                <option value="B2_HT_DA_DUYET">Bước 2: HT đã duyệt</option>
                <option value="B3_DANG_THUC_HIEN">Bước 3: Đang thực hiện</option>
                <option value="B4_CHO_HT_DANH_GIA">Bước 4: Chờ HT nhận xét</option>
                <option value="B5_HT_DA_DANH_GIA">Bước 5 & 6: Đã hoàn tất</option>
              </select>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả Phân hiệu</option>
                <option value="Trụ sở chính">Trụ sở chính Đồng Xuân</option>
                <option value="La Hai">Phân hiệu TH La Hai</option>
                <option value="Xuân Long">Phân hiệu TH & THCS Xuân Long</option>
                <option value="Xuân Quang 2">Phân hiệu TH & THCS Xuân Quang 2</option>
              </select>
            </div>

            <div className="text-slate-500 text-xs">
              Hiển thị: <strong>{filteredWorkflows.length}</strong> / {workflows.length} hồ sơ công việc
            </div>
          </div>

          {/* Workflow List */}
          <div className="space-y-4">
            {filteredWorkflows.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <div className="font-semibold text-slate-700">Không tìm thấy báo cáo công việc nào phù hợp</div>
                <p className="text-xs text-slate-400 mt-1">Hãy bấm "Tạo Báo Cáo Kế Hoạch (B1)" để bắt đầu quy trình làm việc mới.</p>
              </div>
            ) : (
              filteredWorkflows.map((item) => {
                const badge = getStepBadge(item.status);
                const isCreator = currentUser?.id === item.creatorId;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-indigo-300 transition-all space-y-4"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {item.code}
                        </span>
                        <span className="font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {item.categoryLabel}
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-600 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" /> {item.branchName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${badge.bg}`}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                        {item.isPublicAnnounced && (
                          <span className="bg-cyan-100 text-cyan-800 border border-cyan-300 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Công khai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Content & Goals */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        {item.proposalContent}
                      </p>
                      {item.expectedGoal && (
                        <div className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                          <strong className="text-slate-700 shrink-0">Mục tiêu dự kiến:</strong>
                          <span>{item.expectedGoal}</span>
                        </div>
                      )}
                    </div>

                    {/* 6-Step Visual Progress Stepper Bar */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                      <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                          ✓ B1: Đã nộp đề xuất ({item.creatorName})
                        </div>
                        <div
                          className={`p-1.5 rounded-lg font-bold border ${
                            item.approvedAt
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : item.status === 'B1_CHO_HT_DUYET'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                              : 'bg-slate-200 text-slate-500 border-slate-300'
                          }`}
                        >
                          {item.approvedAt ? '✓ B2: HT Đã duyệt' : 'B2: Chờ HT duyệt'}
                        </div>
                        <div
                          className={`p-1.5 rounded-lg font-bold border ${
                            item.executionProgress === 100
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : item.executionProgress > 0
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : 'bg-slate-200 text-slate-500 border-slate-300'
                          }`}
                        >
                          B3: Tiến độ ({item.executionProgress}%)
                        </div>
                        <div
                          className={`p-1.5 rounded-lg font-bold border ${
                            item.resultCompletedDate
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : item.status === 'B4_CHO_HT_DANH_GIA'
                              ? 'bg-purple-100 text-purple-800 border-purple-300 animate-pulse'
                              : 'bg-slate-200 text-slate-500 border-slate-300'
                          }`}
                        >
                          {item.resultCompletedDate ? '✓ B4: Đã nộp kết quả' : 'B4: Nộp kết quả'}
                        </div>
                        <div
                          className={`p-1.5 rounded-lg font-bold border ${
                            item.status === 'B5_HT_DA_DANH_GIA'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-200 text-slate-500 border-slate-300'
                          }`}
                        >
                          {item.status === 'B5_HT_DA_DANH_GIA'
                            ? `✓ B5: HT Đã nhận xét (${item.principalScore}đ)`
                            : 'B5: HT Nhận xét'}
                        </div>
                      </div>
                    </div>

                    {/* Step Details Expanders */}
                    {/* Bút phê chỉ đạo của HT (Bước 2) */}
                    {item.approvalDirectives && (
                      <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs">
                        <div className="font-bold text-blue-900 flex items-center justify-between">
                          <span>Chỉ đạo / Bút phê của {item.approvedByName || 'Hiệu trưởng'}:</span>
                          <span className="text-[11px] text-blue-600 font-normal">{item.approvedAt}</span>
                        </div>
                        <div className="text-blue-800 mt-1 italic">"{item.approvalDirectives}"</div>
                        {item.approvalAdjustedDeadline && (
                          <div className="text-[11px] text-blue-700 font-semibold mt-1">
                            Hạn hoàn thành điều chỉnh: {item.approvalAdjustedDeadline}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Báo cáo kết quả của GV/NV (Bước 4) */}
                    {item.resultSummary && (
                      <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-xs">
                        <div className="font-bold text-purple-900 flex items-center justify-between">
                          <span>Báo cáo kết quả nghiệm thu (Nộp ngày {item.resultCompletedDate}):</span>
                          {item.resultDriveUrl && (
                            <a
                              href={item.resultDriveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              📁 Mở Google Drive minh chứng
                            </a>
                          )}
                        </div>
                        <div className="text-purple-800 mt-1">{item.resultSummary}</div>
                      </div>
                    )}

                    {/* Nhận xét & Quyết định của HT (Bước 5 & 6) */}
                    {item.principalFeedback && (
                      <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                        <div className="font-bold text-emerald-900 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span>Thẩm định của {item.evaluatedByName || 'Hiệu trưởng Nguyễn Quốc Bảo'}:</span>
                            <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-black text-xs">
                              {item.principalScore} / 10 Điểm
                            </span>
                          </span>
                          <span className="text-[11px] text-emerald-600">{item.evaluatedAt}</span>
                        </div>
                        <div className="text-emerald-800 italic">"{item.principalFeedback}"</div>
                        <div className="flex flex-wrap items-center justify-between pt-1 border-t border-emerald-200/60 text-[11px]">
                          <span className="text-emerald-700 font-semibold">
                            Quyết định phổ biến:{' '}
                            {item.isPublicAnnounced ? (
                              <strong className="text-cyan-700">🟢 CÔNG KHAI TOÀN TRƯỜNG</strong>
                            ) : (
                              <strong className="text-slate-600">🔒 LƯU NỘI BỘ CÁ NHÂN</strong>
                            )}
                          </span>
                          {item.awardCommendationTitle && (
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              🏆 {item.awardCommendationTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom Metadata & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex flex-wrap items-center gap-3 text-slate-500">
                        <span>
                          Người lập: <strong>{item.creatorName}</strong> ({item.creatorPosition})
                        </span>
                        <span>•</span>
                        <span>
                          Hạn chót: <strong>{item.deadline}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Tuần {item.cycleWeek} - Tháng {item.cycleMonth}
                        </span>
                      </div>

                      {/* Action buttons based on Role and Step */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Bước 2: Hiệu trưởng phê duyệt */}
                        {canApprove && item.status === 'B1_CHO_HT_DUYET' && (
                          <button
                            onClick={() => {
                              setSelectedWorkflowForApproval(item);
                              setApprovalDecision('APPROVE');
                              setApprovalDirectives('Đồng ý phê duyệt kế hoạch, đề nghị triển khai đúng tiến độ.');
                              setApprovalAdjustedDeadline(item.deadline);
                              setShowApproveModal(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                          >
                            <CheckSquare className="w-3.5 h-3.5" /> Phê Duyệt (B2)
                          </button>
                        )}

                        {/* Bước 3: Cập nhật tiến độ thực hiện */}
                        {(isCreator || canApprove) &&
                          (item.status === 'B2_HT_DA_DUYET' || item.status === 'B3_DANG_THUC_HIEN') && (
                            <button
                              onClick={() => {
                                setSelectedWorkflowForProgress(item);
                                setProgressPercentInput(item.executionProgress || 50);
                                setProgressNotesInput('');
                                setShowProgressModal(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded-xl transition flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5" /> Cập Nhật Tiến Độ (B3)
                            </button>
                          )}

                        {/* Bước 4: Nộp Báo cáo Kết quả */}
                        {(isCreator || canApprove) &&
                          (item.status === 'B2_HT_DA_DUYET' || item.status === 'B3_DANG_THUC_HIEN') && (
                            <button
                              onClick={() => {
                                setSelectedWorkflowForSubmit(item);
                                setResultSummaryInput('');
                                setResultDriveUrlInput('');
                                setShowSubmitResultModal(true);
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" /> Nộp Báo Cáo Kết Quả (B4)
                            </button>
                          )}

                        {/* Bước 5 & 6: Hiệu trưởng Nhận xét & Quyết định Công khai */}
                        {canApprove && (item.status === 'B4_CHO_HT_DANH_GIA' || item.status === 'B5_HT_DA_DANH_GIA') && (
                          <button
                            onClick={() => {
                              setSelectedWorkflowForEvaluation(item);
                              setEvalScoreInput(item.principalScore || 9.0);
                              setEvalRatingInput(item.principalRating || 'XUAT_SAC');
                              setEvalFeedbackInput(item.principalFeedback || 'Biểu dương tinh thần chủ động, hoàn thành xuất sắc mục tiêu đề ra.');
                              setEvalFeedbackType(item.feedbackType || 'KHEN_THUONG');
                              setEvalAwardTitle(item.awardCommendationTitle || '');
                              setEvalIsPublic(item.isPublicAnnounced ?? true);
                              setShowEvaluateModal(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {item.status === 'B5_HT_DA_DANH_GIA' ? 'Sửa Nhận Xét & Công Khai (B5/6)' : 'HT Nhận Xét & Quyết Định (B5/6)'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: THỐNG KÊ ĐÁNH GIÁ NHÂN VIÊN (TUẦN - THÁNG - NĂM)   */}
      {/* ========================================================= */}
      {activeTab === 'periodic_statistics' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bảng Thống Kê Đánh Giá Kết Quả Công Việc 137 CB-GV-NV Đồng Xuân
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động tổng hợp số lượng việc đã làm, tỷ lệ hoàn thành đúng hạn, điểm KPI trung bình và xếp loại viên chức chuẩn theo chu kỳ.
                </p>
              </div>

              {/* Cycle Period Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setPeriodType('WEEK')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      periodType === 'WEEK' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📅 Cuối Tuần
                  </button>
                  <button
                    onClick={() => setPeriodType('MONTH')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      periodType === 'MONTH' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📆 Cuối Tháng
                  </button>
                  <button
                    onClick={() => setPeriodType('YEAR')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      periodType === 'YEAR' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏆 Cả Năm Học
                  </button>
                </div>

                {periodType === 'WEEK' && (
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Tuần {w} (Năm học 2026-2027)
                      </option>
                    ))}
                  </select>
                )}

                {periodType === 'MONTH' && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    {[9, 10, 11, 12, 1, 2, 3, 4, 5].map((m) => (
                      <option key={m} value={m}>
                        Tháng {m} / 2026-2027
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={handleExportEvaluationCsv}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất File Excel
                </button>
              </div>
            </div>

            {/* Quick Rank Filter & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm cán bộ, giáo viên..."
                  value={statsSearchTerm}
                  onChange={(e) => setStatsSearchTerm(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-60 focus:bg-white focus:outline-none"
                />
                <select
                  value={statsRankFilter}
                  onChange={(e) => setStatsRankFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="ALL">Tất cả xếp loại</option>
                  <option value="A">Loại A - Xuất sắc</option>
                  <option value="B">Loại B - Tốt</option>
                  <option value="C">Loại C - Đạt</option>
                  <option value="D">Loại D - Chưa đạt</option>
                </select>
              </div>

              <div className="text-slate-500">
                Thống kê: <strong>{evaluationSummaries.length}</strong> cán bộ - giáo viên - nhân viên
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Phân Bố Xếp Loại Viên Chức
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rankDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                      paddingAngle={4}
                    >
                      {rankDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
                {rankDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}: <strong>{item.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Điểm Đánh Giá & Hiệu Suất Công Việc Top Đầu
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evaluationSummaries.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="staffName" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="averageScore" name="Điểm Đánh Giá" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completedCount" name="Việc Hoàn Thành" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">STT</th>
                    <th className="py-3 px-3">Họ và Tên</th>
                    <th className="py-3 px-3">Chức Vụ</th>
                    <th className="py-3 px-3">Phân Hiệu</th>
                    <th className="py-3 px-3 text-center">Tổng Việc</th>
                    <th className="py-3 px-3 text-center">Đã Duyệt</th>
                    <th className="py-3 px-3 text-center">Hoàn Thành</th>
                    <th className="py-3 px-3 text-center">Đúng Hạn</th>
                    <th className="py-3 px-3 text-center">Khen / Nhắc</th>
                    <th className="py-3 px-3 text-center">Điểm KPI</th>
                    <th className="py-3 px-3 text-center">Tỷ Lệ %</th>
                    <th className="py-3 px-3 text-center">Xếp Loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {evaluationSummaries.map((item, idx) => (
                    <tr key={item.staffId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {item.staffName}
                        <div className="text-[10px] text-slate-400 font-mono">{item.staffId}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{item.position}</td>
                      <td className="py-3 px-3 text-slate-600">{item.branchName}</td>
                      <td className="py-3 px-3 text-center font-bold">{item.totalAssignedOrReported}</td>
                      <td className="py-3 px-3 text-center text-blue-700">{item.approvedCount}</td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-bold">{item.completedCount}</td>
                      <td className="py-3 px-3 text-center text-emerald-600">{item.onTimeCount}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-emerald-700 font-bold">+{item.praisedCount}</span> /{' '}
                        <span className="text-rose-600 font-bold">-{item.remindedCount}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-black text-slate-900">
                        {item.averageScore.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-semibold ${
                            item.completionRate >= 90
                              ? 'text-emerald-700'
                              : item.completionRate >= 70
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {item.completionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            item.tierRank === 'A'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.tierRank === 'B'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : item.tierRank === 'C'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          Loại {item.tierRank}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: BẢNG TIN CÔNG KHAI & PHẢN HỒI CÁ NHÂN              */}
      {/* ========================================================= */}
      {activeTab === 'public_board' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Bảng Tin Khen Thưởng & Thông Báo Công Khai Toàn Trường
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Chỉ các báo cáo công việc và thành tích được <strong>Hiệu trưởng quyết định CÔNG KHAI</strong> mới hiển thị tại đây để toàn thể cán bộ, giáo viên và nhân viên noi gương, học tập.
            </p>
          </div>

          {/* Public Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {publicWorkflows.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                      Điểm: {item.principalScore} / 10
                    </span>
                    <span className="text-slate-400 text-[11px]">{item.publicAnnouncedAt || item.evaluatedAt}</span>
                  </div>

                  {item.awardCommendationTitle && (
                    <div className="mb-2 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {item.awardCommendationTitle}
                    </div>
                  )}

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h3>

                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    "{item.principalFeedback}"
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 text-xs flex items-center justify-between text-slate-500">
                  <div>
                    <div className="font-semibold text-slate-800">{item.creatorName}</div>
                    <div className="text-[11px] text-slate-400">{item.creatorPosition}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">{item.branchName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section: Phản Hồi Riêng Của Cá Nhân (Nếu Có) */}
          {myPrivateWorkflows.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                Hòm Thư Phản Hồi Riêng Từ Hiệu Trưởng (Chỉ riêng bạn nhìn thấy):
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPrivateWorkflows.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-sm">
                    <div className="font-bold text-slate-900">{item.title}</div>
                    <div className="text-slate-700 mt-1 italic">"{item.principalFeedback}"</div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span>Điểm: {item.principalScore}đ - Xếp loại: {item.principalRating}</span>
                      <span>Ngày nhận: {item.evaluatedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: TRUNG TÂM BẢO MẬT, PHÂN QUYỀN & CƠ SỞ DỮ LIỆU       */}
      {/* ========================================================= */}
      {activeTab === 'security_database' && (
        <div className="space-y-6">
          {/* Security & RBAC Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Cơ Chế Bảo Mật Hệ Thống */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Cơ Chế Bảo Mật & An Ninh Mạng
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-700 font-medium">Bắt buộc mật khẩu phức tạp:</span>
                  <span className="font-bold text-emerald-700">BẬT (Chuẩn AES/Salt)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-700 font-medium">Chống Brute-force (5 lần sai):</span>
                  <span className="font-bold text-emerald-700">Khóa 5 phút</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-700 font-medium">Tự động khóa phiên không dùng:</span>
                  <span className="font-bold text-emerald-700">{securityConfig.sessionInactivityTimeoutMinutes} Phút</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-700 font-medium">Mã PIN xác thực Hiệu trưởng:</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {isHT ? securityConfig.htAuthorizationPin : '••••'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-700 font-medium">Kiểm tra toàn vẹn CSDL:</span>
                  <span className="font-bold text-emerald-700">BẬT (SHA-256 Signature)</span>
                </div>
              </div>
            </div>

            {/* Card 2: Ma Trận Phân Quyền (RBAC) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Lock className="w-5 h-5 text-amber-600" />
                Ma Trận Phân Quyền Vai Trò (RBAC)
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-red-50/70 rounded-xl border border-red-100">
                  <div className="font-bold text-red-900">1. Hiệu Trưởng (HT) - Toàn Quyền</div>
                  <div className="text-[11px] text-red-700 mt-0.5">Duyệt mọi báo cáo, nhận xét, quyết định công khai, xem sổ quỹ và quản trị bảo mật.</div>
                </div>
                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-100">
                  <div className="font-bold text-amber-900">2. Phó Hiệu Trưởng (PHT) - Phân Hiệu</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">Duyệt công việc cho phân hiệu phụ trách (Xuân Long, La Hai, Xuân Quang 2).</div>
                </div>
                <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
                  <div className="font-bold text-blue-900">3. Giáo Viên & Nhân Viên (GV / NV)</div>
                  <div className="text-[11px] text-blue-700 mt-0.5">Gửi báo cáo kế hoạch, cập nhật tiến độ, nộp báo cáo kết quả, xem tin công khai.</div>
                </div>
              </div>
            </div>

            {/* Card 3: Thao Tác Cơ Sở Dữ Liệu */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Database className="w-5 h-5 text-cyan-600" />
                Quản Trị Cơ Sở Dữ Liệu Toàn Trường
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 font-mono text-[11px] text-slate-700">
                  <div>Signature: {storageService.calculateDatabaseChecksum()}</div>
                  <div className="text-slate-500 mt-1">137 CB-GV-NV • 57 Lớp • {workflows.length} Công việc</div>
                </div>

                <button
                  onClick={handleExportFullBackup}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Sao Lưu CSDL (JSON + Checksum)
                </button>

                <label className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200">
                  <Upload className="w-4 h-4" /> Phục Hồi CSDL Từ Tệp Sao Lưu
                  <input type="file" accept=".json" onChange={handleRestoreBackupFile} className="hidden" />
                </label>

                {isHT && (
                  <button
                    onClick={handleFactoryReset}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-rose-200"
                  >
                    <RefreshCw className="w-4 h-4" /> Khôi Phục CSDL Gốc Nhà Trường
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Security Audit Trail Table */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Nhật Ký An Ninh Mạng & Kiểm Toán Hệ Thống (Security Audit Trail):
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Thời Gian</th>
                    <th className="py-2.5 px-3">Người Dùng</th>
                    <th className="py-2.5 px-3">Sự Kiện</th>
                    <th className="py-2.5 px-3">Mức Độ</th>
                    <th className="py-2.5 px-3">Chi Tiết Sự Kiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{log.timestamp}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {log.userName || 'Hệ thống'} ({log.userRole || 'SYS'})
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{log.event}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : log.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: TẠO BÁO CÁO KẾ HOẠCH MỚI (BƯỚC 1)                 */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                Bước 1: Nộp Báo Cáo Kế Hoạch / Đề Xuất Công Việc
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu đề báo cáo / công việc *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kế hoạch hội giảng chuyên đề khối 1..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân loại nhiệm vụ</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs"
                  >
                    <option value="CHUYEN_MON_DAY_HOC">Chuyên môn & Giảng dạy</option>
                    <option value="HOI_GIANG_THI_DUA">Hội giảng & Thi đua</option>
                    <option value="CONG_TAC_CHU_NHIEM">Công tác Chủ nhiệm</option>
                    <option value="HO_SO_SO_SACH">Hồ sơ sổ sách</option>
                    <option value="CO_SO_VAT_CHAT">Cơ sở vật chất</option>
                    <option value="TAI_CHINH_KE_TOAN">Tài chính & Kế toán</option>
                    <option value="VAN_THU_CONG_VAN">Văn thư & Công văn</option>
                    <option value="Y_TE_HOC_DUONG">Y tế học đường</option>
                    <option value="AN_NINH_BAO_VE">An ninh & Bảo vệ</option>
                    <option value="NHIEM_VU_DOT_XUAT">Nhiệm vụ đột xuất</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hạn chót hoàn thành *</label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung chi tiết kế hoạch / nhiệm vụ *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Nêu rõ phương pháp, nội dung triển khai, đối tượng áp dụng..."
                  value={newProposalContent}
                  onChange={(e) => setNewProposalContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mục tiêu dự kiến đạt được</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 100% học sinh đạt yêu cầu..."
                  value={newExpectedGoal}
                  onChange={(e) => setNewExpectedGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tuần học</label>
                  <input
                    type="number"
                    min={1}
                    max={35}
                    value={newCycleWeek}
                    onChange={(e) => setNewCycleWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tháng đánh giá</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newCycleMonth}
                    onChange={(e) => setNewCycleMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md"
                >
                  Gửi Phê Duyệt Lên BGH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: HIỆU TRƯỞNG PHÊ DUYỆT (BƯỚC 2)                   */}
      {/* ========================================================= */}
      {showApproveModal && selectedWorkflowForApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                Bước 2: Ban Giám Hiệu Phê Duyệt Kế Hoạch
              </h3>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleApproveWorkflow} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800">{selectedWorkflowForApproval.title}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Người đề xuất: {selectedWorkflowForApproval.creatorName} ({selectedWorkflowForApproval.creatorPosition})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Quyết định phê duyệt *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('APPROVE')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                      approvalDecision === 'APPROVE'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✓ Đồng Ý Duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('REQUEST_CHANGE')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                      approvalDecision === 'REQUEST_CHANGE'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✏️ Yêu Cầu Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('REJECT')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                      approvalDecision === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✕ Từ Chối
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chỉ đạo / Bút phê dặn dò của Hiệu trưởng *</label>
                <textarea
                  required
                  rows={3}
                  value={approvalDirectives}
                  onChange={(e) => setApprovalDirectives(e.target.value)}
                  placeholder="Ghi chú ý kiến chỉ đạo, hỗ trợ phương tiện, giáo cụ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hạn chót hoàn thành (nếu điều chỉnh)</label>
                <input
                  type="date"
                  value={approvalAdjustedDeadline}
                  onChange={(e) => setApprovalAdjustedDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-md"
                >
                  Xác Nhận Bút Phê
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CẬP NHẬT TIẾN ĐỘ THỰC HIỆN (BƯỚC 3)               */}
      {/* ========================================================= */}
      {showProgressModal && selectedWorkflowForProgress && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Bước 3: Cập Nhật Tiến Độ Thực Hiện
              </h3>
              <button onClick={() => setShowProgressModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUpdateProgress} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Tiến độ hoàn thành: {progressPercentInput}%</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progressPercentInput}
                  onChange={(e) => setProgressPercentInput(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú công việc đã làm *</label>
                <textarea
                  required
                  rows={3}
                  value={progressNotesInput}
                  onChange={(e) => setProgressNotesInput(e.target.value)}
                  placeholder="Ví dụ: Đã hoàn thành 50% giáo cụ, chuẩn bị buổi dạy thử..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md"
                >
                  Cập Nhật Tiến Độ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: NỘP BÁO CÁO KẾT QUẢ NGHIỆM THU (BƯỚC 4)           */}
      {/* ========================================================= */}
      {showSubmitResultModal && selectedWorkflowForSubmit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-600" />
                Bước 4: Nộp Báo Cáo Kết Quả Nghiệm Thu
              </h3>
              <button onClick={() => setShowSubmitResultModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmitResult} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tóm tắt kết quả đạt được thực tế *</label>
                <textarea
                  required
                  rows={4}
                  value={resultSummaryInput}
                  onChange={(e) => setResultSummaryInput(e.target.value)}
                  placeholder="Nêu rõ số liệu, tỷ lệ hoàn thành, mức độ đạt được so với mục tiêu ban đầu..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link Google Drive thư mục minh chứng (ảnh, tài liệu)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={resultDriveUrlInput}
                  onChange={(e) => setResultDriveUrlInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitResultModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-md"
                >
                  Nộp Báo Cáo Lên Hiệu Trưởng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: HT NHẬN XÉT, CHẤM ĐIỂM & QUYẾT ĐỊNH CÔNG KHAI    */}
      {/* ========================================================= */}
      {showEvaluateModal && selectedWorkflowForEvaluation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Bước 5 & 6: Hiệu Trưởng Nhận Xét & Quyết Định Công Khai
              </h3>
              <button onClick={() => setShowEvaluateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleEvaluateAndDecide} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800">{selectedWorkflowForEvaluation.title}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Người thực hiện: <strong>{selectedWorkflowForEvaluation.creatorName}</strong> ({selectedWorkflowForEvaluation.creatorPosition})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Điểm đánh giá (thang 10) *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.1}
                    required
                    value={evalScoreInput}
                    onChange={(e) => setEvalScoreInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Xếp loại công việc *</label>
                  <select
                    value={evalRatingInput}
                    onChange={(e) => setEvalRatingInput(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="XUAT_SAC">Xuất sắc (9.0 - 10.0)</option>
                    <option value="TOT">Tốt (7.5 - 8.9)</option>
                    <option value="DAT">Đạt (5.0 - 7.4)</option>
                    <option value="CAN_CO_GANG">Cần cố gắng (3.5 - 4.9)</option>
                    <option value="CHUA_DAT">Chưa đạt (&lt; 3.5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hình thức đánh giá</label>
                <select
                  value={evalFeedbackType}
                  onChange={(e) => setEvalFeedbackType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="KHEN_THUONG">Khen thưởng & Biểu dương (+)</option>
                  <option value="DONG_VIEN">Động viên & Khích lệ</option>
                  <option value="GOP_Y">Góp ý chuyên môn</option>
                  <option value="NHAC_NHO">Nhắc nhở & Phê bình (-)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhận xét chi tiết của Hiệu trưởng *</label>
                <textarea
                  required
                  rows={3}
                  value={evalFeedbackInput}
                  onChange={(e) => setEvalFeedbackInput(e.target.value)}
                  placeholder="Ghi nhận xét cụ thể về phương pháp, tác phong và kết quả..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên danh hiệu khen thưởng (nếu có)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Gương sáng giáo viên đổi mới sáng tạo..."
                  value={evalAwardTitle}
                  onChange={(e) => setEvalAwardTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* BƯỚC 6: QUYẾT ĐỊNH CÔNG KHAI HOẶC KHÔNG CÔNG KHAI */}
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Bước 6: Quyết Định Công Khai (Do Hiệu Trưởng Toàn Quyền Quyết Định)
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setEvalIsPublic(true)}
                    className={`p-3 rounded-xl border text-left transition ${
                      evalIsPublic
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Eye className="w-4 h-4" /> 🟢 Công Khai Toàn Trường
                    </div>
                    <div className="text-[10px] mt-1 opacity-90">
                      Tự động đưa lên Bảng tin & Bảng vàng khen thưởng của trường.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEvalIsPublic(false)}
                    className={`p-3 rounded-xl border text-left transition ${
                      !evalIsPublic
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <EyeOff className="w-4 h-4" /> 🔒 Không Công Khai (Nội Bộ)
                    </div>
                    <div className="text-[10px] mt-1 opacity-90">
                      Chỉ gửi nhận xét riêng cho cá nhân GV/NV; đồng nghiệp khác không thấy.
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEvaluateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md"
                >
                  Lưu Đánh Giá & Quyết Định
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: XÁC THỰC MÃ PIN BẢO MẬT HIỆU TRƯỞNG              */}
      {/* ========================================================= */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Xác Thực Mã PIN Hiệu Trưởng</h3>
              <p className="text-xs text-slate-500 mt-1">
                Thao tác quản trị cấp cao yêu cầu mã PIN bảo mật của Thầy Nguyễn Quốc Bảo (Mặc định: <strong>2026</strong>).
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-3 text-xs">
              <input
                type="password"
                required
                maxLength={8}
                autoFocus
                placeholder="Nhập mã PIN bảo mật..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {pinError && <div className="text-rose-600 text-center font-medium text-[11px]">{pinError}</div>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md"
                >
                  Xác Nhận PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
