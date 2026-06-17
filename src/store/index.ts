import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import dayjs from "dayjs";
import type {
  Examination,
  DefectType,
  TechnicianStats,
  RoomStats,
  RectificationTask,
  CaseStudy,
  ScoreItem,
  TrendDataPoint,
  User,
  NotificationSettings,
  RectificationStatus,
} from "@/types";
import {
  mockExaminations,
  defectTypes,
  mockTechnicianStats,
  mockRoomStats,
  mockRectificationTasks,
  mockCaseStudies,
  mockScoreItems,
  mockTrendData,
  mockCurrentUser,
} from "@/mock";

export interface StaffMember {
  id: string;
  name: string;
  role: "technician" | "qc" | "director";
  roleName: string;
  room?: string;
  phone?: string;
  status: "active" | "inactive";
}

export interface Room {
  id: string;
  name: string;
  equipment: string;
  status: "active" | "maintenance" | "inactive";
  lastMaintenance: string;
}

export interface PositionRules {
  ccLeftRequired: boolean;
  ccRightRequired: boolean;
  mloLeftRequired: boolean;
  mloRightRequired: boolean;
  leftMarkerRequired: boolean;
  rightMarkerRequired: boolean;
  ccMloPairRequired: boolean;
}

const initialStaff: StaffMember[] = [
  { id: "t1", name: "张技师", role: "technician", roleName: "技师", room: "DR机房1", phone: "13800138001", status: "active" },
  { id: "t2", name: "李技师", role: "technician", roleName: "技师", room: "DR机房2", phone: "13800138002", status: "active" },
  { id: "t3", name: "王技师", role: "technician", roleName: "技师", room: "DR机房3", phone: "13800138003", status: "active" },
  { id: "t4", name: "赵技师", role: "technician", roleName: "技师", room: "DR机房1", phone: "13800138004", status: "active" },
  { id: "t5", name: "陈技师", role: "technician", roleName: "技师", room: "DR机房2", phone: "13800138005", status: "active" },
  { id: "q1", name: "王质控", role: "qc", roleName: "质控员", phone: "13900139001", status: "active" },
  { id: "d1", name: "刘主任", role: "director", roleName: "科主任", phone: "13900139002", status: "active" },
];

const initialRooms: Room[] = [
  { id: "r1", name: "DR机房1", equipment: "GE Senographe Pristina", status: "active", lastMaintenance: "2024-06-01" },
  { id: "r2", name: "DR机房2", equipment: "Hologic Selenia Dimensions", status: "active", lastMaintenance: "2024-05-15" },
  { id: "r3", name: "DR机房3", equipment: "Siemens Mammomat Inspiration", status: "maintenance", lastMaintenance: "2024-04-20" },
];

const initialPositionRules: PositionRules = {
  ccLeftRequired: true,
  ccRightRequired: true,
  mloLeftRequired: true,
  mloRightRequired: true,
  leftMarkerRequired: true,
  rightMarkerRequired: true,
  ccMloPairRequired: true,
};

interface QCStore {
  examinations: Examination[];
  defectTypes: DefectType[];
  technicianStats: TechnicianStats[];
  roomStats: RoomStats[];
  rectificationTasks: RectificationTask[];
  caseStudies: CaseStudy[];
  scoreItems: ScoreItem[];
  trendData: TrendDataPoint[];
  currentUser: User;
  notificationSettings: NotificationSettings;
  selectedExam: Examination | null;
  staff: StaffMember[];
  rooms: Room[];
  positionRules: PositionRules;

  setSelectedExam: (exam: Examination | null) => void;
  updateExamination: (id: string, data: Partial<Examination>) => void;
  addRectificationTask: (task: RectificationTask) => void;
  updateRectificationTask: (id: string, data: Partial<RectificationTask>) => void;
  addCaseStudy: (caseStudy: CaseStudy) => void;
  getExamById: (id: string) => Examination | undefined;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateDefectType: (id: string, data: Partial<DefectType>) => void;
  addDefectType: (defect: DefectType) => void;
  updateScoreItem: (id: string, data: Partial<ScoreItem>) => void;
  addScoreItem: (item: ScoreItem) => void;
  addStaff: (member: StaffMember) => void;
  updateStaff: (id: string, data: Partial<StaffMember>) => void;
  addRoom: (room: Room) => void;
  updateRoom: (id: string, data: Partial<Room>) => void;
  updatePositionRules: (rules: Partial<PositionRules>) => void;
  processRecheck: (examId: string, result: "passed" | "retake" | "supplement", remark: string, processor: string) => void;
  addRecheckHistory: (examId: string, item: Omit<import("@/types").RecheckHistoryItem, "id">) => void;
}

