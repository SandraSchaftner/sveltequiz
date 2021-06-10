
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
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
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
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            skip_bound: false
        };
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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

    /* src\Question.svelte generated by Svelte v3.38.2 */

    const file$6 = "src\\Question.svelte";

    function create_fragment$6(ctx) {
    	let h1;
    	let t;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t = text(/*questionText*/ ctx[0]);
    			attr_dev(h1, "class", "svelte-1kcngbe");
    			add_location(h1, file$6, 16, 0, 361);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*questionText*/ 1) set_data_dev(t, /*questionText*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
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
    	validate_slots("Question", slots, []);
    	let { questionText } = $$props;
    	const writable_props = ["questionText"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Question> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("questionText" in $$props) $$invalidate(0, questionText = $$props.questionText);
    	};

    	$$self.$capture_state = () => ({ questionText });

    	$$self.$inject_state = $$props => {
    		if ("questionText" in $$props) $$invalidate(0, questionText = $$props.questionText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [questionText];
    }

    class Question extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { questionText: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Question",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*questionText*/ ctx[0] === undefined && !("questionText" in props)) {
    			console.warn("<Question> was created without expected prop 'questionText'");
    		}
    	}

    	get questionText() {
    		throw new Error("<Question>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set questionText(value) {
    		throw new Error("<Question>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function toClassName(value) {
      let result = '';

      if (typeof value === 'string' || typeof value === 'number') {
        result += value;
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          result = value.map(toClassName).filter(Boolean).join(' ');
        } else {
          for (let key in value) {
            if (value[key]) {
              result && (result += ' ');
              result += key;
            }
          }
        }
      }

      return result;
    }

    function classnames(...args) {
      return args.map(toClassName).filter(Boolean).join(' ');
    }

    /* node_modules\sveltestrap\src\Progress.svelte generated by Svelte v3.38.2 */
    const file$5 = "node_modules\\sveltestrap\\src\\Progress.svelte";

    // (43:0) {:else}
    function create_else_block_1$1(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block_2$2, create_else_block_2$1];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*multi*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let div_levels = [/*$$restProps*/ ctx[7], { class: /*classes*/ ctx[4] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			set_attributes(div, div_data);
    			add_location(div, file$5, 43, 2, 993);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 128 && /*$$restProps*/ ctx[7],
    				(!current || dirty & /*classes*/ 16) && { class: /*classes*/ ctx[4] }
    			]));
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
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(43:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:0) {#if bar}
    function create_if_block$4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$2, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*multi*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(28:0) {#if bar}",
    		ctx
    	});

    	return block;
    }

    // (47:4) {:else}
    function create_else_block_2$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", /*progressBarClasses*/ ctx[5]);
    			set_style(div, "width", /*percent*/ ctx[6] + "%");
    			attr_dev(div, "role", "progressbar");
    			attr_dev(div, "aria-valuenow", /*value*/ ctx[2]);
    			attr_dev(div, "aria-valuemin", "0");
    			attr_dev(div, "aria-valuemax", /*max*/ ctx[3]);
    			add_location(div, file$5, 47, 6, 1081);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8192)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[13], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*progressBarClasses*/ 32) {
    				attr_dev(div, "class", /*progressBarClasses*/ ctx[5]);
    			}

    			if (!current || dirty & /*percent*/ 64) {
    				set_style(div, "width", /*percent*/ ctx[6] + "%");
    			}

    			if (!current || dirty & /*value*/ 4) {
    				attr_dev(div, "aria-valuenow", /*value*/ ctx[2]);
    			}

    			if (!current || dirty & /*max*/ 8) {
    				attr_dev(div, "aria-valuemax", /*max*/ ctx[3]);
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
    		id: create_else_block_2$1.name,
    		type: "else",
    		source: "(47:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (45:4) {#if multi}
    function create_if_block_2$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);

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
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8192)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[13], dirty, null, null);
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
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(45:4) {#if multi}",
    		ctx
    	});

    	return block;
    }

    // (31:2) {:else}
    function create_else_block$4(ctx) {
    	let div;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);

    	let div_levels = [
    		/*$$restProps*/ ctx[7],
    		{ class: /*progressBarClasses*/ ctx[5] },
    		{
    			style: div_style_value = "width: " + /*percent*/ ctx[6] + "%"
    		},
    		{ role: "progressbar" },
    		{ "aria-valuenow": /*value*/ ctx[2] },
    		{ "aria-valuemin": "0" },
    		{ "aria-valuemax": /*max*/ ctx[3] }
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$5, 31, 4, 752);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8192)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[13], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 128 && /*$$restProps*/ ctx[7],
    				(!current || dirty & /*progressBarClasses*/ 32) && { class: /*progressBarClasses*/ ctx[5] },
    				(!current || dirty & /*percent*/ 64 && div_style_value !== (div_style_value = "width: " + /*percent*/ ctx[6] + "%")) && { style: div_style_value },
    				{ role: "progressbar" },
    				(!current || dirty & /*value*/ 4) && { "aria-valuenow": /*value*/ ctx[2] },
    				{ "aria-valuemin": "0" },
    				(!current || dirty & /*max*/ 8) && { "aria-valuemax": /*max*/ ctx[3] }
    			]));
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
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(31:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:2) {#if multi}
    function create_if_block_1$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[14].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);

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
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8192)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[13], dirty, null, null);
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(29:2) {#if multi}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*bar*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let classes;
    	let progressBarClasses;
    	let percent;

    	const omit_props_names = [
    		"class","bar","multi","value","max","animated","striped","color","barClassName"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Progress", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { bar = false } = $$props;
    	let { multi = false } = $$props;
    	let { value = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { animated = false } = $$props;
    	let { striped = false } = $$props;
    	let { color = "" } = $$props;
    	let { barClassName = "" } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(7, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(8, className = $$new_props.class);
    		if ("bar" in $$new_props) $$invalidate(0, bar = $$new_props.bar);
    		if ("multi" in $$new_props) $$invalidate(1, multi = $$new_props.multi);
    		if ("value" in $$new_props) $$invalidate(2, value = $$new_props.value);
    		if ("max" in $$new_props) $$invalidate(3, max = $$new_props.max);
    		if ("animated" in $$new_props) $$invalidate(9, animated = $$new_props.animated);
    		if ("striped" in $$new_props) $$invalidate(10, striped = $$new_props.striped);
    		if ("color" in $$new_props) $$invalidate(11, color = $$new_props.color);
    		if ("barClassName" in $$new_props) $$invalidate(12, barClassName = $$new_props.barClassName);
    		if ("$$scope" in $$new_props) $$invalidate(13, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		bar,
    		multi,
    		value,
    		max,
    		animated,
    		striped,
    		color,
    		barClassName,
    		classes,
    		progressBarClasses,
    		percent
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(8, className = $$new_props.className);
    		if ("bar" in $$props) $$invalidate(0, bar = $$new_props.bar);
    		if ("multi" in $$props) $$invalidate(1, multi = $$new_props.multi);
    		if ("value" in $$props) $$invalidate(2, value = $$new_props.value);
    		if ("max" in $$props) $$invalidate(3, max = $$new_props.max);
    		if ("animated" in $$props) $$invalidate(9, animated = $$new_props.animated);
    		if ("striped" in $$props) $$invalidate(10, striped = $$new_props.striped);
    		if ("color" in $$props) $$invalidate(11, color = $$new_props.color);
    		if ("barClassName" in $$props) $$invalidate(12, barClassName = $$new_props.barClassName);
    		if ("classes" in $$props) $$invalidate(4, classes = $$new_props.classes);
    		if ("progressBarClasses" in $$props) $$invalidate(5, progressBarClasses = $$new_props.progressBarClasses);
    		if ("percent" in $$props) $$invalidate(6, percent = $$new_props.percent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className*/ 256) {
    			$$invalidate(4, classes = classnames(className, "progress"));
    		}

    		if ($$self.$$.dirty & /*bar, className, barClassName, animated, color, striped*/ 7937) {
    			$$invalidate(5, progressBarClasses = classnames("progress-bar", bar ? className || barClassName : barClassName, animated ? "progress-bar-animated" : null, color ? `bg-${color}` : null, striped || animated ? "progress-bar-striped" : null));
    		}

    		if ($$self.$$.dirty & /*value, max*/ 12) {
    			$$invalidate(6, percent = parseInt(value, 10) / parseInt(max, 10) * 100);
    		}
    	};

    	return [
    		bar,
    		multi,
    		value,
    		max,
    		classes,
    		progressBarClasses,
    		percent,
    		$$restProps,
    		className,
    		animated,
    		striped,
    		color,
    		barClassName,
    		$$scope,
    		slots
    	];
    }

    class Progress extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			class: 8,
    			bar: 0,
    			multi: 1,
    			value: 2,
    			max: 3,
    			animated: 9,
    			striped: 10,
    			color: 11,
    			barClassName: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Progress",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get class() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bar() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bar(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multi() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multi(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animated() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animated(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get striped() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set striped(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get barClassName() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set barClassName(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ProgressBar.svelte generated by Svelte v3.38.2 */
    const file$4 = "src\\ProgressBar.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*currentQuestion*/ ctx[0] + 1 + "";
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let progress;
    	let current;

    	progress = new Progress({
    			props: {
    				color: "danger",
    				value: /*currentQuestion*/ ctx[0] + 1,
    				max: /*total*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Question ");
    			t1 = text(t1_value);
    			t2 = text(" of ");
    			t3 = text(/*total*/ ctx[1]);
    			t4 = space();
    			create_component(progress.$$.fragment);
    			attr_dev(div, "class", "margin svelte-1s3mxko");
    			add_location(div, file$4, 19, 0, 396);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    			mount_component(progress, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*currentQuestion*/ 1) && t1_value !== (t1_value = /*currentQuestion*/ ctx[0] + 1 + "")) set_data_dev(t1, t1_value);
    			if (!current || dirty & /*total*/ 2) set_data_dev(t3, /*total*/ ctx[1]);
    			const progress_changes = {};
    			if (dirty & /*currentQuestion*/ 1) progress_changes.value = /*currentQuestion*/ ctx[0] + 1;
    			if (dirty & /*total*/ 2) progress_changes.max = /*total*/ ctx[1];
    			progress.$set(progress_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(progress.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(progress.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(progress);
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
    	validate_slots("ProgressBar", slots, []);
    	let { currentQuestion } = $$props;
    	let { total } = $$props;
    	const writable_props = ["currentQuestion", "total"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProgressBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("currentQuestion" in $$props) $$invalidate(0, currentQuestion = $$props.currentQuestion);
    		if ("total" in $$props) $$invalidate(1, total = $$props.total);
    	};

    	$$self.$capture_state = () => ({ Progress, currentQuestion, total });

    	$$self.$inject_state = $$props => {
    		if ("currentQuestion" in $$props) $$invalidate(0, currentQuestion = $$props.currentQuestion);
    		if ("total" in $$props) $$invalidate(1, total = $$props.total);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentQuestion, total];
    }

    class ProgressBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { currentQuestion: 0, total: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProgressBar",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentQuestion*/ ctx[0] === undefined && !("currentQuestion" in props)) {
    			console.warn("<ProgressBar> was created without expected prop 'currentQuestion'");
    		}

    		if (/*total*/ ctx[1] === undefined && !("total" in props)) {
    			console.warn("<ProgressBar> was created without expected prop 'total'");
    		}
    	}

    	get currentQuestion() {
    		throw new Error("<ProgressBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentQuestion(value) {
    		throw new Error("<ProgressBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get total() {
    		throw new Error("<ProgressBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set total(value) {
    		throw new Error("<ProgressBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Option.svelte generated by Svelte v3.38.2 */

    const file$3 = "src\\Option.svelte";

    // (36:0) {:else}
    function create_else_block$3(ctx) {
    	let button;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*answer*/ ctx[0]);
    			attr_dev(button, "class", "disabled svelte-uxpdgo");
    			add_location(button, file$3, 36, 1, 553);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*answer*/ 1) set_data_dev(t, /*answer*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(36:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:0) {#if index===0}
    function create_if_block$3(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*answer*/ ctx[0]);
    			attr_dev(button, "class", "svelte-uxpdgo");
    			add_location(button, file$3, 32, 1, 504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*answer*/ 1) set_data_dev(t, /*answer*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(32:0) {#if index===0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*index*/ ctx[1] === 0) return create_if_block$3;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	validate_slots("Option", slots, []);
    	let { answer } = $$props;
    	let { index = 0 } = $$props;
    	const writable_props = ["answer", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Option> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("answer" in $$props) $$invalidate(0, answer = $$props.answer);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({ answer, index });

    	$$self.$inject_state = $$props => {
    		if ("answer" in $$props) $$invalidate(0, answer = $$props.answer);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [answer, index, click_handler];
    }

    class Option extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { answer: 0, index: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Option",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*answer*/ ctx[0] === undefined && !("answer" in props)) {
    			console.warn("<Option> was created without expected prop 'answer'");
    		}
    	}

    	get answer() {
    		throw new Error("<Option>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set answer(value) {
    		throw new Error("<Option>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Option>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Option>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Result.svelte generated by Svelte v3.38.2 */

    const file$2 = "src\\Result.svelte";

    // (30:0) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = "https://giphy.com/embed/l0MYy7QpDDVGVfAAw")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			set_style(iframe, "position", "absolute");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "class", "giphy-embed");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "title", "You are right");
    			add_location(iframe, file$2, 30, 5, 643);
    			attr_dev(div, "class", "svelte-nwf9k2");
    			add_location(div, file$2, 30, 0, 638);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(30:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:0) {#if !correct}
    function create_if_block$2(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;
    	let t0;
    	let p;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			t0 = space();
    			p = element("p");
    			t1 = text("The correct answer is: ");
    			t2 = text(/*correctAnswer*/ ctx[1]);
    			if (iframe.src !== (iframe_src_value = "https://giphy.com/embed/l4pLY0zySvluEvr0c")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			set_style(iframe, "position", "absolute");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "class", "giphy-embed");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "title", "You are wrong");
    			add_location(iframe, file$2, 25, 5, 380);
    			attr_dev(div, "class", "svelte-nwf9k2");
    			add_location(div, file$2, 25, 0, 375);
    			attr_dev(p, "class", "svelte-nwf9k2");
    			add_location(p, file$2, 26, 0, 581);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*correctAnswer*/ 2) set_data_dev(t2, /*correctAnswer*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(25:0) {#if !correct}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*correct*/ ctx[0]) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Result", slots, []);
    	let { correct } = $$props;
    	let { correctAnswer } = $$props;
    	const writable_props = ["correct", "correctAnswer"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Result> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("correct" in $$props) $$invalidate(0, correct = $$props.correct);
    		if ("correctAnswer" in $$props) $$invalidate(1, correctAnswer = $$props.correctAnswer);
    	};

    	$$self.$capture_state = () => ({ correct, correctAnswer });

    	$$self.$inject_state = $$props => {
    		if ("correct" in $$props) $$invalidate(0, correct = $$props.correct);
    		if ("correctAnswer" in $$props) $$invalidate(1, correctAnswer = $$props.correctAnswer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [correct, correctAnswer];
    }

    class Result extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { correct: 0, correctAnswer: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Result",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*correct*/ ctx[0] === undefined && !("correct" in props)) {
    			console.warn("<Result> was created without expected prop 'correct'");
    		}

    		if (/*correctAnswer*/ ctx[1] === undefined && !("correctAnswer" in props)) {
    			console.warn("<Result> was created without expected prop 'correctAnswer'");
    		}
    	}

    	get correct() {
    		throw new Error("<Result>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set correct(value) {
    		throw new Error("<Result>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get correctAnswer() {
    		throw new Error("<Result>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set correctAnswer(value) {
    		throw new Error("<Result>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\End.svelte generated by Svelte v3.38.2 */

    const file$1 = "src\\End.svelte";

    // (44:0) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = "https://giphy.com/embed/kyRmQ3NQDXrhbqK6Hx")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			set_style(iframe, "position", "absolute");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "class", "giphy-embed");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "title", "Winner");
    			add_location(iframe, file$1, 44, 6, 1526);
    			attr_dev(div, "class", "svelte-rt8koz");
    			add_location(div, file$1, 44, 1, 1521);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(44:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:19) 
    function create_if_block_4(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = "https://giphy.com/embed/QsU3vYYHB69R3bvBMK")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			set_style(iframe, "position", "absolute");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "class", "giphy-embed");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "title", "Nice job");
    			add_location(iframe, file$1, 41, 6, 1313);
    			attr_dev(div, "class", "svelte-rt8koz");
    			add_location(div, file$1, 41, 1, 1308);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(41:19) ",
    		ctx
    	});

    	return block;
    }

    // (38:19) 
    function create_if_block_3$1(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = "https://giphy.com/embed/1l4TrFpL5G9ZS")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			set_style(iframe, "position", "absolute");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "class", "giphy-embed");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "title", "Not bad");
    			add_location(iframe, file$1, 38, 5, 1094);
    			attr_dev(div, "class", "svelte-rt8koz");
    			add_location(div, file$1, 38, 0, 1089);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(38:19) ",
    		ctx
    	});

    	return block;
    }

    // (35:19) 
    function create_if_block_2$1(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = "https://giphy.com/embed/APE5sviIJNPtYJgA8F")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			set_style(iframe, "position", "absolute");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "class", "giphy-embed");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "title", "You can do better");
    			add_location(iframe, file$1, 35, 5, 861);
    			attr_dev(div, "class", "svelte-rt8koz");
    			add_location(div, file$1, 35, 0, 856);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(35:19) ",
    		ctx
    	});

    	return block;
    }

    // (32:19) 
    function create_if_block_1$1(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = "https://giphy.com/embed/tnstdxAR9iMGh3iBRF")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			set_style(iframe, "position", "absolute");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "class", "giphy-embed");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "title", "Try again");
    			add_location(iframe, file$1, 32, 5, 637);
    			attr_dev(div, "class", "svelte-rt8koz");
    			add_location(div, file$1, 32, 0, 632);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(32:19) ",
    		ctx
    	});

    	return block;
    }

    // (29:0) {#if score==0}
    function create_if_block$1(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = "https://giphy.com/embed/26mkhPIN0KxjxfPbi")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "100%");
    			attr_dev(iframe, "height", "100%");
    			set_style(iframe, "position", "absolute");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "class", "giphy-embed");
    			iframe.allowFullscreen = true;
    			attr_dev(iframe, "title", "How did you do that?");
    			add_location(iframe, file$1, 29, 5, 403);
    			attr_dev(div, "class", "svelte-rt8koz");
    			add_location(div, file$1, 29, 0, 398);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(29:0) {#if score==0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let result;

    	function select_block_type(ctx, dirty) {
    		if (/*score*/ ctx[0] == 0) return create_if_block$1;
    		if (/*score*/ ctx[0] == 1) return create_if_block_1$1;
    		if (/*score*/ ctx[0] == 2) return create_if_block_2$1;
    		if (/*score*/ ctx[0] == 3) return create_if_block_3$1;
    		if (/*score*/ ctx[0] == 4) return create_if_block_4;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Your score is ");
    			t1 = text(/*score*/ ctx[0]);
    			t2 = text(" out of 5!");
    			t3 = space();
    			result = element("result");
    			if_block.c();
    			attr_dev(p, "class", "svelte-rt8koz");
    			add_location(p, file$1, 24, 0, 332);
    			add_location(result, file$1, 27, 0, 374);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, result, anchor);
    			if_block.m(result, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*score*/ 1) set_data_dev(t1, /*score*/ ctx[0]);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(result, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(result);
    			if_block.d();
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
    	validate_slots("End", slots, []);
    	let { score } = $$props;
    	const writable_props = ["score"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<End> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("score" in $$props) $$invalidate(0, score = $$props.score);
    	};

    	$$self.$capture_state = () => ({ score });

    	$$self.$inject_state = $$props => {
    		if ("score" in $$props) $$invalidate(0, score = $$props.score);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [score];
    }

    class End extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { score: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "End",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*score*/ ctx[0] === undefined && !("score" in props)) {
    			console.warn("<End> was created without expected prop 'score'");
    		}
    	}

    	get score() {
    		throw new Error("<End>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set score(value) {
    		throw new Error("<End>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */
    const file = "src\\App.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (167:0) {:else}
    function create_else_block_3(ctx) {
    	let end;
    	let t0;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	end = new End({
    			props: { score: /*score*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(end.$$.fragment);
    			t0 = space();
    			button = element("button");
    			button.textContent = "Restart Quiz";
    			attr_dev(button, "class", "svelte-o88a59");
    			add_location(button, file, 169, 1, 4572);
    		},
    		m: function mount(target, anchor) {
    			mount_component(end, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const end_changes = {};
    			if (dirty & /*score*/ 2) end_changes.score = /*score*/ ctx[1];
    			end.$set(end_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(end.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(end.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(end, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(167:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (136:0) {#if (currentQuestion  < total) }
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*showresult*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(136:0) {#if (currentQuestion  < total) }",
    		ctx
    	});

    	return block;
    }

    // (157:2) {:else}
    function create_else_block_1(ctx) {
    	let result;
    	let t;
    	let if_block_anchor;
    	let current;

    	result = new Result({
    			props: {
    				correct: /*correct*/ ctx[3],
    				correctAnswer: /*questions*/ ctx[6][/*currentOptions*/ ctx[4]].options[/*questions*/ ctx[6][/*currentOptions*/ ctx[4]].correctIndex]
    			},
    			$$inline: true
    		});

    	function select_block_type_3(ctx, dirty) {
    		if (/*currentQuestion*/ ctx[0] < /*total*/ ctx[5] - 1) return create_if_block_3;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			create_component(result.$$.fragment);
    			t = space();
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(result, target, anchor);
    			insert_dev(target, t, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const result_changes = {};
    			if (dirty & /*correct*/ 8) result_changes.correct = /*correct*/ ctx[3];
    			if (dirty & /*currentOptions*/ 16) result_changes.correctAnswer = /*questions*/ ctx[6][/*currentOptions*/ ctx[4]].options[/*questions*/ ctx[6][/*currentOptions*/ ctx[4]].correctIndex];
    			result.$set(result_changes);

    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(result.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(result.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(result, detaching);
    			if (detaching) detach_dev(t);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(157:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (137:2) {#if !showresult }
    function create_if_block_1(ctx) {
    	let progressbar;
    	let t0;
    	let question;
    	let t1;
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	progressbar = new ProgressBar({
    			props: {
    				currentQuestion: /*currentQuestion*/ ctx[0],
    				total: /*total*/ ctx[5]
    			},
    			$$inline: true
    		});

    	question = new Question({
    			props: {
    				questionText: /*questions*/ ctx[6][/*currentQuestion*/ ctx[0]].question
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*currentQuestion*/ ctx[0] < /*total*/ ctx[5] - 1) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(progressbar.$$.fragment);
    			t0 = space();
    			create_component(question.$$.fragment);
    			t1 = space();
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "options svelte-o88a59");
    			add_location(div, file, 141, 3, 3438);
    		},
    		m: function mount(target, anchor) {
    			mount_component(progressbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(question, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const progressbar_changes = {};
    			if (dirty & /*currentQuestion*/ 1) progressbar_changes.currentQuestion = /*currentQuestion*/ ctx[0];
    			progressbar.$set(progressbar_changes);
    			const question_changes = {};
    			if (dirty & /*currentQuestion*/ 1) question_changes.questionText = /*questions*/ ctx[6][/*currentQuestion*/ ctx[0]].question;
    			question.$set(question_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(progressbar.$$.fragment, local);
    			transition_in(question.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(progressbar.$$.fragment, local);
    			transition_out(question.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(progressbar, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(question, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(137:2) {#if !showresult }",
    		ctx
    	});

    	return block;
    }

    // (163:3) {:else}
    function create_else_block_2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Finish";
    			attr_dev(button, "class", "svelte-o88a59");
    			add_location(button, file, 163, 4, 4414);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[13], false, false, false);
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
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(163:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (160:3) {#if (currentQuestion  < total-1) }
    function create_if_block_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Next Question";
    			attr_dev(button, "class", "svelte-o88a59");
    			add_location(button, file, 161, 4, 4344);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[12], false, false, false);
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(160:3) {#if (currentQuestion  < total-1) }",
    		ctx
    	});

    	return block;
    }

    // (150:4) {:else}
    function create_else_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*questions*/ ctx[6][/*currentOptions*/ ctx[4]].options;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*questions, currentOptions, checkAnswer*/ 208) {
    				each_value_1 = /*questions*/ ctx[6][/*currentOptions*/ ctx[4]].options;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(150:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (143:4) {#if (currentQuestion  < total-1) }
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*questions*/ ctx[6][/*currentOptions*/ ctx[4]].options;
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
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*questions, currentOptions, checkAnswer*/ 208) {
    				each_value = /*questions*/ ctx[6][/*currentOptions*/ ctx[4]].options;
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(143:4) {#if (currentQuestion  < total-1) }",
    		ctx
    	});

    	return block;
    }

    // (151:4) {#each questions[currentOptions].options as answer, index}
    function create_each_block_1(ctx) {
    	let option;
    	let t;
    	let current;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[11](/*answer*/ ctx[15]);
    	}

    	option = new Option({
    			props: {
    				answer: /*answer*/ ctx[15],
    				index: /*index*/ ctx[19]
    			},
    			$$inline: true
    		});

    	option.$on("click", click_handler_1);

    	const block = {
    		c: function create() {
    			create_component(option.$$.fragment);
    			t = text("\n\t\t\t\t ");
    		},
    		m: function mount(target, anchor) {
    			mount_component(option, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const option_changes = {};
    			if (dirty & /*currentOptions*/ 16) option_changes.answer = /*answer*/ ctx[15];
    			option.$set(option_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(option.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(option.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(option, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(151:4) {#each questions[currentOptions].options as answer, index}",
    		ctx
    	});

    	return block;
    }

    // (145:4) {#each questions[currentOptions].options as answer}
    function create_each_block(ctx) {
    	let option;
    	let t;
    	let current;

    	function click_handler() {
    		return /*click_handler*/ ctx[10](/*answer*/ ctx[15]);
    	}

    	option = new Option({
    			props: { answer: /*answer*/ ctx[15] },
    			$$inline: true
    		});

    	option.$on("click", click_handler);

    	const block = {
    		c: function create() {
    			create_component(option.$$.fragment);
    			t = text("\n\t\t\t\t ");
    		},
    		m: function mount(target, anchor) {
    			mount_component(option, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const option_changes = {};
    			if (dirty & /*currentOptions*/ 16) option_changes.answer = /*answer*/ ctx[15];
    			option.$set(option_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(option.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(option.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(option, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(145:4) {#each questions[currentOptions].options as answer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentQuestion*/ ctx[0] < /*total*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Svelte Quiz";
    			t1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h1, "class", "svelte-o88a59");
    			add_location(h1, file, 133, 0, 3059);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let currentOptions;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let score = 0;
    	let currentQuestion = 0;
    	let showresult = false;
    	let total = 5;
    	let correct = false;

    	let questions = [
    		{
    			"question": "Which statement describes Svelte best?",
    			"options": [
    				"Svelte is a JavaScript library for fast routing.",
    				"Svelte is a template for building nice quiz apps.",
    				"Svelte is an extension for frameworks like React, Vue and Angular.",
    				"Svelte is a component framework that works like a compiler producing vanilla JavaScript."
    			],
    			"correctIndex": 3
    		},
    		{
    			"question": "What is valid Svelte syntax?",
    			"options": [
    				"Svelte.component ({props: ['text']})",
    				"function Component1 (props) { ... return (<h1> props.text; </h1>)}",
    				"Component1 = new Component (props);",
    				"<script> export let props ..."
    			],
    			"correctIndex": 3
    		},
    		{
    			"question": "What do reactive declarations in Svelte look like?",
    			"options": [
    				"reactive sum = summand1 + summand2;",
    				"$: sum = summand1 + summand2;",
    				"new Reactive({name: \u001esum\u001c; data: summand1 + summand2;})",
    				"sum <= summand1 + summand2;"
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "Which statement is NOT correct?",
    			"options": [
    				"Svelte is component-oriented.",
    				"Svelte produces a bundle.css file with good readability.",
    				"Svelte adds extra library code to your source code.",
    				"Svelte can be used to produce single web components that can be reused in other web applications."
    			],
    			"correctIndex": 1
    		},
    		{
    			"question": "How did you like this quiz?",
    			"options": [
    				"Absolutely the best quiz about Svelte ever!",
    				"Could be better.",
    				"Better practice your UI skills and try again.",
    				"Nice! But these gifs..."
    			],
    			"correctIndex": 0
    		}
    	];

    	function checkAnswer(answer, que) {
    		if (answer === que.options[que.correctIndex]) {
    			$$invalidate(1, score += 1);
    			$$invalidate(3, correct = true);
    		}

    		$$invalidate(2, showresult = true);
    	}

    	function next() {
    		$$invalidate(2, showresult = false);
    		$$invalidate(3, correct = false);
    		$$invalidate(0, currentQuestion += 1);
    	}

    	function restartQuiz() {
    		$$invalidate(2, showresult = false);
    		$$invalidate(0, currentQuestion = 0);
    		$$invalidate(1, score = 0);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = answer => checkAnswer(answer, questions[currentOptions]);
    	const click_handler_1 = answer => checkAnswer(answer, questions[currentOptions]);
    	const click_handler_2 = () => next();
    	const click_handler_3 = () => next();
    	const click_handler_4 = () => restartQuiz();

    	$$self.$capture_state = () => ({
    		Question,
    		ProgressBar,
    		Option,
    		Result,
    		End,
    		score,
    		currentQuestion,
    		showresult,
    		total,
    		correct,
    		questions,
    		checkAnswer,
    		next,
    		restartQuiz,
    		currentOptions
    	});

    	$$self.$inject_state = $$props => {
    		if ("score" in $$props) $$invalidate(1, score = $$props.score);
    		if ("currentQuestion" in $$props) $$invalidate(0, currentQuestion = $$props.currentQuestion);
    		if ("showresult" in $$props) $$invalidate(2, showresult = $$props.showresult);
    		if ("total" in $$props) $$invalidate(5, total = $$props.total);
    		if ("correct" in $$props) $$invalidate(3, correct = $$props.correct);
    		if ("questions" in $$props) $$invalidate(6, questions = $$props.questions);
    		if ("currentOptions" in $$props) $$invalidate(4, currentOptions = $$props.currentOptions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentQuestion*/ 1) {
    			$$invalidate(4, currentOptions = currentQuestion);
    		}
    	};

    	return [
    		currentQuestion,
    		score,
    		showresult,
    		correct,
    		currentOptions,
    		total,
    		questions,
    		checkAnswer,
    		next,
    		restartQuiz,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
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

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
