import { useEffect, useRef, useState } from "react";

export type FireworkShape =
  | "classic"
  | "circle"
  | "heart"
  | "star"
  | "clover"
  | "diamond"
  | "hexagon"
  | "kamuro";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 -> 0
  size: number;
  color: string;
  history: { x: number; y: number; opacity: number }[];
};

export type FireworkProps = {
  x: number;
  y: number;
  color: string;
  size: number;        // 1.0 基準（爆発半径スケールにも反映）
  duration: number;    // 秒（寿命に反映）
  launchSpeed: number; // 0.7〜1.5 目安
  shape: FireworkShape;
  onEnd: () => void;
  onExplode: () => void;
};

const DRAW_FPS = 30;
const DRAW_INTERVAL = 1000 / DRAW_FPS;
const HISTORY_LEN = 6;

const UNIFORM_GRAVITY = 0.045;
const FRICTION = 0.92;
const BASE_SPEED = 7;

const PARTICLE_COUNTS: Record<FireworkShape, number> = {
  classic: 64,
  circle: 36,
  kamuro: 60,
  heart: 42,
  star: 44,
  clover: 44,
  diamond: 42,
  hexagon: 48,
};

// 形ごとの平均半径の差を吸収して、基準サイズを揃えるための正規化係数
// 数値は見た目基準の近似値です。必要に応じて微調整してください。
const SHAPE_RADIUS_NORMALIZER: Record<FireworkShape, number> = {
  classic: 1.20,  // 平均r≈0.83 を補正
  circle: 1.00,   // 一様に1.0
  kamuro: 1.18,   // 初速k=0.85 を補正
  heart: 1.00,    // 心形kは見た目合わせ済み
  star: 1.33,     // r1=1, r2=0.5 の平均0.75を補正
  clover: 1.18,   // r≈0.85 を補正
  diamond: 0.90,  // 平均rがやや>1 を抑制
  hexagon: 1.00,  // 方向量子化のみで半径1
};

// 文字量に応じた爆発半径（初速）スケール
function getExplosionSpeedScale(size: number) {
  // size=1.0 -> 1.2倍, size=3.0 -> 2.0倍 くらいの伸び
  // （サイズ段階を増やしたので、ここは滑らかでOK）
  return Math.min(2.0, 0.8 + 0.4 * size);
}

