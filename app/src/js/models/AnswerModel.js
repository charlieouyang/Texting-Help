define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var CommentModel = Backbone.Model.extend({

    initialize : function(options) {
      this.apiUrl = 'http://localhost:6080/api/answer';
      if (options && options.id) {
        this.id = options.id;
      }
    },
      
    url : function() {
      if (this.id) {
        return this.apiUrl + '/' + this.id;
      } else {
        return this.apiUrl;
      }
    }
  });

  return CommentModel;
});
