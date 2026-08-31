-- ============================================================================
-- FUELNOW PRODUCTION DATABASE SCHEMA & SECURITY POLICIES
-- Target: Supabase PostgreSQL
-- Project: https://zahrmlcqwashdiudmfvk.supabase.co
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Core Authentication & Profiles (Abstract Base Hierarchy)
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'invited');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('Super Admin', 'Ops Manager', 'Support Agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status user_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customers (
    customer_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    loyalty_tier VARCHAR(50) DEFAULT 'Bronze',
    fuel_points_balance INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.drivers (
    driver_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    licence_number VARCHAR(100) UNIQUE NOT NULL,
    rating DOUBLE PRECISION DEFAULT 5.0,
    status VARCHAR(50) DEFAULT 'Offline', -- Offline, Active, On Delivery
    zone VARCHAR(100),
    province VARCHAR(100) DEFAULT 'KwaZulu-Natal'
);

CREATE TABLE IF NOT EXISTS public.admin_users (
    admin_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    role admin_role NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Loyalty & Rewards
CREATE TABLE IF NOT EXISTS public.reward_accounts (
    reward_account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID UNIQUE REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    points_balance INTEGER DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'Bronze'
);

-- Geography & Saved Locations
CREATE TABLE IF NOT EXISTS public.addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    label VARCHAR(100) DEFAULT 'Home',
    unit_number VARCHAR(100),
    street_number VARCHAR(50) NOT NULL,
    street_name VARCHAR(255) NOT NULL,
    suburb VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    province VARCHAR(100) DEFAULT 'KwaZulu-Natal',
    postal_code VARCHAR(20) NOT NULL,
    delivery_instructions TEXT,
    is_default BOOLEAN DEFAULT false
);

-- Fuel Rates & API Pricing (SAPIA Feed)
CREATE TABLE IF NOT EXISTS public.fuel_types (
    fuel_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- Petrol 95, Petrol 93, Diesel 50ppm, Diesel 500ppm
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.fuel_rates (
    rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fuel_type_id UUID REFERENCES public.fuel_types(fuel_type_id) ON DELETE CASCADE,
    price_per_litre NUMERIC(10,2) NOT NULL,
    source VARCHAR(100) DEFAULT 'Automated API Sync', -- 'Automated API Sync' or 'Manual Override'
    last_updated_by UUID REFERENCES public.admin_users(admin_id),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders, Deliveries & Transactions
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(customer_id),
    driver_id UUID REFERENCES public.drivers(driver_id),
    address_id UUID REFERENCES public.addresses(address_id),
    fuel_type_id UUID REFERENCES public.fuel_types(fuel_type_id),
    order_method VARCHAR(50) NOT NULL, -- 'Litres' or 'Rand'
    volume_litres NUMERIC(10,2) NOT NULL,
    rand_amount NUMERIC(10,2) NOT NULL,
    delivery_type VARCHAR(50) DEFAULT 'Deliver Now', -- 'Deliver Now' or 'Schedule'
    scheduled_date_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PENDING_PAYMENT',
    delivery_pin VARCHAR(4) NOT NULL, -- Randomly generated 4-digit verification code
    pod_photo_url TEXT,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE REFERENCES public.orders(order_id) ON DELETE CASCADE,
    payment_method_id VARCHAR(255),
    fuel_subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) DEFAULT 49.00,
    service_fee NUMERIC(10,2) DEFAULT 0.00,
    vat_amount NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- PENDING, COMPLETED, FAILED
    charged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Fleet Management
CREATE TABLE IF NOT EXISTS public.vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID UNIQUE REFERENCES public.drivers(driver_id) ON DELETE SET NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    capacity_litres NUMERIC(10,2) NOT NULL
);

-- Driver Regulatory Compliance
CREATE TABLE IF NOT EXISTS public.compliance_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.drivers(driver_id) ON DELETE CASCADE,
    document_type VARCHAR(255) NOT NULL, -- Driver's Licence, PrDP, Hazmat Certificate, Vehicle Permit
    document_number VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Valid' -- Valid, Expired, Expiring Soon
);

