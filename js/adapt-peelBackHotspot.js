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
        isAccordian: false,

    	events: {
    		"click .peelbackhotspot-button": "onButtonClick",
            "touchend .peelbackhotspot-button": "onButtonClick",
            "click .peelbackhotspot-hotspot": "onHotspotClick",
            "touchend .peelbackhotspot-hotspot": "onHotspotClick",
            "click .peelbackhotspot-infobox": "onHotspotClick",
            "touchend .peelbackhotspot-infobox": "onHotspotClick",
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

                this.checkCompletion();

	        }, this));
            this.listenTo(Adapt, "device:resize", this.onResize);
        },

        reRender: function() {
            if (Adapt.device.screenSize != 'large' && this.model.get("_isAccordianOnMobile")) {
                if (!this.isAccordian) this.replaceWithAccordion();
                return this.isAccordian = true;
            } else {
                if (this.isAccordian) this.replaceWithPeelBackHotspot();
                return this.isAccordian = false;
            }
        },

        replaceWithAccordion: function() {
            var Accordion = require('components/adapt-contrib-accordion/js/adapt-contrib-accordion');
            var model = this.prepareAccordionModel();
            model.set('_component', 'accordion');
            this.newAccordion = new Accordion({model:model});
            this.newAccordion.preRender();
            this.newAccordion.postRender();
            model.set('_component', 'peelbackhotspot');
            var $container = $(".component-container", $("." + this.model.get("_parentId")));
            $container.empty();
            $container.append(this.newAccordion.$el);
            this.stopListening(Adapt, 'device:resize');
            Adapt.trigger('device:resize');
            this.undelegateEvents();
            this.listenTo(Adapt, "device:resize", this.onResize);
        },

        prepareAccordionModel: function() {
            var model = this.model;
            if (model.get('_wasPeelBackHotspot')) return model;
            model.set('_wasPeelBackHotspot', true);
            model.set('originalBody', model.get('body'));
            model.set('originalTitle', model.get('displayTitle'));
            if (model.get('mobileBody')) {
            model.set('body', model.get('mobileBody'));
            }
            if (model.get('mobileTitle')) {
            model.set('displayTitle', model.get('mobileTitle'));
            }
            return model;
        },

        replaceWithPeelBackHotspot: function() {
            this.newAccordion.remove();
            this.preparePeelBackHotspotModel();
            this.render();
            var $container = $(".component-container", $("." + this.model.get("_parentId")));
            $container.empty();
            $container.append(this.$el);
            this.stopListening(Adapt, 'device:resize');
            Adapt.trigger('device:resize');
            this.listenTo(Adapt, "device:resize", this.onResize);
            this.delegateEvents();
        },

        preparePeelBackHotspotModel: function() {
            var model = this.model;
            this.isRevealed = false;
            if (!model.get('_wasPeelBackHotspot')) return;
            model.set('_wasPeelBackHotspot', false);
            if (model.get('mobileBody')) {
                model.set('body', model.get('originalBody'));
            }
            if (model.get('mobileTitle')) {
                model.set('displayTitle', model.get('originalTitle'));
            }
            return model;
        },


        onResize: function() {
            if (this.reRender()) return;

            var size = this.$('.peelbackhotspot-button').outerWidth();

            this.$('.peelbackhotspot-foreground').css({
                height: this.model.get("_reveal")._maxHeight[Adapt.device.screenSize] 
            });
            this.$('.peelbackhotspot-foreground').css({
                left:  ((this.$('.peelbackhotspot-imageboard').width() / 2)  - (this.$('.peelbackhotspot-foreground').width() / 2)) + "px"
            });
            this.$('.peelbackhotspot-overlaycontainer').css({
                width: this.$('.peelbackhotspot-imageboard').width() - size + "px",
                left:  (size / 2) + "px"
            });
            this.$('.peelbackhotspot-background').css({
                width: this.$('.peelbackhotspot-foreground').width() + "px",
                left: ((this.$('.peelbackhotspot-imageboard').width() / 2)  - (this.$('.peelbackhotspot-foreground').width() / 2)) - (size / 2) + "px"
            });
            this.$('.peelbackhotspot-hotspots').css({
                width: this.$('.peelbackhotspot-foreground').width() + "px",
                left: ((this.$('.peelbackhotspot-imageboard').width() / 2)  - (this.$('.peelbackhotspot-foreground').width() / 2)) - (size / 2) + "px"
            });
            if (this.isRevealed) {
                var offsetX = this.$('#peelbackhotspot-track').width() - (size + 1);
                this.$('.peelbackhotspot-button, .peelbackhotspot-button-image').css({
                    left: offsetX + "px"
                });
            } else {
                var offsetX = this.$('#peelbackhotspot-track').width() - (size + 1);
                this.$('.peelbackhotspot-button, .peelbackhotspot-button-image').css({
                    left: "0px"
                });
            }
        },

        dragStart: function(instance, event) {
            console.log("dragStart");
        	this.startState = this.isRevealed;
        },

        dragMove: function(instance, event) {
            var size = this.$('.peelbackhotspot-button').outerWidth();

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
                    left: event.pageX - size / 2,
                    top: event.pageY
                };
            } else {
                var $elePosition = $ele.position();
                pagePoint = {
                    left: $elePosition.left  + size / 2,
                    top: $elePosition.top
                };
            }

        
            var pointAsPixel = {
                left: ((pagePoint.left - boundaryOffset.left)),
                top:  ((pagePoint.top - boundaryOffset.top))
            };

            var offsetX = this.$('#peelbackhotspot-track').width() - (size  + 1);

            var pointAsPercent = {
                left: ((100 / offsetX) * (pointAsPixel.left))
            };

            if (pointAsPercent.left > 100) pointAsPercent.left = 100;
            if (pointAsPercent.left < 0) pointAsPercent.left = 0;

            this.$('.peelbackhotspot-hider').css({
            	width: pointAsPercent.left + '%'
            });
            this.$('.peelbackhotspot-button-image').css({
                left: this.$('.peelbackhotspot-button').position().left + "px"
            });


            if (pointAsPercent.left < 50) {
                if (!this.model.get("_reveal")._button._img) this.$('.peelbackhotspot-button').html( this.model.get("_reveal")._button.textRight);
            } else {
                if (!this.model.get("_reveal")._button._img) this.$('.peelbackhotspot-button').html( this.model.get("_reveal")._button.textLeft);
            }

        },

        dragEnd: function(instance, event) {
            if ( this.inAnimate) return

            var size = this.$('.peelbackhotspot-button').outerWidth();

            
            _.defer(_.bind(function() {
                console.log("dragEnd");
                this.inAnimate = true;

                var offsetX = this.$('#peelbackhotspot-track').width() - (size  + 1);
                var percentageLeft = (100/offsetX) * this.$('.peelbackhotspot-button').position().left;
                var dragged = (percentageLeft > 98 && this.isRevealed ? false : percentageLeft < 2 && !this.isRevealed ? false : true);

                this.animate(dragged);
                this.inDrag = false;
            }, this));
        },


        onButtonClick: function(event) {
            if (event) event.preventDefault();
            if (this.inDrag) return;
            if ( this.inAnimate) return
            this.inAnimate = true;
            _.defer(_.bind(function() {
                console.log("click");
                this.animate(false);
            }, this));

        },

        animate: function(fromDrag) {
            var size = this.$('.peelbackhotspot-button').outerWidth();

            //this.$('.peelbackhotspot-button').attr("disabled","disabled");
            var offsetX = this.$('#peelbackhotspot-track').width() - (size + 1);
            var percentageLeft = (100/offsetX) * this.$('.peelbackhotspot-button').position().left;
            percentageLeft = (percentageLeft > 100 ? 100 : percentageLeft < 0 ? 0 : percentageLeft);

            // hidden: pickup and drop before halfway || isRevealed: drag over halfway left || isRevealed: click
            var inLeftHalf = (percentageLeft >= 0 && percentageLeft < 50);
            var inRightHalf = (percentageLeft <= 100 && percentageLeft > 50);

            var revealedClicked = ( fromDrag === false && this.isRevealed);
            var hiddenClicked = ( fromDrag === false && !this.isRevealed);
            
            var revealedClicked, hiddenClicked, fullDragLeft, fullDragRight;

            var size = this.$('.peelbackhotspot-button').outerWidth();

            if ( (inRightHalf && revealedClicked) || (inLeftHalf && fromDrag) ) {
                
                //this.$('.peelbackhotspot-hider').velocity({ width: "0%" }, "easeInSine");
                this.$('.peelbackhotspot-button').velocity({ left: "0px" } , { 
                    progress:  _.bind(function(elements, percentComplete) {

                        var offsetX = this.$('#peelbackhotspot-track').width() - (size  + 1);

                        var pointAsPercent = {
                            left: ((100 / offsetX) * ( $(elements).position().left ))
                        };

                        if (pointAsPercent.left > 100) pointAsPercent.left = 100;
                        if (pointAsPercent.left < 0) pointAsPercent.left = 0;

                        this.$('.peelbackhotspot-hider').css({
                            width: pointAsPercent.left + '%'
                        });
                        this.$('.peelbackhotspot-button-image').css({
                            left: $(elements).position().left + "px"
                        });

                        this.$('.peelbackhotspot-foreground').css('opacity','.98');
                        setTimeout(_.bind(function() {
                            this.$('.peelbackhotspot-foreground').css('opacity','1');
                            this.inAnimate = false;
                        }, this), 0);

                    },this),
                    complete: _.bind(function() {
                        if (!this.model.get("_reveal")._button._img) this.$('.peelbackhotspot-button').html(this.model.get("_reveal")._button.textLeft);
                        this.$('.peelbackhotspot-foreground').css('opacity','.98');
                        setTimeout(_.bind(function() {
                            this.$('.peelbackhotspot-foreground').css('opacity','1');
                        }, this), 0);
                        this.onRevealed(false);
                },this)}, "easeInSine");
                this.isRevealed = false;
            } else if ( (inLeftHalf && hiddenClicked) || (inRightHalf && fromDrag) ) {
                //this.$('.peelbackhotspot-hider').velocity({ width: "100%" }, "easeInSine");
                this.$('.peelbackhotspot-button').velocity({ left: offsetX + "px" } , { 
                    progress: _.bind(function(elements, percentComplete) {
                       
                        var offsetX = this.$('#peelbackhotspot-track').width() - (size  + 1);

                        var pointAsPercent = {
                            left: ((100 / offsetX) * ( $(elements).position().left ))
                        };

                        if (pointAsPercent.left > 100) pointAsPercent.left = 100;
                        if (pointAsPercent.left < 0) pointAsPercent.left = 0;

                        this.$('.peelbackhotspot-hider').css({
                            width: pointAsPercent.left + '%'
                        });

                        this.$('.peelbackhotspot-button-image').css({
                            left: $(elements).position().left + "px"
                        });



                    }, this),
                    complete: _.bind(function() {
                        if (!this.model.get("_reveal")._button._img) this.$('.peelbackhotspot-button').html(this.model.get("_reveal")._button.textRight);
                        this.inAnimate = false;
                        this.onRevealed(true);
                },this)}, "easeInSine");
                this.isRevealed = true;
            }

            this.dragTick = false;
        },

        checkCompletion: function() {
            var items = this.model.get("_items");
            var visited = _.reduce(items, function(memo, item) {
                return memo + (item._isVisited ? 1 : 0);
            }, 0);
            if (visited === items.length) this.setCompletionStatus();
        },

        onHotspotClick: function(event) {
            event.preventDefault();
            var $ele = $(event.currentTarget);
            var index = $ele.attr("data-id");
            var items = this.model.get("_items");
           
            items[index]._isVisited = true;

            if (items[index]._infoType === undefined) items[index]._infoType = "notify";

            switch (items[index]._infoType) {
            case "notify":
                this.showNotify(index);
                break;            
            case "infobox":
                this.toggleInfoBox(index);
                break;
            }

            this.checkCompletion();
            $ele.addClass("visited");

        },
        showNotify: function(index) {
            var items = this.model.get("_items");
            var popupObject = {
                title: items[index].title,
                body: items[index].body
            };
            Adapt.trigger('notify:popup', popupObject);
        },
        toggleInfoBox: function(index, force){
            var items = this.model.get("_items");
            var paddingPixels = this.model.get("_reveal")._infoboxPaddingPixels;
            if (paddingPixels === undefined) paddingPixels = {top:10,left:10};

            var infobox = this.$('#item-'+index+'.peelbackhotspot-infobox');
            if ((infobox.css("display") === "none" && force === undefined) || force === "reveal") {
                var html = '<div><div class="peelbackhotspot-infobox-title" role="heading"></div><div class="peelbackhotspot-infobox-body"></div></div>';
                var div = $(html);
                div.find('.peelbackhotspot-infobox-title').html(items[index].title);
                div.find('.peelbackhotspot-infobox-body').html(items[index].body);
                infobox.html("").append(div);
                infobox.fadeIn(1000);
                

                var img = this.$('.peelbackhotspot-background');
                var height = img.height();
                var width = img.width();

                var padding = {
                    top:10, 
                    left:10
                };
                padding.top = (100/height) * paddingPixels.top;
                padding.left = (100/width) * paddingPixels.left;

                var $pin = this.$('.peelbackhotspot-hotspot[data-id="'+index+'"]');
                var top = (((100/height) * ($pin.height() / 2)) + parseInt(items[index]._top)) - ((100/height) * infobox.outerHeight());
                if (top < padding.top) top = padding.top;

                var left;

                var pinleft = (100/width) * $pin.position().left;

                if (pinleft > 50) {
                    if (( pinleft + (100/width) * (infobox.width() / 2) ) > (100 - (padding.left*2)) ) left = ((100 - (padding.left*2)) - (((100/width) * (infobox.width())))) + padding.left;
                    else left = ( pinleft - (100/width) * (infobox.width() / 2) );
                } else {
                    if (( pinleft - (100/width) * (infobox.width() / 2) ) < padding.left ) left = padding.left;
                    else left = ( pinleft - (100/width) * (infobox.width() / 2) );
                }

                infobox.css({
                    top: top + "%",
                    left: left + "%"
                });

                items[index]._isVisited = true;

            } else if ((infobox.css("display") !== "none" && force === undefined) || force === "hide")  {
                infobox.css("display", "none");
                infobox.html("")
            }
        },
        onRevealed: function(isRevealed) {
            var items = this.model.get("_items");
            //this.$('.peelbackhotspot-button').removeAttr("disabled").focusNoScroll();
            if (isRevealed) {
                if (this.model.get("_reveal") && this.model.get("_reveal")._isInfoBoxAriaOnly !== true) {
                    this.$('.peelbackhotspot-hotspot').attr("tabindex", 0);
                }
                _.each(items, _.bind(function(item, index) {
                    if (item._infoType === undefined) item._infoType = "notify";
                    switch (item._infoType) {
                    case "notify":
                        break;
                    case "infobox":
                        if (item._isInfoBoxShown) {
                            this.toggleInfoBox(index, "reveal");
                        }
                    }
                }, this));
                this.checkCompletion();
            } else {
                this.$('.peelbackhotspot-hotspot').attr("tabindex", -1);
                _.each(items, _.bind(function(item, index) {
                    if (item._infoType === undefined) item._infoType = "notify";
                    switch (item._infoType) {
                    case "notify":
                        break;
                    case "infobox":
                        if (item._isInfoBoxShown) {
                            this.toggleInfoBox(index, "hide");
                        }
                    }
                }, this));
            }
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