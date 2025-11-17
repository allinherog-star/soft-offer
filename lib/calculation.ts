import { 
  FunctionNode, 
  GlobalConfig, 
  EstimateResult, 
  TeamRole, 
  Platform,
  TeamWorkload,
  Complexity
} from '@/types';

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

// 递归收集所有叶子节点（有复杂度的节点）和按钮操作
function collectLeafNodes(node: FunctionNode): Array<{complexity?: Complexity}> {
  const items: Array<{complexity?: Complexity}> = [];
  
  // 收集节点本身（如果是叶子节点且有复杂度）
  if (node.complexity && (!node.children || node.children.length === 0)) {
    items.push(node);
  }
  
  // 收集子节点
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      items.push(...collectLeafNodes(child));
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
  discount: number
): EstimateResult {
  // 收集所有叶子节点
  const allLeafNodes = functionNodes.flatMap(node => collectLeafNodes(node));
  
  // 计算后端总工期（基准）
  let backendTotalDays = 0;
  allLeafNodes.forEach(node => {
    backendTotalDays += getWorkDays(node.complexity, config);
  });
  
  // 第一步：获取基础角色（不包含产品经理、项目经理、架构师、美工师）
  const baseRoles = getBaseRoles(platforms);
  
  // 计算基础角色的工作量
  let baseTeamWorkloads: TeamWorkload[] = baseRoles.map(role => {
    const ratio = config.roleRatios[role] || 1;
    const workDays = backendTotalDays * ratio;
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
  
  // 重新计算所有角色的工作量
  const teamWorkloads: TeamWorkload[] = allRoles.map(role => {
    const ratio = config.roleRatios[role] || 1;
    const workDays = backendTotalDays * ratio;
    return {
      role,
      workDays,
      ratio
    };
  });
  
  // 计算总工期（取最长的）
  const totalDays = Math.max(...teamWorkloads.map(w => w.workDays), 0);
  
  // 计算基础成本
  let baseCost = 0;
  teamWorkloads.forEach(workload => {
    const monthlySalary = getSalary(config, workload.role);
    const monthlyCost = (workload.workDays / 22) * monthlySalary; // 假设一个月22个工作日
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


