const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Leave.js');
let code = fs.readFileSync(filePath, 'utf8');

// applyLeave INSERT into leave_applications
code = code.replace(
    /INSERT INTO leave_applications \(employee_id, leave_type_id, start_date, end_date, total_days, reason, status\)/g,
    "INSERT INTO leave_applications (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, company_id)"
);
code = code.replace(
    /VALUES \(\?, \?, \?, \?, \?, \?, \?\)/g,
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);
code = code.replace(
    /\[user\.id, leave_type_id, start_date, end_date, total_days, reason, status\]/g,
    "[user.id, leave_type_id, start_date, end_date, total_days, reason, status, req.company_id || 1]"
);

// applyLeave INSERT into approvals
code = code.replace(
    /INSERT INTO approvals \(approvable_type, approvable_id, requested_by, approver_id, status\)/g,
    "INSERT INTO approvals (approvable_type, approvable_id, requested_by, approver_id, status, company_id)"
);
code = code.replace(
    /VALUES \('Leave', \?, \?, \?, \?\)/g,
    "VALUES ('Leave', ?, ?, ?, ?, ?)"
);
code = code.replace(
    /\[applicationId, user\.id, approverId, status\]/g,
    "[applicationId, user.id, approverId, status, req.company_id || 1]"
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Leave inserts updated!');
