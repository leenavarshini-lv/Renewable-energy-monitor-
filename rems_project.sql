-- ============================================================================
-- REMS: Renewable Energy Management System
-- Schema, DDL, Functions, Triggers, Views, Roles, and Seed Dataset
-- Target: PostgreSQL 14+ / Supabase / Neon / Local PostgreSQL
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS rems;
SET search_path TO rems, public;

-- Drop existing tables/views in reverse dependency order if resetting
DROP MATERIALIZED VIEW IF EXISTS rems.mv_monthly_plant_summary CASCADE;
DROP TABLE IF EXISTS rems.audit_log CASCADE;
DROP TABLE IF EXISTS rems.alert CASCADE;
DROP TABLE IF EXISTS rems.carbon_credit CASCADE;
DROP TABLE IF EXISTS rems.bill CASCADE;
DROP TABLE IF EXISTS rems.meter_reading CASCADE;
DROP TABLE IF EXISTS rems.meter CASCADE;
DROP TABLE IF EXISTS rems.consumer CASCADE;
DROP TABLE IF EXISTS rems.tariff CASCADE;
DROP TABLE IF EXISTS rems.generation_record CASCADE;
DROP TABLE IF EXISTS rems.battery CASCADE;
DROP TABLE IF EXISTS rems.equipment CASCADE;
DROP TABLE IF EXISTS rems.plant CASCADE;
DROP TABLE IF EXISTS rems.config CASCADE;

-- ----------------------------------------------------------------------------
-- 1. CONFIG: System configuration parameters
-- ----------------------------------------------------------------------------
CREATE TABLE rems.config (
    key VARCHAR(64) PRIMARY KEY,
    value NUMERIC(10, 4) NOT NULL,
    note VARCHAR(255)
);

INSERT INTO rems.config (key, value, note) VALUES
('emission_factor', 0.7100, 'kg CO2 avoided per kWh of renewable generation'),
('low_output_ratio', 0.6000, 'Threshold ratio against expected yield before raising alert'),
('low_battery_pct', 20.0000, 'State of Charge % threshold for low battery alert'),
('warranty_alert_days', 30.0000, 'Lead time in days for upcoming warranty expiry alerts');

-- ----------------------------------------------------------------------------
-- 2. PLANT: Generation facilities (Solar, Wind, Hydro)
-- ----------------------------------------------------------------------------
CREATE TABLE rems.plant (
    plant_id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    plant_type VARCHAR(20) NOT NULL CHECK (plant_type IN ('SOLAR', 'WIND', 'HYDRO')),
    capacity_kw NUMERIC(10, 2) NOT NULL CHECK (capacity_kw > 0),
    location VARCHAR(120) NOT NULL,
    commissioned_on DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'))
);

-- ----------------------------------------------------------------------------
-- 3. EQUIPMENT: Turbines, inverters, panels, transformers
-- ----------------------------------------------------------------------------
CREATE TABLE rems.equipment (
    equipment_id SERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES rems.plant(plant_id) ON DELETE CASCADE,
    equip_type VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    installed_on DATE NOT NULL,
    warranty_end DATE NOT NULL,
    health VARCHAR(20) NOT NULL DEFAULT 'GOOD' CHECK (health IN ('GOOD', 'WARNING', 'CRITICAL'))
);

-- ----------------------------------------------------------------------------
-- 4. BATTERY: Energy storage systems attached to plants
-- ----------------------------------------------------------------------------
CREATE TABLE rems.battery (
    battery_id SERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES rems.plant(plant_id) ON DELETE CASCADE,
    capacity_kwh NUMERIC(10, 2) NOT NULL CHECK (capacity_kwh > 0),
    charge_pct NUMERIC(5, 2) NOT NULL CHECK (charge_pct BETWEEN 0 AND 100),
    cycles INT NOT NULL DEFAULT 0 CHECK (cycles >= 0)
);

-- ----------------------------------------------------------------------------
-- 5. GENERATION_RECORD: Daily kWh produced by each plant
-- ----------------------------------------------------------------------------
CREATE TABLE rems.generation_record (
    gen_id BIGSERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES rems.plant(plant_id) ON DELETE CASCADE,
    gen_date DATE NOT NULL,
    units_kwh NUMERIC(12, 2) NOT NULL CHECK (units_kwh >= 0),
    CONSTRAINT uq_plant_gen_date UNIQUE (plant_id, gen_date)
);

-- ----------------------------------------------------------------------------
-- 6. TARIFF: Rate categories for net-metered consumers
-- ----------------------------------------------------------------------------
CREATE TABLE rems.tariff (
    tariff_id SERIAL PRIMARY KEY,
    category VARCHAR(30) NOT NULL UNIQUE CHECK (category IN ('HOUSEHOLD', 'COMMERCIAL', 'INDUSTRIAL')),
    import_rate NUMERIC(6, 2) NOT NULL CHECK (import_rate > 0)
);

