/**
 * Types & Data Schema for Trường Tiểu học & THCS Đồng Xuân
 * Hiệu trưởng: Nguyễn Quốc Bảo
 */

export type Role = 'HT' | 'PHT' | 'GV_TIN_HOC' | 'GV' | 'NV' | 'NV_HD_BV' | 'PH_HS';

export type StudentPromotionStatus = 'Lên lớp' | 'Ở lại lớp' | 'Chuyển đi' | 'Chuyển đến' | 'Nghỉ học' | 'Mất';

export interface Campus {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  type: 'TRU_SO' | 'TH' | 'THCS' | 'MN_TH';
  address: string;
  studentCount: number;
  classCount: number;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  campuses: Campus[];
}

export interface UserAccount {
  id: string; // Mã đăng nhập (VD: GV001, NV005, BV002, LOP6A)
  username: string;
  name: string;
  role: Role;
  position: string; // Chức vụ: Hiệu trưởng, Phó Hiệu trưởng, GVCN, GV Bộ môn, Bảo vệ...
  email: string;
  phone: string;
  campusId: string;
  campusName: string;
  branchName: string;
  password?: string;
  isTemporaryPassword?: boolean;
  driveFolderId: string;
  sheetFileId: string;
  sheetUrl: string;
  avatar?: string;
  isHomeroomTeacher?: boolean;
  homeroomClassId?: string;
  status?: 'ACTIVE' | 'INACTIVE'; // ACTIVE (Đang công tác) | INACTIVE (Nghỉ hưu, chuyển công tác, lưu trữ)
  inactivatedDate?: string;
  inactivatedReason?: string;
}

// 52 Cột Google Sheet từ Cột A đến Cột AZ chuẩn ngành giáo dục
export interface SheetColumnDef {
  col: string; // "A", "B", ... "Z", "AA", ... "AZ"
  key: string;
  label: string;
  category: 'Hành chính' | 'Chuyên môn' | 'Chính sách - Lương' | 'Đảng - Đoàn' | 'Liên hệ' | 'Khác';
  type: 'text' | 'date' | 'number' | 'select' | 'boolean';
  options?: string[];
  required?: boolean;
  description?: string;
}

// Dữ liệu 52 cột của Nhân sự (GV, NV, Bảo vệ)
export type StaffSheetData = Record<string, string | number | boolean>;

// Lớp học & Danh sách học sinh
export interface Student {
  id: string;
  orderNumber: number;
  fullName: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  ethnicity: string;
  address: string;
  parentName: string;
  parentPhone: string;
  status: 'Đang học' | 'Chuyển đến' | 'Chuyển đi' | 'Nghỉ học' | 'Bảo lưu' | 'Thôi học' | 'Mất' | 'Ở lại lớp' | 'INACTIVE';
  policyBeneficiary: 'Không' | 'Hộ nghèo' | 'Hộ cận nghèo' | 'Khuyết tật' | 'Mồ côi';
  promotionStatus?: StudentPromotionStatus; // Lên lớp, ở lại lớp, chuyển đi, chuyển đến, nghỉ học, mất
  nextClassId?: string;
  notes?: string;
  isInactive?: boolean;
  inactivatedDate?: string;
  inactivatedReason?: string;
}

export interface SchoolClass {
  id: string; // Mã lớp (VD: LOP1A, LOP9B)
  name: string; // Tên lớp: 1A, 1B, 6A, 9A...
  grade: number; // 1, 2, 3, 4, 5, 6, 7, 8, 9
  level: 'TH' | 'THCS';
  campusId: string;
  campusName: string;
  branchName: string;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  previousHomeroomTeacherIds?: string[]; // Danh sách mã các GVCN cũ từng phụ trách lớp (dùng để kiểm soát tước quyền truy cập)
  previousHomeroomTeacherNames?: string[]; // Tên các GVCN cũ
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  ethnicStudents: number;
  poorStudents: number;
  sheetFileId: string;
  sheetUrl: string;
  roomName: string;
  students: Student[];
  sheetDataAZ: Record<string, string | number>;
  schoolYear?: string;
  status?: 'ACTIVE' | 'INACTIVE'; // Quản lý vòng đời lớp học: ACTIVE (Đang hoạt động) | INACTIVE (Ngưng hoạt động / Lưu trữ)
  inactivatedDate?: string;
  inactivatedReason?: string;
}

// Đơn xin nghỉ phép của GV / NV
export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  campusName: string;
  branchName?: string;
  leaveType: 'Nghỉ ốm' | 'Nghỉ việc riêng có lương' | 'Nghỉ việc riêng không lương' | 'Nghỉ thai sản' | 'Nghỉ đột xuất' | 'Đi công tác';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachedPlan: string; // Kế hoạch bàn giao công việc / bài dạy
  status: 'Chờ duyệt' | 'Đã phê duyệt' | 'Từ chối';
  approvedBy?: string;
  approvalDate?: string;
  approvalComment?: string;
  createdAt: string;
  isPublic: boolean;
}

// Đơn xin đổi tiết / Dạy thay / Tự dạy bù (3 chế độ chi tiết theo yêu cầu hiệu trưởng)
export interface SubstituteTeachingRequest {
  id: string;
  mode: 'DOI_TIET_VOI_GV' | 'TU_DAY_BU' | 'NHO_BGH_PHAN_CONG';
  
  // Thông tin GV A (Người xin nghỉ / đổi)
  requesterId: string;
  requesterName: string;
  branchNameA: string;
  campusNameA: string;
  classNameA: string;
  dateA: string; // ngày tháng năm nghỉ/đổi
  dayOfWeekA: string; // Thứ 2, 3, 4, 5, 6, 7
  sessionA: 'Sáng' | 'Chiều';
  periodA: string; // Tiết 1, 2, 3, 4, 5...
  subjectA: string; // Môn học
  reasonA: string; // Lý do nghỉ/đổi

  // Thông tin GV B (Nếu là mode DOI_TIET_VOI_GV)
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  branchNameB?: string;
  campusNameB?: string;
  classNameB?: string;
  dateB?: string;
  dayOfWeekB?: string;
  sessionB?: 'Sáng' | 'Chiều';
  periodB?: string;
  subjectB?: string;
  reasonB?: string; // Lý do / thỏa thuận của GV B

  // Kế hoạch tự dạy bù (Nếu là mode TU_DAY_BU)
  makeupDate?: string;
  makeupDayOfWeek?: string;
  makeupSession?: 'Sáng' | 'Chiều';
  makeupPeriod?: string;
  makeupRoom?: string;

  // Ban Giám hiệu phân công (Nếu là mode NHO_BGH_PHAN_CONG)
  bghAssignedTeacherId?: string;
  bghAssignedTeacherName?: string;

  status: 'Chờ duyệt' | 'Đã phê duyệt' | 'Từ chối';
  approvedBy?: string;
  approvalDate?: string;
  approvalComment?: string;
  createdAt: string;
  isPublic: boolean;
}

// Đơn xin nghỉ học của Học sinh (GVCN hoặc Phụ huynh gửi)
export interface StudentAbsenceRequest {
  id: string;
  studentId: string;
  studentName: string;
  branchName: string;
  campusName: string;
  classId: string;
  className: string;
  absenceDate: string; // Ngày tháng năm
  dayOfWeek: string; // Thứ 2, 3, 4, 5, 6, 7
  session: 'Sáng' | 'Chiều' | 'Cả ngày';
  periods: string; // Tiết 1, 2 hoặc Cả buổi
  reason: string;
  requestedBy: 'GVCN' | 'Phụ huynh' | 'Học sinh';
  contactPhone: string;
  status: 'Chờ PHT duyệt' | 'Đã phê duyệt' | 'Từ chối';
  approvedBy?: string; // PHT duyệt
  approvalDate?: string;
  approvalComment?: string;
  createdAt: string;
  isPublic: boolean;
}

