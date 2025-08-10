import { useEffect, useState } from "react";
import { fetchRoomList } from "../utils/api";

const RoomList = () => {
  const [rooms, setRooms] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoomList()
      .then((res) => {
        const simplified = res.map((room) => ({ name: room.room_name }));
        setRooms(simplified);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>ルーム一覧</h3>

      {loading ? (
        <p style={{ opacity: 0.8 }}>読み込み中…</p>
      ) : rooms.length === 0 ? (
        <div
          style={{
            padding: "0.8rem 1rem",
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#eaeaf7",
          }}
        >
          ルームはまだありません。新しく作成してみましょう。
        </div>
      ) : (
        <ul>
          {rooms.map((room) => (
            <li key={room.name}>{room.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RoomList;
