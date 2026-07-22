"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { educationApi, type Observation, type ObservationStatus } from "@/lib/api";
import { Clock, ChevronRight } from "lucide-react";

type FilterTab = "all" | ObservationStatus;

const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "PendingReview", label: "Pending Review" },
    { key: "Approved", label: "Approved" },
    { key: "Rejected", label: "Rejected" },
];

function statusBadge(status: ObservationStatus) {
    const map: Record<ObservationStatus, { bg: string; text: string; label: string }> = {
        PendingReview: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
        Approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Approved" },
        Rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
        Edited: { bg: "bg-blue-50", text: "text-blue-700", label: "Edited" },
    };
    const s = map[status];
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            {s.label}
        </span>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ObservationsPage() {
    const [activeTab, setActiveTab] = useState<FilterTab>("all");

    const { data: observations, isLoading, error } = useQuery({
        queryKey: ["observations", activeTab],
        queryFn: () =>
            educationApi.observations.list(
                activeTab === "all" ? undefined : { status: activeTab },
            ),
    });

    return (
        <div className="px-6 lg:px-10 py-8 max-w-5xl">
            <div className="mb-8">
                <h1 className="font-display text-2xl font-extrabold text-stone-900">
                    Observations
                </h1>
                <p className="text-sm text-stone-500 mt-1">
                    Review AI-drafted observations before they are finalised.
                </p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 mb-6 bg-white rounded-lg border border-stone-200 p-1 w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
                            px-4 py-2 rounded-md text-sm font-medium transition-colors
                            ${activeTab === tab.key
                                ? "bg-spark-500 text-white shadow-sm"
                                : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-2 border-spark-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
                    Failed to load observations. Please try again.
                </div>
            )}

            {observations && observations.length === 0 && (
                <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
                    <p className="text-stone-400 text-sm">No observations found.</p>
                </div>
            )}

            {observations && observations.length > 0 && (
                <div className="space-y-3">
                    {observations.map((obs) => (
                        <ObservationCard key={obs.id} observation={obs} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ObservationCard({ observation }: { observation: Observation }) {
    const studentName = `${observation.student.firstName} ${observation.student.lastName}`;
    const preview =
        observation.draftContent.length > 160
            ? observation.draftContent.slice(0, 160) + "…"
            : observation.draftContent;

    return (
        <Link
            href={`/app/observations/review?id=${observation.id}`}
            className="block bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-300 hover:shadow-sm transition-all group"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="font-display font-bold text-stone-900">
                            {studentName}
                        </span>
                        {statusBadge(observation.status)}
                        {observation.acaraCode && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                {observation.acaraCode}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-stone-500 leading-relaxed mb-2">
                        {preview}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(observation.createdAt)}
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0 mt-1" />
            </div>
        </Link>
    );
}
