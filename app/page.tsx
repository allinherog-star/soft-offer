'use client';

import { useState, useEffect } from 'react';
import { ProjectInfo, FunctionNode, GlobalConfig, EstimateResult } from '@/types';
import { Header } from '@/components/header';
import { FunctionTree } from '@/components/function-tree';
import { FunctionTable } from '@/components/function-table';
import { EstimatePanel } from '@/components/estimate-panel';
import { CostSettingsSheet } from '@/components/cost-settings-sheet';
import { calculateEstimate } from '@/lib/calculation';
import { DEFAULT_CONFIG, DISCOUNT_OPTIONS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Clock, DollarSign, TrendingDown, Sparkles, Tag, Ticket, BadgePercent, Zap, Users2, Wrench, Server, Layers, AlertCircle, CheckCircle2, Target } from 'lucide-react';

export default function Home() {
  const { toast } = useToast();
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: '',
    industry: '',
    platforms: []
  });

  const [functionNodes, setFunctionNodes] = useState<FunctionNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<FunctionNode | null>(null);
  const [config, setConfig] = useState<GlobalConfig>(DEFAULT_CONFIG);
  const [discount, setDiscount] = useState<number>(1);
  const [estimate, setEstimate] = useState<EstimateResult>({
    totalDays: 0,
    teamWorkloads: [],
    baseCost: 0,
    impactFactors: [],
    discount: 1,
    finalPrice: 0
  });
  const [costSettingsOpen, setCostSettingsOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

  // 历史记录管理
  const [history, setHistory] = useState<FunctionNode[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 计算实际总工期（考虑岗位数量，取70%）
  const calculateActualTotalDays = () => {
    const totalDays = estimate.teamWorkloads.reduce((sum, workload) => {
      const count = roleCounts[workload.role] || 1;
      const actualDays = workload.workDays / count;
      return sum + actualDays;
    }, 0);
    return totalDays * 0.7; // 总工期为工期总和的70%
  };

  // 统计子模块数量（有子节点的中间层节点，不包括顶层模块）
  const countSubModules = (nodes: FunctionNode[]): number => {
    let count = 0;
    const countInChildren = (childNodes: FunctionNode[]): number => {
      return childNodes.reduce((subCount, node) => {
        let currentCount = 0;
        // 如果这个节点有子节点，它就是一个子模块
        if (node.children && node.children.length > 0) {
          currentCount = 1;
          // 递归统计更深层的子模块
          currentCount += countInChildren(node.children);
        }
        return subCount + currentCount;
      }, 0);
    };
    
    // 只统计顶层节点的子节点中的子模块
    nodes.forEach(node => {
      if (node.children) {
        count += countInChildren(node.children);
      }
    });
    
    return count;
  };

  // 统计功能菜单数量（叶子节点，不包含顶层模块）
  const countFunctionMenus = (nodes: FunctionNode[], isTopLevel: boolean = true): number => {
    return nodes.reduce((count, node) => {
      if (!node.children || node.children.length === 0) {
        // 叶子节点：如果是顶层节点（需求模块），不统计；否则才是功能菜单
        return count + (isTopLevel ? 0 : 1);
      }
      // 有子节点的是模块，继续递归（非顶层）
      return count + countFunctionMenus(node.children, false);
    }, 0);
  };

  // 统计高优先级功能菜单数量（仅统计叶子节点，不包含顶层模块）
  const countHighPriority = (nodes: FunctionNode[], isTopLevel: boolean = true): number => {
    return nodes.reduce((count, node) => {
      if (!node.children || node.children.length === 0) {
        // 叶子节点：如果是顶层节点（需求模块），不统计；否则统计功能菜单的高优先级
        if (isTopLevel) return count;
        return count + ((node.priority === '高' || node.priority === '很高') ? 1 : 0);
      }
      // 有子节点的是模块，继续递归（非顶层）
      return count + countHighPriority(node.children, false);
    }, 0);
  };

  // 统计重要功能菜单数量（仅统计叶子节点，不包含顶层模块）
  const countImportant = (nodes: FunctionNode[], isTopLevel: boolean = true): number => {
    return nodes.reduce((count, node) => {
      if (!node.children || node.children.length === 0) {
        // 叶子节点：如果是顶层节点（需求模块），不统计；否则统计功能菜单的重要标记
        if (isTopLevel) return count;
        return count + (node.isImportant ? 1 : 0);
      }
      // 有子节点的是模块，继续递归（非顶层）
      return count + countImportant(node.children, false);
    }, 0);
  };

  // 统计功能点数量（只统计按钮操作）
  const countFunctionPoints = (nodes: FunctionNode[], isTopLevel: boolean = true): number => {
    return nodes.reduce((count, node) => {
      let currentCount = 0;
      
      if (!node.children || node.children.length === 0) {
        // 叶子节点：功能菜单，只统计其按钮数量
        if (!isTopLevel) {
          // 只统计该功能菜单的所有按钮数量
          if (node.buttons && node.buttons.length > 0) {
            currentCount += node.buttons.length;
          }
        }
      } else {
        // 有子节点的是模块，继续递归（非顶层）
        currentCount += countFunctionPoints(node.children, false);
      }
      
      return count + currentCount;
    }, 0);
  };

  // 计算团队总人数
  const getTotalTeamMembers = (): number => {
    return Object.values(roleCounts).reduce((sum, count) => sum + count, 0);
  };

  // 保存到历史记录
  const saveToHistory = (newNodes: FunctionNode[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newNodes)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setFunctionNodes(newNodes);
  };

  // 撤销
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFunctionNodes(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 前进
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFunctionNodes(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 示例数据
  const SAMPLE_DATA = {
    projectInfo: {
      name: '智慧园区管理系统',
      industry: '智慧园区',
      description: '智能化园区综合管理平台，涵盖访客、车辆、物业、安防等功能',
      platforms: ['PC端', 'Web端', 'H5']
    },
    functionNodes: [
      {
        id: 'module-1',
        name: '用户管理',
        complexity: '中',
        priority: '高',
        isImportant: false,
        remark: '系统核心模块',
        children: [
          {
            id: 'menu-1',
            name: '用户管理',
            complexity: '低',
            priority: '高',
            isImportant: false,
            remark: '',
            buttons: [
              { id: 'btn-1', name: '新增', complexity: '低', priority: '中', isImportant: false, remark: '' },
              { id: 'btn-2', name: '编辑', complexity: '低', priority: '中', isImportant: false, remark: '' },
              { id: 'btn-3', name: '删除', complexity: '低', priority: '中', isImportant: false, remark: '' },
              { id: 'btn-4', name: '查询', complexity: '低', priority: '中', isImportant: false, remark: '' }
            ]
          },
          {
            id: 'menu-2',
            name: '角色管理',
            complexity: '中',
            priority: '高',
            isImportant: false,
            remark: '',
            buttons: [
              { id: 'btn-5', name: '新增', complexity: '低', priority: '中', isImportant: false, remark: '' },
              { id: 'btn-6', name: '编辑', complexity: '中', priority: '中', isImportant: false, remark: '' },
              { id: 'btn-7', name: '删除', complexity: '低', priority: '中', isImportant: false, remark: '' },
              { id: 'btn-8', name: '查询', complexity: '低', priority: '中', isImportant: false, remark: '' }
            ]
          }
        ]
      },
      {
        id: 'module-2',
        name: '访客管理',
        complexity: '高',
        priority: '很高',
        isImportant: true,
        remark: '重点需求',
        children: [
          {
            id: 'menu-3',
            name: '访客预约',
            complexity: '高',
            priority: '很高',
            isImportant: true,
            remark: '',
            buttons: [
              { id: 'btn-9', name: '新增', complexity: '高', priority: '高', isImportant: false, remark: '' },
              { id: 'btn-10', name: '编辑', complexity: '中', priority: '中', isImportant: false, remark: '' },
              { id: 'btn-11', name: '删除', complexity: '低', priority: '中', isImportant: false, remark: '' },
              { id: 'btn-12', name: '查询', complexity: '中', priority: '中', isImportant: false, remark: '' },
              { id: 'btn-13', name: '审批', complexity: '高', priority: '很高', isImportant: true, remark: '核心功能' }
            ]
          }
        ]
      }
    ]
  };

  // 加载示例数据
  const handleLoadSample = () => {
    setProjectInfo(SAMPLE_DATA.projectInfo);
    setFunctionNodes(SAMPLE_DATA.functionNodes);
    saveToHistory(SAMPLE_DATA.functionNodes);
    toast({
      title: '加载成功 ✅',
      description: '已加载示例数据',
    });
  };

  // 清空数据
  const handleClear = () => {
    setClearDialogOpen(true);
  };

  const confirmClear = () => {
    setProjectInfo({
      name: '',
      industry: '',
      platforms: []
    });
    setFunctionNodes([]);
    setSelectedNode(null);
    setHistory([[]]);
    setHistoryIndex(0);
    setClearDialogOpen(false);
    toast({
      title: '已清空 🗑️',
      description: '所有数据已清空',
    });
  };

  // 保存数据到本地存储
  const handleSave = () => {
    const data = {
      projectInfo,
      functionNodes,
      config,
      discount,
      roleCounts,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('estimate-data', JSON.stringify(data));
    toast({
      title: '保存成功 💾',
      description: '数据已保存到本地',
    });
  };

  // 从本地存储恢复数据
  const handleRestore = () => {
    const savedData = localStorage.getItem('estimate-data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setProjectInfo(data.projectInfo || { name: '', industry: '', platforms: [] });
        setFunctionNodes(data.functionNodes || []);
        setConfig(data.config || DEFAULT_CONFIG);
        setDiscount(data.discount || 1);
        setRoleCounts(data.roleCounts || {});
        saveToHistory(data.functionNodes || []);
        toast({
          title: '恢复成功 ↩️',
          description: `已恢复 ${new Date(data.timestamp).toLocaleString()} 的数据`,
        });
      } catch (error) {
        toast({
          title: '恢复失败 ❌',
          description: '数据格式错误，无法恢复',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: '暂无数据 📭',
        description: '本地没有保存的数据',
        variant: 'destructive',
      });
    }
  };

  // 导出数据为JSON文件
  const handleExport = () => {
    const data = {
      projectInfo,
      functionNodes,
      config,
      discount,
      roleCounts,
      exportTime: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `软件评估-${projectInfo.name || '未命名'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: '导出成功 📥',
      description: '数据已导出为JSON文件',
    });
  };

  // 自动计算估价
  useEffect(() => {
    const newEstimate = calculateEstimate(
      functionNodes,
      projectInfo.platforms,
      config,
      discount,
      roleCounts
    );
    setEstimate(newEstimate);
  }, [functionNodes, projectInfo.platforms, config, discount, roleCounts]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <Header
        projectInfo={projectInfo}
        onProjectInfoChange={setProjectInfo}
        onOpenCostSettings={() => setCostSettingsOpen(true)}
        onLoadSample={handleLoadSample}
        onClear={handleClear}
        onSave={handleSave}
        onRestore={handleRestore}
        onExport={handleExport}
      />

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧功能树 */}
        <div className="w-[300px] flex-shrink-0 h-full overflow-hidden">
          <FunctionTree
            nodes={functionNodes}
            selectedNode={selectedNode}
            onNodesChange={saveToHistory}
            onSelectNode={setSelectedNode}
            onUndo={undo}
            onRedo={redo}
            historyIndex={historyIndex}
            historyLength={history.length}
            projectInfo={projectInfo}
          />
        </div>

        {/* 中间表格 */}
        <div className="flex-1 min-w-0">
          <FunctionTable
            nodes={functionNodes}
            selectedNode={selectedNode}
            onNodesChange={saveToHistory}
          />
        </div>

          {/* 右侧估价面板 */}
          <div className="w-[500px] flex-shrink-0 h-full overflow-hidden">
            <EstimatePanel
            estimate={estimate}
            config={config}
            discount={discount}
            onDiscountChange={setDiscount}
            onConfigChange={setConfig}
            roleCounts={roleCounts}
            onRoleCountsChange={setRoleCounts}
          />
        </div>
      </div>

      {/* 底部全屏统计栏 */}
      <div className="border-t bg-gradient-to-r from-blue-50 via-white to-blue-50 shadow-lg">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between max-w-full">
            {/* 左侧：整体统计 */}
            <div className="flex flex-col gap-2">
              {/* 标题 */}
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">整体概览</span>
              </div>
              
              {/* 统计信息 - 2行布局 */}
              <div className="flex flex-col gap-2">
                {/* 第一行 */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs text-gray-500">需求模块</span>
                    <span className="text-sm font-bold text-blue-600">
                      {functionNodes.length}
                    </span>
                  </div>
                  
                  <div className="w-px h-6 bg-gray-300"></div>
                  
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-cyan-500" />
                    <span className="text-xs text-gray-500">子模块</span>
                    <span className="text-sm font-bold text-cyan-600">
                      {countSubModules(functionNodes)}
                    </span>
                  </div>
                  
                  <div className="w-px h-6 bg-gray-300"></div>
                  
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-gray-500">功能菜单</span>
                    <span className="text-sm font-bold text-green-600">
                      {countFunctionMenus(functionNodes)}
                    </span>
                  </div>
                  
                  <div className="w-px h-6 bg-gray-300"></div>
                  
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs text-gray-500">功能点</span>
                    <span className="text-sm font-bold text-purple-600">
                      {countFunctionPoints(functionNodes)}
                    </span>
                  </div>
                </div>
                
                {/* 第二行 */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs text-gray-500">高优先级</span>
                    <span className="text-sm font-bold text-orange-600">
                      {countHighPriority(functionNodes)}
                    </span>
                  </div>
                  
                  <div className="w-px h-6 bg-gray-300"></div>
                  
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-xs text-gray-500">重点需求</span>
                    <span className="text-sm font-bold text-red-600">
                      {countImportant(functionNodes)}
                    </span>
                  </div>
                  
                  <div className="w-px h-6 bg-gray-300"></div>
                  
                  <div className="flex items-center gap-1.5">
                    <Users2 className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs text-gray-500">团队人数</span>
                    <span className="text-sm font-bold text-purple-600">
                      {getTotalTeamMembers()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：关键指标 */}
            <div className="flex items-center gap-8">
              {/* 总人力 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users2 className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-h-[60px] flex flex-col justify-start">
                  <div className="text-xs text-gray-500 h-4 leading-4">总人力</div>
                  <div className="text-xl font-bold text-purple-600 mt-1">
                    {estimate.teamWorkloads.reduce((sum, w) => sum + w.workDays, 0).toFixed(1)}
                    <span className="text-sm font-normal ml-0.5">人天</span>
                  </div>
                  <div className="h-[18px]"></div>
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300"></div>

              {/* 总工期 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-h-[60px] flex flex-col justify-start">
                  <div className="text-xs text-gray-500 h-4 leading-4">总工期</div>
                  <div className="text-xl font-bold text-blue-600 mt-1">
                    {calculateActualTotalDays().toFixed(1)}
                    <span className="text-sm font-normal ml-0.5">天</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 h-[18px] leading-[18px]">
                    预计 {(() => {
                      const totalDays = calculateActualTotalDays();
                      const deliveryDate = new Date();
                      deliveryDate.setDate(deliveryDate.getDate() + Math.ceil(totalDays));
                      return deliveryDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
                    })()}
                  </div>
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300"></div>

              {/* 市场成本 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg flex items-center justify-center w-9 h-9">
                  <span className="text-xl font-bold text-red-600 leading-none">¥</span>
                </div>
                <div className="min-h-[60px] flex flex-col justify-start">
                  <div className="text-xs text-gray-500 h-4">市场成本</div>
                  <div className="text-xl font-bold text-red-600 mt-1">
                    {(estimate.baseCost / 10000).toFixed(2)}
                    <span className="text-sm font-normal ml-0.5">万</span>
                  </div>
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300"></div>

              {/* 折扣选择 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-h-[60px] flex flex-col justify-start">
                  <div className="text-xs text-gray-500 h-4">折扣</div>
                  <div className="mt-1">
                    <Select
                      value={discount.toString()}
                      onValueChange={(value) => setDiscount(parseFloat(value))}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISCOUNT_OPTIONS.map((option) => {
                          // 根据折扣力度显示不同图标和颜色
                          let icon;
                          if (option.value === 1) {
                            icon = <Tag className="h-3.5 w-3.5 text-gray-500" />;
                          } else if (option.value >= 0.95) {
                            icon = <Ticket className="h-3.5 w-3.5 text-blue-500" />;
                          } else if (option.value >= 0.85) {
                            icon = <BadgePercent className="h-3.5 w-3.5 text-green-600" />;
                          } else if (option.value >= 0.8) {
                            icon = <TrendingDown className="h-3.5 w-3.5 text-orange-500" />;
                          } else {
                            icon = <Zap className="h-3.5 w-3.5 text-red-500" />;
                          }
                          
                          return (
                            <SelectItem key={option.value} value={option.value.toString()} className="text-xs">
                              <div className="flex items-center gap-2">
                                {icon}
                                <div className="flex flex-col">
                                  <span>{option.label}</span>
                                  <span className="text-[10px] text-gray-400">{option.description}</span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300"></div>

              {/* 折后成本 + 运维成本 + 硬件费用 */}
              <div className="flex items-start gap-3 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-2 rounded-lg border-2 border-red-300 min-h-[60px]">
                <div className="flex flex-col justify-start gap-1.5">
                  <div>
                    <div className="text-xs text-gray-600 font-medium h-4">折后成本</div>
                    <div className="text-2xl font-bold text-red-600 mt-1">
                      {(estimate.finalPrice / 10000).toFixed(2)}
                      <span className="text-base font-normal ml-1">万</span>
                    </div>
                  </div>
                  <div className="border-t border-red-200 pt-1">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3 w-3 text-gray-500" />
                      <span className="text-[10px] text-gray-600">运维成本</span>
                      <span className="text-xs font-semibold text-red-500">
                        {(estimate.finalPrice * 0.1 / 10000).toFixed(2)}万/月
                      </span>
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <div className="flex items-center gap-2">
                      <Server className="h-3 w-3 text-gray-500" />
                      <span className="text-[10px] text-gray-600">硬件成本</span>
                      <span className="text-xs font-semibold text-red-500">
                        {config.hardwareConfig 
                          ? (config.hardwareConfig.items.reduce((sum, item) => sum + item.price, 0) / 12 / 10000).toFixed(2)
                          : '0.00'}万/月
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 单位成本设置侧拉面板 */}
      <CostSettingsSheet
        open={costSettingsOpen}
        onOpenChange={setCostSettingsOpen}
        config={config}
        onConfigChange={setConfig}
      />

      {/* 清空确认对话框 */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将清空所有项目信息和需求清单数据，此操作无法撤销。是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear} className="bg-red-600 hover:bg-red-700">
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
