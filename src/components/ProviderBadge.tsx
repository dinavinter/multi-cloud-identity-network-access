interface ProviderBadgeProps {
  provider: string;
}

export function ProviderBadge({ provider }: ProviderBadgeProps) {
  const getProviderColor = (provider: string) => {
    const providerLower = provider.toLowerCase();
    if (providerLower.includes('sap')) return 'bg-[#0854A0] text-white';
    if (providerLower.includes('microsoft') || providerLower.includes('azure')) return 'bg-[#00A4EF] text-white';
    if (providerLower.includes('servicenow') || providerLower.includes('snow')) return 'bg-[#62D84E] text-white';
    if (providerLower.includes('aws')) return 'bg-[#FF9900] text-white';
    if (providerLower.includes('salesforce') || providerLower.includes('sfdc')) return 'bg-[#00A1E0] text-white';
    if (providerLower.includes('google') || providerLower.includes('gcp')) return 'bg-[#EA4335] text-white';
    return 'bg-gray-200 text-gray-800';
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getProviderColor(provider)}`}>
      {provider}
    </span>
  );
}
