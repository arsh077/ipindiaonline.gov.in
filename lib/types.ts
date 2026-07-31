export interface PortalSettings {
  logo: string;
  organizationName: string;
  departmentName: string;
  attorneyName: string;
  attorneyNumber: string;
  emblemImage?: string;
  headerBanner?: string;
}

export interface TableColumn {
  id: string;
  key: string;
  label: string;
  visible: boolean;
}

export interface PaymentItem {
  id: string;
  sNo?: number | string;
  formNumber?: string;
  applicationNumber?: string;
  referenceNumber?: string;
  classes?: string;
  branch?: string;
  price?: number | string;
  customFields?: Record<string, string>;
}

export interface TermSection {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface PortalConfig {
  redirectURL: string;
}

export interface AdminUser {
  username: string;
  passwordHash: string;
}

export interface FullPortalData {
  portalSettings: PortalSettings;
  payments: PaymentItem[];
  tableColumns?: TableColumn[];
  terms: TermSection[];
  settings: PortalConfig;
  admin: AdminUser;
}
