import React, { useState, useMemo } from 'react';
import {
  UserAccount,
  SchoolClass,
  StudentTransferReport,
  StudentTransferCategory,
} from '../types/school';
import { BRANCHES_DATA, ALL_CAMPUSES } from '../data/initialData';
import { storageService } from '../services/storageService';
import {
  canViewTransferRecord,
  canApproveTransferRecord,
  canReceiveTransferStudent,
  getPhtAssignedBranch,
} from '../utils/permissionUtils';
import {
  ArrowRightLeft,
  Search,
  PlusCircle,
  FileCheck2,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  GraduationCap,
  Printer,
  ShieldCheck,
  Send,
  Users,
  Calendar,
  AlertTriangle,
  Info,
  Check,
  X,
  FileSpreadsheet,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface StudentTransfersPage5Props {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  classes: SchoolClass[];
  allStaff: { account: UserAccount }[];
  transfers?: StudentTransferReport[];
  onRefreshData?: () => void;
}

export const StudentTransfersPage5: React.FC<StudentTransfersPage5Props> = ({
  currentUser,
  activeSchoolYear,
  classes,
  allStaff,
  transfers,
  onRefreshData,
}) => {
  const [transfersList, setTransfersList] = useState<StudentTransferReport[]>(
    transfers || storageService.getStudentTransfers(activeSchoolYear)
  );

  React.useEffect(() => {
    if (transfers) {
      setTransfersList(transfers);
    } else {
      setTransfersList(storageService.getStudentTransfers(activeSchoolYear));
    }
  }, [transfers, activeSchoolYear]);

  // Sub-tab view on Page 5
  type ViewTab = 'list' | 'by_branch' | 'by_campus' | 'by_time' | 'chart_analysis' | 'official_report';
  const [activeTab, setActiveTab] = useState<ViewTab>('list');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | StudentTransferCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');

  // Modals
  const [showModalIn, setShowModalIn] = useState(false); // 3.1
  const [showModalInternal, setShowModalInternal] = useState(false); // 3.2
  const [showModalOut, setShowModalOut] = useState(false); // 3.3
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReportForReject, setSelectedReportForReject] = useState<StudentTransferReport | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ----------------------------------------------------
  // Form 3.1: Tiếp nhận HS từ trường khác đến
  // ----------------------------------------------------
  const [inTargetBranch, setInTargetBranch] = useState(BRANCHES_DATA[1]?.name || BRANCHES_DATA[0].name);
  const [inTargetCampus, setInTargetCampus] = useState(ALL_CAMPUSES[0].name);
  const [inTargetClassId, setInTargetClassId] = useState(classes[0]?.id || '');
  const [inStudentName, setInStudentName] = useState('');
  const [inGender, setInGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [inDob, setInDob] = useState('2015-05-15');
  const [inParentName, setInParentName] = useState('');
  const [inParentPhone, setInParentPhone] = useState('');
  const [inPreviousSchool, setInPreviousSchool] = useState('');
  const [inProvinceCity, setInProvinceCity] = useState('Phú Yên');
  const [inDecisionNo, setInDecisionNo] = useState('');
  const [inReason, setInReason] = useState('Chuyển nơi cư trú theo gia đình');
  const [inEffectiveDate, setInEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  // Campuses for Modal 3.1
  const inAvailableCampuses = useMemo(() => {
    const branch = BRANCHES_DATA.find((b) => b.name === inTargetBranch);
    return branch ? branch.campuses : ALL_CAMPUSES;
  }, [inTargetBranch]);

  const inAvailableClasses = useMemo(() => {
    return classes.filter((c) => c.campusName === inTargetCampus);
  }, [classes, inTargetCampus]);

  // ----------------------------------------------------
  // Form 3.2: Chuyển lớp trong cùng trường (GVCN kích nút chuyển)
  // Phân hiệu chuyển đi, điểm trường chuyển đi, lớp chuyển đi, Giáo viên chủ nhiệm chuyển đi, họ tên HS,
  // Phân hiệu chuyển đến, điểm trường chuyển đến, lớp chuyển đến, Giáo viên chủ nhiệm chuyển đến, họ tên HS chuyển đến
  // ----------------------------------------------------
  const [interFromBranch, setInterFromBranch] = useState(BRANCHES_DATA[1]?.name || BRANCHES_DATA[0].name);
  const [interFromCampus, setInterFromCampus] = useState(ALL_CAMPUSES[0].name);
  const [interFromClassId, setInterFromClassId] = useState(classes[0]?.id || '');
  const [interStudentName, setInterStudentName] = useState('');
  const [interStudentId, setInterStudentId] = useState('');

  const [interToBranch, setInterToBranch] = useState(BRANCHES_DATA[1]?.name || BRANCHES_DATA[0].name);
  const [interToCampus, setInterToCampus] = useState(ALL_CAMPUSES[0].name);
  const [interToClassId, setInterToClassId] = useState(classes[1]?.id || classes[0]?.id || '');
  const [interReason, setInterReason] = useState('Chuyển lớp để phù hợp phân ban và thuận tiện đưa đón');
  const [interDecisionNo, setInterDecisionNo] = useState('');
  const [interEffectiveDate, setInterEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  const interFromCampuses = useMemo(() => {
    const branch = BRANCHES_DATA.find((b) => b.name === interFromBranch);
    return branch ? branch.campuses : ALL_CAMPUSES;
  }, [interFromBranch]);

  const interFromClasses = useMemo(() => {
    return classes.filter((c) => c.campusName === interFromCampus);
  }, [classes, interFromCampus]);

  const interToCampuses = useMemo(() => {
    const branch = BRANCHES_DATA.find((b) => b.name === interToBranch);
    return branch ? branch.campuses : ALL_CAMPUSES;
  }, [interToBranch]);

  const interToClasses = useMemo(() => {
    return classes.filter((c) => c.campusName === interToCampus);
  }, [classes, interToCampus]);

  const interFromClassObj = classes.find((c) => c.id === interFromClassId);
  const interToClassObj = classes.find((c) => c.id === interToClassId);

  const isInternalSameBranch = interFromBranch === interToBranch;

  // ----------------------------------------------------
  // Form 3.3: Chuyển đi trường khác
  // Phân hiệu chuyển đi, điểm trường chuyển đi, lớp chuyển đi, Giáo viên chủ nhiệm chuyển đi, họ tên HS, trường chuyển đến
  // ----------------------------------------------------
  const [outFromBranch, setOutFromBranch] = useState(BRANCHES_DATA[1]?.name || BRANCHES_DATA[0].name);
  const [outFromCampus, setOutFromCampus] = useState(ALL_CAMPUSES[0].name);
  const [outFromClassId, setOutFromClassId] = useState(classes[0]?.id || '');
  const [outStudentName, setOutStudentName] = useState('');
  const [outStudentId, setOutStudentId] = useState('');
  const [outTargetSchool, setOutTargetSchool] = useState('');
  const [outProvinceCity, setOutProvinceCity] = useState('Phú Yên');
  const [outDecisionNo, setOutDecisionNo] = useState('');
  const [outReason, setOutReason] = useState('Theo gia đình chuyển nơi cư trú');
  const [outEffectiveDate, setOutEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  const outFromCampuses = useMemo(() => {
    const branch = BRANCHES_DATA.find((b) => b.name === outFromBranch);
    return branch ? branch.campuses : ALL_CAMPUSES;
  }, [outFromBranch]);

  const outFromClasses = useMemo(() => {
    return classes.filter((c) => c.campusName === outFromCampus);
  }, [classes, outFromCampus]);

  const outFromClassObj = classes.find((c) => c.id === outFromClassId);

  // ----------------------------------------------------
  // FILTER VISIBILITY BY SECURITY RULE
  // Nếu chuyển trong cùng phân hiệu: chỉ GV, CNV phân hiệu đó xem được
  // Nếu chuyển khác phân hiệu hoặc ra khỏi trường hoặc từ ngoài đến: toàn trường đều thấy
  // ----------------------------------------------------
  const visibleTransfers = useMemo(() => {
    return transfersList.filter((tr) => canViewTransferRecord(currentUser, tr));
  }, [transfersList, currentUser]);

  const filteredTransfers = useMemo(() => {
    return visibleTransfers.filter((tr) => {
      if (categoryFilter !== 'ALL' && tr.transferCategory !== categoryFilter) return false;
      if (branchFilter !== 'ALL') {
        const matchFrom = tr.fromBranchName?.includes(branchFilter);
        const matchTo = tr.toBranchName?.includes(branchFilter);
        if (!matchFrom && !matchTo) return false;
      }
      if (campusFilter !== 'ALL') {
        const matchFrom = tr.fromCampusName === campusFilter;
        const matchTo = tr.toCampusName === campusFilter;
        if (!matchFrom && !matchTo) return false;
      }
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'CHO_DUYET' && tr.approvalStatus !== 'Chờ duyệt') return false;
        if (statusFilter === 'CHO_NHAN' && tr.approvalStatus !== 'Chờ GVCN nhận lớp' && tr.approvalStatus !== 'Đã duyệt') return false;
        if (statusFilter === 'HOAN_TAT' && tr.approvalStatus !== 'Đã tiếp nhận' && tr.approvalStatus !== 'Đã hoàn tất hồ sơ') return false;
        if (statusFilter === 'TU_CHOI' && tr.approvalStatus !== 'Từ chối') return false;
      }
      if (timeFilter !== 'ALL') {
        const month = parseInt((tr.effectiveDate || '').split('-')[1] || '0', 10);
        if (timeFilter === 'HK1' && (month < 8 || month > 12)) return false;
        if (timeFilter === 'HK2' && (month < 1 || month > 5)) return false;
        if (timeFilter.startsWith('THANG_')) {
          const targetM = parseInt(timeFilter.replace('THANG_', ''), 10);
          if (month !== targetM) return false;
        }
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = tr.studentName.toLowerCase().includes(term);
        const matchClass = (tr.fromClassName || tr.className || '').toLowerCase().includes(term) || (tr.toClassName || '').toLowerCase().includes(term);
        const matchSchool = (tr.transferSchool || '').toLowerCase().includes(term);
        const matchDec = (tr.decisionNumber || '').toLowerCase().includes(term);
        const matchTeacher = (tr.fromGvcnName || tr.gvcnName || '').toLowerCase().includes(term) || (tr.toGvcnName || '').toLowerCase().includes(term);
        if (!matchName && !matchClass && !matchSchool && !matchDec && !matchTeacher) return false;
      }
      return true;
    });
  }, [visibleTransfers, categoryFilter, branchFilter, campusFilter, statusFilter, timeFilter, searchTerm]);

  // ----------------------------------------------------
  // SUBMISSIONS
  // ----------------------------------------------------
  // Submit Form 3.1
  const handleSubmitTransferIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inStudentName.trim() || !inTargetClassId) return;

    const targetCls = classes.find((c) => c.id === inTargetClassId);
    if (!targetCls) return;

    // 1. Add student to target class
    storageService.addStudentToClass(
      targetCls.id,
      {
        fullName: inStudentName.trim(),
        gender: inGender,
        dob: inDob,
        parentName: inParentName.trim() || 'Phụ huynh HS',
        parentPhone: inParentPhone.trim() || '0983112233',
        policyBeneficiary: 'Không',
        isTransferIn: true,
        previousSchool: inPreviousSchool.trim() || 'Trường bạn',
        provinceCity: inProvinceCity.trim(),
        decisionNumber: inDecisionNo.trim() || `QĐ-TN-${Math.floor(100 + Math.random() * 900)}/THCSDX`,
        transferReason: inReason.trim(),
      },
      activeSchoolYear
    );

    // 2. Add transfer report to publish on Page 5
    const approverLabel = currentUser?.role === 'HT'
      ? 'Hiệu trưởng Nguyễn Quốc Bảo'
      : currentUser?.role === 'PHT'
      ? `Phó Hiệu trưởng ${currentUser.name}`
      : 'Ban Giám hiệu trường Đồng Xuân';

    storageService.addStudentTransferReport(
      {
        type: 'CHUYEN_DEN',
        transferCategory: 'DEN_TU_TRUONG_KHAC',
        studentName: inStudentName.trim(),
        gender: inGender,
        dob: inDob,
        toBranchName: inTargetBranch,
        toCampusName: inTargetCampus,
        toClassId: targetCls.id,
        toClassName: targetCls.name,
        toGvcnId: targetCls.homeroomTeacherId,
        toGvcnName: targetCls.homeroomTeacherName,
        classId: targetCls.id,
        className: targetCls.name,
        campusName: inTargetCampus,
        transferSchool: inPreviousSchool.trim() || 'Trường ngoài huyện/tỉnh',
        provinceCity: inProvinceCity.trim(),
        reason: inReason.trim(),
        decisionNumber: inDecisionNo.trim() || `QĐ-TN-${Math.floor(100 + Math.random() * 900)}/THCSDX`,
        effectiveDate: inEffectiveDate,
        approvalStatus: 'Đã hoàn tất hồ sơ',
        approvedBy: approverLabel,
        approvedRole: currentUser?.position || 'Ban Giám hiệu',
        approvalDate: inEffectiveDate,
        isReceivedByTargetGvcn: true,
        receivedDate: inEffectiveDate,
        receivedByGvcnName: targetCls.homeroomTeacherName,
        visibilityScope: 'TOAN_TRUONG',
        gvcnId: targetCls.homeroomTeacherId,
        gvcnName: targetCls.homeroomTeacherName,
      },
      activeSchoolYear
    );

    const updated = storageService.getStudentTransfers(activeSchoolYear);
    setTransfersList(updated);
    setShowModalIn(false);
    setInStudentName('');
    setToastMessage(`Đã tiếp nhận thành công em ${inStudentName} vào lớp ${targetCls.name}!`);
    setTimeout(() => setToastMessage(null), 5000);
    onRefreshData?.();
  };

  // Submit Form 3.2
  const handleSubmitInternalTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interStudentName.trim() || !interFromClassId || !interToClassId) return;
    if (interFromClassId === interToClassId) {
      alert('Lớp chuyển đến phải khác lớp chuyển đi!');
      return;
    }

    const fromCls = classes.find((c) => c.id === interFromClassId);
    const toCls = classes.find((c) => c.id === interToClassId);
    if (!fromCls || !toCls) return;

    const isSameBranch = interFromBranch === interToBranch;
    const category: StudentTransferCategory = isSameBranch
      ? 'NOI_BO_CUNG_PHAN_HIEU'
      : 'NOI_BO_KHAC_PHAN_HIEU';

    storageService.addStudentTransferReport(
      {
        type: 'CHUYEN_DI',
        transferCategory: category,
        studentId: interStudentId || `${fromCls.id}_HS_${Date.now().toString().slice(-3)}`,
        studentName: interStudentName.trim(),
        fromBranchName: interFromBranch,
        fromCampusName: interFromCampus,
        fromClassId: fromCls.id,
        fromClassName: fromCls.name,
        fromGvcnId: fromCls.homeroomTeacherId,
        fromGvcnName: fromCls.homeroomTeacherName,
        toBranchName: interToBranch,
        toCampusName: interToCampus,
        toClassId: toCls.id,
        toClassName: toCls.name,
        toGvcnId: toCls.homeroomTeacherId,
        toGvcnName: toCls.homeroomTeacherName,
        classId: fromCls.id,
        className: fromCls.name,
        campusName: interFromCampus,
        effectiveDate: interEffectiveDate,
        reason: interReason.trim(),
        decisionNumber: interDecisionNo.trim() || `PĐC-${Math.floor(100 + Math.random() * 900)}/THCSDX`,
        approvalStatus: 'Chờ duyệt',
        approverRequired: isSameBranch ? 'HT_HOAC_PHT' : 'CHI_HT',
        visibilityScope: isSameBranch ? 'NOI_BO_PHAN_HIEU' : 'TOAN_TRUONG',
        gvcnId: fromCls.homeroomTeacherId,
        gvcnName: fromCls.homeroomTeacherName,
      },
      activeSchoolYear
    );

    const updated = storageService.getStudentTransfers(activeSchoolYear);
    setTransfersList(updated);
    setShowModalInternal(false);
    setInterStudentName('');
    setToastMessage(
      `Đã gửi phiếu chuyển lớp em ${interStudentName} từ Lớp ${fromCls.name} sang Lớp ${toCls.name}! (${
        isSameBranch ? 'Cần HT hoặc PHT phân hiệu duyệt' : 'Chỉ có Hiệu trưởng được duyệt'
      })`
    );
    setTimeout(() => setToastMessage(null), 6000);
    onRefreshData?.();
  };

  // Submit Form 3.3
  const handleSubmitTransferOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outStudentName.trim() || !outFromClassId || !outTargetSchool.trim()) return;

    const fromCls = classes.find((c) => c.id === outFromClassId);
    if (!fromCls) return;

    storageService.addStudentTransferReport(
      {
        type: 'CHUYEN_DI',
        transferCategory: 'CHUYEN_DI_TRUONG_KHAC',
        studentId: outStudentId || `${fromCls.id}_HS_${Date.now().toString().slice(-3)}`,
        studentName: outStudentName.trim(),
        fromBranchName: outFromBranch,
        fromCampusName: outFromCampus,
        fromClassId: fromCls.id,
        fromClassName: fromCls.name,
        fromGvcnId: fromCls.homeroomTeacherId,
        fromGvcnName: fromCls.homeroomTeacherName,
        classId: fromCls.id,
        className: fromCls.name,
        campusName: outFromCampus,
        transferSchool: outTargetSchool.trim(),
        provinceCity: outProvinceCity.trim(),
        effectiveDate: outEffectiveDate,
        reason: outReason.trim(),
        decisionNumber: outDecisionNo.trim() || `GGT-${Math.floor(100 + Math.random() * 900)}/THCSDX`,
        approvalStatus: 'Chờ duyệt',
        approverRequired: 'HT_HOAC_PHT',
        visibilityScope: 'TOAN_TRUONG',
        gvcnId: fromCls.homeroomTeacherId,
        gvcnName: fromCls.homeroomTeacherName,
      },
      activeSchoolYear
    );

    const updated = storageService.getStudentTransfers(activeSchoolYear);
    setTransfersList(updated);
    setShowModalOut(false);
    setOutStudentName('');
    setOutTargetSchool('');
    setToastMessage(`Đã lập phiếu chuyển đi trường khác cho em ${outStudentName}! (Chờ HT hoặc PHT phê duyệt)`);
    setTimeout(() => setToastMessage(null), 6000);
    onRefreshData?.();
  };

  // Approval handler
  const handleApprove = (report: StudentTransferReport) => {
    const perm = canApproveTransferRecord(currentUser, report);
    if (!perm.canApprove) {
      alert(perm.reason || 'Bạn không có quyền duyệt phiếu chuyển này!');
      return;
    }
    const approverName = currentUser?.name || 'Ban Giám hiệu';
    const approverRole = currentUser?.role === 'HT' ? 'Hiệu trưởng' : 'Phó Hiệu trưởng';
    storageService.approveStudentTransferReport(report.id, approverName, approverRole, activeSchoolYear);
    const updated = storageService.getStudentTransfers(activeSchoolYear);
    setTransfersList(updated);
    onRefreshData?.();
    setToastMessage(`Đã phê duyệt phiếu chuyển em ${report.studentName} thành công!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Rejection handler
  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForReject || !rejectComment.trim()) return;

    const approverName = currentUser?.name || 'Ban Giám hiệu';
    const approverRole = currentUser?.role === 'HT' ? 'Hiệu trưởng' : 'Phó Hiệu trưởng';
    storageService.rejectStudentTransferReport(
      selectedReportForReject.id,
      approverName,
      approverRole,
      rejectComment.trim(),
      activeSchoolYear
    );

    const updated = storageService.getStudentTransfers(activeSchoolYear);
    setTransfersList(updated);
    setShowRejectModal(false);
    setSelectedReportForReject(null);
    setRejectComment('');
    onRefreshData?.();
    setToastMessage(`Đã từ chối phiếu chuyển của em ${selectedReportForReject.studentName}.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Target GVCN receives student
  const handleReceive = (report: StudentTransferReport) => {
    if (!canReceiveTransferStudent(currentUser, report)) {
      alert('Chỉ GVCN của lớp nhận mới có quyền bấm nhận học sinh!');
      return;
    }
    const receiverName = currentUser?.name || report.toGvcnName || 'GVCN lớp nhận';
    storageService.receiveTransferStudent(report.id, receiverName, activeSchoolYear);
    const updated = storageService.getStudentTransfers(activeSchoolYear);
    setTransfersList(updated);
    onRefreshData?.();
    setToastMessage(
      `GVCN ${receiverName} đã tiếp nhận thành công em ${report.studentName} vào lớp ${report.toClassName}! Sĩ số lớp đã tự động tăng.`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  // ----------------------------------------------------
  // STATISTICS & REPORTS CALCULATION
  // ----------------------------------------------------
  // 1. By Branch Stats
  const branchStats = useMemo(() => {
    return BRANCHES_DATA.map((b) => {
      const branchClasses = classes.filter((c) => c.branchName === b.name);
      const currentStudents = branchClasses.reduce((acc, c) => acc + c.totalStudents, 0);

      // In from outside
      const inExt = visibleTransfers.filter(
        (t) => t.toBranchName === b.name && t.transferCategory === 'DEN_TU_TRUONG_KHAC'
      ).length;

      // Out to outside
      const outExt = visibleTransfers.filter(
        (t) => t.fromBranchName === b.name && t.transferCategory === 'CHUYEN_DI_TRUONG_KHAC'
      ).length;

      // Internal inter-branch out
      const internalOut = visibleTransfers.filter(
        (t) => t.fromBranchName === b.name && t.transferCategory === 'NOI_BO_KHAC_PHAN_HIEU'
      ).length;

      // Internal inter-branch in
      const internalIn = visibleTransfers.filter(
        (t) => t.toBranchName === b.name && t.transferCategory === 'NOI_BO_KHAC_PHAN_HIEU'
      ).length;

      // Same branch
      const sameBranch = visibleTransfers.filter(
        (t) => t.fromBranchName === b.name && t.transferCategory === 'NOI_BO_CUNG_PHAN_HIEU'
      ).length;

      const netChange = inExt + internalIn - (outExt + internalOut);

      return {
        branchName: b.name,
        classesCount: branchClasses.length,
        currentStudents,
        inExt,
        outExt,
        internalOut,
        internalIn,
        sameBranch,
        netChange,
      };
    });
  }, [classes, visibleTransfers]);

  // 2. By Campus Stats
  const campusStats = useMemo(() => {
    return ALL_CAMPUSES.map((camp) => {
      const campClasses = classes.filter((c) => c.campusName === camp.name);
      const currentStudents = campClasses.reduce((acc, c) => acc + c.totalStudents, 0);

      const inCount = visibleTransfers.filter(
        (t) => t.toCampusName === camp.name && (t.type === 'CHUYEN_DEN' || t.approvalStatus === 'Đã tiếp nhận')
      ).length;

      const outCount = visibleTransfers.filter(
        (t) => t.fromCampusName === camp.name && (t.type === 'CHUYEN_DI' && (t.approvalStatus === 'Đã hoàn tất hồ sơ' || t.approvalStatus === 'Đã tiếp nhận'))
      ).length;

      return {
        campusName: camp.name,
        branchName: camp.branchName,
        classesCount: campClasses.length,
        currentStudents,
        inCount,
        outCount,
        netChange: inCount - outCount,
      };
    });
  }, [classes, visibleTransfers]);

  // ==========================================
  // RECHARTS DATA PREPARATION (YÊU CẦU BIỂU ĐỒ TRANG 5)
  // ==========================================
  const [chartMetricType, setChartMetricType] = useState<'branch' | 'grade' | 'trend'>('branch');

  // 1. Phân tích xu hướng biến động theo từng phân hiệu
  const chartDataByBranch = useMemo(() => {
    return BRANCHES_DATA.map((b) => {
      const branchClasses = classes.filter((c) => c.branchName === b.name);
      const currentStudents = branchClasses.reduce((acc, c) => acc + c.totalStudents, 0);

      const chuyenDen = visibleTransfers.filter(
        (t) => t.toBranchName === b.name && (t.type === 'CHUYEN_DEN' || t.approvalStatus === 'Đã tiếp nhận')
      ).length;

      const chuyenDi = visibleTransfers.filter(
        (t) => t.fromBranchName === b.name && (t.type === 'CHUYEN_DI' && (t.approvalStatus === 'Đã hoàn tất hồ sơ' || t.approvalStatus === 'Đã tiếp nhận'))
      ).length;

      const shortName = b.name
        .replace('Phân hiệu TH và THCS ', '')
        .replace('Phân hiệu TH ', '')
        .replace('Trụ sở chính ', '');

      return {
        name: shortName,
        fullName: b.name,
        'Chuyển Đến': chuyenDen,
        'Chuyển Đi': chuyenDi,
        'Tăng Giảm Ròng': chuyenDen - chuyenDi,
        'Sĩ Số Hiện Tại': currentStudents,
      };
    });
  }, [classes, visibleTransfers]);

  // 2. Phân tích xu hướng biến động theo từng khối lớp (Khối 1 - 9)
  const chartDataByGrade = useMemo(() => {
    const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    return grades.map((g) => {
      const gradeClasses = classes.filter((c) => c.grade === g);
      const currentStudents = gradeClasses.reduce((acc, c) => acc + c.totalStudents, 0);

      // Chuyển đến khối này
      const chuyenDen = visibleTransfers.filter((t) => {
        const targetCls = classes.find((c) => c.name === t.toClassName || c.id === t.toClassId);
        return targetCls?.grade === g && (t.type === 'CHUYEN_DEN' || t.approvalStatus === 'Đã tiếp nhận');
      }).length;

      // Chuyển đi từ khối này
      const chuyenDi = visibleTransfers.filter((t) => {
        const fromCls = classes.find((c) => c.name === t.fromClassName || c.id === t.fromClassId);
        return fromCls?.grade === g && (t.type === 'CHUYEN_DI' && (t.approvalStatus === 'Đã hoàn tất hồ sơ' || t.approvalStatus === 'Đã tiếp nhận'));
      }).length;

      return {
        name: `Khối ${g}`,
        grade: g,
        level: g <= 5 ? 'Tiểu học' : 'THCS',
        'Chuyển Đến': chuyenDen,
        'Chuyển Đi': chuyenDi,
        'Tăng Giảm Ròng': chuyenDen - chuyenDi,
        'Sĩ Số Hiện Tại': currentStudents,
      };
    });
  }, [classes, visibleTransfers]);

  // 3. Xu hướng biến động chuyển đi / đến theo thời gian trong năm học
  const chartDataByMonth = useMemo(() => {
    const monthDefs = [
      { key: '08', label: 'T8' },
      { key: '09', label: 'T9' },
      { key: '10', label: 'T10' },
      { key: '11', label: 'T11' },
      { key: '12', label: 'T12' },
      { key: '01', label: 'T1' },
      { key: '02', label: 'T2' },
      { key: '03', label: 'T3' },
      { key: '04', label: 'T4' },
      { key: '05', label: 'T5' },
    ];

    return monthDefs.map((m) => {
      const chuyenDen = visibleTransfers.filter((t) => {
        const month = (t.effectiveDate || '').split('-')[1];
        return month === m.key && (t.type === 'CHUYEN_DEN' || t.approvalStatus === 'Đã tiếp nhận');
      }).length;

      const chuyenDi = visibleTransfers.filter((t) => {
        const month = (t.effectiveDate || '').split('-')[1];
        return month === m.key && (t.type === 'CHUYEN_DI' && (t.approvalStatus === 'Đã hoàn tất hồ sơ' || t.approvalStatus === 'Đã tiếp nhận'));
      }).length;

      return {
        name: m.label,
        'Chuyển Đến': chuyenDen,
        'Chuyển Đi': chuyenDi,
        'Tăng Giảm Ròng': chuyenDen - chuyenDi,
      };
    });
  }, [visibleTransfers]);

  // 3. Overall KPI Metrics
  const totalTransfers = visibleTransfers.length;
  const inFromOutsideCount = visibleTransfers.filter((t) => t.transferCategory === 'DEN_TU_TRUONG_KHAC').length;
  const internalSameCount = visibleTransfers.filter((t) => t.transferCategory === 'NOI_BO_CUNG_PHAN_HIEU').length;
  const internalDiffCount = visibleTransfers.filter((t) => t.transferCategory === 'NOI_BO_KHAC_PHAN_HIEU').length;
  const outToOutsideCount = visibleTransfers.filter((t) => t.transferCategory === 'CHUYEN_DI_TRUONG_KHAC').length;
  const pendingApprovalCount = visibleTransfers.filter((t) => t.approvalStatus === 'Chờ duyệt').length;
  const pendingReceiveCount = visibleTransfers.filter(
    (t) => (t.approvalStatus === 'Chờ GVCN nhận lớp' || t.approvalStatus === 'Đã duyệt') && !t.isReceivedByTargetGvcn && t.type !== 'CHUYEN_DEN'
  ).length;

  return (
    <div className="space-y-6">
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

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-red-900 via-rose-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-red-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                TRANG THỨ 5: BIẾN ĐỘNG HỌC SINH (CHUYỂN ĐI - CHUYỂN ĐẾN)
              </span>
              <span className="text-xs text-rose-200 font-semibold">Năm học {activeSchoolYear}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Cổng Quản Lý Biến Động Học Sinh Toàn Trường & Các Phân Hiệu
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-3xl leading-relaxed">
              Trang thứ 5 chỉ hiển thị thông tin chuyển đi, chuyển đến của học sinh • Phân quyền bảo mật: Chuyển nội bộ cùng phân hiệu xem nội bộ phân hiệu; chuyển khác phân hiệu hoặc ra ngoài trường công khai toàn trường • Báo cáo thống kê đa chiều theo thời điểm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 3.1 Button */}
            <button
              type="button"
              onClick={() => setShowModalIn(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow transition flex items-center gap-1.5 active:scale-95"
              title="Khai báo thông tin mới cho học sinh từ trường khác chuyển đến vào danh sách lớp"
            >
              <PlusCircle className="w-4 h-4 text-purple-200" />
              <span>+ HS Từ Trường Khác Đến (3.1)</span>
            </button>

            {/* 3.2 Button */}
            <button
              type="button"
              onClick={() => setShowModalInternal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition flex items-center gap-1.5 active:scale-95"
              title="GVCN kích nút chuyển để chuyển lớp trong cùng trường"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-200" />
              <span>+ Chuyển Lớp Trong Trường (3.2)</span>
            </button>

            {/* 3.3 Button */}
            <button
              type="button"
              onClick={() => setShowModalOut(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition flex items-center gap-1.5 active:scale-95"
              title="Kích nút chuyển để báo cáo học sinh chuyển đi trường khác"
            >
              <Send className="w-4 h-4 text-rose-200" />
              <span>+ Chuyển Đi Trường Khác (3.3)</span>
            </button>
          </div>
        </div>

        {/* Security Rule Info Banner */}
        <div className="mt-4 pt-3 border-t border-white/20 text-[11px] text-rose-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Bảo mật phân quyền Trang 5:</strong> Chuyển trong cùng phân hiệu chỉ GV, CNV phân hiệu đó xem được; Chuyển khác phân hiệu hoặc ra khỏi trường toàn trường đều thấy.
            </span>
          </div>
          <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-[10px]">
            Đang xem: <strong>{currentUser?.name || 'Khách'}</strong> ({currentUser?.position || 'Chưa đăng nhập'} - {currentUser?.branchName || 'Toàn trường'})
          </span>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng Biến Động</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{totalTransfers}</div>
          <span className="text-[10px] text-slate-500">Được phép xem</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-purple-700 uppercase">Từ Ngoài Đến (3.1)</span>
          <div className="text-xl font-black text-purple-700 mt-0.5">{inFromOutsideCount}</div>
          <span className="text-[10px] text-purple-500">Tiếp nhận mới</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-blue-700 uppercase">Cùng Phân Hiệu (3.2)</span>
          <div className="text-xl font-black text-blue-700 mt-0.5">{internalSameCount}</div>
          <span className="text-[10px] text-blue-500">HT/PHT duyệt</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Khác Phân Hiệu (3.2)</span>
          <div className="text-xl font-black text-amber-700 mt-0.5">{internalDiffCount}</div>
          <span className="text-[10px] text-amber-600 font-bold">Chỉ HT duyệt</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-rose-700 uppercase">Đi Trường Khác (3.3)</span>
          <div className="text-xl font-black text-rose-700 mt-0.5">{outToOutsideCount}</div>
          <span className="text-[10px] text-rose-500">Chuyển trường ngoài</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-emerald-700 uppercase">Chờ Xử Lý</span>
          <div className="text-xl font-black text-emerald-700 mt-0.5">
            {pendingApprovalCount + pendingReceiveCount}
          </div>
          <span className="text-[10px] text-emerald-600">
            {pendingApprovalCount} duyệt • {pendingReceiveCount} nhận
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation on Page 5 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-red-700 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Danh Sách Biến Động ({filteredTransfers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('by_branch')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'by_branch'
                ? 'bg-red-700 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>2. Thống Kê Theo Phân Hiệu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('by_campus')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'by_campus'
                ? 'bg-red-700 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>📍 3. Thống Kê 11 Điểm Trường</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('by_time')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'by_time'
                ? 'bg-red-700 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>4. Thống Kê Theo Thời Điểm</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chart_analysis')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'chart_analysis'
                ? 'bg-red-700 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-red-600" />
            <span className="font-extrabold text-red-700">5. Phân Tích Biểu Đồ (Recharts)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('official_report')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'official_report'
                ? 'bg-red-700 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>6. Báo Cáo Tổng Hợp Toàn Trường</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 transition"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>In Báo Cáo</span>
        </button>
      </div>

      {/* TAB 1: DANH SÁCH BIẾN ĐỘNG */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm học sinh, lớp, trường, GVCN, số QĐ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-red-500 font-medium"
                />
              </div>

              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              >
                <option value="ALL">-- Tất cả Phân hiệu --</option>
                {BRANCHES_DATA.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              >
                <option value="ALL">-- Tất cả phân loại --</option>
                <option value="DEN_TU_TRUONG_KHAC">3.1: Từ trường khác chuyển đến</option>
                <option value="NOI_BO_CUNG_PHAN_HIEU">3.2: Chuyển nội bộ cùng phân hiệu</option>
                <option value="NOI_BO_KHAC_PHAN_HIEU">3.2: Chuyển nội bộ khác phân hiệu</option>
                <option value="CHUYEN_DI_TRUONG_KHAC">3.3: Chuyển đi trường khác</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              >
                <option value="ALL">-- Tất cả trạng thái --</option>
                <option value="CHO_DUYET">Chờ BGH duyệt</option>
                <option value="CHO_NHAN">Chờ GVCN nhận lớp</option>
                <option value="HOAN_TAT">Đã tiếp nhận / Hoàn tất</option>
                <option value="TU_CHOI">Bị từ chối</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-red-600" />
                Danh Sách Hồ Sơ Biến Động Học Sinh ({filteredTransfers.length} phiếu)
              </h3>
              <span className="text-[11px] text-slate-500">
                Đã kiểm tra quyền xem theo phân hiệu của từng tài khoản
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Loại Biến Động</th>
                    <th className="py-3 px-3">Học Sinh</th>
                    <th className="py-3 px-3">Nơi Chuyển Đi</th>
                    <th className="py-3 px-3">Nơi Chuyển Đến</th>
                    <th className="py-3 px-3">Quyết Định & Lý Do</th>
                    <th className="py-3 px-3">Thẩm Quyền & Phê Duyệt</th>
                    <th className="py-3 px-3 text-center">Trạng Thái & Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Không có hồ sơ chuyển đi / chuyển đến nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map((tr) => {
                      const approveCheck = canApproveTransferRecord(currentUser, tr);
                      const canReceive = canReceiveTransferStudent(currentUser, tr);

                      return (
                        <tr key={tr.id} className="hover:bg-slate-50 transition">
                          {/* Loại biến động */}
                          <td className="py-3 px-3">
                            {tr.transferCategory === 'DEN_TU_TRUONG_KHAC' && (
                              <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold text-[10px] border border-purple-200 block text-center">
                                Từ ngoài chuyển đến (3.1)
                              </span>
                            )}
                            {tr.transferCategory === 'NOI_BO_CUNG_PHAN_HIEU' && (
                              <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200 block text-center">
                                Cùng phân hiệu (3.2)
                              </span>
                            )}
                            {tr.transferCategory === 'NOI_BO_KHAC_PHAN_HIEU' && (
                              <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300 block text-center">
                                Khác phân hiệu (3.2)
                              </span>
                            )}
                            {tr.transferCategory === 'CHUYEN_DI_TRUONG_KHAC' && (
                              <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200 block text-center">
                                Đi trường khác (3.3)
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 block text-center mt-1 font-mono">
                              {tr.effectiveDate}
                            </span>
                          </td>

                          {/* Học sinh */}
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-slate-900">{tr.studentName}</div>
                            <div className="text-[10px] text-slate-500">
                              {tr.gender} {tr.dob ? `• Sinh: ${tr.dob}` : ''}
                            </div>
                          </td>

                          {/* Nơi chuyển đi */}
                          <td className="py-3 px-3">
                            {tr.transferCategory === 'DEN_TU_TRUONG_KHAC' ? (
                              <div>
                                <span className="font-bold text-purple-800">{tr.transferSchool}</span>
                                <div className="text-[10px] text-slate-400">{tr.provinceCity || 'Ngoài trường'}</div>
                              </div>
                            ) : (
                              <div>
                                <span className="font-bold text-slate-800">Lớp {tr.fromClassName || tr.className}</span>
                                <div className="text-[10px] text-slate-500">{tr.fromCampusName || tr.campusName}</div>
                                <div className="text-[10px] text-slate-400">GVCN: {tr.fromGvcnName || tr.gvcnName}</div>
                              </div>
                            )}
                          </td>

                          {/* Nơi chuyển đến */}
                          <td className="py-3 px-3">
                            {tr.transferCategory === 'CHUYEN_DI_TRUONG_KHAC' ? (
                              <div>
                                <span className="font-bold text-rose-800">{tr.transferSchool}</span>
                                <div className="text-[10px] text-slate-400">{tr.provinceCity || 'Ngoài trường'}</div>
                              </div>
                            ) : (
                              <div>
                                <span className="font-bold text-emerald-800">Lớp {tr.toClassName || tr.className}</span>
                                <div className="text-[10px] text-slate-500">{tr.toCampusName || tr.campusName}</div>
                                <div className="text-[10px] text-slate-400">GVCN nhận: {tr.toGvcnName || tr.gvcnName}</div>
                              </div>
                            )}
                          </td>

                          {/* Quyết định & Lý do */}
                          <td className="py-3 px-3 max-w-xs">
                            <div className="font-mono text-[10px] font-bold text-slate-700">
                              {tr.decisionNumber || 'Chưa có số QĐ'}
                            </div>
                            <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5" title={tr.reason}>
                              {tr.reason}
                            </div>
                          </td>

                          {/* Thẩm quyền & Phê duyệt */}
                          <td className="py-3 px-3">
                            <div className="text-[10px] mb-1">
                              {tr.transferCategory === 'NOI_BO_KHAC_PHAN_HIEU' ? (
                                <span className="text-amber-800 font-bold block bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  ⚖️ Chỉ có HT được duyệt
                                </span>
                              ) : (
                                <span className="text-blue-800 font-semibold block bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  ⚖️ HT hoặc PHT phân hiệu duyệt
                                </span>
                              )}
                            </div>
                            {tr.approvedBy ? (
                              <div className="text-[10px] text-slate-600">
                                <div>Duyệt bởi: <strong>{tr.approvedBy}</strong></div>
                                <div className="text-slate-400 font-mono">{tr.approvalDate}</div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-amber-600 italic">Chưa duyệt</span>
                            )}
                          </td>

                          {/* Trạng thái & Thao tác */}
                          <td className="py-3 px-3 text-center">
                            {tr.approvalStatus === 'Chờ duyệt' && (
                              <div className="space-y-1.5">
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold block">
                                  Chờ BGH duyệt
                                </span>
                                {approveCheck.canApprove ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleApprove(tr)}
                                      className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm"
                                    >
                                      <Check className="w-3 h-3" />
                                      Duyệt
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedReportForReject(tr);
                                        setShowRejectModal(true);
                                      }}
                                      className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm"
                                    >
                                      <X className="w-3 h-3" />
                                      Từ chối
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-slate-400 block" title={approveCheck.reason}>
                                    {approveCheck.reason || 'Chưa đủ thẩm quyền'}
                                  </span>
                                )}
                              </div>
                            )}

                            {(tr.approvalStatus === 'Chờ GVCN nhận lớp' || (tr.approvalStatus === 'Đã duyệt' && !tr.isReceivedByTargetGvcn && tr.type !== 'CHUYEN_DEN')) && (
                              <div className="space-y-1.5">
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold block">
                                  Đã duyệt - Chờ nhận lớp
                                </span>
                                {canReceive ? (
                                  <button
                                    type="button"
                                    onClick={() => handleReceive(tr)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] shadow transition animate-pulse block mx-auto"
                                    title="GVCN bấm nút nhận để tiếp nhận học sinh vào lớp mới"
                                  >
                                    📥 Bấm Nhận Học Sinh
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-slate-400 block">
                                    Chờ GVCN {tr.toGvcnName} nhận
                                  </span>
                                )}
                              </div>
                            )}

                            {(tr.approvalStatus === 'Đã tiếp nhận' || tr.approvalStatus === 'Đã hoàn tất hồ sơ') && (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold block">
                                  ✓ Đã hoàn tất hồ sơ
                                </span>
                                {tr.receivedByGvcnName && (
                                  <span className="text-[9px] text-slate-400 block">
                                    GVCN {tr.receivedByGvcnName} đã nhận ({tr.receivedDate})
                                  </span>
                                )}
                              </div>
                            )}

                            {tr.approvalStatus === 'Từ chối' && (
                              <div>
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold block">
                                  Từ chối
                                </span>
                                {tr.rejectionReason && (
                                  <span className="text-[9px] text-rose-600 block line-clamp-1" title={tr.rejectionReason}>
                                    {tr.rejectionReason}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THỐNG KÊ THEO TỪNG PHÂN HIỆU */}
      {activeTab === 'by_branch' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                Bảng Thống Kê Theo Dõi Biến Động Học Sinh Ở Từng Phân Hiệu
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi số lượng học sinh chuyển đến, chuyển đi nội bộ và chuyển đi trường khác tại 4 đơn vị
              </p>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
              Năm học {activeSchoolYear}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Phân Hiệu</th>
                  <th className="py-2.5 px-3 text-center">Số Lớp</th>
                  <th className="py-2.5 px-3 text-center text-purple-700">Chuyển Đến Ngoài (+)</th>
                  <th className="py-2.5 px-3 text-center text-rose-700">Chuyển Đi Ngoài (-)</th>
                  <th className="py-2.5 px-3 text-center text-blue-700">Chuyển Cùng Phân Hiệu (±)</th>
                  <th className="py-2.5 px-3 text-center text-amber-700">Đi Khác Phân Hiệu (-)</th>
                  <th className="py-2.5 px-3 text-center text-emerald-700">Đến Từ Phân Hiệu Khác (+)</th>
                  <th className="py-2.5 px-3 text-center font-black">Sĩ Số Hiện Tại</th>
                  <th className="py-2.5 px-3 text-center">Biến Động Ròng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchStats.map((bs, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{bs.branchName}</td>
                    <td className="py-2.5 px-3 text-center font-medium">{bs.classesCount}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-purple-700">+{bs.inExt}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-700">-{bs.outExt}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-blue-700">{bs.sameBranch}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-amber-700">-{bs.internalOut}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-emerald-700">+{bs.internalIn}</td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900 text-sm">
                      {bs.currentStudents}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          bs.netChange > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : bs.netChange < 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {bs.netChange > 0 ? `+${bs.netChange}` : bs.netChange}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3 uppercase">Tổng Cộng Toàn Trường</td>
                  <td className="py-2.5 px-3 text-center">57</td>
                  <td className="py-2.5 px-3 text-center text-purple-700">
                    +{branchStats.reduce((acc, b) => acc + b.inExt, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-rose-700">
                    -{branchStats.reduce((acc, b) => acc + b.outExt, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-blue-700">
                    {branchStats.reduce((acc, b) => acc + b.sameBranch, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-amber-700">
                    -{branchStats.reduce((acc, b) => acc + b.internalOut, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-emerald-700">
                    +{branchStats.reduce((acc, b) => acc + b.internalIn, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-sm">
                    {branchStats.reduce((acc, b) => acc + b.currentStudents, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {branchStats.reduce((acc, b) => acc + b.inExt, 0) - branchStats.reduce((acc, b) => acc + b.outExt, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: THỐNG KÊ THEO TỪNG ĐIỂM TRƯỜNG */}
      {activeTab === 'by_campus' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                Báo Cáo Theo Dõi HS Chuyển Đi, Chuyển Đến Ở Từng Điểm Trường (11 Điểm)
              </h3>
              <p className="text-xs text-slate-500">Chi tiết số lớp, sĩ số và biến động theo từng điểm trường lẻ</p>
            </div>
            <span className="text-xs font-bold text-slate-500">11 Điểm trường • 57 Lớp</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Tên Điểm Trường</th>
                  <th className="py-2.5 px-3">Phân Hiệu Trực Thuộc</th>
                  <th className="py-2.5 px-3 text-center">Số Lớp</th>
                  <th className="py-2.5 px-3 text-center text-purple-700">Chuyển Đến (+)</th>
                  <th className="py-2.5 px-3 text-center text-rose-700">Chuyển Đi (-)</th>
                  <th className="py-2.5 px-3 text-center font-bold">Sĩ Số Hiện Tại</th>
                  <th className="py-2.5 px-3 text-center">Biến Động Ròng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campusStats.map((cs, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">📍 {cs.campusName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{cs.branchName}</td>
                    <td className="py-2.5 px-3 text-center font-medium">{cs.classesCount}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-purple-700">+{cs.inCount}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-700">-{cs.outCount}</td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900">{cs.currentStudents}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          cs.netChange > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : cs.netChange < 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cs.netChange > 0 ? `+${cs.netChange}` : cs.netChange}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: THỐNG KÊ THEO THỜI ĐIỂM */}
      {activeTab === 'by_time' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                Báo Cáo Biến Động Học Sinh Theo Từng Thời Điểm (Tháng / Học Kỳ)
              </h3>
              <p className="text-xs text-slate-500">Theo dõi mật độ học sinh chuyển trường qua các tháng trong năm học</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">Năm học 2026-2027</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
              <span className="text-xs font-bold text-purple-900 uppercase">Học Kỳ 1 (Tháng 8 - Tháng 12)</span>
              <div className="text-2xl font-black text-purple-700">
                {
                  visibleTransfers.filter((t) => {
                    const m = parseInt((t.effectiveDate || '').split('-')[1] || '0', 10);
                    return m >= 8 && m <= 12;
                  }).length
                } <span className="text-xs font-normal text-purple-500">học sinh</span>
              </div>
              <p className="text-[11px] text-purple-700">Chiếm 80% tổng biến động cả năm do đầu năm học phụ huynh sắp xếp nơi ở mới.</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
              <span className="text-xs font-bold text-blue-900 uppercase">Học Kỳ 2 (Tháng 1 - Tháng 5)</span>
              <div className="text-2xl font-black text-blue-700">
                {
                  visibleTransfers.filter((t) => {
                    const m = parseInt((t.effectiveDate || '').split('-')[1] || '0', 10);
                    return m >= 1 && m <= 5;
                  }).length
                } <span className="text-xs font-normal text-blue-500">học sinh</span>
              </div>
              <p className="text-[11px] text-blue-700">Biến động giữa kỳ, chủ yếu do phụ huynh thay đổi công việc sau Tết Nguyên Đán.</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-900 uppercase">Tháng 9 (Đầu Năm Học)</span>
              <div className="text-2xl font-black text-amber-700">
                {
                  visibleTransfers.filter((t) => (t.effectiveDate || '').startsWith('2026-09')).length
                } <span className="text-xs font-normal text-amber-600">học sinh</span>
              </div>
              <p className="text-[11px] text-amber-700">Tháng cao điểm tiếp nhận học sinh chuyển đến và chuyển lớp trong trường.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase">Phân Bổ Lý Do Chính</span>
              <ul className="text-[11px] text-slate-600 space-y-1">
                <li>• Chuyển hộ khẩu, nơi ở: <strong>65%</strong></li>
                <li>• Theo cha mẹ đi làm ăn: <strong>25%</strong></li>
                <li>• Phân ban, học bán trú: <strong>10%</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PHÂN TÍCH BIỂU ĐỒ RECHARTS (YÊU CẦU MỚI) */}
      {activeTab === 'chart_analysis' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Biểu Đồ Phân Tích Xu Hướng Biến Động Sĩ Số (Recharts)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Trực quan hóa số lượng học sinh chuyển đến, chuyển đi và biến động ròng theo từng phân hiệu và khối lớp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartMetricType('branch')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  chartMetricType === 'branch'
                    ? 'bg-red-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Theo Phân Hiệu</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMetricType('grade')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  chartMetricType === 'grade'
                    ? 'bg-red-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Theo Khối Lớp (1-9)</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMetricType('trend')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  chartMetricType === 'trend'
                    ? 'bg-red-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Xu Hướng Tháng</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: THEO PHÂN HIỆU */}
          {chartMetricType === 'branch' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      So Sánh Chuyển Đến vs Chuyển Đi Theo 4 Phân Hiệu
                    </h4>
                    <p className="text-xs text-slate-500">Đơn vị tính: Học sinh</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Chuyển Đến</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                      <span>Chuyển Đi</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                      <span>Tăng Giảm Ròng</span>
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataByBranch} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        formatter={(val: any, name: any) => [`${val} học sinh`, name]}
                        labelFormatter={(label: any) => `Phân hiệu: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="Chuyển Đến" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Chuyển Đi" fill="#ef4444" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Tăng Giảm Ròng" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Branch Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {chartDataByBranch.map((b) => (
                  <div key={b.name} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="text-xs font-bold text-slate-800">{b.fullName}</div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500">Chuyển đến:</span>
                      <strong className="text-emerald-600">+{b['Chuyển Đến']} HS</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Chuyển đi:</span>
                      <strong className="text-rose-600">-{b['Chuyển Đi']} HS</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-700 font-bold">Biến động ròng:</span>
                      <strong className={b['Tăng Giảm Ròng'] >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {b['Tăng Giảm Ròng'] > 0 ? `+${b['Tăng Giảm Ròng']}` : b['Tăng Giảm Ròng']} HS
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: THEO KHỐI LỚP (1-9) */}
          {chartMetricType === 'grade' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Biến Động Chuyển Đi & Chuyển Đến Theo Khối Lớp 1 - 9
                    </h4>
                    <p className="text-xs text-slate-500">Khối 1-5: Tiểu học • Khối 6-9: THCS</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Chuyển Đến</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                      <span>Chuyển Đi</span>
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataByGrade} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        formatter={(val: any, name: any) => [`${val} học sinh`, name]}
                      />
                      <Legend />
                      <Bar dataKey="Chuyển Đến" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Chuyển Đi" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grade comparison TH vs THCS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-950 uppercase text-xs">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span>Cấp Tiểu Học (Khối 1 - 5)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-100 text-center">
                      <div className="text-[10px] text-slate-500">Chuyển đến:</div>
                      <div className="text-base font-black text-emerald-700">
                        {chartDataByGrade.slice(0, 5).reduce((sum, g) => sum + g['Chuyển Đến'], 0)} HS
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-100 text-center">
                      <div className="text-[10px] text-slate-500">Chuyển đi:</div>
                      <div className="text-base font-black text-rose-700">
                        {chartDataByGrade.slice(0, 5).reduce((sum, g) => sum + g['Chuyển Đi'], 0)} HS
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-100 text-center">
                      <div className="text-[10px] text-slate-500">Tổng sĩ số:</div>
                      <div className="text-base font-black text-slate-800">
                        {chartDataByGrade.slice(0, 5).reduce((sum, g) => sum + g['Sĩ Số Hiện Tại'], 0)} HS
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-950 uppercase text-xs">
                    <GraduationCap className="w-4 h-4 text-blue-700" />
                    <span>Cấp THCS (Khối 6 - 9)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="p-2.5 rounded-xl bg-white border border-blue-100 text-center">
                      <div className="text-[10px] text-slate-500">Chuyển đến:</div>
                      <div className="text-base font-black text-emerald-700">
                        {chartDataByGrade.slice(5).reduce((sum, g) => sum + g['Chuyển Đến'], 0)} HS
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-blue-100 text-center">
                      <div className="text-[10px] text-slate-500">Chuyển đi:</div>
                      <div className="text-base font-black text-rose-700">
                        {chartDataByGrade.slice(5).reduce((sum, g) => sum + g['Chuyển Đi'], 0)} HS
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-blue-100 text-center">
                      <div className="text-[10px] text-slate-500">Tổng sĩ số:</div>
                      <div className="text-base font-black text-slate-800">
                        {chartDataByGrade.slice(5).reduce((sum, g) => sum + g['Sĩ Số Hiện Tại'], 0)} HS
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: XU HƯỚNG THÁNG */}
          {chartMetricType === 'trend' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Xu Hướng Biến Động Sĩ Số Theo Các Tháng Trong Năm Học
                  </h4>
                  <p className="text-xs text-slate-500">Từ Tháng 8 đến Tháng 5</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Chuyển Đến</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span>Chuyển Đi</span>
                  </span>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataByMonth} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorDen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="Chuyển Đến" stroke="#10b981" fillOpacity={1} fill="url(#colorDen)" />
                    <Area type="monotone" dataKey="Chuyển Đi" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDi)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: BÁO CÁO TỔNG HỢP TOÀN TRƯỜNG */}
      {activeTab === 'official_report' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-4xl mx-auto space-y-6 print:m-0 print:border-none print:shadow-none">
          {/* Header standard paper */}
          <div className="flex justify-between items-start text-center border-b pb-4">
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase">ỦY BAN NHÂN DÂN XÃ ĐỒNG XUÂN</div>
              <div className="text-xs font-black text-slate-900 uppercase">
                TRƯỜNG TH & THCS ĐỒNG XUÂN
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Số: ...../BC-THCSDX</div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-900 uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="text-xs font-semibold text-slate-700">Độc lập - Tự do - Hạnh phúc</div>
              <div className="text-[10px] text-slate-500 italic mt-1">Đồng Xuân, ngày ... tháng ... năm 2026</div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-base font-black text-slate-900 uppercase">
              BÁO CÁO THEO DÕI BIẾN ĐỘNG HỌC SINH CHUYỂN ĐI, CHUYỂN ĐẾN
            </h2>
            <p className="text-xs text-slate-600 italic">
              (Số liệu thống kê toàn trường và từng phân hiệu, điểm trường năm học {activeSchoolYear})
            </p>
          </div>

          {/* Embedded Recharts Summary in Official Report (Theo từng phân hiệu và khối lớp) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chart 1: Theo từng Phân hiệu */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-800 uppercase flex items-center justify-between">
                <span>1. Biến Động Theo 4 Phân Hiệu (Recharts)</span>
                <span className="text-[10px] font-normal text-slate-500">Đơn vị: Học sinh</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataByBranch} margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fontWeight: 600 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Chuyển Đến" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Chuyển Đi" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Tăng Giảm Ròng" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-slate-500 italic text-center">
                So sánh số lượng học sinh chuyển đến, chuyển đi và biến động ròng giữa 4 phân hiệu
              </div>
            </div>

            {/* Chart 2: Theo từng Khối lớp (Khối 1 -> 9) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-800 uppercase flex items-center justify-between">
                <span>2. Biến Động Theo Khối Lớp 1 - 9 (Recharts)</span>
                <span className="text-[10px] font-normal text-slate-500">Tiểu học & THCS</span>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataByGrade} margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fontWeight: 600 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Chuyển Đến" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Chuyển Đi" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Tăng Giảm Ròng" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-slate-500 italic text-center">
                Phân tích biến động chuyển trường theo từng khối lớp từ Khối 1 đến Khối 9
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-800">
            <p>
              Căn cứ Điều lệ trường Tiểu học và THCS ban hành theo Thông tư của Bộ Giáo dục và Đào tạo;
            </p>
            <p>
              Trường TH & THCS Đồng Xuân báo cáo tổng hợp tình hình biến động học sinh chuyển đi, chuyển đến trong năm học {activeSchoolYear} như sau:
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 font-medium">
              <div>1. Tổng số lớp toàn trường: <strong>57 lớp</strong> (11 điểm trường).</div>
              <div>2. Sĩ số học sinh hiện tại: <strong>1.289 học sinh</strong>.</div>
              <div>3. Tổng số học sinh từ trường ngoài chuyển đến: <strong>{inFromOutsideCount} học sinh</strong>.</div>
              <div>4. Tổng số học sinh chuyển đi trường khác: <strong>{outToOutsideCount} học sinh</strong>.</div>
              <div>5. Tổng số học sinh điều chuyển lớp trong trường: <strong>{internalSameCount + internalDiffCount} học sinh</strong>.</div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 text-center pt-8 text-xs">
            <div>
              <div className="font-bold text-slate-800 uppercase">VĂN THƯ NHÀ TRƯỜNG</div>
              <div className="text-[10px] text-slate-400 italic mb-12">(Ký và ghi rõ họ tên)</div>
              <div className="font-bold">Đặng Thị Hồng Thắm</div>
            </div>

            <div>
              <div className="font-bold text-slate-800 uppercase">PHÓ HIỆU TRƯỞNG PHỤ TRÁCH</div>
              <div className="text-[10px] text-slate-400 italic mb-12">(Ký và ghi rõ họ tên)</div>
              <div className="font-bold">Phan Hưng Tuyên</div>
            </div>

            <div>
              <div className="font-bold text-slate-800 uppercase">HIỆU TRƯỞNG</div>
              <div className="text-[10px] text-slate-400 italic mb-12">(Ký tên và đóng dấu)</div>
              <div className="font-black text-red-700">Nguyễn Quốc Bảo</div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3.1: TIẾP NHẬN HS TỪ TRƯỜNG KHÁC ĐẾN */}
      {/* ---------------------------------------------------- */}
      {showModalIn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <PlusCircle className="w-5 h-5 text-purple-600" />
                  Khai Báo HS Từ Trường Khác Chuyển Đến (3.1)
                </h3>
                <p className="text-xs text-slate-500">
                  Dành cho: HT, PHT phân hiệu đến, Văn thư hoặc GVCN lớp nhận học sinh
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalIn(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTransferIn} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-purple-50/60 p-3 rounded-2xl border border-purple-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phân hiệu tiếp nhận:</label>
                  <select
                    value={inTargetBranch}
                    onChange={(e) => {
                      setInTargetBranch(e.target.value);
                      const b = BRANCHES_DATA.find((item) => item.name === e.target.value);
                      if (b && b.campuses[0]) setInTargetCampus(b.campuses[0].name);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    {BRANCHES_DATA.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Điểm trường:</label>
                  <select
                    value={inTargetCampus}
                    onChange={(e) => setInTargetCampus(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    {inAvailableCampuses.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lớp nhận:</label>
                  <select
                    value={inTargetClassId}
                    onChange={(e) => setInTargetClassId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-purple-900"
                  >
                    {inAvailableClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Lớp {cls.name} (GVCN: {cls.homeroomTeacherName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên học sinh:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lê Hoàng Nam"
                  value={inStudentName}
                  onChange={(e) => setInStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giới tính:</label>
                  <select
                    value={inGender}
                    onChange={(e) => setInGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày sinh:</label>
                  <input
                    type="date"
                    value={inDob}
                    onChange={(e) => setInDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trường cũ chuyển đến:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: TH&THCS Lê Quý Đôn"
                    value={inPreviousSchool}
                    onChange={(e) => setInPreviousSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tỉnh / Thành phố:</label>
                  <input
                    type="text"
                    value={inProvinceCity}
                    onChange={(e) => setInProvinceCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Quyết định / Giấy giới thiệu:</label>
                  <input
                    type="text"
                    placeholder="VD: QĐ-88/QĐ-PGDĐT"
                    value={inDecisionNo}
                    onChange={(e) => setInDecisionNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày tiếp nhận:</label>
                  <input
                    type="date"
                    value={inEffectiveDate}
                    onChange={(e) => setInEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do chuyển đến:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi rõ lý do tiếp nhận học sinh..."
                  value={inReason}
                  onChange={(e) => setInReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                ℹ️ Sau khi khai báo, học sinh sẽ tự động được thêm vào danh sách lớp và công khai trên Trang thứ 5 cho cả phân hiệu / toàn trường thấy.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModalIn(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Khai Báo & Vào Sổ Học Sinh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3.2: CHUYỂN LỚP TRONG CÙNG TRƯỜNG */}
      {/* ---------------------------------------------------- */}
      {showModalInternal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                  Chuyển Lớp Trong Cùng Trường (3.2)
                </h3>
                <p className="text-xs text-slate-500">
                  GVCN lớp có HS chuyển đi kích nút chuyển để nhập hộp thoại thông tin gửi lên hệ thống
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalInternal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitInternalTransfer} className="mt-4 space-y-4 text-xs">
              {/* Box 1: Nơi chuyển đi */}
              <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 space-y-3">
                <span className="font-extrabold text-rose-900 text-xs uppercase flex items-center gap-1.5">
                  📍 THÔNG TIN NƠI CHUYỂN ĐI
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phân hiệu chuyển đi:</label>
                    <select
                      value={interFromBranch}
                      onChange={(e) => {
                        setInterFromBranch(e.target.value);
                        const b = BRANCHES_DATA.find((item) => item.name === e.target.value);
                        if (b && b.campuses[0]) setInterFromCampus(b.campuses[0].name);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      {BRANCHES_DATA.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Điểm trường chuyển đi:</label>
                    <select
                      value={interFromCampus}
                      onChange={(e) => setInterFromCampus(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      {interFromCampuses.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Lớp chuyển đi:</label>
                    <select
                      value={interFromClassId}
                      onChange={(e) => {
                        setInterFromClassId(e.target.value);
                        setInterStudentName('');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-rose-800"
                    >
                      {interFromClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          Lớp {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-rose-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Giáo viên chủ nhiệm chuyển đi:</label>
                    <input
                      type="text"
                      readOnly
                      value={interFromClassObj?.homeroomTeacherName || 'Chưa phân công'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100 font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Họ tên học sinh chuyển đi:</label>
                    {interFromClassObj && interFromClassObj.students.length > 0 ? (
                      <select
                        value={interStudentName}
                        onChange={(e) => {
                          setInterStudentName(e.target.value);
                          const stu = interFromClassObj.students.find((s) => s.fullName === e.target.value);
                          if (stu) setInterStudentId(stu.id);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                        required
                      >
                        <option value="">-- Chọn học sinh từ danh sách lớp {interFromClassObj.name} --</option>
                        {interFromClassObj.students.map((s) => (
                          <option key={s.id} value={s.fullName}>
                            {s.fullName} ({s.gender} - {s.dob})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="Nhập họ tên học sinh..."
                        value={interStudentName}
                        onChange={(e) => setInterStudentName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Box 2: Nơi chuyển đến */}
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-3">
                <span className="font-extrabold text-emerald-900 text-xs uppercase flex items-center gap-1.5">
                  📍 THÔNG TIN NƠI CHUYỂN ĐẾN
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phân hiệu chuyển đến:</label>
                    <select
                      value={interToBranch}
                      onChange={(e) => {
                        setInterToBranch(e.target.value);
                        const b = BRANCHES_DATA.find((item) => item.name === e.target.value);
                        if (b && b.campuses[0]) setInterToCampus(b.campuses[0].name);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      {BRANCHES_DATA.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Điểm trường chuyển đến:</label>
                    <select
                      value={interToCampus}
                      onChange={(e) => setInterToCampus(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      {interToCampuses.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Lớp chuyển đến:</label>
                    <select
                      value={interToClassId}
                      onChange={(e) => setInterToClassId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-emerald-800"
                    >
                      {interToClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          Lớp {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Giáo viên chủ nhiệm chuyển đến:</label>
                    <input
                      type="text"
                      readOnly
                      value={interToClassObj?.homeroomTeacherName || 'Chưa phân công'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100 font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Họ tên HS chuyển đến:</label>
                    <input
                      type="text"
                      readOnly
                      value={interStudentName || '(Tự động theo tên HS chuyển đi)'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100 font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic rule hint */}
              <div
                className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                  isInternalSameBranch
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                {isInternalSameBranch ? (
                  <div>
                    <strong>✓ Chuyển trong cùng phân hiệu ({interFromBranch}):</strong>
                    <p className="mt-0.5">
                      Theo quy định: <strong>HT hoặc PHT phân hiệu đó đều được duyệt</strong>. Sau khi được duyệt, GVCN có học sinh chuyển đến ({interToClassObj?.homeroomTeacherName}) sẽ bấm nút nhận học sinh để hệ thống chuyển thông tin vào lớp mới. Thông tin chỉ hiển thị cho GV, CNV phân hiệu đó xem.
                    </p>
                  </div>
                ) : (
                  <div>
                    <strong>⚠️ Chuyển đi KHÁC phân hiệu ({interFromBranch} ➔ {interToBranch}):</strong>
                    <p className="mt-0.5">
                      Theo quy định: <strong>CHỈ CÓ DUY NHẤT HIỆU TRƯỞNG NGUYỄN QUỐC BẢO ĐƯỢC DUYỆT</strong>. Sau khi được duyệt, GVCN lớp nhận ({interToClassObj?.homeroomTeacherName}) bấm nút nhận học sinh. Sau đó công khai thông tin cho TOÀN TRƯỜNG đều thấy.
                    </p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Phiếu điều chuyển / Quyết định:</label>
                  <input
                    type="text"
                    placeholder="VD: PĐC-05/THCSDX"
                    value={interDecisionNo}
                    onChange={(e) => setInterDecisionNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày hiệu lực:</label>
                  <input
                    type="date"
                    value={interEffectiveDate}
                    onChange={(e) => setInterEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do chuyển lớp:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi rõ lý do điều chuyển lớp..."
                  value={interReason}
                  onChange={(e) => setInterReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModalInternal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi Lên Hệ Thống Phê Duyệt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3.3: CHUYỂN ĐI TRƯỜNG KHÁC */}
      {/* ---------------------------------------------------- */}
      {showModalOut && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <Send className="w-5 h-5 text-rose-600" />
                  Báo Cáo Học Sinh Chuyển Đi Trường Khác (3.3)
                </h3>
                <p className="text-xs text-slate-500">
                  Dành cho: PHT phân hiệu, Văn thư hoặc GVCN lớp có học sinh chuyển đi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalOut(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTransferOut} className="mt-4 space-y-3.5 text-xs">
              <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200 space-y-2">
                <span className="font-extrabold text-rose-900 text-xs uppercase">
                  Thông tin học sinh chuyển đi
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phân hiệu chuyển đi:</label>
                    <select
                      value={outFromBranch}
                      onChange={(e) => {
                        setOutFromBranch(e.target.value);
                        const b = BRANCHES_DATA.find((item) => item.name === e.target.value);
                        if (b && b.campuses[0]) setOutFromCampus(b.campuses[0].name);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      {BRANCHES_DATA.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Điểm trường:</label>
                    <select
                      value={outFromCampus}
                      onChange={(e) => setOutFromCampus(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      {outFromCampuses.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Lớp chuyển đi:</label>
                    <select
                      value={outFromClassId}
                      onChange={(e) => setOutFromClassId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-rose-800"
                    >
                      {outFromClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          Lớp {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-rose-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Giáo viên chủ nhiệm:</label>
                    <input
                      type="text"
                      readOnly
                      value={outFromClassObj?.homeroomTeacherName || 'Chưa phân công'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Họ tên học sinh:</label>
                    {outFromClassObj && outFromClassObj.students.length > 0 ? (
                      <select
                        value={outStudentName}
                        onChange={(e) => {
                          setOutStudentName(e.target.value);
                          const stu = outFromClassObj.students.find((s) => s.fullName === e.target.value);
                          if (stu) setOutStudentId(stu.id);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                        required
                      >
                        <option value="">-- Chọn từ danh sách lớp {outFromClassObj.name} --</option>
                        {outFromClassObj.students.map((s) => (
                          <option key={s.id} value={s.fullName}>
                            {s.fullName} ({s.gender} - {s.dob})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="Nhập họ tên học sinh..."
                        value={outStudentName}
                        onChange={(e) => setOutStudentName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Trường chuyển đến:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trường TH&THCS Lê Quý Đôn, TP. Tuy Hòa"
                  value={outTargetSchool}
                  onChange={(e) => setOutTargetSchool(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tỉnh / Thành phố:</label>
                  <input
                    type="text"
                    value={outProvinceCity}
                    onChange={(e) => setOutProvinceCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Giấy giới thiệu chuyển trường:</label>
                  <input
                    type="text"
                    placeholder="VD: GGT-102/THCSDX"
                    value={outDecisionNo}
                    onChange={(e) => setOutDecisionNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do chuyển trường:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi rõ lý do xin chuyển trường..."
                  value={outReason}
                  onChange={(e) => setOutReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                ℹ️ Quy trình: HT hoặc PHT phân hiệu phê duyệt ➔ Hiển thị công khai thông tin trên Trang thứ 5 cả phân hiệu và toàn trường đều thấy.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModalOut(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Trình HT / PHT Phê Duyệt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL REJECT */}
      {/* ---------------------------------------------------- */}
      {showRejectModal && selectedReportForReject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Từ Chối Phê Duyệt Phiếu Chuyển</h3>
            <p className="text-xs text-slate-500 mb-4">Học sinh: {selectedReportForReject.studentName}</p>

            <form onSubmit={handleRejectConfirm} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do từ chối:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi rõ lý do chưa thể phê duyệt (VD: hồ sơ chưa đầy đủ, thiếu chữ ký phụ huynh...)"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold shadow"
                >
                  Xác Nhận Từ Chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
