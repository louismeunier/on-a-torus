import * as THREE from 'three';
import { torusCoordsToCartesian, sleep, roundObject, regularizeCoordinate, lockPanel } from './utils';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { distanceThreeD, linspace, torus_function } from './mathing';


// import Stats from 'three/addons/libs/stats.module.js';


let camera, scene, renderer, stats;

// ! Options
let trajectoryDrawn = false;
// ? how many points are plotted for a given trajectory
let trajectoryDistance = 5000;
// ? distance (sort of) between points in a trajectory (practically, a way to scale accuracy of trajectories)
let trajectoryGrain = 0.05;

let showAxes = false;
let showPoints = true;
let [ai, bi] = [Math.PI, Math.PI]


let p = 2,
q = 3;


const spheres = [],
    points = [],
    lines = [];

const TORUS_CENTRAL_RADIUS = 45,
    TORUS_TUBE_RADIUS = 20;
const SLEEP_TIME = 10;

// ! each entry should be a function from a torus-coordinate pair (theta1, theta2) which returns the derivative [dtheta1, dtheta2] at that point
// ! ...args represent arbitrary parameters
const OPTIONS = {
    "knot": ([an, bn], ...args) =>  [args[0], args[1]],
    "quasi": ([an, bn], ...args) => [args[0], args[1]],
    "coupled": ([an, bn], ...args) => [args[0] + args[2]*Math.sin(bn - an), args[1] + args[3]*Math.sin(an - bn)],
    "forced": ([an, bn], ...args) => [bn, 0.5 - Math.sin(an)]
}

let selectedOption = "knot";

init();
animate();

// ? Create scene and torus, setup event listeners for panels
function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 0, -80, 70 );


    let torusObject;
    const ambientLight = new THREE.AmbientLight( 0xcccccc, 1 );
    scene.add( ambientLight );
    const pointLight = new THREE.PointLight( 0xffffff, 2, 0, 0 );
    camera.add( pointLight );

    scene.add( camera );

    var material = new THREE.MeshPhongMaterial({
        specular: 0x999999,
        shininess: 7,
        opacity: 0.95,
        transparent: true});
      
    material.color = new THREE.Color("#AED0EA");

    torusObject = new THREE.Mesh(new THREE.TorusGeometry( TORUS_CENTRAL_RADIUS, TORUS_TUBE_RADIUS, 30, 100 ), material);

    torusObject.position.set(0,0,0);
      
    scene.add( torusObject );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );



    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 10;
    controls.maxDistance = 300;
    controls.maxPolarAngle = 2*Math.PI ;

    window.addEventListener( 'resize', onWindowResize );

    // ? utils
    const axesHelper = new THREE.AxesHelper( 10 );
    // scene.add( axesHelper );
    
    // ? init canvas
    initCanvas();

    // TODO add axes and such

    // ? init listeners
    document.getElementById("opacity").addEventListener("change", e => {
        torusObject.material.opacity = e.target.value
    })
    document.getElementById("toggle-mesh").addEventListener("click", e => {
        torusObject.material.wireframe=!torusObject.material.wireframe
    })

    document.getElementById("toggle-axes").addEventListener("click", e => {
        showAxes = !showAxes;
       !showAxes ? scene.remove(axesHelper): scene.add(axesHelper)
    })

    document.getElementById("draw-trajectory").addEventListener("click", drawTorusTrajectory)
    document.getElementById("trajectory-distance").addEventListener("change", e => {
        trajectoryDistance = e.target.value;
        document.getElementById("trajectory-distance-lab").innerText = `Distance (${trajectoryDistance})`;
    })

    document.getElementById("trajectory-grain").addEventListener("change", e => {
        trajectoryGrain = e.target.value;
        document.getElementById("trajectory-grain-lab").innerText = `Grain (${trajectoryGrain})`;
    })

    document.getElementById("show-points").addEventListener("change", e => {
        showPoints = e.target.checked;
    })

    // ? draw initial condition
    const [x0, y0, z0] = torusCoordsToCartesian(ai, bi, TORUS_CENTRAL_RADIUS, TORUS_TUBE_RADIUS)
    const initSphere = new THREE.Mesh( 
        new THREE.SphereGeometry( .7, 32, 16 ),
        new THREE.MeshBasicMaterial({ color: "red" })
    );
    initSphere.position.set(x0, y0, z0);
    scene.add( initSphere );

    document.getElementById("ivp-1").addEventListener("change", e => {
        ai = parseFloat(e.target.value);
        const [x0, y0, z0] = torusCoordsToCartesian(ai, bi, TORUS_CENTRAL_RADIUS, TORUS_TUBE_RADIUS);
        initSphere.position.set(x0, y0, z0);
        clearSquareMap();
        initialValueSquareMap();
    })
    document.getElementById("ivp-2").addEventListener("change", e => {
        bi = parseFloat(e.target.value);
        const [x0, y0, z0] = torusCoordsToCartesian(ai, bi, TORUS_CENTRAL_RADIUS, TORUS_TUBE_RADIUS);
        initSphere.position.set(x0, y0, z0);
        clearSquareMap();
        initialValueSquareMap();
    })

    // TODO: change all this to work more generally for arbitrary arguments
    // TODO: probably easiest to just have a big array of arguments rather than individually named ones; just listen to all inputs in each parameter panel
    document.getElementById("p").addEventListener("change", e => {
        p = e.target.value;
        document.getElementById("p-lab").innerText = `p (${p})`
        points.length=0;
    })
    document.getElementById("q").addEventListener("change", e => {
        q = e.target.value;
        document.getElementById("q-lab").innerText = `q (${q})`
        points.length=0;
    })

    // !
    document.getElementById("option-select").addEventListener("change", e => {
        console.log(e.target.value)
        selectedOption = e.target.value;

        document.querySelectorAll(".parameters-panel").forEach(pp => {
            if (pp.classList.contains(`${selectedOption}-pp`)) {
                pp.style.display = 'block'
            } else {
                pp.style.display = 'none'
            }
        })
    })
}

