;(function($) {
  
  $.fn.treddiSlide = function(mode, options, callback) {
    
    if(typeof options == 'function') {
      callback = options;
      options = null;
    }
    opts = $.extend({}, $.fn.treddiSlide.defaults, options);
    
    switch (mode) {
      case 'rotateLeft':
        axe = 'y';
        verso = 1;
        polygons = p1.concat(p5,p6,p2); break;
      case 'rotateRight':
        axe = 'y'
        verso = -1;
        polygons = p4.concat(p0,p3,p7); break;
      case 'rotateUp':
        axe = 'x'
        verso = 1;
        polygons = p3.concat(p2,p6,p7); break;
      case 'rotateDown':
        axe = 'x'
        verso = -1;
        polygons = p4.concat(p5,p1,p0); break;
    }
    
    //eseguo il codice per ogni elemento che trovo
    return this.each(function() {
      // setup
      o = this;
      $o = $(this);
      init();
      // draws the shape, useful if auto position o dimension fails
      onlyShape(false);
      
      if (mode != 'debug') {
        // start the rotation
        cb = callback;
        $('#'+solid.id).fadeIn('slow', function() {
          $o.css('visibility','hidden'); begin(); });
      }
    });
  };
  
  // plugin defaults
  $.fn.treddiSlide.defaults = {
    left: null,
    top: null,
    width: null,
    height: null,
    perspective: 400,         // {0 <-> 1500}
    light: 1.8,               // intensity of darkness {1.0 <-> 2.0}
    de_v: 150,                // decelleration (works with refresh)
    refresh: 30              // [ms] interval of redraw
  };
  
  // private functions and variables
  var t, canvas, ctx, counter, verso, opts, o, $o, cb = function(){},
      solid = {}, polygons, polygons_rot, rot, axe;
  var do_run = false;
  
  // the 8 points [x,y,z]
  var p0 = [-1,1,1],  p1 = [1,1,1],  p2 = [1,-1,1],  p3 = [-1,-1,1],
      p4 = [-1,1,-1], p5 = [1,1,-1], p6 = [1,-1,-1], p7 = [-1,-1,-1];
  
  function init() {
    // calculate all solid variables
    solid.fill_color = $o.css('background-color') || 'rgb(255,255,255)';
    solid.fill_color = (solid.fill_color.substring(4, solid.fill_color.length-1)).split(', ');
    solid.fill_color_hsb = rgbToHsb(solid.fill_color);
    solid.border_color = $o.css('border-left-color') || 'rgb(255,255,255)';
    solid.border_thick = $o.css('border-left-width') || 0;
    solid.border_thick = parseInt((solid.border_thick));
    solid.id = 'ts'+Math.round(Math.random()*1000);
    
    solid.width = opts.width || $o.width() + parseInt($o.css('padding-left'),10) + parseInt($o.css('padding-right'),10);
    solid.height = opts.height || $o.height() + parseInt($o.css('padding-top'),10) + parseInt($o.css('padding-bottom'),10);
    // bisogna vedere come si comporta IE... esiste anche $(elem).outerWidth() che da la somma di tutto (bordi, marine, padd...)
    solid.position = $o.position();
    
    var p = opts.perspective + solid.border_thick;
    var r = solid.width / solid.height;
    if (axe == 'y') {
      solid.w = solid.d = (-solid.width/2 * p) / (-solid.width/2 - p);
      solid.h = solid.w / r;
    } else {
      solid.h = solid.d = (-solid.height/2 * p) / (-solid.height/2 - p);
      solid.w = solid.h * r;
    }
    // calculate max solid dimensions
    solid.max_w = (solid.width/2 * opts.perspective)/(opts.perspective - solid.width/2);
    solid.max_w = Math.round(solid.max_w) * 2 + 4;
    solid.max_h = (solid.height/2 * opts.perspective)/(opts.perspective - solid.height/2);
    solid.max_h = Math.round(solid.max_h) * 2 + 4;
    
    // create canvas element
    $o.parent().append('<canvas height="'+solid.max_h+'" width="'+solid.max_w+'" id="'+solid.id+'" class="ts_stage"></canvas>');
    canvas = document.getElementById(solid.id);
    // if the browser does not support canvas stop
    if (!canvas.getContext) { $('#'+solid.id).remove(); return; }
    ctx = canvas.getContext('2d');
    
    // calcolo la posizione dell'elemento
    if ($o.parent().css('position') != 'absolute' || $o.parent().css('position') != 'relative') { $o.parent().css('position', 'relative') }
    solid.xadd = opts.left || solid.position.left - Math.floor((solid.max_w-solid.width)/2) + solid.border_thick;
    solid.yadd = opts.top || solid.position.top - Math.floor((solid.max_h-solid.height)/2) + solid.border_thick;
    $('#'+solid.id).css({ 'top': solid.yadd+'px',
                          'left': solid.xadd+'px',
                          'display': 'none' });
    
    solid.xadd = (solid.max_w/2);
    solid.yadd = (solid.max_h/2);
  }
  
  function begin() {
    polygons = polygons.concat(p0, p1, p2, p3);
    
    for(var i=0, k=polygons.length; i<k; i+=3) {
      polygons[i] = polygons[i] * solid.w;
      polygons[i+1] = polygons[i+1] * solid.h;
      polygons[i+2] = polygons[i+2] * solid.d;
    }
    polygons_rot = new Array(polygons.length);
    // reset other variables and run
    counter = rot = 0;
    do_run = true;
    clearInterval(t); //just to be safe
    t = setInterval(draw, opts.refresh);
  }
  
  // main function, it calculate the point coords
  // inspiration by Marcus Engene (thanks)
  function draw(){
    counter++;
    if (!do_run || Math.cos(rot) < 0) { clearInterval(t); onlyShape(true); return } // interrupt
    
    for(var i=0, k=polygons.length; i<k; i+=3) {
      var x = polygons[i+0], y = polygons[i+1], z = polygons[i+2];
      
      if (axe == 'y') { // xzrot
        polygons_rot[i+0] = Math.cos(rot) * x - Math.sin(rot) * z;
        polygons_rot[i+1] = y; 
        polygons_rot[i+2] = Math.cos(rot) * z + Math.sin(rot) * x;
      } else { // yzrot
        polygons_rot[i+0] = x; 
        polygons_rot[i+1] = Math.cos(rot) * y + Math.sin(rot) * z;
        polygons_rot[i+2] = Math.cos(rot) * z - Math.sin(rot) * y;
      }
      // perspective
      x = polygons_rot[i+0];
      y = polygons_rot[i+1];
      z = polygons_rot[i+2];
      polygons_rot[i+0] = (x * opts.perspective) / (opts.perspective - z);
      polygons_rot[i+1] = (y * opts.perspective) / (opts.perspective - z);
      polygons_rot[i+2] = z;
    }
    // increment rotation variable
    rot += verso * (0.04 + Math.abs(Math.cos(rot))/opts.de_v);
    //clear the canvas
    ctx.clearRect(0, 0, solid.max_w, solid.max_h);
    ctx.fillStyle = "rgb("+solid.fill_color[0]+","+solid.fill_color[1]+","+solid.fill_color[2]+")";
    
    for (var i=0, k=polygons_rot.length; i<k; i+=12) {
      // find the distance between same cood of two points (x0 and x1) or (y0 and y3)
      var n = (axe == 'y')? (polygons_rot[i] - polygons_rot[i+3]) * -100/(solid.width):
                            (polygons_rot[i+1]-polygons_rot[i+10])* 100 /(solid.height);
      // if the face is still visible
      if (n > 0) {
        //n = 100 * (n + 10/options.light) / (10 + n) + 2*options.light;
        //n = Math.pow(options.light, 1 + n / 100) * 100 / Math.pow(options.light, 2);
        //n = n + options.light;
        //n = fill_color_hsb[2] * (n + 10/options.light) / (10 + n) + fill_color_hsb[2]/(options.light*2);
        n = solid.fill_color_hsb[2] - 100 / Math.pow(n,1/opts.light) + opts.light*5;
        var intensity = (n < 0) ? 0 : n;
        var fill_color_temp = rgbToHsb(solid.fill_color);
        fill_color_temp[2] = intensity;
        fill_color_temp = hsbToRgb(fill_color_temp);
        
        ctx.fillStyle = "rgba("+fill_color_temp[0]+","+fill_color_temp[1]+","+fill_color_temp[2]+",1)";
        ctx.lineWidth = solid.border_thick;
        ctx.strokeStyle = solid.border_color;
        ctx.beginPath();
        ctx.moveTo(polygons_rot[i] + solid.xadd, polygons_rot[i+1] + solid.yadd);
        ctx.lineTo(polygons_rot[i+3] + solid.xadd, polygons_rot[i+3+1] + solid.yadd);
        ctx.lineTo(polygons_rot[i+6] + solid.xadd, polygons_rot[i+6+1] + solid.yadd);
        ctx.lineTo(polygons_rot[i+9] + solid.xadd, polygons_rot[i+9+1] + solid.yadd);
        ctx.lineTo(polygons_rot[i] + solid.xadd, polygons_rot[i+1] + solid.yadd);
        ctx.fill();
        ctx.stroke();
      }
    }
    
  }
  
  function onlyShape(f) {
    var w = Math.round(solid.width/2) + solid.border_thick/2;
    var h = Math.round(solid.height/2) + solid.border_thick/2;
    ctx.clearRect(0, 0, solid.max_w, solid.max_h); //clear the canvas
    ctx.fillStyle = "rgb("+solid.fill_color[0]+","+solid.fill_color[1]+","+solid.fill_color[2]+")";
    ctx.lineWidth = solid.border_thick;
    ctx.strokeStyle = solid.border_color;
    ctx.beginPath();
    ctx.moveTo(-w + solid.xadd, h + solid.yadd);
    ctx.lineTo(w + solid.xadd, h + solid.yadd);
    ctx.lineTo(w + solid.xadd, -h + solid.yadd);
    ctx.lineTo(-w + solid.xadd, -h + solid.yadd);
    ctx.lineTo(-w + solid.xadd, h + solid.yadd);
    ctx.fill();
    ctx.stroke();
    if (f) {
      $o.css('visibility','visible');
      cb.call(o); // The callback
      $('#'+solid.id).fadeOut('slow', function(){ $(this).remove(); });
    } else {
      $('#'+solid.id).show();
    }
  }
  
  
  // Helper functions
  function rgbToHsb(rgb){
    var red = rgb[0], green = rgb[1], blue = rgb[2],
        hue, saturation, brightness,
        max = Math.max(red, green, blue), min = Math.min(red, green, blue),
        delta = max - min;
    brightness = max / 255;
    saturation = (max !== 0) ? delta / max : 0;
    if (saturation === 0){
      hue = 0;
    } else {
      var rr = (max - red) / delta,
          gr = (max - green) / delta,
          br = (max - blue) / delta;
      if (red == max) { hue = br - gr; }
      else if (green == max) { hue = 2 + rr - br; }
      else { hue = 4 + gr - rr };
      hue /= 6;
      if (hue < 0) { hue++; }
    }
    return [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100)];
  }
  
  function hsbToRgb(hsb){
    var br = Math.round(hsb[2] / 100 * 255);
    if (hsb[1] === 0){
      return [br, br, br];
    } else {
      var hue = hsb[0] % 360;
      var f = hue % 60;
      var p = Math.round((hsb[2] * (100 - hsb[1])) / 10000 * 255);
      var q = Math.round((hsb[2] * (6000 - hsb[1] * f)) / 600000 * 255);
      var t = Math.round((hsb[2] * (6000 - hsb[1] * (60 - f))) / 600000 * 255);
      switch (Math.floor(hue / 60)){
        case 0: return [br, t, p];
        case 1: return [q, br, p];
        case 2: return [p, br, t];
        case 3: return [p, q, br];
        case 4: return [t, p, br];
        case 5: return [br, p, q];
        default: return [br, br, br];
      }
    }
  }
  
})(jQuery);