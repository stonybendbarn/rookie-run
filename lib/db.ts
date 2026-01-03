// lib/db.ts
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");

const sql = neon(process.env.DATABASE_URL);

export default sql;