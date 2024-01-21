

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
    
    if (ix1 < 0 || ix1 > altitude.length - 1 ||
        ix2 < 0 || ix2 > altitude.length - 1 ||
        iy1 < 0 || iy1 > altitude[0].length - 1 ||
        iy2 < 0 || iy2 > altitude[0].length - 1) {
        return { z: 0, y: 0, x: 0 };
    }
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
    this.textInfo.setAttribute('color', 'green');
    this.textInfo.setAttribute('position', '0 -0.1 0.1'); // Slightly in front of the parent entity
    this.textInfo.setAttribute('scale', '1 1 1'); // Slightly in front of the parent entity
    this.el.appendChild(this.textInfo);
    
    var bgplane = document.createElement('a-plane');
    bgplane.setAttribute('position', '4 -0.25 -0.3'); // Below the text
    bgplane.setAttribute('width', '9'); // Assuming full width
    bgplane.setAttribute('height', '0.8'); // 10% of the height
    bgplane.setAttribute('color', '#AAAAAA');
    bgplane.setAttribute('material', 'opacity: 0.8');
    this.el.appendChild(bgplane);
    // Create the white plane
    var plane = document.createElement('a-plane');
    plane.setAttribute('position', '4 -0.5 0'); // Below the text
    plane.setAttribute('width', '8'); // Assuming full width
    plane.setAttribute('height', '0.3'); // 10% of the height
    plane.setAttribute('color', '#44FF44');
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
 
      // Check if the intersected entity is the flow_map
      if (intersectedEl.id === 'flow_map_caster') {
        // Get the intersection detail
        var intersectionDetail = raycasterEl.getIntersection(intersectedEl);

        if (intersectionDetail) {
          // Intersection point with the flow_map
          var intersectionPoint = intersectionDetail.point;
         
          this.flow_tracer.injectParticleXY(intersectionPoint);
          // Handle your specific logic here
          // ...
        }
      }
    }
  }
},
    setControlled: function(tcomp) {

        this.flow_tracer = tcomp;
        
        this.flow_tracer.update_info("Waiting initialisation");
    },

  update: function () {
    var data = this.data;
    var el = this.el;

  }
});

