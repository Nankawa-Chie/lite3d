# MementoMori Modularization 2.5

一个基于 Three.js 构建的沉浸式 3D 交互世界，融合了现代 Web 技术与丰富的视觉效果。

【img】
*项目主界面截图*

## ✨ 特性

### 🎮 核心功能
- **3D 角色控制系统** - 流畅的第一人称/第三人称视角切换
- **物理引擎集成** - 基于 Cannon.js 的真实物理交互
- **模块化架构** - 高度解耦的组件设计，易于扩展和维护
- **实时渲染** - 支持阴影、光照和后处理效果

### 🌟 视觉效果
- **程序化星系** - 20万+粒子组成的动态星系系统
- **地形生成** - 基于噪声算法的程序化地形
- **天空盒系统** - 沉浸式环境渲染
- **动态光照** - 实时阴影和光照计算

### 🏠 交互元素
- **可交互建筑** - 带有开门动画的房屋系统
- **视频播放器** - 内置3D视频播放功能，支持字幕和进度控制
- **传送门系统** - 星球间快速传送
- **小地图导航** - 实时位置显示

### 📱 特殊功能
- **iPhone 12 模拟器** - 完整的移动设备界面模拟
- **CSS3D 集成** - 2D/3D 混合渲染
- **调试面板** - 实时参数调节和性能监控

【img】
*角色控制和物理交互演示*

## 🛠️ 技术栈

### 核心框架
- **Three.js** (v0.158.0) - 3D 图形渲染引擎
- **Cannon.js** - 物理引擎
- **GSAP** - 高性能动画库
- **Tween.js** - 补间动画

### 构建工具
- **Webpack 5** - 模块打包和构建
- **Babel** - JavaScript 转译
- **CSS Loader** - 样式处理

### 辅助库
- **dat.GUI** - 调试界面
- **html2canvas** - 截图功能
- **NoiseJS** - 程序化生成

## 🚀 快速开始

### 环境要求
- Node.js 14.0+
- 现代浏览器（支持 WebGL 2.0）

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
# 或者直接运行
./run.bat
```

### 生产构建
```bash
npm run build
# 或者直接运行
./build.bat
```

【img】
*开发环境界面*

## 📁 项目结构

```
root/
├── src/
│   ├── index.html          # 主页面
│   ├── script.js           # 入口脚本
│   ├── style.css           # 全局样式
│   ├── modules/            # 功能模块
│   │   ├── character.js    # 角色控制系统
│   │   ├── physics.js      # 物理引擎
│   │   ├── galaxy.js       # 星系渲染
│   │   ├── house.js        # 建筑交互
│   │   ├── tv.js          # 视频播放
│   │   ├── terrain.js      # 地形生成
│   │   ├── lighting.js     # 光照系统
│   │   ├── RoomModule.js   # 房间模块
│   │   └── ...            # 其他模块
│   └── shaders/           # 着色器文件
├── static/                # 静态资源
│   ├── models/           # 3D 模型文件
│   ├── textures/         # 纹理贴图
│   ├── fonts/            # 字体文件
│   ├── iPhone12/         # iPhone 模拟器
│   └── video/            # 视频文件
├── bundler/              # Webpack 配置
└── package.json          # 项目配置
```

## 🎯 核心模块说明

### 角色系统 (Character)
- 支持 WASD 移动控制
- 鼠标视角控制
- 跳跃和体力系统
- 碰撞检测

### 物理引擎 (Physics)
- 重力模拟
- 刚体碰撞
- 地面检测
- 物理材质系统

### 星系渲染 (Galaxy)
- 20万粒子系统
- 自定义着色器
- 动态颜色渐变
- 螺旋臂结构

### 交互系统
- 门的开关动画
- 视频播放控制
- 传送门机制
- UI 交互反馈

【img】
*星系渲染效果*

## 🎮 操作指南

### 基础控制
- **WASD** - 角色移动
- **鼠标** - 视角控制
- **空格** - 跳跃
- **Shift** - 奔跑

### 交互操作
- **靠近门** - 自动开门
- **点击视频** - 播放/暂停
- **点击星球** - 传送
- **ESC** - 显示/隐藏鼠标

## 🔧 自定义配置

项目支持通过调试面板实时调整各种参数：

- 渲染质量设置
- 物理引擎参数
- 光照效果调节
- 星系外观配置
- 角色移动速度

【img】
*调试面板界面*

## 📊 性能优化

- **LOD 系统** - 根据距离调整模型细节
- **视锥体剔除** - 只渲染可见对象
- **纹理压缩** - 优化内存使用
- **着色器优化** - 高效的 GPU 计算
- **对象池** - 减少垃圾回收

## 🌐 浏览器兼容性

| 浏览器 | 版本要求 | WebGL 2.0 | 性能 |
|--------|----------|-----------|------|
| Chrome | 80+ | ✅ | 优秀 |
| Firefox | 75+ | ✅ | 良好 |
| Safari | 14+ | ✅ | 良好 |
| Edge | 80+ | ✅ | 优秀 |

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 AGPL-3.0 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Three.js](https://threejs.org/) - 强大的 3D 图形库
- [Cannon.js](https://github.com/schteppe/cannon.js/) - 物理引擎
- [GSAP](https://greensock.com/gsap/) - 动画库
- 所有贡献者和开源社区

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 Issue
- 发起 Discussion
- 邮件联系：nankawachie@gmail.com / 3262266231@qq.com

---

**享受你的 3D 世界探索之旅！** 🚀✨

【img】
*项目 Logo 或主要场景截图*
