import { SyncedFile } from './types';
import { removeSyncedFile, storeSyncedFile } from './storageUtils';
import { addFileElement, removeFileFromUI } from './components/FileList';

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

export const uploadFile = async (file: File): Promise<void> => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = e.target?.result as string;
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
          // Add other headers as needed
        },
        body: JSON.stringify({
          file_name: file.name,
          content: content
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('File uploaded successfully');
        const syncedFile: SyncedFile = {
          uuid: data.uuid,
          fileName: data.file_name,
          lastUpdated: data.created_at
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

  reader.readAsText(file);
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