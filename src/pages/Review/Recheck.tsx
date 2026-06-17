import { useState, useMemo } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Row,
  Col,
  Descriptions,
  message,
  Drawer,
  Avatar,
  Badge,
  Divider,
  Alert,
  Tabs,
  Timeline,
  Checkbox,
  DatePicker,
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  RefreshCw,
  Eye,
  History,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useQCStore, getStatusText, getStatusColor } from "@/store";
import type { Examination, RecheckResult, RecheckHistoryItem } from "@/types";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

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

export default function ReviewRecheck() {
  const navigate = useNavigate();
  const {
    examinations,
    processRecheck,
    currentUser,
    defectTypes,
    addRectificationTask,
    staff,
  } = useQCStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [processType, setProcessType] = useState<RecheckResult | null>(null);
  const [form] = Form.useForm();
  const [createRectification, setCreateRectification] = useState(false);
  const [rectificationForm] = Form.useForm();

  const pendingDirectorExams = useMemo(() => {
    return examinations.filter((e) => e.recheckRequested === true);
  }, [examinations]);

  const returnedExams = useMemo(() => {
    return examinations.filter((e) => {
      if (!e.recheckHistory || e.recheckHistory.length === 0) return false;
      const hasRetakeOrSupplement = e.recheckHistory.some(
        (h) => h.action === "process" && (h.result === "retake" || h.result === "supplement")
      );
      const hasReSubmit = e.recheckHistory.some((h) => h.action === "re_submit");
      return hasRetakeOrSupplement && !hasReSubmit && !e.recheckRequested;
    });
  }, [examinations]);

  const reSubmittedExams = useMemo(() => {
    return examinations.filter((e) => {
      if (!e.recheckHistory || e.recheckHistory.length === 0) return false;
      const hasRetakeOrSupplement = e.recheckHistory.some(
        (h) => h.action === "process" && (h.result === "retake" || h.result === "supplement")
      );
      const hasReSubmit = e.recheckHistory.some((h) => h.action === "re_submit");
      return hasRetakeOrSupplement && hasReSubmit && e.recheckRequested;
    });
  }, [examinations]);

  const finalPassedExams = useMemo(() => {
    return examinations.filter((e) => e.recheckResult === "passed");
  }, [examinations]);

  const allRecheckExams = useMemo(() => {
    return examinations.filter(
      (e) => e.recheckHistory && e.recheckHistory.length > 0
    );
  }, [examinations]);

  const getStageExams = useMemo(() => {
    switch (activeTab) {
      case "pending": return pendingDirectorExams;
      case "returned": return returnedExams;
      case "resubmitted": return reSubmittedExams;
      case "passed": return finalPassedExams;
      default: return allRecheckExams;
    }
  }, [activeTab, pendingDirectorExams, returnedExams, reSubmittedExams, finalPassedExams, allRecheckExams]);

  const openDetail = (exam: Examination) => {
    setSelectedExam(exam);
    setDetailVisible(true);
  };

  const openProcessModal = (exam: Examination, type: RecheckResult) => {
    setSelectedExam(exam);
    setProcessType(type);
    setProcessModalVisible(true);
    setCreateRectification(false);
    form.resetFields();
    rectificationForm.resetFields();
  };

  const handleProcess = async () => {
    if (!selectedExam || !processType) return;

    try {
      const values = await form.validateFields();

      let rectValues = null;
      if (createRectification && processType !== "passed") {
        try {
          rectValues = await rectificationForm.validateFields();
        } catch {
          message.warning("请先完整填写整改任务信息");
          return;
        }
      }

      processRecheck(
        selectedExam.id,
        processType,
        values.remark || "",
        currentUser.name
      );

      if (rectValues) {
        const relatedDefect = defectTypes.find((d) => d.id === rectValues.defectTypeId);
        const newTask = {
          id: `rt${Date.now()}`,
          title: rectValues.title,
          relatedExamId: selectedExam.id,
          relatedExamPatientName: selectedExam.patientName,
          defectType: relatedDefect?.name || "复核整改",
          defectTypeId: rectValues.defectTypeId,
          responsible: rectValues.responsible,
          responsibleId: `r${Date.now()}`,
          createdAt: dayjs().format("YYYY-MM-DD"),
          deadline: rectValues.deadline.format("YYYY-MM-DD"),
          status: "pending" as const,
          requirement: rectValues.requirement,
          remark: values.remark || "",
        };
        addRectificationTask(newTask);
        message.success("已处理并创建整改任务");
      } else {
        const resultText = {
          passed: "复核通过",
          retake: "退回重拍",
          supplement: "要求补充说明",
        }[processType];
        message.success(`已${resultText}`);
      }

      setProcessModalVisible(false);
      setDetailVisible(false);
      form.resetFields();
      rectificationForm.resetFields();
    } catch (error) {
      console.error(error);
    }
  };

  const getProcessTypeConfig = (type: RecheckResult) => {
    const configs = {
      passed: {
        title: "复核通过",
        icon: CheckCircle2,
        color: "text-medical-green",
        btnType: "primary" as const,
        placeholder: "请输入复核通过说明（可选）",
      },
      retake: {
        title: "退回重拍",
        icon: XCircle,
        color: "text-medical-red",
        btnType: "primary" as const,
        placeholder: "请输入退回重拍的原因和要求",
      },
      supplement: {
        title: "要求补充说明",
        icon: MessageSquare,
        color: "text-medical-orange",
        btnType: "primary" as const,
        placeholder: "请输入需要补充说明的具体内容",
      },
    };
    return configs[type];
  };

  const pendingColumns: ColumnsType<Examination> = [
    {
      title: "患者信息",
      key: "patient",
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar size={40} className="bg-medical-blue">
            {record.patientName.charAt(0)}
          </Avatar>
          <div>
            <p className="font-medium text-gray-800">{record.patientName}</p>
            <p className="text-xs text-gray-500">{record.patientId}</p>
          </div>
        </div>
      ),
    },
    {
      title: "检查类型",
      dataIndex: "examType",
      key: "examType",
      width: 120,
    },
    {
      title: "检查时间",
      dataIndex: "examTime",
      key: "examTime",
      width: 160,
      render: (time: string) => (
        <span className="inline-flex items-center gap-1 text-gray-600">
          <Clock size={14} className="text-gray-400" />
          {time}
        </span>
      ),
    },
    {
      title: "技师",
      dataIndex: "technician",
      key: "technician",
      width: 100,
      render: (name: string) => (
        <span className="inline-flex items-center gap-1">
          <User size={14} className="text-gray-400" />
          {name}
        </span>
      ),
    },
    {
      title: "机房",
      dataIndex: "room",
      key: "room",
      width: 120,
      render: (room: string) => (
        <span className="inline-flex items-center gap-1">
          <MapPin size={14} className="text-gray-400" />
          {room}
        </span>
      ),
    },
    {
      title: "原质控评分",
      key: "originalScore",
      width: 120,
      render: (_, record) => {
        const score = record.originalScore ?? record.score;
        return (
          <span
            className={`font-bold ${
              score >= 85
                ? "text-medical-green"
                : score >= 70
                ? "text-medical-orange"
                : "text-medical-red"
            }`}
          >
            {score}分
          </span>
        );
      },
    },
    {
      title: "复核人",
      dataIndex: "rechecker",
      key: "rechecker",
      width: 100,
      render: (rechecker: string) => rechecker || "-",
    },
    {
      title: "复核说明",
      dataIndex: "recheckOpinion",
      key: "recheckOpinion",
      width: 180,
      ellipsis: true,
      render: (opinion: string) => opinion || "暂无说明",
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => openDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileText size={14} />}
            onClick={() => navigate(`/quality/${record.id}`)}
          >
            质控页
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircle2 size={14} />}
            onClick={() => openProcessModal(record, "passed")}
          >
            通过
          </Button>
          <Button
            type="primary"
            size="small"
            danger
            icon={<XCircle size={14} />}
            onClick={() => openProcessModal(record, "retake")}
          >
            退回
          </Button>
          <Button
            type="default"
            size="small"
            icon={<MessageSquare size={14} />}
            onClick={() => openProcessModal(record, "supplement")}
          >
            补充说明
          </Button>
        </Space>
      ),
    },
  ];

  const processedColumns: ColumnsType<Examination> = [
    ...pendingColumns.slice(0, 6),
    {
      title: "复核结果",
      key: "recheckResult",
      width: 120,
      render: (_, record) => {
        if (!record.recheckResult) return "-";
        const config = resultTypeMap[record.recheckResult];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "处理人",
      dataIndex: "rechecker",
      key: "rechecker",
      width: 100,
    },
    {
      title: "处理说明",
      dataIndex: "recheckRemark",
      key: "recheckRemark",
      width: 180,
      ellipsis: true,
      render: (remark: string) => remark || "-",
    },
    {
      title: "处理时间",
      dataIndex: "recheckTime",
      key: "recheckTime",
      width: 160,
      render: (time: string) => time || "-",
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => openDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileText size={14} />}
            onClick={() => navigate(`/quality/${record.id}`)}
          >
            质控页
          </Button>
        </Space>
      ),
    },
  ];

  const commonColumns: ColumnsType<Examination> = [
    ...pendingColumns.slice(0, 6),
    {
      title: "当前阶段",
      key: "stage",
      width: 140,
      render: (_, record) => {
        if (record.recheckRequested) {
          const hasReSubmit = record.recheckHistory?.some((h) => h.action === "re_submit");
          return hasReSubmit ? (
            <Tag color="orange">重提后待确认</Tag>
          ) : (
            <Tag color="warning">待主任处理</Tag>
          );
        }
        if (record.recheckResult === "retake") {
          return <Tag color="error">已退回重拍</Tag>;
        }
        if (record.recheckResult === "supplement") {
          return <Tag color="warning">已退回补充</Tag>;
        }
        if (record.recheckResult === "passed") {
          return <Tag color="success">最终通过</Tag>;
        }
        return <Tag color="default">未知</Tag>;
      },
    },
    {
      title: "最近操作",
      key: "latestAction",
      width: 200,
      render: (_, record) => {
        const history = record.recheckHistory || [];
        if (history.length === 0) return "-";
        const latest = [...history].sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        )[0];
        const config = actionTypeMap[latest.action] || { text: latest.action };
        return (
          <div className="text-xs">
            <div className="flex items-center gap-1">
              <span className="font-medium">{config.text}</span>
              {latest.result && (
                <Tag
                  color={resultTypeMap[latest.result]?.color || "default"}
                  style={{ fontSize: 11, margin: 0 }}
                >
                  {resultTypeMap[latest.result]?.text || latest.result}
                </Tag>
              )}
            </div>
            <div className="text-gray-400">{latest.operator} · {latest.time}</div>
          </div>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => openDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileText size={14} />}
            onClick={() => navigate(`/quality/${record.id}`)}
          >
            质控页
          </Button>
        </Space>
      ),
    },
  ];

  const stats = {
    pending: pendingDirectorExams.length,
    returned: returnedExams.length,
    resubmitted: reSubmittedExams.length,
    passed: finalPassedExams.length,
    total: allRecheckExams.length,
  };

  const renderTimeline = (history: RecheckHistoryItem[]) => {
    if (!history || history.length === 0) {
      return <p className="text-gray-400 text-sm">暂无复核历史记录</p>;
    }

    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
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
              <div className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800">
                    {config.text}
                  </span>
                  {item.result && (
                    <Tag color={resultTypeMap[item.result]?.color || "default"} style={{ fontSize: 12, margin: 0 }}>
                      {resultTypeMap[item.result]?.text || item.result}
                    </Tag>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  操作人：{item.operator}
                  {item.operatorRole && `（${item.operatorRole}）`}
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
                <div className="text-xs text-gray-400 mt-1">{item.time}</div>
              </div>
            ),
          };
        })}
      />
    );
  };

  const tabItems = [
    {
      key: "overview",
      label: (
        <span className="flex items-center gap-2">
          <Eye size={16} className="text-medical-blue" />
          全部
          <Badge
            count={stats.total}
            style={{ backgroundColor: "#1890ff" }}
            size="small"
          />
        </span>
      ),
    },
    {
      key: "pending",
      label: (
        <span className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-medical-orange" />
          待主任处理
          <Badge
            count={stats.pending}
            style={{ backgroundColor: "#faad14" }}
            size="small"
          />
        </span>
      ),
    },
    {
      key: "returned",
      label: (
        <span className="flex items-center gap-2">
          <XCircle size={16} className="text-medical-red" />
          已退回待重提
          <Badge
            count={stats.returned}
            style={{ backgroundColor: "#f5222d" }}
            size="small"
          />
        </span>
      ),
    },
    {
      key: "resubmitted",
      label: (
        <span className="flex items-center gap-2">
          <RefreshCw size={16} className="text-medical-orange" />
          重提后待确认
          <Badge
            count={stats.resubmitted}
            style={{ backgroundColor: "#fa8c16" }}
            size="small"
          />
        </span>
      ),
    },
    {
      key: "passed",
      label: (
        <span className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-medical-green" />
          最终通过
          <Badge
            count={stats.passed}
            style={{ backgroundColor: "#52c41a" }}
            size="small"
          />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">复核处理</h1>
          <p className="text-sm text-gray-500 mt-1">
            科主任/资深质控员集中处理待复核的检查
          </p>
        </div>
        <Button
          icon={<RefreshCw size={16} />}
          onClick={() => message.info("已刷新")}
        >
          刷新
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card
            className={`h-full cursor-pointer border-2 transition-all ${activeTab === "pending" ? "border-yellow-400 bg-yellow-50" : "border-transparent"}`}
            onClick={() => setActiveTab("pending")}
          >
            <p className="text-sm text-gray-600 mb-1">待主任处理</p>
            <p className="text-3xl font-bold text-medical-orange">
              {stats.pending}
            </p>
            <p className="text-xs text-gray-400 mt-1">发起复核等待主任审核</p>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            className={`h-full cursor-pointer border-2 transition-all ${activeTab === "returned" ? "border-red-400 bg-red-50" : "border-transparent"}`}
            onClick={() => setActiveTab("returned")}
          >
            <p className="text-sm text-gray-600 mb-1">已退回待重提</p>
            <p className="text-3xl font-bold text-medical-red">
              {stats.returned}
            </p>
            <p className="text-xs text-gray-400 mt-1">退回后尚未重新提交</p>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            className={`h-full cursor-pointer border-2 transition-all ${activeTab === "resubmitted" ? "border-orange-400 bg-orange-50" : "border-transparent"}`}
            onClick={() => setActiveTab("resubmitted")}
          >
            <p className="text-sm text-gray-600 mb-1">重提后待确认</p>
            <p className="text-3xl font-bold text-medical-orange">
              {stats.resubmitted}
            </p>
            <p className="text-xs text-gray-400 mt-1">重新提交后待主任确认</p>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            className={`h-full cursor-pointer border-2 transition-all ${activeTab === "passed" ? "border-green-400 bg-green-50" : "border-transparent"}`}
            onClick={() => setActiveTab("passed")}
          >
            <p className="text-sm text-gray-600 mb-1">最终通过</p>
            <p className="text-3xl font-bold text-medical-green">
              {stats.passed}
            </p>
            <p className="text-xs text-gray-400 mt-1">复核通过的检查</p>
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="px-4 pt-2"
        />
        {getStageExams.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 size={48} className="text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">
              {activeTab === "pending"
                ? "暂无待复核的检查"
                : activeTab === "returned"
                ? "暂无已退回待重提的检查"
                : activeTab === "resubmitted"
                ? "暂无重提后待确认的检查"
                : activeTab === "passed"
                ? "暂无最终通过的检查"
                : "暂无复核记录"}
            </p>
          </div>
        ) : (
          <Table
            columns={
              activeTab === "pending"
                ? pendingColumns
                : activeTab === "passed"
                ? processedColumns
                : commonColumns
            }
            dataSource={getStageExams}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        )}
      </Card>

      <Drawer
        title="检查详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={800}
        extra={
          selectedExam && selectedExam.recheckRequested ? (
            <Space>
              <Button
                type="primary"
                icon={<CheckCircle2 size={14} />}
                onClick={() => openProcessModal(selectedExam, "passed")}
              >
                复核通过
              </Button>
              <Button
                type="primary"
                danger
                icon={<XCircle size={14} />}
                onClick={() => openProcessModal(selectedExam, "retake")}
              >
                退回重拍
              </Button>
              <Button
                icon={<MessageSquare size={14} />}
                onClick={() => openProcessModal(selectedExam, "supplement")}
              >
                补充说明
              </Button>
            </Space>
          ) : null
        }
      >
        {selectedExam && (
          <div className="space-y-6">
            {selectedExam.recheckRequested && (
              <Alert
                message="当前处于复核流程中"
                description={`复核人：${
                  selectedExam.rechecker || "未指定"
                } | 复核说明：${selectedExam.recheckOpinion || "暂无"}`}
                type="warning"
                showIcon
              />
            )}
            {selectedExam.recheckResult && !selectedExam.recheckRequested && (
              <Alert
                message={`复核已处理：${
                  resultTypeMap[selectedExam.recheckResult]?.text ||
                  selectedExam.recheckResult
                }`}
                description={`处理人：${
                  selectedExam.rechecker || "未指定"
                } | 处理时间：${selectedExam.recheckTime || "未知"}`}
                type={
                  (selectedExam.recheckResult === "passed"
                    ? "success"
                    : selectedExam.recheckResult === "retake"
                    ? "error"
                    : "warning") as any
                }
                showIcon
              />
            )}

            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="患者姓名">
                {selectedExam.patientName}
              </Descriptions.Item>
              <Descriptions.Item label="患者ID">
                {selectedExam.patientId}
              </Descriptions.Item>
              <Descriptions.Item label="检查类型">
                {selectedExam.examType}
              </Descriptions.Item>
              <Descriptions.Item label="检查时间">
                {selectedExam.examTime}
              </Descriptions.Item>
              <Descriptions.Item label="技师">
                {selectedExam.technician}
              </Descriptions.Item>
              <Descriptions.Item label="机房">
                {selectedExam.room}
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={getStatusColor(selectedExam.status)}>
                  {getStatusText(selectedExam.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="原质控评分">
                <span
                  className={`font-bold ${
                    (selectedExam.originalScore ?? selectedExam.score) >= 85
                      ? "text-medical-green"
                      : (selectedExam.originalScore ?? selectedExam.score) >= 70
                      ? "text-medical-orange"
                      : "text-medical-red"
                  }`}
                >
                  {selectedExam.originalScore ?? selectedExam.score}分
                </span>
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-medical-orange" />
                缺陷记录
              </h3>
              {selectedExam.defects.length > 0 ? (
                <div className="space-y-2">
                  {selectedExam.defects.map((defectId, idx) => {
                    const defect = defectTypes.find((d) => d.id === defectId);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {defect?.name || defectId}
                          </p>
                          {defect && (
                            <p className="text-xs text-gray-500">
                              扣分：{defect.penalty}分
                            </p>
                          )}
                        </div>
                        <Tag color="red">缺陷</Tag>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400">无缺陷记录</p>
              )}
            </div>

            {selectedExam.recheckRemark && (
              <div>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <MessageSquare size={16} className="text-medical-blue" />
                  处理说明
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-gray-700">{selectedExam.recheckRemark}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    处理人：{selectedExam.rechecker || "未指定"} |
                    处理时间：{selectedExam.recheckTime || "未知"}
                  </p>
                </div>
              </div>
            )}

            <Divider />

            <div>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <History size={16} className="text-medical-blue" />
                复核历史记录
              </h3>
              {renderTimeline(selectedExam.recheckHistory || [])}
            </div>

            {selectedExam.remark && (
              <div>
                <h3 className="font-medium text-gray-700 mb-3">质控备注</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">{selectedExam.remark}</p>
                </div>
              </div>
            )}

            {selectedExam.recheckRequested && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => navigate(`/quality/${selectedExam.id}`)}
                  icon={<FileText size={14} />}
                >
                  查看完整质控页
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircle2 size={14} />}
                  onClick={() => openProcessModal(selectedExam, "passed")}
                >
                  复核通过
                </Button>
                <Button
                  type="primary"
                  danger
                  icon={<XCircle size={14} />}
                  onClick={() => openProcessModal(selectedExam, "retake")}
                >
                  退回重拍
                </Button>
                <Button
                  icon={<MessageSquare size={14} />}
                  onClick={() => openProcessModal(selectedExam, "supplement")}
                >
                  要求补充说明
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title={
          processType ? (
            <div className="flex items-center gap-2">
              {(() => {
                const config = getProcessTypeConfig(processType);
                const Icon = config.icon;
                return <Icon size={20} className={config.color} />;
              })()}
              {processType && getProcessTypeConfig(processType).title}
            </div>
          ) : (
            ""
          )
        }
        open={processModalVisible}
        onOk={handleProcess}
        onCancel={() => {
          setProcessModalVisible(false);
          form.resetFields();
          setCreateRectification(false);
        }}
        okText={processType ? getProcessTypeConfig(processType).title : "确认"}
        cancelText="取消"
        okButtonProps={{
          danger: processType === "retake",
          type: processType
            ? getProcessTypeConfig(processType).btnType
            : "primary",
        }}
        width={600}
      >
        {selectedExam && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                患者：
                <span className="font-medium">{selectedExam.patientName}</span>
              </p>
              <p className="text-sm text-gray-600">
                检查：<span className="font-medium">{selectedExam.examType}</span>
              </p>
              <p className="text-sm text-gray-600">
                技师：<span className="font-medium">{selectedExam.technician}</span>
              </p>
              <p className="text-sm text-gray-600">
                原评分：
                <span
                  className={`font-bold ${
                    (selectedExam.originalScore ?? selectedExam.score) >= 85
                      ? "text-medical-green"
                      : "text-medical-red"
                  }`}
                >
                  {selectedExam.originalScore ?? selectedExam.score}分
                </span>
              </p>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="remark"
                label={
                  processType
                    ? getProcessTypeConfig(processType).placeholder
                    : "说明"
                }
                rules={
                  processType !== "passed"
                    ? [{ required: true, message: "请输入说明" }]
                    : []
                }
              >
                <TextArea
                  rows={4}
                  placeholder={
                    processType
                      ? getProcessTypeConfig(processType).placeholder
                      : ""
                  }
                />
              </Form.Item>
            </Form>

            {processType !== "passed" && (
              <div>
                <Checkbox
                  checked={createRectification}
                  onChange={(e) => setCreateRectification(e.target.checked)}
                >
                  同时创建整改任务
                </Checkbox>
                {createRectification && (
                  <Form
                    form={rectificationForm}
                    layout="vertical"
                    className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <Form.Item
                      name="title"
                      label="整改任务标题"
                      rules={[{ required: true, message: "请输入任务标题" }]}
                    >
                      <Input placeholder="例如：CC体位拍摄不规范整改" />
                    </Form.Item>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="defectTypeId"
                          label="关联缺陷类型"
                          rules={[{ required: true, message: "请选择缺陷类型" }]}
                        >
                          <Select placeholder="选择缺陷类型">
                            {defectTypes.map((d) => (
                              <Option key={d.id} value={d.id}>
                                {d.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="responsible"
                          label="责任人"
                          rules={[{ required: true, message: "请选择责任人" }]}
                        >
                          <Select placeholder="选择责任人">
                            {staff
                              .filter((s) => s.role === "technician")
                              .map((s) => (
                                <Option key={s.id} value={s.name}>
                                  {s.name}（{s.room || "无机房"}）
                                </Option>
                              ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      name="deadline"
                      label="截止日期"
                      rules={[{ required: true, message: "请选择截止日期" }]}
                    >
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                      name="requirement"
                      label="整改要求"
                      rules={[{ required: true, message: "请输入整改要求" }]}
                    >
                      <TextArea
                        rows={3}
                        placeholder="请详细描述整改要求和预期目标"
                      />
                    </Form.Item>
                  </Form>
                )}
              </div>
            )}

            {processType === "retake" && (
              <Alert
                message="退回重拍后，该检查将标记为'需重拍'，技师需要重新拍摄"
                type="warning"
                showIcon
              />
            )}
            {processType === "supplement" && (
              <Alert
                message="要求补充说明后，该检查将退回'待质控'状态，质控员需要补充信息后再次提交"
                type="info"
                showIcon
              />
            )}
            {processType === "passed" && (
              <Alert
                message="复核通过后，该检查将标记为'已完成'，质控流程结束"
                type="success"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
