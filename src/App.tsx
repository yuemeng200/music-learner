import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Menu, Pause, Play, RotateCcw, Volume2, X } from "lucide-react";
import { midiToFrequency, playChord, playFrequency, playMidi, playPercussion } from "./audio";
import { chapters } from "./course";
import { chapterGuides } from "./chapterGuides";
import { FrequencyWave, Keyboard, noteNames } from "./components/MusicControls";
import { ChordLab, IntervalLab, MelodyLab, NotationLab, RhythmLab, ScaleLab, SoundLab, TonalityLab } from "./labs";

const defaultPattern = [60, null, 64, null, 67, 64, 62, null] as Array<number | null>;
const defaultDrums = [true, false, true, false, true, false, true, true];
const reportSignal = (_value: number) => undefined;
const contextWidthStorageKey = "sonic-atlas-context-width";

function getContextWidthBounds(viewportWidth = window.innerWidth) {
  if (viewportWidth <= 760) return { min: 280, max: 560 };
  const courseWidth = viewportWidth > 1180 ? 240 : viewportWidth > 1020 ? 210 : 0;
  const mainMinimum = viewportWidth > 1180 ? 520 : viewportWidth > 1020 ? 430 : 420;
  const min = viewportWidth > 1020 ? 300 : 280;
  return { min, max: Math.max(min, Math.min(560, viewportWidth - courseWidth - mainMinimum - 9)) };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function makeStudioPattern(root: number, mode: "major" | "minor") {
  return [root, null, root + (mode === "major" ? 4 : 3), null, root + 7, root + (mode === "major" ? 4 : 3), root + 2, null] as Array<number | null>;
}

function makeTriad(root: number, quality: "major" | "minor") {
  return [root, root + (quality === "major" ? 4 : 3), root + 7];
}

function PitchLab({ onSignal, onComplete }: { onSignal: (value: number) => void; onComplete: () => void }) {
  const [frequency, setFrequency] = useState(261.63);
  const [activeMidi, setActiveMidi] = useState<number | null>(60);
  const [hasCompared, setHasCompared] = useState(false);
  const semitones = Math.round(12 * Math.log2(frequency / 261.63));
  const closestMidi = 60 + semitones;
  const closestName = `${noteNames[(closestMidi % 12 + 12) % 12]}${Math.floor(closestMidi / 12) - 1}`;

  const sound = (value = frequency) => {
    playFrequency(value);
    onSignal(value);
    setActiveMidi(60 + Math.round(12 * Math.log2(value / 261.63)));
  };

  const playKey = (midi: number) => {
    const value = midiToFrequency(midi);
    setFrequency(value);
    setActiveMidi(midi);
    playMidi(midi);
    onSignal(value);
  };

  const compareOctave = () => {
    setHasCompared(true);
    onComplete();
    sound(261.63);
    window.setTimeout(() => sound(523.25), 520);
  };

  return (
    <section className="lab" aria-labelledby="pitch-title">
      <div className="lab__header">
        <div>
          <span className="overline">EXPERIMENT 01 · PITCH</span>
          <h1 id="pitch-title">声音为什么有高有低？</h1>
        </div>
      </div>

      <FrequencyWave frequency={frequency} />

      <div className="pitch-console">
        <div className="readout">
          <span>FREQUENCY</span>
          <strong>{frequency.toFixed(1)}</strong>
          <small>Hz</small>
          <button className="compact-play compact-play--inverse" onClick={() => sound()}><Volume2 size={14} strokeWidth={1.5} />试听</button>
        </div>
        <label className="frequency-control">
          <span>从低处移向高处，然后松手试听</span>
          <input
            type="range"
            min="130.81"
            max="1046.5"
            step="0.1"
            value={frequency}
            onChange={(event) => setFrequency(Number(event.target.value))}
            onPointerUp={() => sound()}
            onKeyUp={() => sound()}
          />
          <span className="range-labels"><i>低</i><i>高</i></span>
        </label>
        <div className="note-lock">
          <span>最近的音名</span>
          <strong>{closestName}</strong>
          <small>{semitones === 0 ? "起点" : `${semitones > 0 ? "+" : ""}${semitones} 半音`}</small>
        </div>
      </div>

      <Keyboard onPlay={playKey} activeMidi={activeMidi} />

      <div className="discovery">
        <div>
          <span className="discovery__index">A / B</span>
          <h2>两个 C，为什么既相似又不同？</h2>
          <p>先不要记定义。听完两次声音，留意第二个音高了多少，又保留了什么。</p>
        </div>
        <button className="compare-button" onClick={compareOctave}>
          <Play size={18} fill="currentColor" strokeWidth={1.4} />
          比较两个 C
        </button>
      </div>

      {hasCompared && (
        <div className="reveal" role="status">
          <Check size={18} strokeWidth={1.6} />
          <p><strong>你刚刚听到了八度 Octave。</strong> 第二个声音的频率正好翻倍，因此更高，却保留了相似的身份。</p>
        </div>
      )}
    </section>
  );
}

function MiniComposer({ onSignal, onComplete }: { onSignal: (value: number) => void; onComplete: () => void }) {
  const savedPiece = (() => {
    try { return JSON.parse(localStorage.getItem("sonic-atlas-piece-v2") ?? "null") as null | { pattern: Array<number | null>; drums: boolean[]; bpm: number; mode: "major" | "minor"; root?: number }; }
    catch { return null; }
  })();
  const [pattern, setPattern] = useState<Array<number | null>>(savedPiece?.pattern ?? defaultPattern);
  const [drums, setDrums] = useState(savedPiece?.drums ?? defaultDrums);
  const [bpm, setBpm] = useState(savedPiece?.bpm ?? 96);
  const [mode, setMode] = useState<"major" | "minor">(savedPiece?.mode ?? "major");
  const [root, setRoot] = useState(savedPiece?.root ?? 60);
  const [muted, setMuted] = useState({ rhythm: false, chords: false, melody: false });
  const [studioPage, setStudioPage] = useState<0 | 1>(0);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);
  const timer = useRef<number | null>(null);
  const scalePitches = (mode === "major" ? [12, 11, 9, 7, 5, 4, 2, 0] : [12, 10, 8, 7, 5, 3, 2, 0]).map((offset) => root + offset);
  const bass = root - 12;
  const progression = mode === "major"
    ? [makeTriad(bass, "major"), makeTriad(bass + 9, "minor"), makeTriad(bass + 5, "major"), makeTriad(bass + 7, "major")]
    : [makeTriad(bass, "minor"), makeTriad(bass + 8, "major"), makeTriad(bass + 5, "minor"), makeTriad(bass + 7, "major")];

  useEffect(() => {
    localStorage.setItem("sonic-atlas-piece-v2", JSON.stringify({ pattern, drums, bpm, mode, root }));
  }, [pattern, drums, bpm, mode, root]);

  useEffect(() => {
    if (!playing) {
      if (timer.current) window.clearInterval(timer.current);
      setStep(-1);
      return;
    }
    let current = -1;
    const tick = () => {
      current = (current + 1) % pattern.length;
      setStep(current);
      const note = pattern[current];
      if (drums[current] && !muted.rhythm) playPercussion(current % 4 === 0 ? "kick" : "hat", current % 4 === 0);
      if (note && !muted.melody) {
        playMidi(note, 0.32);
        onSignal(midiToFrequency(note));
      }
      if (current % 2 === 0 && !muted.chords) playChord(progression[current / 2]);
    };
    tick();
    timer.current = window.setInterval(tick, 60000 / bpm / 2);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [playing, pattern, drums, bpm, mode, root, muted, onSignal]);

  const toggleNote = (column: number, midi: number) => {
    setPattern((current) => current.map((note, index) => index === column ? (note === midi ? null : midi) : note));
    playMidi(midi, 0.35);
    onSignal(midiToFrequency(midi));
  };

  return (
    <section className="lab studio" aria-labelledby="studio-title">
      <div className="lab__header">
        <div>
          <span className="overline">STUDIO · 8 STEPS</span>
          <h1 id="studio-title">把八个时刻，连成一句旋律。</h1>
        </div>
      </div>
      <div className="instrument-toolbar studio-transport lab-leading-instrument"><div><span>完整编排</span><strong>节奏、和弦与旋律同步循环</strong></div><div className="transport"><button className="icon-button compact-icon-button" onClick={() => { setRoot(60); setPattern(defaultPattern); setDrums(defaultDrums); setBpm(96); setMode("major"); }} title="恢复示例" aria-label="恢复示例"><RotateCcw size={15} strokeWidth={1.5} /></button><button className="compact-play compact-play--solid" onClick={() => { if (!playing) onComplete(); setPlaying((value) => !value); }}>{playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}{playing ? "暂停" : "播放"}</button></div></div>
      <div className="studio-settings">
        <div className="mode-field"><span>调性中心与调式</span><div className="mode-controls"><label><span>主音</span><select value={root} onChange={(event) => { const nextRoot = Number(event.target.value); setRoot(nextRoot); setPattern(makeStudioPattern(nextRoot, mode)); }}>{[60, 62, 65].map((note) => <option key={note} value={note}>{noteNames[note % 12]}</option>)}</select></label><div className="segmented"><button className={mode === "major" ? "is-active" : ""} onClick={() => { setMode("major"); setPattern(makeStudioPattern(root, "major")); }}>大调</button><button className={mode === "minor" ? "is-active" : ""} onClick={() => { setMode("minor"); setPattern(makeStudioPattern(root, "minor")); }}>小调</button></div></div></div>
        <label className="tempo-field"><span>速度</span><input type="range" min="64" max="144" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} /><strong>{bpm} BPM</strong></label>
      </div>
      <div className="track-mixer" aria-label="分轨开关">
        {(["rhythm", "chords", "melody"] as const).map((track) => <label key={track} className="track-toggle"><input type="checkbox" checked={!muted[track]} onChange={(event) => setMuted((current) => ({ ...current, [track]: !event.target.checked }))} /><i /><span>{track === "rhythm" ? "节奏" : track === "chords" ? "和弦" : "旋律"}</span><small>{muted[track] ? "静音" : "开启"}</small></label>)}
      </div>
      <div className="step-page-control"><button className={studioPage === 0 ? "is-active" : ""} onClick={() => setStudioPage(0)}>时刻 1–4</button><button className={studioPage === 1 ? "is-active" : ""} onClick={() => setStudioPage(1)}>时刻 5–8</button></div>
      <div className={`drum-track page-${studioPage}`}><span>KICK / HAT</span><div>{drums.map((on, index) => <button key={index} className={`step-${index} ${on ? "is-on" : ""} ${step === index ? "is-playing" : ""}`} onClick={() => { setDrums((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value)); playPercussion(index % 4 === 0 ? "kick" : "hat", index % 4 === 0); }} aria-label={`节奏第 ${index + 1} 格`} aria-pressed={on}>{index + 1}</button>)}</div></div>
      <div className="composer-wrap">
        <div className="composer-labels" aria-hidden="true">
          {scalePitches.map((midi) => <span key={midi}>{noteNames[midi % 12]}</span>)}
        </div>
        <div className={`composer-grid page-${studioPage}`} style={{ "--columns": pattern.length } as React.CSSProperties}>
          {scalePitches.flatMap((midi) => pattern.map((note, column) => (
            <button
              key={`${midi}-${column}`}
              className={`composer-cell step-${column} ${note === midi ? "is-on" : ""} ${step === column ? "is-playing" : ""}`}
              onClick={() => toggleNote(column, midi)}
              aria-label={`第 ${column + 1} 拍 ${noteNames[midi % 12]} ${note === midi ? "已放置" : "未放置"}`}
              aria-pressed={note === midi}
            />
          )))}
        </div>
      </div>
      <div className="studio-footer">
        <p><strong>{pattern.filter(Boolean).length} 个音</strong> · {noteNames[root % 12]} {mode === "major" ? "大调" : "小调"} · {drums.filter(Boolean).length} 个节奏点</p>
        <span>旋律、节奏、和弦和速度已自动保存在本机。</span>
      </div>
    </section>
  );
}

