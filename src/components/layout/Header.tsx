"use client";

import { useEffect } from "react";
import { MapPin, Search, Bell } from "lucide-react";
import { useLocationStore } from "@/lib/store/locationStore";

export default function Header() {
    const { regionName, fetchLocation, isLoading } = useLocationStore();

    useEffect(() => {
        // 컴포넌트 마운트 시 최초 1회 위치 확인
        fetchLocation();
    }, [fetchLocation]);

    return (
        <header className="sticky top-0 w-full max-w-inherit bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between z-50">
            <div 
                className="flex items-center space-x-1 font-bold text-lg text-[#3E2723] cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => fetchLocation()}
                title="위치 새로고침"
            >
                <MapPin 
                    size={20} 
                    className={`text-[#2E7D32] ${isLoading ? 'animate-pulse' : ''}`} 
                />
                <span className={isLoading ? "text-gray-400" : ""}>
                    {regionName}
                </span>
            </div>
            <div className="flex items-center space-x-4">
                <Search size={22} className="text-gray-700 cursor-pointer" />
                <Bell size={22} className="text-gray-700 cursor-pointer" />
            </div>
        </header>
    );
}
