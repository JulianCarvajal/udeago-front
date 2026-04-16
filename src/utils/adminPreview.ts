const ADMIN_PREVIEW_STORAGE_KEY = 'udeago.preview.mode'
const ADMIN_PREVIEW_VALUE = 'admin'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function enableAdminPreviewMode(): void {
  if (!isBrowser()) {
    return
  }

  window.sessionStorage.setItem(ADMIN_PREVIEW_STORAGE_KEY, ADMIN_PREVIEW_VALUE)
}

export function disableAdminPreviewMode(): void {
  if (!isBrowser()) {
    return
  }

  window.sessionStorage.removeItem(ADMIN_PREVIEW_STORAGE_KEY)
}

export function isAdminPreviewMode(): boolean {
  if (!isBrowser()) {
    return false
  }

  return window.sessionStorage.getItem(ADMIN_PREVIEW_STORAGE_KEY) === ADMIN_PREVIEW_VALUE
}