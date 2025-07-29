import { fetchMockRoomInfo } from "../mocks/roomMock";
import type { RoomInfo } from "../mocks/roomMock";
import { fetchMockUserId } from "../mocks/userMock";

const useMock = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export const fetchRoomList = async (): Promise<RoomInfo[]> => {
	if (useMock) return await fetchMockRoomInfo();

	const res = await fetch(`${API_BASE}/api/rooms`);
	if (!res.ok) throw new Error("Room取得に失敗しました");
	return await res.json();
};

export const isUserNameDuplicated = async (
	roomName: string,
	userName: string,
): Promise<boolean> => {
	if (useMock) {
		const rooms = await fetchMockRoomInfo();
		const room = rooms.find((r) => r.room_name === roomName);
		return room ? room.users.includes(userName) : false;
	}

	const res = await fetch(`${API_BASE}/api/rooms/check_user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ room_name: roomName, user_name: userName }),
	});
	if (!res.ok) throw new Error("重複チェックAPIエラー");
	return (await res.json()).is_duplicated;
};

export const fetchUserId = async (userName: string): Promise<string> => {
	if (useMock) {
		const { user_id } = await fetchMockUserId(userName);
		return user_id;
	}

	const res = await fetch(`${API_BASE}/api/user-id`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ user_name: userName }),
	});
	if (!res.ok) throw new Error("ユーザーID取得に失敗しました");
	return (await res.json()).user_id;
};

export const logoutUser = async (
	roomName: string,
	userId: string,
): Promise<boolean> => {
	if (useMock) {
		console.log("[DEV] Logout mock success", { roomName, userId });
		return true;
	}

	const response = await fetch(`${API_BASE}/api/rooms/leave`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ room_name: roomName, user_id: userId }),
	});
	if (!response.ok) return false;
	const data = await response.json();
	return data.status === "success";
};
