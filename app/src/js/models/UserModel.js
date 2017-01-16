define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var ClickModel = Backbone.Model.extend({

    initialize: function (options) {
      // this.appConfig = JSON.parse(appConfig);
      // this.apiUrl = this.appConfig.api.endpoint + "/click";
      this.apiUrl = 'http://localhost:6080/api/users/' + options.userId;
    },

    url: function() {
      return this.apiUrl;
    }
  });

  return ClickModel;
});
