import React, { useState, useMemo } from 'react';
import { UserAccount, SchoolClass, PrimaryGradeRecord, SecondaryGradeRecord } from '../types/school';
import { canViewClassStudentRoster, canEditClassStudentRoster } from '../utils/permissionUtils';
import {
  GraduationCap,
  BookOpen,
  Filter,
  Search,
  Save,
  Send,
  Printer,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  ShieldAlert,
  Mail,
  Calculator,
  Award,
} from 'lucide-react';

interface ElectronicGradebookProps {
  currentUser: UserAccount | null;
  classes: SchoolClass[];
  activeSchoolYear: string;
}

export const ElectronicGradebook: React.FC<ElectronicGradebookProps> = ({
  currentUser,
  classes,
  activeSchoolYear,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [semester, setSemester] = useState<'Học kỳ 1' | 'Học kỳ 2' | 'Cả năm'>('Học kỳ 1');
  const [subject, setSubject] = useState<string>('Toán học');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  // Check permission for this class
  const canViewClass = canViewClassStudentRoster(
    currentUser,
    selectedClass?.homeroomTeacherId,
    selectedClass?.previousHomeroomTeacherIds
  );
  const canEditClass = canEditClassStudentRoster(
    currentUser,
    selectedClass?.homeroomTeacherId,
    selectedClass?.previousHomeroomTeacherIds
  );

  // Available subjects based on level
  const subjectsList = useMemo(() => {
    if (!selectedClass) return ['Toán', 'Tiếng Việt'];
    if (selectedClass.level === 'TH') {
      return ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tự nhiên & Xã hội', 'Khoa học', 'Lịch sử & Địa lí', 'Đạo đức', 'Tin học', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất'];
    }
    return ['Toán học', 'Ngữ văn', 'Tiếng Anh', 'KHTN (Lý - Hóa - Sinh)', 'Lịch sử & Địa lí', 'GDCD', 'Tin học', 'Công nghệ', 'Âm nhạc & Mĩ thuật', 'Giáo dục thể chất'];
  }, [selectedClass]);

  // In-memory state for grades of current class & subject
  const [primaryGrades, setPrimaryGrades] = useState<Record<string, { mid: 'T' | 'H' | 'C'; end: 'T' | 'H' | 'C'; score: number; comp: 'T' | 'Đ' | 'C'; qual: 'T' | 'Đ' | 'C'; comment: string }>>({});
  const [secondaryGrades, setSecondaryGrades] = useState<Record<string, { tx1: number; tx2: number; tx3: number; gk: number; ck: number; conduct: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt'; comment: string }>>({});

  // Calculate secondary average score
  const calculateAverage = (tx1: number, tx2: number, tx3: number, gk: number, ck: number) => {
    const total = tx1 + tx2 + tx3 + (gk * 2) + (ck * 3);
    const avg = total / 7;
    return Math.round(avg * 10) / 10;
  };

  const calculateAcademicRank = (avg: number) => {
    if (avg >= 8.0) return 'Tốt (Giỏi)';
    if (avg >= 6.5) return 'Khá';
    if (avg >= 5.0) return 'Đạt (TB)';
    return 'Chưa đạt';
  };

  const handleSendEmailReminder = (studentName: string, parentPhone: string) => {
    setNotificationStatus(`Đã gửi thông báo kết quả học tập của em ${studentName} đến email phụ huynh (SĐT: ${parentPhone}) thành công!`);
    setTimeout(() => setNotificationStatus(null), 4000);
  };

  const handleSendAllEmails = () => {
    setNotificationStatus(`Đã gửi thông báo sổ điểm điện tử của toàn bộ ${selectedClass?.students.length || 0} học sinh lớp ${selectedClass?.name} đến phụ huynh.`);
    setTimeout(() => setNotificationStatus(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 text-cyan-300 text-xs font-bold border border-blue-500/30 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>SỔ ĐIỂM ĐIỆN TỬ THEO THÔNG TƯ 27 (TIỂU HỌC) & THÔNG TƯ 22 (THCS)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Sổ Điểm Điện Tử & Đánh Giá Kết Quả Học Tập Học Sinh
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Hệ thống quản lý điểm số, nhận xét phẩm chất năng lực học sinh Tiểu học và tự động tính điểm trung bình,
              xếp loại học lực học sinh THCS kèm thông báo tức thời cho phụ huynh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSendAllEmails}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs shadow transition"
            >
              <Mail className="w-4 h-4" />
              <span>Gửi Báo Điểm Cho Tất Cả PH</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>In Sổ Điểm Lớp</span>
            </button>
          </div>
        </div>
      </div>

      {notificationStatus && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{notificationStatus}</span>
          </div>
          <button type="button" onClick={() => setNotificationStatus(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Class & Subject Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chọn Lớp Học:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Lớp {cls.name} ({cls.level}) - {cls.campusName} (GVCN: {cls.homeroomTeacherName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Môn Học:</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800"
            >
              {subjectsList.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Học Kỳ:</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800"
            >
              <option value="Học kỳ 1">Học kỳ 1</option>
              <option value="Học kỳ 2">Học kỳ 2</option>
              <option value="Cả năm">Cả năm</option>
            </select>
          </div>
        </div>

        <div className="relative min-w-[220px]">
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tìm Học Sinh:</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nhập tên học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Security Check: GV bộ môn không coi được danh sách chi tiết lớp khác */}
      {!canViewClass ? (
        <div className="bg-white rounded-3xl border border-amber-200 p-8 text-center max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Bảo Mật Sổ Điểm Lớp Học</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Theo quy định bảo mật của nhà trường, giáo viên bộ môn không được xem danh sách chi tiết học sinh của lớp
            này. Chỉ <strong>GVCN {selectedClass?.homeroomTeacherName}</strong> hoặc Ban Giám hiệu mới có quyền truy cập.
          </p>
          <div className="bg-slate-50 p-2.5 rounded-xl border text-[11px] text-slate-500">
            Bạn đang đăng nhập với tư cách: <strong>{currentUser?.name}</strong> ({currentUser?.position})
          </div>
        </div>
      ) : (
        /* SỔ ĐIỂM CHI TIẾT */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          {/* Class Info Subheader */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-700 text-white font-black text-xs">
                LỚP {selectedClass.name}
              </span>
              <span className="text-xs font-bold text-slate-700">Môn: {subject}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">GVCN: {selectedClass.homeroomTeacherName}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">📍 {selectedClass.campusName}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Quy chế: {selectedClass.level === 'TH' ? 'Thông tư 27/2020/TT-BGDĐT' : 'Thông tư 22/2021/TT-BGDĐT'}
              </span>
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Điểm</span>
              </button>
            </div>
          </div>

          {/* TABLE: CẤP TIỂU HỌC (THÔNG TƯ 27) */}
          {selectedClass.level === 'TH' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">STT</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Họ và Tên Học Sinh</th>
                    <th className="py-2.5 px-3 text-center">Giữa kỳ (T/H/C)</th>
                    <th className="py-2.5 px-3 text-center">Cuối kỳ (T/H/C)</th>
                    <th className="py-2.5 px-3 text-center">Điểm KT (0-10)</th>
                    <th className="py-2.5 px-3 text-center">Năng Lực (T/Đ/C)</th>
                    <th className="py-2.5 px-3 text-center">Phẩm Chất (T/Đ/C)</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Nhận Xét Của Giáo Viên</th>
                    <th className="py-2.5 px-3 text-center">Báo PH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedClass.students
                    .filter((s) => !searchTerm || s.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((st, idx) => (
                      <tr key={st.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-extrabold text-slate-900 block">{st.fullName}</span>
                          <span className="text-[10px] text-slate-400">
                            {st.gender} • Ngày sinh: {st.dob}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <select className="px-1.5 py-1 rounded border border-slate-200 text-xs font-bold bg-slate-50">
                            <option value="T">T (Tốt)</option>
                            <option value="H">H (Đạt)</option>
                            <option value="C">C (Cố gắng)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <select className="px-1.5 py-1 rounded border border-slate-200 text-xs font-bold bg-slate-50">
                            <option value="T">T (Tốt)</option>
                            <option value="H">H (Đạt)</option>
                            <option value="C">C (Cố gắng)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            defaultValue={idx % 3 === 0 ? 9 : 8}
                            className="w-14 px-1.5 py-1 rounded border border-slate-300 text-center font-black text-xs text-blue-700"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <select className="px-1.5 py-1 rounded border border-slate-200 text-xs font-bold text-emerald-800 bg-emerald-50">
                            <option value="T">T</option>
                            <option value="Đ">Đ</option>
                            <option value="C">C</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <select className="px-1.5 py-1 rounded border border-slate-200 text-xs font-bold text-emerald-800 bg-emerald-50">
                            <option value="T">T</option>
                            <option value="Đ">Đ</option>
                            <option value="C">C</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            defaultValue={
                              idx % 2 === 0
                                ? 'Nắm vững kiến thức, tiếp thu bài nhanh, chữ viết sạch đẹp.'
                                : 'Có tiến bộ trong tính toán, cần rèn thêm kỹ năng đọc diễn cảm.'
                            }
                            className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-slate-700 bg-slate-50"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSendEmailReminder(st.fullName, st.parentPhone)}
                            title="Gửi báo cáo điểm về email / tin nhắn phụ huynh"
                            className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* TABLE: CẤP THCS (THÔNG TƯ 22) */
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">STT</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Họ và Tên Học Sinh</th>
                    <th className="py-2.5 px-2 text-center">ĐĐGtx 1</th>
                    <th className="py-2.5 px-2 text-center">ĐĐGtx 2</th>
                    <th className="py-2.5 px-2 text-center">ĐĐGtx 3</th>
                    <th className="py-2.5 px-2 text-center">ĐĐGgk (x2)</th>
                    <th className="py-2.5 px-2 text-center">ĐĐGck (x3)</th>
                    <th className="py-2.5 px-2 text-center text-blue-700">ĐTBm</th>
                    <th className="py-2.5 px-2 text-center">Học Lực</th>
                    <th className="py-2.5 px-2 text-center">Rèn Luyện</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Nhận Xét Chuyên Môn</th>
                    <th className="py-2.5 px-3 text-center">Báo PH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedClass.students
                    .filter((s) => !searchTerm || s.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((st, idx) => {
                      const tx1 = 7.5 + (idx % 3) * 0.5;
                      const tx2 = 8.0;
                      const tx3 = 7.0 + (idx % 2);
                      const gk = 8.0;
                      const ck = 8.5;
                      const avg = calculateAverage(tx1, tx2, tx3, gk, ck);
                      const rank = calculateAcademicRank(avg);

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-extrabold text-slate-900 block">{st.fullName}</span>
                            <span className="text-[10px] text-slate-400">
                              Mã HS: {st.id} • PH: {st.parentName}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min={0}
                              max={10}
                              defaultValue={tx1}
                              className="w-12 px-1 py-1 rounded border border-slate-300 text-center font-bold text-xs"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min={0}
                              max={10}
                              defaultValue={tx2}
                              className="w-12 px-1 py-1 rounded border border-slate-300 text-center font-bold text-xs"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min={0}
                              max={10}
                              defaultValue={tx3}
                              className="w-12 px-1 py-1 rounded border border-slate-300 text-center font-bold text-xs"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center bg-blue-50/40">
                            <input
                              type="number"
                              step="0.5"
                              min={0}
                              max={10}
                              defaultValue={gk}
                              className="w-12 px-1 py-1 rounded border border-blue-300 text-center font-bold text-xs text-blue-800"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center bg-blue-50/60">
                            <input
                              type="number"
                              step="0.5"
                              min={0}
                              max={10}
                              defaultValue={ck}
                              className="w-12 px-1 py-1 rounded border border-blue-400 text-center font-black text-xs text-blue-900"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center font-black text-blue-700 text-xs bg-slate-100">
                            {avg}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                              {rank}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <select className="px-1 py-0.5 rounded border border-slate-200 text-xs font-semibold">
                              <option value="Tốt">Tốt</option>
                              <option value="Khá">Khá</option>
                              <option value="Đạt">Đạt</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              defaultValue="Chăm chỉ, tích cực phát biểu xây dựng bài, bài tập về nhà làm đầy đủ."
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-slate-700 bg-slate-50"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleSendEmailReminder(st.fullName, st.parentPhone)}
                              title="Gửi báo cáo điểm đến email phụ huynh"
                              className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
