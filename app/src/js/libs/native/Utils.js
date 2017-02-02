define([
  'underscore',
  'jquery'
], function(_, $) {
  'use strict';

  var Texting = {};

  Texting.showPageLoadingModal = function(title, description) {
    $("#page-modal").modal('show');
  };

  Texting.hidePageLoadingModal = function() {
    $("#page-modal").modal('hide');
  };

  Texting.validateFormFields = function(fields) {
    //fields should be array of objects
    //each object will be 1 key value pair
      //key is form class selector, and value is class selector of value
    //If any of the fields that we look for are empty string, 
      //then we will set error and return false
    var validateSucceeded = true;
    var formSelectorStr;
    var elementSelectorStr;

    fields.forEach(function(field){
      for (var key in field){
        formSelectorStr = key;
      }
      $("." + formSelectorStr).removeClass('has-error');
    });
    
    fields.forEach(function(field){
      for (var key in field){
        formSelectorStr = key;
        elementSelectorStr = field[key];
      }

      if ($("." + elementSelectorStr)[0].value === undefined || $("." + elementSelectorStr)[0].value === "") {
        validateSucceeded = false;
        $("." + formSelectorStr).addClass('has-error');
      }
    });

    return validateSucceeded;
  },

  Texting.parseQuery = function(qstr) {
    var query = {};
    var a = (qstr[0] === '?' ? qstr.substr(1) : qstr).split('&');
    for (var i = 0; i < a.length; i++) {
      var b = a[i].split('=');
      query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
    }
    return query;
  };

  Texting.calculateTimeDifference = function(t) {
    var cd = 24 * 60 * 60 * 1000,
      ch = 60 * 60 * 1000,
      d = Math.floor(t / cd),
      h = Math.floor((t - d * cd) / ch),
      m = Math.round((t - d * cd - h * cd) / 60000),
      pad = function(n) {
        return n < 10 ? '0' + n : n;
      };

    if (m === 60) {
      h++;
      m = 0;
    }
    if (h === 24) {
      d++;
      h = 0;
    }

    if (d > 0) {
      return d + ' days ago';
    }
    if (h > 0) {
      return h + ' hours ago';
    }
    if (m > 0) {
      return m + ' minutes ago';
    }

    return 'seconds ago';
  };

  return Texting;
});