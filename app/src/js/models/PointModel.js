define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var PointModel = Backbone.Model.extend({

    initialize: function (options) {
      if (options && options.userId) {
        this.apiUrl = 'http://localhost:6080/api/point/' + options.userId;
      }
    },

    url: function() {
      return this.apiUrl;
    }
  });

  return PointModel;
});
