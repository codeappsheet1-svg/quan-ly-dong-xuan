/**
 * Google Apps Script Generator for Trường Tiểu học & THCS Đồng Xuân
 * Tác giả: Hiệu trưởng Nguyễn Quốc Bảo
 * 
 * Bộ mã nguồn chuẩn Google Apps Script (.gs) để triển khai trên Google Drive & Google Sheets
 */

import { COLUMN_LETTERS, TEACHER_COLUMNS_AZ, STAFF_COLUMNS_AZ, GUARD_COLUMNS_AZ, CLASS_COLUMNS_AZ } from '../types/sheetColumns';

export const GAS_CODE_SETUP_DRIVE = `/**
 * ==============================================================================
 * HỆ THỐNG QUẢN LÝ NỘI BỘ TRƯỜNG TH & THCS ĐỒNG XUÂN - PHÚ YÊN
 * Tác giả: Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng
 * File: SetupDriveAndSheets.gs - Khởi tạo cấu trúc thư mục và các bảng tính A-AZ
 * ==============================================================================
 */

// Cấu hình tên thư mục gốc trên Google Drive của trường
const ROOT_FOLDER_NAME = "QL_Nội_Bộ_TH_THCS_Đồng_Xuân";
const FOLDER_TEACHERS = "01_Hồ_Sơ_Giáo_Viên_A_AZ";
const FOLDER_STAFF = "02_Hồ_Sơ_Nhân_Viên_A_AZ";
const FOLDER_GUARDS = "03_Hồ_Sơ_Bảo_Vệ_Hợp_Đồng_A_AZ";
const FOLDER_CLASSES = "04_Hồ_Sơ_Lớp_Học_A_AZ";

/**
 * Hàm khởi tạo toàn bộ cấu trúc Thư mục và File Tổng hợp trên Google Drive
 * Chạy hàm này 1 lần duy nhất trong trình soạn thảo Apps Script
 */
function initSchoolDriveSystem() {
  Logger.log(">>> BẮT ĐẦU KHỞI TẠO HỆ THỐNG GOOGLE DRIVE TRƯỜNG ĐỒNG XUÂN <<<");
  
  // 1. Tìm hoặc tạo thư mục gốc
  var rootFolders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
  Logger.log("Thư mục gốc ID: " + rootFolder.getId());

  // 2. Tạo các thư mục con
  var folderGV = getOrCreateSubFolder(rootFolder, FOLDER_TEACHERS);
  var folderNV = getOrCreateSubFolder(rootFolder, FOLDER_STAFF);
  var folderBV = getOrCreateSubFolder(rootFolder, FOLDER_GUARDS);
  var folderLH = getOrCreateSubFolder(rootFolder, FOLDER_CLASSES);

  // 3. Tạo Sheet Quản lý Tài khoản & Phân quyền đăng nhập
  var masterAccounts = getOrCreateSpreadsheet(rootFolder, "HT_DanhSach_TaiKhoan_DangNhap");
  setupMasterAccountsSheet(masterAccounts);

  // 4. Tạo Sheet Tổng hợp Nhân sự toàn trường
  var masterStaff = getOrCreateSpreadsheet(rootFolder, "HT_TongHop_NhanSu_ToanTruong");
  setupMasterStaffSheet(masterStaff);

  // 5. Tạo Sheet Tổng hợp 57 Lớp học & 1.289 Học sinh
  var masterClasses = getOrCreateSpreadsheet(rootFolder, "HT_TongHop_LopHoc_HocSinh");
  setupMasterClassesSheet(masterClasses);

  // 6. Tạo Sheet Theo dõi Nghỉ phép & Đổi tiết / Dạy thay
  var masterLeaves = getOrCreateSpreadsheet(rootFolder, "HT_SoTheoDoi_NghiPhep_DayThay");
  setupMasterLeavesSheet(masterLeaves);

  // 7. Tạo Sheet Đề xuất & Tiến độ Sửa chữa Cơ sở vật chất
  var masterCSVC = getOrCreateSpreadsheet(rootFolder, "HT_SoTheoDoi_SuaChua_CSVC");
  setupMasterCSVCSheet(masterCSVC);

  // Lưu thông tin vào Script Properties để các hàm khác sử dụng
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    "ROOT_FOLDER_ID": rootFolder.getId(),
    "FOLDER_GV_ID": folderGV.getId(),
    "FOLDER_NV_ID": folderNV.getId(),
    "FOLDER_BV_ID": folderBV.getId(),
    "FOLDER_LH_ID": folderLH.getId(),
    "MASTER_ACCOUNTS_ID": masterAccounts.getId(),
    "MASTER_STAFF_ID": masterStaff.getId(),
    "MASTER_CLASSES_ID": masterClasses.getId(),
    "MASTER_LEAVES_ID": masterLeaves.getId(),
    "MASTER_CSVC_ID": masterCSVC.getId()
  });

  Logger.log(">>> KHỞI TẠO THÀNH CÔNG HỆ THỐNG TRƯỜNG TH & THCS ĐỒNG XUÂN! <<<");
  return {
    success: true,
    rootFolderUrl: rootFolder.getUrl(),
    masterAccountsUrl: masterAccounts.getUrl()
  };
}

function getOrCreateSubFolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function getOrCreateSpreadsheet(parentFolder, name) {
  var files = parentFolder.getFilesByName(name);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  var ss = SpreadsheetApp.create(name);
  var file = DriveApp.getFileById(ss.getId());
  file.moveTo(parentFolder);
  return ss;
}
`;

