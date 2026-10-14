import React, { useState, useMemo, useRef } from 'react';
import {
  TeacherEvaluationEvent,
  EmulationTitle,
  AnnualEmulationAward,
  UserAccount,
  AnnualCompetitionEvaluationRecord,
  CompetitionCouncilMinutes,
  CompetitionAuditLogEntry,
  AssignedTask,
  StaffTierCategory,
} from '../types/school';
import { storageService } from '../services/storageService';
import {
  Award,
  Trophy,
  Medal,
  Star,
  PlusCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Calendar,
  User,
  Building,
  FolderOpen,
  Eye,
  Trash2,
  Printer,
  Sparkles,
  Lock,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface EmulationRewardsProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  allStaff: { account: UserAccount }[];
  onRefreshData?: () => void;
}

export const EmulationRewards: React.FC<EmulationRewardsProps> = ({
  currentUser,
  activeSchoolYear,
  allStaff,
  onRefreshData,
}) => {
  type TabType =
    | 'dossier_4tiers'
    | 'events'
    | 'ranking'
    | 'year_end_reviews'
    | 'council_minutes'
    | 'titles'
    | 'awards';
  const [activeTab, setActiveTab] = useState<TabType>('dossier_4tiers');

  // Datasets from storageService
  const [evaluations, setEvaluations] = useState<TeacherEvaluationEvent[]>(() =>
    storageService.getTeacherEvaluations(activeSchoolYear)
  );
  const [titles, setTitles] = useState<EmulationTitle[]>(() =>
    storageService.getEmulationTitles()
  );
  const [awards, setAwards] = useState<AnnualEmulationAward[]>(() =>
    storageService.getAnnualEmulationAwards(activeSchoolYear)
  );
  const [annualRecords, setAnnualRecords] = useState<AnnualCompetitionEvaluationRecord[]>(() =>
    storageService.getAnnualCompetitionRecords(activeSchoolYear)
  );
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>(() =>
    storageService.getAssignedTasks(activeSchoolYear)
  );
  const [councilMinutes, setCouncilMinutes] = useState<CompetitionCouncilMinutes[]>(() =>
    storageService.getCouncilMinutes(activeSchoolYear)
  );
  const [auditLogs, setAuditLogs] = useState<CompetitionAuditLogEntry[]>(() =>
    storageService.getCompetitionAuditLogs(activeSchoolYear)
  );

  // 4-Tier active group filter
  const [tierFilter, setTierFilter] = useState<'ALL' | StaffTierCategory>('ALL');

  // Lock Confirmation Modal
  const [recordToLock, setRecordToLock] = useState<AnnualCompetitionEvaluationRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'KHEN_THUONG' | 'NHAC_NHO'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Create Evaluation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetTeacherId, setTargetTeacherId] = useState(allStaff[0]?.account.id || '');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventType, setEventType] = useState<'KHEN_THUONG' | 'NHAC_NHO'>('KHEN_THUONG');
  const [category, setCategory] = useState<TeacherEvaluationEvent['category']>('Chuyên môn & Giảng dạy');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState<number>(5);
  const [ratingLevel, setRatingLevel] = useState<TeacherEvaluationEvent['ratingLevel']>('Xuất sắc');
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Add Emulation Title Modal
  const [showAddTitleModal, setShowAddTitleModal] = useState(false);
  const [newTitleName, setNewTitleName] = useState('');
  const [newTitleType, setNewTitleType] = useState<'CA_NHAN' | 'TAP_THE'>('CA_NHAN');
  const [newTitleLevel, setNewTitleLevel] = useState<EmulationTitle['level']>('Cấp Trường');
  const [newTitleCriteria, setNewTitleCriteria] = useState('');
  const [newTitleQuota, setNewTitleQuota] = useState<number | undefined>(undefined);
  const [newTitleReward, setNewTitleReward] = useState<number | undefined>(undefined);

  // Hidden File Inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPrincipal = currentUser?.role === 'HT' || currentUser?.role === 'GV_TIN_HOC';

  // Handle locking year-end emulation record
  const handleLockRecord = (recordId: string) => {
    storageService.lockAnnualCompetitionRecord(
      recordId,
      currentUser?.name ? `${currentUser.name} (${currentUser.position})` : 'Thầy Nguyễn Quốc Bảo (HT)',
      activeSchoolYear
    );
    setAnnualRecords(storageService.getAnnualCompetitionRecords(activeSchoolYear));
    setAuditLogs(storageService.getCompetitionAuditLogs(activeSchoolYear));
    setRecordToLock(null);
    setToastMessage('✓ Đã khóa niêm phong hồ sơ thi đua cuối năm thành công!');
    setTimeout(() => setToastMessage(null), 3000);
    onRefreshData?.();
  };

  // Handle Photo Capture / Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setEvidencePhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Submit New Evaluation
  const handleCreateEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const teacher = allStaff.find((s) => s.account.id === targetTeacherId)?.account;
    if (!teacher) return;

    const calculatedPoints = eventType === 'KHEN_THUONG' ? Math.abs(points) : -Math.abs(points);

    storageService.addTeacherEvaluation(
      {
        schoolYear: activeSchoolYear,
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherPosition: teacher.position,
        campusName: teacher.campusName,
        branchName: teacher.branchName,
        date: eventDate,
        eventType,
        category,
        title,
        description,
        points: calculatedPoints,
        ratingLevel,
        evidencePhotos,
        driveFolderUrl: 'https://drive.google.com/drive/folders/1DRIVE_DX_THI_DUA_2026',
        evaluatedBy: currentUser?.name ? `Hiệu trưởng ${currentUser.name}` : 'Hiệu trưởng Nguyễn Quốc Bảo',
        notes,
      },
      activeSchoolYear
    );

    // Refresh
    setEvaluations(storageService.getTeacherEvaluations(activeSchoolYear));
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setEvidencePhotos([]);
    setNotes('');
    setPoints(5);
    onRefreshData?.();
  };

  // Submit New Emulation Title
  const handleCreateTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleName.trim() || !newTitleCriteria.trim()) return;

    const newTitle: EmulationTitle = {
      id: 'DH_' + Date.now().toString().slice(-4),
      name: newTitleName,
      type: newTitleType,
      level: newTitleLevel,
      criteria: newTitleCriteria,
      quotaPercentage: newTitleQuota,
      rewardAmount: newTitleReward,
    };

    const updated = [...titles, newTitle];
    storageService.saveEmulationTitles(updated);
    setTitles(updated);
    setShowAddTitleModal(false);
    setNewTitleName('');
    setNewTitleCriteria('');
    setNewTitleQuota(undefined);
    setNewTitleReward(undefined);
  };

  // Filtered Evaluations
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((ev) => {
      if (branchFilter !== 'ALL' && !ev.branchName.toLowerCase().includes(branchFilter.toLowerCase())) {
        return false;
      }
      if (typeFilter !== 'ALL' && ev.eventType !== typeFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && ev.category !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        return (
          ev.teacherName.toLowerCase().includes(s) ||
          ev.title.toLowerCase().includes(s) ||
          ev.description.toLowerCase().includes(s) ||
          ev.campusName.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [evaluations, branchFilter, typeFilter, categoryFilter, searchTerm]);

  // Aggregate teacher emulation rankings
  const teacherRankings = useMemo(() => {
    const statsMap: Record<
      string,
      {
        teacherId: string;
        teacherName: string;
        position: string;
        campusName: string;
        branchName: string;
        commendationCount: number;
        warningCount: number;
        totalPoints: number;
        events: TeacherEvaluationEvent[];
      }
    > = {};

    // Seed from allStaff
    allStaff.forEach((s) => {
      statsMap[s.account.id] = {
        teacherId: s.account.id,
        teacherName: s.account.name,
        position: s.account.position,
        campusName: s.account.campusName,
        branchName: s.account.branchName,
        commendationCount: 0,
        warningCount: 0,
        totalPoints: 0,
        events: [],
      };
    });

    // Accumulate from evaluations
    evaluations.forEach((ev) => {
      if (!statsMap[ev.teacherId]) {
        statsMap[ev.teacherId] = {
          teacherId: ev.teacherId,
          teacherName: ev.teacherName,
          position: ev.teacherPosition,
          campusName: ev.campusName,
          branchName: ev.branchName,
          commendationCount: 0,
          warningCount: 0,
          totalPoints: 0,
          events: [],
        };
      }
      const entry = statsMap[ev.teacherId];
      if (ev.eventType === 'KHEN_THUONG') {
        entry.commendationCount += 1;
      } else {
        entry.warningCount += 1;
      }
      entry.totalPoints += ev.points;
      entry.events.push(ev);
    });

    return Object.values(statsMap).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [allStaff, evaluations]);

  // Quick stats
  const totalCommendations = evaluations.filter((e) => e.eventType === 'KHEN_THUONG').length;
  const totalWarnings = evaluations.filter((e) => e.eventType === 'NHAC_NHO').length;
  const totalAccumulatedPoints = evaluations.reduce((sum, e) => sum + e.points, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Phân Hệ Thi Đua Khen Thưởng & Đánh Giá Giáo Viên
            </span>
            <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">
              Năm học: {activeSchoolYear}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Theo Dõi Đánh Giá Sự Việc & Thi Đua Cuối Năm Của Hiệu Trưởng
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hiệu trưởng theo dõi, đánh giá GV sau mỗi sự việc (có chụp ảnh/tải file minh chứng) nhằm làm cơ sở bình xét thi đua cuối năm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPrincipal && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>+ Ghi Nhận Sự Việc & Đánh Giá GV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
            title="In sổ theo dõi thi đua"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Tổng Sự Việc Đã Ghi</div>
            <div className="text-lg font-black text-slate-900">{evaluations.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-600 uppercase">Tuyên Dương / Khen Thưởng</div>
            <div className="text-lg font-black text-emerald-700">+{totalCommendations}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-rose-600 uppercase">Nhắc Nhở / Phê Bình</div>
            <div className="text-lg font-black text-rose-700">{totalWarnings}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Medal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-blue-600 uppercase">Danh Hiệu Thi Đua</div>
            <div className="text-lg font-black text-blue-700">{titles.length} Danh hiệu</div>
          </div>
        </div>
      </div>

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

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-2xl shadow-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('dossier_4tiers')}
          className={`py-3.5 px-4 font-black text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'dossier_4tiers'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-red-600" />
          <span>SỔ THI ĐUA ĐIỆN TỬ 4 TẦNG & GIAO VIỆC</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('year_end_reviews')}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'year_end_reviews'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-600" />
          <span>Phiếu Đánh Giá Cuối Năm & Khóa Hồ Sơ ({annualRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('council_minutes')}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'council_minutes'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Hội Đồng Thi Đua & Audit Log ({auditLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'events'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Nhật Ký Sự Việc ({evaluations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ranking')}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'ranking'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Bảng Xếp Hạng Điểm ({teacherRankings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('titles')}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'titles'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Danh Mục Danh Hiệu ({titles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('awards')}
          className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'awards'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Quyết Định Khen Thưởng ({awards.length})</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB: SỔ THEO DÕI THI ĐUA ĐIỆN TỬ 4 TẦNG */}
      {/* ========================================== */}
      {activeTab === 'dossier_4tiers' && (
        <div className="space-y-6">
          {/* 4 Tiers Structural Hierarchy Diagram */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white p-6 rounded-3xl shadow-xl border border-red-900/60 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                    MÔ HÌNH QUẢN TRỊ ĐIỀU HÀNH 4 TẦNG
                  </span>
                  <span className="text-xs text-rose-200">Chuẩn hóa hệ thống thi đua trường học</span>
                </div>
                <h3 className="text-lg font-black tracking-tight mt-1">
                  Sổ Theo Dõi Thi Đua Điện Tử Tự Động Hóa Quá Trình Cả Năm
                </h3>
              </div>
              <div className="text-xs text-slate-300 italic">
                HT giao việc ➔ GV nộp minh chứng ➔ BGH chấm điểm ➔ Tự động tích lũy hồ sơ điện tử
              </div>
            </div>

            {/* Visual 4-Tier Tree */}
            <div className="space-y-4">
              {/* Tầng 1: Thi Đua Cuối Năm */}
              <div className="text-center">
                <div className="inline-block bg-red-700 text-white font-black text-xs uppercase px-6 py-2.5 rounded-2xl shadow-lg border border-red-500 tracking-wider">
                  🏆 TẦNG 1: THI ĐUA CUỐI NĂM TOÀN TRƯỜNG
                </div>
                <div className="w-0.5 h-4 bg-red-400 mx-auto"></div>
              </div>

              {/* Tầng 2: 3 Nhánh Nhân Sự (GV TH, GV THCS, Nhân Viên) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setTierFilter('GV_TH')}
                  className={`p-3 rounded-2xl border text-center cursor-pointer transition ${
                    tierFilter === 'GV_TH'
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md'
                      : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider">Tầng 2 - Nhóm 1</div>
                  <div className="text-sm font-extrabold mt-0.5">Giáo Viên Tiểu Học (GV TH)</div>
                  <div className="text-[10px] opacity-80 mt-1">Các điểm trường Tiểu học & Phân hiệu La Hai</div>
                </div>

                <div
                  onClick={() => setTierFilter('GV_THCS')}
                  className={`p-3 rounded-2xl border text-center cursor-pointer transition ${
                    tierFilter === 'GV_THCS'
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md'
                      : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider">Tầng 2 - Nhóm 2</div>
                  <div className="text-sm font-extrabold mt-0.5">Giáo Viên THCS (GV THCS)</div>
                  <div className="text-[10px] opacity-80 mt-1">Trụ sở chính & THCS Xuân Long, Triêm Đức</div>
                </div>

                <div
                  onClick={() => setTierFilter('NHAN_VIEN')}
                  className={`p-3 rounded-2xl border text-center cursor-pointer transition ${
                    tierFilter === 'NHAN_VIEN'
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md'
                      : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider">Tầng 2 - Nhóm 3</div>
                  <div className="text-sm font-extrabold mt-0.5">Cán Bộ Nhân Viên (NV)</div>
                  <div className="text-[10px] opacity-80 mt-1">Văn thư, Kế toán, Y tế, Thư viện, Bảo vệ</div>
                </div>
              </div>

              {/* Tầng 3: Tiêu Chí & Giao Việc */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-2">
                <div className="text-center font-bold text-amber-300 text-xs uppercase tracking-wider">
                  📋 TẦNG 3: TIÊU CHÍ THI ĐUA & CÔNG VIỆC ĐƯỢC GIAO CÓ HẠN HOÀN THÀNH
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-center">
                  <div className="bg-black/30 p-2 rounded-xl">Chuyên môn & Hội giảng</div>
                  <div className="bg-black/30 p-2 rounded-xl">Bồi dưỡng HSG & Chuyên đề</div>
                  <div className="bg-black/30 p-2 rounded-xl">Công tác Chủ nhiệm & Nề nếp</div>
                  <div className="bg-black/30 p-2 rounded-xl">Chuyển đổi số & Quản lý CSVC</div>
                </div>
              </div>

              {/* Tầng 4: Đánh Giá, Minh Chứng, Điểm Số, Tổng Hợp */}
              <div className="bg-emerald-950/60 rounded-2xl p-4 border border-emerald-500/40 text-center space-y-1">
                <div className="font-bold text-emerald-300 text-xs uppercase tracking-wider">
                  ⭐ TẦNG 4: ĐÁNH GIÁ ĐỊNH KỲ ➔ MINH CHỨNG DRIVE/ẢNH ➔ ĐIỂM SỐ (0-10) ➔ TỔNG HỢP CUỐI NĂM
                </div>
                <p className="text-[11px] text-emerald-200">
                  Cuối năm Hội đồng thi đua không phải nhớ lại cả năm vì toàn bộ quá trình đã được tích lũy thành hồ sơ điện tử có thể truy vết 100%.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Assigned Tasks & Emulation Accumulation */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                  Sổ Theo Dõi Nhiệm Vụ Được Giao & Điểm Thi Đua Tích Lũy ({assignedTasks.length} việc)
                </h3>
                <p className="text-xs text-slate-500">
                  Hiển thị chi tiết từng việc được giao, tiến độ, hạn chót, minh chứng và điểm số nghiệm thu
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTierFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    tierFilter === 'ALL'
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({assignedTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('GV_TH')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    tierFilter === 'GV_TH'
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  GV Tiểu học
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('GV_THCS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    tierFilter === 'GV_THCS'
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  GV THCS
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('NHAN_VIEN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    tierFilter === 'NHAN_VIEN'
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Nhân viên
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">STT</th>
                    <th className="py-3 px-3">Người Nhận Việc</th>
                    <th className="py-3 px-3">Nhóm (Tầng 2)</th>
                    <th className="py-3 px-3">Nhiệm Vụ (Tầng 3)</th>
                    <th className="py-3 px-3 text-center">Hạn Chót</th>
                    <th className="py-3 px-3 text-center">Trạng Thái</th>
                    <th className="py-3 px-3 text-center">Minh Chứng</th>
                    <th className="py-3 px-3 text-center">Điểm Nghiệm Thu</th>
                    <th className="py-3 px-3">Người Đánh Giá & Nhận Xét</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignedTasks
                    .filter((t) => tierFilter === 'ALL' || t.targetStaffCategory === tierFilter)
                    .map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-extrabold text-slate-900">
                          {t.targetStaffName}
                          <div className="text-[10px] text-slate-500 font-normal">{t.targetBranchName}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {t.targetStaffCategory === 'GV_TH'
                              ? 'GV Tiểu học'
                              : t.targetStaffCategory === 'GV_THCS'
                              ? 'GV THCS'
                              : 'Nhân viên'}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-bold text-slate-900 line-clamp-1">{t.taskTitle}</div>
                          <div className="text-[10px] text-amber-700 font-medium">{t.competitionCriteria}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{t.deadline}</td>
                        <td className="py-3 px-3 text-center">
                          {t.executionStatus === 'HOAN_THANH' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              ✓ Hoàn thành
                            </span>
                          ) : t.executionStatus === 'CHO_XAC_NHAN' ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                              ⏳ Chờ nghiệm thu
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium text-[10px]">
                              Đang thực hiện
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {t.driveUrl ? (
                            <a
                              href={t.driveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 text-[10px]"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Google Drive</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Chưa nộp</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {t.score !== undefined ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-xs">
                              {t.score}/10 đ
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        <td className="py-3 px-3 max-w-xs text-slate-600">
                          {t.evaluationFeedback ? (
                            <div>
                              <span className="font-bold text-slate-800">{t.evaluatedBy}:</span> {t.evaluationFeedback}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Đang chờ đánh giá</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB: PHIẾU ĐÁNH GIÁ CUỐI NĂM & KHÓA HỒ SƠ */}
      {/* ========================================== */}
      {activeTab === 'year_end_reviews' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                Phiếu Đánh Giá Thi Đua Cuối Năm & Khóa Niêm Phong Hồ Sơ ({annualRecords.length} hồ sơ)
              </h3>
              <p className="text-xs text-slate-500">
                Tự động lấy điểm từ các nhiệm vụ đã xác nhận • Tính tổng điểm, điểm tối đa, tỷ lệ hoàn thành • HT duyệt & Khóa hồ sơ chống sửa đổi
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border">
              Hồ sơ đã khóa (LOCKED): <strong>{annualRecords.filter((r) => r.status === 'LOCKED').length}</strong> / {annualRecords.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">STT</th>
                  <th className="py-3 px-3">Họ Và Tên</th>
                  <th className="py-3 px-3">Phân Hiệu</th>
                  <th className="py-3 px-3 text-center">Nhiệm Vụ Xác Nhận</th>
                  <th className="py-3 px-3 text-center">Tổng Điểm</th>
                  <th className="py-3 px-3 text-center">Tỷ Lệ Hoàn Thành</th>
                  <th className="py-3 px-3">Đánh Giá Phụ Trách</th>
                  <th className="py-3 px-3 text-center">Kết Luận Cuối Năm</th>
                  <th className="py-3 px-3 text-center">Trạng Thái</th>
                  <th className="py-3 px-3 text-center">Khóa Hồ Sơ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {annualRecords.map((rec, idx) => {
                  const isLocked = rec.status === 'LOCKED';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900">{rec.staffName}</div>
                        <div className="text-[10px] text-slate-500">
                          {rec.staffCategory === 'GV_TH' ? 'GV Tiểu học' : rec.staffCategory === 'GV_THCS' ? 'GV THCS' : 'Nhân viên'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{rec.branchName}</td>
                      <td className="py-3 px-3 text-center font-bold">
                        {rec.confirmedTasks}/{rec.totalTasks} việc
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-black text-emerald-700 bg-emerald-50 border border-emerald-200">
                          {rec.totalScore}/{rec.maxScore} đ
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${rec.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px]">{rec.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs line-clamp-2">
                        {rec.managerAssessment}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px]">
                          {rec.yearEndConclusion}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isLocked ? (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-black text-[10px] flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>LOCKED</span>
                          </span>
                        ) : rec.status === 'APPROVED' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            APPROVED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                            DRAFT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isLocked ? (
                          <span className="text-[10px] text-slate-400 italic">
                            Đã khóa bởi {rec.lockedBy}
                          </span>
                        ) : isPrincipal ? (
                          <button
                            type="button"
                            onClick={() => setRecordToLock(rec)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] shadow transition flex items-center gap-1 mx-auto"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Khóa Hồ Sơ</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chỉ HT khóa</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB: HỘI ĐỒNG THI ĐUA & AUDIT LOG */}
      {/* ========================================== */}
      {activeTab === 'council_minutes' && (
        <div className="space-y-6">
          {/* Council Minutes */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                  Biên Bản Cuộc Họp Hội Đồng Thi Đua Khen Thưởng Nhà Trường
                </h3>
                <p className="text-xs text-slate-500">Chủ tịch Hội đồng: Thầy Nguyễn Quốc Bảo (Hiệu trưởng)</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                ✓ Biên bản đã thông qua 100%
              </span>
            </div>

            {councilMinutes.map((min) => (
              <div key={min.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm text-slate-900">{min.presidentName}</div>
                  <span className="text-slate-500 font-mono">Ngày họp: {min.meetingDate}</span>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-700">Thành phần Hội đồng:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 text-slate-600">
                    {min.councilMembers.map((m, mIdx) => (
                      <div key={mIdx}>• {m}</div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
                  <strong>Nội dung & Kết luận:</strong> {min.contentAndConclusions}
                </div>
              </div>
            ))}
          </div>

          {/* Audit Log Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Nhật Ký Kiểm Toán Thi Đua Điện Tử (AUDIT_LOG)
                </h3>
                <p className="text-xs text-slate-500">
                  Lưu vết toàn bộ quá trình: Người giao ➔ Nhiệm vụ ➔ Người thực hiện ➔ Minh chứng ➔ Người xác nhận ➔ Điểm số
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {auditLogs.length} sự kiện ghi nhận
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Thời Gian</th>
                    <th className="py-2.5 px-3">Hành Động</th>
                    <th className="py-2.5 px-3">Người Thực Hiện</th>
                    <th className="py-2.5 px-3">Đối Tượng / Nhiệm Vụ</th>
                    <th className="py-2.5 px-3">Chi Tiết Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800">
                        {log.performedBy} ({log.performedRole})
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{log.targetEntity}</td>
                      <td className="py-2 px-3 text-slate-600 font-sans">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN KHÓA HỒ SƠ THI ĐUA */}
      {recordToLock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Khóa Niêm Phong Hồ Sơ Thi Đua?
              </h3>
              <p className="text-xs text-slate-600 mt-2">
                Bạn sắp khóa hồ sơ thi đua cuối năm của đồng chí:{' '}
                <strong className="text-slate-900">{recordToLock.staffName}</strong>.
              </p>
              <div className="mt-2 p-3 bg-rose-50 text-rose-900 text-xs rounded-xl border border-rose-200 text-left font-medium">
                ⚠️ <strong>Cảnh báo:</strong> Sau khi khóa (LOCKED), điểm số, minh chứng và đánh giá cuối năm sẽ được niêm phong chống sửa đổi, lưu vết vĩnh viễn trong nhật ký AUDIT_LOG.
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToLock(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => handleLockRecord(recordToLock.id)}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-black text-xs shadow"
              >
                ✓ Xác Nhận Khóa Niêm Phong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: NHẬT KÝ ĐÁNH GIÁ SỰ VIỆC */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên giáo viên, tiêu đề sự việc..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700"
              >
                <option value="ALL">Tất cả phân hiệu (4 Phân hiệu)</option>
                <option value="Trụ sở chính Đồng Xuân">Trụ sở chính Đồng Xuân</option>
                <option value="Xuân Long">Phân hiệu Xuân Long</option>
                <option value="La Hai">Phân hiệu TH La Hai</option>
                <option value="Xuân Quang 2">Phân hiệu Xuân Quang 2</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700"
              >
                <option value="ALL">Tất cả sự việc (+ và -)</option>
                <option value="KHEN_THUONG">🟢 Khen thưởng / Biểu dương (+)</option>
                <option value="NHAC_NHO">🔴 Nhắc nhở / Phê bình (-)</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-700"
              >
                <option value="ALL">Tất cả chuyên đề</option>
                <option value="Chuyên môn & Giảng dạy">Chuyên môn & Giảng dạy</option>
                <option value="Bồi dưỡng Học sinh giỏi">Bồi dưỡng Học sinh giỏi</option>
                <option value="Hội giảng & Giáo viên dạy giỏi">Hội giảng & GVDG</option>
                <option value="Công tác Chủ nhiệm">Công tác Chủ nhiệm</option>
                <option value="Chuyển đổi số & Hồ sơ sổ sách">Chuyển đổi số & Sổ sách</option>
                <option value="Đạo đức nhà giáo & Tác phong">Đạo đức & Tác phong</option>
              </select>
            </div>
          </div>

          {/* Evaluations Grid / List */}
          {filteredEvaluations.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm">Chưa có sự việc nào phù hợp với bộ lọc</p>
              <p className="text-xs mt-1">Hiệu trưởng có thể bấm "+ Ghi Nhận Sự Việc & Đánh Giá GV" để tạo mới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvaluations.map((ev) => (
                <div
                  key={ev.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                    ev.eventType === 'KHEN_THUONG'
                      ? 'border-emerald-200 hover:border-emerald-300'
                      : 'border-rose-200 hover:border-rose-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Teacher Name & Points Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ev.eventType === 'KHEN_THUONG'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {ev.eventType === 'KHEN_THUONG' ? '🟢 Tuyên dương / Khen thưởng' : '🔴 Nhắc nhở / Phê bình'}
                          </span>
                          <span className="text-[10px] text-slate-400">{ev.date}</span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 mt-1">
                          {ev.teacherName}
                        </h3>
                        <div className="text-[11px] text-slate-500">
                          {ev.teacherPosition} • {ev.campusName}
                        </div>
                        <div className="text-[10px] font-semibold text-red-700">
                          {ev.branchName}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-lg font-black font-mono px-3 py-1 rounded-xl shadow-xs ${
                            ev.points > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {ev.points > 0 ? `+${ev.points}` : ev.points} đ
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Loại: <strong>{ev.ratingLevel}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Category & Title */}
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1">
                      <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                        Lĩnh vực: {ev.category}
                      </div>
                      <div className="text-xs font-bold text-slate-800">{ev.title}</div>
                      <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {ev.description}
                      </div>
                    </div>

                    {/* Evidence Photos (Camera & Uploaded) */}
                    {ev.evidencePhotos && ev.evidencePhotos.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>Minh chứng hình ảnh / văn bản ({ev.evidencePhotos.length} ảnh):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ev.evidencePhotos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setPreviewImage(photo)}
                              className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs cursor-pointer hover:ring-2 hover:ring-red-500 transition"
                            >
                              <img
                                src={photo}
                                alt="Minh chứng"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* HT Note / Conclusion */}
                    {ev.notes && (
                      <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-xs italic">
                        <strong>Ý kiến Hiệu trưởng:</strong> "{ev.notes}"
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                      <span>{ev.evaluatedBy}</span>
                    </span>
                    {ev.driveFolderUrl && (
                      <a
                        href={ev.driveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Google Drive Minh Chứng</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BẢNG TỔNG HỢP & XẾP HẠNG THI ĐUA CẢ NĂM */}
      {activeTab === 'ranking' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Bảng Tổng Hợp Điểm Thi Đua Tích Lũy Toàn Trường ({activeSchoolYear})
              </h3>
              <p className="text-xs text-slate-500">
                Tự động tổng hợp từ tất cả các lần khen thưởng và nhắc nhở sau sự việc của Hiệu trưởng.
              </p>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
              Tổng số nhân sự: {teacherRankings.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/70 font-bold text-slate-700 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-3 text-center w-12">Hạng</th>
                  <th className="py-3 px-4">Họ và Tên Giáo Viên</th>
                  <th className="py-3 px-4">Phân Hiệu & Điểm Trường</th>
                  <th className="py-3 px-3 text-center">Khen Thưởng (+)</th>
                  <th className="py-3 px-3 text-center">Nhắc Nhở (-)</th>
                  <th className="py-3 px-4 text-right">Tổng Điểm Tích Lũy</th>
                  <th className="py-3 px-4 text-center">Xếp Loại Dự Kiến</th>
                  <th className="py-3 px-4">Đề Xuất Danh Hiệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teacherRankings.map((r, idx) => {
                  let badgeRank = 'bg-slate-100 text-slate-600';
                  if (idx === 0) badgeRank = 'bg-amber-400 text-amber-950 font-black';
                  else if (idx === 1) badgeRank = 'bg-slate-300 text-slate-900 font-bold';
                  else if (idx === 2) badgeRank = 'bg-amber-700 text-amber-50 font-bold';

                  // Dự kiến xếp loại thi đua
                  let rating = 'Hoàn thành tốt';
                  let titleSuggest = 'Lao động tiên tiến';
                  if (r.totalPoints >= 15) {
                    rating = 'Hoàn thành xuất sắc';
                    titleSuggest = 'Chiến sĩ thi đua cơ sở';
                  } else if (r.totalPoints >= 8) {
                    rating = 'Hoàn thành tốt';
                    titleSuggest = 'Lao động tiên tiến';
                  } else if (r.totalPoints < 0) {
                    rating = 'Cần khắc phục';
                    titleSuggest = 'Chưa đạt danh hiệu';
                  }

                  return (
                    <tr key={r.teacherId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-center">
                        <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs ${badgeRank}`}>
                          {idx + 1}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{r.teacherName}</div>
                        <div className="text-[10px] text-slate-500">{r.position} ({r.teacherId})</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{r.campusName}</div>
                        <div className="text-[10px] text-red-700 font-medium">{r.branchName}</div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-emerald-700">
                        {r.commendationCount > 0 ? `+${r.commendationCount}` : '0'}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-rose-700">
                        {r.warningCount > 0 ? `-${r.warningCount}` : '0'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-sm">
                        <span className={r.totalPoints > 0 ? 'text-emerald-700' : r.totalPoints < 0 ? 'text-rose-700' : 'text-slate-500'}>
                          {r.totalPoints > 0 ? `+${r.totalPoints}` : r.totalPoints} đ
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            rating === 'Hoàn thành xuất sắc'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : rating === 'Hoàn thành tốt'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-rose-100 text-rose-900 border border-rose-200'
                          }`}
                        >
                          {rating}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-800">
                        {titleSuggest}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DANH SÁCH DANH HIỆU THI ĐUA HÀNG NĂM */}
      {activeTab === 'titles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Danh Mục Danh Hiệu Thi Đua & Hình Thức Khen Thưởng Hàng Năm
              </h3>
              <p className="text-xs text-slate-500">
                Áp dụng theo Luật Thi đua - Khen thưởng hiện hành và quy chuẩn ngành GD&ĐT.
              </p>
            </div>

            {isPrincipal && (
              <button
                type="button"
                onClick={() => setShowAddTitleModal(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow transition"
              >
                + Thêm Danh Hiệu Thi Đua
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {titles.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        t.level === 'Cấp Nhà Nước' || t.level === 'Cấp Bộ'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : t.level === 'Cấp Tỉnh'
                          ? 'bg-red-100 text-red-900 border border-red-200'
                          : t.level === 'Cấp Huyện/Xã'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {t.level}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{t.id}</span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>{t.name}</span>
                  </h4>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    <strong>Tiêu chuẩn xét đạt:</strong> {t.criteria}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  {t.quotaPercentage ? (
                    <span className="text-slate-500 text-[11px]">
                      Khống chế: <strong>≤ {t.quotaPercentage}%</strong>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Không giới hạn tỷ lệ</span>
                  )}

                  {t.rewardAmount ? (
                    <span className="font-mono font-bold text-red-700">
                      Thưởng: {t.rewardAmount.toLocaleString('vi-VN')} đ
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Thưởng theo quy chế</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: QUYẾT ĐỊNH KHEN THƯỞNG CUỐI NĂM */}
      {activeTab === 'awards' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Sổ Quyết Định Công Nhận Danh Hiệu Thi Đua & Bằng Khen Cuối Năm
              </h3>
              <p className="text-xs text-slate-500">
                Lưu trữ các quyết định do Hiệu trưởng hoặc UBND Xã / Huyện ban hành.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              Năm học: {activeSchoolYear}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4">Số Quyết Định</th>
                  <th className="py-3 px-4">Họ và Tên Nhân Sự</th>
                  <th className="py-3 px-4">Danh Hiệu Đạt Được</th>
                  <th className="py-3 px-4">Điểm Tích Lũy</th>
                  <th className="py-3 px-4">Tiền Thưởng Kèm Theo</th>
                  <th className="py-3 px-4">Người Ký Ban Hành</th>
                  <th className="py-3 px-4 text-center">Bằng Khen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {awards.map((aw) => (
                  <tr key={aw.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-red-700">{aw.decisionNumber}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      <div>{aw.teacherName}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{aw.position} • {aw.campusName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-950 font-bold rounded-lg border border-amber-200">
                        🏆 {aw.titleName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      +{aw.totalPoints} đ ({aw.commendationCount} lần khen)
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {aw.rewardAmount?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{aw.signedBy}</div>
                      <div className="text-[10px] text-slate-400">{aw.decisionDate}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={aw.certificateUrl || 'https://drive.google.com/drive/folders/1DRIVE_DX_THI_DUA_2026'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                        <span>Xem Giấy Khen</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: GHI NHẬN SỰ VIỆC & ĐÁNH GIÁ GIÁO VIÊN (HT THỰC HIỆN) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Ghi Nhận Sự Việc & Đánh Giá Giáo Viên
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hiệu trưởng Nguyễn Quốc Bảo đánh giá làm căn cứ xếp loại thi đua cuối năm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvaluation} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Chọn Giáo Viên Được Đánh Giá: <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={targetTeacherId}
                    onChange={(e) => setTargetTeacherId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 outline-none focus:border-red-500"
                  >
                    {allStaff.map((s) => (
                      <option key={s.account.id} value={s.account.id}>
                        {s.account.name} ({s.account.position} - {s.account.campusName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Ngày Xảy Ra Sự Việc: <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Phân Loại Sự Việc: <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold outline-none text-slate-800"
                  >
                    <option value="KHEN_THUONG">🟢 Khen thưởng / Biểu dương (+ điểm)</option>
                    <option value="NHAC_NHO">🔴 Nhắc nhở / Phê bình (- điểm)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Chuyên Đề / Lĩnh Vực: <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-none text-slate-800"
                  >
                    <option value="Chuyên môn & Giảng dạy">Chuyên môn & Giảng dạy</option>
                    <option value="Bồi dưỡng Học sinh giỏi">Bồi dưỡng Học sinh giỏi</option>
                    <option value="Hội giảng & Giáo viên dạy giỏi">Hội giảng & Giáo viên dạy giỏi</option>
                    <option value="Công tác Chủ nhiệm">Công tác Chủ nhiệm</option>
                    <option value="Đoàn Đội & Phong trào">Đoàn Đội & Phong trào</option>
                    <option value="Chuyển đổi số & Hồ sơ sổ sách">Chuyển đổi số & Hồ sơ sổ sách</option>
                    <option value="Đạo đức nhà giáo & Tác phong">Đạo đức nhà giáo & Tác phong</option>
                    <option value="Cơ sở vật chất & Lao động">Cơ sở vật chất & Lao động</option>
                    <option value="Nhiệm vụ đột xuất khác">Nhiệm vụ đột xuất khác</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Mức Điểm Thi Đua ({eventType === 'KHEN_THUONG' ? '+1 đến +10' : '-1 đến -10'}):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={points}
                      onChange={(e) => setPoints(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-black text-center text-sm outline-none"
                    />
                    <span className="font-bold text-slate-500">điểm</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tiêu Đề Tóm Tắt Sự Việc: <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Bồi dưỡng 02 học sinh đạt giải Nhì môn Toán 9 cấp Huyện/Xã"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mô Tả Chi Tiết Nội Dung Sự Việc & Thành Tích / Vi Phạm: <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi rõ quá trình thực hiện, sự đóng góp của giáo viên, kết quả đạt được cụ thể..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-none focus:border-red-500"
                />
              </div>

              {/* THE EXPLICIT USER REQUIREMENT: NÚT CHỤP ẢNH HOẶC TẢI ẢNH/FILE TỪ MÁY TÍNH LÊN ĐỂ MINH CHỨNG */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-red-600" />
                    <span>Hồ Sơ Minh Chứng Sự Việc (Chụp ảnh trực tiếp hoặc Tải file lên)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Tự động đồng bộ Google Drive</span>
                </div>

                {/* Hidden input for Camera capture */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                {/* Hidden input for Uploading files from PC/Phone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-sm transition active:scale-95"
                  >
                    <Camera className="w-4 h-4 text-amber-300" />
                    <span>Nút Chụp Ảnh Minh Chứng (Camera)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-blue-200" />
                    <span>Nút Tải Ảnh / File Từ Máy Tính Lên</span>
                  </button>
                </div>

                {/* Preview Thumbnail Grid */}
                {evidencePhotos.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-semibold text-slate-600">
                      Đã chọn {evidencePhotos.length} ảnh minh chứng:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {evidencePhotos.map((photo, pIdx) => (
                        <div key={pIdx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300">
                          <img src={photo} alt="Minh chứng" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEvidencePhotos((prev) => prev.filter((_, i) => i !== pIdx))}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow hover:bg-red-700"
                            title="Xóa ảnh này"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ý Kiến Chỉ Đạo / Nhận Xét Của Hiệu Trưởng:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú điều kiện hoặc hướng dẫn tiếp tục phát huy / khắc phục..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition"
                >
                  Lưu Ghi Nhận & Đánh Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM DANH HIỆU THI ĐUA HÀNG NĂM */}
      {showAddTitleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Thêm Danh Hiệu Thi Đua Hàng Năm Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTitleModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTitle} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên Danh Hiệu Thi Đua: <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newTitleName}
                  onChange={(e) => setNewTitleName(e.target.value)}
                  placeholder="VD: Giáo viên dạy giỏi cấp Tỉnh"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đối Tượng:</label>
                  <select
                    value={newTitleType}
                    onChange={(e) => setNewTitleType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="CA_NHAN">Cá nhân</option>
                    <option value="TAP_THE">Tập thể</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cấp Khen Thưởng:</label>
                  <select
                    value={newTitleLevel}
                    onChange={(e) => setNewTitleLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="Cấp Trường">Cấp Trường</option>
                    <option value="Cấp Huyện/Xã">Cấp Huyện/Xã</option>
                    <option value="Cấp Tỉnh">Cấp Tỉnh</option>
                    <option value="Cấp Bộ">Cấp Bộ</option>
                    <option value="Cấp Nhà Nước">Cấp Nhà Nước</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tiêu Chuẩn Đạt Được: <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={newTitleCriteria}
                  onChange={(e) => setNewTitleCriteria(e.target.value)}
                  placeholder="Tiêu chuẩn cần hoàn thành, điều kiện sáng kiến kinh nghiệm hoặc giờ dạy giỏi..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tỷ Lệ Khống Chế (%):</label>
                  <input
                    type="number"
                    value={newTitleQuota || ''}
                    onChange={(e) => setNewTitleQuota(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="VD: 15"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tiền Thưởng Kèm Theo (VNĐ):</label>
                  <input
                    type="number"
                    value={newTitleReward || ''}
                    onChange={(e) => setNewTitleReward(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="VD: 1490000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTitleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow"
                >
                  Thêm Danh Hiệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL: XEM ẢNH MINH CHỨNG PHÓNG TO */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Xem ảnh lớn"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shadow-lg hover:bg-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
