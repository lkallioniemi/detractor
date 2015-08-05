window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame     ||
        window.webkitRequestAnimationFrame  ||
        window.mozRequestAnimationFrame     ||
        window.msRequestAnimationFrame      ||
        function( callback ) { return window.setTimeout( callback, 0); };
})();

window.cancelAnimationFrame = (function() {
    return window.cancelAnimationFrame      ||
        window.webkitCancelAnimationFrame   ||
        window.mozCancelAnimationFrame      ||
        window.msCancelAnimationFrame       ||
        function( intervalKey ) { window.clearTimeout( intervalKey ); };
})();

if (!window.getComputedStyle) {
    window.getComputedStyle = function(el, pseudo) {
        this.el = el;
        this.getPropertyValue = function(prop) {
            var re = /(\-([a-z]){1})/g;
            if (prop == 'float') prop = 'styleFloat';
            if (re.test(prop)) {
                prop = prop.replace(re, function () {
                    return arguments[2].toUpperCase();
                });
            }
            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
        }
        return this;
    }
}


var IE = document.all?true:false
var container = document.getElementById('banner');
var mouseX=0;
var mouseY = 0;
var oldX = 0;
var oldY = 0;
var speedx = 0;
var speedy = 0;
var container_width = parseInt(window.getComputedStyle(container).getPropertyValue('width'));
var container_height = parseInt(window.getComputedStyle(container).getPropertyValue('height'));
var relaxationIterations = 40;
var inertia = 0.9;
var particles = 70;
var canvas = document.createElement('canvas');
var canvas_offscreen = document.createElement('canvas');
var canvas_image = document.createElement('canvas');
var context = canvas.getContext("2d");
var context_offscreen = canvas_offscreen.getContext("2d");
var context_image = canvas_image.getContext("2d");
var Lines = new Array();
var image_width, image_height;
var layerImages = ['assets/img/background.jpg','assets/img/layer1.png','assets/img/layer2.png'];
var layers = new Array();
var image_aspect = 0, image_height, image_width;
var clip_x_start, clip_y_start, clip_x_width, clip_y_width;


function Dot(x,y){
    this.x = x;
    this.y = y;
    this.ex = 0;
    this.ey = 0;
}

Dot.prototype.move = function(){
    if (this.ex != 0 && this.ey !=0){
        this.x = this.x + this.ex;
        this.y = this.y + this.ey;
        
        if (this.x <= 0 ){ this.x = 0; this.ex = -this.ex; }
        if (this.y <= 0 ){ this.y = 0; this.ey = -this.ey; }
        if (this.x >= container_width){ this.x = container_width; this.ex = -this.ex; }
        if (this.y >= container_height){ this.y = container_height; this.ey = -this.ey; }
    
        this.ex = this.ex * inertia;
        this.ey = this.ey * inertia;
        
        if (this.ex < 0.05 && this.ex > -0.05) this.ex = 0;
        if (this.ey < 0.05 && this.ey > -0.05) this.ey = 0;
    }
}

Dot.prototype.bump = function(forcex, forcey){
    this.ex += forcex;
    this.ey += forcey;
}

function Path(dots){
    this.dots = dots;
    this.r = this.g = this.b = Math.floor(Math.random()*100)+100;
    this.level = (this.r - 100)%layerImages.length;
    if ( Math.round(Math.random())){
        this.r = this.r.toString(16);
        this.g = (this.g/2).toString(16);
        this.b = "00";
        this.r = (this.r.length == 1 ? "0" + this.r : this.r);
        this.g = (this.g.length == 1 ? "0" + this.g : this.g);
        this.color = "#"+this.r+this.g+this.b;
    } else {
        this.color = this.r.toString(16);
        this.color = (this.color.length == 1 ? "0" + this.color : this.color);
        this.color = "#"+this.color+this.color+this.color;
    }
    this.targettedLength = Math.floor(Math.random()*30+20);
}

function drawLines() {
    requestAnimationFrame(drawLines);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context_offscreen.clearRect(0, 0, canvas.width, canvas.height);
    for(i=0,lines=Lines.length; i<lines; i++){
        var line = Lines[i];
        for(j=0, dots=line.dots.length; j<dots; j++){
            line.dots[j].move();
        }
        for (var iterations = 0; iterations < relaxationIterations; iterations++) {
            for(j=1, dots=line.dots.length; j<dots; j++) {
                var dx = line.dots[j].x - line.dots[j-1].x;
                var dy = line.dots[j].y - line.dots[j-1].y;
                var targettedLength = line.targettedLength;
                var dstFrom = Math.sqrt(dx * dx + dy * dy);
                if (dstFrom > targettedLength && dstFrom != 0) {
                    line.dots[j].x -= (dstFrom - targettedLength) * (dx / dstFrom) * 0.5;
                    line.dots[j].y -= (dstFrom - targettedLength) * (dy / dstFrom) * 0.5;
                }
            }
        }
    }
    for (l = 0, k =layers.length; l<k; l++){
        context_offscreen.drawImage(layers[l], clip_x_start, clip_y_start, clip_x_width, clip_y_width, 0, 0, window.innerWidth, window.innerHeight );
        for(i=0,lines=Lines.length; i<lines; i++){
            var line = Lines[i];
            if (line.level == l){
                var x = Math.round(line.dots[0].x);
                var y = Math.round(line.dots[0].y);
                context_offscreen.strokeStyle=line.color;
                context_offscreen.beginPath();
                context_offscreen.moveTo(x,y);
                for(j=1, dots=Lines[i].dots.length; j<dots; j++) {
                    var x = Math.round(line.dots[j].x);
                    var y = Math.round(line.dots[j].y);
                    context_offscreen.lineTo(x,y);
                }
                context_offscreen.stroke();
            }
        }
    }
    context.drawImage(canvas_offscreen, 0, 0);
}

