'use client';

import { useState, Fragment } from 'react';
import { FunctionNode, Complexity, Priority, ButtonFunction } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { COMPLEXITY_OPTIONS, PRIORITY_OPTIONS } from '@/lib/constants';
import { Flag, ChevronRight, ChevronDown, Plus, Trash2, Check, X, ListChecks, Sparkles, Download, Upload, ChevronsDown, ChevronsUp, Wand2, AlertTriangle, Minus, Flame, ArrowDown, ArrowUp, Circle, AlertCircle, Equal, TrendingUp, Zap } from 'lucide-react';

interface FunctionTableProps {
  nodes: FunctionNode[];
  selectedNode: FunctionNode | null;
  onNodesChange: (nodes: FunctionNode[]) => void;
}

// 图标映射组件
const IconMap = {
  'Minus': Minus,
  'Equal': Equal,
  'TrendingUp': TrendingUp,
  'Zap': Zap,
  'Flame': Flame,
  'ArrowDown': ArrowDown,
  'ArrowUp': ArrowUp,
  'ChevronsUp': ChevronsUp,
  'Circle': Circle,
  'AlertCircle': AlertCircle,
  'AlertTriangle': AlertTriangle,
} as const;

// 获取复杂度图标和颜色
const getComplexityIcon = (value: string) => {
  const option = COMPLEXITY_OPTIONS.find(opt => opt.value === value);
  if (!option) return null;
  const Icon = IconMap[option.icon as keyof typeof IconMap];
  return { Icon, color: option.color };
};

// 获取优先级图标和颜色
const getPriorityIcon = (value: string) => {
  const option = PRIORITY_OPTIONS.find(opt => opt.value === value);
  if (!option) return null;
  const Icon = IconMap[option.icon as keyof typeof IconMap];
  return { Icon, color: option.color };
};

