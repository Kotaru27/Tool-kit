import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface SpecialTextProps {
  children: string | number;
  className?: string;
  speed?: number;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$*&%';

export default function SpecialText({ children, className = '', speed = 30 }: SpecialTextProps) {
  const [displayText, setDisplayText] = useState('');
  const textStr = String(children || '');
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const prevTextRef = useRef('');
  const iterationRef = useRef(0);

  useEffect(() => {
    if (!isInView) return;

    if (!textStr) {
      setDisplayText('');
      prevTextRef.current = '';
      return;
    }

    let overlap = 0;
    while (
      overlap < textStr.length &&
      overlap < prevTextRef.current.length &&
      textStr[overlap] === prevTextRef.current[overlap]
    ) {
      overlap++;
    }

    // Only scramble after the overlap
    iterationRef.current = overlap;
    prevTextRef.current = textStr;
    setDisplayText((prev) => textStr.substring(0, Math.min(overlap, prev.length)));

    let currentIteration = overlap;
    const interval = setInterval(() => {
      setDisplayText((prev) => {
        let done = true;
        const nextText = textStr
          .split('')
          .map((char, index) => {
            if (index < currentIteration) {
              return textStr[index];
            }
            done = false;
            if (char === ' ' || char === '\n') return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('');

        if (done && currentIteration >= textStr.length) {
          clearInterval(interval);
        }
        return nextText;
      });

      currentIteration += 1 / 2;
    }, speed);

    return () => clearInterval(interval);
  }, [textStr, speed, isInView]);

  return (
    <span ref={ref} className={className}>
      {isInView ? (displayText || <span className="opacity-0">{textStr}</span>) : <span className="opacity-0">{textStr}</span>}
    </span>
  );
}
