const BigNumber = require('bignumber.js')

export const isEmptyObject = (obj) => {
    return !Object.keys(obj).length;
}

export const getMax = (arr) => {
    return BigNumber.max.apply(null, arr).toNumber() || null;
}

export const getMin = (arr) => {
    return BigNumber.min.apply(null, arr).toNumber() || null;
}

export const toNumber = (x) => {
    return BigNumber(x).toNumber();
}

export const toDecimalPlaces = (x, z, r) => {
    if (r === undefined) return BigNumber(x).decimalPlaces(z).toNumber();
    switch(r.toLowerCase()) {
        case "down":
            BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_DOWN })
            break
        case "up":
            BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_UP })
            break
        default:
            BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP })
    }
    return BigNumber(x).decimalPlaces(z).toNumber();
}

export const sum = (arr) => {
    return BigNumber.sum.apply(null, arr).toNumber();
}

export const minus = (x, y) => {
    return BigNumber(x).minus(y).toNumber();
}

export const multiply = (x, y) => {
    return BigNumber(x).multipliedBy(y).toNumber();
}

export const abs = (x) => {
    return BigNumber(x).abs().toNumber();
}

export const difference = (a, b) => {
    return BigNumber(a).minus(b).abs().toNumber()
}

export const diffPercent = (a, b, c) => {
    if (c === undefined) {
        if (a > b) c = b; else c = a
    }
    return BigNumber(a).minus(b).abs().div(c).multipliedBy(100).toNumber()
}
