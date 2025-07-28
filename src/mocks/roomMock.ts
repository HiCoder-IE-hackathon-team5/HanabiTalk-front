export type RoomInfo = {
  name: string;
  users: string[]; // ルーム内のユーザー名一覧
};

export const mockRooms: RoomInfo[] = [
  {
    name: "momiji",
    users: ["yurin", "taro"]
  },
  {
    name: "sakura",
    users: ["hanako"]
  }
];

export const fetchMockRoomInfo = async (): Promise<RoomInfo[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockRooms), 300);
  });
};
