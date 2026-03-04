/**
 * 天筹任务模板数据
 */

import { IndustryType, TaskPriority, type TaskTemplate } from '../types/tianchou'

export const lightIndustryTemplates: TaskTemplate[] = [
  {
    id: 'textile_standard',
    name: '标准纺织车间',
    industry_type: IndustryType.LIGHT,
    description: '常规纺织生产车间布局优化',
    icon: '🏭',
    params: {
      name: '标准纺织车间优化',
      industry_type: IndustryType.LIGHT,
      workshop_length: 80,
      workshop_width: 60,
      device_count: 25,
      daily_output_value: 20000,
      base_cost: 20000,
      construction_rate: 3000,
      benefit_multiplier: 200,
    },
    constraints: {
      priority: TaskPriority.NORMAL,
      production_lines: ['生产线A', '生产线B', '生产线C'],
      line_capacity: { '生产线A': 1000, '生产线B': 800, '生产线C': 600 },
      batch_count: 3,
      changeover_time: 30,
    },
  },
  {
    id: 'textile_expansion',
    name: '扩产需求',
    industry_type: IndustryType.LIGHT,
    description: '产能扩张场景，多产线协调',
    icon: '📈',
    params: {
      name: '扩产车间布局优化',
      industry_type: IndustryType.LIGHT,
      workshop_length: 120,
      workshop_width: 80,
      device_count: 40,
      daily_output_value: 35000,
      base_cost: 35000,
      construction_rate: 5000,
      benefit_multiplier: 350,
    },
    constraints: {
      priority: TaskPriority.HIGH,
      production_lines: ['生产线A', '生产线B', '生产线C', '生产线D', '生产线E'],
      line_capacity: { '生产线A': 1200, '生产线B': 1000, '生产线C': 900, '生产线D': 800, '生产线E': 600 },
      batch_count: 5,
      changeover_time: 45,
      max_cycle_time: 480,
    },
  },
  {
    id: 'electronics',
    name: '电子装配',
    industry_type: IndustryType.LIGHT,
    description: '电子元件装配车间，多批次生产',
    icon: '📱',
    params: {
      name: '电子装配车间优化',
      industry_type: IndustryType.LIGHT,
      workshop_length: 50,
      workshop_width: 40,
      device_count: 15,
      daily_output_value: 30000,
      base_cost: 25000,
      construction_rate: 4000,
      benefit_multiplier: 300,
    },
    constraints: {
      priority: TaskPriority.HIGH,
      production_lines: ['SMT线', '装配线', '测试线'],
      line_capacity: { 'SMT线': 5000, '装配线': 3000, '测试线': 2500 },
      batch_count: 8,
      changeover_time: 15,
      max_cycle_time: 360,
    },
  },
]

export const heavyIndustryTemplates: TaskTemplate[] = [
  {
    id: 'agv_standard',
    name: '标准AGV调度',
    industry_type: IndustryType.HEAVY,
    description: '常规AGV搬运调度优化',
    icon: '🚚',
    params: {
      name: '标准AGV调度优化',
      industry_type: IndustryType.HEAVY,
      station_count: 8,
      agv_count: 3,
      daily_output_value: 50000,
      base_cost: 40000,
      benefit_multiplier: 50000,
    },
    constraints: {
      priority: TaskPriority.NORMAL,
      batch_count: 4,
      changeover_time: 20,
    },
  },
  {
    id: 'agv_heavy_load',
    name: '重载AGV',
    industry_type: IndustryType.HEAVY,
    description: '大件运输场景，重载AGV调度',
    icon: '🏗️',
    params: {
      name: '重载AGV调度优化',
      industry_type: IndustryType.HEAVY,
      station_count: 6,
      agv_count: 2,
      daily_output_value: 80000,
      base_cost: 60000,
      benefit_multiplier: 80000,
    },
    constraints: {
      priority: TaskPriority.URGENT,
      batch_count: 2,
      changeover_time: 60,
      max_cycle_time: 600,
    },
  },
  {
    id: 'production_line',
    name: '产线协调',
    industry_type: IndustryType.HEAVY,
    description: '多产线协调生产，批次依赖调度',
    icon: '⚙️',
    params: {
      name: '产线协调调度优化',
      industry_type: IndustryType.HEAVY,
      station_count: 10,
      agv_count: 4,
      daily_output_value: 60000,
      base_cost: 50000,
      benefit_multiplier: 60000,
    },
    constraints: {
      priority: TaskPriority.HIGH,
      production_lines: ['产线1', '产线2', '产线3'],
      line_capacity: { '产线1': 200, '产线2': 180, '产线3': 150 },
      batch_count: 6,
      changeover_time: 30,
      max_cycle_time: 480,
    },
  },
]

export const allTemplates: TaskTemplate[] = [
  ...lightIndustryTemplates,
  ...heavyIndustryTemplates,
]

export function getTemplatesByIndustry(industry: IndustryType): TaskTemplate[] {
  return industry === IndustryType.LIGHT ? lightIndustryTemplates : heavyIndustryTemplates
}

export function getTemplateById(id: string): TaskTemplate | undefined {
  return allTemplates.find((t) => t.id === id)
}
