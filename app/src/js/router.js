// Filename: router.js
define([
  'jquery',
  'underscore',
  'backbone',
  'views/header/HeaderView',
  'views/home/HomeView',
  'views/link/LinkView',
  'views/footer/FooterView',
  'views/error/404View'
], function($, _, Backbone, HeaderView, HomeView, LinkView, FooterView, error404View) {
  
  var AppRouter = Backbone.Router.extend({
    routes: {
      //Landing Page
      "": "homePage",

      //Admin page
      "admin/:user_id": "adminPage",
      "admin/:user_id/": "adminPage",

      //Tachit links pages
      ":myId": "linkPage",
      ":myId/": "linkPage",

      //404
      '*actions': 'undefinedRoutes'
    }
  });
  
  var initialize = function(){

    var app_router = new AppRouter;

    app_router.on('route:homePage', function (id) {
        console.log("Hit home page: /");
        var footerView = new FooterView();
        var headerView = new HeaderView();
        var homeView = new HomeView();
        headerView.render();
        footerView.render();
        homeView.render();
    });

    app_router.on('route:adminPage', function (id) {
        console.log("Hit admin page: admin/:user_id and user ID: " + id);
    });

    app_router.on('route:linkPage', function (id) {
        var footerView = new FooterView();
        var headerView = new HeaderView();
        var linkView = new LinkView();
        headerView.render();
        footerView.render();
        linkView.render({
          linkUrl: id
        });
    });

    app_router.on('route:undefinedRoutes', function (actions) {
       // We have no matching route, lets display the home page 
        var errorView = new error404View();
        errorView.render({
          action: actions
        });
    });

    Backbone.history.start({pushState: true, root: '/'});
  };
  return { 
    initialize: initialize
  };
});
