import React, { useState, useMemo } from 'react';
import {
  AcademicPost,
  ZaloChatMessage,
  UserAccount,
  Role,
} from '../types/school';
import { storageService } from '../services/storageService';
import {
  GraduationCap,
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
  RefreshCw,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { PrimaryAcademicProgressReport } from './PrimaryAcademicProgressReport';

interface PrimaryAcademicHubProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  allStaff: Array<{ account: UserAccount }>;
  onRefreshData?: () => void;
}

export const PrimaryAcademicHub: React.FC<PrimaryAcademicHubProps> = ({
  currentUser,
  activeSchoolYear,
  allStaff,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'POSTS' | 'SHEET_EDIT' | 'ZALO_CHAT' | 'REPORTS'>('POSTS');
  const [posts, setPosts] = useState<AcademicPost[]>(() =>
    storageService.getAcademicPosts('TIEU_HOC', activeSchoolYear)
  );
  const [zaloMessages, setZaloMessages] = useState<ZaloChatMessage[]>(() =>
    storageService.getZaloMessages('TIEU_HOC', 'ALL', activeSchoolYear)
  );

  // Filter state for posts
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // New post modal
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostData, setNewPostData] = useState({
    grade: 3,
    subject: 'Toán & STEM',
    title: '',
    content: '',
    imageUrl: '',
    attachmentName: '',
    attachmentUrl: '',
    sheetTitle: 'Bảng Đăng Ký Đồ Dùng & Phân Phối Tiết Dạy',
    sheetHeaders: 'Tuần, Khối Lớp, Tên Bài Học, Thiết Bị Cần Dùng, Người Thực Hiện, Ghi Chú',
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
  const [chatChannel, setChatChannel] = useState<'ALL' | 'GENERAL' | 'STEM' | 'KHOI_1_2'>('ALL');
  const [chatInputText, setChatInputText] = useState('');
  const [chatAttachmentUrl, setChatAttachmentUrl] = useState('');

  const canPost = currentUser?.role === 'HT' || currentUser?.role === 'PHT' || currentUser?.role === 'GV' || currentUser?.role === 'GV_TIN_HOC';

  const refreshData = () => {
    const freshPosts = storageService.getAcademicPosts('TIEU_HOC', activeSchoolYear);
    setPosts(freshPosts);
    const freshZalo = storageService.getZaloMessages('TIEU_HOC', 'ALL', activeSchoolYear);
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
      { [headers[0] || 'Cột 1']: 'Tuần 6', [headers[1] || 'Cột 2']: `Khối ${newPostData.grade}`, [headers[2] || 'Cột 3']: 'Nội dung bài học mới', [headers[3] || 'Cột 4']: 'Bộ thiết bị dạy học', [headers[4] || 'Cột 5']: currentUser?.name || 'Giáo viên', [headers[5] || 'Ghi Chú']: 'Đã duyệt' },
    ];

    storageService.addAcademicPost(
      {
        schoolYear: activeSchoolYear,
        level: 'TIEU_HOC',
        grade: newPostData.grade,
        subject: newPostData.subject,
        title: newPostData.title.trim(),
        content: newPostData.content.trim(),
        authorId: currentUser?.id || 'GV_01',
        authorName: currentUser?.name || 'Thầy/Cô Giáo viên',
        authorRole: currentUser?.role || 'GV',
        authorPosition: currentUser?.position || 'Giáo viên Tiểu học',
        images: newPostData.imageUrl.trim() ? [newPostData.imageUrl.trim()] : undefined,
        attachments: newPostData.attachmentName.trim()
          ? [{ name: newPostData.attachmentName.trim(), url: newPostData.attachmentUrl.trim() || '#', type: 'application/pdf', size: '2.5 MB' }]
          : undefined,
        timetableSnippet: {
          className: `Lớp ${newPostData.grade}A`,
          branchName: currentUser?.branchName || 'Trụ sở chính',
          dayOfWeek: 'Thứ Ba (Buổi Sáng)',
          periods: [
            { periodNumber: 1, subject: 'Toán học (Tiểu học)', teacher: currentUser?.name || 'Giáo viên' },
            { periodNumber: 2, subject: 'Tiếng Việt (Luyện tập)', teacher: currentUser?.name || 'Giáo viên' },
            { periodNumber: 3, subject: 'Đạo đức / Tự nhiên xã hội', teacher: currentUser?.name || 'Giáo viên' },
          ],
        },
        sheetData: {
          sheetTitle: newPostData.sheetTitle.trim() || 'Bảng Tính Google Sheets Chuyên Môn',
          headers: headers.length > 0 ? headers : ['Mục', 'Nội Dung', 'Người Thực Hiện', 'Ghi Chú'],
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
      grade: 3,
      subject: 'Toán & STEM',
      title: '',
      content: '',
      imageUrl: '',
      attachmentName: '',
      attachmentUrl: '',
      sheetTitle: 'Bảng Đăng Ký Đồ Dùng & Phân Phối Tiết Dạy',
      sheetHeaders: 'Tuần, Khối Lớp, Tên Bài Học, Thiết Bị Cần Dùng, Người Thực Hiện, Ghi Chú',
    });
  };

  // Save Interactive Sheet Grid
  const handleSaveSheetData = () => {
    if (!selectedPostForSheet) return;
    const editorName = currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Thành viên nhà trường';

    storageService.updateAcademicSheetData(
      'TIEU_HOC',
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
      newRow[h] = idx === 0 ? `Dòng ${editableRows.length + 1}` : '';
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
        level: 'TIEU_HOC',
        channelId: chatChannel === 'ALL' ? 'GENERAL' : chatChannel,
        senderId: currentUser?.id || 'USER_TMP',
        senderName: currentUser?.name || 'Thầy/Cô Giáo viên',
        senderRole: currentUser?.role || 'GV',
        senderPosition: currentUser?.position || 'Giáo viên',
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
    storageService.toggleZaloReaction('TIEU_HOC', messageId, emoji, userName, activeSchoolYear);
    refreshData();
  };

  const filteredPosts = useMemo(() => {
    if (gradeFilter === 'ALL') return posts;
    return posts.filter((p) => p.grade?.toString() === gradeFilter);
  }, [posts, gradeFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-sky-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold text-sky-200 border border-white/20">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Cấp Tiểu Học (Khối 1, 2, 3, 4, 5) • GDPT 2018</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Cổng Chuyên Môn Cấp Tiểu Học
            </h2>
            <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
              Trang riêng phục vụ quản lý chuyên môn bậc Tiểu học. Tích hợp <strong>hình ảnh minh họa, giáo án, thời khóa biểu</strong>,
              điền trực tiếp <strong>mảng dữ liệu Google Sheets</strong> và không gian <strong>hỏi đáp nhanh phong cách Zalo</strong> giữa HT, PHT và Giáo viên.
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
              <span>Tương Tác Zalo Tiểu Học</span>
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
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-sky-50 text-blue-900 font-black text-xs shadow-md transition flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4 text-blue-700" />
                <span>Đăng Nội Dung Mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: DANH SÁCH BÀI VIẾT CHUYÊN MÔN TIỂU HỌC */}
      {activeTab === 'POSTS' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600">Khối lớp:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setGradeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    gradeFilter === 'ALL' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả khối 1 - 5
                </button>
                {[1, 2, 3, 4, 5].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGradeFilter(g.toString())}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      gradeFilter === g.toString() ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Khối {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Hiển thị <strong>{filteredPosts.length}</strong> chuyên đề & kế hoạch bài dạy
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
                          Ghim đầu trang
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Khối {post.grade || 'Tiểu học'} • {post.subject || 'Chuyên môn'}
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
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Table className="w-3.5 h-3.5 text-emerald-600" />
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
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      Hình ảnh hoạt động tiết dạy & minh họa:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {post.images.map((img, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-h-64 bg-slate-100">
                          <img
                            src={img}
                            alt="Chuyên môn tiểu học"
                            className="w-full h-full object-cover hover:scale-105 transition duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timetable Snippet if any */}
                {post.timetableSnippet && (
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-sky-950 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-sky-700" />
                        <span>Thời khóa biểu nhúng: <strong>{post.timetableSnippet.className}</strong> ({post.timetableSnippet.branchName})</span>
                      </div>
                      <span className="text-[11px] font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-lg">
                        {post.timetableSnippet.dayOfWeek}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {post.timetableSnippet.periods.map((p) => (
                        <div key={p.periodNumber} className="bg-white p-2.5 rounded-xl border border-sky-100 shadow-xs">
                          <div className="text-[10px] font-bold text-sky-700">Tiết {p.periodNumber}</div>
                          <div className="font-extrabold text-slate-900 truncate">{p.subject}</div>
                          <div className="text-[10px] text-slate-500 truncate">{p.teacher}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Sheet Preview Snippet */}
                {post.sheetData && (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <Table className="w-4 h-4 text-emerald-700" />
                        <span>Mảng Google Sheet Tương Tác: {post.sheetData.sheetTitle}</span>
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Cập nhật bởi: <strong>{post.sheetData.lastEditedBy || 'Hệ thống'}</strong> ({post.sheetData.lastEditedAt || 'Mới nhất'})
                      </div>
                    </div>

                    {/* Mini Sheet Grid Preview */}
                    <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-white shadow-xs">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-emerald-700 text-white font-bold text-[11px]">
                          <tr>
                            {post.sheetData.headers.map((h, i) => (
                              <th key={i} className="px-3 py-2 border-r border-emerald-600 last:border-r-0">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {post.sheetData.rows.slice(0, 3).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-emerald-50/40">
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
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
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
                        <span className="text-[10px] text-slate-400">({att.size || 'PDF'})</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ĐIỀN NỘI DUNG VÀO MẢNG GOOGLE SHEETS TRỰC TIẾP (YÊU CẦU 4.3) */}
      {activeTab === 'SHEET_EDIT' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 uppercase">
                  Google Sheets Tương Tác Trực Tuyến
                </span>
                {sheetSaveSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã lưu đồng bộ thành công!
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {selectedPostForSheet?.sheetData?.sheetTitle || 'Bảng Tính Phân Phối Chương Trình & Đồ Dùng Dạy Học Tiểu Học'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Giáo viên nhấp trực tiếp vào từng ô dưới đây để điền nội dung bài dạy, thiết bị cần dùng, hoặc điểm số.
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
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 active:scale-95"
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
                <thead className="bg-emerald-800 text-white font-black text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 w-12 text-center border-r border-emerald-700">#</th>
                    {selectedPostForSheet.sheetData.headers.map((header, hIdx) => (
                      <th key={hIdx} className="px-3.5 py-3 border-r border-emerald-700 last:border-r-0">
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
                            className="w-full px-2.5 py-1.5 text-xs text-slate-800 rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-emerald-50/30 outline-none transition"
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
              Dữ liệu được lưu trữ tự động trên hệ thống nội bộ và sẵn sàng đồng bộ Google Sheets qua Apps Script.
            </div>
            <div>
              Lần sửa gần nhất: <strong>{selectedPostForSheet?.sheetData?.lastEditedBy || 'Chưa sửa'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TƯƠNG TÁC HỎI ĐÁP NGẮN GIỐNG ZALO (YÊU CẦU 4.3) */}
      {activeTab === 'ZALO_CHAT' && (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[650px]">
          {/* Zalo Header */}
          <div className="bg-gradient-to-r from-blue-700 to-sky-700 text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-blue-700 flex items-center justify-center font-black text-sm shadow">
                Zalo
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base flex items-center gap-2">
                  <span>Nhóm Trao Đổi Chuyên Môn Tiểu Học</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </h4>
                <p className="text-[11px] text-sky-100">
                  HT, PHT và toàn thể giáo viên cấp Tiểu học tương tác, hỏi đáp nghiệp vụ tức thời.
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
                <option value="GENERAL" className="text-slate-900">Kênh chung Tiểu học</option>
                <option value="STEM" className="text-slate-900">Tổ Chuyên đề STEM</option>
                <option value="KHOI_1_2" className="text-slate-900">Tổ Khối 1 & 2</option>
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
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {msg.senderName.slice(-2)}
                  </div>

                  {/* Message bubble */}
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                      <span className="font-bold text-slate-800">{msg.senderName}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                        isHt ? 'bg-red-100 text-red-800' : isPht ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {msg.senderPosition || msg.senderRole}
                      </span>
                      <span className="text-slate-400 text-[10px]">{msg.timestamp.slice(11, 16)}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
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
                        onClick={() => handleReaction(msg.id, '👏')}
                        className="text-slate-400 hover:text-amber-600 text-xs px-1"
                        title="Vỗ tay"
                      >
                        👏
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
              <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 text-blue-900 rounded-xl text-xs">
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
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />

              <button
                type="button"
                onClick={() => {
                  const url = prompt('Nhập đường dẫn URL hình ảnh muốn gửi trong chat:');
                  if (url) setChatAttachmentUrl(url);
                }}
                className="p-2.5 text-slate-500 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition"
                title="Đính kèm ảnh"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: BÁO CÁO TIẾN ĐỘ CHỈ TIÊU CHUYÊN MÔN (RECHARTS) */}
      {activeTab === 'REPORTS' && (
        <PrimaryAcademicProgressReport
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
                <BookOpen className="w-5 h-5 text-blue-700" />
                <span>Đăng Nội Dung / Kế Hoạch Chuyên Môn Tiểu Học</span>
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
                    <option value={1}>Khối 1 (Tiểu học)</option>
                    <option value={2}>Khối 2 (Tiểu học)</option>
                    <option value={3}>Khối 3 (Tiểu học)</option>
                    <option value={4}>Khối 4 (Tiểu học)</option>
                    <option value={5}>Khối 5 (Tiểu học)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môn học / Chuyên đề <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPostData.subject}
                    onChange={(e) => setNewPostData({ ...newPostData, subject: e.target.value })}
                    placeholder="VD: Toán, Tiếng Việt, STEM..."
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
                  placeholder="Nhập tiêu đề chuyên đề, hội giảng, kế hoạch..."
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
                  placeholder="Mục tiêu bài học, phương pháp tổ chức hoạt động, lưu ý sư phạm..."
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
                    Tên file giáo án / kế hoạch đính kèm
                  </label>
                  <input
                    type="text"
                    value={newPostData.attachmentName}
                    onChange={(e) => setNewPostData({ ...newPostData, attachmentName: e.target.value })}
                    placeholder="Giao_an_STEM_khoi3.pdf"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-emerald-700" />
                  Khởi tạo mảng Google Sheet điền nội dung trực tiếp
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
                  className="px-6 py-2 text-xs font-black text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow"
                >
                  Đăng Bài Chuyên Môn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
