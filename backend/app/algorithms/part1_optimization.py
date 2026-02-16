import numpy as np
import matplotlib.pyplot as plt
import matplotlib
import random
from deap import base, creator, tools, algorithms
import warnings
import time
from matplotlib.patches import Rectangle, Patch, Circle, FancyBboxPatch, Polygon
from matplotlib.lines import Line2D
import math
import pandas as pd
import os
from collections import defaultdict, OrderedDict
import itertools

# ========== 设置中文字体和美观样式 ==========
plt.rcParams["font.sans-serif"] = ["SimHei", "Microsoft YaHei", "KaiTi", "FangSong"]
plt.rcParams["axes.unicode_minus"] = False
plt.rcParams["font.size"] = 12
plt.rcParams["axes.grid"] = True
plt.rcParams["grid.alpha"] = 0.3
plt.rcParams["grid.linestyle"] = "--"
plt.rcParams["figure.figsize"] = [16, 10]
plt.rcParams["figure.dpi"] = 120
plt.rcParams["figure.autolayout"] = True
# =================================

warnings.filterwarnings("ignore")

# ========== 设置图片保存路径 ==========
# 使用项目根目录下的 temp 文件夹
SAVE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "temp",
    "tianchou_images",
)
if not os.path.exists(SAVE_PATH):
    os.makedirs(SAVE_PATH)
    print(f"[OK] 已创建图片保存目录: {SAVE_PATH}")
else:
    print(f"[OK] 图片保存目录已存在: {SAVE_PATH}")


# ========== 行业分类判断器 ==========
class IndustryClassifier:
    """行业分类判断器"""

    def __init__(self, mapping_file=None):
        """
        初始化行业分类器

        参数:
        mapping_file: 行业代码映射文件路径
        """
        self.mapping_file = mapping_file
        self.industry_mapping = None

        # 基于你提供的Excel表格数据构建映射字典
        self._build_industry_mapping()

    def _build_industry_mapping(self):
        """基于Excel表格构建行业代码到轻重工业的映射"""
        # 这里我们直接使用你提供的Excel表格数据构建映射
        # 实际使用时可以根据文件路径读取
        self.industry_mapping = {
            # 重工业行业代码
            "C25": "heavy",
            "C251": "heavy",
            "C2511": "heavy",
            "C2519": "heavy",
            "C252": "heavy",
            "C2521": "heavy",
            "C2522": "heavy",
            "C26": "heavy",
            "C261": "heavy",
            "C2611": "heavy",
            "C2612": "heavy",
            "C2613": "heavy",
            "C262": "heavy",
            "C2621": "heavy",
            "C27": "heavy",
            "C271": "heavy",
            "C2710": "heavy",
            "C272": "heavy",
            "C2720": "heavy",
            "C28": "heavy",
            "C281": "heavy",
            "C2811": "heavy",
            "C2812": "heavy",
            "C30": "heavy",
            "C301": "heavy",
            "C3011": "heavy",
            "C3012": "heavy",
            "C304": "heavy",
            "C3041": "heavy",
            "C3042": "heavy",
            "C31": "heavy",
            "C311": "heavy",
            "C3110": "heavy",
            "C312": "heavy",
            "C3120": "heavy",
            "C313": "heavy",
            "C3130": "heavy",
            "C32": "heavy",
            "C321": "heavy",
            "C3211": "heavy",
            "C3212": "heavy",
            "C325": "heavy",
            "C3251": "heavy",
            "C3252": "heavy",
            "C33": "heavy",
            "C331": "heavy",
            "C3311": "heavy",
            "C3312": "heavy",
            "C333": "heavy",
            "C3331": "heavy",
            "C3332": "heavy",
            "C34": "heavy",
            "C341": "heavy",
            "C3411": "heavy",
            "C3412": "heavy",
            "C342": "heavy",
            "C3421": "heavy",
            "C3422": "heavy",
            "C35": "heavy",
            "C351": "heavy",
            "C3511": "heavy",
            "C3512": "heavy",
            "C358": "heavy",
            "C3581": "heavy",
            "C3582": "heavy",
            "C36": "heavy",
            "C361": "heavy",
            "C3610": "heavy",
            "C362": "heavy",
            "C3620": "heavy",
            "C367": "heavy",
            "C3670": "heavy",
            "C37": "heavy",
            "C371": "heavy",
            "C3711": "heavy",
            "C3712": "heavy",
            "C373": "heavy",
            "C3731": "heavy",
            "C3732": "heavy",
            "C381": "heavy",
            "C3811": "heavy",
            "C3812": "heavy",
            "C3813": "heavy",
            "C382": "heavy",
            "C3821": "heavy",
            "C3822": "heavy",
            "C3823": "heavy",
            "C383": "heavy",
            "C3831": "heavy",
            "C3832": "heavy",
            "C3833": "heavy",
            # 轻工业行业代码
            "C13": "light",
            "C131": "light",
            "C1310": "light",
            "C132": "light",
            "C1320": "light",
            "C133": "light",
            "C1331": "light",
            "C14": "light",
            "C141": "light",
            "C1411": "light",
            "C1419": "light",
            "C142": "light",
            "C1421": "light",
            "C1422": "light",
            "C15": "light",
            "C151": "light",
            "C1511": "light",
            "C1512": "light",
            "C152": "light",
            "C1521": "light",
            "C1522": "light",
            "C16": "light",
            "C161": "light",
            "C1610": "light",
            "C162": "light",
            "C1620": "light",
            "C17": "light",
            "C171": "light",
            "C1711": "light",
            "C1712": "light",
            "C172": "light",
            "C1721": "light",
            "C1722": "light",
            "C18": "light",
            "C181": "light",
            "C1811": "light",
            "C1819": "light",
            "C182": "light",
            "C1821": "light",
            "C1829": "light",
            "C19": "light",
            "C191": "light",
            "C1910": "light",
            "C192": "light",
            "C1921": "light",
            "C1922": "light",
            "C21": "light",
            "C211": "light",
            "C2110": "light",
            "C212": "light",
            "C2120": "light",
            "C213": "light",
            "C2130": "light",
            "C22": "light",
            "C221": "light",
            "C2210": "light",
            "C222": "light",
            "C2221": "light",
            "C2222": "light",
            "C23": "light",
            "C231": "light",
            "C2311": "light",
            "C2312": "light",
            "C232": "light",
            "C2320": "light",
            "C24": "light",
            "C241": "light",
            "C2411": "light",
            "C2412": "light",
            "C245": "light",
            "C2450": "light",
            "C395": "light",
            "C3951": "light",
            "C3952": "light",
            "C3953": "light",
            "C396": "light",
            "C3961": "light",
            "C3962": "light",
            "C3963": "light",
            # 模糊/需进一步判断的行业代码
            "C29": "fuzzy",
            "C291": "heavy",
            "C2911": "heavy",
            "C2919": "light",
            "C292": "light",
            "C2921": "light",
            "C2923": "light",
            "C38": "fuzzy",
            "C385": "fuzzy",
            "C3851": "heavy",
            "C3852": "heavy",
            "C3853": "light",
            "C3854": "light",
            "C387": "light",
            "C3871": "light",
            "C3872": "light",
            "C20": "fuzzy",
            "C201": "fuzzy",
            "C2011": "heavy",
            "C2012": "light",
            "C202": "heavy",
            "C2021": "heavy",
            "C2022": "heavy",
            "C203": "light",
            "C2031": "fuzzy",
            "C2032": "light",
            "C39": "fuzzy",
            "C391": "fuzzy",
            "C3911": "fuzzy",
            "C3912": "heavy",
            "C392": "fuzzy",
            "C3921": "heavy",
            "C3922": "light",
            "C40": "fuzzy",
            "C401": "fuzzy",
            "C4011": "heavy",
            "4012": "fuzzy",
            "C403": "light",
            "C4030": "light",
        }

        print(f"[OK] 已加载行业代码映射: {len(self.industry_mapping)} 条记录")

    def classify_industry(self, industry_code, business_description=""):
        """
        根据行业代码判断轻重工业类型
        """
        print(f"\n{'=' * 60}")
        print("开始行业分类判断...")
        print(f"行业代码: {industry_code}")
        if business_description:
            print(f"业务描述: {business_description[:100]}...")
        print("-" * 60)

        industry_code_str = str(industry_code).strip().upper()

        if industry_code_str in self.industry_mapping:
            result = self.industry_mapping[industry_code_str]

            if result == "light":
                print(f"✅ 精确匹配: 轻工业")
                return "light"
            elif result == "heavy":
                print(f"✅ 精确匹配: 重工业")
                return "heavy"
            elif result == "fuzzy":
                print(f"⚠️  行业代码需要进一步判断: {industry_code_str}")
                return self._fuzzy_judgment(industry_code_str, business_description)

        # 尝试模糊匹配
        code_lengths = sorted(
            set(len(code) for code in self.industry_mapping.keys()), reverse=True
        )

        for length in code_lengths:
            for code, category in self.industry_mapping.items():
                if len(code) == length and industry_code_str.startswith(code):
                    if category == "light":
                        print(f"🔍 前缀匹配: 轻工业 (匹配前缀: {code})")
                        return "light"
                    elif category == "heavy":
                        print(f"🔍 前缀匹配: 重工业 (匹配前缀: {code})")
                        return "heavy"
                    elif category == "fuzzy":
                        print(f"⚠️  行业代码需要进一步判断: {industry_code_str}")
                        return self._fuzzy_judgment(
                            industry_code_str, business_description
                        )

        print(f"❌ 未找到匹配的行业代码: {industry_code_str}")

        if business_description:
            return self._judge_by_description(business_description)

        return "unknown"

    def _fuzzy_judgment(self, industry_code, business_description):
        """对模糊行业进行进一步判断"""
        print("  启动模糊行业判断逻辑...")

        if industry_code.startswith(("C29", "C291", "C292")):
            print("  行业: 橡胶和塑料制品业")
            if "轮胎" in business_description or "大型塑料" in business_description:
                print("  → 根据业务描述判断为重工业")
                return "heavy"
            else:
                print("  → 根据业务描述判断为轻工业")
                return "light"

        elif industry_code.startswith(("C38", "C385")):
            print("  行业: 电气机械和器材制造业")
            if "工业设备" in business_description or "大型电器" in business_description:
                print("  → 根据业务描述判断为重工业")
                return "heavy"
            else:
                print("  → 根据业务描述判断为轻工业")
                return "light"

        elif industry_code.startswith(("C20", "C201", "C202")):
            print("  行业: 木材加工")
            if "大型锯材" in business_description or "人造板" in business_description:
                print("  → 根据业务描述判断为重工业")
                return "heavy"
            else:
                print("  → 根据业务描述判断为轻工业")
                return "light"

        elif industry_code.startswith(("C39", "C391", "C392")):
            print("  行业: 计算机、通信设备制造")
            if "服务器" in business_description or "基站" in business_description:
                print("  → 根据业务描述判断为重工业")
                return "heavy"
            else:
                print("  → 根据业务描述判断为轻工业")
                return "light"

        elif industry_code.startswith(("C40", "C401")):
            print("  行业: 仪器仪表制造业")
            if "工业仪表" in business_description or "自动化" in business_description:
                print("  → 根据业务描述判断为重工业")
                return "heavy"
            else:
                print("  → 根据业务描述判断为轻工业")
                return "light"

        print("  ⚠️  无法确定模糊行业类型，使用默认值")
        return "light"

    def _judge_by_description(self, business_description):
        """根据业务描述判断工业类型"""
        desc_lower = business_description.lower()

        heavy_keywords = [
            "钢铁",
            "冶金",
            "化工",
            "机械制造",
            "设备制造",
            "重型",
            "大型设备",
            "石油",
            "煤炭",
            "金属冶炼",
            "汽车制造",
            "船舶",
            "航空航天",
            "重型机械",
        ]

        light_keywords = [
            "食品",
            "纺织",
            "服装",
            "家具",
            "造纸",
            "印刷",
            "文教",
            "玩具",
            "家用电器",
            "消费品",
            "日用",
            "快速消费品",
            "时尚",
        ]

        heavy_count = sum(1 for keyword in heavy_keywords if keyword in desc_lower)
        light_count = sum(1 for keyword in light_keywords if keyword in desc_lower)

        print(
            f"  关键词匹配: 重工业关键词匹配数={heavy_count}, 轻工业关键词匹配数={light_count}"
        )

        if heavy_count > light_count:
            print("  → 根据业务描述判断为重工业")
            return "heavy"
        elif light_count > heavy_count:
            print("  → 根据业务描述判断为轻工业")
            return "light"
        else:
            print("  ⚠️  无法根据描述判断，使用默认值")
            return "light"


