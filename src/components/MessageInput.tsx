import React, { useState } from "react";

type MessageInputProps = {
  sendMessage: (data: { message: string; color: string }) => void;
};

const MessageInput: React.FC<MessageInputProps> = ({ sendMessage }) => {
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("#ff69b4"); // デフォルト色

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage({ message, color });
    setMessage("");
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
      <input
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="メッセージを入力"
        style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
      />
      <input
        type="color"
        value={color}
        onChange={e => setColor(e.target.value)}
        style={{ width: "40px", height: "40px" }}
      />
      <button
        onClick={handleSend}
        style={{
          background: "#6366f1",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        送信
      </button>
    </div>
  );
};

export default MessageInput;