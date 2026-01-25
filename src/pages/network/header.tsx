import { Bot, ShieldCheck, Container, Boxes, HardDrive, ArrowRight } from 'lucide-react';
import { AgentConfig } from './agentData';

interface IdentityFlowProps {
  data: AgentConfig;
}

export default function IdentityFlow({ data }: IdentityFlowProps) {
  const totalInstances = data.identities.reduce((acc, identity) => acc + identity.instances.length, 0);
  const totalMcpServers = new Set(data.identities.flatMap(identity => identity.mcpDependencies?.map(mcp => mcp.id) || [])).size;
  const totalSystems = new Set(data.identities.flatMap(identity =>
    identity.mcpDependencies?.flatMap(mcp => mcp.systems.map(sys => sys.id)) || []
  )).size;
  const totalRules = data.rules.length;

  const flowSteps = [
    {
      icon: Bot,
      label: 'Agent',
      sublabel: data.type,
      detail: `${data.region} · ${data.provider}`,
      color: 'bg-blue-100 text-blue-600',
      borderColor: 'border-blue-300',
      count: `${totalRules} rules`,
      badge: data.region
    },
    {
      icon: ShieldCheck,
      label: 'Identities',
      sublabel: 'Multi-Cloud Auth',
      detail: `${data.identities.length} identities`,
      color: 'bg-purple-100 text-purple-600',
      borderColor: 'border-purple-300',
      count: `${data.identities.length} identities`,
      badge: 'Active'
    },
    {
      icon: Container,
      label: 'Instances',
      sublabel: 'Runtime Pods',
      detail: `${totalInstances} active pods`,
      color: 'bg-cyan-100 text-cyan-600',
      borderColor: 'border-cyan-300',
      count: `${totalInstances} pods`,
      badge: 'Running'
    },
    {
      icon: Boxes,
      label: 'MCP Servers',
      sublabel: 'Integration Layer',
      detail: `${totalMcpServers} endpoints`,
      color: 'bg-orange-100 text-orange-600',
      borderColor: 'border-orange-300',
      count: `${totalMcpServers} servers`,
      badge: 'Connected'
    },
    {
      icon: HardDrive,
      label: 'Systems',
      sublabel: 'Backend Services',
      detail: `${totalSystems} systems`,
      color: 'bg-emerald-100 text-emerald-600',
      borderColor: 'border-emerald-300',
      count: `${totalSystems} systems`,
      badge: 'Live'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Identity Flow</h2>
        <p className="text-sm text-gray-600 mt-1">
          End-to-end access path from {data.name} through identities to backend systems
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        {flowSteps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex flex-col items-center group relative">
              <div className={`${step.color} ${step.borderColor} border-2 rounded-2xl p-6 mb-3 transition-all hover:shadow-lg hover:scale-105 relative`}>
                <step.icon className="w-8 h-8" strokeWidth={2} />
                <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${step.color} border ${step.borderColor}`}>
                  {step.badge}
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-900 mb-1">{step.count}</div>
              <div className="text-sm font-semibold text-gray-900">{step.label}</div>
              <div className="text-xs text-gray-600">{step.sublabel}</div>
              <div className="text-xs text-gray-500 mt-1">{step.detail}</div>

              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10 pointer-events-none">
                {step.sublabel}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>

            {index < flowSteps.length - 1 && (
              <div className="flex flex-col items-center mt-[-40px]">
                <ArrowRight className="w-6 h-6 text-orange-500" strokeWidth={2.5} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
