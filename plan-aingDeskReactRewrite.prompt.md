# Plan: AingDesk Electron+React 1:1 重写

将 AingDesk 从 **Electron(ElectronEgg) + Vue 3 + Naive UI** 技术栈，1:1 迁移到 **Electron + React 18 + Ant Design** 技术栈。Electron 主进程代码（controller/service/rag/search/mcp）基本复用，仅解耦 ElectronEgg 框架；前端渲染进程从 Vue 3 完全重写为 React。**分 7 个阶段，每阶段可独立验证**。
**特殊要求**用户是electron新手，计划中会包含大量细节指导和代码示例，确保每一步都清晰可执行。他希望你在Agent模式下不主动写入文件，除非他明确要求你这么做。只给出文件代码或者操作步骤，让用户手动修改文件，这样用户才会真正理解每一步的改动内容和原因。当每个阶段完成后，用户会要求进行验证，确保功能正常后才进入下一阶段。请严格按照这个流程进行，不要跳过任何步骤。

---

### 项目规模统计

| 类别                | 数量   |
| ------------------- | ------ |
| Vue 组件 (.vue)     | 65 个  |
| Pinia Stores        | 13 个  |
| 前端 Controller     | 12 个  |
| 后端 IPC Controller | 9 个   |
| 后端 Service        | 11 个  |
| DTO 类型定义        | 20+ 个 |
| Agent 预设配置      | 48 个  |

---

### NPM 包清单

**根项目 (Electron Main) 变更**:
| 操作 | 包名 | 说明 |
|------|------|------|
| **移除** | `ee-core` | ElectronEgg 框架 |
| **移除** | `ee-bin` | ElectronEgg 构建工具 |
| **新增** | `electron-vite@^2.x` | Electron + Vite 统一构建 |
| **保留** | `electron-builder@^25.x` | 打包工具 |
| **保留** | 所有 `service/` 层依赖 | ollama, openai, @modelcontextprotocol/sdk, @lancedb/lancedb, cheerio, pdfjs-dist, etc. |

**前端 (Renderer) 依赖**:

| 分类           | 包名                                                                        | 替代来源                |
| -------------- | --------------------------------------------------------------------------- | ----------------------- |
| **核心**       | `react@^18.3`, `react-dom@^18.3`, `@types/react`, `@types/react-dom`        | 替代 vue                |
| **路由**       | `react-router-dom@^6.x`                                                     | 替代 vue-router         |
| **状态管理**   | `zustand@^5.x`                                                              | 替代 pinia              |
| **UI 库**      | `antd@^5.x`, `@ant-design/icons@^5.x`                                       | 替代 naive-ui           |
| **样式**       | `unocss@^65.x`, `sass@^1.x`                                                 | 保留                    |
| **Markdown**   | `markdown-it@^14.x`, `highlight.js@^11.x`, `mermaid@^11.x`, `katex@^0.16.x` | 保留                    |
| **通信**       | `axios@^1.x`, `socket.io-client@^4.x`                                       | 保留                    |
| **国际化**     | `react-i18next@^15.x`, `i18next@^24.x`                                      | 替代 vue-i18n           |
| **Hooks 工具** | `ahooks@^3.x`                                                               | 替代 @vueuse/core       |
| **Emoji**      | `@emoji-mart/react@^1.x`                                                    | 替代 vue3-emoji-picker  |
| **构建**       | `vite@^6.x`, `@vitejs/plugin-react@^4.x`, `typescript@^5.x`                 | 替代 @vitejs/plugin-vue |

---

### Phase 0: 项目初始化 & GitHub 仓库

**目标**: 使用 `electron-vite` 创建项目骨架，推送到 GitHub

**步骤**:

