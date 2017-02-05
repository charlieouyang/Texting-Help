define([
  'underscore',
  'backbone',
  'models/NotificationModel'
], function(_, Backbone, NotificationModel){

  var NotificationsCollection = Backbone.Collection.extend({
    model: NotificationModel,

    initialize : function(options) {
      this.apiUrl = 'http://localhost:6080/api/notification';
    },
      
    url : function() {
      return this.apiUrl;
    },
    
    parse : function(data) {
      var numOfUnread = 0;

      data.notifications.forEach(function(notificationObject){
        if (notificationObject.readStatus === 'unread') {
          numOfUnread++;
        }

        if (notificationObject.notificationAction === 'answer_on_post') {
          notificationObject.message = 'Someone answered your question!';
          notificationObject.linkUrl = '#question/' + notificationObject.notificationOnId;
        } else if (notificationObject.notificationAction === 'comment_on_post') {
          notificationObject.message = 'Someone commented on your question!';
          notificationObject.linkUrl = '#question/' + notificationObject.notificationOnId;
        } else if (notificationObject.notificationAction === 'comment_on_answer') {
          notificationObject.message = 'Someone commented on your answer!';
          notificationObject.linkUrl = '#question/' + notificationObject.parentPostId;
        } else if (notificationObject.notificationAction === 'upvote_on_post') {
          notificationObject.message = 'Someone upvoted your question!';
          notificationObject.linkUrl = '#question/' + notificationObject.notificationOnId;
        } else if (notificationObject.notificationAction === 'upvote_on_answer') {
          notificationObject.message = 'Someone upvoted your answer!';
          notificationObject.linkUrl = '#question/' + notificationObject.parentPostId;
        }

        if (notificationObject.readStatus === 'unread') {
          notificationObject.unread = true;
        } else {
          notificationObject.unread = false;
        }
      });

      this.numberOfUnreadNotifications = numOfUnread;
      return data.notifications;
    }
  });

  return NotificationsCollection;
});