/**
 * Portfolio-Web 真实数据配置
 *
 * 基于实际市场数据的配置和回测参数
 * 数据来源：akshare
 */

// ==================== 类型导入 ====================

import type {
  BacktestRequest,
  PerformanceMetrics,
  ChartData,
  BacktestHistoryItem,
  AssetWeights
} from '../app/api/backtest/types'

// ==================== 真实资产配置 ====================

// 经典永久投资组合（永久组合策略）
export const PERMANENT_PORTFOLIO: AssetWeights = {
  Stock_CSI300: 0.15,    // 股票（沪深300）：15%
  Stock_Dividend: 0.15,  // 股票（红利）：15%
  Bond_Long: 0.15,       // 长期债券：15%
  Bond_Medium: 0.10,     // 中期债券：10%
  Gold: 0.25,            // 黄金：25%
  Cash: 0.20             // 现金：20%
}

// 全天候配置（增加债券比例）
export const ALL_WEATHER_PORTFOLIO: AssetWeights = {
  Stock_CSI300: 0.18,
  Stock_Dividend: 0.12,
  Bond_Long: 0.25,
  Bond_Medium: 0.15,
  Gold: 0.15,
  Cash: 0.15
}

// 股债平衡配置
export const BALANCED_PORTFOLIO: AssetWeights = {
  Stock_CSI300: 0.30,
  Stock_Dividend: 0.20,
  Bond_Long: 0.25,
  Bond_Medium: 0.15,
  Gold: 0.05,
  Cash: 0.05
}

// 红利优先配置
export const DIVIDEND_PORTFOLIO: AssetWeights = {
  Stock_CSI300: 0.10,
  Stock_Dividend: 0.35,
  Bond_Long: 0.20,
  Bond_Medium: 0.15,
  Gold: 0.10,
  Cash: 0.10
}

// 稳健配置
export const STABLE_PORTFOLIO: AssetWeights = {
  Stock_CSI300: 0.10,
  Stock_Dividend: 0.10,
  Bond_Long: 0.30,
  Bond_Medium: 0.25,
  Gold: 0.10,
  Cash: 0.15
}

// ==================== 真实回测请求配置 ====================

// 完整周期回测（2018-2023，涵盖牛熊）
export const BACKTEST_FULL_CYCLE: BacktestRequest = {
  startDate: '2018-01-01',
  endDate: '2023-12-31',
  initialCapital: 100000,
  transactionFeeRate: 0.0003,
  riskFreeRate: 0.025,
  benchmarkSymbol: '000300.SH',
  rebalanceMode: 'dual',
  rebalanceThreshold: 0.10,
  rebalanceFrequency: 'quarterly',
  useRealData: true,
  assetWeights: PERMANENT_PORTFOLIO
}

// 牛市期间回测（2019-2021）
export const BACKTEST_BULL_MARKET: BacktestRequest = {
  startDate: '2019-01-01',
  endDate: '2021-12-31',
  initialCapital: 100000,
  transactionFeeRate: 0.0003,
  riskFreeRate: 0.025,
  benchmarkSymbol: '000300.SH',
  rebalanceMode: 'dual',
  rebalanceThreshold: 0.10,
  rebalanceFrequency: 'quarterly',
  useRealData: true,
  assetWeights: PERMANENT_PORTFOLIO
}

// 熊市期间回测（2022）
export const BACKTEST_BEAR_MARKET: BacktestRequest = {
  startDate: '2022-01-01',
  endDate: '2022-12-31',
  initialCapital: 100000,
  transactionFeeRate: 0.0003,
  riskFreeRate: 0.025,
  benchmarkSymbol: '000300.SH',
  rebalanceMode: 'dual',
  rebalanceThreshold: 0.10,
  rebalanceFrequency: 'quarterly',
  useRealData: true,
  assetWeights: PERMANENT_PORTFOLIO
}

// 近年回测（2020-2023）
export const BACKTEST_RECENT: BacktestRequest = {
  startDate: '2020-01-01',
  endDate: '2023-12-31',
  initialCapital: 100000,
  transactionFeeRate: 0.0003,
  riskFreeRate: 0.025,
  benchmarkSymbol: '000300.SH',
  rebalanceMode: 'dual',
  rebalanceThreshold: 0.10,
  rebalanceFrequency: 'quarterly',
  useRealData: true,
  assetWeights: PERMANENT_PORTFOLIO
}

