import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ViewSettings {
  portfolioQuarter: {
    year: number;
    quarter: number;
  };
  accountQuarters: string[];
}

async function findLatestQuarter() {
  try {
    // Get portfolio data to find the latest quarter with data
    const { data: portfolioData, error } = await supabase
      .from('portfolio_data')
      .select('*');
    
    if (error) throw error;
    
    // Years and quarters in descending order for latest-first search
    const years = [2026, 2025, 2024, 2023, 2022, 2021];
    const quarters = [4, 3, 2, 1];
    
    // Find the latest quarter with data by checking all relevant fields
    for (const year of years) {
      for (const quarter of quarters) {
        const hasData = portfolioData?.some(company => {
          // Check all relevant quarterly fields
          const fields = [
            `total_investment_q${quarter}_${year}`,
            `total_value_q${quarter}_${year}`
          ];
          
          return fields.some(field => {
            const value = company[field];
            return value !== null && value !== undefined && value > 0;
          });
        });
        
        if (hasData) {
          console.log(`Found latest quarter with data: Q${quarter} ${year}`);
          return { year, quarter };
        }
      }
    }
    
    // If no data found, return current quarter (limited to our date range)
    const currentDate = new Date();
    const currentYear = Math.min(Math.max(currentDate.getFullYear(), 2021), 2026);
    const currentQuarter = Math.min(Math.ceil((currentDate.getMonth() + 1) / 3), 4);
    
    console.log(`No data found, using current quarter: Q${currentQuarter} ${currentYear}`);
    return {
      year: currentYear,
      quarter: currentQuarter
    };
  } catch (error) {
    console.error('Error finding latest quarter:', error);
    // Fallback to current quarter
    const currentDate = new Date();
    const currentYear = Math.min(Math.max(currentDate.getFullYear(), 2021), 2026);
    const currentQuarter = Math.min(Math.ceil((currentDate.getMonth() + 1) / 3), 4);
    
    return {
      year: currentYear,
      quarter: currentQuarter
    };
  }
}

async function findLatestFourQuarters() {
  try {
    const { data: rows, error } = await supabase
      .from('company_data')
      .select('*');

    if (error) throw error;
    if (!rows || rows.length === 0) return fallbackQuarters();

    const metricsToCheck = [
      'paid_capital', 'nav', 'management_fee', 'opex',
      'distributions', 'unrealized_gains', 'realized_gains',
      'carried_interest_gp'
    ];
    const years = [2026, 2025, 2024, 2023, 2022, 2021];
    const quartersInYear = [4, 3, 2, 1];
    const found: string[] = [];

    for (const year of years) {
      for (const quarter of quartersInYear) {
        const hasData = rows.some(row =>
          metricsToCheck.some(metric => {
            const v = row[`${metric}_q${quarter}_${year}`];
            return v !== null && v !== undefined && v !== 0;
          })
        );
        if (hasData) {
          found.push(`${year}-${quarter}`);
          if (found.length === 4) return found;
        }
      }
    }

    return found.length > 0 ? found : fallbackQuarters();
  } catch (error) {
    console.error('Error finding latest quarters:', error);
    return fallbackQuarters();
  }
}

function fallbackQuarters(): string[] {
  const currentDate = new Date();
  let year = Math.min(Math.max(currentDate.getFullYear(), 2021), 2026);
  let quarter = Math.min(Math.ceil((currentDate.getMonth() + 1) / 3), 4);
  const result: string[] = [];
  for (let i = 0; i < 4; i++) {
    result.push(`${year}-${quarter}`);
    quarter--;
    if (quarter < 1) { quarter = 4; year--; }
    if (year < 2021) break;
  }
  return result;
}

const DEFAULT_SETTINGS: ViewSettings = {
  portfolioQuarter: {
    year: 2025,
    quarter: 1
  },
  accountQuarters: ['2025-1', '2024-4', '2024-3', '2024-2']
};

export async function getGlobalViewSettings(): Promise<ViewSettings> {
  try {
    const { data: settings, error } = await supabase
      .from('user_preferences')
      .select('value')
      .eq('key', 'global_view_settings')
      .maybeSingle();

    if (error) throw error;

    if (!settings) {
      // No settings found, create default settings with latest quarters
      const [latestQuarter, latestQuarters] = await Promise.all([
        findLatestQuarter(),
        findLatestFourQuarters()
      ]);
      
      const defaultSettings = {
        portfolioQuarter: latestQuarter,
        accountQuarters: latestQuarters
      };

      const { error: insertError } = await supabase
        .from('user_preferences')
        .upsert({
          key: 'global_view_settings',
          value: defaultSettings
        }, {
          onConflict: 'key'
        });

      if (insertError) throw insertError;
      return defaultSettings;
    }

    // If settings exist but we need to update them
    const [latestQuarter, latestQuarters] = await Promise.all([
      findLatestQuarter(),
      findLatestFourQuarters()
    ]);
    
    const currentSettings = settings.value as ViewSettings;
    let needsUpdate = false;
    
    // Update portfolio quarter if it's older than the latest quarter with data
    if (latestQuarter.year > currentSettings.portfolioQuarter.year || 
        (latestQuarter.year === currentSettings.portfolioQuarter.year && 
         latestQuarter.quarter > currentSettings.portfolioQuarter.quarter)) {
      currentSettings.portfolioQuarter = latestQuarter;
      needsUpdate = true;
    }
    
    // Update account quarters if they don't match the latest quarters with data
    if (JSON.stringify(currentSettings.accountQuarters) !== JSON.stringify(latestQuarters)) {
      currentSettings.accountQuarters = latestQuarters;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('user_preferences')
        .upsert({
          key: 'global_view_settings',
          value: currentSettings
        }, {
          onConflict: 'key'
        });

      if (updateError) throw updateError;
    }

    return currentSettings;
  } catch (error) {
    console.error('Error fetching global view settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateGlobalViewSettings(settings: Partial<ViewSettings>): Promise<void> {
  try {
    const currentSettings = await getGlobalViewSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        key: 'global_view_settings',
        value: updatedSettings
      }, {
        onConflict: 'key'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating global view settings:', error);
  }
}

export function useGlobalViewSettings() {
  const [settings, setSettings] = useState<ViewSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const globalSettings = await getGlobalViewSettings();
        if (isMounted) {
          setSettings(globalSettings);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading global view settings:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = async (newSettings: Partial<ViewSettings>) => {
    try {
      await updateGlobalViewSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  return {
    settings,
    loading,
    updateSettings
  };
}