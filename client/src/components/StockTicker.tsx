import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const TICKER_SYMBOLS = [
  "DJIA", "S&P 500", "NASDAQ", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA",
  "META", "NVDA", "JPM", "V", "WMT", "JNJ", "XOM", "BRK.B", "UNH", "PG"
];

function generateTickerData(): TickerItem[] {
  const basePrices: Record<string, number> = {
    "DJIA": 39245.50, "S&P 500": 5088.80, "NASDAQ": 16012.40,
    "AAPL": 182.63, "MSFT": 411.22, "GOOGL": 147.55, "AMZN": 178.25,
    "TSLA": 193.57, "META": 487.05, "NVDA": 788.17, "JPM": 196.24,
    "V": 282.70, "WMT": 172.38, "JNJ": 158.95, "XOM": 104.23,
    "BRK.B": 411.30, "UNH": 527.45, "PG": 162.18
  };

  return TICKER_SYMBOLS.map(symbol => {
    const base = basePrices[symbol] || 100;
    const changePercent = (Math.random() - 0.45) * 4;
    const change = base * (changePercent / 100);
    return {
      symbol,
      price: base + change,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
    };
  });
}

function TickerItemDisplay({ item }: { item: TickerItem }) {
  const isPositive = item.change > 0;
  const isNegative = item.change < 0;

  return (
    <span className="inline-flex items-center gap-1.5 px-4 whitespace-nowrap" data-testid={`ticker-${item.symbol}`}>
      <span className="font-semibold text-foreground/90">{item.symbol}</span>
      <span className="text-foreground/70">
        {item.symbol === "DJIA" || item.symbol === "S&P 500" || item.symbol === "NASDAQ"
          ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : `$${item.price.toFixed(2)}`}
      </span>
      <span className={`inline-flex items-center gap-0.5 ${
        isPositive ? "text-emerald-500" : isNegative ? "text-red-500" : "text-muted-foreground"
      }`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {isPositive ? "+" : ""}{item.changePercent}%
      </span>
    </span>
  );
}

export function StockTicker() {
  const [tickerData, setTickerData] = useState<TickerItem[]>(generateTickerData);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData(generateTickerData());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border-b border-border/50 overflow-hidden" data-testid="stock-ticker">
      <div className="ticker-scroll flex items-center h-8 text-xs">
        <div className="ticker-track flex items-center">
          {tickerData.map((item, i) => (
            <TickerItemDisplay key={`a-${i}`} item={item} />
          ))}
          {tickerData.map((item, i) => (
            <TickerItemDisplay key={`b-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
