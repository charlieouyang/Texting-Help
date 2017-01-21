define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var QuestionModel = Backbone.Model.extend({

    initialize : function(options) {
      if (options.id) {
        this.apiUrl = 'http://localhost:6080/api/post/' + options.id;
      } else {
        this.apiUrl = 'http://localhost:6080/api/post';
      }
    },
      
    url : function() {
      return this.apiUrl;
    }
  });

  return QuestionModel;
});
