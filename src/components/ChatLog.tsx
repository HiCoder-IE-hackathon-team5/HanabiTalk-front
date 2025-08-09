import type { MessagePayload } from "../mocks/messageMock";

export default function ChatLog({
  messages,
  userName,
}: {
  messages: MessagePayload[];
  userName: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        background: "#181d23",
        color: "#fff",
        borderRadius: "8px",
        padding: "1em",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
        boxShadow: "0 2px 16px #0004",
      }}
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            alignSelf: msg.user_name === userName ? "flex-end" : "flex-start",
            background: msg.user_name === userName ? "#2255a3" : "#333",
            color: "#fff",
            borderRadius: "1.2em",
            padding: "0.7em 1.2em",
            maxWidth: "75%",
            wordBreak: "break-word",
            boxShadow: msg.user_name === userName ? "0 1px 4px #2255a355" : "0 1px 4px #1117",
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: "0.9em" }}>
            {msg.user_name}
          </span>
          <br />
          <span>{msg.message}</span>
        </div>
      ))}
    </div>
  );
}