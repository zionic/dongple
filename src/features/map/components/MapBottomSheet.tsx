"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, ChevronsDown, ChevronsUp, HelpCircle, MapPin, Minus, Navigation2, Plus, ShieldCheck } from "lucide-react";
import { LiveStatus, verifyStatusWithTrust } from "@/services/statusService";
import { useLocationStore } from "@/lib/store/locationStore";
import { getDistance, formatDistance } from "@/services/api";
import { TrustBadge } from "@/lib/trust-utils";
import { getPersistentUserId } from "@/lib/auth-utils";

interface MapBottomSheetProps {
    sheetHeight: number;
    isDragging?: boolean;
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onSnapToHeight: (height: number) => void;
    markers: LiveStatus[];
    officialEvents?: any[];
    expandedCardId: string | null;
    onCardClick: (id: string, lat: number, lng: number) => void;
    onOpenCreate: (mode: string) => void;
}

export default function MapBottomSheet({
    sheetHeight,
    isDragging = false,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onSnapToHeight,
    markers,
    officialEvents = [],
    expandedCardId,
    onCardClick,
    onOpenCreate
}: MapBottomSheetProps) {
    const { latitude: userLat, longitude: userLng } = useLocationStore();
    const [verifiedIds, setVerifiedIds] = React.useState<Set<string>>(new Set());

    const handleVerify = async (e: React.MouseEvent, cardId: string) => {
        e.stopPropagation();
        if (verifiedIds.has(cardId)) return;

        const userId = getPersistentUserId();
        const success = await verifyStatusWithTrust(cardId, userId);
        
        if (success) {
            setVerifiedIds(prev => new Set(prev).add(cardId));
        }
    };

    // 소식들과 공식 행사를 통합하고 거리 계산 및 정렬 추가
const allItems = [
        ...markers.map(m => {
            const dist = getDistance(userLat, userLng, m.latitude || 37.3015, m.longitude || 126.9930);
            return { ...m, isOfficial: false, distance: dist, distanceStr: formatDistance(dist) };
        }),
        ...officialEvents.map(e => {
            const dist = getDistance(userLat, userLng, e.lat, e.lng);
            return { 
                ...e, 
                id: String(e.id), 
                place_name: e.title, 
                isOfficial: true,
                status: "공식 행사",
                status_color: "text-secondary",
                distance: dist,
                distanceStr: formatDistance(dist)
            };
        })
    ].sort((a, b) => (a.distance || 0) - (b.distance || 0));

    const isExpanded = sheetHeight >= 68;

    return (
        <div 
            className={`absolute bottom-0 left-0 w-full z-[60] bg-nav-bg backdrop-blur-3xl rounded-t-[32px] shadow-2xl border-t border-border flex flex-col ${
                isDragging ? "" : "transition-[height] duration-300 ease-out"
            }`} 
            style={{ height: `${sheetHeight}vh` }}
        >
            <div 
                className="w-full pt-4 pb-3 cursor-ns-resize flex flex-col items-center shrink-0 touch-none select-none" 
                onPointerDown={onPointerDown} 
                onPointerMove={onPointerMove} 
                onPointerUp={onPointerUp}
                onClick={() => onSnapToHeight(isExpanded ? 20 : 85)}
            >
                <div style={{ width: '40px', height: '5px', backgroundColor: '#d1d5db', borderRadius: '9999px', marginBottom: '16px' }} />
                <div className="w-full px-6 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black text-secondary tracking-widest uppercase mb-1">DONGPLE LIVE</span>
                        <h3 className="font-black text-foreground text-2xl tracking-tighter">
                            주변의 순간들 <span className="text-secondary opacity-30 ml-1">{allItems.length}</span>
                        </h3>
                    </div>
                    <div className="flex space-x-2">
                         <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onOpenCreate("request")} className="p-3 bg-foreground/5 rounded-2xl text-foreground/40 hover:text-foreground transition-all" aria-label="상황 요청">
                             <HelpCircle size={22} />
                         </button>
                    </div>
                </div>
            </div>

            <div id="sheet-scroll-container" className="px-6 py-4 overflow-y-auto space-y-4 flex-1 pb-32 no-scrollbar">
                {allItems.length > 0 ? allItems.map(card => {
                    const statusTheme = getStatusTheme(card);

                    return (
                    <motion.div 
                        key={`${card.isOfficial ? 'off' : 'live'}-${card.id}`} 
                        id={`card-${card.id}`} 
                        onClick={() => onCardClick(card.id, card.latitude || card.lat || 37.3015, card.longitude || card.lng || 126.9930)} 
                        className={`p-4 rounded-3xl border border-border bg-card-bg/50 transition-all duration-500 ${expandedCardId === card.id ? 'ring-4 ring-secondary/5 bg-card-bg border-secondary/20 shadow-2xl' : ''}`}
                    >
                        <div className="space-y-2.5">
                            <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                                <h4 className="min-w-0 flex-1 truncate font-black text-foreground text-[17px] leading-tight">{card.place_name}</h4>
                                <div className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] font-black ${statusTheme.text} ${statusTheme.bg}`}>
                                        <div className={`w-2 h-2 rounded-full mr-1.5 ${statusTheme.dot} ${expandedCardId === card.id ? 'animate-ping' : ''}`} />
                                    {statusTheme.label}
                                </div>
                                <span className="shrink-0 text-[11px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-lg">
                                        {card.distanceStr}
                                </span>
                            </div>

                            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                                <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest ${card.isOfficial ? 'text-secondary' : 'text-foreground/45'}`}>
                                    {card.isOfficial ? "OFFICIAL" : card.category}
                                </span>
                                <div className="min-w-0 shrink opacity-75">
                                    <TrustBadge score={card.score || 0.5} isOfficial={card.isOfficial} />
                                </div>
                                {card.message && (
                                    <span className="shrink-0 text-[10px] font-black text-secondary uppercase">상세있음</span>
                                )}
                            </div>
                        </div>
                        {expandedCardId === card.id && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 pt-6 border-t border-foreground/5 space-y-5">
                                {(card.message || card.description) && (
                                    <div className="bg-foreground/[0.03] p-4 rounded-2xl border border-foreground/5">
                                        <p className="text-[13px] text-foreground/70 font-medium leading-relaxed italic">
                                            "{card.message || card.description}"
                                        </p>
                                    </div>
                                )}

                                {/* 길찾기 연동 */}
                                <div className="grid grid-cols-2 gap-2">
                                    <a 
                                        href={`https://map.naver.com/v5/search/${encodeURIComponent(card.place_name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-3 bg-foreground/5 rounded-xl font-black text-[12px] text-foreground/60"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Navigation2 size={14} /> 네이버 지도
                                    </a>
                                    <a 
                                        href={`https://map.kakao.com/link/search/${encodeURIComponent(card.place_name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-3 bg-foreground/5 rounded-xl font-black text-[12px] text-foreground/60"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Navigation2 size={14} /> 카카오 맵
                                    </a>
                                </div>
                                {!card.isOfficial && (
                                    <div className="flex flex-col space-y-2">
                                        {/* 신뢰도 인증 버튼 (나도 여기에요) */}
                                        <button
                                            onClick={(e) => handleVerify(e, card.id)}
                                            disabled={verifiedIds.has(card.id)}
                                            className={`w-full py-4 rounded-2xl font-black text-[14px] flex items-center justify-center gap-2 transition-all shadow-xl ${
                                                verifiedIds.has(card.id)
                                                ? "bg-blue-500 text-white shadow-blue-500/20"
                                                : "bg-nav-bg border border-border text-foreground hover:scale-[1.02] active:scale-95"
                                            }`}
                                        >
                                            {verifiedIds.has(card.id) ? (
                                                <>
                                                    <Check size={18} />
                                                    인증 완료! (신뢰도 기여됨)
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck size={18} className="text-blue-500" />
                                                    나도 여기에요 (정보 인증)
                                                </>
                                            )}
                                        </button>
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onOpenCreate("request"); }} 
                                                className="flex-1 py-3.5 bg-foreground/5 text-foreground/60 rounded-2xl font-black text-[13px]"
                                            >
                                                정보 업데이트
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onOpenCreate("share"); }} 
                                                className="flex-1 py-3.5 bg-secondary text-white rounded-2xl font-black text-[13px] shadow-lg shadow-secondary/20"
                                            >
                                                여기에 제보
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                    );
                }) : (
                    <div className="py-20 flex flex-col items-center justify-center text-foreground/10 text-center">
                        <MapPin size={48} className="mb-4 opacity-5" />
                        <p className="font-black text-lg">주변에 등록된 소식이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function getStatusTheme(card: any) {
    if (card.isOfficial) {
        return {
            text: "text-secondary",
            bg: "bg-secondary/10",
            dot: "bg-secondary",
            label: "공식 소식"
        };
    }

    if (card.is_request) {
        return {
            text: "text-orange-600",
            bg: "bg-orange-50",
            dot: "bg-orange-500",
            label: "답변 요청"
        };
    }

    if (card.status === "여유" || card.status === "한산") {
        return {
            text: "text-green-600",
            bg: "bg-green-50",
            dot: "bg-green-500",
            label: `${card.status} 상황`
        };
    }

    if (card.status === "보통") {
        return {
            text: "text-yellow-700",
            bg: "bg-yellow-50",
            dot: "bg-yellow-500",
            label: "보통 상황"
        };
    }

    return {
        text: "text-red-600",
        bg: "bg-red-50",
        dot: "bg-red-500",
        label: `${card.status} 상황`
    };
}
