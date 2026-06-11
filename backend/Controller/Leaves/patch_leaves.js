const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Leave.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. getLeaveTypes
code = code.replace(/FROM leave_types WHERE is_active = 1"/g, "FROM leave_types WHERE is_active = 1 AND company_id = ?\", [req.company_id || 1]");

// 2. applyLeave -> leave_balances check
code = code.replace(/AND year = \?"/g, "AND year = ? AND company_id = ?\"");
code = code.replace(/\[user\.id, leave_type_id, new Date\(\)\.getFullYear\(\)\]/g, "[user.id, leave_type_id, new Date().getFullYear(), req.company_id || 1]");

// 3. applyLeave -> department_managers
code = code.replace(/WHERE department_name = \?"/g, "WHERE department_name = ? AND company_id = ?\"");
code = code.replace(/\[dept\]/g, "[dept, req.company_id || 1]");

// 4. getMyLeaves
code = code.replace(/WHERE la\.employee_id = \?/g, "WHERE la.employee_id = ? AND la.company_id = ?");
code = code.replace(/\[user\.id\]/g, "[user.id, req.company_id || 1]");

// 5. getLeaveBalances
code = code.replace(/WHERE lb\.employee_id = \? AND lb\.year = \?/g, "WHERE lb.employee_id = ? AND lb.year = ? AND lb.company_id = ?");
code = code.replace(/\[user\.id, new Date\(\)\.getFullYear\(\)\]/g, "[user.id, new Date().getFullYear(), req.company_id || 1]");

// 6. getLeaveDashboardStats
code = code.replace(/AND status = 'pending'"/g, "AND status = 'pending' AND company_id = ?\"");
code = code.replace(/AND approvers_type = 'Leave'"/g, "AND approvers_type = 'Leave' AND company_id = ?\"");

fs.writeFileSync(filePath, code, 'utf8');
console.log('Leave.js updated successfully!');
