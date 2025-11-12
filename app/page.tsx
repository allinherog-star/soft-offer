'use client';

import { useState, useEffect } from 'react';
import { ProjectInfo, FunctionNode, GlobalConfig, EstimateResult } from '@/types';
import { Header } from '@/components/header';
import { FunctionTree } from '@/components/function-tree';
import { FunctionTable } from '@/components/function-table';
import { EstimatePanel } from '@/components/estimate-panel';
import { CostSettingsSheet } from '@/components/cost-settings-sheet';
import { calculateEstimate } from '@/lib/calculation';
import { DEFAULT_CONFIG } from '@/lib/constants';

export default function Home() {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: '',
    industry: '',
    platforms: []
  });

  const [functionNodes, setFunctionNodes] = useState<FunctionNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<FunctionNode | null>(null);
  const [config, setConfig] = useState<GlobalConfig>(DEFAULT_CONFIG);
  const [discount, setDiscount] = useState<number>(1);
  const [estimate, setEstimate] = useState<EstimateResult>({
    totalDays: 0,
    teamWorkloads: [],
    baseCost: 0,
    impactFactors: [],
    discount: 1,
    finalPrice: 0
  });
  const [costSettingsOpen, setCostSettingsOpen] = useState(false);

  // 自动计算估价
  useEffect(() => {
    const newEstimate = calculateEstimate(
      functionNodes,
      projectInfo.platforms,
      config,
      discount
    );
    setEstimate(newEstimate);
  }, [functionNodes, projectInfo.platforms, config, discount]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <Header
        projectInfo={projectInfo}
        onProjectInfoChange={setProjectInfo}
        onOpenCostSettings={() => setCostSettingsOpen(true)}
      />

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧功能树 */}
        <div className="w-[300px] flex-shrink-0">
          <FunctionTree
            nodes={functionNodes}
            selectedNode={selectedNode}
            onNodesChange={setFunctionNodes}
            onSelectNode={setSelectedNode}
          />
        </div>

        {/* 中间表格 */}
        <div className="flex-1 min-w-0">
          <FunctionTable
            nodes={functionNodes}
            selectedNode={selectedNode}
            onNodesChange={setFunctionNodes}
          />
        </div>

        {/* 右侧估价面板 */}
        <div className="w-[350px] flex-shrink-0">
          <EstimatePanel
            estimate={estimate}
            config={config}
            discount={discount}
            onDiscountChange={setDiscount}
            onConfigChange={setConfig}
          />
        </div>
      </div>

      {/* 单位成本设置侧拉面板 */}
      <CostSettingsSheet
        open={costSettingsOpen}
        onOpenChange={setCostSettingsOpen}
        config={config}
        onConfigChange={setConfig}
      />
    </div>
  );
}
