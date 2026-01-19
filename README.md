# 永久投资组合回测系统 (Permanent Portfolio Backtest System)

## 项目概述

**portfolio-web** 是一个基于 Next.js 的 Web 应用，为"永久投资组合"投资策略提供可视化回测平台。用户可以：

- 配置并运行多资产组合策略的回测
- 可视化投资组合表现与基准指数（沪深300）的对比
- 使用交互式滑块动态调整资产配置权重
- 分析关键绩效指标（收益率、波动率、夏普比率、最大回撤等）
- 在真实市场数据（akshare）和模拟数据之间切换
- 保存和查看回测历史

本项目是回测系统的前端部分，与 Python 后端（`portfolio-backtest`）集成进行实际的金融计算。

---

## 项目结构

```
D:\workspace_happy\portfolio-web\
├── .gitignore
├── next.config.js                 # Next.js 配置文件
├── package.json                   # 项目依赖和脚本
├── postcss.config.js              # PostCSS 配置（Tailwind）
├── tailwind.config.ts             # Tailwind CSS 主题配置
├── tsconfig.json                  # TypeScript 编译器配置
├── vercel.json                    # Vercel 部署配置
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── backtest/
│   │   │       ├── backtest_template.py  # Python 脚本模板
│   │   │       ├── route.ts              # API 路由处理器
│   │   │       └── types.ts              # TypeScript 类型定义
│   │   ├── globals.css                   # 全局样式
│   │   ├── layout.tsx                    # 根布局组件
│   │   └── page.tsx                      # 主应用页面
│   └── node_modules/                     # 依赖目录（git 排除）
```

---

## 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | Next.js | 14.2.3 | React 框架，包含 App Router 和 API 路由 |
| **语言** | TypeScript | 5.4.5 | 类型安全的 JavaScript |
| **UI 库** | React | 18.3.1 | UI 组件库 |
| **样式** | Tailwind CSS | 3.4.3 | 实用优先的 CSS 框架 |
| **图表** | Recharts | 3.6.0 | 数据可视化库 |
| **构建工具** | PostCSS | 8.4.38 | CSS 处理 |
| **编译器** | Autoprefixer | 10.4.19 | CSS 厂商前缀 |

---

## API 接口文档

### POST `/api/backtest`

运行回测并返回结果。

**请求体 (BacktestRequest):**

```typescript
{
  startDate: string              // 开始日期，格式: YYYY-MM-DD
  endDate: string                // 结束日期，格式: YYYY-MM-DD
  initialCapital: number         // 初始投资金额
  transactionFeeRate: number     // 交易费率 (0-1)
  riskFreeRate: number           // 无风险利率
  benchmarkSymbol: string        // 基准指数代码 (如: '000300.SH')
  rebalanceMode: 'threshold' | 'scheduled' | 'dual'  // 再平衡模式
  rebalanceThreshold: number     // 再平衡触发阈值
  rebalanceFrequency: 'monthly' | 'quarterly' | 'annually'  // 再平衡频率
  useRealData: boolean           // 是否使用真实数据 (true=akshare, false=模拟)
  assetWeights: {                // 资产权重配置
    Stock_CSI300: number     // 股票(沪深300) 权重
    Stock_Dividend: number   // 股票(红利) 权重
    Bond_Long: number        // 长期债券 权重
    Bond_Medium: number      // 中期债券 权重
    Gold: number             // 黄金 权重
    Cash: number             // 现金 权重
  }
}
```

**成功响应 (BacktestResponse):**

```typescript
{
  success: true,
  metrics: {
    totalReturn: number        // 总收益率 (%)
    annualReturn: number       // 年化收益率 (%)
    annualVolatility: number   // 年化波动率 (%)
    maxDrawdown: number        // 最大回撤 (%)
    sharpeRatio: number        // 夏普比率
    sortinoRatio: number       // 索提诺比率
    winRate: number            // 胜率 (%)
    infoRatio: number          // 信息比率
    benchmarkReturn: number    // 基准收益率 (%)
  },
  chartData: {
    labels: string[]           // 日期标签
    portfolio: number[]        // 组合净值
    benchmark: number[]        // 基准净值
    weights: Array<{           // 权重数据
      date: string,
      weights: Record<string, number>
    }>
  },
  assetWeights: Record<string, number>  // 最终资产权重
}
```