AFRAME.registerComponent('flow-tracer', {
    
    schema: {
        number_of_particles: {type: 'number', default: 5000},
        integration_step : {type: 'number', default: 10 },
        target_advect_per_s : {type: 'number', default: 30 },
        trail_length: {type: 'number', default: 100},
        flowTracerSpeed: {type: 'number', default: 100},
        raycast_plane: {type: 'boolean', default: true},
        scale: {type: 'number', default: 100000},
        
        
        datafile: {type: 'string', default: "none"},
        demFile: {type: 'string', default: "none"},
        demColumns: {type: 'number', default: 10}, 
        demLines: {type: 'number', default: 10},
        demMax: {type: 'number', default: 10},
        demTexture: {type: 'string', default: "none"},
        dataPointResolution: {type: 'number', default:100}, // one point equals 1000 meters by default

        verticalExageration: {type: 'number', default: 1}
    },
    
    
    init: function() {
    
    this.resolution  = this.data.scale; // one real meter equals this.data.scale meters
    this.dataPointResolution = this.data.dataPointResolution;
    this.maxAltitude = this.data.demMax;
    this.extents = {width: (this.data.demColumns*this.dataPointResolution)/this.resolution,
                    height: (this.data.demLines*this.dataPointResolution)/this.resolution}
        ;
    this.origin = {x: -(this.extents.width/2),
           y :-(this.extents.height/2)
          };
    
    this.zScaleFactor = this.data.verticalExageration/65536; // data is scaled onver utin16 max value = 2**16 = 65536
        
    console.log("Inited Loaded ",this.origin ,this.extents, this.zScaleFactor , this.data.zScaleFactor  );
      // Create terrain entity
    var terrainEntity = document.createElement('a-entity');
    terrainEntity.setAttribute('terrain-model', `map: ${this.data.demTexture}; dem: ${this.data.demFile}; planeWidth: ${this.extents.width}; planeHeight: ${this.extents.height}; segmentsWidth: ${+this.data.demColumns - 1}; segmentsHeight: ${+this.data.demLines - 1}; zPosition: ${this.data.verticalExageration}; wireframe: false`);

    // Conditionally set ID based on raycast_plane
    if (this.data.raycast_plane) {
        // If raycast_plane is true, create and append raycasting plane
        var raycastingPlane = document.createElement('a-entity');
        raycastingPlane.setAttribute('id', 'flow_map_caster');
        raycastingPlane.setAttribute('geometry', `primitive: plane; width: ${this.extents.width}; height: ${this.extents.height}`);
        raycastingPlane.setAttribute('material', 'color: blue; side: double; transparent: true; opacity: 0.0');
        raycastingPlane.setAttribute('position', `0 ${this.zScaleFactor*(this.maxAltitude-this.maxAltitude/400)} 0`);
        raycastingPlane.setAttribute('rotation', '-90 0 0');
        raycastingPlane.classList.add('raycastable');

        this.el.appendChild(raycastingPlane);
    } else {
        // If raycast_plane is false, set ID to terrainEntity
        terrainEntity.setAttribute('id', 'flow_map_caster');
        terrainEntity.classList.add('raycastable');
    }

    this.el.appendChild(terrainEntity);
        
        
        
        
    this.isStopped = true;
    this.text_tracker = null;
    this.hand_control = null;
        
    fetch(this.data.datafile)
        .then(response => {
            if (!response.ok) {
                throw new Error('Réseau ou réponse non valide.');
            }
            return response.blob();
        })
        .then(blob => JSZip.loadAsync(blob))
        .then(zip => {
            // Remplacez 'nomfichier.json' par le nom de votre fichier JSON à l'intérieur du ZIP
  
            return zip.file('data.json').async('string');
        })
        .then(content => {
            
            // Créer une copie profonde des données JSON
            this.data2D = JSON.parse(content);
        
            this.data2D.origin = this.origin;
            this.data2D.extents = this.extents;
            this.timeIndices = Object.keys(this.data2D.data);
            this.tickTimeDelta = 0;
            this.tickTime = 0;
            console.log("Data unzipped load" + this.data2D.altitude[10][10]);
        
            for (var i = 0; i < this.data2D.altitude.length ; i += 1) {
                for (var j = 0; j < this.data2D.altitude[0].length ; j += 1) {
                    this.data2D.altitude[i][j] =  (this.data2D.altitude[i][j] ) * this.zScaleFactor + (this.zScaleFactor/20);
                }
            }
            console.log("Data unzipped after" + this.data2D.altitude[10][10]);
            this.pointsGeometry = new THREE.BufferGeometry();
            this.trail_length = this.data.trail_length;
            this.flowTracerSpeed = this.data.flowTracerSpeed;
            this.cMaxAps =   1000.0/this.data.target_advect_per_s;
            this.speedups_values = [-3600*24*7,-3600*24*2,-3600*24,-3600*3,-3600, -60, 0, 60, 3600, 3600*3, 3600*24,3600*48,3600*24*7];
            this.speedups_text = ["a week back","2 days back","a day back","3 hours back","an hour back", "a minute back", "nothing", "a minute", "an hour", "3 hours", "a day","2 days","a week"];
            this.speedup_index = 6;
        
            this.sim_speedup = this.speedups_values[this.speedup_index];
        
            this.time_step_ms = this.sim_speedup*this.cMaxAps;
        
            this.currentAdvDuration = 0;
        
            
            this.integration_step  = this.data.integration_step;
            this.number_of_particles = this.data.number_of_particles;
            this.initial_time = this.timeIndices[0];
            this.end_time = this.timeIndices[this.timeIndices.length-1];
            this.timeIndices_delta = this.timeIndices[1]-this.timeIndices[0];
            this.current_time = this.timeIndices[0];
            this.timeIndex1 = this.initial_time;
            this.timeIndex2 = +this.initial_time+ +this.timeIndices_delta;
            this.value_bounds = this.data2D.value_bounds;
            this.rIndices = 1;
            console.log(this.initial_time+" Data Loaded "+this.timeIndex2);
            this.shootOK = true;
            this.lastShootOK = 0;
            this.trail_index = 0;

            this.positions = new Float32Array(this.number_of_particles * 4); // 4 vertices per point
            this.ages = new Float32Array(this.number_of_particles); // next update time
            this.trail = new Float32Array(this.number_of_particles * 4 * this.trail_length); // 3 vertices per point
            this.trailvalues = new Float32Array(this.number_of_particles * 1 * this.trail_length); // 3 vertices per point
        

        
        
            var maxOverallSpeed = Math.max(
                Math.sqrt(Math.pow(this.value_bounds.U[0], 2) + Math.pow(this.value_bounds.V[0], 2)),
                Math.sqrt(Math.pow(this.value_bounds.U[0], 2) + Math.pow(this.value_bounds.V[1], 2)),
                Math.sqrt(Math.pow(this.value_bounds.U[1], 2) + Math.pow(this.value_bounds.V[0], 2)),
                Math.sqrt(Math.pow(this.value_bounds.U[1], 2) + Math.pow(this.value_bounds.V[1], 2))
            );
            console.log("MaxR is ",maxOverallSpeed);
            this.cflcondition = this.resolution/maxOverallSpeed;
            
            for (var i = 0; i < this.number_of_particles * 4; i += 4) {
                this.positions[i] = this.origin.x + Math.random() * this.extents.width;
                this.positions[i + 2] = this.origin.y + Math.random() * this.extents.height;

                rloc = interpolateAt(this.data2D, this.positions[i], this.positions[i+1],this.timeIndex1,this.timeIndex2,this.rIndices);
                this.positions[i + 1] = rloc.z;
                this.positions[i + 3] = 9999;
            }
            for (var i = 0; i < this.number_of_particles ; i += 1) {
                this.ages[i] =  Math.random() * +this.trail_length;
            }
            for (var itrail = 0; itrail < this.trail_length; itrail += 1) {
                var start_pi = itrail*this.number_of_particles * 4;
                  for (var i = 0; i < this.number_of_particles * 4; i += 4) {
                        this.trail[start_pi+i] = this.positions[i];
                        this.trail[start_pi+i + 1] = this.positions[i+1];
                        this.trail[start_pi+i + 2] = this.positions[i+2];
                        this.trail[start_pi+i + 3] = 1.0;//this.positions[i+3];
                        this.trailvalues[start_pi/4+i/4] = this.positions[i+3];
                    }
            }

            this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(this.trail, 4));
            this.pointsGeometry.setAttribute('colorIndex', new THREE.BufferAttribute(this.trailvalues, 1));

            var pointsMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    size: { value: 3},
                    minClampValue: { value: 0.0 }, // Define min clamp value
                    maxClampValue: { value: 100. }  // Define max clamp value
                },
                vertexShader: 
                `
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
                            return vec4(r, g, b, 1.0);
                        }
                        void main() { 

                            float indexFactor = clamp(vColorIndex, minClampValue, maxClampValue);
                            gl_FragColor = colormap(indexFactor); // Combines rgb with opacity
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
        
        
        
        
            this.number_of_inject = 1000;
            this.injected = new Float32Array(this.number_of_inject * 4); // 4 vertices per point
            for (var i = 0; i < this.number_of_inject * 4; i += 4) {
                this.injected[i] = this.origin.x ;
                this.injected[i + 2] = this.origin.y ;
                rloc = interpolateAt(this.data2D, this.injected[i], this.injected[i+1],this.timeIndex1,this.timeIndex2,this.rIndices);
                this.injected[i + 1] = rloc.z+1;
                this.injected[i + 3] = 1;
            }
        
        this.injectCount = 0;
        
            var injectMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    size: { value: 8 },
                    color: { value: new THREE.Color(1.0, 0.2, 0.2) } // Uniform for color
                },
                vertexShader: 
                `   uniform float size;
                    varying vec3 vPosition;
                    void main() {
                        vPosition = position;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = size ;//* (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: 
                `   uniform vec3 color;
                    varying vec3 vPosition;
                    void main() {
                        // Distance from the center of the point
                        vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
                        if (dot(circCoord, circCoord) > 1.0) {
                            // If the point is outside the circle, discard it
                            discard;
                        }
                        gl_FragColor = vec4(color, 1.0); // Use uniform color
                    }
                `,
                depthTest: true,
                transparent: true
            });
            
        
        
            this.injectGeometry = new THREE.BufferGeometry();
            this.injectGeometry.setAttribute('position', new THREE.BufferAttribute(this.injected, 4));
            this.injectPoints = new THREE.Points(this.injectGeometry, injectMaterial);
        this.injectPoints.frustumCulled = false;
            this.el.setObject3D('injections', this.injectPoints);
        
           this.isStopped = false;
      
        
       })
        .catch(error => console.error('Erreur lors du chargement du fichier JSON:', error));
     

    },
    
    getSimulationInfo: function() {
        var newSTR  = getDateTimeString(this.current_time);
    //    newSTR += "\nDt: "+(this.time_step_ms).toFixed(2);
        newSTR += " - One second is "+this.speedups_text[this.speedup_index];
        newSTR += "\nTracers : "+ this.injectCount+" on "+this.number_of_inject;
     //   newSTR += "\ndx: "+this.resolution;
    //    newSTR += "\nFPS "+(1000.0/this.tickTimeDelta).toFixed(2);
    //    newSTR += "\ntdelt "+(this.tickTimeDelta/1000.0).toFixed(2);
    //    newSTR += "\nTtime "+(this.currentAdvDuration).toFixed(2);
    //    newSTR += "\nIs "+(this.cMaxAps).toFixed(2);
        return newSTR;
    },
    
    injectParticleIJ: function(i,j) { 
    },
    injectParticleXY: function(intersectionPoint) { 
       //  console.log("Intersection point:", intersectionPoint, this.origin, this.extents);
        if (!this.shootOK){
            return;
        }
        if (this.injectCount >= this.number_of_inject){
            //this.injectCount = 0;
            return;
        }
        var NX = intersectionPoint.x  ;
        var NY = intersectionPoint.z ;
        if (NX < this.origin.x || NX > this.origin.x + this.extents.width ||
                NY < this.origin.y || NY > this.origin.y + this.extents.height) {
             return;
        }       
        
        rloc = interpolateAt(this.data2D, NX, NY,this.timeIndex1,this.timeIndex2,this.rIndices);  
        this.injected[this.injectCount*4] = NX;
        this.injected[this.injectCount*4 + 2] = NY;
        this.injected[this.injectCount*4 + 1] = rloc.z;
        this.injected[this.injectCount*4 + 3] = 1;
                 
        console.log("Injection at :", intersectionPoint, this.injected[this.injectCount*4], this.injected[this.injectCount*4 + 2]);
      
        this.injectCount += 1;
        this.shootOK = true;
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
        
        if (this.speedup_index < this.speedups_values.length-1){
            this.speedup_index = this.speedup_index+1;
        }
        this.sim_speedup = this.speedups_values[this.speedup_index]; 
    },
    speedDown: function() {
        if ( this.speedup_index > 0){
            this.speedup_index = this.speedup_index-1;
        }
        this.sim_speedup = this.speedups_values[this.speedup_index]; 
    },
    // Function to change the date/time
    changeDate: function(newTime) {
        this.current_time = newTime;
        // Additional logic to handle the change
    },
    
    tick: function(time, timeDelta) {
        if (!this.isStopped){
            
            this.currentAdvDuration += +timeDelta;
            if (this.currentAdvDuration < this.cMaxAps){
                return;
            }
            this.currentAdvDuration = 0;
            
            this.shootOK = true;
            
            
            this.tickTimeDelta = timeDelta;
            this.tickTime = time;
            this.time_step_ms = this.sim_speedup*this.cMaxAps;
            
        
            
            
            this.current_time = +this.current_time+ +this.time_step_ms;
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
            } 
            
            

            
            //for (var itrail = 0; itrail < this.trail_length; itrail += 1) 
            
            this.trail_index = this.trail_index+1;
            if(this.trail_index >=this.trail_length){
                this.trail_index = 0; 
            }

            
            
             for (var i = 0; i < this.injectCount * 4; i += 4) {
                rloc = interpolateAt(this.data2D, this.injected[i], this.injected[i+2],this.timeIndex1,this.timeIndex2,this.rIndices);  
                var NX = this.injected[i] + (rloc.u * +this.time_step_ms/1000.0 )/this.resolution;
                this.injected[i + 1] = rloc.z;
                var NY = this.injected[i + 2] + (rloc.v * +this.time_step_ms/1000.0 )/this.resolution;
                this.positions[i + 3] = Math.sqrt(rloc.v*rloc.v + rloc.u*rloc.u);
                
                if (this.injected[i] < this.origin.x || this.injected[i] > this.origin.x + this.extents.width ||
                        this.injected[i + 2] < this.origin.y || this.injected[i + 2] > this.origin.y + this.extents.height) {
                   //     this.injected[i] = this.origin.x + Math.random() * this.extents.width;
                        this.injected[i + 3] = 2;
                 }else{
                     if (this.positions[i + 3]>0){
                        this.injected[i] = NX;
                        this.injected[i + 2] = NY;
                     }
                 }
                 
                }
            
            
            
            
            
            for (var i = 0; i < this.number_of_particles * 4; i += 4) {
               
                rloc = interpolateAt(this.data2D, this.positions[i], this.positions[i+2],this.timeIndex1,this.timeIndex2,this.rIndices);  
                
                this.positions[i] += (rloc.u * this.cMaxAps* this.flowTracerSpeed )/this.resolution;
                this.positions[i + 2] += (rloc.v * this.cMaxAps * this.flowTracerSpeed )/this.resolution;


                /*if (this.trail_index == 0 ) {
                    this.positions[i] = origin.x + Math.random() * extents.width;
                    this.positions[i + 2] = origin.y + Math.random() * extents.height;
                }*/
                if (this.positions[i] < this.origin.x || this.positions[i] > this.origin.x + this.extents.width ||
                        this.positions[i + 2] < this.origin.y || this.positions[i + 2] > this.origin.y + this.extents.height) {

                        // Reset position within the bounds
                        this.positions[i] = this.origin.x + Math.random() * this.extents.width;
                        this.positions[i + 2] = this.origin.y + Math.random() * this.extents.height;
                 }


                rloc = interpolateAt(this.data2D, this.positions[i], this.positions[i+2],this.timeIndex1,this.timeIndex2,this.rIndices);
                this.positions[i + 1] = rloc.z;
                this.positions[i + 3] = Math.sqrt(rloc.v*rloc.v + rloc.u*rloc.u);
                while (this.positions[i + 3] < Math.random()*0.1 ) {
                    this.positions[i] = this.origin.x + Math.random() * this.extents.width;
                    this.positions[i + 2] = this.origin.y + Math.random() * this.extents.height;
                    rloc = interpolateAt(this.data2D, this.positions[i], this.positions[i+2],this.timeIndex1,this.timeIndex2,this.rIndices);
                    this.positions[i + 1] = rloc.z;
                    this.positions[i + 3] = Math.sqrt(rloc.v*rloc.v + rloc.u*rloc.u);
                }
            
                


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
                this.ages[i] += 1;
                if (this.ages[i] >  +this.trail_length ) {
                    this.positions[i*4] = this.origin.x + Math.random() * this.extents.width;
                    this.positions[i*4 + 2] = this.origin.y + Math.random() * this.extents.height;
                    this.ages[i] = 0;
                }
            }
            // Update the geometry
            this.injectGeometry.attributes.position.needsUpdate = true;
            this.pointsGeometry.attributes.position.needsUpdate = true;
            this.pointsGeometry.attributes.colorIndex.needsUpdate = true;
        }
    }
    
});