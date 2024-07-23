import { SyncedFile, SyncedFileStatus } from './types';

export const API_PORT = 38451;

export interface ILocalFile {
  fileName: string,
  fileContent: string,
  filePath: string,
}

export const selectLocalFile = async (): Promise<ILocalFile> => {
  const response = await fetch(`http://127.0.0.1:${API_PORT}/open-file`);
  if (!response.ok) {
    throw new Error('Failed to open file');
  }
  return await response.json();
}

export const readLocalFile = async (file: SyncedFile): Promise<{ exists: boolean, fileContent: string }> => {
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

export const checkFileStatuses = async (files: Record<string, SyncedFile>): Promise<Record<string, SyncedFileStatus>> => {
  const response = await fetch(`http://localhost:${API_PORT}/check-files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: Object.values(files).map(file => ({
        id: file.id,
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

  return Object.values(files).reduce((m: Record<string, SyncedFileStatus>, f) => {
    const r = resultById[f.id]
    m[f.id] = r?.exists === false ? 'deleted' : (r?.lastModified ?? 0) > f.lastUpdated ? 'changed' : 'synced'
    return m
  }, {})
};