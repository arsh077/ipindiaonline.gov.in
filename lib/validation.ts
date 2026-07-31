import { PaymentItem, PortalSettings, TableColumn, TermSection } from '@/lib/types';

const MAX_DATA_URL_BYTES = 5 * 1024 * 1024;
const standardColumnKeys = new Set(['sNo', 'formNumber', 'applicationNumber', 'referenceNumber', 'classes', 'branch', 'price']);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function text(value: unknown, name: string, max: number, required = false): string | undefined {
  if (value === undefined || value === null) {
    if (required) throw new Error(`${name} is required`);
    return undefined;
  }
  if (typeof value !== 'string') throw new Error(`${name} must be text`);
  const cleaned = value.trim();
  if (required && !cleaned) throw new Error(`${name} is required`);
  if (cleaned.length > max) throw new Error(`${name} must be ${max} characters or fewer`);
  return cleaned;
}

export function url(value: unknown, name: string): string {
  const candidate = text(value, name, 2048, true)!;
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    return parsed.toString();
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) URL`);
  }
}

function image(value: unknown, name: string): string | undefined {
  const candidate = text(value, name, MAX_DATA_URL_BYTES, false);
  if (candidate === undefined || candidate === '') return candidate;
  if (candidate.startsWith('/') || candidate.startsWith('https://') || candidate.startsWith('http://')) return candidate;
  if (candidate.startsWith('data:image/') && candidate.length <= MAX_DATA_URL_BYTES) return candidate;
  throw new Error(`${name} must be an image URL, local path, or image data URL`);
}

export function payment(value: unknown, id: string, sNo: number): PaymentItem {
  if (!isRecord(value)) throw new Error('Each payment must be an object');
  const priceValue = value.price;
  const price = typeof priceValue === 'number' ? priceValue : Number(priceValue ?? 0);
  if (!Number.isFinite(price) || price < 0 || price > 10_000_000) throw new Error('Price must be between 0 and 10,000,000');
  return {
    id,
    sNo,
    formNumber: text(value.formNumber, 'Form number', 50) || 'TM-A',
    applicationNumber: text(value.applicationNumber, 'Application number', 100) || '',
    referenceNumber: text(value.referenceNumber, 'Reference number', 100) || '',
    classes: text(value.classes, 'Classes', 100) || '',
    branch: text(value.branch, 'Branch', 100) || 'DELHI',
    price,
  };
}

export function payments(value: unknown): PaymentItem[] {
  if (!Array.isArray(value) || value.length > 500) throw new Error('Payments must be an array with at most 500 rows');
  return value.map((item, index) => {
    const givenId = isRecord(item) && typeof item.id === 'string' ? item.id : '';
    return payment(item, givenId || crypto.randomUUID(), index + 1);
  });
}

export function columns(value: unknown): TableColumn[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 25) throw new Error('Columns must contain between 1 and 25 items');
  const seen = new Set<string>();
  return value.map((item, index) => {
    if (!isRecord(item)) throw new Error('Each column must be an object');
    const key = text(item.key, 'Column key', 50, true)!;
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key) || seen.has(key)) throw new Error('Column keys must be unique letters, numbers, or underscores');
    seen.add(key);
    const custom = !standardColumnKeys.has(key);
    return {
      id: text(item.id, 'Column id', 100) || `col-${index + 1}`,
      key,
      label: text(item.label, 'Column label', 80, true)!,
      visible: typeof item.visible === 'boolean' ? item.visible : true,
      ...(custom ? {} : {}),
    };
  });
}

export function terms(value: unknown): TermSection[] {
  if (!Array.isArray(value) || value.length > 50) throw new Error('Terms must be an array with at most 50 sections');
  return value.map((item, index) => {
    if (!isRecord(item)) throw new Error('Each term must be an object');
    return {
      id: text(item.id, 'Term id', 100) || crypto.randomUUID(),
      order: index + 1,
      title: text(item.title, 'Term title', 250, true)!,
      description: text(item.description, 'Term description', 20_000, true)!,
    };
  });
}

export function portalSettings(value: unknown, current: PortalSettings): PortalSettings {
  if (!isRecord(value)) throw new Error('Header settings must be an object');
  return {
    logo: value.logo === undefined ? current.logo : image(value.logo, 'Logo') || '',
    emblemImage: value.emblemImage === undefined ? current.emblemImage : image(value.emblemImage, 'Emblem image'),
    headerBanner: value.headerBanner === undefined ? current.headerBanner : image(value.headerBanner, 'Header banner'),
    organizationName: value.organizationName === undefined ? current.organizationName : text(value.organizationName, 'Organization name', 250, true)!,
    departmentName: value.departmentName === undefined ? current.departmentName : text(value.departmentName, 'Department name', 250, true)!,
    attorneyName: value.attorneyName === undefined ? current.attorneyName : text(value.attorneyName, 'Attorney name', 150, true)!,
    attorneyNumber: value.attorneyNumber === undefined ? current.attorneyNumber : text(value.attorneyNumber, 'Attorney number', 100, true)!,
  };
}
