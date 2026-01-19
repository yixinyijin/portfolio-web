/**
 * 回测 API 类型定义
 *
 * 本文件定义了所有与回测功能相关的 TypeScript 接口类型，
 * 包括请求参数、响应数据、历史记录等数据结构
 */

// ==================== 请求类型 ====================

/**
 * 回测配置请求参数
 *
 * 用户提交回测时需要提供的完整配置信息
 */
export interface BacktestRequest {
  /** 回测开始日期，格式：YYYY-MM-DD */
  startDate: string
  /** 回测结束日期，格式：YYYY-MM-DD */
  endDate: string
  /** 初始投资资金金额 */
  initialCapital: number
  /** 交易手续费率（0-1 之间的小数，如 0.0003 表示万三） */
  transactionFeeRate: number
  /** 无风险利率，用于计算夏普比率等风险调整后收益指标 */
  riskFreeRate: number
  /** 基准指数代码，如 '000300.SH' 表示沪深300 */
  benchmarkSymbol: string
  /** 再平衡模式：
   * - 'threshold': 当资产偏离目标权重超过阈值时再平衡
   * - 'scheduled': 按固定频率再平衡
   * - 'dual': 结合阈值和频率两种方式 */
  rebalanceMode: 'threshold' | 'scheduled' | 'dual'
  /** 再平衡阈值（0-1 之间），当资产权重偏离超过此值时触发再平衡 */
  rebalanceThreshold: number
  /** 再平衡频率（用于 scheduled 或 dual 模式）：
   * - 'monthly': 每月再平衡
   * - 'quarterly': 每季度再平衡
   * - 'annually': 每年再平衡 */
  rebalanceFrequency: 'monthly' | 'quarterly' | 'annually'
  /** 是否使用真实市场数据（true=akshare，false=模拟数据） */
  useRealData: boolean
  /** 各资产类别的目标权重配置，权重之和应为 1 */
  assetWeights: AssetWeights
}

/**
 * 资产权重配置
 *
 * 定义永久投资组合中各类资产的权重分配
 */
export interface AssetWeights {
  /** 股票（沪深300指数）权重 */
  Stock_CSI300: number
  /** 股票（红利指数）权重 */
  Stock_Dividend: number
  /** 长期债券权重 */
  Bond_Long: number
  /** 中期债券权重 */
  Bond_Medium: number
  /** 黄金权重 */
  Gold: number
  /** 现金/货币基金权重 */
  Cash: number
}

// ==================== 响应类型 ====================

/**
 * 回测成功响应
 *
 * 当回测成功完成时返回的数据结构
 */
export interface BacktestResponse {
  /** 标识响应成功 */
  success: true
  /** 回测绩效指标 */
  metrics: PerformanceMetrics
  /** 图表数据（用于绘制净值曲线图） */
  chartData: ChartData
  /** 最终资产权重配置 */
  assetWeights: AssetWeights
}

/**
 * 回测失败响应
 *
 * 当回测发生错误时返回的数据结构
 */
export interface BacktestErrorResponse {
  /** 标识响应失败 */
  success: false
  /** 用户友好的错误信息 */
  error: string
  /** 错误类型分类（可选） */
  errorType?: ErrorType
  /** 具体错误代码（可选） */
  errorCode?: ErrorCode
}

/**
 * 错误类型枚举
 *
 * 用于分类错误的类型，便于前端进行针对性处理
 */
export type ErrorType =
  | 'CONFIG_ERROR'        // 配置错误（YAML 格式、参数无效等）
  | 'DATA_ERROR'          // 数据错误（获取市场数据失败）
  | 'CALCULATION_ERROR'   // 计算错误（回测引擎内部错误）
  | 'SYSTEM_ERROR'        // 系统错误（Python 脚本执行失败）
  | 'VALIDATION_ERROR'    // 验证错误（参数校验失败）

/**
 * 错误代码枚举
 *
 * 更具体的错误标识，用于精确识别错误原因
 */
