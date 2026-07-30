import { ToolDefinition } from '../types/copilot.types.js';
import { getExpenseSummary, listExpenses } from '../../expenses/expenses.service.js';

export const getExpenseSummaryTool: ToolDefinition = {
  name: 'getExpenseSummary',
  description: 'Retrieve aggregated business expense summary including total expenditure, count, and daily breakdown for a date range.',
  parameters: {
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'ISO start date string (inclusive). Example: "2026-07-01T00:00:00.000Z"'
      },
      to: {
        type: 'string',
        description: 'ISO end date string (inclusive). Example: "2026-07-31T23:59:59.999Z"'
      }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    // Only Owners/Admins should see expenses
    if (userRole === 'STAFF') {
      return {
        success: false,
        error: 'Unauthorized: Staff roles do not have permission to view financial summaries.'
      };
    }

    const fromDate = args.from ? new Date(args.from) : undefined;
    const toDate = args.to ? new Date(args.to) : undefined;

    const result = await getExpenseSummary(businessId, fromDate, toDate);
    return {
      success: true,
      summary: result
    };
  }
};

export const listExpensesTool: ToolDefinition = {
  name: 'listExpenses',
  description: 'List detailed business expenses with pagination and filters by date range.',
  parameters: {
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'ISO start date string'
      },
      to: {
        type: 'string',
        description: 'ISO end date string'
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (starts at 1)'
      },
      pageSize: {
        type: 'number',
        description: 'Number of records per page (max 50)'
      }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    if (userRole === 'STAFF') {
      return {
        success: false,
        error: 'Unauthorized: Staff roles do not have permission to view expenses.'
      };
    }

    const page = Math.max(1, args.page || 1);
    const pageSize = Math.min(50, args.pageSize || 20);

    const query = {
      from: args.from ? new Date(args.from) : undefined,
      to: args.to ? new Date(args.to) : undefined,
      page,
      pageSize
    };

    const result = await listExpenses(businessId, query);
    return {
      success: true,
      ...result,
      page,
      pageSize
    };
  }
};
