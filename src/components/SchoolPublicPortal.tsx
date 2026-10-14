import React, { useState, useMemo } from 'react';
import {
  SchoolPublicArticle,
  ArticleCategory,
  UserAccount,
  Role,
  SchoolAchievement,
} from '../types/school';
import { storageService } from '../services/storageService';
import {
  Globe,
  Bell,
  Calendar,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Pin,
  Eye,
  Search,
  Filter,
  Paperclip,
  Image as ImageIcon,
  Edit3,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  Award,
  ChevronRight,
  BookOpen,
  Share2,
  Trash2,
  Plus,
  Users,
  Landmark,
  Building2,
  Trophy,
  History,
  Target,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
} from 'lucide-react';

interface SchoolPublicPortalProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  allStaff: Array<{ account: UserAccount }>;
  onRefreshData?: () => void;
}

export const SchoolPublicPortal: React.FC<SchoolPublicPortalProps> = ({
  currentUser,
  activeSchoolYear,
  allStaff,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'NEWS' | 'ANNOUNCEMENTS' | 'ABOUT' | 'MANAGEMENT'>('NEWS');
  const [aboutSection, setAboutSection] = useState<'ORGANIZATION' | 'STAFF' | 'TRADITION' | 'ACHIEVEMENTS'>('ORGANIZATION');

  const [articles, setArticles] = useState<SchoolPublicArticle[]>(() =>
    storageService.getPublicArticles(activeSchoolYear)
  );

  // Achievements state
  const [achievements, setAchievements] = useState<SchoolAchievement[]>(() =>
    storageService.getAchievements()
  );
  const [achievementFilter, setAchievementFilter] = useState<'ALL' | 'GIAO_VIEN' | 'HOC_SINH' | 'TAP_THE'>('ALL');
  const [showAddAchievementModal, setShowAddAchievementModal] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    type: 'HOC_SINH' as 'GIAO_VIEN' | 'HOC_SINH' | 'TAP_THE',
    recipientName: '',
    roleOrClass: '',
    title: '',
    awardLevel: 'CAP_HUYEN' as 'CAP_TRUONG' | 'CAP_HUYEN' | 'CAP_TINH' | 'CAP_QUOC_GIA',
    year: `Năm học ${activeSchoolYear}`,
    dateAwarded: 'Tháng 10/2026',
    awardingBody: 'Phòng GD&ĐT Huyện Đồng Xuân',
    description: '',
    photoUrl: '',
  });

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [audienceFilter, setAudienceFilter] = useState<string>('ALL');

  // Detail modal
  const [selectedArticle, setSelectedArticle] = useState<SchoolPublicArticle | null>(null);

  // Create article modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newArticleData, setNewArticleData] = useState({
    category: 'HOAT_DONG' as ArticleCategory,
    categoryLabel: 'Hoạt Động Giáo Dục',
    title: '',
    summary: '',
    content: '',
    featuredImage: '',
    imagesText: '',
    attachmentName: '',
    attachmentUrl: '',
    isPinned: false,
    targetAudience: 'TOAN_TRUONG' as SchoolPublicArticle['targetAudience'],
  });

  // HT approval modal
  const [approveModalItem, setApproveModalItem] = useState<SchoolPublicArticle | null>(null);
  const [approvalNote, setApprovalNote] = useState('');

  // HT reject modal
  const [rejectModalItem, setRejectModalItem] = useState<SchoolPublicArticle | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const isPrincipal = currentUser?.role === 'HT';
  const isPhtOrTeacher = currentUser?.role === 'PHT' || currentUser?.role === 'GV' || currentUser?.role === 'GV_TIN_HOC';
  const canWriteArticles = isPrincipal || isPhtOrTeacher;

  const refreshArticles = () => {
    const list = storageService.getPublicArticles(activeSchoolYear);
    setArticles(list);
    if (onRefreshData) onRefreshData();
  };

  const categoryLabels: Record<ArticleCategory, string> = {
    HOAT_DONG: 'Hoạt Động Giáo Dục',
    LE_KY_NIEM: 'Lễ Kỷ Niệm & Đại Lễ',
    THONG_BAO_PHHS: 'Thông Báo Đến Cha Mẹ HS',
    PHONG_TRAO: 'Phong Trào & Thi Đua',
    TIN_TUC: 'Tin Tức Nhà Trường',
  };

  // Submit article
  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticleData.title.trim() || !newArticleData.content.trim()) return;

    const author: UserAccount = currentUser || {
      id: 'GUEST_AUTHOR',
      username: 'banbientap',
      name: 'Ban Biên Tập Nhà Trường',
      role: 'GV',
      position: 'Cán bộ truyền thông',
      branchName: 'Trụ sở chính',
      campusId: 'CAMPUS_MAIN',
      campusName: 'Trụ sở chính',
      email: 'bientap@dongxuan.edu.vn',
      phone: '0913.882.115',
      driveFolderId: '',
      sheetFileId: '',
      sheetUrl: '',
      status: 'ACTIVE',
    };

    const images = newArticleData.imagesText
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const attachments = newArticleData.attachmentName.trim()
      ? [{ name: newArticleData.attachmentName.trim(), url: newArticleData.attachmentUrl.trim() || '#', size: 'Tài liệu' }]
      : undefined;

    storageService.addPublicArticle(
      {
        schoolYear: activeSchoolYear,
        category: newArticleData.category,
        categoryLabel: categoryLabels[newArticleData.category],
        title: newArticleData.title.trim(),
        summary: newArticleData.summary.trim() || newArticleData.content.trim().slice(0, 150) + '...',
        content: newArticleData.content.trim(),
        featuredImage: newArticleData.featuredImage.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        attachments,
        authorId: author.id,
        authorName: author.name,
        authorRole: author.role,
        authorPosition: author.position || 'Cán bộ giáo viên',
        isPinned: newArticleData.isPinned,
        targetAudience: newArticleData.targetAudience,
      },
      author,
      activeSchoolYear
    );

    refreshArticles();
    setShowCreateModal(false);
    setNewArticleData({
      category: 'HOAT_DONG',
      categoryLabel: 'Hoạt Động Giáo Dục',
      title: '',
      summary: '',
      content: '',
      featuredImage: '',
      imagesText: '',
      attachmentName: '',
      attachmentUrl: '',
      isPinned: false,
      targetAudience: 'TOAN_TRUONG',
    });
  };

  // HT approves article
  const handleConfirmApproval = () => {
    if (!approveModalItem) return;
    storageService.htApproveArticle(
      approveModalItem.id,
      approvalNote.trim() || 'ĐÃ DUYỆT XUẤT BẢN: Nội dung chuẩn mực, phản ánh đúng hoạt động nhà trường. - Hiệu trưởng Nguyễn Quốc Bảo.',
      activeSchoolYear
    );
    refreshArticles();
    setApproveModalItem(null);
    setApprovalNote('');
  };

  // HT rejects article
  const handleConfirmReject = () => {
    if (!rejectModalItem) return;
    storageService.htRejectArticle(
      rejectModalItem.id,
      rejectReason.trim() || 'Chưa đạt yêu cầu xuất bản. Đề nghị chỉnh sửa nội dung và gửi lại.',
      activeSchoolYear
    );
    refreshArticles();
    setRejectModalItem(null);
    setRejectReason('');
  };

  // Toggle pin
  const handleTogglePin = (id: string) => {
    storageService.togglePinArticle(id, activeSchoolYear);
    refreshArticles();
  };

  // Delete article
  const handleDeleteArticle = (id: string) => {
    if (confirm('Đồng chí có chắc chắn muốn xóa bài viết này không?')) {
      storageService.deleteArticle(id, activeSchoolYear);
      refreshArticles();
    }
  };

  // Achievement handler
  const handleSaveAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchievement.recipientName.trim() || !newAchievement.title.trim()) return;
    storageService.addAchievement({
      type: newAchievement.type,
      recipientName: newAchievement.recipientName.trim(),
      roleOrClass: newAchievement.roleOrClass.trim(),
      title: newAchievement.title.trim(),
      awardLevel: newAchievement.awardLevel,
      year: newAchievement.year,
      dateAwarded: newAchievement.dateAwarded,
      awardingBody: newAchievement.awardingBody.trim() || 'Phòng GD&ĐT Huyện Đồng Xuân',
      description: newAchievement.description.trim(),
      photoUrl: newAchievement.photoUrl.trim() || undefined,
    });
    setAchievements(storageService.getAchievements());
    setShowAddAchievementModal(false);
    setNewAchievement({
      type: 'HOC_SINH',
      recipientName: '',
      roleOrClass: '',
      title: '',
      awardLevel: 'CAP_HUYEN',
      year: `Năm học ${activeSchoolYear}`,
      dateAwarded: 'Tháng 10/2026',
      awardingBody: 'Phòng GD&ĐT Huyện Đồng Xuân',
      description: '',
      photoUrl: '',
    });
  };

  const filteredAchievements = useMemo(() => {
    if (achievementFilter === 'ALL') return achievements;
    return achievements.filter((ach) => ach.type === achievementFilter);
  }, [achievements, achievementFilter]);

  // Published articles for Public / Parents / Students
  const publishedArticles = useMemo(() => {
    return articles
      .filter((a) => a.status === 'DA_XUAT_BAN')
      .filter((a) => {
        if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
        if (audienceFilter !== 'ALL' && a.targetAudience !== audienceFilter && a.targetAudience !== 'TOAN_TRUONG') return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const inTitle = a.title.toLowerCase().includes(q);
          const inSummary = a.summary.toLowerCase().includes(q);
          const inContent = a.content.toLowerCase().includes(q);
          if (!inTitle && !inSummary && !inContent) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [articles, categoryFilter, audienceFilter, searchTerm]);

  // Announcements only
  const announcementsList = useMemo(() => {
    return articles
      .filter((a) => a.status === 'DA_XUAT_BAN' && a.category === 'THONG_BAO_PHHS')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [articles]);

  // Management articles (visible to authors and HT)
  const managementArticles = useMemo(() => {
    return articles.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [articles]);

  const pendingApprovalCount = useMemo(() => {
    return articles.filter((a) => a.status === 'CHO_HT_DUYET').length;
  }, [articles]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-800 via-rose-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold text-amber-200 border border-white/20">
              <Globe className="w-3.5 h-3.5" />
              <span>Cổng Thông Tin Công Khai & Trang Hoạt Động Dành Cho Phụ Huynh & Học Sinh</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Bản Tin Hoạt Động, Lễ Kỷ Niệm & Thông Báo Công Khai
            </h2>
            <p className="text-rose-100 text-xs sm:text-sm leading-relaxed">
              Trang thông tin chính thống của Trường TH & THCS Đồng Xuân. Phụ huynh và học sinh theo dõi tại đây để nắm bắt các
              <strong> hoạt động giáo dục, lễ khai giảng, 20/11, hội thi phong trào</strong> và các <strong>thông báo công khai</strong> về lịch học, tiêm chủng, bán trú.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveSubTab('NEWS')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 ${
                activeSubTab === 'NEWS'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Tin Tức & Hoạt Động ({publishedArticles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('ANNOUNCEMENTS')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 ${
                activeSubTab === 'ANNOUNCEMENTS'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Thông Báo PHHS ({announcementsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('ABOUT')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 ${
                activeSubTab === 'ABOUT'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Cơ Cấu Tổ Chức & Truyền Thống, Thành Tích</span>
            </button>

            {canWriteArticles && (
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
                <span>Phân Quyền & Duyệt Bài</span>
                {pendingApprovalCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] animate-pulse">
                    {pendingApprovalCount}
                  </span>
                )}
              </button>
            )}

            {canWriteArticles && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-red-900 font-black text-xs shadow-md transition flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4 text-red-700" />
                <span>Viết Bài Mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUBTAB 1: TRANG HOẠT ĐỘNG, TIN TỨC & LỄ KỶ NIỆM (YÊU CẦU 1) */}
      {activeSubTab === 'NEWS' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm bài viết, lễ kỷ niệm, thông báo, từ khóa..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Chủ đề:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold bg-white text-slate-700"
              >
                <option value="ALL">Tất cả bài viết</option>
                <option value="LE_KY_NIEM">Lễ Kỷ Niệm & Đại Lễ</option>
                <option value="HOAT_DONG">Hoạt Động Giáo Dục</option>
                <option value="THONG_BAO_PHHS">Thông Báo Đến Cha Mẹ HS</option>
                <option value="PHONG_TRAO">Phong Trào & Thi Đua</option>
                <option value="TIN_TUC">Tin Tức Nhà Trường</option>
              </select>

              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold bg-white text-slate-700"
              >
                <option value="ALL">Mọi đối tượng</option>
                <option value="TOAN_TRUONG">Toàn trường</option>
                <option value="PHHS_TIEU_HOC">Cha mẹ HS Tiểu học</option>
                <option value="PHHS_THCS">Cha mẹ HS THCS</option>
                <option value="HOC_SINH">Học sinh</option>
              </select>
            </div>
          </div>

          {/* Articles Grid */}
          {publishedArticles.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-800 text-base">Chưa có bài viết nào phù hợp</h4>
              <p className="text-xs text-slate-500 mt-1">
                Các bài viết và thông báo mới sẽ xuất hiện ở đây sau khi được Thầy Hiệu trưởng duyệt xuất bản.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-lg hover:border-red-300 transition duration-300 flex flex-col cursor-pointer group"
                >
                  {/* Article Thumbnail */}
                  <div className="relative h-48 sm:h-52 bg-slate-100 overflow-hidden">
                    <img
                      src={
                        article.featuredImage ||
                        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-700 text-white shadow-md">
                        {article.categoryLabel}
                      </span>
                      {article.isPinned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-md flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" />
                          Ghim
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-white text-[10px] font-mono flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-300" />
                      <span>{article.viewCount || 1}</span>
                    </div>
                  </div>

                  {/* Article Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{article.createdAt.slice(0, 10)}</span>
                        <span>•</span>
                        <span className="text-slate-600 font-semibold">{article.authorName}</span>
                      </div>

                      <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-red-700 transition line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-red-700 flex items-center gap-1 group-hover:translate-x-1 transition">
                        <span>Đọc chi tiết</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] text-slate-400 italic">
                        ✓ HT đã phê duyệt
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: THÔNG BÁO DÀNH RIÊNG CHO PHỤ HUYNH HỌC SINH (YÊU CẦU 1) */}
      {activeSubTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-amber-950 text-xs">
            <Bell className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div>
              <strong>Kênh Thông Báo Chính Thống Dành Cho Cha Mẹ Học Sinh:</strong> Các văn bản, thông báo tiêm chủng,
              lịch nghỉ lễ, chế độ hỗ trợ chi phí học tập và kế hoạch họp phụ huynh được cập nhật công khai, minh bạch.
            </div>
          </div>

          <div className="space-y-4">
            {announcementsList.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedArticle(item)}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 hover:border-amber-400 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center flex-shrink-0 font-black">
                    <Bell className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        THÔNG BÁO PHHS
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.createdAt}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 hover:text-amber-800 transition">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{item.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs flex items-center gap-1 transition"
                  >
                    <span>Xem toàn văn</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB: CƠ CẤU TỔ CHỨC, NHÂN SỰ, TRUYỀN THỐNG & THÀNH TÍCH (YÊU CẦU 2) */}
      {activeSubTab === 'ABOUT' && (
        <div className="space-y-6">
          {/* Sub Navigation Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setAboutSection('ORGANIZATION')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  aboutSection === 'ORGANIZATION'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Cơ Cấu Tổ Chức</span>
              </button>

              <button
                type="button"
                onClick={() => setAboutSection('STAFF')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  aboutSection === 'STAFF'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Cơ Cấu Nhân Sự (137)</span>
              </button>

              <button
                type="button"
                onClick={() => setAboutSection('TRADITION')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  aboutSection === 'TRADITION'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Lịch Sử & Truyền Thống</span>
              </button>

              <button
                type="button"
                onClick={() => setAboutSection('ACHIEVEMENTS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  aboutSection === 'ACHIEVEMENTS'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Bảng Vàng Thành Tích ({achievements.length})</span>
              </button>
            </div>

            {aboutSection === 'ACHIEVEMENTS' && (isPrincipal || currentUser?.role === 'PHT') && (
              <button
                type="button"
                onClick={() => setShowAddAchievementModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Thành Tích Mới</span>
              </button>
            )}
          </div>

          {/* SECTION 1: CƠ CẤU TỔ CHỨC NHÀ TRƯỜNG */}
          {aboutSection === 'ORGANIZATION' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/20">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Sơ Đồ Tổ Chức Bộ Máy Quản Lý & Chuyên Môn</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  Cơ Cấu Tổ Chức Trường Tiểu Học & THCS Đồng Xuân
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                  Nhà trường hoạt động theo Điều lệ trường phổ thông có nhiều cấp học của Bộ Giáo dục & Đào tạo, tổ chức khoa học gồm Ban Giám hiệu chỉ đạo toàn diện, các Tổ chuyên môn trực tiếp giảng dạy và các đoàn thể chính trị - xã hội phối hợp đồng bộ.
                </p>
              </div>

              {/* Tier 1: Ban Giám Hiệu & Hội Đồng Trường */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-black text-xs">
                    01
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">
                      Lãnh Đạo Nhà Trường (Ban Giám Hiệu & Hội Đồng Trường)
                    </h4>
                    <p className="text-[11px] text-slate-500">Chỉ đạo toàn diện đường lối giáo dục, quản trị tài chính, nhân sự và chất lượng đào tạo</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 text-[10px] font-black uppercase">
                        Hiệu Trưởng
                      </span>
                      <span className="text-[11px] text-amber-800 font-bold">Bí thư Chi bộ</span>
                    </div>
                    <div className="font-black text-slate-900 text-base">Thầy Nguyễn Quốc Bảo</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Phụ trách chung toàn diện; trực tiếp chỉ đạo kế hoạch chiến lược, công tác chính trị tư tưởng, tổ chức cán bộ, tài chính - ngân sách và chuyển đổi số.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-sky-200 text-sky-950 text-[10px] font-black uppercase">
                        Phó Hiệu Trưởng 1
                      </span>
                      <span className="text-[11px] text-sky-800 font-bold">Chủ tịch Công đoàn</span>
                    </div>
                    <div className="font-black text-slate-900 text-base">Thầy Lê Văn Cường</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Phụ trách Chuyên môn cấp THCS (Khối 6, 7, 8, 9), thi tuyển sinh lớp 10, công tác cơ sở vật chất - sửa chữa trường lớp và phụ trách Phân hiệu Triêm Đức.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-950 text-[10px] font-black uppercase">
                        Phó Hiệu Trưởng 2
                      </span>
                      <span className="text-[11px] text-emerald-800 font-bold">Phó Bí thư Chi bộ</span>
                    </div>
                    <div className="font-black text-slate-900 text-base">Cô Nguyễn Thị Bích</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Phụ trách Chuyên môn cấp Tiểu học (Khối 1 đến Khối 5), công tác phổ cập giáo dục, kiểm định chất lượng, hoạt động bán trú và phụ trách Phân hiệu Phú Mỡ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tier 2: 6 Tổ Chuyên Môn & Văn Phòng */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
                    02
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">
                      Hệ Thống 6 Tổ Chuyên Môn & Tổ Văn Phòng Phục Vụ
                    </h4>
                    <p className="text-[11px] text-slate-500">Trực tiếp triển khai chương trình GDPT 2018 và hỗ trợ vận hành trường học</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">Tổ Tiểu Học 1 (Khối 1, 2, 3)</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 font-bold text-[10px]">24 GV</span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Tổ trưởng:</strong> Cô Trần Thị Mai<br />
                      <strong>Tổ phó:</strong> Cô Lê Thị Hà<br />
                      <strong>Nhiệm vụ:</strong> Rèn nền nếp đọc viết, toán học ban đầu, rèn chữ giữ vở và kỹ năng sống.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">Tổ Tiểu Học 2 (Khối 4, 5)</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 font-bold text-[10px]">22 GV</span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Tổ trưởng:</strong> Thầy Phạm Văn Nam<br />
                      <strong>Tổ phó:</strong> Cô Nguyễn Thị Lan<br />
                      <strong>Nhiệm vụ:</strong> Nâng cao kiến thức chuẩn bị chuyển cấp THCS, bồi dưỡng giao lưu viết chữ đẹp, toán tuổi thơ.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">Tổ KHTN Cấp THCS</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 font-bold text-[10px]">26 GV</span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Tổ trưởng:</strong> Thầy Vũ Đình Trọng<br />
                      <strong>Bộ môn:</strong> Toán, Khoa học tự nhiên (Lý, Hóa, Sinh), Công nghệ, Tin học THCS.<br />
                      <strong>Nhiệm vụ:</strong> Dạy học trải nghiệm STEM, thí nghiệm thực hành, luyện thi HSG và vào lớp 10.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">Tổ KHXH Cấp THCS</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 font-bold text-[10px]">25 GV</span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Tổ trưởng:</strong> Cô Lê Thị Thu Thảo<br />
                      <strong>Bộ môn:</strong> Ngữ văn, Lịch sử & Địa lý, GDCD, Hoạt động trải nghiệm hướng nghiệp.<br />
                      <strong>Nhiệm vụ:</strong> Giáo dục truyền thống, đạo đức học sinh, bồi dưỡng học sinh giỏi văn hóa.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">Tổ Ngoại Ngữ & Nghệ Thuật</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 font-bold text-[10px]">18 GV</span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Tổ trưởng:</strong> Thầy Nguyễn Trọng Hoàng<br />
                      <strong>Bộ môn:</strong> Tiếng Anh liên cấp 1-9, Tin học tiểu học, Âm nhạc, Mỹ thuật, GDTC.<br />
                      <strong>Nhiệm vụ:</strong> Phát triển năng khiếu nghệ thuật, thể dục thể thao, ngoại ngữ và CNTT.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">Tổ Văn Phòng & Phục Vụ</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 font-bold text-[10px]">14 NV</span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Tổ trưởng:</strong> Cô Hoàng Mỹ Linh (Y tế)<br />
                      <strong>Bộ phận:</strong> Kế toán, Thủ quỹ, Văn thư, Thư viện - Thiết bị, Y tế học đường, Bảo vệ.<br />
                      <strong>Nhiệm vụ:</strong> Bảo đảm hậu cần, an ninh trường học, chăm sóc sức khỏe ban đầu cho học sinh.
                    </div>
                  </div>
                </div>
              </div>

              {/* Tier 3: Đoàn thể & Ban đại diện CMHS */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                    03
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">
                      Tổ Chức Đoàn Thể & Ban Đại Diện Cha Mẹ Học Sinh
                    </h4>
                    <p className="text-[11px] text-slate-500">Cầu nối vững chắc giữa gia đình - nhà trường - xã hội</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200">
                    <div className="font-bold text-rose-950 mb-1">Chi Bộ Đảng Cơ Sở</div>
                    <div className="text-slate-600">52 Đảng viên gương mẫu đi đầu trong phong trào thi đua dạy tốt học tốt.</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                    <div className="font-bold text-amber-950 mb-1">Công Đoàn Cơ Sở</div>
                    <div className="text-slate-600">Chăm lo đời sống, bảo vệ quyền lợi hợp pháp của 137 cán bộ giáo viên nhân viên.</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200">
                    <div className="font-bold text-sky-950 mb-1">Liên Đội Đội TNTP</div>
                    <div className="text-slate-600">57 Chi đội & lớp Nhi đồng; rèn luyện theo 5 Điều Bác Hồ dạy; đạt Liên đội xuất sắc.</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <div className="font-bold text-emerald-950 mb-1">Ban Đại Diện CMHS</div>
                    <div className="text-slate-600">Đồng hành trong mọi hoạt động, hỗ trợ học sinh có hoàn cảnh khó khăn và bán trú.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CƠ CẤU NHÂN SỰ TOÀN TRƯỜNG */}
          {aboutSection === 'STAFF' && (
            <div className="space-y-6">
              {/* Statistical KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
                  <div className="text-3xl font-black text-red-700">137</div>
                  <div className="text-xs font-bold text-slate-700 mt-1">Tổng Số CB-GV-NV</div>
                  <div className="text-[10px] text-slate-400">100% biên chế & hợp đồng chuẩn</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
                  <div className="text-3xl font-black text-emerald-700">100%</div>
                  <div className="text-xs font-bold text-slate-700 mt-1">Chuẩn & Trên Chuẩn</div>
                  <div className="text-[10px] text-slate-400">4 Thạc sĩ, 118 Đại học, 15 CĐ</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
                  <div className="text-3xl font-black text-amber-700">52</div>
                  <div className="text-xs font-bold text-slate-700 mt-1">Đảng Viên Đảng CSVN</div>
                  <div className="text-[10px] text-slate-400">Chiếm 38.0% tổng đội ngũ</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
                  <div className="text-3xl font-black text-blue-700">6</div>
                  <div className="text-xs font-bold text-slate-700 mt-1">Điểm Trường & Phân Hiệu</div>
                  <div className="text-[10px] text-slate-400">Phục vụ học sinh vùng rộng lớn</div>
                </div>
              </div>

              {/* Staff distribution across 6 branches */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">
                      Phân Bổ Nhân Sự Giáo Viên & Nhân Viên Tại 6 Phân Hiệu
                    </h4>
                    <p className="text-[11px] text-slate-500">Bảo đảm đủ giáo viên văn hóa và chuyên biệt tại tất cả các điểm lẻ</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    Tổng 57 Lớp • 1.289 Học Sinh
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-black text-slate-900">
                      <span>1. Trụ Sở Chính (Trung tâm)</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px]">64 GV-NV</span>
                    </div>
                    <div className="text-slate-600">
                      • Phụ trách 24 lớp (Khối THCS 6, 7, 8, 9 và Tiểu học trung tâm)<br />
                      • Đầy đủ phòng bộ môn, phòng máy vi tính, thư viện đạt chuẩn.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-black text-slate-900">
                      <span>2. Phân Hiệu Triêm Đức</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">22 GV-NV</span>
                    </div>
                    <div className="text-slate-600">
                      • Phụ trách 10 lớp Tiểu học từ Lớp 1 đến Lớp 5.<br />
                      • Có sân chơi bãi tập, lớp bán trú và phòng đọc sách vệ tinh.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-black text-slate-900">
                      <span>3. Phân Hiệu Phú Mỡ</span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px]">18 GV-NV</span>
                    </div>
                    <div className="text-slate-600">
                      • Phụ trách 8 lớp tiểu học con em đồng bào dân tộc thiểu số.<br />
                      • Tăng cường dạy Tiếng Việt và chính sách hỗ trợ bán trú dân tộc.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-black text-slate-900">
                      <span>4. Phân Hiệu Suối Cối 1</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">14 GV-NV</span>
                    </div>
                    <div className="text-slate-600">
                      • Phụ trách 6 lớp học sinh tiểu học.<br />
                      • Giáo viên luân phiên giảng dạy các môn Tiếng Anh và Tin học.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-black text-slate-900">
                      <span>5. Phân Hiệu Suối Cối 2</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">11 GV-NV</span>
                    </div>
                    <div className="text-slate-600">
                      • Phụ trách 5 lớp học sinh tiểu học.<br />
                      • 100% học sinh học 2 buổi/ngày theo chương trình GDPT 2018.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-black text-slate-900">
                      <span>6. Phân Hiệu Phước Bình</span>
                      <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px]">8 GV-NV</span>
                    </div>
                    <div className="text-slate-600">
                      • Phụ trách 4 lớp tiểu học vùng sâu nhất của xã.<br />
                      • Giáo viên cắm bản tận tụy, duy trì sĩ số chuyên cần đạt trên 99%.
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Contact Directory for Parents */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-black text-slate-900 uppercase">
                    Danh Bạ Công Khai Lãnh Đạo & Cán Bộ Đầu Mối Để Cha Mẹ Học Sinh Tiện Liên Hệ
                  </h4>
                  <p className="text-[11px] text-slate-500">Mọi thắc mắc về học tập, nề nếp hoặc bán trú xin vui lòng liên hệ trực tiếp các thầy cô</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                    <img
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80"
                      alt="Hiệu trưởng"
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-300 flex-shrink-0"
                    />
                    <div className="text-xs space-y-1">
                      <div className="font-black text-slate-900">Thầy Nguyễn Quốc Bảo</div>
                      <div className="text-[11px] font-bold text-red-700">Hiệu trưởng (Chỉ đạo chung)</div>
                      <div className="text-slate-500 flex items-center gap-1.5 pt-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>0913.882.115 (Công vụ)</span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>hieutruong.dongxuan@phuyen.edu.vn</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                      alt="Phó Hiệu trưởng THCS"
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-300 flex-shrink-0"
                    />
                    <div className="text-xs space-y-1">
                      <div className="font-black text-slate-900">Thầy Lê Văn Cường</div>
                      <div className="text-[11px] font-bold text-sky-700">Phó Hiệu trưởng (Phụ trách THCS)</div>
                      <div className="text-slate-500 flex items-center gap-1.5 pt-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>0982.554.219</span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>pht.cuong@dongxuan.edu.vn</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
                      alt="Phó Hiệu trưởng Tiểu học"
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-300 flex-shrink-0"
                    />
                    <div className="text-xs space-y-1">
                      <div className="font-black text-slate-900">Cô Nguyễn Thị Bích</div>
                      <div className="text-[11px] font-bold text-emerald-700">Phó Hiệu trưởng (Phụ trách Tiểu học)</div>
                      <div className="text-slate-500 flex items-center gap-1.5 pt-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>0979.663.882</span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>pht.bich@dongxuan.edu.vn</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: LỊCH SỬ & TRUYỀN THỐNG NHÀ TRƯỜNG */}
          {aboutSection === 'TRADITION' && (
            <div className="space-y-6">
              {/* History Narrative Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700">
                  <History className="w-4 h-4" />
                  <span>Chặng Đường Hơn 28 Năm Xây Dựng & Trưởng Thành</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Truyền Thống Hiếu Học & Khát Vọng Vươn Lên Của Thầy Trò Đồng Xuân
                </h3>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-medium">
                  <p>
                    Trường Tiểu học & Trung học Cơ sở Đồng Xuân tọa lạc tại vùng đất giàu truyền thống cách mạng thuộc Huyện Đồng Xuân, Tỉnh Phú Yên. Được thành lập từ những năm cuối thập niên 90 với cơ sở ban đầu là những lớp học tranh tre nứa lá nép mình bên sườn đồi, thầy và trò nhà trường đã trải qua biết bao thăng trầm, gian khó để gieo từng con chữ cho con em đồng bào vùng cao.
                  </p>
                  <p>
                    Vượt lên trên những cách trở về địa hình sông suối, đồi núi quanh co nối giữa 6 phân hiệu trải dài hàng chục cây số, các thế hệ nhà giáo Đồng Xuân luôn nêu cao tinh thần: <em>"Tất cả vì học sinh thân yêu", "Cõng chữ lên non, bám trường bám lớp"</em>. Nhờ sự quan tâm của Đảng ủy, chính quyền địa phương và sự chung tay của phụ huynh, trường đã từng bước kiên cố hóa trường lớp, xây dựng khuôn viên xanh - sạch - đẹp - an toàn.
                  </p>
                  <p>
                    Từ mái trường này, hàng ngàn học sinh đã trưởng thành, nhiều em đã trở thành bác sĩ, kỹ sư, sĩ quan quân đội, cán bộ chủ chốt của huyện và tỉnh, đóng góp tích cực cho sự nghiệp xây dựng quê hương đất nước.
                  </p>
                </div>
              </div>

              {/* Historical Milestones Timeline */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <h4 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Các Cột Mốc Vàng Son Trong Lịch Sử Phát Triển</span>
                </h4>

                <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-red-200">
                  <div className="flex items-start gap-4 relative">
                    <div className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center font-black text-xs flex-shrink-0 z-10 shadow-sm">
                      1
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between font-black text-slate-900">
                        <span className="text-sm">Năm 1998: Thành Lập Cụm Trường Liên Xã</span>
                        <span className="text-red-700">Giai đoạn kiến thiết</span>
                      </div>
                      <p className="text-slate-600">
                        Quyết định thành lập trường nhằm thống nhất quản lý các điểm trường lẻ, tập trung nguồn lực giáo viên và duy trì xóa mù chữ cho học sinh vùng sâu.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative">
                    <div className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center font-black text-xs flex-shrink-0 z-10 shadow-sm">
                      2
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between font-black text-slate-900">
                        <span className="text-sm">Năm 2012: Đạt Chuẩn Quốc Gia Mức Độ 1</span>
                        <span className="text-emerald-700">Dấu mốc chuẩn hóa</span>
                      </div>
                      <p className="text-slate-600">
                        UBND Tỉnh Phú Yên trao Bằng công nhận Trường đạt Chuẩn Quốc gia Mức độ 1 sau quá trình hiện đại hóa phòng học, phòng tin học và thư viện.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative">
                    <div className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center font-black text-xs flex-shrink-0 z-10 shadow-sm">
                      3
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between font-black text-slate-900">
                        <span className="text-sm">Năm 2018: Đón Nhận Bằng Khen Của Thủ Tướng Chính Phủ</span>
                        <span className="text-amber-700">Vinh dự cấp Quốc gia</span>
                      </div>
                      <p className="text-slate-600">
                        Thủ tướng Chính phủ tặng Bằng khen cho tập thể nhà trường vì thành tích xuất sắc trong công tác phổ cập giáo dục tiểu học đúng độ tuổi và đổi mới sáng tạo dạy học.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative">
                    <div className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center font-black text-xs flex-shrink-0 z-10 shadow-sm">
                      4
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between font-black text-slate-900">
                        <span className="text-sm">Năm 2022: Cờ Thi Đua Đơn Vị Dẫn Đầu Của UBND Tỉnh Phú Yên</span>
                        <span className="text-purple-700">Lá cờ đầu ngành GD huyện</span>
                      </div>
                      <p className="text-slate-600">
                        Dẫn đầu phong trào thi đua dạy học cấp THCS, tỷ lệ học sinh giỏi cấp huyện, cấp tỉnh và tỷ lệ đỗ vào lớp 10 THPT công lập đạt trên 98.5%.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs flex-shrink-0 z-10 shadow-sm">
                      ★
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between font-black text-slate-900">
                        <span className="text-sm text-red-900">Năm 2024 - 2026: Đột Phá Chuyển Đổi Số Quản Trị Trường Học</span>
                        <span className="text-amber-800 font-bold">Kỷ nguyên số</span>
                      </div>
                      <p className="text-slate-700">
                        Hiệu trưởng Nguyễn Quốc Bảo trực tiếp xây dựng Hệ thống quản trị nội bộ 52 Cột A-AZ, số hóa sổ điểm, hòm thư phản ánh bảo mật, cổng thông tin phụ huynh và lớp học thông minh.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mission, Vision & Core Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl bg-red-900 text-white space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase">
                    <Target className="w-4 h-4" />
                    <span>Sứ Mệnh Giáo Dục</span>
                  </div>
                  <h4 className="text-base font-black">Ươm Mầm Trí Tuệ & Nhân Cách</h4>
                  <p className="text-xs text-rose-100 leading-relaxed">
                    Kiến tạo môi trường giáo dục an toàn, thân thiện, bình đẳng; phát huy tối đa năng lực cá nhân của mỗi học sinh, giúp các em tự tin hội nhập và trở thành công dân có ích.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-sky-300 font-black text-xs uppercase">
                    <Globe className="w-4 h-4" />
                    <span>Tầm Nhìn Chiến Lược</span>
                  </div>
                  <h4 className="text-base font-black">Trường Chuẩn Hiện Đại Vùng Bán Sơn Địa</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Đến năm 2030 trở thành trường liên cấp điểm sáng toàn diện của Tỉnh Phú Yên về chất lượng giáo dục thực chất, ứng dụng công nghệ và chuyển đổi số quản trị.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-slate-900 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase">
                    <Award className="w-4 h-4" />
                    <span>5 Giá Trị Cốt Lõi</span>
                  </div>
                  <h4 className="text-base font-black text-amber-950">Kỷ Cương - Tình Thương - Trách Nhiệm</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    1. Kỷ cương nền nếp<br />
                    2. Tình thương bao dung<br />
                    3. Trách nhiệm tận tâm<br />
                    4. Sáng tạo đổi mới<br />
                    5. Khát vọng vươn lên
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: BẢNG VÀNG THÀNH TÍCH HỌC SINH & GIÁO VIÊN */}
          {aboutSection === 'ACHIEVEMENTS' && (
            <div className="space-y-6">
              {/* Filter Toolbar */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    Đối tượng vinh danh:
                  </span>
                  <button
                    type="button"
                    onClick={() => setAchievementFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      achievementFilter === 'ALL'
                        ? 'bg-red-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Tất Cả ({achievements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAchievementFilter('GIAO_VIEN')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      achievementFilter === 'GIAO_VIEN'
                        ? 'bg-red-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Thầy Cô Giáo ({achievements.filter((a) => a.type === 'GIAO_VIEN').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAchievementFilter('HOC_SINH')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      achievementFilter === 'HOC_SINH'
                        ? 'bg-red-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Học Sinh Xuất Sắc ({achievements.filter((a) => a.type === 'HOC_SINH').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAchievementFilter('TAP_THE')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      achievementFilter === 'TAP_THE'
                        ? 'bg-red-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Tập Thể Đội Tuyển ({achievements.filter((a) => a.type === 'TAP_THE').length})
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Hiển thị <strong>{filteredAchievements.length}</strong> danh hiệu vinh danh tiêu biểu
                </div>
              </div>

              {/* Achievements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAchievements.map((item) => {
                  const isNational = item.awardLevel === 'CAP_QUOC_GIA';
                  const isProvince = item.awardLevel === 'CAP_TINH';
                  const isDistrict = item.awardLevel === 'CAP_HUYEN';

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 hover:border-amber-400 hover:shadow-md transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            {isNational && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-rose-700" />
                                CẤP QUỐC GIA
                              </span>
                            )}
                            {isProvince && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-700" />
                                CẤP TỈNH
                              </span>
                            )}
                            {isDistrict && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1">
                                <Award className="w-3 h-3 text-sky-700" />
                                CẤP HUYỆN
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 font-semibold">{item.year}</span>
                          </div>

                          <span className="text-[11px] text-slate-400">{item.dateAwarded}</span>
                        </div>

                        <div className="flex items-start gap-4">
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt={item.recipientName}
                              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xl flex-shrink-0">
                              🏆
                            </div>
                          )}

                          <div className="space-y-1">
                            <h4 className="text-base font-black text-slate-900 hover:text-red-800 transition">
                              {item.recipientName}
                            </h4>
                            <div className="text-xs font-bold text-slate-600">
                              {item.roleOrClass}
                            </div>
                            <div className="text-xs font-black text-red-700">
                              {item.title}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                        <span>Đơn vị khen thưởng: <strong className="text-slate-700">{item.awardingBody}</strong></span>
                        <span className="text-emerald-700 font-bold">✓ Đã xác thực</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: PHÂN QUYỀN VIẾT BÀI & HT DUYỆT BÀI (YÊU CẦU 3) */}
      {activeSubTab === 'MANAGEMENT' && canWriteArticles && (
        <div className="space-y-6">
          {/* Role & Workflow Instruction Box */}
          <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 shadow-md border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h4 className="font-black text-amber-300 text-sm uppercase tracking-wide">
                  Quy Trình & Phân Quyền Xuất Bản Bài Viết
                </h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 font-bold">
                Vai trò của bạn: <strong>{currentUser?.name}</strong> ({currentUser?.role})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <strong className="text-amber-300 block mb-1">1. Hiệu Trưởng (HT):</strong>
                Toàn quyền đăng bài trực tiếp không cần duyệt; duyệt bài, sửa bài hoặc từ chối bài viết của PHT và GV gửi lên.
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <strong className="text-sky-300 block mb-1">2. PHT hoặc GV Phụ Trách:</strong>
                Soạn bài viết, đính kèm hình ảnh hoạt động, kế hoạch lễ hội, thông báo PHHS và nộp lên hệ thống chờ duyệt.
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <strong className="text-emerald-300 block mb-1">3. Xuất Bản Công Khai:</strong>
                Sau khi Thầy Hiệu trưởng ký duyệt, bài viết sẽ được xuất bản công khai ngay trên trang web cho PHHS và học sinh xem.
              </div>
            </div>
          </div>

          {/* List of articles with status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Danh Sách Bài Viết Hệ Thống ({managementArticles.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Soạn Bài Mới</span>
              </button>
            </div>

            {managementArticles.map((article) => {
              const isPending = article.status === 'CHO_HT_DUYET';
              const isPublished = article.status === 'DA_XUAT_BAN';
              const isRejected = article.status === 'TU_CHOI';

              return (
                <div
                  key={article.id}
                  className={`bg-white rounded-3xl border shadow-sm p-5 space-y-3 transition ${
                    isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                        Mã: {article.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                        {article.categoryLabel}
                      </span>
                      <span className="text-xs text-slate-400">
                        Tác giả: <strong>{article.authorName}</strong> ({article.authorPosition || article.authorRole}) • {article.createdAt}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                          <span>CHỜ HT DUYỆT ĐĂNG BÀI</span>
                        </span>
                      )}
                      {isPublished && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>ĐÃ XUẤT BẢN CÔNG KHAI</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-black border border-rose-300">
                          <X className="w-3.5 h-3.5 text-rose-700" />
                          <span>BỊ TỪ CHỐI / YÊU CẦU SỬA</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-base">{article.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{article.summary}</p>
                  </div>

                  {article.principalNote && (
                    <div className="p-3 rounded-2xl bg-amber-50 text-xs text-amber-950 border border-amber-200">
                      <strong>Ý kiến / Bút phê của Hiệu trưởng:</strong> {article.principalNote}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedArticle(article)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem trước bài viết</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* HT Approval Buttons */}
                      {isPrincipal && isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectModalItem(article);
                              setRejectReason('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-700 font-bold text-xs transition"
                          >
                            Yêu Cầu Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setApproveModalItem(article);
                              setApprovalNote('ĐÃ DUYỆT XUẤT BẢN: Nội dung chuẩn mực, phản ánh đúng hoạt động nhà trường. - Hiệu trưởng Nguyễn Quốc Bảo.');
                            }}
                            className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>HT Duyệt & Đăng Bài</span>
                          </button>
                        </>
                      )}

                      {isPrincipal && isPublished && (
                        <button
                          type="button"
                          onClick={() => handleTogglePin(article.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                            article.isPinned ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                          <span>{article.isPinned ? 'Bỏ ghim' : 'Ghim bài'}</span>
                        </button>
                      )}

                      {isPrincipal && (
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                          title="Xóa bài viết"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: XEM CHI TIẾT BÀI VIẾT (FULL ARTICLE DIALOG) */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                {selectedArticle.categoryLabel}
              </span>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-snug">{selectedArticle.title}</h2>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                <span>Ngày đăng: <strong>{selectedArticle.createdAt}</strong></span>
                <span>•</span>
                <span>Tác giả: <strong>{selectedArticle.authorName}</strong> ({selectedArticle.authorPosition})</span>
                {selectedArticle.approvedByName && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">Duyệt bởi: {selectedArticle.approvedByName}</span>
                  </>
                )}
              </div>
            </div>

            {selectedArticle.featuredImage && (
              <div className="rounded-2xl overflow-hidden max-h-80 border border-slate-200 shadow-sm">
                <img
                  src={selectedArticle.featuredImage}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 text-slate-800 text-sm leading-relaxed whitespace-pre-line border border-slate-200/60">
              {selectedArticle.content}
            </div>

            {/* Gallery images if any */}
            {selectedArticle.images && selectedArticle.images.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600">Hình ảnh minh họa hoạt động:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedArticle.images.map((img, idx) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 max-h-56">
                      <img src={img} alt="Hình ảnh hoạt động" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {selectedArticle.attachments && selectedArticle.attachments.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-100 flex flex-wrap gap-2 text-xs">
                {selectedArticle.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url || '#'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold shadow-xs hover:bg-slate-50"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    <span>{att.name}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Principal official seal badge */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
              <div>
                <strong>Chứng thực phê duyệt:</strong> {selectedArticle.principalNote || 'Đã kiểm duyệt xuất bản chính thức.'}
                <div className="text-[11px] text-amber-800 mt-0.5">Trường Tiểu học & THCS Đồng Xuân • Hiệu trưởng Nguyễn Quốc Bảo</div>
              </div>
              <div className="text-xs font-black text-red-700 uppercase border border-red-300 bg-white px-2.5 py-1 rounded-xl shadow-xs">
                ✓ ĐÃ DUYỆT
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIẾT BÀI MỚI (PHT HOẶC GV PHỤ TRÁCH, HOẶC HT) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-red-700" />
                <span>Soạn Thảo Bài Viết / Hoạt Động / Thông Báo PHHS</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chuyên mục <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newArticleData.category}
                    onChange={(e) => setNewArticleData({ ...newArticleData, category: e.target.value as ArticleCategory })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  >
                    <option value="HOAT_DONG">Hoạt Động Giáo Dục</option>
                    <option value="LE_KY_NIEM">Lễ Kỷ Niệm & Đại Lễ</option>
                    <option value="THONG_BAO_PHHS">Thông Báo Đến Cha Mẹ HS</option>
                    <option value="PHONG_TRAO">Phong Trào & Thi Đua</option>
                    <option value="TIN_TUC">Tin Tức Nhà Trường</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đối tượng tiếp nhận chính
                  </label>
                  <select
                    value={newArticleData.targetAudience}
                    onChange={(e) => setNewArticleData({ ...newArticleData, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  >
                    <option value="TOAN_TRUONG">Toàn trường (PHHS & Học sinh)</option>
                    <option value="PHHS_TIEU_HOC">Cha mẹ học sinh Tiểu học</option>
                    <option value="PHHS_THCS">Cha mẹ học sinh THCS</option>
                    <option value="HOC_SINH">Học sinh</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề bài viết / thông báo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newArticleData.title}
                  onChange={(e) => setNewArticleData({ ...newArticleData, title: e.target.value })}
                  placeholder="Nhập tiêu đề trang trọng, rõ ràng..."
                  className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tóm tắt ngắn (1-2 câu)
                </label>
                <textarea
                  rows={2}
                  value={newArticleData.summary}
                  onChange={(e) => setNewArticleData({ ...newArticleData, summary: e.target.value })}
                  placeholder="Tóm tắt nội dung chính để hiển thị trên trang bìa..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung chi tiết bài viết <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={newArticleData.content}
                  onChange={(e) => setNewArticleData({ ...newArticleData, content: e.target.value })}
                  placeholder="Nhập toàn văn bài viết, các nội dung chỉ đạo, thời gian, địa điểm, thành phần..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 leading-relaxed"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    URL ảnh bìa đại diện
                  </label>
                  <input
                    type="url"
                    value={newArticleData.featuredImage}
                    onChange={(e) => setNewArticleData({ ...newArticleData, featuredImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    File đính kèm (nếu có)
                  </label>
                  <input
                    type="text"
                    value={newArticleData.attachmentName}
                    onChange={(e) => setNewArticleData({ ...newArticleData, attachmentName: e.target.value })}
                    placeholder="VD: Thong_bao_tiem_chung.pdf"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Note about workflow */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {isPrincipal ? (
                  <span>
                    ✓ Với tư cách <strong>Hiệu trưởng</strong>, bài viết của thầy sẽ được <strong>xuất bản công khai ngay lập tức</strong>.
                  </span>
                ) : (
                  <span>
                    ⏳ Bài viết của thầy/cô sẽ được chuyển đến <strong>Thầy Hiệu trưởng duyệt</strong> trước khi xuất bản lên trang công khai.
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-black text-white bg-red-700 hover:bg-red-800 rounded-xl shadow"
                >
                  {isPrincipal ? 'Xuất Bản Ngay' : 'Gửi Về HT Phê Duyệt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: HT PHÊ DUYỆT BÀI VIẾT */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Hiệu Trưởng Phê Duyệt Xuất Bản Bài Viết</span>
              </h4>
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{approveModalItem.title}</div>
              <div className="text-slate-500 mt-1">Tác giả: {approveModalItem.authorName} ({approveModalItem.authorPosition})</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bút phê phê duyệt của Hiệu trưởng Nguyễn Quốc Bảo
              </label>
              <textarea
                rows={3}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Nhập ý kiến chỉ đạo, đồng ý xuất bản..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-medium"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-5 py-2 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow"
              >
                Ký Duyệt & Xuất Bản Công Khai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: HT TỪ CHỐI / YÊU CẦU SỬA */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Trả Lại Bài Viết Yêu Cầu Chỉnh Sửa</span>
              </h4>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do chưa đạt yêu cầu / Hướng dẫn chỉnh sửa
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập cụ thể những nội dung cần tác giả bổ sung, chỉnh sửa..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-black text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow"
              >
                Xác Nhận Trả Lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: THÊM VINH DANH BẢNG VÀNG MỚI */}
      {showAddAchievementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Thêm Thành Tích Vinh Danh Bảng Vàng</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddAchievementModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAchievement} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đối tượng vinh danh <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newAchievement.type}
                    onChange={(e) => setNewAchievement({ ...newAchievement, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  >
                    <option value="HOC_SINH">Học sinh xuất sắc</option>
                    <option value="GIAO_VIEN">Thầy cô giáo tiêu biểu</option>
                    <option value="TAP_THE">Tập thể / Đội tuyển</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cấp khen thưởng <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newAchievement.awardLevel}
                    onChange={(e) => setNewAchievement({ ...newAchievement, awardLevel: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  >
                    <option value="CAP_QUOC_GIA">Cấp Quốc Gia / Bộ GD&ĐT</option>
                    <option value="CAP_TINH">Cấp Tỉnh / Sở GD&ĐT</option>
                    <option value="CAP_HUYEN">Cấp Huyện / UBND Huyện</option>
                    <option value="CAP_TRUONG">Cấp Trường</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên cá nhân hoặc tên tập thể <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAchievement.recipientName}
                  onChange={(e) => setNewAchievement({ ...newAchievement, recipientName: e.target.value })}
                  placeholder="VD: Em Trần Mai Lan hoặc Cô Trần Thị Mai..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chức vụ hoặc Lớp học <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newAchievement.roleOrClass}
                    onChange={(e) => setNewAchievement({ ...newAchievement, roleOrClass: e.target.value })}
                    placeholder="VD: Lớp 9A - Trụ sở chính"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năm học vinh danh
                  </label>
                  <input
                    type="text"
                    value={newAchievement.year}
                    onChange={(e) => setNewAchievement({ ...newAchievement, year: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Danh hiệu / Giải thưởng đạt được <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAchievement.title}
                  onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                  placeholder="VD: Giải Nhất Kỳ thi HSG Tiếng Anh Cấp Tỉnh..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold text-red-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cơ quan khen thưởng
                  </label>
                  <input
                    type="text"
                    value={newAchievement.awardingBody}
                    onChange={(e) => setNewAchievement({ ...newAchievement, awardingBody: e.target.value })}
                    placeholder="VD: Sở Giáo dục & Đào tạo"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian trao tặng
                  </label>
                  <input
                    type="text"
                    value={newAchievement.dateAwarded}
                    onChange={(e) => setNewAchievement({ ...newAchievement, dateAwarded: e.target.value })}
                    placeholder="VD: Tháng 03/2026"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tóm tắt thành tích đóng góp
                </label>
                <textarea
                  rows={3}
                  value={newAchievement.description}
                  onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                  placeholder="Mô tả tóm tắt điểm số, sáng kiến hoặc kết quả đạt được..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Ảnh đại diện / Vinh danh
                </label>
                <input
                  type="url"
                  value={newAchievement.photoUrl}
                  onChange={(e) => setNewAchievement({ ...newAchievement, photoUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAchievementModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow text-slate-950"
                >
                  Lưu Vào Bảng Vàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