// Báo cáo học sinh Chuyển đến / Chuyển đi
export type StudentTransferCategory =
  | 'DEN_TU_TRUONG_KHAC' // 3.1: HS từ trường ngoài chuyển đến
  | 'NOI_BO_CUNG_PHAN_HIEU' // 3.2: Chuyển lớp trong cùng phân hiệu (HT hoặc PHT phân hiệu duyệt)
  | 'NOI_BO_KHAC_PHAN_HIEU' // 3.2: Chuyển lớp khác phân hiệu (Chỉ HT duyệt)
  | 'CHUYEN_DI_TRUONG_KHAC'; // 3.3: HS chuyển đi trường khác (HT hoặc PHT phân hiệu duyệt)

export interface StudentTransferReport {
  id: string;
  type: 'CHUYEN_DEN' | 'CHUYEN_DI';
  transferCategory?: StudentTransferCategory;
  studentId?: string;
  studentName: string;
  gender?: 'Nam' | 'Nữ';
  dob?: string;

  // Nơi chuyển đi (Source)
  fromBranchName?: string;
  fromCampusName?: string;
  fromClassId?: string;
  fromClassName?: string;
  fromGvcnId?: string;
  fromGvcnName?: string;

  // Nơi chuyển đến (Destination)
  toBranchName?: string;
  toCampusName?: string;
  toClassId?: string;
  toClassName?: string;
  toGvcnId?: string;
  toGvcnName?: string;

  // Thông tin trường ngoài (nếu chuyển đi hoặc chuyển đến trường khác)
  transferSchool?: string;
  provinceCity?: string;

  reason: string;
  decisionNumber?: string;
  effectiveDate: string;

  // Phê duyệt
  approvalStatus?: 'Chờ duyệt' | 'Đã duyệt' | 'Chờ GVCN nhận lớp' | 'Đã tiếp nhận' | 'Từ chối' | 'Đã hoàn tất hồ sơ';
  approverRequired?: 'HT_HOAC_PHT' | 'CHI_HT';
  approvedBy?: string;
  approvedRole?: string;
  approvalDate?: string;
  rejectionReason?: string;

  // Bước nhận học sinh của GVCN lớp nhận (sau khi duyệt)
  isReceivedByTargetGvcn?: boolean;
  receivedDate?: string;
  receivedByGvcnName?: string;

  // Phân quyền xem trên Trang 5:
  // Cùng phân hiệu: chỉ GV, CNV phân hiệu đó xem được
  // Khác phân hiệu hoặc ra khỏi trường hoặc từ ngoài vào: cả toàn trường xem được
  visibilityScope?: 'NOI_BO_PHAN_HIEU' | 'TOAN_TRUONG';

  // Legacy compatibility fields
  classId: string;
  className: string;
  campusName: string;
  gvcnId: string;
  gvcnName: string;
  status?: 'Đã hoàn tất hồ sơ' | 'Đang xử lý hồ sơ' | 'Chờ duyệt Ban giám hiệu' | 'Chờ GVCN nhận lớp';
  createdAt: string;
}

// Vật tư mua sắm sửa chữa CSVC
export interface PurchasedMaterialItem {
  id: string;
  name: string; // Tên vật tư (dây điện Cadivi, bóng led 1m2, ổ khóa Việt Tiệp, tấm tôn Hoa Sen...)
  quantity: number;
  unit: string; // Cái, Cuộn, Bộ, Mét, Tấm, Bao...
  unitPrice: number; // Đơn giá (VNĐ)
  totalAmount: number; // Thành tiền (VNĐ)
  notes?: string;
}

// Đề xuất sửa chữa Cơ sở vật chất & Thiết bị
export interface FacilityRepairProposal {
  id: string;
  title: string;
  campusId: string;
  campusName: string;
  location: string; // Phòng học số 3, Nhà vệ sinh phân hiệu Triêm Đức, Mái tôn thư viện...
  category: 'Điện & Quạt mát' | 'Bàn ghế học sinh' | 'Hệ thống Nước & Vệ sinh' | 'Cửa & Mái tôn' | 'Thiết bị Tin học & Tivi' | 'Khác';
  urgency: 'Bình thường' | 'Cần gấp' | 'Khẩn cấp';
  description: string;
  estimatedCost: number; // Dự toán VND
  proposerId: string;
  proposerName: string;
  proposerRole: string;
  createdAt: string;

  // Ảnh hiện trạng & Giấy đề xuất (từ máy tính, điện thoại hoặc camera) lưu trên Google Drive
  initialPhotos?: string[]; // Danh sách base64 hoặc Drive link
  driveFolderId?: string; // Thư mục Drive riêng của đề xuất này
  driveFolderUrl?: string; // Link thư mục Google Drive riêng
  driveSheetUrl?: string; // Link file Google Sheet riêng quản lý CSVC

  // Giai đoạn HT phê duyệt & Phân công
  approvalStatus: 'Chờ HT duyệt' | 'Đã duyệt' | 'Không duyệt';
  approvedBudget?: number;
  htComment?: string;
  approvalDate?: string;

  // Giai đoạn Phân công thực hiện (giao GV, NV, Bảo vệ)
  assignedPersonId?: string;
  assignedPersonName?: string;
  assignedPersonRole?: string;
  assignedDeadline?: string;

  // Giai đoạn Báo cáo kết quả (Người thực hiện viết báo cáo gửi mỗi HT biết)
  executionStatus: 'Chưa thực hiện' | 'Đang sửa chữa' | 'Đã hoàn thành' | 'Nghiệm thu đạt';
  completionReport?: string; // Nội dung đã thực hiện
  completionDate?: string;
  actualCost?: number; // Tổng số tiền thực tế (vật tư đã mua sắm)
  purchasedMaterials?: PurchasedMaterialItem[]; // Bảng chi tiết vật tư đã mua sắm
  completionPhotos?: string[]; // Ảnh sau sửa chữa, hóa đơn mua vật tư, giấy xác nhận
  isConfidentialForHt?: boolean; // Báo cáo kết quả & số tiền chỉ mỗi HT biết
  htAcceptanceComment?: string; // Nhận xét nghiệm thu của HT
  htAcceptanceDate?: string;
}

// Biến động nhân sự: Chuyển đến, chuyển đi, điều chuyển nội bộ
export interface StaffTransferRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  transferType: 'CHUYEN_DEN' | 'CHUYEN_DI' | 'DIEU_DONG_NOI_BO';
  fromDate: string;
  fromLocation: string;
  toLocation: string;
  decisionNo: string;
  signedBy: string;
  notes: string;
  createdAt: string;
}

// Thời khóa biểu & Thời gian biểu
export interface BellSchedule {
  branchId: string;
  branchName: string;
  shift: 'Sáng' | 'Chiều';
  periods: {
    period: number;
    timeRange: string;
    description: string;
  }[];
}

export interface TimetableSlot {
  id: string;
  campusId: string;
  campusName: string;
  branchName?: string;
  classId: string;
  className: string;
  session?: 'Sáng' | 'Chiều'; // Buổi sáng hoặc chiều
  dayOfWeek: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7';
  period: number; // 1, 2, 3, 4, 5
  subject: string;
  teacherId: string;
  teacherName: string;
  room: string;
  // Các trường theo dõi thời khóa biểu gốc vs cập nhật (đổi tiết, nghỉ tiết, dạy bù)
  isOriginal?: boolean; // Thuộc TKB gốc của trường
  isModified?: boolean; // Đã đổi tiết / có thay đổi
  modificationType?: 'Đổi tiết' | 'Dạy thay' | 'Nghỉ tiết' | 'Dạy bù' | 'Chưa duyệt';
  originalTeacherName?: string; // Tên giáo viên dạy gốc
  originalSubject?: string;
  substituteTeacherName?: string; // Giáo viên nhận dạy thay
  modificationReason?: string; // Lý do đổi tiết / nghỉ
  updatedAt?: string;
}

