import React, { useState } from 'react';
import {
  UserAccount,
  Role,
} from '../types/school';
import {
  canAccessTab,
  isFullPrincipal,
  isVicePrincipal,
  getPhtAssignedBranch,
} from '../utils/permissionUtils';
import {
  GraduationCap,
  LogOut,
  UserCheck,
  Printer,
  Download,
  UserPlus,
  KeyRound,
  FileSpreadsheet,
  Building2,
  ChevronDown,
  Layers,
  Sparkles,
  User,
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserAccount | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenChangePassword: () => void;
  onSwitchUser: (userId: string) => void;
  allStaff: { account: UserAccount }[];
  pendingLeavesCount: number;
  pendingRepairsCount: number;
  pendingAbsencesCount: number;
  pendingFeedbackCount?: number;
  pendingArticlesCount?: number;
  pendingExpensesCount?: number;
  pendingWorkflowsCount?: number;
  activeSchoolYear: string;
  allSchoolYears: string[];
  onChangeSchoolYear: (year: string) => void;
  onOpenYearTransition: () => void;
  onOpenApprovalCenter?: () => void;
  totalPendingApprovals?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
  onOpenLogin,
  onOpenRegister,
  onOpenChangePassword,
  onSwitchUser,
  allStaff,
  pendingLeavesCount,
  pendingRepairsCount,
  pendingAbsencesCount,
  pendingFeedbackCount = 0,
  pendingArticlesCount = 0,
  pendingExpensesCount = 0,
  pendingWorkflowsCount = 0,
  activeSchoolYear = '2026-2027',
  allSchoolYears = ['2025-2026', '2026-2027', '2027-2028'],
  onChangeSchoolYear,
  onOpenYearTransition,
  onOpenApprovalCenter,
  totalPendingApprovals = 0,
}) => {
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'HT':
        return <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2 py-0.5 rounded border border-red-200">Hiệu trưởng (Admin)</span>;
      case 'PHT':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded border border-amber-200">Phó Hiệu trưởng</span>;
      case 'GV_TIN_HOC':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded border border-purple-200">Quản trị Hệ thống</span>;
      case 'GV':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded border border-blue-200">Giáo viên</span>;
      case 'NV':
        return <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded border border-teal-200">Nhân viên</span>;
      case 'NV_HD_BV':
        return <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-2 py-0.5 rounded border border-orange-200">Bảo vệ / Hợp đồng</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200">Người dùng</span>;
    }
  };

  const navItems = [
    { id: 'personal_dashboard', label: 'Dashboard Cá Nhân', icon: '👤' },
    { id: 'dashboard', label: 'Tổng quan Toàn Trường', icon: '📊' },
    {
      id: 'public_portal',
      label: 'Cổng TT & Hoạt Động PHHS',
      icon: '🌐',
      badge: pendingArticlesCount > 0 ? pendingArticlesCount : null,
    },
    {
      id: 'feedback_hub',
      label: 'Hòm Thư Góp Ý & Công Khai',
      icon: '📬',
      badge: pendingFeedbackCount > 0 ? pendingFeedbackCount : null,
    },
    { id: 'academic_primary', label: 'Chuyên Môn Tiểu Học', icon: '🌱' },
    { id: 'academic_secondary', label: 'Chuyên Môn THCS', icon: '🔬' },
    { id: 'branch_portals', label: '6 Trang Hiển Thị', icon: '🏛️' },
    {
      id: 'work_workflow',
      label: 'Quy Trình & Đánh Giá NV',
      icon: '⚡',
      badge: pendingWorkflowsCount > 0 ? pendingWorkflowsCount : null,
    },
    { id: 'notices_honors', label: 'Bảng Tin & Khen Thưởng', icon: '📢' },
    { id: 'profile_az', label: 'Hồ sơ Cá nhân (A-AZ)', icon: '👤' },
    { id: 'staff', label: 'Nhân sự (137)', icon: '👥' },
    { id: 'classes', label: '57 Lớp & 1.289 HS', icon: '🏫' },
    { id: 'multi_stats', label: 'Thống Kê Đa Tiêu Chí', icon: '🎯' },
    { id: 'dispatches', label: 'Quản Lý Sổ Sách', icon: '📚' },
    { id: 'gradebook', label: 'Sổ Điểm Điện Tử', icon: '📖' },
    { id: 'finance', label: 'Tài Chính & Học Phí', icon: '💰' },
    {
      id: 'internal_expenses',
      label: 'Sổ Chi Tiêu Nội Bộ',
      icon: '🧾',
      badge: pendingExpensesCount > 0 ? pendingExpensesCount : null,
    },
    {
      id: 'principal_cashbook',
      label: 'Sổ Quỹ Thu - Chi (HT)',
      icon: '🏛️',
    },
    { id: 'health', label: 'Y Tế Học Đường', icon: '🩺' },
    {
      id: 'leaves',
      label: 'Nghỉ phép & Dạy thay',
      icon: '📝',
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : null,
    },
    {
      id: 'student_leaves',
      label: 'HS Nghỉ & Chuyên cần',
      icon: '🎒',
      badge: pendingAbsencesCount > 0 ? pendingAbsencesCount : null,
    },
    { id: 'schedule', label: 'Thời khóa biểu', icon: '📅' },
    {
      id: 'facilities',
      label: 'CSVC & Sửa chữa',
      icon: '🛠️',
      badge: pendingRepairsCount > 0 ? pendingRepairsCount : null,
    },
    { id: 'gas_center', label: 'GAS & Drive Sync', icon: '☁️' },
    { id: 'audit_logs', label: 'Nhật Ký Hệ Thống', icon: '📜' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
      {/* Top Banner: Mandatory Copyright notice */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-amber-300">
            Hệ thống Quản lý nội bộ trường học, do Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng, mọi sao chép đều phải xin phép.
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="hidden sm:inline">Thôn Long Châu, Xã Đồng Xuân, Tỉnh Phú Yên</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-emerald-400 flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Firestore Cloud: Hoạt động (Dữ liệu thật)
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-amber-300 ring-2 ring-red-100 flex-shrink-0">
              ĐX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  ỦY BAN NHÂN DÂN XÃ ĐỒNG XUÂN
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                TRƯỜNG TIỂU HỌC & TRUNG HỌC CƠ SỞ ĐỒNG XUÂN
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span>1 Trụ sở chính & 3 Phân hiệu • 11 Điểm trường • 57 Lớp • 1.289 Học sinh</span>
              </p>
            </div>
          </div>

          {/* Right Controls: HT Approval Hub, School Year Selector, Role Switcher, Print, User Badge */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Direct Approval / Submission Center Button */}
            {onOpenApprovalCenter && (
              <button
                type="button"
                onClick={onOpenApprovalCenter}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-800 hover:to-amber-700 text-white text-xs font-bold shadow-md transition active:scale-95 border border-amber-300/40"
                title={
                  isFullPrincipal(currentUser)
                    ? 'Trung tâm Phê chuẩn trực tuyến của Hiệu trưởng'
                    : isVicePrincipal(currentUser)
                    ? `Phê duyệt PHT (${getPhtAssignedBranch(currentUser) || 'Phân hiệu'})`
                    : 'Gửi đơn nghỉ phép, đề xuất cơ sở vật chất hoặc tờ trình lên Ban Giám hiệu'
                }
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>
                  {isFullPrincipal(currentUser)
                    ? '👑 Duyệt HT'
                    : isVicePrincipal(currentUser)
                    ? `⚡ Duyệt PHT`
                    : '📝 Trình Đơn BGH'}
                </span>
                {totalPendingApprovals > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full shadow-xs">
                    {totalPendingApprovals}
                  </span>
                )}
              </button>
            )}

            {/* School Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 pl-1.5 hidden md:inline">Năm học:</span>
              <select
                value={activeSchoolYear}
                onChange={(e) => onChangeSchoolYear?.(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-red-700 outline-none cursor-pointer hover:border-red-300"
                title="Chọn CSDL và dữ liệu theo năm học"
              >
                {allSchoolYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              {(currentUser?.role === 'HT' || currentUser?.role === 'GV_TIN_HOC') && (
                <button
                  type="button"
                  onClick={onOpenYearTransition}
                  className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg text-[10px] shadow-sm flex items-center gap-1 transition"
                  title="Chuyển học sinh lên lớp năm học mới"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span className="hidden lg:inline">Chuyển lên lớp mới</span>
                </button>
              )}
            </div>

            {/* Quick Staff Account Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition shadow-sm"
                title="Chuyển đổi tài khoản làm việc của cán bộ"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Chuyển tài khoản</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Chuyển tài khoản cán bộ làm việc:
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {(() => {
                      const priorityIds = [
                        'HT01',
                        'PHT01',
                        'PHT02',
                        'PHT03',
                        'NV_THU_QUY',
                        'NV_KE_TOAN',
                        'NV_VAN_THU',
                        'GV_IT01',
                        'GV_001',
                        'GV_071',
                        'BV_123',
                      ];
                      const keyStaff = priorityIds
                        .map((id) => allStaff.find((s) => s.account.id === id))
                        .filter(Boolean) as { account: UserAccount }[];
                      const others = allStaff.filter((s) => !priorityIds.includes(s.account.id)).slice(0, 3);
                      return [...keyStaff, ...others].map((s) => (
                        <button
                          key={s.account.id}
                          type="button"
                          onClick={() => {
                            onSwitchUser(s.account.id);
                            setShowRoleSwitcher(false);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition ${
                            currentUser?.id === s.account.id ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-semibold truncate">
                              {s.account.name}
                              {s.account.id === 'HT01' && <span className="ml-1 text-[10px] text-red-600 font-bold">(HT Toàn trường)</span>}
                              {s.account.id === 'PHT01' && <span className="ml-1 text-[10px] text-amber-700 font-bold">(PHT Xuân Long)</span>}
                              {s.account.id === 'PHT02' && <span className="ml-1 text-[10px] text-amber-700 font-bold">(PHT La Hai)</span>}
                              {s.account.id === 'PHT03' && <span className="ml-1 text-[10px] text-amber-700 font-bold">(PHT Xuân Quang 2)</span>}
                              {s.account.id === 'NV_THU_QUY' && <span className="ml-1 text-[10px] text-emerald-700 font-bold">(Thủ quỹ)</span>}
                              {s.account.id === 'NV_KE_TOAN' && <span className="ml-1 text-[10px] text-blue-700 font-bold">(Kế toán)</span>}
                              {s.account.id === 'NV_VAN_THU' && <span className="ml-1 text-[10px] text-purple-700 font-bold">(Văn thư)</span>}
                              {s.account.id === 'GV_IT01' && <span className="ml-1 text-[10px] text-cyan-700 font-bold">(GV Tin học)</span>}
                              {s.account.id === 'GV_001' && <span className="ml-1 text-[10px] text-teal-700 font-bold">(GV Tiểu học)</span>}
                              {s.account.id === 'GV_071' && <span className="ml-1 text-[10px] text-indigo-700 font-bold">(GV THCS)</span>}
                              {s.account.id === 'BV_123' && <span className="ml-1 text-[10px] text-slate-700 font-bold">(Bảo vệ)</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{s.account.position} ({s.account.id})</div>
                          </div>
                          {getRoleBadge(s.account.role)}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Print Action */}
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 text-xs font-medium"
              title="In thông tin trang web này"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">In biểu mẫu</span>
            </button>

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      currentUser.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="text-left hidden lg:block pr-1">
                    <div className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{currentUser.position}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs divide-y divide-slate-100">
                    <div className="px-3 py-2">
                      <div className="font-bold text-slate-800">{currentUser.name}</div>
                      <div className="text-slate-500 text-[11px]">{currentUser.email}</div>
                      <div className="mt-1 flex items-center gap-1">{getRoleBadge(currentUser.role)}</div>
                      <div className="mt-2 text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                        📍 {currentUser.campusName}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('personal_dashboard');
                          setShowUserMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-indigo-700 font-semibold hover:bg-indigo-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-indigo-600" />
                        <span>Dashboard cá nhân</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('profile_az');
                          setShowUserMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Xem hồ sơ 52 Cột (A-AZ)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenChangePassword();
                          setShowUserMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Đổi mật khẩu</span>
                      </button>
                      {(currentUser.role === 'HT' || currentUser.role === 'GV_TIN_HOC') && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenRegister();
                            setShowUserMenu(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4 text-blue-600" />
                          <span>Đăng ký nhân sự / lớp học mới</span>
                        </button>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất hệ thống</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition shadow-sm"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation - Dynamically filtered by role */}
        <nav className="mt-3 flex space-x-1 overflow-x-auto pb-1 text-xs scrollbar-none">
          {navItems
            .filter((tab) => canAccessTab(currentUser, tab.id))
            .map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-red-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-red-700' : 'bg-red-600 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>
      </div>
    </header>
  );
};
