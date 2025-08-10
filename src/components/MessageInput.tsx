import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

type MessageInputProps = {
  sendMessage: (data: { message: string; color: string }) => void;
  color: string;
  setColor: Dispatch<SetStateAction<string>>;
  colorList: { code: string; name: string }[];
};

export default function MessageInput({
  sendMessage,
  color,
  setColor,
  colorList,
}: MessageInputProps) {
  const [value, setValue] = useState("");

  function handleSend() {
    if (value.trim() !== "") {
      sendMessage({ message: value, color });
      setValue("");
    }
  }

  return (
    <div
      style={{
        width: "100%",
        background: "#fff",
        borderTop: "1px solid #ddd",
        padding: "12px 16px",
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      {/* カラー選択 */}
      <select
        value={color}
        onChange={e => setColor(e.target.value)}
        style={{
          marginRight: "8px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          padding: "4px 8px",
          background: "#fafaff",
        }}
      >
        {colorList.map(c => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{
          flex: 1,
          padding: "10px 12px",
          fontSize: 16,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
        placeholder="メッセージを入力..."
        onKeyDown={e => {
          if (e.key === "Enter") handleSend();
        }}
      />
      <button
        onClick={handleSend}
        style={{
          background: "#4ecdc4",
          color: "#222",
          fontWeight: 600,
          border: "none",
          borderRadius: 8,
          padding: "0.6em 1.2em",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        送信
      </button>
    </div>
  );
}