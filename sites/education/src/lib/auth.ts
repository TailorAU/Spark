export interface SwaUser {
    identityProvider: string;
    userId: string;
    userDetails: string;
    userRoles: string[];
    claims: { typ: string; val: string }[];
}

interface SwaAuthResponse {
    clientPrincipal: SwaUser | null;
}

export async function getSwaUser(): Promise<SwaUser | null> {
    try {
        const res = await fetch("/.auth/me");
        if (!res.ok) return null;
        const data: SwaAuthResponse = await res.json();
        return data.clientPrincipal;
    } catch {
        return null;
    }
}

export const AUTH_LOGIN_URL = "/.auth/login/aad?post_login_redirect_uri=/app/observations";
export const AUTH_LOGOUT_URL = "/.auth/logout?post_logout_redirect_uri=/";
