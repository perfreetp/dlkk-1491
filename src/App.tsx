import { RouterProvider } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { router } from "@/router";

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#1E6FD9",
          borderRadius: 6,
          colorInfo: "#1E6FD9",
          fontFamily:
            '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
