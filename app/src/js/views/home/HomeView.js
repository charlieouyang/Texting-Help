define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'models/EmailModel',
  'models/ClickModel',
  'text!templates/home/homeTemplate.html'
], function($, _, Backbone, Mustache, EmailModel, ClickModel, homeTemplate){

  var HomeView = Backbone.View.extend({

    events: {

    },

    initialize: function(opts) {
      this.sessionModel = opts.session;
    },

    render: function(opts){
      var self = this;
      var rendered;
      var result = {};

      result.authenticated = this.sessionModel.get('authenticated');
      rendered = Mustache.to_html(homeTemplate, result);
      this.el = rendered;

      opts.finished();
    }

  });

  return HomeView;
  
});
