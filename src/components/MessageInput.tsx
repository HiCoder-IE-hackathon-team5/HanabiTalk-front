import React, { useState } from "react";
import { postMessage } from "../utils/api";

interface Props {
  roomName: string;
  userName: string;
}

const MessageInput: React.FC<Props> = ({ roomName, userName }) => {
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("black");

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await postMessage({ room_name: roomName, user_name: userName, message, color });
      setMessage(""); // 送信後にクリア
    } catch (err) {
      console.error("メッセージ送信に失敗:", err);
    }
  };

  return (
    <div className="message-input">
      <input
        type="text"
        placeholder="メッセージを入力"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {/* カラー選択ラジオ */}
      <label>
        <input
          type="radio"
          value="blue"
          checked={color === "blue"}
          onChange={(e) => setColor(e.target.value)}
        />
        青
      </label>
      <label>
        <input
          type="radio"
          value="red"
          checked={color === "red"}
          onChange={(e) => setColor(e.target.value)}
        />
        赤
      </label>

      <button onClick={handleSend}>送信</button>
    </div>
  );
};

export default MessageInput;
