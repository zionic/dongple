"use client";

import { ArrowLeft, MapPin, SlidersHorizontal, HelpCircle, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { fetchLiveStatus, postLiveStatus, LiveStatus } from "@/services/statusService";
import { subscribeLiveUpdates } from "@/services/statusService";

declare global {
  interface Window {
    naver: any;
  }
}

export default function MapPage() {
    // 맵 마커 상태 (DB 연동)
    const [markers, setMarkers] = useState<LiveStatus[]>([]);

    const loadData = async () => {
        try {
            const data = await fetchLiveStatus();
            setMarkers(data);
        } catch (error) {
            console.error("지도 데이터 로드 실패:", error);
        }
    };

    useEffect(() => {
        loadData();
        const sub = subscribeLiveUpdates(loadData);
        return () => { sub.unsubscribe(); };
    }, []);

    // 리스트 카드 상태 (마커 데이터와 동일하게 사용)
    const localCards = markers;

    // 모달 관리 상태
    const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createMode, setCreateMode] = useState<"request" | "share">("share");
    const [newPlaceName, setNewPlaceName] = useState("");
    const [newCategory, setNewCategory] = useState("기타");
    const [selectedStatus, setSelectedStatus] = useState<string>("보통");
    const [replyText, setReplyText] = useState("");
    
    // 바텀 시트 드래그 이벤트 상태
    const [sheetHeight, setSheetHeight] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startHeight = useRef(50);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startHeight.current = sheetHeight;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startY.current;
        const deltaVH = (deltaY / window.innerHeight) * 100;
        let newHeight = startHeight.current - deltaVH;
        
        // 최소 15vh, 최대 92vh 바운더리
        if (newHeight < 15) newHeight = 15;
        if (newHeight > 92) newHeight = 92;
        
        setSheetHeight(newHeight);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
        
        // 손을 떼었을 때 가까운 상태로 부드럽게 자석처럼 스냅(Snap)
        if (sheetHeight > 70) {
            setSheetHeight(92); // 전체 펼침
        } else if (sheetHeight > 30) {
            setSheetHeight(50); // 중간 반만 펼침
        } else {
            setSheetHeight(15); // 헤더만 보이게 최소화
        }
    };

    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    useEffect(() => {
        // 네이버 지도가 로드되었는지 체크 및 맵 초기화
        let initTimer: NodeJS.Timeout;
        const initMap = () => {
            if (!window.naver || !window.naver.maps) {
                initTimer = setTimeout(initMap, 200);
                return;
            }

            const mapOptions = {
                center: new window.naver.maps.LatLng(37.3015, 126.9930), // 수원 장안구 인근 메인
                zoom: 15,
                logoControl: false,
                mapDataControl: false,
                scaleControl: false,
                mapTypeControl: false,
            };

            const map = new window.naver.maps.Map('map-container', mapOptions);
            mapRef.current = map;
            renderMarkers(); // 맵 초기화 후 첫 마커 렌더링
        };

        if (typeof window !== 'undefined') {
            initMap();
        }

        return () => {
            clearTimeout(initTimer);
            if (mapRef.current) {
                mapRef.current.destroy();
                mapRef.current = null;
            }
        };
    }, []);

    // expandedCardId나 markers가 바뀔 때 마커 디자인 다시 그리기 (리액트 상태를 일반 DOM에 반영)
    useEffect(() => {
        if (mapRef.current) {
            renderMarkers();
        }
    }, [markers, expandedCardId, sheetHeight]);

    const renderMarkers = () => {
        // 기존 렌더링된 마커 배열 지우기
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        if (!window.naver || !window.naver.maps || !mapRef.current) return;

        markers.forEach(m => {
            const isSelected = expandedCardId === m.id;
            
            // Taildwind 기반 마커 HTML 디자인 
            const markerContent = `
                <div class="flex flex-col items-center transform -translate-x-1/2 -translate-y-full cursor-pointer ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'}" style="width: auto; height: auto;">
                    ${isSelected ? `
                        <div class="absolute -top-7 whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md shadow-lg flex items-center justify-center font-bold">
                            여기 있어요!
                            <div class="absolute -bottom-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                        </div>
                    ` : ''}
                    <div class="px-2.5 py-1 ${isSelected ? 'ring-4 ring-white/50 shadow-xl' : 'shadow-md shadow-black/20'} rounded-full text-white text-[11px] font-bold ${m.color}">
                        ${m.status}
                    </div>
                    <div class="w-2.5 h-2.5 ${m.color} rotate-45 transform -translate-y-1.5 shadow-sm"></div>
                    ${isSelected ? `<div class="absolute bottom-0 w-8 h-3 rounded-full blur-sm opacity-50 animate-pulse ${m.color}" style="transform: translateY(50%)"></div>` : ''}
                </div>
            `;

            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(m.lat, m.lng),
                map: mapRef.current,
                icon: {
                    content: markerContent,
                    size: new window.naver.maps.Size(40, 50),
                    anchor: new window.naver.maps.Point(20, 50),
                }
            });

            // 마커 클릭 이벤트 (리액트 상태 변경 연동)
            window.naver.maps.Event.addListener(marker, 'click', () => {
                const isTogglingOff = expandedCardId === m.id;
                setExpandedCardId(isTogglingOff ? null : m.id);
                if (!isTogglingOff) {
                    if (sheetHeight < 30) setSheetHeight(50);
                    // 중앙으로 지도 이동
                    mapRef.current.panTo(marker.getPosition());
                    setTimeout(() => {
                        const cardEl = document.getElementById('card-' + m.id);
                        if (cardEl) {
                            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 150);
                }
            });

            markersRef.current.push(marker);
        });
    };

    const statusOptions = [
        { label: "여유", color: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200", badgeColor: "text-green-500" },
        { label: "보통", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200", badgeColor: "text-yellow-500" },
        { label: "혼잡", color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200", badgeColor: "text-red-500" }
    ];

    const handleCreateSubmit = async () => {
        if (!newPlaceName.trim()) {
            alert("장소 이름을 입력해주세요.");
            return;
        }

        const isRequest = createMode === "request";
        
        // Default values for request mode
        let newStatus = "답변대기";
        let newBadgeColor = "text-[#5D4037]";
        
        if (!isRequest) {
            const statusOpt = statusOptions.find(opt => opt.label === selectedStatus);
            if (statusOpt) {
                newStatus = statusOpt.label;
                newBadgeColor = statusOpt.badgeColor;
            }
        }

        try {
            await postLiveStatus({
                place_name: newPlaceName,
                category: newCategory,
                status: newStatus,
                status_color: newBadgeColor,
                is_request: isRequest,
                verified_count: 1,
                latitude: mapRef.current ? mapRef.current.getCenter().y : 37.3015,
                longitude: mapRef.current ? mapRef.current.getCenter().x : 126.9930,
            });
            setIsCreateModalOpen(false);
            setNewPlaceName("");
            setNewCategory("기타");
            setReplyText("");
            setSelectedStatus("보통");
        } catch (error) {
            console.error("지도 등록 실패:", error);
        }
    };

    return (
        <div className="relative w-full h-[100dvh] bg-[#E5E3DF] overflow-hidden flex flex-col max-w-md mx-auto shadow-2xl">
            {/* 상단 맵 프로팅 헤더 영역 */}
            <header className="absolute top-0 left-0 w-full z-20 px-4 h-16 flex items-center justify-between bg-white/70 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <Link href="/" className="p-2 -ml-2 text-gray-700 hover:text-[#2E7D32] transition-colors rounded-full hover:bg-gray-100">
                    <ArrowLeft size={24} />
                </Link>
                <div className="font-bold text-lg text-[#3E2723] flex items-center">
                    <MapPin size={18} className="text-[#2E7D32] mr-1.5" />
                    동네 상황 지도
                </div>
                <button className="p-2 -mr-2 text-gray-700 hover:text-[#2E7D32] transition-colors rounded-full hover:bg-gray-100">
                    <SlidersHorizontal size={22} />
                </button>
            </header>

            {/* 네이버 지도 객체가 들어갈 컨테이너 */}
            <div className="relative flex-1 w-full translate-y-12">
                <div id="map-container" className="absolute top-0 bottom-12 left-0 w-full outline-none bg-gray-100" />
            </div>

            {/* 하단 바텀 시트 (리스트 뷰 오버레이) - flex col로 스크롤 영역 분리 */}
            <div 
                className={`absolute bottom-0 left-0 w-full z-30 bg-white rounded-t-[30px] shadow-[0_-15px_50px_rgba(0,0,0,0.1)] pointer-events-auto flex flex-col ${isDragging ? '' : 'transition-all duration-300 ease-out'}`}
                style={{ height: `${sheetHeight}vh` }}
            >
                {/* 바텀 시트 핸들바 (자유 드래그 조절) */}
                <div 
                    className="w-full py-4 cursor-ns-resize flex justify-center shrink-0 items-center hover:bg-gray-50/50 rounded-t-[30px] transition-colors select-none touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full pointer-events-none" />
                </div>
                
                {/* 헤더 및 [요청/공유] 버튼 */}
                <div className="px-5 pb-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[#3E2723] text-lg">주변 현황 <span className="text-[#2E7D32] ml-0.5">{localCards.length}</span>건</h3>
                        <div className="flex space-x-1.5">
                            <button 
                                onClick={() => { setCreateMode("request"); setIsCreateModalOpen(true); }}
                                className="text-[10px] text-[#5D4037] border border-[#D7CCC8] bg-[#EFEBE9] px-2.5 py-1.5 rounded-lg flex items-center space-x-1 font-bold hover:bg-[#D7CCC8]/50 transition-colors shadow-sm"
                            >
                                <HelpCircle size={10} />
                                <span>요청</span>
                            </button>
                            <button 
                                onClick={() => { setCreateMode("share"); setIsCreateModalOpen(true); }}
                                className="text-[10px] text-white bg-[#2E7D32] px-2.5 py-1.5 rounded-lg flex items-center space-x-1 font-bold hover:bg-[#1B5E20] transition-colors shadow-sm"
                            >
                                <Plus size={10} />
                                <span>공유</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 리스트 뷰 영역 (스크롤 가능, 항목 여러 개 추가) */}
                <div className="px-5 py-4 overflow-y-auto space-y-3 flex-1 pb-10">
                    {localCards.map(card => (
                        <div 
                            key={card.id}
                            id={`card-${card.id}`}
                            onClick={() => {
                                const isTogglingOff = expandedCardId === card.id;
                                setExpandedCardId(isTogglingOff ? null : card.id);
                                if (!isTogglingOff) {
                                    setTimeout(() => {
                                        const cardEl = document.getElementById(`card-${card.id}`);
                                        if (cardEl) {
                                            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                    }, 150);
                                }
                            }}
                            className={`p-4 border rounded-2xl flex flex-col shadow-sm cursor-pointer transition-colors ${card.bg_class}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-lg text-gray-600 font-bold shadow-sm">{card.category}</span>
                                    <h4 className="font-bold text-[#3E2723] mt-1.5 text-base">{card.place_name}</h4>
                                        <div className="flex flex-col items-end">
                                            <span className={`${card.status_color} text-xs font-bold mt-1 flex items-center`}>
                                                {card.status === "여유" ? "🟢" : card.status === "보통" ? "🟡" : card.status === "혼잡" ? "🔴" : "🟠"} {card.status}
                                            </span>
                                            <span className="text-gray-400 text-[10px] mt-0.5">
                                                {new Date(card.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border shrink-0 ${card.status_color}`}>
                                        <MapPin className={card.status_color} size={24} />
                                    </div>
                                </div>

                            {/* 아코디언 확장 영역 (이력 정보) */}
                            {expandedCardId === card.id && card.history && (
                                <div className="mt-4 pt-4 border-t border-gray-200/50 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <h5 className="text-[11px] font-bold text-gray-500 mb-3">상황 변동 이력 (최근 기록)</h5>
                                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                        {card.history.map((historyItem, idx) => (
                                            <div key={idx} className="relative flex items-start justify-between">
                                                <div className="flex items-start">
                                                    <div className="flex flex-col items-center mr-3 mt-1 relative z-10">
                                                        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm bg-gray-400 ${historyItem.status === '여유' ? 'bg-green-500' : historyItem.status === '보통' ? 'bg-yellow-500' : historyItem.status === '혼잡' ? 'bg-red-500' : 'bg-[#5D4037]'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-1.5 mb-0.5">
                                                            <span className={`text-[10px] font-bold ${historyItem.status === '여유' ? 'text-green-600' : historyItem.status === '보통' ? 'text-yellow-600' : historyItem.status === '혼잡' ? 'text-red-600' : 'text-[#5D4037]'}`}>
                                                                {historyItem.status}
                                                            </span>
                                                            <span className="text-[9px] text-gray-400">{historyItem.time}</span>
                                                        </div>
                                                        <p className="text-xs text-[#3E2723] leading-relaxed">{historyItem.text}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-5 flex space-x-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setCreateMode("request"); setIsCreateModalOpen(true); }}
                                            className="flex-1 py-2 text-[11px] bg-white border border-[#D7CCC8] rounded-xl font-bold text-[#5D4037] hover:bg-[#EFEBE9] transition flex items-center justify-center"
                                        >
                                            <HelpCircle size={12} className="mr-1" /> 이웃에게 묻기
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setCreateMode("share"); setIsCreateModalOpen(true); }}
                                            className="flex-1 py-2 text-[11px] bg-[#2E7D32] text-white rounded-xl font-bold shadow-sm hover:bg-[#1B5E20] transition flex items-center justify-center"
                                        >
                                            <Plus size={12} className="mr-1" /> 다른 상황 제보
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 새 상황 생성(요청/공유) 모달 - 지도 위에서 팝업 */}
            {isCreateModalOpen && (
                <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 mb-4 sm:mb-0">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-[#3E2723] flex items-center">
                                {createMode === "request" ? (
                                    <><HelpCircle size={18} className="text-[#5D4037] mr-2" /> 동네 상황 요청하기</>
                                ) : (
                                    <><Plus size={18} className="text-[#2E7D32] mr-2" /> 동네 상황 공유하기</>
                                )}
                            </h3>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">장소 이름 (필수)</label>
                                <input
                                    type="text"
                                    placeholder="어느 장소인가요?"
                                    value={newPlaceName}
                                    onChange={(e) => setNewPlaceName(e.target.value)}
                                    className={`w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 outline-none transition-colors ${createMode === 'request' ? 'focus:ring-[#5D4037]/20 focus:border-[#5D4037]' : 'focus:ring-[#2E7D32]/20 focus:border-[#2E7D32]'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">장소 카테고리</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className={`w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 outline-none bg-white transition-colors ${createMode === 'request' ? 'focus:ring-[#5D4037]/20 focus:border-[#5D4037]' : 'focus:ring-[#2E7D32]/20 focus:border-[#2E7D32]'}`}
                                >
                                    <option value="기타">카테고리 선택 (기타)</option>
                                    <option value="공원">🌲 공원</option>
                                    <option value="운동">💪 운동</option>
                                    <option value="마켓">🛒 마켓</option>
                                    <option value="기관">🏢 기관</option>
                                </select>
                            </div>

                            {createMode === "share" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2">현재 현장 상태 (필수)</label>
                                    <div className="flex space-x-2">
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.label}
                                                onClick={() => setSelectedStatus(option.label)}
                                                className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-all ${selectedStatus === option.label
                                                    ? `${option.color} ring-2 ring-offset-1 ${option.label === '여유' ? 'ring-green-300' : option.label === '보통' ? 'ring-yellow-300' : 'ring-red-300'}`
                                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">상세 코멘트 (선택)</label>
                                <textarea
                                    className={`w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 outline-none min-h-[80px] resize-none transition-colors ${createMode === 'request' ? 'focus:ring-[#5D4037]/20 focus:border-[#5D4037]' : 'focus:ring-[#2E7D32]/20 focus:border-[#2E7D32]'}`}
                                    placeholder="상세 내용을 적어주세요."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleCreateSubmit}
                                className={`w-full mt-2 py-3.5 text-white text-sm font-bold rounded-xl transition-colors shadow-md flex justify-center items-center ${createMode === 'request' ? 'bg-[#5D4037] hover:bg-[#4E342E]' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'}`}
                            >
                                {createMode === "request" ? "질문 등록" : "상황 공유"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
