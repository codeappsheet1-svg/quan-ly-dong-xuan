import React, { useState, useMemo } from 'react';
import { UserAccount, CashbookEntry, CashbookFundType } from '../types/school';
import { storageService } from '../services/storageService';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  DollarSign,
  PlusCircle,
  Search,
  Filter,
  Printer,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface PrincipalCashbookProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
}

export const PrincipalCashbook: React.FC<PrincipalCashbookProps> = ({
  currentUser,
  activeSchoolYear,
}) => {
  // Check if current user is Hiệu trưởng
  const isPrincipal = currentUser?.role === 'HT' || currentUser?.id === 'HT01';

  const [entries, setEntries] = useState<CashbookEntry[]>(() =>
    storageService.getCashbookEntries(activeSchoolYear)
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'THU' | 'CHI'>('ALL');
  const [filterFund, setFilterFund] = useState<string>('ALL');

  // Modal: Add Entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [entryType, setEntryType] = useState<'THU' | 'CHI'>('THU');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo, setVoucherNo] = useState('');
  const [category, setCategory] = useState('Ngân sách Nhà nước cấp');
  const [fundType, setFundType] = useState<CashbookFundType>('QUY_NGAN_SACH');
  const [payerOrReceiver, setPayerOrReceiver] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState<number>(5000000);
  const [notes, setNotes] = useState('');

  // Printable book modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  const refreshEntries = () => {
    setEntries(storageService.getCashbookEntries(activeSchoolYear));
  };

  // If not Principal, block access with security screen
  if (!isPrincipal) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-red-200 shadow-xl text-center space-y-4 max-w-2xl mx-auto my-8">
        <div className="w-20 h-20 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>
        <div className="inline-block bg-red-100 text-red-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-red-200">
          Khu vực bảo mật tuyệt đối cấp I • Điều 3.4
        </div>
        <h2 className="text-2xl font-black text-slate-900">
          TRUY CẬP BỊ TỪ CHỐI (ACCESS RESTRICTED)
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
          Theo quy chế bảo mật tài chính của Trường TH & THCS Đồng Xuân,{' '}
          <strong className="text-red-700">Trang thống kê Thu - Chi & Sổ Quỹ Toàn Trường</strong> chỉ
          dành riêng cho <strong className="text-slate-900">Hiệu trưởng Nguyễn Quốc Bảo</strong> trực
          tiếp theo dõi và chỉ đạo.
        </p>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 text-left space-y-1">
          <div>
            <strong>Tài khoản hiện tại:</strong> {currentUser?.name || 'Khách'} ({currentUser?.position || 'Chưa xác định'})
          </div>
          <div>
            <strong>Phân quyền yêu cầu:</strong> Hiệu trưởng (HT01)
          </div>
        </div>
      </div>
    );
  }

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterType !== 'ALL' && e.type !== filterType) return false;
      if (filterFund !== 'ALL' && e.fundType !== filterFund) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          e.voucherNo.toLowerCase().includes(q) ||
          e.payerOrReceiver.toLowerCase().includes(q) ||
          e.reason.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, filterType, filterFund, searchTerm]);

  // Overall Financial Stats
  const stats = useMemo(() => {
    const totalThu = entries.filter((e) => e.type === 'THU').reduce((s, e) => s + e.amount, 0);
    const totalChi = entries.filter((e) => e.type === 'CHI').reduce((s, e) => s + e.amount, 0);
    const tonQuy = totalThu - totalChi;

    // Per fund
    const fundQuyTienMat = entries
      .filter((e) => e.fundType === 'QUY_TIEN_MAT')
      .reduce((s, e) => (e.type === 'THU' ? s + e.amount : s - e.amount), 0);
    const fundQuyNganSach = entries
      .filter((e) => e.fundType === 'QUY_NGAN_SACH')
      .reduce((s, e) => (e.type === 'THU' ? s + e.amount : s - e.amount), 0);
    const fundQuyTuChu = entries
      .filter((e) => e.fundType === 'QUY_TU_CHU')
      .reduce((s, e) => (e.type === 'THU' ? s + e.amount : s - e.amount), 0);
    const fundQuyBanTru = entries
      .filter((e) => e.fundType === 'QUY_BAN_TRU')
      .reduce((s, e) => (e.type === 'THU' ? s + e.amount : s - e.amount), 0);

    return {
      totalThu,
      totalChi,
      tonQuy,
      fundQuyTienMat,
      fundQuyNganSach,
      fundQuyTuChu,
      fundQuyBanTru,
    };
  }, [entries]);

  // Chart data: Monthly Thu & Chi
  const monthlyChartData = useMemo(() => {
    const months = ['Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12', 'Tháng 1'];
    return months.map((m, idx) => {
      const monthNum = idx >= 4 ? idx - 3 : idx + 9;
      const thu = entries
        .filter((e) => e.type === 'THU' && new Date(e.date).getMonth() + 1 === monthNum)
        .reduce((s, e) => s + e.amount, 0);
      const chi = entries
        .filter((e) => e.type === 'CHI' && new Date(e.date).getMonth() + 1 === monthNum)
        .reduce((s, e) => s + e.amount, 0);
      return {
        name: m,
        'Tổng Thu (VNĐ)': thu,
        'Tổng Chi (VNĐ)': chi,
      };
    });
  }, [entries]);

  // Pie data: Structure of Expenditure
  const expenditurePieData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    entries
      .filter((e) => e.type === 'CHI')
      .forEach((e) => {
        categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
      });

    const colors = ['#e11d48', '#2563eb', '#d97706', '#059669', '#7c3aed', '#0891b2'];
    return Object.entries(categoriesMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [entries]);

  // Handle Add Entry
  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || amount <= 0) {
      alert('Vui lòng nhập đầy đủ lý do và số tiền hợp lệ!');
      return;
    }

    const nextCode = voucherNo || (entryType === 'THU' ? `PT-${entries.length + 1}/2026` : `PC-${entries.length + 1}/2026`);

    storageService.addCashbookEntry(
      {
        schoolYear: activeSchoolYear,
        date: entryDate,
        voucherNo: nextCode,
        type: entryType,
        category,
        fundType,
        payerOrReceiver: payerOrReceiver.trim() || (entryType === 'THU' ? 'Người nộp' : 'Người nhận'),
        reason: reason.trim(),
        amount,
        createdBy: `${currentUser?.name || 'Hiệu trưởng'} (HT)`,
        approvedBy: 'Nguyễn Quốc Bảo (HT)',
        notes,
      },
      activeSchoolYear
    );

    refreshEntries();
    setShowAddModal(false);
    setReason('');
    setPayerOrReceiver('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Sổ Quỹ Thu - Chi Mật Cấp Trường • Chỉ Hiệu Trưởng Được Xem (Yêu cầu 3.4)
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Năm học {activeSchoolYear}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-400" />
            <span>Sổ Thu - Chi Toàn Trường & Giám Sát Tồn Quỹ</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
            Theo dõi chi tiết 4 nguồn quỹ (Tiền mặt, Ngân sách, Tự chủ, Bán trú), số dư tồn quỹ sau mỗi giao dịch và báo cáo thu chi độc quyền dành cho Hiệu trưởng Nguyễn Quốc Bảo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setVoucherNo(`PT-0${entries.length + 1}/2026`);
              setEntryType('THU');
              setShowAddModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white shadow transition flex items-center gap-1.5 active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-200" />
            <span>+ Lập Phiếu Thu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setVoucherNo(`PC-0${entries.length + 1}/2026`);
              setEntryType('CHI');
              setShowAddModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-xs text-white shadow transition flex items-center gap-1.5 active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-rose-200" />
            <span>+ Lập Phiếu Chi</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 font-black text-xs text-slate-950 shadow transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>In Sổ Quỹ (Mẫu S01a-H)</span>
          </button>
        </div>
      </div>

      {/* 4 Quỹ Đơn Vị Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Quỹ Tiền Mặt Tại Két</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {stats.fundQuyTienMat.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Tiền mặt tại két thủ quỹ Mai Thị Liễu
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Quỹ Ngân Sách Nhà Nước</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2 font-mono">
            {stats.fundQuyNganSach.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-blue-700 font-semibold mt-1">
            Kho bạc Nhà nước Huyện Đồng Xuân
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Quỹ Tự Chủ & Phúc Lợi</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2 font-mono">
            {stats.fundQuyTuChu.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-purple-700 font-semibold mt-1">
            Nguồn thu hoạt động dịch vụ & tiết kiệm
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">Quỹ Bán Trú & Tài Trợ</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            {stats.fundQuyBanTru.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Tiền ăn bán trú, nước uống & phụ huynh
          </div>
        </div>
      </div>

      {/* Charts Row: Monthly Thu-Chi & Structure of Expenditure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart: Monthly Thu vs Chi */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Biểu Đồ Đối Soát Thu - Chi Các Tháng Trong Năm Học
              </h3>
            </div>
            <span className="text-xs text-slate-500">Đơn vị: VNĐ</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
                />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} đ`]}
                />
                <Legend />
                <Bar dataKey="Tổng Thu (VNĐ)" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tổng Chi (VNĐ)" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart: Structure of Expenditure */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              Cơ Cấu Chi Phí Hoạt Động
            </h3>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenditurePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expenditurePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} đ`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-[11px] max-h-24 overflow-y-auto">
            {expenditurePieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-mono font-bold">{item.value.toLocaleString('vi-VN')} đ</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo số phiếu, người nộp/nhận, lý do thu chi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
          >
            <option value="ALL">-- Tất cả giao dịch (Thu & Chi) --</option>
            <option value="THU">🟢 Chỉ xem Phiếu Thu</option>
            <option value="CHI">🔴 Chỉ xem Phiếu Chi</option>
          </select>
        </div>

        <div>
          <select
            value={filterFund}
            onChange={(e) => setFilterFund(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
          >
            <option value="ALL">-- Tất cả 4 nguồn quỹ --</option>
            <option value="QUY_TIEN_MAT">Quỹ tiền mặt tại két</option>
            <option value="QUY_NGAN_SACH">Quỹ ngân sách Nhà nước</option>
            <option value="QUY_TU_CHU">Quỹ tự chủ & phúc lợi</option>
            <option value="QUY_BAN_TRU">Quỹ bán trú & phụ huynh</option>
          </select>
        </div>
      </div>

      {/* Sổ Cái Thu Chi Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Sổ Nhật Ký Thu - Chi & Tồn Quỹ (Mẫu Bộ Tài Chính)
              </h3>
              <p className="text-[11px] text-slate-300">
                Hiển thị số tiền thu, chi và số dư tồn quỹ sau mỗi giao dịch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold font-mono">
              Tổng thu: +{stats.totalThu.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-rose-400 font-bold font-mono">
              Tổng chi: -{stats.totalChi.toLocaleString('vi-VN')} đ
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-xl text-amber-300 font-black font-mono">
              Tồn: {stats.tonQuy.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-3 min-w-24">Ngày tháng</th>
                <th className="py-3 px-3 min-w-28">Số chứng từ</th>
                <th className="py-3 px-3 min-w-24 text-center">Loại</th>
                <th className="py-3 px-4 min-w-36">Người nộp / nhận</th>
                <th className="py-3 px-4 min-w-64">Diễn giải lý do thu / chi</th>
                <th className="py-3 px-3 min-w-28 text-right text-emerald-800">Thu (VNĐ)</th>
                <th className="py-3 px-3 min-w-28 text-right text-rose-800">Chi (VNĐ)</th>
                <th className="py-3 px-4 min-w-32 text-right font-black">Tồn sau GD</th>
                <th className="py-3 px-3 min-w-28">Người lập</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                    {index + 1}
                  </td>

                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString('vi-VN')}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {item.voucherNo}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {item.type === 'THU' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-0.5">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>THU</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>CHI</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {item.payerOrReceiver}
                  </td>

                  <td className="py-3 px-4 text-slate-700 leading-snug">
                    <div>{item.reason}</div>
                    <div className="text-[10px] text-indigo-700 font-bold mt-0.5">
                      Nguồn: {item.category}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-700">
                    {item.type === 'THU' ? `+${item.amount.toLocaleString('vi-VN')} đ` : '—'}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-black text-rose-700">
                    {item.type === 'CHI' ? `-${item.amount.toLocaleString('vi-VN')} đ` : '—'}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-black text-slate-950 bg-slate-50">
                    {item.balanceAfter.toLocaleString('vi-VN')} đ
                  </td>

                  <td className="py-3 px-3 text-slate-600 text-[11px]">
                    {item.createdBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Lập Phiếu Thu / Phiếu Chi mới vào sổ quỹ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className={`p-5 text-white flex items-center justify-between ${
                entryType === 'THU' ? 'bg-emerald-800' : 'bg-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">
                  Lập {entryType === 'THU' ? 'Phiếu Thu (PT)' : 'Phiếu Chi (PC)'} Vào Sổ Quỹ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại chứng từ:</label>
                  <select
                    value={entryType}
                    onChange={(e) => {
                      const t = e.target.value as 'THU' | 'CHI';
                      setEntryType(t);
                      setVoucherNo(t === 'THU' ? `PT-0${entries.length + 1}/2026` : `PC-0${entries.length + 1}/2026`);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="THU">🟢 Phiếu Thu (Tiền vào quỹ)</option>
                    <option value="CHI">🔴 Phiếu Chi (Tiền ra khỏi quỹ)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số phiếu:</label>
                  <input
                    type="text"
                    required
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày lập phiếu:</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nguồn quỹ hạch toán:</label>
                  <select
                    value={fundType}
                    onChange={(e) => setFundType(e.target.value as CashbookFundType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="QUY_TIEN_MAT">Quỹ tiền mặt</option>
                    <option value="QUY_NGAN_SACH">Quỹ ngân sách nhà nước</option>
                    <option value="QUY_TU_CHU">Quỹ tự chủ & phúc lợi</option>
                    <option value="QUY_BAN_TRU">Quỹ bán trú & phụ huynh</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {entryType === 'THU' ? 'Người hoặc đơn vị nộp tiền:' : 'Người hoặc đơn vị nhận tiền:'}
                </label>
                <input
                  type="text"
                  required
                  value={payerOrReceiver}
                  onChange={(e) => setPayerOrReceiver(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  placeholder="VD: Kho bạc Nhà nước, Hội CMHS, Điện lực..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Diễn giải lý do thu / chi:</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  placeholder="Ghi rõ lý do hạch toán..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số tiền (VNĐ):</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-black text-sm"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {amount.toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phân mục thu / chi:</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                    placeholder="VD: Tiền điện nước, Mua sắm VPP..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold shadow ${
                    entryType === 'THU' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'
                  }`}
                >
                  Ghi Vào Sổ Quỹ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: In Sổ Quỹ Tiền Mặt (Mẫu S01a-H Chuẩn Bộ Tài Chính) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-none">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <h3 className="font-bold text-sm">
                Xem Trước & In Sổ Quỹ Tiền Mặt (Mẫu S01a-H - Thông tư 107/2017/TT-BTC)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs"
                >
                  In ngay
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="text-white/80 hover:text-white font-bold text-lg px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-xs text-slate-900 print:p-0">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 font-serif">
                <div>
                  <div className="font-bold uppercase">TRƯỜNG TIỂU HỌC & THCS ĐỒNG XUÂN</div>
                  <div>Huyện Đồng Xuân, Tỉnh Phú Yên</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">Mẫu số: S01a-H</div>
                  <div className="text-[10px] text-slate-500 italic">
                    (Ban hành theo Thông tư số 107/2017/TT-BTC của Bộ Tài chính)
                  </div>
                </div>
              </div>

              <div className="text-center font-serif space-y-1">
                <h1 className="font-black text-lg uppercase tracking-wider">SỔ QUỸ TIỀN MẶT</h1>
                <div className="italic">Năm học: {activeSchoolYear}</div>
                <div className="font-bold text-red-800">Loại quỹ: Tổng hợp tất cả các quỹ đơn vị</div>
              </div>

              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center border-b border-slate-900">
                    <th className="border border-slate-900 p-2 w-20">Ngày tháng</th>
                    <th className="border border-slate-900 p-2 w-24">Số hiệu PT</th>
                    <th className="border border-slate-900 p-2 w-24">Số hiệu PC</th>
                    <th className="border border-slate-900 p-2">Diễn giải nội dung thu - chi</th>
                    <th className="border border-slate-900 p-2 w-28 text-right">Thu (VNĐ)</th>
                    <th className="border border-slate-900 p-2 w-28 text-right">Chi (VNĐ)</th>
                    <th className="border border-slate-900 p-2 w-32 text-right">Tồn quỹ</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-800">
                      <td className="border border-slate-900 p-2 text-center">
                        {new Date(e.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="border border-slate-900 p-2 font-mono text-center">
                        {e.type === 'THU' ? e.voucherNo : '—'}
                      </td>
                      <td className="border border-slate-900 p-2 font-mono text-center">
                        {e.type === 'CHI' ? e.voucherNo : '—'}
                      </td>
                      <td className="border border-slate-900 p-2">
                        {e.reason} ({e.payerOrReceiver})
                      </td>
                      <td className="border border-slate-900 p-2 text-right font-mono">
                        {e.type === 'THU' ? e.amount.toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="border border-slate-900 p-2 text-right font-mono">
                        {e.type === 'CHI' ? e.amount.toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="border border-slate-900 p-2 text-right font-mono font-bold">
                        {e.balanceAfter.toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-3 gap-4 pt-6 text-center font-serif">
                <div>
                  <div className="font-bold uppercase">NGƯỜI GHI SỔ</div>
                  <div className="text-[11px] text-slate-500 italic">(Ký, họ tên)</div>
                  <div className="h-14"></div>
                  <div className="font-bold">Mai Thị Liễu</div>
                  <div className="text-[10px] text-slate-500">Thủ quỹ</div>
                </div>
                <div>
                  <div className="font-bold uppercase">KẾ TOÁN TRƯỞNG</div>
                  <div className="text-[11px] text-slate-500 italic">(Ký, họ tên)</div>
                  <div className="h-14"></div>
                  <div className="font-bold">Trần Thị Thanh Thảo</div>
                  <div className="text-[10px] text-slate-500">Kế toán</div>
                </div>
                <div>
                  <div className="font-bold uppercase">HIỆU TRƯỞNG DUYỆT</div>
                  <div className="text-[11px] text-slate-500 italic">(Ký, đóng dấu)</div>
                  <div className="h-14"></div>
                  <div className="font-bold text-red-700">Nguyễn Quốc Bảo</div>
                  <div className="text-[10px] text-slate-500">Hiệu trưởng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
