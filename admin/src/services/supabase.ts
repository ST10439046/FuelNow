import { createClient } from '@supabase/supabase-js';

declare const process: { env: Record<string, string | undefined> };

// Supabase Configuration — loaded from .env (VITE_ prefix)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing Supabase env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

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
