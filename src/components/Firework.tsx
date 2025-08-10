import { useEffect, useRef, useState } from "react";

export type FireworkShape =
  | "classic"
  | "circle"
  | "heart"
  | "star"
  | "clover"
  | "diamond"
  | "hexagon"
  | "kamuro"
  | "w"; // 「w」文字形

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 -> 0
  size: number;
  color: string;
  history: { x: number; y: number; opacity: number }[];
  // w の形を「少しだけ」崩すための決定的シード（他形状では未使用）
  seed?: number;
};

export type FireworkProps = {
  x: number;
  y: number;         // 爆発させたい目標Y
  color: string;
  size: number;      // 1.0 基準（爆発半径スケールにも反映）
  duration: number;  // 秒（寿命に反映）
  launchSpeed: number; // 0.7〜1.5 目安（初速へは弱めに反映）
  shape: FireworkShape;
  onEnd: () => void;
  onExplode: () => void;
};

// 描画FPS（下げるほど軽いがカクつき増）
const DRAW_FPS = 20;
const DRAW_INTERVAL = 1000 / DRAW_FPS;

// トレイル履歴数（層数を減らすと軽いが尾が短/薄に）
const HISTORY_LEN = 3;

const UNIFORM_GRAVITY = 0.030;
const FRICTION = 0.90;

// 初速の基準（下げると広がりが控えめ＆負荷減）
const BASE_SPEED = 6.5;

// 上昇の減速（「ゆっくり上がる」を維持）
const ROCKET_DECEL = 0.18;

// 粒子数
const PARTICLE_COUNTS: Record<FireworkShape, number> = {
  classic: 56, // 64 → 56
  circle: 32,  // 36 → 32
  kamuro: 52,  // 60 → 52
  heart: 36,   // 42 → 36
  star: 36,    // 44 → 36
  clover: 36,  // 44 → 36
  diamond: 36, // 42 → 36
  hexagon: 40, // 48 → 40
  w: 46,
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
  w: 1.10,
};

// 文字量に応じた爆発半径（初速）スケール
function getExplosionSpeedScale(size: number) {
  return Math.min(2.8, 0.8 + 0.8 * size);
}

// 目標Yにほぼ到達するよう、必要な初速を目標Yから逆算（離散系の近似）
function computeInitialVyForTarget(targetY: number, size: number, launchSpeed: number) {
  const startY = typeof window !== "undefined" ? window.innerHeight - 30 : 600;
  const a = ROCKET_DECEL * size;
  const deltaY = Math.max(0, startY - targetY);
  const v0mag = Math.sqrt(Math.max(2 * a * deltaY, 0.01));
  const ls = Math.max(0.9, Math.min(1.1, launchSpeed));
  const FUDGE = 0.96;
  return -v0mag * FUDGE * ls;
}

/**
 * 「w」骨格（A→B→C→D→E）上の等間隔点と、その法線方向の等間隔行（rows）を生成。
 * - 画面座標系（上が負Y, 下が正Y）に合わせた正規化座標を返す。
 */
