import React, { useState, useMemo } from 'react';
import {
  SchoolFeedbackItem,
  UserAccount,
  FeedbackSenderType,
  FeedbackStatus,
  Role,
} from '../types/school';
import { storageService } from '../services/storageService';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Search,
  Lock,
  Globe,
  UserCheck,
  FileText,
  AlertCircle,
  Award,
  ChevronRight,
  PlusCircle,
  Eye,
  FileCheck,
  Check,
  X,
  Share2,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';

interface FeedbackHubProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  allStaff: Array<{ account: UserAccount }>;
  onRefreshData?: () => void;
}

export const FeedbackHub: React.FC<FeedbackHubProps> = ({
  currentUser,
  activeSchoolYear,
  allStaff,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PUBLIC' | 'SUBMIT' | 'MANAGEMENT'>('PUBLIC');
  const [feedbacks, setFeedbacks] = useState<SchoolFeedbackItem[]>(() =>
    storageService.getFeedbacks(activeSchoolYear)
  );

  // Search & Filter state for Public portal
  const [publicSearchTerm, setPublicSearchTerm] = useState('');
  const [publicCategoryFilter, setPublicCategoryFilter] = useState('ALL');

  // Search & Filter state for Management
  const [mgmtStatusFilter, setMgmtStatusFilter] = useState<string>('ALL');

  // New feedback form state
  const [formData, setFormData] = useState({
    senderType: (currentUser ? (currentUser.role === 'NV' || currentUser.role === 'NV_HD_BV' ? 'NV' : 'GV') : 'PHHS') as FeedbackSenderType,
    senderName: currentUser?.name || '',
    senderContact: currentUser?.phone || '',
    senderAffiliation: currentUser ? `${currentUser.position} - ${currentUser.branchName}` : '',
    isAnonymous: false,
    category: 'CHUYEN_MON' as SchoolFeedbackItem['category'],
    categoryLabel: 'Chuyên môn & Giảng dạy',
    title: '',
    content: '',
    attachmentUrl: '',
    attachmentName: '',
  });
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState(false);

  // Modals for HT actions
  const [assignModalItem, setAssignModalItem] = useState<SchoolFeedbackItem | null>(null);
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [assignedNote, setAssignedNote] = useState('');

  const [draftResponseModalItem, setDraftResponseModalItem] = useState<SchoolFeedbackItem | null>(null);
  const [draftText, setDraftText] = useState('');

  const [htApproveModalItem, setHtApproveModalItem] = useState<SchoolFeedbackItem | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [approveMode, setApproveMode] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');

  const [htDirectResolveModalItem, setHtDirectResolveModalItem] = useState<SchoolFeedbackItem | null>(null);
  const [directResolveNote, setDirectResolveNote] = useState('');
  const [directResolvePublic, setDirectResolvePublic] = useState(true);

  // Reload data
  const refreshFeedbacks = () => {
    const list = storageService.getFeedbacks(activeSchoolYear);
    setFeedbacks(list);
    if (onRefreshData) onRefreshData();
  };

  const isPrincipal = currentUser?.role === 'HT';

  // Categories helper
  const categoryLabels: Record<SchoolFeedbackItem['category'], string> = {
    CHUYEN_MON: 'Chuyên môn & Giảng dạy',
    CO_SO_VAT_CHAT: 'Cơ sở vật chất & Sân chơi',
    NE_NEP_HOC_SINH: 'Nề nếp & Kỷ luật học sinh',
    VE_SINH_AN_TOAN: 'Vệ sinh & An toàn trường học',
    THU_CHI_TAI_CHINH: 'Minh bạch Thu chi & Tài chính',
    KHAC: 'Góp ý & Kiến nghị khác',
  };

  // Submit Feedback Handler
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    const attachments = formData.attachmentName.trim()
      ? [{ name: formData.attachmentName.trim(), url: formData.attachmentUrl.trim() || undefined, size: 'Đính kèm' }]
      : undefined;

    storageService.addFeedback(
      {
        schoolYear: activeSchoolYear,
        senderType: formData.senderType,
        senderName: formData.isAnonymous ? 'Người gửi xin ẩn danh' : formData.senderName.trim() || 'Người dùng hệ thống',
        senderContact: formData.isAnonymous ? undefined : formData.senderContact.trim() || undefined,
        senderAffiliation: formData.isAnonymous ? 'Ẩn danh' : formData.senderAffiliation.trim() || undefined,
        isAnonymous: formData.isAnonymous,
        category: formData.category,
        categoryLabel: categoryLabels[formData.category],
        title: formData.title.trim(),
        content: formData.content.trim(),
        attachments,
      },
      activeSchoolYear
    );

    refreshFeedbacks();
    setSubmitSuccessMsg(true);
    setFormData({
      senderType: (currentUser ? (currentUser.role === 'NV' || currentUser.role === 'NV_HD_BV' ? 'NV' : 'GV') : 'PHHS') as FeedbackSenderType,
      senderName: currentUser?.name || '',
      senderContact: currentUser?.phone || '',
      senderAffiliation: currentUser ? `${currentUser.position} - ${currentUser.branchName}` : '',
      isAnonymous: false,
      category: 'CHUYEN_MON',
      categoryLabel: 'Chuyên môn & Giảng dạy',
      title: '',
      content: '',
      attachmentUrl: '',
      attachmentName: '',
    });

    setTimeout(() => setSubmitSuccessMsg(false), 6000);
  };

  // Handler: HT Assigns feedback to staff
  const handleConfirmAssignment = () => {
    if (!assignModalItem || !assignedStaffId) return;
    const staff = allStaff.find((s) => s.account.id === assignedStaffId);
    if (!staff) return;

    storageService.assignFeedback(
      assignModalItem.id,
      staff.account.id,
      `${staff.account.name} (${staff.account.position})`,
      staff.account.role,
      assignedNote.trim() || 'Kính giao đồng chí khẩn trương xác minh thực tế và soạn thảo câu trả lời thỏa đáng gửi BGH duyệt.',
      activeSchoolYear
    );

    refreshFeedbacks();
    setAssignModalItem(null);
    setAssignedStaffId('');
    setAssignedNote('');
  };

  // Handler: Staff Submits Draft Response
  const handleConfirmDraftResponse = () => {
    if (!draftResponseModalItem || !draftText.trim()) return;
    const authorName = currentUser?.name ? `${currentUser.name} (${currentUser.position})` : 'Cán bộ thụ lý';
    const authorId = currentUser?.id || 'STAFF_ANON';

    storageService.submitFeedbackDraftResponse(
      draftResponseModalItem.id,
      draftText.trim(),
      authorName,
      authorId,
      activeSchoolYear
    );

    refreshFeedbacks();
    setDraftResponseModalItem(null);
    setDraftText('');
  };

  // Handler: HT Direct Resolve
  const handleConfirmDirectResolve = () => {
    if (!htDirectResolveModalItem || !directResolveNote.trim()) return;

    storageService.htDirectResolveFeedback(
      htDirectResolveModalItem.id,
      directResolveNote.trim(),
      directResolvePublic,
      directResolveNote.trim(),
      activeSchoolYear
    );

    refreshFeedbacks();
    setHtDirectResolveModalItem(null);
    setDirectResolveNote('');
  };

  // Handler: HT Approve Draft
  const handleConfirmHtApproval = () => {
    if (!htApproveModalItem) return;

    storageService.htApproveFeedback(
      htApproveModalItem.id,
      approvalNote.trim() || 'ĐỒNG Ý PHÊ DUYỆT: Câu trả lời rõ ràng, đầy đủ căn cứ. Ban Giám hiệu chấp thuận và chỉ đạo thực hiện đúng cam kết. - Hiệu trưởng Nguyễn Quốc Bảo.',
      approveMode === 'PUBLIC',
      htApproveModalItem.draftResponse,
      activeSchoolYear
    );

    refreshFeedbacks();
    setHtApproveModalItem(null);
    setApprovalNote('');
  };

  // Filtered Public Feedbacks
  const publicFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (!f.isPublic || f.status !== 'CONG_KHAI') return false;
      if (publicCategoryFilter !== 'ALL' && f.category !== publicCategoryFilter) return false;
      if (publicSearchTerm.trim()) {
        const query = publicSearchTerm.toLowerCase();
        const inTitle = f.title.toLowerCase().includes(query);
        const inContent = f.content.toLowerCase().includes(query);
        const inResponse = (f.draftResponse || '').toLowerCase().includes(query);
        const inApproval = (f.principalApprovalNote || '').toLowerCase().includes(query);
        if (!inTitle && !inContent && !inResponse && !inApproval) return false;
      }
      return true;
    });
  }, [feedbacks, publicCategoryFilter, publicSearchTerm]);

  // Management List (Feedbacks visible to HT or assigned staff)
  const managementFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      // If user is not HT, they can only see feedbacks assigned to them
      if (!isPrincipal) {
        if (f.assignedToId !== currentUser?.id) return false;
      }
      if (mgmtStatusFilter !== 'ALL' && f.status !== mgmtStatusFilter) return false;
      return true;
    });
  }, [feedbacks, isPrincipal, currentUser, mgmtStatusFilter]);

  // Count pending for HT
  const pendingForHtCount = useMemo(() => {
    return feedbacks.filter((f) => f.status === 'CHO_HT_XEM' || f.status === 'CHO_HT_DUYET').length;
  }, [feedbacks]);

  // Count assigned to current user
  const assignedToMeCount = useMemo(() => {
    if (!currentUser) return 0;
    return feedbacks.filter((f) => f.assignedToId === currentUser.id && f.status === 'DA_CHUYEN_XU_LY').length;
  }, [feedbacks, currentUser]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-800 via-rose-800 to-red-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold text-amber-200 border border-white/20">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Kênh Tiếp Nhận & Công Khai Trả Lời Trực Tiếp Của Hiệu Trưởng</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Hòm Thư Góp Ý & Phản Ánh Kiến Nghị
            </h2>
            <p className="text-rose-100 text-xs sm:text-sm leading-relaxed">
              Dành cho <strong>Giáo viên, Nhân viên, Phụ huynh và Học sinh</strong> toàn trường đóng góp ý kiến.
              Mọi thư gửi đến đều được <strong>Thầy Hiệu trưởng trực tiếp xem xét</strong>, phân công giải trình và
              phê duyệt công khai minh bạch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveSubTab('PUBLIC')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 ${
                activeSubTab === 'PUBLIC'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Bảng Công Khai ({publicFeedbacks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('SUBMIT')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 ${
                activeSubTab === 'SUBMIT'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Gửi Góp Ý Mới</span>
            </button>

            {(isPrincipal || assignedToMeCount > 0) && (
              <button
                type="button"
                onClick={() => setActiveSubTab('MANAGEMENT')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 relative ${
                  activeSubTab === 'MANAGEMENT'
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isPrincipal ? 'HT Quản Lý & Phê Duyệt' : 'Nhiệm Vụ Được Giao'}
                </span>
                {(pendingForHtCount > 0 || assignedToMeCount > 0) && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 ring-2 ring-white animate-pulse"></span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUBTAB 1: TRANG CÔNG KHAI (YÊU CẦU 4.2) */}
      {activeSubTab === 'PUBLIC' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={publicSearchTerm}
                onChange={(e) => setPublicSearchTerm(e.target.value)}
                placeholder="Tìm kiếm nội dung góp ý, câu trả lời, từ khóa..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Chủ đề:
              </span>
              <select
                value={publicCategoryFilter}
                onChange={(e) => setPublicCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium bg-white text-slate-700"
              >
                <option value="ALL">Tất cả các chủ đề ({publicFeedbacks.length})</option>
                <option value="CHUYEN_MON">Chuyên môn & Giảng dạy</option>
                <option value="CO_SO_VAT_CHAT">Cơ sở vật chất & Sân chơi</option>
                <option value="NE_NEP_HOC_SINH">Nề nếp & Kỷ luật học sinh</option>
                <option value="VE_SINH_AN_TOAN">Vệ sinh & An toàn trường học</option>
                <option value="THU_CHI_TAI_CHINH">Minh bạch Thu chi & Tài chính</option>
                <option value="KHAC">Góp ý & Kiến nghị khác</option>
              </select>
            </div>
          </div>

          {/* List of Public Responses */}
          {publicFeedbacks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
              <Globe className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-800 text-base">Chưa có góp ý công khai nào phù hợp</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Các câu trả lời và ý kiến sau khi được Thầy Hiệu trưởng duyệt công khai sẽ xuất hiện minh bạch tại đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {publicFeedbacks.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  {/* Item Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-red-50/20">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                          {item.categoryLabel}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          Người gửi: {item.senderType === 'PHHS' ? 'Phụ huynh học sinh' : item.senderType === 'GV' ? 'Giáo viên' : item.senderType === 'HS' ? 'Học sinh' : 'Nhân viên'}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.createdAt}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>ĐÃ GIẢI QUYẾT & CÔNG KHAI</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 leading-snug">{item.title}</h3>

                    <div className="mt-2 text-xs text-slate-600 flex items-center gap-2">
                      <span>Người phản ánh: <strong>{item.senderName}</strong></span>
                      {item.senderAffiliation && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>Đơn vị: <em>{item.senderAffiliation}</em></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Content Section */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Nội dung phản ánh / kiến nghị:
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm leading-relaxed border border-slate-200/60 whitespace-pre-line">
                        {item.content}
                      </div>

                      {item.attachments && item.attachments.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {item.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                              <span>{att.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Answer / Resolution Section */}
                    {item.draftResponse && (
                      <div>
                        <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          Giải trình & Trả lời từ đơn vị phụ trách ({item.draftedByName || 'Cán bộ thụ lý'}):
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-50/60 text-blue-950 text-xs sm:text-sm leading-relaxed border border-blue-200/70 whitespace-pre-line">
                          {item.draftResponse}
                        </div>
                      </div>
                    )}

                    {/* Principal Official Approval Seal (Chữ ký & Phê duyệt của HT) */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-rose-50/40 to-amber-50/80 border-2 border-amber-300 relative shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-red-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                              HT
                            </div>
                            <div>
                              <div className="text-xs font-black text-red-950 uppercase tracking-wide">
                                PHÊ DUYỆT CHÍNH THỨC CỦA HIỆU TRƯỞNG
                              </div>
                              <div className="text-[11px] text-amber-800">
                                Ban hành ngày: {item.publicDate || item.principalApprovedAt || 'Theo quy định'}
                              </div>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed italic pl-1 border-l-2 border-red-500">
                            &ldquo;{item.principalApprovalNote || 'Đã kiểm tra, phê duyệt giải quyết theo đúng thẩm quyền và công khai toàn trường.'}&rdquo;
                          </p>
                        </div>

                        {/* Stamp simulation */}
                        <div className="flex-shrink-0 self-end sm:self-center border-2 border-red-600 rounded-2xl p-2.5 text-center bg-white/70 rotate-1 shadow-sm">
                          <div className="text-[9px] font-black text-red-700 uppercase tracking-wider">
                            TRƯỜNG TH & THCS ĐỒNG XUÂN
                          </div>
                          <div className="text-[11px] font-black text-red-800 my-0.5">
                            ★ HIỆU TRƯỞNG ★
                          </div>
                          <div className="text-[12px] font-extrabold text-red-900 tracking-tight">
                            Nguyễn Quốc Bảo
                          </div>
                          <div className="text-[8px] font-mono text-emerald-700 mt-0.5">
                            ✓ Đã ký số điện tử
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: GỬI GÓP Ý MỚI (YÊU CẦU 4.1) */}
      {activeSubTab === 'SUBMIT' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-red-700" />
              <span>Gửi Ý Kiến, Đề Xuất & Phản Ánh Tới Hiệu Trưởng</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Thư của bạn sẽ được gửi thẳng đến Thầy Hiệu trưởng Nguyễn Quốc Bảo để xem xét giải quyết.
              Bạn có thể chọn chế độ ẩn danh nếu không muốn công khai danh tính.
            </p>
          </div>

          {submitSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <strong>Gửi ý kiến thành công!</strong> Ý kiến của bạn đã được chuyển tới Thầy Hiệu trưởng.
                Sau khi được thẩm tra và phê duyệt, kết quả trả lời sẽ được cập nhật đến bạn hoặc công khai trên bảng tin.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            {/* Sender Type & Anonymous toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bạn là (Đối tượng người gửi) <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.senderType}
                  onChange={(e) => setFormData({ ...formData, senderType: e.target.value as FeedbackSenderType })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium bg-slate-50 focus:bg-white"
                >
                  <option value="PHHS">Cha mẹ học sinh (Phụ huynh)</option>
                  <option value="GV">Giáo viên nhà trường</option>
                  <option value="NV">Nhân viên / Cán bộ văn phòng</option>
                  <option value="HS">Học sinh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chủ đề phản ánh <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as SchoolFeedbackItem['category'] })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium bg-slate-50 focus:bg-white"
                >
                  <option value="CHUYEN_MON">Chuyên môn & Giảng dạy</option>
                  <option value="CO_SO_VAT_CHAT">Cơ sở vật chất & Sân chơi</option>
                  <option value="NE_NEP_HOC_SINH">Nề nếp & Kỷ luật học sinh</option>
                  <option value="VE_SINH_AN_TOAN">Vệ sinh & An toàn trường học</option>
                  <option value="THU_CHI_TAI_CHINH">Minh bạch Thu chi & Tài chính</option>
                  <option value="KHAC">Góp ý & Kiến nghị khác</option>
                </select>
              </div>
            </div>

            {/* Checkbox: Gửi Ẩn Danh */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">Gửi với tư cách ẩn danh</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* Sender info if NOT anonymous */}
            {!formData.isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Họ và tên của bạn
                  </label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Số điện thoại / Email liên hệ
                  </label>
                  <input
                    type="text"
                    value={formData.senderContact}
                    onChange={(e) => setFormData({ ...formData, senderContact: e.target.value })}
                    placeholder="Để nhận phản hồi trực tiếp"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Lớp con học / Phân hiệu / Đơn vị
                  </label>
                  <input
                    type="text"
                    value={formData.senderAffiliation}
                    onChange={(e) => setFormData({ ...formData, senderAffiliation: e.target.value })}
                    placeholder="VD: Lớp 4B - Triêm Đức"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề góp ý / kiến nghị <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Tóm tắt ngắn gọn vấn đề cần phản ánh..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nội dung chi tiết phản ánh kiến nghị <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Mô tả cụ thể sự việc, thời gian, địa điểm, đề xuất hoặc mong muốn nhà trường giải quyết..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 focus:bg-white leading-relaxed"
              ></textarea>
            </div>

            {/* Attachments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tên file minh chứng (nếu có)
                </label>
                <input
                  type="text"
                  value={formData.attachmentName}
                  onChange={(e) => setFormData({ ...formData, attachmentName: e.target.value })}
                  placeholder="VD: anh_chup_san_truong.jpg"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Đường dẫn ảnh hoặc link Drive (tùy chọn)
                </label>
                <input
                  type="url"
                  value={formData.attachmentUrl}
                  onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-black text-xs shadow-md transition flex items-center gap-2 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Gửi Ý Kiến Đến Hiệu Trưởng</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: QUẢN LÝ DÀNH CHO HIỆU TRƯỞNG & CÁN BỘ ĐƯỢC PHÂN CÔNG (YÊU CẦU 4.1) */}
      {activeSubTab === 'MANAGEMENT' && (
        <div className="space-y-6">
          {/* Security & Access Banner */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <div>
                <span className="font-black uppercase tracking-wider text-amber-950">
                  Phân Quyền Bảo Mật & Luồng Xử Lý Ý Kiến
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Chỉ Hiệu trưởng mới có quyền xem toàn bộ thư mới gửi đến. HT có quyền trực tiếp kết thúc tự xử lý
                  hoặc chuyển đến Phó Hiệu trưởng / Giáo viên / Nhân viên trả lời, sau đó duyệt công khai hoặc kết thúc nội bộ.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-700">Lọc trạng thái:</span>
              <select
                value={mgmtStatusFilter}
                onChange={(e) => setMgmtStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-amber-300 bg-white font-medium"
              >
                <option value="ALL">Tất cả ({feedbacks.length})</option>
                <option value="CHO_HT_XEM">Mới gửi - Chờ HT xem</option>
                <option value="DA_CHUYEN_XU_LY">Đã chuyển cán bộ trả lời</option>
                <option value="CHO_HT_DUYET">Chờ HT duyệt câu trả lời</option>
                <option value="HT_TU_XU_LY">HT đã tự xử lý nội bộ</option>
                <option value="HT_DA_DUYET_NOI_BO">HT đã duyệt nội bộ</option>
                <option value="CONG_KHAI">Đã công khai toàn trường</option>
              </select>
            </div>
          </div>

          {/* List for Management */}
          <div className="space-y-4">
            {managementFeedbacks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-800 text-base">Không có ý kiến nào cần xử lý trong mục này</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Tất cả các kiến nghị đã được hoàn thành hoặc không có thư mới.
                </p>
              </div>
            ) : (
              managementFeedbacks.map((item) => {
                const isNewForHt = item.status === 'CHO_HT_XEM';
                const isAssigned = item.status === 'DA_CHUYEN_XU_LY';
                const isWaitingHtApproval = item.status === 'CHO_HT_DUYET';
                const isResolvedInternal = item.status === 'HT_TU_XU_LY' || item.status === 'HT_DA_DUYET_NOI_BO';
                const isPublicDone = item.status === 'CONG_KHAI';

                const canIAnswer = isAssigned && (isPrincipal || item.assignedToId === currentUser?.id);

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-3xl border shadow-sm p-6 space-y-4 transition ${
                      isNewForHt
                        ? 'border-red-300 ring-2 ring-red-100'
                        : isWaitingHtApproval
                        ? 'border-amber-300 ring-2 ring-amber-100'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                          Mã: {item.id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
                          {item.categoryLabel}
                        </span>
                        <span className="text-xs text-slate-500">
                          Gửi lúc: {item.createdAt}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isNewForHt && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black animate-pulse">
                            <Lock className="w-3 h-3" />
                            <span>MỚI GỬI - CHỈ HT ĐƯỢC XEM</span>
                          </span>
                        )}
                        {isAssigned && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold border border-blue-300">
                            <ArrowRight className="w-3 h-3" />
                            <span>Đang giao: {item.assignedToName}</span>
                          </span>
                        )}
                        {isWaitingHtApproval && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                            <span>CHỜ HT DUYỆT CÂU TRẢ LỜI</span>
                          </span>
                        )}
                        {isResolvedInternal && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                            <Check className="w-3 h-3 text-slate-600" />
                            <span>ĐÃ KẾT THÚC XỬ LÝ (NỘI BỘ)</span>
                          </span>
                        )}
                        {isPublicDone && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300">
                            <Globe className="w-3.5 h-3.5 text-emerald-700" />
                            <span>ĐÃ CÔNG KHAI TOÀN TRƯỜNG</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <span>Người gửi: <strong className="text-slate-900">{item.senderName}</strong></span>
                        {item.senderAffiliation && <span>({item.senderAffiliation})</span>}
                        {item.senderContact && <span className="text-blue-600">• SĐT: {item.senderContact}</span>}
                      </div>

                      <h4 className="text-base font-black text-slate-900">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-700 mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 leading-relaxed whitespace-pre-line">
                        {item.content}
                      </p>
                    </div>

                    {/* Assignment note if any */}
                    {item.assignedNote && (
                      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
                        <strong className="text-blue-950">Chỉ đạo phân công của HT:</strong> {item.assignedNote}
                        <div className="text-[11px] text-blue-700 mt-1">Giao cho: <strong>{item.assignedToName}</strong> ({item.assignedAt})</div>
                      </div>
                    )}

                    {/* Draft response if already drafted */}
                    {item.draftResponse && (
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5 text-xs text-amber-950">
                        <div className="font-bold text-amber-900 flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-amber-700" />
                          Câu trả lời do {item.draftedByName || 'Cán bộ'} soạn thảo:
                        </div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-line">{item.draftResponse}</p>
                        <div className="text-[11px] text-amber-700">Nộp lúc: {item.draftedAt}</div>
                      </div>
                    )}

                    {/* Principal Approval Note if any */}
                    {item.principalApprovalNote && (
                      <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 text-xs text-red-950 space-y-1">
                        <div className="font-black text-red-900 flex items-center gap-1.5 uppercase">
                          <Award className="w-4 h-4 text-red-700" />
                          Bút phê phê duyệt của Hiệu trưởng Nguyễn Quốc Bảo:
                        </div>
                        <p className="italic text-slate-900 font-medium">{item.principalApprovalNote}</p>
                        <div className="text-[11px] text-red-700">
                          {item.isPublic ? '✓ Đã công khai ra toàn trường' : '✓ Lưu xử lý nội bộ'} ({item.principalApprovedAt})
                        </div>
                      </div>
                    )}

                    {/* Action Bar based on roles */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                      {/* HT Actions for NEW feedback ('CHO_HT_XEM') */}
                      {isPrincipal && isNewForHt && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setHtDirectResolveModalItem(item);
                              setDirectResolveNote('');
                              setDirectResolvePublic(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>HT Tự Xử Lý Trực Tiếp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAssignModalItem(item);
                              setAssignedStaffId('');
                              setAssignedNote('');
                            }}
                            className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>HT Chuyển PHT/GV/NV Trả Lời</span>
                          </button>
                        </>
                      )}

                      {/* Staff Action to Draft Response */}
                      {canIAnswer && (
                        <button
                          type="button"
                          onClick={() => {
                            setDraftResponseModalItem(item);
                            setDraftText(item.draftResponse || '');
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Soạn Trả Lời & Gửi Về HT Duyệt</span>
                        </button>
                      )}

                      {/* HT Actions when draft is submitted ('CHO_HT_DUYET') */}
                      {isPrincipal && isWaitingHtApproval && (
                        <button
                          type="button"
                          onClick={() => {
                            setHtApproveModalItem(item);
                            setApprovalNote('ĐỒNG Ý PHÊ DUYỆT & CÔNG KHAI: Ban Giám hiệu chấp thuận câu trả lời thỏa đáng, giao bộ phận thực hiện đúng tiến độ.');
                            setApproveMode('PUBLIC');
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-sm transition flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-300" />
                          <span>HT Phê Duyệt Câu Trả Lời</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: HT Chuyển Cho PHT / GV / NV Trả Lời */}
      {assignModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-red-700" />
                <span>HT Giao Nhiệm Vụ Trả Lời Ý Kiến</span>
              </h4>
              <button
                type="button"
                onClick={() => setAssignModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{assignModalItem.title}</div>
              <div className="text-slate-500 mt-0.5 truncate">{assignModalItem.content}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chọn Cán bộ / GV / NV phụ trách giải trình <span className="text-red-600">*</span>
              </label>
              <select
                value={assignedStaffId}
                onChange={(e) => setAssignedStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">-- Chọn trong danh sách 137 CBGV-NV --</option>
                {allStaff.map((s) => (
                  <option key={s.account.id} value={s.account.id}>
                    {s.account.name} — {s.account.position} ({s.account.branchName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chỉ đạo / Lời dặn của Hiệu trưởng
              </label>
              <textarea
                rows={3}
                value={assignedNote}
                onChange={(e) => setAssignedNote(e.target.value)}
                placeholder="Giao đồng chí xác minh thực tế, đề xuất phương án và gửi bản dự thảo câu trả lời về BGH duyệt trước ngày..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!assignedStaffId}
                onClick={handleConfirmAssignment}
                className="px-5 py-2 text-xs font-black text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-xl shadow"
              >
                Xác Nhận Chuyển Giao
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Cán bộ soạn thảo trả lời và gửi về HT duyệt */}
      {draftResponseModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-700" />
                <span>Soạn Thảo Câu Trả Lời & Gửi Về HT Duyệt</span>
              </h4>
              <button
                type="button"
                onClick={() => setDraftResponseModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs">
              <div className="font-bold text-blue-950">Ý kiến phản ánh: {draftResponseModalItem.title}</div>
              <div className="text-slate-700 mt-1">{draftResponseModalItem.content}</div>
              {draftResponseModalItem.assignedNote && (
                <div className="mt-2 text-blue-800 font-medium">
                  <strong>HT chỉ đạo:</strong> {draftResponseModalItem.assignedNote}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nội dung câu trả lời / phương án giải quyết <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                rows={6}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Kính gửi Quý phụ huynh / Thầy cô... Bộ phận phụ trách đã tiến hành kiểm tra và xin trả lời cụ thể như sau..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDraftResponseModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!draftText.trim()}
                onClick={handleConfirmDraftResponse}
                className="px-5 py-2 text-xs font-black text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow"
              >
                Nộp Về HT Phê Duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HT Phê Duyệt Câu Trả Lời (Chọn Công Khai hoặc Nội Bộ) */}
      {htApproveModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-red-700" />
                <span>Hiệu Trưởng Phê Duyệt Câu Trả Lời</span>
              </h4>
              <button
                type="button"
                onClick={() => setHtApproveModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-900">{htApproveModalItem.title}</div>
              <div className="text-slate-600 text-[11px] p-2 bg-white rounded-xl border border-slate-200">
                <strong>Bản trả lời của {htApproveModalItem.draftedByName}:</strong>
                <p className="mt-1 text-slate-800">{htApproveModalItem.draftResponse}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bút phê phê duyệt của Hiệu trưởng Nguyễn Quốc Bảo
              </label>
              <textarea
                rows={3}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Nhập ý kiến phê duyệt của Hiệu trưởng..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              ></textarea>
            </div>

            {/* Decision mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hình thức kết thúc xử lý:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setApproveMode('PUBLIC')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    approveMode === 'PUBLIC'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200 font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Công khai toàn trường</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Đưa lên trang công khai kèm chữ ký & dấu phê duyệt của HT.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setApproveMode('INTERNAL')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    approveMode === 'INTERNAL'
                      ? 'border-slate-700 bg-slate-100 text-slate-950 ring-2 ring-slate-300 font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <span>Kết thúc tự xử lý nội bộ</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Lưu trữ hồ sơ nội bộ nhà trường, không công khai ra ngoài.
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHtApproveModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmHtApproval}
                className="px-5 py-2 text-xs font-black text-white bg-red-700 hover:bg-red-800 rounded-xl shadow"
              >
                {approveMode === 'PUBLIC' ? 'Ký Duyệt & Công Khai' : 'Duyệt Kết Thúc Nội Bộ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: HT Trực Tiếp Tự Xử Lý */}
      {htDirectResolveModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-red-700" />
                <span>Hiệu Trưởng Trực Tiếp Kết Thúc Tự Xử Lý</span>
              </h4>
              <button
                type="button"
                onClick={() => setHtDirectResolveModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{htDirectResolveModalItem.title}</div>
              <div className="text-slate-600 mt-1">{htDirectResolveModalItem.content}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ý kiến chỉ đạo & Phương án giải quyết trực tiếp của HT <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={directResolveNote}
                onChange={(e) => setDirectResolveNote(e.target.value)}
                placeholder="Nhập nội dung giải quyết trực tiếp của Hiệu trưởng Nguyễn Quốc Bảo..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              ></textarea>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs">
                <div className="font-bold text-slate-900">Công khai kết quả trả lời</div>
                <div className="text-[11px] text-slate-500">Hiển thị trên bảng tin công khai toàn trường</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={directResolvePublic}
                  onChange={(e) => setDirectResolvePublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHtDirectResolveModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!directResolveNote.trim()}
                onClick={handleConfirmDirectResolve}
                className="px-5 py-2 text-xs font-black text-white bg-slate-900 hover:bg-black disabled:opacity-50 rounded-xl shadow"
              >
                Xác Nhận Kết Thúc Xử Lý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
