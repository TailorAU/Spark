"use client";

import { memo, useCallback } from "react";
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    BaseEdge,
    getBezierPath,
    Handle,
    Position,
    type NodeProps,
    type Node,
    type Edge,
    type EdgeProps,
    type EdgeTypes,
    type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    Mic,
    FileCheck,
    MessageCircle,
    AudioLines,
    ShieldCheck,
    UserCheck,
    BookOpen,
    Sparkles,
    Send,
    CheckCircle2,
} from "lucide-react";

const TEAL = "#0d9488";
const AMBER = "#d97706";
const EMERALD = "#059669";

/* ─── Main flow edge — glowing, animated ─── */

function MainEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
    const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
    return (
        <>
            <BaseEdge id={`${id}-glow`} path={path} style={{ stroke: TEAL, strokeWidth: 8, opacity: 0.12, filter: "blur(4px)" }} />
            <BaseEdge id={id} path={path} style={{ stroke: TEAL, strokeWidth: 2.5 }} />
            <circle r="4" fill={TEAL} filter="url(#dot-glow)">
                <animateMotion dur="2.8s" repeatCount="indefinite" path={path} />
            </circle>
        </>
    );
}

/* ─── Detail edge ─── */

function DetailEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps) {
    const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
    const color = (data?.color as string) ?? "#475569";
    return (
        <BaseEdge id={id} path={path} style={{ stroke: color, strokeWidth: 1.2, strokeDasharray: "5 4", opacity: 0.35 }} />
    );
}

/* ─── Outcome edge — animated green ─── */

function OutcomeEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
    const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
    return (
        <>
            <BaseEdge id={`${id}-glow`} path={path} style={{ stroke: EMERALD, strokeWidth: 6, opacity: 0.1, filter: "blur(3px)" }} />
            <BaseEdge id={id} path={path} style={{ stroke: EMERALD, strokeWidth: 2 }} />
            <circle r="3" fill={EMERALD} filter="url(#dot-glow)">
                <animateMotion dur="2s" repeatCount="indefinite" path={path} />
            </circle>
        </>
    );
}

const MemoMainEdge = memo(MainEdge);
const MemoDetailEdge = memo(DetailEdge);
const MemoOutcomeEdge = memo(OutcomeEdge);

/* ─── Step node ─── */

type StepData = { label: string; step: string; icon: "capture" | "insights" | "spark"; accent: string; glowColor: string };
const iconMap = { capture: Mic, insights: FileCheck, spark: MessageCircle };

