import { useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Badge, Breadcrumb } from "antd";
import type { MenuProps } from "antd";
import {
  LayoutDashboard,
  ListChecks,
  ImageIcon,
  FileSearch,
  Settings,
  ChevronDown,
  Bell,
  LogOut,
  User,
} from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useQCStore } from "@/store";

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps["items"] = [
  {
    key: "/",
    icon: <LayoutDashboard size={18} />,
    label: "科室看板",
  },
  {
    key: "/queue",
    icon: <ListChecks size={18} />,
    label: "检查队列",
  },
  {
    key: "/quality",
    icon: <ImageIcon size={18} />,
    label: "图像质控",
  },
  {
    key: "/review",
    icon: <FileSearch size={18} />,
    label: "问题复盘",
    children: [
      { key: "/review/statistics", label: "统计分析" },
      { key: "/review/cases", label: "典型案例库" },
      { key: "/review/rectification", label: "整改追踪" },
      { key: "/review/report", label: "质控简报" },
    ],
  },
  {
    key: "/settings",
    icon: <Settings size={18} />,
    label: "规则设置",
    children: [
      { key: "/settings/rules", label: "质控规则" },
      { key: "/settings/notification", label: "通知设置" },
      { key: "/settings/staff", label: "人员管理" },
    ],
  },
];

const breadcrumbMap: Record<string, string[]> = {
  "/": ["科室看板"],
  "/queue": ["检查队列"],
  "/quality": ["图像质控"],
  "/review/statistics": ["问题复盘", "统计分析"],
  "/review/cases": ["问题复盘", "典型案例库"],
  "/review/rectification": ["问题复盘", "整改追踪"],
  "/review/report": ["问题复盘", "质控简报"],
  "/settings/rules": ["规则设置", "质控规则"],
  "/settings/notification": ["规则设置", "通知设置"],
  "/settings/staff": ["规则设置", "人员管理"],
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useQCStore();

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith("/quality")) return ["/quality"];
    if (path.startsWith("/review")) return ["/review"];
    if (path.startsWith("/settings")) return ["/settings"];
    return [path];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith("/review")) return ["/review"];
    if (path.startsWith("/settings")) return ["/settings"];
    return [];
  };

  const userMenu: MenuProps["items"] = [
    {
      key: "profile",
      icon: <User size={16} />,
      label: "个人信息",
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogOut size={16} />,
      label: "退出登录",
    },
  ];

  const breadcrumbItems = breadcrumbMap[location.pathname] || ["首页"];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        theme="dark"
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-medical-blue flex items-center justify-center text-white font-bold">
                乳
              </div>
              <span className="text-white font-semibold text-base">乳腺DR质控工作台</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-medical-blue flex items-center justify-center text-white font-bold">
              乳
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key as string)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          className="bg-white flex items-center justify-between px-6 shadow-sm"
          style={{ padding: "0 24px", height: 64, lineHeight: "64px" }}
        >
          <Breadcrumb items={breadcrumbItems.map((item) => ({ title: item }))} />
          <div className="flex items-center gap-4">
            <Badge count={5} size="small">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={20} className="text-gray-600" />
              </button>
            </Badge>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                <Avatar
                  size={32}
                  style={{ backgroundColor: "#1E6FD9" }}
                  className="flex items-center justify-center"
                >
                  {currentUser.name[0]}
                </Avatar>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-gray-800">
                    {currentUser.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {currentUser.roleName}
                  </span>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 0, padding: "20px 24px" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
