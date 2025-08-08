import { useEffect, useState, useRef } from "react";

// 花火パラメータ型
type ParticleGroupParam = {
  count?: number;
  threshold?: number;
  velocityType?: "circle" | "heart" | "star";
  velocityRange?: [number, number];
  velocityMultiplier?: number;
  gravity?: number;
  lifespanDecrement?: number;
  randomHue?: boolean;
  hueRange?: [number, number];
  saturation?: number;
  brightness?: number;
  strokeWeightValue?: number;
  trail?: boolean;
  historyLength?: number;
  updateInterval?: number;
  finish?: boolean;
  finishThreshold?: number;
  finishCount?: number;
  finishStrokeWeightValue?: number;
  finishColor?: boolean;
  finishHueRange?: [number, number];
  finishSaturation?: number;
  finishBrightness?: number;
  offsetX?: number;
  offsetY?: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  a: number;
  w: number;
  frame: number;
  color: string;
  exploded?: boolean;
  history?: { x: number; y: number; opacity: number }[];
  groupParam: ParticleGroupParam;
  lifespan: number;
  finishLocation?: { x: number; y: number };
};

const DEFAULT_PARAM: ParticleGroupParam = {
  threshold: 100,
  count: 150,
  velocityType: "circle",
  velocityRange: [1, 15],
  velocityMultiplier: 0.9,
  gravity: 0.05,
  lifespanDecrement: 2,
  randomHue: true,
  hueRange: [0, 360],
  saturation: 100,
  brightness: 100,
  strokeWeightValue: 4,
  trail: false,
  historyLength: 10,
  updateInterval: 2,
  finish: false,
  finishThreshold: 0,
  finishCount: 1,
  finishColor: true,
  finishHueRange: [0, 360],
  finishSaturation: 50,
  finishBrightness: 100,
};

const RANDOM_PARAMS: ParticleGroupParam[] = [
  // 円
  { ...DEFAULT_PARAM, velocityType: "circle" },
  // ハート
  { ...DEFAULT_PARAM, velocityType: "heart", count: 100, hueRange: [320, 360], saturation: 80 },
  // 星
  { ...DEFAULT_PARAM, velocityType: "star", count: 70, velocityRange: [3, 8], hueRange: [40, 60], saturation: 85 },
  // 尾引き円
  { ...DEFAULT_PARAM, trail: true, historyLength: 20, velocityType: "circle", count: 110, strokeWeightValue: 2.5, velocityRange: [5, 10], randomHue: false, hueRange: [180, 220], saturation: 90 },
  // 2重円
  { ...DEFAULT_PARAM, count: 120, velocityType: "circle", velocityRange: [2, 5], finish: true, finishCount: 2, finishColor: false, finishHueRange: [0, 360] },
  // 3重星
  { ...DEFAULT_PARAM, velocityType: "star", count: 90, velocityRange: [2, 4], finish: true, finishCount: 3, finishColor: false, finishHueRange: [200, 300] },
  // 虹色円
  { ...DEFAULT_PARAM, velocityType: "circle", count: 160, randomHue: false, hueRange: [0, 360], saturation: 100, brightness: 100 },
  // ゴールド冠
  { ...DEFAULT_PARAM, velocityType: "circle", count: 80, trail: true, velocityRange: [1, 9], randomHue: false, hueRange: [40, 60], brightness: 80, gravity: 0.13 },
  // 柳
  { ...DEFAULT_PARAM, velocityType: "circle", count: 60, trail: true, velocityRange: [2, 6], randomHue: false, hueRange: [100, 140], brightness: 70, gravity: 0.18 },
  // 赤い多重ハート
  { ...DEFAULT_PARAM, velocityType: "heart", count: 140, trail: true, randomHue: false, hueRange: [350, 360], gravity: 0.06, finish: true, finishCount: 1, finishColor: false, finishHueRange: [340, 360] },
];

// ランダムで複数グループを作る
function createRandomFireworkGroups(x: number, y: number, color: string) {
  // 1～3グループ合成
  const groupNum = 1 + Math.floor(Math.random() * 3);
  const params: ParticleGroupParam[] = [];
  for (let i = 0; i < groupNum; i++) {
    // ランダム選択し、オフセットもランダム
    const base = RANDOM_PARAMS[Math.floor(Math.random() * RANDOM_PARAMS.length)];
    params.push({
      ...base,
      offsetX: (Math.random() - 0.5) * 70,
      offsetY: (Math.random() - 0.5) * 70,
    });
  }
  return params.map((p) => makeParticles(x, y, color, p)).flat();
}

// ベクトル生成
function randomVelocity(param: ParticleGroupParam, i: number, n: number) {
  const vt = param.velocityType || "circle";
  const [min, max] = param.velocityRange ?? [3, 6];
  const speed = min + Math.random() * (max - min);
  if (vt === "circle") {
    const angle = (2 * Math.PI * i) / n;
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  }
  if (vt === "heart") {
    const t = (2 * Math.PI * i) / n;
    const xh = 16 * Math.pow(Math.sin(t), 3);
    const yh = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { vx: xh * speed * 0.1, vy: -yh * speed * 0.1 };
  }
  if (vt === "star") {
    const step = 2;
    const angle = ((i * step) % n) * (2 * Math.PI / n);
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  }
  return { vx: Math.cos(2 * Math.PI * i / n) * speed, vy: Math.sin(2 * Math.PI * i / n) * speed };
}

