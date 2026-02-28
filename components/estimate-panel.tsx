'use client';

import { useState } from 'react';
import { EstimateResult, GlobalConfig, TeamRole, UserScale, ServiceLevel, QualityLevel, SecurityLevel, DisasterRecoveryLevel, FlexibilityLevel } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDays } from '@/lib/calculation';
import { DISCOUNT_OPTIONS, SERVER_SPEC_PRICES, STORAGE_SPEC_PRICES, BANDWIDTH_SPEC_PRICES, DOMAIN_SPEC_PRICES, TRAFFIC_SPEC_PRICES, calculateRecommendedSalary } from '@/lib/constants';
import { isImeComposing } from '@/lib/ime';
import type { HardwareType, HardwareItem, ServerSpec, StorageSpec, BandwidthSpec, DomainSpec, TrafficSpec, WorkExperience } from '@/types';
import { Pencil, Check, User, Users, Laptop, Palette, Code, Smartphone, TabletSmartphone, Server, HardDrive, Network, Video, Radio, Globe, FileText, Trophy, Medal, Award, Star, ExternalLink, Settings, UsersRound, MessageSquare, Shield, Database, Layers, Users2, UserPlus, Building2, TrendingUp, Clock, Headset, PhoneCall, CheckCircle2, AlertCircle, AlertTriangle, Sparkles, Lock, CreditCard, ShieldCheck, FolderClock, HardDriveDownload, Timer, Box, Grid3x3, Boxes, Component } from 'lucide-react';
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
  const [editingExperienceRole, setEditingExperienceRole] = useState<string | null>(null);
  
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
  
  // 单价编辑（月价格）
  const startEditHardwareUnitPrice = (itemId: string, yearlyUnitPrice: number) => {
    setEditingHardwareUnitPrice(itemId);
    // 编辑时显示月价格
    const monthlyPrice = Math.round(yearlyUnitPrice / 12);
    setEditHardwareUnitPrice(monthlyPrice.toString());
  };
  
  const saveEditHardwareUnitPrice = (itemId: string) => {
    if (config.hardwareConfig) {
      const monthlyPrice = parseInt(editHardwareUnitPrice) || 0;
      // 保存时转换为年价格
      const unitPrice = monthlyPrice * 12;
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

  // 获取人力岗位的人力水平
  const getRoleExperience = (role: string): WorkExperience => {
    const roleCost = config.roleCosts.find(rc => rc.role === role);
    return roleCost?.experience || '二线中厂';
  };

  // 简化人力水平显示文字
  const getExperienceShortText = (experience: WorkExperience): string => {
    const map: Record<WorkExperience, string> = {
      '一线大厂': '一线',
      '二线中厂': '二线',
      '三线小厂': '三线',
      '新手上路': '新手'
    };
    return map[experience] || experience;
  };

  // 获取人力水平对应的图标
  const getExperienceIcon = (experience: WorkExperience) => {
    switch (experience) {
      case '一线大厂':
        return <Trophy className="h-3 w-3 text-amber-500" />;
      case '二线中厂':
        return <Medal className="h-3 w-3 text-gray-500" />;
      case '三线小厂':
        return <Award className="h-3 w-3 text-blue-500" />;
      case '新手上路':
        return <Star className="h-3 w-3 text-green-500" />;
      default:
        return <Award className="h-3 w-3 text-gray-400" />;
    }
  };

  // 更新人力岗位的人力水平（并自动更新标准月薪）
  const updateRoleExperience = (role: string, experience: WorkExperience) => {
    const newRoleCosts = config.roleCosts.map(rc => {
      if (rc.role === role) {
        // 根据新人力水平和现有工作年限计算新标准月薪
        const newSalary = calculateRecommendedSalary(rc.role as any, experience, rc.workYears);
        return { ...rc, experience, salary: newSalary };
      }
      return rc;
    });
    onConfigChange({
      ...config,
      roleCosts: newRoleCosts
    });
    setEditingExperienceRole(null);
  };

  // 批量更新所有人力岗位的人力水平
  const batchUpdateExperience = (experience: WorkExperience) => {
    const newRoleCosts = config.roleCosts.map(rc => {
      // 根据新人力水平和现有工作年限计算新标准月薪
      const newSalary = calculateRecommendedSalary(rc.role as any, experience, rc.workYears);
      return { ...rc, experience, salary: newSalary };
    });
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
      case '美工师':
        return <Palette className="h-4 w-4 text-pink-500" />;
      case '后端开发工程师':
        return <Code className="h-4 w-4 text-green-500" />;
      case '前端开发工程师':
        return <Code className="h-4 w-4 text-cyan-500" />;
      case 'IOS开发工程师':
        return <Smartphone className="h-4 w-4 text-gray-700" />;
      case 'Android开发工程师':
        return <TabletSmartphone className="h-4 w-4 text-green-600" />;
      case '小程序开发工程师':
        return <Smartphone className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  // 整体系数选项图标
  const getUserScaleIcon = (scale: UserScale) => {
    switch (scale) {
      case '10w+':
        return <Users2 className="h-3 w-3" />;
      case '100w+':
        return <UserPlus className="h-3 w-3" />;
      case '1000w+':
        return <Building2 className="h-3 w-3" />;
      case '1ww+':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getServiceLevelIcon = (level: ServiceLevel) => {
    switch (level) {
      case '标准':
        return <CheckCircle2 className="h-3 w-3" />;
      case '及时响应':
        return <Clock className="h-3 w-3" />;
      case '工作日坐席':
        return <Headset className="h-3 w-3" />;
      case '7*24':
        return <PhoneCall className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getQualityLevelIcon = (level: QualityLevel) => {
    switch (level) {
      case '标准':
        return <CheckCircle2 className="h-3 w-3" />;
      case '高':
        return <Star className="h-3 w-3" />;
      case '很高':
        return <AlertCircle className="h-3 w-3" />;
      case '极高':
        return <Sparkles className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getSecurityLevelIcon = (level: SecurityLevel) => {
    switch (level) {
      case '标准':
        return <CheckCircle2 className="h-3 w-3" />;
      case '权限控制':
        return <Lock className="h-3 w-3" />;
      case '金融支付':
        return <CreditCard className="h-3 w-3" />;
      case '安全盾':
        return <ShieldCheck className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getDisasterRecoveryIcon = (level: DisasterRecoveryLevel) => {
    switch (level) {
      case '标准':
        return <CheckCircle2 className="h-3 w-3" />;
      case '定时备份':
        return <FolderClock className="h-3 w-3" />;
      case 'T1可恢复':
        return <HardDriveDownload className="h-3 w-3" />;
      case 'H1可恢复':
        return <Timer className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getFlexibilityLevelIcon = (level: FlexibilityLevel) => {
    switch (level) {
      case '标准':
        return <Box className="h-3 w-3" />;
      case '多系统':
        return <Grid3x3 className="h-3 w-3" />;
      case '微服务':
        return <Boxes className="h-3 w-3" />;
      case '组件化':
        return <Component className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // 根据档位获取颜色（第1档统一颜色，第2-4档递增）
  const getLevelColor = (index: number, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
    
    switch (index) {
      case 0: // 第1档：蓝色
        return 'bg-blue-500 text-white shadow-sm';
      case 1: // 第2档：绿色
        return 'bg-green-500 text-white shadow-sm';
      case 2: // 第3档：橙色
        return 'bg-orange-500 text-white shadow-sm';
      case 3: // 第4档：红色
        return 'bg-red-500 text-white shadow-sm';
      default:
        return 'bg-gray-500 text-white shadow-sm';
    }
  };

  return (
    <div className="h-full bg-white border-l flex flex-col print:h-auto print:border-0 print:overflow-visible print:flex-none">
      {/* 屏幕显示时使用ScrollArea */}
      <div className="flex-1 overflow-auto print:hidden">
        <ScrollArea className="h-full">
          <div>
            {/* 人力投入 */}
            <div className="bg-white">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 border-b border-blue-100 print:bg-blue-100 print:border-2 print:border-blue-400">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-0.5 h-4 bg-blue-500 rounded-full"></span>
                  人力投入
                </h3>
                {/* 批量调整人力水平按钮 */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => batchUpdateExperience('一线大厂')}
                    className="group flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-amber-100 transition-colors"
                    title="批量设置为一线大厂"
                  >
                    <Trophy className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] text-gray-600 group-hover:text-amber-700">一线</span>
                  </button>
                  <button
                    onClick={() => batchUpdateExperience('二线中厂')}
                    className="group flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                    title="批量设置为二线中厂"
                  >
                    <Medal className="h-3 w-3 text-gray-500" />
                    <span className="text-[10px] text-gray-600 group-hover:text-gray-700">二线</span>
                  </button>
                  <button
                    onClick={() => batchUpdateExperience('三线小厂')}
                    className="group flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors"
                    title="批量设置为三线小厂"
                  >
                    <Award className="h-3 w-3 text-blue-500" />
                    <span className="text-[10px] text-gray-600 group-hover:text-blue-700">三线</span>
                  </button>
                  <button
                    onClick={() => batchUpdateExperience('新手上路')}
                    className="group flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-green-100 transition-colors"
                    title="批量设置为新手上路"
                  >
                    <Star className="h-3 w-3 text-green-500" />
                    <span className="text-[10px] text-gray-600 group-hover:text-green-700">新手</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* 表头 */}
            <div className="flex items-center gap-2 py-1.5 px-3 border-b border-gray-200 bg-gray-50 min-w-0 print:border-2 print:border-blue-300 print:bg-blue-50">
              <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                <span className="text-xs font-medium text-gray-600 truncate">人力岗位</span>
              </div>
              <div className="text-xs font-medium text-gray-600 w-20 text-center flex-shrink-0">人力水平</div>
              <div className="text-xs font-medium text-gray-600 w-12 text-right flex-shrink-0">人力</div>
              <div className="text-xs font-medium text-gray-600 w-16 text-right flex-shrink-0">人数</div>
              <div className="text-xs font-medium text-gray-600 w-12 text-right flex-shrink-0">工期</div>
              <div className="text-xs font-medium text-gray-600 w-16 text-right flex-shrink-0">标准月薪</div>
            </div>
            
            {/* 人力岗位列表 */}
            <div className="space-y-0 print:border-2 print:border-t-0 print:border-blue-300">
              {estimate.teamWorkloads.map((workload, index) => {
                const marketSalary = getMarketSalary(workload.role);
                const roleCount = getRoleCount(workload.role);
                const actualWorkDays = workload.workDays / roleCount; // 实际工期 = 总人力 / 人数
                const isEditing = editingRole === workload.role;
                const isEditingCount = editingCountRole === workload.role;
                
                return (
                  <div 
                    key={workload.role} 
                    className={`group flex items-center gap-2 py-1.5 px-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 min-w-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    {/* 人力岗位名称 */}
                    <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-hidden">
                      {getRoleIcon(workload.role as TeamRole)}
                      <span className="text-xs text-gray-700 truncate">{workload.role}</span>
                    </div>
                    
                    {/* 人力水平 */}
                    <div className="w-20 flex items-center justify-center flex-shrink-0">
                      {editingExperienceRole === workload.role ? (
                        <Select 
                          value={getRoleExperience(workload.role)}
                          onValueChange={(value: WorkExperience) => updateRoleExperience(workload.role, value)}
                          open={true}
                          onOpenChange={(open) => {
                            if (!open) setEditingExperienceRole(null);
                          }}
                        >
                          <SelectTrigger className="h-5 w-full text-[10px] px-1 py-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="w-auto min-w-fit">
                            <SelectItem value="一线大厂" className="text-xs h-7 py-1 pl-3 pr-8">
                              <Trophy className="h-3.5 w-3.5 text-amber-500" />
                              <span>一线大厂</span>
                            </SelectItem>
                            <SelectItem value="二线中厂" className="text-xs h-7 py-1 pl-3 pr-8">
                              <Medal className="h-3.5 w-3.5 text-gray-500" />
                              <span>二线中厂</span>
                            </SelectItem>
                            <SelectItem value="三线小厂" className="text-xs h-7 py-1 pl-3 pr-8">
                              <Award className="h-3.5 w-3.5 text-blue-500" />
                              <span>三线小厂</span>
                            </SelectItem>
                            <SelectItem value="新手上路" className="text-xs h-7 py-1 pl-3 pr-8">
                              <Star className="h-3.5 w-3.5 text-green-500" />
                              <span>新手上路</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1">
                          {getExperienceIcon(getRoleExperience(workload.role))}
                          <span className="text-[10px] text-gray-700">
                            {getExperienceShortText(getRoleExperience(workload.role))}
                          </span>
                          <button
                            onClick={() => setEditingExperienceRole(workload.role)}
                            className="p-0.5 hover:bg-blue-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="编辑人力水平"
                          >
                            <Pencil className="h-2.5 w-2.5 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* 总人力 */}
                    <div className="text-xs text-gray-600 w-12 text-right flex-shrink-0">
                      {workload.workDays.toFixed(1)}
                      <span className="text-[10px] text-gray-500 ml-0.5">天</span>
                    </div>
                    
                    {/* 人力岗位人数 */}
                    <div className="w-16 flex items-center justify-end gap-0.5 flex-shrink-0">
                      {isEditingCount ? (
                        <div className="flex items-center gap-0.5">
                          <Input
                            type="number"
                            value={editCount}
                            onChange={(e) => setEditCount(e.target.value)}
                            className="h-5 w-9 text-[10px] text-right px-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                            min="1"
                            max="99"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !isImeComposing(e)) saveEditCount(workload.role);
                              if (e.key === 'Escape') setEditingCountRole(null);
                            }}
                          />
                          <button
                            onClick={() => saveEditCount(workload.role)}
                            className="p-0.5 hover:bg-green-100 rounded"
                            title="保存"
                          >
                            <Check className="h-2.5 w-2.5 text-green-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <span className="text-[11px] text-blue-600 font-medium">
                            {roleCount}<span className="text-[10px] text-gray-500 ml-0.5">人</span>
                          </span>
                          <button
                            onClick={() => startEditCount(workload.role)}
                            className="p-0.5 hover:bg-blue-100 rounded transition-colors"
                            title="编辑人数"
                          >
                            <Pencil className="h-2.5 w-2.5 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* 实际工期 */}
                    <div className="text-xs text-purple-600 font-medium w-12 text-right flex-shrink-0">
                      {actualWorkDays.toFixed(1)}
                      <span className="text-[10px] text-gray-500 ml-0.5">天</span>
                    </div>
                    
                    {/* 标准月薪（包含编辑图标） */}
                    <div className="w-16 flex items-center justify-end gap-0.5 flex-shrink-0">
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
                              if (e.key === 'Enter' && !isImeComposing(e)) saveEditSalary(workload.role);
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
                          <span className="text-[11px] text-orange-600 font-semibold text-right">
                            {(marketSalary / 10).toFixed(1)}<span className="text-[10px] text-gray-500 ml-0.5">万</span>
                          </span>
                          <button
                            onClick={() => startEditSalary(workload.role)}
                            className="p-0.5 hover:bg-blue-100 rounded transition-colors"
                            title="编辑标准月薪"
                          >
                            <Pencil className="h-2 w-2 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 硬件投入 */}
          <div className="bg-white mt-0 print:break-inside-avoid print:mb-6 print:mt-0">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 border-b border-green-100 print:bg-green-100 print:border-2 print:border-green-400">
              <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-0.5 h-4 bg-green-500 rounded-full"></span>
                硬件投入
              </h3>
            </div>
            
            {/* 表头 */}
            <div className="flex items-center gap-2 py-1.5 px-3 border-b border-gray-200 bg-gray-50 min-w-0 print:border-2 print:border-green-300 print:bg-green-50">
              <div className="text-xs font-medium text-gray-600 w-16 flex-shrink-0">硬件</div>
              <div className="text-xs font-medium text-gray-600 w-20 flex-shrink-0">标准规格</div>
              <div className="text-xs font-medium text-gray-600 w-20 flex-shrink-0 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>云厂商成本</span>
                  <a 
                    href="https://www.aliyun.com/product/list" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-500 hover:text-blue-700 transition-colors print:hidden"
                    title="访问阿里云"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-600 w-14 flex-shrink-0 text-center">需要</div>
              <div className="text-xs font-medium text-gray-600 flex-1 min-w-0 overflow-hidden">备注</div>
            </div>
            
            {/* 数据行 */}
            <div className="space-y-0 print:border-2 print:border-t-0 print:border-green-300">
              {config.hardwareConfig?.items.map((item, index) => {
                const isEditingUnitPrice = editingHardwareUnitPrice === item.id;
                const isEditingRemark = editingHardwareRemark === item.id;
                
                return (
                  <div 
                    key={item.id} 
                    className={`group flex items-center gap-2 py-1.5 px-3 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 min-w-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    {/* 硬件名称（带图标） */}
                    <div className="flex items-center gap-1 w-16 flex-shrink-0 min-w-0 overflow-hidden">
                      {getHardwareIcon(item.type)}
                      <span className="text-xs text-gray-700 truncate flex-1 min-w-0">{item.type}</span>
                    </div>
                    
                    {/* 标准规格（所有硬件类型可编辑） */}
                    <div className="w-20 flex items-center justify-between gap-0.5 flex-shrink-0 min-w-0">
                      {editingHardwareSpec === item.id ? (
                        <Select
                          value={item.spec || (item.type === '服务器' ? '4C8G' : item.type === '存储' ? '40GB' : item.type === '带宽' ? '1Mbps' : item.type === '域名' ? '国内备案' : '100GB')}
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
                                ? { ...i, spec: value as any, unitPrice, price: unitPrice * quantity }
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
                          <SelectTrigger className="h-6 w-full text-xs px-2 py-0 min-h-6 max-h-6">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="w-auto min-w-fit">
                            {item.type === '服务器' && (
                              <>
                                <SelectItem value="2C4G" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <Server className="h-3 w-3 text-blue-500" />
                                  <span>2C4G</span>
                                </SelectItem>
                                <SelectItem value="4C8G" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <Server className="h-3 w-3 text-blue-500" />
                                  <span>4C8G</span>
                                </SelectItem>
                                <SelectItem value="8C16G" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <Server className="h-3 w-3 text-blue-500" />
                                  <span>8C16G</span>
                                </SelectItem>
                                <SelectItem value="16C32G" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <Server className="h-3 w-3 text-blue-500" />
                                  <span>16C32G</span>
                                </SelectItem>
                                <SelectItem value="24C48G" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <Server className="h-3 w-3 text-blue-500" />
                                  <span>24C48G</span>
                                </SelectItem>
                                <SelectItem value="32C64G" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <Server className="h-3 w-3 text-blue-500" />
                                  <span>32C64G</span>
                                </SelectItem>
                              </>
                            )}
                            {item.type === '存储' && (
                              <>
                                <SelectItem value="40GB" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <HardDrive className="h-3 w-3 text-orange-500" />
                                  <span>40GB</span>
                                </SelectItem>
                                <SelectItem value="100GB" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <HardDrive className="h-3 w-3 text-orange-500" />
                                  <span>100GB</span>
                                </SelectItem>
                                <SelectItem value="500GB" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <HardDrive className="h-3 w-3 text-orange-500" />
                                  <span>500GB</span>
                                </SelectItem>
                                <SelectItem value="1T" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <HardDrive className="h-3 w-3 text-orange-500" />
                                  <span>1T</span>
                                </SelectItem>
                                <SelectItem value="按需" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <HardDrive className="h-3 w-3 text-orange-500" />
                                  <span>按需</span>
                                </SelectItem>
                              </>
                            )}
                            {item.type === '带宽' && (
                              <>
                                <SelectItem value="1Mbps" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <Network className="h-3 w-3 text-green-500" />
                                  <span>1Mbps</span>
                                </SelectItem>
                                <SelectItem value="2Mbps" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <Network className="h-3 w-3 text-green-500" />
                                  <span>2Mbps</span>
                                </SelectItem>
                                <SelectItem value="3Mbps" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <Network className="h-3 w-3 text-green-500" />
                                  <span>3Mbps</span>
                                </SelectItem>
                                <SelectItem value="5Mbps" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <Network className="h-3 w-3 text-green-500" />
                                  <span>5Mbps</span>
                                </SelectItem>
                              </>
                            )}
                            {item.type === '域名' && (
                              <>
                                <SelectItem value="国内备案" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <FileText className="h-3 w-3 text-indigo-500" />
                                  <span>国内备案</span>
                                </SelectItem>
                                <SelectItem value="免备案" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  <FileText className="h-3 w-3 text-indigo-500" />
                                  <span>免备案</span>
                                </SelectItem>
                              </>
                            )}
                            {(item.type === '流媒体' || item.type === '直播' || item.type === 'CDN') && (
                              <>
                                <SelectItem value="100GB" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  {item.type === '流媒体' && <Video className="h-3 w-3 text-pink-500" />}
                                  {item.type === '直播' && <Radio className="h-3 w-3 text-red-500" />}
                                  {item.type === 'CDN' && <Globe className="h-3 w-3 text-cyan-500" />}
                                  <span>100GB</span>
                                </SelectItem>
                                <SelectItem value="300GB" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  {item.type === '流媒体' && <Video className="h-3 w-3 text-pink-500" />}
                                  {item.type === '直播' && <Radio className="h-3 w-3 text-red-500" />}
                                  {item.type === 'CDN' && <Globe className="h-3 w-3 text-cyan-500" />}
                                  <span>300GB</span>
                                </SelectItem>
                                <SelectItem value="500GB" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  {item.type === '流媒体' && <Video className="h-3 w-3 text-pink-500" />}
                                  {item.type === '直播' && <Radio className="h-3 w-3 text-red-500" />}
                                  {item.type === 'CDN' && <Globe className="h-3 w-3 text-cyan-500" />}
                                  <span>500GB</span>
                                </SelectItem>
                                <SelectItem value="1T" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  {item.type === '流媒体' && <Video className="h-3 w-3 text-pink-500" />}
                                  {item.type === '直播' && <Radio className="h-3 w-3 text-red-500" />}
                                  {item.type === 'CDN' && <Globe className="h-3 w-3 text-cyan-500" />}
                                  <span>1T</span>
                                </SelectItem>
                                <SelectItem value="∞" className="text-xs h-6 py-0.5 pl-3 pr-8">
                                  {item.type === '流媒体' && <Video className="h-3 w-3 text-pink-500" />}
                                  {item.type === '直播' && <Radio className="h-3 w-3 text-red-500" />}
                                  {item.type === 'CDN' && <Globe className="h-3 w-3 text-cyan-500" />}
                                  <span>∞</span>
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center justify-between w-full gap-0.5">
                          <span className="text-xs text-gray-700 truncate flex-1 min-w-0">
                            {item.spec || (item.type === '服务器' ? '4C8G' : item.type === '存储' ? '40GB' : item.type === '带宽' ? '1Mbps' : item.type === '域名' ? '国内备案' : '100GB')}
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
                    
                    {/* 云厂商成本（元/年） */}
                    <div className="w-20 flex items-center justify-end gap-0.5 flex-shrink-0 min-w-0">
                      {isEditingUnitPrice ? (
                        <div className="flex items-center gap-0.5">
                          <Input
                            type="number"
                            value={editHardwareUnitPrice}
                            onChange={(e) => setEditHardwareUnitPrice(e.target.value)}
                            className="h-6 w-12 text-xs text-right px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !isImeComposing(e)) saveEditHardwareUnitPrice(item.id);
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
                          <span className="text-xs text-gray-400 truncate">
                            {Math.round(item.unitPrice / 12).toLocaleString()}<span className="text-[10px] text-gray-400">/月</span>
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
                    <div className="w-14 flex items-center justify-center flex-shrink-0">
                      {item.type === '服务器' ? (
                        // 服务器显示数量输入
                        editingHardwareQuantity === item.id ? (
                          <div className="flex items-center gap-0.5 justify-center">
                            <Input
                              type="number"
                              value={editHardwareQuantity}
                              onChange={(e) => setEditHardwareQuantity(e.target.value)}
                              className="h-6 w-10 text-xs text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              autoFocus
                              min="0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isImeComposing(e)) saveEditHardwareQuantity(item.id);
                                if (e.key === 'Escape') setEditingHardwareQuantity(null);
                              }}
                            />
                            <button
                              onClick={() => saveEditHardwareQuantity(item.id)}
                              className="p-0.5 hover:bg-green-100 rounded flex-shrink-0"
                              title="保存"
                            >
                              <Check className="h-2.5 w-2.5 text-green-600" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 justify-center">
                            <span className="text-xs text-gray-700 font-medium">
                              {item.quantity}<span className="text-[10px] text-gray-500 ml-0.5">台</span>
                            </span>
                            <button
                              onClick={() => startEditHardwareQuantity(item.id, item.quantity)}
                              className="p-0.5 hover:bg-green-100 rounded transition-colors flex-shrink-0"
                              title="编辑数量"
                            >
                              <Pencil className="h-2.5 w-2.5 text-gray-400" />
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
                          className="h-3.5 w-3.5"
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
                            className="h-6 flex-1 min-w-0 text-xs px-2"
                            placeholder="备注"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !isImeComposing(e)) saveEditHardwareRemark(item.id);
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
                            className="text-xs text-gray-600 flex-1 min-w-0 truncate overflow-hidden"
                            title={item.remark || "点击添加备注"}
                          >
                            {item.remark || ''}
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

          {/* 整体系数 */}
          <div className="bg-white mt-0 print:break-inside-avoid print:mb-0 print:mt-0">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-3 py-2 border-b border-purple-100 print:bg-purple-100 print:border-2 print:border-purple-400">
              <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-0.5 h-4 bg-purple-500 rounded-full"></span>
                整体系数
              </h3>
            </div>

            <div className="p-3 space-y-3 print:border-2 print:border-t-0 print:border-purple-300">
              {/* 用户规模 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <UsersRound className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-gray-700">用户规模</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['10w+', '100w+', '1000w+', '1ww+'] as UserScale[]).map((scale, index) => (
                    <button
                      key={scale}
                      onClick={() => {
                        if (config.impactFactorConfig) {
                          onConfigChange({
                            ...config,
                            impactFactorConfig: {
                              ...config.impactFactorConfig,
                              userScale: scale
                            }
                          });
                        }
                      }}
                      className={`px-2 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-1 ${
                        getLevelColor(index, config.impactFactorConfig?.userScale === scale)
                      }`}
                    >
                      {getUserScaleIcon(scale)}
                      {scale}
                    </button>
                  ))}
                </div>
              </div>

              {/* 服务等级 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs font-medium text-gray-700">服务等级</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['标准', '及时响应', '工作日坐席', '7*24'] as ServiceLevel[]).map((level, index) => (
                    <button
                      key={level}
                      onClick={() => {
                        if (config.impactFactorConfig) {
                          onConfigChange({
                            ...config,
                            impactFactorConfig: {
                              ...config.impactFactorConfig,
                              serviceLevel: level
                            }
                          });
                        }
                      }}
                      className={`px-2 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-1 ${
                        getLevelColor(index, config.impactFactorConfig?.serviceLevel === level)
                      }`}
                    >
                      {getServiceLevelIcon(level)}
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* 质量等级 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-gray-700">质量等级</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['标准', '高', '很高', '极高'] as QualityLevel[]).map((level, index) => (
                    <button
                      key={level}
                      onClick={() => {
                        if (config.impactFactorConfig) {
                          onConfigChange({
                            ...config,
                            impactFactorConfig: {
                              ...config.impactFactorConfig,
                              qualityLevel: level
                            }
                          });
                        }
                      }}
                      className={`px-2 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-1 ${
                        getLevelColor(index, config.impactFactorConfig?.qualityLevel === level)
                      }`}
                    >
                      {getQualityLevelIcon(level)}
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* 安全等级 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs font-medium text-gray-700">安全等级</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['标准', '权限控制', '金融支付', '安全盾'] as SecurityLevel[]).map((level, index) => (
                    <button
                      key={level}
                      onClick={() => {
                        if (config.impactFactorConfig) {
                          onConfigChange({
                            ...config,
                            impactFactorConfig: {
                              ...config.impactFactorConfig,
                              securityLevel: level
                            }
                          });
                        }
                      }}
                      className={`px-2 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-1 ${
                        getLevelColor(index, config.impactFactorConfig?.securityLevel === level)
                      }`}
                    >
                      {getSecurityLevelIcon(level)}
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* 灾备等级 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-xs font-medium text-gray-700">灾备等级</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['标准', '定时备份', 'T1可恢复', 'H1可恢复'] as DisasterRecoveryLevel[]).map((level, index) => (
                    <button
                      key={level}
                      onClick={() => {
                        if (config.impactFactorConfig) {
                          onConfigChange({
                            ...config,
                            impactFactorConfig: {
                              ...config.impactFactorConfig,
                              disasterRecoveryLevel: level
                            }
                          });
                        }
                      }}
                      className={`px-2 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-1 ${
                        getLevelColor(index, config.impactFactorConfig?.disasterRecoveryLevel === level)
                      }`}
                    >
                      {getDisasterRecoveryIcon(level)}
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* 灵活等级 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-cyan-500" />
                  <span className="text-xs font-medium text-gray-700">灵活等级</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['标准', '多系统', '微服务', '组件化'] as FlexibilityLevel[]).map((level, index) => (
                    <button
                      key={level}
                      onClick={() => {
                        if (config.impactFactorConfig) {
                          onConfigChange({
                            ...config,
                            impactFactorConfig: {
                              ...config.impactFactorConfig,
                              flexibilityLevel: level
                            }
                          });
                        }
                      }}
                      className={`px-2 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-1 ${
                        getLevelColor(index, config.impactFactorConfig?.flexibilityLevel === level)
                      }`}
                    >
                      {getFlexibilityLevelIcon(level)}
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </ScrollArea>
      </div>

      {/* 打印时使用独立布局，不使用ScrollArea */}
      <div className="hidden print:block overflow-visible print:pb-8">
        {/* 人力投入 */}
        <div className="bg-white break-inside-avoid mb-6">
          <div className="bg-blue-100 px-3 py-2 border-2 border-blue-400">
            <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-0.5 h-4 bg-blue-500 rounded-full"></span>
              人力投入
            </h3>
          </div>
          
          {/* 表头 */}
          <div className="flex items-center gap-2 py-1.5 px-3 border-2 border-t-0 border-blue-300 bg-blue-50">
            <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
              <span className="text-xs font-medium text-gray-600 truncate">人力岗位</span>
            </div>
            <div className="text-xs font-medium text-gray-600 w-20 text-center flex-shrink-0">人力水平</div>
            <div className="text-xs font-medium text-gray-600 w-12 text-right flex-shrink-0">人力</div>
            <div className="text-xs font-medium text-gray-600 w-16 text-right flex-shrink-0">人数</div>
            <div className="text-xs font-medium text-gray-600 w-12 text-right flex-shrink-0">工期</div>
            <div className="text-xs font-medium text-gray-600 w-16 text-right flex-shrink-0">标准月薪</div>
          </div>
          
          {/* 人力岗位列表 */}
          <div className="border-2 border-t-0 border-blue-300">
            {estimate.teamWorkloads.map((workload, index) => {
              const marketSalary = getMarketSalary(workload.role);
              const roleCount = getRoleCount(workload.role);
              const actualWorkDays = workload.workDays / roleCount;
              
              return (
                <div 
                  key={workload.role} 
                  className={`flex items-center gap-2 py-1.5 px-3 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  {/* 人力岗位名称 */}
                  <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-hidden">
                    {getRoleIcon(workload.role as TeamRole)}
                    <span className="text-xs text-gray-700 truncate">{workload.role}</span>
                  </div>
                  
                  {/* 人力水平 */}
                  <div className="w-20 flex items-center justify-center flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {getExperienceIcon(getRoleExperience(workload.role))}
                      <span className="text-[10px] text-gray-700">
                        {getExperienceShortText(getRoleExperience(workload.role))}
                      </span>
                    </div>
                  </div>
                  
                  {/* 总人力 */}
                  <div className="text-xs text-gray-600 w-12 text-right flex-shrink-0">
                    {workload.workDays.toFixed(1)}
                    <span className="text-[10px] text-gray-500 ml-0.5">天</span>
                  </div>
                  
                  {/* 人力岗位人数 */}
                  <div className="w-16 flex items-center justify-end gap-0.5 flex-shrink-0">
                    <span className="text-[11px] text-blue-600 font-medium">
                      {roleCount}<span className="text-[10px] text-gray-500 ml-0.5">人</span>
                    </span>
                  </div>
                  
                  {/* 实际工期 */}
                  <div className="text-xs text-purple-600 font-medium w-12 text-right flex-shrink-0">
                    {actualWorkDays.toFixed(1)}
                    <span className="text-[10px] text-gray-500 ml-0.5">天</span>
                  </div>
                  
                  {/* 标准月薪 */}
                  <div className="w-16 flex items-center justify-end gap-0.5 flex-shrink-0">
                    <span className="text-[11px] text-orange-600 font-semibold text-right">
                      {(marketSalary / 10).toFixed(1)}<span className="text-[10px] text-gray-500 ml-0.5">万</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 硬件投入 */}
        <div className="bg-white break-inside-avoid mb-6">
          <div className="bg-green-100 px-3 py-2 border-2 border-green-400">
            <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-0.5 h-4 bg-green-500 rounded-full"></span>
              硬件投入
            </h3>
          </div>
          
          {/* 表头 */}
          <div className="flex items-center gap-2 py-1.5 px-3 border-2 border-t-0 border-green-300 bg-green-50">
            <div className="text-xs font-medium text-gray-600 w-16 flex-shrink-0">硬件</div>
            <div className="text-xs font-medium text-gray-600 w-20 flex-shrink-0">标准规格</div>
            <div className="text-xs font-medium text-gray-600 w-20 flex-shrink-0 text-right">云厂商成本</div>
            <div className="text-xs font-medium text-gray-600 w-14 flex-shrink-0 text-center">需要</div>
            <div className="text-xs font-medium text-gray-600 flex-1 min-w-0 overflow-hidden">备注</div>
          </div>
          
          {/* 数据行 */}
          <div className="border-2 border-t-0 border-green-300">
            {config.hardwareConfig?.items.map((item, index) => (
              <div 
                key={item.id} 
                className={`flex items-center gap-2 py-1.5 px-3 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                {/* 硬件名称 */}
                <div className="flex items-center gap-1 w-16 flex-shrink-0">
                  {getHardwareIcon(item.type)}
                  <span className="text-xs text-gray-700 truncate">{item.type}</span>
                </div>
                
                {/* 标准规格 */}
                <div className="w-20 flex-shrink-0">
                  <span className="text-xs text-gray-700">
                    {item.spec || (item.type === '服务器' ? '4C8G' : item.type === '存储' ? '40GB' : item.type === '带宽' ? '1Mbps' : item.type === '域名' ? '国内备案' : '100GB')}
                  </span>
                </div>
                
                {/* 云厂商成本 */}
                <div className="w-20 flex items-center justify-end flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {Math.round(item.unitPrice / 12).toLocaleString()}<span className="text-[10px]">/月</span>
                  </span>
                </div>
                
                {/* 需要/数量 */}
                <div className="w-14 flex items-center justify-center flex-shrink-0">
                  {item.type === '服务器' ? (
                    <span className="text-xs text-gray-700 font-medium">
                      {item.quantity}<span className="text-[10px] text-gray-500 ml-0.5">台</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-700">{item.quantity > 0 ? '✓' : '—'}</span>
                  )}
                </div>
                
                {/* 备注 */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-600 truncate">{item.remark || ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 整体系数 */}
        <div className="bg-white break-inside-avoid mb-6">
          <div className="bg-purple-100 px-3 py-2 border-2 border-purple-400">
            <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-0.5 h-4 bg-purple-500 rounded-full"></span>
              整体系数
            </h3>
          </div>

          <div className="p-3 space-y-3 border-2 border-t-0 border-purple-300">
            {/* 用户规模 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <UsersRound className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-medium text-gray-700">用户规模</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['10w+', '100w+', '1000w+', '1ww+'] as UserScale[]).map((scale, index) => (
                  <div
                    key={scale}
                    className={`px-2 py-1.5 text-xs rounded flex items-center justify-center gap-1 ${
                      getLevelColor(index, config.impactFactorConfig?.userScale === scale)
                    }`}
                  >
                    {getUserScaleIcon(scale)}
                    {scale}
                  </div>
                ))}
              </div>
            </div>

            {/* 服务等级 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-medium text-gray-700">服务等级</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['标准', '及时响应', '工作日坐席', '7*24'] as ServiceLevel[]).map((level, index) => (
                  <div
                    key={level}
                    className={`px-2 py-1.5 text-xs rounded flex items-center justify-center gap-1 ${
                      getLevelColor(index, config.impactFactorConfig?.serviceLevel === level)
                    }`}
                  >
                    {getServiceLevelIcon(level)}
                    {level}
                  </div>
                ))}
              </div>
            </div>

            {/* 质量等级 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-medium text-gray-700">质量等级</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['标准', '高', '很高', '极高'] as QualityLevel[]).map((level, index) => (
                  <div
                    key={level}
                    className={`px-2 py-1.5 text-xs rounded flex items-center justify-center gap-1 ${
                      getLevelColor(index, config.impactFactorConfig?.qualityLevel === level)
                    }`}
                  >
                    {getQualityLevelIcon(level)}
                    {level}
                  </div>
                ))}
              </div>
            </div>

            {/* 安全等级 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-medium text-gray-700">安全等级</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['标准', '权限控制', '金融支付', '安全盾'] as SecurityLevel[]).map((level, index) => (
                  <div
                    key={level}
                    className={`px-2 py-1.5 text-xs rounded flex items-center justify-center gap-1 ${
                      getLevelColor(index, config.impactFactorConfig?.securityLevel === level)
                    }`}
                  >
                    {getSecurityLevelIcon(level)}
                    {level}
                  </div>
                ))}
              </div>
            </div>

            {/* 灾备等级 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-xs font-medium text-gray-700">灾备等级</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['标准', '定时备份', 'T1可恢复', 'H1可恢复'] as DisasterRecoveryLevel[]).map((level, index) => (
                  <div
                    key={level}
                    className={`px-2 py-1.5 text-xs rounded flex items-center justify-center gap-1 ${
                      getLevelColor(index, config.impactFactorConfig?.disasterRecoveryLevel === level)
                    }`}
                  >
                    {getDisasterRecoveryIcon(level)}
                    {level}
                  </div>
                ))}
              </div>
            </div>

            {/* 灵活等级 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-cyan-500" />
                <span className="text-xs font-medium text-gray-700">灵活等级</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['标准', '多系统', '微服务', '组件化'] as FlexibilityLevel[]).map((level, index) => (
                  <div
                    key={level}
                    className={`px-2 py-1.5 text-xs rounded flex items-center justify-center gap-1 ${
                      getLevelColor(index, config.impactFactorConfig?.flexibilityLevel === level)
                    }`}
                  >
                    {getFlexibilityLevelIcon(level)}
                    {level}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
