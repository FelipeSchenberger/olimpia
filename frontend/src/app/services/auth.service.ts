import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qcnvfnoeyftvsjuzjxho.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbnZmbm9leWZ0dnNqdXpqeGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDkwOTMsImV4cCI6MjEwMDIyNTA5M30.zhTDv7nvZJtlp5UzZx-IS8IQT_BowyHrbWgKggsErH0';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;

  currentUser = signal<User | null>(null);
  accessToken = signal<string | null>(null);

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Restore session on load
    this.supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        this.currentUser.set(data.session.user);
        this.accessToken.set(data.session.access_token);
      }
    });

    // Listen to auth state changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
      this.accessToken.set(session?.access_token ?? null);
    });
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}
