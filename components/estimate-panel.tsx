'use client';

import { EstimateResult, GlobalConfig } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatCurrency, formatDays } from '@/lib/calculation';
import { DISCOUNT_OPTIONS } from '@/lib/constants';

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
    
    switch (roleCost.selectedLevel) {
      case 'low':
        return roleCost.salaryLow;
      case 'mid':
        return roleCost.salaryMid;
      case 'high':
        return roleCost.salaryHigh;
      default:
        return roleCost.salaryMid;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* 总工期 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">总工期</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatDays(estimate.totalDays)}
              </div>
            </CardContent>
          </Card>

          {/* 各角色工作量 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">人力投入</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estimate.teamWorkloads.map((workload) => {
                  const monthlySalary = getSalary(workload.role);
                  const cost = (workload.workDays / 22) * monthlySalary;
                  
                  return (
                    <div key={workload.role} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{workload.role}</span>
                      <div className="text-right">
                        <div className="font-medium">{formatDays(workload.workDays)}</div>
                        <div className="text-gray-500">{formatCurrency(cost)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 影响系数 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">影响系数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.impactFactors.map((factor, index) => (
                  <div key={factor.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{factor.name}</Label>
                      <span className="text-xs font-medium">{factor.value.toFixed(2)}x</span>
                    </div>
                    <Slider
                      value={[factor.value]}
                      onValueChange={([value]) => handleFactorChange(index, value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 折扣 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">折扣</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={discount.toString()}
                onValueChange={(value) => onDiscountChange(parseFloat(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Separator />

          {/* 价格汇总 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">基础成本</span>
                  <span className="font-medium">{formatCurrency(estimate.baseCost)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">应用系数后</span>
                  <span className="font-medium">
                    {formatCurrency(estimate.baseCost * config.impactFactors.reduce((acc, f) => acc * f.value, 1))}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">最终报价</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(estimate.finalPrice)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

