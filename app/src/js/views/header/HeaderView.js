define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'text!templates/header/headerTemplate.html'
], function($, _, Backbone, Mustache, headerTemplate){

  var HeaderView = Backbone.View.extend({
    el: $("#header"),

    render: function(){
      this.$el.html(headerTemplate);
    }

  });

  return HeaderView;
});
