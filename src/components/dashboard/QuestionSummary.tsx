"use client";

import { Sparkles, ArrowRight, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";

export default function QuestionSummary() {
    const stats = [
        {
            title: "이번 주 질문 트렌드",
            content: "수원 정자동 만석공원 산책로 추천이 45건으로 평소보다 15% 늘었어요!",
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50",
            statValue: "+15%"
        },
        {
            title: "이웃들의 해결률",
            content: "질문의 82%가 1시간 내에 답변을 받았어요. 정말 따뜻한 동네네요!",
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
            statValue: "82%"
        },
        {
            title: "실시간 교통 주의",
            content: "내일 오전 만석공원 앞 사거리 공사가 있어요. 평소보다 10분 일찍 출발하세요.",
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50",
            statValue: "주의"
        },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-[#2E7D32]/5 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Sparkles size={18} className="text-[#2E7D32]" />
                    <span className="font-bold text-sm text-[#3E2723]">AI 동네 브리핑</span>
                </div>
                <button className="text-[10px] text-gray-400 flex items-center">
                    자세히 보기 <ArrowRight size={10} className="ml-1" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="flex items-start space-x-3">
                            <div className={`mt-1 p-1.5 rounded-lg ${s.bg}`}>
                                <Icon size={16} className={s.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-[10px] text-gray-400 font-medium truncate">{s.title}</p>
                                    <span className={`text-[10px] font-bold ${s.color}`}>{s.statValue}</span>
                                </div>
                                <p className="text-xs text-gray-700 leading-snug">{s.content}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                <p className="text-[10px] text-gray-500">
                    최근 7일간의 동네 데이터를 분석한 결과입니다.
                </p>
            </div>
        </div>
    );
}
