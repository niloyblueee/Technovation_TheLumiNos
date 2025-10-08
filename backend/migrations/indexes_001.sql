-- Pragmatic indexes and schema tweaks for performance
-- 1) Users indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_createdAt ON users(createdAt);
CREATE INDEX IF NOT EXISTS idx_users_reward_point ON users(reward_point);

-- 2) Issues indexes and columns
ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS assigned_department VARCHAR(100) NULL;

CREATE INDEX IF NOT EXISTS idx_issues_status_createdAt ON issues(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_issues_department ON issues(assigned_department);

-- If you plan geo queries, eventually:
-- ALTER TABLE issues ADD COLUMN latitude DECIMAL(9,6) NULL, ADD COLUMN longitude DECIMAL(9,6) NULL;
-- CREATE INDEX idx_issues_lat_lon ON issues(latitude, longitude);

-- 3) Events indexes
CREATE INDEX IF NOT EXISTS idx_events_createdAt ON events(createdAt);
CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(date, time);
