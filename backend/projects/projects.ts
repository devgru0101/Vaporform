import { api, APIError } from "encore.dev/api";
import log from "encore.dev/log";
import { AuthData } from "../auth/auth";

// Import service definition
import "./encore.service";

// Project interface
export interface Project {
  id: string;
  name: string;
  description: string;
  type: "web" | "mobile" | "api" | "library";
  framework: string;
  language: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "archived" | "template";
}

// Request/Response interfaces (pure TypeScript - no Zod)
interface CreateProjectRequest {
  name: string;
  description?: string;
  type: "web" | "mobile" | "api" | "library";
  framework: string;
  language: string;
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
  type?: "web" | "mobile" | "api" | "library";
  framework?: string;
  language?: string;
  status?: "active" | "archived" | "template";
}

interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  type: "web" | "mobile" | "api" | "library";
  framework: string;
  language: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "archived" | "template";
}

interface ProjectListResponse {
  projects: ProjectResponse[];
}

interface ProjectFilesResponse {
  files: string[];
}

// Validation functions (replacing Zod)
function validateCreateProjectRequest(req: CreateProjectRequest): void {
  if (!req.name || req.name.trim().length === 0) {
    throw APIError.invalidArgument("Project name is required");
  }
  
  const validTypes = ["web", "mobile", "api", "library"];
  if (!validTypes.includes(req.type)) {
    throw APIError.invalidArgument(`Type must be one of: ${validTypes.join(", ")}`);
  }
  
  if (!req.framework || req.framework.trim().length === 0) {
    throw APIError.invalidArgument("Framework is required");
  }
  
  if (!req.language || req.language.trim().length === 0) {
    throw APIError.invalidArgument("Language is required");
  }
}

function validateUpdateProjectRequest(req: UpdateProjectRequest): void {
  if (req.name !== undefined && req.name.trim().length === 0) {
    throw APIError.invalidArgument("Project name cannot be empty");
  }
  
  if (req.type !== undefined) {
    const validTypes = ["web", "mobile", "api", "library"];
    if (!validTypes.includes(req.type)) {
      throw APIError.invalidArgument(`Type must be one of: ${validTypes.join(", ")}`);
    }
  }
  
  if (req.framework !== undefined && req.framework.trim().length === 0) {
    throw APIError.invalidArgument("Framework cannot be empty");
  }
  
  if (req.language !== undefined && req.language.trim().length === 0) {
    throw APIError.invalidArgument("Language cannot be empty");
  }
  
  if (req.status !== undefined) {
    const validStatuses = ["active", "archived", "template"];
    if (!validStatuses.includes(req.status)) {
      throw APIError.invalidArgument(`Status must be one of: ${validStatuses.join(", ")}`);
    }
  }
}

// Mock project storage (replace with database)
const projects: Map<string, Project> = new Map();

// Seed with demo projects
const demoProjects: Project[] = [
  {
    id: "demo-project-1",
    name: "E-commerce Platform",
    description: "A full-stack e-commerce platform with React and Node.js",
    type: "web",
    framework: "React",
    language: "TypeScript",
    userId: "demo-user-id",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    status: "active",
  },
  {
    id: "demo-project-2",
    name: "Mobile Chat App",
    description: "Real-time chat application for iOS and Android",
    type: "mobile",
    framework: "React Native",
    language: "TypeScript",
    userId: "demo-user-id",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
    status: "active",
  },
];

demoProjects.forEach(project => {
  projects.set(project.id, project);
});

// Get all projects for the authenticated user
export const list = api(
  { method: "GET", path: "/projects", expose: true },
  async (): Promise<ProjectListResponse> => {
    // For testing - mock user ID
    const mockUserID = "demo-user-id";
    
    log.info("List projects request", { userID: mockUserID });

    const userProjects = Array.from(projects.values())
      .filter(p => p.userId === mockUserID)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const projectList = userProjects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      framework: project.framework,
      language: project.language,
      userId: project.userId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      status: project.status,
    }));

    return { projects: projectList };
  }
);