function initListeners() {
    const options = document.querySelectorAll(".parameters-panel input")
}

function initCanvas() {
    const canvas = document.getElementById("square-map");
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    canvas_arrow(ctx, 0, canvas.height/2, 0, canvas.height/2-0.1)
    ctx.stroke()
    ctx.beginPath();
    canvas_arrow(ctx, canvas.width, canvas.height/2, canvas.width, canvas.height/2-0.1)
    ctx.stroke()
    ctx.beginPath();
    canvas_arrow(ctx, canvas.width/2, 0, canvas.width/2+0.1, 0)
    ctx.stroke()
    ctx.beginPath();
    canvas_arrow(ctx, canvas.width/2, canvas.height, canvas.width/2+0.1, canvas.height)
    ctx.stroke()

    // on square map as well
    initialValueSquareMap();
}

var cylinderMesh = function( pointX, pointY )
{
    /* edge from X to Y */
    var direction = new THREE.Vector3().subVectors( pointY, pointX );
    var orientation = new THREE.Matrix4();
    /* THREE.Object3D().up (=Y) default orientation for all objects */
    orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
    /* rotation around axis X by -90 degrees 
     * matches the default orientation Y 
     * with the orientation of looking Z */
    orientation.multiply(new THREE.Matrix4(1,0,0,0,
                                            0,0,1,0, 
                                            0,-1,0,0,
                                            0,0,0,1));

    /* cylinder: radiusAtTop, radiusAtBottom, 
        height, radiusSegments, heightSegments */
    var edgeGeometry = new THREE.CylinderGeometry( .5, .5, direction.length(), 4, 1);
    var edge = new THREE.Mesh( edgeGeometry, 
            new THREE.MeshBasicMaterial( { color: "black" } ) );

    edge.applyMatrix4(orientation)
    const newPosition = new THREE.Vector3().addVectors( pointX, direction.multiplyScalar(0.5) )
    edge.position.set(newPosition.x, newPosition.y, newPosition.z);
    return edge;
}


