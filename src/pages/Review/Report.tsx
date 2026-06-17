import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Tabs,
  Button,
  Space,
  Select,
  DatePicker,
  Tag,
  Divider,
  Descriptions,
  Progress,
  Table,
  message,
} from "antd";
import { Download, FileText, Printer, Calendar, BarChart3 } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { useQCStore, getDefectName } from "@/store";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;

export default function ReviewReport() {
  const { examinations, technicianStats, defectTypes, trendData, roomStats } = useQCStore();
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [date, setDate] = useState(dayjs());

  const totalExams = examinations.length;
  const passedExams = examinations.filter(
    (e) => e.status === "qc_passed" || e.status === "completed"
  ).length;
  const failedExams = examinations.filter((e) => e.status === "qc_failed").length;
  const retakeExams = examinations.filter((e) => e.status === "retake").length;
  const recheckingExams = examinations.filter((e) => e.status === "rechecking").length;

  const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 1000) / 10 : 0;
  const retakeRate = totalExams > 0 ? Math.round((retakeExams / totalExams) * 1000) / 10 : 0;

  const defectCountMap: Record<string, number> = {};
  examinations.forEach((e) => {
    e.defects.forEach((d) => {
      defectCountMap[d] = (defectCountMap[d] || 0) + 1;
    });
  });
  const topDefects = Object.entries(defectCountMap)
    .map(([id, count]) => ({
      name: getDefectName(id, defectTypes),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const trendOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["合格率", "重拍率"], right: 10 },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: "category", data: trendData.map((d) => d.date) },
    yAxis: [
      { type: "value", name: "合格率(%)", min: 80, max: 100, axisLabel: { formatter: "{value}%" } },
      { type: "value", name: "重拍率(%)", min: 0, max: 15, axisLabel: { formatter: "{value}%" } },
    ],
    series: [
      {
        name: "合格率",
        type: "line",
        smooth: true,
        data: trendData.map((d) => Math.round(d.passRate * 10) / 10),
        itemStyle: { color: "#27AE60" },
        areaStyle: { color: "rgba(39,174,96,0.15)" },
      },
      {
        name: "重拍率",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        data: trendData.map((d) => Math.round(d.retakeRate * 10) / 10),
        itemStyle: { color: "#E74C3C" },
        areaStyle: { color: "rgba(231,76,60,0.1)" },
      },
    ],
  };

  const defectBarOption = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 100, right: 30, top: 20, bottom: 30 },
    xAxis: { type: "value" },
    yAxis: { type: "category", data: topDefects.map((d) => d.name).reverse() },
    series: [
      {
        type: "bar",
        data: topDefects.map((d) => d.count).reverse(),
        itemStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: "#1E6FD9" },
              { offset: 1, color: "#60A5FA" },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
        barWidth: 20,
        label: { show: true, position: "right" },
      },
    ],
  };

  const techColumns: ColumnsType<(typeof technicianStats)[0]> = [
    {
      title: "技师",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    { title: "检查数", dataIndex: "totalExams", key: "totalExams" },
    {
      title: "合格率",
      dataIndex: "passRate",
      key: "passRate",
      render: (rate: number) => (
        <Tag color={rate >= 90 ? "green" : rate >= 80 ? "orange" : "red"}>{rate}%</Tag>
      ),
    },
    {
      title: "重拍率",
      dataIndex: "retakeRate",
      key: "retakeRate",
      render: (rate: number) => <span className={rate > 8 ? "text-medical-red" : ""}>{rate}%</span>,
    },
    { title: "平均分", dataIndex: "avgScore", key: "avgScore" },
  ];

  const handleExport = () => {
    message.success("简报导出成功（模拟）");
  };

  const handlePrint = () => {
    message.info("正在准备打印...");
    setTimeout(() => window.print(), 500);
  };

  const reportTitle = {
    daily: "日质控简报",
    weekly: "周质控简报",
    monthly: "月质控简报",
  };

  const reportDateText = {
    daily: date.format("YYYY年MM月DD日"),
    weekly: `${date.subtract(6, "day").format("YYYY年MM月DD日")} - ${date.format("YYYY年MM月DD日")}`,
    monthly: date.format("YYYY年MM月"),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">质控简报</h1>
          <p className="text-sm text-gray-500 mt-1">按日/周/月生成质控工作简报</p>
        </div>
        <Space>
          <Select
            value={reportType}
            onChange={(v) => setReportType(v)}
            style={{ width: 120 }}
          >
            <Option value="daily">日报</Option>
            <Option value="weekly">周报</Option>
            <Option value="monthly">月报</Option>
          </Select>
          {reportType === "daily" ? (
            <DatePicker value={date} onChange={(d) => d && setDate(d)} />
          ) : reportType === "weekly" ? (
            <DatePicker.WeekPicker value={date} onChange={(d) => d && setDate(d)} />
          ) : (
            <DatePicker.MonthPicker value={date} onChange={(d) => d && setDate(d)} />
          )}
          <Button icon={<Printer size={16} />} onClick={handlePrint}>
            打印
          </Button>
          <Button type="primary" icon={<Download size={16} />} onClick={handleExport}>
            导出PDF
          </Button>
        </Space>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-white border-blue-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <FileText size={24} className="text-medical-blue" />
            乳腺DR检查{reportTitle[reportType]}
          </h2>
          <p className="text-gray-500 flex items-center justify-center gap-2">
            <Calendar size={14} />
            {reportDateText[reportType]}
          </p>
        </div>
      </Card>

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: "overview",
            label: "一、质控概况",
            children: (
              <div className="space-y-4">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="h-full text-center">
                      <p className="text-gray-500 text-sm mb-2">检查总数</p>
                      <p className="text-3xl font-bold text-gray-800">{totalExams}</p>
                      <p className="text-xs text-gray-400 mt-1">例</p>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="h-full text-center border-green-200">
                      <p className="text-gray-500 text-sm mb-2">质控通过</p>
                      <p className="text-3xl font-bold text-medical-green">{passedExams}</p>
                      <Progress
                        percent={passRate}
                        showInfo={false}
                        strokeColor="#27AE60"
                        size="small"
                        className="mt-2"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="h-full text-center border-red-200">
                      <p className="text-gray-500 text-sm mb-2">需重拍</p>
                      <p className="text-3xl font-bold text-medical-red">{retakeExams}</p>
                      <p className="text-xs text-medical-red mt-1">重拍率 {retakeRate}%</p>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="h-full text-center border-orange-200">
                      <p className="text-gray-500 text-sm mb-2">复核中</p>
                      <p className="text-3xl font-bold text-medical-orange">{recheckingExams}</p>
                      <p className="text-xs text-gray-400 mt-1">等待复核确认</p>
                    </Card>
                  </Col>
                </Row>

                <Card title="质控趋势" extra={<BarChart3 size={16} />}>
                  <ReactECharts option={trendOption} style={{ height: 280 }} />
                </Card>

                <Card title="本期质控工作小结">
                  <div className="space-y-3 text-gray-700 leading-relaxed">
                    <p>
                      本期共完成乳腺DR检查 <strong className="text-medical-blue">{totalExams}</strong> 例，
                      质控通过 <strong className="text-medical-green">{passedExams}</strong> 例，
                      通过率 <strong>{passRate}%</strong>，
                      需重拍 <strong className="text-medical-red">{retakeExams}</strong> 例，
                      重拍率 <strong>{retakeRate}%</strong>。
                    </p>
                    <p>
                      主要问题集中在 <Tag color="blue">{topDefects[0]?.name || "无"}</Tag>
                      {topDefects[1] && <>和 <Tag color="blue">{topDefects[1].name}</Tag></>}，
                      需加强相关操作培训和设备维护。
                    </p>
                    <p>
                      技师合格率表现较好，
                      <strong className="text-medical-green">
                        {" "}
                        {technicianStats.sort((a, b) => b.passRate - a.passRate)[0]?.name}{" "}
                      </strong>
                      合格率最高，达到{" "}
                      <strong className="text-medical-green">
                        {technicianStats.sort((a, b) => b.passRate - a.passRate)[0]?.passRate}%
                      </strong>
                      。
                    </p>
                  </div>
                </Card>
              </div>
            ),
          },
          {
            key: "defects",
            label: "二、缺陷分析",
            children: (
              <div className="space-y-4">
                <Card title="高频缺陷类型 TOP5">
                  <ReactECharts option={defectBarOption} style={{ height: 300 }} />
                </Card>
                <Card title="缺陷详情说明">
                  <Descriptions column={1} bordered size="small">
                    {topDefects.map((d, idx) => (
                      <Descriptions.Item
                        key={idx}
                        label={
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-medical-blue text-white text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            {d.name}
                          </span>
                        }
                      >
                        <div className="flex items-center gap-4">
                          <span>
                            出现 <strong className="text-medical-red">{d.count}</strong> 次
                          </span>
                          <Progress
                            percent={Math.round((d.count / totalExams) * 100)}
                            showInfo
                            size="small"
                            strokeColor="#E74C3C"
                            style={{ width: 200 }}
                          />
                        </div>
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </Card>
              </div>
            ),
          },
          {
            key: "technician",
            label: "三、技师质控情况",
            children: (
              <Card title="各技师质控指标统计">
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
            label: "四、机房使用情况",
            children: (
              <Card title="各机房质控统计">
                <Row gutter={[16, 16]}>
                  {roomStats.map((room) => (
                    <Col xs={24} md={8} key={room.id}>
                      <Card className="h-full">
                        <h3 className="font-semibold text-gray-800 mb-3">{room.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          检查总数：<strong>{room.totalExams}</strong> 例
                        </p>
                        <Divider style={{ margin: "8px 0" }} />
                        <p className="text-xs text-gray-500 mb-2">主要缺陷：</p>
                        <div className="space-y-1.5">
                          {room.topDefects.map((d, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{d.name}</span>
                              <Tag color="red" style={{ margin: 0 }}>
                                {d.count}次
                              </Tag>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            ),
          },
          {
            key: "plan",
            label: "五、下期工作计划",
            children: (
              <Card title="下期质控工作重点">
                <ol className="space-y-3 text-gray-700 list-decimal list-inside">
                  <li className="pl-2">
                    <strong>加强操作培训：</strong>
                    针对高频缺陷{topDefects.slice(0, 2).map((d) => d.name).join("、")}
                    组织专项培训，利用典型案例库进行班前学习。
                  </li>
                  <li className="pl-2">
                    <strong>设备维护：</strong>
                    对高频缺陷较多的机房进行设备检测和校准，排查设备问题导致的重拍。
                  </li>
                  <li className="pl-2">
                    <strong>持续追踪整改：</strong>
                    跟进现有整改任务落实情况，确保形成质控闭环。
                  </li>
                  <li className="pl-2">
                    <strong>质量评比：</strong>
                    公示技师合格率排名，树立优秀典型，激励全员提升质控意识。
                  </li>
                </ol>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