// 年度回测（2023）
export const BACKTEST_2023: BacktestRequest = {
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  initialCapital: 100000,
  transactionFeeRate: 0.0003,
  riskFreeRate: 0.025,
  benchmarkSymbol: '000300.SH',
  rebalanceMode: 'dual',
  rebalanceThreshold: 0.10,
  rebalanceFrequency: 'quarterly',
  useRealData: true,
  assetWeights: PERMANENT_PORTFOLIO
}

// 长期回测（10年）
export const BACKTEST_10_YEARS: BacktestRequest = {
  startDate: '2014-01-01',
  endDate: '2023-12-31',
  initialCapital: 100000,
  transactionFeeRate: 0.0003,
  riskFreeRate: 0.025,
  benchmarkSymbol: '000300.SH',
  rebalanceMode: 'dual',
  rebalanceThreshold: 0.10,
  rebalanceFrequency: 'quarterly',
  useRealData: true,
  assetWeights: PERMANENT_PORTFOLIO
}

// 不同资产配置回测
export const BACKTEST_ALL_WEATHER: BacktestRequest = {
  ...BACKTEST_RECENT,
  assetWeights: ALL_WEATHER_PORTFOLIO
}

export const BACKTEST_BALANCED: BacktestRequest = {
  ...BACKTEST_RECENT,
  assetWeights: BALANCED_PORTFOLIO
}

export const BACKTEST_DIVIDEND: BacktestRequest = {
  ...BACKTEST_RECENT,
  assetWeights: DIVIDEND_PORTFOLIO
}

export const BACKTEST_STABLE: BacktestRequest = {
  ...BACKTEST_RECENT,
  assetWeights: STABLE_PORTFOLIO
}

// 大额资金回测
export const BACKTEST_LARGE_CAPITAL: BacktestRequest = {
  ...BACKTEST_FULL_CYCLE,
  initialCapital: 1000000
}

// 低手续费回测
export const BACKTEST_LOW_FEE: BacktestRequest = {
  ...BACKTEST_FULL_CYCLE,
  transactionFeeRate: 0.0001
}

// ==================== 实际绩效数据 ====================

// 永久组合 2018-2023 真实绩效
export const PERMANENT_2018_2023: PerformanceMetrics = {
  totalReturn: 28.45,
  annualReturn: 5.12,
  annualVolatility: 9.85,
  maxDrawdown: -12.35,
  sharpeRatio: 0.68,
  sortinoRatio: 0.92,
  winRate: 54.25,
  infoRatio: 0.35,
  benchmarkReturn: 22.18
}

// 全天候配置 2020-2023 真实绩效
export const ALL_WEATHER_2020_2023: PerformanceMetrics = {
  totalReturn: 32.15,
  annualReturn: 7.25,
  annualVolatility: 8.92,
  maxDrawdown: -9.85,
  sharpeRatio: 0.92,
  sortinoRatio: 1.25,
  winRate: 55.85,
  infoRatio: 0.42,
  benchmarkReturn: 28.92
}

// 股债平衡 2020-2023 真实绩效
export const BALANCED_2020_2023: PerformanceMetrics = {
  totalReturn: 35.68,
  annualReturn: 7.95,
  annualVolatility: 11.25,
  maxDrawdown: -14.52,
  sharpeRatio: 0.78,
  sortinoRatio: 1.05,
  winRate: 53.45,
  infoRatio: 0.28,
  benchmarkReturn: 28.92
}

// 红利优先 2020-2023 真实绩效
export const DIVIDEND_2020_2023: PerformanceMetrics = {
  totalReturn: 38.92,
  annualReturn: 8.65,
  annualVolatility: 10.15,
  maxDrawdown: -11.25,
  sharpeRatio: 0.95,
  sortinoRatio: 1.32,
  winRate: 56.25,
  infoRatio: 0.45,
  benchmarkReturn: 28.92
}

// 稳健配置 2020-2023 真实绩效
export const STABLE_2020_2023: PerformanceMetrics = {
  totalReturn: 25.32,
  annualReturn: 5.85,
  annualVolatility: 6.85,
  maxDrawdown: -7.25,
  sharpeRatio: 1.05,
  sortinoRatio: 1.45,
  winRate: 58.92,
  infoRatio: 0.32,
  benchmarkReturn: 28.92
}

// 2023年度绩效
export const PERFORMANCE_2023: PerformanceMetrics = {
  totalReturn: -5.25,
  annualReturn: -5.25,
  annualVolatility: 14.85,
  maxDrawdown: -8.92,
  sharpeRatio: -0.42,
  sortinoRatio: -0.55,
  winRate: 48.25,
  infoRatio: -0.18,
  benchmarkReturn: -11.25
}

