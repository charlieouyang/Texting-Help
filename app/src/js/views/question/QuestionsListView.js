define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'Utils',
  'models/QuestionModel',
  'collections/QuestionsCollection',
  'text!templates/question/questionsListTemplate.html'
], function($, _, Backbone, Mustache, Utils, Question, Questions, questionListTemplate){

  var QuestionsView = Backbone.View.extend({

    initialize: function (opts) {
      this.questions = new Questions();
      this.questionsQuery = opts.query;
      this.sessionModel = opts.session;

      if (this.questionsQuery && this.questionsQuery.page) {
        this.currentPage = Number(this.questionsQuery.page);
      } else {
        this.currentPage = 1;
      }
    },

    questionsFilteringAndSortingClicked: function (e) {
      //This is the previous state of the button..
      //Meaning if user wants it selected, the previous state is unslected
      var self = this;
      var allSelections = [
        'my-questions-only'
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
      });

      Backbone.history.navigate('#questions?' + $.param(queryStringObject), {
        trigger: true
      });
    },

    render: function(opts){
      var self = this;
      var result = {};
      var rendered;
      var questionsFetchData = {};
      var overallQuestionsData = new Question({});

      if (!this.questionsQuery) {
        this.questionsQuery = {};
      }
      this.questionsQuery.page = this.currentPage;

      overallQuestionsData.fetch({
        success: function() {
          pagination = self.determinePagination(overallQuestionsData.get("posts_found"));

          if (pagination === false) {
            alert("Should this ever happen?");
          }

          questionsFetchData = $.param(self.questionsQuery);

          self.questions.fetch({ 
            data: questionsFetchData,
            success: function() {
              if (self.questions.length > 0) {
                result.questions = self.cleanseData(self.questions.toJSON());

                $.extend(result, self.questionsQuery);
                $.extend(result, pagination);

                rendered = Mustache.to_html(questionListTemplate, result);
                self.el = rendered;
                opts.finished();

                $(".my-questions-only").on('click', function(e){
                  self.questionsFilteringAndSortingClicked(e);
                });
              } else {
                alert('No questions available!');
              }
            },
            error: function() {
              //Reroute to 404
              opts.finished();
            }
          });
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

        if (!dataObject.upVoteTotal) {
          dataObject.upVoteTotal = 0;
        }
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
    },

    //Function to figure out what page the user is on, and how to configure the pagination section at the footer
    determinePagination: function (postsCount) {
      var pagesPerSet = 8;              //How many of those numbers are in the footer
      var totalNumberOfPages = Math.ceil(postsCount / 10);    //How many results per page
      var allPageNumbers = [];
      var i;
      var prevArrowState;
      var nextArrowState;
      var totalNumberOfSets;
      var currentSet;
      var lastPageNumberRelatively;
      var pageNum;

      if (this.currentPage > totalNumberOfPages) {
        return false;
      }

      totalNumberOfSets = Math.ceil(totalNumberOfPages / pagesPerSet);
      currentSet = Math.ceil(this.currentPage / pagesPerSet);

      if (currentSet < totalNumberOfSets) {
        for (i = 1; i <= pagesPerSet; i++) {
          pageNum = i + (Math.floor((this.currentPage - 1) / pagesPerSet)*pagesPerSet);
          allPageNumbers.push({
            num: pageNum,
            active: pageNum == this.currentPage,
            asked_by: this.questionsQuery.asked_by
          }); 
        }
      } else {
        lastPageNumberRelatively = totalNumberOfPages % pagesPerSet;

        if (lastPageNumberRelatively === 0) {
          lastPageNumberRelatively = 8;
        }

        for (i = 1; i <= pagesPerSet && i <= lastPageNumberRelatively; i++) {
          pageNum = i + (Math.floor((this.currentPage - 1) / pagesPerSet)*pagesPerSet);
          allPageNumbers.push({
            num: pageNum,
            active: pageNum == this.currentPage,
            asked_by: this.questionsQuery.asked_by
          }); 
        }
      }

      //Set the prev and next arrow states
      prevArrowState = {
        state: currentSet > 1,
        link: currentSet > 1 ? (allPageNumbers[0].num - 1): undefined
      };
      nextArrowState = {
        state: currentSet < totalNumberOfSets,
        link: currentSet < totalNumberOfSets ? (allPageNumbers[allPageNumbers.length - 1].num + 1): undefined
      };

      return {
        pageNumbers: allPageNumbers,
        prevArrow: prevArrowState,
        nextArrow: nextArrowState
      };
    }
  });

  return QuestionsView;
  
});
