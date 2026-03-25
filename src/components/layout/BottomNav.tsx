"use client";

import Link from "next/link";
import { Home, Search, MessageSquare, User, PlusCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: "홈", path: "/" },
        { icon: Search, label: "동네정보", path: "/info" },
        { icon: PlusCircle, label: "글쓰기", path: "/write" },
        { icon: MessageSquare, label: "채팅", path: "/chat" },
        { icon: User, label: "나의 동플", path: "/profile" },
    ];

    return (
        <nav className="fixed bottom-0 w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-white border-t border-gray-100 flex justify-around items-center h-16 px-4 z-50">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`flex flex-col items-center justify-center space-y-1 ${isActive ? "text-[#795548]" : "text-gray-400"
                            }`}
                    >
                        <Icon size={24} />
                        <span className="text-xs">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
