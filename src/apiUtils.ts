import { SyncedFile } from './types';
import { removeSyncedFile, storeSyncedFile } from './storageUtils';
import { addFileElement, removeFileFromUI } from './components/FileList';
import * as path from 'path';

export const API_PORT = 38451;

export const getOrganizationId = (): string | null => {
  const scripts = document.getElementsByTagName('script');
  for (const script of scripts) {
    const content = script.textContent || script.innerText;
    const match = content.match(/\\"memberships\\":\[\{\\"organization\\":\{\\"uuid\\":\\"([^\\"]+)\\"/);
    if (match && match[1]) {
      return match[1];
    }
  }
  console.error('Unable to find organization ID in page scripts');
  return null;
};

export const selectAndUploadFile = async (): Promise<void> => {
  try {
    const response = await fetch(`http://127.0.0.1:${API_PORT}/open-file`);
    if (!response.ok) {
      throw new Error('Failed to open file');
    }
    const { fileName, fileContent, filePath } = await response.json();
    await uploadFileContent(fileName, fileContent, filePath);
  } catch (error) {
    console.error('Error selecting and uploading file:', error);
  }
};

const uploadFileContent = async (fileName: string, content: string, filePath: string): Promise<void> => {
  const projectId = window.location.pathname.split('/').pop();
  const orgId = getOrganizationId();

  if (!projectId || !orgId) {
    console.error('Unable to determine project or organization ID');
    return;
  }

  try {
    const response = await fetch(`https://claude.ai/api/organizations/${orgId}/projects/${projectId}/docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: fileName,
        content: content
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('File uploaded successfully');
      const syncedFile: SyncedFile = {
        uuid: data.uuid,
        fileName: data.file_name,
        lastUpdated: data.created_at,
        filePath: filePath,
        status: 'synced'
      };

      addFileElement(syncedFile);
      storeSyncedFile(syncedFile);
    } else {
      console.error('Failed to upload file:', await response.text());
    }
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

export const deleteFile = async (uuid: string): Promise<void> => {
  const projectId = window.location.pathname.split('/').pop();
  const orgId = getOrganizationId();

  if (!projectId || !orgId) {
    console.error('Unable to determine project or organization ID');
    return;
  }

  try {
    const response = await fetch(`https://claude.ai/api/organizations/${orgId}/projects/${projectId}/docs/${uuid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Add other headers as needed
      },
      body: JSON.stringify({ docUuid: uuid })
    });

    if (response.ok) {
      console.log('File deleted successfully');
      removeSyncedFile(uuid);
      removeFileFromUI(uuid);
    } else {
      console.error('Failed to delete file:', await response.text());
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

export const resyncFile = async (file: SyncedFile): Promise<void> => {
  try {
    const response = await fetch(`http://localhost:${API_PORT}/read-file?path=${encodeURIComponent(file.filePath)}`);
    if (!response.ok) {
      throw new Error('Failed to read file');
    }
    const data = await response.json();

    if (!data.exists) {
      await deleteFile(file.uuid);
      return;
    }

    await uploadFileContent(file.fileName, data.fileContent, file.filePath);
  } catch (error) {
    console.error('Error resyncing file:', error);
  }
};

