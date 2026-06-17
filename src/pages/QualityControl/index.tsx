import { useState, useMemo, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  InputNumber,
  Radio,
  Form,
  Input,
  Select,
  Alert,
  Divider,
  Modal,
  message,
  Steps,
  Descriptions,
  Badge,
  Tooltip,
  Collapse,
  Timeline,
} from "antd";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Save,
  Send,
  RotateCcw,
  FileText,
  ImageIcon,
  Layers,
  User,
  MapPin,
  Clock,
  BookOpen,
  RefreshCw,
  Info,
  Settings,
  History,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQCStore, getStatusText, getStatusColor, getDefectName, getPositionMissing } from "@/store";
import type { Examination, DefectType, RecheckHistoryItem } from "@/types";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const actionTypeMap: Record<string, { text: string; color: string; icon: any }> = {
  request: { text: "发起复核", color: "blue", icon: Send },
  process: { text: "复核处理", color: "green", icon: CheckCircle2 },
  re_submit: { text: "重新提交", color: "orange", icon: RefreshCw },
  final_pass: { text: "最终通过", color: "green", icon: CheckCircle2 },
};

const resultTypeMap: Record<string, { text: string; color: string }> = {
  passed: { text: "复核通过", color: "success" },
  retake: { text: "退回重拍", color: "error" },
  supplement: { text: "需补充说明", color: "warning" },
};

