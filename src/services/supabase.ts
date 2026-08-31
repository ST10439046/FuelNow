import { createClient } from '@supabase/supabase-js';

// Supabase Auto-Generated API Configuration
export const SUPABASE_URL = 'https://zahrmlcqwashdiudmfvk.supabase.co';
export const SUPABASE_KEY =
  (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.SUPABASE_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaHJtbGNxd2FzaGRpdWRtZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMDAwMDAsImV4cCI6MjA1NTU3NjAwMH0.mock_key_or_live_token';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export class SupabaseService {
  private static instance: SupabaseService;
  public client = supabase;

  private constructor() {}

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public getUrl(): string {
    return SUPABASE_URL;
  }

  public getAnonKey(): string {
    return SUPABASE_KEY;
  }

  public async invokeFunction<T = any>(
    functionName: string,
    body: Record<string, any>
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        return { data: null, error: new Error(result.error || `HTTP ${response.status}: Failed to invoke ${functionName}`) };
      }
      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
}

export const supabaseService = SupabaseService.getInstance();
