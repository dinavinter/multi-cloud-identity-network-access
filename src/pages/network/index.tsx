import { agentData } from "./agentData";
import NetworkGraph from "./graph";
import IdentityFlow from "./header";

export default function Network() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
    <IdentityFlow data={agentData} />
    <NetworkGraph data={agentData} />
  </main>

  );
}