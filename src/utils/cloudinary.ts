export function toCloudinaryBestQualityUrl(url: string) {
  // If it's not a Cloudinary delivery URL, keep as-is.
  if (!url.includes('/image/upload/')) return url

  const parts = url.split('/image/upload/')
  if (parts.length !== 2) return url

  const [prefix, rest] = parts

  // If url already contains a transformation segment, we still inject best-quality at the beginning.
  // Cloudinary transformation format: .../image/upload/<transformations>/<public_id>
  // We inject: f_auto,q_auto:best
  const inject = 'f_auto,q_auto:best'

  // Avoid double-inject if already present.
  if (rest.startsWith(inject + '/')) return url
  return `${prefix}/image/upload/${inject}/${rest}`
}