function wEvenPoints(n: number, rows = 3, thickness = 0.16) {
  // 背の低い「w」っぽく
  const topY = -0.42;
  const bottomY = 0.52;
  const pts = [
    { x: -1.0, y: topY },
    { x: -0.5, y: bottomY },
    { x: 0.0, y: topY },
    { x: 0.5, y: bottomY },
    { x: 1.0, y: topY },
  ];
  type Vec = { x: number; y: number };
  const segs: Array<{ P: Vec; Q: Vec; len: number }> = [];
  let totalLen = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const P = pts[i], Q = pts[i + 1];
    const len = Math.hypot(Q.x - P.x, Q.y - P.y);
    segs.push({ P, Q, len });
    totalLen += len;
  }

  // t(0..1) → 点・法線を得る
  function pointAndNormalAt(t: number) {
    let d = t * totalLen;
    let P = segs[0].P, Q = segs[0].Q, len = segs[0].len;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i].len || i === segs.length - 1) {
        P = segs[i].P; Q = segs[i].Q; len = segs[i].len;
        break;
      }
      d -= segs[i].len;
    }
    const u = len > 0 ? d / len : 0;
    const px = P.x + (Q.x - P.x) * u;
    const py = P.y + (Q.y - P.y) * u;
    const dx = Q.x - P.x;
    const dy = Q.y - P.y;
    const L = Math.hypot(dx, dy) || 1;
    // 右手系の法線（上:負Y/下:正Yの画面座標系）
    const nx = -dy / L;
    const ny = dx / L;
    return { px, py, nx, ny };
  }

  // 行ごとの配分（等分＋余りは先行行へ）
  const counts: number[] = [];
  const base = Math.floor(n / rows);
  let rem = n % rows;
  for (let r = 0; r < rows; r++) {
    counts[r] = base + (rem > 0 ? 1 : 0);
    rem--;
  }

  const out: Array<{ ox: number; oy: number }> = [];
  // くっきり表示のための微少ジッタ（控えめ）
  const jitter = 0.004;
  for (let r = 0; r < rows; r++) {
    const kMax = counts[r];
    if (kMax <= 0) continue;
    // 行のオフセット（-thickness..+thicknessの等間隔）
    const rowT = rows === 1 ? 0 : (r / (rows - 1)) * 2 - 1; // -1..+1
    const offset = thickness * rowT;
    for (let k = 0; k < kMax; k++) {
      // 骨格上の等間隔（中心寄せ）
      const t = (k + 0.5) / kMax;
      const { px, py, nx, ny } = pointAndNormalAt(t);
      const jx = Math.sin((k + 1) * 2.399) * jitter * 0.5;
      const jy = Math.cos((r + 1) * 1.731) * jitter * 0.5;
      const ox = px + nx * offset + jx;
      const oy = py + ny * offset + jy;
      out.push({ ox, oy });
    }
  }
  return out;
}

