import React, { useState, useRef } from 'react';
import {
  FacilityRepairProposal,
  PurchasedMaterialItem,
  UserAccount,
} from '../types/school';
import { ALL_CAMPUSES } from '../data/initialData';
import { storageService } from '../services/storageService';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Building,
  UserCheck,
  FileCheck,
  Send,
  Eye,
  CheckCircle,
  DollarSign,
  Calendar,
  Camera,
  Upload,
  Trash2,
  Lock,
  FileSpreadsheet,
  FolderOpen,
  ExternalLink,
  Image as ImageIcon,
  Receipt,
  ShoppingBag,
  ShieldCheck,
  Printer,
  X,
  Search,
  Check,
} from 'lucide-react';

interface FacilityRepairProps {
  currentUser: UserAccount | null;
  facilities: FacilityRepairProposal[];
  allStaff: { account: UserAccount }[];
  onRefreshData: () => void;
}

export const FacilityRepair: React.FC<FacilityRepairProps> = ({
  currentUser,
  facilities,
  allStaff,
  onRefreshData,
}) => {
  // Modal states
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [selectedFacilityForHtApproval, setSelectedFacilityForHtApproval] = useState<FacilityRepairProposal | null>(null);
  const [selectedFacilityForReport, setSelectedFacilityForReport] = useState<FacilityRepairProposal | null>(null);
  const [selectedFacilityForAcceptance, setSelectedFacilityForAcceptance] = useState<FacilityRepairProposal | null>(null);
  const [selectedFacilityForDetail, setSelectedFacilityForDetail] = useState<FacilityRepairProposal | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHO_DUYET' | 'DANG_SUA' | 'HOAN_THANH' | 'NGHIEM_THU'>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Step 1: Propose Form State
  const [title, setTitle] = useState('');
  const [campusName, setCampusName] = useState(ALL_CAMPUSES[0]?.name || '');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<FacilityRepairProposal['category']>('Điện & Quạt mát');
  const [urgency, setUrgency] = useState<FacilityRepairProposal['urgency']>('Cần gấp');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(500000);
  const [initialPhotos, setInitialPhotos] = useState<string[]>([]);
  const proposeCameraRef = useRef<HTMLInputElement>(null);
  const proposeUploadRef = useRef<HTMLInputElement>(null);

  // Step 2: HT Approval & Assignment Form State
  const [approvedBudget, setApprovedBudget] = useState(500000);
  const [htComment, setHtComment] = useState('');
  const [assignedPersonId, setAssignedPersonId] = useState('');
  const [assignedDeadline, setAssignedDeadline] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );

  // Step 3: Worker Completion Report Form State
  const [completionReport, setCompletionReport] = useState('');
  const [purchasedMaterials, setPurchasedMaterials] = useState<PurchasedMaterialItem[]>([
    {
      id: 'VT_1',
      name: '',
      quantity: 1,
      unit: 'Cái',
      unitPrice: 0,
      totalAmount: 0,
      notes: '',
    },
  ]);
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);
  const [isConfidentialForHt, setIsConfidentialForHt] = useState(true);
  const reportCameraRef = useRef<HTMLInputElement>(null);
  const reportUploadRef = useRef<HTMLInputElement>(null);

  // Step 4: HT Acceptance Form State
  const [htAcceptanceComment, setHtAcceptanceComment] = useState('Nghiệm thu đạt chuẩn kỹ thuật và an toàn điện nước. Chứng từ đầy đủ, đồng ý thanh quyết toán.');

  // Access rights
  const isHt = currentUser?.role === 'HT';
  const isPhtCsvc = currentUser?.id === 'PHT01' || (currentUser?.role === 'PHT' && currentUser?.position.includes('CSVC'));
  const isItAdmin = currentUser?.role === 'GV_TIN_HOC';
  const canApproveAndAccept = isHt || isPhtCsvc || isItAdmin;

  // Photo handlers for Step 1 (Propose)
  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>, isCompletion: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          if (isCompletion) {
            setCompletionPhotos((prev) => [...prev, dataUrl]);
          } else {
            setInitialPhotos((prev) => [...prev, dataUrl]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveInitialPhoto = (index: number) => {
    setInitialPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveCompletionPhoto = (index: number) => {
    setCompletionPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Material item handlers in Step 3
  const handleAddMaterialRow = () => {
    setPurchasedMaterials((prev) => [
      ...prev,
      {
        id: 'VT_' + (prev.length + 1) + '_' + Date.now().toString().slice(-3),
        name: '',
        quantity: 1,
        unit: 'Cái',
        unitPrice: 0,
        totalAmount: 0,
        notes: '',
      },
    ]);
  };

  const handleUpdateMaterialRow = (
    index: number,
    field: keyof PurchasedMaterialItem,
    value: string | number
  ) => {
    setPurchasedMaterials((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(value) : Number(item.quantity);
        const price = field === 'unitPrice' ? Number(value) : Number(item.unitPrice);
        item.totalAmount = qty * price;
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveMaterialRow = (index: number) => {
    if (purchasedMaterials.length <= 1) {
      setPurchasedMaterials([
        {
          id: 'VT_1',
          name: '',
          quantity: 1,
          unit: 'Cái',
          unitPrice: 0,
          totalAmount: 0,
          notes: '',
        },
      ]);
      return;
    }
    setPurchasedMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCalculatedCost = purchasedMaterials.reduce(
    (sum, item) => sum + (Number(item.totalAmount) || 0),
    0
  );

  // STEP 1: Submit new proposal
  const handlePropose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const campus = ALL_CAMPUSES.find((c) => c.name === campusName) || ALL_CAMPUSES[0];

    const newProposal: FacilityRepairProposal = {
      id: 'CSVC_' + Date.now().toString().slice(-4),
      title,
      campusId: campus.id,
      campusName: campus.name,
      location,
      category,
      urgency,
      description,
      estimatedCost,
      initialPhotos: initialPhotos.length > 0 ? initialPhotos : undefined,
      driveFolderId: '1DRIVE_DX_' + Date.now().toString().slice(-4),
      driveFolderUrl: 'https://drive.google.com/drive/folders/1DRIVE_DX_CSVC_THIET_BI_DONG_XUAN',
      driveSheetUrl: 'https://docs.google.com/spreadsheets/d/1SHEET_DX_CSVC_THIET_BI_DONG_XUAN/edit',
      proposerId: currentUser.id,
      proposerName: currentUser.name,
      proposerRole: currentUser.position,
      createdAt: new Date().toISOString().split('T')[0],
      approvalStatus: 'Chờ HT duyệt',
      executionStatus: 'Chưa thực hiện',
    };

    const currentList = storageService.getFacilities();
    currentList.unshift(newProposal);
    storageService.saveFacilities(currentList);

    storageService.addSyncLog(
      'Đề xuất sửa chữa CSVC',
      `Đồng chí ${currentUser.name} đề xuất: "${title}" tại ${campusName} (Có ${initialPhotos.length} ảnh/giấy đề xuất đồng bộ Drive)`
    );

    setShowProposeModal(false);
    setTitle('');
    setLocation('');
    setDescription('');
    setInitialPhotos([]);
    onRefreshData();
  };

  // STEP 2: HT approve & assign
  const handleHtApproveAndAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityForHtApproval) return;

    const assignedStaff = allStaff.find((s) => s.account.id === assignedPersonId);
    if (!assignedStaff) return;

    const currentList = storageService.getFacilities();
    const idx = currentList.findIndex((f) => f.id === selectedFacilityForHtApproval.id);
    if (idx !== -1) {
      currentList[idx].approvalStatus = 'Đã duyệt';
      currentList[idx].approvedBudget = approvedBudget;
      currentList[idx].htComment = htComment || 'Hiệu trưởng phê duyệt thực hiện.';
      currentList[idx].approvalDate = new Date().toISOString().split('T')[0];
      currentList[idx].assignedPersonId = assignedStaff.account.id;
      currentList[idx].assignedPersonName = assignedStaff.account.name;
      currentList[idx].assignedPersonRole = assignedStaff.account.position;
      currentList[idx].assignedDeadline = assignedDeadline;
      currentList[idx].executionStatus = 'Đang sửa chữa';
      storageService.saveFacilities(currentList);
    }

    storageService.addSyncLog(
      'HT duyệt & phân công CSVC',
      `Hiệu trưởng duyệt dự toán ${approvedBudget.toLocaleString('vi-VN')}đ và phân công đồng chí ${assignedStaff.account.name} (${assignedStaff.account.position}) thực hiện.`
    );

    setSelectedFacilityForHtApproval(null);
    onRefreshData();
  };

  // STEP 3: Assigned person writes completion report & material costs
  const handleReportCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityForReport) return;

    const finalCost = totalCalculatedCost > 0 ? totalCalculatedCost : (selectedFacilityForReport.approvedBudget || 500000);
    const validMaterials = purchasedMaterials.filter((m) => m.name.trim().length > 0);

    const currentList = storageService.getFacilities();
    const idx = currentList.findIndex((f) => f.id === selectedFacilityForReport.id);
    if (idx !== -1) {
      currentList[idx].executionStatus = 'Đã hoàn thành';
      currentList[idx].completionReport = completionReport;
      currentList[idx].completionDate = new Date().toISOString().split('T')[0];
      currentList[idx].actualCost = finalCost;
      currentList[idx].purchasedMaterials = validMaterials.length > 0 ? validMaterials : undefined;
      currentList[idx].completionPhotos = completionPhotos.length > 0 ? completionPhotos : undefined;
      currentList[idx].isConfidentialForHt = isConfidentialForHt;
      storageService.saveFacilities(currentList);
    }

    storageService.addSyncLog(
      'Báo cáo kết quả sửa chữa CSVC',
      `Đồng chí ${selectedFacilityForReport.assignedPersonName} hoàn thành sửa chữa: "${selectedFacilityForReport.title}". Tổng số tiền vật tư: ${finalCost.toLocaleString('vi-VN')}đ (Báo cáo riêng Hiệu trưởng).`
    );

    setSelectedFacilityForReport(null);
    setCompletionReport('');
    setCompletionPhotos([]);
    setPurchasedMaterials([
      {
        id: 'VT_1',
        name: '',
        quantity: 1,
        unit: 'Cái',
        unitPrice: 0,
        totalAmount: 0,
        notes: '',
      },
    ]);
    onRefreshData();
  };

  // STEP 4: HT acceptance
  const handleHtAcceptance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityForAcceptance) return;

    const currentList = storageService.getFacilities();
    const idx = currentList.findIndex((f) => f.id === selectedFacilityForAcceptance.id);
    if (idx !== -1) {
      currentList[idx].executionStatus = 'Nghiệm thu đạt';
      currentList[idx].htAcceptanceComment = htAcceptanceComment;
      currentList[idx].htAcceptanceDate = new Date().toISOString().split('T')[0];
      storageService.saveFacilities(currentList);
    }

    storageService.addSyncLog(
      'HT nghiệm thu CSVC',
      `Hiệu trưởng Nguyễn Quốc Bảo đã nghiệm thu đạt hạng mục: "${selectedFacilityForAcceptance.title}". Quyết toán: ${selectedFacilityForAcceptance.actualCost?.toLocaleString('vi-VN')}đ.`
    );

    setSelectedFacilityForAcceptance(null);
    onRefreshData();
  };

  // Filter facilities
  const filteredFacilities = facilities.filter((f) => {
    if (statusFilter === 'CHO_DUYET' && f.approvalStatus !== 'Chờ HT duyệt') return false;
    if (statusFilter === 'DANG_SUA' && f.executionStatus !== 'Đang sửa chữa') return false;
    if (statusFilter === 'HOAN_THANH' && f.executionStatus !== 'Đã hoàn thành') return false;
    if (statusFilter === 'NGHIEM_THU' && f.executionStatus !== 'Nghiệm thu đạt') return false;
    if (campusFilter !== 'ALL' && f.campusName !== campusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(term);
      const matchCampus = f.campusName.toLowerCase().includes(term);
      const matchProposer = f.proposerName.toLowerCase().includes(term);
      const matchAssigned = (f.assignedPersonName || '').toLowerCase().includes(term);
      const matchId = f.id.toLowerCase().includes(term);
      if (!matchTitle && !matchCampus && !matchProposer && !matchAssigned && !matchId) return false;
    }
    return true;
  });

  // Check if current user can view confidential cost/materials
  const canViewConfidentialDetails = (f: FacilityRepairProposal) => {
    if (!f.isConfidentialForHt) return true;
    if (isHt || isPhtCsvc || isItAdmin) return true;
    if (currentUser?.id === f.assignedPersonId) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Google Drive and Sheet Links */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" />
              <span>Quy trình khép kín CSVC & Thiết bị</span>
            </span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Google Drive & Sheet riêng</span>
            </span>
            <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Báo cáo vật tư bảo mật mỗi HT biết</span>
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 mt-1">
            Quản Lý & Sửa Chữa Cơ Sở Vật Chất, Thiết Bị 12 Điểm Trường
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            GV, Nhân viên, Bảo vệ đề xuất (kèm ảnh chụp/tải ảnh Drive) → HT duyệt & phân công → Người làm báo cáo kết quả & chi phí vật tư gửi riêng HT.
          </p>
        </div>

        {/* Action Buttons: New proposal & Direct Drive links */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://drive.google.com/drive/folders/1DRIVE_DX_CSVC_THIET_BI_DONG_XUAN"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-sm transition"
            title="Mở thư mục Google Drive riêng lưu ảnh và giấy đề xuất CSVC"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Thư mục Drive CSVC</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <a
            href="https://docs.google.com/spreadsheets/d/1SHEET_DX_CSVC_THIET_BI_DONG_XUAN/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs shadow-sm transition"
            title="Mở file Google Sheet riêng theo dõi CSVC 52 cột A-AZ"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sheet CSVC (A-AZ)</span>
            <ExternalLink className="w-3 h-3 text-emerald-500" />
          </a>

          <button
            type="button"
            onClick={() => setShowProposeModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Làm Giấy Đề Xuất Sửa Chữa</span>
          </button>
        </div>
      </div>

      {/* 4 Step Workflow Diagram */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-black text-sm flex-shrink-0">
            1
          </div>
          <div>
            <h4 className="font-bold text-slate-900">GV / NV / Bảo vệ đề xuất</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chụp ảnh hiện trạng & giấy đề xuất, tải ảnh lên Google Drive lưu.
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-black text-sm flex-shrink-0">
            2
          </div>
          <div>
            <h4 className="font-bold text-slate-900">HT duyệt & phân công</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Thầy HT Nguyễn Quốc Bảo duyệt kinh phí & giao GV, NV, Bảo vệ thực hiện.
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm flex-shrink-0">
            3
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Báo cáo kết quả & vật tư</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Người thực hiện kê khai vật tư, chụp ảnh hóa đơn, báo cáo mỗi HT biết.
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm flex-shrink-0">
            4
          </div>
          <div>
            <h4 className="font-bold text-slate-900">HT nghiệm thu & quyết toán</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              HT kiểm tra kết quả, nghiệm thu đạt và thanh toán kinh phí vật tư.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hạng mục, điểm trường, người đề xuất, mã CSVC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none focus:ring-1 focus:ring-red-600"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status buttons */}
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-100 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Tất cả ({facilities.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CHO_DUYET')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                statusFilter === 'CHO_DUYET' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Chờ HT duyệt ({facilities.filter((f) => f.approvalStatus === 'Chờ HT duyệt').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DANG_SUA')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                statusFilter === 'DANG_SUA' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Đang sửa chữa ({facilities.filter((f) => f.executionStatus === 'Đang sửa chữa').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('HOAN_THANH')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                statusFilter === 'HOAN_THANH' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Đã báo cáo ({facilities.filter((f) => f.executionStatus === 'Đã hoàn thành').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('NGHIEM_THU')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                statusFilter === 'NGHIEM_THU' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Nghiệm thu đạt ({facilities.filter((f) => f.executionStatus === 'Nghiệm thu đạt').length})
            </button>
          </div>

          {/* Campus dropdown */}
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
          >
            <option value="ALL">Tất cả 12 điểm trường</option>
            {ALL_CAMPUSES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Facility Proposals List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Danh Sách Đề Xuất & Báo Cáo Sửa Chữa CSVC ({filteredFacilities.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Lưu trữ tập trung Google Drive & Sheets
          </span>
        </div>

        {filteredFacilities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Wrench className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="font-medium text-slate-600">Không tìm thấy đề xuất sửa chữa nào phù hợp bộ lọc.</p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setCampusFilter('ALL');
                setSearchTerm('');
              }}
              className="text-red-700 font-bold underline"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFacilities.map((f) => {
              const isAssignedToUser =
                currentUser && (f.assignedPersonId === currentUser.id || canApproveAndAccept);
              const canViewConfidential = canViewConfidentialDetails(f);

              return (
                <div key={f.id} className="p-5 hover:bg-slate-50/50 transition space-y-4">
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {f.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          f.urgency === 'Khẩn cấp'
                            ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                            : f.urgency === 'Cần gấp'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {f.urgency}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {f.category}
                      </span>
                      {f.isConfidentialForHt && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Báo cáo riêng HT</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {f.executionStatus === 'Nghiệm thu đạt' ? (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Đã Nghiệm Thu Đạt</span>
                        </span>
                      ) : f.executionStatus === 'Đã hoàn thành' ? (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã báo cáo • Chờ HT nghiệm thu</span>
                        </span>
                      ) : f.approvalStatus === 'Đã duyệt' ? (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-blue-600" />
                          <span>Đang sửa chữa</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Chờ Hiệu trưởng duyệt</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Proposal Title & Metadata */}
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{f.title}</h4>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{f.campusName}</strong> ({f.location})
                      </span>
                      <span>•</span>
                      <span>
                        Người đề xuất: <strong>{f.proposerName}</strong> ({f.proposerRole})
                      </span>
                      <span>•</span>
                      <span>Ngày gửi: {f.createdAt}</span>
                      <span>•</span>
                      <span>
                        Dự toán: <strong className="text-red-700">{f.estimatedCost.toLocaleString('vi-VN')} đ</strong>
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {f.description}
                    </p>
                  </div>

                  {/* Initial Photos / Paper Proposal Thumbnails */}
                  {f.initialPhotos && f.initialPhotos.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                        <Camera className="w-3.5 h-3.5 text-orange-600" />
                        <span>Ảnh hiện trạng hư hỏng & Giấy đề xuất (Google Drive):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {f.initialPhotos.map((photo, i) => (
                          <div
                            key={i}
                            onClick={() => setPreviewPhotoUrl(photo)}
                            className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-red-500 transition relative group"
                            title="Bấm để xem ảnh phóng to"
                          >
                            <img src={photo} alt={`Hiện trạng ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stage 2 Box: HT Decision & Assignment */}
                  {f.approvalStatus === 'Đã duyệt' && (
                    <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-blue-900">
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-blue-700" />
                          <span>Hiệu trưởng Nguyễn Quốc Bảo đã phê duyệt & giao việc:</span>
                        </span>
                        <span className="text-blue-800 font-mono font-bold">
                          Kinh phí duyệt: {f.approvedBudget?.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="text-slate-700">
                        Người thực hiện:{' '}
                        <strong className="text-red-700">
                          {f.assignedPersonName} ({f.assignedPersonRole})
                        </strong>{' '}
                        • Hạn hoàn thành: <strong>{f.assignedDeadline}</strong>
                      </div>
                      {f.htComment && (
                        <div className="text-slate-600 italic bg-white/70 p-2 rounded-lg border border-blue-100">
                          " {f.htComment} "
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage 3 Box: Completion Report & Materials Breakdown (Confidential For HT) */}
                  {(f.executionStatus === 'Đã hoàn thành' || f.executionStatus === 'Nghiệm thu đạt') && (
                    <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-2">
                      <div className="font-bold text-emerald-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-emerald-700" />
                          <span>Giấy báo cáo kết quả của đồng chí {f.assignedPersonName}:</span>
                        </span>
                        {canViewConfidential ? (
                          <span className="text-emerald-800 font-mono font-bold bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                            Số tiền thực tế: {f.actualCost?.toLocaleString('vi-VN')} đ
                          </span>
                        ) : (
                          <span className="text-blue-700 font-semibold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Bảo mật gửi riêng HT</span>
                          </span>
                        )}
                      </div>

                      <div className="text-slate-800 font-medium whitespace-pre-wrap bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                        {f.completionReport}
                      </div>

                      {/* Materials Breakdown (Shown only if permitted) */}
                      {canViewConfidential && f.purchasedMaterials && f.purchasedMaterials.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          <div className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                            <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Bảng kê chi tiết vật tư đã mua sắm:</span>
                          </div>
                          <div className="overflow-x-auto bg-white rounded-lg border border-emerald-200">
                            <table className="w-full text-[11px] text-left">
                              <thead className="bg-emerald-100/60 font-bold text-slate-700 border-b border-emerald-200">
                                <tr>
                                  <th className="py-1 px-2 text-center w-8">STT</th>
                                  <th className="py-1 px-2">Tên vật tư mua sắm</th>
                                  <th className="py-1 px-2 text-center">Số lượng</th>
                                  <th className="py-1 px-2 text-right">Đơn giá</th>
                                  <th className="py-1 px-2 text-right">Thành tiền</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-100">
                                {f.purchasedMaterials.map((m, idx) => (
                                  <tr key={m.id || idx}>
                                    <td className="py-1 px-2 text-center text-slate-400">{idx + 1}</td>
                                    <td className="py-1 px-2 font-medium text-slate-900">{m.name}</td>
                                    <td className="py-1 px-2 text-center font-medium">
                                      {m.quantity} {m.unit}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono text-slate-600">
                                      {m.unitPrice.toLocaleString('vi-VN')} đ
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono font-bold text-emerald-800">
                                      {m.totalAmount.toLocaleString('vi-VN')} đ
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-emerald-50/80 font-bold text-emerald-900">
                                  <td colSpan={4} className="py-1.5 px-2 text-right uppercase text-[10px]">
                                    Tổng cộng kinh phí vật tư:
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono font-black text-emerald-950">
                                    {f.actualCost?.toLocaleString('vi-VN')} đ
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : !canViewConfidential && f.isConfidentialForHt ? (
                        <div className="bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                          <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span>
                            Chi tiết hóa đơn, bảng kê vật tư và số tiền đã mua sắm được bảo mật gửi riêng Thầy Hiệu trưởng Nguyễn Quốc Bảo theo đúng quy chế quản trị nội bộ.
                          </span>
                        </div>
                      ) : null}

                      {/* Completion Photos & Receipts */}
                      {f.completionPhotos && f.completionPhotos.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                            <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Ảnh nghiệm thu hoàn thành & Hóa đơn chứng từ mua sắm:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {f.completionPhotos.map((photo, i) => (
                              <div
                                key={i}
                                onClick={() => setPreviewPhotoUrl(photo)}
                                className="w-20 h-20 rounded-xl overflow-hidden border border-emerald-300 cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-emerald-500 transition relative group"
                                title="Bấm để xem ảnh phóng to"
                              >
                                <img src={photo} alt={`Nghiệm thu ${i + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* HT Acceptance comment if completed */}
                      {f.htAcceptanceComment && (
                        <div className="bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-300 text-emerald-950 text-xs flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Hiệu trưởng nghiệm thu:</strong> {f.htAcceptanceComment} ({f.htAcceptanceDate})
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons for Each Stage */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedFacilityForDetail(f)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Xem Toàn Bộ Hồ Sơ</span>
                    </button>

                    {/* Step 2 Trigger: HT approves & assigns */}
                    {canApproveAndAccept && f.approvalStatus === 'Chờ HT duyệt' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFacilityForHtApproval(f);
                          setApprovedBudget(f.estimatedCost);
                        }}
                        className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Hiệu Trưởng Duyệt & Phân Công Người Sửa</span>
                      </button>
                    )}

                    {/* Step 3 Trigger: Assigned worker reports completion */}
                    {f.approvalStatus === 'Đã duyệt' &&
                      f.executionStatus !== 'Đã hoàn thành' &&
                      f.executionStatus !== 'Nghiệm thu đạt' &&
                      isAssignedToUser && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFacilityForReport(f);
                            if (f.purchasedMaterials && f.purchasedMaterials.length > 0) {
                              setPurchasedMaterials(f.purchasedMaterials);
                            }
                            if (f.completionPhotos) {
                              setCompletionPhotos(f.completionPhotos);
                            }
                          }}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Viết Giấy Báo Cáo Kết Quả & Vật Tư</span>
                        </button>
                      )}

                    {/* Step 4 Trigger: HT accepts & signs off */}
                    {canApproveAndAccept && f.executionStatus === 'Đã hoàn thành' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFacilityForAcceptance(f);
                        }}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Hiệu Trưởng Nghiệm Thu Đạt & Quyết Toán</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: NEW PROPOSAL (GV, NV, Bảo vệ đề xuất) */}
      {/* ======================================================== */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  Bước 1: GV - Nhân viên - Bảo vệ lập giấy đề xuất
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  Giấy Đề Xuất Sửa Chữa Cơ Sở Vật Chất & Thiết Bị
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProposeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePropose} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600">
                Người lập đề xuất:{' '}
                <strong className="text-slate-900">{currentUser?.name}</strong> (
                {currentUser?.position} - {currentUser?.campusName})
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên hạng mục hư hại / cần sửa chữa: <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Sửa chữa máy bơm nước, thay bóng đèn LED, gia cố bàn ghế..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Điểm trường (12 điểm):</label>
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
                  <label className="font-bold text-slate-700 block mb-1">Loại thiết bị / CSVC:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="Điện & Quạt mát">Điện & Quạt mát</option>
                    <option value="Hệ thống Nước & Vệ sinh">Hệ thống Nước & Vệ sinh</option>
                    <option value="Bàn ghế học sinh">Bàn ghế học sinh</option>
                    <option value="Cửa & Mái tôn">Cửa & Mái tôn</option>
                    <option value="Thiết bị Tin học & Tivi">Thiết bị Tin học & Tivi</option>
                    <option value="Khác">Hạng mục khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vị trí phòng học / khuôn viên:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Phòng học 9C, Khu vệ sinh học sinh..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mức độ khẩn cấp:</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium font-bold text-red-700"
                  >
                    <option value="Khẩn cấp">Khẩn cấp (nguy hiểm / ảnh hưởng học sinh)</option>
                    <option value="Cần gấp">Cần gấp (trong 2-3 ngày)</option>
                    <option value="Bình thường">Bình thường (bảo dưỡng theo kế hoạch)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mô tả chi tiết hiện trạng hư hỏng & phương án đề xuất:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Mô tả cụ thể linh kiện hỏng, số lượng, nguyên nhân..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dự toán kinh phí sơ bộ (VND):</label>
                <input
                  type="number"
                  min={0}
                  step={50000}
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                />
              </div>

              {/* Photos & Document Upload (Camera & File upload to Drive) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 block text-xs">
                      Ảnh hiện trạng hư hỏng & Giấy đề xuất (Lưu Google Drive):
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Chụp trực tiếp từ camera hoặc tải ảnh từ bộ nhớ máy tính, điện thoại.
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {initialPhotos.length} ảnh
                  </span>
                </div>

                {/* Hidden file inputs */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={proposeCameraRef}
                  onChange={(e) => handleAddPhotos(e, false)}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  ref={proposeUploadRef}
                  onChange={(e) => handleAddPhotos(e, false)}
                  className="hidden"
                />

                {/* Trigger buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => proposeCameraRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Chụp ảnh hiện trạng (Camera)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => proposeUploadRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy tính / điện thoại</span>
                  </button>
                </div>

                {/* Image Previews */}
                {initialPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {initialPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300 group"
                      >
                        <img src={photo} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveInitialPhoto(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                          title="Xóa ảnh này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition flex items-center gap-1.5"
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
      {/* MODAL 2: HT APPROVE & ASSIGN WORKER */}
      {/* ======================================================== */}
      {selectedFacilityForHtApproval && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Bước 2: Ban Giám hiệu phê duyệt
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  Hiệu Trưởng Phê Duyệt & Phân Công Người Thực Hiện
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacilityForHtApproval(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleHtApproveAndAssign} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{selectedFacilityForHtApproval.title}</div>
                <div className="text-slate-500">
                  {selectedFacilityForHtApproval.campusName} ({selectedFacilityForHtApproval.location}) • Người đề xuất:{' '}
                  <strong>{selectedFacilityForHtApproval.proposerName}</strong>
                </div>
                <div className="text-slate-700 mt-1">{selectedFacilityForHtApproval.description}</div>
                <div className="text-red-700 font-bold">
                  Dự toán đề xuất: {selectedFacilityForHtApproval.estimatedCost.toLocaleString('vi-VN')} đ
                </div>
              </div>

              {selectedFacilityForHtApproval.initialPhotos && selectedFacilityForHtApproval.initialPhotos.length > 0 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Ảnh hiện trạng & Giấy đề xuất đính kèm:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedFacilityForHtApproval.initialPhotos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt="Hiện trạng"
                        onClick={() => setPreviewPhotoUrl(photo)}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 cursor-pointer hover:ring-2 hover:ring-red-500"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Kinh phí Hiệu trưởng phê duyệt (VND): <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={50000}
                  value={approvedBudget}
                  onChange={(e) => setApprovedBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-red-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Phân công Giáo viên, Nhân viên hoặc Bảo vệ thực hiện: <span className="text-red-600">*</span>
                </label>
                <select
                  value={assignedPersonId}
                  onChange={(e) => setAssignedPersonId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                >
                  <option value="">-- Chọn cán bộ, giáo viên, nhân viên hoặc bảo vệ --</option>
                  {allStaff.map((s) => (
                    <option key={s.account.id} value={s.account.id}>
                      {s.account.name} — {s.account.position} ({s.account.campusName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Thời hạn hoàn thành:</label>
                <input
                  type="date"
                  required
                  value={assignedDeadline}
                  onChange={(e) => setAssignedDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ý kiến chỉ đạo của Hiệu trưởng:</label>
                <textarea
                  rows={2}
                  value={htComment}
                  onChange={(e) => setHtComment(e.target.value)}
                  placeholder="Giao nhiệm vụ, yêu cầu an toàn kỹ thuật, xuất hóa đơn chứng từ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFacilityForHtApproval(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Ký Duyệt & Phân Công Nhiệm Vụ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: WORKER COMPLETION REPORT & MATERIALS BREAKDOWN */}
      {/* (Báo cáo kết quả, vật tư đã mua sắm - Báo cáo mỗi HT biết) */}
      {/* ======================================================== */}
      {selectedFacilityForReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Bước 3: Người được phân công thực hiện báo cáo
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  Giấy Báo Cáo Kết Quả Thực Hiện & Chi Phí Vật Tư Mua Sắm
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacilityForReport(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReportCompletion} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{selectedFacilityForReport.title}</div>
                <div>
                  Người thực hiện: <strong className="text-red-700">{selectedFacilityForReport.assignedPersonName}</strong>
                </div>
                <div>
                  Kinh phí HT duyệt:{' '}
                  <strong>{selectedFacilityForReport.approvedBudget?.toLocaleString('vi-VN')} đ</strong> • Hạn:{' '}
                  <strong>{selectedFacilityForReport.assignedDeadline}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nội dung chi tiết các công việc đã thực hiện: <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi rõ chi tiết việc sửa chữa, thay thế linh kiện, kết quả vận hành thử nghiệm an toàn..."
                  value={completionReport}
                  onChange={(e) => setCompletionReport(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              {/* Purchased Materials Table (Vật tư đã mua sắm) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />
                    <span>Bảng Kê Chi Tiết Vật Tư Đã Mua Sắm (Báo cáo mỗi HT biết):</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMaterialRow}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg border border-blue-200 text-[11px] flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Thêm Dòng Vật Tư</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/50">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2 px-2 w-8 text-center">STT</th>
                        <th className="py-2 px-2">Tên vật tư (bóng, dây, khóa, keo...)</th>
                        <th className="py-2 px-2 w-20 text-center">Số lượng</th>
                        <th className="py-2 px-2 w-16 text-center">ĐVT</th>
                        <th className="py-2 px-2 w-28 text-right">Đơn giá (đ)</th>
                        <th className="py-2 px-2 w-28 text-right">Thành tiền (đ)</th>
                        <th className="py-2 px-1 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {purchasedMaterials.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-1 px-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-1 px-2">
                            <input
                              type="text"
                              required
                              placeholder="VD: Bóng LED 1m2 Rạng Đông"
                              value={item.name}
                              onChange={(e) => handleUpdateMaterialRow(idx, 'name', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-medium"
                            />
                          </td>
                          <td className="py-1 px-2">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateMaterialRow(idx, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-center font-bold"
                            />
                          </td>
                          <td className="py-1 px-2">
                            <input
                              type="text"
                              placeholder="Cái"
                              value={item.unit}
                              onChange={(e) => handleUpdateMaterialRow(idx, 'unit', e.target.value)}
                              className="w-full px-1.5 py-1 rounded border border-slate-200 text-xs text-center"
                            />
                          </td>
                          <td className="py-1 px-2">
                            <input
                              type="number"
                              min={0}
                              step={5000}
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateMaterialRow(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-right font-mono"
                            />
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-blue-900">
                            {(item.quantity * item.unitPrice).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-1 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterialRow(idx)}
                              className="text-slate-300 hover:text-red-600 p-0.5"
                              title="Xóa dòng"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50 font-bold text-blue-950">
                        <td colSpan={5} className="py-2 px-3 text-right uppercase text-[11px]">
                          Tổng số tiền vật tư đã mua sắm:
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-sm font-black text-red-700">
                          {totalCalculatedCost.toLocaleString('vi-VN')} đ
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Photos of Results & Invoices */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 block text-xs">
                      Ảnh hiện trạng sau sửa chữa & Hóa đơn chứng từ (Lưu Google Drive):
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Chụp camera hoặc tải ảnh hóa đơn mua sắm vật tư từ điện thoại, máy tính.
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {completionPhotos.length} ảnh
                  </span>
                </div>

                {/* Hidden file inputs */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={reportCameraRef}
                  onChange={(e) => handleAddPhotos(e, true)}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  ref={reportUploadRef}
                  onChange={(e) => handleAddPhotos(e, true)}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => reportCameraRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Chụp ảnh nghiệm thu / Hóa đơn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => reportUploadRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy tính / điện thoại</span>
                  </button>
                </div>

                {completionPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {completionPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300 group"
                      >
                        <img src={photo} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveCompletionPhoto(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                          title="Xóa ảnh này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confidentiality Checkbox */}
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <label className="flex items-start gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isConfidentialForHt}
                    onChange={(e) => setIsConfidentialForHt(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <span>
                    Báo cáo nội dung và số tiền (vật tư đã mua sắm) chỉ mỗi Hiệu trưởng biết (Quy định bảo mật nội bộ)
                  </span>
                </label>
                <p className="text-[11px] text-amber-800 mt-1 pl-6">
                  Khi tích chọn, thông tin chi tiết bảng kê số tiền vật tư chỉ hiển thị riêng cho Thầy Hiệu trưởng Nguyễn Quốc Bảo và các tài khoản quản trị được phân quyền.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFacilityForReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ký Giấy Báo Cáo Gửi Hiệu Trưởng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: HT ACCEPTANCE (Hiệu trưởng nghiệm thu đạt) */}
      {/* ======================================================== */}
      {selectedFacilityForAcceptance && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Bước 4: Hiệu trưởng nghiệm thu
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  Nghiệm Thu Đạt Chuẩn & Quyết Toán Kinh Phí
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacilityForAcceptance(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleHtAcceptance} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{selectedFacilityForAcceptance.title}</div>
                <div>Điểm trường: <strong>{selectedFacilityForAcceptance.campusName}</strong></div>
                <div>Người thực hiện: <strong>{selectedFacilityForAcceptance.assignedPersonName}</strong></div>
                <div className="text-red-700 font-bold text-sm">
                  Tổng tiền quyết toán: {selectedFacilityForAcceptance.actualCost?.toLocaleString('vi-VN')} đ
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ý kiến đánh giá và kết luận nghiệm thu của Hiệu trưởng:
                </label>
                <textarea
                  rows={3}
                  required
                  value={htAcceptanceComment}
                  onChange={(e) => setHtAcceptanceComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFacilityForAcceptance(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Xác Nhận Nghiệm Thu Đạt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: FULL DOSSIER DETAIL VIEW */}
      {/* ======================================================== */}
      {selectedFacilityForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border">
                  {selectedFacilityForDetail.id}
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  Hồ Sơ Sửa Chữa Cơ Sở Vật Chất Đầy Đủ
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Hồ Sơ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFacilityForDetail(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* Header Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-base text-slate-900">{selectedFacilityForDetail.title}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                  <div>Điểm trường: <strong>{selectedFacilityForDetail.campusName}</strong></div>
                  <div>Vị trí: <strong>{selectedFacilityForDetail.location}</strong></div>
                  <div>Phân loại: <strong>{selectedFacilityForDetail.category}</strong></div>
                  <div>Mức độ: <strong className="text-red-700">{selectedFacilityForDetail.urgency}</strong></div>
                </div>
                <div className="text-slate-600">
                  Người đề xuất: <strong>{selectedFacilityForDetail.proposerName}</strong> (
                  {selectedFacilityForDetail.proposerRole}) • Ngày gửi: {selectedFacilityForDetail.createdAt}
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800">
                  {selectedFacilityForDetail.description}
                </div>
              </div>

              {/* Initial Photos */}
              {selectedFacilityForDetail.initialPhotos && selectedFacilityForDetail.initialPhotos.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-orange-600" />
                    <span>Ảnh hiện trạng hư hại & Giấy đề xuất ban đầu (Google Drive):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFacilityForDetail.initialPhotos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt="Hiện trạng"
                        onClick={() => setPreviewPhotoUrl(photo)}
                        className="w-24 h-24 rounded-xl object-cover border border-slate-200 cursor-pointer hover:ring-2 hover:ring-red-500"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* HT Approval & Assignment */}
              {selectedFacilityForDetail.approvalStatus === 'Đã duyệt' && (
                <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-700" />
                      <span>Quyết định phê duyệt của Hiệu trưởng Nguyễn Quốc Bảo:</span>
                    </span>
                    <span className="font-mono text-blue-800">
                      Duyệt: {selectedFacilityForDetail.approvedBudget?.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div>
                    Người được giao nhiệm vụ:{' '}
                    <strong className="text-red-700">
                      {selectedFacilityForDetail.assignedPersonName} ({selectedFacilityForDetail.assignedPersonRole})
                    </strong>{' '}
                    • Hạn: <strong>{selectedFacilityForDetail.assignedDeadline}</strong>
                  </div>
                  {selectedFacilityForDetail.htComment && (
                    <div className="italic text-slate-700 bg-white/70 p-2.5 rounded-xl border border-blue-100">
                      " {selectedFacilityForDetail.htComment} "
                    </div>
                  )}
                </div>
              )}

              {/* Completion Report & Confidential Financial Section */}
              {(selectedFacilityForDetail.executionStatus === 'Đã hoàn thành' ||
                selectedFacilityForDetail.executionStatus === 'Nghiệm thu đạt') && (
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between font-bold text-emerald-950">
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                      <span>Báo cáo kết quả của đồng chí {selectedFacilityForDetail.assignedPersonName}:</span>
                    </span>
                    {canViewConfidentialDetails(selectedFacilityForDetail) ? (
                      <span className="font-mono font-bold text-emerald-900">
                        Số tiền: {selectedFacilityForDetail.actualCost?.toLocaleString('vi-VN')} đ
                      </span>
                    ) : (
                      <span className="text-blue-700 flex items-center gap-1 text-xs">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bảo mật gửi riêng HT</span>
                      </span>
                    )}
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 text-slate-800 whitespace-pre-wrap">
                    {selectedFacilityForDetail.completionReport}
                  </div>

                  {/* Materials breakdown */}
                  {canViewConfidentialDetails(selectedFacilityForDetail) &&
                  selectedFacilityForDetail.purchasedMaterials &&
                  selectedFacilityForDetail.purchasedMaterials.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Bảng kê chi tiết vật tư đã mua sắm:</span>
                      </div>
                      <div className="overflow-x-auto border border-emerald-200 rounded-xl bg-white">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-emerald-100/60 font-bold text-slate-800 border-b border-emerald-200">
                            <tr>
                              <th className="py-2 px-2 text-center w-8">STT</th>
                              <th className="py-2 px-2">Tên vật tư đã mua sắm</th>
                              <th className="py-2 px-2 text-center">Số lượng</th>
                              <th className="py-2 px-2 text-right">Đơn giá</th>
                              <th className="py-2 px-2 text-right">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100">
                            {selectedFacilityForDetail.purchasedMaterials.map((m, idx) => (
                              <tr key={m.id || idx}>
                                <td className="py-1.5 px-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="py-1.5 px-2 font-medium text-slate-900">{m.name}</td>
                                <td className="py-1.5 px-2 text-center">
                                  {m.quantity} {m.unit}
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono text-slate-600">
                                  {m.unitPrice.toLocaleString('vi-VN')} đ
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-900">
                                  {m.totalAmount.toLocaleString('vi-VN')} đ
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-emerald-100/80 font-bold text-emerald-950">
                              <td colSpan={4} className="py-2 px-2 text-right uppercase text-[11px]">
                                Tổng số tiền thực tế đã mua sắm:
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-black text-red-700 text-sm">
                                {selectedFacilityForDetail.actualCost?.toLocaleString('vi-VN')} đ
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : !canViewConfidentialDetails(selectedFacilityForDetail) &&
                    selectedFacilityForDetail.isConfidentialForHt ? (
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>
                        Bảng kê chi tiết vật tư và kinh phí mua sắm được bảo mật gửi riêng Thầy Hiệu trưởng Nguyễn Quốc Bảo.
                      </span>
                    </div>
                  ) : null}

                  {/* Completion Photos & Invoices */}
                  {selectedFacilityForDetail.completionPhotos && selectedFacilityForDetail.completionPhotos.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Ảnh hoàn thành & Hóa đơn chứng từ mua sắm:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedFacilityForDetail.completionPhotos.map((photo, i) => (
                          <img
                            key={i}
                            src={photo}
                            alt="Nghiệm thu"
                            onClick={() => setPreviewPhotoUrl(photo)}
                            className="w-24 h-24 rounded-xl object-cover border border-emerald-300 cursor-pointer hover:ring-2 hover:ring-emerald-500"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFacilityForDetail.htAcceptanceComment && (
                    <div className="bg-emerald-100/70 p-3 rounded-xl border border-emerald-300 text-emerald-950 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Hiệu trưởng nghiệm thu đạt:</strong> {selectedFacilityForDetail.htAcceptanceComment} (
                        {selectedFacilityForDetail.htAcceptanceDate})
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedFacilityForDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
              >
                Đóng Hồ Sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHOTO LIGHTBOX MODAL */}
      {/* ======================================================== */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-transparent" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhotoUrl}
              alt="Xem ảnh lớn"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shadow-lg hover:bg-red-700"
              title="Đóng"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
