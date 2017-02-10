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

      Utils.showPageLoadingModal();

      this.question.fetch({
        success: function() {
          result = self.cleanseData(self.question.toJSON(), self.votes);
          rendered = Mustache.to_html(questionTemplate, result);
          self.el = rendered;
          opts.finished();

          Utils.hidePageLoadingModal();

          $(".add-a-comment").on('click', function(e){
            self.addACommentClick(e);
          });

          $(".answer-submit").on('click', function(e){
            self.addAnswerClick(e);
          });

          $(".vote-up-off, .vote-down-off, .vote-up-on, .vote-down-on").on('click', function(e){
            self.toggleVoteUpOrDown(e);
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
      var postOrAnswerOwnerId = voteContainer.attr("post-answer-owner-user-id");
      var upVoteCountValue = parseInt(upVoteCountSpan.text());
      var voteSaveObject = {};

      if (voteType === 'post') {
        voteSaveObject.post_id = voteTypeId;
      } else {
        voteSaveObject.answer_id = voteTypeId;
      }
      voteSaveObject.post_or_answer_owner_user = postOrAnswerOwnerId;

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
        vote.save(voteSaveObject,{
          error: function(model, error) {
            Utils.errorHandlingFromApi(model, error, 'Voting error!', self.userSession);
          }
        });
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
        },{
          error: function(model, error) {
            Utils.errorHandlingFromApi(model, error, 'Voting error!', self.userSession);
          }
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
        vote.save(voteSaveObject,{
          error: function(model, error) {
            Utils.errorHandlingFromApi(model, error, 'Voting error!', self.userSession);
          }
        });
        upVoteCountValue--;
      } else if (element.hasClass('vote-down-on')) {
        //Replace with class vote-down-off
        //Delete Vote model
        element.removeClass('vote-down-on').addClass('vote-down-off', self.userSession);
        voteSaveObject.id = 1;
        vote = new Vote(voteSaveObject);
        vote.destroy({
          data: voteSaveObject,
          processData: true
        },{
          error: function(model, error) {
            Utils.errorHandlingFromApi(model, error, 'Voting error!', self.userSession);
          }
        });
        upVoteCountValue++;
      }

      upVoteCountSpan.text(upVoteCountValue);
    },

    addACommentClick: function (e) {
      var self = this;
      var commentParentDiv = $(e.currentTarget).closest('.add-a-comment-row');
      var commentHtmlText = '<div class="form-group add-a-comment-container">'+
                    '<label for="comment">Comment:</label>'+
                    '<textarea class="form-control comment-description" rows="2"></textarea>'+
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
        var originalPostOrAnswerUserId = commentContainer.getAttribute("post_or_answer_owner_user_id");
        var commentModel = new Comment();
        var commentOptions = {};

        if (!Utils.validateFormFields([{
          'add-a-comment-container': 'comment-description'
        }])) {
          return;
        }

        if (commentType === 'post') {
          commentOptions.post_id = commentTypeId;
        } else {
          commentOptions.answer_id = commentTypeId;
        }
        commentOptions.description = commentText;
        commentOptions.post_or_answer_owner_user = originalPostOrAnswerUserId;

        Utils.showPageLoadingModal();
        commentModel.save(commentOptions, {
          success: function() {
            Utils.hidePageLoadingModal();
            //hard refresh of the page to get logged out state
            $.notify({message: 'Comment added!'},{type: 'success'});
            setTimeout(function(){
              window.location.reload();
            }, 1000);
          },
          error: function(model, error) {
            Utils.hidePageLoadingModal();
            Utils.errorHandlingFromApi(model, error, 'Adding comment error!', self.userSession);
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
      var postOwnerUserId = answerContainer.getAttribute("post_owner_user_id");
      var answerText = $(e.currentTarget).siblings('textarea')[0].value;
      var postId = answerContainer.getAttribute('post-id');
      var answerModel = new Answer();
      var answerOptions = {};

      if (!Utils.validateFormFields([{
        'answer-description-container': 'answer-description'
      }])) {
        return;
      }

      answerOptions.post_id = postId;
      answerOptions.description = answerText;
      answerOptions.post_or_answer_owner_user = postOwnerUserId;

      Utils.showPageLoadingModal();
      answerModel.save(answerOptions, {
        success: function() {
          //hard refresh of the page to get logged out state
          Utils.hidePageLoadingModal();
          $.notify({message: 'Answer added!'},{type: 'success'});
          setTimeout(function(){
            window.location.reload();
          }, 1000);
        },
        error: function(model, error) {
          Utils.hidePageLoadingModal();
          Utils.errorHandlingFromApi(model, error, 'Adding answer error!', self.userSession);
        }
      });
    },

    cleanseData: function(data) {
      var self = this;
      var differenceInMilliseconds;
      var postComments;
      var answerComments;

      //Get the post... Set the time
      differenceInMilliseconds = Date.now() - Date.parse(data.post.createdAt);
      data.post.createdTimeDifference = Utils.calculateTimeDifference(differenceInMilliseconds);
      if (data.post.createdAt !== data.post.updatedAt) {
        differenceInMilliseconds = Date.now() - Date.parse(data.post.updatedAt);
        data.post.updatedTimeDifference = Utils.calculateTimeDifference(differenceInMilliseconds);
      } else {
        data.post.updatedTimeDifference = false;
      }
      
      self.checkUserVotedForPostOrAnswer(data.post);

      //can this current user edit this post?
      if (self.userSession && self.userSession.get('user') && self.userSession.get('user').id === data.post.User.id) {
        data.post.canEditPost = true;
        data.post.editPostLink = '#question/' + data.post.id + '/edit';
      } else {
        data.post.canEditPost = false;
      }

      //Get the comments... Set the time
      postComments = data.post.Comment_On_Posts;
      delete data.post.Comment_On_Posts;
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
        if (dataObject.createdAt !== dataObject.updatedAt) {
          differenceInMilliseconds = Date.now() - Date.parse(dataObject.updatedAt);
          dataObject.updatedTimeDifference = Utils.calculateTimeDifference(differenceInMilliseconds);
        } else {
          dataObject.updatedTimeDifference = false;
        }

        self.checkUserVotedForPostOrAnswer(dataObject);

        //can this current user edit this answer?
        if (self.userSession && self.userSession.get('user') && self.userSession.get('user').id === dataObject.User.id) {
          dataObject.canEditAnswer = true;
          dataObject.editAnswerLink = '#answer/' + dataObject.id + '/edit';
        } else {
          dataObject.canEditAnswer = false;
        }

        if (dataObject.Comment_On_Answers) {
          answerComments = dataObject.Comment_On_Answers;
          delete dataObject.Comment_On_Answers;
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

    checkUserVotedForPostOrAnswer: function(postOrAnswer) {
      var self = this;
      var user = this.userSession.get('user');
      var userNotFound = true;

      if (!user) {
        return;
      }

      if (postOrAnswer.Answers) {
        //This is a post... Just look at the post votes
        postOrAnswer.Vote_On_Posts.forEach(function(voteOnPostObj){
          if (voteOnPostObj.UserId === user.id) {
            userNotFound = false;
            if (voteOnPostObj.voteValue === '1') {
              postOrAnswer.userVotedUpForPost = true;
              postOrAnswer.userVotedDownForPost = false;
            } else if (voteOnPostObj.voteValue === '-1') {
              postOrAnswer.userVotedDownForPost = true;
              postOrAnswer.userVotedUpForPost = false;
            }
          } 
        });
      } else {
        postOrAnswer.Vote_On_Answers.forEach(function(voteOnAnswerObj){
          if (voteOnAnswerObj.UserId === user.id) {
            userNotFound = false;
            if (voteOnAnswerObj.voteValue === '1') {
              postOrAnswer.userVotedUpForPost = true;
              postOrAnswer.userVotedDownForPost = false;
            } else if (voteOnAnswerObj.voteValue === '-1') {
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