// ==========================================
// PHÂN HỆ THI ĐUA KHEN THƯỞNG & ĐÁNH GIÁ GV
// ==========================================

// Sự việc đánh giá / ghi nhận thi đua sau mỗi vụ việc
export interface TeacherEvaluationEvent {
  id: string;
  schoolYear: string; // VD: 2026-2027
  teacherId: string;
  teacherName: string;
  teacherPosition: string;
  campusName: string;
  branchName: string;
  date: string; // Ngày xảy ra sự việc (YYYY-MM-DD)
  eventType: 'KHEN_THUONG' | 'NHAC_NHO'; // Khen thưởng / tuyên dương (+) hoặc Nhắc nhở / phê bình (-)
  category:
    | 'Chuyên môn & Giảng dạy'
    | 'Bồi dưỡng Học sinh giỏi'
    | 'Hội giảng & Giáo viên dạy giỏi'
    | 'Công tác Chủ nhiệm'
    | 'Đoàn Đội & Phong trào'
    | 'Chuyển đổi số & Hồ sơ sổ sách'
    | 'Đạo đức nhà giáo & Tác phong'
    | 'Cơ sở vật chất & Lao động'
    | 'Nhiệm vụ đột xuất khác';
  title: string; // Tiêu đề sự việc
  description: string; // Mô tả chi tiết nội dung sự việc
  points: number; // Điểm cộng (+) hoặc điểm trừ (-) từ -10 đến +10
  ratingLevel: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Cần khắc phục';
  evidencePhotos?: string[]; // Danh sách ảnh chụp / file minh chứng tải lên
  driveFolderUrl?: string; // Link lưu trữ minh chứng trên Drive
  evaluatedBy: string; // Người đánh giá: Thầy Nguyễn Quốc Bảo (HT) / BGH
  notes?: string;
  createdAt: string;
}

// Danh mục Danh hiệu thi đua hàng năm
export interface EmulationTitle {
  id: string;
  name: string; // Tên danh hiệu (Chiến sĩ thi đua cơ sở, Lao động tiên tiến...)
  type: 'CA_NHAN' | 'TAP_THE';
  level: 'Cấp Trường' | 'Cấp Huyện/Xã' | 'Cấp Tỉnh' | 'Cấp Bộ' | 'Cấp Nhà Nước';
  criteria: string; // Tiêu chuẩn đạt được
  quotaPercentage?: number; // Tỷ lệ khống chế (VD: Chiến sĩ thi đua cơ sở tối đa 15% Lao động tiên tiến)
  rewardAmount?: number; // Tiền thưởng định mức kèm theo (VNĐ)
}

// Quyết định công nhận danh hiệu thi đua hàng năm
export interface AnnualEmulationAward {
  id: string;
  schoolYear: string; // Năm học: 2026-2027
  teacherId: string;
  teacherName: string;
  position: string;
  campusName: string;
  branchName: string;
  titleId: string;
  titleName: string; // Tên danh hiệu đạt được
  totalPoints: number; // Tổng điểm thi đua tích lũy trong năm
  commendationCount: number; // Số lần khen thưởng trong năm
  warningCount: number; // Số lần nhắc nhở
  decisionNumber: string; // Số quyết định khen thưởng (VD: QĐ-158/QĐ-UBND hoặc QĐ-BGH)
  decisionDate: string;
  signedBy: string;
  certificateUrl?: string; // Link giấy khen / bằng khen
  rewardAmount?: number;
}

// ==========================================
// NHẮC NHỞ CÔNG KHAI & KHEN THƯỞNG CÓ MINH CHỨNG
// ==========================================

export interface PublicReminder {
  id: string;
  targetType: 'GV' | 'HS' | 'TOAN_TRUONG' | 'NV';
  targetId?: string;
  targetName: string;
  className?: string;
  branchName: string;
  campusName: string;
  reason: 'Tự ý đổi tiết' | 'Bỏ tiết không phép' | 'Đi muộn / vi phạm giờ giấc' | 'Vi phạm nề nếp' | 'Chậm nộp giáo án / điểm' | 'Chậm tiến độ nhiệm vụ' | 'Khác';
  title: string;
  content: string;
  week: number;
  month: number;
  year: number;
  date: string;
  evidenceFiles: { name: string; url: string; type: string }[];
  remindedBy: string; // HT Nguyễn Quốc Bảo hoặc PHT
  status: 'Công khai' | 'Đã nhắc nhở' | 'Đã khắc phục';
  resolutionNotes?: string;
  // Scope and Private Delivery
  scope?: 'PRIVATE' | 'CAMPUS' | 'SCHOOL'; // Riêng cá nhân | Theo phân hiệu | Toàn trường
  targetUserId?: string; // Tài khoản đích nếu là tin riêng (chỉ HT và người nhận xem được)
  isRead?: boolean; // Trạng thái đã đọc
  readAt?: string;
  sourceAssignmentId?: string; // Liên kết nguồn gốc nhiệm vụ được giao
  displayExpiry?: string; // Hạn hiển thị
}

export interface PublicCommendation {
  id: string;
  targetType: 'GV' | 'NV' | 'HS' | 'TAP_THE';
  targetId?: string;
  targetName: string;
  className?: string;
  branchName: string;
  campusName: string;
  title: string;
  description: string;
  rewardType: 'Khen thưởng chuyên môn' | 'Học sinh giỏi' | 'Hội giảng / Hội thi' | 'Gương người tốt việc tốt' | 'Đoàn Đội' | 'Đúng tiến độ nhiệm vụ' | 'Khác';
  rewardLevel: 'Cấp Phân hiệu' | 'Cấp Toàn trường' | 'Cấp Huyện' | 'Cấp Tỉnh';
  week: number;
  month: number;
  year: number;
  date: string;
  points?: number;
  rewardAmount?: number;
  evidenceFiles: { name: string; url: string; type: string }[];
  awardedBy: string;
  // Scope and Private Delivery
  scope?: 'PRIVATE' | 'CAMPUS' | 'SCHOOL'; // Riêng cá nhân | Theo phân hiệu | Toàn trường
  targetUserId?: string; // Tài khoản đích nếu là tin riêng (chỉ HT và người nhận xem được)
  isRead?: boolean;
  readAt?: string;
  sourceAssignmentId?: string; // Liên kết nguồn gốc nhiệm vụ được giao
  displayExpiry?: string;
}

// ==========================================
// SỔ THEO DÕI THI ĐUA ĐIỆN TỬ 4 TẦNG & GIAO VIỆC
// ==========================================

export type StaffTierCategory = 'GV_TH' | 'GV_THCS' | 'NHAN_VIEN';

export interface AssignedTask {
  id: string;
  schoolYear: string;
  assignerId: string; // HT Nguyễn Quốc Bảo hoặc PHT phân hiệu
  assignerName: string;
  assignerRole: 'HT' | 'PHT';
  targetStaffId: string; // GV hoặc NV nhận việc
  targetStaffName: string;
  targetStaffRole: 'GV' | 'GVCN' | 'NV' | 'BGH' | 'GV_TIN_HOC' | 'NV_HD_BV';
  targetStaffCategory: StaffTierCategory; // 4 Tầng: GV TH, GV THCS, Nhân viên
  targetBranchName: string;
  targetCampusName: string;
  
