import { Message, TransformerError } from './Errors.js';

/** Transform json or plain object to class instance and vice versa */
export class Transformer {
  static #descriptor = { writable: false, enumerable: false } as PropertyDescriptor;

  static fromJSON<T extends Object>(json: JSON | Object, Class: { new(): T }, strict = true): T {
    let instance!: T

    if (arguments.length < 2) {
      throw new TransformerError(Message.INVALID_NUMBER_OF_ARGUMENTS(arguments.length))
    }
    try {
      instance = new Class()
    } catch {
      throw new TransformerError(Message.INVALID_CONSTRUCTOR)
    }

    const Name = Class.name
    const types = Reflect.get(Class, 'types') || Object.create(null)

    if (json == null || typeof json !== 'object') {
      throw new TransformerError(Message.INVALID_JSON(json, Name))
    }

    Reflect.ownKeys(instance).forEach(property => {
      const { writable, enumerable } = Reflect.getOwnPropertyDescriptor(instance, property) || this.#descriptor
      if (!writable || !enumerable) { return; }
      // Treat them as private
      if (typeof property === 'symbol') { return; }

      const value = Reflect.get(instance, property)
      // Ignoring methods
      if (typeof value === 'function') { return; }

      const jpd = Reflect.getOwnPropertyDescriptor(json, property)
      if (!jpd) {
        if (strict) {
          throw new TransformerError(Message.MISMATCH_SCHEMA(property, Name))
        }
        return;
      }

      const jsonValue = Reflect.get(json, property)

      if (Object(value) !== value) {
        if (strict && typeof value !== typeof jsonValue) {
          throw new TransformerError(Message.INVALID_TYPE(property, Name, value, jsonValue))
        }
        return Reflect.set(instance, property, jsonValue)
      }

      if (Array.isArray(value)) {
        if (!Array.isArray(jsonValue)) {
          if (strict) {
            throw new TransformerError(Message.INVALID_ARRAY_TYPE(property, Name))
          }
          return Reflect.set(instance, property, jsonValue)
        }
        // Getting declared type of array elements if exists
        const Type = Reflect.get(types, property)
        // Considering elements are primitives, or shouldn't be transformed
        if (!Type) {
          return Reflect.set(instance, property, jsonValue)
        }
        for (const element of jsonValue) {
          if (typeof Type?.now === 'function') {
            value.push(new Date(element))
          } else {
            value.push(this.fromJSON(element, Type))
          }
        }
        return;
      }

      if (value instanceof Map) {
        if (typeof jsonValue !== 'object' || jsonValue == null) {
          if (strict) {
            throw new TransformerError(Message.INVALID_MAP_TYPE(property, Name))
          }
          return Reflect.set(instance, property, jsonValue)
        }
        // Getting declared type of map elements if exists
        const Type = Reflect.get(types, property)
        Object.entries(jsonValue).forEach(([k, v]) => {
          if (Type) {
            value.set(k, this.fromJSON(v, Type))
          } else {
            value.set(k, v)
          }
        })
        return;
      }

      if (value instanceof Set) {
        if (!Array.isArray(jsonValue)) {
          if (strict) {
            throw new TransformerError(Message.INVALID_SET_TYPE(property, Name))
          }
          return Reflect.set(instance, property, jsonValue)
        }
        // Getting declared type of set elements if exists
        const Type = Reflect.get(types, property)
        jsonValue.forEach(item => {
          if (Type) {
            value.add(this.fromJSON(item, Type))
          } else {
            value.add(item)
          }
        })
      }

      if (value instanceof Date) {
        if (typeof jsonValue === 'string' || typeof jsonValue === 'number') {
          return Reflect.set(instance, property, new Date(jsonValue))
        }
        if (strict) {
          throw new TransformerError(Message.INVALID_DATE_TYPE(property, Name))
        }
        return Reflect.set(instance, property, jsonValue)
      }

      const Constructor = Reflect.getPrototypeOf(value as Object)?.constructor
      // Consider that initial value is an object without prototype
      if (!Constructor) {
        if (strict && jsonValue == null || typeof jsonValue !== 'object') {
          throw new TransformerError(Message.INVALID_TYPE(property, Name, value, jsonValue))
        }
        return Reflect.set(instance, property, jsonValue || value)
      }

      return Reflect.set(instance, property, this.fromJSON(jsonValue, Constructor as { new(): Object }))
    })

    return instance
  }

  static toJSON(instance: Object): JSON | Object {
    const result = Object.create(null)
    Reflect.ownKeys(instance).forEach(property => {
      const value = Reflect.get(instance, property)
      if (typeof value === 'function') { return; }
      if (typeof property === 'symbol') { return; }
      if (Object(value) !== value) {
        return Reflect.set(result, property, value)
      }

      if (Array.isArray(value) || value instanceof Set) {
        const array: any[] = []
        value.forEach(item => {
          if (Object(item) !== item) {
            array.push(item)
          } else {
            array.push(this.toJSON(item))
          }
        })
        return Reflect.set(result, property, array)
      }

      if (value instanceof Map) {
        const object = Object.create(null)
        value.forEach((item, key) => {
          if (Object(item) !== item) {
            Reflect.set(object, key, item)
          } else {
            Reflect.set(object, key, this.toJSON(item))
          }
        })
        return Reflect.set(result, property, object)
      }

      if (value instanceof Date) {
        return Reflect.set(result, property, value)
      }
      return Reflect.set(result, property, this.toJSON(value))
    })
    return JSON.parse(JSON.stringify(result))
  }
}