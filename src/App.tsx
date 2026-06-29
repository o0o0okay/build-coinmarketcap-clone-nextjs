import { useMemo, useState } from "react";
import PriceChart, { type RangeKey } from "./components/PriceChart";
import { rangeConfigs, BTC_QUOTE } from "./data/btcRanges";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1H", label: "1H" },
  { key: "24H", label: "24H" },
  { key: "7D", label: "7D" },
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "1Y", label: "1Y" },
  { key: "YTD", label: "YTD" },
  { key: "ALL", label: "All" },
];

function formatUsd(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
function formatCompact(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 });
}
function pct(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function App() {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("24H");
  const [btcAmount, setBtcAmount] = useState("1");
  const range = rangeConfigs[selectedRange];
  const currentPrice = range.points[range.points.length - 1];

  const usdValue = useMemo(() => {
    const n = Number.parseFloat(btcAmount);
    return Number.isFinite(n) ? n * currentPrice : 0;
  }, [btcAmount, currentPrice]);

  const rangeChangePositive = range.changePct >= 0;

  return (
    <div className="min-h-screen bg-white text-[#0D1421]" style={{ fontFamily: "Inter, -apple-system, system-ui, sans-serif" }}>

      {/* ── Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[#EFF2F5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3 lg:px-6">
          {/* Logo */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3861FB] text-sm font-bold text-white">C</div>
            <span className="hidden text-base font-semibold tracking-tight sm:inline">CoinMarketCap</span>
          </div>

          {/* Nav — hidden on small */}
          <nav className="hidden items-center gap-4 text-sm text-[#616E85] lg:flex">
            <a className="hover:text-[#0D1421]" href="#">Cryptocurrencies</a>
            <a className="hover:text-[#0D1421]" href="#">Exchanges</a>
            <a className="hover:text-[#0D1421]" href="#">Community</a>
            <a className="hover:text-[#0D1421]" href="#">Products</a>
            <a className="hover:text-[#0D1421]" href="#">Learn</a>
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {/* Search — hidden on xs */}
            <div className="relative hidden sm:block">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A6B0C3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input placeholder="Search" className="w-44 rounded-lg border border-[#EFF2F5] bg-[#F8FAFD] py-1.5 pl-9 pr-3 text-sm text-[#0D1421] outline-none placeholder:text-[#A6B0C3] focus:border-[#CFD6E4] md:w-56" />
            </div>
            <button className="hidden rounded-lg border border-[#EFF2F5] bg-white px-3 py-1.5 text-sm font-medium text-[#0D1421] hover:bg-[#F8FAFD] sm:block">Log In</button>
            <button className="rounded-lg bg-[#3861FB] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2f54df]">Sign Up</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-5 lg:px-6">

        {/* ── Breadcrumb ─────────────────────────────── */}
        <div className="mb-3 text-xs text-[#A6B0C3]">
          <span>Cryptocurrencies</span>
          <span className="mx-1">›</span>
          <span className="text-[#616E85]">Bitcoin</span>
        </div>

        {/* ── Hero / Price header ────────────────────── */}
        <section className="mb-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7931a]/10 text-xl font-bold text-[#f7931a] sm:h-12 sm:w-12 sm:text-2xl">₿</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-xl font-semibold leading-none text-[#0D1421] sm:text-2xl">Bitcoin</h1>
                <span className="text-base font-medium text-[#A6B0C3]">BTC</span>
                <span className="rounded bg-[#EFF2F5] px-2 py-0.5 text-[11px] font-medium text-[#616E85]">#1</span>
                <span className="rounded bg-[#3861FB]/10 px-2 py-0.5 text-[11px] font-medium text-[#3861FB]">PoW</span>
                <span className="hidden rounded bg-[#EFF2F5] px-2 py-0.5 text-[11px] font-medium text-[#616E85] sm:inline">Mineable</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#A6B0C3]">
                <span>On 5,293,586 watchlists</span>
                <button className="flex items-center gap-1 rounded-lg border border-[#EFF2F5] px-2 py-0.5 text-[#616E85] hover:bg-[#F8FAFD]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                  Watch
                </button>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold leading-none tracking-tight text-[#0D1421] sm:text-4xl">{formatUsd(currentPrice)}</span>
              <span className="text-xs font-medium text-[#A6B0C3] sm:text-sm">≈ BTC 1.00000000</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-[#A6B0C3]">1h: <span className={BTC_QUOTE.p1h >= 0 ? "font-medium text-[#16C784]" : "font-medium text-[#EA3943]"}>{pct(BTC_QUOTE.p1h)}</span></span>
              <span className="text-[#A6B0C3]">24h: <span className={BTC_QUOTE.p24h >= 0 ? "font-medium text-[#16C784]" : "font-medium text-[#EA3943]"}>{pct(BTC_QUOTE.p24h)}</span></span>
              <span className="text-[#A6B0C3]">7d: <span className={BTC_QUOTE.p7d >= 0 ? "font-medium text-[#16C784]" : "font-medium text-[#EA3943]"}>{pct(BTC_QUOTE.p7d)}</span></span>
            </div>
          </div>
        </section>

        {/* ── Main grid ──────────────────────────────── */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* ── Chart card ─────────────────────────────── */}
          <section className="rounded-xl border border-[#EFF2F5] bg-white shadow-sm">
            {/* Range selector row */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFF2F5] px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0D1421]">BTC Price</span>
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${rangeChangePositive ? "bg-[#DEFBF0] text-[#16C784]" : "bg-[#FCE6E8] text-[#EA3943]"}`}>{pct(range.changePct)}</span>
                <span className="text-xs text-[#A6B0C3]">{range.label}</span>
              </div>
              {/* Scrollable on very narrow screens */}
              <div className="flex items-center gap-0.5 overflow-x-auto">
                {RANGES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setSelectedRange(r.key)}
                    className={`min-w-[34px] rounded-lg px-2 py-1 text-[11px] font-medium transition sm:min-w-[38px] sm:px-2.5 sm:text-xs ${
                      selectedRange === r.key
                        ? "bg-[#EFF2F5] text-[#0D1421]"
                        : "text-[#A6B0C3] hover:bg-[#F8FAFD] hover:text-[#616E85]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <PriceChart range={range} />

            {/* Stats row below chart */}
            <div className="grid grid-cols-2 border-t border-[#EFF2F5] text-[11px] sm:text-[12px] lg:grid-cols-4">
              <InfoCell label="24h Low / High" value={`${formatUsd(Math.min(...rangeConfigs["24H"].points))} / ${formatUsd(Math.max(...rangeConfigs["24H"].points))}`} />
              <InfoCell label="Market Cap Rank" value="#1" />
              <InfoCell label="Market Cap" value={formatCompact(2_063_833_460_372)} />
              <InfoCell label="Vol / Mkt Cap" value="0.0268" />
            </div>
          </section>

          {/* ── Right column ───────────────────────────── */}
          <aside className="space-y-4">
            {/* Converter */}
            <div className="rounded-xl border border-[#EFF2F5] bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[#0D1421]">BTC Converter</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-[#EFF2F5] bg-[#F8FAFD] p-2">
                  <input
                    value={btcAmount}
                    onChange={(e) => setBtcAmount(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-base font-medium text-[#0D1421] outline-none sm:text-lg"
                    inputMode="decimal"
                  />
                  <div className="flex shrink-0 items-center gap-1.5 rounded bg-white px-2 py-1 text-sm shadow-sm">
                    <span className="text-[#f7931a]">₿</span><span className="text-[#616E85]">BTC</span>
                  </div>
                </div>
                <div className="flex items-center justify-center text-[#CFD6E4]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[#EFF2F5] bg-[#F8FAFD] p-2">
                  <span className="min-w-0 flex-1 truncate text-base font-medium text-[#0D1421] sm:text-lg">{formatUsd(usdValue)}</span>
                  <div className="flex shrink-0 items-center gap-1.5 rounded bg-white px-2 py-1 text-sm shadow-sm">
                    <span className="text-[#A6B0C3]">$</span><span className="text-[#616E85]">USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="rounded-xl border border-[#EFF2F5] bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[#0D1421]">Price Performance</h3>
              <PerfBar label="1 Hour" p={BTC_QUOTE.p1h} />
              <PerfBar label="24 Hours" p={BTC_QUOTE.p24h} />
              <PerfBar label="7 Days" p={BTC_QUOTE.p7d} />
              <PerfBar label="30 Days" p={BTC_QUOTE.p30d} />
              <PerfBar label="90 Days" p={BTC_QUOTE.p90d} />
              <PerfBar label="YTD" p={BTC_QUOTE.pytd} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[#EFF2F5] px-3 py-2.5 first:border-l-0 sm:px-4 sm:py-3 lg:border-l">
      <div className="text-[10px] uppercase tracking-wide text-[#A6B0C3] sm:text-[11px]">{label}</div>
      <div className="mt-1 truncate text-xs font-medium text-[#0D1421] sm:text-sm">{value}</div>
    </div>
  );
}

function PerfBar({ label, p }: { label: string; p: number }) {
  const pos = p >= 0;
  return (
    <div className="flex items-center gap-3 border-b border-[#EFF2F5] py-2 last:border-b-0">
      <span className="w-16 shrink-0 text-xs text-[#616E85] sm:w-20">{label}</span>
      <div className="relative h-1.5 flex-1 rounded-full bg-[#EFF2F5]">
        <div
          className={`absolute top-0 h-full rounded-full ${pos ? "right-1/2 bg-[#16C784]" : "left-1/2 bg-[#EA3943]"}`}
          style={{ width: `${Math.min(48, Math.abs(p) * 1.2)}%` }}
        />
        <div className="absolute top-1/2 left-1/2 h-2.5 w-px -translate-y-1/2 bg-[#CFD6E4]" />
      </div>
      <span className={`w-14 shrink-0 text-right text-xs font-medium sm:w-16 ${pos ? "text-[#16C784]" : "text-[#EA3943]"}`}>
        {(p >= 0 ? "+" : "") + p.toFixed(2)}%
      </span>
    </div>
  );
}
