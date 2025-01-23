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
    class Foo {
      static types = { arr: Bar, arr2: Date }
      arr: Bar[] = []
      arr2: Date[] = []
    }
    const result = Transformer.fromJSON({ arr: [{}], arr2: [Date.now()] }, Foo)
    assert.equal(result.arr[0] instanceof Bar, true)
    assert.equal(result.arr2[0] instanceof Date, true)
    assert.equal(typeof result.arr2[0].getFullYear(), 'number')
  })


  it("should not transform array elements if their type are not declared in 'types'", () => {
    class Bar {}

    class Foo {
      arr: Bar[] = []
      arr2: Date[] = []
      arr3: string[] = []
    }
    const result = Transformer.fromJSON({ arr: [{}], arr2: [Date.now()], arr3: [''] }, Foo)
    assert.equal(result.arr[0] instanceof Bar, false)
    assert.equal(result.arr2[0] instanceof Date, false)
    assert.equal(typeof result.arr3[0], 'string')
  })


  it("should transform array elements into Set", () => {
    class Bar {}
    class Foo {
      static types = { set: Bar }
      set = new Set<Bar>()
    }
    const result= Transformer.fromJSON({ set: [{}, {}] }, Foo)
    assert.equal(result.set instanceof Set, true)
    result.set.forEach(value => assert.equal(value instanceof Bar, true))
  })


  it("should transform object into Map", () => {
    class Bar {}
    class Foo {
      static types = { map: Bar }
      map = new Map<string, Bar>()
    }
    const result= Transformer.fromJSON({ map: { 1: {}, 2: {} } }, Foo)
    assert.equal(result.map instanceof Map, true)
    result.map.forEach((value) => assert.equal(value instanceof Bar, true))
  })
})
