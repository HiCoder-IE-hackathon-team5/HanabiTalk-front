import type { ReactNode } from "react";

export default function SidePanel({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: isOpen ? "350px" : "0",
        background: "#181d23",
        boxShadow: isOpen ? "-5px 0 20px #0006" : "none",
        overflow: "hidden",
        transition: "width 0.3s",
        zIndex: 90,
        borderLeft: isOpen ? "1px solid #222" : "none",
        minHeight: 0,
      }}
    >
      <div
        style={{
          opacity: isOpen ? 1 : 0,
          transition: "opacity 0.2s",
          height: "100%",
          minHeight: 0,
          padding: isOpen ? "1em" : 0,
          pointerEvents: isOpen ? "auto" : "none",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}