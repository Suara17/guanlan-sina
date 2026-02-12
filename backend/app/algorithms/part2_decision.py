import numpy as np
from tqdm import tqdm
from pymoo.core.callback import Callback
from pymoo.core.problem import ElementwiseProblem
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.optimize import minimize
from pymoo.operators.crossover.sbx import SBX
from pymoo.operators.mutation.pm import PM
from pymoo.operators.sampling.rnd import FloatRandomSampling
from pymoo.termination import get_termination

# --- 1. 全局设置 ---
np.set_printoptions(suppress=True, precision=4)


# --- 2. 进度条配置 ---
class ProgressBarCallback(Callback):
    def __init__(self, n_gen):
        super().__init__()
        self.pbar = tqdm(total=n_gen, desc="  🚀 算法运行中…", unit="gen", ncols=80)

    def notify(self, algorithm):
        self.pbar.update(1)

    def close(self):
        self.pbar.close()


# --- 3. 定义问题模型 (仅在独立运行时用于生成模拟数据) ---
class TianchouDecisionProblem(ElementwiseProblem):
    def __init__(self):
        super().__init__(n_var=5, n_obj=3, n_ieq_constr=2, xl=0, xu=10)

    def _evaluate(self, x, out, *args, **kwargs):
        resource_input = x[0]
        automation_level = x[1]

        # 模拟参数（数据来源），实际使用时，请替换为真实数据！
        direct_cost = 1000 * resource_input + 5000 * automation_level
        implementation_cycle = 50 / (resource_input + 1) + 25
        indirect_cost = implementation_cycle * 500
        efficiency_gain = 0.05 * automation_level + 0.02 * resource_input

        # 目标函数
        f1 = direct_cost + indirect_cost
        f2 = implementation_cycle
        f3 = -efficiency_gain  # 收益取负，因为算法默认求最小化

        # 约束条件
        g1 = f1 - 100000
        g2 = f2 - 60

        out["F"] = [f1, f2, f3]
        out["G"] = [g1, g2]


# --- 4. 辅助函数配置 ---
def select_representative_solutions(res_F):
    """
    自动筛选几个有代表性的方案（最低成本、最短工期、最高收益、折中方案）
    """
    solutions = res_F.copy()
    min_val = np.min(solutions, axis=0)
    max_val = np.max(solutions, axis=0)
    denom = max_val - min_val
    denom[denom == 0] = 1e-6
    norm_solutions = (solutions - min_val) / denom

    idx_min_cost = np.argmin(solutions[:, 0])
    idx_min_time = np.argmin(solutions[:, 1])
    idx_max_benefit = np.argmin(solutions[:, 2])  # 注意：输入通常假设收益列是负数(min)

    # 综合最优 (Knee Point)
    ideal_point = np.array([0, 0, 0])
    distances = np.linalg.norm(norm_solutions - ideal_point, axis=1)
    idx_knee = np.argmin(distances)

    # 中心折中
    mean_point = np.mean(norm_solutions, axis=0)
    dist_to_mean = np.linalg.norm(norm_solutions - mean_point, axis=1)
    idx_center = np.argmin(dist_to_mean)

    return {
        "极端-低成本": idx_min_cost,
        "极端-短工期": idx_min_time,
        "极端-高收益": idx_max_benefit,
        "综合-性价比": idx_knee,
        "折中-中心点": idx_center
    }


def interpret_one_solution(label, index, solution_vector, stats, score=None):
    """
    解读并打印单个方案的详细信息
    """
    cost = solution_vector[0]
    time = solution_vector[1]
    # 这里做个兼容：如果收益是负数（算法原始输出），取绝对值显示；如果是正数（外部传入），直接显示
    benefit_raw = solution_vector[2]
    benefit_rate = abs(benefit_raw)

    # 如果是基于比例的模拟数据，乘以100显示百分比；如果是真实金额，直接显示
    # 这里简单处理：如果数值很小(<1)，假设是比例
    benefit_display = f"{benefit_rate:.2f}"
    if benefit_rate < 1.0:
        benefit_display = f"{benefit_rate * 100:.1f}%"
    else:
        benefit_display = f"{benefit_rate:,.2f}"

    def get_tag(value, min_v, max_v):
        if max_v == min_v: return "一般"
        ratio = (value - min_v) / (max_v - min_v)
        if ratio < 0.33:
            return "低"
        elif ratio < 0.66:
            return "中"
        else:
            return "高"

    tag_cost = get_tag(cost, stats['min_cost'], stats['max_cost'])
    tag_time = get_tag(time, stats['min_time'], stats['max_time'])

    # 收益的Tag计算（收益越大越好，所以逻辑反过来或者取绝对值后判断）
    benefit_abs = abs(benefit_raw)
    benefit_ratio = (benefit_abs - stats['min_benefit']) / (stats['max_benefit'] - stats['min_benefit']) if stats[
                                                                                                                'max_benefit'] != \
                                                                                                            stats[
                                                                                                                'min_benefit'] else 0
    tag_benefit = "一般" if benefit_ratio < 0.33 else ("良好" if benefit_ratio < 0.66 else "超高")

    print(f"【{label}】 (方案ID: {index})")
    if score is not None:
        print(f"  🏆 TOPSIS 综合得分: {score:.4f}")
    print(f"  ├─ 💰 总投入: {cost:,.2f}  \t-> {tag_cost}成本")
    print(f"  ├─ ⏱️ 工期:   {time:.1f}      \t-> {tag_time}工期")
    print(f"  ├─ 📈 年收益:   {benefit_display}      \t-> {tag_benefit}回报")
    print("-" * 60)


