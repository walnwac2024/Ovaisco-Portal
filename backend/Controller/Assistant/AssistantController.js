const { pool } = require("../../Utils/db");
const { recordLog } = require("../../Utils/AuditUtils");

function userHasFullAccess(user) {
    const level = Number(user?.flags?.level || user?.permission_level || 0);
    const roles = Array.isArray(user?.roles) ? user.roles.map((r) => String(r).toLowerCase()) : [];
    return level > 6 || roles.some((r) => ["developer", "super_admin", "admin", "hr"].includes(r));
}

function normalizeMessage(value) {
    return String(value || "").trim().slice(0, 1200);
}

async function safeQuery(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return { rows, error: null };
    } catch (error) {
        return { rows: [], error };
    }
}

function hasAny(text, words) {
    const lower = text.toLowerCase();
    return words.some((word) => lower.includes(word));
}

function formatBool(value) {
    return Number(value) === 1 ? "enabled" : "disabled";
}

const TOPIC_KEYWORDS = {
    leave: ["leave", "leaves", "balance", "chutti", "half leave", "apply leave", "my leaves"],
    attendance: ["attendance", "punch", "check in", "check out", "location", "office", "shift", "ios", "iphone", "gps", "late", "absent"],
    reports: ["report", "reports", "attendance daily report", "daily report", "csv", "export", "print", "section"],
    permissions: ["permission", "permissions", "access", "module", "role", "not allowed", "forbidden", "unauthorized", "403"],
    login: ["login", "logout", "password", "portal", "company code", "session", "sign in", "sign out"],
    employee: ["employee", "employees", "emp", "user", "add employee", "edit employee", "status", "designation", "department"],
    profile: ["profile", "photo", "picture", "avatar", "personal", "email", "phone", "name", "details", "account"],
    payroll: ["payroll", "salary", "payslip", "pay slip", "deduction", "increment", "bonus", "allowance"],
    timesheet: ["timesheet", "time sheet", "working hours", "hours log", "work log"],
    dashboard: ["dashboard", "home", "summary", "team", "tribe", "kpi", "widget", "card", "blank page"],
    news: ["news", "announcement", "post", "comment", "reaction"],
    branding: ["branding", "brand", "logo", "favicon", "color", "theme", "company color"],
    officeManagement: ["office management", "requisition", "request", "approval", "procurement", "store"],
    recruitment: ["recruitment", "candidate", "job", "hiring", "interview"],
    performance: ["performance", "kpi", "goal", "evaluation", "pip"],
    documents: ["document", "documents", "file", "upload", "attachment"],
    notifications: ["notification", "notifications", "bell", "alert"],
    chat: ["chat", "message", "dept", "department chat", "authority"],
    settings: ["settings", "organization", "department", "designation", "employment type", "blood group", "religion", "marital"],
};

const TOPIC_FEATURES = {
    leave: ["leave_view", "leave_apply", "leave_request", "leave_approve", "leave_settings"],
    attendance: ["attendance_view", "attendance_edit", "attendance_audit", "attendance_view_logs", "attendance_manage_settings", "attendance_report"],
    reports: ["reports_view", "attendance_report", "reports_print", "reports_export"],
    permissions: ["permissions_view", "permissions_edit"],
    payroll: [
        "payroll_view",
        "payroll_view_own",
        "payroll_view_all",
        "payroll_salary_setup",
        "payroll_run_manage",
        "payroll_increment_manage",
        "payroll_overview_view",
        "payroll_view_reports",
    ],
    timesheet: ["timesheet_view", "timesheet_submit", "timesheet_approve"],
    branding: ["branding_view", "branding_manage"],
    news: ["news_manage"],
    settings: ["system_settings_view", "permissions_edit"],
    officeManagement: [
        "office_requisition_apply",
        "office_requisition_hr_approve",
        "office_requisition_accounts_approve",
        "office_requisition_view_all",
    ],
};

const VISIBILITY_WORDS = [
    "cannot see", "can't see", "not showing", "not visible", "missing", "hide", "hidden",
    "blank", "empty", "not open", "not opening", "not working", "issue", "problem", "error",
];

const ATTENDANCE_PUNCH_WORDS = [
    "punch", "check in", "check out", "location", "gps", "office", "shift", "ios", "iphone", "mark attendance",
];

const APP_KEYWORDS = [...new Set(Object.values(TOPIC_KEYWORDS).flat())];

function detectTopics(message) {
    const lower = message.toLowerCase();
    return Object.entries(TOPIC_KEYWORDS)
        .filter(([, words]) => hasAny(lower, words))
        .map(([topic]) => topic);
}