**错误响应 (BacktestErrorResponse):**

```typescript
{
  success: false,
  error: string,
  errorType?: 'CONFIG_ERROR' | 'DATA_ERROR' | 'CALCULATION_ERROR' | 'SYSTEM_ERROR' | 'VALIDATION_ERROR',
  errorCode?: string
}
```

---

### GET `/api/backtest`

获取回测历史记录。

**响应:**

```typescript
{
  success: true,
  history: Array<{
    id: number
    date: string               // ISO 时间戳
    config: {
      startDate: string
      endDate: string
      initialCapital: number
      useRealData: boolean
      rebalanceMode: string
    },
    assets: AssetWeights,
    metrics: {
      totalReturn: number
      annualReturn: number
      maxDrawdown: number
      sharpeRatio: number
    }
  }>
}
```

---

## 前端组件及其职责

### 1. `src/app/page.tsx` - 主应用页面

**职责:**
- **状态管理**: 管理回测配置、加载状态、结果数据和历史记录
- **资产配置 UI**: 显示 6 个资产类别，配有滑块用于调整权重
- **基本配置表单**: 日期范围、初始资金、数据源切换
- **再平衡设置**: 模式选择、阈值、频率
- **结果展示**: 绩效指标卡片、使用 Recharts 的净值曲线图
- **历史面板**: 显示最近 10 条回测记录及加载功能

**关键状态变量:**
```typescript
config: BacktestConfigState     // 所有配置参数
loading: boolean                // API 请求状态
result: BacktestResponse | null // 回测结果
history: BacktestHistoryItem[]  // 保存的回测记录
showHistory: boolean            // 切换历史面板显示
```

---

### 2. `src/app/layout.tsx` - 根布局

设置元数据，提供 HTML 结构，支持中文语言。

---

### 3. `src/app/api/backtest/route.ts` - API 路由处理器

**职责:**
- **POST 处理器**: 验证请求、生成 YAML 配置、启动 Python 进程、解析结果
- **GET 处理器**: 从 JSON 文件读取回测历史
- **错误分类**: 将错误信息映射为用户友好的提示

**关键函数:**
- `generateYamlConfig()`: 将请求转换为 YAML 格式
- `executePythonScript()`: 运行 Python 回测（带超时）
- `parseCsvData()`: 将 CSV 转换为图表友好格式
- `saveHistory()`: 保存历史记录（最多 50 条）
- `cleanupFiles()`: 清理临时文件

---

### 4. `src/app/api/backtest/types.ts` - 类型定义

**职责:**
- 定义所有 API 请求/响应的 TypeScript 接口
- 提供配置验证工具 (`validateConfig`)
- 提供错误分类工具 (`classifyError`)
- 导出辅助函数 (`isErrorResponse`, `getDefaultConfig`)

---

### 5. `src/app/api/backtest/backtest_template.py` - Python 脚本模板

**职责:**
- 动态加载 `portfolio-backtest/test.py` 模块
- 编排回测执行流程
- 使用标记输出 JSON 格式结果

---

## 数据流架构

```
+-------------------+     +-------------------+     +------------------+
|   前端 (page.tsx) |     |   API 路由        |     |  Python 回测     |
+-------------------+     +-------------------+     +------------------+
|                   |     |                   |     |                  |
| 1. 用户配置       |---->| 2. 验证请求       |---->| 4. 加载 YAML     |
|    (滑块交互)     |     |    参数           |     |    配置          |
|                   |     |                   |     |                  |
| 3. 显示结果       |<----| 7. 返回指标       |<----| 6. 保存 CSV      |
|                   |     |    和图表数据     |     |                  |
|                   |     |                   |     | 5. 计算          |
| 8. 显示历史       |<----| 10. 保存历史      |     |    绩效指标      |
+-------------------+     +-------------------+     +------------------+
                                |
                                v
                       +-------------------+
                       |  backtest_history |
                       |  .json 文件       |
                       +-------------------+
```

---

## 配置选项

### Next.js 配置 (`next.config.js`)

```javascript
{
  images: { unoptimized: true }
}
```

### TypeScript 配置 (`tsconfig.json`)

