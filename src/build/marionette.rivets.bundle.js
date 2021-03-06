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
  // @include ../../.tmp/sightglass.bare.js
  
  // @include ../../.tmp/rivets.bare.js

  // @include ../marionette.rivets.itemView.js

  return Marionette;
}));