function getUserFeatures(user) {
    return new Set((user?.features || []).map((feature) => String(feature).toLowerCase()));
}

function buildFeatureDiagnostics(user, topics) {
    const featureSet = getUserFeatures(user);
    const fullAccess = userHasFullAccess(user);
    const featureCodes = [...new Set(topics.flatMap((topic) => TOPIC_FEATURES[topic] || []))];

    if (!featureCodes.length) return null;

    const matched = featureCodes.filter((code) => featureSet.has(code));
    if (fullAccess) {
        return {
            title: "Access clues",
            status: "ok",
            detail: "Your role looks like full-access/admin level, so if a page is missing the issue is more likely route, data, filter, or frontend state.",
        };
    }

    return {
        title: "Access clues",
        status: matched.length ? "ok" : "needs_action",
        detail: matched.length
            ? `Your session has matching permission(s): ${matched.slice(0, 6).join(", ")}.`
            : `No obvious matching permission found in your session for this topic. HR/Admin should review role permissions.`,
    };
}

function buildTopicGuidance(topics, lower) {
    const lines = [];
    const hasTopic = (topic) => topics.includes(topic);
    const visibilityIssue = hasAny(lower, VISIBILITY_WORDS);

    if (hasTopic("leave")) {
        lines.push("For leave issues, check current-year leave balances, leave type setup, and whether the employee has balances created from Add/Edit Employee.");
    }
    if (hasTopic("attendance")) {
        if (hasAny(lower, ATTENDANCE_PUNCH_WORDS)) {
            lines.push("For attendance punch issues, active office location, employee station, shift assignment, browser location permission, and HTTPS/secure context are important.");
        } else {
            lines.push("For attendance visibility/report issues, check attendance permission, selected date/month filters, and whether attendance punches exist for that period.");
        }
    }
    if (hasTopic("reports")) {
        lines.push("For reports, first confirm the Reports menu is visible, the date/month filters are correct, and the role has reports/attendance report permission.");
    }
    if (hasTopic("profile")) {
        lines.push("For profile issues, employee master data comes from the employee record. Photo/avatar problems usually need upload, file path, or cache checking.");
    }
    if (hasTopic("payroll")) {
        lines.push("For payroll issues, confirm payroll permissions, salary base settings, selected month/year, and whether payroll has been generated or finalized.");
    }
    if (hasTopic("timesheet")) {
        lines.push("For timesheet issues, check timesheet access, submission permission, and whether the feature is enabled for the role.");
    }
    if (hasTopic("employee")) {
        lines.push("For employee setup issues, check employee status, login enabled, role/user type, department, designation, office location, shift, and leave balances.");
    }
    if (hasTopic("permissions")) {
        lines.push("Module access is controlled by role/user type permissions. A user cannot view or change data beyond their allowed permission scope.");
    }
    if (hasTopic("login")) {
        lines.push("For login issues, confirm the correct company portal URL, user email, password, active status, login enabled flag, and company code/session.");
    }
    if (hasTopic("dashboard")) {
        lines.push("For dashboard/blank page issues, check browser console errors, expired session, missing permissions, and whether the page route belongs to the current company portal.");
    }
    if (hasTopic("news")) {
        lines.push("For news issues, check news permissions, post status, and whether comments/reactions are enabled for the company.");
    }
    if (hasTopic("branding")) {
        lines.push("For branding issues, check company branding settings, uploaded logo/favicon paths, and refresh cache after saving changes.");
    }
    if (hasTopic("officeManagement")) {
        lines.push("For office/procurement/store requests, check the request status, approval stage, and the role permission for apply/approve/view-all actions.");
    }
    if (hasTopic("recruitment")) {
        lines.push("For recruitment issues, check candidate/job setup and whether the recruitment module is enabled for the user's role.");
    }
    if (hasTopic("performance")) {
        lines.push("For performance issues, check KPI/goals/cycle setup and whether the employee has an active performance cycle.");
    }
    if (hasTopic("documents")) {
        lines.push("For document issues, check upload size/type, employee document records, and whether the logged-in user has permission to view those files.");
    }
    if (hasTopic("notifications")) {
        lines.push("For notification issues, check browser notification permission, logged-in session, unread notification API, and whether alerts are enabled.");
    }
    if (hasTopic("chat")) {
        lines.push("For chat issues, check the selected tab, department/authority access, and whether the message API is allowed for your role.");
    }
    if (hasTopic("settings")) {
        lines.push("For organization/settings issues, verify system lookup values and role permissions for settings/organization management.");
    }

    if (visibilityIssue) {
        lines.push("If something is not visible, use this order: correct portal, correct role permission, correct filters/date, existing data, then hard refresh or re-login.");
    }

    return lines;
}