  // Tiêu chí thi đua & nội dung
  competitionCriteria: string; // Tiêu chí thi đua liên kết
  taskTitle: string; // Tiêu đề nhiệm vụ
  taskDescription: string; // Mô tả yêu cầu chi tiết
  deadline: string; // Hạn hoàn thành
  priority: 'KHAN_CAP' | 'CAO' | 'BINH_THUONG';
  
  // Tiến độ & Báo cáo kết quả của GV/NV
  executionStatus: 'CHUA_THUC_HIEN' | 'DANG_THUC_HIEN' | 'CHO_XAC_NHAN' | 'HOAN_THANH' | 'BI_TRA_LAI' | 'QUA_HAN';
  submissionDate?: string;
  submissionNotes?: string;
  evidenceFiles?: { name: string; url: string; type: string }[];
  driveUrl?: string; // Link Google Drive minh chứng
  isCompletedOnTime?: boolean; // Đúng hạn theo tuần/tháng
  
  // Xác nhận & Chấm điểm của HT / PHT
  evaluatedBy?: string; // Người duyệt
  evaluatedDate?: string;
  score?: number; // Điểm 0 - 10
  maxScore?: number; // 10
  evaluationFeedback?: string; // Nhận xét của người quản lý
  evaluationStatus?: 'CHUA_DANH_GIA' | 'DAT' | 'KHONG_DAT' | 'XUAT_SAC';
  
  // Đề xuất cảnh báo / khen thưởng tự động từ AI Rules
  warningSent?: boolean;
  commendationSent?: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface AnnualCompetitionEvaluationRecord {
  id: string;
  schoolYear: string;
  staffId: string;
  staffName: string;
  staffCategory: StaffTierCategory;
  branchName: string;
  totalTasks: number;
  confirmedTasks: number;
  totalScore: number;
  maxScore: number;
  completionRate: number; // Tỷ lệ hoàn thành %
  managerAssessment: string; // Đánh giá của người phụ trách
  yearEndConclusion: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';
  recommendedTitle?: string; // Chiến sĩ thi đua cơ sở, Lao động tiên tiến...
  status: 'DRAFT' | 'APPROVED' | 'LOCKED';
  lockedBy?: string;
  lockedAt?: string;
  notes?: string;
}

export interface CompetitionCouncilMinutes {
  id: string;
  schoolYear: string;
  meetingDate: string;
  presidentName: string; // Chủ tịch Hội đồng: Thầy Nguyễn Quốc Bảo (HT)
  secretaryName: string; // Thư ký Hội đồng
  councilMembers: string[]; // Thành phần Hội đồng
  contentAndConclusions: string; // Nội dung / Kết luận
  status: 'DRAFT' | 'LOCKED';
  notes?: string;
  createdAt: string;
}

export interface CompetitionAuditLogEntry {
  id: string;
  schoolYear: string;
  action: string;
  performedBy: string;
  performedRole: string;
  targetEntity: string;
  details: string;
  timestamp: string;
}

export interface WorkProgressEvaluation {
  id: string;
  schoolYear: string;
  periodType: 'TUAN' | 'THANG';
  periodValue: number; // Tuần số mấy hoặc tháng mấy
  staffId: string;
  staffName: string;
  staffCategory: StaffTierCategory;
  branchName: string;
  totalTasksInPeriod: number;
  completedOnTimeTasks: number;
  overdueTasks: number;
  progressStatus: 'DUNG_TIEN_DO' | 'CHAM_TIEN_DO' | 'XUAT_SAC';
  feedbackType: 'KHEN' | 'NHAC_NHO' | 'BINH_THUONG';
  feedbackContent: string;
  isPublicOnPage6: boolean;
  evaluatedBy: string;
  evaluatedAt: string;
}

export interface StaffBirthdayItem {
  id: string;
  staffId: string;
  staffName: string;
  position: string;
  branchName: string;
  campusName: string;
  dob: string;
  birthMonth: number;
  birthDay: number;
  phone: string;
  wishesSent?: boolean;
  wishMessage?: string;
}

// ==========================================
// SỔ ĐIỂM ĐIỆN TỬ & ĐÁNH GIÁ HỌC SINH (TH & THCS)
// ==========================================

export interface PrimaryGradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  subject: string;
  semester: 'Học kỳ 1' | 'Học kỳ 2' | 'Cả năm';
  midTermAssessment?: 'T' | 'H' | 'C'; // Hoàn thành tốt, Hoàn thành, Chưa hoàn thành
  endTermAssessment?: 'T' | 'H' | 'C';
  endTermScore?: number; // Điểm kiểm tra định kỳ (Toán, Tiếng Việt...)
  competence: 'T' | 'Đ' | 'C'; // Năng lực cốt lõi: Tốt, Đạt, Cần cố gắng
  quality: 'T' | 'Đ' | 'C'; // Phẩm chất chủ yếu: Tốt, Đạt, Cần cố gắng
  teacherComment: string;
  emailNotified?: boolean;
  notifiedAt?: string;
}

export interface SecondaryGradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  subject: string;
  semester: 'Học kỳ 1' | 'Học kỳ 2' | 'Cả năm';
  regularScores: number[]; // Điểm đánh giá thường xuyên (hệ số 1)
  midTermScore?: number; // Điểm kiểm tra giữa kỳ (hệ số 2)
  finalScore?: number; // Điểm kiểm tra cuối kỳ (hệ số 3)
  averageScore?: number; // Điểm trung bình môn
  conduct: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt'; // Rèn luyện
  academicPerformance: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt'; // Học lực
  teacherComment: string;
  emailNotified?: boolean;
  notifiedAt?: string;
}

// ==========================================
// QUẢN LÝ CHUYÊN CẦN & ĐIỂM DANH HÀNG NGÀY
// ==========================================

export interface DailyAttendanceSession {
  id: string;
  classId: string;
  className: string;
  branchName: string;
  campusName: string;
  date: string;
  session: 'Sáng' | 'Chiều';
  totalStudents: number;
  presentCount: number;
  absentWithPermission: number;
  absentWithoutPermission: number;
  absentDetails: {
    studentId: string;
    studentName: string;
    reason: string;
    hasPermission: boolean;
    parentContacted: boolean;
    parentPhone: string;
  }[];
  gvcnId: string;
  gvcnName: string;
  approvalStatus: 'Chờ PHT duyệt' | 'PHT đã duyệt' | 'Từ chối';
  approvedBy?: string;
  approvalDate?: string;
  isPublicOnBranchPortal: boolean;
}

// ==========================================
// PHÂN HỆ TÀI CHÍNH & HỌC PHÍ / CÔNG NỢ
// ==========================================

export interface FeeCategory {
  id: string;
  name: string;
  amount: number;
  period: 'Hàng tháng' | 'Học kỳ' | 'Cả năm' | 'Một lần';
  levelTarget: 'Tất cả' | 'TH' | 'THCS';
  description: string;
}

export interface StudentFeePayment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  branchName: string;
  feeCategoryId: string;
  feeCategoryName: string;
  amountDue: number;
  amountPaid: number;
  remainingDebt: number;
  status: 'Đã nộp đủ' | 'Nộp một phần' | 'Chưa nộp';
  paymentDate?: string;
  receiptNumber?: string;
  collectedBy?: string;
  notes?: string;
}

// ==========================================
// PHÂN HỆ Y TẾ HỌC ĐƯỜNG (TH & THCS)
// ==========================================

