import { 
  FunctionNode, 
  GlobalConfig, 
  EstimateResult, 
  TeamRole, 
  Platform,
  TeamWorkload,
  Complexity,
  UserScale,
  ServiceLevel,
  QualityLevel,
  SecurityLevel,
  DisasterRecoveryLevel,
  FlexibilityLevel
} from '@/types';

// 根据档位获取倍数
function getMultiplierByLevel(level: number): number {
  switch (level) {
    case 0: return 1.0;    // 第一档：基准
    case 1: return 1.2;    // 第二档：1.2倍
    case 2: return 1.5;    // 第三档：1.5倍
    case 3: return 2.0;    // 第四档：2倍
    default: return 1.0;
  }
}

// 根据整体系数配置计算总的调整倍数
function calculateImpactMultiplier(config: GlobalConfig): number {
  if (!config.impactFactorConfig) return 1.0;
  
  const impactConfig = config.impactFactorConfig;
  
  // 用户规模档位
  const userScaleLevels: UserScale[] = ['10w+', '100w+', '1000w+', '1ww+'];
  const userScaleLevel = userScaleLevels.indexOf(impactConfig.userScale);
  
  // 服务等级档位
  const serviceLevels: ServiceLevel[] = ['标准', '及时响应', '工作日坐席', '7*24'];
  const serviceLevel = serviceLevels.indexOf(impactConfig.serviceLevel);
  
  // 质量等级档位
  const qualityLevels: QualityLevel[] = ['标准', '高', '很高', '极高'];
  const qualityLevel = qualityLevels.indexOf(impactConfig.qualityLevel);
  
  // 安全等级档位
  const securityLevels: SecurityLevel[] = ['标准', '权限控制', '金融支付', '安全盾'];
  const securityLevel = securityLevels.indexOf(impactConfig.securityLevel);
  
  // 灾备等级档位
  const disasterRecoveryLevels: DisasterRecoveryLevel[] = ['标准', '定时备份', 'T1可恢复', 'H1可恢复'];
  const disasterRecoveryLevel = disasterRecoveryLevels.indexOf(impactConfig.disasterRecoveryLevel);
  
  // 灵活等级档位
  const flexibilityLevels: FlexibilityLevel[] = ['标准', '多系统', '微服务', '组件化'];
  const flexibilityLevel = flexibilityLevels.indexOf(impactConfig.flexibilityLevel);
  
  // 计算所有维度的倍数（将超出基准1.0的部分累加）
  const multipliers = [
    getMultiplierByLevel(userScaleLevel),
    getMultiplierByLevel(serviceLevel),
    getMultiplierByLevel(qualityLevel),
    getMultiplierByLevel(securityLevel),
    getMultiplierByLevel(disasterRecoveryLevel),
    getMultiplierByLevel(flexibilityLevel)
  ];
  
  // 计算总倍数：基准1.0 + 所有维度超出1.0的部分之和
  const additionalMultiplier = multipliers.reduce((sum, m) => sum + (m - 1.0), 0);
  return 1.0 + additionalMultiplier;
}

// 获取角色的标准月薪（转换为元）
function getSalary(config: GlobalConfig, role: TeamRole): number {
  const roleCost = config.roleCosts.find(r => r.role === role);
  if (!roleCost) return 0;
  
  // salary是千单位，需要乘以1000转换为元
  return (roleCost.salary || 0) * 1000;
}

// 获取某个节点的复杂度对应的工期
function getWorkDays(complexity: Complexity | undefined, config: GlobalConfig): number {
  if (!complexity) return 0;
  return config.workDurationConfigs[complexity] || 0;
}

// 递归收集所有功能菜单节点（非顶层的叶子节点）和按钮操作
function collectLeafNodes(node: FunctionNode, isTopLevel: boolean = false): Array<{complexity?: Complexity}> {
  const items: Array<{complexity?: Complexity}> = [];
  
  // 收集节点本身（如果是叶子节点且有复杂度，但不是顶层节点）
  if (node.complexity && (!node.children || node.children.length === 0)) {
    // 只收集非顶层的叶子节点（功能菜单）
    if (!isTopLevel) {
      items.push(node);
    }
  }
  
  // 收集子节点（子节点都不是顶层）
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      items.push(...collectLeafNodes(child, false));
    });
  }
  
  // 收集按钮操作
  if (node.buttons && node.buttons.length > 0) {
    node.buttons.forEach(button => {
      if (button.complexity) {
        items.push(button);
      }
    });
  }
  
  return items;
}

// 根据平台确定需要的基础角色（不包含产品经理、项目经理、架构师、美工师）
function getBaseRoles(platforms: Platform[]): TeamRole[] {
  const roles: Set<TeamRole> = new Set();

  platforms.forEach(platform => {
    switch (platform) {
      case 'PC端':
      case 'Web端':
      case 'H5':
      case '后台':
        roles.add('前端开发工程师');
        roles.add('后端开发工程师');
        break;
      case 'Android端':
        roles.add('Android开发工程师');
        roles.add('后端开发工程师');
        break;
      case 'IOS端':
        roles.add('IOS开发工程师');
        roles.add('后端开发工程师');
        break;
      case '小程序':
        roles.add('小程序开发工程师');
        roles.add('后端开发工程师');
        break;
    }
  });

  return Array.from(roles);
}

// 根据总人力和平台判断是否需要添加管理角色和美工师
function getAdditionalRoles(totalManpower: number, platforms: Platform[]): TeamRole[] {
  const additionalRoles: TeamRole[] = [];

  // 当总人力 > 30 时，自动关联架构师
  if (totalManpower > 30) {
    additionalRoles.push('架构师');
  }

  // 当总人力 > 50 时，自动关联产品经理
  if (totalManpower > 50) {
    additionalRoles.push('产品经理');
  }

  // 当总人力 > 100 时，自动关联项目经理
  if (totalManpower > 100) {
    additionalRoles.push('项目经理');
  }

  // 当勾选PC端、web端、H5、Android端、IOS端、小程序时，自动关联美工师
  const needDesigner = platforms.some(platform => 
    ['PC端', 'Web端', 'H5', 'Android端', 'IOS端', '小程序'].includes(platform)
  );
  
  if (needDesigner) {
    additionalRoles.push('美工师');
  }

  return additionalRoles;
}

// 岗位排序优先级
const ROLE_ORDER: TeamRole[] = [
  '产品经理',
  '项目经理',
  '架构师',
  '美工师',
  '后端开发工程师',
  '前端开发工程师',
  'IOS开发工程师',
  'Android开发工程师',
  '小程序开发工程师'
];

// 对角色进行排序
function sortRolesByPriority(roles: TeamRole[]): TeamRole[] {
  return roles.sort((a, b) => {
    const indexA = ROLE_ORDER.indexOf(a);
    const indexB = ROLE_ORDER.indexOf(b);
    
    // 如果角色不在排序列表中，放到最后
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
}

// 计算估价
export function calculateEstimate(
  functionNodes: FunctionNode[],
  platforms: Platform[],
  config: GlobalConfig,
  discount: number,
  roleCounts: Record<string, number> = {}
): EstimateResult {
  // 收集所有功能菜单节点（非顶层的叶子节点），顶层节点标记为 isTopLevel = true
  const allLeafNodes = functionNodes.flatMap(node => collectLeafNodes(node, true));
  
  // 计算后端总工期（基准）
  let backendTotalDays = 0;
  allLeafNodes.forEach(node => {
    backendTotalDays += getWorkDays(node.complexity, config);
  });
  
  // 计算整体系数倍数
  const impactMultiplier = calculateImpactMultiplier(config);
  
  // 应用整体系数倍数到后端总工期
  const adjustedBackendTotalDays = backendTotalDays * impactMultiplier;
  
  // 第一步：获取基础角色（不包含产品经理、项目经理、架构师、美工师）
  const baseRoles = getBaseRoles(platforms);
  
  // 计算基础角色的工作量（应用整体系数倍数）
  let baseTeamWorkloads: TeamWorkload[] = baseRoles.map(role => {
    const ratio = config.roleRatios[role] || 1;
    const workDays = adjustedBackendTotalDays * ratio;
    return {
      role,
      workDays,
      ratio
    };
  });
  
  // 计算基础角色的总人力
  const baseTotalManpower = baseTeamWorkloads.reduce((sum, w) => sum + w.workDays, 0);
  
  // 第二步：根据总人力和平台判断是否需要添加额外角色
  const additionalRoles = getAdditionalRoles(baseTotalManpower, platforms);
  
  // 将所有角色合并并排序
  const allRoles = sortRolesByPriority([...baseRoles, ...additionalRoles]);
  
  // 重新计算所有角色的工作量（应用整体系数倍数）
  const teamWorkloads: TeamWorkload[] = allRoles.map(role => {
    const ratio = config.roleRatios[role] || 1;
    const workDays = adjustedBackendTotalDays * ratio;
    return {
      role,
      workDays,
      ratio
    };
  });
  
  // 计算总工期（所有工期的总和 * 70%）
  const totalDays = teamWorkloads.reduce((sum, w) => sum + w.workDays, 0) * 0.7;
  
  // 计算基础成本（基于实际投入的人力）
  let baseCost = 0;
  teamWorkloads.forEach(workload => {
    const monthlySalary = getSalary(config, workload.role);
    const count = roleCounts[workload.role] || 1; // 获取岗位人数，默认为1
    const actualWorkDays = workload.workDays / count; // 实际投入的人力
    const monthlyCost = (actualWorkDays / 22) * monthlySalary; // 假设一个月22个工作日
    baseCost += monthlyCost;
  });
  
  // 应用整体系数
  let costAfterFactors = baseCost;
  config.impactFactors.forEach(factor => {
    costAfterFactors *= factor.value;
  });
  
  // 应用折扣
  const finalPrice = costAfterFactors * discount;
  
  return {
    totalDays,
    teamWorkloads,
    baseCost,
    impactFactors: config.impactFactors,
    discount: discount as any,
    finalPrice
  };
}

// 格式化金额
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// 格式化天数
export function formatDays(days: number): string {
  return `${days.toFixed(1)}天`;
}


