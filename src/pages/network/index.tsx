import { useState } from "react";
import NetworkGraph from "./graph";
import IdentityFlow from "./header";
import AgentSelector from "./AgentSelector";
import { type AgentType, agents, agentData } from "./agentData";

export default function Network() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(agentData);

  const handleSelectAgent = (agent: AgentType | null) => {
    setSelectedAgent(agent);
  };

  return (
    <main className="max-w-screen mx-auto px-6 py-8">
      <div className="flex gap-6 h-[calc(100vh-4rem)]">
        {/* Agent Selector Sidebar */}
        <div className="w-80 flex-shrink-0">
          <AgentSelector
            selectedAgentId={selectedAgent?.id || null}
            onSelectAgent={handleSelectAgent}
            agents={agents}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto space-y-8">
          <IdentityFlow data={agentData} />
          <NetworkGraph data={agentData} />
        </div>
      </div>
    </main>
  );
}