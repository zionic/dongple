"use client";

import React from "react";
import { ShieldCheck, Star, Activity, CheckCircle2 } from "lucide-react";

/**
 * 신뢰도 점수에 따른 등급 정보 정의
 */
export interface TrustLevel {
    label: string;
    color: string;
    icon: React.ReactNode;
    score: number;
}

/**
 * 신뢰도 점수를 기반으로 등급 정보를 반환하는 유틸리티
 */
export const getTrustLevel = (score: number, isOfficial: boolean = false): TrustLevel => {
    if (isOfficial) {
        return {
            label: "공식 인증",
            color: "text-secondary bg-secondary/10",
            icon: <CheckCircle2 size={10} />,
            score: 1.0,
        };
    }

    if (score >= 0.8) {
        return {
            label: "신용 높음",
            color: "text-blue-500 bg-blue-500/10",
            icon: <ShieldCheck size={10} />,
            score,
        };
    }
    
    if (score >= 0.5) {
        return {
            label: "보통 이웃",
            color: "text-green-500 bg-green-500/10",
            icon: <Star size={10} />,
            score,
        };
    }
    
    return {
        label: "확인 필요",
        color: "text-orange-500 bg-orange-500/10",
        icon: <Activity size={10} />,
        score,
    };
};

/**
 * 신뢰도 뱃지 컴포넌트
 */
export function TrustBadge({ score, isOfficial, className = "" }: { score: number; isOfficial?: boolean; className?: string }) {
    const trust = getTrustLevel(score, isOfficial);
    
    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${trust.color} ${className}`}>
            {trust.icon}
            <span className="text-[10px] font-black tracking-tighter whitespace-nowrap">
                {trust.label}
            </span>
        </div>
    );
}
