/*global describe, beforeEach, module, inject, it, spyOn, expect, $ */
describe('uiWaypoints', function () {
  'use strict';

  var scope, $compile, $window, $body, $container;
  beforeEach(module('ui.waypoints'));
  beforeEach(inject(function (_$rootScope_, _$compile_, _$window_) {
    scope = _$rootScope_.$new();
    $compile = _$compile_;
    $window = _$window_;
    scope.enter = function() {};
    scope.exit = function() {}
    $body = angular.element("body");
    $body.empty();
    $container = angular.element('<div id="container"></div>');
    $body.append($container);
  }));

  describe('compiling this directive', function () {
    it('should bind to window "scroll" event', function () {
      spyOn($.fn, 'bind');
      scope.f = function() {};
      $compile('<div ui-waypoints="f"></div>')(scope);
      expect($.fn.bind).toHaveBeenCalled();
      expect($.fn.bind.mostRecentCall.args[0]).toBe('scroll');
    });
  });
  describe('scrolling the window', function () {
    it('should trigger function if a function call is specified', function () {
      scope.f = function(){
        return "A";
      }

      spyOn(scope, 'f');

      // Test Fixture
      var element = angular.element('<div style="height:900px"></div><div id="test" ui-waypoints="f"></div><div style="height:900px">');
      $container.append(element);
      $compile($body.contents())(scope)
      var $fixture = angular.element("#test");

      // Scroll the window to the test element
      angular.element($window).scrollTop($fixture.offset().top + 1);

      // TODO: Is there a way to synchronously wait for the scroll event to be fired by the browser here?
      // Need to trigger it myself in the meantime
      angular.element($window).trigger('scroll');
      expect(scope.f).toHaveBeenCalled();
    });

    it('should call the enter function when the window transitions from above to below the element', function () {
      scope.enter = function(){}
      spyOn(scope, 'enter');

      // Test Fixture
      var element = angular.element('<div><div style="height:900px"></div><div id="test" ui-waypoints="{\'enter\': enter}"></div><div style="height:900px"></div>');
      $container.append(element);
      $compile($body.contents())(scope)
      var $fixture = angular.element("#test");

      // Scroll past
      angular.element($window).scrollTop($fixture.offset().top + 50);
      angular.element($window).trigger('scroll');

      
      expect(scope.enter).toHaveBeenCalledWith("down", $fixture[0]);
    });

    it('should call the exit function when the window transitions from below to above the element', function () {
      scope.g = function(){};
      spyOn(scope, 'g');

      // Test Fixture
      var element = angular.element('<div style="height:900px"></div><div id="test" ui-waypoints="{\'exit\': g}"></div><div style="height:900px">');
      $container.append(element);
      $compile($body.contents())(scope)
      var $fixture = angular.element("#test");

      // Scroll past
      angular.element($window).scrollTop($fixture.offset().top + 50);
      angular.element($window).trigger('scroll');

      // Scroll back before
      angular.element($window).scrollTop($fixture.offset().top - 50);
      angular.element($window).trigger('scroll');


      expect(scope.g).toHaveBeenCalledWith("up", $fixture[0]);
    });

    it('should call the enter function when the window transitions from left to right of element', function () {
      scope.f = function(){}
      spyOn(scope, 'f');

      // Test Fixture
      var element = angular.element('<div style="white-space: nowrap; width:4000px;"><span style="height:10px; width:1300px; display: inline-block;">Test1</span><span id="test" ui-waypoints="{\'enter\': f}" style="display:inline-block; width:1200px; height: 10px">Test2</span></div>');
      $container.append(element);
      $compile($body.contents())(scope)
      var $fixture = angular.element("#test");
      // Scroll past
      angular.element($window).scrollLeft($fixture.offset().left + 50);
      angular.element($window).trigger('scroll');
      
      expect(scope.f).toHaveBeenCalledWith('right', $fixture[0]);
    });

    
    
  });
});
