"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

export default function QuestionSummaryV2() {
    const stats = [
        {
            title: "질문 트렌드",
            content: "수원 정자동 만석공원 산책로 추천이 45건으로 평소보다 15% 늘었어요!",
            icon: TrendingUp,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            statValue: "+15%"
        },
        {
            title: "이웃 해결률",
            content: "질문의 82%가 1시간 내에 답변을 받았어요. 정말 따뜻한 동네네요!",
            icon: CheckCircle,
            color: "text-green-400",
            bg: "bg-green-500/10",
            border: "border-green-500/20",
            statValue: "82%"
        },
        {
            title: "교통 주의",
            content: "내일 오전 만석공원 앞 사거리 공사가 있어요. 평소보다 10분 일찍!",
            icon: AlertTriangle,
            color: "text-red-400",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            statValue: "주의"
        },
    ];

    return (
        <section className="py-8">
            <div className="px-6 flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-[#A67C52]/20 rounded-lg">
                        <Sparkles size={18} className="text-[#A67C52]" />
                    </div>
                    <span className="font-bold text-lg text-foreground transition-colors duration-500">AI 동네 브리핑</span>
                </div>
            </div>

            <div className="flex overflow-x-auto pb-4 px-6 space-x-4 no-scrollbar">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div
                            key={i}
                            whileTap={{ scale: 0.98 }}
                            className={`min-w-[260px] p-5 rounded-3xl border ${s.border} ${s.bg} backdrop-blur-sm relative overflow-hidden group transition-colors duration-500`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-xl bg-card-bg shadow-sm transition-colors duration-500`}>
                                    <Icon size={18} className={s.color} />
                                </div>
                                <span className={`text-xs font-black px-2 py-1 rounded-lg bg-card-bg/50 border border-border ${s.color} transition-colors duration-500`}>
                                    {s.statValue}
                                </span>
                            </div>
                            
                            <h3 className="text-[13px] font-bold text-gray-500 mb-2">{s.title}</h3>
                            <p className="text-[14px] font-bold text-foreground leading-snug line-clamp-2 transition-colors duration-500">
                                {s.content}
                            </p>

                            <div className="mt-4 flex items-center text-[11px] font-bold text-[#A67C52] opacity-0 group-hover:opacity-100 transition-opacity">
                                자세히 알아보기 <ArrowRight size={12} className="ml-1" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
