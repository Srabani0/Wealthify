import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as copilotController from './copilot.controller.js';

const router = Router();

// Apply authentication middleware to verify credentials and set req.user
router.use(authMiddleware);

// POST /chat -> Streams the assistant responses (SSE)
router.post('/chat', asyncHandler(copilotController.chatStream));

// GET /conversations -> List all active sessions
router.get('/conversations', asyncHandler(copilotController.listSessions));

// POST /conversations -> Create a new session
router.post('/conversations', asyncHandler(copilotController.createSession));

// GET /conversation/:id -> Retrieve messages inside session :id
router.get('/conversation/:id', asyncHandler(copilotController.getSessionMessages));

// DELETE /conversation/:id -> Hard delete session :id
router.delete('/conversation/:id', asyncHandler(copilotController.deleteSession));

// PATCH /conversation/:id -> Update session metadata (title)
router.patch('/conversation/:id', asyncHandler(copilotController.renameSession));

// POST /feedback -> Record user upvote/downvote feedback
router.post('/feedback', asyncHandler(copilotController.feedback));

// POST /regenerate -> Reset and recalculate latest assistant reply (SSE)
router.post('/regenerate', asyncHandler(copilotController.regenerate));

export default router;
