define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'text!templates/login/loginTemplate.html'
], function($, _, Backbone, Mustache, loginTemplate){

  var LoginView = Backbone.View.extend({

    initialize: function(opts) {
      this.sessionModel = opts.session;
    },

    render: function(opts){
      var self = this;
      var rendered;
      var result = {};

      result.authenticated = this.sessionModel.get('authenticated');
      rendered = Mustache.to_html(loginTemplate, result);
      this.el = rendered;

      opts.finished();

      $(".login-button-submit").on('click', function(e){
        self.loginBUttonClick(e);
      });
    },

    loginBUttonClick: function (e) {
      var self = this;
      var username = $('.login-username').val();
      var password = $('.login-password').val();

      e.preventDefault();

      this.sessionModel.login({
        username: username,
        password: password
      });
    }

  });

  return LoginView;
  
});
