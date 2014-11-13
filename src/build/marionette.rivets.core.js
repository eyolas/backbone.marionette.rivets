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

  // @include ../marionette.rivets.itemView.js

  return Marionette;
}));