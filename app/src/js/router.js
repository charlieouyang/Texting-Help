// Filename: router.js
define([
  'jquery',
  'underscore',
  'backbone',
  'models/SessionModel',
  'views/header/HeaderView',
  'views/home/HomeView',
  'views/footer/FooterView',
  'views/login/LoginView',
  'views/user/UserView',
  'views/error/404View',
  'views/question/QuestionsListView',
  'views/question/QuestionView'
], function($, _, Backbone, Session, HeaderView, HomeView, FooterView, LoginView, UserView, error404View, QuestionsListView, QuestionView) {
  
  var AppRouter = Backbone.Router.extend({
    routes: {
      //Landing Page
      "": "homePage",

      "login": "loginPage",
      "login/": "loginPage",

      //Admin page
      "admin/:user_id": "adminPage",
      "admin/:user_id/": "adminPage",

      //Users pages
      "user/:user_id": "userPage",
      "user/:user_id/": "userPage",

      //Post pages
      //list questions... with some params?
      //single question with comments and answers?
      "question": "questionPage",
      "question/": "questionPage",
      "question/:question_id": "questionPage",
      "question/question_id/": "questionPage",

      //Tachit links pages
      // ":myId": "linkPage",
      // ":myId/": "linkPage",

      //404
      '*actions': 'undefinedRoutes'
    },
  });
  
  var initialize = function(){

    var app_router = new AppRouter;
    var sessionModel = new Session();
    sessionModel.get('authenticated');

    app_router.on('route:homePage', function (id) {
        var footerView = new FooterView({session: sessionModel});
        var headerView = new HeaderView({session: sessionModel});
        var homeView = new HomeView({session: sessionModel});

        headerView.render();
        footerView.render();
        homeView.render();
    });

    app_router.on('route:loginPage', function (id) {
        var footerView = new FooterView({session: sessionModel});
        var headerView = new HeaderView({session: sessionModel});
        var loginView = new LoginView({session: sessionModel});

        headerView.render();
        footerView.render();
        loginView.render();
    });

    app_router.on('route:userPage', function (id) {
        var footerView = new FooterView({session: sessionModel});
        var headerView = new HeaderView({session: sessionModel});
        var userView = new UserView({session: sessionModel, userInUrlId: id});

        headerView.render();
        footerView.render();
        userView.render();
    });

    app_router.on('route:adminPage', function (id) {
        console.log("Hit admin page: admin/:user_id and user ID: " + id);
    });

    app_router.on('route:questionPage', function (id) {
        var footerView = new FooterView({session: sessionModel});
        var headerView = new HeaderView({session: sessionModel});
        var questionsListView;
        var questionView;

        headerView.render();
        footerView.render();

        if (id) {
          questionView = new QuestionView({session: sessionModel, questionId: id});
          questionView.render();
        } else {
          questionsListView = new QuestionsListView({session: sessionModel});
          questionsListView.render();
        }
    });

    app_router.on('route:undefinedRoutes', function (actions) {
       // We have no matching route, lets display the home page 
        var errorView = new error404View();
        errorView.render({
          action: actions
        });
    });

    Backbone.history.start({pushState: false, root: '/'});
  };
  return { 
    initialize: initialize
  };
});
