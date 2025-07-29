import React, { useEffect, useRef } from "react";
import type { ChatMessage } from "../hooks/useWebSocket";

interface Props {
	messages: ChatMessage[];
}

const MessageList: React.FC<Props> = ({ messages }) => {
	const listRef = useRef<HTMLDivElement>(null);

	// メッセージが増えたらスクロールを一番下に
	useEffect(() => {
		if (listRef.current) {
			listRef.current.scrollTop = listRef.current.scrollHeight;
		}
	}, [messages]);

	return (
		<div
			ref={listRef}
			style={{
				height: "300px", // 固定高さ
				overflowY: "auto", // 縦スクロール可能
				border: "1px solid #ccc",
				padding: "8px",
				backgroundColor: "#f9f9f9",
			}}
		>
			{messages.length === 0 && <p>まだメッセージはありません</p>}
			{messages.map((msg, idx) => (
				<p key={idx} style={{ color: msg.color, margin: "4px 0" }}>
					<strong>{msg.user_name}:</strong> {msg.message}
				</p>
			))}
		</div>
	);
};

export default MessageList;