1. GitHub 创建仓库 → `npm create @electron-vite@latest AingDesk-React -- --template react-ts`
2. 配置目标目录结构:
   ```
   AingDesk-React/
   ├── electron.vite.config.ts
   ├── src/
   │   ├── main/           # Electron 主进程
   │   ├── preload/         # 预加载脚本
   │   └── renderer/        # React 前端
   │       └── src/
   │           ├── App.tsx, main.tsx
   │           ├── api/、stores/、hooks/、pages/、types/、utils/、i18n/、assets/
   ├── build/              # 复制原 build/ 资源（icons、agent JSON、languages 等）
   └── resources/
   ```
3. 安装全部 NPM 包（见上方清单）
4. 配置 UnoCSS、TypeScript、ESLint、Prettier、electron-builder
5. 首次 `git push`

**处理文件**: `package.json`, `electron.vite.config.ts`, `tsconfig.*.json`, `.eslintrc`, `.gitignore`, 复制 `build/` 目录

**验证**: `npm run dev` 启动空白 Electron + React 窗口

---

### Phase 1: Electron 主进程迁移 _(阻塞后续所有阶段)_

**目标**: 将 Electron 主进程从 ElectronEgg 解耦为原生 Electron API
**特殊要求**： Agent模式

**步骤**:

1. **重写入口** `src/main/index.ts` — 用原生 `app`, `BrowserWindow`, `ipcMain` 替代 `new ElectronEgg()` + `app.register()`
2. **重写 preload** `src/preload/index.ts` — 合并原 `bridge.ts`（已是原生 contextBridge）+ `lifecycle.ts`（窗口事件） + `index.ts`（服务初始化）
3. **迁移 9 个 Controller** — 每个控制器的方法用 `ipcMain.handle('channel', handler)` 注册:
   - 原 `controller/index.ts` → `ipcMain.handle('index:get_version', ...)` 等
   - 原 `controller/chat.ts` → `ipcMain.handle('chat:get_chat_list', ...)` 等
   - 原 `controller/model.ts` + `controller/manager.ts` → model 相关路由
   - agent、rag、mcp、search、share、os 各控制器同理
4. **内建 HTTP/Socket 服务器**: 替换 ElectronEgg 内建服务器，用 `express` + `socket.io` 在端口 7071/7070 创建（或改为纯 IPC）
5. **原样复制服务层**（无框架依赖）: `service/*`, `rag/*`, `search_engines/*`, `model_engines/*`, `class/public.ts`, `class/menu.ts`

**处理文件**:
| 操作 | 文件 |
|------|------|
| 重写 | `src/main/index.ts`（入口） |
| 重写 | `src/preload/index.ts`（bridge + lifecycle） |
| 适配迁移 | 9 个 controller → `src/main/controller/*.ts` |
| 原样复制 | 11 个 service → `src/main/service/*.ts` |
| 原样复制 | `rag/`、`search_engines/`、`model_engines/`、`class/` |
| 适配 | `config/*.ts` → `src/main/config.ts` |

**验证**: Electron 启动无报错、IPC 双向通信正常、Ollama 检测正常、配置读写正常

---

### Phase 2: 前端基础设施 & 布局框架 _(依赖 Phase 1)_

**目标**: 搭建 React 前端基础架构 + 主三栏布局

**步骤**:

1. **API 层**: 迁移 Axios 实例 + 拦截器 → `src/renderer/src/api/index.ts`
2. **类型定义**: 原样复制 20+ TypeScript 类型 → `types/index.ts`
3. **工具函数**: 迁移 `storage.ts`、`tools.ts`（纯 JS，无修改）
4. **国际化**: 配置 `react-i18next`，迁移翻译文件
5. **主题系统**: Ant Design `ConfigProvider` + `theme` 替代 Naive UI 的 `NConfigProvider`，迁移明暗切换逻辑
6. **全局 Store**: Zustand 重写 `global.ts`
7. **路由**: React Router 配置（单路由 `/` → Home）
8. **App.tsx**: `ConfigProvider` + `RouterProvider` 包裹
9. **Home 主布局**: Ant Design `Layout`（Sider + Header + Content）三栏

