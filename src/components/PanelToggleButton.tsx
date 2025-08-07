import React from "react";

type PanelToggleButtonProps = {
  isOpen: boolean;
  onClick: () => void;
  panelWidth?: number; // サイドパネルの横幅(px)、デフォルト310
  position?: "top" | "bottom"; // 上 or 下
  offset?: number; // 上下からの距離(px)
};

const PanelToggleButton: React.FC<PanelToggleButtonProps> = ({
  isOpen,
  onClick,
  panelWidth = 310,
  position = "bottom",
  offset = 108, // ログアウトボタンを避けて高めの位置に
}) => {
  return (
    <button
      aria-label={isOpen ? "ログを閉じる" : "ログを開く"}
      onClick={onClick}
      type="button"
      style={{
        position: "fixed",
        right: isOpen ? panelWidth : 0,
        [position]: offset,
        zIndex: 110,
        background: isOpen
          ? "linear-gradient(90deg, #3d4a5c 20%, #1a2330 100%)"
          : "linear-gradient(90deg, #1a2330 20%, #3d4a5c 100%)",
        color: "#fff",
        border: "none",
        borderRadius: isOpen
          ? (position === "top"
              ? "0 0 0 16px"
              : "0 16px 0 0")
          : (position === "top"
              ? "16px 0 0 16px"
              : "0 16px 16px 0"),
        padding: "0.7em 1em 0.7em 0.8em",
        boxShadow: "0 2px 10px #0004",
        cursor: "pointer",
        outline: "none",
        fontSize: "1.1em",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        transition: "right 0.25s, background 0.2s, border-radius 0.18s",
        pointerEvents: "auto"
      }}
    >
      <span
        style={{
          display: "inline-block",
          transition: "transform 0.2s",
          transform: isOpen ? "rotate(0deg)" : "rotate(180deg)",
          marginRight: "0.4em"
        }}
      >
        {/* 矢印アイコン */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="10" fill="#fff2" />
          <path
            d={
              isOpen
                ? "M8.5 7L12.5 11L8.5 15"
                : "M13.5 7L9.5 11L13.5 15"
            }
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span style={{ fontSize: "0.98em" }}>
        {isOpen ? "ログ非表示" : "ログ表示"}
      </span>
    </button>
  );
};

export default PanelToggleButton;