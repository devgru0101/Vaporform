import { SQLDatabase } from "encore.dev/storage/sqldb";

// Single shared database for all Vaporform services
export const db = new SQLDatabase("vaporform", {
  migrations: "./migrations",
});