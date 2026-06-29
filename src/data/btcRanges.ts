import type { RangeConfig, RangeKey } from "../components/PriceChart";

// Based on CoinMarketCap page values captured in __NEXT_DATA__ (BTC ~$59,770)
const CURRENT_PRICE = 59770.69;

function generate(startPrice: number, endPrice: number, n: number, seed: number, volatility: number): number[] {
  // simple seeded walk that hits start/end exactly
  const pts: number[] = [];
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const trend = startPrice + (endPrice - startPrice) * t;
    const noise = (rnd() - 0.5) * volatility;
    pts.push(trend + noise);
  }
  pts[0] = startPrice;
  pts[n - 1] = endPrice;
  return pts;
}

const now = Date.now();

export const rangeConfigs: Record<RangeKey, RangeConfig> = {
  "1H": {
    key: "1H",
    label: "1H",
    changePct: -0.3562,
    startTime: now - 60 * 60 * 1000,
    intervalMs: (60 * 60 * 1000) / 72,
    points: generate(CURRENT_PRICE / (1 - 0.003562), CURRENT_PRICE, 73, 17, 120),
  },
  "24H": {
    key: "24H",
    label: "24H",
    changePct: -0.7599,
    startTime: now - 24 * 60 * 60 * 1000,
    intervalMs: (24 * 60 * 60 * 1000) / 120,
    points: (() => {
      // Hand-crafted to match CMC screenshot pattern
      const start = 60130;
      const end = CURRENT_PRICE;
      const pts: number[] = [];
      const n = 121;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        // Pattern: start high, small green bump, gradual decline with volatility, sharp drops, recovery
        let v = start + (end - start) * t;
        // Add volatility that matches screenshot pattern
        v += Math.sin(t * 12) * 80;
        v += Math.sin(t * 25) * 40;
        v += Math.sin(t * 45) * 25;
        // Sharp drops in middle
        if (t > 0.35 && t < 0.45) v -= 180 * Math.sin((t - 0.35) / 0.1 * Math.PI);
        if (t > 0.55 && t < 0.65) v -= 220 * Math.sin((t - 0.55) / 0.1 * Math.PI);
        if (t > 0.75 && t < 0.82) v -= 120 * Math.sin((t - 0.75) / 0.07 * Math.PI);
        // Recovery bumps
        if (t > 0.82 && t < 0.88) v += 100 * Math.sin((t - 0.82) / 0.06 * Math.PI);
        if (t > 0.45 && t < 0.52) v += 60 * Math.sin((t - 0.45) / 0.07 * Math.PI);
        pts.push(v);
      }
      pts[0] = start;
      pts[n - 1] = end;
      return pts;
    })(),
  },
  "7D": {
    key: "7D",
    label: "7D",
    changePct: -6.8494,
    startTime: now - 7 * 24 * 60 * 60 * 1000,
    intervalMs: (7 * 24 * 60 * 60 * 1000) / 84,
    points: generate(CURRENT_PRICE / (1 - 0.068494), CURRENT_PRICE, 85, 41, 1100),
  },
  "1M": {
    key: "1M",
    label: "1M",
    changePct: -18.5778,
    startTime: now - 30 * 24 * 60 * 60 * 1000,
    intervalMs: (30 * 24 * 60 * 60 * 1000) / 90,
    points: generate(CURRENT_PRICE / (1 - 0.185778), CURRENT_PRICE, 91, 53, 1800),
  },
  "3M": {
    key: "3M",
    label: "3M",
    changePct: -10.5597,
    startTime: now - 90 * 24 * 60 * 60 * 1000,
    intervalMs: (90 * 24 * 60 * 60 * 1000) / 90,
    points: generate(CURRENT_PRICE / (1 - 0.105597), CURRENT_PRICE, 91, 79, 2600),
  },
  "1Y": {
    key: "1Y",
    label: "1Y",
    changePct: 4.6,
    startTime: now - 365 * 24 * 60 * 60 * 1000,
    intervalMs: (365 * 24 * 60 * 60 * 1000) / 100,
    points: generate(CURRENT_PRICE / 1.046, CURRENT_PRICE, 101, 101, 3200),
  },
  YTD: {
    key: "YTD",
    label: "YTD",
    changePct: -32.64,
    startTime: new Date(new Date().getFullYear(), 0, 1).getTime(),
    intervalMs: (now - new Date(new Date().getFullYear(), 0, 1).getTime()) / 100,
    points: generate(CURRENT_PRICE / (1 - 0.3264), CURRENT_PRICE, 101, 191, 3000),
  },
  ALL: {
    key: "ALL",
    label: "ALL",
    changePct: 3_220_000,
    startTime: new Date("2013-04-28").getTime(),
    intervalMs: (now - new Date("2013-04-28").getTime()) / 120,
    points: (() => {
      const pts: number[] = [];
      const n = 121;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        // exponential growth with some dips
        const v = 120 * Math.exp(t * 6.2) + Math.sin(t * 18) * 800;
        pts.push(v);
      }
      pts[n - 1] = CURRENT_PRICE;
      return pts;
    })(),
  },
};

export const BTC_QUOTE = {
  price: CURRENT_PRICE,
  p1h: -0.3562,
  p24h: -0.7599,
  p7d: -6.8494,
  p30d: -18.5778,
  p90d: -10.5597,
  pytd: -32.6391,
};
