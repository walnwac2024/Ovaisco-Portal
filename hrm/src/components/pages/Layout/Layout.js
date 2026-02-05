import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "../Topbar/Topbar";
import { useAuth } from "../../../context/AuthContext";
import ChatPopup from "../../common/ChatPopup";
import api from "../../../utils/api";
import PWAInstallPrompt from "../../PWAInstallPrompt";

export default function Layout() {
  const { user } = useAuth();

  // Heartbeat to keep online status active
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = async () => {
      try {
        await api.post("/auth/heartbeat");
      } catch (e) {
        console.error("Heartbeat failed", e);
      }
    };

    // Initial heartbeat
    sendHeartbeat();

    // Every 2 minutes
    const interval = setInterval(sendHeartbeat, 120000);
    return () => clearInterval(interval);
  }, [user]);

  // Build a safe display name no matter how user is shaped
  // Support both { user: {...} } (old) and {...} (new) shapes
  const u = user?.user ? user.user : user;
  const userName =
    u?.name ||
    [u?.first_name, u?.last_name].filter(Boolean).join(" ") ||
    u?.email ||
    "User";

  return (
    <>
      <Topbar userName={userName} />
      <main className="page">
        <Outlet />
      </main>
      <ChatPopup />
      <PWAInstallPrompt />
    </>
  );
}
