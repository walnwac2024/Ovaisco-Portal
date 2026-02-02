-- Performance Module Schema

-- KPI Templates
CREATE TABLE IF NOT EXISTS performance_kpi_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('numeric', 'rating_1_5', 'yes_no', 'target_vs_achieved', 'text') NOT NULL DEFAULT 'rating_1_5',
    weightage DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    evidence_required BOOLEAN NOT NULL DEFAULT FALSE,
    department VARCHAR(255), -- Can be NULL for all departments
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Performance Cycles
CREATE TABLE IF NOT EXISTS performance_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('draft', 'open', 'locked', 'closed') NOT NULL DEFAULT 'draft',
    departments JSON, -- Store array of departments included
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Evaluations
CREATE TABLE IF NOT EXISTS performance_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cycle_id INT NOT NULL,
    employee_id INT NOT NULL,
    status ENUM('self_evaluation', 'manager_review', 'hr_review', 'final_approval', 'completed') NOT NULL DEFAULT 'self_evaluation',
    total_score DECIMAL(10, 2) DEFAULT 0,
    grade VARCHAR(10),
    final_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES performance_cycles(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE
);

-- Evaluation KPI Items
CREATE TABLE IF NOT EXISTS performance_evaluation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evaluation_id INT NOT NULL,
    kpi_id INT NOT NULL,
    score DECIMAL(10, 2),
    comments TEXT,
    evidence_path VARCHAR(255),
    evidence_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluation_id) REFERENCES performance_evaluations(id) ON DELETE CASCADE,
    FOREIGN KEY (kpi_id) REFERENCES performance_kpi_templates(id) ON DELETE CASCADE
);

-- Goals / OKRs
CREATE TABLE IF NOT EXISTS performance_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id INT, -- Manager or HR who created it
    department VARCHAR(255),
    start_date DATE,
    end_date DATE,
    progress DECIMAL(5, 2) DEFAULT 0, -- 0 to 100
    status ENUM('not_started', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE
);

-- PIP (Performance Improvement Plan)
CREATE TABLE IF NOT EXISTS performance_pip (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    creator_id INT NOT NULL,
    start_date DATE NOT NULL,
    duration_days INT NOT NULL,
    objectives TEXT,
    check_in_dates JSON,
    notes TEXT,
    outcome ENUM('processing', 'pass', 'extend', 'fail') NOT NULL DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE
);

-- Sales Metrics
CREATE TABLE IF NOT EXISTS performance_sales_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    revenue DECIMAL(15, 2) DEFAULT 0,
    leads_assigned INT DEFAULT 0,
    leads_contacted INT DEFAULT 0,
    leads_closed INT DEFAULT 0,
    pipeline_value DECIMAL(15, 2) DEFAULT 0,
    calls INT DEFAULT 0,
    meetings INT DEFAULT 0,
    demos INT DEFAULT 0,
    follow_ups INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_records(id) ON DELETE CASCADE
);

-- Performance Settings (Grading Rules, Thresholds)
CREATE TABLE IF NOT EXISTS performance_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default grading rules
INSERT IGNORE INTO performance_settings (setting_key, setting_value) VALUES 
('grading_rules', '[{"grade": "A", "min_score": 90}, {"grade": "B", "min_score": 75}, {"grade": "C", "min_score": 60}, {"grade": "D", "min_score": 40}, {"grade": "F", "min_score": 0}]'),
('pip_threshold', '40');