function randomVelocity(shape: FireworkShape, i: number, n: number, speed: number) {
  switch (shape) {
    case "classic": {
      const a = Math.random() * Math.PI * 2;
      const r = 0.5 + 0.5 * Math.sqrt(Math.random());
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
      const r = 0.7 + (0.3 * (1 + Math.sin(3 * t))) / 2;
      return { vx: Math.cos(t) * speed * r, vy: Math.sin(t) * speed * r };
    }
    case "diamond": {
      const a = (2 * Math.PI * i) / n;
      const r = Math.max(0.75, Math.abs(Math.cos(a)) + Math.abs(Math.sin(a)) * 0.75);
      return { vx: Math.cos(a) * speed * r, vy: Math.sin(a) * speed * r };
    }
    case "hexagon": {
      const hex = Math.floor((i / n) * 6);
      const a = (2 * Math.PI * hex) / 6;
      return { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
    }
    case "w": {
      // 「w」は位置を等間隔で直置きするため速度はほぼ不要
      return { vx: 0, vy: 0 };
    }
  }
}

// w の「形崩し」用パラメータ（ごく弱く、時間とともに微妙に流す）
const TAU = Math.PI * 2;
const W_DRIFT_ACCEL = 0.0035;  // 1ステップあたりのごく小さな擬似加速度
const W_DRIFT_FREQ_X = 0.60;   // Hz 相当（60fps 基準の目安）
const W_DRIFT_FREQ_Y = 0.83;   // Hz 相当（X と微妙にずらす）

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
  const shapeRef = useRef<FireworkShape>(shape); // 物理ループから参照

  // w のドリフト時間管理（60fps換算でステップ加算）
  const wTickRef = useRef<number>(0);

  const onEndRef = useRef(onEnd);
  const onExplodeRef = useRef(onExplode);
  useEffect(() => {
    onEndRef.current = onEnd;
    onExplodeRef.current = onExplode;
  }, [onEnd, onExplode]);

  useEffect(() => {
    shapeRef.current = shape;
  }, [shape]);

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
    wTickRef.current = 0;

    let rafId = 0;
    let prev = performance.now();

    const stepMs = 1000 / 60; // 物理演算は60fps相当で安定
    let acc = 0;

    const initExplosion = () => {
      const n = PARTICLE_COUNTS[shape];
      const arr: Particle[] = [];

      const explosionCssColor = color;
      const base = BASE_SPEED * getExplosionSpeedScale(size);
      const spd = base * SHAPE_RADIUS_NORMALIZER[shape];

      if (shape === "w") {
        // 等間隔配置で「w」をくっきり描く（秩序ある配置）
        const offsets = wEvenPoints(n, 3, 0.16); // rows=3, 太さ=0.16
        const R = spd * 7.0; // 正規化座標 → ピクセル半径
        for (let i = 0; i < n; i++) {
          const o = offsets[i];
          // きらめきは控えめ（形を壊さない）＋ 初速で下向きバイアス
          const jx = (Math.sin(i * 1.7) * 0.5 + 0.5) * 0.1 - 0.05;
          const jy = (Math.cos(i * 1.3) * 0.5 + 0.5) * 0.1 - 0.05;
          const vyBias = 0.28; // 落下開始を早めるための微小な下向きバイアス

          // 決定的シード（形崩しの位相用）
          const sRaw = Math.sin((i + 1) * 12.9898) * 43758.5453;
          const seed = sRaw - Math.floor(sRaw); // 0..1

          arr.push({
            x: x + o.ox * R,
            y: y + o.oy * R,
            vx: jx,
            vy: jy + vyBias,
            life: 1,
            size: 1.1 + Math.random() * 0.5,
            color: explosionCssColor,
            history: [],
            seed,
          });
        }
      } else {
        // 従来の放射系
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
          // explode フェーズの経過ステップ（w のドリフト用）
          wTickRef.current += 1;

          const pArr = particlesRef.current;
          const decay = stepMs / (duration * 1000);
          let alive = 0;

          // 「文字（w）」の落下強化（前仕様を維持）
          const isW = shapeRef.current === "w";
          const gravity = isW ? 0.03 : UNIFORM_GRAVITY;
          const friction = isW ? 0.9 : FRICTION;
          const maxVel = isW ? 0.8 : 999;

          const maxHist = isW ? 2 : HISTORY_LEN; // w は尾を短く（くっきり優先）

          // w の形を少しずつ崩すための擬似ドリフト（ごく微小）
          const tSec = wTickRef.current / 60;
          for (let p of pArr) {
            if (p.life <= 0) continue;

            // 形崩し（w限定）：位相ごとに微小な正弦ゆらぎを加える
            if (isW) {
              const phase = (p.seed ?? 0) * TAU;
              // 寿命が減るほど僅かに振幅を増やす（最大でも小さい）
              const amp = W_DRIFT_ACCEL * (0.6 + (1 - p.life) * 0.7);
              p.vx += Math.sin(tSec * TAU * W_DRIFT_FREQ_X + phase) * amp;
              p.vy += Math.cos(tSec * TAU * W_DRIFT_FREQ_Y + phase * 1.3) * (amp * 0.9);
            }

            // 履歴（尾）は多重 box-shadow で1ノード描画
            p.history.push({ x: p.x, y: p.y, opacity: p.life });
            if (p.history.length > maxHist) p.history.shift();

            p.x += p.vx;
            p.y += p.vy;

            p.vx *= friction;
            p.vy = p.vy * friction + gravity;

            if (isW) {
              // 速度クランプ（にじみ/流れ防止）
              if (p.vx > maxVel) p.vx = maxVel;
              if (p.vx < -maxVel) p.vx = -maxVel;
              if (p.vy > maxVel) p.vy = maxVel;
              if (p.vy < -maxVel) p.vy = -maxVel;
            }

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

      // 描画間引き
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

  const isW = shape === "w";

  // トレイル（履歴）を複数の box-shadow にまとめて1ノード描画
  const makeTrailShadow = (p: Particle) => {
    if (!p.history.length) return "";
    const parts: string[] = [];
    // w はさらにシャープに（blur/step を下げる）
    const blurBase = isW ? 2 : 4;
    const blurStep = isW ? 1 : 2;
    const spread = isW ? 0.8 : 1;
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
                    width: `2px`,
                    height: `2px`,
                    borderRadius: "50%",
                    background: "transparent",
                    color: p.color, // currentColor に反映
                    opacity: isW ? 0.18 : 0.24, // w は尾を控えめにしてくっきり
                    boxShadow: trailShadow,
                    transform: "translate(-50%, -50%) translateZ(0)",
                    pointerEvents: "none",
                    zIndex: 51,
                    willChange: "transform, box-shadow, opacity",
                    contain: "layout paint style",
                  }}
                />
              )}

              {/* コア粒子（w はさらにシャープに） */}
              <div
                style={{
                  position: "absolute",
                  left: `${p.x}px`,
                  top: `${p.y}px`,
                  width: `${p.size * (isW ? 8.3 : 9)}px`,
                  height: `${p.size * (isW ? 8.3 : 9)}px`,
                  borderRadius: "50%",
                  background: p.color,
                  boxShadow: isW ? `0 0 4px 2px ${p.color}` : `0 0 7px 3px ${p.color}`,
                  opacity: p.life * 0.9 + 0.1, // w は少しだけ明るめ
                  filter: isW ? "none" : "blur(0.2px)",
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