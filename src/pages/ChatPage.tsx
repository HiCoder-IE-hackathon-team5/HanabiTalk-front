import { useState, useEffect, useRef } from "react";
import SidePanel from "../components/SidePanel";
import ChatLog from "../components/ChatLog";
import PanelToggleButton from "../components/PanelToggleButton";
import MessageInput from "../components/MessageInput";
import Logout from "../components/Logout";
import Firework, { type FireworkShape } from "../components/Firework";
import StarryBackground from "../components/StarryBackground";
import { subscribeMockMessages, addMockMessage } from "../mocks/messageMock";
import { getCookie } from "../utils/cookie";
import type { MessagePayload } from "../mocks/messageMock";

type FireworkItem = {
  id: string;
  message: string;
  color: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  launchSpeed: number;
  shape: FireworkShape;
};

function getLaunchX() {
  // 左右の出現範囲をやや狭め（安全マージン ~8vw）
  const edge = Math.max(24, window.innerWidth * 0.08);
  const min = edge;
  const max = window.innerWidth - edge;
  return Math.random() * (max - min) + min;
}
function getCentralY() {
  const min = window.innerHeight * 0.18;
  const max = window.innerHeight * 0.78;
  return Math.random() * (max - min) + min;
}
function quantize(value: number, min: number, max: number, steps: number) {
  const clamped = Math.max(min, Math.min(max, value));
  const t = (clamped - min) / (max - min);
  const idx = Math.round(t * (steps - 1));
  return min + (idx / (steps - 1)) * (max - min);
}
function getFireworkSize(message: string) {
  const len = [...message].length;
  const raw = Math.min(5.0, 1.0 + len / 15);
  return quantize(raw, 1.0, 3.0, 10);
}
function getFireworkDuration(message: string) {
  const len = [...message].length;
  return Math.max(3, Math.min(12, 3 + len * 0.08));
}
function getFireworkLaunchSpeed(message: string) {
  return Math.max(0.7, Math.min(1.5, 1.5 - message.length * 0.015));
}

const NON_CLASSIC_SHAPES: FireworkShape[] = [
  "circle",
  "kamuro",
  "heart",
  "star",
  "clover",
  "diamond",
  "hexagon",
];
function getRandomShape(): FireworkShape {
  if (Math.random() < 0.6) return "classic";
  return NON_CLASSIC_SHAPES[Math.floor(Math.random() * NON_CLASSIC_SHAPES.length)];
}

/**
 * テキスト落下と花火物理を合わせるための共有パラメータ
 * Firework 側の非w重力/摩擦と同じ数値を使う（同期）
 */
const STEP_MS = 1000 / 60;           // Firework の物理ステップと同じ
const FRICTION_NON_W = 0.92;         // Firework の FRICTION
const GRAVITY_BASE = 0.045;          // Firework の UNIFORM_GRAVITY

// ここを調整して「テキストだけ」落下を弱める
const TEXT_FALL_SCALE_FIREWORK = 1.6; // 粒子（非w）に渡す重力倍率（据え置き）
const TEXT_FALL_SCALE_TEXT = 0.6;    // テキストの重力倍率（以前 1.6 → 少し弱め）
const TEXT_FADE_GROW = 0.60; // 消える間に最大で+60%拡大（数値を上げるとより大きく）

// n ステップ後の離散系落下距離（初速 0、v_{k+1} = F*v_k + g）
// 累積位置 Y(n) = g * [ n/(1-F) - (1 - F^n)/(1-F)^2 ]
function dropPixelsFromSteps(nSteps: number, g: number, F: number) {
  const oneMinusF = 1 - F;
  if (oneMinusF <= 0) return 0;
  const Fn = Math.pow(F, nSteps);
  const term1 = nSteps / oneMinusF;
  const term2 = (1 - Fn) / (oneMinusF * oneMinusF);
  return g * (term1 - term2);
}