export type ErrorCode =
  | 'INVALID_DATE_RANGE'      // 无效的日期范围
  | 'INVALID_CAPITAL'         // 无效的初始资金
  | 'DATA_FETCH_FAILED'       // 获取数据失败
  | 'BENCHMARK_NOT_FOUND'     // 基准指数不存在
  | 'PYTHON_EXECUTION_FAILED' // Python 脚本执行失败
  | 'FILE_WRITE_FAILED'       // 文件写入失败
  | 'CSV_PARSE_FAILED'        // CSV 解析失败
  | 'UNKNOWN_ERROR'           // 未知错误

// ==================== 绩效指标类型 ====================

/**
 * 回测绩效指标
 *
 * 衡量投资组合表现的各种风险收益指标
 */
export interface PerformanceMetrics {
  /** 总收益率：期末净值相对期初净值的增长百分比 */
  totalReturn: number
  /** 年化收益率：按年复利计算的收益率，便于不同期限比较 */
  annualReturn: number
  /** 年化波动率：收益率的标准差年化值，衡量风险程度 */
  annualVolatility: number
  /** 最大回撤：从峰值到谷底的最大跌幅，衡量极端风险 */
  maxDrawdown: number
  /** 夏普比率：(年化收益 - 无风险利率) / 年化波动率，风险调整后收益 */
  sharpeRatio: number
  /** 索提诺比率：(年化收益 - 无风险利率) / 下行波动率，只考虑下行风险 */
  sortinoRatio: number
  /** 胜率：取得正收益的交易日占比 */
  winRate: number
  /** 信息比率：组合超额收益 / 跟踪误差，衡量主动管理能力 */
  infoRatio: number
  /** 基准收益率：同期基准指数的总收益率 */
  benchmarkReturn: number
}

// ==================== 图表数据类型 ====================

/**
 * 图表数据
 *
 * 用于前端 Recharts 绑定的净值曲线数据
 */
export interface ChartData {
  /** 日期标签数组，对应 X 轴 */
  labels: string[]
  /** 组合净值数组，对应组合曲线 Y 轴 */
  portfolio: number[]
  /** 基准净值数组，对应基准曲线 Y 轴 */
  benchmark: number[]
  /** 各时点的资产权重数据，用于展示再平衡效果 */
  weights: WeightDataPoint[]
}

/**
 * 权重数据点
 *
 * 记录某一日期各资产的配置权重
 */
export interface WeightDataPoint {
  /** 记录日期，格式：YYYY-MM-DD */
  date: string
  /** 各资产在该日期的权重配置 */
  weights: {
    Stock_CSI300: number  // 股票（沪深300）权重
    Stock_Dividend: number// 股票（红利）权重
    Bond_Long: number     // 长期债券权重
    Bond_Medium: number   // 中期债券权重
    Gold: number          // 黄金权重
    Cash: number          // 现金权重
  }
}

// ==================== 历史记录类型 ====================

/**
 * 回测历史记录项
 *
 * 存储在 history.json 中的单条历史记录
 */
export interface BacktestHistoryItem {
  /** 唯一标识符，使用时间戳生成 */
  id: number
  /** 回测运行时间，ISO 格式字符串 */
  date: string
  /** 回测配置参数 */
  config: {
    startDate: string      // 开始日期
    endDate: string        // 结束日期
    initialCapital: number // 初始资金
    useRealData: boolean   // 是否使用真实数据
    rebalanceMode: string  // 再平衡模式
  }
  /** 资产权重配置 */
  assets: AssetWeights
  /** 回测绩效指标摘要（仅保存主要指标） */
  metrics: {
    totalReturn: number    // 总收益率
    annualReturn: number   // 年化收益率
    maxDrawdown: number    // 最大回撤
    sharpeRatio: number    // 夏普比率
  }
}

/**
 * 回测历史响应
 *
 * GET /api/backtest 接口的成功响应格式
 */
export interface BacktestHistoryResponse {
  /** 标识响应成功 */
  success: true
  /** 历史记录数组，按时间倒序排列 */
  history: BacktestHistoryItem[]
}

