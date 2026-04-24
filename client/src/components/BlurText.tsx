import { motion } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';

type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  stepDuration?: number;
};

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 80,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  stepDuration = 0.35,
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  const fromSnapshot = useMemo(
    () => direction === 'top' ? { filter: 'blur(10px)', opacity: 0, y: -20 } : { filter: 'blur(10px)', opacity: 0, y: 20 },
    [direction]
  );
  const toSnapshots = useMemo(
    () => [{ filter: 'blur(4px)', opacity: 0.5, y: direction === 'top' ? 4 : -4 }, { filter: 'blur(0px)', opacity: 1, y: 0 }],
    [direction]
  );

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => i / (stepCount - 1));

  const buildKeyframes = (from: Record<string, string|number>, steps: Array<Record<string, string|number>>) => {
    const keys = new Set([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);
    const kf: Record<string, Array<string|number>> = {};
    keys.forEach(k => { kf[k] = [from[k], ...steps.map(s => s[k])]; });
    return kf;
  };

  return (
    <p ref={ref} className={`flex flex-wrap ${className}`}>
      {elements.map((segment, i) => (
        <motion.span
          key={i}
          initial={fromSnapshot}
          animate={inView ? buildKeyframes(fromSnapshot, toSnapshots) : fromSnapshot}
          transition={{ duration: totalDuration, times, delay: (i * delay) / 1000, ease: 'easeOut' }}
          style={{ display: 'inline-block', willChange: 'transform, filter, opacity' }}
        >
          {segment === ' ' ? ' ' : segment}
          {animateBy === 'words' && i < elements.length - 1 && ' '}
        </motion.span>
      ))}
    </p>
  );
};

export default BlurText;
