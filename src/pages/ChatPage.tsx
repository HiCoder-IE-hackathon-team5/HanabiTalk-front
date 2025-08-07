import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../utils/cookie";
import MessageInput from "../components/MessageInput";
import ChatLog from "../components/ChatLog";
import Logout from "../components/Logout";
import Firework from "../components/Firework";
import { subscribeMockMessages, addMockMessage } from "../mocks/messageMock";
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
  // 速め: 0.7〜1.5
  return Math.max(0.7, Math.min(1.5, 1.5 - message.length * 0.015));
}

const ChatPage = () => {
  const navigate = useNavigate();
  const roomName = getCookie("room_name") || "General";
  const userName = getCookie("user_name") || "";
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [fireworkItems, setFireworkItems] = useState<FireworkItem[]>([]);
  const lastMessageRef = useRef<MessagePayload | null>(null);

  useEffect(() => {
    if (!userName || !roomName) {
      navigate("/login");
      return;
    }
    const unsubscribe = subscribeMockMessages(roomName, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [roomName, userName, navigate]);

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

  const sendMessage = ({ message, color }: { message: string; color: string }) => {
    if (!message.trim()) return;
    addMockMessage({
      room_name: roomName,
      user_name: userName,
      message,
      color,
    });
    setFireworkItems(items => [
      ...items,
      {
        id: `${roomName}-${userName}-${message}-${Date.now()}`,
        message,
        color,
        x: getCentralX(),
        y: getCentralY(),
        size: getFireworkSize(message),
        duration: getFireworkDuration(message),
        launchSpeed: getFireworkLaunchSpeed(message),
      }
    ]);
  };

  const handleFireworkEnd = (id: string) => {
    setFireworkItems(items => items.filter(item => item.id !== id));
  };

  return (
    <div
      style={{
        maxWidth: "1080px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "row",
        gap: "2em",
        alignItems: "flex-start",
        width: "100vw",
        minHeight: "100vh",
        background: "#22272e",
      }}
    >
      <div style={{ flex: 1, padding: "2em 1em 1em 2em" }}>
        <h1 style={{ color: "#fff" }}>チャットページ</h1>
        <p style={{ color: "#ddd" }}>ユーザー名: {userName}</p>
        <p style={{ color: "#ddd" }}>ルーム名: {roomName}</p>
        <Logout />
        <div style={{ margin: "2em 0" }}>
          <MessageInput sendMessage={sendMessage} />
        </div>
        {/* 花火＋メッセージ */}
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
      </div>
      <div style={{ flex: 1, padding: "2em 2em 1em 0" }}>
        <ChatLog messages={messages} userName={userName} />
      </div>
    </div>
  );
};

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

  // 花火消滅時にメッセージも消す
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

export default ChatPage;