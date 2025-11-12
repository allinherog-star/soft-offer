'use client';

import { ProjectInfo, Platform } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PLATFORM_OPTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';

interface HeaderProps {
  projectInfo: ProjectInfo;
  onProjectInfoChange: (info: ProjectInfo) => void;
  onOpenCostSettings: () => void;
}

export function Header({ projectInfo, onProjectInfoChange, onOpenCostSettings }: HeaderProps) {
  const handlePlatformToggle = (platform: Platform) => {
    const newPlatforms = projectInfo.platforms.includes(platform)
      ? projectInfo.platforms.filter(p => p !== platform)
      : [...projectInfo.platforms, platform];
    
    onProjectInfoChange({ ...projectInfo, platforms: newPlatforms });
  };

  return (
    <div className="border-b bg-white px-2 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <Calculator className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-gray-900">软件成本测算系统</h1>
              <p className="text-[10px] text-gray-400">科学评估 · 精准测算 · 高效决策</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="project-name" className="text-sm whitespace-nowrap">项目名称</Label>
              <Input
                id="project-name"
                value={projectInfo.name}
                onChange={(e) => onProjectInfoChange({ ...projectInfo, name: e.target.value })}
                className="h-8 w-40"
                placeholder="请输入项目名称"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="industry" className="text-sm whitespace-nowrap">行业应用</Label>
              <Input
                id="industry"
                value={projectInfo.industry}
                onChange={(e) => onProjectInfoChange({ ...projectInfo, industry: e.target.value })}
                className="h-8 w-40"
                placeholder="请输入行业"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">用户端</Label>
              <div className="flex items-center gap-3">
                {PLATFORM_OPTIONS.map((platform) => (
                  <div key={platform} className="flex items-center gap-1">
                    <Checkbox
                      id={platform}
                      checked={projectInfo.platforms.includes(platform)}
                      onCheckedChange={() => handlePlatformToggle(platform)}
                    />
                    <label
                      htmlFor={platform}
                      className="text-sm cursor-pointer select-none"
                    >
                      {platform}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Button onClick={onOpenCostSettings} variant="outline" size="sm">
          单位成本
        </Button>
      </div>
    </div>
  );
}


