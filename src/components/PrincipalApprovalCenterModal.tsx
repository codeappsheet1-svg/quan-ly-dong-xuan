import React, { useState } from 'react';
import {
  UserAccount,
  LeaveRequest,
  FacilityRepairProposal,
  InternalExpenseItem,
  WorkWorkflowItem,
  WorkflowStepStatus,
} from '../types/school';
import { storageService } from '../services/storageService';
import { cloudSyncService } from '../services/cloudSyncService';
import {
  CheckCircle2,
  XCircle,
  FileCheck2,
  Clock,
  Send,
  Wrench,
  DollarSign,
  Briefcase,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  isFullPrincipal,
  isVicePrincipal,
  getPhtAssignedBranch,
} from '../utils/permissionUtils';

interface PrincipalApprovalCenterModalProps {
  isOpen: boolean;
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  allStaff: Array<{ account: UserAccount }>;
  onClose: () => void;
  onRefreshData: () => void;
}

export const PrincipalApprovalCenterModal: React.FC<PrincipalApprovalCenterModalProps> = ({
  isOpen,
  currentUser,
  activeSchoolYear,
  allStaff,
  onClose,
  onRefreshData,
}) => {
  const isPrincipal = isFullPrincipal(currentUser);
  const isVicePrincipalUser = isVicePrincipal(currentUser);
  const isBgh = isPrincipal || isVicePrincipalUser;
  const phtBranch = getPhtAssignedBranch(currentUser);

  const [activeTab, setActiveTab] = useState<'pending' | 'submit_new'>(() =>
    isBgh ? 'pending' : 'submit_new'
  );
  const [actionCategory, setActionCategory] = useState<'all' | 'leaves' | 'facilities' | 'expenses' | 'workflows'>('all');

  // Submit new request state
  const [newRequestType, setNewRequestType] = useState<'leave' | 'facility' | 'expense' | 'workflow'>('leave');
  const [leaveData, setLeaveData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    attachedPlan: 'Đã bàn giao giáo án và công việc chu đáo.',
  });
  const [facilityData, setFacilityData] = useState({
    title: '',
    location: 'Trụ sở chính',
    description: '',
    estimatedCost: 500000,
    urgency: 'Khẩn cấp' as 'Bình thường' | 'Cần gấp' | 'Khẩn cấp',
  });
  const [expenseData, setExpenseData] = useState({
    title: '',
    category: 'Văn phòng phẩm' as 'Văn phòng phẩm' | 'Tiếp khách & Hội nghị' | 'Sửa chữa CSVC nhỏ' | 'Xăng xe & Công tác phí' | 'Khen thưởng phong trào' | 'Hoạt động chuyên môn' | 'Khác',
    amount: 1000000,
    content: 'Chi thanh toán phục vụ hoạt động nhà trường',
  });
  const [workflowData, setWorkflowData] = useState({
    title: '',
    category: 'CHUYEN_MON_DAY_HOC' as any,
    proposalContent: '',
  });

  const [approvalNote, setApprovalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Fetch pending items
  const leaves = storageService.getLeaves(activeSchoolYear);
  const pendingLeaves = leaves.filter((l) => l.status === 'Chờ duyệt');

  const facilities = storageService.getFacilities();
  const pendingFacilities = facilities.filter((f) => f.approvalStatus === 'Chờ HT duyệt');

  const expenses = storageService.getInternalExpenses(activeSchoolYear);
  const pendingExpenses = expenses.filter((e) => e.approvalStatus === 'CHO_HT_DUYET');

  const workflows = storageService.getWorkflows(activeSchoolYear);
  const pendingWorkflows = workflows.filter(
    (w) => w.status === 'B1_CHO_HT_DUYET' || w.status === 'B4_CHO_HT_DANH_GIA'
  );

  const totalPendingCount =
    pendingLeaves.length +
    pendingFacilities.length +
    pendingExpenses.length +
    pendingWorkflows.length;

  // Handle Approvals
  const handleApproveLeave = async (leaveId: string, status: 'Đã phê duyệt' | 'Từ chối') => {
    if (!currentUser) return;
    if (!isBgh) {
      setErrorMessage('Chỉ Ban Giám hiệu (Hiệu trưởng & Phó Hiệu trưởng) mới có thẩm quyền duyệt đơn nghỉ phép.');
      return;
    }
    const target = leaves.find((l) => l.id === leaveId);
    if (!isPrincipal && isVicePrincipalUser && phtBranch && target) {
      const branch = (target.branchName || target.campusName || '').toLowerCase();
      if (!branch.includes(phtBranch.toLowerCase())) {
        setErrorMessage(`Thầy ${currentUser.name} chỉ phụ trách duyệt phân hiệu ${phtBranch}. Đơn này thuộc ${target.campusName || target.branchName}.`);
        return;
      }
    }
    try {
      setIsSubmitting(true);
      await cloudSyncService.approveLeaveRequest(leaveId, status, currentUser, approvalNote);
      setSuccessMessage(
        status === 'Đã phê duyệt'
          ? 'Đã phê chuẩn đơn nghỉ phép thành công và lưu vào CSDL Firestore Cloud.'
          : 'Đã từ chối đơn nghỉ phép.'
      );
      setApprovalNote('');
      onRefreshData();
    } catch (err: any) {
      setErrorMessage('Lỗi xử lý duyệt đơn: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveFacility = async (
    proposalId: string,
    status: 'Đã duyệt' | 'Không duyệt'
  ) => {
    if (!currentUser) return;
    if (!isPrincipal) {
      setErrorMessage('Theo quy chế, duy nhất Hiệu trưởng Thầy Nguyễn Quốc Bảo có quyền duyệt kinh phí cơ sở vật chất.');
      return;
    }
    try {
      setIsSubmitting(true);
      await cloudSyncService.approveFacilityProposal(proposalId, status, currentUser, approvalNote);
      setSuccessMessage('Đã duyệt kinh phí đề xuất cơ sở vật chất thành công.');
      setApprovalNote('');
      onRefreshData();
    } catch (err: any) {
      setErrorMessage('Lỗi phê duyệt: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveExpense = async (expenseId: string, status: 'HT_DA_DUYET' | 'HT_TU_CHOI') => {
    if (!currentUser) return;
    if (!isPrincipal) {
      setErrorMessage('Theo quy chế tài chính, duy nhất Hiệu trưởng Thầy Nguyễn Quốc Bảo có thẩm quyền chuẩn chi thanh toán nội bộ.');
      return;
    }
    try {
      setIsSubmitting(true);
      await cloudSyncService.approveInternalExpense(expenseId, status, currentUser, approvalNote);
      setSuccessMessage(
        status === 'HT_DA_DUYET'
          ? 'Hiệu trưởng đã chuẩn chi thành công khoản tiền.'
          : 'Đã từ chối chuẩn chi khoản tiền.'
      );
      setApprovalNote('');
      onRefreshData();
    } catch (err: any) {
      setErrorMessage('Lỗi duyệt chi: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceWorkflow = async (
    workflowId: string,
    newStatus: WorkflowStepStatus,
    note?: string
  ) => {
    if (!currentUser) return;
    if (!isPrincipal) {
      setErrorMessage('Theo quy chế, duy nhất Hiệu trưởng Thầy Nguyễn Quốc Bảo có thẩm quyền phê duyệt quy trình công việc.');
      return;
    }
    try {
      setIsSubmitting(true);
      await cloudSyncService.advanceWorkflowItem(workflowId, newStatus, currentUser, note);
      setSuccessMessage('Đã phê duyệt và chuyển tiếp bước quy trình thành công.');
      onRefreshData();
    } catch (err: any) {
      setErrorMessage('Lỗi quy trình: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle New Submission
  const handleSubmitNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMessage('Vui lòng đăng nhập tài khoản cán bộ để gửi tờ trình.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (newRequestType === 'leave') {
        if (!leaveData.reason.trim()) {
          setErrorMessage('Vui lòng nhập lý do xin nghỉ phép.');
          setIsSubmitting(false);
          return;
        }
        await cloudSyncService.submitLeaveRequest({
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.position || currentUser.role,
          campusName: currentUser.campusName,
          branchName: currentUser.branchName,
          leaveType: 'Nghỉ việc riêng có lương',
          startDate: leaveData.startDate,
          endDate: leaveData.endDate,
          totalDays: 1,
          reason: leaveData.reason,
          attachedPlan: leaveData.attachedPlan,
          isPublic: true,
        });
        setSuccessMessage('Đã gửi tờ trình xin nghỉ phép lên Hiệu trưởng thành công (Lưu trên Cloud)!');
      } else if (newRequestType === 'facility') {
        if (!facilityData.title.trim()) {
          setErrorMessage('Vui lòng nhập tên hạng mục cơ sở vật chất cần sửa.');
          setIsSubmitting(false);
          return;
        }
        await cloudSyncService.submitFacilityProposal({
          title: facilityData.title,
          campusId: currentUser.campusId,
          campusName: currentUser.campusName,
          location: facilityData.location,
          category: 'Điện & Quạt mát',
          urgency: facilityData.urgency,
          estimatedCost: Number(facilityData.estimatedCost) || 0,
          proposerId: currentUser.id,
          proposerName: currentUser.name,
          proposerRole: currentUser.position,
          description: facilityData.description || 'Đề xuất sửa chữa phục vụ công tác dạy học',
        });
        setSuccessMessage('Đã lập phiếu đề xuất CSVC trình Hiệu trưởng phê duyệt thành công!');
      } else if (newRequestType === 'expense') {
        if (!expenseData.title.trim()) {
          setErrorMessage('Vui lòng nhập nội dung đề nghị chi.');
          setIsSubmitting(false);
          return;
        }
        await cloudSyncService.submitInternalExpense({
          schoolYear: activeSchoolYear,
          expenseCode: `PC-${Date.now().toString().slice(-4)}`,
          expenseDate: new Date().toISOString().split('T')[0],
          expenseLocation: currentUser.campusName,
          creatorId: currentUser.id,
          creatorName: currentUser.name,
          creatorRole: currentUser.position,
          spenderName: currentUser.name,
          title: expenseData.title,
          content: expenseData.content,
          amount: Number(expenseData.amount) || 0,
          expenseType: 'PHIEU_CHI_NOI_BO',
          category: expenseData.category,
        });
        setSuccessMessage('Đã lập phiếu đề nghị thanh toán gửi Hiệu trưởng chuẩn chi thành công!');
      } else if (newRequestType === 'workflow') {
        if (!workflowData.title.trim()) {
          setErrorMessage('Vui lòng nhập tiêu đề công việc / quy trình.');
          setIsSubmitting(false);
          return;
        }
        await cloudSyncService.submitWorkflowItem({
          code: `WF-${Date.now().toString().slice(-4)}`,
          schoolYear: activeSchoolYear,
          title: workflowData.title,
          category: workflowData.category,
          categoryLabel: 'Chuyên môn & Nhiệm vụ',
          branchName: currentUser.branchName,
          campusName: currentUser.campusName,
          creatorId: currentUser.id,
          creatorName: currentUser.name,
          creatorRole: currentUser.role,
          creatorPosition: currentUser.position,
          submittedAt: new Date().toISOString(),
          proposalContent: workflowData.proposalContent || 'Kế hoạch triển khai công việc',
          expectedGoal: 'Hoàn thành đúng tiến độ và chất lượng',
          deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          isPublicAnnounced: false,
          cycleWeek: 1,
          cycleMonth: 10,
          cycleSemester: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setSuccessMessage('Đã khởi tạo quy trình văn bản trình Hiệu trưởng duyệt thành công!');
      }

      onRefreshData();
      setActiveTab('pending');
    } catch (err: any) {
      setErrorMessage('Lỗi khi gửi trình duyệt: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-red-800 to-amber-700 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <FileCheck2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Trung Tâm Trình & Phê Duyệt Của Hiệu Trưởng
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[11px] shadow-sm">
                  {totalPendingCount} chờ duyệt
                </span>
              </div>
              <p className="text-xs text-red-100 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Trường TH & THCS Đồng Xuân • Dữ liệu thật đồng bộ Firestore Cloud</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Action Tabs & Current User Context */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending');
                setSuccessMessage('');
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-white text-red-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Danh Sách Chờ HT Duyệt ({totalPendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('submit_new');
                setSuccessMessage('');
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'submit_new'
                  ? 'bg-white text-red-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Lập Tờ Trình Mới Trình HT</span>
            </button>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span>Đang thao tác với tư cách:</span>
            <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              {currentUser ? `${currentUser.name} (${currentUser.position || currentUser.role})` : 'Chưa đăng nhập'}
            </span>
          </div>
        </div>

        {/* Alert Messages */}
        {successMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActionCategory('all')}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    actionCategory === 'all'
                      ? 'bg-red-700 border-red-700 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tất cả ({totalPendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActionCategory('leaves')}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    actionCategory === 'leaves'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Nghỉ phép ({pendingLeaves.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActionCategory('facilities')}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    actionCategory === 'facilities'
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cơ sở vật chất ({pendingFacilities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActionCategory('expenses')}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    actionCategory === 'expenses'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Chuẩn chi nội bộ ({pendingExpenses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActionCategory('workflows')}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    actionCategory === 'workflows'
                      ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Quy trình 6 bước ({pendingWorkflows.length})
                </button>
              </div>

              {totalPendingCount === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-700 text-sm">Tuyệt vời! Không còn tờ trình nào chờ duyệt.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Mọi hồ sơ nghỉ phép, sửa chữa và tài chính đã được Hiệu trưởng xử lý hoàn tất.
                  </p>
                </div>
              )}

              {/* SECTION 1: LEAVE REQUESTS */}
              {(actionCategory === 'all' || actionCategory === 'leaves') && pendingLeaves.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Đơn xin nghỉ phép chờ Hiệu trưởng duyệt ({pendingLeaves.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {pendingLeaves.map((leave) => (
                      <div
                        key={leave.id}
                        className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{leave.userName}</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Mã: {leave.id}
                            </span>
                            <span className="text-slate-500 text-[11px]">({leave.userRole})</span>
                          </div>
                          <div className="text-slate-600">
                            <strong>Thời gian nghỉ:</strong> Từ ngày {leave.startDate} đến ngày {leave.endDate} ({leave.totalDays} ngày)
                          </div>
                          <div className="text-slate-600">
                            <strong>Lý do:</strong> {leave.reason}
                          </div>
                          {leave.attachedPlan && (
                            <div className="text-blue-700 font-medium text-[11px]">
                              📋 Kế hoạch: <strong>{leave.attachedPlan}</strong>
                            </div>
                          )}
                        </div>

                        {/* Approval buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleApproveLeave(leave.id, 'Từ chối')}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition flex items-center gap-1 shadow-2xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Từ Chối</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleApproveLeave(leave.id, 'Đã phê duyệt')}
                            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1 active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>HT Phê Duyệt</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 2: FACILITY PROPOSALS */}
              {(actionCategory === 'all' || actionCategory === 'facilities') && pendingFacilities.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>Đề xuất sửa chữa cơ sở vật chất chờ duyệt ({pendingFacilities.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {pendingFacilities.map((fac) => (
                      <div
                        key={fac.id}
                        className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{fac.title}</span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Mã: {fac.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold">
                              {fac.urgency}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            <strong>Người đề xuất:</strong> {fac.proposerName} ({fac.proposerRole})
                          </div>
                          <div className="text-slate-600">
                            <strong>Mô tả:</strong> {fac.description}
                          </div>
                          <div className="text-amber-800 font-bold">
                            Kinh phí dự toán: {fac.estimatedCost?.toLocaleString()} VNĐ
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleApproveFacility(fac.id, 'Không duyệt')}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition flex items-center gap-1 shadow-2xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Từ Chối</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleApproveFacility(fac.id, 'Đã duyệt')}
                            className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1 active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>HT Duyệt Chi CSVC</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: INTERNAL EXPENSES */}
              {(actionCategory === 'all' || actionCategory === 'expenses') && pendingExpenses.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Đề nghị thanh toán & Chuẩn chi nội bộ ({pendingExpenses.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {pendingExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{exp.title}</span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Mã: {exp.id}
                            </span>
                            <span className="text-slate-500 text-[11px]">({exp.category})</span>
                          </div>
                          <div className="text-slate-600">
                            <strong>Người đề nghị:</strong> {exp.creatorName} ({exp.creatorRole})
                          </div>
                          <div className="text-emerald-700 font-extrabold text-sm">
                            Số tiền chuẩn chi: {exp.amount.toLocaleString()} VNĐ
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleApproveExpense(exp.id, 'HT_TU_CHOI')}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition flex items-center gap-1 shadow-2xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Từ Chối</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleApproveExpense(exp.id, 'HT_DA_DUYET')}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1 active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>HT Chuẩn Chi Tiền</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: WORKFLOW 6-STEP TASKS */}
              {(actionCategory === 'all' || actionCategory === 'workflows') && pendingWorkflows.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <span>Quy trình công việc 6 bước trình Hiệu trưởng ({pendingWorkflows.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {pendingWorkflows.map((wf) => (
                      <div
                        key={wf.id}
                        className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{wf.title}</span>
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                              {wf.status === 'B1_CHO_HT_DUYET' ? 'Bước 1: Chờ HT Duyệt' : 'Bước 4: Chờ HT Đánh Giá'}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            <strong>Chủ trì thực hiện:</strong> {wf.creatorName} ({wf.categoryLabel || wf.category})
                          </div>
                          {wf.proposalContent && (
                            <div className="text-slate-600 italic">"{wf.proposalContent}"</div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {wf.status === 'B1_CHO_HT_DUYET' ? (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleAdvanceWorkflow(wf.id, 'B2_HT_DA_DUYET')}
                              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1 active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>HT Phê Chuẩn Bước 1</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleAdvanceWorkflow(wf.id, 'B5_HT_DA_DANH_GIA', 'Đạt yêu cầu xuất sắc')}
                              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1 active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>HT Nghiệm Thu & Đánh Giá</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBMIT NEW REQUEST TAB */}
          {activeTab === 'submit_new' && (
            <form onSubmit={handleSubmitNewRequest} className="space-y-4 max-w-2xl mx-auto text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Tạo Tờ Trình Trực Tuyến Lưu Trực Tiếp Lên Cloud</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Hệ thống tự động đồng bộ lên Firebase Firestore. Hiệu trưởng Nguyễn Quốc Bảo sẽ nhận được thông báo xét duyệt ngay lập tức.
                  </p>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Loại tờ trình cần gửi:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRequestType('leave')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition flex flex-col items-center gap-1 ${
                      newRequestType === 'leave'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Xin Nghỉ Phép</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRequestType('facility')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition flex flex-col items-center gap-1 ${
                      newRequestType === 'facility'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>Sửa Chữa CSVC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRequestType('expense')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition flex flex-col items-center gap-1 ${
                      newRequestType === 'expense'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Đề Nghị Chuẩn Chi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRequestType('workflow')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition flex flex-col items-center gap-1 ${
                      newRequestType === 'workflow'
                        ? 'border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-500/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <span>Quy Trình 6 Bước</span>
                  </button>
                </div>
              </div>

              {/* LEAVE FORM */}
              {newRequestType === 'leave' && (
                <div className="space-y-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Từ ngày:</label>
                      <input
                        type="date"
                        required
                        value={leaveData.startDate}
                        onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Đến ngày:</label>
                      <input
                        type="date"
                        required
                        value={leaveData.endDate}
                        onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Lý do xin nghỉ:</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="VD: Đi công tác tập huấn chuyên môn, việc gia đình..."
                      value={leaveData.reason}
                      onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kế hoạch bàn giao:</label>
                    <input
                      type="text"
                      value={leaveData.attachedPlan}
                      onChange={(e) => setLeaveData({ ...leaveData, attachedPlan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* FACILITY FORM */}
              {newRequestType === 'facility' && (
                <div className="space-y-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hạng mục cần sửa chữa / mua sắm:</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Thay bóng đèn led phòng tin học, sửa máy chiếu phòng họp..."
                      value={facilityData.title}
                      onChange={(e) => setFacilityData({ ...facilityData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mức độ khẩn:</label>
                      <select
                        value={facilityData.urgency}
                        onChange={(e) => setFacilityData({ ...facilityData, urgency: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Bình thường">Bình thường</option>
                        <option value="Cần gấp">Cần gấp</option>
                        <option value="Khẩn cấp">Khẩn cấp (Ảnh hưởng dạy học)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Kinh phí ước tính (VNĐ):</label>
                      <input
                        type="number"
                        required
                        min="10000"
                        step="50000"
                        value={facilityData.estimatedCost}
                        onChange={(e) => setFacilityData({ ...facilityData, estimatedCost: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mô tả tình trạng hiện tại:</label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả chi tiết tình trạng hỏng hóc..."
                      value={facilityData.description}
                      onChange={(e) => setFacilityData({ ...facilityData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* EXPENSE FORM */}
              {newRequestType === 'expense' && (
                <div className="space-y-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nội dung đề nghị chuẩn chi:</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Chi thanh toán tiền in đề cương ôn tập thi cuối kỳ..."
                      value={expenseData.title}
                      onChange={(e) => setExpenseData({ ...expenseData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Khoản mục:</label>
                      <select
                        value={expenseData.category}
                        onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Văn phòng phẩm">Văn phòng phẩm</option>
                        <option value="Hoạt động chuyên môn">Hoạt động chuyên môn</option>
                        <option value="Khen thưởng phong trào">Khen thưởng phong trào</option>
                        <option value="Tiếp khách & Hội nghị">Tiếp khách & Hội nghị</option>
                        <option value="Sửa chữa CSVC nhỏ">Sửa chữa CSVC nhỏ</option>
                        <option value="Xăng xe & Công tác phí">Xăng xe & Công tác phí</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Số tiền đề nghị chi (VNĐ):</label>
                      <input
                        type="number"
                        required
                        min="50000"
                        step="100000"
                        value={expenseData.amount}
                        onChange={(e) => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* WORKFLOW FORM */}
              {newRequestType === 'workflow' && (
                <div className="space-y-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tiêu đề công việc:</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Kế hoạch tổ chức Hội thi Giáo viên dạy giỏi cấp trường..."
                      value={workflowData.title}
                      onChange={(e) => setWorkflowData({ ...workflowData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tóm tắt nội dung thực hiện:</label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả mục tiêu và phương án triển khai..."
                      value={workflowData.proposalContent}
                      onChange={(e) => setWorkflowData({ ...workflowData, proposalContent: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow-md transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang gửi trình lên Cloud...' : 'Trình Hiệu Trưởng Phê Duyệt'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Firestore Database: Online • Quyền phê chuẩn tối cao: Hiệu trưởng Nguyễn Quốc Bảo</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 transition"
          >
            Đóng bảng
          </button>
        </div>
      </div>
    </div>
  );
};
