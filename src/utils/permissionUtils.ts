import { UserAccount, StudentAbsenceRequest, StudentTransferReport, LeaveRequest, SubstituteTeachingRequest } from '../types/school';

/**
 * Phân công trách nhiệm quản lý và phê duyệt của Ban Giám hiệu:
 * - Hiệu trưởng: Thầy Nguyễn Quốc Bảo (Toàn trường)
 * - Quản trị Hệ thống: Cô Võ Thị Ngọc Hảo (Toàn trường)
 * - Phó Hiệu trưởng: Thầy Phan Hưng Tuyên (Phân hiệu Xuân Long)
 * - Phó Hiệu trưởng: Thầy Trần Thanh Long (Phân hiệu La hai)
 * - Phó Hiệu trưởng: Thầy Ninh Đức Hiếu (Phân hiệu Xuân Quang 2)
 */

export interface ApprovalPermissionResult {
  canApprove: boolean;
  isFullSchoolAdmin: boolean;
  assignedBranch: string | null;
  reason?: string;
}

/**
 * Lấy tên chuẩn phân hiệu mà PHT được phân công phụ trách
 */
export function getPhtAssignedBranch(user: UserAccount | null): string | null {
  if (!user) return null;
  if (user.role !== 'PHT') return null;

  const id = (user.id || '').toUpperCase();
  const name = (user.name || '').toLowerCase();
  const pos = (user.position || '').toLowerCase();
  const branch = (user.branchName || '').toLowerCase();

  // 1. Thầy Phan Hưng Tuyên -> Xuân Long
  if (id === 'PHT01' || name.includes('tuyên') || pos.includes('xuân long') || branch.includes('xuân long')) {
    return 'Xuân Long';
  }

  // 2. Thầy Trần Thanh Long -> La hai
  if (id === 'PHT02' || name.includes('long') || pos.includes('la hai') || branch.includes('la hai')) {
    return 'La hai';
  }

  // 3. Thầy Ninh Đức Hiếu -> Xuân Quang 2
  if (id === 'PHT03' || name.includes('hiếu') || pos.includes('xuân quang 2') || branch.includes('xuân quang 2') || branch.includes('xuan quang 2')) {
    return 'Xuân Quang 2';
  }

  return null;
}

/**
 * Kiểm tra xem người dùng có quyền duyệt cho một phân hiệu cụ thể hay không
 */
export function checkBranchApprovalPermission(
  user: UserAccount | null,
  targetBranch?: string | null
): ApprovalPermissionResult {
  if (!user) {
    return {
      canApprove: false,
      isFullSchoolAdmin: false,
      assignedBranch: null,
      reason: 'Vui lòng đăng nhập với tư cách BGH để thực hiện phê duyệt.',
    };
  }

  // Hiệu trưởng và Quản trị hệ thống được duyệt cho HS và GV của TOÀN TRƯỜNG
  if (user.role === 'HT' || user.role === 'GV_TIN_HOC') {
    return {
      canApprove: true,
      isFullSchoolAdmin: true,
      assignedBranch: 'Toàn trường',
    };
  }

  // Phó Hiệu trưởng chỉ được duyệt cho phân hiệu được phân công
  if (user.role === 'PHT') {
    const assigned = getPhtAssignedBranch(user);
    if (!assigned) {
      return {
        canApprove: false,
        isFullSchoolAdmin: false,
        assignedBranch: null,
        reason: 'Tài khoản PHT chưa được cấu hình phân hiệu phụ trách.',
      };
    }

    if (!targetBranch) {
      // Nếu không có thông tin phân hiệu mục tiêu, mặc định cảnh báo
      return {
        canApprove: false,
        isFullSchoolAdmin: false,
        assignedBranch: assigned,
        reason: 'Không xác định được phân hiệu của hồ sơ này.',
      };
    }

    const normTarget = targetBranch.toLowerCase().trim();
    const normAssigned = assigned.toLowerCase().trim();

    const isMatch =
      normTarget.includes(normAssigned) ||
      (normAssigned === 'la hai' && normTarget.includes('la hai')) ||
      (normAssigned === 'xuân long' && normTarget.includes('xuân long')) ||
      (normAssigned === 'xuân quang 2' && (normTarget.includes('xuân quang 2') || normTarget.includes('xuan quang 2')));

    if (isMatch) {
      return {
        canApprove: true,
        isFullSchoolAdmin: false,
        assignedBranch: assigned,
      };
    } else {
      return {
        canApprove: false,
        isFullSchoolAdmin: false,
        assignedBranch: assigned,
        reason: `Thầy ${user.name} chỉ phụ trách duyệt phân hiệu ${assigned}. Đơn này thuộc ${targetBranch}.`,
      };
    }
  }

  // Các vai trò khác (GV, NV, BV...) không có quyền duyệt
  return {
    canApprove: false,
    isFullSchoolAdmin: false,
    assignedBranch: null,
    reason: 'Chỉ Ban Giám hiệu mới có thẩm quyền phê duyệt.',
  };
}

