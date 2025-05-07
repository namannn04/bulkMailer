import EmailForm from "@/components/EmailForm"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-center mb-6">Bulk Email Sender</h1>
      <EmailForm />
    </main>
  )
}
