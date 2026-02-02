const express = require("express");
const router = express.Router();
const KPI = require("../Controller/Performance/KPIController");
const Cycle = require("../Controller/Performance/CycleController");
const Evaluation = require("../Controller/Performance/EvaluationController");
const Goal = require("../Controller/Performance/GoalController");
const Sales = require("../Controller/Performance/SalesController");
const PIP = require("../Controller/Performance/PIPController");
const { isAuthenticated, requireFeatures } = require("../middlewares/middleware");

// KPI Templates
router.get("/kpis", isAuthenticated, KPI.listKPITemplates);
router.post("/kpis", isAuthenticated, requireFeatures("performance_manage"), KPI.createKPITemplate);
router.patch("/kpis/:id", isAuthenticated, requireFeatures("performance_manage"), KPI.updateKPITemplate);
router.delete("/kpis/:id", isAuthenticated, requireFeatures("performance_manage"), KPI.deleteKPITemplate);

// Cycles
router.get("/cycles", isAuthenticated, Cycle.listCycles);
router.post("/cycles", isAuthenticated, requireFeatures("performance_manage"), Cycle.createCycle);
router.patch("/cycles/:id/status", isAuthenticated, requireFeatures("performance_manage"), Cycle.updateCycleStatus);

// Evaluations
router.get("/evaluations", isAuthenticated, Evaluation.listEvaluations);
router.get("/evaluations/:id", isAuthenticated, Evaluation.getEvaluationDetails);
router.post("/evaluations/initiate", isAuthenticated, requireFeatures("performance_manage"), Evaluation.initiateEvaluation);
router.post("/evaluations/submit", isAuthenticated, Evaluation.submitEvaluationItems);

// Goals
router.get("/goals", isAuthenticated, Goal.listGoals);
router.post("/goals", isAuthenticated, Goal.createGoal);
router.patch("/goals/:id/progress", isAuthenticated, Goal.updateGoalProgress);

// Sales Metrics
router.get("/sales/summary", isAuthenticated, Sales.getSalesSummary);
router.post("/sales/record", isAuthenticated, Sales.recordSalesMetrics);

// PIP
router.get("/pip", isAuthenticated, PIP.listPIP);
router.post("/pip", isAuthenticated, requireFeatures("performance_manage"), PIP.createPIP);
router.patch("/pip/:id/outcome", isAuthenticated, requireFeatures("performance_manage"), PIP.updatePIPOutcome);

module.exports = router;
