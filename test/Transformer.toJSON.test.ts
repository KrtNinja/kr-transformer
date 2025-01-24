import { describe, it } from 'node:test';
import { Transformer } from '../src';
import * as assert from 'node:assert/strict';

describe('Transformer.toJSON', () => {
  it('should return plain object', () => {
    const symbol = Symbol.for('foo')
    class Foo {
      bar() {}
      get baz() { return 'baz'; }
      qux = () => {}
      [Symbol.iterator]() {};
      [symbol] = 1
    }

    const plain = Transformer.toJSON(new Foo())
    assert.equal(Reflect.get(plain, 'bar'), undefined);
    assert.equal(Reflect.get(plain, 'baz'), undefined);
    assert.equal(Reflect.get(plain, 'qux'), undefined);
    assert.equal(Reflect.get(plain, Symbol.iterator), undefined);
    assert.equal(Reflect.get(plain, symbol), undefined);
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

    const set = Reflect.get(plain, 'set') as Bar[]
    set.forEach(el => {
      assert.equal(Reflect.getPrototypeOf(el), Reflect.getPrototypeOf({}));
    })

    const arr = Reflect.get(plain, 'arr') as Bar[]
    arr.forEach(el => {
      assert.equal(Reflect.getPrototypeOf(el), Reflect.getPrototypeOf({}));
    })
  })


  it('should ignore Array and Set elements if they are primitives', () => {
    class Foo {
      set = new Set<string>()
      arr: number[] = [1,2,3]
      constructor() {
        this.set.add('foo').add('bar')
      }
    }

    const plain = Transformer.toJSON(new Foo())

    // @ts-ignore
    assert.equal(Reflect.getPrototypeOf(plain.set), Reflect.getPrototypeOf([]));

    // @ts-ignore
    assert.equal(Reflect.getPrototypeOf(plain.arr), Reflect.getPrototypeOf([]));

    const set = Reflect.get(plain, 'set') as string[]
    set.forEach(el => {
      assert.equal(typeof el, 'string');
    })

    const arr = Reflect.get(plain, 'arr') as number[]
    arr.forEach(el => {
      assert.equal(typeof el, 'number');
    })
  })


  it('should transform Map to plain object', () => {
    class Bar {}

    class Foo {
      map = new Map<string, Bar>()
      constructor() {
        this.map.set('1', new Bar())
      }
    }

    const plain = Transformer.toJSON(new Foo())

    // @ts-ignore
    assert.equal(Reflect.getPrototypeOf(plain),Reflect.getPrototypeOf({}));

    const obj = Reflect.get(plain, 'map') as Object
    Object.entries(obj).forEach(([,v]) => {
      assert.equal(Reflect.getPrototypeOf(v), Reflect.getPrototypeOf({}));
    })
  })


  it('should ignore Map elements if they are primitives', () => {
    class Foo {
      map = new Map<string, string>()
      constructor() {
        this.map.set('1', '1')
      }
    }

    const plain = Transformer.toJSON(new Foo())

    // @ts-ignore
    assert.equal(Reflect.getPrototypeOf(plain),Reflect.getPrototypeOf({}));

    const obj = Reflect.get(plain, 'map') as Object
    Object.entries(obj).forEach(([,v]) => {
      assert.equal(typeof v, 'string');
    })
  })


  it('should transform Date to string', () => {
    class Bar {
      time = new Date()
    }

    class Foo {
      time = new Date()
      bar = new Bar()
    }

    const plain = Transformer.toJSON(new Foo())

    // @ts-ignore
    assert.equal(Reflect.getPrototypeOf(plain),Reflect.getPrototypeOf({}));
    assert.equal(typeof Reflect.get(plain, 'time'), 'string');
    const obj = Reflect.get(plain, 'bar') as Object
    assert.equal(Reflect.getPrototypeOf(obj), Reflect.getPrototypeOf({}));
    assert.equal(typeof Reflect.get(obj, 'time'), 'string');
  })

  it('should ignore Object values if they are primitives', () => {
    class Foo {
      bol = true
      str = ''
      num = 0
      last = null
    }

    const plain = Transformer.toJSON(new Foo())
    assert.equal(typeof Reflect.get(plain, 'bol'), 'boolean');
    assert.equal(typeof Reflect.get(plain, 'str'), 'string');
    assert.equal(typeof Reflect.get(plain, 'num'), 'number');
    assert.equal(typeof Reflect.get(plain, 'last'), 'object');
  })
})