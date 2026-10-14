import React, { useState, useMemo } from 'react';
import { UserAccount, SchoolClass, FeeCategory, StudentFeePayment } from '../types/school';
import { BRANCHES_DATA } from '../data/initialData';
import { storageService } from '../services/storageService';
import { InternalExpenditureBook } from './InternalExpenditureBook';
import { PrincipalCashbook } from './PrincipalCashbook';
import {
  DollarSign,
  CreditCard,
  PieChart,
  FileSpreadsheet,
  Printer,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Receipt,
  Download,
  Building,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

interface FinanceManagementProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  classes: SchoolClass[];
}

export const FinanceManagement: React.FC<FinanceManagementProps> = ({
  currentUser,
  activeSchoolYear,
  classes,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'internal_expenses' | 'cashbook_principal' | 'collection' | 'categories' | 'reports'
  >('internal_expenses');

  // Datasets from storage
  const [categories, setCategories] = useState<FeeCategory[]>(() => storageService.getFeeCategories());
  const [payments, setPayments] = useState<StudentFeePayment[]>(() => storageService.getStudentFeePayments(activeSchoolYear));

  // Filters
  const [filterBranch, setFilterBranch] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Collection Modal
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<StudentFeePayment | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptSuccess, setReceiptSuccess] = useState<string | null>(null);

  // New Fee Category Modal
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState<number>(100000);
  const [newFeePeriod, setNewFeePeriod] = useState<FeeCategory['period']>('Học kỳ');
  const [newFeeLevel, setNewFeeLevel] = useState<FeeCategory['levelTarget']>('Tất cả');
  const [newFeeDesc, setNewFeeDesc] = useState('');

  // Calculate statistics across 1,289 students
  const stats = useMemo(() => {
    // Generate payments projection for all classes if payment list is small
    const totalExpected = 1289 * (680400 + 150000 + 50000); // BHYT + BHTN + Nuoc uong = 880,400 per student
    const totalCollected = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
    const totalDebt = payments.reduce((acc, p) => acc + (p.remainingDebt || 0), 0);
    const fullyPaidCount = payments.filter((p) => p.status === 'Đã nộp đủ').length;
    const partialCount = payments.filter((p) => p.status === 'Nộp một phần').length;
    const unpaidCount = payments.filter((p) => p.status === 'Chưa nộp').length;

    return {
      totalExpected,
      totalCollected,
      totalDebt,
      fullyPaidCount,
      partialCount,
      unpaidCount,
      collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
    };
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (filterBranch !== 'ALL' && p.branchName !== filterBranch) return false;
      if (filterClass !== 'ALL' && p.className !== filterClass) return false;
      if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return p.studentName.toLowerCase().includes(q) || p.className.toLowerCase().includes(q) || (p.receiptNumber || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [payments, filterBranch, filterClass, filterStatus, searchTerm]);

  // Handle Payment Submit
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPay) return;

    const updated = payments.map((p) => {
      if (p.id === selectedStudentForPay.id) {
        const newPaid = (p.amountPaid || 0) + payAmount;
        const newDebt = Math.max(0, p.amountDue - newPaid);
        const newStatus: StudentFeePayment['status'] = newDebt === 0 ? 'Đã nộp đủ' : 'Nộp một phần';

        return {
          ...p,
          amountPaid: newPaid,
          remainingDebt: newDebt,
          status: newStatus,
          paymentDate: new Date().toISOString().split('T')[0],
          receiptNumber: receiptNumber || `BL-${Date.now().toString().slice(-4)}`,
          collectedBy: currentUser?.name ? `${currentUser.name} (${currentUser.position})` : 'Kế toán trường',
        };
      }
      return p;
    });

    storageService.saveStudentFeePayments(updated, activeSchoolYear);
    setPayments(updated);
    setReceiptSuccess(`Đã lập biên lai thu số tiền ${payAmount.toLocaleString('vi-VN')} đ cho em ${selectedStudentForPay.studentName}!`);
    setShowCollectModal(false);
    setTimeout(() => setReceiptSuccess(null), 4000);
  };

  // Handle Add Fee Category
  const handleCreateFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeName || !newFeeAmount) return;

    const newCategory: FeeCategory = {
      id: 'FEE_' + Date.now().toString().slice(-4),
      name: newFeeName,
      amount: newFeeAmount,
      period: newFeePeriod,
      levelTarget: newFeeLevel,
      description: newFeeDesc,
    };

    const updated = [...categories, newCategory];
    storageService.saveFeeCategories(updated);
    setCategories(updated);
    setShowAddFeeModal(false);
    setNewFeeName('');
    setNewFeeDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              <span>PHÂN HỆ TÀI CHÍNH, HỌC PHÍ & QUẢN LÝ CÔNG NỢ NĂM HỌC {activeSchoolYear}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Quản Lý Học Phí, Các Khoản Thu & Báo Cáo Tài Chính
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Thiết lập biểu phí chuẩn (Bảo hiểm y tế, thân thể, bán trú, nước uống, quỹ lớp), theo dõi công nợ chi
              tiết 1.289 học sinh trên toàn bộ 4 phân hiệu và tự động tổng hợp doanh thu phục vụ Ban Giám hiệu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddFeeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thiết Lập Biểu Phí Mới</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>In Báo Cáo Tài Chính</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-800/60">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 uppercase font-bold block">Tổng Thu Dự Kiến</span>
            <span className="text-lg sm:text-xl font-black text-amber-300">
              {stats.totalExpected.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 uppercase font-bold block">Số Tiền Thực Thu</span>
            <span className="text-lg sm:text-xl font-black text-emerald-300">
              {stats.totalCollected.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 uppercase font-bold block">Công Nợ Tồn Đọng</span>
            <span className="text-lg sm:text-xl font-black text-rose-300">
              {stats.totalDebt.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 uppercase font-bold block">Tỷ Lệ Thu Đạt</span>
            <span className="text-lg sm:text-xl font-black text-cyan-300">{stats.collectionRate}% Hoàn thành</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-emerald-800/60 pt-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('collection')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'collection' ? 'bg-white text-slate-900 shadow' : 'bg-emerald-950/60 text-slate-300 hover:bg-emerald-950'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Thu Học Phí & Công Nợ ({filteredPayments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'categories' ? 'bg-white text-slate-900 shadow' : 'bg-emerald-950/60 text-slate-300 hover:bg-emerald-950'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Biểu Phí Nhà Trường ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'reports' ? 'bg-white text-slate-900 shadow' : 'bg-emerald-950/60 text-slate-300 hover:bg-emerald-950'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Báo Cáo Doanh Thu BGH</span>
          </button>
        </div>
      </div>

      {receiptSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{receiptSuccess}</span>
          </div>
          <button type="button" onClick={() => setReceiptSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* SUB-TAB 1: THU TIỀN & CÔNG NỢ HỌC SINH */}
      {activeSubTab === 'collection' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Building className="w-4 h-4 text-slate-400" />
                <span className="font-bold">Phân hiệu:</span>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-slate-50"
                >
                  <option value="ALL">Tất cả Phân hiệu</option>
                  {BRANCHES_DATA.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="font-bold">Trạng thái:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-slate-50"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Đã nộp đủ">Đã nộp đủ</option>
                  <option value="Nộp một phần">Nộp một phần</option>
                  <option value="Chưa nộp">Chưa nộp (Còn nợ)</option>
                </select>
              </div>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên HS, lớp, số biên lai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Học Sinh</th>
                    <th className="py-2.5 px-3">Lớp & Phân Hiệu</th>
                    <th className="py-2.5 px-3">Khoản Thu</th>
                    <th className="py-2.5 px-3 text-right">Phải Thu</th>
                    <th className="py-2.5 px-3 text-right">Đã Nộp</th>
                    <th className="py-2.5 px-3 text-right text-rose-700">Còn Nợ</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3">Số Biên Lai</th>
                    <th className="py-2.5 px-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">{p.studentName}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-red-700">{p.className}</span>
                        <span className="text-[10px] text-slate-400 block">{p.branchName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{p.feeCategoryName}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">{p.amountDue.toLocaleString('vi-VN')} đ</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {p.amountPaid.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-rose-700">
                        {p.remainingDebt > 0 ? `${p.remainingDebt.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Đã nộp đủ'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'Nộp một phần'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{p.receiptNumber || 'Chưa lập'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForPay(p);
                            setPayAmount(p.remainingDebt || p.amountDue);
                            setReceiptNumber(`BL-${Date.now().toString().slice(-4)}`);
                            setShowCollectModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition"
                        >
                          Thu Tiền
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BIỂU PHÍ NHÀ TRƯỜNG */}
      {activeSubTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                  {cat.period}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{cat.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
              </div>

              <div className="border-t pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Định Mức Thu</span>
                  <span className="text-base font-black text-emerald-700">
                    {cat.amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                  Áp dụng: {cat.levelTarget}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: BÁO CÁO DOANH THU & CÔNG NỢ BAN GIÁM HIỆU */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Tổng Hợp Báo Cáo Tài Chính Thu Học Phí Theo Từng Phân Hiệu (Năm Học {activeSchoolYear})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BRANCHES_DATA.filter((b) => b.id !== 'PH_TRU_SO').map((b, idx) => {
                const estStudents = idx === 0 ? 465 : idx === 1 ? 480 : 344;
                const estFee = estStudents * 880400;

                return (
                  <div key={b.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-bold text-xs text-slate-900 block">{b.name}</span>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Sĩ số:</span>
                      <strong>{estStudents} học sinh</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Kế hoạch thu:</span>
                      <strong>{estFee.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${82 - idx * 4}%` }}></div>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block text-right">
                      Đã hoàn thành {82 - idx * 4}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THU TIỀN */}
      {showCollectModal && selectedStudentForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Lập Phiếu Thu / Biên Lai Học Phí
              </h3>
              <button type="button" onClick={() => setShowCollectModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border space-y-1">
                <p>Học sinh: <strong className="text-slate-900">{selectedStudentForPay.studentName}</strong></p>
                <p>Lớp: <strong>{selectedStudentForPay.className}</strong> • Phân hiệu: <strong>{selectedStudentForPay.branchName}</strong></p>
                <p>Khoản thu: <strong>{selectedStudentForPay.feeCategoryName}</strong></p>
                <p className="text-rose-700 font-bold">Còn nợ: {selectedStudentForPay.remainingDebt.toLocaleString('vi-VN')} đ</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số tiền thực nộp (VNĐ):</label>
                <input
                  type="number"
                  required
                  min={1000}
                  max={selectedStudentForPay.remainingDebt || selectedStudentForPay.amountDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-black text-sm text-emerald-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số Biên lai / Phiếu thu:</label>
                <input
                  type="text"
                  required
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow"
                >
                  Xác Nhận Thu Tiền & In Biên Lai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM BIỂU PHÍ */}
      {showAddFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                Thiết Lập Khoản Thu / Biểu Phí Mới
              </h3>
              <button type="button" onClick={() => setShowAddFeeModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFee} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên khoản thu:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Quỹ đội thiếu niên, Áo đồng phục..."
                  value={newFeeName}
                  onChange={(e) => setNewFeeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Định mức thu (VNĐ):</label>
                  <input
                    type="number"
                    step={10000}
                    required
                    value={newFeeAmount}
                    onChange={(e) => setNewFeeAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kỳ thu:</label>
                  <select
                    value={newFeePeriod}
                    onChange={(e) => setNewFeePeriod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="Hàng tháng">Hàng tháng</option>
                    <option value="Học kỳ">Học kỳ</option>
                    <option value="Cả năm">Cả năm</option>
                    <option value="Một lần">Một lần</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô tả / Căn cứ thu:</label>
                <textarea
                  rows={2}
                  value={newFeeDesc}
                  onChange={(e) => setNewFeeDesc(e.target.value)}
                  placeholder="Theo thỏa thuận CMHS hoặc quy định nhà nước..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddFeeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow"
                >
                  Lưu Biểu Phí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
