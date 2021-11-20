/**
 * Create a d3 range slider that selects ranges between `rangeMin` and `rangeMax`, and add it to the
 * `containerSelector`. The contents of the container is laid out as follows
 * <code>
 * <div class="drag">
 *     <div class="handle WW"></div>
 *     <div class="handle EE"></div>
 * </div>
 * </code>
 * The appearance can be changed with CSS, but the `position` must be `relative`, and the width of `.slider` should be
 * left unaltered.
 *
 * @param rangeMin Minimum value of the range
 * @param rangeMax Maximum value of the range
 * @param containerSelector A CSS selection indicating exactly one element in the document
 * @returns {{range: function(number, number), onChange: function(function)}}
 */
 function createD3RangeSlider (rangeMin, rangeMax, containerSelector) {
    "use strict";

    const snapInterval = 50;
    var totalSliderSize = document.querySelector(containerSelector).clientWidth;
    var minInterval = 200;
    var minFraction = minInterval/(rangeMax-rangeMin);
    var minWidth = minFraction*totalSliderSize;

    var sliderRange = {begin: rangeMin, end: rangeMin};
    var changeListeners = [];
    var touchEndListeners = [];
    var container = d3.select(containerSelector);

    var containerHeight = container.node().offsetHeight;

    var sliderBox = container.append("div")
        .style("position", "relative")
        .style("height", (containerHeight - 1) + "px")
        .style("min-width", (minWidth*2) + "px")
        .classed("slider-container", true);

    //Create elements in container
    var slider = sliderBox
        .append("div")
        .attr("class", "slider");
    var handleW = slider.append("div").attr("class", "handle WW");
    var handleE = slider.append("div").attr("class", "handle EE");

    /** Update the `left` and `width` attributes of `slider` based on `sliderRange` */
    function updateUIFromRange () {

        let interval = (rangeMax-rangeMin)
        let startX = (totalSliderSize * (sliderRange.begin-rangeMin))/interval;
        let endX = (totalSliderSize * (sliderRange.end-rangeMin))/interval;

        slider
            .style("left", startX+ "px")
            .style("width", (endX-startX) + "px");
    }

    /** Update the `sliderRange` based on the `left` and `width` attributes of `slider` */
    function updateRangeFromUI () {
        var uirangeL = parseFloat(slider.style("left"));
        var uirangeW = parseFloat(slider.style("width"));
        var conW = totalSliderSize; //parseFloat(container.style("width"));
        var slope = (conW) / (rangeMax - rangeMin);
        var rangeW = (uirangeW) / slope;
        if (conW == uirangeW) {
            var uislope = 0;
        } else {
            var uislope = (rangeMax - rangeMin - rangeW) / (conW - uirangeW);
        }
        var rangeL = rangeMin + uislope * uirangeL;

        let newBegin = Math.round(rangeL) > rangeMax - minInterval ? (rangeMax - minInterval) : Math.round(rangeL);
        let newEnd = Math.round(rangeL + rangeW) > rangeMax ? rangeMax : Math.round(rangeL + rangeW);
        
        if(newBegin != sliderRange.begin || newEnd != sliderRange.end) {
            sliderRange.begin = newBegin;
            sliderRange.end = newEnd;
    
            //Fire change listeners
            changeListeners.forEach(function (callback) {
                callback({begin: sliderRange.begin, end: sliderRange.end});
            });
        }
    }

    function findNearestSnap(x) {

        let interval = (rangeMax-rangeMin)
        let currentVal = (interval * x)/totalSliderSize + rangeMin;
        currentVal = Math.min(currentVal, rangeMax);
        let bestSnapVal = Math.round(currentVal/snapInterval)*snapInterval;
        return ((totalSliderSize * (bestSnapVal-rangeMin))/interval);
    }

    // configure drag behavior for handles and slider
    var dragResizeE = d3.drag()
        .on("start", function (event, d) {
            this.startX = d3.pointer(event)[0];
        })
        .on("end", function () {
            touchEndListeners.forEach(function (callback) {
                callback({begin: sliderRange.begin, end: sliderRange.end});
            });
        })
        .on("drag", function (event, d) {
            var dx = event.x;
            if (dx == 0) return;
            var newWidth = dx;
            var left = parseFloat(slider.style("left"));
            newWidth = Math.max(newWidth, minWidth);
            let snapRight = findNearestSnap(left+newWidth);
            newWidth = snapRight-left;

            if ((left + newWidth) > totalSliderSize) { 
                newWidth = totalSliderSize - left;
            }

            slider.style("width", newWidth + "px");
            updateRangeFromUI();
        });

    var dragResizeW = d3.drag()
        .on("start", function (event, d) {
            this.startX = d3.pointer(event)[0];
        })
        .on("end", function () {
            touchEndListeners.forEach(function (callback) {
                callback({begin: sliderRange.begin, end: sliderRange.end});
            });
        })
        .on("drag", function (event, d) {
            var dx = event.x;
            if (dx==0) return;
            var newLeft = parseFloat(slider.style("left")) + dx;
            let snapLeft = findNearestSnap(newLeft);
            var newWidth = parseFloat(slider.style("width")) - dx;
            newWidth = newWidth + (newLeft-snapLeft);
            newLeft = snapLeft;

            if (newLeft < 0) {
                newWidth += newLeft;
                newLeft = 0;
            }
            if (newWidth < minWidth) { 
                newLeft -= minWidth - newWidth;
                newWidth = minWidth;
            }

            slider.style("left", newLeft + "px");
            slider.style("width", newWidth + "px");

            updateRangeFromUI();
        });

    var lastKnownX;

    var dragMove = d3.drag()
        .on("start", function (event, d) {
            lastKnownX = event.x;
        })
        .on("end", function () {
            touchEndListeners.forEach(function (callback) {
                callback({begin: sliderRange.begin, end: sliderRange.end});
            });
        })
        .on("drag", function (event, d) {
            var dx = event.x-lastKnownX;
            var oldLeft = parseFloat(slider.style("left"));
            var oldWidth = parseFloat(slider.style("width"));
            var newLeft = findNearestSnap(oldLeft + dx);
            newLeft = Math.max(newLeft, 0);
            newLeft = Math.min(newLeft, totalSliderSize-oldWidth);
            
            if(Math.floor(oldLeft) != Math.floor(newLeft)) {
                lastKnownX += newLeft-oldLeft;
                slider.style("left", newLeft + "px");
            }   
            
            updateRangeFromUI();
        });

    handleE.call(dragResizeE);
    handleW.call(dragResizeW);
    slider.call(dragMove);

    //Click on bar
    sliderBox.on("mousedown", function (ev) {
        var x = d3.pointer(sliderBox.node())[0];
        var props = {};
        var sliderWidth = parseFloat(slider.style("width"));
        var conWidth = sliderBox.node().clientWidth; //parseFloat(container.style("width"));
        props.left = Math.min(conWidth - sliderWidth, Math.max(x - sliderWidth / 2, 0));
        props.left = Math.round(props.left);
        props.width = Math.round(props.width);
        slider.style("left", props.left + "px")
            .style("width", props.width + "px");
        updateRangeFromUI();
    });

    //Reposition slider on window resize
    window.addEventListener("resize", function () {
        updateUIFromRange();
    });

    function onChange(callback){
        changeListeners.push(callback);
        return this;
    }

    function onTouchEnd(callback){
        touchEndListeners.push(callback);
        return this;
    }

    function setRange (b, e) {
        sliderRange.begin = b;
        sliderRange.end = e;

        updateUIFromRange();

        //Fire change listeners
        changeListeners.forEach(function (callback) {
            callback({begin: sliderRange.begin, end: sliderRange.end});
        });
    }


    /**
     * Returns or sets the range depending on arguments.
     * If `b` and `e` are both numbers then the range is set to span from `b` to `e`.
     * If `b` is a number and `e` is undefined the beginning of the slider is moved to `b`.
     * If both `b` and `e` are undefined the currently set range is returned as an object with `begin` and `end`
     * attributes.
     * If any arguments cause the range to be outside of the `rangeMin` and `rangeMax` specified on slider creation
     * then a warning is printed and the range correspondingly clamped.
     * @param b beginning of range
     * @param e end of range
     * @returns {{begin: number, end: number}}
     */
    function range(b, e) {
        var rLower;
        var rUpper;
        if (typeof b === "number" && typeof e === "number") {

            rLower = Math.min(b, e);
            rUpper = Math.max(b, e);

            //Check that lower and upper range are within their bounds
            if (rLower < rangeMin || rUpper > rangeMax) {
                console.log("Warning: trying to set range (" + rLower + "," + rUpper + ") which is outside of bounds (" + rangeMin + "," + rangeMax + "). ");
                rLower = Math.max(rLower, rangeMin);
                rUpper = Math.min(rUpper, rangeMax);
            }
            //Set the range
            setRange(rLower, rUpper);
        } else if (typeof b === "number") {

            rLower = b;
            var dif = sliderRange.end - sliderRange.begin;
            rUpper = rLower + dif;

            if (rLower < rangeMin) {
                console.log("Warning: trying to set range (" + rLower + "," + rUpper + ") which is outside of bounds (" + rangeMin + "," + rangeMax + "). ");
                rLower = rangeMin;
            }
            if(rUpper > rangeMax){
                console.log("Warning: trying to set range (" + rLower + "," + rUpper + ") which is outside of bounds (" + rangeMin + "," + rangeMax + "). ");
                rLower = rangeMax - dif;
                rUpper = rangeMax;
            }
            setRange(rLower, rUpper);
        }

        return {begin: sliderRange.begin, end: sliderRange.end};
    }

    setRange(sliderRange.begin, sliderRange.end);

    return {
        range: range,
        onChange: onChange,
        onTouchEnd: onTouchEnd,
        updateUIFromRange: updateUIFromRange
    };
}