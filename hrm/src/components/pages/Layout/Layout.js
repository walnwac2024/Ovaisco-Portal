import React, { lazy, Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "../Topbar/Topbar";
import { useAuth } from "../../../context/AuthContext";
import { usePushNotifications } from "../../../hooks/usePushNotifications";
import api from "../../../utils/api";
import PWAInstallPrompt from "../../PWAInstallPrompt";

const ChatPopup = lazy(() => import("../../common/ChatPopup"));

export default function Layout() {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  usePushNotifications(user);

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

  useEffect(() => {
    if (!user) return undefined;
    const loadChat = () => setShowChat(true);

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(loadChat, { timeout: 3500 });
      return () => window.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(loadChat, 2500);
    return () => window.clearTimeout(id);
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
      {showChat && (
        <Suspense fallback={null}>
          <ChatPopup />
        </Suspense>
      )}
      <PWAInstallPrompt />
    </>
  );
}
