import { useEffect, useRef } from "react";

// 星空背景の星数
const NUM_STARS = 500;

// 星空背景コンポーネント（CSSもここに記述）
export default function StarryBackground() {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // CSSを動的に追加（重複防止）
    if (!document.getElementById("starry-background-style")) {
      const style = document.createElement("style");
      style.id = "starry-background-style";
      style.innerHTML = `
        .stars {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
          /* 空の色を暗めに変更 */
          background-image: linear-gradient(0deg, #04223a 60%, #0b2340 100%, #050a13 100%);
          overflow: hidden;
          pointer-events: none;
        }
        .star {
          position: absolute;
          display: block;
          background-color: #fff;
          border-radius: 50%;
          box-shadow: 0 0 4px 2px rgba(255,255,255,0.2);
          opacity: 0;
          animation: twinkle 5s infinite;
        }
        @keyframes twinkle {
          0% { opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { opacity: 0; transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    const starsEl = starsRef.current;
    if (!starsEl) return;

    // すでに星がある場合は追加しない（重複防止）
    if (starsEl.childElementCount > 0) return;

    // 星を生成
    for (let i = 0; i < NUM_STARS; i++) {
      const starEl = document.createElement("span");
      starEl.className = "star";
      const minSize = 1;
      const maxSize = 2;
      const size = Math.random() * (maxSize - minSize) + minSize;
      starEl.style.width = `${size}px`;
      starEl.style.height = `${size}px`;
      starEl.style.left = `${Math.random() * 100}%`;
      starEl.style.top = `${Math.random() * 100}%`;
      starEl.style.animationDelay = `${Math.random() * 10}s`;
      starsEl.appendChild(starEl);
    }
    // クリーンアップ
    return () => {
      if (starsEl) starsEl.innerHTML = "";
    };
  }, []);

  return <div className="stars" ref={starsRef} />;
}