import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Property, ShutoffType } from '../../storage';
import { newId } from '../../storage';
import { go } from '../paths';

interface Props {
  id?: string;
}

const SHUTOFF_TYPES: ShutoffType[] = [
  'water',
  'gas',
  'electric-main',
  'breaker-panel',
  'sump',
  'septic',
  'other',
];

export function EmergencyPage({ id }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [shutoffType, setShutoffType] = useState<ShutoffType>('water');
  const [shutoffNote, setShutoffNote] = useState('');
  const [showAddShutoff, setShowAddShutoff] = useState(false);

  async function refresh() {
    if (!id) return;
    const s = await ensureStorageReady();
    setProperty(await s.getProperty(id));
  }

  useEffect(() => {
    void refresh();
  }, [id]);

  if (!id) return <p class="error-text">Missing property.</p>;
  if (!property) return <p class="muted">Loading…</p>;

  async function addContact(e: Event) {
    e.preventDefault();
    if (!label.trim() || !phone.trim()) return;
    const s = await ensureStorageReady();
    const p = await s.getProperty(id!);
    if (!p) return;
    p.emergencyContacts = [
      ...p.emergencyContacts,
      { id: newId(), label: label.trim(), phone: phone.trim(), notes: notes.trim() || null },
    ];
    await s.saveProperty(p);
    setLabel('');
    setPhone('');
    setNotes('');
    await refresh();
  }

  async function removeContact(contactId: string) {
    const s = await ensureStorageReady();
    const p = await s.getProperty(id!);
    if (!p) return;
    p.emergencyContacts = p.emergencyContacts.filter((c) => c.id !== contactId);
    await s.saveProperty(p);
    await refresh();
  }

  async function addShutoff(e: Event) {
    e.preventDefault();
    if (!shutoffNote.trim()) return;
    const s = await ensureStorageReady();
    await s.addShutoff(id!, { type: shutoffType, locationNote: shutoffNote.trim() });
    setShutoffNote('');
    setShowAddShutoff(false);
    await refresh();
  }

  async function removeShutoff(shutoffId: string) {
    const s = await ensureStorageReady();
    const p = await s.getProperty(id!);
    if (!p) return;
    p.shutoffs = p.shutoffs.filter((sh) => sh.id !== shutoffId);
    await s.saveProperty(p);
    await refresh();
  }

  return (
    <section class="page">
      <p class="eyebrow">
        <button type="button" class="btn" onClick={() => go('property', id!, 'house')}>
          ← House
        </button>
      </p>
      <h1>🚨 Emergency</h1>
      <p class="muted">Who to call, and where things shut off.</p>

      <div class="card">
        <h2>Contacts</h2>
        {property.emergencyContacts.length === 0 ? (
          <p class="muted">No contacts saved yet — add plumber, electrician, poison control, etc.</p>
        ) : (
          <ul class="plain-list">
            {property.emergencyContacts.map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{c.label}</strong>
                  <div class="mono">{c.phone}</div>
                  {c.notes && <div class="muted tiny">{c.notes}</div>}
                </div>
                <button
                  type="button"
                  class="kit-icon-btn"
                  aria-label="Remove"
                  onClick={() => void removeContact(c.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <form class="form-grid" onSubmit={(e) => void addContact(e)}>
          <label>
            Who
            <input
              value={label}
              onInput={(e) => setLabel((e.target as HTMLInputElement).value)}
              placeholder="Plumber, electrician, poison control…"
            />
          </label>
          <label>
            Phone
            <input
              value={phone}
              onInput={(e) => setPhone((e.target as HTMLInputElement).value)}
              placeholder="(555) 555-0100"
            />
          </label>
          <label>
            Notes (optional)
            <input
              value={notes}
              onInput={(e) => setNotes((e.target as HTMLInputElement).value)}
              placeholder="24/7 line, account #, etc."
            />
          </label>
          <button type="submit" class="btn primary">
            Add contact
          </button>
        </form>
      </div>

      <div class="card">
        <h2>Shutoffs</h2>
        {property.shutoffs.length === 0 ? (
          <p class="muted">No shutoffs logged yet.</p>
        ) : (
          <ul class="plain-list">
            {property.shutoffs.map((sh) => (
              <li key={sh.id}>
                <div>
                  <strong>{sh.type.replace(/-/g, ' ')}</strong>
                  <div class="muted tiny">{sh.locationNote || 'No location noted yet.'}</div>
                </div>
                <button
                  type="button"
                  class="kit-icon-btn"
                  aria-label="Remove"
                  onClick={() => void removeShutoff(sh.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {showAddShutoff ? (
          <form class="form-grid" onSubmit={(e) => void addShutoff(e)}>
            <label>
              Type
              <select
                value={shutoffType}
                onChange={(e) =>
                  setShutoffType((e.target as HTMLSelectElement).value as ShutoffType)
                }
              >
                {SHUTOFF_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Location
              <input
                value={shutoffNote}
                onInput={(e) => setShutoffNote((e.target as HTMLInputElement).value)}
                placeholder="e.g. Front wall by hose bib"
              />
            </label>
            <button type="submit" class="btn primary">
              Save
            </button>
            <button type="button" class="btn" onClick={() => setShowAddShutoff(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <button type="button" class="btn" onClick={() => setShowAddShutoff(true)}>
            + Add shutoff
          </button>
        )}
      </div>
    </section>
  );
}
