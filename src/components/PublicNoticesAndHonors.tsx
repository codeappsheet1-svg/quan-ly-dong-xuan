import React, { useState } from 'react';
import { UserAccount, PublicReminder, PublicCommendation, StaffBirthdayItem } from '../types/school';
import { BRANCHES_DATA, ALL_CAMPUSES } from '../data/initialData';
import { storageService } from '../services/storageService';
import {
  BellRing,
  Award,
  Cake,
  AlertTriangle,
  Upload,
  Calendar,
  Filter,
  Search,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Building,
  User,
  Clock,
  Printer,
} from 'lucide-react';

interface PublicNoticesAndHonorsProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  allStaff: { account: UserAccount }[];
  onRefreshData?: () => void;
}

export const PublicNoticesAndHonors: React.FC<PublicNoticesAndHonorsProps> = ({
  currentUser,
  activeSchoolYear,
  allStaff,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'reminders' | 'commendations' | 'birthdays'>('reminders');

  // Datasets from storage
  const [reminders, setReminders] = useState<PublicReminder[]>(() => storageService.getPublicReminders(activeSchoolYear));
  const [commendations, setCommendations] = useState<PublicCommendation[]>(() => storageService.getPublicCommendations(activeSchoolYear));
  const [birthdays, setBirthdays] = useState<StaffBirthdayItem[]>(() => storageService.getStaffBirthdays());

  // Filter states
  const [filterBranch, setFilterBranch] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal: Add Reminder (HT & PHT only)
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [remTargetType, setRemTargetType] = useState<'GV' | 'HS'>('GV');
  const [remTargetId, setRemTargetId] = useState('');
  const [remTargetName, setRemTargetName] = useState('');
  const [remClassName, setRemClassName] = useState('');
  const [remBranch, setRemBranch] = useState(BRANCHES_DATA[1].name);
  const [remCampus, setRemCampus] = useState(ALL_CAMPUSES[1].name);
  const [remReason, setRemReason] = useState<PublicReminder['reason']>('Tự ý đổi tiết');
  const [remTitle, setRemTitle] = useState('');
  const [remContent, setRemContent] = useState('');
  const [remWeek, setRemWeek] = useState(4);
  const [remEvidenceFileUrl, setRemEvidenceFileUrl] = useState('');
  const [remEvidenceFileName, setRemEvidenceFileName] = useState('');

  // Modal: Add Commendation (HT & PHT)
  const [showAddCommendationModal, setShowAddCommendationModal] = useState(false);
  const [comTargetType, setComTargetType] = useState<'GV' | 'NV' | 'HS' | 'TAP_THE'>('GV');
  const [comTargetName, setComTargetName] = useState('');
  const [comBranch, setComBranch] = useState(BRANCHES_DATA[1].name);
  const [comCampus, setComCampus] = useState(ALL_CAMPUSES[1].name);
  const [comTitle, setComTitle] = useState('');
  const [comDescription, setComDescription] = useState('');
  const [comRewardType, setComRewardType] = useState<PublicCommendation['rewardType']>('Khen thưởng chuyên môn');
  const [comRewardLevel, setComRewardLevel] = useState<PublicCommendation['rewardLevel']>('Cấp Phân hiệu');
  const [comPoints, setComPoints] = useState(10);
  const [comAmount, setComAmount] = useState(500000);
  const [comEvidenceFileUrl, setComEvidenceFileUrl] = useState('');
  const [comEvidenceFileName, setComEvidenceFileName] = useState('');

  const canManage = currentUser?.role === 'HT' || currentUser?.role === 'PHT' || currentUser?.role === 'GV_TIN_HOC';

  // Handle create reminder
  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle || !remContent || !remTargetName) return;

    const evidenceFiles = remEvidenceFileUrl
      ? [{ name: remEvidenceFileName || 'Minh_chung_dinh_kem.jpg', url: remEvidenceFileUrl, type: 'image/jpeg' }]
      : [];

    const newRem = storageService.addPublicReminder(
      {
        targetType: remTargetType,
        targetId: remTargetId || undefined,
        targetName: remTargetName,
        className: remTargetType === 'HS' ? remClassName : undefined,
        branchName: remBranch,
        campusName: remCampus,
        reason: remReason,
        title: remTitle,
        content: remContent,
        week: remWeek,
        month: filterMonth,
        date: new Date().toISOString().split('T')[0],
        evidenceFiles,
        remindedBy: currentUser?.name ? `${currentUser.name} (${currentUser.position})` : 'Ban Giám hiệu',
        status: 'Công khai',
      },
      activeSchoolYear
    );

    setReminders(storageService.getPublicReminders(activeSchoolYear));
    setShowAddReminderModal(false);
    setRemTitle('');
    setRemContent('');
    setRemEvidenceFileUrl('');
    setRemEvidenceFileName('');
    if (onRefreshData) onRefreshData();
  };

  // Handle create commendation
  const handleCreateCommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comTitle || !comDescription || !comTargetName) return;

    const evidenceFiles = comEvidenceFileUrl
      ? [{ name: comEvidenceFileName || 'Giay_khen_minh_chung.jpg', url: comEvidenceFileUrl, type: 'image/jpeg' }]
      : [];

    storageService.addPublicCommendation(
      {
        targetType: comTargetType,
        targetName: comTargetName,
        branchName: comBranch,
        campusName: comCampus,
        title: comTitle,
        description: comDescription,
        rewardType: comRewardType,
        rewardLevel: comRewardLevel,
        week: 4,
        month: filterMonth,
        date: new Date().toISOString().split('T')[0],
        points: comPoints,
        rewardAmount: comAmount,
        evidenceFiles,
        awardedBy: currentUser?.name ? `${currentUser.name} (${currentUser.position})` : 'Hiệu trưởng Nguyễn Quốc Bảo',
      },
      activeSchoolYear
    );

    setCommendations(storageService.getPublicCommendations(activeSchoolYear));
    setShowAddCommendationModal(false);
    setComTitle('');
    setComDescription('');
    setComEvidenceFileUrl('');
    setComEvidenceFileName('');
    if (onRefreshData) onRefreshData();
  };

  // Send Birthday Wish
  const handleSendWish = (id: string, staffName: string) => {
    const updated = birthdays.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          wishesSent: true,
          wishMessage: `Trường TH & THCS Đồng Xuân kính chúc đồng chí ${staffName} sinh nhật thật nhiều niềm vui, sức khỏe và luôn thành công trong sự nghiệp trồng người!`,
        };
      }
      return b;
    });
    storageService.saveStaffBirthdays(updated);
    setBirthdays(updated);
  };

  // Filtered Reminders
  const filteredReminders = reminders.filter((r) => {
    if (filterBranch !== 'ALL' && r.branchName !== filterBranch) return false;
    if (filterMonth && r.month !== filterMonth) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return r.targetName.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered Commendations
  const filteredCommendations = commendations.filter((c) => {
    if (filterBranch !== 'ALL' && c.branchName !== filterBranch) return false;
    if (filterMonth && c.month !== filterMonth) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return c.targetName.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered Birthdays
  const filteredBirthdays = birthdays.filter((b) => {
    if (filterBranch !== 'ALL' && b.branchName !== filterBranch) return false;
    if (filterMonth && b.birthMonth !== filterMonth) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return b.staffName.toLowerCase().includes(q) || b.position.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-red-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 text-amber-300 text-xs font-bold border border-red-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BẢNG TIN CÔNG KHAI - NỀ NẾP & THI ĐUA NĂM HỌC {activeSchoolYear}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Bảng Tin Nhắc Nhở, Sinh Nhật & Khen Thưởng Toàn Trường
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Công khai minh bạch các quyết định khen thưởng, nhắc nhở nề nếp kỷ cương và gửi lời chúc mừng sinh nhật
              đến toàn thể cán bộ, giáo viên, nhân viên và học sinh trường TH & THCS Đồng Xuân.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Tạo Nhắc Nhở Công Khai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCommendationModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition"
                >
                  <Award className="w-4 h-4" />
                  <span>Đăng Khen Thưởng Mới</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'reminders'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Nhắc Nhở Công Khai ({reminders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('commendations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'commendations'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Khen Thưởng & Tuyên Dương ({commendations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('birthdays')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'birthdays'
                ? 'bg-pink-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Cake className="w-4 h-4" />
            <span>Sinh Nhật GV-NV ({birthdays.filter((b) => b.birthMonth === filterMonth).length} trong tháng)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold">Lọc theo Phân hiệu:</span>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-slate-50 focus:bg-white"
            >
              <option value="ALL">Tất cả Phân hiệu & Trụ sở</option>
              {BRANCHES_DATA.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-bold">Tháng:</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-slate-50 focus:bg-white"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 bg-slate-50"
          />
        </div>
      </div>

      {/* TAB 1: NHẮC NHỞ CÔNG KHAI */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          {filteredReminders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">Không có trường hợp nhắc nhở nào</h3>
              <p className="text-xs text-slate-500 mt-1">
                Kỷ cương nề nếp tại các phân hiệu trong tháng {filterMonth} được duy trì rất tốt!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="bg-white rounded-2xl border-l-4 border-l-amber-500 border-y border-r border-slate-200 p-5 shadow-sm space-y-3 relative hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase">
                          {rem.reason}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          Tuần {rem.week} • Tháng {rem.month}
                        </span>
                        <span className="text-[10px] text-slate-400">📅 {rem.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{rem.title}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        rem.status === 'Đã khắc phục'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rem.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {rem.content}
                  </p>

                  <div className="text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div>
                      Đối tượng: <strong className="text-slate-900">{rem.targetName}</strong>
                      {rem.className && <span> (Lớp {rem.className})</span>}
                      <span className="text-slate-400 block text-[10px]">
                        📍 {rem.campusName} • {rem.branchName}
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      Nhắc nhở bởi: <strong>{rem.remindedBy}</strong>
                    </div>
                  </div>

                  {/* Minh chứng ảnh/file */}
                  {rem.evidenceFiles && rem.evidenceFiles.length > 0 && (
                    <div className="border-t border-slate-100 pt-2.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                        Minh chứng tài liệu kèm theo ({rem.evidenceFiles.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {rem.evidenceFiles.map((f, idx) => (
                          <a
                            key={idx}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium border border-slate-200 transition"
                          >
                            <FileText className="w-3.5 h-3.5 text-red-600" />
                            <span className="truncate max-w-[180px]">{f.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {rem.resolutionNotes && (
                    <div className="bg-emerald-50 text-emerald-800 p-2 rounded-lg text-[11px] border border-emerald-200">
                      <strong>Khắc phục:</strong> {rem.resolutionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KHEN THƯỞNG CÔNG KHAI */}
      {activeTab === 'commendations' && (
        <div className="space-y-4">
          {filteredCommendations.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">Chưa có khen thưởng trong tháng {filterMonth}</h3>
              <p className="text-xs text-slate-500 mt-1">Các thành tích thi đua sẽ được BGH cập nhật định kỳ.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCommendations.map((com) => (
                <div
                  key={com.id}
                  className="bg-white rounded-2xl border-l-4 border-l-rose-600 border-y border-r border-slate-200 p-5 shadow-sm space-y-3 relative hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[10px] uppercase">
                          {com.rewardType}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {com.rewardLevel}
                        </span>
                        {com.points && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                            +{com.points} điểm thi đua
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">📅 {com.date}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{com.title}</h4>
                    </div>

                    {com.rewardAmount && com.rewardAmount > 0 && (
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm flex-shrink-0">
                        {com.rewardAmount.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    {com.description}
                  </p>

                  <div className="text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div>
                      Tuyên dương:{' '}
                      <strong className="text-slate-900 text-xs">
                        {com.targetName}
                        {com.className && ` (${com.className})`}
                      </strong>
                      <span className="text-slate-400 block text-[10px]">
                        📍 {com.campusName} • {com.branchName}
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      Người ký duyệt: <strong>{com.awardedBy}</strong>
                    </div>
                  </div>

                  {/* Minh chứng ảnh/file */}
                  {com.evidenceFiles && com.evidenceFiles.length > 0 && (
                    <div className="border-t border-slate-100 pt-2.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-rose-600" />
                        Minh chứng khen thưởng kèm theo ({com.evidenceFiles.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {com.evidenceFiles.map((f, idx) => (
                          <a
                            key={idx}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium border border-slate-200 transition"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-600" />
                            <span className="truncate max-w-[180px]">{f.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SINH NHẬT CÁN BỘ - GIÁO VIÊN - NHÂN VIÊN */}
      {activeTab === 'birthdays' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 p-5 rounded-2xl text-white shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-base flex items-center gap-2">
                <Cake className="w-5 h-5 text-amber-300" />
                Chúc Mừng Sinh Nhật Thành Viên Tháng {filterMonth}
              </h3>
              <p className="text-xs text-pink-100 mt-0.5">
                Gắn kết yêu thương và quan tâm đến đời sống tinh thần của toàn thể 137 cán bộ, giáo viên, nhân viên.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold self-start sm:self-auto">
              {filteredBirthdays.length} đồng chí sinh nhật tháng {filterMonth}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBirthdays.map((b) => {
              const isToday =
                b.birthMonth === new Date().getMonth() + 1 && b.birthDay === new Date().getDate();

              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between gap-3 transition ${
                    isToday ? 'ring-2 ring-pink-500 border-pink-300 bg-pink-50/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-black text-sm">
                        {b.staffName.split(' ').slice(-1)[0][0]}
                      </div>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white font-extrabold text-[10px] animate-pulse">
                          HÔM NAY! 🎉
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mt-2.5">{b.staffName}</h4>
                    <p className="text-xs text-slate-500">{b.position}</p>
                    <p className="text-[11px] text-slate-400 mt-1">📍 {b.campusName}</p>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-pink-700 font-bold bg-pink-50 px-2.5 py-1.5 rounded-xl border border-pink-100">
                      <Calendar className="w-3.5 h-3.5 text-pink-500" />
                      <span>
                        Ngày {b.birthDay} tháng {b.birthMonth} ({b.dob})
                      </span>
                    </div>

                    {b.wishMessage && (
                      <p className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic border border-slate-100">
                        "{b.wishMessage}"
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">SĐT: {b.phone}</span>
                    <button
                      type="button"
                      onClick={() => handleSendWish(b.id, b.staffName)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                        b.wishesSent
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-pink-600 hover:bg-pink-700 text-white shadow'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{b.wishesSent ? 'Đã chúc mừng' : 'Gửi lời chúc'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: TẠO NHẮC NHỞ CÔNG KHAI */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Tạo Nhắc Nhở Công Khai
              </h3>
              <button
                type="button"
                onClick={() => setShowAddReminderModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đối tượng nhắc nhở:</label>
                  <select
                    value={remTargetType}
                    onChange={(e) => setRemTargetType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="GV">Giáo viên / Nhân viên</option>
                    <option value="HS">Học sinh / Tập thể lớp</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hành vi / Lý do:</label>
                  <select
                    value={remReason}
                    onChange={(e) => setRemReason(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="Tự ý đổi tiết">Tự ý đổi tiết</option>
                    <option value="Bỏ tiết không phép">Bỏ tiết không phép</option>
                    <option value="Đi muộn / vi phạm giờ giấc">Đi muộn / vi phạm giờ giấc</option>
                    <option value="Vi phạm nề nếp">Vi phạm nề nếp</option>
                    <option value="Chậm nộp giáo án / điểm">Chậm nộp giáo án / điểm</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ tên người / Tập thể:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Thầy Nguyễn Văn A hoặc Lớp 8B"
                    value={remTargetName}
                    onChange={(e) => setRemTargetName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                {remTargetType === 'HS' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tên Lớp:</label>
                    <input
                      type="text"
                      placeholder="VD: 8B Long Mỹ"
                      value={remClassName}
                      onChange={(e) => setRemClassName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phân hiệu:</label>
                  <select
                    value={remBranch}
                    onChange={(e) => setRemBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    {BRANCHES_DATA.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề nhắc nhở:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nhắc nhở tự ý đổi tiết dạy môn Toán thứ 4"
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung chi tiết sự việc:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Mô tả cụ thể thời gian, địa điểm, sự việc vi phạm và yêu cầu khắc phục..."
                  value={remContent}
                  onChange={(e) => setRemContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                ></textarea>
              </div>

              {/* Tải lên minh chứng ảnh / file */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-red-600" />
                  Đính kèm Minh chứng (Ảnh chụp / Tài liệu từ máy tính):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tên file (VD: Bien_ban_kiem_tra.pdf)"
                    value={remEvidenceFileName}
                    onChange={(e) => setRemEvidenceFileName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Link file / Base64 URL hình ảnh"
                    value={remEvidenceFileUrl}
                    onChange={(e) => setRemEvidenceFileUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Tài liệu sẽ được lưu tự động trên thư mục Google Drive của nhà trường để theo dõi.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow"
                >
                  Đăng Nhắc Nhở Công Khai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ĐĂNG KHEN THƯỞNG MỚI */}
      {showAddCommendationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-600" />
                Đăng Quyết Định Khen Thưởng Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCommendationModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCommendation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đối tượng khen thưởng:</label>
                  <select
                    value={comTargetType}
                    onChange={(e) => setComTargetType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="GV">Giáo viên</option>
                    <option value="NV">Nhân viên</option>
                    <option value="HS">Học sinh</option>
                    <option value="TAP_THE">Tập thể lớp / Tổ chuyên môn</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hình thức khen thưởng:</label>
                  <select
                    value={comRewardType}
                    onChange={(e) => setComRewardType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="Khen thưởng chuyên môn">Khen thưởng chuyên môn</option>
                    <option value="Học sinh giỏi">Học sinh giỏi</option>
                    <option value="Hội giảng / Hội thi">Hội giảng / Hội thi</option>
                    <option value="Gương người tốt việc tốt">Gương người tốt việc tốt</option>
                    <option value="Đoàn Đội">Đoàn Đội</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên cá nhân / Tập thể:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cô Nguyễn Thị A hoặc Em Lê B"
                    value={comTargetName}
                    onChange={(e) => setComTargetName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cấp khen thưởng:</label>
                  <select
                    value={comRewardLevel}
                    onChange={(e) => setComRewardLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="Cấp Phân hiệu">Cấp Phân hiệu</option>
                    <option value="Cấp Toàn trường">Cấp Toàn trường</option>
                    <option value="Cấp Huyện">Cấp Huyện</option>
                    <option value="Cấp Tỉnh">Cấp Tỉnh</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề khen thưởng:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tuyên dương Giáo viên dạy giỏi cấp trường năm học 2026-2027"
                  value={comTitle}
                  onChange={(e) => setComTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô tả thành tích đạt được:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nêu rõ thành tích, kết quả, đóng góp của cá nhân/tập thể..."
                  value={comDescription}
                  onChange={(e) => setComDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Điểm thi đua cộng (+):</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={comPoints}
                    onChange={(e) => setComPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tiền thưởng kèm theo (VNĐ):</label>
                  <input
                    type="number"
                    step={50000}
                    value={comAmount}
                    onChange={(e) => setComAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Tải lên minh chứng */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-rose-600" />
                  Đính kèm Minh chứng Khen thưởng (Giấy khen / Quyết định):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tên file (VD: Quyet_dinh_khen_thuong.pdf)"
                    value={comEvidenceFileName}
                    onChange={(e) => setComEvidenceFileName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Link file Drive / Hình ảnh minh chứng"
                    value={comEvidenceFileUrl}
                    onChange={(e) => setComEvidenceFileUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddCommendationModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow"
                >
                  Công Nhận & Đăng Khen Thưởng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