export const useQCStore = create<QCStore>()(
  persist(
    (set, get) => ({
      examinations: mockExaminations,
      defectTypes,
      technicianStats: mockTechnicianStats,
      roomStats: mockRoomStats,
      rectificationTasks: mockRectificationTasks,
      caseStudies: mockCaseStudies,
      scoreItems: mockScoreItems,
      trendData: mockTrendData,
      currentUser: mockCurrentUser,
      notificationSettings: {
        retakeAlert: true,
        recheckNotify: true,
        rectificationReminder: true,
        dailyReport: true,
        notifyMethod: ["site"],
      },
      selectedExam: null,
      staff: initialStaff,
      rooms: initialRooms,
      positionRules: initialPositionRules,

      setSelectedExam: (exam) => set({ selectedExam: exam }),

      updateExamination: (id, data) =>
        set((state) => ({
          examinations: state.examinations.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),

      addRectificationTask: (task) =>
        set((state) => ({
          rectificationTasks: [...state.rectificationTasks, task],
        })),

      updateRectificationTask: (id, data) =>
        set((state) => ({
          rectificationTasks: state.rectificationTasks.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),

      addCaseStudy: (caseStudy) =>
        set((state) => ({
          caseStudies: [...state.caseStudies, caseStudy],
        })),

      getExamById: (id) => {
        return get().examinations.find((e) => e.id === id);
      },

      updateNotificationSettings: (settings) =>
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings },
        })),

      updateDefectType: (id, data) =>
        set((state) => ({
          defectTypes: state.defectTypes.map((d) =>
            d.id === id ? { ...d, ...data } : d
          ),
        })),

      addDefectType: (defect) =>
        set((state) => ({
          defectTypes: [...state.defectTypes, defect],
        })),

      updateScoreItem: (id, data) =>
        set((state) => ({
          scoreItems: state.scoreItems.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),

      addScoreItem: (item) =>
        set((state) => ({
          scoreItems: [...state.scoreItems, item],
        })),

      addStaff: (member) =>
        set((state) => ({
          staff: [...state.staff, member],
        })),

      updateStaff: (id, data) =>
        set((state) => ({
          staff: state.staff.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),

      addRoom: (room) =>
        set((state) => ({
          rooms: [...state.rooms, room],
        })),

      updateRoom: (id, data) =>
        set((state) => ({
          rooms: state.rooms.map((r) =>
            r.id === id ? { ...r, ...data } : r
          ),
        })),

      updatePositionRules: (rules) =>
        set((state) => ({
          positionRules: { ...state.positionRules, ...rules },
        })),

      processRecheck: (examId, result, remark, processor) =>
        set((state) => {
          const exam = state.examinations.find((e) => e.id === examId);
          if (!exam) return state;

          let newStatus: Examination["status"] = exam.status;
          if (result === "passed") {
            newStatus = "completed";
          } else if (result === "retake") {
            newStatus = "retake";
          } else if (result === "supplement") {
            newStatus = "qc_pending";
          }

          const historyItem: import("@/types").RecheckHistoryItem = {
            id: `rh-${Date.now()}`,
            action: "process",
            operator: processor,
            operatorRole: "科主任",
            time: dayjs().format("YYYY-MM-DD HH:mm"),
            remark,
            result,
            score: exam.score,
          };

          const existingHistory = exam.recheckHistory || [];

          return {
            examinations: state.examinations.map((e) =>
              e.id === examId
                ? {
                    ...e,
                    status: newStatus,
                    recheckResult: result,
                    recheckRemark: remark,
                    rechecker: processor,
                    recheckTime: dayjs().format("YYYY-MM-DD HH:mm"),
                    recheckRequested: false,
                    recheckHistory: [...existingHistory, historyItem],
                  }
                : e
            ),
          };
        }),

      addRecheckHistory: (examId, item) =>
        set((state) => {
          return {
            examinations: state.examinations.map((e) => {
              if (e.id !== examId) return e;
              const newItem: import("@/types").RecheckHistoryItem = {
                ...item,
                id: `rh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              };
              return {
                ...e,
                recheckHistory: [...(e.recheckHistory || []), newItem],
              };
            }),
          };
        }),
    }),
    {
      name: "qc-workbench-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        examinations: state.examinations,
        defectTypes: state.defectTypes,
        rectificationTasks: state.rectificationTasks,
        caseStudies: state.caseStudies,
        scoreItems: state.scoreItems,
        notificationSettings: state.notificationSettings,
        staff: state.staff,
        rooms: state.rooms,
        positionRules: state.positionRules,
      }),
    }
  )
);

export const getStatusText = (status: Examination["status"]): string => {
  const map: Record<Examination["status"], string> = {
    pending: "待拍摄",
    qc_pending: "待质控",
    qc_passed: "质控通过",
    qc_failed: "质控不通过",
    rechecking: "复核中",
    retake: "需重拍",
    completed: "已完成",
  };
  return map[status];
};

export const getStatusColor = (
  status: Examination["status"]
): "default" | "processing" | "success" | "error" | "warning" => {
  const map: Record<
    Examination["status"],
    "default" | "processing" | "success" | "error" | "warning"
  > = {
    pending: "default",
    qc_pending: "processing",
    qc_passed: "success",
    qc_failed: "error",
    rechecking: "warning",
    retake: "error",
    completed: "success",
  };
  return map[status];
};

export const getDefectName = (defectId: string, defectTypes: DefectType[]): string => {
  const def = defectTypes.find((d) => d.id === defectId);
  return def ? def.name : defectId;
};

export const getRectificationStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: "待整改",
    in_progress: "整改中",
    completed: "已完成",
  };
  return map[status] || status;
};

export const getRectificationStatusColor = (
  status: string
): "default" | "processing" | "success" | "error" | "warning" => {
  const map: Record<string, "default" | "processing" | "success" | "error" | "warning"> = {
    pending: "warning",
    in_progress: "processing",
    completed: "success",
  };
  return (map[status] as any) || "default";
};
