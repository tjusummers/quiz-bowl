import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { speechSupported, speakWords } from '../lib/speech.js';

/**
 * Reads one lesson section at a time. toggle(id, getSteps) starts reading the
 * section (stopping any other) or stops it if it is already being read.
 * getSteps() returns [{ text, pause?, before? }]: each step waits `pause` ms,
 * calls `before()` (e.g. to open an answer), then speaks `text`.
 */
export default function useSectionReader() {
  const supported = useMemo(() => speechSupported(), []);
  const [activeId, setActiveId] = useState(null);
  const stopRef = useRef(null);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setActiveId(null);
  }, []);

  const start = useCallback(
    (id, steps) => {
      stopRef.current?.();
      let stopSpeech = null;
      let timer = null;
      let cancelled = false;

      const run = (i) => {
        if (cancelled) return;
        const step = steps[i];
        if (!step) {
          stopRef.current = null;
          setActiveId(null);
          return;
        }
        timer = setTimeout(() => {
          if (cancelled) return;
          step.before?.();
          const words = step.text.split(/\s+/).filter(Boolean);
          stopSpeech = speakWords(words, { onEnd: () => run(i + 1) });
        }, step.pause ?? 0);
      };

      stopRef.current = () => {
        cancelled = true;
        clearTimeout(timer);
        if (stopSpeech) stopSpeech();
        else window.speechSynthesis.cancel();
      };
      setActiveId(id);
      run(0);
    },
    [],
  );

  const toggle = useCallback(
    (id, getSteps) => {
      if (activeId === id) stop();
      else start(id, getSteps());
    },
    [activeId, start, stop],
  );

  // Stop when leaving the page.
  useEffect(() => () => stopRef.current?.(), []);

  return { supported, activeId, toggle, stop };
}
