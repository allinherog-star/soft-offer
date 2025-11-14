'use client';

import { useState } from 'react';
import { EstimateResult, GlobalConfig, TeamRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDays } from '@/lib/calculation';
import { DISCOUNT_OPTIONS } from '@/lib/constants';
import { Pencil, Check, Trash2, User, Users, Laptop, Palette, Code, Smartphone, TabletSmartphone } from 'lucide-react';

interface EstimatePanelProps {
  estimate: EstimateResult;
  config: GlobalConfig;
  discount: number;
  onDiscountChange: (discount: number) => void;
  onConfigChange: (config: GlobalConfig) => void;
}

export function EstimatePanel({ 
  estimate, 
  config, 
  discount, 
  onDiscountChange,
  onConfigChange 
}: EstimatePanelProps) {
  
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editSalary, setEditSalary] = useState<string>('');

  const handleFactorChange = (index: number, value: number) => {
    const newFactors = [...config.impactFactors];
    newFactors[index].value = value;
    onConfigChange({
      ...config,
      impactFactors: newFactors
    });
  };

  const getSalary = (role: string) => {
    const roleCost = config.roleCosts.find(r => r.role === role);
    if (!roleCost) return 0;
    
    // salary是千单位，需要乘以1000转换为元
    return (roleCost.salary || 0) * 1000;
  };

  const getMarketSalary = (role: string) => {
    const roleCost = config.roleCosts.find(r => r.role === role);
    if (!roleCost) return 0;
    return roleCost.salary || 0; // 返回千单位
  };

  const startEditSalary = (role: string) => {
    setEditingRole(role);
    // 将千单位转换为万单位显示
    const salaryInK = getMarketSalary(role);
    setEditSalary((salaryInK / 10).toFixed(1));
  };

  const saveEditSalary = (role: string) => {
    // 将万单位转换回千单位存储
    const salaryInWan = parseFloat(editSalary) || 0;
    const newSalary = salaryInWan * 10;
    const newRoleCosts = config.roleCosts.map(rc => 
      rc.role === role ? { ...rc, salary: newSalary } : rc
    );
    onConfigChange({
      ...config,
      roleCosts: newRoleCosts
    });
    setEditingRole(null);
  };

  const deleteRole = (role: string) => {
    const newRoleCosts = config.roleCosts.filter(rc => rc.role !== role);
    onConfigChange({
      ...config,
      roleCosts: newRoleCosts
    });
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case '产品经理':
        return <User className="h-4 w-4 text-blue-500" />;
      case '项目经理':
        return <Users className="h-4 w-4 text-purple-500" />;
      case '架构师':
        return <Laptop className="h-4 w-4 text-orange-500" />;
      case '平面设计师':
        return <Palette className="h-4 w-4 text-pink-500" />;
      case '后端开发工程师':
        return <Code className="h-4 w-4 text-green-500" />;
      case '前端开发工程师':
        return <Code className="h-4 w-4 text-cyan-500" />;
      case '移动端IOS开发工程师':
        return <Smartphone className="h-4 w-4 text-gray-700" />;
      case '移动端Android开发工程师':
        return <TabletSmartphone className="h-4 w-4 text-green-600" />;
      case '小程序开发工程师':
        return <Smartphone className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* 人力投入 */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-gray-800">人力投入</h3>
            </div>
            
            {/* 岗位列表 */}
            <div className="space-y-1">
              {estimate.teamWorkloads.map((workload) => {
                const monthlySalary = getSalary(workload.role);
                const marketSalary = getMarketSalary(workload.role);
                const cost = (workload.workDays / 22) * monthlySalary;
                const isEditing = editingRole === workload.role;
                
                return (
                  <div 
                    key={workload.role} 
                    className="group flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    {/* 岗位名称 */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {getRoleIcon(workload.role as TeamRole)}
                      <span className="text-xs text-gray-700 truncate">{workload.role}</span>
                    </div>
                    
                    {/* 工作天数 */}
                    <div className="text-xs text-gray-900 font-medium w-12 text-right">
                      {workload.workDays.toFixed(1)}天
                    </div>
                    
                    {/* 月薪 */}
                    <div className="w-16 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-0.5">
                          <Input
                            type="number"
                            value={editSalary}
                            onChange={(e) => setEditSalary(e.target.value)}
                            className="h-6 w-12 text-xs text-right px-1"
                            autoFocus
                            step="0.1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditSalary(workload.role);
                              if (e.key === 'Escape') setEditingRole(null);
                            }}
                          />
                          <span className="text-xs text-gray-500">万</span>
                        </div>
                      ) : (
                        <span className="text-xs text-orange-600 font-semibold">
                          {(marketSalary / 10).toFixed(1)}万
                        </span>
                      )}
                    </div>
                    
                    {/* 成本 */}
                    <div className="text-xs text-gray-600 w-16 text-right">
                      {(cost / 10000).toFixed(1)}万
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <button
                          onClick={() => saveEditSalary(workload.role)}
                          className="p-0.5 hover:bg-green-100 rounded"
                          title="保存"
                        >
                          <Check className="h-3 w-3 text-green-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditSalary(workload.role)}
                          className="p-0.5 hover:bg-gray-200 rounded"
                          title="编辑"
                        >
                          <Pencil className="h-3 w-3 text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteRole(workload.role)}
                        className="p-0.5 hover:bg-red-100 rounded"
                        title="删除"
                      >
                        <Trash2 className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

