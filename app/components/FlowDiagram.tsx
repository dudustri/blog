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
          boxShadow: selected === n.id ? "0 0 0 2px #3e6b89" : undefined,
        },
      })),
    );
    setEdges((es) =>
      es.map((e) => {
        const touches = !selected || e.source === selected || e.target === selected;
        return {
          ...e,
          style: {
            stroke: "#9ca3af",
            strokeWidth: 1.5,
            ...e.style,
            opacity: touches ? 1 : 0.15,
            transition: "opacity 0.2s ease",
          },
          labelStyle: { fontSize: 10, fill: "#6b7280" },
          labelBgStyle: { fill: "#f9fafb" },
        };
      }),
    );
  }, [selected, setNodes, setEdges]);

  const detail = selected ? spec.details[selected] : null;

  return (
    <figure className="my-8">
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
          <Background gap={18} size={1} color="#d1d5db" />
        </ReactFlow>
      </div>

      <div className="mt-3 min-h-[4.5rem] rounded-xl border border-gray-200 p-4">
        {detail ? (
          <>
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
          </>
        ) : (
          <p className="text-sm text-gray-400">
            Click any box to see what it does. Click the background to clear.
          </p>
        )}
      </div>

      {caption ? (
        <figcaption className="mt-2 text-center text-xs text-gray-400">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
