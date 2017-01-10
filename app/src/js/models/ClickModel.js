define([
  'underscore',
  'backbone',
  'text!../../config/config.json'
], function(_, Backbone, appConfig) {
  
  var ClickModel = Backbone.Model.extend({

    initialize: function (options) {
      this.appConfig = JSON.parse(appConfig);
      this.apiUrl = this.appConfig.api.endpoint + "/click";
    },

    url: function() {
      return this.apiUrl;
    }
  });

  return ClickModel;
});
