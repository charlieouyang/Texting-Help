define([
  'jquery',
  'backbone',
  'router'
], function($, Backbone, Router) {

  var SessionModel = Backbone.Model.extend({

    initialize: function() {
      var userToken = 'temproary token';
      //Ajax Request Configuration
      //To Set The CSRF Token To Request Header

      //Check for sessionStorage support
      if (Storage && sessionStorage) {
        this.supportStorage = true;

        if (sessionStorage.user && sessionStorage.user !== 'undefined') {
          userObject = JSON.parse(sessionStorage.user);
          userToken = userObject.token;
          this.url = 'http://localhost:6080/api/users/' + userObject.username;
        } else {
          this.url = 'http://localhost:6080/api';
        }
      }

      $.ajaxSetup({
        headers: {
          'Authorization': userToken
        }
      });
    },

    get: function(key) {
      if (this.supportStorage) {
        var data = sessionStorage.getItem(key);
        if (data && data[0] === '{') {
          return JSON.parse(data);
        } else {
          return data;
        }
      } else {
        return Backbone.Model.prototype.get.call(this, key);
      }
    },


    set: function(key, value) {
      if (this.supportStorage) {
        sessionStorage.setItem(key, value);
      } else {
        Backbone.Model.prototype.set.call(this, key, value);
      }
      return this;
    },

    unset: function(key) {
      if (this.supportStorage) {
        sessionStorage.removeItem(key);
      } else {
        Backbone.Model.prototype.unset.call(this, key);
      }
      return this;
    },

    clear: function() {
      if (this.supportStorage) {
        sessionStorage.clear();
      } else {
        Backbone.Model.prototype.clear(this);
      }
    },

    login: function(credentials) {
      var that = this;
      var login = $.ajax({
        url: this.url + '/login',
        data: credentials,
        type: 'POST'
      });
      login.done(function(response) {

        //Set the $.ajax authorization token here
        $.ajaxSetup({
          headers: {
            'Authorization': response.token
          }
        });

        that.set('authenticated', true);
        that.set('user', JSON.stringify(response));
        if (that.get('redirectFrom')) {
          var path = that.get('redirectFrom');
          that.unset('redirectFrom');
          Backbone.history.navigate(path, {
            trigger: true
          });
        } else {
          Backbone.history.navigate('', {
            trigger: true
          });
        }
      });
      login.fail(function() {
        Backbone.history.navigate('login', {
          trigger: true
        });
      });
    },

    logout: function() {
      this.clear();
      this.initialize();
      Backbone.history.navigate('', {
        trigger: true
      });
      //hard refresh of the page to get logged out state
      window.location.reload();
    },


    getAuth: function(callback) {
      var that = this;
      var user = this.get('user');
      var Session = this.fetch();

      // if (FB) {
      //   FB.getLoginStatus(function(response) {
      //     console.log(response);
      //   });
      // }

      Session.done(function(response) {
        if (response && response.token) {
          that.set('authenticated', true);
          that.set('user', JSON.stringify(response));
        } else {
          that.clear();
          that.initialize();
        }
      });

      Session.fail(function(response) {
        response = JSON.parse(response.responseText);
        that.clear();
        csrf = response.csrf !== csrf ? response.csrf : csrf;
        that.initialize();
      });

      Session.always(callback);
    }
  });

  return SessionModel;
});