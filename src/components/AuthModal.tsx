import React, { useState } from 'react';
import { UserAccount } from '../types/school';
import { storageService } from '../services/storageService';
import {
  LogIn,
  KeyRound,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  isChangePasswordOnly?: boolean;
  currentUser: UserAccount | null;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  onPasswordChanged: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  isChangePasswordOnly = false,
  currentUser,
  onClose,
  onLoginSuccess,
  onPasswordChanged,
}) => {
  const [usernameOrId, setUsernameOrId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(isChangePasswordOnly);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const staffList = storageService.getStaffList();
    const cleanInput = usernameOrId.trim().toLowerCase();

    const found = staffList.find(
      (s) =>
        s.account.id.toLowerCase() === cleanInput ||
        s.account.username.toLowerCase() === cleanInput ||
        s.account.phone === usernameOrId.trim()
    );

    if (!found) {
      setErrorMessage(
        'Không tìm thấy mã định danh hoặc tên đăng nhập này trong hệ thống trường Đồng Xuân. Vui lòng kiểm tra lại.'
      );
      return;
    }

    // Check password: match account password, or tempPassword, or default "123456" for demo convenience
    const validPass =
      password === (found.account.password || '123456') ||
      password === '123456' ||
      found.account.isTemporaryPassword;

    if (!validPass) {
      setErrorMessage('Mật khẩu không chính xác. Mật khẩu mặc định hệ thống: 123456');
      return;
    }

    // Success login
    storageService.setCurrentUser(found.account);
    storageService.addSyncLog(
      'Đăng nhập hệ thống',
      `Đồng chí ${found.account.name} (${found.account.id}) đã đăng nhập vào hệ thống.`
    );

    // If temporary password is required to change, switch to change password view
    if (found.account.isTemporaryPassword) {
      setIsChangingPassword(true);
    } else {
      onLoginSuccess(found.account);
      onClose();
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự để đảm bảo an toàn.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không trùng khớp. Vui lòng gõ lại.');
      return;
    }

    const userId = currentUser ? currentUser.id : usernameOrId.trim().toUpperCase();
    const success = storageService.updatePassword(userId, newPassword);

    if (success) {
      onPasswordChanged();
      onClose();
    } else {
      setErrorMessage('Có lỗi xảy ra khi đổi mật khẩu.');
    }
  };

  const handleQuickLogin = (id: string) => {
    const staffList = storageService.getStaffList();
    const found = staffList.find((s) => s.account.id === id);
    if (found) {
      storageService.setCurrentUser(found.account);
      onLoginSuccess(found.account);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              ĐX
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {isChangingPassword ? 'Đổi Mật Khẩu Cá Nhân' : 'Đăng Nhập Hệ Thống Nội Bộ'}
              </h3>
              <p className="text-[11px] text-slate-500">Trường Tiểu học & THCS Đồng Xuân</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isChangingPassword ? (
          <form onSubmit={handleLogin} className="mt-5 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Mã định danh (ID) hoặc Tên đăng nhập:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="VD: HT01, GV_CS01, GV_IT01, NV01, BV05..."
                  value={usernameOrId}
                  onChange={(e) => setUsernameOrId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mật khẩu:</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu (Mặc định: 123456)..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập Vào Hệ Thống</span>
            </button>

            {/* Quick Demo Login Buttons */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Đăng nhập nhanh kiểm thử theo vai trò:
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('HT01')}
                  className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 font-bold text-left truncate"
                >
                  👑 HT Nguyễn Quốc Bảo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('GV_IT01')}
                  className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-left truncate"
                >
                  💻 Quản trị IT Minh
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('GV_CS01')}
                  className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-left truncate"
                >
                  🧑‍🏫 GV THCS Dũng (9A)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('NV01')}
                  className="p-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-left truncate"
                >
                  📑 Kế toán viên Hà
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* CHANGE PASSWORD FORM */
          <form onSubmit={handleChangePassword} className="mt-5 space-y-4 text-xs">
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Vui lòng đặt mật khẩu mới để bảo mật dữ liệu Google Sheet cá nhân của đồng chí.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mật khẩu mới (tối thiểu 6 ký tự):</label>
              <input
                type="password"
                required
                placeholder="Nhập mật khẩu mới..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Xác nhận lại mật khẩu mới:</label>
              <input
                type="password"
                required
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
              >
                Bỏ qua
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Lưu Mật Khẩu Mới</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          Hệ thống Quản lý nội bộ trường học, do Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng, mọi sao chép đều phải xin phép.
        </div>
      </div>
    </div>
  );
};
