import { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Row,
  Col,
  Progress,
  message,
  Drawer,
  Descriptions,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import { useQCStore } from "@/store";
import type { RectificationTask, RectificationStatus } from "@/types";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const statusMap: Record<
  RectificationStatus,
  { text: string; color: "default" | "processing" | "success"; icon: any }
> = {
  pending: { text: "待整改", color: "default", icon: Clock },
  in_progress: { text: "整改中", color: "processing", icon: AlertCircle },
  completed: { text: "已完成", color: "success", icon: CheckCircle2 },
};

export default function ReviewRectification() {
  const { rectificationTasks, updateRectificationTask, examinations, defectTypes } = useQCStore();
  const [createVisible, setCreateVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RectificationTask | null>(null);
  const [form] = Form.useForm();

  const openDetail = (task: RectificationTask) => {
    setSelectedTask(task);
    setDetailVisible(true);
  };

  const handleComplete = (task: RectificationTask) => {
    Modal.confirm({
      title: "确认整改完成",
      content: "请确认该整改任务已完成并达到预期效果",
      onOk: () => {
        updateRectificationTask(task.id, {
          status: "completed",
          completedAt: dayjs().format("YYYY-MM-DD"),
        });
        message.success("整改已标记为完成");
      },
    });
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const relatedExam = examinations.find((e) => e.id === values.relatedExamId);
      const defect = defectTypes.find((d) => d.id === values.defectTypeId);

      const newTask: RectificationTask = {
        id: `rt${Date.now()}`,
        title: values.title,
        relatedExamId: values.relatedExamId,
        relatedExamPatientName: relatedExam?.patientName || "",
        defectType: defect?.name || "",
        defectTypeId: values.defectTypeId,
        responsible: values.responsible,
        responsibleId: `r${Date.now()}`,
        createdAt: dayjs().format("YYYY-MM-DD"),
        deadline: values.deadline.format("YYYY-MM-DD"),
        status: "pending",
        requirement: values.requirement,
        remark: values.remark,
      };

      useQCStore.getState().addRectificationTask(newTask);
      message.success("整改任务创建成功");
      setCreateVisible(false);
      form.resetFields();
    } catch (error) {
      console.error(error);
    }
  };

  const stats = {
    total: rectificationTasks.length,
    pending: rectificationTasks.filter((t) => t.status === "pending").length,
    inProgress: rectificationTasks.filter((t) => t.status === "in_progress").length,
    completed: rectificationTasks.filter((t) => t.status === "completed").length,
  };

  const progress =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const columns: ColumnsType<RectificationTask> = [
    {
      title: "任务标题",
      dataIndex: "title",
      key: "title",
      width: 200,
      render: (title: string, record) => (
        <a onClick={() => openDetail(record)} className="font-medium">
          {title}
        </a>
      ),
    },
    {
      title: "关联检查",
      key: "exam",
      width: 150,
      render: (_, record) => (
        <div>
          <p className="text-sm">{record.relatedExamPatientName}</p>
          <p className="text-xs text-gray-500">{record.relatedExamId}</p>
        </div>
      ),
    },
    {
      title: "缺陷类型",
      dataIndex: "defectType",
      key: "defectType",
      width: 150,
      render: (type: string) => <Tag color="red">{type}</Tag>,
    },
    {
      title: "责任人",
      dataIndex: "responsible",
      key: "responsible",
      width: 120,
      render: (name: string) => (
        <span className="inline-flex items-center gap-1">
          <User size={14} className="text-gray-400" />
          {name}
        </span>
      ),
    },
    {
      title: "截止日期",
      dataIndex: "deadline",
      key: "deadline",
      width: 120,
      render: (deadline: string, record) => {
        const overdue =
          record.status !== "completed" && dayjs(deadline).isBefore(dayjs());
        return (
          <span
            className={`inline-flex items-center gap-1 ${
              overdue ? "text-medical-red font-medium" : ""
            }`}
          >
            <Calendar size={14} className={overdue ? "text-medical-red" : "text-gray-400"} />
            {deadline}
            {overdue && <Tag color="red">已逾期</Tag>}
          </span>
        );
      },
      sorter: (a, b) => dayjs(a.deadline).valueOf() - dayjs(b.deadline).valueOf(),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: RectificationStatus) => {
        const s = statusMap[status];
        const Icon = s.icon;
        return (
          <Tag color={s.color} icon={<Icon size={12} />} style={{ margin: 0 }}>
            {s.text}
          </Tag>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 180,
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
          {record.status !== "completed" && (
            <Button
              type="link"
              size="small"
              icon={<Edit3 size={14} />}
              onClick={() => handleComplete(record)}
            >
              标记完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">整改追踪</h1>
          <p className="text-sm text-gray-500 mt-1">
            跟踪整改任务执行进度，形成质控闭环
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setCreateVisible(true)}
        >
          新建整改任务
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card className="h-full">
            <p className="text-sm text-gray-600 mb-2">整改任务总数</p>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="h-full">
            <p className="text-sm text-gray-600 mb-2">待整改</p>
            <p className="text-3xl font-bold text-medical-orange">{stats.pending}</p>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="h-full">
            <p className="text-sm text-gray-600 mb-2">整改中</p>
            <p className="text-3xl font-bold text-medical-blue">{stats.inProgress}</p>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="h-full">
            <p className="text-sm text-gray-600 mb-2">整改进度</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-medical-green">{progress}%</span>
              <Progress
                percent={progress}
                showInfo={false}
                size="small"
                strokeColor="#27AE60"
                style={{ flex: 1 }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={rectificationTasks}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="新建整改任务"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateVisible(false);
          form.resetFields();
        }}
        okText="创建任务"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: "请输入任务标题" }]}
          >
            <Input placeholder="例如：CC体位拍摄标准化整改" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="relatedExamId"
                label="关联检查"
                rules={[{ required: true, message: "请选择关联检查" }]}
              >
                <Select placeholder="选择关联的检查">
                  {examinations
                    .filter((e) => e.defects.length > 0)
                    .slice(0, 20)
                    .map((e) => (
                      <Option key={e.id} value={e.id}>
                        {e.patientName} - {e.examTime}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
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
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="responsible"
                label="责任人"
                rules={[{ required: true, message: "请输入责任人" }]}
              >
                <Input placeholder="请输入责任人姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="deadline"
                label="截止日期"
                rules={[{ required: true, message: "请选择截止日期" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="requirement"
            label="整改要求"
            rules={[{ required: true, message: "请输入整改要求" }]}
          >
            <TextArea rows={3} placeholder="请详细描述整改要求和预期目标" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="整改任务详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={600}
      >
        {selectedTask && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                {selectedTask.title}
              </h2>
              <Tag color={statusMap[selectedTask.status].color}>
                {statusMap[selectedTask.status].text}
              </Tag>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="关联检查">
                {selectedTask.relatedExamPatientName} ({selectedTask.relatedExamId})
              </Descriptions.Item>
              <Descriptions.Item label="缺陷类型">
                <Tag color="red">{selectedTask.defectType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="责任人">{selectedTask.responsible}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedTask.createdAt}</Descriptions.Item>
              <Descriptions.Item label="截止日期">
                {selectedTask.deadline}
                {selectedTask.status !== "completed" &&
                  dayjs(selectedTask.deadline).isBefore(dayjs()) && (
                    <Tag color="red" className="ml-2">
                      已逾期
                    </Tag>
                  )}
              </Descriptions.Item>
              {selectedTask.completedAt && (
                <Descriptions.Item label="完成时间">
                  {selectedTask.completedAt}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">整改要求</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">{selectedTask.requirement}</p>
              </div>
            </div>

            {selectedTask.proof && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">整改证明</h3>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-gray-600">{selectedTask.proof}</p>
                </div>
              </div>
            )}

            {selectedTask.remark && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">备注</h3>
                <p className="text-gray-600">{selectedTask.remark}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
