"use client";
import { useState } from "react";

export default function EmailForm() {
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    setStatus("Sending...");
    const res = await fetch("/api/sendMail", {
      method: "POST",
      body: JSON.stringify({ emails, message }),
    });

    if (res.ok) setStatus("Emails sent successfully!");
    else setStatus("Failed to send emails.");
  };

  return (
    <div className="space-y-4">
      <textarea
        placeholder="Paste email addresses, comma separated"
        className="w-full p-4 bg-black border border-orange-600 rounded"
        rows={4}
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
      />
      <textarea
        placeholder="Paste your message"
        className="w-full p-4 bg-black border border-orange-600 rounded"
        rows={10}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        className="bg-orange-600 text-black font-bold px-6 py-2 rounded"
      >
        Send Emails
      </button>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
