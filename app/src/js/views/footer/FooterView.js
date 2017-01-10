define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'text!templates/footer/footerTemplate.html'
], function($, _, Backbone, Mustache, footerTemplate){

  var FooterView = Backbone.View.extend({
    el: $("#footer"),

    render: function(){
      this.$el.html(footerTemplate);
    }

  });

  return FooterView;
});