/**
 * Kiểm tra quyền duyệt đơn nghỉ học của học sinh
 */
export function canApproveStudentAbsence(
  user: UserAccount | null,
  absence: StudentAbsenceRequest
): ApprovalPermissionResult {
  return checkBranchApprovalPermission(user, absence.branchName);
}

/**
 * Kiểm tra quyền duyệt đơn nghỉ phép của GV / NV
 */
export function canApproveLeaveRequest(
  user: UserAccount | null,
  leave: LeaveRequest,
  allStaff?: { account: UserAccount }[]
): ApprovalPermissionResult {
  // Lấy phân hiệu từ đơn hoặc tìm từ thông tin nhân sự
  let branchName = leave.branchName;
  if (!branchName && allStaff) {
    const staff = allStaff.find((s) => s.account.id === leave.userId);
    if (staff) {
      branchName = staff.account.branchName;
    }
  }

  // Nếu vẫn không có, suy luận từ tên điểm trường
  if (!branchName && leave.campusName) {
    const campus = leave.campusName.toLowerCase();
    if (campus.includes('long mỹ') || campus.includes('long hòa') || campus.includes('long my')) {
      branchName = 'Phân hiệu TH và THCS Xuân Long';
    } else if (campus.includes('la hai') || campus.includes('long hà')) {
      branchName = 'Phân hiệu TH La Hai';
    } else if (campus.includes('triêm đức') || campus.includes('phước huệ') || campus.includes('phú sơn') || campus.includes('kỳ đu')) {
      branchName = 'Phân hiệu TH và THCS Xuân Quang 2';
    } else {
      branchName = 'Trụ sở chính Đồng Xuân';
    }
  }

  return checkBranchApprovalPermission(user, branchName);
}

/**
 * Kiểm tra quyền duyệt yêu cầu đổi tiết / dạy thay
 */
export function canApproveSubstituteRequest(
  user: UserAccount | null,
  sub: SubstituteTeachingRequest
): ApprovalPermissionResult {
  return checkBranchApprovalPermission(user, sub.branchNameA);
}

/**
 * Nhãn hiển thị người phụ trách duyệt
 */
export function getResponsibleApproverLabel(branchName?: string): string {
  if (!branchName) return 'Ban Giám hiệu (HT / PHT)';
  const norm = branchName.toLowerCase();
  if (norm.includes('xuân long')) {
    return 'PHT Thầy Phan Hưng Tuyên (Xuân Long)';
  }
  if (norm.includes('la hai')) {
    return 'PHT Thầy Trần Thanh Long (La hai)';
  }
  if (norm.includes('xuân quang 2') || norm.includes('xuan quang 2')) {
    return 'PHT Thầy Ninh Đức Hiếu (Xuân Quang 2)';
  }
  return 'Hiệu trưởng Thầy Nguyễn Quốc Bảo';
}

/**
 * Kiểm tra quyền xem danh sách nhân sự (Yêu cầu 1: mỗi GV, nhân viên chỉ coi được nhân sự của chính họ)
 * - HT, PHT, GV_TIN_HOC: Xem được toàn bộ danh sách
 * - GV, NV, NV_HD_BV: Chỉ xem được hồ sơ của chính họ
 */
export function canViewAllStaffDirectory(user: UserAccount | null): boolean {
  if (!user) return false;
  return user.role === 'HT' || user.role === 'PHT' || user.role === 'GV_TIN_HOC';
}

/**
 * Kiểm tra quyền xem chi tiết hồ sơ nhân sự của một người cụ thể
 */
export function canViewStaffDetail(user: UserAccount | null, targetStaffId: string): boolean {
  if (!user) return false;
  if (canViewAllStaffDirectory(user)) return true;
  return user.id === targetStaffId;
}

