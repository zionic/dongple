"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Category {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface MapOverlayProps {
    categories: Category[];
    selectedCategory: string;
    onCategorySelect: (id: string) => void;
    specialFilters: { barrierFree: boolean, petFriendly: boolean };
    onSpecialFilterToggle: (type: 'barrierFree' | 'petFriendly') => void;
    isResultOpen: boolean;
    searchResults: any[];
    onSelectPlace: (place: any) => void;
}

export default function MapOverlay({
    categories,
    selectedCategory,
    onCategorySelect,
    specialFilters,
    onSpecialFilterToggle,
    isResultOpen,
    searchResults,
    onSelectPlace
}: MapOverlayProps) {
    return (
        <div className="flex flex-col space-y-3">
            {/* Special Filters (Barrier-free, Pet-friendly) */}
            <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="flex items-center space-x-2 pointer-events-auto"
            >
                <button
                    onClick={() => onSpecialFilterToggle('barrierFree')}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all border flex items-center space-x-1.5 ${
                        specialFilters.barrierFree
                        ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20"
                        : "bg-white/50 backdrop-blur-md text-blue-500/60 border-blue-100 hover:border-blue-200"
                    }`}
                >
                    <span>♿ 편한 접근</span>
                </button>
                <button
                    onClick={() => onSpecialFilterToggle('petFriendly')}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all border flex items-center space-x-1.5 ${
                        specialFilters.petFriendly
                        ? "bg-green-500 text-white border-green-500 shadow-md shadow-green-500/20"
                        : "bg-white/50 backdrop-blur-md text-green-500/60 border-green-100 hover:border-green-200"
                    }`}
                >
                    <span>🐶 반려동물 동반</span>
                </button>
                <div className="w-[1px] h-4 bg-border mx-1" />
            </motion.div>

            {/* Category Filter Chips */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }}
                className="flex overflow-x-auto pb-2 space-x-2 no-scrollbar pointer-events-auto"
            >
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategorySelect(cat.id)}
                        className={`px-4 py-2.5 rounded-2xl text-[13px] font-black whitespace-nowrap transition-all border flex items-center space-x-2 ${
                            selectedCategory === cat.id
                            ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20"
                            : "bg-nav-bg/80 backdrop-blur-xl text-foreground/50 border-border hover:bg-card-bg"
                        }`}
                    >
                        <cat.icon size={14} />
                        <span>{cat.label}</span>
                    </button>
                ))}
            </motion.div>

            <AnimatePresence>
                {isResultOpen && searchResults.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 10 }} 
                        className="bg-nav-bg backdrop-blur-2xl rounded-[32px] shadow-2xl mt-4 p-2 max-h-[400px] overflow-y-auto pointer-events-auto border border-border/50"
                    >
                        {searchResults.map((place, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => onSelectPlace(place)} 
                                className="p-4 hover:bg-foreground/5 rounded-2xl cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-1 gap-2">
                                    <h5 className="font-black text-[15px] text-foreground flex-1" dangerouslySetInnerHTML={{ __html: place.title }} />
                                    {place.distance && (
                                        <span className="text-[11px] font-black text-secondary shrink-0 pt-0.5">{place.distance}</span>
                                    )}
                                </div>
                                <p className="text-[12px] text-foreground/40 font-bold">{place.roadAddress || place.address}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
