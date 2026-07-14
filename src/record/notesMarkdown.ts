import type { Property } from '../storage/types';

/** Collective homeowner notes as a single markdown document. */
export function notesToMarkdown(property: Property): string {
  const lines: string[] = [
    `# ${property.name} — homeowner notes`,
    '',
    property.address ? `**Address:** ${property.address}` : '',
    property.yearBuilt ? `**Year built:** ${property.yearBuilt}` : '',
    `**Exported:** ${new Date().toISOString().slice(0, 10)}`,
    '',
  ].filter(Boolean) as string[];

  const byRoom = new Map<string, typeof property.notes>();
  const loose: typeof property.notes = [];

  for (const n of property.notes) {
    if (n.roomId) {
      const list = byRoom.get(n.roomId) ?? [];
      list.push(n);
      byRoom.set(n.roomId, list);
    } else {
      loose.push(n);
    }
  }

  for (const room of property.rooms) {
    const notes = byRoom.get(room.id);
    if (!notes?.length) continue;
    lines.push(`## ${room.name}`, '');
    for (const n of notes) {
      if (n.title) lines.push(`### ${n.title}`, '');
      lines.push(n.body, '');
      if (n.someday && n.roughBudget != null) {
        lines.push(`> Build list · ~$${n.roughBudget.toLocaleString()}`, '');
      }
    }
  }

  if (loose.length) {
    lines.push('## General', '');
    for (const n of loose) {
      if (n.title) lines.push(`### ${n.title}`, '');
      lines.push(n.body, '');
    }
  }

  if (property.notes.length === 0) {
    lines.push('_No notes yet. Walk a room and write one._', '');
  }

  return lines.join('\n');
}

export function downloadNotesMarkdown(property: Property): void {
  const md = notesToMarkdown(property);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${property.name.replace(/\s+/g, '-').toLowerCase()}-notes.md`;
  a.click();
  URL.revokeObjectURL(url);
}
