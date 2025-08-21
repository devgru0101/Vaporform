// Containers service for Docker container management
export const containerAPI = {
  createContainer: async (containerData: any) => {
    return Promise.resolve({ 
      success: true, 
      container: {
        id: 'container-123',
        ...containerData,
        status: 'running',
        createdAt: new Date().toISOString()
      }
    });
  },
  
  getContainers: async () => {
    return Promise.resolve([
      { 
        id: 'container-1', 
        name: 'web-app', 
        image: 'node:18',
        status: 'running',
        createdAt: new Date().toISOString()
      }
    ]);
  },

  getContainer: async (id: string) => {
    return Promise.resolve({ 
      id, 
      name: 'web-app', 
      image: 'node:18',
      status: 'running',
      createdAt: new Date().toISOString()
    });
  },

  startContainer: async (id: string) => {
    return Promise.resolve({ success: true, status: 'running' });
  },

  stopContainer: async (id: string) => {
    return Promise.resolve({ success: true, status: 'stopped' });
  },

  deleteContainer: async (id: string) => {
    return Promise.resolve({ success: true });
  },

  getLogs: async (id: string) => {
    return Promise.resolve({ 
      logs: 'Container starting...\nApplication ready on port 3000\n' 
    });
  }
};

export default containerAPI;