**处理文件** (12 个新文件):

- `api/index.ts`, `api/socket.ts`
- `types/index.ts`
- `utils/storage.ts`, `utils/tools.ts`
- `i18n/index.ts` + 翻译文件
- `assets/theme.ts`, `assets/base.scss`
- `stores/global.ts`
- `router/index.tsx`
- `App.tsx`
- `pages/Home/index.tsx`, `pages/Home/store.ts`, `pages/Home/Welcome.tsx`

**验证**: 三栏布局骨架显示、主题切换、国际化切换、API 到达主进程

---

### Phase 3: 侧边栏 & 对话管理 _(依赖 Phase 2)_

**目标**: 侧边栏（对话列表、知识库列表）+ 对话 CRUD

**Vue 组件 → React 组件映射** (7 个):
| 原始 Vue 文件 | React 文件 |
|---------------|-----------|
| `Sider/index.vue` | `pages/Sider/index.tsx` |
| `Sider/components/ChatList.vue` | `pages/Sider/ChatList.tsx` |
| `Sider/components/KnowledgeList.vue` | `pages/Sider/KnowledgeList.tsx` |
| `Sider/components/SiderBottom.vue` | `pages/Sider/SiderBottom.tsx` |
| `Sider/components/RemoveChatConfirm.vue` | `pages/Sider/RemoveChatConfirm.tsx` |
| `Sider/components/ModifyChatConfirm.vue` | `pages/Sider/ModifyChatConfirm.tsx` |
| `Sider/components/CleanChatsList.vue` | `pages/Sider/CleanChatsList.tsx` |

- `pages/Sider/store.ts`（Zustand）、`pages/Sider/controller.ts`

**验证**: 创建/删除/重命名对话、侧边栏折叠/展开

---

### Phase 4: 聊天核心功能 _(依赖 Phase 3, 最复杂阶段)_

**目标**: 消息显示、流式回答、Markdown/Mermaid/KaTeX 渲染、问题输入

**Vue 组件 → React 组件映射** (20 个):

| 模块            | 原始                                        | React                                  | 备注                   |
| --------------- | ------------------------------------------- | -------------------------------------- | ---------------------- |
| **Header**      | `Header/index.vue`                          | `pages/Header/index.tsx`               |                        |
|                 | `Header/components/ModelList.vue`           | `pages/Header/ModelList.tsx`           |                        |
|                 | `Header/components/ChooseModel.vue`         | `pages/Header/ChooseModel.tsx`         |                        |
|                 | `Header/components/Share.vue`               | `pages/Header/Share.tsx`               |                        |
| **ChatContent** | `ChatContent/index.vue`                     | `pages/ChatContent/index.tsx`          | 消息列表               |
| **ChatWelcome** | `ChatWelcome/index.vue`                     | `pages/ChatWelcome/index.tsx`          |                        |
|                 | `ChatWelcome/components/WelcomeContent.vue` | `pages/ChatWelcome/WelcomeContent.tsx` |                        |
| **Answer**      | `Answer/index.vue`                          | `pages/Answer/index.tsx`               | **核心**               |
|                 | `Answer/components/MarkdownRender.vue`      | `pages/Answer/MarkdownRender.tsx`      | markdown-it 注入 React |
|                 | `Answer/components/MermaidRender.vue`       | `pages/Answer/MermaidRender.tsx`       |                        |
|                 | `Answer/components/ThinkWrapper.vue`        | `pages/Answer/ThinkWrapper.tsx`        | 思考过程折叠           |
|                 | `Answer/components/McpToolsWrapper.vue`     | `pages/Answer/McpToolsWrapper.tsx`     | MCP 工具展示           |
|                 | `Answer/components/MarkdownTools.vue`       | `pages/Answer/MarkdownTools.tsx`       |                        |
|                 | `Answer/components/AnswerTools.vue`         | `pages/Answer/AnswerTools.tsx`         |                        |
| **Question**    | `Question/index.vue`                        | `pages/Question/index.tsx`             |                        |
| **ChatTools**   | `ChatTools/index.vue`                       | `pages/ChatTools/index.tsx`            | 输入工具栏             |
|                 | `ChatTools/components/FileList.vue`         | `pages/ChatTools/FileList.tsx`         |                        |
|                 | `ChatTools/components/ToolsChoosePanel.vue` | `pages/ChatTools/ToolsChoosePanel.tsx` |                        |

