# 交互模型

## 1. 应用状态

应用不依赖后端。学习进度、音量偏好和最后作品存入 `localStorage`，课程定义保持为静态 TypeScript 数据。

```ts
type LessonStatus = "unseen" | "exploring" | "viewed" | "mastered";

interface LearningState {
  activeChapterId: string;
  activeStepId: string;
  progress: Record<string, LessonStatus>;
  audioEnabled: boolean;
  masterVolume: number;
}
```

## 2. 音频引擎

共享音频引擎使用 Web Audio API，首次用户手势后创建或恢复 `AudioContext`。所有组件通过音名或频率请求声音，不直接管理音频上下文。

- 单音：短 attack、柔和 release 的振荡器与低通滤波。
- 和弦：3 到 4 个音分散进入，限制总增益避免削波。
- 节奏：合成 kick、click 与 noise，不依赖版权素材。
- 调度：循环播放使用提前调度，不以视觉计时器决定声音时刻。

## 3. 核心组件契约

### Keyboard

输入：音域、可用音、标记音、选择模式。输出：`noteOn`、`noteOff`、`selectionChange`。键盘操作支持方向键移动、空格播放。

### PitchField

输入：频率范围和当前频率。输出：连续频率与吸附后的音名。拖动是主要动作，同时提供滑杆作为无障碍替代。

### RhythmGrid

输入：步数、BPM、轨道和重音。输出：网格变化与播放位置。每格为不小于 44px 的按钮。

### MelodyGrid

输入：调式音集、小节数、量化精度。输出：音符数组。点击放置/删除，键盘操作与可见播放头并行。

### MiniComposer

状态由 `tempo`、`root`、`scale`、`drums`、`chords`、`melody`、`mutedTracks` 组成。播放、暂停、清空和随机示例必须可逆；作品持续保存。

## 4. 导航

- 桌面端：左侧课程轨道，中间实验场，右侧认知说明。
- 移动端：顶部章节入口，实验优先，说明紧跟在实验后；不使用隐藏关键操作的抽屉。
- URL 使用 hash 深链到章节，例如 `#/chapter/pitch`。
- 切换章节保留各实验的本地状态。

## 5. 响应与无障碍

- 所有图标按钮具备可见 tooltip 与 `aria-label`。
- 焦点样式使用 2px 高对比外环，不能移除浏览器可见性而不替代。
- 动效只改变 `transform` 与 `opacity`；遵循 `prefers-reduced-motion`。
- 触控目标至少 44x44px，正文移动端不小于 16px。
- 声音反馈同时由波形、按键状态和文字说明表达。

