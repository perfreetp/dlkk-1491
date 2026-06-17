import { useState } from "react";
import {
  Card,
  Switch,
  Button,
  Form,
  message,
  Row,
  Col,
  Divider,
  Select,
  Tag,
  Input,
  Space,
  Alert,
  List,
} from "antd";
import {
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  FileText,
  CheckCircle2,
  Save,
  Monitor,
} from "lucide-react";
import { useQCStore } from "@/store";
import type { NotificationSettings } from "@/types";

const { Option } = Select;

export default function SettingsNotification() {
  const { notificationSettings, updateNotificationSettings } = useQCStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      updateNotificationSettings(values);
      message.success("通知设置已保存");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const notifyItems = [
    {
      key: "retakeAlert",
      title: "重拍提醒",
      description: "当检查被标记为需要重拍时，及时通知相关技师",
      icon: <AlertTriangle size={20} className="text-medical-red" />,
      tag: <Tag color="red">重要</Tag>,
    },
    {
      key: "recheckNotify",
      title: "二次复核通知",
      description: "当质控员发起二次复核申请时，通知科主任或资深质控员",
      icon: <RefreshCw size={20} className="text-medical-orange" />,
      tag: <Tag color="orange">推荐</Tag>,
    },
    {
      key: "rectificationReminder",
      title: "整改任务提醒",
      description: "整改任务到期前自动提醒，逾期时升级通知",
      icon: <CheckCircle2 size={20} className="text-medical-blue" />,
      tag: <Tag color="blue">推荐</Tag>,
    },
    {
      key: "dailyReport",
      title: "每日质控简报推送",
      description: "每日定时推送质控简报摘要，便于快速掌握科室质控状况",
      icon: <FileText size={20} className="text-medical-green" />,
      tag: <Tag color="green">建议开启</Tag>,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">通知设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置系统通知提醒规则和推送方式</p>
      </div>

      <Alert
        type="info"
        showIcon
        message="通知渠道说明"
        description="系统通知支持站内消息、邮件和短信三种方式。短信通知需配置短信网关服务。"
        className="bg-blue-50"
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={notificationSettings}
        onValuesChange={(changed) => {
          updateNotificationSettings(changed);
        }}
      >
        <Card
          title={
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-medical-blue" />
              <span className="font-medium">通知事项</span>
            </div>
          }
          className="shadow-sm"
        >
          <List
            dataSource={notifyItems}
            renderItem={(item) => (
              <List.Item
                key={item.key}
                className="!px-0 !py-4 border-b last:border-b-0"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{item.title}</span>
                        {item.tag}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                  <Form.Item
                    name={item.key}
                    valuePropName="checked"
                    className="!mb-0"
                  >
                    <Switch />
                  </Form.Item>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Monitor size={18} className="text-medical-blue" />
              <span className="font-medium">通知方式</span>
            </div>
          }
          className="shadow-sm"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="notifyMethod"
                label="选择接收方式（可多选）"
                rules={[{ required: true, message: "请至少选择一种通知方式" }]}
              >
                <Select mode="multiple" placeholder="选择通知方式">
                  <Option value="site">
                    <span className="inline-flex items-center gap-2">
                      <Monitor size={14} /> 站内消息
                    </span>
                  </Option>
                  <Option value="email">
                    <span className="inline-flex items-center gap-2">
                      <Mail size={14} /> 邮件通知
                    </span>
                  </Option>
                  <Option value="sms">
                    <span className="inline-flex items-center gap-2">
                      <MessageSquare size={14} /> 短信提醒
                    </span>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="接收邮箱"
                name="email"
                extra="用于接收质控简报和重要通知邮件"
              >
                <Input placeholder="请输入邮箱地址" prefix={<Mail size={16} className="text-gray-400" />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="接收手机号"
                name="phone"
                extra="用于接收紧急重拍和逾期整改短信提醒"
              >
                <Input placeholder="请输入手机号码" prefix={<MessageSquare size={16} className="text-gray-400" />} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-medical-blue" />
              <span className="font-medium">高级设置</span>
            </div>
          }
          className="shadow-sm"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="每日简报推送时间" name="reportTime" initialValue="08:00">
                <Select>
                  <Option value="07:30">07:30（上班前）</Option>
                  <Option value="08:00">08:00（上班时间）</Option>
                  <Option value="08:30">08:30（早会后）</Option>
                  <Option value="18:00">18:00（下班前）</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="整改提醒提前天数" name="reminderDays" initialValue={2}>
                <Select>
                  <Option value={1}>提前 1 天</Option>
                  <Option value={2}>提前 2 天</Option>
                  <Option value={3}>提前 3 天</Option>
                  <Option value={5}>提前 5 天</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={() => form.resetFields()}>恢复默认</Button>
          <Button type="primary" icon={<Save size={16} />} loading={loading} onClick={handleSave}>
            保存设置
          </Button>
        </div>
      </Form>
    </div>
  );
}
