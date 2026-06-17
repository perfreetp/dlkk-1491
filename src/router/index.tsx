import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Queue from "@/pages/Queue";
import QualityControl from "@/pages/QualityControl";
import ReviewStatistics from "@/pages/Review/Statistics";
import ReviewCases from "@/pages/Review/Cases";
import ReviewRectification from "@/pages/Review/Rectification";
import ReviewReport from "@/pages/Review/Report";
import SettingsRules from "@/pages/Settings/Rules";
import SettingsNotification from "@/pages/Settings/Notification";
import SettingsStaff from "@/pages/Settings/Staff";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "queue", element: <Queue /> },
      { path: "quality", element: <QualityControl /> },
      { path: "quality/:id", element: <QualityControl /> },
      { path: "review/statistics", element: <ReviewStatistics /> },
      { path: "review/cases", element: <ReviewCases /> },
      { path: "review/rectification", element: <ReviewRectification /> },
      { path: "review/report", element: <ReviewReport /> },
      { path: "settings/rules", element: <SettingsRules /> },
      { path: "settings/notification", element: <SettingsNotification /> },
      { path: "settings/staff", element: <SettingsStaff /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
