import PanelToggleButton from "./PanelToggleButton";

export default function SidePanel({
  isOpen,
  toggle,
  children,
}: {
  isOpen: boolean;
  toggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        width: isOpen ? "350px" : "0",
        background: "#181d23",
        boxShadow: isOpen ? "-5px 0 20px #0006" : "none",
        overflow: "hidden",
        transition: "width 0.3s",
        zIndex: 90,
        borderLeft: isOpen ? "1px solid #222" : "none",
      }}
    >
      <PanelToggleButton onClick={toggle} isOpen={isOpen} />
      <div style={{
        opacity: isOpen ? 1 : 0,
        transition: "opacity 0.2s",
        height: "100%",
        padding: isOpen ? "1em" : 0,
        pointerEvents: isOpen ? "auto" : "none"
      }}>
        {children}
      </div>
    </div>
  );
}