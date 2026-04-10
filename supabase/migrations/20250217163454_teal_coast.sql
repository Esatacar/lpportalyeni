DO $$ 
BEGIN
  -- 2021
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q1_2021') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q1_2021 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q2_2021') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q2_2021 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q3_2021') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q3_2021 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q4_2021') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q4_2021 numeric(20,2) DEFAULT 0;
  END IF;

  -- 2022
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q1_2022') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q1_2022 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q2_2022') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q2_2022 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q3_2022') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q3_2022 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q4_2022') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q4_2022 numeric(20,2) DEFAULT 0;
  END IF;

  -- 2023
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q1_2023') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q1_2023 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q2_2023') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q2_2023 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q3_2023') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q3_2023 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q4_2023') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q4_2023 numeric(20,2) DEFAULT 0;
  END IF;

  -- 2024
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q1_2024') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q1_2024 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q2_2024') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q2_2024 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q3_2024') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q3_2024 numeric(20,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_data' AND column_name = 'unrealized_gains_q4_2024') THEN
    ALTER TABLE company_data ADD COLUMN unrealized_gains_q4_2024 numeric(20,2) DEFAULT 0;
  END IF;
END $$;