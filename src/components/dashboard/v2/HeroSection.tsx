"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, PartyPopper, ArrowRight, Store, CloudSun } from "lucide-react";
import Link from "next/link";

const slides = [
  {
    id: 1,
    badge: "30,000+ 이웃들이 기록 중",
    icon: <Users size={14} className="text-[#A67C52]" />,
    title: <>내발문자<br /><span className="bg-gradient-to-r from-[#A67C52] to-[#D7CCC8] bg-clip-text text-transparent">내 발자국이 머문 자리</span>를 기록하세요</>,
    desc: "지금 이 순간, 내가 다녀간 곳의 소식을\n가장 빠르고 정확하게 만나보세요.",
    cta: "지금 바로 시작하기",
    href: "/map",
    color: "bg-[#795548]"
  },
  {
    id: 2,
    badge: "동네 사장님들의 핫한 소식",
    icon: <Store size={14} className="text-green-400" />,
    title: <>지금 내 주변<br /><span className="bg-gradient-to-r from-green-400 to-emerald-200 bg-clip-text text-transparent">맛집과 할인 정보</span></>,
    desc: "우리 동네 단골 가게의 오늘 소식,\n놓치지 말고 확인해 보세요!",
    cta: "동네 가게 둘러보기",
    href: "/map?q=만석공원 맛집",
    color: "bg-[#2E7D32]"
  },
  {
    id: 3,
    badge: "오늘의 우리 동네 테마",
    icon: <CloudSun size={14} className="text-blue-400" />,
    title: <>맑은 하늘 아래,<br /><span className="bg-gradient-to-r from-blue-400 to-sky-200 bg-clip-text text-transparent">함께 산책할까요?</span></>,
    desc: "만석공원 이번 주말 인기 산책 코스,\n이웃들이 추천하는 장소를 확인하세요.",
    cta: "산책 코스 보기",
    href: "/map?q=만석공원",
    color: "bg-blue-600"
  }
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative px-6 pt-12 pb-24 overflow-hidden bg-background text-foreground rounded-b-[40px] shadow-2xl h-[480px] transition-colors duration-500">
      {/* Dynamic Background Orbs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 transition-colors duration-1000 dark:opacity-20`}
        >
          <div className={`absolute top-[-10%] left-[-10%] w-64 h-64 ${slides[current].color} rounded-full blur-[100px]`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-64 h-64 ${slides[(current + 1) % slides.length].color} rounded-full blur-[100px]`} />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-foreground/5 backdrop-blur-md rounded-full border border-foreground/10 mb-6">
              {slides[current].icon}
              <span className="text-[11px] font-bold tracking-tight text-foreground/80">
                {slides[current].badge}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black mb-4 leading-[1.2] tracking-tight text-foreground">
              {slides[current].title}
            </h1>

            <p className="text-sm text-foreground/60 mb-8 max-w-[280px] leading-relaxed font-medium whitespace-pre-line">
              {slides[current].desc}
            </p>

            <Link href={slides[current].href}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex items-center space-x-2 bg-gradient-to-br from-foreground to-[#3E2723] dark:from-[#1D1616] dark:to-black px-8 py-4 rounded-2xl font-bold shadow-xl border border-white/10 text-white transition-all"
              >
                <PartyPopper size={20} className="text-white" />
                <span>{slides[current].cta}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Interactive Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current ? 'w-6 h-1.5 bg-foreground' : 'w-1.5 h-1.5 bg-foreground/30'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
