// Ambient Deno & Edge Functions Type Declarations for IDE Language Server

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
}

declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module 'https://deno.land/std@0.177.0/crypto/mod.ts' {
  export const crypto: {
    subtle: SubtleCrypto;
  };
}

declare module 'https://esm.sh/@supabase/supabase-js@2.39.8' {
  export * from '@supabase/supabase-js';
}
