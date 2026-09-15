import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

interface AdminUser {
  name: string;
  role: string;
  initials: string;
}

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: "▦",
  },
  {
    label: "Orders",
    path: "/orders",
    icon: "📋",
  },
  {
    label: "Drivers",
    path: "/drivers",
    icon: "🚛",
  },
  {
    label: "Rates",
    path: "/rates",
    icon: "💰",
  },
  {
    label: "Reviews",
    path: "/reviews",
    icon: "★",
  },
  {
    label: "SOS",
    path: "/sos",
    icon: "🚨",
  },
  {
    label: "Reports",
    path: "/reports",
    icon: "▤",
  },
  {
    label: "Settings",
    path: "/settings",
    icon: "⚙",
  },
];

function getInitials(name: string) {
  if (!name) {
    return "AD";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Sidebar() {
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState<AdminUser>({
    name: "Loading...",
    role: "Administrator",
    initials: "AD",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentAdmin() {
      try {
        setLoading(true);

        /*
         * The Supabase Auth ID is stored in:
         *
         * public.users.auth_id
         *
         * It is NOT the same column as public.users.user_id.
         */
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Failed to get Supabase session:", sessionError);
          return;
        }

        const authUser = session?.user;

        if (!authUser) {
          if (mounted) {
            setAdminUser({
              name: "Administrator",
              role: "Not signed in",
              initials: "AD",
            });
          }

          return;
        }

        /*
         * Find the application user using auth_id.
         */
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("user_id, full_name, email")
          .eq("auth_id", authUser.id)
          .maybeSingle();

        if (profileError) {
          console.error("Failed to load user profile:", profileError);
          return;
        }

        if (!profile) {
          console.warn(
            "No public.users record found for authenticated user:",
            authUser.id,
          );

          if (mounted) {
            setAdminUser({
              name:
                authUser.user_metadata?.full_name ||
                authUser.email ||
                "Administrator",
              role: "Administrator",
              initials: getInitials(
                authUser.user_metadata?.full_name ||
                  authUser.email ||
                  "Administrator",
              ),
            });
          }

          return;
        }

        /*
         * The user's admin role is stored in:
         *
         * public.admin_users.admin_id
         *
         * where admin_id = public.users.user_id.
         */
        const { data: admin, error: adminError } = await supabase
          .from("admin_users")
          .select("admin_id, role")
          .eq("admin_id", profile.user_id)
          .maybeSingle();

        if (adminError) {
          console.error("Failed to load admin role:", adminError);
        }

        const name =
          profile.full_name ||
          profile.email ||
          authUser.user_metadata?.full_name ||
          authUser.email ||
          "Administrator";

        const role = admin?.role || "Administrator";

        if (mounted) {
          setAdminUser({
            name,
            role,
            initials: getInitials(name),
          });
        }
      } catch (error) {
        console.error("Unexpected error loading admin user:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCurrentAdmin();

    /*
     * Update the sidebar if the Supabase authentication state changes.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        loadCurrentAdmin();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("fuelnow_dev_session");

      navigate("/login", { replace: true });
    }
  }

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "var(--sidebar-width)",
        background: "var(--charcoal-ink)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 76,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "var(--signal-orange)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            F
          </div>

          <div>
            <div
              style={{
                color: "#fff",
                fontSize: 17,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              FuelNow
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.12em",
                marginTop: 4,
              }}
            >
              ADMIN CONSOLE
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "20px 12px",
          overflowY: "auto",
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 14px",
              marginBottom: 4,
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              color: isActive ? "#fff" : "rgba(255,255,255,0.58)",
              background: isActive ? "rgba(249,115,22,0.16)" : "transparent",
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              transition: "all 0.15s ease",
            })}
          >
            <span
              style={{
                width: 22,
                textAlign: "center",
                fontSize: 16,
                opacity: 0.9,
              }}
            >
              {item.icon}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Current Admin */}
      <div
        style={{
          padding: "14px 16px 16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "10px 8px",
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--signal-orange)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {adminUser.initials}
          </div>

          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {loading ? "Loading..." : adminUser.name}
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 10,
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {loading ? "Loading..." : adminUser.role}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            padding: "9px 12px",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            textAlign: "left",
            fontSize: 12,
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.06)";
            event.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "transparent";
            event.currentTarget.style.color = "rgba(255,255,255,0.5)";
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
