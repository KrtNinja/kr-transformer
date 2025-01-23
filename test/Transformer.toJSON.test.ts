import { describe, it } from 'node:test';
import { Transformer } from '../src';
import * as assert from 'node:assert/strict';
import { Message, TransformerError } from '../src/Errors';

describe('Transformer.toJSON', () => {
  it('should return plain object', () => {
    class Foo {
      bar() {}
      get baz() { return 'baz'; }
      qux = () => {}
    }

    const plain = Transformer.toJSON(new Foo())
    assert.equal(Reflect.get(plain, 'bar'), undefined);
    assert.equal(Reflect.get(plain, 'baz'), undefined);
    assert.equal(Reflect.get(plain, 'qux'), undefined);
    assert.equal(Reflect.getPrototypeOf(plain), Reflect.getPrototypeOf({}));
  })


  it('should transform Array and Set elements to plain objects', () => {
    class Bar {}

    class Foo {
      set = new Set<Bar>()
      arr = [new Bar()]
      constructor() {
        this.set.add(new Bar())
      }
    }

    const plain = Transformer.toJSON(new Foo())

    // @ts-ignore
    assert.equal(Reflect.getPrototypeOf(plain.set), Reflect.getPrototypeOf([]));

    // @ts-ignore
    assert.equal(Reflect.getPrototypeOf(plain.arr), Reflect.getPrototypeOf([]));

    // @ts-
  })
})