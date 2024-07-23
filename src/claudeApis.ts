import { getOrganizationId, getProjectId } from './helper';

const projectAPIPath = () => {
  const orgId = getOrganizationId()
  const projectId = getProjectId()

  if (!projectId || !orgId) {
    throw new Error('Unable to determine project or organization ID');
  }

  return `https://claude.ai/api/organizations/${orgId}/projects/${projectId}`
}

export const claudeUploadFile = async (fileName: string, content: string): Promise<string> => {
  const response = await fetch(`${projectAPIPath()}/docs`, {
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
    return await response.json();
  } else {
    throw new Error('Failed to fetch project docs: ' + await response.text());
  }
};