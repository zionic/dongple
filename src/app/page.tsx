"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, MapPinned, Navigation, PartyPopper, Radio, Smile } from "lucide-react";
import { fetchOfficialEvents, OfficialEvent } from "@/services/eventService";
import { fetchLiveStatus, LiveStatus, subscribeLiveUpdates } from "@/services/statusService";

type DecisionStatus = "crowded" | "normal" | "quiet";

type StatusItem = LiveStatus & {
  history?: { status: string; status_color: string; text: string; time: string }[];
};

const fallbackStatuses: StatusItem[] = [
  {
    id: "fallback-crowded",
    place_name: "만석공원 산책로",
    category: "공원",
    status: "혼잡",
    status_color: "text-red-500",
    is_request: false,
    verified_count: 3,
    message: "대기 김 / 사람 많음",
    trust_score: 1,
    is_hidden: false,
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
  },
  {
    id: "fallback-normal",
    place_name: "수원 화성 광장",
    category: "관광",
    status: "보통",
    status_color: "text-yellow-500",
    is_request: false,
    verified_count: 2,
    message: "산책 무난함 / 사진 찍기 좋음",
    trust_score: 1,
    is_hidden: false,
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
  },
  {
    id: "fallback-quiet",
    place_name: "동네 카페 골목",
    category: "카페/식당",
    status: "여유",
    status_color: "text-green-500",
    is_request: false,
    verified_count: 2,
    message: "조용함 / 자리 있음",
    trust_score: 1,
    is_hidden: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
  },
];

const positiveTags = ["조용함", "자리 있음", "이동 편함", "나들이 좋음"];

