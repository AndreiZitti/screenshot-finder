export interface NotionConnection {
  id: string;
  user_id: string;
  name: string;
  api_key: string;
  page_id: string;
  page_name: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotionConnectionInput {
  name: string;
  api_key: string;
  page_id: string;
  page_name?: string;
  is_default?: boolean;
}
