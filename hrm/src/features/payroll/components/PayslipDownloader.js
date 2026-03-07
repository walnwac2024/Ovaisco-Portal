/**
 * PayslipDownloader.js
 * Opens a new window with a print-optimized payslip matching
 * the official payslip format, then triggers print.
 */

const downloadPayslip = (data, action = 'print') => {
    const monthName = new Date(2024, (data.month || 1) - 1).toLocaleString('default', {
        month: 'short',
        year: '2-digit'
    });

    const fmt = (val) => {
        const n = Number(val || 0);
        return n > 0 ? n.toLocaleString() : '-';
    };

    // Calculate all allowances total (excluding contractual_pay to avoid double-count)
    const otherAllowances =
        Number(data.transport_allowance || 0) +
        Number(data.attendance_bonus || 0) +
        Number(data.mobile_allowance || 0) +
        Number(data.tardiness_allowance || 0) +
        Number(data.night_allowance || 0) +
        Number(data.house_allowance || 0) +
        Number(data.adhoc_allowance || 0) +
        Number(data.misc_allowance || 0) +
        Number(data.relocation_allowance || 0);

    const fuelAllowance = Number(data.fuel_allowance || 0);

    // Fixed deductions from salary setup
    const foodDed = Number(data.food_deduction || 0);
    const healthDed = Number(data.health_deduction || 0);
    const monthAdj = Number(data.month_adjustment || 0);
    const advSalary = Number(data.advance_salary || 0);
    const eobi = Number(data.eobi || 0);
    const asapAll = Number(data.asap_allowance || 0);
    const efap = Number(data.efap || 0);
    const unpaidLvs = Number(data.unpaid_leaves || 0);

    // Attendance-based deductions
    const leaveDed = Number(data.leave_deduction || 0);
    const lateDed = Number(data.late_deduction || 0);
    const totalFixedDed = foodDed + healthDed + monthAdj + advSalary + eobi + asapAll + efap + unpaidLvs;
    const totalAttendanceDed = leaveDed + lateDed;
    const grandTotalDed = totalFixedDed + totalAttendanceDed;

    // Net salary = gross - all deductions
    const netSalary = Math.max(0, Number(data.gross_salary || 0) - grandTotalDed);

    const todayStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Salary Slip - ${data.name || ''} - ${monthName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #111;
            background: white;
            padding: 24px 28px;
            width: 210mm;
        }
        .payslip-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 14px;
            letter-spacing: 0.05em;
            color: #E02D3D;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .info-table td {
            padding: 4px 8px;
            border: 1px solid #bbb;
        }
        .info-table td:first-child {
            background: #E02D3D;
            color: white;
            font-weight: bold;
            width: 140px;
        }
        .info-table td:last-child {
            text-align: right;
            font-weight: bold;
        }
        .period-bar {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            font-size: 11px;
        }
        .period-bar .period-label {
            font-weight: bold;
            background: #e8e8e8;
            padding: 3px 8px;
            border: 1px solid #bbb;
        }
        .period-bar .period-value {
            font-weight: bold;
            background: #E02D3D;
            color: white;
            padding: 3px 12px;
        }
        .salary-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .salary-grid td {
            border: 1px solid #bbb;
            padding: 5px 8px;
            vertical-align: middle;
        }
        .lbl { background: #f0f4f8; font-weight: bold; width: 150px; }
        .val { text-align: right; width: 85px; }
        .mlbl { background: #f0f4f8; font-weight: bold; width: 160px; }
        .mval { text-align: right; width: 80px; }
        .rlbl { background: #f0f4f8; font-weight: bold; width: 140px; }
        .rval { text-align: right; font-weight: bold; width: 85px; }

        .section-header td {
            background: #e8ecf0;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #555;
            padding: 3px 8px;
        }

        .net-row td {
            background: #E02D3D;
            color: white;
            font-weight: bold;
            font-size: 13px;
            padding: 7px 8px;
        }
        .net-row .net-val { text-align: right; }

        .footer-area {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 20px;
        }
        .stamp-box {
            width: 90px; height: 90px;
            border: 2px dashed #aaa;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #888;
            font-size: 9px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 0.05em;
        }
        .note {
            font-size: 9px;
            color: #666;
            font-style: italic;
            line-height: 1.6;
        }
        @media print {
            body { padding: 10px 14px; }
            @page { size: A4 portrait; margin: 10mm; }
        }
    </style>
</head>
<body>
    <div class="payslip-title">SALARY SLIP &mdash; ${monthName.toUpperCase()}</div>

    <!-- Employee Info -->
    <table class="info-table">
        <tr>
            <td>Employee Name</td>
            <td>${data.name || '-'}</td>
        </tr>
        <tr>
            <td>Status</td>
            <td>Confirmed</td>
        </tr>
        <tr>
            <td>Designation</td>
            <td>${data.designation || '-'}</td>
        </tr>
        <tr>
            <td>Department</td>
            <td>${data.department || '-'}</td>
        </tr>
        <tr>
            <td>Transfer Type</td>
            <td>Bank</td>
        </tr>
        <tr>
            <td>Monthly Salary</td>
            <td>PKR ${Number(data.gross_salary || 0).toLocaleString()}</td>
        </tr>
    </table>

    <!-- Period -->
    <div class="period-bar">
        <span class="period-label">Period:</span>
        <span class="period-value">${monthName}</span>
    </div>

    <!-- Salary Details Grid -->
    <table class="salary-grid">
        <tbody>
            <!-- Section headers -->
            <tr class="section-header">
                <td colspan="2">Earnings</td>
                <td colspan="2">Attendance</td>
                <td colspan="2">Summary</td>
            </tr>

            <tr>
                <td class="lbl">Basic / Contractual</td>
                <td class="val">${fmt(data.contractual_pay)}</td>
                <td class="mlbl">No. of Days</td>
                <td class="mval">30</td>
                <td class="rlbl">Gross Salary</td>
                <td class="rval">${fmt(data.gross_salary)}</td>
            </tr>
            <tr>
                <td class="lbl">Fuel Allowance</td>
                <td class="val">${fmt(data.fuel_allowance)}</td>
                <td class="mlbl">Late Days</td>
                <td class="mval">${data.attendance_late_days > 0 ? data.attendance_late_days : '-'}</td>
                <td class="rlbl">Deductions (Attendance)</td>
                <td class="rval">${fmt(totalAttendanceDed)}</td>
            </tr>
            <tr>
                <td class="lbl">Transport Allowance</td>
                <td class="val">${fmt(data.transport_allowance)}</td>
                <td class="mlbl">Absent Days</td>
                <td class="mval">${data.attendance_leave_days > 0 ? data.attendance_leave_days : '-'}</td>
                <td class="rlbl">Health Deduction</td>
                <td class="rval">${fmt(data.health_deduction)}</td>
            </tr>
            <tr>
                <td class="lbl">House Allowance</td>
                <td class="val">${fmt(data.house_allowance)}</td>
                <td class="mlbl">EFAP (Absent Ded.)</td>
                <td class="mval">${fmt(data.leave_deduction)}</td>
                <td class="rlbl">Food Deduction</td>
                <td class="rval">${fmt(data.food_deduction)}</td>
            </tr>
            <tr>
                <td class="lbl">Mobile Allowance</td>
                <td class="val">${fmt(data.mobile_allowance)}</td>
                <td class="mlbl">ASAP (Late Ded.)</td>
                <td class="mval">${fmt(data.late_deduction)}</td>
                <td class="rlbl">Total Deductions</td>
                <td class="rval">${fmt(grandTotalDed)}</td>
            </tr>
            <tr>
                <td class="lbl">Attendance Bonus</td>
                <td class="val">${fmt(data.attendance_bonus)}</td>
                <td class="mlbl">Night Allowance</td>
                <td class="mval">${fmt(data.night_allowance)}</td>
                <td class="rlbl"></td>
                <td class="rval"></td>
            </tr>
            <tr>
                <td class="lbl">Tardiness Allowance</td>
                <td class="val">${fmt(data.tardiness_allowance)}</td>
                <td class="mlbl">Ad-Hoc Allowance</td>
                <td class="mval">${fmt(data.adhoc_allowance)}</td>
                <td class="rlbl"></td>
                <td class="rval"></td>
            </tr>
            <tr>
                <td class="lbl">Misc. Allowance</td>
                <td class="val">${fmt(data.misc_allowance)}</td>
                <td class="mlbl">Relocation Allow.</td>
                <td class="mval">${fmt(data.relocation_allowance)}</td>
                <td class="rlbl">Month Adjustment</td>
                <td class="rval">${fmt(data.month_adjustment)}</td>
            </tr>
            <tr>
                <td class="lbl"></td>
                <td class="val"></td>
                <td class="mlbl"></td>
                <td class="mval"></td>
                <td class="rlbl">Advance Salary</td>
                <td class="rval">${fmt(data.advance_salary)}</td>
            </tr>
            <tr>
                <td class="lbl"></td>
                <td class="val"></td>
                <td class="mlbl"></td>
                <td class="mval"></td>
                <td class="rlbl">EOBI</td>
                <td class="rval">${fmt(data.eobi)}</td>
            </tr>
            <tr>
                <td class="lbl"></td>
                <td class="val"></td>
                <td class="mlbl"></td>
                <td class="mval"></td>
                <td class="rlbl">ASAP Allowance</td>
                <td class="rval">${fmt(data.asap_allowance)}</td>
            </tr>
            <tr>
                <td class="lbl"></td>
                <td class="val"></td>
                <td class="mlbl"></td>
                <td class="mval"></td>
                <td class="rlbl">EFAP</td>
                <td class="rval">${fmt(data.efap)}</td>
            </tr>
            <tr>
                <td class="lbl"></td>
                <td class="val"></td>
                <td class="mlbl"></td>
                <td class="mval"></td>
                <td class="rlbl">Unpaid Leaves</td>
                <td class="rval">${fmt(data.unpaid_leaves)}</td>
            </tr>

            <!-- Net Salary -->
            <tr class="net-row">
                <td colspan="4" style="text-align:center; letter-spacing:0.1em;">NET SALARY</td>
                <td colspan="2" class="net-val">PKR ${netSalary.toLocaleString()}</td>
            </tr>
        </tbody>
    </table>

    <!-- Footer -->
    <div class="footer-area">
        <div class="stamp-box">VERIFIED</div>
        <div class="note">
            This is a computer-generated salary slip.<br/>
            Generated by HRM Pro on ${todayStr}.<br/>
            Reference: ${data.reference_number || '-'}
        </div>
    </div>

    <!-- Only include html2pdf if downloading -->
    ${action === 'download' ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>` : ''}

    <script>
        window.onload = function() {
            setTimeout(function() {
                if ('${action}' === 'download') {
                    // Initialize html2pdf
                    const element = document.body;
                    const opt = {
                        margin:       0,
                        filename:     'Salary_Slip_${data.name ? data.name.replace(/ /g, '_') : 'Employee'}_${monthName.replace(/ /g, '_')}.pdf',
                        image:        { type: 'jpeg', quality: 0.98 },
                        html2canvas:  { scale: 2, useCORS: true },
                        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };

                    // New Promise-based usage:
                    html2pdf().set(opt).from(element).save().then(function() {
                        // Close the window after downloading
                        setTimeout(function() { window.close(); }, 500);
                    });
                } else {
                    // Default behavior: just print
                    window.print();
                }
            }, 500); // Increased timeout slightly to ensure styling/fonts load
        };
    </script>
</body>
</html>`;

    // Always open in a hidden/popup window for processing to keep the UX clean
    const win = window.open('', '_blank', 'width=950,height=750');
    win.document.write(html);
    win.document.close();
};

export default downloadPayslip;
