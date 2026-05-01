import { Request } from 'express';
import { join } from 'node:path';

interface Ip2RegionSearcher {
  search(ip: string): string | Promise<string>;
}

interface QueryIpLocationOptions {
  searcher?: Ip2RegionSearcher;
  ipv4DbPath?: string;
  ipv6DbPath?: string;
}

type Ip2RegionModule = {
  IPv4: any;
  IPv6: any;
  loadContentFromFile: (dbPath: string) => Buffer;
  newWithBuffer: (version: any, cBuffer: Buffer) => Ip2RegionSearcher;
};

const getDefaultIp2RegionDbPath = (fileName: string) => {
  const distRoot = __dirname.endsWith('dist/utils')
    ? join(__dirname, '..')
    : join(__dirname, '..', '..', 'dist');
  return join(distRoot, 'ip2region', 'data', fileName);
};

const DEFAULT_IPV4_DB_PATH = getDefaultIp2RegionDbPath('ip2region_v4.xdb');
const DEFAULT_IPV6_DB_PATH = getDefaultIp2RegionDbPath('ip2region_v6.xdb');

let ip2RegionModulePromise: Promise<Ip2RegionModule> | null = null;
let ipv4Searcher: Ip2RegionSearcher | null = null;
let ipv6Searcher: Ip2RegionSearcher | null = null;

const getHeaderValue = (req: Request | undefined, headerName: string) => {
  const value = req?.headers?.[headerName.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const normalizeIp = (ip = '') => {
  return ip
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
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
};

const isIpv6 = (ip = '') => ip.includes(':');

const getIp2RegionModule = () => {
  if (!ip2RegionModulePromise) {
    ip2RegionModulePromise = new Function(
      'specifier',
      'return import(specifier)',
    )('ip2region.js') as Promise<Ip2RegionModule>;
  }

  return ip2RegionModulePromise;
};

const getIp2RegionSearcher = async (
  ip: string,
  { ipv4DbPath, ipv6DbPath }: QueryIpLocationOptions = {},
) => {
  const ip2Region = await getIp2RegionModule();

  if (isIpv6(ip)) {
    if (!ipv6Searcher || ipv6DbPath) {
      ipv6Searcher = ip2Region.newWithBuffer(
        ip2Region.IPv6,
        ip2Region.loadContentFromFile(ipv6DbPath || DEFAULT_IPV6_DB_PATH),
      );
    }
    return ipv6Searcher;
  }

  if (!ipv4Searcher || ipv4DbPath) {
    ipv4Searcher = ip2Region.newWithBuffer(
      ip2Region.IPv4,
      ip2Region.loadContentFromFile(ipv4DbPath || DEFAULT_IPV4_DB_PATH),
    );
  }
  return ipv4Searcher;
};

const formatIp2RegionLocation = (region = '') => {
  return region
    .split('|')
    .slice(0, 3)
    .filter((item) => item && item !== '0')
    .join('')
    .trim();
};

const formatIp2RegionIsp = (region = '') => {
  const isp = region.split('|')[3] || '';
  return isp === '0' ? '' : isp.trim();
};

export const getClientIpMeta = async (
  ip: string,
  options: QueryIpLocationOptions = {},
) => {
  if (isLocalIp(ip)) {
    return {
      ipLocation: '',
      ipIsp: '',
    };
  }

  try {
    const searcher = options.searcher || (await getIp2RegionSearcher(ip, options));
    const region = await searcher.search(ip);
    return {
      ipLocation: formatIp2RegionLocation(region),
      ipIsp: formatIp2RegionIsp(region),
    };
  } catch (error) {
    return {
      ipLocation: '',
      ipIsp: '',
    };
  }
};

export const queryIpLocation = async (
  ip: string,
  options: QueryIpLocationOptions = {},
) => {
  const { ipLocation } = await getClientIpMeta(ip, options);
  return ipLocation;
};

export const getClientIp = (req?: Request) => {
  const forwardedFor = getHeaderValue(req, 'x-forwarded-for');
  const realIp = getHeaderValue(req, 'x-real-ip');
  const remoteAddress = req?.socket?.remoteAddress || req?.ip || '';
  const ipList = [forwardedFor, realIp, remoteAddress]
    .filter(Boolean)
    .flatMap((ip) => ip.split(','))
    .map(normalizeIp)
    .filter(Boolean);

  return ipList.find((ip) => !isLocalIp(ip)) || ipList[0] || '';
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
  const headerLocation = decodeHeaderValue(
    getHeaderValue(req, 'x-ip-location') ||
      getHeaderValue(req, 'x-real-location') ||
      getHeaderValue(req, 'x-client-location') ||
      '',
  ).trim();
  const ipMeta = await getClientIpMeta(ip, options);

  return {
    ip,
    ipLocation: headerLocation || ipMeta.ipLocation,
    ipIsp: ipMeta.ipIsp,
  };
};
