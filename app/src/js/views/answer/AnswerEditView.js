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
                $.notify({message: 'Post does not exist!'},{type: 'warning'});
                Backbone.history.navigate('#questions', true);
                opts.finished();
              }
            });
          } else {
            $.notify({message: 'You are not allowed to edit this answer!'},{type: 'warning'});
            Backbone.history.navigate('#questions', true);
            opts.finished();
          }
        },
        error: function() {
          $.notify({message: 'Answer does not exist!'},{type: 'warning'});
          Backbone.history.navigate('#questions', true);
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

      this.answer.save({
        description: answerDescription
      }, {
        success: function(questionModel) {
          //hard refresh of the page to get logged out state
          $.notify({message: 'Answer updated!'},{type: 'success'});
          Backbone.history.navigate('#question/' + self.question.get('post').id, true);
        },
        error: function(model, error) {
          Utils.errorHandlingFromApi(model, error, 'Answer update error!', self.userSession);
        }
      });
    }

  });

  return AnswerEditView;
  
});
