/* ============================================================
   DATANOVA HR DASHBOARD — MAIN SCRIPT
   All logic: data generation, charts, navigation, modals
   ============================================================ */

// ================================================================
// TAILWIND CUSTOM CONFIG — must run before DOM paints
// ================================================================
// NOTE: tailwind.config is set via a <script> block in index.html
// before this file loads. This file only contains app logic.

// ================================================================
// CONFIGURATION — Score Thresholds for 9-Box Grid
// ================================================================
const CONFIG = {
    PERF_LOW_MAX:      3,
    PERF_MED_MAX:      7,
    POT_LOW_MAX:       3,
    POT_MED_MAX:       7,
    RISK_MEDIUM_MIN:   8,
    RISK_HIGH_MIN:    15,
    DEFAULT_MULTIPLIER: 1.5
};

// ================================================================
// DATA GENERATION — 100 Anonymized Employees
// ================================================================
const departments      = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
const departmentHeads  = {};
const employees        = [];

// Generate department heads (30% chance of high risk each)
departments.forEach(dept => {
    departmentHeads[dept] = {
        id:         `HEAD-${dept.substring(0, 3).toUpperCase()}`,
        salary:      100000 + Math.floor(Math.random() * 50000),
        isHighRisk:  Math.random() < 0.3
    };
});

/**
 * Categorise an employee into one of the 9 boxes.
 * @param {number} performance  1–10
 * @param {number} potential    1–10
 * @returns {string}
 */
function categorizeEmployee(performance, potential) {
    const perfLevel = performance <= CONFIG.PERF_LOW_MAX ? 'Low'
                    : performance <= CONFIG.PERF_MED_MAX ? 'Medium'
                    : 'High';
    const potLevel  = potential  <= CONFIG.POT_LOW_MAX  ? 'Low'
                    : potential  <= CONFIG.POT_MED_MAX  ? 'Medium'
                    : 'High';
    return `${perfLevel} Perf / ${potLevel} Potential`;
}

// Seed 100 employees
for (let i = 1; i <= 100; i++) {
    const overtime     = Math.floor(Math.random() * 35);
    const engagement   = Math.floor(Math.random() * 10) + 1;
    const salaryGrowth = parseFloat((Math.random() * 5).toFixed(1));
    const performance  = Math.floor(Math.random() * 10) + 1;
    const potential    = Math.floor(Math.random() * 10) + 1;
    const salary       = 50000 + Math.floor(Math.random() * 80000);

    // Burnout risk formula: higher overtime + lower engagement + lower salary growth = higher risk
    const riskScore = (overtime * 0.5) + ((10 - engagement) * 0.3) + ((5 - salaryGrowth) * 0.2);
    const riskLevel = riskScore >= CONFIG.RISK_HIGH_MIN   ? 'high'
                    : riskScore >= CONFIG.RISK_MEDIUM_MIN ? 'medium'
                    : 'low';

    employees.push({
        id:          `EMP-${String(i).padStart(4, '0')}`,
        department:   departments[Math.floor(Math.random() * departments.length)],
        overtime, engagement, salaryGrowth, performance, potential, salary,
        riskScore:   parseFloat(riskScore.toFixed(2)),
        riskLevel,
        category:    categorizeEmployee(performance, potential)
    });
}

// ================================================================
// HELPERS
// ================================================================

/**
 * Format a number as USD currency (no decimals).
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style:                 'currency',
        currency:              'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Animate a numeric counter in a DOM element.
 */
