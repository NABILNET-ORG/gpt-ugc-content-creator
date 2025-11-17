export interface User {
  id: string;
  external_id: string;
  created_at: string;
}

export interface AvatarSettings {
  gender?: string;
  ethnicity?: string;
  background?: string;
  vibe?: string;
}

export type ProjectStatus = 'draft' | 'assets_ready' | 'video_ready';

export interface Project {
  id: string;
  user_id: string;
  product_url: string;
  status: ProjectStatus;
  avatar_settings?: AvatarSettings | null;
  script_text?: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  project_id: string;
  video_url: string;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  stripe_session_id?: string | null;
  created_at: string;
}

export type PaymentStatus = 'unpaid' | 'paid' | 'pending' | 'failed';

export interface Payment {
  id: string;
  user_id: string;
  project_id?: string | null;
  stripe_session_id: string;
  status: PaymentStatus;
  plan?: string | null;
  amount?: number | null;
  currency?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Credits {
  id: string;
  user_id: string;
  credits: number;
  updated_at: string;
}
