
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@^2/cors";

interface CreateDriverRequest {
  email: string;
  password: string;
  name: string;
}

interface CreateDriverResponse {
  userId: string;
  authId: string;
  email: string;
}

Deno.serve(async (req: Request) => {
  // Handle browser CORS preflight.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  let authUserId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Supabase server environment variables are not configured.",
      );
    }

    const body = (await req.json()) as CreateDriverRequest;

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const name = body.name?.trim();

    if (!email) {
      throw new Error("Email is required.");
    }

    if (!password) {
      throw new Error("Password is required.");
    }

    if (!name) {
      throw new Error("Driver name is required.");
    }

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    // This client uses the server-only service role key.
    // NEVER put this key in the frontend.
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Create the driver's Supabase Auth account.
    // email_confirm prevents Supabase from requiring an email
    // confirmation step or sending a confirmation email.
    const {
      data: authData,
      error: authError,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error("Supabase Auth user was not created.");
    }

    authUserId = authData.user.id;

    // Check whether a public.users row already exists for this
    // Auth account. This also makes the function safer if a trigger
    // creates the public.users record automatically.
    const {
      data: existingUser,
      error: existingUserError,
    } = await supabaseAdmin
      .from("users")
      .select("user_id")
      .eq("auth_id", authUserId)
      .maybeSingle();

    if (existingUserError) {
      throw new Error(
        `Could not check public.users: ${existingUserError.message}`,
      );
    }

    let publicUserId: string;

    if (existingUser) {
      publicUserId = existingUser.user_id;
    } else {
      // Create the application's public.users record.
      const {
        data: publicUser,
        error: publicUserError,
      } = await supabaseAdmin
        .from("users")
        .insert({
          auth_id: authUserId,
          full_name: name,
          email,
        })
        .select("user_id")
        .single();

      if (publicUserError) {
        throw new Error(
          `Could not create public.users record: ${publicUserError.message}`,
        );
      }

      if (!publicUser) {
        throw new Error("public.users record was not created.");
      }

      publicUserId = publicUser.user_id;
    }

    const response: CreateDriverResponse = {
      userId: publicUserId,
      authId: authUserId,
      email,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    // If Auth creation succeeded but public.users failed,
    // remove the Auth account so we don't leave an orphaned user.
    if (authUserId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (supabaseUrl && serviceRoleKey) {
          const cleanupClient = createClient(
            supabaseUrl,
            serviceRoleKey,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            },
          );

          await cleanupClient.auth.admin.deleteUser(authUserId);
        }
      } catch (cleanupError) {
        console.error(
          "Failed to clean up Auth user:",
          cleanupError,
        );
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create driver user.";

    console.error("create-driver-user error:", message);

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});

