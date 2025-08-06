import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../utils/cookie";
import MessageInput from "../components/MessageInput";
import MessageList from "../components/MessageList";
import Logout from "../components/Logout";
import { useWebSocket } from "../hooks/useWebSocket";
import Firework from "../components/Firework";
import type { ChatMessage } from "../hooks/useWebSocket";

const ChatPage = () => {
  const navigate = useNavigate();
  const room_name = getCookie("room_name") || "";
  const user_name = getCookie("user_name") || "";
  const userId = getCookie("user_id") || "";

  const { messages, sendMessage } = useWebSocket(room_name, userId);

  // 花火表示用
  const [showFirework, setShowFirework] = useState(false);

  useEffect(() => {
    if (!user_name || !room_name) {
      navigate("/login");
    }
  }, [user_name, room_name, navigate]);

  // 送信時に花火表示
  const handleSendMessage = (data: { message: string; color: string }) => {
    const msg: ChatMessage = {
      room_name,
      user_name,
      message: data.message,
      color: data.color,
    };
    sendMessage(msg);
    // 花火を表示したままにする
    setShowFirework(true);
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", position: "relative" }}>
      <h1>チャットページ</h1>
      <p>ユーザー名: {user_name}</p>
      <p>ルーム名: {room_name}</p>
      <Logout />
      <MessageList messages={messages} />
      <MessageInput sendMessage={handleSendMessage} />
      {/* showFireworkがtrueの間、花火が表示され続けます */}
      {showFirework && (
        <Firework onEnd={() => {
          console.log("Firework ended");
          setShowFirework(false);
        }} />
      )}
    </div>
  );
};

export default ChatPage;