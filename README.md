<p align="center">
  <h1 align="center">🔄 LoopExplorer</h1>
  <p align="center"><strong>AI 驱动的智能闭环运动路线规划助手</strong></p>
  <p align="center">告别 A→B 式导航，让每一次出发都能完美回家</p>
</p>

---

## ✨ 产品简介

LoopExplorer 是一款基于微信小程序的智能户外运动私人助理。用户只需输入运动距离或时长，系统即可通过几何算法自动规划出一条**起点与终点重合的闭环路线**，实现「无目的地的探索」与「有掌控的回归」。

## 🚀 核心功能

| 功能 | 描述 |
|------|------|
| 🗺️ 智能闭环规划 | 设定距离/时长，自动生成起终点重合的运动路线 |
| 💬 模糊意图理解 | 支持自然语言输入（如"跑 30 分钟，中间想上个厕所"） |
| 🎲 随机探索推荐 | 随机生成不同方向的路线，发现身边风景 |
| 📍 轨迹记录打卡 | 标记轨迹 + 上传照片留念 |
| 🔗 社交路线分享 | 保存优质路线并分享给好友 |
| 🚌 一键返程对接 | 走累了？共享单车、公交一键回家 |
| 📡 弱网离线模式 | 户外信号不佳时离线记录轨迹 |

## 🛠️ 技术栈

- **框架**：[Taro](https://taro.zone/) 4.x（React 语法，一套代码多端运行）
- **地图**：微信原生 `<Map>` 组件
- **空间计算**：[Turf.js](https://turfjs.org/)（几何算法引擎）
- **定位**：微信原生 `wx.getLocation`
- **样式**：Sass
- **编译**：Webpack 5

## 📦 快速开始

### 环境要求

- Node.js ≥ 18
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发模式（微信小程序）
npm run dev:weapp

# 构建生产版本
npm run build:weapp
```

### 预览

1. 打开 **微信开发者工具**
2. 导入项目 → 选择本项目的 `dist/` 目录
3. 在 `project.config.json` 中填入你的 **AppID**

## 📁 项目结构

```
LoopExplorer/
├── config/                  # Taro 编译配置
│   ├── index.js             # 主配置
│   ├── dev.js               # 开发环境
│   └── prod.js              # 生产环境
├── src/
│   ├── app.js               # 应用入口
│   ├── app.config.js        # 小程序全局配置
│   ├── app.scss             # 全局样式
│   └── pages/
│       └── index/
│           ├── index.jsx    # 首页（地图 + 路线生成）
│           ├── index.scss   # 首页样式
│           └── index.config.js
├── dist/                    # 编译产物（微信开发者工具打开此目录）
├── babel.config.js
├── project.config.json      # 微信小程序项目配置
└── package.json
```

## 🧮 核心算法

闭环路线生成基于**等边三角形几何模型**：

1. 以用户定位为圆心，根据目标里程估算半径 `R = distance / (3√3)`
2. 在 **0°（正北）、120°（东南）、240°（西南）** 三个方位计算途经点
3. 连接 `起点 → P1 → P2 → P3 → 起点`，形成闭环

## 📜 License

MIT
