import { fetchMockRoomInfo } from "../mocks/roomMock";
import type { RoomInfo } from "../mocks/roomMock"; // ←型はtype-onlyで読み込む
import { fetchMockUserId } from "../mocks/userMock";

// ルーム一覧取得
export const fetchRoomList = async (): Promise<RoomInfo[]> => {
  if (import.meta.env.MODE === "development") {
    return await fetchMockRoomInfo();
  }

  const res = await fetch("/api/rooms");
  if (!res.ok) throw new Error("Room取得に失敗しました");
  return await res.json();
};

// サーバー側でユーザー重複チェックを行う（モックでも実装）
export const isUserNameDuplicated = async (roomName: string, userName: string): Promise<boolean> => {
  if (import.meta.env.MODE === "development") {
    // モックでシミュレーション
    const rooms = await fetchRoomList();
    const room = rooms.find((r) => r.name === roomName);
    return room ? room.users.includes(userName) : false;
  }

  // 実際のAPI（Goバックエンド）に問い合わせ
  const res = await fetch("/api/rooms/check_user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room_name: roomName, user_name: userName }),
  });

  if (!res.ok) throw new Error("重複チェックAPIエラー");

  const data = await res.json();
  return data.is_duplicated;
};

export const fetchUserId = async (userName: string): Promise<string> => {
  if (import.meta.env.MODE === "development") {
    const { user_id } = await fetchMockUserId(userName);
    return user_id;
  }

  const res = await fetch("/api/user-id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_name: userName }),
  });

  if (!res.ok) throw new Error("ユーザーID取得に失敗しました");

  const data = await res.json();
  return data.user_id;
};

export interface MessagePayload {
  room_name: string;
  user_name: string;
  message: string;
  color: string;
}


export const postMessage = async (payload: MessagePayload) => {
  if (import.meta.env.MODE === "development") {
    // 開発用: 送信内容を確認しやすく表示
    console.group("Mock Message Send");
    console.log("送信先(API): /api/messages (mock)");
    console.log("送信データ:", payload);
    console.groupEnd();

    // デバッグ用にブラウザの通知も出す（任意）
    // alert(`Mock送信:\n${JSON.stringify(payload, null, 2)}`);

    // Mockレスポンスとしてpayloadを返す
    return { status: "ok", mock: true, sentData: payload };
  }

  // 本番環境: 実際にGoサーバーにPOST
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("メッセージ送信に失敗しました");
  return response.json();
};