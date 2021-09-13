
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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

    function _loadWasmModule (sync, filepath, src, imports) {
      function _instantiateOrCompile(source, imports, stream) {
        var instantiateFunc = stream ? WebAssembly.instantiateStreaming : WebAssembly.instantiate;
        var compileFunc = stream ? WebAssembly.compileStreaming : WebAssembly.compile;

        if (imports) {
          return instantiateFunc(source, imports)
        } else {
          return compileFunc(source)
        }
      }

      var buf = null;
      var isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

      if (filepath && isNode) {
        var fs = require("fs");
        var path = require("path");

        return new Promise((resolve, reject) => {
          fs.readFile(path.resolve(__dirname, filepath), (error, buffer) => {
            if (error != null) {
              reject(error);
            }

            resolve(_instantiateOrCompile(buffer, imports, false));
          });
        });
      } else if (filepath) {
        return _instantiateOrCompile(fetch(filepath), imports, true)
      }

      if (isNode) {
        buf = Buffer.from(src, 'base64');
      } else {
        var raw = globalThis.atob(src);
        var rawLength = raw.length;
        buf = new Uint8Array(new ArrayBuffer(rawLength));
        for(var i = 0; i < rawLength; i++) {
           buf[i] = raw.charCodeAt(i);
        }
      }

      if(sync) {
        var mod = new WebAssembly.Module(buf);
        return imports ? new WebAssembly.Instance(mod, imports) : mod
      } else {
        return _instantiateOrCompile(buf, imports, false)
      }
    }

    function initMiner(imports){return _loadWasmModule(0, 'build/cb621a1a24442c58.wasm', null, imports)}

    /* src/App.svelte generated by Svelte v3.42.4 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let title;
    	let t1;
    	let body;
    	let div2;
    	let center;
    	let div1;
    	let span;
    	let t3;
    	let br0;
    	let t4;
    	let br1;
    	let t5;
    	let div0;
    	let img;
    	let img_src_value;
    	let t6;
    	let div3;
    	let table;
    	let tr0;
    	let td0;
    	let p0;
    	let t8;
    	let t9;
    	let t10;
    	let tr1;
    	let td1;
    	let p1;
    	let t12;
    	let tr2;
    	let td2;
    	let p2;
    	let t14;
    	let tr3;
    	let td3;
    	let p3;
    	let t16;
    	let tr4;
    	let td4;
    	let p4;
    	let t18;
    	let tr5;
    	let td5;
    	let p5;
    	let t20;
    	let tr6;
    	let td6;
    	let p6;
    	let t22;
    	let script;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			title = element("title");
    			title.textContent = "Chip Clicker";
    			t1 = space();
    			body = element("body");
    			div2 = element("div");
    			center = element("center");
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "0";
    			t3 = text(" Chips ");
    			br0 = element("br");
    			t4 = space();
    			br1 = element("br");
    			t5 = space();
    			div0 = element("div");
    			img = element("img");
    			t6 = space();
    			div3 = element("div");
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			p0 = element("p");
    			p0.textContent = "UPGRADES";
    			t8 = space();
    			t9 = text(/*upgrades*/ ctx[0]);
    			t10 = space();
    			tr1 = element("tr");
    			td1 = element("td");
    			p1 = element("p");
    			p1.textContent = "Look up";
    			t12 = space();
    			tr2 = element("tr");
    			td2 = element("td");
    			p2 = element("p");
    			p2.textContent = "Web RTC";
    			t14 = space();
    			tr3 = element("tr");
    			td3 = element("td");
    			p3 = element("p");
    			p3.textContent = "Blah";
    			t16 = space();
    			tr4 = element("tr");
    			td4 = element("td");
    			p4 = element("p");
    			p4.textContent = "Blah 2";
    			t18 = space();
    			tr5 = element("tr");
    			td5 = element("td");
    			p5 = element("p");
    			p5.textContent = "Dark Blah Returns";
    			t20 = space();
    			tr6 = element("tr");
    			td6 = element("td");
    			p6 = element("p");
    			p6.textContent = "GPU Stats";
    			t22 = space();
    			script = element("script");
    			add_location(title, file, 78, 4, 1524);
    			attr_dev(span, "id", "score");
    			add_location(span, file, 84, 4, 1665);
    			add_location(br0, file, 84, 36, 1697);
    			add_location(br1, file, 86, 4, 1707);
    			if (!src_url_equal(img.src, img_src_value = "./images/chip.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "CPU");
    			attr_dev(img, "height", "256px");
    			attr_dev(img, "width", "256px");
    			attr_dev(img, "class", "svelte-1evf2wd");
    			add_location(img, file, 87, 50, 1763);
    			attr_dev(div0, "class", "clickerContainer unselectable svelte-1evf2wd");
    			add_location(div0, file, 87, 4, 1717);
    			attr_dev(div1, "class", "scoreContainer unselectable svelte-1evf2wd");
    			add_location(div1, file, 83, 8, 1617);
    			add_location(center, file, 82, 8, 1600);
    			attr_dev(div2, "class", "sectionMain svelte-1evf2wd");
    			add_location(div2, file, 81, 4, 1564);
    			attr_dev(p0, "class", "svelte-1evf2wd");
    			add_location(p0, file, 95, 35, 2030);
    			attr_dev(td0, "id", "nameAndCost");
    			attr_dev(td0, "class", "svelte-1evf2wd");
    			add_location(td0, file, 95, 13, 2008);
    			add_location(tr0, file, 95, 8, 2003);
    			attr_dev(p1, "class", "svelte-1evf2wd");
    			add_location(p1, file, 96, 36, 2104);
    			attr_dev(td1, "id", "nameAndCost");
    			attr_dev(td1, "class", "svelte-1evf2wd");
    			add_location(td1, file, 96, 14, 2082);
    			add_location(tr1, file, 96, 9, 2077);
    			attr_dev(p2, "class", "svelte-1evf2wd");
    			add_location(p2, file, 97, 35, 2166);
    			attr_dev(td2, "id", "nameAndCost");
    			attr_dev(td2, "class", "svelte-1evf2wd");
    			add_location(td2, file, 97, 13, 2144);
    			add_location(tr2, file, 97, 8, 2139);
    			attr_dev(p3, "class", "svelte-1evf2wd");
    			add_location(p3, file, 98, 35, 2227);
    			attr_dev(td3, "id", "nameAndCost");
    			attr_dev(td3, "class", "svelte-1evf2wd");
    			add_location(td3, file, 98, 13, 2205);
    			add_location(tr3, file, 98, 8, 2200);
    			attr_dev(p4, "class", "svelte-1evf2wd");
    			add_location(p4, file, 99, 35, 2288);
    			attr_dev(td4, "id", "nameAndCost");
    			attr_dev(td4, "class", "svelte-1evf2wd");
    			add_location(td4, file, 99, 13, 2266);
    			add_location(tr4, file, 99, 8, 2261);
    			attr_dev(p5, "class", "svelte-1evf2wd");
    			add_location(p5, file, 100, 35, 2350);
    			attr_dev(td5, "id", "nameAndCost");
    			attr_dev(td5, "class", "svelte-1evf2wd");
    			add_location(td5, file, 100, 13, 2328);
    			add_location(tr5, file, 100, 8, 2323);
    			attr_dev(p6, "class", "svelte-1evf2wd");
    			add_location(p6, file, 101, 35, 2422);
    			attr_dev(td6, "id", "nameAndCost");
    			attr_dev(td6, "class", "svelte-1evf2wd");
    			add_location(td6, file, 101, 13, 2400);
    			add_location(tr6, file, 101, 8, 2395);
    			attr_dev(table, "class", "upgradeButton");
    			add_location(table, file, 94, 4, 1941);
    			attr_dev(div3, "class", "sectionSide svelte-1evf2wd");
    			add_location(div3, file, 93, 0, 1909);
    			add_location(script, file, 108, 4, 2500);
    			add_location(body, file, 80, 0, 1553);
    			add_location(main, file, 77, 0, 1513);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, title);
    			append_dev(main, t1);
    			append_dev(main, body);
    			append_dev(body, div2);
    			append_dev(div2, center);
    			append_dev(center, div1);
    			append_dev(div1, span);
    			append_dev(div1, t3);
    			append_dev(div1, br0);
    			append_dev(div1, t4);
    			append_dev(div1, br1);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(body, t6);
    			append_dev(body, div3);
    			append_dev(div3, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, p0);
    			append_dev(td0, t8);
    			append_dev(td0, t9);
    			append_dev(table, t10);
    			append_dev(table, tr1);
    			append_dev(tr1, td1);
    			append_dev(td1, p1);
    			append_dev(table, t12);
    			append_dev(table, tr2);
    			append_dev(tr2, td2);
    			append_dev(td2, p2);
    			append_dev(table, t14);
    			append_dev(table, tr3);
    			append_dev(tr3, td3);
    			append_dev(td3, p3);
    			append_dev(table, t16);
    			append_dev(table, tr4);
    			append_dev(tr4, td4);
    			append_dev(td4, p4);
    			append_dev(table, t18);
    			append_dev(table, tr5);
    			append_dev(tr5, td5);
    			append_dev(td5, p5);
    			append_dev(table, t20);
    			append_dev(table, tr6);
    			append_dev(tr6, td6);
    			append_dev(td6, p6);
    			append_dev(body, t22);
    			append_dev(body, script);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(table, "click", /*buyUpgrade*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*upgrades*/ 1) set_data_dev(t9, /*upgrades*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('App', slots, []);
    	let state;

    	let miner = () => {
    		
    	};

    	let wasmExports = null;
    	let wasmMemory = new WebAssembly.Memory({ initial: 256, maximum: 256 });

    	let wasmTable = new WebAssembly.Table({
    			'initial': 1,
    			'maximum': 1,
    			'element': 'anyfunc'
    		});

    	let asmLibraryArg = {
    		"__handle_stack_overflow": () => {
    			
    		},
    		"emscripten_resize_heap": () => {
    			
    		},
    		"__lock": () => {
    			
    		},
    		"__unlock": () => {
    			
    		},
    		"memory": wasmMemory,
    		"table": wasmTable
    	};

    	var importObject = {
    		imports: {
    			main(arg) {
    				console.log(arg);
    			}
    		}
    	};

    	onMount(async () => {
    		// console.log(initMiner)
    		// miner = await initMiner()
    		// miner['constructor']
    		// console.log(miner)
    		initMiner().then(instance => {
    			console.log(instance);
    		});
    	});

    	let score = 0;
    	let upgradeCost = 10;
    	let upgrades = 0;

    	function buyUpgrade() {
    		if (score >= upgradeCost) {
    			score = score - upgradeCost;
    			$$invalidate(0, upgrades = upgrades + 1);
    			upgradeCost = Math.round(upgradeCost * 1.5);
    			score = score;
    			upgradeCost = upgradeCost;
    			$$invalidate(0, upgrades);
    		}
    	}

    	function addToScore(amount) {
    		score = score + amount;
    		score = score;
    		miner.mine("hello", "h", "21e8", 1);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = amount => addToScore(amount);

    	$$self.$capture_state = () => ({
    		initMiner,
    		onMount,
    		state,
    		miner,
    		wasmExports,
    		wasmMemory,
    		wasmTable,
    		asmLibraryArg,
    		importObject,
    		score,
    		upgradeCost,
    		upgrades,
    		buyUpgrade,
    		addToScore
    	});

    	$$self.$inject_state = $$props => {
    		if ('state' in $$props) state = $$props.state;
    		if ('miner' in $$props) miner = $$props.miner;
    		if ('wasmExports' in $$props) wasmExports = $$props.wasmExports;
    		if ('wasmMemory' in $$props) wasmMemory = $$props.wasmMemory;
    		if ('wasmTable' in $$props) wasmTable = $$props.wasmTable;
    		if ('asmLibraryArg' in $$props) asmLibraryArg = $$props.asmLibraryArg;
    		if ('importObject' in $$props) importObject = $$props.importObject;
    		if ('score' in $$props) score = $$props.score;
    		if ('upgradeCost' in $$props) upgradeCost = $$props.upgradeCost;
    		if ('upgrades' in $$props) $$invalidate(0, upgrades = $$props.upgrades);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [upgrades, buyUpgrade, addToScore, click_handler];
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