INSERT INTO rems.tariff (tariff_id, category, import_rate) VALUES
(1, 'HOUSEHOLD', 6.50),
(2, 'COMMERCIAL', 8.50),
(3, 'INDUSTRIAL', 7.50);

-- ----------------------------------------------------------------------------
-- 7. CONSUMER: Utility customers
-- ----------------------------------------------------------------------------
CREATE TABLE rems.consumer (
    consumer_id SERIAL PRIMARY KEY,
    tariff_id INT NOT NULL REFERENCES rems.tariff(tariff_id),
    name VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    has_solar BOOLEAN NOT NULL DEFAULT FALSE
);

-- ----------------------------------------------------------------------------
-- 8. METER: Physical bidirectional meters assigned to consumers
-- ----------------------------------------------------------------------------
CREATE TABLE rems.meter (
    meter_id SERIAL PRIMARY KEY,
    consumer_id INT NOT NULL REFERENCES rems.consumer(consumer_id) ON DELETE CASCADE,
    installed_on DATE NOT NULL
);

-- ----------------------------------------------------------------------------
-- 9. METER_READING: Periodic import/export energy counts
-- ----------------------------------------------------------------------------
CREATE TABLE rems.meter_reading (
    reading_id BIGSERIAL PRIMARY KEY,
    meter_id INT NOT NULL REFERENCES rems.meter(meter_id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    import_kwh NUMERIC(10, 2) NOT NULL CHECK (import_kwh >= 0),
    export_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (export_kwh >= 0),
    CONSTRAINT uq_meter_reading_date UNIQUE (meter_id, reading_date)
);

-- ----------------------------------------------------------------------------
-- 10. BILL: Net-metered monthly statements
-- ----------------------------------------------------------------------------
CREATE TABLE rems.bill (
    bill_id BIGSERIAL PRIMARY KEY,
    consumer_id INT NOT NULL REFERENCES rems.consumer(consumer_id),
    meter_id INT NOT NULL REFERENCES rems.meter(meter_id),
    bill_month DATE NOT NULL,
    import_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0,
    export_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0,
    credit_in_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0,
    credit_out_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('PAID', 'UNPAID')),
    CONSTRAINT uq_consumer_bill_month UNIQUE (consumer_id, bill_month)
);

-- ----------------------------------------------------------------------------
-- 11. CARBON_CREDIT: Quantified CO2 avoidance per plant per month
-- ----------------------------------------------------------------------------
CREATE TABLE rems.carbon_credit (
    credit_id SERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES rems.plant(plant_id) ON DELETE CASCADE,
    credit_month DATE NOT NULL,
    units_kwh NUMERIC(14, 2) NOT NULL,
    co2_avoided_kg NUMERIC(14, 2) NOT NULL,
    CONSTRAINT uq_plant_credit_month UNIQUE (plant_id, credit_month)
);

-- ----------------------------------------------------------------------------
-- 12. ALERT: Automated system notifications and warnings
-- ----------------------------------------------------------------------------
CREATE TABLE rems.alert (
    alert_id BIGSERIAL PRIMARY KEY,
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('LOW_BATTERY', 'LOW_OUTPUT', 'WARRANTY_EXPIRY', 'SYSTEM_INFO')),
    ref_table VARCHAR(30) NOT NULL,
    ref_id BIGINT NOT NULL,
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN NOT NULL DEFAULT FALSE
);

-- ----------------------------------------------------------------------------
-- 13. AUDIT_LOG: Immutable record of critical modifications
-- ----------------------------------------------------------------------------
CREATE TABLE rems.audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(80) NOT NULL DEFAULT CURRENT_USER,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX idx_reading_meter_date ON rems.meter_reading (meter_id, reading_date);
CREATE INDEX idx_generation_plant_date ON rems.generation_record (plant_id, gen_date);
CREATE INDEX idx_bill_consumer_month ON rems.bill (consumer_id, bill_month);
CREATE INDEX idx_alert_type_resolved ON rems.alert (alert_type, resolved);
CREATE INDEX idx_equipment_warranty ON rems.equipment (warranty_end);
CREATE INDEX idx_battery_plant ON rems.battery (plant_id);

-- ----------------------------------------------------------------------------
-- MATERIALIZED VIEW: Monthly Plant Performance Summary
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW rems.mv_monthly_plant_summary AS
SELECT 
    p.plant_id,
    p.name AS plant_name,
    p.plant_type,
    p.capacity_kw,
    DATE_TRUNC('month', g.gen_date)::DATE AS summary_month,
    COALESCE(SUM(g.units_kwh), 0) AS total_generation_kwh,
    ROUND(COALESCE(SUM(g.units_kwh) * (SELECT value FROM rems.config WHERE key = 'emission_factor'), 0), 2) AS co2_avoided_kg,
    COUNT(DISTINCT a.alert_id) AS alert_count
FROM rems.plant p
LEFT JOIN rems.generation_record g ON p.plant_id = g.plant_id
LEFT JOIN rems.alert a ON a.ref_table = 'plant' AND a.ref_id = p.plant_id
GROUP BY p.plant_id, p.name, p.plant_type, p.capacity_kw, DATE_TRUNC('month', g.gen_date);

