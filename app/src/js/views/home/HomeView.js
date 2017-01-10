define([
  'jquery',
  'underscore',
  'backbone',
  'models/EmailModel',
  'models/ClickModel',
  'text!templates/home/homeTemplate.html'
], function($, _, Backbone, EmailModel, ClickModel, homeTemplate){

  var HomeView = Backbone.View.extend({
    el: $("#content"),

    events: {
      "click .email-submit-button": "submitEmailClick",

      //This is the registered event handler for all clicks in the landing page
      "click .placement-click": "clickPlacementSubmit"
    },

    render: function(){
      var self = this;

      this.$el.html(homeTemplate);

      //Let's register as soon as someone hits the main page
      self.clickPlacementSubmit();
    },

    clickPlacementSubmit: function (e) {
      var self = this,
          cmodel,
          clickPlacement;

      if (e) {
        clickPlacement = e.target.getAttribute("button-data");
      }

      $.when(self.getLocation()).done(function (response){
        cmodel = new ClickModel({
          click_placement: clickPlacement ? clickPlacement : "home-page-load",
          country: response.country,
          region: response.region,
          city: response.city,
          zip_code: response.postal
        });
        cmodel.save();
      });
    },

    getLocation: function(){
      var deferred = $.Deferred();

      $.get("http://ipinfo.io", function(response) {
          deferred.resolve(response);
        }, "jsonp");

      return deferred.promise();
    },

    submitEmailClick: function (e) {
      var self = this,
          emodel,
          emailFormGroup = $(self.el).find(".email-input-group"),
          emailButton = $(self.el).find(".email-submit-button"),
          emailAddress = $(self.el).find(".email-input-text").val(),
          emailError = function() {
            emailFormGroup.removeClass("has-success").addClass("has-error");
            emailFormGroup.parent().removeClass("email-success").addClass("email-error");
            emailButton.removeClass("btn-default").addClass("btn-danger");

            emailFormGroup.popover('destroy');
            setTimeout(function() {
              emailFormGroup.popover({
                "trigger": "focus",
                "placement": "top",
                "content" : "Please enter a valid e-mail address!"
              });
              if (!emailFormGroup.attr("aria-describedby")) {
                emailFormGroup.popover("show");
              }
            }, 200);
          },
          emailSuccess = function() {
            emailFormGroup.removeClass("has-error").addClass("has-success");
            emailFormGroup.parent().removeClass("email-error").addClass("email-success");
            emailButton.removeClass("btn-default btn-danger").addClass("btn-success");

            emailFormGroup.popover('destroy');
            setTimeout(function() {
              emailFormGroup.popover({
                "trigger": "focus",
                "placement": "top",
                "content": "Thank you for registering with us!"
              });
              if (!emailFormGroup.attr("aria-describedby")) {
                emailFormGroup.popover("show");
              }
            }, 200);
          };

      if (emailAddress === "") {
        emailError();
      } else {
        emodel = new EmailModel({email_address: emailAddress});

        emodel.save({}, {
          success: function (model, response) {
            emailSuccess();
          },
          error: function(model, response) {
            emailError();
          }
        });
      }
    }

  });

  return HomeView;
  
});
