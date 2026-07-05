-- =========================================================
-- Elbimas — seed data
-- Import setelah schema.sql. Idempotent (INSERT IGNORE).
-- =========================================================

SET NAMES utf8mb4;

INSERT IGNORE INTO currencies (code, name, symbol) VALUES
  ('IDR', 'Rupiah Indonesia', 'Rp'),
  ('USD', 'Dolar Amerika Serikat', '$'),
  ('EUR', 'Euro', '€'),
  ('SGD', 'Dolar Singapura', 'S$'),
  ('JPY', 'Yen Jepang', '¥'),
  ('MYR', 'Ringgit Malaysia', 'RM'),
  ('GBP', 'Pound Sterling Inggris', '£'),
  ('AUD', 'Dolar Australia', 'A$'),
  ('CNY', 'Yuan Tiongkok', 'CN¥'),
  ('KRW', 'Won Korea Selatan', '₩'),
  ('THB', 'Baht Thailand', '฿'),
  ('SAR', 'Riyal Arab Saudi', 'SR'),
  ('AED', 'Dirham Uni Emirat Arab', 'DH'),
  ('HKD', 'Dolar Hong Kong', 'HK$'),
  ('CHF', 'Franc Swiss', 'CHF'),
  ('INR', 'Rupee India', '₹'),
  ('PHP', 'Peso Filipina', '₱'),
  ('VND', 'Dong Vietnam', '₫'),
  ('CAD', 'Dolar Kanada', 'C$'),
  ('NZD', 'Dolar Selandia Baru', 'NZ$');
