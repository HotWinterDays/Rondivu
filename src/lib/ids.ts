export function randomId(bytes: number) {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .toString("base64url")
    .replace(/=+$/g, "");
}

export function newPublicId() {
  return randomId(9);
}

export function newAdminKey() {
  return randomId(24);
}

export function newGuestToken() {
  return randomId(18);
}

