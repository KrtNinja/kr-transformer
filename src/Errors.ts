export class TransformerError extends Error {
  name = 'TransformerError';
}

export const Message = {
  INVALID_CONSTRUCTOR: 'Provided as second argument class constructor cannot be invoked with "new"',
  INVALID_JSON: (input: any, Name: string) => {
    return `Json provided as first argument has type "${typeof input}" and can't be transformed to instance of "${Name}"`
  },
  INVALID_NUMBER_OF_ARGUMENTS: (length: number) => {
    return `Invalid number of arguments. Expect 2-3, but received "${length}"`
  },
  MISMATCH_SCHEMA: (key: string, Name: string) => {
    return `The json don't match "${Name}" schema, cause required property "${key}" in "${Name}" don't exists in json`
  },
  INVALID_TYPE: (key: string, Name: string, expected: any, actual: any) => {
    return `Invalid type of "${key}" in json. ${Name} expect type to be ${typeof expected} but got ${typeof actual}`
  },
  INVALID_SET_TYPE: (key: string, Name: string) => {
    return `Can't create "Set" for property "${key}" in "${Name}" cause type of "${key} in json isn't "Array"`
  },
  INVALID_MAP_TYPE: (key: string, Name: string) => {
    return `Can't create "Map" for property "${key}" in "${Name}" cause type of "${key} in json isn't "Object"`
  },
  INVALID_ARRAY_TYPE: (key: string, Name: string) => {
    return `Can't create "Array" for property "${key}" in "${Name}" cause type of "${key} in json isn't "Array"`
  },
  INVALID_DATE_TYPE: (key: string, Name: string) => {
    return `Can't create "Date" for property "${key}" in "${Name}" cause type of "${key} in json isn't "String" or "Number"`
  }
}