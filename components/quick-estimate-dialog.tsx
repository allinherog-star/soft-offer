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
  const [step, setStep] = useState<'generating' | 'waiting' | 'input'>('generating');
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
项目名称：${projectInfo.name || '未命名项目'}
项目描述：${projectInfo.description || '无描述'}
行业应用：${projectInfo.industry || '未指定'}
交付端：${platforms}

【输出要求】
请按照以下JSON格式输出系统的需求清单，要求包含：
1. 系统模块的层级结构（需求模块 → 子模块 → 功能菜单）
2. 每个功能的复杂度评估（低、中、高、很高）
3. 每个功能的优先级（低、中、高、很高）
4. 重点功能标记（isImportant: true/false）
5. 详细的功能说明（remark字段）

【JSON格式示例】
\`\`\`json
[
  {
    "name": "用户管理",
    "complexity": "中",
    "priority": "高",
    "isImportant": true,
    "remark": "用户管理模块包含用户的注册、登录、权限管理等核心功能",
    "children": [
      {
        "name": "用户注册",
        "complexity": "低",
        "priority": "高",
        "isImportant": false,
        "remark": "支持手机号、邮箱注册，需要验证码验证"
      },
      {
        "name": "用户登录",
        "complexity": "中",
        "priority": "很高",
        "isImportant": true,
        "remark": "支持密码登录、第三方登录（微信、支付宝），包含找回密码功能"
      }
    ]
  }
]
\`\`\`

请务必：
- 根据行业特点生成相关的业务模块
- 根据交付端特点考虑对应的技术实现
- 合理评估每个功能的复杂度和优先级
- 对重要功能进行标记
- 提供详细的功能说明`;
  }, [projectInfo]);

  // 复制提示词到剪贴板
  const copyPromptToClipboard = useCallback(async () => {
    try {
      const prompt = generatePrompt();
      await navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      toast({
        title: '已复制',
        description: '提示词已复制到剪贴板',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: '复制失败',
        description: '请手动复制提示词',
        variant: 'destructive',
      });
    }
  }, [generatePrompt, toast]);

  // 打开DeepSeek
  const openDeepSeek = useCallback(() => {
    window.open('https://chat.deepseek.com/', '_blank');
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
      setStep('generating');
      setCountdown(3);
      setInputText('');
      setIsCopied(false);
      
      // 自动复制提示词
      const timer = setTimeout(() => {
        copyPromptToClipboard();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [open, copyPromptToClipboard]);

  // 倒计时和自动跳转
  useEffect(() => {
    if (step === 'generating' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (step === 'generating' && countdown === 0) {
      setStep('waiting');
      openDeepSeek();
      // 自动进入输入阶段
      const timer = setTimeout(() => {
        setStep('input');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown, openDeepSeek]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>快速评估</span>
            {step === 'input' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <p>使用AI快速生成项目需求清单</p>
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <div className="font-medium text-blue-900 mb-1">当前项目信息：</div>
                <div className="text-blue-700 space-y-0.5">
                  <div>📌 {projectInfo.name}</div>
                  <div>📝 {projectInfo.description}</div>
                  <div>🏢 {projectInfo.industry}</div>
                  {projectInfo.platforms.length > 0 && (
                    <div>💻 {projectInfo.platforms.join('、')}</div>
                  )}
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* 步骤1: 生成提示词并倒计时 */}
          {step === 'generating' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                  <p className="text-lg font-medium">正在准备提示词...</p>
                  <p className="text-sm text-gray-500">
                    {countdown} 秒后将自动跳转到 DeepSeek
                  </p>
                  <p className="text-xs text-blue-600">
                    ✓ 已根据您的项目信息生成专属提示词
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">提示词预览</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyPromptToClipboard}
                    className="h-7"
                  >
                    {isCopied ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        复制
                      </>
                    )}
                  </Button>
                </div>
                <pre className="text-xs bg-white rounded p-3 overflow-x-auto max-h-[300px] overflow-y-auto border">
                  {generatePrompt()}
                </pre>
              </div>
            </div>
          )}

          {/* 步骤2: 等待跳转 */}
          {step === 'waiting' && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <ExternalLink className="h-12 w-12 text-blue-500 mx-auto animate-pulse" />
                <p className="text-lg font-medium">正在跳转到 DeepSeek...</p>
                <p className="text-sm text-gray-500">
                  请在 DeepSeek 中粘贴提示词，等待生成结果
                </p>
              </div>
            </div>
          )}

          {/* 步骤3: 输入结果 */}
          {step === 'input' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>操作提示：</strong>
                </p>
                <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>在 DeepSeek 中粘贴已复制的提示词</li>
                  <li>等待 AI 生成结果</li>
                  <li>复制 DeepSeek 返回的 JSON 格式内容</li>
                  <li>粘贴到下方输入框中</li>
                  <li>点击导入按钮完成</li>
                </ol>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  DeepSeek 生成结果
                </label>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="请粘贴 DeepSeek 生成的 JSON 格式结果..."
                  className="min-h-[300px] font-mono text-xs"
                />
              </div>

              {inputText && (
                <div className="text-xs text-gray-500">
                  已输入 {inputText.length} 个字符
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'input' && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                onClick={openDeepSeek}
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                重新打开 DeepSeek
              </Button>
              <Button
                onClick={handleImport}
                disabled={!inputText.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
            </>
          )}
          {step !== 'input' && (
            <Button
              variant="outline"
              onClick={() => {
                setStep('input');
              }}
            >
              跳过等待
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

