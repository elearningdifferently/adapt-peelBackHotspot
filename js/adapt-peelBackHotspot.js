/*
* adapt-peelBackHotspot
* Version - 0.0.0
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/
define(function(require) {

	var ComponentView = require('coreViews/componentView');
	var Adapt = require('coreJS/adapt');
	var Draggabilly = require('components/adapt-peelBackHotspot/js/draggabilly');

    var peelbackhotspot = ComponentView.extend({
        
    	events: {
    		"click .peelbackhotspot-button": "onButtonClick",
            "touchend .peelbackhotspot-button": "onButtonClick",
            "click .peelbackhotspot-hotspot": "onHotspotClick",
            "touchend .peelbackhotspot-hotspot": "onHotspotClick"
    	},

        preRender: function() {

        },

        postRender: function() {
        	this.$boundary = this.$('#peelbackhotspot-track');
        	this.$el.imageready(_.bind(function() {

                this.onResize();

	        	this.setReadyStatus();
	        	var item = this.$('.peelbackhotspot-button')[0];
	        	item._dragger = new Draggabilly(item, {
	                containment: true,
	                axis: 'x'
	            });
	            item._dragger.on("dragStart", _.bind(this.dragStart, this));
	            item._dragger.on("dragMove", _.bind(this.dragMove, this));
	            item._dragger.on("dragEnd", _.bind(this.dragEnd, this));

	        }, this));
            Adapt.on("device:resize", _.bind(this.onResize, this));
        },

        onResize: function() {
            this.$('.peelbackhotspot-foreground').css({
                height: this.model.get("_reveal")._maxHeight[Adapt.device.screenSize] 
            });
            this.$('.peelbackhotspot-foreground').css({
                left:  ((this.$('#peelbackhotspot-track').width() / 2)  - (this.$('.peelbackhotspot-foreground').width() / 2)) + "px"
            });
            this.$('.peelbackhotspot-overlaycontainer').css({
                width: this.$('.peelbackhotspot-foreground').width() + "px",
                left:  ((this.$('#peelbackhotspot-track').width() / 2)  - (this.$('.peelbackhotspot-foreground').width() / 2)) + "px"
            });
            this.$('.peelbackhotspot-background').css({
                width: this.$('.peelbackhotspot-foreground').width() + "px",
            });
            this.$('.peelbackhotspot-hotspots').css({
                width: this.$('.peelbackhotspot-foreground').width() + "px",
            });
            if (this.peelbackhotspoted) {
                var offsetX = this.$('#peelbackhotspot-track').width() - (this.$('.peelbackhotspot-button').outerWidth() + 6);
                this.$('.peelbackhotspot-button').css({
                    left: offsetX + "px"
                });
            }
        },

        dragStart: function(instance, event) {
            console.log("dragStart");
        	this.startState = this.peelbackhotspoted;
        },

        dragMove: function(instance, event) {
            this.inDrag = true;
        	var boundaryOffset = this.$boundary.offset();

            var pagePoint;
            var $ele = $(instance.element);
            if (event.pageX !== 0) {
                if (event.clientY < boundaryOffset.top) {
                    event.pageX = event.clientX;
                    event.pageY = event.clientY;
                }
                pagePoint = {
                    left: event.pageX - this.$('.peelbackhotspot-button').outerWidth() / 2,
                    top: event.pageY
                };
            } else {
                var $elePosition = $ele.position();
                pagePoint = {
                    left: $elePosition.left  + this.$('.peelbackhotspot-button').outerWidth() / 2,
                    top: $elePosition.top
                };
            }

        
            var pointAsPixel = {
                left: ((pagePoint.left - boundaryOffset.left)),
                top:  ((pagePoint.top - boundaryOffset.top))
            };

            var offsetX = this.$('#peelbackhotspot-track').width() - this.$('.peelbackhotspot-button').outerWidth();

            var pointAsPercent = {
                left: ((100 / offsetX) * (pointAsPixel.left))
            };

            if (pointAsPercent.left > 100) pointAsPercent.left = 100;
            if (pointAsPercent.left < 0) pointAsPercent.left = 0;

            this.$('.peelbackhotspot-hider').css({
            	width: pointAsPercent.left + '%'
            });


            if (pointAsPercent.left < 50) {
                this.$('.peelbackhotspot-button').html( this.model.get("_reveal")._button.textRight);
                //this.peelbackhotspoted = false;
            } else {
                this.$('.peelbackhotspot-button').html( this.model.get("_reveal")._button.textLeft);
                //this.peelbackhotspoted = true;
            }

            this.$('.peelbackhotspot-foreground').css('opacity','.98');
            setTimeout(_.bind(function() {
                this.$('.peelbackhotspot-foreground').css('opacity','1');
            }, this), 0);

        },

        dragEnd: function(instance, event) {
            if ( this.inAnimate) return
            
            _.defer(_.bind(function() {
                console.log("dragEnd");
                this.inAnimate = true;

                var offsetX = this.$('#peelbackhotspot-track').width() - (this.$('.peelbackhotspot-button').outerWidth() + 6);
                var percentageLeft = (100/offsetX) * this.$('.peelbackhotspot-button').position().left;
                var dragged = (percentageLeft > 98 && this.peelbackhotspoted ? false : percentageLeft < 2 && !this.peelbackhotspoted ? false : true);

                this.animate(dragged);
                this.inDrag = false;
            }, this));
        },


        onButtonClick: function() {
            if (this.inDrag) return;
            if ( this.inAnimate) return
            this.inAnimate = true;
            _.defer(_.bind(function() {
                console.log("click");
                this.animate(false);
            }, this));

        },

        animate: function(fromDrag) {
            this.$('.peelbackhotspot-button').attr("disabled","disabled");
            var offsetX = this.$('#peelbackhotspot-track').width() - (this.$('.peelbackhotspot-button').outerWidth() + 6);
            var percentageLeft = (100/offsetX) * this.$('.peelbackhotspot-button').position().left;
            percentageLeft = (percentageLeft > 100 ? 100 : percentageLeft < 0 ? 0 : percentageLeft);

            // hidden: pickup and drop before halfway || peelbackhotspoted: drag over halfway left || peelbackhotspoted: click
            var inLeftHalf = (percentageLeft >= 0 && percentageLeft < 50);
            var inRightHalf = (percentageLeft <= 100 && percentageLeft > 50);

            var peelbackhotspotedClicked = ( fromDrag === false && this.peelbackhotspoted);
            var hiddenClicked = ( fromDrag === false && !this.peelbackhotspoted);
            
            var peelbackhotspotedClicked, hiddenClicked, fullDragLeft, fullDragRight;

            if ( (inRightHalf && peelbackhotspotedClicked) || (inLeftHalf && fromDrag) ) {
                
                this.$('.peelbackhotspot-hider').velocity({ width: "0%" }, "easeInSine");
                this.$('.peelbackhotspot-button').velocity({ left: "0px" } , { progress:  _.bind(function() {
                    this.$('.peelbackhotspot-foreground').css('opacity','.98');
                    setTimeout(_.bind(function() {
                        this.$('.peelbackhotspot-foreground').css('opacity','1');
                        this.inAnimate = false;
                    }, this), 0);
                },this), complete: _.bind(function() {
                    this.$('.peelbackhotspot-button').html(this.model.get("_reveal")._button.textLeft);
                    this.$('.peelbackhotspot-foreground').css('opacity','.98');
                    this.$('.peelbackhotspot-button').removeAttr("disabled").focusNoScroll();
                    this.$('.peelbackhotspot-hotspot').attr("tabindex", -1);
                    setTimeout(_.bind(function() {
                        this.$('.peelbackhotspot-foreground').css('opacity','1');
                    }, this), 0);
                },this)}, "easeInSine");
                this.peelbackhotspoted = false;
            } else if ( (inLeftHalf && hiddenClicked) || (inRightHalf && fromDrag) ) {
                this.$('.peelbackhotspot-hider').velocity({ width: "100%" }, "easeInSine");
                this.$('.peelbackhotspot-button').velocity({ left: offsetX + "px" } , { complete: _.bind(function() {
                    this.$('.peelbackhotspot-button').html(this.model.get("_reveal")._button.textRight);
                    this.inAnimate = false;
                    this.$('.peelbackhotspot-button').removeAttr("disabled").focusNoScroll();
                    this.$('.peelbackhotspot-hotspot').attr("tabindex", 0);
                },this)}, "easeInSine");
                this.peelbackhotspoted = true;
            }

            this.dragTick = false;
        },

        onHotspotClick: function(event) {
            event.preventDefault();
            var $ele = $(event.currentTarget);
            var index = $ele.attr("data-id");

            var items = this.model.get("_items");

            var popupObject = {
                title: items[index].title,
                body: items[index].body
            };

            Adapt.trigger('notify:popup', popupObject);

        }

        
    });
    
    Adapt.register("peelbackhotspot", peelbackhotspot );

    if ($.fn.focusNoScroll === undefined) $.fn.focusNoScroll = function(){
      var y = $(window).scrollTop();
      this[0].focus();
      window.scrollTo(null, y);
      return this; //chainability
    };

    
});