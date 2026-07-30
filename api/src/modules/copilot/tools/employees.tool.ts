import { ToolDefinition } from '../types/copilot.types.js';
import { prisma } from '../../../config/prisma.js';

export const getEmployeeTool: ToolDefinition = {
  name: 'getEmployee',
  description: 'Retrieve detail profile profile details of a specific user/employee by ID or name.',
  parameters: {
    type: 'object',
    properties: {
      employeeId: { type: 'string', description: 'Employee User ID' },
      name: { type: 'string', description: 'Employee name' }
    },
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    let employee = null;
    if (args.employeeId) {
      employee = await prisma.user.findFirst({
        where: { businessId, id: args.employeeId },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
      });
    } else if (args.name) {
      employee = await prisma.user.findFirst({
        where: { businessId, name: { contains: args.name, mode: 'insensitive' } },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
      });
    }
    return { success: true, employee };
  }
};

export const listEmployeesTool: ToolDefinition = {
  name: 'listEmployees',
  description: 'List all registered employees/users for the business system.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    const employees = await prisma.user.findMany({
      where: { businessId },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' }
    });
    return { success: true, employees };
  }
};

export const getEmployeeAbsenceTool: ToolDefinition = {
  name: 'getEmployeeAbsence',
  description: 'Retrieve a list of employees who are absent or inactive today.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (businessId: string, args: any, userRole: string) => {
    // Since there is no explicit attendance table, inactive users represent inactive/absent status.
    const inactiveUsers = await prisma.user.findMany({
      where: { businessId, isActive: false },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });

    const activeUsers = await prisma.user.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, role: true }
    });

    return {
      success: true,
      absentEmployees: inactiveUsers,
      activePresentCount: activeUsers.length,
      note: 'All active users are currently marked as active in the system today. Inactive users are returned as absent/inactive.'
    };
  }
};
