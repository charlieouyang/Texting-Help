define([
  'underscore',
  'backbone',
  'text!../../config/config.json'
], function(_, Backbone, appConfig) {
  
  var EmailModel = Backbone.Model.extend({

    initialize: function (options) {
      this.appConfig = JSON.parse(appConfig);
      this.apiUrl = this.appConfig.api.endpoint + "/email";
    },

    url: function() {
      return this.apiUrl;
    }
  });

  return EmailModel;
});
