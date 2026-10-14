import React, { useState, useMemo } from 'react';
import {
  UserAccount,
  SchoolClass,
  LeaveRequest,
  SubstituteTeachingRequest,
  FacilityRepairProposal,
  Campus,
  SmartAlertItem,
  SchoolEventItem,
  AssignedTask,
  OfficialDispatchIn,
} from '../types/school';
import { BRANCHES_DATA, ALL_CAMPUSES } from '../data/initialData';
import { getPhtAssignedBranch } from '../utils/permissionUtils';
import { storageService } from '../services/storageService';
import {
  Users,
  GraduationCap,
  Building2,
  Calendar,
  Wrench,
  FileCheck2,
  TrendingUp,
  MapPin,
  ShieldAlert,
  ArrowRight,
  School,
  Award,
  BookOpen,
  PieChart,
  Trophy,
  Filter,
  BarChart3,
  DollarSign,
  HeartPulse,
  BellRing,
  Cake,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
  Check,
  Layers,
  ShieldCheck,
  CalendarDays,
  Flame,
  CheckSquare,
  Plus,
  ArrowUpRight,
  CalendarClock,
  AlertCircle,
  Bookmark,
} from 'lucide-react';

interface DashboardProps {
  currentUser: UserAccount | null;
  allStaff: { account: UserAccount; sheetDataAZ: Record<string, string | number | boolean> }[];
  allClasses: SchoolClass[];
  leaves: LeaveRequest[];
  substitutes: SubstituteTeachingRequest[];
  facilities: FacilityRepairProposal[];
  activeSchoolYear?: string;
  onSelectTab: (tab: string) => void;
  onOpenRegister: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  allStaff,
  allClasses,
  leaves,
  substitutes,
  facilities,
  activeSchoolYear = '2026-2027',
  onSelectTab,
  onOpenRegister,
}) => {
  // Official Quota breakdown (Quy mô cơ cấu 137 người theo yêu cầu BGH)
  const htCount = 1;
  const phtCount = 3;
  const gvThcsCount = 36;
  const gvThCount = 76; // Đã tính 1 GV TPT Đội và 6 GV chuyên TH
  const nvCount = 10;
  const bvCount = 9; // Nhân viên hợp đồng, bảo vệ: 9 người
  const gvHdCount = 2; // Giáo viên hợp đồng: 2 người
  const totalStaffCount = htCount + phtCount + gvThcsCount + gvThCount + nvCount + bvCount + gvHdCount; // 137

  const activeClasses = useMemo(() => allClasses.filter((c) => c.status !== 'INACTIVE'), [allClasses]);
  const dynamicTotalStudents = activeClasses.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalStudents = dynamicTotalStudents > 0 ? dynamicTotalStudents : 1289;
  const totalClassesCount = activeClasses.length > 0 ? activeClasses.length : 57;
  const totalCampuses = 12; // 1 Trụ sở VP + 11 Điểm trường học
  const totalBranches = 4; // 1 Trụ sở chính + 3 Phân hiệu

  const pendingLeaves = leaves.filter((l) => l.status === 'Chờ duyệt').length;
  const pendingSubs = substitutes.filter((s) => s.status === 'Chờ duyệt').length;
  const pendingFacilities = facilities.filter((f) => f.approvalStatus === 'Chờ HT duyệt').length;
  const activeRepairs = facilities.filter((f) => f.executionStatus === 'Đang sửa chữa').length;

  // ==========================================
  // MULTI-CRITERIA DASHBOARD CONTROLS (Yêu cầu 1, 4)
  // ==========================================
  type StatCategory = 'students' | 'staff' | 'leaves' | 'rewards_reminders' | 'finance' | 'health' | 'smart_alerts' | 'bi_dashboards';
  const [activeStatCategory, setActiveStatCategory] = useState<StatCategory>('students');

  // Filter criteria states
  const [filterBranch, setFilterBranch] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'TH' | 'THCS'>('ALL');
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);

  // Smart Alerts & BI Dashboards states (Requirement 4)
  const [smartAlertsList, setSmartAlertsList] = useState<SmartAlertItem[]>(() =>
    storageService.getSmartAlerts(activeSchoolYear)
  );
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('ALL');
  const biData = useMemo(() => storageService.getBIDashboardsData(activeSchoolYear), [activeSchoolYear]);

  const handleDismissAlert = (alertId: string) => {
    storageService.dismissSmartAlert(alertId);
    setSmartAlertsList(storageService.getSmartAlerts(activeSchoolYear));
  };

  const unresolvedAlertsCount = useMemo(
    () => smartAlertsList.filter((a) => !a.isResolved).length,
    [smartAlertsList]
  );
  const criticalAlertsCount = useMemo(
    () => smartAlertsList.filter((a) => a.severity === 'CRITICAL' && !a.isResolved).length,
    [smartAlertsList]
  );

  // External datasets from storage for statistics
  const publicReminders = useMemo(() => storageService.getPublicReminders(activeSchoolYear), [activeSchoolYear]);
  const publicCommendations = useMemo(() => storageService.getPublicCommendations(activeSchoolYear), [activeSchoolYear]);
  const birthdays = useMemo(() => storageService.getStaffBirthdays(), []);
  const feePayments = useMemo(() => storageService.getStudentFeePayments(activeSchoolYear), [activeSchoolYear]);
  const healthRecords = useMemo(() => storageService.getHealthRecords(activeSchoolYear), [activeSchoolYear]);
  const studentTransfers = useMemo(() => storageService.getStudentTransfers(activeSchoolYear), [activeSchoolYear]);
  const studentAbsences = useMemo(() => storageService.getStudentAbsences(activeSchoolYear), [activeSchoolYear]);

  // ==========================================
  // SỰ KIỆN SẮP TỚI & NHIỆM VỤ KHẨN CẤP (YÊU CẦU 2)
  // ==========================================
  const [eventsList, setEventsList] = useState<SchoolEventItem[]>(() =>
    storageService.getSchoolEvents(activeSchoolYear)
  );
  const assignedTasks = useMemo(() => storageService.getAssignedTasks(activeSchoolYear), [activeSchoolYear]);
  const dispatchesIn = useMemo(() => storageService.getDispatchesIn(activeSchoolYear), [activeSchoolYear]);
  const feedbacks = useMemo(() => storageService.getFeedbacks(activeSchoolYear), [activeSchoolYear]);
  const [summaryFilter, setSummaryFilter] = useState<'ALL' | 'URGENT' | 'EVENTS' | 'BIRTHDAYS'>('ALL');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    time: '07:30 - 11:30',
    location: 'Hội trường Trụ sở chính Đồng Xuân',
    category: 'CHUYEN_MON' as SchoolEventItem['category'],
    categoryLabel: 'Chuyên môn & Hội giảng',
    targetAudience: 'Toàn thể giáo viên và nhân viên',
    organizer: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Ban Giám hiệu',
    description: '',
    isImportant: true,
  });

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);
  const formattedCurrentDate = useMemo(() => {
    return today.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [today]);

  // Urgent Tasks based on current date
  const urgentTasksList = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'TASK' | 'LEAVE' | 'SUBSTITUTE' | 'FACILITY' | 'DISPATCH' | 'ALERT';
      title: string;
      subtitle: string;
      badge: string;
      priority: 'KHAN_CAP' | 'CAO' | 'TRUNG_BINH';
      dueDate?: string;
      daysRemaining?: number;
      targetTab: string;
      actionText: string;
    }> = [];

    // 1. Assigned Tasks needing action
    assignedTasks.forEach((t) => {
      if (t.executionStatus === 'HOAN_THANH') return;
      const isPendingConfirm = t.executionStatus === 'CHO_XAC_NHAN';
      const isHighPriority = t.priority === 'KHAN_CAP' || t.priority === 'CAO';

      let daysRemaining = 999;
      if (t.deadline) {
        const diff = new Date(t.deadline).getTime() - today.getTime();
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
      const isOverdue = daysRemaining < 0;

      if (isPendingConfirm || isHighPriority || daysRemaining <= 7 || isOverdue) {
        list.push({
          id: t.id,
          type: 'TASK',
          title: t.taskTitle,
          subtitle: `Phụ trách: ${t.targetStaffName} (${t.targetStaffRole}) • Điểm trường: ${t.targetCampusName}`,
          badge: isPendingConfirm
            ? 'Đã nộp minh chứng - Chờ duyệt & chấm điểm'
            : isOverdue
            ? `Đã quá hạn ${Math.abs(daysRemaining)} ngày`
            : daysRemaining === 0
            ? 'Hạn chót hôm nay'
            : `Còn ${daysRemaining} ngày để hoàn thành`,
          priority: isOverdue || t.priority === 'KHAN_CAP' ? 'KHAN_CAP' : 'CAO',
          dueDate: t.deadline,
          daysRemaining,
          targetTab: 'competition',
          actionText: isPendingConfirm ? 'Duyệt Minh Chứng' : 'Xem Tiến Độ',
        });
      }
    });

    // 2. Pending leaves
    leaves.filter((l) => l.status === 'Chờ duyệt').forEach((l) => {
      list.push({
        id: l.id,
        type: 'LEAVE',
        title: `Đơn xin nghỉ phép: ${l.userName}`,
        subtitle: `Lý do: ${l.reason} • Thời gian: ${l.startDate} đến ${l.endDate}`,
        badge: 'Chờ Ban Giám hiệu phê duyệt',
        priority: 'CAO',
        dueDate: l.startDate,
        targetTab: 'leaves',
        actionText: 'Duyệt Đơn',
      });
    });

    // 3. Pending substitute teaching requests
    substitutes.filter((s) => s.status === 'Chờ duyệt').forEach((s) => {
      list.push({
        id: s.id,
        type: 'SUBSTITUTE',
        title: `Đổi tiết / Dạy thay: ${s.requesterName}`,
        subtitle: `Lớp ${s.classNameA} • ${s.periodA} ngày ${s.dateA} (${s.subjectA})`,
        badge: 'Chờ phân công / duyệt lịch',
        priority: 'CAO',
        dueDate: s.dateA,
        targetTab: 'leaves',
        actionText: 'Xử Lý Đổi Tiết',
      });
    });

    // 4. Facilities needing approval or urgent repair
    facilities.filter((f) => f.approvalStatus === 'Chờ HT duyệt' || f.urgency === 'Khẩn cấp').forEach((f) => {
      list.push({
        id: f.id,
        type: 'FACILITY',
        title: `Sửa chữa CSVC: ${f.title}`,
        subtitle: `Điểm trường: ${f.campusName} • Hạng mục: ${f.category} • Dự toán: ${f.estimatedCost.toLocaleString()} đ`,
        badge: f.urgency === 'Khẩn cấp' ? 'Khẩn cấp - Cần giải quyết ngay' : 'Chờ HT duyệt kinh phí',
        priority: 'KHAN_CAP',
        targetTab: 'facilities',
        actionText: 'Xem Đề Xuất',
      });
    });

    // 5. Inbound dispatches with high urgency
    dispatchesIn.filter((d) => (d.urgency === 'Khẩn' || d.urgency === 'Thượng khẩn' || d.urgency === 'Hỏa tốc') && d.processingStatus !== 'Đã hoàn thành').forEach((d) => {
      list.push({
        id: d.id,
        type: 'DISPATCH',
        title: `Công văn đến khẩn: ${d.subject}`,
        subtitle: `Số đến: ${d.arrivalNumber} • Nơi ban hành: ${d.issuingAuthority} • Số gốc: ${d.originalCode}`,
        badge: `Độ khẩn: ${d.urgency} • Hạn xử lý: ${d.deadline || 'Trong ngày'}`,
        priority: 'KHAN_CAP',
        dueDate: d.deadline,
        targetTab: 'documents',
        actionText: 'Bút Phê Chỉ Đạo',
      });
    });

    // 6. Feedbacks needing HT attention or Assigned staff response
    if (currentUser?.role === 'HT') {
      feedbacks.filter((f) => f.status === 'CHO_HT_XEM' || f.status === 'CHO_HT_DUYET').forEach((f) => {
        list.push({
          id: f.id,
          type: 'ALERT',
          title: `Hòm thư góp ý: ${f.title}`,
          subtitle: `Người gửi: ${f.senderName} (${f.categoryLabel})`,
          badge: f.status === 'CHO_HT_XEM' ? 'Ý kiến mới - Chờ HT xem & chuyển' : 'Đã có câu trả lời - Chờ HT duyệt',
          priority: 'KHAN_CAP',
          targetTab: 'feedback_hub',
          actionText: 'Xử Lý Góp Ý',
        });
      });
    } else if (currentUser) {
      feedbacks.filter((f) => f.assignedToId === currentUser.id && f.status === 'DA_CHUYEN_XU_LY').forEach((f) => {
        list.push({
          id: f.id,
          type: 'ALERT',
          title: `Ý kiến HT giao trả lời: ${f.title}`,
          subtitle: `Chỉ đạo của HT: ${f.assignedNote || 'Khẩn trương giải trình'}`,
          badge: 'Nhiệm vụ được HT phân công',
          priority: 'CAO',
          targetTab: 'feedback_hub',
          actionText: 'Soạn Trả Lời',
        });
      });
    }

    return list;
  }, [assignedTasks, leaves, substitutes, facilities, dispatchesIn, feedbacks, currentUser, today]);

  // Upcoming School Events based on current date
  const upcomingEventsList = useMemo(() => {
    return eventsList
      .map((ev) => {
        const diff = new Date(ev.startDate).getTime() - today.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return {
          ...ev,
          daysRemaining: days,
          isToday: days === 0,
          isPast: days < 0,
        };
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [eventsList, today]);

  // Upcoming Birthdays this month
  const upcomingBirthdaysList = useMemo(() => {
    const curMonth = today.getMonth() + 1;
    const curDay = today.getDate();
    return birthdays
      .filter((b) => b.birthMonth === curMonth)
      .map((b) => {
        const daysUntil = b.birthDay - curDay;
        return {
          ...b,
          daysUntil,
          isToday: daysUntil === 0,
        };
      })
      .sort((a, b) => a.birthDay - b.birthDay);
  }, [birthdays, today]);

  const handleCreateNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.title.trim()) return;

    storageService.addSchoolEvent({
      ...newEventData,
      title: newEventData.title.trim(),
      schoolYear: activeSchoolYear,
      status: 'UPCOMING',
    }, activeSchoolYear);

    setEventsList(storageService.getSchoolEvents(activeSchoolYear));
    setShowAddEventModal(false);
    setNewEventData({
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      time: '07:30 - 11:30',
      location: 'Hội trường Trụ sở chính Đồng Xuân',
      category: 'CHUYEN_MON',
      categoryLabel: 'Chuyên môn & Hội giảng',
      targetAudience: 'Toàn thể giáo viên và nhân viên',
      organizer: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Ban Giám hiệu',
      description: '',
      isImportant: true,
    });
  };

  // Compute filtered classes
  const filteredClasses = useMemo(() => {
    return activeClasses.filter((c) => {
      if (filterBranch !== 'ALL' && c.branchName !== filterBranch) return false;
      if (filterLevel !== 'ALL' && c.level !== filterLevel) return false;
      if (filterGrade !== 'ALL' && !c.name.startsWith(filterGrade)) return false;
      return true;
    });
  }, [activeClasses, filterBranch, filterLevel, filterGrade]);

  // Compute student stats
  const studentStats = useMemo(() => {
    const totalSelectedStudents = filteredClasses.reduce((sum, c) => sum + c.totalStudents, 0);
    const maleEst = Math.round(totalSelectedStudents * 0.52);
    const femaleEst = totalSelectedStudents - maleEst;
    const poorEst = Math.round(totalSelectedStudents * 0.14);
    const nearPoorEst = Math.round(totalSelectedStudents * 0.08);
    const disabilityEst = Math.round(totalSelectedStudents * 0.015);

    return {
      total: totalSelectedStudents,
      male: maleEst,
      female: femaleEst,
      poor: poorEst,
      nearPoor: nearPoorEst,
      disability: disabilityEst,
      normal: totalSelectedStudents - (poorEst + nearPoorEst + disabilityEst),
    };
  }, [filteredClasses]);

  // Compute leave stats (4 options)
  const leaveStats = useMemo(() => {
    const relevantSubs = substitutes.filter((s) => {
      if (filterBranch !== 'ALL' && s.branchNameA !== filterBranch) return false;
      return true;
    });

    const opt1 = relevantSubs.filter((s) => s.mode === 'DOI_TIET_VOI_GV').length;
    const opt2 = relevantSubs.filter((s) => s.mode === 'TU_DAY_BU').length;
    const opt3 = relevantSubs.filter((s) => s.mode === 'NHO_BGH_PHAN_CONG').length;
    const opt4 = relevantSubs.filter((s) => (s as any).mode === 'CHO_HS_NGHI').length;
    const approved = leaves.filter((l) => l.status === 'Đã phê duyệt').length + substitutes.filter((s) => s.status === 'Đã phê duyệt').length;
    const pending = leaves.filter((l) => l.status === 'Chờ duyệt').length + substitutes.filter((s) => s.status === 'Chờ duyệt').length;

    return { total: relevantSubs.length + leaves.length, opt1, opt2, opt3, opt4, approved, pending };
  }, [substitutes, leaves, filterBranch]);

  // Compute Finance stats
  const financeStats = useMemo(() => {
    const filteredPayments = feePayments.filter((p) => {
      if (filterBranch !== 'ALL' && p.branchName !== filterBranch) return false;
      return true;
    });
    const totalExpected = filteredPayments.reduce((s, p) => s + p.amountDue, 0);
    const totalCollected = filteredPayments.reduce((s, p) => s + p.amountPaid, 0);
    const totalRemaining = filteredPayments.reduce((s, p) => s + p.remainingDebt, 0);
    const paidCount = filteredPayments.filter((p) => p.status === 'Đã nộp đủ').length;
    const debtCount = filteredPayments.filter((p) => p.status === 'Chưa nộp' || p.status === 'Nộp một phần').length;

    return { totalExpected, totalCollected, totalRemaining, paidCount, debtCount, totalRecs: filteredPayments.length };
  }, [feePayments, filterBranch]);

  // Compute Health stats
  const healthStats = useMemo(() => {
    const filteredH = healthRecords.filter((h) => {
      if (filterBranch !== 'ALL' && h.branchName !== filterBranch) return false;
      return true;
    });
    const goodVision = filteredH.filter((h) => h.visionLeft === '10/10' && h.visionRight === '10/10').length;
    const refractiveError = filteredH.filter((h) => h.visionLeft !== '10/10' || h.visionRight !== '10/10').length;
    const normalDental = filteredH.filter((h) => h.dentalHealth === 'Bình thường').length;
    const cavityDental = filteredH.filter((h) => h.dentalHealth !== 'Bình thường').length;
    const normalSpine = filteredH.filter((h) => h.spineHealth === 'Bình thường').length;

    return {
      total: filteredH.length,
      goodVision,
      refractiveError,
      normalDental,
      cavityDental,
      normalSpine,
    };
  }, [healthRecords, filterBranch]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-red-800 via-rose-800 to-red-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold text-amber-200 border border-white/20">
              <School className="w-3.5 h-3.5" />
              <span>Năm học {activeSchoolYear} • Thôn Long Châu, Xã Đồng Xuân, Tỉnh Đắk Lắk</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Bảng Điều Hành Trung Tâm Trường TH & THCS Đồng Xuân
            </h2>
            <p className="text-rose-100 text-xs sm:text-sm leading-relaxed">
              Kính chào <strong>{currentUser?.name || 'Thầy Hiệu trưởng'}</strong>! Quản lý chuẩn hóa{' '}
              <strong className="text-amber-300">137 cán bộ GV-NV</strong>,{' '}
              <strong className="text-amber-300">{totalClassesCount} lớp học</strong> và{' '}
              <strong className="text-amber-300">{totalStudents.toLocaleString()} học sinh</strong> phân bổ trên 1 Trụ sở chính & 3 Phân hiệu (11 điểm trường học).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onSelectTab('public_portal')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <span>🌐</span>
              <span>Cổng TT & Hoạt Động PHHS</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('feedback_hub')}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/20 shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <span>📬</span>
              <span>Hòm Thư Góp Ý</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('academic_primary')}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/20 shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <span>🌱</span>
              <span>Chuyên Môn Tiểu Học</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('academic_secondary')}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/20 shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <span>🔬</span>
              <span>Chuyên Môn THCS</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('branch_portals')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-slate-200" />
              <span>4 Trang Hiển Thị</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('gradebook')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Sổ Điểm Điện Tử</span>
            </button>
          </div>
        </div>

        {/* PHT Assigned Branch Notice */}
        {currentUser?.role === 'PHT' && (() => {
          const assignedBranch = getPhtAssignedBranch(currentUser);
          return (
            <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-amber-200">
              <span className="flex items-center gap-1.5 font-bold">
                <School className="w-4 h-4 text-amber-300" />
                <span>
                  Phân công nhiệm vụ: Thầy {currentUser.name} phụ trách phê duyệt đơn của Cán bộ, GV và Học sinh thuộc <strong>Phân hiệu {assignedBranch}</strong>.
                </span>
              </span>
              <button
                type="button"
                onClick={() => onSelectTab('student_leaves')}
                className="underline hover:text-white text-[11px]"
              >
                Xem đơn HS phân hiệu &rarr;
              </button>
            </div>
          );
        })()}
      </div>

      {/* High-priority AI/Rules Smart Alert Banner (Requirement 4) */}
      {criticalAlertsCount > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-rose-950 text-xs sm:text-sm">
                  CẢNH BÁO TỰ ĐỘNG HỆ THỐNG (AI & RULES ENGINE)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px]">
                  {criticalAlertsCount} cảnh báo khẩn cấp
                </span>
              </div>
              <p className="text-xs text-rose-900 mt-0.5">
                Phát hiện lớp học quá tải chỉ tiêu sĩ số, giáo viên chưa hoàn thành sổ sách/điểm danh, hoặc học sinh có nguy cơ sụt giảm kết quả học tập đột ngột.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveStatCategory('smart_alerts')}
            className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow transition flex-shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Xem Cảnh Báo ({unresolvedAlertsCount}) &rarr;</span>
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Staff */}
        <div
          onClick={() => onSelectTab('staff')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-red-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Nhân Sự</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-700 group-hover:bg-red-700 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStaffCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Đủ 137 hồ sơ A-AZ</div>
        </div>

        {/* Classes */}
        <div
          onClick={() => onSelectTab('classes')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Lớp Học</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalClassesCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Đã gắn 57 GVCN</div>
        </div>

        {/* Students */}
        <div
          onClick={() => onSelectTab('classes')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Học Sinh</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents.toLocaleString('vi-VN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">11 điểm trường học</div>
        </div>

        {/* Campuses */}
        <div
          onClick={() => onSelectTab('branch_portals')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Trụ Sở & Phân Hiệu</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-700 group-hover:text-white transition">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">1 + 3</div>
          <div className="text-[11px] text-slate-500 mt-1">1 VP + 3 Phân hiệu</div>
        </div>

        {/* Pending Leaves */}
        <div
          onClick={() => onSelectTab('leaves')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Duyệt Nghỉ/Dạy</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{pendingLeaves + pendingSubs}</div>
          <div className="text-[11px] text-slate-500 mt-1">Chờ HT/PHT duyệt</div>
        </div>

        {/* Repairs */}
        <div
          onClick={() => onSelectTab('facilities')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sửa Chữa CSVC</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-700 group-hover:bg-orange-700 group-hover:text-white transition">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-700">{pendingFacilities + activeRepairs}</div>
          <div className="text-[11px] text-slate-500 mt-1">{activeRepairs} ca đang làm</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUMMARY SECTION: UPCOMING EVENTS & URGENT TASKS (YÊU CẦU 2 CỦA USER) */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-800 text-[11px] font-bold border border-red-200 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-red-600" />
                <span>Thời gian thực • {formattedCurrentDate}</span>
              </span>
              {urgentTasksList.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black animate-pulse">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{urgentTasksList.length} việc cần xử lý ngay</span>
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-red-700" />
              <span>Lịch Sự Kiện Nhà Trường & Nhiệm Vụ Khẩn Cấp</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống tự động tổng hợp các đầu việc khẩn cấp, hồ sơ chờ phê duyệt và sự kiện trọng tâm theo ngày hiện tại ({todayStr}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setSummaryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  summaryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({urgentTasksList.length + upcomingEventsList.length})
              </button>
              <button
                type="button"
                onClick={() => setSummaryFilter('URGENT')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  summaryFilter === 'URGENT' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Nhiệm vụ khẩn ({urgentTasksList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSummaryFilter('EVENTS')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  summaryFilter === 'EVENTS' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Sự kiện ({upcomingEventsList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSummaryFilter('BIRTHDAYS')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  summaryFilter === 'BIRTHDAYS' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <Cake className="w-3.5 h-3.5" />
                <span>Sinh nhật ({upcomingBirthdaysList.length})</span>
              </button>
            </div>

            {(currentUser?.role === 'HT' || currentUser?.role === 'PHT' || currentUser?.role === 'GV_TIN_HOC') && (
              <button
                type="button"
                onClick={() => setShowAddEventModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow transition flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Sự Kiện</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Highlights Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-rose-800 uppercase">Nhiệm Vụ Cần Xử Lý</div>
              <div className="text-xl font-black text-rose-950 mt-0.5">{urgentTasksList.length}</div>
              <div className="text-[10px] text-rose-700">Khẩn cấp & quá hạn</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-blue-800 uppercase">Sự Kiện Sắp Tới</div>
              <div className="text-xl font-black text-blue-950 mt-0.5">{upcomingEventsList.length}</div>
              <div className="text-[10px] text-blue-700">Theo lịch năm học</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-900 uppercase">Hồ Sơ Chờ Phê Duyệt</div>
              <div className="text-xl font-black text-amber-950 mt-0.5">{pendingLeaves + pendingSubs + pendingFacilities}</div>
              <div className="text-[10px] text-amber-800">Nghỉ phép, đổi tiết, CSVC</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-purple-900 uppercase">Sinh Nhật Tháng {today.getMonth() + 1}</div>
              <div className="text-xl font-black text-purple-950 mt-0.5">{upcomingBirthdaysList.length}</div>
              <div className="text-[10px] text-purple-700">Cán bộ, GV & Nhân viên</div>
            </div>
          </div>
        </div>

        {/* Split Grid Content: Urgent Tasks on Left, Upcoming Events on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Urgent Tasks Column */}
          {(summaryFilter === 'ALL' || summaryFilter === 'URGENT') && (
            <div className={`space-y-3 ${summaryFilter === 'URGENT' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></div>
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                    Nhiệm Vụ Khẩn Cấp & Công Việc Cần Xử Lý ({urgentTasksList.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTab('competition')}
                  className="text-xs font-bold text-red-700 hover:text-red-900 hover:underline flex items-center gap-1"
                >
                  <span>Sổ Giao Việc & Thi Đua</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {urgentTasksList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-slate-800 text-sm">Không Có Nhiệm Vụ Tồn Đọng!</div>
                  <p>Mọi công việc, hồ sơ và đề xuất đều đã được giải quyết kịp thời.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {urgentTasksList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-red-200 hover:shadow-sm transition text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              item.priority === 'KHAN_CAP'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {item.priority === 'KHAN_CAP' ? '⚡ KHẨN CẤP' : 'ƯU TIÊN CAO'}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{item.subtitle}</div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {item.badge}
                          </span>
                          {item.dueDate && (
                            <span className="text-slate-400 font-mono">Hạn: {item.dueDate}</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectTab(item.targetTab)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-700 hover:text-white text-slate-800 font-bold text-xs border border-slate-300 hover:border-red-700 shadow-sm transition flex items-center justify-center gap-1 shrink-0 self-start sm:self-auto"
                      >
                        <span>{item.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RIGHT: Upcoming Events Column */}
          {(summaryFilter === 'ALL' || summaryFilter === 'EVENTS') && (
            <div className={`space-y-3 ${summaryFilter === 'EVENTS' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                    Lịch Sự Kiện & Công Tác Trọng Tâm ({upcomingEventsList.length})
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  Tháng {today.getMonth() + 1} / {today.getFullYear()}
                </span>
              </div>

              {upcomingEventsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                  <Calendar className="w-8 h-8 text-blue-500 mx-auto" />
                  <div className="font-bold text-slate-800 text-sm">Chưa có lịch sự kiện mới</div>
                  <p>Bấm nút "Thêm sự kiện" để bổ sung lịch công tác của trường.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {upcomingEventsList.map((ev) => {
                    const eventDate = new Date(ev.startDate);
                    const dayNum = eventDate.getDate() || 1;
                    const monthNum = eventDate.getMonth() + 1 || 10;
                    return (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-2xl border transition text-xs flex gap-3.5 ${
                          ev.isToday
                            ? 'bg-emerald-50/70 border-emerald-300 shadow-sm ring-1 ring-emerald-300'
                            : ev.isImportant
                            ? 'bg-amber-50/40 border-amber-200 hover:bg-amber-50/70'
                            : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm'
                        }`}
                      >
                        {/* Date Block */}
                        <div
                          className={`w-12 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border shadow-xs ${
                            ev.isToday
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : ev.isImportant
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <span className="text-[9px] font-bold uppercase tracking-wider">T.{monthNum}</span>
                          <span className="text-lg font-black leading-none">{dayNum}</span>
                        </div>

                        {/* Content */}
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                              {ev.categoryLabel}
                            </span>
                            {ev.isToday ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black animate-pulse">
                                HÔM NAY
                              </span>
                            ) : ev.daysRemaining === 1 ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                NGÀY MAI
                              </span>
                            ) : ev.daysRemaining && ev.daysRemaining > 1 ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                Còn {ev.daysRemaining} ngày
                              </span>
                            ) : null}
                          </div>

                          <div className="font-extrabold text-slate-900 text-xs leading-snug">
                            {ev.title}
                          </div>

                          <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </div>

                          <div className="pt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                            {ev.time && <span>🕒 {ev.time}</span>}
                            <span>📍 {ev.location}</span>
                            <span>👤 Chủ trì: <strong className="text-slate-700">{ev.organizer}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* BIRTHDAYS VIEW ONLY */}
          {summaryFilter === 'BIRTHDAYS' && (
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cake className="w-5 h-5 text-amber-500" />
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                    Chúc Mừng Sinh Nhật Cán Bộ, Giáo Viên & Nhân Viên Trong Tháng {today.getMonth() + 1}
                  </h4>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Tổng số: {upcomingBirthdaysList.length} đồng chí
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {upcomingBirthdaysList.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center gap-3 ${
                      b.isToday
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400 shadow-sm'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        b.isToday ? 'bg-amber-500 text-white' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {b.birthDay}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-slate-900 text-xs truncate flex items-center gap-1.5">
                        <span>{b.staffName}</span>
                        {b.isToday && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-black">
                            HÔM NAY 🎂
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{b.position}</div>
                      <div className="text-[10px] text-slate-400 truncate">📍 {b.campusName} • SĐT: {b.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION: TRUNG TÂM THỐNG KÊ ĐA TIÊU CHÍ (YÊU CẦU 1 CỦA USER) */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-black text-slate-900">
                Trung Tâm Thống Kê Đa Tiêu Chí Theo Người Dùng Lựa Chọn
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống tổng hợp tự động số liệu ở các phân hệ theo nhiều tiêu chí tùy biến (Phân hiệu, Điểm trường, Cấp học, Khối lớp, Thời gian...).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-700 flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* Function Category Tabs */}
        <div className="flex flex-wrap gap-2 text-xs font-bold border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveStatCategory('students')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeStatCategory === 'students'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>1. Thống Kê Học Sinh ({totalStudents})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatCategory('staff')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeStatCategory === 'staff'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Thống Kê Nhân Sự ({totalStaffCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatCategory('leaves')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeStatCategory === 'leaves'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>3. Nghỉ Phép & Dạy Thay (4 Lựa chọn)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatCategory('rewards_reminders')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeStatCategory === 'rewards_reminders'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>4. Khen Thưởng & Nhắc Nhở</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatCategory('finance')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeStatCategory === 'finance'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>5. Tài Chính & Các Khoản Thu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatCategory('health')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeStatCategory === 'health'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>6. Y Tế Học Đường</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatCategory('smart_alerts')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeStatCategory === 'smart_alerts'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>7. Cảnh Báo Thông Minh (AI / Rules)</span>
            {unresolvedAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                {unresolvedAlertsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveStatCategory('bi_dashboards')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeStatCategory === 'bi_dashboards'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>8. Báo Cáo Thông Minh (BI Dashboards)</span>
          </button>
        </div>

        {/* Global Multi-Criteria Selector Filters */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Tiêu chí 1: Phân hiệu</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-red-600 outline-none"
            >
              <option value="ALL">-- Toàn bộ trường --</option>
              {BRANCHES_DATA.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Tiêu chí 2: Cấp học</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-red-600 outline-none"
            >
              <option value="ALL">Tất cả cấp học (TH & THCS)</option>
              <option value="TH">Cấp Tiểu học (Lớp 1 - 5)</option>
              <option value="THCS">Cấp Trung học Cơ sở (Lớp 6 - 9)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Tiêu chí 3: Khối lớp</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-red-600 outline-none"
            >
              <option value="ALL">Tất cả các khối</option>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((g) => (
                <option key={g} value={g}>
                  Khối {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Tiêu chí 4: Tháng theo dõi</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-red-600 outline-none"
            >
              {[9, 10, 11, 12, 1, 2, 3, 4, 5].map((m) => (
                <option key={m} value={m}>
                  Tháng {m} (Năm học {activeSchoolYear})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SUBTAB 1: THỐNG KÊ HỌC SINH ĐA TIÊU CHÍ */}
        {/* ======================================================== */}
        {activeStatCategory === 'students' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="text-[11px] font-bold text-blue-900">Sĩ Số Học Sinh</div>
                <div className="text-xl font-black text-blue-700">{studentStats.total.toLocaleString()}</div>
                <div className="text-[10px] text-blue-800">{filteredClasses.length} lớp học</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-700">Học Sinh Nam</div>
                <div className="text-xl font-black text-slate-900">{studentStats.male.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">Tỷ lệ: {studentStats.total > 0 ? Math.round((studentStats.male / studentStats.total) * 100) : 0}%</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="text-[11px] font-bold text-rose-900">Học Sinh Nữ</div>
                <div className="text-xl font-black text-rose-700">{studentStats.female.toLocaleString()}</div>
                <div className="text-[10px] text-rose-800">Tỷ lệ: {studentStats.total > 0 ? Math.round((studentStats.female / studentStats.total) * 100) : 0}%</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-[11px] font-bold text-amber-900">Diện Hộ Nghèo</div>
                <div className="text-xl font-black text-amber-700">{studentStats.poor}</div>
                <div className="text-[10px] text-amber-800">Miễn giảm học phí</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200">
                <div className="text-[11px] font-bold text-orange-900">Hộ Cận Nghèo</div>
                <div className="text-xl font-black text-orange-700">{studentStats.nearPoor}</div>
                <div className="text-[10px] text-orange-800">Hỗ trợ chi phí</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="text-[11px] font-bold text-purple-900">Khuyết Tật Hòa Nhập</div>
                <div className="text-xl font-black text-purple-700">{studentStats.disability}</div>
                <div className="text-[10px] text-purple-800">Kế hoạch GD riêng</div>
              </div>
            </div>

            {/* Breakdown table by class */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-3 font-bold text-slate-800 flex items-center justify-between">
                <span>Bảng Thống Kê Chi Tiết Từng Lớp Học Thuộc Bộ Lọc ({filteredClasses.length} lớp)</span>
                <span className="text-[11px] text-slate-500 font-normal">Đồng bộ tự động từ Sheet Lớp A-AZ</span>
              </div>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 sticky top-0 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-2.5">Lớp</th>
                      <th className="p-2.5">Cấp học</th>
                      <th className="p-2.5">Phân hiệu</th>
                      <th className="p-2.5">Điểm trường</th>
                      <th className="p-2.5">GVCN phụ trách</th>
                      <th className="p-2.5 text-center">Sĩ số</th>
                      <th className="p-2.5 text-center">Nam</th>
                      <th className="p-2.5 text-center">Nữ</th>
                      <th className="p-2.5 text-center">Chính sách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClasses.map((cls) => {
                      const male = Math.round(cls.totalStudents * 0.52);
                      const female = cls.totalStudents - male;
                      const poor = Math.round(cls.totalStudents * 0.12);
                      return (
                        <tr key={cls.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{cls.name}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cls.level === 'TH' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                              {cls.level}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600">{cls.branchName}</td>
                          <td className="p-2.5 text-slate-600">{cls.campusName}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{cls.homeroomTeacherName}</td>
                          <td className="p-2.5 text-center font-bold text-red-700">{cls.totalStudents}</td>
                          <td className="p-2.5 text-center">{male}</td>
                          <td className="p-2.5 text-center">{female}</td>
                          <td className="p-2.5 text-center text-amber-700 font-semibold">{poor}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 2: THỐNG KÊ NHÂN SỰ CHUẨN 137 NGƯỜI */}
        {/* ======================================================== */}
        {activeStatCategory === 'staff' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200">
                <div className="text-[11px] font-bold text-red-900">Hiệu trưởng</div>
                <div className="text-xl font-black text-red-700">{htCount}</div>
                <div className="text-[10px] text-red-800">Thầy Bảo (Chung)</div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-[11px] font-bold text-amber-900">Phó Hiệu trưởng</div>
                <div className="text-xl font-black text-amber-700">{phtCount}</div>
                <div className="text-[10px] text-amber-800">Mỗi PHT 1 phân hiệu</div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="text-[11px] font-bold text-blue-900">GV THCS</div>
                <div className="text-xl font-black text-blue-700">{gvThcsCount}</div>
                <div className="text-[10px] text-blue-800">36 biên chế</div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-900">GV Tiểu học</div>
                <div className="text-xl font-black text-emerald-700">{gvThCount}</div>
                <div className="text-[10px] text-emerald-800">76 biên chế (TPT+chuyên)</div>
              </div>

              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200">
                <div className="text-[11px] font-bold text-teal-900">Nhân viên VP</div>
                <div className="text-xl font-black text-teal-700">{nvCount}</div>
                <div className="text-[10px] text-teal-800">Kế toán, y tế, thư viện</div>
              </div>

              <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200">
                <div className="text-[11px] font-bold text-orange-900">Bảo vệ & Hợp đồng</div>
                <div className="text-xl font-black text-orange-700">{bvCount}</div>
                <div className="text-[10px] text-orange-800">9 vị trí</div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="text-[11px] font-bold text-purple-900">GV Hợp đồng</div>
                <div className="text-xl font-black text-purple-700">{gvHdCount}</div>
                <div className="text-[10px] text-purple-800">2 giáo viên</div>
              </div>
            </div>

            {/* Personnel Placement Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800">Phân Bổ Nhân Sự Gắn Với Trụ Sở & Phân Hiệu (Yêu cầu Ban Giám hiệu):</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <div className="font-black text-red-700">1. Trụ sở chính</div>
                  <div className="text-slate-600 mt-1">1 HT + 10 Nhân viên văn phòng, tài chính, thư viện. (0 lớp học)</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <div className="font-black text-blue-700">2. Phân hiệu TH La Hai</div>
                  <div className="text-slate-600 mt-1">1 PHT (Thầy Long) + 38 Giáo viên TH & 3 nhân viên, bảo vệ.</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <div className="font-black text-emerald-700">3. PH TH & THCS Xuân Long</div>
                  <div className="text-slate-600 mt-1">1 PHT (Thầy Tuyên) + 42 Giáo viên TH & THCS, 3 bảo vệ.</div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <div className="font-black text-purple-700">4. PH TH & THCS Xuân Quang 2</div>
                  <div className="text-slate-600 mt-1">1 PHT (Thầy Hiếu) + 41 Giáo viên TH & THCS, 3 bảo vệ.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 3: NGHỈ PHÉP & DẠY THAY (4 LỰA CHỌN) */}
        {/* ======================================================== */}
        {activeStatCategory === 'leaves' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="font-bold text-blue-900">Lựa chọn 1: Xin đổi tiết</div>
                <div className="text-2xl font-black text-blue-700 mt-1">{leaveStats.opt1}</div>
                <div className="text-[10px] text-blue-800 mt-0.5">GV khác xác nhận dạy thay</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="font-bold text-emerald-900">Lựa chọn 2: Tự dạy bù</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{leaveStats.opt2}</div>
                <div className="text-[10px] text-emerald-800 mt-0.5">GV đăng ký lịch dạy bù</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="font-bold text-amber-900">Lựa chọn 3: Trường phân công</div>
                <div className="text-2xl font-black text-amber-700 mt-1">{leaveStats.opt3}</div>
                <div className="text-[10px] text-amber-800 mt-0.5">BGH bố trí GV dạy thay</div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="font-bold text-rose-900">Lựa chọn 4: Cho HS nghỉ</div>
                <div className="text-2xl font-black text-rose-700 mt-1">{leaveStats.opt4}</div>
                <div className="text-[10px] text-rose-800 mt-0.5">Không có GV dạy thay</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-800">Trạng thái phê duyệt nghỉ phép & dạy thay:</span>{' '}
                <span className="text-emerald-700 font-bold">{leaveStats.approved} đơn đã duyệt</span> •{' '}
                <span className="text-amber-700 font-bold">{leaveStats.pending} đơn đang chờ duyệt</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('leaves')}
                className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs"
              >
                Chuyển Đến Phân Hệ Nghỉ Phép &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 4: KHEN THƯỞNG & NHẮC NHỞ CÔNG KHAI CÓ MINH CHỨNG */}
        {/* ======================================================== */}
        {activeStatCategory === 'rewards_reminders' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Khen Thưởng Công Khai</span>
                  <Trophy className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-2">{publicCommendations.length}</div>
                <div className="text-[11px] text-emerald-800 mt-1">100% có file / ảnh minh chứng tải lên</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Nhắc Nhở Công Khai</span>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-700 mt-2">{publicReminders.length}</div>
                <div className="text-[11px] text-amber-800 mt-1">Vi phạm tự ý đổi tiết / bỏ tiết / nề nếp</div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900">Sinh Nhật Thành Viên</span>
                  <Cake className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-700 mt-2">{birthdays.length}</div>
                <div className="text-[11px] text-purple-800 mt-1">Nhắc nhở chúc mừng trong năm học</div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
              <span>
                Tất cả hình ảnh quyết định, bằng khen, biên bản vi phạm đều được số hóa và đồng bộ lưu trữ vào Google Drive.
              </span>
              <button
                type="button"
                onClick={() => onSelectTab('notices_honors')}
                className="underline font-bold hover:text-amber-950"
              >
                Xem chi tiết minh chứng &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 5: TÀI CHÍNH & CÁC KHOẢN THU */}
        {/* ======================================================== */}
        {activeStatCategory === 'finance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-semibold">Tổng Số Bản Thu</div>
                <div className="text-xl font-black text-slate-900">{financeStats.totalRecs}</div>
                <div className="text-[10px] text-slate-400">Theo biểu phí quy định</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="text-blue-900 font-semibold">Dự Kiến Thu</div>
                <div className="text-lg font-black text-blue-700">{financeStats.totalExpected.toLocaleString('vi-VN')} đ</div>
                <div className="text-[10px] text-blue-800">100% định mức</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-emerald-900 font-semibold">Thực Tế Đã Thu</div>
                <div className="text-lg font-black text-emerald-700">{financeStats.totalCollected.toLocaleString('vi-VN')} đ</div>
                <div className="text-[10px] text-emerald-800">
                  Đạt {financeStats.totalExpected > 0 ? Math.round((financeStats.totalCollected / financeStats.totalExpected) * 100) : 0}%
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="text-rose-900 font-semibold">Công Nợ Còn Lại</div>
                <div className="text-lg font-black text-rose-700">{financeStats.totalRemaining.toLocaleString('vi-VN')} đ</div>
                <div className="text-[10px] text-rose-800">{financeStats.debtCount} học sinh chưa xong</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-emerald-900 font-semibold">Đã Hoàn Thành</div>
                <div className="text-xl font-black text-emerald-700">{financeStats.paidCount}</div>
                <div className="text-[10px] text-emerald-800">Đã cấp biên lai thu</div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 6: Y TẾ HỌC ĐƯỜNG */}
        {/* ======================================================== */}
        {activeStatCategory === 'health' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-600 font-semibold">Đã Khám Sức Khỏe</div>
                <div className="text-xl font-black text-slate-900">{healthStats.total} HS</div>
                <div className="text-[10px] text-slate-400">Định kỳ đầu năm</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-emerald-900 font-semibold">Thị Lực Tốt (10/10)</div>
                <div className="text-xl font-black text-emerald-700">{healthStats.goodVision}</div>
                <div className="text-[10px] text-emerald-800">
                  Tỷ lệ {healthStats.total > 0 ? Math.round((healthStats.goodVision / healthStats.total) * 100) : 0}%
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-amber-900 font-semibold">Tật Khúc Xạ / Cận Thị</div>
                <div className="text-xl font-black text-amber-700">{healthStats.refractiveError}</div>
                <div className="text-[10px] text-amber-800">Cần bố trí bàn đầu</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="text-blue-900 font-semibold">Nha Khoa Bình Thường</div>
                <div className="text-xl font-black text-blue-700">{healthStats.normalDental}</div>
                <div className="text-[10px] text-blue-800">Sâu răng: {healthStats.cavityDental} HS</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200">
                <div className="text-teal-900 font-semibold">Cột Sống Chuẩn</div>
                <div className="text-xl font-black text-teal-700">{healthStats.normalSpine}</div>
                <div className="text-[10px] text-teal-800">Không bị gù vẹo</div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 7: CẢNH BÁO THÔNG MINH (AI / RULES ENGINE) (YÊU CẦU 4) */}
        {/* ======================================================== */}
        {activeStatCategory === 'smart_alerts' && (
          <div className="space-y-4">
            {/* Top Control Bar for Smart Alerts */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-rose-950 tracking-wider">
                    Hệ Thống Rà Soát & Cảnh Báo Tự Động (AI / Rules Engine)
                  </h4>
                  <p className="text-[11px] text-rose-800">
                    Tự động quét toàn bộ cơ sở dữ liệu để phát hiện bất thường: Sổ sách chưa nộp, Vượt chỉ tiêu sĩ số, Nguy cơ bỏ học, Sụt giảm học lực.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={alertSeverityFilter}
                  onChange={(e) => setAlertSeverityFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white text-slate-800 font-semibold outline-none"
                >
                  <option value="ALL">-- Tất cả mức độ --</option>
                  <option value="CRITICAL">🔴 Khẩn cấp</option>
                  <option value="WARNING">🟡 Cảnh báo</option>
                  <option value="INFO">🔵 Nhắc nhở</option>
                </select>

                <select
                  value={alertTypeFilter}
                  onChange={(e) => setAlertTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white text-slate-800 font-semibold outline-none"
                >
                  <option value="ALL">-- Tất cả nhóm quy tắc --</option>
                  <option value="TEACHER_RECORD_INCOMPLETE">Sổ sách / Điểm số GV</option>
                  <option value="CLASS_OVER_CAPACITY">Quá tải sĩ số lớp</option>
                  <option value="STUDENT_DROPOUT_RISK">Nguy cơ bỏ học</option>
                  <option value="STUDENT_GRADE_DROP">Sụt giảm kết quả học tập</option>
                </select>
              </div>
            </div>

            {/* Smart Alerts KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="text-slate-500 font-medium">Tổng số cảnh báo</div>
                <div className="text-xl font-black text-slate-900 mt-1">{smartAlertsList.length}</div>
                <div className="text-[10px] text-slate-400">Đã cập nhật theo thời gian thực</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="text-rose-700 font-medium">Khẩn cấp (Cần xử lý ngay)</div>
                <div className="text-xl font-black text-rose-700 mt-1">
                  {smartAlertsList.filter((a) => a.severity === 'CRITICAL' && !a.isResolved).length}
                </div>
                <div className="text-[10px] text-rose-800">Ưu tiên xử lý hàng đầu</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-amber-800 font-medium">Chưa hoàn thành sổ sách</div>
                <div className="text-xl font-black text-amber-700 mt-1">
                  {smartAlertsList.filter((a) => a.type === 'TEACHER_RECORD_INCOMPLETE' && !a.isResolved).length} GV
                </div>
                <div className="text-[10px] text-amber-800">Cần gửi nhắc nhở nội bộ</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-emerald-800 font-medium">Đã giải quyết / Đóng</div>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {smartAlertsList.filter((a) => a.isResolved).length}
                </div>
                <div className="text-[10px] text-emerald-800">Lưu vết biên bản xử lý</div>
              </div>
            </div>

            {/* List of Smart Alerts */}
            <div className="space-y-3">
              {smartAlertsList
                .filter((alert) => {
                  if (alertSeverityFilter !== 'ALL' && alert.severity !== alertSeverityFilter) return false;
                  if (alertTypeFilter !== 'ALL' && alert.type !== alertTypeFilter) return false;
                  return true;
                })
                .map((alert) => {
                  const isResolved = alert.isResolved;
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border transition ${
                        isResolved
                          ? 'bg-slate-50/70 border-slate-200 opacity-60'
                          : alert.severity === 'CRITICAL'
                          ? 'bg-rose-50/40 border-rose-200 shadow-sm'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-50/40 border-amber-200 shadow-sm'
                          : 'bg-blue-50/40 border-blue-200 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-rose-600 text-white'
                                  : alert.severity === 'WARNING'
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {alert.severity === 'CRITICAL' ? 'Khẩn Cấp' : alert.severity === 'WARNING' ? 'Cảnh Báo' : 'Nhắc Nhở'}
                            </span>

                            <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                              {alert.type === 'TEACHER_RECORD_INCOMPLETE'
                                ? '📖 Sổ Sách GV'
                                : alert.type === 'CLASS_OVER_CAPACITY'
                                ? '👥 Vượt Chỉ Tiêu Sĩ Số'
                                : alert.type === 'STUDENT_DROPOUT_RISK'
                                ? '⚠️ Nguy Cơ Bỏ Học'
                                : '📉 Sụt Giảm Học Lực'}
                            </span>

                            {alert.branchName && (
                              <span className="text-[11px] text-slate-500">📍 {alert.branchName}</span>
                            )}
                            {alert.campusName && (
                              <span className="text-[11px] text-slate-400">({alert.campusName})</span>
                            )}

                            <span className="text-[10px] text-slate-400 ml-auto">{alert.dateCreated}</span>
                          </div>

                          <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                            <span>{alert.title}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-xs text-slate-700">
                              Đối tượng: {alert.entityName}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed">{alert.description}</p>

                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-900">Giải pháp đề xuất (AI / Rules): </strong>
                              <span>{alert.recommendedAction}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                          {!isResolved ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    alert.type === 'CLASS_OVER_CAPACITY' ||
                                    alert.type === 'STUDENT_DROPOUT_RISK' ||
                                    alert.type === 'STUDENT_GRADE_DROP'
                                  ) {
                                    onSelectTab('classes');
                                  } else {
                                    onSelectTab('staff');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                              >
                                <span>Chuyển Đến Xử Lý</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDismissAlert(alert.id)}
                                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                              >
                                Đánh dấu đã giải quyết
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã giải quyết</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 8: BÁO CÁO THÔNG MINH (BI DASHBOARDS) (YÊU CẦU 4) */}
        {/* ======================================================== */}
        {activeStatCategory === 'bi_dashboards' && (
          <div className="space-y-6">
            {/* Header with Print & Export Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">
                    Báo Cáo Thông Minh BI (Business Intelligence) Thời Gian Thực
                  </h4>
                  <p className="text-[11px] text-indigo-800">
                    Tự động phân tích sâu về tình hình nhân sự, biến động học sinh toàn diện và đánh giá chất lượng đại trà theo thời gian thực.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Báo Cáo BI</span>
                </button>
              </div>
            </div>

            {/* BI SECTION 1: NHÂN SỰ */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                    1. BI Tình Hình Nhân Sự & Khung Biên Chế (137 Cán bộ GV-NV)
                  </h5>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Chuẩn hóa dữ liệu A-AZ
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 font-medium">Trình độ Thạc sĩ</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {biData.personnelBI.qualificationDistribution.Master} người
                  </div>
                  <div className="text-[10px] text-indigo-600 font-semibold">Tỷ lệ 10.2%</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 font-medium">Trình độ Đại học</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {biData.personnelBI.qualificationDistribution.University} người
                  </div>
                  <div className="text-[10px] text-indigo-600 font-semibold">Tỷ lệ 78.8%</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 font-medium">Biên chế Nhà nước</div>
                  <div className="text-lg font-black text-emerald-700 mt-0.5">
                    {biData.personnelBI.civilServantCount} người
                  </div>
                  <div className="text-[10px] text-slate-500">Hợp đồng: {biData.personnelBI.contractStaffCount}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 font-medium">Tỷ lệ tiết trống trong TKB</div>
                  <div className="text-lg font-black text-blue-700 mt-0.5">
                    {biData.personnelBI.freeScheduleRate}%
                  </div>
                  <div className="text-[10px] text-slate-500">Nguồn lực sẵn sàng dạy thay</div>
                </div>
              </div>

              {/* Personnel by branch */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-700 mb-2">Phân bổ nhân sự theo 4 phân hiệu:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {biData.personnelBI.byBranch.map((b: any) => (
                    <div key={b.branch} className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                      <div className="font-bold text-slate-800">{b.branch}</div>
                      <div className="text-slate-600 mt-0.5">
                        Tổng: <strong>{b.count}</strong> (GV: {b.teachers}, NV: {b.staff})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BI SECTION 2: BIẾN ĐỘNG HỌC SINH */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                    2. BI Biến Động Học Sinh & Báo Cáo Sở GD&ĐT
                  </h5>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Tăng ròng +{biData.studentFluctuationBI.netChangeYear} HS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 font-medium">Tổng Sĩ Số Hiện Tại</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{totalStudents} HS</div>
                  <div className="text-[10px] text-slate-500">11 điểm trường</div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-emerald-800 font-medium">Chuyển Đến Toàn Năm</div>
                  <div className="text-lg font-black text-emerald-700 mt-0.5">
                    +{biData.studentFluctuationBI.transfersIn} HS
                  </div>
                  <div className="text-[10px] text-emerald-800">Đã tiếp nhận hồ sơ số</div>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-rose-800 font-medium">Chuyển Đi Toàn Năm</div>
                  <div className="text-lg font-black text-rose-700 mt-0.5">
                    -{biData.studentFluctuationBI.transfersOut} HS
                  </div>
                  <div className="text-[10px] text-rose-800">Đã cấp giấy giới thiệu</div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-amber-800 font-medium">Bảo Lưu Kết Quả</div>
                  <div className="text-lg font-black text-amber-700 mt-0.5">
                    {biData.studentFluctuationBI.preservationCount} HS
                  </div>
                  <div className="text-[10px] text-amber-800">Điều trị y tế / lý do gia đình</div>
                </div>

                <div className="p-3 bg-slate-100 rounded-xl border border-slate-300">
                  <div className="text-slate-700 font-medium">Thôi Học</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {biData.studentFluctuationBI.dropoutCount} HS
                  </div>
                  <div className="text-[10px] text-slate-500">Hồ sơ đã lưu trữ điện tử</div>
                </div>
              </div>

              {/* By Semester Breakdown */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-700 mb-2">Thống kê theo tiến độ học kỳ:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {biData.studentFluctuationBI.bySemester.map((s: any) => (
                    <div key={s.semester} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900 mb-1">{s.semester}</div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div>Chuyển đến: <strong className="text-emerald-700">+{s.transferIn}</strong></div>
                        <div>Chuyển đi: <strong className="text-rose-700">-{s.transferOut}</strong></div>
                        <div>Bảo lưu: <strong className="text-amber-700">{s.preservation}</strong></div>
                        <div>Thôi học: <strong className="text-slate-800">{s.dropout}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BI SECTION 3: CHẤT LƯỢNG ĐẠI TRÀ THỜI GIAN THỰC */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                    3. BI Chất Lượng Đại Trà & Chuyên Cần Thời Gian Thực
                  </h5>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  GPA Toàn trường: {biData.academicQualityBI.averageGpa}/10
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-emerald-800 font-medium">Học lực Giỏi / Xuất Sắc</div>
                  <div className="text-lg font-black text-emerald-700 mt-0.5">
                    {biData.academicQualityBI.excellentRate}%
                  </div>
                  <div className="text-[10px] text-emerald-800">Vượt chỉ tiêu năm học</div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-blue-800 font-medium">Học lực Khá</div>
                  <div className="text-lg font-black text-blue-700 mt-0.5">
                    {biData.academicQualityBI.goodRate}%
                  </div>
                  <div className="text-[10px] text-blue-800">Lực lượng chủ lực</div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-amber-800 font-medium">Trung Bình (Đạt)</div>
                  <div className="text-lg font-black text-amber-700 mt-0.5">
                    {biData.academicQualityBI.averageRate}%
                  </div>
                  <div className="text-[10px] text-amber-800">Cần bồi dưỡng nâng cao</div>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-purple-800 font-medium">Tỷ lệ Chuyên Cần Real-Time</div>
                  <div className="text-lg font-black text-purple-700 mt-0.5">
                    {biData.academicQualityBI.attendanceRealTimeRate}%
                  </div>
                  <div className="text-[10px] text-purple-800">Từ sổ điểm danh điện tử</div>
                </div>
              </div>

              {/* Subject Insights */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800">Đánh giá môn học theo thời gian thực:</div>
                  <div className="text-slate-600 mt-0.5">
                    Môn có kết quả cao nhất: <strong className="text-emerald-700">{biData.academicQualityBI.topSubject}</strong> • Môn cần tăng cường phụ đạo: <strong className="text-rose-700">{biData.academicQualityBI.lowestSubject}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTab('gradebook')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs transition"
                >
                  Xem Sổ Điểm Chi Tiết &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Middle Section 1: Personnel Quota & Leadership Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Official Personnel Quota Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-red-600" />
              <span>Cơ cấu Nhân sự Chuẩn ({totalStaffCount} Người)</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">Đắk Lắk</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">1. Hiệu trưởng (HT)</span>
              <span className="font-bold text-red-700 px-2 py-0.5 rounded bg-red-50 border border-red-200">
                1 người (Thầy Nguyễn Quốc Bảo - Phụ trách chung)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">2. Phó Hiệu trưởng (PHT)</span>
              <span className="font-bold text-amber-700 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                3 người (Mỗi PHT phụ trách 1 phân hiệu)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">3. Giáo viên THCS</span>
              <span className="font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                36 người
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">4. Giáo viên Tiểu học (TH)</span>
              <span className="font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                76 người (Đã tính 1 TPT Đội + 6 GV chuyên TH)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">5. Nhân viên văn phòng, thiết bị, y tế</span>
              <span className="font-bold text-teal-700 px-2 py-0.5 rounded bg-teal-50 border border-teal-200">
                10 người
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">6. Nhân viên hợp đồng, bảo vệ</span>
              <span className="font-bold text-orange-700 px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
                9 người
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">7. Giáo viên hợp đồng</span>
              <span className="font-bold text-purple-700 px-2 py-0.5 rounded bg-purple-50 border border-purple-200">
                2 người (Tiếng Anh, Tin học)
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Tổng số biên chế & lao động:</span>
            <span className="text-sm font-black text-red-700">{totalStaffCount} người</span>
          </div>
        </div>

        {/* 1.5. Phân quyền Lãnh đạo & Quản trị Hệ thống */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Phân Quyền Lãnh Đạo & Quản Trị</span>
            </h3>
            <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              5 Vị trí cốt lõi
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* 1. HT */}
            <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-200 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-red-700 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                HT
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-red-950">Thầy Nguyễn Quốc Bảo</div>
                <div className="text-[11px] text-red-800 font-medium">Hiệu trưởng • Phụ trách chung toàn trường</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Phê duyệt toàn diện, duyệt kinh phí & CSVC, xem được tất cả 4 trang hiển thị phân hiệu.
                </div>
              </div>
            </div>

            {/* 2. PHT Phân hiệu TH La Hai */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                PHT
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">Thầy Trần Thanh Long</div>
                <div className="text-[11px] text-emerald-900 font-medium">Phó Hiệu trưởng phụ trách Phân hiệu TH La Hai</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Phụ trách 3 điểm trường (TH La Hai, MN La Hai, TH Long Hà), duyệt phép GV và HS phân hiệu.
                </div>
              </div>
            </div>

            {/* 3. PHT Phân hiệu Xuân Long */}
            <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                PHT
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">Thầy Phan Hưng Tuyên</div>
                <div className="text-[11px] text-orange-900 font-medium">Phó Hiệu trưởng phụ trách Phân hiệu TH & THCS Xuân Long</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Phụ trách 3 điểm trường (TH Long Mỹ, THCS Long Mỹ, TH Long Hòa), CSVC và chuyên môn.
                </div>
              </div>
            </div>

            {/* 4. PHT Phân hiệu Xuân Quang 2 */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                PHT
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">Thầy Ninh Đức Hiếu</div>
                <div className="text-[11px] text-blue-900 font-medium">Phó Hiệu trưởng phụ trách Phân hiệu TH & THCS Xuân Quang 2</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Phụ trách 5 điểm trường (Triêm Đức TH/THCS, Phước Huệ, Phú Sơn, Kỳ Đu), duyệt phép GV/HS phân hiệu.
                </div>
              </div>
            </div>

            {/* 5. IT Admin */}
            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                IT
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">Cô Võ Thị Ngọc Hảo</div>
                <div className="text-[11px] text-purple-900 font-medium">Quản trị Hệ thống (GV Tin học)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Vận hành hệ thống, quyền đổi GVCN cho GV khác, hỗ trợ Google Sheets & Drive.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section 2: Scale across 1 Trụ sở chính & 3 Phân hiệu (11 Điểm trường học) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Quy Mô 1 Trụ Sở Chính & 3 Phân Hiệu (11 Điểm Trường Học)</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">57 lớp • 1.289 học sinh</span>
        </div>

        <div className="space-y-3">
          {BRANCHES_DATA.map((branch, index) => {
            const branchStudents = branch.campuses.reduce((acc, c) => acc + c.studentCount, 0);
            const branchClasses = branch.campuses.reduce((acc, c) => acc + c.classCount, 0);
            const percent = totalStudents > 0 ? Math.round((branchStudents / totalStudents) * 100) : 0;

            return (
              <div key={branch.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">
                      {index + 1}. {branch.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                      {branch.id === 'PH_TRU_SO' ? 'Văn phòng HT & NV' : `${branch.campuses.length} điểm trường`}
                    </span>
                  </div>
                  <div className="font-bold text-slate-700">
                    {branchClasses} lớp • <span className="text-blue-700">{branchStudents} HS ({percent}%)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${
                      index === 0 ? 'bg-slate-400' : index === 1 ? 'bg-red-600' : index === 2 ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${branch.id === 'PH_TRU_SO' ? 5 : percent}%` }}
                  ></div>
                </div>

                {/* Campus list badges */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {branch.campuses.map((c) => (
                    <span
                      key={c.id}
                      className="bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200 flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      <strong>{c.name}:</strong> {c.classCount} lớp, {c.studentCount} HS
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          onClick={() => onSelectTab('dispatches')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
            📚
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition">
              Quản Lý Sổ Sách (CV Đến/Đi)
            </h4>
            <p className="text-[11px] text-slate-500">Chuẩn Nghị định 30/2020 Bộ Nội vụ</p>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('branch_portals')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
            🏛️
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition">
              4 Trang Hiển Thị Phân Hiệu
            </h4>
            <p className="text-[11px] text-slate-500">Phân quyền xem theo phân hiệu & toàn trường</p>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('notices_honors')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
            📢
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-700 transition">
              Nhắc Nhở & Khen Thưởng
            </h4>
            <p className="text-[11px] text-slate-500">Kèm minh chứng hình ảnh/file tải lên</p>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('gradebook')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
            📖
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
              Sổ Điểm Điện Tử TH & THCS
            </h4>
            <p className="text-[11px] text-slate-500">Đánh giá Thông tư & gửi email phụ huynh</p>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('finance')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
            💰
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
              Tài Chính & Các Khoản Thu
            </h4>
            <p className="text-[11px] text-slate-500">Biểu phí, bán trú, công nợ, doanh thu</p>
          </div>
        </div>
      </div>

      {/* Modal: Thêm Sự Kiện Mới (Yêu cầu 2) */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Thêm Sự Kiện & Lịch Công Tác Nhà Trường
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Năm học {activeSchoolYear} • Hiển thị trực tiếp trên Dashboard điều hành
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewEvent} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề sự kiện / cuộc họp / hoạt động:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hội nghị Chuyên đề Đổi mới Phương pháp Dạy học Toán Khối 5"
                  value={newEventData.title}
                  onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày bắt đầu:</label>
                  <input
                    type="date"
                    required
                    value={newEventData.startDate}
                    onChange={(e) => setNewEventData({ ...newEventData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày kết thúc (nếu có):</label>
                  <input
                    type="date"
                    value={newEventData.endDate}
                    onChange={(e) => setNewEventData({ ...newEventData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thời gian (khung giờ):</label>
                  <input
                    type="text"
                    placeholder="VD: 07:30 - 11:30 hoặc 14:00"
                    value={newEventData.time}
                    onChange={(e) => setNewEventData({ ...newEventData, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phân loại hoạt động:</label>
                  <select
                    value={newEventData.category}
                    onChange={(e) => {
                      const cat = e.target.value as SchoolEventItem['category'];
                      const labels: Record<SchoolEventItem['category'], string> = {
                        CHUYEN_MON: 'Chuyên môn & Hội giảng',
                        HOI_NGHI: 'Hội nghị - Triển khai',
                        PHONG_TRAO: 'Phong trào & Đoàn Đội',
                        KIEM_TRA: 'Khảo sát chất lượng',
                        Y_TE_DOAN_THE: 'Y tế học đường',
                      };
                      setNewEventData({
                        ...newEventData,
                        category: cat,
                        categoryLabel: labels[cat] || 'Hoạt động trường',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="CHUYEN_MON">Chuyên môn & Hội giảng</option>
                    <option value="HOI_NGHI">Hội nghị - Triển khai</option>
                    <option value="KIEM_TRA">Khảo sát chất lượng & Thi cử</option>
                    <option value="Y_TE_DOAN_THE">Y tế học đường & Đoàn thể</option>
                    <option value="PHONG_TRAO">Phong trào & Lễ kỷ niệm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa điểm tổ chức:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hội trường Trụ sở chính Đồng Xuân / Điểm trường La Hai..."
                  value={newEventData.location}
                  onChange={(e) => setNewEventData({ ...newEventData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thành phần tham dự:</label>
                  <input
                    type="text"
                    placeholder="VD: Toàn thể GV, Khối 9, BGH..."
                    value={newEventData.targetAudience}
                    onChange={(e) => setNewEventData({ ...newEventData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Người / Đơn vị chủ trì:</label>
                  <input
                    type="text"
                    value={newEventData.organizer}
                    onChange={(e) => setNewEventData({ ...newEventData, organizer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung chi tiết / Yêu cầu chuẩn bị:</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả nội dung, công tác chuẩn bị của các phân hiệu..."
                  value={newEventData.description}
                  onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkImportant"
                  checked={newEventData.isImportant}
                  onChange={(e) => setNewEventData({ ...newEventData, isImportant: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="chkImportant" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Đánh dấu là Sự kiện trọng tâm (Highlight trên đầu trang Dashboard)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Lưu Sự Kiện</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
