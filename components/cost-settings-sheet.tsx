'use client';

import { GlobalConfig, TeamRole } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CostSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: GlobalConfig;
  onConfigChange: (config: GlobalConfig) => void;
}

export function CostSettingsSheet({ open, onOpenChange, config, onConfigChange }: CostSettingsSheetProps) {
  
  const handleSalaryChange = (role: TeamRole, level: 'salaryLow' | 'salaryMid' | 'salaryHigh', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newRoleCosts = config.roleCosts.map(rc => 
      rc.role === role ? { ...rc, [level]: numValue } : rc
    );
    onConfigChange({
      ...config,
      roleCosts: newRoleCosts
    });
  };

  const handleLevelChange = (role: TeamRole, level: 'low' | 'mid' | 'high') => {
    const newRoleCosts = config.roleCosts.map(rc => 
      rc.role === role ? { ...rc, selectedLevel: level } : rc
    );
    onConfigChange({
      ...config,
      roleCosts: newRoleCosts
    });
  };

  const handleWorkDurationChange = (complexity: '低' | '中' | '高' | '极高', value: string) => {
    const numValue = parseFloat(value) || 0;
    onConfigChange({
      ...config,
      workDurationConfigs: {
        ...config.workDurationConfigs,
        [complexity]: numValue
      }
    });
  };

  const handleRoleRatioChange = (role: TeamRole, value: string) => {
    const numValue = parseFloat(value) || 0;
    onConfigChange({
      ...config,
      roleRatios: {
        ...config.roleRatios,
        [role]: numValue
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:w-[700px] sm:max-w-[700px]">
        <SheetHeader>
          <SheetTitle>单位成本配置</SheetTitle>
          <SheetDescription>
            配置团队人力成本和工期单位成本
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6 pr-4">
            {/* 人力单位成本 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">人力单位成本（月薪）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.roleCosts.map((roleCost) => (
                  <div key={roleCost.role} className="space-y-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{roleCost.role}</Label>
                      <Select
                        value={roleCost.selectedLevel}
                        onValueChange={(value: 'low' | 'mid' | 'high') => handleLevelChange(roleCost.role, value)}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">低档</SelectItem>
                          <SelectItem value="mid">中档</SelectItem>
                          <SelectItem value="high">高档</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">低档</Label>
                        <Input
                          type="number"
                          value={roleCost.salaryLow}
                          onChange={(e) => handleSalaryChange(roleCost.role, 'salaryLow', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">中档</Label>
                        <Input
                          type="number"
                          value={roleCost.salaryMid}
                          onChange={(e) => handleSalaryChange(roleCost.role, 'salaryMid', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">高档</Label>
                        <Input
                          type="number"
                          value={roleCost.salaryHigh}
                          onChange={(e) => handleSalaryChange(roleCost.role, 'salaryHigh', e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Separator />

            {/* 工期单位成本 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">工期单位成本（天数）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    基准工期配置（后端开发工程师为基准）
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(config.workDurationConfigs).map(([complexity, days]) => (
                      <div key={complexity} className="space-y-1">
                        <Label className="text-sm">{complexity}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={days}
                            onChange={(e) => handleWorkDurationChange(complexity as any, e.target.value)}
                            className="h-8"
                            step="0.5"
                            min="0.5"
                          />
                          <span className="text-sm text-gray-500">天</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    角色工期比例（相对后端开发工程师）
                  </p>
                  <div className="space-y-2">
                    {Object.entries(config.roleRatios).map(([role, ratio]) => (
                      <div key={role} className="flex items-center justify-between">
                        <Label className="text-sm">{role}</Label>
                        <div className="flex items-center gap-2 w-[180px]">
                          <Input
                            type="number"
                            value={ratio}
                            onChange={(e) => handleRoleRatioChange(role as TeamRole, e.target.value)}
                            className="h-8"
                            step="0.1"
                            min="0"
                            max="2"
                          />
                          <span className="text-sm text-gray-500 whitespace-nowrap">: 1</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}


