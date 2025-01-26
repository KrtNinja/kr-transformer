import { Message, TransformerError } from './Errors.js';

interface Descriptor {
  /** Any class constructor including built in (String, Number, Boolean, Date e.t.c) */
  type: { new(): any },

  /** Describes type of elements in collection. <br />
   * If Schema[property] is Map, Set or Array, than property "of" describes the type of elements in collection. <br />
   * I.e. Array<Schema[property]['off']> <br />
   * If not specified, the values from json will be used "as is".
   *   */
  of?: { new(): unknown }

  /** Can value of this property be null? */
  nullable?: boolean,

  /** Will `throw` if type of value in json doesn't match schema. <br/>
   * Otherwise, the value in json will be used "as is". <br />
   * Is considering "true" by default. <br />
   * Takes precedence over the parameter "strict", passed to the fromJSON method as third argument.
   * */
  strict?: boolean
}

/** Describes expected behaviour during transformation,
 * and types of Target properties. <br />
 *
 * Use this only for `nullable properties`, or to describe `types of collections`. <br />
 * There is no reason to describe each property, is much better and easier to set default values.
 * */
export type Schema<T extends Object> = { [Property in keyof T]?: T[Property] extends Function ? never : Descriptor }


/** Transform json or plain object to class instance and vice versa */
export class Transformer {
  static #descriptor = { writable: false } as PropertyDescriptor;

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
    const types: Schema<T> = Reflect.get(Class, 'types') || Object.create(null) as Schema<T>

    if (json == null || typeof json !== 'object') {
      throw new TransformerError(Message.INVALID_JSON(json, Name))
    }

    Reflect.ownKeys(instance).forEach(property => {
      const { writable} = Reflect.getOwnPropertyDescriptor(instance, property) || this.#descriptor
      if (!writable) { return; }
      // Treat them as private
      if (typeof property === 'symbol') { return; }
      const descriptor: Descriptor | undefined = types[property]
      const shouldThrow = this.#shouldThrow(strict, descriptor)
      let value = Reflect.get(instance, property)
      if (!value) {
        if (shouldThrow && !descriptor) {
          throw new TransformerError(`The type for "${property}" in "${Name}" was not found in either the "types" or the default value`)
        }
        try {
          value = new descriptor.type()
        } catch {
          throw new TransformerError(`Static property "types" contain an invalid constructor for property "${property}" in "${Name}"`)
        }
      }
      // Ignoring methods
      if (typeof value === 'function') { return; }

      if (shouldThrow && !Reflect.getOwnPropertyDescriptor(json, property)) {
        throw new TransformerError(Message.MISMATCH_SCHEMA(property, Name))
      }

      const jsonValue = Reflect.get(json, property)

      if (Object(value) !== value) {
        if (shouldThrow && typeof value !== typeof jsonValue) {
          throw new TransformerError(Message.INVALID_TYPE(property, Name, value, jsonValue))
        }
        return Reflect.set(instance, property, jsonValue)
      }

      if (Array.isArray(value)) {
        if (!Array.isArray(jsonValue)) {
          if (shouldThrow) {
            throw new TransformerError(Message.INVALID_ARRAY_TYPE(property, Name))
          }
          return Reflect.set(instance, property, jsonValue)
        }
        // Getting declared type of array elements if exists
        const Type = Reflect.get(descriptor, 'of')
        // Considering elements are primitives, or shouldn't be transformed
        if (!Type || this.#isPrimitive(Type)) {
          return Reflect.set(instance, property, jsonValue)
        }
        for (const element of jsonValue) {
          value.push(this.fromJSON(element, Type, shouldThrow))
        }
        return;
      }

      if (value instanceof Map) {
        const map = value as Map<string, any>
        if (typeof jsonValue !== 'object' || jsonValue == null) {
          if (shouldThrow) { throw new TransformerError(Message.INVALID_MAP_TYPE(property, Name)); }
          return Reflect.set(instance, property, jsonValue)
        }
        // Getting declared type of map elements if exists
        const Type = Reflect.get(descriptor, 'of')
        Object.entries(jsonValue).forEach(([k, v]) => {
          if (Type && !this.#isPrimitive(Type)) {
            map.set(k, this.fromJSON(v, Type, shouldThrow))
          } else {
            map.set(k, v)
          }
        })
        return;
      }

      if (value instanceof Set) {
        const set = value as Set<any>
        if (!Array.isArray(jsonValue)) {
          if (shouldThrow) { throw new TransformerError(Message.INVALID_SET_TYPE(property, Name)); }
          return Reflect.set(instance, property, jsonValue)
        }
        // Getting declared type of set elements if exists
        const Type = Reflect.get(descriptor, 'off')
        jsonValue.forEach(item => {
          if (Type && !this.#isPrimitive(Type)) {
            set.add(this.fromJSON(item, Type, shouldThrow))
          } else {
            set.add(item)
          }
        })
      }

      if (value instanceof Date) {
        let dateValue = jsonValue
        if (typeof jsonValue === 'string' || typeof jsonValue === 'number') {
          dateValue = new Date(jsonValue);
        }
        if (shouldThrow) { throw new TransformerError(Message.INVALID_TYPE(property, Name, '', jsonValue))}
        Reflect.set(instance, property, dateValue)
      }

      const Constructor = Reflect.getPrototypeOf(value as Object)?.constructor
      // Consider that initial value is an object without prototype
      if (!Constructor) {
        if (shouldThrow && jsonValue == null || typeof jsonValue !== 'object') {
          throw new TransformerError(Message.INVALID_TYPE(property, Name, value, jsonValue))
        }
        return Reflect.set(instance, property, jsonValue)
      }

      return Reflect.set(instance, property, this.fromJSON(jsonValue, Constructor as { new(): Object }), shouldThrow)
    })

    return instance
  }

  static toJSON(instance: Object): JSON | Object {
    const result = {}
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
        const object = {}
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


  static #shouldThrow(strict= true, descriptor?: Descriptor) {
    if (!descriptor) return strict
    return Reflect.get(descriptor, 'strict') || strict
  }

  static #isPrimitive(type: any) {
    return type === String || type === Number || type === Boolean
  }
}