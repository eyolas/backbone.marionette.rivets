// Rivet MarionetteJS (Backbone.Marionette)
// ----------------------------------
// v1.0.0
//
// Copyright (c)2014 eyolas <dtouzet@gmail.com>
// Distributed under MIT license
//
// http://marionettejs.com

(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'underscore', 'rivets', 'backbone.marionette'], function(Backbone, rivets, _) {
      return (root.Marionette = factory(root, Backbone, rivets, _));
    });
  } else if (typeof exports !== 'undefined') {
    var Backbone = require('backbone');
    var _ = require('underscore');
    var Marionette = require('backbone.marionette');
    var rivets = require('rivets');
    module.exports = factory(root, Backbone, rivets, _);
  } else {
    root.Marionette = factory(root, root.Backbone, root.rivets, root._);
  }

}(this, function(root, Backbone, rivets, _) {
  'use strict';

  var Marionette = Backbone.Marionette;

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