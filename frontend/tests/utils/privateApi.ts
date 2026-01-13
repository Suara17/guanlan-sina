// Note: the `PrivateService` is only available when generating the client
// for local environments
import { OpenAPI, PrivateService } from "../../src/client"

OpenAPI.BASE = `http://localhost:8000`

export const createUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  const username = email.split("@")[0] // Extract username from email
  return await PrivateService.createUser({
    requestBody: {
      email,
      username,
      password,
      is_verified: true,
      full_name: "Test User",
    },
  })
}