export interface StudentHealthRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  branchName: string;
  campusName: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  nutritionStatus: 'Bình thường' | 'Suy dinh dưỡng' | 'Thừa cân' | 'Béo phì';
  visionLeft: string; // VD: 10/10, 8/10
  visionRight: string;
  dentalHealth: 'Bình thường' | 'Sâu răng' | 'Viêm lợi';
  spineHealth: 'Bình thường' | 'Gù vẹo cột sống';
  healthClassification: 'Loại I' | 'Loại II' | 'Loại III';
  examDate: string;
  doctorNotes: string;
}

export interface StudentVaccinationItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  vaccineName: string;
  doseNumber: number;
  scheduledDate: string;
  administeredDate?: string;
  status: 'Đã tiêm' | 'Chưa tiêm' | 'Hoãn tiêm';
  notes?: string;
}

export interface MedicalSupplyItem {
  id: string;
  campusId: string;
  campusName: string;
  name: string;
  category: 'Thuốc hạ sốt - giảm đau' | 'Sát trùng & Băng bó' | 'Tiêu hóa - bù nước' | 'Dụng cụ y tế';
  unit: string;
  quantityInStock: number;
  minSafeQuantity: number;
  expiryDate: string;
  isExpired: boolean;
  lastUpdated: string;
}

// ==========================================
// PHÂN HỆ QUẢN LÝ SỔ SÁCH & CÔNG VĂN (BỘ NỘI VỤ - NGHỊ ĐỊNH 30/2020/NĐ-CP)
// ==========================================

export type OfficialDocumentType =
  | 'Quyết định'
  | 'Kế hoạch'
  | 'Thông báo'
  | 'Báo cáo'
  | 'Công văn'
  | 'Tờ trình'
  | 'Hướng dẫn'
  | 'Biên bản'
  | 'Công điện'
  | 'Nghị quyết';

export type DispatchUrgencyLevel = 'Thường' | 'Khẩn' | 'Thượng khẩn' | 'Hỏa tốc';
export type DispatchSecurityLevel = 'Thường' | 'Mật' | 'Tuyệt mật';

// Sổ công văn đi (Văn bản đi theo Nghị định 30/2020/NĐ-CP)
export interface OfficialDispatchOut {
  id: string;
  bookId?: string; // Khóa liên kết với Sổ văn bản đi
  sequenceNumber: number; // Số thứ tự văn bản đi (tự động tăng: 1, 2, 3...)
  documentCode: string; // Số và ký hiệu văn bản đi (ví dụ: "01/QĐ-TH&THCSĐX", "02/KH-TH&THCSĐX")
  documentType: OfficialDocumentType; // Tên loại văn bản
  subject: string; // Trích yếu nội dung văn bản
  issuedDate: string; // Ngày tháng năm ban hành (tự động ghi nhận ngày tháng hiện tại)
  signerName: string; // Người ký (Hiệu trưởng Nguyễn Quốc Bảo / PHT...)
  signerPosition: string; // Chức vụ người ký
  draftingDepartment: string; // Đơn vị / Bộ phận soạn thảo
  recipient: string; // Nơi nhận văn bản
  numberOfCopies: number; // Số lượng bản phát hành
  urgency: DispatchUrgencyLevel; // Độ khẩn
  security: DispatchSecurityLevel; // Độ mật
  schoolYear: string; // Năm học
  branchName?: string; // Gắn với Trụ sở chính hoặc Phân hiệu
  attachedFiles?: { name: string; url: string; size?: string; type?: string }[]; // Tệp đính kèm / scan
  status: 'Đã phát hành' | 'Đang xử lý' | 'Đã lưu trữ văn thư';
  notes?: string;
  createdAt: string;
}

// Sổ công văn đến (Văn bản đến theo Nghị định 30/2020/NĐ-CP)
export interface OfficialDispatchIn {
  id: string;
  bookId?: string; // Khóa liên kết với Sổ văn bản
  arrivalNumber: number; // Số đến (số thứ tự ghi vào sổ đến)
  arrivalDate: string; // Ngày đến (ngày vào sổ, tự động ghi nhận ngày hiện tại)
  originalCode: string; // Số và ký hiệu văn bản đến (do cơ quan gửi ban hành)
  issuedDate: string; // Ngày ban hành ghi trên văn bản đến
  issuingAuthority: string; // Tên cơ quan, tổ chức ban hành văn bản
  documentType: OfficialDocumentType; // Tên loại văn bản
  subject: string; // Trích yếu nội dung văn bản
  recipientPerson?: string; // Người nhận / người được phân công xử lý
  assignedToDepartment?: string; // Đơn vị/bộ phận nhận xử lý (BGH, Tổ TH, Tổ THCS, Văn phòng...)
  leaderInstruction?: string; // Ý kiến chỉ đạo / Bút phê của Hiệu trưởng
  urgency: DispatchUrgencyLevel; // Độ khẩn
  security: DispatchSecurityLevel; // Độ mật
  deadline?: string; // Hạn xử lý / báo cáo
  processingStatus: 'Chưa xử lý' | 'Đang xử lý' | 'Đã hoàn thành' | 'Lưu theo dõi';
  schoolYear: string;
  attachedFiles?: { name: string; url: string; size?: string; type?: string }[];
  notes?: string;
  createdAt: string;
}

// Sổ văn bản (Danh mục Sổ công văn đi & Sổ công văn đến)
export interface OfficialDispatchBook {
  id: string;
  bookType: 'Đến' | 'Đi'; // Loại sổ (Đến / Đi)
  bookName: string; // Tên sổ
  storageDepartment: string; // Đơn vị lưu trữ
  appliedYear: string; // Năm áp dụng (Ví dụ: 2026-2027)
  openedDate?: string; // Ngày mở sổ
  closedDate?: string; // Ngày khóa sổ
  currentCount?: number; // Số lượng văn bản hiện tại trong sổ
  status?: 'Đang sử dụng' | 'Đã khóa sổ' | 'Đã lưu kho';
  notes?: string;
  createdAt: string;
}

// ==========================================
// HỒ SƠ PHÁT TRIỂN CÁ NHÂN HỌC SINH (YÊU CẦU 2)
// ==========================================
export interface StudentPersonalGrowthProfile {
  studentId: string;
  studentName: string;
  classId: string;
  academicTrend: {
    term: string; // HK1 2025-2026, HK2 2025-2026, HK1 2026-2027...
    averageScore: number;
    performance: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
    strengths: string;
    weaknesses: string;
    evaluatedDate: string;
  }[];
  conductTrend: {
    term: string;
    rating: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
    disciplineNotes: string;
    rewards: string[];
    evaluatedDate: string;
  }[];
  physicalGrowth: {
    checkDate: string;
    heightCm: number;
    weightKg: number;
    bmi: number;
    vision: string;
    physicalNotes: string;
  }[];
  behavioralNotes: {
    id: string;
    date: string;
    authorName: string;
    authorRole: string;
    category: 'Hành vi nề nếp' | 'Tâm lý giao tiếp' | 'Năng khiếu đặc biệt' | 'Cần trợ giúp đặc biệt';
    note: string;
  }[];
}

// ==========================================
// HỆ THỐNG PHÂN QUYỀN ĐỘNG CHO GVCN (YÊU CẦU 2)
// ==========================================
export interface GvcnDynamicPermission {
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  canEnterGrades: boolean; // Nhập điểm sổ điểm điện tử
  canWriteReportCard: boolean; // Nhận xét học bạ
  canApproveStudentLeaves: boolean; // Duyệt đơn nghỉ phép của học sinh
  directParentAppConnected: boolean; // Kết nối app phụ huynh / Zalo SMS
  lastUpdated: string;
  updatedBy: string;
}

