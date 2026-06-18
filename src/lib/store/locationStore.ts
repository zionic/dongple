import { create } from 'zustand';
import { getAddressFromCoords, AddressResult } from '@/services/api';

interface LocationState {
    latitude: number;
    longitude: number;
    realLatitude: number | null;
    realLongitude: number | null;
    watchId: number | null;
    address: string;
    regionName: string;
    isLoading: boolean;
    error: string | null;
    setLocation: (lat: number, lng: number, address: string, regionName: string) => void;
    setRealLocation: (lat: number, lng: number) => void;
    fetchLocation: () => Promise<void>;
    startWatchingLocation: () => void;
    stopWatchingLocation: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
    // 기본값: 수원 정자동 부근
    latitude: 37.2995,
    longitude: 126.9912,
    realLatitude: null,
    realLongitude: null,
    watchId: null,
    address: "경기도 수원시 장안구 정자동",
    regionName: "수원시 정자동",
    isLoading: false,
    error: null,

    setLocation: (lat, lng, address, regionName) => set({ 
        latitude: lat, 
        longitude: lng, 
        address, 
        regionName 
    }),

    setRealLocation: (lat, lng) => set({
        realLatitude: lat,
        realLongitude: lng
    }),

    fetchLocation: async () => {
        set({ isLoading: true, error: null });
        
        if (typeof window === 'undefined' || !navigator.geolocation) {
            set({ error: "Geolocation is not supported", isLoading: false });
            return;
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const result: AddressResult = await getAddressFromCoords(latitude, longitude);
                        set({ 
                            latitude, 
                            longitude, 
                            realLatitude: latitude,
                            realLongitude: longitude,
                            address: result.fullAddress,
                            regionName: result.regionName,
                            isLoading: false 
                        });
                        resolve();
                    } catch (err) {
                        set({ error: "Failed to fetch address", isLoading: false });
                        resolve();
                    }
                },
                (err) => {
                    let errorMsg = "위치 정보를 가져올 수 없습니다.";
                    if (err.code === 1) errorMsg = "위치 권한이 거부되었습니다.";
                    else if (err.code === 2) errorMsg = "위치를 찾을 수 없습니다.";
                    else if (err.code === 3) errorMsg = "요청 시간이 초과되었습니다.";
                    
                    set({ error: errorMsg, isLoading: false });
                    resolve();
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    },

    startWatchingLocation: () => {
        const { watchId } = get();
        if (watchId !== null) return;

        if (typeof window === 'undefined' || !navigator.geolocation) return;

        const id = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                set({
                    realLatitude: latitude,
                    realLongitude: longitude
                });
            },
            (err) => {
                console.error("실시간 위치 추적 오류:", err);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        set({ watchId: id });
    },

    stopWatchingLocation: () => {
        const { watchId } = get();
        if (watchId === null) return;

        navigator.geolocation.clearWatch(watchId);
        set({ watchId: null });
    }
}));
