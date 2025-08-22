import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import log from "encore.dev/log";

// Import service definition
import "./encore.service";

// Database setup for project wizard sessions
const db = new SQLDatabase("projectwizard", {
  migrations: "./migrations",
});

// Project Creation Modal interfaces (replacing wizard terminology)
export interface ProjectCreationStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  data?: any;
  validation?: {
    isValid: boolean;
    errors: string[];
  };
}

export interface ProjectCreationSession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  steps: ProjectCreationStep[];
  projectData: {
    name?: string;
    description?: string;
    selectedTemplate?: string;
    customizations?: Record<string, any>;
    integrations?: string[];
  };
  status: 'active' | 'completed' | 'abandoned';
}

// Request/Response interfaces
interface CreateSessionRequest {
  userId: string;
}

interface UpdateSessionRequest {
  data: any;
}

interface UpdateStepRequest {
  data: any;
}

// Helper functions for database operations

// Default steps for project creation modal
const defaultSteps: ProjectCreationStep[] = [
  {
    id: 'project-vision',
    name: 'Project Vision',
    description: 'Define your project vision and goals',
    completed: false,
  },
  {
    id: 'technology-stack',
    name: 'Technology Stack',
    description: 'Choose your technology stack and template',
    completed: false,
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Configure third-party integrations',
    completed: false,
  },
  {
    id: 'review-generate',
    name: 'Review & Generate',
    description: 'Review configuration and generate project',
    completed: false,
  },
];

// Create project creation session
export const createSession = api(
  { method: "POST", path: "/projectwizard/session", expose: true },
  async ({ userId }: CreateSessionRequest): Promise<ProjectCreationSession> => {
    log.info("Create project creation session request", { userId });

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newSession: ProjectCreationSession = {
      id: sessionId,
      userId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      currentStep: 0,
      steps: [...defaultSteps],
      projectData: {},
      status: 'active',
    };

    try {
      // Store session in database
      await db.exec`
        INSERT INTO project_creation_sessions (
          id, user_id, created_at, updated_at, current_step, 
          steps, project_data, status
        ) VALUES (
          ${sessionId}, ${userId}, ${now}, ${now}, 
          ${newSession.currentStep}, ${JSON.stringify(newSession.steps)}, 
          ${JSON.stringify(newSession.projectData)}, ${newSession.status}
        )
      `;

      // Store individual steps
      for (const step of defaultSteps) {
        await db.exec`
          INSERT INTO project_creation_steps (
            id, session_id, step_id, name, description, completed, step_data
          ) VALUES (
            ${`${sessionId}-${step.id}`}, ${sessionId}, ${step.id}, 
            ${step.name}, ${step.description}, ${step.completed}, 
            ${JSON.stringify(step.data || {})}
          )
        `;
      }

      log.info("Project creation session created", { sessionId, userId });
      return newSession;
    } catch (error) {
      log.error("Failed to create project creation session", { error: (error as Error).message });
      throw APIError.internal("Failed to create session");
    }
  }
);

// Get project creation session
export const getSession = api(
  { method: "GET", path: "/projectwizard/session/:id", expose: true },
  async ({ id }: { id: string }): Promise<ProjectCreationSession> => {
    log.info("Get project creation session request", { sessionId: id });

    try {
      // Get session from database
      const sessionRow = await db.queryRow`
        SELECT * FROM project_creation_sessions WHERE id = ${id}
      `;

      if (!sessionRow) {
        throw APIError.notFound("Project creation session not found");
      }

      // Get steps from database
      const stepRows = await db.queryAll`
        SELECT * FROM project_creation_steps 
        WHERE session_id = ${id} 
        ORDER BY step_id
      `;

      const steps: ProjectCreationStep[] = stepRows.map(row => ({
        id: row.step_id,
        name: row.name,
        description: row.description,
        completed: row.completed,
        data: JSON.parse(row.step_data || '{}'),
        validation: row.validation_errors ? {
          isValid: JSON.parse(row.validation_errors).length === 0,
          errors: JSON.parse(row.validation_errors)
        } : undefined
      }));

      const session: ProjectCreationSession = {
        id: sessionRow.id,
        userId: sessionRow.user_id,
        createdAt: sessionRow.created_at.toISOString(),
        updatedAt: sessionRow.updated_at.toISOString(),
        currentStep: sessionRow.current_step,
        steps,
        projectData: JSON.parse(sessionRow.project_data || '{}'),
        status: sessionRow.status
      };

      return session;
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Failed to get project creation session", { error: (error as Error).message });
      throw APIError.internal("Failed to retrieve session");
    }
  }
);

