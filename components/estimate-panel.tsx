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
import { DISCOUNT_OPTIONS, SERVER_SPEC_PRICES, STORAGE_SPEC_PRICES, BANDWIDTH_SPEC_PRICES, DOMAIN_SPEC_PRICES, TRAFFIC_SPEC_PRICES } from '@/lib/constants';
import type { HardwareType, HardwareItem, ServerSpec, StorageSpec, BandwidthSpec, DomainSpec, TrafficSpec } from '@/types';
import { Pencil, Check, Trash2, User, Users, Laptop, Palette, Code, Smartphone, TabletSmartphone, Server, HardDrive, Network, Video, Radio, Globe, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface EstimatePanelProps {
  estimate: EstimateResult;
  config: GlobalConfig;
  discount: number;
  onDiscountChange: (discount: number) => void;
  onConfigChange: (config: GlobalConfig) => void;
  roleCounts: Record<string, number>;
  onRoleCountsChange: (counts: Record<string, number>) => void;
}

export function EstimatePanel({ 
  estimate, 
  config, 
  discount, 
  onDiscountChange,
  onConfigChange,
  roleCounts,
  onRoleCountsChange
}: EstimatePanelProps) {
  
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editSalary, setEditSalary] = useState<string>('');
  const [editingCountRole, setEditingCountRole] = useState<string | null>(null);
  const [editCount, setEditCount] = useState<string>('');
  
  // 硬件编辑状态（按字段分别管理）
  const [editingHardwareSpec, setEditingHardwareSpec] = useState<string | null>(null);
  const [editingHardwareUnitPrice, setEditingHardwareUnitPrice] = useState<string | null>(null);
  const [editingHardwareRemark, setEditingHardwareRemark] = useState<string | null>(null);
  const [editingHardwareQuantity, setEditingHardwareQuantity] = useState<string | null>(null);
  const [editHardwareUnitPrice, setEditHardwareUnitPrice] = useState('');
  const [editHardwareRemark, setEditHardwareRemark] = useState('');
  const [editHardwareQuantity, setEditHardwareQuantity] = useState('');

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
    const newRoleCounts = { ...roleCounts };
    delete newRoleCounts[role];
    onRoleCountsChange(newRoleCounts);
    onConfigChange({
      ...config,
      roleCosts: newRoleCosts
    });
  };
  
  // 硬件编辑相关函数
  const getHardwareIcon = (type: HardwareType) => {
    switch (type) {
      case '服务器':
        return <Server className="h-3 w-3 text-blue-500" />;
      case '存储':
        return <HardDrive className="h-3 w-3 text-orange-500" />;
      case '带宽':
        return <Network className="h-3 w-3 text-green-500" />;
      case '流媒体':
        return <Video className="h-3 w-3 text-pink-500" />;
      case '直播':
        return <Radio className="h-3 w-3 text-red-500" />;
      case 'CDN':
        return <Globe className="h-3 w-3 text-cyan-500" />;
      case '域名':
        return <FileText className="h-3 w-3 text-indigo-500" />;
      default:
        return <Server className="h-3 w-3 text-gray-500" />;
    }
  };
  
  // 数量编辑
  const startEditHardwareQuantity = (itemId: string, quantity: number) => {
    setEditingHardwareQuantity(itemId);
    setEditHardwareQuantity(quantity.toString());
  };
  
  const saveEditHardwareQuantity = (itemId: string) => {
    if (config.hardwareConfig) {
      const quantity = parseInt(editHardwareQuantity) || 0;
      const item = config.hardwareConfig.items.find(i => i.id === itemId);
      const unitPrice = item?.unitPrice || 0;
      
      const newItems = config.hardwareConfig.items.map(i => 
        i.id === itemId ? { ...i, quantity, price: unitPrice * quantity } : i
      );
      onConfigChange({
        ...config,
        hardwareConfig: { items: newItems }
      });
    }
    setEditingHardwareQuantity(null);
  };
  
  // 单价编辑
  const startEditHardwareUnitPrice = (itemId: string, unitPrice: number) => {
    setEditingHardwareUnitPrice(itemId);
    setEditHardwareUnitPrice(unitPrice.toString());
  };
  
  const saveEditHardwareUnitPrice = (itemId: string) => {
    if (config.hardwareConfig) {
      const unitPrice = parseInt(editHardwareUnitPrice) || 0;
      const item = config.hardwareConfig.items.find(i => i.id === itemId);
      const quantity = item?.quantity || 1;
      
      const newItems = config.hardwareConfig.items.map(i => 
        i.id === itemId 
          ? { ...i, unitPrice, price: unitPrice * quantity }
          : i
      );
      onConfigChange({
        ...config,
        hardwareConfig: { items: newItems }
      });
    }
    setEditingHardwareUnitPrice(null);
  };
  
  // 备注编辑
  const startEditHardwareRemark = (itemId: string, remark: string) => {
    setEditingHardwareRemark(itemId);
    setEditHardwareRemark(remark);
  };
  
  const saveEditHardwareRemark = (itemId: string) => {
    if (config.hardwareConfig) {
      const newItems = config.hardwareConfig.items.map(item => 
        item.id === itemId ? { ...item, remark: editHardwareRemark } : item
      );
      onConfigChange({
        ...config,
        hardwareConfig: { items: newItems }
      });
    }
    setEditingHardwareRemark(null);
  };

  const getRoleCount = (role: string): number => {
    return roleCounts[role] || 1;
  };

  const startEditCount = (role: string) => {
    setEditingCountRole(role);
    setEditCount(getRoleCount(role).toString());
  };

  const saveEditCount = (role: string) => {
    const count = parseInt(editCount) || 1;
    const validCount = Math.max(1, Math.min(count, 99)); // 限制1-99人
    onRoleCountsChange({
      ...roleCounts,
      [role]: validCount
    });
    setEditingCountRole(null);
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
    <div className="h-full bg-white border-l flex flex-col">
      <ScrollArea className="flex-1 overflow-auto">
        <div>
          {/* 人力投入 */}
          <div className="bg-white">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 border-b border-blue-100">
              <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-0.5 h-4 bg-blue-500 rounded-full"></span>
                人力投入
              </h3>
            </div>
            
            {/* 表头 */}
            <div className="flex items-center gap-1 py-1 px-2 border-b border-gray-200 bg-gray-50 min-w-0">
              <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                <span className="text-[10px] font-medium text-gray-600 truncate">岗位</span>
              </div>
              <div className="text-[10px] font-medium text-gray-600 w-10 text-right flex-shrink-0">人力</div>
              <div className="text-[10px] font-medium text-gray-600 w-10 text-right flex-shrink-0">数量</div>
              <div className="text-[10px] font-medium text-gray-600 w-10 text-right flex-shrink-0">工期</div>
              <div className="text-[10px] font-medium text-gray-600 w-20 text-right pr-5 flex-shrink-0">月薪</div>
              <div className="w-4 flex-shrink-0"></div>
            </div>
            
            {/* 岗位列表 */}
            <div className="space-y-0">
              {estimate.teamWorkloads.map((workload, index) => {
                const marketSalary = getMarketSalary(workload.role);
                const roleCount = getRoleCount(workload.role);
                const actualWorkDays = workload.workDays / roleCount; // 实际工期 = 总人力 / 人数
                const isEditing = editingRole === workload.role;
                const isEditingCount = editingCountRole === workload.role;
                
                return (
                  <div 
                    key={workload.role} 
                    className={`group flex items-center gap-1 py-1 px-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 min-w-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    {/* 岗位名称 */}
                    <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-hidden">
                      {getRoleIcon(workload.role as TeamRole)}
                      <span className="text-[10px] text-gray-700 truncate">{workload.role}</span>
                    </div>
                    
                    {/* 总人力 */}
                    <div className="text-[10px] text-gray-600 w-10 text-right flex-shrink-0">
                      {workload.workDays.toFixed(1)}
                      <span className="text-[8px] text-gray-500 ml-0.5">天</span>
                    </div>
                    
                    {/* 岗位数量 */}
                    <div className="w-10 flex items-center justify-end gap-0.5 flex-shrink-0">
                      {isEditingCount ? (
                        <div className="flex items-center gap-0.5">
                          <Input
                            type="number"
                            value={editCount}
                            onChange={(e) => setEditCount(e.target.value)}
                            className="h-4 w-7 text-[9px] text-right px-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                            min="1"
                            max="99"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditCount(workload.role);
                              if (e.key === 'Escape') setEditingCountRole(null);
                            }}
                          />
                          <button
                            onClick={() => saveEditCount(workload.role)}
                            className="p-0.5 hover:bg-green-100 rounded"
                            title="保存"
                          >
                            <Check className="h-2 w-2 text-green-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <span className="text-[9px] text-blue-600 font-medium">
                            {roleCount}<span className="text-[8px] text-gray-500 ml-0.5">人</span>
                          </span>
                          <button
                            onClick={() => startEditCount(workload.role)}
                            className="p-0.5 hover:bg-blue-100 rounded transition-colors"
                            title="编辑人数"
                          >
                            <Pencil className="h-2 w-2 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* 实际工期 */}
                    <div className="text-[10px] text-purple-600 font-medium w-10 text-right flex-shrink-0">
                      {actualWorkDays.toFixed(1)}
                      <span className="text-[8px] text-gray-500 ml-0.5">天</span>
                    </div>
                    
                    {/* 月薪（包含编辑图标） */}
                    <div className="w-20 flex items-center justify-end gap-0.5 flex-shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-0.5">
                          <Input
                            type="number"
                            value={editSalary}
                            onChange={(e) => setEditSalary(e.target.value)}
                            className="h-4 w-10 text-[9px] text-right px-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                            step="0.1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditSalary(workload.role);
                              if (e.key === 'Escape') setEditingRole(null);
                            }}
                          />
                          <span className="text-[8px] text-gray-500">万</span>
                          <button
                            onClick={() => saveEditSalary(workload.role)}
                            className="p-0.5 hover:bg-green-100 rounded"
                            title="保存"
                          >
                            <Check className="h-2 w-2 text-green-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <span className="text-[9px] text-orange-600 font-semibold text-right pr-5">
                            {(marketSalary / 10).toFixed(1)}<span className="text-[8px] text-gray-500 ml-0.5">万</span>
                          </span>
                          <button
                            onClick={() => startEditSalary(workload.role)}
                            className="p-0.5 hover:bg-blue-100 rounded transition-colors"
                            title="编辑月薪"
                          >
                            <Pencil className="h-2 w-2 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* 删除按钮 */}
                    <div className="w-4 flex items-center justify-center flex-shrink-0">
                      <button
                        onClick={() => deleteRole(workload.role)}
                        className="p-0.5 hover:bg-red-100 rounded transition-colors"
                        title="删除该岗位"
                      >
                        <Trash2 className="h-2.5 w-2.5 text-gray-400 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 硬件投入 */}
          <div className="bg-white mt-0">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 border-b border-green-100">
              <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-0.5 h-4 bg-green-500 rounded-full"></span>
                硬件投入
              </h3>
            </div>
            
            {/* 表头 */}
            <div className="flex items-center gap-1 py-1 px-2 border-b border-gray-200 bg-gray-50 min-w-0">
              <div className="text-[10px] font-medium text-gray-600 w-11 flex-shrink-0">硬件</div>
              <div className="text-[10px] font-medium text-gray-600 w-12 flex-shrink-0">规格</div>
              <div className="text-[10px] font-medium text-gray-600 w-14 flex-shrink-0 text-right">单价</div>
              <div className="text-[10px] font-medium text-gray-600 w-12 flex-shrink-0 text-center">数量</div>
              <div className="text-[10px] font-medium text-gray-600 flex-1 min-w-0 overflow-hidden">备注</div>
            </div>
            
            {/* 数据行 */}
            <div className="space-y-0">
              {config.hardwareConfig?.items.map((item, index) => {
                const isEditingUnitPrice = editingHardwareUnitPrice === item.id;
                const isEditingRemark = editingHardwareRemark === item.id;
                
                return (
                  <div 
                    key={item.id} 
                    className={`group flex items-center gap-1 py-1 px-2 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 min-w-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    {/* 硬件名称（带图标） */}
                    <div className="flex items-center gap-0.5 w-11 flex-shrink-0 min-w-0 overflow-hidden">
                      {getHardwareIcon(item.type)}
                      <span className="text-[9px] text-gray-700 truncate flex-1 min-w-0">{item.type}</span>
                    </div>
                    
                    {/* 规格（所有硬件类型可编辑） */}
                    <div className="w-12 flex items-center justify-between gap-0.5 flex-shrink-0 min-w-0">
                      {editingHardwareSpec === item.id ? (
                        <Select
                          value={item.spec || (item.type === '服务器' ? '4C8G' : item.type === '存储' ? '40GB' : item.type === '带宽' ? '1Mbps' : item.type === '域名' ? '备案' : '100GB')}
                          onValueChange={(value) => {
                            // 根据类型获取对应的价格表
                            let unitPrice = 0;
                            if (item.type === '服务器') {
                              unitPrice = SERVER_SPEC_PRICES[value] || 0;
                            } else if (item.type === '存储') {
                              unitPrice = STORAGE_SPEC_PRICES[value] || 0;
                            } else if (item.type === '带宽') {
                              unitPrice = BANDWIDTH_SPEC_PRICES[value] || 0;
                            } else if (item.type === '域名') {
                              unitPrice = DOMAIN_SPEC_PRICES[value] || 0;
                            } else if (item.type === '流媒体' || item.type === '直播' || item.type === 'CDN') {
                              unitPrice = TRAFFIC_SPEC_PRICES[value] || 0;
                            }
                            
                            const quantity = item.quantity || 1;
                            const newItems = config.hardwareConfig!.items.map(i => 
                              i.id === item.id 
                                ? { ...i, spec: value, unitPrice, price: unitPrice * quantity }
                                : i
                            );
                            onConfigChange({
                              ...config,
                              hardwareConfig: { items: newItems }
                            });
                            setEditingHardwareSpec(null);
                          }}
                          open={true}
                          onOpenChange={(open) => {
                            if (!open) setEditingHardwareSpec(null);
                          }}
                        >
                          <SelectTrigger className="h-4 text-[8px] px-0.5 py-0 w-full border-gray-200 min-h-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] min-w-[60px]">
                            {item.type === '服务器' && (
                              <>
                                <SelectItem value="2C4G" className="text-[9px] h-7 py-1">2C4G</SelectItem>
                                <SelectItem value="4C8G" className="text-[9px] h-7 py-1">4C8G</SelectItem>
                                <SelectItem value="8C16G" className="text-[9px] h-7 py-1">8C16G</SelectItem>
                                <SelectItem value="16C32G" className="text-[9px] h-7 py-1">16C32G</SelectItem>
                                <SelectItem value="24C48G" className="text-[9px] h-7 py-1">24C48G</SelectItem>
                                <SelectItem value="32C64G" className="text-[9px] h-7 py-1">32C64G</SelectItem>
                              </>
                            )}
                            {item.type === '存储' && (
                              <>
                                <SelectItem value="40GB" className="text-[9px] h-7 py-1">40GB</SelectItem>
                                <SelectItem value="100GB" className="text-[9px] h-7 py-1">100GB</SelectItem>
                                <SelectItem value="500GB" className="text-[9px] h-7 py-1">500GB</SelectItem>
                                <SelectItem value="1T" className="text-[9px] h-7 py-1">1T</SelectItem>
                                <SelectItem value="按需" className="text-[9px] h-7 py-1">按需</SelectItem>
                              </>
                            )}
                            {item.type === '带宽' && (
                              <>
                                <SelectItem value="1Mbps" className="text-[9px] h-7 py-1">1Mbps</SelectItem>
                                <SelectItem value="2Mbps" className="text-[9px] h-7 py-1">2Mbps</SelectItem>
                                <SelectItem value="3Mbps" className="text-[9px] h-7 py-1">3Mbps</SelectItem>
                                <SelectItem value="5Mbps" className="text-[9px] h-7 py-1">5Mbps</SelectItem>
                              </>
                            )}
                            {item.type === '域名' && (
                              <>
                                <SelectItem value="备案" className="text-[9px] h-7 py-1">备案</SelectItem>
                                <SelectItem value="免备案" className="text-[9px] h-7 py-1">免备案</SelectItem>
                              </>
                            )}
                            {(item.type === '流媒体' || item.type === '直播' || item.type === 'CDN') && (
                              <>
                                <SelectItem value="100GB" className="text-[9px] h-7 py-1">100GB</SelectItem>
                                <SelectItem value="300GB" className="text-[9px] h-7 py-1">300GB</SelectItem>
                                <SelectItem value="500GB" className="text-[9px] h-7 py-1">500GB</SelectItem>
                                <SelectItem value="1T" className="text-[9px] h-7 py-1">1T</SelectItem>
                                <SelectItem value="∞" className="text-[9px] h-7 py-1">∞</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center justify-between w-full gap-0.5">
                          <span className="text-[8px] text-gray-700 truncate flex-1 min-w-0">
                            {item.spec || (item.type === '服务器' ? '4C8G' : item.type === '存储' ? '40GB' : item.type === '带宽' ? '1Mbps' : item.type === '域名' ? '备案' : '100GB')}
                          </span>
                          <button
                            onClick={() => setEditingHardwareSpec(item.id)}
                            className="p-0.5 hover:bg-green-100 rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="编辑规格"
                          >
                            <Pencil className="h-2 w-2 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* 单价（元/年） */}
                    <div className="w-14 flex items-center justify-end gap-0.5 flex-shrink-0 min-w-0">
                      {isEditingUnitPrice ? (
                        <div className="flex items-center gap-0.5">
                          <Input
                            type="number"
                            value={editHardwareUnitPrice}
                            onChange={(e) => setEditHardwareUnitPrice(e.target.value)}
                            className="h-4 w-9 text-[8px] text-right px-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditHardwareUnitPrice(item.id);
                              if (e.key === 'Escape') setEditingHardwareUnitPrice(null);
                            }}
                          />
                          <button
                            onClick={() => saveEditHardwareUnitPrice(item.id)}
                            className="p-0.5 hover:bg-green-100 rounded"
                            title="保存"
                          >
                            <Check className="h-2 w-2 text-green-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 w-full justify-end min-w-0 overflow-hidden">
                          <span className="text-[8px] text-gray-700 truncate">
                            {item.unitPrice.toLocaleString()}<span className="text-[7px] text-gray-500">/年</span>
                          </span>
                          <button
                            onClick={() => startEditHardwareUnitPrice(item.id, item.unitPrice)}
                            className="p-0.5 hover:bg-green-100 rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="编辑单价"
                          >
                            <Pencil className="h-2 w-2 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* 需要/数量 */}
                    <div className="w-12 flex items-center justify-center flex-shrink-0">
                      {item.type === '服务器' ? (
                        // 服务器显示数量输入
                        editingHardwareQuantity === item.id ? (
                          <div className="flex items-center gap-0.5 justify-center">
                            <Input
                              type="number"
                              value={editHardwareQuantity}
                              onChange={(e) => setEditHardwareQuantity(e.target.value)}
                              className="h-5 w-8 text-[9px] text-center px-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              autoFocus
                              min="0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditHardwareQuantity(item.id);
                                if (e.key === 'Escape') setEditingHardwareQuantity(null);
                              }}
                            />
                            <button
                              onClick={() => saveEditHardwareQuantity(item.id)}
                              className="p-0.5 hover:bg-green-100 rounded flex-shrink-0"
                              title="保存"
                            >
                              <Check className="h-2 w-2 text-green-600" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 justify-center">
                            <span className="text-[8px] text-gray-700 font-medium">
                              {item.quantity}<span className="text-[7px] text-gray-500 ml-0.5">台</span>
                            </span>
                            <button
                              onClick={() => startEditHardwareQuantity(item.id, item.quantity)}
                              className="p-0.5 hover:bg-green-100 rounded transition-colors flex-shrink-0"
                              title="编辑数量"
                            >
                              <Pencil className="h-2 w-2 text-gray-400" />
                            </button>
                          </div>
                        )
                      ) : (
                        // 其他硬件显示checkbox
                        <Checkbox
                          checked={item.quantity > 0}
                          onCheckedChange={(checked) => {
                            // 勾选时设置默认数量为1，取消勾选设置为0
                            const newQuantity = checked ? 1 : 0;
                            const newItems = config.hardwareConfig!.items.map(i => 
                              i.id === item.id 
                                ? { ...i, quantity: newQuantity, price: i.unitPrice * newQuantity }
                                : i
                            );
                            onConfigChange({
                              ...config,
                              hardwareConfig: { items: newItems }
                            });
                          }}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                    
                    {/* 备注 */}
                    <div className="flex-1 min-w-0 flex items-center gap-0.5 overflow-hidden">
                      {isEditingRemark ? (
                        <>
                          <Input
                            type="text"
                            value={editHardwareRemark}
                            onChange={(e) => setEditHardwareRemark(e.target.value)}
                            className="h-4 flex-1 min-w-0 text-[8px] px-1"
                            placeholder="备注"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditHardwareRemark(item.id);
                              if (e.key === 'Escape') setEditingHardwareRemark(null);
                            }}
                          />
                          <button
                            onClick={() => saveEditHardwareRemark(item.id)}
                            className="p-0.5 hover:bg-green-100 rounded flex-shrink-0"
                            title="保存"
                          >
                            <Check className="h-2 w-2 text-green-600" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span 
                            className="text-[8px] text-gray-600 flex-1 min-w-0 truncate overflow-hidden"
                            title={item.remark || "暂无备注"}
                          >
                            {item.remark || <span className="text-gray-400 italic">暂无备注</span>}
                          </span>
                          <button
                            onClick={() => startEditHardwareRemark(item.id, item.remark)}
                            className="p-0.5 hover:bg-green-100 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                            title="编辑备注"
                          >
                            <Pencil className="h-2 w-2 text-gray-400" />
                          </button>
                        </>
                      )}
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

