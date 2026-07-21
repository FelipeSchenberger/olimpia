import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;

  currentUser = signal<User | null>(null);
  accessToken = signal<string | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);


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
