
// Stolen from: https://stackoverflow.com/a/58441552
export function sortObject(obj) {
  if (typeof obj !== "object" || obj === null)
    return obj;

  if (Array.isArray(obj))
    return obj.map((e) => sortObject(e)).sort();

  return Object.keys(obj).sort().reduce((sorted, k) => {
    sorted[k] = sortObject(obj[k]);
    return sorted;
  }, {});
}
