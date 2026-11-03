// src/features/anamnesis/permissions.ts
// @eligi:anamnese-front-perm
// APARENCIA apenas: decide o que a tela oferece. Quem autoriza e o back
// (src/modules/anamnesis/anamnesis.permissions.ts). Se divergir, o back recusa
// e a tela mostra a mensagem dele.

export function canSeeContent(role: string | undefined): boolean {
  return role === 'BUSINESS_OWNER' || role === 'MANAGER'
}

export function canEraseRecords(role: string | undefined): boolean {
  return role === 'BUSINESS_OWNER' || role === 'MANAGER'
}

export function canToggleModule(role: string | undefined): boolean {
  return role === 'BUSINESS_OWNER'
}

/** @eligi:anamnese-front-perm-modelos Montar e mudar fichas: dono e gerente. */
export function canManageTemplates(role: string | undefined): boolean {
  return role === 'BUSINESS_OWNER' || role === 'MANAGER'
}
