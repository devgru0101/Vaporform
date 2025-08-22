import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Database setup
const db = new SQLDatabase("projectwizard", {
  migrations: "./migrations",
});

// Interfaces
interface ProjectWizardSession {
  id: string;
  userId: string;
  projectVision: {
    name: string;
    description: string;
    type: string;
    goals: string[];
  };
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    deployment: string[];
  };
  integrations: string[];
  status: 'draft' | 'complete';
  createdAt: string;
  updatedAt: string;
}

interface CreateSessionRequest {
  userId: string;
}

interface UpdateSessionRequest {
  sessionId: string;
  projectVision?: ProjectWizardSession['projectVision'];
  techStack?: ProjectWizardSession['techStack'];
  integrations?: string[];
  status?: 'draft' | 'complete';
}

interface GenerateProjectRequest {
  sessionId: string;
}

// API Endpoints
export const createSession = api(
  { method: "POST", path: "/projectwizard/session" },
  async (req: CreateSessionRequest): Promise<ProjectWizardSession> => {
    const sessionId = "session-" + Date.now() + "-" + Math.random().toString(36).substr(2, 8);
    const now = new Date().toISOString();
    
    const session: ProjectWizardSession = {
      id: sessionId,
      userId: req.userId,
      projectVision: {
        name: "",
        description: "",
        type: "",
        goals: []
      },
      techStack: {
        frontend: [],
        backend: [],
        database: [],
        deployment: []
      },
      integrations: [],
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };

    // Insert into database
    await db.exec`
      INSERT INTO wizard_sessions (id, user_id, project_vision, tech_stack, integrations, status, created_at, updated_at)
      VALUES (${sessionId}, ${req.userId}, ${JSON.stringify(session.projectVision)}, 
              ${JSON.stringify(session.techStack)}, ${JSON.stringify(session.integrations)}, 
              ${session.status}, ${now}, ${now})
    `;

    return session;
  }
);

export const getSession = api(
  { method: "GET", path: "/projectwizard/session/:id" },
  async ({ id }: { id: string }): Promise<ProjectWizardSession> => {
    const rows = await db.query`
      SELECT * FROM wizard_sessions WHERE id = ${id}
    `;

    if (rows.length === 0) {
      throw new Error("Session not found");
    }

    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      projectVision: JSON.parse(row.project_vision),
      techStack: JSON.parse(row.tech_stack),
      integrations: JSON.parse(row.integrations),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
);

export const updateSession = api(
  { method: "PUT", path: "/projectwizard/session" },
  async (req: UpdateSessionRequest): Promise<ProjectWizardSession> => {
    const now = new Date().toISOString();

    // Get existing session
    const existing = await getSession({ id: req.sessionId });
    
    // Update fields
    const updated = {
      ...existing,
      projectVision: req.projectVision || existing.projectVision,
      techStack: req.techStack || existing.techStack,
      integrations: req.integrations || existing.integrations,
      status: req.status || existing.status,
      updatedAt: now
    };

    // Update in database
    await db.exec`
      UPDATE wizard_sessions 
      SET project_vision = ${JSON.stringify(updated.projectVision)},
          tech_stack = ${JSON.stringify(updated.techStack)},
          integrations = ${JSON.stringify(updated.integrations)},
          status = ${updated.status},
          updated_at = ${now}
      WHERE id = ${req.sessionId}
    `;

    return updated;
  }
);

export const generateProject = api(
  { method: "POST", path: "/projectwizard/generate" },
  async (req: GenerateProjectRequest): Promise<{ success: boolean; projectId: string; message: string }> => {
    // Get session
    const session = await getSession({ id: req.sessionId });
    
    // Mock project generation
    const projectId = "project-" + Date.now();
    
    // Update session status to complete
    await updateSession({
      sessionId: req.sessionId,
      status: 'complete'
    });

    return {
      success: true,
      projectId,
      message: "Project generated successfully"
    };
  }
);

export const getUserSessions = api(
  { method: "GET", path: "/projectwizard/user/:userId/sessions" },
  async ({ userId }: { userId: string }): Promise<{ sessions: ProjectWizardSession[] }> => {
    const rows = await db.query`
      SELECT * FROM wizard_sessions WHERE user_id = ${userId} ORDER BY created_at DESC
    `;

    const sessions = rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      projectVision: JSON.parse(row.project_vision),
      techStack: JSON.parse(row.tech_stack),
      integrations: JSON.parse(row.integrations),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return { sessions };
  }
);