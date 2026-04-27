import { NextRequest, NextResponse } from 'next/server'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

// 导入类型定义 - 使用 import type 只导入类型，不导入值
import type {
  BacktestRequest,        // 回测请求参数类型
  BacktestResponse,       // 回测成功响应类型
  BacktestErrorResponse,  // 回测错误响应类型
  BacktestHistoryResponse,// 历史记录响应类型
  BacktestHistoryItem     // 历史记录项类型
} from './types'

// 导入工具函数 - 这些是实际的值导入
import {
  classifyError,          // 错误分类函数
  validateConfig          // 配置验证函数
} from './types'

// ==================== 常量定义 ====================
// 项目根目录 - 指向 portfolio-web 的父目录
const PROJECT_ROOT = path.resolve(process.cwd(), '..')

// 历史记录文件路径 - 存储在 data 目录下
const HISTORY_FILE = path.join(PROJECT_ROOT, 'data', 'backtest_history.json')

// Python 脚本模板路径 - 使用 process.cwd() 确保在 Next.js 环境下正确解析
const TEMPLATE_PATH = path.join(process.cwd(), 'src', 'app', 'api', 'backtest', 'backtest_template.py')

// 注意：回测逻辑已完全内嵌到 backtest_template.py 中
// 不再依赖外部的 portfolio-backtest 模块

/**
 * POST /api/backtest - 运行回测
 *
 * 处理用户提交的回测请求，执行以下步骤：
 * 1. 解析并验证请求参数
 * 2. 生成临时配置文件（YAML）
 * 3. 复制 Python 脚本到临时文件
 * 4. 执行 Python 回测引擎
 * 5. 解析并返回结果
 */
