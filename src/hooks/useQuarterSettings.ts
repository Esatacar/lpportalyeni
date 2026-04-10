import { useState, useEffect } from 'react';

interface QuarterSetting {
  year: number;
  quarter: number;
}

export function useQuarterSettings(key: string, defaultQuarter: QuarterSetting) {
  // Get settings from localStorage or use default
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterSetting>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultQuarter;
  });

  // Save to localStorage whenever the selection changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(selectedQuarter));
  }, [selectedQuarter, key]);

  return [selectedQuarter, setSelectedQuarter] as const;
}

export function findLatestQuarter(data: any[], prefix: string = 'total_investment'): QuarterSetting {
  const years = [2025, 2024, 2023, 2022, 2021];
  const quarters = [4, 3, 2, 1];

  // Get current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Start from current quarter and work backwards
  let startYear = currentYear;
  let startQuarter = currentQuarter;

  // If current year is beyond our range, start from latest available
  if (currentYear > 2025) {
    startYear = 2025;
    startQuarter = 4;
  }

  // Search for the latest quarter with data
  for (let year = startYear; year >= 2021; year--) {
    const quarterStart = year === startYear ? startQuarter : 4;
    for (let quarter = quarterStart; quarter >= 1; quarter--) {
      const hasData = data.some(item => {
        const value = item[`${prefix}_q${quarter}_${year}`];
        return value && value > 0;
      });

      if (hasData) {
        return { year, quarter };
      }
    }
  }

  // If no data found, return current quarter (or latest available)
  return {
    year: Math.min(Math.max(currentYear, 2021), 2025),
    quarter: Math.min(currentQuarter, 4)
  };
}