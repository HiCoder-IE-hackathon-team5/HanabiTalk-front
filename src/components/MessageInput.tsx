import React, { useState } from "react";
import type { ChatMessage } from "../hooks/useWebSocket";

interface Props {
	sendMessage: (message: Omit<ChatMessage, "room_name" | "user_name">) => void;
}

const MessageInput: React.FC<Props> = ({ sendMessage }) => {
	const [message, setMessage] = useState("");
	const [color, setColor] = useState("#0000ff");

	const handleSend = () => {
		if (!message.trim()) return;

		// メッセージ送信
		sendMessage({
			message,
			color,
		});

		setMessage("");
	};

	return (
		<div className="message-input">
			<input
				type="text"
				placeholder="メッセージを入力"
				value={message}
				onChange={(e) => setMessage(e.target.value)}
			/>

			<label>
				<input
					type="radio"
					value="#0000ff"
					checked={color === "#0000ff"}
					onChange={(e) => setColor(e.target.value)}
				/>
				青
			</label>
			<label>
				<input
					type="radio"
					value="#ff0000"
					checked={color === "#ff0000"}
					onChange={(e) => setColor(e.target.value)}
				/>
				赤
			</label>
			<label>
				<input
					type="radio"
					value="#00aa00"
					checked={color === "#00aa00"}
					onChange={(e) => setColor(e.target.value)}
				/>
				緑
			</label>

			<button onClick={handleSend}>送信</button>
		</div>
	);
};

export default MessageInput;
