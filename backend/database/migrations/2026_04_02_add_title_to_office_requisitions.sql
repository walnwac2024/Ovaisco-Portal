-- Add missing 'title' column to office_requisitions table
ALTER TABLE office_requisitions 
ADD COLUMN title VARCHAR(255) AFTER employee_id;
