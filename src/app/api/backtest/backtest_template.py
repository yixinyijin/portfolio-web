# -*- coding: utf-8 -*-
"""
永久投资组合回测脚本
由 portfolio-web 前端自动生成

功能说明：
- 读取 YAML 配置文件
- 生成模拟数据进行回测
- 计算绩效指标并输出结果
"""

import sys
import os

# 配置 UTF-8 输出编码，确保 Windows 环境下中文正常显示
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import json
import yaml
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import numpy as np
import pandas as pd


# ==================== 配置管理 ====================

@dataclass
class BacktestConfig:
    """回测配置数据类"""
    start_date: str
    end_date: str
    initial_capital: float
    transaction_fee_rate: float
    risk_free_rate: float
    benchmark_symbol: str
    rebalance_mode: str
    rebalance_threshold: float
    rebalance_frequency: str


@dataclass
class DataSourceConfig:
    """数据源配置"""
    primary: str
    fallback: str
    cache_enabled: bool


class ConfigManager:
    """配置管理器 - 解析 YAML 配置文件"""

    def __init__(self, config_path: str):
        self.config_path = config_path
        self._config = Nonela

    def _load_config(self) -> Dict:
        """加载 YAML 配置"""
        with open(self.config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)

    def get_backtest_config(self) -> BacktestConfig:
        """获取回测配置"""
        cfg = self._load_config()
        backtest = cfg['backtest']
        return BacktestConfig(
            start_date=backtest['start_date'],
            end_date=backtest['end_date'],
            initial_capital=backtest['initial_capital'],
            transaction_fee_rate=backtest['transaction_fee_rate'],
            risk_free_rate=backtest['risk_free_rate'],
            benchmark_symbol=backtest['benchmark_symbol'],
            rebalance_mode=backtest['rebalance_mode'],
            rebalance_threshold=backtest['rebalance_threshold'],
            rebalance_frequency=backtest['rebalance_frequency']
        )

    def get_data_source_config(self) -> DataSourceConfig:
        """获取数据源配置"""
        cfg = self._load_config()
        data = cfg.get('data_source', {})
        return DataSourceConfig(
            primary=data.get('primary', 'mock'),
            fallback=data.get('fallback', 'mock'),
            cache_enabled=data.get('cache_enabled', False)
        )

    def get_strategy_config(self, asset_weights: Dict[str, float]) -> Dict:
        """获取策略配置"""
        return {'asset_weights': asset_weights}@


# ==================== 数据管理 ====================

# 默认标的代码映射
DEFAULT_TICKER_MAPPING = {
    'Stock_CSI300': '000300.SH',
    'Stock_Dividend': '000015.SH',
    'Bond_Long': '000012.SH',
    'Bond_Medium': '000011.SH',
    'Gold': 'AU9999.SHF',
    'Cash': 'CASH'
}


