define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'models/UserModel',
  'text!templates/header/headerTemplate.html'
], function($, _, Backbone, Mustache, User, headerTemplate){

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

      if (result.authenticated === 'true') {
        result.user = this.sessionModel.get('user');

        if (result.user.type === 'facebook') {
          result.userTypeIsFacebook = true;
        } else {
          result.userTypeIsFacebook = false;
          $(".fb-user-container").hide();
        }
      } else {
        result.userTypeIsFacebook = false;
      }

      $("#fb-user-information").on('change', function(e){
        var fbUserName = e.currentTarget.getAttribute('fb-id');
        var fbFullName = e.currentTarget.getAttribute('name');

        if (fbUserName === "" && fbFullName === "") {
          if (self.sessionModel.get('authenticated') === "true") {
            self.sessionModel.logout();
          }
          return;
        }

        if (self.sessionModel.get('authenticated') !== 'true') {
          self.sessionModel.login('facebook', {
            'username': fbUserName,
            'type': 'facebook'
          }, function(response){
            //If login failed, that means the FB user doesn't exist in the DB...
            //So we need to create a user... 
            //After creating the user, we will log in 1 more time
            if (response.statusText === 'Not Found') {
              fbUserModel = new User();

              fbUserModel.save({
                username: fbUserName,
                name: fbFullName,
                type: 'facebook'
              }, {
                success: function(userModel) {
                  self.sessionModel.login('facebook', {
                    'username': userModel.get('username'),
                    'type': 'facebook'
                  }, function(response){
                    //
                  });
                },
                error: function(error) {
                  console.log('error... We should never be here');
                }
              });
            } else {
              //Found fb user in text-help DB... 
            }
          });
        } else {
          //It's already authenticated..
        }
      });

      rendered = Mustache.to_html(headerTemplate, result);
      this.$el.html(rendered);

      // if (result.user && result.user.type === 'facebook') {
      //   $(".fb-user-container").show();
      //   $(".fb-user-profile-picture").show();
      // }
    },

    logoutButtonClick: function(e) {
      this.sessionModel.logout();
    }

  });

  return HeaderView;
});