# --- 5. AHP & TOPSIS 交互函数 ---
def parse_input(val_str):
    try:
        if "/" in val_str:
            parts = val_str.split("/")
            return float(parts[0]) / float(parts[1])
        return float(val_str)
    except:
        return None


def get_interactive_matrix():
    """
    获取用户输入的AHP判断矩阵
    """
    print("\n" + "=" * 60)
    print("  【AHP 交互式权重设定】 ")
    print("  请输入两两比较的重要性 (1=同等重要, 3=稍微重要, 5=明显重要...)")
    print("  如果反过来重要，请输入分数 (如 1/3, 1/5)")
    print("=" * 60)

    matrix = np.eye(3)
    criteria = ["成本 (Cost)", "工期 (Time)", "收益 (Benefit)"]

    while True:
        val = input(f"  Q1: 相比于【{criteria[1]}】，【{criteria[0]}】有多重要? (输入数字): ")
        v = parse_input(val)
        if v: matrix[0, 1], matrix[1, 0] = v, 1 / v; break
        print("  ❌ 输入格式错误，请重新输入！")

    while True:
        val = input(f"  Q2: 相比于【{criteria[2]}】，【{criteria[0]}】有多重要? (输入数字): ")
        v = parse_input(val)
        if v: matrix[0, 2], matrix[2, 0] = v, 1 / v; break
        print("  ❌ 输入格式错误，请重新输入！")

    while True:
        val = input(f"  Q3: 相比于【{criteria[2]}】，【{criteria[1]}】有多重要? (输入数字): ")
        v = parse_input(val)
        if v: matrix[1, 2], matrix[2, 1] = v, 1 / v; break
        print("  ❌ 输入格式错误，请重新输入！")

    return matrix


def ahp_weight_calculation(comparison_matrix):
    """
    计算AHP权重并进行一致性检验

    返回:
        tuple: (weights, CR) 如果一致性检验通过
        None: 如果一致性检验失败
    """
    n = comparison_matrix.shape[0]
    eig_val, eig_vec = np.linalg.eig(comparison_matrix)
    max_eig_val = np.max(eig_val)
    max_eig_vec = eig_vec[:, np.argmax(eig_val)]
    weights = (max_eig_vec / np.sum(max_eig_vec)).real

    RI = {1: 0, 2: 0, 3: 0.58, 4: 0.90}
    CI = (max_eig_val - n) / (n - 1)
    CR = CI / RI[n] if n in RI else 0

    print(f"\n  📊 一致性检验: CR = {CR.real:.4f}", end=" ")
    if CR < 0.1:
        print("-> ✅ 通过！ ")
        return (weights, CR.real)  # 返回元组
    else:
        print("-> ❌ 失败 (您的判断存在逻辑矛盾，一致性检验不通过！)")
        return None


def topsis_ranking(pareto_solutions, weights):
    """
    使用TOPSIS算法对帕累托解集进行排序
    """
    data = np.array(pareto_solutions).astype(float)
    processed = data.copy()

    # 正向化处理:
    # 假设 data 结构为 [成本, 工期, 收益]
    # 成本和工期越小越好 (极小化指标 -> 转换为极大化)
    # 收益越大越好 (已经是极大化指标，如果输入是负值则需要处理)

    # 处理成本 (min -> max)
    processed[:, 0] = data[:, 0].max() - data[:, 0]
    # 处理工期 (min -> max)
    processed[:, 1] = data[:, 1].max() - data[:, 1]

    # 处理收益
    # 如果收益数据是负数（代表min(-收益)），我们取绝对值或者 max-x 变正
    # 这里假设输入可能为负（来自pymoo）或为正。
    # 为了通用性，如果发现数据全是负数，取绝对值；如果是正数，保持不变。
    if np.all(data[:, 2] <= 0):
        processed[:, 2] = np.abs(data[:, 2])
    else:
        # 如果是正数，直接归一化即可，不需要 max-x
        processed[:, 2] = data[:, 2]

        # 向量归一化
    denom = np.sqrt((processed ** 2).sum(axis=0))
    denom[denom == 0] = 1e-6
    norm_data = processed / denom

    # 加权
    weighted = norm_data * weights

    # 确定理想解和负理想解
    ideal_best = weighted.max(axis=0)
    ideal_worst = weighted.min(axis=0)

    # 计算距离
    dist_best = np.sqrt(((weighted - ideal_best) ** 2).sum(axis=1))
    dist_worst = np.sqrt(((weighted - ideal_worst) ** 2).sum(axis=1))

    # 计算得分
    score = dist_worst / (dist_best + dist_worst + 1e-6)
    return score


