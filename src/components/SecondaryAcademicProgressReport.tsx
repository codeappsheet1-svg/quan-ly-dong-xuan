import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { UserAccount } from '../types/school';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  GraduationCap,
  Target,
  ArrowUpRight,
  FlaskConical,
  Compass,
} from 'lucide-react';

interface SecondaryAcademicProgressReportProps {
  activeSchoolYear: string;
  currentUser: UserAccount | null;
}

export const SecondaryAcademicProgressReport: React.FC<SecondaryAcademicProgressReportProps> = ({
  activeSchoolYear,
  currentUser,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [metricView, setMetricView] = useState<'OVERVIEW' | 'MOCK_EXAMS' | 'LAB_EXPERIMENTS'>('OVERVIEW');

  // Dữ liệu tiến độ chỉ tiêu chuyên môn THCS theo tháng (Tháng 9 đến Tháng 5)
  const monthlyData = useMemo(() => [
    {
      month: 'Tháng 9',
      monthShort: 'T9',
      labTarget: 18,
      labActual: 18,
      matrixTarget: 14,
      matrixActual: 14,
      matrixRate: 100,
      hsgSessions: 4,
      mockMathScore: 6.8,
      mockLiteratureScore: 7.0,
      mockEnglishScore: 6.5,
      mockAvgScore: 6.77,
      syllabusRate: 100,
      status: 'VUOT',
      note: 'Khảo sát chất lượng đầu năm lớp 6 & thành lập đội tuyển HSG 9',
    },
    {
      month: 'Tháng 10',
      monthShort: 'T10',
      labTarget: 24,
      labActual: 25,
      matrixTarget: 16,
      matrixActual: 16,
      matrixRate: 100,
      hsgSessions: 6,
      mockMathScore: 7.1,
      mockLiteratureScore: 7.25,
      mockEnglishScore: 6.8,
      mockAvgScore: 7.05,
      syllabusRate: 98.5,
      status: 'VUOT',
      note: 'Kiểm tra giữa HK1 & tăng cường thực hành thí nghiệm KHTN 8',
    },
    {
      month: 'Tháng 11',
      monthShort: 'T11',
      labTarget: 22,
      labActual: 22,
      matrixTarget: 14,
      matrixActual: 14,
      matrixRate: 100,
      hsgSessions: 8,
      mockMathScore: 7.3,
      mockLiteratureScore: 7.4,
      mockEnglishScore: 7.0,
      mockAvgScore: 7.23,
      syllabusRate: 99.0,
      status: 'DAT',
      note: 'Hội thi GVDG cấp huyện & bồi dưỡng cao điểm HSG',
    },
    {
      month: 'Tháng 12',
      monthShort: 'T12',
      labTarget: 26,
      labActual: 25,
      matrixTarget: 20,
      matrixActual: 20,
      matrixRate: 100,
      hsgSessions: 6,
      mockMathScore: 7.5,
      mockLiteratureScore: 7.6,
      mockEnglishScore: 7.2,
      mockAvgScore: 7.43,
      syllabusRate: 98.8,
      status: 'DAT',
      note: 'Thi học kỳ 1 toàn khối 6, 7, 8, 9 & thi HSG cấp huyện đợt 1',
    },
    {
      month: 'Tháng 1',
      monthShort: 'T1',
      labTarget: 16,
      labActual: 16,
      matrixTarget: 12,
      matrixActual: 12,
      matrixRate: 100,
      hsgSessions: 4,
      mockMathScore: 7.6,
      mockLiteratureScore: 7.7,
      mockEnglishScore: 7.3,
      mockAvgScore: 7.53,
      syllabusRate: 99.2,
      status: 'DAT',
      note: 'Sơ kết HK1 và phân công ôn tập học sinh có nguy cơ trượt',
    },
    {
      month: 'Tháng 2',
      monthShort: 'T2',
      labTarget: 18,
      labActual: 18,
      matrixTarget: 14,
      matrixActual: 14,
      matrixRate: 100,
      hsgSessions: 4,
      mockMathScore: 7.7,
      mockLiteratureScore: 7.8,
      mockEnglishScore: 7.4,
      mockAvgScore: 7.63,
      syllabusRate: 98.7,
      status: 'DAT',
      note: 'Dạy học bài thực hành KHTN sau kỳ nghỉ Tết',
    },
    {
      month: 'Tháng 3',
      monthShort: 'T3',
      labTarget: 24,
      labActual: 26,
      matrixTarget: 18,
      matrixActual: 18,
      matrixRate: 100,
      hsgSessions: 8,
      mockMathScore: 8.0,
      mockLiteratureScore: 8.1,
      mockEnglishScore: 7.7,
      mockAvgScore: 7.93,
      syllabusRate: 99.5,
      status: 'VUOT',
      note: 'Khảo sát đợt 2 vào lớp 10 & thi HSG cấp tỉnh',
    },
    {
      month: 'Tháng 4',
      monthShort: 'T4',
      labTarget: 22,
      labActual: 22,
      matrixTarget: 18,
      matrixActual: 18,
      matrixRate: 100,
      hsgSessions: 6,
      mockMathScore: 8.2,
      mockLiteratureScore: 8.25,
      mockEnglishScore: 7.9,
      mockAvgScore: 8.12,
      syllabusRate: 99.1,
      status: 'DAT',
      note: 'Kiểm tra đánh giá cuối HK2 & duyệt học bạ điện tử',
    },
    {
      month: 'Tháng 5',
      monthShort: 'T5',
      labTarget: 14,
      labActual: 14,
      matrixTarget: 12,
      matrixActual: 12,
      matrixRate: 100,
      hsgSessions: 6,
      mockMathScore: 8.4,
      mockLiteratureScore: 8.4,
      mockEnglishScore: 8.1,
      mockAvgScore: 8.30,
      syllabusRate: 100,
      status: 'VUOT',
      note: 'Xét tốt nghiệp THCS và ôn thi nước rút vào lớp 10 công lập',
    },
  ], []);

  // Tiến độ hoàn thành theo từng tổ bộ môn THCS
  const departmentBreakdownData = useMemo(() => [
    { department: 'Tổ Tự Nhiên (Toán - KHTN - Tin)', completionRate: 98.8, goodLessons: 18, matricesSubmitted: 28, staffCount: 14 },
    { department: 'Tổ Xã Hội (Văn - Sử - Địa - GDCD)', completionRate: 99.2, goodLessons: 16, matricesSubmitted: 26, staffCount: 12 },
    { department: 'Tổ Ngoại Ngữ (Tiếng Anh)', completionRate: 97.5, goodLessons: 10, matricesSubmitted: 14, staffCount: 6 },
    { department: 'Tổ Nghệ Thuật & GD Thể Chất', completionRate: 99.5, goodLessons: 8, matricesSubmitted: 12, staffCount: 6 },
  ], []);

  // Filtered dataset
  const displayData = useMemo(() => {
    if (selectedMonth === 'ALL') return monthlyData;
    return monthlyData.filter((d) => d.month === selectedMonth);
  }, [monthlyData, selectedMonth]);

  // Overall Totals
  const totalLabTarget = monthlyData.reduce((s, d) => s + d.labTarget, 0);
  const totalLabActual = monthlyData.reduce((s, d) => s + d.labActual, 0);
  const avgLabRate = ((totalLabActual / totalLabTarget) * 100).toFixed(1);

  const totalMatrices = monthlyData.reduce((s, d) => s + d.matrixActual, 0);
  const totalHsgSessions = monthlyData.reduce((s, d) => s + d.hsgSessions, 0);

  const latestMockScore = monthlyData[monthlyData.length - 1].mockAvgScore;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 text-[11px] font-bold border border-purple-200 uppercase tracking-wider">
              <FlaskConical className="w-3.5 h-3.5 text-purple-700" />
              <span>Báo Cáo Tiến Độ Chuyên Môn THCS Recharts • Năm học {activeSchoolYear}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Đạt {avgLabRate}% Thí Nghiệm & Đề Thi</span>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-700" />
            <span>Tiến Độ Hoàn Thành Chỉ Tiêu Chuyên Môn THCS Theo Tháng</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp trực quan hóa số tiết thực hành thí nghiệm KHTN, tiến độ duyệt ma trận đề thi và diễn biến điểm khảo sát vào lớp 10.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-600">Tháng:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold bg-slate-50 text-slate-800"
            >
              <option value="ALL">Cả năm học (9 tháng)</option>
              {monthlyData.map((d) => (
                <option key={d.month} value={d.month}>
                  {d.month}
                </option>
              ))}
            </select>
          </div>

          {/* Metric View Pills */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => setMetricView('OVERVIEW')}
              className={`px-3 py-1 rounded-lg transition ${
                metricView === 'OVERVIEW' ? 'bg-white text-purple-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tổng quan
            </button>
            <button
              type="button"
              onClick={() => setMetricView('MOCK_EXAMS')}
              className={`px-3 py-1 rounded-lg transition ${
                metricView === 'MOCK_EXAMS' ? 'bg-white text-purple-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khảo sát Vào 10
            </button>
            <button
              type="button"
              onClick={() => setMetricView('LAB_EXPERIMENTS')}
              className={`px-3 py-1 rounded-lg transition ${
                metricView === 'LAB_EXPERIMENTS' ? 'bg-white text-purple-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thí nghiệm & HSG
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Lab Experiments */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-purple-700 font-bold">
            <span>Tiết Thực Hành Thí Nghiệm KHTN</span>
            <FlaskConical className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-950">
            {totalLabActual} / {totalLabTarget}
          </div>
          <div className="text-[11px] text-purple-800 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đạt <strong>{avgLabRate}%</strong> chỉ tiêu bộ môn</span>
          </div>
        </div>

        {/* Card 2: Test Matrices */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-700 font-bold">
            <span>Ma Trận & Đề Thi Định Kỳ</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-blue-950">
            {totalMatrices} bộ đề
          </div>
          <div className="text-[11px] text-blue-800 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>100% nộp đúng hạn BGH phê duyệt</span>
          </div>
        </div>

        {/* Card 3: HSG Training */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>Buổi Bồi Dưỡng HSG Huyện</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-950">
            {totalHsgSessions} buổi
          </div>
          <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
            <span>5 đội tuyển: Toán, Văn, Anh, KHTN, Sử</span>
          </div>
        </div>

        {/* Card 4: Mock Exam Score */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span>Điểm Khảo Sát Tuyển Sinh Vào 10</span>
            <Target className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-950">
            {latestMockScore} / 10
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tăng +1.53 điểm qua các đợt rèn</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section using Recharts */}
      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-700" />
              <span>
                {metricView === 'OVERVIEW'
                  ? 'Biểu Đồ Kết Hợp: Số Tiết Thí Nghiệm & % Hoàn Thành Ma Trận Đề Kiểm Tra'
                  : metricView === 'MOCK_EXAMS'
                  ? 'Diễn Biến Điểm Khảo Sát Vào Lớp 10 Qua Từng Tháng (Toán, Văn, Anh)'
                  : 'So Sánh: Chỉ Tiêu Tiết Thí Nghiệm & Số Buổi Bồi Dưỡng HSG'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Dữ liệu được cập nhật từ hồ sơ sổ sách và sổ điểm điện tử 52 cột A-AZ của nhà trường.
            </p>
          </div>

          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-purple-700 inline-block"></span>
              Thực tế
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
              Chỉ tiêu
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-1 bg-emerald-600 inline-block"></span>
              Điểm số / Tỷ lệ
            </span>
          </div>
        </div>

        {/* RECHARTS COMPONENT 1: Composed Chart / Overview */}
        {metricView === 'OVERVIEW' && (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="monthShort" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Số tiết / đề', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" domain={[90, 100]} tick={{ fontSize: 11, fill: '#10b981' }} label={{ value: '% Hoàn thành', angle: 90, position: 'insideRight', fontSize: 10, fill: '#10b981' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any, name: any) => {
                    if (name === 'Tiến độ chương trình (%)') return [`${val}%`, name];
                    return [`${val}`, name];
                  }}
                  labelFormatter={(lbl) => `Tiến độ THCS: ${lbl}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="labActual" name="Tiết thí nghiệm đạt được" fill="#6d28d9" radius={[6, 6, 0, 0]} barSize={22} />
                <Bar yAxisId="left" dataKey="labTarget" name="Chỉ tiêu tiết thí nghiệm" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={14} />
                <Bar yAxisId="left" dataKey="matrixActual" name="Ma trận đề đã nộp" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={18} />
                <Line yAxisId="right" type="monotone" dataKey="syllabusRate" name="Tiến độ chương trình (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RECHARTS COMPONENT 2: LineChart for Mock Exam Progression */}
        {metricView === 'MOCK_EXAMS' && (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="monthShort" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis domain={[6.0, 9.0]} tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Điểm TB / 10', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [`${val} điểm`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="mockMathScore" name="Môn Toán" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="mockLiteratureScore" name="Môn Ngữ văn" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="mockEnglishScore" name="Môn Tiếng Anh" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="mockAvgScore" name="Điểm TB 3 môn" stroke="#7c3aed" strokeWidth={4} strokeDasharray="5 5" dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RECHARTS COMPONENT 3: Lab Experiments & HSG Sessions BarChart */}
        {metricView === 'LAB_EXPERIMENTS' && (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="monthShort" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Số buổi / tiết', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [`${val} buổi / tiết`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="labActual" name="Tiết thí nghiệm KHTN" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={22} />
                <Bar dataKey="hsgSessions" name="Buổi bồi dưỡng HSG" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* RECHARTS COMPONENT 4: So Sánh Tiến Độ Giữa Các Tổ Chuyên Môn THCS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left: Department Breakdown BarChart */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-700" />
              <span>Tiến Độ Hoàn Thành Chỉ Tiêu Theo Tổ Bộ Môn THCS</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-semibold">4 Tổ chuyên môn</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentBreakdownData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[90, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }} width={120} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Tỷ lệ hoàn thành']} />
                <Bar dataKey="completionRate" fill="#7c3aed" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Detailed Table of Monthly Milestones */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-700" />
              <span>Bảng Tổng Hợp Chi Tiết Chỉ Tiêu THCS Theo Tháng</span>
            </h4>
            <span className="text-[11px] text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-lg font-bold">
              Đồng bộ 100%
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 max-h-64 overflow-y-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="px-3 py-2">Tháng</th>
                  <th className="px-3 py-2 text-center">Thí nghiệm</th>
                  <th className="px-3 py-2 text-center">Ma trận đề</th>
                  <th className="px-3 py-2 text-center">Bồi dưỡng HSG</th>
                  <th className="px-3 py-2 text-center">Điểm thi thử</th>
                  <th className="px-3 py-2 text-right">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {monthlyData.map((d) => (
                  <tr key={d.month} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2 font-bold text-slate-900">{d.month}</td>
                    <td className="px-3 py-2 text-center text-purple-700 font-bold">{d.labActual}/{d.labTarget}</td>
                    <td className="px-3 py-2 text-center text-blue-700 font-bold">{d.matrixActual} đề</td>
                    <td className="px-3 py-2 text-center text-amber-700 font-bold">{d.hsgSessions} buổi</td>
                    <td className="px-3 py-2 text-center text-emerald-700 font-bold">{d.mockAvgScore}/10</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'VUOT' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {d.status === 'VUOT' ? 'Vượt chỉ tiêu' : 'Đạt chuẩn'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
