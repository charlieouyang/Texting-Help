define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'models/UserModel',
  'models/NotificationModel',
  'collections/NotificationsCollection',
  'text!templates/header/headerTemplate.html',
  'text!templates/header/notificationTemplate.html'
], function($, _, Backbone, Mustache, User, NotificationRead, Notifications, headerTemplate, notificationTemplate){

  var HeaderView = Backbone.View.extend({
    el: $("#header"),

    events: {
      'click .header-logout': 'logoutButtonClick'
    },

    initialize: function(opts) {
      this.sessionModel = opts.session;
    },

    render: function(){
      var self = this;
      var rendered;
      var result = {};
      var user;
      var notificationsRendered;
      var notificationContainer;
      var notificationCollectionRead;
      var popover;

      result.authenticated = this.sessionModel.get('authenticated');

      if (result.authenticated === 'true') {
        result.user = this.sessionModel.get('user');

        if (result.user.type === 'facebook') {
          result.userTypeIsFacebook = true;
        } else {
          result.userTypeIsFacebook = false;
          $(".fb-user-container").hide();
        }
      } else {
        result.userTypeIsFacebook = false;
      }

      $("#fb-user-information").on('change', function(e){
        var fbUserName = e.currentTarget.getAttribute('fb-id');
        var fbFullName = e.currentTarget.getAttribute('name');

        if (fbUserName === "" && fbFullName === "") {
          if (self.sessionModel.get('authenticated') === "true") {
            self.sessionModel.logout();
          }
          return;
        }

        if (self.sessionModel.get('authenticated') !== 'true') {
          self.sessionModel.login('facebook', {
            'username': fbUserName,
            'type': 'facebook'
          }, function(response){
            //If login failed, that means the FB user doesn't exist in the DB...
            //So we need to create a user... 
            //After creating the user, we will log in 1 more time
            if (response.statusText === 'Not Found') {
              fbUserModel = new User();

              fbUserModel.save({
                username: fbUserName,
                name: fbFullName,
                type: 'facebook'
              }, {
                success: function(userModel) {
                  self.sessionModel.login('facebook', {
                    'username': userModel.get('username'),
                    'type': 'facebook'
                  }, function(response){
                    //
                  });
                },
                error: function(error) {
                  console.log('error... We should never be here');
                }
              });
            } else {
            }
          });
        } else {
          var userObject = self.sessionModel.get('user');

          $(".fb-profile-picture-link").attr('href', '#user/' + userObject.id);
        }
      });

      rendered = Mustache.to_html(headerTemplate, result);
      this.$el.html(rendered);

      if (result.authenticated === 'true') {
        this.notifications = new Notifications();
        this.notifications.fetch({
          success: function(notifications) {
            //Get how many unread noficiations...
            //Set the span to how many unread
            //Set the notifications-unread or notifications-read class
            //Set content of the popover
            //Add event handler
            $(".notifications-value").text(notifications.numberOfUnreadNotifications);
            if (notifications.numberOfUnreadNotifications > 0) {
              $(".notifications-badge").removeClass('notifications-read').addClass('notifications-unread');
            } else {
              $(".notifications-badge").removeClass('notifications-unread').addClass('notifications-read');
            }

            $(".notifications-badge").show();
            $(".notifications-badge").on('click', function(e){

              notificationContainer = {};
              notificationContainer.notifications = notifications.toJSON();
              notificationsRendered = Mustache.to_html(notificationTemplate, notificationContainer);

              $(".notifications-badge").popover({
                title: 'Notifications',
                trigger: 'focus',
                placement: "bottom",
                template: '<div class="popover" role="tooltip">' + 
                  '<div class="popover-arrow"></div>' + 
                  '<div class="notification-header"><h3 class="popover-title"></h3><span class="glyphicon glyphicon-check mark-notifications-read" aria-hidden="true"></div>' + 
                  '<div class="popover-content"></div>' + 
                  '</div>',
                html: true
              });

              popover = $('.notifications-badge').data('bs.popover');
              popover.options.content = notificationsRendered;
              $(".notifications-badge").popover("show");

              $(".mark-notifications-read").on('click', function(e) {
                notificationCollectionRead = new NotificationRead();
                notificationCollectionRead.save({}, {
                  success: function(notificationReadResult) {
                    $(".notification-description-a").removeClass('unread').addClass('read');
                    $(".notifications-badge").removeClass("notifications-unread").addClass("notifications-read");
                    $(".notifications-value").text("0");

                    notifications.forEach(function(model) {
                      model.set({'readStatus': 'read', 'unread': false});
                    });
                  },
                  error: function(error) {
                    console.log("something went wrong here :( in marking notifications read");
                  }
                });
              });
            });

            $('body').on('click', function (e) {
              //did not click a popover toggle or popover
              if (!$(e.target).hasClass('notifications-badge')
                && !$(e.target).hasClass('notification-icon')
                && !$(e.target).hasClass('notifications-value')
                && $(e.target).parents('.popover').length === 0) { 
                $('.notifications-badge').popover('hide');
              }

              if ($(e.target).hasClass('notification-description-a') || 
                $(e.target).hasClass('notification-description-p') || 
                $(e.target).hasClass('notification-row') ) {
                $('.notifications-badge').popover('hide');
              }
            });
          }
        });
      }
    },

    logoutButtonClick: function(e) {
      this.sessionModel.logout();
    }

  });

  return HeaderView;
});
