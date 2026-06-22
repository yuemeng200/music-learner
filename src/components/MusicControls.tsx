import { useMemo } from "react";

export const noteNames = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

export function noteLabel(midi: number) {
  return `${noteNames[(midi % 12 + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

type Point = [number, number];

function smoothPath(points: Point[]) {
  if (points.length < 2) return "";
  const format = (value: number) => value.toFixed(3);
  let path = `M ${format(points[0][0])} ${format(points[0][1])}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const current = points[index];
    const next = points[index + 1];
    const following = points[Math.min(points.length - 1, index + 2)];
    const controlOne: Point = [
      current[0] + (next[0] - previous[0]) / 6,
      current[1] + (next[1] - previous[1]) / 6,
    ];
    const controlTwo: Point = [
      next[0] - (following[0] - current[0]) / 6,
      next[1] - (following[1] - current[1]) / 6,
    ];

    path += ` C ${format(controlOne[0])} ${format(controlOne[1])}, ${format(controlTwo[0])} ${format(controlTwo[1])}, ${format(next[0])} ${format(next[1])}`;
  }

  return path;
}

export function FrequencyWave({ frequency }: { frequency: number }) {
  const path = useMemo(() => {
    const sampleCount = 256;
    const cycles = frequency / 65.405;
    const points = Array.from({ length: sampleCount }, (_, index): Point => {
      const progress = index / (sampleCount - 1);
      const phase = progress * Math.PI * 2 * cycles;
      return [progress * 100, 50 + Math.sin(phase) * 28];
    });
    return smoothPath(points);
  }, [frequency]);

  return (
    <div className="wave-horizon" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1="50" x2="100" y2="50" />
        <path d={path} />
      </svg>
      <span>FREQUENCY WAVE · {frequency.toFixed(1)} HZ</span>
    </div>
  );
}

export function Keyboard({
  onPlay,
  activeMidi,
  highlighted = [],
}: {
  onPlay: (midi: number) => void;
  activeMidi: number | null;
  highlighted?: number[];
}) {
  return (
    <div className="keyboard" aria-label="虚拟键盘">
      {noteNames.map((name, index) => {
        const midi = 60 + index;
        const sharp = name.includes("♯");
        return (
          <button
            className={`key ${sharp ? "key--sharp" : ""} ${activeMidi === midi ? "is-active" : ""} ${highlighted.includes(midi) ? "is-highlighted" : ""}`}
            key={name}
            onClick={() => onPlay(midi)}
            aria-label={`播放 ${name}4`}
          >
            <span>{name}</span>
          </button>
        );
      })}
    </div>
  );
}
