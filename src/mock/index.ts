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
} from "@/types";
import dayjs from "dayjs";

const technicians = [
  { id: "t1", name: "张技师" },
  { id: "t2", name: "李技师" },
  { id: "t3", name: "王技师" },
  { id: "t4", name: "赵技师" },
  { id: "t5", name: "陈技师" },
];

const rooms = [
  { id: "r1", name: "DR机房1" },
  { id: "r2", name: "DR机房2" },
  { id: "r3", name: "DR机房3" },
];

const patientNames = [
  "王秀兰", "李桂英", "张淑珍", "刘淑华", "陈秀珍",
  "杨淑英", "赵秀华", "黄桂兰", "周淑珍", "吴秀兰",
  "徐桂英", "孙淑华", "马秀珍", "朱桂兰", "胡淑珍",
  "郭秀英", "何淑华", "高秀兰", "林桂英", "罗淑珍",
];

export const defectTypes: DefectType[] = [
  {
    id: "d1",
    code: "P001",
    name: "CC体位缺失",
    category: "position",
    severity: "critical",
    causeRetake: true,
    description: "头尾位(CC)拍摄不完整或缺失",
  },
  {
    id: "d2",
    code: "P002",
    name: "MLO体位缺失",
    category: "position",
    severity: "critical",
    causeRetake: true,
    description: "内外斜位(MLO)拍摄不完整或缺失",
  },
  {
    id: "d3",
    code: "M001",
    name: "左侧标识缺失",
    category: "marker",
    severity: "major",
    causeRetake: true,
    description: "图像左侧(L)标识未显示或位置错误",
  },
  {
    id: "d4",
    code: "M002",
    name: "右侧标识缺失",
    category: "marker",
    severity: "major",
    causeRetake: true,
    description: "图像右侧(R)标识未显示或位置错误",
  },
  {
    id: "d5",
    code: "I001",
    name: "皮肤皱褶",
    category: "image",
    severity: "minor",
    causeRetake: false,
    description: "皮肤皱褶影响图像诊断质量",
  },
  {
    id: "d6",
    code: "I002",
    name: "乳头未侧位显示",
    category: "image",
    severity: "major",
    causeRetake: true,
    description: "乳头未在切线位显示，可能遮挡病变",
  },
  {
    id: "d7",
    code: "I003",
    name: "胸大肌显示不足",
    category: "image",
    severity: "major",
    causeRetake: false,
    description: "MLO位胸大肌未显示至乳头线或显示不充分",
  },
  {
    id: "d8",
    code: "I004",
    name: "乳房后组织覆盖不足",
    category: "image",
    severity: "major",
    causeRetake: true,
    description: "乳房后部组织未充分显示，可能遗漏深部病变",
  },
  {
    id: "d9",
    code: "I005",
    name: "图像伪影",
    category: "image",
    severity: "minor",
    causeRetake: false,
    description: "设备或运动导致的图像伪影",
  },
  {
    id: "d10",
    code: "I006",
    name: "曝光不足/过度",
    category: "image",
    severity: "major",
    causeRetake: true,
    description: "图像曝光条件不当，影响对比度和细节显示",
  },
];

const statuses: Examination["status"][] = [
  "qc_pending",
  "qc_passed",
  "qc_failed",
  "rechecking",
  "retake",
  "completed",
];

function randomPositions(): Examination["positions"] {
  const r = Math.random();
  if (r > 0.9) {
    return { ccLeft: true, ccRight: true, mloLeft: false, mloRight: true };
  }
  if (r > 0.8) {
    return { ccLeft: true, ccRight: false, mloLeft: true, mloRight: true };
  }
  return { ccLeft: true, ccRight: true, mloLeft: true, mloRight: true };
}

function randomDefects(status: Examination["status"]): string[] {
  if (status === "qc_passed" || status === "completed") {
    return Math.random() > 0.7 ? ["d5"] : [];
  }
  if (status === "qc_failed" || status === "retake") {
    const possible = ["d2", "d4", "d5", "d6", "d7", "d8", "d10"];
    const count = Math.floor(Math.random() * 2) + 1;
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const pick = possible[Math.floor(Math.random() * possible.length)];
      if (!result.includes(pick)) result.push(pick);
    }
    return result;
  }
  if (status === "rechecking") {
    return ["d7", "d8"];
  }
  return [];
}

