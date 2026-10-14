import React, { useState, useMemo } from 'react';
import {
  UserAccount,
  Role,
  InternalExpenseItem,
  ExpenseType,
  ExpenseApprovalStatus,
  ExpenseSettlementStatus,
} from '../types/school';
import { storageService } from '../services/storageService';
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  User,
  ShieldCheck,
  Building,
  DollarSign,
  Paperclip,
  Check,
  Send,
  AlertTriangle,
  Printer,
  Download,
  Calendar,
  Eye,
  FileCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface InternalExpenditureBookProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
}

export const InternalExpenditureBook: React.FC<InternalExpenditureBookProps> = ({
  currentUser,
  activeSchoolYear,
}) => {
  const [expenses, setExpenses] = useState<InternalExpenseItem[]>(() =>
    storageService.getInternalExpenses(activeSchoolYear)
  );

  // Designated Operators defined in Requirement 3.1
  const designatedOperators = [
    { id: 'HT01', name: 'Nguyễn Quốc Bảo', role: 'HT', position: 'Hiệu trưởng', badge: '👑 Hiệu trưởng' },
    { id: 'NV_THU_QUY', name: 'Mai Thị Liễu', role: 'NV', position: 'Thủ quỹ nhà trường', badge: '💰 Thủ quỹ (Mai Thị Liễu)' },
    { id: 'NV_KE_TOAN', name: 'Trần Thị Thanh Thảo', role: 'NV', position: 'Kế toán trưởng', badge: '📊 Kế toán (Trần Thị Thanh Thảo)' },
    { id: 'NV_VAN_THU', name: 'Lý Nhật Nguyệt', role: 'NV', position: 'Văn thư - Giáo vụ', badge: '📑 Văn thư (Lý Nhật Nguyệt)' },
  ];

  // Active operating viewpoint (default based on currentUser or HT01)
  const initialOperatorId = useMemo(() => {
    if (!currentUser) return 'HT01';
    if (currentUser.role === 'HT' || currentUser.id === 'HT01') return 'HT01';
    if (currentUser.id === 'NV_THU_QUY' || currentUser.name.includes('Mai Thị Liễu')) return 'NV_THU_QUY';
    if (currentUser.id === 'NV_KE_TOAN' || currentUser.name.includes('Trần Thị Thanh Thảo')) return 'NV_KE_TOAN';
    if (currentUser.id === 'NV_VAN_THU' || currentUser.name.includes('Lý Nhật Nguyệt')) return 'NV_VAN_THU';
    return 'HT01';
  }, [currentUser]);

  const [activeOperatorId, setActiveOperatorId] = useState<string>(initialOperatorId);

  const activeOperator = useMemo(
    () => designatedOperators.find((o) => o.id === activeOperatorId) || designatedOperators[0],
    [activeOperatorId]
  );

  const isPrincipal = activeOperator.id === 'HT01';
  const isAccountant = activeOperator.id === 'NV_KE_TOAN';
  const isTreasurer = activeOperator.id === 'NV_THU_QUY';
  const isClerk = activeOperator.id === 'NV_VAN_THU';

  // Sub-filter for Accountant: View all vs View own entries
  const [accountantScope, setAccountantScope] = useState<'ALL' | 'OWN'>('ALL');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApproval, setFilterApproval] = useState<string>('ALL');
  const [filterSettlement, setFilterSettlement] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal 1: Create expense
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseContent, setExpenseContent] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(1000000);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseTime, setExpenseTime] = useState('09:00');
  const [expenseLocation, setExpenseLocation] = useState('Thị trấn La Hai, Đồng Xuân');
  const [spenderName, setSpenderName] = useState(activeOperator.name);
  const [spenderPhone, setSpenderPhone] = useState('0913.456.789');
  const [expenseType, setExpenseType] = useState<ExpenseType>('CO_HOA_DON_DO');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [category, setCategory] = useState<InternalExpenseItem['category']>('Văn phòng phẩm');
  const [attachedFileName, setAttachedFileName] = useState('');

  // Modal 2: HT Approval
  const [approvingExpense, setApprovingExpense] = useState<InternalExpenseItem | null>(null);
  const [principalApprovalNote, setPrincipalApprovalNote] = useState('');

  // Modal 3: HT Reject
  const [rejectingExpense, setRejectingExpense] = useState<InternalExpenseItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Modal 4: School Reimbursement (Trường trả tiền)
  const [payingExpense, setPayingExpense] = useState<InternalExpenseItem | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [reimbursementReceiptNo, setReimbursementReceiptNo] = useState('');

  // Modal 5: Settle & Close (3.3 - Nhận tiền & chốt kết thúc khoản chi)
  const [settlingExpense, setSettlingExpense] = useState<InternalExpenseItem | null>(null);
  const [settlementReceiptNo, setSettlementReceiptNo] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');

  // Detail Modal
  const [viewingExpense, setViewingExpense] = useState<InternalExpenseItem | null>(null);

  const refreshExpenses = () => {
    setExpenses(storageService.getInternalExpenses(activeSchoolYear));
  };

  // Visibility Logic according to Requirement 3.1
  const visibleExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // 1. Thủ quỹ Mai Thị Liễu: ONLY sees what she created
      if (isTreasurer) {
        const matchTreasurer = e.creatorId === 'NV_THU_QUY' || e.creatorName.includes('Mai Thị Liễu');
        if (!matchTreasurer) return false;
      }

      // 2. Văn thư Lý Nhật Nguyệt: ONLY sees what she created
      if (isClerk) {
        const matchClerk = e.creatorId === 'NV_VAN_THU' || e.creatorName.includes('Lý Nhật Nguyệt');
        if (!matchClerk) return false;
      }

      // 3. Kế toán Trần Thị Thanh Thảo: Sees ALL, or toggles to own
      if (isAccountant && accountantScope === 'OWN') {
        const matchAccountant = e.creatorId === 'NV_KE_TOAN' || e.creatorName.includes('Trần Thị Thanh Thảo');
        if (!matchAccountant) return false;
      }

      // 4. Hiệu trưởng Nguyễn Quốc Bảo: Sees ALL

      // Filters
      if (filterApproval !== 'ALL' && e.approvalStatus !== filterApproval) return false;
      if (filterSettlement !== 'ALL' && e.settlementStatus !== filterSettlement) return false;
      if (filterType !== 'ALL' && e.expenseType !== filterType) return false;

      // Search keyword
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.expenseCode.toLowerCase().includes(q) ||
          e.creatorName.toLowerCase().includes(q) ||
          e.spenderName.toLowerCase().includes(q) ||
          (e.invoiceNumber || '').toLowerCase().includes(q) ||
          e.expenseLocation.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    expenses,
    isTreasurer,
    isClerk,
    isAccountant,
    accountantScope,
    filterApproval,
    filterSettlement,
    filterType,
    searchTerm,
  ]);

  // Statistics for active operator
  const stats = useMemo(() => {
    const totalCount = visibleExpenses.length;
    const totalAmount = visibleExpenses.reduce((sum, e) => sum + e.amount, 0);
    const pendingApprovalCount = visibleExpenses.filter((e) => e.approvalStatus === 'CHO_HT_DUYET').length;
    const approvedCount = visibleExpenses.filter((e) => e.approvalStatus === 'HT_DA_DUYET').length;
    const paidBySchoolCount = visibleExpenses.filter((e) => e.settlementStatus === 'TRUONG_DA_TRA_TIEN').length;
    const closedCount = visibleExpenses.filter((e) => e.isClosed).length;
    const totalPaidBySchool = visibleExpenses.reduce((sum, e) => sum + (e.paidBySchoolAmount || 0), 0);

    return {
      totalCount,
      totalAmount,
      pendingApprovalCount,
      approvedCount,
      paidBySchoolCount,
      closedCount,
      totalPaidBySchool,
    };
  }, [visibleExpenses]);

  // Handle Create Expense (3.1)
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || expenseAmount <= 0) {
      alert('Vui lòng nhập đầy đủ tiêu đề và số tiền hợp lệ!');
      return;
    }

    const nextCode = `PC-${(expenses.length + 1).toString().padStart(2, '0')}/${activeSchoolYear.split('-')[0]}`;

    const staffMatch = storageService.getStaffList().find((s) => s.account.id === activeOperator.id)?.account;

    const opUser: UserAccount = staffMatch || {
      id: activeOperator.id,
      name: activeOperator.name,
      role: activeOperator.role as Role,
      position: activeOperator.position,
      username: activeOperator.id.toLowerCase(),
      email: `${activeOperator.id.toLowerCase()}@dongxuan.edu.vn`,
      phone: spenderPhone,
      campusId: 'CS_TRU_SO',
      campusName: 'Trụ sở chính',
      branchName: 'Trụ sở chính Đồng Xuân',
      driveFolderId: `folder_${activeOperator.id}`,
      sheetFileId: `sheet_${activeOperator.id}`,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${activeOperator.id}`,
      isTemporaryPassword: false,
    };

    storageService.addInternalExpense(
      {
        schoolYear: activeSchoolYear,
        expenseCode: nextCode,
        expenseDate,
        expenseTime,
        expenseLocation,
        creatorId: activeOperator.id,
        creatorName: activeOperator.name,
        creatorRole: activeOperator.position,
        spenderName: spenderName.trim() || activeOperator.name,
        spenderPhone,
        title: expenseTitle.trim(),
        content: expenseContent.trim(),
        amount: expenseAmount,
        expenseType,
        invoiceNumber: expenseType === 'CO_HOA_DON_DO' ? invoiceNumber : undefined,
        category,
        attachedFiles: attachedFileName
          ? [{ name: attachedFileName, url: '#', size: '1.2 MB' }]
          : [
              {
                name: expenseType === 'CO_HOA_DON_DO' ? 'hoa_don_vat_dien_tu.pdf' : 'phieu_chi_chung_tu.jpg',
                url: '#',
                size: '950 KB',
              },
            ],
      },
      opUser,
      activeSchoolYear
    );

    refreshExpenses();
    setShowAddModal(false);
    // Reset
    setExpenseTitle('');
    setExpenseContent('');
    setInvoiceNumber('');
    setAttachedFileName('');
  };

  // Handle HT Approval (3.2)
  const handleConfirmHTApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingExpense) return;
    storageService.htApproveExpense(approvingExpense.id, principalApprovalNote, activeSchoolYear);
    refreshExpenses();
    setApprovingExpense(null);
    setPrincipalApprovalNote('');
  };

  // Handle HT Reject (3.2)
  const handleConfirmHTReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingExpense) return;
    storageService.htRejectExpense(rejectingExpense.id, rejectReason, activeSchoolYear);
    refreshExpenses();
    setRejectingExpense(null);
    setRejectReason('');
  };

  // Handle School Payment
  const handleConfirmSchoolPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingExpense) return;
    storageService.recordSchoolPayment(
      payingExpense.id,
      paidAmount || payingExpense.amount,
      reimbursementReceiptNo || `HU-${Date.now().toString().slice(-4)}`,
      activeSchoolYear
    );
    refreshExpenses();
    setPayingExpense(null);
  };

  // Handle Settle & Close (3.3)
  const handleConfirmSettleAndClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingExpense) return;

    const staffMatch = storageService.getStaffList().find((s) => s.account.id === activeOperator.id)?.account;

    const opUser: UserAccount = staffMatch || {
      id: activeOperator.id,
      name: activeOperator.name,
      role: activeOperator.role as Role,
      position: activeOperator.position,
      username: activeOperator.id.toLowerCase(),
      email: `${activeOperator.id.toLowerCase()}@dongxuan.edu.vn`,
      phone: '',
      campusId: 'CS_TRU_SO',
      campusName: 'Trụ sở chính',
      branchName: 'Trụ sở chính Đồng Xuân',
      driveFolderId: `folder_${activeOperator.id}`,
      sheetFileId: `sheet_${activeOperator.id}`,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${activeOperator.id}`,
      isTemporaryPassword: false,
    };

    storageService.settleAndCloseExpense(
      settlingExpense.id,
      opUser,
      settlementNotes.trim() || `Đồng chí ${activeOperator.name} đã nhận đủ tiền hoàn ứng từ trường và thanh toán trả cho các bên. Chốt kết thúc khoản chi.`,
      settlementReceiptNo,
      activeSchoolYear
    );

    refreshExpenses();
    setSettlingExpense(null);
    setSettlementNotes('');
    setSettlementReceiptNo('');
  };

  return (
    <div className="space-y-6">
      {/* Role Viewpoint Switcher (Requirement 3.1 & 3.3 demonstration) */}
      <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-800" />
              <span className="text-xs font-black uppercase text-amber-900 tracking-wide">
                Chuyển nhanh góc nhìn người dùng (Yêu cầu 3.1, 3.2, 3.3)
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              Đang thao tác dưới tư cách:{' '}
              <strong className="text-red-800 text-sm">{activeOperator.name}</strong> ({activeOperator.position})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {designatedOperators.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => {
                  setActiveOperatorId(op.id);
                  setSpenderName(op.name);
                }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition border ${
                  activeOperatorId === op.id
                    ? 'bg-red-700 text-white border-red-800 shadow-md scale-105 ring-2 ring-red-400'
                    : 'bg-white text-slate-700 hover:bg-amber-100 border-amber-200'
                }`}
              >
                {op.badge}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic notice based on user visibility */}
        <div className="mt-3 pt-3 border-t border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
          {isTreasurer && (
            <div className="flex items-center gap-1.5 font-medium">
              <span className="font-bold text-red-700">🔒 Phân quyền Thủ quỹ (Mai Thị Liễu):</span>
              <span>Chỉ nhìn thấy các nội dung do đồng chí Mai Thị Liễu trực tiếp nhập và các khoản trường đã trả hoàn ứng cho thủ quỹ.</span>
            </div>
          )}
          {isClerk && (
            <div className="flex items-center gap-1.5 font-medium">
              <span className="font-bold text-red-700">🔒 Phân quyền Văn thư (Lý Nhật Nguyệt):</span>
              <span>Chỉ nhìn thấy các nội dung do đồng chí Lý Nhật Nguyệt trực tiếp nhập và các khoản trường đã trả hoàn ứng cho văn thư.</span>
            </div>
          )}
          {isAccountant && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="font-bold text-blue-800">📊 Phân quyền Kế toán (Trần Thị Thanh Thảo):</span>
                <span>Thấy tổng hợp toàn bộ sổ toàn trường do HT, Thủ quỹ, Kế toán, Văn thư đã nhập.</span>
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-amber-300">
                <span className="font-bold text-[10px] text-slate-600">Phạm vi xem:</span>
                <button
                  type="button"
                  onClick={() => setAccountantScope('ALL')}
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    accountantScope === 'ALL' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Toàn trường ({expenses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAccountantScope('OWN')}
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    accountantScope === 'OWN' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Của riêng tôi
                </button>
              </div>
            </div>
          )}
          {isPrincipal && (
            <div className="flex items-center gap-1.5 font-medium">
              <span className="font-bold text-emerald-800">👑 Quyền hạn Hiệu trưởng (Nguyễn Quốc Bảo):</span>
              <span>Toàn quyền xem toàn bộ sổ chi tiêu toàn trường, duyệt chi, chỉ đạo thanh toán và chốt sổ.</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Quy chế chi tiêu nội bộ • Năm học {activeSchoolYear}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Trường TH & THCS Đồng Xuân
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-red-700" />
            <span>Sổ Chi Tiêu Nội Bộ Đơn Vị (Thủ Quỹ, Kế Toán, Văn Thư & HT)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Nhập hóa đơn, phiếu chi hoặc nội dung chi không hóa đơn rõ ràng người nhập, người chi, thời gian, địa điểm; trình Hiệu trưởng phê duyệt và xác nhận hoàn ứng chốt kết thúc khoản chi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Nhập khoản chi mới (3.1) */}
          <button
            type="button"
            onClick={() => {
              setSpenderName(activeOperator.name);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 font-bold text-xs text-white shadow-md transition flex items-center gap-1.5 active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-red-200" />
            <span>+ Nhập Nội Dung Chi Mới</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 font-bold text-xs text-white shadow-sm transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>In Sổ Chi Tiêu</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Tổng khoản chi</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalCount}</span>
          <span className="text-[11px] text-slate-500 font-medium">Bản ghi trong sổ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Tổng tiền đăng ký</span>
          <span className="text-lg font-black text-red-700 mt-1 block">
            {stats.totalAmount.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Kinh phí đề xuất</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-amber-700 uppercase block">Chờ HT duyệt</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.pendingApprovalCount}</span>
          <span className="text-[11px] text-amber-800 font-medium">Trình Ban giám hiệu</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-blue-700 uppercase block">HT đã duyệt</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{stats.approvedCount}</span>
          <span className="text-[11px] text-blue-800 font-medium">Hợp lệ & cho phép chi</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-purple-700 uppercase block">Trường đã trả tiền</span>
          <span className="text-lg font-black text-purple-700 mt-1 block">
            {stats.totalPaidBySchool.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[11px] text-purple-800 font-medium">{stats.paidBySchoolCount} phiếu đã xuất quỹ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-700 uppercase block">Đã chốt kết thúc</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.closedCount}</span>
          <span className="text-[11px] text-emerald-800 font-medium">Đã thanh toán sòng phẳng</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, nội dung, người chi, số hóa đơn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-600 outline-none"
          />
        </div>

        <div>
          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-red-600 outline-none"
          >
            <option value="ALL">-- Tất cả trạng thái duyệt HT --</option>
            <option value="CHO_HT_DUYET">⏳ Chờ HT duyệt</option>
            <option value="HT_DA_DUYET">✅ HT đã duyệt</option>
            <option value="HT_TU_CHOI">❌ HT từ chối</option>
          </select>
        </div>

        <div>
          <select
            value={filterSettlement}
            onChange={(e) => setFilterSettlement(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-red-600 outline-none"
          >
            <option value="ALL">-- Tiến độ thanh toán hoàn ứng --</option>
            <option value="CHUA_THANH_TOAN">Chưa thanh toán</option>
            <option value="TRUONG_DA_TRA_TIEN">Trường đã trả tiền (Chờ chốt)</option>
            <option value="DA_CHOT_KET_THUC">Đã chốt kết thúc khoản chi</option>
          </select>
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-red-600 outline-none"
          >
            <option value="ALL">-- Tất cả loại hình chứng từ --</option>
            <option value="CO_HOA_DON_DO">Có hóa đơn đỏ GTGT</option>
            <option value="PHIEU_CHI_NOI_BO">Phiếu chi nội bộ</option>
            <option value="CHI_KHONG_HOA_DON">Chi thực tế không hóa đơn</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Danh Sách Khoản Chi Tiêu Nội Bộ ({visibleExpenses.length} bản ghi)
              </h3>
              <p className="text-[11px] text-slate-300">
                Thủ quỹ, Kế toán, Văn thư và Hiệu trưởng theo dõi theo đúng phân quyền bảo mật
              </p>
            </div>
          </div>

          <span className="text-xs bg-white/10 px-3 py-1 rounded-lg text-amber-300 font-bold font-mono">
            Tổng tiền: {visibleExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('vi-VN')} đ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 w-14 text-center">Số phiếu</th>
                <th className="py-3 px-4 min-w-40">Người nhập & Người chi</th>
                <th className="py-3 px-3 min-w-28">Thời gian & Địa điểm</th>
                <th className="py-3 px-4 min-w-64">Tiêu đề & Nội dung chi</th>
                <th className="py-3 px-3 min-w-28 text-right">Số tiền (VNĐ)</th>
                <th className="py-3 px-3 min-w-32 text-center">Loại chứng từ</th>
                <th className="py-3 px-3 min-w-32 text-center">Duyệt của HT</th>
                <th className="py-3 px-3 min-w-36 text-center">Tiến độ trả tiền</th>
                <th className="py-3 px-4 min-w-44 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleExpenses.length > 0 ? (
                visibleExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center font-mono font-black text-slate-800 bg-slate-50">
                      {item.expenseCode}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900">
                        {item.spenderName} <span className="font-normal text-slate-500">(Người chi)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Người nhập: <span className="font-semibold text-slate-700">{item.creatorName}</span> ({item.creatorRole})
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div className="font-semibold text-slate-800">
                        {new Date(item.expenseDate).toLocaleDateString('vi-VN')} {item.expenseTime && `(${item.expenseTime})`}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-36" title={item.expenseLocation}>
                        {item.expenseLocation}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 leading-snug">{item.title}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.content}
                      </div>
                      <div className="text-[10px] text-indigo-700 font-bold mt-1">
                        Danh mục: {item.category}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-black text-sm text-red-700">
                      {item.amount.toLocaleString('vi-VN')} đ
                    </td>

                    <td className="py-3 px-3 text-center">
                      {item.expenseType === 'CO_HOA_DON_DO' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          Hóa đơn đỏ: {item.invoiceNumber || 'Có'}
                        </span>
                      )}
                      {item.expenseType === 'PHIEU_CHI_NOI_BO' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Phiếu chi nội bộ
                        </span>
                      )}
                      {item.expenseType === 'CHI_KHONG_HOA_DON' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Chi không hóa đơn
                        </span>
                      )}
                    </td>

                    {/* 3.2. Hiệu trưởng duyệt */}
                    <td className="py-3 px-3 text-center">
                      {item.approvalStatus === 'CHO_HT_DUYET' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Chờ HT duyệt</span>
                        </span>
                      )}
                      {item.approvalStatus === 'HT_DA_DUYET' && (
                        <div>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>HT Đã Duyệt</span>
                          </span>
                          {item.principalNote && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5 max-w-36 truncate" title={item.principalNote}>
                              "{item.principalNote}"
                            </div>
                          )}
                        </div>
                      )}
                      {item.approvalStatus === 'HT_TU_CHOI' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-700" />
                          <span>Từ chối</span>
                        </span>
                      )}
                    </td>

                    {/* Tiến độ hoàn ứng / trả tiền của nhà trường */}
                    <td className="py-3 px-3 text-center">
                      {item.settlementStatus === 'CHUA_THANH_TOAN' && (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Chưa trả tiền
                        </span>
                      )}
                      {item.settlementStatus === 'TRUONG_DA_TRA_TIEN' && (
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200 inline-flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-blue-700" />
                            <span>Trường đã trả</span>
                          </span>
                          <div className="text-[10px] font-mono font-bold text-blue-800">
                            {(item.paidBySchoolAmount || item.amount).toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Số phiếu: {item.reimbursementReceiptNo || 'HU-01'}
                          </div>
                        </div>
                      )}
                      {item.settlementStatus === 'DA_CHOT_KET_THUC' && (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>Đã chốt kết thúc</span>
                          </span>
                          <div className="text-[9px] text-slate-500">
                            Người chốt: {item.settledByName}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Thao tác tương ứng với từng vai trò */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Nút Xem chi tiết */}
                        <button
                          type="button"
                          onClick={() => setViewingExpense(item)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Xem</span>
                        </button>

                        {/* 3.2. Hiệu trưởng duyệt */}
                        {isPrincipal && item.approvalStatus === 'CHO_HT_DUYET' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setApprovingExpense(item);
                                setPrincipalApprovalNote(
                                  `ĐỒNG Ý DUYỆT CHI: Khoản chi đúng quy chế chi tiêu nội bộ năm học ${activeSchoolYear}. Giao kế toán và thủ quỹ xuất tiền hoàn ứng.`
                                );
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow transition inline-flex items-center gap-1"
                              title="Hiệu trưởng duyệt chi"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Duyệt</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRejectingExpense(item);
                                setRejectReason('Chứng từ chưa hợp lệ, đề nghị hoàn thiện bổ sung theo quy định.');
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1"
                              title="Từ chối duyệt chi"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}

                        {/* Nhà trường xuất tiền thanh toán (Kế toán hoặc HT) */}
                        {(isPrincipal || isAccountant) &&
                          item.approvalStatus === 'HT_DA_DUYET' &&
                          item.settlementStatus === 'CHUA_THANH_TOAN' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingExpense(item);
                                setPaidAmount(item.amount);
                                setReimbursementReceiptNo(`HU-${(expenses.length + 1).toString().padStart(2, '0')}`);
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow transition inline-flex items-center gap-1"
                              title="Xuất tiền nhà trường trả hoàn ứng"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Trả tiền</span>
                            </button>
                          )}

                        {/* 3.3. Nhận tiền từ trường & chốt kết thúc khoản chi */}
                        {item.settlementStatus === 'TRUONG_DA_TRA_TIEN' && !item.isClosed && (
                          <button
                            type="button"
                            onClick={() => {
                              setSettlingExpense(item);
                              setSettlementReceiptNo(item.reimbursementReceiptNo || `HU-${Date.now().toString().slice(-4)}`);
                              setSettlementNotes(
                                `Đã nhận đủ ${item.amount.toLocaleString('vi-VN')}đ từ nhà trường, đã thanh toán sòng phẳng cho bên cung cấp và chốt sổ kết thúc khoản chi.`
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow transition inline-flex items-center gap-1 animate-bounce"
                            title="Xác nhận nhận tiền & Chốt kết thúc khoản chi"
                          >
                            <FileCheck className="w-3 h-3 text-slate-950" />
                            <span>Chốt kết thúc chi</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Chưa có khoản chi tiêu nội bộ nào phù hợp với bộ lọc hiển thị.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: NHẬP NỘI DUNG CHI TIÊU MỚI (3.1) */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-red-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-base">Nhập Nội Dung Chi Tiêu Nội Bộ (Trình HT Duyệt)</h3>
                  <p className="text-[11px] text-rose-200">
                    Người nhập: {activeOperator.name} ({activeOperator.position})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Người nhập & Người chi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Người nhập vào sổ <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${activeOperator.name} (${activeOperator.position})`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-200/60 font-bold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Người chi thực tế <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={spenderName}
                    onChange={(e) => setSpenderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-red-600 outline-none text-slate-900"
                    placeholder="Họ tên người đã trực tiếp chi tiền..."
                  />
                </div>
              </div>

              {/* Thời gian, Địa điểm, SĐT người chi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Ngày chi tiền <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Giờ chi tiền:
                  </label>
                  <input
                    type="time"
                    value={expenseTime}
                    onChange={(e) => setExpenseTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số điện thoại người chi:
                  </label>
                  <input
                    type="text"
                    value={spenderPhone}
                    onChange={(e) => setSpenderPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="VD: 0913.456.789"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Địa điểm chi tiền <span className="text-red-600">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={expenseLocation}
                  onChange={(e) => setExpenseLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  placeholder="VD: Cửa hàng văn phòng phẩm La Hai, UBND xã Đồng Xuân..."
                />
              </div>

              {/* Tiêu đề & Nội dung chi */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tiêu đề khoản chi <span className="text-red-600">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-red-600 outline-none text-slate-900"
                  placeholder="VD: Mua 15 ram giấy A4 Double A phục vụ in đề thi giữa kỳ..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nội dung chi tiết & diễn giải mục đích chi <span className="text-red-600">*</span>:
                </label>
                <textarea
                  required
                  rows={3}
                  value={expenseContent}
                  onChange={(e) => setExpenseContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none leading-relaxed"
                  placeholder="Ghi rõ chi tiết hàng hóa, đơn giá, số lượng, phục vụ cho công việc nào..."
                />
              </div>

              {/* Số tiền, Loại chi, Danh mục */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số tiền chi (VNĐ) <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-black text-red-700 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {expenseAmount.toLocaleString('vi-VN')} đồng
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Loại chứng từ:
                  </label>
                  <select
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="CO_HOA_DON_DO">Có hóa đơn đỏ GTGT</option>
                    <option value="PHIEU_CHI_NOI_BO">Phiếu chi nội bộ</option>
                    <option value="CHI_KHONG_HOA_DON">Chi thực tế không hóa đơn</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Danh mục chi:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="Văn phòng phẩm">Văn phòng phẩm</option>
                    <option value="Tiếp khách & Hội nghị">Tiếp khách & Hội nghị</option>
                    <option value="Sửa chữa CSVC nhỏ">Sửa chữa CSVC nhỏ</option>
                    <option value="Xăng xe & Công tác phí">Xăng xe & Công tác phí</option>
                    <option value="Khen thưởng phong trào">Khen thưởng phong trào</option>
                    <option value="Hoạt động chuyên môn">Hoạt động chuyên môn</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              {/* Số hóa đơn đỏ nếu có */}
              {expenseType === 'CO_HOA_DON_DO' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số hóa đơn đỏ GTGT / Biên lai thuế điện tử <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="VD: HD-GTGT-0038921"
                  />
                </div>
              )}

              {/* Tệp đính kèm */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Đính kèm bản scan hóa đơn / ảnh chụp phiếu chi:
                </label>
                <input
                  type="text"
                  value={attachedFileName}
                  onChange={(e) => setAttachedFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  placeholder="Tên tệp đính kèm (VD: scan_hoa_don_vat.jpg)..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Trình Hiệu Trưởng Phê Duyệt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: HIỆU TRƯỞNG PHÊ DUYỆT CHI TIÊU (3.2) */}
      {/* ======================================================== */}
      {approvingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Hiệu Trưởng Phê Duyệt Chi Tiêu Nội Bộ</h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovingExpense(null)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmHTApprove} className="p-6 space-y-4 text-xs">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <div className="font-black text-slate-900 text-sm">{approvingExpense.title}</div>
                <div className="text-slate-700 leading-relaxed">{approvingExpense.content}</div>
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200 text-slate-600">
                  <span>
                    Người đề xuất: <strong>{approvingExpense.creatorName}</strong> ({approvingExpense.creatorRole})
                  </span>
                  <span className="font-mono font-black text-sm text-red-700">
                    {approvingExpense.amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Bút phê / Ý kiến chỉ đạo của Hiệu trưởng:
                </label>
                <textarea
                  rows={3}
                  required
                  value={principalApprovalNote}
                  onChange={(e) => setPrincipalApprovalNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-none leading-relaxed font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setApprovingExpense(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black shadow-md transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Ký Duyệt Chi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: HIỆU TRƯỞNG TỪ CHỐI DUYỆT CHI */}
      {/* ======================================================== */}
      {rejectingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-rose-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Từ Chối Duyệt Khoản Chi</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingExpense(null)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmHTReject} className="p-6 space-y-4 text-xs">
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-slate-800">
                <div className="font-bold">{rejectingExpense.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Số tiền: {rejectingExpense.amount.toLocaleString('vi-VN')} đ
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Lý do từ chối / Yêu cầu bổ sung:
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-600 outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRejectingExpense(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold shadow-md transition"
                >
                  Xác Nhận Trả Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: NHÀ TRƯỜNG THANH TOÁN TIỀN HOÀN ỨNG */}
      {/* ======================================================== */}
      {payingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Nhà Trường Chi Trả Tiền Hoàn Ứng</h3>
              </div>
              <button
                type="button"
                onClick={() => setPayingExpense(null)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSchoolPayment} className="p-6 space-y-3.5 text-xs">
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                <div className="font-bold text-slate-900">{payingExpense.title}</div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Người được thanh toán: <strong>{payingExpense.spenderName}</strong> ({payingExpense.creatorRole})
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Số tiền nhà trường chi trả (VNĐ):
                </label>
                <input
                  type="number"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-blue-800 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Số phiếu chi hoàn ứng / Mã giao dịch ngân hàng:
                </label>
                <input
                  type="text"
                  required
                  value={reimbursementReceiptNo}
                  onChange={(e) => setReimbursementReceiptNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="VD: HU-08/2026 hoặc UNC-9942"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayingExpense(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md transition"
                >
                  Xác Nhận Xuất Quỹ Trả Tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: NHẬN TIỀN & CHỐT KẾT THÚC KHOẢN CHI (3.3) */}
      {/* ======================================================== */}
      {settlingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-amber-600 text-slate-950 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-slate-950" />
                <h3 className="font-black text-base">
                  Báo Cáo Nhận Tiền & Chốt Kết Thúc Khoản Chi (3.3)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettlingExpense(null)}
                className="text-slate-950 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSettleAndClose} className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <div className="text-[11px] font-bold text-amber-900">
                  Số phiếu: {settlingExpense.expenseCode}
                </div>
                <div className="font-black text-slate-900 text-sm">{settlingExpense.title}</div>
                <div className="flex items-center justify-between pt-2 border-t border-amber-200 text-slate-700">
                  <span>
                    Số tiền trường đã trả: <strong>{(settlingExpense.paidBySchoolAmount || settlingExpense.amount).toLocaleString('vi-VN')} đ</strong>
                  </span>
                  <span className="text-emerald-700 font-bold">Đã nhận hoàn ứng</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Người báo cáo nhận tiền & chốt sổ:
                </label>
                <input
                  type="text"
                  disabled
                  value={`${activeOperator.name} (${activeOperator.position})`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Số phiếu / Chứng từ hoàn tất:
                </label>
                <input
                  type="text"
                  value={settlementReceiptNo}
                  onChange={(e) => setSettlementReceiptNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="VD: PC-01/2026 hoặc HU-2026-08"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nội dung báo cáo kết thúc khoản chi:
                </label>
                <textarea
                  rows={3}
                  required
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSettlingExpense(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Chốt & Kết Thúc Khoản Chi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: XEM CHI TIẾT KHOẢN CHI */}
      {/* ======================================================== */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Chi Tiết Phiếu Chi: {viewingExpense.expenseCode}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-black text-slate-900 text-sm">{viewingExpense.title}</div>
                <div className="text-slate-700 leading-relaxed">{viewingExpense.content}</div>
                <div className="text-base font-black text-red-700 pt-1">
                  {viewingExpense.amount.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Người nhập:</span>
                  <span className="font-bold text-slate-900">{viewingExpense.creatorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Người chi:</span>
                  <span className="font-bold text-slate-900">{viewingExpense.spenderName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Thời gian chi:</span>
                  <span>{new Date(viewingExpense.expenseDate).toLocaleDateString('vi-VN')} {viewingExpense.expenseTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Địa điểm:</span>
                  <span className="truncate block">{viewingExpense.expenseLocation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Hình thức chứng từ:</span>
                  <span className="font-semibold">{viewingExpense.expenseType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Danh mục:</span>
                  <span className="font-semibold text-indigo-700">{viewingExpense.category}</span>
                </div>
              </div>

              {viewingExpense.principalNote && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="font-bold text-emerald-900 mb-0.5">Ý kiến phê duyệt của Hiệu trưởng:</div>
                  <div className="text-slate-700">{viewingExpense.principalNote}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Duyệt ngày: {viewingExpense.approvedAt}</div>
                </div>
              )}

              {viewingExpense.isClosed && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <div className="font-bold mb-0.5">Đã chốt kết thúc khoản chi:</div>
                  <div className="text-slate-700">{viewingExpense.settlementNotes}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Chốt lúc: {viewingExpense.settledAt} bởi {viewingExpense.settledByName}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setViewingExpense(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