export function FunctionTable({ nodes, selectedNode, onNodesChange }: FunctionTableProps) {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [editingButton, setEditingButton] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buttonToDelete, setButtonToDelete] = useState<{ nodeId: string; buttonId: string; buttonName: string } | null>(null);

  const toggleMenuExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedMenus(newExpanded);
  };

  // 获取所有需求类型节点的ID
  const getAllMenuIds = () => {
    const menuIds: string[] = [];
    const collectMenuIds = (nodeList: FunctionNode[]) => {
      nodeList.forEach(node => {
        const level = 0;
        const hasChildren = node.children && node.children.length > 0;
        const isLeaf = !hasChildren;
        const nodeType = level === 0 ? '模块' : (isLeaf ? '功能菜单' : '子模块');
        
        // 递归计算实际的nodeType
        const getNodeType = (n: FunctionNode, l: number): string => {
          const hasChild = n.children && n.children.length > 0;
          const isLeafNode = !hasChild;
          return l === 0 ? '模块' : (isLeafNode ? '功能菜单' : '子模块');
        };
        
        const realNodeType = getNodeType(node, 0);
        
        if (realNodeType === '功能菜单') {
          menuIds.push(node.id);
        }
        
        if (node.children) {
          const collectFromChildren = (children: FunctionNode[], currentLevel: number) => {
            children.forEach(child => {
              const childType = getNodeType(child, currentLevel);
              if (childType === '功能菜单') {
                menuIds.push(child.id);
              }
              if (child.children) {
                collectFromChildren(child.children, currentLevel + 1);
              }
            });
          };
          collectFromChildren(node.children, 1);
        }
      });
    };
    collectMenuIds(nodes);
    return menuIds;
  };

  // 全部展开
  const expandAllMenus = () => {
    const allMenuIds = getAllMenuIds();
    setExpandedMenus(new Set(allMenuIds));
    setIsAllExpanded(true);
  };

  // 全部折叠
  const collapseAllMenus = () => {
    setExpandedMenus(new Set());
    setIsAllExpanded(false);
  };

  // 切换全部展开/折叠
  const toggleAllMenus = () => {
    if (isAllExpanded) {
      collapseAllMenus();
    } else {
      expandAllMenus();
    }
  };

  const startEditButton = (buttonId: string, currentName: string) => {
    setEditingButton(buttonId);
    setEditingName(currentName);
  };

  const saveEditButton = (nodeId: string, buttonId: string) => {
    if (editingName.trim()) {
      updateButton(nodeId, buttonId, { name: editingName.trim() });
    }
    setEditingButton(null);
    setEditingName('');
  };

  const cancelEditButton = () => {
    setEditingButton(null);
    setEditingName('');
  };

  // 递归收集所有节点（展平）
  const flattenNodes = (nodeList: FunctionNode[], level: number = 0): Array<FunctionNode & { level: number; nodeType: string; nodeTypeColor: string }> => {
    const result: Array<FunctionNode & { level: number; nodeType: string; nodeTypeColor: string }> = [];
    nodeList.forEach(node => {
      const hasChildren = node.children && node.children.length > 0;
      
      // 确定节点类型
      let nodeType = '';
      let nodeTypeColor = '';
      if (level === 0) {
        nodeType = '模块';
        nodeTypeColor = 'text-gray-500 bg-gray-100 border border-gray-200';
      } else if (hasChildren) {
        nodeType = '子模块';
        nodeTypeColor = 'text-gray-500 bg-gray-100 border border-gray-200';
      } else {
        nodeType = '功能菜单';
        nodeTypeColor = 'text-gray-500 bg-gray-100 border border-gray-200';
      }
      
      result.push({ ...node, level, nodeType, nodeTypeColor });
      if (node.children && node.children.length > 0) {
        result.push(...flattenNodes(node.children, level + 1));
      }
    });
    return result;
  };

  const flatNodes = flattenNodes(nodes);

  // 根据功能名称获取对应的颜色样式
  const getButtonColor = (name: string) => {
    const colorMap: Record<string, string> = {
      '新增': 'text-green-700 bg-green-100 border border-green-300',
      '编辑': 'text-blue-700 bg-blue-100 border border-blue-300',
      '删除': 'text-red-700 bg-red-100 border border-red-300',
      '查询': 'text-purple-700 bg-purple-100 border border-purple-300',
      '导入': 'text-orange-700 bg-orange-100 border border-orange-300',
      '导出': 'text-cyan-700 bg-cyan-100 border border-cyan-300',
    };
    return colorMap[name] || 'text-gray-700 bg-gray-100 border border-gray-300';
  };

  const updateNode = (id: string, updates: Partial<FunctionNode>) => {
    const updateRecursive = (nodeList: FunctionNode[]): boolean => {
      for (const node of nodeList) {
        if (node.id === id) {
          Object.assign(node, updates);
          return true;
        }
        if (node.children && updateRecursive(node.children)) {
          return true;
        }
      }
      return false;
    };
    
    updateRecursive(nodes);
    onNodesChange([...nodes]);
  };

  // 定义功能顺序优先级
  const getButtonPriority = (name: string): number => {
    const priorityMap: Record<string, number> = {
      '新增': 1,
      '编辑': 2,
      '删除': 3,
      '查询': 4,
      '导入': 5,
      '导出': 6,
    };
    return priorityMap[name] || 999; // 自定义功能排在最后
  };

  // 对按钮进行排序
  const sortButtons = (buttons: ButtonFunction[]): ButtonFunction[] => {
    return buttons.sort((a, b) => {
      const priorityA = getButtonPriority(a.name);
      const priorityB = getButtonPriority(b.name);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // 如果优先级相同（都是自定义功能），保持原有顺序
      return 0;
    });
  };

  const addButton = (nodeId: string) => {
    const newButton: ButtonFunction = {
      id: `btn-${Date.now()}-${Math.random()}`,
      name: '按钮功能',
      complexity: '低',
      priority: '中',
      isImportant: false,
      remark: ''
    };

    const addToNode = (nodeList: FunctionNode[]): boolean => {
      for (const node of nodeList) {
        if (node.id === nodeId) {
          if (!node.buttons) node.buttons = [];
          node.buttons.push(newButton);
          // 排序按钮
          node.buttons = sortButtons(node.buttons);
          setExpandedMenus(new Set(expandedMenus).add(nodeId));
          // 自动进入编辑模式
          setEditingButton(newButton.id);
          setEditingName(newButton.name);
          return true;
        }
        if (node.children && addToNode(node.children)) {
          return true;
        }
      }
      return false;
    };

    addToNode(nodes);
    onNodesChange([...nodes]);
  };

  const addStandardButtons = (nodeId: string) => {
    const standardButtons = [
      { name: '新增', complexity: '低', priority: '中', isImportant: false, remark: '' },
      { name: '编辑', complexity: '低', priority: '中', isImportant: false, remark: '' },
      { name: '删除', complexity: '低', priority: '中', isImportant: false, remark: '' },
      { name: '查询', complexity: '低', priority: '中', isImportant: false, remark: '' },
    ];

    const addToNode = (nodeList: FunctionNode[]): boolean => {
      for (const node of nodeList) {
        if (node.id === nodeId) {
          if (!node.buttons) node.buttons = [];
          
          // 获取已存在的功能名称
          const existingNames = new Set(node.buttons.map(b => b.name));
          
          // 只添加不存在的标准功能
          standardButtons.forEach((btnTemplate, index) => {
            if (!existingNames.has(btnTemplate.name)) {
              const newButton: ButtonFunction = {
                id: `btn-${Date.now()}-${Math.random()}-${index}`,
                name: btnTemplate.name,
                complexity: btnTemplate.complexity as Complexity,
                priority: btnTemplate.priority as any,
                isImportant: btnTemplate.isImportant,
                remark: btnTemplate.remark
              };
              if (node.buttons) {
                node.buttons.push(newButton);
              }
            }
          });
          
          // 排序按钮
          node.buttons = sortButtons(node.buttons);
          
          setExpandedMenus(new Set(expandedMenus).add(nodeId));
          return true;
        }
        if (node.children && addToNode(node.children)) {
          return true;
        }
      }
      return false;
    };

    addToNode(nodes);
    onNodesChange([...nodes]);
  };

  // 批量为所有功能菜单节点添加标准功能
  const batchAddStandardButtons = () => {
    const standardButtons = [
      { name: '新增', isImportant: false, remark: '', complexity: '低', priority: '中' },
      { name: '编辑', isImportant: false, remark: '', complexity: '低', priority: '中' },
      { name: '删除', isImportant: false, remark: '', complexity: '低', priority: '中' },
      { name: '查询', isImportant: false, remark: '', complexity: '低', priority: '中' },
    ];

    const processNode = (nodeList: FunctionNode[]): void => {
      nodeList.forEach(node => {
        const hasChildren = node.children && node.children.length > 0;
        const isMenuNode = !hasChildren; // 叶子节点是功能菜单节点
        
        if (isMenuNode) {
          if (!node.buttons) node.buttons = [];
          
          // 获取已存在的功能名称
          const existingNames = new Set(node.buttons.map(b => b.name));
          
          // 只添加不存在的标准功能
          standardButtons.forEach((btnTemplate, index) => {
            if (!existingNames.has(btnTemplate.name)) {
              const newButton: ButtonFunction = {
                id: `btn-${Date.now()}-${Math.random()}-${index}`,
                name: btnTemplate.name,
                complexity: btnTemplate.complexity as any,
                priority: btnTemplate.priority as any,
                isImportant: btnTemplate.isImportant,
                remark: btnTemplate.remark
              };
              if (node.buttons) {
                node.buttons.push(newButton);
              }
            }
          });
          
          // 排序按钮
          if (node.buttons) {
            node.buttons = sortButtons(node.buttons);
          }
          
          // 自动展开
          setExpandedMenus(prev => new Set(prev).add(node.id));
        }
        
        // 递归处理子节点
        if (node.children) {
          processNode(node.children);
        }
      });
    };

    processNode(nodes);
    onNodesChange([...nodes]);
    setIsAllExpanded(true);
  };

  const addImportExportButtons = (nodeId: string) => {
    const importExportButtons = [
      { name: '导入', complexity: '低', priority: '中', isImportant: false, remark: '' },
      { name: '导出', complexity: '低', priority: '中', isImportant: false, remark: '' },
    ];

    const addToNode = (nodeList: FunctionNode[]): boolean => {
      for (const node of nodeList) {
        if (node.id === nodeId) {
          if (!node.buttons) node.buttons = [];
          
          // 获取已存在的功能名称
          const existingNames = new Set(node.buttons.map(b => b.name));
          
          // 只添加不存在的导入导出功能
          importExportButtons.forEach((btnTemplate, index) => {
            if (!existingNames.has(btnTemplate.name)) {
              const newButton: ButtonFunction = {
                id: `btn-${Date.now()}-${Math.random()}-${index}`,
                name: btnTemplate.name,
                complexity: btnTemplate.complexity as Complexity,
                priority: btnTemplate.priority as any,
                isImportant: btnTemplate.isImportant,
                remark: btnTemplate.remark
              };
              if (node.buttons) {
                node.buttons.push(newButton);
              }
            }
          });
          
          // 排序按钮
          node.buttons = sortButtons(node.buttons);
          
          setExpandedMenus(new Set(expandedMenus).add(nodeId));
          return true;
        }
        if (node.children && addToNode(node.children)) {
          return true;
        }
      }
      return false;
    };

    addToNode(nodes);
    onNodesChange([...nodes]);
  };


  const updateButton = (nodeId: string, buttonId: string, updates: Partial<ButtonFunction>) => {
    const updateInNode = (nodeList: FunctionNode[]): boolean => {
      for (const node of nodeList) {
        if (node.id === nodeId && node.buttons) {
          const button = node.buttons.find(b => b.id === buttonId);
          if (button) {
            Object.assign(button, updates);
            // 如果更新了名称，重新排序按钮
            if (updates.name !== undefined) {
              node.buttons = sortButtons(node.buttons);
            }
            return true;
          }
        }
        if (node.children && updateInNode(node.children)) {
          return true;
        }
      }
      return false;
    };

    updateInNode(nodes);
    onNodesChange([...nodes]);
  };

  const openDeleteButtonDialog = (nodeId: string, buttonId: string, buttonName: string) => {
    setButtonToDelete({ nodeId, buttonId, buttonName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteButton = () => {
    if (!buttonToDelete) return;

    const deleteFromNode = (nodeList: FunctionNode[]): boolean => {
      for (const node of nodeList) {
        if (node.id === buttonToDelete.nodeId && node.buttons) {
          node.buttons = node.buttons.filter(b => b.id !== buttonToDelete.buttonId);
          return true;
        }
        if (node.children && deleteFromNode(node.children)) {
          return true;
        }
      }
      return false;
    };

    deleteFromNode(nodes);
    onNodesChange([...nodes]);
    setDeleteDialogOpen(false);
    setButtonToDelete(null);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 border-b z-10">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-gray-700 text-xs w-[280px]">
                  <div className="flex items-center gap-2">
                    <span>需求清单</span>
                    <button
                      onClick={toggleAllMenus}
                      className="p-0.5 hover:bg-gray-300 rounded text-gray-600"
                      title={isAllExpanded ? "全部折叠" : "全部展开"}
                    >
                      {isAllExpanded ? (
                        <ChevronsUp className="h-3 w-3" />
                      ) : (
                        <ChevronsDown className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={batchAddStandardButtons}
                      className="p-0.5 hover:bg-gray-300 rounded text-gray-600"
                      title="批量添加标准功能（新增、编辑、删除、查询）"
                    >
                      <Wand2 className="h-3 w-3" />
                    </button>
                  </div>
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-gray-700 text-xs w-[100px]">复杂度</th>
                <th className="px-2 py-1.5 text-left font-medium text-gray-700 text-xs w-[100px]">优先级</th>
                <th className="px-2 py-1.5 text-left font-medium text-gray-700 text-xs w-[60px]">重点</th>
                <th className="px-2 py-1.5 text-left font-medium text-gray-700 text-xs flex-1 min-w-[180px]">细节详细说明</th>
              </tr>
            </thead>
            <tbody>
              {flatNodes.map((node) => {
                const isMenu = node.nodeType === '功能菜单';
                const hasButtons = node.buttons && node.buttons.length > 0;
                const isExpanded = expandedMenus.has(node.id);
                
                return (
                  <Fragment key={node.id}>
                    <tr
                      className={`border-b hover:bg-gray-50 ${
                        selectedNode?.id === node.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-2 py-1" style={{ paddingLeft: `${node.level * 16 + 8}px` }}>
                        <div className="flex items-center gap-2">
                          {isMenu && (
                            <button
                              onClick={() => toggleMenuExpand(node.id)}
                              className="p-0.5 hover:bg-gray-200 rounded"
                              style={{ visibility: hasButtons ? 'visible' : 'hidden' }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </button>
                          )}
                          {!isMenu && <div className="w-4" />}
                          <span className="text-xs">{node.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap ${node.nodeTypeColor}`}>
                            {node.nodeType}
                          </span>
                          {isMenu && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 px-1 py-0 text-[10px]"
                                >
                                  <Plus className="h-2.5 w-2.5 mr-0.5" />
                                  功能
                                  <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-40 min-w-0">
                                <DropdownMenuItem 
                                  onClick={() => addStandardButtons(node.id)}
                                  className="text-xs py-1 px-2"
                                >
                                  <ListChecks className="h-3 w-3 mr-1.5" />
                                  标准功能
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => addImportExportButtons(node.id)}
                                  className="text-xs py-1 px-2"
                                >
                                  <Download className="h-3 w-3 mr-1.5" />
                                  导入导出功能
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => addButton(node.id)}
                                  className="text-xs py-1 px-2"
                                >
                                  <Sparkles className="h-3 w-3 mr-1.5" />
                                  自定义功能
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </td>
                  <td className="px-2 py-1">
                    <Select
                      value={node.complexity || ''}
                      onValueChange={(value) => updateNode(node.id, { complexity: value as Complexity })}
                    >
                      <SelectTrigger className="h-6 w-full text-xs px-2 py-0 min-h-6 max-h-6">
                        {node.complexity ? (
                          <div className="flex items-center gap-1">
                            {(() => {
                              const iconData = getComplexityIcon(node.complexity);
                              if (iconData) {
                                const { Icon, color } = iconData;
                                return (
                                  <>
                                    <Icon className={`h-3 w-3 ${color}`} />
                                    <span>{node.complexity}</span>
                                  </>
                                );
                              }
                              return <span>{node.complexity}</span>;
                            })()}
                          </div>
                        ) : (
                          <span className="text-gray-400">选择</span>
                        )}
                      </SelectTrigger>
                      <SelectContent className="w-auto min-w-fit">
                        {COMPLEXITY_OPTIONS.map((option) => {
                          const Icon = IconMap[option.icon as keyof typeof IconMap];
                          return (
                            <SelectItem key={option.value} value={option.value} className="text-xs h-6 py-0.5 pl-3 pr-8">
                              <div className="flex items-center gap-1.5">
                                <Icon className={`h-3 w-3 ${option.color}`} />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-1">
                    <Select
                      value={node.priority || ''}
                      onValueChange={(value) => updateNode(node.id, { priority: value as Priority })}
                    >
                      <SelectTrigger className="h-6 w-full text-xs px-2 py-0 min-h-6 max-h-6">
                        {node.priority ? (
                          <div className="flex items-center gap-1">
                            {(() => {
                              const iconData = getPriorityIcon(node.priority);
                              if (iconData) {
                                const { Icon, color } = iconData;
                                return (
                                  <>
                                    <Icon className={`h-3 w-3 ${color}`} />
                                    <span>{node.priority}</span>
                                  </>
                                );
                              }
                              return <span>{node.priority}</span>;
                            })()}
                          </div>
                        ) : (
                          <span className="text-gray-400">选择</span>
                        )}
                      </SelectTrigger>
                      <SelectContent className="w-auto min-w-fit">
                        {PRIORITY_OPTIONS.map((option) => {
                          const Icon = IconMap[option.icon as keyof typeof IconMap];
                          return (
                            <SelectItem key={option.value} value={option.value} className="text-xs h-6 py-0.5 pl-3 pr-8">
                              <div className="flex items-center gap-1.5">
                                <Icon className={`h-3 w-3 ${option.color}`} />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => updateNode(node.id, { isImportant: !node.isImportant })}
                        className={`p-0.5 rounded hover:bg-gray-200 ${
                          node.isImportant ? 'text-red-500' : 'text-gray-300'
                        }`}
                      >
                        <Flag className="h-3 w-3" fill={node.isImportant ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={node.remark}
                      onChange={(e) => updateNode(node.id, { remark: e.target.value })}
                      placeholder=""
                      className="h-6 text-xs min-h-6 max-h-6"
                    />
                  </td>
                </tr>

                {/* 按钮功能列表 */}
                {isMenu && isExpanded && node.buttons && node.buttons.map((button) => (
                  <tr
                    key={button.id}
                    className="border-b hover:bg-gray-50 bg-blue-50/30"
                  >
                    <td className="px-2 py-1" style={{ paddingLeft: `${node.level * 16 + 32}px` }}>
                      <div className="flex items-center gap-2">
                        {editingButton === button.id ? (
                          <>
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditButton(node.id, button.id);
                                if (e.key === 'Escape') cancelEditButton();
                              }}
                              className="h-5 text-xs min-h-5 max-h-5 w-32"
                              placeholder="按钮功能名称"
                              autoFocus
                            />
                            <button
                              onClick={() => saveEditButton(node.id, button.id)}
                              className="p-0.5 rounded hover:bg-green-100 text-green-600"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={cancelEditButton}
                              className="p-0.5 rounded hover:bg-gray-200 text-gray-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span 
                              className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap cursor-pointer ${getButtonColor(button.name)}`}
                              onDoubleClick={() => startEditButton(button.id, button.name)}
                              title="双击编辑"
                            >
                              {button.name}
                            </span>
                            <button
                              onClick={() => openDeleteButtonDialog(node.id, button.id, button.name)}
                              className="p-0.5 rounded hover:bg-red-100 text-red-600"
                              title="删除功能"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <Select
                        value={button.complexity || ''}
                        onValueChange={(value) => updateButton(node.id, button.id, { complexity: value as Complexity })}
                      >
                        <SelectTrigger className="h-6 w-full text-xs px-2 py-0 min-h-6 max-h-6">
                          {button.complexity ? (
                            <div className="flex items-center gap-1">
                              {(() => {
                                const iconData = getComplexityIcon(button.complexity);
                                if (iconData) {
                                  const { Icon, color } = iconData;
                                  return (
                                    <>
                                      <Icon className={`h-3 w-3 ${color}`} />
                                      <span>{button.complexity}</span>
                                    </>
                                  );
                                }
                                return <span>{button.complexity}</span>;
                              })()}
                            </div>
                          ) : (
                            <span className="text-gray-400">选择</span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="w-auto min-w-fit">
                          {COMPLEXITY_OPTIONS.map((option) => {
                            const Icon = IconMap[option.icon as keyof typeof IconMap];
                            return (
                              <SelectItem key={option.value} value={option.value} className="text-xs h-6 py-0.5 pl-3 pr-8">
                                <div className="flex items-center gap-1.5">
                                  <Icon className={`h-3 w-3 ${option.color}`} />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1">
                      <Select
                        value={button.priority || ''}
                        onValueChange={(value) => updateButton(node.id, button.id, { priority: value as Priority })}
                      >
                        <SelectTrigger className="h-6 w-full text-xs px-2 py-0 min-h-6 max-h-6">
                          {button.priority ? (
                            <div className="flex items-center gap-1">
                              {(() => {
                                const iconData = getPriorityIcon(button.priority);
                                if (iconData) {
                                  const { Icon, color } = iconData;
                                  return (
                                    <>
                                      <Icon className={`h-3 w-3 ${color}`} />
                                      <span>{button.priority}</span>
                                    </>
                                  );
                                }
                                return <span>{button.priority}</span>;
                              })()}
                            </div>
                          ) : (
                            <span className="text-gray-400">选择</span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="w-auto min-w-fit">
                          {PRIORITY_OPTIONS.map((option) => {
                            const Icon = IconMap[option.icon as keyof typeof IconMap];
                            return (
                              <SelectItem key={option.value} value={option.value} className="text-xs h-6 py-0.5 pl-3 pr-8">
                                <div className="flex items-center gap-1.5">
                                  <Icon className={`h-3 w-3 ${option.color}`} />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => updateButton(node.id, button.id, { isImportant: !button.isImportant })}
                          className={`p-0.5 rounded hover:bg-gray-200 ${
                            button.isImportant ? 'text-red-500' : 'text-gray-300'
                          }`}
                        >
                          <Flag className="h-3 w-3" fill={button.isImportant ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        value={button.remark}
                        onChange={(e) => updateButton(node.id, button.id, { remark: e.target.value })}
                        placeholder=""
                        className="h-6 text-xs min-h-6 max-h-6"
                      />
                    </td>
                  </tr>
                ))}
              </Fragment>
                );
              })}
            </tbody>
          </table>
          {flatNodes.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
              暂无功能，请在左侧添加需求模块和功能菜单
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 删除功能确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除功能「{buttonToDelete?.buttonName}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteButton} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

