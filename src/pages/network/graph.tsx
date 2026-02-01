import { useState } from 'react';
import { Search, History, Clock, Filter, Save, Share, Camera, Grid3X3 } from 'lucide-react';
import { AgentType } from './agentData';

interface IdentityFlowProps {
  data: AgentType;
}

// SVG Icons for systems
const AgentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <rect x="3" y="3" width="18" height="18" rx="3" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5"/>
    <circle cx="9" cy="10" r="2" fill="#0284c7"/>
    <circle cx="15" cy="10" r="2" fill="#0284c7"/>
    <path d="M8 15c0 0 2 2 4 2s4-2 4-2" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ServiceNowIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" fill="#81b5a1"/>
    <path d="M12 6C8.7 6 6 8.7 6 12s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="white"/>
  </svg>
);

const SAPS4Icon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#1661be"/>
    <text x="12" y="14" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">S/4</text>
  </svg>
);

const AribaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" fill="#f47920"/>
    <text x="12" y="15" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">A</text>
  </svg>
);

const AWSIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.296.072-.583.16-.862.272-.128.056-.224.088-.28.095a.49.49 0 0 1-.12.016c-.16 0-.24-.115-.24-.344v-.406c0-.176.024-.31.072-.391a.753.753 0 0 1 .304-.24 6.366 6.366 0 0 1 2.168-.503c1.11 0 1.924.252 2.435.758.502.506.759 1.277.759 2.315v3.05h.007zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.343c0-.136.072-.208.216-.208h.783c.15 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.064.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.144 0 .224.064.224.208 0 .04-.008.08-.016.128a1.137 1.137 0 0 1-.056.216l-1.923 6.17c-.048.16-.104.264-.168.312a.509.509 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08h-.687zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.23.088-.344.256-.344.064 0 .128.008.192.024.064.016.16.048.264.088.351.152.734.272 1.142.359.415.088.822.128 1.237.128.654 0 1.165-.112 1.517-.336.351-.223.535-.56.535-.999 0-.295-.095-.535-.287-.72-.191-.184-.55-.335-1.069-.479l-1.533-.479c-.775-.248-1.349-.615-1.7-1.101-.351-.487-.526-1.03-.526-1.613 0-.463.103-.879.303-1.237.2-.367.471-.679.814-.925.343-.255.743-.447 1.206-.566A5.64 5.64 0 0 1 17.49 4c.264 0 .535.016.798.048.272.032.527.08.782.136.24.056.463.12.67.191.207.072.359.144.454.224a.914.914 0 0 1 .24.232.585.585 0 0 1 .071.295v.375c0 .23-.088.344-.248.344a1.13 1.13 0 0 1-.4-.12 4.796 4.796 0 0 0-2.016-.399c-.598 0-1.07.088-1.397.28-.328.191-.495.479-.495.886 0 .296.104.551.304.751.2.2.59.399 1.165.575l1.502.455c.767.248 1.325.59 1.66 1.03.335.438.495.934.495 1.493 0 .471-.095.903-.287 1.277-.2.383-.47.71-.822.983-.352.272-.775.48-1.269.623a5.85 5.85 0 0 1-1.62.216z" fill="#252f3e"/>
    <path d="M21.725 17.837c-2.616 1.933-6.413 2.962-9.682 2.962-4.58 0-8.707-1.693-11.828-4.51-.247-.223-.024-.527.271-.351 3.369 1.957 7.537 3.138 11.844 3.138 2.904 0 6.098-.599 9.035-1.844.447-.183.814.296.36.605z" fill="#ff9900"/>
  </svg>
);

