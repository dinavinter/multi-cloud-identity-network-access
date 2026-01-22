import { Bot, Server, Database } from 'lucide-react';

type ConceptNode = {
  name: string;
  type: 'agent' | 'mcp' | 'system';
  subType: string;
  provider: string;
};

export function PermissionsGraphPage() {
  const getProviderColor = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('sap')) return '#0854A0';
    if (p.includes('microsoft')) return '#00A4EF';
    if (p.includes('aws')) return '#FF9900';
    if (p.includes('salesforce')) return '#00A1E0';
    if (p.includes('multi-cloud')) return '#6366F1';
    return '#6B7280';
  };

  const lane1: ConceptNode[] = [
    { name: 'Orders Agent', type: 'agent', subType: 'Order Management', provider: 'SAP' },
    { name: 'Expenses Assistant', type: 'agent', subType: 'Expense Management', provider: 'SAP' },
    { name: 'Procurement Agent', type: 'agent', subType: 'Procurement Orchestration', provider: 'SAP' },
    { name: 'Copilot Expense Analyzer', type: 'agent', subType: 'Productivity', provider: 'Microsoft' }
  ];

  const lane2: ConceptNode[] = [
    { name: 'SAP Cloud Platform MCP', type: 'mcp', subType: 'Integration', provider: 'SAP' },
    { name: 'SAP Cloud Platform MCP', type: 'mcp', subType: 'Integration', provider: 'SAP' },
    { name: 'Orders MCP', type: 'mcp', subType: 'Integration', provider: 'SAP' },
    { name: 'Microsoft Graph MCP', type: 'mcp', subType: 'API Gateway', provider: 'Microsoft' }
  ];

  const lane3: ConceptNode[] = [
    { name: 'Finance System', type: 'system', subType: 'Finance', provider: 'SAP' },
    { name: 'Procurement Backend', type: 'system', subType: 'ERP', provider: 'SAP' },
    { name: 'SAP Concur', type: 'system', subType: 'ERP', provider: 'SAP' },
    { name: 'Document Management', type: 'system', subType: 'DMS', provider: 'Microsoft' }
  ];

  const getNodeIcon = (type: 'agent' | 'mcp' | 'system') => {
    switch (type) {
      case 'agent':
        return Bot;
      case 'mcp':
        return Server;
      case 'system':
        return Database;
    }
  };

  const nodeHeight = 90;
  const nodeSpacing = 10;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">Network Topology</h1>
          <p className="text-sm text-gray-600">
            Comprehensive view of agent identities, MCP servers, and system access across the network
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-blue-50">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Agents ({lane1.length})</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-purple-200 bg-purple-50">
              <Server className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">MCP Servers ({lane2.length})</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-200 bg-green-50">
              <Database className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Systems ({lane3.length})</span>
            </div>
          </div>

          <div className="relative" style={{ minHeight: `${lane1.length * (nodeHeight + nodeSpacing) + 40}px` }}>
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <defs>
                <marker
                  id="arrowhead-blue"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#93c5fd" />
                </marker>
                <marker
                  id="arrowhead-green"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#86efac" />
                </marker>
              </defs>

              <line
                x1="32%"
                y1={nodeHeight / 2 + 20}
                x2="38.5%"
                y2={nodeHeight / 2 + 20}
                stroke="#93c5fd"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead-blue)"
              />
              <line
                x1="32%"
                y1={nodeHeight + nodeSpacing + nodeHeight / 2 + 20}
                x2="38.5%"
                y2={nodeHeight + nodeSpacing + nodeHeight / 2 + 20}
                stroke="#93c5fd"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead-blue)"
              />
              <line
                x1="32%"
                y1={(nodeHeight + nodeSpacing) * 2 + nodeHeight / 2 + 20}
                x2="38.5%"
                y2={(nodeHeight + nodeSpacing) * 2 + nodeHeight / 2 + 20}
                stroke="#93c5fd"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead-blue)"
              />
              <line
                x1="32%"
                y1={(nodeHeight + nodeSpacing) * 3 + nodeHeight / 2 + 20}
                x2="38.5%"
                y2={(nodeHeight + nodeSpacing) * 3 + nodeHeight / 2 + 20}
                stroke="#93c5fd"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead-blue)"
              />

              <line
                x1="65%"
                y1={nodeHeight / 2 + 20}
                x2="71.5%"
                y2={nodeHeight / 2 + 20}
                stroke="#86efac"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead-green)"
              />
              <line
                x1="65%"
                y1={nodeHeight + nodeSpacing + nodeHeight / 2 + 20}
                x2="71.5%"
                y2={nodeHeight + nodeSpacing + nodeHeight / 2 + 20}
                stroke="#86efac"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead-green)"
              />
              <line
                x1="65%"
                y1={(nodeHeight + nodeSpacing) * 2 + nodeHeight / 2 + 20}
                x2="71.5%"
                y2={(nodeHeight + nodeSpacing) * 2 + nodeHeight / 2 + 20}
                stroke="#86efac"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead-green)"
              />
              <line
                x1="65%"
                y1={(nodeHeight + nodeSpacing) * 3 + nodeHeight / 2 + 20}
                x2="71.5%"
                y2={(nodeHeight + nodeSpacing) * 3 + nodeHeight / 2 + 20}
                stroke="#86efac"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead-green)"
              />
            </svg>

            <div className="grid grid-cols-3 gap-12" style={{ position: 'relative', zIndex: 2 }}>
              <div className="space-y-2.5">
                {lane1.map((node, idx) => {
                  const Icon = getNodeIcon(node.type);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg p-3 border-2 border-blue-200 bg-blue-50 hover:shadow-md transition-all"
                      style={{ height: `${nodeHeight}px` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className="w-4 h-4"
                          style={{ color: getProviderColor(node.provider) }}
                        />
                        <span className="text-sm font-medium text-gray-900">{node.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">{node.subType}</div>
                      <div
                        className="text-xs px-1.5 py-0.5 rounded inline-block"
                        style={{
                          backgroundColor: `${getProviderColor(node.provider)}20`,
                          color: getProviderColor(node.provider)
                        }}
                      >
                        {node.provider}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                {lane2.map((node, idx) => {
                  const Icon = getNodeIcon(node.type);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg p-3 border-2 border-purple-200 bg-purple-50 hover:shadow-md transition-all"
                      style={{ height: `${nodeHeight}px` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className="w-4 h-4"
                          style={{ color: getProviderColor(node.provider) }}
                        />
                        <span className="text-sm font-medium text-gray-900">{node.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">{node.subType}</div>
                      <div
                        className="text-xs px-1.5 py-0.5 rounded inline-block"
                        style={{
                          backgroundColor: `${getProviderColor(node.provider)}20`,
                          color: getProviderColor(node.provider)
                        }}
                      >
                        {node.provider}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                {lane3.map((node, idx) => {
                  const Icon = getNodeIcon(node.type);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg p-3 border-2 border-green-200 bg-green-50 hover:shadow-md transition-all"
                      style={{ height: `${nodeHeight}px` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className="w-4 h-4"
                          style={{ color: getProviderColor(node.provider) }}
                        />
                        <span className="text-sm font-medium text-gray-900">{node.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">{node.subType}</div>
                      <div
                        className="text-xs px-1.5 py-0.5 rounded inline-block"
                        style={{
                          backgroundColor: `${getProviderColor(node.provider)}20`,
                          color: getProviderColor(node.provider)
                        }}
                      >
                        {node.provider}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Agent Connections</h4>
                <p className="text-xs text-gray-600">
                  4 direct connections to MCP layer
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">MCP Integration</h4>
                <p className="text-xs text-gray-600">
                  4 MCP servers facilitating access
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">System Access</h4>
                <p className="text-xs text-gray-600">
                  4 backend systems integrated
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
