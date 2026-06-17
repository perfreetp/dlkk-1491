import { Card, Row, Col, Statistic, List, Tag, Progress, Button } from "antd";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { useQCStore, getStatusText, getStatusColor, getRectificationStatusText, getRectificationStatusColor } from "@/store";
import dayjs from "dayjs";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    examinations,
    trendData,
    technicianStats,
    defectTypes,
    rectificationTasks,
  } = useQCStore();

  const today = dayjs().format("YYYY-MM-DD");
  const todayExams = examinations.filter((e) => e.examTime.startsWith(today));
  const qcPendingCount = examinations.filter((e) => e.status === "qc_pending").length;
  const recheckingCount = examinations.filter((e) => e.status === "rechecking").length;
  const passedCount = examinations.filter(
    (e) => e.status === "qc_passed" || e.status === "completed"
  ).length;
  const retakeCount = examinations.filter((e) => e.status === "retake").length;
  const passRate =
    examinations.length > 0
      ? Math.round((passedCount / examinations.length) * 1000) / 10
      : 0;
  const retakeRate =
    examinations.length > 0
      ? Math.round((retakeCount / examinations.length) * 1000) / 10
      : 0;

  const defectCountMap: Record<string, number> = {};
  examinations.forEach((e) => {
    e.defects.forEach((d) => {
      defectCountMap[d] = (defectCountMap[d] || 0) + 1;
    });
  });
  const topDefects = Object.entries(defectCountMap)
    .map(([id, count]) => {
      const def = defectTypes.find((d) => d.id === id);
      return { name: def?.name || id, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const pendingTodos = [
    ...examinations
      .filter((e) => e.status === "qc_pending")
      .slice(0, 3)
      .map((e) => ({
        type: "qc" as const,
        id: e.id,
        title: `待质控 - ${e.patientName}`,
        time: e.examTime,
        status: e.status,
        statusText: getStatusText(e.status),
        statusColor: getStatusColor(e.status),
      })),
    ...examinations
      .filter((e) => e.status === "rechecking")
      .slice(0, 2)
      .map((e) => ({
        type: "recheck" as const,
        id: e.id,
        title: `复核中 - ${e.patientName}`,
        time: e.examTime,
        status: e.status,
        statusText: getStatusText(e.status),
        statusColor: getStatusColor(e.status),
      })),
    ...rectificationTasks
      .filter((t) => t.status !== "completed")
      .slice(0, 2)
      .map((t) => {
        const isOverdue = t.status !== "completed" && dayjs(t.deadline).isBefore(dayjs());
        return {
          type: "rectification" as const,
          id: t.id,
          title: `整改 - ${t.title}`,
          time: t.deadline,
          status: t.status,
          statusText: isOverdue ? "已逾期" : getRectificationStatusText(t.status),
          statusColor: isOverdue ? "error" : getRectificationStatusColor(t.status),
          isOverdue,
        };
      }),
  ].slice(0, 6);

  const trendOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["合格率", "重拍率"], right: 10, top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: "category",
      data: trendData.map((d) => d.date),
      axisLabel: { fontSize: 11 },
    },
    yAxis: [
      {
        type: "value",
        name: "合格率(%)",
        min: 70,
        max: 100,
        axisLabel: { formatter: "{value}%", fontSize: 11 },
      },
      {
        type: "value",
        name: "重拍率(%)",
        min: 0,
        max: 15,
        axisLabel: { formatter: "{value}%", fontSize: 11 },
      },
    ],
    series: [
      {
        name: "合格率",
        type: "line",
        smooth: true,
        data: trendData.map((d) => Math.round(d.passRate * 10) / 10),
        itemStyle: { color: "#27AE60" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(39,174,96,0.3)" },
              { offset: 1, color: "rgba(39,174,96,0)" },
            ],
          },
        },
      },
      {
        name: "重拍率",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        data: trendData.map((d) => Math.round(d.retakeRate * 10) / 10),
        itemStyle: { color: "#E74C3C" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(231,76,60,0.2)" },
              { offset: 1, color: "rgba(231,76,60,0)" },
            ],
          },
        },
      },
    ],
  };

  const defectBarOption = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 120, right: 30, top: 20, bottom: 30 },
    xAxis: { type: "value", axisLabel: { fontSize: 11 } },
    yAxis: {
      type: "category",
      data: topDefects.map((d) => d.name).reverse(),
      axisLabel: { fontSize: 11 },
    },
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
        barWidth: 18,
        label: {
          show: true,
          position: "right",
          fontSize: 11,
          color: "#666",
        },
      },
    ],
  };

  const statsCards = [
    {
      title: "今日检查",
      value: todayExams.length,
      icon: <Activity size={24} className="text-medical-blue" />,
      color: "bg-blue-50 border-blue-200",
      suffix: "例",
    },
    {
      title: "质控合格率",
      value: passRate,
      icon: <CheckCircle2 size={24} className="text-medical-green" />,
      color: "bg-green-50 border-green-200",
      suffix: "%",
      trend: "+1.2%",
    },
    {
      title: "重拍率",
      value: retakeRate,
      icon: <XCircle size={24} className="text-medical-red" />,
      color: "bg-red-50 border-red-200",
      suffix: "%",
      trend: "-0.5%",
      trendDown: true,
    },
    {
      title: "待处理事项",
      value: qcPendingCount + recheckingCount,
      icon: <Clock size={24} className="text-medical-orange" />,
      color: "bg-orange-50 border-orange-200",
      suffix: "项",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">科室质控看板</h1>
          <p className="text-sm text-gray-500 mt-1">
            <Calendar size={14} className="inline mr-1" />
            {dayjs().format("YYYY年MM月DD日 dddd")} · 数据实时更新
          </p>
        </div>
        <Button
          type="primary"
          icon={<RefreshCw size={16} />}
          onClick={() => navigate("/queue")}
        >
          进入检查队列
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {statsCards.map((card, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card
              className={`border-2 ${card.color} hover:shadow-card-hover transition-shadow`}
              styles={{ body: { padding: "20px" } }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">{card.title}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-800">
                      {card.value}
                    </span>
                    <span className="text-sm text-gray-500">{card.suffix}</span>
                  </div>
                  {card.trend && (
                    <p
                      className={`text-xs mt-2 flex items-center gap-1 ${
                        card.trendDown
                          ? "text-medical-green"
                          : card.title.includes("重拍")
                          ? "text-medical-green"
                          : "text-medical-green"
                      }`}
                    >
                      <TrendingUp size={12} />
                      较昨日 {card.trend}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span className="font-medium">
                近14日质控合格率与重拍率趋势
              </span>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate("/review/statistics")}>
                查看更多 <ArrowRight size={14} className="inline" />
              </Button>
            }
          >
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={<span className="font-medium">待办事项</span>}
            className="h-full"
          >
            <List
              dataSource={pendingTodos}
              locale={{ emptyText: "暂无待办事项" }}
              renderItem={(item) => (
                <List.Item
                  className="px-0 cursor-pointer hover:bg-gray-50 -mx-3 px-3 rounded transition-colors"
                  onClick={() => {
                    if (item.type === "qc" || item.type === "recheck") {
                      navigate(`/quality/${item.id}`);
                    } else {
                      navigate("/review/rectification");
                    }
                  }}
                >
                  <div className="flex items-center justify-between w-full py-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={14}
                        className={
                          item.type === "rectification"
                            ? item.isOverdue
                              ? "text-medical-red"
                              : "text-medical-orange"
                            : "text-medical-blue"
                        }
                      />
                      <span className="text-sm text-gray-700">{item.title}</span>
                    </div>
                    <Tag
                      color={item.statusColor as any}
                      style={{ margin: 0 }}
                    >
                      {item.statusText}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span className="font-medium">高频缺陷类型 TOP6</span>}
            extra={
              <Button type="link" size="small" onClick={() => navigate("/review/statistics")}>
                详细分析 <ArrowRight size={14} className="inline" />
              </Button>
            }
          >
            <ReactECharts option={defectBarOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span className="font-medium">技师合格率排名</span>}
            extra={
              <Button type="link" size="small" onClick={() => navigate("/review/statistics")}>
                全部技师 <ArrowRight size={14} className="inline" />
              </Button>
            }
          >
            <div className="space-y-4 pt-2">
              {technicianStats
                .sort((a, b) => b.passRate - a.passRate)
                .map((tech, idx) => (
                  <div key={tech.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
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
                        <span className="text-sm text-gray-700 font-medium">
                          {tech.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-500">
                          检查 {tech.totalExams} 例
                        </span>
                        <span
                          className={`font-semibold ${
                            tech.passRate >= 90
                              ? "text-medical-green"
                              : tech.passRate >= 80
                              ? "text-medical-orange"
                              : "text-medical-red"
                          }`}
                        >
                          {tech.passRate}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      percent={tech.passRate}
                      showInfo={false}
                      strokeColor={
                        tech.passRate >= 90
                          ? "#27AE60"
                          : tech.passRate >= 80
                          ? "#F39C12"
                          : "#E74C3C"
                      }
                      size="small"
                      trailColor="#f0f0f0"
                    />
                  </div>
                ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
