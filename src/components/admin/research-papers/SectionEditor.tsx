'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './section-editor.css';

interface SectionEditorProps {
  content: string;
  onChange: (html: string) => void;
  size?: 'small' | 'medium' | 'large';
}

export function SectionEditor({ content, onChange, size = 'large' }: SectionEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: 'section-editor-ul' } },
        orderedList: { HTMLAttributes: { class: 'section-editor-ol' } },
        heading: { levels: [2, 3] },
        bold: { HTMLAttributes: { class: 'bold' } },
        italic: { HTMLAttributes: { class: 'italic' } },
        // Disable StarterKit's underline to avoid duplicate
        strike: false,
      }),
      Underline.configure({
        HTMLAttributes: { class: 'underline' },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'section-editor-content',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const toggleMark = (markType: string) => {
    if (markType === 'bold') editor.chain().focus().toggleBold().run();
    else if (markType === 'italic') editor.chain().focus().toggleItalic().run();
    else if (markType === 'underline') editor.chain().focus().toggleUnderline().run();
  };

  const toggleHeading = (level: 1 | 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const toggleList = (type: 'bullet' | 'ordered') => {
    if (type === 'bullet') editor.chain().focus().toggleBulletList().run();
    else editor.chain().focus().toggleOrderedList().run();
  };

  return (
    <div className={`section-editor-wrapper section-editor-${size}`}>
      <div className="section-editor-toolbar">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleMark('bold')}
          className={editor.isActive('bold') ? 'bg-slate-200' : ''}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleMark('italic')}
          className={editor.isActive('italic') ? 'bg-slate-200' : ''}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleMark('underline')}
          className={editor.isActive('underline') ? 'bg-slate-200' : ''}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="section-editor-divider" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleHeading(2)}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-slate-200' : ''}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleHeading(3)}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-slate-200' : ''}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="section-editor-divider" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleList('bullet')}
          className={editor.isActive('bulletList') ? 'bg-slate-200' : ''}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleList('ordered')}
          className={editor.isActive('orderedList') ? 'bg-slate-200' : ''}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
