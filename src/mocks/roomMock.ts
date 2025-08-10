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
	{
		room_name: "kiku",
		users: ["jiro", "saki", "ren"],
	},
	{
		room_name: "ume",
		users: [],
	},
	{
		room_name: "fuji",
		users: ["mika", "ken"],
	},
	{
		room_name: "tsubaki",
		users: ["haru"],
	},
	{
		room_name: "ayame",
		users: ["rio", "yui"],
	},
	{
		room_name: "botan",
		users: ["sora"],
	},
	{
		room_name: "kiri",
		users: [],
	},
	{
		room_name: "matsu",
		users: ["kei", "emi", "sho"],
	},
];

export const fetchMockRoomInfo = async (): Promise<RoomInfo[]> => {
	return new Promise((resolve) => {
		setTimeout(() => resolve(mockRooms), 300);
	});
};