/**
 * Kiểm tra quyền xem danh sách chi tiết học sinh của một lớp:
 * - GV bộ môn: KHÔNG coi được danh sách chi tiết của lớp
 * - GVCN: Chỉ coi được danh sách lớp HIỆN TẠI do mình chủ nhiệm (khớp chính xác homeroomTeacherId)
 * - GVCN cũ (đã đổi): TUYỆT ĐỐI KHÔNG xem được lớp cũ, không thao tác hoặc có quyền gì trên lớp đó
 * - HT, PHT, GV Tin học: Được coi tất cả lớp
 */
export function canViewClassStudentRoster(
  user: UserAccount | null,
  classHomeroomTeacherId?: string,
  previousHomeroomTeacherIds?: string[]
): boolean {
  if (!user) return false;
  // Ban Giám hiệu và Quản trị Tin học có quyền quản trị toàn diện
  if (user.role === 'HT' || user.role === 'PHT' || user.role === 'GV_TIN_HOC') return true;

  // Nếu là GVCN cũ của lớp này: Tuyệt đối bị tước quyền, không xem được lớp cũ
  if (previousHomeroomTeacherIds && previousHomeroomTeacherIds.includes(user.id)) {
    return false;
  }

  // Chỉ GVCN đương nhiệm (khớp mã hiện tại) mới có quyền truy cập
  return Boolean(classHomeroomTeacherId && user.id === classHomeroomTeacherId);
}

/**
 * Kiểm tra quyền chỉnh sửa danh sách học sinh của một lớp (thêm, bớt, chuyển lớp, sửa thông tin, điểm danh, nhận xét):
 * - Nếu đổi GVCN: GVCN cũ hoàn toàn mất quyền thao tác trên lớp cũ
 * - Chỉ GVCN hiện tại hoặc BGH/IT
 */
export function canEditClassStudentRoster(
  user: UserAccount | null,
  classHomeroomTeacherId?: string,
  previousHomeroomTeacherIds?: string[]
): boolean {
  return canViewClassStudentRoster(user, classHomeroomTeacherId, previousHomeroomTeacherIds);
}

/**
 * Kiểm tra quyền đổi / phân công GVCN cho giáo viên khác:
 * - Chỉ GV Tin học, PHT hoặc HT có quyền
 */
export function canAssignHomeroomTeacher(user: UserAccount | null): boolean {
  if (!user) return false;
  return user.role === 'HT' || user.role === 'PHT' || user.role === 'GV_TIN_HOC';
}

/**
 * Kiểm tra quyền truy cập 5 Trang hiển thị (Cổng thông tin phân hiệu & Biến động học sinh):
 * - Trang 1: Thông tin chung toàn trường (Tất cả tài khoản đều xem được)
 * - Trang 2: Phân hiệu TH La Hai (HT, PHT Trần Thanh Long, và ai có tài khoản tại Phân hiệu TH La Hai)
 * - Trang 3: Phân hiệu TH & THCS Xuân Long (HT, PHT Phan Hưng Tuyên, và ai có tài khoản tại Phân hiệu Xuân Long)
 * - Trang 4: Phân hiệu TH & THCS Xuân Quang 2 (HT, PHT Ninh Đức Hiếu, và ai có tài khoản tại Phân hiệu Xuân Quang 2)
 * - Trang 5: Thông tin học sinh chuyển đi, chuyển đến (Tất cả tài khoản truy cập được, dữ liệu bên trong lọc theo bảo mật)
 * - Trang 6: Đánh giá tiến độ giải quyết công việc & Khen thưởng, Nhắc nhở công khai (Tất cả tài khoản xem được)
 */
