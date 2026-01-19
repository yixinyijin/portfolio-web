'use client'

/**
 * 永久投资组合回测系统 - 前端页面
 *
 * 功能：
 * - 配置回测参数（日期、资金、再平衡设置）
 * - 调整资产配置权重
 * - 执行回测并显示结果
 * - 查看历史回测记录
 */

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'

// 资产配置常量
// 定义永久投资组合中的六种资产类别
const ASSETS = [
  { key: 'Stock_CSI300', name: '股票(沪深300)', color: '#ef4444', default: 15 },  // 沪深300指数
  { key: 'Stock_Dividend', name: '股票(红利)', color: '#f97316', default: 15 },    // 红利指数
  { key: 'Bond_Long', name: '债券(长期)', color: '#22c55e', default: 15 },         // 长期国债
  { key: 'Bond_Medium', name: '债券(中期)', color: '#14b8a6', default: 10 },       // 中期债券
  { key: 'Gold', name: '黄金', color: '#eab308', default: 25 },                    // 黄金
  { key: 'Cash', name: '现金', color: '#6366f1', default: 20 },                    // 现金/货币基金
]

// 指标卡片组件
function MetricCard({ label, value, color = 'gray' }: { label: string; value: string; color?: string }) {
  const colorClass = color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-primary-600'
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  )
}

