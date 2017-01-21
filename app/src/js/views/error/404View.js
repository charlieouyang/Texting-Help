define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'text!templates/error/404Template.html'
], function($, _, Backbone, Mustache, error404Template){

  var HomeView = Backbone.View.extend({

    events: {
    },

    render: function(opts){
      var self = this,
          rendered;
      
      rendered = Mustache.to_html(error404Template);
      this.el = rendered;
      opts.finished();
    }
  });

  return HomeView;
  
});
