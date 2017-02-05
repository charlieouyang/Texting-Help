define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'Utils',
  'models/QuestionModel',
  'models/CommentModel',
  'models/AnswerModel',
  'text!templates/question/questionCreateEditTemplate.html'
], function($, _, Backbone, Mustache, Utils, Question, Comment, Answer, questionCreateEditTemplate){

  var QuestionsView = Backbone.View.extend({

    initialize: function (opts) {
      this.question = new Question({
        id: opts.questionId
      });
      this.userSession = opts.session;
    },

    render: function(opts){
      var self = this;
      var result = {};
      var rendered;

      if (this.question.id) {
        //Edit a pre-existing question
        //Make sure this current user can edit the question
        this.question.fetch({
          success: function() {
            if (self.userSession && self.userSession.get('user') && 
              self.userSession.get('user').id === self.question.get('post').User.id) {
              
              result = self.question.toJSON();
              rendered = Mustache.to_html(questionCreateEditTemplate, result);
              self.el = rendered;
              opts.finished();

              $(".post-question").on("click", function(e){
                self.postQuestionClick(e);
              });
            } else {
              $.notify({message: 'You are not allowed to edit this! You must be the creater of this question or answer to edit it...'},{type: 'warning'});
            }
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

        if (self.userSession.get('authenticated') !== 'true') {
          $.notify({message: 'Please log in to post a question!'},{type: 'warning'});
          Backbone.history.navigate('#questions/', true);
        }

        $(".post-question").on("click", function(e){
          self.postQuestionClick(e);
        });
      }
    },

    postQuestionClick: function (e) {
      var self = this;
      var questionTitle = $(".question-title").val();
      var questionDescription = $(".question-description").val();

      if (!Utils.validateFormFields([{
        'question-title-form-group': 'question-title'
      }, {
        'question-description-form-group': 'question-description'
      }])) {
        return;
      }

      this.question.save({
        title: questionTitle,
        description: questionDescription, 
        tags: ''
      }, {
        success: function(questionModel) {
          //hard refresh of the page to get logged out state
          $.notify({message: 'Question created!'},{type: 'success'});
          Backbone.history.navigate('#question/' + questionModel.get('id'), true);
        },
        error: function(model, error) {
          Utils.errorHandlingFromApi(model, error, 'Question creation error!', self.userSession);
        }
      });
    }

  });

  return QuestionsView;
  
});
