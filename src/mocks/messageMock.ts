export interface MessagePayload {
	room_name: string;
	user_name: string;
	message: string;
	color: string;
}

// ルームごとのメッセージリスト
const mockMessages: Record<string, MessagePayload[]> = {
	General: [
		{
			room_name: "General",
			user_name: "Alice",
			message: "Hello!",
			color: "#ff6666",
		},
		{
			room_name: "General",
			user_name: "Bob",
			message: "Hi Alice!",
			color: "#66ccff",
		},
	],
};

export const subscribeMockMessages = (
	roomName: string,
	callback: (messages: MessagePayload[]) => void,
) => {
	// 初期メッセージを通知
	callback(mockMessages[roomName] || []);

	// 5秒ごとに擬似メッセージを追加
	let count = 1;
	const interval = setInterval(() => {
		const newMessage: MessagePayload = {
			room_name: roomName,
			user_name: "System",
			message: `New message ${count}`,
			color: "#C0CDDC",
		};
		if (!mockMessages[roomName]) mockMessages[roomName] = [];
		mockMessages[roomName].push(newMessage);
		callback([...mockMessages[roomName]]);
		count++;
	}, 5000);

	return () => clearInterval(interval); // サブスク解除
};

// Mock用のメッセージ追加関数（送信時に呼ぶ）
export const addMockMessage = (payload: MessagePayload) => {
	if (!mockMessages[payload.room_name]) mockMessages[payload.room_name] = [];
	mockMessages[payload.room_name].push(payload);
};
