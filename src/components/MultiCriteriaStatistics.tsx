import React, { useState, useMemo } from 'react';
import {
  UserAccount,
  SchoolClass,
  Student,
} from '../types/school';
import { storageService } from '../services/storageService';
import {
  Search,
  Filter,
  Download,
  Printer,
  Users,
  GraduationCap,
  Building,
  Calendar,
  Layers,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  BadgePercent,
  MapPin,
  HeartHandshake,
  HeartPulse,
  UserCheck,
  Briefcase,
  Cake,
  BookOpen,
  Award,
  X,
  Copy,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface MultiCriteriaStatisticsProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  classes: SchoolClass[];
  allStaff: { account: UserAccount; sheetDataAZ: Record<string, string | number | boolean> }[];
  onSelectTab?: (tab: string) => void;
}

export const MultiCriteriaStatistics: React.FC<MultiCriteriaStatisticsProps> = ({
  currentUser,
  activeSchoolYear,
  classes,
  allStaff,
  onSelectTab,
}) => {
  // Tabs: Thống kê Học Sinh vs Thống kê Cán bộ - GV - Nhân viên
  type StatMode = 'STUDENTS' | 'STAFF';
  const [activeMode, setActiveMode] = useState<StatMode>('STUDENTS');

  // Modal in báo cáo chuẩn văn bản
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // ==========================================
  // BỘ LỌC ĐA TIÊU CHÍ CHO HỌC SINH (10 TIÊU CHÍ)
  // ==========================================
  // Tiêu chí 1: Giới tính
  const [studentGenderFilter, setStudentGenderFilter] = useState<'ALL' | 'Nam' | 'Nữ'>('ALL');
  // Tiêu chí 2: Phân hiệu
  const [studentBranchFilter, setStudentBranchFilter] = useState<string>('ALL');
  // Tiêu chí 3: Điểm trường
  const [studentCampusFilter, setStudentCampusFilter] = useState<string>('ALL');
  // Tiêu chí 4: Dân tộc (DTTS / Kinh)
  const [studentEthnicityFilter, setStudentEthnicityFilter] = useState<string>('ALL'); // Tất cả | DTTS | KINH
  // Tiêu chí 5: Diện chính sách & Hoàn cảnh
  const [studentPolicyFilter, setStudentPolicyFilter] = useState<string>('ALL'); // Tất cả | KHUYET_TAT | HO_NGHEO | HO_CAN_NGHEO | MO_COI | CO_CHINH_SACH | KHONG
  // Tiêu chí 6: Cấp học
  const [studentLevelFilter, setStudentLevelFilter] = useState<'ALL' | 'TH' | 'THCS'>('ALL');
  // Tiêu chí 7: Khối lớp (1 - 9)
  const [studentGradeFilter, setStudentGradeFilter] = useState<'ALL' | number>('ALL');
  // Tiêu chí 8: Lớp học cụ thể
  const [studentClassIdFilter, setStudentClassIdFilter] = useState<string>('ALL');
  // Tiêu chí 9: Năm sinh học sinh
  const [studentBirthYearCompare, setStudentBirthYearCompare] = useState<'ALL' | 'EQUAL' | 'GREATER_THAN' | 'LESS_THAN'>('ALL');
  const [studentBirthYearVal, setStudentBirthYearVal] = useState<number>(2015);
  // Tiêu chí 10: Trạng thái học sinh
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('Đang học'); // Đang học | ALL | Chuyển đến | Chuyển đi | Bảo lưu
  // Tìm kiếm từ khóa tự do
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  // ==========================================
  // BỘ LỌC ĐA TIÊU CHÍ CHO CÁN BỘ - GIÁO VIÊN - NHÂN VIÊN (10 TIÊU CHÍ)
  // ==========================================
  // Tiêu chí 1: Giới tính
  const [staffGenderFilter, setStaffGenderFilter] = useState<'ALL' | 'Nam' | 'Nữ'>('ALL');
  // Tiêu chí 2: Phân hiệu
  const [staffBranchFilter, setStaffBranchFilter] = useState<string>('ALL');
  // Tiêu chí 3: Cấp giảng dạy / Bộ phận
  const [staffLevelFilter, setStaffLevelFilter] = useState<'ALL' | 'TH' | 'THCS' | 'LIEN_CAP' | 'VAN_PHONG' | 'BAO_VE'>('ALL');
  // Tiêu chí 4: Môn học chuyên môn
  const [staffSubjectFilter, setStaffSubjectFilter] = useState<string>('ALL');
  // Tiêu chí 5: Năm sinh (VD: > 1982 theo yêu cầu)
  const [staffBirthYearCompare, setStaffBirthYearCompare] = useState<'ALL' | 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL'>('ALL');
  const [staffBirthYearVal, setStaffBirthYearVal] = useState<number>(1982);
  // Tiêu chí 6: Điểm trường công tác
  const [staffCampusFilter, setStaffCampusFilter] = useState<string>('ALL');
  // Tiêu chí 7: Vai trò / Trách nhiệm công việc
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('ALL'); // Tất cả | BGH | GVCN | GV_BO_MON | TO_TRUONG | NV | BV
  // Tiêu chí 8: Đảng viên Đảng CSVN
  const [staffPartyMemberFilter, setStaffPartyMemberFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  // Tiêu chí 9: Thâm niên công tác
  const [staffSeniorityCompare, setStaffSeniorityCompare] = useState<'ALL' | 'GREATER_EQUAL_15' | 'GREATER_EQUAL_10' | 'LESS_THAN_10'>('ALL');
  // Tiêu chí 10: Trình độ đào tạo
  const [staffDegreeFilter, setStaffDegreeFilter] = useState<string>('ALL'); // Tất cả | THAC_SI | DAI_HOC | CAO_DANG | KHAC
  // Tìm kiếm từ khóa tự do
  const [staffSearchTerm, setStaffSearchTerm] = useState<string>('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Danh sách các điểm trường & phân hiệu duy nhất từ classes
  const uniqueCampuses = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.campusName) set.add(c.campusName);
    });
    return Array.from(set).sort();
  }, [classes]);

  const uniqueBranches = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.branchName) set.add(c.branchName);
    });
    return Array.from(set).sort();
  }, [classes]);

  // Điểm trường theo phân hiệu đã chọn (học sinh)
  const campusesForSelectedStudentBranch = useMemo(() => {
    if (studentBranchFilter === 'ALL') return uniqueCampuses;
    const set = new Set<string>();
    classes
      .filter((c) => c.branchName === studentBranchFilter)
      .forEach((c) => {
        if (c.campusName) set.add(c.campusName);
      });
    return Array.from(set).sort();
  }, [classes, studentBranchFilter, uniqueCampuses]);

  // Điểm trường theo phân hiệu đã chọn (cán bộ)
  const campusesForSelectedStaffBranch = useMemo(() => {
    if (staffBranchFilter === 'ALL') return uniqueCampuses;
    const set = new Set<string>();
    allStaff
      .filter((s) => s.account.branchName === staffBranchFilter)
      .forEach((s) => {
        if (s.account.campusName) set.add(s.account.campusName);
      });
    return Array.from(set).sort();
  }, [allStaff, staffBranchFilter, uniqueCampuses]);

  // Danh sách các môn học / chuyên môn chuẩn hóa từ allStaff
  const availableSubjects = useMemo(() => [
    { id: 'ALL', label: '-- Tất cả bộ môn / chuyên môn --' },
    { id: 'TOAN', label: 'Môn Toán' },
    { id: 'VAN', label: 'Môn Ngữ văn' },
    { id: 'TIENG_ANH', label: 'Môn Tiếng Anh' },
    { id: 'TIN_HOC', label: 'Môn Tin học' },
    { id: 'KHTN', label: 'Môn Khoa học Tự nhiên (KHTN: Lý - Hóa - Sinh)' },
    { id: 'LS_DL', label: 'Môn Lịch sử & Địa lý (LS & ĐL)' },
    { id: 'GDCD', label: 'Môn Giáo dục Công dân (GDCD)' },
    { id: 'NGHE_THUAT', label: 'Môn Nghệ thuật (Âm nhạc, Mỹ thuật)' },
    { id: 'THE_DUC', label: 'Môn Giáo dục Thể chất (Thể dục)' },
    { id: 'GV_TIEU_HOC', label: 'Giáo viên Văn hóa Tiểu học (Toán, Tiếng Việt, TNXH)' },
    { id: 'HANH_CHINH_KE_TOAN', label: 'Hành chính - Kế toán - Thủ quỹ' },
    { id: 'Y_TE', label: 'Y tế học đường' },
    { id: 'THU_VIEN_THIET_BI', label: 'Thư viện & Thiết bị dạy học' },
    { id: 'VAN_THU', label: 'Văn thư - Quản trị công sở' },
    { id: 'BAO_VE', label: 'Bảo vệ - CSVC' },
  ], []);

  // Flatten toàn bộ học sinh cùng metadata lớp học
  const allFlattenedStudents = useMemo(() => {
    const list: Array<{
      student: Student;
      classId: string;
      className: string;
      grade: number;
      level: 'TH' | 'THCS';
      campusName: string;
      branchName: string;
      homeroomTeacherName: string;
      homeroomTeacherId: string;
      birthYear: number | null;
    }> = [];

    classes.forEach((cls) => {
      if (cls.students && Array.isArray(cls.students)) {
        cls.students.forEach((stu) => {
          let by: number | null = null;
          if (stu.dob) {
            const match = stu.dob.match(/\d{4}/);
            if (match) by = parseInt(match[0], 10);
          }
          list.push({
            student: stu,
            classId: cls.id,
            className: cls.name,
            grade: cls.grade,
            level: cls.level,
            campusName: cls.campusName,
            branchName: cls.branchName,
            homeroomTeacherName: cls.homeroomTeacherName,
            homeroomTeacherId: cls.homeroomTeacherId,
            birthYear: by,
          });
        });
      }
    });

    return list;
  }, [classes]);

  // ==========================================
  // XỬ LÝ LỌC HỌC SINH ĐA TIÊU CHÍ (KẾT HỢP GIAO NHAU)
  // ==========================================
  const filteredStudents = useMemo(() => {
    return allFlattenedStudents.filter((item) => {
      const s = item.student;

      // Tiêu chí 1: Giới tính
      if (studentGenderFilter !== 'ALL' && s.gender !== studentGenderFilter) {
        return false;
      }

      // Tiêu chí 2: Phân hiệu
      if (studentBranchFilter !== 'ALL' && item.branchName !== studentBranchFilter) {
        return false;
      }

      // Tiêu chí 3: Điểm trường
      if (studentCampusFilter !== 'ALL' && item.campusName !== studentCampusFilter) {
        return false;
      }

      // Tiêu chí 4: Dân tộc (DTTS / Kinh)
      if (studentEthnicityFilter !== 'ALL') {
        const eth = (s.ethnicity || 'Kinh').toLowerCase();
        if (studentEthnicityFilter === 'KINH' && eth !== 'kinh') return false;
        if (studentEthnicityFilter === 'THIEU_SO' && eth === 'kinh') return false;
      }

      // Tiêu chí 5: Diện chính sách & Hoàn cảnh
      if (studentPolicyFilter !== 'ALL') {
        if (studentPolicyFilter === 'KHUYET_TAT' && s.policyBeneficiary !== 'Khuyết tật') {
          return false;
        }
        if (studentPolicyFilter === 'HO_NGHEO' && s.policyBeneficiary !== 'Hộ nghèo') {
          return false;
        }
        if (studentPolicyFilter === 'HO_CAN_NGHEO' && s.policyBeneficiary !== 'Hộ cận nghèo') {
          return false;
        }
        if (studentPolicyFilter === 'MO_COI' && s.policyBeneficiary !== 'Mồ côi') {
          return false;
        }
        if (studentPolicyFilter === 'CO_CHINH_SACH' && (s.policyBeneficiary === 'Không' || !s.policyBeneficiary)) {
          return false;
        }
        if (studentPolicyFilter === 'KHONG' && s.policyBeneficiary && s.policyBeneficiary !== 'Không') {
          return false;
        }
      }

      // Tiêu chí 6: Cấp học (TH / THCS)
      if (studentLevelFilter !== 'ALL' && item.level !== studentLevelFilter) {
        return false;
      }

      // Tiêu chí 7: Khối lớp (1 - 9)
      if (studentGradeFilter !== 'ALL' && item.grade !== studentGradeFilter) {
        return false;
      }

      // Tiêu chí 8: Lớp học cụ thể
      if (studentClassIdFilter !== 'ALL' && item.classId !== studentClassIdFilter) {
        return false;
      }

      // Tiêu chí 9: Năm sinh
      if (studentBirthYearCompare !== 'ALL' && item.birthYear) {
        if (studentBirthYearCompare === 'EQUAL' && item.birthYear !== studentBirthYearVal) return false;
        if (studentBirthYearCompare === 'GREATER_THAN' && item.birthYear <= studentBirthYearVal) return false;
        if (studentBirthYearCompare === 'LESS_THAN' && item.birthYear >= studentBirthYearVal) return false;
      }

      // Tiêu chí 10: Trạng thái học sinh
      if (studentStatusFilter !== 'ALL') {
        if (s.status !== studentStatusFilter) return false;
      }

      // Tìm kiếm tự do
      if (studentSearchTerm.trim()) {
        const term = studentSearchTerm.toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(term);
        const matchClass = item.className.toLowerCase().includes(term);
        const matchParent = (s.parentName || '').toLowerCase().includes(term);
        const matchAddress = (s.address || '').toLowerCase().includes(term);
        const matchGvcn = item.homeroomTeacherName.toLowerCase().includes(term);
        if (!matchName && !matchClass && !matchParent && !matchAddress && !matchGvcn) {
          return false;
        }
      }

      return true;
    });
  }, [
    allFlattenedStudents,
    studentGenderFilter,
    studentBranchFilter,
    studentCampusFilter,
    studentEthnicityFilter,
    studentPolicyFilter,
    studentLevelFilter,
    studentGradeFilter,
    studentClassIdFilter,
    studentBirthYearCompare,
    studentBirthYearVal,
    studentStatusFilter,
    studentSearchTerm,
  ]);

  // ==========================================
  // XỬ LÝ LỌC CÁN BỘ - GIÁO VIÊN - NHÂN VIÊN ĐA TIÊU CHÍ (KẾT HỢP GIAO NHAU)
  // ==========================================
  const filteredStaff = useMemo(() => {
    // Tập hợp ID các GVCN hiện tại của 57 lớp
    const currentGvcnIds = new Set<string>();
    classes.forEach((c) => {
      if (c.homeroomTeacherId) currentGvcnIds.add(c.homeroomTeacherId);
    });

    return allStaff.filter((item) => {
      const acc = item.account;
      const az = item.sheetDataAZ || {};

      // Tiêu chí 1: Giới tính cán bộ (từ cột C)
      const gender = (az['C'] ? String(az['C']).trim() : 'Nam');
      if (staffGenderFilter !== 'ALL' && gender !== staffGenderFilter) {
        return false;
      }

      // Tiêu chí 2: Phân hiệu công tác
      if (staffBranchFilter !== 'ALL') {
        const branch = acc.branchName || String(az['W'] || '');
        if (!branch.includes(staffBranchFilter)) return false;
      }

      // Tiêu chí 3: Cấp giảng dạy / Bộ phận
      const levelColT = String(az['T'] || '');
      const position = acc.position || '';
      const isTH = levelColT.includes('Tiểu học') || position.includes('Tiểu học') || levelColT.includes('TH');
      const isTHCS = levelColT.includes('THCS') || position.includes('THCS');
      const isVP =
        acc.role === 'NV' ||
        position.includes('Kế toán') ||
        position.includes('Thủ quỹ') ||
        position.includes('Văn thư') ||
        position.includes('Y tế') ||
        position.includes('Thư viện') ||
        position.includes('thiết bị');
      const isBV = acc.role === 'NV_HD_BV' || position.includes('Bảo vệ');

      if (staffLevelFilter !== 'ALL') {
        if (staffLevelFilter === 'TH' && !isTH) return false;
        if (staffLevelFilter === 'THCS' && !isTHCS) return false;
        if (staffLevelFilter === 'LIEN_CAP' && !(isTH && isTHCS)) return false;
        if (staffLevelFilter === 'VAN_PHONG' && !isVP) return false;
        if (staffLevelFilter === 'BAO_VE' && !isBV) return false;
      }

      // Tiêu chí 4: Môn học chuyên môn
      if (staffSubjectFilter !== 'ALL') {
        const posLower = position.toLowerCase();
        const colRLower = String(az['R'] || '').toLowerCase();
        const colULower = String(az['U'] || '').toLowerCase();
        const colNLower = String(az['N'] || '').toLowerCase();
        const combinedSubjectStr = `${posLower} ${colRLower} ${colULower} ${colNLower}`;

        if (staffSubjectFilter === 'TOAN' && !combinedSubjectStr.includes('toán')) return false;
        if (staffSubjectFilter === 'VAN' && !(combinedSubjectStr.includes('văn') || combinedSubjectStr.includes('ngữ văn'))) return false;
        if (staffSubjectFilter === 'TIENG_ANH' && !(combinedSubjectStr.includes('tiếng anh') || combinedSubjectStr.includes('tieng anh'))) return false;
        if (staffSubjectFilter === 'TIN_HOC' && !(combinedSubjectStr.includes('tin học') || combinedSubjectStr.includes('tin') || acc.role === 'GV_TIN_HOC')) return false;
        if (staffSubjectFilter === 'KHTN' && !(combinedSubjectStr.includes('khtn') || combinedSubjectStr.includes('khoa học tự nhiên') || combinedSubjectStr.includes('lý') || combinedSubjectStr.includes('hóa') || combinedSubjectStr.includes('sinh'))) return false;
        if (staffSubjectFilter === 'LS_DL' && !(combinedSubjectStr.includes('ls & đl') || combinedSubjectStr.includes('lịch sử') || combinedSubjectStr.includes('địa lý') || combinedSubjectStr.includes('sử'))) return false;
        if (staffSubjectFilter === 'GDCD' && !(combinedSubjectStr.includes('gdcd') || combinedSubjectStr.includes('công dân'))) return false;
        if (staffSubjectFilter === 'NGHE_THUAT' && !(combinedSubjectStr.includes('nghệ thuật') || combinedSubjectStr.includes('âm nhạc') || combinedSubjectStr.includes('mỹ thuật') || combinedSubjectStr.includes('nhạc') || combinedSubjectStr.includes('họa'))) return false;
        if (staffSubjectFilter === 'THE_DUC' && !(combinedSubjectStr.includes('thể dục') || combinedSubjectStr.includes('thể chất') || combinedSubjectStr.includes('gdtc'))) return false;
        if (staffSubjectFilter === 'GV_TIEU_HOC' && !(combinedSubjectStr.includes('tiểu học') || combinedSubjectStr.includes('gv th') || combinedSubjectStr.includes('tổ 1') || combinedSubjectStr.includes('tổ 2') || combinedSubjectStr.includes('tổ 3') || combinedSubjectStr.includes('tổ 4') || combinedSubjectStr.includes('tổ 5'))) return false;
        if (staffSubjectFilter === 'HANH_CHINH_KE_TOAN' && !(combinedSubjectStr.includes('kế toán') || combinedSubjectStr.includes('thủ quỹ'))) return false;
        if (staffSubjectFilter === 'Y_TE' && !(combinedSubjectStr.includes('y tế'))) return false;
        if (staffSubjectFilter === 'THU_VIEN_THIET_BI' && !(combinedSubjectStr.includes('thư viện') || combinedSubjectStr.includes('thiết bị'))) return false;
        if (staffSubjectFilter === 'VAN_THU' && !(combinedSubjectStr.includes('văn thư') || combinedSubjectStr.includes('công sở'))) return false;
        if (staffSubjectFilter === 'BAO_VE' && !(combinedSubjectStr.includes('bảo vệ'))) return false;
      }

      // Tiêu chí 5: Năm sinh từ Cột D (Định dạng DD/MM/YYYY)
      const dobStr = String(az['D'] || '');
      let birthYear: number | null = null;
      if (dobStr) {
        const parts = dobStr.split('/');
        if (parts.length === 3) {
          birthYear = parseInt(parts[2], 10);
        } else {
          const match = dobStr.match(/\d{4}/);
          if (match) birthYear = parseInt(match[0], 10);
        }
      }

      if (staffBirthYearCompare !== 'ALL' && birthYear) {
        if (staffBirthYearCompare === 'GREATER_THAN' && !(birthYear > staffBirthYearVal)) return false;
        if (staffBirthYearCompare === 'LESS_THAN' && !(birthYear < staffBirthYearVal)) return false;
        if (staffBirthYearCompare === 'EQUAL' && !(birthYear === staffBirthYearVal)) return false;
      }

      // Tiêu chí 6: Điểm trường công tác
      if (staffCampusFilter !== 'ALL') {
        const campus = acc.campusName || String(az['X'] || '');
        if (!campus.includes(staffCampusFilter)) return false;
      }

      // Tiêu chí 7: Vai trò / Trách nhiệm công việc
      if (staffRoleFilter !== 'ALL') {
        if (staffRoleFilter === 'BGH' && acc.role !== 'HT' && acc.role !== 'PHT') return false;
        if (staffRoleFilter === 'GVCN' && !currentGvcnIds.has(acc.id)) return false;
        if (staffRoleFilter === 'GV_BO_MON' && (currentGvcnIds.has(acc.id) || (acc.role !== 'GV' && acc.role !== 'GV_TIN_HOC'))) return false;
        if (staffRoleFilter === 'TO_TRUONG' && !position.toLowerCase().includes('tổ trưởng') && !String(az['S'] || '').toLowerCase().includes('trưởng')) return false;
        if (staffRoleFilter === 'NV' && acc.role !== 'NV') return false;
        if (staffRoleFilter === 'BV' && acc.role !== 'NV_HD_BV') return false;
      }

      // Tiêu chí 8: Đảng viên (Cột Y)
      const isParty = String(az['Y'] || '').toLowerCase().includes('có');
      if (staffPartyMemberFilter !== 'ALL') {
        if (staffPartyMemberFilter === 'YES' && !isParty) return false;
        if (staffPartyMemberFilter === 'NO' && isParty) return false;
      }

      // Tiêu chí 9: Thâm niên công tác (Cột F: Ngày tuyển dụng)
      const recruitDate = String(az['F'] || '');
      if (staffSeniorityCompare !== 'ALL' && recruitDate) {
        const recruitYear = parseInt(recruitDate.split('-')[0], 10) || 2020;
        const currentYear = 2026;
        const yearsOfWork = currentYear - recruitYear;
        if (staffSeniorityCompare === 'GREATER_EQUAL_15' && !(yearsOfWork >= 15)) return false;
        if (staffSeniorityCompare === 'GREATER_EQUAL_10' && !(yearsOfWork >= 10)) return false;
        if (staffSeniorityCompare === 'LESS_THAN_10' && !(yearsOfWork < 10)) return false;
      }

      // Tiêu chí 10: Trình độ đào tạo (Cột N)
      if (staffDegreeFilter !== 'ALL') {
        const degreeStr = String(az['N'] || '').toLowerCase();
        if (staffDegreeFilter === 'THAC_SI' && !degreeStr.includes('thạc sĩ')) return false;
        if (staffDegreeFilter === 'DAI_HOC' && !(degreeStr.includes('đại học') || degreeStr.includes('đh'))) return false;
        if (staffDegreeFilter === 'CAO_DANG' && !(degreeStr.includes('cao đẳng') || degreeStr.includes('cđ'))) return false;
        if (staffDegreeFilter === 'KHAC' && (degreeStr.includes('đại học') || degreeStr.includes('thạc sĩ') || degreeStr.includes('cao đẳng'))) return false;
      }

      // Tìm kiếm tự do
      if (staffSearchTerm.trim()) {
        const term = staffSearchTerm.toLowerCase();
        const matchName = acc.name.toLowerCase().includes(term);
        const matchId = acc.id.toLowerCase().includes(term);
        const matchPos = (acc.position || '').toLowerCase().includes(term);
        const matchPhone = (acc.phone || '').includes(term);
        const matchSubject = String(az['R'] || '').toLowerCase().includes(term);
        if (!matchName && !matchId && !matchPos && !matchPhone && !matchSubject) return false;
      }

      return true;
    });
  }, [
    allStaff,
    classes,
    staffGenderFilter,
    staffBranchFilter,
    staffLevelFilter,
    staffSubjectFilter,
    staffBirthYearCompare,
    staffBirthYearVal,
    staffCampusFilter,
    staffRoleFilter,
    staffPartyMemberFilter,
    staffSeniorityCompare,
    staffDegreeFilter,
    staffSearchTerm,
  ]);

  // ==========================================
  // XÂY DỰNG DANH SÁCH TIÊU CHÍ ĐANG KÍCH HOẠT (ACTIVE PILLS)
  // ==========================================
  const activeStudentFilterPills = useMemo(() => {
    const pills: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (studentGenderFilter !== 'ALL') {
      pills.push({
        key: 'gender',
        label: `Tiêu chí 1 (Giới tính): ${studentGenderFilter}`,
        onClear: () => setStudentGenderFilter('ALL'),
      });
    }
    if (studentBranchFilter !== 'ALL') {
      pills.push({
        key: 'branch',
        label: `Tiêu chí 2 (Phân hiệu): ${studentBranchFilter}`,
        onClear: () => setStudentBranchFilter('ALL'),
      });
    }
    if (studentCampusFilter !== 'ALL') {
      pills.push({
        key: 'campus',
        label: `Tiêu chí 3 (Điểm trường): ${studentCampusFilter}`,
        onClear: () => setStudentCampusFilter('ALL'),
      });
    }
    if (studentEthnicityFilter !== 'ALL') {
      pills.push({
        key: 'ethnicity',
        label: `Tiêu chí 4 (Dân tộc): ${studentEthnicityFilter === 'THIEU_SO' ? 'DTTS' : 'Kinh'}`,
        onClear: () => setStudentEthnicityFilter('ALL'),
      });
    }
    if (studentPolicyFilter !== 'ALL') {
      const map: Record<string, string> = {
        KHUYET_TAT: 'Khuyết tật',
        HO_NGHEO: 'Hộ nghèo',
        HO_CAN_NGHEO: 'Hộ cận nghèo',
        MO_COI: 'Mồ côi',
        CO_CHINH_SACH: 'Có diện chính sách',
        KHONG: 'Không chính sách',
      };
      pills.push({
        key: 'policy',
        label: `Tiêu chí 5 (Diện chính sách): ${map[studentPolicyFilter] || studentPolicyFilter}`,
        onClear: () => setStudentPolicyFilter('ALL'),
      });
    }
    if (studentLevelFilter !== 'ALL') {
      pills.push({
        key: 'level',
        label: `Tiêu chí 6 (Cấp học): ${studentLevelFilter === 'TH' ? 'Tiểu học (TH)' : 'THCS'}`,
        onClear: () => setStudentLevelFilter('ALL'),
      });
    }
    if (studentGradeFilter !== 'ALL') {
      pills.push({
        key: 'grade',
        label: `Tiêu chí 7 (Khối lớp): Khối ${studentGradeFilter}`,
        onClear: () => setStudentGradeFilter('ALL'),
      });
    }
    if (studentClassIdFilter !== 'ALL') {
      const cls = classes.find((c) => c.id === studentClassIdFilter);
      pills.push({
        key: 'class',
        label: `Tiêu chí 8 (Lớp): ${cls ? cls.name : studentClassIdFilter}`,
        onClear: () => setStudentClassIdFilter('ALL'),
      });
    }
    if (studentBirthYearCompare !== 'ALL') {
      const sym = studentBirthYearCompare === 'GREATER_THAN' ? '>' : studentBirthYearCompare === 'LESS_THAN' ? '<' : '=';
      pills.push({
        key: 'dob',
        label: `Tiêu chí 9 (Năm sinh): ${sym} ${studentBirthYearVal}`,
        onClear: () => setStudentBirthYearCompare('ALL'),
      });
    }
    if (studentStatusFilter !== 'ALL') {
      pills.push({
        key: 'status',
        label: `Tiêu chí 10 (Trạng thái): ${studentStatusFilter}`,
        onClear: () => setStudentStatusFilter('ALL'),
      });
    }
    if (studentSearchTerm.trim()) {
      pills.push({
        key: 'search',
        label: `Tìm kiếm: "${studentSearchTerm}"`,
        onClear: () => setStudentSearchTerm(''),
      });
    }
    return pills;
  }, [
    studentGenderFilter,
    studentBranchFilter,
    studentCampusFilter,
    studentEthnicityFilter,
    studentPolicyFilter,
    studentLevelFilter,
    studentGradeFilter,
    studentClassIdFilter,
    classes,
    studentBirthYearCompare,
    studentBirthYearVal,
    studentStatusFilter,
    studentSearchTerm,
  ]);

  const activeStaffFilterPills = useMemo(() => {
    const pills: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (staffGenderFilter !== 'ALL') {
      pills.push({
        key: 'gender',
        label: `Tiêu chí 1 (Giới tính): ${staffGenderFilter}`,
        onClear: () => setStaffGenderFilter('ALL'),
      });
    }
    if (staffBranchFilter !== 'ALL') {
      pills.push({
        key: 'branch',
        label: `Tiêu chí 2 (Phân hiệu): ${staffBranchFilter}`,
        onClear: () => setStaffBranchFilter('ALL'),
      });
    }
    if (staffLevelFilter !== 'ALL') {
      const map: Record<string, string> = {
        TH: 'GV Tiểu học (TH)',
        THCS: 'GV THCS',
        LIEN_CAP: 'Liên cấp (TH & THCS)',
        VAN_PHONG: 'Văn phòng / Hành chính',
        BAO_VE: 'Bảo vệ',
      };
      pills.push({
        key: 'level',
        label: `Tiêu chí 3 (Cấp dạy/Bộ phận): ${map[staffLevelFilter]}`,
        onClear: () => setStaffLevelFilter('ALL'),
      });
    }
    if (staffSubjectFilter !== 'ALL') {
      const found = availableSubjects.find((s) => s.id === staffSubjectFilter);
      pills.push({
        key: 'subject',
        label: `Tiêu chí 4 (Môn học): ${found ? found.label.replace('-- ', '').replace(' --', '') : staffSubjectFilter}`,
        onClear: () => setStaffSubjectFilter('ALL'),
      });
    }
    if (staffBirthYearCompare !== 'ALL') {
      const sym = staffBirthYearCompare === 'GREATER_THAN' ? '>' : staffBirthYearCompare === 'LESS_THAN' ? '<' : '=';
      pills.push({
        key: 'birthYear',
        label: `Tiêu chí 5 (Năm sinh): ${sym} ${staffBirthYearVal}`,
        onClear: () => setStaffBirthYearCompare('ALL'),
      });
    }
    if (staffCampusFilter !== 'ALL') {
      pills.push({
        key: 'campus',
        label: `Tiêu chí 6 (Điểm trường): ${staffCampusFilter}`,
        onClear: () => setStaffCampusFilter('ALL'),
      });
    }
    if (staffRoleFilter !== 'ALL') {
      const map: Record<string, string> = {
        BGH: 'Ban Giám Hiệu',
        GVCN: 'GV Chủ Nhiệm',
        GV_BO_MON: 'GV Bộ Môn',
        TO_TRUONG: 'Tổ trưởng CM',
        NV: 'Nhân viên',
        BV: 'Bảo vệ',
      };
      pills.push({
        key: 'role',
        label: `Tiêu chí 7 (Vai trò): ${map[staffRoleFilter]}`,
        onClear: () => setStaffRoleFilter('ALL'),
      });
    }
    if (staffPartyMemberFilter !== 'ALL') {
      pills.push({
        key: 'party',
        label: `Tiêu chí 8 (Đảng viên): ${staffPartyMemberFilter === 'YES' ? 'Là Đảng viên' : 'Chưa vào Đảng'}`,
        onClear: () => setStaffPartyMemberFilter('ALL'),
      });
    }
    if (staffSeniorityCompare !== 'ALL') {
      const map: Record<string, string> = {
        GREATER_EQUAL_15: 'Thâm niên ≥ 15 năm',
        GREATER_EQUAL_10: 'Thâm niên ≥ 10 năm',
        LESS_THAN_10: 'Thâm niên < 10 năm',
      };
      pills.push({
        key: 'seniority',
        label: `Tiêu chí 9 (Thâm niên): ${map[staffSeniorityCompare]}`,
        onClear: () => setStaffSeniorityCompare('ALL'),
      });
    }
    if (staffDegreeFilter !== 'ALL') {
      const map: Record<string, string> = {
        THAC_SI: 'Thạc sĩ',
        DAI_HOC: 'Đại học',
        CAO_DANG: 'Cao đẳng',
        KHAC: 'Khác',
      };
      pills.push({
        key: 'degree',
        label: `Tiêu chí 10 (Trình độ): ${map[staffDegreeFilter]}`,
        onClear: () => setStaffDegreeFilter('ALL'),
      });
    }
    if (staffSearchTerm.trim()) {
      pills.push({
        key: 'search',
        label: `Tìm kiếm: "${staffSearchTerm}"`,
        onClear: () => setStaffSearchTerm(''),
      });
    }
    return pills;
  }, [
    staffGenderFilter,
    staffBranchFilter,
    staffLevelFilter,
    staffSubjectFilter,
    availableSubjects,
    staffBirthYearCompare,
    staffBirthYearVal,
    staffCampusFilter,
    staffRoleFilter,
    staffPartyMemberFilter,
    staffSeniorityCompare,
    staffDegreeFilter,
    staffSearchTerm,
  ]);

  // ==========================================
  // XUẤT BÁO CÁO CSV THEO TIÊU CHÍ ĐANG LỌC
  // ==========================================
  const handleExportStudentCsv = () => {
    const headers = [
      'STT',
      'Mã HS',
      'Họ và tên',
      'Giới tính',
      'Ngày sinh',
      'Dân tộc',
      'Diện chính sách',
      'Lớp',
      'Cấp học',
      'Điểm trường',
      'Phân hiệu',
      'GVCN phụ trách',
      'Họ tên phụ huynh',
      'SĐT liên hệ',
      'Địa chỉ cư trú',
    ];

    const rows = filteredStudents.map((item, idx) => [
      idx + 1,
      item.student.id,
      item.student.fullName,
      item.student.gender,
      item.student.dob,
      item.student.ethnicity || 'Kinh',
      item.student.policyBeneficiary || 'Không',
      item.className,
      item.level,
      item.campusName,
      item.branchName,
      item.homeroomTeacherName,
      item.student.parentName || '',
      item.student.parentPhone || '',
      item.student.address || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Thong_Ke_Hoc_Sinh_Da_Tieu_Chi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(`Đã xuất ${filteredStudents.length} học sinh ra file CSV thành công!`);
  };

  const handleExportStaffCsv = () => {
    const headers = [
      'STT',
      'Mã CB',
      'Họ và tên',
      'Giới tính',
      'Ngày sinh',
      'Năm sinh',
      'Chức vụ - Nhiệm vụ',
      'Bộ môn chuyên môn',
      'Phân hiệu',
      'Điểm trường',
      'Trình độ đào tạo',
      'Ngày tuyển dụng',
      'Đảng viên',
      'Số điện thoại',
      'Email',
    ];

    const rows = filteredStaff.map((item, idx) => {
      const az = item.sheetDataAZ || {};
      const dob = String(az['D'] || '');
      const birthYear = dob.split('/')[2] || dob.slice(-4);
      return [
        idx + 1,
        item.account.id,
        item.account.name,
        az['C'] || 'Nam',
        dob,
        birthYear,
        item.account.position,
        az['R'] || az['U'] || 'Văn hóa Tiểu học',
        item.account.branchName,
        item.account.campusName,
        az['N'] || '',
        az['F'] || '',
        az['Y'] || 'Không',
        item.account.phone,
        item.account.email,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Thong_Ke_Can_Bo_GVCN_Da_Tieu_Chi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(`Đã xuất ${filteredStaff.length} cán bộ - GV - NV ra file CSV thành công!`);
  };

  // Reset filters
  const resetStudentFilters = () => {
    setStudentGenderFilter('ALL');
    setStudentBranchFilter('ALL');
    setStudentCampusFilter('ALL');
    setStudentEthnicityFilter('ALL');
    setStudentPolicyFilter('ALL');
    setStudentLevelFilter('ALL');
    setStudentGradeFilter('ALL');
    setStudentClassIdFilter('ALL');
    setStudentBirthYearCompare('ALL');
    setStudentBirthYearVal(2015);
    setStudentStatusFilter('Đang học');
    setStudentSearchTerm('');
    showToast('Đã đặt lại toàn bộ 10 tiêu chí lọc học sinh.');
  };

  const resetStaffFilters = () => {
    setStaffGenderFilter('ALL');
    setStaffBranchFilter('ALL');
    setStaffLevelFilter('ALL');
    setStaffSubjectFilter('ALL');
    setStaffBirthYearCompare('ALL');
    setStaffBirthYearVal(1982);
    setStaffCampusFilter('ALL');
    setStaffRoleFilter('ALL');
    setStaffPartyMemberFilter('ALL');
    setStaffSeniorityCompare('ALL');
    setStaffDegreeFilter('ALL');
    setStaffSearchTerm('');
    showToast('Đã đặt lại toàn bộ 10 tiêu chí lọc cán bộ - GV - NV.');
  };

  // Sao chép nhanh danh sách họ tên
  const handleCopyNames = () => {
    if (activeMode === 'STUDENTS') {
      const names = filteredStudents.map((s, idx) => `${idx + 1}. ${s.student.fullName} (${s.className})`).join('\n');
      navigator.clipboard.writeText(names);
      showToast(`Đã sao chép danh sách ${filteredStudents.length} học sinh vào bộ nhớ tạm!`);
    } else {
      const names = filteredStaff.map((s, idx) => `${idx + 1}. ${s.account.name} - ${s.account.position} (${s.account.campusName})`).join('\n');
      navigator.clipboard.writeText(names);
      showToast(`Đã sao chép danh sách ${filteredStaff.length} cán bộ vào bộ nhớ tạm!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Bộ Lọc Đa Tiêu Chí Động Bằng Nút Xổ Xuống
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Năm học: {activeSchoolYear}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">
                Toàn trường: 1.289 Học sinh • 137 Cán bộ • 57 Lớp • 12 Điểm trường
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Trung Tâm Thống Kê Danh Sách Theo Đa Tiêu Chí</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-3xl leading-relaxed">
              Trang chuyên biệt phục vụ công tác điều hành của BGH và các báo cáo ngành: tùy chọn kết hợp tự do trên các nút xổ xuống
              (<strong>Tiêu chí 1 + Tiêu chí 2 + Tiêu chí 3 + Tiêu chí 4 + Tiêu chí 5...</strong>) để tức thì trích xuất danh sách chính xác, in văn bản mẫu chuẩn và xuất Excel.
            </p>
          </div>

          {/* Switcher Mode Buttons */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 shadow-inner">
            <button
              onClick={() => setActiveMode('STUDENTS')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                activeMode === 'STUDENTS'
                  ? 'bg-red-700 text-white shadow-lg shadow-red-700/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Thống Kê Học Sinh ({allFlattenedStudents.length})</span>
            </button>
            <button
              onClick={() => setActiveMode('STAFF')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                activeMode === 'STAFF'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Thống Kê CB - GV - NV ({allStaff.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: THỐNG KÊ HỌC SINH ĐA TIÊU CHÍ                      */}
      {/* ========================================================= */}
      {activeMode === 'STUDENTS' && (
        <div className="space-y-6">
          {/* Quick Preset Scenarios (Ví dụ cụ thể theo yêu cầu người dùng) */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-950 font-black text-xs uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Kịch bản lọc mẫu 1-Click (Đúng theo ví dụ thực tế của nhà trường):</span>
              </div>
              <span className="text-[11px] text-amber-700 font-medium">Bấm để tự động điền các nút xổ xuống</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Preset 1: Nam + Khuyết tật + Có diện chính sách */}
              <button
                onClick={() => {
                  resetStudentFilters();
                  setStudentGenderFilter('Nam');
                  setStudentPolicyFilter('KHUYET_TAT');
                  showToast('Đã áp dụng: Tiêu chí 1 (Nam) + Tiêu chí 5 (Khuyết tật)');
                }}
                className="px-3.5 py-2 bg-white hover:bg-amber-100/80 text-amber-950 font-bold rounded-xl border border-amber-300 shadow-sm transition flex items-center gap-1.5"
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                <span>1. Học sinh Nam + Khuyết tật (VD 1)</span>
              </button>

              {/* Preset 2: Nam + DTTS + Điểm trường miền núi + Diện CS */}
              <button
                onClick={() => {
                  resetStudentFilters();
                  setStudentGenderFilter('Nam');
                  setStudentBranchFilter('Phân hiệu TH và THCS Xuân Quang 2');
                  setStudentCampusFilter('Điểm trường TH Triêm Đức');
                  setStudentEthnicityFilter('THIEU_SO');
                  setStudentPolicyFilter('HO_NGHEO');
                  showToast('Đã áp dụng: Nam + Phân hiệu XQ2 + TH Triêm Đức + DTTS + Hộ nghèo');
                }}
                className="px-3.5 py-2 bg-white hover:bg-amber-100/80 text-amber-950 font-bold rounded-xl border border-amber-300 shadow-sm transition flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Nam + TH Triêm Đức + DTTS + Hộ nghèo</span>
              </button>

              {/* Preset 3: Toàn bộ học sinh Khuyết tật toàn trường */}
              <button
                onClick={() => {
                  resetStudentFilters();
                  setStudentPolicyFilter('KHUYET_TAT');
                  showToast('Đã áp dụng: Tất cả học sinh diện Khuyết tật hòa nhập');
                }}
                className="px-3.5 py-2 bg-white hover:bg-amber-100/80 text-amber-950 font-bold rounded-xl border border-amber-300 shadow-sm transition flex items-center gap-1.5"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
                <span>3. Toàn bộ học sinh Khuyết tật (Toàn trường)</span>
              </button>

              {/* Preset 4: Nữ sinh THCS tại Phân hiệu Xuân Long */}
              <button
                onClick={() => {
                  resetStudentFilters();
                  setStudentGenderFilter('Nữ');
                  setStudentBranchFilter('Phân hiệu TH và THCS Xuân Long');
                  setStudentLevelFilter('THCS');
                  showToast('Đã áp dụng: Nữ + Phân hiệu Xuân Long + Cấp THCS');
                }}
                className="px-3.5 py-2 bg-white hover:bg-amber-100/80 text-amber-950 font-bold rounded-xl border border-amber-300 shadow-sm transition flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>4. Nữ sinh + THCS + Phân hiệu Xuân Long</span>
              </button>

              {/* Preset 5: Học sinh DTTS có diện chính sách */}
              <button
                onClick={() => {
                  resetStudentFilters();
                  setStudentEthnicityFilter('THIEU_SO');
                  setStudentPolicyFilter('CO_CHINH_SACH');
                  showToast('Đã áp dụng: Học sinh DTTS + Có diện chính sách');
                }}
                className="px-3.5 py-2 bg-white hover:bg-amber-100/80 text-amber-950 font-bold rounded-xl border border-amber-300 shadow-sm transition flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>5. Học sinh DTTS + Có diện chính sách</span>
              </button>
            </div>
          </div>

          {/* Filter Panel (10 Nút xổ xuống tùy chọn) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Filter className="w-4 h-4 text-red-600" />
                  Bảng Điều Khiển: 10 Nút Xổ Xuống Đa Tiêu Chí Học Sinh
                </h2>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Tất cả các tiêu chí được giao nhau đồng thời (Điều kiện VÀ). Người dùng có thể chọn bất kỳ kết hợp nào.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={resetStudentFilters}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Đặt lại tất cả
                </button>
                <button
                  onClick={handleCopyNames}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Sao chép tên ({filteredStudents.length})
                </button>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> In Báo Cáo Văn Bản
                </button>
                <button
                  onClick={handleExportStudentCsv}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Xuất Excel / CSV ({filteredStudents.length} HS)
                </button>
              </div>
            </div>

            {/* Grid 10 Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              {/* Tiêu chí 1: Giới tính */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 1: Giới tính</span>
                  <span className="text-[10px] text-red-600 font-mono">1/10</span>
                </label>
                <select
                  value={studentGenderFilter}
                  onChange={(e) => setStudentGenderFilter(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả (Nam & Nữ) --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              {/* Tiêu chí 2: Phân hiệu */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 2: Phân hiệu</span>
                  <span className="text-[10px] text-red-600 font-mono">2/10</span>
                </label>
                <select
                  value={studentBranchFilter}
                  onChange={(e) => {
                    setStudentBranchFilter(e.target.value);
                    setStudentCampusFilter('ALL');
                  }}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Toàn bộ phân hiệu --</option>
                  {uniqueBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiêu chí 3: Điểm trường */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 3: Điểm trường</span>
                  <span className="text-[10px] text-red-600 font-mono">3/10</span>
                </label>
                <select
                  value={studentCampusFilter}
                  onChange={(e) => setStudentCampusFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả điểm trường ({campusesForSelectedStudentBranch.length}) --</option>
                  {campusesForSelectedStudentBranch.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('Điểm trường ', '')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiêu chí 4: Dân tộc */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 4: Dân tộc (DTTS)</span>
                  <span className="text-[10px] text-red-600 font-mono">4/10</span>
                </label>
                <select
                  value={studentEthnicityFilter}
                  onChange={(e) => setStudentEthnicityFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả dân tộc --</option>
                  <option value="THIEU_SO">Dân tộc thiểu số (DTTS)</option>
                  <option value="KINH">Dân tộc Kinh</option>
                </select>
              </div>

              {/* Tiêu chí 5: Diện chính sách */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 5: Diện chính sách</span>
                  <span className="text-[10px] text-red-600 font-mono">5/10</span>
                </label>
                <select
                  value={studentPolicyFilter}
                  onChange={(e) => setStudentPolicyFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả diện chính sách --</option>
                  <option value="KHUYET_TAT">Khuyết tật hòa nhập</option>
                  <option value="HO_NGHEO">Hộ nghèo</option>
                  <option value="HO_CAN_NGHEO">Hộ cận nghèo</option>
                  <option value="MO_COI">Mồ côi</option>
                  <option value="CO_CHINH_SACH">Bất kỳ diện chính sách nào</option>
                  <option value="KHONG">Không chính sách</option>
                </select>
              </div>

              {/* Tiêu chí 6: Cấp học */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 6: Cấp học</span>
                  <span className="text-[10px] text-red-600 font-mono">6/10</span>
                </label>
                <select
                  value={studentLevelFilter}
                  onChange={(e) => setStudentLevelFilter(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Cả 2 cấp học --</option>
                  <option value="TH">Tiểu học (TH - Lớp 1-5)</option>
                  <option value="THCS">THCS (Lớp 6-9)</option>
                </select>
              </div>

              {/* Tiêu chí 7: Khối lớp */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 7: Khối lớp</span>
                  <span className="text-[10px] text-red-600 font-mono">7/10</span>
                </label>
                <select
                  value={studentGradeFilter}
                  onChange={(e) => setStudentGradeFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả các khối (1-9) --</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                    <option key={g} value={g}>
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiêu chí 8: Lớp học cụ thể */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 8: Lớp học</span>
                  <span className="text-[10px] text-red-600 font-mono">8/10</span>
                </label>
                <select
                  value={studentClassIdFilter}
                  onChange={(e) => setStudentClassIdFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả 57 lớp --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.campusName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiêu chí 9: Năm sinh học sinh */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 9: Năm sinh</span>
                  <span className="text-[10px] text-red-600 font-mono">9/10</span>
                </label>
                <div className="flex gap-1">
                  <select
                    value={studentBirthYearCompare}
                    onChange={(e) => setStudentBirthYearCompare(e.target.value as any)}
                    className="w-1/2 px-1.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-[11px]"
                  >
                    <option value="ALL">Không lọc</option>
                    <option value="EQUAL">Đúng năm (=)</option>
                    <option value="GREATER_THAN">Sinh sau (&gt;)</option>
                    <option value="LESS_THAN">Sinh trước (&lt;)</option>
                  </select>
                  <input
                    type="number"
                    value={studentBirthYearVal}
                    onChange={(e) => setStudentBirthYearVal(Number(e.target.value))}
                    disabled={studentBirthYearCompare === 'ALL'}
                    className="w-1/2 px-2 py-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none disabled:bg-slate-100"
                    placeholder="2015"
                  />
                </div>
              </div>

              {/* Tiêu chí 10: Trạng thái & Tìm kiếm */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 10: Trạng thái HS</span>
                  <span className="text-[10px] text-red-600 font-mono">10/10</span>
                </label>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs shadow-sm"
                >
                  <option value="Đang học">Đang học tại trường</option>
                  <option value="ALL">-- Tất cả trạng thái --</option>
                  <option value="Chuyển đến">Mới chuyển đến</option>
                  <option value="Chuyển đi">Đã chuyển đi</option>
                  <option value="Bảo lưu">Bảo lưu</option>
                </select>
              </div>
            </div>

            {/* Ô tìm kiếm từ khóa bổ trợ */}
            <div className="pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  placeholder="Lọc bổ sung nhanh theo tên học sinh, họ tên phụ huynh, số điện thoại, địa chỉ cư trú, giáo viên chủ nhiệm..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:ring-2 focus:ring-red-500 shadow-inner"
                />
              </div>
            </div>

            {/* DẢI CÔNG THỨC TIÊU CHÍ ĐANG ÁP DỤNG (EXPRESSION PILLS) */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5 shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-red-600" />
                  Công thức lọc đang áp dụng:
                </span>
                {activeStudentFilterPills.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    Chưa áp dụng tiêu chí nào (Đang hiển thị toàn bộ 1.289 học sinh). Hãy chọn trên các nút xổ xuống bên trên.
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeStudentFilterPills.map((pill, idx) => (
                      <React.Fragment key={pill.key}>
                        {idx > 0 && <span className="text-slate-400 font-black text-xs">➕</span>}
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300 shadow-xs">
                          <span>{pill.label}</span>
                          <button
                            type="button"
                            onClick={pill.onClear}
                            className="p-0.5 hover:bg-red-200 rounded-full transition"
                            title="Bỏ tiêu chí này"
                          >
                            <X className="w-3 h-3 text-red-700" />
                          </button>
                        </span>
                      </React.Fragment>
                    ))}
                    <button
                      type="button"
                      onClick={resetStudentFilters}
                      className="ml-2 text-xs font-bold text-red-700 hover:underline"
                    >
                      (Xóa tất cả)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RESULTS METRIC BAR */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-extrabold text-slate-900 text-sm">
                  Kết quả trích xuất:
                </span>
                <span className="px-3 py-1 rounded-full font-black text-base bg-red-600 text-white shadow-sm">
                  {filteredStudents.length} học sinh
                </span>
                <span className="text-slate-600 font-medium">
                  (Chiếm{' '}
                  <strong className="text-red-700">
                    {((filteredStudents.length / (allFlattenedStudents.length || 1)) * 100).toFixed(1)}%
                  </strong>{' '}
                  học sinh toàn trường)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
                <div>
                  Nam: <strong className="text-blue-700">{filteredStudents.filter((s) => s.student.gender === 'Nam').length}</strong>
                </div>
                <div>
                  Nữ: <strong className="text-pink-700">{filteredStudents.filter((s) => s.student.gender === 'Nữ').length}</strong>
                </div>
                <div>
                  DTTS: <strong className="text-purple-700">{filteredStudents.filter((s) => (s.student.ethnicity || 'Kinh').toLowerCase() !== 'kinh').length}</strong>
                </div>
                <div>
                  Diện CS: <strong className="text-amber-700">{filteredStudents.filter((s) => s.student.policyBeneficiary && s.student.policyBeneficiary !== 'Không').length}</strong>
                </div>
                <div>
                  Khuyết tật: <strong className="text-rose-700">{filteredStudents.filter((s) => s.student.policyBeneficiary === 'Khuyết tật').length}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Student Results Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-red-600" />
                <span>Danh Sách Học Sinh Thỏa Mãn Các Tiêu Chí ({filteredStudents.length} em)</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Nhấp vào mã lớp hoặc tên học sinh để xem chi tiết
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3">Học Sinh</th>
                    <th className="py-3 px-3 text-center">Giới Tính</th>
                    <th className="py-3 px-3">Ngày Sinh</th>
                    <th className="py-3 px-3">Lớp & Cấp Học</th>
                    <th className="py-3 px-3">Điểm Trường</th>
                    <th className="py-3 px-3">Phân Hiệu</th>
                    <th className="py-3 px-3">Diện Chính Sách</th>
                    <th className="py-3 px-3">Dân Tộc</th>
                    <th className="py-3 px-3">GVCN Phụ Trách</th>
                    <th className="py-3 px-3">Phụ Huynh & SĐT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-14 text-center text-slate-500">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <div className="font-bold text-sm text-slate-700">Không tìm thấy học sinh nào khớp với tất cả tiêu chí đã chọn!</div>
                        <div className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          Vui lòng nới lỏng hoặc điều chỉnh một số nút xổ xuống bên trên để mở rộng phạm vi tìm kiếm.
                        </div>
                        <button
                          onClick={resetStudentFilters}
                          className="mt-3 px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                        >
                          Đặt lại toàn bộ tiêu chí
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((item, idx) => {
                      const s = item.student;
                      return (
                        <tr key={`${item.classId}_${s.id}`} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{s.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Mã: {s.id}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                s.gender === 'Nam'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-pink-100 text-pink-800'
                              }`}
                            >
                              {s.gender}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{s.dob}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-extrabold text-slate-900">{item.className}</div>
                            <div className="text-[10px] text-slate-500">
                              Khối {item.grade} • {item.level}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <div className="font-semibold">{item.campusName}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">{item.branchName}</td>
                          <td className="py-2.5 px-3">
                            {s.policyBeneficiary && s.policyBeneficiary !== 'Không' ? (
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  s.policyBeneficiary === 'Khuyết tật'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                    : s.policyBeneficiary === 'Hộ nghèo'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {s.policyBeneficiary}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Không</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                (s.ethnicity || 'Kinh') !== 'Kinh'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {s.ethnicity || 'Kinh'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{item.homeroomTeacherName}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <div>{s.parentName || 'Chưa cập nhật'}</div>
                            <div className="font-mono text-[10px] text-indigo-700">{s.parentPhone || ''}</div>
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

      {/* ========================================================= */}
      {/* TAB 2: THỐNG KÊ CÁN BỘ - GIÁO VIÊN - NHÂN VIÊN ĐA TIÊU CHÍ */}
      {/* ========================================================= */}
      {activeMode === 'STAFF' && (
        <div className="space-y-6">
          {/* Quick Preset Scenarios (Khớp chính xác các ví dụ của Ban Giám hiệu) */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-950 font-black text-xs uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Kịch bản lọc mẫu 1-Click Cán bộ (Theo các ví dụ chỉ đạo của người dùng):</span>
              </div>
              <span className="text-[11px] text-indigo-700 font-medium">Bấm để tự động điền các nút xổ xuống</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Preset 1: Nữ + Dạy cấp TH + Năm sinh > 1982 (ĐÚNG NGUYÊN VĂN VÍ DỤ 2) */}
              <button
                onClick={() => {
                  resetStaffFilters();
                  setStaffGenderFilter('Nữ');
                  setStaffLevelFilter('TH');
                  setStaffBirthYearCompare('GREATER_THAN');
                  setStaffBirthYearVal(1982);
                  showToast('Đã áp dụng: Tiêu chí 1 (Nữ) + Tiêu chí 3 (GV TH) + Tiêu chí 5 (Năm sinh > 1982)');
                }}
                className="px-3.5 py-2 bg-white hover:bg-indigo-100/80 text-indigo-950 font-bold rounded-xl border border-indigo-300 shadow-sm transition flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-pink-600" />
                <span>1. Nữ + Dạy cấp TH + Sinh năm &gt; 1982 (VD 2)</span>
              </button>

              {/* Preset 2: GV THCS + Môn Toán / Tin học + Phân hiệu Xuân Long (ĐÚNG NGUYÊN VĂN VÍ DỤ 3) */}
              <button
                onClick={() => {
                  resetStaffFilters();
                  setStaffBranchFilter('Phân hiệu TH và THCS Xuân Long');
                  setStaffLevelFilter('THCS');
                  setStaffSubjectFilter('TOAN');
                  showToast('Đã áp dụng: Phân hiệu Xuân Long + Cấp THCS + Môn Toán');
                }}
                className="px-3.5 py-2 bg-white hover:bg-indigo-100/80 text-indigo-950 font-bold rounded-xl border border-indigo-300 shadow-sm transition flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>2. GV THCS + Môn Toán + Phân hiệu Xuân Long (VD 3)</span>
              </button>

              {/* Preset 3: Nữ + Dạy cấp TH tại Điểm trường TH Triêm Đức */}
              <button
                onClick={() => {
                  resetStaffFilters();
                  setStaffGenderFilter('Nữ');
                  setStaffLevelFilter('TH');
                  setStaffCampusFilter('Điểm trường TH Triêm Đức');
                  showToast('Đã áp dụng: Nữ + Dạy TH + Điểm trường TH Triêm Đức');
                }}
                className="px-3.5 py-2 bg-white hover:bg-indigo-100/80 text-indigo-950 font-bold rounded-xl border border-indigo-300 shadow-sm transition flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Nữ + GV TH + Điểm trường TH Triêm Đức</span>
              </button>

              {/* Preset 4: Giáo viên là Đảng viên Đảng CSVN */}
              <button
                onClick={() => {
                  resetStaffFilters();
                  setStaffPartyMemberFilter('YES');
                  setStaffRoleFilter('GV_BO_MON');
                  showToast('Đã áp dụng: Giáo viên + Là Đảng viên Đảng CSVN');
                }}
                className="px-3.5 py-2 bg-white hover:bg-indigo-100/80 text-indigo-950 font-bold rounded-xl border border-indigo-300 shadow-sm transition flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-red-600" />
                <span>4. Giáo viên là Đảng viên</span>
              </button>

              {/* Preset 5: Toàn bộ 57 Giáo viên Chủ nhiệm */}
              <button
                onClick={() => {
                  resetStaffFilters();
                  setStaffRoleFilter('GVCN');
                  showToast('Đã áp dụng: Toàn bộ 57 Giáo viên Chủ nhiệm đang giữ lớp');
                }}
                className="px-3.5 py-2 bg-white hover:bg-indigo-100/80 text-indigo-950 font-bold rounded-xl border border-indigo-300 shadow-sm transition flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>5. Danh sách 57 Giáo viên Chủ nhiệm (GVCN)</span>
              </button>

              {/* Preset 6: Thâm niên công tác từ 15 năm trở lên */}
              <button
                onClick={() => {
                  resetStaffFilters();
                  setStaffSeniorityCompare('GREATER_EQUAL_15');
                  showToast('Đã áp dụng: Thâm niên công tác từ 15 năm trở lên');
                }}
                className="px-3.5 py-2 bg-white hover:bg-indigo-100/80 text-indigo-950 font-bold rounded-xl border border-indigo-300 shadow-sm transition flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                <span>6. Thâm niên công tác ≥ 15 năm</span>
              </button>
            </div>
          </div>

          {/* Filter Panel (10 Nút xổ xuống tùy chọn Cán bộ) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  Bảng Điều Khiển: 10 Nút Xổ Xuống Đa Tiêu Chí Cán Bộ - GV - NV
                </h2>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Tất cả các tiêu chí giao nhau đồng thời (Điều kiện VÀ). Người dùng có thể tùy biến bất kỳ kết hợp nào.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={resetStaffFilters}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Đặt lại tất cả
                </button>
                <button
                  onClick={handleCopyNames}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Sao chép tên ({filteredStaff.length})
                </button>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> In Báo Cáo Văn Bản
                </button>
                <button
                  onClick={handleExportStaffCsv}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Xuất Excel / CSV ({filteredStaff.length} CB)
                </button>
              </div>
            </div>

            {/* Grid 10 Dropdowns for Staff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              {/* Tiêu chí 1: Giới tính cán bộ */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 1: Giới tính</span>
                  <span className="text-[10px] text-indigo-600 font-mono">1/10</span>
                </label>
                <select
                  value={staffGenderFilter}
                  onChange={(e) => setStaffGenderFilter(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả (Nam & Nữ) --</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Nam">Nam</option>
                </select>
              </div>

              {/* Tiêu chí 2: Phân hiệu công tác */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 2: Phân hiệu</span>
                  <span className="text-[10px] text-indigo-600 font-mono">2/10</span>
                </label>
                <select
                  value={staffBranchFilter}
                  onChange={(e) => {
                    setStaffBranchFilter(e.target.value);
                    setStaffCampusFilter('ALL');
                  }}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Toàn bộ phân hiệu --</option>
                  <option value="Trụ sở chính Đồng Xuân">Trụ sở chính Đồng Xuân</option>
                  <option value="Phân hiệu TH La Hai">Phân hiệu TH La Hai</option>
                  <option value="Phân hiệu TH và THCS Xuân Long">Phân hiệu TH và THCS Xuân Long</option>
                  <option value="Phân hiệu TH và THCS Xuân Quang 2">Phân hiệu TH và THCS Xuân Quang 2</option>
                </select>
              </div>

              {/* Tiêu chí 3: Cấp giảng dạy / Bộ phận */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 3: Cấp dạy / Khối</span>
                  <span className="text-[10px] text-indigo-600 font-mono">3/10</span>
                </label>
                <select
                  value={staffLevelFilter}
                  onChange={(e) => setStaffLevelFilter(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Toàn bộ các cấp --</option>
                  <option value="TH">Dạy cấp Tiểu học (TH)</option>
                  <option value="THCS">Dạy cấp THCS</option>
                  <option value="LIEN_CAP">Liên cấp (dạy cả 2 cấp)</option>
                  <option value="VAN_PHONG">Tổ Văn phòng / Hành chính</option>
                  <option value="BAO_VE">Tổ Bảo vệ / Tạp vụ</option>
                </select>
              </div>

              {/* Tiêu chí 4: Môn học chuyên môn */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 4: Môn học</span>
                  <span className="text-[10px] text-indigo-600 font-mono">4/10</span>
                </label>
                <select
                  value={staffSubjectFilter}
                  onChange={(e) => setStaffSubjectFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                >
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiêu chí 5: Năm sinh (VD: > 1982 theo yêu cầu) */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 5: Năm sinh</span>
                  <span className="text-[10px] text-indigo-600 font-mono">5/10</span>
                </label>
                <div className="flex gap-1">
                  <select
                    value={staffBirthYearCompare}
                    onChange={(e) => setStaffBirthYearCompare(e.target.value as any)}
                    className="w-1/2 px-1.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-[11px]"
                  >
                    <option value="ALL">Không lọc</option>
                    <option value="GREATER_THAN">Sinh sau (&gt;)</option>
                    <option value="LESS_THAN">Sinh trước (&lt;)</option>
                    <option value="EQUAL">Đúng năm (=)</option>
                  </select>
                  <input
                    type="number"
                    value={staffBirthYearVal}
                    onChange={(e) => setStaffBirthYearVal(Number(e.target.value))}
                    disabled={staffBirthYearCompare === 'ALL'}
                    className="w-1/2 px-2 py-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:outline-none disabled:bg-slate-100"
                    placeholder="1982"
                  />
                </div>
              </div>

              {/* Tiêu chí 6: Điểm trường công tác */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 6: Điểm trường</span>
                  <span className="text-[10px] text-indigo-600 font-mono">6/10</span>
                </label>
                <select
                  value={staffCampusFilter}
                  onChange={(e) => setStaffCampusFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả điểm trường ({campusesForSelectedStaffBranch.length}) --</option>
                  {campusesForSelectedStaffBranch.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('Điểm trường ', '').replace('Điểm ', '')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiêu chí 7: Vai trò / Trách nhiệm */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 7: Vai trò / Vị trí</span>
                  <span className="text-[10px] text-indigo-600 font-mono">7/10</span>
                </label>
                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả các vai trò --</option>
                  <option value="BGH">Ban Giám Hiệu (HT & PHT)</option>
                  <option value="GVCN">Giáo viên Chủ nhiệm (57 lớp)</option>
                  <option value="GV_BO_MON">Giáo viên Bộ môn</option>
                  <option value="TO_TRUONG">Tổ trưởng / Tổ phó CM</option>
                  <option value="NV">Nhân viên hành chính</option>
                  <option value="BV">Bảo vệ / Phục vụ</option>
                </select>
              </div>

              {/* Tiêu chí 8: Đảng viên */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 8: Đảng viên Đảng</span>
                  <span className="text-[10px] text-indigo-600 font-mono">8/10</span>
                </label>
                <select
                  value={staffPartyMemberFilter}
                  onChange={(e) => setStaffPartyMemberFilter(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả --</option>
                  <option value="YES">Đảng viên Đảng CSVN</option>
                  <option value="NO">Chưa vào Đảng</option>
                </select>
              </div>

              {/* Tiêu chí 9: Thâm niên công tác */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 9: Thâm niên</span>
                  <span className="text-[10px] text-indigo-600 font-mono">9/10</span>
                </label>
                <select
                  value={staffSeniorityCompare}
                  onChange={(e) => setStaffSeniorityCompare(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Không giới hạn --</option>
                  <option value="GREATER_EQUAL_15">Thâm niên ≥ 15 năm</option>
                  <option value="GREATER_EQUAL_10">Thâm niên ≥ 10 năm</option>
                  <option value="LESS_THAN_10">Dưới 10 năm</option>
                </select>
              </div>

              {/* Tiêu chí 10: Trình độ đào tạo */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                <label className="font-extrabold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                  <span>Tiêu chí 10: Trình độ</span>
                  <span className="text-[10px] text-indigo-600 font-mono">10/10</span>
                </label>
                <select
                  value={staffDegreeFilter}
                  onChange={(e) => setStaffDegreeFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm"
                >
                  <option value="ALL">-- Tất cả trình độ --</option>
                  <option value="THAC_SI">Thạc sĩ</option>
                  <option value="DAI_HOC">Đại học Sư phạm</option>
                  <option value="CAO_DANG">Cao đẳng Sư phạm</option>
                  <option value="KHAC">Khác / Trung cấp</option>
                </select>
              </div>
            </div>

            {/* Ô tìm kiếm từ khóa bổ trợ */}
            <div className="pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={staffSearchTerm}
                  onChange={(e) => setStaffSearchTerm(e.target.value)}
                  placeholder="Lọc bổ sung nhanh theo tên cán bộ, mã CB, môn dạy, số điện thoại, tổ chuyên môn..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                />
              </div>
            </div>

            {/* DẢI CÔNG THỨC TIÊU CHÍ ĐANG ÁP DỤNG CHO CÁN BỘ (ACTIVE PILLS) */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5 shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  Công thức lọc cán bộ đang áp dụng:
                </span>
                {activeStaffFilterPills.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    Chưa áp dụng tiêu chí nào (Đang hiển thị toàn bộ 137 cán bộ - GV - NV). Hãy chọn trên các nút xổ xuống bên trên.
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeStaffFilterPills.map((pill, idx) => (
                      <React.Fragment key={pill.key}>
                        {idx > 0 && <span className="text-slate-400 font-black text-xs">➕</span>}
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-xs">
                          <span>{pill.label}</span>
                          <button
                            type="button"
                            onClick={pill.onClear}
                            className="p-0.5 hover:bg-indigo-200 rounded-full transition"
                            title="Bỏ tiêu chí này"
                          >
                            <X className="w-3 h-3 text-indigo-700" />
                          </button>
                        </span>
                      </React.Fragment>
                    ))}
                    <button
                      type="button"
                      onClick={resetStaffFilters}
                      className="ml-2 text-xs font-bold text-indigo-700 hover:underline"
                    >
                      (Xóa tất cả)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RESULTS METRIC BAR FOR STAFF */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-extrabold text-slate-900 text-sm">
                  Kết quả trích xuất:
                </span>
                <span className="px-3 py-1 rounded-full font-black text-base bg-indigo-600 text-white shadow-sm">
                  {filteredStaff.length} người
                </span>
                <span className="text-slate-600 font-medium">
                  (Chiếm{' '}
                  <strong className="text-indigo-700">
                    {((filteredStaff.length / (allStaff.length || 1)) * 100).toFixed(1)}%
                  </strong>{' '}
                  tổng số 137 CB-GV-NV toàn trường)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
                <div>
                  Nữ: <strong className="text-pink-700">{filteredStaff.filter((s) => (s.sheetDataAZ?.['C'] || '').toString().trim() === 'Nữ').length}</strong>
                </div>
                <div>
                  Nam: <strong className="text-blue-700">{filteredStaff.filter((s) => (s.sheetDataAZ?.['C'] || '').toString().trim() !== 'Nữ').length}</strong>
                </div>
                <div>
                  Đảng viên: <strong className="text-red-700">{filteredStaff.filter((s) => (s.sheetDataAZ?.['Y'] || '').toString().toLowerCase().includes('có')).length}</strong>
                </div>
                <div>
                  Dạy TH: <strong className="text-emerald-700">{filteredStaff.filter((s) => (s.sheetDataAZ?.['T'] || s.account.position).toString().includes('Tiểu học') || (s.sheetDataAZ?.['T'] || '').toString().includes('TH')).length}</strong>
                </div>
                <div>
                  Dạy THCS: <strong className="text-indigo-700">{filteredStaff.filter((s) => (s.sheetDataAZ?.['T'] || s.account.position).toString().includes('THCS')).length}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Results Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Danh Sách Cán Bộ - Giáo Viên - Nhân Viên Thỏa Mãn Các Tiêu Chí ({filteredStaff.length} người)</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Dữ liệu đồng bộ trực tiếp từ 52 cột A-AZ hồ sơ nhân sự chính thức
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3">Cán Bộ / Giáo Viên</th>
                    <th className="py-3 px-3 text-center">Giới Tính</th>
                    <th className="py-3 px-3">Ngày Sinh</th>
                    <th className="py-3 px-3 text-center">Năm Sinh</th>
                    <th className="py-3 px-3">Chức Vụ & Tổ Khối</th>
                    <th className="py-3 px-3">Môn Dạy / Bộ Phận</th>
                    <th className="py-3 px-3">Cấp Dạy</th>
                    <th className="py-3 px-3">Điểm Trường</th>
                    <th className="py-3 px-3 text-center">Đảng Viên</th>
                    <th className="py-3 px-3">Trình Độ Đào Tạo</th>
                    <th className="py-3 px-3">Số Điện Thoại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-14 text-center text-slate-500">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <div className="font-bold text-sm text-slate-700">Không tìm thấy cán bộ nào khớp với tất cả tiêu chí đã chọn!</div>
                        <div className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          Vui lòng nới lỏng hoặc điều chỉnh một số nút xổ xuống bên trên để mở rộng phạm vi tìm kiếm.
                        </div>
                        <button
                          onClick={resetStaffFilters}
                          className="mt-3 px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                        >
                          Đặt lại toàn bộ tiêu chí
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((item, idx) => {
                      const az = item.sheetDataAZ || {};
                      const gender = az['C'] || 'Nam';
                      const dob = String(az['D'] || '');
                      const birthYear = dob.split('/')[2] || (dob.length >= 4 ? dob.slice(-4) : 'N/A');
                      const isParty = String(az['Y'] || '').toLowerCase().includes('có');
                      const subject = az['R'] || az['U'] || 'Văn hóa Tiểu học';

                      return (
                        <tr key={item.account.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.account.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Mã: {item.account.id}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                gender === 'Nữ'
                                  ? 'bg-pink-100 text-pink-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {gender}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{dob}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-center text-indigo-700">
                            {birthYear}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{item.account.position}</div>
                            <div className="text-[10px] text-slate-500">{az['S'] ? `Tổ: ${az['S']}` : ''}</div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {subject}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                              {az['T'] || item.account.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <div className="font-semibold">{item.account.campusName}</div>
                            <div className="text-[10px] text-slate-500">{item.account.branchName}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isParty ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                                Đảng viên
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Chưa</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                            {az['N'] || 'Đại học'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-indigo-700 font-medium">
                            {item.account.phone}
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

      {/* ========================================================= */}
      {/* MODAL IN BÁO CÁO CHUẨN THỂ THỨC VĂN BẢN TRƯỜNG HỌC       */}
      {/* ========================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Xem Trước Bản In Văn Bản Báo Cáo</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> In Báo Cáo (Ctrl + P)
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Khổ văn bản chính thức */}
            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-6 text-slate-900">
              {/* Tiêu ngữ */}
              <div className="grid grid-cols-2 text-center text-xs">
                <div>
                  <div className="font-semibold uppercase">PHÒNG GIÁO DỤC VÀ ĐÀO TẠO ĐỒNG XUÂN</div>
                  <div className="font-extrabold uppercase text-slate-950">TRƯỜNG TH & THCS ĐỒNG XUÂN</div>
                  <div className="text-[10px] text-slate-500 mt-1">Số: ......./BC-TH&THCSDX</div>
                </div>
                <div>
                  <div className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="font-bold underline text-[11px]">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-[11px] text-slate-600 italic mt-1">
                    Đồng Xuân, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>
                </div>
              </div>

              {/* Tên báo cáo */}
              <div className="text-center space-y-1 pt-2">
                <h2 className="text-base font-black uppercase text-slate-900">
                  {activeMode === 'STUDENTS'
                    ? 'BÁO CÁO THỐNG KÊ DANH SÁCH HỌC SINH THEO ĐA TIÊU CHÍ'
                    : 'BÁO CÁO THỐNG KÊ DANH SÁCH CÁN BỘ - GIÁO VIÊN - NHÂN VIÊN'}
                </h2>
                <div className="text-xs text-slate-600">
                  Năm học: {activeSchoolYear} • Trích xuất từ Hệ thống Quản trị Nội bộ Trường TH & THCS Đồng Xuân
                </div>
                <div className="text-xs text-indigo-900 font-bold max-w-xl mx-auto pt-1">
                  {activeMode === 'STUDENTS'
                    ? `Các tiêu chí áp dụng: ${activeStudentFilterPills.map((p) => p.label).join(' + ') || 'Toàn trường'}`
                    : `Các tiêu chí áp dụng: ${activeStaffFilterPills.map((p) => p.label).join(' + ') || 'Toàn trường'}`}
                </div>
              </div>

              {/* Tóm tắt số liệu */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-semibold flex items-center justify-between">
                <div>
                  Tổng số kết quả:{' '}
                  <strong className="text-red-700">
                    {activeMode === 'STUDENTS' ? filteredStudents.length : filteredStaff.length}{' '}
                    {activeMode === 'STUDENTS' ? 'học sinh' : 'cán bộ'}
                  </strong>
                </div>
                <div>
                  Tỷ lệ so với quy mô:{' '}
                  <strong className="text-blue-700">
                    {activeMode === 'STUDENTS'
                      ? `${((filteredStudents.length / (allFlattenedStudents.length || 1)) * 100).toFixed(1)}%`
                      : `${((filteredStaff.length / (allStaff.length || 1)) * 100).toFixed(1)}%`}
                  </strong>
                </div>
                <div>
                  Thời điểm kết xuất: <strong>{new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}</strong>
                </div>
              </div>

              {/* Bảng kết quả rút gọn trong bản in */}
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold">
                    <tr>
                      <th className="p-2 w-10 text-center">STT</th>
                      <th className="p-2">Họ và Tên</th>
                      <th className="p-2 text-center">Giới Tính</th>
                      <th className="p-2">Ngày Sinh</th>
                      <th className="p-2">
                        {activeMode === 'STUDENTS' ? 'Lớp & Cấp Học' : 'Chức Vụ & Môn Dạy'}
                      </th>
                      <th className="p-2">Điểm Trường</th>
                      <th className="p-2">
                        {activeMode === 'STUDENTS' ? 'Diện Chính Sách' : 'Đảng Viên'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeMode === 'STUDENTS'
                      ? filteredStudents.slice(0, 50).map((item, idx) => (
                          <tr key={item.student.id}>
                            <td className="p-2 text-center font-mono">{idx + 1}</td>
                            <td className="p-2 font-bold">{item.student.fullName}</td>
                            <td className="p-2 text-center">{item.student.gender}</td>
                            <td className="p-2 font-mono">{item.student.dob}</td>
                            <td className="p-2">{item.className}</td>
                            <td className="p-2">{item.campusName}</td>
                            <td className="p-2">{item.student.policyBeneficiary || 'Không'}</td>
                          </tr>
                        ))
                      : filteredStaff.slice(0, 50).map((item, idx) => (
                          <tr key={item.account.id}>
                            <td className="p-2 text-center font-mono">{idx + 1}</td>
                            <td className="p-2 font-bold">{item.account.name}</td>
                            <td className="p-2 text-center">{item.sheetDataAZ?.['C'] || 'Nam'}</td>
                            <td className="p-2 font-mono">{String(item.sheetDataAZ?.['D'] || '')}</td>
                            <td className="p-2">{item.account.position}</td>
                            <td className="p-2">{item.account.campusName}</td>
                            <td className="p-2">
                              {String(item.sheetDataAZ?.['Y'] || '').toLowerCase().includes('có') ? 'Đảng viên' : 'Chưa'}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {(activeMode === 'STUDENTS' ? filteredStudents.length : filteredStaff.length) > 50 && (
                <div className="text-center text-xs text-slate-500 italic">
                  * Bản xem trước hiển thị 50 kết quả đầu tiên. Khi xuất Excel/CSV sẽ đầy đủ tất cả {activeMode === 'STUDENTS' ? filteredStudents.length : filteredStaff.length} bản ghi.
                </div>
              )}

              {/* Phần ký duyệt văn bản */}
              <div className="grid grid-cols-3 text-center text-xs pt-6">
                <div>
                  <div className="font-bold uppercase">NGƯỜI LẬP BIỂU</div>
                  <div className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                  <div className="mt-14 font-semibold text-slate-800">{currentUser?.name || 'Cán bộ thống kê'}</div>
                </div>
                <div>
                  <div className="font-bold uppercase">TỔ TRƯỞNG CHUYÊN MÔN</div>
                  <div className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
                  <div className="mt-14 font-semibold text-slate-800">Xác nhận chuyên môn</div>
                </div>
                <div>
                  <div className="font-bold uppercase">HIỆU TRƯỞNG</div>
                  <div className="text-[11px] text-slate-500 italic">(Ký, đóng dấu)</div>
                  <div className="mt-14 font-extrabold text-slate-900">Nguyễn Quốc Bảo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
