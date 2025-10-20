export enum ConfigurationType {
  TAX_SETTINGS = 'tax_settings',
  COMMISSION_SETTINGS = 'commission_settings',
  PAYMENT_SETTINGS = 'payment_settings',
  PAYOUT_SETTINGS = 'payout_settings',
  FEE_SETTINGS = 'fee_settings',
  CURRENCY_SETTINGS = 'currency_settings',
}

export enum ConfigurationScope {
  GLOBAL = 'global',
  PARTNER = 'partner',
  REGION = 'region',
  CATEGORY = 'category',
}

export interface ConfigurationValue {
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    required?: boolean;
    enum?: any[];
  };
  metadata?: Record<string, any>;
}

export interface ConfigurationChange {
  configId: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  rollbackData?: any;
}

export interface ConfigurationVersion {
  id: string;
  configId: string;
  version: number;
  configuration: Record<string, ConfigurationValue>;
  createdBy: string;
  createdAt: Date;
  description?: string;
  isActive: boolean;
}
