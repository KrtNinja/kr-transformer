import { INVALID, TransformerError } from './Errors.js'

interface Descriptor {
  /** Any class constructor including built in (String, Number, Boolean, Date e.t.c) */
  type?: { new (): any }

  /** Describes type of elements in collection. <br />
   * If Schema[property] is Map, Set or Array, than property "of" describes the type of elements in collection. <br />
   * I.e. Array<Schema[property]['off']> <br />
   * If not specified, the values from json will be used "as is".
   *   */
  of?: { new (): unknown }

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
export type Schema<T extends Object> = {
  [Property in keyof T]?: T[Property] extends Function ? never : Descriptor
}

/** Transform json or plain object to class instance and vice versa */
export class Transformer {
  static fromJSON<T extends Object>(json: JSON | Object, Class: { new (): T }, strict = true): T {
    let instance!: T
    try {
      instance = new Class()
    } catch {
      throw new TransformerError(INVALID.TARGET([Class?.name]))
    }

    const Name = Reflect.get(Class, 'name')
    const types: Schema<T> = Reflect.get(Class, 'types') || (Object.create(null) as Schema<T>)

    if (json == null || typeof json !== 'object') {
      throw new TransformerError(INVALID.JSON([Name]))
    }

    Reflect.ownKeys(instance).forEach(property => {
      if (typeof property === 'symbol') {
        return
      }
      const ownDescriptor = Reflect.getOwnPropertyDescriptor(instance, property) || {}
      if (!ownDescriptor.writable && !ownDescriptor.enumerable && !ownDescriptor.set) {
        return
      }

      const ErrorPath = [Name, property]
      const TypeError = new TransformerError(INVALID.TYPE(property, ErrorPath))

      const descriptor: Descriptor = Reflect.get(types, property) || {}
      const throwable = this.#shouldThrow(strict, descriptor)

      let value = Reflect.get(instance, property)
      if (typeof value === 'function') {
        return
      }

      const PropertyType = Reflect.get(descriptor, 'type')
      if (value == null) {
        if (!PropertyType) {
          if (throwable) {
            throw new TransformerError(INVALID.TARGET([Name, property]))
          }
          return
        }
        try {
          value = new PropertyType()
        } catch {
          throw new TransformerError(INVALID.TARGET([Name, property, PropertyType?.name]))
        }
      }

      if (!Reflect.getOwnPropertyDescriptor(json, property)) {
        if (throwable) {
          throw TypeError
        }
        return
      }

      const jsonValue = Reflect.get(json, property)
      if (jsonValue == null) {
        return
      }

      if (
        value instanceof String ||
        value instanceof Number ||
        value instanceof Boolean ||
        Object(value) !== value
      ) {
        // 100% primitive
        if (typeof value === 'object') {
          // @ts-ignore
          value = value.valueOf()
        }
        if (typeof value !== typeof jsonValue) {
          if (throwable) {
            throw TypeError
          }
          return
        }
        return Reflect.set(instance, property, jsonValue)
      }

      // Getting declared type of Collection elements if exists
      const Type = Reflect.get(descriptor, 'of')

      if (Array.isArray(value)) {
        if (!Array.isArray(jsonValue)) {
          if (throwable) {
            throw TypeError
          }
          return
        }

        for (const input of jsonValue) {
          const result = this.#toCollectionElementType({
            input,
            Type,
            throwable,
            ErrorPath,
            property
          })
          value.push(result)
        }
        return Reflect.set(instance, property, value)
      }

      if (value instanceof Map) {
        if (Array.isArray(jsonValue) || typeof jsonValue !== 'object') {
          if (throwable) {
            throw TypeError
          }
          return
        }
        for (const key in jsonValue) {
          const input = jsonValue[key]
          const result = this.#toCollectionElementType({
            input,
            Type,
            throwable,
            ErrorPath,
            property
          })
          value.set(key, result)
        }
        return Reflect.set(instance, property, value)
      }

      if (value instanceof Set) {
        if (!Array.isArray(jsonValue)) {
          if (throwable) {
            throw TypeError
          }
          return
        }
        for (const input of jsonValue) {
          const result = this.#toCollectionElementType({
            input,
            Type,
            throwable,
            ErrorPath,
            property
          })
          value.add(result)
        }
        return Reflect.set(instance, property, value)
      }

      if (value instanceof Date) {
        if (typeof jsonValue !== 'string') {
          if (throwable) {
            throw TypeError
          }
          return
        }

        return Reflect.set(instance, property, new Date(jsonValue))
      }

      const Constructor = Reflect.getPrototypeOf(value as Object)?.constructor
      // Consider that initial value is an object without prototype
      if (!Constructor) {
        if (throwable && typeof jsonValue !== 'object') {
          throw TypeError
        }
        return Reflect.set(instance, property, jsonValue)
      }
      return Reflect.set(
        instance,
        property,
        this.fromJSON(jsonValue, Constructor as { new (): Object }, throwable)
      )
    })

    return instance
  }

  static toJSON(instance: Object): JSON | Object {
    const result = {}
    Reflect.ownKeys(instance).forEach(property => {
      const value = Reflect.get(instance, property)
      if (typeof value === 'function') {
        return
      }
      if (typeof property === 'symbol') {
        return
      }
      if (Object(value) !== value) {
        return Reflect.set(result, property, value)
      }
      if (Array.isArray(value) || value instanceof Set) {
        const array: any[] = []
        value.forEach((item: any) => array.push(this.#toPlain(item)))
        return Reflect.set(result, property, array)
      }

      if (value instanceof Map) {
        const object = {}
        value.forEach((item, key) => Reflect.set(object, key, this.#toPlain(item)))
        return Reflect.set(result, property, object)
      }

      if (value instanceof Date) {
        return Reflect.set(result, property, value)
      }
      return Reflect.set(result, property, this.toJSON(value))
    })
    return JSON.parse(JSON.stringify(result))
  }

  static #toPlain = (item: any) => (Object(item) !== item ? item : this.toJSON(item))

  static #shouldThrow(strict = true, descriptor?: Descriptor) {
    const value = Reflect.get(descriptor || {}, 'strict')
    return typeof value === 'boolean' ? value : strict
  }

  static #toCollectionElementType({
    Type,
    throwable,
    ErrorPath,
    input,
    property
  }: ToCollectionElement) {
    if (Type === Date) {
      if (typeof input === 'string') {
        return new Date(input)
      } else {
        throw new TransformerError(INVALID.TYPE(property, ErrorPath))
      }
    } else if (Object(input) !== input) {
      return input
    } else if (!Type) {
      return input
    } else {
      return this.fromJSON(input, Type, throwable)
    }
  }
}

interface ToCollectionElement {
  Type: { new (): any } | undefined
  throwable: boolean
  input: any
  ErrorPath: string[]
  property: string
}
