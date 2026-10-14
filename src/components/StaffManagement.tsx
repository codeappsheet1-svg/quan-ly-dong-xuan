import React, { useState } from 'react';
import { UserAccount, StaffTransferRecord } from '../types/school';
import { BRANCHES_DATA, ALL_CAMPUSES } from '../data/initialData';
import { storageService } from '../services/storageService';
import { canViewAllStaffDirectory } from '../utils/permissionUtils';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  UserMinus,
  Sparkles,
  ArrowRightLeft,
  FileSpreadsheet,
  ExternalLink,
  Building,
  Phone,
  Mail,
  CheckCircle2,
  Calendar,
  Eye,
  FileText,
  Printer,
  Trash2,
  Lock,
  ShieldAlert,
  Pencil,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface StaffManagementProps {
  currentUser: UserAccount | null;
  allStaff: { account: UserAccount; sheetDataAZ: Record<string, string | number | boolean> }[];
  onOpenRegister: () => void;
  onViewStaffAZ: (account: UserAccount) => void;
  onRefreshData: () => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  currentUser,
  allStaff,
  onOpenRegister,
  onViewStaffAZ,
  onRefreshData,
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintRosterModal, setShowPrintRosterModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedStaffForTransfer, setSelectedStaffForTransfer] = useState<UserAccount | null>(null);

  // Transfer form state
  const [transferType, setTransferType] = useState<'CHUYEN_DEN' | 'CHUYEN_DI' | 'DIEU_DONG_NOI_BO'>('DIEU_DONG_NOI_BO');
  const [toLocation, setToLocation] = useState('');
  const [decisionNo, setDecisionNo] = useState('');
  const [notes, setNotes] = useState('');

  // Requirement 3: Tiếp nhận GV mới chuyển trường đến
  const [showTransferInTeacherModal, setShowTransferInTeacherModal] = useState(false);
  const [tiTeacherName, setTiTeacherName] = useState('');
  const [tiPreviousSchool, setTiPreviousSchool] = useState('');
  const [tiSubject, setTiSubject] = useState('Toán học');
  const [tiLevel, setTiLevel] = useState<'TH' | 'THCS' | 'Cả 2 cấp'>('THCS');
  const [tiPosition, setTiPosition] = useState('Giáo viên THCS');
  const [tiBranch, setTiBranch] = useState(BRANCHES_DATA[0].name);
  const [tiCampus, setTiCampus] = useState(ALL_CAMPUSES[0].name);
  const [tiPhone, setTiPhone] = useState('');
  const [tiEmail, setTiEmail] = useState('');
  const [tiDecisionNo, setTiDecisionNo] = useState('');

  // Requirement 3: Bớt GV / Giảm nhân sự / Chuyển công tác (INACTIVE)
  const [showRemoveStaffModal, setShowRemoveStaffModal] = useState(false);
  const [selectedStaffForRemoval, setSelectedStaffForRemoval] = useState<UserAccount | null>(null);
  const [removalReason, setRemovalReason] = useState('Chuyển công tác ra ngoài huyện/tỉnh');

  // Quản lý vòng đời Nhân sự: ACTIVE / INACTIVE / TẤT CẢ (Yêu cầu 2)
  const [staffLifecycleFilter, setStaffLifecycleFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<UserAccount | null>(null);
  const [staffEditData, setStaffEditData] = useState({
    name: '',
    phone: '',
    email: '',
    position: '',
    campusName: '',
    branchName: '',
    role: 'GV' as any,
  });

  const activeStaffCount = allStaff.filter((s) => s.account.status !== 'INACTIVE').length;
  const inactiveStaffCount = allStaff.filter((s) => s.account.status === 'INACTIVE').length;

  // Staff transfer records
  const [transfers, setTransfers] = useState<StaffTransferRecord[]>(() => storageService.getStaffTransfers());
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'transfers'>('directory');

  // Permission check: HT, PHT, GV_TIN_HOC can view all, regular staff can ONLY view themselves
  const canViewAll = canViewAllStaffDirectory(currentUser);

  // Filter logic
  const filteredStaff = allStaff.filter(({ account, sheetDataAZ }) => {
    // Security restriction: regular staff can only see their own personnel record
    if (!canViewAll) {
      return account.id === currentUser?.id;
    }

    // Lifecycle filter (ACTIVE / INACTIVE / ALL)
    if (staffLifecycleFilter === 'ACTIVE' && account.status === 'INACTIVE') return false;
    if (staffLifecycleFilter === 'INACTIVE' && account.status !== 'INACTIVE') return false;

    // Role filter
    if (roleFilter === 'BGH' && account.role !== 'HT' && account.role !== 'PHT') return false;
    if (roleFilter === 'GV_THCS' && (!account.position.includes('THCS') || account.role !== 'GV')) return false;
    if (roleFilter === 'GV_TH' && (!account.position.includes('Tiểu học') || account.role !== 'GV')) return false;
    if (roleFilter === 'NV' && account.role !== 'NV') return false;
    if (roleFilter === 'BV' && account.role !== 'NV_HD_BV') return false;
    if (roleFilter === 'GV_HD' && !account.position.includes('hợp đồng')) return false;

    // Team filter (Tổ chuyên môn)
    if (teamFilter !== 'ALL') {
      const staffTeam = String(sheetDataAZ['S'] || '');
      if (!staffTeam.includes(teamFilter)) return false;
    }

    // Branch filter
    if (branchFilter !== 'ALL' && account.branchName !== branchFilter) return false;

    // Campus filter
    if (campusFilter !== 'ALL' && account.campusName !== campusFilter) return false;

    // Search filter across rich metadata
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = account.name.toLowerCase().includes(term);
      const matchId = account.id.toLowerCase().includes(term);
      const matchPos = account.position.toLowerCase().includes(term);
      const matchPhone = account.phone.includes(term);
      const matchHometown = String(sheetDataAZ['M'] || '').toLowerCase().includes(term);
      const matchRank = String(sheetDataAZ['AE'] || '').toLowerCase().includes(term);
      const matchTeam = String(sheetDataAZ['S'] || '').toLowerCase().includes(term);
      const matchSubject = String(sheetDataAZ['U'] || '').toLowerCase().includes(term);
      const matchDegree = String(sheetDataAZ['N'] || '').toLowerCase().includes(term);
      if (!matchName && !matchId && !matchPos && !matchPhone && !matchHometown && !matchRank && !matchTeam && !matchSubject && !matchDegree) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Mã ID',
      'Họ và tên',
      'Phân hiệu',
      'Chức vụ',
      'Tổ chuyên môn',
      'Chuyên môn',
      'Cấp học',
      'Giới tính',
      'Điểm trường',
      'Thôn công tác',
      'Ngày sinh',
      'Tuổi',
      'Trình độ lý luận chính trị',
      'Mã ngạch',
      'SĐT',
      'Email',
      'Trình độ chuyên môn',
      'Quê quán',
      'Thời điểm tuyển dụng',
      'Trạng thái biến động / Ghi chú',
    ];

    const rows = filteredStaff.map(({ account, sheetDataAZ }, idx) => [
      idx + 1,
      account.id,
      `"${account.name}"`,
      `"${account.branchName}"`,
      `"${account.position}"`,
      `"${sheetDataAZ['S'] || ''}"`,
      `"${sheetDataAZ['U'] || ''}"`,
      `"${sheetDataAZ['T'] || ''}"`,
      `"${sheetDataAZ['C'] || ''}"`,
      `"${account.campusName}"`,
      `"${sheetDataAZ['L'] || ''}"`,
      `"${sheetDataAZ['D'] || ''}"`,
      sheetDataAZ['AD'] || '',
      `"${sheetDataAZ['AQ'] || ''}"`,
      `"${sheetDataAZ['AE'] || ''}"`,
      `"${account.phone}"`,
      `"${account.email}"`,
      `"${sheetDataAZ['N'] || ''}"`,
      `"${sheetDataAZ['M'] || ''}"`,
      `"${sheetDataAZ['AB'] || ''}"`,
      `"${sheetDataAZ['AZ'] || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_137_nhan_su_Dong_Xuan_2026_2027.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEditStaff = (account: UserAccount) => {
    setSelectedStaffForEdit(account);
    setStaffEditData({
      name: account.name,
      phone: account.phone,
      email: account.email,
      position: account.position,
      campusName: account.campusName,
      branchName: account.branchName,
      role: account.role,
    });
    setShowEditStaffModal(true);
  };

  const handleSaveEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForEdit) return;

    const matchedCampus = ALL_CAMPUSES.find((c) => c.name === staffEditData.campusName);
    storageService.updateStaff(selectedStaffForEdit.id, {
      name: staffEditData.name.trim(),
      phone: staffEditData.phone.trim(),
      email: staffEditData.email.trim(),
      position: staffEditData.position.trim(),
      campusName: staffEditData.campusName,
      campusId: matchedCampus ? matchedCampus.id : selectedStaffForEdit.campusId,
      branchName: matchedCampus ? matchedCampus.branchName : staffEditData.branchName,
      role: staffEditData.role,
    });

    setShowEditStaffModal(false);
    setSelectedStaffForEdit(null);
    onRefreshData();
  };

  const handleRestoreStaff = (account: UserAccount) => {
    storageService.restoreStaff(account.id);
    setTransfers(storageService.getStaffTransfers());
    onRefreshData();
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForTransfer || !toLocation) return;

    const newRecord: StaffTransferRecord = {
      id: 'DC_' + Date.now().toString().slice(-4),
      staffId: selectedStaffForTransfer.id,
      staffName: selectedStaffForTransfer.name,
      role: selectedStaffForTransfer.position,
      transferType,
      fromDate: new Date().toISOString().split('T')[0],
      fromLocation: selectedStaffForTransfer.campusName,
      toLocation,
      decisionNo: decisionNo || `QĐ-${Math.floor(100 + Math.random() * 900)}/QĐ-THCSDX`,
      signedBy: 'Hiệu trưởng Nguyễn Quốc Bảo',
      notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const currentTransfers = storageService.getStaffTransfers();
    currentTransfers.unshift(newRecord);
    storageService.saveStaffTransfers(currentTransfers);
    setTransfers(currentTransfers);

    // If internal transfer, update staff campus
    if (transferType === 'DIEU_DONG_NOI_BO') {
      const staffList = storageService.getStaffList();
      const idx = staffList.findIndex((s) => s.account.id === selectedStaffForTransfer.id);
      if (idx !== -1) {
        staffList[idx].account.campusName = toLocation;
        staffList[idx].sheetDataAZ['X'] = toLocation; // Column X: Campus
        storageService.saveStaffList(staffList);
      }
    }

    storageService.addSyncLog(
      'Biến động nhân sự',
      `Đã lập quyết định điều chuyển đồng chí ${selectedStaffForTransfer.name} về ${toLocation}`
    );

    setShowTransferModal(false);
    setSelectedStaffForTransfer(null);
    setToLocation('');
    setDecisionNo('');
    setNotes('');
    onRefreshData();
  };

  const handleRegisterTransferInTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tiTeacherName || !tiPreviousSchool) return;

    storageService.registerTransferInTeacher({
      fullName: tiTeacherName,
      previousSchool: tiPreviousSchool,
      subject: tiSubject,
      level: tiLevel,
      position: tiPosition,
      branchName: tiBranch,
      campusName: tiCampus,
      phone: tiPhone || '098' + Math.floor(1000000 + Math.random() * 9000000),
      email: tiEmail,
      decisionNo: tiDecisionNo,
    });

    setTransfers(storageService.getStaffTransfers());
    setShowTransferInTeacherModal(false);
    setTiTeacherName('');
    setTiPreviousSchool('');
    setTiPhone('');
    setTiEmail('');
    onRefreshData();
  };

  const handleConfirmRemoveStaff = () => {
    if (!selectedStaffForRemoval) return;

    storageService.removeStaff(selectedStaffForRemoval.id, removalReason);
    setTransfers(storageService.getStaffTransfers());
    setShowRemoveStaffModal(false);
    setSelectedStaffForRemoval(null);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Quy chuẩn 138 Cán bộ, Giáo viên & Nhân viên
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">Quản Lý Nhân Sự & Biến Động Công Tác</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi cá nhân sở hữu 1 file Google Sheet riêng gồm 52 cột A-AZ trong Google Drive của nhà trường.
          </p>
        </div>

        {canViewAll && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('directory')}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${
                  activeSubTab === 'directory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Danh bạ Nhân sự ({activeStaffCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('transfers')}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${
                  activeSubTab === 'transfers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Lịch sử Điều chuyển ({transfers.length})
              </button>
            </div>

            {/* Vòng đời nhân sự: ACTIVE / INACTIVE / TẤT CẢ (Yêu cầu 2) */}
            {activeSubTab === 'directory' && (
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setStaffLifecycleFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    staffLifecycleFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Cán bộ, giáo viên và nhân viên đang công tác"
                >
                  Đang công tác ({activeStaffCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffLifecycleFilter('INACTIVE')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    staffLifecycleFilter === 'INACTIVE'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Cán bộ đã nghỉ hưu, chuyển công tác hoặc tạm dừng"
                >
                  Đã nghỉ / INACTIVE ({inactiveStaffCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffLifecycleFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    staffLifecycleFilter === 'ALL'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({allStaff.length})
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowTransferInTeacherModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow transition active:scale-95"
              title="Tiếp nhận giáo viên mới chuyển trường đến"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tiếp nhận GV mới chuyển đến</span>
            </button>

            <button
              type="button"
              onClick={onOpenRegister}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow transition active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký Nhân sự mới (Tự sinh Sheet)</span>
            </button>
          </div>
        )}
      </div>

      {!canViewAll && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-center gap-3 text-amber-900 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <h4 className="font-extrabold text-sm">Chế Độ Bảo Mật Thông Tin Nhân Sự</h4>
            <p className="mt-0.5 text-amber-800">
              Theo quy định bảo mật của nhà trường: Mỗi giáo viên và nhân viên chỉ xem và chỉnh sửa được hồ sơ nhân sự
              của chính mình, không xem được thông tin nhân sự của người khác. Chỉ Ban Giám hiệu (Hiệu trưởng Nguyễn
              Quốc Bảo, các Phó Hiệu trưởng và Quản trị Tin học) mới có thẩm quyền quản lý toàn bộ danh bạ.
            </p>
          </div>
        </div>
      )}

      {activeSubTab === 'directory' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm họ tên, mã ID, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Role filter */}
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="ALL">-- Tất cả vị trí (138 người) --</option>
                  <option value="BGH">Ban Giám hiệu (HT & 3 PHT)</option>
                  <option value="GV_THCS">Giáo viên THCS (36 người)</option>
                  <option value="GV_TH">Giáo viên Tiểu học (76 người)</option>
                  <option value="NV">Nhân viên hành chính (10 người)</option>
                  <option value="BV">Bảo vệ & Hợp đồng (10 người)</option>
                  <option value="GV_HD">Giáo viên hợp đồng (2 người)</option>
                </select>
              </div>

              {/* Branch filter */}
              <div>
                <select
                  value={branchFilter}
                  onChange={(e) => {
                    setBranchFilter(e.target.value);
                    setCampusFilter('ALL');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="ALL">-- Tất cả 4 Phân hiệu --</option>
                  {BRANCHES_DATA.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campus filter */}
              <div>
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="ALL">-- Tất cả 12 Điểm trường --</option>
                  {ALL_CAMPUSES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>
                Tìm thấy <strong>{filteredStaff.length}</strong> cán bộ, giáo viên, nhân viên phù hợp.
              </span>
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('ALL');
                  setBranchFilter('ALL');
                  setCampusFilter('ALL');
                  setSearchTerm('');
                }}
                className="text-red-700 hover:underline font-semibold"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
                  <tr>
                    <th className="py-3 px-4">Mã ID</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Chức vụ & Bộ môn</th>
                    <th className="py-3 px-4">Điểm trường & Phân hiệu</th>
                    <th className="py-3 px-4">Số điện thoại</th>
                    <th className="py-3 px-4 text-center">Google Sheet (A-AZ)</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map(({ account, sheetDataAZ }) => {
                    const isInactive = account.status === 'INACTIVE';
                    return (
                    <tr key={account.id} className={`transition ${isInactive ? 'bg-rose-50/40 text-slate-500' : 'hover:bg-slate-50/80'}`}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {account.id}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isInactive ? 'bg-slate-200 text-slate-700' : 'bg-red-100 text-red-800'
                          }`}>
                            {account.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{account.name}</span>
                              {isInactive && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                  INACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {account.email || 'no-email@dongxuan.edu.vn'}
                              {isInactive && account.inactivatedReason && (
                                <span className="text-rose-600 block text-[10px]">
                                  Lý do: {account.inactivatedReason} ({account.inactivatedDate || ''})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{account.position}</div>
                        <div className="text-[11px] text-slate-500">
                          {account.role === 'GV'
                            ? 'Giáo viên bộ môn'
                            : account.role === 'NV'
                            ? 'Viên chức hành chính'
                            : account.role === 'NV_HD_BV'
                            ? 'Bảo vệ / Phục vụ'
                            : 'Ban Giám hiệu'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{account.campusName}</div>
                        <div className="text-[11px] text-slate-500">{account.branchName}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {account.phone}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onViewStaffAZ(account)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 transition"
                          title="Xem & chỉnh sửa bảng dữ liệu 52 cột A-AZ"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>52 Cột (A-AZ)</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Sửa thông tin nhân sự (Yêu cầu 2) */}
                          {canViewAll && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditStaff(account)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition"
                              title="Chỉnh sửa thông tin nhân sự (Họ tên, SĐT, email, chức vụ, điểm trường...)"
                            >
                              <Pencil className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForTransfer(account);
                              setShowTransferModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                            title="Điều chuyển công tác / Chuyển đến / Chuyển đi"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {/* Xóa -> INACTIVE hoặc Khôi phục -> ACTIVE (Yêu cầu 2) */}
                          {canViewAll && account.role !== 'HT' && (
                            !isInactive ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStaffForRemoval(account);
                                  setRemovalReason('Nghỉ hưu theo chế độ');
                                  setShowRemoveStaffModal(true);
                                }}
                                className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-800 transition"
                                title="Bớt / Giảm nhân sự (Chuyển sang INACTIVE bảo toàn hồ sơ)"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRestoreStaff(account)}
                                className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition font-bold"
                                title="Khôi phục cán bộ về trạng thái Đang công tác (ACTIVE)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}

                          <a
                            href={account.sheetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                            title="Mở Google Sheet trên Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          </a>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Hệ thống Quản lý nội bộ trường học, do Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng.</span>
              <span className="font-semibold text-slate-700">Tổng cộng: {allStaff.length} hồ sơ số</span>
            </div>
          </div>
        </>
      ) : (
        /* Transfers Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sổ Theo Dõi Biến Động Nhân Sự & Điều Chuyển</h3>
              <p className="text-xs text-slate-500">
                Ghi nhận tất cả các quyết định chuyển đến, chuyển đi, điều động giữa 12 điểm trường.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Số Quyết Định</th>
                  <th className="py-3 px-4">Họ và Tên Nhân Sự</th>
                  <th className="py-3 px-4">Loại Biến Động</th>
                  <th className="py-3 px-4">Từ Điểm Trường</th>
                  <th className="py-3 px-4">Chuyển Đến Điểm Trường</th>
                  <th className="py-3 px-4">Ngày Hiệu Lực</th>
                  <th className="py-3 px-4">Ghi Chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{tr.decisionNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{tr.staffName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          tr.transferType === 'DIEU_DONG_NOI_BO'
                            ? 'bg-blue-100 text-blue-800'
                            : tr.transferType === 'CHUYEN_DEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tr.transferType === 'DIEU_DONG_NOI_BO'
                          ? 'Điều động nội bộ'
                          : tr.transferType === 'CHUYEN_DEN'
                          ? 'Chuyển đến trường'
                          : 'Chuyển đi khỏi trường'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{tr.fromLocation}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{tr.toLocation}</td>
                    <td className="py-3 px-4 text-slate-600">{tr.fromDate}</td>
                    <td className="py-3 px-4 text-slate-500 italic">{tr.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer Staff Modal */}
      {showTransferModal && selectedStaffForTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Điều Động / Biến Động Công Tác Nhân Sự
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800">{selectedStaffForTransfer.name}</div>
                <div className="text-slate-500">
                  {selectedStaffForTransfer.position} • Điểm trường hiện tại: <strong>{selectedStaffForTransfer.campusName}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hình thức biến động nhân sự:</label>
                <select
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="DIEU_DONG_NOI_BO">Điều động nội bộ giữa 12 điểm trường</option>
                  <option value="CHUYEN_DI">Chuyển công tác ra khỏi trường Đồng Xuân</option>
                  <option value="CHUYEN_DEN">Tiếp nhận chuyển công tác về trường</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Điểm trường hoặc Đơn vị mới đến:</label>
                {transferType === 'DIEU_DONG_NOI_BO' ? (
                  <select
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="">-- Chọn điểm trường tiếp nhận --</option>
                    {ALL_CAMPUSES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.branchName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    placeholder="Tên trường / đơn vị tiếp nhận hoặc chuyển đến..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số Quyết định / Tờ trình:</label>
                <input
                  type="text"
                  value={decisionNo}
                  onChange={(e) => setDecisionNo(e.target.value)}
                  placeholder="VD: QĐ-156/QĐ-THCSDX hoặc tự sinh"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do & Nhiệm vụ phân công:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Lý do điều chuyển, nhiệm vụ mới..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition"
                >
                  Ban Hành Quyết Định & Đồng Bộ Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Tiếp Nhận Giáo Viên Mới Chuyển Đến (Requirement 3) */}
      {showTransferInTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Tiếp Nhận Giáo Viên Mới Chuyển Trường Đến
                  </h3>
                  <p className="text-xs text-slate-500">Tự động sinh mã ID, cấp Google Sheet (A-AZ) và lưu lịch sử biến động</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferInTeacherModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterTransferInTeacher} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên giáo viên:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Thị Lan Hương"
                  value={tiTeacherName}
                  onChange={(e) => setTiTeacherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Trường cũ chuyển đến:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trường THCS Xuân Phước / THCS Đồng Thịnh..."
                  value={tiPreviousSchool}
                  onChange={(e) => setTiPreviousSchool(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Môn giảng dạy:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Toán, Ngữ văn, Tiếng Anh..."
                    value={tiSubject}
                    onChange={(e) => setTiSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cấp học:</label>
                  <select
                    value={tiLevel}
                    onChange={(e) => {
                      setTiLevel(e.target.value as any);
                      setTiPosition(`Giáo viên ${e.target.value}`);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="TH">Tiểu học (TH)</option>
                    <option value="THCS">Trung học cơ sở (THCS)</option>
                    <option value="Cả 2 cấp">Cả 2 cấp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phân hiệu tiếp nhận:</label>
                  <select
                    value={tiBranch}
                    onChange={(e) => {
                      setTiBranch(e.target.value);
                      const branch = BRANCHES_DATA.find((b) => b.name === e.target.value);
                      if (branch && branch.campuses[0]) {
                        setTiCampus(branch.campuses[0].name);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    {BRANCHES_DATA.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Điểm trường bố trí:</label>
                  <select
                    value={tiCampus}
                    onChange={(e) => setTiCampus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    {ALL_CAMPUSES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại:</label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0984112233"
                    value={tiPhone}
                    onChange={(e) => setTiPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Quyết định tiếp nhận:</label>
                  <input
                    type="text"
                    placeholder="VD: QĐ-88/QĐ-THCSDX"
                    value={tiDecisionNo}
                    onChange={(e) => setTiDecisionNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferInTeacherModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Tiếp Nhận & Tự Sinh Sheet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh Sửa Thông Tin Cán Bộ / GV / NV (Yêu cầu 2) */}
      {showEditStaffModal && selectedStaffForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Chỉnh Sửa Hồ Sơ Cán Bộ / GV / NV
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mã cán bộ: <strong className="font-mono text-slate-800">{selectedStaffForEdit.id}</strong> • Đồng bộ tức thì với Google Sheet 52 cột
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditStaffModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên cán bộ/giáo viên:</label>
                <input
                  type="text"
                  required
                  value={staffEditData.name}
                  onChange={(e) => setStaffEditData({ ...staffEditData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại liên hệ:</label>
                  <input
                    type="tel"
                    required
                    value={staffEditData.phone}
                    onChange={(e) => setStaffEditData({ ...staffEditData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email công vụ:</label>
                  <input
                    type="email"
                    value={staffEditData.email}
                    onChange={(e) => setStaffEditData({ ...staffEditData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chức vụ & Bộ môn phụ trách:</label>
                <input
                  type="text"
                  required
                  value={staffEditData.position}
                  onChange={(e) => setStaffEditData({ ...staffEditData, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  placeholder="VD: Giáo viên THCS môn Toán / Nhân viên Kế toán..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Điểm trường công tác:</label>
                  <select
                    value={staffEditData.campusName}
                    onChange={(e) => {
                      const matched = ALL_CAMPUSES.find((c) => c.name === e.target.value);
                      setStaffEditData({
                        ...staffEditData,
                        campusName: e.target.value,
                        branchName: matched ? matched.branchName : staffEditData.branchName,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    {ALL_CAMPUSES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.branchName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phân hiệu:</label>
                  <input
                    type="text"
                    disabled
                    value={staffEditData.branchName}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vai trò & Phân quyền hệ thống:</label>
                <select
                  value={staffEditData.role}
                  onChange={(e) => setStaffEditData({ ...staffEditData, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="HT">Hiệu trưởng (Toàn quyền quản trị & điều hành)</option>
                  <option value="PHT">Phó Hiệu trưởng (Phụ trách chuyên môn theo phân hiệu)</option>
                  <option value="GV">Giáo viên (Chủ nhiệm, bộ môn, thi đua)</option>
                  <option value="GV_TIN_HOC">Giáo viên Tin học (Hỗ trợ CNTT & quản lý lớp/HS)</option>
                  <option value="NV">Nhân viên Hành chính / Kế toán / Y tế / Thiết bị</option>
                  <option value="NV_HD_BV">Nhân viên Bảo vệ / Phục vụ theo HĐ</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cảnh Báo Chuyển Nhân Sự Sang INACTIVE (Yêu cầu 2: Quản lý vòng đời nhân sự, bảo toàn dữ liệu, cho phép khôi phục) */}
      {showRemoveStaffModal && selectedStaffForRemoval && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-rose-950">
                  Cảnh Báo: Chuyển Cán Bộ / GV / NV Sang Trạng Thái INACTIVE
                </h3>
                <p className="text-xs text-rose-600">
                  Nhân sự: <strong>{selectedStaffForRemoval.name}</strong> • Mã ID: {selectedStaffForRemoval.id}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bảo lưu 100% dữ liệu hồ sơ số & Google Sheet (A-AZ):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Đồng chí <strong>{selectedStaffForRemoval.name}</strong> sẽ được chuyển sang danh sách lưu trữ <strong>(INACTIVE - Không hoạt động)</strong>. Toàn bộ file Google Sheet 52 cột A-AZ, lịch sử thi đua, đánh giá nhiệm vụ và hồ sơ cá nhân vẫn được bảo lưu an toàn trên hệ thống.
                </p>
                <p className="text-[11px] font-semibold text-emerald-700">
                  ✓ Hiệu trưởng có thể bấm nút "Khôi phục" bất kỳ lúc nào để đưa cán bộ trở lại danh sách đang công tác (ACTIVE) nếu bấm nhầm nút xóa hoặc khi cán bộ quay trở lại làm việc.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-0.5">
                <div>Chức vụ hiện tại: <strong className="text-slate-900">{selectedStaffForRemoval.position}</strong></div>
                <div>Điểm trường: {selectedStaffForRemoval.campusName} ({selectedStaffForRemoval.branchName})</div>
                <div>Số điện thoại: <span className="font-mono">{selectedStaffForRemoval.phone}</span></div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn hoặc nhập lý do ngưng công tác:</label>
                <select
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 mb-2"
                >
                  <option value="Nghỉ hưu theo chế độ BHXH">1. Nghỉ hưu theo chế độ BHXH</option>
                  <option value="Chuyển công tác ra ngoài huyện/tỉnh">2. Chuyển công tác ra ngoài huyện/tỉnh</option>
                  <option value="Chấm dứt hợp đồng lao động">3. Chấm dứt hợp đồng lao động</option>
                  <option value="Mất (qua đời / từ trần)">4. Mất (qua đời / từ trần)</option>
                  <option value="Xóa nhầm / Dữ liệu tạo trùng lặp">5. Xóa nhầm / Dữ liệu tạo trùng lặp</option>
                  <option value="Khác">6. Lý do khác</option>
                </select>
                <input
                  type="text"
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRemoveStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoveStaff}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Đồng Ý Chuyển INACTIVE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
