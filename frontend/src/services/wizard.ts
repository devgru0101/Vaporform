// API Configuration
const API_BASE_URL = 'http://192.168.1.235:4001';

// Wizard service for project creation flow
export const wizardAPI = {
  createSession: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create wizard session: ${response.statusText}`);
    }
    return response.json();
  },

  getSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to get wizard session: ${response.statusText}`);
    }
    return response.json();
  },

  updateSession: async (sessionId: string, updates: any) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`Failed to update wizard session: ${response.statusText}`);
    }
    return response.json();
  },

  analyzeProject: async (requirements: any) => {
    const response = await fetch(`${API_BASE_URL}/wizard/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: requirements.description,
        preferences: requirements,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to analyze project: ${response.statusText}`);
    }
    return response.json();
  },

  updateStep: async (sessionId: string, stepId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session/${sessionId}/step/${stepId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update wizard step: ${response.statusText}`);
    }
    return response.json();
  },

  generatePreview: async (sessionId: string, stepId: string) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session/${sessionId}/preview/${stepId}`);
    if (!response.ok) {
      throw new Error(`Failed to generate preview: ${response.statusText}`);
    }
    return response.json();
  },

  completeWizard: async (sessionId: string) => {
    const response = await fetch(`${API_BASE_URL}/wizard/session/${sessionId}/complete`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to complete wizard: ${response.statusText}`);
    }
    return response.json();
  },
  
  getTemplates: async () => {
    const response = await fetch(`${API_BASE_URL}/wizard/templates`);
    if (!response.ok) {
      throw new Error(`Failed to get templates: ${response.statusText}`);
    }
    return response.json();
  },

  validateProject: async (projectData: any) => {
    // This could be enhanced to call a backend validation endpoint
    return Promise.resolve({ valid: true, errors: [] });
  },

  deployProject: async (projectId: string) => {
    // This would integrate with actual deployment services
    return Promise.resolve({ 
      success: true, 
      deploymentUrl: 'https://example.com',
      status: 'deployed' 
    });
  }
};

export default wizardAPI;