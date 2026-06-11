const { pool } = require("../Utils/db");

/**
 * Provisioning Script for Multi-Tenant HRM
 * Usage: node scripts/provision_company.js "Company Name" "Domain/Code"
 */

async function provisionCompany() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: node scripts/provision_company.js \"Company Name\" \"email@example.com\"");
        process.exit(1);
    }

    const [name, domain] = args;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Insert Company
        console.log(`Creating company: ${name}...`);
        const [compRes] = await conn.execute(
            "INSERT INTO companies (company_name, email, status) VALUES (?, ?, 'active')",
            [name, domain]
        );
        const companyId = compRes.insertId;
        console.log(`✅ Company created with ID: ${companyId}`);

        // 2. Provision Leave Types
        console.log("Provisioning default leave types...");
        const leaveTypes = [
            ["Annual", 15, "#4CAF50"],
            ["Sick", 20, "#F44336"],
            ["Casual", 10, "#2196F3"],
            ["Maternity", 90, "#E91E63"],
            ["Paternity", 10, "#9C27B0"],
            ["Unpaid", 0, "#9E9E9E"]
        ];
        for (const [ltName, days, color] of leaveTypes) {
            await conn.execute(
                "INSERT INTO leave_types (name, entitlement_days, color_code, company_id, is_active) VALUES (?, ?, ?, ?, 1)",
                [ltName, days, color, companyId]
            );
        }

        // 3. Provision Attendance Rule
        console.log("Provisioning default attendance rules...");
        await conn.execute(
            "INSERT INTO attendance_rules (grace_minutes, notify_employee, notify_hr_admin, block_vpn, is_active, company_id) VALUES (?, ?, ?, ?, 1, ?)",
            [15, 1, 1, 1, companyId]
        );

        // 4. Provision Attendance Shifts
        console.log("Provisioning default shifts (Summer/Winter/Ramadan)...");
        const shifts = [
            ["SUMMER", "10:00:00", "19:00:00", "2026-03-31", "2026-10-30", "#3b82f6"],
            ["WINTER", "10:30:00", "18:30:00", "2026-10-29", "2027-03-28", "#3b82f6"],
            ["RAMADAN", "10:30:00", "16:00:00", "2026-02-18", "2026-03-23", "#3b82f6"]
        ];
        for (const [sName, start, end, from, to, color] of shifts) {
            await conn.execute(
                "INSERT INTO attendance_shifts (name, start_time, end_time, effective_from, effective_to, color, company_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
                [sName, start, end, from, to, color, companyId]
            );
        }

        // 5. Provision a default Super Admin for this company (Optional, but helpful)
        // User should create this via standard Signup or Admin portal later.

        await conn.commit();
        console.log(`\n🎉 Success! Company "${name}" is now ready.`);
        console.log(`Company ID: ${companyId}`);
        console.log("--------------------------------------------------");
        console.log("Next Steps:");
        console.log(`1. Add employees for company_id = ${companyId}`);
        console.log(`2. Users must have company_id = ${companyId} in their session to see this data.`);
        
    } catch (err) {
        await conn.rollback();
        console.error("❌ Provisioning failed:", err);
    } finally {
        conn.release();
        process.exit();
    }
}

provisionCompany();
