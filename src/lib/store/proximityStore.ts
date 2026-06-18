import { create } from 'zustand';

export interface ProximityEvent {
    id: string;
    title: string;
    latitude: number;
    longitude: number;
    distance: number;
    type: 'live' | 'official';
    message?: string;
    category?: string;
    statusColor?: string;
}

interface ProximityState {
    isTracking: boolean; // 실시간 레이더 활성화 여부
    isAutoCenter: boolean; // 실시간 중심 이동 자동 추적 여부
    notifiedIds: string[]; // 이미 알림을 준 이벤트 ID 목록
    currentAlert: ProximityEvent | null; // 현재 팝업 알림 (토스트용)
    enableSound: boolean; // 알림음 설정
    enableVibration: boolean; // 진동 설정
    enableWebNotification: boolean; // 시스템 푸시 알림 설정
    radarRadius: number; // 탐지 반경 (m)
    
    setTracking: (tracking: boolean) => void;
    setAutoCenter: (autoCenter: boolean) => void;
    clearCurrentAlert: () => void;
    addNotifiedId: (id: string) => void;
    removeNotifiedId: (id: string) => void;
    clearNotifiedIds: () => void;
    toggleSound: () => void;
    toggleVibration: () => void;
    toggleWebNotification: () => void;
    setRadarRadius: (radius: number) => void;
    triggerAlert: (event: ProximityEvent) => void;
}

export const useProximityStore = create<ProximityState>((set) => ({
    isTracking: false,
    isAutoCenter: true,
    notifiedIds: [],
    currentAlert: null,
    enableSound: true,
    enableVibration: true,
    enableWebNotification: false,
    radarRadius: 150, // 기본 150m 반경

    setTracking: (tracking) => set({ isTracking: tracking }),
    setAutoCenter: (autoCenter) => set({ isAutoCenter: autoCenter }),
    clearCurrentAlert: () => set({ currentAlert: null }),
    addNotifiedId: (id) => set((state) => ({ 
        notifiedIds: state.notifiedIds.includes(id) ? state.notifiedIds : [...state.notifiedIds, id] 
    })),
    removeNotifiedId: (id) => set((state) => ({ 
        notifiedIds: state.notifiedIds.filter(x => x !== id) 
    })),
    clearNotifiedIds: () => set({ notifiedIds: [] }),
    toggleSound: () => set((state) => ({ enableSound: !state.enableSound })),
    toggleVibration: () => set((state) => ({ enableVibration: !state.enableVibration })),
    toggleWebNotification: () => set((state) => ({ enableWebNotification: !state.enableWebNotification })),
    setRadarRadius: (radius) => set({ radarRadius: radius }),
    triggerAlert: (event) => set({ currentAlert: event }),
}));
