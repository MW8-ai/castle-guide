import type { ErrorObject } from 'ajv';

/**
 * Turn AJV errors into human-readable messages.
 * Never surface raw AJV output to end users.
 */
export function humanizeAjvErrors(
  errors: ErrorObject[] | null | undefined
): string[] {
  if (!errors?.length) return ['Validation failed for an unknown reason.'];

  return errors.map((err) => {
    const missing =
      err.params && 'missingProperty' in err.params
        ? String((err.params as { missingProperty: string }).missingProperty)
        : null;
    const additional =
      err.params && 'additionalProperty' in err.params
        ? String((err.params as { additionalProperty: string }).additionalProperty)
        : null;

    const owner = describeOwner(err.instancePath);

    if (err.keyword === 'required' && missing) {
      return `${owner} is missing '${missing}'.`;
    }
    if (err.keyword === 'additionalProperties' && additional) {
      return `${owner} has unknown field '${additional}'.`;
    }
    if (err.keyword === 'type') {
      const expected = String(
        (err.params as { type?: string }).type ?? 'a different type'
      );
      return `${owner} has the wrong type (expected ${expected}).`;
    }
    if (err.keyword === 'const') {
      return `${owner} has an unsupported value.`;
    }
    if (err.keyword === 'enum') {
      return `${owner} must be one of the allowed values.`;
    }
    if (err.keyword === 'minLength') {
      return `${owner} is empty or too short.`;
    }
    if (err.keyword === 'exclusiveMinimum' || err.keyword === 'minimum') {
      return `${owner} must be a positive number.`;
    }
    if (err.keyword === 'minItems') {
      return `${owner} needs at least one entry.`;
    }
    return `${owner}: ${err.message ?? 'invalid'}.`;
  });
}

/** /property/items/2 → "item 3" */
function describeOwner(instancePath: string): string {
  if (!instancePath) return 'Import';

  const parts = instancePath.split('/').filter(Boolean);
  // Drop leading "property" for shorter messages when nested
  const start = parts[0] === 'property' ? 1 : 0;
  const slice = parts.slice(start);

  if (slice.length === 0) return 'Property';

  const chunks: string[] = [];
  for (let i = 0; i < slice.length; i++) {
    const p = slice[i];
    const n = slice[i + 1];
    if (p === 'items' && n !== undefined && /^\d+$/.test(n)) {
      chunks.push(`item ${Number(n) + 1}`);
      i++;
      continue;
    }
    if (p === 'rooms' && n !== undefined && /^\d+$/.test(n)) {
      chunks.push(`room ${Number(n) + 1}`);
      i++;
      continue;
    }
    if (p === 'paintCards' && n !== undefined && /^\d+$/.test(n)) {
      chunks.push(`paint card ${Number(n) + 1}`);
      i++;
      continue;
    }
    if (p === 'shutoffs' && n !== undefined && /^\d+$/.test(n)) {
      chunks.push(`shutoff ${Number(n) + 1}`);
      i++;
      continue;
    }
    if (/^\d+$/.test(p)) {
      chunks.push(`entry ${Number(p) + 1}`);
      continue;
    }
    if (i === slice.length - 1 && chunks.length) {
      // leaf field name — attach as context for type errors
      chunks.push(`'${p}'`);
      continue;
    }
    if (p === 'property') {
      chunks.push('property');
      continue;
    }
    chunks.push(p);
  }

  if (chunks.length === 0) return 'Import';
  // Prefer "item 3" over "item 3 'brand'" for required (owner is parent path)
  if (errIsParentOnly(instancePath)) {
    return chunks.filter((c) => !c.startsWith("'")).join(' ') || 'Import';
  }
  return chunks.join(' ');
}

function errIsParentOnly(_path: string): boolean {
  // required errors use parent instancePath — describeOwner already has no leaf
  return true;
}
