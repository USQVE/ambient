import React, { useMemo } from 'react';
import ReactFlow, { Node, Edge, Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { Pattern, integratedInformation, V } from '../../models/Simulation';

interface AgentGraphProps {
  patterns: Pattern[];
  onPatternClick?: (pattern: Pattern) => void;
}

export const AgentGraph: React.FC<AgentGraphProps> = ({ patterns, onPatternClick }) => {
  const { nodes, edges } = useMemo(() => {
    // Позиции узлов по кругу
    const radius = 150;
    const center = { x: 200, y: 200 };
    const nodes: Node[] = V.map((agent, idx) => {
      const angle = (idx / V.length) * 2 * Math.PI;
      return {
        id: agent,
        data: { label: agent },
        position: {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
        },
        style: {
          background: '#fef3c7',
          border: '2px solid #b45309',
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          color: '#78350f',
        },
      };
    });

    const edges: Edge[] = patterns.map(p => ({
      id: p.id,
      source: p.agents[0],
      target: p.agents[1],
      label: `Φ = ${integratedInformation(p).toFixed(2)}`,
      style: { stroke: '#92400e', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#92400e' },
      data: { pattern: p },
    }));

    return { nodes, edges };
  }, [patterns]);

  const onEdgeClick = (_event: React.MouseEvent, edge: Edge) => {
    if (edge.data?.pattern && onPatternClick) {
      onPatternClick(edge.data.pattern);
    }
  };

  return (
    <div style={{ height: 420, width: '100%', background: '#fdf8ed', borderRadius: 16, border: '1px solid #d4a373' }}>
      <ReactFlow nodes={nodes} edges={edges} onEdgeClick={onEdgeClick} fitView>
        <Background color="#d4a373" gap={16} size={0.5} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