/**
 * 回测历史错误响应
 *
 * GET /api/backtest 接口的错误响应格式
 */
export interface BacktestHistoryErrorResponse {
  /** 标识响应失败 */
  success: false
  /** 错误信息 */
  error: string
}

// ==================== 前端状态类型 ====================

/**
 * 前端回测配置状态
 *
 * 用于前端组件管理回测表单的状态
 * 与 BacktestRequest 结构相同，便于前端使用
 */
export interface BacktestConfigState {
  /** 回测开始日期 */
  startDate: string
  /** 回测结束日期 */
  endDate: string
  /** 初始投资资金 */
  initialCapital: number
  /** 交易手续费率 */
  transactionFeeRate: number
  /** 无风险利率 */
  riskFreeRate: number
  /** 基准指数代码 */
  benchmarkSymbol: string
  /** 再平衡模式 */
  rebalanceMode: 'threshold' | 'scheduled' | 'dual'
  /** 再平衡阈值 */
  rebalanceThreshold: number
  /** 再平衡频率 */
  rebalanceFrequency: 'monthly' | 'quarterly' | 'annually'
  /** 是否使用真实市场数据 */
  useRealData: boolean
  /** 资产权重配置 */
  assetWeights: AssetWeights
}

/**
 * 回测运行状态
 *
 * 用于前端显示回测的执行状态
 */
export interface BacktestRunState {
  /** 是否正在运行回测 */
  isRunning: boolean
  /** 回测是否已完成（无论成功失败） */
  isComplete: boolean
  /** 错误信息（如果有） */
  error: string | null
}

// ==================== 工具函数 ====================

/**
 * 类型守卫：检查响应是否为错误响应
 *
 * 用于在类型 narrowing 时判断响应是否失败
 *
 * @param response - API 响应对象
 * @returns 如果是错误响应返回 true，否则返回 false
 */
export function isErrorResponse(
  response: BacktestResponse | BacktestErrorResponse
): response is BacktestErrorResponse {
  return !response.success
}

/**
 * 获取默认回测配置
 *
 * 返回一个预设的默认配置，用户可以在此基础上修改
 *
 * @returns 默认回测配置状态对象
 */
export function getDefaultConfig(): BacktestConfigState {
  return {
    // 默认回测时间范围：2018年至2023年
    startDate: '2018-01-01',
    endDate: '2023-12-31',
    // 默认初始资金：1万元
    initialCapital: 10000,
    // 默认交易费率：万三
    transactionFeeRate: 0.0003,
    // 默认无风险利率：2%
    riskFreeRate: 0.02,
    // 默认基准：沪深300指数
    benchmarkSymbol: '000300.SH',
    // 默认再平衡模式：双重模式（阈值+定时）
    rebalanceMode: 'dual',
    // 默认再平衡阈值：10%
    rebalanceThreshold: 0.10,
    // 默认再平衡频率：季度
    rebalanceFrequency: 'quarterly',
    // 默认使用模拟数据
    useRealData: false,
    // 默认资产权重配置（永久投资组合经典配置）
    assetWeights: {
      Stock_CSI300: 0.15,    // 股票（沪深300）：15%
      Stock_Dividend: 0.15,  // 股票（红利）：15%
      Bond_Long: 0.15,       // 长期债券：15%
      Bond_Medium: 0.10,     // 中期债券：10%
      Gold: 0.25,            // 黄金：25%
      Cash: 0.20             // 现金：20%
    }
  }
}

/**
 * 验证回测配置是否有效
 *
 * 在提交回测请求前，对配置参数进行校验
 *
 * @param config - 待验证的回测请求配置
 * @returns 验证结果，包含是否有效和错误信息列表
 */