function animateValue(elementId, targetValue) {
    const element   = document.getElementById(elementId);
    if (!element) return;
    const duration  = 500;
    const startVal  = parseInt(element.textContent) || 0;
    const startTime = performance.now();

    function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        element.textContent = Math.floor(startVal + (targetValue - startVal) * progress);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

/**
 * Return counts per 9-box category.
 */
function getCategoryCounts() {
    const counts = {};
    employees.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return counts;
}

/**
 * Return a hex colour for each 9-box category.
 */
function getCategoryColor(category) {
    const map = {
        'High Perf / High Potential':   '#10b981',
        'High Perf / Medium Potential': '#3b82f6',
        'High Perf / Low Potential':    '#06b6d4',
        'Medium Perf / High Potential': '#8b5cf6',
        'Medium Perf / Medium Potential':'#64748b',
        'Medium Perf / Low Potential':  '#f59e0b',
        'Low Perf / High Potential':    '#6366f1',
        'Low Perf / Medium Potential':  '#f97316',
        'Low Perf / Low Potential':     '#ef4444'
    };
    return map[category] || '#64748b';
}

// ================================================================
// NAVIGATION
// ================================================================
function navigateTo(pageId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.querySelector(`[data-page="${pageId}"]`);
    if (navLink) navLink.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
}

// ================================================================
// OVERVIEW PAGE — KPIs & Charts
// ================================================================
function updateOverviewKPIs() {
    const highRisk      = employees.filter(e => e.riskLevel === 'high');
    const topPerformers = employees.filter(e => e.performance >= 8);
    const topAtRisk     = topPerformers.filter(e => e.riskLevel !== 'low');
    const totalRiskCost = highRisk.reduce((s, e) => s + e.salary * CONFIG.DEFAULT_MULTIPLIER, 0);

    animateValue('kpiTotalEmployees', employees.length);
    animateValue('kpiHighRisk',       highRisk.length);
    animateValue('kpiTopAtRisk',      topAtRisk.length);

    const costEl = document.getElementById('kpiTotalRiskCost');
    if (costEl) costEl.textContent = formatCurrency(totalRiskCost);

    const luEl = document.getElementById('lastUpdated');
    if (luEl) luEl.textContent = new Date().toLocaleString();

    // Strategic insight text
    let insight;
    if (topAtRisk.length > 5) {
        insight = `⚠️ Critical: ${topAtRisk.length} top performers showing risk indicators. ${highRisk.length} employees in high-risk category. Immediate retention strategies recommended.`;
    } else if (highRisk.length > 15) {
        insight = `📊 ${highRisk.length} employees flagged as high risk. ${topPerformers.length} top performers identified. Consider proactive engagement programs.`;
    } else {
        insight = `✅ Workforce health is stable. ${topPerformers.length} top performers identified with ${topAtRisk.length} showing minor risk signs.`;
    }
    const qiEl = document.getElementById('quickInsight');
    if (qiEl) qiEl.textContent = insight;
}

function createOverviewCharts() {
    // Risk Distribution doughnut
    const riskCounts = {
        low:    employees.filter(e => e.riskLevel === 'low').length,
        medium: employees.filter(e => e.riskLevel === 'medium').length,
        high:   employees.filter(e => e.riskLevel === 'high').length
    };
    const riskCtx = document.getElementById('overviewRiskChart');
    if (riskCtx) {
        new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data:            [riskCounts.low, riskCounts.medium, riskCounts.high],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth:     0,
                    cutout:          '65%'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' }
                    }
                }
            }
        });
    }

    // Category distribution bar chart
    const categoryCounts   = getCategoryCounts();
    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    const catCtx = document.getElementById('overviewCategoryChart');
    if (catCtx) {
        new Chart(catCtx, {
            type: 'bar',
            data: {
                labels: sortedCategories.map(([cat]) => cat.split(' / ').join('\n')),
                datasets: [{
                    data:            sortedCategories.map(([, c]) => c),
                    backgroundColor: sortedCategories.map(([cat]) => getCategoryColor(cat)),
                    borderRadius:    6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0 } }
                }
            }
        });
    }
}

function refreshDashboard() {
    updateOverviewKPIs();
}

// ================================================================
// 9-BOX GRID PAGE
// ================================================================
let nineBoxChartInstance = null;