-- ----------------------------------------------------------------------------
-- FUNCTIONS & PROCEDURES
-- ----------------------------------------------------------------------------

-- A. Generate Monthly Net-Metered Bills
CREATE OR REPLACE FUNCTION rems.generate_bills(p_target_month DATE)
RETURNS TABLE (
    bills_created INT,
    total_amount NUMERIC
) AS $$
DECLARE
    v_month_start DATE := DATE_TRUNC('month', p_target_month)::DATE;
    v_month_end DATE := (DATE_TRUNC('month', p_target_month) + INTERVAL '1 month - 1 day')::DATE;
    v_prev_month DATE := (DATE_TRUNC('month', p_target_month) - INTERVAL '1 month')::DATE;
    v_meter RECORD;
    v_import NUMERIC;
    v_export NUMERIC;
    v_credit_in NUMERIC;
    v_net NUMERIC;
    v_credit_out NUMERIC;
    v_amount NUMERIC;
    v_count INT := 0;
    v_sum_amount NUMERIC := 0;
BEGIN
    FOR v_meter IN
        SELECT m.meter_id, m.consumer_id, c.tariff_id, t.import_rate
        FROM rems.meter m
        JOIN rems.consumer c ON m.consumer_id = c.consumer_id
        JOIN rems.tariff t ON c.tariff_id = t.tariff_id
    LOOP
        -- Sum readings for target month
        SELECT 
            COALESCE(SUM(import_kwh), 0),
            COALESCE(SUM(export_kwh), 0)
        INTO v_import, v_export
        FROM rems.meter_reading
        WHERE meter_id = v_meter.meter_id
          AND reading_date BETWEEN v_month_start AND v_month_end;

        -- Prior month carryover credit
        SELECT COALESCE(credit_out_kwh, 0)
        INTO v_credit_in
        FROM rems.bill
        WHERE consumer_id = v_meter.consumer_id
          AND bill_month = v_prev_month;

        IF v_credit_in IS NULL THEN
            v_credit_in := 0;
        END IF;

        -- Net calculation: (Import - Export) - Prior Credit In
        v_net := (v_import - v_export) - v_credit_in;

        IF v_net > 0 THEN
            v_amount := ROUND(v_net * v_meter.import_rate, 2);
            v_credit_out := 0;
        ELSE
            v_amount := 0;
            v_credit_out := ABS(v_net);
        END IF;

        -- Upsert bill
        INSERT INTO rems.bill (
            consumer_id, meter_id, bill_month,
            import_kwh, export_kwh, credit_in_kwh,
            net_kwh, credit_out_kwh, amount, status
        )
        VALUES (
            v_meter.consumer_id, v_meter.meter_id, v_month_start,
            v_import, v_export, v_credit_in,
            v_net, v_credit_out, v_amount, 'UNPAID'
        )
        ON CONFLICT (consumer_id, bill_month) DO UPDATE
        SET import_kwh = EXCLUDED.import_kwh,
            export_kwh = EXCLUDED.export_kwh,
            credit_in_kwh = EXCLUDED.credit_in_kwh,
            net_kwh = EXCLUDED.net_kwh,
            credit_out_kwh = EXCLUDED.credit_out_kwh,
            amount = EXCLUDED.amount;

        v_count := v_count + 1;
        v_sum_amount := v_sum_amount + v_amount;
    END LOOP;

    RETURN QUERY SELECT v_count, v_sum_amount;
END;
$$ LANGUAGE plpgsql;

-- B. Calculate Carbon Credits
CREATE OR REPLACE FUNCTION rems.calc_carbon_credits(p_target_month DATE)
RETURNS TABLE (
    records_processed INT,
    total_co2_kg NUMERIC
) AS $$
DECLARE
    v_month_start DATE := DATE_TRUNC('month', p_target_month)::DATE;
    v_month_end DATE := (DATE_TRUNC('month', p_target_month) + INTERVAL '1 month - 1 day')::DATE;
    v_factor NUMERIC;
    v_count INT := 0;
    v_total_co2 NUMERIC := 0;
    r RECORD;
BEGIN
    SELECT value INTO v_factor FROM rems.config WHERE key = 'emission_factor';
    IF v_factor IS NULL THEN
        v_factor := 0.71;
    END IF;

    FOR r IN
        SELECT plant_id, SUM(units_kwh) AS plant_total
        FROM rems.generation_record
        WHERE gen_date BETWEEN v_month_start AND v_month_end
        GROUP BY plant_id
    LOOP
        INSERT INTO rems.carbon_credit (plant_id, credit_month, units_kwh, co2_avoided_kg)
        VALUES (r.plant_id, v_month_start, r.plant_total, ROUND(r.plant_total * v_factor, 2))
        ON CONFLICT (plant_id, credit_month) DO UPDATE
        SET units_kwh = EXCLUDED.units_kwh,
            co2_avoided_kg = EXCLUDED.co2_avoided_kg;

        v_count := v_count + 1;
        v_total_co2 := v_total_co2 + ROUND(r.plant_total * v_factor, 2);
    END LOOP;

    RETURN QUERY SELECT v_count, v_total_co2;
