define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'models/UserModel',
  'text!templates/user/userTemplate.html'
], function($, _, Backbone, Mustache, UserModel, userTemplate){

  var LoginView = Backbone.View.extend({
    el: $("#content"),

    events: {
      'click .login-button-submit': 'loginBUttonClick'
    },

    initialize: function(opts) {
      this.sessionModel = opts.session;
      this.userModel = new UserModel({userId: opts.userInUrlId});
    },

    render: function(){
      var self = this;
      var rendered;
      var result = {};

      this.userModel.fetch({
        success: function(){
          result.user = self.userModel.toJSON();
          rendered = Mustache.to_html(userTemplate, result);
          self.$el.html(rendered);
        },
        error: function(){
          //Re-route?
          console.log("failed");
        }
      });
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
