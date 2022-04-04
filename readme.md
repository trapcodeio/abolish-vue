# Abolish Vue

A set of functions to make real time validation easier.

## Menu

  * [Installation](#installation)
  * [Setup](#setup)
  * [Functions](#functions)
    * [vRef](#vref)
    * [vReactive](#vreactive)
    * [vRefAsArray](#vrefasarray)
    * [vReactiveAsArray](#vreactiveasarray)
    * [vRefExtended](#vrefextended)
    * [rCheck](#rcheck)
    * [rCheckOnly](#rcheckonly)
    * [rTest](#rtest)
    

## Installation
Install `abolish` and this package.
```shell
npm i --save abolish abolish-vue
# OR
yarn add abolish abolish-vue
```

## Setup
This setup is only required if you want to provide a custom `abolish` instance or extend validators

```js
import {AbolishPlugin} from 'abolish-vue';
import {Abolish} from 'abolish';

app.use(AbolishPlugin, {
  init(){
      // add custom validators E.g
      Abolish.addValidator('custom', validator);
  },
  abolish(){
      // return custom abolish instance E.g
      return new Abolish()
  }
});
```
To get options types for typescript

```ts
app.use(AbolishPlugin, <AbolishPlugin>{
    // options here will be typed
});
```
## Functions    

### vRef
`vRef` stands for "validated Ref". This function creates a ref that is watched and validated

```vue
<template>
  <div>
    <input v-model="name" />
    <span>{{ nameError }}</span>
  </div>
</template>

<script setup>
import {vRef} from "abolish-vue"; 

const {
  original: name, 
  error: nameError
} = vRef("John Doe", "string:trim|min:2|max:10");

// `original` is the value being validated
// `error` is the error message
</script>
```

### vReactive
`vReactive` stands for "validated Reactive". This function creates a reactive object that is watched and validated.


```vue
<script setup>
import {vReactive} from "abolish-vue"; 

const {
  original: form, 
  error: formError,
  validated: validatedForm
} = vReactive({
    name: "John Doe", 
    email: "SomeMail@example.com",
});

// `original` is the value being validated
// `error` is the error message
// `validated` is the validated object
</script>
```

### vRefAsArray
`vRefAsArray` stands for "validated Ref as Array". Has the same functionality as `vRef` but returns an array of refs.

```vue
<script setup>
import {vRefAsArray} from "abolish-vue"; 

const [email, emailError] = vRefAsArray("John Doe", "string:trim|min:2|max:10");

// `0` is the value being validated
// `1` is the error message
</script>
```


### vReactiveAsArray
`vReactiveAsArray` stands for "validated Reactive as Array". Has the same functionality as `vReactive` but returns an array of refs.

```vue
<script setup>
import {vReactiveAsArray} from "abolish-vue"; 

const [form, formError, validatedForm] = vReactiveAsArray({
    name: "John Doe", 
   email: "SomeMail@example.com",
}, {
  name: "required|string:trim|min:2|max:10",
  email: "required|email"
});

// `0` is the value being validated
// `1` is the error message
// `2` is the validated object
</script>
```


### vRefExtended

`vRefExtended` is the same as `vRef` but uses **vueuse** [extendRef](https://vueuse.org/shared/extendRef/) to extend the validating ref variable.

```vue
<script setup>
import {vRefExtended} from "abolish-vue"; 

const name = vRefExtended(" John Doe ", "string:trim|min:2|max:10")

name.value // " John Doe "
name.error // "Validation error"
name.validated // Validated result i.e "John Doe"
</script>
```

The downside of using `vRefExtended` is: `error` and `validated` cannot be used in `<template>` tag.

```vue
<template>
  <div>
    <input v-model="name" />
    <!-- This will not work 🚫  -->
    <span>{{ name.error }}</span>
    
    <!-- This will not work also 🚫  -->
    <span>{{ name.validated }}</span>
  </div>
</template>
```

To access them in template, you have to create a computed property like so:

```vue
<template>
  <div>
    <input v-model="name" />
    <!-- These should work and reactive ✅  -->
    <span>{{ nameError }}</span>
    
    <!-- This will also work ✅  -->
    <span>{{ validatedName }}</span>
  </div>
</template>

<script setup>
import {vRefExtended} from "abolish-vue"; 
import {computed} from 'vue'; 

const name = vRefExtended(" John Doe ", "string:trim|min:2|max:10")

// This will work ✅
const nameError = computed(() => name.error);
const validatedName = computed(() => name.validated);
</script>
```

### rCheck
`rCheck` stands for "reactive/realtime check". it converts `Abolish.check()` to a reactive realtime validation function.

Unlike `vRef` and `vReactive`, `rCheck` takes an already declared `ref` or a function and validates its value

```ts
import {ref} from "vue";
import {rCheck} from "abolish-vue"; 

const name = ref('what to validate on any change.');
const [error, validated] = rCheck(name, rules);

// `0` i.e `error` is the error message
// `1` i.e `validated` is the validated object

// OR using a function
const firstName = ref('John');
const lastName = ref('Doe');

const [ageError, validatedAge] = rCheck(() => {
    // because firstName and lastName used and reactive, 
    // this function will be called any time either of them changes
    return firstName.value + ' ' + lastName.value;
}, "string:trim|min:2|max:10");
```


### rCheckOnly
`rCheckOnly` stands for "reactive/realtime check only". It is the same as `rCheck` but does not return the validated object.
This can improve performance when you are only interested in the error message.

```ts
import {ref} from "vue";
import {rCheckOnly} from "abolish-vue"; 

const name = ref('what to validate on any change.');
const error = rCheckOnly(name, rules);

// `error` is the error message is returned

// OR using a function
const firstName = ref('John');
const lastName = ref('Doe');

const ageError = rCheckOnly(() => {
    // because firstName and lastName used and reactive, 
    // this function will be called any time either of them changes
    return firstName.value + ' ' + lastName.value;
}, "string:trim|min:2|max:10");

```


### rTest
`rTest` stands for "reactive/realtime test". it converts `Abolish.test()` to a reactive realtime validation function.


`rTest` just like `Abolish.test()` takes a value and a rule and returns a boolean.

```ts
import {ref} from "vue";
import {rTest} from "abolish-vue"; 

const variable = ref('what to validate on any change.');
const isValid = rTest(variable, rules);

isValid.value // true or false

// OR using a function
const firstName = ref('John');
const lastName = ref('Doe');

const isValidAge = rTest(() => {
    // because firstName and lastName used and reactive, 
    // this function will be called any time either of them changes
    return firstName.value + ' ' + lastName.value;
}, "string:trim|min:2|max:10");

isValidAge.value // true or false
```