function randomVelocity(shape: FireworkShape, i: number, n: number, speed: number) {
  switch (shape) {
    case "classic": {
      const a = Math.random() * Math.PI * 2;
      const r = 0.5 + 0.5 * Math.sqrt(Math.random()); // 0.5..1.0（外側寄り）
      return { vx: Math.cos(a) * speed * r, vy: Math.sin(a) * speed * r };
    }
    case "circle": {
      const a = (2 * Math.PI * i) / n;
      return { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
    }
    case "kamuro": {
      const a = (2 * Math.PI * i) / n;
      const k = 0.85; // 形の粘り感（重さ）は残す
      return { vx: Math.cos(a) * speed * k, vy: Math.sin(a) * speed * k };
    }
    case "heart": {
      const t = (2 * Math.PI * i) / n;
      const xh = 16 * Math.pow(Math.sin(t), 3);
      const yh =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      const k = 0.11; // 形状係数（輪郭維持）
      return { vx: xh * speed * k, vy: -yh * speed * k };
    }
    case "star": {
      const spikes = 5;
      const step = Math.PI / spikes;
      const r1 = 1.0, r2 = 0.5;
      const useR = i % 2 === 0 ? r1 : r2;
      const a = Math.PI / 2 + i * step;
      return { vx: Math.cos(a) * speed * useR, vy: Math.sin(a) * speed * useR };
    }
    case "clover": {
      const t = (2 * Math.PI * i) / n;
      const r = 0.7 + (0.3 * (1 + Math.sin(3 * t))) / 2; // 0.7..1.0
      return { vx: Math.cos(t) * speed * r, vy: Math.sin(t) * speed * r };
    }
    case "diamond": {
      const a = (2 * Math.PI * i) / n;
      const r =
        Math.max(0.75, Math.abs(Math.cos(a)) + Math.abs(Math.sin(a)) * 0.75);
      return { vx: Math.cos(a) * speed * r, vy: Math.sin(a) * speed * r };
    }
    case "hexagon": {
      const hex = Math.floor((i / n) * 6);
      const a = (2 * Math.PI * hex) / 6;
      return { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
    }
  }
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
  // 表示スナップショット
  const [phase, setPhase] = useState<"launch" | "explode">("launch");
  const [tail, setTail] = useState<Particle[]>([]);
  const [renderParticles, setRenderParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(true);

  // 物理・制御（ref）
  const phaseRef = useRef<"launch" | "explode">("launch");
  const rocketRef = useRef<{ x: number; y: number; vy: number } | null>(null);
  const tailRef = useRef<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const explodedRef = useRef(false);
  const lastDrawRef = useRef<number>(performance.now());

  // コールバックは ref に退避
  const onEndRef = useRef(onEnd);
  const onExplodeRef = useRef(onExplode);
  useEffect(() => {
    onEndRef.current = onEnd;
    onExplodeRef.current = onExplode;
  }, [onEnd, onExplode]);

  // 初期化（props が変わった時のみ）
  useEffect(() => {
    phaseRef.current = "launch";
    setPhase("launch");
    setVisible(true);
    explodedRef.current = false;

    rocketRef.current = {
      x,
      y: typeof window !== "undefined" ? window.innerHeight - 30 : 600,
      vy: -13 * size * launchSpeed,
    };
    tailRef.current = [];
    particlesRef.current = [];
    setTail([]);
    setRenderParticles([]);

    let rafId = 0;
    let prev = performance.now();

    const stepMs = 1000 / 60;
    let acc = 0;

    const initExplosion = () => {
      const n = PARTICLE_COUNTS[shape];
      const arr: Particle[] = [];

      // 爆発時の色は props.color を使用
      const explosionCssColor = color;

      // サイズ段階と形の正規化を考慮した初速
      const base = BASE_SPEED * getExplosionSpeedScale(size);
      const spd = base * SHAPE_RADIUS_NORMALIZER[shape];

      for (let i = 0; i < n; i++) {
        const v = randomVelocity(shape, i, n, spd);
        arr.push({
          x,
          y,
          vx: v.vx,
          vy: v.vy,
          life: 1,
          size: 1.1 + Math.random() * 0.5,
          color: explosionCssColor,
          history: [],
        });
      }
      particlesRef.current = arr;
      onExplodeRef.current?.();
    };

    const loop = () => {
      const now = performance.now();
      let dt = now - prev;
      prev = now;
      acc += dt;

      while (acc >= stepMs) {
        acc -= stepMs;

        if (phaseRef.current === "launch") {
          const r = rocketRef.current!;
          r.y += r.vy;
          r.vy += 0.22 * size;

          // 尾（白で統一）
          tailRef.current = [
            {
              x: r.x,
              y: r.y,
              vx: 0,
              vy: 0,
              life: 1,
              size: 2,
              color: "#fff",
              history: [],
            },
          ];

          if (r.y <= y || r.vy >= 0 || r.y < 0) {
            phaseRef.current = "explode";
            setPhase("explode");
            if (!explodedRef.current) {
              explodedRef.current = true;
              initExplosion();
            }
          }
        } else {
          const pArr = particlesRef.current;
          // duration に比例してゆっくり減衰
          const decay = stepMs / (duration * 1000);
          let alive = 0;

          for (let p of pArr) {
            if (p.life <= 0) continue;

            p.history.push({ x: p.x, y: p.y, opacity: p.life });
            if (p.history.length > HISTORY_LEN) p.history.shift();

            p.x += p.vx;
            p.y += p.vy;
            p.vx *= FRICTION;
            p.vy = p.vy * FRICTION + UNIFORM_GRAVITY;

            p.life = Math.max(0, p.life - decay);
            if (p.life > 0) alive++;
          }

          if (alive === 0) {
            setVisible(false);
            onEndRef.current?.();
            cancelAnimationFrame(rafId);
            return;
          }
        }
      }

      // 30fps 間引き描画
      if (now - lastDrawRef.current >= DRAW_INTERVAL) {
        lastDrawRef.current = now;
        if (phaseRef.current === "launch") {
          setTail(tailRef.current.slice());
        } else {
          setRenderParticles(particlesRef.current.slice());
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [x, y, color, size, duration, launchSpeed, shape]);

  if (!visible) return null;

  // 打ち上げの尾
  if (phase === "launch") {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute w-full h-full left-0 top-0">
          {tail.map((p, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.size * 10}px`,
                height: `${p.size * 18}px`,
                borderRadius: "40%",
                background: p.color,
                opacity: 0.35,
                boxShadow: "0 0 8px 2px currentColor",
                transform: "translate(-50%, -50%) translateZ(0)",
                filter: "blur(0.7px)",
                pointerEvents: "none",
                zIndex: 51,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // 爆発
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute w-full h-full left-0 top-0">
        {renderParticles.map((p, i) => (
          <div key={i}>
            {p.history.map((h, j) => (
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
                  transform: "translate(-50%, -50%) translateZ(0)",
                  pointerEvents: "none",
                  zIndex: 51,
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
                opacity: p.life * 0.85 + 0.15,
                filter: "blur(0.2px)",
                transform: "translate(-50%, -50%) translateZ(0)",
                pointerEvents: "none",
                zIndex: 52,
                border: "none",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}