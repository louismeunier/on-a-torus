// Simple linear function
export function torus_function(t, theta_1_dot, theta_2_dot) {
    return [theta_1_dot, theta_2_dot] 
}

export function linspace(min, max, num) {
    let i = 1;
    const space = [];
    while (i <= num) {
        space.push(min+i*Math.abs(max-min)/num);
        i++;
    }
    return space;
}