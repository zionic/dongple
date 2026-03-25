"use client";

import { MapPin, Search, Bell } from "lucide-react";

export default function Header() {
    return (
        <header className="sticky top-0 w-full max-w-inherit bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between z-50">
            <div className="flex items-center space-x-1 font-bold text-lg text-[#3E2723]">
                <MapPin size={20} className="text-[#2E7D32]" />
                <span>수원 정자동</span>
            </div>
            <div className="flex items-center space-x-4">
                <Search size={22} className="text-gray-700 cursor-pointer" />
                <Bell size={22} className="text-gray-700 cursor-pointer" />
            </div>
        </header>
    );
}
