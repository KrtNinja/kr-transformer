import { Transformer } from '../src';
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


  it('should use value from json when transform into Map, json value is not object, and "strict" = false', () => {
    const json = { foo: 'bar' };
    class Target {
      foo = new Map<string, Object>()
    }
    const result = Transformer.fromJSON(json, Target, false)
    assert.equal(result instanceof Target, true);
    assert.equal(typeof result.foo, 'string');
  });


  it('should use value from json when transform into Array and json value is not array, and "strict" = false', () => {
    const json = { foo: 'bar' };
    class Target {
      foo = []
    }
    const result = Transformer.fromJSON(json, Target, false)
    assert.equal(result instanceof Target, true);
    assert.equal(typeof result.foo, 'string');
  });


  it('should use value from json when "strict" = false', () => {
    class Foo { bar = 0 }

    const case1 = Transformer.fromJSON({ bar: '' }, Foo, false)
    assert.equal(case1.bar, '')

    const case2 = Transformer.fromJSON({ bar: true }, Foo, false)
    assert.equal(case2.bar, true)

    const case3 = Transformer.fromJSON({ bar: null }, Foo, false)
    assert.equal(case3.bar, null)

    const case4 = Transformer.fromJSON({ bar: [] }, Foo, false)
    // @ts-ignore
    assert.equal(case4.bar instanceof Array, true)

    class Bar { arr: [] }
    const case5 = Transformer.fromJSON({ arr: { a: 1 } }, Bar, false)
    assert.equal(case5.arr instanceof Array, false)


    class Baz { time = new Date() }
    const case6 = Transformer.fromJSON({ time: { } }, Baz, false)
    assert.equal(Reflect.getPrototypeOf(case6.time), Reflect.getPrototypeOf({}))
  })

  it("should use value from target, when 'strict' = false, and property doesn't exist in json", () => {
    class Foo { bar = new Map() }

    const case1 = Transformer.fromJSON({ }, Foo, false)
    assert.equal(case1.bar instanceof Map, true)
  })


  it("should create Date from string or number", () => {
    class Foo { time = new Date() }

    const case1 = Transformer.fromJSON({ time: '2025-01-01' }, Foo)
    assert.equal(case1.time instanceof Date, true)
    assert.equal(typeof case1.time.toDateString(), 'string')

    const case2 = Transformer.fromJSON({ time: Date.now() }, Foo)
    assert.equal(case2.time instanceof Date, true)
    assert.equal(typeof case2.time.getTime(), 'number')
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
      static types = { arr: { of: Bar }, arr2: { of: Bar } }
      arr: Bar[] = []
      arr2: Baz[] = []
    }
    const result = Transformer.fromJSON({ arr: [{}], arr2: [{}] }, Foo)
    assert.equal(result.arr[0] instanceof Bar, true)
    assert.equal(result.arr2[0] instanceof Baz, true)
  })


  it("should not transform array elements if their type are not declared in 'types'", () => {
    class Bar {}
    class Baz {}
    class Foo {
      arr: Bar[] = []
      arr2: Baz[] = []
    }
    const result = Transformer.fromJSON({ arr: [{}], arr2: [{}] }, Foo)
    assert.equal(result.arr[0] instanceof Bar, false)
    assert.equal(result.arr2[0] instanceof Baz, false)
  })


  it("should transform array elements into Set", () => {
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
      map: { 1: '2025-01-01', 2: Date.now() },
      set: ['2025-01-01', Date.now()],
      arr: ['2025-01-01', Date.now()]
    }
    const result= Transformer.fromJSON(json, Foo)
    assert.equal(result.map instanceof Map, true)
    assert.equal(result.set instanceof Set, true)
    assert.equal(Array.isArray(result.arr), true)
    result.arr.forEach(el => assert.equal(el instanceof Date, true))
    result.set.forEach(el => assert.equal(el instanceof Date, true))
    result.map.forEach(el => assert.equal(el instanceof Date, true))
  })


  it('should transform into date when Date is declared as type in "types" using json values when "strict" = false', () => {
    class Foo {
      static types = { map: { of: Date }, set: { of: Date }, arr: { of: Date } }
      map = new Map<string, Date>()
      set = new Set<Date>()
      arr: Date[] = []
    }
    const json = {
      map: { 1: true },
      set: [ null ],
      arr: [ {} ]
    }
    const result= Transformer.fromJSON(json, Foo, false)
    assert.equal(result.map instanceof Map, true)
    assert.equal(result.set instanceof Set, true)
    assert.equal(Array.isArray(result.arr), true)

    result.arr.forEach(el => assert.equal(el instanceof Date, false))
    result.set.forEach(el => assert.equal(el instanceof Date, false))
    result.map.forEach(el => assert.equal(el instanceof Date, false))
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
})
