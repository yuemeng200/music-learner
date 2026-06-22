export type Chapter = {
  id: string;
  number: string;
  title: string;
  english: string;
  question: string;
  insight: string;
};

export const chapters: Chapter[] = [
  { id: "sound", number: "00", title: "声音", english: "Organized sound", question: "什么时候，声音开始像音乐？", insight: "重复、对比和层次让声音获得结构。" },
  { id: "pitch", number: "01", title: "音高", english: "Pitch", question: "声音为什么有高有低？", insight: "音高是一条连续的维度，音名只是我们放在上面的坐标。" },
  { id: "interval", number: "02", title: "音程", english: "Interval", question: "两个音之间，藏着什么关系？", insight: "我们听见的不只是两个音，还有它们之间的距离。" },
  { id: "scale", number: "03", title: "音阶", english: "Scale", question: "为什么七个音能形成一个世界？", insight: "音阶是一组经过选择、彼此有倾向的音。" },
  { id: "chord", number: "04", title: "和弦", english: "Chord", question: "几个音同时响起，会发生什么？", insight: "和弦色彩来自多个音程关系的叠加。" },
  { id: "tonality", number: "05", title: "调性", english: "Tonality", question: "为什么有些音像回到了家？", insight: "上下文会建立中心，其他声音围绕它获得方向。" },
  { id: "rhythm", number: "06", title: "节奏", english: "Rhythm", question: "时间怎样变成律动？", insight: "节奏通过间隔、重音和重复组织时间。" },
  { id: "melody", number: "07", title: "旋律", english: "Melody", question: "一串音为什么像一句话？", insight: "方向、停顿、重复与变化让音高成为句子。" },
  { id: "notation", number: "08", title: "记谱", english: "Notation", question: "音乐为什么需要被写下来？", insight: "谱面是音高与时间的地图，不是音乐本身。" },
  { id: "studio", number: "09", title: "合成", english: "Make a piece", question: "现在，把这些关系变成你的音乐。", insight: "创作就是在约束中做一连串可以听见的选择。" },
];
