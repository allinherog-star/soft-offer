'use client';

import { FunctionNode, Complexity, Priority } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COMPLEXITY_OPTIONS, PRIORITY_OPTIONS } from '@/lib/constants';
import { Star } from 'lucide-react';

interface FunctionTableProps {
  nodes: FunctionNode[];
  selectedNode: FunctionNode | null;
  onNodesChange: (nodes: FunctionNode[]) => void;
}

export function FunctionTable({ nodes, selectedNode, onNodesChange }: FunctionTableProps) {
  // 递归收集所有节点（展平）
  const flattenNodes = (nodeList: FunctionNode[], level: number = 0): Array<FunctionNode & { level: number }> => {
    const result: Array<FunctionNode & { level: number }> = [];
    nodeList.forEach(node => {
      result.push({ ...node, level });
      if (node.children && node.children.length > 0) {
        result.push(...flattenNodes(node.children, level + 1));
      }
    });
    return result;
  };

  const flatNodes = flattenNodes(nodes);

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

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b z-10">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700 w-[300px]">功能</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700 w-[120px]">复杂度</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700 w-[120px]">优先级</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700 w-[80px]">重点</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700 flex-1 min-w-[200px]">备注</th>
              </tr>
            </thead>
            <tbody>
              {flatNodes.map((node) => (
                <tr
                  key={node.id}
                  className={`border-b hover:bg-gray-50 ${
                    selectedNode?.id === node.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-2" style={{ paddingLeft: `${node.level * 20 + 16}px` }}>
                    <span className="text-sm">{node.name}</span>
                  </td>
                  <td className="px-4 py-2">
                    <Select
                      value={node.complexity || ''}
                      onValueChange={(value) => updateNode(node.id, { complexity: value as Complexity })}
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="选择复杂度" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLEXITY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2">
                    <Select
                      value={node.priority || ''}
                      onValueChange={(value) => updateNode(node.id, { priority: value as Priority })}
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="选择优先级" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => updateNode(node.id, { isImportant: !node.isImportant })}
                        className={`p-1 rounded hover:bg-gray-200 ${
                          node.isImportant ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={node.isImportant ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={node.remark}
                      onChange={(e) => updateNode(node.id, { remark: e.target.value })}
                      placeholder="备注信息"
                      className="h-8"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {flatNodes.length === 0 && (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              暂无功能，请在左侧添加功能节点
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

