define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var EmailModel = Backbone.Model.extend({

    initialize: function (options) {
      // this.appConfig = JSON.parse(appConfig);
      // this.apiUrl = this.appConfig.api.endpoint + "/email";
    },

    url: function() {
      return this.apiUrl;
    }
  });

  return EmailModel;
});
