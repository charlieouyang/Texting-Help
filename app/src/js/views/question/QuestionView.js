define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'models/QuestionModel',
  'text!templates/question/questionTemplate.html'
], function($, _, Backbone, Mustache, Question, questionTemplate){

  var QuestionsView = Backbone.View.extend({
    el: $("#content"),

    events: {

    },

    initialize: function (opts) {
      this.question = new Question({
        id: opts.questionId
      });
    },

    render: function(){
      var self = this;
      var result = {};
      var rendered;

      this.question.fetch({
        success: function() {
          result = self.cleanseData(self.question.toJSON());
          rendered = Mustache.to_html(questionTemplate, result);
          self.$el.html(rendered);
        },
        error: function() {
          //Reroute to 404
        }
      });
    },

    cleanseData: function(data) {
      var self = this;
      var differenceInMilliseconds;

      //Get the post... Set the time
      differenceInMilliseconds = Date.now() - Date.parse(data.post.createdAt);
      data.post.createdTimeDifference = self.calculateTimeDifference(differenceInMilliseconds);

      //Get the comments... Set the time
      data.post.numberOfComments = data.post.Comments.length;
      data.post.Comments.forEach(function(dataObject){
        differenceInMilliseconds = Date.now() - Date.parse(dataObject.createdAt);
        dataObject.createdTimeDifference = self.calculateTimeDifference(differenceInMilliseconds);
      });

      //Get the answers... Set the time
      data.post.numberOfAnswers = data.post.Answers.length;
      data.post.Answers.forEach(function(dataObject){
        differenceInMilliseconds = Date.now() - Date.parse(dataObject.createdAt);

        if (dataObject.Comments) {
          dataObject.numberOfComments = dataObject.Comments.length;
          dataObject.createdTimeDifference = self.calculateTimeDifference(differenceInMilliseconds);

          //Get the comments of the answer... Set the time
          dataObject.numberOfComments = dataObject.Comments.length;
          dataObject.Comments.forEach(function(commentObjectOfAnswer){
            differenceInMilliseconds = Date.now() - Date.parse(commentObjectOfAnswer.createdAt);
            commentObjectOfAnswer.createdTimeDifference = self.calculateTimeDifference(differenceInMilliseconds);
          });
        }
      });

      return data;
    },

    calculateTimeDifference: function(t) {
      var cd = 24 * 60 * 60 * 1000,
          ch = 60 * 60 * 1000,
          d = Math.floor(t / cd),
          h = Math.floor( (t - d * cd) / cd),
          m = Math.round( (t - d * cd - h * cd) / 60000),
          pad = function(n) { return n < 10 ? '0' + n : n; };

      if (m === 60) {
        h++;
        m = 0;
      }
      if (h === 24) {
        d++;
        h = 0;
      }
      
      if (d > 0) {
        return d + ' days ago';
      }
      if (h > 0) {
        return h + ' hours ago';
      }
      if (m > 0) {
        return m + ' minutes ago';
      }

      return 'seconds ago';
    }

  });

  return QuestionsView;
  
});
