{
  "id": "vaporform-backend",
  "name": "Vaporform Backend",
  "description": "AI-powered development environment backend services",
  "build": {
    "docker": {
      "build_context": "."
    }
  },
  "deploy": {
    "env": "production"
  }
}