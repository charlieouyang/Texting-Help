define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'Utils',
  'models/QuestionModel',
  'models/CommentModel',
  'models/AnswerModel',
  'models/VoteModel',
  'text!templates/question/questionTemplate.html'
], function($, _, Backbone, Mustache, Utils, Question, Comment, Answer, Vote, questionTemplate){

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
      var votesCompleted;

      this.votes = [];

      this.question.fetch({
        success: function() {
          self.votes.push(new Vote({
            post_id: self.question.id
          }));

          self.question.get('post').Answers.forEach(function(answerModel){
            self.votes.push(new Vote({
              answer_id: answerModel.id
            }));
          });

          votesCompleted = _.invoke(self.votes, 'fetch');
          //when all of them are complete...
          $.when.apply($, votesCompleted).done(function() {
            //all ready and good to go...
            result = self.cleanseData(self.question.toJSON(), self.votes);
            rendered = Mustache.to_html(questionTemplate, result);
            self.el = rendered;
            opts.finished();

            $(".add-a-comment").on('click', function(e){
              self.addACommentClick(e);
            });

            $(".answer-submit").on('click', function(e){
              self.addAnswerClick(e);
            });

            $(".vote-up-off, .vote-down-off, .vote-up-on, .vote-down-on").on('click', function(e){
              self.toggleVoteUpOrDown(e);
            });
          });
        },
        error: function() {
          //Reroute to 404
          opts.finished();
        }
      });
    },

    toggleVoteUpOrDown: function (e) {
      var self = this;
      var element = $(e.target);
      var voteContainer = element.closest('.vote');
      var voteUp = voteContainer.find('.vote-up');
      var voteDown = voteContainer.find('.vote-down');
      var voteType = voteContainer.attr('vote-type');
      var voteTypeId = voteContainer.attr('vote-type-id');
      var upVoteCountSpan = voteContainer.find('.upvote-count');
      var upVoteCountValue = parseInt(upVoteCountSpan.text());
      var voteSaveObject = {};

      if (voteType === 'post') {
        voteSaveObject.post_id = voteTypeId;
      } else {
        voteSaveObject.answer_id = voteTypeId;
      }

      if (element.hasClass('vote-up-off')) {
        //Replace with class vote-up-on
          //If vote-down is on... Then replace that with vote-down-off
        //Create new Vote model with 1 vote and POST
        element.removeClass('vote-up-off').addClass('vote-up-on');
        if (voteDown.hasClass('vote-down-on')) {
          voteDown.removeClass('vote-down-on').addClass('vote-down-off');
          upVoteCountValue++;
        }
        vote = new Vote();
        voteSaveObject.voteValue = '1';
        vote.save(voteSaveObject);
        upVoteCountValue++;
      } else if (element.hasClass('vote-up-on')) {
        //Replace with class vote-up-off
        //Delete Vote model
        element.removeClass('vote-up-on').addClass('vote-up-off');
        voteSaveObject.id = 1;
        vote = new Vote(voteSaveObject);
        vote.destroy({
          data: voteSaveObject,
          processData: true
        });
        upVoteCountValue--;
      } else if (element.hasClass('vote-down-off')) { 
        //Replace with class vote-down-on
          //If vote-up is on... Then replace that with vote-up-off
        //Create new Vote model with -1 vote and POST
        element.removeClass('vote-down-off').addClass('vote-down-on');
        if (voteUp.hasClass('vote-up-on')) {
          voteUp.removeClass('vote-up-on').addClass('vote-up-off');
          upVoteCountValue--;
        }
        vote = new Vote();
        voteSaveObject.voteValue = '-1';
        vote.save(voteSaveObject);
        upVoteCountValue--;
      } else if (element.hasClass('vote-down-on')) {
        //Replace with class vote-down-off
        //Delete Vote model
        element.removeClass('vote-down-on').addClass('vote-down-off');
        voteSaveObject.id = 1;
        vote = new Vote(voteSaveObject);
        vote.destroy({
          data: voteSaveObject,
          processData: true
        });
        upVoteCountValue++;
      }

      upVoteCountSpan.text(upVoteCountValue);
    },

    addACommentClick: function (e) {
      var self = this;
      var commentParentDiv = $(e.currentTarget).closest('.add-a-comment-row');
      var commentHtmlText = '<div class="form-group">'+
                    '<label for="comment">Comment:</label>'+
                    '<textarea class="form-control" rows="2"></textarea>'+
                    '<button class="btn btn-info comment-answer-button comment-submit">Submit</button>'+
                '</div>';

      //self.cleanUpOtherCommentBoxes();
      commentParentDiv.html(commentHtmlText);

      $(".comment-submit").unbind('click');
      $(".comment-submit").on('click', function(e){
        var commentContainer = $(e.currentTarget).closest('.add-a-comment-row')[0];
        var commentText = $(e.currentTarget).siblings('textarea')[0].value;
        var commentType = commentContainer.getAttribute('comment-type');
        var commentTypeId = commentContainer.getAttribute('comment-type-id');
        var commentModel = new Comment();
        var commentOptions = {};

        if (commentType === 'post') {
          commentOptions.post_id = commentTypeId;
        } else {
          commentOptions.answer_id = commentTypeId;
        }
        commentOptions.description = commentText;

        commentModel.save(commentOptions, {
          success: function() {
            //hard refresh of the page to get logged out state
            window.location.reload();
          },
          error: function() {
            alert('Posting failed... Maybe user token is stale? Please logout and login again.');
          }
        });

        //Instantiate comment model and set whether it's a post or answer type, and with id
        //POST the comment aka save it
        //Refresh?
      });
    },

    addAnswerClick: function(e) {
      var self = this;
      var answerContainer = $(e.currentTarget).closest('.add-an-answer-row')[0];
      var answerText = $(e.currentTarget).siblings('textarea')[0].value;
      var postId = answerContainer.getAttribute('post-id');
      var answerModel = new Answer();
      var answerOptions = {};

      answerOptions.post_id = postId;
      answerOptions.description = answerText;

      answerModel.save(answerOptions, {
        success: function() {
          //hard refresh of the page to get logged out state
          window.location.reload();
        },
        error: function() {
          alert('Posting failed... Maybe user token is stale? Please logout and login again.');
        }
      });
    },

    cleanseData: function(data, votes) {
      var self = this;
      var differenceInMilliseconds;
      var postComments;
      var answerComments;
      var votesToPostDictionary = {};
      var votesToAnswerDictionary = {};
      var netUpVotes;

      votes.forEach(function(voteModel){
        netUpVotes = 0;
        if (voteModel.get('post_id')) {
          if (voteModel.get('number_of_upvotes') - voteModel.get('number_of_downvotes')) {
            netUpVotes = voteModel.get('number_of_upvotes') - voteModel.get('number_of_downvotes');
          }
          voteModel.set({
            net_up_votes: netUpVotes
          });
          votesToPostDictionary[voteModel.get('post_id')] = voteModel.toJSON();
        } else if (voteModel.get('answer_id')) {
          if (voteModel.get('number_of_upvotes') - voteModel.get('number_of_downvotes')) {
            netUpVotes = voteModel.get('number_of_upvotes') - voteModel.get('number_of_downvotes');
          }
          voteModel.set({
            net_up_votes: netUpVotes
          });
          votesToAnswerDictionary[voteModel.get('answer_id')] = voteModel.toJSON();
        }
      });

      //Get the post... Set the time
      differenceInMilliseconds = Date.now() - Date.parse(data.post.createdAt);
      data.post.createdTimeDifference = Utils.calculateTimeDifference(differenceInMilliseconds);
      data.post.vote = votesToPostDictionary[data.post.id];
      self.checkUserVotedForPostOrAnswer(data.post, data.post.vote.votes);

      //Get the comments... Set the time
      postComments = data.post.Comments;
      delete data.post.Comments;
      data.post.numberOfComments = postComments.length;
      postComments.forEach(function(dataObject){
        differenceInMilliseconds = Date.now() - Date.parse(dataObject.createdAt);
        dataObject.createdTimeDifference = Utils.calculateTimeDifference(differenceInMilliseconds);
      });
      data.post.postComments = postComments;

      //Get the answers... Set the time
      data.post.numberOfAnswers = data.post.Answers.length;
      data.post.Answers.forEach(function(dataObject){
        differenceInMilliseconds = Date.now() - Date.parse(dataObject.createdAt);
        dataObject.createdTimeDifference = Utils.calculateTimeDifference(differenceInMilliseconds);
        dataObject.vote = votesToAnswerDictionary[dataObject.id];
        self.checkUserVotedForPostOrAnswer(dataObject, dataObject.vote.votes);

        if (dataObject.Comments) {
          answerComments = dataObject.Comments;
          delete dataObject.Comments;
          //Get the comments of the answer... Set the time
          dataObject.numberOfComments = answerComments.length;
          answerComments.forEach(function(commentObjectOfAnswer){
            differenceInMilliseconds = Date.now() - Date.parse(commentObjectOfAnswer.createdAt);
            commentObjectOfAnswer.createdTimeDifference = Utils.calculateTimeDifference(differenceInMilliseconds);
          });
          dataObject.answerComments = answerComments;
        }
      });

      return data;
    },

    checkUserVotedForPostOrAnswer: function(postOrAnswer, votes) {
      var self = this;
      var user = this.userSession.get('user');
      var userNotFound = true;

      if (user && votes) {
        votes.forEach(function(voteModel){
          if (voteModel.UserId === user.id) {
            userNotFound = false;
            if (voteModel.voteValue === '1') {
              postOrAnswer.userVotedUpForPost = true;
              postOrAnswer.userVotedDownForPost = false;
            } else if (voteModel.voteValue === '-1') {
              postOrAnswer.userVotedDownForPost = true;
              postOrAnswer.userVotedUpForPost = false;
            }
          }
        });
      }

      if (userNotFound) {
        postOrAnswer.userVotedDownForPost = false;
        postOrAnswer.userVotedUpForPost = false;
      }
    }

  });

  return QuestionsView;
  
});
