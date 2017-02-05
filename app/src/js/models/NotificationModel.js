define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var NotificationModel = Backbone.Model.extend({

    initialize : function(options) {
      this.apiUrl = 'http://localhost:6080/api/notification';
    },
      
    url : function() {
      return this.apiUrl;
    }
  });

  return NotificationModel;
});
