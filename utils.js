/**
 * Converts (theta_1, theta_2) of a torus to (x, y, z)
 * @param {number} theta_1 Central angle 
 * @param {number} theta_2 Angle about the tube
 * @param {number} radius_c Central radius of torus
 * @param {number} radius_t Tube radius of torus
 */
export function torusCoordsToCartesian(
    theta_1,
    theta_2,
    radius_c,
    radius_t
) {
    const x = (radius_c + radius_t*Math.cos(theta_2))*Math.cos(theta_1)
    const y = (radius_c + radius_t*Math.cos(theta_2))*Math.sin(theta_1)
    const z = radius_t*Math.sin(theta_2);
    return [x, y, z]
}

/**
 * Take a break
 * @param {number} t time to sleep in ms
 * @returns 
 */
export async function sleep(t) {return new Promise(r => setTimeout(r, t))}

/**
 * Round all numeric values in an object to the specified number of decimal places
 * @param {object} obj 
 * @param {number} digits 
 */
export function roundObject(obj, digits) {
    console.log(obj)
    for (let key in obj) {
        if (typeof obj[key] === 'number') {
            obj[key] = obj[key].toFixed(digits)
        }
    }
    return obj;
}

/**
 * Scales up coordinate from "regular" coordinates to canvas-friendly coordinates. Flips y-axis, multiplies width and height. Takes both the canvas width and height to be 2pi
 * @param {*} canvas_width 
 * @param {*} canvas_height 
 * @param {*} x 
 * @param {*} y 
 */
export function regularizeCoordinate(canvas_width, canvas_height, x, y) {
    return [
        (x/(2*Math.PI))*canvas_width,
        (1-y/(2*Math.PI))*canvas_height
    ]
}