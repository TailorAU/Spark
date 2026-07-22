const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5300/api";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...options?.headers },
        ...options,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

export type ObservationStatus = "PendingReview" | "Approved" | "Rejected" | "Edited";

export interface Observation {
    id: string;
    audioSessionId: string;
    studentId: string;
    teacherId: string;
    draftContent: string;
    approvedContent: string | null;
    acaraCode: string;
    acaraDescription: string;
    status: ObservationStatus;
    createdAt: string;
    reviewedAt: string | null;
    student: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface AudioSession {
    id: string;
    startedAt: string;
    endedAt: string | null;
    status: string;
}

export interface Transcript {
    id: string;
    sessionId: string;
    content: string;
}

interface ListObservationsParams {
    sessionId?: string;
    studentId?: string;
    status?: ObservationStatus;
}

function toQuery(params?: Record<string, string | undefined>): string {
    if (!params) return "";
    const entries = Object.entries(params).filter(
        (e): e is [string, string] => e[1] !== undefined,
    );
    if (entries.length === 0) return "";
    return "?" + new URLSearchParams(entries).toString();
}

export const educationApi = {
    observations: {
        list: (params?: ListObservationsParams) =>
            fetchApi<Observation[]>(`/observations${toQuery(params as Record<string, string | undefined>)}`),

        get: (id: string) => fetchApi<Observation>(`/observations/${id}`),

        approve: (id: string, body?: { approvedContent?: string; acaraCode?: string; acaraDescription?: string }) =>
            fetchApi<Observation>(`/observations/${id}/approve`, {
                method: "PUT",
                body: body ? JSON.stringify(body) : undefined,
            }),

        reject: (id: string, body?: { reason?: string }) =>
            fetchApi<Observation>(`/observations/${id}/reject`, {
                method: "PUT",
                body: body ? JSON.stringify(body) : undefined,
            }),
    },

    sessions: {
        get: (id: string) => fetchApi<AudioSession>(`/sessions/${id}`),
        transcript: (id: string) => fetchApi<Transcript>(`/sessions/${id}/transcript`),
    },
};
