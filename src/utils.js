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

export function unique(array) {
  return array.reduce((result, value) => {
    if (result.indexOf(value) === -1) {
      result.push(value);
    }

    return result;
  }, []);
}

export function intersection(a, b) {
  const ab = [].concat(a, b);

  return ab.reduce((result, value) => {
    if (
      result.indexOf(value) === -1 &&
      a.indexOf(value) !== -1 &&
      b.indexOf(value) !== -1
    ) {
      result.push(value);
    }

    return result;
  }, []);
}

export function isObject(value) {
  return value != null && typeof value === "object";
}

export function isFunction(value) {
  return value && {}.toString.call(value).match(/.*Function\]$/);
}
