import { 
  Euro,
  Users,
  Calculator,
  LineChart,
  Percent
} from 'lucide-react';

export const metrics = [
  { label: 'Fund Size', prefix: 'fund_size', icon: Euro, color: 'blue' },
  { label: 'Number of LPs', prefix: 'lp_count', icon: Users, color: 'purple' },
  { label: 'Total Called Capital', prefix: 'called_capital', icon: Euro, color: 'green' },
  { label: 'Total Investment Cost', prefix: 'investment_cost', icon: Euro, color: 'orange' },
  { label: 'Total Investment Value', prefix: 'investment_value', icon: Euro, color: 'indigo' },
  { label: 'TVPI', prefix: 'tvpi', icon: Calculator, color: 'pink' },
  { label: 'MoIC', prefix: 'moic', icon: LineChart, color: 'yellow' },
  { label: 'IRR', prefix: 'irr', icon: Percent, color: 'red' },
  { label: 'Management Fee', prefix: 'management_fee', icon: Euro, color: 'teal' },
  { label: 'OPEX', prefix: 'opex', icon: Euro, color: 'gray' }
];