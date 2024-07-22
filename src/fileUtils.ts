import { SyncedFile } from './types';
import { removeSyncedFile, storeSyncedFile } from './storageUtils';
import { addFileElement, removeFileFromUI } from './components/FileList';
import { getOrganizationId } from './helper';

export const API_PORT = 38451;

export const selectFile = async (): Promise<File> => {
  const response = await fetch(`http://127.0.0.1:${API_PORT}/open-file`);
  if (!response.ok) {
    throw new Error('Failed to open file');
  }
  return await response.json();
  // await uploadFileContent(fileName, fileContent, filePath); // TODO
}

export const readFile = async (file: SyncedFile): Promise<{ exists: boolean, fileContent: string }> => {
  const response = await fetch(`http://localhost:${API_PORT}/read-file?path=${encodeURIComponent(file.filePath)}`);
  if (!response.ok) {
    throw new Error('Failed to read file');
  }
  const data = await response.json();

  return {
    exists: data.exists,
    fileContent: data.fileContent
  }
};

export const checkFiles = async (files: SyncedFile[]): Promise<{ [uuid: string]: string }> => {
  const response = await fetch(`http://localhost:${API_PORT}/check-files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: files.map(file => ({
        id: file.uuid,
        path: file.filePath
      }))
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to check files');
  }

  const results = await response.json();
  const resultById: any = results.reduce((m: any, r: any) => {
    m[r.id] = r
    return m
  }, {})

  return files.reduce((m: any, f) => {
    const r = resultById[f.uuid]
    m[f.uuid] = r?.exists === false ? 'deleted' : new Date(r?.lastModified ?? 0) > new Date(f.lastUpdated) ? 'changed' : 'synced'
    return m
  }, {})
};