export default function Home() {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [events, setEvents] = useState<OfficialEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [liveData, eventData] = await Promise.all([fetchLiveStatus(), fetchOfficialEvents()]);
        setStatuses(liveData as StatusItem[]);
        setEvents(eventData);
      } catch (error) {
        console.error("Failed to load home slider data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
    const sub = subscribeLiveUpdates(loadHomeData);

    return () => {
      sub.unsubscribe();
    };
  }, []);

  const visibleStatuses = statuses.length > 0 ? statuses : fallbackStatuses;

  const crowdedPlaces = useMemo(() => {
    return visibleStatuses
      .filter((item) => getDecisionStatus(item.status, item.is_request) === "crowded")
      .sort(sortCrowded)
      .slice(0, 5);
  }, [visibleStatuses]);

  const goodPlaces = useMemo(() => {
    return visibleStatuses
      .filter((item) => getDecisionStatus(item.status, item.is_request) === "quiet")
      .sort(sortGoodPlace)
      .slice(0, 5);
  }, [visibleStatuses]);

  const eventCards = useMemo(() => {
    return events.slice(0, 5).map((event) => {
      const matchedStatus = visibleStatuses.find(
        (item) =>
          item.tourapi_content_id === String(event.id) ||
          item.place_name === event.title ||
          item.place_name.includes(event.title) ||
          event.title.includes(item.place_name),
      );

      return { event, status: matchedStatus };
    });
  }, [events, visibleStatuses]);

  const summary = useMemo(() => {
    return visibleStatuses.reduce(
      (acc, item) => {
        acc[getDecisionStatus(item.status, item.is_request)] += 1;
        return acc;
      },
      { crowded: 0, normal: 0, quiet: 0 },
    );
  }, [visibleStatuses]);

  const liveBoardItems = useMemo(() => {
    return [...visibleStatuses].sort(sortByRecent).slice(0, 5);
  }, [visibleStatuses]);

  return (
    <div className="min-h-screen bg-background pb-32 pt-10 text-foreground">
      <header className="mb-8 px-5">
        <p className="text-[12px] font-black tracking-wider text-secondary">DONGPLE NOW</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">지금 어디가 살아있을까?</h1>
      </header>

      <main className="space-y-8">
        {isLoading ? (
          <DecisionSkeleton />
        ) : (
          <>
            <CardSlider
              icon={<Flame size={18} />}
              title="지금 붐비는 곳"
              emptyTitle="아직 붐빈 곳이 없어요"
              emptyDescription="지금 주변 상태를 공유해보세요"
            >
              {crowdedPlaces.map((item) => (
                <PlaceSliderCard key={item.id} item={item} />
              ))}
            </CardSlider>

            <CardSlider
              icon={<Smile size={18} />}
              title="지금 가기 좋은 곳"
              emptyTitle="아직 한산한 곳이 없어요"
              emptyDescription="주변을 확인해볼까요?"
            >
              {goodPlaces.map((item) => (
                <PlaceSliderCard key={item.id} item={item} />
              ))}
            </CardSlider>

            <CardSlider
              icon={<PartyPopper size={18} />}
              title="오늘 행사 상황"
              emptyTitle="오늘 행사가 없어요"
              emptyDescription="지도에서 주변 상태를 먼저 확인해보세요"
            >
              {eventCards.map(({ event, status }) => (
                <EventSliderCard key={event.id} event={event} status={status} />
              ))}
            </CardSlider>

            <section className="px-5">
              <StatusSummary summary={summary} />
            </section>

            <section className="px-5">
              <LiveSituationBoard items={liveBoardItems} />
            </section>
          </>
        )}

        <div className="px-5">
          <Link
            href="/map?view=all"
            className="flex h-14 items-center justify-center rounded-2xl bg-foreground text-sm font-black text-background shadow-xl"
          >
            <MapPinned size={18} className="mr-2" />
            지도에서 전체 보기
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function CardSlider({
  icon,
  title,
  emptyTitle,
  emptyDescription,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
}) {
  const hasCards = Boolean(children) && !(Array.isArray(children) && children.length === 0);

  return (
    <section className="space-y-4">
      <SectionTitle icon={icon} title={title} />
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 pt-1 no-scrollbar">
        {hasCards ? (
          children
        ) : (
          <EmptySliderCard title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </section>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center space-x-2 px-5 text-xl font-black tracking-tight">
      <span className="text-secondary">{icon}</span>
      <h2>{title}</h2>
    </div>
  );
}

function PlaceSliderCard({ item }: { item: StatusItem }) {
  const decision = getDecisionStatus(item.status, item.is_request);
  const status = getStatusMeta(decision);
  const tags = getTags(item);

  return (
    <article className={`min-w-[84%] shrink-0 snap-start rounded-[28px] border p-5 transition-transform active:scale-[0.99] ${status.cardClass}`}>
      <Link href={getStatusMapHref(item)} className="block">
        <h3 className="truncate text-2xl font-black tracking-tight">{item.place_name}</h3>
        <StatusLine decision={decision} createdAt={item.created_at} />
        <TagRow tags={tags} />
      </Link>
      <MapButton href={getStatusMapHref(item)} />
    </article>
  );
}

function EventSliderCard({ event, status }: { event: OfficialEvent; status?: StatusItem }) {
  const decision = status ? getDecisionStatus(status.status, status.is_request) : "normal";
  const tags = status ? getTags(status) : ["아직 현장 공유 없음"];
  const href = status ? getStatusMapHref(status) : `/map?place_id=${encodeURIComponent(String(event.id))}`;
  const statusMeta = status ? getStatusMeta(decision) : { cardClass: "border-border/60 bg-foreground/[0.03] shadow-lg backdrop-blur-2xl" };

  return (
    <article className={`min-w-[84%] shrink-0 snap-start rounded-[28px] border p-5 transition-transform active:scale-[0.99] ${statusMeta.cardClass}`}>
      <Link href={href} className="block">
        <div className="mb-2 flex items-center gap-2">
          <PartyPopper size={18} className="shrink-0 text-secondary" />
          <h3 className="truncate text-2xl font-black tracking-tight">{event.title}</h3>
        </div>
        {status ? (
          <StatusLine decision={decision} createdAt={status.created_at} />
        ) : (
          <p className="mt-3 text-[15px] font-black text-foreground/50">아직 현장 공유 없음</p>
        )}
        <TagRow tags={tags} />
      </Link>
      <MapButton href={href} label={status ? "지도 보기" : "첫 상태 남기기"} />
    </article>
  );
}

function MapButton({ href, label = "지도 보기" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-background/80 text-[15px] font-black text-foreground shadow-sm backdrop-blur-sm transition-all active:scale-[0.98]"
    >
      {label}
      <ArrowRight size={16} className="ml-1.5" />
    </Link>
  );
}

function EmptySliderCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-w-[84%] shrink-0 snap-start flex-col justify-center rounded-[28px] border border-dashed border-border/60 bg-foreground/[0.02] shadow-lg backdrop-blur-2xl p-6">
      <h3 className="text-xl font-black text-foreground/70">{title}</h3>
      <p className="mt-2 text-[14px] font-bold text-foreground/45">{description}</p>
      <MapButton href="/map?view=all" label="지도에서 확인" />
    </div>
  );
}

function StatusSummary({ summary }: { summary: Record<DecisionStatus, number> }) {
  const total = Math.max(summary.crowded + summary.normal + summary.quiet, 1);

  return (
    <section className="rounded-[24px] border border-border bg-card-bg p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Navigation size={20} className="text-secondary" />
          <h2 className="text-xl font-black tracking-tight">내 주변 상태 요약</h2>
        </div>
        <span className="rounded-md bg-foreground/5 px-2 py-1 text-[12px] font-bold text-foreground/40">최근 업데이트</span>
      </div>

      <div className="mb-6 flex h-3.5 overflow-hidden rounded-full bg-foreground/5">
        <div className="bg-[#ff4d4f] transition-all duration-1000" style={{ width: `${(summary.crowded / total) * 100}%` }} />
        <div className="bg-[#faad14] transition-all duration-1000" style={{ width: `${(summary.normal / total) * 100}%` }} />
        <div className="bg-[#52c41a] transition-all duration-1000" style={{ width: `${(summary.quiet / total) * 100}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <SummaryCount label="붐빔" value={summary.crowded} color="#ff4d4f" bgClass="bg-red-500/10" textClass="text-[#ff4d4f]" />
        <SummaryCount label="보통" value={summary.normal} color="#faad14" bgClass="bg-yellow-500/10" textClass="text-[#faad14]" />
        <SummaryCount label="한산" value={summary.quiet} color="#52c41a" bgClass="bg-green-500/10" textClass="text-[#52c41a]" />
      </div>
    </section>
  );
}

function LiveSituationBoard({ items }: { items: StatusItem[] }) {
  return (
    <section className="rounded-[24px] border border-border bg-card-bg p-5 shadow-sm">
      <div className="mb-5 flex items-center space-x-2">
        <Radio size={20} className="animate-pulse text-secondary" />
        <h2 className="text-xl font-black tracking-tight">지금 올라오는 상황</h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const decision = getDecisionStatus(item.status, item.is_request);
          const status = getStatusMeta(decision);

          return (
            <Link
              key={item.id}
              href={getStatusMapHref(item)}
              className="group flex items-center justify-between rounded-2xl bg-foreground/[0.02] px-4 py-3.5 transition-colors hover:bg-foreground/[0.04] active:scale-[0.99]"
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] font-black">{item.place_name}</p>
                <div className="mt-1 flex items-center text-[13px] font-bold text-foreground/50">
                  <span className="mr-1.5 flex h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} />
                  <span style={{ color: status.color }}>{status.label}</span>
                  <span className="mx-1.5 opacity-40">·</span>
                  <span>{getTimeAgo(item.created_at)}</span>
                </div>
              </div>
              <ArrowRight size={18} className="shrink-0 text-foreground/20 transition-transform group-hover:translate-x-1 group-hover:text-foreground/40" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SummaryCount({ label, value, color, bgClass, textClass }: { label: string; value: number; color: string; bgClass: string; textClass: string }) {
  return (
    <div className={`rounded-2xl ${bgClass} p-3`}>
      <div className="mx-auto mb-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <p className={`text-2xl font-black ${textClass}`}>{value}</p>
      <p className={`text-[12px] font-bold ${textClass} opacity-80`}>{label}</p>
    </div>
  );
}

function StatusLine({ decision, createdAt }: { decision: DecisionStatus; createdAt?: string }) {
  const status = getStatusMeta(decision);

  return (
    <div className="mt-4 flex flex-col gap-1">
      <div className="flex items-center text-lg font-black tracking-tight" style={{ color: status.color }}>
        <div className="relative mr-2 flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: status.color }} />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
        </div>
        지금 {status.label}
      </div>
      <p className="text-[13px] font-bold text-foreground/50">{getTimeAgo(createdAt)} 업데이트</p>
    </div>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {tags.slice(0, 3).map((tag) => (
        <span key={tag} className="rounded-md bg-background/60 px-2.5 py-1 text-[13px] font-bold text-foreground/70">
          {tag}
        </span>
      ))}
    </div>
  );
}

function DecisionSkeleton() {
  return (
    <div className="space-y-6 px-5">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-40 animate-pulse rounded-[28px] bg-foreground/5" />
      ))}
    </div>
  );
}

function getDecisionStatus(status: string, isRequest?: boolean): DecisionStatus {
  if (isRequest) return "normal";
  if (["혼잡", "붐빔", "많음", "답변대기"].includes(status)) return "crowded";
  if (["여유", "한산"].includes(status)) return "quiet";
  return "normal";
}

function getStatusMeta(status: DecisionStatus) {
  if (status === "crowded") {
    return { label: "붐빔", color: "#ff4d4f", cardClass: "border-red-500/30 bg-red-500/15 shadow-lg shadow-red-500/20 backdrop-blur-2xl" };
  }

  if (status === "quiet") {
    return { label: "한산", color: "#52c41a", cardClass: "border-green-500/30 bg-green-500/15 shadow-lg shadow-green-500/20 backdrop-blur-2xl" };
  }

  return { label: "보통", color: "#faad14", cardClass: "border-yellow-500/30 bg-yellow-500/15 shadow-lg shadow-yellow-500/20 backdrop-blur-2xl" };
}

function getTags(item?: StatusItem) {
  const source = item?.history?.[0]?.text || item?.message || "";
  const tags = source
    .split(/[\/,·|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (tags.length > 0) return tags;

  const decision = item ? getDecisionStatus(item.status, item.is_request) : "normal";
  if (decision === "crowded") return ["대기 김", "사람 많음"];
  if (decision === "quiet") return ["조용함", "자리 있음"];
  return ["무난함", "확인됨"];
}

function getTimeAgo(createdAt?: string) {
  if (!createdAt) return "방금 전";

  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  return `${Math.floor(diffHour / 24)}일 전`;
}

function getStatusMapHref(item?: StatusItem) {
  if (!item?.id || item.id.startsWith("fallback-")) {
    return `/map?q=${encodeURIComponent(item?.place_name ?? "")}`;
  }

  return `/map?place_id=${encodeURIComponent(item.id)}`;
}

function sortCrowded(a: StatusItem, b: StatusItem) {
  return sortByRecent(a, b) || (b.verified_count ?? 0) - (a.verified_count ?? 0);
}

function sortGoodPlace(a: StatusItem, b: StatusItem) {
  const tagDiff = countPositiveTags(b) - countPositiveTags(a);
  if (tagDiff !== 0) return tagDiff;
  return sortByRecent(a, b);
}

function countPositiveTags(item: StatusItem) {
  const text = getTags(item).join(" ");
  return positiveTags.filter((tag) => text.includes(tag)).length;
}

function sortByRecent(a: StatusItem, b: StatusItem) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}
