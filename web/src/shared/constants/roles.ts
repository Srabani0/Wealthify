export const ROLES = ["OWNER", "ADMIN", "STAFF"] as const;
export type RoleName = (typeof ROLES)[number];

// Roles assignable to a user created *after* the business exists.
// OWNER is only ever created atomically at business registration time.
export const ASSIGNABLE_ROLES = ["ADMIN", "STAFF"] as const;
export type AssignableRoleName = (typeof ASSIGNABLE_ROLES)[number];