// ? Draw trajectory on torus
async function drawTorusTrajectory() {
    if (trajectoryDrawn) {
        for (let i = 0; i < trajectoryDistance; i ++) {
            scene.remove(lines[i])
            scene.remove(spheres[i])
        }
        trajectoryDrawn = false;
        clearSquareMap();
        initCanvas();
        // initialValueSquareMap();
        document.getElementById("draw-trajectory").innerText = "꩜ Draw Trajectory";
        return;
    }

    // const lineMaterial = new THREE.LineBasicMaterial( { color: "black", linewidth: 4 } );
    // const lineMaterial = new MeshLineMaterial({ color: 'black', lineWidth: 1});
    const pointGeometry = new THREE.SphereGeometry( .7, 32, 16 ); 
    const pointMaterial = color => new THREE.MeshBasicMaterial({ color: color }); 

    lockPanel(true)

    // if (
    //     lines.length == 0 ||
    //      spheres.length == 0 || 
    //      trajectoryDistance != lines.length ||
    //      points.length == 0
    // ) {
        lines.length = 0;
        spheres.length = 0;

        document.getElementById("draw-trajectory").innerText = "꩜ Drawing Trajectory"

        // Initial condition
        let [a0,b0] = [ai, bi];
        // TODO: keep this plotted always
        // TODO: easiest would probably be to just not add it to the spheres array so it doesn't get deleted. Would then have to chnage it whenever initials change
        const [x0, y0, z0] = torusCoordsToCartesian(ai, bi, TORUS_CENTRAL_RADIUS, TORUS_TUBE_RADIUS)
        points.push(new THREE.Vector3(x0, y0, z0))
        let [an, bn] = [a0, b0];
        // spheres.push( initSphere );

        for (let i = 0; i < trajectoryDistance; i++) {
            // Function Definition (make changeable)
            // TODO: p:q torus knots
            // TODO: irrational slope/quasiperiodicity
            // TODO: coupled oscillations (strogatz) and more complex dynamics
            // an = an+p*0.01
            // bn = bn+q*0.01
            // an = an+0.01*Math.sin(bn-an)
            // bn = bn+0.01*Math.sin(an-bn)
            const [diff_an, diff_bn] = OPTIONS[selectedOption]([a0, b0], p, q);
            [an, bn] = [trajectoryGrain*diff_an+a0, trajectoryGrain*diff_bn+b0]
            // an = an+Math.E*trajectoryGrain
            // bn = bn+2*trajectoryGrain

            const [x,y,z] = torusCoordsToCartesian(an, bn, TORUS_CENTRAL_RADIUS, TORUS_TUBE_RADIUS);

            points.push(new THREE.Vector3(x, y, z))            
            // point
            if (showPoints) {
                const sphere = new THREE.Mesh( pointGeometry, pointMaterial('black') ); 
                sphere.position.set(x,y,z)
                scene.add(sphere);
                spheres.push(sphere)
            }

            drawSquareMap(a0%(2*Math.PI), b0%(2*Math.PI), an%(2*Math.PI), bn%(2*Math.PI))

            const lineMesh = cylinderMesh(...points.slice(-2))
            scene.add(lineMesh)
            lines.push(lineMesh)

            a0 = an;
            b0 = bn;
             // ! Stop once the system loops back on itself (sketchy)
             console.log(distanceThreeD(x, y, z, x0, y0, z0))
             if (distanceThreeD(x, y, z, x0, y0, z0) < 50*trajectoryGrain) {
                 lockPanel(false)
                 trajectoryDrawn = true;
                 document.getElementById("draw-trajectory").innerText = "╳ Clear Trajectory"
                 return
             }
            await sleep(SLEEP_TIME);
        }
        trajectoryDrawn = true;
        document.getElementById("draw-trajectory").innerText = "╳ Clear Trajectory";
        console.log("Cartesian Coordinates (x, y, z)")
        console.table({
            "initial": roundObject(points[0], 2), 
            "final": roundObject(points[points.length-1], 2)
        })
        console.log("Torus Coordinates (theta_1, theta_2)")
        console.table({
            "initial": roundObject([ai, bi], 2), 
            "final": roundObject([an, bn], 2)
        })
    // } else {
    //     document.getElementById("draw-trajectory").innerText = "Clear Trajectory";
    //     for (let i = 0; i < trajectoryDistance; i++) {
    //         scene.add(spheres[i]);
    //         scene.add(lines[i]);
    //         // TODO: redraw square
    //         // drawSquareMap(a0%(2*Math.PI), b0%(2*Math.PI), an%(2*Math.PI), bn%(2*Math.PI))
    //         await sleep(SLEEP_TIME);
    //     }
    //     trajectoryDrawn = true;
    // }

    lockPanel(false)
}


function canvas_arrow(context, fromx, fromy, tox, toy) {
    context.strokeStyle="#808080";
    var headlen = 10; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    // context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 7), toy - headlen * Math.sin(angle + Math.PI / 7));
    // context.stroke();
}

// ? Square map
function drawSquareMap(a0, b0, a1, b1) {
    const canvas = document.getElementById("square-map");
    const ctx = canvas.getContext("2d");
    // ctx.rect(a0_reg, b0_reg, 1, 1);
    if ((a1-a0) > 0 && (b1-b0) > 0) {
        const [a0_reg, b0_reg] = regularizeCoordinate(canvas.width, canvas.height, a0, b0);
        const [a1_reg, b1_reg] = regularizeCoordinate(canvas.width, canvas.height, a1, b1);
        ctx.beginPath();
        ctx.moveTo(a0_reg, b0_reg)
        ctx.lineTo(a1_reg, b1_reg);
        ctx.stroke();
    }   
}
function clearSquareMap() {
    const canvas = document.getElementById("square-map");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // initialValueSquareMap();
}

function initialValueSquareMap() {
    const canvas = document.getElementById("square-map");
    const ctx = canvas.getContext("2d");
    const [ai_reg, bi_reg] = regularizeCoordinate(canvas.width, canvas.height, ai, bi);
    ctx.fillStyle="red";
    ctx.strokeStyle="red";
    ctx.beginPath();
    ctx.fillRect(ai_reg-1, bi_reg-1, 4, 2);
    ctx.stroke();
    ctx.strokeStyle="black";
    ctx.fillStyle="black";
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}


function animate() {
    requestAnimationFrame( animate );
    render();
}

function render() {
    camera.lookAt( scene.position );
    renderer.render( scene, camera );
    scene.background = new THREE.Color( "#eae2d7" )
}
