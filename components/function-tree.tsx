'use client';

import { useState } from 'react';
import { FunctionNode } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface FunctionTreeProps {
  nodes: FunctionNode[];
  selectedNode: FunctionNode | null;
  onNodesChange: (nodes: FunctionNode[]) => void;
  onSelectNode: (node: FunctionNode | null) => void;
}

export function FunctionTree({ nodes, selectedNode, onNodesChange, onSelectNode }: FunctionTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
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

  const addNode = (parentId?: string) => {
    const newNode: FunctionNode = {
      id: `node-${Date.now()}-${Math.random()}`,
      name: '新功能',
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

  const deleteNode = (id: string) => {
    const removeNode = (nodeList: FunctionNode[]): FunctionNode[] => {
      return nodeList.filter(node => {
        if (node.id === id) return false;
        if (node.children) {
          node.children = removeNode(node.children);
        }
        return true;
      });
    };
    
    onNodesChange(removeNode(nodes));
    if (selectedNode?.id === id) {
      onSelectNode(null);
    }
  };

  const renderNode = (node: FunctionNode, level: number = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;
    const isEditing = editingId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 py-1 px-2 hover:bg-gray-100 rounded group ${
            isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          <button
            onClick={() => toggleExpand(node.id)}
            className="p-0.5 hover:bg-gray-200 rounded"
            style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
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
                autoFocus
              />
              <Button
                onClick={saveEdit}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                onClick={cancelEdit}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <span
                onClick={() => onSelectNode(node)}
                className="flex-1 text-sm cursor-pointer select-none truncate"
              >
                {node.name}
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <Button
                  onClick={() => startEdit(node)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => addNode(node.id)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => deleteNode(node.id)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="mb-2">
            <Button onClick={() => addNode()} size="sm" variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              添加功能
            </Button>
          </div>
          {nodes.map(node => renderNode(node))}
        </div>
      </ScrollArea>
    </div>
  );
}

