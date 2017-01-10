define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var LinkModel = Backbone.Model.extend({
    urlRoot: '/link',

    initialize: function (options) {
    }
  });

  return LinkModel;
});
