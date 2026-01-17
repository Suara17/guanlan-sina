
export interface NavItem {
  id: string;
  label: string;
  icon: any; // Lucide Icon
  path: string;
}

export interface Metric {
  label: string;
  value: string;
  trend: number; // percentage
  trendLabel: string;
}

export interface Capability {
  id: string;
  title: string;
  description: string;
  category: 'Vision' | 'Optimization' | 'Data' | 'Simulation';
  price: string;
  subscribed: boolean;
  iconName: string;
}

export interface Node {
  id: string;
  type: string;
  x: number;
  y: number;
  label: string;
}

export interface Connection {
  from: string;
  to: string;
}

// New Types for Production Dashboard
export interface ProductionData {
  time: string;
  planned: number;
  actual: number;
}

export interface AlertItem {
  id: string;
  time: string;
  level: 'warning' | 'error' | 'critical';
  location: string;
  message: string;
}

export interface SolutionOption {
  id: string;
  title: string;
  type: 'recommended' | 'alternative';
  description: string;
  duration: string;
  risk: 'low' | 'medium' | 'high';
}
