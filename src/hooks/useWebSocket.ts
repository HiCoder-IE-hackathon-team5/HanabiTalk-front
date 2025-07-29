import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
	room_name: string;
	user_name: string;
	message: string;
	color: string;
}

export const useWebSocket = (roomName: string, userId: string) => {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const wsRef = useRef<WebSocket | null>(null);

	const useMock = import.meta.env.VITE_USE_MOCK === "true";
	const WS_BASE = import.meta.env.VITE_WS_BASE;

	useEffect(() => {
		if (!roomName || !userId) return;

		if (useMock) {
			// モック受信
			const interval = setInterval(() => {
				const mockMessage: ChatMessage = {
					room_name: roomName,
					user_name: `MockUser${Math.floor(Math.random() * 100)}`,
					message: "テストメッセージ",
					color: ["#ff0000", "#00ff00", "#0000ff"][
						Math.floor(Math.random() * 3)
					],
				};

				console.log("Test Message Receive:", mockMessage);
				setMessages((prev) => [...prev, mockMessage]);
			}, 5000);

			return () => clearInterval(interval);
		}

		// WebSocket 接続
		const ws = new WebSocket(`${WS_BASE}?room=${roomName}&user=${userId}`);
		wsRef.current = ws;

		ws.onmessage = (event) => {
			const data: ChatMessage = JSON.parse(event.data);
			if (data.room_name === roomName) {
				setMessages((prev) => [...prev, data]);
			}
		};

		ws.onerror = (err) => console.error("WebSocketエラー:", err);

		return () => ws.close();
	}, [roomName, userId, useMock, WS_BASE]);

	const sendMessage = (msg: Omit<ChatMessage, "room_name" | "user_name">) => {
		const payload = {
			room_name: roomName,
			user_id: userId,
			message: msg.message,
			color: msg.color,
		};

		if (useMock) {
			console.group("Test WebSocket Send");
			console.log("送信データ:", payload);
			console.groupEnd();

			setMessages((prev) => [
				...prev,
				{ ...msg, room_name: roomName, user_name: "あなた(Mock)" },
			]);
			return;
		}

		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			console.log("WebSocket Send:", payload);
			wsRef.current.send(JSON.stringify(payload));
		} else {
			console.warn("WebSocketが未接続です。メッセージ送信に失敗しました。");
		}
	};

	return { messages, sendMessage };
};