function App() {
  const initialId = window.location.hash.replace("#/chapter/", "") || "pitch";
  const [activeId, setActiveId] = useState(chapters.some((item) => item.id === initialId) ? initialId : "pitch");
  const [menuOpen, setMenuOpen] = useState(false);
  const [visited, setVisited] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("sonic-atlas-progress") ?? "[]") as string[]; }
    catch { return []; }
  });
  const [mastered, setMastered] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("sonic-atlas-mastery") ?? "[]") as string[]; }
    catch { return []; }
  });
  const [completionNotice, setCompletionNotice] = useState("");
  const [contextWidth, setContextWidth] = useState(() => {
    const saved = Number(localStorage.getItem(contextWidthStorageKey));
    const bounds = getContextWidthBounds();
    return clamp(Number.isFinite(saved) && saved > 0 ? saved : 360, bounds.min, bounds.max);
  });
  const [contextBounds, setContextBounds] = useState(() => getContextWidthBounds());
  const [isResizing, setIsResizing] = useState(false);
  const noticeTimer = useRef<number | null>(null);
  const contextWidthRef = useRef(contextWidth);
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const contextScrollRef = useRef<HTMLDivElement | null>(null);
  const chapter = chapters.find((item) => item.id === activeId)!;
  const guide = chapterGuides[activeId];
  const activeIndex = chapters.indexOf(chapter);

  useEffect(() => {
    const syncChapterFromHash = () => {
      const id = window.location.hash.replace("#/chapter/", "");
      if (chapters.some((item) => item.id === id)) setActiveId(id);
    };
    syncChapterFromHash();
    window.addEventListener("hashchange", syncChapterFromHash);
    return () => window.removeEventListener("hashchange", syncChapterFromHash);
  }, []);

  const navigate = (id: string) => {
    setActiveId(id);
    setMenuOpen(false);
    window.location.hash = `/chapter/${id}`;
    document.querySelector("main")?.focus();
  };

  useEffect(() => {
    setVisited((current) => {
      if (current.includes(activeId)) return current;
      const next = [...current, activeId];
      localStorage.setItem("sonic-atlas-progress", JSON.stringify(next));
      return next;
    });
    mainScrollRef.current?.scrollTo({ top: 0 });
    contextScrollRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [activeId]);

  const adjacent = (direction: -1 | 1) => {
    const next = chapters[Math.max(0, Math.min(chapters.length - 1, activeIndex + direction))];
    navigate(next.id);
  };

  const completeChapter = (id: string) => {
    if (mastered.includes(id)) return;
    const next = [...mastered, id];
    setMastered(next);
    localStorage.setItem("sonic-atlas-mastery", JSON.stringify(next));
    const title = chapters.find((item) => item.id === id)?.title ?? "本章";
    setCompletionNotice(`${title} · 已掌握`);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setCompletionNotice(""), 2600);
  };

  useEffect(() => () => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const bounds = getContextWidthBounds();
      setContextBounds(bounds);
      setContextWidth((current) => {
        const next = clamp(current, bounds.min, bounds.max);
        contextWidthRef.current = next;
        return next;
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateContextWidth = (value: number, persist = false) => {
    const next = clamp(value, contextBounds.min, contextBounds.max);
    contextWidthRef.current = next;
    setContextWidth(next);
    if (persist) localStorage.setItem(contextWidthStorageKey, String(Math.round(next)));
  };

  const resizeFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    updateContextWidth(window.innerWidth - event.clientX);
  };

  const finishResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setIsResizing(false);
    localStorage.setItem(contextWidthStorageKey, String(Math.round(contextWidthRef.current)));
  };

  const resizeFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") updateContextWidth(360, true);
    else if (event.key === "End") updateContextWidth(contextBounds.max, true);
    else updateContextWidth(contextWidth + (event.key === "ArrowLeft" ? 24 : -24), true);
  };

  return (
    <div className={`app-shell ${isResizing ? "is-resizing" : ""}`} style={{ "--context-width": `${contextWidth}px` } as CSSProperties}>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <header className="mobile-header">
        <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="打开课程目录"><Menu size={20} /></button>
        <span>声音图谱</span>
        <span className="mobile-count">{chapter.number} / 09</span>
      </header>

      <aside className={`course-rail ${menuOpen ? "is-open" : ""}`} aria-label="课程目录">
        <div className="brand">
          <div className="brand-mark"><i /><i /><i /><i /></div>
          <div><strong>声音图谱</strong><span>SONIC ATLAS</span></div>
          <button className="rail-close" onClick={() => setMenuOpen(false)} aria-label="关闭课程目录"><X size={20} /></button>
        </div>
        <p className="rail-label">课程轨道 · 约 75 分钟</p>
        <nav>
          {chapters.map((item) => (
            <button key={item.id} className={item.id === activeId ? "is-active" : ""} onClick={() => navigate(item.id)}>
              <span className="chapter-number">{item.number}</span>
              <span><strong>{item.title}</strong><small>{item.english}</small></span>
              <i className={`ready-dot ${visited.includes(item.id) ? "is-visited" : ""} ${mastered.includes(item.id) ? "is-mastered" : ""}`} aria-label={mastered.includes(item.id) ? "已掌握" : visited.includes(item.id) ? "已访问" : "可以体验"} />
            </button>
          ))}
        </nav>
        <div className="rail-progress" aria-label={`已掌握 ${mastered.length} 章`}><span style={{ transform: `scaleX(${mastered.length / chapters.length})` }} /></div>
      </aside>

      <main id="main-content" ref={mainScrollRef} tabIndex={-1}>
        {activeId === "sound" && <SoundLab onSignal={reportSignal} onComplete={() => completeChapter("sound")} />}
        {activeId === "pitch" && <PitchLab onSignal={reportSignal} onComplete={() => completeChapter("pitch")} />}
        {activeId === "interval" && <IntervalLab onSignal={reportSignal} onComplete={() => completeChapter("interval")} />}
        {activeId === "scale" && <ScaleLab onSignal={reportSignal} onComplete={() => completeChapter("scale")} />}
        {activeId === "chord" && <ChordLab onSignal={reportSignal} onComplete={() => completeChapter("chord")} />}
        {activeId === "tonality" && <TonalityLab onSignal={reportSignal} onComplete={() => completeChapter("tonality")} />}
        {activeId === "rhythm" && <RhythmLab onSignal={reportSignal} onComplete={() => completeChapter("rhythm")} />}
        {activeId === "melody" && <MelodyLab onSignal={reportSignal} onComplete={() => completeChapter("melody")} />}
        {activeId === "notation" && <NotationLab onSignal={reportSignal} onComplete={() => completeChapter("notation")} />}
        {activeId === "studio" && <MiniComposer onSignal={reportSignal} onComplete={() => completeChapter("studio")} />}
      </main>

      <div
        className="layout-resizer"
        role="separator"
        aria-label="调整课程与讲解区域宽度"
        aria-orientation="vertical"
        aria-valuemin={contextBounds.min}
        aria-valuemax={contextBounds.max}
        aria-valuenow={Math.round(contextWidth)}
        tabIndex={0}
        title="拖拽调整讲解区域宽度"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setIsResizing(true); resizeFromPointer(event); }}
        onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) resizeFromPointer(event); }}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
        onKeyDown={resizeFromKeyboard}
      ><i /><i /><i /></div>

      <aside className="context-rail" aria-label={`${chapter.title}章节讲解`}>
        <div className="context-top">
          <span>章节讲解 · READING</span>
          <strong>{chapter.number} / 09</strong>
        </div>
        <div className="context-scroll" ref={contextScrollRef}>
          <article className="knowledge-article">
            <header>
              <span className="overline">{chapter.english.toUpperCase()}</span>
              <h2>{chapter.title}</h2>
              <p className="knowledge-lead">{guide.lead}</p>
            </header>
            {guide.sections.map((section, index) => (
              <section key={section.title}>
                <span className="section-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{section.title}</h3>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.note && <blockquote><span>听觉提示</span><p>{section.note}</p></blockquote>}
              </section>
            ))}
            <section className="glossary-section">
              <span className="section-index">TERM</span>
              <h3>本章术语</h3>
              <dl className="glossary">
                {guide.terms.map((item) => <div key={item.english}><dt>{item.term}<small>{item.english}</small></dt><dd>{item.meaning}</dd></div>)}
              </dl>
            </section>
            <footer className="takeaway"><span>带走一句话</span><p>{guide.takeaway}</p></footer>
          </article>
        </div>
        <nav className="lesson-nav" aria-label="章节切换">
          <button onClick={() => adjacent(-1)} disabled={activeIndex === 0} aria-label="上一章"><ArrowLeft size={18} /></button>
          <span>{activeIndex + 1} / {chapters.length}</span>
          <button onClick={() => adjacent(1)} disabled={activeIndex === chapters.length - 1} aria-label="下一章"><ArrowRight size={18} /></button>
        </nav>
      </aside>
      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="关闭课程目录" />}
      {completionNotice && <div className="completion-toast" role="status"><Check size={17} strokeWidth={1.6} /><span>{completionNotice}</span></div>}
    </div>
  );
}

export default App;
