import EmailForm from "@/components/EmailForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-orange-600 font-mono p-8">
      <h1 className="text-5xl font-bold">T.P*</h1>
      <p className="uppercase">Terminal | Protocol</p>
      <hr className="border-orange-600 my-4" />
      <EmailForm />
    </main>
  );
}
