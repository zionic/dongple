import { supabase } from "@/lib/supabase";

export interface LiveStatus {
    id: string;
    place_name: string;
    category: string;
    status: string;
    status_color: string;
    is_request: boolean;
    verified_count: number;
    latitude?: number;
    longitude?: number;
    created_at: string;
    expires_at: string;
}

/**
 * 전역 실시간 상황 목록 조회 (만료되지 않은 것만)
 */
export async function fetchLiveStatus() {
    const { data, error } = await supabase
        .from("live_status")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data as LiveStatus[];
}

/**
 * 실시간 상황 공유하기 (상태 업데이트)
 */
export async function postLiveStatus(payload: Partial<LiveStatus>) {
    const { data, error } = await supabase
        .from("live_status")
        .insert([payload])
        .select();

    if (error) throw error;
    return data[0] as LiveStatus;
}

/**
 * 상황 인증하기 (나도 여기에요 버튼 클릭 시)
 */
export async function verifyStatus(statusId: string, userId: string) {
    // 1. 인증 내역 기록
    const { error: verifyError } = await supabase
        .from("status_verifications")
        .insert([{ status_id: statusId, user_id: userId }]);

    if (verifyError) throw verifyError;

    // 2. 메인 테이블의 카운트 증가 (RPC 또는 직접 업데이트)
    const { error: updateError } = await supabase.rpc('increment_verified_count', {
        status_id: statusId
    });

    if (updateError) {
        // RPC가 만약 없다면 일반 업데이트로 대체 가능
        const { error: fallbackError } = await supabase
            .from("live_status")
            .update({ verified_count: supabase.rpc('increment', { row_id: statusId }) }) // 예시
            .eq("id", statusId);
        if (fallbackError) throw fallbackError;
    }
}

/**
 * 실시간 구독 설정 (Broadcast)
 */
export function subscribeLiveUpdates(onUpdate: (payload: any) => void) {
    return supabase
        .channel('live_status_changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'live_status'
        }, onUpdate)
        .subscribe();
}
