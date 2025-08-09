import React, { useEffect, useRef } from "react";
import StarryBackground from "../components/StarryBackground";
import EnterRoomForm from "../components/EnterRoomForm";
import CreateRoomForm from "../components/CreateRoomForm";

const LoginPage: React.FC = () => {
  const formsRowRef = useRef<HTMLDivElement | null>(null);

  // 最初の描画完了後に「部屋に入る」の最初の入力へフォーカスを当てる
  useEffect(() => {
    const root = formsRowRef.current;
    if (!root) return;

    const focusEnterForm = () => {
      // 左側（最初の子要素）配下の入力を優先してフォーカス
      const target = root.querySelector(
        ':scope > *:first-child input, :scope > *:first-child textarea, :scope > *:first-child [contenteditable="true"]'
      ) as (HTMLInputElement | HTMLTextAreaElement | HTMLElement) | null;

      if (target && "focus" in target) {
        (target as HTMLInputElement | HTMLTextAreaElement).focus();
        // 既存文字があれば選択（任意）
        try {
          if ("select" in target) {
            (target as HTMLInputElement | HTMLTextAreaElement).select();
          }
        } catch { /* noop */ }
      }
    };

    // 他要素のautoFocusより後に実行されるよう、rAFを2回挟む
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(focusEnterForm);
      // クリーンアップで2回目も解除
      return () => cancelAnimationFrame(id2);
    });

    return () => cancelAnimationFrame(id1);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <StarryBackground />
      <h1 style={{
        color: "#e9f3ff",
        fontWeight: 800,
        fontSize: "2em",
        letterSpacing: "0.06em",
        marginBottom: "2.2vh",
        textShadow: "0 2px 14px #2674d577",
        zIndex: 1,
      }}>
        HanabiTalk - ログイン
      </h1>
      <div
        ref={formsRowRef}
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "3vw",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          maxWidth: 800,
          margin: "0 auto",
          zIndex: 1,
        }}
      >
        {/* 既存入室フォーム（左） */}
        <EnterRoomForm />
        {/* 新規作成フォーム（右） */}
        <CreateRoomForm />
      </div>
      {/* クレジット */}
      <div style={{
        position: "fixed",
        bottom: 11,
        left: 0,
        width: "100vw",
        textAlign: "center",
        color: "#bcd2ee",
        fontSize: "0.93em",
        textShadow: "0 1px 4px #0008",
        zIndex: 2,
        userSelect: "none"
      }}>
        HanabiTalk © {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default LoginPage;