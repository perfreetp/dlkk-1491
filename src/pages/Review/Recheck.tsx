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
} from "lucide-react";
import { useQCStore, getStatusText, getStatusColor } from "@/store";
import type { Examination, RecheckResult } from "@/types";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { TextArea } = Input;

export default function ReviewRecheck() {
  const navigate = useNavigate();
  const { examinations, processRecheck, currentUser, defectTypes } = useQCStore();
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [processType, setProcessType] = useState<RecheckResult | null>(null);
  const [form] = Form.useForm();

  const pendingRecheckExams = useMemo(() => {
    return examinations.filter((e) => e.recheckRequested === true);
  }, [examinations]);

  const openDetail = (exam: Examination) => {
    setSelectedExam(exam);
    setDetailVisible(true);
  };

  const openProcessModal = (exam: Examination, type: RecheckResult) => {
    setSelectedExam(exam);
    setProcessType(type);
    setProcessModalVisible(true);
    form.resetFields();
  };

  const handleProcess = async () => {
    if (!selectedExam || !processType) return;

    try {
      const values = await form.validateFields();
      processRecheck(
        selectedExam.id,
        processType,
        values.remark || "",
        currentUser.name
      );

      const resultText = {
        passed: "复核通过",
        retake: "退回重拍",
        supplement: "要求补充说明",
      }[processType];

      message.success(`已${resultText}`);
      setProcessModalVisible(false);
      setDetailVisible(false);
      form.resetFields();
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

  const columns: ColumnsType<Examination> = [
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
          <span className={`font-bold ${score >= 85 ? "text-medical-green" : score >= 70 ? "text-medical-orange" : "text-medical-red"}`}>
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

  const stats = {
    total: pendingRecheckExams.length,
    today: pendingRecheckExams.filter((e) =>
      dayjs(e.examTime).isSame(dayjs(), "day")
    ).length,
  };

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
        <Col xs={24} sm={12}>
          <Card className="h-full">
            <p className="text-sm text-gray-600 mb-2">待复核总数</p>
            <p className="text-3xl font-bold text-medical-orange">{stats.total}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="h-full">
            <p className="text-sm text-gray-600 mb-2">今日发起</p>
            <p className="text-3xl font-bold text-medical-blue">{stats.today}</p>
          </Card>
        </Col>
      </Row>

      {pendingRecheckExams.length === 0 ? (
        <Card className="text-center py-16">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-500 text-lg">暂无待复核的检查</p>
          <p className="text-gray-400 text-sm mt-2">所有复核任务已处理完毕</p>
        </Card>
      ) : (
        <Card styles={{ body: { padding: 0 } }}>
          <Alert
            message="待复核检查列表"
            description="请仔细核对每一项检查的质控结果，给出复核意见"
            type="warning"
            showIcon
            className="border-0 border-b rounded-none"
          />
          <Table
            columns={columns}
            dataSource={pendingRecheckExams}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条待复核`,
            }}
          />
        </Card>
      )}

      <Drawer
        title="检查详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={800}
        extra={
          selectedExam && (
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
          )
        }
      >
        {selectedExam && (
          <div className="space-y-6">
            <Alert
              message="该检查已发起复核"
              description={`复核人：${selectedExam.rechecker || "未指定"} | 复核说明：${selectedExam.recheckOpinion || "暂无"}`}
              type="warning"
              showIcon
            />

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
                <span className={`font-bold ${
                  (selectedExam.originalScore ?? selectedExam.score) >= 85
                    ? "text-medical-green"
                    : (selectedExam.originalScore ?? selectedExam.score) >= 70
                    ? "text-medical-orange"
                    : "text-medical-red"
                }`}>
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

            {selectedExam.recheckOpinion && (
              <div>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <MessageSquare size={16} className="text-medical-blue" />
                  复核说明
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-gray-700">{selectedExam.recheckOpinion}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    复核人：{selectedExam.rechecker || "未指定"}
                  </p>
                </div>
              </div>
            )}

            {selectedExam.remark && (
              <div>
                <h3 className="font-medium text-gray-700 mb-3">质控备注</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">{selectedExam.remark}</p>
                </div>
              </div>
            )}

            <Divider />

            <div className="flex justify-end gap-3">
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
        }}
        okText={processType ? getProcessTypeConfig(processType).title : "确认"}
        cancelText="取消"
        okButtonProps={{
          danger: processType === "retake",
          type: processType ? getProcessTypeConfig(processType).btnType : "primary",
        }}
        width={500}
      >
        {selectedExam && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                患者：<span className="font-medium">{selectedExam.patientName}</span>
              </p>
              <p className="text-sm text-gray-600">
                检查：<span className="font-medium">{selectedExam.examType}</span>
              </p>
              <p className="text-sm text-gray-600">
                原评分：
                <span className={`font-bold ${
                  (selectedExam.originalScore ?? selectedExam.score) >= 85
                    ? "text-medical-green"
                    : "text-medical-red"
                }`}>
                  {selectedExam.originalScore ?? selectedExam.score}分
                </span>
              </p>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="remark"
                label={processType ? getProcessTypeConfig(processType).placeholder : "说明"}
                rules={
                  processType !== "passed"
                    ? [{ required: true, message: "请输入说明" }]
                    : []
                }
              >
                <TextArea
                  rows={4}
                  placeholder={processType ? getProcessTypeConfig(processType).placeholder : ""}
                />
              </Form.Item>
            </Form>

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