// ==========================================
// BẢO LƯU & THÔI HỌC - HỒ SƠ LƯU TRỮ ĐIỆN TỬ (YÊU CẦU 3)
// ==========================================
export interface StudentPreservationDropoutRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  branchName: string;
  campusName: string;
  type: 'BAO_LUU' | 'THOI_HOC' | 'TAM_DUNG';
  reason: string;
  effectiveDate: string;
  durationMonths?: number;
  decisionNumber: string;
  handOverElectronicDossier: boolean; // Bàn giao hồ sơ lưu trữ điện tử
  dossierStorageCode: string; // Mã lưu trữ hồ sơ điện tử (VD: DX-LT-2026-089)
  dossierItems: string[]; // ['Học bạ gốc', 'Giấy khai sinh', 'Sổ tiêm chủng y tế', 'Quyết định bàn giao']
  signedBy: string;
  approvedAt: string;
  status: 'Đã hoàn tất lưu trữ' | 'Đang xử lý hồ sơ' | 'Đã phục hồi đi học lại';
  notes?: string;
  createdAt: string;
}

// ==========================================
// CẢNH BÁO THÔNG MINH (AI / RULES ENGINE) (YÊU CẦU 4)
// ==========================================
export interface SmartAlertItem {
  id: string;
  category: 'SO_SACH_CHUA_HOAN_THANH' | 'LOP_VUOT_SI_SO' | 'NGUY_CO_BO_HOC' | 'SUT_GIAM_HOC_TAP';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  targetEntity: string; // Tên GV, Tên Lớp, hoặc Tên Học Sinh
  targetId?: string;
  suggestedAction: string;
  detectedAt: string;
  status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
  type?: 'TEACHER_RECORD_INCOMPLETE' | 'CLASS_OVER_CAPACITY' | 'STUDENT_DROPOUT_RISK' | 'STUDENT_GRADE_DROP';
  entityName?: string;
  entityId?: string;
  branchName?: string;
  campusName?: string;
  dateCreated?: string;
  recommendedAction?: string;
  isResolved?: boolean;
}

// ==========================================
// GỢI Ý GIÁO VIÊN DẠY THAY TỰ ĐỘNG THEO LỊCH TRỐNG (YÊU CẦU 1)
// ==========================================
export interface EmergencySubstituteSuggestion {
  teacherId: string;
  teacherName: string;
  subject: string;
  branchName: string;
  campusName: string;
  phone: string;
  currentWeeklyPeriods: number; // Số tiết đã xếp tuần này
  isFreeInPeriod: boolean; // Trống tiết trong buổi/tiết này
  matchScore: number; // 0 - 100%
  matchReasons: string[]; // ['Trống tiết 2 Thứ 3', 'Cùng bộ môn Toán', 'Cùng Phân hiệu Triêm Đức']
}

// ==========================================
// LỊCH SỬ BIẾN ĐỘNG SĨ SỐ (YÊU CẦU 3)
// ==========================================
export interface EnrollmentHistoryStat {
  schoolYear: string;
  term: 'Đầu năm' | 'Học kỳ 1' | 'Học kỳ 2' | 'Cuối năm';
  classId: string;
  className: string;
  grade: number;
  branchName: string;
  campusName: string;
  initialCount: number;
  transferredIn: number;
  transferredOut: number;
  droppedOut: number;
  preservedCount: number;
  currentCount: number;
  maxCapacityQuota: number; // 35 đối với TH, 45 đối với THCS
  isOverCapacity: boolean;
}

// ==========================================
// SỰ KIỆN NHÀ TRƯỜNG & LỊCH CÔNG TÁC (YÊU CẦU 2)
// ==========================================
export interface SchoolEventItem {
  id: string;
  schoolYear: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  time?: string; // Ví dụ: "07:30 - 11:30"
  location: string;
  category: 'CHUYEN_MON' | 'HOI_NGHI' | 'PHONG_TRAO' | 'KIEM_TRA' | 'Y_TE_DOAN_THE';
  categoryLabel: string;
  targetAudience: string;
  organizer: string;
  description: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  isImportant?: boolean;
}

// ==========================================
// HÒM THƯ GÓP Ý & PHẢN ÁNH KIẾN NGHỊ (YÊU CẦU 4.1 & 4.2)
// Quy trình: GV/NV/PHHS/HS gửi -> Chỉ HT xem -> HT tự xử lý HOẶC chuyển PHT/GV/NV trả lời -> Chuyển HT duyệt -> HT tự xử lý HOẶC Công khai
// ==========================================
export type FeedbackSenderType = 'GV' | 'NV' | 'PHHS' | 'HS';

export type FeedbackStatus = 
  | 'CHO_HT_XEM'        // Mới gửi, chỉ duy nhất HT được xem
  | 'HT_TU_XU_LY'       // HT kết thúc để tự xử lý trực tiếp nội bộ
  | 'DA_CHUYEN_XU_LY'   // HT chuyển đến PHT, GV hoặc NV trả lời
  | 'CHO_HT_DUYET'      // Cán bộ được giao đã trả lời, gửi về HT phê duyệt
  | 'HT_DA_DUYET_NOI_BO'// HT duyệt xong và kết thúc tự xử lý
  | 'CONG_KHAI';        // HT duyệt và công khai câu trả lời cho toàn trường xem

export interface SchoolFeedbackItem {
  id: string;
  schoolYear: string;
  senderType: FeedbackSenderType;
  senderName: string;
  senderContact?: string; // SĐT hoặc Email
  senderAffiliation?: string; // Lớp con học, phân hiệu, hoặc tổ chuyên môn
  isAnonymous?: boolean;
  category: 'CHUYEN_MON' | 'CO_SO_VAT_CHAT' | 'NE_NEP_HOC_SINH' | 'VE_SINH_AN_TOAN' | 'THU_CHI_TAI_CHINH' | 'KHAC';
  categoryLabel: string;
  title: string;
  content: string;
  attachments?: Array<{ name: string; url?: string; size?: string }>;
  createdAt: string; // ISO date string
  
  // Trạng thái xử lý
  status: FeedbackStatus;
  
  // Chuyển giao nhiệm vụ trả lời
  assignedToId?: string;
  assignedToName?: string;
  assignedToRole?: Role;
  assignedNote?: string; // Chỉ đạo/dặn dò của HT
  assignedAt?: string;
  
  // Nội dung trả lời do người được giao soạn thảo
  draftResponse?: string;
  draftedByName?: string;
  draftedById?: string;
  draftedAt?: string;
  
  // Phê duyệt & quyết định của Hiệu trưởng
  principalApprovalNote?: string; // Bút phê của HT
  principalApprovedAt?: string;
  approvedByName?: string;
  
  // Trạng thái công khai
  isPublic: boolean;
  publicDate?: string;
  resolutionSummary?: string;
}

// ==========================================
// CHUYÊN MÔN CẤP TIỂU HỌC & THCS (YÊU CẦU 4.3 & 4.4)
// Chèn hình, file, thời khóa biểu, mảng Google Sheet, tương tác Zalo
// ==========================================
export type AcademicLevel = 'TIEU_HOC' | 'THCS';

export interface AcademicPost {
  id: string;
  schoolYear: string;
  level: AcademicLevel;
  grade?: number; // Lớp 1-5 hoặc Lớp 6-9
  subject?: string; // Toán, Tiếng Việt, KHTN...
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  authorPosition: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  
  // File & Hình ảnh
  images?: string[]; // URL / Data URI hình ảnh
  attachments?: Array<{ name: string; url?: string; type: string; size?: string }>;
  
