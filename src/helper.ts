export function formatRelativeTime(time: number): string {
  const diffInSeconds = Math.floor((Date.now() - time) / 1000);

  if (diffInSeconds < 10) return `Just now`;
  if (diffInSeconds < 60) return `Less than a minute ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

let orgId = ''

export const getOrganizationId = (): string => {
  if (!orgId) {
    const scripts = document.getElementsByTagName('script');
    for (const script of scripts) {
      const content = script.textContent || script.innerText;
      const match = content.match(/\\"memberships\\":\[\{\\"organization\\":\{\\"uuid\\":\\"([^\\"]+)\\"/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return orgId
};

export const getProjectId = () => {
  const projectId = window.location.pathname.split('/').pop();
  return projectId!
}

export const ERR_COVER_DEFAULT_TITLE = 'An unexpected error occurred';
export const ERR_COVER_DEFAULT_MSG = 'Please try again or contact @vulq for further support';

export const errCover = <T extends (...args: any[]) => any>(
  method: T,
  defaultMsg?: string,
  title?: string
): T => {
  defaultMsg = defaultMsg || ERR_COVER_DEFAULT_MSG;
  return function (this: any, ...args: any[]) {
    try {
      const ret = method.apply(this, args);
      if (ret instanceof Promise) {
        return ret.catch((err) => {
          const msg = interpolateErrMessage(err, defaultMsg);
          showNotification(title ?? ERR_COVER_DEFAULT_TITLE, msg);
        });
      }
      return ret;
    } catch (err) {
      const msg = interpolateErrMessage(err, defaultMsg);
      showNotification(title ?? ERR_COVER_DEFAULT_TITLE, msg);
    }
  } as unknown as T;
};

export function interpolateErrMessage(err: any, defaultMsg?: string): string {
  console.log(JSON.stringify(err.response));
  return (
    err?.body?.data?.message ??
    err?.body?.err?.message ??
    err?.response?.data?.err?.message ??
    err?.response?.data?.message ??
    err?.response?.err?.message ??
    err?.data?.message ??
    err?.err?.message ??
    err?.message ??
    defaultMsg
  );
}

export function showNotification(title: string, message: string): void {
  console.log("[CLAUDESYNC ERR]", title, message)
  // chrome.notifications.create({
  //   type: 'basic',
  //   iconUrl: '', // 'path/to/your/icon.png', // Replace with the path to your extension's icon
  //   title: title,
  //   message: message,
  // });
}

export function getRandomToken() {
  var randomPool = new Uint8Array(16);
  crypto.getRandomValues(randomPool);
  var hex = '';
  for (var i = 0; i < randomPool.length; ++i) {
    hex += randomPool[i].toString(16);
  }
  // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
  return hex;
}

export function showConfirmationDialog(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (confirm(`${title}\n\n${message}`)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

export const getRelativePath = (from: string, filePath: string): string => {
  // Normalize paths by replacing backslashes with forward slashes
  const normalizedWorkspacePath = normalizePath(from)
  const normalizedFilePath = normalizePath(filePath)

  // Check if the file path starts with the workspace path
  if (normalizedFilePath.startsWith(normalizedWorkspacePath)) {
    // Remove the workspace path from the file path
    return normalizedFilePath.slice(normalizedWorkspacePath.length).replace(/^\//, '');
  } else {
    // If the file is outside the workspace, use parent directory notation
    const workspaceParts = normalizedWorkspacePath.split('/');
    const fileParts = normalizedFilePath.split('/');

    let commonParts = 0;
    while (commonParts < workspaceParts.length &&
      commonParts < fileParts.length &&
      workspaceParts[commonParts] === fileParts[commonParts]) {
      commonParts++;
    }

    const parentDirs = new Array(workspaceParts.length - commonParts).fill('..');
    const remainingPath = fileParts.slice(commonParts);

    return [...parentDirs, ...remainingPath].join('/');
  }
};