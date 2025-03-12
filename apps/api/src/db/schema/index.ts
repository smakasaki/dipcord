import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Users table schema
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    surname: text("surname").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Export types for the users table
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