# --- 6. 主程序执行 (仅当直接运行此文件时执行) ---
if __name__ == "__main__":
    print(">>> 正在以独立模式运行 Part 2 (生成模拟数据演示)...")

    # 配置
    N_GEN = 500
    problem = TianchouDecisionProblem()
    algorithm = NSGA2(pop_size=100, n_offsprings=50, sampling=FloatRandomSampling(),
                      crossover=SBX(prob=0.9, eta=15), mutation=PM(prob=0.01, eta=20), eliminate_duplicates=True)
    termination = get_termination("n_gen", N_GEN)

    # === Step 1: NSGA-II 算法生成方案 ===
    print("Step 1: 正在计算帕累托最优解集...\n")
    pbar = ProgressBarCallback(N_GEN)
    res = minimize(problem, algorithm, termination, seed=1, callback=pbar, verbose=False)
    pbar.close()

    results = res.F
    benefits_abs = np.abs(results[:, 2])
    stats = {
        'min_cost': np.min(results[:, 0]), 'max_cost': np.max(results[:, 0]),
        'min_time': np.min(results[:, 1]), 'max_time': np.max(results[:, 1]),
        'min_benefit': np.min(benefits_abs), 'max_benefit': np.max(benefits_abs)
    }

    # === Step 2: 基础全景展示 ===
    selected_indices = select_representative_solutions(results)
    print("\nStep 2: 基础分析 - 5 个最具代表性的方案概览\n")
    print("=" * 75)
    print(f"{'标签':<16} | {'方案ID':<6} | {'总成本':<12} | {'工期':<10} | {'收益率':<10}")
    print("-" * 75)
    for label, idx in selected_indices.items():
        s = results[idx]
        print(f"{label:<16} | {idx:<6} | {s[0]:,.0f}      | {s[1]:.1f}       | {-s[2] * 100:.1f}%")
    print("=" * 75)

    print("\n正在为您详细解读这 5 个方案...")
    print("-" * 60)
    unique_indices = {}
    for label, idx in selected_indices.items():
        if idx not in unique_indices: unique_indices[idx] = []
        unique_indices[idx].append(label)

    for idx, labels in unique_indices.items():
        label_str = " & ".join(labels)
        interpret_one_solution(label_str, idx, results[idx], stats)

    # === Step 3: AHP-TOPSIS 交互决策 ===
    print("\nStep 3: 启动 AHP-TOPSIS 优化方案辅助决策系统 ")

    weights = None
    while True:
        user_matrix = get_interactive_matrix()
        weights = ahp_weight_calculation(user_matrix)

        if weights is not None:
            print("-" * 50)
            print(f"  ⚖️  最终计算权重: 成本={weights[0]:.2f}, 工期={weights[1]:.2f}, 年收益={weights[2]:.2f}")
            print("-" * 50)
            break
        else:
            print("\n  ⚠️  请重新输入判断矩阵。\n")

    # === Step 4: 最终推荐与对比 ===
    # 准备数据 (收益转正)
    topsis_data = results.copy()
    # topsis_ranking 内部会自动处理收益符号，这里保持原样传入即可

    final_scores = topsis_ranking(topsis_data, weights)
    best_idx = np.argmax(final_scores)

    print("\n  >>> ✅ 系统经过自动分析后，最终的推荐方案如下： <<<")
    print("=" * 75)
    interpret_one_solution("AHP-TOPSIS 优选", best_idx, results[best_idx], stats, score=final_scores[best_idx])

    # 智能对比分析
    knee_idx = selected_indices['综合-性价比']
    print("【 最终决策分析 】")
    if best_idx != knee_idx:
        print(f"  1. 您的选择与系统的【综合-性价比最高(Knee拐点方案)】(方案 {knee_idx}) 不一致。")
        print(f"  2. 原因分析：您输入的偏好导致权重发生了偏移。")
        if weights[1] > 0.5:
            print("     -> 您非常看重工期，因此系统放弃了部分性价比，为您选了工期更短的方案。")
        elif weights[0] > 0.5:
            print("     -> 您非常看重成本，因此系统为您选择了成本更低的方案。")
    else:
        print(f"  1. 您的选择与系统的【综合-性价比最高(Knee拐点方案)】(方案 {knee_idx}) 完全一致！")
        print(f"  2. 这说明您的直觉偏好非常符合数学上的最优平衡点。")