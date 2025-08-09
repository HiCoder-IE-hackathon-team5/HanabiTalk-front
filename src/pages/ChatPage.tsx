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

function getCentralX() {
  const min = window.innerWidth * 0.25;
  const max = window.innerWidth * 0.75;
  return Math.random() * (max - min) + min;
}

// 上にも下にもバランス良く出るよう、上下のレンジを広げつつ一様分布に
function getCentralY() {
  const min = window.innerHeight * 0.18; // 画面上部すぎを避ける
  const max = window.innerHeight * 0.78; // 画面下部のUIとかぶりにくい範囲
  return Math.random() * (max - min) + min; // 偏りなし（バランス良く）
}

// 段階（ステップ）数を増やしてサイズを量子化（例: 10段階）
function quantize(value: number, min: number, max: number, steps: number) {
  const clamped = Math.max(min, Math.min(max, value));
  const t = (clamped - min) / (max - min);
  const idx = Math.round(t * (steps - 1));
  return min + (idx / (steps - 1)) * (max - min);
}

// 文字量が増えるほど「大きく」なるが、段階的に増えるように
function getFireworkSize(message: string) {
  const len = [...message].length; // 絵文字なども1文字としてカウント
  const raw = Math.min(3.0, 1.0 + len / 30); // 1.0〜3.0に連続スケール
  return quantize(raw, 1.0, 3.0, 10);        // ← 10段階に量子化
}
function getFireworkDuration(message: string) {
  const len = [...message].length;
  // 消える速度（寿命）は連続スケール
  return Math.max(3, Math.min(12, 3 + len * 0.08));
}
function getFireworkLaunchSpeed(message: string) {
  return Math.max(0.7, Math.min(1.5, 1.5 - message.length * 0.015));
}

// 形の候補（classic 以外）
const NON_CLASSIC_SHAPES: FireworkShape[] = [
  "circle",
  "kamuro",
  "heart",
  "star",
  "clover",
  "diamond",
  "hexagon",
];
// 約8割で classic（必要なら 0.5 で5割に）
function getRandomShape(): FireworkShape {
  if (Math.random() < 0.6) return "classic";
  return NON_CLASSIC_SHAPES[Math.floor(Math.random() * NON_CLASSIC_SHAPES.length)];
}

export default function ChatPage() {
  // ログイン時にcookieへ保存されている値を取得
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

    setFireworkItems(items => [
      ...items,
      {
        id: `${latest.room_name}-${latest.user_name}-${latest.message}-${Date.now()}`,
        message: latest.message,
        color: latest.color,
        x: getCentralX(),
        y: getCentralY(),
        size: getFireworkSize(latest.message),
        duration: getFireworkDuration(latest.message),
        launchSpeed: getFireworkLaunchSpeed(latest.message),
        shape: getRandomShape(),
      }
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
    setFireworkItems(items => items.filter(item => item.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", position: "relative" }}>
      <StarryBackground />
      {/* ログパネル */}
      <SidePanel isOpen={logOpen}>
        <ChatLog messages={messages} userName={userName} />
      </SidePanel>
      {/* サイドパネルのトグルボタン */}
      <PanelToggleButton
        onClick={() => setLogOpen((open) => !open)}
        isOpen={logOpen}
      />
      {/* 花火エフェクト */}
      {fireworkItems.map(item => (
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
        />
      ))}
      {/* 右下のヘッダー・ユーザ情報 */}
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
          pointerEvents: "none"
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
            boxShadow: "0 2px 12px #0003"
          }}
        >
          <span style={{
            fontSize: "1.1em",
            color: "#b5badc",
            opacity: 0.7,
            fontWeight: 500,
            letterSpacing: "0.04em",
            textShadow: "0 0 2px #121222",
            userSelect: "none",
            marginRight: "1.2em"
          }}>
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
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
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

// 花火とメッセージ表示（爆発中の寿命と同じ長さでフェード＋落下）
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
}) {
  const [showMsg, setShowMsg] = useState(false);
  const [msgOpacity, setMsgOpacity] = useState(0);
  const [msgYOffset, setMsgYOffset] = useState(0); // 下方向オフセット(px)

  const fadeRafRef = useRef<number | null>(null);
  const fadeStartRef = useRef<number | null>(null);

  const stopFade = () => {
    if (fadeRafRef.current != null) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
    fadeStartRef.current = null;
  };

  function getMaxDropPx(size: number, duration: number) {
    const base = 60;
    const bySize = (size - 1) * 45;
    const byDur = (duration - 3) * 8;
    return Math.min(200, base + bySize + byDur);
  }

  const startFadeAndFall = () => {
    stopFade();
    setMsgOpacity(1);
    setMsgYOffset(0);
    fadeStartRef.current = performance.now();

    const maxDrop = getMaxDropPx(size, duration);

    const tick = (now: number) => {
      if (fadeStartRef.current == null) return;
      const elapsed = now - fadeStartRef.current;
      const total = duration * 1000;
      const t = Math.min(1, elapsed / total);

      setMsgOpacity(1 - t);          // フェード
      setMsgYOffset(maxDrop * t * t); // 落下（加速）

      if (t < 1) {
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
          setShowMsg(true);
          startFadeAndFall();
        }}
      />
      {showMsg && (
        <div
          style={{
            position: "fixed",
            left: `${x}px`,
            top: `${y + msgYOffset}px`,
            transform: "translate(-50%, -50%)",
            width: "min(34vw, 360px)",
            height: "min(34vw, 360px)",
            borderRadius: "50%",
            background: "none",
            color: color,
            textShadow:
              "0 0 2px #fff, 0 0 10px currentColor, 0 0 22px currentColor, 0 0 36px currentColor, 0 2px 4px rgba(0,0,0,.65)",
            WebkitTextStroke: "0.6px rgba(0,0,0,0.25)",
            fontWeight: 700,
            fontSize: "clamp(1rem, 3.2vw, 2.2rem)",
            pointerEvents: "none",
            zIndex: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            boxSizing: "border-box",
            padding: "1em",
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