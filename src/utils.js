export function keys(object) {
  return Object.keys(object);
}

export function eachKeyValue(object, callback) {
  const objectKeys = keys(object);

  for (let i = 0; i < objectKeys.length; i += 1) {
    const key = objectKeys[i];

    callback(key, object[key]);
  }
}

export function mapValues(object, callback) {
  const objectKeys = keys(object);
  const result = {};

  for (let i = 0; i < objectKeys.length; i += 1) {
    const key = objectKeys[i];

    result[key] = callback(object[key]);
  }

  return result;
}

export function findKey(object, predicate) {
  const objectKeys = keys(object);

  for (let i = 0; i < objectKeys.length; i += 1) {
    const key = objectKeys[i];

    if (predicate(object[key])) {
      return key;
    }
  }

  return undefined;
}

export function unique(array) {
  if (array.length === 0) {
    return [];
  }

  const result = [];
  const cache = {};

  for (let i = 0; i < array.length; i += 1) {
    const value = array[i];

    if (!{}.hasOwnProperty.call(cache, value)) {
      cache[value] = true;

      result.push(value);
    }
  }

  return result;
}

export function intersection(a, b) {
  if (a.length === 0 || b.length === 0) {
    return [];
  }

  const x = a.length > b.length ? b : a;
  const y = a.length > b.length ? a : b;
  const hitsMap = {};

  for (let i = 0; i < x.length; i += 1) {
    hitsMap[x[i]] = false;
  }

  for (let i = 0; i < y.length; i += 1) {
    const hit = y[i];

    if (hitsMap[hit] === false) {
      hitsMap[hit] = true;
    }
  }

  const result = [];
  const hits = keys(hitsMap);

  for (let i = 0; i < hits.length; i += 1) {
    const hit = hits[i];

    if (hitsMap[hit]) {
      result.push(hit);
    }
  }

  return result;
}

export function isObject(value) {
  return value != null && typeof value === "object";
}

export function isFunction(value) {
  if (value == null) {
    return false;
  }

  const tag = {}.toString.call(value);

  if (tag.substring(tag.length - 9) === "Function]") {
    return true;
  }

  if (tag.substring(tag.length - 6) === "Proxy]") {
    return true;
  }

  return false;
}
