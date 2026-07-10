import fence from '../../data/knowledge/law-fence-basics.json';
import type { Nugget } from '../council';

export function getLawModules(): Nugget[] {
  return [fence as Nugget];
}