// Node card component
const NodeCard = ({ 
  icon, 
  label, 
  bgColor = 'bg-gray-50',
  borderColor = 'border-gray-200',
  textColor = 'text-gray-700'
}: { 
  icon: React.ReactNode; 
  label: string;
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
}) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColor} ${borderColor} shadow-sm`}>
    {icon}
    <span className={`text-sm font-medium ${textColor}`}>{label}</span>
  </div>
);

// Permission badge component
const PermissionBadge = ({ permissions }: { permissions: string[] }) => (
  <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm">
    {permissions.map((perm, idx) => (
      <span key={idx} className="text-xs font-medium text-gray-600">{perm}</span>
    ))}
  </div>
);

// Resource badge component (blue pill style like the reference image)
const ResourceBadge = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white shadow-md">
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default function NetworkGraph({ data }: IdentityFlowProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Define the permission graph data
  const graphData = [
    {
      identity: { name: 'Procurement Agent', type: 'agent' },
      system: { name: 'ServiceNow', icon: <ServiceNowIcon /> },
      permissions: ['ticket:create', 'ticket:read', 'approval:submit'],
      resource: { name: 'IT-Requests', icon: <ServiceNowIcon /> }
    },
    {
      identity: { name: 'Procurement Agent', type: 'agent' },
      system: { name: 'SAP S/4', icon: <SAPS4Icon /> },
      permissions: ['order:read', 'inventory:read'],
      resource: { name: 'Sales-Orders', icon: <SAPS4Icon /> }
    },
    {
      identity: { name: 'Finance Agent', type: 'agent' },
      system: { name: 'SAP Ariba', icon: <AribaIcon /> },
      permissions: ['PO:create', 'PO:approve', 'vendor:read'],
      resource: { name: 'Purchase-Orders', icon: <AribaIcon /> }
    },
    {
      identity: { name: 'Data Agent', type: 'agent' },
      system: { name: 'AWS', icon: <AWSIcon /> },
      permissions: ['s3:upload', 's3:read', 'lambda:invoke'],
      resource: { name: 'Data-Lake', icon: <AWSIcon /> }
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header with search and actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Access Graph"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
            <History className="w-4 h-4" />
            <span>Graph History</span>
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <button className="p-1.5 hover:bg-gray-100 rounded"><Clock className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><Filter className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><Save className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><Share className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><Camera className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><Grid3X3 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-5 gap-8 mb-6 px-4">
        <div className="text-sm font-semibold text-gray-900">Agentic Identities</div>
        <div className="text-sm font-semibold text-gray-900">Systems</div>
        <div className="text-sm font-semibold text-gray-900">Permissions</div>
        <div className="text-sm font-semibold text-gray-900 col-span-2">Resources</div>
      </div>

      {/* Graph Visualization */}
      <div className="relative">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ height: '320px' }}>
          {/* Connection lines */}
          {graphData.map((row, idx) => {
            const yOffset = 40 + idx * 75;
            const isHovered = hoveredRow === idx;
            const strokeColor = isHovered ? '#3b82f6' : '#d1d5db';
            const strokeWidth = isHovered ? 2 : 1.5;
            
            return (
              <g key={idx}>
                {/* Identity to System */}
                <path
                  d={`M 140 ${yOffset} C 180 ${yOffset}, 200 ${yOffset}, 240 ${yOffset}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-200"
                />
                {/* Connector dots */}
                <circle cx="140" cy={yOffset} r="3" fill={strokeColor} className="transition-all duration-200" />
                <circle cx="240" cy={yOffset} r="3" fill={strokeColor} className="transition-all duration-200" />
                
                {/* System to Permissions */}
                <path
                  d={`M 340 ${yOffset} C 380 ${yOffset}, 400 ${yOffset}, 440 ${yOffset}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-200"
                />
                <circle cx="340" cy={yOffset} r="3" fill={strokeColor} className="transition-all duration-200" />
                <circle cx="440" cy={yOffset} r="3" fill={strokeColor} className="transition-all duration-200" />
                
                {/* Permissions to Resources */}
                <path
                  d={`M 560 ${yOffset} C 600 ${yOffset}, 620 ${yOffset}, 660 ${yOffset}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-200"
                />
                <circle cx="560" cy={yOffset} r="3" fill={strokeColor} className="transition-all duration-200" />
                <circle cx="660" cy={yOffset} r="3" fill={strokeColor} className="transition-all duration-200" />
              </g>
            );
          })}
        </svg>

        {/* Data rows */}
        <div className="relative space-y-4" style={{ minHeight: '320px' }}>
          {graphData.map((row, idx) => (
            <div 
              key={idx}
              className="grid grid-cols-5 gap-8 items-center px-4 py-2 rounded-lg transition-colors duration-200"
              style={{ backgroundColor: hoveredRow === idx ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}
              onMouseEnter={() => setHoveredRow(idx)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Identity */}
              <NodeCard 
                icon={<AgentIcon />}
                label={row.identity.name}
                bgColor="bg-blue-50"
                borderColor="border-blue-200"
                textColor="text-blue-700"
              />
              
              {/* System */}
              <NodeCard 
                icon={row.system.icon}
                label={row.system.name}
                bgColor="bg-gray-50"
                borderColor="border-gray-200"
                textColor="text-gray-700"
              />
              
              {/* Permissions */}
              <PermissionBadge permissions={row.permissions} />
              
              {/* Resource */}
              <div className="col-span-2">
                <ResourceBadge 
                  icon={row.resource.icon}
                  label={row.resource.name}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
            <span>Agentic Identity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></div>
            <span>External System</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Resource</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <span>Access Path</span>
          </div>
        </div>
      </div>
    </div>
  );
}
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
