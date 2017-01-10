// Filename: app.js
define([
  'jquery', 
  'underscore', 
  'backbone',
  'router', // Request router.js
], function($, _, Backbone, Router){
  var initialize = function(){
    var href,
        passThrough,
        url;

    $(document).on("click", "a[href^='/']", function(event){
      href = $(event.currentTarget).attr('href');
      passThrough = href.indexOf('sign_out') >= 0;

      if (!passThrough && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        url = href.replace(/^\//,'').replace('\#\!\/','');
        Router.navigate(url, { trigger: true });
        return false;
      }
    });

    Router.initialize();
  };

  return { 
    initialize: initialize
  };
});
