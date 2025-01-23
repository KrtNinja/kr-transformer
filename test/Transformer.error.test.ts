import { describe, it } from 'node:test';
import { Transformer } from '../src';
import * as assert from 'node:assert/strict';
import { Message, TransformerError } from '../src/Errors';

describe('Exceptions', () => {
  it('should throw INVALID_NUMBER_OF_ARGUMENTS', () => {
    const json = { foo: 'bar' };
    try {
      // @ts-ignore
      Transformer.fromJSON(json)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_NUMBER_OF_ARGUMENTS(1));
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw INVALID_JSON', () => {
    class Target {}
    try {
      // @ts-ignore
      Transformer.fromJSON(null, Target)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_JSON(null, 'Target'));
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw INVALID_CONSTRUCTOR', () => {
    try {
      // @ts-ignore
      Transformer.fromJSON({}, ()=> {})
    } catch (error) {
      assert.equal(error.message, Message.INVALID_CONSTRUCTOR);
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw INVALID_TYPE', () => {
    class Foo { bar = 0 }
    try {
      Transformer.fromJSON({ bar: '' }, Foo)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_TYPE('bar', 'Foo', 0, ''));
      assert.equal(error instanceof TransformerError, true);
    }

    try {
      Transformer.fromJSON({ bar: true }, Foo)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_TYPE('bar', 'Foo', 0, true));
      assert.equal(error instanceof TransformerError, true);
    }

    try {
      Transformer.fromJSON({ bar: null }, Foo)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_TYPE('bar', 'Foo', 0, null));
      assert.equal(error instanceof TransformerError, true);
    }

    try {
      Transformer.fromJSON({ bar: [] }, Foo)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_TYPE('bar', 'Foo', 0, []));
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw INVALID_ARRAY_TYPE', () => {
    class Target {
      arr: any[] = []
    }
    try {
      Transformer.fromJSON({ arr: {} }, Target)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_ARRAY_TYPE('arr', 'Target'));
      assert.equal(error instanceof TransformerError, true);
    }

    try {
      Transformer.fromJSON({ arr: null }, Target)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_ARRAY_TYPE('arr', 'Target'));
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw INVALID_MAP_TYPE', () => {
    class Target {
      map = new Map<string, any>()
    }
    try {
      Transformer.fromJSON({ map: [] }, Target)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_MAP_TYPE('map', 'Target'));
      assert.equal(error instanceof TransformerError, true);
    }


    try {
      Transformer.fromJSON({ map: null }, Target)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_MAP_TYPE('map', 'Target'));
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw INVALID_SET_TYPE', () => {
    class Target {
      set = new Set<any>()
    }
    try {
      Transformer.fromJSON({ set: true }, Target)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_SET_TYPE('set', 'Target'));
      assert.equal(error instanceof TransformerError, true);
    }


    try {
      Transformer.fromJSON({ set: null }, Target)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_SET_TYPE('set', 'Target'));
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw INVALID_DATE_TYPE', () => {
    class Target {
      time = new Date()
    }
    try {
      Transformer.fromJSON({ time: true }, Target)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_DATE_TYPE('time', 'Target'));
      assert.equal(error instanceof TransformerError, true);
    }


    try {
      Transformer.fromJSON({ time: null }, Target)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_DATE_TYPE('time', 'Target'));
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw MISMATCH_SCHEMA', () => {
    class Target {
      obj = {}
    }

    try {
      Transformer.fromJSON({ a: 1 }, Target)
    } catch (error) {
      assert.equal(error.message, Message.MISMATCH_SCHEMA('obj', 'Target'));
      assert.equal(error instanceof TransformerError, true);
    }
  })


  it('should throw INVALID_TYPE when Date is declared as type in "types" but value in json is not string or number', () => {
    class Foo {
      static types = { map: Date }
      map = new Map<string, Date>()
    }

    class Bar {
      static types = { set: Date }
      set = new Set<Date>()
    }

    class Baz {
      static types = { arr: Date }
      arr: Date[] = []
    }

    try {
      Transformer.fromJSON({ map: { 1: true } }, Foo)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_TYPE('map', 'Date', '', true));
    }

    try {
      Transformer.fromJSON({ set: [null] }, Bar)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_TYPE('set', 'Date', '', null));
    }

    try {
      Transformer.fromJSON({ arr: [{}] }, Baz)
    } catch (error) {
      assert.equal(error.message, Message.INVALID_TYPE('arr', 'Date', '', {}));
    }
  })
})