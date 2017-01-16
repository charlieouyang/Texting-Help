define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'text!templates/header/headerTemplate.html'
], function($, _, Backbone, Mustache, headerTemplate){

  var HeaderView = Backbone.View.extend({
    el: $("#header"),

    events: {
      'click .header-logout': 'logoutButtonClick'
    },

    initialize: function(opts) {
      this.sessionModel = opts.session;
    },

    render: function(){
      var self = this;
      var rendered;
      var result = {};
      var user;

      result.authenticated = this.sessionModel.get('authenticated');

      if (result.authenticated) {
        result.user = this.sessionModel.get('user');
      } 

      rendered = Mustache.to_html(headerTemplate, result);
      this.$el.html(rendered);
    },

    logoutButtonClick: function(e) {
      this.sessionModel.logout();
    }

  });

  return HeaderView;
});
