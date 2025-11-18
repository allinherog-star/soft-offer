'use client';

import { useState } from 'react';
import { GlobalConfig, TeamRole, WorkExperience } from '@/types';
import { DEFAULT_ROLE_COSTS, calculateRecommendedSalary } from '@/lib/constants';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Check, X, User, Users, Laptop, Palette, Code, Smartphone, TabletSmartphone, Award, Medal, Trophy, Star, CircleDollarSign, CircleDot, Circle, TrendingUp as TrendingUpIcon, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';

interface CostSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: GlobalConfig;
  onConfigChange: (config: GlobalConfig) => void;
}

export function CostSettingsSheet({ open, onOpenChange, config, onConfigChange }: CostSettingsSheetProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempRoleCost, setTempRoleCost] = useState<any>(null);
  const [editingDuration, setEditingDuration] = useState<string | null>(null); // 正在编辑的复杂度
  const [editingRatio, setEditingRatio] = useState<string | null>(null); // 正在编辑的岗位
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // 复制查询文本到剪贴板并打开 DeepSeek
  const handleQuerySalary = async () => {
    const queryText = `请帮我整理一下下列岗位在不同工作经验级别下的市场参考标准月薪（单位：万元），并整理成表格形式：

岗位列表：
1. 产品经理
2. 项目经理
3. 架构师
4. 美工师
5. 后端开发工程师
6. 前端开发工程师
7. IOS开发工程师
8. Android开发工程师
9. 小程序开发工程师

工作经验级别：
- 一线大厂（10年）
- 二线中厂（6年）
- 三线小厂（4年）
- 新手上路（2年）`;

    try {
      await navigator.clipboard.writeText(queryText);
      
      // 显示成功toast
      setToastMessage('问题已复制到剪贴板，3秒后将自动打开 DeepSeek，请粘贴查询');
      setToastType('success');
      setShowToast(true);
      
      // 延迟3秒跳转，让用户看完toast提示
      setTimeout(() => {
        window.open('https://chat.deepseek.com', '_blank');
      }, 3000);
    } catch (err) {
      console.error('复制失败:', err);
      setToastMessage('复制失败，请手动复制问题内容');
      setToastType('error');
      setShowToast(true);
    }
  };
  
  const handleRoleSelect = (index: number, role: TeamRole) => {
    const defaultRole = DEFAULT_ROLE_COSTS.find(rc => rc.role === role);
    if (defaultRole) {
      const newRoleCosts = [...config.roleCosts];
      newRoleCosts[index] = { ...defaultRole };
    onConfigChange({
      ...config,
      roleCosts: newRoleCosts
    });
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setTempRoleCost({ ...config.roleCosts[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setTempRoleCost(null);
  };

  const saveEditing = () => {
    if (editingIndex !== null && tempRoleCost) {
      const newRoleCosts = [...config.roleCosts];
      newRoleCosts[editingIndex] = tempRoleCost;
    onConfigChange({
      ...config,
      roleCosts: newRoleCosts
    });
      setEditingIndex(null);
      setTempRoleCost(null);
    }
  };

  // 根据工作经验获取默认年限
  const getDefaultYears = (experience: WorkExperience): number => {
    switch (experience) {
      case '新手上路': return 2;      // 3年以内，取中间值
      case '三线小厂': return 4;      // 3~5年，取中间值
      case '二线中厂': return 6;      // 5~8年，取中间值
      case '一线大厂': return 10;     // 8年以上
      default: return 3;
    }
  };

  const handleTempChange = (field: string, value: any) => {
    const updated = { ...tempRoleCost, [field]: value };
    
    // 如果修改了经验，自动更新年限
    if (field === 'experience') {
      updated.workYears = getDefaultYears(value as WorkExperience);
    }
    
    // 如果修改了角色或经验，自动更新推荐标准月薪
    if (field === 'role' || field === 'experience') {
      updated.salary = calculateRecommendedSalary(
        updated.role,
        updated.experience,
        updated.workYears
      );
    }
    
    setTempRoleCost(updated);
  };

  const handleWorkDurationChange = (complexity: '低' | '中' | '高' | '很高', value: string) => {
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

  const allRoles: TeamRole[] = [
    '产品经理', '项目经理', '架构师', '美工师',
    '后端开发工程师', '前端开发工程师', 
    'IOS开发工程师', 'Android开发工程师', '小程序开发工程师'
  ];

  const experienceOptions: WorkExperience[] = ['一线大厂', '二线中厂', '三线小厂', '新手上路'];

  // 工作经验图标映射
  const getExperienceIcon = (experience: WorkExperience) => {
    switch (experience) {
      case '一线大厂':
        return <Trophy className="h-3.5 w-3.5 text-amber-500" />;
      case '二线中厂':
        return <Medal className="h-3.5 w-3.5 text-gray-500" />;
      case '三线小厂':
        return <Award className="h-3.5 w-3.5 text-blue-500" />;
      case '新手上路':
        return <Star className="h-3.5 w-3.5 text-green-500" />;
      default:
        return <Award className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  // 角色图标映射
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

  // 根据薪资获取颜色样式（素雅风格）
  const getSalaryColorBySalary = (salary: number) => {
    if (salary > 4) {
      return 'text-orange-600 font-semibold'; // 大于4万突出显示
    }
    return 'text-gray-700'; // 其他统一素雅颜色
  };

  // 功能复杂度图标映射
  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case '低':
        return <CircleDot className="h-3.5 w-3.5 text-green-500" />;
      case '中':
        return <Circle className="h-3.5 w-3.5 text-blue-500" />;
      case '高':
        return <TrendingUpIcon className="h-3.5 w-3.5 text-orange-500" />;
      case '很高':
        return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  return (
    <>
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[700px] sm:w-[800px] sm:max-w-[800px] p-0">
          <SheetTitle className="sr-only">单位成本配置</SheetTitle>
          <ScrollArea className="h-full">
          <div className="space-y-0">
            {/* 人力成本分组 */}
            <div className="border-b bg-white">
              <div className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                  人力成本
                </h2>
              </div>
              <div className="px-3 py-3">
                <div className="border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-2 px-3 font-medium text-gray-700">人员岗位</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">工作经验</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-700">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>市场参考标准月薪</span>
                          <button
                            onClick={handleQuerySalary}
                            className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                            title="在 DeepSeek 中查询市场薪资（自动复制问题）"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRoles.map((role) => {
                      const experiences: { exp: WorkExperience; years: number }[] = [
                        { exp: '一线大厂', years: 10 },
                        { exp: '二线中厂', years: 6 },
                        { exp: '三线小厂', years: 4 },
                        { exp: '新手上路', years: 2 }
                      ];
                      
                      return experiences.map((item, expIndex) => {
                        const recommendedSalary = calculateRecommendedSalary(role, item.exp, item.years);
                        const isFirstRow = expIndex === 0;
                        
                        return (
                          <tr key={`${role}-${item.exp}`} className="border-b last:border-b-0 hover:bg-gray-50">
                            {/* 人员岗位 - 只在第一行显示 */}
                            {isFirstRow && (
                              <td className="py-1.5 px-3 align-top border-r" rowSpan={4}>
                                <span className="text-gray-700 text-sm flex items-center gap-2">
                                  {getRoleIcon(role)}
                                  {role}
                                </span>
                              </td>
                            )}
                            
                            {/* 工作经验 */}
                            <td className="py-1.5 px-3">
                              <span className="text-gray-600 text-sm flex items-center gap-1.5">
                                {getExperienceIcon(item.exp)}
                                <span>
                                  {item.exp}
                                  <span className="text-gray-400 ml-1 text-xs">({item.years}年)</span>
                                </span>
                              </span>
                            </td>
                            
                            {/* 市场参考标准月薪 */}
                            <td className="py-1.5 px-3">
                              <span className={`text-sm flex justify-end ${getSalaryColorBySalary(recommendedSalary)}`}>
                                {(recommendedSalary / 10).toFixed(1)}万
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
                      </div>
                <p className="text-xs text-gray-500 mt-2 px-1">
                  * 展示各岗位不同工作经验对应的市场参考标准月薪（单位：万元）
                </p>
                      </div>
                    </div>

            {/* 工期成本分组 */}
            <div className="bg-white">
              <div className="bg-gradient-to-r from-green-50 to-white border-b border-green-100 px-6 py-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                  工期成本
                </h2>
              </div>
              <div className="px-3 py-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* 左侧：基准工期 */}
                  <div>
                    <div className="mb-2 px-1">
                      <h3 className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                        <span className="w-0.5 h-3 bg-green-500 rounded-full"></span>
                        基准工期
                      </h3>
                    </div>
                    <div className="border rounded-lg overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-center py-2 px-2 font-medium text-gray-700">功能菜单复杂度</th>
                            <th className="text-center py-2 px-2 font-medium text-gray-700">标准工期</th>
                            <th className="text-center py-2 px-2 font-medium text-gray-700 w-[50px]">功能</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(['低', '中', '高', '很高'] as const).map((complexity) => (
                            <tr key={complexity} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="py-2 px-2">
                                <div className="flex items-center justify-center gap-1.5">
                                  {getComplexityIcon(complexity)}
                                  <span className="text-gray-700">{complexity}</span>
                                </div>
                              </td>
                              <td className="py-2 px-2">
                                {editingDuration === complexity ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Input
                                      type="number"
                                      value={config.workDurationConfigs[complexity]}
                                      onChange={(e) => handleWorkDurationChange(complexity, e.target.value)}
                                      className="h-7 w-16 text-center border-gray-300 text-sm"
                                      step="0.5"
                                      min="0.5"
                                      autoFocus
                                    />
                                    <span className="text-gray-500 text-xs">天</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-gray-700 text-sm">{config.workDurationConfigs[complexity]}</span>
                                    <span className="text-gray-500 text-xs">天</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex items-center justify-center">
                                  {editingDuration === complexity ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => setEditingDuration(null)}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                      onClick={() => setEditingDuration(complexity)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 右侧：岗位工期比例 */}
                  <div>
                    <div className="mb-2 px-1">
                      <h3 className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                        <span className="w-0.5 h-3 bg-green-500 rounded-full"></span>
                        岗位工期比例
                      </h3>
                    </div>
                    <div className="border rounded-lg overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left py-2 px-2 font-medium text-gray-700">岗位</th>
                            <th className="text-center py-2 px-2 font-medium text-gray-700">比例</th>
                            <th className="text-center py-2 px-2 font-medium text-gray-700 w-[50px]">功能</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(config.roleRatios).map(([role, ratio]) => (
                            <tr key={role} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="py-1.5 px-2 text-gray-700 text-xs">
                                <span className="flex items-center gap-1.5">
                                  {getRoleIcon(role as TeamRole)}
                                  {role}
                                </span>
                              </td>
                              <td className="py-1.5 px-2">
                                {editingRatio === role ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Input
                                      type="number"
                                      value={ratio}
                                      onChange={(e) => handleRoleRatioChange(role as TeamRole, e.target.value)}
                                      className="h-6 w-16 text-center border-gray-300 text-xs"
                                      step="0.1"
                                      min="0"
                                      max="2"
                                      autoFocus
                                    />
                                    <span className="text-gray-500 text-xs">: 1</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-blue-600 text-xs font-medium">{ratio}</span>
                                    <span className="text-gray-500 text-xs">: 1</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-1.5 px-2">
                                <div className="flex items-center justify-center">
                                  {editingRatio === role ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => setEditingRatio(null)}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                      onClick={() => setEditingRatio(role)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 px-1">
                  * 以后端开发工程师工期为基准，其他岗位根据标准比例换算
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
    </>
  );
}


