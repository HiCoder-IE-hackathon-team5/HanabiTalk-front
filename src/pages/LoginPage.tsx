import React from "react";
import StarryBackground from "../components/StarryBackground";
import EnterRoomForm from "../components/EnterRoomForm";
import CreateRoomForm from "../components/CreateRoomForm";

const LoginPage: React.FC = () => {
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
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: "3vw",
        justifyContent: "center",
        alignItems: "flex-start",
        width: "100%",
        maxWidth: 800,
        margin: "0 auto",
        zIndex: 1,
      }}>
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