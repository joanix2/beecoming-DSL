import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useUMLStore } from '@/stores/umlStore';
import ClassNode from './ClassNode';
import type { RelationType } from '@/types/uml';

const nodeTypes = { classNode: ClassNode };

const getEdgeStyle = (type: RelationType) => {
  const base = { strokeWidth: 2 };
  switch (type) {
    case 'inheritance':
      return { ...base, stroke: 'hsl(180, 70%, 50%)' };
    case 'composition':
      return { ...base, stroke: 'hsl(0, 70%, 55%)' };
    case 'aggregation':
      return { ...base, stroke: 'hsl(40, 90%, 55%)' };
    case 'dependency':
      return { ...base, stroke: 'hsl(215, 15%, 55%)', strokeDasharray: '5,5' };
    case 'realization':
      return { ...base, stroke: 'hsl(270, 60%, 60%)', strokeDasharray: '5,5' };
    default:
      return { ...base, stroke: 'hsl(210, 20%, 70%)' };
  }
};

const getMarkerEnd = (type: RelationType) => {
  switch (type) {
    case 'inheritance':
    case 'realization':
      return { type: MarkerType.ArrowClosed, color: 'hsl(180, 70%, 50%)' };
    case 'composition':
      return { type: MarkerType.ArrowClosed, color: 'hsl(0, 70%, 55%)' };
    case 'aggregation':
      return { type: MarkerType.ArrowClosed, color: 'hsl(40, 90%, 55%)' };
    default:
      return { type: MarkerType.Arrow, color: 'hsl(210, 20%, 70%)' };
  }
};

export default function UMLCanvas() {
  const { classes, relations, setSelectedClass, setSelectedRelation, moveClass, addRelation } = useUMLStore();
  const connectionType = useRef<RelationType>('association');

  const flowNodes = useMemo(
    () =>
      classes.map((cls) => ({
        id: cls.id,
        type: 'classNode' as const,
        position: { x: cls.x, y: cls.y },
        data: { ...cls } as Record<string, unknown>,
        selected: false,
      })),
    [classes]
  );

  const flowEdges = useMemo(
    () =>
      relations.map((rel) => ({
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        label: rel.label || rel.type,
        style: getEdgeStyle(rel.type),
        markerEnd: getMarkerEnd(rel.type),
        labelStyle: { fill: 'hsl(210, 20%, 70%)', fontSize: 10, fontFamily: 'var(--font-mono)' },
        labelBgStyle: { fill: 'hsl(220, 22%, 8%)', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
        data: { ...rel } as Record<string, unknown>,
      })),
    [relations]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => { setNodes(flowNodes); }, [flowNodes, setNodes]);
  useEffect(() => { setEdges(flowEdges); }, [flowEdges, setEdges]);

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      moveClass(node.id, node.position.x, node.position.y);
    },
    [moveClass]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addRelation(params.source, params.target, connectionType.current);
      }
    },
    [addRelation]
  );

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      setSelectedClass(node.id);
    },
    [setSelectedClass]
  );

  const onEdgeClick = useCallback(
    (_: any, edge: Edge) => {
      setSelectedRelation(edge.id);
    },
    [setSelectedRelation]
  );

  const onPaneClick = useCallback(() => {
    setSelectedClass(null);
    setSelectedRelation(null);
  }, [setSelectedClass, setSelectedRelation]);

  return (
    <div className="w-full h-full">
      {/* Connection type selector */}
      <div className="absolute top-3 left-3 z-10 flex gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-1">
        {(['association', 'inheritance', 'aggregation', 'composition'] as RelationType[]).map((t) => (
          <button
            key={t}
            onClick={() => { connectionType.current = t; }}
            className="px-2 py-1 text-[10px] font-mono rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors capitalize"
            title={`Connect as ${t}`}
          >
            {t.slice(0, 5)}
          </button>
        ))}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-canvas"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(220, 14%, 14%)" />
        <Controls />
        <MiniMap
          nodeColor={() => 'hsl(180, 70%, 50%)'}
          maskColor="hsl(220, 20%, 10%, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
