export class TransformerError extends Error { }

export const INVALID = {
  TARGET: (path: string[]) => `Target class "${path.join('.')}" can't be invoked with "new"`,
  JSON: (path: string[]) => `Source can't be converted to target class "${path.join('.')}"`,
  TYPE: (key: string, path: string[]) => `Value of "${key}" in source, can't be converted to type of "${path.join('.')}"`,
}
