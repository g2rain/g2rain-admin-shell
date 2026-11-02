/** Shared flags for deep-link / redirect-gateway restore (avoid circular imports). */

let deepLinkLeavingGateway = false

export function setDeepLinkLeavingGateway(value: boolean): void {
  deepLinkLeavingGateway = value
}

export function isDeepLinkLeavingGateway(): boolean {
  return deepLinkLeavingGateway
}
