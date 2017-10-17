export function keys(object) {
  return Object.keys(object);
}

export function eachKeyValue(object, callback) {
  keys(object).forEach(key => {
    callback(key, object[key]);
  });
}

export function mapValues(object, callback) {
  return keys(object).reduce((result, key) => {
    result[key] = callback(object[key]);

    return result;
  }, {});
}

export function findKey(object, predicate) {
  const objectKeys = keys(object);

  while (objectKeys.length) {
    const key = objectKeys.shift();

    if (predicate(object[key])) {
      return key;
    }
  }

  return undefined;
}
