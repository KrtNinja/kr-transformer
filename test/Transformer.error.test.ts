import { describe, it } from 'node:test';
import { Transformer } from '../src';
import * as assert from 'node:assert/strict';
import { TransformerError, INVALID } from '../src/Errors';

describe('Exceptions', () => {
  it('should throw invalid target error', () => {
    const json = { foo: 'bar' };
    try {
      // @ts-ignore
      Transformer.fromJSON(json)
    } catch (error) {
      assert.equal(error.message, INVALID.TARGET([undefined]));
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw invalid source', () => {
    class Target {}
    try {
      // @ts-ignore
      Transformer.fromJSON(null, Target)
    } catch (error) {
      assert.equal(error.message, INVALID.JSON(['Target']));
      assert.equal(error instanceof TransformerError, true);
    }
  })

  it('should throw invalid target when default value is null, strict is true and type is not declared in descriptor', () => {
    class Target {
      a = null
    }
    try {
      Transformer.fromJSON({ a: 2 }, Target)
    } catch (error) {
      assert.equal(error.message, INVALID.TARGET(['Target', 'a']));
      assert.equal(error instanceof TransformerError, true);
    }
  })

  it('should throw invalid target when default value is null, strict is true and type declared in descriptor in not a valid constructor', () => {
    class Target {
      static types = { a: { type: true } }
      a = null
    }
    try {
      Transformer.fromJSON({ a: 2 }, Target)
    } catch (error) {
      assert.equal(error.message, INVALID.TARGET(['Target', 'a', '']));
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw invalid type when Date is declared as type in "types" but value in json is not string', () => {
    class DateTest {
      static types = { map: { of: Date } }
      map = new Map<string, Date>()
    }

    try {
      Transformer.fromJSON({ map: { 1: true } }, DateTest)
    } catch (error) {
      assert.equal(error.message, INVALID.TYPE('map', ['DateTest', 'map']));
    }
  })


  it('should throw invalid type when property exists in target but not in source and strict is true', () => {
    class Target { a = '' }
    try {
      Transformer.fromJSON({ }, Target)
    } catch (error) {
      assert.equal(error.message, INVALID.TYPE('a', ['Target', 'a']));
    }
  })

  it('should throw invalid type when type of property in target !== type of property in source and strict is true', () => {
    class Target { a = '' }
    try {
      Transformer.fromJSON({ a: 2 }, Target)
    } catch (error) {
      assert.equal(error.message, INVALID.TYPE('a', ['Target', 'a']));
    }
  })

  it('should throw invalid type when type of property in target is array but not in source, and strict is true', () => {
    class Target { a = [] }
    try {
      Transformer.fromJSON({ a: 2 }, Target)
    } catch (error) {
      assert.equal(error.message, INVALID.TYPE('a', ['Target', 'a']));
    }
  })

  it('should throw invalid type when type of property in target is Map but in source is not object, and strict is true', () => {
    class Target { a = new Map() }
    try {
      Transformer.fromJSON({ a: [] }, Target)
    } catch (error) {
      assert.equal(error.message, INVALID.TYPE('a', ['Target', 'a']));
    }

    try {
      Transformer.fromJSON({ a: true }, Target)
    } catch (error) {
      assert.equal(error.message, INVALID.TYPE('a', ['Target', 'a']));
    }
  })

  it('should throw invalid type when type of property in target is Set but not array in source, and strict is true', () => {
    class Target { a = new Set() }
    try {
      Transformer.fromJSON({ a: 2 }, Target)
    } catch (error) {
      assert.equal(error.message, INVALID.TYPE('a', ['Target', 'a']));
    }
  })

  it('should throw invalid type when type of property in target is Date but not string in source, and strict is true', () => {
    class Target { a = new Date() }
    try {
      Transformer.fromJSON({ a: 2 }, Target)
    } catch (error) {
      assert.equal(error.message, INVALID.TYPE('a', ['Target', 'a']));
    }
  })


  it('should invalid type if default value is an object without prototype but value in source is not object', () => {
    class Foo {
      bar = Object.create(null)
    }

    try {
      Transformer.fromJSON({ bar: 2 }, Foo)
    } catch (error) {
      assert.equal(error.message, INVALID.TYPE('bar', ['Foo', 'bar']));
    }
  })


  it('should throw invalid type when descriptor.strict is true and strict is false', () => {
    class Foo {
      static types = { a: { strict: true } }
      a = ''
    }
    const json = { a: true }
    try {
      Transformer.fromJSON({ a: true }, Foo)
    } catch (error) {
      assert.equal(error.message, INVALID.TYPE('a', ['Foo', 'a']));
    }
  })
})