function createNineBoxChart() {
    const canvas = document.getElementById('nineBoxChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const datasets = ['low', 'medium', 'high'].map(level => {
        const colorMap = {
            low:    { bg: 'rgba(16,185,129,0.7)',  border: 'rgba(16,185,129,1)',  label: 'Low Risk' },
            medium: { bg: 'rgba(245,158,11,0.7)',  border: 'rgba(245,158,11,1)',  label: 'Medium Risk' },
            high:   { bg: 'rgba(239,68,68,0.7)',   border: 'rgba(239,68,68,1)',   label: 'High Risk' }
        };
        const c = colorMap[level];
        return {
            label:           c.label,
            data:            employees.filter(e => e.riskLevel === level).map(e => ({
                x:        e.performance + (Math.random() - 0.5) * 0.3,
                y:        e.potential   + (Math.random() - 0.5) * 0.3,
                employee: e
            })),
            backgroundColor: c.bg,
            borderColor:     c.border,
            borderWidth:     1,
            pointRadius:     9,
            pointHoverRadius:14
        };
    });

    // Plugin: draw 9-box dividers at 3.5 and 7.5 on both axes
    const nineBoxDividersPlugin = {
        id: 'nineBoxDividers',
        afterDraw(chart) {
            const { ctx: c, chartArea, scales } = chart;
            if (!chartArea || !scales?.x || !scales?.y) return;

            c.save();
            c.strokeStyle = 'rgba(0,0,0,0.22)';
            c.lineWidth   = 2;

            [3.5, 7.5].forEach(v => {
                // Vertical line
                const x = scales.x.getPixelForValue(v);
                c.beginPath(); c.moveTo(x, chartArea.top);  c.lineTo(x, chartArea.bottom); c.stroke();
                // Horizontal line
                const y = scales.y.getPixelForValue(v);
                c.beginPath(); c.moveTo(chartArea.left, y); c.lineTo(chartArea.right, y);  c.stroke();
            });

            c.restore();
        }
    };

    nineBoxChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        plugins: [nineBoxDividersPlugin],
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
                tooltip: {
                    enabled:  false,
                    external: showCustomTooltip
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Performance Score (1–10)', font: { weight: 'bold', size: 12 } },
                    min: 0, max: 11,
                    grid: {
                        color:     ctx => [3.5, 7.5].includes(ctx.tick?.value) ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                        lineWidth: ctx => [3.5, 7.5].includes(ctx.tick?.value) ? 2 : 1
                    }
                },
                y: {
                    title: { display: true, text: 'Potential Score (1–10)', font: { weight: 'bold', size: 12 } },
                    min: 0, max: 11,
                    grid: {
                        color:     ctx => [3.5, 7.5].includes(ctx.tick?.value) ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                        lineWidth: ctx => [3.5, 7.5].includes(ctx.tick?.value) ? 2 : 1
                    }
                }
            }
        }
    });
}

