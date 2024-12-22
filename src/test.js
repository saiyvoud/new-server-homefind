const sequenceSum = (begin, end, step) => {
  if (end <= begin) return 0;
  let a = 0;
  for (let i = begin; i <= end; i += step) {
    a += i;
  }
  return a;
};

const sequenceSum2 = (begin, end, step) => {
  if (end <= begin) return 0;
  if (begin > end) return 0;
  let a = begin + sequenceSum2(begin + step, end, step);
  return a;
};

console.log("sequenceSum :>> ", sequenceSum(1, 9, 3));
console.log("sequenceSum :>> ", sequenceSum2(1, 9, 3));