export default function QualityControl() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    examinations,
    defectTypes,
    scoreItems,
    positionRules,
    updateExamination,
    getExamById,
    currentUser,
    addRecheckHistory,
  } = useQCStore();

  const [currentExam, setCurrentExam] = useState<Examination | null>(null);
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [needRetake, setNeedRetake] = useState(false);
  const [retakeType, setRetakeType] = useState<"equipment" | "operation">("operation");
  const [retakeReason, setRetakeReason] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [recheckRequested, setRecheckRequested] = useState(false);
  const [rechecker, setRechecker] = useState("");
  const [recheckOpinion, setRecheckOpinion] = useState("");
  const [remark, setRemark] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [submitModal, setSubmitModal] = useState(false);
  const [submitType, setSubmitType] = useState<"pass" | "fail" | "recheck">("pass");

  useEffect(() => {
    if (id) {
      const exam = getExamById(id);
      if (exam) {
        setCurrentExam(exam);
        setSelectedDefects(exam.defects);
        setNeedRetake(exam.needRetake);
        if (exam.retakeType) setRetakeType(exam.retakeType);
        if (exam.retakeReason) setRetakeReason(exam.retakeReason);
        setRecheckRequested(exam.recheckRequested);
        if (exam.rechecker) setRechecker(exam.rechecker);
        if (exam.recheckOpinion) setRecheckOpinion(exam.recheckOpinion);
        if (exam.remark) setRemark(exam.remark);

        const hasExistingScore = exam.score > 0 || exam.originalScore !== undefined;
        if (hasExistingScore) {
          const baseScore = exam.originalScore ?? exam.score;
          const totalMax = scoreItems.reduce((sum, item) => sum + item.maxScore, 0);
          const perItem = Math.floor(baseScore / scoreItems.length);
          const scoreMap: Record<string, number> = {};
          scoreItems.forEach((item, idx) => {
            if (idx === scoreItems.length - 1) {
              scoreMap[item.id] = baseScore - perItem * (scoreItems.length - 1);
            } else {
              scoreMap[item.id] = perItem;
            }
          });
          setScores(scoreMap);
        } else {
          const scoreMap: Record<string, number> = {};
          scoreItems.forEach((item) => {
            scoreMap[item.id] = item.maxScore;
          });
          setScores(scoreMap);
        }
      }
    } else if (examinations.length > 0) {
      const pendingExam = examinations.find((e) => e.status === "qc_pending");
      if (pendingExam) {
        navigate(`/quality/${pendingExam.id}`, { replace: true });
      }
    }
  }, [id, examinations, scoreItems]);

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((sum, s) => sum + (s || 0), 0);
  }, [scores]);

  const totalMaxScore = useMemo(() => {
    return scoreItems.reduce((sum, item) => sum + item.maxScore, 0);
  }, [scoreItems]);

  const groupedDefects = useMemo(() => {
    const groups: Record<string, DefectType[]> = {
      position: [],
      image: [],
      marker: [],
    };
    defectTypes.forEach((d) => {
      groups[d.category].push(d);
    });
    return groups;
  }, [defectTypes]);

  const toggleDefect = (defectId: string) => {
    setSelectedDefects((prev) => {
      if (prev.includes(defectId)) {
        return prev.filter((id) => id !== defectId);
      }
      return [...prev, defectId];
    });
  };

  const handleScoreChange = (itemId: string, value: number | null) => {
    setScores((prev) => ({
      ...prev,
      [itemId]: value || 0,
    }));
  };

  const handleSubmit = (type: "pass" | "fail" | "recheck") => {
    setSubmitType(type);
    setSubmitModal(true);
  };

  const confirmSubmit = () => {
    if (!currentExam) return;

    let newStatus: Examination["status"] = currentExam.status;
    let finalRecheckRequested = recheckRequested;
    let finalRechecker = rechecker;
    let finalRecheckOpinion = recheckOpinion;
    
    let originalScore = currentExam.originalScore;
    let originalDefects = currentExam.originalDefects;
    
    const isFirstTimeRecheck = (submitType === "recheck" || (submitType === "pass" && finalRecheckRequested)) && !originalScore;
    if (isFirstTimeRecheck) {
      originalScore = currentExam.score > 0 ? currentExam.score : totalScore;
      originalDefects = currentExam.defects.length > 0 ? [...currentExam.defects] : [...selectedDefects];
    }

    if (submitType === "pass") {
      newStatus = finalRecheckRequested ? "rechecking" : "qc_passed";
    } else if (submitType === "fail") {
      newStatus = needRetake ? "retake" : "qc_failed";
    } else if (submitType === "recheck") {
      newStatus = "rechecking";
      finalRecheckRequested = true;
      if (!finalRechecker) {
        finalRechecker = currentUser.name;
      }
      if (!finalRecheckOpinion) {
        finalRecheckOpinion = "质控员发起二次复核，请上级质控人员审核";
      }
    }

    updateExamination(currentExam.id, {
      status: newStatus,
      defects: selectedDefects,
      originalDefects,
      needRetake,
      retakeType: needRetake ? retakeType : undefined,
      retakeReason: needRetake ? retakeReason : undefined,
      score: totalScore,
      originalScore,
      recheckRequested: finalRecheckRequested,
      recheckOpinion: finalRecheckOpinion,
      rechecker: finalRecheckRequested ? finalRechecker : currentExam.rechecker,
      recheckResult: currentExam.recheckResult,
      recheckRemark: currentExam.recheckRemark,
      recheckTime: currentExam.recheckTime,
      remark,
    });

    if (submitType === "recheck" || (submitType === "pass" && finalRecheckRequested)) {
      const isReSubmit = currentExam.recheckResult && currentExam.recheckResult !== "passed";
      addRecheckHistory(currentExam.id, {
        action: isReSubmit ? "re_submit" : "request",
        operator: currentUser.name,
        operatorRole: currentUser.roleName,
        time: dayjs().format("YYYY-MM-DD HH:mm"),
        remark: finalRecheckOpinion || "发起复核",
        score: totalScore,
      });
    }

    if (submitType === "pass" && !finalRecheckRequested && currentExam.recheckResult === "supplement") {
      addRecheckHistory(currentExam.id, {
        action: "re_submit",
        operator: currentUser.name,
        operatorRole: currentUser.roleName,
        time: dayjs().format("YYYY-MM-DD HH:mm"),
        remark: "补充说明后重新提交质控",
        score: totalScore,
      });
    }

    message.success(
      submitType === "pass"
        ? "质控通过已提交"
        : submitType === "fail"
        ? needRetake
          ? "已通知重拍"
          : "质控不通过已提交"
        : "已发起二次复核"
    );

    setSubmitModal(false);
    navigate("/queue");
  };

  if (!currentExam) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ImageIcon size={64} className="text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">请从检查队列选择需要质控的检查</p>
        <Button type="primary" onClick={() => navigate("/queue")}>
          前往检查队列
        </Button>
      </div>
    );
  }

  const categoryNames: Record<string, string> = {
    position: "体位问题",
    image: "图像质量",
    marker: "标识问题",
  };

  const hasCriticalDefect = selectedDefects.some((d) => {
    const def = defectTypes.find((dt) => dt.id === d);
    return def?.causeRetake;
  });

  return (
    <div className="space-y-4">
      {currentExam.recheckRequested && (
        <Alert
          message={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <RefreshCw
                  size={16}
                  className={`text-medical-orange ${currentExam.status === "rechecking" ? "animate-spin" : ""}`}
                />
                <span className="font-medium">
                  {currentExam.recheckResult
                    ? `复核已处理：${
                        currentExam.recheckResult === "passed"
                          ? "复核通过"
                          : currentExam.recheckResult === "retake"
                          ? "退回重拍"
                          : "需补充说明"
                      }`
                    : "当前处于复核流程中"}
                </span>
              </div>
              {currentExam.rechecker && (
                <span className="text-sm">
                  复核人：<span className="font-medium">{currentExam.rechecker}</span>
                </span>
              )}
            </div>
          }
          description={
            <div className="space-y-1 mt-1">
              {currentExam.recheckOpinion && (
                <div className="text-sm">复核说明：{currentExam.recheckOpinion}</div>
              )}
              {currentExam.originalScore !== undefined && (
                <div className="text-sm">
                  原质控评分：
                  <span className="font-medium text-medical-blue">
                    {currentExam.originalScore}分
                  </span>
                  {currentExam.recheckRemark && (
                    <span className="ml-4">复核意见：{currentExam.recheckRemark}</span>
                  )}
                </div>
              )}
            </div>
          }
          type="warning"
          showIcon={false}
          className="border border-orange-200"
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/queue")}
          >
            返回队列
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">图像质控</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              检查ID: {currentExam.id}
            </p>
          </div>
        </div>
        <Tag color={getStatusColor(currentExam.status)}>
          {getStatusText(currentExam.status)}
        </Tag>
      </div>

      <Card>
        <Descriptions column={4} size="small">
          <Descriptions.Item label="患者姓名">
            <span className="font-medium">{currentExam.patientName}</span>
          </Descriptions.Item>
          <Descriptions.Item label="患者ID">
            {currentExam.patientId}
          </Descriptions.Item>
          <Descriptions.Item label="性别年龄">
            {currentExam.patientGender} · {currentExam.patientAge}岁
          </Descriptions.Item>
          <Descriptions.Item label="检查时间">
            <span className="inline-flex items-center gap-1">
              <Clock size={12} className="text-gray-400" />
              {currentExam.examTime}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="技师">
            <span className="inline-flex items-center gap-1">
              <User size={12} className="text-gray-400" />
              {currentExam.technician}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="机房">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-gray-400" />
              {currentExam.room}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="质控评分">
            <>
              <span
                className={`font-bold ${
                  totalScore >= 85
                    ? "text-medical-green"
                    : totalScore >= 70
                    ? "text-medical-orange"
                    : "text-medical-red"
                }`}
              >
                {totalScore}
              </span>
              <span className="text-gray-400 text-sm"> / {totalMaxScore}分</span>
              {currentExam.originalScore !== undefined && (
                <Tag color="default" className="ml-2" style={{ margin: 0 }}>
                  原评分 {currentExam.originalScore}分
                </Tag>
              )}
            </>
          </Descriptions.Item>
          <Descriptions.Item label="已标记缺陷">
            <span
              className={
                selectedDefects.length > 0 ? "text-medical-red font-medium" : ""
              }
            >
              {selectedDefects.length} 项
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {(() => {
        const positionRuleList = [
          { key: "ccLeftRequired", name: "CC位（左）" },
          { key: "ccRightRequired", name: "CC位（右）" },
          { key: "mloLeftRequired", name: "MLO位（左）" },
          { key: "mloRightRequired", name: "MLO位（右）" },
          { key: "leftMarkerRequired", name: "左侧标识 (L)" },
          { key: "rightMarkerRequired", name: "右侧标识 (R)" },
          { key: "ccMloPairRequired", name: "CC/MLO成套" },
        ];
        
        const disabledRules = positionRuleList.filter(
          (r) => !positionRules[r.key as keyof typeof positionRules]
        );
        const enabledCount = positionRuleList.length - disabledRules.length;

        return (
          <Collapse
            size="small"
            ghost
            defaultActiveKey={disabledRules.length > 0 ? ["rules"] : []}
            items={[
              {
                key: "rules",
                label: (
                  <div className="flex items-center gap-2">
                    <Settings size={16} className="text-gray-500" />
                    <span className="font-medium">当前质控规则</span>
                    <Badge
                      count={`${enabledCount}/${positionRuleList.length} 生效`}
                      style={{ backgroundColor: "#52c41a" }}
                    />
                    {disabledRules.length > 0 && (
                      <Tag color="warning" className="ml-2">
                        {disabledRules.length} 项已关闭
                      </Tag>
                    )}
                  </div>
                ),
                children: (
                  <div className="space-y-3 pl-6">
                    {disabledRules.length > 0 && (
                      <Alert
                        message="以下规则已关闭，质控时不会提示对应缺失项"
                        type="warning"
                        showIcon
                        icon={<Info size={16} />}
                      />
                    )}
                    <Row gutter={[8, 8]}>
                      {positionRuleList.map((rule) => {
                        const isEnabled = positionRules[rule.key as keyof typeof positionRules];
                        return (
                          <Col xs={12} sm={8} md={6} lg={4} key={rule.key}>
                            <div
                              className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                                isEnabled
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-100 border-gray-200 opacity-60"
                              }`}
                            >
                              {isEnabled ? (
                                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle size={14} className="text-gray-400 flex-shrink-0" />
                              )}
                              <span className={isEnabled ? "text-gray-700" : "text-gray-500 line-through"}>
                                {rule.name}
                              </span>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                    {disabledRules.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <span className="text-medical-orange font-medium">注意：</span>
                        已关闭的规则：
                        {disabledRules.map((r) => r.name).join("、")}
                        。如需修改，请前往
                        <Button
                          type="link"
                          size="small"
                          className="p-0 h-auto text-xs"
                          onClick={() => navigate("/settings/rules")}
                        >
                          规则设置
                        </Button>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
            className="border border-gray-200 rounded-lg bg-white overflow-hidden"
          />
        );
      })()}

      {currentExam && currentExam.recheckHistory && currentExam.recheckHistory.length > 0 && (
        <Collapse
          size="small"
          ghost
          defaultActiveKey={["recheck-history"]}
          items={[
            {
              key: "recheck-history",
              label: (
                <div className="flex items-center gap-2">
                  <History size={16} className="text-medical-blue" />
                  <span className="font-medium">复核历史记录</span>
                  <Badge
                    count={currentExam.recheckHistory.length}
                    style={{ backgroundColor: "#1890ff" }}
                  />
                </div>
              ),
              children: (
                <div className="pl-6">
                  {(() => {
                    const history = currentExam.recheckHistory || [];
                    const sortedHistory = [...history].sort(
                      (a, b) =>
                        new Date(a.time).getTime() - new Date(b.time).getTime()
                    );

                    return (
                      <Timeline
                        items={sortedHistory.map((item) => {
                          const config = actionTypeMap[item.action] || {
                            text: item.action,
                            color: "blue",
                            icon: History,
                          };
                          const Icon = config.icon;
                          let color = "blue";
                          if (item.result === "passed") color = "green";
                          if (item.result === "retake") color = "red";
                          if (item.result === "supplement") color = "orange";

                          return {
                            color: color as any,
                            dot: <Icon size={16} />,
                            children: (
                              <div className="pb-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-800">
                                    {config.text}
                                  </span>
                                  {item.result && (
                                    <Tag
                                      color={
                                        resultTypeMap[item.result]?.color ||
                                        "default"
                                      }
                                      style={{ margin: 0 }}
                                    >
                                      {resultTypeMap[item.result]?.text ||
                                        item.result}
                                    </Tag>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  操作人：{item.operator}
                                  {item.operatorRole &&
                                    `（${item.operatorRole}）`}
                                </div>
                                {item.score !== undefined && (
                                  <div className="text-sm text-gray-600">
                                    当时评分：
                                    <span className="font-medium text-medical-blue">
                                      {item.score}分
                                    </span>
                                  </div>
                                )}
                                {item.remark && (
                                  <div className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                                    {item.remark}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">
                                  {item.time}
                                </div>
                              </div>
                            ),
                          };
                        })}
                      />
                    );
                  })()}
                </div>
              ),
            },
          ]}
          className="border border-blue-200 rounded-lg bg-blue-50/30 overflow-hidden"
        />
      )}

      <Steps
        current={currentStep}
        onChange={setCurrentStep}
        items={[
          { title: "体位核对", icon: <Layers size={16} /> },
          { title: "缺陷标记", icon: <AlertTriangle size={16} /> },
          { title: "质控评分", icon: <FileText size={16} /> },
          { title: "提交审核", icon: <Send size={16} /> },
        ]}
        className="bg-white p-4 rounded-lg shadow-card"
      />

      {currentStep === 0 && (
        <Card title="体位与标识自动核对" extra={<Tag color="blue">系统自动检测</Tag>}>
          <Alert
            message="系统已自动完成体位与标识初步核对，如有误判请手动调整。可在规则设置中临时关闭某项检查。"
            type="info"
            showIcon
            className="mb-4"
          />
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Layers size={18} /> 体位完整性
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "ccLeft", label: "CC位（左）", ruleKey: "ccLeftRequired" as const },
                    { key: "ccRight", label: "CC位（右）", ruleKey: "ccRightRequired" as const },
                    { key: "mloLeft", label: "MLO位（左）", ruleKey: "mloLeftRequired" as const },
                    { key: "mloRight", label: "MLO位（右）", ruleKey: "mloRightRequired" as const },
                  ].map((item) => {
                    const ruleEnabled = positionRules[item.ruleKey];
                    const ok = currentExam.positions[item.key as keyof typeof currentExam.positions];
                    const showMissing = ruleEnabled && !ok;
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          !ruleEnabled
                            ? "border-gray-200 bg-gray-100 opacity-60"
                            : ok
                            ? "border-green-200 bg-green-50"
                            : "border-red-200 bg-red-50 animate-pulse"
                        }`}
                      >
                        {!ruleEnabled ? (
                          <span className="text-gray-400 text-xs">已关闭</span>
                        ) : ok ? (
                          <CheckCircle2 size={20} className="text-medical-green" />
                        ) : (
                          <XCircle size={20} className="text-medical-red" />
                        )}
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              !ruleEnabled
                                ? "text-gray-400"
                                : ok
                                ? "text-gray-800"
                                : "text-medical-red"
                            }`}
                          >
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {!ruleEnabled ? "规则已关闭" : ok ? "已拍摄" : "缺失，请确认"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const missingInfo = getPositionMissing(currentExam, positionRules);
                  const positionMissing = missingInfo.filter(
                    (m) => m.ruleKey !== "leftMarkerRequired" && m.ruleKey !== "rightMarkerRequired"
                  );
                  if (positionMissing.length === 0) return null;
                  return (
                    <div className="mt-4 space-y-2">
                      {positionMissing.map((item) => (
                        <Alert
                          key={item.ruleKey}
                          message={`${item.ruleName}：${item.missing.join("、")}`}
                          type={item.ruleKey === "ccMloPairRequired" ? "warning" : "error"}
                          showIcon
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Layers size={18} /> 左右侧标识
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "left", label: "左侧标识 (L)", present: currentExam.leftMarkerPresent, ruleKey: "leftMarkerRequired" as const },
                    { key: "right", label: "右侧标识 (R)", present: currentExam.rightMarkerPresent, ruleKey: "rightMarkerRequired" as const },
                  ].map((item) => {
                    const ruleEnabled = positionRules[item.ruleKey];
                    const showMissing = ruleEnabled && !item.present;
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          !ruleEnabled
                            ? "border-gray-200 bg-gray-100 opacity-60"
                            : item.present
                            ? "border-green-200 bg-green-50"
                            : "border-red-200 bg-red-50 animate-pulse"
                        }`}
                      >
                        {!ruleEnabled ? (
                          <span className="text-gray-400 text-xs">已关闭</span>
                        ) : item.present ? (
                          <CheckCircle2 size={20} className="text-medical-green" />
                        ) : (
                          <XCircle size={20} className="text-medical-red" />
                        )}
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              !ruleEnabled
                                ? "text-gray-400"
                                : item.present
                                ? "text-gray-800"
                                : "text-medical-red"
                            }`}
                          >
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {!ruleEnabled ? "规则已关闭" : item.present ? "标识正确" : "标识缺失或错误"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {positionRules.leftMarkerRequired &&
                  positionRules.rightMarkerRequired &&
                  (!currentExam.leftMarkerPresent || !currentExam.rightMarkerPresent) && (
                    <Alert
                      message="左右侧标识存在问题，必须在缺陷标记中记录"
                      type="warning"
                      showIcon
                      className="mt-4"
                    />
                  )}
              </div>
            </Col>
          </Row>
          <div className="flex justify-end mt-6">
            <Button type="primary" onClick={() => setCurrentStep(1)}>
              下一步：标记缺陷
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <Card
          title="质量缺陷标记"
          extra={
            <Space>
              <Button onClick={() => setSelectedDefects([])}>清空选择</Button>
              <Tag color="red">已选 {selectedDefects.length} 项</Tag>
            </Space>
          }
        >
          {hasCriticalDefect && (
            <Alert
              message="已选择导致重拍的缺陷项，请确认是否标记为重拍"
              type="warning"
              showIcon
              className="mb-4"
            />
          )}
          <div className="space-y-6">
            {Object.entries(groupedDefects).map(([category, defects]) => (
              <div key={category}>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2 pb-2 border-b">
                  <span className="w-1 h-4 bg-medical-blue rounded" />
                  {categoryNames[category]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {defects.map((defect) => {
                    const selected = selectedDefects.includes(defect.id);
                    return (
                      <Tooltip key={defect.id} title={defect.description}>
                        <div
                          onClick={() => toggleDefect(defect.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selected
                              ? defect.causeRetake
                                ? "border-red-400 bg-red-50"
                                : "border-medical-blue bg-blue-50"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-800">
                                  {defect.name}
                                </span>
                                {defect.causeRetake && (
                                  <Tag color="red" style={{ margin: 0 }}>
                                    需重拍
                                  </Tag>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {defect.code} ·{" "}
                                {defect.severity === "critical"
                                  ? "严重"
                                  : defect.severity === "major"
                                  ? "较重"
                                  : "轻微"}
                              </p>
                            </div>
                            {selected && (
                              <CheckCircle2
                                size={20}
                                className={
                                  defect.causeRetake
                                    ? "text-medical-red"
                                    : "text-medical-blue"
                                }
                              />
                            )}
                          </div>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selectedDefects.length > 0 && (
            <>
              <Divider />
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-medium text-gray-700">是否需要重拍？</span>
                  <Radio.Group
                    value={needRetake}
                    onChange={(e) => setNeedRetake(e.target.value)}
                  >
                    <Radio value={false}>否</Radio>
                    <Radio value={true}>是</Radio>
                  </Radio.Group>
                </div>
                {needRetake && (
                  <div className="space-y-3 ml-0">
                    <div>
                      <span className="text-sm text-gray-600 mb-1.5 block">
                        重拍原因分类
                      </span>
                      <Radio.Group
                        value={retakeType}
                        onChange={(e) => setRetakeType(e.target.value)}
                      >
                        <Radio value="operation">操作问题</Radio>
                        <Radio value="equipment">设备问题</Radio>
                      </Radio.Group>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 mb-1.5 block">
                        重拍具体原因
                      </span>
                      <TextArea
                        rows={2}
                        placeholder="请输入具体重拍原因..."
                        value={retakeReason}
                        onChange={(e) => setRetakeReason(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-between mt-6">
            <Button onClick={() => setCurrentStep(0)}>上一步</Button>
            <Button type="primary" onClick={() => setCurrentStep(2)}>
              下一步：质控评分
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card
          title="院内质控评分表"
          extra={
            <div className="text-lg font-bold">
              <span
                className={
                  totalScore >= 85
                    ? "text-medical-green"
                    : totalScore >= 70
                    ? "text-medical-orange"
                    : "text-medical-red"
                }
              >
                {totalScore}
              </span>
              <span className="text-gray-400 text-base font-normal">
                {" "}
                / {totalMaxScore}分
              </span>
            </div>
          }
        >
          <div className="space-y-6">
            {["体位规范", "图像质量"].map((category) => {
              const items = scoreItems.filter((i) => i.category === category);
              const categoryMax = items.reduce((s, i) => s + i.maxScore, 0);
              const categoryScore = items.reduce(
                (s, i) => s + (scores[i.id] || 0),
                0
              );
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b">
                    <h3 className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-1 h-4 bg-medical-blue rounded" />
                      {category}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {categoryScore} / {categoryMax}分
                    </span>
                  </div>
                  <Row gutter={[16, 16]}>
                    {items.map((item) => (
                      <Col xs={24} md={12} key={item.id}>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                          <InputNumber
                            min={0}
                            max={item.maxScore}
                            value={scores[item.id]}
                            onChange={(v) => handleScoreChange(item.id, v)}
                            size="small"
                            addonAfter={`/${item.maxScore}`}
                            style={{ width: 110 }}
                          />
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              );
            })}
          </div>

          <Divider />

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <BookOpen size={16} />
                  是否发起二次复核？
                </span>
                <Radio.Group
                  value={recheckRequested}
                  onChange={(e) => setRecheckRequested(e.target.value)}
                >
                  <Radio value={false}>否</Radio>
                  <Radio value={true}>是</Radio>
                </Radio.Group>
              </div>
              {recheckRequested && (
                <Row gutter={[16, 16]} className="ml-0">
                  <Col xs={24} md={12}>
                    <span className="text-sm text-gray-600 mb-1.5 block">
                      复核人
                    </span>
                    <Select
                      placeholder="请选择复核人"
                      value={rechecker}
                      onChange={setRechecker}
                      style={{ width: "100%" }}
                    >
                      <Option value="质控员王主任">质控员王主任</Option>
                      <Option value="李副主任">李副主任</Option>
                      <Option value="张主任医师">张主任医师</Option>
                    </Select>
                  </Col>
                  <Col xs={24}>
                    <span className="text-sm text-gray-600 mb-1.5 block">
                      复核意见/说明
                    </span>
                    <TextArea
                      rows={2}
                      placeholder="请说明需要复核的原因..."
                      value={recheckOpinion}
                      onChange={(e) => setRecheckOpinion(e.target.value)}
                    />
                  </Col>
                </Row>
              )}
            </div>

            <div>
              <span className="text-sm text-gray-600 mb-1.5 block">备注（选填）</span>
              <TextArea
                rows={2}
                placeholder="其他需要说明的内容..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button onClick={() => setCurrentStep(1)}>上一步</Button>
            <Button type="primary" onClick={() => setCurrentStep(3)}>
              下一步：提交审核
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <Card title="提交审核确认">
          <div className="max-w-2xl mx-auto py-6">
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">质控总分</span>
                <span
                  className={`font-bold text-lg ${
                    totalScore >= 85
                      ? "text-medical-green"
                      : totalScore >= 70
                      ? "text-medical-orange"
                      : "text-medical-red"
                  }`}
                >
                  {totalScore} / {totalMaxScore}分
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">标记缺陷</span>
                <span>
                  {selectedDefects.length > 0 ? (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {selectedDefects.map((d) => (
                        <Tag
                          key={d}
                          color={
                            defectTypes.find((dt) => dt.id === d)?.causeRetake
                              ? "red"
                              : "orange"
                          }
                        >
                          {getDefectName(d, defectTypes)}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">无</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">是否需要重拍</span>
                <Tag color={needRetake ? "red" : "green"} style={{ margin: 0 }}>
                  {needRetake
                    ? `是（${retakeType === "operation" ? "操作问题" : "设备问题"}）`
                    : "否"}
                </Tag>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">二次复核</span>
                <Tag color={recheckRequested ? "orange" : "default"} style={{ margin: 0 }}>
                  {recheckRequested ? `是（${rechecker || "待指定"}）` : "否"}
                </Tag>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button onClick={() => setCurrentStep(2)}>返回修改</Button>
              {totalScore >= 70 && selectedDefects.filter((d) => defectTypes.find((dt) => dt.id === d)?.causeRetake).length === 0 && (
                <Button
                  type="primary"
                  icon={<CheckCircle2 size={16} />}
                  onClick={() => handleSubmit("pass")}
                >
                  质控通过
                </Button>
              )}
              <Button
                danger
                icon={<RotateCcw size={16} />}
                onClick={() => handleSubmit("fail")}
              >
                {needRetake ? "通知重拍" : "质控不通过"}
              </Button>
              <Button
                icon={<Send size={16} />}
                onClick={() => handleSubmit("recheck")}
              >
                发起复核
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Modal
        title="确认提交"
        open={submitModal}
        onOk={confirmSubmit}
        onCancel={() => setSubmitModal(false)}
        okText="确认提交"
        cancelText="取消"
      >
        <p>
          确定要提交该检查的质控结果吗？提交后状态将变更为：
          <Tag
            color={
              submitType === "pass"
                ? "success"
                : submitType === "fail"
                ? "error"
                : "warning"
            }
            className="ml-2"
          >
            {submitType === "pass"
              ? recheckRequested
                ? "复核中"
                : "质控通过"
              : submitType === "fail"
              ? needRetake
                ? "需重拍"
                : "质控不通过"
              : "复核中"}
          </Tag>
        </p>
      </Modal>
    </div>
  );
}
