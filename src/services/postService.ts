import { supabase } from "@/lib/supabase";

export interface Post {
    id: string;
    title: string | null;
    content: string;
    post_type: string;
    category: string;
    user_id: string | null;
    public_id: string | null;  // 익명 식별자
    is_anonymous: boolean;     // 익명 여부
    score: number;             // 신뢰도 점수 (0.0 ~ 1.0)
    created_at: string;
    likes_count: number;
    comments_count: number;
}

/**
 * 동네 소식 목록 조회
 */
export async function fetchPosts(limit = 10) {
    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
    return data as Post[];
}

/**
 * 동네 소식 등록
 */
export async function createPost(payload: { 
    title?: string, 
    content: string, 
    post_type: string, 
    category: string,
    user_id?: string,
    public_id?: string,
    is_anonymous?: boolean,
    score?: number 
}) {
    // 지침서 5-B: 사용자 제보 기본 가중치 0.5, 동플 게시물 0.6
    const finalScore = payload.score ?? 0.6; 

    // UUID 유효성 검사 (PostgreSQL uuid 타입 오류 방지)
    const isValidUuid = (id?: string) => 
        id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;
    
    // 유효한 UUID가 아니면(예: 'u-...' 형식) null로 설정하여 DB 오류 방지
    const cleanUserId = isValidUuid(payload.user_id) ? payload.user_id : null;
    
    const { data, error } = await supabase
        .from("posts")
        .insert([{
            ...payload,
            user_id: cleanUserId,
            score: finalScore
        }])
        .select();

    if (error) {
        console.error("Supabase insert error:", error);
        throw error;
    }
    return data[0] as Post;
}

/**
 * 실시간 소식 구독
 */
export function subscribePosts(onUpdate: () => void) {
    return supabase
        .channel('posts_changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'posts'
        }, onUpdate)
        .subscribe();
}
