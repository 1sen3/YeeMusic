feat(lyric): 使用自定义 MeshGradient 背景替代第三方库，图标迁移至 SF Symbols

- feat(lyric): 基于 Three.js 实现自定义 MeshGradientBackground 组件，替换
  @paper-design/shaders-react 的 MeshGradient，使用 simplex noise shader 实现
  动态渐变动画，支持根据播放状态控制动画速度
- feat(lyric): 新增 color-extractor 工具，从封面图片提取 5 色调色板用于背景渐变
- feat(lyric): 歌词页封面尺寸增大至 size-78 并增加圆角和边框装饰
- feat(setting): Mica 材质切换时增加系统主题匹配提示 toast
- feat(window): 窗口特效新增 micaLight / micaDark 支持
- refactor(icons): 播放控制图标从 Fluent Icons 迁移至 SF Symbols
  (play/pause/next/prev/shuffle/repeat)，包括 playerbar 与歌词页
- refactor(mediaSession): initMediaSession 返回 cleanup 函数，在 App 组件
  useEffect 中正确清理订阅和事件监听
- style(lyric): 歌词页滑块和音量条使用 mix-blend-plus-lighter 混合模式，
  降低时间/音量文本亮度至 white/40，优化视觉层次
- style(lyric): 歌词页标题栏改为 position:absolute 悬浮定位，内容区移除多余内边距
- style(lyric): 逐字歌词渐变方向从 100deg 调整为 90deg
- style(home): SongPreview 操作按钮改用 YeeButton 组件并添加圆角
- style(artist): 歌手简介内容支持文本选择
- style(titlebar): 标题栏字体改为微软雅黑 13px
- style(sidebar): 侧边栏滚动区域使用 overflow-overlay 替代 no-scrollbar
- style(css): 新增 overflow-overlay 系列工具类，新增 ::selection 全局样式
- style(ui): button.tsx 代码格式化（分号/换行）
- style(css): ChromaGrid.css 代码缩进统一
- deps: 新增 three / @react-three/fiber / @types/three 依赖
