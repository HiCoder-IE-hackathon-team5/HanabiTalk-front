export type RoomInfo = {
	room_name: string;
	users: string[]; // ルーム内のユーザー名一覧
};

export const mockRooms: RoomInfo[] = [
	{
		room_name: "momiji",
		users: ["yurin", "taro"],
	},
	{
		room_name: "sakura",
		users: ["hanako"],
	},
];

export const fetchMockRoomInfo = async (): Promise<RoomInfo[]> => {
	return new Promise((resolve) => {
		setTimeout(() => resolve(mockRooms), 300);
	});
};
