import type { Reporter, ReporterType } from './types.js';
import { ConsoleReporter } from './console.js';
import { JsonReporter } from './json.js';
import { SarifReporter } from './sarif.js';

export function createReporter(type: ReporterType, noColor = false): Reporter {
  switch (type) {
    case 'json':
      return new JsonReporter();
    case 'sarif':
      return new SarifReporter();
    case 'console':
    default:
      return new ConsoleReporter(noColor);
  }
}

export { type Reporter, type ReporterType } from './types.js';
export { ConsoleReporter } from './console.js';
export { JsonReporter } from './json.js';
export { SarifReporter } from './sarif.js';