function resize(){
    container_width = parseInt(window.getComputedStyle(container).getPropertyValue('width'));
    container_height = parseInt(window.getComputedStyle(container).getPropertyValue('height'));
    canvas.width = container_width;
    canvas.height = container_height;
    canvas_offscreen.width = container_width;
    canvas_offscreen.height = container_height;
    window_aspect = window.innerWidth / window.innerHeight;
    
    if ( window_aspect > image_aspect ){
        clip_x_start = 0;
        clip_y_start = ((window.innerWidth / image_aspect)-window.innerHeight)/2;
        clip_x_width = image_width;
        clip_y_width = window.innerHeight*(image_width/window.innerWidth);
    } else {
        clip_x_start = ((window.innerHeight*image_aspect)-window.innerWidth)/2;
        clip_y_start = 0;
        clip_x_width = image_height*window_aspect;
        clip_y_width = image_height;
    }
}

function getMouseXY(e) {
    if (IE) { // grab the x-y pos.s if browser is IE
        mouseX = event.clientX + document.body.scrollLeft
        mouseY = event.clientY + document.body.scrollTop
    } else {  // grab the x-y pos.s if browser is NS
        mouseX = e.pageX
        mouseY = e.pageY
    }
    // catch possible negative values in NS4
    if (mouseX < 0){mouseX = 0}
    if (mouseY < 0){mouseY = 0}

    if (oldX == 0) oldX = mouseX;
    if (oldY == 0) oldY = mouseY;

    speedx = mouseX-oldX;
    speedy = mouseY-oldY;

    oldX = mouseX;
    oldY = mouseY;

    for(i=0, lines = Lines.length; i<lines; i++){
        line = Lines[i];
        for(j=0, dots=line.dots.length; j<dots; j++){
            dot = line.dots[j];
            dotx = dot.x;
            doty = dot.y;
            a = dotx-mouseX;
            b = doty-mouseY;
            var distance = Math.sqrt(a * a + b * b);
            var forcex = (speedx*2)/distance;
            var forcey = (speedy*2)/distance;
            dot.bump(forcex, forcey);
        }
    }
}

function shake(event){
    forcex = event.acceleration.x;
    forcey = event.acceleration.z;
    //var acceleration_z = event.acceleration.z;
    console.log(forcex);
    for(i=0, lines = Lines.length; i<lines; i++){
        line = Lines[i];
        for(j=0, dots=line.dots.length; j<dots; j++){
            line.dots[j].bump(forcex, forcey);
        }
    }
}

function preloader(imagesArray, callBack){
    var imageObj = new Image();
    imageObj.onload = function() {
        if(layers.length == 0){
            image_width = this.width;
            image_height = this.height;
            image_aspect = this.width / this.height;
            window_aspect = window.innerWidth / window.innerHeight;
            if ( window_aspect > image_aspect ){
                clip_x_start = 0;
                clip_y_start = ((window.innerWidth / image_aspect)-window.innerHeight)/2;
                clip_x_width = image_width;
                clip_y_width = window.innerHeight*(image_width/window.innerWidth);
            } else {
                clip_x_start = ((window.innerHeight*image_aspect)-window.innerWidth)/2;
                clip_y_start = 0;
                clip_x_width = image_height*window_aspect;
                clip_y_width = image_height;
            }
        }
        layers.push(this);
        if (imagesArray.length){
            preloader(imagesArray, callBack);
        } else {
            callBack();
        }
    };
    imageObj.src = imagesArray.shift();
}

function init(){
    container_width = window.innerWidth;
    container_height = window.innerHeight;

    context.canvas.width = container_width;
    context.canvas.height = container_height;

    context_offscreen.canvas.width = container_width;
    context_offscreen.canvas.height = container_height;

    container.appendChild(canvas);

    for (lines = 0; lines<particles; lines++){
        var squigle = Array(); 
        var squiglex = Math.floor(Math.random()*container_width);
        var squigley = Math.floor(Math.random()*container_height);
        for (i=0; i<(Math.round(Math.random()*4)+2); i++){
            var x = Math.floor(Math.random()*100)+squiglex;
            var y = Math.floor(Math.random()*100)+squigley;
            squigle.push(new Dot(x,y));
        }
        Lines.push(new Path(squigle));
    }

    // If NS -- that is, !IE -- then set up for mouse capture
    if (!IE) document.captureEvents(Event.MOUSEMOVE)
    //start drawing
    
    // add event listeners
   // if (window.DeviceMotionEvent) {
   //     window.addEventListener('devicemotion', shake, false);
   // } else {
        window.addEventListener('mousemove', getMouseXY, false );
   // };
    window.addEventListener('resize', resize, false);
    preloader(layerImages, function(){drawLines()});
}

init();