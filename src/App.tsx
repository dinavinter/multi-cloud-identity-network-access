import { useState } from 'react';
import { Header } from './components/Header';
import { AgentListPage } from './pages/AgentListPage';
import { AgentDetailPage } from './pages/AgentDetailPage';
import { MetaPoliciesPage } from './pages/MetaPoliciesPage';
import { PermissionsGraphPage } from './pages/PermissionsGraphPage';

type Page = 'home' | 'agents' | 'agent-detail' | 'meta-policies' | 'permissions-graph';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('agents');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setCurrentPage('agent-detail');
  };

  const handleBackToAgents = () => {
    setCurrentPage('agents');
    setSelectedAgentId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      {currentPage === 'agents' && (
        <AgentListPage onSelectAgent={handleSelectAgent} />
      )}

      {currentPage === 'agent-detail' && selectedAgentId && (
        <AgentDetailPage agentId={selectedAgentId} onBack={handleBackToAgents} />
      )}

      {currentPage === 'meta-policies' && <MetaPoliciesPage />}

      {currentPage === 'permissions-graph' && <PermissionsGraphPage />}
    </div>
  );
}

export default App;
