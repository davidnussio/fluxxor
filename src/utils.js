export function keys(object) {
  return Object.keys(object);
}

export function eachKeyValue(object, callback) {
  const objectKeys = keys(object);

  while (objectKeys.length) {
    const key = objectKeys.shift();

    callback(key, object[key]);
  }
}
