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
  Switch,
  Tabs,
  message,
  InputNumber,
  Row,
  Col,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Plus,
  Edit3,
  AlertTriangle,
  FileCheck,
  Target,
} from "lucide-react";
import { useQCStore } from "@/store";
import type { DefectType, ScoreItem, DefectCategory, DefectSeverity } from "@/types";

const { Option } = Select;
const { TextArea } = Input;

const categoryMap: Record<DefectCategory, { text: string; color: string }> = {
  position: { text: "体位问题", color: "blue" },
  image: { text: "图像质量", color: "orange" },
  marker: { text: "标识问题", color: "purple" },
};

const severityMap: Record<DefectSeverity, { text: string; color: string }> = {
  minor: { text: "轻微", color: "default" },
  major: { text: "严重", color: "orange" },
  critical: { text: "致命", color: "red" },
};

export default function SettingsRules() {
  const { defectTypes, scoreItems, updateDefectType, addDefectType, updateScoreItem, addScoreItem } = useQCStore();
  const [activeTab, setActiveTab] = useState("positions");
  const [defectModalVisible, setDefectModalVisible] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [editingDefect, setEditingDefect] = useState<DefectType | null>(null);
  const [editingScore, setEditingScore] = useState<ScoreItem | null>(null);
  const [defectForm] = Form.useForm();
  const [scoreForm] = Form.useForm();

  const openDefectModal = (defect?: DefectType) => {
    setEditingDefect(defect || null);
    if (defect) {
      defectForm.setFieldsValue(defect);
    } else {
      defectForm.resetFields();
    }
    setDefectModalVisible(true);
  };

  const openScoreModal = (item?: ScoreItem) => {
    setEditingScore(item || null);
    if (item) {
      scoreForm.setFieldsValue(item);
    } else {
      scoreForm.resetFields();
    }
    setScoreModalVisible(true);
  };

  const handleDefectSubmit = async () => {
    try {
      const values = await defectForm.validateFields();
      if (editingDefect) {
        updateDefectType(editingDefect.id, values);
        message.success("缺陷类型更新成功");
      } else {
        addDefectType({
          ...values,
          id: `d${Date.now()}`,
        });
        message.success("缺陷类型添加成功");
      }
      setDefectModalVisible(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleScoreSubmit = async () => {
    try {
      const values = await scoreForm.validateFields();
      if (editingScore) {
        updateScoreItem(editingScore.id, values);
        message.success("评分项更新成功");
      } else {
        addScoreItem({
          ...values,
          id: `s${Date.now()}`,
        });
        message.success("评分项添加成功");
      }
      setScoreModalVisible(false);
    } catch (error) {
      console.error(error);
    }
  };

  const positionRules = [
    { id: "rule1", name: "CC体位左右齐全", description: "需同时拍摄左侧CC和右侧CC体位图像", enabled: true, enforce: "必须" },
    { id: "rule2", name: "MLO体位左右齐全", description: "需同时拍摄左侧MLO和右侧MLO体位图像", enabled: true, enforce: "必须" },
    { id: "rule3", name: "左右侧标识检查", description: "每幅图像必须包含清晰可见的左右侧标识(L/R)", enabled: true, enforce: "必须" },
    { id: "rule4", name: "CC/MLO成套检查", description: "每位患者需完成CC和MLO两种体位成套拍摄", enabled: true, enforce: "必须" },
  ];

  const [positionRulesState, setPositionRulesState] = useState<Record<string, boolean>>(
    Object.fromEntries(positionRules.map((r) => [r.id, r.enabled]))
  );

  const defectColumns: ColumnsType<DefectType> = [
    {
      title: "编码",
      dataIndex: "code",
      key: "code",
      width: 100,
      render: (code) => <span className="font-mono text-sm text-gray-600">{code}</span>,
    },
    {
      title: "缺陷名称",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (name, record) => (
        <span className="font-medium">
          {name}
          {record.causeRetake && (
            <Tooltip title="该缺陷会导致重拍">
              <AlertTriangle size={14} className="inline ml-2 text-medical-red" />
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (cat: DefectCategory) => {
        const c = categoryMap[cat];
        return <Tag color={c.color}>{c.text}</Tag>;
      },
    },
    {
      title: "严重程度",
      dataIndex: "severity",
      key: "severity",
      width: 120,
      render: (sev: DefectSeverity) => {
        const s = severityMap[sev];
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: "是否重拍",
      dataIndex: "causeRetake",
      key: "causeRetake",
      width: 100,
      render: (v) => (v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>),
    },
    { title: "说明", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button type="link" size="small" icon={<Edit3 size={14} />} onClick={() => openDefectModal(record)}>
          编辑
        </Button>
      ),
    },
  ];

  const scoreColumns: ColumnsType<ScoreItem> = [
    {
      title: "评分分类",
      dataIndex: "category",
      key: "category",
      width: 140,
      render: (cat) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: "评分项",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (name) => <span className="font-medium">{name}</span>,
    },
    {
      title: "满分",
      dataIndex: "maxScore",
      key: "maxScore",
      width: 100,
      render: (score) => <span className="text-lg font-semibold text-medical-blue">{score}</span>,
    },
    { title: "说明", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button type="link" size="small" icon={<Edit3 size={14} />} onClick={() => openScoreModal(record)}>
          编辑
        </Button>
      ),
    },
  ];

  const totalMaxScore = scoreItems.reduce((sum, item) => sum + item.maxScore, 0);
  const causeRetakeCount = defectTypes.filter((d) => d.causeRetake).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">质控规则</h1>
        <p className="text-sm text-gray-500 mt-1">配置质控规则参数，包括体位要求、缺陷类型、评分标准</p>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "positions",
              label: (
                <span className="flex items-center gap-2">
                  <Target size={16} />
                  体位规则
                </span>
              ),
              children: (
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-800">体位拍摄要求</h3>
                    <p className="text-sm text-gray-500 mt-1">设置乳腺DR拍摄的基本体位规则</p>
                  </div>
                  <Row gutter={[16, 16]}>
                    {positionRules.map((rule) => (
                      <Col xs={24} md={12} key={rule.id}>
                        <Card size="small" className="h-full" styles={{ body: { padding: 16 } }}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{rule.name}</span>
                                <Tag color="red">{rule.enforce}</Tag>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                            </div>
                            <Switch
                              checked={positionRulesState[rule.id]}
                              onChange={(checked) =>
                                setPositionRulesState({ ...positionRulesState, [rule.id]: checked })
                              }
                            />
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              ),
            },
            {
              key: "defects",
              label: (
                <span className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  缺陷类型
                </span>
              ),
              children: (
                <div>
                  <div className="p-4 flex items-center justify-between border-b">
                    <div>
                      <h3 className="font-medium text-gray-800">质量缺陷类型库</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        共 {defectTypes.length} 种缺陷类型，其中导致重拍 {causeRetakeCount} 种
                      </p>
                    </div>
                    <Button type="primary" icon={<Plus size={16} />} onClick={() => openDefectModal()}>
                      添加缺陷类型
                    </Button>
                  </div>
                  <Table columns={defectColumns} dataSource={defectTypes} rowKey="id" pagination={false} />
                </div>
              ),
            },
            {
              key: "scores",
              label: (
                <span className="flex items-center gap-2">
                  <FileCheck size={16} />
                  评分标准
                </span>
              ),
              children: (
                <div>
                  <div className="p-4 flex items-center justify-between border-b">
                    <div>
                      <h3 className="font-medium text-gray-800">质控评分表</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        共 {scoreItems.length} 项评分，总分 {totalMaxScore} 分
                      </p>
                    </div>
                    <Button type="primary" icon={<Plus size={16} />} onClick={() => openScoreModal()}>
                      添加评分项
                    </Button>
                  </div>
                  <Table columns={scoreColumns} dataSource={scoreItems} rowKey="id" pagination={false} />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingDefect ? "编辑缺陷类型" : "添加缺陷类型"}
        open={defectModalVisible}
        onOk={handleDefectSubmit}
        onCancel={() => setDefectModalVisible(false)}
        okText="保存"
        width={600}
        destroyOnClose
      >
        <Form form={defectForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="code" label="缺陷编码" rules={[{ required: true, message: "请输入缺陷编码" }]}>
                <Input placeholder="例如：I007" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="缺陷名称" rules={[{ required: true, message: "请输入缺陷名称" }]}>
                <Input placeholder="例如：压迫不足" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="category" label="缺陷分类" rules={[{ required: true, message: "请选择分类" }]}>
                <Select>
                  <Option value="position">体位问题</Option>
                  <Option value="image">图像质量</Option>
                  <Option value="marker">标识问题</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="severity" label="严重程度" rules={[{ required: true, message: "请选择严重程度" }]}>
                <Select>
                  <Option value="minor">轻微</Option>
                  <Option value="major">严重</Option>
                  <Option value="critical">致命</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="causeRetake" label="是否导致重拍" rules={[{ required: true }]}>
                <Select>
                  <Option value={true}>是</Option>
                  <Option value={false}>否</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="缺陷说明" rules={[{ required: true, message: "请输入缺陷说明" }]}>
            <TextArea rows={3} placeholder="详细描述该缺陷的定义和判定标准" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingScore ? "编辑评分项" : "添加评分项"}
        open={scoreModalVisible}
        onOk={handleScoreSubmit}
        onCancel={() => setScoreModalVisible(false)}
        okText="保存"
        width={600}
        destroyOnClose
      >
        <Form form={scoreForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item name="category" label="评分分类" rules={[{ required: true, message: "请选择评分分类" }]}>
                <Select>
                  <Option value="体位规范">体位规范</Option>
                  <Option value="图像质量">图像质量</Option>
                  <Option value="标识规范">标识规范</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="maxScore" label="满分值" rules={[{ required: true, message: "请输入满分值" }]}>
                <InputNumber min={1} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="name" label="评分项名称" rules={[{ required: true, message: "请输入评分项名称" }]}>
            <Input placeholder="例如：皮肤展平度" />
          </Form.Item>
          <Form.Item name="description" label="评分说明" rules={[{ required: true, message: "请输入评分说明" }]}>
            <TextArea rows={3} placeholder="描述该评分项的评分标准和扣分规则" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
