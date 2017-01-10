define([
  'underscore',
  'backbone',
  'models/LinkModel',
  'text!../../config/config.json'
], function(_, Backbone, LinkModel, appConfig){

  var LinksCollection = Backbone.Collection.extend({
      
      model: LinkModel,

      initialize : function(options) {
        this.linkUrl = options.linkUrl;
        this.appConfig = JSON.parse(appConfig);
        this.apiUrl = this.appConfig.api.endpoint + "/link/";
      },
      
      url : function() {
        return this.apiUrl + this.linkUrl;
      },
    
      parse : function(data) {
          return data.result;
      },
     
  });

  return LinksCollection;

});