import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

describe('Dev logo badge', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders the gear badge in the Dev build, in the given header colour', async () => {
    vi.doMock('./config/build', () => ({ IS_RELEASE_BUILD: false }));
    const { DevLogoBadge } = await import('./components/DevLogoBadge');
    const html = renderToStaticMarkup(<DevLogoBadge fill="#4784F8" />);
    expect(html).toContain('data-testid="dev-logo-badge"');
    expect(html).toContain('fill="#4784F8"');
    expect(html).toContain('pointer-events:none');
  });

  it('renders nothing in the Release build', async () => {
    vi.doMock('./config/build', () => ({ IS_RELEASE_BUILD: true }));
    const { DevLogoBadge } = await import('./components/DevLogoBadge');
    expect(renderToStaticMarkup(<DevLogoBadge fill="#4784F8" />)).toBe('');
  });
});
