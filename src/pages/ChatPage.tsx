import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../utils/cookie";
import MessageInput from "../components/MessageInput";
import MessageList from "../components/MessageList";
import Logout from "../components/Logout";
import { useWebSocket } from "../hooks/useWebSocket";

const ChatPage = () => {
	const navigate = useNavigate();
	const roomName = getCookie("room_name") || "";
	const userName = getCookie("user_name") || "";
	const userId = getCookie("user_id") || "";

	const { messages, sendMessage } = useWebSocket(roomName, userId);

	useEffect(() => {
		if (!userName || !roomName) {
			navigate("/login");
		}
	}, []);

	return (
		<div style={{ maxWidth: "500px", margin: "0 auto" }}>
			<h1>チャットページ</h1>
			<p>ユーザー名: {userName}</p>
			<p>ルーム名: {roomName}</p>
			<Logout />

			{/* メッセージリスト */}
			<MessageList messages={messages} />

			{/* 入力欄 */}
			<MessageInput sendMessage={sendMessage} />
		</div>
	);
};

export default ChatPage;
