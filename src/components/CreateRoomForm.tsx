import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setCookie } from "../utils/cookie";
import { fetchUserId } from "../utils/api";

const CreateRoomForm = () => {
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!roomName || !userName) {
      alert("ルーム名とユーザー名を入力してください");
      return;
    }

    // 新規作成APIがある場合はここで呼ぶ
    // await createRoom(roomName);

    try {
      const userId = await fetchUserId(userName);
      setCookie("user_name", userName);
      setCookie("room_name", roomName);
      setCookie("user_id", userId);
      navigate("/chat");
    } catch (error) {
      alert("ユーザーIDの取得に失敗しました");
    }
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2>部屋の新規作成</h2>
      <input
        placeholder="ユーザー名"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        style={{ display: "block", margin: "8px 0" }}
      />
      <input
        placeholder="新しいルーム名"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        style={{ display: "block", margin: "8px 0" }}
      />
      <button onClick={handleCreate}>部屋を作成して入室</button>
    </div>
  );
};

export default CreateRoomForm;