-- =========================================================
-- Elbimas — Aplikasi Pengelola Keuangan
-- Skema database otoritatif. Import manual via phpMyAdmin.
-- MySQL (InnoDB, utf8mb4). Idempotent: CREATE TABLE IF NOT EXISTS.
-- =========================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =========================================================
-- USERS & AUTH
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(255) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  name           VARCHAR(120) NOT NULL,
  base_currency  CHAR(3) NOT NULL DEFAULT 'IDR',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- CURRENCIES & EXCHANGE RATES
-- =========================================================
CREATE TABLE IF NOT EXISTS currencies (
  code    CHAR(3) NOT NULL,          -- 'IDR', 'USD', ...
  name    VARCHAR(60) NOT NULL,
  symbol  VARCHAR(8) NOT NULL,
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kurs referensi milik user (bisa diisi manual atau di-prefill dari API opsional)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  base_currency  CHAR(3) NOT NULL,
  quote_currency CHAR(3) NOT NULL,
  rate           DECIMAL(20,8) NOT NULL,   -- 1 base = rate quote
  rate_date      DATE NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rate (user_id, base_currency, quote_currency, rate_date),
  KEY idx_rate_lookup (user_id, base_currency, quote_currency, rate_date),
  CONSTRAINT fk_rate_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- WALLETS / ACCOUNTS
-- =========================================================
CREATE TABLE IF NOT EXISTS wallets (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT UNSIGNED NOT NULL,
  name             VARCHAR(120) NOT NULL,
  type             ENUM('cash','bank','ewallet','credit_card','investment','other') NOT NULL DEFAULT 'cash',
  currency         CHAR(3) NOT NULL,
  initial_balance  DECIMAL(20,4) NOT NULL DEFAULT 0,
  color            VARCHAR(16) NULL,
  icon             VARCHAR(40) NULL,
  is_archived      TINYINT(1) NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wallets_user (user_id, is_archived),
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- CATEGORIES (income / expense, boleh punya parent)
-- =========================================================
CREATE TABLE IF NOT EXISTS categories (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(120) NOT NULL,
  type       ENUM('income','expense') NOT NULL,
  parent_id  BIGINT UNSIGNED NULL,
  color      VARCHAR(16) NULL,
  icon       VARCHAR(40) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_categories_user (user_id, type),
  CONSTRAINT fk_categories_user   FOREIGN KEY (user_id)   REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TRANSACTIONS (income / expense). Transfer punya tabel sendiri.
-- =========================================================
CREATE TABLE IF NOT EXISTS transactions (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT UNSIGNED NOT NULL,
  wallet_id        BIGINT UNSIGNED NOT NULL,
  category_id      BIGINT UNSIGNED NULL,
  type             ENUM('income','expense') NOT NULL,
  amount           DECIMAL(20,4) NOT NULL,      -- selalu positif, arah ditentukan 'type'
  currency         CHAR(3) NOT NULL,            -- = currency wallet saat itu
  fx_rate_to_base  DECIMAL(20,8) NOT NULL DEFAULT 1, -- kurs ke base_currency user saat transaksi
  note             VARCHAR(255) NULL,
  transaction_date DATE NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tx_user_date (user_id, transaction_date),
  KEY idx_tx_wallet (wallet_id),
  KEY idx_tx_category (category_id),
  CONSTRAINT fk_tx_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_tx_wallet   FOREIGN KEY (wallet_id)   REFERENCES wallets(id)    ON DELETE CASCADE,
  CONSTRAINT fk_tx_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TRANSFERS antar wallet (mendukung beda mata uang)
-- =========================================================
CREATE TABLE IF NOT EXISTS transfers (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  from_wallet_id BIGINT UNSIGNED NOT NULL,
  to_wallet_id   BIGINT UNSIGNED NOT NULL,
  from_amount    DECIMAL(20,4) NOT NULL,       -- keluar dari from_wallet (currency from)
  to_amount      DECIMAL(20,4) NOT NULL,       -- masuk ke to_wallet (currency to)
  fee            DECIMAL(20,4) NOT NULL DEFAULT 0,
  note           VARCHAR(255) NULL,
  transfer_date  DATE NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transfer_user_date (user_id, transfer_date),
  CONSTRAINT fk_transfer_user FOREIGN KEY (user_id)        REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_transfer_from FOREIGN KEY (from_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  CONSTRAINT fk_transfer_to   FOREIGN KEY (to_wallet_id)   REFERENCES wallets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- BUDGETS (per kategori, periode bulanan)
-- =========================================================
CREATE TABLE IF NOT EXISTS budgets (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  category_id  BIGINT UNSIGNED NULL,          -- NULL = budget total
  amount       DECIMAL(20,4) NOT NULL,
  currency     CHAR(3) NOT NULL,              -- biasanya = base_currency
  period_month CHAR(7) NOT NULL,             -- format 'YYYY-MM'
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_budget (user_id, category_id, period_month),
  CONSTRAINT fk_budget_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_budget_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- SAVINGS GOALS (target tabungan)
-- =========================================================
CREATE TABLE IF NOT EXISTS savings_goals (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  name           VARCHAR(120) NOT NULL,
  target_amount  DECIMAL(20,4) NOT NULL,
  current_amount DECIMAL(20,4) NOT NULL DEFAULT 0,
  currency       CHAR(3) NOT NULL,
  wallet_id      BIGINT UNSIGNED NULL,         -- opsional: dompet penampung
  target_date    DATE NULL,
  is_achieved    TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_goal_user (user_id),
  CONSTRAINT fk_goal_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_goal_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- DEBTS (utang = payable, piutang = receivable)
-- =========================================================
CREATE TABLE IF NOT EXISTS debts (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT UNSIGNED NOT NULL,
  type             ENUM('payable','receivable') NOT NULL,
  counterparty     VARCHAR(120) NOT NULL,        -- nama orang/pihak
  principal_amount DECIMAL(20,4) NOT NULL,
  currency         CHAR(3) NOT NULL,
  due_date         DATE NULL,
  status           ENUM('open','partial','settled') NOT NULL DEFAULT 'open',
  note             VARCHAR(255) NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_debt_user (user_id, status),
  CONSTRAINT fk_debt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS debt_payments (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  debt_id      BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  amount       DECIMAL(20,4) NOT NULL,
  wallet_id    BIGINT UNSIGNED NULL,           -- dompet sumber/tujuan pembayaran
  payment_date DATE NOT NULL,
  note         VARCHAR(255) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_debtpay_debt (debt_id),
  CONSTRAINT fk_debtpay_debt   FOREIGN KEY (debt_id)   REFERENCES debts(id)   ON DELETE CASCADE,
  CONSTRAINT fk_debtpay_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_debtpay_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- RECURRING TRANSACTIONS (transaksi/tagihan berulang)
-- =========================================================
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  wallet_id      BIGINT UNSIGNED NOT NULL,
  category_id    BIGINT UNSIGNED NULL,
  type           ENUM('income','expense') NOT NULL,
  amount         DECIMAL(20,4) NOT NULL,
  currency       CHAR(3) NOT NULL,
  frequency      ENUM('daily','weekly','monthly','yearly') NOT NULL,
  interval_count INT UNSIGNED NOT NULL DEFAULT 1,   -- tiap N frequency
  next_run_date  DATE NOT NULL,
  end_date       DATE NULL,
  note           VARCHAR(255) NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_recurring_due (is_active, next_run_date),
  CONSTRAINT fk_recur_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_recur_wallet   FOREIGN KEY (wallet_id)   REFERENCES wallets(id)    ON DELETE CASCADE,
  CONSTRAINT fk_recur_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
