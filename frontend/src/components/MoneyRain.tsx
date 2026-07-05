import { useEffect, useMemo, useState } from "react";

const EMOJIS = ["💵", "💰", "🪙", "💸", "🤑"];
const DROP_COUNT = 60;
const DURATION_MS = 5000;

interface Drop {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
}

/**
 * Full-screen celebration overlay: it rains money for a few seconds.
 * Mount it with a changing `burstKey` to re-trigger; renders nothing when idle.
 */
export default function MoneyRain({ burstKey }: { burstKey: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (burstKey === 0) return;
    setActive(true);
    const t = setTimeout(() => setActive(false), DURATION_MS);
    return () => clearTimeout(t);
  }, [burstKey]);

  const drops = useMemo<Drop[]>(
    () =>
      Array.from({ length: DROP_COUNT }, (_, i) => ({
        id: i,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        left: Math.random() * 100,
        delay: Math.random() * 1.6,
        duration: 2 + Math.random() * 1.8,
        size: 22 + Math.random() * 26,
        drift: -40 + Math.random() * 80,
      })),
    [burstKey]
  );

  if (!active) return null;

  return (
    <div className="money-rain" aria-hidden>
      {drops.map((d) => (
        <span
          key={d.id}
          className="money-drop"
          style={{
            left: `${d.left}%`,
            fontSize: d.size,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            ["--drift" as string]: `${d.drift}px`,
          }}
        >
          {d.emoji}
        </span>
      ))}
      <div className="money-rain-msg">Cha-ching! 🎉</div>
    </div>
  );
}
