import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const actions = readFileSync("src/action/users.ts", "utf8");
const page = readFileSync(
  "src/app/(authenticated-routes)/admin/users/page.tsx",
  "utf8",
);
const sidebar = readFileSync("src/components/Sidebar.tsx", "utf8");

assert.match(actions, /fetch\(`\$\{API_URL\}\/api\/admin\/user`/);
for (const method of ["POST", "PATCH", "DELETE"]) {
  assert.match(actions, new RegExp(`method: [\"']${method}[\"']`));
}
assert.match(actions, /ROLES\.includes/);
assert.match(page, /type="password"/);
assert.match(page, /ConfirmDialog/);
assert.match(sidebar, /href: "\/admin\/users"/);

console.log("user management wiring: OK");
