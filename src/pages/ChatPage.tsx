import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../utils/cookie";
import MessageInput from "../components/MessageInput";
import MessageList from "../components/MessageList";
import Logout from "../components/Logout";
import Firework from "../components/Firework";
import { subscribeMockMessages, addMockMessage } from "../mocks/messageMock";
import type { MessagePayload } from "../mocks/messageMock";

const ChatPage = () => {
  const navigate = useNavigate();
  const roomName = getCookie("room_name") || "General";
  const userName = getCookie("user_name") || "";
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [firework, setFirework] = useState<{ color: string } | null>(null);

  useEffect(() => {
    if (!userName || !roomName) {
      navigate("/login");
      return;
    }
    // ダミーのメッセージを定期購読
    const unsubscribe = subscribeMockMessages(roomName, (msgs) => {
      setMessages(msgs);
      // ここで最新メッセージをコンソール出力
      console.log("Test Message Receive:", msgs[msgs.length - 1]);
    });
    return () => unsubscribe();
  }, [roomName, userName, navigate]);

  // メッセージ送信時
  const sendMessage = ({ message, color }: { message: string; color: string }) => {
    if (!message.trim()) return;
    addMockMessage({
      room_name: roomName,
      user_name: userName,
      message,
      color,
    });
    setFirework({ color }); // 花火表示
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h1>チャットページ</h1>
      <p>ユーザー名: {userName}</p>
      <p>ルーム名: {roomName}</p>
      <Logout />
      <MessageList messages={messages} />
      <MessageInput sendMessage={sendMessage} />
      {firework && (
        <Firework
          color={firework.color}
          onEnd={() => setFirework(null)}
        />
      )}
    </div>
  );
};

export default ChatPage;