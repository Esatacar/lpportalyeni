/*
  # Add quarterly distributions columns

  1. Changes
    - Add quarterly distributions columns for 2021-2024 to company_data table
    - Each column defaults to 0
    - Uses numeric(20,2) for precise financial calculations
*/

DO $$ 
BEGIN
  -- 2021
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q1_2021') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q1_2021 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q2_2021') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q2_2021 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q3_2021') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q3_2021 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q4_2021') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q4_2021 numeric(20,2) DEFAULT 0;
  END IF;

  -- 2022
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q1_2022') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q1_2022 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q2_2022') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q2_2022 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q3_2022') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q3_2022 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q4_2022') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q4_2022 numeric(20,2) DEFAULT 0;
  END IF;

  -- 2023
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q1_2023') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q1_2023 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q2_2023') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q2_2023 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q3_2023') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q3_2023 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q4_2023') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q4_2023 numeric(20,2) DEFAULT 0;
  END IF;

  -- 2024
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q1_2024') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q1_2024 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q2_2024') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q2_2024 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q3_2024') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q3_2024 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'distributions_q4_2024') THEN
    ALTER TABLE company_data ADD COLUMN distributions_q4_2024 numeric(20,2) DEFAULT 0;
  END IF;
END $$;