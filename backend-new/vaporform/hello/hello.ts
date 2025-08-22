import { api } from "encore.dev/api";

// Welcome to Vaporform!
// This is a simple "Hello World" endpoint to verify the setup.
//
// To call it, run in your terminal:
//
//	curl http://localhost:4000/hello/Vaporform
//
export const get = api(
  { expose: true, method: "GET", path: "/hello/:name" },
  async ({ name }: { name: string }): Promise<Response> => {
    const msg = `Hello ${name}! Welcome to Vaporform - AI-powered development environment.`;
    return { message: msg };
  }
);

interface Response {
  message: string;
}
