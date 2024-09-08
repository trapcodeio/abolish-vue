import type { AbolishRule, ValidationError } from "abolish/src/types";
import { inject, Plugin, reactive, readonly, Ref, ref, UnwrapRef, watch } from "vue";
import { extendRef, watchDebounced } from "@vueuse/core";
import { Abolish, Rule } from "abolish/esm";
import type { TypeOfAbolishOrInstance } from "abolish/src/Abolish";
import type { AbolishCompiled, AbolishCompiledObject } from "abolish/src/Compiler";

/**
 * =============================================================
 * ======================= PLUGIN SECTION ======================
 * =============================================================
 */
export type AbolishPlugin = {
    init?: () => void;
    abolish?: () => TypeOfAbolishOrInstance;
};

export const AbolishPlugin: Plugin = {
    install(app, options: AbolishPlugin = {}) {
        // Run Init
        if (options.init) options.init();

        // Register Abolish
        const abolish = options.abolish ? options.abolish() : new Abolish();

        // Provide Abolish
        app.provide("abolish", abolish);
    }
};

export type AbolishVueOptions = {
    async?: boolean;
    delay?: number | true;
    Abolish?: TypeOfAbolishOrInstance;
    immediate?: boolean;
};

export type VRefOptions = AbolishVueOptions & { name?: string };

/**
 * Validate a reactive object in real time
 * @param target
 * @param rules
 * @param options
 *
 * @example
 * const {original, error, validated} = vReactive({
 *     name: "John Doe",
 *     email: "SomeMail@example.com",
 * });
 *
 * // `original` is the value being validated
 * // `error` is the error message
 * // `validated` is the validated object
 */
export function vReactive<
    R extends Record<string | keyof T, AbolishRule> | AbolishCompiledObject,
    T extends object
>(target: T, rules: R, options: AbolishVueOptions = {}) {
    const abolish = (options.Abolish || inject("abolish", Abolish)) as Abolish;

    /**
     * Explicitly explain types.
     */
    type formKeys = keyof T;
    type rulesKeys = keyof R;
    type ruleKeyValue = rulesKeys extends formKeys ? T[rulesKeys] : unknown;

    // Make Target reactive
    const t = reactive(target);

    // Set error and result ref variables
    const error = ref<ValidationError>();
    const validated = ref({} as Record<keyof R | string, ruleKeyValue>);

    const watchFn = (newVal: typeof t) => {
        if (options.async) {
            abolish.validateAsync(newVal, rules as AbolishCompiledObject).then(([e, r]) => {
                // Update error and result
                error.value = e ? e : undefined;
                validated.value = r as any;
            });
        } else {
            // Validate target
            const [e, r] = abolish.validate(newVal, rules as AbolishCompiledObject);

            // Update error and result
            error.value = e ? e : undefined;
            validated.value = r as any;
        }
    };

    // watch for changes
    if (options.delay) {
        watchDebounced(t, watchFn, {
            immediate: options.immediate !== false,
            debounce: options.delay === true ? 1000 : options.delay
        });
    } else {
        watch(t, watchFn, { immediate: options.immediate !== false });
    }

    return { original: t, error: readonly(error), validated };
}

/**
 * vReactive but as an array
 * @param target
 * @param rules
 * @param options
 *
 * @example
 * const [data, dataError, validatedData] = vReactiveAsArray({
 *     name: "John Doe",
 *    email: "SomeMail@example.com",
 * }, {
 *   name: "required|string:trim|min:2|max:10",
 *   email: "required|email"
 * });
 *
 * // `0` is the value being validated
 * // `1` is the error message
 * // `2` is the validated object
 */
export function vReactiveAsArray<
    R extends Record<string | keyof T, AbolishRule> | AbolishCompiledObject,
    T extends object
>(target: T, rules: R, options?: AbolishVueOptions) {
    const { original, error, validated } = vReactive(target, rules, options);

    return [original, error, validated] as [typeof original, typeof error, typeof validated];
}

/**
 * Validate a ref value in realtime
 * @param def
 * @param rules
 * @param options
 *
 * @example
 * const {original, error, validated} = vRef(value, rules);
 * // `original` is the value being validated
 * // `error` is the error message
 * // `validated` is the validated value
 */
export function vRef<IN, OUT = IN>(
    def: IN,
    rules: AbolishRule | AbolishCompiled,
    options: VRefOptions = {}
) {
    const abolish = options.Abolish || inject("abolish", Abolish);

    const error = ref<ValidationError>();
    const original = ref<IN>(def);

    type validated = OUT extends IN ? IN : OUT;
    const validated = ref(def as validated);

    if (options.name) rules = Rule([rules, { $name: options.name }]);

    const watchFn = (newVal: IN) => {
        if (options.async) {
            abolish.checkAsync(newVal, rules).then(([e, r]) => {
                // Update error and result
                error.value = e ? e : undefined;
                if (!e) validated.value = r as any;
            });
        } else {
            // Validate target
            const [e, r] = abolish.check(newVal, rules);

            // Update error and result
            error.value = e ? e : undefined;
            if (!e) validated.value = r as any;
        }
    };

    // watch for changes
    if (options.delay) {
        watchDebounced(original, (o) => watchFn(o), {
            immediate: options.immediate !== false,
            debounce: options.delay === true ? 1000 : options.delay
        });
    } else {
        watch(original, (o) => watchFn(o), { immediate: options.immediate !== false });
    }

    return { original, error: readonly(error), validated };
}

