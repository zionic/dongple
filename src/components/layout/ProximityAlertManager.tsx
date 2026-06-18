"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationStore } from '@/lib/store/locationStore';
import { useProximityStore, ProximityEvent } from '@/lib/store/proximityStore';
import { fetchLiveStatus } from '@/services/statusService';
import { fetchOfficialEvents } from '@/services/eventService';
import { getDistance } from '@/services/api';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ShieldAlert, Sparkles, X } from 'lucide-react';

// Web Audio API를 이용한 경쾌한 알림음 (딩동) 생성기
function playDingtone() {
    if (typeof window === 'undefined') return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const playTone = (freq: number, startTime: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        const now = ctx.currentTime;
        // 딩동~ 2화음 (E5 -> A5)
        playTone(659.25, now, 0.25);      // 미 (E5)
        playTone(880.00, now + 0.12, 0.4); // 라 (A5)
    } catch (err) {
        console.error("Audio playback error:", err);
    }
}

// navigator.vibrate를 활용한 햅틱 피드백
function triggerHapticFeedback() {
    if (typeof window !== 'undefined' && navigator.vibrate) {
        // 짧게 두 번 징~ 징~
        navigator.vibrate([120, 80, 150]);
    }
}

// 브라우저 네이티브 푸시 알림 전송
function showSystemNotification(title: string, body: string) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification(title, {
                body,
                icon: '/icon.png'
            });
        } catch (e) {
            console.error("System notification failed:", e);
        }
    }
}

