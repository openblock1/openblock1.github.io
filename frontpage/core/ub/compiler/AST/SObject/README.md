# Serializable
a very simple class mix-ins for serialization/deserialization class object.

## Mark a class as Serializable
```
Serializable(class);
```
## Serialize a object
```
let json = JSON.stringify(obj);
```
## Example
for a class A:
```
class A {
    constructor() {
        this.F = 'a';
        // Object.assign(this, Serializable);
    }
    say() {
        console.log('hello ~' + this.F);
    }
}
Serializable(A);// mark the class A as Serializable

let a = new A();
```
```
// Serialize the object to json string.
let json = JSON.stringify(a);
// Deserialize the json string to object of class A.
let a1 = JSON.parse(json, Deserializer);
```


# SObject
a very simple OOP for JavaScript with serialization/deserialization ablity via prototype.


## define class
```
SObject.define(className,parentClassConstructor,initFunction,staticFieldOrMethod);
```
return constructor
## new object
```
let object = new ClassConstructor();
```
## serialize object
```
let json = JSON.stringify(object);
```
## deserialize json
```
let object1 = JSON.parse(json,SObject.ObjectReviver);
```
## example
```
let AClass = SObject.define("AClass");

let BClass = SObject.define("BClass",AClass);

let CClass = SObject.define("CClass",BClass,
    function(){
      this.name = 'Anyone';
    });
let DClass = SObject.define("DClass",CClass,
    function(){},{
        sayHello(){
            console.log('hello '+this.name);
        }
    })


    let d = new DClass();
    d.sayHello();// hello Anyone


        let json = JSON.stringify(d);
        let d1 = JSON.parse(json,SObject.ObjectReviver);
        d1.sayHello();// hello Anyone
        d1.name = 'Petter';
        d1.sayHello();//hello Petter
        d.sayHello();// hello Anyone

```