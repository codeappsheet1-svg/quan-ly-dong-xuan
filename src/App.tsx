/**
 * Hệ thống Quản lý nội bộ trường học
 * Trường Tiểu học & Trung học Cơ sở Đồng Xuân - Xã Đồng Xuân - Tỉnh Phú Yên
 * Tác giả: Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng
 * Mọi sao chép đều phải xin phép.
 */

import React, { useState, useEffect } from 'react';
import { UserAccount, SchoolClass, LeaveRequest, SubstituteTeachingRequest, StudentAbsenceRequest, StudentTransferReport, FacilityRepairProposal } from './types/school';
import { storageService } from './services/storageService';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { ProfileSheetAtoAZ } from './components/ProfileSheetAtoAZ';
import { StaffManagement } from './components/StaffManagement';
import { EmulationRewards } from './components/EmulationRewards';
import { ClassAndStudents } from './components/ClassAndStudents';
import { LeaveAndSubstitute } from './components/LeaveAndSubstitute';
import { StudentAbsenceAndTransfer } from './components/StudentAbsenceAndTransfer';
import { TimetableSchedule } from './components/TimetableSchedule';
import { FacilityRepair } from './components/FacilityRepair';
import { GoogleAppsScriptCenter } from './components/GoogleAppsScriptCenter';
import { BranchPortals } from './components/BranchPortals';
import { PublicNoticesAndHonors } from './components/PublicNoticesAndHonors';
import { ElectronicGradebook } from './components/ElectronicGradebook';
import { FinanceManagement } from './components/FinanceManagement';
import { SchoolHealthCenter } from './components/SchoolHealthCenter';
import { OfficialDispatches } from './components/OfficialDispatches';
import { RegistrationModal } from './components/RegistrationModal';
import { AuthModal } from './components/AuthModal';
import { YearTransitionModal } from './components/YearTransitionModal';
import { FeedbackHub } from './components/FeedbackHub';
import { PrimaryAcademicHub } from './components/PrimaryAcademicHub';
import { SecondaryAcademicHub } from './components/SecondaryAcademicHub';
import { SchoolPublicPortal } from './components/SchoolPublicPortal';
import { InternalExpenditureBook } from './components/InternalExpenditureBook';
import { PrincipalCashbook } from './components/PrincipalCashbook';
import { SystemAuditLogViewer } from './components/SystemAuditLogViewer';
import { WorkWorkflowManager } from './components/WorkWorkflowManager';
import { PersonalDashboard } from './components/PersonalDashboard';
import { MultiCriteriaStatistics } from './components/MultiCriteriaStatistics';
import { Calendar, Sparkles, Layers, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => storageService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // School Year & CSDL isolation state (Requirement 1 & 2)
  const [activeSchoolYear, setActiveSchoolYear] = useState(() => storageService.getActiveSchoolYear());
  const [allSchoolYears, setAllSchoolYears] = useState(() => storageService.getSchoolYears());
  const [isYearTransitionOpen, setIsYearTransitionOpen] = useState(false);

  // Core datasets per school year
  const [allStaff, setAllStaff] = useState(() => storageService.getStaffList());
  const [classes, setClasses] = useState(() => storageService.getClasses(activeSchoolYear));
  const [leaves, setLeaves] = useState(() => storageService.getLeaves(activeSchoolYear));
  const [substitutes, setSubstitutes] = useState(() => storageService.getSubstitutes(activeSchoolYear));
  const [studentAbsences, setStudentAbsences] = useState(() => storageService.getStudentAbsences(activeSchoolYear));
  const [studentTransfers, setStudentTransfers] = useState(() => storageService.getStudentTransfers(activeSchoolYear));
  const [facilities, setFacilities] = useState(() => storageService.getFacilities());

  // Viewing someone else's Sheet A-AZ (for Principal or Admin)
  const [targetStaffForAZ, setTargetStaffForAZ] = useState<UserAccount | null>(null);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const refreshAllData = () => {
    setAllStaff(storageService.getStaffList());
    setClasses(storageService.getClasses(activeSchoolYear));
    setLeaves(storageService.getLeaves(activeSchoolYear));
    setSubstitutes(storageService.getSubstitutes(activeSchoolYear));
    setStudentAbsences(storageService.getStudentAbsences(activeSchoolYear));
    setStudentTransfers(storageService.getStudentTransfers(activeSchoolYear));
    setFacilities(storageService.getFacilities());
    setCurrentUser(storageService.getCurrentUser());
  };

  const handleChangeSchoolYear = (newYear: string) => {
    storageService.setActiveSchoolYear(newYear);
    setActiveSchoolYear(newYear);
    setClasses(storageService.getClasses(newYear));
    setLeaves(storageService.getLeaves(newYear));
    setSubstitutes(storageService.getSubstitutes(newYear));
    setStudentAbsences(storageService.getStudentAbsences(newYear));
    setStudentTransfers(storageService.getStudentTransfers(newYear));
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const handleSwitchUser = (userId: string) => {
    const staffList = storageService.getStaffList();
    const found = staffList.find((s) => s.account.id === userId);
    if (found) {
      storageService.setCurrentUser(found.account);
      setCurrentUser(found.account);
      setTargetStaffForAZ(null);
      storageService.addSyncLog('Chuyển vai người dùng', `Đang xem với tư cách: ${found.account.name}`);
    }
  };

  const handleViewStaffAZ = (account: UserAccount) => {
    setTargetStaffForAZ(account);
    setActiveTab('profile_az');
  };

  const pendingLeavesCount = leaves.filter((l) => l.status === 'Chờ duyệt').length + substitutes.filter((s) => s.status === 'Chờ duyệt').length;
  const pendingRepairsCount = facilities.filter((f) => f.approvalStatus === 'Chờ HT duyệt').length;
  const pendingAbsencesCount = studentAbsences.filter((a) => a.status === 'Chờ PHT duyệt').length;
  const allFeedbacks = storageService.getFeedbacks(activeSchoolYear);
  const pendingFeedbackCount = currentUser?.role === 'HT'
    ? allFeedbacks.filter((f) => f.status === 'CHO_HT_XEM' || f.status === 'CHO_HT_DUYET').length
    : allFeedbacks.filter((f) => f.assignedToId === currentUser?.id && f.status === 'DA_CHUYEN_XU_LY').length;
  const pendingArticlesCount = currentUser?.role === 'HT'
    ? storageService.getPublicArticles(activeSchoolYear).filter((a) => a.status === 'CHO_HT_DUYET').length
    : 0;
  const pendingExpensesCount = currentUser?.role === 'HT'
    ? storageService.getInternalExpenses(activeSchoolYear).filter((e) => e.approvalStatus === 'CHO_HT_DUYET').length
    : 0;
  const pendingWorkflowsCount = currentUser?.role === 'HT' || currentUser?.role === 'PHT' || currentUser?.role === 'GV_TIN_HOC'
    ? storageService.getWorkflows(activeSchoolYear).filter((w) => w.status === 'B1_CHO_HT_DUYET' || w.status === 'B4_CHO_HT_DANH_GIA').length
    : storageService.getWorkflows(activeSchoolYear).filter((w) => w.creatorId === currentUser?.id && (w.status === 'B2_HT_DA_DUYET' || w.status === 'B5_HT_DA_DANH_GIA')).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800 font-sans selection:bg-red-700 selection:text-white">
      {/* Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab !== 'profile_az') {
            setTargetStaffForAZ(null);
          }
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenRegister={() => setIsRegisterModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        allStaff={allStaff}
        pendingLeavesCount={pendingLeavesCount}
        pendingRepairsCount={pendingRepairsCount}
        pendingAbsencesCount={pendingAbsencesCount}
        pendingFeedbackCount={pendingFeedbackCount}
        pendingArticlesCount={pendingArticlesCount}
        pendingExpensesCount={pendingExpensesCount}
        pendingWorkflowsCount={pendingWorkflowsCount}
        activeSchoolYear={activeSchoolYear}
        allSchoolYears={allSchoolYears}
        onChangeSchoolYear={handleChangeSchoolYear}
        onOpenYearTransition={() => setIsYearTransitionOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB: DASHBOARD CÁ NHÂN */}
        {activeTab === 'personal_dashboard' && (
          <PersonalDashboard
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            classes={classes}
            allStaff={allStaff}
            onSelectTab={setActiveTab}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB 1: DASHBOARD TOÀN TRƯỜNG */}
        {activeTab === 'dashboard' && (
          <Dashboard
            currentUser={currentUser}
            allStaff={allStaff}
            allClasses={classes}
            leaves={leaves}
            substitutes={substitutes}
            facilities={facilities}
            activeSchoolYear={activeSchoolYear}
            onSelectTab={setActiveTab}
            onOpenRegister={() => setIsRegisterModalOpen(true)}
          />
        )}

        {/* TAB: CỔNG THÔNG TIN CÔNG KHAI DÀNH CHO PHHS & HỌC SINH (YÊU CẦU 5) */}
        {activeTab === 'public_portal' && (
          <SchoolPublicPortal
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            allStaff={allStaff}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB: HÒM THƯ GÓP Ý & CÔNG KHAI TRẢ LỜI (YÊU CẦU 4.1 & 4.2) */}
        {activeTab === 'feedback_hub' && (
          <FeedbackHub
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            allStaff={allStaff}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB: CHUYÊN MÔN CẤP TIỂU HỌC (YÊU CẦU 4.3) */}
        {activeTab === 'academic_primary' && (
          <PrimaryAcademicHub
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            allStaff={allStaff}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB: CHUYÊN MÔN CẤP TRUNG HỌC CƠ SỞ - THCS (YÊU CẦU 4.4) */}
        {activeTab === 'academic_secondary' && (
          <SecondaryAcademicHub
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            allStaff={allStaff}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB: 5 TRANG HIỂN THỊ CỔNG THÔNG TIN PHÂN HIỆU & BIẾN ĐỘNG HỌC SINH */}
        {activeTab === 'branch_portals' && (
          <BranchPortals
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            allStaff={allStaff}
            classes={classes}
            leaves={leaves}
            substitutes={substitutes}
            studentAbsences={studentAbsences}
            transfers={studentTransfers}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB: QUY TRÌNH 6 BƯỚC & ĐÁNH GIÁ NHÂN SỰ & BẢO MẬT CSDL */}
        {activeTab === 'work_workflow' && (
          <WorkWorkflowManager
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            allStaff={allStaff}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB: BẢNG TIN NHẮC NHỞ & KHEN THƯỞNG CÔNG KHAI CÓ MINH CHỨNG */}
        {activeTab === 'notices_honors' && (
          <PublicNoticesAndHonors
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            allStaff={allStaff}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB 2: PROFILE SHEET A-AZ */}
        {activeTab === 'profile_az' && (
          <div className="space-y-4">
            {targetStaffForAZ && targetStaffForAZ.id !== currentUser?.id && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs flex items-center justify-between text-amber-900">
                <span>
                  Đang xem và chỉnh sửa hồ sơ 52 Cột (A-AZ) của đồng chí:{' '}
                  <strong>{targetStaffForAZ.name}</strong> ({targetStaffForAZ.position} - {targetStaffForAZ.id})
                </span>
                <button
                  type="button"
                  onClick={() => setTargetStaffForAZ(null)}
                  className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 font-bold rounded-lg text-[11px]"
                >
                  Quay lại hồ sơ của tôi
                </button>
              </div>
            )}
            <ProfileSheetAtoAZ
              user={targetStaffForAZ || currentUser || allStaff[0].account}
              onRefreshData={refreshAllData}
            />
          </div>
        )}

        {/* TAB 3: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <StaffManagement
            currentUser={currentUser}
            allStaff={allStaff}
            onOpenRegister={() => setIsRegisterModalOpen(true)}
            onViewStaffAZ={handleViewStaffAZ}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB: THI ĐUA KHEN THƯỞNG & ĐÁNH GIÁ GIÁO VIÊN */}
        {activeTab === 'emulation' && (
          <EmulationRewards
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            allStaff={allStaff}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB 4: CLASSES & STUDENTS */}
        {activeTab === 'classes' && (
          <ClassAndStudents
            currentUser={currentUser}
            classes={classes}
            allStaff={allStaff}
            activeSchoolYear={activeSchoolYear}
            onRefreshData={refreshAllData}
            onOpenRegister={() => setIsRegisterModalOpen(true)}
          />
        )}

        {/* TAB: THỐNG KÊ ĐA TIÊU CHÍ (HỌC SINH & CB-GV-NV) */}
        {activeTab === 'multi_stats' && (
          <MultiCriteriaStatistics
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            classes={classes}
            allStaff={allStaff}
            onSelectTab={setActiveTab}
          />
        )}

        {/* TAB: QUẢN LÝ SỔ SÁCH & CÔNG VĂN (BỘ NỘI VỤ) */}
        {activeTab === 'dispatches' && (
          <OfficialDispatches
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
          />
        )}

        {/* TAB: SỔ ĐIỂM ĐIỆN TỬ (TIỂU HỌC & THCS) */}
        {activeTab === 'gradebook' && (
          <ElectronicGradebook
            currentUser={currentUser}
            classes={classes}
            activeSchoolYear={activeSchoolYear}
          />
        )}

        {/* TAB: TÀI CHÍNH & HỌC PHÍ */}
        {activeTab === 'finance' && (
          <FinanceManagement
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            classes={classes}
          />
        )}

        {/* TAB: SỔ CHI TIÊU NỘI BỘ (YÊU CẦU 3.1, 3.2, 3.3) */}
        {activeTab === 'internal_expenses' && (
          <InternalExpenditureBook
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
          />
        )}

        {/* TAB: SỔ THU - CHI RIÊNG CỦA HIỆU TRƯỞNG (YÊU CẦU 3.4) */}
        {activeTab === 'principal_cashbook' && (
          <PrincipalCashbook
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
          />
        )}

        {/* TAB: Y TẾ HỌC ĐƯỜNG */}
        {activeTab === 'health' && (
          <SchoolHealthCenter
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            classes={classes}
          />
        )}

        {/* TAB 5: LEAVES & SUBSTITUTES */}
        {activeTab === 'leaves' && (
          <LeaveAndSubstitute
            currentUser={currentUser}
            leaves={leaves}
            substitutes={substitutes}
            allStaff={allStaff}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB 6: STUDENT ABSENCE & TRANSFERS */}
        {activeTab === 'student_leaves' && (
          <StudentAbsenceAndTransfer
            currentUser={currentUser}
            classes={classes}
            absences={studentAbsences}
            transfers={studentTransfers}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB 7: TIMETABLE & BELL SCHEDULE */}
        {activeTab === 'schedule' && (
          <TimetableSchedule
            currentUser={currentUser}
            classes={classes}
            allStaff={allStaff}
          />
        )}

        {/* TAB 8: FACILITIES & REPAIRS */}
        {activeTab === 'facilities' && (
          <FacilityRepair
            currentUser={currentUser}
            facilities={facilities}
            allStaff={allStaff}
            onRefreshData={refreshAllData}
          />
        )}

        {/* TAB 9: GOOGLE APPS SCRIPT CODE & DRIVE INTEGRATION */}
        {activeTab === 'gas_center' && <GoogleAppsScriptCenter />}

        {/* TAB 10: NHẬT KÝ HỆ THỐNG (YÊU CẦU 1) */}
        {activeTab === 'audit_logs' && (
          <SystemAuditLogViewer
            currentUser={currentUser}
            activeSchoolYear={activeSchoolYear}
            onSelectTab={setActiveTab}
          />
        )}
      </main>

      {/* Footer with Mandatory Copyright Notice */}
      <Footer />

      {/* Modals */}
      <YearTransitionModal
        isOpen={isYearTransitionOpen}
        onClose={() => setIsYearTransitionOpen(false)}
        classes={classes}
        currentYear={activeSchoolYear}
        onTransitionComplete={(newYear: string) => {
          setAllSchoolYears(storageService.getSchoolYears());
          handleChangeSchoolYear(newYear);
          refreshAllData();
        }}
      />

      <RegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={refreshAllData}
      />

      <AuthModal
        isOpen={isLoginModalOpen || isChangePasswordModalOpen}
        isChangePasswordOnly={isChangePasswordModalOpen}
        currentUser={currentUser}
        onClose={() => {
          setIsLoginModalOpen(false);
          setIsChangePasswordModalOpen(false);
        }}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          refreshAllData();
        }}
        onPasswordChanged={refreshAllData}
      />
    </div>
  );
}
