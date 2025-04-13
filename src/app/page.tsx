import EmailForm from "@/components/EmailForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-orange-600 font-mono p-8">
      <h1 className="text-5xl font-bold">bulkMailer</h1>
      <p className="mt-2">Win thousands of hearts at once...</p>
      <hr className="border-orange-600 my-4" />
      <EmailForm />
    </main>
  );
}
