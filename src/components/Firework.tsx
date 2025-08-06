import { useEffect, useState } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  opacity: number;
  size: number;
  exploded: boolean;
};

const COLORS = [
  "#fffacd", "#ff69b4", "#40bfff", "#4bff40", "#ff4040", "#b940ff", "#ffffff",
];

export default function Firework({ x = 400, y = 400, onEnd }: { x?: number, y?: number, onEnd?: () => void }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [exploded, setExploded] = useState(false);
  const [show, setShow] = useState(true);

  // 初期化: 上昇玉
  useEffect(() => {
    setParticles([{
      x: x,
      y: 800,
      vx: 0,
      vy: -8,
      color: "#fffacd",
      opacity: 1,
      size: 12,
      exploded: false,
    }]);
    setExploded(false);
    setShow(true);
  }, [x, y]);

  // アニメーション
  useEffect(() => {
    if (!show) return;
    let frame = 0;
    let rafId: number;
    const animate = () => {
      frame++;
      setParticles((prev) => {
        // 玉の上昇・爆発判定
        if (!exploded && prev.length === 1) {
          let p = prev[0];
          if (p.vy > -2 || p.y < y) {
            // 爆発!
            setExploded(true);
            const particles: Particle[] = [];
            const numParticles = 120;
            for (let i = 0; i < numParticles; i++) {
              const angle = (2 * Math.PI * i) / numParticles + Math.random() * 0.07;
              const speed = 4 + Math.random() * 2;
              const color = COLORS[Math.floor(Math.random() * COLORS.length)];
              particles.push({
                x: p.x,
                y: p.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                opacity: 1,
                size: 7 + Math.random() * 5,
                exploded: true,
              });
            }
            return particles;
          } else {
            // 上昇
            const gravity = 0.06;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += gravity;
            return [{ ...p }];
          }
        }
        // 爆発後: パーティクル拡散
        else if (exploded) {
          return prev.map((p) => {
            // 重力
            const gravity = 0.07;
            const airResist = 0.983;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += gravity;
            p.vx *= airResist;
            p.vy *= airResist;
            p.opacity *= 0.97;
            p.size *= 0.98;
            return { ...p };
          }).filter(p => p.opacity > 0.1 && p.size > 1 && p.y < 820);
        }
        return prev;
      });

      // 消えたら非表示
      if (exploded && particles.length === 0) {
        setShow(false);
        if (onEnd) onEnd();
        return;
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [exploded, show, y, onEnd]);

  if (!show) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute w-full h-full left-0 top-0">
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              background: p.color,
              opacity: p.opacity,
              boxShadow: `0 0 18px 7px ${p.color}88`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              filter: "blur(0.6px)",
            }}
          />
        ))}
      </div>
    </div>
  );
}