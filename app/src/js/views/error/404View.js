define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'text!templates/error/404Template.html'
], function($, _, Backbone, Mustache, error404Template){

  var HomeView = Backbone.View.extend({
    el: $("#content"),

    events: {
    },

    render: function(args){
      var self = this,
          rendered;
      
      rendered = Mustache.to_html(error404Template, args);

      this.$el.html(rendered);
    }
  });

  return HomeView;
  
});
