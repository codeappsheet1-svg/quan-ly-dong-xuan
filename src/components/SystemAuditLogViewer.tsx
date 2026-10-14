import React, { useState, useMemo } from 'react';
import { UserAccount } from '../types/school';
import { storageService, SyncLog } from '../services/storageService';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Download,
  Printer,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  KeyRound,
  Database,
  ArrowUpDown,
  SlidersHorizontal,
  PlusCircle,
  Sparkles,
  Info,
  DollarSign,
  BookOpen,
  GraduationCap,
  Layers,
  Building,
} from 'lucide-react';

interface SystemAuditLogViewerProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  onSelectTab?: (tab: string) => void;
}

export const SystemAuditLogViewer: React.FC<SystemAuditLogViewerProps> = ({
  currentUser,
  activeSchoolYear,
  onSelectTab,
}) => {
  const [logs, setLogs] = useState<SyncLog[]>(() => storageService.getSyncLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Modal to add a manual audit entry
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [newAction, setNewAction] = useState('Kiểm tra an toàn thông tin định kỳ');
  const [newDetails, setNewDetails] = useState('');
  const [newCategory, setNewCategory] = useState<SyncLog['category']>('Hệ thống');

  const refreshLogs = () => {
    setLogs(storageService.getSyncLogs());
  };

  // Helper to parse dates from format "HH:mm:ss DD/MM/YYYY" or ISO strings
  const parseLogDate = (timestampStr: string): Date | null => {
    try {
      // Check if format like "14:30:15 02/10/2026"
      const parts = timestampStr.split(' ');
      if (parts.length === 2 && parts[1].includes('/')) {
        const [day, month, year] = parts[1].split('/').map(Number);
        const [hour, min, sec] = parts[0].split(':').map(Number);
        return new Date(year, month - 1, day, hour || 0, min || 0, sec || 0);
      }
      const d = new Date(timestampStr);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    return logs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const cat = log.category || 'Hệ thống';
        if (cat !== selectedCategory) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (log.status !== selectedStatus) return false;
      }

      // Date filter
      if (selectedDateFilter !== 'ALL') {
        const logDate = parseLogDate(log.timestamp);
        if (logDate) {
          const logTime = logDate.getTime();
          if (selectedDateFilter === 'TODAY' && logTime < todayStart) return false;
          if (selectedDateFilter === 'WEEK' && logTime < sevenDaysAgo) return false;
          if (selectedDateFilter === 'MONTH' && logTime < thirtyDaysAgo) return false;
        }
      }

      // Search keyword
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchUser = (log.user || '').toLowerCase().includes(q);
        const matchTime = log.timestamp.toLowerCase().includes(q);
        return matchAction || matchDetails || matchUser || matchTime;
      }

      return true;
    });
  }, [logs, selectedCategory, selectedStatus, selectedDateFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const loginCount = logs.filter((l) => (l.category === 'Đăng nhập') || l.action.toLowerCase().includes('đăng nhập')).length;
    const financeCount = logs.filter((l) => (l.category === 'Tài chính') || l.action.toLowerCase().includes('chi') || l.action.toLowerCase().includes('thu')).length;
    const dispatchCount = logs.filter((l) => (l.category === 'Văn bản') || l.action.toLowerCase().includes('công văn') || l.action.toLowerCase().includes('sổ')).length;
    const systemCount = logs.filter((l) => l.action.toLowerCase().includes('năm học') || l.action.toLowerCase().includes('hệ thống') || l.action.toLowerCase().includes('đồng bộ')).length;

    // Today count
    const now = new Date();
    const todayDateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const todayCount = logs.filter((l) => l.timestamp.includes(todayDateStr)).length;

    return { total, loginCount, financeCount, dispatchCount, systemCount, todayCount };
  }, [logs]);

  // Icon for category
  const getCategoryIcon = (category?: string, action?: string) => {
    const act = (action || '').toLowerCase();
    const cat = category || '';
    if (cat === 'Đăng nhập' || act.includes('đăng nhập')) return <KeyRound className="w-4 h-4 text-purple-600" />;
    if (cat === 'Tài chính' || act.includes('chi') || act.includes('thu')) return <DollarSign className="w-4 h-4 text-emerald-600" />;
    if (cat === 'Văn bản' || act.includes('công văn') || act.includes('văn bản')) return <BookOpen className="w-4 h-4 text-blue-600" />;
    if (cat === 'Nhân sự' || act.includes('nhân sự') || act.includes('a-az') || act.includes('giáo viên')) return <User className="w-4 h-4 text-amber-600" />;
    if (cat === 'Học sinh' || act.includes('học sinh') || act.includes('lớp')) return <GraduationCap className="w-4 h-4 text-indigo-600" />;
    if (cat === 'Cơ sở vật chất' || act.includes('csvc')) return <Building className="w-4 h-4 text-rose-600" />;
    return <Database className="w-4 h-4 text-slate-600" />;
  };

  // Badge color for category
  const getCategoryBadgeClass = (category?: string, action?: string) => {
    const act = (action || '').toLowerCase();
    const cat = category || '';
    if (cat === 'Đăng nhập' || act.includes('đăng nhập')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (cat === 'Tài chính' || act.includes('chi') || act.includes('thu')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (cat === 'Văn bản' || act.includes('công văn')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (cat === 'Nhân sự') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (cat === 'Học sinh') return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (cat === 'Cơ sở vật chất') return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // Handle Add manual check log
  const handleAddManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDetails.trim()) {
      alert('Vui lòng nhập nội dung chi tiết nhật ký kiểm tra!');
      return;
    }

    const userName = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Hiệu trưởng Nguyễn Quốc Bảo';
    storageService.addSyncLog(newAction, newDetails.trim(), userName, newCategory);
    refreshLogs();
    setShowAddLogModal(false);
    setNewDetails('');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const header = ['STT', 'Thời gian', 'Hành động', 'Chi tiết hành động', 'Người thực hiện', 'Phân loại', 'Trạng thái'];
    const rows = filteredLogs.map((log, index) => [
      index + 1,
      `"${log.timestamp}"`,
      `"${log.action.replace(/"/g, '""')}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${(log.user || 'Hệ thống').replace(/"/g, '""')}"`,
      `"${log.category || 'Hệ thống'}"`,
      `"${log.status}"`,
    ]);

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Nhat_ky_he_thong_Dong_Xuan_${activeSchoolYear}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Kiểm toán & Giám sát Hệ thống (System Audit Trail)
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Trường TH & THCS Đồng Xuân • Năm học {activeSchoolYear}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            <span>Nhật Ký Hệ Thống & Lưu Vết Thao Tác</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Hiển thị trình tự thời gian mọi hoạt động quản trị: Đăng nhập tài khoản, cập nhật dữ liệu nhân sự, chuyển giao năm học, quản lý công văn, chi tiêu nội bộ và phê duyệt điều hành từ hệ thống lưu trữ tập trung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshLogs}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition flex items-center gap-1.5 active:scale-95"
            title="Làm mới nhật ký"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddLogModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 font-bold text-xs text-white shadow-sm transition flex items-center gap-1.5 active:scale-95"
            title="Ghi nhật ký kiểm toán / kiểm tra thủ công"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ghi kiểm tra hệ thống</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-bold text-xs text-white shadow-sm transition flex items-center gap-1.5 active:scale-95"
            title="Xuất file CSV báo cáo kiểm toán"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Xuất CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 font-bold text-xs text-white shadow-sm transition flex items-center gap-1.5 active:scale-95"
            title="In nhật ký lưu trữ"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>In sổ nhật ký</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Tổng nhật ký</span>
            <History className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">Sự kiện toàn thời gian</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Hôm nay</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.todayCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Thao tác trong ngày</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Đăng nhập</span>
            <KeyRound className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">{stats.loginCount}</div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">Lượt truy cập hệ thống</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Tài chính - Thu chi</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.financeCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Nhập & duyệt phiếu chi</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Sổ công văn</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">{stats.dispatchCount}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">Đến / Đi / Sổ văn bản</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Hệ thống & Năm học</span>
            <Database className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{stats.systemCount}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Đổi năm học & đồng bộ</div>
        </div>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo hành động, nội dung chi tiết, người thực hiện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-xs"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-indigo-600 outline-none text-xs"
            >
              <option value="ALL">-- Tất cả nhóm hành động --</option>
              <option value="Đăng nhập">🔑 Đăng nhập tài khoản</option>
              <option value="Hệ thống">⚙️ Hệ thống & Năm học</option>
              <option value="Tài chính">💰 Tài chính & Chi tiêu</option>
              <option value="Văn bản">📚 Công văn & Sổ sách</option>
              <option value="Nhân sự">👥 Nhân sự & Thi đua</option>
              <option value="Học sinh">🎒 Học sinh & Lớp học</option>
              <option value="Chuyên môn">🌱 Chuyên môn & Bài viết</option>
              <option value="Cơ sở vật chất">🛠️ Cơ sở vật chất</option>
            </select>
          </div>

          {/* Date filter */}
          <div>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-indigo-600 outline-none text-xs"
            >
              <option value="ALL">-- Toàn bộ thời gian --</option>
              <option value="TODAY">Hôm nay</option>
              <option value="WEEK">7 ngày gần nhất</option>
              <option value="MONTH">30 ngày gần nhất</option>
            </select>
          </div>
        </div>

        {/* View mode toggle and counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Hiển thị:</span>
            <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-lg border border-indigo-200">
              {filteredLogs.length} / {logs.length} bản ghi
            </span>
            {searchTerm && (
              <span className="text-slate-500">
                (Khớp với từ khóa "{searchTerm}")
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Dòng thời gian (Timeline)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bảng đối chiếu (Table)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: CHRONOLOGICAL TIMELINE */}
      {/* ======================================================== */}
      {viewMode === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Trình tự thời gian các sự kiện quản trị (Mới nhất ở trên)</span>
            </h3>
            <span className="text-xs text-slate-500">
              Tự động lưu trữ vĩnh viễn trong CSDL
            </span>
          </div>

          {filteredLogs.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {filteredLogs.map((log, index) => (
                <div key={log.id || index} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition">
                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                  </div>

                  {/* Card content */}
                  <div className="bg-slate-50/80 group-hover:bg-indigo-50/30 p-4 rounded-2xl border border-slate-200 group-hover:border-indigo-300 transition text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">
                          {log.action}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${getCategoryBadgeClass(
                            log.category,
                            log.action
                          )}`}
                        >
                          {getCategoryIcon(log.category, log.action)}
                          <span>{log.category || 'Hệ thống'}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-slate-700 leading-relaxed font-normal bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                      {log.details}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">
                          Người thực hiện: {log.user || 'Hệ thống tự động'}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{log.status || 'Thành công'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Info className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">
                Không tìm thấy sự kiện nhật ký nào phù hợp với bộ lọc.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                  setSelectedDateFilter('ALL');
                }}
                className="text-xs text-indigo-600 hover:underline font-bold"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: AUDIT DATA TABLE */}
      {/* ======================================================== */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-3 min-w-36">Thời gian</th>
                  <th className="py-3 px-4 min-w-44">Hành động</th>
                  <th className="py-3 px-4 min-w-80">Chi tiết thao tác</th>
                  <th className="py-3 px-3 min-w-36">Người thực hiện</th>
                  <th className="py-3 px-3 min-w-28 text-center">Phân loại</th>
                  <th className="py-3 px-3 min-w-24 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                        {index + 1}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {log.action}
                      </td>

                      <td className="py-3 px-4 text-slate-700 leading-snug">
                        {log.details}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {log.user || 'Hệ thống'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${getCategoryBadgeClass(
                            log.category,
                            log.action
                          )}`}
                        >
                          {getCategoryIcon(log.category, log.action)}
                          <span>{log.category || 'Hệ thống'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Chưa có bản ghi nhật ký nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Ghi kiểm tra an toàn hệ thống định kỳ */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">
                  Ghi Nhật Ký Kiểm Tra Hệ Thống Thủ Công
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLogModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề hành động kiểm tra / giám sát:
                </label>
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none font-bold"
                  placeholder="VD: Kiểm tra an toàn bảo mật, sao lưu CSDL dự phòng..."
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phân loại nhóm sự kiện:
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  <option value="Hệ thống">⚙️ Hệ thống & Bảo mật</option>
                  <option value="Tài chính">💰 Tài chính & Chi tiêu</option>
                  <option value="Văn bản">📚 Sổ sách & Công văn</option>
                  <option value="Nhân sự">👥 Nhân sự & Hồ sơ</option>
                  <option value="Học sinh">🎒 Học sinh & Lớp học</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung chi tiết kết quả kiểm tra / bút phê:
                </label>
                <textarea
                  rows={4}
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="Ghi nhận cụ thể nội dung đã kiểm tra, hiện trạng hệ thống và chỉ đạo..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-xs leading-relaxed"
                  required
                ></textarea>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                <span className="font-bold text-slate-800">Người ghi nhận:</span>{' '}
                {currentUser?.name || 'Hiệu trưởng Nguyễn Quốc Bảo'} ({currentUser?.position || 'Hiệu trưởng'})
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-md transition"
                >
                  Lưu vào Nhật ký hệ thống
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
