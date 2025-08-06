import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../utils/cookie";
import MessageInput from "../components/MessageInput";
import MessageList from "../components/MessageList";
import Logout from "../components/Logout";
import Firework from "../components/Firework";
import { subscribeMockMessages, addMockMessage } from "../mocks/messageMock";
import type { MessagePayload } from "../mocks/messageMock";

// 爆発の座標（中央・上部）
const FIREWORK_X = window.innerWidth / 2;
const FIREWORK_Y = window.innerHeight / 3;

const ChatPage = () => {
  const navigate = useNavigate();
  const roomName = getCookie("room_name") || "General";
  const userName = getCookie("user_name") || "";
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [fireworkColor, setFireworkColor] = useState<string | null>(null);
  const [fireworkMessage, setFireworkMessage] = useState<string | null>(null);
  const [explodedPos, setExplodedPos] = useState<{ x: number; y: number } | null>(null);
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

  // 送信時の花火
  const sendMessage = ({ message, color }: { message: string; color: string }) => {
    if (!message.trim()) return;
    addMockMessage({
      room_name: roomName,
      user_name: userName,
      message,
      color,
    });
    setFireworkColor(color);
    setFireworkMessage(message);
    setExplodedPos(null); // 一旦消す
  };

  // メッセージ受信時（messages更新時）の花火
  useEffect(() => {
    if (messages.length === 0) return;
    const latest = messages[messages.length - 1];
    // 直近のメッセージが前回表示済みなら何もしない
    if (lastMessageRef.current && lastMessageRef.current === latest) return;
    lastMessageRef.current = latest;
    setFireworkColor(latest.color);
    setFireworkMessage(latest.message);
    setExplodedPos(null);
  }, [messages]);

  // 花火終了時
  const handleFireworkEnd = () => {
    setFireworkColor(null);
    setFireworkMessage(null);
    setExplodedPos(null);
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h1>チャットページ</h1>
      <p>ユーザー名: {userName}</p>
      <p>ルーム名: {roomName}</p>
      <Logout />
      <MessageList messages={messages} />
      <MessageInput sendMessage={sendMessage} />
      {fireworkColor && (
        <>
          <Firework
            x={FIREWORK_X}
            y={FIREWORK_Y}
            color={fireworkColor}
            onEnd={handleFireworkEnd}
            onExplode={(x, y) => setExplodedPos({ x, y })}
          />
          {explodedPos && fireworkMessage && (
            <div
              style={{
                position: "fixed",
                left: `${explodedPos.x}px`,
                top: `${explodedPos.y}px`,
                transform: "translate(-50%, -50%)",
                color: fireworkColor,
                fontWeight: "bold",
                fontSize: "2rem",
                textShadow: "0 0 8px #fff, 0 0 20px #000",
                pointerEvents: "none",
                zIndex: 51,
                textAlign: "center",
                maxWidth: "90vw",
              }}
            >
              {fireworkMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatPage;