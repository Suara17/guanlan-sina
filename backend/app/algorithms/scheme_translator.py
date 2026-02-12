"""
技术指标到商业指标的转换层 (The Bridge)

将技术优化结果(搬运成本、完工时间等)转换为商业决策指标(总成本、工期、预期收益)
"""

import numpy as np
import math


class SchemeTranslator:
    """技术指标 -> 商业指标转换器"""

    def __init__(self, industry_type: str, params: dict):
        """
        初始化转换器

        参数:
            industry_type: 行业类型 ('light' 或 'heavy')
            params: 商业参数字典
        """
        self.industry_type = industry_type

        # 通用参数
        self.P_unit = params.get('P_unit', 20000)  # 每日产值
        self.base_cost = params.get('base_cost', 50000)  # 基础成本
        self.initial_perf = params.get('initial_perf', 0)  # 初始性能基准

        # 轻工业特定参数
        self.construction_rate = params.get('construction_rate', 3000)  # 施工效率
        self.benefit_multiplier_light = params.get('benefit_multiplier', 200)  # 收益乘数

        # 重工业特定参数
        self.debug_base_time = params.get('debug_time', 5)  # 基础调试时间
        self.software_cost = params.get('software_cost', 100000)  # 软件成本
        self.benefit_multiplier_heavy = params.get('benefit_multiplier', 50000)  # 收益乘数

    def translate(self, technical_solutions: list) -> tuple:
        """
        将技术优化结果转换为商业指标

        参数:
            technical_solutions: 技术方案列表,每个方案包含 f1, f2, f3 等技术指标

        返回:
            (business_data, original_indices)
            - business_data: numpy数组,形状为 (n, 3),列为 [总成本, 工期, 预期收益]
            - original_indices: 原始索引列表,用于追溯到技术方案
        """
        business_data = []
        original_indices = []

        # [重工业专用] 预计算极值,用于拉开方案差距
        if self.industry_type != 'light' and len(technical_solutions) > 0:
            all_makespans = [s['f1'] for s in technical_solutions]
            min_make = min(all_makespans)
            max_make = max(all_makespans)
            make_range = max_make - min_make if max_make != min_make else 1.0

        for idx, sol in enumerate(technical_solutions):

            # =========== 逻辑分支 A: 轻工业 (车间布局) ===========
            if self.industry_type == 'light':
                tech_handling_cost = sol['f1']  # 搬运成本 (量)
                tech_moving_cost = sol['f2']  # 移动设备成本 (元)

                # 1. 计算工期 (T_imp)
                raw_days = tech_moving_cost / self.construction_rate
                t_imp = max(3.0, min(30.0, raw_days))  # 约束: 3-30天

                # 2. 计算成本
                c_direct = tech_moving_cost + self.base_cost  # 直接成本
                c_indirect = t_imp * (self.P_unit * 0.5)  # 间接成本(半停产)
                final_cost = c_direct + c_indirect

                # 3. 计算收益
                diff = self.initial_perf - tech_handling_cost
                if diff <= 0:
                    continue  # 过滤无效解
                benefit = diff * self.benefit_multiplier_light

            # =========== 逻辑分支 B: 重工业 (AGV调度) ===========
            else:
                tech_makespan = sol['f1']  # 完工时间
                tech_bottleneck = sol['f2']  # 瓶颈利用率

                # 1. 计算收益
                time_saved = max(0, self.initial_perf - tech_makespan)
                benefit = time_saved * self.benefit_multiplier_heavy

                if benefit <= 1000:
                    continue  # 过滤低收益方案

                # 2. 计算成本 (引入性能溢价)
                score_rank = (max_make - tech_makespan) / make_range
                premium_factor = math.pow(score_rank * 10, 3.5) * 50
                c_direct = self.base_cost + self.software_cost + premium_factor

                # 3. 计算工期 (瓶颈的非线性影响)
                congestion_penalty = math.pow(tech_bottleneck * 10, 2.5) * 0.05
                t_imp = self.debug_base_time + congestion_penalty

                # 间接成本 (不停产调试,系数0.1)
                c_indirect = t_imp * (self.P_unit * 0.1)
                final_cost = c_direct + c_indirect

            business_data.append([final_cost, t_imp, benefit])
            original_indices.append(idx)

        return np.array(business_data), original_indices
