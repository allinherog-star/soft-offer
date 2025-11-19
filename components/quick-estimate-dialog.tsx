'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProjectInfo, FunctionNode } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, CheckCircle2, ExternalLink, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface QuickEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectInfo: ProjectInfo;
  onImport: (nodes: FunctionNode[]) => void;
}

export function QuickEstimateDialog({
  open,
  onOpenChange,
  projectInfo,
  onImport
}: QuickEstimateDialogProps) {
  const [step, setStep] = useState<'preparing' | 'prompt' | 'input'>('preparing');
  const [countdown, setCountdown] = useState(3);
  const [inputText, setInputText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  // 生成提示词
  const generatePrompt = useCallback(() => {
    const platforms = projectInfo.platforms.length > 0 
      ? projectInfo.platforms.join('、') 
      : '未指定';
    
    return `请根据以下项目信息，生成详细的软件需求清单：

【项目信息】
系统名称：${projectInfo.name || '未命名项目'}
系统描述：${projectInfo.description || '无描述'}
行业应用：${projectInfo.industry || '未指定'}
用户端：${platforms}

【输出要求】
请按照以下JSON格式输出系统的需求清单，要求包含：
1. 系统模块的层级结构（需求模块 → 子模块 → 功能菜单）
2. 每个功能菜单必须包含完整的操作按钮（buttons数组：新增、编辑、删除、查询等）
3. 每个功能的复杂度评估（低、中、高、很高）
4. 每个功能的优先级（低、中、高、很高）
5. 重点功能标记（isImportant: true/false）
6. 详细的功能说明（remark字段）

【JSON格式示例】
\`\`\`json
[
  {
    "name": "用户管理",
    "complexity": "中",
    "priority": "高",
    "isImportant": true,
    "remark": "用户管理模块，包含用户信息的完整生命周期管理",
    "children": [
      {
        "name": "用户列表",
        "complexity": "中",
        "priority": "很高",
        "isImportant": true,
        "remark": "展示所有用户信息，支持分页、搜索、筛选",
        "buttons": [
          { "name": "新增", "complexity": "低", "priority": "高", "isImportant": false, "remark": "新增用户信息" },
          { "name": "编辑", "complexity": "低", "priority": "高", "isImportant": false, "remark": "修改用户信息" },
          { "name": "删除", "complexity": "低", "priority": "中", "isImportant": false, "remark": "删除用户（逻辑删除）" },
          { "name": "查询", "complexity": "低", "priority": "高", "isImportant": false, "remark": "按条件查询用户" },
          { "name": "导出", "complexity": "中", "priority": "中", "isImportant": false, "remark": "导出用户数据为Excel" }
        ]
      },
      {
        "name": "角色管理",
        "complexity": "中",
        "priority": "高",
        "isImportant": true,
        "remark": "管理系统角色及权限分配",
        "buttons": [
          { "name": "新增", "complexity": "低", "priority": "高", "isImportant": false, "remark": "新增角色" },
          { "name": "编辑", "complexity": "中", "priority": "高", "isImportant": true, "remark": "编辑角色权限" },
          { "name": "删除", "complexity": "低", "priority": "中", "isImportant": false, "remark": "删除角色" },
          { "name": "查询", "complexity": "低", "priority": "高", "isImportant": false, "remark": "查询角色列表" }
        ]
      }
    ]
  }
]
\`\`\`

【重要说明】
1. 功能菜单（叶子节点）必须包含buttons数组，定义该功能的所有操作
2. 常见操作包括：新增、编辑、删除、查询、导出、导入、审核、启用/禁用等
3. 根据实际业务场景选择合适的操作，不要机械套用

请务必：
- 按照该行业的最佳实践进行功能模块划分
- 每个功能菜单都要包含完整的操作按钮（buttons）
- 根据业务特点选择合适的操作类型（CRUD、审批、导入导出等）
- 根据用户端特点考虑对应的技术实现
- 合理评估每个功能和操作的复杂度、优先级
- 对核心功能进行重点标记
- 提供详细的功能说明，便于后续开发理解`;
  }, [projectInfo]);

  // 复制提示词到剪贴板
  const copyPromptToClipboard = useCallback(async () => {
    try {
      const prompt = generatePrompt();
      await navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: '复制失败',
        description: '请手动复制提示词',
        variant: 'destructive',
      });
    }
  }, [generatePrompt, toast]);

  // 打开DeepSeek并进入输入阶段
  const handleOpenDeepSeek = useCallback(() => {
    console.log('🌐 [快速评估对话框] 用户点击按钮，正在打开 DeepSeek 网站...');
    window.open('https://chat.deepseek.com/', '_blank');
    console.log('✅ [快速评估对话框] DeepSeek 已在新标签页中打开，进入输入阶段');
    setStep('input');
  }, []);

  // 解析DeepSeek返回的结果
  const parseResult = (text: string): FunctionNode[] | null => {
    try {
      // 清理输入文本
      const cleanText = text.trim();
      
      // 尝试从文本中提取JSON（按优先级尝试不同的模式）
      let jsonText = '';
      
      // 1. 尝试提取 ```json ``` 代码块
      const jsonBlockMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonText = jsonBlockMatch[1];
      } 
      // 2. 尝试提取普通 ``` ``` 代码块
      else {
        const codeBlockMatch = cleanText.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1];
        }
        // 3. 尝试直接提取数组
        else {
          const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            jsonText = arrayMatch[0];
          } else {
            // 4. 假设整个文本就是JSON
            jsonText = cleanText;
          }
        }
      }
      
      if (!jsonText) {
        throw new Error('未找到有效的JSON数据');
      }

      // 解析JSON
      const parsedData = JSON.parse(jsonText);
      
      // 验证数据格式
      if (!Array.isArray(parsedData)) {
        throw new Error('数据格式错误：期望数组格式');
      }
      
      if (parsedData.length === 0) {
        throw new Error('数据为空');
      }

      // 为每个节点添加必需的ID和默认值
      const addIds = (nodes: any[], parentId?: string): FunctionNode[] => {
        return nodes.map((node, index) => {
          // 验证节点必须有name字段
          if (!node.name) {
            throw new Error(`节点缺少必需的name字段: ${JSON.stringify(node)}`);
          }
          
          const id = parentId 
            ? `${parentId}-${index}` 
            : `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;
          
          // 验证复杂度和优先级的有效性
          const validComplexity = ['低', '中', '高', '很高'];
          const validPriority = ['低', '中', '高', '很高'];
          
          const complexity = node.complexity && validComplexity.includes(node.complexity) 
            ? node.complexity 
            : '中';
          const priority = node.priority && validPriority.includes(node.priority) 
            ? node.priority 
            : '中';
          
          // 处理 buttons 数组
          let buttons = undefined;
          if (node.buttons && Array.isArray(node.buttons) && node.buttons.length > 0) {
            buttons = node.buttons.map((btn: any, btnIndex: number) => ({
              id: `btn-${id}-${btnIndex}`,
              name: btn.name || '操作',
              complexity: btn.complexity && validComplexity.includes(btn.complexity) 
                ? btn.complexity 
                : '低',
              priority: btn.priority && validPriority.includes(btn.priority) 
                ? btn.priority 
                : '中',
              isImportant: Boolean(btn.isImportant),
              remark: btn.remark || ''
            }));
          }
          
          return {
            id,
            name: node.name,
            complexity,
            priority,
            isImportant: Boolean(node.isImportant),
            remark: node.remark || '',
            children: node.children && Array.isArray(node.children) && node.children.length > 0
              ? addIds(node.children, id) 
              : undefined,
            buttons,
            parentId
          };
        });
      };

      const result = addIds(parsedData);
      
      // 验证结果
      if (result.length === 0) {
        throw new Error('解析后数据为空');
      }
      
      return result;
    } catch (error) {
      console.error('解析失败:', error);
      // 返回错误信息以便更好的用户反馈
      if (error instanceof Error) {
        toast({
          title: '解析失败',
          description: error.message,
          variant: 'destructive',
        });
      }
      return null;
    }
  };

  // 处理导入
  const handleImport = () => {
    const nodes = parseResult(inputText);
    if (!nodes) {
      // 错误信息已在parseResult中显示
      return;
    }

    // 统计导入的节点数量（包括子节点）
    const countNodes = (nodeList: FunctionNode[]): number => {
      return nodeList.reduce((count, node) => {
        return count + 1 + (node.children ? countNodes(node.children) : 0);
      }, 0);
    };
    
    const totalCount = countNodes(nodes);

    onImport(nodes);
    toast({
      title: '导入成功 ✅',
      description: `已成功导入 ${nodes.length} 个需求模块，共 ${totalCount} 个功能节点`,
    });
    
    // 重置状态
    setInputText('');
    onOpenChange(false);
  };

  // 对话框打开时的初始化
  useEffect(() => {
    if (open) {
      console.log('📊 [快速评估对话框] 对话框已打开，开始初始化...');
      setStep('preparing');
      setCountdown(3);
      setInputText('');
      setIsCopied(false);
    }
  }, [open]);

  // 倒计时和准备提示词
  useEffect(() => {
    if (step === 'preparing' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (step === 'preparing' && countdown === 0) {
      console.log('📋 [快速评估对话框] 准备完成，复制提示词到剪贴板...');
      copyPromptToClipboard();
      setStep('prompt');
    }
  }, [step, countdown, copyPromptToClipboard]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[1100px] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle className="text-xl flex items-center gap-3">
            <span>AI 快速评估</span>
            {step === 'input' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-3">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                <div className="text-xs font-medium text-blue-900 mb-3">系统信息</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 min-w-[60px]">名称：</span>
                    <span className="text-gray-900 font-medium">{projectInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 min-w-[60px]">行业：</span>
                    <span className="text-gray-900">{projectInfo.industry}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-gray-500 min-w-[60px] flex-shrink-0">描述：</span>
                    <span className="text-gray-900 flex-1">{projectInfo.description}</span>
                  </div>
                  {projectInfo.platforms.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-gray-500 min-w-[60px] flex-shrink-0">用户端：</span>
                      <div className="flex gap-1 flex-wrap flex-1">
                        {projectInfo.platforms.map(p => (
                          <span key={p} className="text-xs px-2 py-0.5 bg-white/50 rounded border border-blue-100">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4 min-h-0">
          {/* 步骤0: 准备中倒计时 */}
          {step === 'preparing' && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{countdown}</span>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-gray-900">正在准备优质提示词...</p>
                <p className="text-sm text-gray-500">根据您的项目信息定制 AI 提示词</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>分析项目信息</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>生成提示模板</span>
                </div>
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>准备就绪</span>
                </div>
              </div>
            </div>
          )}

          {/* 步骤1: 显示提示词和跳转按钮 */}
          {step === 'prompt' && (
            <div className="flex flex-col space-y-4 h-full">
              {/* 上部：提示词预览 */}
              <div className="flex-1 flex flex-col space-y-3 min-h-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">AI 提示词</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyPromptToClipboard}
                    className="h-9"
                  >
                    {isCopied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-green-600">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        复制提示词
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="h-full overflow-y-auto scrollbar-hide p-5">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                      {generatePrompt()}
                    </pre>
                  </div>
                </div>
              </div>

              {/* 下部：使用说明 */}
              <div className="flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">使用说明</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">点击下方按钮</p>
                        <p className="text-xs text-blue-700 mt-0.5">跳转到 DeepSeek AI</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">粘贴提示词</p>
                        <p className="text-xs text-green-700 mt-0.5">提示词已自动复制</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">等待生成</p>
                        <p className="text-xs text-purple-700 mt-0.5">AI 生成需求清单</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-900">复制结果</p>
                        <p className="text-xs text-orange-700 mt-0.5">粘贴到下一步导入</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤2: 输入结果 */}
          {step === 'input' && (
            <div className="flex flex-col space-y-4 h-full">
              {/* 上部：输入框区域 */}
              <div className="flex-1 flex flex-col space-y-3 min-h-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">DeepSeek 生成结果</h3>
                  <Button
                    onClick={handleOpenDeepSeek}
                    variant="outline"
                    size="sm"
                    className="h-9"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    重新打开 DeepSeek
                  </Button>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="请粘贴 DeepSeek 生成的 JSON 格式结果..."
                    className="w-full h-full font-mono text-xs resize-none border-0 bg-transparent focus:ring-0 p-5 placeholder:text-gray-400"
                  />
                </div>
                {inputText && (
                  <div className="text-xs text-gray-500 flex-shrink-0">
                    已输入 {inputText.length} 个字符
                  </div>
                )}
              </div>

              {/* 下部：使用说明 */}
              <div className="flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">操作提示</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">在 DeepSeek 中粘贴提示词</p>
                        <p className="text-xs text-blue-700 mt-0.5">等待 AI 生成结果</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">复制 JSON 结果</p>
                        <p className="text-xs text-green-700 mt-0.5">复制 DeepSeek 返回内容</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">粘贴到输入框</p>
                        <p className="text-xs text-purple-700 mt-0.5">粘贴到上方输入框中</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-900">点击导入完成</p>
                        <p className="text-xs text-orange-700 mt-0.5">点击导入按钮完成</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          {step === 'preparing' && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
          )}
          {step === 'prompt' && (
            <>
              <Button 
                onClick={handleOpenDeepSeek}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                前往 DeepSeek 拆分需求模块
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
            </>
          )}
          {step === 'input' && (
            <>
              <Button
                onClick={handleImport}
                disabled={!inputText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

