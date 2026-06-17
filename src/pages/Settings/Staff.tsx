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
  Space,
  Tabs,
  message,
  Row,
  Col,
  Avatar,
  Tooltip,
  Descriptions,
  Drawer,
  Badge,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Plus,
  Edit3,
  User,
  Monitor,
  Wrench,
  Eye,
  Phone,
  Calendar,
  Building,
  UserCog,
  Activity,
} from "lucide-react";
import { useQCStore, type StaffMember, type Room } from "@/store";
import dayjs from "dayjs";

const { Option } = Select;

const roleColorMap: Record<string, string> = {
  technician: "blue",
  qc: "purple",
  director: "gold",
};

const staffStatusMap: Record<string, { text: string; color: string }> = {
  active: { text: "在岗", color: "success" },
  inactive: { text: "离岗", color: "default" },
};

const roomStatusMap: Record<string, { text: string; color: string; icon: any }> = {
  active: { text: "正常运行", color: "success", icon: Activity },
  maintenance: { text: "维护中", color: "warning", icon: Wrench },
  inactive: { text: "停用", color: "default", icon: Monitor },
};

export default function SettingsStaff() {
  const { staff, rooms, addStaff, updateStaff, addRoom, updateRoom, technicianStats } = useQCStore();
  const [activeTab, setActiveTab] = useState("staff");
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [staffDetailVisible, setStaffDetailVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffForm] = Form.useForm();
  const [roomForm] = Form.useForm();

  const openStaffModal = (member?: StaffMember) => {
    setEditingStaff(member || null);
    if (member) {
      staffForm.setFieldsValue(member);
    } else {
      staffForm.resetFields();
    }
    setStaffModalVisible(true);
  };

  const openRoomModal = (room?: Room) => {
    setEditingRoom(room || null);
    if (room) {
      roomForm.setFieldsValue(room);
    } else {
      roomForm.resetFields();
    }
    setRoomModalVisible(true);
  };

  const openStaffDetail = (member: StaffMember) => {
    setSelectedStaff(member);
    setStaffDetailVisible(true);
  };

  const handleStaffSubmit = async () => {
    try {
      const values = await staffForm.validateFields();
      if (editingStaff) {
        updateStaff(editingStaff.id, values);
        message.success("人员信息更新成功");
      } else {
        const roleNameMap: Record<string, string> = {
          technician: "技师",
          qc: "质控员",
          director: "科主任",
        };
        addStaff({
          ...values,
          id: `s${Date.now()}`,
          roleName: roleNameMap[values.role] || values.role,
        });
        message.success("人员添加成功");
      }
      setStaffModalVisible(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRoomSubmit = async () => {
    try {
      const values = await roomForm.validateFields();
      if (editingRoom) {
        updateRoom(editingRoom.id, values);
        message.success("机房信息更新成功");
      } else {
        addRoom({
          ...values,
          id: `r${Date.now()}`,
          lastMaintenance: dayjs().format("YYYY-MM-DD"),
        });
        message.success("机房添加成功");
      }
      setRoomModalVisible(false);
    } catch (error) {
      console.error(error);
    }
  };

  const getStaffStats = (memberId: string) => {
    return technicianStats.find((t) => t.id === memberId);
  };

  const staffColumns: ColumnsType<StaffMember> = [
    {
      title: "人员",
      key: "name",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={40}
            style={{ backgroundColor: "#1E6FD9" }}
            className="flex items-center justify-center"
          >
            {record.name[0]}
          </Avatar>
          <div>
            <p className="font-medium text-gray-800 m-0">{record.name}</p>
            <p className="text-xs text-gray-500 m-0">
              {record.roleName} · {record.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role) => {
        const roleNames: Record<string, string> = {
          technician: "技师",
          qc: "质控员",
          director: "科主任",
        };
        return <Tag color={roleColorMap[role]}>{roleNames[role]}</Tag>;
      },
    },
    {
      title: "所属机房",
      dataIndex: "room",
      key: "room",
      width: 140,
      render: (room) => (room ? <span>{room}</span> : <span className="text-gray-400">-</span>),
    },
    {
      title: "联系电话",
      dataIndex: "phone",
      key: "phone",
      width: 160,
      render: (phone) =>
        phone ? (
          <span className="inline-flex items-center gap-1">
            <Phone size={14} className="text-gray-400" />
            {phone}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const s = staffStatusMap[status];
        return <Tag color={s.color}>{s.text}</Tag>;
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
            onClick={() => openStaffDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Edit3 size={14} />}
            onClick={() => openStaffModal(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const roomColumns: ColumnsType<Room> = [
    {
      title: "机房名称",
      dataIndex: "name",
      key: "name",
      width: 160,
      render: (name, record) => {
        const status = roomStatusMap[record.status];
        const Icon = status.icon;
        return (
          <div className="flex items-center gap-2">
            <Icon size={18} className={`text-${status.color}`} />
            <span className="font-medium text-gray-800">{name}</span>
          </div>
        );
      },
    },
    {
      title: "设备型号",
      dataIndex: "equipment",
      key: "equipment",
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        const s = roomStatusMap[status];
        return (
          <Badge
            status={s.color as any}
            text={s.text}
          />
        );
      },
    },
    {
      title: "上次维护",
      dataIndex: "lastMaintenance",
      key: "lastMaintenance",
      width: 140,
      render: (date) => (
        <span className="inline-flex items-center gap-1">
          <Calendar size={14} className="text-gray-400" />
          {date}
        </span>
      ),
      sorter: (a, b) => dayjs(a.lastMaintenance).valueOf() - dayjs(b.lastMaintenance).valueOf(),
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<Edit3 size={14} />}
          onClick={() => openRoomModal(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  const staffStats = {
    total: staff.length,
    active: staff.filter((s) => s.status === "active").length,
    technicians: staff.filter((s) => s.role === "technician").length,
    qc: staff.filter((s) => s.role === "qc" || s.role === "director").length,
  };

  const roomStats = {
    total: rooms.length,
    active: rooms.filter((r) => r.status === "active").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">人员与机房管理</h1>
        <p className="text-sm text-gray-500 mt-1">管理科室工作人员信息和机房设备配置</p>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "staff",
              label: (
                <span className="flex items-center gap-2">
                  <UserCog size={16} />
                  人员管理
                </span>
              ),
              children: (
                <div>
                  <div className="p-4 border-b">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={6}>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">总人数</p>
                          <p className="text-2xl font-bold text-gray-800 mt-1">{staffStats.total}</p>
                        </div>
                      </Col>
                      <Col xs={24} sm={6}>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">在岗人数</p>
                          <p className="text-2xl font-bold text-medical-green mt-1">{staffStats.active}</p>
                        </div>
                      </Col>
                      <Col xs={24} sm={6}>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">技师人数</p>
                          <p className="text-2xl font-bold text-medical-blue mt-1">{staffStats.technicians}</p>
                        </div>
                      </Col>
                      <Col xs={24} sm={6}>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">质控/管理</p>
                          <p className="text-2xl font-bold text-purple-600 mt-1">{staffStats.qc}</p>
                        </div>
                      </Col>
                    </Row>
                    <div className="flex justify-end mt-4">
                      <Button type="primary" icon={<Plus size={16} />} onClick={() => openStaffModal()}>
                        添加人员
                      </Button>
                    </div>
                  </div>
                  <Table
                    columns={staffColumns}
                    dataSource={staff}
                    rowKey="id"
                    pagination={{ showSizeChanger: true, showTotal: (total) => `共 ${total} 人` }}
                  />
                </div>
              ),
            },
            {
              key: "rooms",
              label: (
                <span className="flex items-center gap-2">
                  <Building size={16} />
                  机房管理
                </span>
              ),
              children: (
                <div>
                  <div className="p-4 border-b">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">机房总数</p>
                          <p className="text-2xl font-bold text-gray-800 mt-1">{roomStats.total}</p>
                        </div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">正常运行</p>
                          <p className="text-2xl font-bold text-medical-green mt-1">{roomStats.active}</p>
                        </div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">维护中</p>
                          <p className="text-2xl font-bold text-medical-orange mt-1">{roomStats.maintenance}</p>
                        </div>
                      </Col>
                    </Row>
                    <div className="flex justify-end mt-4">
                      <Button type="primary" icon={<Plus size={16} />} onClick={() => openRoomModal()}>
                        添加机房
                      </Button>
                    </div>
                  </div>
                  <Table
                    columns={roomColumns}
                    dataSource={rooms}
                    rowKey="id"
                    pagination={{ showSizeChanger: true, showTotal: (total) => `共 ${total} 间` }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingStaff ? "编辑人员信息" : "添加人员"}
        open={staffModalVisible}
        onOk={handleStaffSubmit}
        onCancel={() => setStaffModalVisible(false)}
        okText="保存"
        width={600}
        destroyOnClose
      >
        <Form form={staffForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: "请输入姓名" }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: "请选择角色" }]}
              >
                <Select>
                  <Option value="technician">技师</Option>
                  <Option value="qc">质控员</Option>
                  <Option value="director">科主任</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="room" label="所属机房">
                <Select placeholder="请选择机房">
                  {rooms.map((r) => (
                    <Option key={r.id} value={r.name}>
                      {r.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
            initialValue="active"
          >
            <Select>
              <Option value="active">在岗</Option>
              <Option value="inactive">离岗</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingRoom ? "编辑机房信息" : "添加机房"}
        open={roomModalVisible}
        onOk={handleRoomSubmit}
        onCancel={() => setRoomModalVisible(false)}
        okText="保存"
        width={600}
        destroyOnClose
      >
        <Form form={roomForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="机房名称"
                rules={[{ required: true, message: "请输入机房名称" }]}
              >
                <Input placeholder="例如：DR机房4" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: "请选择状态" }]}
              >
                <Select>
                  <Option value="active">正常运行</Option>
                  <Option value="maintenance">维护中</Option>
                  <Option value="inactive">停用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="equipment"
            label="设备型号"
            rules={[{ required: true, message: "请输入设备型号" }]}
          >
            <Input placeholder="例如：GE Senographe Pristina" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="人员详情"
        open={staffDetailVisible}
        onClose={() => setStaffDetailVisible(false)}
        width={500}
      >
        {selectedStaff && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b">
              <Avatar
                size={64}
                style={{ backgroundColor: "#1E6FD9", fontSize: 24 }}
                className="flex items-center justify-center"
              >
                {selectedStaff.name[0]}
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{selectedStaff.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Tag color={roleColorMap[selectedStaff.role]}>{selectedStaff.roleName}</Tag>
                  <Tag color={staffStatusMap[selectedStaff.status].color}>
                    {staffStatusMap[selectedStaff.status].text}
                  </Tag>
                </div>
              </div>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="员工编号">{selectedStaff.id}</Descriptions.Item>
              <Descriptions.Item label="所属机房">{selectedStaff.room || "-"}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedStaff.phone || "-"}</Descriptions.Item>
            </Descriptions>

            {selectedStaff.role === "technician" && getStaffStats(selectedStaff.id) && (
              <div>
                <h3 className="font-medium text-gray-800 mb-3">质控统计</h3>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="检查总数">
                    {getStaffStats(selectedStaff.id)?.totalExams || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="合格率">
                    <span className="text-medical-green font-semibold">
                      {getStaffStats(selectedStaff.id)?.passRate || 0}%
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="重拍数">
                    {getStaffStats(selectedStaff.id)?.retakeExams || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="重拍率">
                    <span className="text-medical-orange font-semibold">
                      {getStaffStats(selectedStaff.id)?.retakeRate || 0}%
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="平均分" span={2}>
                    {getStaffStats(selectedStaff.id)?.avgScore || 0} 分
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
