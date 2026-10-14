import React, { useState } from 'react';
import { UserAccount } from '../types/school';
import {
  COLUMN_LETTERS,
  TEACHER_COLUMNS_AZ,
  STAFF_COLUMNS_AZ,
  GUARD_COLUMNS_AZ,
} from '../types/sheetColumns';
import { storageService } from '../services/storageService';
import {
  Save,
  Printer,
  ExternalLink,
  CheckCircle,
  FileSpreadsheet,
  Grid3X3,
  Layers,
  Search,
  RefreshCw,
  Lock,
  Building,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

interface ProfileSheetAtoAZProps {
  user: UserAccount;
  onRefreshData?: () => void;
  onOpenPrintModal?: (title: string, content: React.ReactNode) => void;
}

export const ProfileSheetAtoAZ: React.FC<ProfileSheetAtoAZProps> = ({
  user,
  onRefreshData,
  onOpenPrintModal,
}) => {
  const [dataAZ, setDataAZ] = useState<Record<string, string | number | boolean>>(() => {
    return storageService.getUserSheetData(user.id);
  });
  const [isSaved, setIsSaved] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'cards'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ col: string; label: string; value: string | number | boolean }>({
    col: 'A',
    label: 'Mã định danh',
    value: user.id,
  });

  // Determine which column definitions to use
  const columnsDef =
    user.role === 'NV'
      ? STAFF_COLUMNS_AZ
      : user.role === 'NV_HD_BV'
      ? GUARD_COLUMNS_AZ
      : TEACHER_COLUMNS_AZ;

  const handleFieldChange = (col: string, val: string | number | boolean) => {
    setDataAZ((prev) => ({
      ...prev,
      [col]: val,
    }));
    setIsSaved(false);
  };

  const handleSaveToSheet = () => {
    storageService.saveUserSheetData(user.id, dataAZ);
    setIsSaved(true);
    if (onRefreshData) onRefreshData();
    setTimeout(() => setIsSaved(false), 3500);
  };

  const filteredColumns = columnsDef.filter(
    (c) =>
      c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.col.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['Hành chính', 'Chuyên môn', 'Chính sách - Lương', 'Đảng - Đoàn', 'Liên hệ', 'Khác'] as const;

  return (
    <div className="space-y-6">
      {/* Top Banner Card: Personal Google Sheet File Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -z-0 pointer-events-none opacity-60"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-700 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-300">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                user.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Mã đăng nhập: {user.id}
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {user.position}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{user.name}</h2>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {user.campusName} ({user.branchName})
                </span>
                <span>•</span>
                <span>Google Sheet: <strong>52 Cột (A - AZ)</strong></span>
                <span>•</span>
                <span className="text-emerald-700 font-medium">Trạng thái: Đã kết nối Drive</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={handleSaveToSheet}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Lưu vào Google Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>In Hồ Sơ Chuẩn A4</span>
            </button>

            <a
              href={user.sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition"
              title="Mở Google Sheet cá nhân trực tiếp"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Mở Google Sheet</span>
              <ExternalLink className="w-3 h-3 text-emerald-500" />
            </a>
          </div>
        </div>

        {/* Save confirmation toast */}
        {isSaved && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>Đã lưu thành công!</strong> Dữ liệu 52 cột (A đến AZ) của đồng chí <strong>{user.name}</strong> đã được đồng bộ lên Google Sheet và Google Drive nội bộ trường Đồng Xuân.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-600">Sync: Vừa xong</span>
          </div>
        )}
      </div>

      {/* Control Bar: View Switcher & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chế độ xem:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
                activeView === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Khối Nghiệp Vụ (Chuẩn BGD)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
                activeView === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bảng Tính Google Sheet (Cột A - AZ)</span>
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo cột (A, B, AZ...) hoặc tên chỉ tiêu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* VIEW 1: AUTHENTIC GOOGLE SHEET SPREADSHEET VIEW */}
      {activeView === 'grid' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Formula Bar Simulation */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-3 text-xs font-mono">
            <div className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-700 min-w-16 text-center">
              [{selectedCell.col}6]
            </div>
            <div className="text-slate-400 font-sans font-bold">fx</div>
            <input
              type="text"
              value={String(dataAZ[selectedCell.col] ?? '')}
              onChange={(e) => handleFieldChange(selectedCell.col, e.target.value)}
              placeholder="Giá trị ô dữ liệu..."
              className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-sans text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="text-[11px] text-slate-400 font-sans hidden md:inline">
              Chỉ tiêu: <strong className="text-slate-700">{selectedCell.label}</strong>
            </div>
          </div>

          {/* Grid Container */}
          <div className="overflow-x-auto max-h-[600px] border-b border-slate-200">
            <table className="w-full text-xs border-collapse">
              <thead>
                {/* Header row 1: Columns Letters A, B, C ... AZ */}
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-300 select-none">
                  <th className="w-12 py-2 px-2 text-center bg-slate-200 border-r border-slate-300 font-bold text-[11px]">
                    #
                  </th>
                  {columnsDef.map((col) => (
                    <th
                      key={col.col}
                      className={`min-w-36 py-2 px-2 text-center border-r border-slate-200 font-bold ${
                        selectedCell.col === col.col ? 'bg-blue-100 text-blue-900 ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="font-mono text-xs">{col.col}</div>
                      <div className="text-[10px] font-normal text-slate-500 truncate mt-0.5">{col.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Row 5: Column Title in Google Sheet */}
                <tr className="bg-blue-900 text-white font-semibold text-[11px]">
                  <td className="text-center font-mono py-1.5 bg-slate-200 text-slate-700 border-r border-slate-300">5</td>
                  {columnsDef.map((col) => (
                    <td key={col.col} className="p-2 border-r border-blue-800 text-center truncate max-w-48">
                      {col.label}
                    </td>
                  ))}
                </tr>

                {/* Row 6: User Data */}
                <tr className="hover:bg-blue-50/40">
                  <td className="text-center font-mono py-2 bg-slate-200 text-slate-700 border-r border-slate-300 font-bold">
                    6
                  </td>
                  {columnsDef.map((col) => {
                    const isSelected = selectedCell.col === col.col;
                    const val = dataAZ[col.col] ?? '';
                    return (
                      <td
                        key={col.col}
                        onClick={() =>
                          setSelectedCell({
                            col: col.col,
                            label: col.label,
                            value: val,
                          })
                        }
                        className={`p-1 border-r border-b border-slate-200 cursor-cell transition ${
                          isSelected ? 'bg-blue-50 ring-2 ring-blue-500 inset-0' : ''
                        }`}
                      >
                        <input
                          type="text"
                          value={String(val)}
                          onChange={(e) => handleFieldChange(col.col, e.target.value)}
                          className="w-full px-2 py-1 bg-transparent focus:bg-white text-xs border border-transparent focus:border-blue-400 rounded outline-none"
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200">
            <span>Hiển thị đầy đủ 52 Cột (A đến AZ). Nhấp vào ô bất kỳ để chỉnh sửa trực tiếp.</span>
            <span className="font-semibold text-slate-700">Trường TH & THCS Đồng Xuân • Bản quyền Nguyễn Quốc Bảo</span>
          </div>
        </div>
      )}

      {/* VIEW 2: SMART CATEGORIZED RESUME CARDS (CHUẨN BỘ GIÁO DỤC) */}
      {activeView === 'cards' && (
        <div className="space-y-6">
          {categories.map((cat, idx) => {
            const catCols = filteredColumns.filter((c) => c.category === cat);
            if (catCols.length === 0) return null;

            return (
              <div key={cat} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                      Khối dữ liệu: {cat}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {catCols.length} chỉ tiêu
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catCols.map((col) => {
                    const val = dataAZ[col.col] ?? '';
                    return (
                      <div
                        key={col.col}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-slate-300 font-extrabold text-blue-700">
                              Cột {col.col}
                            </span>
                            <span>{col.label}</span>
                          </label>
                          {col.required && <span className="text-red-500 text-xs font-bold">*</span>}
                        </div>

                        {col.type === 'select' && col.options ? (
                          <select
                            value={String(val)}
                            onChange={(e) => handleFieldChange(col.col, e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
                          >
                            <option value="">-- Chọn {col.label} --</option>
                            {col.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : col.type === 'date' ? (
                          <input
                            type="date"
                            value={String(val)}
                            onChange={(e) => handleFieldChange(col.col, e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
                          />
                        ) : col.type === 'number' ? (
                          <input
                            type="number"
                            value={val === '' ? '' : Number(val)}
                            onChange={(e) => handleFieldChange(col.col, e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(val)}
                            onChange={(e) => handleFieldChange(col.col, e.target.value)}
                            placeholder={`Nhập ${col.label.toLowerCase()}...`}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Bottom Floating Save Bar */}
          <div className="sticky bottom-4 z-30 bg-slate-900/95 backdrop-blur text-white p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                Toàn bộ dữ liệu chỉnh sửa sẽ được lưu trực tiếp vào file Google Sheet cá nhân tương ứng trong Google Drive của trường.
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveToSheet}
                className="w-full sm:w-auto px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thay Đổi Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY OFFICIAL A4 RESUME FORMAT */}
      <div className="hidden print:block print:p-8 bg-white text-black font-sans leading-normal">
        <div className="text-center pb-4 border-b-2 border-black">
          <div className="font-bold text-sm uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="font-bold text-xs uppercase underline">Độc lập - Tự do - Hạnh phúc</div>
          <div className="mt-4 text-xs font-bold text-slate-700">ỦY BAN NHÂN DÂN XÃ ĐỒNG XUÂN - TRƯỜNG TH & THCS ĐỒNG XUÂN</div>
          <div className="mt-2 text-base font-black uppercase">
            SƠ YẾU LÝ LỊCH VIÊN CHỨC & HỒ SƠ ĐIỆN TỬ CÁ NHÂN (CỘT A ĐẾN AZ)
          </div>
          <div className="text-[10px] italic mt-1">
            Hệ thống Quản lý nội bộ trường học, do Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng, mọi sao chép đều phải xin phép.
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
          {columnsDef.map((col) => (
            <div key={col.col} className="flex border-b border-slate-200 py-1">
              <span className="font-bold w-48 text-slate-700">[{col.col}] {col.label}:</span>
              <span className="flex-1 font-semibold">{String(dataAZ[col.col] || '—')}</span>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-between text-xs text-center">
          <div>
            <div className="font-bold uppercase">NGƯỜI KHAI BÁO</div>
            <div className="italic text-[10px]">(Ký và ghi rõ họ tên)</div>
            <div className="mt-16 font-bold">{user.name}</div>
          </div>
          <div>
            <div className="italic">Đồng Xuân, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
            <div className="font-bold uppercase">HIỆU TRƯỞNG PHÊ DUYỆT</div>
            <div className="italic text-[10px]">(Ký tên và đóng dấu)</div>
            <div className="mt-16 font-bold">Nguyễn Quốc Bảo</div>
          </div>
        </div>
      </div>
    </div>
  );
};
