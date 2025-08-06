import { useEffect, useState } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  opacity: number;
  size: number;
  delay: number;
};

const COLORS = [
  "#fffacd", "#ff69b4", "#40bfff", "#4bff40", "#ff4040", "#b940ff", "#ffffff",
];

const Firework = ({ onEnd }: { onEnd?: () => void }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [exploded, setExploded] = useState(false);

  useEffect(() => {
    // 花火上昇後、爆発
    const riseTimer = setTimeout(() => {
      setExploded(true);

      const numParticles = 32;
      const newParticles: Particle[] = [];
      for (let i = 0; i < numParticles; i++) {
        const angle = (2 * Math.PI * i) / numParticles + Math.random() * 0.15;
        const speed = 2 + Math.random() * 2;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        newParticles.push({
          x: 80,
          y: 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          opacity: 1,
          size: 10 + Math.random() * 6,
          delay: Math.random() * 0.15,
        });
      }
      setParticles(newParticles);
    }, 600);

    // 花火終了
    const endTimer = setTimeout(() => {
      if (onEnd) onEnd();
    }, 2000);

    return () => {
      clearTimeout(riseTimer);
      clearTimeout(endTimer);
    };
  }, [onEnd]);

  // パーティクル物理運動
  useEffect(() => {
    if (!exploded) return;
    let frame = 0;
    let rafId: number;

    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => {
          if (frame < p.delay * 60) return p;
          // 重力
          const gravity = 0.05;
          const airResist = 0.985;
          let { x, y, vx, vy, opacity, size } = p;
          x += vx;
          y += vy;
          vy += gravity;
          vx *= airResist;
          vy *= airResist;
          opacity *= 0.97;
          size *= 0.97;
          return { ...p, x, y, vx, vy, opacity, size };
        })
      );
      frame++;
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [exploded]);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="relative w-40 h-40">
        {/* 上昇軌跡 */}
        {!exploded && (
          <>
            <div className="absolute left-1/2 w-1 h-28 bg-white"
              style={{
                top: "80%",
                transform: "translateX(-50%)",
                boxShadow: "0 0 8px 4px #fff",
                animation: "rise 0.6s cubic-bezier(.52,.01,.25,1) forwards",
              }} />
            <div className="absolute left-1/2 top-[40px] w-7 h-7 rounded-full"
              style={{
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle at 60% 40%, #fffacd 80%, #fff 40%, #e8e173 0%)",
                boxShadow: "0 0 24px 10px #fffacd",
              }} />
          </>
        )}
        {/* 爆発パーティクル */}
        {exploded &&
          particles.map((p, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: "50%",
                background: p.color,
                opacity: p.opacity,
                filter: "blur(0.5px)",
                boxShadow: `0 0 18px 6px ${p.color}88`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                transition: "opacity 0.08s, width 0.12s",
              }}
            />
          ))}
      </div>
      {/* 上昇アニメーション */}
      <style>{`
        @keyframes rise {
          0% { height: 0; opacity: 0.1;}
          80% { height: 90px; opacity: 1;}
          100% { height: 0; opacity: 0;}
        }
      `}</style>
    </div>
  );
};

export default Firework;