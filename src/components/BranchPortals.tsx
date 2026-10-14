import React, { useState } from 'react';
import {
  UserAccount,
  SchoolClass,
  LeaveRequest,
  SubstituteTeachingRequest,
  StudentAbsenceRequest,
  DailyAttendanceSession,
  PublicReminder,
  PublicCommendation,
  StudentTransferReport,
} from '../types/school';
import { BRANCHES_DATA } from '../data/initialData';
import { canAccessBranchPortal, getResponsibleApproverLabel } from '../utils/permissionUtils';
import { storageService } from '../services/storageService';
import { StudentTransfersPage5 } from './StudentTransfersPage5';
import { WorkProgressPage6 } from './WorkProgressPage6';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Users,
  Calendar,
  AlertTriangle,
  Award,
  FileText,
  Clock,
  ExternalLink,
  MapPin,
  CheckCircle,
  FileSpreadsheet,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';

interface BranchPortalsProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  allStaff: { account: UserAccount }[];
  classes: SchoolClass[];
  leaves: LeaveRequest[];
  substitutes: SubstituteTeachingRequest[];
  studentAbsences: StudentAbsenceRequest[];
  transfers?: StudentTransferReport[];
  onRefreshData?: () => void;
}

export const BranchPortals: React.FC<BranchPortalsProps> = ({
  currentUser,
  activeSchoolYear,
  allStaff,
  classes,
  leaves,
  substitutes,
  studentAbsences,
  transfers,
  onRefreshData,
}) => {
  // 6 Display Pages (Trang hiển thị theo phân quyền)
  type PortalType = 'TOAN_TRUONG' | 'LA_HAI' | 'XUAN_LONG' | 'XUAN_QUANG_2' | 'TRANG_5_CHUYEN_DEN_DI' | 'TRANG_6_TIEN_DO_CONG_VIEC';
  const [selectedPortal, setSelectedPortal] = useState<PortalType>('TOAN_TRUONG');
  const [portalSubTab, setPortalSubTab] = useState<'overview' | 'teacher_leaves' | 'student_leaves' | 'attendance' | 'emulation'>('overview');

  // Datasets from storage
  const reminders = storageService.getPublicReminders(activeSchoolYear);
  const commendations = storageService.getPublicCommendations(activeSchoolYear);
  const attendances = storageService.getDailyAttendances(activeSchoolYear);

  // Check access permission for the active portal
  const accessCheck = canAccessBranchPortal(currentUser, selectedPortal);

  // Portal definitions (6 Trang hiển thị)
  const portalConfigs = [
    {
      id: 'TOAN_TRUONG' as PortalType,
      title: 'Trang 1: Toàn Trường',
      badge: 'Công khai toàn trường',
      branchName: 'Toàn trường Đồng Xuân',
      description: 'Hiển thị thông tin chung toàn trường (Tất cả tài khoản đều xem được)',
      phtInCharge: 'Hiệu trưởng Nguyễn Quốc Bảo (Phụ trách chung)',
      classesCount: 57,
      studentsCount: 1289,
      campusNames: ['Trụ sở chính (Thôn Long Châu, Đắk Lắk)', 'Phân hiệu TH La Hai (3 điểm)', 'Phân hiệu Xuân Long (3 điểm)', 'Phân hiệu Xuân Quang 2 (5 điểm)'],
    },
    {
      id: 'LA_HAI' as PortalType,
      title: 'Trang 2: Phân hiệu TH La Hai',
      badge: 'Nội bộ TH La Hai',
      branchName: 'Phân hiệu TH La Hai',
      description: 'Chỉ hiển thị thông tin của phân hiệu TH La Hai (HT, PHT Trần Thanh Long và tài khoản tại TH La Hai)',
      phtInCharge: 'Thầy Trần Thanh Long (PHT phụ trách)',
      classesCount: 20,
      studentsCount: 465,
      campusNames: ['Điểm trường TH La Hai (11 lớp - 260 HS)', 'Điểm trường Mầm non La Hai (4 lớp - 95 HS)', 'Điểm trường TH Long Hà (5 lớp - 110 HS)'],
    },
    {
      id: 'XUAN_LONG' as PortalType,
      title: 'Trang 3: Phân hiệu Xuân Long',
      badge: 'Nội bộ TH & THCS Xuân Long',
      branchName: 'Phân hiệu TH và THCS Xuân Long',
      description: 'Chỉ hiển thị thông tin của phân hiệu TH và THCS Xuân Long (HT, PHT Phan Hưng Tuyên và tài khoản tại Xuân Long)',
      phtInCharge: 'Thầy Phan Hưng Tuyên (PHT phụ trách)',
      classesCount: 20,
      studentsCount: 480,
      campusNames: ['Điểm trường THCS Long Mỹ (11 lớp - 275 HS)', 'Điểm trường TH Long Mỹ (5 lớp - 115 HS)', 'Điểm trường TH Long Hòa (4 lớp - 90 HS)'],
    },
    {
      id: 'XUAN_QUANG_2' as PortalType,
      title: 'Trang 4: Phân hiệu Xuân Quang 2',
      badge: 'Nội bộ Xuân Quang 2',
      branchName: 'Phân hiệu TH và THCS Xuân Quang 2',
      description: 'Chỉ hiển thị thông tin của phân hiệu TH và THCS Xuân Quang 2 (HT, PHT Ninh Đức Hiếu và tài khoản tại Xuân Quang 2)',
      phtInCharge: 'Thầy Ninh Đức Hiếu (PHT phụ trách)',
      classesCount: 17,
      studentsCount: 344,
      campusNames: ['Điểm trường THCS Triêm Đức (7 lớp - 155 HS)', 'Điểm trường TH Triêm Đức (3 lớp - 60 HS)', 'Điểm trường TH Phước Huệ (3 lớp - 55 HS)', 'Điểm trường TH Phú Sơn (3 lớp - 50 HS)', 'Điểm trường TH Kỳ Đu (1 lớp ghép - 24 HS)'],
    },
    {
      id: 'TRANG_5_CHUYEN_DEN_DI' as PortalType,
      title: 'Trang 5: HS Chuyển Đi - Đến',
      badge: 'Công khai biến động HS',
      branchName: 'Biến Động Học Sinh Toàn Trường & Phân Hiệu',
      description: 'Trang thứ 5 chỉ hiển thị thông tin chuyển đi, chuyển đến của học sinh theo phân quyền và báo cáo thống kê đa chiều',
      phtInCharge: 'Ban Giám Hiệu & Giáo Viên Chủ Nhiệm (HT/PHT duyệt)',
      classesCount: 57,
      studentsCount: 1289,
      campusNames: ['Trụ sở chính & 3 Phân hiệu (11 điểm trường)'],
    },
    {
      id: 'TRANG_6_TIEN_DO_CONG_VIEC' as PortalType,
      title: 'Trang 6: Tiến Độ & Khen/Nhắc',
      badge: 'Công khai tiến độ',
      branchName: 'Đánh Giá Tiến Độ Công Việc & Thi Đua Toàn Trường',
      description: 'Trang thứ 6 công khai đánh giá tiến độ giải quyết công việc: khen người làm đúng tiến độ theo tuần/tháng, nhắc nhở người chậm hay bị chậm',
      phtInCharge: 'Hiệu trưởng Nguyễn Quốc Bảo & Các Phó Hiệu trưởng',
      classesCount: 57,
      studentsCount: 1289,
      campusNames: ['Toàn trường (GV TH, GV THCS, Nhân viên)'],
    },
  ];

  const currentConfig = portalConfigs.find((p) => p.id === selectedPortal)!;

  // Filter datasets for the active portal
  const filterByBranch = (branchName?: string) => {
    if (selectedPortal === 'TOAN_TRUONG' || selectedPortal === 'TRANG_5_CHUYEN_DEN_DI' || selectedPortal === 'TRANG_6_TIEN_DO_CONG_VIEC') return true;
    if (!branchName) return false;
    return branchName.toLowerCase().includes(currentConfig.branchName.toLowerCase());
  };

  const portalClasses = classes.filter((c) => selectedPortal === 'TOAN_TRUONG' || filterByBranch(c.branchName));
  const portalTeacherLeaves = leaves.filter((l) => (selectedPortal === 'TOAN_TRUONG' || filterByBranch(l.branchName)) && l.status === 'Đã phê duyệt');
  const portalSubstitutes = substitutes.filter((s) => (selectedPortal === 'TOAN_TRUONG' || filterByBranch(s.branchNameA)) && s.status === 'Đã phê duyệt');
  const portalStudentAbsences = studentAbsences.filter((a) => (selectedPortal === 'TOAN_TRUONG' || filterByBranch(a.branchName)) && a.status === 'Đã phê duyệt');
  const portalAttendances = attendances.filter((att) => selectedPortal === 'TOAN_TRUONG' || filterByBranch(att.branchName));
  const portalReminders = reminders.filter((r) => selectedPortal === 'TOAN_TRUONG' || filterByBranch(r.branchName));
  const portalCommendations = commendations.filter((c) => selectedPortal === 'TOAN_TRUONG' || filterByBranch(c.branchName));

  return (
    <div className="space-y-6">
      {/* 6 Portals Switcher */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-red-700 font-extrabold">
            <Building2 className="w-3.5 h-3.5" />
            HỆ THỐNG 6 TRANG HIỂN THỊ THÔNG TIN (PHÂN QUYỀN TRUY CẬP)
          </span>
          <span className="text-slate-400 font-normal">
            Đang đăng nhập: <strong>{currentUser?.name || 'Khách'}</strong> ({currentUser?.position || 'Chưa đăng nhập'} - {currentUser?.branchName || 'Toàn trường'})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {portalConfigs.map((portal) => {
            const isSelected = selectedPortal === portal.id;
            const check = canAccessBranchPortal(currentUser, portal.id);

            return (
              <button
                key={portal.id}
                type="button"
                onClick={() => setSelectedPortal(portal.id)}
                className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-red-700 border-red-800 text-white shadow-md'
                    : check.allowed
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-amber-200'
                          : check.allowed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {portal.badge}
                    </span>
                    {check.allowed ? (
                      <ShieldCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs">{portal.title}</h4>
                  <p className={`text-[10px] mt-0.5 line-clamp-2 ${isSelected ? 'text-red-100' : 'text-slate-500'}`}>
                    {portal.phtInCharge}
                  </p>
                </div>

                <div className={`mt-2 pt-2 border-t text-[10px] font-medium flex items-center justify-between ${isSelected ? 'border-red-600/60 text-red-100' : 'border-slate-200 text-slate-500'}`}>
                  <span>{portal.classesCount} Lớp • {portal.studentsCount} HS</span>
                  <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACCESS DENIED VIEW */}
      {!accessCheck.allowed ? (
        <div className="bg-white rounded-3xl border border-red-200 shadow-lg p-10 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Quyền Truy Cập Bị Giới Hạn</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {accessCheck.reason ||
                'Bạn không có quyền truy cập trang thông tin nội bộ của phân hiệu này. Nhằm bảo mật dữ liệu, mỗi giáo viên/nhân viên chỉ xem được thông tin của phân hiệu nơi mình công tác.'}
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border text-xs text-slate-500 text-left">
            <p>
              • Tài khoản của bạn:{' '}
              <strong className="text-slate-800">{currentUser?.name}</strong> ({currentUser?.position})
            </p>
            <p>
              • Thuộc đơn vị:{' '}
              <strong className="text-red-700">{currentUser?.branchName || 'Chưa xác định'}</strong>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              * Gợi ý: Hãy chuyển sang <strong>Trang 1: Toàn Trường</strong> để xem bảng tin chung, hoặc đăng nhập tài
              khoản BGH (Thầy Nguyễn Quốc Bảo / PHT phụ trách).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPortal('TOAN_TRUONG')}
            className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow transition"
          >
            Quay Về Trang 1 (Thông Tin Toàn Trường)
          </button>
        </div>
      ) : selectedPortal === 'TRANG_5_CHUYEN_DEN_DI' ? (
        <StudentTransfersPage5
          currentUser={currentUser}
          activeSchoolYear={activeSchoolYear}
          classes={classes}
          allStaff={allStaff}
          transfers={transfers}
          onRefreshData={onRefreshData}
        />
      ) : selectedPortal === 'TRANG_6_TIEN_DO_CONG_VIEC' ? (
        <WorkProgressPage6
          currentUser={currentUser}
          activeSchoolYear={activeSchoolYear}
          allStaff={allStaff}
          onRefreshData={onRefreshData}
        />
      ) : (
        /* ACCESS GRANTED: PORTAL CONTENT (PORTALS 1 - 4) */
        <div className="space-y-6">
          {/* Portal Hero Card */}
          <div className="bg-gradient-to-r from-red-800 via-rose-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-red-800 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                    {currentConfig.title}
                  </span>
                  <span className="text-xs text-rose-200">Năm học {activeSchoolYear}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{currentConfig.branchName}</h2>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-3xl">
                  {currentConfig.phtInCharge} • Địa chỉ: Thôn Long Châu, xã Đồng Xuân, tỉnh Đắk Lắk
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
                <div className="text-center px-3 border-r border-white/20">
                  <span className="text-xl font-black text-amber-300">{currentConfig.classesCount}</span>
                  <span className="block text-[10px] text-slate-300 uppercase font-semibold">Lớp học</span>
                </div>
                <div className="text-center px-3">
                  <span className="text-xl font-black text-emerald-300">{currentConfig.studentsCount}</span>
                  <span className="block text-[10px] text-slate-300 uppercase font-semibold">Học sinh</span>
                </div>
              </div>
            </div>

            {/* List of Campuses in this branch */}
            <div className="mt-4 pt-4 border-t border-white/15">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Các điểm trường thuộc phân hiệu ({currentConfig.campusNames.length} điểm):
              </span>
              <div className="flex flex-wrap gap-2">
                {currentConfig.campusNames.map((cName, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-sm text-xs font-semibold text-white border border-white/20"
                  >
                    📍 {cName}
                  </span>
                ))}
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/15">
              <button
                type="button"
                onClick={() => setPortalSubTab('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  portalSubTab === 'overview'
                    ? 'bg-white text-slate-900 shadow'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                📊 Tổng Quan & Danh Sách Lớp
              </button>

              <button
                type="button"
                onClick={() => setPortalSubTab('teacher_leaves')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  portalSubTab === 'teacher_leaves'
                    ? 'bg-white text-slate-900 shadow'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                📝 GV Nghỉ Phép & Đổi Tiết ({portalTeacherLeaves.length + portalSubstitutes.length})
              </button>

              <button
                type="button"
                onClick={() => setPortalSubTab('student_leaves')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  portalSubTab === 'student_leaves'
                    ? 'bg-white text-slate-900 shadow'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                🎒 HS Nghỉ Phép Đã Duyệt ({portalStudentAbsences.length})
              </button>

              <button
                type="button"
                onClick={() => setPortalSubTab('attendance')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  portalSubTab === 'attendance'
                    ? 'bg-white text-slate-900 shadow'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                📋 Điểm Danh Chuyên Cần Buổi Học
              </button>

              <button
                type="button"
                onClick={() => setPortalSubTab('emulation')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  portalSubTab === 'emulation'
                    ? 'bg-white text-slate-900 shadow'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                🏆 Thi Đua, Khen Thưởng & Nhắc Nhở ({portalCommendations.length + portalReminders.length})
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: TỔNG QUAN & LỚP HỌC */}
          {portalSubTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick links to Google Sheet & Drive of this branch */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider">
                      Google Sheet & Drive Tự Động Phân Hiệu {currentConfig.branchName}
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Tất cả danh sách học sinh, điểm danh, đơn xin nghỉ phép đều được đồng bộ thời gian thực.
                    </p>
                  </div>
                </div>

                <a
                  href={`https://docs.google.com/spreadsheets/d/dx_branch_${selectedPortal}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Google Sheet Phân Hiệu</span>
                </a>
              </div>

              {/* Roster of Classes in this branch */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-600" />
                    Danh Sách {portalClasses.length} Lớp Học Thuộc {currentConfig.branchName}
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    Tổng: {portalClasses.reduce((acc, c) => acc + c.totalStudents, 0)} Học sinh
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tên Lớp</th>
                        <th className="py-2.5 px-3">Khối / Cấp</th>
                        <th className="py-2.5 px-3">Điểm Trường</th>
                        <th className="py-2.5 px-3">Giáo Viên Chủ Nhiệm</th>
                        <th className="py-2.5 px-3 text-center">Sĩ số</th>
                        <th className="py-2.5 px-3 text-center">Nam / Nữ</th>
                        <th className="py-2.5 px-3 text-center">Dân tộc</th>
                        <th className="py-2.5 px-3 text-center">Hộ nghèo</th>
                        <th className="py-2.5 px-3 text-center">Sheet Lớp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {portalClasses.map((cls) => (
                        <tr key={cls.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-extrabold text-red-700">Lớp {cls.name}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                cls.level === 'TH' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              Khối {cls.grade} ({cls.level})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">📍 {cls.campusName}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {cls.homeroomTeacherName || 'Chưa phân công'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">{cls.totalStudents}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">
                            {cls.maleStudents} / {cls.femaleStudents}
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium text-amber-700">{cls.ethnicStudents}</td>
                          <td className="py-2.5 px-3 text-center text-rose-700 font-medium">{cls.poorStudents}</td>
                          <td className="py-2.5 px-3 text-center">
                            <a
                              href={cls.sheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Sheet</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: GV NGHỈ PHÉP & ĐỔI TIẾT */}
          {portalSubTab === 'teacher_leaves' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                    Danh Sách Giáo Viên Nghỉ Phép & Đổi Tiết Đã Được BGH Phê Duyệt
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hiển thị công khai theo quy định của nhà trường để phụ huynh và đồng nghiệp tiện theo dõi.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {portalTeacherLeaves.length + portalSubstitutes.length} đơn công khai
                </span>
              </div>

              {portalTeacherLeaves.length === 0 && portalSubstitutes.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Không có giáo viên nào xin nghỉ trong tuần này</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portalTeacherLeaves.map((l) => (
                    <div key={l.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                          Nghỉ Phép ({l.leaveType})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Đã Duyệt
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{l.userName}</h4>
                      <p className="text-xs text-slate-600">
                        Thời gian: <strong>{l.startDate}</strong> đến <strong>{l.endDate}</strong> ({l.totalDays} ngày)
                      </p>
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">Lý do: {l.reason}</p>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between border-t pt-2">
                        <span>Điểm trường: {l.campusName}</span>
                        <span>Người duyệt: {l.approvedBy}</span>
                      </div>
                    </div>
                  ))}

                  {portalSubstitutes.map((s) => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                          {s.mode === 'DOI_TIET_VOI_GV'
                            ? 'Đổi Tiết Với GV'
                            : s.mode === 'TU_DAY_BU'
                            ? 'Tự Dạy Bù'
                            : 'BGH Phân Công Dạy Thay'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Đã Duyệt
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {s.requesterName} ({s.subjectA} - Lớp {s.classNameA})
                      </h4>
                      <p className="text-xs text-slate-600">
                        Tiết nghỉ: {s.periodA} {s.sessionA}, {s.dayOfWeekA} ({s.dateA})
                      </p>
                      {s.substituteTeacherName && (
                        <p className="text-xs text-emerald-700 font-semibold">
                          GV nhận dạy thay: {s.substituteTeacherName} (Đã xác nhận)
                        </p>
                      )}
                      {s.makeupDate && (
                        <p className="text-xs text-blue-700 font-semibold">
                          Lịch tự dạy bù: {s.makeupDate} ({s.makeupSession}, {s.makeupPeriod})
                        </p>
                      )}
                      <div className="text-[10px] text-slate-400 flex items-center justify-between border-t pt-2">
                        <span>Lý do: {s.reasonA}</span>
                        <span>Người duyệt: {s.approvedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 3: HS NGHỈ PHÉP */}
          {portalStudentAbsences.length > 0 ? (
            portalSubTab === 'student_leaves' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                    Danh Sách Học Sinh Xin Nghỉ Học Có Phép Đã Được PHT Phê Duyệt
                  </h3>
                  <span className="text-xs font-bold text-slate-500">{portalStudentAbsences.length} học sinh</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Học sinh</th>
                        <th className="py-2.5 px-3">Lớp</th>
                        <th className="py-2.5 px-3">Điểm Trường</th>
                        <th className="py-2.5 px-3">Ngày Nghỉ</th>
                        <th className="py-2.5 px-3">Buổi / Tiết</th>
                        <th className="py-2.5 px-3">Lý do xin nghỉ</th>
                        <th className="py-2.5 px-3">Người nộp đơn</th>
                        <th className="py-2.5 px-3">PHT Phê Duyệt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {portalStudentAbsences.map((ab) => (
                        <tr key={ab.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{ab.studentName}</td>
                          <td className="py-2.5 px-3 font-extrabold text-red-700">{ab.className}</td>
                          <td className="py-2.5 px-3 text-slate-600">📍 {ab.campusName}</td>
                          <td className="py-2.5 px-3 font-semibold">{ab.absenceDate} ({ab.dayOfWeek})</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                              {ab.session} - {ab.periods}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{ab.reason}</td>
                          <td className="py-2.5 px-3 text-slate-500">{ab.requestedBy}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">
                            ✓ {ab.approvedBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            portalSubTab === 'student_leaves' && (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Không có đơn xin nghỉ phép của học sinh cần hiển thị</p>
              </div>
            )
          )}

          {/* SUB-TAB 4: ĐIỂM DANH CHUYÊN CẦN */}
          {portalSubTab === 'attendance' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                    Báo Cáo Điểm Danh Chuyên Cần Trong Ngày (GVCN Báo Cáo • PHT Đã Phê Duyệt)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống tự động phát cảnh báo vắng mặt đến phụ huynh học sinh qua email / tin nhắn.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {portalAttendances.length} phiên điểm danh
                </span>
              </div>

              {portalAttendances.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Chưa có báo cáo điểm danh mới trong ngày</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portalAttendances.map((att) => (
                    <div key={att.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-red-700 text-white font-black text-xs">
                          Lớp {att.className}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {att.approvalStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-500 block">Sĩ số</span>
                          <span className="font-extrabold text-slate-800 text-sm">{att.totalStudents}</span>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-xl">
                          <span className="text-[10px] text-emerald-700 block">Có mặt</span>
                          <span className="font-extrabold text-emerald-800 text-sm">{att.presentCount}</span>
                        </div>
                        <div className="bg-rose-50 p-2 rounded-xl">
                          <span className="text-[10px] text-rose-700 block">Vắng</span>
                          <span className="font-extrabold text-rose-800 text-sm">
                            {att.absentWithPermission + att.absentWithoutPermission}
                          </span>
                        </div>
                      </div>

                      {att.absentDetails && att.absentDetails.length > 0 && (
                        <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-xs space-y-1">
                          <span className="font-bold text-rose-900 block text-[11px]">Danh sách HS vắng:</span>
                          {att.absentDetails.map((abs, i) => (
                            <div key={i} className="flex items-center justify-between text-slate-700">
                              <span>
                                <strong>{abs.studentName}</strong>: {abs.reason}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-semibold">
                                {abs.parentContacted ? '✓ Đã báo PH' : 'Chưa báo PH'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 flex items-center justify-between border-t pt-2">
                        <span>GVCN: {att.gvcnName}</span>
                        <span>Duyệt: {att.approvedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 5: THI ĐUA, KHEN THƯỞNG & NHẮC NHỞ */}
          {portalSubTab === 'emulation' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột Khen Thưởng */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Khen Thưởng & Tuyên Dương ({portalCommendations.length})
                </h4>
                {portalCommendations.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border text-center text-xs text-slate-500">
                    Chưa có quyết định khen thưởng nào thuộc phân hiệu này.
                  </div>
                ) : (
                  portalCommendations.map((com) => (
                    <div key={com.id} className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                          {com.rewardType}
                        </span>
                        <span className="text-xs font-black text-amber-600">
                          {com.rewardAmount ? `${com.rewardAmount.toLocaleString('vi-VN')} đ` : ''}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-xs">{com.title}</h5>
                      <p className="text-xs text-slate-600">{com.description}</p>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between border-t pt-2">
                        <span>Người nhận: <strong>{com.targetName}</strong></span>
                        <span>Ngày: {com.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cột Nhắc Nhở */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Nhắc Nhở Kỷ Cương & Nề Nếp ({portalReminders.length})
                </h4>
                {portalReminders.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border text-center text-xs text-slate-500">
                    Không có trường hợp nhắc nhở nào thuộc phân hiệu này.
                  </div>
                ) : (
                  portalReminders.map((rem) => (
                    <div key={rem.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {rem.reason}
                        </span>
                        <span className="text-[10px] text-slate-400">Tuần {rem.week}</span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-xs">{rem.title}</h5>
                      <p className="text-xs text-slate-600">{rem.content}</p>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between border-t pt-2">
                        <span>Đối tượng: <strong>{rem.targetName}</strong></span>
                        <span>Nhắc nhở bởi: {rem.remindedBy}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
