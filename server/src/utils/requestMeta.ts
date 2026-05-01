import { Request } from 'express';
import fetch from 'node-fetch';

type Fetcher = typeof fetch;

interface QueryIpLocationOptions {
  fetcher?: Fetcher;
  timeoutMs?: number;
  apiUrl?: string;
}

const DEFAULT_IP_LOCATION_API =
  'http://ip-api.com/json/{ip}?lang=zh-CN&fields=status,message,country,regionName,city,query';

const DEFAULT_TIMEOUT_MS = 1500;

const getHeaderValue = (req: Request | undefined, headerName: string) => {
  const value = req?.headers?.[headerName.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const normalizeIp = (ip = '') => {
  return ip
    .split(',')[0]
    .trim()
    .replace(/^::ffff:/, '')
    .replace(/^::1$/, '127.0.0.1');
};

const decodeHeaderValue = (value = '') => {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};

const isLocalIp = (ip = '') => {
  return (
    !ip ||
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
};

const buildLocation = (data: Record<string, any>) => {
  if (data.pro || data.province) {
    return [data.pro || data.province, data.city, data.region]
      .filter(Boolean)
      .join('')
      .trim();
  }

  return [data.country, data.regionName, data.city].filter(Boolean).join('').trim();
};

export const queryIpLocation = async (
  ip: string,
  {
    fetcher = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    apiUrl = process.env.XIAOJU_SURVEY_IP_LOCATION_API ||
      DEFAULT_IP_LOCATION_API,
  }: QueryIpLocationOptions = {},
) => {
  if (isLocalIp(ip)) {
    return '';
  }

  const url = apiUrl.replace('{ip}', encodeURIComponent(ip));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(url, {
      method: 'GET',
      signal: controller.signal,
    });
    if (!response.ok) {
      return '';
    }

    const data = await response.json();
    if (data.status && data.status !== 'success') {
      return '';
    }

    return buildLocation(data);
  } catch (error) {
    return '';
  } finally {
    clearTimeout(timer);
  }
};

export const getClientIp = (req?: Request) => {
  const forwardedFor = getHeaderValue(req, 'x-forwarded-for');
  const realIp = getHeaderValue(req, 'x-real-ip');
  const remoteAddress = req?.socket?.remoteAddress || req?.ip || '';

  return normalizeIp(forwardedFor || realIp || remoteAddress);
};

export const getClientIpLocation = async (
  req?: Request,
  options?: QueryIpLocationOptions,
) => {
  const location =
    getHeaderValue(req, 'x-ip-location') ||
    getHeaderValue(req, 'x-real-location') ||
    getHeaderValue(req, 'x-client-location') ||
    '';

  const headerLocation = decodeHeaderValue(location).trim();
  if (headerLocation) {
    return headerLocation;
  }

  return queryIpLocation(getClientIp(req), options);
};

export const getRequestMeta = async (
  req?: Request,
  options?: QueryIpLocationOptions,
) => {
  const ip = getClientIp(req);
  return {
    ip,
    ipLocation: await getClientIpLocation(req, options),
  };
};
