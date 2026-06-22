// backend/Routes/Route.js
const express = require("express");
const router = express.Router();

router.get("/debug-ping", (req, res) => res.json({ message: "pong" }));
const path = require("path");
const multer = require("multer");
const { getTenantUploadDir, getUploadedFileUrl } = require("../Utils/uploadPaths");

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
const Assistant = require("../Controller/Assistant/AssistantController");
const Audit = require("../Controller/Audit/AuditController");
const Timeline = require("../Controller/Employees/TimelineController");
const Settings = require("../Controller/Settings/SettingsController");
const SystemSettings = require("../Controller/Settings/SystemSettingsController");
const Gamification = require("../Controller/Gamification/GamificationController");
const Office = require("../Controller/Office/OfficeController");
const Biometrics = require("../Controller/UserDeatils/BiometricController");
const Birthday = require("../Controller/UserDeatils/BirthdayController");

// const SaaS = require("../Controller/SaaS/SaaSController");



const {
    listEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    createEmployeeLeaveBalances,
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
const { isAuthenticated, requireRole, requireFeatures, requireFeaturesOrSelf } = require("../middlewares/middleware");

const docsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const docsDir = getTenantUploadDir(req, "documents");
        cb(null, docsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);
        file.relativeUrl = getUploadedFileUrl({
            path: path.join(getTenantUploadDir(req, "documents"), filename),
        });
        cb(null, filename);
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

// Birthday routes
router.post("/birthdays/wish", isAuthenticated, Birthday.sendWish);
router.get("/birthdays/wishes/received", isAuthenticated, Birthday.getWishesReceived);


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

// AI Assistant routes: read-only in phase 1
router.post("/assistant/chat", isAuthenticated, Assistant.chat);

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
router.post(
    "/settings/branding",
    isAuthenticated,
    requireFeatures("branding_manage"),
    upload.fields([{ name: "logo", maxCount: 1 }, { name: "favicon", maxCount: 1 }]),
    Settings.updateBranding
);

// System Settings routes (Dropdown Management)
router.get("/settings/:type", isAuthenticated, SystemSettings.listSettings);
router.post("/settings/:type", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), SystemSettings.createSetting);
router.patch("/settings/:type/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), SystemSettings.updateSetting);
router.delete("/settings/:type/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), SystemSettings.deleteSetting);

// Timeline routes
router.get("/employees/:id/timeline", isAuthenticated, requireFeaturesOrSelf("timeline_view"), Timeline.getTimeline);
router.post("/employees/:id/timeline", isAuthenticated, requireFeatures("timeline_manage"), Timeline.addEvent);


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
router.patch("/employees/:id", isAuthenticated, updateEmployee);
router.post("/employees/:id/leave-balances", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), createEmployeeLeaveBalances);
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
router.post("/attendance/amt-sync", Attendance.syncAmtAttendance);
router.get("/attendance/offices", isAuthenticated, Attendance.listOffices);
router.get("/attendance/today", isAuthenticated, Attendance.getToday);
router.post("/attendance/punch", isAuthenticated, Attendance.punch);
router.get("/attendance/admin/missing", isAuthenticated, Attendance.adminMissing);
router.get("/attendance/admin/daily-summary", isAuthenticated, Attendance.getDailyAdminSummary);
router.get("/attendance/summary/personal", isAuthenticated, Attendance.getPersonalSummary);
router.get("/attendance/report/monthly/all", isAuthenticated, Attendance.getMonthlyReportAll); // ✅ BULK EXPORT
router.get("/attendance/report/monthly", isAuthenticated, Attendance.getMonthlyReport);
router.get("/attendance/logs", isAuthenticated, requireFeatures("attendance_view"), Attendance.getAttendanceLogs);
router.get("/attendance/audit-locations", isAuthenticated, requireFeatures("attendance_audit"), Attendance.listLocationAudit);

// Biometric Attendance
router.get("/biometric/registration-options", isAuthenticated, Biometrics.getRegistrationOptions);
router.post("/biometric/verify-registration", isAuthenticated, Biometrics.verifyRegistration);
router.get("/biometric/authentication-options", isAuthenticated, Biometrics.getAuthenticationOptions);
router.post("/biometric/verify-authentication", isAuthenticated, Biometrics.verifyAuthentication);


// Attendance Settings
router.get("/attendance/settings/shifts", isAuthenticated, requireFeatures("attendance_manage_settings"), AttendanceSettings.getShifts);
router.put("/attendance/settings/shifts/:id", isAuthenticated, requireFeatures("attendance_manage_settings"), AttendanceSettings.updateShift);
router.get("/attendance/settings/rules", isAuthenticated, requireFeatures("attendance_manage_settings"), AttendanceSettings.getRules);
router.put("/attendance/settings/rules/active", isAuthenticated, requireFeatures("attendance_manage_settings"), AttendanceSettings.updateActiveRule);
router.post("/attendance/settings/shifts/bulk-assign", isAuthenticated, requireFeatures("attendance_manage_settings"), AttendanceSettings.bulkAssignShift);

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
router.delete("/leaves/:id", isAuthenticated, Leave.deleteLeaveApplication);

// News routes
router.get("/news", isAuthenticated, News.listNews);
router.get("/news/reactions", isAuthenticated, requireFeatures("news_view"), News.getNewsReactions);
router.post("/news", isAuthenticated, requireFeatures("news_manage"), upload.single('image'), News.createNews);
router.post("/news/:id/react", isAuthenticated, requireFeatures("news_react"), News.toggleReaction);
router.patch("/news/:id", isAuthenticated, requireFeatures("news_manage"), upload.single('image'), News.updateNews);
router.delete("/news/:id", isAuthenticated, requireFeatures("news_manage"), News.deleteNews);

// News Comments
router.get("/news/:id/comments", isAuthenticated, requireFeatures("news_view"), News.listComments);
router.post("/news/:id/comments", isAuthenticated, requireFeatures("news_comment"), News.addComment);
router.delete("/news/comments/:commentId", isAuthenticated, requireFeatures("news_manage_comments"), News.deleteComment);

// Gamification routes
router.get("/gamification/leaderboard", isAuthenticated, Gamification.getLeaderboard);
router.get("/gamification/badges/me", isAuthenticated, Gamification.getMyBadges);
router.get("/gamification/badges/:employeeId", isAuthenticated, Gamification.getEmployeeBadges);

// Payroll routes
const Payroll = require("../Controller/Payroll/PayrollController");

// Minimal Payroll Routes
router.post("/payroll/lock-salary", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.lockSalary);
router.post("/payroll/unlock-salary", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.unlockSalary);
router.post("/payroll/import-bulk-salary", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.bulkImportSalaries);
router.get("/payroll/base-settings/:employeeId", isAuthenticated, Payroll.getSalaryDetails);
router.get("/payroll/increment/history/:employeeId", isAuthenticated, Payroll.getIncrementHistory);
router.post("/payroll/generate", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.generatePayroll);
router.post("/payroll/finalize", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.finalizePayroll);
router.post("/payroll/increment", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.applyIncrement);
router.post("/payroll/bulk-increment", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.applyBulkIncrement);
router.put("/payroll/update/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.updatePayrollRecord);
router.delete("/payroll/record/:id", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.deletePayrollRecord);

router.get("/payroll/self/list", isAuthenticated, Payroll.getMyPayrollList);
router.get("/payroll/detail/:id", isAuthenticated, Payroll.getPayrollDetail);
router.get("/payroll/admin/list", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.listAllPayroll);
router.get("/payroll/admin/salary-overview", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.listAllSalaryDetails);
router.get("/payroll/admin/export-salaries", isAuthenticated, requireRole("super_admin", "admin", "hr", "developer"), Payroll.exportSalaryReport);

// Special middleware for Office Requisition Apply
const canApplyOffice = (req, res, next) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    
    // Admin/Super Admin/Developer bypass all restrictions
    const userRoles = (Array.isArray(user.roles) ? user.roles : []).map(r => String(r).toLowerCase());
    if (userRoles.includes('admin') || userRoles.includes('super_admin') || userRoles.includes('developer')) {
        return next();
    }

    const role = String(user.role || '').toLowerCase();
    // HR and Accounts roles are generally not allowed to apply (as per request)
    if (['hr', 'accounts'].includes(role)) {
        return res.status(403).json({ message: "Forbidden: HR and Accounts should not apply here." });
    }

    const dept = (user.department || user.Department || '').toString().toLowerCase().trim();
    const feats = new Set(Array.isArray(user.features) ? user.features : []);
    
    // Allow if they have the feature OR if they are in the allowed departments
    const canApply = (feats.has('office_req_apply') || ['fnsd', 'administration-hoe'].includes(dept));
    if (canApply) {
        return next();
    }

    return res.status(403).json({ message: "Forbidden: Missing apply permission." });
};

const canApproveHR = (req, res, next) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });

    // Admin/Super Admin/Developer bypass all restrictions
    const userRoles = (Array.isArray(user.roles) ? user.roles : []).map(r => String(r).toLowerCase());
    if (userRoles.includes('admin') || userRoles.includes('super_admin') || userRoles.includes('developer')) {
        return next();
    }

    const feats = new Set(Array.isArray(user.features) ? user.features : []);
    // HR department check (matching DashboardTabsLayout)
    const dept = (user.department || user.Department || '').toString().toLowerCase().trim();
    const isHR = dept.includes('human resource');
    if (feats.has('office_req_approve_hr') || isHR) return next();
    return res.status(403).json({ message: "Forbidden: Missing HR approval permission." });
};