export default function ChatPage() {
  const userName = getCookie("user_name") || "you";
  const roomName = getCookie("room_name") || "General";

  const [logOpen, setLogOpen] = useState(false);
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [fireworkItems, setFireworkItems] = useState<FireworkItem[]>([]);
  const lastMessageRef = useRef<MessagePayload | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeMockMessages(roomName, (msgs) => setMessages(msgs));
    return unsubscribe;
  }, [roomName]);

  useEffect(() => {
    if (messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (lastMessageRef.current && lastMessageRef.current === latest) return;
    lastMessageRef.current = latest;

    const norm = latest.message.trim().normalize("NFKC").toLowerCase();
    const isW = norm === "w";

    setFireworkItems((items) => [
      ...items,
      {
        id: `${latest.room_name}-${latest.user_name}-${latest.message}-${Date.now()}`,
        message: latest.message,
        color: latest.color,
        x: getLaunchX(),
        y: getCentralY(),
        size: getFireworkSize(latest.message),
        duration: getFireworkDuration(latest.message),
        launchSpeed: getFireworkLaunchSpeed(latest.message),
        shape: isW ? "w" : getRandomShape(),
      },
    ]);
  }, [messages]);

  const sendMessage = (data: { message: string; color: string }) => {
    if (!data.message.trim()) return;
    const payload: MessagePayload = {
      user_name: userName,
      message: data.message,
      room_name: roomName,
      color: data.color,
    };
    addMockMessage(payload);
    setMessages((prev) => [...prev, payload]);
  };

  const handleFireworkEnd = (id: string) => {
    setFireworkItems((items) => items.filter((item) => item.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", position: "relative" }}>
      <StarryBackground />

      <SidePanel isOpen={logOpen}>
        <ChatLog messages={messages} userName={userName} />
      </SidePanel>

      <PanelToggleButton onClick={() => setLogOpen((open) => !open)} isOpen={logOpen} />

      {/* 花火（非wのときはメッセージオーバーレイを表示） */}
      {fireworkItems.map((item) => {
        const asTextW = item.shape === "w";
        return (
          <FireworkWithMessage
            key={item.id}
            id={item.id}
            x={item.x}
            y={item.y}
            color={item.color}
            message={item.message}
            size={item.size}
            duration={item.duration}
            launchSpeed={item.launchSpeed}
            shape={item.shape}
            onEnd={handleFireworkEnd}
            asTextW={asTextW}
          />
        );
      })}

      <div
        style={{
          position: "fixed",
          right: 0,
          bottom: 0,
          padding: "1.5em 2em",
          zIndex: 50,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          background: "transparent",
          gap: "1.3em",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "1.2em",
            fontSize: "1em",
            color: "#eee",
            fontWeight: 400,
            background: "rgba(30,32,39,0.93)",
            borderRadius: "8px",
            padding: "0.6em 1.4em 0.6em 1.4em",
            pointerEvents: "auto",
            boxShadow: "0 2px 12px #0003",
          }}
        >
          <span
            style={{
              fontSize: "1.1em",
              color: "#b5badc",
              opacity: 0.7,
              fontWeight: 500,
              letterSpacing: "0.04em",
              textShadow: "0 0 2px #121222",
              userSelect: "none",
              marginRight: "1.2em",
            }}
          >
            チャットページ
          </span>
          <span>ユーザー: <b>{userName}</b></span>
          <span>ルーム: <b>{roomName}</b></span>
          <span>
            <Logout
              style={{
                fontSize: "1.05em",
                padding: "0.35em 1.1em",
                borderRadius: "8px",
                background: "linear-gradient(90deg,#6366f1 60%,#a56cf5 100%)",
                color: "#fff",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
                margin: 0,
                boxShadow: "0 1px 8px #6366f155",
                transition: "background 0.18s, box-shadow 0.12s, transform 0.09s",
                outline: "none",
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
          </span>
        </div>
      </div>

      {/* 入力欄 */}
      <div
        style={{
          position: "fixed",
          left: 12,
          bottom: 12,
          width: "min(520px, 92vw)",
          zIndex: 100,
        }}
      >
        <MessageInput sendMessage={sendMessage} />
      </div>
    </div>
  );
}

// 花火＋メッセージ（非wのみメッセージオーバーレイを表示）
function FireworkWithMessage({
  id,
  x,
  y,
  color,
  message,
  size,
  duration,
  launchSpeed,
  shape,
  onEnd,
  asTextW = false,
}: {
  id: string;
  x: number;
  y: number;
  color: string;
  message: string;
  size: number;
  duration: number;
  launchSpeed: number;
  shape: FireworkShape;
  onEnd: (id: string) => void;
  asTextW?: boolean;
}) {
  const [showMsg, setShowMsg] = useState(false);
  const [msgOpacity, setMsgOpacity] = useState(0);
  const [msgYOffset, setMsgYOffset] = useState(0); // 下方向オフセット(px)
  const [msgScale, setMsgScale] = useState(1);

  const fadeRafRef = useRef<number | null>(null);
  const fadeStartRef = useRef<number | null>(null);

  const stopFade = () => {
    if (fadeRafRef.current != null) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
    fadeStartRef.current = null;
  };

  // Firework の非w物理と合わせつつ「テキストだけ」弱める
  const gravityForText = GRAVITY_BASE * TEXT_FALL_SCALE_TEXT;
  const frictionForText = FRICTION_NON_W;

  // 離散物理に合わせた落下（花火の粒子と同じ 60fps/重力/摩擦）
  const startFadeAndFall = () => {
    stopFade();
    setMsgOpacity(1);
    setMsgYOffset(0);
    setMsgScale(1); // 追加
    fadeStartRef.current = performance.now();

    const totalMs = duration * 1000;

    const tick = (now: number) => {
      if (fadeStartRef.current == null) return;
      const elapsedMs = now - fadeStartRef.current;
      const clampedMs = Math.min(elapsedMs, totalMs);

      // 経過ステップ数（整数ステップで Firework と完全一致）
      const steps = Math.floor(clampedMs / STEP_MS);

      // 初速 0 とみなしたときの理論落下距離
      const drop = dropPixelsFromSteps(steps, gravityForText, frictionForText);

      // フェードは従来どおり線形
      const t = Math.min(1, clampedMs / totalMs);
      setMsgOpacity(1 - t);
      setMsgYOffset(drop);
      setMsgScale(1 + TEXT_FADE_GROW * t); // フェード進行に応じて 1 → 1+GROW へ

      if (clampedMs < totalMs) {
        fadeRafRef.current = requestAnimationFrame(tick);
      } else {
        fadeRafRef.current = null;
      }
    };
    fadeRafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => stopFade();
  }, []);

  const handleFireworkEnd = () => {
    setShowMsg(false);
    setMsgOpacity(0);
    setMsgYOffset(0);
    setMsgScale(1); // 追加
    stopFade();
    onEnd(id);
  };

  return (
    <>
      <Firework
        x={x}
        y={y}
        color={color}
        size={size}
        duration={duration}
        launchSpeed={launchSpeed}
        shape={shape}
        onEnd={handleFireworkEnd}
        onExplode={() => {
          if (!asTextW) {
            setShowMsg(true);   // ← 非wのときはメッセージを表示
            startFadeAndFall();
          }
        }}
        // 非wの粒子重力は従来どおり（やや強め）にしておき、テキストだけ弱める
        {...(!asTextW
          ? { textMode: true, textFallScale: TEXT_FALL_SCALE_FIREWORK }
          : {})}
      />
      {!asTextW && showMsg && (
        <div
          style={{
            position: "fixed",
            left: `${x}px`,
            top: `${y + msgYOffset}px`,
            transform: `translate(-50%, -50%) scale(${msgScale})`,
            transformOrigin: "center center",
            width: "min(40vw, 440px)",
            height: "min(40vw, 440px)",
            borderRadius: "50%",
            background: "none",
            color: color,
            textShadow:
              "0 0 2px #fff, 0 0 10px currentColor, 0 0 22px currentColor, 0 0 36px currentColor, 0 2px 4px rgba(0,0,0,.65)",
            WebkitTextStroke: "0.6px rgba(0,0,0,0.25)",
            fontWeight: 700,
            fontSize: "clamp(0.9rem, 2.8vw, 2.0rem)",
            pointerEvents: "none",
            zIndex: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            boxSizing: "border-box",
            padding: "0.85em",
            wordBreak: "break-word",
            whiteSpace: "pre-line",
            overflow: "hidden",
            userSelect: "none",
            opacity: msgOpacity,
          }}
        >
          {message}
        </div>
      )}
    </>
  );
}