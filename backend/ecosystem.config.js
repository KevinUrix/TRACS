module.exports = {
  apps: [
    {
      name: "backend",
      script: "server.js",
      node_args: "--max-old-space-size=512",
    }
  ]
}
