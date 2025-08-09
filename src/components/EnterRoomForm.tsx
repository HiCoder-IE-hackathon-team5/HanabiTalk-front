import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setCookie } from "../utils/cookie";
import { fetchRoomList, isUserNameDuplicated, fetchUserId } from "../utils/api";

const sectionStyle: React.CSSProperties = {
  background: "rgba(24, 27, 39, 0.92)",
  borderRadius: "18px",
  boxShadow: "0 3px 16px #0007",
  padding: "1.2em 1.2em 1.1em 1.2em",
  width: "100%",
  maxWidth: 330,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const inputStyle: React.CSSProperties = {
  fontSize: "1em",
  width: "100%",
  padding: "0.65em 1em",
  borderRadius: "7px",
  border: "1.1px solid #394060",
  background: "#222936",
  color: "#e7eaf1",
  marginBottom: "1em",
  outline: "none",
  boxShadow: "0 1px 2px #0001",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.96em",
  color: "#e1e4ee",
  fontWeight: 600,
  margin: "0.2em 0 0.2em 0",
  alignSelf: "flex-start",
};

const buttonStyle: React.CSSProperties = {
  fontSize: "1.07em",
  fontWeight: 700,
  width: "100%",
  padding: "0.67em 0",
  borderRadius: "7px",
  border: "none",
  background: "linear-gradient(90deg, #2786d2 0%, #45288f 100%)",
  color: "#fff",
  boxShadow: "0 1.5px 7px #0002",
  cursor: "pointer",
  marginTop: "0.2em",
  transition: "background 0.14s, box-shadow 0.12s, transform 0.07s",
};

const errorStyleBase: React.CSSProperties = {
  color: "#ff6377",
  background: "#fff1",
  borderRadius: "5px",
  padding: "0.5em 0.8em",
  margin: "0.5em 0",
  fontWeight: 500,
  fontSize: "0.97em",
  textAlign: "center",
};

// エラーメッセージの出し入れで高さが変わらないように常に確保する領域
const reservedErrorStyle = (visible: boolean): React.CSSProperties => ({
  ...errorStyleBase,
  minHeight: "2.2em",         // 1行分程度の高さを常時確保
  opacity: visible ? 1 : 0,   // 非表示時は透明にするだけ
  transition: "opacity 120ms ease",
  pointerEvents: "none",
  whiteSpace: "pre-wrap",
});

const sectionHeaderStyle: React.CSSProperties = {
  color: "#eaf6ff",
  fontWeight: "bold",
  fontSize: "1.15em",
  marginBottom: "0.7em",
  textShadow: "0 1px 7px #2674d555",
  textAlign: "center",
};

const publicRooms = [
  { name: "momiji" },
  { name: "sakura" },
];

const EnterRoomForm = () => {
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEnter = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomName || !userName) {
      setError("ルーム名とユーザー名を入力してください");
      return;
    }

    const rooms = await fetchRoomList();
    const roomExists = rooms.some((r) => r.room_name === roomName);
    if (!roomExists) {
      setError(`「${roomName}」というルームは存在しません`);
      return;
    }

    const isDuplicate = await isUserNameDuplicated(roomName, userName);
    if (isDuplicate) {
      setError(`ユーザー名「${userName}」はすでにルーム「${roomName}」に存在します`);
      return;
    }

    try {
      const userId = await fetchUserId(userName);
      setCookie("user_name", userName);
      setCookie("room_name", roomName);
      setCookie("user_id", userId);
      navigate("/chat");
    } catch (error) {
      setError("ユーザーIDの取得に失敗しました");
    }
  };

  return (
    <form style={sectionStyle} onSubmit={handleEnter} autoComplete="off">
      <div style={sectionHeaderStyle}>部屋に入る</div>

      {/* 上部のレイアウトは動かしたくないので、ここにはエラーを置かない */}

      <label htmlFor="userName" style={labelStyle}>ユーザー名</label>
      <input
        id="userName"
        type="text"
        style={inputStyle}
        value={userName}
        onChange={e => setUserName(e.target.value)}
        maxLength={20}
        placeholder="ユーザー名"
        spellCheck={false}
        autoComplete="username"
      />

      <label htmlFor="roomName" style={labelStyle}>ルーム名</label>
      <input
        id="roomName"
        type="text"
        style={inputStyle}
        value={roomName}
        onChange={e => setRoomName(e.target.value)}
        maxLength={20}
        placeholder="ルーム名"
        spellCheck={false}
        autoComplete="off"
      />

      {/* 要望どおり「ルーム名」と「入室」の間にエラー表示（高さは常時確保） */}
      <div style={reservedErrorStyle(Boolean(error))} aria-live="polite" role="status">
        {error || "　"}
      </div>

      <button type="submit" style={buttonStyle}>
        入室
      </button>

      {/* 公開ルーム一覧 */}
      <div style={{
        marginTop: "1em",
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{
          color: "#b9d6ff",
          fontWeight: 700,
          fontSize: "0.98em",
          marginBottom: "0.5em",
        }}>
          公開ルーム
        </div>
        <div style={{
          display: "flex",
          gap: "0.6em",
          justifyContent: "center",
        }}>
          {publicRooms.map(r => (
            <button
              type="button"
              key={r.name}
              onClick={() => setRoomName(r.name)}
              style={{
                background: "#28374f",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "0.4em 1em",
                fontSize: "0.97em",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 4px #0002",
                transition: "background 0.13s",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#33549b")}
              onMouseOut={e => (e.currentTarget.style.background = "#28374f")}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
};

export default EnterRoomForm;