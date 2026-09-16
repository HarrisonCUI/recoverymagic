function packedAssets() {
  const assets = window.__MAGIC_3D__;
  if (!assets) throw new Error("离线 3D 模型数据尚未载入");
  return assets;
}

function decodeBase64Chunks(chunks) {
  let byteLength = 0;
  const decoded = chunks.map((chunk) => {
    const value = atob(chunk);
    byteLength += value.length;
    return value;
  });
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const value of decoded) {
    for (let index = 0; index < value.length; index += 1) {
      bytes[offset + index] = value.charCodeAt(index);
    }
    offset += value.length;
  }
  return bytes.buffer;
}

export function loadJsonAsset(key, path, options) {
  if (__MINITOOL_BUILD__) {
    return Promise.resolve(packedAssets()[key]);
  }
  return fetch(path, options).then((response) => {
    if (!response.ok) throw new Error("模型数据不可用");
    return response.json();
  });
}

export function loadBufferAsset(key, path, options) {
  if (__MINITOOL_BUILD__) {
    return Promise.resolve(decodeBase64Chunks(packedAssets()[key]));
  }
  return fetch(path, options).then((response) => {
    if (!response.ok) throw new Error("模型数据不可用");
    return response.arrayBuffer();
  });
}
