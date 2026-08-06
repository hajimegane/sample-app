-- 申請テーブル
--
-- ステータスは pending / approved / rejected の3値。
-- CHECK 制約で縛るのは、不正な値がアプリ層をすり抜けたときに
-- 型検査でもテストでもなくデータベースが落ちるようにするため。
CREATE TABLE IF NOT EXISTS applications (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  applicant   TEXT NOT NULL,
  reason      TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status, created_at DESC);