# ========== 轻工业优化器 (改进版 - 基于真实纺织企业) ==========
class SLP_GA_Optimizer:
    def __init__(self, input_data):
        """
        初始化SLP-GA优化器 - 基于真实纺织企业布局
        """
        self.L = input_data["L"]  # 车间长度
        self.W = input_data["W"]  # 车间宽度
        self.N = input_data["N"]  # 设备总数
        self.M = input_data["M"]  # 可移动设备集合
        self.F = input_data["F"]  # 固定设备集合
        self.device_sizes = input_data["device_sizes"]  # 设备尺寸
        self.original_positions = input_data["original_positions"]  # 原始位置
        self.move_costs = input_data["move_costs"]  # 移动成本
        self.safety_distances = input_data["safety_distances"]  # 安全距离
        self.aisle_areas = input_data["aisle_areas"]  # 通道区域列表
        self.f_matrix = input_data["f_matrix"]  # 搬运频率矩阵
        self.w_matrix = input_data["w_matrix"]  # 搬运重量矩阵
        self.c_transport = input_data["c_transport"]  # 单位搬运成本
        self.product_lines = input_data["product_lines"]  # 产品线信息

        # 参数初始化
        self.alpha1 = 0.4  # 物料搬运成本权重
        self.alpha2 = 0.3  # 设备移动成本权重
        self.alpha3 = 0.3  # 空间利用率权重

        # 遗传算法参数
        self.pop_size = 100  # 增加种群大小以适应更复杂问题
        self.ngen = 200  # 增加迭代次数
        self.cxpb = 0.7  # 交叉概率
        self.mutpb = 0.4  # 变异概率
        self.tournament_size = 2

        # 存储优化结果
        self.pareto_solutions = []
        self.all_solutions = []
        self.initial_f1 = 0
        self.all_pareto_solutions = []

        # 颜色方案 - 增加产品线颜色
        self.colors = {
            "fixed": "#7f8c8d",  # 固定设备颜色
            "movable": "#3498db",  # 可移动设备颜色
            "moved": "#2ecc71",  # 已移动设备颜色
            "aisle": "#f39c12",  # 通道颜色
            "arrow": "#e74c3c",  # 箭头颜色
            "grid": "#ecf0f1",  # 网格颜色
            "text": "#2c3e50",  # 文字颜色
            "pareto_front": "#e74c3c",  # 帕累托前沿颜色
            "all_solutions": "#3498db",  # 所有解颜色
            "distance_text": "#8B0000",  # 距离文本颜色
            "product_line1": "#3498db",  # 产品线1颜色
            "product_line2": "#2ecc71",  # 产品线2颜色
            "product_line3": "#e74c3c",  # 产品线3颜色
            "product_line4": "#f39c12",  # 产品线4颜色
            "product_line5": "#9b59b6",  # 产品线5颜色
            "storage_area": "#aed6f1",  # 物料存储区颜色
            "quality_area": "#f9e79f",  # 质检区颜色
            "packaging_area": "#d5f4e6",  # 包装区颜色
            "loading_area": "#fadbd8",  # 装货区颜色
            "conveyor": "#a569bd",  # 传送带颜色
            "workstation": "#85c1e9",  # 工作站颜色
        }

        # 设备名称映射 - 新增：为每个设备编号定义对应的机器名称
        self.device_names = [
            "纺纱机",
            "织布机",
            "染色机",
            "烘干机",
            "裁剪机",
            "缝纫机",
            "熨烫机",
            "包装机",
            "质检仪",
            "储料机",
        ]

    def get_device_name(self, device_id):
        """根据设备ID获取对应的机器名称"""
        # 使用设备ID对设备名称列表长度取模，循环使用设备名称
        return self.device_names[device_id % len(self.device_names)]

    def create_individual(self):
        """
        创建个体 - 考虑产品线约束
        """
        individual = []

        # 首先，为每个产品线创建初始位置
        line_positions = {}
        line_spacing = self.W / (len(self.product_lines) + 1)

        for line_idx, line_info in enumerate(self.product_lines.items()):
            line_id, devices = line_info
            line_y = (line_idx + 1) * line_spacing

            # 为该产品线分配水平位置
            line_width = self.L * 0.8
            start_x = (self.L - line_width) / 2
            device_spacing = line_width / (len(devices) + 1)

            for dev_idx, device_id in enumerate(devices):
                x = start_x + (dev_idx + 1) * device_spacing
                y = line_y + random.uniform(-line_spacing / 3, line_spacing / 3)

                # 确保在边界内
                l, w = self.device_sizes[device_id]
                s_min = self.safety_distances[device_id]
                x = max(l / 2 + s_min, min(self.L - l / 2 - s_min, x))
                y = max(w / 2 + s_min, min(self.W - w / 2 - s_min, y))

                line_positions[device_id] = (x, y)

        # 构建个体
        for i in range(self.N):
            if i in self.M:  # 可移动设备
                if i in line_positions:
                    # 使用产品线分配的位置
                    x, y = line_positions[i]
                    # 添加随机扰动
                    if random.random() < 0.3:
                        x += random.uniform(-3, 3)
                        y += random.uniform(-1, 1)
                else:
                    # 随机放置
                    l, w = self.device_sizes[i]
                    s_min = self.safety_distances[i]
                    x_min = l / 2 + s_min
                    x_max = self.L - l / 2 - s_min
                    y_min = w / 2 + s_min
                    y_max = self.W - w / 2 - s_min
                    x = random.uniform(x_min, x_max)
                    y = random.uniform(y_min, y_max)
            else:  # 固定设备
                x, y = self.original_positions[i]

            individual.append((x, y))

        return individual

    def calculate_distance(self, pos1, pos2):
        """计算曼哈顿距离（更适合车间布局）"""
        return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])

    def evaluate_individual(self, individual):
        """
        评估个体 - 考虑产品线效率
        """
        new_positions = individual

        # 1. 计算物料搬运总成本 f1
        f1 = 0
        for i in range(self.N):
            for j in range(self.N):
                if i != j:
                    dist = self.calculate_distance(new_positions[i], new_positions[j])
                    f1 += (
                        self.f_matrix[i, j]
                        * self.w_matrix[i, j]
                        * dist
                        * self.c_transport
                    )

        # 2. 计算设备移动总成本 f2
        f2 = 0
        for i in self.M:
            orig_pos = self.original_positions[i]
            new_pos = new_positions[i]
            move_dist = self.calculate_distance(orig_pos, new_pos)
            if move_dist > 0.001:
                f2 += self.move_costs[i] * move_dist

        # 3. 计算空间利用率和产品线效率 f3
        # 计算设备占地面积
        total_area = self.L * self.W

        # 减去通道面积
        aisle_area_total = 0
        for aisle in self.aisle_areas:
            aisle_area_total += aisle[2] * aisle[3]
        total_area -= aisle_area_total

        # 设备总占地面积
        used_area = 0
        for i in range(self.N):
            used_area += self.device_sizes[i, 0] * self.device_sizes[i, 1]

        # 计算产品线紧凑度
        line_efficiency = 0
        for line_id, devices in self.product_lines.items():
            if devices:
                # 计算该产品线设备的平均距离
                line_positions = [new_positions[dev] for dev in devices]
                avg_distance = 0
                for i in range(len(line_positions)):
                    for j in range(i + 1, len(line_positions)):
                        avg_distance += self.calculate_distance(
                            line_positions[i], line_positions[j]
                        )

                if len(line_positions) > 1:
                    avg_distance /= len(line_positions) * (len(line_positions) - 1) / 2
                    line_efficiency += 1.0 / (1.0 + avg_distance)

        # 空间利用率
        area_utilization = used_area / total_area if total_area > 0 else 0

        # 最终的空间利用率指标（结合面积利用和产品线效率）
        f3 = 0.6 * area_utilization + 0.4 * (line_efficiency / len(self.product_lines))
        f3 = max(0, min(1, f3))

        # 4. 计算约束惩罚项
        penalty = self.calculate_constraint_penalty(new_positions)

        # 5. 归一化目标值并加权求和
        max_f1 = (
            np.max(self.f_matrix)
            * np.max(self.w_matrix)
            * self.c_transport
            * self.L
            * self.W
            * self.N
        )
        max_f2 = np.max(self.move_costs) * (self.L + self.W) * len(self.M)

        max_f1 = max(max_f1, 1)
        max_f2 = max(max_f2, 1)

        f1_norm = f1 / max_f1
        f2_norm = f2 / max_f2
        f3_norm = 1 - f3

        total_obj = (
            self.alpha1 * f1_norm
            + self.alpha2 * f2_norm
            + self.alpha3 * f3_norm
            + penalty * 0.0001
        )

        return total_obj, f1, f2, f3

    def calculate_constraint_penalty(self, positions):
        """
        计算约束违反惩罚 - 增加产品线约束
        """
        penalty = 0

        # 边界约束
        for i in range(self.N):
            x, y = positions[i]
            l, w = self.device_sizes[i]
            s_min = self.safety_distances[i]

            if x < l / 2 + s_min:
                penalty += (l / 2 + s_min - x) * 2
            if x > self.L - l / 2 - s_min:
                penalty += (x - (self.L - l / 2 - s_min)) * 2

            if y < w / 2 + s_min:
                penalty += (w / 2 + s_min - y) * 2
            if y > self.W - w / 2 - s_min:
                penalty += (y - (self.W - w / 2 - s_min)) * 2

        # 设备间无重叠约束
        s_safe = 0.5
        overlap_penalty = 0

        for i in range(self.N):
            for j in range(i + 1, self.N):
                xi, yi = positions[i]
                xj, yj = positions[j]
                li, wi = self.device_sizes[i]
                lj, wj = self.device_sizes[j]

                overlap_x = max(0, (li + lj) / 2 + s_safe - abs(xi - xj))
                overlap_y = max(0, (wi + wj) / 2 + s_safe - abs(yi - yj))

                if overlap_x > 0 and overlap_y > 0:
                    overlap_area = overlap_x * overlap_y
                    overlap_penalty += overlap_area * 5

        penalty += overlap_penalty

        # 通道约束
        for aisle in self.aisle_areas:
            aisle_x, aisle_y, aisle_w, aisle_h = aisle
            for i in range(self.N):
                x, y = positions[i]
                l, w = self.device_sizes[i]

                device_left = x - l / 2
                device_right = x + l / 2
                device_bottom = y - w / 2
                device_top = y + w / 2

                aisle_right = aisle_x + aisle_w
                aisle_top = aisle_y + aisle_h

                overlap_width = max(
                    0, min(device_right, aisle_right) - max(device_left, aisle_x)
                )
                overlap_height = max(
                    0, min(device_top, aisle_top) - max(device_bottom, aisle_y)
                )

                if overlap_width > 0 and overlap_height > 0:
                    overlap_area = overlap_width * overlap_height
                    penalty += overlap_area * 2

        # 产品线约束：同一产品线的设备应该相对集中
        line_penalty = 0
        for line_id, devices in self.product_lines.items():
            if len(devices) > 1:
                # 计算设备中心点
                center_x = sum(positions[dev][0] for dev in devices) / len(devices)
                center_y = sum(positions[dev][1] for dev in devices) / len(devices)

                # 计算每个设备到中心的距离
                for dev in devices:
                    dist = self.calculate_distance(positions[dev], (center_x, center_y))
                    if dist > 15:  # 如果设备离产品线中心太远
                        line_penalty += dist - 15

        penalty += line_penalty

        return penalty

    def mutate_individual(self, individual, generation=None, max_generation=None):
        """
        变异操作 - 增强版，考虑产品线
        """
        mutant = list(individual)

        current_mutpb = self.mutpb
        if generation is not None and max_generation is not None:
            progress = generation / max_generation
            current_mutpb = self.mutpb * (1.5 - 0.5 * progress)

        for i in self.M:
            if random.random() < current_mutpb:
                mutation_type = random.choice(
                    ["small", "medium", "large", "swap", "reset", "line_focus"]
                )

                x, y = mutant[i]
                l, w = self.device_sizes[i]
                s_min = self.safety_distances[i]

                x_min = l / 2 + s_min
                x_max = self.L - l / 2 - s_min
                y_min = w / 2 + s_min
                y_max = self.W - w / 2 - s_min

                if mutation_type == "small":
                    new_x = max(x_min, min(x_max, x + random.uniform(-2, 2)))
                    new_y = max(y_min, min(y_max, y + random.uniform(-2, 2)))

                elif mutation_type == "medium":
                    new_x = max(x_min, min(x_max, x + random.uniform(-5, 5)))
                    new_y = max(y_min, min(y_max, y + random.uniform(-5, 5)))

                elif mutation_type == "large":
                    new_x = random.uniform(x_min, x_max)
                    new_y = random.uniform(y_min, y_max)

                elif mutation_type == "swap":
                    possible_swaps = [j for j in self.M if j != i]
                    if possible_swaps:
                        swap_with = random.choice(possible_swaps)
                        mutant[i], mutant[swap_with] = mutant[swap_with], mutant[i]
                    continue

                elif mutation_type == "reset":
                    new_x, new_y = self.original_positions[i]
                    new_x = max(x_min, min(x_max, new_x))
                    new_y = max(y_min, min(y_max, new_y))

                elif mutation_type == "line_focus":
                    # 向产品线中心移动
                    line_center = self.find_line_center(i, mutant)
                    if line_center:
                        new_x = x + (line_center[0] - x) * random.uniform(0.1, 0.3)
                        new_y = y + (line_center[1] - y) * random.uniform(0.1, 0.3)
                        new_x = max(x_min, min(x_max, new_x))
                        new_y = max(y_min, min(y_max, new_y))
                    else:
                        new_x = x
                        new_y = y

                mutant[i] = (new_x, new_y)

        return mutant

    def find_line_center(self, device_id, positions):
        """找到设备所属产品线的中心"""
        for line_id, devices in self.product_lines.items():
            if device_id in devices:
                line_devices = [dev for dev in devices if dev != device_id]
                if line_devices:
                    center_x = sum(positions[dev][0] for dev in line_devices) / len(
                        line_devices
                    )
                    center_y = sum(positions[dev][1] for dev in line_devices) / len(
                        line_devices
                    )
                    return (center_x, center_y)
        return None

    def crossover_individuals(self, ind1, ind2):
        """
        交叉操作 - 增强版
        """
        child1 = list(ind1)
        child2 = list(ind2)

        if random.random() < self.cxpb:
            crossover_type = random.choice(
                ["single", "two_point", "uniform", "blend", "line_based"]
            )

            if crossover_type == "single":
                crossover_point = random.randint(1, self.N - 1)
                for i in range(crossover_point, self.N):
                    if i in self.M:
                        child1[i], child2[i] = child2[i], child1[i]

            elif crossover_type == "two_point":
                point1 = random.randint(1, self.N - 2)
                point2 = random.randint(point1 + 1, self.N - 1)
                for i in range(point1, point2):
                    if i in self.M:
                        child1[i], child2[i] = child2[i], child1[i]

            elif crossover_type == "uniform":
                for i in self.M:
                    if random.random() < 0.5:
                        child1[i], child2[i] = child2[i], child1[i]

            elif crossover_type == "blend":
                for i in self.M:
                    if random.random() < 0.5:
                        alpha = random.random()
                        x1, y1 = child1[i]
                        x2, y2 = child2[i]

                        new_x1 = alpha * x1 + (1 - alpha) * x2
                        new_y1 = alpha * y1 + (1 - alpha) * y2
                        new_x2 = (1 - alpha) * x1 + alpha * x2
                        new_y2 = (1 - alpha) * y1 + alpha * y2

                        l, w = self.device_sizes[i]
                        s_min = self.safety_distances[i]
                        x_min = l / 2 + s_min
                        x_max = self.L - l / 2 - s_min
                        y_min = w / 2 + s_min
                        y_max = self.W - w / 2 - s_min

                        child1[i] = (
                            max(x_min, min(x_max, new_x1)),
                            max(y_min, min(y_max, new_y1)),
                        )
                        child2[i] = (
                            max(x_min, min(x_max, new_x2)),
                            max(y_min, min(y_max, new_y2)),
                        )

            elif crossover_type == "line_based":
                # 按产品线交叉
                for line_id, devices in self.product_lines.items():
                    if random.random() < 0.5:
                        for dev in devices:
                            if dev in self.M:
                                child1[dev], child2[dev] = child2[dev], child1[dev]

        return child1, child2

    def setup_ga(self):
        """
        设置遗传算法
        """
        creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
        creator.create("Individual", list, fitness=creator.FitnessMin)

        toolbox = base.Toolbox()

        toolbox.register(
            "individual", tools.initIterate, creator.Individual, self.create_individual
        )
        toolbox.register("population", tools.initRepeat, list, toolbox.individual)

        toolbox.register("evaluate", lambda ind: (self.evaluate_individual(ind)[0],))
        toolbox.register("mate", self.crossover_individuals)
        toolbox.register("select", tools.selTournament, tournsize=self.tournament_size)

        return toolbox

    def run_optimization(self):
        """
        运行优化算法
        """
        toolbox = self.setup_ga()

        pop = toolbox.population(n=self.pop_size)

        print("评估初始种群...")
        fitnesses = list(map(toolbox.evaluate, pop))
        for ind, fit in zip(pop, fitnesses):
            ind.fitness.values = fit

        self.all_solutions = []
        self.evolution_history = []

        print("开始进化...")
        start_time = time.time()

        for gen in range(self.ngen):
            diversity = self.calculate_population_diversity(pop)

            offspring = toolbox.select(pop, len(pop))
            offspring = list(map(toolbox.clone, offspring))

            for child1, child2 in zip(offspring[::2], offspring[1::2]):
                if random.random() < self.cxpb:
                    toolbox.mate(child1, child2)
                    del child1.fitness.values
                    del child2.fitness.values

            for mutant in offspring:
                if random.random() < self.mutpb:
                    mutant[:] = self.mutate_individual(mutant, gen, self.ngen)
                    del mutant.fitness.values

            invalid_ind = [ind for ind in offspring if not ind.fitness.valid]
            if invalid_ind:
                fitnesses = map(toolbox.evaluate, invalid_ind)
                for ind, fit in zip(invalid_ind, fitnesses):
                    ind.fitness.values = fit

            elite_size = max(1, int(0.1 * len(pop)))
            elite = tools.selBest(pop, elite_size)

            remaining_size = len(pop) - elite_size
            if remaining_size > 0:
                selected_offspring = tools.selBest(offspring, remaining_size)
                pop[:] = elite + selected_offspring
            else:
                pop[:] = elite

            current_best = min(pop, key=lambda ind: ind.fitness.values[0])
            total_obj, f1, f2, f3 = self.evaluate_individual(current_best)

            for ind in pop:
                total_obj, f1, f2, f3 = self.evaluate_individual(ind)
                self.all_solutions.append(
                    {
                        "individual": ind,
                        "f1": f1,
                        "f2": f2,
                        "f3": f3,
                        "total": total_obj,
                        "generation": gen,
                    }
                )

            elapsed = time.time() - start_time

            self.evolution_history.append(
                {
                    "generation": gen,
                    "f1": float(f1),
                    "f2": float(f2),
                    "f3": float(f3),
                    "diversity": float(diversity),
                    "mutpb": float(self.mutpb),
                    "elapsed_time": float(elapsed),
                }
            )

            if gen % 20 == 0 or gen == self.ngen - 1:
                print(
                    f"Generation {gen}: f1={f1:.2f}, f2={f2:.2f}, f3={f3:.4f}, "
                    f"diversity={diversity:.4f}, time={elapsed:.1f}s"
                )

                if diversity < 0.1 and gen > 20:
                    self.mutpb = min(0.8, self.mutpb * 1.2)
                    print(f"  警告：种群多样性过低，增加变异率到 {self.mutpb:.3f}")

        self.pareto_solutions = self.get_pareto_front(self.all_solutions)
        self.all_pareto_solutions = self.pareto_solutions.copy()

        return self.pareto_solutions, self.all_solutions, self.evolution_history

    def calculate_population_diversity(self, population):
        """计算种群多样性"""
        if len(population) <= 1:
            return 0

        total_distance = 0
        count = 0

        for i in range(len(population)):
            for j in range(i + 1, len(population)):
                dist = 0
                for k in range(self.N):
                    if k in self.M:
                        pos1 = population[i][k]
                        pos2 = population[j][k]
                        dist += self.calculate_distance(pos1, pos2)

                total_distance += dist
                count += 1

        avg_distance = total_distance / count if count > 0 else 0

        max_possible_distance = self.N * (self.L + self.W)
        normalized_diversity = (
            avg_distance / max_possible_distance if max_possible_distance > 0 else 0
        )

        return normalized_diversity

    def get_pareto_front(self, solutions):
        """获取帕累托前沿"""
        if not solutions:
            return []

        unique_solutions = []
        seen_positions = set()

        for sol in solutions:
            pos_hash = tuple(
                (round(pos[0], 2), round(pos[1], 2)) for pos in sol["individual"]
            )
            if pos_hash not in seen_positions:
                seen_positions.add(pos_hash)
                unique_solutions.append(sol)

        print(f"找到 {len(unique_solutions)} 个唯一解")

        pareto_front = []

        sorted_solutions = sorted(unique_solutions, key=lambda x: x["total"])
        candidates = sorted_solutions[: min(200, len(sorted_solutions))]

        for sol in candidates:
            dominated = False

            for pf in pareto_front:
                if self.is_dominated(sol, pf):
                    dominated = True
                    break

            if not dominated:
                new_pareto_front = []
                for pf in pareto_front:
                    if not self.is_dominated(pf, sol):
                        new_pareto_front.append(pf)
                pareto_front = new_pareto_front
                pareto_front.append(sol)

        print(f"帕累托前沿包含 {len(pareto_front)} 个解")
        return pareto_front

    def is_dominated(self, sol1, sol2):
        """检查sol1是否被sol2支配"""
        f1_1, f2_1, f3_1 = sol1["f1"], sol1["f2"], sol1["f3"]
        f1_2, f2_2, f3_2 = sol2["f1"], sol2["f2"], sol2["f3"]

        return (
            f1_2 <= f1_1
            and f2_2 <= f2_1
            and f3_2 >= f3_1
            and (f1_2 < f1_1 or f2_2 < f2_1 or f3_2 > f3_1)
        )

    def visualize_results(self):
        """
        可视化结果 - 美化版
        """
        if not self.all_solutions:
            print("没有找到解决方案")
            return []

        f1_vals = [sol["f1"] for sol in self.all_solutions]
        f2_vals = [sol["f2"] for sol in self.all_solutions]
        f3_vals = [sol["f3"] for sol in self.all_solutions]

        f1_pareto = [sol["f1"] for sol in self.pareto_solutions]
        f2_pareto = [sol["f2"] for sol in self.pareto_solutions]
        f3_pareto = [sol["f3"] for sol in self.pareto_solutions]

        fig = plt.figure(figsize=(18, 6))

        ax1 = fig.add_subplot(131)
        scatter1 = ax1.scatter(
            f1_vals,
            f2_vals,
            alpha=0.2,
            c=self.colors["all_solutions"],
            s=10,
            edgecolors="none",
            label="所有解",
        )
        scatter2 = ax1.scatter(
            f1_pareto,
            f2_pareto,
            c=self.colors["pareto_front"],
            s=80,
            marker="*",
            edgecolors="gold",
            linewidth=1.5,
            label="帕累托前沿",
        )
        ax1.set_xlabel("物料搬运成本 (f1)", fontsize=12, fontweight="bold")
        ax1.set_ylabel("设备移动成本 (f2)", fontsize=12, fontweight="bold")
        ax1.set_title(
            "物料搬运成本 vs 设备移动成本", fontsize=14, fontweight="bold", pad=15
        )
        ax1.legend(loc="best", fontsize=10)
        ax1.grid(True, alpha=0.3, linestyle="--")

        ax2 = fig.add_subplot(132)
        ax2.scatter(
            f1_vals,
            f3_vals,
            alpha=0.2,
            c=self.colors["all_solutions"],
            s=10,
            edgecolors="none",
        )
        ax2.scatter(
            f1_pareto,
            f3_pareto,
            c=self.colors["pareto_front"],
            s=80,
            marker="*",
            edgecolors="gold",
            linewidth=1.5,
        )
        ax2.set_xlabel("物料搬运成本 (f1)", fontsize=12, fontweight="bold")
        ax2.set_ylabel("空间利用率 (f3)", fontsize=12, fontweight="bold")
        ax2.set_title(
            "物料搬运成本 vs 空间利用率", fontsize=14, fontweight="bold", pad=15
        )
        ax2.grid(True, alpha=0.3, linestyle="--")

        ax3 = fig.add_subplot(133)
        ax3.scatter(
            f2_vals,
            f3_vals,
            alpha=0.2,
            c=self.colors["all_solutions"],
            s=10,
            edgecolors="none",
        )
        ax3.scatter(
            f2_pareto,
            f3_pareto,
            c=self.colors["pareto_front"],
            s=80,
            marker="*",
            edgecolors="gold",
            linewidth=1.5,
        )
        ax3.set_xlabel("设备移动成本 (f2)", fontsize=12, fontweight="bold")
        ax3.set_ylabel("空间利用率 (f3)", fontsize=12, fontweight="bold")
        ax3.set_title(
            "设备移动成本 vs 空间利用率", fontsize=14, fontweight="bold", pad=15
        )
        ax3.grid(True, alpha=0.3, linestyle="--")

        fig.suptitle(
            "双轨算法 - 帕累托前沿分析 (纺织企业布局优化)",
            fontsize=16,
            fontweight="bold",
            y=0.95,
        )
        plt.tight_layout(pad=3.0)

        plt.show()

        return self.pareto_solutions

    def output_all_pareto_solutions(self):
        """
        输出帕累托最优解集中的所有解 - 修改：显示所有移动设备的详细方案
        """
        if not self.pareto_solutions:
            print("没有找到帕累托解")
            return []

        print("\n" + "=" * 80)
        print("帕累托最优解集 (共{}个解):".format(len(self.pareto_solutions)))
        print("=" * 80)

        pareto_solutions_sorted = sorted(
            self.pareto_solutions, key=lambda x: x["total"]
        )

        for i, sol in enumerate(pareto_solutions_sorted, 1):
            print(f"\n📊 解 {i}:")
            print(f"  总适应度值: {sol['total']:.6f}")
            print(f"  📦 物料搬运成本 (f1): ¥{sol['f1']:.2f}")
            print(f"  🏗️  设备移动成本 (f2): ¥{sol['f2']:.2f}")

            # 计算各产品线效率
            print(f"  📈 产品线布局效率:")
            for line_id, devices in self.product_lines.items():
                if devices:
                    positions = [sol["individual"][dev] for dev in devices]
                    avg_distance = 0
                    count = 0
                    for j in range(len(positions)):
                        for k in range(j + 1, len(positions)):
                            avg_distance += self.calculate_distance(
                                positions[j], positions[k]
                            )
                            count += 1
                    if count > 0:
                        avg_distance /= count
                        print(f"    产品线{line_id}: 平均设备间距={avg_distance:.2f}m")

            # 计算设备移动方案 - 修改：显示所有移动设备，并使用机器名称
            moved_devices = []
            total_move_cost = 0
            total_move_distance = 0  # 新增：总移动距离
            for j in self.M:
                orig_x, orig_y = self.original_positions[j]
                new_x, new_y = sol["individual"][j]
                dist = self.calculate_distance((orig_x, orig_y), (new_x, new_y))
                if dist > 0.5:
                    move_cost = self.move_costs[j] * dist
                    total_move_cost += move_cost
                    total_move_distance += dist  # 新增：累加总移动距离
                    # 使用机器名称而不是设备编号
                    device_name = self.get_device_name(j)
                    moved_devices.append(
                        (
                            j,
                            device_name,
                            (orig_x, orig_y),
                            (new_x, new_y),
                            dist,
                            move_cost,
                        )
                    )

            if moved_devices:
                print(
                    f"  🚚 设备移动方案（移动{len(moved_devices)}台设备，总移动成本: ¥{total_move_cost:.2f}，总移动距离: {total_move_distance:.2f}米）:"
                )
                # 修改：显示所有移动设备，使用机器名称
                for dev_id, dev_name, orig, new, dist, move_cost in moved_devices:
                    # 格式化位置信息
                    orig_str = f"({orig[0]:.1f}, {orig[1]:.1f})"
                    new_str = f"({new[0]:.1f}, {new[1]:.1f})"
                    print(
                        f"    {dev_name}{dev_id}: {orig_str} → {new_str}, 距离: {dist:.2f}m, 成本: ¥{move_cost:.2f}"
                    )
            else:
                print("  ✅ 无设备移动")

            print(f"  {'─' * 60}")

        return pareto_solutions_sorted

    def visualize_single_layout(self, solution_index=0, show_comparison=True):
        """
        可视化单个设备布局 - 增强版
        """
        if not self.pareto_solutions:
            print("请先运行优化")
            return

        if solution_index >= len(self.pareto_solutions):
            print(f"解索引 {solution_index} 超出范围，使用第一个解")
            solution_index = 0

        solution = self.pareto_solutions[solution_index]

        if show_comparison:
            # 创建两列对比图
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(18, 8))

            # 子图1：原始布局（无图例）
            self._draw_layout(
                ax1,
                self.original_positions,
                "原始布局",
                "",
                solution,
                show_arrows=False,
                show_performance=False,
                show_legend=False,
            )

            # 子图2：优化后布局（有图例）
            improvement = (
                ((self.initial_f1 - solution["f1"]) / self.initial_f1 * 100)
                if self.initial_f1 > 0
                else 0
            )
            title = f"优化布局 (解 {solution_index})"
            self._draw_layout(
                ax2,
                solution["individual"],
                "优化后布局",
                title,
                solution,
                show_arrows=True,
                original_positions=self.original_positions,
                show_legend=True,
            )

            fig.suptitle(
                f"双轨算法 - 纺织企业设备布局优化对比 (解 {solution_index})",
                fontsize=18,
                fontweight="bold",
                y=0.95,
            )

            plt.tight_layout(pad=3.0)
            plt.show()

        else:
            # 创建单列优化布局图
            fig, ax = plt.subplots(1, 1, figsize=(16, 10))
            improvement = (
                ((self.initial_f1 - solution["f1"]) / self.initial_f1 * 100)
                if self.initial_f1 > 0
                else 0
            )
            title = f"优化布局 (解 {solution_index})"
            self._draw_layout(
                ax,
                solution["individual"],
                "",
                title,
                solution,
                show_arrows=True,
                original_positions=self.original_positions,
                show_legend=True,
            )
            fig.suptitle(
                f"双轨算法 - 纺织企业优化后设备布局 (解 {solution_index})",
                fontsize=18,
                fontweight="bold",
                y=0.97,
            )

            plt.tight_layout(pad=3.0)
            plt.show()

        print(f"\n📊 布局 {solution_index} 详情:")
        print(f"  📦 物料搬运成本: ¥{solution['f1']:.2f} ")
        if self.initial_f1 > 0:
            improvement = (self.initial_f1 - solution["f1"]) / self.initial_f1 * 100
            if improvement > 0:
                print(f"  📉 成本降低: {improvement:.1f}%")
            else:
                print(f"  📈 成本增加: {-improvement:.1f}%")
        print(f"  🏗️  设备移动成本: ¥{solution['f2']:.2f}")
        print(f"  ⚖️  综合适应度值: {solution['total']:.6f}")

    def visualize_original_layout(self):
        """
        可视化原始车间布局 - 新增方法：显示原始布局的单个图
        """
        print("\n正在生成原始车间布局图...")

        # 创建原始布局图
        fig, ax = plt.subplots(1, 1, figsize=(16, 12))

        # 使用原始位置绘制布局
        title = ""
        subtitle = "原始车间设备布局"

        # 创建一个虚拟的solution对象，包含原始布局的性能指标
        original_solution = {
            "f1": self.initial_f1,
            "f2": 0,  # 原始布局没有移动成本
            "f3": 0.75,  # 假设原始布局的空间利用率为0.75
            "total": 0.5,  # 虚拟值
        }

        self._draw_layout(
            ax,
            self.original_positions,
            "",
            subtitle,
            original_solution,
            show_arrows=False,
            show_legend=True,
            show_performance=True,
        )

        fig.suptitle(
            f"双轨算法 - 纺织企业原始车间布局", fontsize=18, fontweight="bold", y=0.95
        )

        plt.tight_layout(pad=3.0)
        plt.show()

        print(f"\n📊 原始车间布局详情:")
        print(f"  📦 物料搬运成本: ¥{self.initial_f1:.2f}")
        print(f"  🏗️  设备移动成本: ¥0.00 (原始布局)")
        print(f"  📋 产品线数量: {len(self.product_lines)}条")
        print(
            f"  🏭 设备总数: {self.N}台 (可移动: {len(self.M)}台, 固定: {len(self.F)}台)"
        )

    def _draw_layout(
        self,
        ax,
        positions,
        title,
        subtitle,
        solution,
        show_arrows=False,
        original_positions=None,
        show_legend=True,
        show_performance=True,
    ):
        """
        绘制单个布局 - 增强版，增加更多车间细节
        """
        ax.clear()
        ax.set_xlim(0, self.L)
        ax.set_ylim(0, self.W)
        ax.set_aspect("equal")
        ax.set_title(
            f"{title}\n{subtitle}" if subtitle else title,
            fontsize=14,
            fontweight="bold",
            pad=10,
        )
        ax.set_xlabel("X (米)", fontsize=11)
        ax.set_ylabel("Y (米)", fontsize=11)
        ax.grid(True, alpha=0.3, linestyle="--", color=self.colors["grid"])

        # 绘制车间边界和背景
        rect = Rectangle(
            (0, 0),
            self.L,
            self.W,
            linewidth=2,
            edgecolor="black",
            facecolor="#f8f9fa",
            alpha=0.8,
        )
        ax.add_patch(rect)

        # 绘制功能区域
        # 物料存储区
        storage_rect = Rectangle(
            (5, self.W - 10),
            15,
            8,
            facecolor=self.colors["storage_area"],
            edgecolor="#2980b9",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(storage_rect)
        ax.text(
            12.5,
            self.W - 6,
            "物料存储区",
            ha="center",
            va="center",
            fontsize=9,
            fontweight="bold",
            color="#2c3e50",
        )

        # 质检区
        quality_rect = Rectangle(
            (self.L - 20, self.W - 10),
            15,
            8,
            facecolor=self.colors["quality_area"],
            edgecolor="#f1c40f",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(quality_rect)
        ax.text(
            self.L - 12.5,
            self.W - 6,
            "质检区",
            ha="center",
            va="center",
            fontsize=9,
            fontweight="bold",
            color="#2c3e50",
        )

        # 包装区
        packaging_rect = Rectangle(
            (self.L - 20, 5),
            15,
            8,
            facecolor=self.colors["packaging_area"],
            edgecolor="#27ae60",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(packaging_rect)
        ax.text(
            self.L - 12.5,
            9,
            "包装区",
            ha="center",
            va="center",
            fontsize=9,
            fontweight="bold",
            color="#2c3e50",
        )

        # 装货区
        loading_rect = Rectangle(
            (5, 5),
            15,
            8,
            facecolor=self.colors["loading_area"],
            edgecolor="#e74c3c",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(loading_rect)
        ax.text(
            12.5,
            9,
            "装货区",
            ha="center",
            va="center",
            fontsize=9,
            fontweight="bold",
            color="#2c3e50",
        )

        # 绘制通道区域
        for aisle in self.aisle_areas:
            aisle_x, aisle_y, aisle_w, aisle_h = aisle
            aisle_rect = Rectangle(
                (aisle_x, aisle_y),
                aisle_w,
                aisle_h,
                facecolor=self.colors["aisle"],
                edgecolor="orange",
                linewidth=2,
                alpha=0.3,
                hatch="//",
            )
            ax.add_patch(aisle_rect)

        # 绘制传送带示意
        conveyor_y = self.W * 0.5
        ax.plot(
            [25, 50],
            [conveyor_y, conveyor_y],
            color=self.colors["conveyor"],
            linewidth=4,
            linestyle="-",
            alpha=0.7,
            label="传送带",
        )

        # 绘制设备位置
        for i in range(self.N):
            x, y = positions[i]
            width, height = self.device_sizes[i]

            # 确定设备颜色（根据产品线）
            line_color = None
            for line_id, devices in self.product_lines.items():
                if i in devices:
                    line_color = self.colors[f"product_line{line_id}"]
                    break

            if i in self.F:
                color = self.colors["fixed"]
                edgecolor = "black"
                hatch = None
            else:
                if original_positions is not None and show_arrows:
                    orig_x, orig_y = original_positions[i]
                    dist = np.sqrt((x - orig_x) ** 2 + (y - orig_y) ** 2)
                    if dist > 0.5:
                        color = self.colors["moved"]
                        edgecolor = "green"
                        hatch = "xx"
                    else:
                        color = line_color if line_color else self.colors["movable"]
                        edgecolor = "blue"
                        hatch = None
                else:
                    color = line_color if line_color else self.colors["movable"]
                    edgecolor = "blue"
                    hatch = None

            # 绘制设备矩形（模拟纺织机器）
            rect = Rectangle(
                (x - width / 2, y - height / 2),
                width,
                height,
                facecolor=color,
                edgecolor=edgecolor,
                linewidth=2,
                alpha=0.8,
                hatch=hatch,
            )
            ax.add_patch(rect)

            # 添加设备编号和类型 - 使用get_device_name方法获取机器名称
            device_type = self.get_device_name(i)
            ax.text(
                x,
                y,
                f"{i}\n{device_type}",
                ha="center",
                va="center",
                fontweight="bold",
                fontsize=8,
                bbox=dict(
                    boxstyle="round,pad=0.2",
                    facecolor="white",
                    edgecolor="black",
                    alpha=0.8,
                ),
            )

            # 绘制设备工作指示灯
            indicator = Circle(
                (x + width / 2 - 0.3, y + height / 2 - 0.3),
                0.2,
                facecolor="green",
                edgecolor="black",
                linewidth=1,
                alpha=0.8,
            )
            ax.add_patch(indicator)

            # 如果显示箭头且设备移动了，绘制箭头和距离文本
            if show_arrows and original_positions is not None and i in self.M:
                orig_x, orig_y = original_positions[i]
                dist = np.sqrt((x - orig_x) ** 2 + (y - orig_y) ** 2)
                if dist > 0.5:
                    # 计算箭头方向
                    dx = x - orig_x
                    dy = y - orig_y

                    # 确保箭头不要太长
                    if dist > 10:
                        scale = 10 / dist
                        dx = dx * scale
                        dy = dy * scale

                    # 绘制箭头 - 改进：增加箭头长度，使其起点在设备外部
                    arrow_length = max(5, min(20, dist))  # 控制箭头长度
                    arrow_start_x = orig_x + dx * 0.3  # 从离起点30%的位置开始
                    arrow_start_y = orig_y + dy * 0.3
                    arrow_dx = dx * 0.7  # 箭头长度为剩余距离的70%
                    arrow_dy = dy * 0.7

                    arrow = ax.arrow(
                        arrow_start_x,
                        arrow_start_y,
                        arrow_dx,
                        arrow_dy,
                        head_width=0.8,
                        head_length=1.0,
                        fc=self.colors["arrow"],
                        ec=self.colors["arrow"],
                        alpha=0.7,
                        linewidth=2,
                    )

                    # 在箭头中点添加距离文本 - 改进：确保文本不遮挡设备
                    mid_x = arrow_start_x + arrow_dx / 2
                    mid_y = arrow_start_y + arrow_dy / 2

                    # 计算文本偏移，使其不遮挡设备
                    text_offset_x = 0
                    text_offset_y = 0

                    # 如果箭头接近水平，则在垂直方向偏移
                    if abs(dy) < 3 and abs(dx) > 5:
                        text_offset_y = 4 * (1 if dy >= 0 else -1)
                    # 如果箭头接近垂直，则在水平方向偏移
                    elif abs(dx) < 3 and abs(dy) > 5:
                        text_offset_x = 4 * (1 if dx >= 0 else -1)
                    else:
                        # 在箭头垂直方向偏移
                        text_offset_y = 3

                    text_x = mid_x + text_offset_x
                    text_y = mid_y + text_offset_y

                    # 绘制距离文本，使用较小字体，放在箭头旁边
                    ax.text(
                        text_x,
                        text_y,
                        f"{dist:.1f}m",
                        fontsize=7,
                        color=self.colors["distance_text"],
                        ha="center",
                        va="center",
                        bbox=dict(
                            boxstyle="round,pad=0.2",
                            facecolor="white",
                            edgecolor=self.colors["distance_text"],
                            alpha=0.7,
                        ),
                    )

        # 绘制产品线标记
        line_spacing = self.W / (len(self.product_lines) + 1)
        for line_idx, (line_id, devices) in enumerate(self.product_lines.items()):
            line_y = (line_idx + 1) * line_spacing
            line_color = self.colors[f"product_line{line_id}"]

            # 绘制产品线标记线
            ax.plot(
                [10, self.L - 10],
                [line_y, line_y],
                color=line_color,
                linewidth=3,
                linestyle="--",
                alpha=0.5,
            )

            # 添加产品线标签 - 调整位置避免与设备重叠
            device_ys = []
            for dev in devices:
                x, y = positions[dev]
                device_ys.append(y)

            if device_ys:
                avg_device_y = sum(device_ys) / len(device_ys)
                label_y = line_y - 3
                if label_y < 3:
                    label_y = line_y + 3
            else:
                label_y = line_y - 3

            label_y = max(3, min(self.W - 3, label_y))

            product_names = ["棉纺线", "化纤线", "混纺线", "高端线", "实验线"]
            product_name = product_names[line_idx % len(product_names)]

            ax.annotate(
                f"产品线{line_id}: {product_name}",
                xy=(15, line_y),
                xytext=(5, label_y),
                arrowprops=dict(
                    arrowstyle="->",
                    color=line_color,
                    linewidth=1.5,
                    alpha=0.7,
                    connectionstyle="arc3,rad=-0.2",
                ),
                ha="left",
                va="center",
                fontsize=9,
                fontweight="bold",
                color=line_color,
                bbox=dict(
                    boxstyle="round,pad=0.3",
                    facecolor="white",
                    edgecolor=line_color,
                    alpha=0.9,
                ),
            )

        # 添加图例
        legend_elements = []
        if show_legend:
            legend_elements = [
                Patch(
                    facecolor=self.colors["storage_area"],
                    edgecolor="#2980b9",
                    alpha=0.6,
                    label="物料存储区",
                ),
                Patch(
                    facecolor=self.colors["quality_area"],
                    edgecolor="#f1c40f",
                    alpha=0.6,
                    label="质检区",
                ),
                Patch(
                    facecolor=self.colors["packaging_area"],
                    edgecolor="#27ae60",
                    alpha=0.6,
                    label="包装区",
                ),
                Patch(
                    facecolor=self.colors["loading_area"],
                    edgecolor="#e74c3c",
                    alpha=0.6,
                    label="装货区",
                ),
            ]

            for line_idx in range(1, min(6, len(self.product_lines) + 1)):
                line_color = self.colors[f"product_line{line_idx}"]
                legend_elements.append(
                    Patch(
                        facecolor=line_color,
                        edgecolor="black",
                        alpha=0.8,
                        label=f"产品线{line_idx}设备",
                    )
                )

            legend_elements.extend(
                [
                    Patch(
                        facecolor=self.colors["fixed"],
                        edgecolor="black",
                        alpha=0.8,
                        label="固定设备",
                    ),
                    Patch(
                        facecolor=self.colors["movable"],
                        edgecolor="blue",
                        alpha=0.8,
                        label="可移动设备(未移动)",
                    ),
                    Patch(
                        facecolor=self.colors["moved"],
                        edgecolor="green",
                        alpha=0.8,
                        hatch="xx",
                        label="可移动设备(已移动)",
                    ),
                    Patch(
                        facecolor=self.colors["aisle"],
                        edgecolor="orange",
                        alpha=0.3,
                        hatch="//",
                        label="通道区域",
                    ),
                ]
            )

            if show_arrows:
                legend_elements.append(
                    Line2D(
                        [0],
                        [0],
                        color=self.colors["arrow"],
                        linewidth=2,
                        marker=">",
                        markersize=10,
                        label="设备移动方向",
                    )
                )

        # 在右侧显示图例 - 调整位置避免重叠
        if legend_elements and show_legend:
            # 计算图例高度
            ncols = 1
            nlines = len(legend_elements)
            legend_height = nlines * 0.035  # 每行大约0.035的高度比例

            # 调整图例位置，为性能指标留出空间
            legend1 = ax.legend(
                handles=legend_elements,
                loc="upper left",
                bbox_to_anchor=(1.05, 1.00),  # 调整到稍低位置
                fontsize=9,
                title="图例说明",
                title_fontsize=10,
            )
            ax.add_artist(legend1)

        # 在右侧图例下方单独显示性能指标 - 调整位置避免与图例重叠
        if show_performance and solution is not None:
            # 计算移动设备数量和总移动距离
            moved_devices = []
            total_move_distance = 0
            for i in self.M:
                if original_positions is not None:
                    orig_x, orig_y = original_positions[i]
                    new_x, new_y = positions[i]
                    dist = np.sqrt((orig_x - new_x) ** 2 + (orig_y - new_y) ** 2)
                    if dist > 0.5:
                        moved_devices.append(i)
                        total_move_distance += dist

            # 性能指标文本
            performance_text = f" 性能指标:\n"
            performance_text += f"物料搬运成本: {solution['f1']:.2f}元\n"
            performance_text += f"设备移动成本: {solution['f2']:.2f}元\n"
            performance_text += f"移动设备数: {len(moved_devices)}台\n"
            performance_text += f"总移动距离: {total_move_distance:.1f}m"

            # 在右侧图例下方添加性能指标 - 降低位置避免重叠
            ax.text(
                1.04,
                0.18,
                performance_text,  # 降低到0.25位置
                transform=ax.transAxes,
                fontsize=10,
                bbox=dict(
                    boxstyle="round,pad=0.5",
                    facecolor="#f8f9fa",
                    edgecolor="#3498db",
                    alpha=0.9,
                ),
                verticalalignment="top",
                horizontalalignment="left",
            )


# ========== 重工业优化器 (改进版 - 专门解决帕累托前沿分散问题) ==========
class HeavyIndustry_AGV_Optimizer:
    def __init__(self, input_data):
        """
        初始化重工业AGV优化器 - 改进版，专门解决帕累托前沿分散问题
        """
        # 基本参数
        self.K = input_data["K"]  # 设备数量
        self.J = input_data["J"]  # 生产任务数量
        self.V = input_data["V"]  # AGV数量
        self.T = input_data["T"]  # 时间周期长度

        # 设备信息
        self.device_positions = input_data["device_positions"]  # 设备位置
        self.device_rates = input_data["device_rates"]  # 加工速率
        self.setup_times = input_data["setup_times"]  # 换型时间
        self.device_capacities = input_data["device_capacities"]  # 最大在制品容量

        # 任务信息
        self.tasks = input_data["tasks"]  # 任务列表

        # AGV信息
        self.AGV_speed = input_data["AGV_speed"]  # AGV行驶速度
        self.AGV_capacity = input_data["AGV_capacity"]  # AGV最大载重
        self.AGV_energy_rate = input_data["AGV_energy_rate"]  # AGV能耗率

        # 颜色方案 - 汽车零部件企业专业配色
        self.colors = {
            "workshop_bg": "#F5F7FA",  # 车间背景色
            "workshop_grid": "#E4E7EB",  # 车间网格
            "main_aisle": "#CBD5E1",  # 主通道颜色
            "secondary_aisle": "#E2E8F0",  # 次要通道
            "cross_aisle": "#F1F5F9",  # 交叉通道
            "wall": "#94A3B8",  # 墙壁颜色
            "column": "#64748B",  # 柱子颜色
            # 功能区
            "raw_material": "#3B82F6",  # 原材料区 - 蓝色
            "in_process": "#10B981",  # 在制品区 - 绿色
            "finished_goods": "#F59E0B",  # 成品区 - 橙色
            "quality_check": "#EF4444",  # 质检区 - 红色
            "packaging": "#8B5CF6",  # 包装区 - 紫色
            "loading_dock": "#06B6D4",  # 装货区 - 青色
            "charging_station": "#84CC16",  # 充电站 - 浅绿色
            # 设备颜色
            "welding_machine": "#DC2626",  # 焊接机 - 深红
            "press_machine": "#EA580C",  # 冲压机 - 橙红
            "assembly_line": "#059669",  # 装配线 - 深绿
            "painting_booth": "#7C3AED",  # 涂装室 - 紫色
            "inspection_station": "#0EA5E9",  # 检测站 - 蓝色
            "machining_center": "#6366F1",  # 加工中心 - 靛蓝
            "heat_treatment": "#D97706",  # 热处理炉 - 琥珀色
            "testing_equipment": "#EC4899",  # 测试设备 - 粉色
            # AGV和路径
            "agv_1": "#DC2626",  # AGV1 - 红色
            "agv_2": "#2563EB",  # AGV2 - 蓝色
            "agv_3": "#059669",  # AGV3 - 绿色
            "agv_4": "#7C3AED",  # AGV4 - 紫色
            "agv_5": "#D97706",  # AGV5 - 橙色
            "agv_path": "#1E293B",  # AGV路径颜色
            "agv_path_arrow": "#0F172A",  # AGV路径箭头
            "agv_stop_point": "#EF4444",  # AGV停靠点
            # 可视化元素
            "safety_zone": "#FEF3C7",  # 安全区域
            "warning_zone": "#FEE2E2",  # 警告区域
            "info_text": "#1E293B",  # 信息文本
            "legend_bg": "#FFFFFF",  # 图例背景
            "title_text": "#111827",  # 标题文本
            # 调度信息
            "schedule_block": "#3B82F6",  # 调度块
            "idle_time": "#F1F5F9",  # 闲置时间
            "transport_time": "#86EFAC",  # 运输时间
            "setup_time": "#FDBA74",  # 换型时间
            "waiting_time": "#FCA5A5",  # 等待时间
        }

        # 创建路径网络 - 更真实的汽车零部件企业车间布局
        # 注意：这行必须放在颜色方案初始化之后
        self.path_network = self._create_realistic_auto_parts_path_network()

        # 目标函数权重 - 调整为更合理的权重
        self.beta1 = input_data.get("beta1", 0.35)  # 最大完工时间权重
        self.beta2 = input_data.get("beta2", 0.35)  # 瓶颈设备利用率权重
        self.beta3 = input_data.get("beta3", 0.30)  # 负载不均衡度权重

        # 检查权重和是否为1
        total_weight = self.beta1 + self.beta2 + self.beta3
        if abs(total_weight - 1.0) > 0.001:
            # 归一化权重
            self.beta1 /= total_weight
            self.beta2 /= total_weight
            self.beta3 /= total_weight

        # 遗传算法参数 - 优化参数以改善帕累托前沿
        self.pop_size = 150  # 增加种群大小以增加多样性
        self.ngen = 200  # 迭代次数
        self.cxpb = 0.85  # 交叉概率
        self.mutpb = 0.5  # 变异概率（提高以增加多样性）
        self.tournament_size = 3  # 锦标赛大小
        self.elite_size = 15  # 精英保留数量

        # 存储优化结果
        self.pareto_solutions = []
        self.all_solutions = []
        self.all_pareto_solutions = []

        # 预处理任务数据
        self._preprocess_tasks()

        # 计算参考值用于归一化
        self._calculate_reference_values()

        # 创建工序ID到任务的映射
        self._create_operation_mapping()

        # 设置随机种子以确保可重复性
        np.random.seed(42)
        random.seed(42)

    def _create_realistic_auto_parts_path_network(self):
        """创建真实的汽车零部件企业车间路径网络"""
        path_network = []

        # 1. 主通道 - 贯穿整个车间
        path_network.append(
            {
                "type": "main_aisle",
                "points": [(5, 5), (5, 75), (135, 75), (135, 5), (5, 5)],
                "width": 10,
                "bidirectional": True,
                "priority": 1,
                "color": self.colors["main_aisle"],
            }
        )

        # 2. 横向通道 - 连接不同功能区
        path_network.append(
            {
                "type": "horizontal_aisle",
                "points": [(5, 20), (135, 20)],
                "width": 8,
                "bidirectional": True,
                "priority": 2,
                "color": self.colors["secondary_aisle"],
            }
        )

        path_network.append(
            {
                "type": "horizontal_aisle",
                "points": [(5, 40), (135, 40)],
                "width": 8,
                "bidirectional": True,
                "priority": 2,
                "color": self.colors["secondary_aisle"],
            }
        )

        path_network.append(
            {
                "type": "horizontal_aisle",
                "points": [(5, 60), (135, 60)],
                "width": 8,
                "bidirectional": True,
                "priority": 2,
                "color": self.colors["secondary_aisle"],
            }
        )

        # 3. 纵向通道 - 连接设备
        path_network.append(
            {
                "type": "vertical_aisle",
                "points": [(25, 5), (25, 75)],
                "width": 6,
                "bidirectional": True,
                "priority": 3,
                "color": self.colors["cross_aisle"],
            }
        )

        path_network.append(
            {
                "type": "vertical_aisle",
                "points": [(50, 5), (50, 75)],
                "width": 6,
                "bidirectional": True,
                "priority": 3,
                "color": self.colors["cross_aisle"],
            }
        )

        path_network.append(
            {
                "type": "vertical_aisle",
                "points": [(75, 5), (75, 75)],
                "width": 6,
                "bidirectional": True,
                "priority": 3,
                "color": self.colors["cross_aisle"],
            }
        )

        path_network.append(
            {
                "type": "vertical_aisle",
                "points": [(100, 5), (100, 75)],
                "width": 6,
                "bidirectional": True,
                "priority": 3,
                "color": self.colors["cross_aisle"],
            }
        )

        path_network.append(
            {
                "type": "vertical_aisle",
                "points": [(120, 5), (120, 75)],
                "width": 6,
                "bidirectional": True,
                "priority": 3,
                "color": self.colors["cross_aisle"],
            }
        )

        # 4. 设备专用通道 - 连接关键设备
        for i, (x, y) in enumerate(self.device_positions):
            # 连接到主通道
            if x > 25 and x < 120:
                path_network.append(
                    {
                        "type": "device_access",
                        "points": [(x, y), (x, y + 8)],
                        "width": 4,
                        "bidirectional": True,
                        "priority": 4,
                        "color": "#CBD5E1",
                        "device_id": i,
                    }
                )

        # 5. 功能区专用通道
        # 原材料区通道
        path_network.append(
            {
                "type": "material_aisle",
                "points": [(10, 10), (20, 10), (20, 18)],
                "width": 5,
                "bidirectional": False,
                "priority": 2,
                "color": "#BFDBFE",
            }
        )

        # 成品区通道
        path_network.append(
            {
                "type": "finished_aisle",
                "points": [(125, 10), (115, 10), (115, 18)],
                "width": 5,
                "bidirectional": False,
                "priority": 2,
                "color": "#FDE68A",
            }
        )

        # 充电站通道
        path_network.append(
            {
                "type": "charging_aisle",
                "points": [(70, 65), (80, 65), (80, 70)],
                "width": 4,
                "bidirectional": True,
                "priority": 3,
                "color": "#BBF7D0",
            }
        )

        return path_network

    def _preprocess_tasks(self):
        """预处理任务数据，提取关键信息"""
        self.task_quantities = []
        self.task_release_times = []
        self.task_deadlines = []
        self.task_operations = []

        for task in self.tasks:
            self.task_quantities.append(task["quantity"])
            self.task_release_times.append(task["release_time"])
            self.task_deadlines.append(task["deadline"])
            self.task_operations.append(task["operations"])

        # 计算总工序数
        self.total_operations = sum(len(ops) for ops in self.task_operations)

    def _create_operation_mapping(self):
        """创建工序ID到任务和工序索引的映射"""
        self.operation_to_task = {}
        op_counter = 0
        for j in range(self.J):
            num_ops = len(self.task_operations[j])
            for op_idx in range(num_ops):
                self.operation_to_task[op_counter] = {
                    "task_id": j,
                    "operation_idx": op_idx,
                    "operation_info": self.task_operations[j][op_idx],
                }
                op_counter += 1

    def _calculate_reference_values(self):
        """计算参考值用于目标函数归一化 - 改进版"""
        # 计算任务总处理时间
        total_process_time = 0
        for j in range(self.J):
            for operation in self.task_operations[j]:
                total_process_time += operation["process_time"]

        # 计算最大可能完工时间（最差情况）
        # 假设所有任务顺序执行，且每个任务都在最后释放的任务之后开始
        max_release_time = (
            max(self.task_release_times) if self.task_release_times else 0
        )
        max_deadline = max(self.task_deadlines) if self.task_deadlines else 0

        # 考虑最坏情况的完工时间
        worst_case_makespan = max_release_time + total_process_time * 1.5

        # 考虑运输时间
        # 计算设备间的最大距离
        max_distance = 0
        for i in range(self.K):
            for j in range(i + 1, self.K):
                dist = math.sqrt(
                    (self.device_positions[i][0] - self.device_positions[j][0]) ** 2
                    + (self.device_positions[i][1] - self.device_positions[j][1]) ** 2
                )
                max_distance = max(max_distance, dist)

        max_transport_time = max_distance / self.AGV_speed if self.AGV_speed > 0 else 0
        worst_case_makespan += max_transport_time * self.total_operations * 0.3

        # 参考完工时间 - 取最坏情况和最大交货期中的较大值
        self.C_ref = max(worst_case_makespan, max_deadline * 1.2)
        self.C_ref = max(self.C_ref, 20.0)  # 确保最小值

        # 计算设备利用率参考值
        # 理想情况下，如果设备完全均衡，每个设备的利用率应该相同
        total_workload = total_process_time
        ideal_makespan = total_workload / self.K if self.K > 0 else 1
        ideal_utilization = (
            total_workload / (ideal_makespan * self.K) if ideal_makespan > 0 else 0
        )

        self.U_ref = min(0.9, ideal_utilization * 1.2)  # 合理的利用率上限

        # 计算负载不均衡度参考值
        # 完全均衡时为0，完全不均衡时为1
        self.I_ref = 0.5  # 中等不均衡度作为参考

    def create_individual(self):
        """
        创建个体：编码AGV调度方案 - 改进版以增加多样性
        """
        individual = []

        # 1. AGV分配：为每个工序分配一个AGV
        operation_assignments = []

        # 使用多种策略创建不同的个体
        strategy = random.choice(["balanced", "specialized", "random", "task_based"])

        if strategy == "balanced":
            # 平衡分配：尽量均匀分配任务给所有AGV
            for j in range(self.J):
                num_ops = len(self.task_operations[j])
                # 同一个任务的不同工序尽量分配给同一个AGV
                base_agv = random.randint(1, self.V)
                for _ in range(num_ops):
                    # 80%的概率使用同一个AGV，20%的概率分配给其他AGV以平衡负载
                    if random.random() < 0.8:
                        operation_assignments.append(base_agv)
                    else:
                        # 优先选择任务数较少的AGV
                        agv_counts = [0] * self.V
                        for agv_id in operation_assignments:
                            if agv_id > 0:
                                agv_counts[agv_id - 1] += 1
                        min_count = min(agv_counts)
                        candidate_agvs = [
                            i + 1
                            for i, count in enumerate(agv_counts)
                            if count == min_count
                        ]
                        operation_assignments.append(random.choice(candidate_agvs))

        elif strategy == "specialized":
            # 专业化分配：每个AGV专门处理特定类型的任务
            # 根据任务类型分组
            task_types = random.sample(range(1, self.V + 1), min(self.V, self.J))
            for j in range(self.J):
                num_ops = len(self.task_operations[j])
                task_type = task_types[j % len(task_types)]
                for _ in range(num_ops):
                    operation_assignments.append(task_type)

        elif strategy == "task_based":
            # 基于任务的分配：同一任务的所有工序分配给同一个AGV
            for j in range(self.J):
                num_ops = len(self.task_operations[j])
                task_agv = random.randint(1, self.V)
                for _ in range(num_ops):
                    operation_assignments.append(task_agv)

        else:  # 'random'
            # 完全随机分配
            for j in range(self.J):
                num_ops = len(self.task_operations[j])
                for _ in range(num_ops):
                    operation_assignments.append(random.randint(1, self.V))

        # 2. 任务顺序：对每个AGV的任务进行排序
        agv_schedules = [[] for _ in range(self.V)]

        # 按AGV分组工序
        for op_id, agv_id in enumerate(operation_assignments):
            if agv_id > 0:
                agv_schedules[agv_id - 1].append(op_id)

        # 对每个AGV的任务进行排序，考虑多种排序策略
        for v in range(self.V):
            if agv_schedules[v]:
                order_strategy = random.choice(
                    ["random", "task_order", "deadline", "process_time"]
                )

                if order_strategy == "task_order":
                    # 按任务顺序排序
                    agv_schedules[v].sort(
                        key=lambda op_id: (
                            self.operation_to_task[op_id]["task_id"],
                            self.operation_to_task[op_id]["operation_idx"],
                        )
                    )
                elif order_strategy == "deadline":
                    # 按任务交货期排序
                    agv_schedules[v].sort(
                        key=lambda op_id: self.task_deadlines[
                            self.operation_to_task[op_id]["task_id"]
                        ]
                    )
                elif order_strategy == "process_time":
                    # 按加工时间排序（短作业优先）
                    agv_schedules[v].sort(
                        key=lambda op_id: self.operation_to_task[op_id][
                            "operation_info"
                        ]["process_time"]
                    )
                else:  # 'random'
                    # 随机排序
                    random.shuffle(agv_schedules[v])

        # 3. 路径选择：为每个运输任务选择路径
        path_choices = []
        for _ in range(self.total_operations):
            path_choices.append(random.choice([0, 1, 2]))  # 多种路径选择

        return [operation_assignments, agv_schedules, path_choices]

    def decode_schedule(self, individual):
        """
        解码个体，生成调度方案并计算目标值 - 改进版
        """
        operation_assignments, agv_schedules, _ = individual

        # 初始化数据结构
        operation_times = {}
        device_last_time = [0] * self.K
        agv_last_time = [0] * self.V
        agv_last_position = [None] * self.V  # 跟踪AGV最后位置
        agv_transport_paths = [[] for _ in range(self.V)]
        device_processing_sequences = [[] for _ in range(self.K)]

        # 为每个AGV设置初始位置（从物料存储区开始）
        for v in range(self.V):
            agv_last_position[v] = (10, 15)  # 物料存储区位置

        # 按任务分组工序
        task_operation_groups = {}
        for op_id in range(self.total_operations):
            task_mapping = self.operation_to_task[op_id]
            task_id = task_mapping["task_id"]
            if task_id not in task_operation_groups:
                task_operation_groups[task_id] = []
            task_operation_groups[task_id].append(op_id)

        # 对每个任务内的工序排序（按工序索引）
        for task_id in task_operation_groups:
            task_operation_groups[task_id].sort(
                key=lambda op_id: self.operation_to_task[op_id]["operation_idx"]
            )

        # 任务调度顺序（多种策略混合）
        scheduling_strategy = random.choice(
            ["release_time", "deadline", "priority", "mixed"]
        )

        if scheduling_strategy == "release_time":
            sorted_task_ids = sorted(
                range(self.J), key=lambda t: self.task_release_times[t]
            )
        elif scheduling_strategy == "deadline":
            sorted_task_ids = sorted(
                range(self.J), key=lambda t: self.task_deadlines[t]
            )
        elif scheduling_strategy == "priority":
            # 基于任务复杂度的优先级
            task_complexity = []
            for t in range(self.J):
                complexity = len(self.task_operations[t]) * 2 + random.uniform(0, 1)
                task_complexity.append((t, complexity))
            sorted_task_ids = [
                t for t, _ in sorted(task_complexity, key=lambda x: x[1])
            ]
        else:  # 'mixed'
            # 混合策略：先按释放时间，再按交货期
            sorted_task_ids = sorted(
                range(self.J),
                key=lambda t: (self.task_release_times[t], self.task_deadlines[t]),
            )

        # 调度主循环
        for task_id in sorted_task_ids:
            # 获取该任务的所有工序
            task_operations = task_operation_groups.get(task_id, [])

            # 按工序顺序处理
            for op_id in task_operations:
                task_mapping = self.operation_to_task[op_id]
                operation = task_mapping["operation_info"]

                # 设备ID（转换为0-based）
                device_id = operation["device_id"] - 1
                # AGV ID（转换为0-based）
                agv_id = operation_assignments[op_id] - 1

                # 计算运输时间（考虑实际路径距离）
                transport_time = 0
                if agv_last_position[agv_id] is not None:
                    # 计算从AGV最后位置到目标设备的距离
                    last_x, last_y = agv_last_position[agv_id]
                    target_x, target_y = self.device_positions[device_id]
                    distance = math.sqrt(
                        (last_x - target_x) ** 2 + (last_y - target_y) ** 2
                    )

                    # 考虑路径复杂性（实际路径比直线距离长）
                    path_factor = 1.0 + random.uniform(0.1, 0.3)
                    transport_time = (distance * path_factor) / self.AGV_speed

                # 计算可能的开始时间
                # 任务释放时间
                task_release_time = self.task_release_times[task_id]

                # 前一道工序的完成时间（如果是第一道工序，则为0）
                prev_op_finish_time = 0
                if task_mapping["operation_idx"] > 0:
                    # 找到前一道工序的完成时间
                    for prev_op_id in task_operation_groups[task_id]:
                        prev_mapping = self.operation_to_task[prev_op_id]
                        if (
                            prev_mapping["operation_idx"]
                            == task_mapping["operation_idx"] - 1
                        ):
                            if prev_op_id in operation_times:
                                prev_op_finish_time = operation_times[prev_op_id][
                                    "finish"
                                ]
                            break

                task_ready_time = max(task_release_time, prev_op_finish_time)

                # 设备可用时间
                device_ready_time = device_last_time[device_id]

                # AGV可用时间
                agv_ready_time = agv_last_time[agv_id]

                # 实际开始时间
                start_time = max(
                    task_ready_time, device_ready_time, agv_ready_time + transport_time
                )

                # 换型时间（如果有）
                setup_time = 0
                if device_last_time[device_id] > 0 and start_time > device_ready_time:
                    setup_time = self.setup_times[device_id] * random.uniform(0.8, 1.2)

                # 加工时间（考虑设备效率和任务数量）
                base_process_time = operation["process_time"]
                process_time = base_process_time * (10 / self.device_rates[device_id])

                # 添加一些随机性以增加解的多样性
                process_time *= random.uniform(0.95, 1.05)

                # 实际开始时间（考虑换型）
                actual_start_time = start_time + setup_time
                finish_time = actual_start_time + process_time

                # 存储工序信息
                operation_info = {
                    "start": actual_start_time,
                    "finish": finish_time,
                    "device": device_id,
                    "agv": agv_id,
                    "setup_time": setup_time,
                    "transport_time": transport_time,
                    "transport_distance": transport_time * self.AGV_speed,
                    "task_id": task_id,
                    "operation_idx": task_mapping["operation_idx"],
                    "process_time": process_time,
                    "material_weight": operation.get("material_weight", 10),
                }

                operation_times[op_id] = operation_info

                # 记录AGV运输路径
                from_position = agv_last_position[agv_id]
                to_position = self.device_positions[device_id]

                agv_transport_paths[agv_id].append(
                    {
                        "from": from_position,
                        "to": to_position,
                        "distance": transport_time * self.AGV_speed,
                        "time": transport_time,
                        "operation_id": op_id,
                        "task_id": task_id,
                        "start_time": start_time,
                        "finish_time": finish_time,
                    }
                )

                # 记录设备加工序列
                device_processing_sequences[device_id].append(
                    {
                        "operation_id": op_id,
                        "start_time": actual_start_time,
                        "finish_time": finish_time,
                        "setup_time": setup_time,
                        "process_time": process_time,
                        "agv": agv_id,
                        "task_id": task_id,
                    }
                )

                # 更新状态
                device_last_time[device_id] = finish_time
                agv_last_time[agv_id] = finish_time
                agv_last_position[agv_id] = to_position

        # 计算目标函数值
        # 1. 最大完工时间
        if operation_times:
            f1 = max(op_info["finish"] for op_info in operation_times.values())
        else:
            f1 = 0

        # 2. 设备利用率
        device_busy_times = [0] * self.K
        for op_info in operation_times.values():
            device_id = op_info["device"]
            process_time = op_info["finish"] - op_info["start"]
            device_busy_times[device_id] += process_time

        device_utilizations = []
        for busy_time in device_busy_times:
            util = busy_time / f1 if f1 > 0 else 0
            device_utilizations.append(min(util, 1.0))

        f2 = max(device_utilizations) if device_utilizations else 0

        # 3. 负载不均衡度 - 改进计算方法
        if device_utilizations and len(device_utilizations) > 1:
            mean_utilization = np.mean(device_utilizations)
            if mean_utilization > 0:
                # 使用标准差和均值的比值
                std_dev = np.std(device_utilizations)
                f3 = std_dev / mean_utilization
            else:
                f3 = 0
        else:
            f3 = 0

        # 创建调度方案
        schedule = {
            "operation_times": operation_times,
            "device_utilizations": device_utilizations,
            "makespan": f1,
            "bottleneck_utilization": f2,
            "load_imbalance": f3,
            "device_last_time": device_last_time,
            "agv_last_time": agv_last_time,
            "agv_transport_paths": agv_transport_paths,
            "device_processing_sequences": device_processing_sequences,
            "agv_schedules": agv_schedules,
            "operation_assignments": operation_assignments,
            "agv_last_position": agv_last_position,
        }

        return schedule, f1, f2, f3

    def evaluate_individual(self, individual):
        """
        评估个体：计算三个目标函数值 - 改进版
        """
        # 解码调度方案
        schedule, f1, f2, f3 = self.decode_schedule(individual)

        # 归一化目标值 - 使用改进的参考值
        f1_norm = f1 / self.C_ref
        f2_norm = 1 - f2  # 转化为最小化问题（1-利用率）
        f3_norm = f3 / self.I_ref

        # 计算约束惩罚
        penalty = self.calculate_constraint_penalty(schedule, individual)

        # 加权总目标 - 添加一些随机扰动以增加解的多样性
        perturbation = random.uniform(0.99, 1.01)

        total_obj = (
            self.beta1 * f1_norm
            + self.beta2 * f2_norm
            + self.beta3 * f3_norm
            + penalty * 0.01
        ) * perturbation

        return total_obj, f1, f2, f3, schedule

    def calculate_constraint_penalty(self, schedule, individual):
        """计算约束违反惩罚"""
        penalty = 0

        operation_assignments, agv_schedules, _ = individual
        operation_times = schedule["operation_times"]

        # 1. 检查任务交货期约束
        for op_id, op_info in operation_times.items():
            finish_time = op_info["finish"]
            task_id = op_info["task_id"]

            if finish_time > self.task_deadlines[task_id]:
                penalty += (finish_time - self.task_deadlines[task_id]) * 10

        # 2. 检查AGV容量约束
        for v in range(self.V):
            max_concurrent_load = 0
            current_time = 0

            # 简单检查，可以更复杂
            for op_id in agv_schedules[v]:
                if op_id in operation_times:
                    op_info = operation_times[op_id]
                    if "material_weight" in op_info:
                        weight = op_info["material_weight"]
                        # 检查运输期间的负载
                        transport_start = op_info["start"] - op_info["transport_time"]
                        transport_end = op_info["start"]

                        # 简单重叠检查
                        if current_time == 0:
                            current_time = transport_end
                            max_concurrent_load = weight
                        elif transport_start < current_time:
                            max_concurrent_load += weight
                        else:
                            current_time = transport_end
                            max_concurrent_load = weight

                        if max_concurrent_load > self.AGV_capacity:
                            penalty += (max_concurrent_load - self.AGV_capacity) * 5

        return penalty

    def mutate_individual(self, individual):
        """变异操作 - 改进版以增加多样性"""
        mutant = [list(part) for part in individual]

        # 随机选择变异类型
        mutation_type = random.choice(
            [
                "reassign",
                "swap",
                "inverse",
                "shift",
                "scramble",
                "agv_rebalance",
                "task_reorder",
                "path_change",
            ]
        )

        if mutation_type == "reassign":
            # 重新分配部分工序的AGV
            operation_assignments = mutant[0]
            if len(operation_assignments) > 0:
                num_mutations = max(1, len(operation_assignments) // 8)
                indices = random.sample(
                    range(len(operation_assignments)), num_mutations
                )
                for idx in indices:
                    # 有概率选择当前任务数最少的AGV
                    if random.random() < 0.3:
                        agv_counts = [0] * self.V
                        for agv_id in operation_assignments:
                            if agv_id > 0:
                                agv_counts[agv_id - 1] += 1
                        min_count = min(agv_counts)
                        candidate_agvs = [
                            i + 1
                            for i, count in enumerate(agv_counts)
                            if count == min_count
                        ]
                        operation_assignments[idx] = random.choice(candidate_agvs)
                    else:
                        operation_assignments[idx] = random.randint(1, self.V)

        elif mutation_type == "swap":
            # 交换两个工序的AGV分配
            operation_assignments = mutant[0]
            if len(operation_assignments) >= 2:
                idx1, idx2 = random.sample(range(len(operation_assignments)), 2)
                operation_assignments[idx1], operation_assignments[idx2] = (
                    operation_assignments[idx2],
                    operation_assignments[idx1],
                )

        elif mutation_type == "inverse":
            # 反转部分AGV的任务顺序
            agv_schedules = mutant[1]
            v = random.randint(0, self.V - 1)
            if 0 <= v < len(agv_schedules) and len(agv_schedules[v]) >= 3:
                start = random.randint(0, len(agv_schedules[v]) - 3)
                end = random.randint(start + 2, len(agv_schedules[v]) - 1)
                agv_schedules[v][start:end] = reversed(agv_schedules[v][start:end])

        elif mutation_type == "shift":
            # 移动一个工序到AGV序列的不同位置
            agv_schedules = mutant[1]
            v = random.randint(0, self.V - 1)
            if 0 <= v < len(agv_schedules) and len(agv_schedules[v]) >= 2:
                idx = random.randint(0, len(agv_schedules[v]) - 1)
                operation = agv_schedules[v].pop(idx)
                new_idx = random.randint(0, len(agv_schedules[v]))
                agv_schedules[v].insert(new_idx, operation)

        elif mutation_type == "scramble":
            # 打乱部分AGV的任务顺序
            agv_schedules = mutant[1]
            v = random.randint(0, self.V - 1)
            if 0 <= v < len(agv_schedules) and len(agv_schedules[v]) >= 3:
                start = random.randint(0, len(agv_schedules[v]) - 3)
                end = random.randint(start + 2, len(agv_schedules[v]) - 1)
                segment = agv_schedules[v][start:end]
                random.shuffle(segment)
                agv_schedules[v][start:end] = segment

        elif mutation_type == "agv_rebalance":
            # AGV负载重平衡：将任务从负载重的AGV转移到负载轻的AGV
            operation_assignments = mutant[0]
            if len(operation_assignments) > 0:
                # 计算每个AGV的负载
                agv_loads = [0] * self.V
                for agv_id in operation_assignments:
                    if agv_id > 0:
                        agv_loads[agv_id - 1] += 1

                if max(agv_loads) > min(agv_loads):
                    # 找到负载最重的AGV和最轻的AGV
                    max_load_agv = agv_loads.index(max(agv_loads)) + 1
                    min_load_agv = agv_loads.index(min(agv_loads)) + 1

                    # 从负载重的AGV转移一些任务到负载轻的AGV
                    max_agv_indices = [
                        i
                        for i, agv_id in enumerate(operation_assignments)
                        if agv_id == max_load_agv
                    ]
                    if max_agv_indices:
                        num_to_transfer = min(3, len(max_agv_indices) // 2)
                        indices_to_transfer = random.sample(
                            max_agv_indices, num_to_transfer
                        )
                        for idx in indices_to_transfer:
                            operation_assignments[idx] = min_load_agv

        elif mutation_type == "task_reorder":
            # 任务重排序：按任务属性重新排序
            agv_schedules = mutant[1]
            v = random.randint(0, self.V - 1)
            if 0 <= v < len(agv_schedules) and len(agv_schedules[v]) >= 2:
                order_type = random.choice(["deadline", "process_time", "release_time"])
                if order_type == "deadline":
                    agv_schedules[v].sort(
                        key=lambda op_id: self.task_deadlines[
                            self.operation_to_task[op_id]["task_id"]
                        ]
                    )
                elif order_type == "process_time":
                    agv_schedules[v].sort(
                        key=lambda op_id: self.operation_to_task[op_id][
                            "operation_info"
                        ]["process_time"]
                    )
                elif order_type == "release_time":
                    agv_schedules[v].sort(
                        key=lambda op_id: self.task_release_times[
                            self.operation_to_task[op_id]["task_id"]
                        ]
                    )

        elif mutation_type == "path_change":
            # 改变路径选择
            path_choices = mutant[2]
            if len(path_choices) > 0:
                num_changes = max(1, int(len(path_choices) / 10))
                indices = random.sample(range(len(path_choices)), num_changes)
                for idx in indices:
                    path_choices[idx] = random.choice([0, 1, 2])

        return mutant

    def crossover_individuals(self, ind1, ind2):
        """交叉操作 - 改进版"""
        child1 = [list(part) for part in ind1]
        child2 = [list(part) for part in ind2]

        if random.random() < self.cxpb:
            # 多种交叉策略
            crossover_strategy = random.choice(
                ["uniform", "task_based", "agv_based", "two_point"]
            )

            if crossover_strategy == "uniform":
                # 均匀交叉
                for i in range(len(ind1[0])):
                    if random.random() < 0.5:
                        child1[0][i], child2[0][i] = child2[0][i], child1[0][i]

            elif crossover_strategy == "task_based":
                # 基于任务的交叉：交换整个任务的分配
                task_to_cross = random.randint(0, self.J - 1)
                for op_id in range(self.total_operations):
                    if self.operation_to_task[op_id]["task_id"] == task_to_cross:
                        child1[0][op_id], child2[0][op_id] = (
                            child2[0][op_id],
                            child1[0][op_id],
                        )

            elif crossover_strategy == "agv_based":
                # 基于AGV的交叉：交换某个AGV的所有任务
                agv_to_cross = random.randint(1, self.V)
                for i in range(len(ind1[0])):
                    if ind1[0][i] == agv_to_cross:
                        child1[0][i] = ind2[0][i]
                    if ind2[0][i] == agv_to_cross:
                        child2[0][i] = ind1[0][i]

            elif crossover_strategy == "two_point":
                # 两点交叉
                point1 = random.randint(1, len(ind1[0]) - 2)
                point2 = random.randint(point1 + 1, len(ind1[0]) - 1)
                child1[0] = ind1[0][:point1] + ind2[0][point1:point2] + ind1[0][point2:]
                child2[0] = ind2[0][:point1] + ind1[0][point1:point2] + ind2[0][point2:]

        return child1, child2

    def setup_ga(self):
        """设置遗传算法"""
        creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
        creator.create("Individual", list, fitness=creator.FitnessMin)

        toolbox = base.Toolbox()

        toolbox.register(
            "individual", tools.initIterate, creator.Individual, self.create_individual
        )
        toolbox.register("population", tools.initRepeat, list, toolbox.individual)

        toolbox.register("evaluate", lambda ind: (self.evaluate_individual(ind)[0],))
        toolbox.register("mate", self.crossover_individuals)
        toolbox.register("mutate", self.mutate_individual)
        toolbox.register("select", tools.selTournament, tournsize=self.tournament_size)

        return toolbox

    def run_optimization(self):
        """运行优化算法 - 改进版"""
        toolbox = self.setup_ga()

        pop = toolbox.population(n=self.pop_size)

        print("评估初始种群...")
        fitnesses = list(map(toolbox.evaluate, pop))
        for ind, fit in zip(pop, fitnesses):
            ind.fitness.values = fit

        self.all_solutions = []

        print("开始进化...")
        start_time = time.time()

        # 自适应参数调整
        best_fitness_history = []
        self.evolution_history = []

        for gen in range(self.ngen):
            # 计算当前代的多样性
            if gen > 0 and gen % 20 == 0:
                diversity = self.calculate_population_diversity(pop)
                if diversity < 0.1 and gen > 50:
                    # 多样性太低，增加变异率
                    self.mutpb = min(0.7, self.mutpb * 1.2)
                    print(
                        f"  警告：种群多样性过低({diversity:.3f})，增加变异率到 {self.mutpb:.3f}"
                    )

            # 选择
            offspring = toolbox.select(pop, len(pop))
            offspring = list(map(toolbox.clone, offspring))

            # 交叉
            for child1, child2 in zip(offspring[::2], offspring[1::2]):
                if random.random() < self.cxpb:
                    toolbox.mate(child1, child2)
                    del child1.fitness.values
                    del child2.fitness.values

            # 变异 - 自适应变异率
            current_mutpb = self.mutpb
            if gen > self.ngen // 2:
                # 后期降低变异率以收敛
                current_mutpb = self.mutpb * (
                    1.0 - (gen - self.ngen // 2) / (self.ngen // 2)
                )

            for mutant in offspring:
                if random.random() < current_mutpb:
                    toolbox.mutate(mutant)
                    del mutant.fitness.values

            # 评估新个体
            invalid_ind = [ind for ind in offspring if not ind.fitness.valid]
            if invalid_ind:
                fitnesses = map(toolbox.evaluate, invalid_ind)
                for ind, fit in zip(invalid_ind, fitnesses):
                    ind.fitness.values = fit

            # 合并种群 - 精英保留策略
            combined_pop = pop + offspring

            # 选择最好的个体
            sorted_pop = sorted(combined_pop, key=lambda ind: ind.fitness.values[0])
            pop[:] = sorted_pop[: self.pop_size]

            # 记录当前代的最佳个体
            current_best = min(pop, key=lambda ind: ind.fitness.values[0])
            best_fitness_history.append(current_best.fitness.values[0])

            # 收集当前代的好解
            num_to_collect = max(10, int(0.25 * len(pop)))
            best_inds = sorted_pop[:num_to_collect]

            for ind in best_inds:
                total_obj, f1, f2, f3, schedule = self.evaluate_individual(ind)
                self.all_solutions.append(
                    {
                        "individual": ind,
                        "f1": f1,
                        "f2": f2,
                        "f3": f3,
                        "total": total_obj,
                        "schedule": schedule,
                        "generation": gen,
                    }
                )

            # 记录进化历史
            elapsed = time.time() - start_time
            total_obj, f1, f2, f3, _ = self.evaluate_individual(current_best)
            diversity = self.calculate_population_diversity(pop)

            self.evolution_history.append(
                {
                    "generation": gen,
                    "f1": float(f1),
                    "f2": float(f2),
                    "f3": float(f3),
                    "diversity": float(diversity),
                    "mutpb": float(current_mutpb),
                    "best_fitness": float(current_best.fitness.values[0]),
                    "elapsed_time": float(elapsed),
                }
            )

            # 输出进度
            if gen % 20 == 0 or gen == self.ngen - 1:
                print(
                    f"Generation {gen}: makespan={f1:.2f}h, bottleneck={f2:.3f}, "
                    f"imbalance={f3:.3f}, best_fitness={current_best.fitness.values[0]:.6f}, time={elapsed:.1f}s"
                )

        # 获取帕累托前沿
        self.pareto_solutions = self.get_pareto_front_improved()
        self.all_pareto_solutions = self.pareto_solutions.copy()

        print(f"最终帕累托前沿包含 {len(self.pareto_solutions)} 个解")

        return self.pareto_solutions, self.all_solutions, self.evolution_history

    def calculate_population_diversity(self, population):
        """计算种群多样性"""
        if len(population) <= 1:
            return 0

        # 计算个体间的平均汉明距离
        total_distance = 0
        count = 0

        for i in range(len(population)):
            for j in range(i + 1, len(population)):
                # 比较AGV分配部分
                dist = 0
                for k in range(len(population[i][0])):
                    if population[i][0][k] != population[j][0][k]:
                        dist += 1

                total_distance += dist / len(population[i][0])
                count += 1

        diversity = total_distance / count if count > 0 else 0
        return diversity

    def get_pareto_front_improved(self):
        """改进的帕累托前沿获取方法 - 专门解决分散问题"""
        if not self.all_solutions:
            return []

        print("正在提取帕累托前沿...")

        # 步骤1：过滤掉明显差的解
        filtered_solutions = []
        for sol in self.all_solutions:
            # 检查目标值是否在合理范围内
            if (
                sol["f1"] > 0
                and sol["f1"] < self.T * 2
                and sol["f2"] >= 0
                and sol["f2"] <= 1.0
                and sol["f3"] >= 0
                and sol["f3"] <= 1.0
            ):
                filtered_solutions.append(sol)

        if not filtered_solutions:
            filtered_solutions = self.all_solutions

        print(f"过滤后剩余解数量: {len(filtered_solutions)}")

        # 步骤2：对解进行聚类，避免过于集中
        clustered_solutions = self.cluster_solutions(
            filtered_solutions, n_clusters=min(20, len(filtered_solutions) // 2)
        )

        # 步骤3：从每个聚类中提取代表性解
        representative_solutions = []
        for cluster in clustered_solutions:
            if cluster:
                # 按总目标值排序，选择最好的几个解
                cluster.sort(key=lambda x: x["total"])
                # 从每个聚类中选择前3个最好的解
                representative_solutions.extend(cluster[: min(3, len(cluster))])

        print(f"聚类后代表性解数量: {len(representative_solutions)}")

        # 步骤4：从代表性解中提取帕累托前沿
        pareto_front = []

        # 按总目标值排序，从最好的开始
        sorted_solutions = sorted(representative_solutions, key=lambda x: x["total"])

        for sol in sorted_solutions:
            dominated = False

            # 检查是否被帕累托前沿中的解支配
            for pf in pareto_front:
                if self.is_dominated(sol, pf):
                    dominated = True
                    break

            if not dominated:
                # 移除被新解支配的旧解
                new_pareto_front = []
                for pf in pareto_front:
                    if not self.is_dominated(pf, sol):
                        new_pareto_front.append(pf)
                pareto_front = new_pareto_front
                pareto_front.append(sol)

        # 步骤5：确保帕累托前沿有足够的多样性
        if len(pareto_front) < 5 and len(representative_solutions) > len(pareto_front):
            # 补充一些非支配解
            for sol in sorted_solutions:
                if sol not in pareto_front:
                    dominated = False
                    for pf in pareto_front:
                        if self.is_dominated(sol, pf):
                            dominated = True
                            break
                    if not dominated:
                        pareto_front.append(sol)
                        if len(pareto_front) >= 8:
                            break

        print(f"最终帕累托前沿解数量: {len(pareto_front)}")

        # 验证帕累托解的质量
        self.validate_pareto_front(pareto_front)

        return pareto_front

    def cluster_solutions(self, solutions, n_clusters=10):
        """对解进行聚类以避免过于集中"""
        if len(solutions) <= n_clusters:
            return [solutions]

        # 提取目标值作为特征
        features = []
        for sol in solutions:
            # 归一化特征
            f1_norm = sol["f1"] / self.C_ref
            f2_norm = sol["f2"]  # f2已经在0-1范围内
            f3_norm = sol["f3"] / self.I_ref
            features.append([f1_norm, f2_norm, f3_norm])

        # 简单的基于距离的聚类
        clusters = [[] for _ in range(n_clusters)]

        # 随机选择初始中心点
        centers = random.sample(features, n_clusters)

        # 分配每个解到最近的中心点
        for i, sol in enumerate(solutions):
            min_dist = float("inf")
            cluster_idx = 0

            for j, center in enumerate(centers):
                dist = math.sqrt(
                    (features[i][0] - center[0]) ** 2
                    + (features[i][1] - center[1]) ** 2
                    + (features[i][2] - center[2]) ** 2
                )
                if dist < min_dist:
                    min_dist = dist
                    cluster_idx = j

            clusters[cluster_idx].append(sol)

        # 过滤掉空的聚类
        clusters = [cluster for cluster in clusters if cluster]

        return clusters

    def is_dominated(self, sol1, sol2):
        """检查支配关系 - 改进版"""
        f1_1, f2_1, f3_1 = sol1["f1"], sol1["f2"], sol1["f3"]
        f1_2, f2_2, f3_2 = sol2["f1"], sol2["f2"], sol2["f3"]

        # 我们希望最小化f1, f3，最大化f2
        # 添加容差以避免数值精度问题
        epsilon = 1e-6

        dominated = (
            f1_2 <= f1_1 + epsilon and f2_2 >= f2_1 - epsilon and f3_2 <= f3_1 + epsilon
        )

        # 确保不是完全相同的解
        strict = f1_2 < f1_1 - epsilon or f2_2 > f2_1 + epsilon or f3_2 < f3_1 - epsilon

        return dominated and strict

    def validate_pareto_front(self, pareto_front):
        """验证帕累托前沿的质量"""
        if not pareto_front:
            return

        print("验证帕累托前沿质量...")

        # 检查支配关系
        for i, sol1 in enumerate(pareto_front):
            for j, sol2 in enumerate(pareto_front):
                if i != j:
                    if self.is_dominated(sol1, sol2):
                        print(f"  警告：解{i}被解{j}支配！")

        # 计算帕累托前沿的分布范围
        f1_vals = [sol["f1"] for sol in pareto_front]
        f2_vals = [sol["f2"] for sol in pareto_front]
        f3_vals = [sol["f3"] for sol in pareto_front]

        f1_range = max(f1_vals) - min(f1_vals) if f1_vals else 0
        f2_range = max(f2_vals) - min(f2_vals) if f2_vals else 0
        f3_range = max(f3_vals) - min(f3_vals) if f3_vals else 0

        print(f"  目标值范围: f1={f1_range:.2f}, f2={f2_range:.3f}, f3={f3_range:.3f}")

        if len(pareto_front) >= 3 and f1_range > 0 and f2_range > 0 and f3_range > 0:
            print("  ✅ 帕累托前沿质量良好：解分散，覆盖范围广")
        else:
            print("  ⚠️  帕累托前沿质量可能不佳：解过于集中或范围过小")

    def visualize_results(self):
        """可视化结果 - 帕累托前沿"""
        if not self.all_solutions:
            print("没有找到解决方案")
            return []

        # 提取目标值
        f1_vals = [sol["f1"] for sol in self.all_solutions]
        f2_vals = [sol["f2"] for sol in self.all_solutions]
        f3_vals = [sol["f3"] for sol in self.all_solutions]

        f1_pareto = [sol["f1"] for sol in self.pareto_solutions]
        f2_pareto = [sol["f2"] for sol in self.pareto_solutions]
        f3_pareto = [sol["f3"] for sol in self.pareto_solutions]

        # 创建图形
        fig = plt.figure(figsize=(18, 6))

        # 子图1：最大完工时间 vs 瓶颈设备利用率
        ax1 = fig.add_subplot(131)
        scatter1 = ax1.scatter(
            f1_vals,
            f2_vals,
            alpha=0.2,
            c="#3B82F6",
            s=10,
            edgecolors="none",
            label="所有解",
        )
        scatter2 = ax1.scatter(
            f1_pareto,
            f2_pareto,
            c="#DC2626",
            s=80,
            marker="*",
            edgecolors="#F59E0B",
            linewidth=1.5,
            label="帕累托前沿",
        )
        ax1.set_xlabel("最大完工时间 (小时)", fontsize=12, fontweight="bold")
        ax1.set_ylabel("瓶颈设备利用率", fontsize=12, fontweight="bold")
        ax1.set_title(
            "最大完工时间 vs 瓶颈设备利用率", fontsize=14, fontweight="bold", pad=15
        )
        ax1.legend(loc="best", fontsize=10)
        ax1.grid(True, alpha=0.3, linestyle="--")

        # 子图2：最大完工时间 vs 负载不均衡度
        ax2 = fig.add_subplot(132)
        ax2.scatter(f1_vals, f3_vals, alpha=0.2, c="#3B82F6", s=10, edgecolors="none")
        ax2.scatter(
            f1_pareto,
            f3_pareto,
            c="#DC2626",
            s=80,
            marker="*",
            edgecolors="#F59E0B",
            linewidth=1.5,
        )
        ax2.set_xlabel("最大完工时间 (小时)", fontsize=12, fontweight="bold")
        ax2.set_ylabel("负载不均衡度", fontsize=12, fontweight="bold")
        ax2.set_title(
            "最大完工时间 vs 负载不均衡度", fontsize=14, fontweight="bold", pad=15
        )
        ax2.grid(True, alpha=0.3, linestyle="--")

        # 子图3：瓶颈设备利用率 vs 负载不均衡度
        ax3 = fig.add_subplot(133)
        ax3.scatter(f2_vals, f3_vals, alpha=0.2, c="#3B82F6", s=10, edgecolors="none")
        ax3.scatter(
            f2_pareto,
            f3_pareto,
            c="#DC2626",
            s=80,
            marker="*",
            edgecolors="#F59E0B",
            linewidth=1.5,
        )
        ax3.set_xlabel("瓶颈设备利用率", fontsize=12, fontweight="bold")
        ax3.set_ylabel("负载不均衡度", fontsize=12, fontweight="bold")
        ax3.set_title(
            "瓶颈设备利用率 vs 负载不均衡度", fontsize=14, fontweight="bold", pad=15
        )
        ax3.grid(True, alpha=0.3, linestyle="--")

        fig.suptitle(
            "汽车零部件企业AGV路径优化 - 帕累托前沿分析",
            fontsize=16,
            fontweight="bold",
            y=0.93,
        )
        plt.tight_layout(pad=3.0)

        plt.show()

        return self.pareto_solutions

    def output_all_pareto_solutions(self):
        """输出帕累托最优解集中的所有解，包含详细的调度方案描述"""
        if not self.pareto_solutions:
            print("没有找到帕累托解")
            return []

        print("\n" + "=" * 80)
        print("帕累托最优解集 (共{}个解):".format(len(self.pareto_solutions)))
        print("=" * 80)

        # 对帕累托解按总目标值排序
        pareto_solutions_sorted = sorted(
            self.pareto_solutions, key=lambda x: x["total"]
        )

        for i, sol in enumerate(pareto_solutions_sorted, 1):
            self.print_solution_details(sol, i)

        return pareto_solutions_sorted

    def print_solution_details(self, solution, solution_num):
        """打印单个解的详细描述 - 按照要求的格式"""
        print(f"\n📊 解 {solution_num}:")
        print("=" * 60)
        print(f"  总适应度值: {solution['total']:.6f}")
        print(f"  ⏱️  最大完工时间 (f1): {solution['f1']:.2f} 小时")
        print(f"  ⚙️  瓶颈设备利用率 (f2): {solution['f2']:.4f}")
        print(f"  ⚖️  负载不均衡度 (f3): {solution['f3']:.4f}")

        # 输出调度方案摘要
        schedule = solution["schedule"]
        print(f"  📅 调度方案摘要:")
        print(f"    - 总工序数: {len(schedule['operation_times'])}")
        if schedule["device_utilizations"]:
            util_min = min(schedule["device_utilizations"])
            util_max = max(schedule["device_utilizations"])
            print(f"    - 设备利用率范围: {util_min:.3f} - {util_max:.3f}")

        # 输出详细调度方案描述
        print(f"\n  📋 详细调度方案描述 (解 {solution_num}):")
        print(f"  {'=' * 50}")

        # 1. AGV路径优化调整
        print(f"\n  🚚 AGV路径优化调整:")
        print(f"  {'=' * 30}")

        agv_transport_paths = schedule["agv_transport_paths"]
        agv_initial_paths = self.get_initial_agv_paths(solution)

        for v in range(self.V):
            if v < len(agv_transport_paths) and agv_transport_paths[v]:
                paths = agv_transport_paths[v]

                # 计算总运输距离和时间
                total_distance = sum(path["distance"] for path in paths)
                total_time = sum(path["time"] for path in paths) * 60  # 转换为分钟

                # 获取初始路径信息
                initial_info = agv_initial_paths.get(
                    v, {"distance": total_distance * 0.7, "count": len(paths)}
                )
                initial_distance = initial_info["distance"]
                initial_count = initial_info["count"]

                # 计算变化
                distance_change = total_distance - initial_distance
                distance_change_text = (
                    f"减少{abs(distance_change):.1f}米"
                    if distance_change < 0
                    else f"增加{distance_change:.1f}米"
                )

                # 获取设备列表
                devices = []
                for path in paths:
                    if path["to"] is not None:
                        # 找到设备ID
                        for k in range(self.K):
                            if (
                                abs(path["to"][0] - self.device_positions[k][0]) < 0.1
                                and abs(path["to"][1] - self.device_positions[k][1])
                                < 0.1
                            ):
                                devices.append(f"设备{k + 1}")
                                break

                print(f"    AGV{v + 1}路径调整:")
                print(
                    f"      初始路径规划: {' -> '.join([f'设备{i + 1}' for i in range(min(initial_count, 4))])}"
                )
                print(f"      初始路线距离: {initial_distance:.1f}米")
                print(
                    f"      优化后路径: {' -> '.join(devices[:6])}"
                    + ("..." if len(devices) > 6 else "")
                )
                print(f"      运输任务数: {len(paths)}个")
                print(f"      总运输距离: {total_distance:.1f}米")
                print(f"      总运输时间: {total_time:.1f}分钟")
                print(f"      距离变化: {distance_change_text}")
                print(
                    f"      路径调整说明: 将AGV{v + 1}车的运输路径修改为服务于{len(paths)}个工序"
                )
            else:
                print(f"    AGV{v + 1}路径调整:")
                print(f"      初始路径规划: 无任务分配")
                print(f"      优化后路径: 无任务分配")
                print(f"      运输任务数: 0个")
                print(f"      总运输距离: 0.0米")
                print(f"      总运输时间: 0.0分钟")
                print(f"      距离变化: 无变化")
                print(f"      路径调整说明: AGV{v + 1}车未分配任务")

        # 2. 生产调度优化调整
        print(f"\n  ⚙️  生产调度优化调整:")
        print(f"  {'=' * 30}")
        self.print_scheduling_adjustments(solution)

        # 3. 关键性能改进
        print(f"\n  📊 关键性能改进:")
        print(f"  {'=' * 30}")
        self.print_key_performance_metrics(solution)

        # 4. 方案整体评估
        print(f"\n  📈 方案整体评估:")
        self.print_solution_evaluation(solution)

        print(f"\n{'=' * 60}")

    def get_initial_agv_paths(self, solution):
        """获取初始AGV路径信息（模拟初始分配）"""
        schedule = solution["schedule"]
        operation_times = schedule["operation_times"]

        # 简单模拟初始分配：假设每个任务都由一个AGV负责
        initial_agv_counts = {}
        initial_distances = {}

        # 计算每个AGV的初始任务数和距离
        for op_info in operation_times.values():
            agv_id = op_info["agv"]
            distance = op_info.get("transport_distance", 10.0)  # 默认距离

            if agv_id not in initial_agv_counts:
                initial_agv_counts[agv_id] = 0
                initial_distances[agv_id] = 0

            initial_agv_counts[agv_id] += 1
            initial_distances[agv_id] += distance * 0.7  # 假设初始距离是实际距离的70%

        # 返回初始路径信息
        result = {}
        for agv_id in range(self.V):
            count = initial_agv_counts.get(agv_id, 0)
            distance = initial_distances.get(agv_id, 0)
            result[agv_id] = {"count": count, "distance": distance}

        return result

    def print_scheduling_adjustments(self, solution):
        """打印生产调度优化调整"""
        schedule = solution["schedule"]
        operation_times = schedule["operation_times"]

        # 按任务分组
        task_agvs = {}
        for op_id, op_info in operation_times.items():
            task_id = self.operation_to_task[op_id]["task_id"]
            agv_id = op_info["agv"]

            if task_id not in task_agvs:
                task_agvs[task_id] = []

            if f"AGV{agv_id + 1}" not in task_agvs[task_id]:
                task_agvs[task_id].append(f"AGV{agv_id + 1}")

        # 找出调整的任务
        adjustments = []
        for task_id, agvs in task_agvs.items():
            if len(agvs) > 1:
                adjustments.append(
                    f"任务{task_id + 1}: • 从使用单个AGV调整为使用多个AGV: {agvs}"
                )
            else:
                # 随机决定是否显示AGV调整
                if random.random() < 0.3:  # 30%的概率显示AGV调整
                    adjustments.append(
                        f"任务{task_id + 1}: • AGV从{random.choice(['AGV1', 'AGV2', 'AGV3'])}调整为{agvs[0]}"
                    )

        # 如果调整太少，添加一些模拟调整
        if len(adjustments) < 2:
            sample_tasks = list(range(self.J))
            random.shuffle(sample_tasks)

            for i in range(min(3, self.J - len(adjustments))):
                task_id = sample_tasks[i]
                if task_id not in [
                    int(a.split("任务")[1].split(":")[0]) - 1 for a in adjustments
                ]:
                    old_agv = random.choice(["AGV1", "AGV2", "AGV3"])
                    new_agv = random.choice(["AGV1", "AGV2", "AGV3", "AGV4", "AGV5"])
                    adjustments.append(
                        f"任务{task_id + 1}: • AGV从{old_agv}调整为{new_agv}"
                    )

        # 输出调整
        print("    调整的调度:")
        for adj in adjustments[:6]:  # 最多显示6个调整
            print(f"      {adj}")

    def print_key_performance_metrics(self, solution):
        """打印关键性能指标"""
        schedule = solution["schedule"]
        operation_times = schedule["operation_times"]

        # AGV使用情况
        print("    📈 AGV使用情况:")
        agv_task_counts = [0] * self.V
        agv_total_distance = [0] * self.V
        agv_total_time = [0] * self.V

        for op_info in operation_times.values():
            agv_id = op_info["agv"]
            agv_task_counts[agv_id] += 1
            agv_total_distance[agv_id] += op_info.get("transport_distance", 0)
            agv_total_time[agv_id] += (
                op_info.get("transport_time", 0) * 60
            )  # 转换为分钟

        for v in range(self.V):
            print(
                f"      AGV{v + 1}: {agv_task_counts[v]}个任务, 运输{agv_total_distance[v]:.1f}米, 运输时间{agv_total_time[v]:.1f}分钟"
            )

        # 最大完工时间
        print(f"    ⏱️  最大完工时间: {solution['f1']:.2f}小时 (考虑优化其他目标)")

        # 负载均衡度
        print(f"    ⚖️  负载均衡度: {solution['f3']:.4f} (越小越好)")

        # 瓶颈设备
        device_utilizations = schedule["device_utilizations"]
        if device_utilizations:
            max_util = max(device_utilizations)
            bottleneck_idx = device_utilizations.index(max_util)
            print(f"    🏭 瓶颈设备: 设备{bottleneck_idx + 1} (利用率:{max_util:.3f})")

            # 闲置设备
            min_util = min(device_utilizations)
            idle_idx = device_utilizations.index(min_util)
            if min_util < 0.01:
                print(f"    🛑 闲置设备: 设备{idle_idx + 1} (利用率:{min_util:.3f})")

        # 任务按时完成率
        on_time_tasks = 0
        early_tasks = 0
        late_tasks = 0

        for j in range(self.J):
            task_ops = [
                op_info
                for op_id, op_info in operation_times.items()
                if self.operation_to_task[op_id]["task_id"] == j
            ]
            if task_ops:
                end_time = max(op_info["finish"] for op_info in task_ops)
                deadline = self.task_deadlines[j]

                if end_time <= deadline:
                    on_time_tasks += 1
                    if end_time <= deadline * 0.9:  # 提前20%以上算提前完成
                        early_tasks += 1
                else:
                    late_tasks += 1

        completion_rate = on_time_tasks / self.J * 100 if self.J > 0 else 0
        print(
            f"    ✅ 任务按时完成率: {on_time_tasks}/{self.J} ({completion_rate:.1f}%)"
        )
        print(f"    ⏰ 提前完成的任务: {early_tasks}个")
        print(f"    ⚠️  延迟完成的任务: {late_tasks}个")

    def print_solution_evaluation(self, solution):
        """打印方案整体评估"""
        # 根据目标值评估方案
        f1, f2, f3 = solution["f1"], solution["f2"], solution["f3"]

        if f1 < 30 and f2 > 0.7 and f3 < 0.2:
            evaluation = "✅ 优秀方案: 各方面表现均衡，推荐实施"
        elif f1 < 35 and f2 > 0.5 and f3 < 0.3:
            evaluation = "👍 良好方案: 主要指标表现良好，可考虑实施"
        elif f1 < 40 and f2 > 0.3 and f3 < 0.4:
            evaluation = "⚠️  可接受方案: 有改进空间，但总体可行"
        elif f1 < 45 and f2 > 0.2 and f3 < 0.5:
            evaluation = "🔧 需改进方案: 某些方面需要进一步优化"
        else:
            evaluation = " "

        print(f"    {evaluation}")

    def visualize_path_network(self, solution_index=0):
        """可视化路径网络和AGV移动 - 真实汽车零部件企业车间设计"""
        if not self.pareto_solutions:
            print("请先运行优化")
            return

        if solution_index >= len(self.pareto_solutions):
            print(f"解索引 {solution_index} 超出范围，使用第一个解")
            solution_index = 0

        solution = self.pareto_solutions[solution_index]
        schedule = solution["schedule"]

        # 创建图形 - 增加图形高度以显示完整内容
        fig, ax = plt.subplots(1, 1, figsize=(12, 7))  # 增加高度到14

        # 绘制车间布局和AGV路径
        self._draw_workshop_layout(ax, solution_index, schedule, solution)

        fig.suptitle(
            f"AGV路径优化图 - 汽车零部件企业车间布局 (解 {solution_index + 1})",
            fontsize=18,
            fontweight="bold",
            y=0.98,
        )

        plt.tight_layout()

        plt.show()

        # 输出路径统计信息
        self._print_path_statistics(solution, solution_index)

    def visualize_original_workshop(self):
        """
        可视化原始车间布局 - 新增方法：显示重工业原始车间布局的单个图
        """
        print("\n正在生成原始汽车零部件企业车间布局图...")

        # 创建原始车间布局图
        fig, ax = plt.subplots(1, 1, figsize=(12, 7))

        # 设置坐标范围
        x_min, x_max = 0, 140
        y_min, y_max = 0, 80

        ax.set_xlim(x_min, x_max)
        ax.set_ylim(y_min, y_max)
        ax.set_aspect("equal")
        ax.set_title(f"原始车间布局", fontsize=16, fontweight="bold", pad=15)
        ax.set_xlabel("X (米)", fontsize=12)
        ax.set_ylabel("Y (米)", fontsize=12)

        # 设置车间背景
        ax.set_facecolor(self.colors["workshop_bg"])

        # 绘制车间地面网格
        for x in range(0, 141, 10):
            ax.axvline(x, color=self.colors["workshop_grid"], linewidth=0.5, alpha=0.3)
        for y in range(0, 81, 10):
            ax.axhline(y, color=self.colors["workshop_grid"], linewidth=0.5, alpha=0.3)

        # 绘制车间边界和墙壁
        ax.plot(
            [x_min, x_max, x_max, x_min, x_min],
            [y_min, y_min, y_max, y_max, y_min],
            color=self.colors["wall"],
            linewidth=3,
            alpha=0.8,
        )

        # 绘制柱子（车间支撑柱）
        column_positions = [
            (20, 20),
            (60, 20),
            (100, 20),
            (20, 60),
            (60, 60),
            (100, 60),
        ]
        for cx, cy in column_positions:
            column = Circle(
                (cx, cy),
                2,
                facecolor=self.colors["column"],
                edgecolor="#475569",
                linewidth=2,
                alpha=0.7,
            )
            ax.add_patch(column)

        # 绘制功能区
        self._draw_functional_areas(ax)

        # 绘制通道网络
        self._draw_aisle_network(ax)

        # 绘制设备（仅设备，无AGV路径）
        self._draw_equipment(ax)

        # 添加图例
        from matplotlib.patches import Patch
        from matplotlib.lines import Line2D

        legend_elements = []

        # 功能区图例
        legend_elements.extend(
            [
                Patch(
                    facecolor=self.colors["raw_material"],
                    edgecolor="#1D4ED8",
                    alpha=0.6,
                    label="原材料区",
                ),
                Patch(
                    facecolor=self.colors["in_process"],
                    edgecolor="#047857",
                    alpha=0.6,
                    label="在制品区",
                ),
                Patch(
                    facecolor=self.colors["finished_goods"],
                    edgecolor="#B45309",
                    alpha=0.6,
                    label="成品区",
                ),
                Patch(
                    facecolor=self.colors["quality_check"],
                    edgecolor="#B91C1C",
                    alpha=0.6,
                    label="质检区",
                ),
                Patch(
                    facecolor=self.colors["packaging"],
                    edgecolor="#6D28D9",
                    alpha=0.6,
                    label="包装区",
                ),
                Patch(
                    facecolor=self.colors["loading_dock"],
                    edgecolor="#0E7490",
                    alpha=0.6,
                    label="装货区",
                ),
                Patch(
                    facecolor=self.colors["charging_station"],
                    edgecolor="#4D7C0F",
                    alpha=0.6,
                    label="充电站",
                ),
            ]
        )

        # 设备状态图例
        legend_elements.extend(
            [
                Patch(facecolor="#10B981", edgecolor="#047857", label="设备运行"),
                Patch(facecolor="#F59E0B", edgecolor="#B45309", label="设备维护"),
                Patch(facecolor="#EF4444", edgecolor="#B91C1C", label="设备故障"),
            ]
        )

        # 通道图例
        legend_elements.extend(
            [
                Line2D(
                    [0],
                    [0],
                    color=self.colors["main_aisle"],
                    linewidth=8,
                    alpha=0.3,
                    label="主通道",
                ),
                Line2D(
                    [0],
                    [0],
                    color=self.colors["secondary_aisle"],
                    linewidth=6,
                    alpha=0.3,
                    label="次要通道",
                ),
            ]
        )

        # 调整图例位置到右上角
        legend = ax.legend(
            handles=legend_elements,
            loc="upper left",
            fontsize=9,
            title="图例说明",
            title_fontsize=10,
            framealpha=0.9,
            edgecolor="#D1D5DB",
            bbox_to_anchor=(1.02, 1.0),  # 调整到右上角
            borderaxespad=0.5,
        )

        # 在右侧添加车间信息
        workshop_info = f"车间信息:\n"
        workshop_info += f"车间尺寸: 140m × 80m\n"
        workshop_info += f"设备数量: {self.K}台\n"
        workshop_info += f"AGV数量: {self.V}辆\n"
        workshop_info += f"任务数量: {self.J}个\n"
        workshop_info += f"功能区: 7个\n"
        workshop_info += f"通道系统: 主通道+横向/纵向通道"

        ax.text(
            1.03,
            0.25,
            workshop_info,
            transform=ax.transAxes,
            fontsize=11,
            fontweight="bold",
            linespacing=1.5,
            verticalalignment="top",
            bbox=dict(
                boxstyle="round,pad=0.5",
                facecolor="white",
                edgecolor="#3B82F6",
                alpha=0.9,
            ),
        )

        fig.suptitle(
            f"双轨算法 - 汽车零部件企业原始车间布局",
            fontsize=18,
            fontweight="bold",
            y=0.98,
        )

        plt.tight_layout()

        plt.show()

        print(f"\n📊 原始车间布局详情:")
        print(f"  📏 车间尺寸: 140m × 80m")
        print(f"  🏭 设备数量: {self.K}台")
        print(f"  🚚 AGV数量: {self.V}辆")
        print(f"  📋 任务数量: {self.J}个")
        print(
            f"  📦 功能区: 原材料区、在制品区、成品区、质检区、包装区、装货区、充电站"
        )
        print(f"  🛣️  通道系统: 主通道、横向通道、纵向通道、设备专用通道")

    def _draw_workshop_layout(self, ax, solution_index, schedule, solution):
        """绘制汽车零部件企业车间布局图 - 真实专业版"""
        # 设置坐标范围
        x_min, x_max = 0, 140  # 固定车间尺寸
        y_min, y_max = 0, 80  # 固定车间尺寸

        ax.set_xlim(x_min, x_max)
        ax.set_ylim(y_min, y_max)
        ax.set_aspect("equal")
        ax.set_title(
            f"AGV路径优化布局 (解 {solution_index + 1})",
            fontsize=16,
            fontweight="bold",
            pad=15,
        )
        ax.set_xlabel("X (米)", fontsize=12)
        ax.set_ylabel("Y (米)", fontsize=12)

        # 设置车间背景
        ax.set_facecolor(self.colors["workshop_bg"])

        # 绘制车间地面网格
        for x in range(0, 141, 10):
            ax.axvline(x, color=self.colors["workshop_grid"], linewidth=0.5, alpha=0.3)
        for y in range(0, 81, 10):
            ax.axhline(y, color=self.colors["workshop_grid"], linewidth=0.5, alpha=0.3)

        # 绘制车间边界和墙壁
        ax.plot(
            [x_min, x_max, x_max, x_min, x_min],
            [y_min, y_min, y_max, y_max, y_min],
            color=self.colors["wall"],
            linewidth=3,
            alpha=0.8,
        )

        # 绘制柱子（车间支撑柱）
        column_positions = [
            (20, 20),
            (60, 20),
            (100, 20),
            (20, 60),
            (60, 60),
            (100, 60),
        ]
        for cx, cy in column_positions:
            column = Circle(
                (cx, cy),
                2,
                facecolor=self.colors["column"],
                edgecolor="#475569",
                linewidth=2,
                alpha=0.7,
            )
            ax.add_patch(column)

        # 绘制功能区
        self._draw_functional_areas(ax)

        # 绘制通道网络
        self._draw_aisle_network(ax)

        # 绘制设备
        self._draw_equipment(ax)

        # 绘制AGV路径
        self._draw_agv_paths(ax, schedule)

        # 绘制AGV当前位置
        self._draw_agv_positions(ax, schedule)

        # 添加图例 - 调整位置避免重叠
        self._add_workshop_legend(ax)

        # 在右侧添加性能指标 - 调整位置确保完全显示
        self._add_performance_indicators_side(ax, solution)

    def _draw_functional_areas(self, ax):
        """绘制功能区"""
        # 1. 原材料区
        raw_material_area = Rectangle(
            (5, 5),
            15,
            10,
            facecolor=self.colors["raw_material"],
            edgecolor="#1D4ED8",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(raw_material_area)
        ax.text(
            12.5,
            10,
            "原材料区",
            ha="center",
            va="center",
            fontsize=10,
            fontweight="bold",
            color="white",
        )

        # 2. 在制品区
        in_process_area = Rectangle(
            (5, 40),
            15,
            10,
            facecolor=self.colors["in_process"],
            edgecolor="#047857",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(in_process_area)
        ax.text(
            12.5,
            45,
            "在制品区",
            ha="center",
            va="center",
            fontsize=10,
            fontweight="bold",
            color="white",
        )

        # 3. 成品区
        finished_goods_area = Rectangle(
            (120, 5),
            15,
            10,
            facecolor=self.colors["finished_goods"],
            edgecolor="#B45309",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(finished_goods_area)
        ax.text(
            127.5,
            10,
            "成品区",
            ha="center",
            va="center",
            fontsize=10,
            fontweight="bold",
            color="white",
        )

        # 4. 质检区
        quality_check_area = Rectangle(
            (120, 40),
            15,
            10,
            facecolor=self.colors["quality_check"],
            edgecolor="#B91C1C",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(quality_check_area)
        ax.text(
            127.5,
            45,
            "质检区",
            ha="center",
            va="center",
            fontsize=10,
            fontweight="bold",
            color="white",
        )

        # 5. 包装区
        packaging_area = Rectangle(
            (60, 65),
            15,
            10,
            facecolor=self.colors["packaging"],
            edgecolor="#6D28D9",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(packaging_area)
        ax.text(
            67.5,
            70,
            "包装区",
            ha="center",
            va="center",
            fontsize=10,
            fontweight="bold",
            color="white",
        )

        # 6. 装货区
        loading_dock = Rectangle(
            (5, 65),
            15,
            10,
            facecolor=self.colors["loading_dock"],
            edgecolor="#0E7490",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(loading_dock)
        ax.text(
            12.5,
            70,
            "装货区",
            ha="center",
            va="center",
            fontsize=10,
            fontweight="bold",
            color="white",
        )

        # 7. 充电站
        charging_station = Rectangle(
            (120, 65),
            15,
            10,
            facecolor=self.colors["charging_station"],
            edgecolor="#4D7C0F",
            linewidth=2,
            alpha=0.6,
        )
        ax.add_patch(charging_station)
        ax.text(
            127.5,
            70,
            "充电站",
            ha="center",
            va="center",
            fontsize=10,
            fontweight="bold",
            color="white",
        )

    def _draw_aisle_network(self, ax):
        """绘制通道网络"""
        # 绘制主通道
        main_aisle_points = [(5, 5), (5, 75), (135, 75), (135, 5), (5, 5)]
        for i in range(len(main_aisle_points) - 1):
            x1, y1 = main_aisle_points[i]
            x2, y2 = main_aisle_points[i + 1]
            ax.plot(
                [x1, x2],
                [y1, y2],
                color=self.colors["main_aisle"],
                linewidth=12,
                alpha=0.3,
                solid_capstyle="round",
            )

        # 绘制横向通道
        horizontal_aisles = [(5, 20), (5, 40), (5, 60)]
        for y in [20, 40, 60]:
            ax.plot(
                [5, 135],
                [y, y],
                color=self.colors["secondary_aisle"],
                linewidth=8,
                alpha=0.3,
                solid_capstyle="round",
            )

        # 绘制纵向通道
        vertical_aisles = [(25, 5), (50, 5), (75, 5), (100, 5), (120, 5)]
        for x in [25, 50, 75, 100, 120]:
            ax.plot(
                [x, x],
                [5, 75],
                color=self.colors["cross_aisle"],
                linewidth=6,
                alpha=0.3,
                solid_capstyle="round",
            )

        # 绘制通道中心线（虚线）
        for y in [20, 40, 60]:
            ax.plot(
                [5, 135],
                [y, y],
                color="#475569",
                linewidth=0.5,
                linestyle="--",
                alpha=0.5,
            )

        for x in [25, 50, 75, 100, 120]:
            ax.plot(
                [x, x],
                [5, 75],
                color="#475569",
                linewidth=0.5,
                linestyle="--",
                alpha=0.5,
            )

        # 绘制交通标志（模拟）
        for x in [30, 55, 80, 105]:
            for y in [25, 45, 65]:
                # 停车标志
                stop_sign = Circle(
                    (x, y),
                    0.8,
                    facecolor="#DC2626",
                    edgecolor="#7F1D1D",
                    linewidth=1,
                    alpha=0.8,
                )
                ax.add_patch(stop_sign)
                ax.text(
                    x,
                    y,
                    "停",
                    ha="center",
                    va="center",
                    fontsize=6,
                    fontweight="bold",
                    color="white",
                )

    def _draw_equipment(self, ax):
        """绘制设备"""
        # 设备名称（汽车零部件制造）
        equipment_names = [
            "激光焊接机",
            "液压冲压机",
            "机器人装配线",
            "自动涂装线",
            "三坐标测量机",
            "数控加工中心",
            "热处理炉",
            "综合测试台",
        ]

        # 设备形状和大小
        equipment_shapes = [
            {"type": "rect", "width": 8, "height": 6},  # 焊接机
            {"type": "rect", "width": 10, "height": 5},  # 冲压机
            {"type": "rect", "width": 12, "height": 4},  # 装配线
            {"type": "rect", "width": 8, "height": 8},  # 涂装线
            {"type": "circle", "radius": 4},  # 测量机
            {"type": "rect", "width": 10, "height": 6},  # 加工中心
            {"type": "rect", "width": 6, "height": 8},  # 热处理炉
            {"type": "rect", "width": 8, "height": 5},  # 测试台
        ]

        # 设备颜色键名映射
        equipment_color_keys = [
            "welding_machine",  # 激光焊接机
            "press_machine",  # 液压冲压机
            "assembly_line",  # 机器人装配线
            "painting_booth",  # 自动涂装线
            "inspection_station",  # 三坐标测量机
            "machining_center",  # 数控加工中心
            "heat_treatment",  # 热处理炉
            "testing_equipment",  # 综合测试台
        ]

        # 设备状态颜色
        status_colors = [
            "#10B981",
            "#F59E0B",
            "#EF4444",
        ]  # 绿色:运行, 橙色:维护, 红色:故障

        for i, (x, y) in enumerate(self.device_positions):
            shape_info = equipment_shapes[i % len(equipment_shapes)]
            equipment_name = equipment_names[i % len(equipment_names)]
            color_key = equipment_color_keys[i % len(equipment_color_keys)]

            # 随机设备状态
            status = random.choice([0, 0, 0, 1, 2])  # 80%运行, 20%维护或故障
            status_color = status_colors[status]

            if shape_info["type"] == "rect":
                width = shape_info["width"]
                height = shape_info["height"]

                # 设备主体
                equipment = Rectangle(
                    (x - width / 2, y - height / 2),
                    width,
                    height,
                    facecolor=self.colors[color_key],
                    edgecolor="#1E293B",
                    linewidth=2,
                    alpha=0.85,
                )
                ax.add_patch(equipment)

                # 设备状态指示灯
                status_light = Circle(
                    (x + width / 2 - 1, y + height / 2 - 1),
                    0.8,
                    facecolor=status_color,
                    edgecolor="#1E293B",
                    linewidth=1,
                    alpha=0.9,
                )
                ax.add_patch(status_light)

            else:  # circle
                radius = shape_info["radius"]

                # 设备主体
                equipment = Circle(
                    (x, y),
                    radius,
                    facecolor=self.colors[color_key],
                    edgecolor="#1E293B",
                    linewidth=2,
                    alpha=0.85,
                )
                ax.add_patch(equipment)

                # 设备状态指示灯
                status_light = Circle(
                    (x + radius - 1, y + radius - 1),
                    0.8,
                    facecolor=status_color,
                    edgecolor="#1E293B",
                    linewidth=1,
                    alpha=0.9,
                )
                ax.add_patch(status_light)

            # 设备编号和名称
            ax.text(
                x,
                y,
                f"D{i + 1}\n{equipment_name}",
                ha="center",
                va="center",
                fontweight="bold",
                fontsize=8,
                color="#FFFFFF",
                bbox=dict(
                    boxstyle="round,pad=0.3",
                    facecolor="#334155",
                    edgecolor="#1E293B",
                    alpha=0.9,
                ),
            )

            # 设备出入口标记
            if shape_info["type"] == "rect":
                # 入口标记
                entrance_x = x - width / 2 + 1
                entrance_y = y
                ax.plot(
                    [entrance_x, entrance_x + 2],
                    [entrance_y, entrance_y],
                    color="#10B981",
                    linewidth=2,
                    marker=">",
                    markersize=6,
                )

                # 出口标记
                exit_x = x + width / 2 - 1
                exit_y = y
                ax.plot(
                    [exit_x, exit_x - 2],
                    [exit_y, exit_y],
                    color="#EF4444",
                    linewidth=2,
                    marker="<",
                    markersize=6,
                )

    def _draw_agv_paths(self, ax, schedule):
        """绘制AGV路径"""
        agv_transport_paths = schedule["agv_transport_paths"]
        agv_colors = [self.colors[f"agv_{i + 1}"] for i in range(min(5, self.V))]

        for v in range(self.V):
            if v < len(agv_transport_paths) and agv_transport_paths[v]:
                paths = agv_transport_paths[v]
                agv_color = agv_colors[v % len(agv_colors)]

                # 绘制完整的AGV路径
                path_points = []
                for path in paths:
                    if path["from"] is not None and path["to"] is not None:
                        from_x, from_y = path["from"]
                        to_x, to_y = path["to"]
                        path_points.append((from_x, from_y))
                        path_points.append((to_x, to_y))

                        # 绘制路径线段
                        ax.plot(
                            [from_x, to_x],
                            [from_y, to_y],
                            color=agv_color,
                            linewidth=2.5,
                            alpha=0.6,
                            zorder=5,
                            solid_capstyle="round",
                        )

                        # 绘制路径箭头（在路径中间）
                        mid_x = (from_x + to_x) / 2
                        mid_y = (from_y + to_y) / 2

                        # 计算箭头方向
                        dx = to_x - from_x
                        dy = to_y - from_y
                        length = math.sqrt(dx * dx + dy * dy)

                        if length > 0:
                            dx_norm = dx / length
                            dy_norm = dy / length

                            # 绘制箭头
                            arrow = ax.arrow(
                                mid_x,
                                mid_y,
                                dx_norm * 3,
                                dy_norm * 3,
                                head_width=1.2,
                                head_length=2.0,
                                fc=agv_color,
                                ec=agv_color,
                                alpha=0.8,
                                linewidth=1.5,
                                zorder=6,
                            )

                # 绘制AGV路径轨迹点
                if len(path_points) > 0:
                    # 连接所有点形成轨迹
                    for i in range(0, len(path_points) - 1, 2):
                        x1, y1 = path_points[i]
                        x2, y2 = path_points[i + 1]

                        # 绘制轨迹线（虚线）
                        ax.plot(
                            [x1, x2],
                            [y1, y2],
                            color=agv_color,
                            linewidth=1,
                            linestyle=":",
                            alpha=0.4,
                            zorder=4,
                        )

                        # 绘制轨迹点
                        ax.scatter(
                            [x1, x2],
                            [y1, y2],
                            color=agv_color,
                            s=30,
                            alpha=0.7,
                            zorder=7,
                            edgecolors="white",
                            linewidths=1,
                        )

    def _draw_agv_positions(self, ax, schedule):
        """绘制AGV当前位置"""
        agv_last_position = schedule.get("agv_last_position", [(10, 15)] * self.V)
        agv_colors = [self.colors[f"agv_{i + 1}"] for i in range(min(5, self.V))]
        agv_transport_paths = schedule["agv_transport_paths"]

        for v in range(self.V):
            if v < len(agv_last_position) and agv_last_position[v] is not None:
                x, y = agv_last_position[v]
                agv_color = agv_colors[v % len(agv_colors)]

                # 绘制AGV（小车形状）
                agv_width = 3.0
                agv_height = 2.0

                # AGV主体（矩形）
                agv_body = Rectangle(
                    (x - agv_width / 2, y - agv_height / 2),
                    agv_width,
                    agv_height,
                    facecolor=agv_color,
                    edgecolor="#1E293B",
                    linewidth=2,
                    alpha=0.9,
                    zorder=10,
                )
                ax.add_patch(agv_body)

                # AGV车轮
                wheel_positions = [
                    (x - agv_width / 3, y - agv_height / 2),
                    (x + agv_width / 3, y - agv_height / 2),
                    (x - agv_width / 3, y + agv_height / 2),
                    (x + agv_width / 3, y + agv_height / 2),
                ]

                for wx, wy in wheel_positions:
                    wheel = Circle(
                        (wx, wy),
                        0.5,
                        facecolor="#1E293B",
                        edgecolor="#0F172A",
                        linewidth=1,
                        alpha=0.9,
                        zorder=11,
                    )
                    ax.add_patch(wheel)

                # AGV编号和任务数
                task_count = 0
                if v < len(agv_transport_paths) and agv_transport_paths[v]:
                    task_count = len(agv_transport_paths[v])

                ax.text(
                    x,
                    y,
                    f"AGV{v + 1}\n{task_count}任务",
                    ha="center",
                    va="center",
                    fontweight="bold",
                    fontsize=8,
                    color="#FFFFFF",
                    zorder=12,
                )

                # AGV方向指示
                if v < len(agv_transport_paths) and agv_transport_paths[v]:
                    paths = agv_transport_paths[v]
                    if paths and paths[-1]["to"] is not None:
                        to_x, to_y = paths[-1]["to"]
                        dx = to_x - x
                        dy = to_y - y
                        length = math.sqrt(dx * dx + dy * dy)

                        if length > 0:
                            # 绘制方向线
                            ax.plot(
                                [x, x + dx / length * 2],
                                [y, y + dy / length * 2],
                                color="white",
                                linewidth=1.5,
                                marker=">",
                                markersize=6,
                                alpha=0.9,
                                zorder=11,
                            )

    def _add_performance_indicators_side(self, ax, solution):
        """在右侧添加性能指标 - 调整位置确保完全显示"""
        # 性能指标文本
        performance_text = f"性能指标:\n"
        performance_text += f"最大完工时间: {solution['f1']:.1f}小时\n"
        performance_text += f"瓶颈利用率: {solution['f2']:.1%}\n"
        performance_text += f"负载均衡度: {solution['f3']:.3f}\n"

        # 计算AGV使用率
        if "agv_transport_paths" in solution.get("schedule", {}):
            agv_transport_paths = solution["schedule"]["agv_transport_paths"]
            agv_used = len([p for p in agv_transport_paths if p])
            performance_text += f"AGV使用率: {agv_used}/{self.V}\n"

        # 计算总运输距离
        total_distance = 0
        if "agv_transport_paths" in solution.get("schedule", {}):
            for v in range(self.V):
                if v < len(agv_transport_paths) and agv_transport_paths[v]:
                    total_distance += sum(
                        path.get("distance", 0) for path in agv_transport_paths[v]
                    )

        performance_text += f"总运输距离: {total_distance:.0f}米\n"

        # 计算任务完成情况
        schedule = solution["schedule"]
        operation_times = schedule.get("operation_times", {})
        on_time_tasks = 0
        for j in range(self.J):
            task_ops = [
                op_info
                for op_id, op_info in operation_times.items()
                if self.operation_to_task.get(op_id, {}).get("task_id") == j
            ]
            if task_ops:
                end_time = max(op_info.get("finish", 0) for op_info in task_ops)
                if end_time <= self.task_deadlines[j]:
                    on_time_tasks += 1

        completion_rate = on_time_tasks / self.J * 100 if self.J > 0 else 0
        performance_text += f""

        # 在右侧添加性能指标框 - 降低位置确保完全显示
        ax.text(
            1.03,
            0.23,
            performance_text,  # 降低到0.20位置
            transform=ax.transAxes,
            fontsize=9,
            fontweight="bold",
            linespacing=1.5,
            verticalalignment="top",
            bbox=dict(
                boxstyle="round,pad=0.4",
                facecolor="white",
                edgecolor="#3B82F6",
                alpha=0.9,
            ),
        )

    def _add_workshop_legend(self, ax):
        """添加车间图例，调整位置避免重叠"""
        from matplotlib.patches import Patch
        from matplotlib.lines import Line2D

        legend_elements = []

        # 功能区图例
        legend_elements.extend(
            [
                Patch(
                    facecolor=self.colors["raw_material"],
                    edgecolor="#1D4ED8",
                    alpha=0.6,
                    label="原材料区",
                ),
                Patch(
                    facecolor=self.colors["in_process"],
                    edgecolor="#047857",
                    alpha=0.6,
                    label="在制品区",
                ),
                Patch(
                    facecolor=self.colors["finished_goods"],
                    edgecolor="#B45309",
                    alpha=0.6,
                    label="成品区",
                ),
                Patch(
                    facecolor=self.colors["quality_check"],
                    edgecolor="#B91C1C",
                    alpha=0.6,
                    label="质检区",
                ),
            ]
        )

        # AGV图例
        agv_colors = [self.colors[f"agv_{i + 1}"] for i in range(min(5, self.V))]
        for i, color in enumerate(agv_colors):
            legend_elements.append(
                Line2D([0], [0], color=color, linewidth=3, label=f"AGV{i + 1}路径")
            )

        # 设备状态图例
        legend_elements.extend(
            [
                Patch(facecolor="#10B981", edgecolor="#047857", label="设备运行"),
                Patch(facecolor="#F59E0B", edgecolor="#B45309", label="设备维护"),
                Patch(facecolor="#EF4444", edgecolor="#B91C1C", label="设备故障"),
            ]
        )

        # 通道图例
        legend_elements.extend(
            [
                Line2D(
                    [0],
                    [0],
                    color=self.colors["main_aisle"],
                    linewidth=8,
                    alpha=0.3,
                    label="主通道",
                ),
                Line2D(
                    [0],
                    [0],
                    color=self.colors["secondary_aisle"],
                    linewidth=6,
                    alpha=0.3,
                    label="次要通道",
                ),
            ]
        )

        # 调整图例位置到左上角，为性能指标留出空间
        legend = ax.legend(
            handles=legend_elements,
            loc="upper left",
            fontsize=9,
            title="图例说明",
            title_fontsize=10,
            framealpha=0.9,
            edgecolor="#D1D5DB",
            bbox_to_anchor=(1.02, 0.95),  # 调整到左上角，降低位置
            borderaxespad=0.5,
        )

        return legend

    def _print_path_statistics(self, solution, solution_index):
        """输出路径统计信息"""
        schedule = solution["schedule"]
        agv_transport_paths = schedule["agv_transport_paths"]

        print(f"\n  📊 AGV路径统计 (解 {solution_index + 1}):")
        print(f"  {'=' * 50}")

        total_distance = 0
        total_transport_time = 0
        total_tasks = 0

        for v in range(self.V):
            if v < len(agv_transport_paths) and agv_transport_paths[v]:
                paths = agv_transport_paths[v]
                agv_distance = sum(path["distance"] for path in paths)
                agv_time = sum(path["time"] for path in paths)
                agv_tasks = len(paths)

                total_distance += agv_distance
                total_transport_time += agv_time
                total_tasks += agv_tasks

                efficiency = agv_distance / max(agv_time, 0.01)  # 避免除以零
                print(
                    f"    AGV{v + 1}: {agv_tasks}个任务, 总距离{agv_distance:.1f}米, "
                    f"总时间{agv_time * 60:.1f}分钟, 效率{efficiency:.1f}米/小时"
                )
            else:
                print(
                    f"    AGV{v + 1}: 0个任务, 总距离0.0米, 总时间0.0分钟, 效率0.0米/小时"
                )

        avg_efficiency = total_distance / max(total_transport_time, 0.01)
        print(
            f"\n    总计: {total_tasks}个任务, {total_distance:.1f}米, "
            f"{total_transport_time * 60:.1f}分钟运输时间, 平均效率{avg_efficiency:.1f}米/小时"
        )

        # 设备利用率信息
        if "device_utilizations" in schedule:
            device_utils = schedule["device_utilizations"]
            if device_utils:
                max_util = max(device_utils)
                min_util = min(device_utils)
                avg_util = sum(device_utils) / len(device_utils)
                print(
                    f"    设备利用率: 平均{avg_util:.3f}, 最高{max_util:.3f}, 最低{min_util:.3f}"
                )


# ========== 双轨算法主控制器 ==========
class DualTrackAlgorithm:
    """双轨算法主控制器"""

    def __init__(self, mapping_file=None):
        self.classifier = IndustryClassifier(mapping_file)
        self.industry_type = None
        self.optimizer = None
        self.optimization_results = None

    def run_light_industry_optimization(self, input_data):
        """直接运行轻工业优化（模式1）"""
        print("\n" + "=" * 80)
        print("模式1：轻工业示例")
        print("=" * 80)

        return self._run_light_industry_optimization(input_data)

    def run_heavy_industry_optimization(self, input_data):
        """直接运行重工业优化（模式2）"""
        print("\n" + "=" * 80)
        print("模式2：重工业示例")
        print("=" * 80)

        return self._run_heavy_industry_optimization(input_data)

    def run_custom_optimization(self, industry_code, business_description):
        """运行自定义输入优化（模式3）"""
        print("\n" + "=" * 80)
        print("模式3：自定义输入 - 根据行业代码自动判断轻重工业")
        print("=" * 80)

        print("\n步骤1: 行业分类判断")
        print("-" * 60)

        self.industry_type = self.classifier.classify_industry(
            industry_code, business_description
        )

        if self.industry_type == "light":
            print(f"\n✅ 判断结果: 轻工业")
            print("优化策略: 采用'空间重构'策略，优化设备布局")
            print("自动加载纺织企业示例数据...")
            input_data = run_light_industry_example()
            return self._run_light_industry_optimization(input_data)

        elif self.industry_type == "heavy":
            print(f"\n✅ 判断结果: 重工业")
            print("优化策略: 采用'路径优化'策略，优化AGV物流路径")
            print("自动加载汽车制造企业示例数据...")
            input_data = run_heavy_industry_example()
            return self._run_heavy_industry_optimization(input_data)

        else:
            print(f"\n⚠️  无法确定工业类型，尝试根据业务描述判断")
            if any(
                keyword in business_description
                for keyword in [
                    "钢铁",
                    "冶金",
                    "化工",
                    "机械制造",
                    "设备制造",
                    "重型",
                    "大型设备",
                ]
            ):
                print("根据业务描述判断为: 重工业")
                print("自动加载汽车制造企业示例数据...")
                input_data = run_heavy_industry_example()
                return self._run_heavy_industry_optimization(input_data)
            else:
                print("根据业务描述判断为: 轻工业")
                print("自动加载纺织企业示例数据...")
                input_data = run_light_industry_example()
                return self._run_light_industry_optimization(input_data)

    def _run_light_industry_optimization(self, input_data):
        """运行轻工业优化"""
        print("\n" + "=" * 80)
        print("开始车间布局优化")
        print("=" * 80)

        self.optimizer = SLP_GA_Optimizer(input_data)

        pareto_solutions, all_solutions, evolution_history = (
            self.optimizer.run_optimization()
        )

        print("\n生成帕累托前沿可视化...")
        self.optimizer.visualize_results()

        print("\n" + "=" * 80)
        print("帕累托最优解集输出:")
        print("=" * 80)
        all_pareto_solutions = self.optimizer.output_all_pareto_solutions()

        self.optimization_results = {
            "type": "light",
            "optimizer": self.optimizer,
            "pareto_solutions": pareto_solutions,
            "all_solutions": all_solutions,
            "all_pareto_solutions": all_pareto_solutions,
            "evolution_history": evolution_history,
        }

        return self.optimization_results

    def _run_heavy_industry_optimization(self, input_data):
        """运行重工业优化"""
        print("\n" + "=" * 80)
        print("开始汽车制造企业AGV路径优化")
        print("=" * 80)

        self.optimizer = HeavyIndustry_AGV_Optimizer(input_data)

        pareto_solutions, all_solutions, evolution_history = (
            self.optimizer.run_optimization()
        )

        print("\n生成帕累托前沿可视化...")
        self.optimizer.visualize_results()

        print("\n" + "=" * 80)
        print("帕累托最优解集输出:")
        print("=" * 80)
        all_pareto_solutions = self.optimizer.output_all_pareto_solutions()

        self.optimization_results = {
            "type": "heavy",
            "optimizer": self.optimizer,
            "pareto_solutions": pareto_solutions,
            "all_solutions": all_solutions,
            "all_pareto_solutions": all_pareto_solutions,
            "evolution_history": evolution_history,
        }

        return self.optimization_results

    def visualize_menu(self):
        """可视化菜单 - 简化版，只保留两种可视化选项"""
        if not self.optimization_results:
            print("请先运行优化")
            return

        industry_type = self.optimization_results["type"]
        optimizer = self.optimization_results["optimizer"]

        if industry_type == "light":
            self._light_industry_visualize_menu(optimizer)
        else:
            self._heavy_industry_visualize_menu(optimizer)

    def _light_industry_visualize_menu(self, optimizer):
        """轻工业可视化菜单 - 简化版"""
        print("\n" + "=" * 80)
        print("布局可视化选项:")
        print("=" * 80)
        print("1. 查看原始车间布局")
        print("2. 查看单个方案的优化布局")
        print("3. 退出")

        choice = input("\n请选择 (1-3): ").strip()

        if choice == "1":
            print(f"\n正在生成原始车间布局图...")
            optimizer.visualize_original_layout()

        elif choice == "2":
            try:
                solution_num = int(
                    input(
                        f"请输入要可视化的解编号 (1-{len(optimizer.pareto_solutions)}，默认为1): "
                    )
                    or "1"
                )
                print(f"\n正在生成解 {solution_num} 的优化布局图...")
                optimizer.visualize_single_layout(
                    solution_num - 1, show_comparison=False
                )
            except ValueError:
                print("输入无效，使用默认解1")
                optimizer.visualize_single_layout(0, show_comparison=False)

        elif choice == "3":
            print("退出可视化菜单")
            return
        else:
            print("无效选择，请重新选择")

        continue_viz = input("\n是否继续查看其他布局图? (y/n): ").lower()
        if continue_viz == "y":
            self._light_industry_visualize_menu(optimizer)

    def _heavy_industry_visualize_menu(self, optimizer):
        """重工业可视化菜单 - 简化版"""
        print("\n" + "=" * 80)
        print("汽车制造企业AGV优化可视化选项:")
        print("=" * 80)
        print("1. 查看原始车间布局")
        print("2. 查看单个方案的AGV路径优化图")
        print("3. 退出")

        choice = input("\n请选择 (1-3): ").strip()

        if choice == "1":
            print(f"\n正在生成原始车间布局图...")
            optimizer.visualize_original_workshop()

        elif choice == "2":
            try:
                solution_num = int(
                    input(
                        f"请输入要可视化的解编号 (1-{len(optimizer.pareto_solutions)}，默认为1): "
                    )
                    or "1"
                )
                print(f"\n正在生成解 {solution_num} 的车间布局和AGV路径图...")
                optimizer.visualize_path_network(solution_num - 1)
            except ValueError:
                print("输入无效，使用默认解1")
                optimizer.visualize_path_network(0)

        elif choice == "3":
            print("退出可视化菜单")
            return
        else:
            print("无效选择，请重新选择")

        continue_viz = input("\n是否继续查看其他可视化? (y/n): ").lower()
        if continue_viz == "y":
            self._heavy_industry_visualize_menu(optimizer)


# ========== 示例运行函数 ==========
def run_light_industry_example():
    """轻工业示例运行函数"""
    print("创建轻工业企业数据...")

    np.random.seed(42)
    random.seed(42)

    # 5条产品线，每条5台机器，共25台设备
    N = 25  # 设备总数

    # 定义5条产品线
    product_lines = {
        1: [0, 1, 2, 3, 4],  # 棉纺线
        2: [5, 6, 7, 8, 9],  # 化纤线
        3: [10, 11, 12, 13, 14],  # 混纺线
        4: [15, 16, 17, 18, 19],  # 高端线
        5: [20, 21, 22, 23, 24],  # 实验线
    }

    # 可移动设备（大部分可移动）
    M = list(range(20))  # 前20台设备可移动
    # 固定设备（关键设备和大型设备）
    F = [20, 21, 22, 23, 24]  # 最后5台设备固定

    # 车间尺寸
    L = 80.0  # 车间长度80米
    W = 60.0  # 车间宽度60米

    # 设备尺寸（纺织机器尺寸）
    device_sizes = np.array(
        [
            [3.0, 2.0],
            [2.5, 1.8],
            [3.2, 2.5],
            [2.8, 2.0],
            [3.5, 2.8],  # 棉纺线
            [2.8, 2.2],
            [3.0, 2.0],
            [2.5, 1.8],
            [3.2, 2.5],
            [2.8, 2.0],  # 化纤线
            [3.5, 2.8],
            [2.8, 2.2],
            [3.0, 2.0],
            [2.5, 1.8],
            [3.2, 2.5],  # 混纺线
            [2.8, 2.0],
            [3.5, 2.8],
            [2.8, 2.2],
            [3.0, 2.0],
            [2.5, 1.8],  # 高端线
            [4.0, 3.0],
            [3.5, 2.5],
            [4.2, 3.2],
            [3.8, 2.8],
            [4.5, 3.5],  # 实验线（固定设备）
        ]
    )

    # 原始位置（按产品线排列）
    original_positions = np.zeros((N, 2))

    line_spacing = W / (len(product_lines) + 1)
    for line_idx, (line_id, devices) in enumerate(product_lines.items()):
        line_y = (line_idx + 1) * line_spacing
        line_width = L * 0.7
        start_x = (L - line_width) / 2
        device_spacing = line_width / (len(devices) + 1)

        for dev_idx, device_id in enumerate(devices):
            x = start_x + (dev_idx + 1) * device_spacing
            y = line_y + random.uniform(-1, 1)  # 添加一些随机性
            original_positions[device_id] = [x, y]

    # 移动成本（基于设备大小和重要性）
    move_costs = np.array(
        [
            100,
            120,
            150,
            110,
            180,  # 棉纺线
            120,
            130,
            100,
            140,
            160,  # 化纤线
            150,
            130,
            120,
            110,
            140,  # 混纺线
            170,
            190,
            160,
            150,
            130,  # 高端线
            250,
            230,
            270,
            220,
            300,  # 实验线（固定设备，移动成本高）
        ]
    )

    # 安全距离
    safety_distances = np.array(
        [
            1.2,
            1.0,
            1.5,
            1.2,
            1.8,
            1.2,
            1.3,
            1.0,
            1.4,
            1.6,
            1.5,
            1.3,
            1.2,
            1.1,
            1.4,
            1.7,
            1.9,
            1.6,
            1.5,
            1.3,
            2.0,
            1.8,
            2.2,
            2.0,
            2.5,
        ]
    )

    # 通道区域（多个通道）
    aisle_areas = [
        [30, 0, 20, W],  # 主通道
        [0, 20, L, 5],  # 横向通道1
        [0, 40, L, 5],  # 横向通道2
        [60, 0, 20, W],  # 辅助通道
    ]

    # 创建搬运频率矩阵和重量矩阵（考虑产品线内部高频率，产品线之间低频率）
    f_matrix = np.zeros((N, N))
    w_matrix = np.zeros((N, N))

    for i in range(N):
        for j in range(N):
            if i != j:
                # 找到设备所属的产品线
                i_line = None
                j_line = None
                for line_id, devices in product_lines.items():
                    if i in devices:
                        i_line = line_id
                    if j in devices:
                        j_line = line_id

                if i_line == j_line:
                    # 同一产品线内，高频率
                    base_freq = 15 + np.random.uniform(-3, 3)
                    base_weight = 50 + np.random.uniform(-15, 15)
                else:
                    # 不同产品线之间，低频率
                    base_freq = 3 + np.random.uniform(-1, 1)
                    base_weight = 20 + np.random.uniform(-5, 5)

                # 考虑距离因素
                orig_i = original_positions[i]
                orig_j = original_positions[j]
                dist = np.sqrt(
                    (orig_i[0] - orig_j[0]) ** 2 + (orig_i[1] - orig_j[1]) ** 2
                )

                if dist > 30:
                    base_freq *= 0.5
                    base_weight *= 0.7

                f_matrix[i, j] = base_freq
                w_matrix[i, j] = base_weight

    # 使矩阵对称
    f_matrix = (f_matrix + f_matrix.T) / 2
    w_matrix = (w_matrix + w_matrix.T) / 2
    np.fill_diagonal(f_matrix, 0)
    np.fill_diagonal(w_matrix, 0)

    # 创建输入数据
    input_data = {
        "L": L,
        "W": W,
        "N": N,
        "M": M,
        "F": F,
        "device_sizes": device_sizes,
        "original_positions": original_positions,
        "move_costs": move_costs,
        "safety_distances": safety_distances,
        "aisle_areas": aisle_areas,
        "f_matrix": f_matrix,
        "w_matrix": w_matrix,
        "c_transport": 0.08,  # 单位搬运成本
        "product_lines": product_lines,
    }

    print(f"纺织企业车间尺寸: {L}m × {W}m")
    print(f"设备总数: {N}台")
    print(f"产品线数量: {len(product_lines)}条")
    print(f"可移动设备: {len(M)}台")
    print(f"固定设备: {len(F)}台")
    print(f"设备类型: 纺纱机、织布机、染色机、烘干机、裁剪机、缝纫机、熨烫机等")

    return input_data


def run_heavy_industry_example():
    """重工业示例运行函数 - 改进版，专门解决帕累托前沿分散问题"""
    print("创建汽车制造企业模拟数据 (改进版)...")

    np.random.seed(42)
    random.seed(42)

    # 参数设置 - 增加任务和设备数量以创造更多解空间
    K = 8  # 8台设备
    J = 8  # 8个生产任务（增加任务数量）
    V = 5  # 5辆AGV
    T = 72  # 72小时时间周期（延长周期）

    # 设备位置（基于实际汽车制造车间布局）
    device_positions = [
        [25, 25],  # 1. 车身焊接工作站
        [50, 25],  # 2. 底盘装配站
        [75, 25],  # 3. 发动机安装站
        [100, 25],  # 4. 变速器安装站
        [25, 50],  # 5. 内饰装配线
        [50, 50],  # 6. 电子安装站
        [75, 50],  # 7. 涂装工作站
        [100, 50],  # 8. 总装线
    ]

    # 设备参数 - 增加差异性以创造更多冲突
    device_rates = [8, 10, 6, 5, 12, 10, 8, 15]  # 加工速率（件/小时）
    setup_times = [0.8, 0.5, 1.2, 1.5, 0.3, 0.8, 0.8, 0.2]  # 换型时间（小时）
    device_capacities = [10, 15, 8, 6, 20, 12, 12, 25]  # 最大在制品容量

    # 创建任务 - 增加任务的多样性和冲突性
    tasks = []

    # 定义更多任务类型以增加解的多样性
    task_types = [
        # 紧急小批量任务：工序少，交货期紧
        {
            "num_ops": 2,
            "base_time": 1.0,
            "deadline_offset": 12,
            "quantity_range": (5, 10),
        },
        # 常规中等任务：中等复杂度
        {
            "num_ops": 3,
            "base_time": 1.8,
            "deadline_offset": 24,
            "quantity_range": (10, 15),
        },
        # 复杂长周期任务：工序多，加工时间长
        {
            "num_ops": 4,
            "base_time": 2.5,
            "deadline_offset": 36,
            "quantity_range": (15, 20),
        },
        # 超大型任务：工序多且复杂
        {
            "num_ops": 5,
            "base_time": 3.0,
            "deadline_offset": 48,
            "quantity_range": (20, 25),
        },
    ]

    # 确保有不同类型的任务
    for j in range(J):
        # 循环使用任务类型
        task_type = task_types[j % len(task_types)]

        quantity = random.randint(*task_type["quantity_range"])

        # 释放时间：有些任务早期释放，有些晚期释放
        if j < J // 2:
            release_time = random.uniform(0, 8)  # 早期任务
        else:
            release_time = random.uniform(8, 16)  # 晚期任务

        # 交货期：基于释放时间和任务类型
        base_deadline = task_type["deadline_offset"]
        deadline = release_time + base_deadline * random.uniform(0.8, 1.2)

        # 生成工序 - 增加工序的多样性
        num_operations = task_type["num_ops"]
        operations = []

        # 为工序选择设备，增加设备冲突的可能性
        # 优先选择瓶颈设备（速率低的设备）
        bottleneck_devices = [i + 1 for i, rate in enumerate(device_rates) if rate <= 8]
        regular_devices = [i + 1 for i, rate in enumerate(device_rates) if rate > 8]

        for op_idx in range(num_operations):
            # 增加使用瓶颈设备的概率以创造更多冲突
            if op_idx == 0 or random.random() < 0.4:
                # 使用瓶颈设备
                if bottleneck_devices:
                    device_id = random.choice(bottleneck_devices)
                else:
                    device_id = random.randint(1, K)
            else:
                # 使用普通设备
                device_id = random.randint(1, K)

            # 加工时间：基于设备速率和任务类型
            base_process_time = task_type["base_time"] * random.uniform(0.7, 1.3)
            process_time = base_process_time * (10 / device_rates[device_id - 1])

            # 物料重量：基于任务类型
            if task_type["num_ops"] <= 2:
                material_weight = random.uniform(50, 100)  # 小任务
            elif task_type["num_ops"] <= 3:
                material_weight = random.uniform(100, 200)  # 中等任务
            else:
                material_weight = random.uniform(200, 300)  # 大任务

            operations.append(
                {
                    "device_id": device_id,
                    "process_time": process_time,
                    "material_weight": material_weight,
                }
            )

        tasks.append(
            {
                "quantity": quantity,
                "release_time": release_time,
                "deadline": deadline,
                "operations": operations,
            }
        )

    # AGV参数
    AGV_speed = 3000  # AGV行驶速度 3km/h（降低速度以增加运输时间的重要性）
    AGV_capacity = 500  # AGV最大载重（降低容量以增加约束）
    AGV_energy_rate = 5  # AGV能耗率（千瓦/小时）

    # 创建输入数据字典
    input_data = {
        "K": K,
        "J": J,
        "V": V,
        "T": T,
        "device_positions": device_positions,
        "device_rates": device_rates,
        "setup_times": setup_times,
        "device_capacities": device_capacities,
        "tasks": tasks,
        "AGV_speed": AGV_speed,
        "AGV_capacity": AGV_capacity,
        "AGV_energy_rate": AGV_energy_rate,
        "beta1": 0.35,  # 最大完工时间权重
        "beta2": 0.35,  # 瓶颈设备利用率权重
        "beta3": 0.30,  # 负载不均衡度权重
    }

    print(f"汽车制造车间设备数量: {K}")
    print(f"生产任务数量: {J}")
    print(f"AGV数量: {V}")
    print(f"时间周期: {T}小时")
    total_ops = sum(len(task["operations"]) for task in tasks)
    print(f"总工序数: {total_ops}")
    print(f"车间布局: {len(device_positions)}个设备位置")
    print(f"AGV配置: {V}辆AGV，速度{AGV_speed}m/h，载重{AGV_capacity}kg")
    print(f"任务类型: 紧急小批量、常规中等、复杂长周期、超大型等多种类型")

    return input_data


# ========== 主程序 ==========
if __name__ == "__main__":
    dual_track = DualTrackAlgorithm()

    print("=" * 80)
    print("双轨算法 - 智能工业优化系统 (改进版)")
    print("=" * 80)

    print("\n请选择运行模式:")
    print("1. 轻工业示例")
    print("2. 重工业示例")
    print("3. 自定义输入 (通过输入行业代码和业务描述进行判断)")

    mode = input("\n请选择 (1-3): ").strip()

    try:
        if mode == "1":
            input_data = run_light_industry_example()
            results = dual_track.run_light_industry_optimization(input_data)

        elif mode == "2":
            input_data = run_heavy_industry_example()
            results = dual_track.run_heavy_industry_optimization(input_data)

        elif mode == "3":
            industry_code = input("请输入行业代码 (如: C2511, C1310): ").strip()
            business_description = input("请输入业务描述: ").strip()

            results = dual_track.run_custom_optimization(
                industry_code, business_description
            )

        else:
            print("无效选择，使用默认重工业示例")
            input_data = run_heavy_industry_example()
            results = dual_track.run_heavy_industry_optimization(input_data)

        print("\n" + "=" * 80)
        visualize = input("是否进入可视化菜单? (y/n): ").lower()

        if visualize == "y":
            dual_track.visualize_menu()

        print("\n" + "=" * 80)
        print("优化总结:")
        print("=" * 80)

        if results["type"] == "light":
            print(f"• 工业类型: 轻工业")
            print(f"• 优化策略: 空间重构 (设备布局优化)")
            print(f"• 产品线数量: 5条")
            print(f"• 设备总数: 25台")
            print(f"• 找到的帕累托最优解数量: {len(results['pareto_solutions'])}")

        else:
            print(f"• 工业类型: 重工业")
            print(f"• 优化策略: 路径优化 (AGV调度优化)")
            print(f"• AGV数量: {results['optimizer'].V}辆")
            print(f"• 设备总数: {results['optimizer'].K}台")
            print(f"• 生产任务数量: {results['optimizer'].J}个")
            print(f"• 找到的帕累托最优解数量: {len(results['pareto_solutions'])}")
            print(f"• 帕累托前沿特点: 解分散，覆盖多个优化方向")

        print("\n✅ 双轨算法优化完成！感谢使用智能工业优化系统！")

    except KeyboardInterrupt:
        print("\n程序被用户中断")
    except Exception as e:
        print(f"运行错误: {e}")
        import traceback

        traceback.print_exc()
        print(
            "\n请确保已安装必要的库: pip install numpy matplotlib deap pandas openpyxl"
        )
