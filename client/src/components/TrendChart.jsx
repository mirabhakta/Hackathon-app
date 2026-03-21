import { useContext, useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler
} from "chart.js";
import { ThemeContext } from "../context/ThemeContext.jsx";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Filler);

export default function TrendChart({ history }) {
  const { colors } = useContext(ThemeContext);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const grouped = history.reduce((accumulator, entry) => {
      const dayKey = new Date(entry.timestamp).toLocaleDateString();
      accumulator[dayKey] = entry;
      return accumulator;
    }, {});
    const entries = Object.values(grouped).slice(-7);
    const labels = entries.map((entry) => new Date(entry.timestamp).toLocaleDateString([], { weekday: "short" }));
    const data = entries.map((entry) => Number((entry.burnRate ?? 0).toFixed(2)));
    const todayKey = new Date().toLocaleDateString();
    const backgroundColor = entries.map((entry) => {
      if (entry.burnRate >= 0.6) return colors.burnHigh;
      if (entry.burnRate >= 0.3) return colors.barWarn;
      return colors.barGood;
    });
    const borderColor = entries.map((entry) =>
      new Date(entry.timestamp).toLocaleDateString() === todayKey ? colors.primary : "transparent"
    );

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor,
            borderColor,
            borderWidth: entries.map((entry) =>
              new Date(entry.timestamp).toLocaleDateString() === todayKey ? 2 : 0
            ),
            borderRadius: 12
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: 0,
            max: 1,
            grid: { color: colors.cardBorder },
            ticks: {
              color: colors.muted,
              callback(value) {
                return `${Math.round(Number(value) * 100)}%`;
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: colors.muted }
          }
        }
      }
    });

    return () => chartRef.current?.destroy();
  }, [history, colors]);

  return (
    <div className="rounded-[28px] p-5 shadow-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
      <div className="mb-4">
        <p className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: colors.muted }}>Weekly Trend</p>
        <h3 className="font-display text-2xl" style={{ color: colors.secondaryText }}>How your week has felt</h3>
      </div>
      <div className="h-64">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
