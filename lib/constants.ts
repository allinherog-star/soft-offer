import { GlobalConfig, RoleCost, TeamRole, WorkExperience } from '@/types';

// 角色基础薪资（用于计算推荐月薪，调整为产生30k、35k、40k、80k等整数）
const ROLE_BASE_SALARY: Record<TeamRole, number> = {
  '产品经理': 19200,  // 二线中厂6年 -> 30k
  '项目经理': 25600,  // 二线中厂6年 -> 40k
  '架构师': 35600,    // 一线大厂10年 -> 80k
  '平面设计师': 18300, // 三线小厂4年 -> 22k
  '后端开发工程师': 22400, // 二线中厂6年 -> 35k
  '前端开发工程师': 22400, // 二线中厂6年 -> 35k
  '移动端IOS开发工程师': 22400, // 二线中厂6年 -> 35k
  '移动端Android开发工程师': 22400, // 二线中厂6年 -> 35k
  '小程序开发工程师': 16700 // 三线小厂4年 -> 20k
};

// 工作经验系数
const EXPERIENCE_MULTIPLIER: Record<WorkExperience, number> = {
  '一线大厂': 1.5,
  '二线中厂': 1.2,
  '三线小厂': 1.0,
  '新手上路': 0.7
};

// 根据角色、经验和年限计算推荐月薪（返回千单位的整数）
export function calculateRecommendedSalary(
  role: TeamRole,
  experience: WorkExperience,
  workYears: number
): number {
  const baseSalary = ROLE_BASE_SALARY[role];
  const experienceMultiplier = EXPERIENCE_MULTIPLIER[experience];
  const yearBonus = Math.min(workYears * 0.05, 0.5); // 每年加5%，最多50%
  
  // 返回千单位的整数
  return Math.round((baseSalary * experienceMultiplier * (1 + yearBonus)) / 1000);
}

// 默认人力成本配置（月薪）
// 工作年限根据经验自动匹配：新手上路(2年)、三线小厂(4年)、二线中厂(6年)、一线大厂(10年)
export const DEFAULT_ROLE_COSTS: RoleCost[] = [
  {
    role: '产品经理',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('产品经理', '一线大厂', 10)
  },
  {
    role: '项目经理',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('项目经理', '一线大厂', 10)
  },
  {
    role: '架构师',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('架构师', '一线大厂', 10)
  },
  {
    role: '平面设计师',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('平面设计师', '一线大厂', 10)
  },
  {
    role: '后端开发工程师',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('后端开发工程师', '一线大厂', 10)
  },
  {
    role: '前端开发工程师',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('前端开发工程师', '一线大厂', 10)
  },
  {
    role: '移动端IOS开发工程师',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('移动端IOS开发工程师', '一线大厂', 10)
  },
  {
    role: '移动端Android开发工程师',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('移动端Android开发工程师', '一线大厂', 10)
  },
  {
    role: '小程序开发工程师',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('小程序开发工程师', '一线大厂', 10)
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

// 行业选项
export const INDUSTRY_OPTIONS = [
  { label: '互联网', icon: 'Globe' },
  { label: '金融', icon: 'BadgeDollarSign' },
  { label: '电商', icon: 'ShoppingCart' },
  { label: '教育', icon: 'GraduationCap' },
  { label: '医疗健康', icon: 'Heart' },
  { label: '制造业', icon: 'Factory' },
  { label: '零售', icon: 'Store' },
  { label: '物流', icon: 'Truck' },
  { label: '房地产', icon: 'Home' },
  { label: '能源', icon: 'Zap' },
  { label: '政府', icon: 'Landmark' },
  { label: '通信', icon: 'Radio' },
  { label: '媒体', icon: 'Tv' },
  { label: '旅游', icon: 'Plane' },
  { label: '餐饮', icon: 'UtensilsCrossed' },
  { label: '企业服务', icon: 'Briefcase' },
  { label: '游戏', icon: 'Gamepad2' },
  { label: '社交', icon: 'Users' },
  { label: '汽车', icon: 'Car' },
  { label: '农业', icon: 'Sprout' },
  { label: '其他', icon: 'MoreHorizontal' }
] as const;

// 默认全局配置
export const DEFAULT_CONFIG: GlobalConfig = {
  roleCosts: DEFAULT_ROLE_COSTS,
  workDurationConfigs: DEFAULT_WORK_DURATION,
  roleRatios: DEFAULT_ROLE_RATIOS,
  impactFactors: DEFAULT_IMPACT_FACTORS
};


