// 复杂度枚举
export type Complexity = '低' | '中' | '高' | '极高';

// 优先级枚举
export type Priority = '低' | '中' | '高' | '极高';

// 用户端类型
export type Platform = 'PC端' | 'Web端' | 'H5' | 'Android端' | 'IOS端' | '小程序' | '后台';

// 团队角色
export type TeamRole = 
  | '产品经理'
  | '项目经理'
  | '架构师'
  | '美工师'
  | '后端开发工程师'
  | '前端开发工程师'
  | 'IOS开发工程师'
  | 'Android开发工程师'
  | '小程序开发工程师';

// 项目基础信息
export interface ProjectInfo {
  name: string;
  description?: string;
  industry: string;
  platforms: Platform[];
}

// 按钮操作
export interface ButtonFunction {
  id: string;
  name: string;
  complexity?: Complexity;
  priority?: Priority;
  isImportant: boolean;
  remark: string;
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
  buttons?: ButtonFunction[];  // 功能节点可以包含按钮操作
}

// 工作经验类型
export type WorkExperience = '一线大厂' | '二线中厂' | '三线小厂' | '新手上路';

// 人力单位成本
export interface RoleCost {
  role: TeamRole;
  experience: WorkExperience;  // 工作经验
  workYears: number;           // 工作年限
  salary: number;              // 标准月薪（根据经验和年限自动推荐）
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
  workDays: number;  // 工作天数（总人力）
  ratio: number;     // 相对后端的比例
  count?: number;    // 岗位数量（人数）
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

// 硬件类型
export type HardwareType = '服务器' | '存储' | '带宽' | '流媒体' | '直播' | 'CDN' | '域名';

// 服务器规格
export type ServerSpec = '2C4G' | '4C8G' | '8C16G' | '16C32G' | '24C48G' | '32C64G';

// 存储规格
export type StorageSpec = '40GB' | '100GB' | '500GB' | '1T' | '按需';

// 带宽规格
export type BandwidthSpec = '1Mbps' | '2Mbps' | '3Mbps' | '5Mbps';

// 域名规格
export type DomainSpec = '国内备案' | '免备案';

// 流量规格（流媒体、直播、CDN共用）
export type TrafficSpec = '100GB' | '300GB' | '500GB' | '1T' | '∞';

// 硬件规格（联合类型）
export type HardwareSpec = ServerSpec | StorageSpec | BandwidthSpec | DomainSpec | TrafficSpec;

// 硬件项配置
export interface HardwareItem {
  id: string;
  type: HardwareType;
  spec?: HardwareSpec;   // 规格（服务器/存储/带宽使用）
  quantity: number;      // 数量（台数或数值）
  unitPrice: number;     // 单价（元/年）
  remark: string;        // 备注
  price: number;         // 年费（元/年）= 单价 × 数量
}

// 硬件投入配置
export interface HardwareConfig {
  items: HardwareItem[];
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
  hardwareConfig?: HardwareConfig;
}


