import { Router } from 'express';
const router = Router();

import { createProject, getAllProjects, getProjectById, updateProject, deleteProject } from '../controllers/projectController.js';
import authMiddleware from '../middleware/authMiddleware.js';
// Define routes
router.post('/create', authMiddleware, createProject); // Create a new project
router.get('/', authMiddleware, getAllProjects); // Get all projects
router.get('/:id', authMiddleware, getProjectById); // Get a project by ID
router.put('/:id', authMiddleware, updateProject); // Update a project by ID
router.delete('/:id', authMiddleware, deleteProject); // Delete a project by ID
// Export the router
export default router;