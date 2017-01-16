define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var QuestionModel = Backbone.Model.extend({

    initialize : function(options) {
      this.apiUrl = 'http://localhost:6080/api/post/' + options.id;
    },
      
    url : function() {
      return this.apiUrl;
    }
  });

  return QuestionModel;
});
