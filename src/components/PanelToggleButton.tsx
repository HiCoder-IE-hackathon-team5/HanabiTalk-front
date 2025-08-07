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
        position: "fixed",
        top: "2em",
        right: "10px",
        width: "2.4em",
        height: "2.4em",
        borderRadius: "50%",
        background: "#444",
        color: "#fff",
        border: "none",
        boxShadow: "0 2px 8px #0006",
        cursor: "pointer",
        zIndex: 999,
        fontSize: "1.5em",
        userSelect: "none",
      }}
      aria-label={isOpen ? "ログパネルを閉じる" : "ログパネルを開く"}
    >
      {isOpen ? "<" : ">"}
    </button>
  );
}