export const mockExaminations: Examination[] = Array.from({ length: 35 }, (_, i) => {
  const tech = technicians[i % technicians.length];
  const room = rooms[i % rooms.length];
  const status = statuses[i % statuses.length];
  const defects = randomDefects(status);
  const positions = randomPositions();
  const needRetake = status === "retake" || (defects.some(d => {
    const def = defectTypes.find(dt => dt.id === d);
    return def?.causeRetake;
  }) && status === "qc_failed");

  const exam = {
    id: `exam-${1000 + i}`,
    patientId: `P${2024000 + i}`,
    patientName: patientNames[i % patientNames.length],
    patientAge: 35 + Math.floor(Math.random() * 30),
    patientGender: "女" as const,
    examTime: dayjs()
      .subtract(Math.floor(i / 5), "day")
      .hour(8 + (i % 10))
      .minute((i * 7) % 60)
      .format("YYYY-MM-DD HH:mm"),
    technician: tech.name,
    technicianId: tech.id,
    room: room.name,
    roomId: room.id,
    positions,
    leftMarkerPresent: !(defects.includes("d3")),
    rightMarkerPresent: !(defects.includes("d4")),
    status,
    score: status === "qc_passed" || status === "completed" ? 85 + Math.floor(Math.random() * 15) :
           status === "qc_pending" || status === "rechecking" ? 0 :
           55 + Math.floor(Math.random() * 25),
    defects,
    needRetake,
    retakeType: needRetake ? (Math.random() > 0.4 ? "operation" : "equipment") as const : undefined,
    retakeReason: needRetake ? (Math.random() > 0.4 ? "体位不标准，需要重新拍摄" : "设备伪影影响诊断") : undefined,
    recheckRequested: status === "rechecking" || Math.random() > 0.85,
    recheckOpinion: status === "completed" ? "图像质量可接受，同意诊断报告" : undefined,
    rechecker: status === "completed" ? "质控员王主任" : undefined,
  };
  return exam;
});

export const mockTechnicianStats: TechnicianStats[] = technicians.map((tech, idx) => {
  const total = 80 + idx * 15;
  const retake = 3 + idx * 2;
  const failed = 5 + idx * 2;
  return {
    id: tech.id,
    name: tech.name,
    totalExams: total,
    passedExams: total - failed,
    failedExams: failed,
    retakeExams: retake,
    passRate: Math.round(((total - failed) / total) * 1000) / 10,
    retakeRate: Math.round((retake / total) * 1000) / 10,
    avgScore: 82 + idx * 2,
    defectCount: {
      d5: 8 + idx,
      d7: 5 + idx,
      d6: 2 + idx,
      d8: 3 + idx,
    },
  };
});

export const mockRoomStats: RoomStats[] = rooms.map((room, idx) => ({
  id: room.id,
  name: room.name,
  totalExams: 100 + idx * 30,
  defectCount: {
    d5: 10 + idx * 2,
    d7: 6 + idx * 3,
    d8: 4 + idx,
    d9: idx + 1,
  },
  topDefects: [
    { name: "皮肤皱褶", count: 10 + idx * 2 },
    { name: "胸大肌显示不足", count: 6 + idx * 3 },
    { name: "乳房后组织覆盖不足", count: 4 + idx },
  ],
}));

export const mockTrendData: TrendDataPoint[] = Array.from({ length: 14 }, (_, i) => ({
  date: dayjs().subtract(13 - i, "day").format("MM-DD"),
  passRate: 88 + Math.sin(i / 2) * 4 + Math.random() * 2,
  retakeRate: 5 + Math.cos(i / 3) * 2 + Math.random() * 1,
  examCount: 20 + Math.floor(Math.random() * 15),
}));

export const mockRectificationTasks: RectificationTask[] = [
  {
    id: "rt1",
    title: "CC体位拍摄标准化整改",
    relatedExamId: "exam-1001",
    relatedExamPatientName: "李桂英",
    defectType: "CC体位缺失",
    defectTypeId: "d1",
    responsible: "张技师",
    responsibleId: "t1",
    createdAt: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
    deadline: dayjs().add(3, "day").format("YYYY-MM-DD"),
    status: "in_progress",
    requirement: "组织CC体位标准化培训，确保每位技师掌握正确拍摄方法，一周内完成考核",
    remark: "已完成培训材料准备",
  },
  {
    id: "rt2",
    title: "DR机房2设备伪影排查",
    relatedExamId: "exam-1005",
    relatedExamPatientName: "陈秀珍",
    defectType: "图像伪影",
    defectTypeId: "d9",
    responsible: "设备科李工",
    responsibleId: "e1",
    createdAt: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
    deadline: dayjs().add(5, "day").format("YYYY-MM-DD"),
    status: "pending",
    requirement: "对DR机房2设备进行全面检测，查找伪影产生原因并修复",
  },
  {
    id: "rt3",
    title: "乳头侧位显示操作规范",
    relatedExamId: "exam-1008",
    relatedExamPatientName: "周淑珍",
    defectType: "乳头未侧位显示",
    defectTypeId: "d6",
    responsible: "李技师",
    responsibleId: "t2",
    createdAt: dayjs().subtract(5, "day").format("YYYY-MM-DD"),
    deadline: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
    status: "completed",
    requirement: "学习乳头切线位拍摄操作规范，提交10例合格体位图像验证",
    proof: "已提交12例合格图像，考核通过",
    completedAt: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
  },
];

