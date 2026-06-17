import { useState, useMemo } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Row,
  Col,
  Badge,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Search,
  Filter,
  Eye,
  CheckSquare,
  RotateCcw,
  User,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useQCStore, getStatusText, getStatusColor, getDefectName } from "@/store";
import type { Examination } from "@/types";

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function Queue() {
  const navigate = useNavigate();
  const { examinations, defectTypes } = useQCStore();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [technicianFilter, setTechnicianFilter] = useState<string | undefined>();
  const [roomFilter, setRoomFilter] = useState<string | undefined>();

  const technicians = useMemo(
    () => [...new Set(examinations.map((e) => e.technician))],
    [examinations]
  );
  const rooms = useMemo(
    () => [...new Set(examinations.map((e) => e.room))],
    [examinations]
  );

  const filteredData = useMemo(() => {
    return examinations.filter((e) => {
      if (
        keyword &&
        !e.patientName.includes(keyword) &&
        !e.patientId.includes(keyword)
      ) {
        return false;
      }
      if (statusFilter && e.status !== statusFilter) return false;
      if (technicianFilter && e.technician !== technicianFilter) return false;
      if (roomFilter && e.room !== roomFilter) return false;
      return true;
    });
  }, [examinations, keyword, statusFilter, technicianFilter, roomFilter]);

  const getPositionStatus = (exam: Examination) => {
    const { positions, leftMarkerPresent, rightMarkerPresent } = exam;
    const positionComplete =
      positions.ccLeft && positions.ccRight && positions.mloLeft && positions.mloRight;
    const markerComplete = leftMarkerPresent && rightMarkerPresent;

    if (positionComplete && markerComplete) {
      return (
        <Tooltip title="体位及标识齐全">
          <span className="inline-flex items-center gap-1 text-medical-green">
            <CheckCircle2 size={14} />
            <span className="text-xs">齐全</span>
          </span>
        </Tooltip>
      );
    }
    const missing: string[] = [];
    if (!positions.ccLeft) missing.push("CC左");
    if (!positions.ccRight) missing.push("CC右");
    if (!positions.mloLeft) missing.push("MLO左");
    if (!positions.mloRight) missing.push("MLO右");
    if (!leftMarkerPresent) missing.push("左标识");
    if (!rightMarkerPresent) missing.push("右标识");
    return (
      <Tooltip title={`缺失: ${missing.join("、")}`}>
        <span className="inline-flex items-center gap-1 text-medical-red">
          <AlertCircle size={14} />
          <span className="text-xs">缺失{missing.length}项</span>
        </span>
      </Tooltip>
    );
  };

  const columns: ColumnsType<Examination> = [
    {
      title: "患者信息",
      key: "patient",
      fixed: "left",
      width: 180,
      render: (_, record) => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{record.patientName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {record.patientId} · {record.patientGender} · {record.patientAge}岁
          </p>
        </div>
      ),
    },
    {
      title: "检查时间",
      dataIndex: "examTime",
      key: "examTime",
      width: 160,
      render: (time: string) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Clock size={14} className="text-gray-400" />
          {time}
        </div>
      ),
      sorter: (a, b) => dayjs(a.examTime).valueOf() - dayjs(b.examTime).valueOf(),
    },
    {
      title: "技师",
      dataIndex: "technician",
      key: "technician",
      width: 120,
      render: (name: string) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <User size={14} className="text-gray-400" />
          {name}
        </div>
      ),
    },
    {
      title: "机房",
      dataIndex: "room",
      key: "room",
      width: 120,
      render: (name: string) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin size={14} className="text-gray-400" />
          {name}
        </div>
      ),
    },
    {
      title: "体位/标识",
      key: "positions",
      width: 200,
      render: (_, record) => {
        const { positions } = record;
        return (
          <div className="space-y-1">
            {getPositionStatus(record)}
            <div className="flex flex-wrap gap-1">
              <Badge
                status={positions.ccLeft ? "success" : "error"}
                text={<span className="text-xs">CC左</span>}
              />
              <Badge
                status={positions.ccRight ? "success" : "error"}
                text={<span className="text-xs">CC右</span>}
              />
              <Badge
                status={positions.mloLeft ? "success" : "error"}
                text={<span className="text-xs">MLO左</span>}
              />
              <Badge
                status={positions.mloRight ? "success" : "error"}
                text={<span className="text-xs">MLO右</span>}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: "质控状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: Examination["status"]) => (
        <Tag color={getStatusColor(status)} style={{ margin: 0 }}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "质控评分",
      dataIndex: "score",
      key: "score",
      width: 130,
      render: (score: number, record) => {
        if (record.status === "qc_pending") {
          return <span className="text-gray-400 text-sm">待评分</span>;
        }
        const showScore = record.originalScore ?? score;
        return (
          <div>
            <span
              className={`font-semibold ${
                showScore >= 85
                  ? "text-medical-green"
                  : showScore >= 70
                  ? "text-medical-orange"
                  : "text-medical-red"
              }`}
            >
              {showScore}分
            </span>
            {record.originalScore !== undefined && (
              <div className="text-xs text-gray-400">原评分</div>
            )}
          </div>
        );
      },
      sorter: (a, b) => (a.originalScore ?? a.score) - (b.originalScore ?? b.score),
    },
    {
      title: "复核信息",
      key: "recheck",
      width: 220,
      render: (_, record) => {
        if (!record.recheckRequested) {
          return <span className="text-gray-400 text-sm">-</span>;
        }
        return (
          <div className="text-xs">
            {record.rechecker && (
              <div className="flex items-center gap-1 mb-1">
                <span className="text-gray-500">复核人：</span>
                <span className="font-medium text-gray-700">{record.rechecker}</span>
              </div>
            )}
            {record.recheckOpinion && (
              <div className="text-gray-500 line-clamp-2" title={record.recheckOpinion}>
                {record.recheckOpinion}
              </div>
            )}
            {record.recheckResult && (
              <Tag
                color={
                  record.recheckResult === "passed"
                    ? "success"
                    : record.recheckResult === "retake"
                    ? "error"
                    : "warning"
                }
                className="mt-1"
                style={{ margin: 0 }}
              >
                {record.recheckResult === "passed"
                  ? "复核通过"
                  : record.recheckResult === "retake"
                  ? "退回重拍"
                  : "需补充说明"}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "质量缺陷",
      key: "defects",
      width: 200,
      render: (_, record) => {
        if (record.defects.length === 0) {
          return <span className="text-gray-400 text-sm">无</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {record.defects.slice(0, 3).map((d) => (
              <Tag key={d} color="red" className="text-xs m-0">
                {getDefectName(d, defectTypes)}
              </Tag>
            ))}
            {record.defects.length > 3 && (
              <Tag className="text-xs m-0">+{record.defects.length - 3}</Tag>
            )}
          </div>
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
            onClick={() => navigate(`/quality/${record.id}`)}
          >
            查看
          </Button>
          {(record.status === "qc_pending" ||
            record.status === "rechecking" ||
            record.status === "retake") && (
            <Button
              type="primary"
              size="small"
              icon={<CheckSquare size={14} />}
              onClick={() => navigate(`/quality/${record.id}`)}
            >
              质控
            </Button>
          )}
          {record.status === "qc_failed" && !record.needRetake && (
            <Button
              type="link"
              size="small"
              danger
              icon={<RotateCcw size={14} />}
              onClick={() => navigate(`/quality/${record.id}`)}
            >
              重拍
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter(undefined);
    setTechnicianFilter(undefined);
    setRoomFilter(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">检查队列</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {filteredData.length} 条检查记录
          </p>
        </div>
        <Space>
          <Button icon={<RefreshCw size={16} />}>刷新</Button>
          <Button type="primary" onClick={() => navigate("/quality")}>
            批量质控
          </Button>
        </Space>
      </div>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索患者姓名/ID"
              prefix={<Search size={16} className="text-gray-400" />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="质控状态"
              allowClear
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
              suffixIcon={<Filter size={16} className="text-gray-400" />}
            >
              <Option value="qc_pending">待质控</Option>
              <Option value="qc_passed">质控通过</Option>
              <Option value="qc_failed">质控不通过</Option>
              <Option value="rechecking">复核中</Option>
              <Option value="retake">需重拍</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="技师"
              allowClear
              style={{ width: "100%" }}
              value={technicianFilter}
              onChange={setTechnicianFilter}
            >
              {technicians.map((t) => (
                <Option key={t} value={t}>
                  {t}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="机房"
              allowClear
              style={{ width: "100%" }}
              value={roomFilter}
              onChange={setRoomFilter}
            >
              {rooms.map((r) => (
                <Option key={r} value={r}>
                  {r}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={3}>
            <Space>
              <Button onClick={resetFilters}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSize: 10,
          }}
          onRow={(record) => ({
            style: { cursor: "pointer" },
            onClick: () => navigate(`/quality/${record.id}`),
          })}
        />
      </Card>
    </div>
  );
}
