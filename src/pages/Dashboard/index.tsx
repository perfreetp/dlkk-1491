import { Card, Row, Col, Statistic, List, Tag, Progress, Button, Alert } from "antd";
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
  ShieldAlert,
  User,
  AlertCircle,
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
        responsible: e.technician,
      })),
    ...examinations
      .filter((e) => e.status === "rechecking" || e.recheckRequested)
      .slice(0, 2)
      .map((e) => ({
        type: "recheck" as const,
        id: e.id,
        title: `复核中 - ${e.patientName}`,
        time: e.examTime,
        status: e.status,
        statusText: "待复核",
        statusColor: "warning",
        responsible: e.technician,
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
          responsible: t.responsible,
          relatedExamId: t.relatedExamId,
          relatedExamPatientName: t.relatedExamPatientName,
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
                      navigate(`/review/rectification?highlight=${item.id}`);
                    }
                  }}
                >
                  <div className="flex items-center justify-between w-full py-1.5">
                    <div className="flex-1 min-w-0">
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
                        <span className="text-sm text-gray-700 font-medium truncate">
                          {item.title}
                        </span>
                      </div>
                      {item.responsible && (
                        <div className="text-xs text-gray-400 mt-1 pl-6 flex items-center gap-3">
                          <span>责任人：{item.responsible}</span>
                          {item.type === "rectification" && item.relatedExamPatientName && (
                            <span>关联检查：{item.relatedExamPatientName}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Tag
                      color={item.statusColor as any}
                      style={{ margin: 0, flexShrink: 0 }}
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

      {(() => {
        const riskItems: {
          type: "retake" | "overdue" | "repeat";
          level: "high" | "medium";
          title: string;
          detail: string;
          action?: string;
          onClick?: () => void;
        }[] = [];

        const recentRetakeExams = examinations.filter((e) => {
          if (!e.recheckHistory || e.recheckHistory.length === 0) return false;
          const retakeActions = e.recheckHistory.filter(
            (h) => h.action === "process" && h.result === "retake"
          );
          return retakeActions.length >= 2;
        });
        recentRetakeExams.forEach((exam) => {
          const retakeCount = exam.recheckHistory!.filter(
            (h) => h.action === "process" && h.result === "retake"
          ).length;
          riskItems.push({
            type: "retake",
            level: "high",
            title: `${exam.patientName} 多次退回重拍`,
            detail: `已退回重拍${retakeCount}次，技师：${exam.technician}`,
            action: "查看详情",
            onClick: () => navigate(`/quality/${exam.id}`),
          });
        });

        const overdueTasks = rectificationTasks.filter(
          (t) => t.status !== "completed" && dayjs(t.deadline).isBefore(dayjs())
        );
        overdueTasks.forEach((task) => {
          const overdueDays = dayjs().diff(dayjs(task.deadline), "day");
          riskItems.push({
            type: "overdue",
            level: overdueDays >= 7 ? "high" : "medium",
            title: `整改逾期：${task.title}`,
            detail: `责任人：${task.responsible}，已逾期${overdueDays}天`,
            action: "查看整改",
            onClick: () => navigate(`/review/rectification?highlight=${task.id}`),
          });
        });

        const technicianDefectMap: Record<string, Record<string, number>> = {};
        examinations.forEach((exam) => {
          if (!exam.technician || exam.defects.length === 0) return;
          if (!technicianDefectMap[exam.technician]) {
            technicianDefectMap[exam.technician] = {};
          }
          exam.defects.forEach((defectId) => {
            technicianDefectMap[exam.technician][defectId] =
              (technicianDefectMap[exam.technician][defectId] || 0) + 1;
          });
        });
        Object.entries(technicianDefectMap).forEach(([techName, defects]) => {
          Object.entries(defects).forEach(([defectId, count]) => {
            if (count >= 3) {
              const defect = defectTypes.find((d) => d.id === defectId);
              riskItems.push({
                type: "repeat",
                level: count >= 5 ? "high" : "medium",
                title: `${techName} 重复出现同类缺陷`,
                detail: `${defect?.name || defectId} 出现${count}次`,
                action: "查看技师",
                onClick: () => navigate("/review/statistics"),
              });
            }
          });
        });

        if (riskItems.length === 0) return null;

        const highRiskCount = riskItems.filter((r) => r.level === "high").length;

        return (
          <Card
            title={
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-medical-red" />
                <span className="font-medium">质控风险提醒</span>
                {highRiskCount > 0 && (
                  <Tag color="error">{highRiskCount} 项高风险</Tag>
                )}
              </div>
            }
            extra={
              <span className="text-xs text-gray-400">
                供早会前快速浏览重点问题
              </span>
            }
          >
            <div className="space-y-3">
              {riskItems.slice(0, 8).map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                    item.level === "high"
                      ? "bg-red-50 border-red-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                  onClick={item.onClick}
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      item.type === "retake"
                        ? "bg-red-100 text-medical-red"
                        : item.type === "overdue"
                        ? "bg-orange-100 text-medical-orange"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {item.type === "retake" ? (
                      <XCircle size={14} />
                    ) : item.type === "overdue" ? (
                      <Clock size={14} />
                    ) : (
                      <AlertCircle size={14} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {item.title}
                      </span>
                      {item.level === "high" && (
                        <Tag color="error" style={{ margin: 0, fontSize: 11 }}>
                          高风险
                        </Tag>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                  {item.action && (
                    <Button type="link" size="small" className="flex-shrink-0">
                      {item.action} <ArrowRight size={12} className="inline" />
                    </Button>
                  )}
                </div>
              ))}
              {riskItems.length > 8 && (
                <div className="text-center text-sm text-gray-400 pt-2">
                  还有 {riskItems.length - 8} 项风险提示，点击查看全部
                </div>
              )}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
