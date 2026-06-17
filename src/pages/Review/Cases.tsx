import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Descriptions,
  Empty,
  Divider,
} from "antd";
import {
  Search,
  BookOpen,
  Plus,
  Eye,
  PlayCircle,
  Filter,
  X,
} from "lucide-react";
import { useQCStore, getDefectName } from "@/store";
import type { CaseStudy } from "@/types";

const { Option } = Select;

export default function ReviewCases() {
  const { caseStudies, defectTypes } = useQCStore();
  const [keyword, setKeyword] = useState("");
  const [defectFilter, setDefectFilter] = useState<string | undefined>();
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [trainingMode, setTrainingMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredCases = caseStudies.filter((c) => {
    if (keyword && !c.title.includes(keyword) && !c.description.includes(keyword)) {
      return false;
    }
    if (defectFilter && !c.defectTypes.includes(defectFilter)) {
      return false;
    }
    return true;
  });

  const openDetail = (c: CaseStudy) => {
    setSelectedCase(c);
    setDetailVisible(true);
  };

  const startTraining = () => {
    setTrainingMode(true);
    setCurrentIndex(0);
  };

  const nextCase = () => {
    if (currentIndex < caseStudies.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedCase(caseStudies[currentIndex + 1]);
    }
  };

  const prevCase = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedCase(caseStudies[currentIndex - 1]);
    }
  };

  if (trainingMode && caseStudies.length > 0) {
    const trainingCase = caseStudies[currentIndex];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <PlayCircle size={22} className="text-medical-blue" />
              班前培训模式
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              第 {currentIndex + 1} / {caseStudies.length} 例
            </p>
          </div>
          <Button onClick={() => setTrainingMode(false)} icon={<X size={16} />}>
            退出培训
          </Button>
        </div>

        <Card>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={10}>
              <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden">
                <img
                  src={trainingCase.thumbnail}
                  alt={trainingCase.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </Col>
            <Col xs={24} lg={14}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    {trainingCase.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {trainingCase.defectTypes.map((d) => (
                      <Tag key={d} color="red">
                        {getDefectName(d, defectTypes)}
                      </Tag>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    患者：{trainingCase.patientName} · 创建时间：{trainingCase.createdAt}
                    · 整理人：{trainingCase.createdBy}
                  </p>
                </div>

                <Divider />

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    📋 案例描述
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {trainingCase.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    💡 教学要点
                  </h3>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {trainingCase.teachingValue}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button onClick={prevCase} disabled={currentIndex === 0}>
                    上一例
                  </Button>
                  <Space>
                    <Button type="primary" onClick={nextCase} disabled={currentIndex === caseStudies.length - 1}>
                      下一例
                    </Button>
                  </Space>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">典型案例库</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {caseStudies.length} 例典型不合格案例，供班前培训使用
          </p>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlayCircle size={16} />}
            onClick={startTraining}
          >
            进入培训模式
          </Button>
          <Button icon={<Plus size={16} />}>新增案例</Button>
        </Space>
      </div>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索案例标题或内容"
              prefix={<Search size={16} className="text-gray-400" />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="按缺陷类型筛选"
              allowClear
              style={{ width: "100%" }}
              value={defectFilter}
              onChange={setDefectFilter}
              suffixIcon={<Filter size={16} className="text-gray-400" />}
            >
              {defectTypes.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {filteredCases.length === 0 ? (
        <Card>
          <Empty description="暂无匹配的案例" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredCases.map((c) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={c.id}>
              <Card
                hoverable
                className="h-full overflow-hidden group"
                styles={{ body: { padding: 0 } }}
                onClick={() => openDetail(c)}
              >
                <div className="aspect-video bg-gray-100 overflow-hidden relative">
                  <img
                    src={c.thumbnail}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      type="primary"
                      size="small"
                      shape="circle"
                      icon={<Eye size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(c);
                      }}
                    />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 mb-2 line-clamp-1">
                    {c.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {c.defectTypes.slice(0, 2).map((d) => (
                      <Tag key={d} color="red" style={{ margin: 0 }}>
                        {getDefectName(d, defectTypes)}
                      </Tag>
                    ))}
                    {c.defectTypes.length > 2 && (
                      <Tag style={{ margin: 0 }}>+{c.defectTypes.length - 2}</Tag>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {c.description}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-gray-400">{c.createdAt}</span>
                    <span className="text-xs text-gray-400">{c.createdBy}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={selectedCase?.title}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedCase && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={10}>
                <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden">
                  <img
                    src={selectedCase.thumbnail}
                    alt={selectedCase.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Col>
              <Col xs={24} md={14}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="涉及缺陷">
                    <Space wrap>
                      {selectedCase.defectTypes.map((d) => (
                        <Tag key={d} color="red">
                          {getDefectName(d, defectTypes)}
                        </Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="患者">
                    {selectedCase.patientName}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {selectedCase.createdAt}
                  </Descriptions.Item>
                  <Descriptions.Item label="整理人">
                    {selectedCase.createdBy}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen size={16} />
                案例描述
              </h4>
              <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                {selectedCase.description}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                💡 教学价值
              </h4>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  {selectedCase.teachingValue}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
