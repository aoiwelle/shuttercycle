/*
derived from:
   http://tympanus.net/codrops/2010/06/24/multimedia-gallery/
   by Mary Lou

additional features by Nathan Cormier
*/


$(function() {
var g_isReady = true;
var g_isPreviewing = false;
var g_root = '';
var g_currentFolder = '';
var g_showMeta = false;
var g_share = false;

var THUMBROOT = 'media/photos/thumbs/';
var MEDROOT = 'media/photos/medium/';
var LARGEROOT = 'media/photos/large/';
var GALLERY = 'gallery/';
var HIDDEN = 'hidden/';
var MAIN = '_main_/';

var META_MAX_LENGTH = 19;
var DESC_MAX_LENGTH = 57;

var MMG = {
   /**
   * loaded    : how many files were loaded alg_isReady;
   * total     : total number of existing files
   * set       : number of items to load for each ajax call,
   * except the first one - it will load as much it fits in the window
   */
   data           : {
      'loaded'             : 0,  
      'total'              : 0,
      'folders'            : 0,
      'set'             : 25
   },
   /**
   * method called innitially: register events 
   * and starts the gallery
   */
   init : function () {
      MMG.initEventHandlers();
      MMG.start();
   },
   /**
   * init the events
   */
   initEventHandlers : function () {
      $('#mmg_media_wrapper ul').delegate('a','mouseenter', function () {
         var $this   = $(this);
         $this.find('img').stop().animate({'opacity':'1.0'},200);
      }).delegate('a','mouseleave', function () {
         var $this   = $(this);
         $this.find('img').stop().animate({'opacity':'0.6'},200);
      }).delegate('a','click', function(e){
         MMG.data.currentItem = $(this).parent().index()+1;
         MMG.showItem();
         e.preventDefault();
      });
      $(window).bind('resize', function() {
         MMG.centerWrapper();
         
         if(!$('#mmg_preview .preview_wrap').is(':empty')) {
            if($('#mmg_medium_photo').length > 0)
               MMG.resize($('#mmg_medium_photo'));
         }
      });
      $('#mmg_next').live('click', function(e) {
         MMG.showNext();
         e.preventDefault();
      });
      $('#mmg_prev').live('click', function(e) {
         MMG.showPrev();
         e.preventDefault();
      });
      $('#mmg_item_close').live('click', function(e) {
         MMG.hidePreview();
         e.preventDefault();
      });
      $('#mmg_item_enlarge').live('click', function(e) {
         MMG.enlargeImage();
         e.preventDefault();
      });
      $('#mmg_item_info').live('click', function(e) {
         MMG.toggleMeta();
         e.preventDefault();
      });
      $('#mmg_more').bind('click', function(e) {
         MMG.more();
         e.preventDefault();
      });
      $('#mmg_prev_folder .prevfolder').click(function() {
         MMG.backFolder();
      });
      $('#mmg_meta').click(function() {
         MMG.toggleMeta();
      });
      $('#mmg_preview .preview_outside').click(function() {
         MMG.hidePreview();
      });
   },
   /**
   * Get URL variables (GET parameters)
   */
   getUrlVars: function(){
      var vars = [], hash;
      var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
      for(var i = 0; i < hashes.length; i++)
      {
         hash = hashes[i].split('=');
         vars.push(hash[0]);
         vars[hash[0]] = hash[1];
      }
      return vars;
   },
   getUrlVar: function(name){
      return MMG.getUrlVars()[name];
   },
   /**
   * navigate to next image
   */
   showNext : function() {
      MMG.data.currentItem = MMG.data.currentItem+1;
      MMG.showItem();
   },
   /**
   * navigate to prev image
   */
   showPrev : function() {
      MMG.data.currentItem = MMG.data.currentItem-1;
      MMG.showItem();
   },
   setRoot : function(folder) {
      g_root = folder + '/';
      g_currentFolder = g_root;
      document.title = 'shuttercycle | ' + folder;
   },
   /**
   * checks how many files we have
   * draws the structure
   * displays the first set
   */
   start : function() {
      var share = MMG.getUrlVar('share');
      var gallery = MMG.getUrlVar('gallery');
      if (gallery && gallery != '' && g_root == '') {
         MMG.setRoot(gallery);
      }
      else if (share && share != '' && g_root == '') {
         MMG.setRoot(share);
         g_share = true;
      }

      $.get('multimedia.class.php', {op:'getTotalFiles',folder:g_currentFolder,
            share:(g_share ? '1' : '0')}, function(data) {
         MMG.data.loaded = 0;
         MMG.data.folders = 0;
         MMG.data.total = (data * 1);
         /**
         * draws the containers where our thumbs will be displayed,
         */
         if (g_isReady) {
            var nmb_containers = MMG.countSpaces();
            MMG.draw(nmb_containers);
         }
      },'text');
   },
   draw : function (nmb_containers) {
      /**
      * load innitially the number of items that fit
      * on the window + a certain margin.
      * When resizing the window we follow the
      * same approach. All the other items will load
      * when the User clicks the more button
      */
      var $list = $('#mmg_media_wrapper ul');
      for (var i = 0; i < nmb_containers; ++i) {
         $list.append($('<li />'));
      }
      MMG.centerWrapper();
      MMG.display();
   },
   /**
   * checks how many more thumbs we can display 
   * given the window dimentions
   */
   countSpaces : function () {
      var containerSizeW = $(window).width()-100;
      var photosPerRow = Math.floor(containerSizeW/188);
      var containerSizeH = $(window).height()-50;
      var photosPerColumn = Math.floor(containerSizeH/148) + 1;
      var nmb_containers = Math.min(MMG.data.total,photosPerRow * photosPerColumn);
      var nmb_containers_in_viewport = $('#mmg_media_wrapper li:in-viewport').length;
      return nmb_containers-nmb_containers_in_viewport;
   },
   /**
   * centers the thumbs grid
   */
   centerWrapper : function () {
      var photosLength = $('#mmg_media_wrapper li').size();
      if (photosLength > 0) {
         var containerSize    = $(window).width() - 100;
         var photosPerRow  = Math.floor(containerSize / 188);

         //0 of paddings (if you want more...)
         var left = Math.floor((containerSize - (photosPerRow * 188)) / 2);
         $('#mmg_media_wrapper li').each(function(i) {
            var $this = $(this);
            if (i % photosPerRow == 0) {
               $this.css('margin-left', left + 'px');
            }
            else {
               $this.css('margin-left', '0px');
            }
         });
      }
   },
   /**
   * displays the first set of files
   * we need to check how many we can display for our window size!
   */
   display : function () {
      g_isReady = false;
      if (MMG.data.loaded == MMG.data.total)
         return;
         
      var $list = $('#mmg_media_wrapper ul');
      
      var nmb_toLoad = $list.find('li:empty').length;
      if (nmb_toLoad == 0) {
         g_isReady = true;
         return;
      }  
      $.get('multimedia.class.php', {op:'display',req:nmb_toLoad,cursor:MMG.data.loaded,
                                     folder:g_currentFolder,share:(g_share ? '1' : '0')} , function(data) {
         var res = JSON.parse(data);
         if (res.length == 0)
            g_isReady = true;
         var load_state = {res_length: res.length, total_loaded: 0};
         MMG.incrementLoadedFiles(res.length);
         MMG.showOptionMore();
         MMG.showFolderBack();
         for (var i = 0; i < res.length; ++i) {
            if (res[i].type == 'folder')
               MMG.addFolder(res[i], load_state, $list);
            else
               MMG.addThumbnail(res[i], load_state, $list);
         }
         
      },'text');

   },
   getImageDir : function(root, isFolder) {
      if (g_share)
         return root + HIDDEN + g_currentFolder;
      if (g_currentFolder == '' && !isFolder)
         return root + GALLERY + MAIN;

      return root + GALLERY + g_currentFolder;
   },
   /**
   * add a thumbnailed item to the grid display
   */
   addThumbnail : function(elem, load_state, $list) {
      var elem_thumb = elem.thumb;
      var elem_sources = elem.sources;
      var elem_type = elem.type;
      var elem_description = elem.description;
      var elem_meta = elem.meta;

      load_state.total_loaded += 1;
      var $item = $('<a class="'+ elem_type + '" href="#" />');
      //$item.append($('<img alt="' + elem_type + '"/>')
      $item.append($('<img/>')
         .load(function() {
            //MMG.resizeGridImage($(this), 140, 100);
         }).attr('src', MMG.getImageDir(THUMBROOT) + elem_thumb)
           .data('sources', elem_sources)
           .data('type', elem_type)
           .data('description', elem_description)
           .data('meta', elem_meta)
      );
      $list.find('li:empty:first').append($item);

      if (load_state.total_loaded == load_state.res_length) {
         g_isReady = true;
         // if the user was navigating through the items
         // show the next one...
         if (g_isPreviewing) {
            g_isPreviewing = false;
            MMG.showItem();
         }
      }

/*
      $('<img alt="'+elem_type+'"/>').load(function(){
         var $this = $(this);
         load_state.total_loaded += 1;
         MMG.resizeGridImage($this, 140, 100);
         var $elem = $('<a class="'+ $this.attr('alt') +'" href="#" />').append($this);
         $list.find('li:empty:first').append($elem);
         if (load_state.total_loaded == load_state.res_length) {
            g_isReady = true;
            // if the user was navigating through the items
            // show the next one...
            if (g_isPreviewing) {
               g_isPreviewing = false;
               MultimediaGallery.showItem();
            }
         }
      }).attr('src', THUMBROOT + g_currentFolder + elem_thumb)
         .data('sources', elem_sources)
         .data('type', elem_type)
         .data('description', elem_description)
         .data('meta', elem_meta); */
   },
   /**
   * add a folder to the grid display
   */
   addFolder : function(elem, load_state, $list) {
      var elem_thumb = elem.thumb;
      var elem_sources = elem.sources;
      var elem_type = elem.type;
      var elem_description = elem.description;
      var path = elem_sources[0].source;

      load_state.total_loaded += 1;
      var $item = $('<a class="folder"><div class="name">' + elem_description + '</div></a>');
      $item.hide();
      $item.append($('<img alt="' + elem_type + '"/>')
         .load(function() {
            MMG.resizeGridImage($(this), 110, 80);
            $item.show();
         }).attr('src', MMG.getImageDir(THUMBROOT, true) + path + '/' + elem_thumb)
      );
      $list.find('li:empty:first').append($item).click(function() {
         MMG.clickFolder(elem_sources[0].source);
      });
      MMG.data.folders += 1;
   },
   /**
   * execute when a folder is clicked
   */
   clickFolder : function(folderName) {
      if (folderName != '')
         g_currentFolder += folderName + '/';
      $('#mmg_media_wrapper ul').empty();
      g_isReady = true;
      MMG.start();
   },
   /**
   * execute when the folder back button is clicked
   */
   backFolder : function() {
      var lastslash = g_currentFolder.lastIndexOf('/', g_currentFolder.length - 2);
      var previous = '';
      if (lastslash != -1)
         previous = g_currentFolder.substring(0, lastslash);

      g_currentFolder = '';
      MMG.clickFolder(previous);
   },
   /**
   * shows the button to go back a folder level
   */
   showFolderBack : function() {
      if(g_currentFolder != '' && g_currentFolder != g_root)
         $('#mmg_prev_folder .prevfolder').show();
      else
         $('#mmg_prev_folder .prevfolder').hide();
   },
   /**
   * shows the button "more" if there are more items
   */
   showOptionMore : function() {
      if(MMG.data.loaded == MMG.data.total)
         $('#mmg_media_wrapper .more').hide();
      else
         $('#mmg_media_wrapper .more').show();
   },
   /**
   * increments the amount of loaded files
   */
   incrementLoadedFiles : function (newfiles) {
      MMG.data.loaded += newfiles;
   },
   /**
   * user clicks on more button
   */
   more : function (){
      if (g_isReady){
         var nmb_containers = Math.min(MMG.data.total-MMG.data.loaded,
                                       MMG.data.set)
         MMG.draw(nmb_containers);
      }              
   },
   /**
   * show the medium-sized image preview
   */
   showImagePreview : function(img_source, description, meta) {
      //XXX get rid of params for this function, instead use globals in MMG.data
      //XXX remove forward-passing of these to other funcs
      var $photo = $('<img id="mmg_medium_photo"/>').load(function() {
         var $theImage = $(this);
         $('#mmg_preview .preview_wrap').fadeOut(100, function() {
            $('#mmg_preview_loading').hide();
            $('#mmg_preview .preview_border').show();
            $(this).empty().
               append('<a href="#" id="mmg_item_close" class="close"></a>').
               append('<a href="#" id="mmg_item_enlarge" class="enlarge"></a>').
               append('<a href="#" id="mmg_item_info" class="info"></a>').
               append('<a href="#" id="mmg_prev" class="prev"></a>').
               append('<a href="#" id="mmg_next" class="next"></a>').
               append($theImage).fadeIn();
            MMG.toggleNav();
            MMG.changeDescription(description);
            if (g_showMeta)
               MMG.changeMeta(meta);
            MMG.resize($theImage);
         })
      }).attr('src', img_source);

      if (MMG.data.currentItem != MMG.data.total)
         $photo.css('cursor', 'pointer')
            .bind('click', function(e) {
               MMG.showNext();
               e.preventDefault();
            });
   },
   /**
   * display the next/prev item arrows
   */
   toggleNav : function() {
      if (MMG.data.currentItem == MMG.data.folders + 1)
         $('#mmg_prev').hide();
      else
         $('#mmg_prev').show();

      if (MMG.data.currentItem == MMG.data.total)
         $('#mmg_next').hide();
      else
         $('#mmg_next').show();
   },
   /**
   * displays the item when user clicks on thumb (photo,video or audio)
   */
   showItem : function() {
      if (MMG.data.currentItem < 1) return;
      
      $('#mmg_overlay,#mmg_preview').show();
      var $preview_wrap = $('#mmg_preview .preview_wrap');

      var $list = $('#mmg_media_wrapper ul');
      var $item = $list.find('li:nth-child('+ MMG.data.currentItem +')').find('img');
      if (!$item.length){
         /**
         * reached the end, let's load more
         */
         if(MMG.data.currentItem == parseInt(MMG.data.total)+1) {
            MMG.data.currentItem = MMG.data.currentItem-1;
            return;
         }
         
         MMG.more();
         g_isPreviewing = true;
         return;
      }
      $('#mmg_preview_loading').show();   
      $('#mmg_prev_folder .prevfolder').hide();
      /**
      * photo, video or audio
      */
      var item_type = $item.data('type');
      var item_sources = $item.data('sources');
      var item_description = $item.data('description');
      var item_meta = $item.data('meta');
      switch (item_type) {
         case 'photo':
            var large;
            var medium;
            if (item_sources[0].size == 'large') {
               large = MMG.getImageDir(LARGEROOT) + item_sources[0].source;
               medium = MMG.getImageDir(MEDROOT) + item_sources[1].source;
            }
            else {
               large = MMG.getImageDir(LARGEROOT) + item_sources[1].source;
               medium = MMG.getImageDir(MEDROOT) + item_sources[0].source;
            }

            MMG.data.mediumImage = medium;
            MMG.data.largeImage = large;
            MMG.data.description = item_description;
            MMG.data.meta = item_meta;
            MMG.showImagePreview(medium, item_description, item_meta);
            break;
         case 'audio':
            var $mediawrapper = $('<div />',{
               className   : 'media-player'
            });
            var sources_length   = item_sources.length;
            var $sources      = '';
            for(var i = 0; i < sources_length; ++i){
               var theSource  = item_sources[i].source;
               var format     = theSource.substr(theSource.lastIndexOf('.')+1);
               $sources       += '<source src="'+theSource+'" type="'+ item_type +'/'+ format +'"/>';
            }
            var $audio = '<audio controls="controls">'+$sources+'</audio>';
            
            $preview_wrap.fadeOut(100,function(){
               $('#mmg_preview_loading').hide();
               $(this).empty().append('<a href="#" id="mmg_item_close" class="close"></a>').append($mediawrapper.html($.fixHTML5($audio))).fadeIn();
               MMG.changeDescription(item_description);
               MMG.changeMeta(item_meta);
               $mediawrapper.jmeEmbedControls();
               var audioW  = 432;
               var audioH  = 32;
               MMG.centerPreview(audioW,audioH);
            });
            break;
         case 'video':
            var $mediawrapper = $('<div />',{
               className   : 'media-player _video'
            });
            
            var sources_length = item_sources.length;
            var $sources = '';
            for(var i = 0; i < sources_length; ++i){
               var theSource = item_sources[i].source;
               $sources += '<source src="'+theSource+'"/>';
            }
            var $video = '<video controls="controls" preload="none">'+$sources+'<div class="fallback"><div class="fallback-text"><p>Please use a modern browser or install <a href="http://www.videolan.org/">VLC (check Mozilla Plugin)</a> or <a href="http://get.adobe.com/flashplayer/">Flash-Plugin</a></p></div></div>'+'</video>';
            
            $preview_wrap.fadeOut(100,function(){
               $('#mmg_preview_loading').hide();
               $(this).empty().append('<a href="#" id="mmg_item_close" class="close"></a>').append($mediawrapper.html($.fixHTML5($video))).fadeIn();
               MMG.changeDescription(item_description);
               MMG.changeDescription(item_meta);
               $mediawrapper.jmeEmbedControls({
                  timeSlider: {
                     range: 'min'
                  }
               }).bind('useractive', function(){
                  $('div.media-controls', this).stop().animate({opacity: 1});
               }).bind('userinactive', function(){
                  $('div.media-controls', this).stop().animate({opacity: 0});
               }).find('div.media-controls').css('opacity', 0);
               var videoW  = 432;
               var videoH  = 240;
               MMG.centerPreview(videoW,videoH);
            });
            break;   
      }
   },
   /**
   * adds a description when there is one
   */
   changeDescription : function (item_description) {
      if (item_description == '' || item_description == 'None')
         $('#mmg_description').hide();
      else  
         $('#mmg_description').empty().html('<p>' +
               MMG.truncateText(item_description, DESC_MAX_LENGTH) + '</p>').show();
   },
   /**
   * update the metadata display (EXIF)
   */
   changeMeta : function (item_meta) {
      $('#mmg_item_info').css({'opacity':'1'});
      $('#mmg_meta .meta_wrap').empty();

      var out = '<table>';
      out += MMG.getMeta(item_meta.camera, 'camera');
      out += MMG.getMeta(item_meta.lens, 'lens');
      out += MMG.getMeta(item_meta.focal_length, 'focal length');
      out += MMG.getMeta(item_meta.shutter_speed, 'shutter');
      out += MMG.getMeta(item_meta.aperture, 'aperture');
      out += MMG.getMeta(item_meta.iso, 'iso');
      out += '</table>';
      $('#mmg_meta .meta_wrap').append(out);
      $('#mmg_meta').show();
   },
   /**
   * add the key-value pair to the metadata display
   */
   getMeta : function (value, field) {
      var out = '<tr><td class="meta_fields">' + field + '</td>';
      if (value && value != '' && value != 'None') {
         out += '<td class="meta_values">' + value + '</td></tr>';
      }
      else
         out += '<td class="meta_values">N/A</td></tr>';
      return out;
   },
   /**
   * add the key-value pair to the metadata display
   */
   appendMeta2Line : function (value, field) {
      var valid_data = value && value != '' && value != 'None';
      var use_two_lines = valid_data ? value.length > META_MAX_LENGTH : false;
      var max = use_two_lines ? META_MAX_LENGTH * 2 : META_MAX_LENGTH;

      $('#mmg_meta .meta_wrap .meta_fields').append(field + '<br/>');
      if (use_two_lines)
         $('#mmg_meta .meta_wrap .meta_fields').append('<br/>');

      if (valid_data) {
         var output = MMG.truncateText(value, max);
         $('#mmg_meta .meta_wrap .meta_values').append(output + '<br/>');
      }
      else
         $('#mmg_meta .meta_wrap .meta_values').append('N/A<br/>');

      return use_two_lines;
   },
   /**
   * user clicks on the cross to close the item
   */
   truncateText : function (text, limit) {
      if (text.length <= limit)
         return text;
      return text.substr(0, limit - 3) + '...';
   },
   /**
   * user clicks on the cross to close the item
   */
   hidePreview : function () {
      var $preview_wrap = $('#mmg_preview .preview_wrap');
      $('#mmg_overlay,#mmg_preview,#mmg_description,#mmg_meta').hide();
      $('#mmg_preview .preview_border').hide();
      $preview_wrap.empty();
      $preview_wrap.removeAttr('style');
      MMG.showFolderBack();
   },
   /**
   * auto-scroll the large image based on mouse movement
   */
   bindHitbox: function (name, horSpeed, vertSpeed) {
      $(name).hover(
         function() {
            MMG.data.scrollVert = vertSpeed;
            MMG.data.scrollHor = horSpeed;
            MMG.moveLargeImage();
         },
         function() {
            MMG.data.scrollVert = 0;
            MMG.data.scrollHor = 0;
            MMG.stopMoveLargeImage();
         }
      );
   },
   /**
   * user clicks on the square to enlarge the item
   */
   enlargeImage: function () {
      var imageObj;
      $('#mmg_preview_loading').show();
      $('<img id="mmg_large_photo"/>').load(function() {

         $('#pageheader,#mmg_preview,#mmg_overlay,' +
           '#mmg_description,#mmg_meta,#mmg_media_wrapper').hide();
         $('#mmg_large').show();

         var $theImage = $(this);
         $('#mmg_large .large_wrap').fadeOut(100, function() {
            $('#mmg_preview_loading').hide();
            $(this).empty().append($theImage).fadeIn();
            imageObj = new Image();
            imageObj.src = $theImage.attr("src");
         })
      })
      .attr('src', MMG.data.largeImage)
      .css({
         'cursor':'pointer'
      })

      $('body').css({
         'overflow-x':'hidden',
         'overflow-y':'hidden',
         'cursor':'pointer'
      })
      .bind('click', function(e) {
            MMG.hideLarge();
            e.preventDefault();
      });

      MMG.bindHitbox('#mmg_large .large_hitbox_bottom', 0, 10);
      MMG.bindHitbox('#mmg_large .large_hitbox_top', 0, -10);
      MMG.bindHitbox('#mmg_large .large_hitbox_left', -10, 0);
      MMG.bindHitbox('#mmg_large .large_hitbox_right', 10, 0);
      MMG.bindHitbox('#mmg_large .large_hitbox_tl', -10, -10);
      MMG.bindHitbox('#mmg_large .large_hitbox_tr', 10, -10);
      MMG.bindHitbox('#mmg_large .large_hitbox_bl', -10, 10);
      MMG.bindHitbox('#mmg_large .large_hitbox_br', 10, 10);
   },
   /**
   * user clicks on the 'i' to show item info (EXIF)
   */
   toggleMeta : function () {
      if (g_showMeta) {
         $('#mmg_meta').hide();
         $('#mmg_item_info').css({'opacity':'0.5'});
      }
      else {
         MMG.changeMeta(MMG.data.meta);
      }

      g_showMeta = !g_showMeta;
   },
   /**
   * Scroll the large image on a timed interval
   */
   moveOnInterval : function() {
      if (MMG.data.scrollVert != 0) {
         var newTop = $(document).scrollTop() + MMG.data.scrollVert;
         $(document).scrollTop(newTop);
      }
      if (MMG.data.scrollHor != 0) {
         var newLeft = $(document).scrollLeft() + MMG.data.scrollHor;
         $(document).scrollLeft(newLeft);
      }
   },
   /**
   * Move the large image based on mouse movements
   */
   moveLargeImage : function() {
      if (!MMG.data.scrollInterval)
         MMG.data.scrollInterval = setInterval(function() {
            MMG.moveOnInterval();
         }, 25);
   },
   /**
   * Stop moving the large image
   */
   stopMoveLargeImage : function(mouseEvent) {
      if (MMG.data.scrollInterval &&
          MMG.data.scrollVert == 0 &&
          MMG.data.scrollHor == 0) {
         clearInterval(MMG.data.scrollInterval);
         delete MMG.data.scrollInterval;
      }
   },
   /**
   * user clicks on the large image to close it
   */
   hideLarge : function () {
      $('#pageheader,#mmg_preview,#mmg_overlay,#mmg_media_wrapper').show();
      if (MMG.data.description)
         $('#mmg_description').show();
      if (g_showMeta)
         $('#mmg_meta').show();

      var $large_image = $('#mmg_large_photo');
      $large_image.hide();
      $large_image.empty();
      $('#mmg_large').hide();
      // restore scrollbars
      $('body').css({
         'overflow-x':'hidden',
         'overflow-y':'auto',
         'cursor':'auto'
      })
      .unbind('click');
   },
   /**
   * resize the image (medium image), based on windows width and height
   */
   resize : function ($image){
      var widthMargin = 10
      var heightMargin = 120;
      
      var windowH = $(window).height()-heightMargin;
      var windowW = $(window).width()-widthMargin;
      var theImage = new Image();
      theImage.src = $image.attr("src");
      var imgwidth = theImage.width;
      var imgheight = theImage.height;

      if((imgwidth > windowW)||(imgheight > windowH)){
         if(imgwidth > imgheight){
            var newwidth = windowW;
            var ratio = imgwidth / windowW;
            var newheight = imgheight / ratio;
            theImage.height = newheight;
            theImage.width= newwidth;
            if(newheight>windowH){
               var newnewheight = windowH;
               var newratio = newheight/windowH;
               var newnewwidth =newwidth/newratio;
               theImage.width = newnewwidth;
               theImage.height= newnewheight;
            }
         }
         else{
            var newheight = windowH;
            var ratio = imgheight / windowH;
            var newwidth = imgwidth / ratio;
            theImage.height = newheight;
            theImage.width= newwidth;
            if(newwidth>windowW){
               var newnewwidth = windowW;
               var newratio = newwidth/windowW;
               var newnewheight =newheight/newratio;
               theImage.height = newnewheight;
               theImage.width= newnewwidth;
            }
         }
      }
      $image.css({
         'width':theImage.width+'px',
         'height':theImage.height+'px'
      });
      MMG.centerPreview(theImage.width,theImage.height);
   },
   /**
   * center the large image / video / audio on the page
   */
   centerPreview : function (width,height){
      var $preview_wrap = $('#mmg_preview .preview_wrap');
      $preview_wrap.css({
         'width':width+'px',
         'height':height+'px',
         'margin-top':-(height/2)-20+'px',
         'margin-left':-(width/2)-30+'px'
      });
      $('#mmg_preview .preview_border').css({
         'width':width+'px',
         'height':height+'px',
         'margin-top':-(height/2)-20+'px',
         'margin-left':-(width/2)-30+'px'
      });
   },
   /**
   * resize each thumb image in the grid view
   */
   resizeGridImage : function ($image, containerwidth, containerheight){
      var theImage   = new Image();
      theImage.src   = $image.attr("src");
      var imgwidth   = theImage.width;
      var imgheight  = theImage.height;
      
      if(imgwidth > containerwidth){
         var newwidth = containerwidth;
         var ratio = imgwidth / containerwidth;
         var newheight = imgheight / ratio;
         if(newheight > containerheight){
            var newnewheight = containerheight;
            var newratio = newheight/containerheight;
            var newnewwidth =newwidth/newratio;
            theImage.width = newnewwidth;
            theImage.height= newnewheight;
         }
         else{
            theImage.width = newwidth;
            theImage.height= newheight;
         }
      }
      else if(imgheight > containerheight){
         var newheight = containerheight;
         var ratio = imgheight / containerheight;
         var newwidth = imgwidth / ratio;
         if(newwidth > containerwidth){
            var newnewwidth = containerwidth;
            var newratio = newwidth/containerwidth;
            var newnewheight =newheight/newratio;
            theImage.height = newnewheight;
            theImage.width= newnewwidth;
         }
         else{
            theImage.width = newwidth;
            theImage.height= newheight;
         }
      }
      $image.css({
         'width':theImage.width,
         'height':theImage.height
         });
   }
};

MMG.init();
});