export async function POST(request: NextRequest): Promise<NextResponse<BacktestResponse | BacktestErrorResponse>> {
  // 记录开始时间，用于计算回测耗时
  const startTime = Date.now()

  try {
    // 步骤 1: 解析请求参数
    // 从请求体中读取 JSON 格式的回测配置
    const config: BacktestRequest = await request.json()

    // 步骤 2: 验证配置
    // 检查日期范围、资金、权重等是否合法
    const validation = validateConfig(config)
    if (!validation.isValid) {
      // 验证失败，返回 400 错误
      return NextResponse.json({
        success: false,
        error: validation.errors.join('; '),           // 合并所有错误信息
        errorType: 'VALIDATION_ERROR',
        errorCode: 'INVALID_DATE_RANGE'
      }, { status: 400 })
    }

    // 步骤 3: 生成临时文件路径
    // 使用系统临时目录存放中间文件，避免污染项目目录
    const tempDir = os.tmpdir()
    const timestamp = Date.now()  // 使用时间戳确保文件名唯一
    const configPath = path.join(tempDir, `backtest_config_${timestamp}.yaml`)   // YAML 配置文件
    const csvPath = path.join(tempDir, `backtest_results_${timestamp}.csv`)      // 回测结果 CSV
    const scriptPath = path.join(tempDir, `backtest_runner_${timestamp}.py`)     // Python 执行脚本

    // 步骤 4: 确保历史目录存在
    // 如果 data 目录不存在则创建它
    const historyDir = path.dirname(HISTORY_FILE)
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true })
    }

    // 步骤 5: 生成 YAML 配置
    // 将请求参数转换为 YAML 格式的配置内容
    const yamlContent = generateYamlConfig(config)
    // 写入临时 YAML 文件，供 Python 脚本读取
    fs.writeFileSync(configPath, yamlContent, 'utf-8')

    // 步骤 6: 复制 Python 脚本模板
    // 将模板脚本复制到临时文件，避免命令行参数过长的问题
    const scriptContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8')
    fs.writeFileSync(scriptPath, scriptContent, 'utf-8')

    // 步骤 7: 执行 Python 脚本
    // 启动子进程运行回测引擎，设置 120 秒超时
    const result = await executePythonScript(scriptPath, configPath, csvPath)

    // 步骤 8: 解析结果
    // Python 脚本通过 __RESULT_START__ 和 __RESULT_END__ 标记输出 JSON
    const resultMatch = result.stdout.match(/__RESULT_START__([\s\S]*?)__RESULT_END__/)
    if (!resultMatch) {
      throw new Error('无法解析回测结果')
    }

    // 提取并解析 JSON 结果
    const resultData = JSON.parse(resultMatch[1])

    // 步骤 9: 解析 CSV 数据
    // 将 CSV 转换为前端图表需要的格式
    const chartData = parseCsvData(csvPath)

    // 步骤 10: 保存回测历史
    // 将本次回测结果保存到历史记录文件
    const historyItem = createHistoryItem(config, resultData)
    saveHistory(historyItem)

    // 步骤 11: 清理临时文件
    // 删除临时生成的 YAML、CSV 和 Python 脚本文件
    cleanupFiles([configPath, csvPath, scriptPath])

    // 步骤 12: 返回结果
    // 将指标转换为百分比格式，返回给前端展示
    const duration = Date.now() - startTime
    console.log(`回测完成，耗时: ${duration}ms`)

    return NextResponse.json({
      success: true,
      metrics: {
        // 将小数转换为百分比（乘以 100）
        totalReturn: (resultData.metrics.Total_Return || 0) * 100,        // 总收益率
        annualReturn: (resultData.metrics.Annual_Return || 0) * 100,     // 年化收益率
        annualVolatility: (resultData.metrics.Annual_Volatility || 0) * 100, // 年化波动率
        maxDrawdown: (resultData.metrics.Max_Drawdown || 0) * 100,       // 最大回撤
        // 比率类指标不需要转换
        sharpeRatio: resultData.metrics.Sharpe_Ratio || 0,               // 夏普比率
        sortinoRatio: resultData.metrics.Sortino_Ratio || 0,             // 索提诺比率
        winRate: (resultData.metrics.Win_Rate || 0) * 100,               // 胜率
        infoRatio: resultData.metrics.Info_Ratio || 0,                   // 信息比率
        benchmarkReturn: (resultData.metrics.Benchmark_Return || 0) * 100, // 基准收益率
      },
      chartData,           // 图表数据
      assetWeights: resultData.assetWeights  // 资产权重配置
    })

  } catch (error: unknown) {
    // 捕获并处理回测过程中的异常
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('回测错误:', errorMessage)

    // 步骤 13: 错误分类与处理
    // 将技术错误信息转换为用户友好的错误提示
    const classified = classifyError(errorMessage)

    return NextResponse.json({
      success: false,
      error: classified.userMessage,
      errorType: classified.errorType,
      errorCode: classified.errorCode
    }, { status: 500 })
  }
}

/**
 * GET /api/backtest - 获取回测历史
 *
 * 返回存储在 backtest_history.json 中的历史记录列表
 */
export async function GET(): Promise<NextResponse<BacktestHistoryResponse>> {
  try {
    // 检查历史文件是否存在
    if (fs.existsSync(HISTORY_FILE)) {
      // 读取并解析历史记录 JSON 文件
      const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
      return NextResponse.json({ success: true, history })
    }
    // 文件不存在时返回空列表
    return NextResponse.json({ success: true, history: [] })
  } catch (error: unknown) {
    // 读取失败时返回 500 错误
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '读取历史记录失败'
    }, { status: 500 })
  }
}

// ==================== 辅助函数 ====================

/**
 * 生成 YAML 配置文件内容
 *
 * 将回测请求参数转换为 YAML 格式的配置文件，供 Python 脚本读取
 *
 * @param config - 回测请求参数对象
 * @returns YAML 格式的配置字符串
 */
