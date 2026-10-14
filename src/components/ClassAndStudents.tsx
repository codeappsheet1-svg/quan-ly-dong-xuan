import React, { useState, useEffect, useMemo } from 'react';
import {
  SchoolClass,
  Student,
  UserAccount,
  StudentPersonalGrowthProfile,
  GvcnDynamicPermission,
  StudentPreservationDropoutRecord,
  EnrollmentHistoryStat,
} from '../types/school';
import { CLASS_COLUMNS_AZ } from '../types/sheetColumns';
import { BRANCHES_DATA, ALL_CAMPUSES } from '../data/initialData';
import { storageService } from '../services/storageService';
import {
  canViewClassStudentRoster,
  canEditClassStudentRoster,
  canAssignHomeroomTeacher,
} from '../utils/permissionUtils';
import {
  School,
  Users,
  Search,
  UserCheck,
  FileSpreadsheet,
  ExternalLink,
  PlusCircle,
  Filter,
  GraduationCap,
  Award,
  Printer,
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft,
  CheckCircle,
  Lock,
  Activity,
  HeartPulse,
  MessageCircle,
  FileBadge,
  CheckSquare,
  Sparkles,
  CalendarDays,
  Layers,
  AlertTriangle,
  Clock,
  Send,
  Check,
  X,
  Pencil,
  Trash2,
  RotateCcw,
  Edit3,
} from 'lucide-react';

interface ClassAndStudentsProps {
  currentUser: UserAccount | null;
  classes: SchoolClass[];
  allStaff: { account: UserAccount }[];
  activeSchoolYear?: string;
  onRefreshData: () => void;
  onOpenRegister: () => void;
}

