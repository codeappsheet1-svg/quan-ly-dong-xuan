import React, { useState, useMemo } from 'react';
import {
  UserAccount,
  OfficialDispatchOut,
  OfficialDispatchIn,
  OfficialDocumentType,
  DispatchUrgencyLevel,
  DispatchSecurityLevel,
  OfficialDispatchBook,
} from '../types/school';
import { BRANCHES_DATA } from '../data/initialData';
import { storageService } from '../services/storageService';
import {
  BookOpen,
  FileText,
  FilePlus,
  Send,
  Inbox,
  Search,
  Filter,
  Printer,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Paperclip,
  Download,
  Building,
  User,
  ExternalLink,
  ChevronDown,
  Edit,
  Eye,
  Check,
  Hash,
  Sparkles,
  ArrowRight,
  Bookmark,
  FileCheck,
  FolderPlus,
  Archive,
  Plus,
  Trash2,
} from 'lucide-react';

interface OfficialDispatchesProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
}

export const OfficialDispatches: React.FC<OfficialDispatchesProps> = ({
  currentUser,
  activeSchoolYear,
}) => {
  // Main Tab Navigation: dispatches_out, dispatches_in, dispatch_books, decree_standard_book
  const [activeTab, setActiveTab] = useState<'dispatches_out' | 'dispatches_in' | 'dispatch_books' | 'decree_standard_book'>('dispatches_out');
  const [standardBookView, setStandardBookView] = useState<'out' | 'in'>('out');

  // Datasets from storage
  const [dispatchesOut, setDispatchesOut] = useState<OfficialDispatchOut[]>(() =>
    storageService.getDispatchesOut(activeSchoolYear)
  );
  const [dispatchesIn, setDispatchesIn] = useState<OfficialDispatchIn[]>(() =>
    storageService.getDispatchesIn(activeSchoolYear)
  );
  const [dispatchBooks, setDispatchBooks] = useState<OfficialDispatchBook[]>(() =>
    storageService.getDispatchBooks()
  );

  // Chỉnh sửa & In Sổ Công Văn Đi (Hoàn thiện chức năng sổ công văn đi)
  const [editingDispatchOut, setEditingDispatchOut] = useState<OfficialDispatchOut | null>(null);
  const [showPrintOutBookModal, setShowPrintOutBookModal] = useState(false);
  const [filterOutMonth, setFilterOutMonth] = useState<string>('ALL');

  // ==========================================
  // FORM & MODAL: TẠO SỔ VĂN BẢN MỚI (ĐẾN / ĐI)
  // ==========================================
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newBookType, setNewBookType] = useState<'Đến' | 'Đi'>('Đi');
  const [newBookName, setNewBookName] = useState('');
  const [newBookStorageDepartment, setNewBookStorageDepartment] = useState('Văn phòng nhà trường (Trụ sở chính)');
  const [newBookAppliedYear, setNewBookAppliedYear] = useState(activeSchoolYear);
  const [newBookOpenedDate, setNewBookOpenedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBookStatus, setNewBookStatus] = useState<'Đang sử dụng' | 'Đã khóa sổ' | 'Đã lưu kho'>('Đang sử dụng');
  const [newBookNotes, setNewBookNotes] = useState('');
  const [bookCreatedNotification, setBookCreatedNotification] = useState<string | null>(null);

  // Filters for Sổ văn bản tab
  const [filterBookType, setFilterBookType] = useState<'ALL' | 'Đến' | 'Đi'>('ALL');
  const [filterBookYear, setFilterBookYear] = useState<string>('ALL');
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [bookViewMode, setBookViewMode] = useState<'cards' | 'table'>('cards');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');

  // View detail modal
  const [selectedDispatchOut, setSelectedDispatchOut] = useState<OfficialDispatchOut | null>(null);
  const [selectedDispatchIn, setSelectedDispatchIn] = useState<OfficialDispatchIn | null>(null);

  // ==========================================
  // MODAL: TẠO MẪU CÔNG VĂN MỚI (User request)
  // Các trường: loại (Đến/Đi), mã công văn, tiêu đề tổng hợp, ngày ban hành và đơn vị liên quan
  // ==========================================
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [templateType, setTemplateType] = useState<'Đến' | 'Đi'>('Đi');
  const [templateCode, setTemplateCode] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateIssuedDate, setTemplateIssuedDate] = useState(new Date().toISOString().split('T')[0]);
  const [templateRelatedUnit, setTemplateRelatedUnit] = useState('');
  const [templateNotification, setTemplateNotification] = useState<string | null>(null);

  // Modal: HT Bút phê / Ý kiến chỉ đạo
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [instructionDispatch, setInstructionDispatch] = useState<OfficialDispatchIn | null>(null);
  const [instructionText, setInstructionText] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState('Ban Giám hiệu');
  const [instructionStatus, setInstructionStatus] = useState<OfficialDispatchIn['processingStatus']>('Đang xử lý');

  // ==========================================
  // FORM NHẬP LIỆU CÔNG VĂN ĐI (TỰ ĐỘNG TĂNG SỐ & GHI NHẬN NGÀY HIỆN TẠI)
  // ==========================================
  const [showAddDispatchOutModal, setShowAddDispatchOutModal] = useState(false);
  const nextSeqOut = useMemo(() => storageService.getNextDispatchOutSequence(activeSchoolYear), [activeSchoolYear, dispatchesOut]);

  // Document types abbreviation mapping according to Decree 30/2020/ND-CP
  const docTypeAbbreviations: Record<OfficialDocumentType, string> = {
    'Quyết định': 'QĐ',
    'Kế hoạch': 'KH',
    'Thông báo': 'TB',
    'Báo cáo': 'BC',
    'Công văn': 'CV',
    'Tờ trình': 'TTr',
    'Hướng dẫn': 'HD',
    'Biên bản': 'BB',
    'Công điện': 'CĐ',
    'Nghị quyết': 'NQ',
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Form states for Dispatch Out
  const [outBookId, setOutBookId] = useState<string>('SO_VB_DI_2026');
  const [outDocType, setOutDocType] = useState<OfficialDocumentType>('Quyết định');
  const [outSubject, setOutSubject] = useState('');
  const [outIssuedDate, setOutIssuedDate] = useState(todayStr); // Tự động ngày hiện tại
  const [outSignerName, setOutSignerName] = useState('Thầy Nguyễn Quốc Bảo');
  const [outSignerPosition, setOutSignerPosition] = useState('Hiệu trưởng');
  const [outDepartment, setOutDepartment] = useState('Văn phòng nhà trường');
  const [outRecipient, setOutRecipient] = useState('Phòng GD&ĐT, Các Phó Hiệu trưởng, 11 điểm trường, lưu VT');
  const [outCopies, setOutCopies] = useState<number>(5);
  const [outUrgency, setOutUrgency] = useState<DispatchUrgencyLevel>('Thường');
  const [outSecurity, setOutSecurity] = useState<DispatchSecurityLevel>('Thường');
  const [outBranch, setOutBranch] = useState('Trụ sở chính');
  const [outNotes, setOutNotes] = useState('');

  // Auto-calculated document code: e.g. "08/QĐ-TH&THCSĐX"
  const computedOutCode = useMemo(() => {
    const padSeq = nextSeqOut < 10 ? `0${nextSeqOut}` : `${nextSeqOut}`;
    const abbr = docTypeAbbreviations[outDocType] || 'CV';
    return `${padSeq}/${abbr}-TH&THCSĐX`;
  }, [nextSeqOut, outDocType]);

  const [customOutCode, setCustomOutCode] = useState('');
  const [outAttachedFileName, setOutAttachedFileName] = useState('');
  const [outAttachedFileData, setOutAttachedFileData] = useState<string | null>(null);

  // ==========================================
  // FORM NHẬP LIỆU CÔNG VĂN ĐẾN
  // ==========================================
  const [showAddDispatchInModal, setShowAddDispatchInModal] = useState(false);
  const nextArrivalSeq = useMemo(() => storageService.getNextDispatchInSequence(activeSchoolYear), [activeSchoolYear, dispatchesIn]);

  const [inBookId, setInBookId] = useState<string>('SO_VB_DEN_2026');
  const [inOriginalCode, setInOriginalCode] = useState('');
  const [inDocType, setInDocType] = useState<OfficialDocumentType>('Công văn');
  const [inIssuingAuthority, setInIssuingAuthority] = useState('Phòng Giáo dục và Đào tạo Huyện');
  const [inSubject, setInSubject] = useState('');
  const [inIssuedDate, setInIssuedDate] = useState(todayStr);
  const [inArrivalDate, setInArrivalDate] = useState(todayStr); // Tự động ngày đến hiện tại
  const [inRecipientPerson, setInRecipientPerson] = useState('Thầy Nguyễn Quốc Bảo (HT)');
  const [inAssignedDepartment, setInAssignedDepartment] = useState('Ban Giám hiệu');
  const [inLeaderInstruction, setInLeaderInstruction] = useState('');
  const [inDeadline, setInDeadline] = useState('');
  const [inUrgency, setInUrgency] = useState<DispatchUrgencyLevel>('Thường');
  const [inSecurity, setInSecurity] = useState<DispatchSecurityLevel>('Thường');
  const [inNotes, setInNotes] = useState('');
  const [inAttachedFileName, setInAttachedFileName] = useState('');
  const [inAttachedFileData, setInAttachedFileData] = useState<string | null>(null);

  // File Upload Handlers
  const handleUploadOutFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOutAttachedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOutAttachedFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadInFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInAttachedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setInAttachedFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Dispatch Out
  const handleSubmitDispatchOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outSubject.trim()) return;

    const finalCode = customOutCode.trim() || computedOutCode;

    const newDispatch = storageService.addDispatchOut(
      {
        bookId: outBookId || undefined,
        sequenceNumber: nextSeqOut,
        documentCode: finalCode,
        documentType: outDocType,
        subject: outSubject.trim(),
        issuedDate: outIssuedDate,
        signerName: outSignerName,
        signerPosition: outSignerPosition,
        draftingDepartment: outDepartment,
        recipient: outRecipient,
        numberOfCopies: outCopies,
        urgency: outUrgency,
        security: outSecurity,
        schoolYear: activeSchoolYear,
        branchName: outBranch,
        status: 'Đã phát hành',
        notes: outNotes,
        attachedFiles: outAttachedFileName
          ? [
              {
                name: outAttachedFileName,
                url: outAttachedFileData || 'https://drive.google.com/sample_dispatch.pdf',
                size: '1.2 MB',
                type: 'application/pdf',
              },
            ]
          : [
              {
                name: `${finalCode.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
                url: 'https://drive.google.com/sample_dispatch.pdf',
                size: '850 KB',
                type: 'application/pdf',
              },
            ],
      },
      activeSchoolYear
    );

    setDispatchesOut(storageService.getDispatchesOut(activeSchoolYear));
    setShowAddDispatchOutModal(false);
    // Reset fields
    setOutSubject('');
    setCustomOutCode('');
    setOutAttachedFileName('');
    setOutAttachedFileData(null);
    setOutNotes('');
  };

  // Submit Dispatch In
  const handleSubmitDispatchIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inSubject.trim() || !inOriginalCode.trim()) return;

    const newDispatch = storageService.addDispatchIn(
      {
        bookId: inBookId || undefined,
        arrivalNumber: nextArrivalSeq,
        arrivalDate: inArrivalDate,
        originalCode: inOriginalCode.trim(),
        issuedDate: inIssuedDate,
        issuingAuthority: inIssuingAuthority.trim(),
        documentType: inDocType,
        subject: inSubject.trim(),
        recipientPerson: inRecipientPerson,
        assignedToDepartment: inAssignedDepartment,
        leaderInstruction: inLeaderInstruction,
        urgency: inUrgency,
        security: inSecurity,
        deadline: inDeadline || undefined,
        processingStatus: inLeaderInstruction ? 'Đang xử lý' : 'Chưa xử lý',
        schoolYear: activeSchoolYear,
        notes: inNotes,
        attachedFiles: inAttachedFileName
          ? [
              {
                name: inAttachedFileName,
                url: inAttachedFileData || 'https://drive.google.com/sample_incoming.pdf',
                size: '1.5 MB',
                type: 'application/pdf',
              },
            ]
          : [
              {
                name: `Scan_${inOriginalCode.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
                url: 'https://drive.google.com/sample_incoming.pdf',
                size: '1.2 MB',
                type: 'application/pdf',
              },
            ],
      },
      activeSchoolYear
    );

    setDispatchesIn(storageService.getDispatchesIn(activeSchoolYear));
    setShowAddDispatchInModal(false);
    // Reset fields
    setInOriginalCode('');
    setInSubject('');
    setInLeaderInstruction('');
    setInDeadline('');
    setInAttachedFileName('');
    setInAttachedFileData(null);
    setInNotes('');
  };

  // Save leader instruction
  const handleSaveInstruction = () => {
    if (!instructionDispatch) return;
    storageService.updateDispatchInStatus(
      instructionDispatch.id,
      instructionStatus,
      instructionText,
      activeSchoolYear
    );
    setDispatchesIn(storageService.getDispatchesIn(activeSchoolYear));
    setShowInstructionModal(false);
    setInstructionDispatch(null);
  };

  // Filtered Dispatches Out (Hỗ trợ tìm kiếm theo số hiệu, tiêu đề, đơn vị liên quan & tháng ban hành)
  const filteredDispatchesOut = useMemo(() => {
    return dispatchesOut.filter((d) => {
      if (filterType !== 'ALL' && d.documentType !== filterType) return false;
      if (filterUrgency !== 'ALL' && d.urgency !== filterUrgency) return false;
      if (filterDepartment !== 'ALL' && !d.draftingDepartment.includes(filterDepartment)) return false;
      if (filterOutMonth !== 'ALL') {
        const month = d.issuedDate ? new Date(d.issuedDate).getMonth() + 1 : 0;
        if (month.toString() !== filterOutMonth) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const matchNumber =
          d.documentCode.toLowerCase().includes(term) ||
          d.sequenceNumber.toString().includes(term);
        const matchTitle = d.subject.toLowerCase().includes(term);
        const matchUnit =
          d.draftingDepartment.toLowerCase().includes(term) ||
          d.recipient.toLowerCase().includes(term) ||
          d.signerName.toLowerCase().includes(term);
        return matchNumber || matchTitle || matchUnit;
      }
      return true;
    });
  }, [dispatchesOut, filterType, filterUrgency, filterDepartment, filterOutMonth, searchTerm]);

  // Handlers for Sổ công văn đi: Sửa, Xóa, Xuất CSV
  const handleSaveEditDispatchOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDispatchOut) return;
    storageService.updateDispatchOut(editingDispatchOut.id, editingDispatchOut, activeSchoolYear);
    setDispatchesOut(storageService.getDispatchesOut(activeSchoolYear));
    setEditingDispatchOut(null);
  };

  const handleDeleteDispatchOut = (id: string, code: string) => {
    if (window.confirm(`Đồng chí có chắc chắn muốn xóa văn bản đi số "${code}" khỏi sổ không? Thao tác này sẽ lưu vết vào nhật ký hệ thống.`)) {
      storageService.deleteDispatchOut(id, activeSchoolYear);
      setDispatchesOut(storageService.getDispatchesOut(activeSchoolYear));
    }
  };

  const handleExportOutCSV = () => {
    const headers = ['Số đi', 'Số và ký hiệu', 'Ngày ban hành', 'Tên loại văn bản', 'Trích yếu nội dung', 'Người ký', 'Chức vụ', 'Đơn vị soạn thảo', 'Nơi nhận', 'Số lượng bản', 'Độ khẩn', 'Ghi chú'];
    const rows = filteredDispatchesOut.map((d) => [
      d.sequenceNumber,
      `"${d.documentCode}"`,
      `"${d.issuedDate}"`,
      `"${d.documentType}"`,
      `"${d.subject.replace(/"/g, '""')}"`,
      `"${d.signerName}"`,
      `"${d.signerPosition}"`,
      `"${d.draftingDepartment}"`,
      `"${d.recipient.replace(/"/g, '""')}"`,
      d.numberOfCopies || 1,
      `"${d.urgency}"`,
      `"${(d.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `So_dang_ky_van_ban_di_Dong_Xuan_${activeSchoolYear}.csv`;
    link.click();
  };

  // Filtered Dispatches In (Hỗ trợ tìm kiếm theo số hiệu, tiêu đề, đơn vị liên quan)
  const filteredDispatchesIn = useMemo(() => {
    return dispatchesIn.filter((d) => {
      if (filterType !== 'ALL' && d.documentType !== filterType) return false;
      if (filterUrgency !== 'ALL' && d.urgency !== filterUrgency) return false;
      if (filterStatus !== 'ALL' && d.processingStatus !== filterStatus) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const matchNumber =
          d.originalCode.toLowerCase().includes(term) ||
          d.arrivalNumber.toString().includes(term);
        const matchTitle = d.subject.toLowerCase().includes(term);
        const matchUnit =
          d.issuingAuthority.toLowerCase().includes(term) ||
          (d.assignedToDepartment && d.assignedToDepartment.toLowerCase().includes(term)) ||
          (d.recipientPerson && d.recipientPerson.toLowerCase().includes(term));
        return matchNumber || matchTitle || matchUnit;
      }
      return true;
    });
  }, [dispatchesIn, filterType, filterUrgency, filterStatus, searchTerm]);

  // Handler: Tạo mẫu công văn mới (User requirement 1)
  const handleSubmitCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateCode.trim() || !templateSubject.trim() || !templateRelatedUnit.trim()) {
      alert('Vui lòng nhập đầy đủ các trường: mã công văn, tiêu đề tổng hợp, ngày ban hành và đơn vị liên quan!');
      return;
    }

    if (templateType === 'Đi') {
      const nextSeq = storageService.getNextDispatchOutSequence(activeSchoolYear);
      storageService.addDispatchOut(
        {
          sequenceNumber: nextSeq,
          documentCode: templateCode.trim(),
          documentType: 'Công văn',
          subject: templateSubject.trim(),
          issuedDate: templateIssuedDate || new Date().toISOString().split('T')[0],
          signerName: currentUser?.name || 'Thầy Nguyễn Quốc Bảo',
          signerPosition: currentUser?.position || 'Hiệu trưởng',
          draftingDepartment: templateRelatedUnit.trim(),
          recipient: templateRelatedUnit.trim(),
          numberOfCopies: 5,
          urgency: 'Thường',
          security: 'Thường',
          schoolYear: activeSchoolYear,
          status: 'Đã phát hành',
          notes: 'Tạo từ chức năng Tạo mẫu công văn mới',
        },
        activeSchoolYear
      );
      setDispatchesOut(storageService.getDispatchesOut(activeSchoolYear));
    } else {
      const nextArr = storageService.getNextDispatchInSequence(activeSchoolYear);
      storageService.addDispatchIn(
        {
          arrivalNumber: nextArr,
          arrivalDate: templateIssuedDate || new Date().toISOString().split('T')[0],
          originalCode: templateCode.trim(),
          issuedDate: templateIssuedDate || new Date().toISOString().split('T')[0],
          issuingAuthority: templateRelatedUnit.trim(),
          documentType: 'Công văn',
          subject: templateSubject.trim(),
          recipientPerson: currentUser?.name || 'Thầy Nguyễn Quốc Bảo (HT)',
          assignedToDepartment: templateRelatedUnit.trim(),
          urgency: 'Thường',
          security: 'Thường',
          processingStatus: 'Đang xử lý',
          schoolYear: activeSchoolYear,
          notes: 'Tiếp nhận từ chức năng Tạo mẫu công văn mới',
        },
        activeSchoolYear
      );
      setDispatchesIn(storageService.getDispatchesIn(activeSchoolYear));
    }

    setShowCreateTemplateModal(false);
    setTemplateNotification(
      `Đã tạo thành công mẫu công văn ${templateType}: [${templateCode}] - "${templateSubject}" (${templateRelatedUnit})`
    );
    setTimeout(() => setTemplateNotification(null), 6000);

    // Reset fields
    setTemplateCode('');
    setTemplateSubject('');
    setTemplateRelatedUnit('');
  };

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return dispatchBooks.filter((b) => {
      if (filterBookType !== 'ALL' && b.bookType !== filterBookType) return false;
      if (filterBookYear !== 'ALL' && b.appliedYear !== filterBookYear) return false;
      if (bookSearchTerm) {
        const term = bookSearchTerm.toLowerCase();
        return (
          b.bookName.toLowerCase().includes(term) ||
          b.storageDepartment.toLowerCase().includes(term) ||
          (b.notes && b.notes.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [dispatchBooks, filterBookType, filterBookYear, bookSearchTerm]);

  // Submit New Book handler
  const handleSubmitNewBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName.trim()) {
      alert('Vui lòng nhập tên sổ văn bản!');
      return;
    }
    if (!newBookStorageDepartment.trim()) {
      alert('Vui lòng nhập đơn vị lưu trữ!');
      return;
    }
    if (!newBookAppliedYear.trim()) {
      alert('Vui lòng nhập năm áp dụng!');
      return;
    }

    const created = storageService.addDispatchBook({
      bookType: newBookType,
      bookName: newBookName.trim(),
      storageDepartment: newBookStorageDepartment.trim(),
      appliedYear: newBookAppliedYear.trim(),
      openedDate: newBookOpenedDate || todayStr,
      status: newBookStatus,
      notes: newBookNotes.trim() || undefined,
      currentCount: 0,
    });

    const updated = storageService.getDispatchBooks();
    setDispatchBooks(updated);
    setShowAddBookModal(false);
    setBookCreatedNotification(
      `Đã tạo thành công "${created.bookName}" (${created.bookType}) cho năm học ${created.appliedYear} - Lưu trữ tại: ${created.storageDepartment}!`
    );
    setTimeout(() => setBookCreatedNotification(null), 6000);

    // Reset form
    setNewBookName('');
    setNewBookNotes('');
  };

  // Summary Metrics
  const totalOutCount = dispatchesOut.length;
  const totalInCount = dispatchesIn.length;
  const urgentCount =
    dispatchesOut.filter((d) => d.urgency !== 'Thường').length +
    dispatchesIn.filter((d) => d.urgency !== 'Thường').length;
  const inPendingCount = dispatchesIn.filter((d) => d.processingStatus === 'Chưa xử lý' || d.processingStatus === 'Đang xử lý').length;
  const inCompletedCount = dispatchesIn.filter((d) => d.processingStatus === 'Đã hoàn thành').length;

  const isPrincipalOrVice = currentUser?.role === 'HT' || currentUser?.role === 'PHT';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Quy chuẩn Nghị định 30/2020/NĐ-CP • Bộ Nội vụ
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Trường TH & THCS Đồng Xuân • Năm học {activeSchoolYear}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Phân Hệ Quản Lý Sổ Sách & Công Văn (Đến - Đi)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý số hóa Sổ đăng ký văn bản đi và Sổ đăng ký văn bản đến, tự động tăng số hiệu, ghi nhận ngày tháng và đồng bộ Google Drive.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Tạo mẫu công văn mới (User requirement 1) */}
          <button
            type="button"
            onClick={() => {
              setTemplateIssuedDate(new Date().toISOString().split('T')[0]);
              setShowCreateTemplateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 font-bold text-xs text-white shadow-sm transition flex items-center gap-1.5 active:scale-95"
            title="Tạo mẫu công văn mới (Đến / Đi) với mã công văn, tiêu đề, ngày ban hành và đơn vị liên quan"
          >
            <FilePlus className="w-4 h-4 text-indigo-200" />
            <span>Tạo mẫu công văn mới</span>
          </button>

          {/* Add Dispatch Book Button */}
          <button
            type="button"
            onClick={() => {
              setNewBookAppliedYear(activeSchoolYear);
              setShowAddBookModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-bold text-xs text-white shadow-sm transition flex items-center gap-1.5"
            title="Tạo sổ văn bản mới (Đến / Đi) theo đơn vị lưu trữ và năm áp dụng"
          >
            <FolderPlus className="w-4 h-4 text-emerald-200" />
            <span>+ Tạo Sổ Văn Bản Mới</span>
          </button>

          {/* Add Dispatch Out Button */}
          <button
            type="button"
            onClick={() => {
              setOutIssuedDate(new Date().toISOString().split('T')[0]);
              setShowAddDispatchOutModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 font-bold text-xs text-white shadow-sm transition flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>+ Vào Sổ Công Văn Đi (Số #{nextSeqOut})</span>
          </button>

          {/* Add Dispatch In Button */}
          <button
            type="button"
            onClick={() => {
              setInArrivalDate(new Date().toISOString().split('T')[0]);
              setShowAddDispatchInModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 font-bold text-xs text-white shadow-sm transition flex items-center gap-1.5"
          >
            <Inbox className="w-4 h-4" />
            <span>+ Tiếp Nhận Công Văn Đến (Số #{nextArrivalSeq})</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-700 transition flex items-center gap-1.5"
            title="In sổ lưu trữ văn thư"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In Sổ</span>
          </button>
        </div>
      </div>

      {/* Template Created Notification Banner */}
      {templateNotification && (
        <div className="bg-indigo-50 border border-indigo-300 text-indigo-950 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <span>{templateNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setTemplateNotification(null)}
            className="text-indigo-700 hover:text-indigo-950 font-bold text-sm ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Book Created Notification Banner */}
      {bookCreatedNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{bookCreatedNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setBookCreatedNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-sm ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Văn Bản Đi (Phát hành)</span>
            <Send className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700 mt-1">{totalOutCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Số tiếp theo: #{nextSeqOut}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Văn Bản Đến (Tiếp nhận)</span>
            <Inbox className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">{totalInCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Số đến tiếp theo: #{nextArrivalSeq}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Văn Bản Khẩn / Hỏa Tốc</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{urgentCount}</div>
          <div className="text-[11px] text-amber-800 mt-0.5">Ưu tiên xử lý ngay</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">VB Đến Cần Xử Lý</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-700 mt-1">{inPendingCount}</div>
          <div className="text-[11px] text-orange-800 mt-0.5">Đang chờ bút phê / thực hiện</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Đã Hoàn Thành Xử Lý</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{inCompletedCount}</div>
          <div className="text-[11px] text-emerald-800 mt-0.5">Lưu trữ hồ sơ văn thư</div>
        </div>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('dispatches_out')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'dispatches_out'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sổ Đăng Ký Văn Bản Đi ({totalOutCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dispatches_in')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'dispatches_in'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Sổ Đăng Ký Văn Bản Đến ({totalInCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dispatch_books')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'dispatch_books'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-300" />
            <span>Danh Mục Sổ Văn Bản ({dispatchBooks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decree_standard_book')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'decree_standard_book'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Mẫu Sổ Chuẩn Nghị Định 30/2020</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Dữ liệu lưu trữ điện tử • Tự động gắn mã và đồng bộ Google Drive
        </div>
      </div>

      {/* Search & Filter Bar */}
      {activeTab !== 'decree_standard_book' && activeTab !== 'dispatch_books' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Keyword Search (Tìm kiếm theo số hiệu, tiêu đề, hoặc đơn vị liên quan) */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo số hiệu, tiêu đề, hoặc đơn vị liên quan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-600 outline-none"
            />
            {searchTerm && (
              <div className="text-[10px] text-red-700 font-bold mt-1 px-1">
                Khớp {activeTab === 'dispatches_out' ? filteredDispatchesOut.length : filteredDispatchesIn.length} công văn
              </div>
            )}
          </div>

          {/* Filter Type */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-red-600 outline-none"
            >
              <option value="ALL">-- Tất cả loại văn bản --</option>
              <option value="Quyết định">Quyết định</option>
              <option value="Kế hoạch">Kế hoạch</option>
              <option value="Thông báo">Thông báo</option>
              <option value="Báo cáo">Báo cáo</option>
              <option value="Công văn">Công văn</option>
              <option value="Tờ trình">Tờ trình</option>
              <option value="Hướng dẫn">Hướng dẫn</option>
            </select>
          </div>

          {/* Filter Urgency */}
          <div>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-red-600 outline-none"
            >
              <option value="ALL">-- Tất cả độ khẩn --</option>
              <option value="Thường">Thường</option>
              <option value="Khẩn">Khẩn</option>
              <option value="Thượng khẩn">Thượng khẩn</option>
              <option value="Hỏa tốc">Hỏa tốc</option>
            </select>
          </div>

          {/* Filter Status (for In) or Department (for Out) */}
          <div>
            {activeTab === 'dispatches_in' ? (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="ALL">-- Tất cả tình trạng xử lý --</option>
                <option value="Chưa xử lý">Chưa xử lý</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Đã hoàn thành">Đã hoàn thành</option>
                <option value="Lưu theo dõi">Lưu theo dõi</option>
              </select>
            ) : (
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:ring-2 focus:ring-red-600 outline-none"
              >
                <option value="ALL">-- Tất cả đơn vị soạn thảo --</option>
                <option value="Văn phòng">Văn phòng nhà trường</option>
                <option value="Tiểu học">Tổ chuyên môn Tiểu học</option>
                <option value="THCS">Tổ chuyên môn THCS</option>
                <option value="CSVC">Bộ phận CSVC</option>
                <option value="Công đoàn">Công đoàn cơ sở</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: SỔ ĐĂNG KÝ VĂN BẢN ĐI (CÔNG VĂN ĐI) */}
      {/* ======================================================== */}
      {activeTab === 'dispatches_out' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="bg-red-800 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-300" />
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">Sổ Đăng Ký Văn Bản Đi (Quy chuẩn Nghị định 30/2020)</h3>
                <p className="text-[11px] text-rose-200">
                  Số thứ tự đánh liên tục từ số 01 • Tự động tăng số hiệu theo thể thức Bộ Nội vụ • Có đầy đủ chức năng sửa, xóa, in và xuất sổ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrintOutBookModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 font-black text-slate-900 shadow-sm transition flex items-center gap-1.5"
                title="In Sổ Đăng Ký Văn Bản Đi theo mẫu phụ lục VI Nghị định 30/2020"
              >
                <Printer className="w-3.5 h-3.5 text-slate-950" />
                <span>In Sổ Đi Chuẩn NĐ 30</span>
              </button>

              <button
                type="button"
                onClick={handleExportOutCSV}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition flex items-center gap-1.5"
                title="Xuất bảng Excel/CSV văn bản đi"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>

              <span className="text-xs bg-white/10 px-3 py-1 rounded-lg text-slate-200 font-semibold">
                Tổng phát hành: {filteredDispatchesOut.length} văn bản
              </span>
            </div>
          </div>

          {/* Sub-toolbar: Month filter & quick stats */}
          <div className="p-3 bg-red-50/50 border-b border-red-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-red-600" />
                <span>Lọc theo tháng phát hành:</span>
              </span>
              <select
                value={filterOutMonth}
                onChange={(e) => setFilterOutMonth(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-red-200 bg-white font-bold text-red-900 focus:ring-2 focus:ring-red-600 outline-none"
              >
                <option value="ALL">-- Tất cả các tháng --</option>
                <option value="9">Tháng 9 (Đầu năm học)</option>
                <option value="10">Tháng 10 (Hiện tại)</option>
                <option value="11">Tháng 11</option>
                <option value="12">Tháng 12</option>
                <option value="1">Tháng 1</option>
                <option value="2">Tháng 2</option>
                <option value="3">Tháng 3</option>
                <option value="4">Tháng 4</option>
                <option value="5">Tháng 5 (Tổng kết)</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-md border border-red-200">
                Quyết định: {dispatchesOut.filter((d) => d.documentType === 'Quyết định').length}
              </span>
              <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                Kế hoạch: {dispatchesOut.filter((d) => d.documentType === 'Kế hoạch').length}
              </span>
              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">
                Thông báo: {dispatchesOut.filter((d) => d.documentType === 'Thông báo').length}
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                Báo cáo: {dispatchesOut.filter((d) => d.documentType === 'Báo cáo').length}
              </span>
              <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md border border-purple-200">
                Công văn: {dispatchesOut.filter((d) => d.documentType === 'Công văn').length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-14 text-center">Số đi</th>
                  <th className="py-3 px-4 min-w-36">Số và ký hiệu</th>
                  <th className="py-3 px-4 min-w-28">Ngày ban hành</th>
                  <th className="py-3 px-4 min-w-64">Tên loại & Trích yếu nội dung</th>
                  <th className="py-3 px-4 min-w-36">Người ký</th>
                  <th className="py-3 px-4 min-w-44">Nơi nhận</th>
                  <th className="py-3 px-3 text-center">Độ khẩn</th>
                  <th className="py-3 px-3 text-center">Tệp đính kèm</th>
                  <th className="py-3 px-4 text-right min-w-40">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDispatchesOut.length > 0 ? (
                  filteredDispatchesOut.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-center font-mono font-black text-red-700 bg-red-50/40">
                        {item.sequenceNumber < 10 ? `0${item.sequenceNumber}` : item.sequenceNumber}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {item.documentCode}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {new Date(item.issuedDate).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-snug">
                          {item.subject}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="text-red-700 font-semibold">{item.documentType}</span>
                          <span>•</span>
                          <span>Soạn thảo: {item.draftingDepartment}</span>
                          <span>•</span>
                          <span>Số bản: {item.numberOfCopies || 1}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{item.signerName}</div>
                        <div className="text-[11px] text-slate-500">{item.signerPosition}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 leading-tight">
                        {item.recipient}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.urgency === 'Hỏa tốc' || item.urgency === 'Thượng khẩn'
                              ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                              : item.urgency === 'Khẩn'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.urgency}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {item.attachedFiles && item.attachedFiles.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedDispatchOut(item)}
                            className="inline-flex items-center gap-1 text-red-700 hover:underline font-bold"
                            title={item.attachedFiles[0].name}
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>File PDF</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedDispatchOut(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition inline-flex items-center gap-1"
                            title="Xem chi tiết văn bản"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingDispatchOut({ ...item })}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition inline-flex items-center gap-1"
                            title="Chỉnh sửa văn bản đi"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDispatchOut(item.id, item.documentCode)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition inline-flex items-center gap-1"
                            title="Xóa văn bản đi"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Chưa tìm thấy văn bản đi nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SỔ ĐĂNG KÝ VĂN BẢN ĐẾN (CÔNG VĂN ĐẾN) */}
      {/* ======================================================== */}
      {activeTab === 'dispatches_in' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="bg-blue-800 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-amber-300" />
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">Sổ Đăng Ký Văn Bản Đến</h3>
                <p className="text-[11px] text-blue-200">
                  Ghi nhận số đến liên tục, theo dõi hạn xử lý và bút phê của Ban Giám hiệu
                </p>
              </div>
            </div>

            <span className="text-xs bg-white/10 px-3 py-1 rounded-lg text-slate-200 font-semibold">
              Tổng số tiếp nhận: {filteredDispatchesIn.length} văn bản
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-16 text-center">Số đến</th>
                  <th className="py-3 px-3 min-w-24">Ngày đến</th>
                  <th className="py-3 px-4 min-w-36">Số & Ký hiệu gốc</th>
                  <th className="py-3 px-4 min-w-44">Cơ quan ban hành</th>
                  <th className="py-3 px-4 min-w-64">Trích yếu nội dung</th>
                  <th className="py-3 px-4 min-w-48">Ý kiến chỉ đạo / Bút phê</th>
                  <th className="py-3 px-3 text-center min-w-28">Tình trạng</th>
                  <th className="py-3 px-3 text-center">Đính kèm</th>
                  <th className="py-3 px-4 text-right min-w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDispatchesIn.length > 0 ? (
                  filteredDispatchesIn.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-center font-mono font-black text-blue-700 bg-blue-50/40">
                        #{item.arrivalNumber < 10 ? `0${item.arrivalNumber}` : item.arrivalNumber}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {new Date(item.arrivalDate).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div>{item.originalCode}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Ngày ký: {new Date(item.issuedDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.issuingAuthority}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-snug">
                          {item.subject}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="text-blue-700 font-semibold">{item.documentType}</span>
                          {item.deadline && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 font-semibold">
                                Hạn xử lý: {new Date(item.deadline).toLocaleDateString('vi-VN')}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {item.leaderInstruction ? (
                          <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-amber-900 text-[11px] leading-tight font-medium">
                            <span className="font-bold text-red-700 block mb-0.5">Bút phê HT:</span>
                            {item.leaderInstruction}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có bút phê</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.processingStatus === 'Đã hoàn thành'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.processingStatus === 'Đang xử lý'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.processingStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {item.attachedFiles && item.attachedFiles.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedDispatchIn(item)}
                            className="inline-flex items-center gap-1 text-blue-700 hover:underline font-bold"
                            title={item.attachedFiles[0].name}
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>File scan</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {isPrincipalOrVice && (
                          <button
                            type="button"
                            onClick={() => {
                              setInstructionDispatch(item);
                              setInstructionText(item.leaderInstruction || '');
                              setInstructionStatus(item.processingStatus);
                              setShowInstructionModal(true);
                            }}
                            className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200 transition"
                          >
                            Bút phê
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedDispatchIn(item)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Chưa tìm thấy văn bản đến nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MẪU SỔ ĐIỆN TỬ THEO NGHỊ ĐỊNH 30/2020/NĐ-CP */}
      {/* ======================================================== */}
      {activeTab === 'decree_standard_book' && (
        <div className="space-y-4">
          {/* Sub Switcher: Sổ Đi vs Sổ Đến */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Chọn mẫu sổ trích xuất:</span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStandardBookView('out')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    standardBookView === 'out'
                      ? 'bg-red-700 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Sổ Đăng Ký Văn Bản Đi (Mẫu 2.1 - Phụ lục VI)
                </button>
                <button
                  type="button"
                  onClick={() => setStandardBookView('in')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    standardBookView === 'in'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Sổ Đăng Ký Văn Bản Đến (Mẫu 1.1 - Phụ lục VI)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>In Ấn Toàn Bộ Sổ Khổ A4</span>
            </button>
          </div>

          {/* SỔ VĂN BẢN ĐI THEO MẪU BỘ NỘI VỤ */}
          {standardBookView === 'out' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm print:shadow-none print:border-none space-y-4">
              <div className="text-center space-y-1 border-b border-slate-300 pb-4">
                <div className="font-bold uppercase tracking-wider text-xs text-slate-600">
                  ỦY BAN NHÂN DÂN XÃ ĐỒNG XUÂN - TRƯỜNG TH & THCS ĐỒNG XUÂN
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase">
                  SỔ ĐĂNG KÝ VĂN BẢN ĐI
                </h3>
                <p className="text-xs text-slate-500 font-serif italic">
                  Năm học {activeSchoolYear} • Bắt đầu từ số 01 ngày 01/09/2026
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold text-center border-b border-slate-400">
                      <th className="p-2 border border-slate-400 w-14">Số TT (1)</th>
                      <th className="p-2 border border-slate-400 min-w-32">Số và ký hiệu (2)</th>
                      <th className="p-2 border border-slate-400 min-w-28">Ngày tháng ban hành (3)</th>
                      <th className="p-2 border border-slate-400 min-w-64">Tên loại và trích yếu nội dung (4)</th>
                      <th className="p-2 border border-slate-400 min-w-32">Người ký (5)</th>
                      <th className="p-2 border border-slate-400 min-w-44">Nơi nhận (6)</th>
                      <th className="p-2 border border-slate-400 min-w-36">Đơn vị soạn thảo (7)</th>
                      <th className="p-2 border border-slate-400 w-16">Số bản (8)</th>
                      <th className="p-2 border border-slate-400 min-w-28">Ghi chú (9)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchesOut.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-400 text-center font-bold">
                          {item.sequenceNumber}
                        </td>
                        <td className="p-2 border border-slate-400 font-mono font-bold text-slate-900">
                          {item.documentCode}
                        </td>
                        <td className="p-2 border border-slate-400 text-center">
                          {new Date(item.issuedDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-2 border border-slate-400 font-medium">
                          <strong>{item.documentType}:</strong> {item.subject}
                        </td>
                        <td className="p-2 border border-slate-400">
                          <div className="font-bold">{item.signerName}</div>
                          <div className="text-[10px] text-slate-500">{item.signerPosition}</div>
                        </td>
                        <td className="p-2 border border-slate-400 text-[11px]">
                          {item.recipient}
                        </td>
                        <td className="p-2 border border-slate-400 text-[11px]">
                          {item.draftingDepartment}
                        </td>
                        <td className="p-2 border border-slate-400 text-center font-mono">
                          {item.numberOfCopies}
                        </td>
                        <td className="p-2 border border-slate-400 text-[10px] text-slate-500">
                          {item.notes || 'Lưu văn thư'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 flex justify-between text-xs font-semibold text-slate-700">
                <div className="text-center w-64">
                  <div>NGƯỜI LẬP SỔ</div>
                  <div className="text-[11px] text-slate-400 font-normal italic">(Ký, ghi rõ họ tên)</div>
                  <div className="mt-14 font-bold">Cô Võ Thị Ngọc Hảo</div>
                </div>

                <div className="text-center w-64">
                  <div>HIỆU TRƯỞNG</div>
                  <div className="text-[11px] text-slate-400 font-normal italic">(Ký và đóng dấu)</div>
                  <div className="mt-14 font-bold text-red-800">Thầy Nguyễn Quốc Bảo</div>
                </div>
              </div>
            </div>
          )}

          {/* SỔ VĂN BẢN ĐẾN THEO MẪU BỘ NỘI VỤ */}
          {standardBookView === 'in' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm print:shadow-none print:border-none space-y-4">
              <div className="text-center space-y-1 border-b border-slate-300 pb-4">
                <div className="font-bold uppercase tracking-wider text-xs text-slate-600">
                  ỦY BAN NHÂN DÂN XÃ ĐỒNG XUÂN - TRƯỜNG TH & THCS ĐỒNG XUÂN
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase">
                  SỔ ĐĂNG KÝ VĂN BẢN ĐẾN
                </h3>
                <p className="text-xs text-slate-500 font-serif italic">
                  Năm học {activeSchoolYear} • Bắt đầu từ số 01 ngày 01/09/2026
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold text-center border-b border-slate-400">
                      <th className="p-2 border border-slate-400 w-14">Số đến (1)</th>
                      <th className="p-2 border border-slate-400 min-w-24">Ngày đến (2)</th>
                      <th className="p-2 border border-slate-400 min-w-40">Tác giả văn bản (3)</th>
                      <th className="p-2 border border-slate-400 min-w-32">Số và ký hiệu (4)</th>
                      <th className="p-2 border border-slate-400 min-w-24">Ngày tháng VB (5)</th>
                      <th className="p-2 border border-slate-400 min-w-64">Tên loại và trích yếu (6)</th>
                      <th className="p-2 border border-slate-400 min-w-32">Đơn vị nhận (7)</th>
                      <th className="p-2 border border-slate-400 min-w-44">Ý kiến chỉ đạo / Bút phê (8)</th>
                      <th className="p-2 border border-slate-400 min-w-24">Hạn giải quyết (9)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchesIn.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-400 text-center font-bold text-blue-700">
                          {item.arrivalNumber}
                        </td>
                        <td className="p-2 border border-slate-400 text-center">
                          {new Date(item.arrivalDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-2 border border-slate-400 font-semibold text-slate-800">
                          {item.issuingAuthority}
                        </td>
                        <td className="p-2 border border-slate-400 font-mono font-bold">
                          {item.originalCode}
                        </td>
                        <td className="p-2 border border-slate-400 text-center">
                          {new Date(item.issuedDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-2 border border-slate-400 font-medium">
                          <strong>{item.documentType}:</strong> {item.subject}
                        </td>
                        <td className="p-2 border border-slate-400 text-[11px]">
                          {item.assignedToDepartment || 'BGH'}
                        </td>
                        <td className="p-2 border border-slate-400 text-[11px] text-amber-900 font-medium">
                          {item.leaderInstruction || 'Chờ phân công'}
                        </td>
                        <td className="p-2 border border-slate-400 text-center text-red-700 font-bold">
                          {item.deadline ? new Date(item.deadline).toLocaleDateString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 flex justify-between text-xs font-semibold text-slate-700">
                <div className="text-center w-64">
                  <div>NGƯỜI VÀO SỔ</div>
                  <div className="text-[11px] text-slate-400 font-normal italic">(Ký, ghi rõ họ tên)</div>
                  <div className="mt-14 font-bold">Cô Võ Thị Ngọc Hảo</div>
                </div>

                <div className="text-center w-64">
                  <div>HIỆU TRƯỞNG</div>
                  <div className="text-[11px] text-slate-400 font-normal italic">(Ký và đóng dấu)</div>
                  <div className="mt-14 font-bold text-red-800">Thầy Nguyễn Quốc Bảo</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TẠO MẪU CÔNG VĂN MỚI (User requirement 1) */}
      {/* ======================================================== */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FilePlus className="w-5 h-5 text-indigo-200" />
                <div>
                  <h3 className="font-bold text-base">Tạo Mẫu Công Văn Mới</h3>
                  <p className="text-[11px] text-indigo-200">
                    Lưu trữ vào storageService • Phục vụ tra cứu và quản lý sổ công văn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTemplateModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCreateTemplate} className="p-6 space-y-4 text-xs">
              {/* 1. Loại công văn: Đến / Đi */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  1. Loại công văn <span className="text-red-600">*</span>:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      templateType === 'Đi'
                        ? 'border-red-600 bg-red-50/70 text-red-900 font-bold ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="templateTypeRadio"
                      value="Đi"
                      checked={templateType === 'Đi'}
                      onChange={() => setTemplateType('Đi')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <Send className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <div>
                      <div>Công văn Đi (Phát hành)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Ban hành ra ngoài / nội bộ</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      templateType === 'Đến'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="templateTypeRadio"
                      value="Đến"
                      checked={templateType === 'Đến'}
                      onChange={() => setTemplateType('Đến')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Inbox className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <div>Công văn Đến (Tiếp nhận)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Nhận từ cấp trên / đối tác</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Mã công văn */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  2. Mã công văn (Số & ký hiệu) <span className="text-red-600">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder={templateType === 'Đi' ? 'Ví dụ: 15/QĐ-TH&THCSĐX hoặc 24/CV-THCSDX' : 'Ví dụ: 89/UBND-VX hoặc 124/PGDĐT-GDTrH'}
                  value={templateCode}
                  onChange={(e) => setTemplateCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-indigo-600 outline-none text-slate-900"
                />
              </div>

              {/* 3. Tiêu đề tổng hợp */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  3. Tiêu đề tổng hợp (Trích yếu nội dung) <span className="text-red-600">*</span>:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập tiêu đề hoặc tóm tắt nội dung văn bản..."
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-900 font-medium"
                />
              </div>

              {/* 4. Ngày ban hành & 5. Đơn vị liên quan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    4. Ngày ban hành <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="date"
                    required
                    value={templateIssuedDate}
                    onChange={(e) => setTemplateIssuedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    5. Đơn vị liên quan <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={templateType === 'Đi' ? 'Ví dụ: Phòng GD&ĐT, Các phân hiệu' : 'Ví dụ: UBND Huyện, Phòng GD&ĐT'}
                    value={templateRelatedUnit}
                    onChange={(e) => setTemplateRelatedUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-[11px] text-indigo-950 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-0.5" />
                <div>
                  Dữ liệu được lưu ngay vào <strong>storageService</strong> theo Sổ công văn {templateType.toLowerCase()} của năm học {activeSchoolYear}. Bạn có thể tìm kiếm theo số hiệu, tiêu đề hoặc đơn vị liên quan.
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateTemplateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 font-bold text-white shadow-md transition flex items-center gap-1.5"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Lưu Mẫu Công Văn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: FORM NHẬP LIỆU CÔNG VĂN ĐI (TỰ ĐỘNG TĂNG SỐ & NGÀY HIỆN TẠI) */}
      {/* ======================================================== */}
      {showAddDispatchOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-base">Vào Sổ Đăng Ký Văn Bản Đi Mới</h3>
                  <p className="text-[11px] text-rose-200">
                    Quy chuẩn Nghị định 30/2020/NĐ-CP • Tự động tăng số hiệu & ghi nhận ngày hiện tại
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDispatchOutModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDispatchOut} className="p-6 space-y-4 text-xs">
              {/* Box tự động tăng số hiệu & ngày ban hành */}
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-red-950">
                <div>
                  <label className="font-bold text-[11px] block text-red-900 mb-0.5">Số thứ tự đi (Tự động):</label>
                  <div className="text-xl font-black text-red-700 font-mono">
                    #{nextSeqOut < 10 ? `0${nextSeqOut}` : nextSeqOut}
                  </div>
                  <span className="text-[10px] text-red-800">Tăng liên tục trong năm</span>
                </div>

                <div>
                  <label className="font-bold text-[11px] block text-red-900 mb-0.5">Số & Ký hiệu chuẩn:</label>
                  <div className="text-sm font-black text-slate-900 font-mono bg-white px-2.5 py-1 rounded-lg border border-red-200">
                    {customOutCode || computedOutCode}
                  </div>
                  <span className="text-[10px] text-slate-500">Tự động ghép loại văn bản</span>
                </div>

                <div>
                  <label className="font-bold text-[11px] block text-red-900 mb-0.5">Ngày ban hành (Hiện tại):</label>
                  <input
                    type="date"
                    value={outIssuedDate}
                    onChange={(e) => setOutIssuedDate(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg border border-red-200 font-bold bg-white text-red-800 outline-none focus:ring-1 focus:ring-red-600"
                    required
                  />
                  <span className="text-[10px] text-red-800">Ghi nhận ngày hệ thống</span>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Chọn Sổ Văn Bản Đi */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Ghi vào Sổ Văn Bản Đi:
                  </label>
                  <select
                    value={outBookId}
                    onChange={(e) => setOutBookId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    {dispatchBooks
                      .filter((b) => b.bookType === 'Đi')
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bookName} • [{b.storageDepartment}] ({b.appliedYear})
                        </option>
                      ))}
                  </select>
                </div>

                {/* 1. Loại văn bản */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên loại văn bản:</label>
                  <select
                    value={outDocType}
                    onChange={(e) => setOutDocType(e.target.value as OfficialDocumentType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-red-600 outline-none"
                    required
                  >
                    <option value="Quyết định">Quyết định (QĐ)</option>
                    <option value="Kế hoạch">Kế hoạch (KH)</option>
                    <option value="Thông báo">Thông báo (TB)</option>
                    <option value="Báo cáo">Báo cáo (BC)</option>
                    <option value="Công văn">Công văn (CV)</option>
                    <option value="Tờ trình">Tờ trình (TTr)</option>
                    <option value="Hướng dẫn">Hướng dẫn (HD)</option>
                    <option value="Biên bản">Biên bản (BB)</option>
                    <option value="Nghị quyết">Nghị quyết (NQ)</option>
                  </select>
                </div>

                {/* 2. Tuỳ chỉnh số hiệu nếu cần */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tuỳ chỉnh số ký hiệu (để trống để dùng tự động):
                  </label>
                  <input
                    type="text"
                    placeholder={`Mặc định: ${computedOutCode}`}
                    value={customOutCode}
                    onChange={(e) => setCustomOutCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
              </div>

              {/* 3. Trích yếu nội dung */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Trích yếu nội dung văn bản <span className="text-red-600">*</span>:
                </label>
                <textarea
                  rows={3}
                  value={outSubject}
                  onChange={(e) => setOutSubject(e.target.value)}
                  placeholder="Ví dụ: Về việc phân công nhiệm vụ chuyên môn và chủ nhiệm lớp học kỳ I năm học 2026 - 2027..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  required
                />
              </div>

              {/* 4. Người ký & Chức vụ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Người ký văn bản:</label>
                  <select
                    value={outSignerName}
                    onChange={(e) => {
                      setOutSignerName(e.target.value);
                      if (e.target.value.includes('Bảo')) {
                        setOutSignerPosition('Hiệu trưởng');
                      } else {
                        setOutSignerPosition('Phó Hiệu trưởng');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-red-600 outline-none bg-white"
                  >
                    <option value="Thầy Nguyễn Quốc Bảo">Thầy Nguyễn Quốc Bảo (Hiệu trưởng)</option>
                    <option value="Thầy Trần Thanh Long">Thầy Trần Thanh Long (PHT TH La Hai)</option>
                    <option value="Thầy Phan Hưng Tuyên">Thầy Phan Hưng Tuyên (PHT Xuân Long)</option>
                    <option value="Thầy Ninh Đức Hiếu">Thầy Ninh Đức Hiếu (PHT Xuân Quang 2)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn vị / Bộ phận soạn thảo:</label>
                  <input
                    type="text"
                    value={outDepartment}
                    onChange={(e) => setOutDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                    required
                  />
                </div>
              </div>

              {/* 5. Nơi nhận & Số bản */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Nơi nhận văn bản:</label>
                  <input
                    type="text"
                    value={outRecipient}
                    onChange={(e) => setOutRecipient(e.target.value)}
                    placeholder="Phòng GD&ĐT, Các phân hiệu, GV toàn trường..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số bản phát hành:</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={outCopies}
                    onChange={(e) => setOutCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
              </div>

              {/* 6. Độ khẩn & Độ mật */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Độ khẩn:</label>
                  <select
                    value={outUrgency}
                    onChange={(e) => setOutUrgency(e.target.value as DispatchUrgencyLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="Thường">Thường</option>
                    <option value="Khẩn">Khẩn</option>
                    <option value="Thượng khẩn">Thượng khẩn</option>
                    <option value="Hỏa tốc">Hỏa tốc</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Độ mật:</label>
                  <select
                    value={outSecurity}
                    onChange={(e) => setOutSecurity(e.target.value as DispatchSecurityLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="Thường">Thường</option>
                    <option value="Mật">Mật</option>
                    <option value="Tuyệt mật">Tuyệt mật</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gắn với cơ sở:</label>
                  <select
                    value={outBranch}
                    onChange={(e) => setOutBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    {BRANCHES_DATA.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 7. File đính kèm tải từ máy tính */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tải lên tệp văn bản đính kèm / scan có dấu đỏ (từ máy tính):
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-4 text-center cursor-pointer relative bg-slate-50 transition">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={handleUploadOutFile}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {outAttachedFileName ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã chọn: {outAttachedFileName}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <div className="font-semibold text-slate-600">Nhấn để chọn tệp hoặc kéo thả file văn bản</div>
                      <div className="text-[10px] text-slate-400">Hỗ trợ PDF, Word, Ảnh scan dấu đỏ</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDispatchOutModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 font-bold text-white shadow-md transition flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Phát Hành & Lưu Vào Sổ Đi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: FORM NHẬP LIỆU CÔNG VĂN ĐẾN */}
      {/* ======================================================== */}
      {showAddDispatchInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Inbox className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-base">Tiếp Nhận & Vào Sổ Công Văn Đến</h3>
                  <p className="text-[11px] text-blue-200">
                    Ghi nhận số đến liên tục #{nextArrivalSeq} • Tự động ngày tiếp nhận hiện tại
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDispatchInModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDispatchIn} className="p-6 space-y-4 text-xs">
              {/* Header Box Số đến & Ngày đến */}
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-blue-950">
                <div>
                  <label className="font-bold text-[11px] block text-blue-900 mb-0.5">Số đến (Tự động tăng):</label>
                  <div className="text-xl font-black text-blue-700 font-mono">
                    #{nextArrivalSeq < 10 ? `0${nextArrivalSeq}` : nextArrivalSeq}
                  </div>
                  <span className="text-[10px] text-blue-800">Số thứ tự văn bản vào sổ trường</span>
                </div>

                <div>
                  <label className="font-bold text-[11px] block text-blue-900 mb-0.5">Ngày tiếp nhận (Hiện tại):</label>
                  <input
                    type="date"
                    value={inArrivalDate}
                    onChange={(e) => setInArrivalDate(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg border border-blue-200 font-bold bg-white text-blue-800 outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                  <span className="text-[10px] text-blue-800">Ngày văn thư vào sổ</span>
                </div>
              </div>

              {/* Chọn Sổ Văn Bản Đến */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ghi vào Sổ Văn Bản Đến:
                </label>
                <select
                  value={inBookId}
                  onChange={(e) => setInBookId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  {dispatchBooks
                    .filter((b) => b.bookType === 'Đến')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookName} • [{b.storageDepartment}] ({b.appliedYear})
                      </option>
                    ))}
                </select>
              </div>

              {/* Thông tin văn bản gốc */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số & Ký hiệu gốc <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 142/SGDĐT-GDTrH"
                    value={inOriginalCode}
                    onChange={(e) => setInOriginalCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày ký văn bản gốc:</label>
                  <input
                    type="date"
                    value={inIssuedDate}
                    onChange={(e) => setInIssuedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên loại văn bản:</label>
                  <select
                    value={inDocType}
                    onChange={(e) => setInDocType(e.target.value as OfficialDocumentType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="Công văn">Công văn</option>
                    <option value="Hướng dẫn">Hướng dẫn</option>
                    <option value="Kế hoạch">Kế hoạch</option>
                    <option value="Thông báo">Thông báo</option>
                    <option value="Quyết định">Quyết định</option>
                    <option value="Báo cáo">Báo cáo</option>
                  </select>
                </div>
              </div>

              {/* Cơ quan ban hành */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Cơ quan, tổ chức ban hành <span className="text-red-600">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="VD: Sở Giáo dục và Đào tạo Tỉnh Đắk Lắk, UBND Xã Đồng Xuân, Phòng GD&ĐT..."
                  value={inIssuingAuthority}
                  onChange={(e) => setInIssuingAuthority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              {/* Trích yếu */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Trích yếu nội dung văn bản đến <span className="text-red-600">*</span>:
                </label>
                <textarea
                  rows={3}
                  value={inSubject}
                  onChange={(e) => setInSubject(e.target.value)}
                  placeholder="Nhập trích yếu nội dung chính của văn bản đến..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              {/* Bút phê & Phân công xử lý */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn vị / Bộ phận nhận xử lý:</label>
                  <select
                    value={inAssignedDepartment}
                    onChange={(e) => setInAssignedDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="Ban Giám hiệu">Ban Giám hiệu</option>
                    <option value="Tổ chuyên môn THCS">Tổ chuyên môn THCS</option>
                    <option value="Tổ chuyên môn Tiểu học">Tổ chuyên môn Tiểu học</option>
                    <option value="Văn phòng nhà trường">Văn phòng nhà trường</option>
                    <option value="Bộ phận CSVC & Bảo vệ">Bộ phận CSVC & Bảo vệ</option>
                    <option value="Tổ Y tế học đường">Tổ Y tế học đường</option>
                    <option value="57 Giáo viên chủ nhiệm">57 Giáo viên chủ nhiệm</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hạn xử lý / báo cáo:</label>
                  <input
                    type="date"
                    value={inDeadline}
                    onChange={(e) => setInDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Ý kiến chỉ đạo / Bút phê của HT */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ý kiến chỉ đạo / Bút phê của Hiệu trưởng:
                </label>
                <input
                  type="text"
                  placeholder="VD: Giao PHT Long và tổ chuyên môn TH nghiên cứu, triển khai..."
                  value={inLeaderInstruction}
                  onChange={(e) => setInLeaderInstruction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-red-800 font-semibold"
                />
              </div>

              {/* File scan tải từ máy tính */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tải lên tệp văn bản scan / đính kèm (từ máy tính):
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer relative bg-slate-50 transition">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={handleUploadInFile}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {inAttachedFileName ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã chọn: {inAttachedFileName}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <div className="font-semibold text-slate-600">Nhấn để chọn tệp scan văn bản đến từ máy tính</div>
                      <div className="text-[10px] text-slate-400">PDF, JPG, PNG</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDispatchInModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 font-bold text-white shadow-md transition flex items-center gap-1.5"
                >
                  <Inbox className="w-4 h-4" />
                  <span>Tiếp Nhận & Lưu Vào Sổ Đến</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: BÚT PHÊ HIỆU TRƯỞNG CHO VĂN BẢN ĐẾN */}
      {/* ======================================================== */}
      {showInstructionModal && instructionDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-amber-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Bút Phê Chỉ Đạo Của Ban Giám Hiệu</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructionModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{instructionDispatch.subject}</div>
                <div className="text-slate-600">
                  Số ký hiệu gốc: <strong>{instructionDispatch.originalCode}</strong> • Cơ quan:{' '}
                  <strong>{instructionDispatch.issuingAuthority}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung ý kiến chỉ đạo / Bút phê:</label>
                <textarea
                  rows={3}
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  placeholder="Giao Phó Hiệu trưởng / Tổ chuyên môn triển khai..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-amber-600 outline-none text-red-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cập nhật trạng thái xử lý:</label>
                <select
                  value={instructionStatus}
                  onChange={(e) => setInstructionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-600 outline-none"
                >
                  <option value="Chưa xử lý">Chưa xử lý</option>
                  <option value="Đang xử lý">Đang xử lý</option>
                  <option value="Đã hoàn thành">Đã hoàn thành</option>
                  <option value="Lưu theo dõi">Lưu theo dõi</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInstructionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveInstruction}
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 font-bold text-white shadow-md transition"
                >
                  Lưu Bút Phê
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CHI TIẾT CÔNG VĂN ĐI */}
      {/* ======================================================== */}
      {selectedDispatchOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-red-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Chi Tiết Văn Bản Đi #{selectedDispatchOut.sequenceNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDispatchOut(null)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div className="p-3 bg-red-50 rounded-2xl border border-red-200">
                <div className="text-[11px] text-red-800 font-mono font-bold">
                  Số ký hiệu: {selectedDispatchOut.documentCode}
                </div>
                <div className="font-black text-slate-900 text-sm mt-1">{selectedDispatchOut.subject}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="font-semibold text-slate-500">Loại văn bản:</span>{' '}
                  <span className="font-bold text-slate-900">{selectedDispatchOut.documentType}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Ngày ban hành:</span>{' '}
                  <span className="font-bold text-slate-900">
                    {new Date(selectedDispatchOut.issuedDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Người ký:</span>{' '}
                  <span className="font-bold text-slate-900">{selectedDispatchOut.signerName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Chức vụ:</span>{' '}
                  <span>{selectedDispatchOut.signerPosition}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Đơn vị soạn thảo:</span>{' '}
                  <span>{selectedDispatchOut.draftingDepartment}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Độ khẩn / Độ mật:</span>{' '}
                  <span className="font-bold text-amber-700">{selectedDispatchOut.urgency}</span> /{' '}
                  <span>{selectedDispatchOut.security}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 block mb-0.5">Nơi nhận:</span>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                  {selectedDispatchOut.recipient}
                </div>
              </div>

              {selectedDispatchOut.attachedFiles && selectedDispatchOut.attachedFiles.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Tệp đính kèm / Lưu trữ Drive:</span>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Paperclip className="w-4 h-4 text-red-600" />
                      <span>{selectedDispatchOut.attachedFiles[0].name}</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Đã đồng bộ Drive
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDispatchOut(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CHI TIẾT CÔNG VĂN ĐẾN */}
      {/* ======================================================== */}
      {selectedDispatchIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Chi Tiết Văn Bản Đến #{selectedDispatchIn.arrivalNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDispatchIn(null)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="text-[11px] text-blue-800 font-mono font-bold">
                  Số đến: #{selectedDispatchIn.arrivalNumber} • Số gốc: {selectedDispatchIn.originalCode}
                </div>
                <div className="font-black text-slate-900 text-sm mt-1">{selectedDispatchIn.subject}</div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  Cơ quan gửi: <strong>{selectedDispatchIn.issuingAuthority}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="font-semibold text-slate-500">Ngày đến:</span>{' '}
                  <span className="font-bold text-slate-900">
                    {new Date(selectedDispatchIn.arrivalDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Ngày ký gốc:</span>{' '}
                  <span>{new Date(selectedDispatchIn.issuedDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Đơn vị nhận xử lý:</span>{' '}
                  <span className="font-bold">{selectedDispatchIn.assignedToDepartment || 'BGH'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Hạn giải quyết:</span>{' '}
                  <span className="font-bold text-red-700">
                    {selectedDispatchIn.deadline ? new Date(selectedDispatchIn.deadline).toLocaleDateString('vi-VN') : 'Không có'}
                  </span>
                </div>
              </div>

              {selectedDispatchIn.leaderInstruction && (
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Ý kiến chỉ đạo / Bút phê của HT:</span>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-medium">
                    {selectedDispatchIn.leaderInstruction}
                  </div>
                </div>
              )}

              {selectedDispatchIn.attachedFiles && selectedDispatchIn.attachedFiles.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Tệp văn bản scan:</span>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                      <span>{selectedDispatchIn.attachedFiles[0].name}</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Bản scan lưu trữ
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDispatchIn(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: CHỈNH SỬA VĂN BẢN ĐI (HOÀN THIỆN SỔ CÔNG VĂN ĐI) */}
      {/* ======================================================== */}
      {editingDispatchOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-red-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">
                  Chỉnh Sửa Văn Bản Đi: {editingDispatchOut.documentCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDispatchOut(null)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditDispatchOut} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số và ký hiệu văn bản <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDispatchOut.documentCode}
                    onChange={(e) =>
                      setEditingDispatchOut({ ...editingDispatchOut, documentCode: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tên loại văn bản:
                  </label>
                  <select
                    value={editingDispatchOut.documentType}
                    onChange={(e) =>
                      setEditingDispatchOut({
                        ...editingDispatchOut,
                        documentType: e.target.value as OfficialDocumentType,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="Quyết định">Quyết định</option>
                    <option value="Kế hoạch">Kế hoạch</option>
                    <option value="Thông báo">Thông báo</option>
                    <option value="Báo cáo">Báo cáo</option>
                    <option value="Công văn">Công văn</option>
                    <option value="Tờ trình">Tờ trình</option>
                    <option value="Hướng dẫn">Hướng dẫn</option>
                    <option value="Biên bản">Biên bản</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Trích yếu nội dung văn bản <span className="text-red-600">*</span>:
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingDispatchOut.subject}
                  onChange={(e) =>
                    setEditingDispatchOut({ ...editingDispatchOut, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-red-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Ngày ban hành:
                  </label>
                  <input
                    type="date"
                    required
                    value={editingDispatchOut.issuedDate}
                    onChange={(e) =>
                      setEditingDispatchOut({ ...editingDispatchOut, issuedDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Người ký:
                  </label>
                  <input
                    type="text"
                    value={editingDispatchOut.signerName}
                    onChange={(e) =>
                      setEditingDispatchOut({ ...editingDispatchOut, signerName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Chức vụ:
                  </label>
                  <input
                    type="text"
                    value={editingDispatchOut.signerPosition}
                    onChange={(e) =>
                      setEditingDispatchOut({ ...editingDispatchOut, signerPosition: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Đơn vị / Bộ phận soạn thảo:
                  </label>
                  <input
                    type="text"
                    value={editingDispatchOut.draftingDepartment}
                    onChange={(e) =>
                      setEditingDispatchOut({ ...editingDispatchOut, draftingDepartment: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nơi nhận văn bản:
                  </label>
                  <input
                    type="text"
                    value={editingDispatchOut.recipient}
                    onChange={(e) =>
                      setEditingDispatchOut({ ...editingDispatchOut, recipient: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số lượng bản phát hành:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingDispatchOut.numberOfCopies || 1}
                    onChange={(e) =>
                      setEditingDispatchOut({ ...editingDispatchOut, numberOfCopies: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Độ khẩn:
                  </label>
                  <select
                    value={editingDispatchOut.urgency}
                    onChange={(e) =>
                      setEditingDispatchOut({ ...editingDispatchOut, urgency: e.target.value as DispatchUrgencyLevel })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="Thường">Thường</option>
                    <option value="Khẩn">Khẩn</option>
                    <option value="Thượng khẩn">Thượng khẩn</option>
                    <option value="Hỏa tốc">Hỏa tốc</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Độ mật:
                  </label>
                  <select
                    value={editingDispatchOut.security}
                    onChange={(e) =>
                      setEditingDispatchOut({ ...editingDispatchOut, security: e.target.value as DispatchSecurityLevel })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="Thường">Thường</option>
                    <option value="Mật">Mật</option>
                    <option value="Tuyệt mật">Tuyệt mật</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ghi chú lưu trữ:
                </label>
                <input
                  type="text"
                  value={editingDispatchOut.notes || ''}
                  onChange={(e) =>
                    setEditingDispatchOut({ ...editingDispatchOut, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
                  placeholder="Ghi chú thêm về bản lưu văn thư, nơi nộp..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingDispatchOut(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow-md transition"
                >
                  Lưu thay đổi văn bản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: IN SỔ ĐĂNG KÝ VĂN BẢN ĐI (CHUẨN PHỤ LỤC VI NĐ 30/2020) */}
      {/* ======================================================== */}
      {showPrintOutBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-none">
            {/* Modal Controls (Hidden when printing) */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  Xem Trước & In Sổ Đăng Ký Văn Bản Đi (Phụ lục VI - Nghị định 30/2020/NĐ-CP)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>In ngay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintOutBookModal(false)}
                  className="text-white/80 hover:text-white font-bold text-lg px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 space-y-6 text-xs text-slate-900 print:p-0">
              {/* National Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="text-center font-serif">
                  <div className="font-bold text-xs uppercase">PHÒNG GD&ĐT HUYỆN ĐỒNG XUÂN</div>
                  <div className="font-black text-sm uppercase text-red-700">TRƯỜNG TIỂU HỌC & THCS ĐỒNG XUÂN</div>
                  <div className="text-[10px] text-slate-600 italic">Mã đơn vị: DX-PY-2026</div>
                </div>

                <div className="text-center font-serif">
                  <div className="font-black text-xs uppercase tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="font-bold text-xs border-b border-slate-800 pb-0.5 inline-block">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-[10px] text-slate-500 italic mt-1">Đồng Xuân, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
                </div>
              </div>

              {/* Book Title */}
              <div className="text-center space-y-1">
                <h1 className="font-serif font-black text-lg sm:text-xl uppercase text-slate-950 tracking-wider">
                  SỔ ĐĂNG KÝ VĂN BẢN ĐI
                </h1>
                <p className="font-serif italic text-xs text-slate-700">
                  Năm học: {activeSchoolYear} • Mẫu sổ chuẩn theo Nghị định số 30/2020/NĐ-CP của Chính phủ
                </p>
                <p className="text-[11px] text-slate-500">
                  Tổng số văn bản đã phát hành: <strong>{filteredDispatchesOut.length}</strong> văn bản
                </p>
              </div>

              {/* Standard Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center border-b border-slate-900">
                      <th className="border border-slate-900 p-2 w-12">Số đi</th>
                      <th className="border border-slate-900 p-2 w-28">Số và ký hiệu</th>
                      <th className="border border-slate-900 p-2 w-24">Ngày tháng văn bản</th>
                      <th className="border border-slate-900 p-2 min-w-48">Tên loại & Trích yếu nội dung</th>
                      <th className="border border-slate-900 p-2 w-32">Người ký</th>
                      <th className="border border-slate-900 p-2 min-w-36">Nơi nhận văn bản</th>
                      <th className="border border-slate-900 p-2 w-28">Đơn vị nhận bản lưu</th>
                      <th className="border border-slate-900 p-2 w-16 text-center">Số bản</th>
                      <th className="border border-slate-900 p-2 w-24">Ghi chú</th>
                    </tr>
                    <tr className="bg-slate-50 text-[10px] text-slate-500 italic text-center">
                      <td className="border border-slate-900 p-0.5">(1)</td>
                      <td className="border border-slate-900 p-0.5">(2)</td>
                      <td className="border border-slate-900 p-0.5">(3)</td>
                      <td className="border border-slate-900 p-0.5">(4)</td>
                      <td className="border border-slate-900 p-0.5">(5)</td>
                      <td className="border border-slate-900 p-0.5">(6)</td>
                      <td className="border border-slate-900 p-0.5">(7)</td>
                      <td className="border border-slate-900 p-0.5">(8)</td>
                      <td className="border border-slate-900 p-0.5">(9)</td>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDispatchesOut.map((d) => (
                      <tr key={d.id} className="border-b border-slate-800">
                        <td className="border border-slate-900 p-2 text-center font-bold">
                          {d.sequenceNumber < 10 ? `0${d.sequenceNumber}` : d.sequenceNumber}
                        </td>
                        <td className="border border-slate-900 p-2 font-mono font-bold">
                          {d.documentCode}
                        </td>
                        <td className="border border-slate-900 p-2 text-center">
                          {new Date(d.issuedDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="border border-slate-900 p-2">
                          <span className="font-bold text-red-900">[{d.documentType}]</span> {d.subject}
                        </td>
                        <td className="border border-slate-900 p-2">
                          <div className="font-bold">{d.signerName}</div>
                          <div className="text-[10px] text-slate-500 italic">{d.signerPosition}</div>
                        </td>
                        <td className="border border-slate-900 p-2 leading-tight">
                          {d.recipient}
                        </td>
                        <td className="border border-slate-900 p-2">
                          {d.draftingDepartment}, lưu VT
                        </td>
                        <td className="border border-slate-900 p-2 text-center font-bold">
                          {d.numberOfCopies || 1}
                        </td>
                        <td className="border border-slate-900 p-2 text-[10px] text-slate-600">
                          {d.urgency !== 'Thường' ? `${d.urgency}. ` : ''}{d.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Footer */}
              <div className="grid grid-cols-3 gap-4 pt-8 text-center font-serif">
                <div>
                  <div className="font-bold uppercase text-xs">NGƯỜI LẬP SỔ</div>
                  <div className="text-[11px] text-slate-500 italic">(Ký, ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-xs">Lý Nhật Nguyệt</div>
                  <div className="text-[11px] text-slate-500">Cán bộ Văn thư</div>
                </div>

                <div>
                  <div className="font-bold uppercase text-xs">PHÓ HIỆU TRƯỞNG PHỤ TRÁCH</div>
                  <div className="text-[11px] text-slate-500 italic">(Ký, ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-xs">Phan Hưng Tuyên</div>
                  <div className="text-[11px] text-slate-500">Phó Hiệu trưởng</div>
                </div>

                <div>
                  <div className="font-bold uppercase text-xs">HIỆU TRƯỞNG DUYỆT SỔ</div>
                  <div className="text-[11px] text-slate-500 italic">(Ký tên và đóng dấu)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-xs uppercase text-red-700">Nguyễn Quốc Bảo</div>
                  <div className="text-[11px] text-slate-500">Hiệu trưởng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

