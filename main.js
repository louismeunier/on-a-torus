import * as THREE from 'three';
import { torusCoordsToCartesian, sleep } from './utils';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { distanceThreeD, linspace, torus_function } from './mathing';

// import Stats from 'three/addons/libs/stats.module.js';


let camera, scene, renderer, stats;
// store trajectories
let trajectoryDrawn = false;
let trajectoryDistance = 1000;
let p = 2,
q = 3
const spheres = [],
    points = [],
    lines = []

const TORUS_CENTRAL_RADIUS = 45,
    TORUS_TUBE_RADIUS = 20;
const SLEEP_TIME = 10


init();
animate();

function init() {
    scene = new THREE.Scene();

    // camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
    // camera.position.y = 400;

    camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 0, -80, 70 );


    let torusObject;
    const ambientLight = new THREE.AmbientLight( 0xcccccc, 1 );
    scene.add( ambientLight );
    const pointLight = new THREE.PointLight( 0xffffff, 3, 0, 0 );
    camera.add( pointLight );


    scene.add( camera );

    // const map = new THREE.TextureLoader().load( 'textures/uv_grid_opengl.jpg' );
    // map.wrapS = map.wrapT = THREE.RepeatWrapping;
    // map.anisotropy = 16;
    // map.colorSpace = THREE.SRGBColorSpace;

    // const pointsMaterial = new THREE.PointsMaterial( {
    //     color: 0x0080ff,
    //     map: texture,
    //     size: 1,
    //     alphaTest: 0.5
    // } );


    // const material = new THREE.MeshPhongMaterial( { map: map, side: THREE.DoubleSide } );

    var material = new THREE.MeshPhongMaterial({
        ambient: 0x000000,
        specular: 0x999999,
        shininess: 7,
        shading: THREE.SmoothShading,
        opacity: 0.8,
        transparent: true});
      
    material.color = new THREE.Color("#0c8ce9");

    torusObject = new THREE.Mesh(new THREE.TorusGeometry( TORUS_CENTRAL_RADIUS, TORUS_TUBE_RADIUS, 30, 100 ), material);

    torusObject.position.set(0,0,0);
      
    scene.add( torusObject );

    console.log(torusObject)


    // debugging
    // const geometry_d = new THREE.SphereGeometry( TORUS_CENTRAL_RADIUS+TORUS_TUBE_RADIUS, 32, 16 ); 
    // const material_d = new THREE.MeshBasicMaterial( { color: "red", opacity:0.3, transparent: true } ); 
    // const sphere_d = new THREE.Mesh( geometry_d, material_d ); scene.add( sphere_d );
    // console.log( TORUS_CENTRAL_RADIUS+TORUS_TUBE_RADIUS)


    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );



    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 10;
    controls.maxDistance = 300;
    controls.maxPolarAngle = 2*Math.PI ;

    window.addEventListener( 'resize', onWindowResize );

    // utils
    const axesHelper = new THREE.AxesHelper( 10 );
    scene.add( axesHelper );

    document.getElementById("opacity").addEventListener("change", e => {
        torusObject.material.opacity = e.target.value
    })
    document.getElementById("toggle-mesh").addEventListener("click", e => {
        torusObject.material.wireframe=!torusObject.material.wireframe
    })

    document.getElementById("toggle-axes").addEventListener("change", e => {
       !e.target.checked ? scene.remove(axesHelper): scene.add(axesHelper)
    })

    document.getElementById("draw-trajectory").addEventListener("click", drawTrajectory)
    document.getElementById("trajectory-distance").addEventListener("change", e => {
        trajectoryDistance = e.target.value;
    })

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
}

function lockPanel(lock) {
    document.getElementById("draw-trajectory").disabled = lock
    document.getElementById("q").disabled = lock
    document.getElementById("p").disabled = lock
    document.getElementById("trajectory-distance").disabled = lock
}

async function drawTrajectory() {
    const lineMaterial = new THREE.PointsMaterial( { color: "green" } );
    const pointGeometry = new THREE.SphereGeometry( 0.2, 32, 16 ); 
    const pointMaterial = new THREE.MeshBasicMaterial( { color: "black" } ); 
    
    if (trajectoryDrawn) {
        for (let i = 0; i < trajectoryDistance; i ++) {
            scene.remove(lines[i])
            scene.remove(spheres[i])
        }
        trajectoryDrawn = false;
        document.getElementById("draw-trajectory").innerText = "Draw Trajectory"
        return
    }


    lockPanel(true)

    if (
        lines.length == 0 ||
         spheres.length == 0 || 
         trajectoryDistance != lines.length ||
         points.length == 0
    ) {
        lines.length = 0;
        spheres.length = 0;

        document.getElementById("draw-trajectory").innerText = "Drawing Trajectory"

        // Initial condition
        const [a0,b0] = [Math.PI/2, Math.PI]
        const [x0, y0, z0] = torusCoordsToCartesian(a0, b0, TORUS_CENTRAL_RADIUS, TORUS_TUBE_RADIUS)
        let [an, bn] = [a0, b0];

        for (let i = 0; i < trajectoryDistance; i++) {
            // Function Definition (make changeable)
            an = an+p*0.01
            bn = bn+q*0.01

            const [x,y,z] = torusCoordsToCartesian(an, bn, TORUS_CENTRAL_RADIUS, TORUS_TUBE_RADIUS);

            points.push(new THREE.Vector3(x,y,z))

            if (distanceThreeD(x, y, z, x0, y0, z0) < 0.2) {
                return
            }
            
            // point
            const sphere = new THREE.Mesh( pointGeometry, pointMaterial ); 
            sphere.position.set(x,y,z)
            scene.add( sphere );
            spheres.push(sphere)

            const lineGeometry = new THREE.BufferGeometry().setFromPoints( points.slice(-2) );
            const line = new THREE.Line( lineGeometry, lineMaterial );
            scene.add(line)

            lines.push(line)
            await sleep(SLEEP_TIME);
        }
        trajectoryDrawn = true;
        document.getElementById("draw-trajectory").innerText = "Clear Trajectory"
    } else {
        document.getElementById("draw-trajectory").innerText = "Clear Trajectory"
        for (let i = 0; i < trajectoryDistance; i++) {
            scene.add(spheres[i]);
            scene.add(lines[i]);
            await sleep(SLEEP_TIME);
        }
        trajectoryDrawn = true;
    }

    lockPanel(false)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

//

function animate() {
    requestAnimationFrame( animate );
    render();

}

function render() {

    camera.lookAt( scene.position );
    renderer.render( scene, camera );
    scene.background = new THREE.Color( "#eae2d7" )
}
