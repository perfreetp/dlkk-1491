import { useState, useMemo } from "react";
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
  List,
  Badge,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Plus,
  Edit3,
  AlertTriangle,
  FileCheck,
  Target,
  Eye,
  XCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useQCStore } from "@/store";
import type { DefectType, ScoreItem, DefectCategory, DefectSeverity, Examination } from "@/types";

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
  const { defectTypes, scoreItems, positionRules, examinations, updateDefectType, addDefectType, updateScoreItem, addScoreItem, updatePositionRules } = useQCStore();
  const [activeTab, setActiveTab] = useState("positions");
  const [defectModalVisible, setDefectModalVisible] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [editingDefect, setEditingDefect] = useState<DefectType | null>(null);
  const [editingScore, setEditingScore] = useState<ScoreItem | null>(null);
  const [defectForm] = Form.useForm();
  const [scoreForm] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewRuleKey, setPreviewRuleKey] = useState<string | null>(null);
  const [previewRuleValue, setPreviewRuleValue] = useState<boolean>(false);
  const [pendingRuleChange, setPendingRuleChange] = useState<{key: string; value: boolean} | null>(null);

  const getAffectedExams = useMemo(() => {
    if (!previewRuleKey) return [];
    
    return examinations.filter((exam: Examination) => {
      const bodyParts = exam.bodyParts || [];
      const markers = exam.markers || { left: false, right: false };
      
      switch (previewRuleKey) {
        case "ccLeftRequired":
          return !bodyParts.includes("CC-L");
        case "ccRightRequired":
          return !bodyParts.includes("CC-R");
        case "mloLeftRequired":
          return !bodyParts.includes("MLO-L");
        case "mloRightRequired":
          return !bodyParts.includes("MLO-R");
        case "leftMarkerRequired":
          return !markers.left;
        case "rightMarkerRequired":
          return !markers.right;
        case "ccMloPairRequired": {
          const hasCC = bodyParts.includes("CC-L") || bodyParts.includes("CC-R");
          const hasMLO = bodyParts.includes("MLO-L") || bodyParts.includes("MLO-R");
          return !hasCC || !hasMLO;
        }
        default:
          return false;
      }
    });
  }, [previewRuleKey, examinations]);

  const handlePositionRuleChange = (key: keyof typeof positionRules, value: boolean) => {
    const ruleInfo = positionRuleList.find((r) => r.key === key);
    
    if (!value) {
      setPreviewRuleKey(key);
      setPreviewRuleValue(value);
      setPendingRuleChange({ key, value });
      setPreviewVisible(true);
    } else {
      updatePositionRules({ [key]: value } as Partial<typeof positionRules>);
      message.success(`已开启「${ruleInfo?.name || key}」规则`);
    }
  };

  const confirmRuleChange = () => {
    if (!pendingRuleChange) return;
    
    const { key, value } = pendingRuleChange;
    const ruleInfo = positionRuleList.find((r) => r.key === key);
    
    updatePositionRules({ [key]: value } as Partial<typeof positionRules>);
    message.success(`已关闭「${ruleInfo?.name || key}」规则`);
    setPreviewVisible(false);
    setPendingRuleChange(null);
    setPreviewRuleKey(null);
  };

  const cancelRuleChange = () => {
    setPreviewVisible(false);
    setPendingRuleChange(null);
    setPreviewRuleKey(null);
  };

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

  const positionRuleList = [
    { key: "ccLeftRequired", name: "CC位（左）", description: "检查左侧CC体位是否拍摄", group: "体位完整性" },
    { key: "ccRightRequired", name: "CC位（右）", description: "检查右侧CC体位是否拍摄", group: "体位完整性" },
    { key: "mloLeftRequired", name: "MLO位（左）", description: "检查左侧MLO体位是否拍摄", group: "体位完整性" },
    { key: "mloRightRequired", name: "MLO位（右）", description: "检查右侧MLO体位是否拍摄", group: "体位完整性" },
    { key: "leftMarkerRequired", name: "左侧标识 (L)", description: "检查左侧图像L标识是否存在", group: "标识检查" },
    { key: "rightMarkerRequired", name: "右侧标识 (R)", description: "检查右侧图像R标识是否存在", group: "标识检查" },
    { key: "ccMloPairRequired", name: "CC/MLO成套", description: "检查每位患者CC和MLO是否成套拍摄", group: "成套检查" },
  ];

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
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-800">体位拍摄要求</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      关闭某项规则后，图像质控页将不再提示对应缺失项
                    </p>
                  </div>
                  {["体位完整性", "标识检查", "成套检查"].map((group) => (
                    <div key={group}>
                      <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-medical-blue rounded" />
                        {group}
                      </h4>
                      <Row gutter={[16, 16]}>
                        {positionRuleList
                          .filter((r) => r.group === group)
                          .map((rule) => (
                            <Col xs={24} md={12} lg={8} key={rule.key}>
                              <Card size="small" className="h-full" styles={{ body: { padding: 14 } }}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-800 text-sm">
                                        {rule.name}
                                      </span>
                                      {!positionRules[rule.key as keyof typeof positionRules] && (
                                        <Badge status="default" text="已关闭" size="small" />
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{rule.description}</p>
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={<Eye size={12} />}
                                      className="p-0 h-auto text-xs mt-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewRuleKey(rule.key);
                                        setPreviewVisible(true);
                                      }}
                                    >
                                      预览影响
                                    </Button>
                                  </div>
                                  <Switch
                                    size="small"
                                    checked={
                                      positionRules[
                                        rule.key as keyof typeof positionRules
                                      ]
                                    }
                                    onChange={(checked) =>
                                      handlePositionRuleChange(
                                        rule.key as keyof typeof positionRules,
                                        checked
                                      )
                                    }
                                  />
                                </div>
                              </Card>
                            </Col>
                          ))}
                      </Row>
                    </div>
                  ))}
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

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-medical-blue" />
            规则影响预览
          </div>
        }
        open={previewVisible}
        onOk={pendingRuleChange ? confirmRuleChange : undefined}
        onCancel={cancelRuleChange}
        okText={pendingRuleChange ? "确认关闭规则" : "关闭"}
        cancelText="取消"
        okButtonProps={{
          danger: true,
          disabled: !pendingRuleChange,
        }}
        width={700}
      >
        {previewRuleKey && (
          <div className="space-y-4">
            {(() => {
              const ruleInfo = positionRuleList.find((r) => r.key === previewRuleKey);
              const isEnabled = positionRules[previewRuleKey as keyof typeof positionRules];
              return (
                <div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {ruleInfo?.name || previewRuleKey}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {ruleInfo?.description}
                      </p>
                    </div>
                    <div>
                      {isEnabled ? (
                        <Tag color="success" icon={<CheckCircle2 size={12} />}>
                          当前开启
                        </Tag>
                      ) : (
                        <Tag color="default" icon={<XCircle size={12} />}>
                          当前关闭
                        </Tag>
                      )}
                    </div>
                  </div>

                  {pendingRuleChange && !pendingRuleChange.value && (
                    <Alert
                      message="关闭此规则后，以下检查将不再提示对应缺失项"
                      type="warning"
                      showIcon
                      className="mt-4"
                    />
                  )}

                  {!pendingRuleChange && !isEnabled && (
                    <Alert
                      message="此规则当前已关闭，以下检查不提示对应缺失项"
                      type="info"
                      showIcon
                      className="mt-4"
                    />
                  )}

                  {!pendingRuleChange && isEnabled && (
                    <Alert
                      message="此规则当前已开启，以下检查会提示对应缺失项"
                      type="success"
                      showIcon
                      className="mt-4"
                    />
                  )}
                </div>
              );
            })()}

            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Info size={16} className="text-medical-blue" />
                受影响的检查（{getAffectedExams.length}例）
              </h4>
              {getAffectedExams.length === 0 ? (
                <div className="text-center py-8 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle2 size={48} className="text-medical-green mx-auto mb-2" />
                  <p className="text-gray-600">暂无受影响的检查</p>
                  <p className="text-sm text-gray-400">现有检查均满足此规则要求</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto border rounded-lg">
                  <List
                    dataSource={getAffectedExams.slice(0, 20)}
                    renderItem={(exam: Examination) => (
                      <List.Item className="px-4 py-3 hover:bg-gray-50 border-b last:border-b-0">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-medical-blue/10 flex items-center justify-center text-medical-blue font-medium text-sm">
                              {exam.patientName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">
                                {exam.patientName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {exam.patientId} · {exam.examTime}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Tag color="warning" style={{ fontSize: 12 }}>
                              缺失{(() => {
                                switch (previewRuleKey) {
                                  case "ccLeftRequired": return "CC左";
                                  case "ccRightRequired": return "CC右";
                                  case "mloLeftRequired": return "MLO左";
                                  case "mloRightRequired": return "MLO右";
                                  case "leftMarkerRequired": return "L标识";
                                  case "rightMarkerRequired": return "R标识";
                                  case "ccMloPairRequired": return "体位成套";
                                  default: return "";
                                }
                              })()}
                            </Tag>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                  {getAffectedExams.length > 20 && (
                    <div className="p-3 text-center text-sm text-gray-400 bg-gray-50 border-t">
                      仅显示前20条，共{getAffectedExams.length}条受影响记录
                    </div>
                  )}
                </div>
              )}
            </div>

            {pendingRuleChange && (
              <Alert
                message={`关闭规则后，图像质控页将不再提示「${positionRuleList.find(r => r.key === previewRuleKey)?.name}」相关的缺失项，质控员可能无法发现该类问题，是否继续？`}
                type="error"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
