"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export type FlowNodeDetail = {
  title: string;
  // plain language, what it does rather than what it is
  what: string;
  facts?: string[];
};

export type FlowSpec = {
  nodes: Node[];
  edges: Edge[];
  details: Record<string, FlowNodeDetail>;
  height?: number;
};

const FIT = { padding: 0.12 };

export default function FlowDiagram({ spec, caption }: { spec: FlowSpec; caption?: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  // react flow writes measured dimensions back into its own node objects, and
  // edges need those to compute a path. rebuilding the array from spec on every
  // render wiped them, so the store owns the nodes and selection only restyles
  const [nodes, setNodes] = useNodesState(spec.nodes);
  const [edges, setEdges] = useEdgesState(
    spec.edges.map((e) => ({ ...e, animated: e.animated ?? true })),
  );

  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => {
    setSelected((prev) => (prev === node.id ? null : node.id));
  }, []);

  // the picked node is ringed, everything else dims, so a click reads as focus
  useEffect(() => {
    setNodes((ns) =>
      ns.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: selected && selected !== n.id ? 0.35 : 1,
          transition: "opacity 0.2s ease, box-shadow 0.2s ease",
          boxShadow: selected === n.id ? "0 0 0 2px var(--accent)" : undefined,
        },
      })),
    );
    setEdges((es) =>
      es.map((e) => {
        const touches = !selected || e.source === selected || e.target === selected;
        return {
          ...e,
          style: {
            stroke: "var(--flow-edge)",
            strokeWidth: 1.5,
            ...e.style,
            opacity: touches ? 1 : 0.15,
            transition: "opacity 0.2s ease",
          },
          labelStyle: { fontSize: 10, fill: "var(--flow-muted)" },
          labelBgStyle: { fill: "var(--flow-label-bg)" },
        };
      }),
    );
  }, [selected, setNodes, setEdges]);

  const detail = selected ? spec.details[selected] : null;

  return (
    <figure className="my-8">
      <div className="relative">
      {/* same hover-reveal icon as the sports page menu, outside the clipped diagram box */}
      <span className="group absolute right-3 top-3 z-10 flex items-center">
        <span
          tabIndex={0}
          role="button"
          aria-label="How the diagram works"
          className="text-gray-300 transition-colors hover:text-gray-500 focus-visible:text-gray-500"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9.2" />
            <path d="M12 11v5.2" />
            <path d="M12 7.6v.1" />
          </svg>
        </span>
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full mt-2 w-max max-w-64 rounded-lg border border-gray-200 bg-white p-2.5 text-left text-xs leading-relaxed text-gray-500 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          Click any box to see what it does. Click the background to clear.
        </span>
      </span>
      <div
        className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
        style={{ height: spec.height ?? 460 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelected(null)}
          fitView
          fitViewOptions={FIT}
          minZoom={0.3}
          proOptions={{ hideAttribution: true }}
          // a fixed figure, not a canvas. zoom is off and the page keeps its
          // scroll when the pointer crosses the diagram
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          panOnDrag={false}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          autoPanOnNodeFocus={false}
        >
          <Background gap={18} size={1} color="var(--flow-dots)" />
        </ReactFlow>
      </div>
      </div>

      {detail ? (
        <div className="mt-3 rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold">{detail.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{detail.what}</p>
            {detail.facts?.length ? (
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {detail.facts.map((f) => (
                  <li key={f} className="font-mono text-[11px] text-gray-400">
                    {f}
                  </li>
                ))}
              </ul>
            ) : null}
        </div>
      ) : null}

      {caption ? (
        <figcaption className="mt-2 text-center text-xs text-gray-400">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
