// backend/Routes/Route.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Controllers
const {
    login,
    logout,
    me,
    heartbeat,
    changePassword,
    uploadAvatar
} = require("../Controller/UserDeatils/Login");
const Role = require("../Controller/UserDeatils/Role");
const Attendance = require("../Controller/Attendance/Attendance");
const AttendanceSettings = require("../Controller/Attendance/AttendanceSettings");
const Leave = require("../Controller/Leaves/Leave");
const Performance = require("./PerformanceRoutes");
const News = require("../Controller/News/NewsController");
const Notifications = require("../Controller/UserDeatils/NotificationController");
const Chat = require("../Controller/UserDeatils/ChatController");
const Audit = require("../Controller/Audit/AuditController");
const Timeline = require("../Controller/Employees/TimelineController");
const Settings = require("../Controller/Settings/SettingsController");
const SystemSettings = require("../Controller/Settings/SystemSettingsController");


const {
    listEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    updateEmployeeLogin,
    updateEmployeeStatus,
    addEmployeeDocuments,
    listEmployeeDocuments,
    updateEmployeeDocument,
    deleteEmployeeDocument,
    replaceEmployeeDocumentFile,
    downloadEmployeeDocument,
    updateEmployeeAvatar,
    lookupStations,
    lookupDepartments,
    lookupGroups,
    lookupDesignations,
    lookupStatuses,
    lookupRoleTemplates,
    deleteEmployee,
    importEmployees,
    exportEmployees,
    getImportTemplate,
    sendCredentials,
    lookupUserTypes,
    listBasicEmployees
} = require("../Controller/Employees/Employees");

const {
    getTypePermissions,
    updateTypePermissions,
    listUserTypes,
    listAllPermissions
} = require("../Controller/UserDeatils/PermissionController");

// Middleware
const { isAuthenticated, requireRole, requireFeatures } = require("../middlewares/middleware");

// Multer storage for documents
const docsDir = path.join(__dirname, "..", "uploads", "documents");
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

const docsStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, docsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});
const docsUpload = multer({
    storage: docsStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Shared upload middleware (ensure this is configured for news/avatars if needed)
const upload = require('../Middleware/uploadMiddleware');

// Auth routes
router.post("/auth/login", login);
router.get("/auth/me", me);
router.post("/auth/logout", logout);
router.post("/auth/heartbeat", heartbeat);
router.post("/auth/change-password", isAuthenticated, changePassword);
router.post("/auth/me/avatar", isAuthenticated, upload.single("image"), uploadAvatar);
router.get("/me/menu", isAuthenticated, Role.getMenu);
router.get("/dashboard", isAuthenticated, Role.getDashboard);

// Notification routes
router.get("/notifications", isAuthenticated, Notifications.listMyNotifications);
router.patch("/notifications/:id/read", isAuthenticated, Notifications.markAsRead);
router.patch("/notifications/read-all", isAuthenticated, Notifications.markAllAsRead);

// Chat routes
router.get("/chat/rooms", isAuthenticated, Chat.getAuthorityRooms);
router.get("/chat/authority-rooms", isAuthenticated, Chat.getAuthorityRooms);
router.get("/chat/messages/:roomId", isAuthenticated, Chat.getMessages);
router.post("/chat/messages", isAuthenticated, upload.single("file"), Chat.sendMessage);
router.post("/chat/send", isAuthenticated, upload.single("file"), Chat.sendMessage);
router.get("/chat/unread-counts", isAuthenticated, Chat.getUnreadCounts);
router.get("/chat/unread", isAuthenticated, Chat.getUnreadCounts);
router.post("/chat/read/:roomId", isAuthenticated, Chat.markAsRead);

const Push = require("../Controller/UserDeatils/PushController");

// Permission routes
router.get("/permissions/user-types", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), listUserTypes);
router.get("/permissions/all", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), listAllPermissions);
router.get("/permissions/type/:typeId", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), getTypePermissions);
router.post("/permissions/type/:typeId", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), updateTypePermissions);

// Push Notification routes
router.post("/push/subscribe", isAuthenticated, Push.subscribe);
router.post("/push/unsubscribe", isAuthenticated, Push.unsubscribe);

// Audit routes
router.get("/audit/logs", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Audit.listLogs);
router.get("/audit/filters", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Audit.listLogFilters);

// Settings routes
router.get("/settings/branding", Settings.getBranding);
router.post("/settings/branding", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), upload.single("logo"), Settings.updateBranding);