// 粒子グループ生成
function makeParticles(x: number, y: number, baseColor: string, param: ParticleGroupParam): Particle[] {
  const n = param.count ?? 60;
  let color = baseColor;
  if (param.randomHue) {
    const h = Math.floor(Math.random() * 360);
    color = `hsl(${h},${param.saturation ?? 100}%,${param.brightness ?? 100}%)`;
  }
  if (param.hueRange && !param.randomHue) {
    const h = param.hueRange[0] + Math.random() * (param.hueRange[1] - param.hueRange[0]);
    color = `hsl(${Math.floor(h)},${param.saturation ?? 100}%,${param.brightness ?? 100}%)`;
  }
  return Array.from({ length: n }, (_, i) => {
    const { vx, vy } = randomVelocity(param, i, n);
    return {
      x: x + (param.offsetX ?? 0),
      y: y + (param.offsetY ?? 0),
      vx,
      vy,
      opacity: 1,
      size: 1,
      a: 255,
      w: param.strokeWeightValue ?? 4,
      frame: 0,
      color,
      groupParam: param,
      lifespan: 255,
      history: [],
    };
  });
}

// 打ち上げ演出(Rocket)→爆発
export default function Firework({
  x = window.innerWidth / 2,
  y = window.innerHeight / 3,
  color = "#ff69b4",
  size = 1,
  launchSpeed = 1,
  onEnd,
  onExplode,
}: {
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  launchSpeed?: number;
  onEnd?: () => void;
  onExplode?: (x: number, y: number) => void;
}) {
  const [state, setState] = useState<"launch" | "explode">("launch");
  const [rocket, setRocket] = useState<{ x: number; y: number; vy: number }>({
    x,
    y: window.innerHeight - 30,
    vy: -12 * size * launchSpeed * (0.9 + Math.random() * 0.3),
  });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(true);
  const explodedRef = useRef(false);

  // 打ち上げ
  useEffect(() => {
    if (state !== "launch") return;
    let rafId: number;
    const animate = () => {
      setRocket((prev) => {
        const nextY = prev.y + prev.vy;
        const nextVy = prev.vy + 0.23 * size; // 重力
        if (nextY <= y) {
          setState("explode");
          if (onExplode && !explodedRef.current) {
            onExplode(prev.x, nextY);
            explodedRef.current = true;
          }
          return prev;
        }
        setParticles([
          {
            x: prev.x,
            y: prev.y,
            vx: 0,
            vy: 0,
            opacity: 1,
            size: 1,
            a: 255,
            w: 9 * size,
            frame: 0,
            color,
            groupParam: DEFAULT_PARAM,
            lifespan: 255,
            history: [],
          },
        ]);
        return { ...prev, y: nextY, vy: nextVy };
      });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line
  }, [state, y, color, size, launchSpeed]);

  // 爆発
  useEffect(() => {
    if (state !== "explode") return;
    setParticles(createRandomFireworkGroups(rocket.x, y, color));
    // eslint-disable-next-line
  }, [state, rocket.x, y, color]);

  // 爆発アニメ
  useEffect(() => {
    if (state !== "explode") return;
    if (particles.length === 0) return;
    let rafId: number;
    const animate = () => {
      setParticles((prev) => {
        const arr: Particle[] = [];
        for (let p of prev) {
          p.frame++;
          // 残像
          if (p.groupParam.trail) {
            p.history = [...(p.history ?? []), { x: p.x, y: p.y, opacity: p.opacity }];
            if (p.history.length > (p.groupParam.historyLength || 10)) p.history.shift();
          }
          // 位置
          p.x += p.vx;
          p.y += p.vy;
          // 減速
          p.vx *= p.groupParam.velocityMultiplier ?? 0.9;
          p.vy *= p.groupParam.velocityMultiplier ?? 0.9;
          // 重力
          p.vy += p.groupParam.gravity ?? 0.05;
          // 寿命
          p.lifespan -= p.groupParam.lifespanDecrement ?? 2;
          // 消える演出
          if (p.lifespan < 0) continue;
          p.opacity = Math.max(0, p.lifespan / 255);
          arr.push(p);
        }
        if (arr.length === 0) {
          setShow(false);
          if (onEnd) onEnd();
          return [];
        }
        return arr;
      });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line
  }, [state, particles.length, onEnd]);

  if (!show) return null;

  // ロケット/残像描画
  if (state === "launch") {
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
                width: `${p.w * 0.7}px`,
                height: `${p.w * 2}px`,
                borderRadius: "40% 40% 40% 40%/60% 60% 60% 60%",
                background: p.color,
                opacity: 0.7,
                boxShadow: `0 0 20px 7px ${p.color}bb`,
                transform: "translate(-50%, -50%)",
                filter: "blur(1.2px)",
                pointerEvents: "none",
                zIndex: 51,
                transition: "background 0.14s",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // 爆発描画
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute w-full h-full left-0 top-0">
        {particles.map((p, i) => (
          <div key={i}>
            {/* 残像 */}
            {p.groupParam.trail &&
              (p.history ?? []).map((h, j) => (
                <div
                  key={j}
                  style={{
                    position: "absolute",
                    left: `${h.x}px`,
                    top: `${h.y}px`,
                    width: `${p.w}px`,
                    height: `${p.w}px`,
                    borderRadius: "50%",
                    background: p.color,
                    opacity: h.opacity * 0.5,
                    boxShadow: `0 0 20px 7px ${p.color}77`,
                    transform: "translate(-50%, -50%)",
                    filter: "blur(2.5px)",
                    pointerEvents: "none",
                    zIndex: 51,
                  }}
                />
              ))}
            {/* 本体 */}
            <div
              style={{
                position: "absolute",
                left: `${p.x}px`,
                top: `${p.y}px`,
                width: `${p.w}px`,
                height: `${p.w}px`,
                borderRadius: "50%",
                background: p.color,
                opacity: p.opacity,
                boxShadow: `0 0 30px 12px ${p.color}88`,
                transform: "translate(-50%, -50%)",
                filter: "blur(0.8px)",
                pointerEvents: "none",
                zIndex: 52,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}