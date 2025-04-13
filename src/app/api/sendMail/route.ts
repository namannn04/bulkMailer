import { sendMail } from "@/utils/mailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Incoming body:", body);

    const { emails, message } = body;

    if (!emails || !message) {
      console.log("Missing emails or message");
      return new Response("Missing emails or message", { status: 400 });
    }

    const emailList = emails.split(",").map((e: string) => e.trim());

    const htmlTemplate = `
      <div style="background:#0f0f0f;color:#f35b04;font-family:Courier, monospace;padding:40px;">
        <h1 style="font-size:48px;">T.P*</h1>
        <p>TERMINAL | PROTOCOL</p>
        <hr style="border-color:#f35b04;margin:20px 0;" />
        <p>${message}</p>
        <p>— tensor boy</p>
        <hr style="border-color:#f35b04;margin:20px 0;" />
        <p style="font-size:20px;"><strong>Hack the system.<br/>Or be hacked by it.</strong></p>
      </div>`;

    for (const email of emailList) {
      console.log("Sending to:", email);
      await sendMail(email, htmlTemplate);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("ERROR in /api/sendMail:", error);
    return new Response("Internal Server Error: " + error.message, { status: 500 });
  }
}
