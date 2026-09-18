import { fetchImagesForMcp } from "./src/images.js";

const cases = [
  "http://127.0.0.1/a.jpg",
  "http://localhost/a.jpg",
  "http://0.0.0.0/a.jpg",
  "http://169.254.169.254/latest/meta-data/a.jpg",
  "http://192.168.1.10/a.jpg",
  "http://10.0.0.5/a.jpg",
  "http://172.16.5.5/a.jpg",
  "http://localtest.me/a.jpg",
  "http://[::1]/a.jpg",
  "http://[::ffff:127.0.0.1]/a.jpg",
  "http://127.0.0.1.nip.io/a.jpg",
  "http://2130706433/a.jpg",
  "http://user:pass@evil.test/a.jpg",
  "file:///C:/Windows/win.ini",
];

for (const url of cases) {
  let result;
  try {
    result = await fetchImagesForMcp([url]);
  } catch (error) {
    console.log(`${url}\n   THREW: ${error.message}`);
    continue;
  }
  const blocked = result.failures.length === 1 && result.content.length === 0;
  console.log(`${url}\n   ${blocked ? "BLOCKED" : "!!! REACHABLE !!!"} :: ${result.failures[0]?.error ?? "no failure recorded"}`);
}