async function getEmployeeContext(req, requestedEmployeeId = null) {
    const sessionUser = req.session?.user;
    const companyId = req.company_id || sessionUser?.company_id || 1;
    const canInspectOthers = userHasFullAccess(sessionUser);
    const employeeId = canInspectOthers && requestedEmployeeId ? Number(requestedEmployeeId) : Number(sessionUser.id);

    const { rows } = await safeQuery(
        `SELECT id, Employee_ID, Employee_Name, Official_Email, Department, Designations,
                Office_Location, can_login, is_active, company_id
           FROM employee_records
          WHERE id = ? AND company_id = ?
          LIMIT 1`,
        [employeeId, companyId]
    );

    return rows[0] || null;
}

function extractEmployeeId(message) {
    const match = message.match(/(?:employee|emp|user)\s*(?:id)?\s*#?\s*(\d+)/i);
    return match ? Number(match[1]) : null;
}

function shouldRunDiagnostics(message) {
    return detectTopics(message).length > 0 || hasAny(message, APP_KEYWORDS) || Boolean(extractEmployeeId(message));
}

async function buildDiagnostics(req, message) {
    if (!shouldRunDiagnostics(message)) {
        return { checks: [], employee: null };
    }

    const sessionUser = req.session?.user;
    const companyId = req.company_id || sessionUser?.company_id || 1;
    const requestedEmployeeId = extractEmployeeId(message);
    const topics = detectTopics(message);
    const employee = await getEmployeeContext(req, requestedEmployeeId);
    const checks = [];

    if (!employee) {
        return {
            checks: [{
                title: "Employee access",
                status: "blocked",
                detail: "I could not find that employee in your current company, or you do not have permission to inspect them.",
            }],
            employee: null,
        };
    }

    checks.push({
        title: "Profile",
        status: "ok",
        detail: `${employee.Employee_Name} (${employee.Employee_ID || "no employee code"}) is ${Number(employee.is_active) === 1 ? "active" : "inactive"} and login is ${formatBool(employee.can_login)}.`,
    });

    const featureCheck = buildFeatureDiagnostics(sessionUser, topics);
    if (featureCheck) {
        checks.push(featureCheck);
    }

    if (topics.includes("leave")) {
        const year = new Date().getFullYear();
        const { rows, error } = await safeQuery(
            `SELECT lt.name, lb.entitlement, lb.used, lb.balance
               FROM leave_balances lb
               JOIN leave_types lt ON lt.id = lb.leave_type_id
              WHERE lb.employee_id = ? AND lb.year = ? AND lb.company_id = ?
              ORDER BY lt.name ASC`,
            [employee.id, year, companyId]
        );

        if (error) {
            checks.push({
                title: "Leave balances",
                status: "warning",
                detail: "I could not read leave balances. The leave tables may need checking.",
            });
        } else if (!rows.length) {
            checks.push({
                title: "Leave balances",
                status: "needs_action",
                detail: `No leave balances found for ${year}. HR/Admin should open Edit Employee and use Create Balances.`,
            });
        } else {
            const summary = rows.map((r) => `${r.name}: ${Number(r.balance || 0)} left`).join(", ");
            checks.push({
                title: "Leave balances",
                status: "ok",
                detail: summary,
            });
        }
    }

    if (topics.includes("attendance") && hasAny(message, ATTENDANCE_PUNCH_WORDS)) {
        const { rows: officeRows } = await safeQuery(
            `SELECT id, name, latitude, longitude, allowed_radius_meters, is_active
               FROM offices
              WHERE company_id = ? AND is_active = 1
              ORDER BY id ASC`,
            [companyId]
        );
        const { rows: shiftRows } = await safeQuery(
            `SELECT s.name, s.start_time, s.end_time
               FROM employee_shift_assignments esa
               JOIN attendance_shifts s ON s.id = esa.shift_id
              WHERE esa.employee_id = ? AND esa.company_id = ?
              ORDER BY esa.id DESC
              LIMIT 1`,
            [employee.id, companyId]
        );

        checks.push({
            title: "Office location",
            status: officeRows.length ? "ok" : "needs_action",
            detail: officeRows.length
                ? `${officeRows.length} active office location(s) found. Employee station is ${employee.Office_Location || "not selected"}.`
                : "No active office location found. Attendance punch may fail until HR/Admin adds one.",
        });

        checks.push({
            title: "Shift",
            status: shiftRows.length ? "ok" : "needs_action",
            detail: shiftRows.length
                ? `Current shift: ${shiftRows[0].name} (${shiftRows[0].start_time} - ${shiftRows[0].end_time}).`
                : "No shift assignment found. Attendance dashboard may show incomplete shift data.",
        });
    }

    if (topics.includes("reports")) {
        checks.push({
            title: "Reports visibility",
            status: "info",
            detail: "If a report is blank or hidden, check report permissions, selected date/month filters, and whether records exist for that period.",
        });
    }

    if (topics.includes("profile")) {
        checks.push({
            title: "Profile troubleshooting",
            status: "info",
            detail: "Profile details come from the employee record. For photo/logo style issues, upload path and browser cache are the usual checks.",
        });
    }

    if (topics.includes("payroll")) {
        checks.push({
            title: "Payroll setup",
            status: "info",
            detail: "Payroll needs salary/base settings plus payroll permissions. Month/year filters can also make payslips or payroll records look missing.",
        });
    }

    if (topics.includes("documents")) {
        checks.push({
            title: "Documents",
            status: "info",
            detail: "Document problems usually come from upload type/size, saved file path, or missing permission to view employee files.",
        });
    }

    if (topics.includes("permissions")) {
        const { rows } = await safeQuery(
            `SELECT ut.type, ut.permission_level
               FROM employee_user_types eut
               JOIN users_types ut ON ut.id = eut.user_type_id
              WHERE eut.employee_id = ? AND eut.company_id = ?
              ORDER BY eut.is_primary DESC, ut.permission_level DESC`,
            [employee.id, companyId]
        );

        checks.push({
            title: "Role access",
            status: rows.length ? "ok" : "needs_action",
            detail: rows.length
                ? rows.map((r) => `${r.type} (level ${r.permission_level})`).join(", ")
                : "No role/user type is assigned. HR/Admin should assign a role from Edit Employee.",
        });
    }

    return { checks, employee };
}

function buildHelpAnswer(message, diagnostics) {
    const lower = message.toLowerCase();
    const lines = [];
    const isAppQuestion = shouldRunDiagnostics(message);
    const topics = detectTopics(message);

    if (hasAny(lower, ["hello", "hi", "salam", "help"])) {
        lines.push("Hello. I am the WorkSphere company bot. I can help with portal issues like profile, leave, attendance, reports, payroll, employees, permissions, branding, documents, and company modules.");
    }

    lines.push(...buildTopicGuidance(topics, lower));

    if (hasAny(lower, ["fix", "theek", "solve", "karo", "kar do"])) {
        lines.push("In this phase, I provide safe diagnosis only. Automatic fixes will be added later with user confirmation and audit logging.");
    }

    if (!lines.length) {
        if (!isAppQuestion) {
            lines.push("I am the company bot for WorkSphere, so I only help with company portal topics.");
            lines.push("You can ask me about profile, leave, attendance, reports, payroll, employees, login, permissions, branding, documents, notifications, chat, and company modules.");
        } else {
            lines.push("Please describe the issue in a little more detail, for example: 'profile photo is not updating', 'attendance report is not visible', or 'employee cannot access payroll'.");
        }
    }

    if (diagnostics?.checks?.length) {
        lines.push("");
        lines.push("Diagnostics:");
        diagnostics.checks.forEach((check) => {
            lines.push(`- ${check.title}: ${check.detail}`);
        });
    }

    lines.push("");
    lines.push("Privacy note: I do not make direct database changes. I only check information inside your allowed company and permission scope.");

    return lines.join("\n");
}

async function chat(req, res) {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) {
        return res.status(401).json({ message: "Unauthenticated" });
    }

    const message = normalizeMessage(req.body?.message);
    if (!message) {
        return res.status(400).json({ message: "Message is required" });
    }

    try {
        const diagnostics = await buildDiagnostics(req, message);
        let responseMode = "read_only";
        const answer = buildHelpAnswer(message, diagnostics);

        await recordLog({
            actorId: sessionUser.id,
            action: "Company bot read-only response",
            category: "Company Bot",
            status: "Success",
            details: {
                company_id: req.company_id || sessionUser.company_id || 1,
                mode: responseMode,
                inspected_employee_id: diagnostics.employee?.id || null,
                requested_employee_id: extractEmployeeId(message),
                checks: diagnostics.checks.map((c) => ({ title: c.title, status: c.status })),
            },
        });

        return res.json({
            success: true,
            mode: responseMode,
            answer,
            checks: diagnostics.checks,
            actions: [],
        });
    } catch (error) {
        console.error("assistant chat error:", error);
        await recordLog({
            actorId: sessionUser.id,
            action: "Company bot failed",
            category: "Company Bot",
            status: "Failed",
            details: { message: error.message },
        });
        return res.status(500).json({ message: "Assistant could not process this request." });
    }
}

module.exports = { chat };
