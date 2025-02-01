import { Transformer, Schema } from '../src';
import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

describe('Transformer.fromJSON', () => {
  it('should return class instance', () => {
    const json = { foo: 'bar' };
    class Target { foo = '' }
    const result = Transformer.fromJSON(json, Target)
    assert.equal(result instanceof Target, true);
    assert.equal(result.foo, 'bar');
  });


  it(`should use value from json "as is", if it can't be cast to type declared in target class, and strict is false`, () => {
    class Bar {}

    class Foo {
      text= ''
      time= new Date()
      array= []
      set= new Set<any>()
      map= new Map<string, any>()
      bar = new Bar()
    }

    const json = {
      text: 0,
      time: true,
      array: 'null',
      set: null,
      map: [],
      bar: null
    }

    const result = Transformer.fromJSON(json, Foo, false)
    assert.equal(result.text, 0)
    assert.equal(result.time, true)
    assert.equal(result.array, 'null')
    assert.equal(result.set, null)
    assert.equal(Array.isArray(result.map), true)
    assert.equal(result.bar, null)
  })


  it('should not throw if value in json is "null", strict is "true" and descriptor nullable is "true"', () => {
    class Bar {}
    const schema: Schema<Foo> = {
      text: { type: String },
      time: { type: Date },
      array: { type: Array },
      set: { type: Set },
      map: { type: Map },
      bar: { type: Bar }
    }

    class Foo {
      static types: Schema<Foo> = schema
      text: string | null = null
      time: Date | null = null
      array: any[] | null = null
      set: Set<any> = null
      map: Map<string, any> = null
      bar: Bar | null = null
    }

    const json = {
      text: null,
      time: null,
      array: null,
      set: null,
      map: null,
      bar: null
    }
    const result = Transformer.fromJSON(json, Foo)
    assert.equal(result.text, null)
    assert.equal(result.time, null)
    assert.equal(result.array, null)
    assert.equal(result.set, null)
    assert.equal(result.map, null)
    assert.equal(result.bar, null)
  })


  it("should use value from target, when 'strict' = false, and property doesn't exist in json", () => {
    class Foo {
      bar = new Map()
    }
    const case1 = Transformer.fromJSON({ }, Foo, false)
    assert.equal(case1.bar instanceof Map, true)
  })


  it("should create Date from string", () => {
    class Foo { time = new Date() }
    const case1 = Transformer.fromJSON({ time: '2025-01-01' }, Foo)
    assert.equal(case1.time instanceof Date, true)
    assert.equal(typeof case1.time.toDateString(), 'string')
  })


  it("should use json value if type of json value is object, and target value is an object without prototype", () => {
    class Foo { obj = Object.create(null) }
    const result = Transformer.fromJSON({ obj: { foo: 'bar' } }, Foo)
    assert.equal(result.obj.foo, 'bar')
  })


  it("should transform array elements if their type are declared in 'types'", () => {
    class Bar {}
    class Baz {}
    class Foo {
      static types = { arr: { of: Bar }, arr2: { of: Baz } }
      arr: Bar[] = []
      arr2: Baz[] = []
    }
    const result = Transformer.fromJSON({ arr: [{}], arr2: [{}] }, Foo)
    assert.equal(result.arr[0] instanceof Bar, true)
    assert.equal(result.arr2[0] instanceof Baz, true)
  })


  it("should not transform collection elements if their type are not declared in 'types'", () => {
    class Bar {}
    class Baz {}
    class Foo {
      arr: Bar[] = []
      set: Set<any> = new Set()
    }
    const result = Transformer.fromJSON({ arr: [{}], set: [{}] }, Foo)
    result.set.forEach(el => assert.equal(el instanceof Baz, false))
    result.arr.forEach(el => assert.equal(el instanceof Bar, false))
  })


  it("should transform array into Set", () => {
    class Bar {}
    class Foo {
      static types = { set: { of: Bar } }
      set = new Set<Bar>()
    }
    const result= Transformer.fromJSON({ set: [{}, {}] }, Foo)
    assert.equal(result.set instanceof Set, true)
    result.set.forEach(value => assert.equal(value instanceof Bar, true))
  })


  it("should ignore primitives when transform array elements into Set", () => {
    class Foo {
      set = new Set<string>()
    }
    const result= Transformer.fromJSON({ set: ['', ''] }, Foo)
    assert.equal(result.set instanceof Set, true)
    result.set.forEach(value => assert.equal(typeof value, 'string'))
  })


  it("should ignore primitives when transform object elements into Map elements", () => {
    class Foo {
      map = new Map<string, string>()
    }
    const result= Transformer.fromJSON({ map: { a: 'a', b: 'b' } }, Foo)
    assert.equal(result.map instanceof Map, true)
    result.map.forEach(value => assert.equal(typeof value, 'string'))
  })


  it('should use json value when transform array elements into Set and value in json is not array and "strict" = false', () => {
    class Foo {
      set = new Set<string>()
    }
    const result= Transformer.fromJSON({ set: true }, Foo, false)
    assert.equal(result.set instanceof Set, false)
    assert.equal(typeof result.set, 'boolean')
  })

  it("should transform object into Map", () => {
    class Bar {}
    class Foo {
      static types = { map: { of: Bar } }
      map = new Map<string, Bar>()
    }
    const result= Transformer.fromJSON({ map: { 1: {}, 2: {} } }, Foo)
    assert.equal(result.map instanceof Map, true)
    result.map.forEach((value) => assert.equal(value instanceof Bar, true))
  })


  it('should transform into date when Date is declared as type in "type"', () => {
    class Foo {
      static types = { map: { of: Date }, set: { of: Date }, arr: { of: Date } }
      map = new Map<string, Date>()
      set = new Set<Date>()
      arr: Date[] = []
    }
    const json = {
      map: { 1: '2025-01-01' },
      set: ['2025-01-01'],
      arr: ['2025-01-01']
    }
    const result= Transformer.fromJSON(json, Foo)
    assert.equal(result.map instanceof Map, true)
    assert.equal(result.set instanceof Set, true)
    assert.equal(Array.isArray(result.arr), true)
    result.arr.forEach(el => assert.equal(el instanceof Date, true))
    result.set.forEach(el => assert.equal(el instanceof Date, true))
    result.map.forEach(el => assert.equal(el instanceof Date, true))
  })



  it('should ignore symbols properties', () => {
    const symbol = Symbol('quu')
    class Foo {
      [symbol] = 'a'
    }

    const result = Transformer.fromJSON({ [symbol]: 'b' }, Foo)
    assert.equal(result[symbol], 'a')
  })


  it('should ignore properties with constructors', () => {
    class Foo {
      bar = Map
    }

    const result = Transformer.fromJSON({ bar: {} }, Foo)
    assert.equal(result.bar instanceof Map, false)
  })


  it('should ignore non writable or non enumerable properties', () => {
    class Foo {
      constructor() {
        Reflect.defineProperty(this, 'bar', { writable: false, value: { a: ''} })
        Reflect.defineProperty(this, 'baz', { enumerable: false, value: { a: ''} })
      }
    }

    const result = Transformer.fromJSON({ bar: { a: '222' } }, Foo)
    const obj = Reflect.get(result, 'bar')
    assert.equal(Reflect.get(obj, 'a'), '')

    const obj2 = Reflect.get(result, 'baz')
    assert.equal(Reflect.get(obj2, 'a'), '')
  })


  it('should use json value in default value is an object without prototype', () => {
    class WithoutConstructor {
      objectNull = Object.create(null)
    }
    const json = { objectNull: { 1: 2 } }
    const result = Transformer.fromJSON(json, WithoutConstructor)
    assert.equal(result.objectNull, json.objectNull)
  })


  it('should transform custom classes', () => {
    class Bar { 1 = '' }
    class Foo {
      cls = new Bar()
    }
    const json = { cls: { 1: '1' } }
    const result = Transformer.fromJSON(json, Foo)
    assert.equal(result.cls instanceof Bar, true)
  })

})
