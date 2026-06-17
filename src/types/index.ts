export type ExamStatus =
  | "pending"
  | "qc_pending"
  | "qc_passed"
  | "qc_failed"
  | "rechecking"
  | "retake"
  | "completed";

export interface Positions {
  ccLeft: boolean;
  ccRight: boolean;
  mloLeft: boolean;
  mloRight: boolean;
}

export type RecheckResult = "passed" | "retake" | "supplement";

export interface Examination {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: "女" | "男";
  examTime: string;
  examType: string;
  technician: string;
  technicianId: string;
  room: string;
  roomId: string;
  positions: Positions;
  leftMarkerPresent: boolean;
  rightMarkerPresent: boolean;
  bodyParts?: string[];
  markers?: { left: boolean; right: boolean };
  status: ExamStatus;
  score: number;
  originalScore?: number;
  defects: string[];
  originalDefects?: string[];
  needRetake: boolean;
  retakeType?: "equipment" | "operation";
  retakeReason?: string;
  recheckRequested: boolean;
  recheckOpinion?: string;
  rechecker?: string;
  recheckResult?: RecheckResult;
  recheckRemark?: string;
  recheckTime?: string;
  remark?: string;
}

export type DefectCategory = "position" | "image" | "marker";
export type DefectSeverity = "minor" | "major" | "critical";

export interface DefectType {
  id: string;
  code: string;
  name: string;
  category: DefectCategory;
  severity: DefectSeverity;
  causeRetake: boolean;
  penalty: number;
  description: string;
}

export interface TechnicianStats {
  id: string;
  name: string;
  totalExams: number;
  passedExams: number;
  failedExams: number;
  retakeExams: number;
  passRate: number;
  retakeRate: number;
  avgScore: number;
  defectCount: Record<string, number>;
}

export interface RoomStats {
  id: string;
  name: string;
  totalExams: number;
  defectCount: Record<string, number>;
  topDefects: { name: string; count: number }[];
}

export type RectificationStatus = "pending" | "in_progress" | "completed";

export interface RectificationTask {
  id: string;
  title: string;
  relatedExamId: string;
  relatedExamPatientName: string;
  defectType: string;
  defectTypeId: string;
  responsible: string;
  responsibleId: string;
  createdAt: string;
  deadline: string;
  status: RectificationStatus;
  requirement: string;
  proof?: string;
  completedAt?: string;
  remark?: string;
}

export interface CaseStudy {
  id: string;
  examId: string;
  patientName: string;
  title: string;
  defectTypes: string[];
  description: string;
  teachingValue: string;
  createdAt: string;
  thumbnail: string;
  createdBy: string;
}

export interface ScoreItem {
  id: string;
  category: string;
  name: string;
  maxScore: number;
  description: string;
}

export interface TrendDataPoint {
  date: string;
  passRate: number;
  retakeRate: number;
  examCount: number;
}

export interface NotificationSettings {
  retakeAlert: boolean;
  recheckNotify: boolean;
  rectificationReminder: boolean;
  dailyReport: boolean;
  notifyMethod: ("site" | "email" | "sms")[];
}

export interface User {
  id: string;
  name: string;
  role: "admin" | "qc" | "technician" | "director";
  roleName: string;
}
