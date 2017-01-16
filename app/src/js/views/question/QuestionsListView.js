define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'collections/QuestionsCollection',
  'text!templates/question/questionsListTemplate.html'
], function($, _, Backbone, Mustache, Questions, questionListTemplate){

  var QuestionsView = Backbone.View.extend({
    el: $("#content"),

    events: {

    },

    initialize: function (opts) {
      this.questions = new Questions();
    },

    render: function(){
      var self = this;
      var result = {};
      var rendered;

      this.questions.fetch({
        success: function() {
          if (self.questions.length > 0) {
            result.questions = self.cleanseData(self.questions.toJSON());
            rendered = Mustache.to_html(questionListTemplate, result);
            self.$el.html(rendered);
          }
        },
        error: function() {
          //Reroute to 404
        }
      });
    },

    cleanseData: function(data) {
      var self = this;

      data.forEach(function(dataObject){
        var differenceInMilliseconds = Date.now() - Date.parse(dataObject.createdAt);

        dataObject.numberOfComments = dataObject.Comments.length;
        dataObject.numberOfAnswers = dataObject.Answers.length;
        dataObject.createdTimeDifference = self.calculateTimeDifference(differenceInMilliseconds);
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
