import { redirect } from 'next/navigation'

// Redirect de /casos/[id] a /caso/[id] (la ruta correcta es singular)
export default async function CasosIdRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/caso/${id}`)
}
