import { LucideIcon } from 'lucide-react';
import { MessageSquare, Search, Image, Users, Bell, FileText } from 'lucide-react';

type EmptyStateVariant = 'no-conversations' | 'no-messages' | 'no-search-results' | 'no-media' | 'no-contacts' | 'no-notifications' | 'no-files';

const variantConfig: Record<EmptyStateVariant, { Icon: LucideIcon; title: string; description: string }> = {
  'no-conversations': {
    Icon: MessageSquare,
    title: 'No conversations yet',
    description: 'Start a new conversation to connect with someone.',
  },
  'no-messages': {
    Icon: MessageSquare,
    title: 'Start a conversation',
    description: 'Send a message to start chatting securely.',
  },
  'no-search-results': {
    Icon: Search,
    title: 'No results found',
    description: 'Try searching with different keywords.',
  },
  'no-media': {
    Icon: Image,
    title: 'No shared media yet',
    description: 'Images and videos shared in this chat will appear here.',
  },
  'no-contacts': {
    Icon: Users,
    title: 'No contacts yet',
    description: 'Search for users to add to your contacts.',
  },
  'no-notifications': {
    Icon: Bell,
    title: 'All caught up',
    description: 'No new notifications right now.',
  },
  'no-files': {
    Icon: FileText,
    title: 'No shared files yet',
    description: 'Files shared in this chat will appear here.',
  },
};

interface EmptyStateProps {
  variant: EmptyStateVariant;
  action?: React.ReactNode;
}

export function EmptyState({ variant, action }: EmptyStateProps) {
  const { Icon, title, description } = variantConfig[variant];

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 px-6 text-center">
      <div className="w-[44px] h-[44px] rounded-[12px] bg-bg-surface border border-border-subtle border-border-subtle flex items-center justify-center mb-4 shadow-sm">
        <Icon size={22} strokeWidth={1.5} className="text-text-sec" />
      </div>
      <h3 className="text-[15px] font-semibold text-text-main mb-1">{title}</h3>
      <p className="text-[13px] text-text-muted max-w-[240px] leading-relaxed mx-auto">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );

}
