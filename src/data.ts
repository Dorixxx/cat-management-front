import { Cat, SupplyItem, RoutineTask } from './types';

export const INITIAL_CATS: Cat[] = [
  {
    id: 'cat-1',
    name: '奥利弗 (Oliver)',
    breed: '橘猫',
    gender: 'Male',
    ageYears: 2,
    ageMonths: 3,
    weight: 5.2,
    avatarUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400',
    guardian: '安安',
    description: '一只话很多超级黏人的橘黄色小男生，对激光红点毫无抵抗力，喜欢踩奶。',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cat-2',
    name: '露娜 (Luna)',
    breed: '暹罗猫',
    gender: 'Female',
    ageYears: 1,
    ageMonths: 6,
    weight: 3.6,
    avatarUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=400',
    guardian: '安安',
    description: '高贵优雅的暹罗小公主，眼睛像蓝宝石一样。平时喜欢趴在窗台上看窗外的小鸟。',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cat-3',
    name: '麦洛 (Milo)',
    breed: '英短蓝猫',
    gender: 'Male',
    ageYears: 3,
    ageMonths: 0,
    weight: 6.1,
    avatarUrl: 'https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=400',
    guardian: '安安',
    description: '圆滚滚的蓝猫胖子，脾气超级好。每天的终极梦想就是吃和睡，睡姿极其豪放。',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const INITIAL_SUPPLIES: SupplyItem[] = [
  {
    id: 'item-1',
    name: '渴望六种鱼无谷猫粮 (5.4kg)',
    category: 'Food',
    stockAmount: 2,
    unit: '袋',
    minThreshold: 1,
    note: '主粮，每日消耗。大概 1.5 个月消耗一袋。',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'item-2',
    name: 'Pidan 豆腐混合猫砂 (6.1kg)',
    category: 'Litter',
    stockAmount: 1,
    unit: '袋',
    minThreshold: 3,
    note: '每周更换一次需要消耗 1 袋，低于 3 袋报警。',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'item-3',
    name: '网易严选无谷金枪鱼猫条 (24支/袋)',
    category: 'Treat',
    stockAmount: 5,
    unit: '袋',
    minThreshold: 2,
    note: '互动及剪爪子奖励，一周喂食 2-3 支。',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'item-4',
    name: '大宠爱体内外驱虫滴剂 (3支/盒)',
    category: 'Medical',
    stockAmount: 0,
    unit: '盒',
    minThreshold: 1,
    note: '每月全身体内外预防性驱虫，目前空仓需尽快采购！',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'item-5',
    name: '珍致三文鱼浓汤猫罐头 (85g)',
    category: 'Food',
    stockAmount: 12,
    unit: '罐',
    minThreshold: 6,
    note: '湿粮加餐，补水神器，两只猫猫拼吃一罐。',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'item-6',
    name: '麦德氏猫咪化毛膏 (120g)',
    category: 'Medical',
    stockAmount: 1,
    unit: '支',
    minThreshold: 1,
    note: '换毛季每日挤 2cm 喂食，平时一周 2 次。',
    lastUpdated: new Date().toISOString()
  }
];

export const INITIAL_TASKS: RoutineTask[] = [
  {
    id: 'task-1',
    catId: 'all',
    title: '清洗饮水机并换水',
    intervalDays: 7,
    lastCompletedDate: '2026-06-03',
    nextDueDate: '2026-06-10',
    note: '每周三为全自动循环饮水机换新水并清洗过滤网。'
  },
  {
    id: 'task-2',
    catId: 'cat-1',
    title: '修剪指甲 (奥利弗)',
    intervalDays: 14,
    lastCompletedDate: '2026-05-28',
    nextDueDate: '2026-06-11',
    note: '奥利弗前爪长得很快，剪完指甲必须给一支猫条奖励。'
  },
  {
    id: 'task-3',
    catId: 'cat-2',
    title: '修剪指甲 (露娜)',
    intervalDays: 14,
    lastCompletedDate: '2026-05-28',
    nextDueDate: '2026-06-11',
    note: '露娜比较抗拒，修剪时可以用毛巾包裹好头部操作。'
  },
  {
    id: 'task-4',
    catId: 'all',
    title: '体内外一体驱虫 (大宠爱/博来恩)',
    intervalDays: 30,
    lastCompletedDate: '2026-05-15',
    nextDueDate: '2026-06-15',
    note: '每月月中定期滴药，注意滴在脖颈后侧防止舔舐。'
  },
  {
    id: 'task-5',
    catId: 'cat-3',
    title: '清理耳朵 (麦洛)',
    intervalDays: 14,
    lastCompletedDate: '2026-05-25',
    nextDueDate: '2026-06-08',
    note: '麦洛油脂分泌较多，注意每周至两周用洗耳液擦洗干净。已略微逾期。'
  },
  {
    id: 'task-6',
    catId: 'all',
    title: '全舱铲沙并擦洗猫砂盆',
    intervalDays: 15,
    lastCompletedDate: '2026-05-26',
    nextDueDate: '2026-06-10',
    note: '半个月大扫除一次，清空旧砂，高温暴晒消毒，换入一整袋新猫砂。'
  }
];

export const BREED_OPTIONS = [
  '橘猫',
  '中华田园猫（黑白/狸花/三花）',
  '暹罗猫',
  '英国短毛猫',
  '美国短毛猫',
  '布偶猫',
  '波斯猫',
  '缅因猫',
  '折耳猫（不推荐购买）',
  '无毛猫',
  '其他品种'
];

export const CAT_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1501820488136-72669a482d14?auto=format&fit=crop&q=80&w=400'
];