export default function Home() {
  // ==================== 状态管理 ====================
  // 回测配置状态
  const [config, setConfig] = useState({
    startDate: '2018-01-01',           // 回测开始日期
    endDate: '2023-12-31',             // 回测结束日期
    initialCapital: 10000,             // 初始资金
    transactionFeeRate: 0.0003,        // 交易费率（万三）
    riskFreeRate: 0.02,                // 无风险利率
    benchmarkSymbol: '000300.SH',      // 基准指数（沪深300）
    rebalanceMode: 'dual',             // 再平衡模式
    rebalanceThreshold: 0.10,          // 再平衡阈值
    rebalanceFrequency: 'quarterly',   // 再平衡频率
    useRealData: false,                // 是否使用真实数据
    assetWeights: {                    // 资产权重配置
      Stock_CSI300: 0.15,
      Stock_Dividend: 0.15,
      Bond_Long: 0.15,
      Bond_Medium: 0.10,
      Gold: 0.25,
      Cash: 0.20
    }
  })

  // 加载状态
  const [loading, setLoading] = useState(false)
  // 回测结果状态
  const [result, setResult] = useState<any>(null)
  // 历史记录状态
  const [history, setHistory] = useState<any[]>([])
  // 是否显示历史面板
  const [showHistory, setShowHistory] = useState(false)

  // ==================== 副作用 ====================
  // 页面加载时获取历史记录
  useEffect(() => {
    fetchHistory()
  }, [])

  // ==================== 功能函数 ====================

  /**
   * 获取回测历史记录
   */
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/backtest')
      const data = await res.json()
      if (data.success) setHistory(data.history || [])
    } catch (error) {
      console.error('获取历史记录失败:', error)
    }
  }

  /**
   * 更新资产权重
   * @param key - 资产类型键名
   * @param value - 新的权重百分比（0-100）
   */
  const updateWeight = (key: string, value: number) => {
    setConfig({
      ...config,
      assetWeights: { ...config.assetWeights, [key]: value / 100 }
    })
  }

  /**
   * 计算当前权重总和（百分比）
   */
  const totalWeight = Object.values(config.assetWeights).reduce((a, b) => a + b, 0) * 100

  /**
   * 执行回测
   * 发送配置到后端 API，运行 Python 回测引擎
   */
  const runBacktest = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        // 回测成功，保存结果并刷新历史
        setResult(data)
        fetchHistory()
      } else {
        // 回测失败，显示错误信息
        alert('错误: ' + data.error)
      }
    } catch (error: any) {
      alert('错误: ' + error.message)
    }
    setLoading(false)
  }

  /**
   * 加载历史记录项
   * 将历史配置应用到当前表单
   */
  const loadHistoryItem = (item: any) => {
    setConfig({
      ...config,
      startDate: item.config.startDate,
      endDate: item.config.endDate,
      initialCapital: item.config.initialCapital,
      rebalanceMode: item.config.rebalanceMode,
      assetWeights: item.assets
    })
    setShowHistory(false)
  }

  /**
   * 转换图表数据格式
   * 将后端返回的数据转换为 Recharts 需要的格式
   */
  const chartData = result?.chartData?.labels?.map((label: string, i: number) => ({
    date: label,
    portfolio: result.chartData.portfolio[i],
    benchmark: result.chartData.benchmark[i] || null
  })) || []

  // ==================== 渲染界面 ====================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">永久投资组合回测系统</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          {showHistory ? '关闭历史' : '回测历史'}
        </button>
      </div>

      {/* 回测历史面板 - 展开时显示 */}
      {showHistory && (
        <div className="mb-8 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">回测历史 (最近10条)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">日期</th>
                  <th className="text-left py-2">期间</th>
                  <th className="text-left py-2">本金</th>
                  <th className="text-right py-2">总收益</th>
                  <th className="text-right py-2">年化</th>
                  <th className="text-right py-2">夏普</th>
                  <th className="text-right py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="py-2">{item.config.startDate} ~ {item.config.endDate}</td>
                    <td className="py-2">¥{item.config.initialCapital?.toLocaleString()}</td>
                    <td className={`py-2 text-right ${item.metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.metrics.totalReturn?.toFixed(2)}%
                    </td>
                    <td className="py-2 text-right">{item.metrics.annualReturn?.toFixed(2)}%</td>
                    <td className="py-2 text-right">{item.metrics.sharpeRatio?.toFixed(2)}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => loadHistoryItem(item)}
                        className="text-primary-600 hover:underline"
                      >
                        加载
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ==================== 左侧配置面板 ==================== */}
        <div className="lg:col-span-1 space-y-6">
          {/* 基本配置区域 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">基本配置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">开始日期</label>
                <input
                  type="date"
                  value={config.startDate}
                  onChange={e => setConfig({...config, startDate: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">结束日期</label>
                <input
                  type="date"
                  value={config.endDate}
                  onChange={e => setConfig({...config, endDate: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">初始本金 (元)</label>
                <input
                  type="number"
                  value={config.initialCapital}
                  onChange={e => setConfig({...config, initialCapital: Number(e.target.value)})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useRealData"
                  checked={config.useRealData}
                  onChange={e => setConfig({...config, useRealData: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="useRealData" className="text-sm">使用真实数据 (akshare)</label>
              </div>
            </div>
          </div>

          {/* 资产配置滑块区域 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">资产配置</h2>
              <span className={`text-sm ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                总计: {totalWeight.toFixed(0)}%
              </span>
            </div>
            <div className="space-y-4">
              {ASSETS.map(asset => (
                <div key={asset.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: asset.color }}
                      ></span>
                      {asset.name}
                    </span>
                    <span>{(config.assetWeights[asset.key as keyof typeof config.assetWeights] * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={(config.assetWeights[asset.key as keyof typeof config.assetWeights] || 0) * 100}
                    onChange={(e) => updateWeight(asset.key, Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 再平衡设置区域 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">再平衡设置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">模式</label>
                <select
                  value={config.rebalanceMode}
                  onChange={e => setConfig({...config, rebalanceMode: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="threshold">阈值触发</option>
                  <option value="scheduled">定时触发</option>
                  <option value="dual">双重触发</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">触发阈值</label>
                <input
                  type="number"
                  step="0.05"
                  value={config.rebalanceThreshold}
                  onChange={e => setConfig({...config, rebalanceThreshold: Number(e.target.value)})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">频率</label>
                <select
                  value={config.rebalanceFrequency}
                  onChange={e => setConfig({...config, rebalanceFrequency: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="monthly">每月</option>
                  <option value="quarterly">每季度</option>
                  <option value="annually">每年</option>
                </select>
              </div>
            </div>
          </div>

          {/* 运行回测按钮 */}
          <button
            onClick={runBacktest}
            disabled={loading || totalWeight !== 100}
            className="w-full py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
          >
            {loading ? '运行中...' : '运行回测'}
          </button>
        </div>

        {/* ==================== 右侧结果面板 ==================== */}
        <div className="lg:col-span-2">
          {result ? (
            <>
              {/* 绩效指标卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MetricCard label="总收益" value={`${result.metrics.totalReturn.toFixed(2)}%`} color={result.metrics.totalReturn >= 0 ? 'green' : 'red'} />
                <MetricCard label="年化收益" value={`${result.metrics.annualReturn.toFixed(2)}%`} color={result.metrics.annualReturn >= 0 ? 'green' : 'red'} />
                <MetricCard label="年化波动" value={`${result.metrics.annualVolatility.toFixed(2)}%`} />
                <MetricCard label="最大回撤" value={`${result.metrics.maxDrawdown.toFixed(2)}%`} color="red" />
                <MetricCard label="夏普比率" value={result.metrics.sharpeRatio.toFixed(2)} />
                <MetricCard label="Sortino" value={result.metrics.sortinoRatio.toFixed(2)} />
                <MetricCard label="胜率" value={`${result.metrics.winRate.toFixed(2)}%`} />
                <MetricCard label="信息比率" value={result.metrics.infoRatio.toFixed(2)} />
              </div>

              {/* 收益对比和资产配置卡片 */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold mb-2">策略 vs 基准</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600">
                      {result.metrics.totalReturn > 0 ? '+' : ''}{result.metrics.totalReturn.toFixed(2)}%
                    </div>
                    <div className="text-gray-500">策略总收益</div>
                  </div>
                  <div className="text-center mt-4">
                    <div className="text-2xl">
                      {result.metrics.totalReturn > result.metrics.benchmarkReturn ? '↑ 超越' : '↓ 落后'}
                    </div>
                    <div className="text-gray-500">
                      基准: {result.metrics.benchmarkReturn > 0 ? '+' : ''}{result.metrics.benchmarkReturn.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold mb-2">当前资产配置</h3>
                  <div className="space-y-2">
                    {Object.entries(result.assetWeights || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span>{key.replace('_', ' ')}</span>
                        <span>{(value as number * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 净值曲线图 */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <h3 className="font-bold mb-4">净值曲线</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="portfolio"
                      name="组合净值"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.1}
                    />
                    {chartData.some(d => d.benchmark) && (
                      <Area
                        type="monotone"
                        dataKey="benchmark"
                        name="沪深300"
                        stroke="#9ca3af"
                        fill="transparent"
                        strokeDasharray="5 5"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            // 空状态提示
            <div className="bg-white rounded-xl p-12 shadow-sm text-center text-gray-500">
              <p className="text-lg mb-2">配置参数后点击「运行回测」</p>
              <p className="text-sm">支持真实数据/模拟数据切换，资产配置滑块</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
