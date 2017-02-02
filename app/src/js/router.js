// Filename: router.js
define([
  'jquery',
  'underscore',
  'backbone',
  'Utils',
  'models/SessionModel',
  'views/header/HeaderView',
  'views/home/HomeView',
  'views/footer/FooterView',
  'views/login/LoginView',
  'views/user/UserView',
  'views/error/404View',
  'views/question/QuestionsListView',
  'views/question/QuestionView',
  'views/question/QuestionCreateEditView',
  'views/answer/AnswerEditView',
], function($, _, Backbone, Utils, Session, HeaderView, HomeView, FooterView, LoginView,
  UserView, error404View, QuestionsListView, QuestionView, CreateEditQuestionView, AnswerEditView) {
  
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
      "user/create": "userPage",
      "user/create/": "userPage",
      "user/:user_id": "userPage",
      "user/:user_id/": "userPage",

      //Post pages
      //list questions... with some params?
      //single question with comments and answers?
      "question/create": "createEditQuestionPage",
      "question/create/": "createEditQuestionPage",

      "question/:question_id": "questionPage",
      "question/:question_id/": "questionPage",

      "question/:question_id/edit": "createEditQuestionPage",
      "question/:question_id/edit/": "createEditQuestionPage",

      "answer/:answer_id/edit": "editAnswerPage",
      "answer/:answer_id/edit/": "editAnswerPage",

      "questions": "questionsPage",
      "questions/": "questionsPage",
      "questions?*queryString": "questionsPage",

      //404
      '*actions': 'undefinedRoutes'
    },
  });
  
  var initialize = function(){

    var app_router = new AppRouter;
    var sessionModel = new Session();
    var appViewConstruct = function AppView() {
      this.showView = function(view) {
        var self = this;
        if (this.currentView) {
          this.currentView.close();
        }

        this.currentView = view;
        this.currentView.render({
          finished: function() {
            $("#content").html(self.currentView.el);
          }
        });
      }
    }
    var appView = new appViewConstruct();

    sessionModel.getAuth();

    var footerView = new FooterView({session: sessionModel});
    var headerView = new HeaderView({session: sessionModel});
    headerView.render();
    footerView.render();

    app_router.on('route:homePage', function (id) {
        var homeView = new HomeView({session: sessionModel});

        appView.showView(homeView);
    });

    app_router.on('route:loginPage', function (id) {
        var loginView = new LoginView({session: sessionModel});

        appView.showView(loginView);
    });

    app_router.on('route:userPage', function (id) {
        var userView = new UserView({session: sessionModel, userInUrlId: id});

        appView.showView(userView);
    });

    app_router.on('route:adminPage', function (id) {
        console.log("Hit admin page: admin/:user_id and user ID: " + id);
    });

    app_router.on('route:questionPage', function (id) {
        var questionView;

        questionView = new QuestionView({session: sessionModel, questionId: id});
        appView.showView(questionView);
    });

    app_router.on('route:questionsPage', function (queryString) {
        var questionsListView;
        var queryObject;

        if (queryString) {
          queryObject = Utils.parseQuery(queryString)
        }

        questionsListView = new QuestionsListView({session: sessionModel, query: queryObject});
        appView.showView(questionsListView);
    });

    app_router.on('route:createEditQuestionPage', function (id) {
        var questionCreateEditView = new CreateEditQuestionView({
          session: sessionModel,
          questionId: id
        });

        appView.showView(questionCreateEditView);
    });

    app_router.on('route:editAnswerPage', function (id) {
        var answerEditView = new AnswerEditView({
          session: sessionModel,
          answerId: id
        });

        appView.showView(answerEditView);
    });

    app_router.on('route:undefinedRoutes', function (actions) {
       // We have no matching route, lets display the home page 
        var errorView = new error404View();
        
        appView.showView(errorView);
    });

    Backbone.history.start({pushState: false, root: '/'});
  };

  Backbone.View.prototype.close = function() {
    this.remove();
    this.unbind();
    if (this.onClose) {
      this.onClose();
    }
  }

  return { 
    initialize: initialize
  };
});