// Update project creation session
export const updateSession = api(
  { method: "PUT", path: "/projectwizard/session/:id", expose: true },
  async ({ id, ...updates }: { id: string } & Partial<ProjectCreationSession>): Promise<ProjectCreationSession> => {
    log.info("Update project creation session request", { sessionId: id });

    try {
      // First get the current session
      const currentSession = await getSession({ id });
      
      const updatedSession: ProjectCreationSession = {
        ...currentSession,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Update session in database
      await db.exec`
        UPDATE project_creation_sessions 
        SET 
          current_step = ${updatedSession.currentStep},
          project_data = ${JSON.stringify(updatedSession.projectData)},
          status = ${updatedSession.status},
          updated_at = ${new Date()}
        WHERE id = ${id}
      `;

      log.info("Project creation session updated", { sessionId: id });
      return updatedSession;
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Failed to update project creation session", { error: (error as Error).message });
      throw APIError.internal("Failed to update session");
    }
  }
);

// Update project creation step
export const updateStep = api(
  { method: "PUT", path: "/projectwizard/session/:sessionId/step/:stepId", expose: true },
  async ({
    sessionId,
    stepId,
    data,
  }: {
    sessionId: string;
    stepId: string;
  } & UpdateStepRequest): Promise<ProjectCreationSession> => {
    log.info("Update project creation step request", { sessionId, stepId });

    try {
      // Update step in database
      await db.exec`
        UPDATE project_creation_steps 
        SET 
          step_data = ${JSON.stringify(data)},
          completed = true,
          updated_at = ${new Date()}
        WHERE session_id = ${sessionId} AND step_id = ${stepId}
      `;

      // Update session updated_at timestamp
      await db.exec`
        UPDATE project_creation_sessions 
        SET updated_at = ${new Date()}
        WHERE id = ${sessionId}
      `;

      log.info("Project creation step updated", { sessionId, stepId });

      // Return updated session
      return await getSession({ id: sessionId });
    } catch (error) {
      log.error("Failed to update project creation step", { error: (error as Error).message });
      throw APIError.internal("Failed to update step");
    }
  }
);

// Complete project creation session
export const complete = api(
  { method: "POST", path: "/projectwizard/session/:sessionId/complete", expose: true },
  async ({ sessionId }: { sessionId: string }): Promise<{
    projectFiles: Record<string, string>;
    deploymentInstructions: string[];
  }> => {
    log.info("Complete project creation request", { sessionId });

    try {
      const session = await getSession({ id: sessionId });

      // Mark all steps as completed in database
      await db.exec`
        UPDATE project_creation_steps 
        SET completed = true, updated_at = ${new Date()}
        WHERE session_id = ${sessionId}
      `;

      // Update session status
      await db.exec`
        UPDATE project_creation_sessions 
        SET status = 'completed', updated_at = ${new Date()}
        WHERE id = ${sessionId}
      `;

    // Mock project files generation
    const projectFiles = {
      "package.json": JSON.stringify({
        name: session.projectData.name || "my-project",
        version: "1.0.0",
        scripts: {
          dev: "encore run",
          build: "encore build",
          test: "vitest",
        },
        dependencies: {
          "encore.dev": "^1.49.0",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          typescript: "^5.0.0",
        }
      }, null, 2),
      "encore.app": JSON.stringify({
        id: session.projectData.name?.toLowerCase().replace(/\s+/g, '-') || 'my-project',
        lang: 'ts'
      }, null, 2),
      "backend/main.ts": `// ${session.projectData.name || 'My Project'} - Main Entry Point
// Generated by Vaporform Project Creation Modal

import "./api/api";

export const config = {
  name: "${session.projectData.name || 'My Project'}",
  description: "${session.projectData.description || 'A new project created with Vaporform'}"
};`,
      "backend/api/api.ts": `import { api } from "encore.dev/api";

// ${session.projectData.name || 'My Project'} API Service

export const hello = api(
  { method: "GET", path: "/api/hello", expose: true },
  async (): Promise<{ message: string }> => {
    return { message: "Hello from ${session.projectData.name || 'My Project'}!" };
  }
);`,
      "frontend/src/App.tsx": `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Welcome to ${session.projectData.name || 'My Project'}
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            ${session.projectData.description || 'A new project created with Vaporform'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;`,
      "README.md": `# ${session.projectData.name || 'My Project'}

${session.projectData.description || 'A new project created with Vaporform Project Creation Modal'}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open [http://localhost:4000](http://localhost:4000) to view the application.

## Generated by Vaporform

This project was generated using Vaporform's Project Creation Modal.
`
    };

    const deploymentInstructions = [
      "1. Install dependencies: npm install",
      "2. Set up environment variables",
      "3. Run tests: npm test",
      "4. Build production version: npm run build",
      "5. Deploy with Encore: git push encore",
      "6. Configure domain and SSL certificate",
      "7. Set up monitoring and analytics",
      "8. Test the deployed application"
    ];

    // Store generation results in database
    const resultId = `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.exec`
      INSERT INTO project_generation_results (
        id, session_id, project_name, generated_files, 
        deployment_instructions, template_used, 
        integrations_configured, generation_metadata
      ) VALUES (
        ${resultId}, ${sessionId}, 
        ${session.projectData.name || 'My Project'},
        ${JSON.stringify(projectFiles)},
        ${JSON.stringify(deploymentInstructions)},
        ${session.projectData.selectedTemplate || 'encore-react-ts'},
        ${JSON.stringify(session.projectData.integrations || [])},
        ${JSON.stringify({ completedAt: new Date().toISOString() })}
      )
    `;

    log.info("Project creation completed", { sessionId });

    return {
      projectFiles,
      deploymentInstructions,
    };
    } catch (error) {
      log.error("Failed to complete project creation", { error: (error as Error).message });
      throw APIError.internal("Failed to complete project creation");
    }
  }
);

// Get session status
export const getStatus = api(
  { method: "GET", path: "/projectwizard/status/:sessionId", expose: true },
  async ({ sessionId }: { sessionId: string }): Promise<{
    sessionId: string;
    status: string;
    currentStep: number;
    totalSteps: number;
    completedSteps: number;
  }> => {
    log.info("Get project creation status", { sessionId });

    try {
      const session = await getSession({ id: sessionId });
      const completedSteps = session.steps.filter(step => step.completed).length;

      return {
        sessionId: session.id,
        status: session.status,
        currentStep: session.currentStep,
        totalSteps: session.steps.length,
        completedSteps
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      log.error("Failed to get project creation status", { error: (error as Error).message });
      throw APIError.internal("Failed to get status");
    }
  }
);

// Delete/abandon session
export const deleteSession = api(
  { method: "DELETE", path: "/projectwizard/session/:id", expose: true },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    log.info("Delete project creation session request", { sessionId: id });

    try {
      // Update session status to abandoned instead of deleting
      await db.exec`
        UPDATE project_creation_sessions 
        SET status = 'abandoned', updated_at = ${new Date()}
        WHERE id = ${id}
      `;

      log.info("Project creation session abandoned", { sessionId: id });
      return { success: true };
    } catch (error) {
      log.error("Failed to abandon project creation session", { error: (error as Error).message });
      throw APIError.internal("Failed to abandon session");
    }
  }
);