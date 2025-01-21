# Transformer
## Transforms plain objects to instances of classes and vice versa

[![npm](https://img.shields.io/npm/v/kr-transformer)](https://www.npmjs.com/package/kr-transformer)
![coverage](https://github.com/nihil-pro/kr-transformer/blob/main/assets/coverage.svg)
[![size-esm](https://github.com/nihil-pro/kr-transformer/blob/main/assets/esm.svg)](https://bundlephobia.com/package/kr-transformer)
[![size-cjs](https://github.com/nihil-pro/kr-transformer/blob/main/assets/cjs.svg)](https://bundlephobia.com/package/kr-transformer)

1. Does not depend on typescript or reflect-metadata;
2. Cant transform `Array` to `Set` and vice versa;
3. Cant transform `Map` to `Object` and vice versa;
4. Provides basic validation;
5. Works in all runtimes (Node.js, Web, e.t.c);
6. Well typed.

## Api reference
```typescript
interface Transformer {
  fromJSON<T>(json: JSON, Class: { new(): T }): T
  
  toJSON(instance: Object): JSON
}
```

## Requirements
Transformer is based on JavaScript types, which means that all properties of the target class must be initialized with default values. See examples below.

## Examples 

### Base
```typescript
import { Transformer } from 'kr-transformer'

class User {
  name = '' // will be treated as type "String"
  age = 0 // will be treated as type "Number"
  student = false // will be treated as type "Boolean"
  
  setName() { 
    // ...
  }
}

const json = { name: 'John', age: 42, student: true }
const instance = Transformer.fromJSON(json, User)
const plain = Transformer.toJSON(instance)
console.log(instance instanceof User, instance) // true User { ... }
console.log(plain) // { name: 'John', age: 42, student: true }
```
The `fromJSON` accept third – optional `boolean` argument – which is true by default. That's basic validation:
```typescript
import { Transformer } from 'kr-transformer'

class User {
  name = '' // will be treated as type "String"
  age = 0 // will be treated as type "Number"
  student = false // will be treated as type "Boolean"
  
  setName() { 
    // ...
  }
}

const json = { 
  name: 'John', 
  age: "42", // wrong type
  student: true 
}

try {
  const instance = Transformer.fromJSON(json, User, false) // disabling validation
  console.log(instance) // User { age: '42' ... } Json value was used "as is"
} catch (e) {
  console.log(e) // noop
}

try {
  const instance = Transformer.fromJSON(json, User)
} catch (e) {
  console.log(e) // TransformerError: `Invalid type of "age" in json. User expect type to be "number" but got "string"`
}
```

### Deep transform
```typescript
import { Transformer } from 'kr-transformer'

class Engine {
  volume = 0
  start() {}
}

class Car {
  vendor = ''
  engine = new Engine() // default value is always required
  oems: string[] = [] // also initialized with default value
}

const json = { 
  vendor: 'CoolVendor', 
  oems: ['aaa', 'bbb'],
  engine: { 
    volume: 2 
  } 
}

const car = Transformer.fromJSON(json, Car)

console.log(car instanceof Car) // true
console.log(car.engine instanceof Engine) // true
console.log(typeof car.engine.start === 'function') // true
```

### Deep transform json `Array`, `Map` or `Set` values
```typescript
import { Transformer } from 'kr-transformer'

class Bar { a: 1 }
class Qux { b: 2 }
class Quux { c: 3 }

class Foo {
  // To do this, we should define a static "types" property,
  // with an object which will describe our "nested" types
  static types = { array: Bar, set: Baz, map: Quux }

  // default values are always required
  array: Bar[] = [] 
  set: Set<Qux> = new Set() 
  map: Map<string, Quux> = new Map()
}

const json = {
  array: [{ a: 100 }, { a: 200 }, { a: 300 }],
  
  // The type of json should be array. Only `Array` can be mapped to `Set`!
  set: [{ a: 200 }, { a: 300 }, { a: 400 }],

  // The type of json should be Object. Only `Object` can be mapped to `Map`!
  map: {
    1: { c: 300 },
    2: { c: 400 },
    3: { c: 500 }
  }
}

const result = Transformer.fromJSON(json, Foo)
console.log(result)

const plain = Transformer.toJSON(result)
console.log(plain)
```
