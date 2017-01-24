define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'models/UserModel',
  'text!templates/user/userTemplate.html'
], function($, _, Backbone, Mustache, UserModel, userTemplate){

  var LoginView = Backbone.View.extend({

    initialize: function(opts) {
      this.sessionModel = opts.session;

      if (opts.userInUrlId) {
        this.userModel = new UserModel({userId: opts.userInUrlId});
      } else {
        this.userModel = new UserModel();
      }
    },

    render: function(opts){
      var self = this;
      var rendered;
      var result = {};
      var sessionModel = this.sessionModel;
      var sessionUser;

      if (this.userModel.get('userId')) {
        this.userModel.fetch({
          success: function(){
            //If the user model that was fetched is same username as sessionModel... Then load
            //createdit version of user template and populate fields..

            result.user = self.userModel.toJSON();
            sessionUser = sessionModel.get('user');
            if (sessionUser && sessionUser.username && sessionUser.username === self.userModel.get('username')) {
              result.user.editable = true;
              rendered = Mustache.to_html(userTemplate, result);
              self.el = rendered;
            } else {
              result.user.editable = false;
              rendered = Mustache.to_html(userTemplate, result);
              self.el = rendered;
            }

            opts.finished();
            $(".post-user").on('click', function(e){
              self.postUserClick(e);
            });
            $(".update-user").on('click', function(e){
              self.updateUserClick(e);
            });
          },
          error: function(){
            //Re-route?
            opts.finished();
            console.log("failed");
          }
        });
      } else {
        result.user = false;
        rendered = Mustache.to_html(userTemplate, result);
        self.el = rendered;
        opts.finished();

        $(".post-user").on('click', function(e){
          self.postUserClick(e);
        });
      }
    },

    postUserClick: function (e) {
      var self = this;
      var username = $('.user-create-edit-form .username').val();
      var fullname = $('.user-create-edit-form .fullname').val();
      var password = $('.user-create-edit-form .password').val();
      var email = $('.user-create-edit-form .email').val();

      if (username === '' || fullname === '' || password === '' || email === '') {
        alert('Please enter all fields in this form to create user!');
        return;
      }

      this.userModel.save({
        username: username,
        password: password, 
        name: fullname,
        email: email
      }, {
        success: function(userModel) {
          //hard refresh of the page to get logged out state
          alert('User created!');
          Backbone.history.navigate('#user/' + userModel.get('username'), true);
        },
        error: function(error) {
          alert('User creation failed... Maybe username is already taken.');
        }
      });
    },

    updateUserClick: function (e) {
      var self = this;
      var fullname = $('.user-create-edit-form .fullname').val();
      var email = $('.user-create-edit-form .email').val();

      if (fullname === '' || email === '') {
        alert('Please enter all fields in this form to create user!');
        return;
      }

      this.userModel.save({
        name: fullname,
        email: email
      }, {
        success: function(userModel) {
          //hard refresh of the page to get logged out state
          alert('User updated!');
          Backbone.history.navigate('#questions', true);
        },
        error: function(error) {
          alert('User creation failed... Maybe username is already taken.');
        }
      });
    }
  });

  return LoginView;
  
});
