import React, { useState, useEffect } from 'react';
import { Cat, SupplyItem, RoutineTask, WeightRecord } from './types';
import { INITIAL_CATS, INITIAL_SUPPLIES, INITIAL_TASKS } from './data';
import { StatsOverview } from './components/StatsOverview';
import { CatCard } from './components/CatCard';
import { CatDetailsModal } from './components/CatDetailsModal';
import { AddEditCatModal } from './components/AddEditCatModal';
import { SuppliesInventory } from './components/SuppliesInventory';
import { RoutineTasks } from './components/RoutineTasks';
import { DashboardOverview } from './components/DashboardOverview';
import { SettingsPanel } from './components/SettingsPanel';
import { Plus, Package, CalendarClock, Cat as CatIcon, RefreshCw, Sparkles, HelpCircle, Home, Settings, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getBarkConfig, sendBarkNotification } from './utils/bark';
import { apiClient } from './utils/apiClient';

// Help date calculator
const addDaysStr = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export default function App() {
  // -----------------------------------------
  // CORE PERSISTED STATE
  // -----------------------------------------
  const [cats, setCats] = useState<Cat[]>(() => {
    const saved = localStorage.getItem('felinescape_v2_cats');
    return saved ? JSON.parse(saved) : INITIAL_CATS;
  });

  const [supplies, setSupplies] = useState<SupplyItem[]>(() => {
    const saved = localStorage.getItem('felinescape_v2_supplies');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIES;
  });

  const [tasks, setTasks] = useState<RoutineTask[]>(() => {
    const saved = localStorage.getItem('felinescape_v2_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>(() => {
    const saved = localStorage.getItem('felinescape_v2_weights');
    if (saved) return JSON.parse(saved);
    // Otherwise seed initial weight records from existing cats
    const initialRecords: WeightRecord[] = INITIAL_CATS.map(c => ({
      id: `w-${c.id}-init`,
      catId: c.id,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      weight: c.weight
    }));
    return initialRecords;
  });

  // Save to storage
  useEffect(() => {
    localStorage.setItem('felinescape_v2_cats', JSON.stringify(cats));
  }, [cats]);

  useEffect(() => {
    localStorage.setItem('felinescape_v2_supplies', JSON.stringify(supplies));
  }, [supplies]);

  useEffect(() => {
    localStorage.setItem('felinescape_v2_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('felinescape_v2_weights', JSON.stringify(weightRecords));
  }, [weightRecords]);

  // -----------------------------------------
  // UI NAVIGATION SWITCHER STATE
  // -----------------------------------------
  const [activeTab, setActiveTab] = useState<'overview' | 'cats' | 'supplies' | 'tasks' | 'settings'>('overview');

  // -----------------------------------------
  // BACKEND API SYNC ENGINE
  // -----------------------------------------
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiErrorMsg, setApiErrorMsg] = useState<string | null>(null);

  // Sync data with backend API on mount
  useEffect(() => {
    let active = true;
    const fetchAllData = async () => {
      setIsApiLoading(true);
      setApiErrorMsg(null);
      try {
        console.log('🔄 Syncing with backend at http://aleiiicat-managementlatest.zeabur.internal ...');
        const [backendCats, backendSupplies, backendTasks] = await Promise.all([
          apiClient.listCats(),
          apiClient.listInventory(),
          apiClient.listTasks()
        ]);
        
        if (!active) return;

        if (backendCats) setCats(backendCats);
        if (backendSupplies) setSupplies(backendSupplies);
        if (backendTasks) setTasks(backendTasks);

        // Fetch weight records for loaded cats
        const allWeights: WeightRecord[] = [];
        if (backendCats && backendCats.length > 0) {
          for (const cat of backendCats) {
            try {
              const weights = await apiClient.listWeights(cat.id);
              if (weights && weights.length > 0) {
                allWeights.push(...weights);
              }
            } catch (e) {
              // silent fail for this cat's weights
            }
          }
        }
        
        if (!active) return;
        if (allWeights.length > 0) {
          setWeightRecords(allWeights);
        }
        console.log('✅ Synchronized with Zeabur backend API!');
      } catch (err: any) {
        if (!active) return;
        console.warn('⚠️ Zeabur backend connection failed:', err);
        setApiErrorMsg('无法连接后端服务 (物理地址: aleiiicat-managementlatest.zeabur.internal). 已启用本地缓存离线工作，系统在册状态正常。');
      } finally {
        if (active) setIsApiLoading(false);
      }
    };

    fetchAllData();
    return () => {
      active = false;
    };
  }, []);

  // Automated Overdue health task checker
  useEffect(() => {
    const config = getBarkConfig();
    if (config.enableOverdue && config.deviceKey && tasks.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const overdueTasks = tasks.filter(t => t.nextDueDate < today);
      if (overdueTasks.length > 0) {
        const lastAlertDay = localStorage.getItem('last_overdue_alert_day');
        if (lastAlertDay !== today) {
          localStorage.setItem('last_overdue_alert_day', today);
          const taskTitles = overdueTasks.map(t => {
            const catName = t.catId === 'all' ? '全家猫咪' : (cats.find(c => c.id === t.catId)?.name || '小猫');
            return `【${catName}】${t.title}`;
          }).join('、');
          
          sendBarkNotification(
            '⏰ 喵主子健康计划逾期提醒',
            `您有 ${overdueTasks.length} 项日程逾期未打卡，包含：${taskTitles}。请抽空前往系统帮宝贝完成并打卡！`,
            config
          );
        }
      }
    }
  }, [tasks, cats, activeTab]);

  // Modal controls
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [isEditCatOpen, setIsEditCatOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const activeCat = cats.find(c => c.id === selectedCatId) || null;

  // -----------------------------------------
  // CORE DB INITIALIZER (RESEED HANDLER)
  // -----------------------------------------
  const handleResetData = () => {
    if (confirm('确认重置：这一步将清空您目前注册的所有新猫咪、修改过的用品库存以及完成时间，回滚到初厂空配置。确定要清空吗？')) {
      localStorage.removeItem('felinescape_v2_cats');
      localStorage.removeItem('felinescape_v2_supplies');
      localStorage.removeItem('felinescape_v2_tasks');
      localStorage.removeItem('felinescape_v2_weights');

      setCats(INITIAL_CATS);
      setSupplies(INITIAL_SUPPLIES);
      setTasks(INITIAL_TASKS);
      
      const initialRecords: WeightRecord[] = INITIAL_CATS.map(c => ({
        id: `w-${c.id}-init`,
        catId: c.id,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        weight: c.weight
      }));
      setWeightRecords(initialRecords);
      setSelectedCatId(null);
      setIsDetailsOpen(false);
      setIsEditCatOpen(false);
      setIsAddCatOpen(false);
    }
  };

  // -----------------------------------------
  // CRUD BUSINESS HANDLERS: CAT PROFILES
  // -----------------------------------------
  const handleSaveCatProfile = async (catData: Omit<Cat, 'id' | 'createdAt'>) => {
    if (isEditCatOpen && selectedCatId) {
      // API call to update
      try {
        await apiClient.updateCat(selectedCatId, catData);
      } catch (e) {
        console.error("API updateCat failed:", e);
      }

      // Modify existing cat locally
      setCats(prev => prev.map(c => c.id === selectedCatId ? { ...c, ...catData } : c));
      
      // Also write down a weight record matching this date if we changed its current weight index
      const todayString = new Date().toISOString().split('T')[0];
      const hasRecordToday = weightRecords.some(w => w.catId === selectedCatId && w.date === todayString);
      if (!hasRecordToday) {
        let weightRecordId = `w-${Date.now()}`;
        try {
          const backendWeightId = await apiClient.createWeight(selectedCatId, catData.weight, todayString);
          if (backendWeightId) weightRecordId = backendWeightId;
        } catch (e) {
          console.error("API createWeight on cat update failed:", e);
        }
        setWeightRecords(prev => [...prev, {
          id: weightRecordId,
          catId: selectedCatId,
          date: todayString,
          weight: catData.weight
        }]);
      }
      setIsEditCatOpen(false);
    } else {
      // Create new cat
      let newId = `cat-${Date.now()}`;
      try {
        const backendId = await apiClient.createCat(catData);
        if (backendId) newId = backendId;
      } catch (e) {
        console.error("API createCat failed:", e);
      }

      const newCat: Cat = {
        id: newId,
        ...catData,
        createdAt: new Date().toISOString(),
      };
      setCats(prev => [newCat, ...prev]);

      // Create initial weight capture
      let initWeightId = `w-${Date.now()}-init`;
      try {
        const backendWeightId = await apiClient.createWeight(newId, catData.weight, new Date().toISOString().split('T')[0]);
        if (backendWeightId) initWeightId = backendWeightId;
      } catch (e) {
        console.error("API createWeight initial failed:", e);
      }

      setWeightRecords(prev => [...prev, {
        id: initWeightId,
        catId: newId,
        date: new Date().toISOString().split('T')[0],
        weight: catData.weight
      }]);

      setIsAddCatOpen(false);
    }
  };

  const handleDeleteCatProfile = async (catId: string) => {
    try {
      await apiClient.deleteCat(catId);
    } catch (e) {
      console.error("API deleteCat failed:", e);
    }

    setCats(prev => prev.filter(c => c.id !== catId));
    // clean bound data
    setWeightRecords(prev => prev.filter(w => w.catId !== catId));
    setTasks(prev => prev.map(t => t.catId === catId ? { ...t, catId: 'all' } : t)); // release specialized tasks to home-general
    setIsDetailsOpen(false);
    setSelectedCatId(null);
  };

  // -----------------------------------------
  // CRUD BUSINESS HANDLERS: SUPPLIES INVENTORY
  // -----------------------------------------
  const handleAddSupply = async (itemData: Omit<SupplyItem, 'id' | 'lastUpdated'>) => {
    let newItemId = `item-${Date.now()}`;
    try {
      const backendId = await apiClient.createInventoryItem(itemData);
      if (backendId) newItemId = backendId;
    } catch (e) {
      console.error("API createInventoryItem failed:", e);
    }

    const newItem: SupplyItem = {
      id: newItemId,
      ...itemData,
      lastUpdated: new Date().toISOString(),
    };
    setSupplies(prev => [newItem, ...prev]);
  };

  const handleUpdateSupply = async (updatedItem: SupplyItem) => {
    try {
      await apiClient.updateInventoryItem(updatedItem.id, updatedItem);
    } catch (e) {
      console.error("API updateInventoryItem failed:", e);
    }

    setSupplies(prev => {
      const existing = prev.find(s => s.id === updatedItem.id);
      if (existing) {
        const isNowLow = updatedItem.stockAmount < updatedItem.minThreshold;
        const wasLowBefore = existing.stockAmount < existing.minThreshold;
        
        if (isNowLow && (!wasLowBefore || updatedItem.stockAmount < existing.stockAmount)) {
          const config = getBarkConfig();
          if (config.enableLowStock && config.deviceKey) {
            sendBarkNotification(
              '⚠️ 猫咪日用品库房偏低报警',
              `备件【${updatedItem.name}】当前库存仅剩 ${updatedItem.stockAmount}${updatedItem.unit}，已低于设定的最低阀值 (${updatedItem.minThreshold}${updatedItem.unit})。请及时补给！`,
              config
            );
          }
        }
      }
      return prev.map(s => s.id === updatedItem.id ? updatedItem : s);
    });
  };

  const handleDeleteSupply = async (id: string) => {
    try {
      await apiClient.deleteInventoryItem(id);
    } catch (e) {
      console.error("API deleteInventoryItem failed:", e);
    }
    setSupplies(prev => prev.filter(s => s.id !== id));
  };

  // -----------------------------------------
  // CRUD BUSINESS HANDLERS: ROUTINE TASKS
  // -----------------------------------------
  const handleAddTask = async (taskData: Omit<RoutineTask, 'id' | 'lastCompletedDate'>) => {
    let newTaskId = `task-${Date.now()}`;
    try {
      const backendId = await apiClient.createTask(taskData);
      if (backendId) newTaskId = backendId;
    } catch (e) {
      console.error("API createTask failed:", e);
    }

    const newTask: RoutineTask = {
      id: newTaskId,
      lastCompletedDate: null,
      ...taskData,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = async (updatedTask: RoutineTask) => {
    try {
      await apiClient.updateTask(updatedTask.id, updatedTask);
    } catch (e) {
      console.error("API updateTask failed:", e);
    }
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await apiClient.deleteTask(id);
    } catch (e) {
      console.error("API deleteTask failed:", e);
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Automated Routine Completion Engine
  const handleCompleteTaskCycle = async (task: RoutineTask) => {
    const today = new Date().toISOString().split('T')[0];
    const calculatedNext = addDaysStr(today, task.intervalDays);

    try {
      await apiClient.completeTask(task.id);
    } catch (e) {
      console.error("API completeTask failed:", e);
    }

    const updated: RoutineTask = {
      ...task,
      lastCompletedDate: today,
      nextDueDate: calculatedNext,
    };

    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));

    // Optional user feedback on screen
    alert(`🎉 任务已打卡完成！\n主题: 【${task.title}】\n本次标记日期: ${today}\n根据频次设置，下一期应办日已被自动顺延至: ${calculatedNext}`);
  };

  // Handle adding weight from inside Details Dossier
  const handleAddWeightRecord = async (catId: string, weightVal: number, dateStr: string) => {
    let recordId = `w-${Date.now()}`;
    try {
      const backendId = await apiClient.createWeight(catId, weightVal, dateStr);
      if (backendId) recordId = backendId;
    } catch (e) {
      console.error("API createWeight failed:", e);
    }

    const newRecord: WeightRecord = {
      id: recordId,
      catId,
      date: dateStr,
      weight: weightVal
    };
    setWeightRecords(prev => [...prev, newRecord]);

    // sync current weight in master profile
    setCats(prev => prev.map(c => c.id === catId ? { ...c, weight: weightVal } : c));
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen font-sans antialiased text-stone-800 pb-16 selection:bg-amber-100 selection:text-amber-800">
      
      {/* 1. Header Branding Navigation bar with Integrated Switcher */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 md:py-0 md:h-16 gap-3">
            
            {/* Left: Brand */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xl select-none">🐾</span>
              <h1 className="font-extrabold text-xs text-stone-900 tracking-wider uppercase">
                猫咪简易管家
              </h1>
              <span className="text-[9px] font-mono font-bold bg-[#E6F3E6] text-emerald-700 border border-emerald-100/60 px-1.5 py-0.5 rounded-sm">
                极简版
              </span>
            </div>

            {/* Center & Right: Integrated Navigation */}
            <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-1 md:py-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-2.5 py-1.5 md:py-5 font-bold text-[11px] md:text-xs flex items-center gap-1.5 transition border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'overview'
                    ? 'border-stone-950 text-stone-950 font-extrabold'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                <Home size={13} />
                <span>养宠概览</span>
              </button>
              <button
                onClick={() => setActiveTab('cats')}
                className={`px-2.5 py-1.5 md:py-5 font-bold text-[11px] md:text-xs flex items-center gap-1.5 transition border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'cats'
                    ? 'border-stone-950 text-stone-950 font-extrabold'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                <CatIcon size={13} />
                <span>猫咪建档 ({cats.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('supplies')}
                className={`px-2.5 py-1.5 md:py-5 font-bold text-[11px] md:text-xs flex items-center gap-1.5 transition border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'supplies'
                    ? 'border-stone-950 text-stone-950 font-extrabold'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                <Package size={13} />
                <span>日用备件 ({supplies.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-2.5 py-1.5 md:py-5 font-bold text-[11px] md:text-xs flex items-center gap-1.5 transition border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'tasks'
                    ? 'border-stone-950 text-stone-950 font-extrabold'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                <CalendarClock size={13} />
                <span>定期计划 ({tasks.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-2.5 py-1.5 md:py-5 font-bold text-[11px] md:text-xs flex items-center gap-1.5 transition border-b-2 cursor-pointer shrink-0 ${
                  activeTab === 'settings'
                    ? 'border-stone-950 text-stone-950 font-extrabold'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                <Settings size={13} />
                <span>通知设置</span>
              </button>
            </nav>

          </div>
        </div>
      </header>

      {/* 2. Main Content Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* 3. Subview render */}
        <div className="min-h-[460px]">
          {/* O. DASHBOARD OVERVIEW VIEW (Default Homepage showing calculated statistics) */}
          {activeTab === 'overview' && (
            <DashboardOverview
              cats={cats}
              supplies={supplies}
              tasks={tasks}
              weightRecords={weightRecords}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* A. CAT PROFILES VIEW */}
          {activeTab === 'cats' && (
            <div>
              {cats.length === 0 ? (
                <div className="bg-white border border-stone-100 rounded-xl p-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col items-center justify-center max-w-2xl mx-auto mt-6">
                  <span className="text-4xl mb-4 select-none">🐱</span>
                  <h3 className="font-extrabold text-stone-850 mb-1.5 text-sm">暂无在册猫咪基本信息</h3>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed mb-4">
                    当前数据库里没有任何小主人的记录。现在开始创建您的第一个猫咪成长健康跟踪方案。
                  </p>
                  <button
                    onClick={() => setIsAddCatOpen(true)}
                    className="text-xs font-semibold text-white bg-stone-950 hover:bg-stone-800 px-4 py-2 rounded-lg transition cursor-pointer"
                  >
                    立刻登记入册
                  </button>
                </div>
              ) : (
                <div>
                  {/* Local Page Header with the Register Button */}
                  <div className="flex items-center justify-between mb-6 pb-2.5 border-b border-stone-200/60">
                    <div>
                      <h2 className="text-stone-850 font-extrabold text-sm flex items-center gap-2">
                        <span>🐱 在册猫咪基本档案</span>
                        <span className="text-[10px] bg-stone-100 font-mono text-stone-500 px-1.5 py-0.5 rounded">
                          {cats.length} 只
                        </span>
                      </h2>
                      <p className="text-[11px] text-stone-400 font-sans mt-0.5">这里登记了当前全部主子的基本身世资料及最新状态。</p>
                    </div>
                    <button
                      onClick={() => setIsAddCatOpen(true)}
                      className="bg-stone-950 hover:bg-stone-800 text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      <span>登记新猫</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {cats.map(cat => (
                      <CatCard
                        key={cat.id}
                        cat={cat}
                        onViewDetails={() => {
                          setSelectedCatId(cat.id);
                          setIsDetailsOpen(true);
                        }}
                        onEdit={(e) => {
                          e.stopPropagation();
                          setSelectedCatId(cat.id);
                          setIsEditCatOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. SUPPLIES INVENTORY VIEW */}
          {activeTab === 'supplies' && (
            <SuppliesInventory
              supplies={supplies}
              onAddSupply={handleAddSupply}
              onUpdateSupply={handleUpdateSupply}
              onDeleteSupply={handleDeleteSupply}
            />
          )}

          {/* C. PERIODIC TASKS SCHEDULE VIEW */}
          {activeTab === 'tasks' && (
            <RoutineTasks
              tasks={tasks}
              cats={cats}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCompleteTask={handleCompleteTaskCycle}
            />
          )}

          {/* D. NOTIFICATION SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </div>
      </main>

      {/* 4. MODALS OVERLAYS */}
      <AnimatePresence>
        {/* ADD CAT MODAL */}
        {isAddCatOpen && (
          <AddEditCatModal
            onClose={() => setIsAddCatOpen(false)}
            onSave={handleSaveCatProfile}
          />
        )}

        {/* EDIT CAT MODAL */}
        {isEditCatOpen && activeCat && (
          <AddEditCatModal
            catToEdit={activeCat}
            onClose={() => setIsEditCatOpen(false)}
            onSave={handleSaveCatProfile}
          />
        )}

        {/* EXPANDED DOSSIER DETAILS MODAL (vitals trend + tasks list) */}
        {isDetailsOpen && activeCat && (
          <CatDetailsModal
            cat={activeCat}
            tasks={tasks}
            weightRecords={weightRecords}
            onClose={() => setIsDetailsOpen(false)}
            onAddWeight={handleAddWeightRecord}
            onDeleteCat={handleDeleteCatProfile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
