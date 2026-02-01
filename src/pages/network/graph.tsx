import { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Bot, Server, Cloud, Ticket, Package, ShoppingCart } from 'lucide-react';
import { AgentType } from './agentData';

interface IdentityFlowProps {
  data: AgentType;
}

const IdentityNode = ({ data }: any) => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg px-6 py-4 border-2 border-white min-w-[140px]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <Bot className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <div className="text-white font-semibold text-sm">{data.label}</div>
          <div className="text-blue-100 text-xs">{data.subtitle}</div>
        </div>
      </div>
    </div>
  );
};

const SystemNode = ({ data }: any) => {
  const getIcon = () => {
    switch (data.icon) {
      case 'ticket': return Ticket;
      case 'server': return Server;
      case 'cart': return ShoppingCart;
      case 'cloud': return Cloud;
      default: return Package;
    }
  };

  const Icon = getIcon();

  return (
    <div className={`bg-gradient-to-br ${data.gradient} rounded-xl shadow-lg px-6 py-4 border-2 border-white min-w-[180px]`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <Icon className={`w-6 h-6 ${data.iconColor}`} />
        </div>
        <div className="text-white font-bold text-sm">{data.label}</div>
      </div>
      <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2 space-y-1">
        {data.permissions.map((perm: string, idx: number) => (
          <div key={idx} className="text-white text-xs font-medium">{perm}</div>
        ))}
      </div>
    </div>
  );
};

const nodeTypes = {
  identity: IdentityNode,
  system: SystemNode,
};

export default function NetworkGraph({ data }: IdentityFlowProps) {
  const initialNodes: Node[] = [
    {
      id: 'agentic-identity',
      type: 'identity',
      position: { x: 450, y: 250 },
      data: {
        label: 'Agentic Identity',
        subtitle: 'Procurement Agent'
      },
    },
    {
      id: 'servicenow',
      type: 'system',
      position: { x: 100, y: 50 },
      data: {
        label: 'ServiceNow',
        icon: 'ticket',
        iconColor: 'text-teal-600',
        gradient: 'from-teal-500 to-teal-600',
        permissions: ['incident:create', 'ticket:read']
      },
    },
    {
      id: 'sap-s4',
      type: 'system',
      position: { x: 700, y: 50 },
      data: {
        label: 'SAP S/4HANA',
        icon: 'server',
        iconColor: 'text-sky-600',
        gradient: 'from-sky-500 to-sky-600',
        permissions: ['order:read', 'material:query']
      },
    },
    {
      id: 'sap-ariba',
      type: 'system',
      position: { x: 100, y: 400 },
      data: {
        label: 'SAP Ariba',
        icon: 'cart',
        iconColor: 'text-amber-600',
        gradient: 'from-amber-500 to-amber-600',
        permissions: ['PO:create', 'supplier:manage']
      },
    },
    {
      id: 'aws',
      type: 'system',
      position: { x: 700, y: 400 },
      data: {
        label: 'AWS',
        icon: 'cloud',
        iconColor: 'text-orange-600',
        gradient: 'from-orange-500 to-orange-600',
        permissions: ['s3:upload', 'lambda:invoke']
      },
    },
  ];

  const initialEdges: Edge[] = [
    {
      id: 'e1',
      source: 'agentic-identity',
      target: 'servicenow',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    },
    {
      id: 'e2',
      source: 'agentic-identity',
      target: 'sap-s4',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    },
    {
      id: 'e3',
      source: 'agentic-identity',
      target: 'sap-ariba',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    },
    {
      id: 'e4',
      source: 'agentic-identity',
      target: 'aws',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    },
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onInit = useCallback(() => {
    console.log('Flow initialized');
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Agentic Identity Permissions Graph</h2>
        <p className="text-sm text-gray-600 mt-1">Interactive visualization showing permissions across enterprise systems</p>
      </div>

      <div className="h-[700px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="rounded-lg"
        >
          <Background color="#e2e8f0" gap={16} />
          <Controls className="bg-white rounded-lg shadow-lg border border-gray-200" />
          <MiniMap
            className="bg-white rounded-lg shadow-lg border border-gray-200"
            nodeColor={(node) => {
              if (node.type === 'identity') return '#3b82f6';
              return '#94a3b8';
            }}
          />
        </ReactFlow>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Agentic Identity</h3>
            <p className="text-xs text-gray-600">
              This procurement agent has access to four enterprise systems with specific permissions for each.
              Drag nodes to reorganize the graph or use the controls to zoom and navigate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
