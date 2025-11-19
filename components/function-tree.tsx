'use client';

import { useState, useEffect } from 'react';
import { FunctionNode, ProjectInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
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
import { QuickEstimateDialog } from '@/components/quick-estimate-dialog';
import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, Check, X, Undo2, Redo2, GripVertical, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { DeepSeekIcon } from '@/components/ui/deepseek-icon';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FunctionTreeProps {
  nodes: FunctionNode[];
  selectedNode: FunctionNode | null;
  onNodesChange: (nodes: FunctionNode[]) => void;
  onSelectNode: (node: FunctionNode | null) => void;
  onUndo: () => void;
  onRedo: () => void;
  historyIndex: number;
  historyLength: number;
  projectInfo: ProjectInfo;
  autoExpandTrigger?: number;
}

export function FunctionTree({ nodes, selectedNode, onNodesChange, onSelectNode, onUndo, onRedo, historyIndex, historyLength, projectInfo, autoExpandTrigger }: FunctionTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
  const [addConfirmDialogOpen, setAddConfirmDialogOpen] = useState(false);
  const [pendingAddParentId, setPendingAddParentId] = useState<string | null>(null);
  const [quickEstimateOpen, setQuickEstimateOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // 收集所有节点ID
  const getAllNodeIds = (nodeList: FunctionNode[]): string[] => {
    let ids: string[] = [];
    const traverse = (nodes: FunctionNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          ids.push(node.id);
          traverse(node.children);
        }
      });
    };
    traverse(nodeList);
    return ids;
  };

  // 监听自动展开触发器
  useEffect(() => {
    if (autoExpandTrigger && autoExpandTrigger > 0 && nodes.length > 0) {
      const allIds = getAllNodeIds(nodes);
      setExpandedIds(new Set(allIds));
    }
  }, [autoExpandTrigger]);

  // 切换全部展开/收起
  const toggleExpandAll = () => {
    const allIds = getAllNodeIds(nodes);
    if (expandedIds.size === allIds.length) {
      // 全部收起
      setExpandedIds(new Set());
    } else {
      // 全部展开
      setExpandedIds(new Set(allIds));
    }
  };

  const startEdit = (node: FunctionNode) => {
    setEditingId(node.id);
    setEditingName(node.name);
  };

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      updateNodeName(nodes, editingId, editingName.trim());
      onNodesChange([...nodes]);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const updateNodeName = (nodeList: FunctionNode[], id: string, newName: string): boolean => {
    for (const node of nodeList) {
      if (node.id === id) {
        node.name = newName;
        return true;
      }
      if (node.children && updateNodeName(node.children, id, newName)) {
        return true;
      }
    }
    return false;
  };

  // 检查节点是否有功能按钮
  const hasButtons = (nodeId: string): boolean => {
    const findNode = (nodeList: FunctionNode[]): FunctionNode | null => {
      for (const node of nodeList) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    const node = findNode(nodes);
    return node ? !!(node.buttons && node.buttons.length > 0) : false;
  };

  // 尝试添加节点（可能需要确认）
  const tryAddNode = (parentId?: string) => {
    console.log('➕ [添加需求] 按钮被点击, parentId:', parentId || '无(顶级模块)');
    if (parentId && hasButtons(parentId)) {
      // 如果父节点已有功能，需要二次确认
      console.log('⚠️ [添加需求] 父节点已有功能按钮，显示二次确认对话框');
      setPendingAddParentId(parentId);
      setAddConfirmDialogOpen(true);
    } else {
      // 直接添加
      console.log('✅ [添加需求] 直接添加节点');
      performAddNode(parentId);
    }
  };

  // 确认添加节点
  const confirmAddNode = () => {
    performAddNode(pendingAddParentId || undefined);
    setAddConfirmDialogOpen(false);
    setPendingAddParentId(null);
  };

  // 实际执行添加节点
  const performAddNode = (parentId?: string) => {
    // 确定新节点的默认名称
    // 顶级节点（无父节点）：模块名称
    // 非顶级节点（有父节点）：需求名称（更明确的提示）
    const defaultName = parentId ? '需求名称' : '模块名称';
    
    const newNode: FunctionNode = {
      id: `node-${Date.now()}-${Math.random()}`,
      name: defaultName,
      complexity: '低',
      priority: '中',
      isImportant: false,
      remark: '',
      parentId
    };

    if (parentId) {
      const addToParent = (nodeList: FunctionNode[]): boolean => {
        for (const node of nodeList) {
          if (node.id === parentId) {
            if (!node.children) node.children = [];
            node.children.push(newNode);
            setExpandedIds(new Set(expandedIds).add(parentId));
            return true;
          }
          if (node.children && addToParent(node.children)) {
            return true;
          }
        }
        return false;
      };
      addToParent(nodes);
      onNodesChange([...nodes]);
    } else {
      onNodesChange([...nodes, newNode]);
    }
    
    setEditingId(newNode.id);
    setEditingName(newNode.name);
  };

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent, parentId?: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const getNodeList = (): FunctionNode[] => {
        if (!parentId) {
          return nodes;
        }
        
        const findParentNode = (nodeList: FunctionNode[]): FunctionNode | null => {
          for (const node of nodeList) {
            if (node.id === parentId) return node;
            if (node.children) {
              const found = findParentNode(node.children);
              if (found) return found;
            }
          }
          return null;
        };
        
        const parentNode = findParentNode(nodes);
        return parentNode?.children || [];
      };

      const nodeList = getNodeList();
      const oldIndex = nodeList.findIndex((node) => node.id === active.id);
      const newIndex = nodeList.findIndex((node) => node.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const sortedNodes = arrayMove(nodeList, oldIndex, newIndex);
        
        if (!parentId) {
          // 顶级节点排序
          onNodesChange(sortedNodes);
        } else {
          // 子节点排序
          const updateChildren = (nodeList: FunctionNode[]): boolean => {
            for (const node of nodeList) {
              if (node.id === parentId) {
                node.children = sortedNodes;
                return true;
              }
              if (node.children && updateChildren(node.children)) {
                return true;
              }
            }
            return false;
          };
          updateChildren(nodes);
          onNodesChange([...nodes]);
        }
      }
    }
  };

  const openDeleteDialog = (id: string, name: string, type: string) => {
    setNodeToDelete({ id, name, type });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!nodeToDelete) return;
    
    const removeNode = (nodeList: FunctionNode[]): FunctionNode[] => {
      return nodeList.filter(node => {
        if (node.id === nodeToDelete.id) return false;
        if (node.children) {
          node.children = removeNode(node.children);
        }
        return true;
      });
    };
    
    onNodesChange(removeNode(nodes));
    if (selectedNode?.id === nodeToDelete.id) {
      onSelectNode(null);
    }
    
    setDeleteDialogOpen(false);
    setNodeToDelete(null);
  };

  // 快速评估 - 验证后打开对话框
  const handleQuickEstimate = () => {
    console.log('🔍 [快速评估] 按钮被点击，开始验证...');
    console.log('📋 [快速评估] 当前项目信息:', projectInfo);
    
    // 检查必填项
    const errors: string[] = [];
    
    if (!projectInfo.name || projectInfo.name.trim() === '') {
      errors.push('系统名称');
      console.log('❌ [快速评估] 验证失败: 系统名称未填写');
    }
    if (!projectInfo.description || projectInfo.description.trim() === '') {
      errors.push('系统描述');
      console.log('❌ [快速评估] 验证失败: 系统描述未填写');
    }
    if (!projectInfo.industry || projectInfo.industry.trim() === '') {
      errors.push('行业应用');
      console.log('❌ [快速评估] 验证失败: 行业应用未选择');
    }
    if (!projectInfo.platforms || projectInfo.platforms.length === 0) {
      errors.push('用户端（勾选）');
      console.log('❌ [快速评估] 验证失败: 用户端未勾选');
    }
    
    // 如果有缺失项，显示验证对话框，不跳转 DeepSeek
    if (errors.length > 0) {
      console.log('⚠️ [快速评估] 验证失败，显示错误提示，不会跳转 DeepSeek');
      console.log('📝 [快速评估] 缺失项:', errors);
      setValidationErrors(errors);
      setValidationDialogOpen(true);
      return; // ⚠️ 重要：阻止继续执行，不会打开快速评估对话框，不会跳转 DeepSeek
    }
    
    // ✅ 只有验证通过才会执行到这里
    console.log('✅ [快速评估] 验证通过，打开快速评估对话框');
    console.log('🚀 [快速评估] 即将开始倒计时并跳转 DeepSeek');
    // 打开快速评估对话框，开始倒计时后跳转 DeepSeek
    setQuickEstimateOpen(true);
  };

  // 导入AI生成的节点
  const handleImportNodes = (importedNodes: FunctionNode[]) => {
    // 更新节点列表
    const newNodes = [...nodes, ...importedNodes];
    onNodesChange(newNodes);
    
    // 展开所有节点（包括原有的和新导入的）
    const allIds = getAllNodeIds(newNodes);
    setExpandedIds(new Set(allIds));
  };

  // 可排序的树节点组件
  const SortableTreeNode = ({ node, level }: { node: FunctionNode; level: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: node.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        {renderNodeContent(node, level, attributes, listeners)}
      </div>
    );
  };

  const renderNodeContent = (
    node: FunctionNode, 
    level: number, 
    dragAttributes?: any, 
    dragListeners?: any
  ) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;
    const isEditing = editingId === node.id;

    // 确定节点类型标签
    let nodeTypeLabel = '';
    let nodeTypeColor = '';
    if (level === 0) {
      // 一级节点
      nodeTypeLabel = '模块';
      nodeTypeColor = 'text-gray-500 bg-gray-100 border border-gray-200';
    } else if (hasChildren) {
      // 非一级节点且有子节点
      nodeTypeLabel = '子模块';
      nodeTypeColor = 'text-gray-500 bg-gray-100 border border-gray-200';
    } else {
      // 叶子节点
      nodeTypeLabel = '功能菜单';
      nodeTypeColor = 'text-gray-500 bg-gray-100 border border-gray-200';
    }

    // 确定添加按钮的提示文本
    // 所有非顶级节点下添加的都是功能菜单
    const addButtonTitle = '添加需求';

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 py-1 px-2 hover:bg-gray-100 rounded group ${
            isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {/* 拖拽句柄 */}
          <div 
            {...dragAttributes} 
            {...dragListeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-2.5 w-2.5 text-gray-400" />
          </div>

          <button
            onClick={() => toggleExpand(node.id)}
            className="p-0.5 hover:bg-gray-200 rounded"
            style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="h-6 text-sm flex-1"
                placeholder={nodeTypeLabel === '功能菜单' ? '需求名称' : '模块名称'}
                autoFocus
              />
              <Button
                onClick={saveEdit}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <Check className="h-2.5 w-2.5" />
              </Button>
              <Button
                onClick={cancelEdit}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          ) : (
            <>
              <span
                onClick={() => onSelectNode(node)}
                className="flex-1 text-xs cursor-pointer select-none flex items-center gap-2"
              >
                <span className="truncate">{node.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium whitespace-nowrap ${nodeTypeColor}`}>
                  {nodeTypeLabel}
                </span>
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => startEdit(node)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>编辑名称</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => tryAddNode(node.id)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{addButtonTitle}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => openDeleteDialog(node.id, node.name, nodeTypeLabel)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-600"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>删除{nodeTypeLabel}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>

        {isExpanded && hasChildren && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, node.id)}
          >
            <SortableContext
              items={node.children!.map(child => child.id)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {node.children!.map(child => (
                  <SortableTreeNode key={child.id} node={child} level={level + 1} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  };

  // 渲染节点函数（用于顶级节点）
  const renderNode = (node: FunctionNode, level: number = 0) => {
    return <SortableTreeNode key={node.id} node={node} level={level} />;
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-white border-r">
        {/* 按钮组 - 固定在顶部 */}
        <div className="p-2 border-b">
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => tryAddNode()} 
                  size="sm" 
                  className="flex-[3] h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-2.5 w-2.5 mr-1" />
                  添加需求模块
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>添加顶级模块</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleQuickEstimate} 
                  size="sm" 
                  variant="outline"
                  className="flex-[2] h-7 text-xs"
                >
                  <DeepSeekIcon className="h-3 w-3 mr-1 text-blue-600" />
                  AI快速评估
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>使用AI快速生成需求清单</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* 树内容区域 - 可滚动 */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => handleDragEnd(event)}
            >
              <SortableContext
                items={nodes.map(node => node.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-2">
                  {nodes.map(node => renderNode(node))}
                </div>
              </SortableContext>
            </DndContext>
            <ScrollBar />
          </ScrollArea>
        </div>
        
        {/* 撤销前进按钮 - 悬浮在底部中间 */}
        <div className="border-t bg-white py-1.5 flex items-center justify-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onUndo}
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                disabled={historyIndex <= 0}
              >
                <Undo2 className="h-2.5 w-2.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>撤销</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onRedo}
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                disabled={historyIndex >= historyLength - 1}
              >
                <Redo2 className="h-2.5 w-2.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>前进</p>
            </TooltipContent>
          </Tooltip>
          
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={toggleExpandAll}
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                disabled={nodes.length === 0}
              >
                {expandedIds.size === getAllNodeIds(nodes).length && expandedIds.size > 0 ? (
                  <ChevronsDownUp className="h-2.5 w-2.5" />
                ) : (
                  <ChevronsUpDown className="h-2.5 w-2.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{expandedIds.size === getAllNodeIds(nodes).length && expandedIds.size > 0 ? '全部收起' : '全部展开'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除{nodeToDelete?.type}「{nodeToDelete?.name}」吗？
              {nodeToDelete && '此操作将同时删除其下所有子节点。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 添加需求确认对话框 */}
      <AlertDialog open={addConfirmDialogOpen} onOpenChange={setAddConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认添加需求</AlertDialogTitle>
            <AlertDialogDescription>
              当前需求下已有功能按钮，添加子需求后将变为子模块。是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAddParentId(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddNode}>
              继续添加
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 验证失败提示对话框 */}
      <AlertDialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
              请完善相关信息
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  以下信息未填写：
                </div>
                
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <ul className="space-y-1.5">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-orange-700 flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        <span className="font-medium">{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setValidationDialogOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              知道了
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 快速评估对话框 */}
      <QuickEstimateDialog
        open={quickEstimateOpen}
        onOpenChange={setQuickEstimateOpen}
        projectInfo={projectInfo}
        onImport={handleImportNodes}
      />
    </TooltipProvider>
  );
}

