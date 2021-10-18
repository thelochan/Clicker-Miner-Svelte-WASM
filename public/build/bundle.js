
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var initMinerWasm = "/build/aa756d4e733fad84.wasm";

    var Module = (function() {
      var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
      
      return (
    function(Module) {
      Module = Module || {};



    // The Module object: Our interface to the outside world. We import
    // and export values on it. There are various ways Module can be used:
    // 1. Not defined. We create it here
    // 2. A function parameter, function(Module) { ..generated code.. }
    // 3. pre-run appended it, var Module = {}; ..generated code..
    // 4. External script tag defines var Module.
    // We need to check if Module already exists (e.g. case 3 above).
    // Substitution will be replaced with actual code on later stage of the build,
    // this way Closure Compiler will not mangle it (e.g. case 4. above).
    // Note that if you want to run closure, and also to use Module
    // after the generated code, you will need to define   var Module = {};
    // before the code. Then that object will be used in the code, and you
    // can continue to use Module afterwards as well.
    var Module = typeof Module !== 'undefined' ? Module : {};

    // Set up the promise that indicates the Module is initialized
    var readyPromiseResolve, readyPromiseReject;
    Module['ready'] = new Promise(function(resolve, reject) {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_main')) {
            Object.defineProperty(Module['ready'], '_main', { configurable: true, get: function() { abort('You are getting _main on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_main', { configurable: true, set: function() { abort('You are setting _main on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_stack_get_end')) {
            Object.defineProperty(Module['ready'], '_emscripten_stack_get_end', { configurable: true, get: function() { abort('You are getting _emscripten_stack_get_end on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_stack_get_end', { configurable: true, set: function() { abort('You are setting _emscripten_stack_get_end on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_stack_get_free')) {
            Object.defineProperty(Module['ready'], '_emscripten_stack_get_free', { configurable: true, get: function() { abort('You are getting _emscripten_stack_get_free on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_stack_get_free', { configurable: true, set: function() { abort('You are setting _emscripten_stack_get_free on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_stack_init')) {
            Object.defineProperty(Module['ready'], '_emscripten_stack_init', { configurable: true, get: function() { abort('You are getting _emscripten_stack_init on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_stack_init', { configurable: true, set: function() { abort('You are setting _emscripten_stack_init on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_stackSave')) {
            Object.defineProperty(Module['ready'], '_stackSave', { configurable: true, get: function() { abort('You are getting _stackSave on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_stackSave', { configurable: true, set: function() { abort('You are setting _stackSave on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_stackRestore')) {
            Object.defineProperty(Module['ready'], '_stackRestore', { configurable: true, get: function() { abort('You are getting _stackRestore on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_stackRestore', { configurable: true, set: function() { abort('You are setting _stackRestore on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_stackAlloc')) {
            Object.defineProperty(Module['ready'], '_stackAlloc', { configurable: true, get: function() { abort('You are getting _stackAlloc on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_stackAlloc', { configurable: true, set: function() { abort('You are setting _stackAlloc on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '___wasm_call_ctors')) {
            Object.defineProperty(Module['ready'], '___wasm_call_ctors', { configurable: true, get: function() { abort('You are getting ___wasm_call_ctors on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '___wasm_call_ctors', { configurable: true, set: function() { abort('You are setting ___wasm_call_ctors on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_fflush')) {
            Object.defineProperty(Module['ready'], '_fflush', { configurable: true, get: function() { abort('You are getting _fflush on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_fflush', { configurable: true, set: function() { abort('You are setting _fflush on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '___errno_location')) {
            Object.defineProperty(Module['ready'], '___errno_location', { configurable: true, get: function() { abort('You are getting ___errno_location on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '___errno_location', { configurable: true, set: function() { abort('You are setting ___errno_location on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '___emscripten_pthread_data_constructor')) {
            Object.defineProperty(Module['ready'], '___emscripten_pthread_data_constructor', { configurable: true, get: function() { abort('You are getting ___emscripten_pthread_data_constructor on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '___emscripten_pthread_data_constructor', { configurable: true, set: function() { abort('You are setting ___emscripten_pthread_data_constructor on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '__emscripten_call_on_thread')) {
            Object.defineProperty(Module['ready'], '__emscripten_call_on_thread', { configurable: true, get: function() { abort('You are getting __emscripten_call_on_thread on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '__emscripten_call_on_thread', { configurable: true, set: function() { abort('You are setting __emscripten_call_on_thread on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '__emscripten_main_thread_futex')) {
            Object.defineProperty(Module['ready'], '__emscripten_main_thread_futex', { configurable: true, get: function() { abort('You are getting __emscripten_main_thread_futex on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '__emscripten_main_thread_futex', { configurable: true, set: function() { abort('You are setting __emscripten_main_thread_futex on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '__emscripten_thread_init')) {
            Object.defineProperty(Module['ready'], '__emscripten_thread_init', { configurable: true, get: function() { abort('You are getting __emscripten_thread_init on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '__emscripten_thread_init', { configurable: true, set: function() { abort('You are setting __emscripten_thread_init on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '__emscripten_thread_exit')) {
            Object.defineProperty(Module['ready'], '__emscripten_thread_exit', { configurable: true, get: function() { abort('You are getting __emscripten_thread_exit on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '__emscripten_thread_exit', { configurable: true, set: function() { abort('You are setting __emscripten_thread_exit on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_current_thread_process_queued_calls')) {
            Object.defineProperty(Module['ready'], '_emscripten_current_thread_process_queued_calls', { configurable: true, get: function() { abort('You are getting _emscripten_current_thread_process_queued_calls on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_current_thread_process_queued_calls', { configurable: true, set: function() { abort('You are setting _emscripten_current_thread_process_queued_calls on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '__emscripten_allow_main_runtime_queued_calls')) {
            Object.defineProperty(Module['ready'], '__emscripten_allow_main_runtime_queued_calls', { configurable: true, get: function() { abort('You are getting __emscripten_allow_main_runtime_queued_calls on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '__emscripten_allow_main_runtime_queued_calls', { configurable: true, set: function() { abort('You are setting __emscripten_allow_main_runtime_queued_calls on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_futex_wake')) {
            Object.defineProperty(Module['ready'], '_emscripten_futex_wake', { configurable: true, get: function() { abort('You are getting _emscripten_futex_wake on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_futex_wake', { configurable: true, set: function() { abort('You are setting _emscripten_futex_wake on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_get_global_libc')) {
            Object.defineProperty(Module['ready'], '_emscripten_get_global_libc', { configurable: true, get: function() { abort('You are getting _emscripten_get_global_libc on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_get_global_libc', { configurable: true, set: function() { abort('You are setting _emscripten_get_global_libc on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_main_browser_thread_id')) {
            Object.defineProperty(Module['ready'], '_emscripten_main_browser_thread_id', { configurable: true, get: function() { abort('You are getting _emscripten_main_browser_thread_id on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_main_browser_thread_id', { configurable: true, set: function() { abort('You are setting _emscripten_main_browser_thread_id on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_main_thread_process_queued_calls')) {
            Object.defineProperty(Module['ready'], '_emscripten_main_thread_process_queued_calls', { configurable: true, get: function() { abort('You are getting _emscripten_main_thread_process_queued_calls on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_main_thread_process_queued_calls', { configurable: true, set: function() { abort('You are setting _emscripten_main_thread_process_queued_calls on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_run_in_main_runtime_thread_js')) {
            Object.defineProperty(Module['ready'], '_emscripten_run_in_main_runtime_thread_js', { configurable: true, get: function() { abort('You are getting _emscripten_run_in_main_runtime_thread_js on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_run_in_main_runtime_thread_js', { configurable: true, set: function() { abort('You are setting _emscripten_run_in_main_runtime_thread_js on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_stack_set_limits')) {
            Object.defineProperty(Module['ready'], '_emscripten_stack_set_limits', { configurable: true, get: function() { abort('You are getting _emscripten_stack_set_limits on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_stack_set_limits', { configurable: true, set: function() { abort('You are setting _emscripten_stack_set_limits on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_sync_run_in_main_thread_2')) {
            Object.defineProperty(Module['ready'], '_emscripten_sync_run_in_main_thread_2', { configurable: true, get: function() { abort('You are getting _emscripten_sync_run_in_main_thread_2 on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_sync_run_in_main_thread_2', { configurable: true, set: function() { abort('You are setting _emscripten_sync_run_in_main_thread_2 on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_sync_run_in_main_thread_4')) {
            Object.defineProperty(Module['ready'], '_emscripten_sync_run_in_main_thread_4', { configurable: true, get: function() { abort('You are getting _emscripten_sync_run_in_main_thread_4 on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_sync_run_in_main_thread_4', { configurable: true, set: function() { abort('You are setting _emscripten_sync_run_in_main_thread_4 on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_tls_init')) {
            Object.defineProperty(Module['ready'], '_emscripten_tls_init', { configurable: true, get: function() { abort('You are getting _emscripten_tls_init on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_tls_init', { configurable: true, set: function() { abort('You are setting _emscripten_tls_init on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_pthread_self')) {
            Object.defineProperty(Module['ready'], '_pthread_self', { configurable: true, get: function() { abort('You are getting _pthread_self on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_pthread_self', { configurable: true, set: function() { abort('You are setting _pthread_self on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_pthread_testcancel')) {
            Object.defineProperty(Module['ready'], '_pthread_testcancel', { configurable: true, get: function() { abort('You are getting _pthread_testcancel on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_pthread_testcancel', { configurable: true, set: function() { abort('You are setting _pthread_testcancel on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_exit')) {
            Object.defineProperty(Module['ready'], '_exit', { configurable: true, get: function() { abort('You are getting _exit on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_exit', { configurable: true, set: function() { abort('You are setting _exit on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_memalign')) {
            Object.defineProperty(Module['ready'], '_memalign', { configurable: true, get: function() { abort('You are getting _memalign on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_memalign', { configurable: true, set: function() { abort('You are setting _memalign on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_emscripten_proxy_main')) {
            Object.defineProperty(Module['ready'], '_emscripten_proxy_main', { configurable: true, get: function() { abort('You are getting _emscripten_proxy_main on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_emscripten_proxy_main', { configurable: true, set: function() { abort('You are setting _emscripten_proxy_main on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], 'establishStackSpace')) {
            Object.defineProperty(Module['ready'], 'establishStackSpace', { configurable: true, get: function() { abort('You are getting establishStackSpace on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], 'establishStackSpace', { configurable: true, set: function() { abort('You are setting establishStackSpace on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], 'invokeEntryPoint')) {
            Object.defineProperty(Module['ready'], 'invokeEntryPoint', { configurable: true, get: function() { abort('You are getting invokeEntryPoint on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], 'invokeEntryPoint', { configurable: true, set: function() { abort('You are setting invokeEntryPoint on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_malloc')) {
            Object.defineProperty(Module['ready'], '_malloc', { configurable: true, get: function() { abort('You are getting _malloc on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_malloc', { configurable: true, set: function() { abort('You are setting _malloc on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '_free')) {
            Object.defineProperty(Module['ready'], '_free', { configurable: true, get: function() { abort('You are getting _free on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '_free', { configurable: true, set: function() { abort('You are setting _free on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], '___pthread_tsd_run_dtors')) {
            Object.defineProperty(Module['ready'], '___pthread_tsd_run_dtors', { configurable: true, get: function() { abort('You are getting ___pthread_tsd_run_dtors on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], '___pthread_tsd_run_dtors', { configurable: true, set: function() { abort('You are setting ___pthread_tsd_run_dtors on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

          if (!Object.getOwnPropertyDescriptor(Module['ready'], 'onRuntimeInitialized')) {
            Object.defineProperty(Module['ready'], 'onRuntimeInitialized', { configurable: true, get: function() { abort('You are getting onRuntimeInitialized on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
            Object.defineProperty(Module['ready'], 'onRuntimeInitialized', { configurable: true, set: function() { abort('You are setting onRuntimeInitialized on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js'); } });
          }
        

    // --pre-jses are emitted after the Module integration code, so that they can
    // refer to Module (if they choose; they can also define Module)
    // {{PRE_JSES}}

    // Sometimes an existing Module object exists with properties
    // meant to overwrite the default module functionality. Here
    // we collect those properties and reapply _after_ we configure
    // the current environment's defaults to avoid having to be so
    // defensive during initialization.
    var moduleOverrides = {};
    var key;
    for (key in Module) {
      if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key];
      }
    }

    var arguments_ = [];
    var thisProgram = './this.program';
    var quit_ = function(status, toThrow) {
      throw toThrow;
    };

    // Determine the runtime environment we are in. You can customize this by
    // setting the ENVIRONMENT setting at compile time (see settings.js).

    var ENVIRONMENT_IS_WEB = false;
    var ENVIRONMENT_IS_WORKER = true;
    var ENVIRONMENT_IS_NODE = false;
    var ENVIRONMENT_IS_SHELL = false;

    if (Module['ENVIRONMENT']) {
      throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
    }

    // Three configurations we can be running in:
    // 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
    // 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
    // 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)

    // ENVIRONMENT_IS_PTHREAD=true will have been preset in worker.js. Make it false in the main runtime thread.
    var ENVIRONMENT_IS_PTHREAD = Module['ENVIRONMENT_IS_PTHREAD'] || false;

    // `/` should be present at the end if `scriptDirectory` is not empty
    var scriptDirectory = '';
    function locateFile(path) {
      if (Module['locateFile']) {
        return Module['locateFile'](path, scriptDirectory);
      }
      return scriptDirectory + path;
    }

    // Hooks that are implemented differently in different runtime environments.
    var read_,
        readAsync,
        readBinary;

    {
      { // Check worker, not web, since window could be polyfilled
        scriptDirectory = self.location.href;
      }
      // When MODULARIZE, this JS may be executed later, after document.currentScript
      // is gone, so we saved it, and we use it here instead of any other info.
      if (_scriptDir) {
        scriptDirectory = _scriptDir;
      }
      // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
      // otherwise, slice off the final part of the url to find the script directory.
      // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
      // and scriptDirectory will correctly be replaced with an empty string.
      if (scriptDirectory.indexOf('blob:') !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
      } else {
        scriptDirectory = '';
      }

      if (!(typeof window === 'object' || typeof importScripts === 'function')) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

      // Differentiate the Web Worker from the Node Worker case, as reading must
      // be done differently.
      {

    // include: web_or_worker_shell_read.js


      read_ = function(url) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, false);
          xhr.send(null);
          return xhr.responseText;
      };

      {
        readBinary = function(url) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.responseType = 'arraybuffer';
            xhr.send(null);
            return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
        };
      }

      readAsync = function(url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
            return;
          }
          onerror();
        };
        xhr.onerror = onerror;
        xhr.send(null);
      };

    // end include: web_or_worker_shell_read.js
      }
    }

    // Set up the out() and err() hooks, which are how we can print to stdout or
    // stderr, respectively.
    var out = Module['print'] || console.log.bind(console);
    var err = Module['printErr'] || console.warn.bind(console);

    // Merge back in the overrides
    for (key in moduleOverrides) {
      if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key];
      }
    }
    // Free the object hierarchy contained in the overrides, this lets the GC
    // reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
    moduleOverrides = null;

    // Emit code to handle expected values on the Module object. This applies Module.x
    // to the proper local x. This has two benefits: first, we only emit it if it is
    // expected to arrive, and second, by using a local everywhere else that can be
    // minified.

    if (Module['arguments']) arguments_ = Module['arguments'];
    if (!Object.getOwnPropertyDescriptor(Module, 'arguments')) {
      Object.defineProperty(Module, 'arguments', {
        configurable: true,
        get: function() {
          abort('Module.arguments has been replaced with plain arguments_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
        }
      });
    }

    if (Module['thisProgram']) thisProgram = Module['thisProgram'];
    if (!Object.getOwnPropertyDescriptor(Module, 'thisProgram')) {
      Object.defineProperty(Module, 'thisProgram', {
        configurable: true,
        get: function() {
          abort('Module.thisProgram has been replaced with plain thisProgram (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
        }
      });
    }

    if (Module['quit']) quit_ = Module['quit'];
    if (!Object.getOwnPropertyDescriptor(Module, 'quit')) {
      Object.defineProperty(Module, 'quit', {
        configurable: true,
        get: function() {
          abort('Module.quit has been replaced with plain quit_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
        }
      });
    }

    // perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
    // Assertions on removed incoming Module JS APIs.
    assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
    assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
    assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
    assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
    assert(typeof Module['read'] === 'undefined', 'Module.read option was removed (modify read_ in JS)');
    assert(typeof Module['readAsync'] === 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
    assert(typeof Module['readBinary'] === 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
    assert(typeof Module['setWindowTitle'] === 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
    assert(typeof Module['TOTAL_MEMORY'] === 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');

    if (!Object.getOwnPropertyDescriptor(Module, 'read')) {
      Object.defineProperty(Module, 'read', {
        configurable: true,
        get: function() {
          abort('Module.read has been replaced with plain read_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
        }
      });
    }

    if (!Object.getOwnPropertyDescriptor(Module, 'readAsync')) {
      Object.defineProperty(Module, 'readAsync', {
        configurable: true,
        get: function() {
          abort('Module.readAsync has been replaced with plain readAsync (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
        }
      });
    }

    if (!Object.getOwnPropertyDescriptor(Module, 'readBinary')) {
      Object.defineProperty(Module, 'readBinary', {
        configurable: true,
        get: function() {
          abort('Module.readBinary has been replaced with plain readBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
        }
      });
    }

    if (!Object.getOwnPropertyDescriptor(Module, 'setWindowTitle')) {
      Object.defineProperty(Module, 'setWindowTitle', {
        configurable: true,
        get: function() {
          abort('Module.setWindowTitle has been replaced with plain setWindowTitle (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
        }
      });
    }


    assert(ENVIRONMENT_IS_WORKER , 'Pthreads do not work in this environment yet (need Web Workers, or an alternative to them)');

    assert(!ENVIRONMENT_IS_WEB, "web environment detected but not enabled at build time.  Add 'web' to `-s ENVIRONMENT` to enable.");

    assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time.  Add 'node' to `-s ENVIRONMENT` to enable.");

    assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add 'shell' to `-s ENVIRONMENT` to enable.");

    function warnOnce(text) {
      if (!warnOnce.shown) warnOnce.shown = {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    }



    // === Preamble library stuff ===

    // Documentation for the public APIs defined in this file must be updated in:
    //    site/source/docs/api_reference/preamble.js.rst
    // A prebuilt local version of the documentation is available at:
    //    site/build/text/docs/api_reference/preamble.js.txt
    // You can also build docs locally as HTML or other formats in site/
    // An online HTML version (which may be of a different version of Emscripten)
    //    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

    var wasmBinary;
    if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
    if (!Object.getOwnPropertyDescriptor(Module, 'wasmBinary')) {
      Object.defineProperty(Module, 'wasmBinary', {
        configurable: true,
        get: function() {
          abort('Module.wasmBinary has been replaced with plain wasmBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
        }
      });
    }
    var noExitRuntime = Module['noExitRuntime'] || true;
    if (!Object.getOwnPropertyDescriptor(Module, 'noExitRuntime')) {
      Object.defineProperty(Module, 'noExitRuntime', {
        configurable: true,
        get: function() {
          abort('Module.noExitRuntime has been replaced with plain noExitRuntime (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
        }
      });
    }

    if (typeof WebAssembly !== 'object') {
      abort('no native wasm support detected');
    }

    // end include: runtime_safe_heap.js
    // Wasm globals

    var wasmMemory;

    // For sending to workers.
    var wasmModule;

    //========================================
    // Runtime essentials
    //========================================

    // whether we are quitting the application. no code should run after this.
    // set in exit() and abort()
    var ABORT = false;

    // set by exit() and abort().  Passed to 'onExit' handler.
    // NOTE: This is also used as the process return code code in shell environments
    // but only when noExitRuntime is false.
    var EXITSTATUS;

    /** @type {function(*, string=)} */
    function assert(condition, text) {
      if (!condition) {
        abort('Assertion failed: ' + text);
      }
    }

    // include: runtime_strings.js


    // runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

    // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
    // a copy of that string as a Javascript String object.

    // UTF8Decoder.decode may not work with a view of a SharedArrayBuffer, see
    // https://github.com/whatwg/encoding/issues/172
    // To avoid that, we wrap around it and add a copy into a normal ArrayBuffer,
    // which can still be much faster than creating a string character by
    // character.
    function TextDecoderWrapper(encoding) {
      var textDecoder = new TextDecoder(encoding);
      this.decode = function(data) {
        assert(data instanceof Uint8Array);
        // While we compile with pthreads, this method can be called on side buffers
        // as well, such as the stdout buffer in the filesystem code. Only copy when
        // we have to.
        if (data.buffer instanceof SharedArrayBuffer) {
          data = new Uint8Array(data);
        }
        return textDecoder.decode.call(textDecoder, data);
      };
    }

    var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoderWrapper('utf8') : undefined;

    /**
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
    function UTF8ArrayToString(heap, idx, maxBytesToRead) {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
      // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
      // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
      while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;

      if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx, endPtr));
      } else {
        var str = '';
        // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
        while (idx < endPtr) {
          // For UTF8 byte structure, see:
          // http://en.wikipedia.org/wiki/UTF-8#Description
          // https://www.ietf.org/rfc/rfc2279.txt
          // https://tools.ietf.org/html/rfc3629
          var u0 = heap[idx++];
          if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
          var u1 = heap[idx++] & 63;
          if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
          var u2 = heap[idx++] & 63;
          if ((u0 & 0xF0) == 0xE0) {
            u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
          } else {
            if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
            u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
          }

          if (u0 < 0x10000) {
            str += String.fromCharCode(u0);
          } else {
            var ch = u0 - 0x10000;
            str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
          }
        }
      }
      return str;
    }

    // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
    // copy of that string as a Javascript String object.
    // maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
    //                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
    //                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
    //                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
    //                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
    //                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
    //                 throw JS JIT optimizations off, so it is worth to consider consistently using one
    //                 style or the other.
    /**
     * @param {number} ptr
     * @param {number=} maxBytesToRead
     * @return {string}
     */
    function UTF8ToString(ptr, maxBytesToRead) {
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    }

    // Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
    // encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
    // Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
    // Parameters:
    //   str: the Javascript string to copy.
    //   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
    //   outIdx: The starting offset in the array to begin the copying.
    //   maxBytesToWrite: The maximum number of bytes this function can write to the array.
    //                    This count should include the null terminator,
    //                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
    //                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
    // Returns the number of bytes written, EXCLUDING the null terminator.

    function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
      if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
        return 0;

      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) {
          var u1 = str.charCodeAt(++i);
          u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
        }
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 0xC0 | (u >> 6);
          heap[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 0xE0 | (u >> 12);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          if (u >= 0x200000) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x1FFFFF).');
          heap[outIdx++] = 0xF0 | (u >> 18);
          heap[outIdx++] = 0x80 | ((u >> 12) & 63);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        }
      }
      // Null-terminate the pointer to the buffer.
      heap[outIdx] = 0;
      return outIdx - startIdx;
    }

    // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
    // null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
    // Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
    // Returns the number of bytes written, EXCLUDING the null terminator.

    function stringToUTF8(str, outPtr, maxBytesToWrite) {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
    }

    // Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
    function lengthBytesUTF8(str) {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
        if (u <= 0x7F) ++len;
        else if (u <= 0x7FF) len += 2;
        else if (u <= 0xFFFF) len += 3;
        else len += 4;
      }
      return len;
    }

    // Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
    // a copy of that string as a Javascript String object.

    typeof TextDecoder !== 'undefined' ? new TextDecoderWrapper('utf-16le') : undefined;

    // Allocate stack space for a JS string, and write it there.
    function allocateUTF8OnStack(str) {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8Array(str, HEAP8, ret, size);
      return ret;
    }

    function writeArrayToMemory(array, buffer) {
      assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)');
      HEAP8.set(array, buffer);
    }

    /** @param {boolean=} dontAddNull */
    function writeAsciiToMemory(str, buffer, dontAddNull) {
      for (var i = 0; i < str.length; ++i) {
        assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
        HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
      }
      // Null-terminate the pointer to the HEAP.
      if (!dontAddNull) HEAP8[((buffer)>>0)] = 0;
    }

    var /** @type {ArrayBuffer} */
      buffer,
    /** @type {Int8Array} */
      HEAP8,
    /** @type {Uint8Array} */
      HEAPU8,
    /** @type {Int32Array} */
      HEAP32,
    /** @type {Uint32Array} */
      HEAPU32,
    /** @type {Float64Array} */
      HEAPF64;

    if (ENVIRONMENT_IS_PTHREAD) {
      // Grab imports from the pthread to local scope.
      buffer = Module['buffer'];
      // Note that not all runtime fields are imported above
    }

    function updateGlobalBufferAndViews(buf) {
      buffer = buf;
      Module['HEAP8'] = HEAP8 = new Int8Array(buf);
      Module['HEAP16'] = new Int16Array(buf);
      Module['HEAP32'] = HEAP32 = new Int32Array(buf);
      Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
      Module['HEAPU16'] = new Uint16Array(buf);
      Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
      Module['HEAPF32'] = new Float32Array(buf);
      Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
    }

    var TOTAL_STACK = 5242880;
    if (Module['TOTAL_STACK']) assert(TOTAL_STACK === Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime');

    var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;
    if (!Object.getOwnPropertyDescriptor(Module, 'INITIAL_MEMORY')) {
      Object.defineProperty(Module, 'INITIAL_MEMORY', {
        configurable: true,
        get: function() {
          abort('Module.INITIAL_MEMORY has been replaced with plain INITIAL_MEMORY (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
        }
      });
    }

    assert(INITIAL_MEMORY >= TOTAL_STACK, 'INITIAL_MEMORY should be larger than TOTAL_STACK, was ' + INITIAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

    // check for full engine support (use string 'subarray' to avoid closure compiler confusion)
    assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined,
           'JS engine does not provide full typed array support');

    // In non-standalone/normal mode, we create the memory here.
    // include: runtime_init_memory.js


    // Create the wasm memory. (Note: this only applies if IMPORTED_MEMORY is defined)

    if (ENVIRONMENT_IS_PTHREAD) {
      wasmMemory = Module['wasmMemory'];
      buffer = Module['buffer'];
    } else {

      if (Module['wasmMemory']) {
        wasmMemory = Module['wasmMemory'];
      } else
      {
        wasmMemory = new WebAssembly.Memory({
          'initial': INITIAL_MEMORY / 65536,
          'maximum': INITIAL_MEMORY / 65536
          ,
          'shared': true
        });
        if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
          err('requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag');
          throw Error('bad memory');
        }
      }

    }

    if (wasmMemory) {
      buffer = wasmMemory.buffer;
    }

    // If the user provides an incorrect length, just use that length instead rather than providing the user to
    // specifically provide the memory length with Module['INITIAL_MEMORY'].
    INITIAL_MEMORY = buffer.byteLength;
    assert(INITIAL_MEMORY % 65536 === 0);
    updateGlobalBufferAndViews(buffer);

    // end include: runtime_init_memory.js

    // include: runtime_init_table.js
    // In regular non-RELOCATABLE mode the table is exported
    // from the wasm module and this will be assigned once
    // the exports are available.
    var wasmTable;

    // end include: runtime_init_table.js
    // include: runtime_stack_check.js


    // Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
    function writeStackCookie() {
      var max = _emscripten_stack_get_end();
      assert((max & 3) == 0);
      // The stack grows downwards
      HEAPU32[(max >> 2)+1] = 0x2135467;
      HEAPU32[(max >> 2)+2] = 0x89BACDFE;
      // Also test the global address 0 for integrity.
      HEAP32[0] = 0x63736d65; /* 'emsc' */
    }

    function checkStackCookie() {
      if (ABORT) return;
      var max = _emscripten_stack_get_end();
      var cookie1 = HEAPU32[(max >> 2)+1];
      var cookie2 = HEAPU32[(max >> 2)+2];
      if (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
        abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x' + cookie2.toString(16) + ' ' + cookie1.toString(16));
      }
      // Also test the global address 0 for integrity.
      if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
    }

    // end include: runtime_stack_check.js
    // include: runtime_assertions.js


    // Endianness check
    (function() {
      var h16 = new Int16Array(1);
      var h8 = new Int8Array(h16.buffer);
      h16[0] = 0x6373;
      if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -s SUPPORT_BIG_ENDIAN=1 to bypass)';
    })();

    // end include: runtime_assertions.js
    var __ATPRERUN__  = []; // functions called before the runtime is initialized
    var __ATINIT__    = []; // functions called during startup
    var __ATMAIN__    = []; // functions called when main() is to be run
    var __ATPOSTRUN__ = []; // functions called after the main() is called

    var runtimeInitialized = false;
    var runtimeExited = false;
    var runtimeKeepaliveCounter = 0;

    function keepRuntimeAlive() {
      return noExitRuntime || runtimeKeepaliveCounter > 0;
    }

    function preRun() {
      if (ENVIRONMENT_IS_PTHREAD) return; // PThreads reuse the runtime from the main thread.

      if (Module['preRun']) {
        if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
        while (Module['preRun'].length) {
          addOnPreRun(Module['preRun'].shift());
        }
      }

      callRuntimeCallbacks(__ATPRERUN__);
    }

    function initRuntime() {
      checkStackCookie();
      assert(!runtimeInitialized);
      runtimeInitialized = true;

      if (ENVIRONMENT_IS_PTHREAD) return;

      
    if (!Module["noFSInit"] && !FS.init.initialized)
      FS.init();
    FS.ignorePermissions = false;
      callRuntimeCallbacks(__ATINIT__);
    }

    function preMain() {
      checkStackCookie();
      if (ENVIRONMENT_IS_PTHREAD) return; // PThreads reuse the runtime from the main thread.
      
      callRuntimeCallbacks(__ATMAIN__);
    }

    function exitRuntime() {
      checkStackCookie();
      if (ENVIRONMENT_IS_PTHREAD) return; // PThreads reuse the runtime from the main thread.
      runtimeExited = true;
    }

    function postRun() {
      checkStackCookie();
      if (ENVIRONMENT_IS_PTHREAD) return; // PThreads reuse the runtime from the main thread.

      if (Module['postRun']) {
        if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
        while (Module['postRun'].length) {
          addOnPostRun(Module['postRun'].shift());
        }
      }

      callRuntimeCallbacks(__ATPOSTRUN__);
    }

    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }

    function addOnInit(cb) {
      __ATINIT__.unshift(cb);
    }

    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }

    // include: runtime_math.js


    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

    assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
    assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
    assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
    assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');

    // end include: runtime_math.js
    // A counter of dependencies for calling run(). If we need to
    // do asynchronous work before running, increment this and
    // decrement it. Incrementing must happen in a place like
    // Module.preRun (used by emcc to add file preloading).
    // Note that you can add dependencies in preRun, even though
    // it happens right before run - run will be postponed until
    // the dependencies are met.
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
    var runDependencyTracking = {};

    function getUniqueRunDependency(id) {
      var orig = id;
      while (1) {
        if (!runDependencyTracking[id]) return id;
        id = orig + Math.random();
      }
    }

    function addRunDependency(id) {
      runDependencies++;

      if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
      }

      if (id) {
        assert(!runDependencyTracking[id]);
        runDependencyTracking[id] = 1;
        if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
          // Check for missing dependencies every few seconds
          runDependencyWatcher = setInterval(function() {
            if (ABORT) {
              clearInterval(runDependencyWatcher);
              runDependencyWatcher = null;
              return;
            }
            var shown = false;
            for (var dep in runDependencyTracking) {
              if (!shown) {
                shown = true;
                err('still waiting on run dependencies:');
              }
              err('dependency: ' + dep);
            }
            if (shown) {
              err('(end of list)');
            }
          }, 10000);
        }
      } else {
        err('warning: run dependency added without ID');
      }
    }

    function removeRunDependency(id) {
      runDependencies--;

      if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
      }

      if (id) {
        assert(runDependencyTracking[id]);
        delete runDependencyTracking[id];
      } else {
        err('warning: run dependency removed without ID');
      }
      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback(); // can add another dependenciesFulfilled
        }
      }
    }

    Module["preloadedImages"] = {}; // maps url to image data
    Module["preloadedAudios"] = {}; // maps url to audio data

    /** @param {string|number=} what */
    function abort(what) {
      // When running on a pthread, none of the incoming parameters on the module
      // object are present.  The `onAbort` handler only exists on the main thread
      // and so we need to proxy the handling of these back to the main thread.
      // TODO(sbc): Extend this to all such handlers that can be passed into on
      // module creation.
      if (ENVIRONMENT_IS_PTHREAD) {
        postMessage({ 'cmd': 'onAbort', 'arg': what});
      } else
      {
        if (Module['onAbort']) {
          Module['onAbort'](what);
        }
      }

      what += '';
      err(what);

      ABORT = true;
      EXITSTATUS = 1;

      var output = 'abort(' + what + ') at ' + stackTrace();
      what = output;

      // Use a wasm runtime error, because a JS error might be seen as a foreign
      // exception, which means we'd run destructors on it. We need the error to
      // simply make the program stop.
      var e = new WebAssembly.RuntimeError(what);

      readyPromiseReject(e);
      // Throw the error whether or not MODULARIZE is set because abort is used
      // in code paths apart from instantiation where an exception is expected
      // to be thrown when abort is called.
      throw e;
    }

    // {{MEM_INITIALIZER}}

    // include: memoryprofiler.js


    // end include: memoryprofiler.js
    // include: URIUtils.js


    // Prefix of data URIs emitted by SINGLE_FILE and related options.
    var dataURIPrefix = 'data:application/octet-stream;base64,';

    // Indicates whether filename is a base64 data URI.
    function isDataURI(filename) {
      // Prefix of data URIs emitted by SINGLE_FILE and related options.
      return filename.startsWith(dataURIPrefix);
    }

    // Indicates whether filename is delivered via file protocol (as opposed to http/https)
    function isFileURI(filename) {
      return filename.startsWith('file://');
    }

    // end include: URIUtils.js
    function createExportWrapper(name, fixedasm) {
      return function() {
        var displayName = name;
        var asm = fixedasm;
        if (!fixedasm) {
          asm = Module['asm'];
        }
        assert(runtimeInitialized, 'native function `' + displayName + '` called before runtime initialization');
        assert(!runtimeExited, 'native function `' + displayName + '` called after runtime exit (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
        if (!asm[name]) {
          assert(asm[name], 'exported native function `' + displayName + '` not found');
        }
        return asm[name].apply(null, arguments);
      };
    }

    var wasmBinaryFile;
      wasmBinaryFile = 'mine.wasm';
      if (!isDataURI(wasmBinaryFile)) {
        wasmBinaryFile = locateFile(wasmBinaryFile);
      }

    function getBinary(file) {
      try {
        if (file == wasmBinaryFile && wasmBinary) {
          return new Uint8Array(wasmBinary);
        }
        if (readBinary) {
          return readBinary(file);
        } else {
          throw "both async and sync fetching of the wasm failed";
        }
      }
      catch (err) {
        abort(err);
      }
    }

    function getBinaryPromise() {
      // If we don't have the binary yet, try to to load it asynchronously.
      // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
      // See https://github.com/github/fetch/pull/92#issuecomment-140665932
      // Cordova or Electron apps are typically loaded from a file:// url.
      // So use fetch if it is available and the url is not a file, otherwise fall back to XHR.
      if (!wasmBinary && (ENVIRONMENT_IS_WORKER)) {
        if (typeof fetch === 'function'
        ) {
          return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
            if (!response['ok']) {
              throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
            }
            return response['arrayBuffer']();
          }).catch(function () {
              return getBinary(wasmBinaryFile);
          });
        }
      }

      // Otherwise, getBinary should be able to get it synchronously
      return Promise.resolve().then(function() { return getBinary(wasmBinaryFile); });
    }

    // Create the wasm instance.
    // Receives the wasm imports, returns the exports.
    function createWasm() {
      // prepare imports
      var info = {
        'env': asmLibraryArg,
        'wasi_snapshot_preview1': asmLibraryArg,
      };
      // Load the wasm module and create an instance of using native support in the JS engine.
      // handle a generated wasm instance, receiving its exports and
      // performing other necessary setup
      /** @param {WebAssembly.Module=} module*/
      function receiveInstance(instance, module) {
        var exports = instance.exports;

        Module['asm'] = exports;

        wasmTable = Module['asm']['__indirect_function_table'];
        assert(wasmTable, "table not found in wasm exports");

        addOnInit(Module['asm']['__wasm_call_ctors']);

        PThread.tlsInitFunctions.push(Module['asm']['emscripten_tls_init']);
        // We now have the Wasm module loaded up, keep a reference to the compiled module so we can post it to the workers.
        wasmModule = module;
        // Instantiation is synchronous in pthreads and we assert on run dependencies.
        if (!ENVIRONMENT_IS_PTHREAD) {
          // PTHREAD_POOL_DELAY_LOAD==1 (or no preloaded pool in use): do not wait up for the Workers to
          // instantiate the Wasm module, but proceed with main() immediately.
          removeRunDependency('wasm-instantiate');
        }
      }
      // we can't run yet (except in a pthread, where we have a custom sync instantiator)
      if (!ENVIRONMENT_IS_PTHREAD) { addRunDependency('wasm-instantiate'); }

      // Prefer streaming instantiation if available.
      // Async compilation can be confusing when an error on the page overwrites Module
      // (for example, if the order of elements is wrong, and the one defining Module is
      // later), so we save Module and check it later.
      var trueModule = Module;
      function receiveInstantiationResult(result) {
        // 'result' is a ResultObject object which has both the module and instance.
        // receiveInstance() will swap in the exports (to Module.asm) so they can be called
        assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
        trueModule = null;
        receiveInstance(result['instance'], result['module']);
      }

      function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function(binary) {
          return WebAssembly.instantiate(binary, info);
        }).then(function (instance) {
          return instance;
        }).then(receiver, function(reason) {
          err('failed to asynchronously prepare wasm: ' + reason);

          // Warn on some common problems.
          if (isFileURI(wasmBinaryFile)) {
            err('warning: Loading from a file URI (' + wasmBinaryFile + ') is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing');
          }
          abort(reason);
        });
      }

      function instantiateAsync() {
        if (!wasmBinary &&
            typeof WebAssembly.instantiateStreaming === 'function' &&
            !isDataURI(wasmBinaryFile) &&
            typeof fetch === 'function') {
          return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function (response) {
            var result = WebAssembly.instantiateStreaming(response, info);

            return result.then(
              receiveInstantiationResult,
              function(reason) {
                // We expect the most common failure cause to be a bad MIME type for the binary,
                // in which case falling back to ArrayBuffer instantiation should work.
                err('wasm streaming compile failed: ' + reason);
                err('falling back to ArrayBuffer instantiation');
                return instantiateArrayBuffer(receiveInstantiationResult);
              });
          });
        } else {
          return instantiateArrayBuffer(receiveInstantiationResult);
        }
      }

      // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
      // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
      // to any other async startup actions they are performing.
      if (Module['instantiateWasm']) {
        try {
          var exports = Module['instantiateWasm'](info, receiveInstance);
          return exports;
        } catch(e) {
          err('Module.instantiateWasm callback failed with error: ' + e);
          return false;
        }
      }

      // If instantiation fails, reject the module ready promise.
      instantiateAsync().catch(readyPromiseReject);
      return {}; // no exports yet; we'll fill them in later
    }

    // Globals used by JS i64 conversions (see makeSetValue)
    var tempDouble;
    var tempI64;

    // === Body ===

    var ASM_CONSTS = {
      
    };
    function initPthreadsJS(tb){ PThread.initRuntime(tb); }





      function callRuntimeCallbacks(callbacks) {
          while (callbacks.length > 0) {
            var callback = callbacks.shift();
            if (typeof callback == 'function') {
              callback(Module); // Pass the module as the first argument.
              continue;
            }
            var func = callback.func;
            if (typeof func === 'number') {
              if (callback.arg === undefined) {
                wasmTable.get(func)();
              } else {
                wasmTable.get(func)(callback.arg);
              }
            } else {
              func(callback.arg === undefined ? null : callback.arg);
            }
          }
        }

      function demangle(func) {
          warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
          return func;
        }

      function demangleAll(text) {
          var regex =
            /\b_Z[\w\d_]+/g;
          return text.replace(regex,
            function(x) {
              var y = demangle(x);
              return x === y ? x : (y + ' [' + x + ']');
            });
        }

      function _emscripten_futex_wake(addr, count) {
          if (addr <= 0 || addr > HEAP8.length || addr&3 != 0 || count < 0) return -28;
          if (count == 0) return 0;
          // Waking (at least) INT_MAX waiters is defined to mean wake all callers.
          // For Atomics.notify() API Infinity is to be passed in that case.
          if (count >= 2147483647) count = Infinity;
      
          // See if main thread is waiting on this address? If so, wake it up by resetting its wake location to zero.
          // Note that this is not a fair procedure, since we always wake main thread first before any workers, so
          // this scheme does not adhere to real queue-based waiting.
          assert(__emscripten_main_thread_futex > 0);
          var mainThreadWaitAddress = Atomics.load(HEAP32, __emscripten_main_thread_futex >> 2);
          var mainThreadWoken = 0;
          if (mainThreadWaitAddress == addr) {
            // We only use __emscripten_main_thread_futex on the main browser thread, where we
            // cannot block while we wait. Therefore we should only see it set from
            // other threads, and not on the main thread itself. In other words, the
            // main thread must never try to wake itself up!
            assert(!ENVIRONMENT_IS_WEB);
            var loadedAddr = Atomics.compareExchange(HEAP32, __emscripten_main_thread_futex >> 2, mainThreadWaitAddress, 0);
            if (loadedAddr == mainThreadWaitAddress) {
              --count;
              mainThreadWoken = 1;
              if (count <= 0) return 1;
            }
          }
      
          // Wake any workers waiting on this address.
          var ret = Atomics.notify(HEAP32, addr >> 2, count);
          if (ret >= 0) return ret + mainThreadWoken;
          throw 'Atomics.notify returned an unexpected value ' + ret;
        }
      Module["_emscripten_futex_wake"] = _emscripten_futex_wake;
      
      function killThread(pthread_ptr) {
          if (ENVIRONMENT_IS_PTHREAD) throw 'Internal Error! killThread() can only ever be called from main application thread!';
          if (!pthread_ptr) throw 'Internal Error! Null pthread_ptr in killThread!';
          HEAP32[(((pthread_ptr)+(8))>>2)] = 0;
          var pthread = PThread.pthreads[pthread_ptr];
          delete PThread.pthreads[pthread_ptr];
          pthread.worker.terminate();
          PThread.freeThreadData(pthread);
          // The worker was completely nuked (not just the pthread execution it was hosting), so remove it from running workers
          // but don't put it back to the pool.
          PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(pthread.worker), 1); // Not a running Worker anymore.
          pthread.worker.pthread = undefined;
        }
      
      function cancelThread(pthread_ptr) {
          if (ENVIRONMENT_IS_PTHREAD) throw 'Internal Error! cancelThread() can only ever be called from main application thread!';
          if (!pthread_ptr) throw 'Internal Error! Null pthread_ptr in cancelThread!';
          var pthread = PThread.pthreads[pthread_ptr];
          pthread.worker.postMessage({ 'cmd': 'cancel' });
        }
      
      function cleanupThread(pthread_ptr) {
          if (ENVIRONMENT_IS_PTHREAD) throw 'Internal Error! cleanupThread() can only ever be called from main application thread!';
          if (!pthread_ptr) throw 'Internal Error! Null pthread_ptr in cleanupThread!';
          var pthread = PThread.pthreads[pthread_ptr];
          // If pthread has been removed from this map this also means that pthread_ptr points
          // to already freed data. Such situation may occur in following circumstances:
          // 1. Joining cancelled thread - in such situation it may happen that pthread data will
          //    already be removed by handling 'cancelDone' message.
          // 2. Joining thread from non-main browser thread (this also includes thread running main()
          //    when compiled with `PROXY_TO_PTHREAD`) - in such situation it may happen that following
          //    code flow occur (MB - Main Browser Thread, S1, S2 - Worker Threads):
          //    S2: thread ends, 'exit' message is sent to MB
          //    S1: calls pthread_join(S2), this causes:
          //        a. S2 is marked as detached,
          //        b. 'cleanupThread' message is sent to MB.
          //    MB: handles 'exit' message, as thread is detached, so returnWorkerToPool()
          //        is called and all thread related structs are freed/released.
          //    MB: handles 'cleanupThread' message which calls this function.
          if (pthread) {
            HEAP32[(((pthread_ptr)+(8))>>2)] = 0;
            var worker = pthread.worker;
            PThread.returnWorkerToPool(worker);
          }
        }
      
      function _exit(status) {
          // void _exit(int status);
          // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
          exit(status);
        }
      Module["_exit"] = _exit;
      
      function handleException(e) {
          // Certain exception types we do not treat as errors since they are used for
          // internal control flow.
          // 1. ExitStatus, which is thrown by exit()
          // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
          //    that wish to return to JS event loop.
          if (e instanceof ExitStatus || e == 'unwind') {
            return EXITSTATUS;
          }
          // Anything else is an unexpected exception and we treat it as hard error.
          var toLog = e;
          if (e && typeof e === 'object' && e.stack) {
            toLog = [e, e.stack];
          }
          err('exception thrown: ' + toLog);
          quit_(1, e);
        }
      var PThread = {unusedWorkers:[],runningWorkers:[],tlsInitFunctions:[],initMainThreadBlock:function() {
            assert(!ENVIRONMENT_IS_PTHREAD);
      
          },initRuntime:function(tb) {
      
            // Pass the thread address to the native code where they stored in wasm
            // globals which act as a form of TLS. Global constructors trying
            // to access this value will read the wrong value, but that is UB anyway.
            __emscripten_thread_init(tb, /*isMainBrowserThread=*/!ENVIRONMENT_IS_WORKER, /*isMainRuntimeThread=*/1);
            PThread.mainRuntimeThread = true;
          },initWorker:function() {
          },pthreads:{},threadExitHandlers:[],setExitStatus:function(status) {
            EXITSTATUS = status;
          },terminateAllThreads:function() {
            for (var t in PThread.pthreads) {
              var pthread = PThread.pthreads[t];
              if (pthread && pthread.worker) {
                PThread.returnWorkerToPool(pthread.worker);
              }
            }
            PThread.pthreads = {};
      
            for (var i = 0; i < PThread.unusedWorkers.length; ++i) {
              var worker = PThread.unusedWorkers[i];
              assert(!worker.pthread); // This Worker should not be hosting a pthread at this time.
              worker.terminate();
            }
            PThread.unusedWorkers = [];
      
            for (var i = 0; i < PThread.runningWorkers.length; ++i) {
              var worker = PThread.runningWorkers[i];
              var pthread = worker.pthread;
              assert(pthread, 'This Worker should have a pthread it is executing');
              worker.terminate();
              PThread.freeThreadData(pthread);
            }
            PThread.runningWorkers = [];
          },freeThreadData:function(pthread) {
            if (!pthread) return;
            if (pthread.threadInfoStruct) {
              _free(pthread.threadInfoStruct);
            }
            pthread.threadInfoStruct = 0;
            if (pthread.allocatedOwnStack && pthread.stackBase) _free(pthread.stackBase);
            pthread.stackBase = 0;
            if (pthread.worker) pthread.worker.pthread = null;
          },returnWorkerToPool:function(worker) {
            // We don't want to run main thread queued calls here, since we are doing
            // some operations that leave the worker queue in an invalid state until
            // we are completely done (it would be bad if free() ends up calling a
            // queued pthread_create which looks at the global data structures we are
            // modifying).
            PThread.runWithoutMainThreadQueuedCalls(function() {
              delete PThread.pthreads[worker.pthread.threadInfoStruct];
              //Note: worker is intentionally not terminated so the pool can dynamically grow.
              PThread.unusedWorkers.push(worker);
              PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1); // Not a running Worker anymore
              PThread.freeThreadData(worker.pthread);
              // Detach the worker from the pthread object, and return it to the worker pool as an unused worker.
              worker.pthread = undefined;
            });
          },runWithoutMainThreadQueuedCalls:function(func) {
            assert(PThread.mainRuntimeThread, 'runWithoutMainThreadQueuedCalls must be done on the main runtime thread');
            assert(__emscripten_allow_main_runtime_queued_calls);
            HEAP32[__emscripten_allow_main_runtime_queued_calls >> 2] = 0;
            try {
              func();
            } finally {
              HEAP32[__emscripten_allow_main_runtime_queued_calls >> 2] = 1;
            }
          },receiveObjectTransfer:function(data) {
          },threadInit:function() {
            // Call thread init functions (these are the emscripten_tls_init for each
            // module loaded.
            for (var i in PThread.tlsInitFunctions) {
              PThread.tlsInitFunctions[i]();
            }
          },loadWasmModuleToWorker:function(worker, onFinishedLoading) {
            worker.onmessage = function(e) {
              var d = e['data'];
              var cmd = d['cmd'];
              // Sometimes we need to backproxy events to the calling thread (e.g.
              // HTML5 DOM events handlers such as
              // emscripten_set_mousemove_callback()), so keep track in a globally
              // accessible variable about the thread that initiated the proxying.
              if (worker.pthread) PThread.currentProxiedOperationCallerThread = worker.pthread.threadInfoStruct;
      
              // If this message is intended to a recipient that is not the main thread, forward it to the target thread.
              if (d['targetThread'] && d['targetThread'] != _pthread_self()) {
                var thread = PThread.pthreads[d.targetThread];
                if (thread) {
                  thread.worker.postMessage(e.data, d['transferList']);
                } else {
                  err('Internal error! Worker sent a message "' + cmd + '" to target pthread ' + d['targetThread'] + ', but that thread no longer exists!');
                }
                PThread.currentProxiedOperationCallerThread = undefined;
                return;
              }
      
              if (cmd === 'processQueuedMainThreadWork') {
                // TODO: Must post message to main Emscripten thread in PROXY_TO_WORKER mode.
                _emscripten_main_thread_process_queued_calls();
              } else if (cmd === 'spawnThread') {
                spawnThread(e.data);
              } else if (cmd === 'cleanupThread') {
                cleanupThread(d['thread']);
              } else if (cmd === 'killThread') {
                killThread(d['thread']);
              } else if (cmd === 'cancelThread') {
                cancelThread(d['thread']);
              } else if (cmd === 'loaded') {
                worker.loaded = true;
                if (onFinishedLoading) onFinishedLoading(worker);
                // If this Worker is already pending to start running a thread, launch the thread now
                if (worker.runPthread) {
                  worker.runPthread();
                  delete worker.runPthread;
                }
              } else if (cmd === 'print') {
                out('Thread ' + d['threadId'] + ': ' + d['text']);
              } else if (cmd === 'printErr') {
                err('Thread ' + d['threadId'] + ': ' + d['text']);
              } else if (cmd === 'alert') {
                alert('Thread ' + d['threadId'] + ': ' + d['text']);
              } else if (cmd === 'exit') {
                var detached = worker.pthread && Atomics.load(HEAPU32, (worker.pthread.threadInfoStruct + 60) >> 2);
                if (detached) {
                  PThread.returnWorkerToPool(worker);
                }
              } else if (cmd === 'exitProcess') {
                // A pthread has requested to exit the whole application process (runtime).
                err("exitProcess requested by worker");
                try {
                  _exit(d['returnCode']);
                } catch (e) {
                  handleException(e);
                }
              } else if (cmd === 'cancelDone') {
                PThread.returnWorkerToPool(worker);
              } else if (e.data.target === 'setimmediate') {
                worker.postMessage(e.data); // Worker wants to postMessage() to itself to implement setImmediate() emulation.
              } else if (cmd === 'onAbort') {
                if (Module['onAbort']) {
                  Module['onAbort'](d['arg']);
                }
              } else {
                err("worker sent an unknown command " + cmd);
              }
              PThread.currentProxiedOperationCallerThread = undefined;
            };
      
            worker.onerror = function(e) {
              err('pthread sent an error! ' + e.filename + ':' + e.lineno + ': ' + e.message);
              throw e;
            };
      
            assert(wasmMemory instanceof WebAssembly.Memory, 'WebAssembly memory should have been loaded by now!');
            assert(wasmModule instanceof WebAssembly.Module, 'WebAssembly Module should have been loaded by now!');
      
            // Ask the new worker to load up the Emscripten-compiled page. This is a heavy operation.
            worker.postMessage({
              'cmd': 'load',
              // If the application main .js file was loaded from a Blob, then it is not possible
              // to access the URL of the current script that could be passed to a Web Worker so that
              // it could load up the same file. In that case, developer must either deliver the Blob
              // object in Module['mainScriptUrlOrBlob'], or a URL to it, so that pthread Workers can
              // independently load up the same main application file.
              'urlOrBlob': Module['mainScriptUrlOrBlob']
              ,
              'wasmMemory': wasmMemory,
              'wasmModule': wasmModule,
            });
          },allocateUnusedWorker:function() {
            // Allow HTML module to configure the location where the 'worker.js' file will be loaded from,
            // via Module.locateFile() function. If not specified, then the default URL 'worker.js' relative
            // to the main html file is loaded.
            var pthreadMainJs = locateFile('mine.worker.js');
            PThread.unusedWorkers.push(new Worker(pthreadMainJs));
          },getNewWorker:function() {
            if (PThread.unusedWorkers.length == 0) {
              PThread.allocateUnusedWorker();
              PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
            }
            return PThread.unusedWorkers.pop();
          }};
      function establishStackSpace(stackTop, stackMax) {
          // Set stack limits used by `emscripten/stack.h` function.  These limits are
          // cached in wasm-side globals to make checks as fast as possible.
          _emscripten_stack_set_limits(stackTop, stackMax);
      
          // Call inside wasm module to set up the stack frame for this pthread in wasm module scope
          stackRestore(stackTop);
      
          // Write the stack cookie last, after we have set up the proper bounds and
          // current position of the stack.
          writeStackCookie();
        }
      Module["establishStackSpace"] = establishStackSpace;


      function invokeEntryPoint(ptr, arg) {
          return wasmTable.get(ptr)(arg);
        }
      Module["invokeEntryPoint"] = invokeEntryPoint;

      function jsStackTrace() {
          var error = new Error();
          if (!error.stack) {
            // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
            // so try that as a special-case.
            try {
              throw new Error();
            } catch(e) {
              error = e;
            }
            if (!error.stack) {
              return '(no stack trace available)';
            }
          }
          return error.stack.toString();
        }

      function stackTrace() {
          var js = jsStackTrace();
          if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
          return demangleAll(js);
        }

      function ___assert_fail(condition, filename, line, func) {
          abort('Assertion failed: ' + UTF8ToString(condition) + ', at: ' + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);
        }

      function ___call_main(argc, argv) {
          var returnCode = _main(argc, argv);
          // EXIT_RUNTIME==0 set on command line, keeping main thread alive.
          out('Proxied main thread 0x' + _pthread_self().toString(16) + ' finished with return code ' + returnCode + '. EXIT_RUNTIME=0 set, so keeping main thread alive for asynchronous event operations.');
        }

      var _emscripten_get_now;if (ENVIRONMENT_IS_PTHREAD) {
        _emscripten_get_now = function() { return performance.now() - Module['__performance_now_clock_drift']; };
      } else _emscripten_get_now = function() { return performance.now(); }
      ;
      
      var _emscripten_get_now_is_monotonic = true;  
      function setErrNo(value) {
          HEAP32[((___errno_location())>>2)] = value;
          return value;
        }
      function _clock_gettime(clk_id, tp) {
          // int clock_gettime(clockid_t clk_id, struct timespec *tp);
          var now;
          if (clk_id === 0) {
            now = Date.now();
          } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
            now = _emscripten_get_now();
          } else {
            setErrNo(28);
            return -1;
          }
          HEAP32[((tp)>>2)] = (now/1000)|0; // seconds
          HEAP32[(((tp)+(4))>>2)] = ((now % 1000)*1000*1000)|0; // nanoseconds
          return 0;
        }
      function ___clock_gettime(a0,a1
      ) {
      return _clock_gettime(a0,a1);
      }

      
      function _atexit(func, arg) {
        if (ENVIRONMENT_IS_PTHREAD)
          return _emscripten_proxy_to_main_thread_js(1, 1, func, arg);
        
        
      }
      
      function ___cxa_atexit(a0,a1
      ) {
      return _atexit(a0,a1);
      }

      function ___cxa_thread_atexit(routine, arg) {
          PThread.threadExitHandlers.push(function() { wasmTable.get(routine)(arg); });
        }

      function spawnThread(threadParams) {
          if (ENVIRONMENT_IS_PTHREAD) throw 'Internal Error! spawnThread() can only ever be called from main application thread!';
      
          var worker = PThread.getNewWorker();
      
          if (!worker) {
            // No available workers in the PThread pool.
            return 6;
          }
          if (worker.pthread !== undefined) throw 'Internal error!';
          if (!threadParams.pthread_ptr) throw 'Internal error, no pthread ptr!';
          PThread.runningWorkers.push(worker);
      
          var stackHigh = threadParams.stackBase + threadParams.stackSize;
      
          // Create a pthread info object to represent this thread.
          var pthread = PThread.pthreads[threadParams.pthread_ptr] = {
            worker: worker,
            stackBase: threadParams.stackBase,
            stackSize: threadParams.stackSize,
            allocatedOwnStack: threadParams.allocatedOwnStack,
            // Info area for this thread in Emscripten HEAP (shared)
            threadInfoStruct: threadParams.pthread_ptr
          };
          var tis = pthread.threadInfoStruct >> 2;
          // spawnThread is always called with a zero-initialized thread struct so
          // no need to set any valudes to zero here.
          Atomics.store(HEAPU32, tis + (60 >> 2), threadParams.detached);
          Atomics.store(HEAPU32, tis + (76 >> 2), threadParams.stackSize);
          Atomics.store(HEAPU32, tis + (72 >> 2), stackHigh);
          Atomics.store(HEAPU32, tis + (100 >> 2), threadParams.stackSize);
          Atomics.store(HEAPU32, tis + (100 + 8 >> 2), stackHigh);
          Atomics.store(HEAPU32, tis + (100 + 12 >> 2), threadParams.detached);
      
          worker.pthread = pthread;
          var msg = {
              'cmd': 'run',
              'start_routine': threadParams.startRoutine,
              'arg': threadParams.arg,
              'threadInfoStruct': threadParams.pthread_ptr,
              'stackBase': threadParams.stackBase,
              'stackSize': threadParams.stackSize
          };
          worker.runPthread = function() {
            // Ask the worker to start executing its pthread entry point function.
            msg.time = performance.now();
            worker.postMessage(msg, threadParams.transferList);
          };
          if (worker.loaded) {
            worker.runPthread();
            delete worker.runPthread;
          }
          return 0;
        }
      function ___pthread_create_js(pthread_ptr, attr, start_routine, arg) {
          if (typeof SharedArrayBuffer === 'undefined') {
            err('Current environment does not support SharedArrayBuffer, pthreads are not available!');
            return 6;
          }
      
          // List of JS objects that will transfer ownership to the Worker hosting the thread
          var transferList = [];
          var error = 0;
      
          // Synchronously proxy the thread creation to main thread if possible. If we
          // need to transfer ownership of objects, then proxy asynchronously via
          // postMessage.
          if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
            return _emscripten_sync_run_in_main_thread_4(687865856, pthread_ptr, attr, start_routine, arg);
          }
      
          var stackSize = 0;
          var stackBase = 0;
          // Default thread attr is PTHREAD_CREATE_JOINABLE, i.e. start as not detached.
          var detached = 0;
          // When musl creates C11 threads it passes __ATTRP_C11_THREAD (-1) which
          // treat as if it was NULL.
          if (attr && attr != -1) {
            stackSize = HEAP32[((attr)>>2)];
            // Musl has a convention that the stack size that is stored to the pthread
            // attribute structure is always musl's #define DEFAULT_STACK_SIZE
            // smaller than the actual created stack size. That is, stored stack size
            // of 0 would mean a stack of DEFAULT_STACK_SIZE in size. All musl
            // functions hide this impl detail, and offset the size transparently, so
            // pthread_*() API user does not see this offset when operating with
            // the pthread API. When reading the structure directly on JS side
            // however, we need to offset the size manually here.
            stackSize += 81920 /*DEFAULT_STACK_SIZE*/;
            stackBase = HEAP32[(((attr)+(8))>>2)];
            detached = HEAP32[(((attr)+(12))>>2)] !== 0/*PTHREAD_CREATE_JOINABLE*/;
          } else {
            // According to
            // http://man7.org/linux/man-pages/man3/pthread_create.3.html, default
            // stack size if not specified is 2 MB, so follow that convention.
            stackSize = 2097152;
          }
          // If allocatedOwnStack == true, then the pthread impl maintains the stack allocation.
          var allocatedOwnStack = stackBase == 0;
          if (allocatedOwnStack) {
            // Allocate a stack if the user doesn't want to place the stack in a
            // custom memory area.
            stackBase = _memalign(16, stackSize);
          } else {
            // Musl stores the stack base address assuming stack grows downwards, so
            // adjust it to Emscripten convention that the
            // stack grows upwards instead.
            stackBase -= stackSize;
            assert(stackBase > 0);
          }
      
          var threadParams = {
            stackBase: stackBase,
            stackSize: stackSize,
            allocatedOwnStack: allocatedOwnStack,
            detached: detached,
            startRoutine: start_routine,
            pthread_ptr: pthread_ptr,
            arg: arg,
            transferList: transferList
          };
      
          if (ENVIRONMENT_IS_PTHREAD) {
            // The prepopulated pool of web workers that can host pthreads is stored
            // in the main JS thread. Therefore if a pthread is attempting to spawn a
            // new thread, the thread creation must be deferred to the main JS thread.
            threadParams.cmd = 'spawnThread';
            postMessage(threadParams, transferList);
            // When we defer thread creation this way, we have no way to detect thread
            // creation synchronously today, so we have to assume success and return 0.
            return 0;
          }
      
          // We are the main thread, so we have the pthread warmup pool in this
          // thread and can fire off JS thread creation directly ourselves.
          return spawnThread(threadParams);
        }

      function ___pthread_exit_done() {
          // Called at the end of pthread_exit, either when called explicitly called
          // by programmer, or implicitly when leaving the thread main function.
          //
          // Note: in theory we would like to return any offscreen canvases back to the main thread,
          // but if we ever fetched a rendering context for them that would not be valid, so we don't try.
          postMessage({ 'cmd': 'exit' });
        }

      function ___pthread_exit_run_handlers(status) {
          // Called from pthread_exit, either when called explicitly called
          // by programmer, or implicitly when leaving the thread main function.
      
          while (PThread.threadExitHandlers.length > 0) {
            PThread.threadExitHandlers.pop()();
          }
        }

      function _emscripten_futex_wait(addr, val, timeout) {
          if (addr <= 0 || addr > HEAP8.length || addr&3 != 0) return -28;
          // We can do a normal blocking wait anywhere but on the main browser thread.
          {
            var ret = Atomics.wait(HEAP32, addr >> 2, val, timeout);
            if (ret === 'timed-out') return -73;
            if (ret === 'not-equal') return -6;
            if (ret === 'ok') return 0;
            throw 'Atomics.wait returned an unexpected value ' + ret;
          }
        }
      
      function _emscripten_check_blocking_allowed() {
      
          return; // Blocking in a worker/pthread is fine.
      
        }
      function __emscripten_do_pthread_join(thread, status, block) {
          if (!thread) {
            err('pthread_join attempted on a null thread pointer!');
            return 71;
          }
          if (ENVIRONMENT_IS_PTHREAD && _pthread_self() == thread) {
            err('PThread ' + thread + ' is attempting to join to itself!');
            return 16;
          }
          else if (!ENVIRONMENT_IS_PTHREAD && _emscripten_main_browser_thread_id() == thread) {
            err('Main thread ' + thread + ' is attempting to join to itself!');
            return 16;
          }
          var self = HEAP32[(((thread)+(8))>>2)];
          if (self !== thread) {
            err('pthread_join attempted on thread ' + thread + ', which does not point to a valid thread, or does not exist anymore!');
            return 71;
          }
      
          var detached = Atomics.load(HEAPU32, (thread + 60 ) >> 2);
          if (detached) {
            err('Attempted to join thread ' + thread + ', which was already detached!');
            return 28; // The thread is already detached, can no longer join it!
          }
      
          for (;;) {
            var threadStatus = Atomics.load(HEAPU32, (thread + 0 ) >> 2);
            if (threadStatus == 1) { // Exited?
              if (status) {
                var result = Atomics.load(HEAPU32, (thread + 88 ) >> 2);
                HEAP32[((status)>>2)] = result;
              }
              // Mark the thread as detached.
              Atomics.store(HEAPU32, (thread + 60 ) >> 2, 1);
              if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread);
              else postMessage({ 'cmd': 'cleanupThread', 'thread': thread });
              return 0;
            }
            if (!block) {
              return 10;
            }
            _pthread_testcancel();
            // In main runtime thread (the thread that initialized the Emscripten C
            // runtime and launched main()), assist pthreads in performing operations
            // that they need to access the Emscripten main runtime for.
            if (!ENVIRONMENT_IS_PTHREAD) _emscripten_main_thread_process_queued_calls();
            _emscripten_futex_wait(thread + 0, threadStatus, ENVIRONMENT_IS_PTHREAD ? 100 : 1);
          }
        }
      function ___pthread_join_js(thread, status) {
          return __emscripten_do_pthread_join(thread, status, true);
        }

      function __emscripten_notify_thread_queue(targetThreadId, mainThreadId) {
          if (targetThreadId == mainThreadId) {
            postMessage({'cmd' : 'processQueuedMainThreadWork'});
          } else if (ENVIRONMENT_IS_PTHREAD) {
            postMessage({'targetThread': targetThreadId, 'cmd': 'processThreadQueue'});
          } else {
            var pthread = PThread.pthreads[targetThreadId];
            var worker = pthread && pthread.worker;
            if (!worker) {
              err('Cannot send message to thread with ID ' + targetThreadId + ', unknown thread ID!');
              return /*0*/;
            }
            worker.postMessage({'cmd' : 'processThreadQueue'});
          }
          return 1;
        }

      function _abort() {
          abort();
        }
      function _emscripten_conditional_set_current_thread_status(expectedStatus, newStatus) {
        }




      function _emscripten_memcpy_big(dest, src, num) {
          HEAPU8.copyWithin(dest, src, src + num);
        }

      /** @type{function(number, (number|boolean), ...(number|boolean))} */
      function _emscripten_proxy_to_main_thread_js(index, sync) {
          // Additional arguments are passed after those two, which are the actual
          // function arguments.
          // The serialization buffer contains the number of call params, and then
          // all the args here.
          // We also pass 'sync' to C separately, since C needs to look at it.
          var numCallArgs = arguments.length - 2;
          if (numCallArgs > 20-1) throw 'emscripten_proxy_to_main_thread_js: Too many arguments ' + numCallArgs + ' to proxied function idx=' + index + ', maximum supported is ' + (20-1) + '!';
          // Allocate a buffer, which will be copied by the C code.
          var stack = stackSave();
          // First passed parameter specifies the number of arguments to the function.
          // When BigInt support is enabled, we must handle types in a more complex
          // way, detecting at runtime if a value is a BigInt or not (as we have no
          // type info here). To do that, add a "prefix" before each value that
          // indicates if it is a BigInt, which effectively doubles the number of
          // values we serialize for proxying. TODO: pack this?
          var serializedNumCallArgs = numCallArgs ;
          var args = stackAlloc(serializedNumCallArgs * 8);
          var b = args >> 3;
          for (var i = 0; i < numCallArgs; i++) {
            var arg = arguments[2 + i];
            HEAPF64[b + i] = arg;
          }
          var ret = _emscripten_run_in_main_runtime_thread_js(index, serializedNumCallArgs, args, sync);
          stackRestore(stack);
          return ret;
        }
      
      var _emscripten_receive_on_main_thread_js_callArgs = [];
      function _emscripten_receive_on_main_thread_js(index, numCallArgs, args) {
          _emscripten_receive_on_main_thread_js_callArgs.length = numCallArgs;
          var b = args >> 3;
          for (var i = 0; i < numCallArgs; i++) {
            _emscripten_receive_on_main_thread_js_callArgs[i] = HEAPF64[b + i];
          }
          // Proxied JS library funcs are encoded as positive values, and
          // EM_ASMs as negative values (see include_asm_consts)
          var isEmAsmConst = index < 0;
          var func = !isEmAsmConst ? proxiedFunctionTable[index] : ASM_CONSTS[-index - 1];
          assert(func.length == numCallArgs, 'Call args mismatch in emscripten_receive_on_main_thread_js');
          return func.apply(null, _emscripten_receive_on_main_thread_js_callArgs);
        }

      function abortOnCannotGrowMemory(requestedSize) {
          abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s INITIAL_MEMORY=X  with X higher than the current value ' + HEAP8.length + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
        }
      function _emscripten_resize_heap(requestedSize) {
          HEAPU8.length;
          requestedSize = requestedSize >>> 0;
          abortOnCannotGrowMemory(requestedSize);
        }

      var JSEvents = {inEventHandler:0,removeAllEventListeners:function() {
            for (var i = JSEvents.eventHandlers.length-1; i >= 0; --i) {
              JSEvents._removeHandler(i);
            }
            JSEvents.eventHandlers = [];
            JSEvents.deferredCalls = [];
          },registerRemoveEventListeners:function() {
            if (!JSEvents.removeEventListenersRegistered) {
              JSEvents.removeEventListenersRegistered = true;
            }
          },deferredCalls:[],deferCall:function(targetFunction, precedence, argsList) {
            function arraysHaveEqualContent(arrA, arrB) {
              if (arrA.length != arrB.length) return false;
      
              for (var i in arrA) {
                if (arrA[i] != arrB[i]) return false;
              }
              return true;
            }
            // Test if the given call was already queued, and if so, don't add it again.
            for (var i in JSEvents.deferredCalls) {
              var call = JSEvents.deferredCalls[i];
              if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return;
              }
            }
            JSEvents.deferredCalls.push({
              targetFunction: targetFunction,
              precedence: precedence,
              argsList: argsList
            });
      
            JSEvents.deferredCalls.sort(function(x,y) { return x.precedence < y.precedence; });
          },removeDeferredCalls:function(targetFunction) {
            for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
              if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                JSEvents.deferredCalls.splice(i, 1);
                --i;
              }
            }
          },canPerformEventHandlerRequests:function() {
            return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
          },runDeferredCalls:function() {
            if (!JSEvents.canPerformEventHandlerRequests()) {
              return;
            }
            for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
              var call = JSEvents.deferredCalls[i];
              JSEvents.deferredCalls.splice(i, 1);
              --i;
              call.targetFunction.apply(null, call.argsList);
            }
          },eventHandlers:[],removeAllHandlersOnTarget:function(target, eventTypeString) {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
              if (JSEvents.eventHandlers[i].target == target && 
                (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                 JSEvents._removeHandler(i--);
               }
            }
          },_removeHandler:function(i) {
            var h = JSEvents.eventHandlers[i];
            h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
            JSEvents.eventHandlers.splice(i, 1);
          },registerOrRemoveHandler:function(eventHandler) {
            var jsEventHandler = function jsEventHandler(event) {
              // Increment nesting count for the event handler.
              ++JSEvents.inEventHandler;
              JSEvents.currentEventHandler = eventHandler;
              // Process any old deferred calls the user has placed.
              JSEvents.runDeferredCalls();
              // Process the actual event, calls back to user C code handler.
              eventHandler.handlerFunc(event);
              // Process any new deferred calls that were placed right now from this event handler.
              JSEvents.runDeferredCalls();
              // Out of event handler - restore nesting count.
              --JSEvents.inEventHandler;
            };
            
            if (eventHandler.callbackfunc) {
              eventHandler.eventListenerFunc = jsEventHandler;
              eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
              JSEvents.eventHandlers.push(eventHandler);
              JSEvents.registerRemoveEventListeners();
            } else {
              for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (JSEvents.eventHandlers[i].target == eventHandler.target
                 && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                   JSEvents._removeHandler(i--);
                 }
              }
            }
          },queueEventHandlerOnThread_iiii:function(targetThread, eventHandlerFunc, eventTypeId, eventData, userData) {
            var stackTop = stackSave();
            var varargs = stackAlloc(12);
            HEAP32[((varargs)>>2)] = eventTypeId;
            HEAP32[(((varargs)+(4))>>2)] = eventData;
            HEAP32[(((varargs)+(8))>>2)] = userData;
            __emscripten_call_on_thread(0, targetThread, 637534208, eventHandlerFunc, eventData, varargs);
            stackRestore(stackTop);
          },getTargetThreadForEventCallback:function(targetThread) {
            switch (targetThread) {
              case 1: return 0; // The event callback for the current event should be called on the main browser thread. (0 == don't proxy)
              case 2: return PThread.currentProxiedOperationCallerThread; // The event callback for the current event should be backproxied to the thread that is registering the event.
              default: return targetThread; // The event callback for the current event should be proxied to the given specific thread.
            }
          },getNodeNameForTarget:function(target) {
            if (!target) return '';
            if (target == window) return '#window';
            if (target == screen) return '#screen';
            return (target && target.nodeName) ? target.nodeName : '';
          },fullscreenEnabled:function() {
            return document.fullscreenEnabled
            // Safari 13.0.3 on macOS Catalina 10.15.1 still ships with prefixed webkitFullscreenEnabled.
            // TODO: If Safari at some point ships with unprefixed version, update the version check above.
            || document.webkitFullscreenEnabled
             ;
          }};
      
      function stringToNewUTF8(jsString) {
          var length = lengthBytesUTF8(jsString)+1;
          var cString = _malloc(length);
          stringToUTF8(jsString, cString, length);
          return cString;
        }
      function _emscripten_set_offscreencanvas_size_on_target_thread_js(targetThread, targetCanvas, width, height) {
          var stackTop = stackSave();
          var varargs = stackAlloc(12);
          var targetCanvasPtr = 0;
          if (targetCanvas) {
            targetCanvasPtr = stringToNewUTF8(targetCanvas);
          }
          HEAP32[((varargs)>>2)] = targetCanvasPtr;
          HEAP32[(((varargs)+(4))>>2)] = width;
          HEAP32[(((varargs)+(8))>>2)] = height;
          // Note: If we are also a pthread, the call below could theoretically be done synchronously. However if the target pthread is waiting for a mutex from us, then
          // these two threads will deadlock. At the moment, we'd like to consider that this kind of deadlock would be an Emscripten runtime bug, although if
          // emscripten_set_canvas_element_size() was documented to require running an event in the queue of thread that owns the OffscreenCanvas, then that might be ok.
          // (safer this way however)
          __emscripten_call_on_thread(0, targetThread, 657457152, 0, targetCanvasPtr /* satellite data */, varargs);
          stackRestore(stackTop);
        }
      function _emscripten_set_offscreencanvas_size_on_target_thread(targetThread, targetCanvas, width, height) {
          targetCanvas = targetCanvas ? UTF8ToString(targetCanvas) : '';
          _emscripten_set_offscreencanvas_size_on_target_thread_js(targetThread, targetCanvas, width, height);
        }
      
      function maybeCStringToJsString(cString) {
          // "cString > 2" checks if the input is a number, and isn't of the special
          // values we accept here, EMSCRIPTEN_EVENT_TARGET_* (which map to 0, 1, 2).
          // In other words, if cString > 2 then it's a pointer to a valid place in
          // memory, and points to a C string.
          return cString > 2 ? UTF8ToString(cString) : cString;
        }
      
      var specialHTMLTargets = [0, typeof document !== 'undefined' ? document : 0, typeof window !== 'undefined' ? window : 0];
      function findEventTarget(target) {
          target = maybeCStringToJsString(target);
          var domElement = specialHTMLTargets[target] || (typeof document !== 'undefined' ? document.querySelector(target) : undefined);
          return domElement;
        }
      function findCanvasEventTarget(target) { return findEventTarget(target); }
      function _emscripten_set_canvas_element_size_calling_thread(target, width, height) {
          var canvas = findCanvasEventTarget(target);
          if (!canvas) return -4;
      
          if (canvas.canvasSharedPtr) {
            // N.B. We hold the canvasSharedPtr info structure as the authoritative source for specifying the size of a canvas
            // since the actual canvas size changes are asynchronous if the canvas is owned by an OffscreenCanvas on another thread.
            // Therefore when setting the size, eagerly set the size of the canvas on the calling thread here, though this thread
            // might not be the one that actually ends up specifying the size, but the actual size change may be dispatched
            // as an asynchronous event below.
            HEAP32[((canvas.canvasSharedPtr)>>2)] = width;
            HEAP32[(((canvas.canvasSharedPtr)+(4))>>2)] = height;
          }
      
          if (canvas.offscreenCanvas || !canvas.controlTransferredOffscreen) {
            if (canvas.offscreenCanvas) canvas = canvas.offscreenCanvas;
            var autoResizeViewport = false;
            if (canvas.GLctxObject && canvas.GLctxObject.GLctx) {
              var prevViewport = canvas.GLctxObject.GLctx.getParameter(0xBA2 /* GL_VIEWPORT */);
              // TODO: Perhaps autoResizeViewport should only be true if FBO 0 is currently active?
              autoResizeViewport = (prevViewport[0] === 0 && prevViewport[1] === 0 && prevViewport[2] === canvas.width && prevViewport[3] === canvas.height);
            }
            canvas.width = width;
            canvas.height = height;
            if (autoResizeViewport) {
              // TODO: Add -s CANVAS_RESIZE_SETS_GL_VIEWPORT=0/1 option (default=1). This is commonly done and several graphics engines depend on this,
              // but this can be quite disruptive.
              canvas.GLctxObject.GLctx.viewport(0, 0, width, height);
            }
          } else if (canvas.canvasSharedPtr) {
            var targetThread = HEAP32[(((canvas.canvasSharedPtr)+(8))>>2)];
            _emscripten_set_offscreencanvas_size_on_target_thread(targetThread, target, width, height);
            return 1; // This will have to be done asynchronously
          } else {
            return -4;
          }
          return 0;
        }
      
      
      function _emscripten_set_canvas_element_size_main_thread(target, width, height) {
        if (ENVIRONMENT_IS_PTHREAD)
          return _emscripten_proxy_to_main_thread_js(2, 1, target, width, height);
         return _emscripten_set_canvas_element_size_calling_thread(target, width, height); 
      }
      
      function _emscripten_set_canvas_element_size(target, width, height) {
          var canvas = findCanvasEventTarget(target);
          if (canvas) {
            return _emscripten_set_canvas_element_size_calling_thread(target, width, height);
          } else {
            return _emscripten_set_canvas_element_size_main_thread(target, width, height);
          }
        }
      function _emscripten_set_current_thread_status(newStatus) {
        }

      function _emscripten_set_thread_name(threadId, name) {
        }

      function maybeExit() {
          if (!keepRuntimeAlive()) {
            try {
              if (ENVIRONMENT_IS_PTHREAD) __emscripten_thread_exit(EXITSTATUS);
              else
              _exit(EXITSTATUS);
            } catch (e) {
              handleException(e);
            }
          }
        }
      function callUserCallback(func, synchronous) {
          if (ABORT) {
            err('user callback triggered after application aborted.  Ignoring.');
            return;
          }
          // For synchronous calls, let any exceptions propagate, and don't let the runtime exit.
          if (synchronous) {
            func();
            return;
          }
          try {
            func();
            if (ENVIRONMENT_IS_PTHREAD)
              maybeExit();
          } catch (e) {
            handleException(e);
          }
        }
      
      function runtimeKeepalivePush() {
          runtimeKeepaliveCounter += 1;
        }
      
      function runtimeKeepalivePop() {
          assert(runtimeKeepaliveCounter > 0);
          runtimeKeepaliveCounter -= 1;
        }
      function _emscripten_set_timeout(cb, msecs, userData) {
          runtimeKeepalivePush();
          return setTimeout(function() {
            runtimeKeepalivePop();
            callUserCallback(function() {
              wasmTable.get(cb)(userData);
            });
          }, msecs);
        }

      function _emscripten_unwind_to_js_event_loop() {
          throw 'unwind';
        }

      function __webgl_enable_ANGLE_instanced_arrays(ctx) {
          // Extension available in WebGL 1 from Firefox 26 and Google Chrome 30 onwards. Core feature in WebGL 2.
          var ext = ctx.getExtension('ANGLE_instanced_arrays');
          if (ext) {
            ctx['vertexAttribDivisor'] = function(index, divisor) { ext['vertexAttribDivisorANGLE'](index, divisor); };
            ctx['drawArraysInstanced'] = function(mode, first, count, primcount) { ext['drawArraysInstancedANGLE'](mode, first, count, primcount); };
            ctx['drawElementsInstanced'] = function(mode, count, type, indices, primcount) { ext['drawElementsInstancedANGLE'](mode, count, type, indices, primcount); };
            return 1;
          }
        }
      
      function __webgl_enable_OES_vertex_array_object(ctx) {
          // Extension available in WebGL 1 from Firefox 25 and WebKit 536.28/desktop Safari 6.0.3 onwards. Core feature in WebGL 2.
          var ext = ctx.getExtension('OES_vertex_array_object');
          if (ext) {
            ctx['createVertexArray'] = function() { return ext['createVertexArrayOES'](); };
            ctx['deleteVertexArray'] = function(vao) { ext['deleteVertexArrayOES'](vao); };
            ctx['bindVertexArray'] = function(vao) { ext['bindVertexArrayOES'](vao); };
            ctx['isVertexArray'] = function(vao) { return ext['isVertexArrayOES'](vao); };
            return 1;
          }
        }
      
      function __webgl_enable_WEBGL_draw_buffers(ctx) {
          // Extension available in WebGL 1 from Firefox 28 onwards. Core feature in WebGL 2.
          var ext = ctx.getExtension('WEBGL_draw_buffers');
          if (ext) {
            ctx['drawBuffers'] = function(n, bufs) { ext['drawBuffersWEBGL'](n, bufs); };
            return 1;
          }
        }
      
      function __webgl_enable_WEBGL_multi_draw(ctx) {
          // Closure is expected to be allowed to minify the '.multiDrawWebgl' property, so not accessing it quoted.
          return !!(ctx.multiDrawWebgl = ctx.getExtension('WEBGL_multi_draw'));
        }
      var GL = {counter:1,buffers:[],programs:[],framebuffers:[],renderbuffers:[],textures:[],shaders:[],vaos:[],contexts:{},offscreenCanvases:{},queries:[],stringCache:{},unpackAlignment:4,recordError:function recordError(errorCode) {
            if (!GL.lastError) {
              GL.lastError = errorCode;
            }
          },getNewId:function(table) {
            var ret = GL.counter++;
            for (var i = table.length; i < ret; i++) {
              table[i] = null;
            }
            return ret;
          },getSource:function(shader, count, string, length) {
            var source = '';
            for (var i = 0; i < count; ++i) {
              var len = length ? HEAP32[(((length)+(i*4))>>2)] : -1;
              source += UTF8ToString(HEAP32[(((string)+(i*4))>>2)], len < 0 ? undefined : len);
            }
            return source;
          },createContext:function(canvas, webGLContextAttributes) {
      
            // BUG: Workaround Safari WebGL issue: After successfully acquiring WebGL context on a canvas,
            // calling .getContext() will always return that context independent of which 'webgl' or 'webgl2'
            // context version was passed. See https://bugs.webkit.org/show_bug.cgi?id=222758 and
            // https://github.com/emscripten-core/emscripten/issues/13295.
            // TODO: Once the bug is fixed and shipped in Safari, adjust the Safari version field in above check.
            if (!canvas.getContextSafariWebGL2Fixed) {
              canvas.getContextSafariWebGL2Fixed = canvas.getContext;
              canvas.getContext = function(ver, attrs) {
                var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
                return ((ver == 'webgl') == (gl instanceof WebGLRenderingContext)) ? gl : null;
              };
            }
      
            var ctx = 
              (canvas.getContext("webgl", webGLContextAttributes)
                // https://caniuse.com/#feat=webgl
                );
      
            if (!ctx) return 0;
      
            var handle = GL.registerContext(ctx, webGLContextAttributes);
      
            return handle;
          },registerContext:function(ctx, webGLContextAttributes) {
            // with pthreads a context is a location in memory with some synchronized data between threads
            var handle = _malloc(8);
            HEAP32[(((handle)+(4))>>2)] = _pthread_self(); // the thread pointer of the thread that owns the control of the context
      
            var context = {
              handle: handle,
              attributes: webGLContextAttributes,
              version: webGLContextAttributes.majorVersion,
              GLctx: ctx
            };
      
            // Store the created context object so that we can access the context given a canvas without having to pass the parameters again.
            if (ctx.canvas) ctx.canvas.GLctxObject = context;
            GL.contexts[handle] = context;
            if (typeof webGLContextAttributes.enableExtensionsByDefault === 'undefined' || webGLContextAttributes.enableExtensionsByDefault) {
              GL.initExtensions(context);
            }
      
            return handle;
          },makeContextCurrent:function(contextHandle) {
      
            GL.currentContext = GL.contexts[contextHandle]; // Active Emscripten GL layer context object.
            Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx; // Active WebGL context object.
            return !(contextHandle && !GLctx);
          },getContext:function(contextHandle) {
            return GL.contexts[contextHandle];
          },deleteContext:function(contextHandle) {
            if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
            if (typeof JSEvents === 'object') JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas); // Release all JS event handlers on the DOM element that the GL context is associated with since the context is now deleted.
            if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined; // Make sure the canvas object no longer refers to the context object so there are no GC surprises.
            _free(GL.contexts[contextHandle].handle);
            GL.contexts[contextHandle] = null;
          },initExtensions:function(context) {
            // If this function is called without a specific context object, init the extensions of the currently active context.
            if (!context) context = GL.currentContext;
      
            if (context.initExtensionsDone) return;
            context.initExtensionsDone = true;
      
            var GLctx = context.GLctx;
      
            // Detect the presence of a few extensions manually, this GL interop layer itself will need to know if they exist.
      
            // Extensions that are only available in WebGL 1 (the calls will be no-ops if called on a WebGL 2 context active)
            __webgl_enable_ANGLE_instanced_arrays(GLctx);
            __webgl_enable_OES_vertex_array_object(GLctx);
            __webgl_enable_WEBGL_draw_buffers(GLctx);
      
            {
              GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
            }
      
            __webgl_enable_WEBGL_multi_draw(GLctx);
      
            // .getSupportedExtensions() can return null if context is lost, so coerce to empty array.
            var exts = GLctx.getSupportedExtensions() || [];
            exts.forEach(function(ext) {
              // WEBGL_lose_context, WEBGL_debug_renderer_info and WEBGL_debug_shaders are not enabled by default.
              if (!ext.includes('lose_context') && !ext.includes('debug')) {
                // Call .getExtension() to enable that extension permanently.
                GLctx.getExtension(ext);
              }
            });
          }};
      
      var __emscripten_webgl_power_preferences = ['default', 'low-power', 'high-performance'];
      function _emscripten_webgl_do_create_context(target, attributes) {
          assert(attributes);
          var a = attributes >> 2;
          var powerPreference = HEAP32[a + (24>>2)];
          var contextAttributes = {
            'alpha': !!HEAP32[a + (0>>2)],
            'depth': !!HEAP32[a + (4>>2)],
            'stencil': !!HEAP32[a + (8>>2)],
            'antialias': !!HEAP32[a + (12>>2)],
            'premultipliedAlpha': !!HEAP32[a + (16>>2)],
            'preserveDrawingBuffer': !!HEAP32[a + (20>>2)],
            'powerPreference': __emscripten_webgl_power_preferences[powerPreference],
            'failIfMajorPerformanceCaveat': !!HEAP32[a + (28>>2)],
            // The following are not predefined WebGL context attributes in the WebGL specification, so the property names can be minified by Closure.
            majorVersion: HEAP32[a + (32>>2)],
            minorVersion: HEAP32[a + (36>>2)],
            enableExtensionsByDefault: HEAP32[a + (40>>2)],
            explicitSwapControl: HEAP32[a + (44>>2)],
            proxyContextToMainThread: HEAP32[a + (48>>2)],
            renderViaOffscreenBackBuffer: HEAP32[a + (52>>2)]
          };
      
          var canvas = findCanvasEventTarget(target);
      
          if (!canvas) {
            return 0;
          }
      
          if (contextAttributes.explicitSwapControl) {
            return 0;
          }
      
          var contextHandle = GL.createContext(canvas, contextAttributes);
          return contextHandle;
        }
      function _emscripten_webgl_create_context(a0,a1
      ) {
      return _emscripten_webgl_do_create_context(a0,a1);
      }

      var ENV = {};
      
      function getExecutableName() {
          return thisProgram || './this.program';
        }
      function getEnvStrings() {
          if (!getEnvStrings.strings) {
            // Default values.
            // Browser language detection #8751
            var lang = ((typeof navigator === 'object' && navigator.languages && navigator.languages[0]) || 'C').replace('-', '_') + '.UTF-8';
            var env = {
              'USER': 'web_user',
              'LOGNAME': 'web_user',
              'PATH': '/',
              'PWD': '/',
              'HOME': '/home/web_user',
              'LANG': lang,
              '_': getExecutableName()
            };
            // Apply the user-provided values, if any.
            for (var x in ENV) {
              // x is a key in ENV; if ENV[x] is undefined, that means it was
              // explicitly set to be so. We allow user code to do that to
              // force variables with default values to remain unset.
              if (ENV[x] === undefined) delete env[x];
              else env[x] = ENV[x];
            }
            var strings = [];
            for (var x in env) {
              strings.push(x + '=' + env[x]);
            }
            getEnvStrings.strings = strings;
          }
          return getEnvStrings.strings;
        }
      
      var PATH = {splitPath:function(filename) {
            var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
            return splitPathRe.exec(filename).slice(1);
          },normalizeArray:function(parts, allowAboveRoot) {
            // if the path tries to go above the root, `up` ends up > 0
            var up = 0;
            for (var i = parts.length - 1; i >= 0; i--) {
              var last = parts[i];
              if (last === '.') {
                parts.splice(i, 1);
              } else if (last === '..') {
                parts.splice(i, 1);
                up++;
              } else if (up) {
                parts.splice(i, 1);
                up--;
              }
            }
            // if the path is allowed to go above the root, restore leading ..s
            if (allowAboveRoot) {
              for (; up; up--) {
                parts.unshift('..');
              }
            }
            return parts;
          },normalize:function(path) {
            var isAbsolute = path.charAt(0) === '/',
                trailingSlash = path.substr(-1) === '/';
            // Normalize the path
            path = PATH.normalizeArray(path.split('/').filter(function(p) {
              return !!p;
            }), !isAbsolute).join('/');
            if (!path && !isAbsolute) {
              path = '.';
            }
            if (path && trailingSlash) {
              path += '/';
            }
            return (isAbsolute ? '/' : '') + path;
          },dirname:function(path) {
            var result = PATH.splitPath(path),
                root = result[0],
                dir = result[1];
            if (!root && !dir) {
              // No dirname whatsoever
              return '.';
            }
            if (dir) {
              // It has a dirname, strip trailing slash
              dir = dir.substr(0, dir.length - 1);
            }
            return root + dir;
          },basename:function(path) {
            // EMSCRIPTEN return '/'' for '/', not an empty string
            if (path === '/') return '/';
            path = PATH.normalize(path);
            path = path.replace(/\/$/, "");
            var lastSlash = path.lastIndexOf('/');
            if (lastSlash === -1) return path;
            return path.substr(lastSlash+1);
          },extname:function(path) {
            return PATH.splitPath(path)[3];
          },join:function() {
            var paths = Array.prototype.slice.call(arguments, 0);
            return PATH.normalize(paths.join('/'));
          },join2:function(l, r) {
            return PATH.normalize(l + '/' + r);
          }};
      
      function getRandomDevice() {
          if (typeof crypto === 'object' && typeof crypto['getRandomValues'] === 'function') {
            // for modern web browsers
            var randomBuffer = new Uint8Array(1);
            return function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
          } else
          // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
          return function() { abort("no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };"); };
        }
      
      var PATH_FS = {resolve:function() {
            var resolvedPath = '',
              resolvedAbsolute = false;
            for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
              var path = (i >= 0) ? arguments[i] : FS.cwd();
              // Skip empty and invalid entries
              if (typeof path !== 'string') {
                throw new TypeError('Arguments to path.resolve must be strings');
              } else if (!path) {
                return ''; // an invalid portion invalidates the whole thing
              }
              resolvedPath = path + '/' + resolvedPath;
              resolvedAbsolute = path.charAt(0) === '/';
            }
            // At this point the path should be resolved to a full absolute path, but
            // handle relative paths to be safe (might happen when process.cwd() fails)
            resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
              return !!p;
            }), !resolvedAbsolute).join('/');
            return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
          },relative:function(from, to) {
            from = PATH_FS.resolve(from).substr(1);
            to = PATH_FS.resolve(to).substr(1);
            function trim(arr) {
              var start = 0;
              for (; start < arr.length; start++) {
                if (arr[start] !== '') break;
              }
              var end = arr.length - 1;
              for (; end >= 0; end--) {
                if (arr[end] !== '') break;
              }
              if (start > end) return [];
              return arr.slice(start, end - start + 1);
            }
            var fromParts = trim(from.split('/'));
            var toParts = trim(to.split('/'));
            var length = Math.min(fromParts.length, toParts.length);
            var samePartsLength = length;
            for (var i = 0; i < length; i++) {
              if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
              }
            }
            var outputParts = [];
            for (var i = samePartsLength; i < fromParts.length; i++) {
              outputParts.push('..');
            }
            outputParts = outputParts.concat(toParts.slice(samePartsLength));
            return outputParts.join('/');
          }};
      
      var TTY = {ttys:[],init:function () {
            // https://github.com/emscripten-core/emscripten/pull/1555
            // if (ENVIRONMENT_IS_NODE) {
            //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
            //   // device, it always assumes it's a TTY device. because of this, we're forcing
            //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
            //   // with text files until FS.init can be refactored.
            //   process['stdin']['setEncoding']('utf8');
            // }
          },shutdown:function() {
            // https://github.com/emscripten-core/emscripten/pull/1555
            // if (ENVIRONMENT_IS_NODE) {
            //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
            //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
            //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
            //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
            //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
            //   process['stdin']['pause']();
            // }
          },register:function(dev, ops) {
            TTY.ttys[dev] = { input: [], output: [], ops: ops };
            FS.registerDevice(dev, TTY.stream_ops);
          },stream_ops:{open:function(stream) {
              var tty = TTY.ttys[stream.node.rdev];
              if (!tty) {
                throw new FS.ErrnoError(43);
              }
              stream.tty = tty;
              stream.seekable = false;
            },close:function(stream) {
              // flush any pending line data
              stream.tty.ops.flush(stream.tty);
            },flush:function(stream) {
              stream.tty.ops.flush(stream.tty);
            },read:function(stream, buffer, offset, length, pos /* ignored */) {
              if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60);
              }
              var bytesRead = 0;
              for (var i = 0; i < length; i++) {
                var result;
                try {
                  result = stream.tty.ops.get_char(stream.tty);
                } catch (e) {
                  throw new FS.ErrnoError(29);
                }
                if (result === undefined && bytesRead === 0) {
                  throw new FS.ErrnoError(6);
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset+i] = result;
              }
              if (bytesRead) {
                stream.node.timestamp = Date.now();
              }
              return bytesRead;
            },write:function(stream, buffer, offset, length, pos) {
              if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60);
              }
              try {
                for (var i = 0; i < length; i++) {
                  stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
                }
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (length) {
                stream.node.timestamp = Date.now();
              }
              return i;
            }},default_tty_ops:{get_char:function(tty) {
              if (!tty.input.length) {
                var result = null;
                if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                  // Browser.
                  result = window.prompt('Input: ');  // returns null on cancel
                  if (result !== null) {
                    result += '\n';
                  }
                } else if (typeof readline == 'function') {
                  // Command line.
                  result = readline();
                  if (result !== null) {
                    result += '\n';
                  }
                }
                if (!result) {
                  return null;
                }
                tty.input = intArrayFromString(result, true);
              }
              return tty.input.shift();
            },put_char:function(tty, val) {
              if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
              } else {
                if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
              }
            },flush:function(tty) {
              if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
              }
            }},default_tty1_ops:{put_char:function(tty, val) {
              if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
              } else {
                if (val != 0) tty.output.push(val);
              }
            },flush:function(tty) {
              if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
              }
            }}};
      
      function zeroMemory(address, size) {
          HEAPU8.fill(0, address, address + size);
        }
      
      function alignMemory(size, alignment) {
          assert(alignment, "alignment argument is required");
          return Math.ceil(size / alignment) * alignment;
        }
      function mmapAlloc(size) {
          size = alignMemory(size, 65536);
          var ptr = _memalign(65536, size);
          if (!ptr) return 0;
          zeroMemory(ptr, size);
          return ptr;
        }
      var MEMFS = {ops_table:null,mount:function(mount) {
            return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
          },createNode:function(parent, name, mode, dev) {
            if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
              // no supported
              throw new FS.ErrnoError(63);
            }
            if (!MEMFS.ops_table) {
              MEMFS.ops_table = {
                dir: {
                  node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    lookup: MEMFS.node_ops.lookup,
                    mknod: MEMFS.node_ops.mknod,
                    rename: MEMFS.node_ops.rename,
                    unlink: MEMFS.node_ops.unlink,
                    rmdir: MEMFS.node_ops.rmdir,
                    readdir: MEMFS.node_ops.readdir,
                    symlink: MEMFS.node_ops.symlink
                  },
                  stream: {
                    llseek: MEMFS.stream_ops.llseek
                  }
                },
                file: {
                  node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr
                  },
                  stream: {
                    llseek: MEMFS.stream_ops.llseek,
                    read: MEMFS.stream_ops.read,
                    write: MEMFS.stream_ops.write,
                    allocate: MEMFS.stream_ops.allocate,
                    mmap: MEMFS.stream_ops.mmap,
                    msync: MEMFS.stream_ops.msync
                  }
                },
                link: {
                  node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    readlink: MEMFS.node_ops.readlink
                  },
                  stream: {}
                },
                chrdev: {
                  node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr
                  },
                  stream: FS.chrdev_stream_ops
                }
              };
            }
            var node = FS.createNode(parent, name, mode, dev);
            if (FS.isDir(node.mode)) {
              node.node_ops = MEMFS.ops_table.dir.node;
              node.stream_ops = MEMFS.ops_table.dir.stream;
              node.contents = {};
            } else if (FS.isFile(node.mode)) {
              node.node_ops = MEMFS.ops_table.file.node;
              node.stream_ops = MEMFS.ops_table.file.stream;
              node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
              // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
              // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
              // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
              node.contents = null; 
            } else if (FS.isLink(node.mode)) {
              node.node_ops = MEMFS.ops_table.link.node;
              node.stream_ops = MEMFS.ops_table.link.stream;
            } else if (FS.isChrdev(node.mode)) {
              node.node_ops = MEMFS.ops_table.chrdev.node;
              node.stream_ops = MEMFS.ops_table.chrdev.stream;
            }
            node.timestamp = Date.now();
            // add the new node to the parent
            if (parent) {
              parent.contents[name] = node;
              parent.timestamp = node.timestamp;
            }
            return node;
          },getFileDataAsTypedArray:function(node) {
            if (!node.contents) return new Uint8Array(0);
            if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
            return new Uint8Array(node.contents);
          },expandFileStorage:function(node, newCapacity) {
            var prevCapacity = node.contents ? node.contents.length : 0;
            if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
            // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
            // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
            // avoid overshooting the allocation cap by a very large margin.
            var CAPACITY_DOUBLING_MAX = 1024 * 1024;
            newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
            if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
            var oldContents = node.contents;
            node.contents = new Uint8Array(newCapacity); // Allocate new storage.
            if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          },resizeFileStorage:function(node, newSize) {
            if (node.usedBytes == newSize) return;
            if (newSize == 0) {
              node.contents = null; // Fully decommit when requesting a resize to zero.
              node.usedBytes = 0;
            } else {
              var oldContents = node.contents;
              node.contents = new Uint8Array(newSize); // Allocate new storage.
              if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
              }
              node.usedBytes = newSize;
            }
          },node_ops:{getattr:function(node) {
              var attr = {};
              // device numbers reuse inode numbers.
              attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
              attr.ino = node.id;
              attr.mode = node.mode;
              attr.nlink = 1;
              attr.uid = 0;
              attr.gid = 0;
              attr.rdev = node.rdev;
              if (FS.isDir(node.mode)) {
                attr.size = 4096;
              } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes;
              } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length;
              } else {
                attr.size = 0;
              }
              attr.atime = new Date(node.timestamp);
              attr.mtime = new Date(node.timestamp);
              attr.ctime = new Date(node.timestamp);
              // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
              //       but this is not required by the standard.
              attr.blksize = 4096;
              attr.blocks = Math.ceil(attr.size / attr.blksize);
              return attr;
            },setattr:function(node, attr) {
              if (attr.mode !== undefined) {
                node.mode = attr.mode;
              }
              if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp;
              }
              if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size);
              }
            },lookup:function(parent, name) {
              throw FS.genericErrors[44];
            },mknod:function(parent, name, mode, dev) {
              return MEMFS.createNode(parent, name, mode, dev);
            },rename:function(old_node, new_dir, new_name) {
              // if we're overwriting a directory at new_name, make sure it's empty.
              if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                  new_node = FS.lookupNode(new_dir, new_name);
                } catch (e) {
                }
                if (new_node) {
                  for (var i in new_node.contents) {
                    throw new FS.ErrnoError(55);
                  }
                }
              }
              // do the internal rewiring
              delete old_node.parent.contents[old_node.name];
              old_node.parent.timestamp = Date.now();
              old_node.name = new_name;
              new_dir.contents[new_name] = old_node;
              new_dir.timestamp = old_node.parent.timestamp;
              old_node.parent = new_dir;
            },unlink:function(parent, name) {
              delete parent.contents[name];
              parent.timestamp = Date.now();
            },rmdir:function(parent, name) {
              var node = FS.lookupNode(parent, name);
              for (var i in node.contents) {
                throw new FS.ErrnoError(55);
              }
              delete parent.contents[name];
              parent.timestamp = Date.now();
            },readdir:function(node) {
              var entries = ['.', '..'];
              for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                  continue;
                }
                entries.push(key);
              }
              return entries;
            },symlink:function(parent, newname, oldpath) {
              var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
              node.link = oldpath;
              return node;
            },readlink:function(node) {
              if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28);
              }
              return node.link;
            }},stream_ops:{read:function(stream, buffer, offset, length, position) {
              var contents = stream.node.contents;
              if (position >= stream.node.usedBytes) return 0;
              var size = Math.min(stream.node.usedBytes - position, length);
              assert(size >= 0);
              if (size > 8 && contents.subarray) { // non-trivial, and typed array
                buffer.set(contents.subarray(position, position + size), offset);
              } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
              }
              return size;
            },write:function(stream, buffer, offset, length, position, canOwn) {
              // The data buffer should be a typed array view
              assert(!(buffer instanceof ArrayBuffer));
      
              if (!length) return 0;
              var node = stream.node;
              node.timestamp = Date.now();
      
              if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
                if (canOwn) {
                  assert(position === 0, 'canOwn must imply no weird position inside the file');
                  node.contents = buffer.subarray(offset, offset + length);
                  node.usedBytes = length;
                  return length;
                } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
                  node.contents = buffer.slice(offset, offset + length);
                  node.usedBytes = length;
                  return length;
                } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
                  node.contents.set(buffer.subarray(offset, offset + length), position);
                  return length;
                }
              }
      
              // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
              MEMFS.expandFileStorage(node, position+length);
              if (node.contents.subarray && buffer.subarray) {
                // Use typed array write which is available.
                node.contents.set(buffer.subarray(offset, offset + length), position);
              } else {
                for (var i = 0; i < length; i++) {
                 node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
                }
              }
              node.usedBytes = Math.max(node.usedBytes, position + length);
              return length;
            },llseek:function(stream, offset, whence) {
              var position = offset;
              if (whence === 1) {
                position += stream.position;
              } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                  position += stream.node.usedBytes;
                }
              }
              if (position < 0) {
                throw new FS.ErrnoError(28);
              }
              return position;
            },allocate:function(stream, offset, length) {
              MEMFS.expandFileStorage(stream.node, offset + length);
              stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
            },mmap:function(stream, address, length, position, prot, flags) {
              if (address !== 0) {
                // We don't currently support location hints for the address of the mapping
                throw new FS.ErrnoError(28);
              }
              if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43);
              }
              var ptr;
              var allocated;
              var contents = stream.node.contents;
              // Only make a new copy when MAP_PRIVATE is specified.
              if (!(flags & 2) && contents.buffer === buffer) {
                // We can't emulate MAP_SHARED when the file is not backed by the buffer
                // we're mapping to (e.g. the HEAP buffer).
                allocated = false;
                ptr = contents.byteOffset;
              } else {
                // Try to avoid unnecessary slices.
                if (position > 0 || position + length < contents.length) {
                  if (contents.subarray) {
                    contents = contents.subarray(position, position + length);
                  } else {
                    contents = Array.prototype.slice.call(contents, position, position + length);
                  }
                }
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                  throw new FS.ErrnoError(48);
                }
                HEAP8.set(contents, ptr);
              }
              return { ptr: ptr, allocated: allocated };
            },msync:function(stream, buffer, offset, length, mmapFlags) {
              if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43);
              }
              if (mmapFlags & 2) {
                // MAP_PRIVATE calls need not to be synced back to underlying fs
                return 0;
              }
      
              MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
              // should we check if bytesWritten and length are the same?
              return 0;
            }}};
      
      function asyncLoad(url, onload, onerror, noRunDep) {
          var dep = !noRunDep ? getUniqueRunDependency('al ' + url) : '';
          readAsync(url, function(arrayBuffer) {
            assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
            onload(new Uint8Array(arrayBuffer));
            if (dep) removeRunDependency(dep);
          }, function(event) {
            if (onerror) {
              onerror();
            } else {
              throw 'Loading data file "' + url + '" failed.';
            }
          });
          if (dep) addRunDependency(dep);
        }
      
      var ERRNO_MESSAGES = {0:"Success",1:"Arg list too long",2:"Permission denied",3:"Address already in use",4:"Address not available",5:"Address family not supported by protocol family",6:"No more processes",7:"Socket already connected",8:"Bad file number",9:"Trying to read unreadable message",10:"Mount device busy",11:"Operation canceled",12:"No children",13:"Connection aborted",14:"Connection refused",15:"Connection reset by peer",16:"File locking deadlock error",17:"Destination address required",18:"Math arg out of domain of func",19:"Quota exceeded",20:"File exists",21:"Bad address",22:"File too large",23:"Host is unreachable",24:"Identifier removed",25:"Illegal byte sequence",26:"Connection already in progress",27:"Interrupted system call",28:"Invalid argument",29:"I/O error",30:"Socket is already connected",31:"Is a directory",32:"Too many symbolic links",33:"Too many open files",34:"Too many links",35:"Message too long",36:"Multihop attempted",37:"File or path name too long",38:"Network interface is not configured",39:"Connection reset by network",40:"Network is unreachable",41:"Too many open files in system",42:"No buffer space available",43:"No such device",44:"No such file or directory",45:"Exec format error",46:"No record locks available",47:"The link has been severed",48:"Not enough core",49:"No message of desired type",50:"Protocol not available",51:"No space left on device",52:"Function not implemented",53:"Socket is not connected",54:"Not a directory",55:"Directory not empty",56:"State not recoverable",57:"Socket operation on non-socket",59:"Not a typewriter",60:"No such device or address",61:"Value too large for defined data type",62:"Previous owner died",63:"Not super-user",64:"Broken pipe",65:"Protocol error",66:"Unknown protocol",67:"Protocol wrong type for socket",68:"Math result not representable",69:"Read only file system",70:"Illegal seek",71:"No such process",72:"Stale file handle",73:"Connection timed out",74:"Text file busy",75:"Cross-device link",100:"Device not a stream",101:"Bad font file fmt",102:"Invalid slot",103:"Invalid request code",104:"No anode",105:"Block device required",106:"Channel number out of range",107:"Level 3 halted",108:"Level 3 reset",109:"Link number out of range",110:"Protocol driver not attached",111:"No CSI structure available",112:"Level 2 halted",113:"Invalid exchange",114:"Invalid request descriptor",115:"Exchange full",116:"No data (for no delay io)",117:"Timer expired",118:"Out of streams resources",119:"Machine is not on the network",120:"Package not installed",121:"The object is remote",122:"Advertise error",123:"Srmount error",124:"Communication error on send",125:"Cross mount point (not really error)",126:"Given log. name not unique",127:"f.d. invalid for this operation",128:"Remote address changed",129:"Can   access a needed shared lib",130:"Accessing a corrupted shared lib",131:".lib section in a.out corrupted",132:"Attempting to link in too many libs",133:"Attempting to exec a shared library",135:"Streams pipe error",136:"Too many users",137:"Socket type not supported",138:"Not supported",139:"Protocol family not supported",140:"Can't send after socket shutdown",141:"Too many references",142:"Host is down",148:"No medium (in tape drive)",156:"Level 2 not synchronized"};
      
      var ERRNO_CODES = {};
      var FS = {root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,lookupPath:function(path, opts) {
            path = PATH_FS.resolve(FS.cwd(), path);
            opts = opts || {};
      
            if (!path) return { path: '', node: null };
      
            var defaults = {
              follow_mount: true,
              recurse_count: 0
            };
            for (var key in defaults) {
              if (opts[key] === undefined) {
                opts[key] = defaults[key];
              }
            }
      
            if (opts.recurse_count > 8) {  // max recursive lookup of 8
              throw new FS.ErrnoError(32);
            }
      
            // split the path
            var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
              return !!p;
            }), false);
      
            // start at the root
            var current = FS.root;
            var current_path = '/';
      
            for (var i = 0; i < parts.length; i++) {
              var islast = (i === parts.length-1);
              if (islast && opts.parent) {
                // stop resolving
                break;
              }
      
              current = FS.lookupNode(current, parts[i]);
              current_path = PATH.join2(current_path, parts[i]);
      
              // jump to the mount's root node if this is a mountpoint
              if (FS.isMountpoint(current)) {
                if (!islast || (islast && opts.follow_mount)) {
                  current = current.mounted.root;
                }
              }
      
              // by default, lookupPath will not follow a symlink if it is the final path component.
              // setting opts.follow = true will override this behavior.
              if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                  var link = FS.readlink(current_path);
                  current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
      
                  var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
                  current = lookup.node;
      
                  if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                    throw new FS.ErrnoError(32);
                  }
                }
              }
            }
      
            return { path: current_path, node: current };
          },getPath:function(node) {
            var path;
            while (true) {
              if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
              }
              path = path ? node.name + '/' + path : node.name;
              node = node.parent;
            }
          },hashName:function(parentid, name) {
            var hash = 0;
      
            for (var i = 0; i < name.length; i++) {
              hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
            }
            return ((parentid + hash) >>> 0) % FS.nameTable.length;
          },hashAddNode:function(node) {
            var hash = FS.hashName(node.parent.id, node.name);
            node.name_next = FS.nameTable[hash];
            FS.nameTable[hash] = node;
          },hashRemoveNode:function(node) {
            var hash = FS.hashName(node.parent.id, node.name);
            if (FS.nameTable[hash] === node) {
              FS.nameTable[hash] = node.name_next;
            } else {
              var current = FS.nameTable[hash];
              while (current) {
                if (current.name_next === node) {
                  current.name_next = node.name_next;
                  break;
                }
                current = current.name_next;
              }
            }
          },lookupNode:function(parent, name) {
            var errCode = FS.mayLookup(parent);
            if (errCode) {
              throw new FS.ErrnoError(errCode, parent);
            }
            var hash = FS.hashName(parent.id, name);
            for (var node = FS.nameTable[hash]; node; node = node.name_next) {
              var nodeName = node.name;
              if (node.parent.id === parent.id && nodeName === name) {
                return node;
              }
            }
            // if we failed to find it in the cache, call into the VFS
            return FS.lookup(parent, name);
          },createNode:function(parent, name, mode, rdev) {
            assert(typeof parent === 'object');
            var node = new FS.FSNode(parent, name, mode, rdev);
      
            FS.hashAddNode(node);
      
            return node;
          },destroyNode:function(node) {
            FS.hashRemoveNode(node);
          },isRoot:function(node) {
            return node === node.parent;
          },isMountpoint:function(node) {
            return !!node.mounted;
          },isFile:function(mode) {
            return (mode & 61440) === 32768;
          },isDir:function(mode) {
            return (mode & 61440) === 16384;
          },isLink:function(mode) {
            return (mode & 61440) === 40960;
          },isChrdev:function(mode) {
            return (mode & 61440) === 8192;
          },isBlkdev:function(mode) {
            return (mode & 61440) === 24576;
          },isFIFO:function(mode) {
            return (mode & 61440) === 4096;
          },isSocket:function(mode) {
            return (mode & 49152) === 49152;
          },flagModes:{"r":0,"r+":2,"w":577,"w+":578,"a":1089,"a+":1090},modeStringToFlags:function(str) {
            var flags = FS.flagModes[str];
            if (typeof flags === 'undefined') {
              throw new Error('Unknown file open mode: ' + str);
            }
            return flags;
          },flagsToPermissionString:function(flag) {
            var perms = ['r', 'w', 'rw'][flag & 3];
            if ((flag & 512)) {
              perms += 'w';
            }
            return perms;
          },nodePermissions:function(node, perms) {
            if (FS.ignorePermissions) {
              return 0;
            }
            // return 0 if any user, group or owner bits are set.
            if (perms.includes('r') && !(node.mode & 292)) {
              return 2;
            } else if (perms.includes('w') && !(node.mode & 146)) {
              return 2;
            } else if (perms.includes('x') && !(node.mode & 73)) {
              return 2;
            }
            return 0;
          },mayLookup:function(dir) {
            var errCode = FS.nodePermissions(dir, 'x');
            if (errCode) return errCode;
            if (!dir.node_ops.lookup) return 2;
            return 0;
          },mayCreate:function(dir, name) {
            try {
              var node = FS.lookupNode(dir, name);
              return 20;
            } catch (e) {
            }
            return FS.nodePermissions(dir, 'wx');
          },mayDelete:function(dir, name, isdir) {
            var node;
            try {
              node = FS.lookupNode(dir, name);
            } catch (e) {
              return e.errno;
            }
            var errCode = FS.nodePermissions(dir, 'wx');
            if (errCode) {
              return errCode;
            }
            if (isdir) {
              if (!FS.isDir(node.mode)) {
                return 54;
              }
              if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10;
              }
            } else {
              if (FS.isDir(node.mode)) {
                return 31;
              }
            }
            return 0;
          },mayOpen:function(node, flags) {
            if (!node) {
              return 44;
            }
            if (FS.isLink(node.mode)) {
              return 32;
            } else if (FS.isDir(node.mode)) {
              if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
                  (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
                return 31;
              }
            }
            return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
          },MAX_OPEN_FDS:4096,nextfd:function(fd_start, fd_end) {
            fd_start = fd_start || 0;
            fd_end = fd_end || FS.MAX_OPEN_FDS;
            for (var fd = fd_start; fd <= fd_end; fd++) {
              if (!FS.streams[fd]) {
                return fd;
              }
            }
            throw new FS.ErrnoError(33);
          },getStream:function(fd) {
            return FS.streams[fd];
          },createStream:function(stream, fd_start, fd_end) {
            if (!FS.FSStream) {
              FS.FSStream = /** @constructor */ function(){};
              FS.FSStream.prototype = {
                object: {
                  get: function() { return this.node; },
                  set: function(val) { this.node = val; }
                },
                isRead: {
                  get: function() { return (this.flags & 2097155) !== 1; }
                },
                isWrite: {
                  get: function() { return (this.flags & 2097155) !== 0; }
                },
                isAppend: {
                  get: function() { return (this.flags & 1024); }
                }
              };
            }
            // clone it, so we can return an instance of FSStream
            var newStream = new FS.FSStream();
            for (var p in stream) {
              newStream[p] = stream[p];
            }
            stream = newStream;
            var fd = FS.nextfd(fd_start, fd_end);
            stream.fd = fd;
            FS.streams[fd] = stream;
            return stream;
          },closeStream:function(fd) {
            FS.streams[fd] = null;
          },chrdev_stream_ops:{open:function(stream) {
              var device = FS.getDevice(stream.node.rdev);
              // override node's stream ops with the device's
              stream.stream_ops = device.stream_ops;
              // forward the open call
              if (stream.stream_ops.open) {
                stream.stream_ops.open(stream);
              }
            },llseek:function() {
              throw new FS.ErrnoError(70);
            }},major:function(dev) {
            return ((dev) >> 8);
          },minor:function(dev) {
            return ((dev) & 0xff);
          },makedev:function(ma, mi) {
            return ((ma) << 8 | (mi));
          },registerDevice:function(dev, ops) {
            FS.devices[dev] = { stream_ops: ops };
          },getDevice:function(dev) {
            return FS.devices[dev];
          },getMounts:function(mount) {
            var mounts = [];
            var check = [mount];
      
            while (check.length) {
              var m = check.pop();
      
              mounts.push(m);
      
              check.push.apply(check, m.mounts);
            }
      
            return mounts;
          },syncfs:function(populate, callback) {
            if (typeof(populate) === 'function') {
              callback = populate;
              populate = false;
            }
      
            FS.syncFSRequests++;
      
            if (FS.syncFSRequests > 1) {
              err('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
            }
      
            var mounts = FS.getMounts(FS.root.mount);
            var completed = 0;
      
            function doCallback(errCode) {
              assert(FS.syncFSRequests > 0);
              FS.syncFSRequests--;
              return callback(errCode);
            }
      
            function done(errCode) {
              if (errCode) {
                if (!done.errored) {
                  done.errored = true;
                  return doCallback(errCode);
                }
                return;
              }
              if (++completed >= mounts.length) {
                doCallback(null);
              }
            }  
            // sync all mounts
            mounts.forEach(function (mount) {
              if (!mount.type.syncfs) {
                return done(null);
              }
              mount.type.syncfs(mount, populate, done);
            });
          },mount:function(type, opts, mountpoint) {
            if (typeof type === 'string') {
              // The filesystem was not included, and instead we have an error
              // message stored in the variable.
              throw type;
            }
            var root = mountpoint === '/';
            var pseudo = !mountpoint;
            var node;
      
            if (root && FS.root) {
              throw new FS.ErrnoError(10);
            } else if (!root && !pseudo) {
              var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
      
              mountpoint = lookup.path;  // use the absolute path
              node = lookup.node;
      
              if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10);
              }
      
              if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54);
              }
            }
      
            var mount = {
              type: type,
              opts: opts,
              mountpoint: mountpoint,
              mounts: []
            };
      
            // create a root node for the fs
            var mountRoot = type.mount(mount);
            mountRoot.mount = mount;
            mount.root = mountRoot;
      
            if (root) {
              FS.root = mountRoot;
            } else if (node) {
              // set as a mountpoint
              node.mounted = mount;
      
              // add the new mount to the current mount's children
              if (node.mount) {
                node.mount.mounts.push(mount);
              }
            }
      
            return mountRoot;
          },unmount:function (mountpoint) {
            var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
      
            if (!FS.isMountpoint(lookup.node)) {
              throw new FS.ErrnoError(28);
            }
      
            // destroy the nodes for this mount, and all its child mounts
            var node = lookup.node;
            var mount = node.mounted;
            var mounts = FS.getMounts(mount);
      
            Object.keys(FS.nameTable).forEach(function (hash) {
              var current = FS.nameTable[hash];
      
              while (current) {
                var next = current.name_next;
      
                if (mounts.includes(current.mount)) {
                  FS.destroyNode(current);
                }
      
                current = next;
              }
            });
      
            // no longer a mountpoint
            node.mounted = null;
      
            // remove this mount from the child mounts
            var idx = node.mount.mounts.indexOf(mount);
            assert(idx !== -1);
            node.mount.mounts.splice(idx, 1);
          },lookup:function(parent, name) {
            return parent.node_ops.lookup(parent, name);
          },mknod:function(path, mode, dev) {
            var lookup = FS.lookupPath(path, { parent: true });
            var parent = lookup.node;
            var name = PATH.basename(path);
            if (!name || name === '.' || name === '..') {
              throw new FS.ErrnoError(28);
            }
            var errCode = FS.mayCreate(parent, name);
            if (errCode) {
              throw new FS.ErrnoError(errCode);
            }
            if (!parent.node_ops.mknod) {
              throw new FS.ErrnoError(63);
            }
            return parent.node_ops.mknod(parent, name, mode, dev);
          },create:function(path, mode) {
            mode = mode !== undefined ? mode : 438 /* 0666 */;
            mode &= 4095;
            mode |= 32768;
            return FS.mknod(path, mode, 0);
          },mkdir:function(path, mode) {
            mode = mode !== undefined ? mode : 511 /* 0777 */;
            mode &= 511 | 512;
            mode |= 16384;
            return FS.mknod(path, mode, 0);
          },mkdirTree:function(path, mode) {
            var dirs = path.split('/');
            var d = '';
            for (var i = 0; i < dirs.length; ++i) {
              if (!dirs[i]) continue;
              d += '/' + dirs[i];
              try {
                FS.mkdir(d, mode);
              } catch(e) {
                if (e.errno != 20) throw e;
              }
            }
          },mkdev:function(path, mode, dev) {
            if (typeof(dev) === 'undefined') {
              dev = mode;
              mode = 438 /* 0666 */;
            }
            mode |= 8192;
            return FS.mknod(path, mode, dev);
          },symlink:function(oldpath, newpath) {
            if (!PATH_FS.resolve(oldpath)) {
              throw new FS.ErrnoError(44);
            }
            var lookup = FS.lookupPath(newpath, { parent: true });
            var parent = lookup.node;
            if (!parent) {
              throw new FS.ErrnoError(44);
            }
            var newname = PATH.basename(newpath);
            var errCode = FS.mayCreate(parent, newname);
            if (errCode) {
              throw new FS.ErrnoError(errCode);
            }
            if (!parent.node_ops.symlink) {
              throw new FS.ErrnoError(63);
            }
            return parent.node_ops.symlink(parent, newname, oldpath);
          },rename:function(old_path, new_path) {
            var old_dirname = PATH.dirname(old_path);
            var new_dirname = PATH.dirname(new_path);
            var old_name = PATH.basename(old_path);
            var new_name = PATH.basename(new_path);
            // parents must exist
            var lookup, old_dir, new_dir;
      
            // let the errors from non existant directories percolate up
            lookup = FS.lookupPath(old_path, { parent: true });
            old_dir = lookup.node;
            lookup = FS.lookupPath(new_path, { parent: true });
            new_dir = lookup.node;
      
            if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
            // need to be part of the same mount
            if (old_dir.mount !== new_dir.mount) {
              throw new FS.ErrnoError(75);
            }
            // source must exist
            var old_node = FS.lookupNode(old_dir, old_name);
            // old path should not be an ancestor of the new path
            var relative = PATH_FS.relative(old_path, new_dirname);
            if (relative.charAt(0) !== '.') {
              throw new FS.ErrnoError(28);
            }
            // new path should not be an ancestor of the old path
            relative = PATH_FS.relative(new_path, old_dirname);
            if (relative.charAt(0) !== '.') {
              throw new FS.ErrnoError(55);
            }
            // see if the new path already exists
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
              // not fatal
            }
            // early out if nothing needs to change
            if (old_node === new_node) {
              return;
            }
            // we'll need to delete the old entry
            var isdir = FS.isDir(old_node.mode);
            var errCode = FS.mayDelete(old_dir, old_name, isdir);
            if (errCode) {
              throw new FS.ErrnoError(errCode);
            }
            // need delete permissions if we'll be overwriting.
            // need create permissions if new doesn't already exist.
            errCode = new_node ?
              FS.mayDelete(new_dir, new_name, isdir) :
              FS.mayCreate(new_dir, new_name);
            if (errCode) {
              throw new FS.ErrnoError(errCode);
            }
            if (!old_dir.node_ops.rename) {
              throw new FS.ErrnoError(63);
            }
            if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
              throw new FS.ErrnoError(10);
            }
            // if we are going to change the parent, check write permissions
            if (new_dir !== old_dir) {
              errCode = FS.nodePermissions(old_dir, 'w');
              if (errCode) {
                throw new FS.ErrnoError(errCode);
              }
            }
            try {
              if (FS.trackingDelegate['willMovePath']) ;
            } catch(e) {
              err("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
            }
            // remove the node from the lookup hash
            FS.hashRemoveNode(old_node);
            // do the underlying fs rename
            try {
              old_dir.node_ops.rename(old_node, new_dir, new_name);
            } catch (e) {
              throw e;
            } finally {
              // add the node back to the hash (in case node_ops.rename
              // changed its name)
              FS.hashAddNode(old_node);
            }
            try {
              if (FS.trackingDelegate['onMovePath']) ;
            } catch(e) {
              err("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
            }
          },rmdir:function(path) {
            var lookup = FS.lookupPath(path, { parent: true });
            var parent = lookup.node;
            var name = PATH.basename(path);
            var node = FS.lookupNode(parent, name);
            var errCode = FS.mayDelete(parent, name, true);
            if (errCode) {
              throw new FS.ErrnoError(errCode);
            }
            if (!parent.node_ops.rmdir) {
              throw new FS.ErrnoError(63);
            }
            if (FS.isMountpoint(node)) {
              throw new FS.ErrnoError(10);
            }
            try {
              if (FS.trackingDelegate['willDeletePath']) ;
            } catch(e) {
              err("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
            }
            parent.node_ops.rmdir(parent, name);
            FS.destroyNode(node);
            try {
              if (FS.trackingDelegate['onDeletePath']) ;
            } catch(e) {
              err("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
            }
          },readdir:function(path) {
            var lookup = FS.lookupPath(path, { follow: true });
            var node = lookup.node;
            if (!node.node_ops.readdir) {
              throw new FS.ErrnoError(54);
            }
            return node.node_ops.readdir(node);
          },unlink:function(path) {
            var lookup = FS.lookupPath(path, { parent: true });
            var parent = lookup.node;
            var name = PATH.basename(path);
            var node = FS.lookupNode(parent, name);
            var errCode = FS.mayDelete(parent, name, false);
            if (errCode) {
              // According to POSIX, we should map EISDIR to EPERM, but
              // we instead do what Linux does (and we must, as we use
              // the musl linux libc).
              throw new FS.ErrnoError(errCode);
            }
            if (!parent.node_ops.unlink) {
              throw new FS.ErrnoError(63);
            }
            if (FS.isMountpoint(node)) {
              throw new FS.ErrnoError(10);
            }
            try {
              if (FS.trackingDelegate['willDeletePath']) ;
            } catch(e) {
              err("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
            }
            parent.node_ops.unlink(parent, name);
            FS.destroyNode(node);
            try {
              if (FS.trackingDelegate['onDeletePath']) ;
            } catch(e) {
              err("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
            }
          },readlink:function(path) {
            var lookup = FS.lookupPath(path);
            var link = lookup.node;
            if (!link) {
              throw new FS.ErrnoError(44);
            }
            if (!link.node_ops.readlink) {
              throw new FS.ErrnoError(28);
            }
            return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
          },stat:function(path, dontFollow) {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            var node = lookup.node;
            if (!node) {
              throw new FS.ErrnoError(44);
            }
            if (!node.node_ops.getattr) {
              throw new FS.ErrnoError(63);
            }
            return node.node_ops.getattr(node);
          },lstat:function(path) {
            return FS.stat(path, true);
          },chmod:function(path, mode, dontFollow) {
            var node;
            if (typeof path === 'string') {
              var lookup = FS.lookupPath(path, { follow: !dontFollow });
              node = lookup.node;
            } else {
              node = path;
            }
            if (!node.node_ops.setattr) {
              throw new FS.ErrnoError(63);
            }
            node.node_ops.setattr(node, {
              mode: (mode & 4095) | (node.mode & ~4095),
              timestamp: Date.now()
            });
          },lchmod:function(path, mode) {
            FS.chmod(path, mode, true);
          },fchmod:function(fd, mode) {
            var stream = FS.getStream(fd);
            if (!stream) {
              throw new FS.ErrnoError(8);
            }
            FS.chmod(stream.node, mode);
          },chown:function(path, uid, gid, dontFollow) {
            var node;
            if (typeof path === 'string') {
              var lookup = FS.lookupPath(path, { follow: !dontFollow });
              node = lookup.node;
            } else {
              node = path;
            }
            if (!node.node_ops.setattr) {
              throw new FS.ErrnoError(63);
            }
            node.node_ops.setattr(node, {
              timestamp: Date.now()
              // we ignore the uid / gid for now
            });
          },lchown:function(path, uid, gid) {
            FS.chown(path, uid, gid, true);
          },fchown:function(fd, uid, gid) {
            var stream = FS.getStream(fd);
            if (!stream) {
              throw new FS.ErrnoError(8);
            }
            FS.chown(stream.node, uid, gid);
          },truncate:function(path, len) {
            if (len < 0) {
              throw new FS.ErrnoError(28);
            }
            var node;
            if (typeof path === 'string') {
              var lookup = FS.lookupPath(path, { follow: true });
              node = lookup.node;
            } else {
              node = path;
            }
            if (!node.node_ops.setattr) {
              throw new FS.ErrnoError(63);
            }
            if (FS.isDir(node.mode)) {
              throw new FS.ErrnoError(31);
            }
            if (!FS.isFile(node.mode)) {
              throw new FS.ErrnoError(28);
            }
            var errCode = FS.nodePermissions(node, 'w');
            if (errCode) {
              throw new FS.ErrnoError(errCode);
            }
            node.node_ops.setattr(node, {
              size: len,
              timestamp: Date.now()
            });
          },ftruncate:function(fd, len) {
            var stream = FS.getStream(fd);
            if (!stream) {
              throw new FS.ErrnoError(8);
            }
            if ((stream.flags & 2097155) === 0) {
              throw new FS.ErrnoError(28);
            }
            FS.truncate(stream.node, len);
          },utime:function(path, atime, mtime) {
            var lookup = FS.lookupPath(path, { follow: true });
            var node = lookup.node;
            node.node_ops.setattr(node, {
              timestamp: Math.max(atime, mtime)
            });
          },open:function(path, flags, mode, fd_start, fd_end) {
            if (path === "") {
              throw new FS.ErrnoError(44);
            }
            flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
            mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
            if ((flags & 64)) {
              mode = (mode & 4095) | 32768;
            } else {
              mode = 0;
            }
            var node;
            if (typeof path === 'object') {
              node = path;
            } else {
              path = PATH.normalize(path);
              try {
                var lookup = FS.lookupPath(path, {
                  follow: !(flags & 131072)
                });
                node = lookup.node;
              } catch (e) {
                // ignore
              }
            }
            // perhaps we need to create the node
            var created = false;
            if ((flags & 64)) {
              if (node) {
                // if O_CREAT and O_EXCL are set, error out if the node already exists
                if ((flags & 128)) {
                  throw new FS.ErrnoError(20);
                }
              } else {
                // node doesn't exist, try to create it
                node = FS.mknod(path, mode, 0);
                created = true;
              }
            }
            if (!node) {
              throw new FS.ErrnoError(44);
            }
            // can't truncate a device
            if (FS.isChrdev(node.mode)) {
              flags &= ~512;
            }
            // if asked only for a directory, then this must be one
            if ((flags & 65536) && !FS.isDir(node.mode)) {
              throw new FS.ErrnoError(54);
            }
            // check permissions, if this is not a file we just created now (it is ok to
            // create and write to a file with read-only permissions; it is read-only
            // for later use)
            if (!created) {
              var errCode = FS.mayOpen(node, flags);
              if (errCode) {
                throw new FS.ErrnoError(errCode);
              }
            }
            // do truncation if necessary
            if ((flags & 512)) {
              FS.truncate(node, 0);
            }
            // we've already handled these, don't pass down to the underlying vfs
            flags &= ~(128 | 512 | 131072);
      
            // register the stream with the filesystem
            var stream = FS.createStream({
              node: node,
              path: FS.getPath(node),  // we want the absolute path to the node
              flags: flags,
              seekable: true,
              position: 0,
              stream_ops: node.stream_ops,
              // used by the file family libc calls (fopen, fwrite, ferror, etc.)
              ungotten: [],
              error: false
            }, fd_start, fd_end);
            // call the new stream's open function
            if (stream.stream_ops.open) {
              stream.stream_ops.open(stream);
            }
            if (Module['logReadFiles'] && !(flags & 1)) {
              if (!FS.readFiles) FS.readFiles = {};
              if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                err("FS.trackingDelegate error on read file: " + path);
              }
            }
            try {
              var trackingFlags; if (FS.trackingDelegate['onOpenFile']) ;
            } catch(e) {
              err("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
            }
            return stream;
          },close:function(stream) {
            if (FS.isClosed(stream)) {
              throw new FS.ErrnoError(8);
            }
            if (stream.getdents) stream.getdents = null; // free readdir state
            try {
              if (stream.stream_ops.close) {
                stream.stream_ops.close(stream);
              }
            } catch (e) {
              throw e;
            } finally {
              FS.closeStream(stream.fd);
            }
            stream.fd = null;
          },isClosed:function(stream) {
            return stream.fd === null;
          },llseek:function(stream, offset, whence) {
            if (FS.isClosed(stream)) {
              throw new FS.ErrnoError(8);
            }
            if (!stream.seekable || !stream.stream_ops.llseek) {
              throw new FS.ErrnoError(70);
            }
            if (whence != 0 && whence != 1 && whence != 2) {
              throw new FS.ErrnoError(28);
            }
            stream.position = stream.stream_ops.llseek(stream, offset, whence);
            stream.ungotten = [];
            return stream.position;
          },read:function(stream, buffer, offset, length, position) {
            if (length < 0 || position < 0) {
              throw new FS.ErrnoError(28);
            }
            if (FS.isClosed(stream)) {
              throw new FS.ErrnoError(8);
            }
            if ((stream.flags & 2097155) === 1) {
              throw new FS.ErrnoError(8);
            }
            if (FS.isDir(stream.node.mode)) {
              throw new FS.ErrnoError(31);
            }
            if (!stream.stream_ops.read) {
              throw new FS.ErrnoError(28);
            }
            var seeking = typeof position !== 'undefined';
            if (!seeking) {
              position = stream.position;
            } else if (!stream.seekable) {
              throw new FS.ErrnoError(70);
            }
            var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
            if (!seeking) stream.position += bytesRead;
            return bytesRead;
          },write:function(stream, buffer, offset, length, position, canOwn) {
            if (length < 0 || position < 0) {
              throw new FS.ErrnoError(28);
            }
            if (FS.isClosed(stream)) {
              throw new FS.ErrnoError(8);
            }
            if ((stream.flags & 2097155) === 0) {
              throw new FS.ErrnoError(8);
            }
            if (FS.isDir(stream.node.mode)) {
              throw new FS.ErrnoError(31);
            }
            if (!stream.stream_ops.write) {
              throw new FS.ErrnoError(28);
            }
            if (stream.seekable && stream.flags & 1024) {
              // seek to the end before writing in append mode
              FS.llseek(stream, 0, 2);
            }
            var seeking = typeof position !== 'undefined';
            if (!seeking) {
              position = stream.position;
            } else if (!stream.seekable) {
              throw new FS.ErrnoError(70);
            }
            var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
            if (!seeking) stream.position += bytesWritten;
            try {
              if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
            } catch(e) {
              err("FS.trackingDelegate['onWriteToFile']('"+stream.path+"') threw an exception: " + e.message);
            }
            return bytesWritten;
          },allocate:function(stream, offset, length) {
            if (FS.isClosed(stream)) {
              throw new FS.ErrnoError(8);
            }
            if (offset < 0 || length <= 0) {
              throw new FS.ErrnoError(28);
            }
            if ((stream.flags & 2097155) === 0) {
              throw new FS.ErrnoError(8);
            }
            if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
              throw new FS.ErrnoError(43);
            }
            if (!stream.stream_ops.allocate) {
              throw new FS.ErrnoError(138);
            }
            stream.stream_ops.allocate(stream, offset, length);
          },mmap:function(stream, address, length, position, prot, flags) {
            // User requests writing to file (prot & PROT_WRITE != 0).
            // Checking if we have permissions to write to the file unless
            // MAP_PRIVATE flag is set. According to POSIX spec it is possible
            // to write to file opened in read-only mode with MAP_PRIVATE flag,
            // as all modifications will be visible only in the memory of
            // the current process.
            if ((prot & 2) !== 0
                && (flags & 2) === 0
                && (stream.flags & 2097155) !== 2) {
              throw new FS.ErrnoError(2);
            }
            if ((stream.flags & 2097155) === 1) {
              throw new FS.ErrnoError(2);
            }
            if (!stream.stream_ops.mmap) {
              throw new FS.ErrnoError(43);
            }
            return stream.stream_ops.mmap(stream, address, length, position, prot, flags);
          },msync:function(stream, buffer, offset, length, mmapFlags) {
            if (!stream || !stream.stream_ops.msync) {
              return 0;
            }
            return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
          },munmap:function(stream) {
            return 0;
          },ioctl:function(stream, cmd, arg) {
            if (!stream.stream_ops.ioctl) {
              throw new FS.ErrnoError(59);
            }
            return stream.stream_ops.ioctl(stream, cmd, arg);
          },readFile:function(path, opts) {
            opts = opts || {};
            opts.flags = opts.flags || 0;
            opts.encoding = opts.encoding || 'binary';
            if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
              throw new Error('Invalid encoding type "' + opts.encoding + '"');
            }
            var ret;
            var stream = FS.open(path, opts.flags);
            var stat = FS.stat(path);
            var length = stat.size;
            var buf = new Uint8Array(length);
            FS.read(stream, buf, 0, length, 0);
            if (opts.encoding === 'utf8') {
              ret = UTF8ArrayToString(buf, 0);
            } else if (opts.encoding === 'binary') {
              ret = buf;
            }
            FS.close(stream);
            return ret;
          },writeFile:function(path, data, opts) {
            opts = opts || {};
            opts.flags = opts.flags || 577;
            var stream = FS.open(path, opts.flags, opts.mode);
            if (typeof data === 'string') {
              var buf = new Uint8Array(lengthBytesUTF8(data)+1);
              var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
              FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
            } else if (ArrayBuffer.isView(data)) {
              FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
            } else {
              throw new Error('Unsupported data type');
            }
            FS.close(stream);
          },cwd:function() {
            return FS.currentPath;
          },chdir:function(path) {
            var lookup = FS.lookupPath(path, { follow: true });
            if (lookup.node === null) {
              throw new FS.ErrnoError(44);
            }
            if (!FS.isDir(lookup.node.mode)) {
              throw new FS.ErrnoError(54);
            }
            var errCode = FS.nodePermissions(lookup.node, 'x');
            if (errCode) {
              throw new FS.ErrnoError(errCode);
            }
            FS.currentPath = lookup.path;
          },createDefaultDirectories:function() {
            FS.mkdir('/tmp');
            FS.mkdir('/home');
            FS.mkdir('/home/web_user');
          },createDefaultDevices:function() {
            // create /dev
            FS.mkdir('/dev');
            // setup /dev/null
            FS.registerDevice(FS.makedev(1, 3), {
              read: function() { return 0; },
              write: function(stream, buffer, offset, length, pos) { return length; }
            });
            FS.mkdev('/dev/null', FS.makedev(1, 3));
            // setup /dev/tty and /dev/tty1
            // stderr needs to print output using err() rather than out()
            // so we register a second tty just for it.
            TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
            TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
            FS.mkdev('/dev/tty', FS.makedev(5, 0));
            FS.mkdev('/dev/tty1', FS.makedev(6, 0));
            // setup /dev/[u]random
            var random_device = getRandomDevice();
            FS.createDevice('/dev', 'random', random_device);
            FS.createDevice('/dev', 'urandom', random_device);
            // we're not going to emulate the actual shm device,
            // just create the tmp dirs that reside in it commonly
            FS.mkdir('/dev/shm');
            FS.mkdir('/dev/shm/tmp');
          },createSpecialDirectories:function() {
            // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
            // name of the stream for fd 6 (see test_unistd_ttyname)
            FS.mkdir('/proc');
            var proc_self = FS.mkdir('/proc/self');
            FS.mkdir('/proc/self/fd');
            FS.mount({
              mount: function() {
                var node = FS.createNode(proc_self, 'fd', 16384 | 511 /* 0777 */, 73);
                node.node_ops = {
                  lookup: function(parent, name) {
                    var fd = +name;
                    var stream = FS.getStream(fd);
                    if (!stream) throw new FS.ErrnoError(8);
                    var ret = {
                      parent: null,
                      mount: { mountpoint: 'fake' },
                      node_ops: { readlink: function() { return stream.path } }
                    };
                    ret.parent = ret; // make it look like a simple root node
                    return ret;
                  }
                };
                return node;
              }
            }, {}, '/proc/self/fd');
          },createStandardStreams:function() {
            // TODO deprecate the old functionality of a single
            // input / output callback and that utilizes FS.createDevice
            // and instead require a unique set of stream ops
      
            // by default, we symlink the standard streams to the
            // default tty devices. however, if the standard streams
            // have been overwritten we create a unique device for
            // them instead.
            if (Module['stdin']) {
              FS.createDevice('/dev', 'stdin', Module['stdin']);
            } else {
              FS.symlink('/dev/tty', '/dev/stdin');
            }
            if (Module['stdout']) {
              FS.createDevice('/dev', 'stdout', null, Module['stdout']);
            } else {
              FS.symlink('/dev/tty', '/dev/stdout');
            }
            if (Module['stderr']) {
              FS.createDevice('/dev', 'stderr', null, Module['stderr']);
            } else {
              FS.symlink('/dev/tty1', '/dev/stderr');
            }
      
            // open default streams for the stdin, stdout and stderr devices
            var stdin = FS.open('/dev/stdin', 0);
            var stdout = FS.open('/dev/stdout', 1);
            var stderr = FS.open('/dev/stderr', 1);
            assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
            assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
            assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
          },ensureErrnoError:function() {
            if (FS.ErrnoError) return;
            FS.ErrnoError = /** @this{Object} */ function ErrnoError(errno, node) {
              this.node = node;
              this.setErrno = /** @this{Object} */ function(errno) {
                this.errno = errno;
                for (var key in ERRNO_CODES) {
                  if (ERRNO_CODES[key] === errno) {
                    this.code = key;
                    break;
                  }
                }
              };
              this.setErrno(errno);
              this.message = ERRNO_MESSAGES[errno];
      
              // Try to get a maximally helpful stack trace. On Node.js, getting Error.stack
              // now ensures it shows what we want.
              if (this.stack) {
                // Define the stack property for Node.js 4, which otherwise errors on the next line.
                Object.defineProperty(this, "stack", { value: (new Error).stack, writable: true });
                this.stack = demangleAll(this.stack);
              }
            };
            FS.ErrnoError.prototype = new Error();
            FS.ErrnoError.prototype.constructor = FS.ErrnoError;
            // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
            [44].forEach(function(code) {
              FS.genericErrors[code] = new FS.ErrnoError(code);
              FS.genericErrors[code].stack = '<generic error, no stack>';
            });
          },staticInit:function() {
            FS.ensureErrnoError();
      
            FS.nameTable = new Array(4096);
      
            FS.mount(MEMFS, {}, '/');
      
            FS.createDefaultDirectories();
            FS.createDefaultDevices();
            FS.createSpecialDirectories();
      
            FS.filesystems = {
              'MEMFS': MEMFS,
            };
          },init:function(input, output, error) {
            assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
            FS.init.initialized = true;
      
            FS.ensureErrnoError();
      
            // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
            Module['stdin'] = input || Module['stdin'];
            Module['stdout'] = output || Module['stdout'];
            Module['stderr'] = error || Module['stderr'];
      
            FS.createStandardStreams();
          },quit:function() {
            FS.init.initialized = false;
            // force-flush all streams, so we get musl std streams printed out
            var fflush = Module['_fflush'];
            if (fflush) fflush(0);
            // close all of our streams
            for (var i = 0; i < FS.streams.length; i++) {
              var stream = FS.streams[i];
              if (!stream) {
                continue;
              }
              FS.close(stream);
            }
          },getMode:function(canRead, canWrite) {
            var mode = 0;
            if (canRead) mode |= 292 | 73;
            if (canWrite) mode |= 146;
            return mode;
          },findObject:function(path, dontResolveLastLink) {
            var ret = FS.analyzePath(path, dontResolveLastLink);
            if (ret.exists) {
              return ret.object;
            } else {
              return null;
            }
          },analyzePath:function(path, dontResolveLastLink) {
            // operate from within the context of the symlink's target
            try {
              var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
              path = lookup.path;
            } catch (e) {
            }
            var ret = {
              isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
              parentExists: false, parentPath: null, parentObject: null
            };
            try {
              var lookup = FS.lookupPath(path, { parent: true });
              ret.parentExists = true;
              ret.parentPath = lookup.path;
              ret.parentObject = lookup.node;
              ret.name = PATH.basename(path);
              lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
              ret.exists = true;
              ret.path = lookup.path;
              ret.object = lookup.node;
              ret.name = lookup.node.name;
              ret.isRoot = lookup.path === '/';
            } catch (e) {
              ret.error = e.errno;
            }        return ret;
          },createPath:function(parent, path, canRead, canWrite) {
            parent = typeof parent === 'string' ? parent : FS.getPath(parent);
            var parts = path.split('/').reverse();
            while (parts.length) {
              var part = parts.pop();
              if (!part) continue;
              var current = PATH.join2(parent, part);
              try {
                FS.mkdir(current);
              } catch (e) {
                // ignore EEXIST
              }
              parent = current;
            }
            return current;
          },createFile:function(parent, name, properties, canRead, canWrite) {
            var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
            var mode = FS.getMode(canRead, canWrite);
            return FS.create(path, mode);
          },createDataFile:function(parent, name, data, canRead, canWrite, canOwn) {
            var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
            var mode = FS.getMode(canRead, canWrite);
            var node = FS.create(path, mode);
            if (data) {
              if (typeof data === 'string') {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr;
              }
              // make sure we can write to the file
              FS.chmod(node, mode | 146);
              var stream = FS.open(node, 577);
              FS.write(stream, data, 0, data.length, 0, canOwn);
              FS.close(stream);
              FS.chmod(node, mode);
            }
            return node;
          },createDevice:function(parent, name, input, output) {
            var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
            var mode = FS.getMode(!!input, !!output);
            if (!FS.createDevice.major) FS.createDevice.major = 64;
            var dev = FS.makedev(FS.createDevice.major++, 0);
            // Create a fake device that a set of stream ops to emulate
            // the old behavior.
            FS.registerDevice(dev, {
              open: function(stream) {
                stream.seekable = false;
              },
              close: function(stream) {
                // flush any pending line data
                if (output && output.buffer && output.buffer.length) {
                  output(10);
                }
              },
              read: function(stream, buffer, offset, length, pos /* ignored */) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                  var result;
                  try {
                    result = input();
                  } catch (e) {
                    throw new FS.ErrnoError(29);
                  }
                  if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6);
                  }
                  if (result === null || result === undefined) break;
                  bytesRead++;
                  buffer[offset+i] = result;
                }
                if (bytesRead) {
                  stream.node.timestamp = Date.now();
                }
                return bytesRead;
              },
              write: function(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                  try {
                    output(buffer[offset+i]);
                  } catch (e) {
                    throw new FS.ErrnoError(29);
                  }
                }
                if (length) {
                  stream.node.timestamp = Date.now();
                }
                return i;
              }
            });
            return FS.mkdev(path, mode, dev);
          },forceLoadFile:function(obj) {
            if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
            if (typeof XMLHttpRequest !== 'undefined') {
              throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
            } else if (read_) {
              // Command-line.
              try {
                // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
                //          read() will try to parse UTF8.
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length;
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            } else {
              throw new Error('Cannot load without read() or XMLHttpRequest.');
            }
          },createLazyFile:function(parent, name, url, canRead, canWrite) {
            // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
            /** @constructor */
            function LazyUint8Array() {
              this.lengthKnown = false;
              this.chunks = []; // Loaded chunks. Index is the chunk number
            }
            LazyUint8Array.prototype.get = /** @this{Object} */ function LazyUint8Array_get(idx) {
              if (idx > this.length-1 || idx < 0) {
                return undefined;
              }
              var chunkOffset = idx % this.chunkSize;
              var chunkNum = (idx / this.chunkSize)|0;
              return this.getter(chunkNum)[chunkOffset];
            };
            LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
              this.getter = getter;
            };
            LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
      
              var chunkSize = 1024*1024; // Chunk size in bytes
      
              if (!hasByteServing) chunkSize = datalength;
      
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
      
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
      
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
      
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
      
              if (usesGzip || !datalength) {
                // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
                chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
                datalength = this.getter(0).length;
                chunkSize = datalength;
                out("LazyFiles on gzip forces download of the whole file when length is accessed");
              }
      
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
            };
            if (typeof XMLHttpRequest !== 'undefined') {
              var lazyArray = new LazyUint8Array();
              Object.defineProperties(lazyArray, {
                length: {
                  get: /** @this{Object} */ function() {
                    if (!this.lengthKnown) {
                      this.cacheLength();
                    }
                    return this._length;
                  }
                },
                chunkSize: {
                  get: /** @this{Object} */ function() {
                    if (!this.lengthKnown) {
                      this.cacheLength();
                    }
                    return this._chunkSize;
                  }
                }
              });
      
              var properties = { isDevice: false, contents: lazyArray };
            } else {
              var properties = { isDevice: false, url: url };
            }
      
            var node = FS.createFile(parent, name, properties, canRead, canWrite);
            // This is a total hack, but I want to get this lazy file code out of the
            // core of MEMFS. If we want to keep this lazy file concept I feel it should
            // be its own thin LAZYFS proxying calls to MEMFS.
            if (properties.contents) {
              node.contents = properties.contents;
            } else if (properties.url) {
              node.contents = null;
              node.url = properties.url;
            }
            // Add a function that defers querying the file size until it is asked the first time.
            Object.defineProperties(node, {
              usedBytes: {
                get: /** @this {FSNode} */ function() { return this.contents.length; }
              }
            });
            // override each stream op with one that tries to force load the lazy file first
            var stream_ops = {};
            var keys = Object.keys(node.stream_ops);
            keys.forEach(function(key) {
              var fn = node.stream_ops[key];
              stream_ops[key] = function forceLoadLazyFile() {
                FS.forceLoadFile(node);
                return fn.apply(null, arguments);
              };
            });
            // use a custom read function
            stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
              FS.forceLoadFile(node);
              var contents = stream.node.contents;
              if (position >= contents.length)
                return 0;
              var size = Math.min(contents.length - position, length);
              assert(size >= 0);
              if (contents.slice) { // normal array
                for (var i = 0; i < size; i++) {
                  buffer[offset + i] = contents[position + i];
                }
              } else {
                for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
                  buffer[offset + i] = contents.get(position + i);
                }
              }
              return size;
            };
            node.stream_ops = stream_ops;
            return node;
          },createPreloadedFile:function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
            Browser.init(); // XXX perhaps this method should move onto Browser?
            // TODO we should allow people to just pass in a complete filename instead
            // of parent and name being that we just join them anyways
            var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
            var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
            function processData(byteArray) {
              function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                  FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
                }
                if (onload) onload();
                removeRunDependency(dep);
              }
              var handled = false;
              Module['preloadPlugins'].forEach(function(plugin) {
                if (handled) return;
                if (plugin['canHandle'](fullname)) {
                  plugin['handle'](byteArray, fullname, finish, function() {
                    if (onerror) onerror();
                    removeRunDependency(dep);
                  });
                  handled = true;
                }
              });
              if (!handled) finish(byteArray);
            }
            addRunDependency(dep);
            if (typeof url == 'string') {
              asyncLoad(url, function(byteArray) {
                processData(byteArray);
              }, onerror);
            } else {
              processData(url);
            }
          },indexedDB:function() {
            return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
          },DB_NAME:function() {
            return 'EM_FS_' + window.location.pathname;
          },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function(paths, onload, onerror) {
            onload = onload || function(){};
            onerror = onerror || function(){};
            var indexedDB = FS.indexedDB();
            try {
              var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
            } catch (e) {
              return onerror(e);
            }
            openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
              out('creating db');
              var db = openRequest.result;
              db.createObjectStore(FS.DB_STORE_NAME);
            };
            openRequest.onsuccess = function openRequest_onsuccess() {
              var db = openRequest.result;
              var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
              var files = transaction.objectStore(FS.DB_STORE_NAME);
              var ok = 0, fail = 0, total = paths.length;
              function finish() {
                if (fail == 0) onload(); else onerror();
              }
              paths.forEach(function(path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish(); };
                putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish(); };
              });
              transaction.onerror = onerror;
            };
            openRequest.onerror = onerror;
          },loadFilesFromDB:function(paths, onload, onerror) {
            onload = onload || function(){};
            onerror = onerror || function(){};
            var indexedDB = FS.indexedDB();
            try {
              var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
            } catch (e) {
              return onerror(e);
            }
            openRequest.onupgradeneeded = onerror; // no database to load from
            openRequest.onsuccess = function openRequest_onsuccess() {
              var db = openRequest.result;
              try {
                var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
              } catch(e) {
                onerror(e);
                return;
              }
              var files = transaction.objectStore(FS.DB_STORE_NAME);
              var ok = 0, fail = 0, total = paths.length;
              function finish() {
                if (fail == 0) onload(); else onerror();
              }
              paths.forEach(function(path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                  if (FS.analyzePath(path).exists) {
                    FS.unlink(path);
                  }
                  FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                  ok++;
                  if (ok + fail == total) finish();
                };
                getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish(); };
              });
              transaction.onerror = onerror;
            };
            openRequest.onerror = onerror;
          },absolutePath:function() {
            abort('FS.absolutePath has been removed; use PATH_FS.resolve instead');
          },createFolder:function() {
            abort('FS.createFolder has been removed; use FS.mkdir instead');
          },createLink:function() {
            abort('FS.createLink has been removed; use FS.symlink instead');
          },joinPath:function() {
            abort('FS.joinPath has been removed; use PATH.join instead');
          },mmapAlloc:function() {
            abort('FS.mmapAlloc has been replaced by the top level function mmapAlloc');
          },standardizePath:function() {
            abort('FS.standardizePath has been removed; use PATH.normalize instead');
          }};
      var SYSCALLS = {mappings:{},DEFAULT_POLLMASK:5,umask:511,calculateAt:function(dirfd, path, allowEmpty) {
            if (path[0] === '/') {
              return path;
            }
            // relative path
            var dir;
            if (dirfd === -100) {
              dir = FS.cwd();
            } else {
              var dirstream = FS.getStream(dirfd);
              if (!dirstream) throw new FS.ErrnoError(8);
              dir = dirstream.path;
            }
            if (path.length == 0) {
              if (!allowEmpty) {
                throw new FS.ErrnoError(44);          }
              return dir;
            }
            return PATH.join2(dir, path);
          },doStat:function(func, path, buf) {
            try {
              var stat = func(path);
            } catch (e) {
              if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                // an error occurred while trying to look up the path; we should just report ENOTDIR
                return -54;
              }
              throw e;
            }
            HEAP32[((buf)>>2)] = stat.dev;
            HEAP32[(((buf)+(4))>>2)] = 0;
            HEAP32[(((buf)+(8))>>2)] = stat.ino;
            HEAP32[(((buf)+(12))>>2)] = stat.mode;
            HEAP32[(((buf)+(16))>>2)] = stat.nlink;
            HEAP32[(((buf)+(20))>>2)] = stat.uid;
            HEAP32[(((buf)+(24))>>2)] = stat.gid;
            HEAP32[(((buf)+(28))>>2)] = stat.rdev;
            HEAP32[(((buf)+(32))>>2)] = 0;
            (tempI64 = [stat.size>>>0,(tempDouble=stat.size,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(40))>>2)] = tempI64[0],HEAP32[(((buf)+(44))>>2)] = tempI64[1]);
            HEAP32[(((buf)+(48))>>2)] = 4096;
            HEAP32[(((buf)+(52))>>2)] = stat.blocks;
            HEAP32[(((buf)+(56))>>2)] = (stat.atime.getTime() / 1000)|0;
            HEAP32[(((buf)+(60))>>2)] = 0;
            HEAP32[(((buf)+(64))>>2)] = (stat.mtime.getTime() / 1000)|0;
            HEAP32[(((buf)+(68))>>2)] = 0;
            HEAP32[(((buf)+(72))>>2)] = (stat.ctime.getTime() / 1000)|0;
            HEAP32[(((buf)+(76))>>2)] = 0;
            (tempI64 = [stat.ino>>>0,(tempDouble=stat.ino,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(80))>>2)] = tempI64[0],HEAP32[(((buf)+(84))>>2)] = tempI64[1]);
            return 0;
          },doMsync:function(addr, stream, len, flags, offset) {
            var buffer = HEAPU8.slice(addr, addr + len);
            FS.msync(stream, buffer, offset, len, flags);
          },doMkdir:function(path, mode) {
            // remove a trailing slash, if one - /a/b/ has basename of '', but
            // we want to create b in the context of this function
            path = PATH.normalize(path);
            if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
            FS.mkdir(path, mode, 0);
            return 0;
          },doMknod:function(path, mode, dev) {
            // we don't want this in the JS API as it uses mknod to create all nodes.
            switch (mode & 61440) {
              case 32768:
              case 8192:
              case 24576:
              case 4096:
              case 49152:
                break;
              default: return -28;
            }
            FS.mknod(path, mode, dev);
            return 0;
          },doReadlink:function(path, buf, bufsize) {
            if (bufsize <= 0) return -28;
            var ret = FS.readlink(path);
      
            var len = Math.min(bufsize, lengthBytesUTF8(ret));
            var endChar = HEAP8[buf+len];
            stringToUTF8(ret, buf, bufsize+1);
            // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
            // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
            HEAP8[buf+len] = endChar;
      
            return len;
          },doAccess:function(path, amode) {
            if (amode & ~7) {
              // need a valid mode
              return -28;
            }
            var node;
            var lookup = FS.lookupPath(path, { follow: true });
            node = lookup.node;
            if (!node) {
              return -44;
            }
            var perms = '';
            if (amode & 4) perms += 'r';
            if (amode & 2) perms += 'w';
            if (amode & 1) perms += 'x';
            if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
              return -2;
            }
            return 0;
          },doDup:function(path, flags, suggestFD) {
            var suggest = FS.getStream(suggestFD);
            if (suggest) FS.close(suggest);
            return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
          },doReadv:function(stream, iov, iovcnt, offset) {
            var ret = 0;
            for (var i = 0; i < iovcnt; i++) {
              var ptr = HEAP32[(((iov)+(i*8))>>2)];
              var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
              var curr = FS.read(stream, HEAP8,ptr, len, offset);
              if (curr < 0) return -1;
              ret += curr;
              if (curr < len) break; // nothing more to read
            }
            return ret;
          },doWritev:function(stream, iov, iovcnt, offset) {
            var ret = 0;
            for (var i = 0; i < iovcnt; i++) {
              var ptr = HEAP32[(((iov)+(i*8))>>2)];
              var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
              var curr = FS.write(stream, HEAP8,ptr, len, offset);
              if (curr < 0) return -1;
              ret += curr;
            }
            return ret;
          },varargs:undefined,get:function() {
            assert(SYSCALLS.varargs != undefined);
            SYSCALLS.varargs += 4;
            var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
            return ret;
          },getStr:function(ptr) {
            var ret = UTF8ToString(ptr);
            return ret;
          },getStreamFromFD:function(fd) {
            var stream = FS.getStream(fd);
            if (!stream) throw new FS.ErrnoError(8);
            return stream;
          },get64:function(low, high) {
            if (low >= 0) assert(high === 0);
            else assert(high === -1);
            return low;
          }};
      
      function _environ_get(__environ, environ_buf) {
        if (ENVIRONMENT_IS_PTHREAD)
          return _emscripten_proxy_to_main_thread_js(3, 1, __environ, environ_buf);
        
          var bufSize = 0;
          getEnvStrings().forEach(function(string, i) {
            var ptr = environ_buf + bufSize;
            HEAP32[(((__environ)+(i * 4))>>2)] = ptr;
            writeAsciiToMemory(string, ptr);
            bufSize += string.length + 1;
          });
          return 0;
        
      }
      

      
      function _environ_sizes_get(penviron_count, penviron_buf_size) {
        if (ENVIRONMENT_IS_PTHREAD)
          return _emscripten_proxy_to_main_thread_js(4, 1, penviron_count, penviron_buf_size);
        
          var strings = getEnvStrings();
          HEAP32[((penviron_count)>>2)] = strings.length;
          var bufSize = 0;
          strings.forEach(function(string) {
            bufSize += string.length + 1;
          });
          HEAP32[((penviron_buf_size)>>2)] = bufSize;
          return 0;
        
      }
      


      
      function _fd_close(fd) {
        if (ENVIRONMENT_IS_PTHREAD)
          return _emscripten_proxy_to_main_thread_js(5, 1, fd);
        try {
      
          var stream = SYSCALLS.getStreamFromFD(fd);
          FS.close(stream);
          return 0;
        } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
      }
      
      }
      

      
      function _fd_read(fd, iov, iovcnt, pnum) {
        if (ENVIRONMENT_IS_PTHREAD)
          return _emscripten_proxy_to_main_thread_js(6, 1, fd, iov, iovcnt, pnum);
        try {
      
          var stream = SYSCALLS.getStreamFromFD(fd);
          var num = SYSCALLS.doReadv(stream, iov, iovcnt);
          HEAP32[((pnum)>>2)] = num;
          return 0;
        } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
      }
      
      }
      

      
      function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
        if (ENVIRONMENT_IS_PTHREAD)
          return _emscripten_proxy_to_main_thread_js(7, 1, fd, offset_low, offset_high, whence, newOffset);
        try {
      
          
          var stream = SYSCALLS.getStreamFromFD(fd);
          var HIGH_OFFSET = 0x100000000; // 2^32
          // use an unsigned operator on low and shift high by 32-bits
          var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
      
          var DOUBLE_LIMIT = 0x20000000000000; // 2^53
          // we also check for equality since DOUBLE_LIMIT + 1 == DOUBLE_LIMIT
          if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
            return -61;
          }
      
          FS.llseek(stream, offset, whence);
          (tempI64 = [stream.position>>>0,(tempDouble=stream.position,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((newOffset)>>2)] = tempI64[0],HEAP32[(((newOffset)+(4))>>2)] = tempI64[1]);
          if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
          return 0;
        } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
      }
      
      }
      

      
      function _fd_write(fd, iov, iovcnt, pnum) {
        if (ENVIRONMENT_IS_PTHREAD)
          return _emscripten_proxy_to_main_thread_js(8, 1, fd, iov, iovcnt, pnum);
        try {
      
          var stream = SYSCALLS.getStreamFromFD(fd);
          var num = SYSCALLS.doWritev(stream, iov, iovcnt);
          HEAP32[((pnum)>>2)] = num;
          return 0;
        } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno;
      }
      
      }
      

      function _setTempRet0(val) {
        }

      function __isLeapYear(year) {
            return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
        }
      
      function __arraySum(array, index) {
          var sum = 0;
          for (var i = 0; i <= index; sum += array[i++]) {
            // no-op
          }
          return sum;
        }
      
      var __MONTH_DAYS_LEAP = [31,29,31,30,31,30,31,31,30,31,30,31];
      
      var __MONTH_DAYS_REGULAR = [31,28,31,30,31,30,31,31,30,31,30,31];
      function __addDays(date, days) {
          var newDate = new Date(date.getTime());
          while (days > 0) {
            var leap = __isLeapYear(newDate.getFullYear());
            var currentMonth = newDate.getMonth();
            var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
      
            if (days > daysInCurrentMonth-newDate.getDate()) {
              // we spill over to next month
              days -= (daysInCurrentMonth-newDate.getDate()+1);
              newDate.setDate(1);
              if (currentMonth < 11) {
                newDate.setMonth(currentMonth+1);
              } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear()+1);
              }
            } else {
              // we stay in current month
              newDate.setDate(newDate.getDate()+days);
              return newDate;
            }
          }
      
          return newDate;
        }
      function _strftime(s, maxsize, format, tm) {
          // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
          // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      
          var tm_zone = HEAP32[(((tm)+(40))>>2)];
      
          var date = {
            tm_sec: HEAP32[((tm)>>2)],
            tm_min: HEAP32[(((tm)+(4))>>2)],
            tm_hour: HEAP32[(((tm)+(8))>>2)],
            tm_mday: HEAP32[(((tm)+(12))>>2)],
            tm_mon: HEAP32[(((tm)+(16))>>2)],
            tm_year: HEAP32[(((tm)+(20))>>2)],
            tm_wday: HEAP32[(((tm)+(24))>>2)],
            tm_yday: HEAP32[(((tm)+(28))>>2)],
            tm_isdst: HEAP32[(((tm)+(32))>>2)],
            tm_gmtoff: HEAP32[(((tm)+(36))>>2)],
            tm_zone: tm_zone ? UTF8ToString(tm_zone) : ''
          };
      
          var pattern = UTF8ToString(format);
      
          // expand format
          var EXPANSION_RULES_1 = {
            '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
            '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
            '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
            '%h': '%b',                       // Equivalent to %b
            '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
            '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
            '%T': '%H:%M:%S',                 // Replaced by the time
            '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
            '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate time representation
            // Modified Conversion Specifiers
            '%Ec': '%c',                      // Replaced by the locale's alternative appropriate date and time representation.
            '%EC': '%C',                      // Replaced by the name of the base year (period) in the locale's alternative representation.
            '%Ex': '%m/%d/%y',                // Replaced by the locale's alternative date representation.
            '%EX': '%H:%M:%S',                // Replaced by the locale's alternative time representation.
            '%Ey': '%y',                      // Replaced by the offset from %EC (year only) in the locale's alternative representation.
            '%EY': '%Y',                      // Replaced by the full alternative year representation.
            '%Od': '%d',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading zeros if there is any alternative symbol for zero; otherwise, with leading <space> characters.
            '%Oe': '%e',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading <space> characters.
            '%OH': '%H',                      // Replaced by the hour (24-hour clock) using the locale's alternative numeric symbols.
            '%OI': '%I',                      // Replaced by the hour (12-hour clock) using the locale's alternative numeric symbols.
            '%Om': '%m',                      // Replaced by the month using the locale's alternative numeric symbols.
            '%OM': '%M',                      // Replaced by the minutes using the locale's alternative numeric symbols.
            '%OS': '%S',                      // Replaced by the seconds using the locale's alternative numeric symbols.
            '%Ou': '%u',                      // Replaced by the weekday as a number in the locale's alternative representation (Monday=1).
            '%OU': '%U',                      // Replaced by the week number of the year (Sunday as the first day of the week, rules corresponding to %U ) using the locale's alternative numeric symbols.
            '%OV': '%V',                      // Replaced by the week number of the year (Monday as the first day of the week, rules corresponding to %V ) using the locale's alternative numeric symbols.
            '%Ow': '%w',                      // Replaced by the number of the weekday (Sunday=0) using the locale's alternative numeric symbols.
            '%OW': '%W',                      // Replaced by the week number of the year (Monday as the first day of the week) using the locale's alternative numeric symbols.
            '%Oy': '%y',                      // Replaced by the year (offset from %C ) using the locale's alternative numeric symbols.
          };
          for (var rule in EXPANSION_RULES_1) {
            pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
          }
      
          var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
          function leadingSomething(value, digits, character) {
            var str = typeof value === 'number' ? value.toString() : (value || '');
            while (str.length < digits) {
              str = character[0]+str;
            }
            return str;
          }
      
          function leadingNulls(value, digits) {
            return leadingSomething(value, digits, '0');
          }
      
          function compareByDay(date1, date2) {
            function sgn(value) {
              return value < 0 ? -1 : (value > 0 ? 1 : 0);
            }
      
            var compare;
            if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
              if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
                compare = sgn(date1.getDate()-date2.getDate());
              }
            }
            return compare;
          }
      
          function getFirstWeekStartDate(janFourth) {
              switch (janFourth.getDay()) {
                case 0: // Sunday
                  return new Date(janFourth.getFullYear()-1, 11, 29);
                case 1: // Monday
                  return janFourth;
                case 2: // Tuesday
                  return new Date(janFourth.getFullYear(), 0, 3);
                case 3: // Wednesday
                  return new Date(janFourth.getFullYear(), 0, 2);
                case 4: // Thursday
                  return new Date(janFourth.getFullYear(), 0, 1);
                case 5: // Friday
                  return new Date(janFourth.getFullYear()-1, 11, 31);
                case 6: // Saturday
                  return new Date(janFourth.getFullYear()-1, 11, 30);
              }
          }
      
          function getWeekBasedYear(date) {
              var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
      
              var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
              var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
      
              var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
              var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
      
              if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
                // this date is after the start of the first week of this year
                if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                  return thisDate.getFullYear()+1;
                } else {
                  return thisDate.getFullYear();
                }
              } else {
                return thisDate.getFullYear()-1;
              }
          }
      
          var EXPANSION_RULES_2 = {
            '%a': function(date) {
              return WEEKDAYS[date.tm_wday].substring(0,3);
            },
            '%A': function(date) {
              return WEEKDAYS[date.tm_wday];
            },
            '%b': function(date) {
              return MONTHS[date.tm_mon].substring(0,3);
            },
            '%B': function(date) {
              return MONTHS[date.tm_mon];
            },
            '%C': function(date) {
              var year = date.tm_year+1900;
              return leadingNulls((year/100)|0,2);
            },
            '%d': function(date) {
              return leadingNulls(date.tm_mday, 2);
            },
            '%e': function(date) {
              return leadingSomething(date.tm_mday, 2, ' ');
            },
            '%g': function(date) {
              // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year.
              // In this system, weeks begin on a Monday and week 1 of the year is the week that includes
              // January 4th, which is also the week that includes the first Thursday of the year, and
              // is also the first week that contains at least four days in the year.
              // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of
              // the last week of the preceding year; thus, for Saturday 2nd January 1999,
              // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th,
              // or 31st is a Monday, it and any following days are part of week 1 of the following year.
              // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
      
              return getWeekBasedYear(date).toString().substring(2);
            },
            '%G': function(date) {
              return getWeekBasedYear(date);
            },
            '%H': function(date) {
              return leadingNulls(date.tm_hour, 2);
            },
            '%I': function(date) {
              var twelveHour = date.tm_hour;
              if (twelveHour == 0) twelveHour = 12;
              else if (twelveHour > 12) twelveHour -= 12;
              return leadingNulls(twelveHour, 2);
            },
            '%j': function(date) {
              // Day of the year (001-366)
              return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
            },
            '%m': function(date) {
              return leadingNulls(date.tm_mon+1, 2);
            },
            '%M': function(date) {
              return leadingNulls(date.tm_min, 2);
            },
            '%n': function() {
              return '\n';
            },
            '%p': function(date) {
              if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return 'AM';
              } else {
                return 'PM';
              }
            },
            '%S': function(date) {
              return leadingNulls(date.tm_sec, 2);
            },
            '%t': function() {
              return '\t';
            },
            '%u': function(date) {
              return date.tm_wday || 7;
            },
            '%U': function(date) {
              // Replaced by the week number of the year as a decimal number [00,53].
              // The first Sunday of January is the first day of week 1;
              // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
              var janFirst = new Date(date.tm_year+1900, 0, 1);
              var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
              var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
      
              // is target date after the first Sunday?
              if (compareByDay(firstSunday, endDate) < 0) {
                // calculate difference in days between first Sunday and endDate
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
                var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
                var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
                return leadingNulls(Math.ceil(days/7), 2);
              }
      
              return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
            },
            '%V': function(date) {
              // Replaced by the week number of the year (Monday as the first day of the week)
              // as a decimal number [01,53]. If the week containing 1 January has four
              // or more days in the new year, then it is considered week 1.
              // Otherwise, it is the last week of the previous year, and the next week is week 1.
              // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
              var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
              var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
      
              var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
              var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
      
              var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
      
              if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                // if given date is before this years first week, then it belongs to the 53rd week of last year
                return '53';
              }
      
              if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                // if given date is after next years first week, then it belongs to the 01th week of next year
                return '01';
              }
      
              // given date is in between CW 01..53 of this calendar year
              var daysDifference;
              if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
                // first CW of this year starts last year
                daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate();
              } else {
                // first CW of this year starts this year
                daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
              }
              return leadingNulls(Math.ceil(daysDifference/7), 2);
            },
            '%w': function(date) {
              return date.tm_wday;
            },
            '%W': function(date) {
              // Replaced by the week number of the year as a decimal number [00,53].
              // The first Monday of January is the first day of week 1;
              // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
              var janFirst = new Date(date.tm_year, 0, 1);
              var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
              var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
      
              // is target date after the first Monday?
              if (compareByDay(firstMonday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
                var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
                var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
                return leadingNulls(Math.ceil(days/7), 2);
              }
              return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
            },
            '%y': function(date) {
              // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
              return (date.tm_year+1900).toString().substring(2);
            },
            '%Y': function(date) {
              // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
              return date.tm_year+1900;
            },
            '%z': function(date) {
              // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
              // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
              var off = date.tm_gmtoff;
              var ahead = off >= 0;
              off = Math.abs(off) / 60;
              // convert from minutes into hhmm format (which means 60 minutes = 100 units)
              off = (off / 60)*100 + (off % 60);
              return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
            },
            '%Z': function(date) {
              return date.tm_zone;
            },
            '%%': function() {
              return '%';
            }
          };
          for (var rule in EXPANSION_RULES_2) {
            if (pattern.includes(rule)) {
              pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
            }
          }
      
          var bytes = intArrayFromString(pattern, false);
          if (bytes.length > maxsize) {
            return 0;
          }
      
          writeArrayToMemory(bytes, s);
          return bytes.length-1;
        }
      function _strftime_l(s, maxsize, format, tm) {
          return _strftime(s, maxsize, format, tm); // no locale support yet
        }
    if (!ENVIRONMENT_IS_PTHREAD) PThread.initMainThreadBlock();var GLctx;
      var FSNode = /** @constructor */ function(parent, name, mode, rdev) {
        if (!parent) {
          parent = this;  // root node sets parent to itself
        }
        this.parent = parent;
        this.mount = parent.mount;
        this.mounted = null;
        this.id = FS.nextInode++;
        this.name = name;
        this.mode = mode;
        this.node_ops = {};
        this.stream_ops = {};
        this.rdev = rdev;
      };
      var readMode = 292/*292*/ | 73/*73*/;
      var writeMode = 146/*146*/;
      Object.defineProperties(FSNode.prototype, {
       read: {
        get: /** @this{FSNode} */function() {
         return (this.mode & readMode) === readMode;
        },
        set: /** @this{FSNode} */function(val) {
         val ? this.mode |= readMode : this.mode &= ~readMode;
        }
       },
       write: {
        get: /** @this{FSNode} */function() {
         return (this.mode & writeMode) === writeMode;
        },
        set: /** @this{FSNode} */function(val) {
         val ? this.mode |= writeMode : this.mode &= ~writeMode;
        }
       },
       isFolder: {
        get: /** @this{FSNode} */function() {
         return FS.isDir(this.mode);
        }
       },
       isDevice: {
        get: /** @this{FSNode} */function() {
         return FS.isChrdev(this.mode);
        }
       }
      });
      FS.FSNode = FSNode;
      FS.staticInit();ERRNO_CODES = {
          'EPERM': 63,
          'ENOENT': 44,
          'ESRCH': 71,
          'EINTR': 27,
          'EIO': 29,
          'ENXIO': 60,
          'E2BIG': 1,
          'ENOEXEC': 45,
          'EBADF': 8,
          'ECHILD': 12,
          'EAGAIN': 6,
          'EWOULDBLOCK': 6,
          'ENOMEM': 48,
          'EACCES': 2,
          'EFAULT': 21,
          'ENOTBLK': 105,
          'EBUSY': 10,
          'EEXIST': 20,
          'EXDEV': 75,
          'ENODEV': 43,
          'ENOTDIR': 54,
          'EISDIR': 31,
          'EINVAL': 28,
          'ENFILE': 41,
          'EMFILE': 33,
          'ENOTTY': 59,
          'ETXTBSY': 74,
          'EFBIG': 22,
          'ENOSPC': 51,
          'ESPIPE': 70,
          'EROFS': 69,
          'EMLINK': 34,
          'EPIPE': 64,
          'EDOM': 18,
          'ERANGE': 68,
          'ENOMSG': 49,
          'EIDRM': 24,
          'ECHRNG': 106,
          'EL2NSYNC': 156,
          'EL3HLT': 107,
          'EL3RST': 108,
          'ELNRNG': 109,
          'EUNATCH': 110,
          'ENOCSI': 111,
          'EL2HLT': 112,
          'EDEADLK': 16,
          'ENOLCK': 46,
          'EBADE': 113,
          'EBADR': 114,
          'EXFULL': 115,
          'ENOANO': 104,
          'EBADRQC': 103,
          'EBADSLT': 102,
          'EDEADLOCK': 16,
          'EBFONT': 101,
          'ENOSTR': 100,
          'ENODATA': 116,
          'ETIME': 117,
          'ENOSR': 118,
          'ENONET': 119,
          'ENOPKG': 120,
          'EREMOTE': 121,
          'ENOLINK': 47,
          'EADV': 122,
          'ESRMNT': 123,
          'ECOMM': 124,
          'EPROTO': 65,
          'EMULTIHOP': 36,
          'EDOTDOT': 125,
          'EBADMSG': 9,
          'ENOTUNIQ': 126,
          'EBADFD': 127,
          'EREMCHG': 128,
          'ELIBACC': 129,
          'ELIBBAD': 130,
          'ELIBSCN': 131,
          'ELIBMAX': 132,
          'ELIBEXEC': 133,
          'ENOSYS': 52,
          'ENOTEMPTY': 55,
          'ENAMETOOLONG': 37,
          'ELOOP': 32,
          'EOPNOTSUPP': 138,
          'EPFNOSUPPORT': 139,
          'ECONNRESET': 15,
          'ENOBUFS': 42,
          'EAFNOSUPPORT': 5,
          'EPROTOTYPE': 67,
          'ENOTSOCK': 57,
          'ENOPROTOOPT': 50,
          'ESHUTDOWN': 140,
          'ECONNREFUSED': 14,
          'EADDRINUSE': 3,
          'ECONNABORTED': 13,
          'ENETUNREACH': 40,
          'ENETDOWN': 38,
          'ETIMEDOUT': 73,
          'EHOSTDOWN': 142,
          'EHOSTUNREACH': 23,
          'EINPROGRESS': 26,
          'EALREADY': 7,
          'EDESTADDRREQ': 17,
          'EMSGSIZE': 35,
          'EPROTONOSUPPORT': 66,
          'ESOCKTNOSUPPORT': 137,
          'EADDRNOTAVAIL': 4,
          'ENETRESET': 39,
          'EISCONN': 30,
          'ENOTCONN': 53,
          'ETOOMANYREFS': 141,
          'EUSERS': 136,
          'EDQUOT': 19,
          'ESTALE': 72,
          'ENOTSUP': 138,
          'ENOMEDIUM': 148,
          'EILSEQ': 25,
          'EOVERFLOW': 61,
          'ECANCELED': 11,
          'ENOTRECOVERABLE': 56,
          'EOWNERDEAD': 62,
          'ESTRPIPE': 135,
        };
     // proxiedFunctionTable specifies the list of functions that can be called either synchronously or asynchronously from other threads in postMessage()d or internally queued events. This way a pthread in a Worker can synchronously access e.g. the DOM on the main thread.

    var proxiedFunctionTable = [null,_atexit,_emscripten_set_canvas_element_size_main_thread,_environ_get,_environ_sizes_get,_fd_close,_fd_read,_fd_seek,_fd_write];



    /** @type {function(string, boolean=, number=)} */
    function intArrayFromString(stringy, dontAddNull, length) {
      var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    }


    var asmLibraryArg = {
      "__assert_fail": ___assert_fail,
      "__call_main": ___call_main,
      "__clock_gettime": ___clock_gettime,
      "__cxa_atexit": ___cxa_atexit,
      "__cxa_thread_atexit": ___cxa_thread_atexit,
      "__pthread_create_js": ___pthread_create_js,
      "__pthread_exit_done": ___pthread_exit_done,
      "__pthread_exit_run_handlers": ___pthread_exit_run_handlers,
      "__pthread_join_js": ___pthread_join_js,
      "_emscripten_notify_thread_queue": __emscripten_notify_thread_queue,
      "abort": _abort,
      "emscripten_check_blocking_allowed": _emscripten_check_blocking_allowed,
      "emscripten_conditional_set_current_thread_status": _emscripten_conditional_set_current_thread_status,
      "emscripten_futex_wait": _emscripten_futex_wait,
      "emscripten_futex_wake": _emscripten_futex_wake,
      "emscripten_get_now": _emscripten_get_now,
      "emscripten_memcpy_big": _emscripten_memcpy_big,
      "emscripten_receive_on_main_thread_js": _emscripten_receive_on_main_thread_js,
      "emscripten_resize_heap": _emscripten_resize_heap,
      "emscripten_set_canvas_element_size": _emscripten_set_canvas_element_size,
      "emscripten_set_current_thread_status": _emscripten_set_current_thread_status,
      "emscripten_set_thread_name": _emscripten_set_thread_name,
      "emscripten_set_timeout": _emscripten_set_timeout,
      "emscripten_unwind_to_js_event_loop": _emscripten_unwind_to_js_event_loop,
      "emscripten_webgl_create_context": _emscripten_webgl_create_context,
      "environ_get": _environ_get,
      "environ_sizes_get": _environ_sizes_get,
      "exit": _exit,
      "fd_close": _fd_close,
      "fd_read": _fd_read,
      "fd_seek": _fd_seek,
      "fd_write": _fd_write,
      "initPthreadsJS": initPthreadsJS,
      "memory": wasmMemory || Module['wasmMemory'],
      "setTempRet0": _setTempRet0,
      "strftime_l": _strftime_l
    };
    createWasm();
    /** @type {function(...*):?} */
    Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors");

    /** @type {function(...*):?} */
    var _main = Module["_main"] = createExportWrapper("main");

    /** @type {function(...*):?} */
    Module["_emscripten_tls_init"] = createExportWrapper("emscripten_tls_init");

    /** @type {function(...*):?} */
    Module["_emscripten_current_thread_process_queued_calls"] = createExportWrapper("emscripten_current_thread_process_queued_calls");

    /** @type {function(...*):?} */
    var _emscripten_main_browser_thread_id = Module["_emscripten_main_browser_thread_id"] = createExportWrapper("emscripten_main_browser_thread_id");

    /** @type {function(...*):?} */
    Module["_emscripten_sync_run_in_main_thread_2"] = createExportWrapper("emscripten_sync_run_in_main_thread_2");

    /** @type {function(...*):?} */
    var _emscripten_sync_run_in_main_thread_4 = Module["_emscripten_sync_run_in_main_thread_4"] = createExportWrapper("emscripten_sync_run_in_main_thread_4");

    /** @type {function(...*):?} */
    var _emscripten_main_thread_process_queued_calls = Module["_emscripten_main_thread_process_queued_calls"] = createExportWrapper("emscripten_main_thread_process_queued_calls");

    /** @type {function(...*):?} */
    var _emscripten_run_in_main_runtime_thread_js = Module["_emscripten_run_in_main_runtime_thread_js"] = createExportWrapper("emscripten_run_in_main_runtime_thread_js");

    /** @type {function(...*):?} */
    var __emscripten_call_on_thread = Module["__emscripten_call_on_thread"] = createExportWrapper("_emscripten_call_on_thread");

    /** @type {function(...*):?} */
    Module["___emscripten_pthread_data_constructor"] = createExportWrapper("__emscripten_pthread_data_constructor");

    /** @type {function(...*):?} */
    var __emscripten_thread_exit = Module["__emscripten_thread_exit"] = createExportWrapper("_emscripten_thread_exit");

    /** @type {function(...*):?} */
    Module["___pthread_tsd_run_dtors"] = createExportWrapper("__pthread_tsd_run_dtors");

    /** @type {function(...*):?} */
    var _malloc = Module["_malloc"] = createExportWrapper("malloc");

    /** @type {function(...*):?} */
    var _pthread_self = Module["_pthread_self"] = createExportWrapper("pthread_self");

    /** @type {function(...*):?} */
    var _free = Module["_free"] = createExportWrapper("free");

    /** @type {function(...*):?} */
    var __emscripten_thread_init = Module["__emscripten_thread_init"] = createExportWrapper("_emscripten_thread_init");

    /** @type {function(...*):?} */
    var _pthread_testcancel = Module["_pthread_testcancel"] = createExportWrapper("pthread_testcancel");

    /** @type {function(...*):?} */
    Module["_emscripten_proxy_main"] = createExportWrapper("emscripten_proxy_main");

    /** @type {function(...*):?} */
    var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location");

    /** @type {function(...*):?} */
    Module["_emscripten_get_global_libc"] = createExportWrapper("emscripten_get_global_libc");

    /** @type {function(...*):?} */
    Module["_fflush"] = createExportWrapper("fflush");

    /** @type {function(...*):?} */
    var stackSave = Module["stackSave"] = createExportWrapper("stackSave");

    /** @type {function(...*):?} */
    var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore");

    /** @type {function(...*):?} */
    var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc");

    /** @type {function(...*):?} */
    var _emscripten_stack_init = Module["_emscripten_stack_init"] = function() {
      return (_emscripten_stack_init = Module["_emscripten_stack_init"] = Module["asm"]["emscripten_stack_init"]).apply(null, arguments);
    };

    /** @type {function(...*):?} */
    var _emscripten_stack_set_limits = Module["_emscripten_stack_set_limits"] = function() {
      return (_emscripten_stack_set_limits = Module["_emscripten_stack_set_limits"] = Module["asm"]["emscripten_stack_set_limits"]).apply(null, arguments);
    };

    /** @type {function(...*):?} */
    Module["_emscripten_stack_get_free"] = function() {
      return (Module["_emscripten_stack_get_free"] = Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
    };

    /** @type {function(...*):?} */
    var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = function() {
      return (_emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
    };

    /** @type {function(...*):?} */
    var _memalign = Module["_memalign"] = createExportWrapper("memalign");

    /** @type {function(...*):?} */
    Module["dynCall_iiiiij"] = createExportWrapper("dynCall_iiiiij");

    /** @type {function(...*):?} */
    Module["dynCall_iiiiijj"] = createExportWrapper("dynCall_iiiiijj");

    /** @type {function(...*):?} */
    Module["dynCall_iiiiiijj"] = createExportWrapper("dynCall_iiiiiijj");

    /** @type {function(...*):?} */
    Module["dynCall_viijii"] = createExportWrapper("dynCall_viijii");

    /** @type {function(...*):?} */
    Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji");

    var __emscripten_allow_main_runtime_queued_calls = Module['__emscripten_allow_main_runtime_queued_calls'] = 15456;
    var __emscripten_main_thread_futex = Module['__emscripten_main_thread_futex'] = 16204;



    // === Auto-generated postamble setup entry stuff ===

    if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString")) Module["intArrayFromString"] = function() { abort("'intArrayFromString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString")) Module["intArrayToString"] = function() { abort("'intArrayToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "ccall")) Module["ccall"] = function() { abort("'ccall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "cwrap")) Module["cwrap"] = function() { abort("'cwrap' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "setValue")) Module["setValue"] = function() { abort("'setValue' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getValue")) Module["getValue"] = function() { abort("'getValue' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "allocate")) Module["allocate"] = function() { abort("'allocate' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString")) Module["UTF8ArrayToString"] = function() { abort("'UTF8ArrayToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString")) Module["UTF8ToString"] = function() { abort("'UTF8ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array")) Module["stringToUTF8Array"] = function() { abort("'stringToUTF8Array' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8")) Module["stringToUTF8"] = function() { abort("'stringToUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8")) Module["lengthBytesUTF8"] = function() { abort("'lengthBytesUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun")) Module["addOnPreRun"] = function() { abort("'addOnPreRun' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "addOnInit")) Module["addOnInit"] = function() { abort("'addOnInit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "addOnPreMain")) Module["addOnPreMain"] = function() { abort("'addOnPreMain' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "addOnExit")) Module["addOnExit"] = function() { abort("'addOnExit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun")) Module["addOnPostRun"] = function() { abort("'addOnPostRun' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory")) Module["writeStringToMemory"] = function() { abort("'writeStringToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory")) Module["writeArrayToMemory"] = function() { abort("'writeArrayToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory")) Module["writeAsciiToMemory"] = function() { abort("'writeAsciiToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "addRunDependency")) Module["addRunDependency"] = function() { abort("'addRunDependency' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Object.getOwnPropertyDescriptor(Module, "removeRunDependency")) Module["removeRunDependency"] = function() { abort("'removeRunDependency' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder")) Module["FS_createFolder"] = function() { abort("'FS_createFolder' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createPath")) Module["FS_createPath"] = function() { abort("'FS_createPath' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createDataFile")) Module["FS_createDataFile"] = function() { abort("'FS_createDataFile' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createPreloadedFile")) Module["FS_createPreloadedFile"] = function() { abort("'FS_createPreloadedFile' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createLazyFile")) Module["FS_createLazyFile"] = function() { abort("'FS_createLazyFile' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink")) Module["FS_createLink"] = function() { abort("'FS_createLink' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_createDevice")) Module["FS_createDevice"] = function() { abort("'FS_createDevice' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Object.getOwnPropertyDescriptor(Module, "FS_unlink")) Module["FS_unlink"] = function() { abort("'FS_unlink' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getLEB")) Module["getLEB"] = function() { abort("'getLEB' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables")) Module["getFunctionTables"] = function() { abort("'getFunctionTables' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables")) Module["alignFunctionTables"] = function() { abort("'alignFunctionTables' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions")) Module["registerFunctions"] = function() { abort("'registerFunctions' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "addFunction")) Module["addFunction"] = function() { abort("'addFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "removeFunction")) Module["removeFunction"] = function() { abort("'removeFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint")) Module["prettyPrint"] = function() { abort("'prettyPrint' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting")) Module["getCompilerSetting"] = function() { abort("'getCompilerSetting' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "print")) Module["print"] = function() { abort("'print' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "printErr")) Module["printErr"] = function() { abort("'printErr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0")) Module["getTempRet0"] = function() { abort("'getTempRet0' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0")) Module["setTempRet0"] = function() { abort("'setTempRet0' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "callMain")) Module["callMain"] = function() { abort("'callMain' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "abort")) Module["abort"] = function() { abort("'abort' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    Module["keepRuntimeAlive"] = keepRuntimeAlive;
    if (!Object.getOwnPropertyDescriptor(Module, "zeroMemory")) Module["zeroMemory"] = function() { abort("'zeroMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToNewUTF8")) Module["stringToNewUTF8"] = function() { abort("'stringToNewUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "setFileTime")) Module["setFileTime"] = function() { abort("'setFileTime' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "abortOnCannotGrowMemory")) Module["abortOnCannotGrowMemory"] = function() { abort("'abortOnCannotGrowMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "emscripten_realloc_buffer")) Module["emscripten_realloc_buffer"] = function() { abort("'emscripten_realloc_buffer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "ENV")) Module["ENV"] = function() { abort("'ENV' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_CODES")) Module["ERRNO_CODES"] = function() { abort("'ERRNO_CODES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_MESSAGES")) Module["ERRNO_MESSAGES"] = function() { abort("'ERRNO_MESSAGES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "setErrNo")) Module["setErrNo"] = function() { abort("'setErrNo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "inetPton4")) Module["inetPton4"] = function() { abort("'inetPton4' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "inetNtop4")) Module["inetNtop4"] = function() { abort("'inetNtop4' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "inetPton6")) Module["inetPton6"] = function() { abort("'inetPton6' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "inetNtop6")) Module["inetNtop6"] = function() { abort("'inetNtop6' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "readSockaddr")) Module["readSockaddr"] = function() { abort("'readSockaddr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "writeSockaddr")) Module["writeSockaddr"] = function() { abort("'writeSockaddr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "DNS")) Module["DNS"] = function() { abort("'DNS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getHostByName")) Module["getHostByName"] = function() { abort("'getHostByName' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "GAI_ERRNO_MESSAGES")) Module["GAI_ERRNO_MESSAGES"] = function() { abort("'GAI_ERRNO_MESSAGES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "Protocols")) Module["Protocols"] = function() { abort("'Protocols' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "Sockets")) Module["Sockets"] = function() { abort("'Sockets' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getRandomDevice")) Module["getRandomDevice"] = function() { abort("'getRandomDevice' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "traverseStack")) Module["traverseStack"] = function() { abort("'traverseStack' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "UNWIND_CACHE")) Module["UNWIND_CACHE"] = function() { abort("'UNWIND_CACHE' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "withBuiltinMalloc")) Module["withBuiltinMalloc"] = function() { abort("'withBuiltinMalloc' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgsArray")) Module["readAsmConstArgsArray"] = function() { abort("'readAsmConstArgsArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgs")) Module["readAsmConstArgs"] = function() { abort("'readAsmConstArgs' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "mainThreadEM_ASM")) Module["mainThreadEM_ASM"] = function() { abort("'mainThreadEM_ASM' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "jstoi_q")) Module["jstoi_q"] = function() { abort("'jstoi_q' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "jstoi_s")) Module["jstoi_s"] = function() { abort("'jstoi_s' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getExecutableName")) Module["getExecutableName"] = function() { abort("'getExecutableName' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "listenOnce")) Module["listenOnce"] = function() { abort("'listenOnce' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "autoResumeAudioContext")) Module["autoResumeAudioContext"] = function() { abort("'autoResumeAudioContext' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "dynCallLegacy")) Module["dynCallLegacy"] = function() { abort("'dynCallLegacy' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getDynCaller")) Module["getDynCaller"] = function() { abort("'getDynCaller' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "callRuntimeCallbacks")) Module["callRuntimeCallbacks"] = function() { abort("'callRuntimeCallbacks' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "handleException")) Module["handleException"] = function() { abort("'handleException' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "runtimeKeepalivePush")) Module["runtimeKeepalivePush"] = function() { abort("'runtimeKeepalivePush' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "runtimeKeepalivePop")) Module["runtimeKeepalivePop"] = function() { abort("'runtimeKeepalivePop' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "callUserCallback")) Module["callUserCallback"] = function() { abort("'callUserCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "maybeExit")) Module["maybeExit"] = function() { abort("'maybeExit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "safeSetTimeout")) Module["safeSetTimeout"] = function() { abort("'safeSetTimeout' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "asmjsMangle")) Module["asmjsMangle"] = function() { abort("'asmjsMangle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "asyncLoad")) Module["asyncLoad"] = function() { abort("'asyncLoad' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "alignMemory")) Module["alignMemory"] = function() { abort("'alignMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "mmapAlloc")) Module["mmapAlloc"] = function() { abort("'mmapAlloc' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "reallyNegative")) Module["reallyNegative"] = function() { abort("'reallyNegative' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "unSign")) Module["unSign"] = function() { abort("'unSign' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "reSign")) Module["reSign"] = function() { abort("'reSign' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "formatString")) Module["formatString"] = function() { abort("'formatString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "PATH")) Module["PATH"] = function() { abort("'PATH' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "PATH_FS")) Module["PATH_FS"] = function() { abort("'PATH_FS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "SYSCALLS")) Module["SYSCALLS"] = function() { abort("'SYSCALLS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "syscallMmap2")) Module["syscallMmap2"] = function() { abort("'syscallMmap2' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "syscallMunmap")) Module["syscallMunmap"] = function() { abort("'syscallMunmap' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getSocketFromFD")) Module["getSocketFromFD"] = function() { abort("'getSocketFromFD' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getSocketAddress")) Module["getSocketAddress"] = function() { abort("'getSocketAddress' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "JSEvents")) Module["JSEvents"] = function() { abort("'JSEvents' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerKeyEventCallback")) Module["registerKeyEventCallback"] = function() { abort("'registerKeyEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "specialHTMLTargets")) Module["specialHTMLTargets"] = function() { abort("'specialHTMLTargets' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "maybeCStringToJsString")) Module["maybeCStringToJsString"] = function() { abort("'maybeCStringToJsString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "findEventTarget")) Module["findEventTarget"] = function() { abort("'findEventTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "findCanvasEventTarget")) Module["findCanvasEventTarget"] = function() { abort("'findCanvasEventTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getBoundingClientRect")) Module["getBoundingClientRect"] = function() { abort("'getBoundingClientRect' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "fillMouseEventData")) Module["fillMouseEventData"] = function() { abort("'fillMouseEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerMouseEventCallback")) Module["registerMouseEventCallback"] = function() { abort("'registerMouseEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerWheelEventCallback")) Module["registerWheelEventCallback"] = function() { abort("'registerWheelEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerUiEventCallback")) Module["registerUiEventCallback"] = function() { abort("'registerUiEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerFocusEventCallback")) Module["registerFocusEventCallback"] = function() { abort("'registerFocusEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceOrientationEventData")) Module["fillDeviceOrientationEventData"] = function() { abort("'fillDeviceOrientationEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceOrientationEventCallback")) Module["registerDeviceOrientationEventCallback"] = function() { abort("'registerDeviceOrientationEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceMotionEventData")) Module["fillDeviceMotionEventData"] = function() { abort("'fillDeviceMotionEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceMotionEventCallback")) Module["registerDeviceMotionEventCallback"] = function() { abort("'registerDeviceMotionEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "screenOrientation")) Module["screenOrientation"] = function() { abort("'screenOrientation' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "fillOrientationChangeEventData")) Module["fillOrientationChangeEventData"] = function() { abort("'fillOrientationChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerOrientationChangeEventCallback")) Module["registerOrientationChangeEventCallback"] = function() { abort("'registerOrientationChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "fillFullscreenChangeEventData")) Module["fillFullscreenChangeEventData"] = function() { abort("'fillFullscreenChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerFullscreenChangeEventCallback")) Module["registerFullscreenChangeEventCallback"] = function() { abort("'registerFullscreenChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerRestoreOldStyle")) Module["registerRestoreOldStyle"] = function() { abort("'registerRestoreOldStyle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "hideEverythingExceptGivenElement")) Module["hideEverythingExceptGivenElement"] = function() { abort("'hideEverythingExceptGivenElement' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "restoreHiddenElements")) Module["restoreHiddenElements"] = function() { abort("'restoreHiddenElements' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "setLetterbox")) Module["setLetterbox"] = function() { abort("'setLetterbox' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "currentFullscreenStrategy")) Module["currentFullscreenStrategy"] = function() { abort("'currentFullscreenStrategy' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "restoreOldWindowedStyle")) Module["restoreOldWindowedStyle"] = function() { abort("'restoreOldWindowedStyle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "softFullscreenResizeWebGLRenderTarget")) Module["softFullscreenResizeWebGLRenderTarget"] = function() { abort("'softFullscreenResizeWebGLRenderTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "doRequestFullscreen")) Module["doRequestFullscreen"] = function() { abort("'doRequestFullscreen' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "fillPointerlockChangeEventData")) Module["fillPointerlockChangeEventData"] = function() { abort("'fillPointerlockChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockChangeEventCallback")) Module["registerPointerlockChangeEventCallback"] = function() { abort("'registerPointerlockChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockErrorEventCallback")) Module["registerPointerlockErrorEventCallback"] = function() { abort("'registerPointerlockErrorEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "requestPointerLock")) Module["requestPointerLock"] = function() { abort("'requestPointerLock' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "fillVisibilityChangeEventData")) Module["fillVisibilityChangeEventData"] = function() { abort("'fillVisibilityChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerVisibilityChangeEventCallback")) Module["registerVisibilityChangeEventCallback"] = function() { abort("'registerVisibilityChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerTouchEventCallback")) Module["registerTouchEventCallback"] = function() { abort("'registerTouchEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "fillGamepadEventData")) Module["fillGamepadEventData"] = function() { abort("'fillGamepadEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerGamepadEventCallback")) Module["registerGamepadEventCallback"] = function() { abort("'registerGamepadEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerBeforeUnloadEventCallback")) Module["registerBeforeUnloadEventCallback"] = function() { abort("'registerBeforeUnloadEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "fillBatteryEventData")) Module["fillBatteryEventData"] = function() { abort("'fillBatteryEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "battery")) Module["battery"] = function() { abort("'battery' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "registerBatteryEventCallback")) Module["registerBatteryEventCallback"] = function() { abort("'registerBatteryEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "setCanvasElementSize")) Module["setCanvasElementSize"] = function() { abort("'setCanvasElementSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getCanvasElementSize")) Module["getCanvasElementSize"] = function() { abort("'getCanvasElementSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "polyfillSetImmediate")) Module["polyfillSetImmediate"] = function() { abort("'polyfillSetImmediate' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "demangle")) Module["demangle"] = function() { abort("'demangle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "demangleAll")) Module["demangleAll"] = function() { abort("'demangleAll' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "jsStackTrace")) Module["jsStackTrace"] = function() { abort("'jsStackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getEnvStrings")) Module["getEnvStrings"] = function() { abort("'getEnvStrings' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "checkWasiClock")) Module["checkWasiClock"] = function() { abort("'checkWasiClock' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64")) Module["writeI53ToI64"] = function() { abort("'writeI53ToI64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Clamped")) Module["writeI53ToI64Clamped"] = function() { abort("'writeI53ToI64Clamped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Signaling")) Module["writeI53ToI64Signaling"] = function() { abort("'writeI53ToI64Signaling' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Clamped")) Module["writeI53ToU64Clamped"] = function() { abort("'writeI53ToU64Clamped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Signaling")) Module["writeI53ToU64Signaling"] = function() { abort("'writeI53ToU64Signaling' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "readI53FromI64")) Module["readI53FromI64"] = function() { abort("'readI53FromI64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "readI53FromU64")) Module["readI53FromU64"] = function() { abort("'readI53FromU64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "convertI32PairToI53")) Module["convertI32PairToI53"] = function() { abort("'convertI32PairToI53' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "convertU32PairToI53")) Module["convertU32PairToI53"] = function() { abort("'convertU32PairToI53' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "uncaughtExceptionCount")) Module["uncaughtExceptionCount"] = function() { abort("'uncaughtExceptionCount' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "exceptionLast")) Module["exceptionLast"] = function() { abort("'exceptionLast' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "exceptionCaught")) Module["exceptionCaught"] = function() { abort("'exceptionCaught' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "ExceptionInfo")) Module["ExceptionInfo"] = function() { abort("'ExceptionInfo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "CatchInfo")) Module["CatchInfo"] = function() { abort("'CatchInfo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "exception_addRef")) Module["exception_addRef"] = function() { abort("'exception_addRef' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "exception_decRef")) Module["exception_decRef"] = function() { abort("'exception_decRef' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "Browser")) Module["Browser"] = function() { abort("'Browser' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "funcWrappers")) Module["funcWrappers"] = function() { abort("'funcWrappers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "setMainLoop")) Module["setMainLoop"] = function() { abort("'setMainLoop' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "wget")) Module["wget"] = function() { abort("'wget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "tempFixedLengthArray")) Module["tempFixedLengthArray"] = function() { abort("'tempFixedLengthArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "miniTempWebGLFloatBuffers")) Module["miniTempWebGLFloatBuffers"] = function() { abort("'miniTempWebGLFloatBuffers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "heapObjectForWebGLType")) Module["heapObjectForWebGLType"] = function() { abort("'heapObjectForWebGLType' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "heapAccessShiftForWebGLHeap")) Module["heapAccessShiftForWebGLHeap"] = function() { abort("'heapAccessShiftForWebGLHeap' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "GL")) Module["GL"] = function() { abort("'GL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGet")) Module["emscriptenWebGLGet"] = function() { abort("'emscriptenWebGLGet' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "computeUnpackAlignedImageSize")) Module["computeUnpackAlignedImageSize"] = function() { abort("'computeUnpackAlignedImageSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetTexPixelData")) Module["emscriptenWebGLGetTexPixelData"] = function() { abort("'emscriptenWebGLGetTexPixelData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetUniform")) Module["emscriptenWebGLGetUniform"] = function() { abort("'emscriptenWebGLGetUniform' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "webglGetUniformLocation")) Module["webglGetUniformLocation"] = function() { abort("'webglGetUniformLocation' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "webglPrepareUniformLocationsBeforeFirstUse")) Module["webglPrepareUniformLocationsBeforeFirstUse"] = function() { abort("'webglPrepareUniformLocationsBeforeFirstUse' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "webglGetLeftBracePos")) Module["webglGetLeftBracePos"] = function() { abort("'webglGetLeftBracePos' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetVertexAttrib")) Module["emscriptenWebGLGetVertexAttrib"] = function() { abort("'emscriptenWebGLGetVertexAttrib' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "writeGLArray")) Module["writeGLArray"] = function() { abort("'writeGLArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "FS")) Module["FS"] = function() { abort("'FS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "MEMFS")) Module["MEMFS"] = function() { abort("'MEMFS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "TTY")) Module["TTY"] = function() { abort("'TTY' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "PIPEFS")) Module["PIPEFS"] = function() { abort("'PIPEFS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "SOCKFS")) Module["SOCKFS"] = function() { abort("'SOCKFS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "_setNetworkCallback")) Module["_setNetworkCallback"] = function() { abort("'_setNetworkCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "AL")) Module["AL"] = function() { abort("'AL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "SDL_unicode")) Module["SDL_unicode"] = function() { abort("'SDL_unicode' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "SDL_ttfContext")) Module["SDL_ttfContext"] = function() { abort("'SDL_ttfContext' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "SDL_audio")) Module["SDL_audio"] = function() { abort("'SDL_audio' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "SDL")) Module["SDL"] = function() { abort("'SDL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "SDL_gfx")) Module["SDL_gfx"] = function() { abort("'SDL_gfx' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "GLUT")) Module["GLUT"] = function() { abort("'GLUT' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "EGL")) Module["EGL"] = function() { abort("'EGL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "GLFW_Window")) Module["GLFW_Window"] = function() { abort("'GLFW_Window' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "GLFW")) Module["GLFW"] = function() { abort("'GLFW' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "GLEW")) Module["GLEW"] = function() { abort("'GLEW' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "IDBStore")) Module["IDBStore"] = function() { abort("'IDBStore' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "runAndAbortIfError")) Module["runAndAbortIfError"] = function() { abort("'runAndAbortIfError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    Module["PThread"] = PThread;
    if (!Object.getOwnPropertyDescriptor(Module, "killThread")) Module["killThread"] = function() { abort("'killThread' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "cleanupThread")) Module["cleanupThread"] = function() { abort("'cleanupThread' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "cancelThread")) Module["cancelThread"] = function() { abort("'cancelThread' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "spawnThread")) Module["spawnThread"] = function() { abort("'spawnThread' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "establishStackSpace")) Module["establishStackSpace"] = function() { abort("'establishStackSpace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "invokeEntryPoint")) Module["invokeEntryPoint"] = function() { abort("'invokeEntryPoint' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "warnOnce")) Module["warnOnce"] = function() { abort("'warnOnce' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stackSave")) Module["stackSave"] = function() { abort("'stackSave' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stackRestore")) Module["stackRestore"] = function() { abort("'stackRestore' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc")) Module["stackAlloc"] = function() { abort("'stackAlloc' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString")) Module["AsciiToString"] = function() { abort("'AsciiToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii")) Module["stringToAscii"] = function() { abort("'stringToAscii' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString")) Module["UTF16ToString"] = function() { abort("'UTF16ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16")) Module["stringToUTF16"] = function() { abort("'stringToUTF16' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16")) Module["lengthBytesUTF16"] = function() { abort("'lengthBytesUTF16' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString")) Module["UTF32ToString"] = function() { abort("'UTF32ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32")) Module["stringToUTF32"] = function() { abort("'stringToUTF32' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32")) Module["lengthBytesUTF32"] = function() { abort("'lengthBytesUTF32' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8")) Module["allocateUTF8"] = function() { abort("'allocateUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack")) Module["allocateUTF8OnStack"] = function() { abort("'allocateUTF8OnStack' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
    Module["writeStackCookie"] = writeStackCookie;
    Module["checkStackCookie"] = checkStackCookie;
    Module["PThread"] = PThread;
    Module["wasmMemory"] = wasmMemory;
    Module["ExitStatus"] = ExitStatus;
    if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL")) Object.defineProperty(Module, "ALLOC_NORMAL", { configurable: true, get: function() { abort("'ALLOC_NORMAL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); } });
    if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK")) Object.defineProperty(Module, "ALLOC_STACK", { configurable: true, get: function() { abort("'ALLOC_STACK' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)"); } });

    var calledRun;

    /**
     * @constructor
     * @this {ExitStatus}
     */
    function ExitStatus(status) {
      this.name = "ExitStatus";
      this.message = "Program terminated with exit(" + status + ")";
      this.status = status;
    }

    dependenciesFulfilled = function runCaller() {
      // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
      if (!calledRun) run();
      if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
    };

    function callMain(args) {
      assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
      assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

      // User requested the PROXY_TO_PTHREAD option, so call a stub main which pthread_create()s a new thread
      // that will call the user's real main() for the application.
      var entryFunction = Module['_emscripten_proxy_main'];

      args = args || [];

      var argc = args.length+1;
      var argv = stackAlloc((argc + 1) * 4);
      HEAP32[argv >> 2] = allocateUTF8OnStack(thisProgram);
      for (var i = 1; i < argc; i++) {
        HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1]);
      }
      HEAP32[(argv >> 2) + argc] = 0;

      try {

        var ret = entryFunction(argc, argv);

        // In PROXY_TO_PTHREAD builds, we should never exit the runtime below, as
        // execution is asynchronously handed off to a pthread.
        assert(ret == 0, '_emscripten_proxy_main failed to start proxy thread: ' + ret);
      } finally {

      }
    }

    function stackCheckInit() {
      // This is normally called automatically during __wasm_call_ctors but need to
      // get these values before even running any of the ctors so we call it redundantly
      // here.
      // TODO(sbc): Move writeStackCookie to native to to avoid this.
      _emscripten_stack_init();
      writeStackCookie();
    }

    /** @type {function(Array=)} */
    function run(args) {
      args = args || arguments_;

      if (runDependencies > 0) {
        return;
      }

      stackCheckInit();

      if (ENVIRONMENT_IS_PTHREAD) {
        // The promise resolve function typically gets called as part of the execution
        // of `doRun` below. The workers/pthreads don't execute `doRun` so the
        // creation promise can be resolved, marking the pthread-Module as initialized.
        readyPromiseResolve(Module);
        initRuntime();
        postMessage({ 'cmd': 'loaded' });
        return;
      }

      preRun();

      // a preRun added a dependency, run will be called later
      if (runDependencies > 0) {
        return;
      }

      function doRun() {
        // run may have just been called through dependencies being fulfilled just in this very frame,
        // or while the async setStatus time below was happening
        if (calledRun) return;
        calledRun = true;
        Module['calledRun'] = true;

        if (ABORT) return;

        initRuntime();

        preMain();

        readyPromiseResolve(Module);
        if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

        if (shouldRunNow) callMain(args);

        postRun();
      }

      if (Module['setStatus']) {
        Module['setStatus']('Running...');
        setTimeout(function() {
          setTimeout(function() {
            Module['setStatus']('');
          }, 1);
          doRun();
        }, 1);
      } else
      {
        doRun();
      }
      checkStackCookie();
    }
    Module['run'] = run;

    function checkUnflushedContent() {
      // Compiler settings do not allow exiting the runtime, so flushing
      // the streams is not possible. but in ASSERTIONS mode we check
      // if there was something to flush, and if so tell the user they
      // should request that the runtime be exitable.
      // Normally we would not even include flush() at all, but in ASSERTIONS
      // builds we do so just for this check, and here we see if there is any
      // content to flush, that is, we check if there would have been
      // something a non-ASSERTIONS build would have not seen.
      // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
      // mode (which has its own special function for this; otherwise, all
      // the code is inside libc)
      var oldOut = out;
      var oldErr = err;
      var has = false;
      out = err = function(x) {
        has = true;
      };
      try { // it doesn't matter if it fails
        var flush = Module['_fflush'];
        if (flush) flush(0);
        // also flush in the JS FS layer
        ['stdout', 'stderr'].forEach(function(name) {
          var info = FS.analyzePath('/dev/' + name);
          if (!info) return;
          var stream = info.object;
          var rdev = stream.rdev;
          var tty = TTY.ttys[rdev];
          if (tty && tty.output && tty.output.length) {
            has = true;
          }
        });
      } catch(e) {}
      out = oldOut;
      err = oldErr;
      if (has) {
        warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
      }
    }

    /** @param {boolean|number=} implicit */
    function exit(status, implicit) {
      EXITSTATUS = status;

      checkUnflushedContent();

      if (!implicit) {
        if (ENVIRONMENT_IS_PTHREAD) {
          err('Pthread 0x' + _pthread_self().toString(16) + ' called exit(), posting exitProcess.');
          // When running in a pthread we propagate the exit back to the main thread
          // where it can decide if the whole process should be shut down or not.
          // The pthread may have decided not to exit its own runtime, for example
          // because it runs a main loop, but that doesn't affect the main thread.
          postMessage({ 'cmd': 'exitProcess', 'returnCode': status });
          throw new ExitStatus(status);
        } else {
          err('main thread called exit: keepRuntimeAlive=' + keepRuntimeAlive() + ' (counter=' + runtimeKeepaliveCounter + ')');
        }
      }

      if (keepRuntimeAlive()) {
        // if exit() was called, we may warn the user if the runtime isn't actually being shut down
        if (!implicit) {
          var msg = 'program exited (with status: ' + status + '), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)';
          readyPromiseReject(msg);
          err(msg);
        }
      } else {
        PThread.terminateAllThreads();
        exitRuntime();
      }

      procExit(status);
    }

    function procExit(code) {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        PThread.terminateAllThreads();
        if (Module['onExit']) Module['onExit'](code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    }

    if (Module['preInit']) {
      if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
      while (Module['preInit'].length > 0) {
        Module['preInit'].pop()();
      }
    }

    // shouldRunNow refers to calling main(), not run().
    var shouldRunNow = true;

    if (Module['noInitialRun']) shouldRunNow = false;

    if (ENVIRONMENT_IS_PTHREAD) {
      // The default behaviour for pthreads is always to exit once they return
      // from their entry point (or call pthread_exit).  If we set noExitRuntime
      // to true here on pthreads they would never complete and attempt to
      // pthread_join to them would block forever.
      // pthreads can still choose to set `noExitRuntime` explicitly, or
      // call emscripten_unwind_to_js_event_loop to extend their lifetime beyond
      // their main function.  See comment in src/worker.js for more.
      noExitRuntime = false;
      PThread.initWorker();
    }

    run();







      return Module.ready
    }
    );
    })();

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let _rotations = JSON.parse(localStorage.getItem("rotations")) || [];

    const rotations = writable(_rotations);

    rotations.subscribe(value =>{
        localStorage.setItem("rotations", JSON.stringify(value));
    });

    let _score = JSON.parse(localStorage.getItem("score")) || "";

    const score = writable(_score);

    score.subscribe(value =>{
        localStorage.setItem("score", JSON.stringify(value));
    });

    /* src/Score.svelte generated by Svelte v3.42.4 */

    const file$2 = "src/Score.svelte";

    function create_fragment$3(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let br;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*score*/ ctx[0]);
    			t1 = text(" Score ");
    			br = element("br");
    			set_style(span, "color", "white");
    			attr_dev(span, "id", "score");
    			add_location(span, file$2, 6, 0, 49);
    			add_location(br, file$2, 6, 60, 109);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*score*/ 1) set_data_dev(t0, /*score*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Score', slots, []);
    	let { score = "" } = $$props;
    	const writable_props = ['score'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Score> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('score' in $$props) $$invalidate(0, score = $$props.score);
    	};

    	$$self.$capture_state = () => ({ score });

    	$$self.$inject_state = $$props => {
    		if ('score' in $$props) $$invalidate(0, score = $$props.score);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [score];
    }

    class Score extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { score: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Score",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get score() {
    		throw new Error("<Score>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set score(value) {
    		throw new Error("<Score>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /**
     * [js-sha256]{@link https://github.com/emn178/js-sha256}
     *
     * @version 0.9.0
     * @author Chen, Yi-Cyuan [emn178@gmail.com]
     * @copyright Chen, Yi-Cyuan 2014-2017
     * @license MIT
     */

    var sha256 = createCommonjsModule(function (module) {
    /*jslint bitwise: true */
    (function () {

      var ERROR = 'input is invalid type';
      var WINDOW = typeof window === 'object';
      var root = WINDOW ? window : {};
      if (root.JS_SHA256_NO_WINDOW) {
        WINDOW = false;
      }
      var WEB_WORKER = !WINDOW && typeof self === 'object';
      var NODE_JS = !root.JS_SHA256_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
      if (NODE_JS) {
        root = commonjsGlobal;
      } else if (WEB_WORKER) {
        root = self;
      }
      var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && 'object' === 'object' && module.exports;
      var ARRAY_BUFFER = !root.JS_SHA256_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
      var HEX_CHARS = '0123456789abcdef'.split('');
      var EXTRA = [-2147483648, 8388608, 32768, 128];
      var SHIFT = [24, 16, 8, 0];
      var K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
      ];
      var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];

      var blocks = [];

      if (root.JS_SHA256_NO_NODE_JS || !Array.isArray) {
        Array.isArray = function (obj) {
          return Object.prototype.toString.call(obj) === '[object Array]';
        };
      }

      if (ARRAY_BUFFER && (root.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
        ArrayBuffer.isView = function (obj) {
          return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
        };
      }

      var createOutputMethod = function (outputType, is224) {
        return function (message) {
          return new Sha256(is224, true).update(message)[outputType]();
        };
      };

      var createMethod = function (is224) {
        var method = createOutputMethod('hex', is224);
        if (NODE_JS) {
          method = nodeWrap(method, is224);
        }
        method.create = function () {
          return new Sha256(is224);
        };
        method.update = function (message) {
          return method.create().update(message);
        };
        for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
          var type = OUTPUT_TYPES[i];
          method[type] = createOutputMethod(type, is224);
        }
        return method;
      };

      var nodeWrap = function (method, is224) {
        var crypto = eval("require('crypto')");
        var Buffer = eval("require('buffer').Buffer");
        var algorithm = is224 ? 'sha224' : 'sha256';
        var nodeMethod = function (message) {
          if (typeof message === 'string') {
            return crypto.createHash(algorithm).update(message, 'utf8').digest('hex');
          } else {
            if (message === null || message === undefined) {
              throw new Error(ERROR);
            } else if (message.constructor === ArrayBuffer) {
              message = new Uint8Array(message);
            }
          }
          if (Array.isArray(message) || ArrayBuffer.isView(message) ||
            message.constructor === Buffer) {
            return crypto.createHash(algorithm).update(new Buffer(message)).digest('hex');
          } else {
            return method(message);
          }
        };
        return nodeMethod;
      };

      var createHmacOutputMethod = function (outputType, is224) {
        return function (key, message) {
          return new HmacSha256(key, is224, true).update(message)[outputType]();
        };
      };

      var createHmacMethod = function (is224) {
        var method = createHmacOutputMethod('hex', is224);
        method.create = function (key) {
          return new HmacSha256(key, is224);
        };
        method.update = function (key, message) {
          return method.create(key).update(message);
        };
        for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
          var type = OUTPUT_TYPES[i];
          method[type] = createHmacOutputMethod(type, is224);
        }
        return method;
      };

      function Sha256(is224, sharedMemory) {
        if (sharedMemory) {
          blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
            blocks[4] = blocks[5] = blocks[6] = blocks[7] =
            blocks[8] = blocks[9] = blocks[10] = blocks[11] =
            blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
          this.blocks = blocks;
        } else {
          this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }

        if (is224) {
          this.h0 = 0xc1059ed8;
          this.h1 = 0x367cd507;
          this.h2 = 0x3070dd17;
          this.h3 = 0xf70e5939;
          this.h4 = 0xffc00b31;
          this.h5 = 0x68581511;
          this.h6 = 0x64f98fa7;
          this.h7 = 0xbefa4fa4;
        } else { // 256
          this.h0 = 0x6a09e667;
          this.h1 = 0xbb67ae85;
          this.h2 = 0x3c6ef372;
          this.h3 = 0xa54ff53a;
          this.h4 = 0x510e527f;
          this.h5 = 0x9b05688c;
          this.h6 = 0x1f83d9ab;
          this.h7 = 0x5be0cd19;
        }

        this.block = this.start = this.bytes = this.hBytes = 0;
        this.finalized = this.hashed = false;
        this.first = true;
        this.is224 = is224;
      }

      Sha256.prototype.update = function (message) {
        if (this.finalized) {
          return;
        }
        var notString, type = typeof message;
        if (type !== 'string') {
          if (type === 'object') {
            if (message === null) {
              throw new Error(ERROR);
            } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
              message = new Uint8Array(message);
            } else if (!Array.isArray(message)) {
              if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
                throw new Error(ERROR);
              }
            }
          } else {
            throw new Error(ERROR);
          }
          notString = true;
        }
        var code, index = 0, i, length = message.length, blocks = this.blocks;

        while (index < length) {
          if (this.hashed) {
            this.hashed = false;
            blocks[0] = this.block;
            blocks[16] = blocks[1] = blocks[2] = blocks[3] =
              blocks[4] = blocks[5] = blocks[6] = blocks[7] =
              blocks[8] = blocks[9] = blocks[10] = blocks[11] =
              blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
          }

          if (notString) {
            for (i = this.start; index < length && i < 64; ++index) {
              blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
            }
          } else {
            for (i = this.start; index < length && i < 64; ++index) {
              code = message.charCodeAt(index);
              if (code < 0x80) {
                blocks[i >> 2] |= code << SHIFT[i++ & 3];
              } else if (code < 0x800) {
                blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
              } else if (code < 0xd800 || code >= 0xe000) {
                blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
              } else {
                code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
                blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
              }
            }
          }

          this.lastByteIndex = i;
          this.bytes += i - this.start;
          if (i >= 64) {
            this.block = blocks[16];
            this.start = i - 64;
            this.hash();
            this.hashed = true;
          } else {
            this.start = i;
          }
        }
        if (this.bytes > 4294967295) {
          this.hBytes += this.bytes / 4294967296 << 0;
          this.bytes = this.bytes % 4294967296;
        }
        return this;
      };

      Sha256.prototype.finalize = function () {
        if (this.finalized) {
          return;
        }
        this.finalized = true;
        var blocks = this.blocks, i = this.lastByteIndex;
        blocks[16] = this.block;
        blocks[i >> 2] |= EXTRA[i & 3];
        this.block = blocks[16];
        if (i >= 56) {
          if (!this.hashed) {
            this.hash();
          }
          blocks[0] = this.block;
          blocks[16] = blocks[1] = blocks[2] = blocks[3] =
            blocks[4] = blocks[5] = blocks[6] = blocks[7] =
            blocks[8] = blocks[9] = blocks[10] = blocks[11] =
            blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
        }
        blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
        blocks[15] = this.bytes << 3;
        this.hash();
      };

      Sha256.prototype.hash = function () {
        var a = this.h0, b = this.h1, c = this.h2, d = this.h3, e = this.h4, f = this.h5, g = this.h6,
          h = this.h7, blocks = this.blocks, j, s0, s1, maj, t1, t2, ch, ab, da, cd, bc;

        for (j = 16; j < 64; ++j) {
          // rightrotate
          t1 = blocks[j - 15];
          s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
          t1 = blocks[j - 2];
          s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
          blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
        }

        bc = b & c;
        for (j = 0; j < 64; j += 4) {
          if (this.first) {
            if (this.is224) {
              ab = 300032;
              t1 = blocks[0] - 1413257819;
              h = t1 - 150054599 << 0;
              d = t1 + 24177077 << 0;
            } else {
              ab = 704751109;
              t1 = blocks[0] - 210244248;
              h = t1 - 1521486534 << 0;
              d = t1 + 143694565 << 0;
            }
            this.first = false;
          } else {
            s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
            s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
            ab = a & b;
            maj = ab ^ (a & c) ^ bc;
            ch = (e & f) ^ (~e & g);
            t1 = h + s1 + ch + K[j] + blocks[j];
            t2 = s0 + maj;
            h = d + t1 << 0;
            d = t1 + t2 << 0;
          }
          s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
          s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
          da = d & a;
          maj = da ^ (d & b) ^ ab;
          ch = (h & e) ^ (~h & f);
          t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
          t2 = s0 + maj;
          g = c + t1 << 0;
          c = t1 + t2 << 0;
          s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
          s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
          cd = c & d;
          maj = cd ^ (c & a) ^ da;
          ch = (g & h) ^ (~g & e);
          t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
          t2 = s0 + maj;
          f = b + t1 << 0;
          b = t1 + t2 << 0;
          s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
          s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
          bc = b & c;
          maj = bc ^ (b & d) ^ cd;
          ch = (f & g) ^ (~f & h);
          t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
          t2 = s0 + maj;
          e = a + t1 << 0;
          a = t1 + t2 << 0;
        }

        this.h0 = this.h0 + a << 0;
        this.h1 = this.h1 + b << 0;
        this.h2 = this.h2 + c << 0;
        this.h3 = this.h3 + d << 0;
        this.h4 = this.h4 + e << 0;
        this.h5 = this.h5 + f << 0;
        this.h6 = this.h6 + g << 0;
        this.h7 = this.h7 + h << 0;
      };

      Sha256.prototype.hex = function () {
        this.finalize();

        var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
          h6 = this.h6, h7 = this.h7;

        var hex = HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
          HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
          HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
          HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
          HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
          HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
          HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
          HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
          HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
          HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
          HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
          HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
          HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F] +
          HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
          HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
          HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
          HEX_CHARS[(h4 >> 28) & 0x0F] + HEX_CHARS[(h4 >> 24) & 0x0F] +
          HEX_CHARS[(h4 >> 20) & 0x0F] + HEX_CHARS[(h4 >> 16) & 0x0F] +
          HEX_CHARS[(h4 >> 12) & 0x0F] + HEX_CHARS[(h4 >> 8) & 0x0F] +
          HEX_CHARS[(h4 >> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
          HEX_CHARS[(h5 >> 28) & 0x0F] + HEX_CHARS[(h5 >> 24) & 0x0F] +
          HEX_CHARS[(h5 >> 20) & 0x0F] + HEX_CHARS[(h5 >> 16) & 0x0F] +
          HEX_CHARS[(h5 >> 12) & 0x0F] + HEX_CHARS[(h5 >> 8) & 0x0F] +
          HEX_CHARS[(h5 >> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
          HEX_CHARS[(h6 >> 28) & 0x0F] + HEX_CHARS[(h6 >> 24) & 0x0F] +
          HEX_CHARS[(h6 >> 20) & 0x0F] + HEX_CHARS[(h6 >> 16) & 0x0F] +
          HEX_CHARS[(h6 >> 12) & 0x0F] + HEX_CHARS[(h6 >> 8) & 0x0F] +
          HEX_CHARS[(h6 >> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F];
        if (!this.is224) {
          hex += HEX_CHARS[(h7 >> 28) & 0x0F] + HEX_CHARS[(h7 >> 24) & 0x0F] +
            HEX_CHARS[(h7 >> 20) & 0x0F] + HEX_CHARS[(h7 >> 16) & 0x0F] +
            HEX_CHARS[(h7 >> 12) & 0x0F] + HEX_CHARS[(h7 >> 8) & 0x0F] +
            HEX_CHARS[(h7 >> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
        }
        return hex;
      };

      Sha256.prototype.toString = Sha256.prototype.hex;

      Sha256.prototype.digest = function () {
        this.finalize();

        var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
          h6 = this.h6, h7 = this.h7;

        var arr = [
          (h0 >> 24) & 0xFF, (h0 >> 16) & 0xFF, (h0 >> 8) & 0xFF, h0 & 0xFF,
          (h1 >> 24) & 0xFF, (h1 >> 16) & 0xFF, (h1 >> 8) & 0xFF, h1 & 0xFF,
          (h2 >> 24) & 0xFF, (h2 >> 16) & 0xFF, (h2 >> 8) & 0xFF, h2 & 0xFF,
          (h3 >> 24) & 0xFF, (h3 >> 16) & 0xFF, (h3 >> 8) & 0xFF, h3 & 0xFF,
          (h4 >> 24) & 0xFF, (h4 >> 16) & 0xFF, (h4 >> 8) & 0xFF, h4 & 0xFF,
          (h5 >> 24) & 0xFF, (h5 >> 16) & 0xFF, (h5 >> 8) & 0xFF, h5 & 0xFF,
          (h6 >> 24) & 0xFF, (h6 >> 16) & 0xFF, (h6 >> 8) & 0xFF, h6 & 0xFF
        ];
        if (!this.is224) {
          arr.push((h7 >> 24) & 0xFF, (h7 >> 16) & 0xFF, (h7 >> 8) & 0xFF, h7 & 0xFF);
        }
        return arr;
      };

      Sha256.prototype.array = Sha256.prototype.digest;

      Sha256.prototype.arrayBuffer = function () {
        this.finalize();

        var buffer = new ArrayBuffer(this.is224 ? 28 : 32);
        var dataView = new DataView(buffer);
        dataView.setUint32(0, this.h0);
        dataView.setUint32(4, this.h1);
        dataView.setUint32(8, this.h2);
        dataView.setUint32(12, this.h3);
        dataView.setUint32(16, this.h4);
        dataView.setUint32(20, this.h5);
        dataView.setUint32(24, this.h6);
        if (!this.is224) {
          dataView.setUint32(28, this.h7);
        }
        return buffer;
      };

      function HmacSha256(key, is224, sharedMemory) {
        var i, type = typeof key;
        if (type === 'string') {
          var bytes = [], length = key.length, index = 0, code;
          for (i = 0; i < length; ++i) {
            code = key.charCodeAt(i);
            if (code < 0x80) {
              bytes[index++] = code;
            } else if (code < 0x800) {
              bytes[index++] = (0xc0 | (code >> 6));
              bytes[index++] = (0x80 | (code & 0x3f));
            } else if (code < 0xd800 || code >= 0xe000) {
              bytes[index++] = (0xe0 | (code >> 12));
              bytes[index++] = (0x80 | ((code >> 6) & 0x3f));
              bytes[index++] = (0x80 | (code & 0x3f));
            } else {
              code = 0x10000 + (((code & 0x3ff) << 10) | (key.charCodeAt(++i) & 0x3ff));
              bytes[index++] = (0xf0 | (code >> 18));
              bytes[index++] = (0x80 | ((code >> 12) & 0x3f));
              bytes[index++] = (0x80 | ((code >> 6) & 0x3f));
              bytes[index++] = (0x80 | (code & 0x3f));
            }
          }
          key = bytes;
        } else {
          if (type === 'object') {
            if (key === null) {
              throw new Error(ERROR);
            } else if (ARRAY_BUFFER && key.constructor === ArrayBuffer) {
              key = new Uint8Array(key);
            } else if (!Array.isArray(key)) {
              if (!ARRAY_BUFFER || !ArrayBuffer.isView(key)) {
                throw new Error(ERROR);
              }
            }
          } else {
            throw new Error(ERROR);
          }
        }

        if (key.length > 64) {
          key = (new Sha256(is224, true)).update(key).array();
        }

        var oKeyPad = [], iKeyPad = [];
        for (i = 0; i < 64; ++i) {
          var b = key[i] || 0;
          oKeyPad[i] = 0x5c ^ b;
          iKeyPad[i] = 0x36 ^ b;
        }

        Sha256.call(this, is224, sharedMemory);

        this.update(iKeyPad);
        this.oKeyPad = oKeyPad;
        this.inner = true;
        this.sharedMemory = sharedMemory;
      }
      HmacSha256.prototype = new Sha256();

      HmacSha256.prototype.finalize = function () {
        Sha256.prototype.finalize.call(this);
        if (this.inner) {
          this.inner = false;
          var innerHash = this.array();
          Sha256.call(this, this.is224, this.sharedMemory);
          this.update(this.oKeyPad);
          this.update(innerHash);
          Sha256.prototype.finalize.call(this);
        }
      };

      var exports = createMethod();
      exports.sha256 = exports;
      exports.sha224 = createMethod(true);
      exports.sha256.hmac = createHmacMethod();
      exports.sha224.hmac = createHmacMethod(true);

      if (COMMON_JS) {
        module.exports = exports;
      } else {
        root.sha256 = exports.sha256;
        root.sha224 = exports.sha224;
      }
    })();
    });

    /* src/Miner.svelte generated by Svelte v3.42.4 */

    const { console: console_1$1 } = globals;
    const get_default_slot_changes = dirty => ({});
    const get_default_slot_context = ctx => ({ mine: /*mine*/ ctx[0] });

    function create_fragment$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $score;
    	validate_store(score, 'score');
    	component_subscribe($$self, score, $$value => $$invalidate(4, $score = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Miner', slots, ['default']);

    	let { _mine = () => {
    		
    	} } = $$props;

    	onMount(async () => {
    		const mWasn = Module({
    			locateFile: () => {
    				return initMinerWasm;
    			}
    		});

    		$$invalidate(1, _mine = (await mWasn)._mine);
    	});

    	const mine = (keyword, target) => {
    		const nonce = _mine(keyword, "", target, "rotate");

    		// const source = sha256(keyword)
    		const datahash = sha256.sha256("");

    		const rotation = sha256.sha256(`${keyword}${datahash}${nonce}`);

    		if (rotation > $score) {
    			score.set(rotation);
    		}

    		rotations.update(arr => {
    			console.log(arr);
    			arr.push(rotation);
    			return arr;
    		});
    	};

    	const writable_props = ['_mine'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Miner> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('_mine' in $$props) $$invalidate(1, _mine = $$props._mine);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		initMinerWasm,
    		miner: Module,
    		onMount,
    		sha256: sha256.sha256,
    		score,
    		rotations,
    		_mine,
    		mine,
    		$score
    	});

    	$$self.$inject_state = $$props => {
    		if ('_mine' in $$props) $$invalidate(1, _mine = $$props._mine);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [mine, _mine, $$scope, slots];
    }

    class Miner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { _mine: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Miner",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get _mine() {
    		throw new Error("<Miner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _mine(value) {
    		throw new Error("<Miner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Clicker.svelte generated by Svelte v3.42.4 */

    const file$1 = "src/Clicker.svelte";

    function create_fragment$1(ctx) {
    	let div0;
    	let img;
    	let img_src_value;
    	let div0_class_value;
    	let t0;
    	let div1;
    	let table;
    	let tr0;
    	let t2;
    	let tr1;
    	let th0;
    	let t4;
    	let tr2;
    	let th1;
    	let t6;
    	let tr3;
    	let th2;
    	let t8;
    	let tr4;
    	let th3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			table = element("table");
    			tr0 = element("tr");
    			tr0.textContent = "PC STATS";
    			t2 = space();
    			tr1 = element("tr");
    			th0 = element("th");
    			th0.textContent = "PC: MacOS";
    			t4 = space();
    			tr2 = element("tr");
    			th1 = element("th");
    			th1.textContent = "Target: 21e8";
    			t6 = space();
    			tr3 = element("tr");
    			th2 = element("th");
    			th2.textContent = "Rotation: 0";
    			t8 = space();
    			tr4 = element("tr");
    			th3 = element("th");
    			th3.textContent = "Nonce:";
    			if (!src_url_equal(img.src, img_src_value = "./images/chip.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "CPU");
    			attr_dev(img, "height", "256px");
    			attr_dev(img, "width", "256px");
    			attr_dev(img, "class", "svelte-yeh81s");
    			add_location(img, file$1, 18, 4, 361);
    			attr_dev(div0, "class", div0_class_value = "" + (/*imgclass*/ ctx[2] + " clickerContainer unselectable" + " svelte-yeh81s"));
    			add_location(div0, file$1, 17, 0, 301);
    			set_style(tr0, "color", "white");
    			add_location(tr0, file$1, 29, 8, 515);
    			set_style(th0, "color", "white");
    			add_location(th0, file$1, 31, 10, 579);
    			add_location(tr1, file$1, 30, 8, 564);
    			set_style(th1, "color", "white");
    			add_location(th1, file$1, 35, 10, 668);
    			add_location(tr2, file$1, 34, 8, 653);
    			set_style(th2, "color", "white");
    			add_location(th2, file$1, 39, 10, 760);
    			add_location(tr3, file$1, 38, 8, 745);
    			set_style(th3, "color", "white");
    			add_location(th3, file$1, 43, 12, 853);
    			add_location(tr4, file$1, 42, 8, 836);
    			add_location(table, file$1, 28, 4, 499);
    			add_location(div1, file$1, 24, 0, 486);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, table);
    			append_dev(table, tr0);
    			append_dev(table, t2);
    			append_dev(table, tr1);
    			append_dev(tr1, th0);
    			append_dev(table, t4);
    			append_dev(table, tr2);
    			append_dev(tr2, th1);
    			append_dev(table, t6);
    			append_dev(table, tr3);
    			append_dev(tr3, th2);
    			append_dev(table, t8);
    			append_dev(table, tr4);
    			append_dev(tr4, th3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keyup", /*keyup_handler*/ ctx[4], false, false, false),
    					listen_dev(window, "keydown", /*handleKeydown*/ ctx[3], false, false, false),
    					listen_dev(img, "click", /*click_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imgclass*/ 4 && div0_class_value !== (div0_class_value = "" + (/*imgclass*/ ctx[2] + " clickerContainer unselectable" + " svelte-yeh81s"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Clicker', slots, []);

    	let { mine = () => {
    		
    	} } = $$props;

    	let { source } = $$props;
    	let imgclass = '';

    	const handleKeydown = event => {
    		if (event.code === "Space") {
    			$$invalidate(2, imgclass = "imgsmall");
    			mine(source, "21e8");
    		}
    	};

    	const writable_props = ['mine', 'source'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Clicker> was created with unknown prop '${key}'`);
    	});

    	const keyup_handler = () => $$invalidate(2, imgclass = '');
    	const click_handler = amount => mine(source, "21e8");

    	$$self.$$set = $$props => {
    		if ('mine' in $$props) $$invalidate(0, mine = $$props.mine);
    		if ('source' in $$props) $$invalidate(1, source = $$props.source);
    	};

    	$$self.$capture_state = () => ({ mine, source, imgclass, handleKeydown });

    	$$self.$inject_state = $$props => {
    		if ('mine' in $$props) $$invalidate(0, mine = $$props.mine);
    		if ('source' in $$props) $$invalidate(1, source = $$props.source);
    		if ('imgclass' in $$props) $$invalidate(2, imgclass = $$props.imgclass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [mine, source, imgclass, handleKeydown, keyup_handler, click_handler];
    }

    class Clicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { mine: 0, source: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clicker",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*source*/ ctx[1] === undefined && !('source' in props)) {
    			console.warn("<Clicker> was created without expected prop 'source'");
    		}
    	}

    	get mine() {
    		throw new Error("<Clicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mine(value) {
    		throw new Error("<Clicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get source() {
    		throw new Error("<Clicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set source(value) {
    		throw new Error("<Clicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */
    var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

    var parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];

    var parseuri = function parseuri(str) {
        var src = str,
            b = str.indexOf('['),
            e = str.indexOf(']');

        if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
        }

        var m = re.exec(str || ''),
            uri = {},
            i = 14;

        while (i--) {
            uri[parts[i]] = m[i] || '';
        }

        if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
        }

        uri.pathNames = pathNames(uri, uri['path']);
        uri.queryKey = queryKey(uri, uri['query']);

        return uri;
    };

    function pathNames(obj, path) {
        var regx = /\/{2,9}/g,
            names = path.replace(regx, "/").split("/");

        if (path.substr(0, 1) == '/' || path.length === 0) {
            names.splice(0, 1);
        }
        if (path.substr(path.length - 1, 1) == '/') {
            names.splice(names.length - 1, 1);
        }

        return names;
    }

    function queryKey(uri, query) {
        var data = {};

        query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
            if ($1) {
                data[$1] = $2;
            }
        });

        return data;
    }

    /**
     * Helpers.
     */
    var s$2 = 1000;
    var m$2 = s$2 * 60;
    var h$2 = m$2 * 60;
    var d$2 = h$2 * 24;
    var w$2 = d$2 * 7;
    var y$2 = d$2 * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    var ms$2 = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse$2(val);
      } else if (type === 'number' && isFinite(val)) {
        return options.long ? fmtLong$2(val) : fmtShort$2(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse$2(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y$2;
        case 'weeks':
        case 'week':
        case 'w':
          return n * w$2;
        case 'days':
        case 'day':
        case 'd':
          return n * d$2;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h$2;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m$2;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s$2;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtShort$2(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d$2) {
        return Math.round(ms / d$2) + 'd';
      }
      if (msAbs >= h$2) {
        return Math.round(ms / h$2) + 'h';
      }
      if (msAbs >= m$2) {
        return Math.round(ms / m$2) + 'm';
      }
      if (msAbs >= s$2) {
        return Math.round(ms / s$2) + 's';
      }
      return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtLong$2(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d$2) {
        return plural$2(ms, msAbs, d$2, 'day');
      }
      if (msAbs >= h$2) {
        return plural$2(ms, msAbs, h$2, 'hour');
      }
      if (msAbs >= m$2) {
        return plural$2(ms, msAbs, m$2, 'minute');
      }
      if (msAbs >= s$2) {
        return plural$2(ms, msAbs, s$2, 'second');
      }
      return ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural$2(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
    }

    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     */

    function setup$2(env) {
    	createDebug.debug = createDebug;
    	createDebug.default = createDebug;
    	createDebug.coerce = coerce;
    	createDebug.disable = disable;
    	createDebug.enable = enable;
    	createDebug.enabled = enabled;
    	createDebug.humanize = ms$2;
    	createDebug.destroy = destroy;

    	Object.keys(env).forEach(key => {
    		createDebug[key] = env[key];
    	});

    	/**
    	* The currently active debug mode names, and names to skip.
    	*/

    	createDebug.names = [];
    	createDebug.skips = [];

    	/**
    	* Map of special "%n" handling functions, for the debug "format" argument.
    	*
    	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
    	*/
    	createDebug.formatters = {};

    	/**
    	* Selects a color for a debug namespace
    	* @param {String} namespace The namespace string for the for the debug instance to be colored
    	* @return {Number|String} An ANSI color code for the given namespace
    	* @api private
    	*/
    	function selectColor(namespace) {
    		let hash = 0;

    		for (let i = 0; i < namespace.length; i++) {
    			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    			hash |= 0; // Convert to 32bit integer
    		}

    		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    	}
    	createDebug.selectColor = selectColor;

    	/**
    	* Create a debugger with the given `namespace`.
    	*
    	* @param {String} namespace
    	* @return {Function}
    	* @api public
    	*/
    	function createDebug(namespace) {
    		let prevTime;
    		let enableOverride = null;
    		let namespacesCache;
    		let enabledCache;

    		function debug(...args) {
    			// Disabled?
    			if (!debug.enabled) {
    				return;
    			}

    			const self = debug;

    			// Set `diff` timestamp
    			const curr = Number(new Date());
    			const ms = curr - (prevTime || curr);
    			self.diff = ms;
    			self.prev = prevTime;
    			self.curr = curr;
    			prevTime = curr;

    			args[0] = createDebug.coerce(args[0]);

    			if (typeof args[0] !== 'string') {
    				// Anything else let's inspect with %O
    				args.unshift('%O');
    			}

    			// Apply any `formatters` transformations
    			let index = 0;
    			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    				// If we encounter an escaped % then don't increase the array index
    				if (match === '%%') {
    					return '%';
    				}
    				index++;
    				const formatter = createDebug.formatters[format];
    				if (typeof formatter === 'function') {
    					const val = args[index];
    					match = formatter.call(self, val);

    					// Now we need to remove `args[index]` since it's inlined in the `format`
    					args.splice(index, 1);
    					index--;
    				}
    				return match;
    			});

    			// Apply env-specific formatting (colors, etc.)
    			createDebug.formatArgs.call(self, args);

    			const logFn = self.log || createDebug.log;
    			logFn.apply(self, args);
    		}

    		debug.namespace = namespace;
    		debug.useColors = createDebug.useColors();
    		debug.color = createDebug.selectColor(namespace);
    		debug.extend = extend;
    		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    		Object.defineProperty(debug, 'enabled', {
    			enumerable: true,
    			configurable: false,
    			get: () => {
    				if (enableOverride !== null) {
    					return enableOverride;
    				}
    				if (namespacesCache !== createDebug.namespaces) {
    					namespacesCache = createDebug.namespaces;
    					enabledCache = createDebug.enabled(namespace);
    				}

    				return enabledCache;
    			},
    			set: v => {
    				enableOverride = v;
    			}
    		});

    		// Env-specific initialization logic for debug instances
    		if (typeof createDebug.init === 'function') {
    			createDebug.init(debug);
    		}

    		return debug;
    	}

    	function extend(namespace, delimiter) {
    		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    		newDebug.log = this.log;
    		return newDebug;
    	}

    	/**
    	* Enables a debug mode by namespaces. This can include modes
    	* separated by a colon and wildcards.
    	*
    	* @param {String} namespaces
    	* @api public
    	*/
    	function enable(namespaces) {
    		createDebug.save(namespaces);
    		createDebug.namespaces = namespaces;

    		createDebug.names = [];
    		createDebug.skips = [];

    		let i;
    		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    		const len = split.length;

    		for (i = 0; i < len; i++) {
    			if (!split[i]) {
    				// ignore empty strings
    				continue;
    			}

    			namespaces = split[i].replace(/\*/g, '.*?');

    			if (namespaces[0] === '-') {
    				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    			} else {
    				createDebug.names.push(new RegExp('^' + namespaces + '$'));
    			}
    		}
    	}

    	/**
    	* Disable debug output.
    	*
    	* @return {String} namespaces
    	* @api public
    	*/
    	function disable() {
    		const namespaces = [
    			...createDebug.names.map(toNamespace),
    			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
    		].join(',');
    		createDebug.enable('');
    		return namespaces;
    	}

    	/**
    	* Returns true if the given mode name is enabled, false otherwise.
    	*
    	* @param {String} name
    	* @return {Boolean}
    	* @api public
    	*/
    	function enabled(name) {
    		if (name[name.length - 1] === '*') {
    			return true;
    		}

    		let i;
    		let len;

    		for (i = 0, len = createDebug.skips.length; i < len; i++) {
    			if (createDebug.skips[i].test(name)) {
    				return false;
    			}
    		}

    		for (i = 0, len = createDebug.names.length; i < len; i++) {
    			if (createDebug.names[i].test(name)) {
    				return true;
    			}
    		}

    		return false;
    	}

    	/**
    	* Convert regexp to namespace
    	*
    	* @param {RegExp} regxep
    	* @return {String} namespace
    	* @api private
    	*/
    	function toNamespace(regexp) {
    		return regexp.toString()
    			.substring(2, regexp.toString().length - 2)
    			.replace(/\.\*\?$/, '*');
    	}

    	/**
    	* Coerce `val`.
    	*
    	* @param {Mixed} val
    	* @return {Mixed}
    	* @api private
    	*/
    	function coerce(val) {
    		if (val instanceof Error) {
    			return val.stack || val.message;
    		}
    		return val;
    	}

    	/**
    	* XXX DO NOT USE. This is a temporary stub function.
    	* XXX It WILL be removed in the next major release.
    	*/
    	function destroy() {
    		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    	}

    	createDebug.enable(createDebug.load());

    	return createDebug;
    }

    var common$2 = setup$2;

    /* eslint-env browser */

    var browser$2 = createCommonjsModule(function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     */

    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = (() => {
    	let warned = false;

    	return () => {
    		if (!warned) {
    			warned = true;
    			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    		}
    	};
    })();

    /**
     * Colors.
     */

    exports.colors = [
    	'#0000CC',
    	'#0000FF',
    	'#0033CC',
    	'#0033FF',
    	'#0066CC',
    	'#0066FF',
    	'#0099CC',
    	'#0099FF',
    	'#00CC00',
    	'#00CC33',
    	'#00CC66',
    	'#00CC99',
    	'#00CCCC',
    	'#00CCFF',
    	'#3300CC',
    	'#3300FF',
    	'#3333CC',
    	'#3333FF',
    	'#3366CC',
    	'#3366FF',
    	'#3399CC',
    	'#3399FF',
    	'#33CC00',
    	'#33CC33',
    	'#33CC66',
    	'#33CC99',
    	'#33CCCC',
    	'#33CCFF',
    	'#6600CC',
    	'#6600FF',
    	'#6633CC',
    	'#6633FF',
    	'#66CC00',
    	'#66CC33',
    	'#9900CC',
    	'#9900FF',
    	'#9933CC',
    	'#9933FF',
    	'#99CC00',
    	'#99CC33',
    	'#CC0000',
    	'#CC0033',
    	'#CC0066',
    	'#CC0099',
    	'#CC00CC',
    	'#CC00FF',
    	'#CC3300',
    	'#CC3333',
    	'#CC3366',
    	'#CC3399',
    	'#CC33CC',
    	'#CC33FF',
    	'#CC6600',
    	'#CC6633',
    	'#CC9900',
    	'#CC9933',
    	'#CCCC00',
    	'#CCCC33',
    	'#FF0000',
    	'#FF0033',
    	'#FF0066',
    	'#FF0099',
    	'#FF00CC',
    	'#FF00FF',
    	'#FF3300',
    	'#FF3333',
    	'#FF3366',
    	'#FF3399',
    	'#FF33CC',
    	'#FF33FF',
    	'#FF6600',
    	'#FF6633',
    	'#FF9900',
    	'#FF9933',
    	'#FFCC00',
    	'#FFCC33'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    // eslint-disable-next-line complexity
    function useColors() {
    	// NB: In an Electron preload script, document will be defined but not fully
    	// initialized. Since we know we're in Chrome, we'll just detect this case
    	// explicitly
    	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    		return true;
    	}

    	// Internet Explorer and Edge do not support colors.
    	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    		return false;
    	}

    	// Is webkit? http://stackoverflow.com/a/16459606/376773
    	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    		// Is firebug? http://stackoverflow.com/a/398120/376773
    		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    		// Is firefox >= v31?
    		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    		// Double check webkit in userAgent just in case we are in a worker
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }

    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
    	args[0] = (this.useColors ? '%c' : '') +
    		this.namespace +
    		(this.useColors ? ' %c' : ' ') +
    		args[0] +
    		(this.useColors ? '%c ' : ' ') +
    		'+' + module.exports.humanize(this.diff);

    	if (!this.useColors) {
    		return;
    	}

    	const c = 'color: ' + this.color;
    	args.splice(1, 0, c, 'color: inherit');

    	// The final "%c" is somewhat tricky, because there could be other
    	// arguments passed either before or after the %c, so we need to
    	// figure out the correct index to insert the CSS into
    	let index = 0;
    	let lastC = 0;
    	args[0].replace(/%[a-zA-Z%]/g, match => {
    		if (match === '%%') {
    			return;
    		}
    		index++;
    		if (match === '%c') {
    			// We only are interested in the *last* %c
    			// (the user may have provided their own)
    			lastC = index;
    		}
    	});

    	args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.debug()` when available.
     * No-op when `console.debug` is not a "function".
     * If `console.debug` is not available, falls back
     * to `console.log`.
     *
     * @api public
     */
    exports.log = console.debug || console.log || (() => {});

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */
    function save(namespaces) {
    	try {
    		if (namespaces) {
    			exports.storage.setItem('debug', namespaces);
    		} else {
    			exports.storage.removeItem('debug');
    		}
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */
    function load() {
    	let r;
    	try {
    		r = exports.storage.getItem('debug');
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}

    	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    	if (!r && typeof process !== 'undefined' && 'env' in process) {
    		r = process.env.DEBUG;
    	}

    	return r;
    }

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
    	try {
    		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    		// The Browser also has localStorage in the global context.
    		return localStorage;
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    module.exports = common$2(exports);

    const {formatters} = module.exports;

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    formatters.j = function (v) {
    	try {
    		return JSON.stringify(v);
    	} catch (error) {
    		return '[UnexpectedJSONParseError]: ' + error.message;
    	}
    };
    });

    var url_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.url = void 0;

    const debug = browser$2("socket.io-client:url");
    /**
     * URL parser.
     *
     * @param uri - url
     * @param path - the request path of the connection
     * @param loc - An object meant to mimic window.location.
     *        Defaults to window.location.
     * @public
     */
    function url(uri, path = "", loc) {
        let obj = uri;
        // default to window.location
        loc = loc || (typeof location !== "undefined" && location);
        if (null == uri)
            uri = loc.protocol + "//" + loc.host;
        // relative path support
        if (typeof uri === "string") {
            if ("/" === uri.charAt(0)) {
                if ("/" === uri.charAt(1)) {
                    uri = loc.protocol + uri;
                }
                else {
                    uri = loc.host + uri;
                }
            }
            if (!/^(https?|wss?):\/\//.test(uri)) {
                debug("protocol-less url %s", uri);
                if ("undefined" !== typeof loc) {
                    uri = loc.protocol + "//" + uri;
                }
                else {
                    uri = "https://" + uri;
                }
            }
            // parse
            debug("parse %s", uri);
            obj = parseuri(uri);
        }
        // make sure we treat `localhost:80` and `localhost` equally
        if (!obj.port) {
            if (/^(http|ws)$/.test(obj.protocol)) {
                obj.port = "80";
            }
            else if (/^(http|ws)s$/.test(obj.protocol)) {
                obj.port = "443";
            }
        }
        obj.path = obj.path || "/";
        const ipv6 = obj.host.indexOf(":") !== -1;
        const host = ipv6 ? "[" + obj.host + "]" : obj.host;
        // define unique id
        obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
        // define href
        obj.href =
            obj.protocol +
                "://" +
                host +
                (loc && loc.port === obj.port ? "" : ":" + obj.port);
        return obj;
    }
    exports.url = url;
    });

    var hasCors = createCommonjsModule(function (module) {
    /**
     * Module exports.
     *
     * Logic borrowed from Modernizr:
     *
     *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
     */

    try {
      module.exports = typeof XMLHttpRequest !== 'undefined' &&
        'withCredentials' in new XMLHttpRequest();
    } catch (err) {
      // if XMLHttp support is disabled in IE then it will throw
      // when trying to create
      module.exports = false;
    }
    });

    var globalThis_browser = (() => {
      if (typeof self !== "undefined") {
        return self;
      } else if (typeof window !== "undefined") {
        return window;
      } else {
        return Function("return this")();
      }
    })();

    // browser shim for xmlhttprequest module




    var xmlhttprequest = function(opts) {
      const xdomain = opts.xdomain;

      // scheme must be same when usign XDomainRequest
      // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
      const xscheme = opts.xscheme;

      // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
      // https://github.com/Automattic/engine.io-client/pull/217
      const enablesXDR = opts.enablesXDR;

      // XMLHttpRequest can be disabled on IE
      try {
        if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCors)) {
          return new XMLHttpRequest();
        }
      } catch (e) {}

      // Use XDomainRequest for IE8 if enablesXDR is true
      // because loading bar keeps flashing when using jsonp-polling
      // https://github.com/yujiosaka/socke.io-ie8-loading-example
      try {
        if ("undefined" !== typeof XDomainRequest && !xscheme && enablesXDR) {
          return new XDomainRequest();
        }
      } catch (e) {}

      if (!xdomain) {
        try {
          return new globalThis_browser[["Active"].concat("Object").join("X")](
            "Microsoft.XMLHTTP"
          );
        } catch (e) {}
      }
    };

    const PACKET_TYPES$1 = Object.create(null); // no Map = no polyfill
    PACKET_TYPES$1["open"] = "0";
    PACKET_TYPES$1["close"] = "1";
    PACKET_TYPES$1["ping"] = "2";
    PACKET_TYPES$1["pong"] = "3";
    PACKET_TYPES$1["message"] = "4";
    PACKET_TYPES$1["upgrade"] = "5";
    PACKET_TYPES$1["noop"] = "6";

    const PACKET_TYPES_REVERSE$1 = Object.create(null);
    Object.keys(PACKET_TYPES$1).forEach(key => {
      PACKET_TYPES_REVERSE$1[PACKET_TYPES$1[key]] = key;
    });

    const ERROR_PACKET$1 = { type: "error", data: "parser error" };

    var commons = {
      PACKET_TYPES: PACKET_TYPES$1,
      PACKET_TYPES_REVERSE: PACKET_TYPES_REVERSE$1,
      ERROR_PACKET: ERROR_PACKET$1
    };

    const { PACKET_TYPES } = commons;

    const withNativeBlob =
      typeof Blob === "function" ||
      (typeof Blob !== "undefined" &&
        Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
    const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";

    // ArrayBuffer.isView method is not defined in IE10
    const isView = obj => {
      return typeof ArrayBuffer.isView === "function"
        ? ArrayBuffer.isView(obj)
        : obj && obj.buffer instanceof ArrayBuffer;
    };

    const encodePacket = ({ type, data }, supportsBinary, callback) => {
      if (withNativeBlob && data instanceof Blob) {
        if (supportsBinary) {
          return callback(data);
        } else {
          return encodeBlobAsBase64(data, callback);
        }
      } else if (
        withNativeArrayBuffer$1 &&
        (data instanceof ArrayBuffer || isView(data))
      ) {
        if (supportsBinary) {
          return callback(data);
        } else {
          return encodeBlobAsBase64(new Blob([data]), callback);
        }
      }
      // plain string
      return callback(PACKET_TYPES[type] + (data || ""));
    };

    const encodeBlobAsBase64 = (data, callback) => {
      const fileReader = new FileReader();
      fileReader.onload = function() {
        const content = fileReader.result.split(",")[1];
        callback("b" + content);
      };
      return fileReader.readAsDataURL(data);
    };

    var encodePacket_browser = encodePacket;

    /*
     * base64-arraybuffer
     * https://github.com/niklasvh/base64-arraybuffer
     *
     * Copyright (c) 2012 Niklas von Hertzen
     * Licensed under the MIT license.
     */

    var base64Arraybuffer = createCommonjsModule(function (module, exports) {
    (function(chars){

      exports.encode = function(arraybuffer) {
        var bytes = new Uint8Array(arraybuffer),
        i, len = bytes.length, base64 = "";

        for (i = 0; i < len; i+=3) {
          base64 += chars[bytes[i] >> 2];
          base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
          base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
          base64 += chars[bytes[i + 2] & 63];
        }

        if ((len % 3) === 2) {
          base64 = base64.substring(0, base64.length - 1) + "=";
        } else if (len % 3 === 1) {
          base64 = base64.substring(0, base64.length - 2) + "==";
        }

        return base64;
      };

      exports.decode =  function(base64) {
        var bufferLength = base64.length * 0.75,
        len = base64.length, i, p = 0,
        encoded1, encoded2, encoded3, encoded4;

        if (base64[base64.length - 1] === "=") {
          bufferLength--;
          if (base64[base64.length - 2] === "=") {
            bufferLength--;
          }
        }

        var arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

        for (i = 0; i < len; i+=4) {
          encoded1 = chars.indexOf(base64[i]);
          encoded2 = chars.indexOf(base64[i+1]);
          encoded3 = chars.indexOf(base64[i+2]);
          encoded4 = chars.indexOf(base64[i+3]);

          bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
          bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
          bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }

        return arraybuffer;
      };
    })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
    });

    const { PACKET_TYPES_REVERSE, ERROR_PACKET } = commons;

    const withNativeArrayBuffer = typeof ArrayBuffer === "function";

    let base64decoder;
    if (withNativeArrayBuffer) {
      base64decoder = base64Arraybuffer;
    }

    const decodePacket = (encodedPacket, binaryType) => {
      if (typeof encodedPacket !== "string") {
        return {
          type: "message",
          data: mapBinary(encodedPacket, binaryType)
        };
      }
      const type = encodedPacket.charAt(0);
      if (type === "b") {
        return {
          type: "message",
          data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
        };
      }
      const packetType = PACKET_TYPES_REVERSE[type];
      if (!packetType) {
        return ERROR_PACKET;
      }
      return encodedPacket.length > 1
        ? {
            type: PACKET_TYPES_REVERSE[type],
            data: encodedPacket.substring(1)
          }
        : {
            type: PACKET_TYPES_REVERSE[type]
          };
    };

    const decodeBase64Packet = (data, binaryType) => {
      if (base64decoder) {
        const decoded = base64decoder.decode(data);
        return mapBinary(decoded, binaryType);
      } else {
        return { base64: true, data }; // fallback for old browsers
      }
    };

    const mapBinary = (data, binaryType) => {
      switch (binaryType) {
        case "blob":
          return data instanceof ArrayBuffer ? new Blob([data]) : data;
        case "arraybuffer":
        default:
          return data; // assuming the data is already an ArrayBuffer
      }
    };

    var decodePacket_browser = decodePacket;

    const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text

    const encodePayload = (packets, callback) => {
      // some packets may be added to the array while encoding, so the initial length must be saved
      const length = packets.length;
      const encodedPackets = new Array(length);
      let count = 0;

      packets.forEach((packet, i) => {
        // force base64 encoding for binary packets
        encodePacket_browser(packet, false, encodedPacket => {
          encodedPackets[i] = encodedPacket;
          if (++count === length) {
            callback(encodedPackets.join(SEPARATOR));
          }
        });
      });
    };

    const decodePayload = (encodedPayload, binaryType) => {
      const encodedPackets = encodedPayload.split(SEPARATOR);
      const packets = [];
      for (let i = 0; i < encodedPackets.length; i++) {
        const decodedPacket = decodePacket_browser(encodedPackets[i], binaryType);
        packets.push(decodedPacket);
        if (decodedPacket.type === "error") {
          break;
        }
      }
      return packets;
    };

    var lib$1 = {
      protocol: 4,
      encodePacket: encodePacket_browser,
      encodePayload,
      decodePacket: decodePacket_browser,
      decodePayload
    };

    var componentEmitter = createCommonjsModule(function (module) {
    /**
     * Expose `Emitter`.
     */

    {
      module.exports = Emitter;
    }

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
      if (obj) return mixin(obj);
    }
    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }
      return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on =
    Emitter.prototype.addEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
        .push(fn);
      return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn){
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};

      // all
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }

      // specific event
      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this;

      // remove all handlers
      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      }

      // remove specific handler
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }

      // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.
      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event){
      this._callbacks = this._callbacks || {};

      var args = new Array(arguments.length - 1)
        , callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    };

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event){
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event){
      return !! this.listeners(event).length;
    };
    });

    var pick$2 = (obj, ...attr) => {
      return attr.reduce((acc, k) => {
        if (obj.hasOwnProperty(k)) {
          acc[k] = obj[k];
        }
        return acc;
      }, {});
    };

    // Keep a reference to the real timeout functions so they can be used when overridden
    const NATIVE_SET_TIMEOUT = setTimeout;
    const NATIVE_CLEAR_TIMEOUT = clearTimeout;

    var installTimerFunctions$3 = (obj, opts) => {
      if (opts.useNativeTimers) {
        obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThis_browser);
        obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThis_browser);
      } else {
        obj.setTimeoutFn = setTimeout.bind(globalThis_browser);
        obj.clearTimeoutFn = clearTimeout.bind(globalThis_browser);
      }
    };

    var util = {
    	pick: pick$2,
    	installTimerFunctions: installTimerFunctions$3
    };

    /**
     * Helpers.
     */
    var s$1 = 1000;
    var m$1 = s$1 * 60;
    var h$1 = m$1 * 60;
    var d$1 = h$1 * 24;
    var w$1 = d$1 * 7;
    var y$1 = d$1 * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    var ms$1 = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse$1(val);
      } else if (type === 'number' && isFinite(val)) {
        return options.long ? fmtLong$1(val) : fmtShort$1(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse$1(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y$1;
        case 'weeks':
        case 'week':
        case 'w':
          return n * w$1;
        case 'days':
        case 'day':
        case 'd':
          return n * d$1;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h$1;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m$1;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s$1;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtShort$1(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d$1) {
        return Math.round(ms / d$1) + 'd';
      }
      if (msAbs >= h$1) {
        return Math.round(ms / h$1) + 'h';
      }
      if (msAbs >= m$1) {
        return Math.round(ms / m$1) + 'm';
      }
      if (msAbs >= s$1) {
        return Math.round(ms / s$1) + 's';
      }
      return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtLong$1(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d$1) {
        return plural$1(ms, msAbs, d$1, 'day');
      }
      if (msAbs >= h$1) {
        return plural$1(ms, msAbs, h$1, 'hour');
      }
      if (msAbs >= m$1) {
        return plural$1(ms, msAbs, m$1, 'minute');
      }
      if (msAbs >= s$1) {
        return plural$1(ms, msAbs, s$1, 'second');
      }
      return ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural$1(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
    }

    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     */

    function setup$1(env) {
    	createDebug.debug = createDebug;
    	createDebug.default = createDebug;
    	createDebug.coerce = coerce;
    	createDebug.disable = disable;
    	createDebug.enable = enable;
    	createDebug.enabled = enabled;
    	createDebug.humanize = ms$1;
    	createDebug.destroy = destroy;

    	Object.keys(env).forEach(key => {
    		createDebug[key] = env[key];
    	});

    	/**
    	* The currently active debug mode names, and names to skip.
    	*/

    	createDebug.names = [];
    	createDebug.skips = [];

    	/**
    	* Map of special "%n" handling functions, for the debug "format" argument.
    	*
    	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
    	*/
    	createDebug.formatters = {};

    	/**
    	* Selects a color for a debug namespace
    	* @param {String} namespace The namespace string for the for the debug instance to be colored
    	* @return {Number|String} An ANSI color code for the given namespace
    	* @api private
    	*/
    	function selectColor(namespace) {
    		let hash = 0;

    		for (let i = 0; i < namespace.length; i++) {
    			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    			hash |= 0; // Convert to 32bit integer
    		}

    		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    	}
    	createDebug.selectColor = selectColor;

    	/**
    	* Create a debugger with the given `namespace`.
    	*
    	* @param {String} namespace
    	* @return {Function}
    	* @api public
    	*/
    	function createDebug(namespace) {
    		let prevTime;
    		let enableOverride = null;
    		let namespacesCache;
    		let enabledCache;

    		function debug(...args) {
    			// Disabled?
    			if (!debug.enabled) {
    				return;
    			}

    			const self = debug;

    			// Set `diff` timestamp
    			const curr = Number(new Date());
    			const ms = curr - (prevTime || curr);
    			self.diff = ms;
    			self.prev = prevTime;
    			self.curr = curr;
    			prevTime = curr;

    			args[0] = createDebug.coerce(args[0]);

    			if (typeof args[0] !== 'string') {
    				// Anything else let's inspect with %O
    				args.unshift('%O');
    			}

    			// Apply any `formatters` transformations
    			let index = 0;
    			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    				// If we encounter an escaped % then don't increase the array index
    				if (match === '%%') {
    					return '%';
    				}
    				index++;
    				const formatter = createDebug.formatters[format];
    				if (typeof formatter === 'function') {
    					const val = args[index];
    					match = formatter.call(self, val);

    					// Now we need to remove `args[index]` since it's inlined in the `format`
    					args.splice(index, 1);
    					index--;
    				}
    				return match;
    			});

    			// Apply env-specific formatting (colors, etc.)
    			createDebug.formatArgs.call(self, args);

    			const logFn = self.log || createDebug.log;
    			logFn.apply(self, args);
    		}

    		debug.namespace = namespace;
    		debug.useColors = createDebug.useColors();
    		debug.color = createDebug.selectColor(namespace);
    		debug.extend = extend;
    		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    		Object.defineProperty(debug, 'enabled', {
    			enumerable: true,
    			configurable: false,
    			get: () => {
    				if (enableOverride !== null) {
    					return enableOverride;
    				}
    				if (namespacesCache !== createDebug.namespaces) {
    					namespacesCache = createDebug.namespaces;
    					enabledCache = createDebug.enabled(namespace);
    				}

    				return enabledCache;
    			},
    			set: v => {
    				enableOverride = v;
    			}
    		});

    		// Env-specific initialization logic for debug instances
    		if (typeof createDebug.init === 'function') {
    			createDebug.init(debug);
    		}

    		return debug;
    	}

    	function extend(namespace, delimiter) {
    		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    		newDebug.log = this.log;
    		return newDebug;
    	}

    	/**
    	* Enables a debug mode by namespaces. This can include modes
    	* separated by a colon and wildcards.
    	*
    	* @param {String} namespaces
    	* @api public
    	*/
    	function enable(namespaces) {
    		createDebug.save(namespaces);
    		createDebug.namespaces = namespaces;

    		createDebug.names = [];
    		createDebug.skips = [];

    		let i;
    		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    		const len = split.length;

    		for (i = 0; i < len; i++) {
    			if (!split[i]) {
    				// ignore empty strings
    				continue;
    			}

    			namespaces = split[i].replace(/\*/g, '.*?');

    			if (namespaces[0] === '-') {
    				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    			} else {
    				createDebug.names.push(new RegExp('^' + namespaces + '$'));
    			}
    		}
    	}

    	/**
    	* Disable debug output.
    	*
    	* @return {String} namespaces
    	* @api public
    	*/
    	function disable() {
    		const namespaces = [
    			...createDebug.names.map(toNamespace),
    			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
    		].join(',');
    		createDebug.enable('');
    		return namespaces;
    	}

    	/**
    	* Returns true if the given mode name is enabled, false otherwise.
    	*
    	* @param {String} name
    	* @return {Boolean}
    	* @api public
    	*/
    	function enabled(name) {
    		if (name[name.length - 1] === '*') {
    			return true;
    		}

    		let i;
    		let len;

    		for (i = 0, len = createDebug.skips.length; i < len; i++) {
    			if (createDebug.skips[i].test(name)) {
    				return false;
    			}
    		}

    		for (i = 0, len = createDebug.names.length; i < len; i++) {
    			if (createDebug.names[i].test(name)) {
    				return true;
    			}
    		}

    		return false;
    	}

    	/**
    	* Convert regexp to namespace
    	*
    	* @param {RegExp} regxep
    	* @return {String} namespace
    	* @api private
    	*/
    	function toNamespace(regexp) {
    		return regexp.toString()
    			.substring(2, regexp.toString().length - 2)
    			.replace(/\.\*\?$/, '*');
    	}

    	/**
    	* Coerce `val`.
    	*
    	* @param {Mixed} val
    	* @return {Mixed}
    	* @api private
    	*/
    	function coerce(val) {
    		if (val instanceof Error) {
    			return val.stack || val.message;
    		}
    		return val;
    	}

    	/**
    	* XXX DO NOT USE. This is a temporary stub function.
    	* XXX It WILL be removed in the next major release.
    	*/
    	function destroy() {
    		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    	}

    	createDebug.enable(createDebug.load());

    	return createDebug;
    }

    var common$1 = setup$1;

    /* eslint-env browser */

    var browser$1 = createCommonjsModule(function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     */

    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = (() => {
    	let warned = false;

    	return () => {
    		if (!warned) {
    			warned = true;
    			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    		}
    	};
    })();

    /**
     * Colors.
     */

    exports.colors = [
    	'#0000CC',
    	'#0000FF',
    	'#0033CC',
    	'#0033FF',
    	'#0066CC',
    	'#0066FF',
    	'#0099CC',
    	'#0099FF',
    	'#00CC00',
    	'#00CC33',
    	'#00CC66',
    	'#00CC99',
    	'#00CCCC',
    	'#00CCFF',
    	'#3300CC',
    	'#3300FF',
    	'#3333CC',
    	'#3333FF',
    	'#3366CC',
    	'#3366FF',
    	'#3399CC',
    	'#3399FF',
    	'#33CC00',
    	'#33CC33',
    	'#33CC66',
    	'#33CC99',
    	'#33CCCC',
    	'#33CCFF',
    	'#6600CC',
    	'#6600FF',
    	'#6633CC',
    	'#6633FF',
    	'#66CC00',
    	'#66CC33',
    	'#9900CC',
    	'#9900FF',
    	'#9933CC',
    	'#9933FF',
    	'#99CC00',
    	'#99CC33',
    	'#CC0000',
    	'#CC0033',
    	'#CC0066',
    	'#CC0099',
    	'#CC00CC',
    	'#CC00FF',
    	'#CC3300',
    	'#CC3333',
    	'#CC3366',
    	'#CC3399',
    	'#CC33CC',
    	'#CC33FF',
    	'#CC6600',
    	'#CC6633',
    	'#CC9900',
    	'#CC9933',
    	'#CCCC00',
    	'#CCCC33',
    	'#FF0000',
    	'#FF0033',
    	'#FF0066',
    	'#FF0099',
    	'#FF00CC',
    	'#FF00FF',
    	'#FF3300',
    	'#FF3333',
    	'#FF3366',
    	'#FF3399',
    	'#FF33CC',
    	'#FF33FF',
    	'#FF6600',
    	'#FF6633',
    	'#FF9900',
    	'#FF9933',
    	'#FFCC00',
    	'#FFCC33'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    // eslint-disable-next-line complexity
    function useColors() {
    	// NB: In an Electron preload script, document will be defined but not fully
    	// initialized. Since we know we're in Chrome, we'll just detect this case
    	// explicitly
    	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    		return true;
    	}

    	// Internet Explorer and Edge do not support colors.
    	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    		return false;
    	}

    	// Is webkit? http://stackoverflow.com/a/16459606/376773
    	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    		// Is firebug? http://stackoverflow.com/a/398120/376773
    		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    		// Is firefox >= v31?
    		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    		// Double check webkit in userAgent just in case we are in a worker
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }

    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
    	args[0] = (this.useColors ? '%c' : '') +
    		this.namespace +
    		(this.useColors ? ' %c' : ' ') +
    		args[0] +
    		(this.useColors ? '%c ' : ' ') +
    		'+' + module.exports.humanize(this.diff);

    	if (!this.useColors) {
    		return;
    	}

    	const c = 'color: ' + this.color;
    	args.splice(1, 0, c, 'color: inherit');

    	// The final "%c" is somewhat tricky, because there could be other
    	// arguments passed either before or after the %c, so we need to
    	// figure out the correct index to insert the CSS into
    	let index = 0;
    	let lastC = 0;
    	args[0].replace(/%[a-zA-Z%]/g, match => {
    		if (match === '%%') {
    			return;
    		}
    		index++;
    		if (match === '%c') {
    			// We only are interested in the *last* %c
    			// (the user may have provided their own)
    			lastC = index;
    		}
    	});

    	args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.debug()` when available.
     * No-op when `console.debug` is not a "function".
     * If `console.debug` is not available, falls back
     * to `console.log`.
     *
     * @api public
     */
    exports.log = console.debug || console.log || (() => {});

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */
    function save(namespaces) {
    	try {
    		if (namespaces) {
    			exports.storage.setItem('debug', namespaces);
    		} else {
    			exports.storage.removeItem('debug');
    		}
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */
    function load() {
    	let r;
    	try {
    		r = exports.storage.getItem('debug');
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}

    	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    	if (!r && typeof process !== 'undefined' && 'env' in process) {
    		r = process.env.DEBUG;
    	}

    	return r;
    }

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
    	try {
    		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    		// The Browser also has localStorage in the global context.
    		return localStorage;
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    module.exports = common$1(exports);

    const {formatters} = module.exports;

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    formatters.j = function (v) {
    	try {
    		return JSON.stringify(v);
    	} catch (error) {
    		return '[UnexpectedJSONParseError]: ' + error.message;
    	}
    };
    });

    const { installTimerFunctions: installTimerFunctions$2 } = util;
    const debug$4 = browser$1("engine.io-client:transport");

    class Transport$1 extends componentEmitter {
      /**
       * Transport abstract constructor.
       *
       * @param {Object} options.
       * @api private
       */
      constructor(opts) {
        super();
        installTimerFunctions$2(this, opts);

        this.opts = opts;
        this.query = opts.query;
        this.readyState = "";
        this.socket = opts.socket;
      }

      /**
       * Emits an error.
       *
       * @param {String} str
       * @return {Transport} for chaining
       * @api public
       */
      onError(msg, desc) {
        const err = new Error(msg);
        err.type = "TransportError";
        err.description = desc;
        this.emit("error", err);
        return this;
      }

      /**
       * Opens the transport.
       *
       * @api public
       */
      open() {
        if ("closed" === this.readyState || "" === this.readyState) {
          this.readyState = "opening";
          this.doOpen();
        }

        return this;
      }

      /**
       * Closes the transport.
       *
       * @api private
       */
      close() {
        if ("opening" === this.readyState || "open" === this.readyState) {
          this.doClose();
          this.onClose();
        }

        return this;
      }

      /**
       * Sends multiple packets.
       *
       * @param {Array} packets
       * @api private
       */
      send(packets) {
        if ("open" === this.readyState) {
          this.write(packets);
        } else {
          // this might happen if the transport was silently closed in the beforeunload event handler
          debug$4("transport is not open, discarding packets");
        }
      }

      /**
       * Called upon open
       *
       * @api private
       */
      onOpen() {
        this.readyState = "open";
        this.writable = true;
        this.emit("open");
      }

      /**
       * Called with data.
       *
       * @param {String} data
       * @api private
       */
      onData(data) {
        const packet = lib$1.decodePacket(data, this.socket.binaryType);
        this.onPacket(packet);
      }

      /**
       * Called with a decoded packet.
       */
      onPacket(packet) {
        this.emit("packet", packet);
      }

      /**
       * Called upon close.
       *
       * @api private
       */
      onClose() {
        this.readyState = "closed";
        this.emit("close");
      }
    }

    var transport = Transport$1;

    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */
    var encode$1 = function (obj) {
      var str = '';

      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (str.length) str += '&';
          str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
        }
      }

      return str;
    };

    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */

    var decode$1 = function(qs){
      var qry = {};
      var pairs = qs.split('&');
      for (var i = 0, l = pairs.length; i < l; i++) {
        var pair = pairs[i].split('=');
        qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      return qry;
    };

    var parseqs = {
    	encode: encode$1,
    	decode: decode$1
    };

    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
      , length = 64
      , map = {}
      , seed = 0
      , i = 0
      , prev;

    /**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */
    function encode(num) {
      var encoded = '';

      do {
        encoded = alphabet[num % length] + encoded;
        num = Math.floor(num / length);
      } while (num > 0);

      return encoded;
    }

    /**
     * Return the integer value specified by the given string.
     *
     * @param {String} str The string to convert.
     * @returns {Number} The integer value represented by the string.
     * @api public
     */
    function decode(str) {
      var decoded = 0;

      for (i = 0; i < str.length; i++) {
        decoded = decoded * length + map[str.charAt(i)];
      }

      return decoded;
    }

    /**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */
    function yeast() {
      var now = encode(+new Date());

      if (now !== prev) return seed = 0, prev = now;
      return now +'.'+ encode(seed++);
    }

    //
    // Map each character to its index.
    //
    for (; i < length; i++) map[alphabet[i]] = i;

    //
    // Expose the `yeast`, `encode` and `decode` functions.
    //
    yeast.encode = encode;
    yeast.decode = decode;
    var yeast_1 = yeast;

    const debug$3 = browser$1("engine.io-client:polling");

    class Polling extends transport {
      /**
       * Transport name.
       */
      get name() {
        return "polling";
      }

      /**
       * Opens the socket (triggers polling). We write a PING message to determine
       * when the transport is open.
       *
       * @api private
       */
      doOpen() {
        this.poll();
      }

      /**
       * Pauses polling.
       *
       * @param {Function} callback upon buffers are flushed and transport is paused
       * @api private
       */
      pause(onPause) {
        this.readyState = "pausing";

        const pause = () => {
          debug$3("paused");
          this.readyState = "paused";
          onPause();
        };

        if (this.polling || !this.writable) {
          let total = 0;

          if (this.polling) {
            debug$3("we are currently polling - waiting to pause");
            total++;
            this.once("pollComplete", function() {
              debug$3("pre-pause polling complete");
              --total || pause();
            });
          }

          if (!this.writable) {
            debug$3("we are currently writing - waiting to pause");
            total++;
            this.once("drain", function() {
              debug$3("pre-pause writing complete");
              --total || pause();
            });
          }
        } else {
          pause();
        }
      }

      /**
       * Starts polling cycle.
       *
       * @api public
       */
      poll() {
        debug$3("polling");
        this.polling = true;
        this.doPoll();
        this.emit("poll");
      }

      /**
       * Overloads onData to detect payloads.
       *
       * @api private
       */
      onData(data) {
        debug$3("polling got data %s", data);
        const callback = packet => {
          // if its the first message we consider the transport open
          if ("opening" === this.readyState && packet.type === "open") {
            this.onOpen();
          }

          // if its a close packet, we close the ongoing requests
          if ("close" === packet.type) {
            this.onClose();
            return false;
          }

          // otherwise bypass onData and handle the message
          this.onPacket(packet);
        };

        // decode payload
        lib$1.decodePayload(data, this.socket.binaryType).forEach(callback);

        // if an event did not trigger closing
        if ("closed" !== this.readyState) {
          // if we got data we're not polling
          this.polling = false;
          this.emit("pollComplete");

          if ("open" === this.readyState) {
            this.poll();
          } else {
            debug$3('ignoring poll - transport state "%s"', this.readyState);
          }
        }
      }

      /**
       * For polling, send a close packet.
       *
       * @api private
       */
      doClose() {
        const close = () => {
          debug$3("writing close packet");
          this.write([{ type: "close" }]);
        };

        if ("open" === this.readyState) {
          debug$3("transport open - closing");
          close();
        } else {
          // in case we're trying to close while
          // handshaking is in progress (GH-164)
          debug$3("transport not open - deferring close");
          this.once("open", close);
        }
      }

      /**
       * Writes a packets payload.
       *
       * @param {Array} data packets
       * @param {Function} drain callback
       * @api private
       */
      write(packets) {
        this.writable = false;

        lib$1.encodePayload(packets, data => {
          this.doWrite(data, () => {
            this.writable = true;
            this.emit("drain");
          });
        });
      }

      /**
       * Generates uri for connection.
       *
       * @api private
       */
      uri() {
        let query = this.query || {};
        const schema = this.opts.secure ? "https" : "http";
        let port = "";

        // cache busting is forced
        if (false !== this.opts.timestampRequests) {
          query[this.opts.timestampParam] = yeast_1();
        }

        if (!this.supportsBinary && !query.sid) {
          query.b64 = 1;
        }

        query = parseqs.encode(query);

        // avoid port if default for schema
        if (
          this.opts.port &&
          (("https" === schema && Number(this.opts.port) !== 443) ||
            ("http" === schema && Number(this.opts.port) !== 80))
        ) {
          port = ":" + this.opts.port;
        }

        // prepend ? to query
        if (query.length) {
          query = "?" + query;
        }

        const ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return (
          schema +
          "://" +
          (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
          port +
          this.opts.path +
          query
        );
      }
    }

    var polling$1 = Polling;

    /* global attachEvent */

    const { pick: pick$1, installTimerFunctions: installTimerFunctions$1 } = util;


    const debug$2 = browser$1("engine.io-client:polling-xhr");

    /**
     * Empty function
     */

    function empty() {}

    const hasXHR2 = (function() {
      const xhr = new xmlhttprequest({ xdomain: false });
      return null != xhr.responseType;
    })();

    class XHR extends polling$1 {
      /**
       * XHR Polling constructor.
       *
       * @param {Object} opts
       * @api public
       */
      constructor(opts) {
        super(opts);

        if (typeof location !== "undefined") {
          const isSSL = "https:" === location.protocol;
          let port = location.port;

          // some user agents have empty `location.port`
          if (!port) {
            port = isSSL ? 443 : 80;
          }

          this.xd =
            (typeof location !== "undefined" &&
              opts.hostname !== location.hostname) ||
            port !== opts.port;
          this.xs = opts.secure !== isSSL;
        }
        /**
         * XHR supports binary
         */
        const forceBase64 = opts && opts.forceBase64;
        this.supportsBinary = hasXHR2 && !forceBase64;
      }

      /**
       * Creates a request.
       *
       * @param {String} method
       * @api private
       */
      request(opts = {}) {
        Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
        return new Request(this.uri(), opts);
      }

      /**
       * Sends data.
       *
       * @param {String} data to send.
       * @param {Function} called upon flush.
       * @api private
       */
      doWrite(data, fn) {
        const req = this.request({
          method: "POST",
          data: data
        });
        req.on("success", fn);
        req.on("error", err => {
          this.onError("xhr post error", err);
        });
      }

      /**
       * Starts a poll cycle.
       *
       * @api private
       */
      doPoll() {
        debug$2("xhr poll");
        const req = this.request();
        req.on("data", this.onData.bind(this));
        req.on("error", err => {
          this.onError("xhr poll error", err);
        });
        this.pollXhr = req;
      }
    }

    class Request extends componentEmitter {
      /**
       * Request constructor
       *
       * @param {Object} options
       * @api public
       */
      constructor(uri, opts) {
        super();
        installTimerFunctions$1(this, opts);
        this.opts = opts;

        this.method = opts.method || "GET";
        this.uri = uri;
        this.async = false !== opts.async;
        this.data = undefined !== opts.data ? opts.data : null;

        this.create();
      }

      /**
       * Creates the XHR object and sends the request.
       *
       * @api private
       */
      create() {
        const opts = pick$1(
          this.opts,
          "agent",
          "enablesXDR",
          "pfx",
          "key",
          "passphrase",
          "cert",
          "ca",
          "ciphers",
          "rejectUnauthorized",
          "autoUnref"
        );
        opts.xdomain = !!this.opts.xd;
        opts.xscheme = !!this.opts.xs;

        const xhr = (this.xhr = new xmlhttprequest(opts));

        try {
          debug$2("xhr open %s: %s", this.method, this.uri);
          xhr.open(this.method, this.uri, this.async);
          try {
            if (this.opts.extraHeaders) {
              xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
              for (let i in this.opts.extraHeaders) {
                if (this.opts.extraHeaders.hasOwnProperty(i)) {
                  xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                }
              }
            }
          } catch (e) {}

          if ("POST" === this.method) {
            try {
              xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
            } catch (e) {}
          }

          try {
            xhr.setRequestHeader("Accept", "*/*");
          } catch (e) {}

          // ie6 check
          if ("withCredentials" in xhr) {
            xhr.withCredentials = this.opts.withCredentials;
          }

          if (this.opts.requestTimeout) {
            xhr.timeout = this.opts.requestTimeout;
          }

          if (this.hasXDR()) {
            xhr.onload = () => {
              this.onLoad();
            };
            xhr.onerror = () => {
              this.onError(xhr.responseText);
            };
          } else {
            xhr.onreadystatechange = () => {
              if (4 !== xhr.readyState) return;
              if (200 === xhr.status || 1223 === xhr.status) {
                this.onLoad();
              } else {
                // make sure the `error` event handler that's user-set
                // does not throw in the same tick and gets caught here
                this.setTimeoutFn(() => {
                  this.onError(typeof xhr.status === "number" ? xhr.status : 0);
                }, 0);
              }
            };
          }

          debug$2("xhr data %s", this.data);
          xhr.send(this.data);
        } catch (e) {
          // Need to defer since .create() is called directly from the constructor
          // and thus the 'error' event can only be only bound *after* this exception
          // occurs.  Therefore, also, we cannot throw here at all.
          this.setTimeoutFn(() => {
            this.onError(e);
          }, 0);
          return;
        }

        if (typeof document !== "undefined") {
          this.index = Request.requestsCount++;
          Request.requests[this.index] = this;
        }
      }

      /**
       * Called upon successful response.
       *
       * @api private
       */
      onSuccess() {
        this.emit("success");
        this.cleanup();
      }

      /**
       * Called if we have data.
       *
       * @api private
       */
      onData(data) {
        this.emit("data", data);
        this.onSuccess();
      }

      /**
       * Called upon error.
       *
       * @api private
       */
      onError(err) {
        this.emit("error", err);
        this.cleanup(true);
      }

      /**
       * Cleans up house.
       *
       * @api private
       */
      cleanup(fromError) {
        if ("undefined" === typeof this.xhr || null === this.xhr) {
          return;
        }
        // xmlhttprequest
        if (this.hasXDR()) {
          this.xhr.onload = this.xhr.onerror = empty;
        } else {
          this.xhr.onreadystatechange = empty;
        }

        if (fromError) {
          try {
            this.xhr.abort();
          } catch (e) {}
        }

        if (typeof document !== "undefined") {
          delete Request.requests[this.index];
        }

        this.xhr = null;
      }

      /**
       * Called upon load.
       *
       * @api private
       */
      onLoad() {
        const data = this.xhr.responseText;
        if (data !== null) {
          this.onData(data);
        }
      }

      /**
       * Check if it has XDomainRequest.
       *
       * @api private
       */
      hasXDR() {
        return typeof XDomainRequest !== "undefined" && !this.xs && this.enablesXDR;
      }

      /**
       * Aborts the request.
       *
       * @api public
       */
      abort() {
        this.cleanup();
      }
    }

    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */

    Request.requestsCount = 0;
    Request.requests = {};

    if (typeof document !== "undefined") {
      if (typeof attachEvent === "function") {
        attachEvent("onunload", unloadHandler);
      } else if (typeof addEventListener === "function") {
        const terminationEvent = "onpagehide" in globalThis_browser ? "pagehide" : "unload";
        addEventListener(terminationEvent, unloadHandler, false);
      }
    }

    function unloadHandler() {
      for (let i in Request.requests) {
        if (Request.requests.hasOwnProperty(i)) {
          Request.requests[i].abort();
        }
      }
    }

    var pollingXhr = XHR;
    var Request_1 = Request;
    pollingXhr.Request = Request_1;

    const rNewline = /\n/g;
    const rEscapedNewline = /\\n/g;

    /**
     * Global JSONP callbacks.
     */

    let callbacks;

    class JSONPPolling extends polling$1 {
      /**
       * JSONP Polling constructor.
       *
       * @param {Object} opts.
       * @api public
       */
      constructor(opts) {
        super(opts);

        this.query = this.query || {};

        // define global callbacks array if not present
        // we do this here (lazily) to avoid unneeded global pollution
        if (!callbacks) {
          // we need to consider multiple engines in the same page
          callbacks = globalThis_browser.___eio = globalThis_browser.___eio || [];
        }

        // callback identifier
        this.index = callbacks.length;

        // add callback to jsonp global
        callbacks.push(this.onData.bind(this));

        // append to query string
        this.query.j = this.index;
      }

      /**
       * JSONP only supports binary as base64 encoded strings
       */
      get supportsBinary() {
        return false;
      }

      /**
       * Closes the socket.
       *
       * @api private
       */
      doClose() {
        if (this.script) {
          // prevent spurious errors from being emitted when the window is unloaded
          this.script.onerror = () => {};
          this.script.parentNode.removeChild(this.script);
          this.script = null;
        }

        if (this.form) {
          this.form.parentNode.removeChild(this.form);
          this.form = null;
          this.iframe = null;
        }

        super.doClose();
      }

      /**
       * Starts a poll cycle.
       *
       * @api private
       */
      doPoll() {
        const script = document.createElement("script");

        if (this.script) {
          this.script.parentNode.removeChild(this.script);
          this.script = null;
        }

        script.async = true;
        script.src = this.uri();
        script.onerror = e => {
          this.onError("jsonp poll error", e);
        };

        const insertAt = document.getElementsByTagName("script")[0];
        if (insertAt) {
          insertAt.parentNode.insertBefore(script, insertAt);
        } else {
          (document.head || document.body).appendChild(script);
        }
        this.script = script;

        const isUAgecko =
          "undefined" !== typeof navigator && /gecko/i.test(navigator.userAgent);

        if (isUAgecko) {
          this.setTimeoutFn(function() {
            const iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            document.body.removeChild(iframe);
          }, 100);
        }
      }

      /**
       * Writes with a hidden iframe.
       *
       * @param {String} data to send
       * @param {Function} called upon flush.
       * @api private
       */
      doWrite(data, fn) {
        let iframe;

        if (!this.form) {
          const form = document.createElement("form");
          const area = document.createElement("textarea");
          const id = (this.iframeId = "eio_iframe_" + this.index);

          form.className = "socketio";
          form.style.position = "absolute";
          form.style.top = "-1000px";
          form.style.left = "-1000px";
          form.target = id;
          form.method = "POST";
          form.setAttribute("accept-charset", "utf-8");
          area.name = "d";
          form.appendChild(area);
          document.body.appendChild(form);

          this.form = form;
          this.area = area;
        }

        this.form.action = this.uri();

        function complete() {
          initIframe();
          fn();
        }

        const initIframe = () => {
          if (this.iframe) {
            try {
              this.form.removeChild(this.iframe);
            } catch (e) {
              this.onError("jsonp polling iframe removal error", e);
            }
          }

          try {
            // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
            const html = '<iframe src="javascript:0" name="' + this.iframeId + '">';
            iframe = document.createElement(html);
          } catch (e) {
            iframe = document.createElement("iframe");
            iframe.name = this.iframeId;
            iframe.src = "javascript:0";
          }

          iframe.id = this.iframeId;

          this.form.appendChild(iframe);
          this.iframe = iframe;
        };

        initIframe();

        // escape \n to prevent it from being converted into \r\n by some UAs
        // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
        data = data.replace(rEscapedNewline, "\\\n");
        this.area.value = data.replace(rNewline, "\\n");

        try {
          this.form.submit();
        } catch (e) {}

        if (this.iframe.attachEvent) {
          this.iframe.onreadystatechange = () => {
            if (this.iframe.readyState === "complete") {
              complete();
            }
          };
        } else {
          this.iframe.onload = complete;
        }
      }
    }

    var pollingJsonp = JSONPPolling;

    const nextTick$1 = (() => {
      const isPromiseAvailable =
        typeof Promise === "function" && typeof Promise.resolve === "function";
      if (isPromiseAvailable) {
        return cb => Promise.resolve().then(cb);
      } else {
        return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
      }
    })();

    var websocketConstructor_browser = {
      WebSocket: globalThis_browser.WebSocket || globalThis_browser.MozWebSocket,
      usingBrowserWebSocket: true,
      defaultBinaryType: "arraybuffer",
      nextTick: nextTick$1
    };

    const { pick } = util;
    const {
      WebSocket,
      usingBrowserWebSocket,
      defaultBinaryType,
      nextTick
    } = websocketConstructor_browser;

    const debug$1 = browser$1("engine.io-client:websocket");

    // detect ReactNative environment
    const isReactNative =
      typeof navigator !== "undefined" &&
      typeof navigator.product === "string" &&
      navigator.product.toLowerCase() === "reactnative";

    class WS extends transport {
      /**
       * WebSocket transport constructor.
       *
       * @api {Object} connection options
       * @api public
       */
      constructor(opts) {
        super(opts);

        this.supportsBinary = !opts.forceBase64;
      }

      /**
       * Transport name.
       *
       * @api public
       */
      get name() {
        return "websocket";
      }

      /**
       * Opens socket.
       *
       * @api private
       */
      doOpen() {
        if (!this.check()) {
          // let probe timeout
          return;
        }

        const uri = this.uri();
        const protocols = this.opts.protocols;

        // React Native only supports the 'headers' option, and will print a warning if anything else is passed
        const opts = isReactNative
          ? {}
          : pick(
              this.opts,
              "agent",
              "perMessageDeflate",
              "pfx",
              "key",
              "passphrase",
              "cert",
              "ca",
              "ciphers",
              "rejectUnauthorized",
              "localAddress",
              "protocolVersion",
              "origin",
              "maxPayload",
              "family",
              "checkServerIdentity"
            );

        if (this.opts.extraHeaders) {
          opts.headers = this.opts.extraHeaders;
        }

        try {
          this.ws =
            usingBrowserWebSocket && !isReactNative
              ? protocols
                ? new WebSocket(uri, protocols)
                : new WebSocket(uri)
              : new WebSocket(uri, protocols, opts);
        } catch (err) {
          return this.emit("error", err);
        }

        this.ws.binaryType = this.socket.binaryType || defaultBinaryType;

        this.addEventListeners();
      }

      /**
       * Adds event listeners to the socket
       *
       * @api private
       */
      addEventListeners() {
        this.ws.onopen = () => {
          if (this.opts.autoUnref) {
            this.ws._socket.unref();
          }
          this.onOpen();
        };
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onmessage = ev => this.onData(ev.data);
        this.ws.onerror = e => this.onError("websocket error", e);
      }

      /**
       * Writes data to socket.
       *
       * @param {Array} array of packets.
       * @api private
       */
      write(packets) {
        this.writable = false;

        // encodePacket efficient as it uses WS framing
        // no need for encodePayload
        for (let i = 0; i < packets.length; i++) {
          const packet = packets[i];
          const lastPacket = i === packets.length - 1;

          lib$1.encodePacket(packet, this.supportsBinary, data => {
            // always create a new object (GH-437)
            const opts = {};
            if (!usingBrowserWebSocket) {
              if (packet.options) {
                opts.compress = packet.options.compress;
              }

              if (this.opts.perMessageDeflate) {
                const len =
                  "string" === typeof data ? Buffer.byteLength(data) : data.length;
                if (len < this.opts.perMessageDeflate.threshold) {
                  opts.compress = false;
                }
              }
            }

            // Sometimes the websocket has already been closed but the browser didn't
            // have a chance of informing us about it yet, in that case send will
            // throw an error
            try {
              if (usingBrowserWebSocket) {
                // TypeError is thrown when passing the second argument on Safari
                this.ws.send(data);
              } else {
                this.ws.send(data, opts);
              }
            } catch (e) {
              debug$1("websocket closed before onclose event");
            }

            if (lastPacket) {
              // fake drain
              // defer to next tick to allow Socket to clear writeBuffer
              nextTick(() => {
                this.writable = true;
                this.emit("drain");
              }, this.setTimeoutFn);
            }
          });
        }
      }

      /**
       * Called upon close
       *
       * @api private
       */
      onClose() {
        transport.prototype.onClose.call(this);
      }

      /**
       * Closes socket.
       *
       * @api private
       */
      doClose() {
        if (typeof this.ws !== "undefined") {
          this.ws.close();
          this.ws = null;
        }
      }

      /**
       * Generates uri for connection.
       *
       * @api private
       */
      uri() {
        let query = this.query || {};
        const schema = this.opts.secure ? "wss" : "ws";
        let port = "";

        // avoid port if default for schema
        if (
          this.opts.port &&
          (("wss" === schema && Number(this.opts.port) !== 443) ||
            ("ws" === schema && Number(this.opts.port) !== 80))
        ) {
          port = ":" + this.opts.port;
        }

        // append timestamp to URI
        if (this.opts.timestampRequests) {
          query[this.opts.timestampParam] = yeast_1();
        }

        // communicate binary support capabilities
        if (!this.supportsBinary) {
          query.b64 = 1;
        }

        query = parseqs.encode(query);

        // prepend ? to query
        if (query.length) {
          query = "?" + query;
        }

        const ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return (
          schema +
          "://" +
          (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
          port +
          this.opts.path +
          query
        );
      }

      /**
       * Feature detection for WebSocket.
       *
       * @return {Boolean} whether this transport is available.
       * @api public
       */
      check() {
        return (
          !!WebSocket &&
          !("__initialize" in WebSocket && this.name === WS.prototype.name)
        );
      }
    }

    var websocket = WS;

    var polling_1 = polling;
    var websocket_1 = websocket;

    /**
     * Polling transport polymorphic constructor.
     * Decides on xhr vs jsonp based on feature detection.
     *
     * @api private
     */

    function polling(opts) {
      let xhr;
      let xd = false;
      let xs = false;
      const jsonp = false !== opts.jsonp;

      if (typeof location !== "undefined") {
        const isSSL = "https:" === location.protocol;
        let port = location.port;

        // some user agents have empty `location.port`
        if (!port) {
          port = isSSL ? 443 : 80;
        }

        xd = opts.hostname !== location.hostname || port !== opts.port;
        xs = opts.secure !== isSSL;
      }

      opts.xdomain = xd;
      opts.xscheme = xs;
      xhr = new xmlhttprequest(opts);

      if ("open" in xhr && !opts.forceJSONP) {
        return new pollingXhr(opts);
      } else {
        if (!jsonp) throw new Error("JSONP disabled");
        return new pollingJsonp(opts);
      }
    }

    var transports$1 = {
    	polling: polling_1,
    	websocket: websocket_1
    };

    const debug = browser$1("engine.io-client:socket");



    const { installTimerFunctions } = util;

    class Socket extends componentEmitter {
      /**
       * Socket constructor.
       *
       * @param {String|Object} uri or options
       * @param {Object} options
       * @api public
       */
      constructor(uri, opts = {}) {
        super();

        if (uri && "object" === typeof uri) {
          opts = uri;
          uri = null;
        }

        if (uri) {
          uri = parseuri(uri);
          opts.hostname = uri.host;
          opts.secure = uri.protocol === "https" || uri.protocol === "wss";
          opts.port = uri.port;
          if (uri.query) opts.query = uri.query;
        } else if (opts.host) {
          opts.hostname = parseuri(opts.host).host;
        }

        installTimerFunctions(this, opts);

        this.secure =
          null != opts.secure
            ? opts.secure
            : typeof location !== "undefined" && "https:" === location.protocol;

        if (opts.hostname && !opts.port) {
          // if no port is specified manually, use the protocol default
          opts.port = this.secure ? "443" : "80";
        }

        this.hostname =
          opts.hostname ||
          (typeof location !== "undefined" ? location.hostname : "localhost");
        this.port =
          opts.port ||
          (typeof location !== "undefined" && location.port
            ? location.port
            : this.secure
            ? 443
            : 80);

        this.transports = opts.transports || ["polling", "websocket"];
        this.readyState = "";
        this.writeBuffer = [];
        this.prevBufferLen = 0;

        this.opts = Object.assign(
          {
            path: "/engine.io",
            agent: false,
            withCredentials: false,
            upgrade: true,
            jsonp: true,
            timestampParam: "t",
            rememberUpgrade: false,
            rejectUnauthorized: true,
            perMessageDeflate: {
              threshold: 1024
            },
            transportOptions: {},
            closeOnBeforeunload: true
          },
          opts
        );

        this.opts.path = this.opts.path.replace(/\/$/, "") + "/";

        if (typeof this.opts.query === "string") {
          this.opts.query = parseqs.decode(this.opts.query);
        }

        // set on handshake
        this.id = null;
        this.upgrades = null;
        this.pingInterval = null;
        this.pingTimeout = null;

        // set on heartbeat
        this.pingTimeoutTimer = null;

        if (typeof addEventListener === "function") {
          if (this.opts.closeOnBeforeunload) {
            // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
            // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
            // closed/reloaded)
            addEventListener(
              "beforeunload",
              () => {
                if (this.transport) {
                  // silently close the transport
                  this.transport.removeAllListeners();
                  this.transport.close();
                }
              },
              false
            );
          }
          if (this.hostname !== "localhost") {
            this.offlineEventListener = () => {
              this.onClose("transport close");
            };
            addEventListener("offline", this.offlineEventListener, false);
          }
        }

        this.open();
      }

      /**
       * Creates transport of the given type.
       *
       * @param {String} transport name
       * @return {Transport}
       * @api private
       */
      createTransport(name) {
        debug('creating transport "%s"', name);
        const query = clone(this.opts.query);

        // append engine.io protocol identifier
        query.EIO = lib$1.protocol;

        // transport name
        query.transport = name;

        // session id if we already have one
        if (this.id) query.sid = this.id;

        const opts = Object.assign(
          {},
          this.opts.transportOptions[name],
          this.opts,
          {
            query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port
          }
        );

        debug("options: %j", opts);

        return new transports$1[name](opts);
      }

      /**
       * Initializes transport to use and starts probe.
       *
       * @api private
       */
      open() {
        let transport;
        if (
          this.opts.rememberUpgrade &&
          Socket.priorWebsocketSuccess &&
          this.transports.indexOf("websocket") !== -1
        ) {
          transport = "websocket";
        } else if (0 === this.transports.length) {
          // Emit error on next tick so it can be listened to
          this.setTimeoutFn(() => {
            this.emit("error", "No transports available");
          }, 0);
          return;
        } else {
          transport = this.transports[0];
        }
        this.readyState = "opening";

        // Retry with the next transport if the transport is disabled (jsonp: false)
        try {
          transport = this.createTransport(transport);
        } catch (e) {
          debug("error while creating transport: %s", e);
          this.transports.shift();
          this.open();
          return;
        }

        transport.open();
        this.setTransport(transport);
      }

      /**
       * Sets the current transport. Disables the existing one (if any).
       *
       * @api private
       */
      setTransport(transport) {
        debug("setting transport %s", transport.name);

        if (this.transport) {
          debug("clearing existing transport %s", this.transport.name);
          this.transport.removeAllListeners();
        }

        // set up transport
        this.transport = transport;

        // set up transport listeners
        transport
          .on("drain", this.onDrain.bind(this))
          .on("packet", this.onPacket.bind(this))
          .on("error", this.onError.bind(this))
          .on("close", () => {
            this.onClose("transport close");
          });
      }

      /**
       * Probes a transport.
       *
       * @param {String} transport name
       * @api private
       */
      probe(name) {
        debug('probing transport "%s"', name);
        let transport = this.createTransport(name, { probe: 1 });
        let failed = false;

        Socket.priorWebsocketSuccess = false;

        const onTransportOpen = () => {
          if (failed) return;

          debug('probe transport "%s" opened', name);
          transport.send([{ type: "ping", data: "probe" }]);
          transport.once("packet", msg => {
            if (failed) return;
            if ("pong" === msg.type && "probe" === msg.data) {
              debug('probe transport "%s" pong', name);
              this.upgrading = true;
              this.emit("upgrading", transport);
              if (!transport) return;
              Socket.priorWebsocketSuccess = "websocket" === transport.name;

              debug('pausing current transport "%s"', this.transport.name);
              this.transport.pause(() => {
                if (failed) return;
                if ("closed" === this.readyState) return;
                debug("changing transport and sending upgrade packet");

                cleanup();

                this.setTransport(transport);
                transport.send([{ type: "upgrade" }]);
                this.emit("upgrade", transport);
                transport = null;
                this.upgrading = false;
                this.flush();
              });
            } else {
              debug('probe transport "%s" failed', name);
              const err = new Error("probe error");
              err.transport = transport.name;
              this.emit("upgradeError", err);
            }
          });
        };

        function freezeTransport() {
          if (failed) return;

          // Any callback called by transport should be ignored since now
          failed = true;

          cleanup();

          transport.close();
          transport = null;
        }

        // Handle any error that happens while probing
        const onerror = err => {
          const error = new Error("probe error: " + err);
          error.transport = transport.name;

          freezeTransport();

          debug('probe transport "%s" failed because of error: %s', name, err);

          this.emit("upgradeError", error);
        };

        function onTransportClose() {
          onerror("transport closed");
        }

        // When the socket is closed while we're probing
        function onclose() {
          onerror("socket closed");
        }

        // When the socket is upgraded while we're probing
        function onupgrade(to) {
          if (transport && to.name !== transport.name) {
            debug('"%s" works - aborting "%s"', to.name, transport.name);
            freezeTransport();
          }
        }

        // Remove all listeners on the transport and on self
        const cleanup = () => {
          transport.removeListener("open", onTransportOpen);
          transport.removeListener("error", onerror);
          transport.removeListener("close", onTransportClose);
          this.removeListener("close", onclose);
          this.removeListener("upgrading", onupgrade);
        };

        transport.once("open", onTransportOpen);
        transport.once("error", onerror);
        transport.once("close", onTransportClose);

        this.once("close", onclose);
        this.once("upgrading", onupgrade);

        transport.open();
      }

      /**
       * Called when connection is deemed open.
       *
       * @api public
       */
      onOpen() {
        debug("socket open");
        this.readyState = "open";
        Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
        this.emit("open");
        this.flush();

        // we check for `readyState` in case an `open`
        // listener already closed the socket
        if (
          "open" === this.readyState &&
          this.opts.upgrade &&
          this.transport.pause
        ) {
          debug("starting upgrade probes");
          let i = 0;
          const l = this.upgrades.length;
          for (; i < l; i++) {
            this.probe(this.upgrades[i]);
          }
        }
      }

      /**
       * Handles a packet.
       *
       * @api private
       */
      onPacket(packet) {
        if (
          "opening" === this.readyState ||
          "open" === this.readyState ||
          "closing" === this.readyState
        ) {
          debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

          this.emit("packet", packet);

          // Socket is live - any packet counts
          this.emit("heartbeat");

          switch (packet.type) {
            case "open":
              this.onHandshake(JSON.parse(packet.data));
              break;

            case "ping":
              this.resetPingTimeout();
              this.sendPacket("pong");
              this.emit("ping");
              this.emit("pong");
              break;

            case "error":
              const err = new Error("server error");
              err.code = packet.data;
              this.onError(err);
              break;

            case "message":
              this.emit("data", packet.data);
              this.emit("message", packet.data);
              break;
          }
        } else {
          debug('packet received with socket readyState "%s"', this.readyState);
        }
      }

      /**
       * Called upon handshake completion.
       *
       * @param {Object} handshake obj
       * @api private
       */
      onHandshake(data) {
        this.emit("handshake", data);
        this.id = data.sid;
        this.transport.query.sid = data.sid;
        this.upgrades = this.filterUpgrades(data.upgrades);
        this.pingInterval = data.pingInterval;
        this.pingTimeout = data.pingTimeout;
        this.onOpen();
        // In case open handler closes socket
        if ("closed" === this.readyState) return;
        this.resetPingTimeout();
      }

      /**
       * Sets and resets ping timeout timer based on server pings.
       *
       * @api private
       */
      resetPingTimeout() {
        this.clearTimeoutFn(this.pingTimeoutTimer);
        this.pingTimeoutTimer = this.setTimeoutFn(() => {
          this.onClose("ping timeout");
        }, this.pingInterval + this.pingTimeout);
        if (this.opts.autoUnref) {
          this.pingTimeoutTimer.unref();
        }
      }

      /**
       * Called on `drain` event
       *
       * @api private
       */
      onDrain() {
        this.writeBuffer.splice(0, this.prevBufferLen);

        // setting prevBufferLen = 0 is very important
        // for example, when upgrading, upgrade packet is sent over,
        // and a nonzero prevBufferLen could cause problems on `drain`
        this.prevBufferLen = 0;

        if (0 === this.writeBuffer.length) {
          this.emit("drain");
        } else {
          this.flush();
        }
      }

      /**
       * Flush write buffers.
       *
       * @api private
       */
      flush() {
        if (
          "closed" !== this.readyState &&
          this.transport.writable &&
          !this.upgrading &&
          this.writeBuffer.length
        ) {
          debug("flushing %d packets in socket", this.writeBuffer.length);
          this.transport.send(this.writeBuffer);
          // keep track of current length of writeBuffer
          // splice writeBuffer and callbackBuffer on `drain`
          this.prevBufferLen = this.writeBuffer.length;
          this.emit("flush");
        }
      }

      /**
       * Sends a message.
       *
       * @param {String} message.
       * @param {Function} callback function.
       * @param {Object} options.
       * @return {Socket} for chaining.
       * @api public
       */
      write(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
      }

      send(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
      }

      /**
       * Sends a packet.
       *
       * @param {String} packet type.
       * @param {String} data.
       * @param {Object} options.
       * @param {Function} callback function.
       * @api private
       */
      sendPacket(type, data, options, fn) {
        if ("function" === typeof data) {
          fn = data;
          data = undefined;
        }

        if ("function" === typeof options) {
          fn = options;
          options = null;
        }

        if ("closing" === this.readyState || "closed" === this.readyState) {
          return;
        }

        options = options || {};
        options.compress = false !== options.compress;

        const packet = {
          type: type,
          data: data,
          options: options
        };
        this.emit("packetCreate", packet);
        this.writeBuffer.push(packet);
        if (fn) this.once("flush", fn);
        this.flush();
      }

      /**
       * Closes the connection.
       *
       * @api private
       */
      close() {
        const close = () => {
          this.onClose("forced close");
          debug("socket closing - telling transport to close");
          this.transport.close();
        };

        const cleanupAndClose = () => {
          this.removeListener("upgrade", cleanupAndClose);
          this.removeListener("upgradeError", cleanupAndClose);
          close();
        };

        const waitForUpgrade = () => {
          // wait for upgrade to finish since we can't send packets while pausing a transport
          this.once("upgrade", cleanupAndClose);
          this.once("upgradeError", cleanupAndClose);
        };

        if ("opening" === this.readyState || "open" === this.readyState) {
          this.readyState = "closing";

          if (this.writeBuffer.length) {
            this.once("drain", () => {
              if (this.upgrading) {
                waitForUpgrade();
              } else {
                close();
              }
            });
          } else if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        }

        return this;
      }

      /**
       * Called upon transport error
       *
       * @api private
       */
      onError(err) {
        debug("socket error %j", err);
        Socket.priorWebsocketSuccess = false;
        this.emit("error", err);
        this.onClose("transport error", err);
      }

      /**
       * Called upon transport close.
       *
       * @api private
       */
      onClose(reason, desc) {
        if (
          "opening" === this.readyState ||
          "open" === this.readyState ||
          "closing" === this.readyState
        ) {
          debug('socket close with reason: "%s"', reason);

          // clear timers
          this.clearTimeoutFn(this.pingIntervalTimer);
          this.clearTimeoutFn(this.pingTimeoutTimer);

          // stop event from firing again for transport
          this.transport.removeAllListeners("close");

          // ensure transport won't stay open
          this.transport.close();

          // ignore further transport communication
          this.transport.removeAllListeners();

          if (typeof removeEventListener === "function") {
            removeEventListener("offline", this.offlineEventListener, false);
          }

          // set ready state
          this.readyState = "closed";

          // clear session id
          this.id = null;

          // emit close event
          this.emit("close", reason, desc);

          // clean buffers after, so users can still
          // grab the buffers on `close` event
          this.writeBuffer = [];
          this.prevBufferLen = 0;
        }
      }

      /**
       * Filters upgrades, returning only those matching client transports.
       *
       * @param {Array} server upgrades
       * @api private
       *
       */
      filterUpgrades(upgrades) {
        const filteredUpgrades = [];
        let i = 0;
        const j = upgrades.length;
        for (; i < j; i++) {
          if (~this.transports.indexOf(upgrades[i]))
            filteredUpgrades.push(upgrades[i]);
        }
        return filteredUpgrades;
      }
    }

    Socket.priorWebsocketSuccess = false;

    /**
     * Protocol version.
     *
     * @api public
     */

    Socket.protocol = lib$1.protocol; // this is an int

    function clone(obj) {
      const o = {};
      for (let i in obj) {
        if (obj.hasOwnProperty(i)) {
          o[i] = obj[i];
        }
      }
      return o;
    }

    var socket$1 = Socket;

    var lib = (uri, opts) => new socket$1(uri, opts);

    /**
     * Expose deps for legacy compatibility
     * and standalone browser access.
     */

    var Socket_1 = socket$1;
    var protocol = socket$1.protocol; // this is an int
    var Transport = transport;
    var transports = transports$1;
    var parser = lib$1;
    lib.Socket = Socket_1;
    lib.protocol = protocol;
    lib.Transport = Transport;
    lib.transports = transports;
    lib.parser = parser;

    var isBinary_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasBinary = exports.isBinary = void 0;
    const withNativeArrayBuffer = typeof ArrayBuffer === "function";
    const isView = (obj) => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj.buffer instanceof ArrayBuffer;
    };
    const toString = Object.prototype.toString;
    const withNativeBlob = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            toString.call(Blob) === "[object BlobConstructor]");
    const withNativeFile = typeof File === "function" ||
        (typeof File !== "undefined" &&
            toString.call(File) === "[object FileConstructor]");
    /**
     * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
     *
     * @private
     */
    function isBinary(obj) {
        return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
            (withNativeBlob && obj instanceof Blob) ||
            (withNativeFile && obj instanceof File));
    }
    exports.isBinary = isBinary;
    function hasBinary(obj, toJSON) {
        if (!obj || typeof obj !== "object") {
            return false;
        }
        if (Array.isArray(obj)) {
            for (let i = 0, l = obj.length; i < l; i++) {
                if (hasBinary(obj[i])) {
                    return true;
                }
            }
            return false;
        }
        if (isBinary(obj)) {
            return true;
        }
        if (obj.toJSON &&
            typeof obj.toJSON === "function" &&
            arguments.length === 1) {
            return hasBinary(obj.toJSON(), true);
        }
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
                return true;
            }
        }
        return false;
    }
    exports.hasBinary = hasBinary;
    });

    var binary = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reconstructPacket = exports.deconstructPacket = void 0;

    /**
     * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @public
     */
    function deconstructPacket(packet) {
        const buffers = [];
        const packetData = packet.data;
        const pack = packet;
        pack.data = _deconstructPacket(packetData, buffers);
        pack.attachments = buffers.length; // number of binary 'attachments'
        return { packet: pack, buffers: buffers };
    }
    exports.deconstructPacket = deconstructPacket;
    function _deconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (isBinary_1.isBinary(data)) {
            const placeholder = { _placeholder: true, num: buffers.length };
            buffers.push(data);
            return placeholder;
        }
        else if (Array.isArray(data)) {
            const newData = new Array(data.length);
            for (let i = 0; i < data.length; i++) {
                newData[i] = _deconstructPacket(data[i], buffers);
            }
            return newData;
        }
        else if (typeof data === "object" && !(data instanceof Date)) {
            const newData = {};
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    newData[key] = _deconstructPacket(data[key], buffers);
                }
            }
            return newData;
        }
        return data;
    }
    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @public
     */
    function reconstructPacket(packet, buffers) {
        packet.data = _reconstructPacket(packet.data, buffers);
        packet.attachments = undefined; // no longer useful
        return packet;
    }
    exports.reconstructPacket = reconstructPacket;
    function _reconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (data && data._placeholder) {
            return buffers[data.num]; // appropriate buffer (should be natural order anyway)
        }
        else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                data[i] = _reconstructPacket(data[i], buffers);
            }
        }
        else if (typeof data === "object") {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    data[key] = _reconstructPacket(data[key], buffers);
                }
            }
        }
        return data;
    }
    });

    /**
     * Helpers.
     */
    var s = 1000;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    var ms = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse(val);
      } else if (type === 'number' && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y;
        case 'weeks':
        case 'week':
        case 'w':
          return n * w;
        case 'days':
        case 'day':
        case 'd':
          return n * d;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + 'd';
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + 'h';
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + 'm';
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + 's';
      }
      return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, 'day');
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, 'hour');
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, 'minute');
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, 'second');
      }
      return ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
    }

    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     */

    function setup(env) {
    	createDebug.debug = createDebug;
    	createDebug.default = createDebug;
    	createDebug.coerce = coerce;
    	createDebug.disable = disable;
    	createDebug.enable = enable;
    	createDebug.enabled = enabled;
    	createDebug.humanize = ms;
    	createDebug.destroy = destroy;

    	Object.keys(env).forEach(key => {
    		createDebug[key] = env[key];
    	});

    	/**
    	* The currently active debug mode names, and names to skip.
    	*/

    	createDebug.names = [];
    	createDebug.skips = [];

    	/**
    	* Map of special "%n" handling functions, for the debug "format" argument.
    	*
    	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
    	*/
    	createDebug.formatters = {};

    	/**
    	* Selects a color for a debug namespace
    	* @param {String} namespace The namespace string for the for the debug instance to be colored
    	* @return {Number|String} An ANSI color code for the given namespace
    	* @api private
    	*/
    	function selectColor(namespace) {
    		let hash = 0;

    		for (let i = 0; i < namespace.length; i++) {
    			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    			hash |= 0; // Convert to 32bit integer
    		}

    		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    	}
    	createDebug.selectColor = selectColor;

    	/**
    	* Create a debugger with the given `namespace`.
    	*
    	* @param {String} namespace
    	* @return {Function}
    	* @api public
    	*/
    	function createDebug(namespace) {
    		let prevTime;
    		let enableOverride = null;
    		let namespacesCache;
    		let enabledCache;

    		function debug(...args) {
    			// Disabled?
    			if (!debug.enabled) {
    				return;
    			}

    			const self = debug;

    			// Set `diff` timestamp
    			const curr = Number(new Date());
    			const ms = curr - (prevTime || curr);
    			self.diff = ms;
    			self.prev = prevTime;
    			self.curr = curr;
    			prevTime = curr;

    			args[0] = createDebug.coerce(args[0]);

    			if (typeof args[0] !== 'string') {
    				// Anything else let's inspect with %O
    				args.unshift('%O');
    			}

    			// Apply any `formatters` transformations
    			let index = 0;
    			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    				// If we encounter an escaped % then don't increase the array index
    				if (match === '%%') {
    					return '%';
    				}
    				index++;
    				const formatter = createDebug.formatters[format];
    				if (typeof formatter === 'function') {
    					const val = args[index];
    					match = formatter.call(self, val);

    					// Now we need to remove `args[index]` since it's inlined in the `format`
    					args.splice(index, 1);
    					index--;
    				}
    				return match;
    			});

    			// Apply env-specific formatting (colors, etc.)
    			createDebug.formatArgs.call(self, args);

    			const logFn = self.log || createDebug.log;
    			logFn.apply(self, args);
    		}

    		debug.namespace = namespace;
    		debug.useColors = createDebug.useColors();
    		debug.color = createDebug.selectColor(namespace);
    		debug.extend = extend;
    		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    		Object.defineProperty(debug, 'enabled', {
    			enumerable: true,
    			configurable: false,
    			get: () => {
    				if (enableOverride !== null) {
    					return enableOverride;
    				}
    				if (namespacesCache !== createDebug.namespaces) {
    					namespacesCache = createDebug.namespaces;
    					enabledCache = createDebug.enabled(namespace);
    				}

    				return enabledCache;
    			},
    			set: v => {
    				enableOverride = v;
    			}
    		});

    		// Env-specific initialization logic for debug instances
    		if (typeof createDebug.init === 'function') {
    			createDebug.init(debug);
    		}

    		return debug;
    	}

    	function extend(namespace, delimiter) {
    		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    		newDebug.log = this.log;
    		return newDebug;
    	}

    	/**
    	* Enables a debug mode by namespaces. This can include modes
    	* separated by a colon and wildcards.
    	*
    	* @param {String} namespaces
    	* @api public
    	*/
    	function enable(namespaces) {
    		createDebug.save(namespaces);
    		createDebug.namespaces = namespaces;

    		createDebug.names = [];
    		createDebug.skips = [];

    		let i;
    		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    		const len = split.length;

    		for (i = 0; i < len; i++) {
    			if (!split[i]) {
    				// ignore empty strings
    				continue;
    			}

    			namespaces = split[i].replace(/\*/g, '.*?');

    			if (namespaces[0] === '-') {
    				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    			} else {
    				createDebug.names.push(new RegExp('^' + namespaces + '$'));
    			}
    		}
    	}

    	/**
    	* Disable debug output.
    	*
    	* @return {String} namespaces
    	* @api public
    	*/
    	function disable() {
    		const namespaces = [
    			...createDebug.names.map(toNamespace),
    			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
    		].join(',');
    		createDebug.enable('');
    		return namespaces;
    	}

    	/**
    	* Returns true if the given mode name is enabled, false otherwise.
    	*
    	* @param {String} name
    	* @return {Boolean}
    	* @api public
    	*/
    	function enabled(name) {
    		if (name[name.length - 1] === '*') {
    			return true;
    		}

    		let i;
    		let len;

    		for (i = 0, len = createDebug.skips.length; i < len; i++) {
    			if (createDebug.skips[i].test(name)) {
    				return false;
    			}
    		}

    		for (i = 0, len = createDebug.names.length; i < len; i++) {
    			if (createDebug.names[i].test(name)) {
    				return true;
    			}
    		}

    		return false;
    	}

    	/**
    	* Convert regexp to namespace
    	*
    	* @param {RegExp} regxep
    	* @return {String} namespace
    	* @api private
    	*/
    	function toNamespace(regexp) {
    		return regexp.toString()
    			.substring(2, regexp.toString().length - 2)
    			.replace(/\.\*\?$/, '*');
    	}

    	/**
    	* Coerce `val`.
    	*
    	* @param {Mixed} val
    	* @return {Mixed}
    	* @api private
    	*/
    	function coerce(val) {
    		if (val instanceof Error) {
    			return val.stack || val.message;
    		}
    		return val;
    	}

    	/**
    	* XXX DO NOT USE. This is a temporary stub function.
    	* XXX It WILL be removed in the next major release.
    	*/
    	function destroy() {
    		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    	}

    	createDebug.enable(createDebug.load());

    	return createDebug;
    }

    var common = setup;

    /* eslint-env browser */

    var browser = createCommonjsModule(function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     */

    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = (() => {
    	let warned = false;

    	return () => {
    		if (!warned) {
    			warned = true;
    			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    		}
    	};
    })();

    /**
     * Colors.
     */

    exports.colors = [
    	'#0000CC',
    	'#0000FF',
    	'#0033CC',
    	'#0033FF',
    	'#0066CC',
    	'#0066FF',
    	'#0099CC',
    	'#0099FF',
    	'#00CC00',
    	'#00CC33',
    	'#00CC66',
    	'#00CC99',
    	'#00CCCC',
    	'#00CCFF',
    	'#3300CC',
    	'#3300FF',
    	'#3333CC',
    	'#3333FF',
    	'#3366CC',
    	'#3366FF',
    	'#3399CC',
    	'#3399FF',
    	'#33CC00',
    	'#33CC33',
    	'#33CC66',
    	'#33CC99',
    	'#33CCCC',
    	'#33CCFF',
    	'#6600CC',
    	'#6600FF',
    	'#6633CC',
    	'#6633FF',
    	'#66CC00',
    	'#66CC33',
    	'#9900CC',
    	'#9900FF',
    	'#9933CC',
    	'#9933FF',
    	'#99CC00',
    	'#99CC33',
    	'#CC0000',
    	'#CC0033',
    	'#CC0066',
    	'#CC0099',
    	'#CC00CC',
    	'#CC00FF',
    	'#CC3300',
    	'#CC3333',
    	'#CC3366',
    	'#CC3399',
    	'#CC33CC',
    	'#CC33FF',
    	'#CC6600',
    	'#CC6633',
    	'#CC9900',
    	'#CC9933',
    	'#CCCC00',
    	'#CCCC33',
    	'#FF0000',
    	'#FF0033',
    	'#FF0066',
    	'#FF0099',
    	'#FF00CC',
    	'#FF00FF',
    	'#FF3300',
    	'#FF3333',
    	'#FF3366',
    	'#FF3399',
    	'#FF33CC',
    	'#FF33FF',
    	'#FF6600',
    	'#FF6633',
    	'#FF9900',
    	'#FF9933',
    	'#FFCC00',
    	'#FFCC33'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    // eslint-disable-next-line complexity
    function useColors() {
    	// NB: In an Electron preload script, document will be defined but not fully
    	// initialized. Since we know we're in Chrome, we'll just detect this case
    	// explicitly
    	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    		return true;
    	}

    	// Internet Explorer and Edge do not support colors.
    	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    		return false;
    	}

    	// Is webkit? http://stackoverflow.com/a/16459606/376773
    	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    		// Is firebug? http://stackoverflow.com/a/398120/376773
    		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    		// Is firefox >= v31?
    		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    		// Double check webkit in userAgent just in case we are in a worker
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }

    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
    	args[0] = (this.useColors ? '%c' : '') +
    		this.namespace +
    		(this.useColors ? ' %c' : ' ') +
    		args[0] +
    		(this.useColors ? '%c ' : ' ') +
    		'+' + module.exports.humanize(this.diff);

    	if (!this.useColors) {
    		return;
    	}

    	const c = 'color: ' + this.color;
    	args.splice(1, 0, c, 'color: inherit');

    	// The final "%c" is somewhat tricky, because there could be other
    	// arguments passed either before or after the %c, so we need to
    	// figure out the correct index to insert the CSS into
    	let index = 0;
    	let lastC = 0;
    	args[0].replace(/%[a-zA-Z%]/g, match => {
    		if (match === '%%') {
    			return;
    		}
    		index++;
    		if (match === '%c') {
    			// We only are interested in the *last* %c
    			// (the user may have provided their own)
    			lastC = index;
    		}
    	});

    	args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.debug()` when available.
     * No-op when `console.debug` is not a "function".
     * If `console.debug` is not available, falls back
     * to `console.log`.
     *
     * @api public
     */
    exports.log = console.debug || console.log || (() => {});

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */
    function save(namespaces) {
    	try {
    		if (namespaces) {
    			exports.storage.setItem('debug', namespaces);
    		} else {
    			exports.storage.removeItem('debug');
    		}
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */
    function load() {
    	let r;
    	try {
    		r = exports.storage.getItem('debug');
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}

    	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    	if (!r && typeof process !== 'undefined' && 'env' in process) {
    		r = process.env.DEBUG;
    	}

    	return r;
    }

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
    	try {
    		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    		// The Browser also has localStorage in the global context.
    		return localStorage;
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    module.exports = common(exports);

    const {formatters} = module.exports;

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    formatters.j = function (v) {
    	try {
    		return JSON.stringify(v);
    	} catch (error) {
    		return '[UnexpectedJSONParseError]: ' + error.message;
    	}
    };
    });

    var dist = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Decoder = exports.Encoder = exports.PacketType = exports.protocol = void 0;



    const debug = browser("socket.io-parser");
    /**
     * Protocol version.
     *
     * @public
     */
    exports.protocol = 5;
    var PacketType;
    (function (PacketType) {
        PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
        PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
        PacketType[PacketType["EVENT"] = 2] = "EVENT";
        PacketType[PacketType["ACK"] = 3] = "ACK";
        PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
        PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
        PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType = exports.PacketType || (exports.PacketType = {}));
    /**
     * A socket.io Encoder instance
     */
    class Encoder {
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        encode(obj) {
            debug("encoding packet %j", obj);
            if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
                if (isBinary_1.hasBinary(obj)) {
                    obj.type =
                        obj.type === PacketType.EVENT
                            ? PacketType.BINARY_EVENT
                            : PacketType.BINARY_ACK;
                    return this.encodeAsBinary(obj);
                }
            }
            return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */
        encodeAsString(obj) {
            // first is type
            let str = "" + obj.type;
            // attachments if we have them
            if (obj.type === PacketType.BINARY_EVENT ||
                obj.type === PacketType.BINARY_ACK) {
                str += obj.attachments + "-";
            }
            // if we have a namespace other than `/`
            // we append it followed by a comma `,`
            if (obj.nsp && "/" !== obj.nsp) {
                str += obj.nsp + ",";
            }
            // immediately followed by the id
            if (null != obj.id) {
                str += obj.id;
            }
            // json data
            if (null != obj.data) {
                str += JSON.stringify(obj.data);
            }
            debug("encoded %j as %s", obj, str);
            return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */
        encodeAsBinary(obj) {
            const deconstruction = binary.deconstructPacket(obj);
            const pack = this.encodeAsString(deconstruction.packet);
            const buffers = deconstruction.buffers;
            buffers.unshift(pack); // add packet info to beginning of data list
            return buffers; // write all the buffers
        }
    }
    exports.Encoder = Encoder;
    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     */
    class Decoder extends componentEmitter {
        constructor() {
            super();
        }
        /**
         * Decodes an encoded packet string into packet JSON.
         *
         * @param {String} obj - encoded packet
         */
        add(obj) {
            let packet;
            if (typeof obj === "string") {
                packet = this.decodeString(obj);
                if (packet.type === PacketType.BINARY_EVENT ||
                    packet.type === PacketType.BINARY_ACK) {
                    // binary packet's json
                    this.reconstructor = new BinaryReconstructor(packet);
                    // no attachments, labeled binary but no binary data to follow
                    if (packet.attachments === 0) {
                        super.emit("decoded", packet);
                    }
                }
                else {
                    // non-binary full packet
                    super.emit("decoded", packet);
                }
            }
            else if (isBinary_1.isBinary(obj) || obj.base64) {
                // raw binary data
                if (!this.reconstructor) {
                    throw new Error("got binary data when not reconstructing a packet");
                }
                else {
                    packet = this.reconstructor.takeBinaryData(obj);
                    if (packet) {
                        // received final buffer
                        this.reconstructor = null;
                        super.emit("decoded", packet);
                    }
                }
            }
            else {
                throw new Error("Unknown type: " + obj);
            }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */
        decodeString(str) {
            let i = 0;
            // look up type
            const p = {
                type: Number(str.charAt(0)),
            };
            if (PacketType[p.type] === undefined) {
                throw new Error("unknown packet type " + p.type);
            }
            // look up attachments if type binary
            if (p.type === PacketType.BINARY_EVENT ||
                p.type === PacketType.BINARY_ACK) {
                const start = i + 1;
                while (str.charAt(++i) !== "-" && i != str.length) { }
                const buf = str.substring(start, i);
                if (buf != Number(buf) || str.charAt(i) !== "-") {
                    throw new Error("Illegal attachments");
                }
                p.attachments = Number(buf);
            }
            // look up namespace (if any)
            if ("/" === str.charAt(i + 1)) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if ("," === c)
                        break;
                    if (i === str.length)
                        break;
                }
                p.nsp = str.substring(start, i);
            }
            else {
                p.nsp = "/";
            }
            // look up id
            const next = str.charAt(i + 1);
            if ("" !== next && Number(next) == next) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if (null == c || Number(c) != c) {
                        --i;
                        break;
                    }
                    if (i === str.length)
                        break;
                }
                p.id = Number(str.substring(start, i + 1));
            }
            // look up json data
            if (str.charAt(++i)) {
                const payload = tryParse(str.substr(i));
                if (Decoder.isPayloadValid(p.type, payload)) {
                    p.data = payload;
                }
                else {
                    throw new Error("invalid payload");
                }
            }
            debug("decoded %s as %j", str, p);
            return p;
        }
        static isPayloadValid(type, payload) {
            switch (type) {
                case PacketType.CONNECT:
                    return typeof payload === "object";
                case PacketType.DISCONNECT:
                    return payload === undefined;
                case PacketType.CONNECT_ERROR:
                    return typeof payload === "string" || typeof payload === "object";
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    return Array.isArray(payload) && payload.length > 0;
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    return Array.isArray(payload);
            }
        }
        /**
         * Deallocates a parser's resources
         */
        destroy() {
            if (this.reconstructor) {
                this.reconstructor.finishedReconstruction();
            }
        }
    }
    exports.Decoder = Decoder;
    function tryParse(str) {
        try {
            return JSON.parse(str);
        }
        catch (e) {
            return false;
        }
    }
    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     */
    class BinaryReconstructor {
        constructor(packet) {
            this.packet = packet;
            this.buffers = [];
            this.reconPack = packet;
        }
        /**
         * Method to be called when binary data received from connection
         * after a BINARY_EVENT packet.
         *
         * @param {Buffer | ArrayBuffer} binData - the raw binary data received
         * @return {null | Object} returns null if more binary data is expected or
         *   a reconstructed packet object if all buffers have been received.
         */
        takeBinaryData(binData) {
            this.buffers.push(binData);
            if (this.buffers.length === this.reconPack.attachments) {
                // done with buffer list
                const packet = binary.reconstructPacket(this.reconPack, this.buffers);
                this.finishedReconstruction();
                return packet;
            }
            return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */
        finishedReconstruction() {
            this.reconPack = null;
            this.buffers = [];
        }
    }
    });

    var on_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.on = void 0;
    function on(obj, ev, fn) {
        obj.on(ev, fn);
        return function subDestroy() {
            obj.off(ev, fn);
        };
    }
    exports.on = on;
    });

    var typedEvents = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StrictEventEmitter = void 0;

    /**
     * Strictly typed version of an `EventEmitter`. A `TypedEventEmitter` takes type
     * parameters for mappings of event names to event data types, and strictly
     * types method calls to the `EventEmitter` according to these event maps.
     *
     * @typeParam ListenEvents - `EventsMap` of user-defined events that can be
     * listened to with `on` or `once`
     * @typeParam EmitEvents - `EventsMap` of user-defined events that can be
     * emitted with `emit`
     * @typeParam ReservedEvents - `EventsMap` of reserved events, that can be
     * emitted by socket.io with `emitReserved`, and can be listened to with
     * `listen`.
     */
    class StrictEventEmitter extends componentEmitter {
        /**
         * Adds the `listener` function as an event listener for `ev`.
         *
         * @param ev Name of the event
         * @param listener Callback function
         */
        on(ev, listener) {
            super.on(ev, listener);
            return this;
        }
        /**
         * Adds a one-time `listener` function as an event listener for `ev`.
         *
         * @param ev Name of the event
         * @param listener Callback function
         */
        once(ev, listener) {
            super.once(ev, listener);
            return this;
        }
        /**
         * Emits an event.
         *
         * @param ev Name of the event
         * @param args Values to send to listeners of this event
         */
        emit(ev, ...args) {
            super.emit(ev, ...args);
            return this;
        }
        /**
         * Emits a reserved event.
         *
         * This method is `protected`, so that only a class extending
         * `StrictEventEmitter` can emit its own reserved events.
         *
         * @param ev Reserved event name
         * @param args Arguments to emit along with the event
         */
        emitReserved(ev, ...args) {
            super.emit(ev, ...args);
            return this;
        }
        /**
         * Returns the listeners listening to an event.
         *
         * @param event Event name
         * @returns Array of listeners subscribed to `event`
         */
        listeners(event) {
            return super.listeners(event);
        }
    }
    exports.StrictEventEmitter = StrictEventEmitter;
    });

    var socket = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Socket = void 0;



    const debug = browser$2("socket.io-client:socket");
    /**
     * Internal events.
     * These events can't be emitted by the user.
     */
    const RESERVED_EVENTS = Object.freeze({
        connect: 1,
        connect_error: 1,
        disconnect: 1,
        disconnecting: 1,
        // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
        newListener: 1,
        removeListener: 1,
    });
    class Socket extends typedEvents.StrictEventEmitter {
        /**
         * `Socket` constructor.
         *
         * @public
         */
        constructor(io, nsp, opts) {
            super();
            this.connected = false;
            this.disconnected = true;
            this.receiveBuffer = [];
            this.sendBuffer = [];
            this.ids = 0;
            this.acks = {};
            this.flags = {};
            this.io = io;
            this.nsp = nsp;
            if (opts && opts.auth) {
                this.auth = opts.auth;
            }
            if (this.io._autoConnect)
                this.open();
        }
        /**
         * Subscribe to open, close and packet events
         *
         * @private
         */
        subEvents() {
            if (this.subs)
                return;
            const io = this.io;
            this.subs = [
                (0, on_1.on)(io, "open", this.onopen.bind(this)),
                (0, on_1.on)(io, "packet", this.onpacket.bind(this)),
                (0, on_1.on)(io, "error", this.onerror.bind(this)),
                (0, on_1.on)(io, "close", this.onclose.bind(this)),
            ];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects
         */
        get active() {
            return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @public
         */
        connect() {
            if (this.connected)
                return this;
            this.subEvents();
            if (!this.io["_reconnecting"])
                this.io.open(); // ensure open
            if ("open" === this.io._readyState)
                this.onopen();
            return this;
        }
        /**
         * Alias for connect()
         */
        open() {
            return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * @return self
         * @public
         */
        send(...args) {
            args.unshift("message");
            this.emit.apply(this, args);
            return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @return self
         * @public
         */
        emit(ev, ...args) {
            if (RESERVED_EVENTS.hasOwnProperty(ev)) {
                throw new Error('"' + ev + '" is a reserved event name');
            }
            args.unshift(ev);
            const packet = {
                type: dist.PacketType.EVENT,
                data: args,
            };
            packet.options = {};
            packet.options.compress = this.flags.compress !== false;
            // event ack callback
            if ("function" === typeof args[args.length - 1]) {
                debug("emitting packet with ack id %d", this.ids);
                this.acks[this.ids] = args.pop();
                packet.id = this.ids++;
            }
            const isTransportWritable = this.io.engine &&
                this.io.engine.transport &&
                this.io.engine.transport.writable;
            const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
            if (discardPacket) {
                debug("discard packet as the transport is not currently writable");
            }
            else if (this.connected) {
                this.packet(packet);
            }
            else {
                this.sendBuffer.push(packet);
            }
            this.flags = {};
            return this;
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */
        packet(packet) {
            packet.nsp = this.nsp;
            this.io._packet(packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */
        onopen() {
            debug("transport is open - connecting");
            if (typeof this.auth == "function") {
                this.auth((data) => {
                    this.packet({ type: dist.PacketType.CONNECT, data });
                });
            }
            else {
                this.packet({ type: dist.PacketType.CONNECT, data: this.auth });
            }
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */
        onerror(err) {
            if (!this.connected) {
                this.emitReserved("connect_error", err);
            }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @private
         */
        onclose(reason) {
            debug("close (%s)", reason);
            this.connected = false;
            this.disconnected = true;
            delete this.id;
            this.emitReserved("disconnect", reason);
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */
        onpacket(packet) {
            const sameNamespace = packet.nsp === this.nsp;
            if (!sameNamespace)
                return;
            switch (packet.type) {
                case dist.PacketType.CONNECT:
                    if (packet.data && packet.data.sid) {
                        const id = packet.data.sid;
                        this.onconnect(id);
                    }
                    else {
                        this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                    }
                    break;
                case dist.PacketType.EVENT:
                    this.onevent(packet);
                    break;
                case dist.PacketType.BINARY_EVENT:
                    this.onevent(packet);
                    break;
                case dist.PacketType.ACK:
                    this.onack(packet);
                    break;
                case dist.PacketType.BINARY_ACK:
                    this.onack(packet);
                    break;
                case dist.PacketType.DISCONNECT:
                    this.ondisconnect();
                    break;
                case dist.PacketType.CONNECT_ERROR:
                    const err = new Error(packet.data.message);
                    // @ts-ignore
                    err.data = packet.data.data;
                    this.emitReserved("connect_error", err);
                    break;
            }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */
        onevent(packet) {
            const args = packet.data || [];
            debug("emitting event %j", args);
            if (null != packet.id) {
                debug("attaching ack callback to event");
                args.push(this.ack(packet.id));
            }
            if (this.connected) {
                this.emitEvent(args);
            }
            else {
                this.receiveBuffer.push(Object.freeze(args));
            }
        }
        emitEvent(args) {
            if (this._anyListeners && this._anyListeners.length) {
                const listeners = this._anyListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, args);
                }
            }
            super.emit.apply(this, args);
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */
        ack(id) {
            const self = this;
            let sent = false;
            return function (...args) {
                // prevent double callbacks
                if (sent)
                    return;
                sent = true;
                debug("sending ack %j", args);
                self.packet({
                    type: dist.PacketType.ACK,
                    id: id,
                    data: args,
                });
            };
        }
        /**
         * Called upon a server acknowlegement.
         *
         * @param packet
         * @private
         */
        onack(packet) {
            const ack = this.acks[packet.id];
            if ("function" === typeof ack) {
                debug("calling ack %s with %j", packet.id, packet.data);
                ack.apply(this, packet.data);
                delete this.acks[packet.id];
            }
            else {
                debug("bad ack %s", packet.id);
            }
        }
        /**
         * Called upon server connect.
         *
         * @private
         */
        onconnect(id) {
            debug("socket connected with id %s", id);
            this.id = id;
            this.connected = true;
            this.disconnected = false;
            this.emitBuffered();
            this.emitReserved("connect");
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */
        emitBuffered() {
            this.receiveBuffer.forEach((args) => this.emitEvent(args));
            this.receiveBuffer = [];
            this.sendBuffer.forEach((packet) => this.packet(packet));
            this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */
        ondisconnect() {
            debug("server disconnect (%s)", this.nsp);
            this.destroy();
            this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */
        destroy() {
            if (this.subs) {
                // clean subscriptions to avoid reconnections
                this.subs.forEach((subDestroy) => subDestroy());
                this.subs = undefined;
            }
            this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually.
         *
         * @return self
         * @public
         */
        disconnect() {
            if (this.connected) {
                debug("performing disconnect (%s)", this.nsp);
                this.packet({ type: dist.PacketType.DISCONNECT });
            }
            // remove socket from pool
            this.destroy();
            if (this.connected) {
                // fire events
                this.onclose("io client disconnect");
            }
            return this;
        }
        /**
         * Alias for disconnect()
         *
         * @return self
         * @public
         */
        close() {
            return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         * @public
         */
        compress(compress) {
            this.flags.compress = compress;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @returns self
         * @public
         */
        get volatile() {
            this.flags.volatile = true;
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @param listener
         * @public
         */
        onAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @param listener
         * @public
         */
        prependAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @param listener
         * @public
         */
        offAny(listener) {
            if (!this._anyListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         *
         * @public
         */
        listenersAny() {
            return this._anyListeners || [];
        }
    }
    exports.Socket = Socket;
    });

    /**
     * Expose `Backoff`.
     */

    var backo2 = Backoff;

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

    function Backoff(opts) {
      opts = opts || {};
      this.ms = opts.min || 100;
      this.max = opts.max || 10000;
      this.factor = opts.factor || 2;
      this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
      this.attempts = 0;
    }

    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */

    Backoff.prototype.duration = function(){
      var ms = this.ms * Math.pow(this.factor, this.attempts++);
      if (this.jitter) {
        var rand =  Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
      }
      return Math.min(ms, this.max) | 0;
    };

    /**
     * Reset the number of attempts.
     *
     * @api public
     */

    Backoff.prototype.reset = function(){
      this.attempts = 0;
    };

    /**
     * Set the minimum duration
     *
     * @api public
     */

    Backoff.prototype.setMin = function(min){
      this.ms = min;
    };

    /**
     * Set the maximum duration
     *
     * @api public
     */

    Backoff.prototype.setMax = function(max){
      this.max = max;
    };

    /**
     * Set the jitter
     *
     * @api public
     */

    Backoff.prototype.setJitter = function(jitter){
      this.jitter = jitter;
    };

    var manager = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Manager = void 0;







    const debug = browser$2("socket.io-client:manager");
    class Manager extends typedEvents.StrictEventEmitter {
        constructor(uri, opts) {
            var _a;
            super();
            this.nsps = {};
            this.subs = [];
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = undefined;
            }
            opts = opts || {};
            opts.path = opts.path || "/socket.io";
            this.opts = opts;
            (0, util.installTimerFunctions)(this, opts);
            this.reconnection(opts.reconnection !== false);
            this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
            this.reconnectionDelay(opts.reconnectionDelay || 1000);
            this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
            this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
            this.backoff = new backo2({
                min: this.reconnectionDelay(),
                max: this.reconnectionDelayMax(),
                jitter: this.randomizationFactor(),
            });
            this.timeout(null == opts.timeout ? 20000 : opts.timeout);
            this._readyState = "closed";
            this.uri = uri;
            const _parser = opts.parser || dist;
            this.encoder = new _parser.Encoder();
            this.decoder = new _parser.Decoder();
            this._autoConnect = opts.autoConnect !== false;
            if (this._autoConnect)
                this.open();
        }
        reconnection(v) {
            if (!arguments.length)
                return this._reconnection;
            this._reconnection = !!v;
            return this;
        }
        reconnectionAttempts(v) {
            if (v === undefined)
                return this._reconnectionAttempts;
            this._reconnectionAttempts = v;
            return this;
        }
        reconnectionDelay(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelay;
            this._reconnectionDelay = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
            return this;
        }
        randomizationFactor(v) {
            var _a;
            if (v === undefined)
                return this._randomizationFactor;
            this._randomizationFactor = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
            return this;
        }
        reconnectionDelayMax(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelayMax;
            this._reconnectionDelayMax = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
            return this;
        }
        timeout(v) {
            if (!arguments.length)
                return this._timeout;
            this._timeout = v;
            return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */
        maybeReconnectOnOpen() {
            // Only try to reconnect if it's the first time we're connecting
            if (!this._reconnecting &&
                this._reconnection &&
                this.backoff.attempts === 0) {
                // keeps reconnection from firing twice for the same reconnection loop
                this.reconnect();
            }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */
        open(fn) {
            debug("readyState %s", this._readyState);
            if (~this._readyState.indexOf("open"))
                return this;
            debug("opening %s", this.uri);
            this.engine = lib(this.uri, this.opts);
            const socket = this.engine;
            const self = this;
            this._readyState = "opening";
            this.skipReconnect = false;
            // emit `open`
            const openSubDestroy = (0, on_1.on)(socket, "open", function () {
                self.onopen();
                fn && fn();
            });
            // emit `error`
            const errorSub = (0, on_1.on)(socket, "error", (err) => {
                debug("error");
                self.cleanup();
                self._readyState = "closed";
                this.emitReserved("error", err);
                if (fn) {
                    fn(err);
                }
                else {
                    // Only do this if there is no fn to handle the error
                    self.maybeReconnectOnOpen();
                }
            });
            if (false !== this._timeout) {
                const timeout = this._timeout;
                debug("connect attempt will timeout after %d", timeout);
                if (timeout === 0) {
                    openSubDestroy(); // prevents a race condition with the 'open' event
                }
                // set timer
                const timer = this.setTimeoutFn(() => {
                    debug("connect attempt timed out after %d", timeout);
                    openSubDestroy();
                    socket.close();
                    socket.emit("error", new Error("timeout"));
                }, timeout);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
            this.subs.push(openSubDestroy);
            this.subs.push(errorSub);
            return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */
        connect(fn) {
            return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */
        onopen() {
            debug("open");
            // clear old subs
            this.cleanup();
            // mark as open
            this._readyState = "open";
            this.emitReserved("open");
            // add new subs
            const socket = this.engine;
            this.subs.push((0, on_1.on)(socket, "ping", this.onping.bind(this)), (0, on_1.on)(socket, "data", this.ondata.bind(this)), (0, on_1.on)(socket, "error", this.onerror.bind(this)), (0, on_1.on)(socket, "close", this.onclose.bind(this)), (0, on_1.on)(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */
        onping() {
            this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */
        ondata(data) {
            this.decoder.add(data);
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */
        ondecoded(packet) {
            this.emitReserved("packet", packet);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */
        onerror(err) {
            debug("error", err);
            this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */
        socket(nsp, opts) {
            let socket$1 = this.nsps[nsp];
            if (!socket$1) {
                socket$1 = new socket.Socket(this, nsp, opts);
                this.nsps[nsp] = socket$1;
            }
            return socket$1;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */
        _destroy(socket) {
            const nsps = Object.keys(this.nsps);
            for (const nsp of nsps) {
                const socket = this.nsps[nsp];
                if (socket.active) {
                    debug("socket %s is still active, skipping close", nsp);
                    return;
                }
            }
            this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */
        _packet(packet) {
            debug("writing packet %j", packet);
            const encodedPackets = this.encoder.encode(packet);
            for (let i = 0; i < encodedPackets.length; i++) {
                this.engine.write(encodedPackets[i], packet.options);
            }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */
        cleanup() {
            debug("cleanup");
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs.length = 0;
            this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */
        _close() {
            debug("disconnect");
            this.skipReconnect = true;
            this._reconnecting = false;
            if ("opening" === this._readyState) {
                // `onclose` will not fire because
                // an open event never happened
                this.cleanup();
            }
            this.backoff.reset();
            this._readyState = "closed";
            if (this.engine)
                this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */
        disconnect() {
            return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */
        onclose(reason) {
            debug("onclose");
            this.cleanup();
            this.backoff.reset();
            this._readyState = "closed";
            this.emitReserved("close", reason);
            if (this._reconnection && !this.skipReconnect) {
                this.reconnect();
            }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */
        reconnect() {
            if (this._reconnecting || this.skipReconnect)
                return this;
            const self = this;
            if (this.backoff.attempts >= this._reconnectionAttempts) {
                debug("reconnect failed");
                this.backoff.reset();
                this.emitReserved("reconnect_failed");
                this._reconnecting = false;
            }
            else {
                const delay = this.backoff.duration();
                debug("will wait %dms before reconnect attempt", delay);
                this._reconnecting = true;
                const timer = this.setTimeoutFn(() => {
                    if (self.skipReconnect)
                        return;
                    debug("attempting reconnect");
                    this.emitReserved("reconnect_attempt", self.backoff.attempts);
                    // check again for the case socket closed in above events
                    if (self.skipReconnect)
                        return;
                    self.open((err) => {
                        if (err) {
                            debug("reconnect attempt error");
                            self._reconnecting = false;
                            self.reconnect();
                            this.emitReserved("reconnect_error", err);
                        }
                        else {
                            debug("reconnect success");
                            self.onreconnect();
                        }
                    });
                }, delay);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */
        onreconnect() {
            const attempt = this.backoff.attempts;
            this._reconnecting = false;
            this.backoff.reset();
            this.emitReserved("reconnect", attempt);
        }
    }
    exports.Manager = Manager;
    });

    var build = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.io = exports.Socket = exports.Manager = exports.protocol = void 0;


    const debug = browser$2("socket.io-client");
    /**
     * Module exports.
     */
    module.exports = exports = lookup;
    /**
     * Managers cache.
     */
    const cache = (exports.managers = {});
    function lookup(uri, opts) {
        if (typeof uri === "object") {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        const parsed = (0, url_1.url)(uri, opts.path || "/socket.io");
        const source = parsed.source;
        const id = parsed.id;
        const path = parsed.path;
        const sameNamespace = cache[id] && path in cache[id]["nsps"];
        const newConnection = opts.forceNew ||
            opts["force new connection"] ||
            false === opts.multiplex ||
            sameNamespace;
        let io;
        if (newConnection) {
            debug("ignoring socket cache for %s", source);
            io = new manager.Manager(source, opts);
        }
        else {
            if (!cache[id]) {
                debug("new io instance for %s", source);
                cache[id] = new manager.Manager(source, opts);
            }
            io = cache[id];
        }
        if (parsed.query && !opts.query) {
            opts.query = parsed.queryKey;
        }
        return io.socket(parsed.path, opts);
    }
    exports.io = lookup;
    /**
     * Protocol version.
     *
     * @public
     */

    Object.defineProperty(exports, "protocol", { enumerable: true, get: function () { return dist.protocol; } });
    /**
     * `connect`.
     *
     * @param {String} uri
     * @public
     */
    exports.connect = lookup;
    /**
     * Expose constructors for standalone build.
     *
     * @public
     */
    var manager_2 = manager;
    Object.defineProperty(exports, "Manager", { enumerable: true, get: function () { return manager_2.Manager; } });

    Object.defineProperty(exports, "Socket", { enumerable: true, get: function () { return socket.Socket; } });
    exports.default = lookup;
    });

    var io = /*@__PURE__*/getDefaultExportFromCjs(build);

    io.Manager;
    io.Socket;

    /* src/App.svelte generated by Svelte v3.42.4 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (55:4) <Miner let:mine>
    function create_default_slot(ctx) {
    	let div1;
    	let center;
    	let div0;
    	let score_1;
    	let t0;
    	let br;
    	let t1;
    	let clicker;
    	let current;

    	score_1 = new Score({
    			props: { score: /*$score*/ ctx[1] },
    			$$inline: true
    		});

    	clicker = new Clicker({
    			props: {
    				mine: /*mine*/ ctx[8],
    				source: /*source*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			center = element("center");
    			div0 = element("div");
    			create_component(score_1.$$.fragment);
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			create_component(clicker.$$.fragment);
    			add_location(br, file, 62, 8, 1405);
    			attr_dev(div0, "class", "scoreContainer unselectable svelte-wcwu49");
    			add_location(div0, file, 58, 12, 1307);
    			add_location(center, file, 57, 12, 1286);
    			attr_dev(div1, "class", "sectionMain svelte-wcwu49");
    			add_location(div1, file, 56, 8, 1246);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, center);
    			append_dev(center, div0);
    			mount_component(score_1, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, br);
    			append_dev(div0, t1);
    			mount_component(clicker, div0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const score_1_changes = {};
    			if (dirty & /*$score*/ 2) score_1_changes.score = /*$score*/ ctx[1];
    			score_1.$set(score_1_changes);
    			const clicker_changes = {};
    			if (dirty & /*mine*/ 256) clicker_changes.mine = /*mine*/ ctx[8];
    			if (dirty & /*source*/ 1) clicker_changes.source = /*source*/ ctx[0];
    			clicker.$set(clicker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(score_1.$$.fragment, local);
    			transition_in(clicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(score_1.$$.fragment, local);
    			transition_out(clicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(score_1);
    			destroy_component(clicker);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(55:4) <Miner let:mine>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let title;
    	let t1;
    	let body;
    	let miner_1;
    	let current;

    	miner_1 = new Miner({
    			props: {
    				$$slots: {
    					default: [
    						create_default_slot,
    						({ mine }) => ({ 8: mine }),
    						({ mine }) => mine ? 256 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			title = element("title");
    			title.textContent = "Chip Clicker In Space";
    			t1 = space();
    			body = element("body");
    			create_component(miner_1.$$.fragment);
    			add_location(title, file, 51, 4, 1170);
    			add_location(body, file, 53, 0, 1208);
    			add_location(main, file, 50, 0, 1159);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, title);
    			append_dev(main, t1);
    			append_dev(main, body);
    			mount_component(miner_1, body, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const miner_1_changes = {};

    			if (dirty & /*$$scope, mine, source, $score*/ 771) {
    				miner_1_changes.$$scope = { dirty, ctx };
    			}

    			miner_1.$set(miner_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(miner_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(miner_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(miner_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let source;
    	let $rotations;
    	let $score;
    	validate_store(rotations, 'rotations');
    	component_subscribe($$self, rotations, $$value => $$invalidate(2, $rotations = $$value));
    	validate_store(score, 'score');
    	component_subscribe($$self, score, $$value => $$invalidate(1, $score = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let state;

    	let miner = () => {
    		
    	};

    	let socket;

    	onMount(async () => {
    		socket = io("localhost:3000");

    		socket.on("connect", socket => {
    			console.log(socket);
    		});

    		socket.on("disconnect", () => {
    			console.log(socket);
    		});

    		socket.on("e5c7ffac26fed654fe62045898f55b551a0dc120badf3d116bcd364418f3ec16", data => {
    			console.log("Recieved message for room, ", data);
    		});

    		const mWasn = Module({
    			locateFile: () => {
    				return initMinerWasm;
    			}
    		});

    		miner = await mWasn;
    	});

    	let upgradeCost = 10;
    	let upgrades = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		initMinerWasm,
    		miners: Module,
    		onMount,
    		rotations,
    		score,
    		Score,
    		Miner,
    		Clicker,
    		io,
    		state,
    		miner,
    		socket,
    		upgradeCost,
    		upgrades,
    		source,
    		$rotations,
    		$score
    	});

    	$$self.$inject_state = $$props => {
    		if ('state' in $$props) state = $$props.state;
    		if ('miner' in $$props) miner = $$props.miner;
    		if ('socket' in $$props) socket = $$props.socket;
    		if ('upgradeCost' in $$props) upgradeCost = $$props.upgradeCost;
    		if ('upgrades' in $$props) upgrades = $$props.upgrades;
    		if ('source' in $$props) $$invalidate(0, source = $$props.source);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$rotations*/ 4) {
    			$$invalidate(0, source = $rotations[$rotations.length - 1] || "clicker-game");
    		}
    	};

    	return [source, $score, $rotations];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