export const mockCaseStudies: CaseStudy[] = [
  {
    id: "c1",
    examId: "exam-1003",
    patientName: "张淑珍",
    title: "MLO位胸大肌显示不足典型案例",
    defectTypes: ["d7", "d8"],
    description: "该病例MLO体位胸大肌仅显示上1/3，未达乳头连线水平，乳房后间隙组织显示不充分。患者体型较瘦，乳房偏小，技师在加压时未能充分牵拉胸大肌。",
    teachingValue: "对于小乳房患者，MLO位拍摄时应注意：1. 调整机架角度与胸壁平行；2. 充分牵拉胸大肌后再加压；3. 确保乳房后缘紧贴探测器。",
    createdAt: "2024-06-10",
    thumbnail: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=breast%20mammography%20xray%20image%20medical%20scan%20grayscale&image_size=square",
    createdBy: "质控员王主任",
  },
  {
    id: "c2",
    examId: "exam-1007",
    patientName: "赵秀华",
    title: "CC位乳头未显示在切线位",
    defectTypes: ["d6"],
    description: "CC位图像乳头未在切线位显示，呈投影于乳腺组织内表现，可能遮挡乳头后方病变。原因是技师在定位时未能将乳头调整至切线方向。",
    teachingValue: "CC位拍摄要点：1. 患者乳房尽量前伸；2. 乳头调整至切线位，可从侧面观察确认；3. 适当牵拉外侧和内侧组织使乳房充分展平。",
    createdAt: "2024-06-08",
    thumbnail: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20breast%20cc%20position%20xray%20imaging%20grayscale&image_size=square",
    createdBy: "质控员王主任",
  },
  {
    id: "c3",
    examId: "exam-1012",
    patientName: "孙淑华",
    title: "皮肤皱褶导致的假阳性征象",
    defectTypes: ["d5"],
    description: "该病例皮肤皱褶重叠于乳腺外上象限，形成类似结构扭曲的假阳性征象，可能导致误诊。皱褶产生原因是皮肤未充分展平。",
    teachingValue: "预防皮肤皱褶：1. 拍摄前用手抚平皮肤；2. 加压时缓慢均匀；3. 注意皮肤牵拉方向与皱褶垂直；4. 肥胖患者特别注意皱褶区域。",
    createdAt: "2024-06-05",
    thumbnail: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20imaging%20breast%20xray%20with%20skin%20fold%20artifact&image_size=square",
    createdBy: "质控员王主任",
  },
  {
    id: "c4",
    examId: "exam-1015",
    patientName: "马秀珍",
    title: "双侧标识缺失的严重错误",
    defectTypes: ["d3", "d4"],
    description: "该病例CC位双侧图像均未粘贴左右标识，无法判断图像左右侧，属于严重质控缺陷，必须重拍。可能原因是技师操作流程疏漏。",
    teachingValue: "体位标识规范：1. 养成拍摄前放置标识的习惯；2. 使用标准化核对清单；3. 拍摄后立即确认标识存在且位置正确；4. 建立双人核对机制。",
    createdAt: "2024-06-02",
    thumbnail: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20xray%20film%20with%20left%20right%20marker%20radiology&image_size=square",
    createdBy: "质控员王主任",
  },
];

export const mockScoreItems: ScoreItem[] = [
  { id: "s1", category: "体位规范", name: "CC体位标准", maxScore: 15, description: "头尾位拍摄是否标准规范" },
  { id: "s2", category: "体位规范", name: "MLO体位标准", maxScore: 15, description: "内外斜位拍摄是否标准规范" },
  { id: "s3", category: "体位规范", name: "左右侧标识", maxScore: 10, description: "左右侧标识是否正确放置" },
  { id: "s4", category: "图像质量", name: "乳头切线显示", maxScore: 10, description: "乳头是否显示在切线位" },
  { id: "s5", category: "图像质量", name: "胸大肌显示", maxScore: 10, description: "胸大肌显示是否充分" },
  { id: "s6", category: "图像质量", name: "后组织覆盖", maxScore: 10, description: "乳房后组织是否充分覆盖" },
  { id: "s7", category: "图像质量", name: "无皮肤皱褶", maxScore: 10, description: "是否存在明显皮肤皱褶" },
  { id: "s8", category: "图像质量", name: "曝光条件", maxScore: 10, description: "曝光条件是否适当" },
  { id: "s9", category: "图像质量", name: "无图像伪影", maxScore: 10, description: "是否存在影响诊断的伪影" },
];

export const mockCurrentUser: User = {
  id: "admin1",
  name: "王质控",
  role: "qc",
  roleName: "质控员",
};
