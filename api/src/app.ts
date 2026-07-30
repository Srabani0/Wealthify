import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import businessRoutes from "./modules/business/business.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import uploadsRoutes from "./modules/uploads/uploads.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import brandsRoutes from "./modules/brands/brands.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import rawMaterialsRoutes from "./modules/raw-materials/raw-materials.routes.js";
import suppliersRoutes from "./modules/suppliers/suppliers.routes.js";
import purchasesRoutes from "./modules/purchases/purchases.routes.js";
import customersRoutes from "./modules/customers/customers.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";
import expensesRoutes from "./modules/expenses/expenses.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import aiRoutes from "./modules/copilot/ai.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== "test" }));

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/business", businessRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/uploads", uploadsRoutes);
app.use("/api/v1/categories", categoriesRoutes);
app.use("/api/v1/brands", brandsRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/raw-materials", rawMaterialsRoutes);
app.use("/api/v1/suppliers", suppliersRoutes);
app.use("/api/v1/purchases", purchasesRoutes);
app.use("/api/v1/customers", customersRoutes);
app.use("/api/v1/orders", ordersRoutes);
app.use("/api/v1/expenses", expensesRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// Read-only AI Copilot chat/session endpoints
app.use("/api/v1/ai", aiRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
