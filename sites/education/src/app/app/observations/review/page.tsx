"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { educationApi } from "@/lib/api";
import { ArrowLeft, Check, X, Clock, User } from "lucide-react";
import Link from "next/link";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ObservationReviewPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-spark-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ObservationReviewContent />
        </Suspense>
    );
}

function ObservationReviewContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id") ?? "";
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: observation, isLoading, error } = useQuery({
        queryKey: ["observation", id],
        queryFn: () => educationApi.observations.get(id),
        enabled: !!id,
    });

    const [content, setContent] = useState<string | null>(null);
    const [acaraCode, setAcaraCode] = useState<string | null>(null);
    const [acaraDesc, setAcaraDesc] = useState<string | null>(null);

    const editedContent = content ?? observation?.draftContent ?? "";
    const editedCode = acaraCode ?? observation?.acaraCode ?? "";
    const editedDesc = acaraDesc ?? observation?.acaraDescription ?? "";

    const approveMutation = useMutation({
        mutationFn: () =>
            educationApi.observations.approve(id, {
                approvedContent: editedContent,
                acaraCode: editedCode,
                acaraDescription: editedDesc,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["observations"] });
            router.push("/app/observations");
        },
    });

    const rejectMutation = useMutation({
        mutationFn: () => educationApi.observations.reject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["observations"] });
            router.push("/app/observations");
        },
    });

    const isPending = approveMutation.isPending || rejectMutation.isPending;

    if (!id) {
        return (
            <div className="px-6 lg:px-10 py-8 max-w-3xl">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-700">
                    No observation ID provided.{" "}
                    <Link href="/app/observations" className="underline">
                        Back to observations
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-spark-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !observation) {
        return (
            <div className="px-6 lg:px-10 py-8 max-w-3xl">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
                    Failed to load observation.
                </div>
            </div>
        );
    }

    const studentName = `${observation.student.firstName} ${observation.student.lastName}`;

    return (
        <div className="px-6 lg:px-10 py-8 max-w-3xl">
            <Link
                href="/app/observations"
                className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to observations
            </Link>

            <div className="mb-8">
                <h1 className="font-display text-2xl font-extrabold text-stone-900 mb-2">
                    Review Observation
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                    <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {studentName}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {formatDate(observation.createdAt)}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                            ACARA Code
                        </label>
                        <input
                            type="text"
                            value={editedCode}
                            onChange={(e) => setAcaraCode(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-spark-500/30 focus:border-spark-500 transition-shadow font-mono"
                            placeholder="e.g. AC9M1SP01"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                            ACARA Description
                        </label>
                        <input
                            type="text"
                            value={editedDesc}
                            onChange={(e) => setAcaraDesc(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-spark-500/30 focus:border-spark-500 transition-shadow"
                            placeholder="Curriculum outcome description"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                        Observation Draft
                    </label>
                    <textarea
                        value={editedContent}
                        onChange={(e) => setContent(e.target.value)}
                        rows={10}
                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 leading-relaxed placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-spark-500/30 focus:border-spark-500 transition-shadow resize-y"
                        placeholder="Observation content…"
                    />
                </div>

                {(approveMutation.error || rejectMutation.error) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                        {(approveMutation.error ?? rejectMutation.error)?.message ?? "Action failed. Please try again."}
                    </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={() => approveMutation.mutate()}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-spark-500 hover:bg-spark-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="w-4 h-4" />
                        {approveMutation.isPending ? "Approving…" : "Approve"}
                    </button>
                    <button
                        onClick={() => rejectMutation.mutate()}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="w-4 h-4" />
                        {rejectMutation.isPending ? "Rejecting…" : "Reject"}
                    </button>
                </div>
            </div>
        </div>
    );
}
