import { useState } from "react";
import NetworkGraph from "./graph";
import IdentityFlow from "./header";
import AgentSelector from "./AgentSelector";
import  { type AgentConfig ,agents, agentData} from "./agentData";

export default function Network() {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(agentData);
 
  const handleSelectAgent = (agent: AgentConfig | null) => {
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
          {selectedAgent ? (
            <>
              <IdentityFlow data={agentData} />
              <NetworkGraph data={agentData} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">No agent selected</p>
                <p className="text-gray-400 text-sm">Select an agent from the sidebar to view its network</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}