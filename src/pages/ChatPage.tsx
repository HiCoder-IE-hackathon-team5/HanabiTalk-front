import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../utils/cookie";
import MessageInput from "../components/MessageInput";
import MessageList from "../components/MessageList";
import Logout from "../components/Logout";
import Firework from "../components/Firework";
import { subscribeMockMessages, addMockMessage } from "../mocks/messageMock";
import type { MessagePayload } from "../mocks/messageMock";

// 花火アイテム型
type FireworkItem = {
  id: string;
  message: string;
  color: string;
  x: number;
  y: number;
};

function getRandomX() {
  // 左右5%は避ける
  const min = window.innerWidth * 0.05;
  const max = window.innerWidth * 0.95;
  return Math.random() * (max - min) + min;
}
function getRandomY() {
  // 上から1/4～2/3の範囲
  const min = window.innerHeight * 0.25;
  const max = window.innerHeight * 0.66;
  return Math.random() * (max - min) + min;
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

  // メッセージ受信時（送信も含む）で花火アイテム追加
  useEffect(() => {
    if (messages.length === 0) return;
    const latest = messages[messages.length - 1];
    // 直近のメッセージが前回表示済みなら何もしない
    if (lastMessageRef.current && lastMessageRef.current === latest) return;
    lastMessageRef.current = latest;

    // 花火アイテム追加
    setFireworkItems(items => [
      ...items,
      {
        id: `${latest.room_name}-${latest.user_name}-${latest.message}-${Date.now()}`,
        message: latest.message,
        color: latest.color,
        x: getRandomX(),
        y: getRandomY(),
      }
    ]);
  }, [messages]);

  // 送信時にもfireworkItems追加
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
        x: getRandomX(),
        y: getRandomY(),
      }
    ]);
  };

  // 花火終了時にfireworkItemsから削除
  const handleFireworkEnd = (id: string) => {
    setFireworkItems(items => items.filter(item => item.id !== id));
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h1>チャットページ</h1>
      <p>ユーザー名: {userName}</p>
      <p>ルーム名: {roomName}</p>
      <Logout />
      <MessageList messages={messages} />
      <MessageInput sendMessage={sendMessage} />
      {/* 複数の花火とメッセージ表示 */}
      {fireworkItems.map(item => (
        <FireworkWithMessage
          key={item.id}
          id={item.id}
          x={item.x}
          y={item.y}
          color={item.color}
          message={item.message}
          onEnd={handleFireworkEnd}
        />
      ))}
    </div>
  );
};

// 花火＋メッセージコンポーネント
function FireworkWithMessage({
  id,
  x,
  y,
  color,
  message,
  onEnd,
}: {
  id: string;
  x: number;
  y: number;
  color: string;
  message: string;
  onEnd: (id: string) => void;
}) {
  const [showMsg, setShowMsg] = useState(false);
  return (
    <>
      <Firework
        x={x}
        y={y}
        color={color}
        onEnd={() => onEnd(id)}
        onExplode={() => setShowMsg(true)}
      />
      {showMsg && (
        <div
          style={{
            position: "fixed",
            left: `${x}px`,
            top: `${y}px`,
            transform: "translate(-50%, -50%)",
            color: color,
            fontWeight: "bold",
            fontSize: "2rem",
            textShadow: "0 0 8px #fff, 0 0 20px #000",
            pointerEvents: "none",
            zIndex: 51,
            textAlign: "center",
            maxWidth: "90vw",
          }}
        >
          {message}
        </div>
      )}
    </>
  );
}

export default ChatPage;