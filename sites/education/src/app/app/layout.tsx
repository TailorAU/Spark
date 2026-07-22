"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClipboardList, LogOut, Menu, User, X } from "lucide-react";
import { getSwaUser, AUTH_LOGOUT_URL, type SwaUser } from "@/lib/auth";

function SparkIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5 27C8.5 27 10 20 14 15.5C18 11 23 9.5 23 9.5C23 9.5 17 9 13 6C9 3 8 0.5 8 0.5C8 0.5 7.5 5 5 9C2.5 13 0.5 14.5 0.5 14.5C0.5 14.5 4.5 14 7 17C9.5 20 8.5 27 8.5 27Z" fill="currentColor" />
            <path d="M11 24C11 24 11.5 20 14 17C16.5 14 19.5 13 19.5 13C19.5 13 16.5 12.5 14.5 10.5C12.5 8.5 12 6 12 6C12 6 11 9 9 11.5C7 14 5 15 5 15C5 15 7.5 15.5 9 17.5C10.5 19.5 11 24 11 24Z" fill="currentColor" opacity="0.5" />
        </svg>
    );
}

const NAV_ITEMS = [
    { href: "/app/observations", label: "Observations", icon: ClipboardList },
] as const;

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
    });
}

let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
    if (typeof window === "undefined") return makeQueryClient();
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const queryClient = getQueryClient();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<SwaUser | null>(null);

    useEffect(() => {
        getSwaUser().then(setUser);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <div className="flex h-screen bg-ivory">
                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/20 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={`
                        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200
                        flex flex-col transition-transform duration-200
                        lg:static lg:translate-x-0
                        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    `}
                >
                    <div className="flex items-center gap-2.5 px-6 py-5 border-b border-stone-200">
                        <SparkIcon className="w-5 h-6 text-spark-500" />
                        <span className="font-display font-extrabold text-lg tracking-tight text-stone-900">
                            Tailor Education
                        </span>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const active = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                        ${active
                                            ? "bg-spark-50 text-spark-700"
                                            : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                                        }
                                    `}
                                >
                                    <item.icon className="w-4.5 h-4.5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="px-3 py-4 border-t border-stone-200 space-y-2">
                        {user && (
                            <div className="flex items-center gap-2.5 px-3 py-2">
                                <div className="w-7 h-7 rounded-full bg-spark-100 text-spark-600 flex items-center justify-center text-xs font-bold shrink-0">
                                    {user.userDetails?.charAt(0)?.toUpperCase() ?? <User className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-sm text-stone-700 font-medium truncate">
                                    {user.userDetails}
                                </span>
                            </div>
                        )}
                        <a
                            href={AUTH_LOGOUT_URL}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors w-full"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </a>
                    </div>
                </aside>

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Mobile header */}
                    <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200">
                        <button onClick={() => setSidebarOpen(true)} className="text-stone-600">
                            <Menu className="w-5 h-5" />
                        </button>
                        <SparkIcon className="w-4 h-5 text-spark-500" />
                        <span className="font-display font-bold text-sm text-stone-900">Tailor Education</span>
                    </header>

                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </QueryClientProvider>
    );
}
