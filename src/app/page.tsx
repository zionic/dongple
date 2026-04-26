"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, MapPinned, Navigation, PartyPopper, Plus, Smile } from "lucide-react";
import { fetchOfficialEvents, OfficialEvent } from "@/services/eventService";
import { fetchLiveStatus, LiveStatus, subscribeLiveUpdates } from "@/services/statusService";
import { useUIStore } from "@/lib/store/uiStore";

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
    message: "사람 많음 / 이동 천천히",
    trust_score: 1,
    is_hidden: false,
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
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

export default function Home() {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [events, setEvents] = useState<OfficialEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const openBottomSheet = useUIStore((state) => state.openBottomSheet);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [liveData, eventData] = await Promise.all([fetchLiveStatus(), fetchOfficialEvents()]);
        setStatuses(liveData as StatusItem[]);
        setEvents(eventData);
      } catch (error) {
        console.error("Failed to load home decision data:", error);
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

  const crowdedPlace = useMemo(() => {
    const crowded = visibleStatuses
      .filter((item) => getDecisionStatus(item.status, item.is_request) === "crowded")
      .sort(sortBySignal);

    return crowded[0] ?? [...visibleStatuses].sort(sortBySignal)[0];
  }, [visibleStatuses]);

  const quietPlace = useMemo(() => {
    const quiet = visibleStatuses
      .filter((item) => getDecisionStatus(item.status, item.is_request) === "quiet")
      .sort(sortByRecent);

    return quiet[0] ?? visibleStatuses.find((item) => item.id !== crowdedPlace?.id) ?? visibleStatuses[0];
  }, [crowdedPlace?.id, visibleStatuses]);

  const eventStatus = useMemo(() => {
    const eventLikeStatus =
      visibleStatuses.find((item) => Boolean(item.tourapi_content_id)) ??
      visibleStatuses.find((item) => item.category?.includes("행사") || item.category?.includes("축제"));

    return {
      event: events[0],
      status: eventLikeStatus,
    };
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

  const openShare = (item?: StatusItem) => {
    openBottomSheet("liveCreate", {
      mode: "share",
      address: item?.place_name,
      latitude: item?.latitude,
      longitude: item?.longitude,
    });
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-32 pt-10 text-foreground">
      <header className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase text-secondary">Dongple Now</p>
          <h1 className="mt-1 text-3xl font-black">지금 어디가 살아있을까?</h1>
        </div>
        <button
          type="button"
          onClick={() => openShare()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg"
          aria-label="지금 상태 공유"
        >
          <Plus size={24} />
        </button>
      </header>

      <main className="space-y-6">
        {isLoading ? (
          <DecisionSkeleton />
        ) : (
          <>
            <section className="space-y-3">
              <SectionTitle icon={<Flame size={18} />} title="지금 가장 붐비는 곳" />
              <PlaceStatusCard
                item={crowdedPlace}
                fallbackStatus="crowded"
                tone="hot"
                onShare={() => openShare(crowdedPlace)}
              />
            </section>

            <section className="space-y-3">
              <SectionTitle icon={<Smile size={18} />} title="지금 가기 좋은 곳" />
              <PlaceStatusCard
                item={quietPlace}
                fallbackStatus="quiet"
                tone="good"
                onShare={() => openShare(quietPlace)}
              />
            </section>

            <StatusSummary summary={summary} />

            <section className="space-y-3">
              <SectionTitle icon={<PartyPopper size={18} />} title="오늘의 행사 상황" />
              <EventStatusCard
                event={eventStatus.event}
                status={eventStatus.status}
                onShare={() => openShare(eventStatus.status)}
              />
            </section>
          </>
        )}

        <Link
          href="/map"
          className="flex h-14 items-center justify-center rounded-2xl bg-foreground text-sm font-black text-background shadow-xl"
        >
          <MapPinned size={18} className="mr-2" />
          지도에서 전체 보기
          <ArrowRight size={18} className="ml-2" />
        </Link>
      </main>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center space-x-2 text-lg font-black">
      <span className="text-secondary">{icon}</span>
      <h2>{title}</h2>
    </div>
  );
}

function PlaceStatusCard({
  item,
  fallbackStatus,
  tone,
  onShare,
}: {
  item?: StatusItem;
  fallbackStatus: DecisionStatus;
  tone: "hot" | "good";
  onShare: () => void;
}) {
  const decision = item ? getDecisionStatus(item.status, item.is_request) : fallbackStatus;
  const status = getStatusMeta(decision);
  const tags = getTags(item);

  return (
    <article
      className={`rounded-[28px] border p-5 shadow-sm ${
        tone === "hot"
          ? "border-red-100 bg-red-50/80 shadow-red-900/5"
          : "border-green-100 bg-green-50/80 shadow-green-900/5"
      }`}
    >
      <Link href={`/map?q=${encodeURIComponent(item?.place_name ?? "")}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-2xl font-black text-foreground">
              {item?.place_name ?? "상태를 기다리는 중"}
            </h3>
            <StatusLine decision={decision} timeAgo={getTimeAgo(item?.created_at)} />
          </div>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${status.bg}`}>
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: status.color }} />
          </div>
        </div>

        <TagRow tags={tags} />
      </Link>

      <button
        type="button"
        onClick={onShare}
        className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-black text-foreground shadow-sm"
      >
        지금 상태 공유
      </button>
    </article>
  );
}

function EventStatusCard({
  event,
  status,
  onShare,
}: {
  event?: OfficialEvent;
  status?: StatusItem;
  onShare: () => void;
}) {
  const decision = status ? getDecisionStatus(status.status, status.is_request) : "normal";
  const tags = status ? getTags(status) : ["상태 확인 필요", "공유 기다림"];

  return (
    <article className="rounded-[28px] border border-border bg-card-bg p-5 shadow-sm">
      <Link href={event ? `/map?q=${encodeURIComponent(event.title)}` : "/events"} className="block">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black">{event?.title ?? status?.place_name ?? "주변 행사"}</h3>
            <StatusLine decision={decision} timeAgo={getTimeAgo(status?.created_at)} />
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
            <PartyPopper size={20} />
          </div>
        </div>
        <TagRow tags={tags} />
      </Link>

      <button
        type="button"
        onClick={onShare}
        className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-foreground text-sm font-black text-background"
      >
        지금 공유
      </button>
    </article>
  );
}

function StatusSummary({ summary }: { summary: Record<DecisionStatus, number> }) {
  const total = Math.max(summary.crowded + summary.normal + summary.quiet, 1);

  return (
    <section className="rounded-[24px] border border-border bg-card-bg p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Navigation size={18} className="text-secondary" />
          <h2 className="text-lg font-black">내 주변 상태</h2>
        </div>
        <span className="text-xs font-bold text-foreground/45">최근 업데이트 기준</span>
      </div>

      <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-foreground/5">
        <div className="bg-[#ff4d4f]" style={{ width: `${(summary.crowded / total) * 100}%` }} />
        <div className="bg-[#faad14]" style={{ width: `${(summary.normal / total) * 100}%` }} />
        <div className="bg-[#52c41a]" style={{ width: `${(summary.quiet / total) * 100}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <SummaryCount label="붐빔" value={summary.crowded} color="#ff4d4f" />
        <SummaryCount label="보통" value={summary.normal} color="#faad14" />
        <SummaryCount label="한산" value={summary.quiet} color="#52c41a" />
      </div>
    </section>
  );
}

function SummaryCount({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.03] px-3 py-3">
      <div className="mx-auto mb-1 h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <p className="text-xl font-black">{value}</p>
      <p className="text-[11px] font-bold text-foreground/50">{label}</p>
    </div>
  );
}

function StatusLine({ decision, timeAgo }: { decision: DecisionStatus; timeAgo: string }) {
  const status = getStatusMeta(decision);

  return (
    <div className="mt-2 flex items-center text-sm font-black" style={{ color: status.color }}>
      <span className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
      지금 {status.label}
      <span className="ml-2 text-xs font-bold text-foreground/40">({timeAgo})</span>
    </div>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.slice(0, 3).map((tag) => (
        <span key={tag} className="rounded-full bg-white/80 px-3 py-1 text-[12px] font-bold text-foreground/65">
          {tag}
        </span>
      ))}
    </div>
  );
}

function DecisionSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-36 animate-pulse rounded-[28px] bg-foreground/5" />
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
    return { label: "붐빔", color: "#ff4d4f", bg: "bg-red-100" };
  }

  if (status === "quiet") {
    return { label: "한산", color: "#52c41a", bg: "bg-green-100" };
  }

  return { label: "보통", color: "#faad14", bg: "bg-yellow-100" };
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

function sortBySignal(a: StatusItem, b: StatusItem) {
  const verifyDiff = (b.verified_count ?? 0) - (a.verified_count ?? 0);
  if (verifyDiff !== 0) return verifyDiff;
  return sortByRecent(a, b);
}

function sortByRecent(a: StatusItem, b: StatusItem) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}
