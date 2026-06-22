import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { midiToFrequency, playChord, playMidi, playPercussion } from "./audio";
import { Keyboard, noteLabel, noteNames } from "./components/MusicControls";

type LabProps = { onSignal: (value: number) => void; onComplete: () => void };

function LabHeader({ chapter, english, title }: { chapter: string; english: string; title: string }) {
  return (
    <div className="lab__header">
      <div>
        <span className="overline">EXPERIMENT {chapter} · {english.toUpperCase()}</span>
        <h1>{title}</h1>
      </div>
    </div>
  );
}

function CoreReveal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="reveal static-reveal">
      <Check size={18} strokeWidth={1.5} />
      <p><strong>{title}</strong> {children}</p>
    </div>
  );
}

function playSequence(notes: number[], onSignal: (value: number) => void, gap = 300) {
  notes.forEach((note, index) => window.setTimeout(() => {
    playMidi(note, Math.max(0.22, gap / 1000));
    onSignal(midiToFrequency(note));
  }, index * gap));
}

export function SoundLab({ onSignal, onComplete }: LabProps) {
  const [pattern, setPattern] = useState([0, 2, 1, 2, 0, 2, 1, 2]);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(-1);
  const timers = useRef<number[]>([]);
  const sounds = [
    { name: "低音", midi: 48, color: "cobalt" },
    { name: "中音", midi: 60, color: "signal" },
    { name: "高音", midi: 72, color: "coral" },
  ];

  const stopPattern = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setPlaying(false);
    setPlayhead(-1);
  };

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const togglePattern = () => {
    if (playing) {
      stopPattern();
      return;
    }

    onComplete();
    setPlaying(true);
    timers.current = pattern.map((soundIndex, index) => window.setTimeout(() => {
      setPlayhead(index);
      const midi = sounds[soundIndex].midi;
      playMidi(midi, 0.25);
      onSignal(midiToFrequency(midi));
    }, index * 260));
    timers.current.push(window.setTimeout(stopPattern, pattern.length * 260));
  };

  return (
    <section className="lab">
      <LabHeader chapter="00" english="Organized sound" title="什么时候，声音开始像音乐？" />
      <div className="sound-palette lab-leading-instrument">
        {sounds.map((sound, index) => (
          <button key={sound.name} className={`sound-pad sound-pad--${sound.color}`} onClick={() => {
            playMidi(sound.midi);
            onSignal(midiToFrequency(sound.midi));
          }}>
            <span>0{index + 1}</span><strong>{sound.name}</strong><small>{noteLabel(sound.midi)}</small>
          </button>
        ))}
      </div>
      <div className="pattern-editor" aria-label="声音排列编辑器">
        <div className="panel-caption"><div><span>8 个时刻</span><strong>点击每格，改变声音排列</strong></div><button className="compact-play compact-play--inverse" onClick={togglePattern} aria-label={playing ? "暂停声音排列" : "播放声音排列"} aria-pressed={playing}>{playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}{playing ? "暂停" : "播放"}</button></div>
        <div className="pattern-steps">
          {pattern.map((soundIndex, index) => (
            <button
              key={index}
              className={`pattern-step tone-${sounds[soundIndex].color} ${playhead === index ? "is-playing" : ""}`}
              onClick={() => setPattern((current) => current.map((value, itemIndex) => itemIndex === index ? (value + 1) % sounds.length : value))}
              aria-label={`第 ${index + 1} 格，${sounds[soundIndex].name}`}
            >
              <span>{index + 1}</span><strong>{sounds[soundIndex].name.slice(0, 1)}</strong>
            </button>
          ))}
        </div>
      </div>
      <CoreReveal title="组织先于规则。">当声音出现可预测的重复、变化与层次，我们开始把它听成音乐。</CoreReveal>
    </section>
  );
}

const intervals = [
  { semitones: 1, name: "小二度", english: "minor 2nd", feel: "紧贴、摩擦" },
  { semitones: 3, name: "小三度", english: "minor 3rd", feel: "含蓄、内收" },
  { semitones: 4, name: "大三度", english: "major 3rd", feel: "明亮、打开" },
  { semitones: 7, name: "完全五度", english: "perfect 5th", feel: "开阔、稳定" },
  { semitones: 12, name: "八度", english: "octave", feel: "相似、升高" },
];

