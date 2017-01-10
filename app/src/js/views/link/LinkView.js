define([
  'jquery',
  'underscore',
  'backbone',
  'Mustache',
  'text!templates/link/linkTemplate.html',
  'collections/LinksCollection'
], function($, _, Backbone, Mustache, linkTemplate, LinkCollection){

  var LinkView = Backbone.View.extend({

    el: $("#content"),

    events: {
      "click .mediaContainer": "openMediaModal"
    },

    render: function(args){
      var self = this,
          model,
          linkUrl,
          rendered,
          data = {},
          finalized = false;

      if (!args.linkUrl) {
        console.log('no url...');
      }

      linkUrl = args.linkUrl;

      collection = new LinkCollection({
        linkUrl: linkUrl
      });

      collection.fetch({
        success: function (links) {
          var result = {},
              data;

          self.mapData(links.toJSON());

          result.data = {
            "picture": [],
            "voice": [],
            "video": [],
            "text": [],
            "location": []
          };
          result.link_exist = links.length > 0;
          result.linkUrl = linkUrl;

          links.each(function (model){
            finalized = model.get("final") === "true" ? true : false;
            result.data[model.get("media_type")].push(model.toJSON());
          });

          result.finalized = finalized;
          result.data = self.sortMedia(result.data);
          result.nonPictures = self.nonPictures;

          rendered = Mustache.to_html(linkTemplate, result);
          self.$el.html(rendered);
        },
        error: function (err) {
          console.log("Error on fetch...");
        }
      });
    },

    mapData: function(data) {
      var self = this,
          i;

      self.mediaMap = {};

      for (i = 0; i < data.length; i++){
        self.mediaMap[data[i].id] = data[i];
      }
    },

    sortMedia: function(data) {
      var pictures,
          videos,
          voiceMemos,
          locations,
          textBlocks,
          nonPictures = false,
          arrLength,
          self = this;

      //Sorting pictures into 2 columns
      pictures = data["picture"];
      if (pictures.length > 0) {
        data["picture"] = {};
        arrLength = pictures.length;

        data["picture"]["column1"] = pictures.splice(0, arrLength / 2);
        data["picture"]["column2"] = pictures;
      }

      data["nonPics"] = {};

      videos = data["video"];
      if (videos.length > 0) {
        nonPictures = true;
        data["nonPics"]["video"] = [];
        videos.forEach(function(media){
          data.nonPics.video.push(media);
        });

        delete data["video"];
      }

      voiceMemos = data["voice"];
      if (voiceMemos.length > 0) {
        nonPictures = true;
        data["nonPics"]["voice"] = [];
        voiceMemos.forEach(function(media){
          data.nonPics.voice.push(media);
        });

        delete data["voice"];
      }

      locations = data["location"];
      if (locations.length > 0) {
        nonPictures = true;
        data["nonPics"]["location"] = [];
        locations.forEach(function(media){
          data.nonPics.location.push(media);
        });

        delete data["location"];
      }

      textBlocks = data["text"];
      if (textBlocks.length > 0) {
        nonPictures = true;
        data["nonPics"]["text"] = [];
        textBlocks.forEach(function(media){
          media.description = self.replaceAll(media.description, "\n", "<br>");
          data.nonPics.text.push(media);
        });

        delete data["text"];
      }

      this.nonPictures = nonPictures;

      return data;
    },

    replaceAll: function(str, find, replace) {
      return str.replace(new RegExp(find, 'g'), replace);
    },

    openMediaModal: function(e) {
      var self = this,
          mediaData;

      mediaData = self.mediaMap[e.currentTarget.id];
      event.preventDefault();

      $(e.currentTarget).find("a").ekkoLightbox();
    }

  });

  return LinkView;
});