END;
$$ LANGUAGE plpgsql;

-- C. Check Equipment Warranties
CREATE OR REPLACE FUNCTION rems.check_warranty_alerts()
RETURNS INT AS $$
DECLARE
    v_days INT;
    v_count INT := 0;
    r RECORD;
BEGIN
    SELECT value::INT INTO v_days FROM rems.config WHERE key = 'warranty_alert_days';
    IF v_days IS NULL THEN
        v_days := 30;
    END IF;

    FOR r IN
        SELECT e.equipment_id, e.equip_type, e.model, e.warranty_end, p.name AS plant_name
        FROM rems.equipment e
        JOIN rems.plant p ON e.plant_id = p.plant_id
        WHERE e.warranty_end <= CURRENT_DATE + (v_days || ' days')::INTERVAL
          AND e.warranty_end >= CURRENT_DATE
          AND NOT EXISTS (
              SELECT 1 FROM rems.alert a 
              WHERE a.alert_type = 'WARRANTY_EXPIRY' 
                AND a.ref_table = 'equipment' 
                AND a.ref_id = e.equipment_id 
                AND a.resolved = FALSE
          )
    LOOP
        INSERT INTO rems.alert (alert_type, ref_table, ref_id, message, resolved)
        VALUES (
            'WARRANTY_EXPIRY',
            'equipment',
            r.equipment_id,
            'Warranty expiring for ' || r.equip_type || ' (' || r.model || ') at ' || r.plant_name || ' on ' || r.warranty_end,
            FALSE
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- TRIGGERS & TRIGGER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Trigger 1: Low Battery Alert
CREATE OR REPLACE FUNCTION rems.fn_trg_battery_low()
RETURNS TRIGGER AS $$
DECLARE
    v_thresh NUMERIC;
    v_plant_name VARCHAR(120);
BEGIN
    SELECT value INTO v_thresh FROM rems.config WHERE key = 'low_battery_pct';
    IF v_thresh IS NULL THEN v_thresh := 20.0; END IF;

    IF NEW.charge_pct <= v_thresh THEN
        SELECT name INTO v_plant_name FROM rems.plant WHERE plant_id = NEW.plant_id;
        
        -- Insert alert if no open alert already exists
        IF NOT EXISTS (
            SELECT 1 FROM rems.alert 
            WHERE alert_type = 'LOW_BATTERY' 
              AND ref_table = 'battery' 
              AND ref_id = NEW.battery_id 
              AND resolved = FALSE
        ) THEN
            INSERT INTO rems.alert (alert_type, ref_table, ref_id, message, resolved)
            VALUES (
                'LOW_BATTERY',
                'battery',
                NEW.battery_id,
                'Battery #' || NEW.battery_id || ' at ' || COALESCE(v_plant_name, 'Plant ' || NEW.plant_id) || ' dropped to critical SoC: ' || NEW.charge_pct || '% (Threshold ' || v_thresh || '%)',
                FALSE
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_battery_low
AFTER INSERT OR UPDATE OF charge_pct ON rems.battery
FOR EACH ROW EXECUTE FUNCTION rems.fn_trg_battery_low();

-- Trigger 2: Low Daily Generation Alert
CREATE OR REPLACE FUNCTION rems.fn_trg_low_output()
RETURNS TRIGGER AS $$
DECLARE
    v_cap NUMERIC;
    v_ratio NUMERIC;
    v_expected NUMERIC;
    v_plant_name VARCHAR(120);
BEGIN
    SELECT capacity_kw, name INTO v_cap, v_plant_name FROM rems.plant WHERE plant_id = NEW.plant_id;
    SELECT value INTO v_ratio FROM rems.config WHERE key = 'low_output_ratio';
    IF v_ratio IS NULL THEN v_ratio := 0.60; END IF;

    -- Expected daily kWh approx = capacity * 4 equivalent peak hours * ratio threshold
    v_expected := v_cap * 4.0 * v_ratio;

    IF NEW.units_kwh < v_expected THEN
        INSERT INTO rems.alert (alert_type, ref_table, ref_id, message, resolved)
        VALUES (
            'LOW_OUTPUT',
            'plant',
            NEW.plant_id,
            'Low output on ' || NEW.gen_date || ' at ' || v_plant_name || ': produced ' || NEW.units_kwh || ' kWh (Expected >= ' || ROUND(v_expected, 1) || ' kWh)',
            FALSE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_low_output
AFTER INSERT ON rems.generation_record
FOR EACH ROW EXECUTE FUNCTION rems.fn_trg_low_output();

-- Trigger 3: Audit Log for Tariff Modifications
CREATE OR REPLACE FUNCTION rems.fn_trg_audit_tariff()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO rems.audit_log (table_name, action, new_data, changed_by)
        VALUES ('tariff', 'INSERT', row_to_json(NEW)::jsonb, CURRENT_USER);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO rems.audit_log (table_name, action, old_data, new_data, changed_by)
        VALUES ('tariff', 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, CURRENT_USER);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO rems.audit_log (table_name, action, old_data, changed_by)
        VALUES ('tariff', 'DELETE', row_to_json(OLD)::jsonb, CURRENT_USER);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_tariff
AFTER INSERT OR UPDATE OR DELETE ON rems.tariff
FOR EACH ROW EXECUTE FUNCTION rems.fn_trg_audit_tariff();

-- Trigger 4: Audit Log for Bill Adjustments
CREATE OR REPLACE FUNCTION rems.fn_trg_audit_bill()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO rems.audit_log (table_name, action, old_data, new_data, changed_by)
        VALUES ('bill', 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, CURRENT_USER);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO rems.audit_log (table_name, action, old_data, changed_by)
        VALUES ('bill', 'DELETE', row_to_json(OLD)::jsonb, CURRENT_USER);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_bill
AFTER UPDATE OR DELETE ON rems.bill
FOR EACH ROW EXECUTE FUNCTION rems.fn_trg_audit_bill();

-- ----------------------------------------------------------------------------
-- ROLES & PRIVILEGES (RBAC)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rems_admin') THEN
        CREATE ROLE rems_admin;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rems_operator') THEN
        CREATE ROLE rems_operator;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rems_consumer') THEN
        CREATE ROLE rems_consumer;
    END IF;
END $$;

GRANT USAGE ON SCHEMA rems TO rems_admin, rems_operator, rems_consumer;

-- rems_admin: Full authority
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA rems TO rems_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA rems TO rems_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA rems TO rems_admin;

-- rems_operator: Operational telemetry management, read-only on tariffs/bills/audit
GRANT SELECT ON ALL TABLES IN SCHEMA rems TO rems_operator;
GRANT INSERT, UPDATE ON rems.plant, rems.equipment, rems.battery, rems.generation_record, rems.alert TO rems_operator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rems TO rems_operator;
REVOKE INSERT, UPDATE, DELETE ON rems.tariff, rems.bill, rems.audit_log FROM rems_operator;

-- rems_consumer: Read-only on own consumer/metering assets
GRANT SELECT ON rems.consumer, rems.meter, rems.meter_reading, rems.bill, rems.tariff TO rems_consumer;
REVOKE SELECT, INSERT, UPDATE, DELETE ON rems.plant, rems.equipment, rems.battery, rems.generation_record, rems.carbon_credit, rems.alert, rems.config, rems.audit_log FROM rems_consumer;

-- ----------------------------------------------------------------------------
-- SEED DATASET
-- ----------------------------------------------------------------------------

-- Plants
INSERT INTO rems.plant (plant_id, name, plant_type, capacity_kw, location, commissioned_on, status) VALUES
(1, 'Bhadla Solar Park Ph-I', 'SOLAR', 1250.00, 'Jodhpur, Rajasthan', '2023-01-15', 'ACTIVE'),
(2, 'Pavagada Solar Complex East', 'SOLAR', 950.00, 'Tumakuru, Karnataka', '2022-08-20', 'ACTIVE'),
(3, 'Muppandal Wind Energy Facility', 'WIND', 1800.00, 'Kanyakumari, Tamil Nadu', '2021-11-10', 'ACTIVE'),
(4, 'Jaisalmer Wind Park Unit 2', 'WIND', 1400.00, 'Jaisalmer, Rajasthan', '2023-04-05', 'ACTIVE'),
(5, 'Tehri Hydroelectric Station', 'HYDRO', 2400.00, 'Tehri Garhwal, Uttarakhand', '2020-03-12', 'ACTIVE'),
(6, 'Rewa Ultra Mega Solar', 'SOLAR', 750.00, 'Rewa, Madhya Pradesh', '2023-09-01', 'ACTIVE');

SELECT setval('rems.plant_plant_id_seq', (SELECT MAX(plant_id) FROM rems.plant));

-- Equipment
INSERT INTO rems.equipment (equipment_id, plant_id, equip_type, model, installed_on, warranty_end, health) VALUES
(1, 1, 'Inverter', 'SMA Sunny Central 2500-EV', '2023-01-15', '2028-01-14', 'GOOD'),
(2, 1, 'Photovoltaic Array', 'First Solar Series 6 Plus', '2023-01-15', '2033-01-15', 'GOOD'),
(3, 1, 'Step-up Transformer', 'Siemens TrafoStar 33kV', '2023-01-15', '2026-11-15', 'WARNING'),
(4, 2, 'Inverter', 'ABB PVS980 Central Inverter', '2022-08-20', '2026-11-05', 'WARNING'),
(5, 3, 'Wind Turbine Gen 1', 'Vestas V150-4.2 MW', '2021-11-10', '2026-11-25', 'GOOD'),
(6, 3, 'Yaw Control Gearbox', 'Flender Winergy Helical', '2021-11-10', '2026-10-15', 'CRITICAL'),
(7, 4, 'Wind Turbine Gen 2', 'Siemens Gamesa SG 3.4-132', '2023-04-05', '2028-04-04', 'GOOD'),
(8, 5, 'Francis Hydro Turbine', 'Andritz Hydro Francis 600', '2020-03-12', '2030-03-10', 'GOOD'),
(9, 6, 'String Inverter Unit A', 'Huawei SUN2000-330KTL', '2023-09-01', '2028-08-31', 'GOOD');

SELECT setval('rems.equipment_equipment_id_seq', (SELECT MAX(equipment_id) FROM rems.equipment));

-- Batteries
INSERT INTO rems.battery (battery_id, plant_id, capacity_kwh, charge_pct, cycles) VALUES
(1, 1, 800.00, 78.50, 420),
(2, 2, 600.00, 18.20, 615), -- Low SoC for demo trigger
(3, 3, 1200.00, 85.00, 310),
(4, 4, 900.00, 45.30, 510),
(5, 6, 500.00, 92.40, 185);

SELECT setval('rems.battery_battery_id_seq', (SELECT MAX(battery_id) FROM rems.battery));

-- Generation Records (Oct 2025 to Oct 2026 sample set)
INSERT INTO rems.generation_record (plant_id, gen_date, units_kwh) VALUES
(1, '2026-10-01', 5420.00),
(1, '2026-10-02', 5680.00),
(1, '2026-10-03', 4910.00),
(1, '2026-10-04', 5300.00),
(1, '2026-10-05', 5550.00),
(2, '2026-10-01', 3900.00),
(2, '2026-10-02', 4120.00),
(2, '2026-10-03', 3750.00),
(2, '2026-10-04', 4050.00),
(2, '2026-10-05', 4200.00),
(3, '2026-10-01', 8900.00),
(3, '2026-10-02', 9450.00),
(3, '2026-10-03', 8200.00),
(3, '2026-10-04', 9800.00),
(3, '2026-10-05', 9100.00),
(4, '2026-10-01', 6500.00),
(4, '2026-10-02', 6800.00),
(4, '2026-10-03', 6100.00),
(4, '2026-10-04', 7050.00),
(4, '2026-10-05', 6900.00),
(5, '2026-10-01', 14200.00),
(5, '2026-10-02', 14600.00),
(5, '2026-10-03', 13950.00),
(5, '2026-10-04', 14800.00),
(5, '2026-10-05', 14500.00),
(6, '2026-10-01', 3200.00),
(6, '2026-10-02', 3350.00),
(6, '2026-10-03', 3100.00),
(6, '2026-10-04', 3400.00),
(6, '2026-10-05', 3300.00);

-- Consumers
INSERT INTO rems.consumer (consumer_id, tariff_id, name, address, has_solar) VALUES
(1, 1, 'Arun Mehta', 'Plot 42, Civil Lines, Jaipur, RJ', TRUE),
(2, 1, 'Sunita Sharma', 'Flat 302, Green Valley Apts, Bangalore, KA', FALSE),
(3, 2, 'Apex Data Centers Ltd', 'Tech Corridor Sector 5, Bangalore, KA', TRUE),
(4, 2, 'Meridian Cold Storage', 'Industrial Area Ph-1, Jodhpur, RJ', FALSE),
(5, 3, 'Kalyani Precision Forgings', 'SIPCOT Industrial Park, Chennai, TN', TRUE),
(6, 3, 'Deccan Textiles Pvt Ltd', 'Textile Cluster Road, Coimbatore, TN', FALSE),
(7, 1, 'Vikram Singhania', '14 Nilgiri Hills, Ooty, TN', TRUE),
(8, 2, 'Highland Hotel & Resorts', 'Mall Road, Mussoorie, UK', FALSE);

SELECT setval('rems.consumer_consumer_id_seq', (SELECT MAX(consumer_id) FROM rems.consumer));

-- Meters
INSERT INTO rems.meter (meter_id, consumer_id, installed_on) VALUES
(101, 1, '2024-02-10'),
(102, 2, '2024-03-15'),
(103, 3, '2023-10-01'),
(104, 4, '2023-11-20'),
(105, 5, '2023-06-12'),
(106, 6, '2023-08-05'),
(107, 7, '2024-01-18'),
(108, 8, '2023-12-01');

SELECT setval('rems.meter_meter_id_seq', (SELECT MAX(meter_id) FROM rems.meter));

-- Meter Readings (Recent 5 days)
INSERT INTO rems.meter_reading (meter_id, reading_date, import_kwh, export_kwh) VALUES
(101, '2026-10-01', 28.50, 34.00),
(101, '2026-10-02', 26.00, 38.50),
(101, '2026-10-03', 30.20, 29.00),
(101, '2026-10-04', 24.50, 41.00),
(101, '2026-10-05', 27.00, 36.50),

(102, '2026-10-01', 45.00, 0.00),
(102, '2026-10-02', 48.20, 0.00),
(102, '2026-10-03', 42.10, 0.00),
(102, '2026-10-04', 46.50, 0.00),
(102, '2026-10-05', 44.00, 0.00),

(103, '2026-10-01', 820.00, 450.00),
(103, '2026-10-02', 790.00, 480.00),
(103, '2026-10-03', 840.00, 410.00),
(103, '2026-10-04', 760.00, 510.00),
(103, '2026-10-05', 810.00, 470.00),

(104, '2026-10-01', 1150.00, 0.00),
(104, '2026-10-02', 1210.00, 0.00),
(104, '2026-10-03', 1180.00, 0.00),
(104, '2026-10-04', 1140.00, 0.00),
(104, '2026-10-05', 1230.00, 0.00),

(105, '2026-10-01', 2400.00, 1850.00),
(105, '2026-10-02', 2350.00, 1920.00),
(105, '2026-10-03', 2510.00, 1780.00),
(105, '2026-10-04', 2280.00, 2040.00),
(105, '2026-10-05', 2420.00, 1890.00);

-- Bills (Historical for Sept 2026)
INSERT INTO rems.bill (bill_id, consumer_id, meter_id, bill_month, import_kwh, export_kwh, credit_in_kwh, net_kwh, credit_out_kwh, amount, status) VALUES
(1, 1, 101, '2026-09-01', 780.00, 920.00, 30.00, -170.00, 170.00, 0.00, 'PAID'),
(2, 2, 102, '2026-09-01', 1340.00, 0.00, 0.00, 1340.00, 0.00, 8710.00, 'PAID'),
(3, 3, 103, '2026-09-01', 24500.00, 14200.00, 0.00, 10300.00, 0.00, 87550.00, 'UNPAID'),
(4, 4, 104, '2026-09-01', 36200.00, 0.00, 0.00, 36200.00, 0.00, 307700.00, 'UNPAID'),
(5, 5, 105, '2026-09-01', 72000.00, 56000.00, 1200.00, 14800.00, 0.00, 111000.00, 'PAID'),
(6, 6, 106, '2026-09-01', 89400.00, 0.00, 0.00, 89400.00, 0.00, 670500.00, 'UNPAID');

SELECT setval('rems.bill_bill_id_seq', (SELECT MAX(bill_id) FROM rems.bill));

-- Carbon Credits
INSERT INTO rems.carbon_credit (plant_id, credit_month, units_kwh, co2_avoided_kg) VALUES
(1, '2026-09-01', 165400.00, 117434.00),
(2, '2026-09-01', 124200.00, 88182.00),
(3, '2026-09-01', 285000.00, 202350.00),
(4, '2026-09-01', 208500.00, 148035.00),
(5, '2026-09-01', 445000.00, 315950.00),
(6, '2026-09-01', 101200.00, 71852.00);

-- Initial Alerts
INSERT INTO rems.alert (alert_id, alert_type, ref_table, ref_id, message, created_at, resolved) VALUES
(1, 'LOW_BATTERY', 'battery', 2, 'Battery #2 at Pavagada Solar Complex East dropped to critical SoC: 18.20% (Threshold 20%)', '2026-10-05 08:30:00+00', FALSE),
(2, 'WARRANTY_EXPIRY', 'equipment', 4, 'Warranty expiring for Inverter (ABB PVS980 Central Inverter) at Pavagada Solar Complex East on 2026-11-05', '2026-10-04 14:15:00+00', FALSE),
(3, 'WARRANTY_EXPIRY', 'equipment', 3, 'Warranty expiring for Step-up Transformer (Siemens TrafoStar 33kV) at Bhadla Solar Park Ph-I on 2026-11-15', '2026-10-02 09:00:00+00', FALSE),
(4, 'LOW_OUTPUT', 'plant', 6, 'Low output on 2026-10-03 at Rewa Ultra Mega Solar: produced 3100.0 kWh (Expected >= 3600.0 kWh)', '2026-10-03 19:45:00+00', TRUE);

SELECT setval('rems.alert_alert_id_seq', (SELECT MAX(alert_id) FROM rems.alert));

-- Initial Audit Logs
INSERT INTO rems.audit_log (table_name, action, old_data, new_data, changed_by, changed_at) VALUES
('tariff', 'UPDATE', '{"tariff_id": 2, "category": "COMMERCIAL", "import_rate": 8.20}', '{"tariff_id": 2, "category": "COMMERCIAL", "import_rate": 8.50}', 'rems_admin', '2026-09-25 11:20:00+00'),
('bill', 'UPDATE', '{"bill_id": 1, "status": "UNPAID"}', '{"bill_id": 1, "status": "PAID"}', 'rems_admin', '2026-10-02 16:40:00+00');

-- Refresh Materialized View
REFRESH MATERIALIZED VIEW rems.mv_monthly_plant_summary;

-- ============================================================================
-- PRELOADED SAVED QUERIES (Q1 to Q12)
-- ============================================================================
-- Q1: Active Solar Plants with Capacity > 500kW
-- SELECT plant_id, name, capacity_kw, location, commissioned_on FROM rems.plant WHERE plant_type = 'SOLAR' AND capacity_kw > 500 ORDER BY capacity_kw DESC;

-- Q2: Daily Generation Summary by Plant Type
-- SELECT p.plant_type, g.gen_date, COUNT(DISTINCT p.plant_id) AS total_plants, SUM(g.units_kwh) AS total_kwh, ROUND(AVG(g.units_kwh), 2) AS avg_kwh FROM rems.generation_record g JOIN rems.plant p ON g.plant_id = p.plant_id GROUP BY p.plant_type, g.gen_date ORDER BY g.gen_date DESC, total_kwh DESC;

-- Q3: Monthly Net-Metered Consumption & Export Analysis
-- SELECT c.name AS consumer_name, c.category, b.bill_month, b.import_kwh, b.export_kwh, b.net_kwh, b.credit_out_kwh, b.amount, b.status FROM rems.bill b JOIN rems.consumer c ON b.consumer_id = c.consumer_id ORDER BY b.bill_month DESC, b.amount DESC;

-- Q4: Top 5 Highest CO2 Avoidance Plants
-- SELECT p.name, p.plant_type, SUM(c.co2_avoided_kg) AS total_co2_kg, SUM(c.units_kwh) AS total_kwh_generated FROM rems.carbon_credit c JOIN rems.plant p ON c.plant_id = p.plant_id GROUP BY p.name, p.plant_type ORDER BY total_co2_kg DESC LIMIT 5;

-- Q5: Low Battery State of Charge (<20%) & Cycling Count
-- SELECT b.battery_id, p.name AS plant_name, b.capacity_kwh, b.charge_pct, b.cycles FROM rems.battery b JOIN rems.plant p ON b.plant_id = p.plant_id WHERE b.charge_pct < 20.0 ORDER BY b.charge_pct ASC;

-- Q6: Equipment Warranty Expiring in the Next 60 Days
-- SELECT e.equipment_id, e.equip_type, e.model, p.name AS plant_name, e.warranty_end, (e.warranty_end - CURRENT_DATE) AS days_remaining, e.health FROM rems.equipment e JOIN rems.plant p ON e.plant_id = p.plant_id WHERE e.warranty_end BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '60 days') ORDER BY days_remaining ASC;

-- Q7: Unpaid Bills & Outstanding Revenue by Category
-- SELECT t.category, COUNT(b.bill_id) AS unpaid_bill_count, SUM(b.amount) AS total_outstanding_inr FROM rems.bill b JOIN rems.consumer c ON b.consumer_id = c.consumer_id JOIN rems.tariff t ON c.tariff_id = t.tariff_id WHERE b.status = 'UNPAID' GROUP BY t.category ORDER BY total_outstanding_inr DESC;

-- Q8: Tariff Rate Comparison and Audit History
-- SELECT a.log_id, a.action, a.old_data->>'category' AS category, (a.old_data->>'import_rate')::NUMERIC AS old_rate, (a.new_data->>'import_rate')::NUMERIC AS new_rate, a.changed_by, a.changed_at FROM rems.audit_log a WHERE a.table_name = 'tariff' ORDER BY a.changed_at DESC;

-- Q9: Meter Readings Peak Import vs Export
-- SELECT m.meter_id, c.name AS consumer, mr.reading_date, mr.import_kwh, mr.export_kwh, ROUND(mr.export_kwh / NULLIF(mr.import_kwh, 0) * 100, 2) AS solar_offset_pct FROM rems.meter_reading mr JOIN rems.meter m ON mr.meter_id = m.meter_id JOIN rems.consumer c ON m.consumer_id = c.consumer_id WHERE c.has_solar = TRUE ORDER BY solar_offset_pct DESC NULLS LAST LIMIT 20;

-- Q10: Unresolved High Priority Operational Alerts
-- SELECT a.alert_id, a.alert_type, a.ref_table, a.ref_id, a.message, a.created_at FROM rems.alert a WHERE a.resolved = FALSE ORDER BY a.created_at DESC;

-- Q11: Consumer Net Metering Solar vs Non-Solar Breakdown
-- SELECT c.has_solar, COUNT(DISTINCT c.consumer_id) AS total_consumers, ROUND(AVG(b.import_kwh), 2) AS avg_monthly_import, ROUND(AVG(b.export_kwh), 2) AS avg_monthly_export, ROUND(AVG(b.amount), 2) AS avg_monthly_bill FROM rems.consumer c JOIN rems.bill b ON c.consumer_id = b.consumer_id GROUP BY c.has_solar;

-- Q12: Index Scan vs Seq Scan Benchmark Query on Meter Readings
-- SELECT meter_id, reading_date, import_kwh, export_kwh FROM rems.meter_reading WHERE meter_id = 101 AND reading_date >= '2026-10-01' ORDER BY reading_date;