export default function ProximityAlertManager() {
    const router = useRouter();
    const { 
        realLatitude, 
        realLongitude, 
        startWatchingLocation, 
        stopWatchingLocation 
    } = useLocationStore();
    
    const {
        isTracking,
        notifiedIds,
        currentAlert,
        enableSound,
        enableVibration,
        enableWebNotification,
        radarRadius,
        addNotifiedId,
        removeNotifiedId,
        triggerAlert,
        clearCurrentAlert
    } = useProximityStore();

    const [cachedEvents, setCachedEvents] = useState<{ id: string; title: string; lat: number; lng: number; type: 'live' | 'official'; data: any }[]>([]);
    const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

    // 1. 실시간 위치 추적 온/오프 감시
    useEffect(() => {
        if (isTracking) {
            startWatchingLocation();
            // 최초 권한 요청
            if (enableWebNotification && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        } else {
            stopWatchingLocation();
        }
        return () => stopWatchingLocation();
    }, [isTracking, startWatchingLocation, stopWatchingLocation, enableWebNotification]);

    // 2. 주변 이벤트 데이터 폴링 (15초 간격)
    useEffect(() => {
        let timer: NodeJS.Timeout;

        const loadAndCacheData = async () => {
            if (!isTracking) return;
            try {
                const [liveData, officialData] = await Promise.all([
                    fetchLiveStatus(),
                    fetchOfficialEvents()
                ]);

                const formattedLive = (liveData || []).map((m: any) => ({
                    id: m.id,
                    title: m.place_name,
                    lat: m.latitude || 37.3015,
                    lng: m.longitude || 126.9930,
                    type: 'live' as const,
                    data: m
                }));

                const formattedOfficial = (officialData || []).map((e: any) => ({
                    id: String(e.id),
                    title: e.title,
                    lat: e.lat,
                    lng: e.lng,
                    type: 'official' as const,
                    data: e
                }));

                setCachedEvents([...formattedLive, ...formattedOfficial]);
            } catch (err) {
                console.error("Proximity data polling failed:", err);
            }
        };

        if (isTracking) {
            loadAndCacheData();
            timer = setInterval(loadAndCacheData, 15000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isTracking]);

    // 3. 내 좌표 실시간 갱신 시 근접 연산
    useEffect(() => {
        if (!isTracking || realLatitude === null || realLongitude === null || cachedEvents.length === 0) return;

        cachedEvents.forEach(item => {
            const distance = getDistance(realLatitude, realLongitude, item.lat, item.lng);

            // 알림 범위 진입 시 트리거
            if (distance <= radarRadius) {
                if (!notifiedIds.includes(item.id)) {
                    // 알림 활성화
                    const eventData: ProximityEvent = {
                        id: item.id,
                        title: item.title,
                        latitude: item.lat,
                        longitude: item.lng,
                        distance: Math.round(distance),
                        type: item.type,
                        message: item.type === 'live' ? item.data.message : item.data.description,
                        category: item.type === 'live' ? item.data.category : item.data.category_code,
                        statusColor: item.type === 'live' ? item.data.status_color : undefined
                    };

                    triggerAlert(eventData);
                    addNotifiedId(item.id);

                    // 다차원 피드백 발송
                    if (enableSound) playDingtone();
                    if (enableVibration) triggerHapticFeedback();
                    if (enableWebNotification) {
                        const pushTitle = item.type === 'live' ? `🚨 주변 실시간 소식` : `🎉 주변 공식 이벤트`;
                        const pushBody = `[${item.title}] 약 ${Math.round(distance)}m 거리 내에 접근했습니다!`;
                        showSystemNotification(pushTitle, pushBody);
                    }
                }
            } 
            // 안전거리 밖으로 이탈 시 알림 해제 (다시 진입 시 울리도록)
            else if (distance > radarRadius * 1.5) {
                if (notifiedIds.includes(item.id)) {
                    removeNotifiedId(item.id);
                }
            }
        });
    }, [realLatitude, realLongitude, cachedEvents, radarRadius, notifiedIds, isTracking, addNotifiedId, removeNotifiedId, triggerAlert, enableSound, enableVibration, enableWebNotification]);

    // 4. 자동 만료 타이머 설정 (토스트 4초 후 자동 닫힘)
    useEffect(() => {
        if (currentAlert) {
            if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
            autoDismissTimer.current = setTimeout(() => {
                clearCurrentAlert();
            }, 4500);
        }
        return () => {
            if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
        };
    }, [currentAlert, clearCurrentAlert]);

    // 토스트 팝업 내 카드 클릭 시 맵으로 이동하고 상세 바텀시트 펼침
    const handleAlertClick = () => {
        if (!currentAlert) return;
        router.push(`/map?place_id=${currentAlert.id}`);
        clearCurrentAlert();
    };

    return (
        <AnimatePresence>
            {currentAlert && (
                <motion.div
                    initial={{ opacity: 0, y: -80, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                    style={{ zIndex: 9999 }}
                    className="fixed top-[88px] left-1/2 -translate-x-1/2 w-[92%] max-w-sm"
                >
                    <div 
                        className="p-4 rounded-2xl bg-white/70 border border-white/40 shadow-[0_12px_40px_rgba(31,38,135,0.18)] backdrop-blur-2xl flex items-start space-x-3 pointer-events-auto hover:bg-white/80 active:scale-[0.99] transition-all cursor-pointer overflow-hidden relative"
                        onClick={handleAlertClick}
                    >
                        {/* 그라데이션 장식 배경 효과 */}
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${
                            currentAlert.type === 'live' ? 'bg-gradient-to-b from-rose-500 to-orange-400' : 'bg-gradient-to-b from-blue-500 to-indigo-500'
                        }`} />

                        {/* 아이콘 컨테이너 */}
                        <div className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
                            currentAlert.type === 'live' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                            {currentAlert.type === 'live' ? <ShieldAlert size={20} className="animate-pulse" /> : <Sparkles size={20} className="animate-bounce" />}
                        </div>

                        {/* 텍스트 정보 */}
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-1.5">
                                <span className="text-[11px] font-black uppercase tracking-wider text-secondary">
                                    {currentAlert.type === 'live' ? '실시간 동네글' : '주변 축제/행사'}
                                </span>
                                <span className={`w-1 h-1 rounded-full ${currentAlert.type === 'live' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                                <span className="text-[11px] font-bold text-blue-600/90 dark:text-blue-500">
                                    {currentAlert.distance}m 앞
                                </span>
                            </div>
                            <h4 className="text-[14px] font-extrabold text-foreground truncate mt-0.5">
                                {currentAlert.title}
                            </h4>
                            <p className="text-[12px] text-muted-foreground truncate leading-relaxed mt-0.5">
                                {currentAlert.message || "자세한 내용을 지도에서 확인해보세요!"}
                            </p>
                        </div>

                        {/* 닫기 버튼 */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearCurrentAlert();
                            }}
                            className="p-1 rounded-full text-secondary/60 hover:bg-black/5 hover:text-secondary shrink-0 transition-colors"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
