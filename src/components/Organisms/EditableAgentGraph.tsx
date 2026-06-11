import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MarkerType,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Pattern, integratedInformation, V as defaultV } from '../../models/Simulation';

interface EditableAgentGraphProps {
  patterns: Pattern[];
  onPatternsChange: (patterns: Pattern[]) => void;
  onAgentsChange: (agents: string[]) => void;
}

export const EditableAgentGraph: React.FC<EditableAgentGraphProps> = ({
  patterns,
  onPatternsChange,
  onAgentsChange,
}) => {
  const [agents, setAgents] = useState<string[]>([...defaultV]);
  const [nextAgentId, setNextAgentId] = useState(agents.length + 1);

  // Инициализация узлов
  const initialNodes: Node[] = agents.map((agent, idx) => ({
    id: agent,
    data: { label: agent },
    position: { x: 100 + (idx % 3) * 150, y: 100 + Math.floor(idx / 3) * 120 },
    style: { background: '#fef3c7', border: '2px solid #b45309', borderRadius: '50%', width: 60, height: 60, textAlign: 'center', fontSize: '1rem' },
    draggable: true,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Синхронизация agents с родителем
  useEffect(() => {
    onAgentsChange(agents);
  }, [agents, onAgentsChange]);

  // При изменении agents обновляем узлы
  useEffect(() => {
    setNodes(agents.map((agent, idx) => ({
      id: agent,
      data: { label: agent },
      position: nodes.find(n => n.id === agent)?.position || { x: 100 + (idx % 3) * 150, y: 100 + Math.floor(idx / 3) * 120 },
      style: { background: '#fef3c7', border: '2px solid #b45309', borderRadius: '50%', width: 60, height: 60 },
      draggable: true,
    })));
  }, [agents]);

  // Загружаем связи из patterns
  useEffect(() => {
    const newEdges: Edge[] = patterns.map(p => ({
      id: p.id,
      source: p.agents[0],
      target: p.agents[1],
      label: `Φ=${integratedInformation(p).toFixed(2)}`,
      style: { stroke: '#92400e', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#92400e' },
      data: { pattern: p },
    }));
    setEdges(newEdges);
  }, [patterns, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;
    const newPatternId = `${params.source}-${params.target}`;
    const newPattern: Pattern = {
      id: newPatternId,
      agents: [params.source, params.target],
      causalLinks: [[0, 1], [1, 0]],
    };
    // Проверяем, нет ли уже такого паттерна
    if (!patterns.some(p => p.id === newPatternId)) {
      onPatternsChange([...patterns, newPattern]);
    }
    setEdges((eds) => addEdge(params, eds));
  }, [patterns, onPatternsChange, setEdges]);

  const onEdgeDelete = useCallback((edgeId: string) => {
    onPatternsChange(patterns.filter(p => p.id !== edgeId));
    setEdges(eds => eds.filter(e => e.id !== edgeId));
  }, [patterns, onPatternsChange, setEdges]);

  const addAgent = () => {
    const newAgent = String.fromCharCode(96 + nextAgentId);
    setAgents(prev => [...prev, newAgent]);
    setNextAgentId(prev => prev + 1);
  };

  const deleteAgent = (agentId: string) => {
    if (agents.length <= 2) return; // минимум 2 субагента
    setAgents(prev => prev.filter(a => a !== agentId));
    // Удаляем все паттерны, связанные с этим агентом
    onPatternsChange(patterns.filter(p => !p.agents.includes(agentId)));
  };

  return (
    <div style={{ height: 450, width: '100%', background: '#fdf8ed', borderRadius: 16, border: '1px solid #d4a373' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={(eds) => eds.forEach(e => onEdgeDelete(e.id))}
        fitView
      >
        <Background color="#d4a373" gap={16} size={0.5} />
        <Controls />
        <Panel position="top-right" className="bg-amber-100 p-2 rounded shadow flex gap-2">
          <button onClick={addAgent} className="bg-amber-700 text-white px-2 py-1 rounded text-xs">➕ Новый субагент</button>
          <button
            onClick={() => {
              const selected = nodes.find(n => n.selected);
              if (selected) deleteAgent(selected.id);
            }}
            className="bg-red-700 text-white px-2 py-1 rounded text-xs"
          >
            🗑️ Удалить выбранный
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};
