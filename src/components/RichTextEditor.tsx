// src/components/RichTextEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Separate MenuBar component to keep things clean
function EditorMenuBar({ editor }: { editor: any }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b p-2 flex flex-wrap gap-1">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-200 p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}
        type="button"
      >
        <span className="font-bold">B</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-gray-200 p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}
        type="button"
      >
        <span className="italic">I</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}
        type="button"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}
        type="button"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-gray-200 p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}
        type="button"
      >
        • List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-gray-200 p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}
        type="button"
      >
        1. List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'bg-gray-200 p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}
        type="button"
      >
        Quote
      </button>
      <button
        onClick={() => {
          const url = window.prompt('URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={editor.isActive('link') ? 'bg-gray-200 p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}
        type="button"
      >
        Link
      </button>
    </div>
  );
}

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Return a placeholder during SSR to prevent hydration issues
  if (!isMounted) {
    return (
      <div 
        className={cn("border rounded-md bg-gray-50 mb-12", className)} 
        style={{ minHeight: "300px" }}
      />
    );
  }

  return (
    <div className={cn("border rounded-md overflow-hidden mb-12", className)}>
      <EditorMenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="p-4 prose max-w-none" 
        style={{ minHeight: "260px" }}
      />
    </div>
  );
}