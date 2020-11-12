
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
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
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
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
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* node_modules\renderless-svelte\src\Carousel.svelte generated by Svelte v3.29.4 */

    const get_default_slot_changes = dirty => ({
    	currentIndex: dirty & /*currentIndex*/ 1,
    	payload: dirty & /*payload*/ 16,
    	loop: dirty & /*loop*/ 2
    });

    const get_default_slot_context = ctx => ({
    	currentIndex: /*currentIndex*/ ctx[0],
    	payload: /*payload*/ ctx[4],
    	setIndex: /*setIndex*/ ctx[2],
    	controls: /*controls*/ ctx[3],
    	loop: /*loop*/ ctx[1]
    });

    function create_fragment(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], get_default_slot_context);

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
    				if (default_slot.p && dirty & /*$$scope, currentIndex, payload, loop*/ 83) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, get_default_slot_changes, get_default_slot_context);
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
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Carousel", slots, ['default']);
    	let { items = [] } = $$props;
    	let { currentIndex = 0 } = $$props;
    	let { loop = false } = $$props;
    	const setIndex = val => val < items.length && $$invalidate(0, currentIndex = val);

    	const controls = {
    		next: () => $$invalidate(0, currentIndex = currentIndex < items.length - 1
    		? currentIndex + 1
    		: loop ? 0 : items.length - 1),
    		previous: () => $$invalidate(0, currentIndex = currentIndex != 0
    		? currentIndex - 1
    		: loop ? items.length - 1 : 0)
    	};

    	const writable_props = ["items", "currentIndex", "loop"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Carousel> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(5, items = $$props.items);
    		if ("currentIndex" in $$props) $$invalidate(0, currentIndex = $$props.currentIndex);
    		if ("loop" in $$props) $$invalidate(1, loop = $$props.loop);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		items,
    		currentIndex,
    		loop,
    		setIndex,
    		controls,
    		payload
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(5, items = $$props.items);
    		if ("currentIndex" in $$props) $$invalidate(0, currentIndex = $$props.currentIndex);
    		if ("loop" in $$props) $$invalidate(1, loop = $$props.loop);
    		if ("payload" in $$props) $$invalidate(4, payload = $$props.payload);
    	};

    	let payload;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*items, currentIndex*/ 33) {
    			 $$invalidate(4, payload = items[currentIndex]);
    		}
    	};

    	return [currentIndex, loop, setIndex, controls, payload, items, $$scope, slots];
    }

    class Carousel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			items: 5,
    			currentIndex: 0,
    			loop: 1,
    			setIndex: 2,
    			controls: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Carousel",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get items() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentIndex() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentIndex(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loop() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loop(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setIndex() {
    		return this.$$.ctx[2];
    	}

    	set setIndex(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get controls() {
    		return this.$$.ctx[3];
    	}

    	set controls(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\renderless-svelte\src\TabControl.svelte generated by Svelte v3.29.4 */
    const get_tabs_slot_changes = dirty => ({ tabs: dirty & /*tabs*/ 1 });
    const get_tabs_slot_context = ctx => ({ tabs: /*tabs*/ ctx[0] });

    function create_fragment$1(ctx) {
    	let t;
    	let current;
    	const tabs_slot_template = /*#slots*/ ctx[3].tabs;
    	const tabs_slot = create_slot(tabs_slot_template, ctx, /*$$scope*/ ctx[2], get_tabs_slot_context);
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			if (tabs_slot) tabs_slot.c();
    			t = space();
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (tabs_slot) {
    				tabs_slot.m(target, anchor);
    			}

    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (tabs_slot) {
    				if (tabs_slot.p && dirty & /*$$scope, tabs*/ 5) {
    					update_slot(tabs_slot, tabs_slot_template, ctx, /*$$scope*/ ctx[2], dirty, get_tabs_slot_changes, get_tabs_slot_context);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabs_slot, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabs_slot, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (tabs_slot) tabs_slot.d(detaching);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
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
    	validate_slots("TabControl", slots, ['tabs','default']);
    	let { tabs } = $$props;
    	const _tabs = writable([]);
    	const setTab = id => _tabs.update(arr => arr.map(t => ({ ...t, active: t.id == id })));
    	_tabs.subscribe(t => $$invalidate(0, tabs = t));
    	setContext("tabcontrols_tabs", { _tabs, setTab });
    	const writable_props = ["tabs"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TabControl> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("tabs" in $$props) $$invalidate(0, tabs = $$props.tabs);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		writable,
    		tabs,
    		_tabs,
    		setTab
    	});

    	$$self.$inject_state = $$props => {
    		if ("tabs" in $$props) $$invalidate(0, tabs = $$props.tabs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tabs, setTab, $$scope, slots];
    }

    class TabControl extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { tabs: 0, setTab: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabControl",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tabs*/ ctx[0] === undefined && !("tabs" in props)) {
    			console.warn("<TabControl> was created without expected prop 'tabs'");
    		}
    	}

    	get tabs() {
    		throw new Error("<TabControl>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabs(value) {
    		throw new Error("<TabControl>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setTab() {
    		return this.$$.ctx[1];
    	}

    	set setTab(value) {
    		throw new Error("<TabControl>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\renderless-svelte\src\TabControlItem.svelte generated by Svelte v3.29.4 */

    // (28:0) {#if _active}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(28:0) {#if _active}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*_active*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*_active*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*_active*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let $_tabs;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TabControlItem", slots, ['default']);
    	const { _tabs, setTab } = getContext("tabcontrols_tabs");
    	validate_store(_tabs, "_tabs");
    	component_subscribe($$self, _tabs, value => $$invalidate(9, $_tabs = value));
    	let { active = false } = $$props;
    	let { disabled = false } = $$props;
    	let { id } = $$props;
    	let { payload } = $$props;
    	const select = () => setTab(id);
    	onMount(() => _tabs.update(t => [...t, { active, disabled, id, select, payload }]));
    	const writable_props = ["active", "disabled", "id", "payload"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TabControlItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("active" in $$props) $$invalidate(2, active = $$props.active);
    		if ("disabled" in $$props) $$invalidate(3, disabled = $$props.disabled);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("payload" in $$props) $$invalidate(5, payload = $$props.payload);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onMount,
    		_tabs,
    		setTab,
    		active,
    		disabled,
    		id,
    		payload,
    		select,
    		tab,
    		$_tabs,
    		_active
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(2, active = $$props.active);
    		if ("disabled" in $$props) $$invalidate(3, disabled = $$props.disabled);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("payload" in $$props) $$invalidate(5, payload = $$props.payload);
    		if ("tab" in $$props) $$invalidate(8, tab = $$props.tab);
    		if ("_active" in $$props) $$invalidate(0, _active = $$props._active);
    	};

    	let tab;
    	let _active;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$_tabs, id*/ 528) {
    			 $$invalidate(8, tab = $_tabs.find(t => id === t.id));
    		}

    		if ($$self.$$.dirty & /*tab*/ 256) {
    			 $$invalidate(0, _active = tab && tab.active);
    		}

    		if ($$self.$$.dirty & /*id, disabled*/ 24) {
    			 _tabs.update(t1 => t1.map(t2 => t2.id === id ? { ...t2, disabled } : t2));
    		}

    		if ($$self.$$.dirty & /*id, active*/ 20) {
    			 _tabs.update(t1 => t1.map(t2 => t2.id === id ? { ...t2, active } : t2));
    		}
    	};

    	return [_active, _tabs, active, disabled, id, payload, $$scope, slots];
    }

    class TabControlItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			active: 2,
    			disabled: 3,
    			id: 4,
    			payload: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabControlItem",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[4] === undefined && !("id" in props)) {
    			console.warn("<TabControlItem> was created without expected prop 'id'");
    		}

    		if (/*payload*/ ctx[5] === undefined && !("payload" in props)) {
    			console.warn("<TabControlItem> was created without expected prop 'payload'");
    		}
    	}

    	get active() {
    		throw new Error("<TabControlItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<TabControlItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<TabControlItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TabControlItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<TabControlItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TabControlItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get payload() {
    		throw new Error("<TabControlItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set payload(value) {
    		throw new Error("<TabControlItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function color(node, params) {
        const apply = ({ hue, sat, lum }) => {
            node.style.setProperty('--hue', hue);
            node.style.setProperty('--sat', sat + '%');
            node.style.setProperty('--lum', lum + '%');
        };

        apply(params);

        return {
            update: apply
        }
    }

    /* src\node_modules\svelte-presenter\components\Button.svelte generated by Svelte v3.29.4 */
    const file = "src\\node_modules\\svelte-presenter\\components\\Button.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let colors_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", "borders svelte-dtmezu");
    			toggle_class(button, "active", /*active*/ ctx[0]);
    			add_location(button, file, 7, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(colors_action = color.call(null, button, /*hsl*/ ctx[1])),
    					listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (colors_action && is_function(colors_action.update) && dirty & /*hsl*/ 2) colors_action.update.call(null, /*hsl*/ ctx[1]);

    			if (dirty & /*active*/ 1) {
    				toggle_class(button, "active", /*active*/ ctx[0]);
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
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots("Button", slots, ['default']);
    	let { active = false } = $$props;
    	let { hsl = {} } = $$props;
    	const writable_props = ["active", "hsl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("hsl" in $$props) $$invalidate(1, hsl = $$props.hsl);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ colors: color, active, hsl });

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("hsl" in $$props) $$invalidate(1, hsl = $$props.hsl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [active, hsl, $$scope, slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { active: 0, hsl: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get active() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hsl() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hsl(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\node_modules\svelte-presenter\components\Navigation.svelte generated by Svelte v3.29.4 */
    const file$1 = "src\\node_modules\\svelte-presenter\\components\\Navigation.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (10:2) <Button      hsl={page}     active={i === currentIndex}      on:click={() => setIndex(i)}>
    function create_default_slot(ctx) {
    	let t0_value = /*i*/ ctx[6] + 1 + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(10:2) <Button      hsl={page}     active={i === currentIndex}      on:click={() => setIndex(i)}>",
    		ctx
    	});

    	return block;
    }

    // (9:1) {#each pages as page, i}
    function create_each_block(ctx) {
    	let button;
    	let current;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*i*/ ctx[6], ...args);
    	}

    	button = new Button({
    			props: {
    				hsl: /*page*/ ctx[4],
    				active: /*i*/ ctx[6] === /*currentIndex*/ ctx[0],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", click_handler);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button_changes = {};
    			if (dirty & /*pages*/ 2) button_changes.hsl = /*page*/ ctx[4];
    			if (dirty & /*currentIndex*/ 1) button_changes.active = /*i*/ ctx[6] === /*currentIndex*/ ctx[0];

    			if (dirty & /*$$scope*/ 128) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(9:1) {#each pages as page, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let nav;
    	let current;
    	let each_value = /*pages*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			nav = element("nav");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(nav, "class", "svelte-x9vpv2");
    			add_location(nav, file$1, 7, 0, 137);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(nav, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pages, currentIndex, setIndex*/ 7) {
    				each_value = /*pages*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(nav, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navigation", slots, []);
    	let { currentIndex } = $$props;
    	let { pages = [] } = $$props;
    	let { setIndex } = $$props;
    	const writable_props = ["currentIndex", "pages", "setIndex"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navigation> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => setIndex(i);

    	$$self.$$set = $$props => {
    		if ("currentIndex" in $$props) $$invalidate(0, currentIndex = $$props.currentIndex);
    		if ("pages" in $$props) $$invalidate(1, pages = $$props.pages);
    		if ("setIndex" in $$props) $$invalidate(2, setIndex = $$props.setIndex);
    	};

    	$$self.$capture_state = () => ({ Button, currentIndex, pages, setIndex });

    	$$self.$inject_state = $$props => {
    		if ("currentIndex" in $$props) $$invalidate(0, currentIndex = $$props.currentIndex);
    		if ("pages" in $$props) $$invalidate(1, pages = $$props.pages);
    		if ("setIndex" in $$props) $$invalidate(2, setIndex = $$props.setIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentIndex, pages, setIndex, click_handler];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { currentIndex: 0, pages: 1, setIndex: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentIndex*/ ctx[0] === undefined && !("currentIndex" in props)) {
    			console.warn("<Navigation> was created without expected prop 'currentIndex'");
    		}

    		if (/*setIndex*/ ctx[2] === undefined && !("setIndex" in props)) {
    			console.warn("<Navigation> was created without expected prop 'setIndex'");
    		}
    	}

    	get currentIndex() {
    		throw new Error("<Navigation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentIndex(value) {
    		throw new Error("<Navigation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pages() {
    		throw new Error("<Navigation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pages(value) {
    		throw new Error("<Navigation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setIndex() {
    		throw new Error("<Navigation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set setIndex(value) {
    		throw new Error("<Navigation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\node_modules\svelte-presenter\App.svelte generated by Svelte v3.29.4 */

    const { document: document_1 } = globals;
    const file$2 = "src\\node_modules\\svelte-presenter\\App.svelte";

    // (52:2) {#key payload}
    function create_key_block(ctx) {
    	let div;
    	let switch_instance;
    	let color_action;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*payload*/ ctx[14].component;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "svelte-6uct0b");
    			add_location(div, file$2, 52, 3, 1445);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			/*div_binding*/ ctx[12](div);
    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(color_action = color.call(null, div, /*payload*/ ctx[14]));
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (switch_value !== (switch_value = /*payload*/ ctx[14].component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			}

    			if (color_action && is_function(color_action.update) && dirty & /*payload*/ 16384) color_action.update.call(null, /*payload*/ ctx[14]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);

    				if (!div_intro) div_intro = create_in_transition(div, fly, {
    					y: /*direction*/ ctx[3] * /*innerHeight*/ ctx[2],
    					duration: 1000
    				});

    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, fly, {
    				y: /*direction*/ ctx[3] * (0 - /*innerHeight*/ ctx[2]),
    				duration: 1000
    			});

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    			/*div_binding*/ ctx[12](null);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(52:2) {#key payload}",
    		ctx
    	});

    	return block;
    }

    // (49:0) <Carousel items={pages} {currentIndex} let:payload>
    function create_default_slot$1(ctx) {
    	let navigation;
    	let t;
    	let main_1;
    	let previous_key = /*payload*/ ctx[14];
    	let current;

    	navigation = new Navigation({
    			props: {
    				pages: /*pages*/ ctx[0],
    				setIndex: /*func*/ ctx[11],
    				currentIndex: /*currentIndex*/ ctx[5]
    			},
    			$$inline: true
    		});

    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			create_component(navigation.$$.fragment);
    			t = space();
    			main_1 = element("main");
    			key_block.c();
    			attr_dev(main_1, "class", "svelte-6uct0b");
    			add_location(main_1, file$2, 50, 1, 1418);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navigation, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, main_1, anchor);
    			key_block.m(main_1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navigation_changes = {};
    			if (dirty & /*pages*/ 1) navigation_changes.pages = /*pages*/ ctx[0];
    			if (dirty & /*currentIndex*/ 32) navigation_changes.currentIndex = /*currentIndex*/ ctx[5];
    			navigation.$set(navigation_changes);

    			if (dirty & /*payload*/ 16384 && safe_not_equal(previous_key, previous_key = /*payload*/ ctx[14])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(main_1, null);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigation.$$.fragment, local);
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigation.$$.fragment, local);
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navigation, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(main_1);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(49:0) <Carousel items={pages} {currentIndex} let:payload>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let title_value;
    	let t;
    	let carousel;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[10]);
    	document_1.title = title_value = /*title*/ ctx[1];

    	carousel = new Carousel({
    			props: {
    				items: /*pages*/ ctx[0],
    				currentIndex: /*currentIndex*/ ctx[5],
    				$$slots: {
    					default: [
    						create_default_slot$1,
    						({ payload }) => ({ 14: payload }),
    						({ payload }) => payload ? 16384 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t = space();
    			create_component(carousel.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(carousel, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*handleKey*/ ctx[8], false, false, false),
    					listen_dev(window, "mousewheel", /*handleScroll*/ ctx[9], false, false, false),
    					listen_dev(window, "resize", /*onwindowresize*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*title*/ 2) && title_value !== (title_value = /*title*/ ctx[1])) {
    				document_1.title = title_value;
    			}

    			const carousel_changes = {};
    			if (dirty & /*pages*/ 1) carousel_changes.items = /*pages*/ ctx[0];
    			if (dirty & /*currentIndex*/ 32) carousel_changes.currentIndex = /*currentIndex*/ ctx[5];

    			if (dirty & /*$$scope, main, direction, innerHeight, payload, pages, currentIndex*/ 49213) {
    				carousel_changes.$$scope = { dirty, ctx };
    			}

    			carousel.$set(carousel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(carousel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(carousel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(carousel, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $current;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { pages = [] } = $$props;
    	let { title = "" } = $$props;
    	let current = tweened(parseInt(document.location.hash.substr(1)) || 0, { duration: 500 });
    	validate_store(current, "current");
    	component_subscribe($$self, current, value => $$invalidate(13, $current = value));
    	let innerHeight;
    	let direction = 1;
    	let main;

    	const changePage = async idx => {
    		$$invalidate(3, direction = idx > currentIndex ? 1 : -1);
    		await tick();

    		current.set(idx, {
    			duration: Math.abs(idx - currentIndex) > 1 ? 500 : 0
    		});
    	};

    	const handleKey = ({ key }) => {
    		switch (key) {
    			case "ArrowUp":
    				currentIndex !== 0 && changePage(currentIndex - 1);
    				return;
    			case "ArrowDown":
    				currentIndex !== pages.length - 1 && changePage(currentIndex + 1);
    				return;
    		}
    	};

    	const handleScroll = ({ deltaY }) => {
    		if (main.clientHeight >= main.scrollHeight) return;
    		main.scrollTo({ top: deltaY, behaviour: "smooth" });
    	};

    	const writable_props = ["pages", "title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function onwindowresize() {
    		$$invalidate(2, innerHeight = window.innerHeight);
    	}

    	const func = idx => changePage(idx);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			main = $$value;
    			$$invalidate(4, main);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("pages" in $$props) $$invalidate(0, pages = $$props.pages);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({
    		tick,
    		tweened,
    		fly,
    		Carousel,
    		Navigation,
    		color,
    		pages,
    		title,
    		current,
    		innerHeight,
    		direction,
    		main,
    		changePage,
    		handleKey,
    		handleScroll,
    		currentIndex,
    		$current
    	});

    	$$self.$inject_state = $$props => {
    		if ("pages" in $$props) $$invalidate(0, pages = $$props.pages);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("current" in $$props) $$invalidate(6, current = $$props.current);
    		if ("innerHeight" in $$props) $$invalidate(2, innerHeight = $$props.innerHeight);
    		if ("direction" in $$props) $$invalidate(3, direction = $$props.direction);
    		if ("main" in $$props) $$invalidate(4, main = $$props.main);
    		if ("currentIndex" in $$props) $$invalidate(5, currentIndex = $$props.currentIndex);
    	};

    	let currentIndex;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$current*/ 8192) {
    			 $$invalidate(5, currentIndex = Math.floor($current));
    		}

    		if ($$self.$$.dirty & /*currentIndex*/ 32) {
    			 document.location.hash = currentIndex;
    		}
    	};

    	return [
    		pages,
    		title,
    		innerHeight,
    		direction,
    		main,
    		currentIndex,
    		current,
    		changePage,
    		handleKey,
    		handleScroll,
    		onwindowresize,
    		func,
    		div_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { pages: 0, title: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get pages() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pages(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\node_modules\svelte-presenter\components\LiveCode.svelte generated by Svelte v3.29.4 */

    const file$3 = "src\\node_modules\\svelte-presenter\\components\\LiveCode.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-kzqdyz");
    			add_location(div, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
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
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LiveCode", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LiveCode> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class LiveCode extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LiveCode",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\node_modules\svelte-presenter\components\Repl\Input.svelte generated by Svelte v3.29.4 */
    const file$4 = "src\\node_modules\\svelte-presenter\\components\\Repl\\Input.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[4] = list;
    	child_ctx[5] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i].active;
    	child_ctx[8] = list[i].payload;
    	child_ctx[9] = list[i].select;
    	return child_ctx;
    }

    // (24:12) {#each tabs as { active, payload, select }}
    function create_each_block_1(ctx) {
    	let button;
    	let t_value = /*payload*/ ctx[8] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-1dfmrqt");
    			toggle_class(button, "active", /*active*/ ctx[7]);
    			add_location(button, file$4, 24, 16, 662);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*select*/ ctx[9])) /*select*/ ctx[9].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*tabs*/ 64 && t_value !== (t_value = /*payload*/ ctx[8] + "")) set_data_dev(t, t_value);

    			if (dirty & /*tabs*/ 64) {
    				toggle_class(button, "active", /*active*/ ctx[7]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(24:12) {#each tabs as { active, payload, select }}",
    		ctx
    	});

    	return block;
    }

    // (23:8) <div class="tabs" slot="tabs" let:tabs>
    function create_tabs_slot(ctx) {
    	let div;
    	let each_value_1 = /*tabs*/ ctx[6];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "tabs svelte-1dfmrqt");
    			attr_dev(div, "slot", "tabs");
    			add_location(div, file$4, 22, 8, 540);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tabs*/ 64) {
    				each_value_1 = /*tabs*/ ctx[6];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_tabs_slot.name,
    		type: "slot",
    		source: "(23:8) <div class=\\\"tabs\\\" slot=\\\"tabs\\\" let:tabs>",
    		ctx
    	});

    	return block;
    }

    // (29:12) <TabControlItem {id} payload={`${component.name}.${component.type}`} active={id === 0}>
    function create_default_slot_1(ctx) {
    	let textarea;
    	let t;
    	let mounted;
    	let dispose;

    	function textarea_input_handler() {
    		/*textarea_input_handler*/ ctx[2].call(textarea, /*each_value*/ ctx[4], /*id*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			t = space();
    			attr_dev(textarea, "autocomplete", "off");
    			attr_dev(textarea, "autocorrect", "off");
    			attr_dev(textarea, "autocapitalize", "off");
    			attr_dev(textarea, "class", "borders svelte-1dfmrqt");
    			attr_dev(textarea, "spellcheck", "false");
    			add_location(textarea, file$4, 29, 16, 925);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*component*/ ctx[3].source);
    			insert_dev(target, t, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", textarea_input_handler),
    					listen_dev(textarea, "keydown", /*handleKey*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*components*/ 1) {
    				set_input_value(textarea, /*component*/ ctx[3].source);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(29:12) <TabControlItem {id} payload={`${component.name}.${component.type}`} active={id === 0}>",
    		ctx
    	});

    	return block;
    }

    // (28:8) {#each components as component, id}
    function create_each_block$1(ctx) {
    	let tabcontrolitem;
    	let current;

    	tabcontrolitem = new TabControlItem({
    			props: {
    				id: /*id*/ ctx[5],
    				payload: `${/*component*/ ctx[3].name}.${/*component*/ ctx[3].type}`,
    				active: /*id*/ ctx[5] === 0,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tabcontrolitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tabcontrolitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tabcontrolitem_changes = {};
    			if (dirty & /*components*/ 1) tabcontrolitem_changes.payload = `${/*component*/ ctx[3].name}.${/*component*/ ctx[3].type}`;

    			if (dirty & /*$$scope, components*/ 4097) {
    				tabcontrolitem_changes.$$scope = { dirty, ctx };
    			}

    			tabcontrolitem.$set(tabcontrolitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabcontrolitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabcontrolitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tabcontrolitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(28:8) {#each components as component, id}",
    		ctx
    	});

    	return block;
    }

    // (22:4) <TabControl>
    function create_default_slot$2(ctx) {
    	let t;
    	let each_1_anchor;
    	let current;
    	let each_value = /*components*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*components, handleKey*/ 3) {
    				each_value = /*components*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(22:4) <TabControl>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let tabcontrol;
    	let current;

    	tabcontrol = new TabControl({
    			props: {
    				$$slots: {
    					default: [create_default_slot$2],
    					tabs: [
    						create_tabs_slot,
    						({ tabs }) => ({ 6: tabs }),
    						({ tabs }) => tabs ? 64 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(tabcontrol.$$.fragment);
    			attr_dev(div, "class", "svelte-1dfmrqt");
    			add_location(div, file$4, 20, 0, 504);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(tabcontrol, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tabcontrol_changes = {};

    			if (dirty & /*$$scope, components, tabs*/ 4161) {
    				tabcontrol_changes.$$scope = { dirty, ctx };
    			}

    			tabcontrol.$set(tabcontrol_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabcontrol.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabcontrol.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(tabcontrol);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Input", slots, []);
    	let { components = [] } = $$props;

    	const handleKey = ev => {
    		if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
    			ev.stopPropagation();
    		}

    		if (ev.key === "Tab") {
    			ev.preventDefault();
    			const { target } = ev;
    			const { selectionStart, value } = target;
    			target.value = value.substr(0, selectionStart) + "  " + value.substr(selectionStart);
    			target.selectionEnd = selectionStart + 2;
    		}
    	};

    	const writable_props = ["components"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler(each_value, id) {
    		each_value[id].source = this.value;
    		$$invalidate(0, components);
    	}

    	$$self.$$set = $$props => {
    		if ("components" in $$props) $$invalidate(0, components = $$props.components);
    	};

    	$$self.$capture_state = () => ({
    		TabControl,
    		TabControlItem,
    		components,
    		handleKey
    	});

    	$$self.$inject_state = $$props => {
    		if ("components" in $$props) $$invalidate(0, components = $$props.components);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [components, handleKey, textarea_input_handler];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { components: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get components() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set components(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\node_modules\svelte-presenter\components\Repl\Output.svelte generated by Svelte v3.29.4 */

    const file$5 = "src\\node_modules\\svelte-presenter\\components\\Repl\\Output.svelte";

    function create_fragment$8(ctx) {
    	let iframe_1;

    	const block = {
    		c: function create() {
    			iframe_1 = element("iframe");
    			attr_dev(iframe_1, "class", "borders svelte-iex0w8");
    			attr_dev(iframe_1, "title", "Rendered Repl");
    			attr_dev(iframe_1, "srcdoc", /*srcdoc*/ ctx[1]);
    			add_location(iframe_1, file$5, 47, 0, 1123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe_1, anchor);
    			/*iframe_1_binding*/ ctx[3](iframe_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe_1);
    			/*iframe_1_binding*/ ctx[3](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Output", slots, []);
    	let { compiled } = $$props;
    	let iframe;

    	function update(code) {
    		iframe.contentWindow.postMessage(code, "*");
    	}

    	const srcdoc = `
<!doctype html>
<html>
    <head>
        <script type="module">
            let c;

            function update(code) {
                if (c) {
                    c.$destroy()
                }

                const blob = new Blob([code], { type: 'text/javascript' })
                const url = URL.createObjectURL(blob)

                import(url).then(({ default: App }) => {
                    document.body.innerHTML = ""
                    c = new App({
                        target: document.body
                    })
                })
            }

            window.addEventListener('message', event => {
                update(event.data)
            }, false)
        <\/script>
    </head>
    <body>
        <p style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">Loading...</p>
    </body>
</html>
`;

    	const writable_props = ["compiled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Output> was created with unknown prop '${key}'`);
    	});

    	function iframe_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			iframe = $$value;
    			$$invalidate(0, iframe);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("compiled" in $$props) $$invalidate(2, compiled = $$props.compiled);
    	};

    	$$self.$capture_state = () => ({ compiled, iframe, update, srcdoc });

    	$$self.$inject_state = $$props => {
    		if ("compiled" in $$props) $$invalidate(2, compiled = $$props.compiled);
    		if ("iframe" in $$props) $$invalidate(0, iframe = $$props.iframe);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*iframe, compiled*/ 5) {
    			 iframe && compiled && update(compiled);
    		}
    	};

    	return [iframe, srcdoc, compiled, iframe_1_binding];
    }

    class Output extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { compiled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Output",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*compiled*/ ctx[2] === undefined && !("compiled" in props)) {
    			console.warn("<Output> was created without expected prop 'compiled'");
    		}
    	}

    	get compiled() {
    		throw new Error("<Output>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set compiled(value) {
    		throw new Error("<Output>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\node_modules\svelte-presenter\components\Repl\Repl.svelte generated by Svelte v3.29.4 */
    const file$6 = "src\\node_modules\\svelte-presenter\\components\\Repl\\Repl.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let input;
    	let updating_components;
    	let t;
    	let output;
    	let current;

    	function input_components_binding(value) {
    		/*input_components_binding*/ ctx[2].call(null, value);
    	}

    	let input_props = {};

    	if (/*components*/ ctx[0] !== void 0) {
    		input_props.components = /*components*/ ctx[0];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "components", input_components_binding));

    	output = new Output({
    			props: { compiled: /*compiled*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(input.$$.fragment);
    			t = space();
    			create_component(output.$$.fragment);
    			attr_dev(div, "class", "wrapper svelte-1r0q1tk");
    			add_location(div, file$6, 18, 0, 377);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(input, div, null);
    			append_dev(div, t);
    			mount_component(output, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const input_changes = {};

    			if (!updating_components && dirty & /*components*/ 1) {
    				updating_components = true;
    				input_changes.components = /*components*/ ctx[0];
    				add_flush_callback(() => updating_components = false);
    			}

    			input.$set(input_changes);
    			const output_changes = {};
    			if (dirty & /*compiled*/ 2) output_changes.compiled = /*compiled*/ ctx[1];
    			output.$set(output_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			transition_in(output.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			transition_out(output.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(input);
    			destroy_component(output);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Repl", slots, []);
    	let { components = [] } = $$props;
    	let compiled;
    	let worker;

    	onMount(() => {
    		$$invalidate(3, worker = new Worker("./worker.js"));
    		worker.addEventListener("message", event => $$invalidate(1, compiled = event.data));
    	});

    	const writable_props = ["components"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Repl> was created with unknown prop '${key}'`);
    	});

    	function input_components_binding(value) {
    		components = value;
    		$$invalidate(0, components);
    	}

    	$$self.$$set = $$props => {
    		if ("components" in $$props) $$invalidate(0, components = $$props.components);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Input,
    		Output,
    		components,
    		compiled,
    		worker
    	});

    	$$self.$inject_state = $$props => {
    		if ("components" in $$props) $$invalidate(0, components = $$props.components);
    		if ("compiled" in $$props) $$invalidate(1, compiled = $$props.compiled);
    		if ("worker" in $$props) $$invalidate(3, worker = $$props.worker);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*worker, components*/ 9) {
    			 worker && worker.postMessage(components);
    		}
    	};

    	return [components, compiled, input_components_binding];
    }

    class Repl extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { components: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Repl",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get components() {
    		throw new Error("<Repl>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set components(value) {
    		throw new Error("<Repl>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\node_modules\svelte-presenter\layouts\Centered.svelte generated by Svelte v3.29.4 */

    const file$7 = "src\\node_modules\\svelte-presenter\\layouts\\Centered.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-1wgk8oh");
    			add_location(div, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
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
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Centered", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Centered> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Centered extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Centered",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\content\01\index.svx generated by Svelte v3.29.4 */
    const file$8 = "src\\content\\01\\index.svx";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$3(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Svelte Presenter";
    			add_location(h1, file$8, 10, 0, 316);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Centered({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata = { "layout": "centered", "hsl": "50 70 50" };
    const { layout, hsl } = metadata;

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("_01", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_01> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata,
    		layout,
    		hsl,
    		Layout_MDSVEX_DEFAULT: Centered
    	});

    	return [];
    }

    class _01 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_01",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\node_modules\svelte-presenter\layouts\Column.svelte generated by Svelte v3.29.4 */

    const file$9 = "src\\node_modules\\svelte-presenter\\layouts\\Column.svelte";

    function create_fragment$c(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-1yyjqou");
    			add_location(div, file$9, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
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
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Column", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Column> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Column extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Column",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\content\02\index.svx generated by Svelte v3.29.4 */
    const file$a = "src\\content\\02\\index.svx";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$4(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let strong0;
    	let t3;
    	let p1;
    	let t5;
    	let pre0;
    	let raw0_value = `<code class="language-null">npx degit stephane-vanraes/svelte-presenter my-presentation</code>` + "";
    	let t6;
    	let p2;
    	let t8;
    	let pre1;

    	let raw1_value = `<code class="language-null">npm install
npm run dev</code>` + "";

    	let t9;
    	let p3;
    	let strong1;
    	let t11;
    	let p4;
    	let t12;
    	let code;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Getting Started";
    			t1 = space();
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "Installation";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Make a local clone of the project";
    			t5 = space();
    			pre0 = element("pre");
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "Install dependencies and ru";
    			t8 = space();
    			pre1 = element("pre");
    			t9 = space();
    			p3 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Set a title";
    			t11 = space();
    			p4 = element("p");
    			t12 = text("To set a html title, modify ");
    			code = element("code");
    			code.textContent = "main.js";
    			add_location(h1, file$a, 10, 0, 313);
    			add_location(strong0, file$a, 11, 3, 341);
    			add_location(p0, file$a, 11, 0, 338);
    			add_location(p1, file$a, 12, 0, 375);
    			attr_dev(pre0, "class", "language-null");
    			add_location(pre0, file$a, 13, 0, 416);
    			add_location(p2, file$a, 14, 0, 554);
    			attr_dev(pre1, "class", "language-null");
    			add_location(pre1, file$a, 15, 0, 589);
    			add_location(strong1, file$a, 17, 3, 694);
    			add_location(p3, file$a, 17, 0, 691);
    			add_location(code, file$a, 18, 31, 758);
    			add_location(p4, file$a, 18, 0, 727);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, strong0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, pre0, anchor);
    			pre0.innerHTML = raw0_value;
    			insert_dev(target, t6, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, pre1, anchor);
    			pre1.innerHTML = raw1_value;
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, strong1);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t12);
    			append_dev(p4, code);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(pre0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(pre1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$1];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$4] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Column({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$1)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$1 = { "layout": "column", "hsl": "100 70 50" };
    const { layout: layout$1, hsl: hsl$1 } = metadata$1;

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("_02", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_02> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$1,
    		layout: layout$1,
    		hsl: hsl$1,
    		Layout_MDSVEX_DEFAULT: Column
    	});

    	return [];
    }

    class _02 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_02",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\content\03\index.svx generated by Svelte v3.29.4 */
    const file$b = "src\\content\\03\\index.svx";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$5(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t2;
    	let a0;
    	let t4;
    	let a1;
    	let t6;
    	let t7;
    	let p1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "What is Svelte Presenter ?";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("Svelte Presenter allows to quickly make good looking presentations using ");
    			a0 = element("a");
    			a0.textContent = "Svelte";
    			t4 = text(" and ");
    			a1 = element("a");
    			a1.textContent = "mdsvex";
    			t6 = text(".");
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "It comes with a series of predefined layouts, support for a beautifull color scheme and a live REPL to blow your audience away.";
    			add_location(h1, file$b, 10, 0, 317);
    			attr_dev(a0, "href", "https://www.svelte.dev");
    			attr_dev(a0, "rel", "nofollow");
    			add_location(a0, file$b, 11, 76, 429);
    			attr_dev(a1, "href", "https://www.mdsvex.com");
    			attr_dev(a1, "rel", "nofollow");
    			add_location(a1, file$b, 14, 16, 497);
    			add_location(p0, file$b, 11, 0, 353);
    			add_location(p1, file$b, 15, 0, 562);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t2);
    			append_dev(p0, a0);
    			append_dev(p0, t4);
    			append_dev(p0, a1);
    			append_dev(p0, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$2];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$5] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Centered({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$2)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$2 = { "layout": "centered", "hsl": "150 70 50" };
    const { layout: layout$2, hsl: hsl$2 } = metadata$2;

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("_03", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_03> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$2,
    		layout: layout$2,
    		hsl: hsl$2,
    		Layout_MDSVEX_DEFAULT: Centered
    	});

    	return [];
    }

    class _03 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_03",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\content\04\index.svx generated by Svelte v3.29.4 */
    const file$c = "src\\content\\04\\index.svx";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$6(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let strong0;
    	let t3;
    	let ul0;
    	let li0;
    	let t4;
    	let code0;
    	let t6;
    	let li1;
    	let t7;
    	let code1;
    	let t9;
    	let li2;
    	let t11;
    	let p1;
    	let strong1;
    	let t13;
    	let ul1;
    	let li3;
    	let t15;
    	let li4;
    	let t17;
    	let li5;
    	let t19;
    	let li6;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Adding pages";
    			t1 = space();
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "location";
    			t3 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			t4 = text("all pages should be placed in their own directory in ");
    			code0 = element("code");
    			code0.textContent = "src/content";
    			t6 = space();
    			li1 = element("li");
    			t7 = text("the entry point to the page itself has to be called ");
    			code1 = element("code");
    			code1.textContent = "index.svx";
    			t9 = space();
    			li2 = element("li");
    			li2.textContent = "the build script will pick up pages in the order of the directories";
    			t11 = space();
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "frontmatter";
    			t13 = space();
    			ul1 = element("ul");
    			li3 = element("li");
    			li3.textContent = "layout -> the layout to be used";
    			t15 = space();
    			li4 = element("li");
    			li4.textContent = "hue -> the hue element for this page’s colour scheme";
    			t17 = space();
    			li5 = element("li");
    			li5.textContent = "sat -> the saturation element for this page’s colour scheme";
    			t19 = space();
    			li6 = element("li");
    			li6.textContent = "lum -> the lumination element for this page’s colour scheme";
    			add_location(h1, file$c, 10, 0, 313);
    			add_location(strong0, file$c, 11, 3, 338);
    			add_location(p0, file$c, 11, 0, 335);
    			add_location(code0, file$c, 13, 57, 430);
    			add_location(li0, file$c, 13, 0, 373);
    			add_location(code1, file$c, 14, 56, 516);
    			add_location(li1, file$c, 14, 0, 460);
    			add_location(li2, file$c, 15, 0, 544);
    			add_location(ul0, file$c, 12, 0, 368);
    			add_location(strong1, file$c, 17, 3, 630);
    			add_location(p1, file$c, 17, 0, 627);
    			add_location(li3, file$c, 19, 0, 668);
    			add_location(li4, file$c, 20, 0, 709);
    			add_location(li5, file$c, 21, 0, 771);
    			add_location(li6, file$c, 22, 0, 840);
    			add_location(ul1, file$c, 18, 0, 663);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, strong0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, ul0, anchor);
    			append_dev(ul0, li0);
    			append_dev(li0, t4);
    			append_dev(li0, code0);
    			append_dev(ul0, t6);
    			append_dev(ul0, li1);
    			append_dev(li1, t7);
    			append_dev(li1, code1);
    			append_dev(ul0, t9);
    			append_dev(ul0, li2);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, strong1);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, ul1, anchor);
    			append_dev(ul1, li3);
    			append_dev(ul1, t15);
    			append_dev(ul1, li4);
    			append_dev(ul1, t17);
    			append_dev(ul1, li5);
    			append_dev(ul1, t19);
    			append_dev(ul1, li6);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(ul0);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(ul1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$3];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$6] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Column({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$3)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$3 = { "layout": "column", "hsl": "200 70 50" };
    const { layout: layout$3, hsl: hsl$3 } = metadata$3;

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("_04", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_04> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$3,
    		layout: layout$3,
    		hsl: hsl$3,
    		Layout_MDSVEX_DEFAULT: Column
    	});

    	return [];
    }

    class _04 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_04",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\content\05\index.svx generated by Svelte v3.29.4 */
    const file$d = "src\\content\\05\\index.svx";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$7(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let strong0;
    	let t3;
    	let ul;
    	let li0;
    	let t5;
    	let li1;
    	let t7;
    	let li2;
    	let t9;
    	let p1;
    	let strong1;
    	let t11;
    	let p2;
    	let t12;
    	let code;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Layouts";
    			t1 = space();
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "There are three standard layouts";
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "centered";
    			t5 = space();
    			li1 = element("li");
    			li1.textContent = "column";
    			t7 = space();
    			li2 = element("li");
    			li2.textContent = "double-column";
    			t9 = space();
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Making your own layouts";
    			t11 = space();
    			p2 = element("p");
    			t12 = text("You can easily add your own layouts, but remember to add them to the mdsvex configuration in ");
    			code = element("code");
    			code.textContent = "rollup.config.js";
    			add_location(h1, file$d, 10, 0, 317);
    			add_location(strong0, file$d, 11, 3, 337);
    			add_location(p0, file$d, 11, 0, 334);
    			add_location(li0, file$d, 13, 0, 396);
    			add_location(li1, file$d, 14, 0, 414);
    			add_location(li2, file$d, 15, 0, 430);
    			add_location(ul, file$d, 12, 0, 391);
    			add_location(strong1, file$d, 17, 3, 462);
    			add_location(p1, file$d, 17, 0, 459);
    			add_location(code, file$d, 18, 96, 603);
    			add_location(p2, file$d, 18, 0, 507);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, strong0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, strong1);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t12);
    			append_dev(p2, code);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(ul);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$4];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$7] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Centered({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$4)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$4 = { "layout": "centered", "hsl": "250 70 50" };
    const { layout: layout$4, hsl: hsl$4 } = metadata$4;

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("_05", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_05> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$4,
    		layout: layout$4,
    		hsl: hsl$4,
    		Layout_MDSVEX_DEFAULT: Centered
    	});

    	return [];
    }

    class _05 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_05",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\node_modules\svelte-presenter\layouts\DoubleColumn.svelte generated by Svelte v3.29.4 */

    const file$e = "src\\node_modules\\svelte-presenter\\layouts\\DoubleColumn.svelte";

    function create_fragment$h(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-1nk0kpo");
    			add_location(div, file$e, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
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
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DoubleColumn", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DoubleColumn> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class DoubleColumn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DoubleColumn",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\content\06\Sample.svelte generated by Svelte v3.29.4 */

    const file$f = "src\\content\\06\\Sample.svelte";

    function create_fragment$i(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*count*/ ctx[0]);
    			attr_dev(button, "class", "svelte-12bfdyp");
    			add_location(button, file$f, 4, 0, 42);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*count*/ 1) set_data_dev(t, /*count*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sample", slots, []);
    	let count = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sample> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, count++, count);
    	$$self.$capture_state = () => ({ count });

    	$$self.$inject_state = $$props => {
    		if ("count" in $$props) $$invalidate(0, count = $$props.count);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [count, click_handler];
    }

    class Sample extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sample",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\content\06\index.svx generated by Svelte v3.29.4 */
    const file$g = "src\\content\\06\\index.svx";

    // (33:0) <LiveCode>
    function create_default_slot_1$1(ctx) {
    	let sample;
    	let current;
    	sample = new Sample({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(sample.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sample, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sample.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sample.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sample, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(33:0) <LiveCode>",
    		ctx
    	});

    	return block;
    }

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$8(ctx) {
    	let h1;
    	let t1;
    	let ul;
    	let li0;
    	let t3;
    	let li1;
    	let t4;
    	let code0;
    	let t6;
    	let t7;
    	let p;
    	let code1;
    	let t9;
    	let pre;

    	let raw_value = `<code class="language-svelte">&lt;script&gt;
    let count = 0
&lt;/script&gt;

&lt;button on:click=&#123;() =&gt; count++&#125;&gt;&#123;count&#125;&lt;/button&gt;

&lt;style&gt;
    button &#123;
        border-radius: 2rem;
        cursor: pointer;
        margin: 1rem 0;
        padding: .5rem 1rem;
        width: 100px;
    &#125;
&lt;/style&gt;</code>` + "";

    	let t10;
    	let livecode;
    	let current;

    	livecode = new LiveCode({
    			props: {
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Interactive Elements";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Thanks to mdsvex you can add regular Svelte components to your page";
    			t3 = space();
    			li1 = element("li");
    			t4 = text("Use the built inn ");
    			code0 = element("code");
    			code0.textContent = "LiveCode";
    			t6 = text(" component to wrap your samples with a standout box");
    			t7 = space();
    			p = element("p");
    			code1 = element("code");
    			code1.textContent = "import { LiveCode } from 'svelte-presenter'";
    			t9 = space();
    			pre = element("pre");
    			t10 = space();
    			create_component(livecode.$$.fragment);
    			add_location(h1, file$g, 11, 0, 414);
    			add_location(li0, file$g, 13, 0, 449);
    			add_location(code0, file$g, 14, 22, 548);
    			add_location(li1, file$g, 14, 0, 526);
    			add_location(ul, file$g, 12, 0, 444);
    			add_location(code1, file$g, 16, 3, 635);
    			add_location(p, file$g, 16, 0, 632);
    			attr_dev(pre, "class", "language-svelte");
    			add_location(pre, file$g, 17, 0, 706);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, t4);
    			append_dev(li1, code0);
    			append_dev(li1, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, code1);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, pre, anchor);
    			pre.innerHTML = raw_value;
    			insert_dev(target, t10, anchor);
    			mount_component(livecode, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const livecode_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				livecode_changes.$$scope = { dirty, ctx };
    			}

    			livecode.$set(livecode_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(livecode.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(livecode.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(pre);
    			if (detaching) detach_dev(t10);
    			destroy_component(livecode, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$5];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$8] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new DoubleColumn({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$5)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$5 = {
    	"layout": "double-column",
    	"hsl": "300 70 50"
    };

    const { layout: layout$5, hsl: hsl$5 } = metadata$5;

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("_06", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_06> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$5,
    		layout: layout$5,
    		hsl: hsl$5,
    		Layout_MDSVEX_DEFAULT: DoubleColumn,
    		LiveCode,
    		Sample
    	});

    	return [];
    }

    class _06 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_06",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\content\07\index.svx generated by Svelte v3.29.4 */
    const file$h = "src\\content\\07\\index.svx";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$9(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let pre;

    	let raw_value = `<code class="language-null">&lt;script&gt;
    import &#123; Repl &#125; from &#39;svelte-presenter&#39;
    import App from &#39;./code/App.js&#39;
    import Animal from &#39;./code/Animal.js&#39;
    import Data from &#39;./code/Data.js&#39;

    const components = [App, Animal, Data]
&lt;/script&gt;

&lt;Repl &#123;components&#125; /&gt;</code>` + "";

    	let t4;
    	let p1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Live Repl";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "There is also a live repl build into the project.";
    			t3 = space();
    			pre = element("pre");
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "The above example can be seen on the next page";
    			add_location(h1, file$h, 10, 0, 313);
    			add_location(p0, file$h, 11, 0, 332);
    			attr_dev(pre, "class", "language-null");
    			add_location(pre, file$h, 12, 0, 389);
    			add_location(p1, file$h, 22, 0, 783);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, pre, anchor);
    			pre.innerHTML = raw_value;
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(pre);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$6];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$9] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Column({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$6)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$6 = { "layout": "column", "hsl": "350 70 50" };
    const { layout: layout$6, hsl: hsl$6 } = metadata$6;

    function instance$k($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("_07", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_07> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$6,
    		layout: layout$6,
    		hsl: hsl$6,
    		Layout_MDSVEX_DEFAULT: Column
    	});

    	return [];
    }

    class _07 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_07",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    var App$1 = {
      "id": 0,
      "name": "App",
      "type": "svelte",
      "source": `<script>
  // Edit this code to showcase something
  import Animal from './Animal.svelte'
  import data from './data.json'
</script>

{#each data as item}
  <Animal {...item} />
{/each}
`
    };

    var Animal = {
      "id": 1,
      "name": "Animal",
      "type": "svelte",
      "source": `<script>
  export let animal
  export let emoji
</script>

<p>{animal} - <span>{emoji}</span></p>

<style>
  span {
    font-size: 2rem;
  }
</style>`
    };

    var Data = {
      "id": 2,
      "name": "data",
      "type": "json",
      "source": `[
  { animal: 'Squirrel', emoji: '🐿️' },
  { animal: 'Rabbit', emoji: '🐇' },
  { animal: 'Hamster', emoji: '🐹' },
  { animal: 'Dragon', emoji: '🐉' }
]`
    };

    /* src\content\08\index.svx generated by Svelte v3.29.4 */

    // (14:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$a(ctx) {
    	let repl;
    	let current;

    	repl = new Repl({
    			props: { components: /*components*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(repl.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(repl, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(repl.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(repl.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(repl, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(14:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$7];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$a] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Column({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$7)])
    			: {};

    			if (dirty & /*$$scope*/ 2) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$7 = { "layout": "column", "hsl": "40 70 50" };
    const { layout: layout$7, hsl: hsl$7 } = metadata$7;

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("_08", slots, []);
    	const components = [App$1, Animal, Data];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_08> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$7,
    		layout: layout$7,
    		hsl: hsl$7,
    		Layout_MDSVEX_DEFAULT: Column,
    		Repl,
    		App: App$1,
    		Animal,
    		Data,
    		components
    	});

    	return [components];
    }

    class _08 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_08",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    var pages = [
    	{ component: _01, hue: 50, sat: 70, lum: 50 },
    	{ component: _02, hue: 100, sat: 70, lum: 50 },
    	{ component: _03, hue: 150, sat: 70, lum: 50 },
    	{ component: _04, hue: 200, sat: 70, lum: 50 },
    	{ component: _05, hue: 250, sat: 70, lum: 50 },
    	{ component: _06, hue: 300, sat: 70, lum: 50 },
    	{ component: _07, hue: 350, sat: 70, lum: 50 },
    	{ component: _08, hue: 40, sat: 70, lum: 50 }
    ];

    const app = new App({
    	target: document.body,
    	props: {
    		pages,
    		title: 'A Presentation'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
