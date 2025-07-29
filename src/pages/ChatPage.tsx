import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie, deleteCookie } from "../utils/cookie";
import MessageInput from "../components/MessageInput";

const ChatPage = () => {
  const navigate = useNavigate();
  const roomName = getCookie("room_name") || "";
  const userName = getCookie("user_name") || "";

  useEffect(() => {
    if (!userName || !roomName) {
      // 情報がない場合はログイン画面に戻す
      navigate("/login");
    }
  }, []);

  const handleLogout = () => {
    deleteCookie("user_name");
    deleteCookie("room_name");
    deleteCookie("user_id");
    navigate("/login");
  };

  return (
    <div>
      <h1>チャットページ</h1>
      <p>ユーザー名: {userName}</p>
      <p>ルーム名: {roomName}</p>
      <button onClick={handleLogout}>ログアウト</button>
      <MessageInput roomName={roomName} userName={userName} />
    </div>
  );
};

export default ChatPage;
