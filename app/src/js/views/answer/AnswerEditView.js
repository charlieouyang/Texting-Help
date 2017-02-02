define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'Utils',
  'models/QuestionModel',
  'models/AnswerModel',
  'text!templates/answer/answerEditTemplate.html'
], function($, _, Backbone, Mustache, Utils, Question, Answer, answerEditTemplate){

  var AnswerEditView = Backbone.View.extend({

    initialize: function (opts) {
      this.answer = new Answer({
        id: opts.answerId
      });
      this.userSession = opts.session;
    },

    render: function(opts){
      var self = this;
      var result = {};
      var rendered;
      var answer;
      var post;

      this.answer.fetch({
        success: function(answerModel) {
          answer = answerModel.get('answer');
          if (self.userSession && self.userSession.get('user') && 
            self.userSession.get('user').id === answer.UserId) {
            self.question = new Question({ id: answer.PostId });

            self.question.fetch({
              success: function (questionModel){
                post = questionModel.get('post');
                result.post = post;
                result.answer = answer;

                rendered = Mustache.to_html(answerEditTemplate, result);
                self.el = rendered;
                opts.finished();

                $(".post-answer").on("click", function(e){
                  self.postAnswerClick(e);
                });
              },
              error: function () {
                alert('post does not exist!');
                opts.finished();
              }
            });
          } else {
            alert('You are not allowed to edit this answer!');
            opts.finished();
          }
        },
        error: function() {
          alert('answer does not exist!');
          opts.finished();
        }
      });
    },

    postAnswerClick: function (e) {
      var self = this;
      var answerDescription = $(".answer-description").val();

      if (!Utils.validateFormFields([{
        'answer-description-form-group': 'answer-description'
      }])) {
        return;
      }

      if (answerDescription === "") {
        alert("Please fill out the answer to update it!");
      } else {
        this.answer.save({
          description: answerDescription
        }, {
          success: function(questionModel) {
            //hard refresh of the page to get logged out state
            Backbone.history.navigate('#question/' + self.question.get('post').id, true);
          },
          error: function(error) {
            alert('Please log in to update this answer!');
          }
        });
      }
    }

  });

  return AnswerEditView;
  
});
