# Yee Music UI 规范

本文档用于约束 Yee Music 的界面设计与前端实现。目标不是完全复刻 WinUI 3，而是在 Tauri + React + Tailwind 的技术栈下，保持稳定的 Windows 原生感，同时保留音乐播放器需要的动态、封面与歌词表达。

## 1. 设计定位

Yee Music 的 UI 方向是：

- **Windows 原生感**：窗口结构、标题栏、导航、弹窗、菜单、输入控件、滚动条与焦点反馈应优先靠近 Fluent / WinUI 3。
- **音乐应用表达**：封面、歌词、播放器、每日推荐、艺人页等内容区域可以更有情绪，但不能破坏整体操作秩序。
- **轻量、清晰、可重复使用**：常用样式必须沉淀为 token、基础组件或页面模板，避免每个页面重新发明一套圆角、阴影、间距和 hover。

判断一个界面是否合格，可以看三件事：

1. 是否能一眼分辨窗口区域、导航区域、内容区域和播放区域。
2. 同类控件在不同页面是否有一致的尺寸、圆角、状态和动效。
3. 装饰性效果是否服务内容，而不是抢走内容层级。

## 2. 项目当前基线

项目当前 UI 基础来自这些文件：

- 全局 token 与基础样式：`src/index.css`
- 根布局：`src/layouts/RootLayout.tsx`
- 标题栏：`src/components/titlebar/titlebar.tsx`
- 侧边栏：`src/components/app-sidebar.tsx`、`src/components/ui/sidebar.tsx`
- 播放器栏：`src/components/playerbar/playerbar.tsx`
- 基础控件：`src/components/ui/*`
- 项目自定义控件：`src/components/yee-button.tsx`、`src/components/yee-popover.tsx`、`src/components/yee-dialog.tsx`

后续 UI 调整应优先改这些基础层，而不是在页面里堆叠大量一次性 class。

## 3. 全局 Token

### 3.1 颜色

颜色必须优先使用语义 token：

- 背景：`bg-background`、`bg-main-background`
- 文字：`text-foreground`、`text-muted-foreground`
- 表面：`bg-card`、`bg-popover`
- 强调色：`bg-primary`、`text-primary`
- 边框：`border-border`
- 危险操作：`bg-destructive`、`text-destructive`

避免在业务组件中直接写新的品牌色或大量透明黑白色，例如 `bg-black/5`、`bg-white/10`、`text-black/40`。如果某种透明色反复出现，应提取为 token 或组件变体。

允许例外：

- 封面 hover 遮罩可使用 `bg-black/50`。
- 歌词页、沉浸页可根据封面色或背景动态生成颜色。
- 窗口控制按钮的关闭 hover 可使用危险色。

### 3.2 材质

Yee Music 支持 `none`、`acrylic`、`mica` 三类窗口材质。材质规范如下：

- **Mica**：用于主窗口背板。主内容区应保持较安静的 `bg-main-background`，不要在内容区域重复叠加大面积模糊。
- **Acrylic**：用于半透明窗口或需要更明显背景透出的场景。控件仍应保持足够对比度。
- **Popover / ContextMenu / Dialog**：可使用 `bg-card/80 backdrop-blur-md border border-border`，但应通过组件统一，不要在页面内反复手写。
- **Sticky 工具栏**：可使用 `BlurLayer` 或统一的 sticky surface 样式，透明度和 blur 强度保持克制。

### 3.3 字体

界面字体以 `--app-font-family` 为准，默认在 `src/index.css` 中定义。

规范：

- 页面与控件不得随意硬编码字体。
- 歌词、每日推荐等特殊内容可以使用独立字体，但必须限制在局部内容表达中。
- 字体大小不要随视口宽度缩放。
- 字重优先使用 `font-normal`、`font-medium`、`font-semibold`，不要过度使用 `font-bold`。

推荐字号：

| 用途 | Tailwind |
| --- | --- |
| 辅助说明、标签 | `text-xs` |
| 常规正文、列表行 | `text-sm` |
| 控件文字 | `text-sm font-medium` |
| 区块标题 | `text-base` 或 `text-sm font-semibold` |
| 页面标题 | `text-2xl font-semibold` |
| 沉浸式标题 | `text-3xl font-semibold` |

### 3.4 间距

项目应使用 4px 网格。常用间距如下：