export function validateConfig(config: BacktestRequest): ValidationResult {
  const errors: string[] = []

  // 验证 1：日期范围检查
  // 开始日期必须早于结束日期
  if (new Date(config.startDate) >= new Date(config.endDate)) {
    errors.push('开始日期必须早于结束日期')
  }

  // 验证 2：初始资金检查
  // 初始资金必须为正数
  if (config.initialCapital <= 0) {
    errors.push('初始资金必须大于 0')
  }

  // 验证 3：交易费率检查
  // 费率应在 0 到 1 之间
  if (config.transactionFeeRate < 0 || config.transactionFeeRate > 1) {
    errors.push('交易费率必须在 0 到 1 之间')
  }

  // 验证 4：资产权重总和检查
  // 所有资产权重之和应等于 1（允许微小误差 0.001）
  const totalWeight = Object.values(config.assetWeights).reduce((sum, w) => sum + w, 0)
  if (Math.abs(totalWeight - 1) > 0.001) {
    errors.push(`资产权重总和必须为 1，当前为 ${totalWeight.toFixed(4)}`)
  }

  return {
    isValid: errors.length === 0,  // 无错误即验证通过
    errors                         // 返回错误列表（可能为空）
  }
}

/**
 * 验证结果
 *
 * 由 validateConfig 函数返回的验证结果结构
 */
export interface ValidationResult {
  /** 配置是否有效 */
  isValid: boolean
  /** 验证错误信息列表（如果存在） */
  errors: string[]
}

/**
 * 错误分类器 - 将技术错误信息转换为用户友好的错误提示
 *
 * 当回测过程中发生异常时，根据错误信息判断错误类型，
 * 返回易于理解的错误消息和错误分类
 *
 * @param error - 错误信息字符串
 * @returns 包含错误类型、错误代码和用户提示的对象
 */
export function classifyError(error: string): {
  errorType: ErrorType
  errorCode: ErrorCode
  userMessage: string
} {
  // 转换为小写便于匹配
  const lowerError = error.toLowerCase()

  // 场景 1: 配置错误
  // 检查是否包含 config 或 yaml 相关的错误
  if (lowerError.includes('config') || lowerError.includes('yaml')) {
    return {
      errorType: 'CONFIG_ERROR',
      errorCode: 'UNKNOWN_ERROR',
      userMessage: '配置文件错误，请检查配置参数'
    }
  }

  // 场景 2: 数据获取错误
  // 检查是否包含 data、fetch 或 akshare 相关的错误
  if (lowerError.includes('data') || lowerError.includes('fetch') || lowerError.includes('akshare')) {
    // 进一步判断是基准数据还是资产数据
    if (lowerError.includes('benchmark')) {
      return {
        errorType: 'DATA_ERROR',
        errorCode: 'BENCHMARK_NOT_FOUND',
        userMessage: '无法获取基准数据，请尝试使用模拟数据'
      }
    }
    return {
      errorType: 'DATA_ERROR',
      errorCode: 'DATA_FETCH_FAILED',
      userMessage: '无法获取资产数据，请检查网络连接或尝试使用模拟数据'
    }
  }

  // 场景 3: Python 执行错误
  // 检查是否包含 python、exec 或 spawn 相关的错误
  if (lowerError.includes('python') || lowerError.includes('exec') || lowerError.includes('spawn')) {
    return {
      errorType: 'SYSTEM_ERROR',
      errorCode: 'PYTHON_EXECUTION_FAILED',
      userMessage: 'Python 脚本执行失败，请稍后重试'
    }
  }

  // 场景 4: 文件操作错误
  // 检查是否包含 file、ENOENT 或 not found 相关的错误
  if (lowerError.includes('file') || lowerError.includes('ENOENT') || lowerError.includes('not found')) {
    return {
      errorType: 'SYSTEM_ERROR',
      errorCode: 'FILE_WRITE_FAILED',
      userMessage: '文件操作失败，请检查权限或磁盘空间'
    }
  }

  // 场景 5: 默认错误处理
  // 对于无法分类的错误，返回通用错误信息
  return {
    errorType: 'UNKNOWN_ERROR',
    errorCode: 'UNKNOWN_ERROR',
    userMessage: error || '发生未知错误，请稍后重试'
  }
}
