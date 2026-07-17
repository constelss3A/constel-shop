// round-abnt.ts

declare global {
  interface Number {
    roundABNT(decimalPlaces: number): number;
  }
}

Number.prototype.roundABNT = function (decimalPlaces: number): number {
  const factor = Math.pow(10, decimalPlaces);
  const shiftedValue = this.valueOf() * factor;

  const shiftedRounded = parseFloat(shiftedValue.toFixed(10));

  const intPart = Math.floor(shiftedRounded);
  const remainder = shiftedRounded - intPart;

  if (remainder > 0.5) {
    return (intPart + 1) / factor;
  } else if (remainder < 0.5) {
    return intPart / factor;
  } else {
    if (intPart % 2 === 0) {
      return intPart / factor;
    } else {
      return (intPart + 1) / factor;
    }
  }
};

export {};
