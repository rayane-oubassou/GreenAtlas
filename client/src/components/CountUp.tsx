import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  separator?: string;
}

const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 1.5,
  className = '',
  separator = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? to : from);
  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  const formatValue = useCallback((latest: number) => {
    const options: Intl.NumberFormatOptions = { useGrouping: !!separator, minimumFractionDigits: 0, maximumFractionDigits: 0 };
    const formatted = Intl.NumberFormat('en-US', options).format(latest);
    return separator ? formatted.replace(/,/g, separator) : formatted;
  }, [separator]);

  useEffect(() => {
    if (ref.current) ref.current.textContent = formatValue(direction === 'down' ? to : from);
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (!isInView) return;
    const id = setTimeout(() => motionValue.set(direction === 'down' ? from : to), delay * 1000);
    return () => clearTimeout(id);
  }, [isInView, motionValue, direction, from, to, delay]);

  useEffect(() => {
    return springValue.on('change', (latest: number) => {
      if (ref.current) ref.current.textContent = formatValue(latest);
    });
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
};

export default CountUp;
