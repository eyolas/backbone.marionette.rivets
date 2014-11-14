// Rivet MarionetteJS (Backbone.Marionette)
// ----------------------------------
// v1.0.0
//
// Copyright (c)2014 eyolas <dtouzet@gmail.com>
// Distributed under MIT license
//
// http://marionettejs.com


/*!
 * Includes sightglass
 * https://github.com/mikeric/rivets/
 *
 * Includes rivets
 * https://github.com/mikeric/sightglass/
 */


(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'underscore', 'backbone.marionette'], function(Backbone, _) {
      return (root.Marionette = factory(root, Backbone, _));
    });
  } else if (typeof exports !== 'undefined') {
    var Backbone = require('backbone');
    var _ = require('underscore');
    var Marionette = require('backbone.marionette');
    module.exports = factory(root, Backbone, _);
  } else {
    root.Marionette = factory(root, root.Backbone, root._);
  }

}(this, function(root, Backbone, _) {

  var Marionette = Backbone.Marionette;
  
    // Public sightglass interface.
    function sightglass(obj, keypath, callback, options) {
      return new Observer(obj, keypath, callback, options)
    }
  
    // Batteries not included.
    sightglass.adapters = {}
  
    // Constructs a new keypath observer and kicks things off.
    function Observer(obj, keypath, callback, options) {
      this.options = options || {}
      this.options.adapters = this.options.adapters || {}
      this.obj = obj
      this.keypath = keypath
      this.callback = callback
      this.objectPath = []
      this.parse()
  
      if(isObject(this.target = this.realize())) {
        this.set(true, this.key, this.target, this.callback)
      }
    }
  
    // Tokenizes the provided keypath string into interface + path tokens for the
    // observer to work with.
    Observer.tokenize = function(keypath, interfaces, root) {
      tokens = []
      current = {i: root, path: ''}
  
      for (index = 0; index < keypath.length; index++) {
        chr = keypath.charAt(index)
  
        if(!!~interfaces.indexOf(chr)) {
          tokens.push(current)
          current = {i: chr, path: ''}
        } else {
          current.path += chr
        }
      }
  
      tokens.push(current)
      return tokens
    }
  
    // Parses the keypath using the interfaces defined on the view. Sets variables
    // for the tokenized keypath as well as the end key.
    Observer.prototype.parse = function() {
      interfaces = this.interfaces()
  
      if(!interfaces.length) {
        error('Must define at least one adapter interface.')
      }
  
      if(!!~interfaces.indexOf(this.keypath[0])) {
        root = this.keypath[0]
        path = this.keypath.substr(1)
      } else {
        if(typeof (root = this.options.root || sightglass.root) === 'undefined') {
          error('Must define a default root adapter.')
        }
  
        path = this.keypath
      }
  
      this.tokens = Observer.tokenize(path, interfaces, root)
      this.key = this.tokens.pop()
    }
  
    // Realizes the full keypath, attaching observers for every key and correcting
    // old observers to any changed objects in the keypath.
    Observer.prototype.realize = function() {
      current = this.obj
      unreached = false
  
      this.tokens.forEach(function(token, index) {
        if(isObject(current)) {
          if(typeof this.objectPath[index] !== 'undefined') {
            if(current !== (prev = this.objectPath[index])) {
              this.set(false, token, prev, this.update.bind(this))
              this.set(true, token, current, this.update.bind(this))
              this.objectPath[index] = current
            }
          } else {
            this.set(true, token, current, this.update.bind(this))
            this.objectPath[index] = current
          }
  
          current = this.get(token, current)
        } else {
          if(unreached === false) unreached = index
  
          if(prev = this.objectPath[index]) {
            this.set(false, token, prev, this.update.bind(this))
          }
        }
      }, this)
  
      if(unreached !== false) {
        this.objectPath.splice(unreached)
      }
  
      return current
    }
  
    // Updates the keypath. This is called when any intermediary key is changed.
    Observer.prototype.update = function() {
      if((next = this.realize()) !== this.target) {
        if(isObject(this.target)) {
          this.set(false, this.key, this.target, this.callback)
        }
  
        if(isObject(next)) {
          this.set(true, this.key, next, this.callback)
        }
  
        oldValue = this.value()
        this.target = next
  
        if(this.value() !== oldValue) this.callback()
      }
    }
  
    // Reads the current end value of the observed keypath. Returns undefined if
    // the full keypath is unreachable.
    Observer.prototype.value = function() {
      if(isObject(this.target)) {
        return this.get(this.key, this.target)
      }
    }
  
    // Sets the current end value of the observed keypath. Calling setValue when
    // the full keypath is unreachable is a no-op.
    Observer.prototype.setValue = function(value) {
      if(isObject(this.target)) {
        this.adapter(this.key).set(this.target, this.key.path, value)
      }
    }
  
    // Gets the provided key on an object.
    Observer.prototype.get = function(key, obj) {
      return this.adapter(key).get(obj, key.path)
    }
  
    // Observes or unobserves a callback on the object using the provided key.
    Observer.prototype.set = function(active, key, obj, callback) {
      action = active ? 'observe' : 'unobserve'
      this.adapter(key)[action](obj, key.path, callback)
    }
  
    // Returns an array of all unique adapter interfaces available.
    Observer.prototype.interfaces = function() {
      interfaces = Object.keys(this.options.adapters)
  
      Object.keys(sightglass.adapters).forEach(function(i) {
        if(!~interfaces.indexOf(i)) {
          interfaces.push(i)
        }
      })
  
      return interfaces
    }
  
    // Convenience function to grab the adapter for a specific key.
    Observer.prototype.adapter = function(key) {
      return this.options.adapters[key.i] ||
        sightglass.adapters[key.i]
    }
  
    // Unobserves the entire keypath.
    Observer.prototype.unobserve = function() {
      this.tokens.forEach(function(token, index) {
        if(obj = this.objectPath[index]) {
          this.set(false, token, obj, this.update.bind(this))
        }
      }, this)
  
      if(isObject(this.target)) {
        this.set(false, this.key, this.target, this.callback)
      }
    }
  
    // Check if a value is an object than can be observed.
    function isObject(obj) {
      return typeof obj === 'object' && obj !== null
    }
  
    // Error thrower.
    function error(message) {
      throw new Error('[sightglass] ' + message)
    }
  
    // Export module for Node and the browser.
    
  
  
  
  var Rivets;
  
  Rivets = {
    options: ['prefix', 'templateDelimiters', 'rootInterface', 'preloadData', 'handler'],
    extensions: ['binders', 'formatters', 'components', 'adapters'],
    "public": {
      binders: {},
      components: {},
      formatters: {},
      adapters: {},
      prefix: 'rv',
      templateDelimiters: ['{', '}'],
      rootInterface: '.',
      preloadData: true,
      handler: function(context, ev, binding) {
        return this.call(context, ev, binding.view.models);
      },
      configure: function(options) {
        var descriptor, key, option, value;
        if (options == null) {
          options = {};
        }
        for (option in options) {
          value = options[option];
          if (option === 'binders' || option === 'components' || option === 'formatters' || option === 'adapters') {
            for (key in value) {
              descriptor = value[key];
              Rivets[option][key] = descriptor;
            }
          } else {
            Rivets["public"][option] = value;
          }
        }
      },
      bind: function(el, models, options) {
        var view;
        if (models == null) {
          models = {};
        }
        if (options == null) {
          options = {};
        }
        view = new Rivets.View(el, models, options);
        view.bind();
        return view;
      }
    }
  };
  
  var bindMethod, unbindMethod, _ref;
  
  if (window['jQuery'] || window['$']) {
    _ref = 'on' in jQuery.prototype ? ['on', 'off'] : ['bind', 'unbind'], bindMethod = _ref[0], unbindMethod = _ref[1];
    Rivets.Util = {
      bindEvent: function(el, event, handler) {
        return jQuery(el)[bindMethod](event, handler);
      },
      unbindEvent: function(el, event, handler) {
        return jQuery(el)[unbindMethod](event, handler);
      },
      getInputValue: function(el) {
        var $el;
        $el = jQuery(el);
        if ($el.attr('type') === 'checkbox') {
          return $el.is(':checked');
        } else {
          return $el.val();
        }
      }
    };
  } else {
    Rivets.Util = {
      bindEvent: (function() {
        if ('addEventListener' in window) {
          return function(el, event, handler) {
            return el.addEventListener(event, handler, false);
          };
        }
        return function(el, event, handler) {
          return el.attachEvent('on' + event, handler);
        };
      })(),
      unbindEvent: (function() {
        if ('removeEventListener' in window) {
          return function(el, event, handler) {
            return el.removeEventListener(event, handler, false);
          };
        }
        return function(el, event, handler) {
          return el.detachEvent('on' + event, handler);
        };
      })(),
      getInputValue: function(el) {
        var o, _i, _len, _results;
        if (el.type === 'checkbox') {
          return el.checked;
        } else if (el.type === 'select-multiple') {
          _results = [];
          for (_i = 0, _len = el.length; _i < _len; _i++) {
            o = el[_i];
            if (o.selected) {
              _results.push(o.value);
            }
          }
          return _results;
        } else {
          return el.value;
        }
      }
    };
  }
  
  Rivets.TypeParser = (function() {
    function TypeParser() {}
  
    TypeParser.types = {
      primitive: 0,
      keypath: 1
    };
  
    TypeParser.parse = function(string) {
      if (/^'.*'$|^".*"$/.test(string)) {
        return {
          type: this.types.primitive,
          value: string.slice(1, -1)
        };
      } else if (string === 'true') {
        return {
          type: this.types.primitive,
          value: true
        };
      } else if (string === 'false') {
        return {
          type: this.types.primitive,
          value: false
        };
      } else if (string === 'null') {
        return {
          type: this.types.primitive,
          value: null
        };
      } else if (string === 'undefined') {
        return {
          type: this.types.primitive,
          value: void 0
        };
      } else if (isNaN(Number(string)) === false) {
        return {
          type: this.types.primitive,
          value: Number(string)
        };
      } else {
        return {
          type: this.types.keypath,
          value: string
        };
      }
    };
  
    return TypeParser;
  
  })();
  
  Rivets.TextTemplateParser = (function() {
    function TextTemplateParser() {}
  
    TextTemplateParser.types = {
      text: 0,
      binding: 1
    };
  
    TextTemplateParser.parse = function(template, delimiters) {
      var index, lastIndex, lastToken, length, substring, tokens, value;
      tokens = [];
      length = template.length;
      index = 0;
      lastIndex = 0;
      while (lastIndex < length) {
        index = template.indexOf(delimiters[0], lastIndex);
        if (index < 0) {
          tokens.push({
            type: this.types.text,
            value: template.slice(lastIndex)
          });
          break;
        } else {
          if (index > 0 && lastIndex < index) {
            tokens.push({
              type: this.types.text,
              value: template.slice(lastIndex, index)
            });
          }
          lastIndex = index + delimiters[0].length;
          index = template.indexOf(delimiters[1], lastIndex);
          if (index < 0) {
            substring = template.slice(lastIndex - delimiters[1].length);
            lastToken = tokens[tokens.length - 1];
            if ((lastToken != null ? lastToken.type : void 0) === this.types.text) {
              lastToken.value += substring;
            } else {
              tokens.push({
                type: this.types.text,
                value: substring
              });
            }
            break;
          }
          value = template.slice(lastIndex, index).trim();
          tokens.push({
            type: this.types.binding,
            value: value
          });
          lastIndex = index + delimiters[1].length;
        }
      }
      return tokens;
    };
  
    return TextTemplateParser;
  
  })();
  
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  
  Rivets.View = (function() {
    function View(els, models, options) {
      var k, option, v, _base, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
      this.els = els;
      this.models = models;
      if (options == null) {
        options = {};
      }
      this.update = __bind(this.update, this);
      this.publish = __bind(this.publish, this);
      this.sync = __bind(this.sync, this);
      this.unbind = __bind(this.unbind, this);
      this.bind = __bind(this.bind, this);
      this.select = __bind(this.select, this);
      this.build = __bind(this.build, this);
      this.componentRegExp = __bind(this.componentRegExp, this);
      this.bindingRegExp = __bind(this.bindingRegExp, this);
      this.options = __bind(this.options, this);
      if (!(this.els.jquery || this.els instanceof Array)) {
        this.els = [this.els];
      }
      _ref = Rivets.extensions;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        this[option] = {};
        if (options[option]) {
          _ref1 = options[option];
          for (k in _ref1) {
            v = _ref1[k];
            this[option][k] = v;
          }
        }
        _ref2 = Rivets["public"][option];
        for (k in _ref2) {
          v = _ref2[k];
          if ((_base = this[option])[k] == null) {
            _base[k] = v;
          }
        }
      }
      _ref3 = Rivets.options;
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        option = _ref3[_j];
        this[option] = options[option] || Rivets["public"][option];
      }
      this.build();
    }
  
    View.prototype.options = function() {
      var option, options, _i, _len, _ref;
      options = {};
      _ref = Rivets.extensions.concat(Rivets.options);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        options[option] = this[option];
      }
      return options;
    };
  
    View.prototype.bindingRegExp = function() {
      return new RegExp("^" + this.prefix + "-");
    };
  
    View.prototype.componentRegExp = function() {
      return new RegExp("^" + (this.prefix.toUpperCase()) + "-");
    };
  
    View.prototype.build = function() {
      var bindingRegExp, buildBinding, componentRegExp, el, parse, _i, _len, _ref;
      this.bindings = [];
      bindingRegExp = this.bindingRegExp();
      componentRegExp = this.componentRegExp();
      buildBinding = (function(_this) {
        return function(binding, node, type, declaration) {
          var context, ctx, dependencies, keypath, options, pipe, pipes;
          options = {};
          pipes = (function() {
            var _i, _len, _ref, _results;
            _ref = declaration.split('|');
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              pipe = _ref[_i];
              _results.push(pipe.trim());
            }
            return _results;
          })();
          context = (function() {
            var _i, _len, _ref, _results;
            _ref = pipes.shift().split('<');
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              ctx = _ref[_i];
              _results.push(ctx.trim());
            }
            return _results;
          })();
          keypath = context.shift();
          options.formatters = pipes;
          if (dependencies = context.shift()) {
            options.dependencies = dependencies.split(/\s+/);
          }
          return _this.bindings.push(new Rivets[binding](_this, node, type, keypath, options));
        };
      })(this);
      parse = (function(_this) {
        return function(node) {
          var attribute, attributes, binder, block, childNode, delimiters, identifier, n, parser, regexp, text, token, tokens, type, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _results;
          if (node.nodeType === 3) {
            parser = Rivets.TextTemplateParser;
            if (delimiters = _this.templateDelimiters) {
              if ((tokens = parser.parse(node.data, delimiters)).length) {
                if (!(tokens.length === 1 && tokens[0].type === parser.types.text)) {
                  for (_i = 0, _len = tokens.length; _i < _len; _i++) {
                    token = tokens[_i];
                    text = document.createTextNode(token.value);
                    node.parentNode.insertBefore(text, node);
                    if (token.type === 1) {
                      buildBinding('TextBinding', text, null, token.value);
                    }
                  }
                  node.parentNode.removeChild(node);
                }
              }
            }
          } else if (node.nodeType === 1) {
            if (componentRegExp.test(node.nodeName)) {
              type = node.nodeName.replace(componentRegExp, '').toLowerCase();
              _this.bindings.push(new Rivets.ComponentBinding(_this, node, type));
            } else {
              block = node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE';
              _ref = node.attributes;
              for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                attribute = _ref[_j];
                if (bindingRegExp.test(attribute.name)) {
                  type = attribute.name.replace(bindingRegExp, '');
                  if (!(binder = _this.binders[type])) {
                    _ref1 = _this.binders;
                    for (identifier in _ref1) {
                      value = _ref1[identifier];
                      if (identifier !== '*' && identifier.indexOf('*') !== -1) {
                        regexp = new RegExp("^" + (identifier.replace(/\*/g, '.+')) + "$");
                        if (regexp.test(type)) {
                          binder = value;
                        }
                      }
                    }
                  }
                  binder || (binder = _this.binders['*']);
                  if (binder.block) {
                    block = true;
                    attributes = [attribute];
                  }
                }
              }
              _ref2 = attributes || node.attributes;
              for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                attribute = _ref2[_k];
                if (bindingRegExp.test(attribute.name)) {
                  type = attribute.name.replace(bindingRegExp, '');
                  buildBinding('Binding', node, type, attribute.value);
                }
              }
            }
          }
          if (!block) {
            _ref3 = (function() {
              var _len3, _m, _ref3, _results1;
              _ref3 = node.childNodes;
              _results1 = [];
              for (_m = 0, _len3 = _ref3.length; _m < _len3; _m++) {
                n = _ref3[_m];
                _results1.push(n);
              }
              return _results1;
            })();
            _results = [];
            for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
              childNode = _ref3[_l];
              _results.push(parse(childNode));
            }
            return _results;
          }
        };
      })(this);
      _ref = this.els;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        parse(el);
      }
      this.bindings.sort(function(a, b) {
        var _ref1, _ref2;
        return (((_ref1 = b.binder) != null ? _ref1.priority : void 0) || 0) - (((_ref2 = a.binder) != null ? _ref2.priority : void 0) || 0);
      });
    };
  
    View.prototype.select = function(fn) {
      var binding, _i, _len, _ref, _results;
      _ref = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        if (fn(binding)) {
          _results.push(binding);
        }
      }
      return _results;
    };
  
    View.prototype.bind = function() {
      var binding, _i, _len, _ref, _results;
      _ref = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        _results.push(binding.bind());
      }
      return _results;
    };
  
    View.prototype.unbind = function() {
      var binding, _i, _len, _ref, _results;
      _ref = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        _results.push(binding.unbind());
      }
      return _results;
    };
  
    View.prototype.sync = function() {
      var binding, _i, _len, _ref, _results;
      _ref = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        _results.push(binding.sync());
      }
      return _results;
    };
  
    View.prototype.publish = function() {
      var binding, _i, _len, _ref, _results;
      _ref = this.select(function(b) {
        return b.binder.publishes;
      });
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        _results.push(binding.publish());
      }
      return _results;
    };
  
    View.prototype.update = function(models) {
      var binding, key, model, _i, _len, _ref, _results;
      if (models == null) {
        models = {};
      }
      for (key in models) {
        model = models[key];
        this.models[key] = model;
      }
      _ref = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        _results.push(binding.update(models));
      }
      return _results;
    };
  
    return View;
  
  })();
  
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
  
  Rivets.Binding = (function() {
    function Binding(view, el, type, keypath, options) {
      this.view = view;
      this.el = el;
      this.type = type;
      this.keypath = keypath;
      this.options = options != null ? options : {};
      this.getValue = __bind(this.getValue, this);
      this.update = __bind(this.update, this);
      this.unbind = __bind(this.unbind, this);
      this.bind = __bind(this.bind, this);
      this.publish = __bind(this.publish, this);
      this.sync = __bind(this.sync, this);
      this.set = __bind(this.set, this);
      this.eventHandler = __bind(this.eventHandler, this);
      this.formattedValue = __bind(this.formattedValue, this);
      this.parseTarget = __bind(this.parseTarget, this);
      this.observe = __bind(this.observe, this);
      this.setBinder = __bind(this.setBinder, this);
      this.formatters = this.options.formatters || [];
      this.dependencies = [];
      this.formatterObservers = {};
      this.model = void 0;
      this.setBinder();
    }
  
    Binding.prototype.setBinder = function() {
      var identifier, regexp, value, _ref;
      if (!(this.binder = this.view.binders[this.type])) {
        _ref = this.view.binders;
        for (identifier in _ref) {
          value = _ref[identifier];
          if (identifier !== '*' && identifier.indexOf('*') !== -1) {
            regexp = new RegExp("^" + (identifier.replace(/\*/g, '.+')) + "$");
            if (regexp.test(this.type)) {
              this.binder = value;
              this.args = new RegExp("^" + (identifier.replace(/\*/g, '(.+)')) + "$").exec(this.type);
              this.args.shift();
            }
          }
        }
      }
      this.binder || (this.binder = this.view.binders['*']);
      if (this.binder instanceof Function) {
        return this.binder = {
          routine: this.binder
        };
      }
    };
  
    Binding.prototype.observe = function(obj, keypath, callback) {
      return Rivets.sightglass(obj, keypath, callback, {
        root: this.view.rootInterface,
        adapters: this.view.adapters
      });
    };
  
    Binding.prototype.parseTarget = function() {
      var token;
      token = Rivets.TypeParser.parse(this.keypath);
      if (token.type === 0) {
        return this.value = token.value;
      } else {
        this.observer = this.observe(this.view.models, this.keypath, this.sync);
        return this.model = this.observer.target;
      }
    };
  
    Binding.prototype.formattedValue = function(value) {
      var ai, arg, args, fi, formatter, id, observer, processedArgs, _base, _i, _j, _len, _len1, _ref;
      _ref = this.formatters;
      for (fi = _i = 0, _len = _ref.length; _i < _len; fi = ++_i) {
        formatter = _ref[fi];
        args = formatter.match(/[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g);
        id = args.shift();
        formatter = this.view.formatters[id];
        args = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = args.length; _j < _len1; _j++) {
            arg = args[_j];
            _results.push(Rivets.TypeParser.parse(arg));
          }
          return _results;
        })();
        processedArgs = [];
        for (ai = _j = 0, _len1 = args.length; _j < _len1; ai = ++_j) {
          arg = args[ai];
          processedArgs.push(arg.type === 0 ? arg.value : ((_base = this.formatterObservers)[fi] || (_base[fi] = {}), !(observer = this.formatterObservers[fi][ai]) ? (observer = this.observe(this.view.models, arg.value, this.sync), this.formatterObservers[fi][ai] = observer) : void 0, observer.value()));
        }
        if ((formatter != null ? formatter.read : void 0) instanceof Function) {
          value = formatter.read.apply(formatter, [value].concat(__slice.call(processedArgs)));
        } else if (formatter instanceof Function) {
          value = formatter.apply(null, [value].concat(__slice.call(processedArgs)));
        }
      }
      return value;
    };
  
    Binding.prototype.eventHandler = function(fn) {
      var binding, handler;
      handler = (binding = this).view.handler;
      return function(ev) {
        return handler.call(fn, this, ev, binding);
      };
    };
  
    Binding.prototype.set = function(value) {
      var _ref;
      value = value instanceof Function && !this.binder["function"] ? this.formattedValue(value.call(this.model)) : this.formattedValue(value);
      return (_ref = this.binder.routine) != null ? _ref.call(this, this.el, value) : void 0;
    };
  
    Binding.prototype.sync = function() {
      var dependency, observer;
      return this.set((function() {
        var _i, _j, _len, _len1, _ref, _ref1, _ref2;
        if (this.observer) {
          if (this.model !== this.observer.target) {
            _ref = this.dependencies;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              observer = _ref[_i];
              observer.unobserve();
            }
            this.dependencies = [];
            if (((this.model = this.observer.target) != null) && ((_ref1 = this.options.dependencies) != null ? _ref1.length : void 0)) {
              _ref2 = this.options.dependencies;
              for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                dependency = _ref2[_j];
                observer = this.observe(this.model, dependency, this.sync);
                this.dependencies.push(observer);
              }
            }
          }
          return this.observer.value();
        } else {
          return this.value;
        }
      }).call(this));
    };
  
    Binding.prototype.publish = function() {
      var args, formatter, id, value, _i, _len, _ref, _ref1, _ref2;
      if (this.observer) {
        value = this.getValue(this.el);
        _ref = this.formatters.slice(0).reverse();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          formatter = _ref[_i];
          args = formatter.split(/\s+/);
          id = args.shift();
          if ((_ref1 = this.view.formatters[id]) != null ? _ref1.publish : void 0) {
            value = (_ref2 = this.view.formatters[id]).publish.apply(_ref2, [value].concat(__slice.call(args)));
          }
        }
        return this.observer.setValue(value);
      }
    };
  
    Binding.prototype.bind = function() {
      var dependency, observer, _i, _len, _ref, _ref1, _ref2;
      this.parseTarget();
      if ((_ref = this.binder.bind) != null) {
        _ref.call(this, this.el);
      }
      if ((this.model != null) && ((_ref1 = this.options.dependencies) != null ? _ref1.length : void 0)) {
        _ref2 = this.options.dependencies;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          dependency = _ref2[_i];
          observer = this.observe(this.model, dependency, this.sync);
          this.dependencies.push(observer);
        }
      }
      if (this.view.preloadData) {
        return this.sync();
      }
    };
  
    Binding.prototype.unbind = function() {
      var ai, args, fi, observer, _i, _len, _ref, _ref1, _ref2, _ref3;
      if ((_ref = this.binder.unbind) != null) {
        _ref.call(this, this.el);
      }
      if ((_ref1 = this.observer) != null) {
        _ref1.unobserve();
      }
      _ref2 = this.dependencies;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        observer = _ref2[_i];
        observer.unobserve();
      }
      this.dependencies = [];
      _ref3 = this.formatterObservers;
      for (fi in _ref3) {
        args = _ref3[fi];
        for (ai in args) {
          observer = args[ai];
          observer.unobserve();
        }
      }
      return this.formatterObservers = {};
    };
  
    Binding.prototype.update = function(models) {
      var _ref, _ref1;
      if (models == null) {
        models = {};
      }
      this.model = (_ref = this.observer) != null ? _ref.target : void 0;
      this.unbind();
      if ((_ref1 = this.binder.update) != null) {
        _ref1.call(this, models);
      }
      return this.bind();
    };
  
    Binding.prototype.getValue = function(el) {
      if (this.binder && (this.binder.getValue != null)) {
        return this.binder.getValue.call(this, el);
      } else {
        return Rivets.Util.getInputValue(el);
      }
    };
  
    return Binding;
  
  })();
  
  Rivets.ComponentBinding = (function(_super) {
    __extends(ComponentBinding, _super);
  
    function ComponentBinding(view, el, type) {
      var attribute, _i, _len, _ref, _ref1;
      this.view = view;
      this.el = el;
      this.type = type;
      this.unbind = __bind(this.unbind, this);
      this.bind = __bind(this.bind, this);
      this.update = __bind(this.update, this);
      this.locals = __bind(this.locals, this);
      this.component = this.view.components[this.type];
      this.attributes = {};
      this.inflections = {};
      _ref = this.el.attributes || [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attribute = _ref[_i];
        if (_ref1 = attribute.name, __indexOf.call(this.component.attributes, _ref1) >= 0) {
          this.attributes[attribute.name] = attribute.value;
        } else {
          this.inflections[attribute.name] = attribute.value;
        }
      }
    }
  
    ComponentBinding.prototype.sync = function() {};
  
    ComponentBinding.prototype.locals = function(models) {
      var inverse, key, model, path, result, _i, _len, _ref, _ref1;
      if (models == null) {
        models = this.view.models;
      }
      result = {};
      _ref = this.inflections;
      for (key in _ref) {
        inverse = _ref[key];
        _ref1 = inverse.split('.');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          path = _ref1[_i];
          result[key] = (result[key] || models)[path];
        }
      }
      for (key in models) {
        model = models[key];
        if (result[key] == null) {
          result[key] = model;
        }
      }
      return result;
    };
  
    ComponentBinding.prototype.update = function(models) {
      var _ref;
      return (_ref = this.componentView) != null ? _ref.update(this.locals(models)) : void 0;
    };
  
    ComponentBinding.prototype.bind = function() {
      var el, _ref;
      if (this.componentView != null) {
        return (_ref = this.componentView) != null ? _ref.bind() : void 0;
      } else {
        el = this.component.build.call(this.attributes);
        (this.componentView = new Rivets.View(el, this.locals(), this.view.options)).bind();
        return this.el.parentNode.replaceChild(el, this.el);
      }
    };
  
    ComponentBinding.prototype.unbind = function() {
      var _ref;
      return (_ref = this.componentView) != null ? _ref.unbind() : void 0;
    };
  
    return ComponentBinding;
  
  })(Rivets.Binding);
  
  Rivets.TextBinding = (function(_super) {
    __extends(TextBinding, _super);
  
    function TextBinding(view, el, type, keypath, options) {
      this.view = view;
      this.el = el;
      this.type = type;
      this.keypath = keypath;
      this.options = options != null ? options : {};
      this.sync = __bind(this.sync, this);
      this.formatters = this.options.formatters || [];
      this.dependencies = [];
      this.formatterObservers = {};
    }
  
    TextBinding.prototype.binder = {
      routine: function(node, value) {
        return node.data = value != null ? value : '';
      }
    };
  
    TextBinding.prototype.sync = function() {
      return TextBinding.__super__.sync.apply(this, arguments);
    };
  
    return TextBinding;
  
  })(Rivets.Binding);
  
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
  
  Rivets["public"].binders.text = function(el, value) {
    if (el.textContent != null) {
      return el.textContent = value != null ? value : '';
    } else {
      return el.innerText = value != null ? value : '';
    }
  };
  
  Rivets["public"].binders.html = function(el, value) {
    return el.innerHTML = value != null ? value : '';
  };
  
  Rivets["public"].binders.show = function(el, value) {
    return el.style.display = value ? '' : 'none';
  };
  
  Rivets["public"].binders.hide = function(el, value) {
    return el.style.display = value ? 'none' : '';
  };
  
  Rivets["public"].binders.enabled = function(el, value) {
    return el.disabled = !value;
  };
  
  Rivets["public"].binders.disabled = function(el, value) {
    return el.disabled = !!value;
  };
  
  Rivets["public"].binders.checked = {
    publishes: true,
    priority: 2000,
    bind: function(el) {
      return Rivets.Util.bindEvent(el, 'change', this.publish);
    },
    unbind: function(el) {
      return Rivets.Util.unbindEvent(el, 'change', this.publish);
    },
    routine: function(el, value) {
      var _ref;
      if (el.type === 'radio') {
        return el.checked = ((_ref = el.value) != null ? _ref.toString() : void 0) === (value != null ? value.toString() : void 0);
      } else {
        return el.checked = !!value;
      }
    }
  };
  
  Rivets["public"].binders.unchecked = {
    publishes: true,
    priority: 2000,
    bind: function(el) {
      return Rivets.Util.bindEvent(el, 'change', this.publish);
    },
    unbind: function(el) {
      return Rivets.Util.unbindEvent(el, 'change', this.publish);
    },
    routine: function(el, value) {
      var _ref;
      if (el.type === 'radio') {
        return el.checked = ((_ref = el.value) != null ? _ref.toString() : void 0) !== (value != null ? value.toString() : void 0);
      } else {
        return el.checked = !value;
      }
    }
  };
  
  Rivets["public"].binders.value = {
    publishes: true,
    priority: 2000,
    bind: function(el) {
      this.event = el.tagName === 'SELECT' ? 'change' : 'input';
      return Rivets.Util.bindEvent(el, this.event, this.publish);
    },
    unbind: function(el) {
      return Rivets.Util.unbindEvent(el, this.event, this.publish);
    },
    routine: function(el, value) {
      var o, _i, _len, _ref, _ref1, _ref2, _results;
      if (window.jQuery != null) {
        el = jQuery(el);
        if ((value != null ? value.toString() : void 0) !== ((_ref = el.val()) != null ? _ref.toString() : void 0)) {
          return el.val(value != null ? value : '');
        }
      } else {
        if (el.type === 'select-multiple') {
          if (value != null) {
            _results = [];
            for (_i = 0, _len = el.length; _i < _len; _i++) {
              o = el[_i];
              _results.push(o.selected = (_ref1 = o.value, __indexOf.call(value, _ref1) >= 0));
            }
            return _results;
          }
        } else if ((value != null ? value.toString() : void 0) !== ((_ref2 = el.value) != null ? _ref2.toString() : void 0)) {
          return el.value = value != null ? value : '';
        }
      }
    }
  };
  
  Rivets["public"].binders["if"] = {
    block: true,
    priority: 3000,
    bind: function(el) {
      var attr, declaration;
      if (this.marker == null) {
        attr = [this.view.prefix, this.type].join('-').replace('--', '-');
        declaration = el.getAttribute(attr);
        this.marker = document.createComment(" rivets: " + this.type + " " + declaration + " ");
        this.bound = false;
        el.removeAttribute(attr);
        el.parentNode.insertBefore(this.marker, el);
        return el.parentNode.removeChild(el);
      }
    },
    unbind: function() {
      var _ref;
      return (_ref = this.nested) != null ? _ref.unbind() : void 0;
    },
    routine: function(el, value) {
      var key, model, models, _ref;
      if (!!value === !this.bound) {
        if (value) {
          models = {};
          _ref = this.view.models;
          for (key in _ref) {
            model = _ref[key];
            models[key] = model;
          }
          (this.nested || (this.nested = new Rivets.View(el, models, this.view.options()))).bind();
          this.marker.parentNode.insertBefore(el, this.marker.nextSibling);
          return this.bound = true;
        } else {
          el.parentNode.removeChild(el);
          this.nested.unbind();
          return this.bound = false;
        }
      }
    },
    update: function(models) {
      var _ref;
      return (_ref = this.nested) != null ? _ref.update(models) : void 0;
    }
  };
  
  Rivets["public"].binders.unless = {
    block: true,
    priority: 3000,
    bind: function(el) {
      return Rivets["public"].binders["if"].bind.call(this, el);
    },
    unbind: function() {
      return Rivets["public"].binders["if"].unbind.call(this);
    },
    routine: function(el, value) {
      return Rivets["public"].binders["if"].routine.call(this, el, !value);
    },
    update: function(models) {
      return Rivets["public"].binders["if"].update.call(this, models);
    }
  };
  
  Rivets["public"].binders['on-*'] = {
    "function": true,
    priority: 1000,
    unbind: function(el) {
      if (this.handler) {
        return Rivets.Util.unbindEvent(el, this.args[0], this.handler);
      }
    },
    routine: function(el, value) {
      if (this.handler) {
        Rivets.Util.unbindEvent(el, this.args[0], this.handler);
      }
      return Rivets.Util.bindEvent(el, this.args[0], this.handler = this.eventHandler(value));
    }
  };
  
  Rivets["public"].binders['each-*'] = {
    block: true,
    priority: 3000,
    bind: function(el) {
      var attr, view, _i, _len, _ref;
      if (this.marker == null) {
        attr = [this.view.prefix, this.type].join('-').replace('--', '-');
        this.marker = document.createComment(" rivets: " + this.type + " ");
        this.iterated = [];
        el.removeAttribute(attr);
        el.parentNode.insertBefore(this.marker, el);
        el.parentNode.removeChild(el);
      } else {
        _ref = this.iterated;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.bind();
        }
      }
    },
    unbind: function(el) {
      var view, _i, _len, _ref, _results;
      if (this.iterated != null) {
        _ref = this.iterated;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          _results.push(view.unbind());
        }
        return _results;
      }
    },
    routine: function(el, collection) {
      var binding, data, i, index, key, model, modelName, options, previous, template, view, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results;
      modelName = this.args[0];
      collection = collection || [];
      if (this.iterated.length > collection.length) {
        _ref = Array(this.iterated.length - collection.length);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          view = this.iterated.pop();
          view.unbind();
          this.marker.parentNode.removeChild(view.els[0]);
        }
      }
      for (index = _j = 0, _len1 = collection.length; _j < _len1; index = ++_j) {
        model = collection[index];
        data = {
          index: index
        };
        data[modelName] = model;
        if (this.iterated[index] == null) {
          _ref1 = this.view.models;
          for (key in _ref1) {
            model = _ref1[key];
            if (data[key] == null) {
              data[key] = model;
            }
          }
          previous = this.iterated.length ? this.iterated[this.iterated.length - 1].els[0] : this.marker;
          options = this.view.options();
          options.preloadData = true;
          template = el.cloneNode(true);
          view = new Rivets.View(template, data, options);
          view.bind();
          this.iterated.push(view);
          this.marker.parentNode.insertBefore(template, previous.nextSibling);
        } else if (this.iterated[index].models[modelName] !== model) {
          this.iterated[index].update(data);
        }
      }
      if (el.nodeName === 'OPTION') {
        _ref2 = this.view.bindings;
        _results = [];
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          binding = _ref2[_k];
          if (binding.el === this.marker.parentNode && binding.type === 'value') {
            _results.push(binding.sync());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    },
    update: function(models) {
      var data, key, model, view, _i, _len, _ref, _results;
      data = {};
      for (key in models) {
        model = models[key];
        if (key !== this.args[0]) {
          data[key] = model;
        }
      }
      _ref = this.iterated;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        _results.push(view.update(data));
      }
      return _results;
    }
  };
  
  Rivets["public"].binders['class-*'] = function(el, value) {
    var elClass;
    elClass = " " + el.className + " ";
    if (!value === (elClass.indexOf(" " + this.args[0] + " ") !== -1)) {
      return el.className = value ? "" + el.className + " " + this.args[0] : elClass.replace(" " + this.args[0] + " ", ' ').trim();
    }
  };
  
  Rivets["public"].binders['*'] = function(el, value) {
    if (value != null) {
      return el.setAttribute(this.type, value);
    } else {
      return el.removeAttribute(this.type);
    }
  };
  
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
  
  Rivets["public"].adapters['.'] = {
    id: '_rv',
    counter: 0,
    weakmap: {},
    weakReference: function(obj) {
      var id;
      if (!obj.hasOwnProperty(this.id)) {
        id = this.counter++;
        this.weakmap[id] = {
          callbacks: {}
        };
        Object.defineProperty(obj, this.id, {
          value: id
        });
      }
      return this.weakmap[obj[this.id]];
    },
    stubFunction: function(obj, fn) {
      var map, original, weakmap;
      original = obj[fn];
      map = this.weakReference(obj);
      weakmap = this.weakmap;
      return obj[fn] = function() {
        var callback, k, r, response, _i, _len, _ref, _ref1, _ref2, _ref3;
        response = original.apply(obj, arguments);
        _ref = map.pointers;
        for (r in _ref) {
          k = _ref[r];
          _ref3 = (_ref1 = (_ref2 = weakmap[r]) != null ? _ref2.callbacks[k] : void 0) != null ? _ref1 : [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            callback = _ref3[_i];
            callback();
          }
        }
        return response;
      };
    },
    observeMutations: function(obj, ref, keypath) {
      var fn, functions, map, _base, _i, _len;
      if (Array.isArray(obj)) {
        map = this.weakReference(obj);
        if (map.pointers == null) {
          map.pointers = {};
          functions = ['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'];
          for (_i = 0, _len = functions.length; _i < _len; _i++) {
            fn = functions[_i];
            this.stubFunction(obj, fn);
          }
        }
        if ((_base = map.pointers)[ref] == null) {
          _base[ref] = [];
        }
        if (__indexOf.call(map.pointers[ref], keypath) < 0) {
          return map.pointers[ref].push(keypath);
        }
      }
    },
    unobserveMutations: function(obj, ref, keypath) {
      var idx, keypaths, _ref;
      if (Array.isArray(obj && (obj[this.id] != null))) {
        if (keypaths = (_ref = this.weakReference(obj).pointers) != null ? _ref[ref] : void 0) {
          idx = keypaths.indexOf(keypath);
          if (idx >= 0) {
            return keypaths.splice(idx, 1);
          }
        }
      }
    },
    observe: function(obj, keypath, callback) {
      var callbacks, value;
      callbacks = this.weakReference(obj).callbacks;
      if (callbacks[keypath] == null) {
        callbacks[keypath] = [];
        value = obj[keypath];
        Object.defineProperty(obj, keypath, {
          enumerable: true,
          get: function() {
            return value;
          },
          set: (function(_this) {
            return function(newValue) {
              var _i, _len, _ref;
              if (newValue !== value) {
                value = newValue;
                _ref = callbacks[keypath].slice();
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  callback = _ref[_i];
                  if (__indexOf.call(callbacks[keypath], callback) >= 0) {
                    callback();
                  }
                }
                return _this.observeMutations(newValue, obj[_this.id], keypath);
              }
            };
          })(this)
        });
      }
      if (__indexOf.call(callbacks[keypath], callback) < 0) {
        callbacks[keypath].push(callback);
      }
      return this.observeMutations(obj[keypath], obj[this.id], keypath);
    },
    unobserve: function(obj, keypath, callback) {
      var callbacks, idx;
      callbacks = this.weakmap[obj[this.id]].callbacks[keypath];
      idx = callbacks.indexOf(callback);
      if (idx >= 0) {
        callbacks.splice(idx, 1);
      }
      return this.unobserveMutations(obj[keypath], obj[this.id], keypath);
    },
    get: function(obj, keypath) {
      return obj[keypath];
    },
    set: function(obj, keypath, value) {
      return obj[keypath] = value;
    }
  };
  
  var rivets;
  
  Rivets.factory = function(sightglass) {
    Rivets.sightglass = sightglass;
    Rivets["public"]._ = Rivets;
    return Rivets["public"];
  };
  
  rivets = Rivets.factory(sightglass);
  

  Marionette.ItemView.prototype.getTemplateData = function() {
      var data;
      if (this.model) {
          data = {
              model: this.model
          };
      } else if (this.collection) {
          data = {
              items: this.collection
          };
      }
  
      return data;
  };
  
  Marionette.ItemView.prototype._oldRenderTemplate = Marionette.ItemView.prototype._renderTemplate;
  
  Marionette.ItemView.prototype._renderTemplate = function() {
      var template = this.getTemplate();
  
      // Allow template-less item views
      if (template === false) {
          return;
      }
  
      if (!template) {
          throw new Marionette.Error({
              name: 'UndefinedTemplateError',
              message: 'Cannot render the template since it is null or undefined.'
          });
      }
  
      // Add in entity data and template helpers
      var data = this.getTemplateData();
      data = this.mixinTemplateHelpers(data);
  
      // Render and add to el
      var html = Marionette.Renderer.render(template, {}, this);
      this.attachElContent(html);
  
      this.binder = rivets.bind(this.el, data);
  
      return this;
  };
  
  Marionette.ItemView.prototype.oldDestroy = Marionette.ItemView.prototype.destroy;
  
  Marionette.ItemView.prototype.destroy = function() {
      if (this.isDestroyed) {
          return;
      }
  
      if (this.binder) {
        this.binder.unbind();  
      } 
  
      return Marionette.View.prototype.destroy.apply(this, arguments);
  };

  return Marionette;
}));