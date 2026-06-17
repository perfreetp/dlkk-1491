import { useState, useMemo } from "react";
import { Card, Row, Col, Tabs, Table, Tag, Select, DatePicker, Space, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import ReactECharts from "echarts-for-react";
import { Download, TrendingUp, Users, MapPin, PieChart, BarChart3 } from "lucide-react";
import { useQCStore, getDefectName } from "@/store";
import type { TechnicianStats, RoomStats } from "@/types";

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ReviewStatistics() {
  const {
    examinations,
    defectTypes,
    technicianStats,
    roomStats,
    trendData,
  } = useQCStore();
  const [timeRange, setTimeRange] = useState("7d");

  const defectCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    examinations.forEach((e) => {
      e.defects.forEach((d) => {
        map[d] = (map[d] || 0) + 1;
      });
    });
    return map;
  }, [examinations]);

  const defectPieData = useMemo(() => {
    return Object.entries(defectCountMap)
      .map(([id, count]) => ({
        name: getDefectName(id, defectTypes),
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [defectCountMap, defectTypes]);

  const defectCategoryData = useMemo(() => {
    const categoryMap: Record<string, number> = { position: 0, image: 0, marker: 0 };
    examinations.forEach((e) => {
      e.defects.forEach((d) => {
        const def = defectTypes.find((dt) => dt.id === d);
        if (def) categoryMap[def.category] = (categoryMap[def.category] || 0) + 1;
      });
    });
    return [
      { name: "体位问题", value: categoryMap.position },
      { name: "图像质量", value: categoryMap.image },
      { name: "标识问题", value: categoryMap.marker },
    ];
  }, [examinations, defectTypes]);

  const retakeTypeData = useMemo(() => {
    const retakeExams = examinations.filter((e) => e.needRetake);
    const operation = retakeExams.filter((e) => e.retakeType === "operation").length;
    const equipment = retakeExams.filter((e) => e.retakeType === "equipment").length;
    return [
      { name: "操作问题", value: operation },
      { name: "设备问题", value: equipment },
    ];
  }, [examinations]);

  const pieOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: "bold" },
        },
        data: defectPieData,
        color: ["#1E6FD9", "#27AE60", "#F39C12", "#E74C3C", "#8E44AD", "#16A085", "#D35400", "#2C3E50"],
      },
    ],
  };

  const categoryPieOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: "65%",
        center: ["50%", "45%"],
        itemStyle: { borderRadius: 6 },
        label: { formatter: "{b}\n{d}%" },
        data: defectCategoryData,
        color: ["#1E6FD9", "#F39C12", "#E74C3C"],
      },
    ],
  };

  const techColumns: ColumnsType<TechnicianStats> = [
    {
      title: "排名",
      key: "rank",
      width: 70,
      render: (_, __, idx) => (
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
            idx === 0
              ? "bg-yellow-100 text-yellow-700"
              : idx === 1
              ? "bg-gray-100 text-gray-600"
              : idx === 2
              ? "bg-orange-100 text-orange-700"
              : "bg-gray-50 text-gray-500"
          }`}
        >
          {idx + 1}
        </span>
      ),
    },
    {
      title: "技师",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span className="font-medium text-gray-800">{name}</span>
      ),
    },
    {
      title: "检查总数",
      dataIndex: "totalExams",
      key: "totalExams",
      sorter: (a, b) => a.totalExams - b.totalExams,
    },
    {
      title: "合格数",
      dataIndex: "passedExams",
      key: "passedExams",
      sorter: (a, b) => a.passedExams - b.passedExams,
    },
    {
      title: "合格率",
      dataIndex: "passRate",
      key: "passRate",
      sorter: (a, b) => a.passRate - b.passRate,
      render: (rate: number) => (
        <Tag
          color={rate >= 90 ? "green" : rate >= 80 ? "orange" : "red"}
          style={{ margin: 0 }}
        >
          {rate}%
        </Tag>
      ),
    },
    {
      title: "重拍数",
      dataIndex: "retakeExams",
      key: "retakeExams",
      sorter: (a, b) => a.retakeExams - b.retakeExams,
    },
    {
      title: "重拍率",
      dataIndex: "retakeRate",
      key: "retakeRate",
      sorter: (a, b) => a.retakeRate - b.retakeRate,
      render: (rate: number) => (
        <span className={rate > 8 ? "text-medical-red" : ""}>
          {rate}%
        </span>
      ),
    },
    {
      title: "平均分",
      dataIndex: "avgScore",
      key: "avgScore",
      sorter: (a, b) => a.avgScore - b.avgScore,
    },
  ];

  const roomColumns: ColumnsType<RoomStats> = [
    {
      title: "机房",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span className="font-medium text-gray-800 flex items-center gap-2">
          <MapPin size={14} className="text-medical-blue" />
          {name}
        </span>
      ),
    },
    {
      title: "检查总数",
      dataIndex: "totalExams",
      key: "totalExams",
    },
    {
      title: "高频缺陷",
      key: "topDefects",
      render: (_, record) => (
        <div className="space-y-1">
          {record.topDefects.map((d, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 text-xs w-4">{idx + 1}.</span>
              <span>{d.name}</span>
              <Tag color="red" style={{ margin: 0 }}>
                {d.count}次
              </Tag>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const trendOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["检查数量", "合格率", "重拍率"], right: 10 },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: {
      type: "category",
      data: trendData.map((d) => d.date),
    },
    yAxis: [
      {
        type: "value",
        name: "数量",
        position: "left",
      },
      {
        type: "value",
        name: "比率(%)",
        position: "right",
        min: 0,
        max: 100,
        axisLabel: { formatter: "{value}%" },
      },
    ],
    series: [
      {
        name: "检查数量",
        type: "bar",
        data: trendData.map((d) => d.examCount),
        itemStyle: { color: "#93C5FD", borderRadius: [4, 4, 0, 0] },
        barWidth: 16,
      },
      {
        name: "合格率",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: trendData.map((d) => Math.round(d.passRate * 10) / 10),
        itemStyle: { color: "#27AE60" },
      },
      {
        name: "重拍率",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: trendData.map((d) => Math.round(d.retakeRate * 10) / 10),
        itemStyle: { color: "#E74C3C" },
      },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">统计分析</h1>
          <p className="text-sm text-gray-500 mt-1">多维度质控数据统计与分析</p>
        </div>
        <Space>
          <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
            <Option value="7d">近7天</Option>
            <Option value="14d">近14天</Option>
            <Option value="30d">近30天</Option>
            <Option value="custom">自定义</Option>
          </Select>
          {timeRange === "custom" && <RangePicker />}
          <Button icon={<Download size={16} />}>导出报告</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Users size={18} />
              <span className="text-sm">总检查数</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{examinations.length}</p>
            <p className="text-xs text-medical-green mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> 较上期 +12.5%
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <BarChart3 size={18} />
              <span className="text-sm">整体合格率</span>
            </div>
            <p className="text-3xl font-bold text-medical-green">89.2%</p>
            <p className="text-xs text-medical-green mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> 较上期 +1.8%
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <PieChart size={18} />
              <span className="text-sm">整体重拍率</span>
            </div>
            <p className="text-3xl font-bold text-medical-orange">6.8%</p>
            <p className="text-xs text-medical-green mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> 较上期 -0.7%
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <MapPin size={18} />
              <span className="text-sm">缺陷总数</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {Object.values(defectCountMap).reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-xs text-medical-red mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> 较上期 +5.2%
            </p>
          </Card>
        </Col>
      </Row>

      <Card title="质控趋势分析">
        <ReactECharts option={trendOption} style={{ height: 320 }} />
      </Card>

      <Tabs
        defaultActiveKey="defect"
        items={[
          {
            key: "defect",
            label: "缺陷分析",
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="缺陷类型分布 TOP8">
                    <ReactECharts option={pieOption} style={{ height: 320 }} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="缺陷分类占比">
                    <ReactECharts option={categoryPieOption} style={{ height: 320 }} />
                  </Card>
                </Col>
                <Col xs={24}>
                  <Card title="重拍原因分析">
                    <div className="flex items-center justify-around py-8">
                      {retakeTypeData.map((item, idx) => (
                        <div key={idx} className="text-center">
                          <div
                            className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3 ${
                              idx === 0 ? "bg-gradient-to-br from-orange-400 to-orange-600" : "bg-gradient-to-br from-red-400 to-red-600"
                            }`}
                          >
                            {item.value}
                          </div>
                          <p className="text-sm font-medium text-gray-700">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {retakeTypeData.reduce((a, b) => a + b.value, 0) > 0
                              ? Math.round(
                                  (item.value / retakeTypeData.reduce((a, b) => a + b.value, 0)) * 100
                                )
                              : 0}
                            %
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "technician",
            label: "技师排名",
            children: (
              <Card>
                <Table
                  columns={techColumns}
                  dataSource={[...technicianStats].sort((a, b) => b.passRate - a.passRate)}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: "room",
            label: "机房分析",
            children: (
              <Card>
                <Table
                  columns={roomColumns}
                  dataSource={roomStats}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
