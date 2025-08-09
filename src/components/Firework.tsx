import { useEffect, useRef, useState } from "react";

export type FireworkShape =
  | "circle"
  | "heart"
  | "star"
  | "clover"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "peony"
  | "chrysanthemum"
  | "willow"
  | "kamuro";

type ParticleGroupParam = {
  count?: number;
  velocityType?: FireworkShape;
  velocity?: number;
  gravity?: number;
  expand?: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  color: string;
  history: { x: number; y: number; opacity: number }[];
  frame: number;
  lifespan: number; // decreases by DECAY per frame
};

export type FireworkProps = {
  x: number;
  y: number;
  color: string;
  size: number;
  duration: number;      // seconds
  launchSpeed: number;   // 0.7 - 1.5 程度
  shape: FireworkShape;  // ChatPage 側でランダムに決定
  onEnd: () => void;
  onExplode: () => void; // 位置はChatPage側で既知なので引数なしでOK
};

const SHAPE_CONFIG: Record<FireworkShape, ParticleGroupParam> = {
  circle:   { count: 40, velocityType: "circle", velocity: 7, gravity: 0.045 },
  heart:    { count: 48, velocityType: "heart", velocity: 7, gravity: 0.045 },
  star:     { count: 48, velocityType: "star", velocity: 7, gravity: 0.045 },
  clover:   { count: 48, velocityType: "clover", velocity: 7, gravity: 0.045 },
  triangle: { count: 36, velocityType: "triangle", velocity: 7, gravity: 0.045 },
  diamond:  { count: 48, velocityType: "diamond", velocity: 7, gravity: 0.045 },
  hexagon:  { count: 54, velocityType: "hexagon", velocity: 7, gravity: 0.045 },
  peony:         { count: 60, velocityType: "peony", velocity: 7, gravity: 0.045 },
  chrysanthemum: { count: 60, velocityType: "chrysanthemum", velocity: 7, gravity: 0.045, expand: 1.16 },
  willow:        { count: 68, velocityType: "willow", velocity: 7, gravity: 0.065, expand: 0.86 },
  kamuro:        { count: 68, velocityType: "kamuro", velocity: 7, gravity: 0.080, expand: 0.6 },
};

function getColor(base: string) {
  return {
    main: base,
    glow: "rgba(255,255,255,0.20)",
  };
}

// 花火のパターン別初速を生成
function randomVelocity(param: ParticleGroupParam, i: number, n: number) {
  const vt = param.velocityType || "circle";
  const speed = param.velocity ?? 7;
  const radius = vt === "circle" ? 0.4 + 0.6 * Math.random() : 1;

  if (vt === "peony") {
    const angle = (2 * Math.PI * i) / n;
    return { vx: Math.cos(angle) * speed * radius, vy: Math.sin(angle) * speed * radius };
  }
  if (vt === "chrysanthemum") {
    const angle = (2 * Math.PI * i) / n;
    const expand = param.expand ?? 1.2;
    return { vx: Math.cos(angle) * speed * expand, vy: Math.sin(angle) * speed * expand };
  }
  if (vt === "willow") {
    const angle = (2 * Math.PI * i) / n;
    const expand = param.expand ?? 0.85;
    return { vx: Math.cos(angle) * speed * expand, vy: Math.sin(angle) * speed * expand };
  }
  if (vt === "kamuro") {
    const angle = (2 * Math.PI * i) / n;
    const expand = param.expand ?? 0.6;
    return { vx: Math.cos(angle) * speed * expand, vy: Math.sin(angle) * speed * expand };
  }

  if (vt === "circle") {
    const angle = (2 * Math.PI * i) / n;
    return { vx: Math.cos(angle) * speed * radius, vy: Math.sin(angle) * speed * radius };
  }
  if (vt === "heart") {
    const t = (2 * Math.PI * i) / n;
    const xh = 16 * Math.pow(Math.sin(t), 3);
    const yh = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { vx: xh * speed * 0.11 * radius, vy: -yh * speed * 0.11 * radius };
  }
  if (vt === "star") {
    const spikes = 5;
    const step = Math.PI / spikes;
    const r1 = 1, r2 = 0.45;
    const useR = i % 2 === 0 ? r1 : r2;
    const angle = Math.PI / 2 + i * step;
    return { vx: Math.cos(angle) * speed * useR * radius, vy: Math.sin(angle) * speed * useR * radius };
  }
  if (vt === "clover") {
    const t = (2 * Math.PI * i) / n;
    const r = 1 + 0.7 * Math.sin(3 * t);
    return { vx: Math.cos(t) * speed * r * radius, vy: Math.sin(t) * speed * r * radius };
  }
  if (vt === "triangle") {
    const tri = Math.floor((i / n) * 3);
    const a = (2 * Math.PI * tri) / 3;
    return { vx: Math.cos(a) * speed * radius, vy: Math.sin(a) * speed * radius };
  }
  if (vt === "diamond") {
    const angle = (2 * Math.PI * i) / n;
    const r = Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle));
    return { vx: Math.cos(angle) * speed * r * radius, vy: Math.sin(angle) * speed * r * radius };
  }
  if (vt === "hexagon") {
    const hex = Math.floor((i / n) * 6);
    const a = (2 * Math.PI * hex) / 6;
    return { vx: Math.cos(a) * speed * radius, vy: Math.sin(a) * speed * radius };
  }

  const angle = (2 * Math.PI * i) / n;
  return { vx: Math.cos(angle) * speed * radius, vy: Math.sin(angle) * speed * radius };
}