export function IntervalLab({ onSignal, onComplete }: LabProps) {
  const [selected, setSelected] = useState(7);
  const [mode, setMode] = useState<"sequential" | "together">("sequential");
  const interval = intervals.find((item) => item.semitones === selected)!;

  const audition = (playMode: "sequential" | "together", semitones = selected) => {
    onComplete();
    const auditionNotes = [60, 60 + semitones];
    if (playMode === "together") {
      playChord(auditionNotes);
      onSignal(midiToFrequency(auditionNotes[1]));
    } else playSequence(auditionNotes, onSignal, 520);
  };
  const play = () => audition(mode);

  return (
    <section className="lab">
      <LabHeader chapter="02" english="Interval" title="两个音之间，藏着什么关系？" />
      <div className="interval-console lab-leading-instrument">
        <div className="interval-arc" style={{ "--distance": selected / 12 } as React.CSSProperties}>
          <i className="arc-node arc-node--root" /><span className="arc-line" /><i className="arc-node arc-node--target" />
          <div className="interval-readout"><strong>{selected}</strong><span>半音</span></div>
          <div className="interval-notes"><span>C4</span><span>{noteLabel(60 + selected)}</span></div>
        </div>
        <div className="interval-copy"><span>当前距离</span><h2>{interval.name}</h2><small>{interval.english}</small><p>{interval.feel}</p><button className="compact-play compact-play--inverse" onClick={play}><Volume2 size={14} />试听</button></div>
      </div>
      <div className="choice-strip interval-choices">
        {intervals.map((item) => <button key={item.semitones} className={selected === item.semitones ? "is-active" : ""} onClick={() => {
          setSelected(item.semitones);
          audition(mode, item.semitones);
        }}><strong>{item.name}</strong><span>{item.semitones} 半音</span></button>)}
      </div>
      <div className="segmented" aria-label="播放方式">
        <button className={mode === "sequential" ? "is-active" : ""} onClick={() => { setMode("sequential"); audition("sequential"); }}>先后播放</button>
        <button className={mode === "together" ? "is-active" : ""} onClick={() => { setMode("together"); audition("together"); }}>同时播放</button>
      </div>
      <CoreReveal title="音程 Interval 是两个音的距离。">半音数相同，这种关系就会保留，即使两个音整体移动到别处。</CoreReveal>
    </section>
  );
}

const scaleModes = {
  major: { name: "大调", english: "Major", offsets: [0, 2, 4, 5, 7, 9, 11], color: "明亮、外放", melody: [60, 64, 67, 69, 67, 64, 60] },
  minor: { name: "自然小调", english: "Natural minor", offsets: [0, 2, 3, 5, 7, 8, 10], color: "深沉、内收", melody: [60, 63, 67, 68, 67, 63, 60] },
};

export function ScaleLab({ onSignal, onComplete }: LabProps) {
  const [mode, setMode] = useState<keyof typeof scaleModes>("major");
  const scale = scaleModes[mode];
  const notes = scale.offsets.map((offset) => 60 + offset);
  const [active, setActive] = useState<number | null>(null);

  const playScale = () => { onComplete(); playSequence([...notes, 72], onSignal, 210); };
  return (
    <section className="lab">
      <LabHeader chapter="03" english="Scale" title="为什么七个音能形成一个世界？" />
      <div className="scale-switch lab-leading-instrument">
        {(Object.keys(scaleModes) as Array<keyof typeof scaleModes>).map((key) => (
          <button key={key} className={mode === key ? "is-active" : ""} onClick={() => {
            setMode(key);
            playSequence(scaleModes[key].melody, onSignal, 260);
          }}><span>{scaleModes[key].english}</span><strong>{scaleModes[key].name}</strong><small>{scaleModes[key].color}</small></button>
        ))}
      </div>
      <div className="instrument-toolbar"><div><span>音阶音级</span><strong>逐级听完整组音</strong></div><button className="compact-play compact-play--solid" onClick={playScale}><Play size={14} fill="currentColor" />播放</button></div>
      <div className="degree-track">
        {notes.map((note, index) => <button key={note} className={active === note ? "is-active" : ""} onClick={() => {
          setActive(note); playMidi(note); onSignal(midiToFrequency(note));
        }}><span>{index + 1}</span><strong>{noteNames[note % 12]}</strong><small>{index === 0 ? "主音" : `${index + 1} 级`}</small></button>)}
      </div>
      <Keyboard activeMidi={active} highlighted={notes} onPlay={(midi) => { setActive(midi); playMidi(midi); onSignal(midiToFrequency(midi)); }} />
      <div className="discovery compact-discovery"><div><span className="discovery__index">SAME RHYTHM</span><h2>相同节奏，只替换两个音</h2><p>大调的 E、A 变成 E♭、A♭，整个听觉空间随之改变。</p></div><button className="compare-button" onClick={() => playSequence(scale.melody, onSignal, 260)}>听当前旋律</button></div>
      <CoreReveal title="音阶 Scale 是一套音的选择规则。">它规定哪些音更常出现，也让每个音相对于主音获得不同倾向。</CoreReveal>
    </section>
  );
}

