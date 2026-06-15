# OmniSync - 多平台内容发布工具

> 一次编辑，多端适配，一键发布

很多创作者需要在公众号、知乎、B站、小红书等平台同步发布内容，但格式适配很麻烦。OmniSync 帮助创作者提升发布效率和便捷性。

## 功能特性

- **一次编辑，多端适配**：输入内容后自动适配各平台格式与风格（标题长度、内容格式、图片要求等）
- **一键发布**：支持同时向多个平台发布内容，也可单独发布
- **模拟发布**：开发测试阶段可使用模拟模式，无需真实凭证即可体验完整流程
- **实时预览**：发布前可预览各平台适配后的效果
- **撤回与编辑**：支持撤回已发布内容、编辑后重新发布
- **扩展架构**：基于策略模式（Adapter Pattern），扩展新平台只需新增一个适配器文件

## 技术架构

```
OmniSync/
├── frontend/                # 前端 - Vue3 + Vite + TypeScript
│   ├── src/
│   │   ├── api/             # API 请求层
│   │   ├── components/      # UI 组件
│   │   │   ├── ContentEditor.vue    # 内容编辑器
│   │   │   ├── PlatformSelector.vue # 平台选择器
│   │   │   ├── PreviewPanel.vue     # 适配预览面板
│   │   │   ├── PublishPanel.vue     # 发布面板
│   │   │   └── SettingsPanel.vue    # 凭证设置面板
│   │   ├── styles/          # 全局样式
│   │   ├── types/           # 类型定义
│   │   └── App.vue          # 主应用
│   └── vite.config.ts       # Vite 配置（含 API 代理）
│
└── backend/                 # 后端 - Express + TypeScript
    └── src/
        ├── adapters/        # 平台适配器（策略模式核心）
        │   ├── base.adapter.ts      # 抽象基类
        │   ├── wechat.adapter.ts    # 公众号适配器
        │   ├── zhihu.adapter.ts     # 知乎适配器
        │   ├── bilibili.adapter.ts  # B站适配器
        │   ├── xiaohongshu.adapter.ts # 小红书适配器
        │   └── index.ts            # 适配器注册中心
        ├── routes/           # API 路由
        ├── services/         # 业务逻辑
        ├── types/            # 类型定义
        └── index.ts          # 入口文件
```

## 扩展新平台的架构设计

OmniSync 采用**策略模式（Adapter Pattern）**实现平台扩展，核心设计如下：

### 1. 抽象适配器基类

所有平台适配器继承自 `BaseAdapter`，必须实现以下接口：

```typescript
abstract class BaseAdapter {
  abstract readonly meta: PlatformMeta;    // 平台元信息
  abstract adapt(raw: RawContent): AdaptedContent;  // 格式适配
  abstract publish(content: AdaptedContent): Promise<PublishResult>;  // 发布
  abstract recall(recordId: string): Promise<RecallResult>;           // 撤回
}
```

### 2. 新增平台只需 3 步

**第一步**：创建适配器文件 `backend/src/adapters/xxx.adapter.ts`

```typescript
export class XxxAdapter extends BaseAdapter {
  readonly meta: PlatformMeta = {
    id: Platform.XXX,
    name: '新平台',
    icon: 'xxx',
    maxTitleLength: 100,
    maxContentLength: 50000,
    supportsImages: true,
    supportsVideo: true,
    supportsMarkdown: false,
    formatTips: '支持纯文本，图片不超过9张',
  };

  adapt(raw: RawContent): AdaptedContent {
    // 实现格式适配逻辑：截断标题、转换格式、过滤不支持的媒体等
  }

  async publish(content: AdaptedContent): Promise<PublishResult> {
    // 实现真实发布逻辑（模拟模式下返回模拟数据）
  }

  async recall(recordId: string): Promise<RecallResult> {
    // 实现撤回逻辑
  }
}
```

**第二步**：在枚举中添加平台标识 `backend/src/types/index.ts`

```typescript
enum Platform {
  WECHAT = 'wechat',
  ZHIHU = 'zhihu',
  BILIBILI = 'bilibili',
  XIAOHONGSHU = 'xiaohongshu',
  XXX = 'xxx',  // 新增
}
```

**第三步**：注册适配器 `backend/src/adapters/index.ts`

```typescript
const xxx = new XxxAdapter();
xxx.initConfig();
this.register(xxx);
```

### 3. 架构优势

| 特性 | 说明 |
|------|------|
| **开闭原则** | 新增平台无需修改现有代码，只需新增适配器 |
| **统一接口** | 所有平台遵循相同的 adapt/publish/recall 接口 |
| **自动适配** | `adapt()` 方法自动处理标题截断、格式转换、媒体过滤 |
| **模拟模式** | 基类内置模拟支持，新平台自动获得模拟发布能力 |
| **环境变量配置** | 凭证通过 `XXX_ACCESS_TOKEN` 等环境变量加载，安全便捷 |

## 已支持平台

| 平台 | 格式适配 | 模拟发布 | 真实发布 | 特殊处理 |
|------|---------|---------|---------|---------|
| 📱 公众号 | Markdown → HTML | ✅ | ✅ | 标题64字限制，封面图2.35:1 |
| 💬 知乎 | Markdown 适配 | ✅ | ✅ | 文章/回答格式，支持专栏 |
| 📺 B站 | 纯文本/HTML | ✅ | ✅ | 标题80字限制，支持专栏投稿 |
| 📕 小红书 | Markdown → 纯文本+标签 | ✅ | ✅ | 标题20字限制，图片9张上限，标签提取 |

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 启动开发服务

```bash
# 启动后端（端口 3001）
cd backend
npm run dev

# 启动前端（端口 5173，自动代理到后端）
cd frontend
npm run dev
```

打开浏览器访问 `http://localhost:5173`

### 配置真实发布（可选）

复制后端环境变量模板：

```bash
cd backend
cp .env.example .env
```

编辑 `.env`，填入平台凭证：

```env
LIVE_MODE=true
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_app_secret
WECHAT_ACCESS_TOKEN=your_access_token
```

各平台凭证获取方式请参考应用内的「平台凭证配置」指南。

## 使用流程

1. **选择平台**：在右侧发布面板勾选要发布的平台
2. **编辑内容**：在左侧编辑器输入标题、正文、标签、图片
3. **预览适配**：点击「预览适配」查看各平台适配后的效果
4. **一键发布**：确认无误后点击「一键发布」
5. **查看结果**：发布结果实时显示，支持撤回和编辑重发

## 项目亮点

- **策略模式架构**：扩展新平台零耦合，符合开闭原则
- **双模式运行**：模拟模式方便开发测试，真实模式连接平台API
- **自动格式适配**：根据各平台限制自动截断标题、转换格式、过滤不支持的媒体类型
- **中文友好界面**：全中文界面，含各平台凭证获取指南
- **前后端分离**：Vue3 前端 + Express 后端，Vite 代理转发 API

## License

MIT
