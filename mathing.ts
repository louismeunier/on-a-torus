// Simple linear function
export function torus_function(t, theta_1_dot, theta_2_dot) {
    return [theta_1_dot, theta_2_dot] 
}

export function linspace(min: number, max: number, num: number) {
    let i = 1;
    const space:number[] = [];
    while (i <= num) {
        space.push(min+i*Math.abs(max-min)/num);
        i++;
    }
    return space;
}

export function distanceThreeD(
    x0: number, y0: number, z0: number,
    x1: number, y1: number, z1: number
) {
    return Math.sqrt(
        (x0-x1)**2 + (y0-y1)**2 + (z0-z1)**2
    )
}

// export function torusDistance(
//     theta_01, theta_02,
//     theta_11, theta_12
// ) {

// }