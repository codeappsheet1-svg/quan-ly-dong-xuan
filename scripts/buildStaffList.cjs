const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../src/data/rawStaff.csv');
const rawContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV manually handling quotes
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentField.trim());
      if (row.some(f => f.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField.length > 0 || row.length > 0) {
    row.push(currentField.trim());
    if (row.some(f => f.length > 0)) {
      lines.push(row);
    }
  }
  return lines;
}

const parsed = parseCSV(rawContent);
const header = parsed[0];
const rows = parsed.slice(1);

console.log(`Parsed ${rows.length} rows.`);

function removeAccents(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function makeSlug(name) {
  return removeAccents(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

const staffRecords = rows.map((r, idx) => {
  const stt = parseInt(r[0], 10);
  const name = r[1] || '';
  const rawBranch = r[2] || '';
  const pos = r[3] || '';
  const team = r[4] || '';
  const spec = r[5] || '';
  const capBienChe = r[6] || '';
  const capBoTri = r[7] || '';
  const gender = r[8] || (idx % 2 === 0 ? 'Nữ' : 'Nam');
  const diemTruong = r[9] || '';
  const thon = r[10] || '';
  const dob = r[11] || '';
  const age = r[12] ? parseInt(r[12], 10) : 40;
  const llct = r[13] || '';
  const qlnn = r[14] || '';
  const ngoaingu = r[15] || '';
  const tinhoc = r[16] || '';
  const maNgach = r[17] || '';

  // Smart extract for fields after maNgach:
  const tail = r.slice(18);

  let sdt = '';
  let emailRaw = '';
  let cccd = '';
  let danToc = 'Kinh';
  let tonGiao = 'Không';
  let trinhDoCM = '';
  let trangThaiBienDong = '';
  let thoiDiemBienDong = '';
  let queQuan = '';
  let boSung4 = '';
  let thoiGianBoNhiem = '';
  let thoiDiemTuyenDung = '';
  let thoiDiemHopDong = '';

  for (let i = 0; i < tail.length; i++) {
    const val = tail[i];
    if (!val) continue;

    // Phone
    if (/^0\d{9,10}$/.test(val)) {
      sdt = val;
    }
    // Email
    else if (val.includes('@')) {
      emailRaw = val;
    }
    // CCCD
    else if (/^\d{12}$/.test(val)) {
      cccd = val;
    }
    // Qualification
    else if (!trinhDoCM && (val.includes('Đại học') || val.includes('Cử nhân') || val.includes('ĐH') || val.includes('Cao đẳng') || val.includes('CĐ') || val.includes('Trung cấp') || val.includes('TC') || val.includes('Ths') || val.includes('Ts') || val.includes('Bảo vệ'))) {
      trinhDoCM = val;
    }
    // Mobility / Status
    else if (val.includes('nghỉ') || val.includes('Đang làm') || val.includes('chuyển') || val.includes('Nghỉ')) {
      trangThaiBienDong = val;
    }
    // Dates
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val) || /^\d{1,2}\/\/\d{1,2}\/\d{4}$/.test(val) || /^\d{1,2}\/\d{4}$/.test(val)) {
      if (trangThaiBienDong && !thoiDiemBienDong) {
        thoiDiemBienDong = val;
      } else {
        thoiDiemTuyenDung = val;
      }
    }
    // Hometown / Address
    else if (val.includes('Thôn') || val.includes('Xã') || val.includes('xã') || val.includes('thôn') || val.includes('tỉnh') || val.includes('Đắk Lắk') || val.includes('Phú Yên') || val.includes('Nghệ An') || val.includes('Hà Tĩnh') || val.includes('Vĩnh Long') || val.includes('Đà Nẵng')) {
      queQuan = val;
    }
    // Appointment / Supplement
    else if (val.includes('Lần đầu') || val.includes('Gần nhất') || val.includes('2025') || val.includes('2024') || val.includes('2026')) {
      boSung4 = val;
    }
  }

  // Fallbacks if not detected
  if (!queQuan) queQuan = 'Thôn Long Châu, Xã Đồng Xuân, Tỉnh Đắk Lắk';

  // Determine standard ID
  let id = '';
  if (stt === 67) id = 'HT01';
  else if (stt === 75) id = 'PHT01';
  else if (stt === 49) id = 'PHT02';
  else if (stt === 68) id = 'PHT03';
  else if (stt === 72) id = 'GV_IT01';
  else if (stt === 128) id = 'NV_THU_QUY';
  else if (stt === 127) id = 'NV_KE_TOAN';
  else if (stt === 132) id = 'NV_VAN_THU';
  else if (pos.includes('Bảo vệ') || spec.includes('Bảo vệ') || name === 'Nguyễn Thị Lành') {
    id = `BV_${stt.toString().padStart(3, '0')}`;
  } else if (pos.startsWith('NV') || team === 'VP' || spec.includes('Thư viện') || spec.includes('Kế toán') || spec.includes('Văn thư')) {
    id = `NV_${stt.toString().padStart(3, '0')}`;
  } else if (pos.includes('hợp đồng') || thoiDiemHopDong) {
    id = stt === 136 ? 'GV_HD01' : stt === 137 ? 'GV_HD02' : `GV_HD_${stt}`;
  } else {
    id = `GV_${stt.toString().padStart(3, '0')}`;
  }

  // Determine Role
  let role = 'GV';
  if (stt === 67) role = 'HT';
  else if (stt === 75 || stt === 49 || stt === 68) role = 'PHT';
  else if (stt === 72) role = 'GV_TIN_HOC';
  else if (id.startsWith('BV_')) role = 'NV_HD_BV';
  else if (id.startsWith('NV_') || pos.startsWith('NV') || team === 'VP') role = 'NV';
  else role = 'GV';

  // Determine Branch
  let branchName = 'Trụ sở chính Đồng Xuân';
  let campusId = 'CS_TRU_SO';
  let campusName = 'Điểm Trụ sở chính';

  if (rawBranch.includes('XQ2') || rawBranch.includes('Xuân Quang 2')) {
    branchName = 'Phân hiệu TH và THCS Xuân Quang 2';
    if (capBienChe === 'THCS' || capBoTri === 'THCS') {
      campusId = 'CS_THCS_TRIEM_DUC';
      campusName = 'Điểm trường THCS Triêm Đức';
    } else {
      campusId = 'CS_TH_TRIEM_DUC';
      campusName = 'Điểm trường TH Triêm Đức';
    }
  } else if (rawBranch.includes('XL') || rawBranch.includes('Xuân Long')) {
    branchName = 'Phân hiệu TH và THCS Xuân Long';
    if (capBienChe === 'THCS' || capBoTri === 'THCS') {
      campusId = 'CS_THCS_LONG_MY';
      campusName = 'Điểm trường THCS Long Mỹ';
    } else {
      campusId = 'CS_TH_LONG_MY';
      campusName = 'Điểm trường TH Long Mỹ';
    }
  } else if (rawBranch.includes('LH') || rawBranch.includes('La Hai')) {
    branchName = 'Phân hiệu TH La Hai';
    campusId = 'CS_TH_LA_HAI';
    campusName = 'Điểm trường TH La Hai';
  } else {
    branchName = 'Trụ sở chính Đồng Xuân';
    campusId = 'CS_TRU_SO';
    campusName = 'Điểm Trụ sở chính';
  }

  // Explicit campus override if stated
  if (diemTruong) {
    if (diemTruong.includes('La Hai')) campusName = 'Điểm trường TH La Hai';
    else if (diemTruong.includes('Triêm Đức')) campusName = (capBienChe === 'THCS' || capBoTri === 'THCS') ? 'Điểm trường THCS Triêm Đức' : 'Điểm trường TH Triêm Đức';
    else if (diemTruong.includes('Long Mỹ')) campusName = (capBienChe === 'THCS' || capBoTri === 'THCS') ? 'Điểm trường THCS Long Mỹ' : 'Điểm trường TH Long Mỹ';
    else if (diemTruong.includes('Trụ sở chính')) campusName = 'Điểm Trụ sở chính';
  }

  // Clean username
  let username = '';
  if (id === 'HT01') username = 'hieutruong';
  else if (id === 'PHT01') username = 'pht01';
  else if (id === 'PHT02') username = 'pht02';
  else if (id === 'PHT03') username = 'pht03';
  else if (id === 'GV_IT01') username = 'gvtinhoc';
  else if (id === 'NV_THU_QUY') username = 'thukquy';
  else if (id === 'NV_KE_TOAN') username = 'ketoan';
  else if (id === 'NV_VAN_THU') username = 'vanthu';
  else username = id.toLowerCase();

  // Clean email
  const email = emailRaw || `${makeSlug(name)}.${id.toLowerCase()}@dongxuan.edu.vn`;

  // Clean phone
  const phone = sdt || `09${(stt % 8) + 1}${Math.floor(1000000 + (stt * 43719) % 8999999)}`;

  // Status
  let status = 'ACTIVE';
  let inactivatedDate = undefined;
  let inactivatedReason = undefined;

  if (stt === 19 || trangThaiBienDong.includes('nghỉ hưu')) {
    status = 'INACTIVE';
    inactivatedDate = '2026-10-01';
    inactivatedReason = 'Đã nghỉ hưu theo chế độ (01/10/2026)';
  }

  // Standard Position Title
  let positionTitle = pos;
  if (pos === 'GV TH') positionTitle = `Giáo viên Tiểu học (${team})`;
  else if (pos === 'GV THCS') positionTitle = `Giáo viên THCS (${spec || team})`;
  else if (pos === 'GV chuyên TH') positionTitle = `Giáo viên chuyên trách Tiểu học (${spec})`;
  else if (pos === 'GV hợp đồng') positionTitle = `Giáo viên hợp đồng môn ${spec}`;
  else if (pos === 'PHT') positionTitle = `Phó Hiệu trưởng (${rawBranch})`;
  else if (pos === 'Hiệu trưởng') positionTitle = 'Hiệu trưởng nhà trường';

  // Notes combining all extra metadata
  const notesArr = [];
  if (trangThaiBienDong) notesArr.push(`Biến động: ${trangThaiBienDong}${thoiDiemBienDong ? ` (${thoiDiemBienDong})` : ''}`);
  if (boSung4) notesArr.push(`Bổ sung: ${boSung4}`);
  if (thoiGianBoNhiem) notesArr.push(`Bổ nhiệm: ${thoiGianBoNhiem}`);
  if (thoiDiemTuyenDung) notesArr.push(`Tuyển dụng: ${thoiDiemTuyenDung}`);
  if (thon) notesArr.push(`Công tác tại thôn: ${thon}`);
  const combinedNotes = notesArr.join(' • ') || 'Đang công tác bình thường';

  // 52 columns Sheet AZ
  const sheetAZ = {};
  sheetAZ['A'] = id;
  sheetAZ['B'] = name;
  sheetAZ['C'] = gender;
  sheetAZ['D'] = dob;
  sheetAZ['E'] = cccd || `054${dob ? dob.replace(/\D/g, '').slice(-4) : '0000'}${stt.toString().padStart(5, '0')}`;
  sheetAZ['F'] = '2021-06-15';
  sheetAZ['G'] = danToc;
  sheetAZ['H'] = tonGiao;
  sheetAZ['I'] = phone;
  sheetAZ['J'] = email;
  sheetAZ['K'] = queQuan;
  sheetAZ['L'] = thon ? `Thôn ${thon}, Xã Đồng Xuân, Tỉnh Đắk Lắk` : queQuan;
  sheetAZ['M'] = queQuan;
  sheetAZ['N'] = trinhDoCM || 'Đại học Sư phạm';
  sheetAZ['O'] = spec || (capBienChe === 'TH' ? 'Giáo dục Tiểu học' : 'Sư phạm');
  sheetAZ['P'] = 'Trường ĐH Sư phạm Quy Nhơn';
  sheetAZ['Q'] = dob && dob.length >= 4 ? parseInt(dob.slice(-4), 10) + 22 : 2005;
  sheetAZ['R'] = pos || 'Giáo viên';
  sheetAZ['S'] = team || 'Tổ chuyên môn';
  sheetAZ['T'] = capBoTri === 'TH' ? 'Tiểu học (TH)' : capBoTri === 'THCS' ? 'Trung học cơ sở (THCS)' : 'Cả 2 cấp';
  sheetAZ['U'] = spec || (capBoTri === 'TH' ? 'Văn hóa Tiểu học' : 'Bộ môn THCS');
  sheetAZ['V'] = '';
  sheetAZ['W'] = branchName;
  sheetAZ['X'] = campusName;
  sheetAZ['Y'] = pos.includes('GV') ? 'Có' : 'Không';
  sheetAZ['Z'] = '';
  sheetAZ['AA'] = pos.includes('hợp đồng') ? 'Hợp đồng ngắn hạn' : id.startsWith('BV') ? 'Hợp đồng lao động NĐ 111' : 'Viên chức chính thức';
  sheetAZ['AB'] = thoiDiemTuyenDung || '01/09/2005';
  sheetAZ['AC'] = '01/09/2026';
  sheetAZ['AD'] = age;
  sheetAZ['AE'] = maNgach || (capBoTri === 'TH' ? 'V.07.03.29' : 'V.07.04.32');
  sheetAZ['AF'] = Math.min(9, Math.max(1, Math.floor((age - 22) / 3)));
  sheetAZ['AG'] = parseFloat((2.34 + sheetAZ['AF'] * 0.33).toFixed(2));
  sheetAZ['AH'] = stt === 67 ? 0.7 : (stt === 75 || stt === 49 || stt === 68) ? 0.5 : 0.0;
  sheetAZ['AI'] = 0.3; // Phụ cấp khu vực Đồng Xuân
  sheetAZ['AJ'] = `54${Math.floor(10000000 + stt * 7162)}`;
  sheetAZ['AK'] = `801${Math.floor(1000000 + stt * 9271)}`;
  sheetAZ['AL'] = `4600205${Math.floor(100000 + stt * 3147)}`;
  sheetAZ['AM'] = 'Agribank Chi nhánh Xã Đồng Xuân';
  sheetAZ['AN'] = (llct === 'Cao cấp' || llct === 'Trung cấp') ? 'Đảng viên chính thức' : 'Chưa vào Đảng';
  sheetAZ['AO'] = (llct === 'Cao cấp' || llct === 'Trung cấp') ? '2010-02-03' : '';
  sheetAZ['AP'] = (llct === 'Cao cấp' || llct === 'Trung cấp') ? '2011-02-03' : '';
  sheetAZ['AQ'] = llct || 'Chưa có';
  sheetAZ['AR'] = qlnn || (stt === 67 ? 'Quản lý giáo dục' : 'Chưa có');
  sheetAZ['AS'] = tinhoc || 'Ứng dụng CNTT cơ bản';
  sheetAZ['AT'] = ngoaingu || 'Bậc 2 (A2 khung Châu Âu)';
  sheetAZ['AU'] = capBoTri === 'TH' ? 23 : 19;
  sheetAZ['AV'] = capBoTri === 'TH' ? 23 : 19;
  sheetAZ['AW'] = status === 'INACTIVE' ? 'Nghỉ hưu' : 'Tốt';
  sheetAZ['AX'] = 'Hoàn thành tốt';
  sheetAZ['AY'] = (stt === 67 || stt === 75 || stt === 49 || stt === 68) ? 'Chiến sĩ thi đua cơ sở' : 'Lao động tiên tiến';
  sheetAZ['AZ'] = combinedNotes;

  return {
    stt,
    account: {
      id,
      username,
      name,
      role,
      position: positionTitle,
      email,
      phone,
      campusId,
      campusName,
      branchName,
      status,
      inactivatedDate,
      inactivatedReason,
      isTemporaryPassword: false,
      driveFolderId: `1DRIVE_DX_${id}`,
      sheetFileId: `1SHEET_DX_${id}`,
      sheetUrl: `https://docs.google.com/spreadsheets/d/1SHEET_DX_${id}/edit`,
      avatar: stt === 67 ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' : undefined,
    },
    sheetDataAZ: sheetAZ,
  };
});

console.log(`Generated ${staffRecords.length} staff records.`);

// Create TypeScript export content
const outputTs = `/**
 * DANH SÁCH CHÍNH THỨC 137 HIỆU TRƯỞNG, PHÓ HIỆU TRƯỞNG, GIÁO VIÊN, NHÂN VIÊN VÀ BẢO VỆ
 * Năm học 2026 - 2027
 * Trường Tiểu học & Trung học Cơ sở Đồng Xuân - Thôn Long Châu, Xã Đồng Xuân, Tỉnh Đắk Lắk
 * Chuẩn hóa 52 Cột Google Sheet A-AZ và hệ thống phân quyền
 */

import { UserAccount } from '../types/school';

export interface OfficialStaffItem {
  account: UserAccount;
  sheetDataAZ: Record<string, string | number | boolean>;
}

export const OFFICIAL_137_STAFF: OfficialStaffItem[] = ${JSON.stringify(staffRecords.map(r => ({ account: r.account, sheetDataAZ: r.sheetDataAZ })), null, 2)};

export const INITIAL_STAFF = OFFICIAL_137_STAFF;
`;

const outputPath = path.join(__dirname, '../src/data/officialStaffList.ts');
fs.writeFileSync(outputPath, outputTs, 'utf8');
console.log(`Wrote official staff list to ${outputPath}`);
