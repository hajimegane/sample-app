-- 経費申請の項目
--
-- 0001 では汎用の「申請」だったが、AIA-3 で経費申請と確定した。
--
-- 金額は整数（円）で持つ。小数で持つと丸め誤差が原理的に発生し、
-- 合計や按分を入れた時点で必ず食い違う。通貨は日本円固定なので、
-- 最小単位がそのまま円になる。
--
-- 費目は CHECK で縛らない。組織ごとに増減するもので、値の追加のたびに
-- マイグレーションが要るのは実態に合わない。ステータスは3値で固定なので
-- 0001 のとおり CHECK で縛ったまま。
ALTER TABLE applications ADD COLUMN spent_on   TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN category   TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN payee      TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN amount_yen INTEGER NOT NULL DEFAULT 0 CHECK (amount_yen >= 0);

-- 一覧は申請日の新しい順。既存の created_at 索引とは別に要る。
CREATE INDEX IF NOT EXISTS idx_applications_spent_on ON applications (spent_on DESC);
