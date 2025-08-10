
// Fetches live MCP data as a string (can be summary or raw JSON)
export async function getLiveMCPData(env: any): Promise<string> {
  const res = await fetch(env.MCP_SERVER_URL)
  if (!res.ok) return ''
  return await res.text()
}
