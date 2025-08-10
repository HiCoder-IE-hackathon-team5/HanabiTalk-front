import { useEffect, useRef } from "react";
import type { MessagePayload } from "../mocks/messageMock";

type Props = {
  messages: MessagePayload[];
  userName: string;
};

export default function ChatLog({ messages, userName }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 新着で最下部にスクロール
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div
      ref={scrollRef}
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "16px 18px",
        boxSizing: "border-box",
      }}
    >
      {messages.map((m, i) => {
        const isSelf = m.user_name === userName;

        return (
          <div
            key={`${i}-${m.user_name}-${m.message.slice(0, 24)}`}
            style={{
              display: "flex",
              justifyContent: isSelf ? "flex-end" : "flex-start",
              margin: "10px 0",
            }}
          >
            {/* 縦積み（上: 名前 / 下: 文章）。自分は右寄せ、他人は左寄せ */}
            <div
              style={{
                maxWidth: "min(68ch, 78%)",
                textAlign: isSelf ? "right" : "left",
              }}
            >
              {/* 名前（上段） */}
              <div
                style={{
                  color: "#eaeaf7", // 名前もチャット本文と同じ白系に統一
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                  textShadow: "0 0 2px rgba(0,0,0,.35)",
                  margin: isSelf ? "0 4px 4px 0" : "0 0 4px 4px",
                  opacity: 0.95,
                }}
                title={m.user_name}
              >
                {m.user_name}
              </div>

              {/* 文章（下段） */}
              <div
                style={{
                  background: isSelf
                    ? "rgba(99,102,241,0.18)"
                    : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#eaeaf7", // 本文は従来どおり白系
                  padding: "10px 12px",
                  borderRadius: "12px",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  boxShadow: "0 1px 6px rgba(0,0,0,.18)",
                }}
              >
                {m.message}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}