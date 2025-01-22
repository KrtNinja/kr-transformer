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

})
