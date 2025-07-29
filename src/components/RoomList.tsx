import { useEffect, useState } from "react";
import { fetchRoomList } from "../utils/api";

const RoomList = () => {
	const [rooms, setRooms] = useState<{ name: string }[]>([]);

	useEffect(() => {
		fetchRoomList().then((res) => {
			const simplified = res.map((room) => ({ name: room.room_name }));
			setRooms(simplified);
		});
	}, []);

	return (
		<div style={{ marginTop: "2rem" }}>
			<h3>公開ルーム一覧</h3>
			<ul>
				{rooms.map((room) => (
					<li key={room.name}>{room.name}</li>
				))}
			</ul>
		</div>
	);
};

export default RoomList;
