import { supabase } from './supabaseClient';
import { Resume } from '../types';

export const supabaseService = {
  // --- Auth Functions ---

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // --- Database Functions ---

  async saveResume(resume: Resume) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    // Assuming a 'resumes' table exists with:
    // id (uuid), user_id (uuid), name (text), content (jsonb), updated_at (timestamp)
    const { data, error } = await supabase
      .from('resumes')
      .upsert({
        id: resume.id,
        user_id: user.id,
        name: resume.name,
        content: resume, // Storing full resume object in a JSONB column
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async fetchResumes(): Promise<Resume[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('resumes')
      .select('content')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Map the DB result back to Resume objects
    return data.map((item: any) => item.content as Resume);
  },

  async deleteResume(resumeId: string) {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);
      
    if (error) throw error;
  }
};