class DataManager:
    """数据管理器 - 获取资产价格数据"""

    def __init__(self, config: DataSourceConfig, ticker_mapping: Dict[str, str]):
        self.config = config
        self.ticker_mapping = ticker_mapping

    def _generate_mock_prices(self, start_date: str, end_date: str, asset_key: str) -> pd.DataFrame:
        """生成模拟价格数据"""
        # 解析日期
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')

        # 生成交易日（工作日）
        dates = []
        current = start
        while current <= end:
            if current.weekday() < 5:  # 周一到周五
                dates.append(current)
            current += timedelta(days=1)

        # 根据资产类型设置不同的收益率参数
        asset_params = {
            'Stock_CSI300': {'mu': 0.08, 'sigma': 0.25},    # 股票：高收益高波动
            'Stock_Dividend': {'mu': 0.06, 'sigma': 0.18},   # 红利：中等收益波动
            'Bond_Long': {'mu': 0.03, 'sigma': 0.05},       # 长期债券：低收益低波动
            'Bond_Medium': {'mu': 0.025, 'sigma': 0.03},    # 中期债券：更低波动
            'Gold': {'mu': 0.04, 'sigma': 0.15},            # 黄金：中等收益
            'Cash': {'mu': 0.02, 'sigma': 0.005}            # 现金：稳定低收益
        }

        params = asset_params.get(asset_key, {'mu': 0.05, 'sigma': 0.15})

        # 生成价格路径（几何布朗运动）
        np.random.seed(hash(asset_key) % 2**32)  # 不同资产不同随机种子
        n = len(dates)
        dt = 1 / 252  # 日频率

        # 初始价格设为 1.0
        prices = [1.0]
        returns = np.random.normal(params['mu'] * dt, params['sigma'] * math.sqrt(dt), n)
        for r in returns:
            new_price = prices[-1] * math.exp(r)
            prices.append(new_price)

        # 创建 DataFrame
        df = pd.DataFrame({
            'Date': dates,
            'Close': prices[1:]
        })
        df['Date'] = pd.to_datetime(df['Date'])

        return df

    def _generate_mock_benchmark(self, start_date: str, end_date: str) -> pd.DataFrame:
        """生成模拟基准数据（沪深300）"""
        # 解析日期
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')

        # 生成交易日
        dates = []
        current = start
        while current <= end:
            if current.weekday() < 5:
                dates.append(current)
            current += timedelta(days=1)

        # 沪深300 的收益参数
        np.random.seed(42)  # 固定种子
        n = len(dates)
        dt = 1 / 252
        mu = 0.06  # 年化收益
        sigma = 0.22  # 年化波动

        prices = [1.0]
        returns = np.random.normal(mu * dt, sigma * math.sqrt(dt), n)
        for r in returns:
            new_price = prices[-1] * math.exp(r)
            prices.append(new_price)

        df = pd.DataFrame({
            'Date': dates,
            'Close': prices[1:]
        })
        df['Date'] = pd.to_datetime(df['Date'])

        return df

    def fetch_asset_data(self, asset_keys: List[str], start_date: str, end_date: str) -> pd.DataFrame:
        """获取多个资产的价格数据"""
        if self.config.primary == 'mock' or self.config.fallback == 'mock':
            # 使用模拟数据
            all_data = []
            for key in asset_keys:
                prices = self._generate_mock_prices(start_date, end_date, key)
                prices['Asset'] = key
                prices['Ticker'] = self.ticker_mapping.get(key, key)
                all_data.append(prices)

            if all_data:
                # 合并数据
                combined = pd.concat(all_data, ignore_index=True)
                # 透视成宽格式
                pivot = combined.pivot_table(index='Date', columns='Asset', values='Close')
                return pivot.sort_index()

        return pd.DataFrame()

    def fetch_benchmark_data(self, symbol: str, start_date: str, end_date: str) -> Optional[pd.DataFrame]:
        """获取基准指数数据"""
        if self.config.primary == 'mock' or self.config.fallback == 'mock':
            return self._generate_mock_benchmark(start_date, end_date)
        return None


# ==================== 策略定义 ====================

class PermanentPortfolioStrategy:
    """永久投资组合策略"""

    def __init__(self, config: Dict, rebalance_config: Dict):
        self.config = config
        self.rebalance_config = rebalance_config
        self.asset_weights = config.get('asset_weights', {})

    def get_target_weights(self) -> Dict[str, float]:
        """获取目标权重"""
        return self.asset_weights.copy()

    def need_rebalance(self, current_weights: Dict[str, float], target_weights: Dict[str, float]) -> bool:
        """判断是否需要再平衡"""
        mode = self.rebalance_config.get('mode', 'threshold')

        if mode == 'threshold':
            # 阈值模式：检查任意资产偏离程度
            for asset, target in target_weights.items():
                current = current_weights.get(asset, 0)
                threshold = self.rebalance_config.get('threshold', 0.05)
                if abs(current - target) > threshold:
                    return True
        elif mode == 'scheduled':
            # 定时模式由外部控制
            return True
        elif mode == 'dual':
            # 双重模式
            threshold = self.rebalance_config.get('threshold', 0.05)
            for asset, target in target_weights.items():
                current = current_weights.get(asset, 0)
                if abs(current - target) > threshold:
                    return True

        return False


# ==================== 回测引擎 ====================

