# Transformer
## Transforms plain objects to instances of classes and vice versa

[![npm](https://img.shields.io/npm/v/kr-transformer)](https://www.npmjs.com/package/kr-transformer)
![coverage](https://github.com/nihil-pro/kr-transformer/blob/main/assets/coverage.svg)
[![size-esm](https://github.com/nihil-pro/kr-transformer/blob/main/assets/esm.svg)](https://bundlephobia.com/package/kr-transformer)
[![size-cjs](https://github.com/nihil-pro/kr-transformer/blob/main/assets/cjs.svg)](https://bundlephobia.com/package/kr-transformer)

## Breaking changes
Docs for version less than 2 are available on [GitHub](https://github.com/nihil-pro/kr-transformer/tree/1.0.3)

1. Does not require typescript or reflect-metadata;
2. Can transform `Array` to `Set` and vice versa;
3. Can transform `Map` to `Object` and vice versa;
4. Can transform `String` to `Date`;
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
Transformer is based on JavaScript types. Most of the time it just work.
There are only a few situations where configuration is necessary, such as when nullable properties or collections are required.<br />
See `Configuration` below.

## Usage 
In examples below, we are using default values for class properties. Transformer uses those default values to infer types.
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
### Deep transform
```typescript
import { Transformer } from 'kr-transformer'

class Engine {
  volume = 0
  start() {}
}

class Car {
  vendor = ''
  engine = new Engine() // infered type from default value = Engine
  oems: string[] = [] // infered type from default value = Array
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
Usually, this is sufficient, but sometimes, you may need nullable properties or collections of other objects. In such cases, a small amount of configuration is required. <br />
This is done by configuring the target class.
## Configuration
To configure the target class, you have to define a static property `types` with a little schema:
```typescript
type Schema<TargetClass extends Object> = { 
  [Property in keyof TargetClass]?: Descriptor
}

interface Descriptor {
  // Any class constructor, including built: String, Number, Boolean, Date e.t.c 
  type?: { new(): any },

  // If type is Map, Set or Array, than this property describes the type of elements in collection
  // If not specified, the values from json will be used "as is".
  of?: { new(): any }

  // Is true by default
  // Takes precedence over the parameter "strict", passed to the fromJSON method as third argument.
  // If is true, transformer will throw error, 
  // when type of value in json doesn't match property type declared in descriptor or as default value
  strict?: boolean
}
```
### Example with collection elements type
```typescript
import { Transformer } from 'kr-transformer'

class Organization {
  name = ''
}

class Employee {
  static types: Schema<Employee> = { 
    // describing property "experience" in Employee
    experience: { 
      // the type of property is already known due to default value
      // we should only define type of array elements
      of: Organization 
    }
  }
  
  fullName = ''
  experience: Organization[] = []
}

const json = {
  fullName: 'John Smith',
  experience: [
    { name: 'Google' },
    { name: 'IBM' },
  ]
}

const employee = Transformer.fromJSON(json, Employee)
console.log(employee.experience.every(org => org instanceof Organization)) // true
```

### Example with nullable properties
```typescript
import { Transformer } from 'kr-transformer'

class Organization {
  static types: Schema<Organization> = {
    // describing property "phone" in Organization
    phone: {
      // because default value is null, specify the type
      type: String,
    }, 
  }
  
  name = ''
  phone: string | null = null
}

class Employee {
  static types: Schema<Employee> = {
    // describing property "experience" in Employee
    experience: {
      // because default value is null, specify the type
      type: Array,
      // specify the type of array elements
      of: Organization
    },
    
    // describing property "phone" in Employee
    phone: {
      // because default value is null, specify the type
      type: String,
    },
  }
  
  phone: string | null = null
  experience: Organization[] | null = null
}

const json = {
  fullName: 'John Smith',
  phone: null,
  experience: [
    { name: 'Google', phone: '+ 1 234 56 78' },
    { name: 'IBM', phone: null },
  ]
}

const employee = Transformer.fromJSON(json, Employee)
console.log(employee.experience.every(org => org instanceof Organization)) // true
console.log(employee.experience.at(0).phone) // + 1 234 56 78
console.log(employee.experience.at(1).phone) // null
```
That is, the static `types` property is not always needed, but only for:
- Define type of nullable properties
- Define types of elements in collection
- Make some property strict (or not) for validation.

## Validation
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
You can also use the static `types` property in target class as described above, 
to override the validation mode for a specific property:
```typescript
import { Transformer } from 'kr-transformer'

class User {
  static types = {
    // describing property "age" in User
    age: { 
      // disable validation for this property
      strict: false 
    } 
  }
  
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
  const instance = Transformer.fromJSON(json, User) 
  // value from json was used "as is"
  console.log(instance) // User { age: '42' ... } 
} catch (e) {
  console.log(e) // noop
}
```
or:
```typescript
import { Transformer } from 'kr-transformer'

class User {
  static types = {
    // describing property "age" in User
    age: { 
      // enable validation for this property
      strict: true 
    } 
  }
  
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
  const instance = Transformer.fromJSON(json, User, false) // disable validation
} catch (e) {
  console.log(e) // TransformerError: `Invalid type of "age" in json. User expect type to be "number" but got "string"`
}
```