// ⛳ 先頭の import をこれに統一（動的 import をやめる）
import * as roomMock from "../mocks/roomMock";
type RoomInfo = roomMock.RoomInfo;

const useMock = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

/** ルーム作成 */
export async function createRoom(roomName: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/rooms/create/${encodeURIComponent(roomName)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`ルーム作成に失敗しました: ${res.status}`);
}

/** ルーム一覧（RoomInfo[] に整形） */
export const fetchRoomList = async (): Promise<RoomInfo[]> => {
  if (useMock) {
    return roomMock.fetchMockRoomInfo(); // ← ここが型安全に通る
  }

  const listRes = await fetch(`${API_BASE}/api/rooms/list`);
  if (!listRes.ok) throw new Error(`Room一覧取得に失敗: ${listRes.status}`);
  const { rooms } = (await listRes.json()) as { rooms: string[] };

  return Promise.all(
    rooms.map(async (roomName) => {
      const usersRes = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomName)}/users`);
      if (!usersRes.ok) return { room_name: roomName, users: [] as string[] };
      const { users } = (await usersRes.json()) as { room: string; users: string[] };
      return { room_name: roomName, users: users ?? [] };
    })
  );
};

/** 重複チェック（users を見て判定） */
export const isUserNameDuplicated = async (roomName: string, userName: string): Promise<boolean> => {
  if (useMock) {
    const rooms = await roomMock.fetchMockRoomInfo();
    const room = rooms.find((r: RoomInfo) => r.room_name === roomName);
    return room ? room.users.includes(userName) : false;
  }
  const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomName)}/users`);
  if (!res.ok) throw new Error(`ユーザー取得失敗: ${res.status}`);
  const { users } = (await res.json()) as { users: string[] };
  return Array.isArray(users) ? users.includes(userName) : false;
};

/** 参加（/api/users/join は form 受け取り）→ userId を返す */
export const fetchUserId = async (userName: string, roomName: string): Promise<string> => {
  if (useMock) {
    const { fetchMockUserId } = await import("../mocks/userMock"); // ここはそのままでもOK
    const { user_id } = await fetchMockUserId(userName);
    return user_id;
  }
  const body = new URLSearchParams();
  body.set("userName", userName);
  body.set("roomName", roomName);

  const res = await fetch(`${API_BASE}/api/users/join`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`参加失敗: ${res.status}`);
  const json = (await res.json()) as { userId: string };
  return json.userId;
};

/** 退室（未実装なので当面 false） */
export const logoutUser = async (_roomName: string, _userId: string): Promise<boolean> => {
  if (useMock) return true;
  return false;
};
