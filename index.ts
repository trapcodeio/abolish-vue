import type { AbolishRule, ValidationError } from "abolish/src/Types";
import { inject, Plugin, reactive, readonly, ref, UnwrapRef, watch } from "vue";
import { extendRef, watchDebounced } from "@vueuse/core";
import { Abolish, Rule } from "abolish/index.esm";

export type VReactiveOptions = {
    async?: boolean;
    delay?: number | true;
    Abolish?: Abolish | typeof Abolish;
};

export type VRefOptions = VReactiveOptions & { name?: string };

/**
 * Validate a reactive object in real time
 * @param target
 * @param rules
 * @param options
 */
export function vReactive<R extends Record<string | keyof T, AbolishRule>, T extends object>(
    target: T,
    rules: R,
    options: VReactiveOptions = {}
) {
    const abolish = options.Abolish || inject("abolish", Abolish);

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
            abolish.validateAsync(newVal, rules).then(([e, r]) => {
                // Update error and result
                error.value = e ? e : undefined;
                validated.value = r;
            });
        } else {
            // Validate target
            const [e, r] = abolish.validate(newVal, rules);

            // Update error and result
            error.value = e ? e : undefined;
            validated.value = r;
        }
    };

    // watch for changes
    if (options.delay) {
        watchDebounced(t, watchFn, {
            immediate: true,
            debounce: options.delay === true ? 1000 : options.delay
        });
    } else {
        watch(t, watchFn, { immediate: true });
    }

    return { original: t, error: readonly(error), validated };
}

/**
 * vReactive but as an array
 * @param target
 * @param rules
 * @param options
 */
export function vReactiveAsArray<R extends Record<string | keyof T, AbolishRule>, T extends object>(
    target: T,
    rules: R,
    options: VReactiveOptions = {}
) {
    const { original, error, validated } = vReactive(target, rules, options);

    return [original, error, validated] as [typeof original, typeof error, typeof validated];
}

/**
 * Validate a ref value in realtime
 * @param def
 * @param rules
 * @param options
 */
export function vRef<IN, OUT = IN>(def: IN, rules: AbolishRule, options: VRefOptions = {}) {
    const abolish = options.Abolish || inject("abolish", Abolish);

    const error = ref<ValidationError>();
    const original = ref<IN>(def);

    type validated = OUT extends IN ? IN : OUT;
    const validated = ref(def as validated);

    if (options.name) {
        rules = Rule([rules, { $name: options.name }]);
    }

    const watchFn = (newVal: UnwrapRef<typeof original>) => {
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
        watchDebounced(original, watchFn, {
            immediate: true,
            debounce: options.delay === true ? 1000 : options.delay
        });
    } else {
        watch(original, watchFn, { immediate: true });
    }

    return { original, error: readonly(error), validated };
}

/**
 * vRef but as an array
 * @param def
 * @param rules
 * @param options
 */
export function vRefAsArray<IN, OUT = IN>(def: IN, rules: AbolishRule, options: VRefOptions = {}) {
    const { original, error, validated } = vRef<IN, OUT>(def, rules, options);

    return [original, error, validated] as [typeof original, typeof error, typeof validated];
}

/**
 * Extended ValidatedRef
 * @param def
 * @param rules
 * @param options
 */
export function vRefExtended<IN, OUT = IN>(def: IN, rules: AbolishRule, options: VRefOptions = {}) {
    const { original, error, validated } = vRef<IN, OUT>(def, rules, options);
    return extendRef(original, { error, validated });
}

/**
 * =============================================================
 * ======================= PLUGIN SECTION ======================
 * =============================================================
 */
export type AbolishPlugin = {
    abolish?: () => Abolish | typeof Abolish;
    init?: () => void;
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
