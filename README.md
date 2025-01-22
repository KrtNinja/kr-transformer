# Transformer
## Transforms plain objects to instances of classes and vice versa

[![npm](https://img.shields.io/npm/v/kr-transformer)](https://www.npmjs.com/package/kr-transformer)
![coverage](https://github.com/nihil-pro/kr-transformer/blob/main/assets/coverage.svg)
[![size-esm](https://github.com/nihil-pro/kr-transformer/blob/main/assets/esm.svg)](https://bundlephobia.com/package/kr-transformer)
[![size-cjs](https://github.com/nihil-pro/kr-transformer/blob/main/assets/cjs.svg)](https://bundlephobia.com/package/kr-transformer)

1. Does not require typescript or reflect-metadata;
2. Can transform `Array` to `Set` and vice versa;
3. Can transform `Map` to `Object` and vice versa;
4. Can transform `String` or `Number` to `Date`;
5. Provides basic validation;
6. Works in all runtimes (Node.js, Web, e.t.c);
7. Well typed.

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
#### Validation
The `fromJSON` method accepts a third, optional boolean argument, which is true by default, and is responsible for basic validation:
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
  // value from json was used "as is"
  console.log(instance) // User { age: '42' ... } 
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
console.log(car.oems.pop()) // 'bbb'
```

### Transform one data structure into another and vice versa
- `Array` -> `Set`
- `Object` -> `Map`
```typescript
import { Transformer } from 'kr-transformer'

class Target {
  set = new Set<string>()
  map = new Map<string, string | number>
}

const json = {
  set: ['a', 'b', 'c'],
  map: {
    a: 1,
    b: '2',
    c: 3
  }
}

const instance = Transformer.fromJSON(json, Target)
console.log(instance) // Target {set: Set(3), map: Map(3)}
const plain = Transformer.toJSON(instance) // { set: ['a', 'b', 'c'], map: { a: 1, b: '2', c: 3 } }
```

### Deeply transform one data structure into another and vice versa
To transform data structures elements we have to declare their types. <br/>
To accomplish this, we define a static property called "types" that contains our nested type definitions. 
```typescript
import { Transformer } from 'kr-transformer'

class Bar { a: 1 }
class Baz { b: 2 }
class Qux { c: 3 }

class Foo {
  static types = { 
    array: Bar, // type of elements in array
    set: Baz, // type of elements in set
    map: Qux // type of elements values in Map
  }

  // default values are always required
  array: Bar[] = [] 
  set: Set<Baz> = new Set() 
  map: Map<string, Qux> = new Map()
}

const json = {
  array: [{ a: 100 }],
  
  // The type of json should be array. Only `Array` can be mapped to `Set`!
  set: [{ a: 200 }],

  // The type of json should be Object. Only `Object` can be mapped to `Map`!
  map: {
    1: { c: 300 },
  }
}

const result = Transformer.fromJSON(json, Foo)
console.log(result) // Foo { array: [Bar], set: {Baz}, map: { 1 => Qux }  }

const plain = Transformer.toJSON(result)
console.log(plain) // { array: [{ a: 100 }], set: [{ a: 200 }], map: { 1: { c: 300 } }}
```
The static "types" property is not required, if it is not present, the values from json will be used as is.