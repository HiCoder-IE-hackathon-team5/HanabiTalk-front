import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setCookie } from "../utils/cookie";
import { fetchUserId } from "../utils/api";

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

// エラーの出し入れで高さが変わらないように常に領域を確保
const reservedErrorStyle = (visible: boolean): React.CSSProperties => ({
  ...errorStyleBase,
  minHeight: "2.2em",       // 1行分程度
  opacity: visible ? 1 : 0, // 非表示時は透明化
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

const CreateRoomForm = () => {
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomName || !userName) {
      setError("ルーム名とユーザー名を入力してください");
      return;
    }

    try {
      const userId = await fetchUserId(userName);
      setCookie("user_name", userName);
      setCookie("room_name", roomName);
      setCookie("user_id", userId);
      navigate("/chat");
    } catch {
      setError("ユーザーIDの取得に失敗しました");
    }
  };

  return (
    <form style={sectionStyle} onSubmit={handleCreate} autoComplete="off">
      <div style={sectionHeaderStyle}>新規作成</div>

      <label htmlFor="newUserName" style={labelStyle}>ユーザー名</label>
      <input
        id="newUserName"
        type="text"
        style={inputStyle}
        value={userName}
        onChange={e => setUserName(e.target.value)}
        maxLength={20}
        placeholder="ユーザー名"
        spellCheck={false}
        autoComplete="username"
        // autoFocus は LoginPage 側のフォーカス制御と競合しないよう外しています
      />

      <label htmlFor="newRoomName" style={labelStyle}>新しいルーム名</label>
      <input
        id="newRoomName"
        type="text"
        style={inputStyle}
        value={roomName}
        onChange={e => setRoomName(e.target.value)}
        maxLength={20}
        placeholder="ルーム名"
        spellCheck={false}
      />

      {/* 「ルーム名」と「作成して入室」の間にエラー（常時高さ確保） */}
      <div style={reservedErrorStyle(Boolean(error))} aria-live="polite" role="status">
        {error || "　"}
      </div>

      <button type="submit" style={buttonStyle}>
        作成して入室
      </button>
    </form>
  );
};

export default CreateRoomForm;