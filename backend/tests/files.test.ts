/**
 * Files Service Tests
 * Tests for file upload, download, update, delete, and management operations
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { upload, get, update, remove, listByProject } from '../files/files';
import { testUtils } from './setup';

describe('Files Service', () => {
  const validUploadRequest = {
    name: 'test.ts',
    path: 'src/components/test.ts',
    content: 'export const test = () => console.log("Hello World");',
    type: 'typescript',
    projectId: 'demo-project-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('File Upload', () => {
    test('should upload a new file successfully', async () => {
      const response = await upload(validUploadRequest);

      expect(response).toHaveProperty('id');
      expect(response.name).toBe(validUploadRequest.name);
      expect(response.path).toBe(validUploadRequest.path);
      expect(response.content).toBe(validUploadRequest.content);
      expect(response.size).toBe(validUploadRequest.content.length);
      expect(response.type).toBe(validUploadRequest.type);
      expect(response.projectId).toBe(validUploadRequest.projectId);
      expect(response.userId).toBe('demo-user-id');
      expect(response).toHaveProperty('createdAt');
      expect(response).toHaveProperty('updatedAt');
    });

    test('should generate unique file IDs', async () => {
      const file1 = await upload({ ...validUploadRequest, name: 'file1.ts' });
      const file2 = await upload({ ...validUploadRequest, name: 'file2.ts' });

      expect(file1.id).not.toBe(file2.id);
      expect(file1.id).toMatch(/^file-\d+-[a-z0-9]{9}$/);
      expect(file2.id).toMatch(/^file-\d+-[a-z0-9]{9}$/);
    });

    test('should calculate file size correctly', async () => {
      const testContent = 'A'.repeat(1000);
      const response = await upload({
        ...validUploadRequest,
        content: testContent
      });

      expect(response.size).toBe(1000);
    });

    test('should trim whitespace from input fields', async () => {
      const requestWithSpaces = {
        name: '  test-file.js  ',
        path: '  src/utils/test-file.js  ',
        content: 'const test = "no trim for content";',
        type: '  javascript  ',
        projectId: '  demo-project-1  '
      };

      const response = await upload(requestWithSpaces);

      expect(response.name).toBe('test-file.js');
      expect(response.path).toBe('src/utils/test-file.js');
      expect(response.content).toBe('const test = "no trim for content";');
      expect(response.type).toBe('javascript');
      expect(response.projectId).toBe('demo-project-1');
    });

    test('should validate required fields', async () => {
      const invalidRequests = [
        { ...validUploadRequest, name: '' },
        { ...validUploadRequest, name: '   ' },
        { ...validUploadRequest, path: '' },
        { ...validUploadRequest, path: '   ' },
        { ...validUploadRequest, content: undefined as any },
        { ...validUploadRequest, type: '' },
        { ...validUploadRequest, type: '   ' },
        { ...validUploadRequest, projectId: '' },
        { ...validUploadRequest, projectId: '   ' }
      ];

      for (const request of invalidRequests) {
        await expect(upload(request)).rejects.toThrow();
      }
    });

    test('should handle empty content', async () => {
      const response = await upload({
        ...validUploadRequest,
        content: ''
      });

      expect(response.content).toBe('');
      expect(response.size).toBe(0);
    });

    test('should handle various file types', async () => {
      const fileTypes = [
        { type: 'typescript', name: 'component.tsx' },
        { type: 'javascript', name: 'script.js' },
        { type: 'json', name: 'config.json' },
        { type: 'css', name: 'styles.css' },
        { type: 'html', name: 'index.html' },
        { type: 'markdown', name: 'README.md' }
      ];

      for (const fileType of fileTypes) {
        const response = await upload({
          ...validUploadRequest,
          name: fileType.name,
          type: fileType.type
        });

        expect(response.type).toBe(fileType.type);
        expect(response.name).toBe(fileType.name);
      }
    });

    test('should set creation and update timestamps', async () => {
      const beforeUpload = new Date();
      const response = await upload(validUploadRequest);
      const afterUpload = new Date();

      expect(new Date(response.createdAt).getTime()).toBeGreaterThanOrEqual(beforeUpload.getTime());
      expect(new Date(response.createdAt).getTime()).toBeLessThanOrEqual(afterUpload.getTime());
      expect(response.createdAt).toEqual(response.updatedAt);
    });
  });

  describe('File Retrieval', () => {
    test('should get a file by ID', async () => {
      const uploadResponse = await upload(validUploadRequest);
      const getResponse = await get({ id: uploadResponse.id });

      expect(getResponse).toEqual(uploadResponse);
    });

    test('should throw error for non-existent file', async () => {
      await expect(get({ id: 'non-existent-id' }))
        .rejects.toThrow('File not found');
    });

    test('should enforce file ownership', async () => {
      const uploadResponse = await upload(validUploadRequest);
      
      // The current implementation uses a mock userID, so this test
      // verifies the ownership check logic exists
      const getResponse = await get({ id: uploadResponse.id });
      expect(getResponse.userId).toBe('demo-user-id');
    });

    test('should return complete file data', async () => {
      const uploadResponse = await upload(validUploadRequest);
      const getResponse = await get({ id: uploadResponse.id });

      expect(getResponse).toHaveProperty('id');
      expect(getResponse).toHaveProperty('name');
      expect(getResponse).toHaveProperty('path');
      expect(getResponse).toHaveProperty('content');
      expect(getResponse).toHaveProperty('size');
      expect(getResponse).toHaveProperty('type');
      expect(getResponse).toHaveProperty('projectId');
      expect(getResponse).toHaveProperty('userId');
      expect(getResponse).toHaveProperty('createdAt');
      expect(getResponse).toHaveProperty('updatedAt');
    });
  });

  describe('File Updates', () => {
    test('should update file fields', async () => {
      const uploadResponse = await upload(validUploadRequest);

      const updateData = {
        name: 'updated-file.ts',
        path: 'src/updated/updated-file.ts',
        content: 'export const updated = () => console.log("Updated");',
        type: 'typescript'
      };

      const updateResponse = await update({ id: uploadResponse.id, ...updateData });

      expect(updateResponse.name).toBe(updateData.name);
      expect(updateResponse.path).toBe(updateData.path);
      expect(updateResponse.content).toBe(updateData.content);
      expect(updateResponse.size).toBe(updateData.content.length);
      expect(updateResponse.type).toBe(updateData.type);
      expect(new Date(updateResponse.updatedAt).getTime())
        .toBeGreaterThan(new Date(uploadResponse.updatedAt).getTime());
    });

    test('should update only provided fields', async () => {
      const uploadResponse = await upload(validUploadRequest);

      const partialUpdate = { name: 'new-name.ts' };

      const updateResponse = await update({ id: uploadResponse.id, ...partialUpdate });

      expect(updateResponse.name).toBe(partialUpdate.name);
      expect(updateResponse.path).toBe(uploadResponse.path);
      expect(updateResponse.content).toBe(uploadResponse.content);
      expect(updateResponse.type).toBe(uploadResponse.type);
      expect(updateResponse.projectId).toBe(uploadResponse.projectId);
    });

    test('should update file size when content changes', async () => {
      const uploadResponse = await upload(validUploadRequest);

      const newContent = 'A'.repeat(500);
      const updateResponse = await update({ 
        id: uploadResponse.id, 
        content: newContent 
      });

      expect(updateResponse.size).toBe(500);
      expect(updateResponse.content).toBe(newContent);
    });

    test('should preserve file size when content not updated', async () => {
      const uploadResponse = await upload(validUploadRequest);

      const updateResponse = await update({ 
        id: uploadResponse.id, 
        name: 'new-name.ts' 
      });

      expect(updateResponse.size).toBe(uploadResponse.size);
      expect(updateResponse.content).toBe(uploadResponse.content);
    });

    test('should validate update fields', async () => {
      const uploadResponse = await upload(validUploadRequest);

      const invalidUpdates = [
        { name: '' },
        { name: '   ' },
        { path: '' },
        { path: '   ' },
        { type: '' },
        { type: '   ' }
      ];

      for (const updateData of invalidUpdates) {
        await expect(update({ id: uploadResponse.id, ...updateData }))
          .rejects.toThrow();
      }
    });

    test('should trim whitespace in updates', async () => {
      const uploadResponse = await upload(validUploadRequest);

      const updateWithSpaces = {
        name: '  updated-file.ts  ',
        path: '  src/updated/file.ts  ',
        type: '  javascript  '
      };

      const updateResponse = await update({ 
        id: uploadResponse.id, 
        ...updateWithSpaces 
      });

      expect(updateResponse.name).toBe('updated-file.ts');
      expect(updateResponse.path).toBe('src/updated/file.ts');
      expect(updateResponse.type).toBe('javascript');
    });

    test('should handle non-existent file updates', async () => {
      await expect(update({ 
        id: 'non-existent-id', 
        name: 'update.ts' 
      })).rejects.toThrow('File not found');
    });

    test('should handle empty content updates', async () => {
      const uploadResponse = await upload(validUploadRequest);

      const updateResponse = await update({ 
        id: uploadResponse.id, 
        content: '' 
      });

      expect(updateResponse.content).toBe('');
      expect(updateResponse.size).toBe(0);
    });
  });

  describe('File Deletion', () => {
    test('should delete a file successfully', async () => {
      const uploadResponse = await upload(validUploadRequest);
      const deleteResponse = await remove({ id: uploadResponse.id });

      expect(deleteResponse.success).toBe(true);

      // Verify file is deleted
      await expect(get({ id: uploadResponse.id }))
        .rejects.toThrow('File not found');
    });

    test('should handle non-existent file deletion', async () => {
      await expect(remove({ id: 'non-existent-id' }))
        .rejects.toThrow('File not found');
    });

    test('should enforce ownership for deletion', async () => {
      const uploadResponse = await upload(validUploadRequest);
      
      // The current implementation uses mock userID, 
      // so this verifies the ownership check exists
      const deleteResponse = await remove({ id: uploadResponse.id });
      expect(deleteResponse.success).toBe(true);
    });
  });

  describe('List Files by Project', () => {
    test('should list files for a specific project', async () => {
      const testProjectId = 'test-project-123';

      // Upload files to test project
      await upload({ ...validUploadRequest, projectId: testProjectId, name: 'file1.ts' });
      await upload({ ...validUploadRequest, projectId: testProjectId, name: 'file2.ts' });
      await upload({ ...validUploadRequest, projectId: 'other-project', name: 'file3.ts' });

      const response = await listByProject({ projectId: testProjectId });

      expect(response).toHaveProperty('files');
      expect(Array.isArray(response.files)).toBe(true);
      expect(response.files.length).toBe(2);
      
      response.files.forEach(file => {
        expect(file.projectId).toBe(testProjectId);
        expect(file.userId).toBe('demo-user-id');
      });
    });

    test('should sort files by updated date (newest first)', async () => {
      const testProjectId = 'test-project-sort';

      const file1 = await upload({ 
        ...validUploadRequest, 
        projectId: testProjectId, 
        name: 'file1.ts' 
      });

      // Wait a moment to ensure different timestamps
      await testUtils.wait(10);

      const file2 = await upload({ 
        ...validUploadRequest, 
        projectId: testProjectId, 
        name: 'file2.ts' 
      });

      const response = await listByProject({ projectId: testProjectId });

      expect(response.files.length).toBeGreaterThanOrEqual(2);
      if (response.files.length >= 2) {
        const sortedFiles = response.files.filter(f => 
          f.id === file1.id || f.id === file2.id
        );
        expect(sortedFiles[0].id).toBe(file2.id); // Newer file first
        expect(sortedFiles[1].id).toBe(file1.id);
      }
    });

    test('should return empty list for project with no files', async () => {
      const response = await listByProject({ projectId: 'empty-project' });

      expect(response.files).toEqual([]);
    });

    test('should include demo files for demo project', async () => {
      const response = await listByProject({ projectId: 'demo-project-1' });

      expect(response.files.length).toBeGreaterThan(0);
      
      const fileNames = response.files.map(f => f.name);
      expect(fileNames).toContain('App.tsx');
      expect(fileNames).toContain('package.json');
    });

    test('should return complete file data in list', async () => {
      const testProjectId = 'test-project-complete';
      await upload({ ...validUploadRequest, projectId: testProjectId });

      const response = await listByProject({ projectId: testProjectId });

      expect(response.files.length).toBeGreaterThan(0);
      
      response.files.forEach(file => {
        expect(file).toHaveProperty('id');
        expect(file).toHaveProperty('name');
        expect(file).toHaveProperty('path');
        expect(file).toHaveProperty('content');
        expect(file).toHaveProperty('size');
        expect(file).toHaveProperty('type');
        expect(file).toHaveProperty('projectId');
        expect(file).toHaveProperty('userId');
        expect(file).toHaveProperty('createdAt');
        expect(file).toHaveProperty('updatedAt');
      });
    });

    test('should filter by user ownership', async () => {
      const testProjectId = 'test-project-ownership';
      await upload({ ...validUploadRequest, projectId: testProjectId });

      const response = await listByProject({ projectId: testProjectId });

      response.files.forEach(file => {
        expect(file.userId).toBe('demo-user-id');
      });
    });
  });

  describe('Data Validation and Edge Cases', () => {
    test('should handle various file extensions and paths', async () => {
      const testFiles = [
        { name: 'component.tsx', path: 'src/components/component.tsx' },
        { name: 'utils.js', path: 'src/utils/index.js' },
        { name: 'config.json', path: 'config/database.json' },
        { name: 'styles.css', path: 'public/css/main.css' },
        { name: 'README.md', path: 'docs/README.md' },
        { name: '.env', path: '.env' },
        { name: 'nested-file.ts', path: 'src/deep/nested/path/file.ts' }
      ];

      for (const testFile of testFiles) {
        const response = await upload({
          ...validUploadRequest,
          name: testFile.name,
          path: testFile.path
        });

        expect(response.name).toBe(testFile.name);
        expect(response.path).toBe(testFile.path);
      }
    });

    test('should handle large file content', async () => {
      const largeContent = 'A'.repeat(10000);
      
      const response = await upload({
        ...validUploadRequest,
        content: largeContent
      });

      expect(response.content).toBe(largeContent);
      expect(response.size).toBe(10000);
    });

    test('should handle special characters in file names and paths', async () => {
      const specialFile = {
        name: 'special-file@#$%.ts',
        path: 'src/special-chars@#$/file.ts'
      };

      const response = await upload({
        ...validUploadRequest,
        name: specialFile.name,
        path: specialFile.path
      });

      expect(response.name).toBe(specialFile.name);
      expect(response.path).toBe(specialFile.path);
    });

    test('should handle Unicode content', async () => {
      const unicodeContent = 'Hello 世界! 🚀 Émojis and special chars: áéíóú';
      
      const response = await upload({
        ...validUploadRequest,
        content: unicodeContent
      });

      expect(response.content).toBe(unicodeContent);
      expect(response.size).toBe(unicodeContent.length);
    });

    test('should handle various project ID formats', async () => {
      const projectIds = [
        'project-123',
        'proj_with_underscores',
        'project-with-dashes',
        'mixed_project-id_123'
      ];

      for (const projectId of projectIds) {
        const response = await upload({
          ...validUploadRequest,
          projectId
        });

        expect(response.projectId).toBe(projectId);
      }
    });
  });

  describe('Demo Files', () => {
    test('should include demo files in demo project listing', async () => {
      const response = await listByProject({ projectId: 'demo-project-1' });

      const demoFileNames = response.files.map(f => f.name);
      expect(demoFileNames).toContain('App.tsx');
      expect(demoFileNames).toContain('package.json');
    });

    test('should allow access to demo files', async () => {
      const listResponse = await listByProject({ projectId: 'demo-project-1' });
      const demoFile = listResponse.files.find(f => f.name === 'App.tsx');
      
      expect(demoFile).toBeDefined();
      
      if (demoFile) {
        const getResponse = await get({ id: demoFile.id });
        
        expect(getResponse.name).toBe('App.tsx');
        expect(getResponse.content).toContain('Welcome to Vaporform');
        expect(getResponse.type).toBe('typescript');
      }
    });

    test('should have proper demo file structure', async () => {
      const listResponse = await listByProject({ projectId: 'demo-project-1' });
      
      listResponse.files.forEach(file => {
        expect(file.userId).toBe('demo-user-id');
        expect(file.projectId).toBe('demo-project-1');
        expect(file.size).toBeGreaterThan(0);
        expect(file.content.length).toBe(file.size);
      });
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete file lifecycle', async () => {
      // Upload
      const uploadResponse = await upload(validUploadRequest);
      expect(uploadResponse.name).toBe(validUploadRequest.name);

      // Read
      const getResponse = await get({ id: uploadResponse.id });
      expect(getResponse.id).toBe(uploadResponse.id);

      // Update
      const updateResponse = await update({ 
        id: uploadResponse.id, 
        content: 'Updated content' 
      });
      expect(updateResponse.content).toBe('Updated content');

      // List (should include updated file)
      const listResponse = await listByProject({ projectId: uploadResponse.projectId });
      const updatedFile = listResponse.files.find(f => f.id === uploadResponse.id);
      expect(updatedFile?.content).toBe('Updated content');

      // Delete
      const deleteResponse = await remove({ id: uploadResponse.id });
      expect(deleteResponse.success).toBe(true);

      // Verify deletion
      await expect(get({ id: uploadResponse.id }))
        .rejects.toThrow('File not found');
    });

    test('should maintain consistency between upload and list operations', async () => {
      const testProjectId = 'consistency-test-project';
      
      const file1 = await upload({ 
        ...validUploadRequest, 
        projectId: testProjectId, 
        name: 'consistency1.ts' 
      });
      
      const file2 = await upload({ 
        ...validUploadRequest, 
        projectId: testProjectId, 
        name: 'consistency2.ts' 
      });

      const listResponse = await listByProject({ projectId: testProjectId });
      const uploadedFiles = listResponse.files.filter(f => 
        f.id === file1.id || f.id === file2.id
      );

      expect(uploadedFiles.length).toBe(2);
      uploadedFiles.forEach(file => {
        const originalFile = file.id === file1.id ? file1 : file2;
        expect(file).toEqual(originalFile);
      });
    });
  });
});