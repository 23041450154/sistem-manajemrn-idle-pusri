import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [auth, proxy] = await Promise.all([
  readFile(new URL("../src/action/auth.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/proxy.ts", import.meta.url), "utf8"),
]);

assert.match(auth, /fetch\(`\$\{API_URL\}\/api\/auth\/me`/);
assert.match(proxy, /if \(!userCookie\)[\s\S]*?redirect\(new URL\("\/", request\.url\)\)/);
assert.doesNotMatch(proxy, /if \(token && !userCookie && !isPublicPath\)[\s\S]*?redirect\(loginUrl\)/);

console.log("SSO token-only cookie fallback: OK");