function showCustomTooltip(context) {
    const tooltip = document.getElementById('chartTooltip');
    if (!tooltip) return;

    if (context.tooltip.opacity === 0) {
        tooltip.classList.add('hidden');
        return;
    }

    const dp = context.tooltip.dataPoints?.[0];
    if (!dp?.raw?.employee) return;

    const emp = dp.raw.employee;
    const riskColors = {
        high:   { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' },
        medium: { bg: '#fef3c7', border: '#f59e0b', text: '#d97706' },
        low:    { bg: '#d1fae5', border: '#10b981', text: '#059669' }
    };
    const col = riskColors[emp.riskLevel];

    tooltip.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">
            <span style="font-weight:700;color:#0f172a">${emp.id}</span>
            <span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;
                  background:${col.bg};color:${col.text};border:1px solid ${col.border}">
                ${emp.riskLevel.toUpperCase()} RISK
            </span>
        </div>
        <div style="display:grid;gap:6px;font-size:12px;color:#475569">
            <div style="display:flex;justify-content:space-between">
                <span style="color:#94a3b8">Department</span>
                <span style="font-weight:600">${emp.department}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
                <span style="color:#94a3b8">Performance</span>
                <span style="font-weight:600">${emp.performance}/10</span>
            </div>
            <div style="display:flex;justify-content:space-between">
                <span style="color:#94a3b8">Potential</span>
                <span style="font-weight:600">${emp.potential}/10</span>
            </div>
            <div style="display:flex;justify-content:space-between">
                <span style="color:#94a3b8">Risk Score</span>
                <span style="font-weight:600">${emp.riskScore}</span>
            </div>
        </div>
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0">
            <span style="font-size:11px;color:#94a3b8">Category</span>
            <p style="margin:2px 0 0;font-weight:600;color:#334155;font-size:12px">${emp.category}</p>
        </div>
    `;

    tooltip.classList.remove('hidden');
    tooltip.style.left = (context.tooltip.caretX + 20) + 'px';
    tooltip.style.top  = (context.tooltip.caretY - 20) + 'px';
}

function populateCategoryBreakdown() {
    const container = document.getElementById('categoryBreakdown');
    if (!container) return;

    const counts = getCategoryCounts();
    container.innerHTML = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, count]) => `
            <div style="display:flex;align-items:center;justify-content:space-between">
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="width:12px;height:12px;border-radius:50%;background:${getCategoryColor(cat)};flex-shrink:0"></span>
                    <span style="color:#475569;font-size:12px;max-width:145px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                          title="${cat}">${cat}</span>
                </div>
                <span style="font-weight:700;color:#0f172a;background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:12px">${count}</span>
            </div>
        `).join('');
}

function createCategoryRiskChart() {
    const canvas = document.getElementById('categoryRiskChart');
    if (!canvas) return;

    const categories  = [...new Set(employees.map(e => e.category))];
    const sortedData  = categories
        .map(cat => ({
            cat,
            count: employees.filter(e => e.category === cat && e.riskLevel === 'high').length
        }))
        .filter(d => d.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: sortedData.map(d => d.cat),
            datasets: [{
                label:           'High Risk Count',
                data:            sortedData.map(d => d.count),
                backgroundColor: '#ef4444',
                borderRadius:    4
            }]
        },
        options: {
            responsive:  true,
            indexAxis:   'y',
            plugins:     { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                y: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

// ================================================================
// ATTRITION COST CALCULATOR
// ================================================================
function calculateAttritionCost() {
    const salary      = parseFloat(document.getElementById('calcSalary')?.value)      || 75000;
    const multiplier  = parseFloat(document.getElementById('calcMultiplier')?.value)  || 1.5;
    const lossMonths  = parseFloat(document.getElementById('calcLossMonths')?.value)  || 3;

    const replacementCost   = salary * multiplier;
    const productivityLoss  = (salary / 12) * lossMonths;
    const totalCost         = replacementCost + productivityLoss;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('resultReplacementCost', formatCurrency(replacementCost));
    set('resultProductivityLoss', formatCurrency(productivityLoss));
    set('resultTotalCost',        formatCurrency(totalCost));
}

function populateDeptCostTable() {
    const deptData = departments.map(dept => {
        const deptEmps      = employees.filter(e => e.department === dept);
        const highRiskEmps  = deptEmps.filter(e => e.riskLevel === 'high');
        const avgSalary     = deptEmps.length
            ? deptEmps.reduce((s, e) => s + e.salary, 0) / deptEmps.length
            : 0;
        const potentialCost = highRiskEmps.reduce((s, e) => s + e.salary * CONFIG.DEFAULT_MULTIPLIER, 0);
        return {
            dept,
            highRiskCount: highRiskEmps.length,
            avgSalary,
            potentialCost,
            headAtRisk: departmentHeads[dept].isHighRisk
        };
    }).sort((a, b) => b.potentialCost - a.potentialCost);

    const tbody = document.getElementById('deptCostTable');
    if (!tbody) return;

    tbody.innerHTML = deptData.map(d => `
        <tr class="${d.headAtRisk ? 'bg-red-50' : ''}">
            <td style="padding:16px 24px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9">
                <div style="display:flex;align-items:center;gap:8px">
                    ${d.headAtRisk ? '<span style="width:8px;height:8px;border-radius:50%;background:#ef4444;animation:pulse 1.5s ease-in-out infinite"></span>' : ''}
                    ${d.dept}
                </div>
            </td>
            <td style="padding:16px 24px;border-bottom:1px solid #f1f5f9">
                <span style="padding:4px 10px;border-radius:6px;font-weight:600;font-size:13px;
                      background:${d.highRiskCount > 3 ? '#fee2e2' : '#f1f5f9'};
                      color:${d.highRiskCount > 3 ? '#ef4444' : '#475569'}">
                    ${d.highRiskCount}
                </span>
            </td>
            <td style="padding:16px 24px;color:#475569;border-bottom:1px solid #f1f5f9">${formatCurrency(d.avgSalary)}</td>
            <td style="padding:16px 24px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9">${formatCurrency(d.potentialCost)}</td>
            <td style="padding:16px 24px;border-bottom:1px solid #f1f5f9">
                ${d.headAtRisk
                    ? '<span style="color:#ef4444;font-weight:700;display:inline-flex;align-items:center;gap:4px">⚠️ YES</span>'
                    : '<span style="color:#10b981;font-weight:600">No</span>'}
            </td>
        </tr>
    `).join('');

    // Department-head alert banner
    const highRiskHead = departments.find(d => departmentHeads[d].isHighRisk);
    const alertEl      = document.getElementById('deptHeadAlert');
    const alertText    = document.getElementById('deptHeadAlertText');
    if (alertEl) {
        if (highRiskHead && alertText) {
            const headCost = departmentHeads[highRiskHead].salary * CONFIG.DEFAULT_MULTIPLIER;
            alertText.innerHTML = `If the <strong>${highRiskHead}</strong> Department Head resigns, estimated financial impact: <strong>${formatCurrency(headCost)}</strong>`;
            alertEl.classList.remove('hidden');
        } else {
            alertEl.classList.add('hidden');
        }
    }
}

// ================================================================
// RETENTION PRIORITY LIST (80/20 RULE)
// ================================================================
function generateRetentionPriority() {
    const top20Count = Math.ceil(employees.length * 0.2);
    const top20      = [...employees].sort((a, b) => b.performance - a.performance).slice(0, top20Count);
    const atRisk     = top20.filter(e => e.riskLevel !== 'low');

    return atRisk.sort((a, b) => {
        const order = { high: 3, medium: 2, low: 1 };
        const diff  = order[b.riskLevel] - order[a.riskLevel];
        return diff !== 0 ? diff : b.performance - a.performance;
    });
}

function populateRetentionTable() {
    const list = generateRetentionPriority();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('priorityCount', list.length);

    const valueAtRisk = list.reduce((s, e) => s + e.salary * CONFIG.DEFAULT_MULTIPLIER, 0);
    set('priorityValueAtRisk', formatCurrency(valueAtRisk));

    const avgPerf = list.length
        ? (list.reduce((s, e) => s + e.performance, 0) / list.length).toFixed(1)
        : '0';
    set('priorityAvgPerf', avgPerf + '/10');

    const tbody = document.getElementById('retentionTable');
    if (!tbody) return;

    tbody.innerHTML = list.map((emp, i) => {
        const riskBadge   = emp.riskLevel === 'high'
            ? '<span style="padding:3px 10px;background:#fee2e2;color:#ef4444;font-size:11px;font-weight:700;border-radius:9999px">HIGH</span>'
            : '<span style="padding:3px 10px;background:#fef3c7;color:#f59e0b;font-size:11px;font-weight:700;border-radius:9999px">MEDIUM</span>';
        const badgeBg = i < 3 ? 'background:#ef4444;color:#fff' : 'background:#e2e8f0;color:#475569';

        return `
            <tr class="animate-slide-in" style="animation-delay:${i * 30}ms">
                <td style="padding:14px 24px;border-bottom:1px solid #f1f5f9">
                    <span style="display:inline-flex;align-items:center;justify-content:center;
                          width:32px;height:32px;border-radius:50%;font-weight:700;font-size:13px;${badgeBg}">
                        ${i + 1}
                    </span>
                </td>
                <td style="padding:14px 24px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9">${emp.id}</td>
                <td style="padding:14px 24px;color:#475569;border-bottom:1px solid #f1f5f9">${emp.department}</td>
                <td style="padding:14px 24px;border-bottom:1px solid #f1f5f9">
                    <div style="display:flex;align-items:center;gap:10px">
                        <div style="width:80px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
                            <div style="height:100%;width:${emp.performance * 10}%;background:#3b82f6;border-radius:3px"></div>
                        </div>
                        <span style="font-weight:700;color:#0f172a">${emp.performance}</span>
                    </div>
                </td>
                <td style="padding:14px 24px;border-bottom:1px solid #f1f5f9">
                    <div style="display:flex;align-items:center;gap:10px">
                        <div style="width:80px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
                            <div style="height:100%;width:${emp.potential * 10}%;background:#8b5cf6;border-radius:3px"></div>
                        </div>
                        <span style="font-weight:700;color:#0f172a">${emp.potential}</span>
                    </div>
                </td>
                <td style="padding:14px 24px;border-bottom:1px solid #f1f5f9">${riskBadge}</td>
                <td style="padding:14px 24px;color:#64748b;font-size:12px;border-bottom:1px solid #f1f5f9">${emp.category}</td>
            </tr>
        `;
    }).join('');
}

// ================================================================
// ACTION HUB — AGENTIC AI RETENTION SYSTEM
// ================================================================
const WORKFLOW_STATES = {
    PENDING:           'pending',
    INTERVENTION_SENT: 'intervention_sent',
    RETAINED:          'retained'
};

const workflowStatuses   = {};
let   selectedStrategies = new Set();
let   currentModalEmployee = null;

function getActionHubEmployees() {
    return employees
        .filter(e => e.riskLevel === 'high' && e.performance > 7)
        .sort((a, b) => b.riskScore - a.riskScore);
}

function initializeActionHub() {
    const priorityEmps = getActionHubEmployees();
    priorityEmps.forEach(emp => {
        if (!workflowStatuses[emp.id]) workflowStatuses[emp.id] = WORKFLOW_STATES.PENDING;
    });
    renderActionHubTable();
    updateActionHubStats();
    const syncEl = document.getElementById('ahLastSync');
    if (syncEl) syncEl.textContent = new Date().toLocaleTimeString();
}

function updateActionHubStats() {
    const priorityEmps = getActionHubEmployees();
    let pending = 0, inProgress = 0, retained = 0;

    priorityEmps.forEach(emp => {
        const s = workflowStatuses[emp.id] || WORKFLOW_STATES.PENDING;
        if (s === WORKFLOW_STATES.PENDING)           pending++;
        else if (s === WORKFLOW_STATES.INTERVENTION_SENT) inProgress++;
        else if (s === WORKFLOW_STATES.RETAINED)     retained++;
    });

    const totalRisk = priorityEmps.reduce((s, e) => s + e.salary * CONFIG.DEFAULT_MULTIPLIER, 0);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('ahPriorityCount',  priorityEmps.length);
    set('ahPendingCount',   pending);
    set('ahInProgressCount',inProgress);
    set('ahRetainedCount',  retained);
    set('ahTotalRiskValue', formatCurrency(totalRisk));
}

function renderActionHubTable() {
    const tbody = document.getElementById('actionHubTable');
    if (!tbody) return;

    const priorityEmps = getActionHubEmployees();

    tbody.innerHTML = priorityEmps.map((emp, i) => {
        const status        = workflowStatuses[emp.id] || WORKFLOW_STATES.PENDING;
        const replacementCost = emp.salary * CONFIG.DEFAULT_MULTIPLIER;
        const riskPercent   = Math.min(Math.round((emp.riskScore / 20) * 100), 100);

        // Risk tags
        const tags = [];
        if (emp.overtime    > 20) tags.push(`<span style="padding:3px 8px;background:#fef3c7;color:#92400e;border-radius:6px;font-size:11px;font-weight:600">⏰ High Overtime</span>`);
        if (emp.engagement  <  5) tags.push(`<span style="padding:3px 8px;background:#ffedd5;color:#9a3412;border-radius:6px;font-size:11px;font-weight:600">📉 Low Engagement</span>`);
        if (emp.salaryGrowth < 2) tags.push(`<span style="padding:3px 8px;background:#fee2e2;color:#991b1b;border-radius:6px;font-size:11px;font-weight:600">💰 Salary Gap</span>`);

        // Status badge
        const statusBadgeMap = {
            [WORKFLOW_STATES.PENDING]:           `<span style="padding:5px 12px;border-radius:9999px;font-size:11px;font-weight:600;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0">⏳ Pending Review</span>`,
            [WORKFLOW_STATES.INTERVENTION_SENT]: `<span style="padding:5px 12px;border-radius:9999px;font-size:11px;font-weight:600;background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe">🚀 Intervention Sent</span>`,
            [WORKFLOW_STATES.RETAINED]:          `<span style="padding:5px 12px;border-radius:9999px;font-size:11px;font-weight:600;background:#d1fae5;color:#065f46;border:1px solid #a7f3d0">✅ Retained</span>`
        };

        // Action button
        let actionBtn;
        if (status === WORKFLOW_STATES.RETAINED) {
            actionBtn = `<button disabled style="padding:8px 16px;background:#d1fae5;color:#065f46;border-radius:8px;font-size:13px;font-weight:600;cursor:not-allowed;border:none">🛡️ Secured</button>`;
        } else if (status === WORKFLOW_STATES.INTERVENTION_SENT) {
            actionBtn = `
                <div style="display:flex;gap:8px;align-items:center">
                    <button onclick="viewPlan('${emp.id}')"
                        style="padding:8px 14px;background:#fff;border:2px solid #2563eb;color:#2563eb;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">
                        👁 View Plan
                    </button>
                    <button onclick="markRetained('${emp.id}')"
                        style="padding:8px 14px;background:#10b981;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">
                        ✓
                    </button>
                </div>`;
        } else {
            actionBtn = `<button onclick="openAgentModal('${emp.id}')"
                style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;
                       box-shadow:0 4px 12px rgba(37,99,235,0.3)">
                ⚡ Activate AI Agent
            </button>`;
        }

        return `
            <tr class="animate-slide-in" style="animation-delay:${i * 30}ms;transition:background 0.15s">
                <td style="padding:18px 24px;border-bottom:1px solid #f1f5f9">
                    <div style="display:flex;align-items:center;gap:12px">
                        <div style="width:40px;height:40px;background:#f1f5f9;border-radius:50%;display:flex;align-items:center;justify-content:center">
                            <svg width="20" height="20" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                            </svg>
                        </div>
                        <div>
                            <p style="font-weight:700;color:#0f172a;margin:0">${emp.id}</p>
                            <p style="font-size:11px;color:#94a3b8;margin:0">${emp.department}</p>
                        </div>
                    </div>
                </td>
                <td style="padding:18px 24px;border-bottom:1px solid #f1f5f9">
                    <div style="display:flex;flex-wrap:wrap;gap:4px">
                        ${tags.length ? tags.join('') : '<span style="color:#94a3b8;font-size:12px">No critical flags</span>'}
                    </div>
                </td>
                <td style="padding:18px 24px;border-bottom:1px solid #f1f5f9">
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:64px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
                            <div style="height:100%;width:${riskPercent}%;background:#ef4444;border-radius:3px"></div>
                        </div>
                        <span style="font-weight:700;color:#ef4444;font-size:13px">${riskPercent}%</span>
                    </div>
                </td>
                <td style="padding:18px 24px;border-bottom:1px solid #f1f5f9">
                    <span style="font-weight:700;color:#0f172a">${formatCurrency(replacementCost)}</span>
                    <p style="font-size:11px;color:#94a3b8;margin:2px 0 0">Replacement cost</p>
                </td>
                <td style="padding:18px 24px;border-bottom:1px solid #f1f5f9">${statusBadgeMap[status]}</td>
                <td style="padding:18px 24px;border-bottom:1px solid #f1f5f9">${actionBtn}</td>
                <td style="padding:18px 24px;border-bottom:1px solid #f1f5f9;text-align:center">
                    <button onclick="openCollaboration('${emp.id}')"
                        title="Open collaboration channel"
                        style="width:40px;height:40px;border-radius:8px;background:#f1f5f9;border:none;cursor:pointer;
                               display:inline-flex;align-items:center;justify-content:center;transition:background 0.15s"
                        onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                        <svg width="18" height="18" fill="none" stroke="#475569" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ================================================================
// AI AGENT MODAL
// ================================================================
function openAgentModal(empId) {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    currentModalEmployee = emp;
    selectedStrategies.clear();
    updateStrategyUI();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('modalEmployeeId', `Personalized intervention for ${emp.id}`);
    set('modalRiskScore',  `${Math.min(Math.round((emp.riskScore / 20) * 100), 100)}%`);
    set('modalPerformance',`${emp.performance}/10`);
    set('modalDepartment', emp.department);
    set('modalOvertime',   `${emp.overtime} hrs/week`);

    const modal = document.getElementById('aiAgentModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('open');
    }
}

function closeAgentModal() {
    const modal = document.getElementById('aiAgentModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('open');
    }
    currentModalEmployee = null;
    selectedStrategies.clear();
    updateStrategyUI();
}

function toggleStrategy(strategyId) {
    if (selectedStrategies.has(strategyId)) {
        selectedStrategies.delete(strategyId);
    } else {
        selectedStrategies.add(strategyId);
    }
    updateStrategyUI();
}

function updateStrategyUI() {
    document.querySelectorAll('.strategy-btn').forEach(btn => {
        const strategy = btn.getAttribute('data-strategy');
        const icon     = btn.querySelector('.strategy-icon');
        const label    = btn.querySelector('.strategy-label');
        const selected = selectedStrategies.has(strategy);

        btn.style.borderColor      = selected ? '#2563eb'  : '#e2e8f0';
        btn.style.backgroundColor  = selected ? '#eff6ff'  : '#fff';
        if (icon) {
            icon.style.backgroundColor = selected ? '#2563eb' : '#f1f5f9';
            icon.style.color           = selected ? '#fff'    : '#475569';
        }
        if (label) {
            label.style.color = selected ? '#2563eb' : '#334155';
        }
    });

    const summary    = document.getElementById('selectionSummary');
    const countEl   = document.getElementById('selectedCount');
    const activateBtn = document.getElementById('activateAgentBtn');

    if (selectedStrategies.size > 0) {
        if (summary)  summary.classList.remove('hidden');
        if (countEl)  countEl.textContent = selectedStrategies.size;
        if (activateBtn) {
            activateBtn.disabled = false;
            activateBtn.style.cssText = `padding:10px 24px;border-radius:12px;font-weight:600;
                display:inline-flex;align-items:center;gap:8px;cursor:pointer;border:none;
                background:#2563eb;color:#fff;box-shadow:0 4px 12px rgba(37,99,235,0.3)`;
        }
    } else {
        if (summary)  summary.classList.add('hidden');
        if (activateBtn) {
            activateBtn.disabled = true;
            activateBtn.style.cssText = `padding:10px 24px;border-radius:12px;font-weight:600;
                display:inline-flex;align-items:center;gap:8px;cursor:not-allowed;border:none;
                background:#e2e8f0;color:#94a3b8`;
        }
    }
}

async function activateAgent() {
    if (!currentModalEmployee || selectedStrategies.size === 0) return;

    const btn = document.getElementById('activateAgentBtn');
    if (!btn) return;

    btn.disabled   = true;
    btn.innerHTML  = `<span class="btn-spinner"></span> Processing...`;
    btn.style.cursor = 'not-allowed';

    await new Promise(r => setTimeout(r, 1500));

    workflowStatuses[currentModalEmployee.id] = WORKFLOW_STATES.INTERVENTION_SENT;
    console.log(`[AI Agent Activated] ${currentModalEmployee.id}`, {
        strategies: [...selectedStrategies],
        timestamp:  new Date().toISOString()
    });

    closeAgentModal();
    renderActionHubTable();
    updateActionHubStats();
    const syncEl = document.getElementById('ahLastSync');
    if (syncEl) syncEl.textContent = new Date().toLocaleTimeString();
}

function viewPlan(empId) {
    alert(`Retention plan for ${empId}:\n\n` +
          `• Recommended salary adjustment: +8–12%\n` +
          `• Workload optimisation: reduce overtime by 30%\n` +
          `• Manager 1-on-1 touchpoints: bi-weekly\n` +
          `• Progress tracking: 90-day review cycle`);
}

function markRetained(empId) {
    workflowStatuses[empId] = WORKFLOW_STATES.RETAINED;
    renderActionHubTable();
    updateActionHubStats();
}

function openCollaboration(empId) {
    const emp = employees.find(e => e.id === empId);
    alert(`Opening secure collaboration channel for ${empId} (${emp ? emp.department : 'Unknown'} dept).\n\nIn production this launches a real-time chat interface with the employee's manager.`);
}

// ================================================================
// INITIALIZATION — wires up everything after the DOM is ready
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Nav click handlers
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => navigateTo(link.getAttribute('data-page')));
    });

    // Slider live-value displays
    const multiplierSlider = document.getElementById('calcMultiplier');
    const lossSlider       = document.getElementById('calcLossMonths');
    if (multiplierSlider) {
        multiplierSlider.addEventListener('input', () => {
            const el = document.getElementById('multiplierValue');
            if (el) el.textContent = multiplierSlider.value + 'x';
        });
    }
    if (lossSlider) {
        lossSlider.addEventListener('input', () => {
            const el = document.getElementById('lossMonthsValue');
            if (el) el.textContent = lossSlider.value + ' months';
        });
    }

    // Close modal when clicking the backdrop
    const modal = document.getElementById('aiAgentModal');
    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) closeAgentModal();
        });
    }

    // ── Initialise all pages ──
    updateOverviewKPIs();
    createOverviewCharts();

    createNineBoxChart();
    populateCategoryBreakdown();
    createCategoryRiskChart();

    calculateAttritionCost();
    populateDeptCostTable();

    populateRetentionTable();
    initializeActionHub();

    console.log('✅ Datanova HR Dashboard initialised successfully');
});
