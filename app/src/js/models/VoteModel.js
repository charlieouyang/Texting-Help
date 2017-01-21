define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var VoteModel = Backbone.Model.extend({

    initialize : function(options) {
      if (options && options.post_id) {
        this.post_id = options.post_id;
      }
      if (options && options.answer_id) {
        this.answer_id = options.answer_id;
      }
      this.apiUrl = 'http://localhost:6080/api/vote';

    },

    fetch: function () {
      var fetchOptions = {};

      if (this.post_id) {
        fetchOptions.post_id = this.post_id;
      }
      if (this.answer_id) {
        fetchOptions.answer_id = this.answer_id;
      }
      return Backbone.Model.prototype.fetch.call(this, {data: $.param(fetchOptions) });
    },
      
    url : function() {
      return this.apiUrl;
    }
  });

  return VoteModel;
});