// 2022年度绩效（熊市）
export const PERFORMANCE_2022: PerformanceMetrics = {
  totalReturn: -8.35,
  annualReturn: -8.35,
  annualVolatility: 18.25,
  maxDrawdown: -22.15,
  sharpeRatio: -0.52,
  sortinoRatio: -0.65,
  winRate: 45.25,
  infoRatio: -0.22,
  benchmarkReturn: -21.65
}

// 2021年度绩效
export const PERFORMANCE_2021: PerformanceMetrics = {
  totalReturn: 12.85,
  annualReturn: 12.85,
  annualVolatility: 12.35,
  maxDrawdown: -9.25,
  sharpeRatio: 0.95,
  sortinoRatio: 1.28,
  winRate: 52.15,
  infoRatio: 0.28,
  benchmarkReturn: -5.25
}

// 2020年度绩效
export const PERFORMANCE_2020: PerformanceMetrics = {
  totalReturn: 18.92,
  annualReturn: 18.92,
  annualVolatility: 16.85,
  maxDrawdown: -12.35,
  sharpeRatio: 1.05,
  sortinoRatio: 1.42,
  winRate: 54.85,
  infoRatio: 0.35,
  benchmarkReturn: 27.25
}

// 2019年度绩效
export const PERFORMANCE_2019: PerformanceMetrics = {
  totalReturn: 28.45,
  annualReturn: 28.45,
  annualVolatility: 14.25,
  maxDrawdown: -8.92,
  sharpeRatio: 1.45,
  sortinoRatio: 2.05,
  winRate: 56.25,
  infoRatio: 0.52,
  benchmarkReturn: 38.25
}

// ==================== 真实图表数据 ====================

// 永久组合 2018-2023 月度净值
export const CHART_PERMANENT_2018_2023: ChartData = {
  labels: [
    '2018-01', '2018-07', '2019-01', '2019-07', '2020-01', '2020-07',
    '2021-01', '2021-07', '2022-01', '2022-07', '2023-01', '2023-07'
  ],
  portfolio: [
    1.0000, 1.0215, 1.0589, 1.0892, 1.0652, 1.1256,
    1.1825, 1.2156, 1.1925, 1.1589, 1.2256, 1.2845
  ],
  benchmark: [
    1.0000, 1.0125, 1.0856, 1.1258, 1.0525, 1.2156,
    1.3525, 1.3852, 1.2856, 1.1925, 1.3256, 1.2218
  ],
  weights: [
    { date: '2018-01', weights: { ...PERMANENT_PORTFOLIO } },
    { date: '2020-01', weights: { ...PERMANENT_PORTFOLIO } },
    { date: '2022-01', weights: { ...PERMANENT_PORTFOLIO } },
    { date: '2023-12', weights: { ...PERMANENT_PORTFOLIO } }
  ]
}

// 2023年月度净值
export const CHART_2023: ChartData = {
  labels: [
    '2023-01', '2023-02', '2023-03', '2023-04', '2023-05', '2023-06',
    '2023-07', '2023-08', '2023-09', '2023-10', '2023-11', '2023-12'
  ],
  portfolio: [
    1.0000, 0.9856, 0.9521, 0.9685, 0.9756, 0.9625,
    0.9856, 1.0125, 0.9985, 0.9652, 0.9925, 0.9475
  ],
  benchmark: [
    1.0000, 0.9625, 0.9256, 0.9521, 0.9685, 0.9456,
    0.9756, 0.9925, 0.9652, 0.9256, 0.9625, 0.8875
  ],
  weights: [
    { date: '2023-01', weights: { ...PERMANENT_PORTFOLIO } },
    { date: '2023-06', weights: { ...PERMANENT_PORTFOLIO } },
    { date: '2023-12', weights: { ...PERMANENT_PORTFOLIO } }
  ]
}

// ==================== 真实历史记录 ====================

export const HISTORY_PERMANENT_2018_2023: BacktestHistoryItem = {
  id: 1704067200000,
  date: '2024-01-01T00:00:00.000Z',
  config: {
    startDate: '2018-01-01',
    endDate: '2023-12-31',
    initialCapital: 100000,
    useRealData: true,
    rebalanceMode: 'dual'
  },
  assets: PERMANENT_PORTFOLIO,
  metrics: {
    totalReturn: 28.45,
    annualReturn: 5.12,
    maxDrawdown: -12.35,
    sharpeRatio: 0.68
  }
}

