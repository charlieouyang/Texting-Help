define([
  'underscore',
  'backbone',
  'models/QuestionModel'
], function(_, Backbone, QuestionModel){

  var QuestionsCollection = Backbone.Collection.extend({
    model: QuestionModel,

    initialize : function(options) {
      this.apiUrl = 'http://localhost:6080/api/post';
    },
      
    url : function() {
      return this.apiUrl;
    },
    
    parse : function(data) {
      return data.posts;
    }
  });

  return QuestionsCollection;
});