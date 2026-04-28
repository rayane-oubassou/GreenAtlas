import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#16a34a', '#4ade80', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#34d399'];

interface Piece {
  id: number;
  x: number;
  color: string;
  w: number;
  h: number;
  delay: number;
  duration: number;
  rotate: number;
}

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const pieces = useMemo<Piece[]>(() =>
    Array.from({ length: 70 }, (_, i) => {
      const size = Math.random() * 9 + 5;
      return {
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: size,
        h: size * (Math.random() > 0.5 ? 0.45 : 1),
        delay: Math.random() * 0.9,
        duration: Math.random() * 1.8 + 1.4,
        rotate: Math.random() * 900 - 450,
      };
    })
  , []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: -16,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.h / p.w > 0.8 ? '50%' : 2,
          }}
          animate={{ y: '110vh', rotate: p.rotate, opacity: [1, 1, 0.6, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
        />
      ))}
    </div>
  );
};

export default Confetti;
