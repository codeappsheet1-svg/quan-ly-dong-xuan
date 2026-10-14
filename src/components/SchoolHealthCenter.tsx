import React, { useState } from 'react';
import { UserAccount, SchoolClass, StudentHealthRecord, StudentVaccinationItem, MedicalSupplyItem } from '../types/school';
import { BRANCHES_DATA, ALL_CAMPUSES } from '../data/initialData';
import { storageService } from '../services/storageService';
import {
  HeartPulse,
  Activity,
  Syringe,
  Package,
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  Calendar,
  Building,
} from 'lucide-react';

interface SchoolHealthCenterProps {
  currentUser: UserAccount | null;
  activeSchoolYear: string;
  classes: SchoolClass[];
}

export const SchoolHealthCenter: React.FC<SchoolHealthCenterProps> = ({
  currentUser,
  activeSchoolYear,
  classes,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'health_records' | 'vaccinations' | 'supplies'>('health_records');

  // Datasets from storage
  const [healthRecords, setHealthRecords] = useState<StudentHealthRecord[]>(() => storageService.getHealthRecords(activeSchoolYear));
  const [vaccinations, setVaccinations] = useState<StudentVaccinationItem[]>(() => storageService.getVaccinations());
  const [supplies, setSupplies] = useState<MedicalSupplyItem[]>(() => storageService.getMedicalSupplies());

  // Filters
  const [filterBranch, setFilterBranch] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddHealthModal, setShowAddHealthModal] = useState(false);
  const [showAddSupplyModal, setShowAddSupplyModal] = useState(false);

  // Form: Health Record
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('1A - La Hai');
  const [branchName, setBranchName] = useState(BRANCHES_DATA[1].name);
  const [campusName, setCampusName] = useState(ALL_CAMPUSES[1].name);
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [dob, setDob] = useState('2019-05-15');
  const [heightCm, setHeightCm] = useState(120);
  const [weightKg, setWeightKg] = useState(22);
  const [visionLeft, setVisionLeft] = useState('10/10');
  const [visionRight, setVisionRight] = useState('10/10');
  const [dental, setDental] = useState<StudentHealthRecord['dentalHealth']>('Bình thường');
  const [spine, setSpine] = useState<StudentHealthRecord['spineHealth']>('Bình thường');
  const [classification, setClassification] = useState<StudentHealthRecord['healthClassification']>('Loại I');
  const [doctorNotes, setDoctorNotes] = useState('Học sinh phát triển thể lực tốt, không có bệnh lý.');

  // Form: Medical Supply
  const [supplyName, setSupplyName] = useState('');
  const [supplyCategory, setSupplyCategory] = useState<MedicalSupplyItem['category']>('Sát trùng & Băng bó');
  const [supplyUnit, setSupplyUnit] = useState('Hộp');
  const [supplyQty, setSupplyQty] = useState(10);
  const [supplyMinQty, setSupplyMinQty] = useState(3);
  const [supplyExpiry, setSupplyExpiry] = useState('2028-12-31');
  const [supplyCampus, setSupplyCampus] = useState(ALL_CAMPUSES[0].name);

  // Filtered lists
  const filteredHealthRecords = healthRecords.filter((hr) => {
    if (filterBranch !== 'ALL' && hr.branchName !== filterBranch) return false;
    if (filterClass !== 'ALL' && hr.className !== filterClass) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return hr.studentName.toLowerCase().includes(q) || hr.className.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredVaccinations = vaccinations.filter((v) => {
    if (filterClass !== 'ALL' && v.className !== filterClass) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return v.studentName.toLowerCase().includes(q) || v.vaccineName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateHealthRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName) return;

    const bmi = Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
    const nutrition: StudentHealthRecord['nutritionStatus'] =
      bmi < 14 ? 'Suy dinh dưỡng' : bmi > 22 ? 'Béo phì' : bmi > 19 ? 'Thừa cân' : 'Bình thường';

    const newRecord: StudentHealthRecord = {
      id: 'SK_' + Date.now().toString().slice(-4),
      studentId: 'HS_' + Date.now().toString().slice(-4),
      studentName,
      classId: 'CLASS_' + className,
      className,
      branchName,
      campusName,
      gender,
      dob,
      heightCm,
      weightKg,
      bmi,
      nutritionStatus: nutrition,
      visionLeft,
      visionRight,
      dentalHealth: dental,
      spineHealth: spine,
      healthClassification: classification,
      examDate: new Date().toISOString().split('T')[0],
      doctorNotes,
    };

    const updated = [newRecord, ...healthRecords];
    storageService.saveHealthRecords(updated, activeSchoolYear);
    setHealthRecords(updated);
    setShowAddHealthModal(false);
    setStudentName('');
  };

  const handleCreateSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyName) return;

    const newSupply: MedicalSupplyItem = {
      id: 'MED_' + Date.now().toString().slice(-4),
      campusId: 'CS_' + supplyCampus,
      campusName: supplyCampus,
      name: supplyName,
      category: supplyCategory,
      unit: supplyUnit,
      quantityInStock: supplyQty,
      minSafeQuantity: supplyMinQty,
      expiryDate: supplyExpiry,
      isExpired: false,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    const updated = [...supplies, newSupply];
    storageService.saveMedicalSupplies(updated);
    setSupplies(updated);
    setShowAddSupplyModal(false);
    setSupplyName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-teal-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600/30 text-teal-300 text-xs font-bold border border-teal-500/30 mb-2">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>PHÂN HỆ Y TẾ HỌC ĐƯỜNG TRƯỜNG TH & THCS ĐỒNG XUÂN</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Sổ Khám Sức Khỏe, Lịch Tiêm Chủng & Tủ Thuốc Học Đường
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Đặc thù liên cấp Tiểu học và THCS: theo dõi thể lực định kỳ (chiều cao, cân nặng, BMI, tật khúc xạ),
              tiêm chủng mở rộng và quản lý tủ thuốc sơ cấp cứu tại tất cả 12 điểm trường.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddHealthModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ghi Nhận Khám Sức Khỏe</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddSupplyModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs shadow transition"
            >
              <Package className="w-4 h-4" />
              <span>Thêm Vật Tư Tủ Thuốc</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 mt-6 border-t border-teal-800/60 pt-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('health_records')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'health_records' ? 'bg-white text-slate-900 shadow' : 'bg-teal-950/60 text-slate-300 hover:bg-teal-950'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Sổ Khám Sức Khỏe ({healthRecords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('vaccinations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'vaccinations' ? 'bg-white text-slate-900 shadow' : 'bg-teal-950/60 text-slate-300 hover:bg-teal-950'
            }`}
          >
            <Syringe className="w-4 h-4" />
            <span>Lịch Tiêm Chủng Mở Rộng ({vaccinations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('supplies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'supplies' ? 'bg-white text-slate-900 shadow' : 'bg-teal-950/60 text-slate-300 hover:bg-teal-950'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Tủ Thuốc & Vật Tư Y Tế ({supplies.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SỔ KHÁM SỨC KHỎE */}
      {activeSubTab === 'health_records' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
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
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Học Sinh</th>
                    <th className="py-2.5 px-3">Lớp & Điểm Trường</th>
                    <th className="py-2.5 px-3 text-center">Thể Lực (Cao / Nặng)</th>
                    <th className="py-2.5 px-3 text-center">BMI & Dinh Dưỡng</th>
                    <th className="py-2.5 px-3 text-center">Thị Lực (Trái / Phải)</th>
                    <th className="py-2.5 px-3 text-center">Răng Hàm Mặt</th>
                    <th className="py-2.5 px-3 text-center">Cột Sống</th>
                    <th className="py-2.5 px-3 text-center">Phân Loại</th>
                    <th className="py-2.5 px-3">Kết Luận Cán Bộ Y Tế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHealthRecords.map((hr) => (
                    <tr key={hr.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-slate-900 block">{hr.studentName}</span>
                        <span className="text-[10px] text-slate-400">{hr.gender} • {hr.dob}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-red-700">{hr.className}</span>
                        <span className="text-[10px] text-slate-400 block">📍 {hr.campusName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-slate-800">{hr.heightCm} cm</span> / {hr.weightKg} kg
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-blue-700">{hr.bmi}</span>
                        <span className="block text-[10px] text-slate-500 font-semibold">{hr.nutritionStatus}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {hr.visionLeft} / {hr.visionRight}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hr.dentalHealth === 'Bình thường' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {hr.dentalHealth}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {hr.spineHealth}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black text-[10px]">
                          {hr.healthClassification}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={hr.doctorNotes}>
                        {hr.doctorNotes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TIÊM CHỦNG */}
      {activeSubTab === 'vaccinations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Học Sinh</th>
                  <th className="py-2.5 px-3">Lớp</th>
                  <th className="py-2.5 px-3">Loại Vắc Xin</th>
                  <th className="py-2.5 px-3 text-center">Mũi Tiêm</th>
                  <th className="py-2.5 px-3">Lịch Dự Kiến</th>
                  <th className="py-2.5 px-3">Ngày Tiêm Thực Tế</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                  <th className="py-2.5 px-3">Ghi Chú Phản Ứng Sau Tiêm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVaccinations.map((vac) => (
                  <tr key={vac.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-extrabold text-slate-900">{vac.studentName}</td>
                    <td className="py-2.5 px-3 font-bold text-red-700">{vac.className}</td>
                    <td className="py-2.5 px-3 font-semibold text-teal-800">{vac.vaccineName}</td>
                    <td className="py-2.5 px-3 text-center font-bold">Mũi {vac.doseNumber}</td>
                    <td className="py-2.5 px-3">{vac.scheduledDate}</td>
                    <td className="py-2.5 px-3 font-semibold">{vac.administeredDate || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          vac.status === 'Đã tiêm' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {vac.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{vac.notes || 'Không có phản ứng phụ'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TỦ THUỐC & VẬT TƯ */}
      {activeSubTab === 'supplies' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {supplies.map((sup) => (
            <div key={sup.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">
                  {sup.category}
                </span>
                <span className="text-[10px] text-slate-400">HSD: {sup.expiryDate}</span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{sup.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">📍 {sup.campusName}</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Tồn kho:</span>
                  <span className="text-base font-black text-emerald-700">
                    {sup.quantityInStock} {sup.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Tối thiểu:</span>
                  <span className="font-semibold text-slate-600">{sup.minSafeQuantity} {sup.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: KHÁM SỨC KHỎE */}
      {showAddHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-600" />
                Ghi Nhận Kết Quả Khám Sức Khỏe Học Sinh
              </h3>
              <button type="button" onClick={() => setShowAddHealthModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHealthRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ và tên học sinh:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn Bảo"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lớp:</label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chiều cao (cm):</label>
                  <input
                    type="number"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cân nặng (kg):</label>
                  <input
                    type="number"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phân loại SK:</label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-bold"
                  >
                    <option value="Loại I">Loại I</option>
                    <option value="Loại II">Loại II</option>
                    <option value="Loại III">Loại III</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thị lực mắt trái:</label>
                  <input
                    type="text"
                    value={visionLeft}
                    onChange={(e) => setVisionLeft(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thị lực mắt phải:</label>
                  <input
                    type="text"
                    value={visionRight}
                    onChange={(e) => setVisionRight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nhận xét cán bộ y tế:</label>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddHealthModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow"
                >
                  Lưu Sổ Sức Khỏe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM VẬT TƯ */}
      {showAddSupplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                Thêm Thuốc & Vật Tư Y Tế
              </h3>
              <button type="button" onClick={() => setShowAddSupplyModal(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupply} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên thuốc / Vật tư:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Oresol 245, Nước muối sinh lý..."
                  value={supplyName}
                  onChange={(e) => setSupplyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số lượng nhập:</label>
                  <input
                    type="number"
                    min={1}
                    value={supplyQty}
                    onChange={(e) => setSupplyQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn vị tính:</label>
                  <input
                    type="text"
                    value={supplyUnit}
                    onChange={(e) => setSupplyUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddSupplyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow"
                >
                  Lưu Vào Tủ Thuốc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