export function ChordLab({ onSignal, onComplete }: LabProps) {
  const [quality, setQuality] = useState<"major" | "minor">("major");
  const [root, setRoot] = useState(60);
  const notes = quality === "major" ? [root, root + 4, root + 7] : [root, root + 3, root + 7];
  const third = quality === "major" ? "大三度 · 4 半音" : "小三度 · 3 半音";
  const play = () => { playChord(notes); onSignal(midiToFrequency(notes[2])); };
  return (
    <section className="lab">
      <LabHeader chapter="04" english="Chord" title="几个音同时响起，会发生什么？" />
      <div className="chord-machine lab-leading-instrument">
        <div className="chord-stack">
          {notes.slice().reverse().map((note, index) => <button key={note} onClick={() => { playMidi(note); onSignal(midiToFrequency(note)); }}><span>{["五音", "三音", "根音"][index]}</span><strong>{noteLabel(note)}</strong><small>{index === 1 ? third : index === 0 ? "完全五度 · 7 半音" : "起点"}</small></button>)}
        </div>
        <div className="chord-identity"><span>CHORD</span><strong>{noteNames[root % 12]}{quality === "major" ? "" : "m"}</strong><p>{quality === "major" ? "大三和弦 · Major triad" : "小三和弦 · Minor triad"}</p><button className="compact-play" onClick={play}><Play size={14} fill="currentColor" />同时试听</button></div>
      </div>
      <div className="control-row">
        <div className="segmented"><button className={quality === "major" ? "is-active" : ""} onClick={() => { setQuality("major"); onComplete(); playChord([root, root + 4, root + 7]); onSignal(midiToFrequency(root + 7)); }}>大三和弦</button><button className={quality === "minor" ? "is-active" : ""} onClick={() => { setQuality("minor"); onComplete(); playChord([root, root + 3, root + 7]); onSignal(midiToFrequency(root + 7)); }}>小三和弦</button></div>
        <label className="root-control"><span>根音</span><select value={root} onChange={(event) => setRoot(Number(event.target.value))}>{[60, 62, 64, 65, 67].map((note) => <option key={note} value={note}>{noteNames[note % 12]}</option>)}</select></label>
      </div>
      <Keyboard activeMidi={null} highlighted={notes} onPlay={(midi) => { playMidi(midi); onSignal(midiToFrequency(midi)); }} />
      <CoreReveal title="只移动中间那个音，色彩就改变。">大、小三和弦共享根音和五音；决定明暗差异的是三音离根音有 4 个还是 3 个半音。</CoreReveal>
    </section>
  );
}

export function TonalityLab({ onSignal, onComplete }: LabProps) {
  const [ending, setEnding] = useState<number | null>(null);
  const endings = [
    { midi: 71, label: "B", feeling: "仍在等待", stable: false },
    { midi: 67, label: "G", feeling: "暂时停住", stable: false },
    { midi: 72, label: "C", feeling: "回到家了", stable: true },
  ];
  const choose = (midi: number) => {
    setEnding(midi);
    if (midi === 72) onComplete();
    playSequence([60, 64, 67, 69, midi], onSignal, 300);
  };
  const current = endings.find((item) => item.midi === ending);
  return (
    <section className="lab">
      <LabHeader chapter="05" english="Tonality" title="为什么有些音像回到了家？" />
      <div className="home-experiment lab-leading-instrument">
        <div className="unfinished-phrase"><span>这句话还没有结束</span><div>{[60, 64, 67, 69].map((note, index) => <i key={note} style={{ "--height": `${28 + index * 16}%` } as React.CSSProperties} />)}</div><button onClick={() => playSequence([60, 64, 67, 69], onSignal, 300)}><Play size={16} fill="currentColor" />先听前半句</button></div>
        <div className="ending-options"><span>选择一个结尾</span>{endings.map((item) => <button key={item.midi} className={`${ending === item.midi ? "is-active" : ""} ${item.stable ? "is-home" : ""}`} onClick={() => choose(item.midi)}><strong>{item.label}</strong><small>{ending === item.midi ? item.feeling : "试听"}</small></button>)}</div>
      </div>
      {current && <div className={`resolution-meter ${current.stable ? "is-resolved" : ""}`} role="status"><span>稳定感</span><i /><strong>{current.feeling}</strong></div>}
      <CoreReveal title="调性 Tonality 会建立一个听觉中心。">C 不是天生更稳定；前面的声音不断暗示 C，它才在这个上下文里成为“家”。</CoreReveal>
    </section>
  );
}

