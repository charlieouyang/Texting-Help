define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'models/QuestionModel',
  'models/CommentModel',
  'models/AnswerModel',
  'text!templates/question/questionCreateEditTemplate.html'
], function($, _, Backbone, Mustache, Question, Comment, Answer, questionCreateEditTemplate){

  var QuestionsView = Backbone.View.extend({

    initialize: function (opts) {
      this.question = new Question({
        id: opts.questionId
      });
    },

    render: function(opts){
      var self = this;
      var result = {};
      var rendered;

      if (this.question.id) {
        //Edit a pre-existing question
        this.question.fetch({
          success: function() {
            result = self.cleanseData(self.question.toJSON());
            rendered = Mustache.to_html(questionCreateEditTemplate, result);
            self.el = rendered;
            opts.finished();

            $(".post-question").on("click", function(e){
              self.postQuestionClick(e);
            });
          },
          error: function() {
            //Reroute to 404
            opts.finished();
          }
        });
      } else {
        //New question
        rendered = Mustache.to_html(questionCreateEditTemplate, result);
        self.el = rendered;
        opts.finished();

        $(".post-question").on("click", function(e){
          self.postQuestionClick(e);
        });
      }
    },

    postQuestionClick: function (e) {
      var self = this;
      var questionTitle = $(".question-title").val();
      var questionDescription = $(".question-description").val();

      if (questionTitle === "" || questionDescription === "") {
        alert("Please fill out the form to post a question!");
      } else {
        this.question.save({
          title: questionTitle,
          description: questionDescription, 
          tags: ''
        }, {
          success: function() {
            //hard refresh of the page to get logged out state
            Backbone.history.navigate('#questions', true);
          },
          error: function() {
            alert('Posting failed... Maybe user token is stale? Please logout and login again.');
          }
        });
      }
    }

  });

  return QuestionsView;
  
});
