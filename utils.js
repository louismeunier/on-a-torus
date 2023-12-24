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

export async function sleep(t) {return new Promise(r => setTimeout(r, t))}