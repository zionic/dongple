import { fetchWithCache } from './client';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface TouristAttractionItem {
  trrsrtNm: string; // 관광지명 -> title
  rdnmadr?: string; // 도로명주소 -> addr1
  lnmadr?: string;  // 지번주소
  latitude: string; // 위도 -> mapy
  longitude: string; // 경도 -> mapx
  phoneNumber?: string; // 전화번호 -> tel
  trrsrtIntrcn?: string; // 소개
  [key: string]: any;
}

/**
 * 전국 관광지 정보 수집 및 원본 저장 (표준 API)
 */
export async function collectTouristAttractions() {
  const cacheKey = `tourist-attractions:all`;
  
  // 1. Standard API에서 관광지 정보 조회 (엔드포인트는 이미 baseURL에 포함됨)
  const items = await fetchWithCache<TouristAttractionItem[]>(
    cacheKey,
    '', // baseURL이 전체 경로이므로 빈 문자열
    {
      numOfRows: 100,
      pageNo: 1,
    }
  );

  if (!items || items.length === 0) {
    console.log('수집된 관광지 데이터가 없습니다.');
    return [];
  }

  // 데이터 매핑 (기존 시스템 호환용)
  const mappedItems = items.map(item => ({
    contentid: item.trrsrtNm, // 고유 ID가 없으므로 명칭 사용
    title: item.trrsrtNm,
    addr1: item.rdnmadr || item.lnmadr || '',
    mapx: item.longitude,
    mapy: item.latitude,
    tel: item.phoneNumber,
    // 축제 관련 필드는 빈값 처리
    eventstartdate: '',
    eventenddate: '',
  }));

  // 2. 원본 데이터(raw_items) 적재
  const { error: rawError } = await supabase
    .from('raw_items')
    .insert([
      {
        source: 'STANDARD_API',
        raw_data: { type: 'TOURIST_ATTRACTION', count: items.length, items: mappedItems },
      }
    ]);

  if (rawError) {
    console.error('원본 데이터 적재 실패:', rawError);
  }

  return mappedItems;
}
