import { useEffect, useState, useRef } from "react";

type FireworkProps = {
  x?: number;
  y?: number;
  color?: string;
  onEnd?: () => void;
  onExplode?: (x: number, y: number) => void;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  exploded: boolean;
  a: number;
  w: number;
  frame: number;
  type: number;
};

export default function Firework({
  x = window.innerWidth / 2,
  y = window.innerHeight / 3,
  color = "#ff69b4",
  onEnd,
  onExplode,
}: FireworkProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(true);
  const explodedRef = useRef(false);
  const GRAVITY = 0.08;

  useEffect(() => {
    setParticles([
      {
        x: x,
        y: window.innerHeight - 40,
        vx: 0,
        vy: -12,
        opacity: 1,
        size: 1,
        exploded: false,
        a: 255,
        w: 16,
        frame: 0,
        type: 0,
      },
    ]);
    setShow(true);
    explodedRef.current = false;
  }, [x, y, color]);

  useEffect(() => {
    if (!show) return;
    let rafId: number;
    const animate = () => {
      setParticles((prev) => {
        if (prev.length === 1 && !prev[0].exploded) {
          let p = { ...prev[0] };
          p.frame++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += GRAVITY;
          if (p.y < y + 30) p.a -= 7;
          if (p.vy > -2 || p.y < y) {
            // 爆発タイミング
            if (onExplode && !explodedRef.current) {
              onExplode(p.x, p.y);
              explodedRef.current = true;
            }
            const balls = 60 + Math.floor(Math.random() * 30);
            const explosion: Particle[] = [];
            for (let i = 0; i < balls; i++) {
              const angle = (2 * Math.PI * i) / balls + Math.random() * 0.12;
              const speed = 5.5 + Math.random() * 2.2;
              explosion.push({
                x: p.x,
                y: p.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                opacity: 1,
                size: 1,
                exploded: true,
                a: 255,
                w: 8 + Math.random() * 7,
                frame: 0,
                type: 1,
              });
            }
            return explosion;
          }
          return [p];
        } else {
          const arr: Particle[] = [];
          for (let p of prev) {
            p.frame++;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += GRAVITY / 1.7;
            p.vx *= 0.978;
            p.vy *= 0.984;
            p.a *= 0.97;
            p.w *= 0.987;
            p.opacity *= 0.97;
            if (p.w > 1 && p.a > 8 && p.opacity > 0.12 && p.y < window.innerHeight) {
              arr.push(p);
            }
          }
          if (arr.length === 0) {
            setShow(false);
            return [];
          }
          return arr;
        }
      });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [show, y, color, onExplode]);

  useEffect(() => {
    if (!show && onEnd) {
      onEnd();
    }
  }, [show, onEnd]);

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
              width: `${p.w}px`,
              height: `${p.w}px`,
              borderRadius: "50%",
              background: color,
              opacity: p.a / 255,
              boxShadow: `0 0 30px 10px ${color}99`,
              transform: "translate(-50%, -50%)",
              filter: "blur(0.7px)",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}