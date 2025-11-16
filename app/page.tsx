'use client';

import { useState, useEffect } from 'react';
import { ProjectInfo, FunctionNode, GlobalConfig, EstimateResult } from '@/types';
import { Header } from '@/components/header';
import { FunctionTree } from '@/components/function-tree';
import { FunctionTable } from '@/components/function-table';
import { EstimatePanel } from '@/components/estimate-panel';
import { CostSettingsSheet } from '@/components/cost-settings-sheet';
import { calculateEstimate } from '@/lib/calculation';
import { DEFAULT_CONFIG, DISCOUNT_OPTIONS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, DollarSign, TrendingDown, Sparkles, Tag, Ticket, BadgePercent, Zap, Users2, Wrench, Server } from 'lucide-react';

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
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

  // 历史记录管理
  const [history, setHistory] = useState<FunctionNode[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 计算实际总工期（考虑岗位数量，取30%）
  const calculateActualTotalDays = () => {
    const totalDays = estimate.teamWorkloads.reduce((sum, workload) => {
      const count = roleCounts[workload.role] || 1;
      const actualDays = workload.workDays / count;
      return sum + actualDays;
    }, 0);
    return totalDays * 0.3; // 总工期为工期总和的30%
  };

  // 保存到历史记录
  const saveToHistory = (newNodes: FunctionNode[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newNodes)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setFunctionNodes(newNodes);
  };

  // 撤销
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFunctionNodes(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 前进
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFunctionNodes(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

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
        <div className="w-[300px] flex-shrink-0 h-full overflow-hidden">
          <FunctionTree
            nodes={functionNodes}
            selectedNode={selectedNode}
            onNodesChange={saveToHistory}
            onSelectNode={setSelectedNode}
            onUndo={undo}
            onRedo={redo}
            historyIndex={historyIndex}
            historyLength={history.length}
          />
        </div>

        {/* 中间表格 */}
        <div className="flex-1 min-w-0">
          <FunctionTable
            nodes={functionNodes}
            selectedNode={selectedNode}
            onNodesChange={saveToHistory}
          />
        </div>

          {/* 右侧估价面板 */}
          <div className="w-[500px] flex-shrink-0 h-full overflow-hidden">
            <EstimatePanel
            estimate={estimate}
            config={config}
            discount={discount}
            onDiscountChange={setDiscount}
            onConfigChange={setConfig}
            roleCounts={roleCounts}
            onRoleCountsChange={setRoleCounts}
          />
        </div>
      </div>

      {/* 底部全屏统计栏 */}
      <div className="border-t bg-gradient-to-r from-blue-50 via-white to-blue-50 shadow-lg">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between max-w-full">
            {/* 左侧：项目统计 */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">项目概览</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">需求总数</span>
                <span className="text-sm font-bold text-gray-800">
                  {functionNodes.length}
                </span>
              </div>
              
              <div className="w-px h-6 bg-gray-300"></div>
              
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">团队人数</span>
                <span className="text-sm font-bold text-gray-800">
                  {estimate.teamWorkloads.length}
                </span>
              </div>
            </div>

            {/* 右侧：关键指标 */}
            <div className="flex items-center gap-8">
              {/* 总人力 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users2 className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-h-[60px] flex flex-col justify-start">
                  <div className="text-xs text-gray-500 h-4 leading-4">总人力</div>
                  <div className="text-xl font-bold text-purple-600 mt-1">
                    {estimate.teamWorkloads.reduce((sum, w) => sum + w.workDays, 0).toFixed(1)}
                    <span className="text-sm font-normal ml-0.5">人天</span>
                  </div>
                  <div className="h-[18px]"></div>
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300"></div>

              {/* 总工期 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-h-[60px] flex flex-col justify-start">
                  <div className="text-xs text-gray-500 h-4 leading-4">总工期</div>
                  <div className="text-xl font-bold text-blue-600 mt-1">
                    {calculateActualTotalDays().toFixed(1)}
                    <span className="text-sm font-normal ml-0.5">天</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 h-[18px] leading-[18px]">
                    预计 {(() => {
                      const totalDays = calculateActualTotalDays();
                      const deliveryDate = new Date();
                      deliveryDate.setDate(deliveryDate.getDate() + Math.ceil(totalDays));
                      return deliveryDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
                    })()}
                  </div>
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300"></div>

              {/* 总成本 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-h-[60px] flex flex-col justify-start">
                  <div className="text-xs text-gray-500 h-4">总成本</div>
                  <div className="text-xl font-bold text-green-600 mt-1">
                    {(estimate.baseCost / 10000).toFixed(1)}
                    <span className="text-sm font-normal ml-0.5">万</span>
                  </div>
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300"></div>

              {/* 折扣选择 */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-h-[60px] flex flex-col justify-start">
                  <div className="text-xs text-gray-500 h-4">折扣</div>
                  <div className="mt-1">
                    <Select
                      value={discount.toString()}
                      onValueChange={(value) => setDiscount(parseFloat(value))}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISCOUNT_OPTIONS.map((option) => {
                          // 根据折扣力度显示不同图标和颜色
                          let icon;
                          if (option.value === 1) {
                            icon = <Tag className="h-3.5 w-3.5 text-gray-500" />;
                          } else if (option.value >= 0.95) {
                            icon = <Ticket className="h-3.5 w-3.5 text-blue-500" />;
                          } else if (option.value >= 0.85) {
                            icon = <BadgePercent className="h-3.5 w-3.5 text-green-600" />;
                          } else if (option.value >= 0.8) {
                            icon = <TrendingDown className="h-3.5 w-3.5 text-orange-500" />;
                          } else {
                            icon = <Zap className="h-3.5 w-3.5 text-red-500" />;
                          }
                          
                          return (
                            <SelectItem key={option.value} value={option.value.toString()} className="text-xs">
                              <div className="flex items-center gap-2">
                                {icon}
                                <div className="flex flex-col">
                                  <span>{option.label}</span>
                                  <span className="text-[10px] text-gray-400">{option.description}</span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="w-px h-12 bg-gray-300"></div>

              {/* 折后价 + 运维成本 + 硬件费用 */}
              <div className="flex items-start gap-3 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-2 rounded-lg border-2 border-red-300 min-h-[60px]">
                <div className="flex flex-col justify-start gap-1.5">
                  <div>
                    <div className="text-xs text-gray-600 font-medium h-4">折后价</div>
                    <div className="text-2xl font-bold text-red-600 mt-1">
                      {(estimate.finalPrice / 10000).toFixed(1)}
                      <span className="text-base font-normal ml-1">万</span>
                    </div>
                  </div>
                  <div className="border-t border-red-200 pt-1">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3 w-3 text-gray-500" />
                      <span className="text-[10px] text-gray-600">运维成本</span>
                      <span className="text-xs font-semibold text-red-500">
                        {(estimate.finalPrice * 0.1 / 10000).toFixed(2)}万/月
                      </span>
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <div className="flex items-center gap-2">
                      <Server className="h-3 w-3 text-gray-500" />
                      <span className="text-[10px] text-gray-600">硬件成本</span>
                      <span className="text-xs font-semibold text-red-500">
                        {config.hardwareConfig 
                          ? (config.hardwareConfig.items.reduce((sum, item) => sum + item.price, 0) / 12 / 10000).toFixed(2)
                          : '0.00'}万/月
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