| 用途 | Tailwind |
| --- | --- |
| 紧密控件间距 | `gap-1`、`gap-2` |
| 普通控件间距 | `gap-3`、`gap-4` |
| 页面内区块间距 | `gap-8`、`gap-12` |
| 页面边距 | `px-8 py-8` |
| 列表行内边距 | `px-4 py-3` |
| 菜单 / 弹层内边距 | `p-2` |
| 设置卡片内边距 | `p-4` |

页面级边距优先保持 `px-8 py-8`。如果详情页顶部需要沉浸式封面，可以局部突破，但内容列表仍应回到同一左右边距。

### 3.5 圆角

圆角应按控件类型固定，不要只凭感觉选择。

| 场景 | 推荐 |
| --- | --- |
| 列表行、菜单项、普通 hover 面 | `rounded-sm` |
| 输入框、小卡片、封面缩略图 | `rounded-md` |
| 弹窗、Popover、普通 Card | `rounded-lg` |
| 圆形图标按钮、播放按钮、头像 | `rounded-full` |
| 专辑 / 歌单封面 | `rounded-md` 或 `rounded-lg`，同一列表中必须一致 |

避免在同一页面中混用 `rounded-sm`、`rounded-md`、`rounded-lg` 表示同类元素。

### 3.6 边框与阴影

WinUI 风格应偏向边框、层级和材质，而不是重阴影。

推荐：

- 普通容器：`border border-border`
- 悬浮面：`border border-border yee-drop-shadow`
- 封面：允许 `drop-shadow-md`，详情页主封面允许更重阴影
- 播放器主栏：`border-t`

避免：

- 在普通列表行上使用明显阴影。
- 在设置项、菜单项、普通按钮上使用大面积 `drop-shadow-xl`。
- 在同一个层级同时使用重阴影和强背景透明。

## 4. 窗口结构

主窗口结构固定为：

1. 标题栏，当前高度为 `48px`，对应 `--titlebar-h`。
2. 左侧导航栏。
3. 主内容区域，使用 `bg-main-background`，左上角可保留窗口内圆角。
4. 底部播放器栏，当前高度为 `80px`。

规范：

- 标题栏负责拖拽、窗口按钮、全局搜索、返回、刷新和用户入口。
- 侧边栏只放主导航与稳定入口，不放页面临时操作。
- 页面级操作放在页面 header 或 sticky command bar。
- 播放器栏始终固定在底部，不应被页面内容滚动遮挡。
- 主内容区滚动由 `#main-scroll-container` 管理，页面内部不要随意创建第二层纵向主滚动。

## 5. 标题栏

标题栏规范：

- 高度固定为 `h-12`。
- 窗口控制按钮尺寸固定为 `size-12`，圆角只在窗口右上角关闭按钮上体现。
- 返回、刷新、用户头像等普通操作按钮使用 `size-8`。
- 标题栏空白区域可拖拽，控件内部必须阻止拖拽事件。
- 搜索框居中，不应随左右控件变化产生明显跳动。
- 标题栏中不要放页面级筛选、排序、播放等动作。

窗口按钮：

- 最小化、最大化使用普通 hover。
- 关闭按钮 hover 使用 `bg-destructive text-white`。
- 图标优先使用 Fluent 图标，保持 Windows 语义。

## 6. 侧边栏

侧边栏是应用主导航，不是普通菜单。

规范：

- 侧边栏宽度应在 `src/components/ui/sidebar.tsx` 中统一定义。
- 导航项激活态使用左侧 primary 指示条。
- 激活项可以隐藏文字，仅保留图标和指示，但所有导航项行为必须一致。
- hover 使用 `bg-sidebar-accent` 或 `hover:bg-foreground/5` 的统一变体。
- 不要在业务页面里直接修改侧边栏按钮尺寸。
- 展开 / 折叠逻辑只能在 `SidebarProvider` 和相关组件中维护。

图标：

- 主导航使用 Fluent regular / filled 成对图标。
- 当前页面使用 filled 图标和 `text-primary`。
- 未激活页面使用 regular 图标。

## 7. 播放器栏

播放器栏是全局控制区，优先保证稳定与可扫读。

布局：

- 高度固定为 `h-20`。
- 三列结构保持：歌曲信息、播放控制、附加操作。
- 进度条附着在播放器栏边缘，不额外占用布局高度。

按钮：

- 播放、上一首、下一首、随机、循环等核心按钮使用 `YeeButton`。
- 普通图标按钮不要放大到破坏播放器栏垂直节奏。
- 禁用状态必须可见，不只依赖点击无反应。

