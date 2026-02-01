import { useState, useEffect } from 'react';
import { Bot, ShieldCheck, Container, Boxes, HardDrive, Activity, Network } from 'lucide-react';
import { AgentType } from './agentData';

interface IdentityFlowProps {
  data: AgentType;
}

interface GraphNode {
  id: string;
  type: 'agent' | 'identity' | 'instance' | 'mcp' | 'system';
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  icon: string;
  connections: string[];
  metadata?: {
    region?: string;
    tenant?: string;
    idp_type?: string;
    server_type?: string;
    system_type?: string;
    provider?: string;
    status?: string;
    os?: string;
    audit_logs?: { blocked: number; approved: number };
    rules?: number;
  };
}

export default function NetworkGraph({ data }: IdentityFlowProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const stats = {
    totalNodes: 0,
    totalConnections: 0,
    identities: data.identities.length,
    instances: data.identities.reduce((acc, id) => acc + id.instances.length, 0),
    mcpServers: new Set(data.identities.flatMap(id => id.mcpDependencies?.map(m => m.id) || [])).size,
    systems: new Set(data.identities.flatMap(id => id.mcpDependencies?.flatMap(m => m.systems.map(s => s.id)) || [])).size,
    totalAuditLogs: data.identities.reduce((acc, id) => {
      const logs = id.instances.reduce((sum, inst) => ({
        approved: sum.approved + inst.audit_logs.approved,
        blocked: sum.blocked + inst.audit_logs.blocked
      }), { approved: 0, blocked: 0 });
      return { approved: acc.approved + logs.approved, blocked: acc.blocked + logs.blocked };
    }, { approved: 0, blocked: 0 })
  };

  useEffect(() => {
    const graphNodes: GraphNode[] = [];
    const centerX = 500;
    const centerY = 300;

    graphNodes.push({
      id: data.id,
      type: 'agent',
      label: data.name,
      x: centerX,
      y: centerY,
      size: 90,
      color: '#3b82f6',
      icon: 'bot',
      connections: data.identities.map(i => i.id),
      metadata: {
        region: data.region,
        provider: data.provider,
        status: 'Active',
        rules: data.typeRules.length
      }
    });

    data.identities.forEach((identity, idIdx) => {
      const angle = (idIdx / data.identities.length) * 2 * Math.PI;
      const radius = 190;
      const idX = centerX + Math.cos(angle) * radius;
      const idY = centerY + Math.sin(angle) * radius;

      const totalAuditLogs = identity.instances.reduce((acc, inst) => ({
        blocked: acc.blocked + inst.audit_logs.blocked,
        approved: acc.approved + inst.audit_logs.approved
      }), { blocked: 0, approved: 0 });

      graphNodes.push({
        id: identity.id,
        type: 'identity',
        label: identity.identity_name,
        x: idX,
        y: idY,
        size: 70,
        color: '#9333ea',
        icon: 'shield',
        connections: [data.id, ...identity.instances.map(i => i.id)],
        metadata: {
          tenant: identity.tenant,
          idp_type: identity.idp_type,
          status: identity.status,
          rules: identity.identityRules.length,
          audit_logs: totalAuditLogs
        }
      });

      identity.instances.forEach((instance, instIdx) => {
        const instAngle = angle + (instIdx - identity.instances.length / 2) * 0.3;
        const instRadius = radius + 130;
        const instX = centerX + Math.cos(instAngle) * instRadius;
        const instY = centerY + Math.sin(instAngle) * instRadius;

        graphNodes.push({
          id: instance.id,
          type: 'instance',
          label: instance.pod_id,
          x: instX,
          y: instY,
          size: 55,
          color: '#0891b2',
          icon: 'container',
          connections: [identity.id, ...(identity.mcpDependencies?.map(m => m.id) || [])],
          metadata: {
            os: instance.os,
            status: 'Running',
            audit_logs: instance.audit_logs
          }
        });
      });

      identity.mcpDependencies?.forEach((mcp, mcpIdx) => {
        const mcpAngle = angle + (mcpIdx - (identity.mcpDependencies?.length || 0) / 2) * 0.4;
        const mcpRadius = radius + 260;
        const mcpX = centerX + Math.cos(mcpAngle) * mcpRadius;
        const mcpY = centerY + Math.sin(mcpAngle) * mcpRadius;

        const existingMcp = graphNodes.find(n => n.id === mcp.id);
        if (!existingMcp) {
          graphNodes.push({
            id: mcp.id,
            type: 'mcp',
            label: mcp.name,
            x: mcpX,
            y: mcpY,
            size: 60,
            color: '#ea580c',
            icon: 'boxes',
            connections: [...identity.instances.map(i => i.id), ...mcp.systems.map(s => s.id)],
            metadata: {
              server_type: mcp.server_type,
              provider: mcp.provider,
              status: 'Connected'
            }
          });
        }

        mcp.systems.forEach((system, sysIdx) => {
          const sysAngle = mcpAngle + (sysIdx - mcp.systems.length / 2) * 0.25;
          const sysRadius = mcpRadius + 110;
          const sysX = centerX + Math.cos(sysAngle) * sysRadius;
          const sysY = centerY + Math.sin(sysAngle) * sysRadius;

          const existingSystem = graphNodes.find(n => n.id === system.id);
          if (!existingSystem) {
            graphNodes.push({
              id: system.id,
              type: 'system',
              label: system.name,
              x: sysX,
              y: sysY,
              size: 55,
              color: '#059669',
              icon: 'database',
              connections: [mcp.id],
              metadata: {
                system_type: system.system_type,
                provider: system.provider,
                status: 'Live'
              }
            });
          }
        });
      });

      identity.agentDependencies?.forEach((agent, agIdx) => {
        const agAngle = angle + (agIdx - (identity.agentDependencies?.length || 0) / 2) * 0.5;
        const agRadius = radius + 150;
        const agX = centerX + Math.cos(agAngle) * agRadius;
        const agY = centerY + Math.sin(agAngle) * agRadius;

        const existingAgent = graphNodes.find(n => n.id === agent.id);
        if (!existingAgent) {
          graphNodes.push({
            id: agent.id,
            type: 'agent',
            label: agent.name,
            x: agX,
            y: agY,
            size: 50,
            color: '#6366f1',
            icon: 'network',
            connections: [identity.id],
            metadata: {
              region: agent.region,
              provider: agent.provider,
              status: 'Active',
              rules: agent.typeRules.length
            }
          });
        }
      });
    });

    stats.totalNodes = graphNodes.length;
    stats.totalConnections = graphNodes.reduce((acc, node) => acc + node.connections.length, 0);

    setNodes(graphNodes);
  }, [data]);

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'bot': return Bot;
      case 'shield': return ShieldCheck;
      case 'container': return Container;
      case 'boxes': return Boxes;
      case 'database': return HardDrive;
      case 'network': return Network;
      default: return Bot;
    }
  };

  const isConnected = (nodeId: string) => {
    if (!hoveredNode && !selectedNode) return false;
    const activeNode = selectedNode || hoveredNode;
    const node = nodes.find(n => n.id === activeNode);
    if (!node) return false;
    return node.connections.includes(nodeId) || nodeId === activeNode;
  };

  const getNodeDetails = (node: GraphNode) => {
    const details: string[] = [];
    if (node.metadata?.region) details.push(`Region: ${node.metadata.region}`);
    if (node.metadata?.tenant) details.push(`Tenant: ${node.metadata.tenant}`);
    if (node.metadata?.idp_type) details.push(`IDP: ${node.metadata.idp_type}`);
    if (node.metadata?.server_type) details.push(`Type: ${node.metadata.server_type}`);
    if (node.metadata?.system_type) details.push(`Type: ${node.metadata.system_type}`);
    if (node.metadata?.provider) details.push(`Provider: ${node.metadata.provider}`);
    if (node.metadata?.os) details.push(`OS: ${node.metadata.os}`);
    if (node.metadata?.rules !== undefined) details.push(`Rules: ${node.metadata.rules}`);
    if (node.metadata?.audit_logs) {
      details.push(`Approved: ${node.metadata.audit_logs.approved}`);
      details.push(`Blocked: ${node.metadata.audit_logs.blocked}`);
    }
    if (node.metadata?.status) details.push(`Status: ${node.metadata.status}`);
    return details;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Policy Graph Visualization</h2>
        <p className="text-sm text-gray-600 mt-1">Interactive network graph showing access relationships across agents, identities, instances, MCP servers, and backend systems</p>
      </div>

      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 overflow-hidden" style={{ height: '700px' }}>
        <svg width="100%" height="100%" className="absolute inset-0" viewBox="0 0 1200 700">
          <defs>
            <linearGradient id="agentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="serviceNowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="1" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="s4Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="1" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="aribaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="awsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="1" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
            </filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="connections">
            <path d="M 600 350 L 280 200" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="8,4" opacity="0.5" />
            <path d="M 600 350 L 920 200" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="8,4" opacity="0.5" />
            <path d="M 600 350 L 280 500" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="8,4" opacity="0.5" />
            <path d="M 600 350 L 920 500" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="8,4" opacity="0.5" />
          </g>

          <g className="agent-identity" transform="translate(600, 350)">
            <circle r="85" fill="url(#agentGradient)" filter="url(#shadow)" />
            <circle r="85" fill="none" stroke="white" strokeWidth="4" opacity="0.3" />
            <circle r="75" fill="none" stroke="white" strokeWidth="2" opacity="0.5" strokeDasharray="4,4">
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 0 0"
                to="360 0 0"
                dur="30s"
                repeatCount="indefinite"
              />
            </circle>

            <g transform="translate(-20, -25)">
              <circle cx="20" cy="15" r="12" fill="white" opacity="0.9" />
              <circle cx="20" cy="15" r="8" fill="#1d4ed8" />
              <rect x="8" y="30" width="24" height="28" rx="3" fill="white" opacity="0.9" />
              <rect x="10" y="32" width="20" height="24" rx="2" fill="#1d4ed8" />
              <rect x="14" y="40" width="4" height="8" fill="white" opacity="0.8" />
              <rect x="22" y="40" width="4" height="8" fill="white" opacity="0.8" />
            </g>

            <text y="55" textAnchor="middle" className="text-base font-bold" fill="white">Agentic</text>
            <text y="72" textAnchor="middle" className="text-base font-bold" fill="white">Identity</text>

            <circle cx="0" cy="-65" r="8" fill="#10b981">
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>

          <g className="servicenow-system" transform="translate(280, 200)">
            <rect x="-90" y="-70" width="180" height="140" rx="12" fill="url(#serviceNowGradient)" filter="url(#shadow)" />
            <rect x="-90" y="-70" width="180" height="140" rx="12" fill="none" stroke="white" strokeWidth="3" opacity="0.2" />

            <g transform="translate(-25, -35)">
              <rect x="15" y="15" width="20" height="20" rx="2" fill="white" opacity="0.9" />
              <path d="M 20 25 L 25 30 L 30 20" stroke="#0d9488" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            <text y="-5" textAnchor="middle" className="text-sm font-bold" fill="white">ServiceNow</text>

            <rect x="-75" y="15" width="150" height="40" rx="6" fill="white" fillOpacity="0.15" />
            <text y="32" textAnchor="middle" className="text-xs font-semibold" fill="white">incident:create</text>
            <text y="46" textAnchor="middle" className="text-xs font-semibold" fill="white">ticket:read</text>
          </g>

          <g className="s4-system" transform="translate(920, 200)">
            <rect x="-90" y="-70" width="180" height="140" rx="12" fill="url(#s4Gradient)" filter="url(#shadow)" />
            <rect x="-90" y="-70" width="180" height="140" rx="12" fill="none" stroke="white" strokeWidth="3" opacity="0.2" />

            <g transform="translate(-20, -35)">
              <rect x="10" y="15" width="20" height="25" rx="2" fill="white" opacity="0.9" />
              <line x1="15" y1="22" x2="25" y2="22" stroke="#0284c7" strokeWidth="2" />
              <line x1="15" y1="28" x2="25" y2="28" stroke="#0284c7" strokeWidth="2" />
              <line x1="15" y1="34" x2="25" y2="34" stroke="#0284c7" strokeWidth="2" />
            </g>

            <text y="-5" textAnchor="middle" className="text-sm font-bold" fill="white">SAP S/4HANA</text>

            <rect x="-75" y="15" width="150" height="40" rx="6" fill="white" fillOpacity="0.15" />
            <text y="32" textAnchor="middle" className="text-xs font-semibold" fill="white">order:read</text>
            <text y="46" textAnchor="middle" className="text-xs font-semibold" fill="white">material:query</text>
          </g>

          <g className="ariba-system" transform="translate(280, 500)">
            <rect x="-90" y="-70" width="180" height="140" rx="12" fill="url(#aribaGradient)" filter="url(#shadow)" />
            <rect x="-90" y="-70" width="180" height="140" rx="12" fill="none" stroke="white" strokeWidth="3" opacity="0.2" />

            <g transform="translate(-20, -35)">
              <circle cx="20" cy="25" r="10" fill="white" opacity="0.9" />
              <path d="M 20 20 L 20 30 M 15 25 L 25 25" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            <text y="-5" textAnchor="middle" className="text-sm font-bold" fill="white">SAP Ariba</text>

            <rect x="-75" y="15" width="150" height="40" rx="6" fill="white" fillOpacity="0.15" />
            <text y="32" textAnchor="middle" className="text-xs font-semibold" fill="white">PO:create</text>
            <text y="46" textAnchor="middle" className="text-xs font-semibold" fill="white">supplier:manage</text>
          </g>

          <g className="aws-system" transform="translate(920, 500)">
            <rect x="-90" y="-70" width="180" height="140" rx="12" fill="url(#awsGradient)" filter="url(#shadow)" />
            <rect x="-90" y="-70" width="180" height="140" rx="12" fill="none" stroke="white" strokeWidth="3" opacity="0.2" />

            <g transform="translate(-20, -35)">
              <path d="M 10 25 L 20 15 L 30 25 L 20 35 Z" fill="white" opacity="0.9" />
              <path d="M 20 22 L 20 28" stroke="#ea580c" strokeWidth="2" />
              <circle cx="20" cy="20" r="2" fill="#ea580c" />
            </g>

            <text y="-5" textAnchor="middle" className="text-sm font-bold" fill="white">AWS</text>

            <rect x="-75" y="15" width="150" height="40" rx="6" fill="white" fillOpacity="0.15" />
            <text y="32" textAnchor="middle" className="text-xs font-semibold" fill="white">s3:upload</text>
            <text y="46" textAnchor="middle" className="text-xs font-semibold" fill="white">lambda:invoke</text>
          </g>

          <g className="legend" transform="translate(60, 620)">
            <rect x="0" y="0" width="280" height="60" rx="8" fill="white" fillOpacity="0.95" filter="url(#shadow)" />
            <text x="15" y="20" className="text-xs font-bold" fill="#374151">Permission Types</text>
            <g transform="translate(15, 30)">
              <circle cx="5" cy="5" r="4" fill="#10b981" />
              <text x="15" y="9" className="text-xs" fill="#6b7280">Read Access</text>
              <circle cx="85" cy="5" r="4" fill="#3b82f6" />
              <text x="95" y="9" className="text-xs" fill="#6b7280">Write Access</text>
              <circle cx="175" cy="5" r="4" fill="#f59e0b" />
              <text x="185" y="9" className="text-xs" fill="#6b7280">Admin Access</text>
            </g>
          </g>
        </svg>

        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border-2 border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Node Types
          </div>
          <div className="space-y-2.5">
            {[
              { icon: Bot, label: 'Primary Agent', color: '#3b82f6', desc: 'Main orchestrator' },
              { icon: ShieldCheck, label: 'Identity', color: '#9333ea', desc: 'Auth provider' },
              { icon: Container, label: 'Instance', color: '#0891b2', desc: 'Runtime pod' },
              { icon: Boxes, label: 'MCP Server', color: '#ea580c', desc: 'Integration layer' },
              { icon: HardDrive, label: 'System', color: '#059669', desc: 'Backend service' },
              { icon: Network, label: 'Linked Agent', color: '#6366f1', desc: 'Cross-agent ref' }
            ].map(({ icon: Icon, label, color, desc }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: color }}>
                  <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-900">{label}</span>
                  <span className="text-xs text-gray-500">{desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Inactive</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border-2 border-gray-200 px-4 py-3">
          <div className="text-xs font-semibold text-gray-900 mb-1">
            {selectedNode ? 'Node Selected' : 'Interactive Mode'}
          </div>
          <div className="text-xs text-gray-600">
            {selectedNode ? 'Click to deselect • Hover for more' : 'Click or hover nodes to explore connections'}
          </div>
        </div>

        <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg border-2 border-blue-200 px-4 py-3">
          <div className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" />
            {data.name}
          </div>
          <div className="text-xs text-gray-600">
            {data.region} • {data.provider} • {data.identities.length} Identities
          </div>
        </div>

        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border-2 border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Network Statistics
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div className="flex flex-col">
              <span className="text-gray-500">Total Nodes</span>
              <span className="font-bold text-gray-900">{stats.totalNodes}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Connections</span>
              <span className="font-bold text-gray-900">{stats.totalConnections}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Identities</span>
              <span className="font-bold text-purple-600">{stats.identities}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Instances</span>
              <span className="font-bold text-cyan-600">{stats.instances}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">MCP Servers</span>
              <span className="font-bold text-orange-600">{stats.mcpServers}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Systems</span>
              <span className="font-bold text-emerald-600">{stats.systems}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">Audit Logs</div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Approved:</span>
                <span className="font-bold text-green-600">{stats.totalAuditLogs.approved}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Blocked:</span>
                <span className="font-bold text-red-600">{stats.totalAuditLogs.blocked}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
