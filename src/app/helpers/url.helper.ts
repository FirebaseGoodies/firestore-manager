
export function sanitizePath(path: string) {
  return path.replace('/^[.|\/]+/', '');
}

export function concatUrl(url: string, params: string) {
  return url + (url.indexOf('?') !== -1 ? '&' : '?') + params.replace('/^[\?|&]+/', '');
}
