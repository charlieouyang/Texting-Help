define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'Utils',
  'collections/QuestionsCollection',
  'text!templates/question/questionsListTemplate.html'
], function($, _, Backbone, Mustache, Utils, Questions, questionListTemplate){

  var QuestionsView = Backbone.View.extend({

    initialize: function (opts) {
      this.questions = new Questions();
      this.questionsQuery = opts.query;
      this.sessionModel = opts.session;
    },

    questionsFilteringAndSortingClicked: function (e) {
      //This is the previous state of the button..
      //Meaning if user wants it selected, the previous state is unslected
      var self = this;
      var allSelections = [
        'my-questions-only',
        'oldest-questions-first'
      ];
      var querySelections = [];
      var queryStringObject = {};
      var previouslyActive;
      var sessionModel;

      allSelections.forEach(function(selectionElement){
        if ($(e.currentTarget).hasClass(selectionElement)) {
          //This is the current target, so check for previous active, 
          //and append/remove based on opposite action
          previouslyActive = $("." + selectionElement).hasClass('active');
          if (!previouslyActive) {
            querySelections.push({queryName: selectionElement, action: true});
          }
        } else {
          //Not the current target, so just look for active and append to string
          previouslyActive = $("." + selectionElement).hasClass('active');
          if (previouslyActive) {
            querySelections.push({queryName: selectionElement, action: true});
          }
        }
      });

      querySelections.forEach(function(querySelection){
        if (querySelection.queryName === 'my-questions-only') {
          sessionModel = self.sessionModel.get('user');
          if (sessionModel) {
            queryStringObject['asked_by'] = sessionModel.id;
          }
        }
        if (querySelection.queryName === 'oldest-questions-first') {
          queryStringObject['sort_by'] = '-date';
        }
      });

      Backbone.history.navigate('#questions?' + $.param(queryStringObject), {
        trigger: true
      });
    },

    render: function(opts){
      var self = this;
      var result = {};
      var rendered;
      var questionsFetchData;

      if (this.questionsQuery) {
        questionsFetchData = $.param(this.questionsQuery);
      }

      this.questions.fetch({ 
        data: questionsFetchData,
        success: function() {
          if (self.questions.length > 0) {
            result.questions = self.cleanseData(self.questions.toJSON());

            $.extend(result, self.questionsQuery);

            rendered = Mustache.to_html(questionListTemplate, result);
            self.el = rendered;
            opts.finished();

            $(".my-questions-only").on('click', function(e){
              self.questionsFilteringAndSortingClicked(e);
            });
            $(".oldest-questions-first").on('click', function(e){
              self.questionsFilteringAndSortingClicked(e);
            });
          }
        },
        error: function() {
          //Reroute to 404
          opts.finished();
        }
      });
    },

    cleanseData: function(data) {
      var self = this;

      data.forEach(function(dataObject){
        var differenceInMilliseconds = Date.now() - Date.parse(dataObject.createdAt);

        if (dataObject.Comments) {
          dataObject.numberOfComments = dataObject.Comments.length;
        } else {
          dataObject.numberOfComments = 0;
        }
        if (dataObject.Answers) {
          dataObject.numberOfAnswers = dataObject.Answers.length;
        } else {
          dataObject.numberOfAnswers = 0;
        }
        dataObject.createdTimeDifference = Utils.calculateTimeDifference(differenceInMilliseconds);
      });

      return data;
    }
  });

  return QuestionsView;
  
});