class VectorizedBacktestEngine:
    """向量化回测引擎"""

    def __init__(self, config: BacktestConfig):
        self.config = config
        self.transaction_fee_rate = config.transaction_fee_rate

    def run_backtest(self, price_data: pd.DataFrame, strategy: PermanentPortfolioStrategy,
                     initial_capital: float) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        执行回测

        Args:
            price_data: 价格数据 DataFrame (日期 x 资产)
            strategy: 投资策略
            initial_capital: 初始资金

        Returns:
            (results, transactions) 元组
        """
        if price_data.empty:
            raise ValueError("价格数据为空")

        assets = list(price_data.columns)
        dates = list(price_data.index)

        # 初始化
        n = len(dates)
        portfolio_values = np.zeros(n)
        cash = np.zeros(n)
        holdings = np.zeros(len(assets))

        # 初始资金分配
        target_weights = strategy.get_target_weights()
        for i, asset in enumerate(assets):
            holdings[i] = initial_capital * target_weights.get(asset, 0) / price_data.iloc[0][asset]

        # 组合价值和现金
        portfolio_values[0] = initial_capital
        cash[0] = 0

        # 记录每日持仓比例
        weight_history = []

        # 从第2天开始遍历
        for t in range(1, n):
            # 计算当前持仓价值
            asset_values = holdings * price_data.iloc[t].values
            total_value = np.sum(asset_values) + cash[t-1]

            # 计算当前权重
            current_weights = {}
            for i, asset in enumerate(assets):
                if total_value > 0:
                    current_weights[asset] = asset_values[i] / total_value
                else:
                    current_weights[asset] = 0

            weight_history.append(current_weights.copy())

            # 检查是否需要再平衡
            if strategy.need_rebalance(current_weights, target_weights):
                # 再平衡：卖出现在持有的，买入目标配置
                for i, asset in enumerate(assets):
                    current_value = holdings[i] * price_data.iloc[t][asset]
                    target_value = total_value * target_weights.get(asset, 0)

                    diff = target_value - current_value

                    if diff > 0:
                        # 买入
                        shares_to_buy = diff / price_data.iloc[t][asset]
                        fee = diff * self.transaction_fee_rate
                        holdings[i] += shares_to_buy
                        cash[t] = cash[t-1] - diff - fee
                    elif diff < 0:
                        # 卖出
                        shares_to_sell = -diff / price_data.iloc[t][asset]
                        proceeds = -diff
                        fee = proceeds * self.transaction_fee_rate
                        holdings[i] -= shares_to_sell
                        cash[t] = cash[t-1] + proceeds - fee
            else:
                cash[t] = cash[t-1]

            # 计算新的组合价值
            new_asset_values = holdings * price_data.iloc[t].values
            portfolio_values[t] = np.sum(new_asset_values) + cash[t]

        # 构建结果 DataFrame
        results = pd.DataFrame({
            'Portfolio': portfolio_values
        }, index=dates)

        # 添加日期列
        results['Date'] = [d.strftime('%Y-%m-%d') for d in dates]

        return results, pd.DataFrame()

    def run_benchmark_backtest(self, benchmark_data: pd.DataFrame, initial_capital: float) -> pd.DataFrame:
        """运行基准回测"""
        if benchmark_data.empty:
            raise ValueError("基准数据为空")

        dates = list(benchmark_data.index)
        prices = benchmark_data['Close'].values

        # 计算净值
        initial_price = prices[0]
        nav = prices / initial_price * initial_capital

        results = pd.DataFrame({
            'Benchmark': nav
        }, index=dates)

        return results


# ==================== 绩效分析 ====================

class PerformanceAnalyzer:
    """绩效分析器"""

    def __init__(self, risk_free_rate: float = 0.02):
        self.risk_free_rate = risk_free_rate

    def _calculate_returns(self, values: np.ndarray) -> np.ndarray:
        """计算收益率序列"""
        returns = np.zeros(len(values))
        returns[1:] = (values[1:] - values[:-1]) / values[:-1]
        return returns

    def _annualize(self, value: float, periods_per_year: int) -> float:
        """年化"""
        if value <= -1:
            return -1
        return (1 + value) ** (periods_per_year / (len(self._calculate_returns(np.array([1, 1 + value])))))

    def calculate_all_metrics(self, results: pd.DataFrame) -> Dict[str, float]:
        """计算所有绩效指标"""
        metrics = {}

        # 交易日数量（一年约252个）
        trading_days = len(results)
        periods_per_year = 252

        if 'Portfolio' in results:
            portfolio = results['Portfolio'].values

            # 总收益率
            total_return = (portfolio[-1] - portfolio[0]) / portfolio[0]
            metrics['Total_Return'] = total_return

            # 年化收益率
            years = trading_days / periods_per_year
            if years > 0:
                annual_return = (1 + total_return) ** (1 / years) - 1
            else:
                annual_return = 0
            metrics['Annual_Return'] = annual_return

            # 计算收益率序列
            returns = self._calculate_returns(portfolio)

            # 年化波动率
            daily_volatility = np.std(returns, ddof=1)
            annual_volatility = daily_volatility * math.sqrt(periods_per_year)
            metrics['Annual_Volatility'] = annual_volatility

            # 最大回撤
            cumulative = portfolio / portfolio[0]
            running_max = np.maximum.accumulate(cumulative)
            drawdowns = (cumulative - running_max) / running_max
            max_drawdown = np.min(drawdowns)
            metrics['Max_Drawdown'] = max_drawdown

            # 夏普比率
            daily_rf = self.risk_free_rate / periods_per_year
            excess_returns = returns - daily_rf
            if np.std(excess_returns) > 0:
                sharpe = np.mean(excess_returns) / np.std(excess_returns) * math.sqrt(periods_per_year)
            else:
                sharpe = 0
            metrics['Sharpe_Ratio'] = sharpe

            # 索提诺比率（只考虑下行风险）
            negative_returns = returns[returns < 0]
            if len(negative_returns) > 0:
                downside_vol = np.std(negative_returns, ddof=1) * math.sqrt(periods_per_year)
            else:
                downside_vol = annual_volatility

            if downside_vol > 0:
                sortino = (annual_return - self.risk_free_rate) / downside_vol
            else:
                sortino = 0
            metrics['Sortino_Ratio'] = sortino

            # 胜率
            win_rate = np.sum(returns > 0) / len(returns[returns != 0]) if len(returns[returns != 0]) > 0 else 0
            metrics['Win_Rate'] = win_rate

            # 信息比率（相对于基准）
            if 'Benchmark' in results:
                benchmark = results['Benchmark'].values
                benchmark_returns = self._calculate_returns(benchmark)

                # 跟踪误差
                tracking_error = np.std(returns - benchmark_returns) * math.sqrt(periods_per_year)

                # 超额收益
                excess = annual_return - self.risk_free_rate

                if tracking_error > 0:
                    info_ratio = excess / tracking_error
                else:
                    info_ratio = 0
                metrics['Info_Ratio'] = info_ratio

                # 基准收益率
                benchmark_total = (benchmark[-1] - benchmark[0]) / benchmark[0]
                metrics['Benchmark_Return'] = benchmark_total
            else:
                metrics['Info_Ratio'] = 0
                metrics['Benchmark_Return'] = 0
        else:
            # 默认值
            metrics = {
                'Total_Return': 0,
                'Annual_Return': 0,
                'Annual_Volatility': 0,
                'Max_Drawdown': 0,
                'Sharpe_Ratio': 0,
                'Sortino_Ratio': 0,
                'Win_Rate': 0,
                'Info_Ratio': 0,
                'Benchmark_Return': 0
            }

        return metrics


# ==================== 辅助函数 ====================

def _get_asset_weights(cfg: Dict, config) -> Dict:
    """
    获取资产权重配置

    优先使用前端传递的权重配置，
    如果没有提供则使用永久投资组合的默认配置

    参数说明：
        cfg: YAML 配置解析后的字典
        config: ConfigManager 实例

    返回值：
        资产名称到权重的映射字典
    """
    default_weights = {
        'Stock_CSI300': 0.15,
        'Stock_Dividend': 0.15,
        'Bond_Long': 0.15,
        'Bond_Medium': 0.10,
        'Gold': 0.25,
        'Cash': 0.20
    }
    return cfg.get('asset_weights', default_weights)


def _convert_metrics(performance: Dict) -> Dict:
    """
    将 numpy 类型转换为 Python 原生类型

    确保返回给前端的 JSON 数据不包含 numpy 类型或 NaN

    参数说明：
        performance: 包含 numpy 类型值的绩效指标字典

    返回值：
        所有值都转换为 Python 原生类型的字典
    """
    result = {}
    for key, value in performance.items():
        try:
            # 转换为 float
            float_val = float(value)
            # 检查是否是 NaN
            if math.isnan(float_val):
                result[key] = 0.0
            else:
                result[key] = float_val
        except (TypeError, ValueError):
            result[key] = value
    return result


def _convert_weights(weights: Dict) -> Dict:
    """
    将权重值转换为 Python 浮点数

    参数说明：
        weights: 资产权重字典，值可能是 numpy 类型

    返回值：
        所有值都是 Python float 类型的字典
    """
    return {k: float(v) for k, v in weights.items()}


# ==================== 主函数 ====================

def run_backtest(config_path: str, test_py_path: str, csv_path: str) -> Dict:
    """
    运行回测并返回结果

    参数说明：
        config_path: YAML 配置文件路径
        test_py_path: 保留参数（向后兼容）
        csv_path: 输出 CSV 文件路径

    返回值：
        包含以下键的字典：
        - metrics: 计算得到的各项绩效指标
        - tradingDays: 交易日数量
        - assetWeights: 最终的资产权重配置
    """
    # 步骤 1: 读取 YAML 配置文件
    with open(config_path, 'r', encoding='utf-8') as f:
        cfg = yaml.safe_load(f)

    # 步骤 2: 初始化组件（不再依赖外部模块）
    config = ConfigManager(config_path)
    backtest_config = config.get_backtest_config()
    data_config = config.get_data_source_config()

    data_manager = DataManager(data_config, DEFAULT_TICKER_MAPPING)
    engine = VectorizedBacktestEngine(backtest_config)
    analyzer = PerformanceAnalyzer(backtest_config.risk_free_rate)

    # 步骤 3: 获取资产权重配置
    asset_weights = _get_asset_weights(cfg, config)

    # 步骤 4: 构建再平衡配置
    rebalance_config = {
        'mode': backtest_config.rebalance_mode,
        'threshold': backtest_config.rebalance_threshold,
        'frequency': backtest_config.rebalance_frequency
    }

    # 步骤 5: 创建永久投资组合策略
    strategy = PermanentPortfolioStrategy(
        config.get_strategy_config(asset_weights),
        rebalance_config
    )

    # 步骤 6: 获取资产价格数据
    price_data = data_manager.fetch_asset_data(
        list(strategy.config['asset_weights'].keys()),
        backtest_config.start_date,
        backtest_config.end_date
    )

    # 步骤 7: 获取基准数据
    benchmark_data = data_manager.fetch_benchmark_data(
        backtest_config.benchmark_symbol,
        backtest_config.start_date,
        backtest_config.end_date
    )

    # 步骤 8: 运行回测
    results, _ = engine.run_backtest(price_data, strategy, backtest_config.initial_capital)

    # 步骤 9: 合并基准数据
    if benchmark_data is not None and not benchmark_data.empty:
        benchmark_results = engine.run_benchmark_backtest(benchmark_data, backtest_config.initial_capital)
        results['Benchmark'] = benchmark_results['Benchmark']

    # 步骤 10: 计算绩效指标
    performance = analyzer.calculate_all_metrics(results)

    # 步骤 11: 添加权重数据到结果
    results['Stock_CSI300'] = asset_weights.get('Stock_CSI300', 0.15)
    results['Stock_Dividend'] = asset_weights.get('Stock_Dividend', 0.15)
    results['Bond_Long'] = asset_weights.get('Bond_Long', 0.15)
    results['Bond_Medium'] = asset_weights.get('Bond_Medium', 0.10)
    results['Gold'] = asset_weights.get('Gold', 0.25)
    results['Cash'] = asset_weights.get('Cash', 0.20)

    # 步骤 12: 保存结果到 CSV
    results.to_csv(csv_path, encoding='utf-8-sig', index=False)

    # 步骤 13: 返回结果给前端
    return {
        'metrics': _convert_metrics(performance),
        'tradingDays': len(results),
        'assetWeights': _convert_weights(asset_weights)
    }


def main():
    """
    主入口函数

    接收命令行参数并执行回测
    使用 __RESULT_START__ 和 __RESULT_END__ 标记输出结果，
    便于 Node.js 端解析
    """
    # 检查命令行参数数量
    if len(sys.argv) < 4:
        print(json.dumps({
            'error': '缺少必要参数',
            'usage': 'python backtest_template.py <config_path> <test_py_path> <csv_path>'
        }), file=sys.stderr)
        sys.exit(1)

    # 解析命令行参数
    config_path = sys.argv[1]   # YAML 配置文件路径
    test_py_path = sys.argv[2]  # 保留参数（向后兼容）
    csv_path = sys.argv[3]      # 输出 CSV 文件路径

    try:
        # 执行回测
        result = run_backtest(config_path, test_py_path, csv_path)

        # 输出结果，使用标记包裹便于解析
        print('__RESULT_START__')
        print(json.dumps(result, ensure_ascii=False))
        print('__RESULT_END__')

    except Exception as e:
        # 捕获异常并输出错误信息
        import traceback
        error_info = {
            'error': str(e),
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc()
        }
        print(json.dumps({'success': False, **error_info}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