// Get a specific project
export const get = api(
  { method: "GET", path: "/projects/:id", auth: true, expose: true },
  async ({ id }: { id: string }, meta): Promise<ProjectResponse> => {
    const authData = meta.auth as AuthData;
    
    log.info("Get project request", { projectId: id, userID: authData.userID });

    const project = projects.get(id);
    if (!project) {
      throw APIError.notFound("Project not found");
    }

    // Check if user owns the project
    if (project.userId !== authData.userID) {
      throw APIError.permissionDenied("Access denied");
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      framework: project.framework,
      language: project.language,
      userId: project.userId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      status: project.status,
    };
  }
);

// Create a new project
export const create = api(
  { method: "POST", path: "/projects", expose: true },
  async ({ name, description, type, framework, language }: CreateProjectRequest): Promise<ProjectResponse> => {
    // For testing - mock user ID
    const mockUserID = "demo-user-id";
    
    log.info("Create project request", { name, type, framework, userID: mockUserID });

    // Validation
    validateCreateProjectRequest({ name, description, type, framework, language });

    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description?.trim() || "",
      type,
      framework: framework.trim(),
      language: language.trim(),
      userId: mockUserID,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
    };

    projects.set(newProject.id, newProject);

    log.info("Project created", { projectId: newProject.id, userID: mockUserID });

    return {
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      type: newProject.type,
      framework: newProject.framework,
      language: newProject.language,
      userId: newProject.userId,
      createdAt: newProject.createdAt,
      updatedAt: newProject.updatedAt,
      status: newProject.status,
    };
  }
);

// Update a project
export const update = api(
  { method: "PUT", path: "/projects/:id", auth: true, expose: true },
  async ({ id, ...updates }: { id: string } & UpdateProjectRequest, meta): Promise<ProjectResponse> => {
    const authData = meta.auth as AuthData;
    
    log.info("Update project request", { projectId: id, userID: authData.userID });

    // Validation
    validateUpdateProjectRequest(updates);

    const project = projects.get(id);
    if (!project) {
      throw APIError.notFound("Project not found");
    }

    // Check if user owns the project
    if (project.userId !== authData.userID) {
      throw APIError.permissionDenied("Access denied");
    }

    // Clean and prepare updates
    const cleanUpdates: Partial<Project> = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
    if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
    if (updates.type !== undefined) cleanUpdates.type = updates.type;
    if (updates.framework !== undefined) cleanUpdates.framework = updates.framework.trim();
    if (updates.language !== undefined) cleanUpdates.language = updates.language.trim();
    if (updates.status !== undefined) cleanUpdates.status = updates.status;

    // Update project fields
    const updatedProject: Project = {
      ...project,
      ...cleanUpdates,
      updatedAt: new Date(),
    };

    projects.set(id, updatedProject);

    log.info("Project updated", { projectId: id, userID: authData.userID });

    return {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      type: updatedProject.type,
      framework: updatedProject.framework,
      language: updatedProject.language,
      userId: updatedProject.userId,
      createdAt: updatedProject.createdAt,
      updatedAt: updatedProject.updatedAt,
      status: updatedProject.status,
    };
  }
);

// Delete a project
export const remove = api(
  { method: "DELETE", path: "/projects/:id", auth: true, expose: true },
  async ({ id }: { id: string }, meta): Promise<{ success: boolean }> => {
    const authData = meta.auth as AuthData;
    
    log.info("Delete project request", { projectId: id, userID: authData.userID });

    const project = projects.get(id);
    if (!project) {
      throw APIError.notFound("Project not found");
    }

    // Check if user owns the project
    if (project.userId !== authData.userID) {
      throw APIError.permissionDenied("Access denied");
    }

    projects.delete(id);

    log.info("Project deleted", { projectId: id, userID: authData.userID });

    return { success: true };
  }
);

// Get project files (placeholder endpoint)
export const getFiles = api(
  { method: "GET", path: "/projects/:id/files", auth: true, expose: true },
  async ({ id }: { id: string }, meta): Promise<ProjectFilesResponse> => {
    const authData = meta.auth as AuthData;
    
    log.info("Get project files request", { projectId: id, userID: authData.userID });

    const project = projects.get(id);
    if (!project) {
      throw APIError.notFound("Project not found");
    }

    // Check if user owns the project
    if (project.userId !== authData.userID) {
      throw APIError.permissionDenied("Access denied");
    }

    // Placeholder - return mock files
    const mockFiles = [
      "src/index.ts",
      "src/components/App.tsx",
      "package.json",
      "README.md",
    ];

    return { files: mockFiles };
  }
);