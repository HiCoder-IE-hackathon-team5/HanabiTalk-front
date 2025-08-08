import { useState, useEffect, useRef } from "react";
import SidePanel from "../components/SidePanel";
import ChatLog from "../components/ChatLog";
import PanelToggleButton from "../components/PanelToggleButton";
import MessageInput from "../components/MessageInput";
import Logout from "../components/Logout";
import Firework from "../components/Firework";
import StarryBackground from "../components/StarryBackground";
import { subscribeMockMessages, addMockMessage } from "../mocks/messageMock";
import { getCookie } from "../utils/cookie";
import type { MessagePayload as OrigMessagePayload } from "../mocks/messageMock";

type MessagePayload = OrigMessagePayload;

type FireworkItem = {
  id: string;
  message: string;
  color: string;
  x: number;
  y: number;
  size: number;
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
function getFireworkLaunchSpeed(message: string) {
  return Math.max(0.7, Math.min(1.5, 1.5 - message.length * 0.015));
}

export default function ChatPage() {
  const userName = getCookie("user_name") || "you";
  const roomName = getCookie("room_name") || "General";

  const [logOpen, setLogOpen] = useState(false);
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [fireworkItems, setFireworkItems] = useState<FireworkItem[]>([]);
  const lastMessageRef = useRef<MessagePayload | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeMockMessages(roomName, (msgs: MessagePayload[]) => setMessages(msgs));
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
        launchSpeed: getFireworkLaunchSpeed(latest.message),
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
      <SidePanel isOpen={logOpen}>
        <ChatLog messages={messages} userName={userName} />
      </SidePanel>
      <PanelToggleButton
        onClick={() => setLogOpen((open) => !open)}
        isOpen={logOpen}
      />
      {fireworkItems.map(item => (
        <FireworkWithMessage
          key={item.id}
          id={item.id}
          x={item.x}
          y={item.y}
          color={item.color}
          message={item.message}
          size={item.size}
          launchSpeed={item.launchSpeed}
          onEnd={handleFireworkEnd}
        />
      ))}
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
                transition: "background 0.18s, boxShadow 0.12s, transform 0.09s",
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
      <div
        style={{
          position: "fixed",
          left: 0,
          bottom: 0,
          width: "min(480px, 92vw)",
          padding: "1.2em 1em",
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
  launchSpeed,
  onEnd,
}: {
  id: string;
  x: number;
  y: number;
  color: string;
  message: string;
  size: number;
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