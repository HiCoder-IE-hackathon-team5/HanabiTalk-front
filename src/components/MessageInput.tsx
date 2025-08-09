import { useEffect, useRef, useState } from "react";

type MessageInputProps = {
  sendMessage: (data: { message: string; color: string }) => void;
};

type RGB = { r: number; g: number; b: number };

const clamp = (n: number, min = 0, max = 255) => Math.min(max, Math.max(min, Math.round(n)));
const rgbToHex = ({ r, g, b }: RGB) =>
  `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b)
    .toString(16)
    .padStart(2, "0")}`;
const hexToRgb = (hex: string): RGB => {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const v = parseInt(full, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
};

// 既定色（スクショのピンクを初期値に）
const DEFAULT_HEX = "#ff69b4";

export default function MessageInput({ sendMessage }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [rgb, setRgb] = useState<RGB>(hexToRgb(DEFAULT_HEX));
  const colorHex = rgbToHex(rgb);

  // カラーピッカーの開閉制御
  const [openPicker, setOpenPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!openPicker) return;
      const t = e.target as Node;
      if (pickerRef.current?.contains(t) || rootRef.current?.contains(t)) return;
      setOpenPicker(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openPicker]);

  const handleSend = () => {
    const msg = value.trim();
    if (!msg) return;
    sendMessage({ message: msg, color: colorHex });
    setValue("");
  };

  return (
    <div
      ref={rootRef}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 10,
        borderRadius: 12,
        // ガラス風ダークボックス（スクショ寄せ）
        background: "rgba(24, 26, 36, 0.72)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 6px 22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(4px)",
        width: "100%",
      }}
    >
      {/* 入力欄（左） */}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="メッセージを入力"
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        style={{
          flex: 1,
          height: 42,
          padding: "0 14px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(23, 24, 33, 0.9)",
          color: "#e8ebff",
          outline: "none",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)",
        }}
      />

      {/* 色ボタン（中央） */}
      <button
        type="button"
        title={`色を選ぶ (${colorHex.toUpperCase()})`}
        aria-label="色を選ぶ"
        onClick={() => setOpenPicker((v) => !v)}
        style={{
          width: 36,
          height: 28,
          borderRadius: 8,
          background: colorHex,
          border: "1px solid rgba(0,0,0,0.3)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.25)",
          cursor: "pointer",
        }}
      />

      {/* 送信ボタン（右） */}
      <button
        onClick={handleSend}
        style={{
          height: 42,
          padding: "0 18px",
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(90deg,#6366f1 0%, #8b5cf6 100%)",
          color: "#fff",
          fontWeight: 700,
          letterSpacing: "0.02em",
          boxShadow: "0 6px 18px rgba(99,102,241,0.45)",
          cursor: "pointer",
        }}
      >
        送信
      </button>

      {/* RGBピッカー（ポップオーバー）。見た目は最小限でスクショと干渉しない位置に */}
      {openPicker && (
        <div
          ref={pickerRef}
          style={{
            position: "absolute",
            left: 180, // 入力ブロック左端からの大まかな位置
            bottom: 56,
            background: "#11141b",
            color: "#eaeaff",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            boxShadow: "0 14px 28px rgba(0,0,0,0.45)",
            padding: 12,
            minWidth: 260,
            zIndex: 1000,
          }}
        >
          {/* HEXピッカー */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: colorHex,
                boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset",
              }}
            />
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setRgb(hexToRgb(e.target.value))}
              style={{ width: 46, height: 28, border: "none", background: "transparent", cursor: "pointer" }}
            />
            <span style={{ fontSize: 12, opacity: 0.8 }}>{colorHex.toUpperCase()}</span>
          </div>

          {/* RGBスライダー */}
          <RgbRow
            label="R"
            value={rgb.r}
            accent="#ff6b6b"
            onChange={(v) => setRgb((p) => ({ ...p, r: clamp(v) }))}
          />
          <RgbRow
            label="G"
            value={rgb.g}
            accent="#51cf66"
            onChange={(v) => setRgb((p) => ({ ...p, g: clamp(v) }))}
          />
          <RgbRow
            label="B"
            value={rgb.b}
            accent="#339af0"
            onChange={(v) => setRgb((p) => ({ ...p, b: clamp(v) }))}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button
              onClick={() => setOpenPicker(false)}
              style={{
                border: "1px solid rgba(255,255,255,0.16)",
                background: "transparent",
                color: "#e8ebff",
                padding: "6px 10px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              閉じる
            </button>
            <button
              onClick={() => setOpenPicker(false)}
              style={{
                border: "none",
                background: "linear-gradient(90deg,#6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              決定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RgbRow({
  label,
  value,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  accent: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 56px", gap: 8, alignItems: "center", margin: "6px 0" }}>
      <span style={{ fontSize: 12, opacity: 0.85, width: 28 }}>{label}</span>
      <input
        type="range"
        min={0}
        max={255}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", height: 6, accentColor: accent as any, cursor: "pointer" }}
      />
      <input
        type="number"
        min={0}
        max={255}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: 56,
          height: 30,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(23,24,33,0.9)",
          color: "#e8ebff",
          padding: "0 6px",
        }}
      />
    </div>
  );
}