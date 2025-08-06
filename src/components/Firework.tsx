import React, { useEffect } from "react";

type FireworkProps = {
  onEnd?: () => void;
};

const Firework: React.FC<FireworkProps> = ({ onEnd }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onEnd) onEnd();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onEnd]);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="relative w-40 h-40">
        <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-yellow-300 rounded-full animate-ping"
          style={{ transform: "translate(-50%, -50%)" }}
        ></div>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-pink-400 rounded-full animate-firework"
            style={{
              width: "8px",
              height: "48px",
              top: "50%",
              left: "50%",
              transform: `
                translate(-50%, -100%)
                rotate(${i * 45}deg)
              `,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes firework {
          0% { opacity: 0; transform: scaleY(0.2) translate(-50%, -100%) rotate(0deg);}
          60% { opacity: 1; transform: scaleY(1) translate(-50%, -100%) rotate(0deg);}
          100% { opacity: 0; transform: scaleY(1.2) translate(-50%, -100%) rotate(0deg);}
        }
        .animate-firework {
          animation: firework 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Firework;