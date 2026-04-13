"use client";

import { 
    ArrowLeft, MapPin, SlidersHorizontal, HelpCircle, Plus, X, Search,
    Home, Trees, Dumbbell, Coffee, ShoppingBag, Store, ParkingCircle, HeartPulse, Building2 
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
import { fetchLiveStatus, postLiveStatus, LiveStatus, subscribeLiveUpdates } from "@/services/statusService";
import { getAddressFromCoords, getCoordsFromAddress, searchPlaces } from "@/services/api";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useUIStore } from "@/lib/store/uiStore";
import { useLocationStore } from "@/lib/store/locationStore";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";

declare global {
  interface Window {
    naver: any;
  }
}

const CATEGORIES = [
    { id: "기타", label: "기타", icon: Home },
    { id: "공원", label: "공원", icon: Trees },
    { id: "운동", label: "운동", icon: Dumbbell },
    { id: "카페/식당", label: "카페/식당", icon: Coffee },
    { id: "마켓", label: "마켓", icon: ShoppingBag },
    { id: "편의점", label: "편의점", icon: Store },
    { id: "주차장", label: "주차장", icon: ParkingCircle },
    { id: "병원/약국", label: "병원/약국", icon: HeartPulse },
    { id: "기관", label: "기관", icon: Building2 },
];

