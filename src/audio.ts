let context: AudioContext | null = null;
let master: GainNode | null = null;

function getAudio() {
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.18;
    master.connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return { context, master: master! };
}

export function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function playFrequency(frequency: number, duration = 0.65, startAt?: number) {
  const { context: ctx, master: output } = getAudio();
  const oscillator = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const envelope = ctx.createGain();
  const startTime = startAt ?? ctx.currentTime;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(4200, frequency * 7), startTime);
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(0.7, startTime + 0.018);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(filter).connect(envelope).connect(output);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

export function playMidi(midi: number, duration = 0.55, startAt?: number) {
  playFrequency(midiToFrequency(midi), duration, startAt);
}

export function playChord(notes: number[]) {
  const { context: ctx } = getAudio();
  const sharedStart = ctx.currentTime + 0.012;
  notes.forEach((note) => playMidi(note, 0.9, sharedStart));
}

export function playPercussion(kind: "kick" | "click" | "hat" = "click", accent = false) {
  const { context: ctx, master: output } = getAudio();
  const now = ctx.currentTime;

  if (kind === "kick") {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(120, now);
    oscillator.frequency.exponentialRampToValueAtTime(42, now + 0.13);
    envelope.gain.setValueAtTime(accent ? 1 : 0.72, now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    oscillator.connect(envelope).connect(output);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
    return;
  }

  const length = Math.floor(ctx.sampleRate * (kind === "hat" ? 0.055 : 0.025));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const envelope = ctx.createGain();
  source.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = kind === "hat" ? 5200 : 1800;
  envelope.gain.setValueAtTime(accent ? 0.62 : 0.35, now);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "hat" ? 0.07 : 0.04));
  source.connect(filter).connect(envelope).connect(output);
  source.start(now);
}
