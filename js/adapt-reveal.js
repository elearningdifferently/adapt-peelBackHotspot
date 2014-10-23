/*
* adapt-reveal
* Version - 0.0.0
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/
define(function(require) {

	var ComponentView = require('coreViews/componentView');
	var Adapt = require('coreJS/adapt');
	var Draggabilly = require('components/adapt-reveal/js/draggabilly');

    var reveal = ComponentView.extend({
        
    	events: {
    		"click .reveal-button": "onButtonClick",
            "touchend .reveal-button": "onButtonClick",
            "click .reveal-hotspot": "onHotspotClick",
            "touchend .reveal-hotspot": "onHotspotClick"
    	},

        preRender: function() {

        },

        postRender: function() {
        	this.$boundary = this.$('#reveal-track');
        	this.$el.imageready(_.bind(function() {

                this.onResize();

	        	this.setReadyStatus();
	        	var item = this.$('.reveal-button')[0];
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
            this.$('.reveal-foreground').css({
                height: this.model.get("_reveal")._maxHeight[Adapt.device.screenSize] 
            });
            this.$('.reveal-foreground').css({
                left:  ((this.$('#reveal-track').width() / 2)  - (this.$('.reveal-foreground').width() / 2)) + "px"
            });
            this.$('.reveal-overlaycontainer').css({
                width: this.$('.reveal-foreground').width() + "px",
                left:  ((this.$('#reveal-track').width() / 2)  - (this.$('.reveal-foreground').width() / 2)) + "px"
            });
            this.$('.reveal-background').css({
                width: this.$('.reveal-foreground').width() + "px",
            });
            this.$('.reveal-hotspots').css({
                width: this.$('.reveal-foreground').width() + "px",
            });
            if (this.revealed) {
                var offsetX = this.$('#reveal-track').width() - (this.$('.reveal-button').outerWidth() + 6);
                this.$('.reveal-button').css({
                    left: offsetX + "px"
                });
            }
        },

        dragStart: function(instance, event) {
            console.log("dragStart");
        	this.startState = this.revealed;
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
                    left: event.pageX - this.$('.reveal-button').outerWidth() / 2,
                    top: event.pageY
                };
            } else {
                var $elePosition = $ele.position();
                pagePoint = {
                    left: $elePosition.left  + this.$('.reveal-button').outerWidth() / 2,
                    top: $elePosition.top
                };
            }

        
            var pointAsPixel = {
                left: ((pagePoint.left - boundaryOffset.left)),
                top:  ((pagePoint.top - boundaryOffset.top))
            };

            var offsetX = this.$('#reveal-track').width() - this.$('.reveal-button').outerWidth();

            var pointAsPercent = {
                left: ((100 / offsetX) * (pointAsPixel.left))
            };

            if (pointAsPercent.left > 100) pointAsPercent.left = 100;
            if (pointAsPercent.left < 0) pointAsPercent.left = 0;

            this.$('.reveal-hider').css({
            	width: pointAsPercent.left + '%'
            });


            if (pointAsPercent.left < 50) {
                this.$('.reveal-button').html( this.model.get("_reveal")._button.textRight);
                //this.revealed = false;
            } else {
                this.$('.reveal-button').html( this.model.get("_reveal")._button.textLeft);
                //this.revealed = true;
            }

            this.$('.reveal-foreground').css('opacity','.98');
            setTimeout(_.bind(function() {
                this.$('.reveal-foreground').css('opacity','1');
            }, this), 0);

        },

        dragEnd: function(instance, event) {
            if ( this.inAnimate) return
            
            _.defer(_.bind(function() {
                console.log("dragEnd");
                this.inAnimate = true;

                var offsetX = this.$('#reveal-track').width() - (this.$('.reveal-button').outerWidth() + 6);
                var percentageLeft = (100/offsetX) * this.$('.reveal-button').position().left;
                var dragged = (percentageLeft > 98 && this.revealed ? false : percentageLeft < 2 && !this.revealed ? false : true);

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
            this.$('.reveal-button').attr("disabled","disabled");
            var offsetX = this.$('#reveal-track').width() - (this.$('.reveal-button').outerWidth() + 6);
            var percentageLeft = (100/offsetX) * this.$('.reveal-button').position().left;
            percentageLeft = (percentageLeft > 100 ? 100 : percentageLeft < 0 ? 0 : percentageLeft);

            // hidden: pickup and drop before halfway || revealed: drag over halfway left || revealed: click
            var inLeftHalf = (percentageLeft >= 0 && percentageLeft < 50);
            var inRightHalf = (percentageLeft <= 100 && percentageLeft > 50);

            var revealedClicked = ( fromDrag === false && this.revealed);
            var hiddenClicked = ( fromDrag === false && !this.revealed);
            
            var revealedClicked, hiddenClicked, fullDragLeft, fullDragRight;

            if ( (inRightHalf && revealedClicked) || (inLeftHalf && fromDrag) ) {
                
                this.$('.reveal-hider').velocity({ width: "0%" }, "easeInSine");
                this.$('.reveal-button').velocity({ left: "0px" } , { progress:  _.bind(function() {
                    this.$('.reveal-foreground').css('opacity','.98');
                    setTimeout(_.bind(function() {
                        this.$('.reveal-foreground').css('opacity','1');
                        this.inAnimate = false;
                    }, this), 0);
                },this), complete: _.bind(function() {
                    this.$('.reveal-button').html(this.model.get("_reveal")._button.textLeft);
                    this.$('.reveal-foreground').css('opacity','.98');
                    this.$('.reveal-button').removeAttr("disabled").focusNoScroll();
                    this.$('.reveal-hotspot').attr("tabindex", -1);
                    setTimeout(_.bind(function() {
                        this.$('.reveal-foreground').css('opacity','1');
                    }, this), 0);
                },this)}, "easeInSine");
                this.revealed = false;
            } else if ( (inLeftHalf && hiddenClicked) || (inRightHalf && fromDrag) ) {
                this.$('.reveal-hider').velocity({ width: "100%" }, "easeInSine");
                this.$('.reveal-button').velocity({ left: offsetX + "px" } , { complete: _.bind(function() {
                    this.$('.reveal-button').html(this.model.get("_reveal")._button.textRight);
                    this.inAnimate = false;
                    this.$('.reveal-button').removeAttr("disabled").focusNoScroll();
                    this.$('.reveal-hotspot').attr("tabindex", 0);
                },this)}, "easeInSine");
                this.revealed = true;
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
    
    Adapt.register("reveal", reveal );

    if ($.fn.focusNoScroll === undefined) $.fn.focusNoScroll = function(){
      var y = $(window).scrollTop();
      this[0].focus();
      window.scrollTo(null, y);
      return this; //chainability
    };

    
});