"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, Plus, HelpCircle, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/lib/store/uiStore";

interface LiveStatus {
    id: string;
    place_name: string;
    category: string;
    status: string;
    status_color: string;
    verified_count: number;
    is_request: boolean;
    time_ago: string;
    message?: string;
    history?: { status: string; status_color: string; text: string; time: string; }[];
}

export default function LiveStatusBoard() {
    // 백엔드 연동 전까지 사용할 정교한 목업 데이터
    const [liveUpdates, setLiveUpdates] = useState<LiveStatus[]>([
        {
            id: "1",
            place_name: "만석공원 주차장",
            category: "공원",
            status: "여유",
            status_color: "text-green-500",
            verified_count: 8,
            is_request: false,
            time_ago: "5분 전",
            history: [
                { status: "여유", status_color: "text-green-500", text: "자리 넉넉하고 편합니다.", time: "5분 전" }
            ]
        },
        {
            id: "req-1",
            place_name: "장안구청 민원 대기",
            category: "기관",
            status: "인증 대기 중",
            status_color: "text-orange-500",
            verified_count: 0,
            is_request: true,
            time_ago: "방금 전"
        },
        {
            id: "2",
            place_name: "라이프스포츠 수원",
            category: "운동",
            status: "보통",
            status_color: "text-yellow-500",
            verified_count: 15,
            is_request: false,
            time_ago: "12분 전"
        },
        {
            id: "3",
            place_name: "정자시장 입구",
            category: "마켓",
            status: "혼잡",
            status_color: "text-red-500",
            verified_count: 23,
            is_request: false,
            time_ago: "24분 전",
            history: [
                { status: "혼잡", status_color: "text-red-500", text: "장날이라 사람이 미어터져요.", time: "24분 전" },
                { status: "보통", status_color: "text-yellow-500", text: "조금씩 붐비기 시작합니다.", time: "2시간 전" }
            ]
        },
    ]);

    const openBottomSheet = useUIStore((state) => state.openBottomSheet);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 자동 롤링 티커 타이머 (3.5초 간격)
    useEffect(() => {
        if (liveUpdates.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % liveUpdates.length);
        }, 3500); 
        return () => clearInterval(timer);
    }, [liveUpdates.length]);

    const statusOptions = [
        { label: "여유", color: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200", badgeColor: "text-green-500" },
        { label: "보통", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200", badgeColor: "text-yellow-500" },
        { label: "혼잡", color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200", badgeColor: "text-red-500" }
    ];

    const handleAgree = (id: string) => {
        setLiveUpdates(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, verified_count: item.verified_count + 1 };
            }
            return item;
        }));
    };

    const handleReplySubmit = ({ selectedStatus, replyText, id }: any) => {
        const option = statusOptions.find(opt => opt.label === selectedStatus);

        setLiveUpdates(prev => prev.map(item => {
            if (item.id === id) {
                const newStatus = option ? option.label : "상태 변경됨";
                const newBadgeColor = option ? option.badgeColor : "text-gray-500";
                const nowTime = "방금 전";

                const newHistoryItem = {
                    status: newStatus,
                    status_color: newBadgeColor,
                    text: replyText.trim() ? replyText : "새로운 상태가 제보되었습니다.",
                    time: nowTime
                };

                const updatedHistory = [newHistoryItem, ...(item.history || [])].slice(0, 5);

                return {
                    ...item,
                    is_request: false,
                    status: newStatus,
                    status_color: newBadgeColor,
                    verified_count: 1, // 새로운 상태로 덮어씌워지므로 인증 카운트 초기화
                    time_ago: nowTime,
                    history: updatedHistory
                };
            }
            return item;
        }));
    };

    const handleCreateSubmit = ({ newPlaceName, newCategory, selectedStatus, replyText, mode }: any) => {
        const nowTime = "방금 전";
        const isRequest = mode === "request";
        
        let newStatus = "답변대기";
        let newBadgeColor = "text-[#5D4037]";
        
        if (!isRequest) {
            const statusOpt = statusOptions.find(opt => opt.label === selectedStatus);
            if (statusOpt) {
                newStatus = statusOpt.label;
                newBadgeColor = statusOpt.badgeColor;
            }
        }

        const newHistoryItem = {
            status: newStatus,
            status_color: newBadgeColor,
            text: replyText.trim() ? replyText : (isRequest ? "이 장소의 현황이 궁금합니다." : "새로운 상황이 공유되었습니다."),
            time: nowTime
        };

        const newUpdate: LiveStatus = {
            id: `temp-${Date.now()}`,
            place_name: newPlaceName,
            category: newCategory,
            status: newStatus,
            status_color: newBadgeColor,
            verified_count: 1, 
            is_request: isRequest,
            time_ago: nowTime,
            history: [newHistoryItem]
        };

        setLiveUpdates([newUpdate, ...liveUpdates]);
    };

    const getCardBgColor = (status: string, is_request: boolean) => {
        if (is_request) return "bg-[#EFEBE9]/50 border-[#D7CCC8]";
        if (status === "여유") return "bg-green-50/50 border-green-100";
        if (status === "보통") return "bg-yellow-50/50 border-yellow-100";
        if (status === "혼잡") return "bg-red-50/50 border-red-100";
        return "bg-white border-gray-100";
    };

    const getIndicatorColor = (status: string, is_request: boolean) => {
        if (is_request) return "bg-[#8D6E63]";
        if (status === "여유") return "bg-green-500";
        if (status === "보통") return "bg-yellow-500";
        if (status === "혼잡") return "bg-red-500";
        return "bg-[#2E7D32]";
    };

    return (
        <section className="space-y-4 sticky top-0 z-40 bg-gray-50/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 shadow-sm border-b border-gray-100 transition-all shadow-[#3E2723]/5">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-[#3E2723]">실시간 동네 상황</h2>
                    <div className="flex items-center bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        <span className="flex h-1.5 w-1.5 mr-1.5">
                            <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Live</span>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => openBottomSheet("liveCreate", { mode: "request", onSubmit: (data: any) => handleCreateSubmit({ ...data, mode: "request" }) })}
                        className="text-[10px] text-[#5D4037] border border-[#D7CCC8] bg-[#EFEBE9] px-2.5 py-1.5 rounded-xl flex items-center space-x-1 font-bold hover:bg-[#D7CCC8]/50 transition-colors shadow-sm"
                    >
                        <HelpCircle size={12} />
                        <span>요청</span>
                    </button>
                    <button 
                        onClick={() => openBottomSheet("liveCreate", { mode: "share", onSubmit: (data: any) => handleCreateSubmit({ ...data, mode: "share" }) })}
                        className="text-[10px] text-white bg-[#2E7D32] px-2.5 py-1.5 rounded-xl flex items-center space-x-1 font-bold hover:bg-[#1B5E20] transition-colors shadow-sm"
                    >
                        <Plus size={12} />
                        <span>공유</span>
                    </button>
                </div>
            </div>

            {/* 뉴스 티커 (News Ticker) 형태의 단일 롤링 배너 UI */}
            {liveUpdates.length > 0 && (
                <div 
                    className={`relative flex items-center justify-between p-4 border rounded-2xl cursor-pointer shadow-sm hover:shadow-md transition-all h-16 ${getCardBgColor(liveUpdates[currentIndex].status, liveUpdates[currentIndex].is_request)}`}
                    onClick={() => {
                        const item = liveUpdates[currentIndex];
                        openBottomSheet("liveDetail", { detailItem: item });
                    }}
                >
                    {/* 왼쪽 상태 컬러 인디케이터 */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${getIndicatorColor(liveUpdates[currentIndex].status, liveUpdates[currentIndex].is_request)}`} />
                    
                    {/* 롤링 데이터 컨테이너 (키값 변경으로 애니메이션 트리거) */}
                    <div key={liveUpdates[currentIndex].id} className="flex items-center space-x-3 ml-2 flex-1 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-500">
                        <div className="flex items-center min-w-0">
                            <span className={`font-black text-[13px] mr-2 whitespace-nowrap shrink-0 ${liveUpdates[currentIndex].status_color}`}>
                                {liveUpdates[currentIndex].is_request ? "🟠 질문" : liveUpdates[currentIndex].status === "여유" ? "🟢 여유" : liveUpdates[currentIndex].status === "보통" ? "🟡 보통" : "🔴 혼잡"}
                            </span>
                            <span className="font-bold text-[#3E2723] text-[14px] truncate mr-2 shrink-0">
                                {liveUpdates[currentIndex].place_name}
                            </span>
                            <span className="text-gray-500 text-xs truncate max-w-[200px] hidden sm:inline-block">
                                - {liveUpdates[currentIndex].history?.[0]?.text || liveUpdates[currentIndex].message || "새로운 현황이 제보되었습니다."}
                            </span>
                        </div>
                    </div>

                    {/* 오른쪽 액션 및 정보 영역 */}
                    <div className="flex items-center space-x-3 shrink-0 pl-2">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-400 font-medium">{liveUpdates[currentIndex].time_ago}</span>
                            <span className="text-[10px] text-gray-500 font-bold bg-white/60 px-1.5 py-0.5 rounded-md mt-0.5">{liveUpdates[currentIndex].verified_count}명 인증</span>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const item = liveUpdates[currentIndex];
                                const isRequest = item.is_request;
                                const mode = isRequest ? "reply" : "disagree";
                                const defaultStatus = isRequest ? "보통" : (item.status === "여유" ? "보통" : "여유");
                                
                                openBottomSheet("liveReply", { 
                                    mode, 
                                    defaultStatus, 
                                    onSubmit: (data: any) => handleReplySubmit({ ...data, id: item.id }) 
                                });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-sm ${liveUpdates[currentIndex].is_request ? 'bg-[#5D4037] text-white hover:bg-[#4E342E]' : 'bg-white border border-[#D7CCC8] text-[#5D4037] hover:bg-[#EFEBE9]'}`}
                        >
                            {liveUpdates[currentIndex].is_request ? "답변" : "업데이트"}
                        </button>
                    </div>
                </div>
            )}

            {/* 지도 이동 텍스트 링크 */}
            <div className="flex justify-end mt-1">
                <Link href="/map" className="text-[11px] font-bold text-gray-400 hover:text-[#2E7D32] underline underline-offset-2 transition-colors flex items-center">
                    지도에서 동네 전체 상황 보기 🗺️
                </Link>
            </div>


        </section>
    );
}