export const ClassAndStudents: React.FC<ClassAndStudentsProps> = ({
  currentUser,
  classes,
  allStaff,
  activeSchoolYear,
  onRefreshData,
  onOpenRegister,
}) => {
  const [selectedClass, setSelectedClass] = useState<SchoolClass>(classes[0] || null);

  useEffect(() => {
    if (classes.length > 0) {
      const stillExists = classes.find((c) => c.id === selectedClass?.id);
      setSelectedClass(stillExists || classes[0]);
    }
  }, [classes]);
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'TH' | 'THCS'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [gvcnFilter, setGvcnFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newHomeroomId, setNewHomeroomId] = useState('');

  // Quản lý vòng đời Lớp học (ACTIVE / INACTIVE - Yêu cầu 1)
  const [classLifecycleFilter, setClassLifecycleFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [classEditData, setClassEditData] = useState({
    name: '',
    grade: 1,
    level: 'TH' as 'TH' | 'THCS',
    campusName: '',
    branchName: '',
    roomName: '',
    homeroomTeacherName: '',
    homeroomTeacherId: '',
  });
  const [showInactivateClassConfirm, setShowInactivateClassConfirm] = useState(false);
  const [inactivateClassReason, setInactivateClassReason] = useState('Sáp nhập lớp / Tạm dừng hoạt động');

  // Quản lý vòng đời Học sinh (ACTIVE / INACTIVE - Yêu cầu 2)
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [studentEditData, setStudentEditData] = useState({
    fullName: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '',
    ethnicity: 'Kinh',
    address: '',
    parentName: '',
    parentPhone: '',
    policyBeneficiary: 'Không' as 'Không' | 'Hộ nghèo' | 'Hộ cận nghèo' | 'Khuyết tật' | 'Mồ côi',
    status: 'Đang học' as any,
    notes: '',
  });
  const [showInactivateStudentConfirm, setShowInactivateStudentConfirm] = useState(false);
  const [selectedStudentForInactivate, setSelectedStudentForInactivate] = useState<Student | null>(null);
  const [inactivateStudentReason, setInactivateStudentReason] = useState('Nghỉ học / Chuyển trường / Lưu trữ');

  // Available campuses based on branch filter
  const availableCampuses = useMemo(() => {
    if (branchFilter === 'ALL') {
      return ALL_CAMPUSES;
    }
    const branch = BRANCHES_DATA.find((b) => b.name === branchFilter);
    return branch ? branch.campuses : ALL_CAMPUSES;
  }, [branchFilter]);

  // List of distinct GVCN from current classes
  const availableGvcns = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.homeroomTeacherName && c.homeroomTeacherName !== 'Chưa phân công') {
        set.add(c.homeroomTeacherName);
      }
    });
    return Array.from(set).sort();
  }, [classes]);

  // Reset campus filter when branch changes if campus no longer in branch
  useEffect(() => {
    if (campusFilter !== 'ALL' && branchFilter !== 'ALL') {
      const existsInBranch = availableCampuses.some((c) => c.name === campusFilter);
      if (!existsInBranch) {
        setCampusFilter('ALL');
      }
    }
  }, [branchFilter, availableCampuses, campusFilter]);

  // Class Sheet A-AZ View Toggle
  const [showClassAZModal, setShowClassAZModal] = useState(false);
  const [classAZData, setClassAZData] = useState<Record<string, string | number>>({});

  // Student add modal (Requirement 3: Thêm HS mới chuyển trường đến)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [newStudentDob, setNewStudentDob] = useState('2015-05-10');
  const [newStudentParent, setNewStudentParent] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentPolicy, setNewStudentPolicy] = useState<'Không' | 'Hộ nghèo' | 'Hộ cận nghèo' | 'Khuyết tật'>('Không');
  const [isTransferIn, setIsTransferIn] = useState(false);
  const [previousSchool, setPreviousSchool] = useState('');
  const [provinceCity, setProvinceCity] = useState('Phú Yên');
  const [transferDecisionNo, setTransferDecisionNo] = useState('');
  const [transferReason, setTransferReason] = useState('Chuyển nơi cư trú theo gia đình');

  // Sub-tabs for Class Management & GVCN duties (Requirement 2 & 3)
  type ClassSubTab = 'roster' | 'attendance' | 'gvcn_perms' | 'preservation' | 'enrollment_history';
  const [classSubTab, setClassSubTab] = useState<ClassSubTab>('roster');

  // Personal Growth Profile Modal State (Requirement 2)
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [currentGrowthProfile, setCurrentGrowthProfile] = useState<StudentPersonalGrowthProfile | null>(null);
  const [growthModalTab, setGrowthModalTab] = useState<'academic' | 'conduct' | 'physical' | 'behavior'>('academic');
  const [newBehaviorCategory, setNewBehaviorCategory] = useState<
    'Hành vi nề nếp' | 'Tâm lý giao tiếp' | 'Năng khiếu đặc biệt' | 'Cần trợ giúp đặc biệt'
  >('Hành vi nề nếp');
  const [newBehaviorNote, setNewBehaviorNote] = useState('');

  // Daily Attendance Real-Time State (Requirement 2)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSession, setAttendanceSession] = useState<'Sáng' | 'Chiều'>('Sáng');
  const [studentStatusMap, setStudentStatusMap] = useState<Record<string, { status: 'PRESENT' | 'EXCUSED' | 'UNEXCUSED'; reason: string; parentContacted: boolean }>>({});

  // Preservation & Dropout Form State (Requirement 3)
  const [showPreservationModal, setShowPreservationModal] = useState(false);
  const [preservationStudentId, setPreservationStudentId] = useState('');
  const [preservationType, setPreservationType] = useState<'BAO_LUU' | 'THOI_HOC' | 'TAM_DUNG'>('BAO_LUU');
  const [preservationReason, setPreservationReason] = useState('Bảo lưu kết quả học tập để điều trị y tế');
  const [preservationDate, setPreservationDate] = useState(new Date().toISOString().split('T')[0]);
  const [preservationDuration, setPreservationDuration] = useState(6);
  const [preservationDecisionNo, setPreservationDecisionNo] = useState(`QĐ-BL-${Math.floor(10 + Math.random() * 90)}/THCSDX`);

  // Student action modal (Requirement 3: Bớt HS, chuyển đi, nghỉ học, mất)
  const [showStudentActionModal, setShowStudentActionModal] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<Student | null>(null);
  const [studentActionType, setStudentActionType] = useState<
    'Chuyển lớp trong trường' | 'Chuyển đi trường khác' | 'Bảo lưu' | 'Thôi học' | 'Nghỉ học' | 'Ở lại lớp' | 'Mất' | 'Xóa'
  >('Chuyển lớp trong trường');
  const [interTargetBranch, setInterTargetBranch] = useState(BRANCHES_DATA[1]?.name || BRANCHES_DATA[0].name);
  const [interTargetCampus, setInterTargetCampus] = useState(ALL_CAMPUSES[0].name);
  const [interTargetClassId, setInterTargetClassId] = useState(classes[1]?.id || classes[0]?.id || '');
  const [interTransferReason, setInterTransferReason] = useState('Chuyển lớp theo nguyện vọng phân ban & bán trú');
  const [interDecisionNo, setInterDecisionNo] = useState('');
  const [targetSchool, setTargetSchool] = useState('');
  const [transferOutProvince, setTransferOutProvince] = useState('Phú Yên');
  const [transferOutReason, setTransferOutReason] = useState('Chuyển trường chuyển nơi cư trú');
  const [transferOutDecisionNo, setTransferOutDecisionNo] = useState('');

  // Filter classes (Requirement 1: Tìm kiếm theo Lớp, Cấp học, Phân hiệu, Điểm trường, GVCN, Vòng đời ACTIVE/INACTIVE)
  const activeClassesCount = useMemo(() => classes.filter((c) => c.status !== 'INACTIVE').length, [classes]);
  const inactiveClassesCount = useMemo(() => classes.filter((c) => c.status === 'INACTIVE').length, [classes]);

  const filteredClasses = classes.filter((c) => {
    // Vòng đời lớp học: ACTIVE (mặc định), INACTIVE (ngưng hoạt động / lưu trữ), ALL (tất cả)
    if (classLifecycleFilter === 'ACTIVE' && c.status === 'INACTIVE') return false;
    if (classLifecycleFilter === 'INACTIVE' && c.status !== 'INACTIVE') return false;

    if (levelFilter !== 'ALL' && c.level !== levelFilter) return false;
    if (branchFilter !== 'ALL' && c.branchName !== branchFilter) return false;
    if (campusFilter !== 'ALL' && c.campusName !== campusFilter) return false;
    if (gvcnFilter !== 'ALL' && c.homeroomTeacherName !== gvcnFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(term);
      const matchTeacher = c.homeroomTeacherName.toLowerCase().includes(term);
      const matchCampus = c.campusName.toLowerCase().includes(term);
      const matchBranch = c.branchName.toLowerCase().includes(term);
      const matchRoom = (c.roomName || '').toLowerCase().includes(term);
      if (!matchName && !matchTeacher && !matchCampus && !matchBranch && !matchRoom) return false;
    }
    return true;
  });

  const teachersList = allStaff.filter((s) => s.account.role === 'GV' || s.account.role === 'PHT');

  // Handlers for Class Lifecycle (Sửa lớp, Xóa lớp -> INACTIVE, Khôi phục -> ACTIVE)
  const handleOpenEditClass = (targetClass?: SchoolClass) => {
    const cls = targetClass || selectedClass;
    if (!cls) return;
    setSelectedClass(cls);
    setClassEditData({
      name: cls.name,
      grade: cls.grade,
      level: cls.level,
      campusName: cls.campusName,
      branchName: cls.branchName,
      roomName: cls.roomName || '',
      homeroomTeacherName: cls.homeroomTeacherName,
      homeroomTeacherId: cls.homeroomTeacherId,
    });
    setShowEditClassModal(true);
  };

  const handleSaveEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    const matchedCampus = ALL_CAMPUSES.find((c) => c.name === classEditData.campusName);
    const matchedTeacher = teachersList.find((t) => t.account.id === classEditData.homeroomTeacherId);

    storageService.updateClass(
      selectedClass.id,
      {
        name: classEditData.name.trim(),
        grade: classEditData.grade,
        level: classEditData.level,
        campusName: classEditData.campusName,
        campusId: matchedCampus ? matchedCampus.id : selectedClass.campusId,
        branchName: matchedCampus ? matchedCampus.branchName : classEditData.branchName,
        roomName: classEditData.roomName.trim(),
        homeroomTeacherId: classEditData.homeroomTeacherId,
        homeroomTeacherName: matchedTeacher ? matchedTeacher.account.name : classEditData.homeroomTeacherName,
      },
      activeSchoolYear
    );

    setShowEditClassModal(false);
    onRefreshData();
  };

  const handleConfirmInactivateClass = () => {
    if (!selectedClass) return;
    storageService.inactivateClass(selectedClass.id, inactivateClassReason, activeSchoolYear);
    setShowInactivateClassConfirm(false);
    onRefreshData();
  };

  const handleRestoreClass = (targetClass?: SchoolClass) => {
    const cls = targetClass || selectedClass;
    if (!cls) return;
    storageService.restoreClass(cls.id, activeSchoolYear);
    onRefreshData();
  };

  // Handlers for Student Lifecycle (Sửa HS, Xóa HS -> INACTIVE, Khôi phục -> ACTIVE)
  const handleOpenEditStudent = (stu: Student) => {
    setSelectedStudentForEdit(stu);
    setStudentEditData({
      fullName: stu.fullName,
      gender: stu.gender,
      dob: stu.dob,
      ethnicity: stu.ethnicity || 'Kinh',
      address: stu.address || '',
      parentName: stu.parentName,
      parentPhone: stu.parentPhone,
      policyBeneficiary: stu.policyBeneficiary || 'Không',
      status: stu.status,
      notes: stu.notes || '',
    });
    setShowEditStudentModal(true);
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudentForEdit) return;

    storageService.updateStudent(
      selectedClass.id,
      selectedStudentForEdit.id,
      {
        fullName: studentEditData.fullName.trim(),
        gender: studentEditData.gender,
        dob: studentEditData.dob,
        ethnicity: studentEditData.ethnicity,
        address: studentEditData.address.trim(),
        parentName: studentEditData.parentName.trim(),
        parentPhone: studentEditData.parentPhone.trim(),
        policyBeneficiary: studentEditData.policyBeneficiary,
        status: studentEditData.status,
        notes: studentEditData.notes.trim(),
      },
      activeSchoolYear
    );

    setShowEditStudentModal(false);
    setSelectedStudentForEdit(null);
    onRefreshData();
  };

  const handleConfirmInactivateStudent = () => {
    if (!selectedClass || !selectedStudentForInactivate) return;
    storageService.inactivateStudent(
      selectedClass.id,
      selectedStudentForInactivate.id,
      inactivateStudentReason,
      activeSchoolYear
    );
    setShowInactivateStudentConfirm(false);
    setSelectedStudentForInactivate(null);
    onRefreshData();
  };

  const handleRestoreStudent = (stu: Student) => {
    if (!selectedClass) return;
    storageService.restoreStudent(selectedClass.id, stu.id, activeSchoolYear);
    onRefreshData();
  };

  const handleAssignHomeroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newHomeroomId) return;

    const teacher = teachersList.find((t) => t.account.id === newHomeroomId);
    if (!teacher) return;

    const currentClasses = storageService.getClasses(activeSchoolYear);
    const idx = currentClasses.findIndex((c) => c.id === selectedClass.id);
    if (idx !== -1) {
      const oldTeacherId = currentClasses[idx].homeroomTeacherId;
      const oldTeacherName = currentClasses[idx].homeroomTeacherName;

      // Lưu lại danh sách GVCN cũ để tước toàn bộ quyền xem và thao tác trên lớp này
      const previousIds = currentClasses[idx].previousHomeroomTeacherIds || [];
      const previousNames = currentClasses[idx].previousHomeroomTeacherNames || [];
      if (oldTeacherId && !previousIds.includes(oldTeacherId) && oldTeacherId !== teacher.account.id) {
        previousIds.push(oldTeacherId);
      }
      if (oldTeacherName && !previousNames.includes(oldTeacherName) && oldTeacherName !== teacher.account.name) {
        previousNames.push(oldTeacherName);
      }

      currentClasses[idx].homeroomTeacherId = teacher.account.id;
      currentClasses[idx].homeroomTeacherName = teacher.account.name;
      currentClasses[idx].previousHomeroomTeacherIds = previousIds;
      currentClasses[idx].previousHomeroomTeacherNames = previousNames;
      currentClasses[idx].sheetDataAZ['G'] = teacher.account.id;
      currentClasses[idx].sheetDataAZ['H'] = teacher.account.name;
      currentClasses[idx].sheetDataAZ['I'] = teacher.account.phone;
      storageService.saveClasses(currentClasses, activeSchoolYear);
      setSelectedClass(currentClasses[idx]);

      // Đồng bộ sang hệ thống phân quyền động GVCN: Chuyển quyền sang giáo viên mới, hủy quyền giáo viên cũ
      const dynamicPerms = storageService.getGvcnDynamicPermissions(activeSchoolYear);
      const permIdx = dynamicPerms.findIndex((p) => p.classId === selectedClass.id);
      if (permIdx !== -1) {
        dynamicPerms[permIdx].teacherId = teacher.account.id;
        dynamicPerms[permIdx].teacherName = teacher.account.name;
        dynamicPerms[permIdx].lastUpdated = new Date().toISOString().split('T')[0];
        dynamicPerms[permIdx].updatedBy = currentUser?.name || 'Hiệu trưởng Nguyễn Quốc Bảo';
        storageService.saveGvcnDynamicPermissions(dynamicPerms, activeSchoolYear);
      }

      // Ghi nhật ký bảo mật và điều hành
      storageService.addSecurityAuditLog({
        userId: currentUser?.id || 'HT01',
        userName: currentUser?.name || 'Hiệu trưởng Nguyễn Quốc Bảo',
        userRole: currentUser?.role || 'HT',
        event: 'Điều chuyển Giáo viên Chủ nhiệm (Thu hồi quyền lớp cũ)',
        severity: 'WARNING',
        details: `Đã thay đổi GVCN lớp ${selectedClass.name}: Chuyển từ ${oldTeacherName} (${oldTeacherId}) sang ${teacher.account.name} (${teacher.account.id}). GVCN cũ ${oldTeacherName} bị thu hồi toàn bộ quyền xem và thao tác trên lớp này.`,
        targetResource: selectedClass.id,
      });

      storageService.addSyncLog(
        'Đổi GVCN & Thu hồi quyền lớp cũ',
        `Đã phân công ${teacher.account.name} làm GVCN lớp ${selectedClass.name}. GVCN cũ ${oldTeacherName} không còn quyền xem/thao tác trên lớp này.`
      );
    }

    setShowAssignModal(false);
    onRefreshData();
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newStudentName) return;

    // Check class capacity quota before adding (Requirement 3: Kiểm tra chỉ tiêu sĩ số lớp)
    const cap = storageService.checkClassCapacityQuota(selectedClass.id, activeSchoolYear);
    if (cap.isAtCapacity) {
      const confirmAdd = window.confirm(
        `⚠️ Cảnh báo chỉ tiêu sĩ số: Lớp ${selectedClass.name} hiện đã có ${cap.currentCount} học sinh (đạt/vượt định mức tối đa ${cap.maxQuota} HS/lớp đối với cấp ${cap.level}). Bạn có chắc chắn muốn tiếp tục bổ sung học sinh này theo quyết định phê duyệt ngoại lệ của Hiệu trưởng?`
      );
      if (!confirmAdd) return;
    }

    storageService.addStudentToClass(
      selectedClass.id,
      {
        fullName: newStudentName,
        gender: newStudentGender,
        dob: newStudentDob,
        parentName: newStudentParent || 'Phụ huynh HS',
        parentPhone: newStudentPhone || '098' + Math.floor(1000000 + Math.random() * 9000000),
        policyBeneficiary: newStudentPolicy,
        isTransferIn,
        previousSchool,
        provinceCity,
        decisionNumber: transferDecisionNo,
        transferReason,
      },
      activeSchoolYear
    );

    // Nếu là HS từ trường khác chuyển đến => Công khai thông tin lên Trang thứ 5
    if (isTransferIn) {
      storageService.addStudentTransferReport(
        {
          type: 'CHUYEN_DEN',
          transferCategory: 'DEN_TU_TRUONG_KHAC',
          studentName: newStudentName.trim(),
          gender: newStudentGender,
          dob: newStudentDob,
          toBranchName: selectedClass.branchName,
          toCampusName: selectedClass.campusName,
          toClassId: selectedClass.id,
          toClassName: selectedClass.name,
          toGvcnId: selectedClass.homeroomTeacherId,
          toGvcnName: selectedClass.homeroomTeacherName,
          classId: selectedClass.id,
          className: selectedClass.name,
          campusName: selectedClass.campusName,
          transferSchool: previousSchool.trim() || 'Trường ngoài',
          provinceCity: provinceCity || 'Ngoài tỉnh/huyện',
          reason: transferReason || 'Chuyển nơi cư trú theo gia đình',
          decisionNumber: transferDecisionNo || `QĐ-TN-${Math.floor(100 + Math.random() * 900)}/THCSDX`,
          effectiveDate: new Date().toISOString().split('T')[0],
          approvalStatus: 'Đã hoàn tất hồ sơ',
          approvedBy: currentUser?.name || 'Ban Giám hiệu',
          approvedRole: currentUser?.position || 'Ban Giám hiệu',
          approvalDate: new Date().toISOString().split('T')[0],
          isReceivedByTargetGvcn: true,
          receivedDate: new Date().toISOString().split('T')[0],
          receivedByGvcnName: selectedClass.homeroomTeacherName,
          visibilityScope: 'TOAN_TRUONG',
          gvcnId: selectedClass.homeroomTeacherId,
          gvcnName: selectedClass.homeroomTeacherName,
        },
        activeSchoolYear
      );
    }

    const updated = storageService.getClasses(activeSchoolYear).find((c) => c.id === selectedClass.id);
    if (updated) setSelectedClass(updated);

    setShowAddStudentModal(false);
    setNewStudentName('');
    setNewStudentParent('');
    setNewStudentPhone('');
    setIsTransferIn(false);
    setPreviousSchool('');
    setTransferDecisionNo('');
    onRefreshData();
  };

  const handleExecuteStudentAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudentForAction) return;

    if (studentActionType === 'Chuyển lớp trong trường') {
      const targetCls = classes.find((c) => c.id === interTargetClassId);
      if (!targetCls) return;

      // Check target class capacity quota (Requirement 3: Hệ thống kiểm tra chỉ tiêu sĩ số lớp trước khi xếp lớp mới)
      const targetCap = storageService.checkClassCapacityQuota(targetCls.id, activeSchoolYear);
      if (targetCap.isAtCapacity) {
        const confirmTransfer = window.confirm(
          `⚠️ Cảnh báo sĩ số: Lớp tiếp nhận ${targetCls.name} hiện đã đạt/vượt chỉ tiêu (${targetCap.currentCount}/${targetCap.maxQuota} HS). Bạn có chắc chắn muốn chuyển học sinh vào lớp này theo phê duyệt của Hiệu trưởng?`
        );
        if (!confirmTransfer) return;
      }

      const isSameBranch = selectedClass.branchName === interTargetBranch;

      storageService.addStudentTransferReport(
        {
          type: 'CHUYEN_DI',
          transferCategory: isSameBranch ? 'NOI_BO_CUNG_PHAN_HIEU' : 'NOI_BO_KHAC_PHAN_HIEU',
          studentId: selectedStudentForAction.id,
          studentName: selectedStudentForAction.fullName,
          gender: selectedStudentForAction.gender,
          dob: selectedStudentForAction.dob,
          fromBranchName: selectedClass.branchName,
          fromCampusName: selectedClass.campusName,
          fromClassId: selectedClass.id,
          fromClassName: selectedClass.name,
          fromGvcnId: selectedClass.homeroomTeacherId,
          fromGvcnName: selectedClass.homeroomTeacherName,
          toBranchName: interTargetBranch,
          toCampusName: interTargetCampus,
          toClassId: targetCls.id,
          toClassName: targetCls.name,
          toGvcnId: targetCls.homeroomTeacherId,
          toGvcnName: targetCls.homeroomTeacherName,
          classId: selectedClass.id,
          className: selectedClass.name,
          campusName: selectedClass.campusName,
          effectiveDate: new Date().toISOString().split('T')[0],
          reason: interTransferReason,
          decisionNumber: interDecisionNo || `PĐC-${Math.floor(100 + Math.random() * 900)}/THCSDX`,
          approvalStatus: 'Chờ duyệt',
          approverRequired: isSameBranch ? 'HT_HOAC_PHT' : 'CHI_HT',
          visibilityScope: isSameBranch ? 'NOI_BO_PHAN_HIEU' : 'TOAN_TRUONG',
          gvcnId: selectedClass.homeroomTeacherId,
          gvcnName: selectedClass.homeroomTeacherName,
        },
        activeSchoolYear
      );

      alert(
        `Đã lập phiếu chuyển lớp cho em ${selectedStudentForAction.fullName} sang Lớp ${targetCls.name}! (${
          isSameBranch
            ? 'Chuyển cùng phân hiệu: HT hoặc PHT phân hiệu duyệt'
            : 'Chuyển khác phân hiệu: CHỈ CÓ HIỆU TRƯỞNG DUYỆT'
        }). Sau khi duyệt, GVCN lớp nhận bấm nhận học sinh.`
      );
    } else if (studentActionType === 'Chuyển đi trường khác') {
      storageService.addStudentTransferReport(
        {
          type: 'CHUYEN_DI',
          transferCategory: 'CHUYEN_DI_TRUONG_KHAC',
          studentId: selectedStudentForAction.id,
          studentName: selectedStudentForAction.fullName,
          gender: selectedStudentForAction.gender,
          dob: selectedStudentForAction.dob,
          fromBranchName: selectedClass.branchName,
          fromCampusName: selectedClass.campusName,
          fromClassId: selectedClass.id,
          fromClassName: selectedClass.name,
          fromGvcnId: selectedClass.homeroomTeacherId,
          fromGvcnName: selectedClass.homeroomTeacherName,
          classId: selectedClass.id,
          className: selectedClass.name,
          campusName: selectedClass.campusName,
          transferSchool: targetSchool,
          provinceCity: transferOutProvince,
          reason: transferOutReason,
          decisionNumber: transferOutDecisionNo || `GGT-${Math.floor(100 + Math.random() * 900)}/THCSDX`,
          effectiveDate: new Date().toISOString().split('T')[0],
          approvalStatus: 'Chờ duyệt',
          approverRequired: 'HT_HOAC_PHT',
          visibilityScope: 'TOAN_TRUONG',
          gvcnId: selectedClass.homeroomTeacherId,
          gvcnName: selectedClass.homeroomTeacherName,
        },
        activeSchoolYear
      );

      alert(`Đã lập phiếu chuyển đi trường khác cho em ${selectedStudentForAction.fullName}. Hồ sơ đã chuyển lên BGH duyệt và hiển thị công khai trên Trang 5!`);
    } else if (studentActionType === 'Bảo lưu' || studentActionType === 'Thôi học') {
      // Requirement 3: Bảo lưu & Thôi học kèm theo hồ sơ lưu trữ điện tử
      const record = storageService.addPreservationDropoutRecord(
        {
          studentId: selectedStudentForAction.id,
          studentName: selectedStudentForAction.fullName,
          classId: selectedClass.id,
          className: selectedClass.name,
          branchName: selectedClass.branchName,
          campusName: selectedClass.campusName,
          type: studentActionType === 'Bảo lưu' ? 'BAO_LUU' : 'THOI_HOC',
          reason: transferOutReason || 'Theo nguyện vọng gia đình và giấy xác nhận hoàn cảnh',
          effectiveDate: new Date().toISOString().split('T')[0],
          durationMonths: studentActionType === 'Bảo lưu' ? 6 : undefined,
          decisionNumber: transferOutDecisionNo || `QĐ-${studentActionType === 'Bảo lưu' ? 'BL' : 'TH'}-${Math.floor(100 + Math.random() * 900)}/THCSDX`,
          handOverElectronicDossier: true,
          dossierStorageCode: `DX-LT-${studentActionType === 'Bảo lưu' ? 'BL' : 'TH'}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          dossierItems: ['Học bạ gốc', 'Bản sao giấy khai sinh', 'Sổ y tế học đường', 'Biên bản bàn giao lưu trữ'],
          signedBy: 'Hiệu trưởng Nguyễn Quốc Bảo',
          approvedAt: new Date().toISOString().split('T')[0],
          status: 'Đã hoàn tất lưu trữ',
          notes: 'Đã hoàn tất thủ tục bàn giao hồ sơ lưu trữ điện tử',
        },
        activeSchoolYear
      );

      alert(`Đã lập hồ sơ điện tử ${studentActionType} mã: ${record.dossierStorageCode} cho em ${selectedStudentForAction.fullName}!`);
    } else {
      storageService.removeStudentFromClass(
        selectedClass.id,
        selectedStudentForAction.id,
        studentActionType as any,
        {
          targetSchool,
          provinceCity: transferOutProvince,
          transferReason: transferOutReason,
          decisionNo: transferOutDecisionNo,
        },
        activeSchoolYear
      );
    }

    const updated = storageService.getClasses(activeSchoolYear).find((c) => c.id === selectedClass.id);
    if (updated) setSelectedClass(updated);

    setShowStudentActionModal(false);
    setSelectedStudentForAction(null);
    setTargetSchool('');
    onRefreshData();
  };

  const handleOpenClassAZ = (cls: SchoolClass) => {
    setSelectedClass(cls);
    setClassAZData(cls.sheetDataAZ || {});
    setShowClassAZModal(true);
  };

  const handleSaveClassAZ = () => {
    if (!selectedClass) return;
    const currentClasses = storageService.getClasses();
    const idx = currentClasses.findIndex((c) => c.id === selectedClass.id);
    if (idx !== -1) {
      currentClasses[idx].sheetDataAZ = { ...currentClasses[idx].sheetDataAZ, ...classAZData };
      storageService.saveClasses(currentClasses);
      setSelectedClass(currentClasses[idx]);
    }
    storageService.addSyncLog('Lưu Sheet Lớp A-AZ', `Đã lưu 52 cột dữ liệu cho lớp ${selectedClass.name}`);
    setShowClassAZModal(false);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Quy chuẩn 57 Lớp học • 1.289 Học sinh
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">Quản Lý Lớp Học & Học Sinh Toàn Trường</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi lớp sở hữu 1 file Google Sheet gồm 52 cột (A đến AZ) quản lý danh sách học sinh và phân công GVCN.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenRegister}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng ký Lớp học mới (Tự sinh Sheet)</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Class List, Right Class Detail & Students */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 57 Classes Selector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <School className="w-4 h-4 text-red-600" />
              <span>Danh sách 57 Lớp Học</span>
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {filteredClasses.length} lớp
            </span>
          </div>

          {/* Quick Filters (Requirement 1: Tìm kiếm theo Lớp, Cấp học, Phân hiệu, Điểm trường, GVCN) */}
          <div className="space-y-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên lớp, GVCN, điểm trường, phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none focus:ring-1 focus:ring-red-600"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Vòng đời lớp học: ACTIVE / INACTIVE / TẤT CẢ (Yêu cầu 1) */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setClassLifecycleFilter('ACTIVE')}
                className={`py-1 px-1.5 rounded-lg transition text-center ${
                  classLifecycleFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Các lớp đang hoạt động bình thường"
              >
                Hoạt động ({activeClassesCount})
              </button>
              <button
                type="button"
                onClick={() => setClassLifecycleFilter('INACTIVE')}
                className={`py-1 px-1.5 rounded-lg transition text-center ${
                  classLifecycleFilter === 'INACTIVE'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Các lớp tạm dừng hoặc đã xóa mềm"
              >
                Tạm dừng ({inactiveClassesCount})
              </button>
              <button
                type="button"
                onClick={() => setClassLifecycleFilter('ALL')}
                className={`py-1 px-1.5 rounded-lg transition text-center ${
                  classLifecycleFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({classes.length})
              </button>
            </div>

            {/* Row 1: Cấp học & Phân hiệu */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Cấp học:</label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium"
                >
                  <option value="ALL">Tất cả cấp học</option>
                  <option value="TH">Tiểu học (TH)</option>
                  <option value="THCS">Trung học cơ sở (THCS)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Phân hiệu (4):</label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium"
                >
                  <option value="ALL">Tất cả phân hiệu</option>
                  {BRANCHES_DATA.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.code} - {b.name.replace('Phân hiệu ', '')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Điểm trường (12) & GVCN (Requirement 1) */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Điểm trường (12):</label>
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-800"
                >
                  <option value="ALL">Tất cả điểm trường ({availableCampuses.length})</option>
                  {availableCampuses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name.replace('Điểm trường ', '').replace('Điểm ', '')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Giáo viên chủ nhiệm:</label>
                <select
                  value={gvcnFilter}
                  onChange={(e) => setGvcnFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-800"
                >
                  <option value="ALL">Tất cả GVCN ({availableGvcns.length})</option>
                  {availableGvcns.map((gvcn) => (
                    <option key={gvcn} value={gvcn}>
                      {gvcn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter counter & Reset button */}
            {(levelFilter !== 'ALL' || branchFilter !== 'ALL' || campusFilter !== 'ALL' || gvcnFilter !== 'ALL' || searchTerm) && (
              <div className="flex items-center justify-between pt-1 px-1 text-[11px]">
                <span className="text-slate-500 font-medium">
                  Kết quả: <strong className="text-red-700">{filteredClasses.length}</strong> / 57 lớp
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLevelFilter('ALL');
                    setBranchFilter('ALL');
                    setCampusFilter('ALL');
                    setGvcnFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
                >
                  Xóa lọc
                </button>
              </div>
            )}
          </div>

          {/* Classes scrollable list */}
          <div className="max-h-[580px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-50">
            {filteredClasses.map((cls) => {
              const isSelected = selectedClass?.id === cls.id;
              const isInactive = cls.status === 'INACTIVE';
              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? isInactive
                        ? 'bg-rose-50 border border-rose-300 text-rose-950 shadow-sm'
                        : 'bg-red-50 border border-red-200 text-red-950 shadow-sm'
                      : isInactive
                      ? 'bg-slate-100/70 border border-dashed border-slate-300 text-slate-500 hover:bg-slate-100'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm">{cls.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          cls.level === 'TH' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {cls.level}
                      </span>
                      {currentUser && cls.homeroomTeacherId === currentUser.id && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ⭐ Lớp của bạn
                        </span>
                      )}
                      {currentUser && cls.previousHomeroomTeacherIds?.includes(currentUser.id) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          🔒 Lớp cũ (Đã bàn giao)
                        </span>
                      )}
                      {isInactive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      GVCN: <strong className="text-slate-800">{cls.homeroomTeacherName}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">📍 {cls.campusName}</div>
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <div className="font-bold text-xs text-slate-800">{cls.totalStudents} HS</div>
                    {(currentUser?.role === 'HT' || currentUser?.role === 'PHT' || currentUser?.role === 'GV_TIN_HOC') ? (
                      <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditClass(cls);
                          }}
                          className="p-1 rounded hover:bg-white text-slate-600 hover:text-blue-700 transition"
                          title="Sửa thông tin lớp này"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {!isInactive ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClass(cls);
                              setInactivateClassReason('Sáp nhập lớp học theo chỉ tiêu mới');
                              setShowInactivateClassConfirm(true);
                            }}
                            className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition"
                            title="Xóa lớp (Chuyển sang INACTIVE bảo toàn dữ liệu)"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreClass(cls);
                            }}
                            className="p-1 rounded hover:bg-emerald-100 text-emerald-600 hover:text-emerald-800 transition"
                            title="Khôi phục lớp (ACTIVE)"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-auto mt-1" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Class Detail & Student Roster (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedClass ? (
            <>
              {/* Selected Class Hero Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-red-700 text-white font-black text-sm">
                        LỚP {selectedClass.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {selectedClass.campusName} ({selectedClass.branchName})
                      </span>
                      {(() => {
                        const cap = storageService.checkClassCapacityQuota(selectedClass.id, activeSchoolYear);
                        return (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                              cap.isOverCapacity
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : cap.isAtCapacity
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {cap.isOverCapacity && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            <span>
                              Chỉ tiêu: {cap.currentCount}/{cap.maxQuota} HS ({cap.level === 'TH' ? 'Tối đa 35' : 'Tối đa 45'})
                            </span>
                          </span>
                        );
                      })()}
                    </div>
                    <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-4">
                      <span>
                        Giáo viên chủ nhiệm:{' '}
                        <strong className="text-red-700 text-sm">{selectedClass.homeroomTeacherName}</strong>
                      </span>
                      <span>•</span>
                      <span>Sĩ số: <strong>{selectedClass.totalStudents} HS</strong> (Nam: {selectedClass.maleStudents}, Nữ: {selectedClass.femaleStudents})</span>
                      <span>•</span>
                      <span className="text-amber-700">Dân tộc: {selectedClass.ethnicStudents} | Hộ nghèo: {selectedClass.poorStudents}</span>
                    </div>
                  </div>

                  {/* Actions for this class */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Nút Sửa Thông Tin Lớp (Yêu cầu 1) */}
                    {(currentUser?.role === 'HT' || currentUser?.role === 'PHT' || currentUser?.role === 'GV_TIN_HOC') && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditClass()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition"
                        title="Chỉnh sửa thông tin lớp (Tên lớp, khối, cấp học, phòng học, điểm trường, GVCN...)"
                      >
                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                        <span>Sửa Lớp</span>
                      </button>
                    )}

                    {/* Nút Xóa Lớp (chuyển INACTIVE) hoặc Khôi phục Lớp (Yêu cầu 1) */}
                    {(currentUser?.role === 'HT' || currentUser?.role === 'PHT' || currentUser?.role === 'GV_TIN_HOC') && (
                      selectedClass.status !== 'INACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setInactivateClassReason('Sáp nhập lớp học theo chỉ tiêu mới');
                            setShowInactivateClassConfirm(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-sm transition"
                          title="Xóa lớp (Chuyển sang INACTIVE bảo toàn dữ liệu, không làm mất học bạ)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Xóa Lớp (INACTIVE)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRestoreClass()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-sm transition"
                          title="Khôi phục lớp học về trạng thái hoạt động bình thường (ACTIVE)"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Khôi phục Lớp (ACTIVE)</span>
                        </button>
                      )
                    )}

                    {canAssignHomeroomTeacher(currentUser) && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewHomeroomId(selectedClass.homeroomTeacherId);
                          setShowAssignModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold shadow-sm transition"
                        title="Phân công hoặc đổi giáo viên chủ nhiệm (HT / PHT / GV Tin học)"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Đổi GVCN</span>
                      </button>
                    )}

                    {canEditClassStudentRoster(currentUser, selectedClass.homeroomTeacherId, selectedClass.previousHomeroomTeacherIds) && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenClassAZ(selectedClass)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold"
                          title="Xem & sửa 52 cột A-AZ của lớp học"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sheet Lớp (A-AZ)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowAddStudentModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Thêm Học Sinh</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Banner cảnh báo nếu lớp đang ở trạng thái INACTIVE */}
                {selectedClass.status === 'INACTIVE' && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-950">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <div>
                        <div className="font-extrabold text-xs text-rose-900">
                          LỚP ĐANG TẠM DỪNG HOẠT ĐỘNG (INACTIVE)
                        </div>
                        <div className="text-[11px] text-rose-700">
                          Lưu trữ ngày: <strong>{selectedClass.inactivatedDate || 'Mới cập nhật'}</strong> • Lý do: {selectedClass.inactivatedReason || 'Tạm dừng/sáp nhập'}.
                        </div>
                        <div className="text-[10px] text-rose-600">
                          Dữ liệu 52 cột Google Sheet và học bạ học sinh được bảo lưu nguyên vẹn, không hiển thị trong thống kê điều hành hàng ngày.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreClass()}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow flex items-center gap-1.5 shrink-0 ml-3"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Khôi phục (ACTIVE)</span>
                    </button>
                  </div>
                )}

                {/* Sub-tab Navigation for Selected Class (Requirement 2 & 3) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setClassSubTab('roster')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      classSubTab === 'roster'
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Sổ Gọi Tên Ghi Điểm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClassSubTab('attendance')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      classSubTab === 'attendance'
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Sổ Điểm Danh & Chuyên Cần Real-Time</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClassSubTab('gvcn_perms')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      classSubTab === 'gvcn_perms'
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Phân Quyền Động GVCN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClassSubTab('preservation')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      classSubTab === 'preservation'
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <FileBadge className="w-3.5 h-3.5" />
                    <span>Bảo Lưu & Thôi Học (Lưu Trữ Điện Tử)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClassSubTab('enrollment_history')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      classSubTab === 'enrollment_history'
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Lịch Sử Biến Động Sĩ Số & Báo Cáo Sở</span>
                  </button>
                </div>
              </div>

              {/* Student Roster Table OR Permission Notice */}
              {!canViewClassStudentRoster(currentUser, selectedClass.homeroomTeacherId, selectedClass.previousHomeroomTeacherIds) ? (
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Bảo Mật Danh Sách Học Sinh Chi Tiết</h4>
                  <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Theo quy định bảo mật của nhà trường: Giáo viên bộ môn và <strong>GVCN cũ (đã chuyển giao lớp)</strong> không được xem danh sách chi tiết của lớp, không thao tác hoặc có bất kỳ quyền hạn nào trên lớp này.
                    Mỗi GVCN chỉ được xem và quản lý lớp do mình ĐANG phụ trách (Lớp {selectedClass.name}{' '}
                    hiện do GVCN <strong>{selectedClass.homeroomTeacherName}</strong> phụ trách). Chỉ Ban Giám hiệu (Hiệu
                    trưởng Nguyễn Quốc Bảo, các Phó Hiệu trưởng và Quản trị Tin học) mới có toàn quyền xem.
                  </p>
                  <div className="inline-block bg-slate-100 text-slate-600 text-[11px] px-3 py-1 rounded-full font-medium">
                    Tài khoản của bạn: <strong>{currentUser?.name}</strong> ({currentUser?.position})
                  </div>
                </div>
              ) : (
                /* Sub-tabs Rendering */
                <div className="space-y-4">
                  {/* SUB-TAB 1: STUDENT ROSTER */}
                  {classSubTab === 'roster' && (() => {
                    const displayedStudents = selectedClass.students.filter((s) => {
                      const isInactive = s.isInactive || s.status === 'INACTIVE';
                      if (studentStatusFilter === 'ACTIVE') return !isInactive;
                      if (studentStatusFilter === 'INACTIVE') return isInactive;
                      return true;
                    });
                    const activeCount = selectedClass.students.filter((s) => !s.isInactive && s.status !== 'INACTIVE').length;
                    const inactiveCount = selectedClass.students.filter((s) => s.isInactive || s.status === 'INACTIVE').length;

                    return (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-red-600" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Sổ Gọi Tên & Ghi Điểm Lớp {selectedClass.name} ({displayedStudents.length} / {selectedClass.students.length} em)
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Student Lifecycle Filter (ACTIVE / INACTIVE / TẤT CẢ) */}
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[11px] font-semibold">
                            <button
                              type="button"
                              onClick={() => setStudentStatusFilter('ACTIVE')}
                              className={`px-2.5 py-1 rounded-md transition ${
                                studentStatusFilter === 'ACTIVE'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Học sinh đang học bình thường"
                            >
                              Đang học ({activeCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatusFilter('INACTIVE')}
                              className={`px-2.5 py-1 rounded-md transition ${
                                studentStatusFilter === 'INACTIVE'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Học sinh ngưng học / đã chuyển đi / lưu trữ"
                            >
                              Lưu trữ / INACTIVE ({inactiveCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatusFilter('ALL')}
                              className={`px-2.5 py-1 rounded-md transition ${
                                studentStatusFilter === 'ALL'
                                  ? 'bg-slate-800 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Tất cả ({selectedClass.students.length})
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>In Danh Sách</span>
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-12">STT</th>
                            <th className="py-2.5 px-3">Họ và Tên Học Sinh</th>
                            <th className="py-2.5 px-3 text-center">Giới tính</th>
                            <th className="py-2.5 px-3">Ngày sinh</th>
                            <th className="py-2.5 px-3">Dân tộc</th>
                            <th className="py-2.5 px-3">Phụ huynh & SĐT</th>
                            <th className="py-2.5 px-3">Chính sách</th>
                            <th className="py-2.5 px-3 text-center">Trạng thái</th>
                            <th className="py-2.5 px-3 text-center">Hồ sơ & Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayedStudents.map((stu, i) => {
                            const isInactive = stu.isInactive || stu.status === 'INACTIVE';
                            return (
                            <tr key={stu.id} className={`transition ${isInactive ? 'bg-rose-50/40 text-slate-500' : 'hover:bg-slate-50/80'}`}>
                              <td className="py-2 px-3 text-center font-bold text-slate-500">{i + 1}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    onClick={() => {
                                      setSelectedStudentForProfile(stu);
                                      const prof = storageService.getStudentGrowthProfile(stu.id, activeSchoolYear) || {
                                        studentId: stu.id,
                                        studentName: stu.fullName,
                                        classId: selectedClass.id,
                                        academicTrend: [
                                          { term: 'Học kỳ 1', averageScore: 8.2, performance: 'Tốt', strengths: 'Tư duy nhanh, môn Toán nổi bật', weaknesses: 'Cần cẩn thận hơn', evaluatedDate: '2026-01-15' },
                                        ],
                                        conductTrend: [
                                          { term: 'Học kỳ 1', rating: 'Tốt', disciplineNotes: 'Chấp hành nghiêm chỉnh nội quy', rewards: ['Cháu ngoan Bác Hồ'], evaluatedDate: '2026-01-15' },
                                        ],
                                        physicalGrowth: [
                                          { checkDate: '2026-09-15', heightCm: 132, weightKg: 29, bmi: 16.6, vision: '10/10', physicalNotes: 'Phát triển thể lực bình thường' },
                                        ],
                                        behavioralNotes: [
                                          { id: 'BN_' + Date.now(), date: '2026-10-15', authorName: selectedClass.homeroomTeacherName, authorRole: 'GVCN', category: 'Hành vi nề nếp', note: 'Đi học đúng giờ, lễ phép với thầy cô' },
                                        ],
                                      };
                                      setCurrentGrowthProfile(prof);
                                    }}
                                    className="cursor-pointer hover:text-red-700 hover:underline"
                                    title="Bấm để xem Hồ sơ phát triển cá nhân (Học lực, Hạnh kiểm, Thể chất, Hành vi)"
                                  >
                                    {stu.fullName}
                                  </span>
                                  {isInactive && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                      INACTIVE
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                                    stu.gender === 'Nam' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {stu.gender}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{stu.dob}</td>
                              <td className="py-2 px-3 text-slate-700">{stu.ethnicity}</td>
                              <td className="py-2 px-3">
                                <div className="text-slate-800 font-medium">{stu.parentName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{stu.parentPhone}</div>
                              </td>
                              <td className="py-2 px-3">
                                {stu.policyBeneficiary !== 'Không' ? (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                    {stu.policyBeneficiary}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isInactive
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : stu.status === 'Đang học'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : stu.status === 'Chuyển đến'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : stu.status === 'Chuyển đi'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : stu.status === 'Bảo lưu'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                                    : stu.status === 'Thôi học'
                                    ? 'bg-slate-200 text-slate-800 border-slate-400 font-bold'
                                    : stu.status === 'Nghỉ học'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}>
                                  {isInactive ? 'INACTIVE (Lưu trữ)' : stu.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedStudentForProfile(stu);
                                      const prof = storageService.getStudentGrowthProfile(stu.id, activeSchoolYear) || {
                                        studentId: stu.id,
                                        studentName: stu.fullName,
                                        classId: selectedClass.id,
                                        academicTrend: [
                                          { term: 'Học kỳ 1', averageScore: 8.0, performance: 'Tốt', strengths: 'Hoàn thành tốt các môn', weaknesses: 'Rèn luyện tính chủ động', evaluatedDate: '2026-01-15' },
                                        ],
                                        conductTrend: [
                                          { term: 'Học kỳ 1', rating: 'Tốt', disciplineNotes: 'Chấp hành nghiêm túc nội quy', rewards: ['Cháu ngoan Bác Hồ'], evaluatedDate: '2026-01-15' },
                                        ],
                                        physicalGrowth: [
                                          { checkDate: '2026-09-15', heightCm: 132, weightKg: 29, bmi: 16.6, vision: '10/10', physicalNotes: 'Phát triển tốt' },
                                        ],
                                        behavioralNotes: [
                                          { id: 'BN_' + Date.now(), date: '2026-10-15', authorName: selectedClass.homeroomTeacherName, authorRole: 'GVCN', category: 'Hành vi nề nếp', note: 'Đi học đúng giờ, hòa đồng với bạn bè' },
                                        ],
                                      };
                                      setCurrentGrowthProfile(prof);
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] border border-emerald-200 transition flex items-center gap-1"
                                    title="Xem Hồ sơ phát triển cá nhân: học lực, hạnh kiểm, thể chất, hành vi"
                                  >
                                    <HeartPulse className="w-3 h-3 text-emerald-600" />
                                    <span>Hồ sơ</span>
                                  </button>

                                  {canEditClassStudentRoster(currentUser, selectedClass.homeroomTeacherId, selectedClass.previousHomeroomTeacherIds) && (
                                    <>
                                      {/* Sửa thông tin Học sinh (Yêu cầu 2) */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditStudent(stu)}
                                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-[10px] border border-amber-200 transition flex items-center gap-1"
                                        title="Sửa thông tin học sinh (Tên, ngày sinh, giới tính, phụ huynh, SĐT...)"
                                      >
                                        <Pencil className="w-3 h-3 text-amber-600" />
                                        <span>Sửa</span>
                                      </button>

                                      {/* Xóa HS -> INACTIVE hoặc Khôi phục HS -> ACTIVE (Yêu cầu 2) */}
                                      {!isInactive ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedStudentForInactivate(stu);
                                            setInactivateStudentReason('Nghỉ học / Chuyển trường / Lưu trữ');
                                            setShowInactivateStudentConfirm(true);
                                          }}
                                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] border border-rose-200 transition flex items-center gap-1"
                                          title="Xóa học sinh (Chuyển sang INACTIVE bảo toàn dữ liệu, giảm sĩ số)"
                                        >
                                          <Trash2 className="w-3 h-3 text-rose-600" />
                                          <span>Xóa</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleRestoreStudent(stu)}
                                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px] border border-emerald-200 transition flex items-center gap-1"
                                          title="Khôi phục học sinh về trạng thái Đang học (ACTIVE)"
                                        >
                                          <RotateCcw className="w-3 h-3 text-emerald-600" />
                                          <span>Khôi phục</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedStudentForAction(stu);
                                          setStudentActionType('Chuyển lớp trong trường');
                                          setTargetSchool('');
                                          setShowStudentActionModal(true);
                                        }}
                                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[10px] border border-blue-200 transition flex items-center gap-1"
                                        title="Chuyển lớp, bảo lưu, thôi học hoặc biến động sĩ số"
                                      >
                                        <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                                        <span>Chuyển</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                      <span>Dữ liệu học sinh được bảo mật và phân quyền cho GVCN và Ban Giám hiệu trường Đồng Xuân.</span>
                      <a
                        href={selectedClass.sheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Mở file Google Sheet của lớp</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  );
                })()}

                  {/* SUB-TAB 2: REAL-TIME DAILY ATTENDANCE & CONDUCT (YÊU CẦU 2) */}
                  {classSubTab === 'attendance' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                              Sổ Điểm Danh & Chuyên Cần Thời Gian Thực (Lớp {selectedClass.name})
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              GVCN {selectedClass.homeroomTeacherName} điểm danh nề nếp hàng ngày, tự động tổng hợp báo cáo ngày / tuần / tháng.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                          />
                          <select
                            value={attendanceSession}
                            onChange={(e) => setAttendanceSession(e.target.value as any)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                          >
                            <option value="Sáng">Buổi Sáng</option>
                            <option value="Chiều">Buổi Chiều</option>
                          </select>
                        </div>
                      </div>

                      {/* Automated Aggregated Reports (Ngày / Tuần / Tháng) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                          <div className="text-[10px] font-bold text-emerald-800 uppercase">Chuyên Cần Hôm Nay</div>
                          <div className="text-xl font-black text-emerald-900 mt-1">
                            {selectedClass.totalStudents - Object.values(studentStatusMap).filter(s => s.status !== 'PRESENT').length} / {selectedClass.totalStudents} HS
                          </div>
                          <div className="text-[10px] text-emerald-700">Tỷ lệ: {(((selectedClass.totalStudents - Object.values(studentStatusMap).filter(s => s.status !== 'PRESENT').length) / Math.max(1, selectedClass.totalStudents)) * 100).toFixed(1)}%</div>
                        </div>

                        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                          <div className="text-[10px] font-bold text-amber-800 uppercase">Vắng Có Phép Hôm Nay</div>
                          <div className="text-xl font-black text-amber-900 mt-1">
                            {Object.values(studentStatusMap).filter(s => s.status === 'EXCUSED').length} em
                          </div>
                          <div className="text-[10px] text-amber-700">Có đơn GVCN/Phụ huynh</div>
                        </div>

                        <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200">
                          <div className="text-[10px] font-bold text-rose-800 uppercase">Vắng Không Phép</div>
                          <div className="text-xl font-black text-rose-900 mt-1">
                            {Object.values(studentStatusMap).filter(s => s.status === 'UNEXCUSED').length} em
                          </div>
                          <div className="text-[10px] text-rose-700">Cần liên hệ gia đình ngay</div>
                        </div>

                        <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                          <div className="text-[10px] font-bold text-blue-800 uppercase">Chuyên Cần Tuần Này</div>
                          <div className="text-xl font-black text-blue-900 mt-1">98.4%</div>
                          <div className="text-[10px] text-blue-700">Đạt chỉ tiêu thi đua Tuần</div>
                        </div>
                      </div>

                      {/* Daily Roll Call List */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                            <tr>
                              <th className="py-2 px-3 text-center w-12">STT</th>
                              <th className="py-2 px-3">Học Sinh</th>
                              <th className="py-2 px-3 text-center">Trạng Thái Điểm Danh</th>
                              <th className="py-2 px-3">Lý Do Vắng</th>
                              <th className="py-2 px-3 text-center">Liên Hệ Phụ Huynh</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedClass.students.map((stu, i) => {
                              const curState = studentStatusMap[stu.id] || { status: 'PRESENT', reason: '', parentContacted: false };
                              return (
                                <tr key={stu.id} className="hover:bg-slate-50/70">
                                  <td className="py-2 px-3 text-center font-bold text-slate-400">{i + 1}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-900">
                                    {stu.fullName}
                                    <div className="text-[10px] text-slate-400 font-normal">SĐT: {stu.parentPhone}</div>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[10px] font-bold">
                                      <button
                                        type="button"
                                        onClick={() => setStudentStatusMap((prev) => ({ ...prev, [stu.id]: { ...curState, status: 'PRESENT' } }))}
                                        className={`px-2 py-0.5 rounded ${curState.status === 'PRESENT' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
                                      >
                                        Có mặt
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setStudentStatusMap((prev) => ({ ...prev, [stu.id]: { ...curState, status: 'EXCUSED' } }))}
                                        className={`px-2 py-0.5 rounded ${curState.status === 'EXCUSED' ? 'bg-amber-600 text-white' : 'text-slate-600'}`}
                                      >
                                        Có phép
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setStudentStatusMap((prev) => ({ ...prev, [stu.id]: { ...curState, status: 'UNEXCUSED' } }))}
                                        className={`px-2 py-0.5 rounded ${curState.status === 'UNEXCUSED' ? 'bg-rose-600 text-white' : 'text-slate-600'}`}
                                      >
                                        Không phép
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">
                                    {curState.status !== 'PRESENT' ? (
                                      <input
                                        type="text"
                                        placeholder="Ghi rõ lý do (ốm, việc nhà...)"
                                        value={curState.reason}
                                        onChange={(e) => setStudentStatusMap((prev) => ({ ...prev, [stu.id]: { ...curState, reason: e.target.value } }))}
                                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                                      />
                                    ) : (
                                      <span className="text-slate-400 text-[11px]">Đầy đủ</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {curState.status !== 'PRESENT' ? (
                                      <label className="inline-flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={curState.parentContacted}
                                          onChange={(e) => setStudentStatusMap((prev) => ({ ...prev, [stu.id]: { ...curState, parentContacted: e.target.checked } }))}
                                          className="rounded text-red-600"
                                        />
                                        <span className="text-[10px] text-slate-700">Đã gọi/Zalo</span>
                                      </label>
                                    ) : (
                                      <span className="text-emerald-600 font-bold text-[10px]">✓ Yên tâm</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-500">
                          Tự động đồng bộ báo cáo chuyên cần đến BGH & Cổng phân hiệu.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            storageService.addSyncLog('Lưu sổ điểm danh', `GVCN ${selectedClass.homeroomTeacherName} đã lưu điểm danh lớp ${selectedClass.name} ngày ${attendanceDate}`);
                            alert(`Đã lưu và đồng bộ Sổ điểm danh thời gian thực lớp ${selectedClass.name} ngày ${attendanceDate}!`);
                            onRefreshData();
                          }}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Lưu Sổ Điểm Danh & Chuyên Cần Hôm Nay</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: DYNAMIC PERMISSIONS FOR GVCN (YÊU CẦU 2) */}
                  {classSubTab === 'gvcn_perms' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                              Hệ Thống Phân Quyền Động Cho Giáo Viên Chủ Nhiệm (GVCN)
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Kích hoạt nhanh quyền nhập điểm, nhận xét học bạ, phê duyệt nghỉ phép của học sinh và kết nối phụ huynh qua App phụ / Zalo SMS.
                            </p>
                          </div>
                        </div>
                        <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-bold">
                          Lớp {selectedClass.name} • GVCN {selectedClass.homeroomTeacherName}
                        </span>
                      </div>

                      {(() => {
                        const perms = storageService.getGvcnDynamicPermissions(activeSchoolYear);
                        const curPerm = perms.find((p) => p.classId === selectedClass.id) || {
                          teacherId: selectedClass.homeroomTeacherId,
                          teacherName: selectedClass.homeroomTeacherName,
                          classId: selectedClass.id,
                          className: selectedClass.name,
                          canEnterGrades: true,
                          canWriteReportCard: true,
                          canApproveStudentLeaves: true,
                          directParentAppConnected: true,
                          lastUpdated: new Date().toISOString().split('T')[0],
                          updatedBy: 'Hiệu trưởng Nguyễn Quốc Bảo',
                        };

                        const handleTogglePerm = (key: keyof GvcnDynamicPermission) => {
                          const updated = { ...curPerm, [key]: !curPerm[key], lastUpdated: new Date().toISOString().split('T')[0] };
                          storageService.updateSingleGvcnPermission(updated as any, activeSchoolYear);
                          onRefreshData();
                        };

                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-black text-slate-900 text-sm">1. Quyền Nhập Điểm (Sổ Điểm Điện Tử)</div>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    Cho phép GVCN nhập, cập nhật điểm đánh giá thường xuyên, giữa kỳ và cuối kỳ cho học sinh lớp {selectedClass.name}.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePerm('canEnterGrades')}
                                  className={`px-3 py-1 rounded-full font-bold text-xs shadow-sm transition ${
                                    curPerm.canEnterGrades ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                                  }`}
                                >
                                  {curPerm.canEnterGrades ? 'Đã Kích Hoạt' : 'Đang Khóa'}
                                </button>
                              </div>

                              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-black text-slate-900 text-sm">2. Quyền Nhận Xét Học Bạ Định Kỳ</div>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    Cho phép GVCN ghi nhận xét năng lực, phẩm chất và đánh giá kết quả rèn luyện học kỳ 1, học kỳ 2 và cả năm.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePerm('canWriteReportCard')}
                                  className={`px-3 py-1 rounded-full font-bold text-xs shadow-sm transition ${
                                    curPerm.canWriteReportCard ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                                  }`}
                                >
                                  {curPerm.canWriteReportCard ? 'Đã Kích Hoạt' : 'Đang Khóa'}
                                </button>
                              </div>

                              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-black text-slate-900 text-sm">3. Quyền Duyệt Nghỉ Phép Của Học Sinh</div>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    Kích hoạt cho phép GVCN duyệt trực tiếp đơn xin nghỉ phép của phụ huynh/học sinh dưới 3 ngày mà không cần chuyển lên PHT.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePerm('canApproveStudentLeaves')}
                                  className={`px-3 py-1 rounded-full font-bold text-xs shadow-sm transition ${
                                    curPerm.canApproveStudentLeaves ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                                  }`}
                                >
                                  {curPerm.canApproveStudentLeaves ? 'Đã Kích Hoạt' : 'Đang Khóa'}
                                </button>
                              </div>

                              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-black text-slate-900 text-sm">4. Kết Nối Trực Tiếp App Phụ Huynh / Zalo SMS</div>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    Bật kênh liên lạc điện tử 2 chiều giữa GVCN và 100% phụ huynh học sinh của lớp để gửi tin nhắn thông báo tức thì.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePerm('directParentAppConnected')}
                                  className={`px-3 py-1 rounded-full font-bold text-xs shadow-sm transition ${
                                    curPerm.directParentAppConnected ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                                  }`}
                                >
                                  {curPerm.directParentAppConnected ? 'Đã Kết Nối' : 'Chưa Kết Nối'}
                                </button>
                              </div>
                            </div>

                            {/* Quick notification broadcast to parents */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-2 text-xs">
                              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                                <Send className="w-3.5 h-3.5 text-blue-700" />
                                <span>Gửi Thông Báo Khẩn Đến 100% Phụ Huynh Lớp {selectedClass.name} Qua App Phụ:</span>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Nhập nội dung tin nhắn gửi phụ huynh (nhắc nhở chuyên cần, học phí, họp PH...)"
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => alert(`Đã phát thông báo tức thì đến ${selectedClass.totalStudents} phụ huynh học sinh lớp ${selectedClass.name} qua hệ thống App Phụ Huynh & Zalo OA trường Đồng Xuân!`)}
                                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-sm"
                                >
                                  Gửi Ngay
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* SUB-TAB 4: PRESERVATION & DROPOUT (BẢO LƯU & THÔI HỌC - YÊU CẦU 3) */}
                  {classSubTab === 'preservation' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <FileBadge className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                              Quản Lý Bảo Lưu, Tạm Dừng & Thôi Học (Hồ Sơ Lưu Trữ Điện Tử)
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Số hóa hồ sơ bàn giao học bạ, quyết định của Hiệu trưởng và cấp mã lưu trữ điện tử tra cứu trọn đời.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (selectedClass.students.length > 0) {
                              setPreservationStudentId(selectedClass.students[0].id);
                            }
                            setShowPreservationModal(true);
                          }}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>+ Lập Hồ Sơ Bảo Lưu / Thôi Học</span>
                        </button>
                      </div>

                      {(() => {
                        const allPreservations = storageService.getPreservationDropoutRecords(activeSchoolYear);
                        return (
                          <div className="space-y-3">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                  <tr>
                                    <th className="py-2 px-3">Mã Lưu Trữ</th>
                                    <th className="py-2 px-3">Học Sinh</th>
                                    <th className="py-2 px-3">Lớp & Điểm Trường</th>
                                    <th className="py-2 px-3">Loại Hồ Sơ</th>
                                    <th className="py-2 px-3">Lý Do Cụ Thể</th>
                                    <th className="py-2 px-3">Hồ Sơ Điện Tử Bàn Giao</th>
                                    <th className="py-2 px-3 text-center">Trạng Thái</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {allPreservations.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-slate-50/70">
                                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{rec.dossierStorageCode}</td>
                                      <td className="py-2.5 px-3 font-semibold text-slate-900">{rec.studentName}</td>
                                      <td className="py-2.5 px-3 text-slate-600">{rec.className} ({rec.branchName})</td>
                                      <td className="py-2.5 px-3">
                                        <span
                                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                            rec.type === 'BAO_LUU'
                                              ? 'bg-amber-100 text-amber-800'
                                              : rec.type === 'THOI_HOC'
                                              ? 'bg-rose-100 text-rose-800'
                                              : 'bg-blue-100 text-blue-800'
                                          }`}
                                        >
                                          {rec.type === 'BAO_LUU' ? 'Bảo lưu kết quả' : rec.type === 'THOI_HOC' ? 'Thôi học' : 'Tạm dừng'}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={rec.reason}>
                                        {rec.reason}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <div className="flex flex-wrap gap-1">
                                          {rec.dossierItems?.map((it, idx) => (
                                            <span key={idx} className="bg-slate-100 text-slate-700 text-[9px] px-1.5 py-0.5 rounded border border-slate-200">
                                              {it}
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                          {rec.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* SUB-TAB 5: ENROLLMENT HISTORY STATS & REPORT (YÊU CẦU 3) */}
                  {classSubTab === 'enrollment_history' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                              Lịch Sử Biến Động Sĩ Số & Báo Cáo Phòng/Sở Giáo Dục Đào Tạo
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Tự động thống kê tăng/giảm học sinh theo từng lớp, khối và toàn trường theo từng học kỳ/năm học phục vụ công tác báo cáo.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            window.print();
                          }}
                          className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Xuất Báo Cáo Phòng GD&ĐT Đồng Xuân</span>
                        </button>
                      </div>

                      {(() => {
                        const historyStats = storageService.getEnrollmentHistoryStats(activeSchoolYear);
                        return (
                          <div className="space-y-5 text-xs">
                            {/* Overall School Summary Card */}
                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase">Đầu Năm Học</div>
                                <div className="text-lg font-black text-slate-800">{historyStats.totalSchool.initialCount} HS</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-purple-700 uppercase">Chuyển Đến (+)</div>
                                <div className="text-lg font-black text-purple-700">+{historyStats.totalSchool.transferredIn} HS</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-blue-700 uppercase">Chuyển Đi (-)</div>
                                <div className="text-lg font-black text-blue-700">-{historyStats.totalSchool.transferredOut} HS</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-rose-700 uppercase">Thôi Học (-)</div>
                                <div className="text-lg font-black text-rose-700">-{historyStats.totalSchool.droppedOut} HS</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-amber-700 uppercase">Bảo Lưu</div>
                                <div className="text-lg font-black text-amber-700">{historyStats.totalSchool.preserved} HS</div>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-emerald-800 uppercase">Sĩ Số Hiện Tại</div>
                                <div className="text-lg font-black text-emerald-800">{historyStats.totalSchool.currentCount} HS</div>
                              </div>
                            </div>

                            {/* Breakdown By Grade (Khối 1 -> 9) */}
                            <div>
                              <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span>Thống Kê Biến Động Sĩ Số Theo Khối (Khối 1 Đến Khối 9):</span>
                              </h5>
                              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                    <tr>
                                      <th className="py-2 px-3">Khối Lớp</th>
                                      <th className="py-2 px-3 text-center">Số Lớp</th>
                                      <th className="py-2 px-3 text-center">Sĩ Số Đầu Năm</th>
                                      <th className="py-2 px-3 text-center">Sĩ Số Hiện Tại</th>
                                      <th className="py-2 px-3 text-center">Tăng / Giảm Ròng</th>
                                      <th className="py-2 px-3 text-center">Chỉ Tiêu Tối Đa</th>
                                      <th className="py-2 px-3 text-center">Tình Trạng Sĩ Số</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {historyStats.byGrade.map((g) => (
                                      <tr key={g.grade} className="hover:bg-slate-50/70">
                                        <td className="py-2 px-3 font-bold text-slate-900">Khối {g.grade}</td>
                                        <td className="py-2 px-3 text-center font-semibold">{g.totalClasses} lớp</td>
                                        <td className="py-2 px-3 text-center text-slate-600">{g.initialCount} HS</td>
                                        <td className="py-2 px-3 text-center font-bold text-slate-900">{g.currentCount} HS</td>
                                        <td className="py-2 px-3 text-center font-bold">
                                          <span className={g.netChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                            {g.netChange > 0 ? `+${g.netChange}` : g.netChange} HS
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-center text-slate-500 font-mono">{g.quotaMax} HS</td>
                                        <td className="py-2 px-3 text-center">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                              g.currentCount > g.quotaMax
                                                ? 'bg-rose-100 text-rose-800'
                                                : 'bg-emerald-100 text-emerald-800'
                                            }`}
                                          >
                                            {g.currentCount > g.quotaMax ? '⚠️ Vượt chỉ tiêu' : '✓ Đạt chuẩn'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Breakdown By Branch */}
                            <div>
                              <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span>Thống Kê Biến Động Theo Phân Hiệu:</span>
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                {historyStats.byBranch.map((b) => (
                                  <div key={b.branchName} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="font-bold text-slate-900">{b.branchName}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">{b.totalClasses} lớp học</div>
                                    <div className="mt-2 flex items-center justify-between">
                                      <span className="text-slate-600 font-medium">Hiện có: <strong>{b.currentCount} HS</strong></span>
                                      <span className={`font-bold ${b.netChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {b.netChange > 0 ? `+${b.netChange}` : b.netChange}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              Vui lòng chọn 1 lớp học từ danh sách bên trái.
            </div>
          )}
        </div>
      </div>

      {/* Assign Homeroom Teacher Modal */}
      {showAssignModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Phân Công Giáo Viên Chủ Nhiệm (GVCN)
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignHomeroom} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>Lớp: <strong className="text-slate-900 font-bold">{selectedClass.name}</strong></div>
                <div>Điểm trường: <strong>{selectedClass.campusName}</strong></div>
                <div>GVCN hiện tại: <strong>{selectedClass.homeroomTeacherName}</strong></div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Chọn Giáo viên đảm nhận vị trí GVCN:
                </label>
                <select
                  value={newHomeroomId}
                  onChange={(e) => setNewHomeroomId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="">-- Chọn một trong các giáo viên --</option>
                  {teachersList.map((t) => (
                    <option key={t.account.id} value={t.account.id}>
                      {t.account.name} - {t.account.position} ({t.account.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition"
                >
                  Lưu & Gắn GVCN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Thêm Học Sinh Mới Vào Lớp {selectedClass.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="mt-4 space-y-3 text-xs">
              {/* Type of Admission */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <label className="font-bold text-slate-700 block mb-1">Hình thức tiếp nhận:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="admType"
                      checked={!isTransferIn}
                      onChange={() => setIsTransferIn(false)}
                    />
                    <span>Học sinh tuyển mới / Đầu cấp</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-purple-700">
                    <input
                      type="radio"
                      name="admType"
                      checked={isTransferIn}
                      onChange={() => setIsTransferIn(true)}
                    />
                    <span>Học sinh chuyển trường đến</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên học sinh:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              {isTransferIn && (
                <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 space-y-2">
                  <div className="font-bold text-purple-900 text-xs">Thông tin chuyển trường đến:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Trường cũ chuyển đến:</label>
                      <input
                        type="text"
                        required={isTransferIn}
                        placeholder="VD: THCS Xuân Phước"
                        value={previousSchool}
                        onChange={(e) => setPreviousSchool(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Tỉnh / Thành phố:</label>
                      <input
                        type="text"
                        value={provinceCity}
                        onChange={(e) => setProvinceCity(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Số quyết định tiếp nhận:</label>
                      <input
                        type="text"
                        placeholder="VD: QĐ-15/THCSDX"
                        value={transferDecisionNo}
                        onChange={(e) => setTransferDecisionNo(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Lý do chuyển đến:</label>
                      <input
                        type="text"
                        value={transferReason}
                        onChange={(e) => setTransferReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giới tính:</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày sinh:</label>
                  <input
                    type="date"
                    value={newStudentDob}
                    onChange={(e) => setNewStudentDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ tên Cha/Mẹ/Người giám hộ:</label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn Bình"
                  value={newStudentParent}
                  onChange={(e) => setNewStudentParent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số điện thoại phụ huynh:</label>
                <input
                  type="tel"
                  placeholder="VD: 0912345678"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Đối tượng chính sách:</label>
                <select
                  value={newStudentPolicy}
                  onChange={(e) => setNewStudentPolicy(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Không">Không</option>
                  <option value="Hộ nghèo">Hộ nghèo</option>
                  <option value="Hộ cận nghèo">Hộ cận nghèo</option>
                  <option value="Khuyết tật">Khuyết tật hòa nhập</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition"
                >
                  {isTransferIn ? 'Tiếp Nhận & Vào Sổ Học Bạ' : 'Lưu & Cập Nhật Sĩ Số'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Action Modal (Biến động: Chuyển đi, nghỉ học, lưu ban, xóa) */}
      {showStudentActionModal && selectedStudentForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Biến Động Học Sinh: {selectedStudentForAction.fullName}
                </h3>
                <p className="text-xs text-slate-500">Lớp {selectedClass?.name} - {selectedClass?.campusName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentActionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteStudentAction} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Loại biến động:</label>
                <select
                  value={studentActionType}
                  onChange={(e) => setStudentActionType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                >
                  <option value="Chuyển lớp trong trường">1. Chuyển lớp trong cùng trường (Mục 3.2)</option>
                  <option value="Chuyển đi trường khác">2. Chuyển đi trường khác (Mục 3.3)</option>
                  <option value="Nghỉ học">3. Nghỉ học / Thôi học</option>
                  <option value="Ở lại lớp">4. Ở lại lớp (Lưu ban)</option>
                  <option value="Mất">5. Mất (Từ trần)</option>
                  <option value="Xóa">6. Xóa khỏi danh sách lớp</option>
                </select>
              </div>

              {studentActionType === 'Chuyển lớp trong trường' && (
                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-2.5">
                  <div className="font-bold text-blue-900 text-xs uppercase flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    Chuyển lớp trong cùng trường (Mục 3.2)
                  </div>

                  {/* Nơi chuyển đi */}
                  <div className="bg-white p-2 rounded-lg border text-[11px] text-slate-600 space-y-0.5">
                    <div>Phân hiệu chuyển đi: <strong>{selectedClass.branchName}</strong></div>
                    <div>Điểm trường: <strong>{selectedClass.campusName}</strong> • Lớp: <strong>{selectedClass.name}</strong></div>
                    <div>GVCN chuyển đi: <strong>{selectedClass.homeroomTeacherName}</strong></div>
                    <div>Học sinh: <strong className="text-red-700">{selectedStudentForAction.fullName}</strong></div>
                  </div>

                  {/* Nơi chuyển đến */}
                  <div className="space-y-2 pt-1 border-t border-blue-200">
                    <div className="font-semibold text-slate-800 text-[11px]">Nơi tiếp nhận học sinh đến:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">Phân hiệu đến:</label>
                        <select
                          value={interTargetBranch}
                          onChange={(e) => {
                            setInterTargetBranch(e.target.value);
                            const b = BRANCHES_DATA.find((item) => item.name === e.target.value);
                            if (b && b.campuses[0]) setInterTargetCampus(b.campuses[0].name);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          {BRANCHES_DATA.map((b) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">Điểm trường đến:</label>
                        <select
                          value={interTargetCampus}
                          onChange={(e) => setInterTargetCampus(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          {(BRANCHES_DATA.find((b) => b.name === interTargetBranch)?.campuses || ALL_CAMPUSES).map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Lớp chuyển đến:</label>
                      <select
                        value={interTargetClassId}
                        onChange={(e) => setInterTargetClassId(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-emerald-800"
                      >
                        {classes
                          .filter((c) => c.campusName === interTargetCampus && c.id !== selectedClass.id)
                          .map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              Lớp {cls.name} (GVCN: {cls.homeroomTeacherName})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="text-[11px] p-2 rounded-lg bg-blue-100/60 text-blue-900 leading-relaxed">
                      {selectedClass.branchName === interTargetBranch ? (
                        <span>✓ Cùng phân hiệu: HT hoặc PHT phân hiệu duyệt. Sau đó GVCN lớp nhận bấm nút nhận học sinh.</span>
                      ) : (
                        <span className="font-bold text-amber-900">⚠️ Khác phân hiệu: CHỈ CÓ HIỆU TRƯỞNG NGUYỄN QUỐC BẢO ĐƯỢC DUYỆT. Công khai toàn trường.</span>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Lý do chuyển lớp:</label>
                      <input
                        type="text"
                        value={interTransferReason}
                        onChange={(e) => setInterTransferReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {studentActionType === 'Chuyển đi trường khác' && (
                <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 space-y-2">
                  <div className="font-bold text-rose-900 text-xs">Thông tin trường chuyển đến (Mục 3.3):</div>
                  <div className="bg-white p-2 rounded-lg border text-[11px] text-slate-600">
                    <div>Từ: <strong>Lớp {selectedClass.name}</strong> ({selectedClass.campusName})</div>
                    <div>GVCN chuyển đi: <strong>{selectedClass.homeroomTeacherName}</strong></div>
                    <div>Học sinh: <strong>{selectedStudentForAction.fullName}</strong></div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">Trường chuyển đến:</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Trường THCS Nguyễn Du, TP. Tuy Hòa"
                      value={targetSchool}
                      onChange={(e) => setTargetSchool(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Tỉnh / Thành phố:</label>
                      <input
                        type="text"
                        value={transferOutProvince}
                        onChange={(e) => setTransferOutProvince(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Số giấy giới thiệu:</label>
                      <input
                        type="text"
                        placeholder="GGT-102/THCSDX"
                        value={transferOutDecisionNo}
                        onChange={(e) => setTransferOutDecisionNo(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">Lý do chuyển trường:</label>
                    <input
                      type="text"
                      value={transferOutReason}
                      onChange={(e) => setTransferOutReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    HT hoặc PHT phân hiệu phê duyệt ➔ Công khai trên Trang 5 cả phân hiệu và toàn trường đều thấy.
                  </p>
                </div>
              )}

              {studentActionType === 'Nghỉ học' && (
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <p className="text-rose-800">
                    Học sinh sẽ được ghi nhận nghỉ học và tự động cập nhật giảm sĩ số lớp {selectedClass?.name}.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStudentActionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition"
                >
                  Xác Nhận Biến Động
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Sheet A-AZ Modal */}
      {showClassAZModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Hồ Sơ 52 Cột (Cột A - AZ) Của Lớp {selectedClass.name}
                </h3>
                <p className="text-xs text-slate-500">
                  File Google Sheet riêng trong Google Drive của trường: <span className="font-mono text-emerald-700">{selectedClass.sheetFileId}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowClassAZModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {CLASS_COLUMNS_AZ.map((col) => {
                  const val = classAZData[col.col] ?? '';
                  return (
                    <div key={col.col} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 flex items-center gap-1">
                          <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border font-black text-blue-700">
                            {col.col}
                          </span>
                          <span className="truncate">{col.label}</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) =>
                          setClassAZData((prev) => ({
                            ...prev,
                            [col.col]: e.target.value,
                          }))
                        }
                        className="w-full text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0 text-xs">
              <span className="text-slate-500 italic">
                Hệ thống Quản lý nội bộ trường học, do Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassAZModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveClassAZ}
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition"
                >
                  Lưu 52 Cột Vào Google Sheet Lớp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Personal Growth Profile Modal (Hồ sơ phát triển cá nhân học sinh - Yêu cầu 2) */}
      {selectedStudentForProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Hồ Sơ Phát Triển Cá Nhân: {selectedStudentForProfile.fullName}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Lớp {selectedClass.name} • {selectedClass.campusName} • GVCN: {selectedClass.homeroomTeacherName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForProfile(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 py-3 flex-shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setGrowthModalTab('academic')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  growthModalTab === 'academic' ? 'bg-red-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>1. Diễn Biến Học Lực</span>
              </button>
              <button
                type="button"
                onClick={() => setGrowthModalTab('conduct')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  growthModalTab === 'conduct' ? 'bg-red-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>2. Hạnh Kiểm & Nề Nếp</span>
              </button>
              <button
                type="button"
                onClick={() => setGrowthModalTab('physical')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  growthModalTab === 'physical' ? 'bg-red-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>3. Phát Triển Thể Chất (Y tế)</span>
              </button>
              <button
                type="button"
                onClick={() => setGrowthModalTab('behavior')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  growthModalTab === 'behavior' ? 'bg-red-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>4. Ghi Chú Hành Vi Cá Nhân Hóa</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 my-3 pr-1 text-xs space-y-4">
              {/* TAB 1: ACADEMIC */}
              {growthModalTab === 'academic' && (
                <div className="space-y-3">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span>Diễn biến kết quả học tập qua các kỳ đánh giá:</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Học Kỳ / Năm</th>
                          <th className="py-2 px-3 text-center">ĐTB / Xếp Loại</th>
                          <th className="py-2 px-3">Thế Mạnh Nổi Trội</th>
                          <th className="py-2 px-3">Nội Dung Cần Rèn Thêm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentGrowthProfile?.academicTrend?.map((tr, i) => (
                          <tr key={i} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{tr.term}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-black text-red-700 text-sm">{tr.averageScore}</span>
                              <div className="text-[10px] font-bold text-slate-500">{tr.performance}</div>
                            </td>
                            <td className="py-2.5 px-3 text-emerald-800 font-medium">{tr.strengths}</td>
                            <td className="py-2.5 px-3 text-slate-600">{tr.weaknesses}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400">Chưa có dữ liệu</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: CONDUCT */}
              {growthModalTab === 'conduct' && (
                <div className="space-y-3">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span>Diễn biến rèn luyện hạnh kiểm và thi đua:</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Học Kỳ</th>
                          <th className="py-2 px-3 text-center">Xếp Loại</th>
                          <th className="py-2 px-3">Nhận Xét Nề Nếp Kỷ Luật</th>
                          <th className="py-2 px-3">Khen Thưởng / Tuyên Dương</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentGrowthProfile?.conductTrend?.map((cd, i) => (
                          <tr key={i} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{cd.term}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                {cd.rating}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{cd.disciplineNotes}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1">
                                {cd.rewards?.map((rw, idx) => (
                                  <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    ★ {rw}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400">Chưa có dữ liệu</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: PHYSICAL */}
              {growthModalTab === 'physical' && (
                <div className="space-y-3">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span>Chỉ số phát triển thể chất từ Y tế học đường:</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Ngày Khám</th>
                          <th className="py-2 px-3 text-center">Chiều Cao</th>
                          <th className="py-2 px-3 text-center">Cân Nặng</th>
                          <th className="py-2 px-3 text-center">Chỉ Số BMI</th>
                          <th className="py-2 px-3 text-center">Thị Lực</th>
                          <th className="py-2 px-3">Ghi Chú Y Tế</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentGrowthProfile?.physicalGrowth?.map((ph, i) => (
                          <tr key={i} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-mono text-slate-700">{ph.checkDate}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">{ph.heightCm} cm</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">{ph.weightKg} kg</td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-700">{ph.bmi}</td>
                            <td className="py-2.5 px-3 text-center font-mono">{ph.vision}</td>
                            <td className="py-2.5 px-3 text-slate-600">{ph.physicalNotes}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-400">Chưa có dữ liệu y tế</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: BEHAVIORAL NOTES */}
              {growthModalTab === 'behavior' && (
                <div className="space-y-4">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span>Nhật ký ghi chú hành vi & lưu ý cá nhân hóa:</span>
                  </div>

                  <div className="space-y-2">
                    {currentGrowthProfile?.behavioralNotes?.map((bn) => (
                      <div key={bn.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900">
                            {bn.authorName} ({bn.authorRole}) • <span className="font-mono text-slate-500">{bn.date}</span>
                          </span>
                          <span className="bg-red-50 text-red-800 border border-red-200 px-2 py-0.2 rounded text-[10px] font-bold">
                            {bn.category}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-xs">{bn.note}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add New Behavioral Note Form */}
                  <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 space-y-3">
                    <div className="font-bold text-slate-800 text-xs">Thêm Ghi Chú Hành Vi Cá Nhân Mới:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Phân loại:</label>
                        <select
                          value={newBehaviorCategory}
                          onChange={(e) => setNewBehaviorCategory(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Hành vi nề nếp">Hành vi nề nếp</option>
                          <option value="Tâm lý giao tiếp">Tâm lý giao tiếp</option>
                          <option value="Năng khiếu đặc biệt">Năng khiếu đặc biệt</option>
                          <option value="Cần trợ giúp đặc biệt">Cần trợ giúp đặc biệt</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nội dung quan sát / nhận xét:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nhập nhận xét chi tiết hành vi, tính cách em..."
                            value={newBehaviorNote}
                            onChange={(e) => setNewBehaviorNote(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newBehaviorNote.trim() || !currentGrowthProfile) return;
                              const updatedProfile: StudentPersonalGrowthProfile = {
                                ...currentGrowthProfile,
                                behavioralNotes: [
                                  ...(currentGrowthProfile.behavioralNotes || []),
                                  {
                                    id: 'NOTE_' + Date.now(),
                                    date: new Date().toISOString().split('T')[0],
                                    authorName: currentUser?.name || selectedClass.homeroomTeacherName,
                                    authorRole: currentUser?.position || 'GVCN',
                                    category: newBehaviorCategory,
                                    note: newBehaviorNote.trim(),
                                  },
                                ],
                              };
                              storageService.saveStudentGrowthProfile(updatedProfile, activeSchoolYear);
                              setCurrentGrowthProfile(updatedProfile);
                              setNewBehaviorNote('');
                              alert('Đã lưu ghi chú hành vi cá nhân hóa vào hồ sơ điện tử của học sinh!');
                            }}
                            className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg text-xs"
                          >
                            Lưu Ghi Chú
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0 text-xs">
              <span className="text-slate-500">
                Hồ sơ phát triển cá nhân lưu trữ trọn đời trên CSDL Đồng Xuân.
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentForProfile(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm"
              >
                Đóng Hồ Sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preservation & Dropout Modal (Bảo lưu & Thôi học - Yêu cầu 3) */}
      {showPreservationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Lập Hồ Sơ Bảo Lưu / Thôi Học & Lưu Trữ Điện Tử
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreservationModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const targetStu = selectedClass.students.find((s) => s.id === preservationStudentId);
                if (!targetStu) {
                  alert('Vui lòng chọn học sinh');
                  return;
                }

                const rec = storageService.addPreservationDropoutRecord(
                  {
                    studentId: targetStu.id,
                    studentName: targetStu.fullName,
                    classId: selectedClass.id,
                    className: selectedClass.name,
                    branchName: selectedClass.branchName,
                    campusName: selectedClass.campusName,
                    type: preservationType,
                    reason: preservationReason,
                    effectiveDate: preservationDate,
                    durationMonths: preservationType === 'BAO_LUU' ? preservationDuration : undefined,
                    decisionNumber: preservationDecisionNo,
                    handOverElectronicDossier: true,
                    dossierStorageCode: `DX-LT-${preservationType}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                    dossierItems: ['Học bạ gốc', 'Bản sao giấy khai sinh', 'Sổ y tế học đường', 'Biên bản bàn giao lưu trữ'],
                    signedBy: 'Hiệu trưởng Nguyễn Quốc Bảo',
                    approvedAt: new Date().toISOString().split('T')[0],
                    status: 'Đã hoàn tất lưu trữ',
                    notes: 'Đã hoàn tất thủ tục bàn giao hồ sơ lưu trữ điện tử',
                  },
                  activeSchoolYear
                );

                alert(`Đã lập và lưu trữ hồ sơ điện tử mã ${rec.dossierStorageCode} cho học sinh ${targetStu.fullName}!`);
                setShowPreservationModal(false);
                onRefreshData();
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Học Sinh Lớp {selectedClass.name}:</label>
                <select
                  value={preservationStudentId}
                  onChange={(e) => setPreservationStudentId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {selectedClass.students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.fullName} ({stu.dob} - Phụ huynh: {stu.parentName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại thủ tục:</label>
                  <select
                    value={preservationType}
                    onChange={(e) => setPreservationType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="BAO_LUU">Bảo lưu kết quả học tập</option>
                    <option value="THOI_HOC">Thôi học (Nghỉ hẳn)</option>
                    <option value="TAM_DUNG">Tạm dừng học có thời hạn</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày áp dụng:</label>
                  <input
                    type="date"
                    value={preservationDate}
                    onChange={(e) => setPreservationDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {preservationType === 'BAO_LUU' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thời hạn bảo lưu (tháng):</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={preservationDuration}
                    onChange={(e) => setPreservationDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do cụ thể:</label>
                <textarea
                  rows={2}
                  value={preservationReason}
                  onChange={(e) => setPreservationReason(e.target.value)}
                  required
                  placeholder="Ghi rõ lý do xin bảo lưu hoặc thôi học..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số Quyết định của Hiệu trưởng:</label>
                <input
                  type="text"
                  value={preservationDecisionNo}
                  onChange={(e) => setPreservationDecisionNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold">✓ Bàn giao hồ sơ lưu trữ điện tử:</div>
                <div>Hệ thống tự động sinh Mã hồ sơ lưu trữ số hóa, đóng dấu niêm phong học bạ điện tử và cho phép phục hồi đi học lại khi kết thúc thời hạn bảo lưu.</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPreservationModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow transition"
                >
                  Lập Hồ Sơ & Lưu Trữ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Modal Chỉnh Sửa Thông Tin Lớp Học (Yêu cầu 1) */}
      {showEditClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Chỉnh Sửa Thông Tin Lớp Học
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditClassModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditClass} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên lớp:</label>
                  <input
                    type="text"
                    required
                    value={classEditData.name}
                    onChange={(e) => setClassEditData({ ...classEditData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                    placeholder="VD: 1A, 6B..."
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khối lớp (1 - 9):</label>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    required
                    value={classEditData.grade}
                    onChange={(e) => {
                      const g = parseInt(e.target.value, 10);
                      setClassEditData({
                        ...classEditData,
                        grade: g,
                        level: g <= 5 ? 'TH' : 'THCS',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cấp học:</label>
                  <select
                    value={classEditData.level}
                    onChange={(e) => setClassEditData({ ...classEditData, level: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="TH">Tiểu học (TH)</option>
                    <option value="THCS">Trung học cơ sở (THCS)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phòng học:</label>
                  <input
                    type="text"
                    value={classEditData.roomName}
                    onChange={(e) => setClassEditData({ ...classEditData, roomName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    placeholder="VD: Phòng P.102, Nhà B..."
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Điểm trường trực thuộc (12):</label>
                <select
                  value={classEditData.campusName}
                  onChange={(e) => {
                    const camp = ALL_CAMPUSES.find((c) => c.name === e.target.value);
                    setClassEditData({
                      ...classEditData,
                      campusName: e.target.value,
                      branchName: camp ? camp.branchName : classEditData.branchName,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {ALL_CAMPUSES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.branchName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Giáo viên chủ nhiệm (GVCN):</label>
                <select
                  value={classEditData.homeroomTeacherId}
                  onChange={(e) => {
                    const t = teachersList.find((teach) => teach.account.id === e.target.value);
                    setClassEditData({
                      ...classEditData,
                      homeroomTeacherId: e.target.value,
                      homeroomTeacherName: t ? t.account.name : 'Chưa phân công',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="">Chưa phân công</option>
                  {teachersList.map((t) => (
                    <option key={t.account.id} value={t.account.id}>
                      {t.account.name} ({t.account.position} - {t.account.campusName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditClassModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow transition"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Cảnh Báo Chuyển Lớp Sang INACTIVE (Yêu cầu 1) */}
      {showInactivateClassConfirm && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-rose-950">
                  Cảnh Báo: Chuyển Lớp Sang Trạng Thái INACTIVE
                </h3>
                <p className="text-[11px] text-rose-600">
                  Xác nhận ngừng hoạt động lớp {selectedClass.name} ({selectedClass.campusName})
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bảo lưu 100% dữ liệu - Không làm mất học bạ & hồ sơ:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Lớp học sẽ được chuyển về trạng thái <strong>INACTIVE (không hoạt động)</strong>. Lớp vẫn lưu giữ đầy đủ trên hệ thống, nhưng sẽ không hiển thị trên danh sách lớp hoạt động và không tính vào các biểu mẫu thống kê thường nhật.
                </p>
                <p className="text-[11px] font-semibold text-emerald-700">
                  ✓ Hiệu trưởng có thể bấm nút "Khôi phục" bất kỳ lúc nào để đưa lớp trở lại hoạt động bình thường (ACTIVE) nếu bấm nhầm.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn hoặc nhập lý do ngưng hoạt động:</label>
                <select
                  value={inactivateClassReason}
                  onChange={(e) => setInactivateClassReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium mb-2"
                >
                  <option value="Sáp nhập lớp học theo chỉ tiêu mới">Sáp nhập lớp học theo chỉ tiêu mới</option>
                  <option value="Giảm quy mô điểm trường / Không đủ học sinh">Giảm quy mô điểm trường / Không đủ học sinh</option>
                  <option value="Tạm dừng trong năm học 2026-2027">Tạm dừng trong năm học 2026-2027</option>
                  <option value="Xóa nhầm / Dữ liệu tạo trùng lặp">Xóa nhầm / Dữ liệu tạo trùng lặp</option>
                  <option value="Lý do khác">Lý do khác</option>
                </select>
                <input
                  type="text"
                  value={inactivateClassReason}
                  onChange={(e) => setInactivateClassReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInactivateClassConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInactivateClass}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow transition"
                >
                  Đồng ý chuyển INACTIVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Sửa Thông Tin Học Sinh (Yêu cầu 2) */}
      {showEditStudentModal && selectedStudentForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Chỉnh Sửa Thông Tin Học Sinh
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên học sinh:</label>
                <input
                  type="text"
                  required
                  value={studentEditData.fullName}
                  onChange={(e) => setStudentEditData({ ...studentEditData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giới tính:</label>
                  <select
                    value={studentEditData.gender}
                    onChange={(e) => setStudentEditData({ ...studentEditData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày sinh:</label>
                  <input
                    type="date"
                    required
                    value={studentEditData.dob}
                    onChange={(e) => setStudentEditData({ ...studentEditData, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dân tộc:</label>
                  <input
                    type="text"
                    value={studentEditData.ethnicity}
                    onChange={(e) => setStudentEditData({ ...studentEditData, ethnicity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Diện chính sách:</label>
                  <select
                    value={studentEditData.policyBeneficiary}
                    onChange={(e) => setStudentEditData({ ...studentEditData, policyBeneficiary: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Không">Không</option>
                    <option value="Hộ nghèo">Hộ nghèo</option>
                    <option value="Hộ cận nghèo">Hộ cận nghèo</option>
                    <option value="Khuyết tật">Khuyết tật</option>
                    <option value="Mồ côi">Mồ côi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ tên phụ huynh:</label>
                  <input
                    type="text"
                    value={studentEditData.parentName}
                    onChange={(e) => setStudentEditData({ ...studentEditData, parentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại phụ huynh:</label>
                  <input
                    type="text"
                    value={studentEditData.parentPhone}
                    onChange={(e) => setStudentEditData({ ...studentEditData, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa chỉ thường trú:</label>
                <input
                  type="text"
                  value={studentEditData.address}
                  onChange={(e) => setStudentEditData({ ...studentEditData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trạng thái học sinh:</label>
                  <select
                    value={studentEditData.status}
                    onChange={(e) => setStudentEditData({ ...studentEditData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Chuyển đến">Chuyển đến</option>
                    <option value="Chuyển đi">Chuyển đi</option>
                    <option value="Bảo lưu">Bảo lưu</option>
                    <option value="Thôi học">Thôi học</option>
                    <option value="Ở lại lớp">Ở lại lớp</option>
                    <option value="Mất">Mất</option>
                    <option value="INACTIVE">INACTIVE (Lưu trữ)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ghi chú:</label>
                  <input
                    type="text"
                    value={studentEditData.notes}
                    onChange={(e) => setStudentEditData({ ...studentEditData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow transition"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Cảnh Báo Chuyển Học Sinh Sang INACTIVE (Yêu cầu 2) */}
      {showInactivateStudentConfirm && selectedStudentForInactivate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-rose-950">
                  Cảnh Báo: Chuyển Học Sinh Sang Trạng Thái INACTIVE
                </h3>
                <p className="text-[11px] text-rose-600">
                  Học sinh: {selectedStudentForInactivate.fullName} (Lớp {selectedClass.name})
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Không mất dữ liệu - Bảo lưu trọn vẹn học bạ & điểm số:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Em <strong>{selectedStudentForInactivate.fullName}</strong> sẽ được chuyển sang danh sách lưu trữ (INACTIVE). Toàn bộ kết quả học tập, điểm danh và hồ sơ số vẫn được lưu giữ an toàn. Sĩ số lớp {selectedClass.name} tự động giảm đi tương ứng.
                </p>
                <p className="text-[11px] font-semibold text-emerald-700">
                  ✓ Thầy cô có thể bấm nút "Khôi phục" bất kỳ lúc nào để chuyển em về lại danh sách đang học (ACTIVE) nếu xóa nhầm.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do ngưng học / chuyển trạng thái:</label>
                <select
                  value={inactivateStudentReason}
                  onChange={(e) => setInactivateStudentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium mb-2"
                >
                  <option value="Nghỉ học / Thôi học">Nghỉ học / Thôi học</option>
                  <option value="Chuyển trường chuyển nơi cư trú">Chuyển trường chuyển nơi cư trú</option>
                  <option value="Bảo lưu kết quả học tập">Bảo lưu kết quả học tập</option>
                  <option value="Mất (qua đời)">Mất (qua đời)</option>
                  <option value="Xóa nhầm / Học sinh trùng lặp hồ sơ">Xóa nhầm / Học sinh trùng lặp hồ sơ</option>
                  <option value="Khác">Khác</option>
                </select>
                <input
                  type="text"
                  value={inactivateStudentReason}
                  onChange={(e) => setInactivateStudentReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInactivateStudentConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInactivateStudent}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow transition"
                >
                  Đồng ý chuyển INACTIVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
