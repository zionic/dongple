"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, HelpCircle, Plus, Navigation2, ShieldCheck, Check } from "lucide-react";
import { LiveStatus, verifyStatusWithTrust } from "@/services/statusService";
import { useLocationStore } from "@/lib/store/locationStore";
import { getDistance, formatDistance } from "@/services/api";
import { TrustBadge } from "@/lib/trust-utils";
import { getPersistentUserId } from "@/lib/auth-utils";

interface MapBottomSheetProps {
    sheetHeight: number;
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    markers: LiveStatus[];
    officialEvents?: any[];
    expandedCardId: string | null;
    onCardClick: (id: string, lat: number, lng: number) => void;
    onOpenCreate: (mode: string) => void;
}

export default function MapBottomSheet({
    sheetHeight,
    onPointerDown,
    onPointerMove,
    onPointerUp,
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

    return (
        <div 
            className={`absolute bottom-0 left-0 w-full z-[60] bg-nav-bg backdrop-blur-3xl rounded-t-[44px] shadow-2xl border-t border-border flex flex-col transition-all duration-700`} 
            style={{ height: `${sheetHeight}vh` }}
        >
            <div 
                className="w-full pt-5 pb-3 cursor-ns-resize flex flex-col items-center shrink-0 touch-none" 
                onPointerDown={onPointerDown} 
                onPointerMove={onPointerMove} 
                onPointerUp={onPointerUp}
            >
                <div className="w-12 h-1.5 bg-foreground/10 rounded-full mb-4" />
                <div className="w-full px-8 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black text-secondary tracking-widest uppercase mb-1">DONGPLE LIVE</span>
                        <h3 className="font-black text-foreground text-2xl tracking-tighter">
                            주변의 순간들 <span className="text-secondary opacity-30 ml-1">{allItems.length}</span>
                        </h3>
                    </div>
                    <div className="flex space-x-2">
                         <button onClick={() => onOpenCreate("request")} className="p-3 bg-foreground/5 rounded-2xl text-foreground/40 hover:text-foreground transition-all">
                             <HelpCircle size={22} />
                         </button>
                         <button onClick={() => onOpenCreate("share")} className="p-3 bg-secondary text-white rounded-2xl shadow-lg shadow-secondary/30 transition-all">
                             <Plus size={22} />
                         </button>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1 pb-32 no-scrollbar">
                {allItems.length > 0 ? allItems.map(card => (
                    <motion.div 
                        key={`${card.isOfficial ? 'off' : 'live'}-${card.id}`} 
                        id={`card-${card.id}`} 
                        onClick={() => onCardClick(card.id, card.latitude || card.lat || 37.3015, card.longitude || card.lng || 126.9930)} 
                        className={`p-6 rounded-[32px] border border-border bg-card-bg/50 transition-all duration-500 ${expandedCardId === card.id ? 'ring-4 ring-secondary/5 bg-card-bg border-secondary/20 shadow-2xl' : ''}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${card.isOfficial ? 'text-secondary' : 'text-foreground/40'}`}>
                                        {card.isOfficial ? "OFFICIAL" : card.category}
                                    </span>
                                    {card.message && <span className="text-[10px] font-black text-secondary uppercase animate-pulse">상세있음</span>}
                                    
                                    {/* 고도화: 편한 접근/반려동물 동반 태그 */}
                                    {card.meta?.barrierFree && (
                                        <span className="bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full text-[9px] font-black">♿ 편한 접근</span>
                                    )}
                                    {card.meta?.petFriendly && (
                                        <span className="bg-green-50 text-green-500 px-2 py-0.5 rounded-full text-[9px] font-black">🐶 반려동물 동반</span>
                                    )}

                                    {/* 신뢰도 뱃지 추가 */}
                                    <TrustBadge score={card.score || 0.5} isOfficial={card.isOfficial} />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-black text-foreground text-[18px] leading-tight-none">{card.place_name}</h4>
                                    <span className="text-[11px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-lg shrink-0">
                                        {card.distanceStr}
                                    </span>
                                </div>
                                <div className={`text-[13px] font-black flex items-center ${card.isOfficial ? 'text-secondary' : card.is_request ? 'text-orange-600' : card.status === '여유' ? 'text-green-600' : card.status === '보통' ? 'text-blue-600' : 'text-red-600'}`}>
                                    <div className={`w-2 h-2 rounded-full mr-1.5 ${card.is_request ? 'bg-orange-500' : card.status === '여유' ? 'bg-green-500' : card.status === '보통' ? 'bg-blue-500' : 'bg-red-500'} ${expandedCardId === card.id ? 'animate-ping' : ''}`} />
                                    {card.isOfficial ? '공식 소식' : card.is_request ? '답변 요청' : `${card.status} 상황`}
                                </div>
                            </div>
                            <div className="w-14 h-14 bg-foreground/5 rounded-3xl flex items-center justify-center text-foreground/30 overflow-hidden shrink-0">
                                {card.thumbnail_url ? (
                                    <img src={card.thumbnail_url} alt="" className="w-full h-full object-cover opacity-80" />
                                ) : (
                                    <MapPin size={24} />
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
                )) : (
                    <div className="py-20 flex flex-col items-center justify-center text-foreground/10 text-center">
                        <MapPin size={48} className="mb-4 opacity-5" />
                        <p className="font-black text-lg">주변에 등록된 소식이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
