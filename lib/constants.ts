import { GlobalConfig, RoleCost, TeamRole } from '@/types';

// 默认人力成本配置（月薪）
export const DEFAULT_ROLE_COSTS: RoleCost[] = [
  {
    role: '产品经理',
    salaryLow: 15000,
    salaryMid: 20000,
    salaryHigh: 30000,
    selectedLevel: 'mid'
  },
  {
    role: '项目经理',
    salaryLow: 18000,
    salaryMid: 25000,
    salaryHigh: 35000,
    selectedLevel: 'mid'
  },
  {
    role: '架构师',
    salaryLow: 25000,
    salaryMid: 35000,
    salaryHigh: 50000,
    selectedLevel: 'mid'
  },
  {
    role: '平面设计师',
    salaryLow: 12000,
    salaryMid: 18000,
    salaryHigh: 25000,
    selectedLevel: 'mid'
  },
  {
    role: '后端开发工程师',
    salaryLow: 15000,
    salaryMid: 22000,
    salaryHigh: 32000,
    selectedLevel: 'mid'
  },
  {
    role: '前端开发工程师',
    salaryLow: 15000,
    salaryMid: 22000,
    salaryHigh: 32000,
    selectedLevel: 'mid'
  },
  {
    role: '移动端IOS开发工程师',
    salaryLow: 16000,
    salaryMid: 23000,
    salaryHigh: 33000,
    selectedLevel: 'mid'
  },
  {
    role: '移动端Android开发工程师',
    salaryLow: 16000,
    salaryMid: 23000,
    salaryHigh: 33000,
    selectedLevel: 'mid'
  },
  {
    role: '小程序开发工程师',
    salaryLow: 14000,
    salaryMid: 20000,
    salaryHigh: 28000,
    selectedLevel: 'mid'
  }
];

// 工期单位成本（以天为单位，后端为基准）
export const DEFAULT_WORK_DURATION = {
  低: 2,
  中: 4,
  高: 6,
  极高: 10
};

// 各角色相对后端的工期比例
export const DEFAULT_ROLE_RATIOS: Record<TeamRole, number> = {
  '产品经理': 0.2,
  '项目经理': 0.2,
  '架构师': 0.2,
  '平面设计师': 0.5,
  '后端开发工程师': 1.0,
  '前端开发工程师': 0.5,
  '移动端IOS开发工程师': 0.5,
  '移动端Android开发工程师': 0.5,
  '小程序开发工程师': 0.5
};

// 默认影响系数
export const DEFAULT_IMPACT_FACTORS = [
  { name: '质量要求', value: 1.0 },
  { name: '灾备要求', value: 1.0 },
  { name: '服务器成本', value: 1.0 }
];

// 折扣选项
export const DISCOUNT_OPTIONS = [
  { label: '无折扣', value: 1 },
  { label: '9.5折', value: 0.95 },
  { label: '9折', value: 0.9 },
  { label: '8.5折', value: 0.85 },
  { label: '8折', value: 0.8 },
  { label: '7折', value: 0.7 }
];

// 复杂度选项
export const COMPLEXITY_OPTIONS = ['低', '中', '高', '极高'] as const;

// 优先级选项
export const PRIORITY_OPTIONS = ['低', '中', '高', '极高'] as const;

// 平台选项
export const PLATFORM_OPTIONS = ['PC端', 'Web端', 'H5页面', 'Android端', 'IOS端', '小程序'] as const;

// 默认全局配置
export const DEFAULT_CONFIG: GlobalConfig = {
  roleCosts: DEFAULT_ROLE_COSTS,
  workDurationConfigs: DEFAULT_WORK_DURATION,
  roleRatios: DEFAULT_ROLE_RATIOS,
  impactFactors: DEFAULT_IMPACT_FACTORS
};


