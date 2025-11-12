// 复杂度枚举
export type Complexity = '低' | '中' | '高' | '极高';

// 优先级枚举
export type Priority = '低' | '中' | '高' | '极高';

// 用户端类型
export type Platform = 'PC端' | 'Web端' | 'H5页面' | 'Android端' | 'IOS端' | '小程序';

// 团队角色
export type TeamRole = 
  | '产品经理'
  | '项目经理'
  | '架构师'
  | '平面设计师'
  | '后端开发工程师'
  | '前端开发工程师'
  | '移动端IOS开发工程师'
  | '移动端Android开发工程师'
  | '小程序开发工程师';

// 项目基础信息
export interface ProjectInfo {
  name: string;
  industry: string;
  platforms: Platform[];
}

// 功能节点
export interface FunctionNode {
  id: string;
  name: string;
  complexity?: Complexity;
  priority?: Priority;
  isImportant: boolean;
  remark: string;
  children?: FunctionNode[];
  parentId?: string;
}

// 人力单位成本（按月薪，3档）
export interface RoleCost {
  role: TeamRole;
  salaryLow: number;    // 低档月薪
  salaryMid: number;    // 中档月薪
  salaryHigh: number;   // 高档月薪
  selectedLevel: 'low' | 'mid' | 'high';  // 当前选择的档位
}

// 工期单位成本配置
export interface WorkDurationConfig {
  complexity: Complexity;
  days: number;  // 基准工期（天）
  ratio: number; // 相对后端的比例
}

// 团队成员工作量
export interface TeamWorkload {
  role: TeamRole;
  workDays: number;  // 工作天数
  ratio: number;     // 相对后端的比例
}

// 影响系数
export interface ImpactFactor {
  name: string;
  value: number;
}

// 折扣选项
export type Discount = 0.95 | 0.9 | 0.85 | 0.8 | 0.7 | 1;

// 估价核算结果
export interface EstimateResult {
  totalDays: number;           // 总工期（天）
  teamWorkloads: TeamWorkload[]; // 各角色工作量
  baseCost: number;            // 基础成本
  impactFactors: ImpactFactor[]; // 影响系数
  discount: Discount;          // 折扣
  finalPrice: number;          // 最终报价
}

// 全局配置
export interface GlobalConfig {
  roleCosts: RoleCost[];
  workDurationConfigs: {
    低: number;
    中: number;
    高: number;
    极高: number;
  };
  roleRatios: Record<TeamRole, number>;
  impactFactors: ImpactFactor[];
}

