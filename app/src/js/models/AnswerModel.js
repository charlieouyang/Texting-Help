define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var CommentModel = Backbone.Model.extend({

    initialize : function(options) {
      this.apiUrl = 'http://localhost:6080/api/answer';
    },
      
    url : function() {
      return this.apiUrl;
    }
  });

  return CommentModel;
});
