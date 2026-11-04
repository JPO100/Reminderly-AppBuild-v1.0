import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DeletedInfoOverlay from '../../imports/deleted-info-overlay';
import type { LinkedControls } from '../../imports/LinkedListControls';

const linked = (overrides: Partial<LinkedControls> = {}): LinkedControls => ({
  linkable: true,
  statusText: 'Noterly: My London trip',
  onLinkableChange: () => {},
  unlinkLabel: 'Unlink from Noterly',
  onUnlink: () => {},
  ...overrides,
});

const render = (controls?: LinkedControls) => renderToStaticMarkup(
  <DeletedInfoOverlay title="Done recipe" buttonColor="#4784F8" buttonLabel="Mark as not done" onClose={() => {}} onMarkAsNotDone={() => {}} linked={controls} />,
);

describe('completed-list overlay with a linked list', () => {
  it('shows the status line and Unlink, and never the Make list linkable toggle', () => {
    const html = render(linked());
    expect(html).toContain('Noterly: My London trip');
    expect(html).toContain('Unlink from Noterly');
    expect(html).toContain('Mark as not done');
    expect(html).not.toContain('Make list linkable');
  });

  it('says Unlink all for several notes', () => {
    expect(render(linked({ statusText: 'Noterly: linked to 3 notes', unlinkLabel: 'Unlink all from Noterly' }))).toContain('Unlink all from Noterly');
  });

  it('is unchanged for a list with no links or the flag off', () => {
    for (const controls of [undefined, linked({ unlinkLabel: null, statusText: 'No note currently linked' })]) {
      const html = render(controls);
      expect(html).toContain('Mark as not done');
      expect(html).not.toContain('Unlink');
      expect(html).not.toContain('No note currently linked');
      expect(html).not.toContain('Make list linkable');
    }
  });
});
