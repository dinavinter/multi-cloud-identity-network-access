import { Menu, Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#0854A0]">Agent Access Control</span>
            <span className="text-sm text-gray-500">Multi-Cloud Identity Network Governance</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <div className="w-8 h-8 bg-[#0854A0] rounded-full flex items-center justify-center text-white text-sm font-medium">
              UI
            </div>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-8 px-6">
        <button
          onClick={() => onNavigate('home')}
          className="pb-3 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Home
        </button>
        <button
          onClick={() => onNavigate('agent-access-network')}
          className={`pb-3 text-sm font-medium ${
            currentPage === 'agent-access-network'
              ? 'text-[#0854A0] border-b-2 border-[#0854A0]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Agent Access Network
        </button>

        <button
          onClick={() => onNavigate('agents')}
          className={`pb-3 text-sm font-medium ${
            currentPage === 'agents' || currentPage === 'agent-detail'
              ? 'text-[#0854A0] border-b-2 border-[#0854A0]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Identities
        </button>
        <button
          onClick={() => onNavigate('meta-policies')}
          className={`pb-3 text-sm font-medium ${
            currentPage === 'meta-policies'
              ? 'text-[#0854A0] border-b-2 border-[#0854A0]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Meta Policies
        </button>
        <button
          onClick={() => onNavigate('permissions-graph')}
          className={`pb-3 text-sm font-medium ${
            currentPage === 'permissions-graph'
              ? 'text-[#0854A0] border-b-2 border-[#0854A0]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Permissions Graph
        </button>
      </div>
    </div>
  );
}
