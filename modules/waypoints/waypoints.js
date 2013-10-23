/**
 * Generates an angular-aware callback when the specfied element passes the specified element.
 * Optionally, may provide an offset to specify when the event should be thrown
 * 
 * This plugin is based heavily on both the ui-scrollfix plugin and inspired by the jquery
 * waypoints plugin, https://github.com/imakewebthings/jquery-waypoints.
 * 
 *
 * @param [options | callback] {object | function} Configuration options or callback function
 *  This should be an expression that evaluates to either an object or a function. 
 *
 *  If it is a function, the function will be called with the arguments (direction, element),
 *  where direction is a string that is one of "up", "down", "left", or "right". The element
 *  will be the element that triggered the callback.
 *
 *  If it is an object, it is assumed to be an options object. The possible options are
 *   - enter
 *   - exit
 *   - both
 *   - offset
 *
 *  All of these options are described in more detail on the demo page
 */
angular.module('ui.waypoints',[]).directive('uiWaypoints', ['$window', "$parse", function ($window, $parse) {
  'use strict';


  /* Utility functions */

  /* 
   * Get current offset of the specified target element, 
   * taking into account the offset preferences provided via the options
   */
  var getTargetOffsets = function(targetElement, options) {

    options = options || {};

    // Get the current offsets
    var top = targetElement[0].offsetTop,
        left = targetElement[0].offsetLeft;

    // Decide on the location to trigger the events from
    var offset = {vertical: top, horizontal: left};
    var references = ["vertical", "horizontal"];

    for(var i in references) {
      var reference = references[i];
      if (typeof(options.offset[reference]) === 'string') {
        // charAt is generally faster than indexOf: http://jsperf.com/indexof-vs-charat
        if (options.offset[reference].charAt(0) === '-') {
          offset[reference] = offset[reference] - parseFloat(options.offset[reference].substr(1));
        } else if (options.offset[reference].charAt(0) === '+') {
          offset[reference] = offset[reference] + parseFloat(options.offset[reference].substr(1));
        }
      } else if(typeof(options.offset[reference]) === "number") {
        offset[reference] = offset[reference] + options.offset[reference];
      }// Offset established
    }
    return offset;
  };

  /*
   * Get the location current scroll location of the window. Should be cross-browser compatible.
   */
  var getCurrentWindowOffsets = function() {

    // if pageYOffset is defined use it, otherwise use other crap for IE
    var xOffset, yOffset;
    if (angular.isDefined($window.pageYOffset)) {
      yOffset = $window.pageYOffset;
      xOffset = $window.pageXOffset;
    } else {
      var iebody = (document.compatMode && document.compatMode !== "BackCompat") ? document.documentElement : document.body;
      yOffset = iebody.scrollTop;
      xOffset = iebody.scrollLeft;
    }

    return {
      vertical: yOffset,
      horizontal: xOffset
    };
  };


  return {
    require: '^?uiWaypointsTarget',
    link: function (scope, elm, attrs, uiWaypointsTarget) {

      // Decide on the options
      var options = {
        direction: 'vertical',
        reference: 'top',
        offset: {
          vertical: 0,
          horizontal: 0
        },
        enter: null,
        exit: null,
        both: null,
        addClass: null,
        updateOffset: true
      };
      if(attrs.uiWaypoints == null) {
        throw new Error("ui-waypoints requires arguments");
      }

      // Options are either an object, a function (enter callback), a string (class to assign), completely empty (ui-scrollfix) or an error
      if(attrs.uiWaypoints == null || attrs.uiWaypoints == '') {
        // no args, assume ui-scrollfix functionality
        options.addClass = 'ui-scrollfix';
        options.updateOffset = false;
      } else if(attrs.uiWaypoints.charAt(0) === '+' || 
                attrs.uiWaypoints.charAt(0) === '-' || 
                !isNaN(parseInt(attrs.uiWaypoints))) {
        
        // They may are trying to specify an offset for ui-scrollfix functionality
        options.offset.vertical = attrs.uiWaypoints;// Covers string case

        // Covers numeric case
        if(!isNaN(parseInt(attrs.uiWaypoints))) options.offset.vertical = parseInt(attrs.uiWaypoints);
        
        options.addClass = 'ui-scrollfix';
      } else {
        // User specified args
        var getter = $parse(attrs.uiWaypoints);
        var arg = getter(scope);
        if(typeof(arg) === 'object') {
          options = angular.extend(options,arg);
        } else if(typeof(arg) === 'function') {
          options.both = arg;
        } else if(typeof(arg) === 'string') {
          // They want to specify a class to assign
          options.addClass = arg;
          options.updateOffset = false;
        } else {
          throw new Error("ui-waypoints requires an expression that evaluates to either a function or an object");
        }
      }
      

      // Sanitize options
      if(options.offset.vertical == null) options.offset.vertical = 0;
      if(options.offset.horizontal == null) options.offset.horizontal = 0;
      if(options.verticalOffset) {
        options.offset.vertical = options.verticalOffset;
      }
      if(options.horizontalOffset) {
        options.offset.horizontal = options.horizontalOffset;
      }

      // This is what we will watch for scrolling events; defaults to window if not otherwise specified
      var $target = uiWaypointsTarget && uiWaypointsTarget.$element || angular.element($window);

      // We will start in the "above" state, meaning no events will be
      // thrown until we pass the element by scrolling
      var above = {
        "vertical": true,
        "horizontal": true
      };

      var offset = getTargetOffsets(elm, options);
      var triggered = false;
      $target.bind('scroll', function () {


        // Get the window offsets
        var windowOffsets = getCurrentWindowOffsets();

        // Get the current offset
        // The triggered flag is necessary to make sure that we keep updating the location of
        //   the subject until it is first encountered. This prevents jumping around of the
        //   target offset location as the page/js is loading. Likely a better way to do this.
        if(options.updateOffset || !triggered)
          offset = getTargetOffsets(elm, options);

        // Do callbacks
        var directions = ["vertical","horizontal"];
        for(var i in directions) {

          var activeDirection = directions[i];

          // Select the offset based on whether we're interested in vertical or horizontal
          var currentOffset = windowOffsets[activeDirection];

          var direction = null;
          if(above[activeDirection] && currentOffset > offset[activeDirection]) {
            direction = activeDirection === "vertical" ? "down" : "right";
            triggered = true;
            if(options.enter) {
              options.enter(direction, elm[0]);
            }
              
            if(options.both) {
              options.both(direction, elm[0]);
            }

            if(options.addClass) {
              if(!elm.hasClass(options.addClass)) {
                elm.addClass(options.addClass);
              }
            }
              
            above[activeDirection] = false;
          } else if(!above[activeDirection] && currentOffset < offset[activeDirection]) {
            direction = activeDirection === "vertical" ? "up" : "left";
            triggered = true;
            if(options.exit) {
              options.exit(direction, elm[0]);
            }
              
            if(options.both){
              options.both(direction, elm[0]);
            }

            if(elm.hasClass(options.addClass)) {
              elm.removeClass(options.addClass);
            }
            above[activeDirection] = true;
          }
        }// for(i in directions)
        
        // Need this since we aren't in an angular event handler
        if(!(scope.$$phase || scope.$root.$$phase)) {
          scope.$apply();
        }
      });
    }
  };
}]).directive('uiWaypointsTarget', [function () {
  'use strict';
  return {
    controller: function($element) {
      this.$element = $element;
    }
  };
}]);
