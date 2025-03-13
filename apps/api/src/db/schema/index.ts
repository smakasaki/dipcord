import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

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

// Sessions table schema
export const sessions = pgTable("sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 64 }).notNull().unique(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }).defaultNow().notNull(),
});

// Export types for the users table
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Export types for the sessions table
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
