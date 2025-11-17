import {
  createProject as dbCreateProject,
  getProjectById as dbGetProjectById,
  updateProject as dbUpdateProject,
} from '../db/queries';
import { Project, AvatarSettings, ProjectStatus } from '../types';
import { AppError } from '../utils/error';

export async function createProject(userId: string, productUrl: string): Promise<Project> {
  return await dbCreateProject({ userId, productUrl, status: 'draft' });
}

export async function getProject(projectId: string): Promise<Project> {
  const project = await dbGetProjectById(projectId);
  if (!project) {
    throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  }
  return project;
}

export async function updateProjectAssets(
  projectId: string,
  avatarSettings: AvatarSettings,
  scriptText: string
): Promise<void> {
  await dbUpdateProject(projectId, {
    status: 'assets_ready',
    avatar_settings: avatarSettings,
    script_text: scriptText,
  });
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
  await dbUpdateProject(projectId, { status });
}