  // Thời khóa biểu nhúng
  timetableSnippet?: {
    className: string;
    branchName: string;
    dayOfWeek: string;
    periods: Array<{ periodNumber: number; subject: string; teacher: string }>;
  };
  
  // Mảng Google Sheets để điền nội dung trực tiếp
  sheetData?: {
    sheetTitle: string;
    headers: string[];
    rows: Array<Record<string, string>>;
    editableBy: 'ALL_TEACHERS' | 'LEADERS_ONLY';
    lastEditedBy?: string;
    lastEditedAt?: string;
  };
}

export interface ZaloChatMessage {
  id: string;
  schoolYear: string;
  level: AcademicLevel;
  postId?: string; // Thảo luận theo bài viết cụ thể hoặc kênh chung
  channelId: string; // 'GENERAL' | 'TO_TOAN' | 'TO_VAN' | 'TO_1_2_3' ...
  senderId: string;
  senderName: string;
  senderRole: Role;
  senderAvatar?: string;
  senderPosition?: string;
  content: string;
  timestamp: string;
  attachments?: Array<{ name: string; url?: string; type: 'image' | 'file' }>;
  reactions?: Record<string, string[] | undefined>; // e.g. { '👍': ['user1', 'user2'], '❤️': ['user3'] }
}

// ==========================================
// BÀI VIẾT, HOẠT ĐỘNG, LỄ KỶ NIỆM & THÔNG BÁO CHO PHHS (YÊU CẦU 1 & 3)
// Phân quyền: PHT/GV viết bài -> Gửi duyệt -> HT toàn quyền duyệt -> Xuất bản công khai
// ==========================================
export type ArticleCategory = 'HOAT_DONG' | 'LE_KY_NIEM' | 'THONG_BAO_PHHS' | 'PHONG_TRAO' | 'TIN_TUC';
export type ArticlePublishStatus = 'NHAP' | 'CHO_HT_DUYET' | 'DA_XUAT_BAN' | 'TU_CHOI';

export interface SchoolPublicArticle {
  id: string;
  schoolYear: string;
  category: ArticleCategory;
  categoryLabel: string;
  title: string;
  summary: string;
  content: string;
  featuredImage?: string;
  images?: string[];
  attachments?: Array<{ name: string; url: string; size?: string }>;
  authorId: string;
  authorName: string;
  authorRole: Role;
  authorPosition: string;
  createdAt: string;
  status: ArticlePublishStatus;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  principalNote?: string; // Bút phê hoặc lý do trả lời
  isPinned?: boolean;
  viewCount?: number;
  targetAudience: 'TOAN_TRUONG' | 'PHHS_TIEU_HOC' | 'PHHS_THCS' | 'HOC_SINH';
}

// ==========================================
// BẢNG VÀNG THÀNH TÍCH HỌC SINH & GIÁO VIÊN (YÊU CẦU 2)
// ==========================================
export interface SchoolAchievement {
  id: string;
  type: 'GIAO_VIEN' | 'HOC_SINH' | 'TAP_THE';
  recipientName: string;
  roleOrClass: string;
  title: string;
  awardLevel: 'CAP_TRUONG' | 'CAP_HUYEN' | 'CAP_TINH' | 'CAP_QUOC_GIA';
  year: string;
  dateAwarded: string;
  awardingBody: string;
  description: string;
  photoUrl?: string;
  certificateUrl?: string;
}

// ==========================================
// 1. NHẬT KÝ HỆ THỐNG (AUDIT TRAIL / SYSTEM LOGS)
// ==========================================
export interface SystemAuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: 'Thành công' | 'Đang chờ' | 'Lỗi';
  user?: string;
  category?: 'Hệ thống' | 'Đăng nhập' | 'Nhân sự' | 'Học sinh' | 'Chuyên môn' | 'Tài chính' | 'Văn bản' | 'Cơ sở vật chất';
}

// ==========================================
// 3. SỔ CHI TIÊU NỘI BỘ (THỦ QUÝ, KẾ TOÁN, VĂN THƯ, HIỆU TRƯỞNG)
// ==========================================
export type ExpenseType = 'CO_HOA_DON_DO' | 'PHIEU_CHI_NOI_BO' | 'CHI_KHONG_HOA_DON';
export type ExpenseApprovalStatus = 'CHO_HT_DUYET' | 'HT_DA_DUYET' | 'HT_TU_CHOI' | 'YEU_CAU_BO_SUNG';
export type ExpenseSettlementStatus = 'CHUA_THANH_TOAN' | 'TRUONG_DA_TRA_TIEN' | 'DA_CHOT_KET_THUC';

export interface InternalExpenseItem {
  id: string; // VD: CHI_2026_001
  schoolYear: string;
  expenseCode: string; // Số phiếu chi (VD: PC-01/2026)
  expenseDate: string; // Ngày chi (YYYY-MM-DD)
  expenseTime?: string; // Giờ chi
  expenseLocation: string; // Địa điểm chi
  creatorId: string; // ID người nhập: 'HT01', 'NV_THU_QUY', 'NV_KE_TOAN', 'NV_VAN_THU'
  creatorName: string; // Họ tên người nhập
  creatorRole: string; // Chức vụ người nhập
  spenderName: string; // Người chi thực tế
  spenderPhone?: string;
  title: string; // Tiêu đề khoản chi
  content: string; // Nội dung chi tiết
  amount: number; // Số tiền (VNĐ)
  expenseType: ExpenseType; // Có hóa đơn đỏ / Phiếu chi nội bộ / Chi không hóa đơn
  invoiceNumber?: string; // Số hóa đơn GTGT / biên lai
  category: 'Văn phòng phẩm' | 'Tiếp khách & Hội nghị' | 'Sửa chữa CSVC nhỏ' | 'Xăng xe & Công tác phí' | 'Khen thưởng phong trào' | 'Hoạt động chuyên môn' | 'Khác';
  attachedFiles?: Array<{ name: string; url: string; size?: string }>; // Chứng từ đính kèm
  
  // 3.2. Hiệu trưởng duyệt
  approvalStatus: ExpenseApprovalStatus;
  approvedAt?: string;
  approvedById?: string;
  approvedByName?: string;
  principalNote?: string; // Bút phê / chỉ đạo của HT

  // 3.3. Trường thanh toán & Người nhập nhận tiền chốt kết thúc
  settlementStatus: ExpenseSettlementStatus;
  paidBySchoolAmount?: number; // Số tiền trường đã trả
  paidDate?: string; // Ngày trường thanh toán
  reimbursementReceiptNo?: string; // Số phiếu hoàn ứng
  settledByUserId?: string; // Người nhận tiền báo cáo chốt
  settledByName?: string;
  settledAt?: string;
  settlementNotes?: string;
  isClosed: boolean; // Đã chốt kết thúc khoản chi
}

// ==========================================
// 3.4. SỔ THU - CHI RIÊNG CỦA HIỆU TRƯỞNG (CHỈ DUY NHẤT HT XEM)
// ==========================================
export type CashbookFundType = 'QUY_TIEN_MAT' | 'QUY_NGAN_SACH' | 'QUY_TU_CHU' | 'QUY_BAN_TRU';

export interface CashbookEntry {
  id: string;
  schoolYear: string;
  date: string;
  voucherNo: string; // Số phiếu thu / chi (VD: PT-01/2026, PC-01/2026)
  type: 'THU' | 'CHI';
  category: string;
  fundType: CashbookFundType;
  payerOrReceiver: string; // Người nộp / Người nhận
  reason: string; // Diễn giải lý do thu / chi
  amount: number; // Số tiền
  balanceAfter: number; // Số tồn sau giao dịch
  createdBy: string;
  approvedBy: string;
  notes?: string;
}