- 启用严格模式
- JSX preserve（Next.js 默认）
- 路径别名: `@/*` -> `./src/*`
- ESNext 模块系统

### Tailwind 配置 (`tailwind.config.ts`)

```typescript
{
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7'
        }
      }
    }
  }
}
```

---

## 运行项目

### 环境要求

- Node.js 18+（当前使用 20.20.0）
- Python 3.8+（用于执行回测）
- `portfolio-backtest` 模块的 pip 依赖

### 安装

```bash
# 进入项目目录
cd D:\workspace_happy\portfolio-web

# 安装依赖
npm install
```

### 可用脚本

| 脚本 | 命令 | 描述 |
|------|------|------|
| `dev` | `npm run dev` | 启动开发服务器（端口 3007） |
| `build` | `npm run build` | 构建生产版本 |
| `start` | `npm run start` | 启动生产服务器 |

### 启动应用

```bash
# 启动开发服务器
npm run dev

# 服务将在 http://localhost:3007 可访问
```

### 集成要求

应用依赖：
1. **Python 后端**: `portfolio-backtest` 模块必须位于 `../portfolio-backtest/test.py`
2. **数据存储**: 历史文件存储在 `../data/backtest_history.json`
3. **Python 依赖**: pandas, numpy, yaml 等

---

## 关键依赖

### 生产依赖

| 包 | 版本 | 用途 |
|---|------|------|
| `next` | 14.2.3 | React 框架、路由、API 路由 |
| `react` | 18.3.1 | UI 组件库 |
| `react-dom` | 18.3.1 | React DOM 渲染 |
| `recharts` | 3.6.0 |净值曲线可视化库 |

### 开发依赖

| 包 | 版本 | 用途 |
|---|------|------|
| `typescript` | 5.4.5 | TypeScript 编译器 |
| `@types/node` | 20.12.12 | Node.js 类型定义 |
| `@types/react` | 18.3.2 | React 类型定义 |
| `@types/react-dom` | 18.3.0 | React DOM 类型定义 |
| `tailwindcss` | 3.4.3 | CSS 工具框架 |
| `postcss` | 8.4.38 | CSS 处理 |
| `autoprefixer` | 10.4.19 | CSS 厂商前缀 |

---

## 支持的资产类别

| 资产键名 | 名称 | 默认权重 | 颜色代码 |
|---------|------|---------|---------|
| `Stock_CSI300` | 股票(沪深300) | 15% | #ef4444 (红) |
| `Stock_Dividend` | 股票(红利) | 15% | #f97316 (橙) |
| `Bond_Long` | 债券(长期) | 15% | #22c55e (绿) |
| `Bond_Medium` | 债券(中期) | 10% | #14b8a6 (青) |
| `Gold` | 黄金 | 25% | #eab308 (黄) |
| `Cash` | 现金 | 20% | #6366f1 (蓝) |

---

## 计算的绩效指标

1. **总收益率** - 投资组合的整体收益率
2. **年化收益率** - 年化后的收益率
3. **年化波动率** - 年化的收益率标准差
4. **最大回撤** - 从峰值到谷底的最大跌幅
5. **夏普比率** - 风险调整后收益指标
6. **索提诺比率** - 下行风险调整后收益
7. **胜率** - 正收益期占比
8. **信息比率** - 主动收益相对跟踪误差

---

## 错误处理

系统实现了完整的错误分类：

| 错误类型 | 错误代码 | 用户提示 |
|---------|---------|---------|
| `VALIDATION_ERROR` | `INVALID_DATE_RANGE` | 开始日期必须早于结束日期 |
| `DATA_ERROR` | `BENCHMARK_NOT_FOUND` | 无法获取基准数据，请尝试使用模拟数据 |
| `DATA_ERROR` | `DATA_FETCH_FAILED` | 无法获取资产数据，请检查网络连接或尝试使用模拟数据 |
| `SYSTEM_ERROR` | `PYTHON_EXECUTION_FAILED` | Python 脚本执行失败，请稍后重试 |
| `SYSTEM_ERROR` | `FILE_WRITE_FAILED` | 文件操作失败，请检查权限或磁盘空间 |

---

## 项目命令

```bash
# 使用 Node.js 20
nvm use 20.20.0

# 启动开发服务器 (端口 3007)
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

---

*文档更新时间: 2026-01-19*
