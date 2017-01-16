define([
  'jquery',
  'backbone',
  'router'
], function($, Backbone, Router) {

  var SessionModel = Backbone.Model.extend({

    url: '/users',

    initialize: function() {
      //Ajax Request Configuration
      //To Set The CSRF Token To Request Header
      $.ajaxSetup({
        headers: {
          'Authorization': 'Gotta replace this with whatever authorization header is stored in localstorage'
        }
      });

      this.url = 'http://localhost:6080/api';

      //Check for sessionStorage support
      if (Storage && sessionStorage) {
        this.supportStorage = true;
      }
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

      // if (user) {
      //   this.url = 'http://localhost:6080/api/users';
      //   this.
      // }

      var Session = this.fetch();

      Session.done(function(response) {
        that.set('authenticated', true);
        that.set('user', JSON.stringify(response.user));
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