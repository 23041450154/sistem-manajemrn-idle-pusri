async function run() {
  const loginRes = await fetch("https://api.testing.naufal.me/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ npp: "100002", password: "password123" })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  
  const attRes2 = await fetch("https://api.testing.naufal.me/api/attachments?equipment_id=31", {
    headers: { "Authorization": "Bearer " + token }
  });
  console.log("Status:", attRes2.status);
  const text2 = await attRes2.text();
  console.log("attachments?eq_id=31:", text2);
}
run();
