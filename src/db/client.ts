import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import type { Database } from "./schema-types";

declare global {
  // Simpan instance di global agar hot-reload dev tidak membuat pool baru terus
  var __elbimasDb: Kysely<Database> | undefined;
}

function createDb() {
  const pool = createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    // DECIMAL dikembalikan sebagai string — jangan pernah jadi float
    decimalNumbers: false,
    dateStrings: false,
    timezone: "Z",
    charset: "utf8mb4_unicode_ci",
  });

  return new Kysely<Database>({
    dialect: new MysqlDialect({ pool }),
  });
}

export const db: Kysely<Database> = globalThis.__elbimasDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__elbimasDb = db;
}
