import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../utils/cookie";
import MessageInput from "../components/MessageInput";
import MessageList from "../components/MessageList";
import Logout from "../components/Logout";
import Firework from "../components/Firework";
import { subscribeMockMessages, addMockMessage } from "../mocks/messageMock";
import type { MessagePayload } from "../mocks/messageMock";

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

  useEffect(() => {
    if (!userName || !roomName) {
      navigate("/login");
      return;
    }
    const unsubscribe = subscribeMockMessages(roomName, (msgs) => {
      setMessages(msgs);
      console.log("Test Message Receive:", msgs[msgs.length - 1]);
    });
    return () => unsubscribe();
  }, [roomName, userName, navigate]);

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
    setExplodedPos(null); // 一旦消しておく
  };

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