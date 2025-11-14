import { 
  FunctionNode, 
  GlobalConfig, 
  EstimateResult, 
  TeamRole, 
  Platform,
  TeamWorkload,
  Complexity
} from '@/types';

// 获取角色的月薪（转换为元）
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

// 根据平台确定需要的角色
function getRequiredRoles(platforms: Platform[]): TeamRole[] {
  const roles: Set<TeamRole> = new Set([
    '产品经理',
    '项目经理',
    '架构师',
    '平面设计师'
  ]);

  platforms.forEach(platform => {
    switch (platform) {
      case 'PC端':
      case 'Web端':
      case 'H5页面':
        roles.add('前端开发工程师');
        roles.add('后端开发工程师');
        break;
      case 'Android端':
        roles.add('移动端Android开发工程师');
        roles.add('后端开发工程师');
        break;
      case 'IOS端':
        roles.add('移动端IOS开发工程师');
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
  
  // 获取需要的角色
  const requiredRoles = getRequiredRoles(platforms);
  
  // 计算各角色工作量
  const teamWorkloads: TeamWorkload[] = requiredRoles.map(role => {
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
  
  // 应用影响系数
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


