
const TokenKey = 'USER_TOKEN';

// 用户token存储
export function getToken() {
  return sessionStorage.getItem(TokenKey) || '';
}

export function setToken(token) {
  return sessionStorage.setItem(TokenKey, decodeURIComponent(token));
}

export function removeToken() {
  return sessionStorage.removeItem(TokenKey);
}