/**
 * vRef but as an array
 * @param def
 * @param rules
 * @param options
 *
 * @example
 * const [original, error, validated] = vRefAsArray(value, rules);
 * // `original` is the value being validated
 * // `error` is the error message
 * // `validated` is the validated value
 */
export function vRefAsArray<IN, OUT = IN>(
    def: IN,
    rules: AbolishRule | AbolishCompiled,
    options?: VRefOptions
) {
    const { original, error, validated } = vRef<IN, OUT>(def, rules, options);

    return [original, error, validated] as [typeof original, typeof error, typeof validated];
}

/**
 * Extended ValidatedRef
 * @param def
 * @param rules
 * @param options
 *
 * @example
 * const name = vRefExtended(value, rule)
 *
 * name.value // " John Doe "
 * name.error // "Validation error"
 * name.validated // Validated result i.e "John Doe"
 */
export function vRefExtended<IN, OUT = IN>(
    def: IN,
    rules: AbolishRule | AbolishCompiled,
    options?: VRefOptions
) {
    const { original, error, validated } = vRef<IN, OUT>(def, rules, options);
    return extendRef(original, { error, validated });
}

/**
 * rCheck stands for reactive check.
 * It is the reactive version of Abolish.check()
 * @param source
 * @param rule
 * @param options
 *
 * @example
 * const source = Ref(value) | () => value;
 * const [error, result] = rCheck(source, rule);
 * // `error` is the error message
 * // `result` is the validated value
 */
export function rCheck<IN, OUT = IN>(
    source: Ref<IN> | (() => IN),
    rule: AbolishRule | AbolishCompiled,
    options: AbolishVueOptions = {}
) {
    const abolish = options.Abolish || inject("abolish", Abolish);

    const error = ref<ValidationError>();
    const validated = ref<OUT>();

    const watchFn = (newValue: IN) => {
        if (options.async) {
            abolish.checkAsync(newValue, rule).then(([e, v]) => {
                error.value = e ? e : undefined;
                validated.value = v as unknown as OUT;
            });
        } else {
            const [e, v] = abolish.check(newValue, rule);
            error.value = e ? e : undefined;
            validated.value = v as unknown as OUT;
        }
    };

    // watch for changes
    if (options.delay) {
        watchDebounced(source, watchFn, {
            immediate: options.immediate !== false,
            debounce: options.delay === true ? 1000 : options.delay
        });
    } else {
        watch(source, watchFn, { immediate: options.immediate !== false });
    }

    return [error, validated] as [typeof error, typeof validated];
}

/**
 * rCheckOnly stands for reactive check only.
 * This is same as rCheck but without the validated value.
 *
 * This will improve performance when you don't need the validated value.
 * @param source
 * @param rule
 * @param options
 *
 * @example
 * const source = Ref(value) | () => value;
 * const error = rCheckOnly(source, rule);
 */
export function rCheckOnly<IN>(
    source: Ref<IN> | (() => IN),
    rule: AbolishRule | AbolishCompiled,
    options: AbolishVueOptions = { immediate: true }
) {
    const abolish = options.Abolish || inject("abolish", Abolish);

    const error = ref<ValidationError>();

    const watchFn = (newValue: IN) => {
        if (options.async) {
            abolish.checkAsync(newValue, rule).then((d) => {
                error.value = d[0] ? d[0] : undefined;
            });
        } else {
            const d = Abolish.check(newValue, rule);
            error.value = d[0] ? d[0] : undefined;
        }
    };

    // watch for changes
    if (options.delay) {
        watchDebounced(source, watchFn, {
            immediate: options.immediate !== false,
            debounce: options.delay === true ? 1000 : options.delay
        });
    } else {
        watch(source, watchFn, { immediate: options.immediate !== false });
    }

    return error;
}

/**
 * rTest stands for reactive test.
 * It is the reactive version of Abolish.test()
 * @param source
 * @param rule
 * @param options
 *
 * @example
 * const source = Ref(value) | () => value;
 * const isValid = rTest(source, rule);
 * // `isValid` is the boolean result of test
 */
export function rTest<IN>(
    source: Ref<IN> | (() => IN),
    rule: AbolishRule | AbolishCompiled,
    options: AbolishVueOptions = {}
) {
    const abolish = options.Abolish || inject("abolish", Abolish);

    const result = ref<boolean>(true);

    const watchFn = (newValue: IN) => {
        if (options.async) {
            abolish.testAsync(newValue, rule).then((d) => {
                result.value = d;
            });
        } else {
            result.value = abolish.test(newValue, rule);
        }
    };

    // watch for changes
    if (options.delay) {
        watchDebounced(source, watchFn, {
            immediate: options.immediate !== false,
            debounce: options.delay === true ? 1000 : options.delay
        });
    } else {
        watch(source, watchFn, { immediate: options.immediate !== false });
    }

    return result;
}