封面：

- 当前歌曲封面尺寸保持 `48px`。
- 无封面时使用统一音乐图标占位。
- hover 展开歌词页时可出现遮罩和图标，但动画时长应保持在 150ms 到 300ms。

## 8. 页面模板

### 8.1 常规页面

适用于首页、设置页、搜索页、列表页。

推荐结构：

```tsx
<div className="w-full min-h-full px-8 py-8 flex flex-col gap-8">
  ...
</div>
```

规范：

- 页面边距统一 `px-8 py-8`。
- 页面内主区块使用 `gap-8` 或 `gap-12`。
- 不要在页面最外层使用 `h-full` 强行撑满，除非页面确实需要固定布局。

### 8.2 详情页

适用于歌单、专辑、艺人。

结构：

- 顶部 header 展示封面 / 艺人图、标题、元信息。
- 中部 command bar 放播放、收藏、编辑、搜索、排序等动作。
- 下方内容列表保持统一左右边距。

规范：

- 歌单与专辑封面尺寸保持一致，当前建议 `w-44 h-44`。
- 艺人页可使用沉浸式大图，但正文区域必须回到标准边距。
- sticky command bar 需要有足够背景或 blur，不能让文字和下方列表重叠。

### 8.3 设置页

设置页使用“分组标题 + 设置项”的结构。

规范：

- 分组标题使用 `text-sm font-bold` 或后续统一的 setting section title 组件。
- 设置项使用 `SettingsExpandar`。
- 设置项主卡片使用 `bg-card border rounded-sm p-4`。
- 展开详情使用同宽容器，避免出现视觉断层。
- 右侧 trailing 控件尺寸和样式必须一致。

## 9. 列表与表格

歌曲列表、下载列表、本地音乐列表应统一行为。

规范：

- 列表行使用 `px-4 py-3`。
- hover 使用 `hover:bg-foreground/8` 或统一 list item variant。
- 斑马纹如需使用，应固定为偶数行 `bg-foreground/5`。
- 当前播放项必须有独立状态，不只依赖 hover。
- 行操作按钮默认可弱化，hover 后增强。
- 歌名、艺人、专辑必须 `line-clamp-1`，禁止撑开列宽。
- 时间、状态、更多按钮等尾部列宽应固定。

推荐把歌曲列表行样式沉淀到 `SongListItem`，其他列表尽量复用同一视觉规则。

## 10. 卡片与封面

音乐内容卡片主要展示封面和标题。

规范：

- 歌单 / 专辑卡片封面比例保持 1:1。
- 同一横向列表内卡片宽度必须一致。
- 封面 hover 可以出现播放按钮和暗色遮罩。
- 标题最多两行，使用 `line-clamp-2`。
- 卡片之间使用内容间距，不用外层大卡片包裹一组卡片。

避免：

- 对同一类型封面混用圆形、`rounded-md` 和 `rounded-lg`。
- 标题因为 hover 或按钮出现导致布局跳动。

## 11. 控件规范

### 11.1 Button

`src/components/ui/button.tsx` 是通用按钮基础。

使用场景：

- 表单提交。
- 弹窗按钮。
- 普通工具按钮。
- shadcn/Radix 组合控件触发器。

规范：

- 默认高度为 `h-8`。
- 图标按钮使用 `size="icon"`，默认 `size-8`。
- 普通按钮文字使用 `text-sm font-medium`。
- 不要在业务组件中随意覆盖 `focus`、`border`、`ring`，必要时新增 variant。

### 11.2 YeeButton

`src/components/yee-button.tsx` 是音乐播放器和强调型图标按钮。

使用场景：

- 播放、暂停、上一首、下一首。
- 歌单详情页的播放、收藏、编辑等主要圆形动作。
- 音乐强相关的图标动作。

规范：

- `outline` 用于圆形浮起按钮。
- `ghost` 用于轻量图标按钮。
- hover / tap 动效应保持轻盈。普通 UI 不应滥用 `scale: 1.1`。
- 如果未来需要更接近 WinUI，应考虑将普通 hover scale 降低或只保留 tap scale。

### 11.3 Input

输入框规范：

- 默认高度使用 `h-8` 或搜索场景的 `h-9`。
- 搜索框可以使用圆形，但普通表单输入保持 `rounded-sm` 或基础组件默认值。
- 输入框 focus 应显示底部 primary indicator 或统一 ring，不要完全无反馈。
- 不要让 placeholder 作为唯一标签。

