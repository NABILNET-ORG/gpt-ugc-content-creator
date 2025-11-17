import { supabase } from '../config/supabase';
import { User, Project, Video, Payment, Credits, AvatarSettings, ProjectStatus, PaymentStatus } from '../types';

// ==================== USERS ====================

export async function findUserByExternalId(externalId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('external_id', externalId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

export async function createUser(externalId: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({ external_id: externalId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function findOrCreateUser(externalId: string): Promise<User> {
  let user = await findUserByExternalId(externalId);
  if (!user) {
    user = await createUser(externalId);
    // Initialize credits for new user
    await initializeCredits(user.id);
  }
  return user;
}

// ==================== PROJECTS ====================

export async function createProject(params: {
  userId: string;
  productUrl: string;
  status?: ProjectStatus;
}): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: params.userId,
      product_url: params.productUrl,
      status: params.status || 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId);

  if (error) throw error;
}

export async function updateProjectAvatarSettings(
  projectId: string,
  avatarSettings: AvatarSettings
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ avatar_settings: avatarSettings })
    .eq('id', projectId);

  if (error) throw error;
}

export async function updateProjectScript(projectId: string, scriptText: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ script_text: scriptText })
    .eq('id', projectId);

  if (error) throw error;
}

export async function updateProject(
  projectId: string,
  updates: {
    status?: ProjectStatus;
    avatar_settings?: AvatarSettings;
    script_text?: string;
  }
): Promise<void> {
  const { error } = await supabase.from('projects').update(updates).eq('id', projectId);

  if (error) throw error;
}

// ==================== VIDEOS ====================

export async function getVideoByProjectAndSession(
  projectId: string,
  stripeSessionId: string
): Promise<Video | null> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('project_id', projectId)
    .eq('stripe_session_id', stripeSessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function createVideo(params: {
  projectId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  stripeSessionId?: string;
}): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      project_id: params.projectId,
      video_url: params.videoUrl,
      thumbnail_url: params.thumbnailUrl,
      duration_seconds: params.durationSeconds,
      stripe_session_id: params.stripeSessionId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== PAYMENTS ====================

export async function createPayment(params: {
  userId: string;
  projectId?: string | null;
  stripeSessionId: string;
  status: PaymentStatus;
  plan?: string;
  amount?: number;
  currency?: string;
}): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: params.userId,
      project_id: params.projectId,
      stripe_session_id: params.stripeSessionId,
      status: params.status,
      plan: params.plan,
      amount: params.amount,
      currency: params.currency || 'usd',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPaymentBySessionId(stripeSessionId: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('stripe_session_id', stripeSessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function updatePaymentStatus(
  stripeSessionId: string,
  status: PaymentStatus
): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('stripe_session_id', stripeSessionId);

  if (error) throw error;
}

// ==================== CREDITS ====================

export async function initializeCredits(userId: string): Promise<void> {
  const { error } = await supabase.from('credits').insert({
    user_id: userId,
    credits: 0,
  });

  if (error && error.code !== '23505') {
    // Ignore unique constraint violation
    throw error;
  }
}

export async function getUserCredits(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('credits')
    .select('credits')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No credits record, initialize
      await initializeCredits(userId);
      return 0;
    }
    throw error;
  }

  return data.credits;
}

export async function incrementUserCredits(userId: string, amount: number): Promise<void> {
  const currentCredits = await getUserCredits(userId);
  const newCredits = currentCredits + amount;

  const { error } = await supabase
    .from('credits')
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw error;
}

export async function decrementUserCredits(userId: string, amount: number): Promise<void> {
  await incrementUserCredits(userId, -amount);
}
