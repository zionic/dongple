"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, MapPin, CheckCircle2, Plus, HelpCircle, ArrowUpRight } from "lucide-react";
import { useUIStore } from "@/lib/store/uiStore";
import { fetchLiveStatus, subscribeLiveUpdates, LiveStatus } from "@/services/statusService";

export default function LiveBoardTickerv2() {
    const [liveUpdates, setLiveUpdates] = useState<LiveStatus[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const openBottomSheet = useUIStore((state) => state.openBottomSheet);

    const loadData = async () => {
        try {
            const data = await fetchLiveStatus();
            setLiveUpdates(data);
        } catch (error) {
            console.error("Failed to load status:", error);
        }
    };

    useEffect(() => {
        loadData();
        const sub = subscribeLiveUpdates(loadData);
        return () => { sub.unsubscribe(); };
    }, []);

    useEffect(() => {
        if (liveUpdates.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % liveUpdates.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [liveUpdates.length]);

    if (liveUpdates.length === 0) return null;

    const current = liveUpdates[currentIndex];

    const getStatusTheme = (status: string, isRequest: boolean) => {
        if (isRequest) return { color: "text-[#8D6E63]", label: "새 질문", icon: "🟠" };
        if (status === "여유") return { color: "text-green-500", label: "여유", icon: "🟢" };
        if (status === "보통") return { color: "text-amber-500", label: "보통", icon: "🟡" };
        return { color: "text-red-500", label: "혼잡", icon: "🔴" };
    };

    const theme = getStatusTheme(current.status, current.is_request);

    return (
        <section className="px-6 -mt-10 relative z-20">
            <div className="bg-card-bg/80 backdrop-blur-xl rounded-[32px] p-2 shadow-2xl shadow-foreground/5 border border-border transition-colors duration-500">
                <div className="flex items-center">
                    {/* Live Badge */}
                    <div className="flex flex-col items-center justify-center bg-foreground p-4 rounded-[24px] min-w-[70px] aspect-square text-background transition-colors duration-500">
                        < Zap size={20} className="text-amber-400 mb-1" />
                        <span className="text-[10px] font-black tracking-tighter uppercase leading-none">Live</span>
                    </div>

                    {/* Ticker Content */}
                    <div className="flex-1 px-4 py-2 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="flex flex-col justify-center"
                            >
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-foreground/5 ${theme.color}`}>
                                        {theme.icon} {theme.label}
                                    </span>
                                    <span className="text-[10px] text-foreground/40 font-bold flex items-center">
                                        <MapPin size={10} className="mr-0.5" />
                                        {current.category || "동네생활"}
                                    </span>
                                </div>
                                <h3 className="text-[15px] font-black text-foreground truncate leading-tight">
                                    {current.place_name}
                                </h3>
                                <p className="text-[11px] text-foreground/50 font-medium truncate mt-0.5">
                                    {current.message || "새로운 현황이 올라왔습니다."}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => openBottomSheet("liveDetail", { detailItem: current })}
                        className="mr-2 p-3 bg-foreground/5 rounded-2xl text-foreground hover:bg-foreground/10 transition-colors"
                    >
                        <ArrowUpRight size={20} />
                    </button>
                </div>
            </div>

            {/* Sub Actions */}
            <div className="flex items-center justify-between mt-4 px-2">
                <p className="text-[11px] font-bold text-gray-400">
                    지금 12곳의 실시간 상황이 올라왔어요
                </p>
                <div className="flex space-x-2">
                    <button className="text-[10px] font-black text-[#795548] flex items-center">
                        <Plus size={12} className="mr-1" /> 업데이트 제보
                    </button>
                </div>
            </div>
        </section>
    );
}
