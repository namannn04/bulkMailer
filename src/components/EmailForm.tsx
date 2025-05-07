"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle,
  Send,
  Eye,
  Code,
  FileText,
  Lock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import juice from "juice";
import RichTextEditor from "./RichTextEditor";

export default function EmailForm() {
  const [emails, setEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlCode, setHtmlCode] = useState("");
  const [activeTab, setActiveTab] = useState("compose");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [passKey, setPassKey] = useState("");
  const [passKeyRequired, setPassKeyRequired] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // Reset pass key requirement on page load
  useEffect(() => {
    setPassKeyRequired(true);
  }, []);

  // Sync HTML code with the editor content
  useEffect(() => {
    if (htmlMode) {
      setHtmlCode(emailContent);
    }
  }, [htmlMode, emailContent]);

  // Update email content when HTML code changes
  useEffect(() => {
    if (htmlMode) {
      setEmailContent(htmlCode);
    }
  }, [htmlCode, htmlMode]);

  const validateEmails = (
    emailList: string[]
  ): { valid: boolean; invalidEmails: string[] } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails: string[] = [];

    emailList.forEach((email) => {
      if (!emailRegex.test(email)) {
        invalidEmails.push(email);
      }
    });

    return {
      valid: invalidEmails.length === 0,
      invalidEmails,
    };
  };

  const updatePreview = () => {
    if (previewRef.current) {
      // Check if the content is a complete HTML document
      const isCompleteHtml =
        emailContent.trim().toLowerCase().startsWith("<!doctype") ||
        emailContent.trim().toLowerCase().startsWith("<html");

      if (isCompleteHtml) {
        // Create an iframe to properly render the complete HTML document
        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "500px";
        iframe.style.border = "none";

        // Clear previous content
        previewRef.current.innerHTML = "";
        previewRef.current.appendChild(iframe);

        // Write the HTML to the iframe
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(emailContent);
          iframeDoc.close();
        }
      } else {
        // For partial HTML, just set innerHTML
        previewRef.current.innerHTML = emailContent;
      }
    }
  };

  const handleSend = async () => {
    // Validate pass key
    if (passKeyRequired) {
      if (!passKey.trim()) {
        setMessage("Please enter the pass key to send emails");
        setIsError(true);
        return;
      }
    }

    const emailList = emails
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter((e) => e);

    if (emailList.length === 0) {
      setMessage("Please enter at least one email address");
      setIsError(true);
      return;
    }

    const validation = validateEmails(emailList);
    if (!validation.valid) {
      setMessage(
        `Invalid email address(es): ${validation.invalidEmails.join(", ")}`
      );
      setIsError(true);
      return;
    }

    if (!subject.trim()) {
      setMessage("Please enter an email subject");
      setIsError(true);
      return;
    }

    if (!emailContent.trim()) {
      setMessage("Please enter email content");
      setIsError(true);
      return;
    }

    setIsSending(true);
    setMessage("Sending emails...");
    setIsError(false);

    try {
      // Determine if we're sending a complete HTML document or just a fragment
      let finalHtmlContent = emailContent;
      const isCompleteHtml =
        emailContent.trim().toLowerCase().startsWith("<!doctype") ||
        emailContent.trim().toLowerCase().startsWith("<html");

      // If it's not a complete HTML document, wrap it in basic HTML structure
      if (!isCompleteHtml) {
        finalHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body>
  ${emailContent}
</body>
</html>`;
      }

      // Use juice to convert CSS to inline styles (important for email clients)
      try {
        finalHtmlContent = juice(finalHtmlContent, {
          removeStyleTags: false,
          preserveImportant: true,
          preserveMediaQueries: true,
          preserveFontFaces: true,
        });
      } catch (juiceError) {
        console.warn("Could not process CSS with juice:", juiceError);
        // Continue with original HTML if juice fails
      }

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: emailList,
          subject: subject,
          htmlContent: finalHtmlContent,
          passKey: passKey,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Server returned ${res.status}: ${res.statusText}`;

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (data.success) {
        setMessage(
          `Emails sent successfully to ${emailList.length} recipient(s)!`
        );
        setIsError(false);
        setEmails("");
        setSubject("");
        setEmailContent("");
        setHtmlCode("");
        setActiveTab("compose");
        // Reset pass key and require it again for next send
        setPassKey("");
        setPassKeyRequired(true);
      } else {
        setMessage(data.message || "Failed to send emails");
        setIsError(true);
        console.error("Send error details:", data);
      }
    } catch (error: any) {
      console.error("Request failed:", error);
      let errorMessage = "Failed to send emails";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setMessage(`Error: ${errorMessage}`);
      setIsError(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "preview") {
      // Use setTimeout to ensure the DOM is ready
      setTimeout(updatePreview, 10);
    }
  };

  // Toggle between rich text editor and HTML code editor
  const toggleHtmlMode = () => {
    setHtmlMode(!htmlMode);
  };

  // Helper function to create a box with border and background color
  const insertBox = () => {
    const boxHtml = `<div style="border: 2px solid #ddd; background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px;">
      <p>Your content here. Replace this text.</p>
    </div>`;

    if (htmlMode) {
      // In HTML mode, insert at cursor position or append to end
      setHtmlCode((prev) => prev + boxHtml);
    } else {
      // In rich text mode, use Quill's API
      setEmailContent((prev) => prev + boxHtml);
    }
  };

  // Helper function to add a page border
  const addPageBorder = () => {
    const borderStyle =
      "border: 2px solid #ddd; padding: 20px; border-radius: 5px;";

    if (htmlMode) {
      // In HTML mode, wrap content in a div with border
      setHtmlCode((prev) => `<div style="${borderStyle}">${prev}</div>`);
    } else {
      // In rich text mode, add a wrapper div
      setEmailContent((prev) => `<div style="${borderStyle}">${prev}</div>`);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Rich Email Composer</span>
          <div className="flex items-center space-x-2">
            <Switch
              id="html-mode"
              checked={htmlMode}
              onCheckedChange={toggleHtmlMode}
            />
            <Label htmlFor="html-mode" className="text-sm font-normal">
              HTML Mode{" "}
              {htmlMode ? (
                <Code className="inline h-4 w-4" />
              ) : (
                <FileText className="inline h-4 w-4" />
              )}
            </Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {passKeyRequired && (
          <div className="mb-4 p-4 border rounded-md bg-yellow-50">
            <div className="flex items-start">
              <Lock className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">
                  Authentication Required
                </h3>
                <p className="text-sm text-yellow-700 mb-2">
                  Please enter the pass key to send emails
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter pass key"
                    value={passKey}
                    onChange={(e) => setPassKey(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Recipients
              </label>
              <Textarea
                placeholder="Enter recipient email addresses (comma or new line separated)"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input
                type="text"
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">
                  Email Content
                </label>
                <div className="flex gap-2">
                  <Button
                    {...{ variant: "outline", size: "sm" }}
                    onClick={insertBox}
                    type="button"
                  >
                    Insert Box
                  </Button>

                  <Button
                    {...{ variant: "outline", size: "sm" }}
                    onClick={addPageBorder}
                    type="button"
                  >
                    Add Page Border
                  </Button>
                </div>
              </div>

              {htmlMode ? (
                <Textarea
                  placeholder="Enter complete HTML code here (including DOCTYPE, html, head, and body tags if needed)..."
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  className="font-mono text-sm"
                  rows={20}
                />
              ) : (
                <div
                  className="border rounded-md"
                  style={{ minHeight: "340px" }}
                >
                  {typeof window !== "undefined" && (
                    <RichTextEditor
                      value={emailContent}
                      onChange={setEmailContent}
                    />
                  )}
                </div>
              )}

              {htmlMode ? (
                <p className="text-xs text-gray-500 mt-1">
                  HTML Mode: Write your HTML code with inline styles for email
                  compatibility.
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Rich Text Mode: Use the toolbar to format text, add images,
                  links, and more.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="bg-white rounded-md p-4 border mb-4">
              <h3 className="font-bold text-lg mb-2">
                {subject || "Email Preview"}
              </h3>
              <hr className="my-2" />
              <div
                ref={previewRef}
                className="preview-container min-h-[500px] border-0 p-0 overflow-auto"
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              Note: This preview shows how your email will appear to recipients.
              For complete HTML documents with DOCTYPE and HTML tags, the
              preview will render the exact email.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button
            {...{ variant: "outline" }}
            onClick={() => handleTabChange("preview")}
            type="button"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>

          <Button onClick={handleSend} disabled={isSending} type="button">
            {isSending ? "Sending..." : "Send Emails"}
            {isSending ? null : <Send className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded ${
              isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {isError ? (
              <AlertCircle className="mr-2 h-4 w-4 inline-block" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4 inline-block" />
            )}
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
