import React, { useState, useMemo } from 'react';
import {
  AcademicPost,
  ZaloChatMessage,
  UserAccount,
  Role,
} from '../types/school';
import { storageService } from '../services/storageService';
import {
  BookOpen,
  Calendar,
  Table,
  Image as ImageIcon,
  Paperclip,
  MessageCircle,
  Plus,
  Send,
  Heart,
  ThumbsUp,
  Smile,
  Edit3,
  Save,
  Trash2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Pin,
  X,
  PlusCircle,
  Compass,
  FlaskConical,
  Award,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { SecondaryAcademicProgressReport } from './SecondaryAcademicProgressReport';

interface SecondaryAcademicHubProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  allStaff: Array<{ account: UserAccount }>;
  onRefreshData?: () => void;
}

export const SecondaryAcademicHub: React.FC<SecondaryAcademicHubProps> = ({
  currentUser,
  activeSchoolYear,
  allStaff,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'POSTS' | 'SHEET_EDIT' | 'ZALO_CHAT' | 'REPORTS'>('POSTS');
  const [posts, setPosts] = useState<AcademicPost[]>(() =>
    storageService.getAcademicPosts('THCS', activeSchoolYear)
  );
  const [zaloMessages, setZaloMessages] = useState<ZaloChatMessage[]>(() =>
    storageService.getZaloMessages('THCS', 'ALL', activeSchoolYear)
  );

  // Filter state for posts
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // New post modal
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostData, setNewPostData] = useState({
    grade: 8,
    subject: 'Khoa Học Tự Nhiên & Thực Nghiệm',
    title: '',
    content: '',
    imageUrl: '',
    attachmentName: '',
    attachmentUrl: '',
    sheetTitle: 'Bảng Phân Công Ra Đề Thi & Bồi Dưỡng HSG THCS',
    sheetHeaders: 'Môn Học, Khối, Giáo Viên Ra Đề, Hạn Nộp Đề, Người Duyệt, Tiến Độ Hiện Tại, Ghi Chú',
  });

  // Interactive Google Sheet Editing state
  const [selectedPostForSheet, setSelectedPostForSheet] = useState<AcademicPost | null>(() => {
    return posts.find((p) => p.sheetData) || null;
  });
  const [editableRows, setEditableRows] = useState<Array<Record<string, string>>>(() => {
    const post = posts.find((p) => p.sheetData);
    return post?.sheetData?.rows ? [...post.sheetData.rows] : [];
  });
  const [sheetSaveSuccess, setSheetSaveSuccess] = useState(false);

  // Zalo chat state
  const [chatChannel, setChatChannel] = useState<'ALL' | 'GENERAL' | 'TO_TU_NHIEN' | 'TO_XA_HOI'>('ALL');
  const [chatInputText, setChatInputText] = useState('');
  const [chatAttachmentUrl, setChatAttachmentUrl] = useState('');

  const canPost = currentUser?.role === 'HT' || currentUser?.role === 'PHT' || currentUser?.role === 'GV' || currentUser?.role === 'GV_TIN_HOC';

  const refreshData = () => {
    const freshPosts = storageService.getAcademicPosts('THCS', activeSchoolYear);
    setPosts(freshPosts);
    const freshZalo = storageService.getZaloMessages('THCS', 'ALL', activeSchoolYear);
    setZaloMessages(freshZalo);
    if (selectedPostForSheet) {
      const match = freshPosts.find((p) => p.id === selectedPostForSheet.id);
      if (match && match.sheetData) {
        setSelectedPostForSheet(match);
        setEditableRows([...match.sheetData.rows]);
      }
    }
    if (onRefreshData) onRefreshData();
  };

  // Create new Academic Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostData.title.trim() || !newPostData.content.trim()) return;

    const headers = newPostData.sheetHeaders.split(',').map((h) => h.trim()).filter(Boolean);
    const initialRows = [
      { [headers[0] || 'Cột 1']: 'Toán học', [headers[1] || 'Cột 2']: `Khối ${newPostData.grade}`, [headers[2] || 'Cột 3']: currentUser?.name || 'Giáo viên ra đề', [headers[3] || 'Cột 4']: '20/10/2026', [headers[4] || 'Cột 5']: 'BGH / Tổ trưởng', [headers[5] || 'Cột 6']: 'Đang soạn thảo', [headers[6] || 'Ghi Chú']: 'Kèm ma trận chuẩn' },
    ];

    storageService.addAcademicPost(
      {
        schoolYear: activeSchoolYear,
        level: 'THCS',
        grade: newPostData.grade,
        subject: newPostData.subject,
        title: newPostData.title.trim(),
        content: newPostData.content.trim(),
        authorId: currentUser?.id || 'GV_SEC_01',
        authorName: currentUser?.name || 'Thầy/Cô Giáo viên',
        authorRole: currentUser?.role || 'GV',
        authorPosition: currentUser?.position || 'Giáo viên THCS',
        images: newPostData.imageUrl.trim() ? [newPostData.imageUrl.trim()] : undefined,
        attachments: newPostData.attachmentName.trim()
          ? [{ name: newPostData.attachmentName.trim(), url: newPostData.attachmentUrl.trim() || '#', type: 'application/pdf', size: '3.5 MB' }]
          : undefined,
        timetableSnippet: {
          className: `Lớp ${newPostData.grade}A`,
          branchName: currentUser?.branchName || 'Trụ sở chính',
          dayOfWeek: 'Thứ Năm (Buổi Chiều)',
          periods: [
            { periodNumber: 1, subject: 'Toán học (Đại số)', teacher: currentUser?.name || 'Giáo viên' },
            { periodNumber: 2, subject: 'KHTN (Thực hành thí nghiệm)', teacher: currentUser?.name || 'Giáo viên' },
            { periodNumber: 3, subject: 'Ngữ văn (Văn bản mới)', teacher: currentUser?.name || 'Giáo viên' },
            { periodNumber: 4, subject: 'Tiếng Anh (Kỹ năng nghe)', teacher: currentUser?.name || 'Giáo viên' },
          ],
        },
        sheetData: {
          sheetTitle: newPostData.sheetTitle.trim() || 'Bảng Tính Google Sheets Chuyên Môn THCS',
          headers: headers.length > 0 ? headers : ['Môn Học', 'Khối', 'Giáo Viên Ra Đề', 'Hạn Nộp Đề', 'Tiến Độ', 'Ghi Chú'],
          rows: initialRows,
          editableBy: 'ALL_TEACHERS',
          lastEditedBy: currentUser?.name || 'Giáo viên',
          lastEditedAt: new Date().toLocaleString('vi-VN'),
        },
      },
      activeSchoolYear
    );

    refreshData();
    setShowNewPostModal(false);
    setNewPostData({
      grade: 8,
      subject: 'Khoa Học Tự Nhiên & Thực Nghiệm',
      title: '',
      content: '',
      imageUrl: '',
      attachmentName: '',
      attachmentUrl: '',
      sheetTitle: 'Bảng Phân Công Ra Đề Thi & Bồi Dưỡng HSG THCS',
      sheetHeaders: 'Môn Học, Khối, Giáo Viên Ra Đề, Hạn Nộp Đề, Người Duyệt, Tiến Độ Hiện Tại, Ghi Chú',
    });
  };

  // Save Interactive Sheet Grid
  const handleSaveSheetData = () => {
    if (!selectedPostForSheet) return;
    const editorName = currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Thành viên nhà trường';

    storageService.updateAcademicSheetData(
      'THCS',
      selectedPostForSheet.id,
      editableRows,
      editorName,
      activeSchoolYear
    );

    refreshData();
    setSheetSaveSuccess(true);
    setTimeout(() => setSheetSaveSuccess(false), 4000);
  };

  const handleCellChange = (rowIndex: number, colName: string, value: string) => {
    const updated = [...editableRows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      [colName]: value,
    };
    setEditableRows(updated);
  };

  const handleAddSheetRow = () => {
    if (!selectedPostForSheet?.sheetData) return;
    const newRow: Record<string, string> = {};
    selectedPostForSheet.sheetData.headers.forEach((h, idx) => {
      newRow[h] = idx === 0 ? `Bộ môn mới` : '';
    });
    setEditableRows([...editableRows, newRow]);
  };

  const handleDeleteSheetRow = (rowIndex: number) => {
    const updated = editableRows.filter((_, idx) => idx !== rowIndex);
    setEditableRows(updated);
  };

  // Send Zalo message
  const handleSendZaloMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    storageService.sendZaloMessage(
      {
        schoolYear: activeSchoolYear,
        level: 'THCS',
        channelId: chatChannel === 'ALL' ? 'GENERAL' : chatChannel,
        senderId: currentUser?.id || 'USER_TMP',
        senderName: currentUser?.name || 'Thầy/Cô Giáo viên',
        senderRole: currentUser?.role || 'GV',
        senderPosition: currentUser?.position || 'Giáo viên THCS',
        content: chatInputText.trim(),
        attachments: chatAttachmentUrl.trim()
          ? [{ name: 'Hình ảnh đính kèm', url: chatAttachmentUrl.trim(), type: 'image' }]
          : undefined,
      },
      activeSchoolYear
    );

    setChatInputText('');
    setChatAttachmentUrl('');
    refreshData();
  };

  // Toggle Zalo reaction
  const handleReaction = (messageId: string, emoji: string) => {
    const userName = currentUser?.name || 'Người dùng';
    storageService.toggleZaloReaction('THCS', messageId, emoji, userName, activeSchoolYear);
    refreshData();
  };

  const filteredPosts = useMemo(() => {
    if (gradeFilter === 'ALL') return posts;
    return posts.filter((p) => p.grade?.toString() === gradeFilter);
  }, [posts, gradeFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold text-purple-200 border border-white/20">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Cấp Trung Học Cơ Sở (Khối 6, 7, 8, 9) • Ôn Thi Vào 10 & HSG</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Cổng Chuyên Môn Cấp THCS
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm leading-relaxed">
              Trang riêng phục vụ quản lý chuyên môn bậc THCS. Quản lý <strong>thí nghiệm thực hành KHTN, ma trận đề kiểm tra</strong>,
              thời khóa biểu phân môn, <strong>mảng dữ liệu Google Sheets điền tiến độ ôn thi</strong> và kênh <strong>hỏi đáp Zalo trực tiếp</strong> giữa BGH và Tổ bộ môn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('POSTS')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 ${
                activeTab === 'POSTS'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Bài Viết & Chuyên Đề ({posts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SHEET_EDIT')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 ${
                activeTab === 'SHEET_EDIT'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Điền Google Sheets Trực Tiếp</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ZALO_CHAT')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 relative ${
                activeTab === 'ZALO_CHAT'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Tương Tác Zalo THCS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REPORTS')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 ${
                activeTab === 'REPORTS'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Báo Cáo Tiến Độ (Recharts)</span>
            </button>

            {canPost && (
              <button
                type="button"
                onClick={() => setShowNewPostModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-950 font-black text-xs shadow-md transition flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4 text-purple-700" />
                <span>Đăng Nội Dung Mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: DANH SÁCH BÀI VIẾT CHUYÊN MÔN THCS */}
      {activeTab === 'POSTS' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600">Khối lớp THCS:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setGradeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    gradeFilter === 'ALL' ? 'bg-white text-purple-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả khối 6 - 9
                </button>
                {[6, 7, 8, 9].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGradeFilter(g.toString())}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      gradeFilter === g.toString() ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Khối {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Hiển thị <strong>{filteredPosts.length}</strong> chuyên đề & kế hoạch môn học THCS
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition space-y-5 p-6"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Pin className="w-3 h-3 text-amber-700" />
                          Trọng tâm
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                        Khối {post.grade || 'THCS'} • {post.subject || 'Bộ môn'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.createdAt}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 leading-snug">{post.title}</h3>

                    <div className="text-xs text-slate-600">
                      Tác giả: <strong>{post.authorName}</strong> ({post.authorPosition})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {post.sheetData && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPostForSheet(post);
                          setEditableRows([...post.sheetData!.rows]);
                          setActiveTab('SHEET_EDIT');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Table className="w-3.5 h-3.5 text-purple-700" />
                        <span>Mở Bảng Sheet Điền Số Liệu</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  {post.content}
                </p>

                {/* Images Gallery if any */}
                {post.images && post.images.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                      Hình ảnh phòng thí nghiệm & hoạt động trải nghiệm:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {post.images.map((img, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-h-64 bg-slate-100">
                          <img
                            src={img}
                            alt="Chuyên môn THCS"
                            className="w-full h-full object-cover hover:scale-105 transition duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timetable Snippet if any */}
                {post.timetableSnippet && (
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-purple-950 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-purple-700" />
                        <span>Thời khóa biểu nhúng: <strong>{post.timetableSnippet.className}</strong> ({post.timetableSnippet.branchName})</span>
                      </div>
                      <span className="text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-lg">
                        {post.timetableSnippet.dayOfWeek}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {post.timetableSnippet.periods.map((p) => (
                        <div key={p.periodNumber} className="bg-white p-2.5 rounded-xl border border-purple-100 shadow-xs">
                          <div className="text-[10px] font-bold text-purple-700">Tiết {p.periodNumber}</div>
                          <div className="font-extrabold text-slate-900 truncate">{p.subject}</div>
                          <div className="text-[10px] text-slate-500 truncate">{p.teacher}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Sheet Preview Snippet */}
                {post.sheetData && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                        <Table className="w-4 h-4 text-indigo-700" />
                        <span>Mảng Google Sheet Tương Tác: {post.sheetData.sheetTitle}</span>
                      </div>
                      <div className="text-[11px] text-indigo-800">
                        Cập nhật bởi: <strong>{post.sheetData.lastEditedBy || 'Hệ thống'}</strong> ({post.sheetData.lastEditedAt || 'Mới nhất'})
                      </div>
                    </div>

                    {/* Mini Sheet Grid Preview */}
                    <div className="overflow-x-auto rounded-xl border border-indigo-200 bg-white shadow-xs">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-indigo-800 text-white font-bold text-[11px]">
                          <tr>
                            {post.sheetData.headers.map((h, i) => (
                              <th key={i} className="px-3 py-2 border-r border-indigo-700 last:border-r-0">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {post.sheetData.rows.slice(0, 3).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-indigo-50/40">
                              {post.sheetData!.headers.map((h, cIdx) => (
                                <td key={cIdx} className="px-3 py-1.5 text-slate-700 border-r border-slate-100 last:border-r-0">
                                  {row[h] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPostForSheet(post);
                          setEditableRows([...post.sheetData!.rows]);
                          setActiveTab('SHEET_EDIT');
                        }}
                        className="text-xs font-bold text-indigo-800 hover:text-indigo-950 flex items-center gap-1"
                      >
                        <span>Nhấp vào đây để điền hoặc chỉnh sửa toàn bộ bảng tính &rarr;</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                    {post.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url || '#'}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                        <span>{att.name}</span>
                        <span className="text-[10px] text-slate-400">({att.size || 'Tài liệu'})</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ĐIỀN NỘI DUNG VÀO MẢNG GOOGLE SHEETS TRỰC TIẾP (YÊU CẦU 4.4) */}
      {activeTab === 'SHEET_EDIT' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 uppercase">
                  Google Sheets Tương Tác Trực Tuyến THCS
                </span>
                {sheetSaveSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã lưu đồng bộ thành công!
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {selectedPostForSheet?.sheetData?.sheetTitle || 'Bảng Tính Phân Công Ra Đề & Tiến Độ Ôn Thi THCS'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Giáo viên bộ môn Toán, Văn, Anh, KHTN... nhấp trực tiếp vào từng ô dưới đây để điền tiến độ, ma trận đề thi hoặc điểm thi thử.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddSheetRow}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Thêm Dòng</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSheetData}
                className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Dữ Liệu Bảng Tính</span>
              </button>
            </div>
          </div>

          {/* Select which post's sheet to edit */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600">Chọn bảng chuyên môn cần nhập:</span>
            <select
              value={selectedPostForSheet?.id || ''}
              onChange={(e) => {
                const found = posts.find((p) => p.id === e.target.value);
                if (found && found.sheetData) {
                  setSelectedPostForSheet(found);
                  setEditableRows([...found.sheetData.rows]);
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold bg-slate-50"
            >
              {posts
                .filter((p) => p.sheetData)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sheetData?.sheetTitle} (Khối {p.grade} - {p.authorName})
                  </option>
                ))}
            </select>
          </div>

          {/* Interactive Editable Table Grid */}
          {selectedPostForSheet?.sheetData && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead className="bg-indigo-900 text-white font-black text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 w-12 text-center border-r border-indigo-800">#</th>
                    {selectedPostForSheet.sheetData.headers.map((header, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-3 border-r border-indigo-800 last:border-r-0">
                        {header}
                      </th>
                    ))}
                    <th className="px-3 py-3 w-16 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium">
                  {editableRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80 transition group">
                      <td className="px-2 py-2 text-center text-slate-400 font-mono text-[11px] bg-slate-50 border-r border-slate-200">
                        {rIdx + 1}
                      </td>
                      {selectedPostForSheet.sheetData!.headers.map((colName, cIdx) => (
                        <td key={cIdx} className="p-1 border-r border-slate-200 last:border-r-0">
                          <input
                            type="text"
                            value={row[colName] || ''}
                            onChange={(e) => handleCellChange(rIdx, colName, e.target.value)}
                            placeholder="Nhập nội dung..."
                            className="w-full px-2.5 py-1.5 text-xs text-slate-800 rounded-lg border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-indigo-50/30 outline-none transition"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSheetRow(rIdx)}
                          className="p-1 text-slate-300 hover:text-rose-600 transition rounded"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Last edited info */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <div>
              Dữ liệu được lưu trữ an toàn trên máy chủ và sẵn sàng trích xuất qua Google Sheets Google Apps Script.
            </div>
            <div>
              Lần sửa gần nhất: <strong>{selectedPostForSheet?.sheetData?.lastEditedBy || 'Chưa sửa'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TƯƠNG TÁC HỎI ĐÁP NGẮN GIỐNG ZALO (YÊU CẦU 4.4) */}
      {activeTab === 'ZALO_CHAT' && (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[650px]">
          {/* Zalo Header */}
          <div className="bg-gradient-to-r from-purple-800 to-indigo-800 text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-purple-800 flex items-center justify-center font-black text-sm shadow">
                Zalo
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base flex items-center gap-2">
                  <span>Nhóm Trao Đổi Chuyên Môn Cấp THCS</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </h4>
                <p className="text-[11px] text-purple-200">
                  HT, PHT và toàn thể giáo viên bộ môn cấp THCS tương tác, hỏi đáp nghiệp vụ tức thời.
                </p>
              </div>
            </div>

            {/* Channels */}
            <div className="flex items-center gap-1.5">
              <select
                value={chatChannel}
                onChange={(e) => setChatChannel(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl bg-white/20 text-white border border-white/20 focus:outline-none font-bold"
              >
                <option value="ALL" className="text-slate-900">Tất cả kênh thảo luận</option>
                <option value="GENERAL" className="text-slate-900">Kênh chung THCS</option>
                <option value="TO_TU_NHIEN" className="text-slate-900">Tổ KHTN & Toán</option>
                <option value="TO_XA_HOI" className="text-slate-900">Tổ KHXH & Văn - Anh</option>
              </select>
            </div>
          </div>

          {/* Messages list (scrollable) */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/70">
            {zaloMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const isHt = msg.senderRole === 'HT';
              const isPht = msg.senderRole === 'PHT';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs flex-shrink-0 shadow-sm ${
                      isHt
                        ? 'bg-red-700 text-white ring-2 ring-red-200'
                        : isPht
                        ? 'bg-amber-600 text-white ring-2 ring-amber-200'
                        : 'bg-purple-700 text-white'
                    }`}
                  >
                    {msg.senderName.slice(-2)}
                  </div>

                  {/* Message bubble */}
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                      <span className="font-bold text-slate-800">{msg.senderName}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                        isHt ? 'bg-red-100 text-red-800' : isPht ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {msg.senderPosition || msg.senderRole}
                      </span>
                      <span className="text-slate-400 text-[10px]">{msg.timestamp.slice(11, 16)}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                        isMe
                          ? 'bg-purple-700 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                      }`}
                    >
                      {msg.content}

                      {/* Image attachment */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 rounded-xl overflow-hidden max-h-48 border border-white/20">
                          <img
                            src={msg.attachments[0].url}
                            alt="Ảnh đính kèm"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Reactions Bar */}
                    <div className={`flex items-center gap-1 pt-0.5 ${isMe ? 'justify-end' : ''}`}>
                      {msg.reactions &&
                        Object.entries(msg.reactions).map(([emoji, users]) => {
                          if (!users || users.length === 0) return null;
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReaction(msg.id, emoji)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 text-[11px] font-bold shadow-xs hover:bg-slate-50"
                              title={users.join(', ')}
                            >
                              <span>{emoji}</span>
                              <span className="text-[10px] text-slate-500">{users.length}</span>
                            </button>
                          );
                        })}

                      {/* Quick reaction buttons */}
                      <button
                        type="button"
                        onClick={() => handleReaction(msg.id, '👍')}
                        className="text-slate-400 hover:text-blue-600 text-xs px-1"
                        title="Thích"
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReaction(msg.id, '❤️')}
                        className="text-slate-400 hover:text-red-600 text-xs px-1"
                        title="Thả tim"
                      >
                        ❤️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReaction(msg.id, '🔥')}
                        className="text-slate-400 hover:text-orange-600 text-xs px-1"
                        title="Quyết tâm"
                      >
                        🔥
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReaction(msg.id, '🎉')}
                        className="text-slate-400 hover:text-purple-600 text-xs px-1"
                        title="Chúc mừng"
                      >
                        🎉
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Zalo Input Box */}
          <form onSubmit={handleSendZaloMsg} className="p-3 bg-white border-t border-slate-200 space-y-2">
            {chatAttachmentUrl && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-purple-50 text-purple-900 rounded-xl text-xs">
                <span className="truncate">Ảnh đính kèm: {chatAttachmentUrl}</span>
                <button
                  type="button"
                  onClick={() => setChatAttachmentUrl('')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={`Nhập tin nhắn trao đổi chuyên môn với tư cách ${currentUser?.name || 'Giáo viên'}...`}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white"
              />

              <button
                type="button"
                onClick={() => {
                  const url = prompt('Nhập đường dẫn URL hình ảnh muốn gửi trong chat:');
                  if (url) setChatAttachmentUrl(url);
                }}
                className="p-2.5 text-slate-500 hover:text-purple-600 rounded-xl hover:bg-slate-100 transition"
                title="Đính kèm ảnh"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: BÁO CÁO TIẾN ĐỘ CHỈ TIÊU CHUYÊN MÔN THCS (RECHARTS) */}
      {activeTab === 'REPORTS' && (
        <SecondaryAcademicProgressReport
          activeSchoolYear={activeSchoolYear}
          currentUser={currentUser}
        />
      )}

      {/* MODAL ĐĂNG NỘI DUNG CHUYÊN MÔN MỚI */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-700" />
                <span>Đăng Nội Dung / Kế Hoạch Chuyên Môn THCS</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowNewPostModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newPostData.grade}
                    onChange={(e) => setNewPostData({ ...newPostData, grade: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  >
                    <option value={6}>Khối 6 (THCS)</option>
                    <option value={7}>Khối 7 (THCS)</option>
                    <option value={8}>Khối 8 (THCS)</option>
                    <option value={9}>Khối 9 (THCS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môn học / Tổ bộ môn <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPostData.subject}
                    onChange={(e) => setNewPostData({ ...newPostData, subject: e.target.value })}
                    placeholder="VD: Toán, Ngữ văn, KHTN, Tiếng Anh..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề bài viết chuyên môn <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPostData.title}
                  onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
                  placeholder="Nhập tiêu đề ma trận đề thi, chuyên đề bồi dưỡng HSG..."
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung chi tiết <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={newPostData.content}
                  onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
                  placeholder="Nội dung chuyên môn, mục tiêu bài học, lưu ý thực hành thí nghiệm..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    URL hình ảnh minh họa (tùy chọn)
                  </label>
                  <input
                    type="url"
                    value={newPostData.imageUrl}
                    onChange={(e) => setNewPostData({ ...newPostData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tên file đề thi / ma trận đính kèm
                  </label>
                  <input
                    type="text"
                    value={newPostData.attachmentName}
                    onChange={(e) => setNewPostData({ ...newPostData, attachmentName: e.target.value })}
                    placeholder="De_thi_va_ma_tran_KHTN8.pdf"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-indigo-700" />
                  Khởi tạo mảng Google Sheet điền nội dung trực tiếp THCS
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Tên bảng tính</label>
                    <input
                      type="text"
                      value={newPostData.sheetTitle}
                      onChange={(e) => setNewPostData({ ...newPostData, sheetTitle: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Danh sách các cột (phân cách bằng dấu phẩy)</label>
                    <input
                      type="text"
                      value={newPostData.sheetHeaders}
                      onChange={(e) => setNewPostData({ ...newPostData, sheetHeaders: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-black text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow"
                >
                  Đăng Bài Chuyên Môn THCS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
