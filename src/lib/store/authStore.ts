import { create } from 'zustand';
import { getPersistentUserId, generatePublicId } from '@/lib/auth-utils';

interface AuthProfile {
    nickname: string;
    region?: string;
    is_verified: boolean;
}

interface AuthState {
    userId: string;
    publicId: string;
    profile: AuthProfile | null;
    isAnonymous: boolean;
    setProfile: (profile: AuthProfile) => void;
    toggleAnonymous: () => void;
    initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    userId: "",
    publicId: "",
    profile: {
        nickname: "동네이웃", // 기본 닉네임
        is_verified: false
    },
    isAnonymous: true, // 기본값은 익명으로 설정 (지침서 권장)

    setProfile: (profile) => set({ profile }),
    
    toggleAnonymous: () => set((state) => ({ isAnonymous: !state.isAnonymous })),

    initAuth: () => {
        const userId = getPersistentUserId();
        const publicId = generatePublicId(userId);
        
        // 로컬 스토리지에서 이전 설정 불러오기
        const savedProfile = localStorage.getItem('dongple_profile');
        const savedAnon = localStorage.getItem('dongple_is_anon');
        
        set({ 
            userId, 
            publicId,
            profile: savedProfile ? JSON.parse(savedProfile) : get().profile,
            isAnonymous: savedAnon ? JSON.parse(savedAnon) : true
        });
    },
}));
