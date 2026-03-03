"""
布局图片生成服务
用于生成车间布局图（原始布局/优化布局）的 base64 编码图片
"""

import base64
from io import BytesIO
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Rectangle

from app.algorithms import part1_optimization


class LayoutImageGenerator:
    """布局图片生成器"""

    def __init__(self, industry_type: str):
        self.industry_type = industry_type

    def generate_layout_image(
        self,
        positions: list[list[float]],
        device_sizes: list[list[float]],
        workshop_dims: dict,
        solution_data: Optional[dict] = None,
        original_positions: Optional[list[list[float]]] = None,
    ) -> str:
        """
        生成布局图片并返回 base64 编码

        参数:
            positions: 设备位置坐标 [[x, y], ...]
            device_sizes: 设备尺寸 [[width, height], ...]
            workshop_dims: 车间尺寸 {L: float, W: float}
            solution_data: 优化方案数据（可选，用于显示性能指标）
            original_positions: 原始位置（可选，用于显示设备移动箭头）

        返回:
            base64 编码的 PNG 图片字符串
        """
        L = workshop_dims.get("L", 80.0)
        W = workshop_dims.get("W", 60.0)

        fig, ax = plt.subplots(1, 1, figsize=(16, 10))

        self._draw_layout(
            ax,
            positions,
            device_sizes,
            L,
            W,
            solution_data=solution_data,
            original_positions=original_positions,
        )

        fig.suptitle(
            "车间设备布局" + (" - 优化后" if solution_data else " - 原始"),
            fontsize=18,
            fontweight="bold",
            y=0.95,
        )

        plt.tight_layout(pad=3.0)

        buffer = BytesIO()
        fig.savefig(
            buffer,
            format="png",
            dpi=120,
            bbox_inches="tight",
            facecolor="white",
            edgecolor="none",
        )
        buffer.seek(0)

        img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        plt.close(fig)

        return img_base64

    def _draw_layout(
        self,
        ax,
        positions,
        device_sizes,
        L: float,
        W: float,
        solution_data: Optional[dict] = None,
        original_positions: Optional[list[list[float]]] = None,
    ):
        """绘制布局图"""
        ax.clear()
        ax.set_xlim(0, L)
        ax.set_ylim(0, W)
        ax.set_aspect("equal")
        ax.set_title("", fontsize=14, fontweight="bold", pad=10)
        ax.set_xlabel("X (米)", fontsize=11)
        ax.set_ylabel("Y (米)", fontsize=11)
        ax.grid(True, alpha=0.3, linestyle="--", color="#c0c0c0")

        rect = Rectangle(
            (0, 0),
            L,
            W,
            linewidth=2,
            edgecolor="black",
            facecolor="#f8f9fa",
            alpha=0.8,
        )
        ax.add_patch(rect)

        colors = {
            "fixed": "#8b4513",
            "movable": "#4169e1",
            "moved": "#32cd32",
            "storage_area": "#87ceeb",
            "quality_area": "#ffd700",
            "packaging_area": "#90ee90",
            "loading_area": "#ffb6c1",
        }

        for i, (x, y) in enumerate(positions):
            width = device_sizes[i][0] if i < len(device_sizes) else 3.0
            height = device_sizes[i][1] if i < len(device_sizes) else 2.0

            color = colors.get("movable")
            edgecolor = "blue"
            hatch = None

            if original_positions is not None and i < len(original_positions):
                orig_x, orig_y = original_positions[i]
                dist = np.sqrt((x - orig_x) ** 2 + (y - orig_y) ** 2)
                if dist > 0.5:
                    color = colors.get("moved")
                    edgecolor = "green"
                    hatch = "xx"

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

            ax.text(
                x,
                y,
                f"D{i + 1}",
                ha="center",
                va="center",
                fontsize=8,
                fontweight="bold",
                color="white",
            )

        if solution_data:
            f1 = solution_data.get("f1", 0)
            f2 = solution_data.get("f2", 0)
            ax.text(
                L - 10,
                W - 5,
                f"搬运成本: ¥{f1:.2f}\n移动成本: ¥{f2:.2f}",
                ha="right",
                va="top",
                fontsize=10,
                bbox=dict(boxstyle="round", facecolor="wheat", alpha=0.8),
            )
