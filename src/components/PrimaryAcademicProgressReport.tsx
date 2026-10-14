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
} from 'lucide-react';

interface PrimaryAcademicProgressReportProps {
  activeSchoolYear: string;
  currentUser: UserAccount | null;
}

export const PrimaryAcademicProgressReport: React.FC<PrimaryAcademicProgressReportProps> = ({
  activeSchoolYear,
  currentUser,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [metricView, setMetricView] = useState<'OVERVIEW' | 'STEM_DEMO' | 'STUDENT_PROFICIENCY'>('OVERVIEW');

  // Dữ liệu tiến độ chỉ tiêu chuyên môn theo 9 tháng trong năm học (Tháng 9 đến Tháng 5)
  const monthlyData = useMemo(() => [
    {
      month: 'Tháng 9',
      monthShort: 'T9',
      lessonPlansTarget: 228,
      lessonPlansActual: 228,
      lessonPlansRate: 100,
      demoLessonsTarget: 4,
      demoLessonsActual: 5,
      stemSessionsTarget: 6,
      stemSessionsActual: 6,
      studentProficiencyRate: 88.5,
      digitalUsageRate: 85.0,
      status: 'VUOT',
      note: 'Hoàn thành 100% rà soát đầu năm và khai giảng',
    },
    {
      month: 'Tháng 10',
      monthShort: 'T10',
      lessonPlansTarget: 240,
      lessonPlansActual: 236,
      lessonPlansRate: 98.3,
      demoLessonsTarget: 6,
      demoLessonsActual: 7,
      stemSessionsTarget: 8,
      stemSessionsActual: 9,
      studentProficiencyRate: 90.2,
      digitalUsageRate: 89.5,
      status: 'VUOT',
      note: 'Hội thi giáo viên dạy giỏi cấp trường & tiết dạy STEM lớp 3',
    },
    {
      month: 'Tháng 11',
      monthShort: 'T11',
      lessonPlansTarget: 235,
      lessonPlansActual: 232,
      lessonPlansRate: 98.7,
      demoLessonsTarget: 8,
      demoLessonsActual: 8,
      stemSessionsTarget: 8,
      stemSessionsActual: 8,
      studentProficiencyRate: 91.8,
      digitalUsageRate: 92.0,
      status: 'DAT',
      note: 'Thi đua đợt 20/11 - Hội thi viết chữ đẹp cấp tiểu học',
    },
    {
      month: 'Tháng 12',
      monthShort: 'T12',
      lessonPlansTarget: 245,
      lessonPlansActual: 240,
      lessonPlansRate: 98.0,
      demoLessonsTarget: 6,
      demoLessonsActual: 6,
      stemSessionsTarget: 8,
      stemSessionsActual: 8,
      studentProficiencyRate: 93.5,
      digitalUsageRate: 90.0,
      status: 'DAT',
      note: 'Khảo sát chất lượng cuối Học kỳ 1 Khối 1 - 5',
    },
    {
      month: 'Tháng 1',
      monthShort: 'T1',
      lessonPlansTarget: 210,
      lessonPlansActual: 205,
      lessonPlansRate: 97.6,
      demoLessonsTarget: 4,
      demoLessonsActual: 4,
      stemSessionsTarget: 6,
      stemSessionsActual: 6,
      studentProficiencyRate: 94.0,
      digitalUsageRate: 88.0,
      status: 'DAT',
      note: 'Sơ kết Học kỳ 1 và triển khai phân phối chương trình HK2',
    },
    {
      month: 'Tháng 2',
      monthShort: 'T2',
      lessonPlansTarget: 190,
      lessonPlansActual: 188,
      lessonPlansRate: 98.9,
      demoLessonsTarget: 4,
      demoLessonsActual: 4,
      stemSessionsTarget: 6,
      stemSessionsActual: 6,
      studentProficiencyRate: 94.8,
      digitalUsageRate: 91.0,
      status: 'DAT',
      note: 'Dạy học sau Tết Nguyên đán & củng cố kiến thức',
    },
    {
      month: 'Tháng 3',
      monthShort: 'T3',
      lessonPlansTarget: 245,
      lessonPlansActual: 242,
      lessonPlansRate: 98.8,
      demoLessonsTarget: 6,
      demoLessonsActual: 7,
      stemSessionsTarget: 8,
      stemSessionsActual: 8,
      studentProficiencyRate: 95.5,
      digitalUsageRate: 93.0,
      status: 'VUOT',
      note: 'Chuyên đề đổi mới phương pháp Tiếng Việt & Toán Khối 4, 5',
    },
    {
      month: 'Tháng 4',
      monthShort: 'T4',
      lessonPlansTarget: 230,
      lessonPlansActual: 226,
      lessonPlansRate: 98.3,
      demoLessonsTarget: 5,
      demoLessonsActual: 5,
      stemSessionsTarget: 6,
      stemSessionsActual: 6,
      studentProficiencyRate: 96.2,
      digitalUsageRate: 92.5,
      status: 'DAT',
      note: 'Kiểm tra đánh giá định kỳ giữa HK2 & chuẩn bị hồ sơ',
    },
    {
      month: 'Tháng 5',
      monthShort: 'T5',
      lessonPlansTarget: 200,
      lessonPlansActual: 198,
      lessonPlansRate: 99.0,
      demoLessonsTarget: 3,
      demoLessonsActual: 3,
      stemSessionsTarget: 4,
      stemSessionsActual: 4,
      studentProficiencyRate: 97.0,
      digitalUsageRate: 94.0,
      status: 'DAT',
      note: 'Tổng kết năm học, hoàn thành chương trình tiểu học lớp 5',
    },
  ], []);

  // Tiến độ hoàn thành theo từng khối lớp (Khối 1 -> 5)
  const gradeBreakdownData = useMemo(() => [
    { grade: 'Khối 1', completionRate: 98.5, stemProjects: 8, goodTeachersCount: 8, readingProficiency: 92.5 },
    { grade: 'Khối 2', completionRate: 97.8, stemProjects: 9, goodTeachersCount: 7, readingProficiency: 94.0 },
    { grade: 'Khối 3', completionRate: 99.0, stemProjects: 11, goodTeachersCount: 9, readingProficiency: 95.8 },
    { grade: 'Khối 4', completionRate: 98.2, stemProjects: 10, goodTeachersCount: 8, readingProficiency: 96.5 },
    { grade: 'Khối 5', completionRate: 99.2, stemProjects: 12, goodTeachersCount: 10, readingProficiency: 97.8 },
  ], []);

  // Filtered dataset if user selected a single month
  const displayData = useMemo(() => {
    if (selectedMonth === 'ALL') return monthlyData;
    return monthlyData.filter((d) => d.month === selectedMonth);
  }, [monthlyData, selectedMonth]);

  // Overall Totals
  const totalLessonPlansTarget = monthlyData.reduce((s, d) => s + d.lessonPlansTarget, 0);
  const totalLessonPlansActual = monthlyData.reduce((s, d) => s + d.lessonPlansActual, 0);
  const avgLessonPlanRate = ((totalLessonPlansActual / totalLessonPlansTarget) * 100).toFixed(1);

  const totalDemoTarget = monthlyData.reduce((s, d) => s + d.demoLessonsTarget, 0);
  const totalDemoActual = monthlyData.reduce((s, d) => s + d.demoLessonsActual, 0);

  const totalStemTarget = monthlyData.reduce((s, d) => s + d.stemSessionsTarget, 0);
  const totalStemActual = monthlyData.reduce((s, d) => s + d.stemSessionsActual, 0);

  const currentProficiencyRate = monthlyData[monthlyData.length - 1].studentProficiencyRate;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold border border-blue-200 uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
              <span>Báo Cáo Tiến Độ Chuyên Môn Recharts • Năm học {activeSchoolYear}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tiến độ đạt {avgLessonPlanRate}%</span>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-700" />
            <span>Tiến Độ Hoàn Thành Chỉ Tiêu Chuyên Môn Tiểu Học Theo Tháng</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp trực quan số tiết hội giảng, chuyên đề STEM, giáo án duyệt đúng hạn và tỷ lệ chuẩn học sinh từ Tháng 9 đến Tháng 5.
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
                metricView === 'OVERVIEW' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tổng quan
            </button>
            <button
              type="button"
              onClick={() => setMetricView('STEM_DEMO')}
              className={`px-3 py-1 rounded-lg transition ${
                metricView === 'STEM_DEMO' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hội giảng & STEM
            </button>
            <button
              type="button"
              onClick={() => setMetricView('STUDENT_PROFICIENCY')}
              className={`px-3 py-1 rounded-lg transition ${
                metricView === 'STUDENT_PROFICIENCY' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chuẩn năng lực HS
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Lesson Plans */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-700 font-bold">
            <span>Giáo Án & KHDH Đã Duyệt</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-blue-950">
            {totalLessonPlansActual} / {totalLessonPlansTarget}
          </div>
          <div className="text-[11px] text-blue-800 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đạt <strong>{avgLessonPlanRate}%</strong> chỉ tiêu kế hoạch</span>
          </div>
        </div>

        {/* Card 2: Demo Lessons */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
            <span>Tiết Hội Giảng / Thao Giảng</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-950">
            {totalDemoActual} / {totalDemoTarget}
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Vượt <strong>+3 tiết</strong> so với kế hoạch</span>
          </div>
        </div>

        {/* Card 3: STEM Sessions */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-purple-700 font-bold">
            <span>Chuyên Đề & Bài Dạy STEM</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-950">
            {totalStemActual} / {totalStemTarget}
          </div>
          <div className="text-[11px] text-purple-800 font-semibold flex items-center gap-1">
            <span>Triển khai đều khắp Khối 1 - 5</span>
          </div>
        </div>

        {/* Card 4: Reading & Math Proficiency */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>Đạt Chuẩn Đọc & Toán Cuối Kỳ</span>
            <Target className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-950">
            {currentProficiencyRate}%
          </div>
          <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tăng +8.5% so với đầu năm</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section using Recharts */}
      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-700" />
              <span>
                {metricView === 'OVERVIEW'
                  ? 'Biểu Đồ Kết Hợp: Số Tiết Hội Giảng & Tỷ Lệ Duyệt Bài Dạy Đúng Hạn'
                  : metricView === 'STEM_DEMO'
                  ? 'So Sánh: Chỉ Tiêu Tiết Dạy STEM & Thao Giảng Cấp Trường'
                  : 'Xu Hướng Phát Triển Chuẩn Năng Lực Học Sinh & Ứng Dụng CNTT'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Biểu đồ trực quan hóa dữ liệu được lưu trữ tự động trên hệ thống nội bộ trường học Đồng Xuân.
            </p>
          </div>

          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
              Thực tế đạt
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
              Chỉ tiêu giao
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-1 bg-rose-600 inline-block"></span>
              Tỷ lệ %
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
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Số tiết', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" domain={[80, 100]} tick={{ fontSize: 11, fill: '#e11d48' }} label={{ value: '% Đúng hạn', angle: 90, position: 'insideRight', fontSize: 10, fill: '#e11d48' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any, name: any) => {
                    if (name === 'Tỷ lệ đúng hạn (%)') return [`${val}%`, name];
                    return [`${val} tiết`, name];
                  }}
                  labelFormatter={(lbl) => `Tiến độ: ${lbl}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="demoLessonsActual" name="Tiết hội giảng đạt được" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar yAxisId="left" dataKey="demoLessonsTarget" name="Chỉ tiêu hội giảng" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={16} />
                <Line yAxisId="right" type="monotone" dataKey="lessonPlansRate" name="Tỷ lệ đúng hạn (%)" stroke="#e11d48" strokeWidth={3} dot={{ r: 4, fill: '#e11d48' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RECHARTS COMPONENT 2: STEM & Demo Sessions BarChart */}
        {metricView === 'STEM_DEMO' && (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="monthShort" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Số chuyên đề / tiết', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [`${val} tiết / chuyên đề`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="stemSessionsActual" name="Chuyên đề STEM thực hiện" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="stemSessionsTarget" name="Chỉ tiêu STEM giao" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={14} />
                <Bar dataKey="demoLessonsActual" name="Tiết dạy tốt / thao giảng" fill="#059669" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RECHARTS COMPONENT 3: AreaChart for Student Proficiency & Digital Usage */}
        {metricView === 'STUDENT_PROFICIENCY' && (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <defs>
                  <linearGradient id="gradProficiency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="gradDigital" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="monthShort" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#475569' }} label={{ value: 'Tỷ lệ %', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [`${val}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="studentProficiencyRate" name="Tỷ lệ đạt chuẩn đọc & toán (%)" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#gradProficiency)" />
                <Area type="monotone" dataKey="digitalUsageRate" name="Ứng dụng CNTT trong dạy học (%)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gradDigital)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* RECHARTS COMPONENT 4: So Sánh Tiến Độ Giữa Các Khối Lớp 1 Đến 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left: Grade Level BarChart */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>Tiến Độ Hoàn Thành Chỉ Tiêu Theo Khối Lớp</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-semibold">Khối 1 - 5</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeBreakdownData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[90, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="grade" type="category" tick={{ fontSize: 11, fontWeight: 700, fill: '#1e293b' }} width={60} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Tỷ lệ hoàn thành']} />
                <Bar dataKey="completionRate" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Detailed Table of Monthly Milestones */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Bảng Tổng Hợp Chi Tiết Từng Tháng</span>
            </h4>
            <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg font-bold">
              Đồng bộ 100%
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 max-h-64 overflow-y-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="px-3 py-2">Tháng</th>
                  <th className="px-3 py-2 text-center">Giáo án</th>
                  <th className="px-3 py-2 text-center">Hội giảng</th>
                  <th className="px-3 py-2 text-center">STEM</th>
                  <th className="px-3 py-2 text-center">Đạt chuẩn</th>
                  <th className="px-3 py-2 text-right">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {monthlyData.map((d) => (
                  <tr key={d.month} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2 font-bold text-slate-900">{d.month}</td>
                    <td className="px-3 py-2 text-center text-slate-700">{d.lessonPlansActual}/{d.lessonPlansTarget}</td>
                    <td className="px-3 py-2 text-center text-blue-700 font-bold">{d.demoLessonsActual} tiết</td>
                    <td className="px-3 py-2 text-center text-purple-700 font-bold">{d.stemSessionsActual} bài</td>
                    <td className="px-3 py-2 text-center text-emerald-700 font-bold">{d.studentProficiencyRate}%</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'VUOT' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
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
