/*global angular, $, document*/
/**
 * Generates an angular-aware callback when the specfied element becomes visible or invisible.
 * Optionally, may provide an offset to specify when the event should be thrown (utilizes the same)
 * semantics as the scrollfix plugin.
 * 
 * This plugin is based heavily on both the ui-scrollfix plugin and the jquery waypoints plugin,
 * https://github.com/imakewebthings/jquery-waypoints.
 *
 * @param [offset] {int} optional Y-offset to override the detected offset.
 *   Takes 300 (absolute) or -300 or +300 (relative to detected)
 */
angular.module('ui.waypoints',[]).directive('uiWaypoints', ['$window', "$parse", function ($window, $parse) {
  'use strict';
  return {
    require: '^?uiWaypointsTarget',
    link: function (scope, elm, attrs, uiWaypointsTarget) {
    
      // Decide on the options
      var options = {
        direction: 'vertical',
        reference: 'top',
        enter: null,
        exit: null,
        both: null
      };
      if(attrs.uiWaypoints == null) {
        throw new Error("ui-waypoints requires arguments");
      }

      // Options are either an object, a function (enter callback), or an error
      var getter = $parse(attrs.uiWaypoints);
      var arg = getter(scope);
      if(typeof(arg) === 'object') {
        options = angular.extend(options,arg);
      } else if(typeof(arg) === 'function') {
        options.both = arg;
      } else {
        throw new Error("ui-waypoints requires an expression that evaluates to either a function or an object");
      }

      // This is what we will watch for scrolling events; defaults to window if not otherwise specified
      var $target = uiWaypointsTarget && uiWaypointsTarget.$element || angular.element($window);


      var getCurrentOffsets = function() {
        // Get the current offsets
        var top = elm[0].offsetTop,
            left = elm[0].offsetLeft;
        
        // Decide on the location to trigger the events from
        var offset = {vertical: top, horizontal: left};
        var references = ["vertical", "horizontal"];

        if(options.offset) {
          for(var i in references) {
            var reference = references[i];
            if (typeof(options.offset[reference]) === 'string') {
              // charAt is generally faster than indexOf: http://jsperf.com/indexof-vs-charat
              if (options.offset[reference].charAt(0) === '-') {
                offset[reference] = offset[reference] - parseFloat(options.offset[reference].substr(1));
              } else if (options.offset.charAt(0) === '+') {
                offset[reference] = offset[reference] + parseFloat(attrs.uiWaypoints.substr(1));
              }
            } else if(typeof(options.offset[reference]) === "number") {
              offset[reference] = offset[reference] + options.offset[reference];
            }// Offset established
          }
        }

        return offset;
      };
      
      

      // We will start in the "above" state, meaning no events will be
      // thrown until we pass the element by scrolling
      var above = {
        "vertical": true,
        "horizontal": true
      };

      $target.bind('scroll', function () {

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

        // Get the current offset
        var offset = getCurrentOffsets();
        

        // Do callbacks
        var directions = ["vertical","horizontal"];
        for(var i in directions) {

          var activeDirection = directions[i];

          // Select the offset based on whether we're interested in vertical or horizontal
          var currentOffset = yOffset;
          if(activeDirection === "horizontal") {
            currentOffset = xOffset;
          }

          var direction = null;
          if(above[activeDirection] && currentOffset > offset[activeDirection]) {
            direction = activeDirection === "vertical" ? "down" : "right";
            if(options.enter) {
              options.enter(direction, elm[0]);
            }
              
            if(options.both) {
              options.both(direction, elm[0]);
            }
              
            above[activeDirection] = false;
          } else if(!above[activeDirection] && currentOffset < offset[activeDirection]) {
            direction = activeDirection === "vertical" ? "up" : "left";
            if(options.exit) {
              options.exit(direction, elm[0]);
            }
              
            if(options.both){
              options.both(direction, elm[0]);
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
