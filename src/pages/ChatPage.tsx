import { useState, useEffect, useRef } from "react";
import SidePanel from "../components/SidePanel";
import ChatLog from "../components/ChatLog";
import PanelToggleButton from "../components/PanelToggleButton";
import MessageInput from "../components/MessageInput";
import Logout from "../components/Logout";
import Firework from "../components/Firework";
import type { MessagePayload } from "../mocks/messageMock";
import { subscribeMockMessages, addMockMessage } from "../mocks/messageMock";

const DUMMY_USER = "you";
const DUMMY_ROOM = "General";

type FireworkItem = {
  id: string;
  message: string;
  color: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  launchSpeed: number;
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

export default function ChatPage() {
  const [logOpen, setLogOpen] = useState(false);
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [fireworkItems, setFireworkItems] = useState<FireworkItem[]>([]);
  const lastMessageRef = useRef<MessagePayload | null>(null);

  // ダミーメッセージ購読
  useEffect(() => {
    const unsubscribe = subscribeMockMessages(DUMMY_ROOM, (msgs) => setMessages(msgs));
    return unsubscribe;
  }, []);

  // 花火
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
      }
    ]);
  }, [messages]);

  const sendMessage = (data: { message: string; color: string }) => {
    if (!data.message.trim()) return;
    const payload: MessagePayload = {
      user_name: DUMMY_USER,
      message: data.message,
      room_name: DUMMY_ROOM,
      color: data.color,
    };
    addMockMessage(payload);
    setMessages((prev) => [...prev, payload]);
  };

  const handleFireworkEnd = (id: string) => {
    setFireworkItems(items => items.filter(item => item.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#22272e", position: "relative" }}>
      {/* ログパネル */}
      <SidePanel isOpen={logOpen}>
        <ChatLog messages={messages} userName={DUMMY_USER} />
      </SidePanel>
      {/* トグルボタン */}
      <PanelToggleButton
        onClick={() => setLogOpen((open) => !open)}
        isOpen={logOpen}
      />
      {/* 花火 */}
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
          onEnd={handleFireworkEnd}
        />
      ))}
      {/* メインUI：自分のバルーンは表示しない */}
      <div
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          padding: "3em 1em 1em 1em",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <h1 style={{ color: "#fff" }}>チャットページ</h1>
        <p style={{ color: "#ddd" }}>ユーザー名: {DUMMY_USER}</p>
        <p style={{ color: "#ddd" }}>ルーム名: {DUMMY_ROOM}</p>
        <Logout />
        <div style={{ margin: "2em 0", width: "100%" }}>
          <MessageInput sendMessage={sendMessage} />
        </div>
        {/* ここに自分の発言バルーンは表示しません */}
      </div>
    </div>
  );
}

// 花火+メッセージ表示
function FireworkWithMessage({
  id,
  x,
  y,
  color,
  message,
  size,
  duration,
  launchSpeed,
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
            width: "min(30vw, 320px)",
            height: "min(30vw, 320px)",
            borderRadius: "50%",
            background: "none",
            color: color,
            fontWeight: "bold",
            fontSize: "clamp(1rem, 3vw, 2rem)",
            textShadow: "0 0 8px #fff, 0 0 20px #000",
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