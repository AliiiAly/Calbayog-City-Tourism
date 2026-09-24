import React, { useState } from "react";

import Sidebar from "../common/Sidebar";
import AppHeader from "../common/AppHeader";
import BottomNav from "../common/BottomNav";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (
    <div className="page-scroll-container">
      <Sidebar
        role="admin"
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <AppHeader
        onMenuClick={() =>
          setSidebarOpen(true)
        }
        showSearch={true}
        showAnnouncements={false}
        isAdmin={true}
      />

      <main
        style={{
          minHeight:
            "calc(100vh - var(--header-height))",
          padding: "24px",
          paddingBottom: "100px",
        }}
      >
        {children}
      </main>

      <BottomNav role="admin" />
    </div>
  );
};

export default AdminLayout;