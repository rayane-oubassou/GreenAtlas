import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Tilt3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

const Tilt3D: React.FC<Tilt3DProps> = ({ children, className = '', intensity = 10 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), { stiffness: 350, damping: 35 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), { stiffness: 350, damping: 35 });
  const scale   = useSpring(1, { stiffness: 350, damping: 30 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width  - 0.5);
    y.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onEnter = () => scale.set(1.025);
  const onLeave = () => { x.set(0); y.set(0); scale.set(1); };

  return (
    <div ref={ref} className={className} style={{ perspective: '1200px' }}
      onMouseMove={onMove} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <motion.div style={{ rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}>
        {children}
      </motion.div>
    </div>
  );
};

export default Tilt3D;
