import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { getTodayDateVN, getTomorrowDateVN, addDays } from '../lib/dateUtils';
import {
  computeStatsAfterCompletion,
  sanitizeStatsStreak,
} from '../lib/gamification';
import type {
  StudyTask,
  Milestone,
  UserStats,
  DailyReport,
  AiPlanning,
} from '../lib/schemas';

interface DataContextType {
  tasks: StudyTask[];
  milestones: Milestone[];
  stats: UserStats;
  latestReport: DailyReport | null;
  latestAiInsight: string | null;
  loading: boolean;
  addTask: (taskData: Omit<StudyTask, 'id' | 'createdAt' | 'syncStatus'>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<StudyTask>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, durationMins: number) => Promise<{ expGained: number; level: number; streakDays: number }>;
  recordReasonMissed: (taskId: string, reason: string) => Promise<void>;
  addMilestone: (event: string, date: string) => Promise<string>;
  updateMilestone: (id: string, event: string, date: string) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  saveDailyReport: (report: DailyReport) => Promise<void>;
  applyAiPlan: (plan: AiPlanning, rawJson: string) => Promise<number>;
  seedDemoData: () => Promise<void>;
}

const defaultStats: UserStats = {
  totalExp: 0,
  level: 1,
  streakDays: 0,
  lastActiveDate: getTodayDateVN(),
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [latestReport, setLatestReport] = useState<DailyReport | null>(null);
  const [latestAiInsight, setLatestAiInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setMilestones([]);
      setStats(defaultStats);
      setLatestReport(null);
      setLatestAiInsight(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const uid = user.uid;

    // 1. Listen to tasks
    const tasksPath = `users/${uid}/tasks`;
    const tasksQuery = query(collection(db, 'users', uid, 'tasks'), orderBy('plannedDate', 'desc'));
    const unsubTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const loadedTasks: StudyTask[] = [];
        snapshot.forEach((docSnap) => {
          loadedTasks.push({ ...(docSnap.data() as StudyTask), id: docSnap.id });
        });
        setTasks(loadedTasks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, tasksPath);
      }
    );

    // 2. Listen to milestones
    const milestonesPath = `users/${uid}/milestones`;
    const milestonesQuery = query(collection(db, 'users', uid, 'milestones'), orderBy('date', 'asc'));
    const unsubMilestones = onSnapshot(
      milestonesQuery,
      (snapshot) => {
        const loadedMilestones: Milestone[] = [];
        snapshot.forEach((docSnap) => {
          loadedMilestones.push({ ...(docSnap.data() as Milestone), id: docSnap.id });
        });
        setMilestones(loadedMilestones);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, milestonesPath);
      }
    );

    // 3. Listen to stats/main
    const statsPath = `users/${uid}/stats/main`;
    const statsDocRef = doc(db, 'users', uid, 'stats', 'main');
    const unsubStats = onSnapshot(
      statsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const raw = docSnap.data() as UserStats;
          const sanitized = sanitizeStatsStreak(raw, getTodayDateVN());
          setStats(sanitized);
        } else {
          setStats(defaultStats);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, statsPath);
      }
    );

    // 4. Listen to latest daily report
    const reportsPath = `users/${uid}/reports`;
    const reportsQuery = query(
      collection(db, 'users', uid, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsubReports = onSnapshot(
      reportsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          if (docData && docData.report) {
            setLatestReport(docData.report as DailyReport);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, reportsPath);
      }
    );

    // 5. Listen to latest AI plan for insight
    const plansPath = `users/${uid}/plans`;
    const plansQuery = query(
      collection(db, 'users', uid, 'plans'),
      orderBy('appliedAt', 'desc'),
      limit(1)
    );
    const unsubPlans = onSnapshot(
      plansQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const planData = snapshot.docs[0].data();
          if (planData?.aiInsight) {
            setLatestAiInsight(planData.aiInsight);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, plansPath);
      }
    );

    setLoading(false);

    return () => {
      unsubTasks();
      unsubMilestones();
      unsubStats();
      unsubReports();
      unsubPlans();
    };
  }, [user]);

  // Tasks actions
  const addTask = async (taskData: Omit<StudyTask, 'id' | 'createdAt' | 'syncStatus'>): Promise<string> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const newTaskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullTask: StudyTask = {
      ...taskData,
      id: newTaskId,
      syncStatus: 'not_synced',
      createdAt: new Date().toISOString(),
    };
    const path = `users/${user.uid}/tasks/${newTaskId}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'tasks', newTaskId), fullTask);
      return newTaskId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<StudyTask>): Promise<void> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const completeTask = async (
    taskId: string,
    durationMins: number
  ): Promise<{ expGained: number; level: number; streakDays: number }> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const today = getTodayDateVN();

    // 1. Calculate updated stats
    const { nextStats, expGained } = computeStatsAfterCompletion(stats, durationMins, today);

    // 2. Update task
    const taskPath = `users/${user.uid}/tasks/${taskId}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), {
        status: 'done',
        durationMins,
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, taskPath);
    }

    // 3. Update stats
    const statsPath = `users/${user.uid}/stats/main`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'stats', 'main'), nextStats);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, statsPath);
    }

    return {
      expGained,
      level: nextStats.level,
      streakDays: nextStats.streakDays,
    };
  };

  const recordReasonMissed = async (taskId: string, reason: string): Promise<void> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), {
        reasonMissed: reason,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Milestones actions
  const addMilestone = async (event: string, date: string): Promise<string> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const id = `ms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMs: Milestone = { id, event, date };
    const path = `users/${user.uid}/milestones/${id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'milestones', id), newMs);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateMilestone = async (id: string, event: string, date: string): Promise<void> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const path = `users/${user.uid}/milestones/${id}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'milestones', id), { event, date });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteMilestone = async (id: string): Promise<void> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const path = `users/${user.uid}/milestones/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'milestones', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Save Daily Report
  const saveDailyReport = async (report: DailyReport): Promise<void> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const path = `users/${user.uid}/reports/${report.report_id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'reports', report.report_id), {
        report,
        createdAt: new Date().toISOString(),
      });
      setLatestReport(report);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  // Apply AI Plan
  const applyAiPlan = async (plan: AiPlanning, rawJson: string): Promise<number> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const planId = `plan_${plan.in_response_to}_${Date.now()}`;
    const planPath = `users/${user.uid}/plans/${planId}`;

    // 1. Save plan record
    try {
      await setDoc(doc(db, 'users', user.uid, 'plans', planId), {
        rawJson,
        aiInsight: plan.ai_insight,
        targetDate: plan.target_date,
        inResponseTo: plan.in_response_to,
        appliedAt: new Date().toISOString(),
      });
      setLatestAiInsight(plan.ai_insight);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, planPath);
    }

    // 2. Upsert each task using clientId as Firestore Document ID
    let createdCount = 0;
    for (const item of plan.tasks_to_sync) {
      const taskDocId = item.client_id;
      const fullTask: StudyTask = {
        id: taskDocId,
        clientId: item.client_id,
        sourceTaskId: item.source_task_id || undefined,
        title: item.title,
        subjectCode: item.subject_code,
        status: 'pending',
        plannedDate: plan.target_date,
        estMins: item.est_mins,
        priority: item.priority,
        listKey: item.list_key,
        notes: item.notes || '',
        origin: 'ai_plan',
        syncStatus: 'not_synced',
        createdAt: new Date().toISOString(),
      };

      const taskPath = `users/${user.uid}/tasks/${taskDocId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', taskDocId), fullTask);
        createdCount++;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, taskPath);
      }

      // If sourceTaskId is provided, mark previous task as rescheduled
      if (item.source_task_id) {
        const sourcePath = `users/${user.uid}/tasks/${item.source_task_id}`;
        try {
          await updateDoc(doc(db, 'users', user.uid, 'tasks', item.source_task_id), {
            notes: `[Đã chuyển tiếp sang ${plan.target_date}]`,
          });
        } catch {
          // If source task doesn't exist or update fails, continue
        }
      }
    }

    return createdCount;
  };

  // Seed realistic demo data
  const seedDemoData = async (): Promise<void> => {
    if (!user) throw new Error('Chưa đăng nhập');
    const today = getTodayDateVN();
    const tomorrow = getTomorrowDateVN();
    const pastDate = addDays(today, -1);

    // Initial realistic stats
    const demoStats: UserStats = {
      totalExp: 1450,
      level: 3,
      streakDays: 4,
      lastActiveDate: today,
    };
    await setDoc(doc(db, 'users', user.uid, 'stats', 'main'), demoStats);

    // Demo milestones
    const demoMilestones: Milestone[] = [
      { id: 'ms_gk1_dia', event: 'Kiểm tra giữa kỳ 1 Địa lý', date: addDays(today, 4) },
      { id: 'ms_thi_hsg_tin', event: 'Kỳ thi chọn HSG Tin học C++', date: addDays(today, 12) },
      { id: 'ms_thi_hoc_ky', event: 'Thi Học Kỳ 1 Toàn trường', date: addDays(today, 28) },
    ];
    for (const ms of demoMilestones) {
      await setDoc(doc(db, 'users', user.uid, 'milestones', ms.id), ms);
    }

    // Demo tasks
    const demoTasks: StudyTask[] = [
      // Completed today
      {
        id: 'task_demo_1',
        title: 'Luyện 3 bài Quy hoạch động (Knapsack & LIS)',
        subjectCode: 'tin',
        track: 'HSG C++',
        status: 'done',
        plannedDate: today,
        durationMins: 75,
        estMins: 60,
        priority: 'high',
        listKey: 'hsg_cpp',
        notes: 'Đã hoàn thành AC cả 3 bài trên Codeforces',
        origin: 'manual',
        syncStatus: 'not_synced',
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task_demo_2',
        title: 'Học thuộc sơ đồ tư duy Bài 4: Khí hậu Việt Nam',
        subjectCode: 'dia',
        status: 'done',
        plannedDate: today,
        durationMins: 35,
        estMins: 30,
        priority: 'medium',
        listKey: 'school',
        notes: 'Chuẩn bị cho bài kiểm tra giữa kỳ 1',
        origin: 'manual',
        syncStatus: 'not_synced',
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      // Pending today
      {
        id: 'task_demo_3',
        title: 'Giải bài tập Dao động điều hòa phần con lắc lò xo',
        subjectCode: 'ly',
        status: 'pending',
        plannedDate: today,
        estMins: 45,
        priority: 'high',
        listKey: 'school',
        notes: 'Bài 1 đến 8 trong đề cương ôn tập',
        origin: 'manual',
        syncStatus: 'not_synced',
        createdAt: new Date().toISOString(),
      },
      // Unfinished from yesterday with reason missed
      {
        id: 'task_demo_4',
        title: 'Đọc và soạn bài Việt Bắc (Tố Hữu) - 8 câu đầu',
        subjectCode: 'van',
        status: 'pending',
        plannedDate: pastDate,
        estMins: 40,
        priority: 'medium',
        listKey: 'school',
        reasonMissed: 'Bận ôn tập đột xuất bài kiểm tra 15 phút môn Hóa',
        origin: 'manual',
        syncStatus: 'not_synced',
        createdAt: new Date().toISOString(),
      },
      // Planned for tomorrow
      {
        id: 'task_demo_5',
        title: 'Làm đề kiểm tra Toán số 3 - Chuyên đề Hàm số',
        subjectCode: 'toan',
        status: 'pending',
        plannedDate: tomorrow,
        estMins: 90,
        priority: 'high',
        listKey: 'school',
        notes: 'Bấm giờ chuẩn 90 phút như thi thật',
        origin: 'manual',
        syncStatus: 'not_synced',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task_demo_6',
        title: 'Họp nhóm thuyết trình dự án Tin học Ứng dụng',
        subjectCode: 'tin',
        status: 'pending',
        plannedDate: tomorrow,
        estMins: 45,
        priority: 'medium',
        listKey: 'group_project',
        notes: 'Phân chia slide và demo ứng dụng',
        origin: 'manual',
        syncStatus: 'not_synced',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const t of demoTasks) {
      await setDoc(doc(db, 'users', user.uid, 'tasks', t.id), t);
    }
  };

  return (
    <DataContext.Provider
      value={{
        tasks,
        milestones,
        stats,
        latestReport,
        latestAiInsight,
        loading,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        recordReasonMissed,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        saveDailyReport,
        applyAiPlan,
        seedDemoData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
