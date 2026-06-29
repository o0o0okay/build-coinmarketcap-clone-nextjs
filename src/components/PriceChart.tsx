import { useMemo, useRef, useState, useEffect, useId } from "react";

export type RangeKey = "1H" | "24H" | "7D" | "1M" | "3M" | "1Y" | "YTD" | "ALL";

export type RangeConfig = {
  key: RangeKey;
  label: string;
  points: number[];
  startTime: number;
  intervalMs: number;
  changePct: number;
};

type Props = {
  range: RangeConfig;
};

const PAD = { top: 20, right: 68, bottom: 36, left: 10 };
const VW = 1000;
const VH = 400;

function fmt$(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
function fmtK(v: number) {
  return (v / 1000).toFixed(2) + "K";
}
function fmtB(v: number) {
  return "$" + v.toFixed(2) + "B";
}
function fmtTime(ts: number, key: RangeKey) {
  const d = new Date(ts);
  if (key === "1H" || key === "24H") return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDateTime(ts: number, key: RangeKey) {
  const d = new Date(ts);
  if (key === "1H" || key === "24H") {
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "2-digit" }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export default function PriceChart({ range }: Props) {
  const uid = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [wrapW, setWrapW] = useState(0);
  const [wrapH, setWrapH] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWrapW(el.clientWidth);
      setWrapH(el.clientHeight);
    });
    ro.observe(el);
    setWrapW(el.clientWidth);
    setWrapH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const { pts, xForIdx, yForPrice, yStart, priceTicks, timeTicks, pathD, startPrice, lastPrice } = useMemo(() => {
    const pts = range.points;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const pad = (max - min) * 0.1 || max * 0.005;
    const yMin = min - pad;
    const yMax = max + pad;

    const cw = VW - PAD.left - PAD.right;
    const ch = VH - PAD.top - PAD.bottom;

    const xForIdx = (i: number) => PAD.left + (i / (pts.length - 1)) * cw;
    const yForPrice = (p: number) => PAD.top + (1 - (p - yMin) / (yMax - yMin)) * ch;

    let d = "";
    pts.forEach((p, i) => {
      const x = xForIdx(i);
      const y = yForPrice(p);
      d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    });

    const startPrice = pts[0];
    const lastPrice = pts[pts.length - 1];
    const yStart = yForPrice(startPrice);

    const nY = 6;
    const priceTicks: { y: number; value: number }[] = [];
    for (let i = 0; i <= nY; i++) {
      const v = yMin + (i / nY) * (yMax - yMin);
      priceTicks.push({ y: yForPrice(v), value: v });
    }

    const nX = 6;
    const timeTicks: { x: number; label: string }[] = [];
    for (let i = 0; i <= nX; i++) {
      const idx = Math.round((i / nX) * (pts.length - 1));
      const ts = range.startTime + idx * range.intervalMs;
      timeTicks.push({ x: xForIdx(idx), label: fmtTime(ts, range.key) });
    }

    return { pts, xForIdx, yForPrice, yStart, priceTicks, timeTicks, pathD: d, startPrice, lastPrice };
  }, [range]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const xSvg = xRatio * VW;
    const cw = VW - PAD.left - PAD.right;
    const rel = (xSvg - PAD.left) / cw;
    const idx = Math.max(0, Math.min(pts.length - 1, Math.round(rel * (pts.length - 1))));
    setHoverIdx(idx);
  };

  const handleTouch = (e: React.TouchEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || !e.touches[0]) return;
    const rect = svg.getBoundingClientRect();
    const xRatio = (e.touches[0].clientX - rect.left) / rect.width;
    const xSvg = xRatio * VW;
    const cw = VW - PAD.left - PAD.right;
    const rel = (xSvg - PAD.left) / cw;
    const idx = Math.max(0, Math.min(pts.length - 1, Math.round(rel * (pts.length - 1))));
    setHoverIdx(idx);
  };

  const isUp = lastPrice >= startPrice;
  const tagColor = isUp ? "#16C784" : "#EA3943";

  const lastX = xForIdx(pts.length - 1);
  const firstX = xForIdx(0);
  const areaD = `${pathD} L ${lastX.toFixed(2)} ${yStart.toFixed(2)} L ${firstX.toFixed(2)} ${yStart.toFixed(2)} Z`;

  // px position of hover inside wrapper div (real pixels)
  const hoverPxX = hoverIdx != null ? (xForIdx(hoverIdx) / VW) * wrapW : 0;
  const hoverPxY = hoverIdx != null ? (yForPrice(pts[hoverIdx]) / VH) * wrapH : 0;

  const volBars = useMemo(() => {
    return pts.map((_, i) => {
      const h = 10 + ((Math.sin(i * 0.37 + 1.2) + 1) / 2) * 18 + ((Math.cos(i * 0.71 + 3.4) + 1) / 2) * 8;
      return { h: Math.max(6, h) };
    });
  }, [pts]);

  const clipAbove = `clipAbove-${uid}`;
  const clipBelow = `clipBelow-${uid}`;
  const gradGreen = `gradGreen-${uid}`;
  const gradRed = `gradRed-${uid}`;

  const hoverPrice = hoverIdx != null ? pts[hoverIdx] : null;
  const hoverTs = hoverIdx != null ? range.startTime + hoverIdx * range.intervalMs : null;

  const TOOLTIP_W = 224; // px — fixed width so we can flip properly
  const isRightHalf = wrapW > 0 && hoverPxX > wrapW / 2;

  return (
    <div className="w-full select-none">
      {/* Controls – responsive wrap on mobile */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 px-1 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex rounded-lg bg-[#EFF2F5] p-0.5">
            <button className="rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-[#0D1421] shadow-sm sm:px-3 sm:text-[13px]">Price</button>
            <button className="px-2.5 py-1 text-[12px] font-medium text-[#808A9D] sm:px-3 sm:text-[13px]">Mkt Cap</button>
          </div>
          <button className="flex items-center gap-1 rounded-lg bg-[#EFF2F5] px-2 py-1 text-[#808A9D]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-8"/></svg>
          </button>
          <button className="flex items-center gap-1 rounded-lg bg-[#EFF2F5] px-2 py-1 text-[12px] font-medium text-[#808A9D]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="12" width="3" height="8"/><rect x="9" y="8" width="3" height="12"/><rect x="15" y="4" width="3" height="16"/><rect x="21" y="10" width="3" height="10"/></svg>
            <span className="hidden sm:inline">TradingView</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button className="flex items-center gap-1 rounded-lg bg-[#EFF2F5] px-2.5 py-1 text-[12px] font-medium text-[#808A9D] sm:px-3">
            Compare <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div className="flex rounded-lg bg-[#EFF2F5] p-0.5">
            <button className="rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-[#0D1421] shadow-sm sm:px-2.5">24h</button>
            <button className="px-2 py-1 text-[12px] font-medium text-[#808A9D] sm:px-2.5">1M</button>
            <button className="px-2 py-1 text-[12px] font-medium text-[#808A9D] sm:px-2.5">All</button>
            <button className="px-1.5 py-1 text-[#808A9D]"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg></button>
          </div>
          <button className="rounded-lg bg-[#EFF2F5] p-1.5 text-[#808A9D]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9m9 10H5m7-10V4m-4 10v3m0-10h4"/></svg>
          </button>
        </div>
      </div>

      {/* Chart wrapper – measure real px size here */}
      <div ref={wrapRef} className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          className="h-[240px] w-full sm:h-[300px] md:h-[360px] lg:h-[400px]"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
          onTouchMove={handleTouch}
          onTouchEnd={() => setHoverIdx(null)}
        >
          <defs>
            <clipPath id={clipAbove}>
              <rect x="0" y="0" width={VW} height={yStart} />
            </clipPath>
            <clipPath id={clipBelow}>
              <rect x="0" y={yStart} width={VW} height={VH - yStart} />
            </clipPath>
            <linearGradient id={gradGreen} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#16C784" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#16C784" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id={gradRed} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#EA3943" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#EA3943" stopOpacity="0.10" />
            </linearGradient>
          </defs>

          {/* Chart bg */}
          <rect x={PAD.left} y={PAD.top} width={VW - PAD.left - PAD.right} height={VH - PAD.top - PAD.bottom} fill="#FAFBFC" />

          {/* Horizontal grid */}
          {priceTicks.map((t, i) => (
            <g key={i}>
              <line x1={PAD.left} x2={VW - PAD.right} y1={t.y} y2={t.y} stroke="#EFF2F5" strokeWidth="1" />
              <text x={VW - PAD.right + 8} y={t.y + 4} fill="#A6B0C3" fontSize="11" fontWeight="500">{fmtK(t.value)}</text>
            </g>
          ))}

          {/* Volume bars */}
          <g opacity="0.07">
            {volBars.map((v, i) => (
              <rect key={i} x={xForIdx(i) - 1.5} y={VH - PAD.bottom - v.h} width="3" height={v.h} fill="#CFD6E4" rx="1" />
            ))}
          </g>

          {/* Baseline */}
          <line x1={PAD.left} x2={VW - PAD.right} y1={yStart} y2={yStart} stroke="#A6B0C3" strokeDasharray="1.5 3" strokeWidth="1" />
          <text x={PAD.left + 4} y={yStart - 5} fill="#A6B0C3" fontSize="10" fontWeight="600">{fmtK(startPrice)}</text>

          {/* Area fills */}
          <path d={areaD} fill={`url(#${gradGreen})`} clipPath={`url(#${clipAbove})`} />
          <path d={areaD} fill={`url(#${gradRed})`} clipPath={`url(#${clipBelow})`} />

          {/* Price line – dual color */}
          <path d={pathD} fill="none" stroke="#16C784" strokeWidth="1.5" clipPath={`url(#${clipAbove})`} strokeLinejoin="round" strokeLinecap="round" />
          <path d={pathD} fill="none" stroke="#EA3943" strokeWidth="1.5" clipPath={`url(#${clipBelow})`} strokeLinejoin="round" strokeLinecap="round" />

          {/* Hover horizontal price line + grey label */}
          {hoverIdx !== null && hoverPrice != null && (
            <g>
              <line x1={PAD.left} x2={VW - PAD.right} y1={yForPrice(hoverPrice)} y2={yForPrice(hoverPrice)} stroke="#A6B0C3" strokeDasharray="2 3" strokeWidth="1" />
              <rect x={VW - PAD.right + 4} y={yForPrice(hoverPrice) - 10} width={50} height={20} rx={4} fill="#58667E" />
              <text x={VW - PAD.right + 29} y={yForPrice(hoverPrice) + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">{fmtK(hoverPrice)}</text>
            </g>
          )}

          {/* Last price tag */}
          <g>
            <rect x={VW - PAD.right + 4} y={yForPrice(lastPrice) - 10} width={50} height={20} rx={4} fill={tagColor} />
            <text x={VW - PAD.right + 29} y={yForPrice(lastPrice) + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{fmtK(lastPrice)}</text>
          </g>

          {/* Crosshair */}
          {hoverIdx !== null && (
            <g>
              <line x1={xForIdx(hoverIdx)} x2={xForIdx(hoverIdx)} y1={PAD.top} y2={VH - PAD.bottom} stroke="#CFD6E4" strokeDasharray="3 3" strokeWidth="1" />
              <circle cx={xForIdx(hoverIdx)} cy={yForPrice(pts[hoverIdx])} r="5" fill={pts[hoverIdx] >= startPrice ? "#16C784" : "#EA3943"} stroke="white" strokeWidth="2.5" />
            </g>
          )}

          {/* X labels */}
          {timeTicks.map((t, i) => (
            <text key={i} x={t.x} y={VH - 10} textAnchor="middle" fill="#A6B0C3" fontSize="11" fontWeight="500">{t.label}</text>
          ))}

          {/* USD label */}
          <text x={VW - PAD.right + 8} y={VH - 10} fill="#A6B0C3" fontSize="11" fontWeight="600">USD</text>

          {/* Watermark */}
          <g opacity="0.05" transform={`translate(${VW - PAD.right - 150}, ${VH - PAD.bottom - 50})`}>
            <circle cx="12" cy="12" r="11" fill="none" stroke="#808A9D" strokeWidth="1.5" />
            <path d="M7 12l5-5 5 5" fill="none" stroke="#808A9D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="30" y="16" fill="#808A9D" fontSize="15" fontWeight="700" letterSpacing="-0.3">CoinMarketCap</text>
          </g>
        </svg>

        {/* Tooltip card — flips left/right based on which half the cursor is in */}
        {hoverIdx !== null && hoverPrice != null && hoverTs != null && wrapW > 0 && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border border-[#EFF2F5] bg-white p-3 shadow-xl"
            style={{
              width: TOOLTIP_W,
              top: Math.max(8, hoverPxY - 90),
              // left half → tooltip appears to the RIGHT of crosshair
              // right half → tooltip appears to the LEFT of crosshair
              ...(isRightHalf
                ? { left: Math.max(0, hoverPxX - TOOLTIP_W - 16) }
                : { left: Math.min(hoverPxX + 16, wrapW - TOOLTIP_W) }),
            }}
          >
            <div className="flex items-center justify-between text-[11px] text-[#0D1421]">
              <span className="font-semibold">{fmtDate(hoverTs)}</span>
              <span className="ml-2 text-[#A6B0C3]">
                {new Date(hoverTs).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[12px]">
              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: hoverPrice >= startPrice ? "#16C784" : "#EA3943" }} />
              <span className="text-[#A6B0C3]">Price:</span>
              <span className="font-bold text-[#0D1421]">{fmt$(hoverPrice)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[12px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A6B0C3" strokeWidth="2" className="flex-shrink-0"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span className="text-[#A6B0C3]">Vol 24h:</span>
              <span className="font-bold text-[#0D1421]">{fmtB(18 + Math.sin(hoverIdx * 0.1) * 2)}</span>
            </div>
          </div>
        )}

        {/* Bottom date stamp below x-axis */}
        {hoverIdx !== null && hoverTs != null && wrapW > 0 && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded bg-[#58667E] px-2 py-0.5 text-[10px] font-medium text-white"
            style={{
              left: hoverPxX,
              bottom: 2,
            }}
          >
            {fmtDateTime(hoverTs, range.key)}
          </div>
        )}
      </div>
    </div>
  );
}