export function canAccessBranchPortal(
  user: UserAccount | null,
  portalBranchName: 'TOAN_TRUONG' | 'LA_HAI' | 'XUAN_LONG' | 'XUAN_QUANG_2' | 'TRANG_5_CHUYEN_DEN_DI' | 'STUDENT_TRANSFERS' | 'TRANG_6_TIEN_DO_CONG_VIEC'
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Vui lòng đăng nhập để truy cập cổng thông tin nội bộ.' };
  }

  // Trang 1: Toàn trường, Trang 5: Biến động HS, Trang 6: Đánh giá tiến độ công việc -> công khai cho tất cả cán bộ, GV, NV
  if (
    portalBranchName === 'TOAN_TRUONG' ||
    portalBranchName === 'TRANG_5_CHUYEN_DEN_DI' ||
    portalBranchName === 'STUDENT_TRANSFERS' ||
    portalBranchName === 'TRANG_6_TIEN_DO_CONG_VIEC'
  ) {
    return { allowed: true };
  }

  // Hiệu trưởng xem được cả 5 trang
  if (user.role === 'HT') {
    return { allowed: true };
  }

  // Quản trị hệ thống (GV Tin học) xem được để hỗ trợ kỹ thuật
  if (user.role === 'GV_TIN_HOC') {
    return { allowed: true };
  }

  const userBranch = (user.branchName || '').toLowerCase();
  const phtAssigned = getPhtAssignedBranch(user)?.toLowerCase() || '';

  if (portalBranchName === 'LA_HAI') {
    const isPhtLaHai = user.role === 'PHT' && phtAssigned.includes('la hai');
    const isBelongsToLaHai = userBranch.includes('la hai');
    if (isPhtLaHai || isBelongsToLaHai) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Trang thông tin Phân hiệu TH La Hai chỉ dành cho Hiệu trưởng, PHT Thầy Trần Thanh Long và CB-GV-NV thuộc phân hiệu TH La Hai.',
    };
  }

  if (portalBranchName === 'XUAN_LONG') {
    const isPhtXuanLong = user.role === 'PHT' && phtAssigned.includes('xuân long');
    const isBelongsToXuanLong = userBranch.includes('xuân long');
    if (isPhtXuanLong || isBelongsToXuanLong) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Trang thông tin Phân hiệu TH & THCS Xuân Long chỉ dành cho Hiệu trưởng, PHT Thầy Phan Hưng Tuyên và CB-GV-NV thuộc phân hiệu Xuân Long.',
    };
  }

  if (portalBranchName === 'XUAN_QUANG_2') {
    const isPhtXQ2 = user.role === 'PHT' && (phtAssigned.includes('xuân quang 2') || phtAssigned.includes('xuan quang 2'));
    const isBelongsToXQ2 = userBranch.includes('xuân quang 2') || userBranch.includes('xuan quang 2');
    if (isPhtXQ2 || isBelongsToXQ2) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Trang thông tin Phân hiệu TH & THCS Xuân Quang 2 chỉ dành cho Hiệu trưởng, PHT Thầy Ninh Đức Hiếu và CB-GV-NV thuộc phân hiệu Xuân Quang 2.',
    };
  }

  return { allowed: false, reason: 'Không có quyền truy cập trang này.' };
}

/**
 * Phân quyền xem thông tin học sinh chuyển đi, chuyển đến trên Trang thứ 5:
 * - Nếu chuyển đi đến trong cùng phân hiệu: chỉ có GV, CNV phân hiệu đó xem được (và HT, GV Tin học)
 * - Nếu chuyển đi, chuyển đến khác phân hiệu hoặc ra khỏi trường: cả toàn trường đều thấy
 * - Nếu HS từ trường khác chuyển đến: công khai cả phân hiệu / toàn trường thấy
 */
export function canViewTransferRecord(
  user: UserAccount | null,
  transfer: {
    transferCategory?: string;
    fromBranchName?: string;
    toBranchName?: string;
    visibilityScope?: string;
  }
): boolean {
  if (!user) return false;
  if (user.role === 'HT' || user.role === 'GV_TIN_HOC') return true;

  const category = transfer.transferCategory;

  // Chuyển trong cùng phân hiệu: chỉ GV, CNV phân hiệu đó xem được
  if (category === 'NOI_BO_CUNG_PHAN_HIEU' || (transfer.fromBranchName && transfer.toBranchName && transfer.fromBranchName === transfer.toBranchName)) {
    const targetBranch = (transfer.fromBranchName || '').toLowerCase().trim();
    const userBranch = (user.branchName || '').toLowerCase().trim();
    const phtBranch = (getPhtAssignedBranch(user) || '').toLowerCase().trim();

    if (user.role === 'PHT' && phtBranch && targetBranch.includes(phtBranch)) {
      return true;
    }
    if (userBranch && targetBranch.includes(userBranch)) {
      return true;
    }
    if (userBranch && (
      (userBranch.includes('la hai') && targetBranch.includes('la hai')) ||
      (userBranch.includes('xuân long') && targetBranch.includes('xuân long')) ||
      (userBranch.includes('xuân quang 2') && targetBranch.includes('xuân quang 2'))
    )) {
      return true;
    }
    return false;
  }

  // Khác phân hiệu, đi trường khác, hoặc từ trường khác chuyển đến -> Toàn trường đều thấy
  return true;
}

