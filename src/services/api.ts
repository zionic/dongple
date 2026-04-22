/**
 * 동네 위치 기반 외부 데이터 연동 서비스
 */

export interface LocationData {
    lat: number;
    lng: number;
    addressName?: string;
    regionName?: string; // 예: 역삼동
}

export interface WeatherData {
    temp: string;
    condition: string;
    icon: string;
}

export interface PlaceData {
    name: string;
    address: string;
    distance: string;
    category: string;
    lat?: number;
    lng?: number;
}

export interface AddressResult {
    fullAddress: string;
    regionName: string; // 예: 수원시 정자동
}

/**
 * 네이버 로컬 API를 사용하여 좌표를 주소로 변환 (Reverse Geocoding)
 */
export async function getAddressFromCoords(lat: number, lng: number): Promise<AddressResult> {
    const fallback: AddressResult = { fullAddress: "주소 정보 없음", regionName: "위치 확인 불가" };
    
    if (typeof window === 'undefined' || !window.naver || !window.naver.maps || !window.naver.maps.Service) {
        return { fullAddress: "서비스 로드 중...", regionName: "위치 확인 중" };
    }

    return new Promise((resolve) => {
        window.naver.maps.Service.reverseGeocode({
            location: new window.naver.maps.LatLng(lat, lng),
        }, (status: any, response: any) => {
            if (status !== window.naver.maps.Service.Status.OK) {
                console.error('Reverse Geocoding 실패:', status);
                resolve(fallback);
                return;
            }

            try {
                const results = response.v2.results;
                let fullAddress = response.v2.address?.roadAddress || response.v2.address?.jibunAddress || "";
                let regionName = "";

                if (results && results.length > 0) {
                    // 첫 번째 결과에서 지역 정보 추출 시도
                    const region = results[0].region;
                    
                    // 1순위: area3(동)이 있으면 area2(시/구)의 앞부분과 조합
                    if (region.area3?.name) {
                        const city = region.area2?.name?.split(' ')[0] || "";
                        regionName = `${city} ${region.area3.name}`.trim();
                    } 
                    // 2순위: area3이 없으면 area2 전체 사용
                    else if (region.area2?.name) {
                        regionName = region.area2.name;
                    }
                    // 3순위: area1(도/광역시) 사용
                    else {
                        regionName = region.area1?.name || "";
                    }

                    // 전체 주소가 없는 경우 구성을 시도
                    if (!fullAddress) {
                        fullAddress = [
                            region.area1?.name,
                            region.area2?.name,
                            region.area3?.name,
                            region.area4?.name
                        ].filter(Boolean).join(' ');
                    }
                }

                resolve({
                    fullAddress: fullAddress || "주소 정보 없음",
                    regionName: regionName || "위치 정보 없음"
                });
            } catch (err) {
                console.error('주소 파싱 에러:', err);
                resolve(fallback);
            }
        });
    });
}

/**
 * 상호/장소 키워드로 검색 (POI Search)
 * /api/search 프록시를 통해 네이버 지역 검색 API 호출
 */
export async function searchPlaces(query: string, lat?: number, lng?: number): Promise<any[]> {
    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search API failed');
        const data = await response.json();
        const items = data.items || [];

        if (lat !== undefined && lng !== undefined && typeof window !== 'undefined' && window.naver?.maps?.TransCoord) {
            return items.map((item: any) => {
                const tm128 = new window.naver.maps.Point(parseInt(item.mapx), parseInt(item.mapy));
                const latlng = window.naver.maps.TransCoord.fromTM128ToLatLng(tm128);
                const d = getDistance(lat, lng, latlng.y, latlng.x);
                return {
                    ...item,
                    distance: formatDistance(d)
                };
            });
        }
        return items;
    } catch (err) {
        console.error('POI 검색 실패:', err);
        return [];
    }
}

/**
 * 주소를 좌표로 변환 (Geocoding) - 검색 기능용
 */
export async function getCoordsFromAddress(address: string): Promise<{ lat: number, lng: number } | null> {
    if (typeof window === 'undefined' || !window.naver || !window.naver.maps || !window.naver.maps.Service) {
        return null;
    }

    return new Promise((resolve) => {
        window.naver.maps.Service.geocode({
            query: address
        }, (status: any, response: any) => {
            if (status !== window.naver.maps.Service.Status.OK) {
                console.error('Geocoding 실패:', status);
                resolve(null);
                return;
            }

            try {
                const addresses = response.v2.addresses;
                if (addresses && addresses.length > 0) {
                    const item = addresses[0];
                    resolve({
                        lat: parseFloat(item.y),
                        lng: parseFloat(item.x)
                    });
                } else {
                    resolve(null);
                }
            } catch (err) {
                console.error('좌표 변환 에러:', err);
                resolve(null);
            }
        });
    });
}

/**
 * 하버사인 공식을 이용한 두 좌표 사이의 거리(m) 계산
 */
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // 지구 반지름 (m)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 미터 단위
}

/**
 * 거리 포맷팅 유틸리티 (m -> m/km)
 */
export function formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
        return `${Math.round(distanceInMeters)}m`;
    }
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
}

/**
 * 공공 데이터 API 연동: 날씨 정보 가져오기
 */
export async function getVillageWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
        const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
        if (!res.ok) throw new Error("Weather fetch failed");
        return await res.json();
    } catch(e) {
        console.error("Weather API error", e);
        return {
            temp: "12°",
            condition: "맑음",
            icon: "☀️",
        };
    }
}

/**
 * 네이버 지역 검색 API 연동: 주변 특화 장소 찾기
 */
export async function getNearbyPlaces(lat: number, lng: number, keyword: string): Promise<PlaceData[]> {
    try {
        const address = await getAddressFromCoords(lat, lng);
        const query = `${address.regionName !== "위치 확인 불가" ? address.regionName : ""} ${keyword}`.trim();
        const response = await fetch(`/api/search?query=${encodeURIComponent(query || keyword)}`);
        
        if (!response.ok) throw new Error('Search API failed');
        const data = await response.json();
        
        return (data.items || []).map((item: any) => {
            const cleanName = item.title.replace(/<[^>]*>?/gm, '');
            
            // 네이버 검색 API의 mapx, mapy(TM128)를 위경도로 변환하여 거리 계산 (브라우저 환경에서만 가능)
            let distanceStr = "";
            if (typeof window !== 'undefined' && window.naver?.maps?.TransCoord) {
                const tm128 = new window.naver.maps.Point(parseInt(item.mapx), parseInt(item.mapy));
                const latlng = window.naver.maps.TransCoord.fromTM128ToLatLng(tm128);
                const d = getDistance(lat, lng, latlng.y, latlng.x);
                distanceStr = formatDistance(d);
            }

            return {
                name: cleanName,
                address: item.roadAddress || item.address,
                distance: distanceStr, 
                category: item.category
            };
        });
    } catch (err) {
        console.error('POI 주변 검색 실패:', err);
        return [];
    }
}
