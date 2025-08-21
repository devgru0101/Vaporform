/**
 * Projects Service Tests
 * Tests for project CRUD operations, permissions, and validation
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { list, get, create, update, remove, getFiles } from '../projects/projects';
import { testUtils } from './setup';

describe('Projects Service', () => {
  const mockAuthData = {
    userID: 'demo-user-id',
    email: 'demo@vaporform.com',
    role: 'user'
  };

  const validCreateRequest = {
    name: 'Test Project',
    description: 'A test project for unit testing',
    type: 'web' as const,
    framework: 'React',
    language: 'TypeScript'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Project Creation', () => {
    test('should create a new project successfully', async () => {
      const response = await create(validCreateRequest);

      expect(response).toHaveProperty('id');
      expect(response.name).toBe(validCreateRequest.name);
      expect(response.description).toBe(validCreateRequest.description);
      expect(response.type).toBe(validCreateRequest.type);
      expect(response.framework).toBe(validCreateRequest.framework);
      expect(response.language).toBe(validCreateRequest.language);
      expect(response.userId).toBe('demo-user-id');
      expect(response.status).toBe('active');
      expect(response).toHaveProperty('createdAt');
      expect(response).toHaveProperty('updatedAt');
    });

    test('should generate unique project IDs', async () => {
      const project1 = await create({ ...validCreateRequest, name: 'Project 1' });
      const project2 = await create({ ...validCreateRequest, name: 'Project 2' });

      expect(project1.id).not.toBe(project2.id);
      expect(project1.id).toMatch(/^proj-\d+-[a-z0-9]{9}$/);
      expect(project2.id).toMatch(/^proj-\d+-[a-z0-9]{9}$/);
    });

    test('should trim whitespace from input fields', async () => {
      const requestWithSpaces = {
        name: '  Test Project  ',
        description: '  A test description  ',
        type: 'web' as const,
        framework: '  React  ',
        language: '  TypeScript  '
      };

      const response = await create(requestWithSpaces);

      expect(response.name).toBe('Test Project');
      expect(response.description).toBe('A test description');
      expect(response.framework).toBe('React');
      expect(response.language).toBe('TypeScript');
    });

    test('should handle missing optional description', async () => {
      const requestWithoutDescription = {
        name: 'Test Project',
        type: 'api' as const,
        framework: 'Express',
        language: 'JavaScript'
      };

      const response = await create(requestWithoutDescription);

      expect(response.description).toBe('');
      expect(response.name).toBe(requestWithoutDescription.name);
    });

    test('should validate required fields', async () => {
      const invalidRequests = [
        { ...validCreateRequest, name: '' },
        { ...validCreateRequest, name: '   ' },
        { ...validCreateRequest, type: 'invalid' as any },
        { ...validCreateRequest, framework: '' },
        { ...validCreateRequest, framework: '   ' },
        { ...validCreateRequest, language: '' },
        { ...validCreateRequest, language: '   ' }
      ];

      for (const request of invalidRequests) {
        await expect(create(request)).rejects.toThrow();
      }
    });

    test('should validate project type enum', async () => {
      const validTypes = ['web', 'mobile', 'api', 'library'];
      
      for (const type of validTypes) {
        const response = await create({ ...validCreateRequest, type: type as any });
        expect(response.type).toBe(type);
      }

      await expect(create({ ...validCreateRequest, type: 'invalid' as any }))
        .rejects.toThrow('Type must be one of: web, mobile, api, library');
    });

    test('should set creation and update timestamps', async () => {
      const beforeCreate = new Date();
      const response = await create(validCreateRequest);
      const afterCreate = new Date();

      expect(new Date(response.createdAt).getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(new Date(response.createdAt).getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(response.createdAt).toEqual(response.updatedAt);
    });
  });

  describe('Project Listing', () => {
    test('should list all user projects', async () => {
      // Create a few test projects
      await create({ ...validCreateRequest, name: 'Project 1' });
      await create({ ...validCreateRequest, name: 'Project 2' });

      const response = await list();

      expect(response).toHaveProperty('projects');
      expect(Array.isArray(response.projects)).toBe(true);
      expect(response.projects.length).toBeGreaterThanOrEqual(2); // Including demo projects
      
      // Check that demo projects are included
      const projectNames = response.projects.map(p => p.name);
      expect(projectNames).toContain('E-commerce Platform');
      expect(projectNames).toContain('Mobile Chat App');
    });

    test('should sort projects by updated date (newest first)', async () => {
      const response = await list();

      if (response.projects.length > 1) {
        for (let i = 0; i < response.projects.length - 1; i++) {
          const current = new Date(response.projects[i].updatedAt);
          const next = new Date(response.projects[i + 1].updatedAt);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });

    test('should return projects with complete information', async () => {
      const response = await list();

      expect(response.projects.length).toBeGreaterThan(0);
      
      response.projects.forEach(project => {
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('type');
        expect(project).toHaveProperty('framework');
        expect(project).toHaveProperty('language');
        expect(project).toHaveProperty('userId');
        expect(project).toHaveProperty('createdAt');
        expect(project).toHaveProperty('updatedAt');
        expect(project).toHaveProperty('status');
      });
    });

    test('should filter projects by user ID', async () => {
      const response = await list();

      response.projects.forEach(project => {
        expect(project.userId).toBe('demo-user-id');
      });
    });
  });

  describe('Project Retrieval', () => {
    test('should get a project by ID', async () => {
      const createResponse = await create(validCreateRequest);
      
      const mockMeta = { auth: mockAuthData };
      const getResponse = await get({ id: createResponse.id }, mockMeta as any);

      expect(getResponse.id).toBe(createResponse.id);
      expect(getResponse.name).toBe(createResponse.name);
      expect(getResponse.type).toBe(createResponse.type);
    });

    test('should throw error for non-existent project', async () => {
      const mockMeta = { auth: mockAuthData };
      
      await expect(get({ id: 'non-existent-id' }, mockMeta as any))
        .rejects.toThrow('Project not found');
    });

    test('should enforce project ownership', async () => {
      const createResponse = await create(validCreateRequest);
      
      const otherUserAuth = { 
        userID: 'other-user-id', 
        email: 'other@example.com', 
        role: 'user' 
      };
      const mockMeta = { auth: otherUserAuth };

      await expect(get({ id: createResponse.id }, mockMeta as any))
        .rejects.toThrow('Access denied');
    });

    test('should return complete project data', async () => {
      const createResponse = await create(validCreateRequest);
      const mockMeta = { auth: mockAuthData };
      const getResponse = await get({ id: createResponse.id }, mockMeta as any);

      expect(getResponse).toEqual(createResponse);
    });
  });

  describe('Project Updates', () => {
    test('should update project fields', async () => {
      const createResponse = await create(validCreateRequest);
      const mockMeta = { auth: mockAuthData };

      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated description',
        status: 'archived' as const
      };

      const updateResponse = await update(
        { id: createResponse.id, ...updateData }, 
        mockMeta as any
      );

      expect(updateResponse.name).toBe(updateData.name);
      expect(updateResponse.description).toBe(updateData.description);
      expect(updateResponse.status).toBe(updateData.status);
      expect(new Date(updateResponse.updatedAt).getTime())
        .toBeGreaterThan(new Date(createResponse.updatedAt).getTime());
    });

    test('should update only provided fields', async () => {
      const createResponse = await create(validCreateRequest);
      const mockMeta = { auth: mockAuthData };

      const partialUpdate = { name: 'New Name Only' };

      const updateResponse = await update(
        { id: createResponse.id, ...partialUpdate }, 
        mockMeta as any
      );

      expect(updateResponse.name).toBe(partialUpdate.name);
      expect(updateResponse.description).toBe(createResponse.description);
      expect(updateResponse.type).toBe(createResponse.type);
      expect(updateResponse.framework).toBe(createResponse.framework);
      expect(updateResponse.language).toBe(createResponse.language);
    });

    test('should validate update fields', async () => {
      const createResponse = await create(validCreateRequest);
      const mockMeta = { auth: mockAuthData };

      const invalidUpdates = [
        { name: '' },
        { name: '   ' },
        { type: 'invalid' as any },
        { framework: '' },
        { language: '' },
        { status: 'invalid' as any }
      ];

      for (const updateData of invalidUpdates) {
        await expect(update(
          { id: createResponse.id, ...updateData }, 
          mockMeta as any
        )).rejects.toThrow();
      }
    });

    test('should trim whitespace in updates', async () => {
      const createResponse = await create(validCreateRequest);
      const mockMeta = { auth: mockAuthData };

      const updateWithSpaces = {
        name: '  Updated Name  ',
        description: '  Updated Description  ',
        framework: '  Vue.js  ',
        language: '  JavaScript  '
      };

      const updateResponse = await update(
        { id: createResponse.id, ...updateWithSpaces }, 
        mockMeta as any
      );

      expect(updateResponse.name).toBe('Updated Name');
      expect(updateResponse.description).toBe('Updated Description');
      expect(updateResponse.framework).toBe('Vue.js');
      expect(updateResponse.language).toBe('JavaScript');
    });

    test('should enforce ownership for updates', async () => {
      const createResponse = await create(validCreateRequest);
      
      const otherUserAuth = { 
        userID: 'other-user-id', 
        email: 'other@example.com', 
        role: 'user' 
      };
      const mockMeta = { auth: otherUserAuth };

      await expect(update(
        { id: createResponse.id, name: 'Unauthorized Update' }, 
        mockMeta as any
      )).rejects.toThrow('Access denied');
    });

    test('should handle non-existent project updates', async () => {
      const mockMeta = { auth: mockAuthData };

      await expect(update(
        { id: 'non-existent-id', name: 'Update' }, 
        mockMeta as any
      )).rejects.toThrow('Project not found');
    });

    test('should validate status enum values', async () => {
      const createResponse = await create(validCreateRequest);
      const mockMeta = { auth: mockAuthData };

      const validStatuses = ['active', 'archived', 'template'];
      
      for (const status of validStatuses) {
        const updateResponse = await update(
          { id: createResponse.id, status: status as any }, 
          mockMeta as any
        );
        expect(updateResponse.status).toBe(status);
      }
    });
  });

  describe('Project Deletion', () => {
    test('should delete a project successfully', async () => {
      const createResponse = await create(validCreateRequest);
      const mockMeta = { auth: mockAuthData };

      const deleteResponse = await remove({ id: createResponse.id }, mockMeta as any);

      expect(deleteResponse.success).toBe(true);

      // Verify project is deleted
      await expect(get({ id: createResponse.id }, mockMeta as any))
        .rejects.toThrow('Project not found');
    });

    test('should enforce ownership for deletion', async () => {
      const createResponse = await create(validCreateRequest);
      
      const otherUserAuth = { 
        userID: 'other-user-id', 
        email: 'other@example.com', 
        role: 'user' 
      };
      const mockMeta = { auth: otherUserAuth };

      await expect(remove({ id: createResponse.id }, mockMeta as any))
        .rejects.toThrow('Access denied');
    });

    test('should handle non-existent project deletion', async () => {
      const mockMeta = { auth: mockAuthData };

      await expect(remove({ id: 'non-existent-id' }, mockMeta as any))
        .rejects.toThrow('Project not found');
    });
  });

  describe('Project Files', () => {
    test('should get project files', async () => {
      const createResponse = await create(validCreateRequest);
      const mockMeta = { auth: mockAuthData };

      const filesResponse = await getFiles({ id: createResponse.id }, mockMeta as any);

      expect(filesResponse).toHaveProperty('files');
      expect(Array.isArray(filesResponse.files)).toBe(true);
      expect(filesResponse.files.length).toBeGreaterThan(0);
      expect(filesResponse.files).toContain('src/index.ts');
      expect(filesResponse.files).toContain('package.json');
    });

    test('should enforce ownership for file access', async () => {
      const createResponse = await create(validCreateRequest);
      
      const otherUserAuth = { 
        userID: 'other-user-id', 
        email: 'other@example.com', 
        role: 'user' 
      };
      const mockMeta = { auth: otherUserAuth };

      await expect(getFiles({ id: createResponse.id }, mockMeta as any))
        .rejects.toThrow('Access denied');
    });

    test('should handle non-existent project files request', async () => {
      const mockMeta = { auth: mockAuthData };

      await expect(getFiles({ id: 'non-existent-id' }, mockMeta as any))
        .rejects.toThrow('Project not found');
    });

    test('should return consistent mock files', async () => {
      const createResponse = await create(validCreateRequest);
      const mockMeta = { auth: mockAuthData };

      const filesResponse1 = await getFiles({ id: createResponse.id }, mockMeta as any);
      const filesResponse2 = await getFiles({ id: createResponse.id }, mockMeta as any);

      expect(filesResponse1.files).toEqual(filesResponse2.files);
    });
  });

  describe('Data Validation and Edge Cases', () => {
    test('should handle various project types and frameworks', async () => {
      const projectVariations = [
        { type: 'web', framework: 'React', language: 'TypeScript' },
        { type: 'mobile', framework: 'React Native', language: 'JavaScript' },
        { type: 'api', framework: 'Express', language: 'Node.js' },
        { type: 'library', framework: 'Webpack', language: 'TypeScript' }
      ];

      for (const variation of projectVariations) {
        const response = await create({
          name: `Test ${variation.type} Project`,
          description: `A ${variation.type} project`,
          type: variation.type as any,
          framework: variation.framework,
          language: variation.language
        });

        expect(response.type).toBe(variation.type);
        expect(response.framework).toBe(variation.framework);
        expect(response.language).toBe(variation.language);
      }
    });

    test('should handle very long project names and descriptions', async () => {
      const longName = 'A'.repeat(100);
      const longDescription = 'B'.repeat(1000);

      const response = await create({
        ...validCreateRequest,
        name: longName,
        description: longDescription
      });

      expect(response.name).toBe(longName);
      expect(response.description).toBe(longDescription);
    });

    test('should handle special characters in project data', async () => {
      const specialProject = {
        name: 'Project with Special Characters !@#$%^&*()',
        description: 'Description with émojis 🚀 and symbols <>&"',
        type: 'web' as const,
        framework: 'React/Redux',
        language: 'TypeScript/JavaScript'
      };

      const response = await create(specialProject);

      expect(response.name).toBe(specialProject.name);
      expect(response.description).toBe(specialProject.description);
      expect(response.framework).toBe(specialProject.framework);
      expect(response.language).toBe(specialProject.language);
    });
  });

  describe('Demo Projects', () => {
    test('should include demo projects in listing', async () => {
      const response = await list();

      const demoProjectNames = response.projects.map(p => p.name);
      expect(demoProjectNames).toContain('E-commerce Platform');
      expect(demoProjectNames).toContain('Mobile Chat App');
    });

    test('should allow access to demo projects', async () => {
      const listResponse = await list();
      const demoProject = listResponse.projects.find(p => p.name === 'E-commerce Platform');
      
      expect(demoProject).toBeDefined();
      
      if (demoProject) {
        const mockMeta = { auth: mockAuthData };
        const getResponse = await get({ id: demoProject.id }, mockMeta as any);
        
        expect(getResponse.name).toBe('E-commerce Platform');
        expect(getResponse.type).toBe('web');
        expect(getResponse.framework).toBe('React');
      }
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete project lifecycle', async () => {
      // Create
      const createResponse = await create(validCreateRequest);
      expect(createResponse.name).toBe(validCreateRequest.name);

      // Read
      const mockMeta = { auth: mockAuthData };
      const getResponse = await get({ id: createResponse.id }, mockMeta as any);
      expect(getResponse.id).toBe(createResponse.id);

      // Update
      const updateResponse = await update(
        { id: createResponse.id, name: 'Updated Name' }, 
        mockMeta as any
      );
      expect(updateResponse.name).toBe('Updated Name');

      // List (should include updated project)
      const listResponse = await list();
      const updatedProject = listResponse.projects.find(p => p.id === createResponse.id);
      expect(updatedProject?.name).toBe('Updated Name');

      // Delete
      const deleteResponse = await remove({ id: createResponse.id }, mockMeta as any);
      expect(deleteResponse.success).toBe(true);

      // Verify deletion
      await expect(get({ id: createResponse.id }, mockMeta as any))
        .rejects.toThrow('Project not found');
    });
  });
});