### 11.4 Popover / Menu

规范：

- 弹层宽度应可预测，常规菜单不小于 `w-48`。
- 背景、模糊、边框、阴影必须通过 `Popover`、`DropdownMenu`、`ContextMenu` 组件统一。
- 菜单项高度、图标大小、文字大小保持一致。
- 子菜单必须靠近父项，避免跨越过大距离。

### 11.5 Dialog

规范：

- Dialog 用于需要确认、登录、编辑等阻塞任务。
- 主要操作放右侧或底部主要位置，危险操作使用 destructive。
- Dialog 内不要堆叠卡片。
- 关闭按钮、确认按钮、取消按钮样式应来自 `yee-dialog` 或统一组件。

## 12. 图标规范

当前项目存在 Fluent UI Icons、Lucide、SF Symbols、Tabler 混用。为了保持一致：

- **业务 UI 首选 Fluent UI Icons**。
- **播放控制可继续使用 SF Symbols**，因为播放器区域已经形成独立语义。
- **shadcn 基础组件内部图标可以保留 Lucide / Tabler**，但不要在业务页面新增依赖。
- 同一个控件组不要混用不同图标风格。
- 导航项使用 regular / filled 成对图标。
- 图标尺寸以 `size-4`、`size-5` 为主，窗口按钮可用 `size-4`。

新增图标前先确认 `@fluentui/react-icons` 是否已有对应图标。

## 13. 动效规范

动效应表达“响应”和“流畅”，不要表达“炫技”。

推荐：

- 普通 hover / color：150ms 到 200ms。
- 弹层打开：100ms 到 150ms。
- 页面局部布局动画：200ms 到 300ms。
- 播放器、歌词、封面可使用 spring，但不要影响阅读。

避免：

- 普通按钮 hover 大幅缩放。
- 列表行 hover 触发布局尺寸变化。
- 页面切换时大面积内容长距离滑动。
- 同一屏幕多个区域同时播放强动效。

`framer-motion` 应优先用于：

- 侧边栏激活指示器。
- 播放器按钮反馈。
- 歌词页与封面相关交互。
- 登录、弹窗等短时状态转换。

## 14. 可访问性与交互

规范：

- 所有可点击元素必须是 `button`、`a` 或可访问组件，不要裸 `div` 承担核心交互。
- 图标按钮应有 `aria-label` 或可推断的文本。
- 禁用状态必须有视觉反馈。
- 文本选择只在歌词、标题、说明等内容区域开放，导航和播放器可保持 `select-none`。
- 右键菜单不能阻止输入框、文本选择等必要系统行为。
- 键盘焦点样式不能全局彻底移除。当前 `:focus { outline: none !important; box-shadow: none !important; }` 后续应改为仅对鼠标点击弱化，对 `focus-visible` 保留反馈。

## 15. 代码落地规则

新增或修改 UI 时按这个顺序决策：

1. 能否使用已有 `components/ui` 组件。
2. 能否使用已有 `yee-*` 自定义组件。
3. 能否给现有组件增加 variant。
4. 是否真的需要页面局部 class。

页面内允许写布局 class，例如 `flex`、`grid`、`gap-4`、`px-8`。页面内不鼓励写控件外观 class，例如复杂的 `bg-card/80 backdrop-blur-md border rounded-lg shadow-lg`。这类外观应进入组件。

新增 UI 代码前检查：

- 是否使用语义颜色 token。
- 是否符合页面模板。
- 同类控件尺寸是否一致。
- hover、active、disabled、loading、empty 状态是否完整。
- 深色模式是否可读。
- Mica / Acrylic / none 三种材质下是否可读。
- 文本是否会溢出或撑开布局。

## 16. 后续建议

优先级从高到低：

1. 把常见表面样式提取为组件或 class，例如 `YeeSurface`、`YeeMenuSurface`、`YeeCommandBar`。
2. 收敛图标库使用，业务组件优先 Fluent。
3. 调整全局 focus 策略，恢复 `focus-visible`。
4. 统一列表行组件，歌曲、下载、本地音乐使用同一套行高、hover、斑马纹和操作按钮规则。
5. 统一详情页 header 与 sticky command bar。
6. 将常用阴影、圆角、透明背景收敛到 token，减少页面内硬编码。

