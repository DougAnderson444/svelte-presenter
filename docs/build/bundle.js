
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
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
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\layouts\Centered.svelte generated by Svelte v3.24.1 */

    const file = "src\\layouts\\Centered.svelte";

    function create_fragment(ctx) {
    	let div1;
    	let div0;
    	let div1_class_value;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "svelte-tlmxpa");
    			add_location(div0, file, 16, 4, 280);
    			attr_dev(div1, "class", div1_class_value = "page " + /*css*/ ctx[0] + " svelte-tlmxpa");
    			add_location(div1, file, 15, 0, 250);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*css*/ 1 && div1_class_value !== (div1_class_value = "page " + /*css*/ ctx[0] + " svelte-tlmxpa")) {
    				attr_dev(div1, "class", div1_class_value);
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
    			if (detaching) detach_dev(div1);
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
    	let { css = "" } = $$props;
    	const writable_props = ["css"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Centered> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Centered", $$slots, ['default']);

    	$$self.$$set = $$props => {
    		if ("css" in $$props) $$invalidate(0, css = $$props.css);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ css });

    	$$self.$inject_state = $$props => {
    		if ("css" in $$props) $$invalidate(0, css = $$props.css);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [css, $$scope, $$slots];
    }

    class Centered extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { css: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Centered",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get css() {
    		throw new Error("<Centered>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css(value) {
    		throw new Error("<Centered>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\01_Introduction.svx generated by Svelte v3.24.1 */
    const file$1 = "src\\pages\\01_Introduction.svx";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let a;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Svelte Presenter";
    			t1 = space();
    			p = element("p");
    			p.textContent = "a straightforward presentation library made in Svelte";
    			t3 = space();
    			a = element("a");
    			a.textContent = "Check it out on Github";
    			add_location(h1, file$1, 10, 0, 264);
    			add_location(p, file$1, 11, 0, 290);
    			attr_dev(a, "href", "https://github.com/stephane-vanraes/svelte-presenter");
    			add_location(a, file$1, 12, 0, 351);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, a, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot] },
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata = { "layout": "centered" };
    const { layout } = metadata;

    function instance$1($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_01_Introduction> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("_01_Introduction", $$slots, []);
    	$$self.$capture_state = () => ({ metadata, layout, Layout_MDSVEX_DEFAULT: Centered });
    	return [];
    }

    class _01_Introduction extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_01_Introduction",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\layouts\Default.svelte generated by Svelte v3.24.1 */

    const file$2 = "src\\layouts\\Default.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let div1_class_value;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			add_location(div0, file$2, 5, 1, 72);
    			attr_dev(div1, "class", div1_class_value = "page " + /*css*/ ctx[0]);
    			add_location(div1, file$2, 4, 0, 45);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*css*/ 1 && div1_class_value !== (div1_class_value = "page " + /*css*/ ctx[0])) {
    				attr_dev(div1, "class", div1_class_value);
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
    			if (detaching) detach_dev(div1);
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
    	let { css = "" } = $$props;
    	const writable_props = ["css"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Default> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Default", $$slots, ['default']);

    	$$self.$$set = $$props => {
    		if ("css" in $$props) $$invalidate(0, css = $$props.css);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ css });

    	$$self.$inject_state = $$props => {
    		if ("css" in $$props) $$invalidate(0, css = $$props.css);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [css, $$scope, $$slots];
    }

    class Default extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { css: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Default",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get css() {
    		throw new Error("<Default>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css(value) {
    		throw new Error("<Default>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\02_GettingStarted.svx generated by Svelte v3.24.1 */
    const file$3 = "src\\pages\\02_GettingStarted.svx";

    // (6:0) <Layout_MDSVEX_DEFAULT>
    function create_default_slot$1(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let pre;
    	let raw_value = `<code class="language-bash">npx degit stephane-vanraes/svelte-presenter my-presentation</code>` + "";
    	let t4;
    	let p1;
    	let t5;
    	let strong;
    	let t7;
    	let a;
    	let t9;
    	let t10;
    	let p2;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Getting Started";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Degit the repo and you are all set.";
    			t3 = space();
    			pre = element("pre");
    			t4 = space();
    			p1 = element("p");
    			t5 = text("You will find the samples pages under the folder ");
    			strong = element("strong");
    			strong.textContent = "/src/pages";
    			t7 = text(".  They are using  ");
    			a = element("a");
    			a.textContent = "MDSvex";
    			t9 = text(" so it is as simple as writing Markdown to get your presentation going.");
    			t10 = space();
    			p2 = element("p");
    			p2.textContent = "Read on to learn how to make the best out of this package.";
    			add_location(h1, file$3, 6, 0, 135);
    			add_location(p0, file$3, 7, 0, 160);
    			attr_dev(pre, "class", "language-bash");
    			add_location(pre, file$3, 8, 0, 203);
    			add_location(strong, file$3, 9, 52, 393);
    			attr_dev(a, "href", "http://www.mdsvex.com");
    			attr_dev(a, "rel", "nofollow");
    			add_location(a, file$3, 9, 98, 439);
    			add_location(p1, file$3, 9, 0, 341);
    			add_location(p2, file$3, 10, 0, 572);
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
    			append_dev(p1, t5);
    			append_dev(p1, strong);
    			append_dev(p1, t7);
    			append_dev(p1, a);
    			append_dev(p1, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, p2, anchor);
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
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(p2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(6:0) <Layout_MDSVEX_DEFAULT>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let layout_mdsvex_default;
    	let current;

    	layout_mdsvex_default = new Default({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
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
    			const layout_mdsvex_default_changes = {};

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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_02_GettingStarted> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("_02_GettingStarted", $$slots, []);
    	$$self.$capture_state = () => ({ Layout_MDSVEX_DEFAULT: Default });
    	return [];
    }

    class _02_GettingStarted extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_02_GettingStarted",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\pages\03_Navigation.svx generated by Svelte v3.24.1 */
    const file$4 = "src\\pages\\03_Navigation.svx";

    // (6:0) <Layout_MDSVEX_DEFAULT>
    function create_default_slot$2(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let h2;
    	let t5;
    	let p1;
    	let t6;
    	let code0;
    	let t8;
    	let t9;
    	let pre;

    	let raw_value = `<code class="language-css"><span class="token selector">:root</span> <span class="token punctuation">&#123;</span>
	<span class="token property">--nav-background</span><span class="token punctuation">:</span> <span class="token function">rgba</span><span class="token punctuation">(</span>0<span class="token punctuation">,</span>0<span class="token punctuation">,</span>0<span class="token punctuation">,</span>0.2<span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token property">--nav-button-color</span><span class="token punctuation">:</span> black<span class="token punctuation">;</span>
	<span class="token property">--font-family</span><span class="token punctuation">:</span> monospace<span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span></code>` + "";

    	let t10;
    	let p2;
    	let t11;
    	let code1;
    	let t13;
    	let code2;
    	let t15;
    	let code3;
    	let t17;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Navigation";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "The package comes with very basic navigation included, either use the left and right arrow to go through the pages, or use the buttons at the bottom of the page (these only appear on hove as to not distract from the presentation itself).";
    			t3 = space();
    			h2 = element("h2");
    			h2.textContent = "Styling the navigation";
    			t5 = space();
    			p1 = element("p");
    			t6 = text("You can simply style the navigation by going into ");
    			code0 = element("code");
    			code0.textContent = "docs/global.css";
    			t8 = text(" and change the root values.");
    			t9 = space();
    			pre = element("pre");
    			t10 = space();
    			p2 = element("p");
    			t11 = text("Alternatively you can change the entire ");
    			code1 = element("code");
    			code1.textContent = "Navigation";
    			t13 = text(" component itself, as long as it exposes a ");
    			code2 = element("code");
    			code2.textContent = "next";
    			t15 = text(" and ");
    			code3 = element("code");
    			code3.textContent = "prev";
    			t17 = text(" event, you will be all fine.");
    			add_location(h1, file$4, 6, 0, 135);
    			add_location(p0, file$4, 7, 0, 155);
    			add_location(h2, file$4, 8, 0, 400);
    			add_location(code0, file$4, 9, 53, 485);
    			add_location(p1, file$4, 9, 0, 432);
    			attr_dev(pre, "class", "language-css");
    			add_location(pre, file$4, 10, 0, 546);
    			add_location(code1, file$4, 15, 43, 1463);
    			add_location(code2, file$4, 15, 109, 1529);
    			add_location(code3, file$4, 15, 131, 1551);
    			add_location(p2, file$4, 15, 0, 1420);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t6);
    			append_dev(p1, code0);
    			append_dev(p1, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, pre, anchor);
    			pre.innerHTML = raw_value;
    			insert_dev(target, t10, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t11);
    			append_dev(p2, code1);
    			append_dev(p2, t13);
    			append_dev(p2, code2);
    			append_dev(p2, t15);
    			append_dev(p2, code3);
    			append_dev(p2, t17);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(pre);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(p2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(6:0) <Layout_MDSVEX_DEFAULT>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let layout_mdsvex_default;
    	let current;

    	layout_mdsvex_default = new Default({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
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
    			const layout_mdsvex_default_changes = {};

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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_03_Navigation> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("_03_Navigation", $$slots, []);
    	$$self.$capture_state = () => ({ Layout_MDSVEX_DEFAULT: Default });
    	return [];
    }

    class _03_Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_03_Navigation",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\pages\04_Layouts.svx generated by Svelte v3.24.1 */
    const file$5 = "src\\pages\\04_Layouts.svx";

    // (6:0) <Layout_MDSVEX_DEFAULT>
    function create_default_slot$3(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let ul;
    	let li0;
    	let strong0;
    	let t5;
    	let t6;
    	let li1;
    	let strong1;
    	let t8;
    	let t9;
    	let li2;
    	let strong2;
    	let t11;
    	let t12;
    	let p1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Layouts";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Svelte Presenter comes with 3 layouts";
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			strong0 = element("strong");
    			strong0.textContent = "default";
    			t5 = text(" The default layout, will simply render it’s content from top to bottom.");
    			t6 = space();
    			li1 = element("li");
    			strong1 = element("strong");
    			strong1.textContent = "centered";
    			t8 = text(" This layout will center the content in the middle of the screen.");
    			t9 = space();
    			li2 = element("li");
    			strong2 = element("strong");
    			strong2.textContent = "paged";
    			t11 = text(" With this layout extra spacing is adding to each h2 element and extra functionality to snap the scrollbar is added.");
    			t12 = space();
    			p1 = element("p");
    			p1.textContent = "The coming pages show examples of all these layouts in action.";
    			add_location(h1, file$5, 6, 0, 135);
    			add_location(p0, file$5, 7, 0, 152);
    			add_location(strong0, file$5, 9, 4, 206);
    			add_location(li0, file$5, 9, 0, 202);
    			add_location(strong1, file$5, 10, 4, 312);
    			add_location(li1, file$5, 10, 0, 308);
    			add_location(strong2, file$5, 11, 4, 412);
    			add_location(li2, file$5, 11, 0, 408);
    			add_location(ul, file$5, 8, 0, 197);
    			add_location(p1, file$5, 13, 0, 562);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, strong0);
    			append_dev(li0, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, strong1);
    			append_dev(li1, t8);
    			append_dev(ul, t9);
    			append_dev(ul, li2);
    			append_dev(li2, strong2);
    			append_dev(li2, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(ul);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(6:0) <Layout_MDSVEX_DEFAULT>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let layout_mdsvex_default;
    	let current;

    	layout_mdsvex_default = new Default({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
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
    			const layout_mdsvex_default_changes = {};

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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_04_Layouts> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("_04_Layouts", $$slots, []);
    	$$self.$capture_state = () => ({ Layout_MDSVEX_DEFAULT: Default });
    	return [];
    }

    class _04_Layouts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_04_Layouts",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\pages\05_Default.svx generated by Svelte v3.24.1 */
    const file$6 = "src\\pages\\05_Default.svx";

    // (6:0) <Layout_MDSVEX_DEFAULT>
    function create_default_slot$4(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t4;
    	let em;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Default Layout";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "This is the default layout, it places all content from the top of the page and goes down.";
    			t3 = space();
    			p1 = element("p");
    			t4 = text("Nothing much to see here, that’s what makes it the ");
    			em = element("em");
    			em.textContent = "default";
    			add_location(h1, file$6, 6, 0, 135);
    			add_location(p0, file$6, 7, 0, 159);
    			add_location(em, file$6, 8, 54, 310);
    			add_location(p1, file$6, 8, 0, 256);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t4);
    			append_dev(p1, em);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(6:0) <Layout_MDSVEX_DEFAULT>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let layout_mdsvex_default;
    	let current;

    	layout_mdsvex_default = new Default({
    			props: {
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
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
    			const layout_mdsvex_default_changes = {};

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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_05_Default> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("_05_Default", $$slots, []);
    	$$self.$capture_state = () => ({ Layout_MDSVEX_DEFAULT: Default });
    	return [];
    }

    class _05_Default extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_05_Default",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\pages\06_Centered.svx generated by Svelte v3.24.1 */
    const file$7 = "src\\pages\\06_Centered.svx";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$5(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let pre;

    	let raw_value = `<code class="language-null">---
    layout: centered
---</code>` + "";

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Centered Layout";
    			t1 = space();
    			p = element("p");
    			p.textContent = "To center all content add the following to the top of your .svx file";
    			t3 = space();
    			pre = element("pre");
    			add_location(h1, file$7, 10, 0, 264);
    			add_location(p, file$7, 11, 0, 289);
    			attr_dev(pre, "class", "language-null");
    			add_location(pre, file$7, 12, 0, 365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, pre, anchor);
    			pre.innerHTML = raw_value;
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(pre);
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

    function create_fragment$7(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$1];

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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$1 = { "layout": "centered" };
    const { layout: layout$1 } = metadata$1;

    function instance$7($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_06_Centered> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("_06_Centered", $$slots, []);
    	$$self.$capture_state = () => ({ metadata: metadata$1, layout: layout$1, Layout_MDSVEX_DEFAULT: Centered });
    	return [];
    }

    class _06_Centered extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_06_Centered",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\layouts\Paged.svelte generated by Svelte v3.24.1 */

    const { window: window_1 } = globals;
    const file$8 = "src\\layouts\\Paged.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "page " + /*color*/ ctx[0] + " svelte-19j9mfj");
    			add_location(div, file$8, 30, 0, 644);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[5](div);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window_1, "keyup", /*handlekey*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*color*/ 1 && div_class_value !== (div_class_value = "page " + /*color*/ ctx[0] + " svelte-19j9mfj")) {
    				attr_dev(div, "class", div_class_value);
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
    			/*div_binding*/ ctx[5](null);
    			mounted = false;
    			dispose();
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
    	let { color = "white" } = $$props;
    	let page;

    	const handlekey = async ev => {
    		ev.key === "PageUp" && page.scrollBy(0, -window.innerHeight);
    		ev.key === "PageDown" && page.scrollBy(0, window.innerHeight);
    	};

    	const writable_props = ["color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Paged> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Paged", $$slots, ['default']);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			page = $$value;
    			$$invalidate(1, page);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ color, page, handlekey });

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("page" in $$props) $$invalidate(1, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, page, handlekey, $$scope, $$slots, div_binding];
    }

    class Paged extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { color: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Paged",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get color() {
    		throw new Error("<Paged>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Paged>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\07_Paged.svx generated by Svelte v3.24.1 */
    const file$9 = "src\\pages\\07_Paged.svx";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$6(ctx) {
    	let section0;
    	let h1;
    	let t1;
    	let h20;
    	let t3;
    	let p0;
    	let t5;
    	let p1;
    	let t7;
    	let pre0;

    	let raw0_value = `<code class="language-null">---
    layout: paged
---</code>` + "";

    	let t8;
    	let section1;
    	let h21;
    	let t10;
    	let p2;
    	let t11;
    	let code0;
    	let t13;
    	let t14;
    	let pre1;

    	let raw1_value = `<code class="language-md"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>section</span><span class="token punctuation">></span></span>

 This is a section

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>section</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>section</span><span class="token punctuation">></span></span>

 This is another section

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>section</span><span class="token punctuation">></span></span></code>` + "";

    	let t15;
    	let section2;
    	let h22;
    	let t17;
    	let p3;
    	let strong;
    	let t18;
    	let code1;
    	let t20;
    	let t21;
    	let pre2;

    	let raw2_value = `<code class="language-md"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>section</span><span class="token punctuation">></span></span>
<span class="token title important"><span class="token punctuation">#</span>This will not be processed correctly</span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>section</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>section</span><span class="token punctuation">></span></span>

<span class="token title important"><span class="token punctuation">#</span> But this will</span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>section</span><span class="token punctuation">></span></span></code>` + "";

    	const block = {
    		c: function create() {
    			section0 = element("section");
    			h1 = element("h1");
    			h1.textContent = "A Paged Layout";
    			t1 = space();
    			h20 = element("h2");
    			h20.textContent = "Configuring";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "This is an excellent layout for longer pages, it uses css scroll snapping to allow for some fancy scrolling. You can also use PageDown and PageUp to do the scrolling for you.";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "To use it add this to the header of your .svx file";
    			t7 = space();
    			pre0 = element("pre");
    			t8 = space();
    			section1 = element("section");
    			h21 = element("h2");
    			h21.textContent = "Usage";
    			t10 = space();
    			p2 = element("p");
    			t11 = text("In order for the paging to work, each ‘page’ has to be wrapped in a ");
    			code0 = element("code");
    			code0.textContent = "<section>";
    			t13 = text(" element.");
    			t14 = space();
    			pre1 = element("pre");
    			t15 = space();
    			section2 = element("section");
    			h22 = element("h2");
    			h22.textContent = "A Warning ⚠️";
    			t17 = space();
    			p3 = element("p");
    			strong = element("strong");
    			t18 = text("When wrapping with ");
    			code1 = element("code");
    			code1.textContent = "<section>";
    			t20 = text(" make sure to leave an empty line between the tag and the first line of markdown, otherwise it will not be picked up");
    			t21 = space();
    			pre2 = element("pre");
    			add_location(h1, file$9, 11, 0, 268);
    			add_location(h20, file$9, 12, 0, 292);
    			add_location(p0, file$9, 13, 0, 313);
    			add_location(p1, file$9, 14, 0, 495);
    			attr_dev(pre0, "class", "language-null");
    			add_location(pre0, file$9, 15, 0, 553);
    			add_location(section0, file$9, 10, 0, 258);
    			add_location(h21, file$9, 20, 0, 678);
    			add_location(code0, file$9, 21, 71, 764);
    			add_location(p2, file$9, 21, 0, 693);
    			attr_dev(pre1, "class", "language-md");
    			add_location(pre1, file$9, 22, 0, 806);
    			add_location(section1, file$9, 19, 0, 668);
    			add_location(h22, file$9, 35, 0, 1564);
    			add_location(code1, file$9, 36, 30, 1616);
    			add_location(strong, file$9, 36, 3, 1589);
    			add_location(p3, file$9, 36, 0, 1586);
    			attr_dev(pre2, "class", "language-md");
    			add_location(pre2, file$9, 37, 0, 1774);
    			add_location(section2, file$9, 34, 0, 1554);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section0, anchor);
    			append_dev(section0, h1);
    			append_dev(section0, t1);
    			append_dev(section0, h20);
    			append_dev(section0, t3);
    			append_dev(section0, p0);
    			append_dev(section0, t5);
    			append_dev(section0, p1);
    			append_dev(section0, t7);
    			append_dev(section0, pre0);
    			pre0.innerHTML = raw0_value;
    			insert_dev(target, t8, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, h21);
    			append_dev(section1, t10);
    			append_dev(section1, p2);
    			append_dev(p2, t11);
    			append_dev(p2, code0);
    			append_dev(p2, t13);
    			append_dev(section1, t14);
    			append_dev(section1, pre1);
    			pre1.innerHTML = raw1_value;
    			insert_dev(target, t15, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, h22);
    			append_dev(section2, t17);
    			append_dev(section2, p3);
    			append_dev(p3, strong);
    			append_dev(strong, t18);
    			append_dev(strong, code1);
    			append_dev(strong, t20);
    			append_dev(section2, t21);
    			append_dev(section2, pre2);
    			pre2.innerHTML = raw2_value;
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(section2);
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

    function create_fragment$9(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$2];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$6] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Paged({
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$2 = { "layout": "paged" };
    const { layout: layout$2 } = metadata$2;

    function instance$9($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_07_Paged> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("_07_Paged", $$slots, []);
    	$$self.$capture_state = () => ({ metadata: metadata$2, layout: layout$2, Layout_MDSVEX_DEFAULT: Paged });
    	return [];
    }

    class _07_Paged extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_07_Paged",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\pages\08_Classes.svx generated by Svelte v3.24.1 */
    const file$a = "src\\pages\\08_Classes.svx";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$7(ctx) {
    	let h1;
    	let t1;
    	let p0;
    	let t2;
    	let code0;
    	let t4;
    	let em;
    	let t6;
    	let t7;
    	let pre;

    	let raw_value = `<code class="language-null">---
    css: red
---</code>` + "";

    	let t8;
    	let p1;
    	let t9;
    	let code1;
    	let t11;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Styling with class";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("You can add a keyword ");
    			code0 = element("code");
    			code0.textContent = "css";
    			t4 = text(" to the header of the .svx file, this will append the given class to the page, allowing you to easily style the page more. This page for instance has the extra class ");
    			em = element("em");
    			em.textContent = "red";
    			t6 = text(" added to it, giving it a nice red background colour.");
    			t7 = space();
    			pre = element("pre");
    			t8 = space();
    			p1 = element("p");
    			t9 = text("The classes themselves have just been added to the ");
    			code1 = element("code");
    			code1.textContent = "global.css";
    			t11 = text(" file.");
    			add_location(h1, file$a, 10, 0, 252);
    			add_location(code0, file$a, 11, 25, 305);
    			add_location(em, file$a, 11, 207, 487);
    			add_location(p0, file$a, 11, 0, 280);
    			attr_dev(pre, "class", "language-null");
    			add_location(pre, file$a, 12, 0, 557);
    			add_location(code1, file$a, 15, 54, 710);
    			add_location(p1, file$a, 15, 0, 656);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t2);
    			append_dev(p0, code0);
    			append_dev(p0, t4);
    			append_dev(p0, em);
    			append_dev(p0, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, pre, anchor);
    			pre.innerHTML = raw_value;
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t9);
    			append_dev(p1, code1);
    			append_dev(p1, t11);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(pre);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p1);
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

    function create_fragment$a(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$3];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$7] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Default({
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$3 = { "css": "red" };
    const { css } = metadata$3;

    function instance$a($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<_08_Classes> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("_08_Classes", $$slots, []);
    	$$self.$capture_state = () => ({ metadata: metadata$3, css, Layout_MDSVEX_DEFAULT: Default });
    	return [];
    }

    class _08_Classes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_08_Classes",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    // TODO: All of this should be auto generated somehow

    var pages = [_01_Introduction, _02_GettingStarted, _03_Navigation, _04_Layouts, _05_Default, _06_Centered, _07_Paged, _08_Classes];

    /* src\App.svelte generated by Svelte v3.24.1 */
    const file$b = "src\\App.svelte";

    // (40:0) {#if index !== 0}
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "< Previous";
    			attr_dev(button, "class", "prev svelte-12q7cms");
    			add_location(button, file$b, 40, 1, 760);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*prev*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(40:0) {#if index !== 0}",
    		ctx
    	});

    	return block;
    }

    // (44:0) {#if index !== pages.length - 1}
    function create_if_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Next >";
    			attr_dev(button, "class", "next svelte-12q7cms");
    			add_location(button, file$b, 44, 1, 867);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*next*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(44:0) {#if index !== pages.length - 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let switch_instance;
    	let t0;
    	let t1;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = pages[/*index*/ ctx[0]];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	let if_block0 = /*index*/ ctx[0] !== 0 && create_if_block_1(ctx);
    	let if_block1 = /*index*/ ctx[0] !== pages.length - 1 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keyup", /*handlekey*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (switch_value !== (switch_value = pages[/*index*/ ctx[0]])) {
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
    					mount_component(switch_instance, t0.parentNode, t0);
    				} else {
    					switch_instance = null;
    				}
    			}

    			if (/*index*/ ctx[0] !== 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(t1.parentNode, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*index*/ ctx[0] !== pages.length - 1) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (switch_instance) destroy_component(switch_instance, detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
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

    function instance$b($$self, $$props, $$invalidate) {
    	let index = 0;
    	const next = () => index !== pages.length - 1 && $$invalidate(0, index++, index);
    	const prev = () => index !== 0 && $$invalidate(0, index--, index);

    	const handlekey = async ev => {
    		ev.key === "ArrowRight" && next();
    		ev.key === "ArrowLeft" && prev();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ pages, index, next, prev, handlekey });

    	$$self.$inject_state = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [index, next, prev, handlekey];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