function MapContent() {
    // 맵 마커 상태 (DB 연동)
    const [markers, setMarkers] = useState<LiveStatus[]>([]);

    const loadData = async () => {
        try {
            const data = await fetchLiveStatus();
            setMarkers(data);
        } catch (error) {
            console.error("지도 데이터 로드 실패:", error);
        }
    };

    useEffect(() => {
        loadData();
        const sub = subscribeLiveUpdates(loadData);
        return () => { sub.unsubscribe(); };
    }, []);

    // 리스트 카드 상태 (마커 데이터와 동일하게 사용)
    const localCards = markers;

    const openGlobalBottomSheet = useUIStore((state) => state.openBottomSheet);
    const searchParams = useSearchParams();
    
    // 모달 관리 상태 (지역 상태 제거)
    const { 
        latitude: storeLat, 
        longitude: storeLng, 
        regionName: storeRegion,
        address: storeAddress,
        setLocation,
        fetchLocation
    } = useLocationStore();

    const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isResultOpen, setIsResultOpen] = useState(false);
    const [selectedSearchPlace, setSelectedSearchPlace] = useState<any | null>(null);
    const tempMarkerRef = useRef<any>(null);
    const [isMapLoading, setIsMapLoading] = useState(true);
    
    // 카테고리 캐러셀 드래그 상태
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragMap, setIsDragMap] = useState(false);
    const [startXDrag, setStartXDrag] = useState(0);
    const [scrollLeftVal, setScrollLeftVal] = useState(0);

    const [isMapMoving, setIsMapMoving] = useState(false);
    const [isNearbyStatus, setIsNearbyStatus] = useState(false);

    // 거리 계산 함수 (Haversine Formula) - 두 좌표 사이의 미터 거리를 반환
    const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371e3; // 지구 반지름 (m)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // 주변 마커 존재 여부 확인
    const checkNearbyStatus = (centerLat: number, centerLng: number) => {
        const threshold = 50; // 50미터 이내 확인
        const exists = markers.some(m => {
            if (!m.latitude || !m.longitude) return false;
            return getDistance(centerLat, centerLng, m.latitude, m.longitude) < threshold;
        });
        setIsNearbyStatus(exists);
    };
    
    // 바텀 시트 드래그 이벤트 상태
    const [sheetHeight, setSheetHeight] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startHeight = useRef(50);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startHeight.current = sheetHeight;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startY.current;
        const deltaVH = (deltaY / window.innerHeight) * 100;
        let newHeight = startHeight.current - deltaVH;
        
        // 최소 15vh, 최대 92vh 바운더리
        if (newHeight < 15) newHeight = 15;
        if (newHeight > 92) newHeight = 92;
        
        setSheetHeight(newHeight);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
        
        // 손을 떼었을 때 가까운 상태로 부드럽게 자석처럼 스냅(Snap)
        if (sheetHeight > 70) {
            setSheetHeight(92); // 전체 펼침
        } else if (sheetHeight > 30) {
            setSheetHeight(50); // 중간 반만 펼침
        } else {
            setSheetHeight(15); // 헤더만 보이게 최소화
        }
    };

    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        if (mapRef.current) {
            renderMarkers();
        }
    }, [markers, expandedCardId, sheetHeight]);

    const handleSearch = async (initialQuery?: string) => {
        const queryToSearch = initialQuery || searchQuery;
        if (!queryToSearch || !queryToSearch.trim()) return;
        
        setIsSearching(true);
        setIsResultOpen(false);
        
        try {
            const poiResults = await searchPlaces(queryToSearch);
            setSearchResults(poiResults);
            
            if (poiResults && poiResults.length > 0) {
                setIsResultOpen(true);
                // URL 파라미터로 명시적 검색이 들어온 경우 첫 번째 결과로 즉시 이동
                if (initialQuery) {
                    handleSelectPlace(poiResults[0]);
                }
            } else {
                // POI 결과가 없으면 지오코딩 시도
                const coords = await getCoordsFromAddress(queryToSearch);
                if (coords && mapRef.current) {
                    const moveLatLng = new window.naver.maps.LatLng(coords.lat, coords.lng);
                    mapRef.current.setCenter(moveLatLng);
                    mapRef.current.setZoom(16);
                } else {
                    alert("검색 결과가 없습니다.");
                }
            }
        } catch (err) {
            console.error("검색 중 오류:", err);
            alert("검색 중 오류가 발생했습니다.");
        } finally {
            setIsSearching(false);
        }
    };

    // URL 파라미터(q) 감지하여 자동 검색 실행
    useEffect(() => {
        const q = searchParams.get('q');
        if (q && !isMapLoading && mapRef.current) {
            setSearchQuery(q);
            handleSearch(q);
        }
    }, [searchParams, isMapLoading]);

    const handleSelectPlace = async (place: any) => {
        setIsResultOpen(false);
        setSelectedSearchPlace(place);
        
        // 1. 좌표 변환 (TM128 -> LatLng)
        // Naver Search API v1 returns mapx, mapy in TM128
        if (window.naver && window.naver.maps && window.naver.maps.TransCoord) {
            const tm128 = new window.naver.maps.Point(parseInt(place.mapx), parseInt(place.mapy));
            const latlng = window.naver.maps.TransCoord.fromTM128ToLatLng(tm128);
            
            if (mapRef.current) {
                mapRef.current.setCenter(latlng);
                mapRef.current.setZoom(17);
                
                // 임시 마커 표시
                if (tempMarkerRef.current) tempMarkerRef.current.setMap(null);
                
                const markerContent = `
                    <div class="flex flex-col items-center transform -translate-x-1/2 -translate-y-full z-[100]">
                        <div class="bg-white px-3 py-1.5 rounded-xl shadow-xl border-2 border-[#2E7D32] text-[12px] font-bold text-[#3E2723] mb-1 whitespace-nowrap">
                            ${place.title.replace(/<[^>]*>?/gm, '')}
                        </div>
                        <div class="w-4 h-4 bg-[#2E7D32] rounded-full border-2 border-white shadow-lg animate-bounce"></div>
                    </div>
                `;
                
                const tempMarker = new window.naver.maps.Marker({
                    position: latlng,
                    map: mapRef.current,
                    icon: {
                        content: markerContent,
                        anchor: new window.naver.maps.Point(0, 0),
                    }
                });
                
                tempMarkerRef.current = tempMarker;
            }
        } else {
            // Fallback: Geocoding
            const cleanAddress = place.roadAddress || place.address;
            const coords = await getCoordsFromAddress(cleanAddress);
            if (coords && mapRef.current) {
                const latlng = new window.naver.maps.LatLng(coords.lat, coords.lng);
                mapRef.current.setCenter(latlng);
                mapRef.current.setZoom(17);
                // 검색된 장소의 주소로 위치 정보 업데이트
                const addrResult = await getAddressFromCoords(coords.lat, coords.lng);
                setLocation(coords.lat, coords.lng, addrResult.fullAddress, addrResult.regionName);
            }
        }
    };

    // 캐러셀 드래그 핸들러
    const onDragStart = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragMap(true);
        setStartXDrag(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeftVal(scrollRef.current.scrollLeft);
    };

    const onDragEnd = () => {
        setIsDragMap(false);
    };

    const onDragMove = (e: React.MouseEvent) => {
        if (!isDragMap || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startXDrag) * 2; // 스크롤 속도 조절
        scrollRef.current.scrollLeft = scrollLeftVal - walk;
    };

    const initMap = () => {
        if (!window.naver || !window.naver.maps) {
            return;
        }
        
        const container = document.getElementById('map-container');
        if (!container) {
            setTimeout(initMap, 100);
            return;
        }

        if (mapRef.current) return; // 이미 초기화됨

        try {
            const mapOptions = {
                center: new window.naver.maps.LatLng(storeLat, storeLng),
                zoom: 15,
                logoControl: false,
                mapDataControl: false,
                scaleControl: false,
                mapTypeControl: false,
            };

            const map = new window.naver.maps.Map(container, mapOptions);
            mapRef.current = map;

            // GPS로 현재 위치 가져오기
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        const currentLatLng = new window.naver.maps.LatLng(latitude, longitude);
                        map.setCenter(currentLatLng);
                        map.setZoom(16);
                    },
                    (error) => {
                        console.warn("GPS 정보를 가져올 수 없습니다:", error);
                    }
                );
            }
            
            // 지도 로드 완료 및 이동 완료 이벤트
            window.naver.maps.Event.addListener(map, 'idle', async () => {
                setIsMapLoading(false);
                setIsMapMoving(false);
                
                // 중심점 주소 가져오기 및 전역 상태 동기화
                const center = map.getCenter();
                const addrResult = await getAddressFromCoords(center.y, center.x);
                setLocation(center.y, center.x, addrResult.fullAddress, addrResult.regionName);
                
                // 주변 마커 체크
                checkNearbyStatus(center.y, center.x);
            });

            // 지도 드래그 시작 시 작업
            window.naver.maps.Event.addListener(map, 'dragstart', () => {
                setIsMapMoving(true);
                setSheetHeight(15); // 시트 내리기
                setIsResultOpen(false); // 검색창 닫기
            });

            // 지도 클릭 이벤트: 해당 위치로 중심 이동
            window.naver.maps.Event.addListener(map, 'click', (e: any) => {
                map.panTo(e.coord);
                setIsResultOpen(false); // 검색창 닫기
            });

            setTimeout(() => setIsMapLoading(false), 1500); // 네트워크 지연 대비 백업

            renderMarkers();
        } catch (err) {
            console.error("지도 초기화 에러:", err);
            setMapError("지도를 초기화하는 중 오류가 발생했습니다.");
            setIsMapLoading(false);
        }
    };

    // 스크립트가 이미 로드된 경우를 위한 useEffect 기반 초기화
    useEffect(() => {
        if (typeof window !== 'undefined' && window.naver && window.naver.maps && !mapRef.current) {
            initMap();
        }
    }, []);

    // URL 파라미터(mode) 감지하여 생성 바텀 시트 열기
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'share' || mode === 'request') {
            handleOpenCreate(mode as "share" | "request");
        }
    }, [searchParams]);

    const handleOpenCreate = async (mode: "share" | "request") => {
        if (!mapRef.current) return;
        
        const center = mapRef.current.getCenter();
        const addrResult = await getAddressFromCoords(center.y, center.x);
        
        openGlobalBottomSheet("liveCreate", {
            mode,
            address: addrResult.fullAddress,
            latitude: center.y,
            longitude: center.x
        });
    };

    // 클릭 시 검색 결과 닫기 처리
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.group')) { // 검색창 group 클래스 외부 클릭 시
                setIsResultOpen(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const renderMarkers = () => {
        // 기존 렌더링된 마커 배열 지우기
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        if (!window.naver || !window.naver.maps || !mapRef.current) return;

        markers.forEach(m => {
            const isSelected = expandedCardId === m.id;
            
            // Taildwind 기반 마커 HTML 디자인 
            const markerContent = `
                <div class="flex flex-col items-center transform -translate-x-1/2 -translate-y-full cursor-pointer ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'}" style="width: auto; height: auto;">
                    ${isSelected ? `
                        <div class="absolute -top-7 whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md shadow-lg flex items-center justify-center font-bold">
                            여기 있어요!
                            <div class="absolute -bottom-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                        </div>
                    ` : ''}
                    <div class="px-2.5 py-1 ${isSelected ? 'ring-4 ring-white/50 shadow-xl' : 'shadow-md shadow-black/20'} rounded-full text-white text-[11px] font-bold ${m.color}">
                        ${m.status}
                    </div>
                    <div class="w-2.5 h-2.5 ${m.color} rotate-45 transform -translate-y-1.5 shadow-sm"></div>
                    ${isSelected ? `<div class="absolute bottom-0 w-8 h-3 rounded-full blur-sm opacity-50 animate-pulse ${m.color}" style="transform: translateY(50%)"></div>` : ''}
                </div>
            `;

            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(m.latitude || 37.3015, m.longitude || 126.9930),
                map: mapRef.current,
                icon: {
                    content: markerContent,
                    size: new window.naver.maps.Size(40, 50),
                    anchor: new window.naver.maps.Point(20, 50),
                }
            });

            // 마커 클릭 이벤트 (리액트 상태 변경 연동)
            window.naver.maps.Event.addListener(marker, 'click', () => {
                const isTogglingOff = expandedCardId === m.id;
                setExpandedCardId(isTogglingOff ? null : m.id);
                if (!isTogglingOff) {
                    if (sheetHeight < 30) setSheetHeight(50);
                    // 중앙으로 지도 이동
                    mapRef.current.panTo(marker.getPosition());
                    setTimeout(() => {
                        const cardEl = document.getElementById('card-' + m.id);
                        if (cardEl) {
                            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 150);
                }
            });

            markersRef.current.push(marker);
        });
    };


    return (

        <div className="relative w-full h-[100dvh] bg-[#E5E3DF] overflow-hidden flex flex-col max-w-md mx-auto shadow-2xl">
            <Script 
                src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`}
                onLoad={initMap}
                strategy="afterInteractive"
            />
            
            <Header 
                isSearchMode={true}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onSearch={() => handleSearch()}
                onClearSearch={() => setSearchQuery("")}
                showBackButton={true}
                placeholder="동네 장소나 주소 검색..."
            />

            {/* 검색 결과 리스트 */}
            <div className="absolute top-14 left-4 right-4 z-40 pointer-events-none">
                <AnimatePresence>
                    {isResultOpen && searchResults.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden pointer-events-auto max-h-[300px] overflow-y-auto mt-2"
                        >
                            <div className="p-2 space-y-1">
                                {searchResults.map((place, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => handleSelectPlace(place)}
                                        className="p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border-b border-gray-50 last:border-0 group/item"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h5 className="font-bold text-sm text-[#3E2723] group-hover/item:text-[#2E7D32]" dangerouslySetInnerHTML={{ __html: place.title }} />
                                                <p className="text-[11px] text-gray-400 mt-0.5">{place.roadAddress || place.address}</p>
                                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 text-[9px] text-gray-500 rounded font-medium">{place.category}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewPlaceName(place.title.replace(/<[^>]*>?/gm, ''));
                                                    setCreateMode("share");
                                                    setIsCreateModalOpen(true);
                                                    setIsResultOpen(false);
                                                    handleSelectPlace(place);
                                                }}
                                                className="ml-2 px-3 py-1.5 bg-[#2E7D32] text-white text-[10px] font-bold rounded-lg hover:bg-[#1B5E20] transition-colors shadow-sm shrink-0"
                                            >
                                                등록
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 네이버 지도 객체가 들어갈 컨테이너 */}
            <div className="relative flex-1 w-full" style={{ minHeight: 'calc(100dvh - 64px - 15vh)' }}>
                <div id="map-container" className="absolute inset-0 w-full h-full outline-none bg-gray-100" />
                
                {/* 중앙 고정 핀 (조준점) */}
                <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                    style={{ paddingBottom: `${sheetHeight}vh` }}
                >
                    <motion.div 
                        animate={{ 
                            y: isMapMoving ? -30 : 0,
                            scale: isMapMoving ? 1.1 : 1
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="relative flex flex-col items-center mb-10"
                    >
                        {/* 주소 배지 & 제보 버튼 */}
                        {storeAddress && !isMapLoading && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -top-14 bg-gray-800/95 backdrop-blur-md text-white px-3 py-2 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] whitespace-nowrap flex items-center space-x-2 border border-white/20 pointer-events-auto"
                            >
                                <div className="flex items-center space-x-1 border-r border-white/20 pr-2">
                                    <MapPin size={12} className="text-green-400" />
                                    <span className="text-[11px] font-bold max-w-[120px] truncate">{storeAddress}</span>
                                </div>
                                
                                <AnimatePresence mode="wait">
                                    {!isNearbyStatus && !isMapMoving ? (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={() => handleOpenCreate("share")}
                                            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-[10px] px-2.5 py-1 rounded-lg flex items-center font-black transition-colors active:scale-95"
                                        >
                                            <Plus size={12} className="mr-0.5" />
                                            여기에 제보
                                        </motion.button>
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-[10px] text-gray-300 font-bold px-1"
                                        >
                                            {isMapMoving ? "이동 중..." : "등록된 정보 있음"}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800/95 rotate-45 border-r border-b border-white/10" />
                            </motion.div>
                        )}
                        
                        {/* 실제 핀 모양 */}
                        <div className="relative">
                            <MapPin size={42} className="text-[#2E7D32] drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" />
                            {/* 핀 끝점 표시 */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2E7D32] rounded-full border-2 border-white shadow-lg"></div>
                        </div>

                        {/* 그림자 (들렸을 때 표시) */}
                        <motion.div 
                            animate={{ 
                                scale: isMapMoving ? 1.5 : 0,
                                opacity: isMapMoving ? 0.2 : 0
                            }}
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black rounded-[100%] blur-[2px]"
                        />
                    </motion.div>
                </div>

                {/* 로딩 표시기 */}
                {isMapLoading && !mapError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm z-10">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-[#2E7D32]/20 border-t-[#2E7D32] rounded-full animate-spin mb-3"></div>
                            <p className="text-xs font-bold text-gray-500">지도를 불러오는 중...</p>
                        </div>
                    </div>
                )}
                {mapError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 backdrop-blur-sm z-10 px-6 text-center">
                        <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-100">
                            <HelpCircle size={40} className="text-red-400 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-800 mb-2">{mapError}</p>
                            <p className="text-xs text-gray-500">.env.local 설정 후 앱을 재시작해 주세요.</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
                            >
                                페이지 새로고침
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 하단 바텀 시트 (리스트 뷰 오버레이) - flex col로 스크롤 영역 분리 */}
            <div 
                className={`absolute bottom-0 left-0 w-full z-30 bg-white rounded-t-[30px] shadow-[0_-15px_50px_rgba(0,0,0,0.1)] pointer-events-auto flex flex-col ${isDragging ? '' : 'transition-all duration-300 ease-out'}`}
                style={{ height: `${sheetHeight}vh` }}
            >
                {/* 바텀 시트 핸들바 (자유 드래그 조절) */}
                <div 
                    className="w-full py-4 cursor-ns-resize flex justify-center shrink-0 items-center hover:bg-gray-50/50 rounded-t-[30px] transition-colors select-none touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full pointer-events-none" />
                </div>
                
                {/* 헤더 및 [요청/공유] 버튼 */}
                <div className="px-5 pb-3 border-b border-gray-100 shrink-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[#3E2723] text-lg">주변 현황 <span className="text-[#2E7D32] ml-0.5">{localCards.length}</span>건</h3>
                        <div className="flex space-x-1.5">
                            <button 
                                onClick={() => handleOpenCreate("request")}
                                className="text-[10px] text-[#5D4037] border border-[#D7CCC8] bg-[#EFEBE9] px-2.5 py-1.5 rounded-lg flex items-center space-x-1 font-bold hover:bg-[#D7CCC8]/50 transition-colors shadow-sm"
                            >
                                <HelpCircle size={10} />
                                <span>요청</span>
                            </button>
                            <button 
                                onClick={() => handleOpenCreate("share")}
                                className="text-[10px] text-white bg-[#2E7D32] px-2.5 py-1.5 rounded-lg flex items-center space-x-1 font-bold hover:bg-[#1B5E20] transition-colors shadow-sm"
                            >
                                <Plus size={10} />
                                <span>공유</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 리스트 뷰 영역 (스크롤 가능, 항목 여러 개 추가) */}
                <div className="px-5 py-4 overflow-y-auto space-y-3 flex-1 pb-10">
                    {localCards.map(card => (
                        <div 
                            key={card.id}
                            id={`card-${card.id}`}
                            onClick={() => {
                                const isTogglingOff = expandedCardId === card.id;
                                setExpandedCardId(isTogglingOff ? null : card.id);
                                if (!isTogglingOff) {
                                    // 지도 중심 이동 추가
                                    if (mapRef.current && (card.latitude || card.longitude)) {
                                        const targetPos = new window.naver.maps.LatLng(card.latitude || 37.3015, card.longitude || 126.9930);
                                        mapRef.current.panTo(targetPos);
                                    }
                                    setIsResultOpen(false); // 검색창 닫기
                                    
                                    setTimeout(() => {
                                        const cardEl = document.getElementById(`card-${card.id}`);
                                        if (cardEl) {
                                            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                    }, 150);
                                }
                            }}
                            className={`p-4 border rounded-2xl flex flex-col shadow-sm cursor-pointer transition-colors ${card.bg_class}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-lg text-gray-600 font-bold shadow-sm">{card.category}</span>
                                    <h4 className="font-bold text-[#3E2723] mt-1.5 text-base">{card.place_name}</h4>
                                        <div className="flex flex-col items-end">
                                            <span className={`${card.status_color} text-xs font-bold mt-1 flex items-center`}>
                                                {card.status === "여유" ? "🟢" : card.status === "보통" ? "🟡" : card.status === "혼잡" ? "🔴" : "🟠"} {card.status}
                                            </span>
                                            <span className="text-gray-400 text-[10px] mt-0.5">
                                                {new Date(card.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border shrink-0 ${card.status_color}`}>
                                        <MapPin className={card.status_color} size={24} />
                                    </div>
                                </div>

                            {/* 아코디언 확장 영역 (이력 정보) */}
                            {expandedCardId === card.id && card.history && (
                                <div className="mt-4 pt-4 border-t border-gray-200/50 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <h5 className="text-[11px] font-bold text-gray-500 mb-3">상황 변동 이력 (최근 기록)</h5>
                                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                        {card.history.map((historyItem, idx) => (
                                            <div key={idx} className="relative flex items-start justify-between">
                                                <div className="flex items-start">
                                                    <div className="flex flex-col items-center mr-3 mt-1 relative z-10">
                                                        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm bg-gray-400 ${historyItem.status === '여유' ? 'bg-green-500' : historyItem.status === '보통' ? 'bg-yellow-500' : historyItem.status === '혼잡' ? 'bg-red-500' : 'bg-[#5D4037]'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-1.5 mb-0.5">
                                                            <span className={`text-[10px] font-bold ${historyItem.status === '여유' ? 'text-green-600' : historyItem.status === '보통' ? 'text-yellow-600' : historyItem.status === '혼잡' ? 'text-red-600' : 'text-[#5D4037]'}`}>
                                                                {historyItem.status}
                                                            </span>
                                                            <span className="text-[9px] text-gray-400">{historyItem.time}</span>
                                                        </div>
                                                        <p className="text-xs text-[#3E2723] leading-relaxed">{historyItem.text}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-5 flex space-x-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenCreate("request"); }}
                                            className="flex-1 py-2 text-[11px] bg-white border border-[#D7CCC8] rounded-xl font-bold text-[#5D4037] hover:bg-[#EFEBE9] transition flex items-center justify-center"
                                        >
                                            <HelpCircle size={12} className="mr-1" /> 이웃에게 묻기
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenCreate("share"); }}
                                            className="flex-1 py-2 text-[11px] bg-[#2E7D32] text-white rounded-xl font-bold shadow-sm hover:bg-[#1B5E20] transition flex items-center justify-center"
                                        >
                                            <Plus size={12} className="mr-1" /> 다른 상황 제보
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default function MapPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[#2E7D32]/20 border-t-[#2E7D32] rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-bold">지도를 불러오는 중...</p>
                </div>
            </div>
        }>
            <MapContent />
        </Suspense>
    );
}
