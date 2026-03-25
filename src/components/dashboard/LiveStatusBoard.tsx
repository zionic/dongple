"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, Plus, HelpCircle, AlertCircle, X } from "lucide-react";
import Link from "next/link";

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

    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [detailModalId, setDetailModalId] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<"reply" | "disagree">("reply");
    const [replyText, setReplyText] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("보통");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createMode, setCreateMode] = useState<"request" | "share">("share");
    const [newPlaceName, setNewPlaceName] = useState("");
    const [newCategory, setNewCategory] = useState("기타");
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

    const handleDisagreeClick = (id: string) => {
        const item = liveUpdates.find(i => i.id === id);
        setSelectedRequestId(id);
        setModalMode("disagree");
        setSelectedStatus(item?.status === "여유" ? "보통" : "여유"); // 기본값 다르게
    };

    const handleReplyClick = (id: string) => {
        setSelectedRequestId(id);
        setModalMode("reply");
        setSelectedStatus("보통");
    };

    const handleReplySubmit = () => {
        if (modalMode === "reply" && !replyText.trim()) return;
        if (!selectedRequestId) return;

        const option = statusOptions.find(opt => opt.label === selectedStatus);

        setLiveUpdates(prev => prev.map(item => {
            if (item.id === selectedRequestId) {
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
        
        handleCloseModal();
    };

    const handleCreateSubmit = () => {
        if (!newPlaceName.trim()) {
            alert("장소 이름을 입력해주세요.");
            return;
        }
        
        const nowTime = "방금 전";
        const isRequest = createMode === "request";
        
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
        
        // Modal reset
        setIsCreateModalOpen(false);
        setNewPlaceName("");
        setNewCategory("기타");
        setReplyText("");
        setSelectedStatus("보통");
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setSelectedRequestId(null);
        setReplyText("");
        setSelectedStatus("보통");
        setNewPlaceName("");
        setNewCategory("기타");
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
        <section className="space-y-4">
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
                        onClick={() => { setCreateMode("request"); setIsCreateModalOpen(true); }}
                        className="text-[10px] text-[#5D4037] border border-[#D7CCC8] bg-[#EFEBE9] px-2.5 py-1.5 rounded-xl flex items-center space-x-1 font-bold hover:bg-[#D7CCC8]/50 transition-colors shadow-sm"
                    >
                        <HelpCircle size={12} />
                        <span>요청</span>
                    </button>
                    <button 
                        onClick={() => { setCreateMode("share"); setIsCreateModalOpen(true); }}
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
                    onClick={() => setDetailModalId(liveUpdates[currentIndex].id)}
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
                                if (liveUpdates[currentIndex].is_request) {
                                    handleReplyClick(liveUpdates[currentIndex].id);
                                } else {
                                    handleDisagreeClick(liveUpdates[currentIndex].id);
                                }
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

            {/* 답변 모달 */}
            {selectedRequestId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-[#3E2723] text-lg">
                                    {modalMode === "reply" ? "상황 알려주기" : "다른 상황 제보하기"}
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    {modalMode === "reply" ? "이웃들에게 현재 상황을 정확하게 알려주세요." : "이전 사용자의 정보와 다르다면 알맞은 상태를 선택해주세요."}
                                </p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex gap-2">
                                {statusOptions.map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => setSelectedStatus(opt.label)}
                                        className={`flex-1 py-1.5 text-[11px] font-bold border rounded-xl transition-all ${
                                            selectedStatus === opt.label 
                                                ? `${opt.color} ring-2 ring-offset-1` 
                                                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                className="w-full h-24 p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/50 resize-none placeholder-gray-400"
                                placeholder={modalMode === "reply" ? "예: 지금 대기인원 10명 정도 있어요." : "어떤 점이 달라졌는지 이웃들에게 남겨주세요 (선택)"}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                autoFocus={modalMode === "reply"}
                            />
                        </div>
                        <div className="flex bg-gray-50/50 p-4 pt-2 gap-2 border-t border-gray-100">
                            <button 
                                onClick={handleReplySubmit}
                                disabled={modalMode === "reply" && !replyText.trim()}
                                className="w-full py-3 text-sm font-bold text-white bg-[#2E7D32] rounded-xl hover:bg-[#1B5E20] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                이웃에게 공유하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 상세 공유 내용 보기 모달 */}
            {detailModalId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        {(() => {
                            const detailItem = liveUpdates.find(i => i.id === detailModalId);
                            if (!detailItem) return null;
                            return (
                                <>
                                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                                        <div>
                                            <span className="text-[10px] px-2 py-0.5 rounded-lg border font-bold bg-gray-100 text-gray-600 border-gray-200">
                                                {detailItem.category}
                                            </span>
                                            <h3 className="font-bold text-[#3E2723] text-lg mt-1.5">{detailItem.place_name}</h3>
                                        </div>
                                        <button onClick={() => setDetailModalId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center space-x-1.5 mb-4">
                                            <span className={`text-base font-extrabold ${detailItem.status_color || 'text-gray-700'}`}>
                                                {detailItem.is_request ? "답변 대기 중" : detailItem.status}
                                            </span>
                                            {!detailItem.is_request && (
                                                <div className="flex items-center text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                                                    <CheckCircle2 size={14} className="text-[#2E7D32] mr-1" />
                                                    {detailItem.verified_count}명 동의
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 text-sm border border-gray-100 min-h-[80px] max-h-[250px] overflow-y-auto">
                                            {detailItem.history && detailItem.history.length > 0 ? (
                                                <div className="space-y-4">
                                                    {detailItem.history.map((hist, idx, arr) => (
                                                        <div key={idx} className="flex flex-col space-y-1.5 relative">
                                                            {idx !== arr.length - 1 && (
                                                                <div className="absolute left-1.5 top-5 bottom-[-16px] w-0.5 bg-gray-200"></div>
                                                            )}
                                                            <div className="flex items-center space-x-2 text-[10px] z-10 w-full">
                                                                <div className={`w-3.5 h-3.5 rounded-full ${hist.status_color.replace('text-', 'bg-')} bg-opacity-70 border-2 border-white shadow-sm shrink-0`} />
                                                                <span className={`font-bold ${hist.status_color}`}>[{hist.status}]</span>
                                                                <span className="text-gray-400 font-medium tracking-tight">{hist.time}</span>
                                                            </div>
                                                            <div className="pl-6 text-[12px] text-gray-700 font-medium break-words whitespace-pre-wrap leading-relaxed">
                                                                {hist.text}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 italic text-center text-xs mt-3 flex h-full items-center justify-center">이웃이 남긴 상태 코멘트 히스토리가 없습니다.</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 pt-0">
                                        <button 
                                            onClick={() => setDetailModalId(null)}
                                            className="w-full py-3 text-sm font-bold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                                        >
                                            닫기
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
            {/* 새 상황 생성(요청/공유) 모달 */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
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
                                onClick={handleCloseModal}
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
                                    placeholder="어느 장소인가요? (예: 정자시장 앞)"
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
                                    <option value="교통">🚗 교통</option>
                                    <option value="관공서">🏢 관공서</option>
                                    <option value="맛집">🍜 맛집</option>
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
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    {createMode === "request" ? "추가 질문 코멘트 (선택)" : "상세 공유 코멘트 (선택)"}
                                </label>
                                <textarea
                                    className={`w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 outline-none min-h-[80px] resize-none transition-colors ${createMode === 'request' ? 'focus:ring-[#5D4037]/20 focus:border-[#5D4037]' : 'focus:ring-[#2E7D32]/20 focus:border-[#2E7D32]'}`}
                                    placeholder={createMode === "request" ? "궁금한 내용을 자유롭게 적어보세요." : "이웃들에게 도움이 될 만한 상세 상황을 적어보세요."}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleCreateSubmit}
                                className={`w-full mt-2 py-3.5 text-white text-sm font-bold rounded-xl transition-colors shadow-md flex justify-center items-center ${createMode === 'request' ? 'bg-[#5D4037] hover:bg-[#4E342E]' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'}`}
                            >
                                {createMode === "request" ? "이웃에게 질문 등록하기" : "이웃에게 상황 공유하기"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
