import { ToolDefinition } from '../types/copilot.types.js';
import { 
  getLowStockTool, 
  getStockTool, 
  getOutOfStockTool, 
  getInventoryValueTool, 
  getProductAvailabilityTool 
} from './inventory.tool.js';
import { 
  getOrderSummaryTool, 
  listOrdersTool, 
  getOrderCountTool, 
  getPendingOrdersTool, 
  getCancelledOrdersTool, 
  getCompletedOrdersTool, 
  getOrdersByCustomerTool, 
  getOrdersByCategoryTool, 
  getOrdersByDateTool 
} from './orders.tool.js';
import { getExpenseSummaryTool, listExpensesTool } from './expenses.tool.js';
import { 
  listCustomersTool, 
  getCustomerTool, 
  getCustomerOrdersTool, 
  getTopCustomersTool, 
  getCustomerInvoicesTool 
} from './customers.tool.js';
import { 
  listSuppliersTool, 
  getSupplierTool, 
  getSupplierPurchasesTool, 
  getTopSuppliersTool 
} from './suppliers.tool.js';
import { 
  getRevenueTool, 
  getRevenueByDateTool, 
  getRevenueByMonthTool, 
  getRevenueByYearTool 
} from './revenue.tool.js';
import { 
  getEmployeeTool, 
  listEmployeesTool, 
  getEmployeeAbsenceTool 
} from './employees.tool.js';
import { 
  getInvoicesTool, 
  getUnpaidInvoicesTool, 
  getInvoiceDetailsTool 
} from './invoices.tool.js';
import { 
  getPaymentsTool, 
  getPaymentSummaryTool 
} from './payments.tool.js';
import { 
  getDashboardSummaryTool 
} from './dashboard.tool.js';

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    // Inventory
    this.register(getLowStockTool);
    this.register(getStockTool);
    this.register(getOutOfStockTool);
    this.register(getInventoryValueTool);
    this.register(getProductAvailabilityTool);

    // Orders
    this.register(getOrderSummaryTool);
    this.register(listOrdersTool);
    this.register(getOrderCountTool);
    this.register(getPendingOrdersTool);
    this.register(getCancelledOrdersTool);
    this.register(getCompletedOrdersTool);
    this.register(getOrdersByCustomerTool);
    this.register(getOrdersByCategoryTool);
    this.register(getOrdersByDateTool);

    // Expenses
    this.register(getExpenseSummaryTool);
    this.register(listExpensesTool);

    // Customers
    this.register(listCustomersTool);
    this.register(getCustomerTool);
    this.register(getCustomerOrdersTool);
    this.register(getTopCustomersTool);
    this.register(getCustomerInvoicesTool);

    // Suppliers
    this.register(listSuppliersTool);
    this.register(getSupplierTool);
    this.register(getSupplierPurchasesTool);
    this.register(getTopSuppliersTool);

    // Revenue
    this.register(getRevenueTool);
    this.register(getRevenueByDateTool);
    this.register(getRevenueByMonthTool);
    this.register(getRevenueByYearTool);

    // Employees
    this.register(getEmployeeTool);
    this.register(listEmployeesTool);
    this.register(getEmployeeAbsenceTool);

    // Invoices
    this.register(getInvoicesTool);
    this.register(getUnpaidInvoicesTool);
    this.register(getInvoiceDetailsTool);

    // Payments
    this.register(getPaymentsTool);
    this.register(getPaymentSummaryTool);

    // Dashboard
    this.register(getDashboardSummaryTool);
  }

  public register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getAllToolSchemas(): any[] {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  public async executeTool(
    name: string,
    businessId: string,
    args: any,
    userRole: string
  ): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found in registry.`);
    }
    return await tool.execute(businessId, args, userRole);
  }
}

export const toolRegistry = new ToolRegistry();
export type { ToolDefinition };
