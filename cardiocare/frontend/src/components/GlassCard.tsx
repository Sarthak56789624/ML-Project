import React, { useRef, useState } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: "teal" | "amber" | "coral" | "mint" | "none";
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  glowColor = "teal",
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const glowStyles = {
    teal: "rgba(14, 165, 164, 0.12)",
    amber: "rgba(245, 158, 11, 0.12)",
    coral: "rgba(239, 68, 68, 0.12)",
    mint: "rgba(16, 185, 129, 0.12)",
    none: "transparent",
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Pointer tracking radial spotlight */}
      {glowColor !== "none" && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
          style={{
            opacity: mousePos.opacity,
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${glowStyles[glowColor]}, transparent 70%)`,
          }}
        />
      )}

      {/* Diagonal shine sweep */}
      <div className="shine-sweep" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