export const GAS_CODE_TEMPLATES = `/**
 * ==============================================================================
 * HỆ THỐNG QUẢN LÝ NỘI BỘ TRƯỜNG TH & THCS ĐỒNG XUÂN - PHÚ YÊN
 * Tác giả: Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng
 * File: TemplatesAtoAZ.gs - Định nghĩa 52 Cột (A -> AZ) cho từng đối tượng
 * ==============================================================================
 */

// 52 Cột A -> AZ dành cho GIÁO VIÊN
const TEACHER_COLUMNS = [
  "Mã định danh GV (A)", "Họ và tên (B)", "Giới tính (C)", "Ngày sinh (D)", "Số CCCD (E)", "Ngày cấp CCCD (F)",
  "Dân tộc (G)", "Tôn giáo (H)", "Số điện thoại (I)", "Email liên hệ (J)", "Địa chỉ thường trú (K)", "Nơi ở hiện nay (L)",
  "Quê quán (M)", "Trình độ chuẩn (N)", "Chuyên ngành (O)", "Cơ sở đào tạo (P)", "Năm tốt nghiệp (Q)", "Chức vụ (R)",
  "Tổ chuyên môn (S)", "Cấp học (T)", "Môn dạy chính (U)", "Môn dạy kiêm nhiệm (V)", "Phân hiệu (W)", "Điểm trường (X)",
  "Kiêm nhiệm GVCN (Y)", "Lớp chủ nhiệm (Z)", "Loại hợp đồng (AA)", "Ngày tuyển dụng (AB)", "Ngày về trường (AC)",
  "Thâm niên nghề (AD)", "Hạng chức danh (AE)", "Bậc lương (AF)", "Hệ số lương (AG)", "Phụ cấp chức vụ (AH)",
  "Phụ cấp khu vực (AI)", "Mã số BHXH (AJ)", "Mã số thuế (AK)", "Số tài khoản NH (AL)", "Tên ngân hàng (AM)",
  "Đảng viên (AN)", "Ngày vào Đảng (AO)", "Ngày chính thức (AP)", "Lý luận chính trị (AQ)", "Quản lý nhà nước (AR)",
  "Trình độ Tin học (AS)", "Trình độ Ngoại ngữ (AT)", "Tiết quy định/tuần (AU)", "Tiết thực dạy/tuần (AV)",
  "Sức khỏe (AW)", "Đánh giá chuẩn nghề nghiệp (AX)", "Khen thưởng (AY)", "Ghi chú của BGH (AZ)"
];

// 52 Cột A -> AZ dành cho NHÂN VIÊN
const STAFF_COLUMNS = [
  "Mã định danh NV (A)", "Họ và tên (B)", "Giới tính (C)", "Ngày sinh (D)", "Số CCCD (E)", "Ngày cấp CCCD (F)",
  "Dân tộc (G)", "Tôn giáo (H)", "Số điện thoại (I)", "Email (J)", "Địa chỉ thường trú (K)", "Chỗ ở hiện nay (L)",
  "Quê quán (M)", "Vị trí việc làm (N)", "Trình độ chuyên môn (O)", "Chuyên ngành (P)", "Cơ sở đào tạo (Q)", "Năm TN (R)",
  "Bộ phận / Tổ (S)", "Phân hiệu chính (T)", "Điểm trường (U)", "Kiêm nhiệm (V)", "Hợp đồng (W)", "Ngày tuyển dụng (X)",
  "Ngày về trường (Y)", "Mã ngạch (Z)", "Bậc lương (AA)", "Hệ số lương (AB)", "Phụ cấp (AC)", "Mã BHXH (AD)",
  "Mã số thuế (AE)", "Số tài khoản (AF)", "Ngân hàng (AG)", "Đảng viên (AH)", "Ngày vào Đảng (AI)", "Đoàn thể (AJ)",
  "Chứng chỉ Tin học (AK)", "Chứng chỉ Ngoại ngữ (AL)", "Mô tả nhiệm vụ (AM)", "Phòng / Thiết bị quản lý (AN)",
  "Người liên hệ khẩn cấp (AO)", "SĐT khẩn cấp (AP)", "Sức khỏe (AQ)", "PCCC / An toàn (AR)", "Ca làm việc (AS)",
  "Đánh giá hoàn thành (AT)", "Khen thưởng (AU)", "Kỷ luật (AV)", "Phép năm còn lại (AW)", "Bồi dưỡng (AX)",
  "Kỹ năng đặc biệt (AY)", "Ghi chú tổng hợp (AZ)"
];

// 52 Cột A -> AZ dành cho BẢO VỆ & HỢP ĐỒNG
const GUARD_COLUMNS = [
  "Mã số Bảo vệ/HĐ (A)", "Họ và tên (B)", "Giới tính (C)", "Ngày sinh (D)", "Số CCCD (E)", "Ngày cấp CCCD (F)",
  "Dân tộc (G)", "Số điện thoại (H)", "Địa chỉ thường trú (I)", "Nơi ở hiện tại (J)", "Vị trí công việc (K)", "Phân hiệu (L)",
  "Điểm trường phụ trách (M)", "Ca trực quy định (N)", "Nghĩa vụ quân sự (O)", "Chứng chỉ PCCC (P)", "Nghiệp vụ bảo vệ (Q)",
  "Tay nghề sửa chữa CSVC (R)", "Loại hợp đồng (S)", "Ngày bắt đầu HĐ (T)", "Ngày hết hạn HĐ (U)", "Mức lương thỏa thuận (V)",
  "Phụ cấp trực đêm (W)", "Mã số BHXH (X)", "Số tài khoản (Y)", "Tên ngân hàng (Z)", "Chùm chìa khóa phòng giữ (AA)",
  "Giờ mở cổng sáng (AB)", "Giờ khóa cổng tối (AC)", "Sổ trực tuần tra (AD)", "Đảng viên (AE)", "Đoàn viên công đoàn (AF)",
  "SĐT khẩn cấp gia đình (AG)", "Sức khỏe (AH)", "Khám sức khỏe kỳ (AI)", "Trang phục cấp phát (AJ)", "Công cụ hỗ trợ (AK)",
  "Cổng trực số (AL)", "Phụ trách bơm nước (AM)", "Phụ trách máy phát điện (AN)", "Cắt tỉa cây xanh (AO)",
  "Số vụ sửa CSVC hoàn thành (AP)", "Đánh giá tay nghề CSVC (AQ)", "Ý thức chấp hành giờ giấc (AR)", "Sự cố an ninh (AS)",
  "Đánh giá thi đua năm (AT)", "Khen thưởng (AU)", "Nghỉ phép đã dùng (AV)", "Phép còn lại (AW)", "Bảo vệ đổi ca (AX)",
  "SĐT bảo vệ đổi ca (AY)", "Ghi chú của BGH (AZ)"
];

// 52 Cột A -> AZ dành cho LỚP HỌC & HỌC SINH
const CLASS_COLUMNS = [
  "Mã lớp học (A)", "Tên lớp (B)", "Khối học (C)", "Cấp học (D)", "Phân hiệu (E)", "Điểm trường (F)",
  "Mã GVCN (G)", "Họ tên GVCN (H)", "SĐT GVCN (I)", "Năm học (J)", "Tổng sĩ số (K)", "Học sinh Nam (L)",
  "Học sinh Nữ (M)", "Dân tộc thiểu số (N)", "Hộ nghèo (O)", "Hộ cận nghèo (P)", "Khuyết tật hòa nhập (Q)", "Mồ côi (R)",
  "Lớp trưởng (S)", "Lớp phó (T)", "Trưởng ban ĐD CMHS (U)", "SĐT Trưởng ban ĐD (V)", "Vị trí phòng học (W)", "Buổi học (X)",
  "Số bộ bàn ghế (Y)", "Loại bảng lớp (Z)", "Tivi thông minh (AA)", "Số quạt (AB)", "Số bóng đèn (AC)", "HS chuyển đến (AD)",
  "HS chuyển đi (AE)", "Học sinh bỏ học (AF)", "Số Đội viên (AG)", "Sao Nhi đồng (AH)", "Nước uống sạch (AI)",
  "Vệ sinh lớp học (AJ)", "Điểm thi đua Đội (AK)", "HS Hoàn thành tốt/Giỏi (AL)", "HS Hoàn thành/Khá (AM)",
  "HS cần giúp đỡ (AN)", "Tỷ lệ BHYT (%) (AO)", "Họp CMHS đầu năm (%) (AP)", "Drive Folder ID (AQ)", "Sheet File ID (AR)",
  "Sheet URL (AS)", "Cập nhật gần nhất (AT)", "Nhóm Zalo lớp (AU)", "Khó khăn đặc thù (AV)", "Đề xuất hỗ trợ (AW)",
  "Xếp loại HK1 (AX)", "Chỉ tiêu cả năm (AY)", "Ngày GVCN ký báo cáo (AZ)"
];

/**
 * Hàm tự động tạo 1 file Google Sheet cá nhân cho Giáo viên/Nhân viên/Bảo vệ/Lớp học
 * Chứa đúng 52 cột A đến AZ, có khóa bảo vệ tiêu đề và định dạng màu sắc trang nhã
 */
function createPersonalSheetAZ(type, userCode, fullName, folderId) {
  var targetFolder = DriveApp.getFolderById(folderId);
  var fileName = "Hồ_Sơ_[" + userCode + "]_" + fullName;
  var ss = SpreadsheetApp.create(fileName);
  var file = DriveApp.getFileById(ss.getId());
  file.moveTo(targetFolder);

  var sheet = ss.getActiveSheet();
  sheet.setName("Hồ_Sơ_Cá_Nhân_A_AZ");

  // Chọn bộ tiêu đề 52 cột tương ứng
  var headers = TEACHER_COLUMNS;
  var headerBgColor = "#1e3a8a"; // Xanh navy đậm trang trọng
  if (type === "NV") {
    headers = STAFF_COLUMNS;
    headerBgColor = "#065f46"; // Xanh rêu
  } else if (type === "BV" || type === "NV_HD_BV") {
    headers = GUARD_COLUMNS;
    headerBgColor = "#78350f"; // Nâu sẫm
  } else if (type === "LOP") {
    headers = CLASS_COLUMNS;
    headerBgColor = "#4338ca"; // Tím indigo
  }

  // Ghi tiêu đề hệ thống và bản quyền
  sheet.getRange("A1").setValue("TRƯỜNG TIỂU HỌC & TRUNG HỌC CƠ SỞ ĐỒNG XUÂN - XÃ ĐỒNG XUÂN - TỈNH PHÚ YÊN");
  sheet.getRange("A1").setFontWeight("bold").setFontSize(13).setFontColor("#1e293b");

  sheet.getRange("A2").setValue("BẢNG KHAI BÁO & DỮ LIỆU ĐIỆN TỬ CÁ NHÂN (CỘT A ĐẾN CỘT AZ)");
  sheet.getRange("A2").setFontWeight("bold").setFontSize(11).setFontColor("#0369a1");

  sheet.getRange("A3").setValue("Hệ thống Quản lý nội bộ trường học, do Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng, mọi sao chép đều phải xin phép.");
  sheet.getRange("A3").setFontStyle("italic").setFontSize(9).setFontColor("#64748b");

  // Thiết lập 52 cột ở Dòng 5
  var headerRange = sheet.getRange(5, 1, 1, 52);
  headerRange.setValues([headers]);
  headerRange.setBackground(headerBgColor)
             .setFontColor("#ffffff")
             .setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setWrap(true);
  sheet.setRowHeight(5, 45);

  // Đặt dữ liệu mặc định ban đầu ở Dòng 6
  var initialRow = new Array(52).fill("");
  initialRow[0] = userCode;
  initialRow[1] = fullName;
  sheet.getRange(6, 1, 1, 52).setValues([initialRow]);

  // Kẻ bảng (Borders)
  sheet.getRange(5, 1, 2, 52).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // Cố định hàng tiêu đề
  sheet.setFrozenRows(5);
  sheet.setFrozenColumns(2); // Cố định Cột A (Mã) và Cột B (Họ tên)

  return {
    fileId: file.getId(),
    fileUrl: ss.getUrl()
  };
}
`;

