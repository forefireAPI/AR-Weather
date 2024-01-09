

function getDateTimeString(timeInMilliseconds) {
    // Create a new Date object using the provided timestamp
    
    const date = new Date(timeInMilliseconds);
    // Extract the day, month, year, hours, and minutes
    const day = date.getDate();
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Format the date and time strings
    const dateString = day + '/' + month + '/' + year;
    const timeString = (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;

    // Combine date and time into one string
    const dateTimeString = dateString + ' ' + timeString;

    return dateTimeString;
}

function interpolateAt(s_field, x, y,timeIndex1, timeIndex2, rIndices) {
    // Destructuring to get origin, extents, and altitude
    const { origin, extents, altitude } = s_field;

    // Accessing the U and V values for the specific time index
    const { U: U1, V: V1 } = s_field.data[timeIndex1];
    const { U: U2, V: V2 } = s_field.data[timeIndex2];
    //console.log(Object.keys(s_field.data));

    // Calculate indices and fractional parts for interpolation
    const fx = ((x - origin.x) / extents.width) * (altitude.length - 1);
    const fy = ((y - origin.y) / extents.height) * (altitude[0].length - 1);
    const ix1 = Math.floor(fx);
    const iy1 = Math.floor(fy);
    const ix2 = Math.min(ix1 + 1, altitude.length - 1);
    const iy2 = Math.min(iy1 + 1, altitude[0].length - 1);
    const fracX = fx - ix1;
    const fracY = fy - iy1;

    // Inline bilinear interpolation
    const interpolate = (matrix) => 
        (1 - fracX) * ((1 - fracY) * matrix[ix1][iy1] + fracY * matrix[ix1][iy2]) +
        fracX * ((1 - fracY) * matrix[ix2][iy1] + fracY * matrix[ix2][iy2]);

    return {
        z: interpolate(altitude),
        u: interpolate(U1)*rIndices+interpolate(U2)*(1-rIndices),
        v: interpolate(V1)*rIndices+interpolate(V2)*(1-rIndices)
    };
}    
function interpolate2DFiels(s_field, x, y,timeIndex) {
    // Destructuring to get origin, extents, and altitude
    const { origin, extents, altitude } = s_field;

    // Accessing the U and V values for the specific time index
    const { U, V } = s_field.data[timeIndex];
    
    //console.log(Object.keys(s_field.data));

    // Calculate indices and fractional parts for interpolation
    const fx = ((x - origin.x) / extents.width) * (altitude.length - 1);
    const fy = ((y - origin.y) / extents.height) * (altitude[0].length - 1);
    const ix1 = Math.floor(fx);
    const iy1 = Math.floor(fy);
    const ix2 = Math.min(ix1 + 1, altitude.length - 1);
    const iy2 = Math.min(iy1 + 1, altitude[0].length - 1);
    const fracX = fx - ix1;
    const fracY = fy - iy1;

    // Inline bilinear interpolation
    const interpolate = (matrix) => 
        (1 - fracX) * ((1 - fracY) * matrix[ix1][iy1] + fracY * matrix[ix1][iy2]) +
        fracX * ((1 - fracY) * matrix[ix2][iy1] + fracY * matrix[ix2][iy2]);

    return {
        z: interpolate(altitude),
        u: interpolate(U),
        v: interpolate(V)
    };
}


AFRAME.registerComponent('play-component', {
    schema: {
      color: { default: 'green' }
    },

    init: function () {
      var data = this.data;
      var el = this.el; // Reference to the element this component is attached to
      var defaultColor = el.getAttribute('material').color;
        console.log("new play comp");
      el.addEventListener('click', function () {
        el.setAttribute('material', 'color', data.color); // Change color on click
        var flowTracerComponent = document.getElementById('surface-current').components['flow-tracer'];
        if (flowTracerComponent) {
          flowTracerComponent.togglePlay(); // Toggle play
          console.log("Playing");
        }
      });

      // Reset color when not clicked
      el.addEventListener('mouseleave', function () {
        el.setAttribute('material', 'color', defaultColor);
      });
    }
});

AFRAME.registerComponent('text-info', {
  schema: {
    defaultText: { default: 'Default Text' },
    progress: { default: 0, type: 'number' } // Progress value for the red bar
  },

  init: function () {
    // Create the text entity
    this.textEl = document.createElement('a-text');
    this.textEl.setAttribute('value', this.data.defaultText);
    this.textEl.setAttribute('color', this.el.getAttribute('color') || 'black');
    this.textEl.setAttribute('position', '0 0 0.01'); // Slightly in front of the parent entity
    this.textEl.setAttribute('scale', '0.5 0.5 0.5'); // Slightly in front of the parent entity
    this.el.appendChild(this.textEl);

    this.textInfo = document.createElement('a-text');
    this.textInfo.setAttribute('value', "Info");
    this.textInfo.setAttribute('color', 'pink');
    this.textInfo.setAttribute('position', '-0.5 0 0.01'); // Slightly in front of the parent entity
    this.textInfo.setAttribute('scale', '1 1 1'); // Slightly in front of the parent entity
    this.el.appendChild(this.textInfo);
      
    // Create the white plane
    var plane = document.createElement('a-plane');
    plane.setAttribute('position', '4 -0.5 0'); // Below the text
    plane.setAttribute('width', '8'); // Assuming full width
    plane.setAttribute('height', '0.3'); // 10% of the height
    plane.setAttribute('color', '#FFFFFF');
    plane.setAttribute('material', 'opacity: 0.5');
    this.el.appendChild(plane);

    // Create the red bar
    this.bar = document.createElement('a-plane');
    this.bar.setAttribute('position', '4 -0.5 0'); // Start at the left, in front of the white plane
    this.bar.setAttribute('width', '0.1'); // Width of the bar
    this.bar.setAttribute('height', '0.3');
    this.bar.setAttribute('color', 'red');
    this.el.appendChild(this.bar);

    // Update the position of the red bar based on progress
    this.set_progress(this.data.progress);
  },

  update: function (oldData) {
    // Update text and progress
    var textEl = this.el.children[0];
    if (oldData.defaultText !== this.data.defaultText) {
      textEl.setAttribute('value', this.data.defaultText);
    }
    if (oldData.progress !== this.data.progress) {
      this.set_progress(this.data.progress);
    }
  },

  set_progress: function (value) {
    // Calculate new position for the red bar based on progress
    var newPositionX =  8 * value;
    this.bar.setAttribute('position', {x: newPositionX, y: -0.5, z: 0.002});
    this.textEl.setAttribute('position', {x: newPositionX, y: -0.5, z: 0.003});
  },

  update_text: function (newText) {
    // Method to update the text
     this.el.children[0].setAttribute('value', newText);
  },
    
  update_info: function (newText) {
    // Method to update the text
     this.el.children[1].setAttribute('value', newText);
  }
});


// Pause Component
AFRAME.registerComponent('pause-component', {
    schema: {
      color: { default: 'red' }
    },

    init: function () {
      var data = this.data;
      var el = this.el; // Reference to the element this component is attached to
      var defaultColor = el.getAttribute('material').color;

      el.addEventListener('click', function () {
        el.setAttribute('material', 'color', data.color); // Change color on click
        var flowTracerComponent = document.getElementById('surface-current').components['flow-tracer'];
        if (flowTracerComponent) {
          flowTracerComponent.togglePause(); // Toggle pause
          console.log("Pausing");
        }
      });

        
      el.addEventListener('mouseleave', function () {
        el.setAttribute('material', 'color', defaultColor);
      });
    }
});

AFRAME.registerComponent('shoot-controls', {
  // dependencies: ['tracked-controls'],
  schema: {
    hand: { default: 'left' }
  },

  init: function () {
    var self = this;
    this.flow_tracer = null;
    this.onButtonChanged = this.onButtonChanged.bind(this);
  },

  play: function () {
    var el = this.el;
    el.addEventListener('buttonchanged', this.onButtonChanged);
  },

  pause: function () {
    var el = this.el;
    el.removeEventListener('buttonchanged', this.onButtonChanged);
  },

  mapping: {
    axis0: 'trackpad',
    axis1: 'trackpad',
    button0: 'trackpad',
    button1: 'trigger',
    button2: 'grip',
    button3: 'menu',
    button4: 'system'
  },

  onButtonChanged: function (evt) {
    var buttonId = evt.detail.id;
    var buttonStates = evt.detail.state;
    //this.flow_tracer.update_info(buttonId+" "+buttonStates);
      if (buttonId === 4 && buttonStates.pressed) {
      this.flow_tracer.speedUp();
      }
    if (buttonId === 5 && buttonStates.pressed) {
      this.flow_tracer.speedDown();
      }
    // Check if the trigger (button 1) is pressed
    if (buttonId === 0 && buttonStates.pressed) {
      this.handleTriggerPress();
    }
  },

  handleTriggerPress: function() {
  // Access the raycaster component
  var raycasterEl = this.el.components.raycaster;

  // Check if the raycaster is currently intersecting with any entities
  if (raycasterEl && raycasterEl.intersectedEls.length > 0) {
    // Iterate through intersected entities
    for (var i = 0; i < raycasterEl.intersectedEls.length; i++) {
      var intersectedEl = raycasterEl.intersectedEls[i];

          console.log("Intersection el:", intersectedEl);
      // Check if the intersected entity is the flow_map
      if (intersectedEl.id === 'flow_map_caster') {
        // Get the intersection detail
        var intersectionDetail = raycasterEl.getIntersection(intersectedEl);

        if (intersectionDetail) {
          // Intersection point with the flow_map
          var intersectionPoint = intersectionDetail.point;
          console.log("Intersection point:", intersectionPoint);

          // Handle your specific logic here
          // ...
        }
      }
    }
  }
},
    setControlled: function(tcomp) {

        this.flow_tracer = tcomp;
        
        this.flow_tracer.update_info("Press A or B");
    },

  update: function () {
    var data = this.data;
    var el = this.el;

  }
});

AFRAME.registerComponent('flow-tracer', {
    
    schema: {
        number_of_particles: {type: 'number', default: 15000},
        time_step: {type: 'number', default: 190800 },
        resolution : {type: 'number', default: 1200 },
        sim_speedup: {type: 'number', default: 3600 },
        integration_step : {type: 'number', default: 1000 },
        trail_length: {type: 'number', default: 100}
    },
    
    
    init: function() {
        
    this.isStopped = true;
    this.text_tracker = null;
    this.hand_control = null;
        
    fetch("timed.zip")
        .then(response => {
            if (!response.ok) {
                throw new Error('Réseau ou réponse non valide.');
            }
            return response.blob();
        })
        .then(blob => JSZip.loadAsync(blob))
        .then(zip => {
            // Remplacez 'nomfichier.json' par le nom de votre fichier JSON à l'intérieur du ZIP
            console.log("Data unzipped load");
            return zip.file('data.json').async('string');
        })
        .then(content => {
            
            // Créer une copie profonde des données JSON
            this.data2D = JSON.parse(content);

            this.timeIndices = Object.keys(this.data2D.data);
            this.tickTimeDelta = 0;
            this.tickTime = 0;

            this.pointsGeometry = new THREE.BufferGeometry();
            this.trail_length = this.data.trail_length;
            this.time_step = this.data.time_step;
                
            this.sim_speedup = this.data.sim_speedup;
                
            this.resolution  = this.data.resolution;
            this.integration_step  = this.data.integration_step;
            this.number_of_particles = this.data.number_of_particles;
            this.initial_time = this.timeIndices[0];
            this.end_time = this.timeIndices[this.timeIndices.length-1];
            this.timeIndices_delta = this.timeIndices[1]-this.timeIndices[0];
            this.current_time = this.timeIndices[0];
            this.timeIndex1 = this.initial_time;
            this.timeIndex2 = +this.initial_time+ +this.timeIndices_delta;
            
            this.rIndices = 1;
            console.log(this.initial_time+" Data Loaded "+this.timeIndex2);
            

        
            this.trail_index = 0;
            this.positions = new Float32Array(this.number_of_particles * 4); // 3 vertices per point
            this.trail = new Float32Array(this.number_of_particles * 4 * this.trail_length); // 3 vertices per point
            this.trailvalues = new Float32Array(this.number_of_particles * 1 * this.trail_length); // 3 vertices per point
            var origin = this.data2D.origin;
            var extents = this.data2D.extents;
        
        
            var maxOverallSpeed = Math.max(
                Math.sqrt(Math.pow(extents.U[0], 2) + Math.pow(extents.V[0], 2)),
                Math.sqrt(Math.pow(extents.U[0], 2) + Math.pow(extents.V[1], 2)),
                Math.sqrt(Math.pow(extents.U[1], 2) + Math.pow(extents.V[0], 2)),
                Math.sqrt(Math.pow(extents.U[1], 2) + Math.pow(extents.V[1], 2))
            );
            console.log("MaxR is ",maxOverallSpeed);
            this.cflcondition = this.resolution/maxOverallSpeed;
            
            for (var i = 0; i < this.number_of_particles * 4; i += 4) {
                this.positions[i] = origin.x + Math.random() * extents.width;
                this.positions[i + 2] = origin.y + Math.random() * extents.height;

                rloc = interpolateAt(this.data2D, this.positions[i], this.positions[i+1],this.timeIndex1,this.timeIndex2,this.rIndices);
                this.positions[i + 1] = rloc.z;
                this.positions[i + 3] = rloc.u;
            }
            for (var itrail = 0; itrail < this.trail_length; itrail += 1) {
                var start_pi = itrail*this.number_of_particles * 4;
                  for (var i = 0; i < this.number_of_particles * 4; i += 4) {
                        this.trail[start_pi+i] = this.positions[i];
                        this.trail[start_pi+i + 1] = this.positions[i+1];
                        this.trail[start_pi+i + 2] = this.positions[i+2];
                        this.trail[start_pi+i + 3] = this.positions[i+3];
                        this.trailvalues[start_pi/4+i/4] = this.positions[i+3];
                    }
            }

            this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(this.trail, 4));
            this.pointsGeometry.setAttribute('colorIndex', new THREE.BufferAttribute(this.trailvalues, 1));

            var pointsMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    size: { value: 3.},
                    minClampValue: { value: 0.0 }, // Define min clamp value
                    maxClampValue: { value: 100. }  // Define max clamp value
                },
                vertexShader: `
                    attribute float colorIndex;
                    uniform float size;
                    varying float vColorIndex;
                    void main() {
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1);
                        gl_PointSize = size ;
                        gl_Position = projectionMatrix * mvPosition;
                        vColorIndex = colorIndex;  
                    }
                `,
                fragmentShader: `
                        varying float vColorIndex;
                        uniform float minClampValue;
                        uniform float maxClampValue;
                        float colormap_red(float x) {
                            if (x < 100.0) {
                                return (-9.55123422981038E-02 * x + 5.86981763554179E+00) * x - 3.13964093701986E+00;
                            } else {
                                return 5.25591836734694E+00 * x - 8.32322857142857E+02;
                            }
                        }

                        float colormap_green(float x) {
                            if (x < 150.0) {
                                return 5.24448979591837E+00 * x - 3.20842448979592E+02;
                            } else {
                                return -5.25673469387755E+00 * x + 1.34195877551020E+03;
                            }
                        }

                        float colormap_blue(float x) {
                            if (x < 80.0) {
                                return 4.59774436090226E+00 * x - 2.26315789473684E+00;
                            } else {
                                return -5.25112244897959E+00 * x + 8.30385102040816E+02;
                            }
                        }
                        float colormap_alpha(float x) {
                            if (x < 120.0) {
                                return 51.0 + 1.709 * x;
                            } else {
                                return 255.0;
                            }
                        }

                        vec4 colormap(float x) {
                            float t = x * 255.0;
                            float r = clamp(colormap_red(t) / 255.0, 0.0, 1.0);
                            float g = clamp(colormap_green(t) / 255.0, 0.0, 1.0);
                            float b = clamp(colormap_blue(t) / 255.0, 0.0, 1.0);
                            float a = clamp(colormap_alpha(t) / 255.0, 0.0, 1.0);
                            return vec4(r, g, b, a);
                        }
                        void main() { 
                            float opacity = 1.0; 
                            float indexFactor = clamp(vColorIndex, minClampValue, maxClampValue);
                            vec4 colorWithAlpha = colormap(indexFactor); // Now expects a vec4
                            opacity = colorWithAlpha.a;
                            gl_FragColor = vec4(colorWithAlpha.rgb, opacity); // Combines rgb with opacity
                        }
                `,
                depthTest: true,
                transparent: true
            });
            

            // Set the uniforms for your shader material
            pointsMaterial.uniforms.minClampValue.value = 0;
            pointsMaterial.uniforms.maxClampValue.value = maxOverallSpeed;
            this.points = new THREE.Points(this.pointsGeometry, pointsMaterial);
            this.el.setObject3D('points', this.points);
           this.isStopped = false;
       })
        .catch(error => console.error('Erreur lors du chargement du fichier JSON:', error));
     

    },
    
    getSimulationInfo: function() {
        var newSTR  = getDateTimeString(this.current_time);
        newSTR += "\nDt: "+(this.time_step).toFixed(2);
        newSTR += "\nSpeedup: "+(this.sim_speedup).toFixed(2);
        newSTR += "\ndx: "+this.resolution;
        newSTR += "\nFPS "+(1000.0/this.tickTimeDelta).toFixed(2);
        newSTR += "\ntdelt "+(this.tickTimeDelta/1000.0).toFixed(2);
        newSTR += "\nTtime "+(this.tickTime).toFixed(2);
        newSTR += "\nIs "+(this.integration_step).toFixed(2);
        return newSTR;
    },
    
    injectParticleIJ: function(i,j) { 
    },
    injectParticleXY: function(x,y) { 
    },
    injectParticleLatLon: function(lat,lon) { 
    },
    setTextTracker: function(tcomp) {
        this.text_tracker = tcomp;
    },
    setHandControl: function(tcomp) {

        this.hand_control = tcomp;
        this.hand_control.setControlled(this);
    },
    update_info: function(new_text) {
        this.text_tracker.update_info(new_text);
    },
    // Play/Pause toggle function
    togglePlay: function() {
        this.isStopped = !this.isStopped;
    },
    togglePause: function() {
        this.isStopped = !this.isStopped;
    },
    // Play/Pause toggle function
    speedUp: function() {
        this.sim_speedup += +Math.abs(this.sim_speedup)/10.0+3600.0;
        console.log(this.time_step );
    },
    speedDown: function() {
        this.sim_speedup -= +Math.abs(this.sim_speedup)/10.0+3600.0;
        console.log(this.time_step );
    },
    // Function to change the date/time
    changeDate: function(newTime) {
        this.current_time = newTime;
        // Additional logic to handle the change
    },
    
    tick: function(time, timeDelta) {
        if (!this.isStopped){
            this.tickTimeDelta = timeDelta;
            this.tickTime = time;
            this.time_step = this.sim_speedup*timeDelta;
            
            this.current_time = +this.current_time+ +this.time_step;
            if(this.current_time > this.end_time){
                this.current_time = this.initial_time;
            }
            if(this.current_time < this.initial_time){
                this.current_time = +this.end_time- 1.0;
            }
            var rTime = (this.current_time - this.initial_time) / this.timeIndices_delta;
            
            // Calculate timeIndex1 and timeIndex2
            this.timeIndex1 = +this.initial_time + Math.floor(rTime) * this.timeIndices_delta;
            this.timeIndex2 = +this.timeIndex1 + +this.timeIndices_delta;

            // Calculate rIndices as the fractional part of rTime
            this.rIndices = 1-(rTime % 1);
        
            if (this.text_tracker != null){
                this.text_tracker.update_text(getDateTimeString(this.current_time));
                this.text_tracker.set_progress(rTime/this.timeIndices.length);
                this.update_info(this.getSimulationInfo());
            }else{
              //  console.log("No tracker");
            }
                
            //for (var itrail = 0; itrail < this.trail_length; itrail += 1) 
            
            this.trail_index = this.trail_index+1;
            if(this.trail_index >=this.trail_length){
                this.trail_index = 0; 
            }
            var origin = this.data2D.origin;
            var extents = this.data2D.extents;
            // Move the particle 
            for (var i = 0; i < this.number_of_particles * 4; i += 4) {
                rloc = interpolateAt(this.data2D, this.positions[i], this.positions[i+2],this.timeIndex1,this.timeIndex2,this.rIndices);  
                
                this.positions[i] += (rloc.u * timeDelta *20)/this.resolution;
                this.positions[i + 2] += (rloc.v * timeDelta *20)/this.resolution;


                if ((this.trail_index === 0 )|| (Math.random()>0.9)) {
                    //console.log(timeDelta)
                    this.positions[i] = origin.x + Math.random() * extents.width;
                    this.positions[i + 2] = origin.y + Math.random() * extents.height;
                }
                if (this.positions[i] < origin.x || this.positions[i] > origin.x + extents.width ||
                        this.positions[i + 2] < origin.y || this.positions[i + 2] > origin.y + extents.height) {

                        // Reset position within the bounds
                        this.positions[i] = origin.x + Math.random() * extents.width;
                        this.positions[i + 2] = origin.y + Math.random() * extents.height;
                 }


                rloc = interpolateAt(this.data2D, this.positions[i], this.positions[i+2],this.timeIndex1,this.timeIndex2,this.rIndices);
                
                while ((Math.abs(rloc.v)+Math.abs(rloc.u) < 0.01 )) {
                    //console.log(timeDelta)
                    this.positions[i] = origin.x + Math.random() * extents.width;
                    this.positions[i + 2] = origin.y + Math.random() * extents.height;
                    rloc = interpolateAt(this.data2D, this.positions[i], this.positions[i+2],this.timeIndex1,this.timeIndex2,this.rIndices);
                }
                

                this.positions[i + 1] = rloc.z;
                this.positions[i + 3] = Math.sqrt(rloc.v*rloc.v + rloc.u*rloc.u);
            }

            // handle the trail (update oldest position with newest)
            var start_pi = this.trail_index*this.number_of_particles * 4;
            for (var i = 0; i < this.number_of_particles * 4; i += 4) {
                this.trail[start_pi+i] = this.positions[i]  ;
                this.trail[start_pi+i+1] = this.positions[i + 1] ;
                this.trail[start_pi+i+2] = this.positions[i + 2] ;
                this.trail[start_pi+i+3] = this.positions[i + 3] ;
            }
            var start_piv = this.trail_index*this.number_of_particles;
            for (var i = 0; i < this.number_of_particles ; i += 1) {
                this.trailvalues[start_piv+i] = this.trail[start_pi+i*4+3];
            }
            // Update the geometry
            this.pointsGeometry.attributes.position.needsUpdate = true;
            this.pointsGeometry.attributes.colorIndex.needsUpdate = true;
        }
    }
    
});