import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('requestMeta dist assets', () => {
  it('should include ip2region xdb files in dist and prefer dist asset paths', () => {
    const distRoot = join(__dirname, '..', '..', '..', 'dist');
    const ipv4DbPath = join(distRoot, 'ip2region', 'data', 'ip2region_v4.xdb');
    const ipv6DbPath = join(distRoot, 'ip2region', 'data', 'ip2region_v6.xdb');
    const requestMetaJsPath = join(distRoot, 'utils', 'requestMeta.js');

    expect(existsSync(ipv4DbPath)).toBe(true);
    expect(existsSync(ipv6DbPath)).toBe(true);
    expect(readFileSync(requestMetaJsPath, 'utf8')).toContain(
      "join)(distRoot, 'ip2region', 'data', fileName)",
    );
    expect(readFileSync(requestMetaJsPath, 'utf8')).not.toContain(
      "join)(__dirname, '..', '..', 'ip2region', 'data', fileName)",
    );
  });
});
