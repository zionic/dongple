-- 1. 실시간 상황 정보 테이블
CREATE TABLE live_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_name TEXT NOT NULL,          -- 장소명
    category TEXT NOT NULL,            -- 카테고리 (교통, 기관, 공원 등)
    status TEXT NOT NULL,              -- 현재 상태 (여유, 혼잡, 인증 대기 등)
    status_color TEXT,                 -- UI 표시 색상 (text-red-500 등)
    is_request BOOLEAN DEFAULT FALSE,  -- 인증 요청 여부
    verified_count INTEGER DEFAULT 0,  -- 인증 인원 수
    latitude DOUBLE PRECISION,         -- 위도 (위치 기반 필터링용)
    longitude DOUBLE PRECISION,        -- 경도
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours') -- 2시간 후 만료
);

-- 2. 사용자 인증 내역 테이블 (중복 인증 방지 및 신뢰도 관리)
CREATE TABLE status_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status_id UUID REFERENCES live_status(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,            -- 인증한 사용자 ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 실시간 기능 활성화 (Supabase Replication 설정)
ALTER PUBLICATION supabase_realtime ADD TABLE live_status;

-- 4. 만료된 데이터 자동 삭제 또는 감추기 처리를 위한 인덱스
CREATE INDEX idx_live_status_expires_at ON live_status(expires_at);
CREATE INDEX idx_live_status_location ON live_status USING GIST (ll_to_earth(latitude, longitude)); -- PostGIS (필요 시 확장)