// System Settings routes (Dropdown Management)
router.get("/settings/:type", isAuthenticated, SystemSettings.listSettings);
router.post("/settings/:type", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), SystemSettings.createSetting);
router.patch("/settings/:type/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), SystemSettings.updateSetting);
router.delete("/settings/:type/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), SystemSettings.deleteSetting);

// Timeline routes
router.get("/employees/:id/timeline", isAuthenticated, Timeline.getTimeline);
router.post("/employees/:id/timeline", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Timeline.addEvent);


// Employee routes
router.get("/employees", isAuthenticated, listEmployees);
router.get("/employees/lookups/stations", isAuthenticated, lookupStations);
router.get("/employees/lookups/departments", isAuthenticated, lookupDepartments);
router.get("/employees/lookups/groups", isAuthenticated, lookupGroups);
router.get("/employees/lookups/designations", isAuthenticated, lookupDesignations);
router.get("/employees/lookups/statuses", isAuthenticated, lookupStatuses);
router.get("/employees/lookups/role-templates", isAuthenticated, lookupRoleTemplates);
router.get("/employees/lookups/user-types", isAuthenticated, lookupUserTypes);
router.get("/employees/lookups/basic", isAuthenticated, listBasicEmployees);

// ✅ Import Employees (Excel)
router.post("/employees/import", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), upload.single("file"), importEmployees);

// ✅ Export & Template
router.get("/employees/export", isAuthenticated, exportEmployees);
router.get("/employees/import-template", isAuthenticated, getImportTemplate);
router.post("/employees/send-credentials", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), sendCredentials);

router.get("/employees/:id", isAuthenticated, getEmployeeById);

// Existing routes...
router.post("/employees", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), upload.fields([{ name: "avatar", maxCount: 1 }, { name: "documents" }]), createEmployee);
router.patch("/employees/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), updateEmployee);
router.put("/employees/:id/login", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), updateEmployeeLogin);
router.patch("/employees/:id/status", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), updateEmployeeStatus);
router.delete("/employees/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), deleteEmployee);
router.post("/employees/:id/avatar", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), upload.single("avatar"), updateEmployeeAvatar);

// Employee Document routes
router.post("/employees/:id/documents", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), docsUpload.array("documents"), addEmployeeDocuments);
router.get("/employees/:id/documents", isAuthenticated, listEmployeeDocuments);
router.patch("/employees/:id/documents/:docId", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), updateEmployeeDocument);
router.delete("/employees/:id/documents/:docId", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), deleteEmployeeDocument);
router.put("/employees/:id/documents/:docId/file", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), docsUpload.single("file"), replaceEmployeeDocumentFile);
router.get("/employees/:id/documents/:docId/download", isAuthenticated, downloadEmployeeDocument);

// Attendance routes
router.get("/attendance/offices", isAuthenticated, Attendance.listOffices);
router.get("/attendance/today", isAuthenticated, Attendance.getToday);
router.post("/attendance/punch", isAuthenticated, Attendance.punch);
router.get("/attendance/admin/missing", isAuthenticated, Attendance.adminMissing);
router.get("/attendance/summary/personal", isAuthenticated, Attendance.getPersonalSummary);
router.get("/attendance/report/monthly/all", isAuthenticated, Attendance.getMonthlyReportAll); // ✅ BULK EXPORT
router.get("/attendance/report/monthly", isAuthenticated, Attendance.getMonthlyReport);

// Attendance Settings
router.get("/attendance/settings/shifts", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), AttendanceSettings.getShifts);
router.patch("/attendance/settings/shifts/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), AttendanceSettings.updateShift);
router.get("/attendance/settings/rules", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), AttendanceSettings.getRules);
router.put("/attendance/settings/rules/active", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), AttendanceSettings.updateActiveRule);
router.post("/attendance/settings/shifts/bulk-assign", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), AttendanceSettings.bulkAssignShift);

// Leave routes
router.get("/leaves/types", isAuthenticated, Leave.getLeaveTypes);
router.get("/leaves/balances", isAuthenticated, Leave.getLeaveBalances);
router.post("/leaves/apply", isAuthenticated, Leave.applyLeave);
router.get("/leaves/my", isAuthenticated, Leave.getMyLeaves);
router.get("/leaves/admin/all", isAuthenticated, requireRole("super_admin", "admin", "hr", "manager", "developer"), Leave.getAllLeaves);
router.patch("/leaves/approve/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "manager", "developer"), Leave.approveLeave);
// Lookup Management
// Lookup Management (Controller not found yet)
// router.get("/lookups/:type", isAuthenticated, requireFeatures("permissions_edit"), Lookups.listLookups);
// router.post("/lookups/:type", isAuthenticated, requireFeatures("permissions_edit"), Lookups.addLookup);
// router.patch("/lookups/:type/:id", isAuthenticated, requireFeatures("permissions_edit"), Lookups.updateLookup);
// router.delete("/lookups/:type/:id", isAuthenticated, requireFeatures("permissions_edit"), Lookups.deleteLookup);

// Performance
router.use("/performance", Performance);
router.post("/leaves/types", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Leave.createLeaveType);
router.patch("/leaves/types/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Leave.updateLeaveType);
router.delete("/leaves/types/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Leave.deleteLeaveType);
router.get("/leaves/summary/stats", isAuthenticated, Leave.getLeaveDashboardStats);

// News routes
router.get("/news", isAuthenticated, News.listNews);
router.get("/news/reactions", isAuthenticated, News.getNewsReactions);
router.post("/news", isAuthenticated, requireRole("hr", "admin", "super_admin", "developer"), upload.single('image'), News.createNews);
router.post("/news/:id/react", isAuthenticated, News.toggleReaction);
router.patch("/news/:id", isAuthenticated, requireRole("hr", "admin", "super_admin", "developer"), upload.single('image'), News.updateNews);
router.delete("/news/:id", isAuthenticated, requireRole("hr", "admin", "super_admin", "developer"), News.deleteNews);

module.exports = router;
