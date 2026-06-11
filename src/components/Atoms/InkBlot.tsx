import React, { useEffect, useState } from 'react';

interface InkBlotProps {
  count?: number;
}

export const InkBlot: React.FC<InkBlotProps> = ({ count = 5 }) => {
  const [blots, setBlots] = useState<Array<{ id: number; x: number; y: number; size: number; opacity: number }>>([]);

  useEffect(() => {
    const newBlots = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 20 + Math.random() * 80,
      opacity: 0.05 + Math.random() * 0.1,
    }));
    setBlots(newBlots);
  }, [count]);

  return (
    <>
      {blots.map((blot) => (
        <div
          key={blot.id}
          className="fixed pointer-events-none rounded-full bg-amber-950/40 blur-xl mix-blend-multiply"
          style={{
            left: `${blot.x}%`,
            top: `${blot.y}%`,
            width: `${blot.size}px`,
            height: `${blot.size}px`,
            opacity: blot.opacity,
            transform: 'rotate(45deg)',
          }}
        />
      ))}
    </>
  );
};
