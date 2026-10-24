Do - two-person private text chat

Run locally:
1. Install Node.js 18 or newer.
2. Open a terminal in this folder and run: node server.js
3. Open http://localhost:8080 in a browser.

For people on different internet networks, deploy this folder on a public HTTPS host. The server only receives the first 10 characters of the 26-character room code and relays ciphertext. The remaining 16 characters stay in the browsers and derive the encryption key. Messages are not saved to disk; active rooms are held temporarily in server memory and cleared after everyone leaves or after inactivity.

A room allows two people. Share the full code using Copy code.