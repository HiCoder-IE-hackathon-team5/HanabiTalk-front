export default function PanelToggleButton({
  onClick,
  isOpen,
}: {
  onClick: () => void;
  isOpen: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top: "1.5em",
        left: isOpen ? "-1.6em" : "-1.6em",
        width: "2em",
        height: "2em",
        borderRadius: "50%",
        background: "#444",
        color: "#fff",
        border: "none",
        boxShadow: "0 2px 8px #0006",
        cursor: "pointer",
        zIndex: 100,
        fontSize: "1.3em",
        transition: "left 0.3s",
        userSelect: "none"
      }}
      aria-label={isOpen ? "ログパネルを閉じる" : "ログパネルを開く"}
    >
      {isOpen ? "<" : ">"}
    </button>
  );
}