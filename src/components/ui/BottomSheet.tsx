"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/store/uiStore";
import { X, CheckCircle2 } from "lucide-react";

export default function BottomSheet() {
  const { isBottomSheetOpen, bottomSheetContent, bottomSheetData, closeBottomSheet } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isBottomSheetOpen && (
        <>
          {/* Dimmed Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBottomSheet}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity cursor-pointer"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Bottom Sheet wrapper for fixed positioning to prevent document scroll issues */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
            {/* The Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full flex justify-center pointer-events-auto"
            >
              <div
                className={`w-full flex flex-col bg-white rounded-t-3xl shadow-xl pb-[env(safe-area-inset-bottom)] relative ${
                  bottomSheetContent === "postDetail" ? "h-[90vh]" : "max-h-[90vh]"
                }`}
                style={{
                  touchAction: "none" // Prevent default touch action for better dragging
                }}
              >
                {/* Visual drag handle area */}
                <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing w-full rounded-t-3xl bg-white sticky top-0 z-10">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-[30px] bg-white z-10 shrink-0">
                  <h3 className="text-lg font-bold text-[#3E2723]">
                    {bottomSheetContent === "write" ? "동네 소식 글쓰기" : 
                     bottomSheetContent === "postDetail" ? "동네 소식" : 
                     bottomSheetContent === "liveCreate" ? (bottomSheetData?.mode === "request" ? "상황 요청하기" : "상황 공유하기") :
                     bottomSheetContent === "liveReply" ? (bottomSheetData?.mode === "reply" ? "상황 알려주기" : "다른 상황 제보하기") :
                     bottomSheetContent === "liveDetail" ? bottomSheetData?.detailItem?.place_name :
                     "바텀 시트"}
                  </h3>
                  <button onClick={closeBottomSheet} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Dynamic Content */}
                <div className="overflow-y-auto p-4 flex-1 overscroll-contain pb-8 min-h-0">
                  {bottomSheetContent === "write" && <WriteForm />}
                  {bottomSheetContent === "postDetail" && <PostDetailView />}
                  {bottomSheetContent === "liveCreate" && <LiveCreateForm />}
                  {bottomSheetContent === "liveReply" && <LiveReplyForm />}
                  {bottomSheetContent === "liveDetail" && <LiveDetailView />}
                </div>

                {/* Sticky Bottom Actions */}
                {bottomSheetContent === "postDetail" && (
                  <div className="border-t border-gray-100 p-3 px-4 flex space-x-2 bg-white pb-6 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                      <input type="text" placeholder="따뜻한 댓글을 남겨주세요." className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-[13px] outline-none" />
                      <button className="bg-[#2E7D32] text-white px-5 py-2.5 rounded-full text-[13px] font-bold">등록</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function WriteForm() {
    return (
        <div className="space-y-4">
            <p className="text-sm font-medium text-gray-500 mb-2">어떤 소식을 이웃과 나누고 싶으신가요?</p>
            <div className="flex space-x-2 pb-2">
                <button className="px-3.5 py-1.5 text-[11px] font-bold border border-[#2E7D32] text-[#2E7D32] bg-green-50 rounded-xl">동네질문</button>
                <button className="px-3.5 py-1.5 text-[11px] font-bold border border-gray-200 text-gray-500 bg-white rounded-xl">동네가게</button>
                <button className="px-3.5 py-1.5 text-[11px] font-bold border border-gray-200 text-gray-500 bg-white rounded-xl">같이해요</button>
            </div>
            <div className="pt-2">
                <input
                    type="text"
                    placeholder="제목 (선택사항)"
                    className="w-full text-[15px] font-bold py-3 border-b border-gray-100 outline-none placeholder:text-gray-300 text-[#3E2723]"
                />
            </div>
            <div>
                <textarea
                    placeholder="정자동 이웃들과 나눌 소식을 편하게 적어보세요."
                    className="w-full text-sm py-4 min-h-[160px] resize-none outline-none placeholder:text-gray-400 leading-relaxed text-gray-800"
                />
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-5 mt-2">
                <button className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 text-[11px] font-bold rounded-xl space-x-1 flex items-center hover:bg-gray-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <span>사진 추가</span>
                </button>
                <button 
                  className="px-6 py-2.5 text-sm font-bold text-white bg-[#2E7D32] rounded-xl hover:bg-[#1B5E20] transition-colors shadow-sm"
                  onClick={() => alert("글 등록 완료!")}
                >
                    동플에 등록
                </button>
            </div>
        </div>
    )
}

function PostDetailView() {
    const { bottomSheetData } = useUIStore();
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="bg-gray-100 px-2.5 py-1 rounded-md text-[11px] font-bold text-gray-600">동네질문</span>
                <span className="text-xs text-gray-400">조금 전</span>
            </div>
            <h2 className="text-[17px] font-black text-[#3E2723] leading-snug break-words">
                {bottomSheetData?.title || "게시물이 없습니다."}
            </h2>
            <div className="flex items-center space-x-2 mt-4 text-[13px] font-medium text-gray-700">
                <div className="w-8 h-8 bg-green-100 rounded-full shrink-0 flex items-center justify-center">
                    <span className="text-green-800 font-bold text-xs">정</span>
                </div>
                <div>정다운 이웃</div>
            </div>
            <div className="pt-2 pb-6 text-[#3E2723] leading-relaxed text-[14px] border-b border-gray-100 min-h-[150px] whitespace-pre-wrap">
                정자동 쪽에 집중이 잘되는 조용한 독서실이 있을까요?
                
                이번 주말에 시험이 있어서 빡세게 공부하려고 합니다.
                추천해주시면 감사하겠습니다!
            </div>
            
            {/* 덧글 영역 */}
            <div className="pt-2 pb-8">
                <h3 className="font-bold text-[#3E2723] mb-4 text-sm">댓글 12</h3>
                <div className="space-y-5">
                    <div className="flex space-x-3 items-start">
                        <div className="w-8 h-8 bg-blue-100 rounded-full shrink-0 flex items-center justify-center">
                            <span className="text-blue-800 font-bold text-xs">라이</span>
                        </div>
                        <div className="bg-gray-50 rounded-2xl rounded-tl-none p-3.5 flex-1">
                            <div className="text-[12px] font-bold text-gray-800 mb-1">라이프스포츠주민</div>
                            <div className="text-[13px] text-gray-700">라이프스포츠 근처 스터디카페 조용하고 좋아요! 시설도 엄청 깔끔합니다.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function LiveCreateForm() {
    const { bottomSheetData, closeBottomSheet } = useUIStore();
    const mode = bottomSheetData?.mode || "share";
    
    const [newPlaceName, setNewPlaceName] = useState("");
    const [newCategory, setNewCategory] = useState("기타");
    const [selectedStatus, setSelectedStatus] = useState("보통");
    const [replyText, setReplyText] = useState("");

    const statusOptions = [
        { label: "여유", color: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200", badgeColor: "text-green-500" },
        { label: "보통", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200", badgeColor: "text-yellow-500" },
        { label: "혼잡", color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200", badgeColor: "text-red-500" }
    ];

    const handleSubmit = () => {
        if (!newPlaceName.trim()) {
            alert("장소 이름을 입력해주세요.");
            return;
        }
        if (bottomSheetData?.onSubmit) {
            bottomSheetData.onSubmit({
                newPlaceName,
                newCategory,
                selectedStatus,
                replyText
            });
        }
        closeBottomSheet();
    };

    return (
        <div className="space-y-5">
            <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">장소 이름 (필수)</label>
                <input
                    type="text"
                    placeholder="어느 장소인가요? (예: 정자시장 앞)"
                    value={newPlaceName}
                    onChange={(e) => setNewPlaceName(e.target.value)}
                    className={`w-full text-[14px] p-3.5 border border-gray-200 rounded-xl focus:ring-2 outline-none transition-colors ${mode === 'request' ? 'focus:ring-[#5D4037]/20 focus:border-[#5D4037]' : 'focus:ring-[#2E7D32]/20 focus:border-[#2E7D32]'}`}
                />
            </div>
            <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">장소 카테고리</label>
                <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={`w-full text-[14px] p-3.5 border border-gray-200 rounded-xl focus:ring-2 outline-none bg-white transition-colors ${mode === 'request' ? 'focus:ring-[#5D4037]/20 focus:border-[#5D4037]' : 'focus:ring-[#2E7D32]/20 focus:border-[#2E7D32]'}`}
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
            {mode === "share" && (
                <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-2">현재 현장 상태 (필수)</label>
                    <div className="flex space-x-2">
                        {statusOptions.map((option) => (
                            <button
                                key={option.label}
                                onClick={() => setSelectedStatus(option.label)}
                                className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl border transition-all ${selectedStatus === option.label
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
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
                    {mode === "request" ? "추가 질문 코멘트 (선택)" : "상세 공유 코멘트 (선택)"}
                </label>
                <textarea
                    className={`w-full text-[14px] p-3.5 border border-gray-200 rounded-xl focus:ring-2 outline-none min-h-[100px] resize-none transition-colors ${mode === 'request' ? 'focus:ring-[#5D4037]/20 focus:border-[#5D4037]' : 'focus:ring-[#2E7D32]/20 focus:border-[#2E7D32]'}`}
                    placeholder={mode === "request" ? "궁금한 내용을 자유롭게 적어보세요." : "이웃들에게 도움이 될 만한 상세 상황을 적어보세요."}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                />
            </div>
            <button
                onClick={handleSubmit}
                className={`w-full py-4 text-white text-[15px] font-bold rounded-xl transition-colors mt-2 shadow-md ${mode === 'request' ? 'bg-[#5D4037] hover:bg-[#4E342E]' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'}`}
            >
                {mode === "request" ? "이웃에게 질문 등록하기" : "이웃에게 상황 공유하기"}
            </button>
        </div>
    );
}

function LiveReplyForm() {
    const { bottomSheetData, closeBottomSheet } = useUIStore();
    const mode = bottomSheetData?.mode || "reply";
    const [selectedStatus, setSelectedStatus] = useState(bottomSheetData?.defaultStatus || "보통");
    const [replyText, setReplyText] = useState("");

    const statusOptions = [
        { label: "여유", color: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" },
        { label: "보통", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200" },
        { label: "혼잡", color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200" }
    ];

    const handleSubmit = () => {
        if (mode === "reply" && !replyText.trim()) return;
        if (bottomSheetData?.onSubmit) {
            bottomSheetData.onSubmit({
                selectedStatus,
                replyText
            });
        }
        closeBottomSheet();
    };

    return (
        <div className="space-y-4">
            <p className="text-[13px] text-gray-500 mb-2 font-medium">
                {mode === "reply" ? "이웃들에게 현재 상황을 정확하게 알려주세요." : "이전 사용자의 정보와 다르다면 알맞은 상태를 선택해주세요."}
            </p>
            <div className="flex gap-2">
                {statusOptions.map((opt) => (
                    <button
                        key={opt.label}
                        onClick={() => setSelectedStatus(opt.label)}
                        className={`flex-1 py-2.5 text-[14px] font-bold border rounded-xl transition-all ${
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
                className="w-full min-h-[120px] p-3.5 text-[14px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/50 resize-none placeholder-gray-400 mt-2"
                placeholder={mode === "reply" ? "예: 지금 대기인원 10명 정도 있어요." : "어떤 점이 달라졌는지 이웃들에게 남겨주세요 (선택)"}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
            />
            <button 
                onClick={handleSubmit}
                disabled={mode === "reply" && !replyText.trim()}
                className="w-full py-4 text-[15px] font-bold text-white bg-[#2E7D32] rounded-xl hover:bg-[#1B5E20] disabled:bg-gray-300 transition-colors mt-2 shadow-md"
            >
                이웃에게 공유하기
            </button>
        </div>
    );
}

function LiveDetailView() {
    const { bottomSheetData } = useUIStore();
    const detailItem = bottomSheetData?.detailItem;

    if (!detailItem) return null;

    return (
        <div className="space-y-4 pt-1">
            <div className="flex items-center space-x-2 mb-6">
                <span className={`text-[18px] font-extrabold ${detailItem.status_color || 'text-gray-700'}`}>
                    {detailItem.is_request ? "답변 대기 중" : detailItem.status}
                </span>
                {!detailItem.is_request && (
                    <div className="flex items-center text-[12px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                        <CheckCircle2 size={14} className="text-[#2E7D32] mr-1" />
                        {detailItem.verified_count}명 동의
                    </div>
                )}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-[14px] border border-gray-100 min-h-[120px] pb-6">
                {detailItem.history && detailItem.history.length > 0 ? (
                    <div className="space-y-5">
                        {detailItem.history.map((hist: any, idx: number, arr: any[]) => (
                            <div key={idx} className="flex flex-col space-y-1.5 relative">
                                {idx !== arr.length - 1 && (
                                    <div className="absolute left-1.5 top-5 bottom-[-20px] w-0.5 bg-gray-200"></div>
                                )}
                                <div className="flex items-center space-x-2.5 text-[11px] z-10 w-full pt-1">
                                    <div className={`w-3.5 h-3.5 rounded-full ${hist.status_color.replace('text-', 'bg-')} bg-opacity-70 border-2 border-white shadow-sm shrink-0`} />
                                    <span className={`font-bold ${hist.status_color}`}>[{hist.status}]</span>
                                    <span className="text-gray-400 font-medium tracking-tight">{hist.time}</span>
                                </div>
                                <div className="pl-6 text-[14px] text-gray-800 font-medium break-words whitespace-pre-wrap leading-relaxed">
                                    {hist.text}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-400 italic text-center text-[13px] flex h-full items-center justify-center py-6">
                        이웃이 남긴 상태 코멘트 히스토리가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
