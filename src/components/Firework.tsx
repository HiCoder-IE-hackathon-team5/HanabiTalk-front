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
  y: number;         // 爆発させたい目標Y
  color: string;
  size: number;      // 1.0 基準（爆発半径スケールにも反映）
  duration: number;  // 秒（寿命に反映）← 短くすると平均負荷が下がる（余韻短く）
  launchSpeed: number; // 0.7〜1.5 目安（初速へは弱めに反映）
  shape: FireworkShape;
  onEnd: () => void;
  onExplode: () => void;
};

// 描画FPS（下げるほど軽いがカクつき増） ← 調整ポイント: 24 → 20 へ
const DRAW_FPS = 20;
const DRAW_INTERVAL = 1000 / DRAW_FPS;

// トレイル履歴数（層数を減らすと軽いが尾が短/薄に） ← 調整ポイント: 4 → 3
const HISTORY_LEN = 3;

const UNIFORM_GRAVITY = 0.045;
const FRICTION = 0.92;

// 初速の基準（下げると広がりが控えめ＆負荷減） ← 調整ポイント: 7 → 6.5
const BASE_SPEED = 6.5;

// 上昇の減速（「ゆっくり上がる」を維持）
const ROCKET_DECEL = 0.18; // 旧: 0.22

// 粒子数（減らすと軽いが密度低下） ← 調整ポイント: 約10〜20%減
const PARTICLE_COUNTS: Record<FireworkShape, number> = {
  classic: 56, // 64 → 56
  circle: 32,  // 36 → 32
  kamuro: 52,  // 60 → 52
  heart: 36,   // 42 → 36
  star: 36,    // 44 → 36
  clover: 36,  // 44 → 36
  diamond: 36, // 42 → 36
  hexagon: 40, // 48 → 40
};

// 形ごとの平均半径の差を吸収
const SHAPE_RADIUS_NORMALIZER: Record<FireworkShape, number> = {
  classic: 1.20,
  circle: 1.00,
  kamuro: 1.18,
  heart: 1.00,
  star: 1.33,
  clover: 1.18,
  diamond: 0.90,
  hexagon: 1.00,
};

// 文字量に応じた爆発半径（初速）スケール
function getExplosionSpeedScale(size: number) {
  return Math.min(2.0, 0.8 + 0.4 * size);
}