function StepNode({ data }: NodeProps<Node<StepData>>) {
    const Icon = iconMap[data.icon];
    return (
        <div
            className="relative rounded-2xl px-7 py-5 w-[210px]"
            style={{
                background: "rgba(255, 255, 255, 0.95)",
                border: `2px solid ${data.accent}`,
                boxShadow: `0 4px 16px rgba(0,0,0,0.06)`,
            }}
        >
            <Handle type="target" position={Position.Left} className="!w-2 !h-2 !border-0 !-left-[5px]" style={{ background: data.accent, boxShadow: `0 0 6px ${data.accent}` }} />
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${data.accent}18`, color: data.accent }}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">{data.step}</span>
            </div>
            <p className="font-display font-extrabold text-xl text-stone-900 tracking-tight">{data.label}</p>
            <Handle type="source" position={Position.Right} className="!w-2 !h-2 !border-0 !-right-[5px]" style={{ background: data.accent, boxShadow: `0 0 6px ${data.accent}` }} />
        </div>
    );
}

const MemoStepNode = memo(StepNode);

/* ─── Detail node ─── */

type DetailData = { label: string; icon: "audio" | "shield" | "usercheck" | "book" | "sparkles" | "send"; accent: string };

const detailIconMap = {
    audio: AudioLines, shield: ShieldCheck, usercheck: UserCheck,
    book: BookOpen, sparkles: Sparkles, send: Send,
};

function DetailNode({ data }: NodeProps<Node<DetailData>>) {
    const Icon = detailIconMap[data.icon];
    return (
        <div
            className="rounded-xl px-4 py-3 w-[156px]"
            style={{ background: "rgba(255, 255, 255, 0.85)", border: `1px solid ${data.accent}30` }}
        >
            <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !border-0 !opacity-0" />
            <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0 opacity-60" style={{ color: data.accent }} />
                <span className="text-[12px] font-semibold text-stone-600">{data.label}</span>
            </div>
            <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !border-0 !opacity-0" />
        </div>
    );
}

const MemoDetailNode = memo(DetailNode);

/* ─── Outcome node ─── */

type OutcomeData = { label: string };

function OutcomeNode({ data }: NodeProps<Node<OutcomeData>>) {
    return (
        <div
            className="rounded-2xl px-5 py-4 w-[180px]"
            style={{
                background: "rgba(255, 255, 255, 0.95)",
                border: `1.5px solid ${EMERALD}60`,
                boxShadow: `0 4px 12px rgba(0,0,0,0.06)`,
            }}
        >
            <Handle type="target" position={Position.Left} className="!w-2 !h-2 !border-0 !-left-[5px]" style={{ background: EMERALD, boxShadow: `0 0 6px ${EMERALD}` }} />
            <div className="flex items-center gap-2.5 mb-1.5">
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: EMERALD }} />
                <span className="text-[13px] font-bold text-stone-900">{data.label}</span>
            </div>
            <p className="text-[10px] text-stone-400 leading-snug pl-[30px]">Gap closed</p>
        </div>
    );
}

const MemoOutcomeNode = memo(OutcomeNode);

/* ─── Graph ─── */

const nodeTypes: NodeTypes = { step: MemoStepNode, detail: MemoDetailNode, outcome: MemoOutcomeNode };
const edgeTypes: EdgeTypes = { main: MemoMainEdge, detail: MemoDetailEdge, outcome: MemoOutcomeEdge };

const nodes: Node[] = [
    { id: "capture",  type: "step", position: { x: 190, y: 110 }, data: { label: "Capture",  step: "01", icon: "capture",  accent: TEAL,   glowColor: "rgba(20,184,166,0.18)" } },
    { id: "insights", type: "step", position: { x: 470, y: 110 }, data: { label: "Insights", step: "02", icon: "insights", accent: AMBER,  glowColor: "rgba(245,158,11,0.18)" } },
    { id: "spark",    type: "step", position: { x: 750, y: 110 }, data: { label: "Daily Spark", step: "03", icon: "spark", accent: EMERALD, glowColor: "rgba(16,185,129,0.18)" } },

    { id: "c1", type: "detail", position: { x: 10, y: 30  }, data: { label: "Ambient audio",    icon: "audio",    accent: TEAL } },
    { id: "c2", type: "detail", position: { x: 10, y: 130 }, data: { label: "Voice detection",  icon: "shield",   accent: TEAL } },
    { id: "c3", type: "detail", position: { x: 10, y: 230 }, data: { label: "Auto-anonymise",   icon: "usercheck", accent: TEAL } },

    { id: "i1", type: "detail", position: { x: 430, y: 30  }, data: { label: "ACARA drafts",     icon: "book",     accent: AMBER } },
    { id: "i2", type: "detail", position: { x: 430, y: 230 }, data: { label: "Teacher review",   icon: "usercheck", accent: AMBER } },

    { id: "s1", type: "detail", position: { x: 710, y: 30  }, data: { label: "Daily SMS",        icon: "send",     accent: EMERALD } },
    { id: "s2", type: "detail", position: { x: 710, y: 230 }, data: { label: "Conversation tips", icon: "sparkles", accent: EMERALD } },

    { id: "outcome", type: "outcome", position: { x: 1000, y: 118 }, data: { label: "Parents connected" } },
];

const edges: Edge[] = [
    { id: "e-c-i", source: "capture",  target: "insights", type: "main" },
    { id: "e-i-s", source: "insights", target: "spark",    type: "main" },
    { id: "e-s-o", source: "spark",    target: "outcome",  type: "outcome" },

    { id: "e-c1", source: "c1", target: "capture",  type: "detail", data: { color: TEAL } },
    { id: "e-c2", source: "c2", target: "capture",  type: "detail", data: { color: TEAL } },
    { id: "e-c3", source: "c3", target: "capture",  type: "detail", data: { color: TEAL } },

    { id: "e-i1", source: "i1", target: "insights", type: "detail", data: { color: AMBER } },
    { id: "e-i2", source: "i2", target: "insights", type: "detail", data: { color: AMBER } },

    { id: "e-s1", source: "spark", target: "s1", type: "detail", data: { color: EMERALD } },
    { id: "e-s2", source: "spark", target: "s2", type: "detail", data: { color: EMERALD } },
];

export default function PipelineFlow() {
    const onInit = useCallback((instance: { fitView: (opts?: object) => void }) => {
        requestAnimationFrame(() => {
            instance.fitView({ padding: 0.12, maxZoom: 1, duration: 600 });
        });
    }, []);

    return (
        <div className="w-full h-[320px] sm:h-[380px] md:h-[460px] rounded-2xl border border-stone-200 overflow-hidden shadow-sm" style={{ background: "rgba(250, 248, 243, 0.6)" }}>
            <svg width="0" height="0">
                <defs>
                    <filter id="dot-glow">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
            </svg>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{ animated: false }}
                onInit={onInit}
                fitView
                fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
                panOnDrag
                zoomOnScroll={false}
                zoomOnPinch
                preventScrolling={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                proOptions={{ hideAttribution: true }}
                minZoom={0.4}
                maxZoom={1.5}
                style={{ background: "transparent" }}
            >
                <Background variant={BackgroundVariant.Dots} gap={28} size={0.6} color="rgba(168, 162, 158, 0.2)" />
            </ReactFlow>
        </div>
    );
}