function generateYamlConfig(config: BacktestRequest): string {
  // 构建 YAML 配置结构
  return `backtest:
  start_date: '${config.startDate}'           # 回测开始日期
  end_date: '${config.endDate}'               # 回测结束日期
  initial_capital: ${config.initialCapital}   # 初始资金
  transaction_fee_rate: ${config.transactionFeeRate}  # 交易费率
  risk_free_rate: ${config.riskFreeRate}      # 无风险利率
  benchmark_symbol: '${config.benchmarkSymbol}'  # 基准指数代码
  rebalance_mode: '${config.rebalanceMode}'   # 再平衡模式
  rebalance_threshold: ${config.rebalanceThreshold}  # 再平衡阈值
  rebalance_frequency: '${config.rebalanceFrequency}'  # 再平衡频率
data_source:
  # 数据源配置：akshare 为真实数据，mock 为模拟数据
  primary: ${config.useRealData ? 'akshare' : 'mock'}
  fallback: mock                               # 备用数据源
  cache_enabled: false                         # 禁用缓存
`
}

/**
 * 执行 Python 回测脚本
 *
 * 使用 child_process.spawn 启动 Python 子进程执行回测计算
 * 通过 Promise 异步等待脚本执行完成并返回结果
 *
 * @param scriptPath - Python 脚本路径
 * @param configPath - YAML 配置文件路径
 * @param csvPath - 输出 CSV 文件路径
 * @returns 包含 stdout 和 stderr 的结果对象
 */
async function executePythonScript(
  scriptPath: string,
  configPath: string,
  csvPath: string
): Promise<{ stdout: string; stderr: string }> {
  // 构建命令行参数（回测逻辑已内嵌，只需要传递配置和输出路径）
  // 格式: python <脚本路径> <配置路径> <dummy> <CSV输出路径>
  const pythonScript = `python "${scriptPath}" "${configPath}" "embedded" "${csvPath}"`

  // 使用 Promise 包装子进程操作，实现异步回调
  return new Promise((resolve, reject) => {
    // spawn 第三个参数是选项对象
    const child: ChildProcess = spawn(pythonScript, {
      shell: true,          // 使用系统 shell 执行（Windows 下为 cmd）
      timeout: 120000,      // 超时时间：120 秒
      maxBuffer: 10 * 1024 * 1024  // 最大缓冲区：10MB
    })

    // 收集标准输出
    let stdout = ''
    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    // 收集标准错误（用于调试）
    let stderr = ''
    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    // 进程启动失败处理
    child.on('error', (err: Error) => {
      console.error('Python 进程错误:', err)
      reject(new Error(`Python 进程启动失败: ${err.message}`))
    })

    // 进程结束处理
    child.on('close', (code: number | null) => {
      if (code === 0) {
        // 正常退出，返回输出结果
        resolve({ stdout, stderr })
      } else {
        // 异常退出，记录错误信息并抛出异常
        console.error('Python stderr:', stderr)
        reject(new Error(`Python 脚本执行失败 (退出码: ${code})`))
      }
    })
  })
}

/**
 * 解析 CSV 数据为图表格式
 *
 * 将 Python 回测引擎输出的 CSV 文件解析为前端 Recharts 图表需要的格式
 *
 * @param csvPath - CSV 文件路径
 * @returns 包含日期标签、组合净值、基准净值和权重数据的图表对象
 */
