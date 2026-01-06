export type DiscoveryType = 'series' | 'api_library' | 'ai_tip' | 'gadget' | 'other';

export interface Discovery {
  id: string;
  type: DiscoveryType;
  name: string;
  description: string | null;
  link: string | null;
  metadata: Record<string, string | null> | null;
  image_url: string | null;
  created_at: string;
}

export interface DiscoveryInfo {
  description: string;
  link: string;
  metadata: Record<string, string>;
}

export const DISCOVERY_TYPES: { value: DiscoveryType; label: string }[] = [
  { value: 'series', label: 'Series / Media' },
  { value: 'api_library', label: 'API / Library' },
  { value: 'ai_tip', label: 'AI Tips' },
  { value: 'gadget', label: 'Tech Gadgets' },
  { value: 'other', label: 'Other' },
];

export const DISCOVERY_TYPE_LABELS: Record<DiscoveryType, string> = {
  series: 'Series',
  api_library: 'API',
  ai_tip: 'AI Tip',
  gadget: 'Gadget',
  other: 'Other',
};