// ==========================================
// QUY TRÌNH 6 BƯỚC: BÁO CÁO => DUYỆT => THỰC HIỆN => BÁO CÁO KẾT QUẢ => HT NHẬN XÉT => CÔNG KHAI / NỘI BỘ
// ==========================================
export type WorkflowStepStatus =
  | 'B1_CHO_HT_DUYET'          // Bước 1: GV/NV gửi báo cáo/kế hoạch, chờ HT duyệt
  | 'B2_YEU_CAU_CHINH_SUA'     // Bước 2a: HT yêu cầu sửa đổi/bổ sung
  | 'B2_TU_CHOI'               // Bước 2b: HT từ chối không phê duyệt
  | 'B2_HT_DA_DUYET'           // Bước 2c: HT đã phê duyệt
  | 'B3_DANG_THUC_HIEN'        // Bước 3: GV/NV đang thực hiện công việc
  | 'B4_CHO_HT_DANH_GIA'       // Bước 4: GV/NV đã nộp báo cáo kết quả, chờ HT thẩm định & nhận xét
  | 'B5_HT_DA_DANH_GIA';       // Bước 5 & 6: HT đã nhận xét, chấm điểm và quyết định công khai/nội bộ

export type WorkflowRating =
  | 'XUAT_SAC'   // Xuất sắc (9.0 - 10.0)
  | 'TOT'        // Tốt (7.5 - 8.9)
  | 'DAT'        // Đạt (5.0 - 7.4)
  | 'CAN_CO_GANG'// Cần cố gắng (3.5 - 4.9)
  | 'CHUA_DAT';  // Chưa đạt (< 3.5)

export type WorkflowCategory =
  | 'CHUYEN_MON_DAY_HOC'
  | 'HOI_GIANG_THI_DUA'
  | 'CONG_TAC_CHU_NHIEM'
  | 'HO_SO_SO_SACH'
  | 'CO_SO_VAT_CHAT'
  | 'TAI_CHINH_KE_TOAN'
  | 'VAN_THU_CONG_VAN'
  | 'Y_TE_HOC_DUONG'
  | 'AN_NINH_BAO_VE'
  | 'PHONG_TRAO_DOAN_DOI'
  | 'NHIEM_VU_DOT_XUAT';

export interface WorkWorkflowItem {
  id: string; // VD: WF-2026-001
  code: string; // Mã phiếu: BC-01/2026
  schoolYear: string; // 2026-2027
  title: string; // Tiêu đề báo cáo / nhiệm vụ
  category: WorkflowCategory;
  categoryLabel: string;
  branchName: string; // Phân hiệu
  campusName: string; // Điểm trường
  
  // Bước 1: Người báo cáo đề xuất
  creatorId: string;
  creatorName: string;
  creatorRole: Role;
  creatorPosition: string;
  submittedAt: string; // Ngày nộp đề xuất (YYYY-MM-DD HH:mm)
  proposalContent: string; // Nội dung chi tiết kế hoạch / công việc
  expectedGoal: string; // Mục tiêu dự kiến đạt được
  deadline: string; // Hạn chót hoàn thành (YYYY-MM-DD)
  proposalAttachments?: Array<{ name: string; url: string; size?: string }>;
  
  // Trạng thái bước trong quy trình
  status: WorkflowStepStatus;
  
  // Bước 2: Hiệu trưởng (hoặc PHT) phê duyệt
  approvedAt?: string;
  approvedById?: string;
  approvedByName?: string;
  approvalDirectives?: string; // Bút phê, chỉ đạo, dặn dò của Hiệu trưởng
  approvalAdjustedDeadline?: string; // HT có thể điều chỉnh hạn chót nếu cần
  
  // Bước 3: GV/NV thực hiện
  executionProgress: number; // 0 - 100%
  executionLog?: Array<{
    date: string;
    progressPercent: number;
    notes: string;
    updatedBy: string;
  }>;
  
  // Bước 4: GV/NV nộp báo cáo kết quả
  resultSummary?: string; // Tóm tắt kết quả đạt được thực tế
  resultCompletedDate?: string; // Ngày hoàn thành thực tế
  resultAttachments?: Array<{ name: string; url: string; size?: string; type?: string }>;
  resultDriveUrl?: string; // Link folder Google Drive minh chứng
  
  // Bước 5: HT nhận xét, chấm điểm và đánh giá
  evaluatedAt?: string;
  evaluatedById?: string;
  evaluatedByName?: string;
  principalScore?: number; // Điểm số 1 - 10
  principalRating?: WorkflowRating; // Xếp loại
  principalFeedback?: string; // Nhận xét, góp ý của Hiệu trưởng
  feedbackType?: 'KHEN_THUONG' | 'NHAC_NHO' | 'DONG_VIEN' | 'GOP_Y';
  awardCommendationTitle?: string; // Tên khen thưởng nếu có
  
  // Bước 6: Quyết định công khai do HT quyết định
  isPublicAnnounced: boolean; // TRUE: Công khai toàn trường, FALSE: Nội bộ cá nhân
  publicAnnouncedAt?: string;
  
  // Phân loại chu kỳ đánh giá
  cycleWeek: number; // Tuần học (1 - 35)
  cycleMonth: number; // Tháng (9 - 12, 1 - 5)
  cycleSemester: 1 | 2; // Học kỳ 1 hoặc 2
  
  createdAt: string;
  updatedAt: string;
}

// Bảng thống kê định kỳ đánh giá nhân viên (Cuối Tuần, Cuối Tháng, Cuối Năm)
export interface PeriodicEvaluationSummary {
  staffId: string;
  staffName: string;
  staffRole: Role;
  position: string;
  branchName: string;
  totalAssignedOrReported: number; // Tổng số việc
  approvedCount: number; // Số việc được duyệt
  completedCount: number; // Số việc đã hoàn thành
  onTimeCount: number; // Đúng hạn
  overdueCount: number; // Chậm tiến độ
  praisedCount: number; // Số lần được HT khen
  remindedCount: number; // Số lần bị nhắc nhở
  averageScore: number; // Điểm trung bình (thang 10)
  completionRate: number; // Tỷ lệ hoàn thành (%)
  tierRank: 'A' | 'B' | 'C' | 'D'; // Xếp loại A (Xuất sắc), B (Tốt), C (Đạt), D (Chưa đạt)
  tierRankLabel: string;
  notes?: string;
}

// ==========================================
// CƠ CHẾ BẢO MẬT & QUẢN TRỊ AN NINH
// ==========================================
export interface SecurityConfig {
  requireStrongPassword: boolean; // Yêu cầu mật khẩu mạnh (>= 8 ký tự, có số, chữ hoa)
  enforceTemporaryPasswordChange: boolean; // Bắt buộc đổi mật khẩu lần đầu đăng nhập
  sessionInactivityTimeoutMinutes: number; // Tự động khóa sau N phút không hoạt động (mặc định 15)
  maxLoginAttempts: number; // Số lần đăng nhập sai tối đa trước khi khóa (mặc định 5)
  lockoutDurationMinutes: number; // Thời gian khóa tạm thời (mặc định 5)
  htAuthorizationPin: string; // Mã PIN bảo mật khi HT thực hiện duyệt nhạy cảm (mặc định: '2026')
  enableDataTamperDetection: boolean; // Bật kiểm tra toàn vẹn chữ ký CSDL
  allowGuestAccess: boolean; // Cho phép xem cổng thông tin công khai
  systemVersion: string;
  lastBackupDate?: string;
  lastBackupChecksum?: string;
}

export interface SecurityAuditRecord {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  event: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'BLOCKED';
  details: string;
  targetResource?: string;
}





