import { GlobalConfig, RoleCost, TeamRole, WorkExperience } from '@/types';

// 角色基础薪资（用于计算推荐标准月薪，调整为产生30k、35k、40k、80k等整数）
const ROLE_BASE_SALARY: Record<TeamRole, number> = {
  '产品经理': 19200,  // 二线中厂6年 -> 30k
  '项目经理': 25600,  // 二线中厂6年 -> 40k
  '架构师': 35600,    // 一线大厂10年 -> 80k
  '美工师': 18300, // 三线小厂4年 -> 22k
  '后端开发工程师': 22400, // 二线中厂6年 -> 35k
  '前端开发工程师': 22400, // 二线中厂6年 -> 35k
  'IOS开发工程师': 22400, // 二线中厂6年 -> 35k
  'Android开发工程师': 22400, // 二线中厂6年 -> 35k
  '小程序开发工程师': 16700 // 三线小厂4年 -> 20k
};

// 工作经验系数
const EXPERIENCE_MULTIPLIER: Record<WorkExperience, number> = {
  '一线大厂': 1.5,
  '二线中厂': 1.2,
  '三线小厂': 1.0,
  '新手上路': 0.7
};

// 根据角色、经验和年限计算推荐标准月薪（返回千单位的整数）
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

// 默认人力成本配置（标准月薪）
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
    role: '美工师',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('美工师', '一线大厂', 10)
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
    role: 'IOS开发工程师',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('IOS开发工程师', '一线大厂', 10)
  },
  {
    role: 'Android开发工程师',
    experience: '一线大厂',
    workYears: 10,
    salary: calculateRecommendedSalary('Android开发工程师', '一线大厂', 10)
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
  很高: 10
};

// 各角色相对后端的工期比例
export const DEFAULT_ROLE_RATIOS: Record<TeamRole, number> = {
  '产品经理': 0.2,
  '项目经理': 0.2,
  '架构师': 0.2,
  '美工师': 0.5,
  '后端开发工程师': 1.0,
  '前端开发工程师': 0.5,
  'IOS开发工程师': 0.5,
  'Android开发工程师': 0.5,
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
  { label: '无折扣', value: 1, description: '标准报价' },
  { label: '9.5折', value: 0.95, description: '首次合作客户' },
  { label: '9折', value: 0.9, description: '合作1-2次' },
  { label: '8.5折', value: 0.85, description: '合作3-5次' },
  { label: '8折', value: 0.8, description: '长期合作客户' },
  { label: '7折', value: 0.7, description: '战略合作伙伴' }
];

// 复杂度选项
export const COMPLEXITY_OPTIONS = ['低', '中', '高', '很高'] as const;

// 优先级选项
export const PRIORITY_OPTIONS = ['低', '中', '高', '很高'] as const;

// 平台选项
export const PLATFORM_OPTIONS = ['PC端', 'Web端', 'H5', 'Android端', 'IOS端', '小程序', '后台'] as const;

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

// 服务器规格单价配置（参考阿里云，元/台/年）
export const SERVER_SPEC_PRICES: Record<string, number> = {
  '2C4G': 2400,    // 约200元/月
  '4C8G': 4800,    // 约400元/月
  '8C16G': 9600,   // 约800元/月
  '16C32G': 14400, // 约1200元/月
  '24C48G': 19200, // 约1600元/月
  '32C64G': 28800  // 约2400元/月
};

// 存储规格单价配置（参考阿里云，元/年）
export const STORAGE_SPEC_PRICES: Record<string, number> = {
  '40GB': 480,     // 约40元/月
  '100GB': 1200,   // 约100元/月
  '500GB': 6000,   // 约500元/月
  '1T': 12000,     // 约1000元/月
  '按需': 0        // 按需计费
};

// 带宽规格单价配置（参考阿里云，元/年）
export const BANDWIDTH_SPEC_PRICES: Record<string, number> = {
  '1Mbps': 360,    // 约30元/月
  '2Mbps': 720,    // 约60元/月
  '3Mbps': 1080,   // 约90元/月
  '5Mbps': 1800    // 约150元/月
};

// 域名规格单价配置（元/年）
export const DOMAIN_SPEC_PRICES: Record<string, number> = {
  '国内备案': 60,      // 需要备案的.cn域名等，约5元/月
  '免备案': 100    // 免备案域名（如.com国外），约8元/月
};

// 流量规格单价配置（元/年，流媒体、直播、CDN共用）
export const TRAFFIC_SPEC_PRICES: Record<string, number> = {
  '100GB': 1200,   // 约100元/月
  '300GB': 3600,   // 约300元/月
  '500GB': 6000,   // 约500元/月
  '1T': 12000,     // 约1000元/月
  '∞': 0           // 按需计费
};

// 默认硬件配置（参考阿里云，单价单位：元/年）
export const DEFAULT_HARDWARE_CONFIG = {
  items: [
    { id: '1', type: '域名' as const, spec: '国内备案' as const, quantity: 1, unitPrice: 60, remark: '', price: 60 },             // 国内备案域名，约5元/月
    { id: '2', type: '服务器' as const, spec: '4C8G' as const, quantity: 3, unitPrice: 4800, remark: '', price: 14400 },    // 4C8G服务器，约400元/月
    { id: '3', type: '存储' as const, spec: '40GB' as const, quantity: 1, unitPrice: 480, remark: '', price: 480 },         // 40GB SSD，约40元/月
    { id: '4', type: '带宽' as const, spec: '1Mbps' as const, quantity: 1, unitPrice: 360, remark: '', price: 360 },        // 1Mbps固定带宽，约30元/月
    { id: '5', type: '流媒体' as const, spec: '100GB' as const, quantity: 0, unitPrice: 1200, remark: '', price: 0 },       // 100GB流媒体，约100元/月
    { id: '6', type: '直播' as const, spec: '100GB' as const, quantity: 0, unitPrice: 1200, remark: '', price: 0 },         // 100GB直播，约100元/月
    { id: '7', type: 'CDN' as const, spec: '100GB' as const, quantity: 0, unitPrice: 1200, remark: '', price: 0 }           // 100GB CDN，约100元/月
  ]
};

// 默认全局配置
export const DEFAULT_CONFIG: GlobalConfig = {
  roleCosts: DEFAULT_ROLE_COSTS,
  workDurationConfigs: DEFAULT_WORK_DURATION,
  roleRatios: DEFAULT_ROLE_RATIOS,
  impactFactors: DEFAULT_IMPACT_FACTORS,
  hardwareConfig: DEFAULT_HARDWARE_CONFIG
};