const canApproveAccounts = (req, res, next) => {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });

    // Admin/Super Admin/Developer bypass all restrictions
    const userRoles = (Array.isArray(user.roles) ? user.roles : []).map(r => String(r).toLowerCase());
    if (userRoles.includes('admin') || userRoles.includes('super_admin') || userRoles.includes('developer')) {
        return next();
    }

    const feats = new Set(Array.isArray(user.features) ? user.features : []);
    const dept = (user.department || user.Department || '').toString().toLowerCase().trim();
    const role = String(user.role || '').toLowerCase();
    
    const accountsDepts = [
        'finance and accounts department -hoe',
        'accounts & finance',
        'accounts',
        'finance'
    ];
    const isAccounts = dept ? accountsDepts.includes(dept) : false;

    // Allow if they have the custom feature OR if they are in the Accounts department
    if (feats.has('office_req_approve_accounts') || isAccounts) {
        return next();
    }
    return res.status(403).json({ message: "Forbidden: Missing accounts approval permission." });
};

// Office Management Requisition routes
router.get("/office/accounts-employees", isAuthenticated, Office.listAccountsEmployees);
router.post("/office/requisitions", isAuthenticated, canApplyOffice, Office.createRequisition);
router.get("/office/requisitions", isAuthenticated, Office.listRequisitions);
router.get("/office/requisitions/:id", isAuthenticated, Office.getRequisitionById);
router.patch("/office/requisitions/:id/approve-hr", isAuthenticated, canApproveHR, Office.approveHR);
router.patch("/office/requisitions/:id/approve-accounts", isAuthenticated, canApproveAccounts, Office.approveAccounts);

// SaaS / Developer Routes
// router.get("/saas/stats", isAuthenticated, requireRole("developer"), SaaS.getPlatformStats);
// router.get("/saas/companies", isAuthenticated, requireRole("developer"), SaaS.listCompanies);
// router.patch("/saas/companies/:id/status", isAuthenticated, requireRole("developer"), SaaS.updateCompanyStatus);
// router.post("/saas/companies", isAuthenticated, requireRole("developer"), SaaS.provisionCompany);

module.exports = router;
