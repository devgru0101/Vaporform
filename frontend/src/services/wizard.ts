// Wizard service for project creation flow
export const wizardAPI = {
  createProject: async (projectData: any) => {
    return Promise.resolve({ 
      success: true, 
      projectId: 'project-123',
      ...projectData 
    });
  },
  
  getTemplates: async () => {
    return Promise.resolve([
      { id: 'react', name: 'React App', description: 'React with TypeScript' },
      { id: 'vue', name: 'Vue App', description: 'Vue.js with TypeScript' },
      { id: 'node', name: 'Node.js API', description: 'Express.js API server' }
    ]);
  },

  validateProject: async (projectData: any) => {
    return Promise.resolve({ valid: true, errors: [] });
  },

  deployProject: async (projectId: string) => {
    return Promise.resolve({ 
      success: true, 
      deploymentUrl: 'https://example.com',
      status: 'deployed' 
    });
  }
};

export default wizardAPI;