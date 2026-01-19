# -*- coding: utf-8 -*-
"""
回测脚本模板
由 portfolio-web 前端自动生成

功能说明：
- 读取 YAML 配置文件
- 动态加载 portfolio-backtest 模块
- 执行回测计算并输出结果
"""

import sys
import importlib.util

# 配置 UTF-8 输出编码，确保 Windows 环境下中文正常显示
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import json
import yaml


def run_backtest(config_path: str, test_py_path: str, csv_path: str) -> dict:
    """
    运行回测并返回结果

    参数说明：
        config_path: YAML 配置文件路径，包含回测参数和数据源配置
        test_py_path: portfolio-backtest 模块的 test.py 文件路径
        csv_path: 输出 CSV 文件路径，用于保存每日净值数据

    返回值：
        包含以下键的字典：
        - metrics: 计算得到的各项绩效指标
        - tradingDays: 交易日数量
        - assetWeights: 最终的资产权重配置
    """
    # 步骤 1: 读取 YAML 配置文件
    # 从前端传递的临时配置文件读取回测参数
    with open(config_path, 'r', encoding='utf-8') as f:
        cfg = yaml.safe_load(f)

    # 步骤 2: 动态导入 portfolio-backtest 模块
    # 使用 importlib.util 避免与 Python 内置 test 模块冲突
    spec = importlib.util.spec_from_file_location("backtest_module", test_py_path)
    test_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(test_module)

    # 从模块中导出需要的类和函数
    ConfigManager = test_module.ConfigManager
    VectorizedBacktestEngine = test_module.VectorizedBacktestEngine
    PerformanceAnalyzer = test_module.PerformanceAnalyzer
    PermanentPortfolioStrategy = test_module.PermanentPortfolioStrategy
    DataManager = test_module.DataManager
    DEFAULT_TICKER_MAPPING = test_module.DEFAULT_TICKER_MAPPING

    # 步骤 3: 初始化回测组件
    # 配置管理器：解析 YAML 配置
    config = ConfigManager(config_path)
    backtest_config = config.get_backtest_config()      # 回测参数配置
    data_config = config.get_data_source_config()       # 数据源配置

    # 数据管理器：获取市场数据
    data_manager = DataManager(data_config, DEFAULT_TICKER_MAPPING)
    # 回测引擎：执行组合净值计算
    engine = VectorizedBacktestEngine(backtest_config)
    # 绩效分析器：计算各类风险收益指标
    analyzer = PerformanceAnalyzer(backtest_config.risk_free_rate)

    # 步骤 4: 获取资产权重配置
    # 优先使用前端传递的权重，其次使用默认值
    asset_weights = _get_asset_weights(cfg, config)

    # 步骤 5: 构建再平衡配置
    rebalance_config = {
        'mode': backtest_config.rebalance_mode,
        'threshold': backtest_config.rebalance_threshold,
        'frequency': backtest_config.rebalance_frequency
    }

    # 步骤 6: 创建永久投资组合策略
    strategy = PermanentPortfolioStrategy(
        config.get_strategy_config(asset_weights),
        rebalance_config
    )

    # 步骤 7: 获取资产价格数据
    # 获取策略中所有资产的历史价格数据
    price_data = data_manager.fetch_asset_data(
        list(strategy.config.asset_weights.keys()),
        backtest_config.start_date,
        backtest_config.end_date
    )

    # 步骤 8: 获取基准指数数据
    # 用于与组合表现进行对比
    benchmark_data = data_manager.fetch_benchmark_data(
        backtest_config.benchmark_symbol,
        backtest_config.start_date,
        backtest_config.end_date
    )

    # 步骤 9: 运行回测
    # 计算组合的净值曲线和交易记录
    results, _ = engine.run_backtest(price_data, strategy, backtest_config.initial_capital)

    # 步骤 10: 合并基准数据
    # 如果成功获取基准数据，运行基准回测并合并结果
    if benchmark_data is not None and not benchmark_data.empty:
        benchmark_results = engine.run_benchmark_backtest(benchmark_data, backtest_config.initial_capital)
        results['Benchmark'] = benchmark_results['Benchmark']

    # 步骤 11: 计算绩效指标
    # 计算总收益、年化收益、夏普比率、最大回撤等
    performance = analyzer.calculate_all_metrics(results)

    # 步骤 12: 保存结果到 CSV
    # 包含日期、组合净值、基准净值、各资产权重等信息
    results.to_csv(csv_path, encoding='utf-8-sig')

    # 步骤 13: 返回结果给前端
    # 将 numpy 类型转换为 Python 原生类型
    return {
        'metrics': _convert_metrics(performance),
        'tradingDays': len(results),
        'assetWeights': _convert_weights(strategy.config.asset_weights)
    }


def _get_asset_weights(cfg: dict, config) -> dict:
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
    # 永久投资组合的默认权重配置
    default_weights = {
        'Stock_CSI300': 0.15,    # 股票（沪深300）：15%
        'Stock_Dividend': 0.15,  # 股票（红利）：15%
        'Bond_Long': 0.15,       # 长期债券：15%
        'Bond_Medium': 0.10,     # 中期债券：10%
        'Gold': 0.25,            # 黄金：25%
        'Cash': 0.20             # 现金：20%
    }
    # 从 YAML 配置中获取，如果没有则使用默认值
    return cfg.get('asset_weights', default_weights)


def _convert_metrics(performance: dict) -> dict:
    """
    将 numpy 类型转换为 Python 原生类型

    确保返回给前端的 JSON 数据不包含 numpy 类型

    参数说明：
        performance: 包含 numpy 类型值的绩效指标字典

    返回值：
        所有值都转换为 Python 原生类型的字典
    """
    result = {}
    for key, value in performance.items():
        try:
            # 尝试转换为 float，numpy 的 float64 也可以转换
            result[key] = float(value)
        except (TypeError, ValueError):
            # 如果无法转换（如已经是字符串），保持原值
            result[key] = value
    return result


def _convert_weights(weights: dict) -> dict:
    """
    将权重值转换为 Python 浮点数

    参数说明：
        weights: 资产权重字典，值可能是 numpy 类型

    返回值：
        所有值都是 Python float 类型的字典
    """
    return {k: float(v) for k, v in weights.items()}


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
    test_py_path = sys.argv[2]  # portfolio-backtest 模块路径
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
        error_info = {
            'error': str(e),
            'error_type': type(e).__name__
        }
        print(json.dumps({'success': False, **error_info}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