const DECAY_PER_FRAME = 3.2; // 1フレームで減る寿命

function createParticles(
  x: number,
  y: number,
  color: string,
  _size: number,
  shape: FireworkShape,
  durationSec: number
): Particle[] {
  const config = SHAPE_CONFIG[shape];
  const n = config.count || 40;
  const result: Particle[] = [];
  const colorSet = getColor(color);

  // duration に合わせて初期寿命を設定（寿命/減衰 = フレーム数）
  const initialLife = Math.max(0.5, durationSec) * 60 * DECAY_PER_FRAME;

  for (let i = 0; i < n; i++) {
    const { vx, vy } = randomVelocity(config, i, n);
    result.push({
      x, y,
      vx, vy,
      opacity: 1,
      size: 1.1 + Math.random() * 0.5,
      color: colorSet.main,
      history: [],
      frame: 0,
      lifespan: initialLife,
    });
  }
  return result;
}

export default function Firework({
  x,
  y,
  color,
  size,
  duration,
  launchSpeed,
  shape,
  onEnd,
  onExplode,
}: FireworkProps) {
  const [phase, setPhase] = useState<"launch" | "explode">("launch");
  const [rocket, setRocket] = useState<{ x: number; y: number; vy: number }>(() => ({
    x,
    y: typeof window !== "undefined" ? window.innerHeight - 30 : 600,
    vy: -13 * size * launchSpeed,
  }));
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(true);
  const explodedRef = useRef(false);

  // 打ち上げ
  useEffect(() => {
    if (phase !== "launch") return;
    let rafId: number;
    const animate = () => {
      setRocket((prev) => {
        const nextY = prev.y + prev.vy;
        const nextVy = prev.vy + 0.22 * size; // 重力で減速（上昇時は正に近づく）
        // 目標高度 y に到達 or 失速で爆発へ
        if (nextY <= y || nextVy >= 0 || nextY < 0) {
          setPhase("explode");
          if (!explodedRef.current) {
            onExplode();
            explodedRef.current = true;
          }
          return prev;
        }
        // 尾の粒子（淡い白）
        setParticles([
          {
            x: prev.x,
            y: prev.y,
            vx: 0,
            vy: 0,
            opacity: 1,
            size: 2,
            color: "#fff",
            history: [],
            frame: 0,
            lifespan: 60,
          },
        ]);
        return { ...prev, y: nextY, vy: nextVy };
      });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [phase, y, size, launchSpeed, onExplode]);

  // 爆発の初期化
  useEffect(() => {
    if (phase !== "explode") return;
    setParticles(createParticles(rocket.x, y, color, size, shape, duration));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, rocket.x, y, color, size, shape, duration]);

  // 爆発のアニメーション
  useEffect(() => {
    if (phase !== "explode") return;
    if (particles.length === 0) return;

    const gravity = SHAPE_CONFIG[shape].gravity ?? 0.045;
    let rafId: number;

    const animate = () => {
      setParticles((prev) => {
        const arr: Particle[] = [];
        for (let p of prev) {
          p.frame++;
          p.history = [...(p.history ?? []), { x: p.x, y: p.y, opacity: p.opacity }];
          if (p.history.length > 10) p.history.shift();

          p.x += p.vx;
          p.y += p.vy;

          // 減速（残光が少し伸びる感じ）
          p.vx *= 0.92;
          p.vy *= 0.92;

          // 形ごとの重力
          p.vy += gravity;

          // 寿命減衰（duration に基づく）
          p.lifespan -= DECAY_PER_FRAME;
          if (p.lifespan < 0) continue;

          p.opacity = Math.max(0, p.lifespan / (duration * 60 * DECAY_PER_FRAME));
          arr.push(p);
        }
        if (arr.length === 0) {
          setVisible(false);
          onEnd();
          return [];
        }
        return arr;
      });
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [phase, particles.length, onEnd, duration, shape]);

  if (!visible) return null;

  // 打ち上げ中の尾
  if (phase === "launch") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 51,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
          {particles.map((p, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size * 10}px`,
                height: `${p.size * 18}px`,
                borderRadius: "40%",
                background: "#fff",
                opacity: 0.35,
                boxShadow: "0 0 8px 2px #fff",
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

  // 爆発時（粒子＋残光）
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 51,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
        {particles.map((p, i) => (
          <div key={i}>
            {(p.history ?? []).map((h, j) => (
              <div
                key={j}
                style={{
                  position: "absolute",
                  left: `${h.x}px`,
                  top: `${h.y}px`,
                  width: `${p.size * 7}px`,
                  height: `${p.size * 7}px`,
                  borderRadius: "50%",
                  background: p.color,
                  opacity: h.opacity * 0.18,
                  filter: "blur(2px)",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size * 10}px`,
                height: `${p.size * 10}px`,
                borderRadius: "50%",
                background: p.color,
                boxShadow: `0 0 8px 4px ${p.color}`,
                opacity: p.opacity,
                filter: "blur(0.2px)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                border: "none",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}