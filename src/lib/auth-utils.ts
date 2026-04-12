import CryptoJS from "crypto-js";

/**
 * 전역 익명 식별자(public_id) 생성 로직
 * HMAC(secret, user_id + salt + time_bucket)
 */
export function generatePublicId(userId: string, secretKey: string = "dongple-hub-secret-2026"): string {
    // 24시간 단위의 타임 버킷 (하루 동안은 동일한 public_id 유지)
    const timestampBucket = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const salt = "community-trust-salt";
    
    const message = `${userId}-${salt}-${timestampBucket}`;
    const hash = CryptoJS.HmacSHA256(message, secretKey);
    
    // 앞 12자리만 사용하여 가독성 확보 (예: 8df2-a9b1-c2d3)
    const fullHash = hash.toString(CryptoJS.enc.Hex);
    return fullHash.substring(0, 12).match(/.{1,4}/g)?.join('-') || fullHash.substring(0, 12);
}

/**
 * 로컬 스토리지 기반 영속적 사용자 ID 가져오기 (없으면 생성)
 * 실제 서비스에서는 본인인증 후 서버에서 부여받은 ID를 사용해야 함
 */
export function getPersistentUserId(): string {
    if (typeof window === 'undefined') return "";
    
    let id = localStorage.getItem('dongple_user_id');
    if (!id) {
        // 임시 유저 ID 생성 (실제 가동 시에는 본인인증 해시값 등으로 교체)
        id = `u-${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('dongple_user_id', id);
    }
    return id;
}