/**
 * Phân quyền phê duyệt chuyển đi, chuyển đến:
 * - Chuyển trong cùng phân hiệu: HT hoặc PHT phân hiệu đó đều được duyệt
 * - Chuyển đi khác phân hiệu: CHỈ CÓ HT ĐƯỢC DUYỆT
 * - Chuyển đi trường khác: HT hoặc PHT phân hiệu phê duyệt
 */
export function canApproveTransferRecord(
  user: UserAccount | null,
  transfer: {
    transferCategory?: string;
    fromBranchName?: string;
    toBranchName?: string;
    approverRequired?: string;
  }
): { canApprove: boolean; reason?: string } {
  if (!user) {
    return { canApprove: false, reason: 'Vui lòng đăng nhập để duyệt phiếu chuyển.' };
  }

  // Hiệu trưởng có quyền tối cao duyệt mọi phiếu chuyển
  if (user.role === 'HT' || user.role === 'GV_TIN_HOC') {
    return { canApprove: true };
  }

  const category = transfer.transferCategory;

  // Yêu cầu: "Nếu chuyển đi khác phân hiệu thì chỉ có HT được duyệt"
  if (category === 'NOI_BO_KHAC_PHAN_HIEU' || transfer.approverRequired === 'CHI_HT') {
    return {
      canApprove: false,
      reason: 'Chuyển đi khác phân hiệu: Theo quy chế, chỉ duy nhất Hiệu trưởng Thầy Nguyễn Quốc Bảo có thẩm quyền phê duyệt.',
    };
  }

  // Yêu cầu: "Nếu chuyển trong cùng phân hiệu thì HT hoặc PHT phân hiệu có học sinh chuyển đó đều được duyệt"
  if (category === 'NOI_BO_CUNG_PHAN_HIEU' || category === 'CHUYEN_DI_TRUONG_KHAC') {
    if (user.role === 'PHT') {
      const phtBranch = (getPhtAssignedBranch(user) || '').toLowerCase();
      const fromBranch = (transfer.fromBranchName || '').toLowerCase();

      const isMatch =
        (phtBranch.includes('la hai') && fromBranch.includes('la hai')) ||
        (phtBranch.includes('xuân long') && fromBranch.includes('xuân long')) ||
        (phtBranch.includes('xuân quang 2') && fromBranch.includes('xuân quang 2'));

      if (isMatch) {
        return { canApprove: true };
      } else {
        return {
          canApprove: false,
          reason: `Đơn này thuộc phân hiệu ${transfer.fromBranchName}. PHT phụ trách phân hiệu này mới có quyền duyệt.`,
        };
      }
    }
  }

  return {
    canApprove: false,
    reason: 'Chỉ Ban Giám hiệu (Hiệu trưởng / PHT phụ trách phân hiệu) mới có quyền duyệt.',
  };
}

/**
 * Phân quyền bấm nút "Nhận học sinh":
 * - Sau khi được duyệt, GVCN có học sinh chuyển đến bấm nút nhận học sinh để hệ thống chuyển thông tin học sinh đến lớp mới
 */
export function canReceiveTransferStudent(
  user: UserAccount | null,
  transfer: {
    toGvcnId?: string;
    toGvcnName?: string;
    approvalStatus?: string;
    isReceivedByTargetGvcn?: boolean;
  }
): boolean {
  if (!user) return false;
  if (transfer.isReceivedByTargetGvcn) return false;
  if (transfer.approvalStatus !== 'Đã duyệt' && transfer.approvalStatus !== 'Chờ GVCN nhận lớp') return false;

  // GVCN lớp nhận, hoặc HT, hoặc GV Tin học quản trị
  if (user.role === 'HT' || user.role === 'GV_TIN_HOC') return true;
  if (transfer.toGvcnId && user.id === transfer.toGvcnId) return true;
  if (transfer.toGvcnName && user.name === transfer.toGvcnName) return true;

  return false;
}

