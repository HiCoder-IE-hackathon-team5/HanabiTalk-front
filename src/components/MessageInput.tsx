import React, { useState } from "react";

type MessageInputProps = {
  sendMessage: (data: { message: string; color: string }) => void;
};

const MessageInput: React.FC<MessageInputProps> = ({ sendMessage }) => {
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("#ff69b4");

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage({ message, color });
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !(e.nativeEvent as any).isComposing) {
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: "16px",
        alignItems: "center",
        background: "rgba(40,48,64,0.96)",
        borderRadius: "9px",
        boxShadow: "0 2px 12px #0004",
        padding: "10px 12px",
        border: "1.5px solid #5858a7",
      }}
    >
      <input
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="メッセージを入力"
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          padding: "11px 12px",
          borderRadius: "7px",
          border: "1.5px solid #bdbddb",
          background: "#23233b",
          color: "#f7f7fd",
          fontSize: "1.08em",
          outline: "none",
          boxShadow: "0 1px 4px #0002",
        }}
      />
      <input
        type="color"
        value={color}
        onChange={e => setColor(e.target.value)}
        title="花火の色"
        style={{
          width: "36px",
          height: "36px",
          border: "none",
          borderRadius: "50%",
          boxShadow: "0 1px 7px #0006",
          background: "none",
          cursor: "pointer",
        }}
      />
      <button
        onClick={handleSend}
        style={{
          background: "linear-gradient(90deg, #6366f1 60%, #a56cf5 100%)",
          color: "white",
          border: "none",
          padding: "10px 22px",
          borderRadius: "7px",
          fontWeight: 600,
          fontSize: "1.05em",
          cursor: "pointer",
          boxShadow: "0 2px 10px #6161e544",
          transition: "background 0.17s, boxShadow 0.1s, transform 0.08s",
        }}
        onMouseDown={e => (e.currentTarget.style.transform = "scale(0.96)")}
        onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        送信
      </button>
    </div>
  );
};

export default MessageInput;