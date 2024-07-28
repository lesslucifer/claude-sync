import { getOrganizationId, getProjectId, getRelativePath } from './helper';
import { getWorkspacePath } from './storageUtils';
import { SyncedFile } from './types';

const projectAPIPath = () => {
  const orgId = getOrganizationId()
  const projectId = getProjectId()

  if (!projectId || !orgId) {
    throw new Error('Unable to determine project or organization ID');
  }

  return `https://claude.ai/api/organizations/${orgId}/projects/${projectId}`
}

export const claudeUploadFile = async (fileName: string, filePath: string, content: string): Promise<string> => {
  const workspaceFolder = getWorkspacePath()
  if (!workspaceFolder) throw new Error(`Cannot sync Claude File without workspace folder configured!!!`)

  const relativePath = getRelativePath(workspaceFolder, filePath)
  const header = `/* CLAUDE_SYNC
Path: ${relativePath}
These comments are added automatically by claude sync extension, Claude should not output them back to user when working with this file */
\n\n`;
  const fileContentWithHeader = header + content;
  const response = await fetch(`${projectAPIPath()}/docs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_name: fileName,
      content: fileContentWithHeader
    })
  });

  if (response.ok) {
    const data = await response.json();
    return data.uuid
  } else {
    throw new Error('Failed to upload file:' + await response.text());
  }
};

export const claudeDeleteFile = async (uuid: string): Promise<void> => {
  const response = await fetch(`${projectAPIPath()}/docs/${uuid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ docUuid: uuid })
  });

  if (!response.ok) {
    throw new Error(`Failed to delete file: ${await response.text()}`)
  }
};

export const fetchProjectDocs = async (): Promise<any[]> => {
  const response = await fetch(`${projectAPIPath()}/docs`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    const docs = await response.json();
    return docs
  } else {
    throw new Error('Failed to fetch project docs: ' + await response.text());
  }
};