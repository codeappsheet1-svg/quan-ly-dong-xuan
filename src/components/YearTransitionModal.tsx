import React, { useState } from 'react';
import { SchoolClass, StudentPromotionStatus } from '../types/school';
import { storageService } from '../services/storageService';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Users,
  AlertCircle,
  Filter,
  Search,
  School,
} from 'lucide-react';

interface YearTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  currentYear: string;
  onTransitionComplete: (newYear: string) => void;
}

export const YearTransitionModal: React.FC<YearTransitionModalProps> = ({
  isOpen,
  onClose,
  classes,
  currentYear,
  onTransitionComplete,
}) => {
  const [targetYear, setTargetYear] = useState(() => {
    const parts = currentYear.split('-');
    if (parts.length === 2) {
      return `${parseInt(parts[0]) + 1}-${parseInt(parts[1]) + 1}`;
    }
    return '2027-2028';
  });

  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [studentDecisions, setStudentDecisions] = useState<Record<string, StudentPromotionStatus>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleDecisionChange = (studentId: string, status: StudentPromotionStatus) => {
    setStudentDecisions((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleBatchSetClass = (status: StudentPromotionStatus) => {
    if (!currentClass) return;
    const updated = { ...studentDecisions };
    currentClass.students.forEach((s) => {
      updated[s.id] = status;
    });
    setStudentDecisions(updated);
  };

  const handleExecuteTransition = () => {
    setIsProcessing(true);
    setTimeout(() => {
      storageService.promoteToNewSchoolYear(currentYear, targetYear, studentDecisions);
      setIsProcessing(false);
      onTransitionComplete(targetYear);
      onClose();
    }, 1000);
  };

  const filteredStudents = currentClass
    ? currentClass.students.filter((s) =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const counts = {
    lenLop: Object.values(studentDecisions).filter((v) => v === 'Lên lớp').length,
    oLai: Object.values(studentDecisions).filter((v) => v === 'Ở lại lớp').length,
    chuyenDi: Object.values(studentDecisions).filter((v) => v === 'Chuyển đi').length,
    chuyenDen: Object.values(studentDecisions).filter((v) => v === 'Chuyển đến').length,
    nghiHoc: Object.values(studentDecisions).filter((v) => v === 'Nghỉ học').length,
    mat: Object.values(studentDecisions).filter((v) => v === 'Mất').length,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-700 text-white flex items-center justify-center font-bold text-lg shadow">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Chuyển Giao Dữ Liệu Học Sinh Lên Lớp Năm Học Mới</span>
              </h3>
              <p className="text-xs text-slate-500">
                Tự động tăng khối lớp và phân loại: Lên lớp, Ở lại lớp, Chuyển đi, Nghỉ học, Mất...
              </p>
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

        {/* School Year Switch Settings */}
        <div className="my-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-800">
              Năm học hiện tại: <span className="text-red-700 font-black">{currentYear}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:inline" />
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700 whitespace-nowrap">Năm học mới:</label>
              <input
                type="text"
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                placeholder="2027-2028"
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-blue-700 outline-none w-28"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              Lên lớp: {counts.lenLop}
            </span>
            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-semibold">
              Ở lại: {counts.oLai}
            </span>
            <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-semibold">
              Chuyển đi: {counts.chuyenDi}
            </span>
            <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200 font-semibold">
              Chuyển đến: {counts.chuyenDen}
            </span>
            <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200 font-semibold">
              Nghỉ học: {counts.nghiHoc}
            </span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-semibold">
              Mất: {counts.mat}
            </span>
          </div>
        </div>

        {/* Main Content: Select Class and Student Decisions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden">
          {/* Class list (4 cols) */}
          <div className="md:col-span-4 border border-slate-200 rounded-2xl p-3 overflow-y-auto space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase pb-1.5 border-b mb-1">
              Chọn Lớp xem danh sách:
            </div>
            {classes.map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelectedClassId(cls.id)}
                className={`w-full p-2 rounded-xl text-left text-xs transition flex items-center justify-between ${
                  selectedClassId === cls.id
                    ? 'bg-red-50 border border-red-200 font-bold text-red-900'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span>Lớp {cls.name}</span>
                  <div className="text-[10px] text-slate-400 font-normal">{cls.campusName}</div>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{cls.totalStudents} HS</span>
              </button>
            ))}
          </div>

          {/* Students decision list (8 cols) */}
          <div className="md:col-span-8 border border-slate-200 rounded-2xl p-4 flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 flex-shrink-0">
              <div>
                <h4 className="font-bold text-xs uppercase text-slate-900">
                  Danh Sách Lớp {currentClass?.name} ({currentClass?.totalStudents} HS)
                </h4>
                <p className="text-[11px] text-slate-500">
                  {currentClass?.grade === 9
                    ? '🎓 Học sinh Lớp 9 hoàn thành chương trình tốt nghiệp ra trường'
                    : `Sẽ được chuyển lên Lớp ${currentClass ? currentClass.grade + 1 : ''} tương ứng`}
                </p>
              </div>

              {/* Batch Actions */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleBatchSetClass('Lên lớp')}
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-[10px] border border-emerald-200"
                >
                  Tất cả lên lớp
                </button>
              </div>
            </div>

            <div className="my-2 flex-shrink-0">
              <input
                type="text"
                placeholder="Tìm nhanh học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
            </div>

            {/* Students table */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
              {filteredStudents.map((s, idx) => {
                const decision = studentDecisions[s.id] || 'Lên lớp';
                return (
                  <div key={s.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 w-5">{idx + 1}.</span>
                      <div>
                        <div className="font-bold text-slate-800">{s.fullName}</div>
                        <div className="text-[10px] text-slate-400">
                          {s.gender} • {s.dob}
                        </div>
                      </div>
                    </div>

                    {/* Status Select */}
                    <div className="flex-shrink-0">
                      <select
                        value={decision}
                        onChange={(e) => handleDecisionChange(s.id, e.target.value as StudentPromotionStatus)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition ${
                          decision === 'Lên lớp'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : decision === 'Ở lại lớp'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : decision === 'Chuyển đi'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : decision === 'Chuyển đến'
                            ? 'bg-purple-50 border-purple-300 text-purple-800'
                            : decision === 'Nghỉ học'
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : 'bg-slate-200 border-slate-400 text-slate-800'
                        }`}
                      >
                        <option value="Lên lớp">Lên lớp</option>
                        <option value="Ở lại lớp">Ở lại lớp (Lưu ban)</option>
                        <option value="Chuyển đi">Chuyển trường đi</option>
                        <option value="Chuyển đến">Chuyển trường đến</option>
                        <option value="Nghỉ học">Nghỉ học / Thôi học</option>
                        <option value="Mất">Mất (Từ trần)</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0 mt-2 text-xs">
          <span className="text-slate-500 italic">
            CSDL năm học mới {targetYear} sẽ được khởi tạo độc lập, không làm thay đổi CSDL năm {currentYear}.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExecuteTransition}
              className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isProcessing ? 'Đang Xử Lý...' : `Khởi Tạo CSDL & Chuyển HS Sang Năm ${targetYear}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
