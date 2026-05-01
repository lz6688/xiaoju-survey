import {
  getClientIp,
  getClientIpLocation,
  getClientIpMeta,
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

  it('should skip local proxy ip from x-forwarded-for', () => {
    const req = {
      headers: {
        'x-forwarded-for': '127.0.0.1, ::ffff:127.0.0.1, 203.0.113.7',
      },
      socket: {
        remoteAddress: '127.0.0.1',
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

  it('should query ip location by ip2region searcher', async () => {
    const searcher = {
      search: jest.fn().mockReturnValue('中国|浙江省|杭州市|电信|CN'),
    };

    const location = await queryIpLocation('203.0.113.7', {
      searcher,
    });

    expect(searcher.search).toHaveBeenCalledWith('203.0.113.7');
    expect(location).toBe('中国浙江省杭州市');
  });

  it('should query ip location and isp by ip2region searcher', async () => {
    const searcher = {
      search: jest.fn().mockReturnValue('中国|浙江省|杭州市|电信|CN'),
    };

    const meta = await getClientIpMeta('203.0.113.7', {
      searcher,
    });

    expect(meta).toEqual({
      ipLocation: '中国浙江省杭州市',
      ipIsp: '电信',
    });
  });

  it('should filter empty region fields from ip2region result', async () => {
    const searcher = {
      search: jest.fn().mockReturnValue('中国|0|深圳市|电信|CN'),
    };

    const location = await queryIpLocation('203.0.113.7', {
      searcher,
    });

    expect(location).toBe('中国深圳市');
  });

  it('should return empty location when ip2region query fails', async () => {
    const searcher = {
      search: jest.fn().mockImplementation(() => {
        throw new Error('invalid ip');
      }),
    };

    await expect(
      queryIpLocation('203.0.113.7', {
        searcher,
      }),
    ).resolves.toBe('');
  });

  it('should include queried ip location in request meta', async () => {
    const req = {
      headers: {
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      },
    };
    const searcher = {
      search: jest.fn().mockReturnValue('中国|浙江省|杭州市|电信|CN'),
    };

    await expect(
      getRequestMeta(req as any, {
        searcher,
      }),
    ).resolves.toEqual({
      ip: '203.0.113.7',
      ipLocation: '中国浙江省杭州市',
      ipIsp: '电信',
    });
    expect(searcher.search).toHaveBeenCalledTimes(1);
  });

  it('should return empty values when request is missing', async () => {
    await expect(getRequestMeta()).resolves.toEqual({
      ip: '',
      ipLocation: '',
      ipIsp: '',
    });
  });
});
