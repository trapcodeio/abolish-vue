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
});

// `0` is the value being validated
// `1` is the error message
// `2` is the validated object
</script>
```