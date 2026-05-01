import {
  getClientIp,
  getClientIpLocation,
  getRequestMeta,
  queryIpLocation,
} from '../requestMeta';

describe('requestMeta', () => {
  it('should get the first ip from x-forwarded-for', () => {
    const req = {
      headers: {
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      },
      socket: {
        remoteAddress: '10.0.0.2',
      },
    };

    expect(getClientIp(req as any)).toBe('203.0.113.7');
  });

  it('should normalize socket remote address', () => {
    const req = {
      headers: {},
      socket: {
        remoteAddress: '::ffff:203.0.113.7',
      },
    };

    expect(getClientIp(req as any)).toBe('203.0.113.7');
  });

  it('should decode ip location header', async () => {
    const req = {
      headers: {
        'x-ip-location': '%E5%8C%97%E4%BA%AC%E5%B8%82',
      },
    };

    await expect(getClientIpLocation(req as any)).resolves.toBe('北京市');
  });

  it('should query ip location by ip', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: 'success',
        country: '中国',
        regionName: '浙江省',
        city: '杭州市',
      }),
    });

    const location = await queryIpLocation('203.0.113.7', {
      fetcher,
      timeoutMs: 1000,
    });

    expect(fetcher).toHaveBeenCalledWith(
      'http://ip-api.com/json/203.0.113.7?lang=zh-CN&fields=status,message,country,regionName,city,query',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(location).toBe('中国浙江省杭州市');
  });

  it('should support province style location response', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        pro: '浙江省',
        city: '杭州市',
        addr: '浙江省杭州市 电信',
      }),
    });

    const location = await queryIpLocation('203.0.113.7', {
      fetcher,
      timeoutMs: 1000,
      apiUrl: 'http://example.test/ip?ip={ip}',
    });

    expect(fetcher).toHaveBeenCalledWith(
      'http://example.test/ip?ip=203.0.113.7',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(location).toBe('浙江省杭州市');
  });

  it('should return empty location when query api fails', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('network error'));

    await expect(
      queryIpLocation('203.0.113.7', {
        fetcher,
        timeoutMs: 1000,
      }),
    ).resolves.toBe('');
  });

  it('should include queried ip location in request meta', async () => {
    const req = {
      headers: {
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      },
    };
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: 'success',
        country: '中国',
        regionName: '浙江省',
        city: '杭州市',
      }),
    });

    await expect(
      getRequestMeta(req as any, {
        fetcher,
        timeoutMs: 1000,
      }),
    ).resolves.toEqual({
      ip: '203.0.113.7',
      ipLocation: '中国浙江省杭州市',
    });
  });

  it('should return empty values when request is missing', async () => {
    await expect(getRequestMeta()).resolves.toEqual({
      ip: '',
      ipLocation: '',
    });
  });
});
