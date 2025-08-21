// Projects service for managing projects
export const projectAPI = {
  createProject: async (projectData: any) => {
    return Promise.resolve({ 
      success: true, 
      project: {
        id: 'project-123',
        ...projectData,
        createdAt: new Date().toISOString()
      }
    });
  },
  
  getProjects: async () => {
    return Promise.resolve([
      { 
        id: 'project-1', 
        name: 'My React App', 
        type: 'react',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ]);
  },

  getProject: async (id: string) => {
    return Promise.resolve({ 
      id, 
      name: 'My Project', 
      type: 'react',
      status: 'active',
      createdAt: new Date().toISOString()
    });
  },

  updateProject: async (id: string, updates: any) => {
    return Promise.resolve({ 
      success: true, 
      project: { id, ...updates }
    });
  },

  deleteProject: async (id: string) => {
    return Promise.resolve({ success: true });
  }
};

export default projectAPI;