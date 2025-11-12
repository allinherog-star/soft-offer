'use client';

import { useState } from 'react';
import { ProjectInfo, Platform } from '@/types';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PLATFORM_OPTIONS, INDUSTRY_OPTIONS } from '@/lib/constants';
import { 
  Calculator, Edit2, Check, ChevronsUpDown, Building2,
  Globe, BadgeDollarSign, ShoppingCart, GraduationCap, Heart,
  Factory, Store, Truck, Home, Zap, Landmark, Radio, Tv,
  Plane, UtensilsCrossed, Briefcase, Gamepad2, Users, Car,
  Sprout, MoreHorizontal, LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 图标映射
const iconMap: Record<string, LucideIcon> = {
  'Globe': Globe,
  'BadgeDollarSign': BadgeDollarSign,
  'ShoppingCart': ShoppingCart,
  'GraduationCap': GraduationCap,
  'Heart': Heart,
  'Factory': Factory,
  'Store': Store,
  'Truck': Truck,
  'Home': Home,
  'Zap': Zap,
  'Landmark': Landmark,
  'Radio': Radio,
  'Tv': Tv,
  'Plane': Plane,
  'UtensilsCrossed': UtensilsCrossed,
  'Briefcase': Briefcase,
  'Gamepad2': Gamepad2,
  'Users': Users,
  'Car': Car,
  'Sprout': Sprout,
  'MoreHorizontal': MoreHorizontal,
};

interface HeaderProps {
  projectInfo: ProjectInfo;
  onProjectInfoChange: (info: ProjectInfo) => void;
  onOpenCostSettings: () => void;
}

export function Header({ projectInfo, onProjectInfoChange, onOpenCostSettings }: HeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);

  const handlePlatformToggle = (platform: Platform) => {
    const newPlatforms = projectInfo.platforms.includes(platform)
      ? projectInfo.platforms.filter(p => p !== platform)
      : [...projectInfo.platforms, platform];
    
    onProjectInfoChange({ ...projectInfo, platforms: newPlatforms });
  };

  return (
    <div className="border-b bg-white px-2 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Logo和系统名称 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <Calculator className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-gray-900">软件成本测算系统</h1>
              <p className="text-[10px] text-gray-400">科学评估 · 精准测算 · 高效决策</p>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="h-8 w-px bg-gray-200"></div>
          
          <div className="flex items-center gap-3">
            {/* 项目名称、行业、描述 - 上下两行布局 */}
            <div className="flex flex-col gap-0.5">
              {/* 第一行：项目名称 + 行业选择 */}
              <div className="flex items-center gap-2">
                {/* 项目名称 - 固定宽度容器 */}
                <div className="w-[160px]">
                  {isEditingName ? (
                    <Input
                      value={projectInfo.name}
                      onChange={(e) => onProjectInfoChange({ ...projectInfo, name: e.target.value })}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingName(false);
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                      className="h-6 w-full text-sm"
                      placeholder="项目名称"
                      autoFocus
                    />
                  ) : (
                    <div 
                      onClick={() => setIsEditingName(true)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-100 cursor-pointer group h-6"
                    >
                      <span className="text-sm font-medium text-gray-900 truncate flex-1">
                        {projectInfo.name || '项目名称'}
                      </span>
                      <Edit2 className="h-3 w-3 text-gray-300 group-hover:text-gray-500 shrink-0" />
                    </div>
                  )}
                </div>

                {/* 行业应用 - 可搜索下拉 */}
                <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={industryOpen}
                      className="h-6 w-32 justify-between text-xs font-normal"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {projectInfo.industry ? (
                          (() => {
                            const selectedIndustry = INDUSTRY_OPTIONS.find(opt => opt.label === projectInfo.industry);
                            const IconComponent = selectedIndustry ? iconMap[selectedIndustry.icon] : Building2;
                            return <IconComponent className="h-3 w-3 text-gray-500 shrink-0" />;
                          })()
                        ) : (
                          <Building2 className="h-3 w-3 text-gray-500 shrink-0" />
                        )}
                        <span className="truncate">
                          {projectInfo.industry || "行业应用"}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="搜索行业..." className="h-7 text-xs" />
                      <CommandList>
                        <CommandEmpty>未找到行业</CommandEmpty>
                        <CommandGroup>
                          {INDUSTRY_OPTIONS.map((industry) => {
                            const IconComponent = iconMap[industry.icon];
                            return (
                              <CommandItem
                                key={industry.label}
                                value={industry.label}
                                onSelect={(currentValue) => {
                                  onProjectInfoChange({ 
                                    ...projectInfo, 
                                    industry: currentValue === projectInfo.industry ? "" : currentValue 
                                  });
                                  setIndustryOpen(false);
                                }}
                                className="text-xs"
                              >
                                <IconComponent className="mr-2 h-3.5 w-3.5 text-gray-600" />
                                {industry.label}
                                <Check
                                  className={cn(
                                    "ml-auto h-3 w-3",
                                    projectInfo.industry === industry.label ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* 第二行：项目描述（宽度与上面对齐：160px + 8px + 128px = 296px）*/}
              <div className="w-[296px]">
                {isEditingDescription ? (
                  <Input
                    value={projectInfo.description || ''}
                    onChange={(e) => onProjectInfoChange({ ...projectInfo, description: e.target.value })}
                    onBlur={() => setIsEditingDescription(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingDescription(false);
                      if (e.key === 'Escape') setIsEditingDescription(false);
                    }}
                    className="h-5 w-full text-xs"
                    placeholder="项目描述"
                    autoFocus
                  />
                ) : (
                  <div 
                    onClick={() => setIsEditingDescription(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-100 cursor-pointer group h-5"
                  >
                    <span className="text-xs text-gray-500 truncate flex-1">
                      {projectInfo.description || '项目描述'}
                    </span>
                    <Edit2 className="h-2.5 w-2.5 text-gray-300 group-hover:text-gray-500 shrink-0" />
                  </div>
                )}
              </div>
            </div>

            {/* 用户端 - 整体包裹 */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md">
              {PLATFORM_OPTIONS.map((platform) => (
                <div key={platform} className="flex items-center gap-1">
                  <Checkbox
                    id={platform}
                    checked={projectInfo.platforms.includes(platform)}
                    onCheckedChange={() => handlePlatformToggle(platform)}
                  />
                  <label
                    htmlFor={platform}
                    className="text-xs cursor-pointer select-none text-gray-700"
                  >
                    {platform}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={onOpenCostSettings} variant="outline" size="sm">
          单位人力成本核算
        </Button>
      </div>
    </div>
  );
}


