# 声音图谱 · Sonic Atlas

一套面向音乐初学者的纯前端互动音乐素养课程。课程通过 Web Audio 实时合成声音，让音高、音程、音阶、和弦、调性、节奏、旋律和基础记谱可以被直接操作与比较。

## 运行

```bash
npm install
npm run dev
```

生产检查：

```bash
npm run check
npm run build
```

## 当前范围

- 10 个互动章节（编号 0–9）。
- 原生 Web Audio 合成，不依赖音频素材或后端 API。
- 最终创作器支持调性中心、大小调、速度、节奏、和弦、旋律与分轨静音。
- 学习访问、行为掌握进度和作品保存在浏览器 `localStorage`。
- 桌面三轨工作台与移动端单列响应式布局。

课程与产品定义位于 [`docs/PRD.md`](docs/PRD.md)，实现级课程规格位于 [`docs/COURSE_SPEC.md`](docs/COURSE_SPEC.md)。