- 6 个 store 文件 + 6 个 controller 文件

**验证**: 选模型 → 发消息 → 流式回答 → Markdown/代码高亮/Mermaid/KaTeX 全正常、MCP 工具展示、文件上传、联网搜索

---

### Phase 5: 功能面板模块 _(可与 Phase 4 并行)_

**5 个子模块可独立并行开发**:

| 子模块                 | Vue组件数 | React文件数      | 关键功能                        |
| ---------------------- | --------- | ---------------- | ------------------------------- |
| **5a. Agent**          | 5         | 5 + store + ctrl | 创建/编辑/删除智能体，48 个预设 |
| **5b. KnowledgeStore** | 9         | 9 + store + ctrl | 创建知识库、上传文档、解析进度  |
| **5c. Settings**       | 6         | 6 + store + ctrl | 模型安装/删除/进度              |
| **5d. SoftSettings**   | 8         | 8 + store + ctrl | 主题/语言/MCP 服务器配置        |
| **5e. ThirdPartyApi**  | 8         | 8 + store + ctrl | API 供应商/模型管理             |

共 36 个 Vue 组件 → 36 个 TSX + 5 个 store + 5 个 controller

---

### Phase 6: 打包构建 & GitHub 发布 _(依赖所有前序阶段)_

**步骤**:

1. 配置 electron-builder 多平台打包（NSIS/DMG/DEB）
2. 复制 `build/script/installer.nsh` 自定义安装脚本
3. 配置 electron-updater 自动更新
4. 编写 README.md 中英文
5. （可选）配置 GitHub Actions CI/CD
6. 全功能回归测试
7. 推送最终代码

**验证**: `npm run build:win` 生成安装包、安装后全部功能正常

---

### Naive UI → Ant Design 组件映射速查

| Naive UI                       | Ant Design                    |
| ------------------------------ | ----------------------------- |
| `NLayout/Sider/Header/Content` | `Layout/Sider/Header/Content` |
| `NButton`                      | `Button`                      |
| `NInput`                       | `Input`                       |
| `NModal`                       | `Modal`                       |
| `NSelect`                      | `Select`                      |
| `NSwitch`                      | `Switch`                      |
| `NForm/NFormItem`              | `Form/Form.Item`              |
| `NCard`                        | `Card`                        |
| `NTabs/NTabPane`               | `Tabs`                        |
| `NUpload`                      | `Upload`                      |
| `NProgress`                    | `Progress`                    |
| `NTooltip`                     | `Tooltip`                     |
| `NDropdown`                    | `Dropdown`                    |
| `NTag`                         | `Tag`                         |
| `NMessage`                     | `message` (静态方法)          |
| `NConfigProvider`              | `ConfigProvider`              |
| `NEmpty`                       | `Empty`                       |
| `NCollapse`                    | `Collapse`                    |
| `NSpin`                        | `Spin`                        |
| `NPopover`                     | `Popover`                     |

---

### 决策记录

- **Zustand** > Redux Toolkit：API 与 Pinia 相似、轻量、无 boilerplate
- **Ant Design** > MUI/shadcn：组件与 Naive UI 对应明确、中文生态成熟
- **electron-vite**：官方推荐的 Electron + Vite 集成方案
- **Electron 后端服务层原样复制**：service/rag/search/mcp 无框架耦合，改动极小
- **范围**：1:1 功能重写，不新增功能，不重构业务逻辑
- **排除**：Go 模块、Python 模块、Chrome 扩展