function parseCsvData(csvPath: string): {
  labels: string[]                          // 日期标签数组
  portfolio: number[]                       // 组合净值数组
  benchmark: number[]                       // 基准净值数组
  weights: Array<{                          // 各资产权重数据
    date: string
    weights: Record<string, number>
  }>
} {
  // 初始化返回数据结构
  const chartData = {
    labels: [] as string[],
    portfolio: [] as number[],
    benchmark: [] as number[],
    weights: [] as Array<{ date: string; weights: Record<string, number> }>
  }

  // 文件不存在时返回空数据
  if (!fs.existsSync(csvPath)) {
    return chartData
  }

  // 读取 CSV 文件
  const csv = fs.readFileSync(csvPath, 'utf-8')
  // 跳过标题行，只处理数据行
  const lines = csv.split('\n').slice(1)

  // 逐行解析 CSV 数据
  for (const line of lines) {
    // 按逗号分隔
    const parts = line.split(',')
    // 跳过无效行（需要至少日期、组合净值两列）
    if (parts.length < 3 || !parts[0] || !parts[1]) continue

    // 提取日期（取日期部分，去掉时间）
    const date = parts[0].split(' ')[0]
    // 解析组合净值
    const portfolio = parseFloat(parts[1])
    // 解析基准净值，处理 NaN 情况
    const benchmark = parts[2] && parts[2] !== 'NaN' ? parseFloat(parts[2]) : NaN

    // 添加到图表数据
    chartData.labels.push(date)
    chartData.portfolio.push(portfolio)
    // 只添加有效的基准数据
    if (!isNaN(benchmark)) {
      chartData.benchmark.push(benchmark)
    }

    // 解析资产权重数据
    const weightData: Record<string, number> = {}
    const weightKeys = ['Stock_CSI300', 'Stock_Dividend', 'Bond_Long', 'Bond_Medium', 'Gold', 'Cash']
    for (const key of weightKeys) {
      // 查找包含资产名称的列
      const idx = parts.findIndex((p) => p && p.includes(key))
      if (idx > 0) {
        weightData[key] = parseFloat(parts[idx])
      }
    }
    // 如果解析到有效的权重数据，添加到列表
    if (Object.keys(weightData).length > 0) {
      chartData.weights.push({ date, weights: weightData })
    }
  }

  return chartData
}

/**
 * 创建历史记录项
 *
 * 将回测配置和结果组装成一个历史记录对象，用于存储和展示
 *
 * @param config - 回测请求配置
 * @param resultData - Python 返回的结果数据
 * @returns 历史记录项对象
 */
function createHistoryItem(config: BacktestRequest, resultData: Record<string, unknown>): BacktestHistoryItem {
  // 提取指标数据
  const metrics = resultData.metrics as Record<string, number>

  // 构建历史记录对象
  return {
    id: Date.now(),                    // 使用时间戳作为唯一 ID
    date: new Date().toISOString(),    // ISO 格式的时间字符串
    config: {                          // 回测配置摘要
      startDate: config.startDate,
      endDate: config.endDate,
      initialCapital: config.initialCapital,
      useRealData: config.useRealData,
      rebalanceMode: config.rebalanceMode,
    },
    assets: config.assetWeights,       // 资产权重配置
    metrics: {                         // 绩效指标（转换为百分比）
      totalReturn: (metrics.Total_Return || 0) * 100,
      annualReturn: (metrics.Annual_Return || 0) * 100,
      maxDrawdown: (metrics.Max_Drawdown || 0) * 100,
      sharpeRatio: metrics.Sharpe_Ratio || 0,
    }
  }
}

/**
 * 保存历史记录
 *
 * 读取现有历史记录，将新记录添加到开头，
 * 保留最多 50 条记录，然后写回文件
 *
 * @param historyItem - 要保存的历史记录项
 */
function saveHistory(historyItem: BacktestHistoryItem): void {
  let history: BacktestHistoryItem[] = []

  // 如果历史文件存在，读取现有记录
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    } catch {
      // 解析失败时使用空数组
      history = []
    }
  }

  // 将新记录添加到数组开头（最新记录在前）
  history.unshift(historyItem)
  // 只保留最近 50 条记录
  history = history.slice(0, 50)

  // 写回文件，保持缩进格式以便阅读
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8')
}

/**
 * 清理临时文件
 *
 * 回测完成后删除临时生成的配置文件、CSV 文件和 Python 脚本
 * 使用 try-catch 确保单个文件删除失败不影响其他文件的清理
 *
 * @param filePaths - 要清理的文件路径数组
 */
function cleanupFiles(filePaths: string[]): void {
  for (const filePath of filePaths) {
    try {
      // 检查文件是否存在
      if (fs.existsSync(filePath)) {
        // 删除文件
        fs.unlinkSync(filePath)
      }
    } catch (err) {
      // 记录警告但不影响主流程
      console.warn(`清理文件失败: ${filePath}`, err)
    }
  }
}
