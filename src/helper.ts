export function formatRelativeTime(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

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