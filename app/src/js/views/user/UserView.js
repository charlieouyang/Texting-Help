define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'Utils',
  'models/UserModel',
  'models/PointModel',
  'text!templates/user/userTemplate.html'
], function($, _, Backbone, Mustache, Utils, UserModel, Point, userTemplate){

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
            self.pointModel = new Point({userId: self.userModel.id});
            self.pointModel.fetch({
              success: function(){
                result.user = self.userModel.toJSON();
                result.user.point_total = self.pointModel.get('point_total');
                sessionUser = sessionModel.get('user');

                if (result.user.type === 'facebook') {
                  result.user.isFacebook = true;
                } else {
                  result.user.isEmail = true;
                }

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
              error: function() {
                //Re-route?
                opts.finished();
                console.log("failed");
              }
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

      if (!Utils.validateFormFields([{
        'fullname-form-group': 'fullname'
      }, {
        'username-form-group': 'username'
      }, {
        'email-form-group': 'email'
      }, {
        'password-form-group': 'password'
      }])) {
        return;
      }

      this.userModel.save({
        username: username,
        password: password, 
        name: fullname,
        email: email,
        type: 'email'
      }, {
        success: function(userModel) {
          //hard refresh of the page to get logged out state
          $.notify({message: 'User created! Please log in'},{type: 'success'});
          Backbone.history.navigate('#user/' + userModel.get('id'), true);
        },
        error: function(userModel, error) {
          Utils.errorHandlingFromApi(userModel, error, 'User creation error!');
        }
      });
    },

    updateUserClick: function (e) {
      var self = this;
      var fullname = $('.user-create-edit-form .fullname').val();
      var email = $('.user-create-edit-form .email').val();

      if (!Utils.validateFormFields([{
        'full-name-form-group': 'fullname'
      }, {
        'email-form-group': 'email'
      }])) {
        return;
      }

      this.userModel.save({
        name: fullname,
        email: email
      }, {
        success: function(userModel) {
          //hard refresh of the page to get logged out state
          $.notify({message: 'User updated!'},{type: 'success'});
          Backbone.history.navigate('#questions', true);
        },
        error: function(userModel, error) {
          Utils.errorHandlingFromApi(userModel, error, 'User update error!', self.sessionModel);
        }
      });
    }
  });

  return LoginView;
  
});