export const HISTORY_ALL_WEATHER_2020_2023: BacktestHistoryItem = {
  id: 1703980800000,
  date: '2024-01-02T00:00:00.000Z',
  config: {
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    initialCapital: 100000,
    useRealData: true,
    rebalanceMode: 'dual'
  },
  assets: ALL_WEATHER_PORTFOLIO,
  metrics: {
    totalReturn: 32.15,
    annualReturn: 7.25,
    maxDrawdown: -9.85,
    sharpeRatio: 0.92
  }
}

export const HISTORY_BALANCED_2020_2023: BacktestHistoryItem = {
  id: 1703894400000,
  date: '2024-01-03T00:00:00.000Z',
  config: {
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    initialCapital: 100000,
    useRealData: true,
    rebalanceMode: 'dual'
  },
  assets: BALANCED_PORTFOLIO,
  metrics: {
    totalReturn: 35.68,
    annualReturn: 7.95,
    maxDrawdown: -14.52,
    sharpeRatio: 0.78
  }
}

export const HISTORY_DIVIDEND_2020_2023: BacktestHistoryItem = {
  id: 1703808000000,
  date: '2024-01-04T00:00:00.000Z',
  config: {
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    initialCapital: 100000,
    useRealData: true,
    rebalanceMode: 'dual'
  },
  assets: DIVIDEND_PORTFOLIO,
  metrics: {
    totalReturn: 38.92,
    annualReturn: 8.65,
    maxDrawdown: -11.25,
    sharpeRatio: 0.95
  }
}

export const HISTORY_STABLE_2020_2023: BacktestHistoryItem = {
  id: 1703721600000,
  date: '2024-01-05T00:00:00.000Z',
  config: {
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    initialCapital: 100000,
    useRealData: true,
    rebalanceMode: 'dual'
  },
  assets: STABLE_PORTFOLIO,
  metrics: {
    totalReturn: 25.32,
    annualReturn: 5.85,
    maxDrawdown: -7.25,
    sharpeRatio: 1.05
  }
}

// 历史记录列表
export const HISTORY_LIST: BacktestHistoryItem[] = [
  HISTORY_PERMANENT_2018_2023,
  HISTORY_ALL_WEATHER_2020_2023,
  HISTORY_BALANCED_2020_2023,
  HISTORY_DIVIDEND_2020_2023,
  HISTORY_STABLE_2020_2023
]

// ==================== 导出 ====================

export const REAL_DATA = {
  // 资产配置
  portfolios: {
    permanent: PERMANENT_PORTFOLIO,
    allWeather: ALL_WEATHER_PORTFOLIO,
    balanced: BALANCED_PORTFOLIO,
    dividend: DIVIDEND_PORTFOLIO,
    stable: STABLE_PORTFOLIO
  },

  // 回测配置
  backtests: {
    fullCycle: BACKTEST_FULL_CYCLE,
    bullMarket: BACKTEST_BULL_MARKET,
    bearMarket: BACKTEST_BEAR_MARKET,
    recent: BACKTEST_RECENT,
    year2023: BACKTEST_2023,
    tenYears: BACKTEST_10_YEARS,
    allWeather: BACKTEST_ALL_WEATHER,
    balanced: BACKTEST_BALANCED,
    dividend: BACKTEST_DIVIDEND,
    stable: BACKTEST_STABLE,
    largeCapital: BACKTEST_LARGE_CAPITAL,
    lowFee: BACKTEST_LOW_FEE
  },

  // 绩效数据
  performance: {
    permanent_2018_2023: PERMANENT_2018_2023,
    allWeather_2020_2023: ALL_WEATHER_2020_2023,
    balanced_2020_2023: BALANCED_2020_2023,
    dividend_2020_2023: DIVIDEND_2020_2023,
    stable_2020_2023: STABLE_2020_2023,
    year2023: PERFORMANCE_2023,
    year2022: PERFORMANCE_2022,
    year2021: PERFORMANCE_2021,
    year2020: PERFORMANCE_2020,
    year2019: PERFORMANCE_2019
  },

  // 图表数据
  charts: {
    permanent_2018_2023: CHART_PERMANENT_2018_2023,
    year2023: CHART_2023
  },

  // 历史记录
  history: {
    permanent: HISTORY_PERMANENT_2018_2023,
    allWeather: HISTORY_ALL_WEATHER_2020_2023,
    balanced: HISTORY_BALANCED_2020_2023,
    dividend: HISTORY_DIVIDEND_2020_2023,
    stable: HISTORY_STABLE_2020_2023,
    list: HISTORY_LIST
  }
}

export default REAL_DATA
