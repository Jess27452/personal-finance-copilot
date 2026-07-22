import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  email: text("email").primaryKey(),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull().references(() => users.email, { onDelete: "cascade" }),
  date: text("date").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  category: text("category").notNull(),
  confidence: real("confidence").notNull(),
  method: text("method").notNull(),
  source: text("source").notNull().default("csv"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("transactions_owner_date_idx").on(table.userEmail, table.date)]);
