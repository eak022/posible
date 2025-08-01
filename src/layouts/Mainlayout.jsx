import React from "react";
import { Outlet } from "react-router-dom";
import SidebarLeft from "../components/SidebarLeft";
import Navbar from "../components/Navbar";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <SidebarLeft />
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-grow">
        {/* Navbar */}
        <Navbar />

        {/* Main content */}
        <main className="flex-grow overflow-hidden bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