const defaultRhythm = [true, false, false, false, true, false, true, false, true, false, false, true, true, false, true, false];

export function RhythmLab({ onSignal, onComplete }: LabProps) {
  const [steps, setSteps] = useState(defaultRhythm);
  const [bpm, setBpm] = useState(96);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(-1);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) { if (timer.current) window.clearInterval(timer.current); setPlayhead(-1); return; }
    let current = -1;
    const tick = () => {
      current = (current + 1) % 16;
      setPlayhead(current);
      if (steps[current]) playPercussion(current % 4 === 0 ? "kick" : "hat", current % 4 === 0);
      else if (current % 4 === 0) playPercussion("click", true);
      onSignal(140 + current * 14);
    };
    tick();
    timer.current = window.setInterval(tick, 60000 / bpm / 4);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [playing, bpm, steps, onSignal]);

  return (
    <section className="lab">
      <LabHeader chapter="06" english="Rhythm" title="时间怎样变成律动？" />
      <div className="rhythm-panel lab-leading-instrument">
        <div className="rhythm-grid">{steps.map((on, index) => <button key={index} className={`${on ? "is-on" : ""} ${playhead === index ? "is-playing" : ""} ${index % 4 === 0 ? "is-beat" : ""}`} onClick={() => setSteps((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value))} aria-label={`第 ${index + 1} 格${on ? "有声音" : "无声音"}`} aria-pressed={on}><span>{index + 1}</span></button>)}</div>
        <div className="rhythm-controls"><label><span>速度</span><input type="range" min="60" max="160" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} /><strong>{bpm} BPM</strong></label><button className="compact-play compact-play--inverse" onClick={() => { if (!playing) onComplete(); setPlaying((value) => !value); }}>{playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}{playing ? "暂停" : "播放"}</button><button className="icon-button compact-icon-button" onClick={() => setSteps(defaultRhythm)} title="恢复节奏" aria-label="恢复节奏"><RotateCcw size={15} /></button></div>
      </div>
      <div className="metric-row"><div><span>拍 Beat</span><strong>4</strong><small>一小节四拍</small></div><div><span>细分 Subdivision</span><strong>16</strong><small>每拍分成四格</small></div><div><span>已放置 Hit</span><strong>{steps.filter(Boolean).length}</strong><small>点击格子改变</small></div></div>
      <CoreReveal title="节奏 Rhythm 是时间关系。">速度决定整体快慢，网格决定声音落在哪些时刻，强拍让循环获得方向。</CoreReveal>
    </section>
  );
}

const melodyPitches = [72, 71, 69, 67, 65, 64, 62, 60];
const initialMelody = [60, 62, 64, 65, 67, 64, 62, 60] as Array<number | null>;

