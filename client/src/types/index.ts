export type UserRole = 'citizen' | 'agent' | 'admin';
export type ReportCategory = 'wildfire' | 'illegal_logging' | 'water_leak' | 'pollution';
export type ReportStatus = 'pending' | 'verified' | 'resolved';
export type FireRiskLevel = 'Low' | 'Medium' | 'High' | 'Very High' | 'Extreme';
export type WaterStatus = 'critical' | 'low' | 'normal' | 'high';
export type NotificationType = 'new_report' | 'status_update' | 'alert' | 'info';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface Report {
  _id: string;
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  status: ReportStatus;
  user: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  rainfall: number;
  pressure: number;
  visibility: number;
  location: string;
  country: string;
  fireRiskLevel: string;
  fireRiskScore: number;
  timestamp: string;
}

export interface FireHotspot {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: number;
  acquiredDate: string;
  acquiredTime: string;
  satellite: string;
  frp: number;
}

export interface EnvironmentData {
  fireHotspots: FireHotspot[];
  totalHotspots: number;
  source: string;
  region: string;
  timestamp: string;
}

export interface WaterData {
  _id: string;
  level: number;
  location: string;
  source: string;
  status: WaterStatus;
  timestamp: string;
  notes?: string;
}

export interface WaterSummary {
  _id: string;
  level: number;
  location: string;
  status: WaterStatus;
  lastUpdated: string;
}

export interface ForestData {
  _id: string;
  fireRiskLevel: FireRiskLevel;
  healthIndex: number;
  location: string;
  area: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  timestamp: string;
  notes?: string;
}

export interface ForestSummary {
  _id: string;
  fireRiskLevel: FireRiskLevel;
  healthIndex: number;
  area: number;
  lastUpdated: string;
}

export interface Notification {
  _id: string;
  message: string;
  type: NotificationType;
  recipient: string;
  report?: { _id: string; title: string; category: ReportCategory };
  read: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ReportStats {
  total: number;
  byCategory: Array<{ _id: string; count: number }>;
  byStatus: Array<{ _id: string; count: number }>;
  recent: Array<{ _id: { year: number; month: number; day: number }; count: number }>;
}

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  wildfire: 'Wildfire',
  illegal_logging: 'Illegal Logging',
  water_leak: 'Water Leak',
  pollution: 'Pollution',
};

export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  wildfire: '#ef4444',
  illegal_logging: '#92400e',
  water_leak: '#3b82f6',
  pollution: '#6b7280',
};

export const CATEGORY_ICONS: Record<ReportCategory, string> = {
  wildfire: '🔥',
  illegal_logging: '🪵',
  water_leak: '💧',
  pollution: '☁️',
};

export const RISK_COLORS: Record<FireRiskLevel, string> = {
  Low: '#22c55e',
  Medium: '#eab308',
  High: '#f97316',
  'Very High': '#ef4444',
  Extreme: '#7f1d1d',
};
