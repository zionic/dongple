"use client";

import { useState } from "react";
import {
  CloudSun, Building2, Store, School,
  HeartPulse, Landmark, Coffee, Gamepad2,
  Trees, BookOpen, Settings, TrendingUp
} from "lucide-react";
import QuestionSummary from "@/components/dashboard/QuestionSummary";
import LiveStatusBoard from "@/components/dashboard/LiveStatusBoard";
import { useUIStore } from "@/lib/store/uiStore";

type UserMode = "popular" | "interest";

export default function Home() {
  const [mode, setMode] = useState<UserMode>("popular");
  const [sortBy, setSortBy] = useState<"popular" | "recent">("popular");
  const openBottomSheet = useUIStore((state) => state.openBottomSheet);
  // 예시: 사용자가 등록한 관심 키워드 2개
  const [myInterests] = useState(["부동산/이사", "병원/약국"]);

  // 전체 카테고리 정의
  const allCategories = [
    { icon: CloudSun, label: "날씨/교통", color: "bg-blue-50" },
    { icon: Building2, label: "부동산/이사", color: "bg-orange-50" },
    { icon: Store, label: "동네가게", color: "bg-green-50" },
    { icon: School, label: "학교/교육", color: "bg-yellow-50" },
    { icon: Landmark, label: "공공기관", color: "bg-purple-50" },
    { icon: HeartPulse, label: "병원/약국", color: "bg-red-50" },
    { icon: Trees, label: "경로당/공원", color: "bg-emerald-50" },
    { icon: Coffee, label: "카페/만화방", color: "bg-amber-50" },
    { icon: BookOpen, label: "독서실/학습", color: "bg-indigo-50" },
    { icon: Gamepad2, label: "놀이터", color: "bg-sky-50" },
  ];

  // 인기 카테고리 상위 3개 (통계 기반 예시)
  const popularCategories = [
    { icon: Coffee, label: "카페/만화방", color: "bg-amber-50" },
    { icon: CloudSun, label: "날씨/교통", color: "bg-blue-50" },
    { icon: HeartPulse, label: "병원/약국", color: "bg-red-50" },
  ];

  // 관심 키워드에 해당하는 카테고리만 필터링 (최대 2개)
  const interestCategories = allCategories.filter(cat => myInterests.includes(cat.label)).slice(0, 2);

  return (
    <div className="p-4 space-y-8 pb-10">
      {/* AI Summary Dashboard */}
      <QuestionSummary />

      {/* Real-time Live Status Certification */}
      <LiveStatusBoard />

      {/* Mode Switcher (Underline Style) */}
      <div className="flex border-b border-gray-100 -mx-4 px-4">
        <button
          onClick={() => setMode("popular")}
          className={`relative pb-3 text-sm font-bold transition-all mr-6 ${mode === "popular" ? "text-[#795548]" : "text-gray-400"
            }`}
        >
          인기 생활
          {mode === "popular" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#795548]" />
          )}
        </button>
        <button
          onClick={() => setMode("interest")}
          className={`relative pb-3 text-sm font-bold transition-all ${mode === "interest" ? "text-[#795548]" : "text-gray-400"
            }`}
        >
          관심 생활
          {mode === "interest" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#795548]" />
          )}
        </button>
      </div>

      {/* Category Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#3E2723] flex items-center">
            {mode === "popular" ? (
              <>
                <TrendingUp size={18} className="mr-2 text-[#2E7D32]" />
                이웃들이 많이 찾는 생활
              </>
            ) : (
              "내가 찜한 동네생활"
            )}
          </h2>
          {mode === "interest" && (
            <button className="text-[11px] text-[#2E7D32] flex items-center font-medium">
              <Settings size={12} className="mr-1" /> 설정
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {mode === "popular" ? (
            popularCategories.map((cat, i) => (
              <CategoryButton key={i} {...cat} />
            ))
          ) : (
            <>
              {interestCategories.map((cat, i) => (
                <CategoryButton key={i} {...cat} />
              ))}
              {interestCategories.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center py-6">
                  <p className="text-xs text-gray-400">나의 동플에서 관심사를 등록해보세요!</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Feed Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#3E2723]">지금 우리 동네는</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <button
              onClick={() => setSortBy("popular")}
              className={`${sortBy === "popular" ? "text-[#795548] font-bold" : ""}`}
            >
              인기순
            </button>
            <span className="text-gray-200">|</span>
            <button
              onClick={() => setSortBy("recent")}
              className={`${sortBy === "recent" ? "text-[#795548] font-bold" : ""}`}
            >
              최신순
            </button>
          </div>
        </div>
        {[1, 2, 3].map((id) => (
          <div 
            key={id} 
            className="border-b border-gray-100 pb-4 cursor-pointer hover:bg-gray-50/50 transition-colors -mx-4 px-4 pt-2"
            onClick={() => openBottomSheet("postDetail", { title: "수원 정자동 근처에 조용히 공부하기 좋은 독서실 추천해주실 분 계신가요?" })}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="bg-gray-100 px-2 py-1 rounded text-[10px] text-gray-600 font-bold">동네질문</span>
              <span className="text-[11px] text-gray-400">2분 전</span>
            </div>
            <p className="text-[14px] font-bold mb-2 text-[#3E2723]">수원 정자동 근처에 조용히 공부하기 좋은 독서실 추천해주실 분 계신가요?</p>
            <div className="flex items-center space-x-3 text-[11px] text-gray-400 font-medium">
              <span>공감 5</span>
              <span>댓글 12</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function CategoryButton({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <div className="flex flex-col items-center space-y-2 cursor-pointer group">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
        <Icon size={24} className="text-gray-800" />
      </div>
      <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{label}</span>
    </div>
  );
}