export function MelodyLab({ onSignal, onComplete }: LabProps) {
  const [melody, setMelody] = useState(initialMelody);
  const [playingStep, setPlayingStep] = useState(-1);
  const [page, setPage] = useState<0 | 1>(0);
  const play = () => { if (melody.filter(Boolean).length >= 4) onComplete(); melody.forEach((note, index) => window.setTimeout(() => {
    setPlayingStep(index);
    if (note) { playMidi(note, 0.3); onSignal(midiToFrequency(note)); }
    if (index === melody.length - 1) window.setTimeout(() => setPlayingStep(-1), 320);
  }, index * 320)); };
  const points = melody.map((note, index) => note ? `${(index / 7) * 100},${100 - ((note - 60) / 12) * 100}` : null).filter(Boolean).join(" ");
  return (
    <section className="lab">
      <LabHeader chapter="07" english="Melody" title="一串音为什么像一句话？" />
      <div className="melody-contour"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} /></svg><span>MELODY CONTOUR</span></div>
      <div className="instrument-toolbar"><div><span>旋律序列</span><strong>听八个时刻的完整轮廓</strong></div><button className="compact-play compact-play--solid" onClick={play}><Play size={14} fill="currentColor" />播放</button></div>
      <div className="step-page-control"><button className={page === 0 ? "is-active" : ""} onClick={() => setPage(0)}>时刻 1–4</button><button className={page === 1 ? "is-active" : ""} onClick={() => setPage(1)}>时刻 5–8</button></div>
      <div className="melody-editor"><div className="melody-labels">{melodyPitches.map((note) => <span key={note}>{noteNames[note % 12]}</span>)}</div><div className={`melody-grid page-${page}`}>{melodyPitches.flatMap((note) => melody.map((value, step) => <button key={`${note}-${step}`} className={`step-${step} ${value === note ? "is-on" : ""} ${playingStep === step ? "is-playing" : ""}`} onClick={() => { setMelody((current) => current.map((item, index) => index === step ? (item === note ? null : note) : item)); playMidi(note); onSignal(midiToFrequency(note)); }} aria-label={`第 ${step + 1} 格 ${noteLabel(note)}`} aria-pressed={value === note} />))}</div></div>
      <div className="phrase-analysis"><div><span>方向</span><strong>{(melody[4] ?? 60) > (melody[0] ?? 60) ? "先上行" : "先下行"}</strong></div><div><span>最高点</span><strong>{melody.some((note) => note !== null) ? noteLabel(Math.max(...melody.filter((note): note is number => note !== null))) : "等待音符"}</strong></div><div><span>结尾</span><strong>{melody[7] === 60 ? "回到主音" : "保持开放"}</strong></div></div>
      <CoreReveal title="旋律 Melody 像一句在时间里展开的话。">音高轮廓给它方向，重复让人记住，变化保持注意，结尾决定是否说完。</CoreReveal>
    </section>
  );
}

const notationPhrase = [60, 62, 64, 67, 64, 62, 60];

export function NotationLab({ onSignal, onComplete }: LabProps) {
  const [active, setActive] = useState<number | null>(null);
  const [duration, setDuration] = useState<1 | 2 | 4>(1);
  const durationLabel = duration === 1 ? "四分音符" : duration === 2 ? "二分音符" : "全音符";
  const playNote = (note: number) => { setActive(note); playMidi(note, duration * 0.38); onSignal(midiToFrequency(note)); };
  const staffNotes = useMemo(() => notationPhrase.map((note, index) => ({ note, x: 10 + index * 13, y: 76 - (note - 60) * 4.5 })), []);
  return (
    <section className="lab">
      <LabHeader chapter="08" english="Notation" title="音乐为什么需要被写下来？" />
      <div className="staff-panel">
        <div className="staff-toolbar"><span>PHRASE / 7 NOTES</span><button className="compact-play compact-play--inverse" onClick={() => { onComplete(); playSequence(notationPhrase, onSignal, 360); }}><Play size={14} fill="currentColor" />读谱</button></div>
        <div className="staff-lines" aria-label="基础五线谱旋律">
          {[0, 1, 2, 3, 4].map((line) => <i key={line} style={{ top: `${26 + line * 12}%` }} />)}
          <span className="clef">𝄞</span>
          {staffNotes.map(({ note, x, y }, index) => <button key={`${note}-${index}`} className={active === note ? "is-active" : ""} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => playNote(note)} aria-label={`谱面音符 ${noteLabel(note)}`}><b /><em /></button>)}
        </div>
        <div className="staff-caption"><span>纵向 = 音高</span><span>横向 = 时间</span></div>
      </div>
      <Keyboard activeMidi={active} highlighted={notationPhrase} onPlay={playNote} />
      <div className="duration-lab"><div><span className="overline">DURATION</span><h2>同一个音，可以占据不同长度</h2></div><div className="duration-options">{([1, 2, 4] as const).map((value) => <button key={value} className={duration === value ? "is-active" : ""} onClick={() => { setDuration(value); playMidi(60, value * 0.38); onSignal(midiToFrequency(60)); }}><i className={`note-symbol duration-${value}`} /><strong>{value === 1 ? "四分" : value === 2 ? "二分" : "全音符"}</strong><span>{value} 拍</span></button>)}</div></div>
      <CoreReveal title={`当前选择：${durationLabel}。`}>五线和间记录音高的位置，音符形状记录它在时间里持续多久。</CoreReveal>
    </section>
  );
}
