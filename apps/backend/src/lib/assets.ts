export const getPublicAssetUrl = (bucketId: string, path: string) => {
  const baseUrl = process.env.SUPABASE_URL
  if (!baseUrl) return null
  const normalized = baseUrl.replace(/\/$/, '')
  return `${normalized}/storage/v1/object/public/${bucketId}/${path}`
}