export const GAS_CODE_API = `/**
 * ==============================================================================
 * HỆ THỐNG QUẢN LÝ NỘI BỘ TRƯỜNG TH & THCS ĐỒNG XUÂN - PHÚ YÊN
 * Tác giả: Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng
 * File: Code.gs - Web App API tiếp nhận lệnh doGet, doPost kết nối Web App
 * ==============================================================================
 */

/**
 * Xử lý GET request (Tra cứu dữ liệu, kiểm tra sức khỏe hệ thống)
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";

  if (action === "ping") {
    return jsonResponse({
      status: "success",
      school: "Trường TH & THCS Đồng Xuân",
      principal: "Nguyễn Quốc Bảo",
      timestamp: new Date().toISOString(),
      message: "Hệ thống Google Apps Script trường Đồng Xuân đang hoạt động ổn định 100%!"
    });
  }

  if (action === "getUserSheetData") {
    var fileId = e.parameter.fileId;
    return jsonResponse(read52ColumnsFromSheet(fileId));
  }

  return jsonResponse({ status: "error", message: "Hành động không hợp lệ" });
}

/**
 * Xử lý POST request (Đăng ký mới, cấp tài khoản, đổi mật khẩu, đồng bộ A-AZ)
 */
function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "{}";
    var payload = JSON.parse(rawData);
    var action = payload.action;

    // 1. Đăng ký nhân sự mới (Tự sinh Sheet A-AZ + Cấp ID + Mật khẩu tạm)
    if (action === "SIGN_UP_STAFF") {
      return jsonResponse(handleSignUpStaff(payload));
    }

    // 2. Đăng ký lớp học mới
    if (action === "SIGN_UP_CLASS") {
      return jsonResponse(handleSignUpClass(payload));
    }

    // 3. Đổi mật khẩu lần đầu
    if (action === "CHANGE_PASSWORD") {
      return jsonResponse(handleChangePassword(payload));
    }

    // 4. Lưu cập nhật 52 cột A-AZ từ Web lên Google Sheet
    if (action === "SAVE_AZ_DATA") {
      return jsonResponse(handleSaveAZData(payload));
    }

    // 5. Duyệt đơn nghỉ phép / đổi tiết của Hiệu trưởng
    if (action === "APPROVE_REQUEST") {
      return jsonResponse(handleApproveRequest(payload));
    }

    return jsonResponse({ status: "error", message: "Hành động POST không xác định: " + action });
  } catch (err) {
    return jsonResponse({ status: "error", error: err.toString() });
  }
}

/**
 * Tự động tạo hồ sơ nhân sự mới: Cấp ID, mật khẩu tạm, sinh file Google Sheet A-AZ
 */
function handleSignUpStaff(data) {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty("FOLDER_GV_ID");
  if (data.role === "NV") folderId = props.getProperty("FOLDER_NV_ID");
  if (data.role === "NV_HD_BV") folderId = props.getProperty("FOLDER_BV_ID");

  // Sinh ID và mật khẩu tạm
  var prefix = data.role === "GV" ? "GV" : data.role === "NV" ? "NV" : "BV";
  var newId = prefix + "_" + Utilities.formatDate(new Date(), "GMT+7", "yyMMdd_ss");
  var tempPassword = "DX@" + Math.floor(100000 + Math.random() * 900000);

  // Sinh file Sheet A-AZ
  var sheetResult = createPersonalSheetAZ(data.role, newId, data.fullName, folderId);

  // Lưu vào Master Accounts
  var masterAccountsId = props.getProperty("MASTER_ACCOUNTS_ID");
  if (masterAccountsId) {
    var ss = SpreadsheetApp.openById(masterAccountsId);
    var sheet = ss.getActiveSheet();
    sheet.appendRow([
      newId,
      data.fullName,
      data.role,
      data.phone,
      tempPassword,
      "YES", // isTemporaryPassword
      sheetResult.fileId,
      sheetResult.fileUrl,
      new Date()
    ]);
  }

  return {
    status: "success",
    newId: newId,
    tempPassword: tempPassword,
    sheetUrl: sheetResult.fileUrl,
    sheetFileId: sheetResult.fileId,
    message: "Đã khởi tạo thành công tài khoản và Google Sheet cá nhân cho: " + data.fullName
  };
}

/**
 * Ghi dữ liệu 52 cột từ Web vào file Google Sheet cá nhân
 */
function handleSaveAZData(data) {
  var fileId = data.sheetFileId;
  var azValues = data.azValues; // Mảng 52 giá trị tương ứng cột A đến AZ

  var ss = SpreadsheetApp.openById(fileId);
  var sheet = ss.getSheetByName("Hồ_Sơ_Cá_Nhân_A_AZ") || ss.getActiveSheet();
  
  // Dòng 6 là dòng dữ liệu
  sheet.getRange(6, 1, 1, 52).setValues([azValues]);

  return {
    status: "success",
    updatedAt: new Date().toISOString(),
    message: "Đã lưu trữ thành công toàn bộ 52 cột A-AZ vào Google Sheet!"
  };
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Hướng dẫn từng bước triển khai Google Apps Script cho Hiệu trưởng
 */
export const GAS_DEPLOYMENT_GUIDE_MD = `# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG TRÊN GOOGLE DRIVE & GOOGLE APPS SCRIPT
**Trường Tiểu học và Trung học Cơ sở Đồng Xuân**  
**Tác giả:** Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng

---

### BƯỚC 1: TẠO DỰ ÁN GOOGLE APPS SCRIPT
1. Đăng nhập tài khoản Google của trường (VD: \`hieutruong.dongxuan@gmail.com\`).
2. Truy cập: [https://script.google.com](https://script.google.com).
3. Bấm **Dự án mới (New Project)**.
4. Đặt tên dự án: **QL_Truong_DongXuan_HeThong_NoiBo**.

---

### BƯỚC 2: SAO CHÉP MÃ NGUỒN VÀO DỰ ÁN
Trong dự án vừa tạo, tạo các tệp script sau:
1. **\`SetupDriveAndSheets.gs\`**: Sao chép toàn bộ mã từ tab *SetupDriveAndSheets.gs*.
2. **\`TemplatesAtoAZ.gs\`**: Sao chép toàn bộ mã từ tab *TemplatesAtoAZ.gs*.
3. **\`Code.gs\`**: Sao chép toàn bộ mã từ tab *Code.gs (Web App API)*.

---

### BƯỚC 3: CHẠY HÀM KHỞI TẠO HỆ THỐNG DRIVE
1. Tại thanh menu của Apps Script, chọn hàm: **\`initSchoolDriveSystem\`**.
2. Nhấn nút **Chạy (Run)**.
3. Khi Google yêu cầu cấp quyền:
   - Chọn tài khoản của bạn.
   - Bấm **Nâng cao (Advanced)** -> Bấm **Đi tới QL_Truong_DongXuan_HeThong_NoiBo (không an toàn)**.
   - Bấm **Cho phép (Allow)**.
4. Hệ thống sẽ tự động tạo thư mục gốc \`QL_Nội_Bộ_TH_THCS_Đồng_Xuân\` cùng 4 thư mục con và 5 tệp Google Sheet Tổng hợp trung tâm!

---

### BƯỚC 4: TRIỂN KHAI THÀNH WEB APP API
1. Bấm nút **Triển khai (Deploy)** ở góc trên bên phải -> Chọn **Tùy chọn triển khai mới (New deployment)**.
2. Chọn loại: **Ứng dụng web (Web app)**.
3. Cấu hình:
   - Mô tả: *API Hệ thống nội bộ TH & THCS Đồng Xuân v1.0*.
   - Thực thi dưới dạng (Execute as): **Tôi (Địa chỉ email của bạn)**.
   - Ai có quyền truy cập (Who has access): **Bất kỳ ai (Anyone)**.
4. Nhấn **Triển khai (Deploy)**.
5. Sao chép **URL ứng dụng web** (Web app URL có dạng \`https://script.google.com/macros/s/.../exec\`).
6. Dán URL này vào ô **Cấu hình Web App URL** trong bảng điều khiển của web để kích hoạt đồng bộ hóa dữ liệu 2 chiều!

---
*Mọi quyền sở hữu thuộc về Hiệu trưởng Nguyễn Quốc Bảo - Trường TH & THCS Đồng Xuân.*
`;
