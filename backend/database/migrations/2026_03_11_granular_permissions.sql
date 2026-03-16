-- backend/database/migrations/2026_03_11_granular_permissions.sql
-- Support for individual user and department-level permission overrides

CREATE TABLE IF NOT EXISTS user_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    feature_code VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee_records(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id, feature_code)
);

CREATE TABLE IF NOT EXISTS department_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department VARCHAR(255) NOT NULL,
    feature_code VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (department, feature_code)
);
