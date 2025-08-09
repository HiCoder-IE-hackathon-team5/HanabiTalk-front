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
function getCentralY() {
  const min = window.innerHeight * 0.32;
  const max = window.innerHeight * 0.60;
  return Math.random() * (max - min) + min;
}
function getFireworkSize(message: string) {
  return Math.min(2.5, 1.0 + message.length / 40);
}
function getFireworkDuration(message: string) {
  return Math.max(3, Math.min(9, message.length * 0.06));
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
// 約5割で classic を、それ以外は残りの形から等確率で選ぶ
function getRandomShape(): FireworkShape {
  if (Math.random() < 0.8) return "classic";
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
        shape: getRandomShape(), // メッセージごとにランダム形状（約5割で classic）
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
      {/* 右下のヘッダー・ユーザ情報＋「チャットページ」文言もこの中へ */}
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
      {/* 入力欄を左下に絶対位置配置 */}
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

// 花火とメッセージ表示
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

  const handleFireworkEnd = () => {
    setShowMsg(false);
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
        onExplode={() => setShowMsg(true)}
      />
      {showMsg && (
        <div
          style={{
            position: "fixed",
            left: `${x}px`,
            top: `${y}px`,
            transform: "translate(-50%, -50%)",
            width: "min(34vw, 360px)",
            height: "min(34vw, 360px)",
            borderRadius: "50%",
            background: "none",
            color: "#eaf1ff",
            fontWeight: 700,
            fontSize: "clamp(1rem, 3.2vw, 2.2rem)",
            textShadow:
              "0 0 2px #fff, 0 0 8px rgba(255,255,255,.9), 0 0 18px rgba(183,205,255,.9), 0 2px 4px rgba(0,0,0,.65)",
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
          }}
        >
          {message}
        </div>
      )}
    </>
  );
}