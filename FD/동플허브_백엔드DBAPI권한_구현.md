> 기준 문서: `동플허브_마스터스펙_구현.md`
> 관련 문서: `동플허브_시스템설계_구현.md`, `schema.sql`, `seed_suwon_events.sql`, `동플허브_tourapi_구현.md`
> 문서 성격: 구현
> 적용 범위: Supabase/Postgres 데이터 모델, API 책임, RLS/권한 설계

# 동플허브_백엔드DBAPI권한_구현

## 1. 문서 목적
- 이 문서는 구현팀이 Supabase 기준으로 백엔드와 DB를 바로 설계할 수 있게 하는 실행 설계서다.
- 현재 `schema.sql`을 MVP 기준 스키마로 삼고, 누락된 장기 모델은 확장 항목으로 분리한다.

## 2. 현재 기준 테이블

### 상태 공유
- `live_status`
- `status_verifications`

### 커뮤니티
- `posts`

### 공식 이벤트
- `events`
- `events_ext`
- `raw_items`

## 3. 테이블 책임

### 3.1 live_status
- 역할: 사용자가 제보한 실시간 장소 상태 저장
- 핵심 필드:
  - `place_name`
  - `category`
  - `status`
  - `is_request`
  - `verified_count`
  - `latitude`, `longitude`
  - `message`
  - `expires_at`
- 운영 원칙:
  - 만료 시간을 기준으로 활성 상태를 관리한다.
  - 지도와 리스트는 `expires_at > now()` 조건의 활성 데이터만 우선 조회한다.

### 3.2 status_verifications
- 역할: 특정 상태 제보에 대한 사용자 인증 기록 저장
- 핵심 필드:
  - `status_id`
  - `user_id`
- 운영 원칙:
  - 동일 사용자의 중복 인증 방지 정책은 앱 또는 DB 제약으로 후속 보완한다.
  - 초기 단계에서는 RPC 증가 방식과 로그 저장을 함께 사용한다.

### 3.3 posts
- 역할: 익명/비익명 커뮤니티 게시글 저장
- 핵심 필드:
  - `content`
  - `post_type`
  - `category`
  - `user_id`
  - `public_id`
  - `is_anonymous`
  - `score`
- 운영 원칙:
  - 외부 노출은 `public_id`, `is_anonymous` 기준으로 제어한다.
  - `user_id`는 내부 참조용으로만 사용한다.

### 3.4 events
- 역할: 공식 행사/축제 정제 데이터 저장
- 핵심 필드:
  - `title`
  - `lat`, `lng`
  - `trust_score`
  - `category_code`
  - `thumbnail_url`
  - `event_start_date`, `event_end_date`

### 3.5 events_ext
- 역할: 외부 이벤트 메타데이터 확장 저장
- 핵심 필드:
  - `event_id`
  - `source`
  - `ext_id`
  - `meta`
- 구현 메모:
  - `event_id`는 `events.id`와 동일한 `BIGINT`를 사용한다.

### 3.6 raw_items
- 역할: 외부 API 원본 응답 보존
- 운영 원칙:
  - 원본 응답은 항상 이 테이블에 저장하고, 서비스 노출 데이터는 정제 테이블로 분리한다.

## 4. 권장 API 책임

### 상태 공유 API
- `GET /status`
  - 활성 상태 목록 조회
- `POST /status`
  - 새 상태 제보 등록
- `POST /status/{id}/verify`
  - 인증 수 증가 및 인증 로그 저장
- `GET /status/map`
  - 지도용 좌표 중심 목록 조회

### 게시글 API
- `GET /posts`
  - 게시글 목록 조회
- `POST /posts`
  - 익명/비익명 게시글 등록
- `GET /posts/{id}`
  - 게시글 상세 조회

### 이벤트 API
- `GET /events`
  - 공식 이벤트 목록 조회
- `GET /events/{id}`
  - 이벤트 상세 조회
- `POST /events/sync`
  - 관리자/배치용 TourAPI 동기화 트리거

## 5. RLS/권한 설계

### 읽기 정책
- `live_status`, `posts`, `events`, `events_ext`, `raw_items`는 읽기 허용을 기본으로 둔다.
- 단, `raw_items`는 운영/내부 용도이므로 실제 서비스 단계에서는 관리자 전용으로 축소하는 것을 권장한다.

### 쓰기 정책
- 현재 `schema.sql`의 전체 공개 쓰기 정책은 MVP 테스트용이다.
- 실제 운영 전환 시 아래처럼 조정한다.
  - `live_status`: 로그인 사용자 또는 검증된 익명 세션만 INSERT
  - `status_verifications`: 로그인 사용자만 INSERT
  - `posts`: 로그인 사용자만 INSERT
  - `events`, `events_ext`, `raw_items`: 서비스 계정 또는 배치 작업만 INSERT/UPDATE

### 내부 식별자 정책
- `user_id`는 내부 연동용 필드로 사용한다.
- 외부 응답에는 `user_id`를 노출하지 않는다.
- 익명 표시가 필요한 경우 `public_id` 또는 익명 상태값만 전달한다.

## 6. 향후 확장 테이블
- `profiles`
  - 닉네임, 지역, GPS 인증 상태
- `reports`
  - 허위 제보/게시글 신고
- `stats_daily`
  - 지역/카테고리 집계
- `event_links`
  - 외부 원본과 정제 이벤트 연결

## 7. schema.sql 반영 원칙
- 현재 `schema.sql`은 MVP 기준으로 유지한다.
- 테이블 추가 전에는 반드시 마스터 스펙과 기능 설계 문서에서 책임을 먼저 확정한다.
- 마이그레이션 순서는 `기존 테이블 안정화 -> 인증/프로필 -> 신고 -> 집계` 순으로 진행한다.
