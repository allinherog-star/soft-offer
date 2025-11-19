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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Clock, DollarSign, TrendingDown, Sparkles, Tag, Ticket, BadgePercent, Zap, Users2, Wrench, Server, Layers, AlertCircle, CheckCircle2, Target } from 'lucide-react';

export default function Home() {
  const { toast } = useToast();
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
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false);
  const [autoExpandTrigger, setAutoExpandTrigger] = useState(0);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

  // 历史记录管理
  const [history, setHistory] = useState<FunctionNode[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 计算实际总工期（考虑岗位数量，取70%）
  const calculateActualTotalDays = () => {
    const totalDays = estimate.teamWorkloads.reduce((sum, workload) => {
      const count = roleCounts[workload.role] || 1;
      const actualDays = workload.workDays / count;
      return sum + actualDays;
    }, 0);
    return totalDays * 0.7; // 总工期为工期总和的70%
  };

  // 统计子模块数量（有子节点的中间层节点，不包括顶层模块）
  const countSubModules = (nodes: FunctionNode[]): number => {
    let count = 0;
    const countInChildren = (childNodes: FunctionNode[]): number => {
      return childNodes.reduce((subCount, node) => {
        let currentCount = 0;
        // 如果这个节点有子节点，它就是一个子模块
        if (node.children && node.children.length > 0) {
          currentCount = 1;
          // 递归统计更深层的子模块
          currentCount += countInChildren(node.children);
        }
        return subCount + currentCount;
      }, 0);
    };
    
    // 只统计顶层节点的子节点中的子模块
    nodes.forEach(node => {
      if (node.children) {
        count += countInChildren(node.children);
      }
    });
    
    return count;
  };

  // 统计功能菜单数量（叶子节点，不包含顶层模块）
  const countFunctionMenus = (nodes: FunctionNode[], isTopLevel: boolean = true): number => {
    return nodes.reduce((count, node) => {
      if (!node.children || node.children.length === 0) {
        // 叶子节点：如果是顶层节点（需求模块），不统计；否则才是功能菜单
        return count + (isTopLevel ? 0 : 1);
      }
      // 有子节点的是模块，继续递归（非顶层）
      return count + countFunctionMenus(node.children, false);
    }, 0);
  };

  // 统计高优先级功能菜单数量（仅统计叶子节点，不包含顶层模块）
  const countHighPriority = (nodes: FunctionNode[], isTopLevel: boolean = true): number => {
    return nodes.reduce((count, node) => {
      if (!node.children || node.children.length === 0) {
        // 叶子节点：如果是顶层节点（需求模块），不统计；否则统计功能菜单的高优先级
        if (isTopLevel) return count;
        return count + ((node.priority === '高' || node.priority === '很高') ? 1 : 0);
      }
      // 有子节点的是模块，继续递归（非顶层）
      return count + countHighPriority(node.children, false);
    }, 0);
  };

  // 统计重要功能菜单数量（仅统计叶子节点，不包含顶层模块）
  const countImportant = (nodes: FunctionNode[], isTopLevel: boolean = true): number => {
    return nodes.reduce((count, node) => {
      if (!node.children || node.children.length === 0) {
        // 叶子节点：如果是顶层节点（需求模块），不统计；否则统计功能菜单的重要标记
        if (isTopLevel) return count;
        return count + (node.isImportant ? 1 : 0);
      }
      // 有子节点的是模块，继续递归（非顶层）
      return count + countImportant(node.children, false);
    }, 0);
  };

  // 统计功能点数量（只统计按钮操作）
  const countFunctionPoints = (nodes: FunctionNode[], isTopLevel: boolean = true): number => {
    return nodes.reduce((count, node) => {
      let currentCount = 0;
      
      if (!node.children || node.children.length === 0) {
        // 叶子节点：功能菜单，只统计其按钮数量
        if (!isTopLevel) {
          // 只统计该功能菜单的所有按钮数量
          if (node.buttons && node.buttons.length > 0) {
            currentCount += node.buttons.length;
          }
        }
      } else {
        // 有子节点的是模块，继续递归（非顶层）
        currentCount += countFunctionPoints(node.children, false);
      }
      
      return count + currentCount;
    }, 0);
  };

  // 计算团队总人数
  const getTotalTeamMembers = (): number => {
    return Object.values(roleCounts).reduce((sum, count) => sum + count, 0);
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

  // 示例数据
  const SAMPLE_DATA = {
    projectInfo: {
      name: '电商平台',
      industry: '电子商务',
      description: 'B2C在线购物平台，包含商品管理、订单管理、支付系统等核心功能',
      platforms: ['Web端', 'H5', '小程序']
    },
    functionNodes: [
      {
        id: 'module-1',
        name: '用户中心',
        complexity: '中',
        priority: '高',
        isImportant: true,
        remark: '用户账户管理模块，包含用户注册、登录、个人信息管理等',
        children: [
          {
            id: 'menu-1',
            name: '用户注册',
            complexity: '中',
            priority: '很高',
            isImportant: true,
            remark: '用户注册功能，支持多种注册方式',
            buttons: [
              { id: 'btn-1', name: '手机注册', complexity: '中', priority: '高', isImportant: true, remark: '通过手机号验证码注册' },
              { id: 'btn-2', name: '邮箱注册', complexity: '中', priority: '高', isImportant: true, remark: '通过邮箱验证注册' },
              { id: 'btn-3', name: '第三方注册', complexity: '高', priority: '中', isImportant: false, remark: '微信、支付宝等第三方账号注册' }
            ]
          },
          {
            id: 'menu-2',
            name: '用户登录',
            complexity: '中',
            priority: '很高',
            isImportant: true,
            remark: '用户登录认证功能',
            buttons: [
              { id: 'btn-4', name: '密码登录', complexity: '低', priority: '很高', isImportant: true, remark: '账号密码登录' },
              { id: 'btn-5', name: '验证码登录', complexity: '中', priority: '高', isImportant: true, remark: '手机验证码登录' },
              { id: 'btn-6', name: '第三方登录', complexity: '高', priority: '中', isImportant: false, remark: '第三方社交账号登录' },
              { id: 'btn-7', name: '忘记密码', complexity: '中', priority: '高', isImportant: true, remark: '密码找回功能' }
            ]
          },
          {
            id: 'menu-3',
            name: '个人信息管理',
            complexity: '中',
            priority: '高',
            isImportant: true,
            remark: '用户个人信息维护',
            buttons: [
              { id: 'btn-8', name: '编辑资料', complexity: '低', priority: '高', isImportant: false, remark: '修改个人信息' },
              { id: 'btn-9', name: '修改密码', complexity: '低', priority: '高', isImportant: true, remark: '修改登录密码' },
              { id: 'btn-10', name: '实名认证', complexity: '高', priority: '高', isImportant: true, remark: '用户实名认证' },
              { id: 'btn-11', name: '头像上传', complexity: '中', priority: '中', isImportant: false, remark: '上传修改用户头像' }
            ]
          }
        ]
      },
      {
        id: 'module-2',
        name: '商品中心',
        complexity: '高',
        priority: '很高',
        isImportant: true,
        remark: '商品信息管理模块，包含商品发布、分类、搜索等核心功能',
        children: [
          {
            id: 'menu-4',
            name: '商品发布',
            complexity: '高',
            priority: '很高',
            isImportant: true,
            remark: '商家发布商品功能',
            buttons: [
              { id: 'btn-12', name: '新增商品', complexity: '高', priority: '很高', isImportant: true, remark: '发布新商品' },
              { id: 'btn-13', name: '编辑商品', complexity: '中', priority: '高', isImportant: true, remark: '修改商品信息' },
              { id: 'btn-14', name: '删除商品', complexity: '低', priority: '中', isImportant: false, remark: '下架删除商品' },
              { id: 'btn-15', name: '复制商品', complexity: '中', priority: '中', isImportant: false, remark: '复制已有商品信息' },
              { id: 'btn-16', name: '批量操作', complexity: '中', priority: '中', isImportant: false, remark: '批量上下架商品' }
            ]
          },
          {
            id: 'menu-5',
            name: '商品分类',
            complexity: '高',
            priority: '高',
            isImportant: true,
            remark: '商品分类体系管理',
            buttons: [
              { id: 'btn-17', name: '新增分类', complexity: '中', priority: '高', isImportant: true, remark: '添加商品分类' },
              { id: 'btn-18', name: '编辑分类', complexity: '中', priority: '高', isImportant: true, remark: '修改分类信息' },
              { id: 'btn-19', name: '删除分类', complexity: '中', priority: '中', isImportant: false, remark: '删除商品分类' },
              { id: 'btn-20', name: '排序调整', complexity: '中', priority: '中', isImportant: false, remark: '调整分类显示顺序' }
            ]
          },
          {
            id: 'menu-6',
            name: '商品搜索',
            complexity: '很高',
            priority: '很高',
            isImportant: true,
            remark: '商品搜索和筛选功能',
            buttons: [
              { id: 'btn-21', name: '关键词搜索', complexity: '高', priority: '很高', isImportant: true, remark: '根据关键词搜索商品' },
              { id: 'btn-22', name: '高级筛选', complexity: '高', priority: '高', isImportant: true, remark: '多维度筛选商品' },
              { id: 'btn-23', name: '搜索历史', complexity: '中', priority: '中', isImportant: false, remark: '搜索历史记录管理' },
              { id: 'btn-24', name: '热门搜索', complexity: '中', priority: '中', isImportant: false, remark: '热门搜索词管理' }
            ]
          },
          {
            id: 'menu-7',
            name: '商品详情',
            complexity: '高',
            priority: '很高',
            isImportant: true,
            remark: '商品详情页面功能',
            buttons: [
              { id: 'btn-25', name: '加入购物车', complexity: '中', priority: '很高', isImportant: true, remark: '添加商品到购物车' },
              { id: 'btn-26', name: '立即购买', complexity: '中', priority: '很高', isImportant: true, remark: '直接购买商品' },
              { id: 'btn-27', name: '收藏商品', complexity: '低', priority: '高', isImportant: false, remark: '收藏喜欢的商品' },
              { id: 'btn-28', name: '分享商品', complexity: '中', priority: '中', isImportant: false, remark: '分享商品给好友' }
            ]
          }
        ]
      },
      {
        id: 'module-3',
        name: '订单管理',
        complexity: '高',
        priority: '很高',
        isImportant: true,
        remark: '订单全生命周期管理，包含下单、支付、发货、售后等',
        children: [
          {
            id: 'menu-8',
            name: '订单创建',
            complexity: '高',
            priority: '很高',
            isImportant: true,
            remark: '创建新订单流程',
            buttons: [
              { id: 'btn-29', name: '创建订单', complexity: '高', priority: '很高', isImportant: true, remark: '生成新订单' },
              { id: 'btn-30', name: '地址选择', complexity: '中', priority: '高', isImportant: true, remark: '选择收货地址' },
              { id: 'btn-31', name: '优惠券使用', complexity: '中', priority: '高', isImportant: true, remark: '选择使用优惠券' },
              { id: 'btn-32', name: '订单确认', complexity: '中', priority: '很高', isImportant: true, remark: '确认订单信息' }
            ]
          },
          {
            id: 'menu-9',
            name: '订单支付',
            complexity: '很高',
            priority: '很高',
            isImportant: true,
            remark: '订单支付功能',
            buttons: [
              { id: 'btn-33', name: '微信支付', complexity: '高', priority: '很高', isImportant: true, remark: '微信支付接口' },
              { id: 'btn-34', name: '支付宝支付', complexity: '高', priority: '很高', isImportant: true, remark: '支付宝支付接口' },
              { id: 'btn-35', name: '银行卡支付', complexity: '高', priority: '高', isImportant: true, remark: '银行卡支付' },
              { id: 'btn-36', name: '余额支付', complexity: '中', priority: '中', isImportant: false, remark: '账户余额支付' }
            ]
          },
          {
            id: 'menu-10',
            name: '订单查询',
            complexity: '中',
            priority: '高',
            isImportant: true,
            remark: '订单查询和管理',
            buttons: [
              { id: 'btn-37', name: '查询订单', complexity: '中', priority: '高', isImportant: true, remark: '按条件查询订单' },
              { id: 'btn-38', name: '订单详情', complexity: '中', priority: '高', isImportant: true, remark: '查看订单详细信息' },
              { id: 'btn-39', name: '取消订单', complexity: '中', priority: '高', isImportant: true, remark: '取消未支付订单' },
              { id: 'btn-40', name: '删除订单', complexity: '低', priority: '中', isImportant: false, remark: '删除已完成订单' },
              { id: 'btn-41', name: '导出订单', complexity: '中', priority: '中', isImportant: false, remark: '导出订单数据' }
            ]
          },
          {
            id: 'menu-11',
            name: '售后管理',
            complexity: '高',
            priority: '高',
            isImportant: true,
            remark: '售后服务管理',
            buttons: [
              { id: 'btn-42', name: '申请退款', complexity: '中', priority: '高', isImportant: true, remark: '申请订单退款' },
              { id: 'btn-43', name: '申请退货', complexity: '高', priority: '高', isImportant: true, remark: '申请商品退货' },
              { id: 'btn-44', name: '售后进度', complexity: '中', priority: '高', isImportant: true, remark: '查看售后处理进度' },
              { id: 'btn-45', name: '取消售后', complexity: '低', priority: '中', isImportant: false, remark: '取消售后申请' }
            ]
          }
        ]
      },
      {
        id: 'module-4',
        name: '购物车',
        complexity: '中',
        priority: '高',
        isImportant: true,
        remark: '购物车功能模块',
        children: [
          {
            id: 'menu-12',
            name: '购物车管理',
            complexity: '中',
            priority: '高',
            isImportant: true,
            remark: '购物车商品管理',
            buttons: [
              { id: 'btn-46', name: '添加商品', complexity: '低', priority: '高', isImportant: true, remark: '添加商品到购物车' },
              { id: 'btn-47', name: '删除商品', complexity: '低', priority: '高', isImportant: true, remark: '从购物车删除商品' },
              { id: 'btn-48', name: '修改数量', complexity: '低', priority: '高', isImportant: true, remark: '修改商品购买数量' },
              { id: 'btn-49', name: '清空购物车', complexity: '低', priority: '中', isImportant: false, remark: '清空所有购物车商品' },
              { id: 'btn-50', name: '批量结算', complexity: '中', priority: '高', isImportant: true, remark: '批量结算购物车商品' }
            ]
          }
        ]
      },
      {
        id: 'module-5',
        name: '支付系统',
        complexity: '很高',
        priority: '很高',
        isImportant: true,
        remark: '支付交易处理系统',
        children: [
          {
            id: 'menu-13',
            name: '支付管理',
            complexity: '很高',
            priority: '很高',
            isImportant: true,
            remark: '支付流程管理',
            buttons: [
              { id: 'btn-51', name: '支付接口', complexity: '很高', priority: '很高', isImportant: true, remark: '集成多种支付方式' },
              { id: 'btn-52', name: '支付回调', complexity: '高', priority: '很高', isImportant: true, remark: '支付结果回调处理' },
              { id: 'btn-53', name: '退款处理', complexity: '高', priority: '高', isImportant: true, remark: '订单退款处理' },
              { id: 'btn-54', name: '对账管理', complexity: '高', priority: '高', isImportant: true, remark: '支付对账功能' }
            ]
          }
        ]
      },
      {
        id: 'module-6',
        name: '库存管理',
        complexity: '高',
        priority: '高',
        isImportant: true,
        remark: '商品库存管理系统',
        children: [
          {
            id: 'menu-14',
            name: '库存管理',
            complexity: '高',
            priority: '高',
            isImportant: true,
            remark: '库存信息管理',
            buttons: [
              { id: 'btn-55', name: '库存查询', complexity: '中', priority: '高', isImportant: true, remark: '查询商品库存' },
              { id: 'btn-56', name: '库存调整', complexity: '中', priority: '高', isImportant: true, remark: '手动调整库存数量' },
              { id: 'btn-57', name: '库存预警', complexity: '高', priority: '高', isImportant: true, remark: '库存不足预警' },
              { id: 'btn-58', name: '库存同步', complexity: '高', priority: '高', isImportant: true, remark: '多仓库库存同步' }
            ]
          }
        ]
      },
      {
        id: 'module-7',
        name: '营销中心',
        complexity: '高',
        priority: '高',
        isImportant: true,
        remark: '营销活动管理模块',
        children: [
          {
            id: 'menu-15',
            name: '优惠券管理',
            complexity: '高',
            priority: '高',
            isImportant: true,
            remark: '优惠券发放和使用管理',
            buttons: [
              { id: 'btn-59', name: '新增优惠券', complexity: '中', priority: '高', isImportant: true, remark: '创建新优惠券' },
              { id: 'btn-60', name: '编辑优惠券', complexity: '中', priority: '高', isImportant: true, remark: '修改优惠券信息' },
              { id: 'btn-61', name: '删除优惠券', complexity: '低', priority: '中', isImportant: false, remark: '删除优惠券' },
              { id: 'btn-62', name: '发放优惠券', complexity: '高', priority: '高', isImportant: true, remark: '批量发放优惠券' },
              { id: 'btn-63', name: '优惠券统计', complexity: '中', priority: '中', isImportant: false, remark: '优惠券使用统计' }
            ]
          },
          {
            id: 'menu-16',
            name: '促销活动',
            complexity: '高',
            priority: '高',
            isImportant: true,
            remark: '促销活动管理',
            buttons: [
              { id: 'btn-64', name: '创建活动', complexity: '高', priority: '高', isImportant: true, remark: '创建促销活动' },
              { id: 'btn-65', name: '编辑活动', complexity: '中', priority: '高', isImportant: true, remark: '修改活动信息' },
              { id: 'btn-66', name: '删除活动', complexity: '低', priority: '中', isImportant: false, remark: '删除促销活动' },
              { id: 'btn-67', name: '活动审核', complexity: '中', priority: '高', isImportant: true, remark: '审核促销活动' },
              { id: 'btn-68', name: '活动统计', complexity: '高', priority: '中', isImportant: false, remark: '活动效果统计' }
            ]
          }
        ]
      },
      {
        id: 'module-8',
        name: '内容管理',
        complexity: '中',
        priority: '中',
        isImportant: false,
        remark: '平台内容信息管理',
        children: [
          {
            id: 'menu-17',
            name: '首页管理',
            complexity: '高',
            priority: '高',
            isImportant: true,
            remark: '首页内容配置管理',
            buttons: [
              { id: 'btn-69', name: '轮播图管理', complexity: '中', priority: '高', isImportant: true, remark: '首页轮播图配置' },
              { id: 'btn-70', name: '推荐位管理', complexity: '高', priority: '高', isImportant: true, remark: '商品推荐位配置' },
              { id: 'btn-71', name: '楼层管理', complexity: '高', priority: '高', isImportant: true, remark: '首页楼层布局管理' },
              { id: 'btn-72', name: '页面预览', complexity: '中', priority: '中', isImportant: false, remark: '首页效果预览' }
            ]
          },
          {
            id: 'menu-18',
            name: '文章管理',
            complexity: '中',
            priority: '中',
            isImportant: false,
            remark: '平台文章内容管理',
            buttons: [
              { id: 'btn-73', name: '新增文章', complexity: '低', priority: '中', isImportant: false, remark: '发布新文章' },
              { id: 'btn-74', name: '编辑文章', complexity: '低', priority: '中', isImportant: false, remark: '修改文章内容' },
              { id: 'btn-75', name: '删除文章', complexity: '低', priority: '低', isImportant: false, remark: '删除文章' },
              { id: 'btn-76', name: '文章分类', complexity: '中', priority: '中', isImportant: false, remark: '文章分类管理' }
            ]
          }
        ]
      },
      {
        id: 'module-9',
        name: '数据统计',
        complexity: '很高',
        priority: '高',
        isImportant: true,
        remark: '平台数据统计分析',
        children: [
          {
            id: 'menu-19',
            name: '销售统计',
            complexity: '高',
            priority: '高',
            isImportant: true,
            remark: '销售数据统计分析',
            buttons: [
              { id: 'btn-77', name: '销售额统计', complexity: '高', priority: '高', isImportant: true, remark: '销售额数据统计' },
              { id: 'btn-78', name: '订单统计', complexity: '高', priority: '高', isImportant: true, remark: '订单数据统计分析' },
              { id: 'btn-79', name: '商品统计', complexity: '高', priority: '高', isImportant: true, remark: '商品销售统计' },
              { id: 'btn-80', name: '导出报表', complexity: '中', priority: '中', isImportant: false, remark: '导出统计报表' }
            ]
          },
          {
            id: 'menu-20',
            name: '用户统计',
            complexity: '高',
            priority: '中',
            isImportant: false,
            remark: '用户行为数据分析',
            buttons: [
              { id: 'btn-81', name: '用户增长', complexity: '高', priority: '中', isImportant: false, remark: '用户增长趋势分析' },
              { id: 'btn-82', name: '用户行为', complexity: '很高', priority: '中', isImportant: false, remark: '用户行为数据分析' },
              { id: 'btn-83', name: '用户画像', complexity: '很高', priority: '中', isImportant: false, remark: '用户画像分析' }
            ]
          }
        ]
      },
      {
        id: 'module-10',
        name: '系统管理',
        complexity: '高',
        priority: '高',
        isImportant: true,
        remark: '后台系统管理功能',
        children: [
          {
            id: 'menu-21',
            name: '权限管理',
            complexity: '高',
            priority: '高',
            isImportant: true,
            remark: '系统权限管理',
            buttons: [
              { id: 'btn-84', name: '角色管理', complexity: '高', priority: '高', isImportant: true, remark: '系统角色管理' },
              { id: 'btn-85', name: '权限分配', complexity: '高', priority: '高', isImportant: true, remark: '权限分配管理' },
              { id: 'btn-86', name: '用户权限', complexity: '中', priority: '高', isImportant: true, remark: '用户权限设置' }
            ]
          },
          {
            id: 'menu-22',
            name: '系统配置',
            complexity: '中',
            priority: '中',
            isImportant: false,
            remark: '系统基础配置',
            buttons: [
              { id: 'btn-87', name: '基础配置', complexity: '中', priority: '中', isImportant: false, remark: '系统基础参数配置' },
              { id: 'btn-88', name: '支付配置', complexity: '高', priority: '高', isImportant: true, remark: '支付方式配置' },
              { id: 'btn-89', name: '物流配置', complexity: '中', priority: '中', isImportant: false, remark: '物流公司配置' }
            ]
          }
        ]
      }
    ]
  };

  // 加载示例数据
  const handleLoadSample = () => {
    setSampleDialogOpen(true);
  };

  // 确认加载示例数据
  const confirmLoadSample = () => {
    setProjectInfo(SAMPLE_DATA.projectInfo);
    setFunctionNodes(SAMPLE_DATA.functionNodes);
    saveToHistory(SAMPLE_DATA.functionNodes);
    setSampleDialogOpen(false);
    // 触发自动展开
    setAutoExpandTrigger(prev => prev + 1);
    toast({
      title: '示例数据加载成功 ✅',
      description: '已加载电商平台示例数据（10个模块、22个菜单、89个按钮）',
    });
  };

  // 清空数据
  const handleClear = () => {
    setClearDialogOpen(true);
  };

  const confirmClear = () => {
    setProjectInfo({
      name: '',
      industry: '',
      platforms: []
    });
    setFunctionNodes([]);
    setSelectedNode(null);
    setHistory([[]]);
    setHistoryIndex(0);
    setClearDialogOpen(false);
    toast({
      title: '已清空 🗑️',
      description: '所有数据已清空',
    });
  };

  // 保存数据 - 导出JSON文件
  const handleSave = () => {
    const data = {
      projectInfo,
      functionNodes,
      config,
      discount,
      roleCounts,
      timestamp: new Date().toISOString()
    };
    
    // 生成文件名：项目名称-年月日-时分秒.json
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-');
    const projectName = projectInfo.name || '项目';
    const fileName = `${projectName}-${dateStr}-${timeStr}.json`;
    
    // 创建JSON文件并下载
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 恢复数据 - 选择JSON文件导入
  const handleRestore = () => {
    // 创建文件选择input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const jsonStr = event.target?.result as string;
            const data = JSON.parse(jsonStr);
            
        setProjectInfo(data.projectInfo || { name: '', industry: '', platforms: [] });
        setFunctionNodes(data.functionNodes || []);
        setConfig(data.config || DEFAULT_CONFIG);
        setDiscount(data.discount || 1);
        setRoleCounts(data.roleCounts || {});
        saveToHistory(data.functionNodes || []);
            
        toast({
          title: '恢复成功 ↩️',
              description: `已恢复 ${data.timestamp ? new Date(data.timestamp).toLocaleString() : '导入'} 的数据`,
        });
      } catch (error) {
        toast({
          title: '恢复失败 ❌',
              description: 'JSON文件格式错误，无法恢复',
          variant: 'destructive',
        });
      }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  };

  // 导出为PDF
  const handleExport = () => {
    // 直接打开打印对话框
      window.print();
  };

  // 自动计算估价
  useEffect(() => {
    const newEstimate = calculateEstimate(
      functionNodes,
      projectInfo.platforms,
      config,
      discount,
      roleCounts
    );
    setEstimate(newEstimate);
  }, [functionNodes, projectInfo.platforms, config, discount, roleCounts]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 print:h-auto print:bg-white">
      {/* 顶部导航栏 */}
      <Header
        projectInfo={projectInfo}
        onProjectInfoChange={setProjectInfo}
        onOpenCostSettings={() => setCostSettingsOpen(true)}
        onLoadSample={handleLoadSample}
        onClear={handleClear}
        onSave={handleSave}
        onRestore={handleRestore}
        onExport={handleExport}
      />

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden print:flex-col print:overflow-visible print:gap-4">
        {/* 左侧功能树 */}
        <div className="w-[300px] flex-shrink-0 h-full overflow-hidden print:hidden">
          <FunctionTree
            nodes={functionNodes}
            selectedNode={selectedNode}
            onNodesChange={saveToHistory}
            onSelectNode={setSelectedNode}
            onUndo={undo}
            onRedo={redo}
            historyIndex={historyIndex}
            historyLength={history.length}
            projectInfo={projectInfo}
            autoExpandTrigger={autoExpandTrigger}
          />
        </div>

        {/* 中间表格 */}
        <div className="flex-1 min-w-0 print:w-full print:mb-4">
          <FunctionTable
            nodes={functionNodes}
            selectedNode={selectedNode}
            onNodesChange={saveToHistory}
          />
        </div>

          {/* 右侧估价面板 */}
          <div className="w-[500px] flex-shrink-0 h-full overflow-hidden print:w-full print:mt-4 print:border-t-2 print:border-gray-300 print:pt-4">
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
      <div className="border-t bg-gradient-to-r from-blue-50 via-white to-blue-50 shadow-lg print:bg-white print:shadow-none print:border-2 print:border-gray-400 print:mt-6 print:rounded">
        <div className="px-6 py-3 print:px-0 print:py-0">
          {/* 打印时使用表格布局 */}
          <div className="hidden print:block">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-blue-100 border-b-2 border-gray-400">
                  <th colSpan={8} className="text-left py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">📊 项目评估概览</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 第一行：统计指标 */}
                <tr className="border-b border-gray-400">
                  <td className="py-2.5 px-3 text-center border-r border-gray-400">
                    <div className="text-[10px] text-gray-600">需求模块</div>
                    <div className="text-sm font-bold text-blue-600">{functionNodes.length}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-gray-400">
                    <div className="text-[10px] text-gray-600">子模块</div>
                    <div className="text-sm font-bold text-cyan-600">{countSubModules(functionNodes)}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-gray-400">
                    <div className="text-[10px] text-gray-600">功能菜单</div>
                    <div className="text-sm font-bold text-green-600">{countFunctionMenus(functionNodes)}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-gray-400">
                    <div className="text-[10px] text-gray-600">功能点</div>
                    <div className="text-sm font-bold text-purple-600">{countFunctionPoints(functionNodes)}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-gray-400">
                    <div className="text-[10px] text-gray-600">高优先级</div>
                    <div className="text-sm font-bold text-orange-600">{countHighPriority(functionNodes)}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-gray-400">
                    <div className="text-[10px] text-gray-600">重点需求</div>
                    <div className="text-sm font-bold text-red-600">{countImportant(functionNodes)}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-gray-400">
                    <div className="text-[10px] text-gray-600">团队人数</div>
                    <div className="text-sm font-bold text-purple-600">{getTotalTeamMembers()}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="text-[10px] text-gray-600">折扣</div>
                    <div className="text-sm font-bold text-orange-600">{(discount * 10).toFixed(0)}折</div>
                  </td>
                </tr>
                {/* 第二行：关键指标 */}
                <tr className="bg-gray-50">
                  <td className="py-2.5 px-3 text-center border-r border-gray-400">
                    <div className="text-[10px] text-gray-600">总人力</div>
                    <div className="text-base font-bold text-purple-600">
                      {estimate.teamWorkloads.reduce((sum, w) => sum + w.workDays, 0).toFixed(1)}
                      <span className="text-xs font-normal"> 人天</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-gray-400">
                    <div className="text-[10px] text-gray-600">总工期</div>
                    <div className="text-base font-bold text-blue-600">
                      {calculateActualTotalDays().toFixed(1)}
                      <span className="text-xs font-normal"> 天</span>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">
                      {(() => {
                        const totalDays = calculateActualTotalDays();
                        const deliveryDate = new Date();
                        deliveryDate.setDate(deliveryDate.getDate() + Math.ceil(totalDays));
                        return deliveryDate.toLocaleDateString('zh-CN').replace(/\//g, '-');
                      })()}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-gray-400">
                    <div className="text-[10px] text-gray-600">市场成本</div>
                    <div className="text-base font-bold text-gray-700">
                      {(estimate.baseCost / 10000).toFixed(2)}
                      <span className="text-xs font-normal"> 万</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-gray-400 bg-red-50">
                    <div className="text-[10px] text-gray-700 font-semibold">折后成本</div>
                    <div className="text-lg font-bold text-red-600">
                      {(estimate.finalPrice / 10000).toFixed(2)}
                      <span className="text-sm font-normal"> 万</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-gray-400" colSpan={2}>
                    <div className="text-[10px] text-gray-600">运维成本</div>
                    <div className="text-sm font-bold text-orange-600">
                      {(estimate.finalPrice * 0.1 / 10000).toFixed(2)}
                      <span className="text-xs font-normal"> 万/月</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center" colSpan={2}>
                    <div className="text-[10px] text-gray-600">硬件成本</div>
                    <div className="text-sm font-bold text-green-600">
                      {config.hardwareConfig 
                        ? (config.hardwareConfig.items.reduce((sum, item) => sum + item.price, 0) / 12 / 10000).toFixed(2)
                        : '0.00'}
                      <span className="text-xs font-normal"> 万/月</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 屏幕显示时使用flex布局 */}
          <div className="flex items-start justify-between gap-6 max-w-full print:hidden">
            {/* 左侧：整体统计 */}
            <div className="flex flex-col gap-2.5 flex-shrink-0">
              {/* 标题 */}
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">整体概览</span>
              </div>
              
              {/* 统计信息 - 2行紧凑布局 */}
              <div className="flex flex-col gap-1.5">
                {/* 第一行 */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs text-gray-500">需求模块</span>
                    <span className="text-sm font-bold text-blue-600 ml-0.5">
                      {functionNodes.length}
                    </span>
                  </div>
                  
                  <div className="w-px h-4 bg-gray-300"></div>
                  
                  <div className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-cyan-500" />
                    <span className="text-xs text-gray-500">子模块</span>
                    <span className="text-sm font-bold text-cyan-600 ml-0.5">
                      {countSubModules(functionNodes)}
                    </span>
                  </div>
                  
                  <div className="w-px h-4 bg-gray-300"></div>
                  
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-gray-500">功能菜单</span>
                    <span className="text-sm font-bold text-green-600 ml-0.5">
                      {countFunctionMenus(functionNodes)}
                    </span>
                  </div>
                  
                  <div className="w-px h-4 bg-gray-300"></div>
                  
                  <div className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs text-gray-500">功能点</span>
                    <span className="text-sm font-bold text-purple-600 ml-0.5">
                      {countFunctionPoints(functionNodes)}
                    </span>
                  </div>
                </div>
                
                {/* 第二行 */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs text-gray-500">高优先级</span>
                    <span className="text-sm font-bold text-orange-600 ml-0.5">
                      {countHighPriority(functionNodes)}
                    </span>
                  </div>
                  
                  <div className="w-px h-4 bg-gray-300"></div>
                  
                  <div className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-xs text-gray-500">重点需求</span>
                    <span className="text-sm font-bold text-red-600 ml-0.5">
                      {countImportant(functionNodes)}
                    </span>
                  </div>
                  
                  <div className="w-px h-4 bg-gray-300"></div>
                  
                  <div className="flex items-center gap-1">
                    <Users2 className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs text-gray-500">团队人数</span>
                    <span className="text-sm font-bold text-purple-600 ml-0.5">
                      {getTotalTeamMembers()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：关键指标 */}
            <div className="flex items-center gap-5 flex-wrap">
              {/* 总人力 */}
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <Users2 className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex flex-col">
                  <div className="text-xs text-gray-500 leading-tight">总人力</div>
                  <div className="text-lg font-bold text-purple-600 leading-tight mt-0.5">
                    {estimate.teamWorkloads.reduce((sum, w) => sum + w.workDays, 0).toFixed(1)}
                    <span className="text-xs font-normal ml-0.5">人天</span>
                  </div>
                </div>
              </div>

              <div className="w-px h-10 bg-gray-300"></div>

              {/* 总工期 */}
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <div className="text-xs text-gray-500 leading-tight">总工期</div>
                  <div className="text-lg font-bold text-blue-600 leading-tight mt-0.5">
                    {calculateActualTotalDays().toFixed(1)}
                    <span className="text-xs font-normal ml-0.5">天</span>
                  </div>
                  <div className="text-[10px] text-gray-400 leading-tight mt-0.5">
                    预计 {(() => {
                      const totalDays = calculateActualTotalDays();
                      const deliveryDate = new Date();
                      deliveryDate.setDate(deliveryDate.getDate() + Math.ceil(totalDays));
                      return deliveryDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
                    })()}
                  </div>
                </div>
              </div>

              <div className="w-px h-10 bg-gray-300"></div>

              {/* 市场成本 */}
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg flex items-center justify-center w-7 h-7">
                  <span className="text-base font-bold text-red-600 leading-none">¥</span>
                </div>
                <div className="flex flex-col">
                  <div className="text-xs text-gray-500 leading-tight">市场成本</div>
                  <div className="text-lg font-bold text-red-600 leading-tight mt-0.5">
                    {(estimate.baseCost / 10000).toFixed(2)}
                    <span className="text-xs font-normal ml-0.5">万</span>
                  </div>
                </div>
              </div>

              <div className="w-px h-10 bg-gray-300"></div>

              {/* 折扣选择 */}
              <div className="flex items-start gap-2 print:hidden">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex flex-col">
                  <div className="text-xs text-gray-500 leading-tight">折扣</div>
                  <div className="mt-1">
                    <Select
                      value={discount.toString()}
                      onValueChange={(value) => setDiscount(parseFloat(value))}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
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

              <div className="w-px h-10 bg-gray-300 print:hidden"></div>
              
              {/* 打印时显示折扣 */}
              <div className="hidden print:flex items-start gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex flex-col">
                  <div className="text-xs text-gray-500 leading-tight">折扣</div>
                  <div className="text-lg font-bold text-orange-600 leading-tight mt-0.5">
                    {(discount * 10).toFixed(0)}折
                  </div>
                </div>
              </div>

              <div className="hidden print:block w-px h-10 bg-gray-300"></div>

              {/* 折后成本 + 运维成本 + 硬件费用 */}
              <div className="flex items-start gap-2 bg-gradient-to-r from-red-50 to-orange-50 px-3 py-1.5 rounded-lg border-2 border-red-300">
                <div className="flex flex-col gap-1">
                  <div>
                    <div className="text-xs text-gray-600 font-medium leading-tight">折后成本</div>
                    <div className="text-xl font-bold text-red-600 leading-tight mt-0.5">
                      {(estimate.finalPrice / 10000).toFixed(2)}
                      <span className="text-sm font-normal ml-0.5">万</span>
                    </div>
                  </div>
                  <div className="border-t border-red-200 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Wrench className="h-2.5 w-2.5 text-gray-500" />
                      <span className="text-[10px] text-gray-600">运维</span>
                      <span className="text-[10px] font-semibold text-red-500">
                        {(estimate.finalPrice * 0.1 / 10000).toFixed(2)}万/月
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Server className="h-2.5 w-2.5 text-gray-500" />
                      <span className="text-[10px] text-gray-600">硬件</span>
                      <span className="text-[10px] font-semibold text-red-500">
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

      {/* 清空确认对话框 */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将清空所有项目信息和需求清单数据，此操作无法撤销。是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear} className="bg-red-600 hover:bg-red-700">
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 加载示例数据确认对话框 */}
      <AlertDialog open={sampleDialogOpen} onOpenChange={setSampleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>加载示例数据</AlertDialogTitle>
            <AlertDialogDescription>
              将加载电商平台示例数据，包含10个需求模块、22个功能菜单和89个功能按钮。如果当前有数据将被覆盖，是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={confirmLoadSample} className="bg-blue-600 hover:bg-blue-700">
              确认加载
            </AlertDialogAction>
            <AlertDialogCancel>取消</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
