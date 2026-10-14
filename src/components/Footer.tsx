import React from 'react';
import { ShieldCheck, Heart, MapPin, Phone, Mail, Award, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white text-slate-600 print:hidden shadow-inner">
      {/* Obligatory Copyright Banner required by Principal Nguyen Quoc Bao */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 py-3.5 px-4 text-center text-white shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-2 font-medium text-sm md:text-base tracking-wide">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-300" />
            <span className="font-bold text-amber-200 uppercase tracking-wider">Bản quyền phần mềm:</span>
          </div>
          <span className="font-semibold text-white drop-shadow-sm">
            Hệ thống Quản lý nội bộ trường học, do Hiệu trưởng Nguyễn Quốc Bảo tự xây dựng, mọi sao chép đều phải xin phép.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: School Identity */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-lg shadow-sm border border-amber-300">
                ĐX
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">
                  TRƯỜNG TH & THCS ĐỒNG XUÂN
                </h3>
                <p className="text-xs text-slate-500">Thôn Long Châu, Xã Đồng Xuân, Tỉnh Đắk Lắk</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ngôi trường thân thiện, học sinh tích cực. Quy mô 1 Trụ sở chính và 3 Phân hiệu (11 điểm trường học), 57 lớp và 1.289 học sinh.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hệ thống Bảo mật Cấp trường</span>
            </div>
          </div>

          {/* Col 2: Campus System */}
          <div className="text-xs space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] text-red-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              1 Trụ sở chính & 3 Phân hiệu
            </h4>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-start gap-1">
                <span className="font-bold text-slate-700">1.</span>
                <span>Trụ sở chính: Thôn Long Châu (VP làm việc HT và NV - 0 lớp học)</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="font-bold text-slate-700">2.</span>
                <span>Phân hiệu TH La Hai (3 điểm: TH La Hai, MN La Hai, TH Long Hà)</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="font-bold text-slate-700">3.</span>
                <span>Phân hiệu TH & THCS Xuân Long (3 điểm: TH Long Mỹ, THCS Long Mỹ, TH Long Hòa)</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="font-bold text-slate-700">4.</span>
                <span>Phân hiệu TH & THCS Xuân Quang 2 (5 điểm: TH Triêm Đức, THCS Triêm Đức, TH Phước Huệ, TH Phú Sơn, TH Kỳ Đu)</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Management Core */}
          <div className="text-xs space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] text-red-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Cơ cấu Lãnh đạo & Nhân sự
            </h4>
            <ul className="space-y-1 text-slate-600">
              <li><span className="font-semibold text-slate-700">Hiệu trưởng:</span> Thầy Nguyễn Quốc Bảo (Phụ trách chung)</li>
              <li><span className="font-semibold text-slate-700">PHT phụ trách PH TH La Hai:</span> Thầy Trần Thanh Long</li>
              <li><span className="font-semibold text-slate-700">PHT phụ trách PH TH & THCS Xuân Long:</span> Thầy Phan Hưng Tuyên</li>
              <li><span className="font-semibold text-slate-700">PHT phụ trách PH TH & THCS Xuân Quang 2:</span> Thầy Ninh Đức Hiếu</li>
              <li><span className="font-semibold text-slate-700">Quản trị Hệ thống:</span> Cô Võ Thị Ngọc Hảo (GV Tin học)</li>
              <li className="pt-1 text-[11px] text-slate-500 italic">Tổng số: 137 cán bộ, giáo viên, nhân viên</li>
            </ul>
          </div>

          {/* Col 4: Contact & Drive Integration */}
          <div className="text-xs space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] text-red-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Thông tin Liên hệ Nội bộ
            </h4>
            <p className="flex items-center gap-2 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Đường dây nóng BGH: 0913.456.789</span>
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email: c1c2dongxuan.daklak@edu.vn</span>
            </p>
            <p className="text-[11px] text-slate-500 pt-2 leading-tight">
              Đồng bộ dữ liệu thời gian thực với Google Sheets và Google Drive lưu trữ hồ sơ điện tử (Cột A đến AZ).
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} Trường Tiểu học & THCS Đồng Xuân (Đắk Lắk). Bản quyền phần mềm nội bộ thuộc Hiệu trưởng Nguyễn Quốc Bảo.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Xây dựng vì sự phát triển giáo dục Xã Đồng Xuân, Tỉnh Đắk Lắk</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
