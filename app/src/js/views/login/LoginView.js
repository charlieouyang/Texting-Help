define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'text!templates/login/loginTemplate.html'
], function($, _, Backbone, Mustache, loginTemplate){

  var LoginView = Backbone.View.extend({
    el: $("#content"),

    events: {
      'click .login-button-submit': 'loginBUttonClick'
    },

    initialize: function(opts) {
      this.sessionModel = opts.session;
    },

    render: function(){
      var self = this;
      var rendered;
      var result = {};

      result.authenticated = this.sessionModel.get('authenticated');
      rendered = Mustache.to_html(loginTemplate, result);
      this.$el.html(rendered);
    },

    loginBUttonClick: function (e) {
      var self = this;
      var username = self.$el.find('.login-username').val();
      var password = self.$el.find('.login-password').val();

      e.preventDefault();

      this.sessionModel.login({
        username: username,
        password: password
      });
    }

  });

  return LoginView;
  
});
