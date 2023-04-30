import * as d3 from "d3";

function simplicity(q, Q, j, lmin, lmax, lstep) {
    const eps = Number.EPSILON * 100;
    const n = Q.length;
    const i = match(q,Q)[0];
    const v = ((lmin % lstep < eps || lstep - (lmin % lstep) < eps) && lmin <=0 && lmin >=0) ? 1 : 0;
    return 1 - (i - 1)/(n - 1) - j + v;
}

simplicity.max = (q, Q, j) => {
    const n = Q.length;
    const i = match(q, Q)[0];
    const v = 1;
    return 1 - (i - 1)/(n - 1) - j + v;
}

function coverage(dmin, dmax, lmin, lmax) {
    const range = dmax - dmin;
    return 1 - 0.5 * (Math.pow((dmax-lmax),2)+ Math.pow((dmin-lmin),2)) / Math.pow((0.1*range),2);
}

coverage.max = (dmin, dmax, span) => {
    const range = dmax - dmin;
    if(span > range) {
        const half = (span - range)/2;
        return 1 - 0.5 * (Math.pow(half,2) + Math.pow(half,2)) / Math.pow((0.1 * range),2);
    } else {
        return 1;
    }
}

function density(k, m, dmin, dmax, lmin, lmax) {
    const r = (k - 1) / (lmax - lmin);
    const rt = (m - 1) / (Math.max(lmax, dmax) - Math.min(dmin, lmin));
    return 2 - Math.max( r / rt, rt / r );
}

let legibility = (lmin, lmax, lstep) => 1;

density.max = (k,m) => {
    return k >= m ? 2 - (k-1)/(m-1) : 1;
}

function match(a,b) {
    if(Array.isArray(a)) {
        return a.map(d => b.indexOf(d)).map(d => d > -1 ? d : null);
    } else {
        const index = b.indexOf(a);
        return index > -1 ? [index + 1] : [null];
    }
}

export function ExtendedWilkinson([dmin, dmax], m, Q=[1,5,2,2.5,4,3], onlyLoose = false, w=[0.25, 0.2, 0.5, 0.05], nice=true) {
    const eps = Number.EPSILON * 100;

    if(dmin > dmax) {
        const temp = dmin;
        dmin = dmax;
        dmax = temp;
    }

    if(dmax - dmin < eps) {
        return d3.range(dmin, dmax, (dmax-dmin)/m)
    }

    const best = {score: -2};

    let j = 1;
    while(j < Infinity) {
        for(const q of Q) {
            const sm = simplicity.max(q, Q, j);
            if((w[0]*sm+w[1]+w[2]+w[3]) < best.score) {
                j = Infinity;
                break;
            }
            let k = 2;
            while(k < 1000) {
                const dm = density.max(k, m);
                if((w[0]*sm+w[1]+w[2]*dm+w[3]) < best.score) {
                    break;
                }
                const delta = (dmax-dmin)/(k+1)/j/q;
                let z = Math.ceil(Math.log10(delta));
                while(z < 1000) {
                    const step = j * q * Math.pow(10,z);
                    //const step = 60 * 60 * 1000 * 24;
                    const cm = coverage.max(dmin, dmax, step * (k-1));
                    if((w[0]*sm+w[1]*cm+w[2]*dm+w[3]) < best.score) {
                        break;
                    }
                    const min_start = Math.floor(dmax/(step))*j - (k - 1)*j;
                    const max_start = Math.ceil(dmin/(step))*j;

                    if(min_start > max_start) {
                        z += 1;
                        continue;
                    }
                    const range = d3.range(min_start, max_start);
                    for(let start = min_start; start <= max_start; start++ ) {
                        const lmin = start * (step/j);
                        const lmax = lmin + step*(k-1);
                        const lstep = step;

                        const s = simplicity(q, Q, j, lmin, lmax, lstep);
                        const c = coverage(dmin, dmax, lmin, lmax);
                        const g = density(k, m, dmin, dmax, lmin, lmax);
                        const l = legibility(lmin, lmax, lstep);

                        const score = w[0]*s + w[1]*c + w[2]*g + w[3]*l;

                        if(score > best.score && (!onlyLoose || (lmin <= dmin && lmax >= dmax))) {
                            best.lmin = lmin;
                            best.lmax = lmax;

                            if(nice) {
                                best.lmin = lmin < lmax ? Math.floor(dmin / lstep) * lstep : Math.ceil(dmin / lstep) * lstep;
                                best.lmax = lmax > lmin ? Math.ceil(dmax / lstep) * lstep : Math.floor(dmax / lstep) * lstep;
                            }

                            best.lstep = lstep;
                            best.score = score;

                        }
                    }
                    z += 1;
                }

                k += 1;
            }
        }
        j += 1;
    }
    // console.log('BEST', best);
    best.ticks = d3.range(best.lmin, best.lmax, best.lstep).concat(best.lmax);
    return best;
}