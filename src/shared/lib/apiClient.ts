// Re-exporta o apiClient existente para que features usem @/shared/lib/apiClient
// Quando quiser consolidar, mova a lógica para cá e delete src/lib/apiClient.ts
export { default } from '@/lib/apiClient'
