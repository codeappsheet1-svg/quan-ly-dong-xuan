import React, { useState } from 'react';
import { ALL_CAMPUSES, BRANCHES_DATA } from '../data/initialData';
import { storageService } from '../services/storageService';
import { UserAccount, SchoolClass } from '../types/school';
import {
  UserPlus,
  KeyRound,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  School,
  Building,
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [regType, setRegType] = useState<'STAFF' | 'CLASS'>('STAFF');
  const [role, setRole] = useState<'GV' | 'NV' | 'NV_HD_BV'>('GV');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('Giáo viên bộ môn');
  const [campusName, setCampusName] = useState(ALL_CAMPUSES[0].name);
  const [branchName, setBranchName] = useState(BRANCHES_DATA[0].name);

  // Class registration state
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState(6);
  const [classLevel, setClassLevel] = useState<'TH' | 'THCS'>('THCS');
  const [initialCount, setInitialCount] = useState(30);
  const [homeroomTeacherName, setHomeroomTeacherName] = useState('');

  // Result state
  const [createdResult, setCreatedResult] = useState<{
    id: string;
    tempPassword?: string;
    sheetUrl: string;
    name: string;
    roleDesc: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (regType === 'STAFF') {
      const { newAccount, tempPassword, sheetUrl } = storageService.registerNewStaff({
        fullName,
        role,
        phone,
        email,
        position,
        branchName,
        campusName,
        subjectOrJob: position,
      });

      setCreatedResult({
        id: newAccount.id,
        tempPassword,
        sheetUrl,
        name: newAccount.name,
        roleDesc:
          role === 'GV'
            ? 'Giáo viên'
            : role === 'NV'
            ? 'Nhân viên hành chính'
            : 'Bảo vệ / Nhân viên HĐ',
      });
    } else {
      const { newClass, sheetUrl } = storageService.registerNewClass({
        name: className,
        grade: classGrade,
        level: classLevel,
        campusName,
        branchName,
        homeroomTeacherName: homeroomTeacherName || 'Chưa phân công',
        initialStudentCount: initialCount,
      });

      setCreatedResult({
        id: newClass.id,
        sheetUrl,
        name: `Lớp ${newClass.name}`,
        roleDesc: `Lớp học (${newClass.level})`,
      });
    }

    onSuccess();
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `HỆ THỐNG QUẢN LÝ TRƯỜNG TH & THCS ĐỒNG XUÂN\nTài khoản mới cấp:\n- ID Đăng nhập: ${createdResult.id}\n- Mật khẩu tạm thời: ${createdResult.tempPassword || 'Không áp dụng'}\n- File Google Sheet 52 Cột (A-AZ): ${createdResult.sheetUrl}\n(Yêu cầu đổi mật khẩu ngay sau khi đăng nhập lần đầu)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleResetAndClose = () => {
    setCreatedResult(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setClassName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {createdResult ? 'Khởi Tạo Thành Công!' : 'Đăng Ký Nhân Sự / Lớp Học Mới'}
            </h3>
            <p className="text-xs text-slate-500">
              Tự động cấp ID, mật khẩu tạm thời và sinh File Google Sheet 52 Cột (A-AZ) trong Drive.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {!createdResult ? (
          <form onSubmit={handleRegister} className="mt-5 space-y-4 text-xs">
            {/* Registration type selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRegType('STAFF')}
                className={`py-2 rounded-lg font-bold text-xs transition ${
                  regType === 'STAFF' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                1. Giáo Viên / Nhân Viên / Bảo Vệ
              </button>
              <button
                type="button"
                onClick={() => setRegType('CLASS')}
                className={`py-2 rounded-lg font-bold text-xs transition ${
                  regType === 'CLASS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                2. Lớp Học Mới
              </button>
            </div>

            {regType === 'STAFF' ? (
              <>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đối tượng nhân sự:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="GV">Giáo viên (GV TH hoặc THCS)</option>
                    <option value="NV">Nhân viên hành chính / kế toán / thư viện</option>
                    <option value="NV_HD_BV">Bảo vệ & Nhân viên hợp đồng NĐ 111</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ và tên đầy đủ:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Trần Văn Bình"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Số điện thoại:</label>
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email liên lạc:</label>
                    <input
                      type="email"
                      placeholder="email@dongxuan.edu.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chức danh / Vị trí phân công:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Giáo viên Toán THCS, Nhân viên Kế toán, Bảo vệ..."
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phân hiệu:</label>
                    <select
                      value={branchName}
                      onChange={(e) => {
                        setBranchName(e.target.value);
                        const b = BRANCHES_DATA.find((x) => x.name === e.target.value);
                        if (b && b.campuses[0]) setCampusName(b.campuses[0].name);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      {BRANCHES_DATA.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Điểm trường phân công:</label>
                    <select
                      value={campusName}
                      onChange={(e) => setCampusName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      {ALL_CAMPUSES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              /* Class Registration Form */
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tên lớp học:</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 6D, 1C..."
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Khối học:</label>
                    <select
                      value={classGrade}
                      onChange={(e) => {
                        const g = Number(e.target.value);
                        setClassGrade(g);
                        setClassLevel(g <= 5 ? 'TH' : 'THCS');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                        <option key={g} value={g}>
                          Khối {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Điểm trường đặt lớp:</label>
                    <select
                      value={campusName}
                      onChange={(e) => setCampusName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      {ALL_CAMPUSES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sĩ số học sinh ban đầu:</label>
                    <input
                      type="number"
                      required
                      value={initialCount}
                      onChange={(e) => setInitialCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ tên Giáo viên chủ nhiệm (nếu có):</label>
                  <input
                    type="text"
                    placeholder="VD: Cô Nguyễn Thị Thu..."
                    value={homeroomTeacherName}
                    onChange={(e) => setHomeroomTeacherName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Khởi Tạo & Tự Động Sinh Sheet Drive</span>
              </button>
            </div>
          </form>
        ) : (
          /* RESULT DISPLAY */
          <div className="mt-5 space-y-4 text-xs animate-fadeIn">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Đã Khởi Tạo Hồ Sơ Điện Tử Thành Công!</span>
              </div>
              <p className="text-emerald-700 leading-relaxed">
                Hệ thống đã lưu thông tin vào cơ sở dữ liệu và tự động sinh 1 tệp Google Sheet riêng biệt gồm đúng{' '}
                <strong>52 cột từ A đến AZ</strong> trong Google Drive của Trường Đồng Xuân.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 font-mono">
              <div className="flex items-center justify-between text-slate-500 font-sans text-xs">
                <span className="font-bold text-slate-800">Thông tin cấp phát:</span>
                <span className="text-red-700 font-bold">{createdResult.roleDesc}</span>
              </div>

              <div className="space-y-1.5 text-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">Mã đăng nhập (ID): </span>
                  <strong className="text-red-700 text-sm">{createdResult.id}</strong>
                </div>

                {createdResult.tempPassword && (
                  <div>
                    <span className="text-slate-500">Mật khẩu tạm thời: </span>
                    <strong className="text-blue-700 text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {createdResult.tempPassword}
                    </strong>
                  </div>
                )}

                <div className="truncate font-sans text-xs">
                  <span className="text-slate-500">Google Sheet (A-AZ): </span>
                  <a
                    href={createdResult.sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>Mở file Google Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-[11px] space-y-1">
              <strong>Lưu ý quan trọng cho người dùng:</strong>
              <p>
                - Sử dụng mã ID và mật khẩu tạm thời trên để đăng nhập.
              </p>
              <p>
                - Sau khi đăng nhập lần đầu, người dùng tự đổi sang mật khẩu cá nhân để bảo mật.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center gap-2 shadow"
              >
                <Copy className="w-4 h-4 text-amber-400" />
                <span>{copied ? 'Đã Sao Chép!' : 'Sao Chép Thông Tin'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
