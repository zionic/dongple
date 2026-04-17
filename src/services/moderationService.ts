import { supabase } from "@/lib/supabase";

/**
 * 콘텐츠 신고 사유 유형
 */
export type ReportReason = "허위 정보" | "광고/홍보" | "욕설/비하" | "기타";

/**
 * 콘텐츠(게시글 또는 상황 제보) 신고 제출
 */
export async function reportContent(
  reporterId: string,
  targetId: string,
  targetType: "POST" | "STATUS",
  reason: ReportReason
) {
  try {
    const { data, error } = await supabase.rpc("submit_report", {
      p_reporter_id: reporterId,
      p_target_id: targetId,
      p_target_type: targetType,
      p_reason: reason,
    });

    if (error) throw error;
    
    return data as { status: "reported" | "hidden"; count: number };
  } catch (error) {
    console.error("Report submission failed:", error);
    throw error;
  }
}