-- Safety & Emergency SOS Alerting
CREATE TABLE IF NOT EXISTS public.sos_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.drivers(driver_id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(order_id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    note TEXT,
    severity VARCHAR(50) DEFAULT 'Critical', -- Warning, Critical
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, DISPATCHED, RESOLVED
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.admin_users(admin_id)
);

-- Feedback, Auditing, and System Configuration
CREATE TABLE IF NOT EXISTS public.reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE REFERENCES public.orders(order_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(customer_id),
    driver_id UUID REFERENCES public.drivers(driver_id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(50) DEFAULT 'Published', -- Published, Flagged for Review, Removed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
    settings_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auto_assign_orders BOOLEAN DEFAULT true,
    customer_sms_notifications BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES public.admin_users(admin_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Fuel Types
INSERT INTO public.fuel_types (name, description) VALUES
    ('Petrol 95', 'Unleaded Petrol 95 Octane (Coast)'),
    ('Petrol 93', 'Unleaded Petrol 93 Octane (Coast)'),
    ('Diesel 50ppm', 'Low Sulphur Clean Diesel 50ppm'),
    ('Diesel 500ppm', 'Standard Diesel 500ppm')
ON CONFLICT (name) DO NOTHING;

-- Seed Default Fuel Rates
INSERT INTO public.fuel_rates (fuel_type_id, price_per_litre, source)
SELECT fuel_type_id, 23.45, 'Automated API Sync' FROM public.fuel_types WHERE name = 'Petrol 95'
UNION ALL
SELECT fuel_type_id, 22.87, 'Automated API Sync' FROM public.fuel_types WHERE name = 'Petrol 93'
UNION ALL
SELECT fuel_type_id, 21.63, 'Automated API Sync' FROM public.fuel_types WHERE name = 'Diesel 50ppm'
UNION ALL
SELECT fuel_type_id, 21.38, 'Automated API Sync' FROM public.fuel_types WHERE name = 'Diesel 500ppm';

-- ============================================================
-- SUPABASE RLS SECURITY SETUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE admin_id = auth.uid()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.drivers
        WHERE driver_id = auth.uid()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_customer()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.customers
        WHERE customer_id = auth.uid()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_driver_zone()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    driver_zone VARCHAR;
BEGIN
    SELECT zone
    INTO driver_zone
    FROM public.drivers
    WHERE driver_id = auth.uid();

    RETURN driver_zone;
END;
$$;

-- ENABLE RLS ON EVERY TABLE
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 3. USERS
DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
CREATE POLICY "users_select_own_or_admin" ON public.users FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "users_update_own_or_admin" ON public.users;
CREATE POLICY "users_update_own_or_admin" ON public.users FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "users_insert_admin" ON public.users;
CREATE POLICY "users_insert_admin" ON public.users FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
CREATE POLICY "users_delete_admin" ON public.users FOR DELETE TO authenticated USING (public.is_admin());

-- 4. CUSTOMERS
DROP POLICY IF EXISTS "customers_select_own_or_admin" ON public.customers;
CREATE POLICY "customers_select_own_or_admin" ON public.customers FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "customers_insert_own_or_admin" ON public.customers;
CREATE POLICY "customers_insert_own_or_admin" ON public.customers FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "customers_update_own_or_admin" ON public.customers;
CREATE POLICY "customers_update_own_or_admin" ON public.customers FOR UPDATE TO authenticated USING (customer_id = auth.uid() OR public.is_admin()) WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "customers_delete_own_or_admin" ON public.customers;
CREATE POLICY "customers_delete_own_or_admin" ON public.customers FOR DELETE TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

-- 5. DRIVERS
DROP POLICY IF EXISTS "drivers_select_own_or_admin" ON public.drivers;
CREATE POLICY "drivers_select_own_or_admin" ON public.drivers FOR SELECT TO authenticated USING (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_insert_own_or_admin" ON public.drivers;
CREATE POLICY "drivers_insert_own_or_admin" ON public.drivers FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_update_own_or_admin" ON public.drivers;
CREATE POLICY "drivers_update_own_or_admin" ON public.drivers FOR UPDATE TO authenticated USING (driver_id = auth.uid() OR public.is_admin()) WITH CHECK (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_delete_admin" ON public.drivers;
CREATE POLICY "drivers_delete_admin" ON public.drivers FOR DELETE TO authenticated USING (public.is_admin());

-- 6. ADMIN USERS
DROP POLICY IF EXISTS "admin_users_select_admin" ON public.admin_users;
CREATE POLICY "admin_users_select_admin" ON public.admin_users FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_users_insert_admin" ON public.admin_users;
CREATE POLICY "admin_users_insert_admin" ON public.admin_users FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_users_update_admin" ON public.admin_users;
CREATE POLICY "admin_users_update_admin" ON public.admin_users FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_users_delete_admin" ON public.admin_users;
CREATE POLICY "admin_users_delete_admin" ON public.admin_users FOR DELETE TO authenticated USING (public.is_admin());

-- 7. REWARD ACCOUNTS
DROP POLICY IF EXISTS "reward_accounts_select_own_or_admin" ON public.reward_accounts;
CREATE POLICY "reward_accounts_select_own_or_admin" ON public.reward_accounts FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "reward_accounts_insert_own_or_admin" ON public.reward_accounts;
CREATE POLICY "reward_accounts_insert_own_or_admin" ON public.reward_accounts FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "reward_accounts_update_own_or_admin" ON public.reward_accounts;
CREATE POLICY "reward_accounts_update_own_or_admin" ON public.reward_accounts FOR UPDATE TO authenticated USING (customer_id = auth.uid() OR public.is_admin()) WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "reward_accounts_delete_own_or_admin" ON public.reward_accounts;
CREATE POLICY "reward_accounts_delete_own_or_admin" ON public.reward_accounts FOR DELETE TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

-- 8. ADDRESSES
DROP POLICY IF EXISTS "addresses_select_own_or_admin" ON public.addresses;
CREATE POLICY "addresses_select_own_or_admin" ON public.addresses FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "addresses_insert_own_or_admin" ON public.addresses;
CREATE POLICY "addresses_insert_own_or_admin" ON public.addresses FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "addresses_update_own_or_admin" ON public.addresses;
CREATE POLICY "addresses_update_own_or_admin" ON public.addresses FOR UPDATE TO authenticated USING (customer_id = auth.uid() OR public.is_admin()) WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "addresses_delete_own_or_admin" ON public.addresses;
CREATE POLICY "addresses_delete_own_or_admin" ON public.addresses FOR DELETE TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

-- 9. FUEL TYPES
DROP POLICY IF EXISTS "fuel_types_select_authenticated" ON public.fuel_types;
CREATE POLICY "fuel_types_select_authenticated" ON public.fuel_types FOR SELECT TO authenticated USING (public.is_customer() OR public.is_driver() OR public.is_admin());

DROP POLICY IF EXISTS "fuel_types_insert_admin" ON public.fuel_types;
CREATE POLICY "fuel_types_insert_admin" ON public.fuel_types FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fuel_types_update_admin" ON public.fuel_types;
CREATE POLICY "fuel_types_update_admin" ON public.fuel_types FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fuel_types_delete_admin" ON public.fuel_types;
CREATE POLICY "fuel_types_delete_admin" ON public.fuel_types FOR DELETE TO authenticated USING (public.is_admin());

-- 10. FUEL RATES
DROP POLICY IF EXISTS "fuel_rates_select_authenticated" ON public.fuel_rates;
CREATE POLICY "fuel_rates_select_authenticated" ON public.fuel_rates FOR SELECT TO authenticated USING (public.is_customer() OR public.is_driver() OR public.is_admin());

DROP POLICY IF EXISTS "fuel_rates_insert_admin" ON public.fuel_rates;
CREATE POLICY "fuel_rates_insert_admin" ON public.fuel_rates FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fuel_rates_update_admin" ON public.fuel_rates;
CREATE POLICY "fuel_rates_update_admin" ON public.fuel_rates FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "fuel_rates_delete_admin" ON public.fuel_rates;
CREATE POLICY "fuel_rates_delete_admin" ON public.fuel_rates FOR DELETE TO authenticated USING (public.is_admin());

-- 11. ORDERS
DROP POLICY IF EXISTS "orders_select_customer_driver_admin" ON public.orders;
CREATE POLICY "orders_select_customer_driver_admin" ON public.orders FOR SELECT TO authenticated USING (
    customer_id = auth.uid() OR
    public.is_admin() OR
    driver_id = auth.uid() OR
    (
        public.is_driver() AND status = 'FINDING_DRIVER' AND EXISTS (
            SELECT 1 FROM public.addresses a WHERE a.address_id = orders.address_id AND a.suburb = public.get_driver_zone()
        )
    )
);

DROP POLICY IF EXISTS "orders_insert_customer_or_admin" ON public.orders;
CREATE POLICY "orders_insert_customer_or_admin" ON public.orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_update_customer_driver_admin" ON public.orders;
CREATE POLICY "orders_update_customer_driver_admin" ON public.orders FOR UPDATE TO authenticated USING (customer_id = auth.uid() OR driver_id = auth.uid() OR public.is_admin()) WITH CHECK (customer_id = auth.uid() OR driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_delete_customer_admin" ON public.orders;
CREATE POLICY "orders_delete_customer_admin" ON public.orders FOR DELETE TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

-- 12. PAYMENTS
DROP POLICY IF EXISTS "payments_select_customer_or_admin" ON public.payments;
CREATE POLICY "payments_select_customer_or_admin" ON public.payments FOR SELECT TO authenticated USING (
    public.is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.order_id = payments.order_id AND o.customer_id = auth.uid())
);

DROP POLICY IF EXISTS "payments_insert_customer_or_admin" ON public.payments;
CREATE POLICY "payments_insert_customer_or_admin" ON public.payments FOR INSERT TO authenticated WITH CHECK (
    public.is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.order_id = payments.order_id AND o.customer_id = auth.uid())
);

DROP POLICY IF EXISTS "payments_update_customer_or_admin" ON public.payments;
CREATE POLICY "payments_update_customer_or_admin" ON public.payments FOR UPDATE TO authenticated USING (
    public.is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.order_id = payments.order_id AND o.customer_id = auth.uid())
) WITH CHECK (
    public.is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.order_id = payments.order_id AND o.customer_id = auth.uid())
);

DROP POLICY IF EXISTS "payments_delete_customer_or_admin" ON public.payments;
CREATE POLICY "payments_delete_customer_or_admin" ON public.payments FOR DELETE TO authenticated USING (
    public.is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.order_id = payments.order_id AND o.customer_id = auth.uid())
);

-- 13. VEHICLES
DROP POLICY IF EXISTS "vehicles_select_driver_or_admin" ON public.vehicles;
CREATE POLICY "vehicles_select_driver_or_admin" ON public.vehicles FOR SELECT TO authenticated USING (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "vehicles_insert_driver_or_admin" ON public.vehicles;
CREATE POLICY "vehicles_insert_driver_or_admin" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "vehicles_update_driver_or_admin" ON public.vehicles;
CREATE POLICY "vehicles_update_driver_or_admin" ON public.vehicles FOR UPDATE TO authenticated USING (driver_id = auth.uid() OR public.is_admin()) WITH CHECK (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "vehicles_delete_driver_or_admin" ON public.vehicles;
CREATE POLICY "vehicles_delete_driver_or_admin" ON public.vehicles FOR DELETE TO authenticated USING (driver_id = auth.uid() OR public.is_admin());

-- 14. COMPLIANCE DOCUMENTS
DROP POLICY IF EXISTS "compliance_select_driver_or_admin" ON public.compliance_documents;
CREATE POLICY "compliance_select_driver_or_admin" ON public.compliance_documents FOR SELECT TO authenticated USING (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "compliance_insert_driver_or_admin" ON public.compliance_documents;
CREATE POLICY "compliance_insert_driver_or_admin" ON public.compliance_documents FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "compliance_update_driver_or_admin" ON public.compliance_documents;
CREATE POLICY "compliance_update_driver_or_admin" ON public.compliance_documents FOR UPDATE TO authenticated USING (driver_id = auth.uid() OR public.is_admin()) WITH CHECK (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "compliance_delete_driver_or_admin" ON public.compliance_documents;
CREATE POLICY "compliance_delete_driver_or_admin" ON public.compliance_documents FOR DELETE TO authenticated USING (driver_id = auth.uid() OR public.is_admin());

-- 15. SOS ALERTS
DROP POLICY IF EXISTS "sos_select_driver_or_admin" ON public.sos_alerts;
CREATE POLICY "sos_select_driver_or_admin" ON public.sos_alerts FOR SELECT TO authenticated USING (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sos_insert_driver_or_admin" ON public.sos_alerts;
CREATE POLICY "sos_insert_driver_or_admin" ON public.sos_alerts FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sos_update_driver_or_admin" ON public.sos_alerts;
CREATE POLICY "sos_update_driver_or_admin" ON public.sos_alerts FOR UPDATE TO authenticated USING (driver_id = auth.uid() OR public.is_admin()) WITH CHECK (driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sos_delete_admin" ON public.sos_alerts;
CREATE POLICY "sos_delete_admin" ON public.sos_alerts FOR DELETE TO authenticated USING (public.is_admin());

-- 16. REVIEWS
DROP POLICY IF EXISTS "reviews_select_customer_driver_admin" ON public.reviews;
CREATE POLICY "reviews_select_customer_driver_admin" ON public.reviews FOR SELECT TO authenticated USING (customer_id = auth.uid() OR driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "reviews_insert_customer_or_admin" ON public.reviews;
CREATE POLICY "reviews_insert_customer_or_admin" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
    public.is_admin() OR (customer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.orders o WHERE o.order_id = reviews.order_id AND o.customer_id = auth.uid()))
);

DROP POLICY IF EXISTS "reviews_update_customer_or_admin" ON public.reviews;
CREATE POLICY "reviews_update_customer_or_admin" ON public.reviews FOR UPDATE TO authenticated USING (customer_id = auth.uid() OR public.is_admin()) WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "reviews_delete_customer_or_admin" ON public.reviews;
CREATE POLICY "reviews_delete_customer_or_admin" ON public.reviews FOR DELETE TO authenticated USING (customer_id = auth.uid() OR public.is_admin());

-- 17. PLATFORM SETTINGS
DROP POLICY IF EXISTS "platform_settings_select_admin" ON public.platform_settings;
CREATE POLICY "platform_settings_select_admin" ON public.platform_settings FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "platform_settings_insert_admin" ON public.platform_settings;
CREATE POLICY "platform_settings_insert_admin" ON public.platform_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "platform_settings_update_admin" ON public.platform_settings;
CREATE POLICY "platform_settings_update_admin" ON public.platform_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "platform_settings_delete_admin" ON public.platform_settings;
CREATE POLICY "platform_settings_delete_admin" ON public.platform_settings FOR DELETE TO authenticated USING (public.is_admin());

-- 18. DEFAULT DENY FOR ANON
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.customers FROM anon;
REVOKE ALL ON public.drivers FROM anon;
REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.reward_accounts FROM anon;
REVOKE ALL ON public.addresses FROM anon;
REVOKE ALL ON public.fuel_types FROM anon;
REVOKE ALL ON public.fuel_rates FROM anon;
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.payments FROM anon;
REVOKE ALL ON public.vehicles FROM anon;
REVOKE ALL ON public.compliance_documents FROM anon;
REVOKE ALL ON public.sos_alerts FROM anon;
REVOKE ALL ON public.reviews FROM anon;
REVOKE ALL ON public.platform_settings FROM anon;
