# Abolish Vue

A set of functions to make real time validation easier.

## Installation
Install `abolish` and this package.
```shell
npm i --save abolish abolish-vue
# OR
yarn add abolish abolish-vue
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
  original: name, 
  error: nameError,
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

const [email, emailError, validatedForm] = vReactiveAsArray({
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
<script setup>
import {vRefExtended} from "abolish-vue"; 

const name = vRefExtended(" John Doe ", "string:trim|min:2|max:10")

name.value // " John Doe "
name.error // "Validation error"
name.validated // Validated result i.e "John Doe"
</script>
```


