import type { RoleName } from "../constants/roles.js";

// Shape encoded into the JWT and attached to req.user on the backend —
// shared so the frontend's decoded-user type never drifts from the backend's.
export interface AuthTokenPayload {
  userId: string;
  businessId: string;
  role: RoleName;
}

export interface AuthUser {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: RoleName;
}