// 目標Yにほぼ到達するよう、必要な初速を目標Yから逆算（離散系の近似）
function computeInitialVyForTarget(targetY: number, size: number, launchSpeed: number) {
  const startY = typeof window !== "undefined" ? window.innerHeight - 30 : 600;
  const a = ROCKET_DECEL * size;                   // 毎ステップの上向き速度減少量
  const deltaY = Math.max(0, startY - targetY);    // 登りたい距離（px）
  // 連続近似: v0^2 ≈ 2*a*Δy（v0<0 にする）
  const v0mag = Math.sqrt(Math.max(2 * a * deltaY, 0.01));
  // launchSpeed は上下のバラつきが偏らないよう弱めに反映（±10%に制限）
  const ls = Math.max(0.9, Math.min(1.1, launchSpeed));
  const FUDGE = 0.96; // 少し抑えて「ゆっくり」見せる
  return -v0mag * FUDGE * ls;
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
      const k = 0.85;
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
      const k = 0.11;
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
  const [phase, setPhase] = useState<"launch" | "explode">("launch");
  const [tail, setTail] = useState<Particle[]>([]);
  const [renderParticles, setRenderParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(true);

  const phaseRef = useRef<"launch" | "explode">("launch");
  const rocketRef = useRef<{ x: number; y: number; vy: number } | null>(null);
  const tailRef = useRef<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const explodedRef = useRef(false);
  const lastDrawRef = useRef<number>(performance.now());

  const onEndRef = useRef(onEnd);
  const onExplodeRef = useRef(onExplode);
  useEffect(() => {
    onEndRef.current = onEnd;
    onExplodeRef.current = onExplode;
  }, [onEnd, onExplode]);

  useEffect(() => {
    phaseRef.current = "launch";
    setPhase("launch");
    setVisible(true);
    explodedRef.current = false;

    const startY = typeof window !== "undefined" ? window.innerHeight - 30 : 600;

    rocketRef.current = {
      x,
      y: startY,
      // 目標Y（props.y）に到達できるだけの初速を逆算して設定
      vy: computeInitialVyForTarget(y, size, launchSpeed),
    };
    tailRef.current = [];
    particlesRef.current = [];
    setTail([]);
    setRenderParticles([]);

    let rafId = 0;
    let prev = performance.now();

    const stepMs = 1000 / 60; // 物理演算は60fps相当で安定
    let acc = 0;

    const initExplosion = () => {
      const n = PARTICLE_COUNTS[shape];
      const arr: Particle[] = [];

      const explosionCssColor = color;
      // BASE_SPEED（初速の基準）を下げると広がり控えめ＆負荷減
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
          r.vy += ROCKET_DECEL * size;

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

          // 目標Yに達したら爆発。到達不能な場合でも頂点で爆発。
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
          // duration が短いほど早く消える（平均負荷減）← 調整ポイント
          const decay = stepMs / (duration * 1000);
          let alive = 0;

          for (let p of pArr) {
            if (p.life <= 0) continue;

            // 履歴は短縮（box-shadow 多重で1ノード描画）
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

      // 描画間引き（DRAW_FPS）← 調整ポイント
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
                willChange: "transform, opacity",
                contain: "layout paint style",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // トレイルを複数の box-shadow にまとめて1ノード描画にする
  // ぼかし量・スプレッドを下げると軽い（ふわっと感は少し減る）← 調整ポイント
  const makeTrailShadow = (p: Particle) => {
    if (!p.history.length) return "";
    const parts: string[] = [];
    const blurBase = 4;   // 6 → 4
    const blurStep = 2;   // 3 → 2
    const spread = 1;     // 2 → 1
    for (let j = 0; j < p.history.length; j++) {
      const h = p.history[j];
      const dx = h.x - p.x;
      const dy = h.y - p.y;
      const blur = blurBase + j * blurStep;
      parts.push(`${dx}px ${dy}px ${blur}px ${spread}px currentColor`);
    }
    return parts.join(", ");
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute w-full h-full left-0 top-0">
        {renderParticles.map((p, i) => {
          const trailShadow = makeTrailShadow(p);
          return (
            <div key={i}>
              {/* 履歴トレイル（1ノードで多重シャドウ） */}
              {trailShadow && (
                <div
                  style={{
                    position: "absolute",
                    left: `${p.x}px`,
                    top: `${p.y}px`,
                    // 要素自体は極小。シャドウで尾を描く
                    width: `2px`,
                    height: `2px`,
                    borderRadius: "50%",
                    background: "transparent",
                    color: p.color, // currentColor に反映
                    opacity: 0.24,  // 全体の薄さ（HISTORY_LEN 減の分を少し補正）
                    boxShadow: trailShadow,
                    transform: "translate(-50%, -50%) translateZ(0)",
                    pointerEvents: "none",
                    zIndex: 51,
                    willChange: "transform, box-shadow, opacity",
                    contain: "layout paint style",
                  }}
                />
              )}

              {/* コア粒子（サイズを少し下げて描画負荷を低減）← 調整ポイント: *10 → *9 */}
              <div
                style={{
                  position: "absolute",
                  left: `${p.x}px`,
                  top: `${p.y}px`,
                  width: `${p.size * 9}px`,
                  height: `${p.size * 9}px`,
                  borderRadius: "50%",
                  background: p.color,
                  // 発光のぼかしもやや軽めに（8px/4px → 7px/3px）← 調整ポイント
                  boxShadow: `0 0 7px 3px ${p.color}`,
                  opacity: p.life * 0.85 + 0.15,
                  filter: "blur(0.2px)",
                  transform: "translate(-50%, -50%) translateZ(0)",
                  pointerEvents: "none",
                  zIndex: 52,
                  border: "none",
                  willChange: "transform, opacity",
                  contain: "layout paint style",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}