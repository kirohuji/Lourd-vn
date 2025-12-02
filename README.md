# Pixi'VN 模板 (React + Vite + MUI Joy)

![pixi-vn-cover](https://github.com/user-attachments/assets/c67ea9f4-c91c-46ea-bfbe-6bc0d18b5de7)

这是一个用于在 React 中创建视觉小说的模板。它使用 Pixi'VN 库和 Vite 作为构建工具。
此模板包含受广泛使用的视觉小说引擎 Ren'Py 启发的基本功能。

## 概述

为了测试目的，我们将在本指南中使用 Pixi'VN 重新创建视觉小说 [Breakdown](https://joshpowlison.itch.io/breakdown)。Breakdown 是一个短篇故事，包含了视觉小说应该具备的所有功能。Breakdown 的创作者 Josh Powlison 已授权我们将其叙述用于教育目的❤️。

首先出现的页面是主菜单。从那里，你可以开始游戏、加载已保存的游戏或进入设置。

游戏页面位于 `/narration` 路由。它包含文本框、角色头像和背景图像的画布。文本框显示当前对话的文本。角色头像显示正在说话的角色。背景图像是场景的背景。
当需要做出选择时，选择项会显示在屏幕顶部。

当你在游戏页面时，可以通过位于底部的一系列按钮访问许多功能。在此列表中，你可以保存游戏、加载已保存的游戏、跳过对话、自动播放对话、访问历史记录模态框和访问设置模态框。

历史记录模态框是所有已显示的对话和选择的列表。

设置模态框允许你更改文本速度、进入全屏、编辑主题颜色以及返回主菜单。音频设置尚未添加，也没有管理音频的库，但我建议添加它们。

### 键盘快捷键

* `Space` 或 `Enter`: 继续对话。
* `长按 Space` 或 `长按 Enter`: 跳过对话。
* `Alt` + `S`: 快速保存游戏。
* `Alt` + `L`: 快速加载游戏。
* `Alt` + `H`: 打开历史记录模态框。
* `Esc`: 打开设置模态框。
* `Alt` + `V`: 隐藏 UI（仅显示画布）。

### 使用的库

此模板使用以下库：

核心库：

* [Pixi'VN](https://www.npmjs.com/package/@drincs/pixi-vn): 一个视觉小说库。
* [Pixi'VN - *ink* 集成](https://www.npmjs.com/package/@drincs/pixi-vn-ink): 提供与 *ink* 语言集成的库。
* [Vite](https://vitejs.dev/): 一个构建工具，旨在为现代 Web 项目提供更快、更精简的开发体验。
* [Vite Checker](https://www.npmjs.com/package/vite-plugin-checker): 一个 Vite 插件，在每次构建时检查 TypeScript 类型和 ESLint。
* [PWA Vite Plugin](https://vite-pwa-org.netlify.app): 一个提供 PWA 支持的 Vite 插件。这允许将游戏安装为渐进式 Web 应用。
* [Zustand](https://zustand-demo.pmnd.rs/): 一个小型、快速且可扩展的状态管理库。
* [React Router](https://reactrouter.com/): 为 React 应用程序提供路由的库。
* [Tanstack Query](https://tanstack.com/tanstack-query/): 一个提供用于获取、缓存和更新游戏数据的工具集的库。
  <img width="44" alt="image" src="https://github.com/user-attachments/assets/bf70dddc-68c0-48f4-9c41-74c22f54e3d1">
  你可以使用以下按钮显示 Tanstack Query 与游戏的交互。（该按钮在发布时会自动隐藏）
* [Tailwind CSS](https://tailwindcss.com/): 一个实用优先的 CSS 框架，用于快速构建自定义设计。
  * [Tailwind CSS Motion](https://rombo.co/tailwind/): 一个提供用于使用 Tailwind CSS 创建动画的实用工具集的库。
  * [Tailwind CSS Typography](https://tailwindcss.com/docs/typography-plugin): 一个提供用于样式化文本的实用工具集的插件。

UI 库：

* [Mui Joy](https://mui.com/joy-ui/getting-started/): 一个 React UI 框架，提供用于构建网站的一组组件和样式。
* [Motion](https://motion.dev/): 一个简单而强大的 React 动画库。
* [Notistack](https://iamhosseindhv.com/notistack): 一个为 React 提供 snackbar 通知的库。
* [React Color Palette](https://www.npmjs.com/package/react-color-palette): 一个为 React 提供颜色选择器的库。

文本库：

* [i18next](https://www.i18next.com/): 一个允许在应用程序中管理多种翻译的库。
* [React Markdown](https://www.npmjs.com/package/react-markdown): 一个允许你在 React 组件中渲染 markdown 的库。
  * [React Markdown Typewriter](https://www.npmjs.com/package/react-markdown-typewriter): 此库提供了一个新组件 MarkdownTypewriter，它结合了 react-markdown 的 Markdown 组件和打字机动画。动画完全使用 motion 创建。

## 如何使用

在开始之前，你需要在计算机上安装 Node.js。如果你还没有安装，可以[在此处下载](https://nodejs.org/)。

### 推荐的 Visual Studio Code 扩展

* [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode): 提供 Tauri 命令和调试支持。
* [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer): 提供 Rust 语言支持。
* [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb): 提供 LLDB 调试支持。
* [JavaScript and TypeScript Nightly](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next): 提供 JavaScript 和 TypeScript 夜间版本。
* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint): 将 ESLint 集成到 VS Code。
* [vscode-color-picker](https://marketplace.visualstudio.com/items?itemName=antiantisepticeye.vscode-color-picker): Visual Studio Code 的颜色选择器。
* [Version Lens](https://marketplace.visualstudio.com/items?itemName=pflannery.vscode-versionlens): 使用代码镜头显示每个包的最新版本。
* [ink - Pixi'VN](https://marketplace.visualstudio.com/items?itemName=drincs-productions.pixi-vn-ink-vscode): Ink 语言的语法高亮。

### 更改图标

你可以通过替换 `public` 文件夹中的图像来更改游戏的图标。

之后，你需要运行以下命令来更改 tauri 图标。
  
```bash
npm run tauri icon public/pwa-512x512.png
```

## *ink* - 自定义标签脚本

通过使用 [onInkHashtagScript](https://pixi-vn.web.app/ink/ink-hashtag.html) 函数，在此模板中添加了以下功能。

**在屏幕之间移动**：此功能允许你在不同屏幕之间导航。语法如下：

`#` + `navigate` + `[route]`

`route`: 要导航到的路由/路径。在 [Router 文档](https://pixi-vn.web.app/start/interface-navigate.html)中阅读有关路由的更多信息。

```ink
#navigate /narration
```

**重命名角色**：此功能允许你更改正在说话的角色名称。语法如下：

`#` + `rename` + `[角色 id]` + `[新名称]`

### *ink* - 项目中的 ink 文件

`ink` 文件夹包含将在游戏中使用的 *ink* 文件。在此项目中，`ink` 文件夹中的所有 `.ink` 文件将自动包含在项目中。你可以通过修改 `src/utils/ink-utility.ts` 文件来更改此行为。

### *ink* - 使用 Inky 编写/测试叙述

要编写和测试叙述，你可以使用 **Inky 编辑器**。Inky 是一个使用 Ink 语言编写交互式小说的工具。当然，pixi-vn 引入的特殊功能不会被 Inky 忽略。你可以[在此处下载](https://www.inklestudios.com/ink/)。

要在此模板中使用 Inky，你可以在 Inky 中打开 `src/main.ink` 文件。

```ink
// main.ink
INCLUDE ink/start.ink
INCLUDE ink/second.ink
-> start
```

## 安装

首先，需要安装依赖项。为此，在项目根文件夹中打开终端并运行以下命令：

```bash
npm install
```

## 启动 Web 应用程序

要启动 Web 应用程序，请运行以下命令：

```bash
npm start
```

此命令将启动开发服务器。在浏览器中打开 [http://localhost:1420](http://localhost:1420) 查看。

### 调试 Web 应用程序

如果你使用 Visual Studio Code，可以使用模板提供的调试配置。为此，在启动 `npm start` 后，转到调试部分并选择 `Launch Chrome` 配置。

## 启动桌面程序 (Tauri)

**先决条件**：在启动 Tauri 应用程序之前，你需要阅读 [Tauri 先决条件](https://v2.tauri.app/start/prerequisites)并安装 [rust](https://v2.tauri.app/start/prerequisites/#rust)。重启你的电脑。

要启动 Tauri 应用程序，请运行以下命令：

```bash
npm run tauri dev
```

此命令将启动 Tauri 应用程序。应用程序将在你计算机上的窗口中打开。

### 调试桌面程序

如果你使用 Visual Studio Code，可以使用模板附带的调试配置。为此，转到调试部分并选择 `Tauri Development Debug` 或 `Tauri Production Debug` 配置。

在 [Tauri 文档](https://v2.tauri.app/develop/debug/vscode/)中阅读有关调试可能性的更多信息。

## 启动 Android 应用程序 (Tauri)

**先决条件**：在启动 Tauri 应用程序之前，你需要阅读 [Tauri 先决条件](https://v2.tauri.app/start/prerequisites)并安装 [rust](https://v2.tauri.app/start/prerequisites/#rust)。并且你需要在计算机上安装 [Android SDK](https://v2.tauri.app/start/prerequisites/#android)。

要启动 Tauri 应用程序，请运行以下命令：

```bash
npm run tauri android dev
```

此命令将启动 Tauri 应用程序。应用程序将在模拟器或你的 Android 设备上打开。

## 启动 iOS 应用程序 (Tauri)

**先决条件**：在启动 Tauri 应用程序之前，你需要阅读 [Tauri 先决条件](https://v2.tauri.app/start/prerequisites)并安装 [rust](https://v2.tauri.app/start/prerequisites/#rust)。并且你需要在计算机上安装 [Xcode](https://v2.tauri.app/start/prerequisites/#ios)。

要启动 Tauri 应用程序，请运行以下命令：

```bash
npm run tauri ios dev
```

## 分发

### Web 应用程序

要构建项目，请运行以下命令：

```bash
npm run build
```

此命令将创建一个 `dist` 文件夹，其中包含运行应用程序所需的文件。你可以将此文件夹部署到 Web 服务器。

你可以在 [Pixi'VN 文档](https://pixi-vn.web.app/advanced/distribution.html#hosting)中阅读有关托管可能性的更多信息。

### 桌面应用程序

你可以在 [Pixi'VN 文档](https://pixi-vn.web.app/advanced/distribution-desktop-mobile.html)中阅读有关分发可能性的更多信息。
